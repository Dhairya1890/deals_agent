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

// Parse "From: Name <email>" or "From: email" header from raw email content
function parseSenderEmail(rawContent) {
  const fromLine = rawContent?.match(/^From:\s*(.+)/im)?.[1] || '';
  const email = fromLine.match(/<([^>]+@[^>]+)>/)?.[1]
    || fromLine.match(/([^\s<>]+@[^\s<>]+)/)?.[1]
    || null;
  const name = fromLine.match(/^(.+?)\s*</)?.[1]?.trim() || null;
  return { email, name };
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

  // Extract sender email from Gmail raw content and attach to matching stakeholder
  let senderEmail = null;
  let senderName = null;
  if (item.source === 'gmail' && item.raw_content) {
    const parsed = parseSenderEmail(item.raw_content);
    senderEmail = parsed.email;
    senderName = parsed.name;
  }

  // Upsert stakeholders (deal_id, name is unique)
  for (const s of extracted.stakeholders) {
    // Attach email if sender name matches this stakeholder
    const emailForStakeholder = senderName &&
      s.name?.toLowerCase().includes(senderName.toLowerCase())
      ? senderEmail : null;

    await supabase.from('stakeholders').upsert(
      {
        deal_id: dealId,
        ...s,
        ...(emailForStakeholder ? { email: emailForStakeholder } : {}),
      },
      { onConflict: 'deal_id,name' }
    );
  }

  // If no stakeholder was extracted but we have a sender, update any existing stakeholder by name
  if (senderEmail && senderName && extracted.stakeholders.length === 0) {
    const { data: existing } = await supabase
      .from('stakeholders')
      .select('id, name')
      .eq('deal_id', dealId)
      .ilike('name', `%${senderName.split(' ')[0]}%`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase.from('stakeholders')
        .update({ email: senderEmail })
        .eq('id', existing.id);
    }
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
