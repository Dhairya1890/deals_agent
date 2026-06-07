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
    return res.json({ interaction, extracted: null, error: 'Extraction failed: ' + e.message });
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
        .maybeSingle(); // Use maybeSingle instead of single to avoid throwing errors if not found

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
      try {
        await embedAndStore({
          source_id: savedObj.id,
          source_type: 'objection',
          content: `Objection: ${obj.text}. Category: ${obj.category}. Response: ${obj.response_used || 'none'}. Deal: ${deal?.company}. Industry: ${deal?.industry}.`,
          tags: [obj.category, deal?.industry, deal?.outcome].filter(Boolean),
          deal_outcome: deal?.outcome || null
        });
      } catch (err) {
        console.error("Embedding failure for objection:", err.message);
      }
    }
  }

  // 6. Embed interaction summary
  try {
    await embedAndStore({
      source_id: interaction.id,
      source_type: 'interaction',
      content: extracted.summary,
      tags: [type, 'interaction'],
      deal_outcome: null
    });
  } catch (err) {
    console.error("Embedding failure for interaction summary:", err.message);
  }

  res.json({
    interaction: { ...interaction, summary: extracted.summary, participants: extracted.participants },
    extracted: {
      summary: extracted.summary,
      stakeholders: extracted.stakeholders,
      objections: savedObjections,
      commitments: extracted.commitments
    }
  });
});

export default router;
