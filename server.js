// ============================================================
// Aureon Travel - Node.js Express REST API & Web Server
// PostgreSQL (Supabase) + Local JSON Fallback Architecture
// ============================================================

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// --- 1. LOKAL MA'LUMOTLAR BAZASI (Fallback zaxira) ---
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
    console.error("Lokal DB o'qishda xatolik:", err);
    return { tours: [], bookings: [], settings: { exchangeRate: 12800, telegram: {}, adminPassword: "admin" } };
  }
}

function writeDb(data) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Lokal DB saqlashda xatolik:", err);
    return false;
  }
}

// --- 2. POSTGRESQL (SUPABASE) ULASh VA BOSHINCHI SOZLASH ---
let pgPool = null;
let isPgConnected = false;

function getPgPool() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  if (!pgPool) {
    try {
      const { Pool } = require('pg');
      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 20
      });

      pgPool.on('error', (err) => {
        console.error('PostgreSQL kutilmagan xatolik:', err.message);
      });
    } catch (e) {
      console.warn("pg moduli topilmadi yoki ulanishda xatolik:", e.message);
    }
  }
  return pgPool;
}

async function initDatabase() {
  const pool = getPgPool();
  if (!pool) {
    console.log("ℹ️ DATABASE_URL topilmadi. Lokal db.json ishlatilmoqda.");
    return false;
  }

  try {
    const client = await pool.connect();
    try {
      // Jadvallarni yaratish
      await client.query(`
        CREATE TABLE IF NOT EXISTS bookings (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);

        CREATE TABLE IF NOT EXISTS settings (
          key VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS tours (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Agar PostgreSQL da buyurtmalar hali bo'lmasa, lokal db.json dan ko'chirib o'tkazish (Auto-migration)
      const resCount = await client.query('SELECT COUNT(*) FROM bookings');
      if (parseInt(resCount.rows[0].count) === 0) {
        const localDb = readDb();
        if (localDb.bookings && localDb.bookings.length > 0) {
          for (const b of localDb.bookings) {
            await client.query(
              'INSERT INTO bookings (id, data, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
              [b.id, JSON.stringify(b), b.createdAt || new Date().toISOString()]
            );
          }
          console.log(`✅ ${localDb.bookings.length} ta lokal buyurtma PostgreSQL (Supabase)ga ko'chirildi!`);
        }
        if (localDb.settings) {
          await client.query(
            'INSERT INTO settings (key, data) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET data = $2',
            ['main', JSON.stringify(localDb.settings)]
          );
        }
      }

      isPgConnected = true;
      console.log("🚀 PostgreSQL (Supabase) muvaffaqiyatli ulandi va barcha jadvallar tayyor!");
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ PostgreSQL ulanishda xatolik:", err.message);
    isPgConnected = false;
    return false;
  }
}

// --- 3. MA'LUMOTLARNI BOSHQARISh (DB ABSTRACTION) ---
async function getAllBookings() {
  const pool = getPgPool();
  if (isPgConnected && pool) {
    try {
      const res = await pool.query('SELECT data FROM bookings ORDER BY created_at DESC');
      return res.rows.map(r => r.data);
    } catch (e) {
      console.error("PG bookings o'qishda xatolik:", e.message);
    }
  }
  return (readDb().bookings) || [];
}

async function saveBookingToDb(booking) {
  const pool = getPgPool();
  if (isPgConnected && pool) {
    try {
      await pool.query(
        'INSERT INTO bookings (id, data, created_at, updated_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = $4',
        [booking.id, JSON.stringify(booking), booking.createdAt || new Date().toISOString(), new Date().toISOString()]
      );
    } catch (e) {
      console.error("PG booking saqlashda xatolik:", e.message);
    }
  }
  // Lokal db.json ga ham zaxira sifatida saqlaymiz
  const db = readDb();
  db.bookings = db.bookings || [];
  const existingIdx = db.bookings.findIndex(b => b.id === booking.id);
  if (existingIdx >= 0) db.bookings[existingIdx] = booking;
  else db.bookings.unshift(booking);
  writeDb(db);
  return booking;
}

async function updateBookingStatusInDb(id, newStatus) {
  const pool = getPgPool();
  let updatedBooking = null;

  if (isPgConnected && pool) {
    try {
      const res = await pool.query('SELECT data FROM bookings WHERE id = $1', [id]);
      if (res.rows.length > 0) {
        const b = res.rows[0].data;
        b.status = newStatus;
        b.updatedAt = new Date().toISOString();
        await pool.query(
          'UPDATE bookings SET data = $1, updated_at = $2 WHERE id = $3',
          [JSON.stringify(b), b.updatedAt, id]
        );
        updatedBooking = b;
      }
    } catch (e) {
      console.error("PG status yangilashda xatolik:", e.message);
    }
  }

  // Lokal zaxira
  const db = readDb();
  const localB = (db.bookings || []).find(b => b.id === id);
  if (localB) {
    localB.status = newStatus;
    localB.updatedAt = new Date().toISOString();
    writeDb(db);
    if (!updatedBooking) updatedBooking = localB;
  }

  return updatedBooking;
}

