'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { chromium } = require('playwright');
const express = require('express');
const { createDatabase } = require('../backend/src/db');
const { createApp } = require('../backend/src/server');
const { pages } = require('../site/templates');
const { locales } = require('../site/content');

test(
  'browser: routes, languages, mobile menu, gallery and complete reservation',
  { timeout: 120000 },
  async (t) => {
    const db = createDatabase(':memory:');
    const runtime = createApp({
      db,
      env: { ACCEPT_BOOKINGS_WITHOUT_EMAIL: 'true', RATE_LIMIT_MAX: '1000' },
    });
    const mount = express();
    mount.use('/mendien-artean-web', runtime.app);
    const server = mount.listen(0, '127.0.0.1');
    await once(server, 'listening');
    t.after(async () => {
      await new Promise((resolve) => server.close(resolve));
      await runtime.close();
      db.close();
    });
    const browser = await chromium.launch({
      headless: true,
      ...(process.env.PLAYWRIGHT_CHROME_CHANNEL
        ? { channel: process.env.PLAYWRIGHT_CHROME_CHANNEL }
        : {}),
    });
    t.after(() => browser.close());
    const base = `http://127.0.0.1:${server.address().port}/mendien-artean-web/`;
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    const missing = [];
    const external = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400) missing.push(response.url());
    });
    page.on('request', (request) => {
      if (!request.url().startsWith(base)) external.push(request.url());
    });
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: width >= 768 ? 1000 : 844 });
      for (const lang of ['es', 'en', 'eu']) {
        for (const route of width === 1440 || width === 390 ? pages : ['index', 'reserva']) {
          const response = await page.goto(
            `${base}${lang === 'es' ? '' : lang + '/'}${route}.html`,
          );
          assert.equal(response.status(), 200);
          await page.evaluate(() => document.fonts.ready);
          assert.equal(await page.locator('h1').count(), 1);
          assert.equal(await page.locator('html').getAttribute('lang'), lang);
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
            false,
            `${lang}/${route} at ${width}`,
          );
          if (route === 'index' && width < 768) {
            const button = await page.locator('.hero-copy .button').boundingBox();
            const bottom = await page.locator('.hero-bottom').boundingBox();
            assert.ok(button.y + button.height < bottom.y, `Hero overlap at ${lang} ${width}`);
          }
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}eu/index.html`);
    await page.locator('.menu-toggle').click();
    assert.equal(await page.locator('#mobile-menu').evaluate((el) => el.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#mobile-menu').evaluate((el) => el.open), false);
    await page.locator('.menu-toggle').click();
    await page.locator('.mobile-links a[href$="alojamientos.html"]').click();
    await page.locator('.stay-card-domo').click();
    assert.match(page.url(), /eu\/domo-gorbeia.html$/);
    await page.locator('.gallery-open').click();
    assert.equal(await page.locator('#lightbox').evaluate((el) => el.open), true);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.photo-counter').textContent(), '2 / 10');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#lightbox').evaluate((el) => el.open), false);
    assert.equal(
      await page.evaluate(() => document.activeElement.classList.contains('gallery-open')),
      true,
    );
    await page.goto(`${base}eu/reserva.html?property=casa`);
    await page.waitForFunction(() => document.querySelector('.calendar-month h3'));
    const currentMonth = new Date().getMonth();
    assert.ok(
      (await page.locator('.calendar-month h3').first().textContent()).includes(
        locales.eu.booking.months[currentMonth],
      ),
    );
    const year = new Date().getFullYear() + 1;
    await page.locator('#checkin').fill(`${year}-01-12`);
    await page.locator('#checkin').dispatchEvent('change');
    await page.locator('#checkout').fill(`${year}-01-13`);
    await page.locator('#checkout').dispatchEvent('change');
    await page.locator('#children').fill('1');
    await page.locator('#pets').fill('1');
    assert.match(await page.locator('#mobile-price-breakdown .total').textContent(), /122/);
    await page.locator('#nights').fill('2');
    await page.locator('#nights').dispatchEvent('change');
    assert.equal(await page.locator('#checkout').inputValue(), `${year}-01-14`);
    assert.match(await page.locator('#mobile-price-breakdown .total').textContent(), /204/);
    await page.locator('#name').fill('Browser Test');
    await page.locator('#email').fill('browser@example.test');
    await page.locator('#phone').fill('+34 600 000 000');
    await page.locator('#message').fill('Synthetic test, no real email.');
    await page.locator('[name=consent]').check();
    await page.locator('[type=submit]').click();
    await page.locator('#booking-success').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#booking-reference').textContent(), 'UX-000001');
    assert.equal(db.allRequests().length, 1);
    assert.equal(db.getRequest(1).property, 'casa');
    assert.equal(JSON.parse(db.getRequest(1).quote_json).total, 204);
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
    assert.deepEqual(external, []);
  },
);
