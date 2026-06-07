# Deal Intelligence Agent — AI/Data Dev Context
**Your role:** Dev 3 — AI/Data (Claude API + Prompts + Seed Data)
**Timeline:** 12 hours total
**Your sync points:** H2 (deliver seed SQL to backend dev), H4 (deliver extraction service), H8 (agent chat fully working)

---

## What you are building

The intelligence layer of the entire product. You own:
- The seed data (5 richly detailed past deals — this is what makes the demo work)
- The extraction prompt (raw text → structured JSON)
- The retrieval logic (cosine search + pattern lookup → ranked context)
- The advisor agent (full deal context + retrieved memory → recommendation)
- The pre-call briefing generator
- The `agentService.js` file that the backend plugs in

You are the reason the product is impressive. The frontend shows it; the backend stores it. You make it smart.

---

## Tech stack (your part)

- **LLM:** Claude (`claude-sonnet-4-20250514`) via Anthropic API
- **Embeddings:** OpenAI `text-embedding-3-small` (backend dev handles this — you just use the retrieval function they expose)
- **Language:** Node.js (same as backend) — your code lives in `/backend/src/services/`

Required packages (already in backend `package.json`):
```bash
npm install @anthropic-ai/sdk openai @supabase/supabase-js
```

---

## Your files (all inside `/backend/src/`)

```
/backend/src/
  /services/
    agentService.js      ← main file you own
    extraction.js        ← you implement this (backend stubs it)
  /db/
    seed.sql             ← you write this (deliver to backend at H2)
```

---

## Step 1 (H0–H2): Write the seed data

This is your most important job. Without rich seed data, the cross-deal memory retrieval looks empty and the demo fails.

You need **5 closed deals** with realistic objections, responses, and outcomes. At least 3 won deals and 2 lost. Vary the industries, deal sizes, and objection categories.

Here is the seed SQL — paste into Supabase SQL editor OR give the file to the backend dev:

