# 🏨 Grand Hotel Tour Desk - Sayohat va Tur Bron Qilish Tizimi

Mehmonxona mehmonlari uchun eksklyuziv sayohat turlarini tashkil qilish va boshqarish veb-platformasi.

---

## 🌟 Tizim Imkoniyatlari

### 1. 👥 Mexmonlar Uchun Sayt (`index.html`)
* **6 ta Maxsus Yo'nalish:**
  1. **Toshkent shahri bo'ylab** (Poytaxtning boy tarixi va zamonaviy qiyofasi)
  2. **Tog'li hududlar** (Amirsoy, Chimyon, Chorvoq)
  3. **Zomin milliy tabiat bog'i** (O'zbekiston Shveytsariyasi, 305m shisha ko'prik)
  4. **Samarqand** (Sharq durdonasi, Registon maydoni)
  5. **Buxoroi Sharif** (2500 yillik tirik afsona, Minorai Kalon)
  6. **Xorazm (Xiva)** (Tirik ochiq osmon muzeyi, Ichan Qal'a)
* **Batafsil Modal Oyna:**
  * Har bir shahar bo'yicha boy rasmlar galereyasi.
  * U joyda nimalar bilan band bo'lishi (soatbay reja: ekskursiyalar, taomlar, hordiq).
  * Nimalar bilan tanishishi (tarixiy obidalar, diqqatga sazovor joylar).
  * Kiritilgan va kiritilmagan xizmatlar.
* **Onlayn Bron Qilish va Kalkulyator:**
  * Sayohatchilar soni (Kattalar va Bolalar).
  * Safar davomiyligi (1 kunlik, 2 kun / 1 kecha, 3 kun / 2 kecha, 4 kun / 3 kecha).
  * **Otel varianti:** Agar 1 kecha yoki undan ko'p bo'lsa — **"Otel bilan birga"** yoki **"Otelsiz"** tanlash imkoni!
  * Mexmon ma'lumotlari: Ismi-familiyasi, telefon raqami, xona raqami, gid tili va qo'shimcha istaklar.
  * Real vaqtda to'liq narx hisoblab beriladi.

---

### 2. 🛡 Admin Boshqaruv Markazi (`admin.html`)
* **Arizalar Nazorati:**
  * Kelib tushgan barcha buyurtmalar ro'yxati (real vaqtda yangilanadi).
  * Statuslar: `Yangi`, `Tasdiqlangan`, `Bekor qilingan`.
  * Qidiruv va saralash (ism, telefon, ID bo'yicha).
  * JSON zaxira nusxasini yuklab olish.
* **Turlar va Narxlarni Tahrirlash:**
  * Istalgan turning 1 kishi uchun asosiy narxini o'zgartirish.
  * 1 kechalik otel narxini o'zgartirish.
  * Rasmlar, dasturlar va ma'lumotlarni o'zgartirish.
  * Yangi turlar qo'shish imkoniyati.
* **Telegram Bot Integratsiyasi:**
  * Bot Token va Chat ID-ni kiritish va saqlash.
  * "Test Xabar" tugmasi orqali botni bir zumda tekshirish.

---

## 🚀 Ishga Tushirish Usullari

### Usul 1: Brauzerda To'g'ridan-to'g'ri Ochish
Siz hech qanday qo'shimcha dastur o'rnatmasdan ham fayllarni to'g'ridan-to'g'ri brauzeringizda (Safari, Chrome) ochishingiz mumkin:
* **Mexmonlar sayti:** `tur_loyiha/index.html` faylini oching.
* **Admin paneli:** `tur_loyiha/admin.html` faylini oching.

### Usul 2: Mahalliy Server Orqali (Tavsiya etiladi)
VS Code yoki Mac terminalingizda loyiha papkasiga kirib, quyidagi buyruqni bering:
```bash
ruby server.rb
```
Shunda quyidagi manzillarda sayt ishga tushadi:
* Mexmon sayti: `http://localhost:3000/index.html`
* Admin sayti: `http://localhost:3000/admin.html`

---

## 🤖 Telegram Botni Ulash (3 Qadam)

1. Telegramda **@BotFather** botiga kiring va `/newbot` buyrug'ini yozing. Bot nomini kiriting va sizga berilgan **Bot Token**ni nusxalab oling.
2. Botga kirib `/start` bosing. O'z shaxsiy profilingiz yoki administratsiya guruhingizning **Chat ID** raqamini bilish uchun **@userinfobot** dan foydalaning.
3. Admin panelidagi (`admin.html`) **Telegram Bot Sozlamalari** bo'limiga Token va Chat ID ni kiriting va **"Saqlash"** hamda **"Test Xabar"** tugmasini bosing!

Har safar yangi buyurtma tushganda barcha ma'lumotlar bir soniya ichida Telegramingizga keladi!
