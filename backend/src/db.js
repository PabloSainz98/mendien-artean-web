'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function createDatabase(databasePath) {
  if (databasePath !== ':memory:')
    fs.mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
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
      );`);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    db.close();
    throw error;
  }
  if (databasePath !== ':memory:') fs.chmodSync(databasePath, 0o600);
  const select = `SELECT b.*, e.state AS notification_status, e.attempts AS notification_attempts, e.last_error AS notification_error FROM booking_requests b LEFT JOIN email_outbox e ON e.request_id = b.id`;
  const insert = db.prepare(`INSERT INTO booking_requests
    (name,email,phone,guests,checkin_date,checkout_date,message,ip_hash,property,adults,children,pets,nights,quote_json,language,consent_version,idempotency_key,payload_hash)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  return {
    path: databasePath,
    createRequest(data, key, hash) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const existing = db
          .prepare('SELECT id, payload_hash FROM booking_requests WHERE idempotency_key = ?')
          .get(key);
        if (existing) {
          db.exec('COMMIT');
          return { id: existing.id, duplicate: true, conflict: existing.payload_hash !== hash };
        }
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
        db.exec('COMMIT');
        return item ? { ...this.getRequest(item.request_id), attempt: item.attempts + 1 } : null;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    markEmailSent(id) {
      db.prepare(
        "UPDATE email_outbox SET state = 'sent', sent_at = datetime('now'), last_error = NULL WHERE request_id = ?",
      ).run(id);
    },
    retryEmail(id, attempt, code) {
      const delay = Math.min(3600000, 30000 * 2 ** Math.min(attempt - 1, 7));
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
