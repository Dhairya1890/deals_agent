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
  primary_concern text,
  unique (deal_id, name)
);

-- Interactions
create table interactions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  type text check (type in ('email','call','meeting','note')),
  raw_content text,
  summary text,
  participants text[],
  occurred_at timestamptz default now(),
  source text check (source in ('gmail','slack','hubspot','manual')),
  source_id text unique
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
  embedding vector(768),
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

-- Similarity search function
create or replace function match_memory_chunks (
  query_embedding vector(768),
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
