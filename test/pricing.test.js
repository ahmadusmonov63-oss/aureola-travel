// Narx formulasi (pricing.js) va turlar ma'lumotining yaxlitligi
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const pricing = require('../pricing');
const ROOT = path.join(__dirname, '..');

const TOUR = { basePricePerPerson: 350000, hotelPricePerNight: 450000, guidePricePerDay: 200000 };

test('2 kun, 2 katta, otel va gid bilan', () => {
  const r = pricing.calculate(TOUR, { durationDays: 2, adults: 2, children: 0, withHotel: true, withGuide: true });
  // asosiy: 2 x 350 000 x 1.85 = 1 295 000; otel: 450 000 x 1 kecha x 1 xona; gid: 200 000 x 2 kun
  assert.equal(r.baseTotal, 1295000);
  assert.equal(r.hotelTotal, 450000);
  assert.equal(r.guideTotal, 400000);
  assert.equal(r.totalPrice, 2145000);
  assert.equal(r.nights, 1);
});

test('1 kunlik turda otel narxi qo\'shilmaydi (kecha yo\'q)', () => {
  const r = pricing.calculate(TOUR, { durationDays: 1, adults: 1, withHotel: true, withGuide: true });
  assert.equal(r.nights, 0);
  assert.equal(r.hotelTotal, 0);
  assert.equal(r.totalPrice, 350000 + 200000);
});

test('bolalar 50% narxda, 3 kunlik koeffitsiyent 2.65', () => {
  const r = pricing.calculate(TOUR, { durationDays: 3, adults: 2, children: 1, withHotel: false, withGuide: false });
  assert.equal(r.totalPrice, Math.round((2 * 350000 + 0.5 * 350000) * 2.65));
});

test('xonalar soni yuqoriga yaxlitlanadi (3 kishi = 2 xona), 4 kun = 3.4', () => {
  const r = pricing.calculate(TOUR, { durationDays: 4, adults: 3, children: 0, withHotel: true, withGuide: false });
  assert.equal(r.roomsCount, 2);
  assert.equal(r.baseTotal, Math.round(3 * 350000 * 3.4));
  assert.equal(r.hotelTotal, 450000 * 3 * 2);
});

test('turda narx bo\'lmasa standart narxlar ishlatiladi', () => {
  const opts = { durationDays: 2, adults: 2, withHotel: true, withGuide: true };
  assert.deepEqual(pricing.calculate({}, opts), pricing.calculate(TOUR, opts));
});

test('noma\'lum kun soni uchun koeffitsiyent 1', () => {
  const r = pricing.calculate(TOUR, { durationDays: 5, adults: 1, withHotel: false, withGuide: false });
  assert.equal(r.dayFactor, 1);
});

test('brauzerda ham aynan shu formula ishlaydi (window.AureonPricing)', () => {
  const sandbox = { self: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'pricing.js'), 'utf-8'), sandbox);
  const browser = sandbox.self.AureonPricing;
  assert.ok(browser, 'AureonPricing brauzer globaliga qo\'shilmadi');
  for (const durationDays of [1, 2, 3, 4]) {
    for (const withHotel of [true, false]) {
      const opts = { durationDays, adults: 2, children: 1, withHotel, withGuide: !withHotel };
      assert.equal(browser.calculate(TOUR, opts).totalPrice, pricing.calculate(TOUR, opts).totalPrice);
    }
  }
});

test('booking.html pricing.js ni booking.js dan oldin yuklaydi', () => {
  const html = fs.readFileSync(path.join(ROOT, 'booking.html'), 'utf-8');
  const p = html.indexOf('src="pricing.js');
  const b = html.indexOf('src="booking.js');
  assert.ok(p > 0 && b > p, 'pricing.js skripti booking.js dan oldin ulanmagan');
});

test('server turlari (db.json) va brauzer zaxira turlari (data.js) bir xil', () => {
  const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'db.json'), 'utf-8')).tours;
  const dataJs = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf-8');
  const ctx = vm.createContext({ console });
  const defaults = vm.runInContext(dataJs + '\n;DEFAULT_TOURS', ctx);
  assert.deepEqual(JSON.parse(JSON.stringify(defaults)), seed,
    "data.js dagi DEFAULT_TOURS va data/db.json dagi turlar farq qiladi — ikkalasini birga yangilang");
});

test('har bir turda to\'g\'ri ID va musbat narxlar bor', () => {
  const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'db.json'), 'utf-8')).tours;
  assert.ok(seed.length > 0);
  for (const t of seed) {
    assert.match(t.id, /^[A-Za-z0-9_-]{1,64}$/);
    for (const f of ['basePricePerPerson', 'hotelPricePerNight', 'guidePricePerDay']) {
      assert.ok(Number.isFinite(t[f]) && t[f] > 0, `${t.id}.${f} noto'g'ri`);
    }
  }
});
