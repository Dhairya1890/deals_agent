import supabase from '../db/supabase.js';
import { groqComplete } from './groqClient.js';
import { sendEmail } from '../integrations/gmail.js';

// ─── Load deal context (reused from agentService) ────────────────────────────

async function loadDealContext(dealId) {
  const [deal, stakeholders, interactions, objections] = await Promise.all([
    supabase.from('deals').select('*').eq('id', dealId).single(),
    supabase.from('stakeholders').select('*').eq('deal_id', dealId),
    supabase.from('interactions').select('*').eq('deal_id', dealId).order('occurred_at', { ascending: false }).limit(10),
    supabase.from('objections').select('*').eq('deal_id', dealId).eq('was_resolved', false),
  ]);
  return {
    deal: deal.data,
    stakeholders: stakeholders.data || [],
    interactions: interactions.data || [],
    objections: objections.data || [],
  };
}

function formatContextForTasks({ deal, stakeholders, interactions, objections }) {
  const s = stakeholders.map(s =>
    `- ${s.name} (${s.role}, ${s.seniority}): sentiment=${s.sentiment}, concern="${s.primary_concern}"`
  ).join('\n') || 'None';

  const i = interactions.slice(0, 5).map(i =>
    `- [${i.type?.toUpperCase()} ${i.occurred_at?.slice(0,10)}]: ${i.summary}`
  ).join('\n') || 'None';

  const o = objections.map(o =>
    `- [${o.category?.toUpperCase()}] ${o.text}`
  ).join('\n') || 'None';

  return `DEAL: ${deal.company} | Stage: ${deal.stage} | Value: $${deal.value_usd?.toLocaleString()} | Industry: ${deal.industry}
STAKEHOLDERS:\n${s}
RECENT INTERACTIONS:\n${i}
OPEN OBJECTIONS:\n${o}`;
}

// ─── Suggest tasks ────────────────────────────────────────────────────────────

const SUGGEST_SYSTEM = `You are a sales execution agent. Given a deal's context, generate 3-5 specific, high-impact next actions a sales rep should take RIGHT NOW.

Each task must be concrete and immediately executable — not generic advice.

Return ONLY a valid JSON array. No markdown, no explanation, no backticks.

Schema for each task object:
{
  "title": "Short action title (max 8 words)",
  "description": "Why this task matters now, grounded in the deal data (2-3 sentences)",
  "type": "one of: email_client | email_team | email_internal | draft_document",
  "priority": "one of: high | medium | low",
  "payload": {
    "to_name": "recipient full name",
    "to_role": "recipient job title or team name",
    "to_email": "email if known from stakeholder data, else null",
    "subject": "suggested email subject line",
    "context": "key points the email must address (2-3 bullet points as a string)"
  }
}

Rules:
- email_client: sending to a prospect/stakeholder at the company
- email_team: sending to an internal sales team member
- email_internal: sending to manager, legal, finance, or another department
- draft_document: creating a proposal, case study, or summary document
- Prioritize tasks that address open objections or blocked stakeholders
- If a stakeholder is skeptical or blocking, that should be task #1`;

export async function suggestTasks(dealId) {
  const ctx = await loadDealContext(dealId);
  if (!ctx.deal) throw new Error(`Deal not found: ${dealId}`);

  // Clear old suggestions before generating new ones
  await supabase.from('tasks')
    .delete()
    .eq('deal_id', dealId)
    .eq('status', 'suggested');

  const prompt = `Generate the optimal next tasks for this deal:\n\n${formatContextForTasks(ctx)}`;

  const text = await groqComplete({
    system: SUGGEST_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
  });

  let parsed;
  try {
    parsed = JSON.parse(text.trim());
    if (!Array.isArray(parsed)) parsed = parsed.tasks || [];
  } catch (e) {
    console.error('Task suggestion parse error:', e.message);
    return [];
  }

  const toInsert = parsed.slice(0, 5).map(t => ({
    deal_id: dealId,
    title:   t.title,
    description: t.description,
    type:    t.type,
    priority: t.priority || 'medium',
    status:  'suggested',
    payload: t.payload || {},
  }));

  const { data, error } = await supabase.from('tasks').insert(toInsert).select();
  if (error) throw error;
  return data;
}

