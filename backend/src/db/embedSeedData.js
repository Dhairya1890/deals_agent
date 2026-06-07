import 'dotenv/config';
import supabase from '../db/supabase.js';
import { embedAndStore } from '../services/embedding.js';

async function embedAllSeedData() {
  console.log('Embedding seed objections...');

  const { data: objections, error: objError } = await supabase
    .from('objections')
    .select('*, deals(company, industry, outcome)');

  if (objError) {
    console.error('Error fetching objections:', objError.message);
    return;
  }

  if (!objections || objections.length === 0) {
    console.log('No objections found to embed. Please run seed.sql first.');
    return;
  }

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
