// API testlari: haqiqiy Express server, lokal JSON rejimi (vaqtinchalik papkada)
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { setupEnv, startServer, api, login, nextIp, sampleBooking } = require('./helpers');

const dataDir = setupEnv();
let ctx, base, token;

before(async () => {
  ctx = await startServer();
  base = ctx.base;
  token = await login(base);
});
after(async () => { await ctx.close(); });

describe('ommaviy sahifalar va fayllar', () => {
  test('sahifalar, skriptlar va CSS beriladi', async () => {
    for (const [p, type] of [['/', 'text/html'], ['/booking.html', 'text/html'], ['/admin.html', 'text/html'],
      ['/pricing.js', 'javascript'], ['/styles.css', 'text/css']]) {
      const r = await api(base, 'GET', p);
      assert.equal(r.status, 200, p);
      assert.ok(r.headers.get('content-type').includes(type), `${p}: ${r.headers.get('content-type')}`);
    }
  });

  test('maxfiy fayllar (db.json, server.js, package.json) berilmaydi', async () => {
    for (const p of ['/data/db.json', '/data/db.local.json', '/server.js', '/package.json', '/.gitignore']) {
      const r = await api(base, 'GET', p);
      assert.ok(!r.text.includes('"adminPassword"'), `${p} parolni oshkor qildi`);
      assert.ok(!r.text.includes('require('), `${p} server kodini oshkor qildi`);
    }
  });

  test('xavfsizlik sarlavhalari bor, X-Powered-By yo\'q', async () => {
    const r = await api(base, 'GET', '/');
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(r.headers.get('x-powered-by'), null);
  });

  test('status va turlar', async () => {
    const s = await api(base, 'GET', '/api/status');
    assert.equal(s.status, 200);
    assert.equal(s.json.database, 'Local JSON (db.json)');
    const t = await api(base, 'GET', '/api/tours');
    assert.equal(t.json.length, 6);
    assert.equal(t.json[0].id, 'toshkent');
  });

  test('noma\'lum API manzili JSON 404 qaytaradi', async () => {
    const r = await api(base, 'GET', '/api/yoq');
    assert.equal(r.status, 404);
    assert.ok(r.json.error);
  });
});

describe('admin autentifikatsiyasi', () => {
  const protectedRoutes = [
    ['GET', '/api/bookings'], ['GET', '/api/settings/admin'], ['POST', '/api/settings'],
    ['POST', '/api/tours'], ['PUT', '/api/tours'], ['DELETE', '/api/tours/x'],
    ['PATCH', '/api/bookings/x/status'], ['DELETE', '/api/bookings/x'],
    ['POST', '/api/telegram/test'], ['POST', '/api/send-email'], ['POST', '/api/email/test'],
    ['GET', '/api/admin/backup'], ['GET', '/api/admin/backup/status'],
    ['POST', '/api/admin/backup/telegram'], ['POST', '/api/admin/restore']
  ];

  test('himoyalangan manzillar tokensiz 401 qaytaradi', async () => {
    for (const [m, p] of protectedRoutes) {
      const r = await api(base, m, p, m === 'GET' ? {} : { body: {} });
      assert.equal(r.status, 401, `${m} ${p}`);
    }
  });

  test('soxta token rad etiladi', async () => {
    const r = await api(base, 'GET', '/api/bookings', { token: '9999999999999.ab.cd' });
    assert.equal(r.status, 401);
  });

  test('noto\'g\'ri parol 401, to\'g\'ri parol token beradi', async () => {
    assert.equal((await api(base, 'POST', '/api/admin/login', { body: { password: 'xato' } })).status, 401);
    const r = await api(base, 'GET', '/api/bookings', { token });
    assert.equal(r.status, 200);
  });

  test('5 ta noto\'g\'ri urinishdan keyin login bloklanadi (429)', async () => {
    const ip = nextIp();
    for (let i = 0; i < 5; i++) {
      assert.equal((await api(base, 'POST', '/api/admin/login', { ip, body: { password: 'xato' } })).status, 401);
    }
    const blocked = await api(base, 'POST', '/api/admin/login', { ip, body: { password: 'Test-Parol-123' } });
    assert.equal(blocked.status, 429, 'to\'g\'ri parol bilan ham bloklangan bo\'lishi kerak');
  });

  test('standart "admin" paroli internetdan (proksi orqali) taqiqlanadi', async () => {
    const saved = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    try {
      const r = await api(base, 'POST', '/api/admin/login', { body: { password: 'admin' } });
      assert.equal(r.status, 403);
    } finally {
      process.env.ADMIN_PASSWORD = saved;
    }
  });

  test('admin sozlamalari javobida parol yo\'q va parolni API orqali o\'zgartirib bo\'lmaydi', async () => {
    const s = await api(base, 'GET', '/api/settings/admin', { token });
    assert.equal(s.json.adminPassword, undefined);
    const upd = await api(base, 'POST', '/api/settings', { token, body: { adminPassword: 'hack', exchangeRate: 12500 } });
    assert.equal(upd.status, 200);
    assert.equal(upd.json.settings.adminPassword, undefined);
    const stored = JSON.parse(fs.readFileSync(path.join(dataDir, 'db.local.json'), 'utf-8'));
    assert.notEqual(stored.settings.adminPassword, 'hack');
  });
});

