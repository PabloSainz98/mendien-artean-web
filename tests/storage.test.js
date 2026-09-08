'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { assertLocalStorage } = require('../backend/src/storage');
const { createDatabase } = require('../backend/src/db');
const { backupDatabase } = require('../scripts/backup');

test('SQLite rejects NFS and SMB mounts but accepts the local filesystem', () => {
  for (const type of [0x6969, 0xff534d42, 0xfe534d42, 0xff534d42 | 0]) {
    assert.throws(() => assertLocalStorage('/unused', () => ({ type })), /local storage/);
  }
  assert.doesNotThrow(() => assertLocalStorage(os.tmpdir()));
});

test('database startup and backups refuse network storage before opening SQLite', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ux-storage-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const source = path.join(directory, 'app.db');
  const db = createDatabase(source);
  db.close();
  const before = fs.readFileSync(source);
  t.mock.method(fs, 'statfsSync', () => ({ type: 0x6969 }));
  assert.throws(() => createDatabase(path.join(directory, 'new.db')), /local storage/);
  assert.equal(fs.existsSync(path.join(directory, 'new.db')), false);
  const snapshots = path.join(directory, 'backups');
  await assert.rejects(backupDatabase(source, snapshots), /local storage/);
  assert.equal(fs.existsSync(snapshots), false);
  assert.deepEqual(fs.readFileSync(source), before);
});
