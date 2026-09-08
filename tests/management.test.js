'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { once } = require('node:events');
const { createDatabase } = require('../backend/src/db');
const { createApp } = require('../backend/src/server');
const { validateEdit, validatePayment, financials } = require('../backend/src/management');
const { buildEmail } = require('../backend/src/notifier');
const { buildBookingsCsv } = require('../backend/src/csv');
const { validateBookingPayload } = require('../backend/src/validation');
const { version, issues, config } = require('../shared/legal');
const { renderPage } = require('../site/templates');
const { legalContent } = require('../site/legal');
const P = require('../shared/pricing');
const day = (n) => P.addDays(P.today(), n);
const data = (changes = {}) => {
  const d = {
    property: 'casa',
    checkin: day(10),
    checkout: day(12),
    adults: 2,
    children: 1,
    pets: 1,
    name: 'Synthetic Guest',
    email: 'test@example.test',
    phone: '+34600000000',
    message: '',
    language: 'es',
    consentVersion: 'test',
    ...changes,
  };
  return { ...d, quote: P.quote(d) };
};
function create(db, changes) {
  return db.createRequest(data(changes), crypto.randomUUID(), 'test').id;
}
const edit = (changes = {}) => ({
  ...data(),
  revision: 0,
  agreedTotalCents: null,
  depositDueCents: 0,
  reason: 'Cambio acordado',
  ...changes,
});
const payment = (changes = {}) => ({
  revision: 0,
  kind: 'payment',
  amountCents: 5000,
  method: 'transfer',
  date: P.today(),
  note: 'Señal',
  ...changes,
});
const saveEdit = (db, id, body) => {
  const result = validateEdit(body, db.getRequest(id));
  assert.equal(result.ok, true);
  return db.editRequest(id, result.data, body.revision);
};
test('editing preserves IDs, original privacy notice, reprices by season and keeps minimal audit', () => {
  const db = createDatabase(':memory:');
  try {
    const id = create(db);
    const original = db.getRequest(id);
    const result = saveEdit(
      db,
      id,
      edit({
        property: 'domo',
        checkin: day(14),
        checkout: day(17),
        email: 'new@example.test',
        agreedTotalCents: 60000,
        depositDueCents: 10000,
      }),
    );
    assert.equal(result.id, id);
    assert.equal(result.revision, 1);
    assert.equal(result.property, 'domo');
    assert.equal(result.consent_version, original.consent_version);
    assert.equal(result.payload_hash, original.payload_hash);
    assert.equal(
      JSON.parse(result.quote_json).total,
      P.quote(data({ property: 'domo', checkin: day(14), checkout: day(17) })).total,
    );
    assert.equal(financials(result).totalCents, 60000);
    const history = db.history(id);
    assert.equal(history.changes.length, 1);
    assert.ok(!JSON.stringify(history.changes).includes('test@example.test'));
    assert.throws(() => saveEdit(db, id, edit()), { code: 'stale' });
  } finally {
    db.close();
  }
});
test('confirmed edits release old dates but reject overlaps including blocks and another property', () => {
  const db = createDatabase(':memory:');
  try {
    const id = create(db);
    db.decide(id, 'confirmed', 0, false);
    const other = create(db, { checkin: day(20), checkout: day(22) });
    db.decide(other, 'confirmed', 0, false);
    assert.throws(
      () => saveEdit(db, id, edit({ revision: 1, checkin: day(19), checkout: day(21) })),
      { code: 'occupied' },
    );
    assert.equal(db.getRequest(id).checkin_date, day(10));
    assert.equal(db.history(id).changes.length, 0);
    db.addBlock('domo', day(10), day(12), 'Mantenimiento');
    assert.throws(() => saveEdit(db, id, edit({ revision: 1, property: 'domo' })), {
      code: 'occupied',
    });
    saveEdit(db, id, edit({ revision: 1, checkin: day(18), checkout: day(20) }));
    assert.equal(db.availability('casa')[0].checkin_date, day(18));
    db.decide(id, 'cancelled', 2, false);
    assert.throws(() => saveEdit(db, id, edit({ revision: 3 })), { code: 'transition' });
  } finally {
    db.close();
  }
});
test('payments are integer cents, idempotent, reversible by refund and survive cancellation', () => {
  const db = createDatabase(':memory:');
  try {
    const id = create(db);
    const key = crypto.randomUUID();
    db.addPayment(id, payment(), key, 'same');
    db.addPayment(id, payment(), key, 'same');
    assert.equal(db.getRequest(id).paid_cents, 5000);
    assert.equal(db.history(id).payments.length, 1);
    assert.throws(() => db.addPayment(id, payment(), key, 'different'), {
      code: 'idempotency_conflict',
    });
    assert.throws(() => db.addPayment(id, payment(), crypto.randomUUID(), 'other'), {
      code: 'stale',
    });
    assert.throws(
      () =>
        db.addPayment(
          id,
          payment({ revision: 1, kind: 'refund', amountCents: 5001 }),
          crypto.randomUUID(),
          'refund',
        ),
      { code: 'refund_exceeds_paid' },
    );
    db.addPayment(
      id,
      payment({ revision: 1, kind: 'refund', amountCents: 1250 }),
      crypto.randomUUID(),
      'refund',
    );
    assert.equal(db.getRequest(id).paid_cents, 3750);
    saveEdit(db, id, edit({ revision: 2, agreedTotalCents: 3000 }));
    assert.equal(financials(db.getRequest(id)).balanceCents, -750);
    db.decide(id, 'rejected', 3, false);
    assert.equal(db.getRequest(id).paid_cents, 3750);
    assert.throws(
      () => db.addPayment(id, payment({ revision: 4 }), crypto.randomUUID(), 'closed'),
      { code: 'transition' },
    );
    db.addPayment(
      id,
      payment({ revision: 4, kind: 'refund', amountCents: 3750 }),
      crypto.randomUUID(),
      'final',
    );
    assert.equal(db.getRequest(id).paid_cents, 0);
    const csv = buildBookingsCsv(db.allRequests());
    assert.match(csv, /"agreed_total"/);
    assert.match(csv, /"paid"/);
  } finally {
    db.close();
  }
});
test('payment and editing reject unsafe money, invalid dates, forged prices and lost contact', () => {
  for (const value of [-1, 0, 0.1, NaN, Infinity, '50', 100000001])
    assert.equal(validatePayment(payment({ amountCents: value })), false);
  assert.equal(validatePayment(payment({ date: day(1) })), false);
  const item = { ...data(), source: 'website', checkin_date: day(10) };
  for (const input of [
    edit({ adults: 4, children: 1 }),
    edit({ depositDueCents: 10000000 }),
    edit({ agreedTotalCents: 1.5 }),
    edit({ email: '' }),
    edit({ checkin: day(-1) }),
  ])
    assert.equal(validateEdit(input, item).ok, false);
});
test('claimed notifications temporarily prevent edits and confirmed mail uses agreed price and arrival link', () => {
  const db = createDatabase(':memory:');
  try {
    const id = create(db);
    db.claimEmail();
    assert.throws(() => saveEdit(db, id, edit()), { code: 'mail_busy' });
    db.markEmailSent(id);
    saveEdit(db, id, edit({ agreedTotalCents: 22222 }));
    const mail = buildEmail(
      { ...db.getRequest(id), kind: 'confirmed', language: 'eu' },
      { from: 'from@example.test', to: 'to@example.test', publicOrigin: 'https://example.test' },
    );
    assert.match(mail.text, /222,22/);
    assert.match(mail.html, /eu\/como-llegar.html/);
    assert.ok(!mail.html.includes('deposit_due_cents'));
  } finally {
    db.close();
  }
});
test('calendar API is authenticated, bounded and independent of request-list pagination', async (t) => {
  const db = createDatabase(':memory:');
  const token = crypto.randomBytes(32).toString('hex');
  const app = createApp({ db, env: { ADMIN_TOKEN: token }, logger: { error() {} } });
  const server = app.app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((r) => server.close(r));
    await app.close();
    db.close();
  });
  const id = create(db);
  db.decide(id, 'confirmed', 0, false);
  for (let n = 0; n < 110; n++) create(db, { property: 'domo' });
  const url = `http://127.0.0.1:${server.address().port}/api/admin`;
  const auth = { Authorization: `Bearer ${token}` };
  const route = `/calendar?start=${day(0)}&end=${day(30)}`;
  assert.equal((await fetch(url + route)).status, 401);
  const res = await fetch(url + route, { headers: auth });
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const json = await res.json();
  assert.equal(json.items.length, 1);
  assert.equal(json.items[0].id, id);
  assert.equal(json.items[0].email, undefined);
  assert.equal(
    (await fetch(url + `/calendar?start=${day(0)}&end=${day(100)}`, { headers: auth })).status,
    400,
  );
  const unauthorized = await fetch(url + `/booking-requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(edit()),
  });
  assert.equal(unauthorized.status, 401);
  const body = edit({ revision: 1, checkin: day(15), checkout: day(16) });
  assert.equal(
    (
      await fetch(url + `/booking-requests/${id}`, {
        method: 'PATCH',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    ).status,
    200,
  );
});
test('legal drafts cannot pass publication checks and notices are versioned without marketing consent', () => {
  assert.ok(issues().includes('holder'));
  assert.ok(issues().includes('approvedForPublication'));
  assert.equal(config.approvedForPublication, false);
  const old = validateBookingPayload({
    ...data(),
    consent: true,
    expectedTotal: data().quote.total,
    privacyVersion: 'old',
  });
  assert.equal(old.error, 'privacy_changed');
  const current = validateBookingPayload({
    ...data(),
    consent: true,
    expectedTotal: data().quote.total,
    privacyVersion: version,
  });
  assert.equal(current.ok, true);
  assert.equal(current.data.consentVersion, version);
  const legacy = validateBookingPayload({
    ...data(),
    consent: true,
    expectedTotal: data().quote.total,
  });
  assert.equal(legacy.ok, true);
  assert.equal(legacy.data.consentVersion, 'legacy-unversioned');
  for (const lang of ['es', 'en', 'eu']) {
    const legal = legalContent(lang);
    assert.equal(Object.keys(legal.pages).length, 4);
    for (const page of Object.keys(legal.pages)) {
      const html = renderPage(
        page,
        lang,
        { css: 'x.css', js: 'x.js', pricing: 'p.js' },
        'https://example.test/',
      );
      assert.match(html, /noindex,nofollow/);
      assert.ok(html.includes(legal.draft));
      assert.ok(!html.includes('undefined'));
      assert.ok(!html.includes('ec.europa.eu/consumers/odr'));
    }
  }
});

test('partial publication preserves the existing notice without publishing draft terms or claiming approval', () => {
  const { published, publishedVersion } = require('../shared/legal');
  assert.ok(issues().length > 0);
  for (const lang of ['es', 'en', 'eu']) {
    const previous = legalContent(lang, 'published');
    assert.equal(previous.ready, false);
    assert.deepEqual(Object.keys(previous.pages), ['privacidad']);
    assert.deepEqual(previous.pages.privacidad.sections, published[lang].sections);
    for (const page of ['index', 'reserva', 'privacidad', 'como-llegar']) {
      const html = renderPage(
        page,
        lang,
        { css: 'a.css', js: 'a.js', pricing: 'p.js' },
        'https://example.test/',
        { legalMode: 'published' },
      );
      assert.ok(!html.includes('legal-draft'));
      assert.ok(!html.includes('privacy-layer'));
      assert.ok(!html.includes('condiciones.html'));
      assert.ok(!html.includes('aviso-legal.html'));
      assert.ok(!html.includes(previous.pending));
    }
  }
  const accepted = validateBookingPayload({
    ...data(),
    consent: true,
    expectedTotal: data().quote.total,
    privacyVersion: publishedVersion,
  });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.data.consentVersion, publishedVersion);
});
