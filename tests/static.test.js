'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const zlib = require('node:zlib');
const { once } = require('node:events');
const { precompress } = require('../scripts/precompress');
const { createApp } = require('../backend/src/server');
const { createDatabase } = require('../backend/src/db');

async function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ux-compression-'));
  const files = ['index.html', 'en/index.html', 'eu/reserva.html', 'assets/app.0123456789.js'];
  for (const file of [...files, 'plain.html', 'gestion/index.html', 'sw.js']) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), '<!-- synthetic public content -->'.repeat(100));
  }
  precompress(dir, files);
  const db = createDatabase(':memory:');
  const runtime = createApp({ db, publicDir: dir });
  const server = runtime.app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    await runtime.close();
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const request = (route, headers = {}, method = 'GET') =>
    new Promise((resolve, reject) => {
      const req = http.request(
        { host: '127.0.0.1', port: server.address().port, path: route, method, headers },
        (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () =>
            resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }),
          );
        },
      );
      req.on('error', reject);
      req.end();
    });
  return { dir, request };
}

test('prebuilt Brotli and gzip preserve public bytes, type, validators, HEAD and aliases', async (t) => {
  const { dir, request } = await fixture(t);
  for (const [route, file] of [
    ['/', 'index.html'],
    ['/en/', 'en/index.html'],
    ['/eu/reserva?property=casa', 'eu/reserva.html'],
    ['/assets/app.0123456789.js', 'assets/app.0123456789.js'],
  ]) {
    const source = fs.readFileSync(path.join(dir, file));
    for (const encoding of ['br', 'gzip']) {
      const r = await request(route, { 'Accept-Encoding': encoding });
      assert.equal(r.status, 200);
      assert.equal(r.headers['content-encoding'], encoding);
      assert.equal(r.headers.vary, 'Accept-Encoding');
      assert.match(r.headers['content-type'], file.endsWith('.js') ? /javascript/ : /text\/html/);
      assert.equal(Number(r.headers['content-length']), r.body.length);
      assert.ok(r.body.length < source.length / 2);
      assert.deepEqual(
        encoding === 'br' ? zlib.brotliDecompressSync(r.body) : zlib.gunzipSync(r.body),
        source,
      );
      assert.equal(
        r.headers['cache-control'],
        file.endsWith('.js') ? 'public, max-age=31536000, immutable' : 'no-cache',
      );
      assert.equal(
        (await request(route, { 'Accept-Encoding': encoding, 'If-None-Match': r.headers.etag }))
          .status,
        304,
      );
      const head = await request(route, { 'Accept-Encoding': encoding }, 'HEAD');
      assert.equal(head.status, 200);
      assert.equal(head.body.length, 0);
    }
  }
});

test('encoding preferences, identity, ranges and missing variants fall back safely', async (t) => {
  const { request } = await fixture(t);
  assert.equal(
    (await request('/', { 'Accept-Encoding': 'gzip;q=1, br;q=0.5' })).headers['content-encoding'],
    'gzip',
  );
  for (const headers of [
    {},
    { 'Accept-Encoding': 'br;q=0, gzip;q=0' },
    { 'Accept-Encoding': 'identity' },
  ]) {
    const r = await request('/', headers);
    assert.equal(r.status, 200);
    assert.equal(r.headers['content-encoding'], undefined);
    assert.equal(r.headers.vary, 'Accept-Encoding');
  }
  assert.equal((await request('/', { 'Accept-Encoding': '*;q=0, identity;q=0' })).status, 406);
  const range = await request('/', { 'Accept-Encoding': 'br', Range: 'bytes=0-9' });
  assert.equal(range.status, 206);
  assert.equal(range.body.length, 10);
  assert.equal(range.headers['content-encoding'], undefined);
  const plain = await request('/plain.html', { 'Accept-Encoding': 'br' });
  assert.equal(plain.status, 200);
  assert.equal(plain.headers['content-encoding'], undefined);
  const missing = await request('/missing.html', { 'Accept-Encoding': 'br' });
  assert.equal(missing.status, 404);
  assert.equal(missing.headers['content-encoding'], undefined);
});

test('private endpoints, management and encoded files cannot enter public compression/cache', async (t) => {
  const { request } = await fixture(t);
  for (const route of [
    '/api/health',
    '/api/admin/booking-requests',
    '/gestion/',
    '/gestion/index.html',
  ]) {
    const r = await request(route, { 'Accept-Encoding': 'br, gzip' });
    assert.equal(r.headers['content-encoding'], undefined);
    assert.equal(r.headers['cache-control'], 'no-store');
  }
  for (const route of [
    '/.compressed/br/index.html',
    '/.compressed/gzip/eu/reserva.html',
    '/%2ecompressed/br/index.html',
    '/assets/../../.env',
    '/.env',
    '/backend/src/server.js',
  ]) {
    const r = await request(route, { 'Accept-Encoding': 'br' });
    assert.equal(r.status, 404, route);
    assert.equal(r.headers['content-encoding'], undefined);
  }
});

test('rebuilding compression removes variants for withdrawn pages', async (t) => {
  const { dir } = await fixture(t);
  precompress(dir, ['index.html']);
  assert.equal(fs.existsSync(path.join(dir, '.compressed/br/eu/reserva.html')), false);
  assert.equal(fs.existsSync(path.join(dir, '.compressed/gzip/eu/reserva.html')), false);
});
