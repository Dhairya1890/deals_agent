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
    stakeholders: stakeholders.data || [],
    interactions: interactions.data || [],
    objections: objections.data || []
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
