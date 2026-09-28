// ============================================================
// Aureon Travel - Node.js Express REST API & Web Server
// ============================================================

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// 1. Ma'lumotlar bazasini o'qish va saqlash funksiyalari
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = {
        tours: [],
        bookings: [],
        settings: {
          exchangeRate: 12800,
          telegram: { botToken: "", chatId: "", enabled: false },
          adminPassword: "admin"
        }
      };
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("DB o'qishda xatolik:", err);
    return { tours: [], bookings: [], settings: { exchangeRate: 12800, telegram: {}, adminPassword: "admin" } };
  }
}

function writeDb(data) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("DB saqlashda xatolik:", err);
    return false;
  }
}

// 2. Telegram Bot xabarnomasini server orqali xavfsiz yuborish
function sendTelegramMessage(botToken, chatId, text) {
  return new Promise((resolve) => {
    if (!botToken || !chatId) {
      return resolve({ success: false, error: "Telegram sozlanmagan" });
    }

    const payload = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const resp = JSON.parse(data);
          resolve({ success: resp.ok, data: resp });
        } catch (e) {
          resolve({ success: false, error: data });
        }
      });
    });

    req.on('error', (err) => {
      console.error("Telegram HTTPS xatolik:", err.message);
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: "Telegram timeout" });
    });

    req.write(payload);
    req.end();
  });
}

