import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dealsRouter from './routes/deals.js';
import interactionsRouter from './routes/interactions.js';
import agentRouter from './routes/agent.js';
import syncRouter from './routes/sync.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/deals', dealsRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/agent', agentRouter);
app.use('/api/sync', syncRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
