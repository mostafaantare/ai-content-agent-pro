import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });

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

const worker = new Worker('content-production', async job => {
  await job.updateProgress(10);
  const plan = await makePlan(job.data.script);
  await job.updateProgress(100);
  return {
    status: 'plan_ready_assets_not_generated',
    plan,
    message: 'تم تجهيز خطة المشاهد فقط. يلزم ربط مزود صور وصوت وفيديو وخطوة مونتاج لإنتاج MP4.'
  };
}, { connection, concurrency: 2 });

worker.on('completed', job => console.log('Plan ready:', job.id));
worker.on('failed', (job, err) => console.error('Job failed:', job?.id, err));
console.log('Content worker started');
