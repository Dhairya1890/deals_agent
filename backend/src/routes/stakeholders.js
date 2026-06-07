import { Router } from 'express';
import supabase from '../db/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const { deal_id } = req.query;
  let query = supabase.from('stakeholders').select('*');
  if (deal_id) {
    query = query.eq('deal_id', deal_id);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error });
  res.json({ stakeholders: data });
});

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('stakeholders')
    .insert(req.body)
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  res.json({ stakeholder: data });
});

export default router;
