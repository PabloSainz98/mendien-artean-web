/* Loaded only on reservation pages. No contact data is persisted in the browser. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const params = new URLSearchParams(location.search);

  const form = $('#booking-form');
  if (form) initBooking(form);

  function initBooking(form) {
    const t = JSON.parse($('#booking-data').textContent);
    const P = window.UxarbeitiPricing;
    const checkin = $('#checkin');
    const checkout = $('#checkout');
    const nights = $('#nights');
    const picker = $('#date-picker');
    // Keep native date inputs as a manual/no-JS fallback; both enhanced fields share one picker.
    $('#manual-dates').append($('#date-inputs'));
    $('#date-fields').hidden = false;
    form.noValidate = true;
    const status = $('#form-status');
    const submit = $('[type=submit]', form);
    const moneyFormatter = new Intl.NumberFormat(t.locale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    });
    const formatMoney = (value) => moneyFormatter.format(value);
    const formatDate = (value) => {
      const date = P.parseDate(value);
      if (t.locale === 'eu-ES')
        return `${date.getUTCFullYear()}ko ${t.months[date.getUTCMonth()].slice(0, -1)}aren ${date.getUTCDate()}a`;
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
    if (
      P.parseDate(params.get('checkout')) &&
      params.get('checkout') > today &&
      params.get('checkout') <= checkout.max
    )
      checkout.value = params.get('checkout');
    for (const name of ['adults', 'children', 'pets']) {
      const field = $(`#${name}`);
      const value = params.get(name);
      if (
        /^\d$/.test(value) &&
        Number(value) >= Number(field.min) &&
        Number(value) <= Number(field.max)
      )
        field.value = value;
    }
    let displayedMonth = P.parseDate(checkin.value) || P.parseDate(today);
    displayedMonth = new Date(
      Date.UTC(displayedMonth.getUTCFullYear(), displayedMonth.getUTCMonth(), 1),
    );
    let selectionEnd = Boolean(checkin.value && !checkout.value);
    let key = null;
    let previousPayload = null;
    let currentQuote = null;
    const availability = { casa: [], domo: [] };
    const availabilityState = Object.fromEntries(
      Object.keys(availability).map((property) => [
        property,
        { status: 'idle', updated: 0, pending: null },
      ]),
    );
    let availabilityRevision = 0;
    let calendarSignature = '';
    let serviceAvailable = null;
    let healthPending = null;
    let submitVisible = false;
    const dock = $('#booking-dock');
    const mobile = window.matchMedia('(max-width:760px)');
    submit.disabled = true;
    const overlaps = (property, start, end) =>
      availability[property].some(
        (range) => range.checkin_date < end && range.checkout_date > start,
      );
    const validDates = () =>
      P.parseDate(checkin.value) &&
      P.parseDate(checkout.value) &&
      checkin.value >= today &&
      checkin.value <= maxDate &&
      checkout.value > checkin.value &&
      checkout.value <= P.addDays(checkin.value, 60) &&
      !overlaps(payload().property, checkin.value, checkout.value);
    const payload = () => ({
      property: $('[name=property]:checked', form).value,
      checkin: checkin.value,
      checkout: checkout.value,
      adults: Number($('#adults').value),
      children: Number($('#children').value),
      pets: Number($('#pets').value),
    });
    function updateLanguageLinks() {
      // Only stay criteria travel in links. Never contact details, consent or free text.
      const criteria = payload();
      $$('.languages a').forEach((anchor) => {
        const url = new URL(anchor.href);
        url.search = '';
        for (const [name, value] of Object.entries(criteria)) {
          const valid =
            name === 'property' ||
            (['checkin', 'checkout'].includes(name)
              ? P.parseDate(value)
              : $(`#${name}`).validity.valid);
          if (valid) url.searchParams.set(name, value);
        }
        anchor.href = url.href;
      });
    }
    function updateDock() {
      const editing = document.activeElement?.matches(
        'input:not([type=radio]):not([type=checkbox]), textarea',
      );
      dock.hidden =
        !mobile.matches ||
        !currentQuote ||
        submitVisible ||
        editing ||
        Boolean($('dialog[open]')) ||
        !$('#booking-success').hidden ||
        serviceAvailable === false;
      document.body.classList.toggle('has-booking-dock', !dock.hidden);
      if (currentQuote) {
        $('#dock-total').textContent = formatMoney(currentQuote.total);
        $('#dock-nights').textContent = `${currentQuote.nights} ${t.nights.toLowerCase()}`;
      }
    }
    const submitObserver = new IntersectionObserver(
      ([entry]) => {
        submitVisible = entry.isIntersecting;
        updateDock();
      },
      { rootMargin: '0px 0px 90px 0px' },
    );
    submitObserver.observe(submit);
    mobile.addEventListener('change', updateDock);
    document.addEventListener('focusin', updateDock);
    document.addEventListener('focusout', () => requestAnimationFrame(updateDock));
    $$('dialog').forEach((dialog) => dialog.addEventListener('close', updateDock));
    $('#booking-continue').addEventListener('click', () => {
      const next = $$('input, textarea', form).find((field) => !field.validity.valid) || submit;
      next.focus();
      next.scrollIntoView({ block: 'center', behavior: 'auto' });
    });
    function showAvailabilityStatus() {
      const state = availabilityState[payload().property];
      $$('.availability-status').forEach((notice) => {
        notice.hidden = !['loading', 'failed'].includes(state.status);
        $('[data-availability-message]', notice).textContent =
          state.status === 'failed' ? t.availabilityFailed : t.availabilityLoading;
        $('[data-retry-availability]', notice).hidden = state.status !== 'failed';
      });
    }
    async function loadAvailability(force = false) {
      const property = payload().property;
      const state = availabilityState[property];
      if (state.pending) return state.pending;
      if (!force && state.status === 'ready' && Date.now() - state.updated < 60000) return;
      state.status = 'loading';
      showAvailabilityStatus();
      state.pending = (async () => {
        try {
          const response = await fetch(
            new URL(`${t.root}api/availability?property=${property}`, location.href),
            {
              cache: 'no-store',
              signal: AbortSignal.timeout(6000),
            },
          );
          if (!response.ok) throw new Error('unavailable');
          const result = await response.json();
          if (
            !result?.ok ||
            !Array.isArray(result.ranges) ||
            result.ranges.some(
              (range) =>
                !P.parseDate(range?.checkin_date) ||
                !P.parseDate(range?.checkout_date) ||
                range.checkout_date <= range.checkin_date,
            )
          )
            throw new Error('unavailable');
          availability[property] = result.ranges;
          state.status = 'ready';
          state.updated = Date.now();
          availabilityRevision++;
        } catch {
          state.status = 'failed'; // Keep last known blocks; the server rechecks every request.
        } finally {
          state.pending = null;
          refresh();
        }
      })();
      return state.pending;
    }
    function checkService() {
      if (healthPending) return healthPending;
      $('#retry-service').disabled = true;
      healthPending = fetch(new URL(`${t.root}api/health`, location.href), {
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((health) => {
          serviceAvailable = health?.acceptsBookings === true;
        })
        .catch(() => {
          serviceAvailable = false;
        })
        .finally(() => {
          healthPending = null;
          $('#booking-service-status').hidden = serviceAvailable;
          $('#retry-service').disabled = false;
          submit.disabled = !serviceAvailable || form.getAttribute('aria-busy') === 'true';
          updateDock();
        });
      return healthPending;
    }
    $$('[data-retry-availability]').forEach((button) =>
      button.addEventListener('click', () => loadAvailability(true)),
    );
    $('#retry-service').addEventListener('click', () => {
      checkService();
      loadAvailability();
    });
    const reconnect = () => {
      loadAvailability();
      if (!serviceAvailable) checkService();
    };
    window.addEventListener('online', reconnect);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && $('#booking-success').hidden) reconnect();
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
      $('#adults').max = Math.max(1, property.capacity - Math.max(0, input.children));
      $('#children').max = Math.max(0, property.capacity - Math.max(1, input.adults));
      const invalidGroup =
        !$('#adults').validity.valid ||
        !$('#children').validity.valid ||
        input.adults + input.children > property.capacity;
      $('#group-error').hidden = !invalidGroup;
      $('#group-error').textContent = invalidGroup ? t.errors.capacity : '';
      for (const name of ['adults', 'children']) {
        $(`#${name}`).setAttribute('aria-invalid', String(invalidGroup));
        $(`#${name}`).setAttribute('aria-describedby', 'group-error');
      }
      $('#summary-property').textContent = property.name;
      const preview = $('.summary-image img');
      if (preview.getAttribute('src') !== property.cover) {
        preview.src = property.cover;
        preview.alt = property.alt;
      }
      $('#summary-dates').textContent = '';
      $('#price-breakdown').replaceChildren();
      currentQuote = null;
      checkout.min = checkin.value ? P.addDays(checkin.value, 1) : P.addDays(today, 1);
      checkout.max = checkin.value ? P.addDays(checkin.value, 60) : P.addDays(maxDate, 60);
      for (const input of [checkin, checkout]) {
        $(`#${input.id}-display`).textContent = P.parseDate(input.value)
          ? (t.locale === 'eu-ES' ? input.value.split('-') : input.value.split('-').reverse()).join(
              '/',
            )
          : t.datePlaceholder;
        $(`#choose-${input.id}`).setAttribute(
          'aria-label',
          `${t[input.id]}: ${P.parseDate(input.value) ? formatDate(input.value) : t.datePlaceholder}`,
        );
      }
      $('#apply-dates').disabled = !validDates();
      const dateError = $('#date-error');
      dateError.textContent =
        checkin.value && checkout.value && !validDates()
          ? overlaps(input.property, checkin.value, checkout.value)
            ? t.occupied
            : t.errors.dates
          : '';
      dateError.hidden = !dateError.textContent;
      if (!input.checkin || !input.checkout) {
        $('#price-breakdown').textContent = t.empty;
        if (!input.checkin || !input.checkout) nights.value = '';
      } else {
        try {
          if (input.checkin < today || input.checkin > maxDate) throw new Error('past');
          currentQuote = P.quote(input);
          if (overlaps(input.property, input.checkin, input.checkout)) {
            currentQuote = null;
            throw new Error('occupied');
          }
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
          message.textContent =
            error.message === 'occupied' ? t.occupied : t.errors[error.message] || t.errors.form;
          $('#price-breakdown').append(message);
        }
      }
      $$('[data-step]', form).forEach((button) => {
        const field = $(`#${button.dataset.field}`);
        const next = Number(field.value) + Number(button.dataset.step);
        button.disabled =
          next < Number(field.min) || (next > Number(field.max) && Number(button.dataset.step) > 0);
      });
      $('#mobile-price-breakdown').replaceChildren(
        ...Array.from($('#price-breakdown').childNodes).map((node) => node.cloneNode(true)),
      );
      renderCalendar();
      updateLanguageLinks();
      showAvailabilityStatus();
      updateDock();
    }
    function monthLabel(date) {
      if (t.locale === 'eu-ES') return `${date.getUTCFullYear()}ko ${t.months[date.getUTCMonth()]}`;
      return `${t.months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
    }
    const calendarLimit = () =>
      selectionEnd && checkin.value ? P.addDays(checkin.value, 60) : maxDate;
    function dayDisabled(iso) {
      if (iso < today || iso > calendarLimit()) return true;
      if (selectionEnd && checkin.value && iso > checkin.value)
        return overlaps(payload().property, checkin.value, iso);
      return iso > maxDate || overlaps(payload().property, iso, P.addDays(iso, 1));
    }
    function previewRange(end) {
      const preview = selectionEnd && checkin.value && end > checkin.value && !dayDisabled(end);
      $$('.calendar-day').forEach((day) => {
        day.classList.toggle(
          'preview-range',
          Boolean(preview && day.dataset.date > checkin.value && day.dataset.date <= end),
        );
      });
    }
    function renderCalendar() {
      const signature = JSON.stringify([
        displayedMonth,
        checkin.value,
        checkout.value,
        payload().property,
        selectionEnd,
        picker.open,
        availabilityRevision,
      ]);
      if (signature === calendarSignature) return;
      calendarSignature = signature;
      $('#calendar').hidden = false;
      const months = $('.calendar-months');
      const focused = document.activeElement?.classList.contains('calendar-day')
        ? document.activeElement.dataset.date
        : null;
      months.replaceChildren();
      $('#calendar-announcement').textContent = selectionEnd ? t.pickDeparture : t.pickArrival;
      for (const name of ['checkin', 'checkout'])
        $(`#choose-${name}`).classList.toggle(
          'choosing',
          picker.open && name === (selectionEnd ? 'checkout' : 'checkin'),
        );
      $('#previous-month').disabled =
        displayedMonth <= new Date(today.slice(0, 7) + '-01T00:00:00Z');
      $('#next-month').disabled =
        displayedMonth >= new Date(calendarLimit().slice(0, 7) + '-01T00:00:00Z');
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
          button.disabled = dayDisabled(iso);
          button.tabIndex = -1;
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
            let complete = false;
            if (!selectionEnd || !checkin.value || iso <= checkin.value) {
              if (iso > maxDate) return;
              checkin.value = iso;
              checkout.value = '';
              selectionEnd = true;
            } else {
              checkout.value = iso;
              selectionEnd = false;
              complete = true;
            }
            setStatus('');
            refresh();
            if (complete) picker.close();
            else $(`[data-date="${iso}"]`, months)?.focus({ preventScroll: true });
          });
          button.addEventListener('mouseenter', () => previewRange(iso));
          button.addEventListener('focus', () => {
            $$('.calendar-day', months).forEach((day) => {
              day.tabIndex = day === button ? 0 : -1;
            });
            previewRange(iso);
          });
          button.addEventListener('keydown', (event) => {
            const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: -7, ArrowDown: 7 }[event.key];
            if (!delta) return;
            event.preventDefault();
            let target = P.addDays(iso, delta);
            while (target >= today && target <= calendarLimit() && dayDisabled(target))
              target = P.addDays(target, delta);
            if (target < today || target > calendarLimit()) return;
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
      const preferred =
        focused || (selectionEnd ? checkout.value || checkin.value : checkin.value) || today;
      const visibleDays = $$('.calendar-day:not(:disabled)', months).filter(
        (day) =>
          !window.matchMedia('(max-width:600px)').matches ||
          day.closest('section') === months.firstElementChild,
      );
      const focusable = visibleDays.find((day) => day.dataset.date === preferred) || visibleDays[0];
      if (focusable) {
        focusable.tabIndex = 0;
        if (focused && picker.open) focusable.focus({ preventScroll: true });
      }
    }
    function openPicker(name) {
      selectionEnd = name === 'checkout' && Boolean(checkin.value);
      const date =
        P.parseDate(name === 'checkout' ? checkout.value || checkin.value : checkin.value) ||
        P.parseDate(today);
      displayedMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
      $('#manual-dates').open = false;
      picker.showModal();
      for (const field of ['checkin', 'checkout'])
        $(`#choose-${field}`).setAttribute('aria-expanded', 'true');
      refresh();
      loadAvailability();
      $('.calendar-day[tabindex="0"]')?.focus({ preventScroll: true });
    }
    for (const name of ['checkin', 'checkout'])
      $(`#choose-${name}`).addEventListener('click', () => openPicker(name));
    picker.addEventListener('close', () => {
      for (const name of ['checkin', 'checkout']) {
        $(`#choose-${name}`).setAttribute('aria-expanded', 'false');
        $(`#choose-${name}`).classList.remove('choosing');
      }
    });
    $('#calendar').addEventListener('mouseleave', () => previewRange(''));
    $('#clear-dates').addEventListener('click', () => {
      checkin.value = checkout.value = '';
      selectionEnd = false;
      setStatus('');
      refresh();
    });
    $('#apply-dates').addEventListener('click', () => {
      refresh();
      if (validDates()) picker.close();
    });
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
        if (
          next >= Number(field.min) &&
          (next <= Number(field.max) || Number(button.dataset.step) < 0)
        ) {
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
        if (event.target.name === 'property') loadAvailability();
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
        if (!validDates()) {
          openPicker(checkin.value ? 'checkout' : 'checkin');
          return;
        }
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
        privacyVersion: t.privacyVersion,
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
      updateDock();
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
        if (!response.headers.get('content-type')?.includes('application/json'))
          throw new Error('offline');
        const result = await response.json();
        if (result.error === 'privacy_changed') throw new Error('privacy_changed');
        if (response.status === 409)
          throw new Error(result.error === 'occupied' ? 'occupied' : 'changed');
        if (!response.ok || !result.ok || !result.requestId)
          throw new Error(response.status === 400 ? 'form' : 'offline');
        $('#booking-reference').textContent = result.requestId;
        $('.booking-layout').hidden = true;
        $('.booking-intro').hidden = true;
        $('#booking-success').hidden = false;
        form.reset();
        updateDock();
        $('#booking-success').focus();
      } catch (error) {
        if (error.message === 'occupied') loadAvailability(true);
        setStatus(
          error.message === 'occupied' ? t.occupied : t.errors[error.message] || t.errors.offline,
          true,
        );
      } finally {
        clearTimeout(timeout);
        submit.disabled = !serviceAvailable;
        submit.textContent = t.submit;
        form.removeAttribute('aria-busy');
      }
    });
    $('#booking-whatsapp').addEventListener('click', () => {
      refresh();
      setStatus('');
      const p = payload();
      const parts = [t.whatsappIntro, '', t.properties[p.property].name];
      const hasArrival = P.parseDate(p.checkin) && p.checkin >= today && p.checkin <= maxDate;
      const hasDeparture = P.parseDate(p.checkout) && p.checkout > (hasArrival ? p.checkin : today);
      if (hasArrival) parts.push(`${t.checkin}: ${p.checkin}`);
      if (hasDeparture) parts.push(`${t.checkout}: ${p.checkout}`);
      if (!hasArrival || !hasDeparture) parts.push(t.whatsappFlexible);
      for (const name of ['adults', 'children', 'pets'])
        if ($(`#${name}`).validity.valid) parts.push(`${t[name]}: ${p[name]}`);
      if (currentQuote)
        parts.push(
          `${t.nights}: ${currentQuote.nights}`,
          `${t.summary}: ${formatMoney(currentQuote.total)}`,
          t.included,
        );
      parts.push('', t.whatsappNote);
      const url = new URL(`https://wa.me/${t.phoneRaw}`);
      url.searchParams.set('text', parts.join('\n'));
      window.open(url.href, '_blank', 'noopener,noreferrer');
    });
    refresh();
    loadAvailability();
    checkService();
  }
})();
