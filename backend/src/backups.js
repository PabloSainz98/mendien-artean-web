'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { backupDatabase } = require('../../scripts/backup');
const DAY = 24 * 3600000;
const SNAPSHOT = /^uxarbeiti-\d{4}-\d{2}-\d{2}T[\d-]+Z-[a-f0-9]{8}\.db$/;

function startBackups({
  source,
  directory,
  keep = 14,
  logger = console,
  now = Date.now,
  backup = backupDatabase,
}) {
  const resolved = path.resolve(directory);
  const publicRoot = path.resolve(__dirname, '../../dist');
  if (resolved === publicRoot || resolved.startsWith(publicRoot + path.sep))
    throw new Error('Backups must stay outside the public directory');
  if (!Number.isInteger(keep) || keep < 1 || keep > 365)
    throw new Error('Invalid backup retention');
  let lastSuccess = 0;
  let latest = null;
  if (fs.existsSync(resolved)) {
    for (const file of fs.readdirSync(resolved).filter((name) => SNAPSHOT.test(name))) {
      const stat = fs.lstatSync(path.join(resolved, file));
      // File timestamps can retain sub-millisecond precision while Date.now() does not.
      if (stat.isFile() && stat.mtimeMs <= now() + 1000 && stat.mtimeMs > lastSuccess) {
        lastSuccess = Math.min(stat.mtimeMs, now());
        latest = path.join(resolved, file);
      }
    }
  }
  if (latest) {
    let snapshot;
    try {
      snapshot = new DatabaseSync(latest, { readOnly: true });
      if (
        snapshot.prepare('PRAGMA quick_check').get().quick_check !== 'ok' ||
        !snapshot.prepare("SELECT name FROM sqlite_master WHERE name = 'booking_requests'").get()
      )
        throw new Error('Invalid snapshot');
    } catch {
      lastSuccess = 0;
    } finally {
      snapshot?.close();
    }
  }
  let running = null,
    stopped = false,
    failed = false;
  function status() {
    return {
      enabled: true,
      healthy: lastSuccess > 0 && now() - lastSuccess <= 36 * 3600000 && !failed,
      lastSuccess: lastSuccess ? new Date(lastSuccess).toISOString() : null,
      failed,
      running: Boolean(running),
    };
  }
  function tick() {
    if (running) return running;
    if (stopped || (!failed && lastSuccess > 0 && now() - lastSuccess < DAY))
      return Promise.resolve();
    running = Promise.resolve()
      .then(() => backup(source, resolved, keep))
      .then(() => {
        lastSuccess = now();
        failed = false;
      })
      .catch(() => {
        failed = true;
        logger.error('Automatic backup failed. Check private storage and available space.');
      })
      .finally(() => {
        running = null;
      });
    return running;
  }
  const timer = setInterval(tick, 5 * 60000);
  timer.unref();
  const ready = tick();
  return {
    ready,
    tick,
    status,
    async stop() {
      stopped = true;
      clearInterval(timer);
      await running;
    },
  };
}

module.exports = { startBackups };