// 3. Express ilovasini sozlash (agar express mavjud bo'lsa)
let app;
try {
  const express = require('express');
  const cors = require('cors');

  app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Statik fayllarni tarqatish (HTML, JS, CSS, rasmlar)
  app.use(express.static(__dirname));

  // --- API ROUTELAR ---

  // Health check
  app.get('/api/status', (req, res) => {
    res.json({ status: "ok", app: "Aureon Travel Backend", time: new Date().toISOString() });
  });

  // TURLAR
  app.get('/api/tours', (req, res) => {
    const db = readDb();
    res.json(db.tours || []);
  });

  app.get('/api/tours/:id', (req, res) => {
    const db = readDb();
    const tour = (db.tours || []).find(t => t.id === req.params.id);
    if (!tour) return res.status(404).json({ error: "Tur topilmadi" });
    res.json(tour);
  });

  app.post('/api/tours', (req, res) => {
    const db = readDb();
    const tourData = req.body;
    if (!tourData || !tourData.id) {
      return res.status(400).json({ error: "Tur ma'lumotlari to'liq emas" });
    }

    const index = (db.tours || []).findIndex(t => t.id === tourData.id);
    if (index >= 0) {
      db.tours[index] = tourData;
    } else {
      db.tours.push(tourData);
    }

    writeDb(db);
    res.json({ success: true, tour: tourData });
  });

  app.delete('/api/tours/:id', (req, res) => {
    const db = readDb();
    db.tours = (db.tours || []).filter(t => t.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // BUYURTMALAR (BOOKINGS)
  app.get('/api/bookings', (req, res) => {
    const db = readDb();
    let list = db.bookings || [];

    // Guest search lookup: ?query=...
    const query = req.query.query ? req.query.query.trim().toLowerCase() : "";
    if (query) {
      list = list.filter(b => 
        (b.id && b.id.toLowerCase().includes(query)) ||
        (b.guestPhone && b.guestPhone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))) ||
        (b.guestName && b.guestName.toLowerCase().includes(query))
      );
    }

    res.json(list);
  });

  // Mehmon buyurtma holatini tekshirishi (Public Lookup)
  app.get('/api/bookings/lookup', (req, res) => {
    const db = readDb();
    const q = req.query.query ? req.query.query.trim().toLowerCase() : "";
    if (!q) return res.json([]);

    const cleanQ = q.replace(/\D/g, '');
    const results = (db.bookings || []).filter(b => {
      const matchId = b.id && b.id.toLowerCase() === q;
      const matchPhone = cleanQ.length >= 7 && b.guestPhone && b.guestPhone.replace(/\D/g, '').includes(cleanQ);
      return matchId || matchPhone;
    }).map(b => ({
      id: b.id,
      tourTitle: b.tourTitleLocalized || b.tourTitle,
      startDate: b.startDate,
      startTime: b.startTime,
      durationDays: b.durationDays,
      status: b.status,
      totalPrice: b.totalPrice,
      createdAt: b.createdAt
    }));

    res.json(results);
  });

  // Yangi buyurtma qabul qilish (Public POST)
  app.post('/api/bookings', async (req, res) => {
    const db = readDb();
    const data = req.body;

    if (!data.guestName || !data.guestPhone) {
      return res.status(400).json({ error: "Ism va telefon raqami talab qilinadi" });
    }

    const bookingId = data.id || `BK-${Math.floor(100000 + Math.random() * 900000)}`;
    const newBooking = {
      ...data,
      id: bookingId,
      status: data.status || "Kutilmoqda",
      createdAt: data.createdAt || new Date().toISOString()
    };

    db.bookings.unshift(newBooking);
    writeDb(db);

    // Telegram botga yuborish (Server-side)
    const tg = db.settings && db.settings.telegram ? db.settings.telegram : {};
    if (tg.enabled && tg.botToken && tg.chatId) {
      const sumFormatted = new Intl.NumberFormat('uz-UZ').format(newBooking.totalPrice || 0);
      const tgText = 
`🔔 <b>YANGI ARIZA TUSHDI!</b> (Aureon Travel)

📋 <b>ID:</b> #${newBooking.id}
👤 <b>Mijoz:</b> ${newBooking.guestName}
📞 <b>Telefon:</b> ${newBooking.guestPhone}
📍 <b>Manzil:</b> ${newBooking.pickupLocation || newBooking.roomNumber || '-'}

🗺 <b>Tur:</b> ${newBooking.tourTitleLocalized || newBooking.tourTitle || '-'}
📅 <b>Sana:</b> ${newBooking.startDate} | 🕒 ${newBooking.startTime || '09:00'}
⏳ <b>Davomiyligi:</b> ${newBooking.durationDays} kun (${newBooking.nights || 0} kecha)
👥 <b>Odamlar:</b> ${newBooking.adults} nafar katta, ${newBooking.children || 0} nafar bola
🏨 <b>Otel:</b> ${newBooking.hotelOption || '-'}
🗣 <b>Gid:</b> ${newBooking.guideOption || '-'} (${newBooking.guideLanguage || 'uz'})
💬 <b>Izoh:</b> ${newBooking.guestNote || "Yo'q"}

💰 <b>Jami hisob:</b> <b>${sumFormatted} so'm</b>
📌 <b>Holati:</b> ⏳ Kutilmoqda`;

      sendTelegramMessage(tg.botToken, tg.chatId, tgText).catch(e => console.error("TG xatolik:", e));
    }

    res.status(201).json({ success: true, booking: newBooking });
  });

  // Buyurtma holatini yangilash (Admin PATCH)
  app.patch('/api/bookings/:id/status', async (req, res) => {
    const db = readDb();
    const { status } = req.body;
    const bId = req.params.id;

    const booking = (db.bookings || []).find(b => b.id === bId);
    if (!booking) {
      return res.status(404).json({ error: "Buyurtma topilmadi" });
    }

    const oldStatus = booking.status;
    booking.status = status;
    booking.updatedAt = new Date().toISOString();
    writeDb(db);

    // Status o'zgarganda Telegramga xabar berish
    const tg = db.settings && db.settings.telegram ? db.settings.telegram : {};
    if (tg.enabled && tg.botToken && tg.chatId && oldStatus !== status) {
      const statusIcon = status === "Tasdiqlandi" ? "✅" : status === "Bekor qilindi" ? "❌" : "⏳";
      const tgText = 
`${statusIcon} <b>BUYURTMA HOLATI O'ZGARDI</b>

📋 <b>ID:</b> #${booking.id}
👤 <b>Mijoz:</b> ${booking.guestName}
📞 <b>Tel:</b> ${booking.guestPhone}
🗺 <b>Tur:</b> ${booking.tourTitleLocalized || booking.tourTitle}
📅 <b>Sana:</b> ${booking.startDate} (${booking.startTime || '09:00'})
📍 <b>Olib ketish:</b> ${booking.pickupLocation || booking.roomNumber || '-'}

📌 <b>Yangi status:</b> <b>${status}</b>
🕒 <b>Vaqti:</b> ${new Date().toLocaleTimeString()}`;

      sendTelegramMessage(tg.botToken, tg.chatId, tgText).catch(e => console.error("TG xatolik:", e));
    }

    res.json({ success: true, booking });
  });

  // Buyurtmani o'chirish
  app.delete('/api/bookings/:id', (req, res) => {
    const db = readDb();
    db.bookings = (db.bookings || []).filter(b => b.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // SOZLAMALAR (SETTINGS)
  // Public sozlamalar (Kurs va h.k.)
  app.get('/api/settings', (req, res) => {
    const db = readDb();
    const s = db.settings || {};
    res.json({
      exchangeRate: s.exchangeRate || 12800,
      telegramEnabled: !!(s.telegram && s.telegram.enabled && s.telegram.botToken)
    });
  });

  // Admin sozlamalari (Telegram bot token va chat ID bilan)
  app.get('/api/settings/admin', (req, res) => {
    const db = readDb();
    res.json(db.settings || {});
  });

  // Sozlamalarni yangilash
  app.post('/api/settings', (req, res) => {
    const db = readDb();
    const newSettings = req.body;

    db.settings = {
      ...db.settings,
      ...newSettings
    };

    writeDb(db);
    res.json({ success: true, settings: db.settings });
  });

  // Telegram ulanishini test qilish
  app.post('/api/telegram/test', async (req, res) => {
    const { botToken, chatId } = req.body;
    if (!botToken || !chatId) {
      return res.status(400).json({ error: "Token yoki Chat ID kiritilmagan" });
    }

    const testMsg = `✈️ <b>Aureon Travel Backend</b>\n\nTelegram bot muvaffaqiyatli ulandi! ✅\nSana: ${new Date().toLocaleString()}`;
    const result = await sendTelegramMessage(botToken, chatId, testMsg);

    if (result.success) {
      res.json({ success: true, message: "Xabar muvaffaqiyatli yetkazildi!" });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  });

  // Admin login tekshirish
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const db = readDb();
    const correctPassword = (db.settings && db.settings.adminPassword) || "admin";

    if (password === correctPassword) {
      res.json({ success: true, token: "aureon_admin_session_" + Date.now() });
    } else {
      res.status(401).json({ success: false, error: "Parol noto'g'ri" });
    }
  });

  // 404 fallback to index.html (SPA qo'llab-quvvatlash)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

} catch (e) {
  console.log("Express moduli topilmadi, standart HTTP server ishlatilmoqda.");
}

// 4. Serverni ishga tushirish
if (app) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log("==================================================");
    console.log(`  ✈️  AUREON TRAVEL BACKEND ISHGA TUSHDI!`);
    console.log(`  🚀 Port: ${PORT}`);
    console.log(`  👉 Bosh sahifa: http://localhost:${PORT}/index.html`);
    console.log(`  👉 Bron qilish: http://localhost:${PORT}/booking.html`);
    console.log(`  👉 Admin panel: http://localhost:${PORT}/admin.html`);
    console.log("==================================================");
  });
}
