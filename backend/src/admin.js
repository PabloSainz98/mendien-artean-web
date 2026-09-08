'use strict';
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const express = require('express');
const pricing = require('../../shared/pricing');
const { validateBookingPayload } = require('./validation');
const { validateEdit, validatePayment, financials } = require('./management');
const scrypt = promisify(crypto.scrypt);
const digest = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const same = (a, b) => crypto.timingSafeEqual(Buffer.from(digest(a)), Buffer.from(digest(b)));
const HASH = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/;

async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128)
    throw new Error('Use a password between 12 and 128 characters');
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt}$${key.toString('hex')}`;
}
async function verifyPassword(password, hash) {
  if (typeof password !== 'string' || password.length > 128 || !HASH.test(hash)) return false;
  const [, salt, expected] = HASH.exec(hash);
  const key = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return crypto.timingSafeEqual(key, Buffer.from(expected, 'hex'));
}
const publicItem = ({ idempotency_key, payload_hash, ip_hash, ...item }) => ({
  ...item,
  financials: financials(item),
});

function createAdmin({ db, env, acceptsBookings, changed }) {
  const router = express.Router();
  const hash = env.ADMIN_PASSWORD_HASH || '';
  if (hash && !HASH.test(hash))
    throw new Error('Invalid ADMIN_PASSWORD_HASH. Run npm run admin:password');
  const production = env.NODE_ENV === 'production';
  if (
    production &&
    hash &&
    (!env.PUBLIC_ORIGIN || new URL(env.PUBLIC_ORIGIN).protocol !== 'https:')
  )
    throw new Error('Administrative sessions require an HTTPS PUBLIC_ORIGIN in production');
  const cookieName = production ? '__Host-uxarbeiti_admin' : 'uxarbeiti_admin';
  const cookieOptions = { httpOnly: true, secure: production, sameSite: 'strict', path: '/' };
  const version = digest(hash);
  const attempts = new Map();
  let activeLogins = 0;
  let globalAttempts = { count: 0, until: 0 };
  const originOK = (req) =>
    req.get('Origin') ===
    (env.PUBLIC_ORIGIN
      ? new URL(env.PUBLIC_ORIGIN).origin
      : `${req.protocol}://${req.get('host')}`);
  function session(req) {
    const token = (req.get('Cookie') || '')
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(cookieName + '='))
      ?.slice(cookieName.length + 1);
    if (!hash || !/^[a-f0-9]{64}$/.test(token || '')) return null;
    const tokenHash = digest(token);
    const record = db.getSession(tokenHash, version);
    return record ? { ...record, tokenHash } : null;
  }
  function requireAdmin(req, res, next) {
    if (env.ADMIN_TOKEN && same(req.get('Authorization') || '', `Bearer ${env.ADMIN_TOKEN}`)) {
      req.adminBearer = true;
      return next();
    }
    req.adminSession = session(req);
    if (!req.adminSession) return res.status(401).json({ ok: false, error: 'unauthorized' });
    if (
      !['GET', 'HEAD'].includes(req.method) &&
      (!originOK(req) || !same(req.get('X-CSRF-Token') || '', req.adminSession.csrf))
    )
      return res.status(403).json({ ok: false, error: 'csrf' });
    next();
  }
  router.post('/login', async (req, res) => {
    if (!req.is('application/json') || !originOK(req))
      return res.status(403).json({ ok: false, error: 'origin' });
    if (!hash) return res.status(503).json({ ok: false, error: 'admin_unconfigured' });
    const now = Date.now();
    for (const [ip, bucket] of attempts) if (bucket.until <= now) attempts.delete(ip);
    if (globalAttempts.until <= now) globalAttempts = { count: 0, until: now + 900000 };
    const bucket = attempts.get(req.ip) || { count: 0, until: now + 900000 };
    if (bucket.count >= 5 || globalAttempts.count >= 30 || activeLogins >= 2) {
      res.set('Retry-After', '900');
      return res.status(429).json({ ok: false, error: 'rate' });
    }
    bucket.count++;
    globalAttempts.count++;
    attempts.set(req.ip, bucket);
    activeLogins++;
    let valid;
    try {
      valid = await verifyPassword(req.body?.password, hash);
    } finally {
      activeLogins--;
    }
    if (!valid) return res.status(401).json({ ok: false, error: 'unauthorized' });
    attempts.delete(req.ip);
    const old = session(req);
    if (old) db.deleteSession(old.tokenHash);
    const token = crypto.randomBytes(32).toString('hex');
    const csrf = crypto.randomBytes(32).toString('hex');
    const expires = now + 8 * 3600000;
    db.createSession(digest(token), csrf, expires, version);
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: 8 * 3600000 });
    res.json({ ok: true, csrf, expires, emailEnabled: acceptsBookings });
  });
  router.use(requireAdmin);
  router.param('id', (req, res, next, id) => {
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))
      return res.status(404).json({ ok: false, error: 'not_found' });
    next();
  });
  router.get('/session', (req, res) =>
    res.json({
      ok: true,
      csrf: req.adminSession?.csrf,
      expires: req.adminSession?.expires,
      emailEnabled: acceptsBookings,
    }),
  );
  router.post('/logout', (req, res) => {
    if (req.adminSession) db.deleteSession(req.adminSession.tokenHash);
    res.clearCookie(cookieName, cookieOptions).json({ ok: true });
  });
  router.get('/booking-requests/:id', (req, res) => {
    const item = db.getRequest(Number(req.params.id));
    if (!item) return res.status(404).json({ ok: false, error: 'not_found' });
    res.json({ ok: true, item: publicItem(item), ...db.history(item.id) });
  });
  router.get('/calendar', (req, res) => {
    const { start, end } = req.query;
    if (
      !pricing.parseDate(start) ||
      !pricing.parseDate(end) ||
      end <= start ||
      end > pricing.addDays(start, 93)
    )
      return res.status(400).json({ ok: false, error: 'form' });
    res.json({
      ok: true,
      items: db.calendar(start, end),
      blocks: db.listBlocks().filter((b) => b.checkin_date < end && b.checkout_date > start),
    });
  });
  router.patch('/booking-requests/:id', (req, res) => {
    const item = db.getRequest(Number(req.params.id));
    if (!item) return res.status(404).json({ ok: false, error: 'not_found' });
    const result = validateEdit(req.body, item);
    if (!result.ok) return res.status(400).json({ ok: false, error: result.error });
    const updated = db.editRequest(item.id, result.data, req.body.revision);
    changed();
    res.json({ ok: true, item: publicItem(updated) });
  });
  router.post('/booking-requests/:id/payments', (req, res) => {
    const key = req.get('Idempotency-Key');
    if (
      !validatePayment(req.body) ||
      !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(key || '')
    )
      return res.status(400).json({ ok: false, error: 'form' });
    const updated = db.addPayment(
      Number(req.params.id),
      req.body,
      key,
      digest(JSON.stringify(req.body)),
    );
    changed();
    res.json({ ok: true, item: publicItem(updated) });
  });
  router.post('/booking-requests/:id/decision', (req, res) => {
    const { status, revision, notifyGuest = true } = req.body || {};
    if (
      !Number.isSafeInteger(revision) ||
      revision < 0 ||
      !['confirmed', 'rejected', 'cancelled'].includes(status) ||
      typeof notifyGuest !== 'boolean'
    )
      return res.status(400).json({ ok: false, error: 'form' });
    const item = db.getRequest(Number(req.params.id));
    if (!item) return res.status(404).json({ ok: false, error: 'not_found' });
    if (notifyGuest && item.email && !acceptsBookings)
      return res.status(503).json({ ok: false, error: 'email_disabled' });
    const result = db.decide(item.id, status, revision, notifyGuest);
    changed();
    res.json({ ok: true, item: publicItem(result) });
  });
  router.post('/booking-requests', (req, res) => {
    const input = req.body;
    if (!input || !['whatsapp', 'phone', 'platform'].includes(input.source))
      return res.status(400).json({ ok: false, error: 'form' });
    // Manual entries do not pretend the visitor submitted the website consent checkbox.
    let quote;
    try {
      quote = pricing.quote(input);
    } catch {
      return res.status(400).json({ ok: false, error: 'form' });
    }
    const result = validateBookingPayload({
      ...input,
      email: input.email || 'manual@example.test',
      consent: true,
      expectedTotal: quote.total,
    });
    if (!result.ok) return res.status(400).json({ ok: false, error: result.error });
    result.data.email = input.email ? result.data.email : '';
    result.data.consentVersion = 'staff-entry';
    const key = req.get('Idempotency-Key');
    if (!/^[a-f0-9-]{36}$/i.test(key || ''))
      return res.status(400).json({ ok: false, error: 'idempotency' });
    const record = db.createRequest(
      result.data,
      key,
      digest(JSON.stringify({ ...result.data, source: input.source })),
      input.source,
    );
    if (record.conflict) return res.status(409).json({ ok: false, error: 'idempotency_conflict' });
    changed();
    res
      .status(record.duplicate ? 200 : 201)
      .json({ ok: true, item: publicItem(db.getRequest(record.id)) });
  });
  router.get('/blocks', (_req, res) => res.json({ ok: true, items: db.listBlocks() }));
  router.post('/blocks', (req, res) => {
    const { property, checkin, checkout, note = '' } = req.body || {};
    if (
      !Object.hasOwn(pricing.CAPACITY, property) ||
      !pricing.parseDate(checkin) ||
      !pricing.parseDate(checkout) ||
      checkout <= checkin ||
      checkin < pricing.today() ||
      checkout > pricing.addDays(pricing.today(), 1095) ||
      typeof note !== 'string' ||
      note.length > 200
    )
      return res.status(400).json({ ok: false, error: 'form' });
    const id = db.addBlock(property, checkin, checkout, note.trim());
    res.status(201).json({ ok: true, id });
  });
  router.delete('/blocks/:id', (req, res) =>
    res.json({ ok: true, removed: db.deleteBlock(Number(req.params.id)) }),
  );
  return { router, requireAdmin };
}
module.exports = { createAdmin, hashPassword, verifyPassword };
