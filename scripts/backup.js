'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync, backup } = require('node:sqlite');
const { assertLocalStorage } = require('../backend/src/storage');

async function backupDatabase(sourcePath, directory, keep = 14) {
  if (!Number.isInteger(keep) || keep < 1 || keep > 365)
    throw new Error('Invalid backup retention');
  if (!fs.existsSync(sourcePath))
    throw new Error('Database does not exist; refusing to create an empty backup');
  assertLocalStorage(path.dirname(sourcePath));
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(
    directory,
    `uxarbeiti-${stamp}-${crypto.randomBytes(4).toString('hex')}.db`,
  );
  const temporary = target + '.tmp';
  fs.closeSync(fs.openSync(temporary, 'wx', 0o600));
  const source = new DatabaseSync(sourcePath, { readOnly: true });
  try {
    await backup(source, temporary);
    const check = new DatabaseSync(temporary);
    try {
      // Seal the snapshot as a standalone file, independent of WAL/SHM sidecars.
      check.exec('PRAGMA journal_mode = DELETE');
      if (check.prepare('PRAGMA quick_check').get().quick_check !== 'ok')
        throw new Error('Backup integrity check failed');
      if (
        !check
          .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='booking_requests'")
          .get()
      )
        throw new Error('Not a booking database');
    } finally {
      check.close();
    }
    fs.renameSync(temporary, target);
    const copies = fs
      .readdirSync(directory)
      .filter((file) => /^uxarbeiti-\d{4}-\d{2}-\d{2}T[\d-]+Z-[a-f0-9]{8}\.db$/.test(file))
      .sort()
      .reverse();
    for (const file of copies.slice(keep)) fs.unlinkSync(path.join(directory, file));
    return target;
  } finally {
    source.close();
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}
if (require.main === module) {
  process.umask(0o077);
  const root = path.resolve(__dirname, '../backend');
  require('dotenv').config({ path: process.env.UXARBEITI_ENV_PATH || path.join(root, '.env') });
  const source = path.resolve(root, process.env.DATABASE_PATH || 'data/app.db');
  const directory = path.resolve(root, process.env.BACKUP_DIRECTORY || 'data/backups');
  if (
    directory === path.resolve(__dirname, '../dist') ||
    directory.startsWith(path.resolve(__dirname, '../dist') + path.sep)
  )
    throw new Error('Backups must never be stored in dist/');
  backupDatabase(source, directory, Number(process.env.BACKUP_KEEP || 14))
    .then(() => console.log('Private SQLite backup created and verified.'))
    .catch(() => {
      console.error('Backup failed. Check database path, permissions and free disk space.');
      process.exitCode = 1;
    });
}
module.exports = { backupDatabase };
