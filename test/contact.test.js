// Biznes aloqa ma'lumotlari: admin paneldan saqlash, saytga ommaviy berish, namuna raqamlar yo'qligi
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { setupEnv, startServer, api, login } = require('./helpers');

setupEnv();
let ctx, base, token;
before(async () => {
  ctx = await startServer();
  base = ctx.base;
  token = await login(base);
});
after(async () => { await ctx.close(); });

test('boshida aloqa ma\'lumotlari bo\'sh (namuna raqam ko\'rsatilmaydi)', async () => {
  const r = await api(base, 'GET', '/api/settings');
  assert.deepEqual(r.json.contact, { phone: '', whatsapp: '', telegram: '' });
});

test('admin saqlagan aloqa ma\'lumotlari saytga ochiq beriladi, Telegram nomi tozalanadi', async () => {
  const save = await api(base, 'POST', '/api/settings', {
    token, body: { contact: { phone: '+998 90 777 77 77', whatsapp: '+998907777777', telegram: 'https://t.me/aureon_travel' } }
  });
  assert.equal(save.status, 200, save.text);
  const pub = await api(base, 'GET', '/api/settings');
  assert.deepEqual(pub.json.contact, { phone: '+998 90 777 77 77', whatsapp: '+998907777777', telegram: 'aureon_travel' });
});

test('noto\'g\'ri telefon yoki Telegram nomi rad etiladi', async () => {
  for (const contact of [{ phone: 'abc' }, { phone: '<script>' }, { whatsapp: '12' }, { telegram: 'ab' }, { telegram: 'bad name!' }]) {
    const r = await api(base, 'POST', '/api/settings', { token, body: { contact } });
    assert.equal(r.status, 400, JSON.stringify(contact));
  }
  assert.equal((await api(base, 'POST', '/api/settings', { token, body: { contact: 'matn' } })).status, 400);
});

test('aloqa ma\'lumotlarini tokensiz o\'zgartirib bo\'lmaydi', async () => {
  assert.equal((await api(base, 'POST', '/api/settings', { body: { contact: { phone: '+998 99 000 00 00' } } })).status, 401);
});

test('zaxirada aloqa ma\'lumotlari bor', async () => {
  const r = await api(base, 'GET', '/api/admin/backup', { token });
  assert.equal(r.json.settings.contact.phone, '+998 90 777 77 77');
});

test('kodda namuna raqam yoki namuna Telegram qolmagan (mijozga yuborilmasin)', () => {
  const root = path.join(__dirname, '..');
  for (const f of ['server.js', 'admin.js', 'app.js', 'booking.js', 'data.js']) {
    const src = fs.readFileSync(path.join(root, f), 'utf-8');
    assert.ok(!src.includes('+998 90 123 45 67'), `${f} da namuna raqam qolgan`);
    assert.ok(!src.includes('@aureon_travel'), `${f} da namuna Telegram qolgan`);
  }
});

test('sahifalarda aloqa bloki joyi bor', () => {
  const root = path.join(__dirname, '..');
  for (const f of ['index.html', 'booking.html']) {
    assert.ok(fs.readFileSync(path.join(root, f), 'utf-8').includes('data-contact-links'), f);
  }
});

test('buyurtmani tekshirish oynasidagi namuna ID yangi formatda (BK- + 8 belgi)', () => {
  const root = path.join(__dirname, '..');
  for (const f of ['index.html', 'booking.html', 'data.js', 'app.js', 'booking.js']) {
    const src = fs.readFileSync(path.join(root, f), 'utf-8');
    assert.ok(!/BK-\d{6}\b/.test(src), `${f} da eski 6 xonali ID namunasi qolgan`);
  }
});