async function deleteBookingFromDb(id) {
  const pool = getPgPool();
  if (isPgConnected && pool) {
    try {
      await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
    } catch (e) {
      console.error("PG booking o'chirishda xatolik:", e.message);
    }
  }
  const db = readDb();
  db.bookings = (db.bookings || []).filter(b => b.id !== id);
  writeDb(db);
  return true;
}

async function getSettingsFromDb() {
  const pool = getPgPool();
  if (isPgConnected && pool) {
    try {
      const res = await pool.query('SELECT data FROM settings WHERE key = $1', ['main']);
      if (res.rows.length > 0) {
        return res.rows[0].data;
      }
    } catch (e) {
      console.error("PG settings o'qishda xatolik:", e.message);
    }
  }
  return (readDb().settings) || { exchangeRate: 12800, telegram: {}, adminPassword: "admin" };
}

async function saveSettingsToDb(newSettings) {
  const pool = getPgPool();
  const current = await getSettingsFromDb();
  const merged = { ...current, ...newSettings };

  if (isPgConnected && pool) {
    try {
      await pool.query(
        'INSERT INTO settings (key, data, updated_at) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = $3',
        ['main', JSON.stringify(merged), new Date().toISOString()]
      );
    } catch (e) {
      console.error("PG settings saqlashda xatolik:", e.message);
    }
  }

  // Lokal zaxira
  const db = readDb();
  db.settings = merged;
  writeDb(db);
  return merged;
}

async function getToursFromDb() {
  const pool = getPgPool();
  if (isPgConnected && pool) {
    try {
      const res = await pool.query('SELECT data FROM tours');
      if (res.rows.length > 0) {
        return res.rows.map(r => r.data);
      }
    } catch (e) {
      console.error("PG tours o'qishda xatolik:", e.message);
    }
  }
  return (readDb().tours) || [];
}

async function saveTourToDb(tour) {
  const pool = getPgPool();
  if (isPgConnected && pool) {
    try {
      await pool.query(
        'INSERT INTO tours (id, data, updated_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = $3',
        [tour.id, JSON.stringify(tour), new Date().toISOString()]
      );
    } catch (e) {
      console.error("PG tour saqlashda xatolik:", e.message);
    }
  }

  const db = readDb();
  db.tours = db.tours || [];
  const idx = db.tours.findIndex(t => t.id === tour.id);
  if (idx >= 0) db.tours[idx] = tour;
  else db.tours.push(tour);
  writeDb(db);
  return tour;
}

async function deleteTourFromDb(id) {
  const pool = getPgPool();
  if (isPgConnected && pool) {
    try {
      await pool.query('DELETE FROM tours WHERE id = $1', [id]);
    } catch (e) {
      console.error("PG tour o'chirishda xatolik:", e.message);
    }
  }
  const db = readDb();
  db.tours = (db.tours || []).filter(t => t.id !== id);
  writeDb(db);
  return true;
}

// --- 4. TELEGRAM BOT XABARLARI ---
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

