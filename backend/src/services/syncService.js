import supabase from '../db/supabase.js';
import { fetchGmailThreads } from '../integrations/gmail.js';
import { fetchSlackMessages } from '../integrations/slack.js';
import { extractFromText } from './extraction.js';
import { embedAndStore } from './embedding.js';

async function getAlreadySyncedIds(dealId) {
  const { data } = await supabase
    .from('interactions')
    .select('source_id')
    .eq('deal_id', dealId)
    .not('source_id', 'is', null);
  return new Set((data || []).map(r => r.source_id));
}

async function saveExtractedInteraction(dealId, deal, item, extracted) {
  // Save interaction
  await supabase.from('interactions').insert({
    deal_id:     dealId,
    type:        item.type,
    summary:     extracted.summary,
    occurred_at: item.occurred_at,
    source:      item.source,
    source_id:   item.source_id,
    raw_content: item.raw_content,
  });

  // Upsert stakeholders (deal_id, name is unique)
  for (const s of extracted.stakeholders) {
    await supabase.from('stakeholders').upsert(
      { deal_id: dealId, ...s },
      { onConflict: 'deal_id,name' }
    );
  }

  // Insert objections and embed each one
  for (const objection of extracted.objections) {
    const { data: obj } = await supabase
      .from('objections')
      .insert({ deal_id: dealId, ...objection, was_resolved: false })
      .select('id')
      .single();

    if (obj?.id) {
      await embedAndStore({
        source_id:   obj.id,
        source_type: 'objection',
        content:     `Objection: ${objection.text}. Category: ${objection.category}. Response: none. Company: ${deal.company}. Industry: ${deal.industry}.`,
        tags:        [objection.category, deal.industry].filter(Boolean),
        deal_outcome: null,
      });
    }
  }
}

export async function syncDeal(dealId) {
  const { data: deal, error } = await supabase
    .from('deals')
    .select('id, company, industry')
    .eq('id', dealId)
    .single();

  if (error || !deal) throw new Error(`Deal not found: ${dealId}`);

  const alreadySynced = await getAlreadySyncedIds(dealId);

  const [gmailItems, slackItems] = await Promise.all([
    fetchGmailThreads({ companyName: deal.company }),
    fetchSlackMessages({ companyName: deal.company }),
  ]);

  const newItems = [...gmailItems, ...slackItems]
    .filter(item => item.source_id && !alreadySynced.has(item.source_id));

  const counts = { gmail: 0, slack: 0 };
  let synced = 0;

  for (const item of newItems) {
    try {
      const extracted = await extractFromText(item.raw_content);
      await saveExtractedInteraction(dealId, deal, item, extracted);
      counts[item.source] = (counts[item.source] || 0) + 1;
      synced++;
    } catch (err) {
      console.error(`Sync failed [${item.source}:${item.source_id}]:`, err.message);
    }
  }

  return { synced, by_source: counts };
}