```sql
-- =============================================
-- SEED DATA: 5 closed past deals
-- =============================================

-- Deal 1: WON — SaaS, ROI objection handled correctly
insert into deals (id, title, company, stage, outcome, value_usd, industry, rep_id, created_at, closed_at) values
('d1000000-0000-0000-0000-000000000001', 'Nexus Analytics Platform', 'Nexus Analytics', 'closed', 'won', 95000, 'SaaS', 'rep_001', '2026-01-10', '2026-02-28');

insert into stakeholders (deal_id, name, role, seniority, sentiment, influence_score, primary_concern) values
('d1000000-0000-0000-0000-000000000001', 'Linda Cho', 'CFO', 'c_suite', 'positive', 0.9, 'Needed verified ROI before board approval'),
('d1000000-0000-0000-0000-000000000001', 'Raj Mehta', 'VP Product', 'vp', 'positive', 0.75, 'Feature completeness for analytics use case');

insert into interactions (deal_id, type, summary, occurred_at) values
('d1000000-0000-0000-0000-000000000001', 'call', 'Discovery call. Linda raised ROI concerns. Raj enthusiastic about product.', '2026-01-15'),
('d1000000-0000-0000-0000-000000000001', 'email', 'Sent ROI case study from Stripe and Shopify deployments. Linda responded positively.', '2026-02-01'),
('d1000000-0000-0000-0000-000000000001', 'meeting', 'Closed. Linda approved after 90-day success clause was added to contract.', '2026-02-28');

insert into objections (deal_id, text, category, response_used, outcome, was_resolved) values
('d1000000-0000-0000-0000-000000000001', 'ROI projections are not substantiated enough for board approval', 'roi', 'Shared two customer case studies (Stripe, Shopify) showing 3.2x ROI with auditable data. Also added a 90-day success review clause with defined KPIs.', 'resolved', true),
('d1000000-0000-0000-0000-000000000001', 'Not sure if the analytics features cover our edge cases', 'technical', 'Scheduled a technical deep-dive with Raj and our solutions engineer. Demoed three of their specific edge cases live.', 'resolved', true);

-- Deal 2: WON — Fintech, Pricing objection overcome with phased pricing
insert into deals (id, title, company, stage, outcome, value_usd, industry, rep_id, created_at, closed_at) values
('d2000000-0000-0000-0000-000000000002', 'Clearwater Payments Integration', 'Clearwater Payments', 'closed', 'won', 78000, 'Fintech', 'rep_001', '2026-01-05', '2026-02-15');

insert into stakeholders (deal_id, name, role, seniority, sentiment, influence_score, primary_concern) values
('d2000000-0000-0000-0000-000000000002', 'Tom Reyes', 'CEO', 'c_suite', 'positive', 1.0, 'Annual contract too large for current runway'),
('d2000000-0000-0000-0000-000000000002', 'Dana Kim', 'Head of Finance', 'director', 'skeptical', 0.8, 'Budget allocated for only $50k this quarter');

insert into interactions (deal_id, type, summary, occurred_at) values
('d2000000-0000-0000-0000-000000000002', 'call', 'Tom loves the product but Dana flagged they cannot commit to annual $78k upfront.', '2026-01-12'),
('d2000000-0000-0000-0000-000000000002', 'email', 'Proposed phased pricing: $30k Q1, $25k Q2, $23k Q3 (10% total discount for commitment). Dana approved.', '2026-02-10'),
('d2000000-0000-0000-0000-000000000002', 'meeting', 'Contract signed with phased payment structure.', '2026-02-15');

insert into objections (deal_id, text, category, response_used, outcome, was_resolved) values
('d2000000-0000-0000-0000-000000000002', 'Annual contract price is above our current budget allocation', 'pricing', 'Offered phased payment structure across 3 quarters with a 10% total discount for commitment. Eliminated the upfront risk for finance team.', 'resolved', true),
('d2000000-0000-0000-0000-000000000002', 'Need internal approval from board before signing this size of deal', 'procurement', 'Provided a one-page executive summary designed specifically for board presentation. Offered to join the board call.', 'resolved', true);

-- Deal 3: WON — Healthcare, Timing and compliance objections
insert into deals (id, title, company, stage, outcome, value_usd, industry, rep_id, created_at, closed_at) values
('d3000000-0000-0000-0000-000000000003', 'MedCore EHR Migration', 'MedCore Health', 'closed', 'won', 210000, 'Healthcare', 'rep_001', '2025-11-01', '2026-01-20');

insert into stakeholders (deal_id, name, role, seniority, sentiment, influence_score, primary_concern) values
('d3000000-0000-0000-0000-000000000003', 'Patricia Owens', 'CIO', 'c_suite', 'positive', 0.95, 'HIPAA compliance and data residency'),
('d3000000-0000-0000-0000-000000000003', 'Dr. Samuel Ford', 'Chief Medical Officer', 'c_suite', 'neutral', 0.85, 'Clinical workflow disruption during migration');

insert into interactions (deal_id, type, summary, occurred_at) values
('d3000000-0000-0000-0000-000000000003', 'meeting', 'Patricia concerned about HIPAA. Dr. Ford worried about disruption to clinical workflows during switch.', '2025-11-15'),
('d3000000-0000-0000-0000-000000000003', 'email', 'Shared HIPAA BAA, SOC 2 Type II certification, and US-only data residency documentation.', '2025-12-01'),
('d3000000-0000-0000-0000-000000000003', 'call', 'Proposed phased migration: pilot with one department first, full rollout only after sign-off. Dr Ford agreed.', '2026-01-05'),
('d3000000-0000-0000-0000-000000000003', 'meeting', 'Contract signed. Migration starting Q2.', '2026-01-20');

insert into objections (deal_id, text, category, response_used, outcome, was_resolved) values
('d3000000-0000-0000-0000-000000000003', 'We need HIPAA compliance guarantees and data residency in the US', 'technical', 'Provided HIPAA BAA, SOC 2 Type II report, and written data residency guarantee. Legal reviewed and approved.', 'resolved', true),
('d3000000-0000-0000-0000-000000000003', 'A full migration will disrupt our clinical workflows too severely', 'timing', 'Proposed a phased rollout starting with one non-critical department as a 60-day pilot before full deployment. Dr. Ford accepted immediately.', 'resolved', true);

-- Deal 4: LOST — SaaS, Competitor with deeper integrations
insert into deals (id, title, company, stage, outcome, value_usd, industry, rep_id, created_at, closed_at) values
('d4000000-0000-0000-0000-000000000004', 'BrightPath CRM Upgrade', 'BrightPath Media', 'closed', 'lost', 55000, 'Media', 'rep_001', '2026-02-01', '2026-03-15');

insert into stakeholders (deal_id, name, role, seniority, sentiment, influence_score, primary_concern) values
('d4000000-0000-0000-0000-000000000004', 'Kevin Lam', 'VP Operations', 'vp', 'neutral', 0.8, 'Their existing stack is heavily integrated with HubSpot'),
('d4000000-0000-0000-0000-000000000004', 'Anna Brooks', 'CTO', 'c_suite', 'blocking', 0.9, 'Native HubSpot integration is non-negotiable');

insert into interactions (deal_id, type, summary, occurred_at) values
('d4000000-0000-0000-0000-000000000004', 'call', 'Anna made clear that HubSpot native integration is a hard requirement. We had only a Zapier-based workaround.', '2026-02-20'),
('d4000000-0000-0000-0000-000000000004', 'email', 'Sent Zapier integration guide. Anna said it was insufficient. Deal lost to competitor with native HubSpot integration.', '2026-03-10');

insert into objections (deal_id, text, category, response_used, outcome, was_resolved) values
('d4000000-0000-0000-0000-000000000004', 'You do not have a native HubSpot integration — we cannot use Zapier workarounds', 'competitor', 'Offered Zapier-based integration guide and promised native integration on roadmap for Q4. CTO rejected — said Q4 is too late.', 'persisted', false),
('d4000000-0000-0000-0000-000000000004', 'Competitor X already has everything we need natively', 'competitor', 'Highlighted our superior analytics and reporting vs competitor. Not enough to overcome the integration gap.', 'persisted', false);

-- Deal 5: LOST — Retail, Champion left the company mid-deal
insert into deals (id, title, company, stage, outcome, value_usd, industry, rep_id, created_at, closed_at) values
('d5000000-0000-0000-0000-000000000005', 'Vantage Retail Intelligence', 'Vantage Retail', 'closed', 'lost', 88000, 'Retail', 'rep_001', '2026-01-20', '2026-03-01');

insert into stakeholders (deal_id, name, role, seniority, sentiment, influence_score, primary_concern) values
('d5000000-0000-0000-0000-000000000005', 'Chris Dawson', 'VP Strategy', 'vp', 'positive', 0.85, 'Strong internal champion — left company in February'),
('d5000000-0000-0000-0000-000000000005', 'Helen Park', 'CFO', 'c_suite', 'skeptical', 0.9, 'New decision maker with no context on the deal');

insert into interactions (deal_id, type, summary, occurred_at) values
('d5000000-0000-0000-0000-000000000005', 'call', 'Chris Dawson driving the deal. Strong alignment. Ready to move to proposal.', '2026-01-28'),
('d5000000-0000-0000-0000-000000000005', 'email', 'Chris announced he is leaving the company. Introduced Helen Park as new contact.', '2026-02-12'),
('d5000000-0000-0000-0000-000000000005', 'call', 'Helen has no context on the deal evaluation. Asked us to restart the process. Lost momentum.', '2026-02-20'),
('d5000000-0000-0000-0000-000000000005', 'email', 'Helen decided not to proceed — new priorities under new leadership.', '2026-03-01');

insert into objections (deal_id, text, category, response_used, outcome, was_resolved) values
('d5000000-0000-0000-0000-000000000005', 'Our internal champion left — I have no context on why this was being evaluated', 'champion', 'Sent Helen a full deal summary, ROI analysis, and offer to re-run the evaluation. She did not re-engage.', 'persisted', false),
('d5000000-0000-0000-0000-000000000005', 'We have new strategic priorities under new leadership that do not include this', 'timing', 'Offered to pause and re-engage in Q2 when priorities settle. No response.', 'persisted', false);

-- =============================================
-- PATTERNS: Pre-seeded cross-deal intelligence
-- =============================================

insert into patterns (objection_category, winning_response, win_count, loss_count, industries) values
('roi', 'Share 2-3 customer case studies with auditable ROI numbers. Add a 90-day success review clause with defined KPIs to the contract. Avoid generic ROI claims — CFOs respond to verified evidence.', 2, 0, ARRAY['SaaS', 'Healthcare']),
('pricing', 'Offer phased payment structure across 2-3 quarters with a small discount for commitment. This eliminates upfront budget risk. Prepare a one-page finance summary for internal approval.', 2, 0, ARRAY['Fintech', 'SaaS']),
('timing', 'Propose a limited pilot (one department or use case) as a 60-day proof of concept before full rollout. This reduces perceived risk and gives the champion an internal win to show stakeholders.', 1, 1, ARRAY['Healthcare']),
('competitor', 'Acknowledge the gap honestly. Highlight 2-3 areas where your product is measurably better. If the gap is a hard blocker, qualify out early — do not waste cycles on an unwinnable deal.', 0, 2, ARRAY['Media']),
('champion', 'When champion leaves, immediately request an intro to the new decision maker. Send a one-page deal summary + ROI snapshot within 24 hours. Re-run a short discovery — never assume context transfers.', 0, 1, ARRAY['Retail']),
('technical', 'Schedule a dedicated technical deep-dive with a solutions engineer. Demo the specific use cases the prospect raised. Provide written documentation (compliance certs, architecture diagrams) for their records.', 2, 0, ARRAY['SaaS', 'Healthcare']),
('procurement', 'Provide an executive summary formatted for board/procurement review. Offer to join the internal presentation call. Include a mutual action plan with clear dates.', 1, 0, ARRAY['Fintech']);
```

