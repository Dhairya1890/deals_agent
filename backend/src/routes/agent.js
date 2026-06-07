import { Router } from 'express';
import { agentChat } from '../services/agentService.js';
import { generateBriefing } from '../services/agentService.js';

const router = Router();

router.post('/chat', async (req, res) => {
  const { deal_id, message, history } = req.body;
  try {
    const result = await agentChat({ deal_id, message, history });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/briefing', async (req, res) => {
  const { deal_id } = req.body;
  try {
    const briefing = await generateBriefing({ deal_id });
    res.json(briefing);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
