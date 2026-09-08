'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const dotenv = require('dotenv');
const { configureSmtp, quoteSecret } = require('../scripts/setup-smtp');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ux-smtp-setup-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'backend.env');
  const original =
    'NODE_ENV=production\nPUBLIC_ORIGIN=https://uxarbeiti.eus\nSMTP_ENABLED=false\nSMTP_PASS=\nADMIN_PASSWORD_HASH=unchanged\nDATABASE_PATH=/private/app.db\n';
  fs.writeFileSync(file, original, { mode: 0o600 });
  return { file, original };
}

test('SMTP setup stores the exact password privately without activating reservations', async (t) => {
  const { file } = fixture(t);
  const password = 'Synthetic-$-"-#-password';
  let verified = false;
  let closed = false;
  await configureSmtp(file, password, (config) => {
    assert.equal(config.host, 'smtp-uxarbeiti.alwaysdata.net');
    assert.equal(config.auth.pass, password);
    assert.equal(config.secure, true);
    assert.equal(config.tls.rejectUnauthorized, true);
    return {
      async verify() {
        verified = true;
      },
      async sendMail(message) {
        assert.equal(verified, true);
        assert.equal(message.to, 'pablosainz1998@gmail.com');
        assert.equal(JSON.stringify(message).includes(password), false);
        return { accepted: [message.to] };
      },
      close() {
        closed = true;
      },
    };
  });
  const saved = dotenv.parse(fs.readFileSync(file));
  assert.equal(saved.SMTP_PASS, password);
  assert.equal(saved.SMTP_ENABLED, 'false');
  assert.equal(saved.ACCEPT_BOOKINGS_WITHOUT_EMAIL, 'false');
  assert.equal(saved.ADMIN_PASSWORD_HASH, 'unchanged');
  assert.equal(saved.DATABASE_PATH, '/private/app.db');
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.equal(closed, true);
});

test('SMTP setup does not save credentials or send mail after failed authentication', async (t) => {
  const { file, original } = fixture(t);
  let sent = false;
  await assert.rejects(
    configureSmtp(file, 'Synthetic-password', () => ({
      async verify() {
        throw Object.assign(new Error('private provider response'), { code: 'EAUTH' });
      },
      async sendMail() {
        sent = true;
      },
      close() {},
    })),
  );
  assert.equal(sent, false);
  assert.equal(fs.readFileSync(file, 'utf8'), original);
});

test('SMTP setup refuses rejected recipients and preserves concurrent environment edits', async (t) => {
  const { file, original } = fixture(t);
  await assert.rejects(
    configureSmtp(file, 'Synthetic-password', () => ({
      async verify() {},
      async sendMail() {
        return { accepted: [] };
      },
      close() {},
    })),
    /recipient/,
  );
  assert.equal(fs.readFileSync(file, 'utf8'), original);
  await assert.rejects(
    configureSmtp(file, 'Synthetic-password', () => ({
      async verify() {},
      async sendMail() {
        fs.appendFileSync(file, 'OTHER_SETTING=changed\n');
        return { accepted: ['pablosainz1998@gmail.com'] };
      },
      close() {},
    })),
    /changed/,
  );
  assert.equal(fs.readFileSync(file, 'utf8'), original + 'OTHER_SETTING=changed\n');
});

test('SMTP setup refuses active configurations and unsafe dotenv encodings', async (t) => {
  const { file } = fixture(t);
  fs.appendFileSync(file, 'SMTP_ENABLED=true\n');
  await assert.rejects(configureSmtp(file, 'Synthetic-password'), /already active/);
  for (const value of ['normal-$-#-password', "quote'and\\n", 'quote`and"', '"\'`']) {
    if (value === '"\'`') assert.throws(() => quoteSecret(value));
    else assert.equal(dotenv.parse(`SECRET=${quoteSecret(value)}`).SECRET, value);
  }
  assert.throws(() => quoteSecret('password\nSMTP_ENABLED=true'));
});
