import { Router } from 'express';
import supabase from '../db/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const { deal_id } = req.query;
  let query = supabase.from('objections').select('*');
  if (deal_id) {
    query = query.eq('deal_id', deal_id);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error });
  res.json({ objections: data });
});

router.patch('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('objections')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  res.json({ objection: data });
});

export default router;
