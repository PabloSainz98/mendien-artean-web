'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { createDatabase } = require('../backend/src/db');
const { createApp } = require('../backend/src/server');
const { startBackups } = require('../backend/src/backups');

async function appFixture(t, env = {}, backups = null) {
  const db = createDatabase(':memory:');
  const runtime = createApp({ db, env, backups, notifier: { enabled: true, async send() {} } });
  const server = runtime.app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((r) => server.close(r));
    await runtime.close();
    db.close();
  });
  return { url: `http://127.0.0.1:${server.address().port}`, runtime };
}
test('production requests require administrative access, explicit opening and healthy required backups', async (t) => {
  const disabled = await appFixture(t, { NODE_ENV: 'production' });
  assert.equal(disabled.runtime.acceptsBookings, false);
  const closed = await appFixture(t, {
    NODE_ENV: 'production',
    ADMIN_TOKEN: 'a'.repeat(64),
    BOOKING_REQUESTS_ENABLED: 'false',
  });
  assert.equal(closed.runtime.acceptsBookings, false);
  let healthy = false;
  const open = await appFixture(
    t,
    { NODE_ENV: 'production', ADMIN_TOKEN: 'a'.repeat(64), BACKUP_REQUIRED: 'true' },
    { status: () => ({ healthy }) },
  );
  assert.equal((await (await fetch(open.url + '/api/health')).json()).acceptsBookings, false);
  healthy = true;
  assert.equal((await (await fetch(open.url + '/api/health')).json()).acceptsBookings, true);
  healthy = false;
  assert.equal(open.runtime.acceptsBookings, false);
  assert.equal((await fetch(open.url + '/api/admin/system')).status, 401);
});
test('canonical production host redirects only to the configured origin', async (t) => {
  const a = await appFixture(t, {
    NODE_ENV: 'production',
    PUBLIC_ORIGIN: 'https://uxarbeiti.eus',
    CANONICAL_REDIRECT: 'true',
  });
  const r = await fetch(a.url + '/eu/reserva.html?property=domo', { redirect: 'manual' });
  assert.equal(r.status, 308);
  assert.equal(r.headers.get('location'), 'https://uxarbeiti.eus/eu/reserva.html?property=domo');
});
test('trusted alwaysdata real IP replaces forged forwarding chains; untrusted peers cannot spoof', async (t) => {
  const token = 'b'.repeat(64);
  const trusted = await appFixture(t, {
    ADMIN_TOKEN: token,
    TRUST_PROXY: 'loopback',
    REAL_IP_HEADER: 'x-real-ip',
  });
  const r = await fetch(trusted.url + '/api/admin/system', {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Real-IP': '192.0.2.10',
      'X-Forwarded-For': '198.51.100.3',
    },
  });
  assert.equal((await r.json()).connection.client, '192.0.2.10');
  assert.equal(
    (await fetch(trusted.url + '/api/health', { headers: { 'X-Real-IP': 'invalid,192.0.2.1' } }))
      .status,
    400,
  );
  const untrusted = await appFixture(t, {
    ADMIN_TOKEN: token,
    TRUST_PROXY: '192.0.2.11',
    REAL_IP_HEADER: 'x-real-ip',
  });
  const p = await fetch(untrusted.url + '/api/admin/system', {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Real-IP': '192.0.2.10',
      'X-Forwarded-For': '198.51.100.3',
    },
  });
  assert.equal((await p.json()).connection.client, '127.0.0.1');
});
test('automatic backups run immediately, deduplicate concurrent work, repeat daily and recover after failure', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ux-scheduler-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  let clock = Date.now(),
    calls = 0,
    fail = false;
  const scheduler = startBackups({
    source: 'synthetic',
    directory: dir,
    now: () => clock,
    logger: {
      error(message) {
        assert.ok(!message.includes('secret'));
      },
    },
    async backup() {
      calls++;
      if (fail) throw new Error('secret provider response');
    },
  });
  t.after(() => scheduler.stop());
  const first = scheduler.tick();
  assert.equal(first, scheduler.ready);
  await first;
  assert.equal(calls, 1);
  assert.equal(scheduler.status().healthy, true);
  clock += 23 * 3600000;
  await scheduler.tick();
  assert.equal(calls, 1);
  clock += 3600000;
  fail = true;
  await scheduler.tick();
  assert.equal(calls, 2);
  assert.equal(scheduler.status().healthy, false);
  fail = false;
  await scheduler.tick();
  assert.equal(scheduler.status().healthy, true);
  clock += 37 * 3600000;
  assert.equal(scheduler.status().healthy, false);
  await scheduler.stop();
  await scheduler.tick();
  assert.equal(calls, 3);
});
test('automatic backup survives restart with a verified snapshot and replaces a corrupt one', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ux-auto-backup-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const source = path.join(dir, 'app.db');
  const db = createDatabase(source);
  t.after(() => db.close());
  const directory = path.join(dir, 'snapshots');
  const first = startBackups({ source, directory });
  await first.ready;
  assert.equal(first.status().healthy, true);
  await first.stop();
  assert.equal(fs.readdirSync(directory).length, 1);
  const second = startBackups({ source, directory });
  await second.ready;
  assert.equal(second.status().healthy, true);
  assert.equal(fs.readdirSync(directory).length, 1);
  await second.stop();
  fs.writeFileSync(path.join(directory, fs.readdirSync(directory)[0]), 'corrupt snapshot');
  const third = startBackups({ source, directory });
  await third.ready;
  assert.equal(third.status().healthy, true);
  assert.equal(fs.readdirSync(directory).length, 2);
  await third.stop();
});