describe('buyurtmalar', () => {
  test('narx serverda hisoblanadi: mijoz yuborgan narx e\'tiborga olinmaydi', async () => {
    const r = await api(base, 'POST', '/api/bookings', { body: sampleBooking({ totalPrice: 1 }) });
    assert.equal(r.status, 201);
    assert.equal(r.json.booking.totalPrice, 2145000);
    assert.equal(r.json.booking.nights, 1);
  });

  test('ID, holat va vaqtni faqat server belgilaydi', async () => {
    const r = await api(base, 'POST', '/api/bookings', {
      body: sampleBooking({ id: 'BK-HACKED', status: 'Tasdiqlandi', createdAt: '2000-01-01' })
    });
    assert.match(r.json.booking.id, /^BK-[A-HJ-NP-Z2-9]{8}$/);
    assert.equal(r.json.booking.status, 'Yangi');
    assert.notEqual(r.json.booking.createdAt, '2000-01-01');
  });

  test('XSS: mijoz ismidagi HTML saqlanmaydi', async () => {
    const r = await api(base, 'POST', '/api/bookings', { body: sampleBooking({ guestName: '<script>x</script>Ali' }) });
    assert.ok(!r.json.booking.guestName.includes('<'));
  });

  test('noto\'g\'ri ma\'lumotlar rad etiladi', async () => {
    const cases = [
      [{ guestName: '' }, /Ism/],
      [{ tourId: 'yoq' }, /topilmadi/],
      [{ durationDays: 9 }, /Davomiylik/],
      [{ adults: 0 }, /Kattalar/],
      [{ children: 99 }, /Bolalar/]
    ];
    for (const [patch, msg] of cases) {
      const r = await api(base, 'POST', '/api/bookings', { body: sampleBooking(patch) });
      assert.equal(r.status, 400, JSON.stringify(patch));
      assert.match(r.json.error, msg);
    }
  });

  test('yaroqsiz JSON 400, juda katta so\'rov 413', async () => {
    assert.equal((await api(base, 'POST', '/api/bookings', { raw: '{buzuq' })).status, 400);
    const big = JSON.stringify(sampleBooking({ note: 'x'.repeat(2 * 1024 * 1024) }));
    assert.equal((await api(base, 'POST', '/api/bookings', { raw: big })).status, 413);
  });

  test('bir IP soatiga 10 tadan ortiq buyurtma yubora olmaydi', async () => {
    const ip = nextIp();
    for (let i = 0; i < 10; i++) {
      assert.equal((await api(base, 'POST', '/api/bookings', { ip, body: sampleBooking() })).status, 201);
    }
    assert.equal((await api(base, 'POST', '/api/bookings', { ip, body: sampleBooking() })).status, 429);
  });

  test('admin: holatni o\'zgartirish va o\'chirish', async () => {
    const created = (await api(base, 'POST', '/api/bookings', { body: sampleBooking() })).json.booking;
    const upd = await api(base, 'PATCH', `/api/bookings/${created.id}/status`, { token, body: { status: 'Tasdiqlandi' } });
    assert.equal(upd.json.booking.status, 'Tasdiqlandi');
    assert.equal((await api(base, 'PATCH', '/api/bookings/BK-YOQ/status', { token, body: { status: 'X' } })).status, 404);
    assert.equal((await api(base, 'PATCH', `/api/bookings/${created.id}/status`, { token, body: {} })).status, 400);
    await api(base, 'DELETE', `/api/bookings/${created.id}`, { token });
    const list = (await api(base, 'GET', '/api/bookings', { token })).json;
    assert.ok(!list.some(b => b.id === created.id));
  });

  test('mijozlar ma\'lumoti git\'dagi data/db.json ga yozilmaydi', () => {
    const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'db.json'), 'utf-8'));
    assert.equal(seed.bookings.length, 0);
    const local = JSON.parse(fs.readFileSync(path.join(dataDir, 'db.local.json'), 'utf-8'));
    assert.ok(local.bookings.length > 0);
  });
});

