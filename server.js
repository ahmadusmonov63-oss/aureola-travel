// ============================================================
// Aureon Travel - Node.js Express REST API & Web Server
// PostgreSQL (Supabase) + Local JSON Fallback Architecture
// ============================================================

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const SEED_FILE = path.join(__dirname, 'data', 'db.json');
const DB_FILE = path.join(__dirname, 'data', 'db.local.json');

// --- 0. XAVFSIZLIK YORDAMCHILARI ---
const DEFAULT_ADMIN_PASSWORD = "admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 soat
// Token imzolash kaliti. ADMIN_SESSION_SECRET berilmasa, har ishga tushishda yangisi yaratiladi
// (server qayta ishga tushganda admin qaytadan kiradi).
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Brauzerga ochiq beriladigan fayllar. Qolganlari (data/db.json, server.js, ...) yopiq.
const PUBLIC_FILES = new Set([
  'index.html', 'booking.html', 'admin.html',
  'app.js', 'booking.js', 'admin.js', 'data.js', 'styles.css'
]);

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

function safeEqual(a, b) {
  return crypto.timingSafeEqual(sha256(a), sha256(b));
}

function signPayload(payload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

function createAdminToken() {
  const payload = `${Date.now() + SESSION_TTL_MS}.${crypto.randomBytes(8).toString('hex')}`;
  return `${payload}.${signPayload(payload)}`;
}

function verifyAdminToken(token) {
  if (typeof token !== 'string') return false;
  const lastDot = token.lastIndexOf('.');
  if (lastDot <= 0) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (!safeEqual(sig, signPayload(payload))) return false;
  const exp = parseInt(payload.split('.')[0], 10);
  return Number.isFinite(exp) && exp > Date.now();
}

function requireAdmin(req, res, next) {
  const match = (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (match && verifyAdminToken(match[1].trim())) return next();
  res.status(401).json({ error: "Avtorizatsiya talab qilinadi. Admin panelga qaytadan kiring.", authRequired: true });
}

// Proksi (Render, ngrok) orqali kelgan so'rov hech qachon "lokal" hisoblanmaydi
function isLocalRequest(req) {
  if (req.headers['x-forwarded-for']) return false;
  const addr = (req.socket && req.socket.remoteAddress) || '';
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
}

// Mijoz IP manzili: proksi qo'shgan oxirgi X-Forwarded-For qiymati, bo'lmasa to'g'ridan-to'g'ri ulanish
function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const parts = String(xff).split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

// Login urinishlarini cheklash: 15 daqiqada IP boshiga 5 ta xato urinish
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILS = 5;
const loginFailures = new Map();

function isLoginBlocked(ip) {
  const entry = loginFailures.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > LOGIN_WINDOW_MS) {
    loginFailures.delete(ip);
    return false;
  }
  return entry.count >= LOGIN_MAX_FAILS;
}

function recordLoginFailure(ip) {
  const entry = loginFailures.get(ip);
  if (!entry || Date.now() - entry.first > LOGIN_WINDOW_MS) {
    loginFailures.set(ip, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

// Sozlamalardan maxfiy maydonlarni olib tashlash (javobga chiqarmaslik uchun)
function withoutSecrets(settings) {
  const { adminPassword, ...rest } = settings || {};
  return rest;
}

// Telegram HTML parse_mode uchun matnni xavfsiz qilish
function escapeTgHtml(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Ommaviy formadan kelgan buyurtma: faqat oddiy qiymatlar, HTML/atribut buzadigan belgilarsiz.
// Bu admin panelda XSS (mijoz ismiga yozilgan <script> va h.k.) bajarilishining oldini oladi.
function sanitizePublicBooking(data) {
  const clean = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(key)) continue;
    if (typeof value === 'string') {
      clean[key] = value.replace(/[<>"`]/g, '').slice(0, 2000);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      clean[key] = value;
    } else if (typeof value === 'boolean') {
      clean[key] = value;
    }
  }
  return clean;
}

// Buyurtma ID: BK- + 8 ta belgi (chalkashtiriladigan 0/O, 1/I belgilarsiz) — ~10^12 variant.
// Avvalgi 6 xonali raqamli ID (~900 ming variant) ketma-ket sinab topilishi mumkin edi.
// Eski BK-123456 ko'rinishidagi ID lar ham ishlashda davom etadi.
const BOOKING_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateBookingId(existing) {
  const ids = new Set(existing.map(b => b.id));
  let id;
  do {
    let suffix = '';
    for (let i = 0; i < 8; i++) suffix += BOOKING_ID_ALPHABET[crypto.randomInt(BOOKING_ID_ALPHABET.length)];
    id = `BK-${suffix}`;
  } while (ids.has(id));
  return id;
}

// Ommaviy javoblarda ismni qisqartirish: "Ali Valiyev" -> "Ali V."
function maskName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}

// Oddiy IP bo'yicha so'rov cheklovchi (bitta server jarayoni uchun, xotirada)
function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map();
  return function rateLimit(req, res, next) {
    const now = Date.now();
    if (hits.size > 5000) {
      for (const [key, entry] of hits) if (now - entry.start > windowMs) hits.delete(key);
    }
    const ip = getClientIp(req);
    let entry = hits.get(ip);
    if (!entry || now - entry.start > windowMs) {
      entry = { start: now, count: 0 };
      hits.set(ip, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.start + windowMs - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

// Buyurtmani tekshirish: 10 daqiqada IP boshiga 30 ta so'rov (ID larni ketma-ket sinashni to'xtatadi)
const lookupLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "Juda ko'p so'rov. Birozdan keyin qayta urinib ko'ring."
});

// Yangi buyurtma: soatiga IP boshiga 10 ta (bazani va Telegram'ni spam bilan to'ldirmaslik uchun)
const bookingLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Juda ko'p buyurtma yuborildi. Iltimos, keyinroq urinib ko'ring yoki biz bilan telefon orqali bog'laning."
});

// --- 1. LOKAL MA'LUMOTLAR BAZASI (Fallback zaxira) ---
// data/db.json      — boshlang'ich ma'lumot (turlar, standart sozlamalar), git'da saqlanadi, server unga YOZMAYDI.
// data/db.local.json — ish vaqtidagi ma'lumot (buyurtmalar, o'zgargan turlar va sozlamalar), .gitignore da.
// Avval buyurtmalar (mijoz ismi, telefoni, emaili) git'dagi db.json ga yozilib, tasodifan commit qilinishi mumkin edi.
function readSeed() {
  if (fs.existsSync(SEED_FILE)) {
    const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    return { ...seed, bookings: [] }; // boshlang'ich faylga tushib qolgan buyurtmalar ko'chirilmaydi
  }
  return {
    tours: [],
    bookings: [],
    settings: {
      exchangeRate: 12800,
      telegram: { botToken: "", chatId: "", enabled: false },
      adminPassword: "admin"
    }
  };
}

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = readSeed();
      writeDbOrThrow(initial);
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    // Bo'sh obyekt qaytarmaymiz: keyingi yozish butun faylni (barcha buyurtmalarni) o'chirib yuborardi
    console.error("Lokal DB o'qishda xatolik:", err.message);
    throw new Error(`Lokal ma'lumotlar fayli (${path.relative(__dirname, DB_FILE)}) buzilgan yoki o'qib bo'lmadi`);
  }
}

// Avval vaqtinchalik faylga yozib, keyin almashtiramiz — yozish o'rtasida to'xtasa fayl buzilmaydi
function writeDbOrThrow(data) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, DB_FILE);
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
      // sslmode ni URL dan olib tashlaymiz: aks holda u pastdagi ssl sozlamasini bekor qilib,
      // Supabase sertifikatida "self-signed certificate" xatosini beradi.
      const url = new URL(dbUrl);
      url.searchParams.delete('sslmode');
      const isLocalDb = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
      const useSsl = process.env.DATABASE_SSL ? process.env.DATABASE_SSL !== 'false' : !isLocalDb;

      pgPool = new Pool({
        connectionString: url.toString(),
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        query_timeout: 15000, // osilib qolgan so'rov ulanishni cheksiz band qilmasin
        max: parseInt(process.env.DATABASE_POOL_MAX || '5', 10) // Supabase bepul tarifida ulanishlar cheklangan
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
    throw new Error("PostgreSQL pool yaratilmadi (DATABASE_URL formati yoki pg moduli xato)");
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
        ALTER TABLE tours ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      `);

      // Turlar jadvali bo'sh bo'lsa, db.json dagi turlarni ko'chirish (tartibi saqlanadi).
      // Aks holda admin bitta turni saqlaganda qolgan turlar saytdan yo'qolib qolardi.
      const toursCount = await client.query('SELECT COUNT(*) FROM tours');
      if (parseInt(toursCount.rows[0].count) === 0) {
        const localTours = readDb().tours || [];
        const base = Date.now();
        for (let i = 0; i < localTours.length; i++) {
          await client.query(
            'INSERT INTO tours (id, data, created_at, updated_at) VALUES ($1, $2, $3, $3) ON CONFLICT (id) DO NOTHING',
            [localTours[i].id, JSON.stringify(localTours[i]), new Date(base + i).toISOString()]
          );
        }
        if (localTours.length) console.log(`✅ ${localTours.length} ta tur PostgreSQL ga ko'chirildi`);
      }

      // Eski jadvalga created_at ustuni keyin qo'shilganda barcha turlarga bir xil vaqt yoziladi
      // va ular alifbo bo'yicha chiqib qoladi. Shunday bo'lsa, tartibni db.json dagidek tiklaymiz
      // (faqat created_at o'zgaradi, tur ma'lumotlariga tegilmaydi).
      const orderCheck = await client.query(
        'SELECT COUNT(*) AS total, COUNT(DISTINCT created_at) AS distinct_times, MIN(created_at) AS base FROM tours'
      );
      const { total, distinct_times: distinctTimes, base: baseTime } = orderCheck.rows[0];
      // COUNT(DISTINCT) NULL larni sanamaydi: barchasi NULL bo'lsa 0 chiqadi — bu ham "tartib yo'q" holati
      if (parseInt(total) > 1 && parseInt(distinctTimes) <= 1) {
        const seedOrder = (readSeed().tours || []).map(t => t.id);
        const existing = (await client.query('SELECT id FROM tours ORDER BY id')).rows.map(r => r.id);
        const ordered = [
          ...seedOrder.filter(id => existing.includes(id)),
          ...existing.filter(id => !seedOrder.includes(id))
        ];
        const base = baseTime ? new Date(baseTime).getTime() : Date.now();
        for (let i = 0; i < ordered.length; i++) {
          await client.query('UPDATE tours SET created_at = $1 WHERE id = $2', [new Date(base + i).toISOString(), ordered[i]]);
        }
        console.log(`✅ Turlar tartibi tiklandi: ${ordered.join(', ')}`);
      }

      // Agar PostgreSQL da buyurtmalar hali bo'lmasa, lokal db.json dan ko'chirib o'tkazish (Auto-migration)
      const localDb = readDb();
      const resCount = await client.query('SELECT COUNT(*) FROM bookings');
      if (parseInt(resCount.rows[0].count) === 0 && localDb.bookings && localDb.bookings.length > 0) {
        for (const b of localDb.bookings) {
          await client.query(
            'INSERT INTO bookings (id, data, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
            [b.id, JSON.stringify(b), b.createdAt || new Date().toISOString()]
          );
        }
        console.log(`✅ ${localDb.bookings.length} ta lokal buyurtma PostgreSQL (Supabase)ga ko'chirildi!`);
      }

      // Sozlamalar faqat bazada hali yo'q bo'lsa yoziladi. (Avval har qayta ishga tushishda
      // bazadagi Telegram/valyuta sozlamalari db.json dagi standart qiymatlar bilan almashtirilardi.)
      await client.query(
        'INSERT INTO settings (key, data) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
        ['main', JSON.stringify(localDb.settings || DEFAULT_SETTINGS)]
      );

      isPgConnected = true;
      console.log("🚀 PostgreSQL (Supabase) muvaffaqiyatli ulandi va barcha jadvallar tayyor!");
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ PostgreSQL ulanishda xatolik:", err.message);
    isPgConnected = false;
    throw err;
  }
}

