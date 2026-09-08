'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { assertLocalStorage } = require('./storage');

function createDatabase(databasePath) {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
    assertLocalStorage(path.dirname(databasePath));
  }
  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(`CREATE TABLE IF NOT EXISTS booking_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
    guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 4), checkin_date TEXT NOT NULL, checkout_date TEXT NOT NULL,
    message TEXT, status TEXT NOT NULL DEFAULT 'new', source TEXT NOT NULL DEFAULT 'website', ip_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`);
  // Additive migration: preserve original requests and IDs, without guessing their property.
  const columns = new Set(
    db
      .prepare('PRAGMA table_info(booking_requests)')
      .all()
      .map((column) => column.name),
  );
  const additions = {
    property: 'TEXT',
    adults: 'INTEGER',
    children: 'INTEGER',
    pets: 'INTEGER',
    nights: 'INTEGER',
    quote_json: 'TEXT',
    language: 'TEXT',
    consent_version: 'TEXT',
    idempotency_key: 'TEXT',
    payload_hash: 'TEXT',
    revision: 'INTEGER NOT NULL DEFAULT 0',
    decided_at: 'TEXT',
    agreed_total_cents: 'INTEGER',
    deposit_due_cents: 'INTEGER NOT NULL DEFAULT 0',
  };
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const [name, type] of Object.entries(additions))
      if (!columns.has(name)) db.exec(`ALTER TABLE booking_requests ADD COLUMN ${name} ${type}`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_requests_idempotency ON booking_requests(idempotency_key);
      CREATE INDEX IF NOT EXISTS idx_booking_requests_created_at ON booking_requests(created_at DESC);
      CREATE TABLE IF NOT EXISTS email_outbox (
        request_id INTEGER PRIMARY KEY REFERENCES booking_requests(id) ON DELETE CASCADE,
        state TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt INTEGER NOT NULL DEFAULT 0, sent_at TEXT, last_error TEXT
      );
      CREATE TABLE IF NOT EXISTS decision_outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL REFERENCES booking_requests(id),
        kind TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0, next_attempt INTEGER NOT NULL DEFAULT 0,
        sent_at TEXT, last_error TEXT, UNIQUE(request_id, kind)
      );
      CREATE TABLE IF NOT EXISTS booking_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER NOT NULL REFERENCES booking_requests(id),
        status TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS availability_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT, property TEXT NOT NULL,
        checkin_date TEXT NOT NULL, checkout_date TEXT NOT NULL, note TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS admin_sessions (
        token_hash TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires INTEGER NOT NULL, auth_version TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS booking_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER NOT NULL REFERENCES booking_requests(id),
        revision INTEGER NOT NULL, kind TEXT NOT NULL, reason TEXT NOT NULL,
        before_json TEXT NOT NULL, after_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS booking_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER NOT NULL REFERENCES booking_requests(id),
        idempotency_key TEXT NOT NULL UNIQUE, payload_hash TEXT NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('payment','refund')),
        amount_cents INTEGER NOT NULL CHECK(amount_cents > 0), method TEXT NOT NULL,
        payment_date TEXT NOT NULL, note TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_payments_request ON booking_payments(request_id);
      CREATE INDEX IF NOT EXISTS idx_changes_request ON booking_changes(request_id);
      CREATE INDEX IF NOT EXISTS idx_requests_occupancy ON booking_requests(status,checkin_date,checkout_date);`);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    db.close();
    throw error;
  }
  if (databasePath !== ':memory:') fs.chmodSync(databasePath, 0o600);
  const select = `SELECT b.*,
    COALESCE((SELECT SUM(CASE WHEN kind='payment' THEN amount_cents ELSE -amount_cents END) FROM booking_payments WHERE request_id=b.id),0) AS paid_cents,
    e.state AS notification_status, e.attempts AS notification_attempts, e.last_error AS notification_error,
    (SELECT state FROM decision_outbox WHERE request_id=b.id ORDER BY id DESC LIMIT 1) AS guest_notification_status
    FROM booking_requests b LEFT JOIN email_outbox e ON e.request_id = b.id`;
  const fail = (code) => {
    throw Object.assign(new Error(code), { code });
  };
  function overlaps(property, start, end, except = 0) {
    return Boolean(
      db
        .prepare(
          `SELECT id FROM booking_requests WHERE property=? AND status='confirmed'
      AND checkin_date < ? AND checkout_date > ? AND id != ? LIMIT 1`,
        )
        .get(property, end, start, except) ||
      db
        .prepare(
          'SELECT id FROM availability_blocks WHERE property=? AND checkin_date < ? AND checkout_date > ? LIMIT 1',
        )
        .get(property, end, start),
    );
  }
  const insert = db.prepare(`INSERT INTO booking_requests
    (name,email,phone,guests,checkin_date,checkout_date,message,ip_hash,property,adults,children,pets,nights,quote_json,language,consent_version,idempotency_key,payload_hash)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  return {
    path: databasePath,
    createRequest(data, key, hash, source = 'website') {
      db.exec('BEGIN IMMEDIATE');
      try {
        const existing = db
          .prepare('SELECT id, payload_hash FROM booking_requests WHERE idempotency_key = ?')
          .get(key);
        if (existing) {
          db.exec('COMMIT');
          return { id: existing.id, duplicate: true, conflict: existing.payload_hash !== hash };
        }
        if (overlaps(data.property, data.checkin, data.checkout)) fail('occupied');
        const result = insert.run(
          data.name,
          data.email,
          data.phone,
          data.adults + data.children,
          data.checkin,
          data.checkout,
          data.message,
          '',
          data.property,
          data.adults,
          data.children,
          data.pets,
          data.quote.nights,
          JSON.stringify(data.quote),
          data.language,
          data.consentVersion,
          key,
          hash,
        );
        const id = Number(result.lastInsertRowid);
        db.prepare('UPDATE booking_requests SET source = ? WHERE id = ?').run(source, id);
        if (source === 'website')
          db.prepare('INSERT INTO email_outbox (request_id) VALUES (?)').run(id);
        db.exec('COMMIT');
        return { id, duplicate: false, conflict: false };
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    getRequest(id) {
      return db.prepare(`${select} WHERE b.id = ?`).get(id);
    },
    listRequests(limit = 100, offset = 0) {
      return db.prepare(`${select} ORDER BY b.id DESC LIMIT ? OFFSET ?`).all(limit, offset);
    },
    allRequests() {
      return db.prepare(`${select} ORDER BY b.id`).all();
    },
    calendar(start, end) {
      return db
        .prepare(
          `SELECT id,property,name,status,checkin_date,checkout_date,guests FROM booking_requests
        WHERE status='confirmed' AND checkin_date < ? AND checkout_date >= ? ORDER BY checkin_date,id`,
        )
        .all(end, start);
    },
    history(id) {
      return {
        changes: db
          .prepare('SELECT * FROM booking_changes WHERE request_id=? ORDER BY id DESC')
          .all(id),
        payments: db
          .prepare(
            'SELECT id,kind,amount_cents,method,payment_date,note,created_at FROM booking_payments WHERE request_id=? ORDER BY id DESC',
          )
          .all(id),
        decisions: db
          .prepare(
            'SELECT status,created_at FROM booking_events WHERE request_id=? ORDER BY id DESC',
          )
          .all(id),
      };
    },
    editRequest(id, data, revision) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const item = this.getRequest(id);
        if (!item) fail('not_found');
        if (item.revision !== revision) fail('stale');
        if (!['new', 'confirmed'].includes(item.status)) fail('transition');
        if (!item.property || !item.quote_json) fail('legacy');
        // Outgoing mail claimed before an edit could otherwise carry the previous details.
        if (
          item.notification_status === 'sending' ||
          db
            .prepare(
              "SELECT id FROM decision_outbox WHERE request_id=? AND state='sending' LIMIT 1",
            )
            .get(id)
        )
          fail('mail_busy');
        if (overlaps(data.property, data.checkin, data.checkout, id)) fail('occupied');
        const before = {
          property: item.property,
          checkin: item.checkin_date,
          checkout: item.checkout_date,
          adults: item.adults,
          children: item.children,
          pets: item.pets,
          totalCents: item.agreed_total_cents ?? JSON.parse(item.quote_json).total * 100,
          depositDueCents: item.deposit_due_cents,
        };
        db.prepare(
          `UPDATE booking_requests SET property=?,checkin_date=?,checkout_date=?,adults=?,children=?,pets=?,guests=?,nights=?,quote_json=?,
          name=?,email=?,phone=?,message=?,language=?,agreed_total_cents=?,deposit_due_cents=?,revision=revision+1 WHERE id=?`,
        ).run(
          data.property,
          data.checkin,
          data.checkout,
          data.adults,
          data.children,
          data.pets,
          data.adults + data.children,
          data.quote.nights,
          JSON.stringify(data.quote),
          data.name,
          data.email,
          data.phone,
          data.message,
          data.language,
          data.agreedTotalCents,
          data.depositDueCents,
          id,
        );
        const after = {
          property: data.property,
          checkin: data.checkin,
          checkout: data.checkout,
          adults: data.adults,
          children: data.children,
          pets: data.pets,
          totalCents: data.agreedTotalCents ?? data.quote.total * 100,
          depositDueCents: data.depositDueCents,
        };
        // Keep an operational audit without duplicating old guest contact details indefinitely.
        db.prepare(
          'INSERT INTO booking_changes(request_id,revision,kind,reason,before_json,after_json) VALUES(?,?,?,?,?,?)',
        ).run(id, revision + 1, 'edit', data.reason, JSON.stringify(before), JSON.stringify(after));
        db.exec('COMMIT');
        return this.getRequest(id);
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    addPayment(id, data, key, hash) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const existing = db
          .prepare('SELECT request_id,payload_hash FROM booking_payments WHERE idempotency_key=?')
          .get(key);
        if (existing) {
          if (existing.request_id !== id || existing.payload_hash !== hash)
            fail('idempotency_conflict');
          db.exec('COMMIT');
          return this.getRequest(id);
        }
        const item = this.getRequest(id);
        if (!item) fail('not_found');
        if (item.revision !== data.revision) fail('stale');
        if (!item.quote_json) fail('legacy');
        if (data.kind === 'refund' && data.amountCents > item.paid_cents)
          fail('refund_exceeds_paid');
        if (data.kind === 'payment' && !['new', 'confirmed'].includes(item.status))
          fail('transition');
        db.prepare(
          `INSERT INTO booking_payments(request_id,idempotency_key,payload_hash,kind,amount_cents,method,payment_date,note)
          VALUES(?,?,?,?,?,?,?,?)`,
        ).run(id, key, hash, data.kind, data.amountCents, data.method, data.date, data.note.trim());
        db.prepare('UPDATE booking_requests SET revision=revision+1 WHERE id=?').run(id);
        db.exec('COMMIT');
        return this.getRequest(id);
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    availability(property) {
      return db
        .prepare(
          `SELECT checkin_date, checkout_date FROM booking_requests WHERE property=? AND status='confirmed'
        UNION ALL SELECT checkin_date, checkout_date FROM availability_blocks WHERE property=?`,
        )
        .all(property, property);
    },
    decide(id, status, revision, notifyGuest) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const item = this.getRequest(id);
        if (!item) fail('not_found');
        if (item.status === status) {
          db.exec('COMMIT');
          return item;
        }
        if (item.revision !== revision) fail('stale');
        if (!(
          (item.status === 'new' && ['confirmed', 'rejected'].includes(status)) ||
          (item.status === 'confirmed' && status === 'cancelled')
        ))
          fail('transition');
        if (!item.property || !item.quote_json) fail('legacy');
        if (
          status === 'confirmed' &&
          overlaps(item.property, item.checkin_date, item.checkout_date, id)
        )
          fail('occupied');
        db.prepare(
          "UPDATE booking_requests SET status=?, revision=revision+1, decided_at=datetime('now') WHERE id=?",
        ).run(status, id);
        db.prepare('INSERT INTO booking_events(request_id,status) VALUES(?,?)').run(id, status);
        // Do not deliver an obsolete confirmation after a cancellation when it has not been claimed yet.
        if (status === 'cancelled')
          db.prepare(
            "UPDATE decision_outbox SET state='superseded' WHERE request_id=? AND kind='confirmed' AND state='pending'",
          ).run(id);
        if (notifyGuest && item.email)
          db.prepare('INSERT INTO decision_outbox(request_id,kind) VALUES(?,?)').run(id, status);
        db.exec('COMMIT');
        return this.getRequest(id);
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    listBlocks() {
      return db.prepare('SELECT * FROM availability_blocks ORDER BY checkin_date, id').all();
    },
    addBlock(property, start, end, note) {
      db.exec('BEGIN IMMEDIATE');
      try {
        if (overlaps(property, start, end)) fail('occupied');
        const result = db
          .prepare(
            'INSERT INTO availability_blocks(property,checkin_date,checkout_date,note) VALUES(?,?,?,?)',
          )
          .run(property, start, end, note);
        db.exec('COMMIT');
        return Number(result.lastInsertRowid);
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    deleteBlock(id) {
      return db.prepare('DELETE FROM availability_blocks WHERE id=?').run(id).changes;
    },
    createSession(hash, csrf, expires, version) {
      db.prepare('DELETE FROM admin_sessions WHERE expires <= ? OR auth_version != ?').run(
        Date.now(),
        version,
      );
      db.prepare('INSERT INTO admin_sessions VALUES(?,?,?,?)').run(hash, csrf, expires, version);
    },
    getSession(hash, version) {
      return db
        .prepare(
          'SELECT csrf,expires FROM admin_sessions WHERE token_hash=? AND auth_version=? AND expires > ?',
        )
        .get(hash, version, Date.now());
    },
    deleteSession(hash) {
      db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').run(hash);
    },
    claimEmail(now = Date.now()) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const item = db
          .prepare(
            "SELECT request_id, attempts FROM email_outbox WHERE state != 'sent' AND next_attempt <= ? ORDER BY request_id LIMIT 1",
          )
          .get(now);
        if (item)
          db.prepare(
            "UPDATE email_outbox SET state = 'sending', attempts = attempts + 1, next_attempt = ? WHERE request_id = ?",
          ).run(now + 120000, item.request_id);
        const result = item
          ? { ...this.getRequest(item.request_id), attempt: item.attempts + 1, kind: 'owner' }
          : this.claimDecisionEmail(now);
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    claimDecisionEmail(now) {
      // Called inside claimEmail's write transaction, including during overlapping restarts.
      const job = db
        .prepare(
          "SELECT * FROM decision_outbox WHERE state IN ('pending','sending') AND next_attempt <= ? ORDER BY id LIMIT 1",
        )
        .get(now);
      if (!job) return null;
      db.prepare(
        "UPDATE decision_outbox SET state='sending',attempts=attempts+1,next_attempt=? WHERE id=?",
      ).run(now + 120000, job.id);
      return {
        ...this.getRequest(job.request_id),
        jobId: job.id,
        kind: job.kind,
        attempt: job.attempts + 1,
      };
    },
    markEmailSent(id, kind = 'owner') {
      if (kind !== 'owner')
        return db
          .prepare(
            "UPDATE decision_outbox SET state='sent',sent_at=datetime('now'),last_error=NULL WHERE id=?",
          )
          .run(id);
      db.prepare(
        "UPDATE email_outbox SET state = 'sent', sent_at = datetime('now'), last_error = NULL WHERE request_id = ?",
      ).run(id);
    },
    retryEmail(id, attempt, code, kind = 'owner') {
      const delay = Math.min(3600000, 30000 * 2 ** Math.min(attempt - 1, 7));
      if (kind !== 'owner') {
        return db
          .prepare(
            "UPDATE decision_outbox SET state=CASE WHEN kind='confirmed' AND (SELECT status FROM booking_requests WHERE id=request_id)='cancelled' THEN 'superseded' ELSE 'pending' END,next_attempt=?,last_error=? WHERE id=?",
          )
          .run(Date.now() + delay, String(code).slice(0, 40), id);
      }
      db.prepare(
        "UPDATE email_outbox SET state = 'pending', next_attempt = ?, last_error = ? WHERE request_id = ?",
      ).run(Date.now() + delay, String(code).slice(0, 40), id);
    },
    close() {
      db.close();
    },
  };
}
module.exports = { createDatabase };
