// Email (SMTP) sozlamalari serverda saqlanishi va SMTP parolining himoyasi
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const net = require('net');
const { setupEnv, startServer, api, login } = require('./helpers');

setupEnv();
let ctx, base, token;

// Mahalliy soxta SMTP server: kim ulanganini va qaysi login/parol yuborilganini yozib boradi
const smtp = { port: 0, connections: 0, authLines: [], mails: 0, lastMessage: '' };
let smtpServer;

before(async () => {
  smtpServer = net.createServer((sock) => {
    smtp.connections += 1;
    sock.write('220 test ESMTP\r\n');
    let inData = false;
    sock.on('data', (buf) => {
      for (const line of buf.toString().split('\r\n').filter(Boolean)) {
        if (inData) { if (line === '.') { inData = false; smtp.mails += 1; smtp.lastMessage = smtp.current; sock.write('250 OK\r\n'); } else { smtp.current += line + '\n'; } continue; }
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === 'EHLO' || cmd === 'HELO') sock.write('250-test\r\n250 AUTH PLAIN LOGIN\r\n');
        else if (cmd === 'AUTH') { smtp.authLines.push(line); sock.write('235 ok\r\n'); }
        else if (cmd === 'DATA') { inData = true; smtp.current = ''; sock.write('354 go\r\n'); }
        else if (cmd === 'QUIT') { sock.write('221 bye\r\n'); sock.end(); }
        else sock.write('250 OK\r\n');
      }
    });
  });
  await new Promise((r) => smtpServer.listen(0, '127.0.0.1', r));
  smtp.port = smtpServer.address().port;

  ctx = await startServer();
  base = ctx.base;
  token = await login(base);
});
after(async () => {
  await ctx.close();
  await new Promise((r) => smtpServer.close(r));
});

const decodeAuth = () => smtp.authLines.map(l => Buffer.from(l.split(' ').pop(), 'base64').toString()).join('|');

