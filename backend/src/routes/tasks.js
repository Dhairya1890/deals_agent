import { Router } from 'express';
import supabase from '../db/supabase.js';
import { suggestTasks, executeTask } from '../services/taskService.js';

const router = Router();

// GET /api/tasks/:deal_id — fetch all tasks for a deal
router.get('/:deal_id', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('deal_id', req.params.deal_id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ tasks: data || [] });
});

// POST /api/tasks/:deal_id/suggest — generate fresh task suggestions
router.post('/:deal_id/suggest', async (req, res) => {
  try {
    const tasks = await suggestTasks(req.params.deal_id);
    res.json({ tasks });
  } catch (err) {
    console.error('Suggest tasks error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:task_id — select / deselect a task
router.patch('/:task_id', async (req, res) => {
  const { status } = req.body;
  if (!['selected', 'suggested'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Use selected or suggested.' });
  }
  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', req.params.task_id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ task: data });
});

// POST /api/tasks/:task_id/execute — execute one approved task
router.post('/:task_id/execute', async (req, res) => {
  try {
    const { to_email } = req.body || {};
    const result = await executeTask(req.params.task_id, { emailOverride: to_email });
    res.json(result);
  } catch (err) {
    console.error('Execute task error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
