import 'dotenv/config';
import supabase from './supabase.js';
import { embedAndStore } from '../services/embedding.js';

async function backfill() {
  const { data: deals } = await supabase
    .from('deals')
    .select('id, company, title, stage, industry')
    .eq('rep_id', 'rep_001');

  let count = 0;

  for (const deal of deals) {
    const { data: existing } = await supabase
      .from('interactions')
      .select('id')
      .eq('deal_id', deal.id)
      .limit(1);

    if (existing?.length > 0) continue;

    const { data: stakeholder } = await supabase
      .from('stakeholders')
      .select('name, role, primary_concern')
      .eq('deal_id', deal.id)
      .limit(1)
      .maybeSingle();

    const summary = [
      `Lead imported from CRM.`,
      stakeholder?.name ? `Contact: ${stakeholder.name}${stakeholder.role ? ` (${stakeholder.role})` : ''}.` : null,
      deal.title && deal.title !== `${deal.company} Deal` ? `Interested in: ${deal.title}.` : null,
      stakeholder?.primary_concern ? `Focus: ${stakeholder.primary_concern}.` : null,
      `Stage: ${deal.stage}.`,
      deal.industry ? `Industry: ${deal.industry}.` : null,
    ].filter(Boolean).join(' ');

    const { data: interaction } = await supabase
      .from('interactions')
      .insert({ deal_id: deal.id, type: 'note', summary, occurred_at: new Date().toISOString().slice(0, 10), source: 'manual' })
      .select('id')
      .single();

    if (interaction?.id) {
      await embedAndStore({
        source_id:   interaction.id,
        source_type: 'interaction',
        content:     `Company: ${deal.company}. Industry: ${deal.industry || 'unknown'}. ${summary}`,
        tags:        ['import', deal.industry, deal.stage].filter(Boolean),
        deal_outcome: null,
      }).catch(e => console.warn(`Embed skipped for ${deal.company}: ${e.message}`));

      console.log(`Bootstrapped: ${deal.company}`);
      count++;
    }
  }

  console.log(`\nDone. ${count} deals bootstrapped.`);
}

backfill().catch(console.error);
