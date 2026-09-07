'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { locales, properties } = require('../site/content');
const { pages } = require('../site/templates');
const dist = path.resolve(__dirname, '../dist');

function shape(value, prefix = '') {
  if (Array.isArray(value))
    return value.flatMap((item, index) => shape(item, `${prefix}.${index}`));
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([key, item]) => shape(item, `${prefix}.${key}`));
  assert.equal(typeof value, 'string', prefix);
  assert.ok(value.length > 0, prefix);
  return [prefix];
}
test('Spanish, English and Basque have complete matching content structures', () => {
  for (const lang of ['en', 'eu']) assert.deepEqual(shape(locales[lang]), shape(locales.es));
  for (const lang of Object.keys(locales))
    for (const key of Object.keys(properties))
      assert.equal(locales[lang].properties[key].photoLabels.length, properties[key].photos.length);
});
test('all 27 pages render, have one H1 and resolve local assets/links at root and project subpaths', () => {
  for (const lang of Object.keys(locales))
    for (const page of pages) {
      const filename = path.join(dist, lang === 'es' ? '' : lang, `${page}.html`);
      const html = fs.readFileSync(filename, 'utf8');
      assert.match(html, new RegExp(`<html lang="${lang}"`));
      assert.equal((html.match(/<h1>/g) || []).length, 1, filename);
      assert.ok(!html.includes('data-i18n'));
      assert.ok(!html.includes('EmailJS'));
      assert.ok(!html.includes('mailto:?'));
      for (const [, target] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
        if (/^(?:https?:|mailto:|tel:|#)/.test(target)) continue;
        const relative = target.split(/[?#]/)[0];
        const resolved = path.resolve(path.dirname(filename), relative);
        assert.ok(resolved.startsWith(dist + path.sep), `Outside dist: ${target}`);
        assert.ok(fs.existsSync(resolved), `Missing ${target} in ${filename}`);
      }
    }
});
test('public output does not contain server code, private data or the raw photo archive', () => {
  for (const file of ['backend', '.git', '.env', 'package.json', 'site', 'images/Fotos Domo'])
    assert.equal(fs.existsSync(path.join(dist, file)), false);
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  assert.match(html, /uxarbeiti-complejo.jpg/);
  assert.match(html, /Domo Gorbeia/);
  assert.match(html, /Urkiola Etxea/);
});
