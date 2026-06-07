import supabase from '../db/supabase.js';
import { groqComplete } from './groqClient.js';
import { searchSimilar } from './embedding.js';
import { getPatternForCategory } from './patterns.js';

// ─── Load full deal context from DB ──────────────────────────────────────────

async function loadDealContext(dealId) {
  const [deal, stakeholders, interactions, objections] = await Promise.all([
    supabase.from('deals').select('*').eq('id', dealId).single(),
    supabase.from('stakeholders').select('*').eq('deal_id', dealId),
    supabase.from('interactions').select('*').eq('deal_id', dealId).order('occurred_at', { ascending: true }),
    supabase.from('objections').select('*').eq('deal_id', dealId),
  ]);

  return {
    deal: deal.data,
    stakeholders: stakeholders.data || [],
    interactions: interactions.data || [],
    objections: objections.data || [],
  };
}

// ─── Format deal context into prompt string ───────────────────────────────────

function formatDealContext({ deal, stakeholders, interactions, objections }) {
  const stakeholderSummary = stakeholders.map(s =>
    `- ${s.name} (${s.role}, ${s.seniority}): sentiment=${s.sentiment}, influence=${s.influence_score}, concern="${s.primary_concern}"`
  ).join('\n');

  const interactionSummary = interactions.map(i =>
    `- [${i.type.toUpperCase()} on ${i.occurred_at?.slice(0, 10)}]: ${i.summary}`
  ).join('\n');

  const objectionSummary = objections.map(o =>
    `- [${o.category.toUpperCase()}] "${o.text}" — resolved: ${o.was_resolved}`
  ).join('\n');

  return `
CURRENT DEAL: ${deal.company}
Stage: ${deal.stage} | Value: $${deal.value_usd?.toLocaleString()} | Industry: ${deal.industry}

STAKEHOLDERS:
${stakeholderSummary || 'None logged'}

INTERACTION HISTORY:
${interactionSummary || 'None logged'}

OPEN OBJECTIONS:
${objectionSummary || 'None logged'}
`.trim();
}

// ─── Format retrieved memory into prompt string ───────────────────────────────

function formatRetrievedMemory(similarChunks, pattern) {
  let memoryText = '';

  if (similarChunks?.length) {
    memoryText += '\nSIMILAR PAST OBJECTIONS RETRIEVED:\n';
    similarChunks.forEach((chunk, i) => {
      memoryText += `\n[${i + 1}] ${chunk.content}\n  → Deal outcome: ${chunk.deal_outcome || 'unknown'} | Tags: ${chunk.tags?.join(', ')}\n`;
    });
  }

  if (pattern) {
    memoryText += `\nBEST PRACTICE PATTERN FOR THIS CATEGORY:\n`;
    memoryText += `Category: ${pattern.objection_category} | Win rate: ${pattern.win_count}/${pattern.win_count + pattern.loss_count}\n`;
    memoryText += `Winning approach: ${pattern.winning_response}\n`;
  }

  return memoryText || 'No relevant past deals found for this query.';
}

// ─── Agent chat ───────────────────────────────────────────────────────────────

export async function agentChat({ deal_id, message, history = [] }) {
  const ctx = await loadDealContext(deal_id);
  if (!ctx.deal) throw new Error(`Deal not found: ${deal_id}`);

  const openObjections = ctx.objections.filter(o => !o.was_resolved);
  let similarChunks = [];
  let pattern = null;

  if (openObjections.length > 0) {
    const latest = openObjections[openObjections.length - 1];
    [similarChunks, pattern] = await Promise.all([
      searchSimilar(latest.text, 3),
      getPatternForCategory(latest.category),
    ]);
  } else {
    similarChunks = await searchSimilar(message, 2);
  }

  const systemPrompt = `You are a Deal Intelligence Agent — an expert AI sales advisor with access to memory of past deals.

Your job is to help sales reps make better decisions during active deals by:
1. Surfacing relevant patterns from past won and lost deals
2. Providing specific, actionable recommendations (not generic advice)
3. Identifying risks early based on stakeholder signals
4. Suggesting what to say and do next

Always ground your recommendations in the retrieved past deal data when available.
When you reference a past deal pattern, say so explicitly: "In past deals where this came up..."
Keep responses concise — 150-250 words. Use bullet points for recommendations.

${formatDealContext(ctx)}

${formatRetrievedMemory(similarChunks, pattern)}`;

  const messages = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const reply = await groqComplete({ system: systemPrompt, messages, max_tokens: 1024 });

  const retrieved_deals = similarChunks.map(chunk => ({
    content: chunk.content,
    outcome: chunk.deal_outcome,
    tags: chunk.tags,
  }));

  return { reply, retrieved_deals };
}

// ─── Pre-call briefing ────────────────────────────────────────────────────────

export async function generateBriefing({ deal_id }) {
  const ctx = await loadDealContext(deal_id);
  if (!ctx.deal) throw new Error(`Deal not found: ${deal_id}`);

  const { deal, stakeholders, objections } = ctx;
  const openObjections = objections.filter(o => !o.was_resolved);

  const patternMap = {};
  await Promise.all(
    openObjections
      .filter(o => !patternMap[o.category])
      .map(async o => { patternMap[o.category] = await getPatternForCategory(o.category); })
  );

  const daysInStage = deal.created_at
    ? Math.floor((Date.now() - new Date(deal.created_at)) / (1000 * 60 * 60 * 24))
    : null;

  const briefingPrompt = `Generate a pre-call sales briefing for this deal.

${formatDealContext(ctx)}

KNOWN WINNING APPROACHES FOR OPEN OBJECTIONS:
${openObjections.map(o => {
    const p = patternMap[o.category];
    return `- ${o.category}: ${p?.winning_response || 'No pattern found'}`;
  }).join('\n')}

Return a JSON object with this exact structure (no markdown, no backticks):
{
  "snapshot": {
    "stage": "string",
    "value_usd": number,
    "days_in_stage": number
  },
  "open_objections": ["objection text 1", "objection text 2"],
  "watch_stakeholders": [
    { "name": "string", "role": "string", "sentiment": "string", "concern": "string" }
  ],
  "talking_points": [
    "Specific talking point grounded in past deal success 1",
    "Talking point 2",
    "Talking point 3"
  ],
  "next_step": "One specific recommended next action"
}`;

  try {
    const text = await groqComplete({
      messages: [{ role: 'user', content: briefingPrompt }],
      max_tokens: 1024,
    });
    const parsed = JSON.parse(text.trim());
    parsed.snapshot.days_in_stage = daysInStage;
    return parsed;
  } catch (e) {
    console.error('Briefing error:', e.message);
    return {
      snapshot: { stage: deal.stage, value_usd: deal.value_usd, days_in_stage: daysInStage },
      open_objections: openObjections.map(o => o.text),
      watch_stakeholders: stakeholders.filter(s => ['skeptical', 'blocking'].includes(s.sentiment)),
      talking_points: ['Review open objections before the call', 'Confirm stakeholder alignment'],
      next_step: 'Prepare responses to open objections',
    };
  }
}