describe('buyurtmani tekshirish (lookup)', () => {
  let booking;
  before(async () => {
    booking = (await api(base, 'POST', '/api/bookings', { body: sampleBooking({ guestPhone: '+998 97 111 22 33' }) })).json.booking;
  });

  test('ID bo\'yicha topiladi: ism qisqartirilgan, email va telefon yo\'q', async () => {
    const r = await api(base, 'GET', `/api/bookings/lookup?query=${booking.id}`);
    assert.equal(r.json.length, 1);
    assert.equal(r.json[0].guestName, 'Ali V.');
    assert.equal(r.json[0].nights, 1);
    assert.equal(r.json[0].guestEmail, undefined);
    assert.equal(r.json[0].guestPhone, undefined);
  });

  test('to\'liq telefon bilan topiladi, 7 ta raqam bilan topilmaydi', async () => {
    assert.ok((await api(base, 'GET', '/api/bookings/lookup?query=971112233')).json.length >= 1);
    assert.equal((await api(base, 'GET', '/api/bookings/lookup?query=1112233')).json.length, 0);
  });

  test('10 daqiqada 30 tadan ortiq so\'rov bloklanadi', async () => {
    const ip = nextIp();
    for (let i = 0; i < 30; i++) {
      assert.equal((await api(base, 'GET', `/api/bookings/lookup?query=BK-${i}`, { ip })).status, 200);
    }
    assert.equal((await api(base, 'GET', '/api/bookings/lookup?query=x', { ip })).status, 429);
  });
});

describe('turlarni boshqarish', () => {
  test('admin narxni o\'zgartirsa, yangi narx buyurtmaga ta\'sir qiladi', async () => {
    const tours = (await api(base, 'GET', '/api/tours')).json;
    const zomin = { ...tours.find(t => t.id === 'zomin'), basePricePerPerson: 600000 };
    assert.equal((await api(base, 'POST', '/api/tours', { token, body: zomin })).status, 200);
    const r = await api(base, 'POST', '/api/bookings', {
      body: sampleBooking({ tourId: 'zomin', durationDays: 1, adults: 1, hotelOption: 'Otelsiz', guideOption: 'Gidsiz' })
    });
    assert.equal(r.json.booking.totalPrice, 600000);
  });

  test('noto\'g\'ri tur ma\'lumotlari rad etiladi', async () => {
    assert.equal((await api(base, 'POST', '/api/tours', { token, body: { id: 'x', basePricePerPerson: -5 } })).status, 400);
    assert.equal((await api(base, 'PUT', '/api/tours', { token, body: [] })).status, 400);
    assert.equal((await api(base, 'PUT', '/api/tours', { token, body: [{ id: 'a' }, { id: 'a' }] })).status, 400);
  });

  test('PUT barcha turlarni almashtiradi va tartibni saqlaydi', async () => {
    const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'db.json'), 'utf-8')).tours;
    assert.equal((await api(base, 'PUT', '/api/tours', { token, body: seed })).status, 200);
    const ids = (await api(base, 'GET', '/api/tours')).json.map(t => t.id);
    assert.deepEqual(ids, seed.map(t => t.id));
  });
});