test('SMTP sozlamalari serverda saqlanadi, parol javobda qaytarilmaydi', async () => {
  const r = await api(base, 'POST', '/api/settings', {
    token,
    body: { email: { host: '127.0.0.1', port: smtp.port, user: 'info@aureon.uz', pass: 'Maxfiy-Parol-1', senderName: 'Aureon', testEmail: 'admin@aureon.uz' } }
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.settings.email.pass, undefined);
  assert.equal(r.json.settings.email.hasPassword, true);

  const s = await api(base, 'GET', '/api/settings/admin', { token });
  assert.equal(s.json.email.host, '127.0.0.1');
  assert.equal(s.json.email.user, 'info@aureon.uz');
  assert.equal(s.json.email.hasPassword, true);
  assert.ok(!s.text.includes('Maxfiy-Parol-1'), 'parol javobda ko\'rinmasligi kerak');
});

test('parol maydoni bo\'sh yuborilsa, saqlangan parol o\'zgarmaydi', async () => {
  const r = await api(base, 'POST', '/api/settings', {
    token, body: { email: { host: '127.0.0.1', port: smtp.port, user: 'info@aureon.uz', pass: '', senderName: 'Aureon Travel' } }
  });
  assert.equal(r.json.settings.email.hasPassword, true);
  assert.equal(r.json.settings.email.senderName, 'Aureon Travel');
});

test('saqlangan sozlamalar bilan xat yuboriladi (boshqa qurilmadan, parolsiz)', async () => {
  smtp.authLines = [];
  const before = smtp.mails;
  // Brauzer parolni bilmaydi: smtpConfig da parol yo'q
  const r = await api(base, 'POST', '/api/email/test', {
    token, body: { testEmail: 'mijoz@example.uz', smtpConfig: { host: '127.0.0.1', port: smtp.port, user: 'info@aureon.uz', pass: '' } }
  });
  assert.equal(r.status, 200, r.text);
  assert.equal(smtp.mails, before + 1);
  assert.ok(decodeAuth().includes('Maxfiy-Parol-1'), 'saqlangan parol bilan kirilishi kerak edi');
});

test('saqlangan parol boshqa SMTP serverga yuborilmaydi', async () => {
  smtp.authLines = [];
  const conns = smtp.connections;
  // "localhost" — saqlangan "127.0.0.1" dan farqli server nomi (hujumchi serveri o'rnida)
  const r = await api(base, 'POST', '/api/email/test', {
    token, body: { testEmail: 'x@example.uz', smtpConfig: { host: 'localhost', port: smtp.port, user: 'info@aureon.uz' } }
  });
  assert.equal(r.status, 400);
  assert.equal(smtp.connections, conns, 'begona serverga ulanish bo\'lmasligi kerak');
  assert.ok(!decodeAuth().includes('Maxfiy-Parol-1'));

  const r2 = await api(base, 'POST', '/api/email/test', {
    token, body: { testEmail: 'x@example.uz', smtpConfig: { host: '127.0.0.1', port: smtp.port, user: 'boshqa@login.uz' } }
  });
  assert.equal(r2.status, 400, 'login o\'zgarsa ham saqlangan parol ishlatilmasligi kerak');
});

test('server yoki login o\'zgarsa va yangi parol berilmasa, eski parol o\'chiriladi', async () => {
  const r = await api(base, 'POST', '/api/settings', { token, body: { email: { host: 'smtp.gmail.com', pass: '' } } });
  assert.equal(r.status, 200);
  assert.equal(r.json.settings.email.hasPassword, false);
});

test('noto\'g\'ri port va server manzili rad etiladi', async () => {
  assert.equal((await api(base, 'POST', '/api/settings', { token, body: { email: { port: 70000 } } })).status, 400);
  assert.equal((await api(base, 'POST', '/api/settings', { token, body: { email: { host: 'bad host\r\nX' } } })).status, 400);
  assert.equal((await api(base, 'POST', '/api/settings', { token, body: { email: 'matn' } })).status, 400);
});

test('zaxira faylida SMTP sozlamalari va paroli yo\'q', async () => {
  await api(base, 'POST', '/api/settings', { token, body: { email: { host: 'smtp.gmail.com', user: 'a@b.uz', pass: 'ZaxiradaBolmasin' } } });
  const r = await api(base, 'GET', '/api/admin/backup', { token });
  assert.ok(!r.text.includes('ZaxiradaBolmasin'));
  assert.equal(r.json.settings.email, undefined);
});

test('email sozlamalarini tokensiz o\'zgartirib bo\'lmaydi', async () => {
  assert.equal((await api(base, 'POST', '/api/settings', { body: { email: { host: 'evil.com', pass: 'x' } } })).status, 401);
});

// quoted-printable yumshoq qatorlarni birlashtirish
const plain = (raw) => raw.replace(/=\r?\n/g, '').replace(/=20/g, ' ');

test('email pastki qismida namuna raqam yo\'q; aloqa raqami kiritilsa, u chiqadi', async () => {
  await api(base, 'POST', '/api/settings', {
    token, body: { email: { host: '127.0.0.1', port: smtp.port, user: 'info@aureon.uz', pass: 'Parol-2' } }
  });
  let r = await api(base, 'POST', '/api/email/test', { token, body: { testEmail: 'a@example.uz' } });
  assert.equal(r.status, 200, r.text);
  assert.ok(!plain(smtp.lastMessage).includes('123 45 67'), 'namuna raqam xatda bo\'lmasligi kerak');

  await api(base, 'POST', '/api/settings', { token, body: { contact: { phone: '+998 90 777 77 77' } } });
  r = await api(base, 'POST', '/api/email/test', { token, body: { testEmail: 'a@example.uz' } });
  assert.equal(r.status, 200, r.text);
  assert.ok(plain(smtp.lastMessage).includes('+998 90 777 77 77'), 'aloqa raqami email pastida chiqishi kerak');
});
