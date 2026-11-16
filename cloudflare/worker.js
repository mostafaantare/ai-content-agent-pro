const corsHeaders = {
  "Access-Control-Allow-Origin": "https://mostafaantare.github.io",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};

function json(data, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders }
  });
}

function scenesFrom(script) {
  const parts = script.split(/(?<=[.!؟?])\s+|\n+/).map(x => x.trim()).filter(Boolean);
  return (parts.length ? parts : [script]).map((line, i) => ({
    scene: i + 1,
    narration: line,
    visual_prompt: `مشهد رأسي 9:16 يعبّر بصرياً عن: ${line}. بدون كتابة داخل الصورة.`,
    duration_seconds: 5
  }));
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    const url = new URL(request.url);
    if (url.pathname === "/health") return json({ ok: true, service: "ai-content-agent-api", mode: "scene-planning" });
    if (request.headers.get("Authorization") !== `Bearer ${env.APP_TOKEN || ""}` || !env.APP_TOKEN) {
      return json({ error: "Unauthorized" }, 401);
    }

    if (request.method === "POST" && url.pathname === "/jobs") {
      let body;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
      const script = String(body?.script || "").trim();
      if (script.length < 20) return json({ error: "اكتب نصاً لا يقل عن 20 حرفاً." }, 400);
      if (script.length > 20000) return json({ error: "الحد الأقصى للنص 20 ألف حرف." }, 400);
      const id = crypto.randomUUID();
      const record = {
        id,
        state: "completed",
        progress: 100,
        result: {
          status: "plan_ready_assets_not_generated",
          plan: { scenes: scenesFrom(script) },
          message: "تم تقسيم النص إلى مشاهد فقط. لم يتم توليد صور أو صوت أو فيديو."
        },
        created_at: new Date().toISOString()
      };
      await env.JOBS.put(id, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 7 });
      return json({ id, status: "queued" }, 202);
    }

    const match = url.pathname.match(/^\/jobs\/([a-f0-9-]+)$/i);
    if (request.method === "GET" && match) {
      const raw = await env.JOBS.get(match[1]);
      if (!raw) return json({ error: "Job not found" }, 404);
      const job = JSON.parse(raw);
      return json({ id: job.id, state: job.state, progress: job.progress, result: job.result });
    }
    return json({ error: "Not found" }, 404);
  }
};
