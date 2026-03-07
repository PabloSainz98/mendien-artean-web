const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const helmet = require('helmet');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { createDatabase } = require('./db');
const { validateBookingPayload } = require('./validation');

const app = express();

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';
const trustProxy = String(process.env.TRUST_PROXY || 'false') === 'true';
const databasePath = process.env.DATABASE_PATH || path.resolve(__dirname, '..', 'data', 'app.db');
const adminToken = process.env.ADMIN_TOKEN || '';
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 20);
const bookingsCsvPath = process.env.BOOKINGS_CSV_PATH
  ? path.resolve(process.env.BOOKINGS_CSV_PATH)
  : path.resolve(__dirname, '..', 'data', 'bookings.csv');

const projectRoot = path.resolve(__dirname, '..', '..');
const db = createDatabase(databasePath);

app.disable('x-powered-by');
app.set('trust proxy', trustProxy);

app.use(
  helmet({
    hsts: isProduction,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  })
);
app.use(express.json({ limit: '20kb' }));

const ipBuckets = new Map();

function cleanupBuckets(now) {
  for (const [ip, bucket] of ipBuckets.entries()) {
    if (now - bucket.windowStart > rateLimitWindowMs) {
      ipBuckets.delete(ip);
    }
  }
}

function rateLimit(req, res, next) {
  const now = Date.now();
  cleanupBuckets(now);

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const bucket = ipBuckets.get(ip);

  if (!bucket || now - bucket.windowStart > rateLimitWindowMs) {
    ipBuckets.set(ip, { windowStart: now, count: 1 });
    return next();
  }

  if (bucket.count >= rateLimitMax) {
    return res.status(429).json({ ok: false, error: 'Too many requests' });
  }

  bucket.count += 1;
  return next();
}

function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip)).digest('hex');
}

function csvEscape(value) {
  const asString = value == null ? '' : String(value);
  return `"${asString.replace(/"/g, '""')}"`;
}

function buildBookingsCsv(items) {
  const headers = [
    'id',
    'name',
    'email',
    'phone',
    'guests',
    'checkin',
    'checkout',
    'status',
    'source',
    'createdAt',
    'message'
  ];

  const lines = [headers.map(csvEscape).join(',')];

  for (const item of items) {
    lines.push(
      [
        item.id,
        item.name,
        item.email,
        item.phone,
        item.guests,
        item.checkin,
        item.checkout,
        item.status,
        item.source,
        item.createdAt,
        item.message
      ]
        .map(csvEscape)
        .join(',')
    );
  }

  return `\uFEFF${lines.join('\n')}`;
}

function writeBookingsCsvSnapshot() {
  const items = db.listRequests(5000);
  const csv = buildBookingsCsv(items);
  fs.mkdirSync(path.dirname(bookingsCsvPath), { recursive: true });
  fs.writeFileSync(bookingsCsvPath, csv, 'utf8');
}

function requireAdmin(req, res, next) {
  if (!adminToken) {
    return res.status(503).json({ ok: false, error: 'Admin token not configured' });
  }

  const authHeader = req.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : '';

  if (!token || token !== adminToken) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  return next();
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'mendien-artean-backend',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/booking-requests', rateLimit, (req, res) => {
  const parsed = validateBookingPayload(req.body);

  if (!parsed.valid) {
    return res.status(400).json({ ok: false, error: 'Validation error', fields: parsed.errors });
  }

  // Honeypot: bots filling this field get a fake success without storing data.
  if (parsed.values.company) {
    return res.status(201).json({ ok: true, requestId: null });
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const requestId = db.insertRequest({
    ...parsed.values,
    ipHash: hashIp(ip)
  });

  try {
    writeBookingsCsvSnapshot();
  } catch (error) {
    console.error('CSV snapshot update failed:', error.message);
  }

  return res.status(201).json({ ok: true, requestId });
});

app.get('/api/admin/booking-requests', requireAdmin, (req, res) => {
  const limitParam = Number(req.query.limit);
  const safeLimit = Number.isInteger(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 100;

  const items = db.listRequests(safeLimit);
  res.json({ ok: true, count: items.length, items });
});

app.get('/api/admin/booking-requests.csv', requireAdmin, (_req, res) => {
  const csv = buildBookingsCsv(db.listRequests(5000));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=\"booking-requests.csv\"');
  res.send(csv);
});

app.use('/css', express.static(path.join(projectRoot, 'css')));
app.use('/js', express.static(path.join(projectRoot, 'js')));
app.use('/images', express.static(path.join(projectRoot, 'images')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

app.listen(port, host, () => {
  console.log(`Backend running at http://${host}:${port}`);
  console.log(`DB path: ${db.path}`);
});
