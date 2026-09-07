/* Progressive enhancement: navigation and content remain usable without JavaScript. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  $$('dialog').forEach((dialog) => {
    $('.close-dialog', dialog)?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
  const menu = $('#mobile-menu');
  const toggle = $('.menu-toggle');
  toggle?.addEventListener('click', () => {
    menu.showModal();
    toggle.setAttribute('aria-expanded', 'true');
  });
  menu?.addEventListener('close', () => toggle.setAttribute('aria-expanded', 'false'));
  window.matchMedia('(min-width:1081px)').addEventListener('change', (event) => {
    if (event.matches && menu.open) menu.close();
  });

  // Do not restore form/contact data across languages, tabs, or subsequent guests.
  const params = new URLSearchParams(location.search);
  $$('.languages a').forEach((anchor) => {
    const url = new URL(anchor.href);
    ['property', 'checkin', 'checkout'].forEach((key) => {
      if (params.has(key)) url.searchParams.set(key, params.get(key));
    });
    anchor.href = url.href;
  });

  const galleryData = $('#gallery-data');
  if (galleryData) {
    const data = JSON.parse(galleryData.textContent);
    const dialog = $('#lightbox');
    let active = 0;
    const show = (index) => {
      active = (index + data.photos.length) % data.photos.length;
      $('figure img', dialog).src = data.photos[active];
      $('figure img', dialog).alt = data.captions[active];
      $('figcaption', dialog).textContent = data.captions[active];
      $('.photo-counter', dialog).textContent = `${active + 1} / ${data.photos.length}`;
    };
    $$('[data-gallery-index]').forEach((button) =>
      button.addEventListener('click', () => {
        show(Number(button.dataset.galleryIndex));
        dialog.showModal();
      }),
    );
    $$('[data-photo-step]').forEach((button) =>
      button.addEventListener('click', () => show(active + Number(button.dataset.photoStep))),
    );
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        show(active + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    let touchX = null;
    dialog.addEventListener(
      'touchstart',
      (event) => {
        touchX = event.touches[0].clientX;
      },
      { passive: true },
    );
    dialog.addEventListener(
      'touchend',
      (event) => {
        if (touchX !== null) {
          const distance = event.changedTouches[0].clientX - touchX;
          if (Math.abs(distance) > 60) show(active + (distance < 0 ? 1 : -1));
        }
        touchX = null;
      },
      { passive: true },
    );
  }

  const form = $('#booking-form');
  if (form) initBooking(form);

  function initBooking(form) {
    const t = JSON.parse($('#booking-data').textContent);
    const P = window.UxarbeitiPricing;
    const checkin = $('#checkin');
    const checkout = $('#checkout');
    const nights = $('#nights');
    const status = $('#form-status');
    const submit = $('[type=submit]', form);
    const formatMoney = (value) =>
      new Intl.NumberFormat(t.locale, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }).format(value);
    const formatDate = (value) => {
      const date = P.parseDate(value);
      return `${date.getUTCDate()} ${t.months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
    };
    const today = P.today();
    const maxDate = P.addDays(today, 730);
    checkin.min = today;
    checkin.max = maxDate;
    checkout.min = P.addDays(today, 1);
    checkout.max = P.addDays(maxDate, 60);
    if (Object.hasOwn(t.properties, params.get('property')))
      $(`[name=property][value=${params.get('property')}]`, form).checked = true;
    if (
      P.parseDate(params.get('checkin')) &&
      params.get('checkin') >= today &&
      params.get('checkin') <= maxDate
    )
      checkin.value = params.get('checkin');
    if (P.parseDate(params.get('checkout'))) checkout.value = params.get('checkout');
    let displayedMonth = P.parseDate(checkin.value) || P.parseDate(today);
    displayedMonth = new Date(
      Date.UTC(displayedMonth.getUTCFullYear(), displayedMonth.getUTCMonth(), 1),
    );
    let selectionEnd = Boolean(checkin.value && !checkout.value);
    let key = null;
    let previousPayload = null;
    let currentQuote = null;
    const payload = () => ({
      property: $('[name=property]:checked', form).value,
      checkin: checkin.value,
      checkout: checkout.value,
      adults: Number($('#adults').value),
      children: Number($('#children').value),
      pets: Number($('#pets').value),
    });
    const setStatus = (message, focus = false) => {
      status.textContent = message;
      status.hidden = !message;
      if (focus) status.focus();
    };
    function appendPrice(label, amount, detail = '', total = false) {
      const row = document.createElement('div');
      row.className = `price-row${total ? ' total' : ''}`;
      const title = document.createElement('span');
      title.textContent = label;
      if (detail) {
        const small = document.createElement('small');
        small.textContent = detail;
        title.append(small);
      }
      const value = document.createElement('strong');
      value.textContent = formatMoney(amount);
      row.append(title, value);
      $('#price-breakdown').append(row);
    }
    function refresh() {
      const input = payload();
      const property = t.properties[input.property];
      $('#capacity').textContent = property.capacity;
      $('#adults').max = property.capacity;
      $('#children').max = property.capacity - 1;
      $('#summary-property').textContent = property.name;
      const preview = $('.summary-image img');
      preview.src = property.cover;
      preview.alt = property.alt;
      $('#summary-dates').textContent = '';
      $('#price-breakdown').replaceChildren();
      currentQuote = null;
      checkout.min = checkin.value ? P.addDays(checkin.value, 1) : P.addDays(today, 1);
      checkout.max = checkin.value ? P.addDays(checkin.value, 60) : P.addDays(maxDate, 60);
      if (!input.checkin || !input.checkout) {
        $('#price-breakdown').textContent = t.empty;
        if (!input.checkin || !input.checkout) nights.value = '';
      } else {
        try {
          if (input.checkin < today || input.checkin > maxDate) throw new Error('past');
          currentQuote = P.quote(input);
          const q = currentQuote;
          nights.value = q.nights;
          $('#summary-dates').textContent =
            `${formatDate(input.checkin)} → ${formatDate(input.checkout)} · ${q.nights} ${t.nights.toLowerCase()}`;
          if (q.lowNights)
            appendPrice(
              t.low,
              q.lowNights * q.lowRate,
              `${q.lowNights} × ${formatMoney(q.lowRate)}`,
            );
          if (q.summerNights)
            appendPrice(
              t.summer,
              q.summerNights * q.summerRate,
              `${q.summerNights} × ${formatMoney(q.summerRate)}`,
            );
          if (q.adultsTotal)
            appendPrice(
              t.extraAdults,
              q.adultsTotal,
              `${q.adults - 1} × ${formatMoney(P.RATES.adult)} × ${q.nights} ${t.nights.toLowerCase()}`,
            );
          if (q.childrenTotal)
            appendPrice(
              t.extraChildren,
              q.childrenTotal,
              `${q.children} × ${formatMoney(P.RATES.child)} × ${q.nights} ${t.nights.toLowerCase()}`,
            );
          if (q.petsTotal)
            appendPrice(
              t.extraPets,
              q.petsTotal,
              `${q.pets} × ${formatMoney(P.RATES.pet)} × ${q.nights} ${t.nights.toLowerCase()}`,
            );
          appendPrice(t.cleaning, q.cleaning);
          appendPrice(t.total, q.total, '', true);
        } catch (error) {
          nights.value = '';
          const message = document.createElement('p');
          message.className = 'quote-error';
          message.textContent = t.errors[error.message] || t.errors.form;
          $('#price-breakdown').append(message);
        }
      }
      $$('[data-step]', form).forEach((button) => {
        const field = $(`#${button.dataset.field}`);
        const next = Number(field.value) + Number(button.dataset.step);
        button.disabled = next < Number(field.min) || next > Number(field.max);
      });
      $('#mobile-price-breakdown').replaceChildren(
        ...Array.from($('#price-breakdown').childNodes).map((node) => node.cloneNode(true)),
      );
      renderCalendar();
    }
    function monthLabel(date) {
      return `${t.months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
    }
    function renderCalendar() {
      $('#calendar').hidden = false;
      const months = $('.calendar-months');
      months.replaceChildren();
      $('#calendar-announcement').textContent = selectionEnd ? t.checkout : t.checkin;
      $('#previous-month').disabled =
        displayedMonth <= new Date(today.slice(0, 7) + '-01T00:00:00Z');
      $('#next-month').disabled = displayedMonth >= new Date(maxDate.slice(0, 7) + '-01T00:00:00Z');
      for (let offset = 0; offset < 2; offset++) {
        const start = new Date(
          Date.UTC(displayedMonth.getUTCFullYear(), displayedMonth.getUTCMonth() + offset, 1),
        );
        const section = document.createElement('section');
        section.className = 'calendar-month';
        const heading = document.createElement('h3');
        heading.textContent = monthLabel(start);
        section.append(heading);
        const grid = document.createElement('div');
        grid.className = 'calendar-days';
        for (let weekday = 0; weekday < 7; weekday++) {
          const label = document.createElement('span');
          label.className = 'calendar-day-name';
          label.textContent = t.weekdays[weekday];
          grid.append(label);
        }
        for (let pad = 0; pad < (start.getUTCDay() + 6) % 7; pad++) {
          const space = document.createElement('span');
          space.setAttribute('aria-hidden', 'true');
          grid.append(space);
        }
        const count = new Date(
          Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
        ).getUTCDate();
        for (let day = 1; day <= count; day++) {
          const iso = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), day))
            .toISOString()
            .slice(0, 10);
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'calendar-day';
          button.dataset.date = iso;
          button.textContent = day;
          const selected = iso === checkin.value || iso === checkout.value;
          const limit = selectionEnd && checkin.value ? P.addDays(checkin.value, 60) : maxDate;
          button.disabled = iso < today || iso > limit;
          button.setAttribute(
            'aria-label',
            `${formatDate(iso)}${selected ? `, ${t.selected}` : ''}`,
          );
          button.setAttribute('aria-pressed', String(selected));
          if (selected) button.classList.add('selected');
          if (iso === today) {
            button.classList.add('today');
            button.setAttribute('aria-current', 'date');
          }
          if (checkin.value && checkout.value && iso > checkin.value && iso < checkout.value)
            button.classList.add('in-range');
          button.addEventListener('click', () => {
            if (!selectionEnd || !checkin.value || iso <= checkin.value) {
              if (iso > maxDate) return;
              checkin.value = iso;
              checkout.value = '';
              selectionEnd = true;
            } else {
              checkout.value = iso;
              selectionEnd = false;
            }
            setStatus('');
            refresh();
            $(`[data-date="${iso}"]`, months)?.focus({ preventScroll: true });
          });
          button.addEventListener('keydown', (event) => {
            const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: -7, ArrowDown: 7 }[event.key];
            if (!delta) return;
            event.preventDefault();
            const target = P.addDays(iso, delta);
            if (target < today || target > limit) return;
            const targetDate = P.parseDate(target);
            // Keep keyboard focus within the visible first month on narrow screens.
            if (target.slice(0, 7) !== iso.slice(0, 7)) {
              displayedMonth = new Date(
                Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 1),
              );
              renderCalendar();
            }
            $(`[data-date="${target}"]`, months)?.focus({ preventScroll: true });
          });
          grid.append(button);
        }
        section.append(grid);
        months.append(section);
      }
    }
    $('#previous-month').addEventListener('click', () => {
      displayedMonth.setUTCMonth(displayedMonth.getUTCMonth() - 1);
      renderCalendar();
    });
    $('#next-month').addEventListener('click', () => {
      displayedMonth.setUTCMonth(displayedMonth.getUTCMonth() + 1);
      renderCalendar();
    });
    $$('[data-step]', form).forEach((button) =>
      button.addEventListener('click', () => {
        const field = $(`#${button.dataset.field}`);
        const next = Number(field.value) + Number(button.dataset.step);
        if (next >= Number(field.min) && next <= Number(field.max)) {
          field.value = next;
          setStatus('');
          refresh();
        }
      }),
    );
    form.addEventListener('input', (event) => {
      if (event.target.name === 'nights') return;
      if (['adults', 'children', 'pets', 'property'].includes(event.target.name)) {
        setStatus('');
        refresh();
      }
    });
    checkin.addEventListener('change', () => {
      if (P.parseDate(checkin.value)) {
        if (checkout.value <= checkin.value) checkout.value = '';
        const date = P.parseDate(checkin.value);
        displayedMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
      }
      selectionEnd = Boolean(checkin.value && !checkout.value);
      setStatus('');
      refresh();
    });
    checkout.addEventListener('change', () => {
      selectionEnd = false;
      setStatus('');
      refresh();
    });
    nights.addEventListener('change', () => {
      const count = Number(nights.value);
      if (P.parseDate(checkin.value) && Number.isInteger(count) && count >= 1 && count <= 60) {
        checkout.value = P.addDays(checkin.value, count);
        selectionEnd = false;
        refresh();
      }
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submit.disabled) return;
      refresh();
      if (!currentQuote) {
        setStatus(t.errors.form, true);
        return;
      }
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const body = {
        ...payload(),
        name: values.get('name').trim(),
        email: values.get('email').trim(),
        phone: values.get('phone').trim(),
        message: values.get('message').trim(),
        consent: values.get('consent') === 'on',
        website: values.get('website'),
        language: document.documentElement.lang,
        expectedTotal: currentQuote.total,
      };
      const fingerprint = JSON.stringify(body);
      if (fingerprint !== previousPayload) {
        key = crypto.randomUUID();
        previousPayload = fingerprint;
      }
      submit.disabled = true;
      submit.textContent = t.sending;
      form.setAttribute('aria-busy', 'true');
      setStatus('');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
          body: fingerprint,
          signal: controller.signal,
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (response.status === 429) throw new Error('rate');
        if (response.status === 409) throw new Error('changed');
        if (!response.headers.get('content-type')?.includes('application/json'))
          throw new Error('offline');
        const result = await response.json();
        if (!response.ok || !result.ok || !result.requestId)
          throw new Error(response.status === 400 ? 'form' : 'offline');
        $('#booking-reference').textContent = result.requestId;
        $('.booking-layout').hidden = true;
        $('.booking-intro').hidden = true;
        $('#booking-success').hidden = false;
        form.reset();
        $('#booking-success').focus();
      } catch (error) {
        setStatus(t.errors[error.message] || t.errors.offline, true);
      } finally {
        clearTimeout(timeout);
        submit.disabled = false;
        submit.textContent = t.submit;
        form.removeAttribute('aria-busy');
      }
    });
    refresh();
    fetch(new URL(`${t.root}api/health`, location.href), {
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((health) => {
        if (!health?.acceptsBookings) showUnavailable();
      })
      .catch(showUnavailable);
    function showUnavailable() {
      $('#booking-service-status').hidden = false;
      submit.disabled = true;
    }
  }

  // Retire the previous offline cache; reservation data must never enter a service-worker cache.
  if ('serviceWorker' in navigator) {
    const script =
      document.currentScript || $$('script[src]').find((node) => /\/assets\/app\./.test(node.src));
    if (script) {
      const worker = new URL('../sw.js', script.src);
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations
            .filter((reg) => new URL(reg.scope).href === new URL('./', worker).href)
            .forEach((reg) => reg.update().catch(() => {}));
        })
        .catch(() => {});
    }
  }
})();
