'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { DatabaseSync } = require('node:sqlite');
const { createDatabase } = require('../backend/src/db');
const { createApp } = require('../backend/src/server');
const { hashPassword, verifyPassword } = require('../backend/src/admin');
const { buildEmail } = require('../backend/src/notifier');
const { backupDatabase } = require('../scripts/backup');
const P = require('../shared/pricing');
const password = 'Synthetic-test-password-ONLY';
let passwordHash;
const data = (changes = {}) => {
  const item = {
    property: 'casa',
    checkin: P.addDays(P.today(), 10),
    checkout: P.addDays(P.today(), 12),
    adults: 2,
    children: 1,
    pets: 1,
    name: 'Synthetic Guest',
    email: 'guest@example.test',
    phone: '+34 600 000 000',
    message: '<img src=x onerror=alert(1)>',
    language: 'en',
    consentVersion: 'test',
    ...changes,
  };
  return { ...item, quote: P.quote(item) };
};
const insert = (db, changes) => db.createRequest(data(changes), crypto.randomUUID(), 'hash').id;

async function fixture(t, env = {}) {
  passwordHash ||= await hashPassword(password);
  const db = createDatabase(':memory:');
  const runtime = createApp({
    db,
    env: {
      ADMIN_PASSWORD_HASH: passwordHash,
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
  let cookie = '',
    csrf = '';
  async function request(route, body, options = {}) {
    return fetch(url + route, {
      method: body === undefined ? 'GET' : 'POST',
      ...options,
      headers: {
        Cookie: cookie,
        Origin: env.PUBLIC_ORIGIN || url,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
        ...options.headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  async function login() {
    const response = await request('/api/admin/login', { password });
    assert.equal(response.status, 200);
    cookie = response.headers.get('set-cookie').split(';')[0];
    const result = await response.json();
    csrf = result.csrf;
    return { response, cookie, csrf };
  }
  return { db, url, request, login };
}
test('passwords are salted scrypt hashes, never reversible or accepted as plain text', async () => {
  const hash = await hashPassword(password);
  assert.ok(!hash.includes(password));
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('wrong', hash), false);
  assert.equal(await verifyPassword(password, password), false);
  assert.notEqual(hash, await hashPassword(password));
  await assert.rejects(hashPassword('short'));
});
test('private session login, CSRF protection, logout and no unauthenticated mutations', async (t) => {
  const a = await fixture(t);
  const id = insert(a.db);
  assert.equal((await a.request('/api/admin/booking-requests')).status, 401);
  assert.equal(
    (
      await a.request(`/api/admin/booking-requests/${id}/decision`, {
        status: 'confirmed',
        revision: 0,
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await a.request(
        '/api/admin/login',
        { password },
        { headers: { Origin: 'https://attacker.test' } },
      )
    ).status,
    403,
  );
  const auth = await a.login();
  const cookie = auth.response.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.ok(!cookie.includes(password));
  const list = await a.request('/api/admin/booking-requests');
  assert.equal(list.status, 200);
  assert.equal(list.headers.get('cache-control'), 'no-store');
  const item = (await list.json()).items[0];
  assert.equal(item.payload_hash, undefined);
  assert.equal(item.idempotency_key, undefined);
  assert.equal(
    (
      await a.request(
        `/api/admin/booking-requests/${id}/decision`,
        { status: 'confirmed', revision: 0, notifyGuest: false },
        { headers: { 'X-CSRF-Token': '' } },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await a.request(
        `/api/admin/booking-requests/${id}/decision`,
        { status: 'confirmed', revision: 0, notifyGuest: false },
        { headers: { Origin: 'https://evil.test' } },
      )
    ).status,
    403,
  );
  assert.equal(a.db.getRequest(id).status, 'new');
  assert.equal(
    (
      await a.request(`/api/admin/booking-requests/${id}/decision`, {
        status: 'confirmed',
        revision: 0,
      })
    ).status,
    503,
  );
  assert.equal(
    (
      await a.request(`/api/admin/booking-requests/${id}/decision`, {
        status: 'confirmed',
        revision: 0,
        notifyGuest: false,
      })
    ).status,
    200,
  );
  assert.equal((await a.request('/api/admin/logout', {})).status, 200);
  assert.equal((await a.request('/api/admin/session')).status, 401);
});
test('production cookies are HTTPS-only and login brute-force ignores forged forwarded IP', async (t) => {
  const a = await fixture(t, {
    NODE_ENV: 'production',
    PUBLIC_ORIGIN: 'https://uxarbeiti.example',
  });
  const auth = await a.login();
  assert.match(auth.cookie, /^__Host-uxarbeiti_admin=/);
  assert.match(auth.response.headers.get('set-cookie'), /; Secure/);
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await a.request(
          '/api/admin/login',
          { password: 'wrong' },
          { headers: { 'X-Forwarded-For': `1.1.1.${i}` } },
        )
      ).status,
      401,
    );
  assert.equal((await a.request('/api/admin/login', { password })).status, 429);
});
test('session tokens are hashed, expire, and are invalid after password rotation', () => {
  const db = createDatabase(':memory:');
  const token = 'private-token';
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  db.createSession(hash, 'csrf', Date.now() + 1000, 'version1');
  assert.equal(db.getSession(token, 'version1'), undefined);
  assert.ok(db.getSession(hash, 'version1'));
  assert.equal(db.getSession(hash, 'version2'), undefined);
  db.createSession('expired', 'csrf', Date.now() - 1, 'version1');
  assert.equal(db.getSession('expired', 'version1'), undefined);
  db.close();
});
test('confirmation prevents overlapping stays, isolates properties, and allows checkout-day arrivals', () => {
  const db = createDatabase(':memory:');
  const first = insert(db),
    second = insert(db),
    domo = insert(db, { property: 'domo' });
  db.decide(first, 'confirmed', 0, true);
  assert.throws(() => db.decide(second, 'confirmed', 0, true), { code: 'occupied' });
  assert.equal(db.getRequest(second).status, 'new');
  assert.throws(() => insert(db), { code: 'occupied' });
  db.decide(domo, 'confirmed', 0, false);
  const backToBack = insert(db, {
    checkin: P.addDays(P.today(), 12),
    checkout: P.addDays(P.today(), 13),
  });
  db.decide(backToBack, 'confirmed', 0, false);
  assert.equal(db.availability('casa').length, 2);
  assert.throws(() => db.decide(first, 'cancelled', 0, true), { code: 'stale' });
  db.decide(first, 'cancelled', 1, true);
  db.decide(second, 'confirmed', 0, true);
  assert.equal(db.getRequest(second).status, 'confirmed');
  db.close();
});
test('decisions persist once, queue localized guest mail, and suppress obsolete unsent confirmation', () => {
  const db = createDatabase(':memory:');
  const id = insert(db);
  db.markEmailSent(id);
  db.decide(id, 'confirmed', 0, true);
  db.decide(id, 'confirmed', 0, true);
  const job = db.claimEmail();
  assert.equal(job.kind, 'confirmed');
  assert.equal(db.claimEmail(), null);
  const mail = buildEmail(job, {
    from: 'host@example.test',
    to: 'owner@example.test',
    publicOrigin: 'https://uxarbeiti.example',
  });
  assert.equal(mail.to, 'guest@example.test');
  assert.equal(mail.replyTo, 'owner@example.test');
  assert.match(mail.subject, /Your stay is confirmed/);
  assert.ok(!mail.html.includes('onerror='));
  db.retryEmail(job.jobId, job.attempt, 'EAUTH', job.kind);
  db.decide(id, 'cancelled', 1, true);
  const cancel = db.claimEmail(Date.now() + 900000);
  assert.equal(cancel.kind, 'cancelled');
  db.markEmailSent(cancel.jobId, cancel.kind);
  assert.equal(db.claimEmail(Date.now() + 900000), null);
  db.close();
});
test('manual WhatsApp entries accept no email, calculate on server, and block dates without leaking notes', async (t) => {
  const a = await fixture(t);
  await a.login();
  const key = crypto.randomUUID();
  const input = { ...data(), source: 'whatsapp', email: '', expectedTotal: 1 };
  const response = await a.request('/api/admin/booking-requests', input, {
    headers: { 'Idempotency-Key': key },
  });
  assert.equal(response.status, 201);
  const item = (await response.json()).item;
  assert.equal(item.email, '');
  assert.equal(item.consent_version, 'staff-entry');
  assert.equal(JSON.parse(item.quote_json).total, P.quote(input).total);
  assert.equal(a.db.claimEmail(), null);
  assert.equal(
    (await a.request('/api/admin/booking-requests', input, { headers: { 'Idempotency-Key': key } }))
      .status,
    200,
  );
  const block = {
    property: 'casa',
    checkin: input.checkin,
    checkout: input.checkout,
    note: 'Private channel note',
  };
  assert.equal((await a.request('/api/admin/blocks', block)).status, 201);
  const pub = await a.request('/api/availability?property=casa');
  const json = await pub.json();
  assert.deepEqual(Object.keys(json.ranges[0]).sort(), ['checkin_date', 'checkout_date']);
  assert.ok(!JSON.stringify(json).includes('Private'));
  assert.equal(
    (
      await a.request(`/api/admin/booking-requests/${item.id}/decision`, {
        status: 'confirmed',
        revision: 0,
        notifyGuest: false,
      })
    ).status,
    409,
  );
  assert.equal((await a.request('/api/admin/blocks/1', {}, { method: 'DELETE' })).status, 200);
  assert.equal(
    (
      await a.request(`/api/admin/booking-requests/${item.id}/decision`, {
        status: 'confirmed',
        revision: 0,
        notifyGuest: true,
      })
    ).status,
    200,
  );
  assert.equal(a.db.claimEmail(), null);
});
test('owner mail review link has no credentials and does not itself change a booking', () => {
  const db = createDatabase(':memory:');
  const id = insert(db);
  const mail = buildEmail(db.getRequest(id), {
    from: 'host@example.test',
    to: 'owner@example.test',
    publicOrigin: 'https://uxarbeiti.example',
  });
  assert.match(mail.text, /https:\/\/uxarbeiti.example\/gestion\/#reserva=1/);
  assert.equal(db.getRequest(id).status, 'new');
  db.close();
});
test('online backup includes committed WAL data and can be opened, retaining private snapshots', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uxarbeiti-backup-'));
  const file = path.join(dir, 'app.db');
  const db = createDatabase(file);
  try {
    const id = insert(db);
    db.decide(id, 'confirmed', 0, false);
    const snapshot = await backupDatabase(file, path.join(dir, 'snapshots'), 1);
    assert.equal(fs.statSync(snapshot).mode & 0o777, 0o600);
    const restored = new DatabaseSync(snapshot, { readOnly: true });
    assert.equal(
      restored.prepare('SELECT status FROM booking_requests WHERE id=?').get(id).status,
      'confirmed',
    );
    restored.close();
    await backupDatabase(file, path.join(dir, 'snapshots'), 1);
    assert.equal(fs.readdirSync(path.join(dir, 'snapshots')).length, 1);
  } finally {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
