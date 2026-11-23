// Xavfsizlik va yordamchi funksiyalar (server.js ichidagi)
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { setupEnv } = require('./helpers');

const dataDir = setupEnv();
const { _internal: S } = require('../server');

test('ommaviy buyurtma: HTML/atribut buzadigan belgilar olib tashlanadi, apostrof qoladi', () => {
  const clean = S.sanitizePublicBooking({
    guestName: `<img src=x onerror="alert(1)"> G'ulom`,
    note: 'Salom `test`',
    adults: 2
  });
  assert.equal(clean.guestName, "img src=x onerror=alert(1) G'ulom");
  assert.equal(clean.note, 'Salom test');
  assert.equal(clean.adults, 2);
});

test('ommaviy buyurtma: obyekt, massiv va noto\'g\'ri kalitlar tashlab yuboriladi', () => {
  const clean = S.sanitizePublicBooking({
    nested: { a: 1 }, list: [1, 2], '__proto__x': 'x', 'bad key': 'x', ok: 'ha', big: Infinity
  });
  assert.deepEqual(Object.keys(clean), ['ok']);
});

test('ommaviy buyurtma: juda uzun matn 2000 belgigacha qisqartiriladi', () => {
  assert.equal(S.sanitizePublicBooking({ note: 'a'.repeat(5000) }).note.length, 2000);
});

test('tur tekshiruvi: noto\'g\'ri ID va manfiy narx rad etiladi, narx yaxlitlanadi', () => {
  assert.match(S.validateTour({ id: '../x' }), /ID/);
  assert.match(S.validateTour({ id: 'ok', basePricePerPerson: -1 }), /Narx/);
  assert.match(S.validateTour(null), /to'liq emas/);
  const t = { id: 'yangi_tur', basePricePerPerson: '400000.6' };
  assert.equal(S.validateTour(t), null);
  assert.equal(t.basePricePerPerson, 400001);
});

test('ism qisqartirish: "Ali Valiyev" -> "Ali V."', () => {
  assert.equal(S.maskName('Ali Valiyev'), 'Ali V.');
  assert.equal(S.maskName('  Ali  '), 'Ali');
  assert.equal(S.maskName(''), '');
  assert.equal(S.maskName('Олег петров'), 'Олег П.');
});

test('CSV: formula inyeksiyasi zararsizlantiriladi, vergul va qo\'shtirnoq to\'g\'ri', () => {
  assert.equal(S.csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(S.csvCell('+998901234567'), "'+998901234567");
  assert.equal(S.csvCell('-5'), "'-5");
  assert.equal(S.csvCell('@cmd'), "'@cmd");
  assert.equal(S.csvCell('a,b'), '"a,b"');
  assert.equal(S.csvCell(null), '');
  assert.equal(S.csvCell(1295000), '1295000');
});

test('CSV fayl Excel uchun BOM va sarlavha bilan boshlanadi', () => {
  const csv = S.bookingsToCsv([{ id: 'BK-1', guestName: 'Ali', roomNumber: 'Hilton' }]);
  assert.ok(csv.startsWith('﻿ID,'));
  assert.ok(csv.includes('Hilton'), 'pickupLocation bo\'lmasa roomNumber ishlatilishi kerak');
});

test('buyurtma ID: BK- + 8 ta belgi, chalkash belgilarsiz, takrorlanmaydi', () => {
  const ids = new Set();
  for (let i = 0; i < 500; i++) {
    const id = S.generateBookingId([...ids].map(x => ({ id: x })));
    assert.match(id, /^BK-[A-HJ-NP-Z2-9]{8}$/);
    assert.ok(!ids.has(id));
    ids.add(id);
  }
});

test('admin token: to\'g\'risi qabul qilinadi, soxtasi rad etiladi', () => {
  const token = S.createAdminToken();
  assert.equal(S.verifyAdminToken(token), true);
  const [exp, nonce, sig] = token.split('.');
  assert.equal(S.verifyAdminToken(`${exp}.${nonce}.${'0'.repeat(sig.length)}`), false, 'imzo o\'zgartirilgan');
  assert.equal(S.verifyAdminToken(`${Number(exp) + 1e9}.${nonce}.${sig}`), false, 'muddat uzaytirilgan');
  assert.equal(S.verifyAdminToken('aureon_admin_session_123'), false, 'eski formatdagi token');
  assert.equal(S.verifyAdminToken(''), false);
  assert.equal(S.verifyAdminToken(undefined), false);
});

test('admin token: muddati tugagach rad etiladi', () => {
  const token = S.createAdminToken();
  const realNow = Date.now;
  try {
    Date.now = () => realNow() + S.SESSION_TTL_MS + 1000;
    assert.equal(S.verifyAdminToken(token), false);
  } finally {
    Date.now = realNow;
  }
});

test('Telegram HTML: maxsus belgilar escape qilinadi', () => {
  assert.equal(S.escapeTgHtml('<b>Ali & Vali</b>'), '&lt;b&gt;Ali &amp; Vali&lt;/b&gt;');
  assert.equal(S.escapeTgHtml(undefined), '');
});

test('sozlamalar javobidan admin paroli olib tashlanadi', () => {
  const out = S.withoutSecrets({ adminPassword: 'x', exchangeRate: 1 });
  assert.deepEqual(out, { exchangeRate: 1 });
});

after(() => { fs.rmSync(dataDir, { recursive: true, force: true }); });