Give this file to the backend dev at H2 so they can seed the DB while you work on extraction.

---

## Step 2 (H2–H5): Extraction service

This function takes raw interaction text and returns structured JSON. The backend calls it from `POST /interactions`.

`/backend/src/services/extraction.js`:

```js
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_SYSTEM_PROMPT = `You are a sales intelligence extraction engine.

Given a raw sales interaction (email, call transcript, or meeting notes), extract structured information in JSON format.

Return ONLY valid JSON. No markdown, no explanation, no backticks.

Your output must match this exact schema:
{
  "summary": "2-3 sentence summary of what happened in this interaction",
  "participants": ["Name 1", "Name 2"],
  "stakeholders": [
    {
      "name": "Full Name",
      "role": "Their job title",
      "seniority": "one of: c_suite | vp | director | manager | ic",
      "sentiment": "one of: positive | neutral | skeptical | blocking",
      "primary_concern": "The main concern or interest they expressed (1 sentence)"
    }
  ],
  "objections": [
    {
      "text": "Exact objection as expressed (1-2 sentences)",
      "category": "one of: pricing | roi | timing | competitor | champion | technical | procurement",
      "response_used": null
    }
  ],
  "commitments": [
    "Any commitments made by either side (e.g. 'Will send ROI case study by Friday')"
  ]
}

