import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { randomUUID } from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || 8080);
const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });
const queue = new Queue('content-production', { connection: redis });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'ai-content-agent-pro-api' }));
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const expected = process.env.APP_TOKEN;
  if (!expected) return res.status(503).json({ error: 'APP_TOKEN is not configured' });
  if (req.get('authorization') !== `Bearer ${expected}`) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

app.post('/jobs', async (req, res) => {
  const script = String(req.body?.script || '').trim();
  if (script.length < 20) return res.status(400).json({ error: 'اكتب نصاً لا يقل عن 20 حرفاً.' });
  if (script.length > 20000) return res.status(400).json({ error: 'الحد الأقصى للنص 20 ألف حرف.' });
  const id = randomUUID();
  await queue.add('produce', { script }, { jobId: id, attempts: 2, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: false, removeOnFail: false });
  res.status(202).json({ id, status: 'queued' });
});

app.get('/jobs/:id', async (req, res) => {
  const job = await queue.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const state = await job.getState();
  res.json({ id: job.id, state, progress: job.progress, result: job.returnvalue || null, failedReason: job.failedReason || null });
});

app.listen(port, () => console.log(`API listening on ${port}`));
