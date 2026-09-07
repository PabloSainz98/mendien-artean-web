'use strict';
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const helmet = require('helmet');
const { createDatabase } = require('./db');
const { validateBookingPayload } = require('./validation');
const { createNotifier, startOutbox } = require('./notifier');
const { buildBookingsCsv, exportBookingsCsv } = require('./csv');
const backendRoot = path.resolve(__dirname, '..');
const digest = (value) => crypto.createHash('sha256').update(String(value)).digest();

function createApp({
  db,
  notifier = { enabled: false },
  env = {},
  csvPath,
  publicDir = path.resolve(backendRoot, '../dist'),
  logger = console,
} = {}) {
  if (!db) throw new Error('Database required');
  const app = express();
  const production = env.NODE_ENV === 'production';
  const adminToken = env.ADMIN_TOKEN || '';
  if (adminToken && (adminToken.length < 32 || /change-this|replace|example/i.test(adminToken)))
    throw new Error('ADMIN_TOKEN must contain at least 32 random characters');
  if (env.TRUST_PROXY === 'true')
    throw new Error('Use a trusted proxy IP or loopback for TRUST_PROXY, never true');
  const publicOrigin = env.PUBLIC_ORIGIN ? new URL(env.PUBLIC_ORIGIN).origin : null;
  const acceptsBookings =
    notifier.enabled || (!production && env.ACCEPT_BOOKINGS_WITHOUT_EMAIL === 'true');
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY && env.TRUST_PROXY !== 'false' ? env.TRUST_PROXY : false);
  app.use(
    helmet({
      hsts: production,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          fontSrc: ["'self'"],
          imgSrc: ["'self'"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          baseUri: ["'none'"],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  const buckets = new Map();
  let lastCleanup = 0;
  const maxRequests = Number(env.RATE_LIMIT_MAX || 20);
  function rateLimit(req, res, next) {
    const now = Date.now();
    if (now - lastCleanup > 60000) {
      for (const [key, bucket] of buckets) if (bucket.until <= now) buckets.delete(key);
      lastCleanup = now;
    }
    const key = req.ip;
    let bucket = buckets.get(key);
    if (!bucket || bucket.until <= now) {
      if (buckets.size >= 10000 && !buckets.has(key))
        return res.status(503).json({ ok: false, error: 'busy' });
      bucket = { count: 0, until: now + 900000 };
      buckets.set(key, bucket);
    }
    if (++bucket.count > maxRequests) {
      res.set('Retry-After', String(Math.ceil((bucket.until - now) / 1000)));
      return res.status(429).json({ ok: false, error: 'rate' });
    }
    next();
  }
  app.use('/api', rateLimit);
  app.use(express.json({ limit: '12kb', strict: true }));
  const outbox = startOutbox(db, notifier, logger);
  app.get('/api/health', (_req, res) => res.json({ ok: true, acceptsBookings }));
  app.post('/api/booking-requests', (req, res) => {
    if (!req.is('application/json'))
      return res.status(415).json({ ok: false, error: 'json_required' });
    const origin = req.get('Origin');
    if (origin && origin !== (publicOrigin || `${req.protocol}://${req.get('host')}`))
      return res.status(403).json({ ok: false, error: 'origin' });
    const key = req.get('Idempotency-Key');
    if (!key || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key))
      return res.status(400).json({ ok: false, error: 'idempotency' });
    const result = validateBookingPayload(req.body);
    if (!result.ok)
      return res
        .status(result.error === 'changed' ? 409 : 400)
        .json({ ok: false, error: result.spam ? 'form' : result.error });
    if (!acceptsBookings) return res.status(503).json({ ok: false, error: 'booking_unavailable' });
    const data = result.data;
    const record = db.createRequest(data, key, digest(JSON.stringify(data)).toString('hex'));
    if (record.conflict) return res.status(409).json({ ok: false, error: 'idempotency_conflict' });
    if (csvPath) {
      try {
        exportBookingsCsv(csvPath, db.allRequests());
      } catch {
        logger.error('CSV export failed. The request is safely stored in SQLite.');
      }
    }
    outbox.kick();
    res.status(record.duplicate ? 200 : 201).json({
      ok: true,
      requestId: `UX-${String(record.id).padStart(6, '0')}`,
      status: 'pending_confirmation',
    });
  });
  function requireAdmin(req, res, next) {
    if (
      !adminToken ||
      !crypto.timingSafeEqual(
        digest(req.get('Authorization') || ''),
        digest(`Bearer ${adminToken}`),
      )
    )
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    next();
  }
  app.get('/api/admin/booking-requests', requireAdmin, (req, res) => {
    const limit = Math.min(500, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const offset = Math.max(0, Number.parseInt(req.query.offset, 10) || 0);
    const items = db
      .listRequests(limit, offset)
      .map(({ idempotency_key, payload_hash, ip_hash, ...item }) => item);
    res.json({ ok: true, items, limit, offset });
  });
  app.get('/api/admin/booking-requests.csv', requireAdmin, (_req, res) => {
    res
      .type('text/csv')
      .attachment('uxarbeiti-reservas.csv')
      .send(buildBookingsCsv(db.allRequests()));
  });
  app.use('/api', (_req, res) => res.status(404).json({ ok: false, error: 'not_found' }));
  app.use(
    express.static(publicDir, {
      dotfiles: 'deny',
      index: 'index.html',
      extensions: ['html'],
      setHeaders(res, file) {
        res.set(
          'Cache-Control',
          /\.[a-f0-9]{10}\.(css|js)$/.test(file)
            ? 'public, max-age=31536000, immutable'
            : file.endsWith('.html') || file.endsWith('sw.js')
              ? 'no-cache'
              : 'public, max-age=86400',
        );
      },
    }),
  );
  app.use((_req, res) =>
    res
      .status(404)
      .type('text/plain')
      .send('404 · UXARBEITI · Página no encontrada / Page not found / Orria ez da aurkitu'),
  );
  app.use((error, req, res, _next) => {
    const status =
      error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    if (status === 500) logger.error('Request failed. No personal data logged.');
    res.status(status).json({ ok: false, error: status === 500 ? 'server_error' : 'invalid_body' });
  });
  return { app, close: () => outbox.stop(), acceptsBookings };
}

if (require.main === module) {
  require('dotenv').config({ path: path.join(backendRoot, '.env') });
  process.umask(0o077);
  const env = process.env;
  const db = createDatabase(path.resolve(backendRoot, env.DATABASE_PATH || 'data/app.db'));
  const notifier = createNotifier(env);
  const csvPath = path.resolve(backendRoot, env.BOOKINGS_CSV_PATH || 'data/bookings.csv');
  const publicDir = path.resolve(backendRoot, '../dist');
  if (!fs.existsSync(path.join(publicDir, 'index.html')))
    throw new Error('Run npm run build before starting the server');
  const runtime = createApp({ db, notifier, env, csvPath, publicDir });
  const host = env.HOST || '127.0.0.1';
  const port = Number(env.PORT || 8787);
  const server = runtime.app.listen(port, host, () => {
    console.log(`UXARBEITI: http://${host}:${port}`);
    console.log(
      runtime.acceptsBookings
        ? `Booking requests enabled. SMTP ${notifier.enabled ? 'enabled' : 'disabled (explicit local/test mode)'}.`
        : 'Booking requests disabled until SMTP is configured. The website and price calculator are available.',
    );
  });
  let closing = false;
  async function stop() {
    if (closing) return;
    closing = true;
    const timeout = setTimeout(() => process.exit(1), 45000);
    timeout.unref();
    server.close(async () => {
      await runtime.close();
      db.close();
      clearTimeout(timeout);
    });
  }
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
module.exports = { createApp };