Rules:
- Only include stakeholders who are PROSPECTS (not your own team members)
- Only extract objections that are genuine concerns — not questions or neutral statements
- Category must be exactly one of the enum values — never free-form
- If no objections, return empty array []
- If no commitments, return empty array []
- sentiment=blocking means the person is actively opposing the deal`;

export async function extractFromText(rawContent, dealId) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Extract structured information from this sales interaction:\n\n${rawContent}`
      }
    ]
  });

  const text = message.content[0].text.trim();

  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (e) {
    console.error('Extraction parse error:', e, 'Raw:', text);
    // Fallback: return safe empty structure
    return {
      summary: rawContent.slice(0, 200),
      participants: [],
      stakeholders: [],
      objections: [],
      commitments: []
    };
  }
}
```

---

## Step 3 (H5–H9): Agent service

This is the core of the product. The backend calls functions from this file for both the chat endpoint and the briefing endpoint.

`/backend/src/services/agentService.js`:

```js
import Anthropic from '@anthropic-ai/sdk';
import supabase from '../db/supabase.js';
import { searchSimilar } from './embedding.js';
import { getPatternForCategory } from './patterns.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  // 6. Return reply + retrieved deals for frontend to display
  const retrievedDeals = retrievedMemory.similarChunks.map(chunk => ({
    content: chunk.content,
    outcome: chunk.deal_outcome,
    tags: chunk.tags
  }));

  return { reply, retrieved_deals: retrievedDeals };
}

