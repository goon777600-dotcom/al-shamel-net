# دليل تشغيل تطبيق الشامل نت على منصة Render برابط دائم ومجاني 100%

هذا الدليل يوضح لك بالخطوات السهلة كيف تحصل على **رابط دائم ومجاني مدى الحياة** لموقعك ولوحة التحكم دون دفع أي رسوم ودون الحاجة لبطاقة بنكية.

---

## 📌 الخطوة 1: تجهيز حساب GitHub (مجاني)
1. افتح موقع [GitHub.com](https://github.com) وأنشئ حساباً مجانياً إذا لم يكن لديك حساب.
2. اضغط على زر **New** (أو علامة `+` بأعلى اليمين) لإنشاء مستودع جديد (**New Repository**).
3. اكتب اسم المستودع: `al-shamel-net`.
4. اختر المستودع **Private** (خاص) أو **Public** (عام) ثم اضغط **Create repository**.
5. ارفع ملفات هذا المشروع (باستثناء مجلد `node_modules`).

---

## 📌 الخطوة 2: التسجيل في منصة Render مجاناً
1. افتح موقع [Render.com](https://render.com).
2. اضغط على **Sign In** أو **Get Started for Free**.
3. اختر التسجيل بواسطة **GitHub** (بضغطة زر واحدة لربط الحسابين).
4. **ملاحظة:** لا تطلب المنصة أي بطاقة بنكية إطلاقاً (No Credit Card Required).

---

## 📌 الخطوة 3: إنشاء الخدمة وتشغيل الموقع
1. من لوحة التحكم في Render، اضغط على زر **New +** بأعلى الشاشة.
2. اختر **Web Service**.
3. ستظهر لك قائمة مستودعاتك في GitHub، اختر مستودع `al-shamel-net` واضغط **Connect**.
4. ستظهر لك صفحة الإعدادات، املأ الخانات كالتالي:
   * **Name:** `al-shamel-net` (أو أي اسم تفضله)
   * **Region:** `Frankfurt (EU Central)` أو `Singapore`
   * **Branch:** `main` (أو `master`)
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `node dist/index.js`
   * **Plan:** اختر **Free ($0/month)**.

---

## 📌 الخطوة 4: إضافة المتغيرات السرية (Environment Variables)
في نفس الصفحة انزل لأسفل إلى قسم **Environment Variables**، واضغط **Add Environment Variable** وأضف الآتي:

| المفتاح (Key) | القيمة (Value) |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `mysql://2qmLpdw6nU53MRL.root:3MmtuOaYUu9UosHE@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}` |
| `JWT_SECRET` | `shamel-secure-key-2026-wifi-network-manager-yemen` |
| `VITE_APP_ID` | `al-shamel-services` |
| `OWNER_OPEN_ID` | `admin-nabel-7720079495` |

---

## 📌 الخطوة 5: الضغط على Deploy Web Service
* اضغط على زر **Deploy Web Service** في أسفل الصفحة.
* ستقوم المنصة ببناء المشروع وتشغيله تلقائياً خلال دقيقة إلى دقيقتين.
* ستحصل فوراً على الرابط الدائم بأعلى الصفحة مثل:  
  `https://al-shamel-net.onrender.com`
  ورابط لوحة الإدارة:  
  `https://al-shamel-net.onrender.com/admin`

---

## ⚡ خطوة إضافية ذكية: إبقاء الموقع مستيقظاً وسريعاً 24/7 (مجاناً)
الخطة المجانية في Render تضع السيرفر في وضع السكون إذا لم يدخل زوار لمدة 15 دقيقة. لإبقائه مستيقظاً دائماً وسريعاً كالبرق طوال اليوم:
1. ادخل على الموقع المجاني [UptimeRobot.com](https://uptimerobot.com).
2. سجل حساباً مجانياً، ثم اضغط **Add New Monitor**.
3. اختر Monitor Type: `HTTP(s)`.
4. ضع اسم: `Al Shamel Store`.
5. ضع رابط موقعك الذي حصلت عليه من Render.
6. اختر الفحص كل: `5 minutes`.
7. اضغط **Create Monitor**.

🎉 **النتيجة:** سيقوم UptimeRobot بتنبيه السيرفر كل 5 دقائق، وسيبقى موقعك يعمل 24 ساعة بدون نوم مجاناً 100%!
