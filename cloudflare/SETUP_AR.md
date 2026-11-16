# إعداد محرك Cloudflare API

أضفت للمستودع Worker API مبدئياً لربط واجهة الهاتف. النسخة الحالية تستقبل الاسكربت وتقسمه إلى مشاهد وتحفظ الخطة في KV لمدة 7 أيام. **لا تولّد صوراً أو صوتاً أو فيديو ولا تنتج MP4 بعد.**

## المطلوب مرة واحدة في Cloudflare
1. افتح Cloudflare Dashboard ثم Workers & Pages -> KV.
2. أنشئ KV namespace باسم `AI_CONTENT_AGENT_JOBS`.
3. انسخ Namespace ID، وافتح ملف `wrangler.toml` في GitHub، واستبدل `REPLACE_WITH_KV_NAMESPACE_ID` بالمعرّف الحقيقي ثم احفظ.
4. أنشئ API Token من Cloudflare بصلاحية إدارة Workers على حسابك. لا ترسل التوكن في المحادثة.

## إضافة أسرار GitHub
من المستودع افتح Settings -> Secrets and variables -> Actions -> New repository secret، وأضف هذه الأسرار الثلاثة:
- `CLOUDFLARE_API_TOKEN`: التوكن الذي أنشأته.
- `CLOUDFLARE_ACCOUNT_ID`: Account ID من صفحة حساب Cloudflare.
- `APP_TOKEN`: كلمة سر طويلة عشوائية تختارها للاتصال بين الواجهة والـ API.

لا تضع أي سر داخل ملفات الكود أو في محادثة عامة.

## تشغيل النشر
بعد إضافة الأسرار وتعديل KV ID:
1. افتح تبويب Actions في GitHub.
2. اختار Deploy Cloudflare Worker API.
3. اضغط Run workflow على فرع main.

بعد نجاح النشر سيظهر رابط Worker بصيغة قريبة من:
`https://ai-content-agent-pro-api.<subdomain>.workers.dev`
انسخ الرابط، ثم أدخله في خانة API URL داخل واجهة الموقع، وأدخل نفس قيمة APP_TOKEN.

## حدود النسخة
هذا API أولي لخطة المشاهد فقط. لا توجد حتى الآن موصلات فعلية لتوليد الصور أو التعليق الصوتي أو الفيديو، ولا مونتاج FFmpeg أو تخزين فيديو نهائي أو إشعارات. يلزم إضافة مزودي وسائط مناسبين واختبار إخراج MP4 قبل اعتبار الوكيل مكتملاً.
