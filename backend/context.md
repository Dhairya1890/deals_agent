# Deal Intelligence Agent — Backend Dev Context
**Your role:** Dev 2 — Backend (Node.js + Express + Supabase)
**Timeline:** 12 hours total
**Your sync points:** H4 (share API contracts with FE) and H8 (expose agent chat endpoint)

---

## What you are building

A REST API server that sits between the React frontend and the AI agent. You own:
- The database schema and all DB operations
- Every REST endpoint the frontend calls
- The embedding pipeline (chunk text → call OpenAI → store vector in Supabase)
- The memory retrieval function (cosine search in pgvector)

You do NOT build the LLM prompts or agent logic — the AI dev owns that. You expose an endpoint; they plug the agent in.

---

## Tech stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** Supabase (Postgres + pgvector)
- **ORM/Query:** Supabase JS client (`@supabase/supabase-js`)
- **Embeddings:** OpenAI API (`text-embedding-3-small`, 1536 dims)
- **Environment:** `.env` file — never hardcode keys

Required packages:
```bash
npm install express cors dotenv @supabase/supabase-js openai uuid
```

---

## Project file structure (your responsibility)

```
/backend
  /src
    /routes
      deals.js
      interactions.js
      stakeholders.js
      objections.js
      agent.js
    /services
      extraction.js     ← calls AI dev's extraction function
      embedding.js      ← chunk + embed + store
      retrieval.js      ← cosine search memory_chunks
      patterns.js       ← query patterns table
    /db
      supabase.js       ← supabase client init
      schema.sql        ← run once to set up tables
      seed.sql          ← seed data (get from AI dev at H2)
    index.js
  .env
```

---

## Database schema

Run this SQL in Supabase SQL editor to create all tables.

```sql
-- Enable vector extension
create extension if not exists vector;

-- Deals
create table deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  stage text not null check (stage in ('prospecting','discovery','proposal','negotiation','closed')),
  outcome text check (outcome in ('won','lost','ghosted')),
  value_usd integer,
  industry text,
  rep_id text default 'rep_001',
  created_at timestamptz default now(),
  closed_at timestamptz
);

-- Stakeholders
create table stakeholders (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  name text not null,
  role text,
  seniority text check (seniority in ('c_suite','vp','director','manager','ic')),
  sentiment text check (sentiment in ('positive','neutral','skeptical','blocking')),
  influence_score float default 0.5,
  primary_concern text
);

-- Interactions
create table interactions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  type text check (type in ('email','call','meeting','note')),
  raw_content text,
  summary text,
  participants text[],
  occurred_at timestamptz default now()
);

-- Objections
create table objections (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  interaction_id uuid references interactions(id),
  text text not null,
  category text check (category in ('pricing','roi','timing','competitor','champion','technical','procurement')),
  response_used text,
  outcome text check (outcome in ('resolved','stalled','persisted')),
  was_resolved boolean default false
);

-- Memory chunks (vector store)
create table memory_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null,
  source_type text check (source_type in ('objection','interaction','deal_summary')),
  content text not null,
  embedding vector(1536),
  tags text[],
  deal_outcome text,
  created_at timestamptz default now()
);

-- Patterns (synthesised cross-deal intelligence)
create table patterns (
  id uuid primary key default gen_random_uuid(),
  objection_category text not null unique,
  winning_response text,
  win_count integer default 0,
  loss_count integer default 0,
  industries text[],
  last_updated timestamptz default now()
);

-- Vector similarity index
create index on memory_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);
```

---

## Supabase client setup

`/src/db/supabase.js`:
```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default supabase;
```

`.env`:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
PORT=4000
```

---

## All API endpoints

### `index.js` — server entry
```js
import express from 'express';
import cors from 'cors';
import dealsRouter from './routes/deals.js';
import interactionsRouter from './routes/interactions.js';
import agentRouter from './routes/agent.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/deals', dealsRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/agent', agentRouter);

app.listen(process.env.PORT || 4000, () => {
  console.log('Server running on port 4000');
});
```

---

### `/src/routes/deals.js`

```js
// GET /api/deals
// Returns all deals for rep_001, ordered by created_at desc
// Response: { deals: Deal[] }

// GET /api/deals/:id
// Returns full deal context: deal + stakeholders + interactions + objections
// Response: { deal, stakeholders, interactions, objections }

// POST /api/deals
// Body: { title, company, stage, value_usd, industry }
// Creates deal with rep_id = 'rep_001'
// Response: { deal }

