const $ = id => document.getElementById(id);
const readConfig = () => ({ api: $("api").value.trim().replace(/\/$/, ""), token: $("token").value.trim() });
let activeJob = null;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
$("start").addEventListener("click", async () => {
  const { api, token } = readConfig();
  const script = $("script").value.trim();
  if (!api || !token) return setStatus("اكتب رابط API ورمز الوصول أولاً.", true);
  if (script.length < 20) return setStatus("اكتب اسكربت لا يقل عن 20 حرفاً.", true);
  $("start").disabled = true; $("result").hidden = true;
  try {
    const response = await fetch(api + "/jobs", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ script }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "تعذر إنشاء المهمة");
    activeJob = data.id; setStatus("تم استلام الاسكربت. جاري تجهيز المشاهد…");
    for (let i = 0; i < 90; i++) {
      await sleep(2000);
      const poll = await fetch(api + "/jobs/" + encodeURIComponent(activeJob), { headers: { "Authorization": "Bearer " + token } });
      const state = await poll.json();
      if (!poll.ok) throw new Error(state.error || "تعذر متابعة المهمة");
      if (state.state === "completed") {
        $("result").textContent = JSON.stringify(state.result, null, 2); $("result").hidden = false;
        setStatus("اكتملت خطة المشاهد. لم يتم إنشاء صور أو فيديو MP4 في هذه النسخة."); return;
      }
      if (state.state === "failed") throw new Error(state.failedReason || "فشلت المهمة");
    }
    setStatus("المهمة ما زالت تعمل. رقمها: " + activeJob);
  } catch (err) { setStatus(err.message, true); }
  finally { $("start").disabled = false; }
});
function setStatus(message, error=false) { $("status").textContent = message; $("status").className = error ? "" : "status"; $("status").style.color = error ? "#b91c1c" : ""; }
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(()=>{}));