// DATABASE_URL berilgan, lekin baza ulanmasa — bir necha marta urinib ko'ramiz.
// Baribir ulanmasa server ishga tushmaydi: aks holda buyurtmalar jimgina vaqtinchalik
// db.json ga yozilib, server qayta ishga tushganda yo'qolardi.
async function initDatabaseWithRetry(attempts = 5) {
  if (!process.env.DATABASE_URL) {
    console.log("ℹ️ DATABASE_URL topilmadi. Lokal db.json ishlatilmoqda.");
    return false;
  }
  for (let i = 1; i <= attempts; i++) {
    try {
      return await initDatabase();
    } catch (err) {
      if (i === attempts) break;
      const waitMs = 2000 * i;
      console.log(`   ${i}/${attempts}-urinish muvaffaqiyatsiz. ${waitMs / 1000} soniyadan keyin qayta urinamiz...`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  console.error("❌ PostgreSQL ga ulanib bo'lmadi. DATABASE_URL ni tekshiring (Supabase: Session pooler manzili).");
  process.exit(1);
}

// --- 3. MA'LUMOTLARNI BOSHQARISh (DB ABSTRACTION) ---
// Qoida: DATABASE_URL berilgan bo'lsa, yagona manba — PostgreSQL. Uning xatolari yutilmaydi:
// so'rov xato bilan tugaydi (500), ma'lumot esa jimgina o'chib ketadigan db.json ga yozilmaydi.
// DATABASE_URL bo'lmasa — lokal db.json.
function pg() {
  return isPgConnected ? pgPool : null;
}

async function getAllBookings() {
  const pool = pg();
  if (pool) {
    const res = await pool.query('SELECT data FROM bookings ORDER BY created_at DESC');
    return res.rows.map(r => r.data);
  }
  return (readDb().bookings) || [];
}

async function saveBookingToDb(booking) {
  const pool = pg();
  if (pool) {
    await pool.query(
      'INSERT INTO bookings (id, data, created_at, updated_at) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = $4',
      [booking.id, JSON.stringify(booking), booking.createdAt || new Date().toISOString(), new Date().toISOString()]
    );
    return booking;
  }
  const db = readDb();
  db.bookings = db.bookings || [];
  const existingIdx = db.bookings.findIndex(b => b.id === booking.id);
  if (existingIdx >= 0) db.bookings[existingIdx] = booking;
  else db.bookings.unshift(booking);
  writeDbOrThrow(db);
  return booking;
}

async function updateBookingStatusInDb(id, newStatus) {
  const updatedAt = new Date().toISOString();
  const pool = pg();
  if (pool) {
    // Tranzaksiya + FOR UPDATE: o'qib-yozish orasida boshqa o'zgarish yo'qolmaydi
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query('SELECT data FROM bookings WHERE id = $1 FOR UPDATE', [id]);
      if (!res.rows.length) {
        await client.query('ROLLBACK');
        return null;
      }
      const updated = { ...res.rows[0].data, status: newStatus, updatedAt };
      await client.query(
        'UPDATE bookings SET data = $1, updated_at = $2 WHERE id = $3',
        [JSON.stringify(updated), updatedAt, id]
      );
      await client.query('COMMIT');
      return updated;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  }
  const db = readDb();
  const localB = (db.bookings || []).find(b => b.id === id);
  if (!localB) return null;
  localB.status = newStatus;
  localB.updatedAt = updatedAt;
  writeDbOrThrow(db);
  return localB;
}

async function deleteBookingFromDb(id) {
  const pool = pg();
  if (pool) {
    await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
    return true;
  }
  const db = readDb();
  db.bookings = (db.bookings || []).filter(b => b.id !== id);
  writeDbOrThrow(db);
  return true;
}

const DEFAULT_SETTINGS = { exchangeRate: 12800, telegram: {}, adminPassword: DEFAULT_ADMIN_PASSWORD };

async function getSettingsFromDb() {
  const pool = pg();
  if (pool) {
    const res = await pool.query('SELECT data FROM settings WHERE key = $1', ['main']);
    if (res.rows.length > 0) return res.rows[0].data;
  }
  return (readDb().settings) || { ...DEFAULT_SETTINGS };
}

async function saveSettingsToDb(newSettings) {
  const current = await getSettingsFromDb();
  const merged = { ...current, ...newSettings };

  const pool = pg();
  if (pool) {
    await pool.query(
      'INSERT INTO settings (key, data, updated_at) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = $3',
      ['main', JSON.stringify(merged), new Date().toISOString()]
    );
    return merged;
  }
  const db = readDb();
  db.settings = merged;
  writeDbOrThrow(db);
  return merged;
}

async function getToursFromDb() {
  const pool = pg();
  if (pool) {
    const res = await pool.query('SELECT data FROM tours ORDER BY created_at ASC, id ASC');
    return res.rows.map(r => r.data);
  }
  return (readDb().tours) || [];
}

async function saveTourToDb(tour) {
  const pool = pg();
  if (pool) {
    // Yangi tur ro'yxat oxiriga qo'shiladi (created_at = NOW()), mavjudining o'rni o'zgarmaydi
    await pool.query(
      'INSERT INTO tours (id, data, updated_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = $3',
      [tour.id, JSON.stringify(tour), new Date().toISOString()]
    );
    return tour;
  }
  const db = readDb();
  db.tours = db.tours || [];
  const idx = db.tours.findIndex(t => t.id === tour.id);
  if (idx >= 0) db.tours[idx] = tour;
  else db.tours.push(tour);
  writeDbOrThrow(db);
  return tour;
}

// Barcha turlarni bitta ro'yxat bilan almashtirish (admin: "standart holatga qaytarish")
async function replaceAllToursInDb(tours) {
  const pool = pg();
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM tours');
      const base = Date.now();
      for (let i = 0; i < tours.length; i++) {
        await client.query(
          'INSERT INTO tours (id, data, created_at, updated_at) VALUES ($1, $2, $3, $3)',
          [tours[i].id, JSON.stringify(tours[i]), new Date(base + i).toISOString()]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
    return tours;
  }
  const db = readDb();
  db.tours = tours;
  writeDbOrThrow(db);
  return tours;
}

// --- 3.1 TUR MA'LUMOTLARINI TEKSHIRISH VA NARX HISOBLASH ---
const PRICE_FIELDS = ['basePricePerPerson', 'hotelPricePerNight', 'guidePricePerDay'];
const MIN_DAYS = 1, MAX_DAYS = 4;      // booking.html da 1–4 kunlik tugmalar
const MAX_ADULTS = 30, MAX_CHILDREN = 20; // booking.js dagi cheklovlar bilan bir xil

function validateTour(tour) {
  if (!tour || typeof tour !== 'object' || Array.isArray(tour)) return "Tur ma'lumotlari to'liq emas";
  if (typeof tour.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(tour.id)) return "Tur ID noto'g'ri";
  for (const field of PRICE_FIELDS) {
    if (tour[field] === undefined) continue;
    const n = Number(tour[field]);
    if (!Number.isFinite(n) || n < 0 || n > 1e10) return `Narx noto'g'ri: ${field}`;
    tour[field] = Math.round(n);
  }
  return null;
}

function toInt(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : NaN;
}

// booking.js dagi calculateBookingPrice() bilan aynan bir xil formula.
// Ikkalasini birga o'zgartiring, aks holda mijoz ko'rgan narx bilan saqlangan narx farq qiladi.
function calculateTourPrice(tour, { durationDays, adults, children, withHotel, withGuide }) {
  const nights = Math.max(0, durationDays - 1);

  let dayFactor = 1;
  if (durationDays === 2) dayFactor = 1.85;
  if (durationDays === 3) dayFactor = 2.65;
  if (durationDays === 4) dayFactor = 3.4;

  const basePricePerPerson = tour.basePricePerPerson || 350000;
  const personBase = (adults * basePricePerPerson) + (children * basePricePerPerson * 0.5);
  const baseTotal = Math.round(personBase * dayFactor);

  const hotelPricePerNight = tour.hotelPricePerNight || 450000;
  const roomsCount = Math.ceil((adults + children) / 2);
  const hotelTotal = (withHotel && nights > 0) ? (hotelPricePerNight * nights * roomsCount) : 0;

  const guidePricePerDay = tour.guidePricePerDay || 200000;
  const guideTotal = withGuide ? (guidePricePerDay * durationDays) : 0;

  return { nights, totalPrice: baseTotal + hotelTotal + guideTotal };
}

// Buyurtmadagi tur va parametrlarni tekshirib, narxni serverda qayta hisoblaydi.
// Xato bo'lsa { error } qaytaradi.
async function priceBooking(data) {
  const tours = await getToursFromDb();
  const tour = tours.find(t => t.id === data.tourId);
  if (!tour) return { error: "Tanlangan tur topilmadi" };

  const durationDays = toInt(data.durationDays);
  const adults = toInt(data.adults);
  const children = data.children === undefined ? 0 : toInt(data.children);

  if (!(durationDays >= MIN_DAYS && durationDays <= MAX_DAYS)) return { error: "Davomiylik noto'g'ri" };
  if (!(adults >= 1 && adults <= MAX_ADULTS)) return { error: "Kattalar soni noto'g'ri" };
  if (!(children >= 0 && children <= MAX_CHILDREN)) return { error: "Bolalar soni noto'g'ri" };

  const withHotel = data.hotelOption === "Otel bilan";
  const withGuide = data.guideOption === "Gid bilan";
  const { nights, totalPrice } = calculateTourPrice(tour, { durationDays, adults, children, withHotel, withGuide });

  const title = tour.title && typeof tour.title === 'object' ? (tour.title.uz || '') : (tour.title || '');
  return { tour, durationDays, adults, children, nights, totalPrice, tourTitle: title };
}

async function deleteTourFromDb(id) {
  const pool = pg();
  if (pool) {
    await pool.query('DELETE FROM tours WHERE id = $1', [id]);
    return true;
  }
  const db = readDb();
  db.tours = (db.tours || []).filter(t => t.id !== id);
  writeDbOrThrow(db);
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

// --- 4.1 EMAIL (SMTP) XABARLARI ---
async function sendEmailMessage({ to, subject, message, html, smtpConfig }) {
  const settings = await getSettingsFromDb();
  const dbEmailCfg = (settings && settings.email) ? settings.email : {};
  const emailCfg = (smtpConfig && smtpConfig.host) ? smtpConfig : dbEmailCfg;

  const host = emailCfg.host || emailCfg.smtpHost || process.env.SMTP_HOST;
  const port = parseInt(emailCfg.port || emailCfg.smtpPort || process.env.SMTP_PORT || "587", 10);
  const user = emailCfg.user || emailCfg.smtpUser || process.env.SMTP_USER;
  const pass = emailCfg.pass || emailCfg.smtpPass || process.env.SMTP_PASS;
  const senderName = emailCfg.senderName || process.env.SMTP_SENDER_NAME || "Aureon Travel";
  const fromEmail = emailCfg.fromEmail || emailCfg.user || emailCfg.smtpUser || process.env.SMTP_FROM || user;
  const isEnabled = emailCfg.enabled !== false;

  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

  if (!isEnabled || !host || !user || !pass) {
    return {
      success: false,
      smtpConfigured: false,
      error: "SMTP server sozlanmagan. Xatni pochta dasturi (Gmail/Outlook) orqali yuborishingiz mumkin.",
      mailtoUrl: mailtoUrl
    };
  }

  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (e) {
    return {
      success: false,
      smtpConfigured: false,
      error: "Nodemailer moduli o'rnatilmagan.",
      mailtoUrl: mailtoUrl
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465,
      auth: {
        user: user,
        pass: pass
      },
      // SMTP server sertifikati tekshiriladi: aks holda tarmoqdagi begona server o'zini pochta serveri
      // qilib ko'rsatib, login/parolni va xatlarni ushlab olishi mumkin edi. Gmail, Brevo, Resend kabi
      // xizmatlarda bu muammosiz ishlaydi. Faqat o'z-o'zidan imzolangan sertifikatli shaxsiy SMTP server
      // uchun SMTP_ALLOW_SELF_SIGNED=true muhit o'zgaruvchisi bilan o'chirish mumkin.
      tls: {
        rejectUnauthorized: process.env.SMTP_ALLOW_SELF_SIGNED !== 'true'
      }
    });

    const formattedHtml = html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background: #0f172a; padding: 24px; text-align: center; color: white;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 22px;">✈️ AUREON TRAVEL</h1>
          <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">O'zbekiston Bo'ylab Eksklyuziv Sayohatlar</p>
        </div>
        <div style="padding: 28px 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          © 2026 Aureon Travel. Telefon: +998 90 123 45 67 | <a href="https://aureon-travel.onrender.com" style="color: #d97706;">aureon-travel.onrender.com</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${senderName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      text: message,
      html: formattedHtml
    });

    return { success: true, message: "Email xabari muvaffaqiyatli jo'natildi!" };
  } catch (err) {
    return {
      success: false,
      smtpConfigured: true,
      error: err.message,
      mailtoUrl: mailtoUrl
    };
  }
}

// --- 5. EXPRESS ILOVASI VA REST API ROUTELAR ---
let app;
try {
  const express = require('express');
  const cors = require('cors');

  app = express();

  // Express 4 async handlerlardagi xatolarni o'zi ushlamaydi (server qulab tushadi).
  // Barcha route handlerlarni o'raymiz: xato bo'lsa pastdagi xato middleware'iga uzatiladi.
  for (const method of ['get', 'post', 'put', 'patch', 'delete', 'all']) {
    const original = app[method].bind(app);
    app[method] = (routePath, ...handlers) => {
      if (handlers.length === 0) return original(routePath); // app.get('sozlama')
      return original(routePath, ...handlers.map(h => (typeof h === 'function' && h.length < 4)
        ? (req, res, next) => {
            try {
              const result = h(req, res, next);
              if (result && typeof result.catch === 'function') result.catch(next);
            } catch (err) {
              next(err);
            }
          }
        : h));
    };
  }

  // Xavfsizlik sarlavhalari. (Content-Security-Policy qo'yilmadi: sahifalar Tailwind CDN va
  // inline skriptlardan foydalanadi, qat'iy CSP ularni buzadi.)
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',          // saytni begona sahifaga yashirincha joylashtirib bo'lmaydi
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    });
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.set('Strict-Transport-Security', 'max-age=15552000');
    }
    next();
  });

  app.use(cors());
  // Eng katta so'rov — barcha turlarni saqlash (~40 KB). 1 MB yetarli; avvalgi 10 MB ommaviy
  // so'rovlar orqali serverni katta hajmli ma'lumot bilan band qilishga imkon berardi.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Statik fayllarni tarqatish: faqat ruxsat berilgan sahifa va skriptlar.
  // (Avval butun papka ochiq edi va /data/db.json parol va tokenlar bilan yuklab olinardi.)
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  app.get('/:file', (req, res, next) => {
    if (!PUBLIC_FILES.has(req.params.file)) return next();
    res.sendFile(path.join(__dirname, req.params.file));
  });

  // 1. Health check & status
  // Health check. PostgreSQL rejimida bazaga haqiqiy so'rov (SELECT 1) yuboradi:
  // - tashqi monitor (UptimeRobot) uni muntazam so'rab tursa, Supabase bepul loyihasi
  //   "faolsiz" deb to'xtatilmaydi, Render serveri ham uxlab qolmaydi;
  // - baza javob bermasa 503 qaytadi, monitor buni darhol xabar qiladi.
  app.get('/api/status', async (req, res) => {
    const body = {
      status: "ok",
      app: "Aureon Travel Backend",
      database: isPgConnected ? "PostgreSQL (Supabase)" : "Local JSON (db.json)",
      persistent: isPgConnected || !process.env.RENDER,
      time: new Date().toISOString()
    };
    res.set('Cache-Control', 'no-store');

    const pool = pg();
    if (pool) {
      const started = Date.now();
      try {
        await Promise.race([
          pool.query('SELECT 1'),
          new Promise((_, reject) => setTimeout(() => reject(new Error("5 soniyada javob bermadi")), 5000))
        ]);
        body.databaseOk = true;
        body.databaseLatencyMs = Date.now() - started;
      } catch (err) {
        console.error("❌ Health check: baza javob bermadi:", err.message);
        return res.status(503).json({ ...body, status: "error", databaseOk: false });
      }
    }
    res.json(body);
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

  app.post('/api/tours', requireAdmin, async (req, res) => {
    const tourData = req.body;
    const err = validateTour(tourData);
    if (err) return res.status(400).json({ error: err });
    const saved = await saveTourToDb(tourData);
    res.json({ success: true, tour: saved });
  });

  // Barcha turlarni almashtirish (admin: standart holatga qaytarish)
  app.put('/api/tours', requireAdmin, async (req, res) => {
    const list = req.body;
    if (!Array.isArray(list) || list.length === 0) {
      return res.status(400).json({ error: "Turlar ro'yxati bo'sh" });
    }
    const ids = new Set();
    for (const t of list) {
      const err = validateTour(t);
      if (err) return res.status(400).json({ error: err });
      if (ids.has(t.id)) return res.status(400).json({ error: `Takroriy tur ID: ${t.id}` });
      ids.add(t.id);
    }
    const saved = await replaceAllToursInDb(list);
    res.json({ success: true, tours: saved });
  });

  app.delete('/api/tours/:id', requireAdmin, async (req, res) => {
    await deleteTourFromDb(req.params.id);
    res.json({ success: true });
  });

  // 3. BUYURTMALAR (BOOKINGS)
  app.get('/api/bookings', requireAdmin, async (req, res) => {
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
  app.get('/api/bookings/lookup', lookupLimiter, async (req, res) => {
    const q = req.query.query ? req.query.query.trim().toLowerCase() : "";
    if (!q) return res.json([]);

    const cleanQ = q.replace(/\D/g, '');
    const all = await getAllBookings();

    const results = all.filter(b => {
      const matchId = b.id && b.id.toLowerCase() === q;
      // Telefon bo'yicha faqat to'liq raqam (kamida 9 ta oxirgi raqam) mos kelsa — begona buyurtmalarni topib bo'lmasin
      const matchPhone = cleanQ.length >= 9 && b.guestPhone && b.guestPhone.replace(/\D/g, '').endsWith(cleanQ);
      const matchEmail = (b.guestEmail && b.guestEmail.toLowerCase() === q) || (b.email && b.email.toLowerCase() === q);
      return matchId || matchPhone || matchEmail;
    }).map(b => ({
      id: b.id,
      tourId: b.tourId,
      tourTitle: b.tourTitleLocalized || b.tourTitle,
      startDate: b.startDate,
      startTime: b.startTime,
      durationDays: b.durationDays,
      nights: b.nights,
      status: b.status,
      totalPrice: b.totalPrice,
      // Ommaviy javob: to'liq ism va email qaytarilmaydi (begona odam ID/telefonni bilsa ham)
      guestName: maskName(b.guestName),
      createdAt: b.createdAt
    }));

    res.json(results);
  });

  // Yangi buyurtma qabul qilish (Public POST)
  app.post('/api/bookings', bookingLimiter, async (req, res) => {
    const data = sanitizePublicBooking(req.body);

    if (!data.guestName || !data.guestPhone) {
      return res.status(400).json({ error: "Ism va telefon raqami talab qilinadi" });
    }

    // Narx, tur nomi va sonlarni serverdagi tur narxlari bo'yicha qayta hisoblaymiz:
    // brauzerdan kelgan totalPrice ga ishonilmaydi.
    const priced = await priceBooking(data);
    if (priced.error) {
      return res.status(400).json({ error: priced.error });
    }

    // ID, holat va vaqtni faqat server belgilaydi: mijoz mavjud buyurtmani ustidan yoza olmasin
    // yoki o'z buyurtmasini "Tasdiqlandi" qilib yubora olmasin.
    const bookingId = generateBookingId(await getAllBookings());
    const newBooking = {
      ...data,
      tourTitle: priced.tourTitle || data.tourTitle,
      durationDays: priced.durationDays,
      nights: priced.nights,
      adults: priced.adults,
      children: priced.children,
      totalPrice: priced.totalPrice,
      id: bookingId,
      status: "Yangi",
      createdAt: new Date().toISOString()
    };
    delete newBooking.updatedAt;

    await saveBookingToDb(newBooking);

    // Telegram botga yuborish (Server-side)
    const settings = await getSettingsFromDb();
    const tg = settings && settings.telegram ? settings.telegram : {};
    if (tg.enabled && tg.botToken && tg.chatId) {
      const sumFormatted = new Intl.NumberFormat('uz-UZ').format(newBooking.totalPrice || 0);
      const e = escapeTgHtml;
      const tgText =
`🔔 <b>YANGI ARIZA TUSHDI!</b> (Aureon Travel)

📋 <b>ID:</b> #${e(newBooking.id)}
👤 <b>Mijoz:</b> ${e(newBooking.guestName)}
📞 <b>Telefon:</b> ${e(newBooking.guestPhone)}
📧 <b>Email:</b> ${e(newBooking.guestEmail || newBooking.email || '-')}
📍 <b>Manzil:</b> ${e(newBooking.pickupLocation || newBooking.roomNumber || '-')}

🗺 <b>Tur:</b> ${e(newBooking.tourTitleLocalized || newBooking.tourTitle || '-')}
📅 <b>Sana:</b> ${e(newBooking.startDate)} | 🕒 ${e(newBooking.startTime || '09:00')}
⏳ <b>Davomiyligi:</b> ${e(newBooking.durationDays)} kun (${e(newBooking.nights || 0)} kecha)
👥 <b>Odamlar:</b> ${e(newBooking.adults)} nafar katta, ${e(newBooking.children || 0)} nafar bola
🏨 <b>Otel:</b> ${e(newBooking.hotelOption || '-')}
🗣 <b>Gid:</b> ${e(newBooking.guideOption || '-')} (${e(newBooking.guideLanguage || 'uz')})
💬 <b>Izoh:</b> ${e(newBooking.guestNote || newBooking.note || "Yo'q")}

💰 <b>Jami hisob:</b> <b>${sumFormatted} so'm</b>
📌 <b>Holati:</b> ⏳ Yangi`;

      sendTelegramMessage(tg.botToken, tg.chatId, tgText).catch(e => console.error("TG xatolik:", e));
    }

    res.status(201).json({ success: true, booking: newBooking });
  });

  // Buyurtma holatini yangilash (Admin PATCH)
  app.patch('/api/bookings/:id/status', requireAdmin, async (req, res) => {
    const { status } = req.body;
    const bId = req.params.id;
    if (typeof status !== 'string' || !status.trim() || status.length > 50) {
      return res.status(400).json({ error: "Holat noto'g'ri" });
    }

    const booking = await updateBookingStatusInDb(bId, status);
    if (!booking) {
      return res.status(404).json({ error: "Buyurtma topilmadi" });
    }

    // Status o'zgarganda Telegramga xabar berish
    const settings = await getSettingsFromDb();
    const tg = settings && settings.telegram ? settings.telegram : {};
    if (tg.enabled && tg.botToken && tg.chatId) {
      const statusIcon = status === "Tasdiqlandi" ? "✅" : status === "Bekor qilindi" ? "❌" : "⏳";
      const e = escapeTgHtml;
      const tgText =
`${statusIcon} <b>BUYURTMA HOLATI O'ZGARDI</b>

📋 <b>ID:</b> #${e(booking.id)}
👤 <b>Mijoz:</b> ${e(booking.guestName)}
📞 <b>Tel:</b> ${e(booking.guestPhone)}
📧 <b>Email:</b> ${e(booking.guestEmail || booking.email || '-')}
🗺 <b>Tur:</b> ${e(booking.tourTitleLocalized || booking.tourTitle)}
📅 <b>Sana:</b> ${e(booking.startDate)} (${e(booking.startTime || '09:00')})
📍 <b>Olib ketish:</b> ${e(booking.pickupLocation || booking.roomNumber || '-')}

📌 <b>Yangi status:</b> <b>${e(status)}</b>
🕒 <b>Vaqti:</b> ${new Date().toLocaleTimeString()}`;

      sendTelegramMessage(tg.botToken, tg.chatId, tgText).catch(e => console.error("TG xatolik:", e));
    }

    res.json({ success: true, booking });
  });

  // Buyurtmani o'chirish
  app.delete('/api/bookings/:id', requireAdmin, async (req, res) => {
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

  app.get('/api/settings/admin', requireAdmin, async (req, res) => {
    const s = await getSettingsFromDb();
    res.json(withoutSecrets(s));
  });

  app.post('/api/settings', requireAdmin, async (req, res) => {
    const newSettings = { ...(req.body || {}) };
    // Parol bu yerdan o'zgartirilmaydi (ADMIN_PASSWORD muhit o'zgaruvchisi orqali)
    delete newSettings.adminPassword;
    const updated = await saveSettingsToDb(newSettings);
    res.json({ success: true, settings: withoutSecrets(updated) });
  });

  // Telegram ulanishini test qilish
  app.post('/api/telegram/test', requireAdmin, async (req, res) => {
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

  // Mijozga Email yuborish (Admin POST)
  app.post('/api/send-email', requireAdmin, async (req, res) => {
    const { to, subject, message, bookingId, smtpConfig } = req.body;
    if (!to || !subject || !message) {
      return res.status(400).json({ error: "Qabul qiluvchi email, mavzu va xat matni kiritilishi shart" });
    }

    try {
      const result = await sendEmailMessage({ to, subject, message, smtpConfig });
      if (result.success) {
        res.json({ success: true, message: "Email xati muvaffaqiyatli jo'natildi!" });
      } else {
        res.json({
          success: false,
          smtpConfigured: result.smtpConfigured,
          error: result.error,
          mailtoUrl: result.mailtoUrl
        });
      }
    } catch (err) {
      console.error("Email yuborishda xatolik:", err.message);
      res.status(500).json({
        success: false,
        error: err.message,
        mailtoUrl: `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
      });
    }
  });

  // Email (SMTP) ulanishini test qilish
  app.post('/api/email/test', requireAdmin, async (req, res) => {
    const { testEmail, smtpConfig } = req.body;
    if (!testEmail) {
      return res.status(400).json({ error: "Test uchun email manzili kiritilmadi" });
    }

    try {
      const result = await sendEmailMessage({
        to: testEmail,
        subject: "✈️ Aureon Travel - Test Email Xabari",
        message: `Salom! Bu Aureon Travel tizimidan test xabari.\n\nSizning SMTP serveringiz muvaffaqiyatli ulandi va faol holatda! ✅\nVaqti: ${new Date().toLocaleString()}`,
        smtpConfig: smtpConfig
      });

      if (result.success) {
        res.json({ success: true, message: `Test xati ${testEmail} manziliga yetkazildi!` });
      } else {
        res.status(400).json({ success: false, error: result.error || "SMTP server ulanmadi" });
      }
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Admin login tekshirish
  app.post('/api/admin/login', async (req, res) => {
    const ip = getClientIp(req);
    if (isLoginBlocked(ip)) {
      return res.status(429).json({ success: false, error: "Juda ko'p noto'g'ri urinish. 15 daqiqadan keyin qayta urinib ko'ring." });
    }

    const password = typeof (req.body || {}).password === 'string' ? req.body.password : '';
    const s = await getSettingsFromDb();
    const correctPassword = process.env.ADMIN_PASSWORD || s.adminPassword || DEFAULT_ADMIN_PASSWORD;

    // Standart "admin" paroli bilan faqat shu kompyuterdan (localhost) kirish mumkin.
    // Internetga joylashtirilganda ADMIN_PASSWORD o'rnatilishi shart.
    if (correctPassword === DEFAULT_ADMIN_PASSWORD && !isLocalRequest(req)) {
      return res.status(403).json({
        success: false,
        error: "Standart parol bilan internet orqali kirish taqiqlangan. Serverda ADMIN_PASSWORD muhit o'zgaruvchisini o'rnating."
      });
    }

    if (password && safeEqual(password, correctPassword)) {
      loginFailures.delete(ip);
      res.json({ success: true, token: createAdminToken(), expiresInMs: SESSION_TTL_MS });
    } else {
      recordLoginFailure(ip);
      res.status(401).json({ success: false, error: "Parol noto'g'ri" });
    }
  });

  // Noma'lum API manzillari uchun JSON 404 (index.html qaytarmaslik uchun)
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: "API manzili topilmadi" });
  });

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  // Umumiy xato ishlovchisi: baza yoki fayl xatosida mijozga "muvaffaqiyatli" deyilmaydi
  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: "So'rov formati noto'g'ri (JSON)" });
    }
    if (err && err.type === 'entity.too.large') {
      return res.status(413).json({ error: "So'rov hajmi juda katta" });
    }
    console.error(`❌ ${req.method} ${req.path} xatolik:`, err && err.message);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: "Serverda xatolik yuz berdi. Ma'lumot saqlanmadi, birozdan keyin qayta urinib ko'ring." });
  });

} catch (e) {
  console.log("Express moduli topilmadi:", e.message);
}

// 6. Serverni ishga tushirish
if (app) {
  initDatabaseWithRetry().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log("==================================================");
      console.log(`  ✈️  AUREON TRAVEL BACKEND ISHGA TUSHDI!`);
      console.log(`  🚀 Port: ${PORT}`);
      console.log(`  🗄  Ma'lumotlar bazasi: ${isPgConnected ? 'PostgreSQL (Supabase)' : 'Lokal JSON (db.json)'}`);
      console.log(`  👉 Bosh sahifa: http://localhost:${PORT}/index.html`);
      console.log(`  👉 Admin panel: http://localhost:${PORT}/admin.html`);
      console.log("==================================================");
      if (process.env.RENDER && !isPgConnected) {
        console.warn("🚨 DIQQAT: Render'da DATABASE_URL o'rnatilmagan!");
        console.warn("   Buyurtmalar va sozlamalar har qayta ishga tushishda (deploy, uyqu) O'CHIB KETADI.");
        console.warn("   Supabase bazasini ulang: README.md dagi 'Ma'lumotlar bazasi' bo'limiga qarang.");
      }
      getSettingsFromDb().then(s => {
        if (!process.env.ADMIN_PASSWORD && (!s.adminPassword || s.adminPassword === DEFAULT_ADMIN_PASSWORD)) {
          console.warn("⚠️  Admin paroli standart (\"admin\"). Unga faqat shu kompyuterdan kirish mumkin.");
          console.warn("   Internetga joylashtirishdan oldin ADMIN_PASSWORD muhit o'zgaruvchisini o'rnating.");
        }
      }).catch(() => {});
    });
  });
}
