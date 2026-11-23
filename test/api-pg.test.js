// API testlari: PostgreSQL (Supabase) rejimi.
// Haqiqiy baza o'rniga xotirada ishlaydigan pg-mem ishlatiladi: server `require('pg')` qilganda
// unga pg-mem adapteri beriladi. Saytning o'zi (Render + Supabase) aynan shu rejimda ishlaydi.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const { newDb } = require('pg-mem');
const { setupEnv, startServer, api, login, sampleBooking } = require('./helpers');

const dataDir = setupEnv({ DATABASE_URL: 'postgres://test:test@db.example.com:5432/postgres?sslmode=require' });

const memDb = newDb();
const pgAdapter = memDb.adapters.createPg();
const originalLoad = Module._load;
Module._load = function (request, ...rest) {
  return request === 'pg' ? pgAdapter : originalLoad.call(this, request, ...rest);
};

let ctx, base, token;
before(async () => {
  ctx = await startServer();
  base = ctx.base;
  token = await login(base);
});
after(async () => {
  await ctx.close();
  Module._load = originalLoad;
});

test('server PostgreSQL ga ulangan va health check bazaga murojaat qiladi', async () => {
  assert.equal(ctx.server.isPgReady(), true);
  const s = await api(base, 'GET', '/api/status');
  assert.equal(s.json.database, 'PostgreSQL (Supabase)');
  assert.equal(s.json.databaseOk, true);
});

test('boshlang\'ich turlar bazaga to\'g\'ri tartibda ko\'chirilgan', async () => {
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'db.json'), 'utf-8')).tours;
  const ids = (await api(base, 'GET', '/api/tours')).json.map(t => t.id);
  assert.deepEqual(ids, seed.map(t => t.id));
  const rows = memDb.public.many('SELECT COUNT(*) AS n FROM tours');
  assert.equal(Number(rows[0].n), seed.length);
});

test('buyurtma bazaga yoziladi, holati o\'zgaradi va o\'chiriladi', async () => {
  const created = (await api(base, 'POST', '/api/bookings', { body: sampleBooking({ totalPrice: 1 }) })).json.booking;
  assert.equal(created.totalPrice, 2145000);
  assert.equal(memDb.public.many(`SELECT id FROM bookings WHERE id = '${created.id}'`).length, 1);

  const upd = await api(base, 'PATCH', `/api/bookings/${created.id}/status`, { token, body: { status: 'Tasdiqlandi' } });
  assert.equal(upd.status, 200);
  assert.equal(upd.json.booking.status, 'Tasdiqlandi');
  assert.equal(upd.json.booking.guestName, 'Ali Valiyev', 'holat o\'zgarganda boshqa maydonlar yo\'qolmasligi kerak');

  const list = (await api(base, 'GET', '/api/bookings', { token })).json;
  assert.equal(list.find(b => b.id === created.id).status, 'Tasdiqlandi');

  await api(base, 'DELETE', `/api/bookings/${created.id}`, { token });
  assert.equal(memDb.public.many(`SELECT id FROM bookings WHERE id = '${created.id}'`).length, 0);
});

test('PostgreSQL rejimida buyurtmalar lokal faylga yozilmaydi', async () => {
  await api(base, 'POST', '/api/bookings', { body: sampleBooking() });
  const file = path.join(dataDir, 'db.local.json');
  const local = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : { bookings: [] };
  assert.equal(local.bookings.length, 0);
});

test('tur narxi bazada yangilanadi va tartib o\'zgarmaydi', async () => {
  const tours = (await api(base, 'GET', '/api/tours')).json;
  const before = tours.map(t => t.id);
  const toglar = { ...tours.find(t => t.id === 'toglar'), basePricePerPerson: 999000 };
  assert.equal((await api(base, 'POST', '/api/tours', { token, body: toglar })).status, 200);
  const after = (await api(base, 'GET', '/api/tours')).json;
  assert.equal(after.find(t => t.id === 'toglar').basePricePerPerson, 999000);
  assert.deepEqual(after.map(t => t.id), before);
});

test('sozlamalar bazada saqlanadi', async () => {
  await api(base, 'POST', '/api/settings', { token, body: { exchangeRate: 12345 } });
  assert.equal((await api(base, 'GET', '/api/settings')).json.exchangeRate, 12345);
  const row = memDb.public.many("SELECT data FROM settings WHERE key = 'main'")[0];
  assert.equal(row.data.exchangeRate, 12345);
});

test('zaxira va tiklash PostgreSQL bilan ishlaydi', async () => {
  const backup = (await api(base, 'GET', '/api/admin/backup', { token })).json;
  assert.ok(backup.bookings.length >= 1);
  for (const b of backup.bookings) await api(base, 'DELETE', `/api/bookings/${b.id}`, { token });
  assert.equal((await api(base, 'GET', '/api/bookings', { token })).json.length, 0);

  const r = await api(base, 'POST', '/api/admin/restore', { token, body: backup });
  assert.equal(r.status, 200);
  assert.equal((await api(base, 'GET', '/api/bookings', { token })).json.length, backup.bookings.length);
});
