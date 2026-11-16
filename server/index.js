import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const port = Number(process.env.PORT || 8080);
const jobs = new Map();

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

function basicScenes(script) {
  const chunks = script.split(/(?<=[.!؟?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
  const lines = chunks.length ? chunks : [script];
  return lines.map((text, i) => ({
    scene: i + 1,
    narration: text,
    visual_prompt: `مشهد رأسي 9:16 سينمائي يعبّر بصرياً عن: ${text}. بدون كتابة داخل الصورة.`,
    duration_seconds: 5
  }));
}

async function makePlan(script) {
  if (!process.env.OPENAI_API_KEY) {
    return { scenes: basicScenes(script), note: 'خطة مشاهد أولية فقط؛ لم يتم توليد وسائط أو فيديو.' };
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'قسّم النص إلى مشاهد فيديو قصيرة. أعد JSON فقط بالشكل {"scenes":[{"scene":1,"narration":"...","visual_prompt":"...","duration_seconds":5}]}. حافظ على النص ولا تخترع حقائق.' },
        { role: 'user', content: script }
      ]
    })
  });
  if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
  const data = await response.json();
  return JSON.parse(data.choices?.[0]?.message?.content || '{"scenes":[]}');
}

app.post('/jobs', (req, res) => {
  const script = String(req.body?.script || '').trim();
  if (script.length < 20) return res.status(400).json({ error: 'اكتب نصاً لا يقل عن 20 حرفاً.' });
  if (script.length > 20000) return res.status(400).json({ error: 'الحد الأقصى للنص 20 ألف حرف.' });
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  jobs.set(id, { id, state: 'active', progress: 10, result: null, failedReason: null });
  res.status(202).json({ id, status: 'queued' });
  makePlan(script).then(plan => {
    const job = jobs.get(id);
    if (job) { job.state = 'completed'; job.progress = 100; job.result = { status: 'plan_ready_assets_not_generated', plan, message: 'تم تجهيز خطة المشاهد فقط. يلزم ربط مزود صور وصوت وفيديو وخطوة مونتاج لإنتاج MP4.' }; }
  }).catch(error => {
    const job = jobs.get(id);
    if (job) { job.state = 'failed'; job.failedReason = error.message; }
  });
});

app.get('/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.listen(port, '0.0.0.0', () => console.log(`API listening on ${port}`));
