import 'dotenv/config';
import supabase from '../db/supabase.js';

const GEMINI_EMBED_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent';

async function getEmbedding(text) {
  const res = await fetch(`${GEMINI_EMBED_URL}?key=${process.env.GOOGLE_AI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini embed API ${res.status}: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

export async function embedAndStore({ source_id, source_type, content, tags, deal_outcome }) {
  let embedding;
  try {
    embedding = await getEmbedding(content);
  } catch (err) {
    console.error('Gemini embedding error:', err.message);
    embedding = new Array(3072).fill(0);
  }

  const { error } = await supabase
    .from('memory_chunks')
    .insert({ source_id, source_type, content, embedding, tags, deal_outcome });

  if (error) console.error('Embed store error:', error.message);
}

export async function searchSimilar(queryText, limit = 3) {
  try {
    const embedding = await getEmbedding(queryText);

    const { data, error } = await supabase.rpc('match_memory_chunks', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit,
    });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('searchSimilar error, falling back to text search:', err.message);
    return fallbackTextSearch(queryText, limit);
  }
}

async function fallbackTextSearch(queryText, limit) {
  const words = queryText.split(/\s+/).filter(w => w.length > 3);
  let query = supabase
    .from('memory_chunks')
    .select('id, source_id, source_type, content, tags, deal_outcome');

  if (words.length > 0) {
    query = query.ilike('content', `%${words[0]}%`);
  }

  const { data } = await query.limit(limit);
  return (data || []).map(item => ({ ...item, similarity: 1.0 }));
}
