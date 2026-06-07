import Anthropic from '@anthropic-ai/sdk';
import supabase from '../db/supabase.js';
import { searchSimilar } from './embedding.js';
import { getPatternForCategory } from './patterns.js';

const isApiKeyConfigured = process.env.ANTHROPIC_API_KEY && 
  process.env.ANTHROPIC_API_KEY !== 'YOUR_ANTHROPIC_API_KEY_HERE' && 
  process.env.ANTHROPIC_API_KEY.trim() !== '';

let client;
if (isApiKeyConfigured) {
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ─── Helper: load full deal context from DB ───────────────────────────────────

async function loadDealContext(dealId) {
  const [deal, stakeholders, interactions, objections] = await Promise.all([
    supabase.from('deals').select('*').eq('id', dealId).single(),
    supabase.from('stakeholders').select('*').eq('deal_id', dealId),
    supabase.from('interactions').select('*').eq('deal_id', dealId).order('occurred_at', { ascending: true }),
    supabase.from('objections').select('*').eq('deal_id', dealId)
  ]);

  return {
    deal: deal.data,
    stakeholders: stakeholders.data || [],
    interactions: interactions.data || [],
    objections: objections.data || []
  };
}

// ─── Helper: retrieve relevant past deals for an objection ───────────────────

async function retrieveMemoryForObjection(objectionText, category) {
  // 1. Vector similarity search
  const similarChunks = await searchSimilar(objectionText, 3);

  // 2. Pattern table lookup for category
  const pattern = await getPatternForCategory(category);

  return { similarChunks, pattern };
}

// ─── Helper: format deal context into a prompt string ────────────────────────

function formatDealContext(ctx) {
  const { deal, stakeholders, interactions, objections } = ctx;

  const stakeholderSummary = stakeholders.map(s =>
    `- ${s.name} (${s.role}, ${s.seniority}): sentiment=${s.sentiment}, influence=${s.influence_score}, concern="${s.primary_concern}"`
  ).join('\n');

  const interactionSummary = interactions.map(i =>
    `- [${i.type.toUpperCase()} on ${i.occurred_at?.slice(0,10)}]: ${i.summary}`
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

// ─── Helper: format retrieved memory into a prompt string ────────────────────

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

// ─── MAIN: Agent chat ─────────────────────────────────────────────────────────

export async function agentChat({ deal_id, message, history = [] }) {
  // 1. Load deal context
  const ctx = await loadDealContext(deal_id);
  if (!ctx.deal) {
    throw new Error(`Deal not found with ID ${deal_id}`);
  }

  // 2. Retrieve memory — check if message is about an objection
  const openObjections = ctx.objections.filter(o => !o.was_resolved);
  let retrievedMemory = { similarChunks: [], pattern: null };

  if (openObjections.length > 0) {
    // Retrieve memory for the most recently raised objection
    const latestObjection = openObjections[openObjections.length - 1];
    retrievedMemory = await retrieveMemoryForObjection(
      latestObjection.text,
      latestObjection.category
    );
  } else {
    // General retrieval based on the rep's message
    retrievedMemory.similarChunks = await searchSimilar(message, 2);
  }

  const retrievedDeals = retrievedMemory.similarChunks.map(chunk => ({
    content: chunk.content,
    outcome: chunk.deal_outcome,
    tags: chunk.tags
  }));

  if (isApiKeyConfigured) {
    try {
      // 3. Build system prompt
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

${formatRetrievedMemory(retrievedMemory.similarChunks, retrievedMemory.pattern)}`;

      // 4. Build message history for Claude
      const messages = [
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ];

      // 5. Call Claude
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages
      });

      const reply = response.content[0].text;
      return { reply, retrieved_deals: retrievedDeals };
    } catch (e) {
      console.error('Claude Chat error:', e);
      // Fall through to mock logic on failure
    }
  }

  // MOCK LOGIC FOR AGENT CHAT (BASED ON RETRIEVED MEMORY)
  console.warn("Using mock fallback agent chat response.");
  
  let reply = "";
  const company = ctx.deal.company;
  
  if (openObjections.length > 0) {
    const latestObjection = openObjections[openObjections.length - 1];
    const category = latestObjection.category;
    const pattern = retrievedMemory.pattern;
    
    reply = `### Deal Advisor Recommendation for ${company}\n\n`;
    reply += `I detected an open **${category.toUpperCase()}** objection: *"${latestObjection.text}"*\n\n`;
    
    if (pattern) {
      reply += `In past won deals where this objection category arose, our most successful approach was:\n`;
      reply += `> *${pattern.winning_response}*\n\n`;
      reply += `**Actionable Recommendations:**\n`;
      
      if (category === 'roi') {
        reply += `- **Share verified case studies**: Specifically, present customer data showing measurable ROI (similar to how we shared the Stripe/Shopify case studies in the Nexus Analytics deal).\n`;
        reply += `- **Add a success clause**: Offer a 90-day review period with mutually defined KPIs. This reduces upfront concern for the CFO.\n`;
      } else if (category === 'pricing') {
        reply += `- **Propose phased pricing**: Break the annual price into quarterly payments (e.g. $30k Q1, $25k Q2, $23k Q3) with a small discount for commitment to eliminate immediate budget constraints.\n`;
        reply += `- **Finance executive summary**: Draft a simple 1-page business case for their Head of Finance.\n`;
      } else if (category === 'timing') {
        reply += `- **Start with a pilot**: Propose a non-critical department pilot first (60-day POC) to lower operational transition risks.\n`;
      } else {
        reply += `- **Reference best practices**: Tailor your pitch to directly address this blocker using the pre-seeded strategies.\n`;
      }
    } else {
      reply += `I recommend researching past deals in the same industry to see how similar blockers were resolved. Direct the conversation towards a technical review or pilot phase to mitigate initial friction.`;
    }
  } else {
    // General chat matching
    reply = `Hello! I have analyzed the context for the **${company}** deal. Currently, there are no open, unresolved objections logged. \n\n`;
    reply += `**Here is what I recommend doing next:**\n`;
    reply += `- **Verify stakeholder sentiment**: Check if decision makers are fully aligned or if any quiet objections exist.\n`;
    reply += `- **Log recent interactions**: Update the log with emails or meeting summaries to keep this briefing up to date.\n\n`;
    reply += `Feel free to ask me questions like *"How should I handle our competitor?"* or *"What was our winning approach for ROI issues?"*`;
  }

  return { reply, retrieved_deals: retrievedDeals };
}

// ─── MAIN: Pre-call briefing ──────────────────────────────────────────────────

export async function generateBriefing({ deal_id }) {
  const ctx = await loadDealContext(deal_id);
  if (!ctx.deal) {
    throw new Error(`Deal not found with ID ${deal_id}`);
  }
  const { deal, stakeholders, interactions, objections } = ctx;

  // Get patterns for all open objection categories
  const openObjections = objections.filter(o => !o.was_resolved);
  const patternMap = {};
  for (const obj of openObjections) {
    if (!patternMap[obj.category]) {
      patternMap[obj.category] = await getPatternForCategory(obj.category);
    }
  }

  // Days in current stage
  const daysInStage = deal.created_at
    ? Math.floor((Date.now() - new Date(deal.created_at)) / (1000 * 60 * 60 * 24))
    : null;

  if (isApiKeyConfigured) {
    try {
      // Call Claude to generate briefing
      const briefingPrompt = `Generate a pre-call sales briefing for this deal.

${formatDealContext(ctx)}

KNOWN WINNING APPROACHES FOR OPEN OBJECTIONS:
${openObjections.map(o => {
  const p = patternMap[o.category];
  return `- ${o.category}: ${p?.winning_response || 'No pattern found'}`;
}).join('\n')}

Return a JSON object with this exact structure (no markdown, no explanation, no backticks):
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

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: briefingPrompt }]
      });

      const parsed = JSON.parse(response.content[0].text.trim());
      parsed.snapshot.days_in_stage = daysInStage;
      return parsed;
    } catch (e) {
      console.error('Claude Briefing error:', e);
      // Fall through to mock logic on failure
    }
  }

  // MOCK BRIEFING GENERATOR
  console.warn("Using mock fallback briefing generator.");
  
  const talkingPoints = [];
  openObjections.forEach(obj => {
    const p = patternMap[obj.category];
    if (p) {
      talkingPoints.push(`Address the ${obj.category} objection by introducing: "${p.winning_response.slice(0, 100)}..."`);
    }
  });

  if (talkingPoints.length === 0) {
    talkingPoints.push("Confirm alignment across key stakeholders (C-suite and VP level).");
    talkingPoints.push("Gather details on technical integrations or timeline blockers.");
  }
  
  talkingPoints.push("Reference success metrics from similar industry deployments.");

  const watchList = stakeholders
    .filter(s => ['skeptical','blocking'].includes(s.sentiment))
    .map(s => ({
      name: s.name,
      role: s.role,
      sentiment: s.sentiment,
      concern: s.primary_concern || "General objection blocker"
    }));

  if (watchList.length === 0 && stakeholders.length > 0) {
    // Default watch the stakeholder with lowest sentiment or highest influence
    const sorted = [...stakeholders].sort((a,b) => b.influence_score - a.influence_score);
    watchList.push({
      name: sorted[0].name,
      role: sorted[0].role,
      sentiment: sorted[0].sentiment || 'neutral',
      concern: sorted[0].primary_concern || "Check project validation criteria"
    });
  }

  return {
    snapshot: {
      stage: deal.stage,
      value_usd: deal.value_usd,
      days_in_stage: daysInStage
    },
    open_objections: openObjections.map(o => o.text),
    watch_stakeholders: watchList,
    talking_points: talkingPoints,
    next_step: openObjections.length > 0 
      ? `Schedule a meeting to propose solution for the ${openObjections[0].category} issue.`
      : "Confirm next steps and timeline for contract approval."
  };
}