// PATCH /api/deals/:id
// Body: any subset of deal fields
// Response: { deal }
```

Full implementation:
```js
import { Router } from 'express';
import supabase from '../db/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('rep_id', 'rep_001')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error });
  res.json({ deals: data });
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const [deal, stakeholders, interactions, objections] = await Promise.all([
    supabase.from('deals').select('*').eq('id', id).single(),
    supabase.from('stakeholders').select('*').eq('deal_id', id),
    supabase.from('interactions').select('*').eq('deal_id', id).order('occurred_at', { ascending: true }),
    supabase.from('objections').select('*').eq('deal_id', id)
  ]);
  res.json({
    deal: deal.data,
    stakeholders: stakeholders.data,
    interactions: interactions.data,
    objections: objections.data
  });
});

router.post('/', async (req, res) => {
  const { title, company, stage, value_usd, industry } = req.body;
  const { data, error } = await supabase
    .from('deals')
    .insert({ title, company, stage, value_usd, industry, rep_id: 'rep_001' })
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  res.json({ deal: data });
});

router.patch('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('deals')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  res.json({ deal: data });
});

export default router;
```

---

### `/src/routes/interactions.js`

This is your most complex route. It:
1. Saves the raw interaction
2. Calls the AI dev's extraction service (HTTP call to their extraction endpoint OR a shared function)
3. Writes extracted stakeholders and objections to DB
4. Triggers the embedding pipeline for each objection

```js
import { Router } from 'express';
import supabase from '../db/supabase.js';
import { embedAndStore } from '../services/embedding.js';
import { extractFromText } from '../services/extraction.js';

const router = Router();

router.post('/', async (req, res) => {
  const { deal_id, type, raw_content } = req.body;

  // 1. Save raw interaction
  const { data: interaction, error: intErr } = await supabase
    .from('interactions')
    .insert({ deal_id, type, raw_content })
    .select()
    .single();
  if (intErr) return res.status(500).json({ error: intErr });

  // 2. Call extraction (AI dev's function)
  let extracted;
  try {
    extracted = await extractFromText(raw_content, deal_id);
  } catch (e) {
    // If extraction fails, still return the saved interaction
    return res.json({ interaction, extracted: null, error: 'Extraction failed' });
  }

  // 3. Update interaction with summary
  await supabase
    .from('interactions')
    .update({ summary: extracted.summary, participants: extracted.participants })
    .eq('id', interaction.id);

  // 4. Upsert stakeholders
  if (extracted.stakeholders?.length) {
    for (const s of extracted.stakeholders) {
      const { data: existing } = await supabase
        .from('stakeholders')
        .select('id')
        .eq('deal_id', deal_id)
        .eq('name', s.name)
        .single();

      if (existing) {
        await supabase
          .from('stakeholders')
          .update({ sentiment: s.sentiment, primary_concern: s.primary_concern })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('stakeholders')
          .insert({ deal_id, ...s });
      }
    }
  }

  // 5. Insert objections + trigger embedding
  const savedObjections = [];
  if (extracted.objections?.length) {
    for (const obj of extracted.objections) {
      const { data: savedObj } = await supabase
        .from('objections')
        .insert({ deal_id, interaction_id: interaction.id, ...obj })
        .select()
        .single();

      savedObjections.push(savedObj);

      // Get deal outcome for tagging
      const { data: deal } = await supabase
        .from('deals')
        .select('outcome, industry, company')
        .eq('id', deal_id)
        .single();

      // Embed and store in memory_chunks
      await embedAndStore({
        source_id: savedObj.id,
        source_type: 'objection',
        content: `Objection: ${obj.text}. Category: ${obj.category}. Response: ${obj.response_used || 'none'}. Deal: ${deal?.company}. Industry: ${deal?.industry}.`,
        tags: [obj.category, deal?.industry, deal?.outcome].filter(Boolean),
        deal_outcome: deal?.outcome || null
      });
    }
  }

  // 6. Embed interaction summary
  await embedAndStore({
    source_id: interaction.id,
    source_type: 'interaction',
    content: extracted.summary,
    tags: [type, 'interaction'],
    deal_outcome: null
  });

  res.json({
    interaction: { ...interaction, summary: extracted.summary },
    extracted: {
      summary: extracted.summary,
      stakeholders: extracted.stakeholders,
      objections: savedObjections,
      commitments: extracted.commitments
    }
  });
});