// --- 5. EXPRESS ILOVASI VA REST API ROUTELAR ---
let app;
try {
  const express = require('express');
  const cors = require('cors');

  app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Statik fayllarni tarqatish
  app.use(express.static(__dirname));

  // 1. Health check & status
  app.get('/api/status', (req, res) => {
    res.json({
      status: "ok",
      app: "Aureon Travel Backend",
      database: isPgConnected ? "PostgreSQL (Supabase)" : "Local JSON (db.json)",
      time: new Date().toISOString()
    });
  });

  // 2. TURLAR
  app.get('/api/tours', async (req, res) => {
    const list = await getToursFromDb();
    res.json(list);
  });

  app.get('/api/tours/:id', async (req, res) => {
    const list = await getToursFromDb();
    const tour = list.find(t => t.id === req.params.id);
    if (!tour) return res.status(404).json({ error: "Tur topilmadi" });
    res.json(tour);
  });

  app.post('/api/tours', async (req, res) => {
    const tourData = req.body;
    if (!tourData || !tourData.id) {
      return res.status(400).json({ error: "Tur ma'lumotlari to'liq emas" });
    }
    const saved = await saveTourToDb(tourData);
    res.json({ success: true, tour: saved });
  });

  app.delete('/api/tours/:id', async (req, res) => {
    await deleteTourFromDb(req.params.id);
    res.json({ success: true });
  });

  // 3. BUYURTMALAR (BOOKINGS)
  app.get('/api/bookings', async (req, res) => {
    let list = await getAllBookings();

    const query = req.query.query ? req.query.query.trim().toLowerCase() : "";
    if (query) {
      const cleanDigits = query.replace(/\D/g, '');
      list = list.filter(b => 
        (b.id && b.id.toLowerCase().includes(query)) ||
        (cleanDigits.length >= 7 && b.guestPhone && b.guestPhone.replace(/\D/g, '').includes(cleanDigits)) ||
        (b.guestName && b.guestName.toLowerCase().includes(query))
      );
    }

    res.json(list);
  });

  // Mehmon buyurtma holatini tekshirishi (Public Lookup)
  app.get('/api/bookings/lookup', async (req, res) => {
    const q = req.query.query ? req.query.query.trim().toLowerCase() : "";
    if (!q) return res.json([]);

    const cleanQ = q.replace(/\D/g, '');
    const all = await getAllBookings();

    const results = all.filter(b => {
      const matchId = b.id && b.id.toLowerCase() === q;
      const matchPhone = cleanQ.length >= 7 && b.guestPhone && b.guestPhone.replace(/\D/g, '').includes(cleanQ);
      return matchId || matchPhone;
    }).map(b => ({
      id: b.id,
      tourId: b.tourId,
      tourTitle: b.tourTitleLocalized || b.tourTitle,
      startDate: b.startDate,
      startTime: b.startTime,
      durationDays: b.durationDays,
      status: b.status,
      totalPrice: b.totalPrice,
      guestName: b.guestName,
      createdAt: b.createdAt
    }));

    res.json(results);
  });

  // Yangi buyurtma qabul qilish (Public POST)
  app.post('/api/bookings', async (req, res) => {
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

    await saveBookingToDb(newBooking);

    // Telegram botga yuborish (Server-side)
    const settings = await getSettingsFromDb();
    const tg = settings && settings.telegram ? settings.telegram : {};
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
    const { status } = req.body;
    const bId = req.params.id;

    const booking = await updateBookingStatusInDb(bId, status);
    if (!booking) {
      return res.status(404).json({ error: "Buyurtma topilmadi" });
    }

    // Status o'zgarganda Telegramga xabar berish
    const settings = await getSettingsFromDb();
    const tg = settings && settings.telegram ? settings.telegram : {};
    if (tg.enabled && tg.botToken && tg.chatId) {
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
  app.delete('/api/bookings/:id', async (req, res) => {
    await deleteBookingFromDb(req.params.id);
    res.json({ success: true });
  });

  // 4. SOZLAMALAR (SETTINGS)
  app.get('/api/settings', async (req, res) => {
    const s = await getSettingsFromDb();
    res.json({
      exchangeRate: s.exchangeRate || 12800,
      telegramEnabled: !!(s.telegram && s.telegram.enabled && s.telegram.botToken)
    });
  });

  app.get('/api/settings/admin', async (req, res) => {
    const s = await getSettingsFromDb();
    res.json(s || {});
  });

  app.post('/api/settings', async (req, res) => {
    const newSettings = req.body;
    const updated = await saveSettingsToDb(newSettings);
    res.json({ success: true, settings: updated });
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
  app.post('/api/admin/login', async (req, res) => {
    const { password } = req.body;
    const s = await getSettingsFromDb();
    const correctPassword = s.adminPassword || "admin";

    if (password === correctPassword) {
      res.json({ success: true, token: "aureon_admin_session_" + Date.now() });
    } else {
      res.status(401).json({ success: false, error: "Parol noto'g'ri" });
    }
  });

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

} catch (e) {
  console.log("Express moduli topilmadi:", e.message);
}

// 6. Serverni ishga tushirish
if (app) {
  initDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log("==================================================");
      console.log(`  ✈️  AUREON TRAVEL BACKEND ISHGA TUSHDI!`);
      console.log(`  🚀 Port: ${PORT}`);
      console.log(`  🗄  Ma'lumotlar bazasi: ${isPgConnected ? 'PostgreSQL (Supabase)' : 'Lokal JSON (db.json)'}`);
      console.log(`  👉 Bosh sahifa: http://localhost:${PORT}/index.html`);
      console.log(`  👉 Admin panel: http://localhost:${PORT}/admin.html`);
      console.log("==================================================");
    });
  });
}
