import OpenAI from 'openai';
import supabase from '../db/supabase.js';

const isApiKeyConfigured = process.env.OPENAI_API_KEY && 
  process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE' && 
  process.env.OPENAI_API_KEY.trim() !== '';

let openai;
if (isApiKeyConfigured) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function embedAndStore({ source_id, source_type, content, tags, deal_outcome }) {
  let embedding = null;

  if (isApiKeyConfigured) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: content,
      });
      embedding = response.data[0].embedding;
    } catch (err) {
      console.error('OpenAI embeddings create error:', err.message);
    }
  }

  // Fallback embedding: 1536-dimensional zero vector
  if (!embedding) {
    console.warn("Using zero-vector fallback embedding for source:", source_id);
    embedding = new Array(1536).fill(0);
  }

  const { error } = await supabase
    .from('memory_chunks')
    .insert({ source_id, source_type, content, embedding, tags, deal_outcome });

  if (error) console.error('Embed store error:', error);
}

export async function searchSimilar(queryText, limit = 3) {
  if (isApiKeyConfigured) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: queryText,
      });
      const embedding = response.data[0].embedding;

      const { data, error } = await supabase.rpc('match_memory_chunks', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: limit
      });

      if (error) {
        console.error('Search RPC error:', error);
        // Fall back to text search if RPC fails (e.g. extension/function missing)
        return await fallbackTextSearch(queryText, limit);
      }
      return data || [];
    } catch (err) {
      console.error('Search similar error (falling back to text search):', err.message);
    }
  }

  return await fallbackTextSearch(queryText, limit);
}

async function fallbackTextSearch(queryText, limit = 3) {
  console.warn("Using fallback text matching for similar search");
  
  // Try to find matching words
  const words = queryText.split(/\s+/).filter(w => w.length > 3).map(w => `%${w}%`);
  
  let query = supabase
    .from('memory_chunks')
    .select('id, source_id, source_type, content, tags, deal_outcome');
    
  if (words.length > 0) {
    query = query.ilike('content', words[0]);
  }
  
  const { data, error } = await query.limit(limit);

  if (error) {
    // If that fails, just return first N rows
    const { data: allData } = await supabase
      .from('memory_chunks')
      .select('id, source_id, source_type, content, tags, deal_outcome')
      .limit(limit);
    return (allData || []).map(item => ({ ...item, similarity: 1.0 }));
  }
  
  return (data || []).map(item => ({ ...item, similarity: 1.0 }));
}
