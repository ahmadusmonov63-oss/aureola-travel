// Testlar uchun umumiy yordamchilar.
// Har bir *.test.js fayl `node --test` da alohida jarayonda ishlaydi, shuning uchun
// server holati (baza, cheklovlar) fayllar orasida aralashmaydi.
const fs = require('fs');
const os = require('os');
const path = require('path');

const ADMIN_PASSWORD = 'Test-Parol-123';

// server.js ni require qilishdan OLDIN chaqirilishi kerak (DATA_DIR yuklanishda o'qiladi)
function setupEnv(extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aureon-test-'));
  process.env.DATA_DIR = dir;
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
  process.env.BACKUP_TELEGRAM = 'false';
  delete process.env.DATABASE_URL;
  delete process.env.RENDER;
  Object.assign(process.env, extra);
  return dir;
}

async function startServer() {
  const server = require('../server');
  await server.initDatabaseWithRetry(1);
  const srv = await new Promise((resolve) => {
    const s = server.app.listen(0, '127.0.0.1', () => resolve(s));
  });
  return {
    srv,
    base: `http://127.0.0.1:${srv.address().port}`,
    server,
    close: () => new Promise((resolve) => {
      srv.closeAllConnections();
      srv.close(() => {
        // Vaqtinchalik ma'lumot papkasini o'chirish
        if (process.env.DATA_DIR && process.env.DATA_DIR.startsWith(os.tmpdir())) {
          fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
        }
        resolve();
      });
    })
  };
}

// Har bir testga alohida "IP" — so'rov cheklovchilari testlar orasida to'qnashmasin
let ipCounter = 0;
function nextIp() {
  ipCounter += 1;
  return `10.${Math.floor(ipCounter / 65536) % 256}.${Math.floor(ipCounter / 256) % 256}.${ipCounter % 256}`;
}

async function api(base, method, urlPath, { body, token, ip, raw } = {}) {
  const headers = { 'x-forwarded-for': ip || nextIp() };
  if (token) headers.authorization = `Bearer ${token}`;
  let payload;
  if (raw !== undefined) {
    headers['content-type'] = 'application/json';
    payload = raw;
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(base + urlPath, { method, headers, body: payload });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (e) { json = undefined; }
  return { status: res.status, headers: res.headers, text, json };
}

async function login(base) {
  const r = await api(base, 'POST', '/api/admin/login', { body: { password: ADMIN_PASSWORD } });
  if (r.status !== 200) throw new Error('Login muvaffaqiyatsiz: ' + r.text);
  return r.json.token;
}

function sampleBooking(overrides = {}) {
  return {
    guestName: 'Ali Valiyev',
    guestPhone: '+998 90 123 45 67',
    guestEmail: 'ali@example.uz',
    tourId: 'toshkent',
    durationDays: 2,
    adults: 2,
    children: 0,
    hotelOption: 'Otel bilan',
    guideOption: 'Gid bilan',
    startDate: '2026-12-01',
    note: 'Sinov',
    ...overrides
  };
}

module.exports = { ADMIN_PASSWORD, setupEnv, startServer, api, login, nextIp, sampleBooking };
