'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createDatabase } = require('../backend/src/db');
const { createApp } = require('../backend/src/server');
const { locales } = require('../site/content');

test(
  'browser: resilient, lightweight booking UX without personal-data persistence',
  { timeout: 120000 },
  async (t) => {
    const db = createDatabase(':memory:');
    const runtime = createApp({
      db,
      env: { ACCEPT_BOOKINGS_WITHOUT_EMAIL: 'true', RATE_LIMIT_MAX: '1000' },
    });
    const server = runtime.app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const browser = await chromium.launch({
      headless: true,
      ...(process.env.PLAYWRIGHT_CHROME_CHANNEL
        ? { channel: process.env.PLAYWRIGHT_CHROME_CHANNEL }
        : {}),
    });
    t.after(async () => {
      await browser.close();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      await runtime.close();
      db.close();
    });
    const context = await browser.newContext();
    context.setDefaultTimeout(10000);
    context.setDefaultNavigationTimeout(15000);
    const page = await context.newPage();
    const base = `http://127.0.0.1:${server.address().port}/`;
    const year = new Date().getFullYear() + 1;
    const checkin = `${year}-01-12`,
      checkout = `${year}-01-14`;
    const stay = `reserva.html?property=casa&checkin=${checkin}&checkout=${checkout}`;
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const ready = () =>
      page.waitForFunction(
        () =>
          document.querySelector('#availability-status').hidden &&
          !document.querySelector('.submit-button').disabled,
      );
    const blur = () => page.evaluate(() => document.activeElement?.blur());

    await t.test(
      'gallery warms only the next photo after opening and respects data saving',
      async () => {
        for (const connection of [
          { saveData: false, effectiveType: '4g' },
          { saveData: true, effectiveType: '4g' },
          { saveData: false, effectiveType: '2g' },
        ]) {
          await page.goto(base + 'domo-gorbeia.html');
          await page.evaluate((connection) => {
            Object.defineProperty(navigator, 'connection', {
              configurable: true,
              value: connection,
            });
            const NativeImage = window.Image;
            window.warmedPhotos = [];
            window.Image = class extends NativeImage {
              constructor(...args) {
                super(...args);
                window.warmedPhotos.push(this);
              }
            };
          }, connection);
          assert.equal(await page.evaluate(() => window.warmedPhotos.length), 0);
          await page.locator('.gallery-open').click();
          const expected = connection.saveData || connection.effectiveType === '2g' ? 0 : 1;
          assert.equal(await page.evaluate(() => window.warmedPhotos.length), expected);
          await page.keyboard.press('ArrowRight');
          assert.equal(await page.evaluate(() => window.warmedPhotos.length), expected * 2);
          await page.keyboard.press('ArrowLeft');
          assert.equal(await page.evaluate(() => window.warmedPhotos.length), expected * 2);
          if (expected)
            assert.equal(await page.evaluate(() => window.warmedPhotos[0].fetchPriority), 'low');
          await page.keyboard.press('Escape');
        }
      },
    );

    await t.test(
      'language switches retain current stay criteria, never contact or consent',
      async () => {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto(base + stay);
        await ready();
        await page.locator('#choose-checkout').click();
        await page.locator(`[data-date="${year}-01-15"]`).click();
        await page.locator('#adults').fill('3');
        await page.locator('#children').fill('1');
        await page.locator('#pets').fill('2');
        for (const lang of ['en', 'eu', 'es']) {
          await page.locator('#name').fill('Private synthetic guest');
          await page.locator('#email').fill('private@example.invalid');
          await page.locator('#phone').fill('600000000');
          await page.locator('#message').fill('Private message not for URLs');
          await page.locator('[name=consent]').check();
          const link = page.locator(`.header-actions .languages a[lang="${lang}"]`);
          const query = new URL(await link.getAttribute('href')).searchParams;
          assert.deepEqual(Object.fromEntries(query), {
            property: 'casa',
            checkin,
            checkout: `${year}-01-15`,
            adults: '3',
            children: '1',
            pets: '2',
          });
          await link.click();
          await ready();
          assert.equal(await page.locator('html').getAttribute('lang'), lang);
          for (const [name, value] of query)
            if (name !== 'property')
              assert.equal(await page.locator(`#${name}`).inputValue(), value);
          assert.equal(await page.locator('[name=property]:checked').inputValue(), 'casa');
          for (const name of ['name', 'email', 'phone', 'message'])
            assert.equal(await page.locator(`#${name}`).inputValue(), '');
          assert.equal(await page.locator('[name=consent]').isChecked(), false);
          assert.deepEqual(
            await page.evaluate(() => [localStorage.length, sessionStorage.length]),
            [0, 0],
          );
        }
      },
    );

    await t.test('guest controls respect combined capacity and reuse calendar DOM', async () => {
      await page.goto(base + stay);
      await ready();
      await page.evaluate(() => {
        window.originalDay = document.querySelector('.calendar-day');
      });
      await page.locator('[data-field=adults][data-step="1"]').click();
      await page.locator('[data-field=children][data-step="1"]').click();
      assert.equal(await page.locator('[data-field=adults][data-step="1"]').isDisabled(), true);
      assert.equal(await page.locator('[data-field=children][data-step="1"]').isDisabled(), true);
      assert.equal(
        await page.evaluate(() => window.originalDay === document.querySelector('.calendar-day')),
        true,
      );
      await page.locator('[name=property][value=domo]').check();
      await ready();
      assert.equal(await page.locator('#group-error').isVisible(), true);
      assert.equal(
        await page.locator('#adults').inputValue(),
        '3',
        'Never silently discard guests',
      );
      await page.locator('[data-field=adults][data-step="-1"]').click();
      assert.equal(await page.locator('#group-error').isVisible(), false);
      assert.match(await page.locator('#price-breakdown .total').textContent(), /384/);
    });

    await t.test(
      'availability and service recover without losing typed fields; stale dates recheck',
      async () => {
        let failed = true,
          available = true,
          requests = 0;
        await page.route('**/api/availability?*', async (route) => {
          requests++;
          await route.fulfill({
            status: failed ? 503 : 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ok: !failed,
              ranges: available ? [] : [{ checkin_date: checkin, checkout_date: checkout }],
            }),
          });
        });
        await page.route('**/api/health', (route) =>
          route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({ acceptsBookings: !failed }),
          }),
        );
        await page.goto(base + stay);
        await page.locator('#retry-service').waitFor();
        await page.locator('#availability-status [data-retry-availability]').waitFor();
        assert.equal(await page.locator('.submit-button').isDisabled(), true);
        assert.match(await page.locator('#availability-status').textContent(), /No hemos podido/);
        await page.locator('#email').fill('preserve@example.invalid');
        failed = false;
        await page.locator('#availability-status [data-retry-availability]').click();
        await page.waitForFunction(() => document.querySelector('#availability-status').hidden);
        await page.locator('#retry-service').click();
        await ready();
        assert.equal(await page.locator('#email').inputValue(), 'preserve@example.invalid');
        const fetched = requests;
        await page.locator('#choose-checkin').click();
        await page.keyboard.press('Escape');
        assert.equal(requests, fetched, 'Do not fetch again while data is fresh');
        available = false;
        await page.evaluate(() => {
          const now = Date.now;
          Date.now = () => now() + 61000;
        });
        await page.locator('#choose-checkout').click();
        await page.waitForFunction(() => !document.querySelector('#date-error').hidden);
        assert.equal(await page.locator('#date-error').textContent(), locales.es.booking.occupied);
        assert.equal(await page.locator('#apply-dates').isDisabled(), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#email').inputValue(), 'preserve@example.invalid');
        assert.equal(requests, fetched + 1);
        await page.unrouteAll();
      },
    );

    await t.test(
      'mobile summary guides to missing details and stays clear of dialogs and keyboard',
      async () => {
        for (const width of [390, 320]) {
          await page.setViewportSize({ width, height: 844 });
          for (const lang of ['es', 'en', 'eu']) {
            await page.goto(base + (lang === 'es' ? '' : lang + '/') + stay);
            await ready();
            await page.locator('#booking-dock').waitFor();
            assert.match(await page.locator('#dock-total').textContent(), /174/);
            assert.equal(
              await page.locator('#booking-continue').textContent(),
              locales[lang].booking.continue,
            );
            assert.equal(
              await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
              false,
            );
            const chat = await page.locator('#contact-launcher').boundingBox();
            const dock = await page.locator('#booking-dock').boundingBox();
            assert.ok(chat.y + chat.height < dock.y, 'Chat does not cover the summary');
            await page.locator('#choose-checkin').scrollIntoViewIfNeeded();
            if (process.env.UX_SCREENSHOT_DIR && width === 390 && lang === 'es') {
              fs.mkdirSync(process.env.UX_SCREENSHOT_DIR, { recursive: true });
              await page.screenshot({
                path: path.join(process.env.UX_SCREENSHOT_DIR, 'booking-mobile-summary.png'),
              });
            }
            await page.locator('#booking-continue').click();
            assert.equal(await page.evaluate(() => document.activeElement.id), 'name');
            assert.equal(await page.locator('#booking-dock').isVisible(), false);
            await blur();
            await page.locator('#choose-checkout').click();
            assert.equal(await page.locator('#booking-dock').isVisible(), false);
            await page.keyboard.press('Escape');
            await page.locator('.submit-button').scrollIntoViewIfNeeded();
            await page.waitForFunction(() => document.querySelector('#booking-dock').hidden);
          }
        }
        await page.goto(base + 'reserva.html');
        await ready();
        assert.equal(
          await page.locator('#booking-dock').isVisible(),
          false,
          'No misleading total before dates',
        );
        assert.equal(db.allRequests().length, 0, 'Continue is not a submission');
      },
    );
    assert.deepEqual(errors, []);
  },
);
