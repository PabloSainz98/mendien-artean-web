'use strict';
const fs = require('node:fs');
const path = require('node:path');

function csvEscape(value) {
  let text = value == null ? '' : String(value);
  // Quoting alone does not prevent Excel/LibreOffice from evaluating a formula.
  if (/^[\s\x00-\x1f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function buildBookingsCsv(items) {
  const fields = [
    'id',
    'created_at',
    'status',
    'property',
    'name',
    'email',
    'phone',
    'checkin_date',
    'checkout_date',
    'nights',
    'adults',
    'children',
    'pets',
    'guests',
    'total',
    'cleaning',
    'message',
    'language',
    'notification_status',
  ];
  const rows = [fields];
  for (const item of items) {
    const quote = item.quote_json ? JSON.parse(item.quote_json) : {};
    const row = { ...item, total: quote.total, cleaning: quote.cleaning };
    rows.push(fields.map((field) => row[field]));
  }
  return '\uFEFF' + rows.map((row) => row.map(csvEscape).join(';')).join('\r\n') + '\r\n';
}

function exportBookingsCsv(filePath, items) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, buildBookingsCsv(items), { mode: 0o600 });
  fs.chmodSync(temporary, 0o600);
  fs.renameSync(temporary, filePath);
}

module.exports = { csvEscape, buildBookingsCsv, exportBookingsCsv };
