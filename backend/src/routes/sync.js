import { Router } from 'express';
import { syncDeal } from '../services/syncService.js';

const router = Router();

router.post('/:deal_id', async (req, res) => {
  const { deal_id } = req.params;
  try {
    const result = await syncDeal(deal_id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