// ─── MAIN: Pre-call briefing ──────────────────────────────────────────────────

export async function generateBriefing({ deal_id }) {
  const ctx = await loadDealContext(deal_id);
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

  // Call Claude to generate briefing
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

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: briefingPrompt }]
  });

  try {
    const parsed = JSON.parse(response.content[0].text.trim());
    parsed.snapshot.days_in_stage = daysInStage;
    return parsed;
  } catch (e) {
    console.error('Briefing parse error:', e);
    return {
      snapshot: { stage: deal.stage, value_usd: deal.value_usd, days_in_stage: daysInStage },
      open_objections: openObjections.map(o => o.text),
      watch_stakeholders: stakeholders.filter(s => ['skeptical','blocking'].includes(s.sentiment)),
      talking_points: ['Review open objections before the call', 'Confirm stakeholder alignment'],
      next_step: 'Prepare responses to open objections'
    };
  }
}
```

---

## Step 4 (H9–H10): Embed all seed data

After the backend dev has seeded the DB, you need to embed all seed objections into `memory_chunks` so retrieval actually works.

Write and run this script once:

`/backend/src/db/embedSeedData.js`:
```js
import 'dotenv/config';
import supabase from '../db/supabase.js';
import { embedAndStore } from '../services/embedding.js';

async function embedAllSeedData() {
  console.log('Embedding seed objections...');

  const { data: objections } = await supabase
    .from('objections')
    .select('*, deals(company, industry, outcome)');

  for (const obj of objections) {
    const deal = obj.deals;
    const content = `Objection: ${obj.text}. Category: ${obj.category}. Response: ${obj.response_used || 'none'}. Company: ${deal?.company}. Industry: ${deal?.industry}. Outcome: ${deal?.outcome}.`;

    await embedAndStore({
      source_id: obj.id,
      source_type: 'objection',
      content,
      tags: [obj.category, deal?.industry, deal?.outcome].filter(Boolean),
      deal_outcome: deal?.outcome || null
    });

    console.log(`Embedded: ${obj.category} objection from ${deal?.company}`);
  }

  console.log('Done embedding seed data.');
}

embedAllSeedData().catch(console.error);
```

Run with: `node src/db/embedSeedData.js`

---

## Hour-by-hour plan

| Hours | Task |
|---|---|
| H0–H2 | Write complete seed.sql (5 deals + patterns). Hand to backend dev. |
| H2–H5 | Implement and test `extractFromText` — test with real email samples, verify JSON output |
| H5–H7 | Implement `agentChat` — test with hardcoded deal context first, then wire to real DB |
| H7–H9 | Implement `generateBriefing` — test output quality, tune the prompt |
| H9–H10 | Run embedSeedData.js, test retrieval manually — verify similarity search returns relevant results |
| H10–H12 | Demo rehearsal — tune prompt outputs for the demo scenario, fix edge cases |

---

## Testing your extraction (use these samples)

**Sample 1 — ROI objection:**
```
From: Sarah Chen <s.chen@acmecorp.com>
Hi, following our last call — we've reviewed the proposal and frankly the ROI numbers feel optimistic for our use case. We'd need auditable evidence — ideally customer case studies with verified numbers — before the board would approve this budget. Can you provide that?
```
Expected: 1 objection (roi), stakeholder Sarah Chen (CFO, skeptical)

**Sample 2 — Multiple objections:**
```
Call transcript — participants: Marcus Webb (CEO), Dana Kim (Head of Finance)
Marcus: Love the product, ready to move forward.
Dana: Hold on — the annual price is way above what we budgeted for Q1. And honestly I'm not sure procurement will approve this without a security review.
Marcus: Fair point. Can we look at a phased payment structure and get your SOC 2 docs?
```
Expected: 2 objections (pricing, procurement), 2 stakeholders

---

## Key rules

- Always return valid JSON from extraction — never let the JSON parser fail silently
- The `category` field in objections MUST be one of the 7 enum values — prompt enforces this but add a validation fallback
- Extraction should be fast — if it takes > 10 seconds, something is wrong
- Retrieved memory only improves recommendations if seed data is rich — don't skimp on seed quality
- For the demo, the Acme Corp deal (deal_001 in frontend mock) must map to a real DB deal — align the demo scenario with backend dev
