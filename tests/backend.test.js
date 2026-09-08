'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { once } = require('node:events');
const { DatabaseSync } = require('node:sqlite');
const { createDatabase } = require('../backend/src/db');
const { createApp } = require('../backend/src/server');
const { validateBookingPayload } = require('../backend/src/validation');
const { buildEmail, createNotifier, startOutbox } = require('../backend/src/notifier');
const { csvEscape, exportBookingsCsv } = require('../backend/src/csv');
const P = require('../shared/pricing');
const body = () => {
  const input = {
    property: 'casa',
    checkin: P.addDays(P.today(), 10),
    checkout: P.addDays(P.today(), 11),
    adults: 2,
    children: 1,
    pets: 1,
    name: 'Test Guest',
    email: 'guest@example.test',
    phone: '+34 600 000 000',
    message: '<script>alert(1)</script>',
    consent: true,
    language: 'eu',
  };
  return { ...input, expectedTotal: P.quote(input).total };
};

test('SQLite persists requests, outbox and idempotency across restart', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'uxarbeiti-db-'));
  const file = path.join(directory, 'app.db');
  try {
    let db = createDatabase(file);
    const data = validateBookingPayload(body()).data;
    assert.equal(db.createRequest(data, 'same-key', 'hash').id, 1);
    assert.equal(db.createRequest(data, 'same-key', 'hash').duplicate, true);
    assert.equal(db.createRequest(data, 'same-key', 'changed').conflict, true);
    db.close();
    db = createDatabase(file);
    assert.equal(db.allRequests().length, 1);
    assert.equal(db.getRequest(1).language, 'eu');
    const email = db.claimEmail();
    assert.equal(email.id, 1);
    assert.equal(db.claimEmail(), null);
    db.retryEmail(1, 1, 'ETIMEDOUT');
    assert.equal(db.getRequest(1).notification_status, 'pending');
    assert.equal(db.claimEmail(Date.now() + 60000).attempt, 2);
    db.markEmailSent(1);
    assert.equal(db.claimEmail(Date.now() + 900000), null);
    db.close();
    assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
test('additive migration preserves historical requests without fabricating a property', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'uxarbeiti-migration-'));
  const file = path.join(directory, 'legacy.db');
  try {
    const legacy = new DatabaseSync(file);
    legacy.exec(
      "CREATE TABLE booking_requests (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,guests INTEGER NOT NULL,checkin_date TEXT NOT NULL,checkout_date TEXT NOT NULL,message TEXT,status TEXT NOT NULL DEFAULT 'new',source TEXT NOT NULL DEFAULT 'website',ip_hash TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now'))); INSERT INTO booking_requests(name,email,phone,guests,checkin_date,checkout_date,ip_hash) VALUES('Legacy','old@example.test','600000000',2,'2026-01-01','2026-01-02','old-hash');",
    );
    legacy.close();
    const db = createDatabase(file);
    assert.equal(db.getRequest(1).name, 'Legacy');
    assert.equal(db.getRequest(1).property, null);
    assert.equal(db.createRequest(validateBookingPayload(body()).data, 'new-key', 'hash').id, 2);
    db.close();
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
test('readable notification escapes HTML and replies to the guest, not arbitrary recipients', () => {
  const db = createDatabase(':memory:');
  const input = body();
  input.name = '<b>Guest</b>';
  const data = validateBookingPayload(input).data;
  db.createRequest(data, 'key', 'hash');
  const email = buildEmail(db.getRequest(1), {
    from: 'host@example.test',
    to: 'pablosainz1998@gmail.com',
  });
  assert.equal(email.to, 'pablosainz1998@gmail.com');
  assert.equal(email.replyTo.address, input.email);
  assert.ok(email.html.includes('&lt;script&gt;'));
  assert.ok(!email.html.includes('<script>'));
  assert.match(email.text, /Limpieza final/);
  assert.match(email.text, /TOTAL ESTIMADO/);
  assert.match(email.text, /Euskera/);
  assert.match(email.subject, /Urkiola Etxea/);
  db.close();
});
test('SMTP fails closed if only partly configured', () => {
  assert.equal(createNotifier({}).enabled, false);
  assert.throws(() => createNotifier({ SMTP_ENABLED: 'true' }), /SMTP_HOST/);
});
test('CSV export prevents spreadsheet formulas and is private on disk', () => {
  for (const value of ['=HYPERLINK("x")', '+600000000', '-1+1', '@SUM(A1)', '  =1+1', '\tformula'])
    assert.ok(csvEscape(value).startsWith('"\''));
  assert.equal(csvEscape('ordinary "text"'), '"ordinary ""text"""');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'uxarbeiti-csv-'));
  try {
    const file = path.join(directory, 'bookings.csv');
    exportBookingsCsv(file, []);
    assert.equal(fs.statSync(file).mode & 0o777, 0o600);
    assert.ok(fs.readFileSync(file, 'utf8').startsWith('\uFEFF'));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
test('outbox sends once on success and retains a failed email for retry', async () => {
  for (const fail of [false, true]) {
    const db = createDatabase(':memory:');
    db.createRequest(validateBookingPayload(body()).data, 'key', 'hash');
    let sends = 0;
    const worker = startOutbox(
      db,
      {
        enabled: true,
        async send() {
          sends++;
          if (fail) throw Object.assign(new Error('secret must not be logged'), { code: 'EAUTH' });
        },
      },
      {
        error(message) {
          assert.ok(!message.includes('secret'));
        },
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 30));
    worker.kick();
    await worker.stop();
    assert.equal(sends, 1);
    assert.equal(db.getRequest(1).notification_status, fail ? 'pending' : 'sent');
    db.close();
  }
});

async function fixture(t, env = {}, notifier) {
  const db = createDatabase(':memory:');
  const token = crypto.randomBytes(32).toString('hex');
  const runtime = createApp({
    db,
    notifier,
    env: {
      ADMIN_TOKEN: token,
      ACCEPT_BOOKINGS_WITHOUT_EMAIL: 'true',
      RATE_LIMIT_MAX: '1000',
      ...env,
    },
    logger: { error() {} },
  });
  const server = runtime.app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await runtime.close();
    db.close();
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    db,
    token,
    url,
    get: (route, options) => fetch(url + route, options),
    post: (data = body(), key = crypto.randomUUID(), extraHeaders = {}) =>
      fetch(url + '/api/booking-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key, ...extraHeaders },
        body: JSON.stringify(data),
      }),
  };
}
test('API records the price computed by the server and protects all private data', async (t) => {
  const app = await fixture(t);
  const key = crypto.randomUUID();
  const input = body();
  const response = await app.post(input, key);
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const publicBody = await response.json();
  assert.equal(publicBody.requestId, 'UX-000001');
  assert.equal(publicBody.status, 'pending_confirmation');
  assert.equal(publicBody.email, undefined);
  assert.equal((await app.post(input, key)).status, 200);
  assert.equal(app.db.allRequests().length, 1);
  assert.equal((await app.post({ ...input, name: 'Different name' }, key)).status, 409);
  assert.equal((await app.post({ ...input, expectedTotal: 1 })).status, 409);
  assert.equal((await app.get('/api/admin/booking-requests')).status, 401);
  assert.equal((await app.get('/api/admin/booking-requests.csv')).status, 401);
  const admin = await app.get('/api/admin/booking-requests', {
    headers: { Authorization: `Bearer ${app.token}` },
  });
  assert.equal(admin.status, 200);
  assert.equal((await admin.json()).items[0].email, input.email);
  const csv = await app.get('/api/admin/booking-requests.csv', {
    headers: { Authorization: `Bearer ${app.token}` },
  });
  assert.equal(csv.status, 200);
  assert.match(await csv.text(), /guest@example.test/);
  for (const route of [
    '/backend/.env',
    '/backend/data/app.db',
    '/.git/config',
    '/package.json',
    '/site/content.js',
    '/data/bookings.csv',
  ])
    assert.equal((await app.get(route)).status, 404, route);
  const page = await app.get('/');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
  assert.ok(!page.headers.get('x-powered-by'));
});
test('API rejects cross-origin posts, oversized bodies and bad JSON', async (t) => {
  const app = await fixture(t);
  assert.equal(
    (await app.post(body(), crypto.randomUUID(), { Origin: 'https://attacker.example' })).status,
    403,
  );
  assert.equal((await app.post(body(), 'invalid-key')).status, 400);
  assert.equal((await app.post({ ...body(), message: 'x'.repeat(20000) })).status, 413);
  assert.equal(
    (
      await app.get('/api/booking-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      })
    ).status,
    400,
  );
  assert.equal((await app.get('/api/booking-requests', { method: 'POST', body: 'x' })).status, 415);
});
test('unconfigured SMTP cannot silently accept production requests', async (t) => {
  const app = await fixture(t, { NODE_ENV: 'production', ACCEPT_BOOKINGS_WITHOUT_EMAIL: 'true' });
  assert.equal((await app.post()).status, 503);
  assert.equal(app.db.allRequests().length, 0);
  assert.equal((await (await app.get('/api/health')).json()).acceptsBookings, false);
});
test('rate limiting ignores untrusted forwarded IPs', async (t) => {
  const app = await fixture(t, { RATE_LIMIT_MAX: '2' });
  assert.equal((await app.get('/api/health')).status, 200);
  assert.equal((await app.get('/api/health')).status, 200);
  const response = await app.get('/api/health', { headers: { 'X-Forwarded-For': '1.2.3.4' } });
  assert.equal(response.status, 429);
  assert.ok(response.headers.get('retry-after'));
});
