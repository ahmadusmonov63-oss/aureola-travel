# ✈️ Aureon Travel - Sayyohlik Platformasi va Backend Tizimi

O'zbekiston bo'ylab eksklyuziv sayohat turlarini bron qilish, markaziy ma'lumotlar bazasi va Telegram bot integratsiyasiga ega to'liq fullstack platforma.

---

## 🏗 Backend Tizimi Arxitekturasi

Platforma uchun **REST API** backend tizimi to'liq ishlab chiqildi:
* **Fayllar:** `server.js` (Node.js Express) va `server.rb` (Ruby WEBrick)
* **Ma'lumotlar bazasi:** `data/db.json` (barcha buyurtmalar, turlar va sozlamalar markaziy JSON bazada saqlanadi)
* **Xavfsizlik:** Telegram Bot tokeni serverda saqlanadi, so'rovlar server orqali HTTPS orqali yuboriladi.

### REST API Endpointlari:

| Metod | Endpoint | Tavsif |
|---|---|---|
| `GET` | `/api/status` | Server holatini tekshirish (Health check) |
| `GET` | `/api/tours` | Barcha turlar ro'yxatini olish |
| `POST` | `/api/tours` | Yangi tur qo'shish yoki tahrirlash |
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
# Ruby orqali (Mac-da darhol, qo'shimcha o'rnatishlarsiz ishlaydi):
ruby server.rb

# Yoki Node.js orqali (agar Node.js o'rnatilgan bo'lsa):
npm install
npm start
```

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
4. **Deploy** tugmasini bosing. 
5. 1 daqiqada sizga doimiy ishlaydigan online manzil beriladi (masalan: `https://aureon-travel.onrender.com`).
   - Mehmonlar sayti: `https://aureon-travel.onrender.com/`
   - Siz uchun admin: `https://aureon-travel.onrender.com/admin.html`
