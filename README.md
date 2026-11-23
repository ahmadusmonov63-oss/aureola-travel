# ✈️ Aureon Travel - Sayyohlik Platformasi va Backend Tizimi

O'zbekiston bo'ylab eksklyuziv sayohat turlarini bron qilish, markaziy ma'lumotlar bazasi va Telegram bot integratsiyasiga ega to'liq fullstack platforma.

---

## 🏗 Backend Tizimi Arxitekturasi

Platforma uchun **REST API** backend tizimi to'liq ishlab chiqildi:
* **Fayllar:** `server.js` (Node.js Express)
* **Ma'lumotlar bazasi:** `DATABASE_URL` berilsa — PostgreSQL (Supabase), aks holda lokal `data/db.json`. Internetda faqat PostgreSQL ishlating (pastdagi bo'limga qarang).
* **Xavfsizlik:** Telegram Bot tokeni serverda saqlanadi, so'rovlar server orqali HTTPS orqali yuboriladi.

### REST API Endpointlari:

| Metod | Endpoint | Tavsif |
|---|---|---|
| `GET` | `/api/status` | Server holatini tekshirish (Health check) |
| `GET` | `/api/tours` | Barcha turlar ro'yxatini olish |
| `POST` | `/api/tours` | Yangi tur qo'shish yoki tahrirlash |
| `PUT` | `/api/tours` | Barcha turlarni almashtirish (standart holatga qaytarish) |
| `DELETE` | `/api/tours/:id` | Turni o'chirish |
| `GET` | `/api/bookings` | Barcha arizalar (Admin uchun) |
| `GET` | `/api/bookings/lookup?query=...` | Mehmon arizasini tekshirish (ID yoki Tel) |
| `POST` | `/api/bookings` | Yangi buyurtma qabul qilish va Telegramga yuborish |
| `PATCH` | `/api/bookings/:id/status` | Ariza holatini yangilash (Tasdiqlash/Bekor qilish) |
| `DELETE` | `/api/bookings/:id` | Arizani o'chirish |
| `GET` | `/api/settings` | Ommaviy sozlamalar (Valyuta kursi) |
| `GET` | `/api/settings/admin` | To'liq sozlamalar (Telegram bot tokeni va h.k.) |
| `POST` | `/api/settings` | Sozlamalarni yangilash |
| `POST` | `/api/telegram/test` | Telegram bot ulanishini sinovdan o'tkazish |

---

## 🚀 Ishga Tushirish

### 1-usul. O'z kompyuteringizda (Lokal)
Mac-da terminalni ochib, loyiha papkasiga o'ting:

```bash
npm install
npm start
```

