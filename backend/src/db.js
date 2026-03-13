const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function ensureDirectory(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
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
      property TEXT NOT NULL DEFAULT 'casa',
      guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 4),
      nights INTEGER NOT NULL DEFAULT 1,
      pets INTEGER NOT NULL DEFAULT 0,
      children INTEGER NOT NULL DEFAULT 0,
      checkin_date TEXT NOT NULL,
      checkout_date TEXT NOT NULL,
      season TEXT NOT NULL DEFAULT 'low',
      base_rate INTEGER NOT NULL DEFAULT 57,
      base_total INTEGER NOT NULL DEFAULT 57,
      extra_people_total INTEGER NOT NULL DEFAULT 0,
      pets_total INTEGER NOT NULL DEFAULT 0,
      children_total INTEGER NOT NULL DEFAULT 0,
      cleaning_fee INTEGER NOT NULL DEFAULT 40,
      total_estimate INTEGER NOT NULL DEFAULT 97,
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

  const tableInfoStmt = db.prepare('PRAGMA table_info(booking_requests)');
  const hasColumn = (columnName) => tableInfoStmt.all().some((column) => column.name === columnName);
  const ensureColumn = (columnName, definition) => {
    if (!hasColumn(columnName)) {
      db.exec(`ALTER TABLE booking_requests ADD COLUMN ${columnName} ${definition};`);
    }
  };

  ensureColumn('property', "TEXT NOT NULL DEFAULT 'casa'");
  ensureColumn('nights', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('pets', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('children', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('season', "TEXT NOT NULL DEFAULT 'low'");
  ensureColumn('base_rate', 'INTEGER NOT NULL DEFAULT 57');
  ensureColumn('base_total', 'INTEGER NOT NULL DEFAULT 57');
  ensureColumn('extra_people_total', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('pets_total', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('children_total', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('cleaning_fee', 'INTEGER NOT NULL DEFAULT 40');
  ensureColumn('total_estimate', 'INTEGER NOT NULL DEFAULT 97');

  const insertRequestStmt = db.prepare(`
    INSERT INTO booking_requests (
      name,
      email,
      phone,
      property,
      guests,
      nights,
      pets,
      children,
      checkin_date,
      checkout_date,
      season,
      base_rate,
      base_total,
      extra_people_total,
      pets_total,
      children_total,
      cleaning_fee,
      total_estimate,
      message,
      ip_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const listRequestsStmt = db.prepare(`
    SELECT
      id,
      name,
      email,
      phone,
      property,
      guests,
      nights,
      pets,
      children,
      checkin_date AS checkin,
      checkout_date AS checkout,
      season,
      base_rate AS baseRate,
      base_total AS baseTotal,
      extra_people_total AS extraPeopleTotal,
      pets_total AS petsTotal,
      children_total AS childrenTotal,
      cleaning_fee AS cleaningFee,
      total_estimate AS totalEstimate,
      message,
      status,
      source,
      created_at AS createdAt
    FROM booking_requests
    ORDER BY id DESC
    LIMIT ?
  `);

  return {
    path: resolvedPath,
    insertRequest(data) {
      const result = insertRequestStmt.run(
        data.name,
        data.email,
        data.phone,
        data.property,
        data.guests,
        data.nights,
        data.pets,
        data.children,
        data.checkin,
        data.checkout,
        data.season,
        data.baseRate,
        data.baseTotal,
        data.extraPeopleTotal,
        data.petsTotal,
        data.childrenTotal,
        data.cleaningFee,
        data.totalEstimate,
        data.message,
        data.ipHash
      );

      return Number(result.lastInsertRowid);
    },

    listRequests(limit = 100) {
      return listRequestsStmt.all(limit);
    }
  };
}

module.exports = {
  createDatabase
};
