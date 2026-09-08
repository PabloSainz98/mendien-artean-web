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
const { hashPassword } = require('../backend/src/admin');
const fs = require('node:fs');
const path = require('node:path');

test(
  'browser: routes, languages, mobile menu, gallery and complete reservation',
  { timeout: 120000 },
  async (t) => {
    const db = createDatabase(':memory:');
    const runtime = createApp({
      db,
      env: {
        ACCEPT_BOOKINGS_WITHOUT_EMAIL: 'true',
        RATE_LIMIT_MAX: '1000',
        ADMIN_PASSWORD_HASH: await hashPassword('Browser-test-password-ONLY'),
      },
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
    await page.locator('#choose-checkin').click();
    await page.locator('#manual-dates summary').click();
    await page.locator('#checkin').fill(`${year}-01-12`);
    await page.locator('#checkin').dispatchEvent('change');
    await page.locator('#checkout').fill(`${year}-01-13`);
    await page.locator('#checkout').dispatchEvent('change');
    await page.locator('#apply-dates').click();
    await page.locator('#children').fill('1');
    await page.locator('#pets').fill('1');
    assert.match(await page.locator('#mobile-price-breakdown .total').textContent(), /122/);
    await page.locator('#nights').fill('2');
    await page.locator('#nights').dispatchEvent('change');
    assert.equal(await page.locator('#checkout').inputValue(), `${year}-01-14`);
    assert.match(await page.locator('#mobile-price-breakdown .total').textContent(), /204/);
    await page.evaluate(() => {
      window.open = (url) => {
        window.testWhatsApp = url;
      };
    });
    await page.locator('#booking-whatsapp').click();
    const whatsapp = new URL(await page.evaluate(() => window.testWhatsApp));
    assert.equal(whatsapp.hostname, 'wa.me');
    assert.match(whatsapp.searchParams.get('text'), /204/);
    assert.match(whatsapp.searchParams.get('text'), /Urkiola Etxea/);
    assert.match(whatsapp.searchParams.get('text'), new RegExp(`${year}-01-12`));
    assert.equal(db.allRequests().length, 0);
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

    const admin = await context.newPage();
    admin.on('pageerror', (error) => errors.push(error.message));
    admin.on('response', (response) => {
      if (response.status() >= 400 && !response.url().endsWith('/session'))
        missing.push(response.url());
    });
    await admin.goto(`${base}gestion/#reserva=1`);
    await admin.locator('#login-view').waitFor({ state: 'visible' });
    await admin.locator('[name=password]').fill('Browser-test-password-ONLY');
    await admin.locator('#login-form button').click();
    await admin.locator('.request').waitFor();
    assert.match(await admin.locator('.request').textContent(), /Browser Test/);
    await admin.locator('.request button').getByText('Aceptar', { exact: true }).click();
    assert.equal(await admin.locator('#notify-guest').isChecked(), false);
    await admin.locator('#decision-confirm').click();
    await admin.waitForFunction(() =>
      document.querySelector('#notice').textContent.includes('Confirmada'),
    );
    assert.equal(db.getRequest(1).status, 'confirmed');
    await admin.locator('[data-view=manual]').click();
    for (const [name, value] of Object.entries({
      checkin: `${year}-01-20`,
      checkout: `${year}-01-22`,
      name: 'Manual Synthetic Guest',
      phone: '+34 600 000 000',
    }))
      await admin.locator(`#manual-form [name=${name}]`).fill(value);
    await admin.locator('#manual-form button').click();
    await admin.waitForFunction(() =>
      document.querySelector('#notice').textContent.includes('guardada'),
    );
    assert.equal(db.getRequest(2).source, 'whatsapp');
    assert.equal(db.getRequest(2).email, '');
    for (const width of [1440, 768, 390, 320]) {
      await admin.setViewportSize({ width, height: 900 });
      for (const view of ['requests', 'manual', 'blocks']) {
        await admin.locator(`[data-view=${view}]`).click();
        assert.equal(
          await admin.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
          `Management ${view} ${width}`,
        );
      }
    }
    await admin.locator('[data-view=requests]').click();
    if (process.env.ADMIN_SCREENSHOT) {
      await admin.setViewportSize({ width: 1440, height: 1000 });
      await admin.screenshot({ path: process.env.ADMIN_SCREENSHOT, fullPage: true });
    }
    await admin.locator('#logout').click();
    await admin.locator('#login-view').waitFor({ state: 'visible' });
    assert.equal(await admin.locator('.request').count(), 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
  },
);

test(
  'browser: shared range picker and optional WhatsApp enquiries in all languages',
  { timeout: 120000 },
  async (t) => {
    const db = createDatabase(':memory:');
    const runtime = createApp({
      db,
      env: { ACCEPT_BOOKINGS_WITHOUT_EMAIL: 'true', RATE_LIMIT_MAX: '1000' },
    });
    const server = runtime.app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}/`;
    const browser = await chromium.launch({
      headless: true,
      ...(process.env.PLAYWRIGHT_CHROME_CHANNEL
        ? { channel: process.env.PLAYWRIGHT_CHROME_CHANNEL }
        : {}),
    });
    t.after(async () => {
      await browser.close();
      await new Promise((resolve) => server.close(resolve));
      await runtime.close();
      db.close();
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [],
      external = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (!request.url().startsWith(base)) external.push(request.url());
    });
    const year = new Date().getFullYear() + 1;
    const date = (day) => `${year}-${day}`;
    const day = (value) => page.locator(`.calendar-day[data-date="${date(value)}"]`);
    async function screenshot(name) {
      if (!process.env.UX_SCREENSHOT_DIR) return;
      fs.mkdirSync(process.env.UX_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.UX_SCREENSHOT_DIR, name + '.png') });
    }
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const lang of ['es', 'en', 'eu']) {
        const route = lang === 'es' ? '' : lang + '/';
        await page.goto(base + route + `reserva.html?property=casa&checkin=${date('01-30')}`);
        await page.locator('#date-fields').waitFor();
        await page.locator('#choose-checkin').click();
        assert.equal(await page.locator('#date-picker').evaluate((el) => el.open), true);
        await day('01-31').click();
        assert.equal(await page.locator('#checkin').inputValue(), date('01-31'));
        assert.equal(await page.locator('#checkout').inputValue(), '');
        assert.equal(
          await page.locator('#calendar-announcement').textContent(),
          locales[lang].booking.pickDeparture,
        );
        if (width < 601) await page.locator('#next-month').click();
        await day('02-02').hover();
        assert.ok((await page.locator('.preview-range').count()) > 0);
        if (width === 1440 && lang === 'eu') await screenshot('calendar-desktop-eu');
        if (width === 390 && lang === 'es') await screenshot('calendar-mobile-es');
        assert.equal(
          await page.locator('#date-picker').evaluate((el) => el.scrollWidth > el.clientWidth + 1),
          false,
          'Date picker overflow',
        );
        await day('02-02').click();
        assert.equal(await page.locator('#date-picker').evaluate((el) => el.open), false);
        assert.equal(await page.locator('#checkout').inputValue(), date('02-02'));
        assert.equal(await page.locator('#nights').inputValue(), '2');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'choose-checkin');
        await page.locator('#choose-checkout').click();
        await day('02-03').click();
        assert.equal(await page.locator('#checkin').inputValue(), date('01-31'));
        assert.equal(await page.locator('#nights').inputValue(), '3');

        await page.locator('#contact-launcher').click();
        assert.equal(await page.locator('#contact-dialog').evaluate((el) => el.open), true);
        assert.equal(await page.locator('#contact-title').textContent(), locales[lang].chat.title);
        assert.equal(
          new URL(await page.locator('#contact-continue').getAttribute('href')).searchParams.get(
            'text',
          ),
          locales[lang].chat.hello,
        );
        await page.locator('[data-chat-message]').nth(1).click();
        assert.equal(
          new URL(await page.locator('#contact-continue').getAttribute('href')).searchParams.get(
            'text',
          ),
          locales[lang].chat.messages[1],
        );
        await page.locator('#contact-message').fill('A question & <not markup>?');
        assert.equal(
          new URL(await page.locator('#contact-continue').getAttribute('href')).searchParams.get(
            'text',
          ),
          'A question & <not markup>?',
        );
        assert.equal(await page.locator('#contact-continue').getAttribute('target'), '_blank');
        assert.equal(
          await page
            .locator('#contact-dialog')
            .evaluate((el) => el.scrollWidth > el.clientWidth + 1),
          false,
          'Contact panel overflow',
        );
        if (width === 1440 && lang === 'es') await screenshot('whatsapp-desktop-es');
        if (width === 390 && lang === 'eu') await screenshot('whatsapp-mobile-eu');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'contact-launcher');
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        );
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + `reserva.html?property=casa&checkin=${date('01-31')}`);
    await page.locator('#choose-checkin').click();
    await day('01-31').click();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.date), date('02-01'));
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#checkout').inputValue(), date('02-01'));
    assert.equal(await page.locator('#date-picker').evaluate((el) => el.open), false);

    const block = db.addBlock(
      'casa',
      date('02-07'),
      date('02-10'),
      'Synthetic calendar regression',
    );
    await page.goto(base + `reserva.html?property=casa&checkin=${date('02-05')}`);
    await page.locator('#choose-checkout').click();
    await day('02-08').waitFor();
    await page.waitForFunction(
      (value) => document.querySelector(`[data-date="${value}"]`).disabled,
      date('02-08'),
    );
    assert.equal(
      await day('02-07').isDisabled(),
      false,
      'Checkout at the start of another stay is allowed',
    );
    assert.equal(await day('02-10').isDisabled(), true, 'Cannot cross an occupied stay');
    await day('02-07').click();
    await page.locator('#choose-checkin').click();
    assert.equal(await day('02-07').isDisabled(), true, 'An occupied night is not a valid arrival');
    assert.equal(
      await day('02-10').isDisabled(),
      false,
      'Arrival on another checkout day is allowed',
    );
    await page.locator('#clear-dates').click();
    assert.equal(await page.locator('#checkin').inputValue(), '');
    assert.equal(await page.locator('#checkout').inputValue(), '');
    await page.keyboard.press('Escape');
    db.deleteBlock(block);

    await page.goto(base + 'reserva.html?property=domo');
    await page.evaluate(() => {
      window.open = (url) => {
        window.testWhatsApp = url;
      };
    });
    await page.locator('#email').fill('not-an-email');
    await page.locator('#name').fill('DO NOT SHARE THIS NAME');
    await page.locator('#phone').fill('DO NOT SHARE THIS PHONE');
    for (const name of ['adults', 'children', 'pets']) await page.locator('#' + name).fill('');
    await page.locator('#booking-whatsapp').click();
    let message = new URL(await page.evaluate(() => window.testWhatsApp)).searchParams.get('text');
    assert.ok(message.includes(locales.es.booking.whatsappFlexible));
    assert.ok(message.includes('Domo Gorbeia'));
    assert.doesNotMatch(message, /DO NOT SHARE|not-an-email|NaN|undefined/);
    assert.equal(db.allRequests().length, 0, 'WhatsApp never writes a request or sends an email');

    await page.goto(base + `eu/reserva.html?property=casa&checkin=${date('01-12')}`);
    await page.evaluate(() => {
      window.open = (url) => {
        window.testWhatsApp = url;
      };
    });
    await page.locator('#booking-whatsapp').click();
    message = new URL(await page.evaluate(() => window.testWhatsApp)).searchParams.get('text');
    assert.ok(message.includes(date('01-12')));
    assert.ok(message.includes(locales.eu.booking.whatsappFlexible));
    assert.ok(!message.includes(locales.eu.booking.summary + ':'));
    assert.equal(db.allRequests().length, 0);

    await page.locator('#choose-checkout').click();
    await page.locator('#manual-dates summary').click();
    await page.locator('#checkout').fill(date('01-14'));
    await page.locator('#checkout').dispatchEvent('change');
    await page.locator('#apply-dates').click();
    assert.equal(await page.locator('#nights').inputValue(), '2');
    await page.locator('#choose-checkin').click();
    await day('01-10').click();
    assert.equal(
      await page.locator('#checkout').inputValue(),
      '',
      'Changing arrival starts a fresh range',
    );
    await page.keyboard.press('Escape');

    await page.goto(base + 'reserva.html');
    await page.locator('#booking-form [type=submit]').click();
    assert.equal(
      await page.locator('#date-picker').evaluate((el) => el.open),
      true,
      'An incomplete formal request opens the shared picker instead of focusing hidden fields',
    );
    await page.locator('#manual-dates summary').click();
    await page.locator('#checkin').fill(date('01-12'));
    await page.locator('#checkin').dispatchEvent('change');
    await page.locator('#checkout').fill(date('01-11'));
    await page.locator('#checkout').dispatchEvent('change');
    assert.equal(await page.locator('#apply-dates').isDisabled(), true);
    assert.equal(await page.locator('#date-error').isVisible(), true);
    await page.keyboard.press('Escape');

    const [lastArrival, lastDeparture] = await page.evaluate(() => {
      const p = window.UxarbeitiPricing;
      return [p.addDays(p.today(), 730), p.addDays(p.today(), 790)];
    });
    await page.goto(base + `reserva.html?property=casa&checkin=${lastArrival}`);
    await page.locator('#choose-checkout').click();
    const lastDay = page.locator(`[data-date="${lastDeparture}"]`);
    for (let i = 0; i < 3 && !(await lastDay.isVisible()); i++)
      await page.locator('#next-month').click();
    assert.equal(
      await lastDay.isEnabled(),
      true,
      'Departure can extend 60 nights past the last allowed arrival',
    );
    await lastDay.click();
    assert.equal(await page.locator('#nights').inputValue(), '60');

    const noJS = await browser.newContext({ javaScriptEnabled: false });
    const fallback = await noJS.newPage();
    await fallback.goto(base + 'reserva.html');
    assert.equal(await fallback.locator('#checkin').isVisible(), true);
    assert.equal(await fallback.locator('#checkout').isVisible(), true);
    assert.equal(
      new URL(await fallback.locator('#contact-launcher').getAttribute('href')).hostname,
      'wa.me',
    );
    await noJS.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(external, [], 'No WhatsApp SDK, trackers or external requests loaded');
  },
);

test(
  'browser: owner calendar, editing, payments, conflict recovery, mobile and arrival pages',
  { timeout: 90000 },
  async (t) => {
    const P = require('../shared/pricing');
    const crypto = require('node:crypto');
    const db = createDatabase(':memory:');
    const day = (n) => P.addDays(P.today(), n);
    const data = {
      property: 'casa',
      checkin: day(5),
      checkout: day(7),
      adults: 2,
      children: 0,
      pets: 0,
      name: 'Synthetic Calendar Guest',
      email: 'calendar@example.test',
      phone: '+34600000000',
      message: '',
      language: 'es',
      consentVersion: 'test',
    };
    const id = db.createRequest(
      { ...data, quote: P.quote(data) },
      crypto.randomUUID(),
      'test',
      'phone',
    ).id;
    db.decide(id, 'confirmed', 0, false);
    db.addBlock('domo', day(5), day(7), 'Mantenimiento');
    const runtime = createApp({
      db,
      env: {
        ADMIN_PASSWORD_HASH: await hashPassword('Browser-management-password'),
        RATE_LIMIT_MAX: '1000',
      },
    });
    const server = runtime.app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    t.after(async () => {
      await browser.close();
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
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
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const base = `http://127.0.0.1:${server.address().port}/`;
    const errors = [];
    const external = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => {
      if (!r.url().startsWith(base)) external.push(r.url());
    });
    const waitRevision = (n) =>
      page.waitForFunction(
        async ({ base, id, n }) => {
          const r = await fetch(base + `api/admin/booking-requests/${id}`);
          const data = await r.json();
          return data.item.revision === n;
        },
        { base, id, n },
      );
    await page.goto(base + 'gestion/');
    await page.locator('[name=password]').fill('Browser-management-password');
    await page.locator('#login-form button').click();
    await page.locator('[data-view=calendar]').click();
    await page.locator('.occupancy-table').waitFor();
    await page.locator('#calendar-month').fill(day(5).slice(0, 7));
    await page.locator('#calendar-month').dispatchEvent('change');
    await page.locator('.occupancy-table').waitFor();
    assert.equal(await page.locator('.occupancy-table tbody tr').count(), 2);
    const visibleNights = [day(5), day(6)].filter((date) =>
      date.startsWith(day(5).slice(0, 7)),
    ).length;
    assert.equal(await page.locator('.occupied').count(), visibleNights);
    assert.equal(await page.locator('.blocked').count(), visibleNights);
    assert.match(await page.locator('#upcoming').textContent(), /Synthetic Calendar Guest/);
    await page.locator('.occupied').first().click();
    await page.locator('#booking-dialog[open]').waitFor();
    await page.locator('#edit-details summary').click();
    await page.locator('#edit-form [name=checkin]').fill(day(8));
    await page.locator('#edit-form [name=checkout]').fill(day(10));
    await page.locator('#edit-form [name=agreedTotal]').fill('222.25');
    await page.locator('#edit-form [name=depositDue]').fill('50');
    await page.locator('#edit-form [name=reason]').fill('Cambio acordado <script>unsafe</script>');
    await page.locator('#edit-form [name=ack]').check();
    await page.locator('#edit-form button').click();
    await waitRevision(2);
    await page.waitForFunction(() => document.querySelector('#edit-details').open === false);
    assert.equal(db.getRequest(id).checkin_date, day(8));
    assert.equal(db.getRequest(id).agreed_total_cents, 22225);
    assert.equal(await page.locator('#booking-history script').count(), 0);
    await page.locator('#payment-form [name=amount]').fill('50.25');
    await page.locator('#payment-form button').click();
    await waitRevision(3);
    await page.waitForFunction(() =>
      document.querySelector('#payment-history').textContent.includes('50,25'),
    );
    assert.equal(db.getRequest(id).paid_cents, 5025);
    await page.locator('#payment-form [name=kind]').selectOption('refund');
    await page.locator('#payment-form [name=amount]').fill('10.25');
    await page.locator('#payment-form button').click();
    await waitRevision(4);
    await page.waitForFunction(() =>
      document.querySelector('#payment-history').textContent.includes('10,25'),
    );
    assert.equal(db.getRequest(id).paid_cents, 4000);
    assert.match(await page.locator('#booking-finances').textContent(), /182,25/);
    assert.equal(
      (
        await context.request.post(base + `api/admin/booking-requests/${id}/payments`, { data: {} })
      ).status(),
      403,
    );
    db.addBlock('casa', day(15), day(17), 'Prueba de conflicto');
    await page.locator('#edit-details summary').click();
    await page.locator('#edit-form [name=checkin]').fill(day(16));
    await page.locator('#edit-form [name=checkout]').fill(day(18));
    await page.locator('#edit-form [name=reason]').fill('Probar solapamiento');
    await page.locator('#edit-form [name=ack]').check();
    await page.locator('#edit-form button').click();
    await page.locator('#booking-dialog-error:not([hidden])').waitFor();
    assert.match(await page.locator('#booking-dialog-error').textContent(), /solapan/);
    assert.equal(db.getRequest(id).checkin_date, day(8));
    db.addPayment(
      id,
      {
        revision: 4,
        kind: 'payment',
        amountCents: 100,
        method: 'cash',
        date: P.today(),
        note: 'Otra sesión',
      },
      crypto.randomUUID(),
      'another-session',
    );
    await page.locator('#edit-form [name=checkin]').fill(day(8));
    await page.locator('#edit-form [name=checkout]').fill(day(10));
    await page.locator('#edit-form button').click();
    await page.waitForFunction(() =>
      document.querySelector('#booking-dialog-error').textContent.includes('otra sesión'),
    );
    await page.keyboard.press('Escape');
    await page.locator('#refresh').click();
    await page.waitForFunction(() => !document.querySelector('#refresh').disabled);
    await page.locator('#calendar-month').fill(day(8).slice(0, 7));
    await page.locator('#calendar-month').dispatchEvent('change');
    await page.locator('.occupancy-table').waitFor();
    const shots = '/tmp/uxarbeiti-management-review';
    fs.mkdirSync(shots, { recursive: true });
    await page.screenshot({ path: shots + '/calendar-desktop.png', fullPage: true });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
        'Management calendar width ' + width,
      );
      await page.locator('.occupied').first().click();
      await page.locator('#booking-dialog[open]').waitFor();
      assert.equal(
        await page.locator('#booking-dialog').evaluate((e) => e.scrollWidth > e.clientWidth + 1),
        false,
        'Management dialog width ' + width,
      );
      await page.screenshot({ path: shots + `/booking-mobile-${width}.png` });
      await page.keyboard.press('Escape');
    }
    await page.locator('#logout').click();
    await page.locator('#login-view:not([hidden])').waitFor();
    assert.ok(!(await page.locator('body').textContent()).includes('Synthetic Calendar Guest'));
    for (const lang of ['es', 'en', 'eu']) {
      await page.goto(base + (lang === 'es' ? '' : lang + '/') + 'como-llegar.html');
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
        'Arrival mobile ' + lang,
      );
      assert.equal(
        await page.locator('.arrival-panel a[href^="https://maps.app.goo.gl/"]').count(),
        1,
      );
      assert.equal(await page.locator('iframe').count(), 0);
    }
    await page.screenshot({ path: shots + '/arrival-mobile-eu.png', fullPage: true });
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
  },
);