export default router;
```

---

### `/src/routes/agent.js`

This route is a thin pass-through. You expose the endpoint; the AI dev implements the logic inside the agent service.

```js
import { Router } from 'express';
import { agentChat } from '../services/agentService.js';
import { generateBriefing } from '../services/agentService.js';

const router = Router();

router.post('/chat', async (req, res) => {
  const { deal_id, message, history } = req.body;
  try {
    const result = await agentChat({ deal_id, message, history });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/briefing', async (req, res) => {
  const { deal_id } = req.body;
  try {
    const briefing = await generateBriefing({ deal_id });
    res.json(briefing);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
```

The AI dev will fill in `agentService.js`. Your job is just to make sure this file exists and the routes are wired.

---

## Embedding service

`/src/services/embedding.js`:
```js
import OpenAI from 'openai';
import supabase from '../db/supabase.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedAndStore({ source_id, source_type, content, tags, deal_outcome }) {
  // 1. Get embedding from OpenAI
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: content,
  });
  const embedding = response.data[0].embedding;

  // 2. Store in memory_chunks
  const { error } = await supabase
    .from('memory_chunks')
    .insert({ source_id, source_type, content, embedding, tags, deal_outcome });

  if (error) console.error('Embed store error:', error);
}

export async function searchSimilar(queryText, limit = 3) {
  // 1. Embed the query
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: queryText,
  });
  const embedding = response.data[0].embedding;

  // 2. Run cosine similarity search via Supabase RPC
  const { data, error } = await supabase.rpc('match_memory_chunks', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: limit
  });

  if (error) {
    console.error('Search error:', error);
    return [];
  }
  return data;
}
```

You need to create this SQL function in Supabase for the RPC call:
```sql
create or replace function match_memory_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  source_id uuid,
  source_type text,
  content text,
  tags text[],
  deal_outcome text,
  similarity float
)
language sql stable
as $$
  select
    id, source_id, source_type, content, tags, deal_outcome,
    1 - (embedding <=> query_embedding) as similarity
  from memory_chunks
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

---

## Extraction service stub

`/src/services/extraction.js` — stub this until AI dev delivers their function:
```js
// This will be filled by the AI dev.
// Stub returns mock extracted data so the pipeline doesn't break.

export async function extractFromText(rawContent, dealId) {
  // STUB — AI dev replaces this with real Claude call
  return {
    summary: "Interaction logged. Extraction pending AI dev integration.",
    participants: [],
    stakeholders: [],
    objections: [],
    commitments: []
  };
}
```

At H4, the AI dev will either give you their real implementation or an HTTP endpoint to call instead.

---

## Patterns service

`/src/services/patterns.js`:
```js
import supabase from '../db/supabase.js';

export async function getPatternForCategory(category) {
  const { data } = await supabase
    .from('patterns')
    .select('*')
    .eq('objection_category', category)
    .single();
  return data;
}

export async function getAllPatterns() {
  const { data } = await supabase
    .from('patterns')
    .select('*')
    .order('win_count', { ascending: false });
  return data;
}
```

---

## Hour-by-hour plan

| Hours | Task |
|---|---|
| H0–H1 | Supabase project setup — run schema SQL, enable pgvector, create match_memory_chunks function |
| H1–H2 | Express server scaffold, supabase client, .env, test DB connection with a simple query |
| H2–H3 | Implement deals routes (GET /deals, GET /deals/:id, POST /deals). Test with curl/Postman |
| H3–H4 | Implement interactions route stub (save to DB, return interaction). Embedding pipeline wired but extraction is stub |
| H4 sync | Share all endpoint shapes + response JSON with frontend dev |
| H4–H6 | Full embedding pipeline — embedAndStore working, match_memory_chunks RPC tested |
| H6–H8 | Wire real extraction service (from AI dev). Test full POST /interactions flow end-to-end |
| H8 sync | Confirm agent route is wired and responding |
| H8–H10 | Bug fixes, CORS issues, edge cases, ensure seed data is all embedded |
| H10–H12 | Demo stability — ensure no crashes, log errors clearly |

---

## Critical notes

- **Run the ivfflat index AFTER inserting seed data** — it needs rows to build properly. Seed first, then create index.
- **CORS** — add `app.use(cors())` before all routes or the frontend will get blocked.
- **Supabase service key vs anon key** — use the SERVICE ROLE key in backend `.env`, never the anon key. The anon key won't bypass RLS.
- **The agent route is not yours to implement** — just make it exist and forward to the service the AI dev fills in.
- If embedding calls are slow, fire them with `await` for the demo but know they can be made async later.