Node.js 22 kerak (Render ham shu versiyani ishlatadi, `package.json` dagi `engines`); yangiroq versiyalarda ham ishlaydi. Lokal rejimda buyurtmalar `data/db.local.json` fayliga yoziladi (u git'ga kirmaydi). `data/db.json` faqat boshlang'ich turlar va sozlamalar uchun.

**Dizaynni o'zgartirganda:** sahifalar oldindan yig'ilgan `styles.css` dan foydalanadi (Tailwind CDN emas). HTML yoki JS ga yangi Tailwind klass qo'shsangiz, `npm run build:css` ni ishga tushirib, `styles.css` ni ham commit qiling. Sozlamalar: `tailwind.config.js`.

**Email (SMTP):** server sertifikati tekshiriladi. Faqat o'z-o'zidan imzolangan sertifikatli shaxsiy SMTP server uchun `SMTP_ALLOW_SELF_SIGNED=true` o'rnating.

Server ishga tushgach:
* 🌐 **Bosh sahifa:** `http://localhost:3000/index.html`
* 📝 **Bron qilish:** `http://localhost:3000/booking.html`
* 🔐 **Admin panel:** `http://localhost:3000/admin.html`

---

## ☁️ Internetga Bepul Joylashtirish (Render.com / Railway)

Saytni istalgan qurilmadan (telefon, planshet) ishlatish uchun:

1. **GitHub repozitoriy yarating** va barcha fayllarni yuklang.
2. **[Render.com](https://render.com)** ga bepul kiring va **New Web Service** tugmasini bosing.
3. GitHub repozitoriyingizni tanlang:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:**
     - `ADMIN_PASSWORD` = kuchli parol (majburiy)
     - `DATABASE_URL` = Supabase ulanish manzili (majburiy, pastdagi bo'limga qarang)
     - `ADMIN_SESSION_SECRET` = uzun tasodifiy satr (ixtiyoriy: server qayta ishga tushganda admin sessiyasi saqlanib qolishi uchun)
4. **Deploy** tugmasini bosing.

> 🔐 **Xavfsizlik:** Admin panel parol bilan himoyalangan. Standart `admin` paroli bilan faqat shu kompyuterdan (`localhost`) kirish mumkin. Internet orqali kirish uchun `ADMIN_PASSWORD` o'rnatilishi shart. 15 daqiqada 5 marta noto'g'ri urinishdan keyin kirish vaqtincha bloklanadi. Ommaviy so'rovlar ham cheklangan: buyurtmani tekshirish — 10 daqiqada 30 ta, yangi buyurtma — soatiga 10 ta (IP boshiga).
5. 1 daqiqada sizga doimiy ishlaydigan online manzil beriladi (masalan: `https://aureon-travel.onrender.com`).
   - Mehmonlar sayti: `https://aureon-travel.onrender.com/`
   - Siz uchun admin: `https://aureon-travel.onrender.com/admin.html`

---

## 🗄 Ma'lumotlar bazasi (Supabase PostgreSQL)

Render'ning bepul serverida fayllar **vaqtinchalik**: har deploy, qayta ishga tushish yoki uyqudan uyg'onishda `data/db.json` dastlabki holatiga qaytadi. Shuning uchun `DATABASE_URL` bo'lmasa **barcha buyurtmalar va sozlamalar o'chib ketadi**. Bepul Supabase bazasini ulang:

1. **[supabase.com](https://supabase.com)** da bepul loyiha yarating. Ma'lumotlar bazasi parolini yozib oling.
2. Loyiha sahifasida **Connect** tugmasini bosing va **Session pooler** manzilini nusxalang. U taxminan shunday ko'rinadi:
   ```
   postgresql://postgres.abcdefgh:[PAROL]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```
   > ⚠️ **Direct connection** (`db.xxxx.supabase.co`) manzilini ishlatmang: u faqat IPv6 orqali ishlaydi, Render esa IPv6 ni qo'llamaydi, shuning uchun ulanish bo'lmaydi.
3. `[PAROL]` o'rniga parolingizni qo'ying. Parolda `@ : / ? # %` kabi belgilar bo'lsa, ularni URL-kodlang (masalan `@` → `%40`) yoki parolni faqat harf va raqamlardan iborat qilib yangilang.
4. Render'da **Environment** bo'limiga `DATABASE_URL` = shu manzilni qo'shing va qayta deploy qiling.
5. Tekshirish: `https://<saytingiz>/api/status` ochilganda `"database": "PostgreSQL (Supabase)"` va `"persistent": true` chiqishi kerak.

**Qanday ishlaydi:**
- Birinchi ulanishda jadvallar avtomatik yaratiladi. `db.json` dagi turlar, buyurtmalar va sozlamalar bazaga ko'chiriladi (faqat bazada hali yo'q bo'lsa — keyingi ishga tushishlarda bazadagi ma'lumotlar ustidan yozilmaydi).
- `DATABASE_URL` berilgan bo'lsa, server faqat PostgreSQL bilan ishlaydi. Baza ulanmasa, server 5 marta urinib ko'radi va ishga tushmaydi (Render loglarida sababi ko'rinadi). Buyurtmalar jimgina vaqtinchalik faylga yozilib yo'qolmaydi.
- Baza vaqtincha javob bermasa, mijoz va admin "saqlandi" emas, xato xabarini ko'radi.
- Qo'shimcha sozlamalar: `DATABASE_POOL_MAX` (standart 5 ta ulanish), `DATABASE_SSL=false` (SSL siz lokal PostgreSQL uchun; `localhost` uchun avtomatik).

### 💤 Supabase va Render uxlab qolmasligi uchun (UptimeRobot)

- Supabase bepul loyihani **7 kun faolsiz** qolsa to'xtatadi. Shunda Render serveri qayta ishga tushganda bazaga ulana olmaydi va sayt ishlamay qoladi.
- Render bepul serveri **15 daqiqa** so'rov bo'lmasa uxlaydi, keyingi birinchi ochilish ~50 soniya kutadi.

`/api/status` har so'ralganda bazaga kichik so'rov (`SELECT 1`) yuboradi. Uni muntazam so'rab turish ikkala muammoni ham hal qiladi:

1. **[uptimerobot.com](https://uptimerobot.com)** da bepul ro'yxatdan o'ting.
2. **New monitor** → turi **HTTP(s)**.
3. **URL:** `https://aureon-travel.onrender.com/api/status`
4. **Monitoring interval:** 5 daqiqa (bepul tarifdagi eng kichik qiymat).
5. Ogohlantirish uchun emailingizni belgilang va saqlang.

Baza javob bermasa `/api/status` **503** qaytaradi va UptimeRobot sizga darhol xabar yuboradi. Bunday xabar kelsa, avval Supabase'da loyiha **Paused** bo'lib qolmaganini tekshiring.

> ℹ️ Render bepul tarifida oyiga 750 soat beriladi. Bitta servis doimiy uyg'oq tursa ~720–744 soat sarflaydi, bu limitga sig'adi. Lekin shu hisobda boshqa bepul servislar bo'lsa, limit yetmay qolishi mumkin.
