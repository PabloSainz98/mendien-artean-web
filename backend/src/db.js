const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function ensureDirectory(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function ensureColumn(db, tableName, columnName, columnDefinition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
  }
}

function createDatabase(databasePath) {
  const resolvedPath = path.resolve(databasePath);
  ensureDirectory(resolvedPath);

  const db = new DatabaseSync(resolvedPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS booking_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 4),
      checkin_date TEXT NOT NULL,
      checkout_date TEXT NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      source TEXT NOT NULL DEFAULT 'website',
      ip_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_booking_requests_created_at
      ON booking_requests(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_booking_requests_status
      ON booking_requests(status);
  `);
  ensureColumn(db, 'booking_requests', 'calendar_event_id', 'calendar_event_id TEXT');

  const insertRequestStmt = db.prepare(`
    INSERT INTO booking_requests (
      name,
      email,
      phone,
      guests,
      checkin_date,
      checkout_date,
      message,
      ip_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const listRequestsStmt = db.prepare(`
    SELECT
      id,
      name,
      email,
      phone,
      guests,
      checkin_date AS checkin,
      checkout_date AS checkout,
      message,
      status,
      source,
      calendar_event_id AS calendarEventId,
      created_at AS createdAt
    FROM booking_requests
    ORDER BY id DESC
    LIMIT ?
  `);

  const setCalendarEventStmt = db.prepare(`
    UPDATE booking_requests
    SET calendar_event_id = ?
    WHERE id = ?
  `);

  return {
    path: resolvedPath,
    insertRequest(data) {
      const result = insertRequestStmt.run(
        data.name,
        data.email,
        data.phone,
        data.guests,
        data.checkin,
        data.checkout,
        data.message,
        data.ipHash
      );

      return Number(result.lastInsertRowid);
    },

    listRequests(limit = 100) {
      return listRequestsStmt.all(limit);
    },

    setCalendarEventId(requestId, eventId) {
      setCalendarEventStmt.run(eventId, requestId);
    }
  };
}

module.exports = {
  createDatabase
};
