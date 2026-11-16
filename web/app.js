const $ = id => document.getElementById(id);
$('api').value = localStorage.getItem('agent_api') || '';
$('token').value = sessionStorage.getItem('agent_token') || '';
$('start').addEventListener('click', async () => {
  const api = $('api').value.trim().replace(/\/$/, '');
  const token = $('token').value;
  const script = $('script').value.trim();
  if (!api || !token || script.length < 20) { $('status').textContent = 'أدخل رابط API ورمز الوصول واسكربت لا يقل عن 20 حرفاً.'; return; }
  localStorage.setItem('agent_api', api); sessionStorage.setItem('agent_token', token);
  $('start').disabled = true; $('status').textContent = 'جارٍ إرسال المهمة...'; $('result').hidden = true;
  try {
    const created = await fetch(api + '/jobs', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:JSON.stringify({script}) });
    const payload = await created.json(); if (!created.ok) throw new Error(payload.error || 'تعذر إنشاء المهمة');
    $('status').textContent = 'تم استلام المهمة. رقمها: ' + payload.id;
    let done = false;
    for (let i=0; i<90 && !done; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const response = await fetch(api + '/jobs/' + encodeURIComponent(payload.id), { headers:{'Authorization':'Bearer '+token} });
      const job = await response.json(); if (!response.ok) throw new Error(job.error || 'تعذر متابعة المهمة');
      $('status').textContent = 'حالة المهمة: ' + job.state;
      if (job.state === 'completed') { $('result').textContent = JSON.stringify(job.result, null, 2); $('result').hidden = false; done = true; }
      if (job.state === 'failed') throw new Error(job.failedReason || 'فشلت المهمة');
    }
    if (!done) $('status').textContent += ' — ما زالت المهمة قيد التنفيذ؛ حدّث الصفحة وتابع رقم المهمة من سجل الخادم.';
  } catch (e) { $('status').textContent = 'خطأ: ' + e.message; }
  finally { $('start').disabled = false; }
});
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{}));