describe('zaxira nusxa', () => {
  test('JSON zaxira: buyurtmalar va turlar bor, maxfiy ma\'lumot yo\'q', async () => {
    await api(base, 'POST', '/api/settings', { token, body: { telegram: { botToken: '123:SECRET', chatId: '1', enabled: false } } });
    const r = await api(base, 'GET', '/api/admin/backup', { token });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-disposition'), /attachment; filename="aureon-zaxira-.*\.json"/);
    assert.equal(r.json.app, 'aureon-travel');
    assert.ok(r.json.bookings.length > 0);
    assert.equal(r.json.tours.length, 6);
    assert.ok(!r.text.includes('SECRET') && !r.text.includes('adminPassword'));
  });

  test('CSV zaxira Excel uchun tayyor', async () => {
    const r = await api(base, 'GET', '/api/admin/backup?format=csv', { token });
    assert.ok(r.headers.get('content-type').startsWith('text/csv'));
    assert.ok(r.text.includes('ID,Yaratilgan,Holat'));
    assert.ok(r.text.includes("'+998"), 'telefon formula sifatida bajarilmasligi kerak');
  });

  test('tiklash: o\'chirilgan buyurtmalar zaxiradan qaytadi, boshqalari o\'chmaydi', async () => {
    const backup = (await api(base, 'GET', '/api/admin/backup', { token })).json;
    const victim = backup.bookings[0];
    await api(base, 'DELETE', `/api/bookings/${victim.id}`, { token });
    const extra = (await api(base, 'POST', '/api/bookings', { body: sampleBooking() })).json.booking;

    const r = await api(base, 'POST', '/api/admin/restore', { token, body: backup });
    assert.equal(r.status, 200);
    assert.equal(r.json.restored.bookings, backup.bookings.length);

    const ids = (await api(base, 'GET', '/api/bookings', { token })).json.map(b => b.id);
    assert.ok(ids.includes(victim.id), 'o\'chirilgan buyurtma qaytmadi');
    assert.ok(ids.includes(extra.id), 'zaxiradan keyingi buyurtma o\'chib ketdi');
  });

  test('begona yoki buzilgan zaxira fayli rad etiladi', async () => {
    assert.equal((await api(base, 'POST', '/api/admin/restore', { token, body: { foo: 1 } })).status, 400);
    const bad = { app: 'aureon-travel', bookings: [{ id: '../x' }], tours: [] };
    assert.equal((await api(base, 'POST', '/api/admin/restore', { token, body: bad })).status, 400);
  });

  test('tiklash 1 MB dan katta faylni qabul qiladi (boshqa API lar qabul qilmaydi)', async () => {
    const big = JSON.stringify({ app: 'aureon-travel', bookings: [], tours: [], pad: 'x'.repeat(3 * 1024 * 1024) });
    assert.equal((await api(base, 'POST', '/api/admin/restore', { token, raw: big })).status, 200);
    assert.equal((await api(base, 'POST', '/api/settings', { token, raw: big })).status, 413);
  });

  test('Telegram sozlanmagan bo\'lsa, aniq xato qaytadi', async () => {
    await api(base, 'POST', '/api/settings', { token, body: { telegram: { botToken: '', chatId: '', enabled: false } } });
    const r = await api(base, 'POST', '/api/admin/backup/telegram', { token });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /Telegram/);
  });
});