// ─── Execute a single task ────────────────────────────────────────────────────

const DRAFT_SYSTEM = `You are an expert sales email writer. Write a professional, personalized sales email based on the context provided.

Rules:
- Tone: warm, consultative, never pushy
- Length: 150-250 words
- No generic openers like "I hope this email finds you well"
- Reference specific deal details (company name, their concern, relevant past deals)
- End with a single clear call-to-action
- Return ONLY the email body — no subject line, no headers`;

export async function executeTask(taskId, options = {}) {
  const { data: task, error } = await supabase
    .from('tasks').select('*, deals(company, industry, stage)').eq('id', taskId).single();
  if (error || !task) throw new Error(`Task not found: ${taskId}`);
  if (!['suggested', 'selected'].includes(task.status)) {
    throw new Error(`Task already ${task.status}`);
  }

  // Mark as executing
  await supabase.from('tasks').update({ status: 'executing' }).eq('id', taskId);

  try {
    const ctx = await loadDealContext(task.deal_id);
    const payload = task.payload || {};

    let result;

    if (task.type === 'draft_document') {
      result = await executeDraftDocument(task, ctx);
    } else {
      result = await executeEmailTask(task, ctx, payload, options.emailOverride);
    }

    await supabase.from('tasks').update({
      status: 'completed',
      result,
      executed_at: new Date().toISOString(),
    }).eq('id', taskId);

    // Log as interaction in deal timeline
    await supabase.from('interactions').insert({
      deal_id:     task.deal_id,
      type:        task.type.startsWith('email') ? 'email' : 'note',
      summary:     `[Agent Task] ${task.title}. ${result}`,
      occurred_at: new Date().toISOString().slice(0, 10),
      source:      'manual',
    });

    return { success: true, result };

  } catch (err) {
    await supabase.from('tasks').update({
      status: 'failed',
      result: err.message,
    }).eq('id', taskId);
    throw err;
  }
}

async function executeEmailTask(task, ctx, payload, emailOverride) {
  const { deal, stakeholders } = ctx;

  // Priority: manual override → payload → stakeholder DB lookup
  let toEmail = emailOverride || payload.to_email;
  if (!toEmail && payload.to_name) {
    const match = stakeholders.find(s =>
      s.name?.toLowerCase().includes(payload.to_name?.toLowerCase())
    );
    toEmail = match?.email || null;
  }

  // Draft email content via Groq
  const draftPrompt = `Write a sales email for this context:

DEAL: ${deal.company} | Stage: ${deal.stage} | Industry: ${deal.industry}
TO: ${payload.to_name} (${payload.to_role})
SUBJECT: ${payload.subject}
KEY POINTS TO ADDRESS: ${payload.context}

DEAL CONTEXT:
${formatContextForTasks(ctx)}`;

  const emailBody = await groqComplete({
    system: DRAFT_SYSTEM,
    messages: [{ role: 'user', content: draftPrompt }],
    max_tokens: 512,
  });

  if (toEmail) {
    // Actually send the email
    const sent = await sendEmail({
      to: toEmail,
      subject: payload.subject,
      body: emailBody,
    });
    return `Email sent to ${payload.to_name} <${toEmail}>. Subject: "${payload.subject}". Gmail message ID: ${sent.messageId}.`;
  } else {
    // No email address — save draft as result
    return `Email drafted for ${payload.to_name} (no email address on file). Draft:\n\nSubject: ${payload.subject}\n\n${emailBody}`;
  }
}

async function executeDraftDocument(task, ctx) {
  const { deal } = ctx;

  const docPrompt = `Create a concise sales document based on this context:

TASK: ${task.title}
CONTEXT: ${task.description}

DEAL DATA:
${formatContextForTasks(ctx)}

Write a professional document (proposal section, case study summary, or executive brief — whichever fits the task). 300-500 words. Use clear headings.`;

  const doc = await groqComplete({
    system: 'You are an expert sales document writer. Return only the document content, no meta-commentary.',
    messages: [{ role: 'user', content: docPrompt }],
    max_tokens: 768,
  });

  return `Document drafted for ${deal.company}:\n\n${doc}`;
}
