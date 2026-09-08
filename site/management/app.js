(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const P = window.UxarbeitiPricing;
  const names = { casa: 'Urkiola Etxea', domo: 'Domo Gorbeia' };
  const labels = {
    new: 'Pendiente',
    confirmed: 'Confirmada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
  };
  const money = (n) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
  const ref = (id) => `UX-${String(id).padStart(6, '0')}`;
  let csrf = '',
    emailEnabled = false,
    items = [],
    decision = null,
    sessionTimer,
    hasMore = false;
  let manualKey, manualFingerprint;
  let sessionGeneration = 0;
  let booking = null,
    paymentKey = null,
    paymentFingerprint = null,
    calendarGeneration = 0;
  const errors = {
    unauthorized: 'La contraseña no es correcta o la sesión ha caducado.',
    admin_unconfigured: 'Falta configurar la contraseña de gestión en el servidor.',
    rate: 'Demasiados intentos. Espera 15 minutos antes de volver a entrar.',
    csrf: 'Recarga la página e inicia sesión de nuevo.',
    occupied:
      'Estas fechas se solapan con una reserva confirmada o un bloqueo. No se ha guardado el cambio.',
    stale: 'La solicitud cambió en otra sesión. Actualiza la lista antes de decidir.',
    transition: 'Este cambio no está permitido para el estado actual. Actualiza la lista.',
    legacy:
      'Esta solicitud antigua no tiene alojamiento o presupuesto. Revísala y registra sus fechas manualmente.',
    email_disabled:
      'El correo no está configurado. Solo continúa sin notificación si vas a avisar personalmente.',
    form: 'Revisa las fechas, capacidad y datos del formulario.',
    past: 'La llegada debe estar entre hoy y los próximos dos años.',
    mail_busy:
      'Se está enviando un correo de esta reserva. Espera unos instantes antes de editarla.',
    refund_exceeds_paid: 'La devolución supera el importe recibido que figura en el registro.',
    idempotency_conflict:
      'Este movimiento ya se ha procesado con otros datos. Revisa el historial.',
  };
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function notice(message) {
    $('#notice').textContent = message;
    $('#notice').hidden = !message;
  }
  function signedOut() {
    sessionGeneration++;
    clearTimeout(sessionTimer);
    csrf = '';
    items = [];
    decision = null;
    booking = null;
    paymentKey = paymentFingerprint = null;
    calendarGeneration++;
    $('#booking-dialog').close();
    $('#edit-form').replaceChildren();
    $('#booking-dialog-title').textContent = '';
    $('#booking-finances').textContent = '';
    $('#payment-history').replaceChildren();
    $('#booking-history').replaceChildren();
    $('#payment-form').reset();
    $('#upcoming').replaceChildren();
    $('#occupancy').replaceChildren();
    $('#decision-dialog').close();
    $('#decision-summary').textContent = '';
    $('#dashboard').hidden = true;
    $('#logout').hidden = true;
    $('#login-view').hidden = false;
    $('#requests').replaceChildren();
    $('#system-status').textContent = '';
    $('#blocks').replaceChildren();
    $('#manual-form').reset();
    $('#block-form').reset();
    manualKey = manualFingerprint = null;
  }
  async function api(route, body, method = 'POST', headers = {}) {
    const generation = sessionGeneration;
    const response = await fetch(new URL(`../api/admin/${route}`, location.href), {
      method: body === undefined ? 'GET' : method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if (!response.headers.get('content-type')?.includes('application/json'))
      throw new Error('backend');
    const result = await response.json();
    // A delayed response must not repopulate personal data after logout or expiry.
    if (generation !== sessionGeneration) throw new Error('unauthorized');
    if (response.status === 401 && route !== 'login') signedOut();
    if (!response.ok || !result.ok) throw new Error(result.error || 'backend');
    return result;
  }
  async function run(button, task) {
    if (button.disabled) return;
    button.disabled = true;
    notice('');
    try {
      await task();
    } catch (error) {
      $('#decision-dialog').close();
      notice(
        errors[error.message] ||
          'No se pudo verificar el resultado. Actualiza la lista antes de repetir la acción.',
      );
      $('#notice').focus();
    } finally {
      button.disabled = false;
    }
  }
  function view(name) {
    for (const key of ['requests', 'manual', 'blocks', 'calendar']) {
      $(`#${key}-view`).hidden = key !== name;
      $(`[data-view="${key}"]`).setAttribute('aria-pressed', String(key === name));
    }
  }
  async function load(more = false) {
    const system = await api('system');
    $('#legal-status').hidden = system.legal?.complete === true;
    const backup = system.backups;
    $('#system-status').className = backup.healthy ? 'muted' : 'warning';
    $('#system-status').textContent =
      `${system.acceptsBookings ? 'Solicitudes web abiertas.' : 'Solicitudes web cerradas.'} ` +
      (backup.healthy
        ? `Copia automática comprobada: ${new Date(backup.lastSuccess).toLocaleString('es-ES')}.`
        : 'Las copias automáticas necesitan revisión técnica.');
    const result = await api(`booking-requests?limit=100&offset=${more ? items.length : 0}`);
    items = more ? items.concat(result.items) : result.items;
    hasMore = result.items.length === 100;
    render();
    const blocks = await api('blocks');
    renderBlocks(blocks.items);
    await loadCalendar();
  }
  function render() {
    const filter = $('#filter').value;
    const shown = items.filter((item) => filter === 'all' || item.status === filter);
    $('#requests').replaceChildren();
    $('#count').textContent =
      `${shown.length} visibles · ${items.length} cargadas${hasMore ? ' (hay más)' : ''}`;
    $('#more').hidden = !hasMore;
    if (!shown.length) $('#requests').append(node('p', 'No hay solicitudes en esta vista.'));
    for (const item of shown) {
      const card = node('article', undefined, 'request');
      card.id = `reserva=${item.id}`;
      card.append(
        node(
          'span',
          labels[item.status] || item.status,
          `badge ${Object.hasOwn(labels, item.status) ? item.status : ''}`,
        ),
        node('p', `${ref(item.id)} · ${item.source}`, 'muted'),
        node('h3', names[item.property] || 'Alojamiento por revisar'),
        node('p', `${item.checkin_date} → ${item.checkout_date}`),
        node('strong', item.name),
      );
      const contact = node('p');
      if (item.email) {
        const link = node('a', item.email);
        link.href = `mailto:${encodeURIComponent(item.email)}`;
        contact.append(link, node('br'));
      }
      contact.append(node('span', item.phone));
      card.append(contact);
      if (item.quote_json) {
        const q = JSON.parse(item.quote_json);
        const details = node('details');
        details.append(node('summary', `${q.nights} noches · ${money(q.total)} · Ver desglose`));
        const dl = node('dl');
        for (const [label, value] of [
          ['Adultos / niños / mascotas', `${q.adults} / ${q.children} / ${q.pets}`],
          [`Baja: ${q.lowNights} × ${money(q.lowRate)}`, money(q.lowNights * q.lowRate)],
          [
            `Alta: ${q.summerNights} × ${money(q.summerRate)}`,
            money(q.summerNights * q.summerRate),
          ],
          ['Adultos adicionales', money(q.adultsTotal)],
          ['Niños (cuna)', money(q.childrenTotal)],
          ['Mascotas', money(q.petsTotal)],
          ['Limpieza (una vez)', money(q.cleaning)],
          ['Total', money(q.total)],
        ])
          dl.append(node('dt', label), node('dd', value));
        details.append(dl);
        card.append(details);
      }
      if (item.message) card.append(node('p', item.message));
      const state = item.guest_notification_status;
      card.append(
        node(
          'p',
          state
            ? `Correo al huésped: ${{ sent: 'enviado al servidor de correo', pending: 'pendiente de envío / reintento', sending: 'enviando', superseded: 'sustituido por cancelación' }[state] || state}`
            : item.status === 'new'
              ? 'Todavía no se ha confirmado la estancia.'
              : 'Sin notificación por correo. Avisa personalmente al huésped.',
          'muted',
        ),
      );
      if (item.notification_error)
        card.append(
          node('p', 'Aviso al equipo pendiente: comprueba la configuración del correo.', 'warning'),
        );
      const actions = node('div', undefined, 'actions');
      const manage = node('button', 'Estancia y pagos');
      manage.addEventListener('click', () => run(manage, () => openBooking(item.id)));
      actions.append(manage);
      if (item.quote_json) card.append(node('p', financialText(item), 'quote'));
      for (const [label, status] of item.status === 'new'
        ? [
            ['Aceptar', 'confirmed'],
            ['Rechazar', 'rejected'],
          ]
        : item.status === 'confirmed'
          ? [['Cancelar reserva', 'cancelled']]
          : []) {
        const button = node('button', label, status === 'confirmed' ? 'primary' : '');
        button.addEventListener('click', () => openDecision(item, status));
        actions.append(button);
      }
      if (/^\+[1-9][\d ()-]{7,25}$/.test(item.phone)) {
        const number = item.phone.replace(/\D/g, '');
        if (number.length <= 15) {
          const link = node('a', 'Abrir WhatsApp ↗');
          const message = {
            es: {
              confirmed: 'Tu estancia está confirmada.',
              rejected: 'No podemos aceptar tu solicitud.',
              cancelled: 'Tu reserva se ha cancelado.',
              new: 'Estamos revisando tu solicitud.',
            },
            en: {
              confirmed: 'Your stay is confirmed.',
              rejected: 'We cannot accept your request.',
              cancelled: 'Your booking has been cancelled.',
              new: 'We are reviewing your request.',
            },
            eu: {
              confirmed: 'Zure egonaldia baieztatuta dago.',
              rejected: 'Ezin dugu zure eskaera onartu.',
              cancelled: 'Zure erreserba ezeztatu da.',
              new: 'Zure eskaera aztertzen ari gara.',
            },
          }[item.language || 'es'];
          link.href = `https://wa.me/${number}?text=${encodeURIComponent(`UXARBEITI · ${ref(item.id)}\n${message?.[item.status] || ''}\n${names[item.property] || ''}\n${item.checkin_date} → ${item.checkout_date}`)}`;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          actions.append(link);
        }
      }
      card.append(actions);
      $('#requests').append(card);
    }
  }
  function openDecision(item, status) {
    decision = { item, status };
    $('#decision-title').textContent = {
      confirmed: '¿Confirmar esta estancia?',
      rejected: '¿Rechazar esta solicitud?',
      cancelled: '¿Cancelar esta reserva?',
    }[status];
    $('#decision-summary').textContent =
      `${ref(item.id)} · ${item.name} · ${names[item.property]} · ${item.checkin_date} → ${item.checkout_date}`;
    $('#notify-guest').disabled = !emailEnabled || !item.email;
    $('#notify-guest').checked = emailEnabled && Boolean(item.email);
    $('#decision-help').textContent =
      status === 'confirmed'
        ? 'Se comprobará que las fechas estén libres y se reservarán para este huésped. No se cobra ningún importe. Si no envías correo, avisa personalmente.'
        : 'No se realiza ningún cobro ni devolución desde esta web. Si no envías correo, avisa personalmente.';
    $('#decision-dialog').showModal();
  }
  function renderBlocks(blocks) {
    $('#blocks').replaceChildren();
    for (const block of blocks) {
      const row = node('div', undefined, 'block');
      row.append(
        node(
          'p',
          `${names[block.property]} · ${block.checkin_date} → ${block.checkout_date} · ${block.note}`,
        ),
      );
      const remove = node('button', 'Liberar fechas');
      remove.addEventListener('click', () => {
        if (window.confirm('¿Liberar estas fechas? Volverán a poder solicitarse.'))
          run(remove, async () => {
            await api(`blocks/${block.id}`, {}, 'DELETE');
            await load();
            notice('Fechas liberadas.');
          });
      });
      row.append(remove);
      $('#blocks').append(row);
    }
  }
  function manualData() {
    const data = Object.fromEntries(new FormData($('#manual-form')));
    for (const field of ['adults', 'children', 'pets']) data[field] = Number(data[field]);
    return data;
  }
  function manualQuote() {
    try {
      const q = P.quote(manualData());
      $('#manual-quote').textContent =
        `${q.nights} noches · ${money(q.total)} en total (incluye ${money(q.cleaning)} de limpieza).`;
    } catch {
      $('#manual-quote').textContent =
        'Selecciona fechas válidas y un grupo dentro de la capacidad: casa 4 / domo 3 personas, incluidos niños.';
    }
  }
  const cents = (value) =>
    /^\d+(?:[.,]\d{1,2})?$/.test(value) ? Math.round(Number(value.replace(',', '.')) * 100) : NaN;
  function financialText(item) {
    const total =
      item.agreed_total_cents ?? (item.quote_json ? JSON.parse(item.quote_json).total * 100 : null);
    const paid = item.paid_cents || 0;
    const balance = total === null ? null : total - paid;
    return (
      `${total === null ? 'Precio por revisar' : `Precio acordado: ${money(total / 100)}`} · Recibido neto: ${money(paid / 100)} · ` +
      (balance === null
        ? 'Saldo por revisar.'
        : balance < 0
          ? `Exceso recibido: ${money(-balance / 100)}. Revisar devolución.`
          : `Pendiente: ${money(balance / 100)}.`) +
      ` Señal acordada: ${money((item.deposit_due_cents || 0) / 100)}; por recibir: ${money(Math.max(0, (item.deposit_due_cents || 0) - paid) / 100)}.` +
      (['cancelled', 'rejected'].includes(item.status)
        ? ' Estancia cerrada: revisa el acuerdo de cancelación; no hay devoluciones automáticas.'
        : '')
    );
  }
  async function loadCalendar() {
    const month = $('#calendar-month').value;
    const generation = ++calendarGeneration;
    $('#occupancy').replaceChildren();
    $('#upcoming').replaceChildren();
    if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month) || month > '2099-11') {
      $('#calendar-status').textContent = 'Selecciona un mes válido.';
      return;
    }
    $('#calendar-status').textContent = 'Cargando ocupación y próximas llegadas…';
    const start = month + '-01';
    const next = new Date(start + 'T00:00:00Z');
    next.setUTCMonth(next.getUTCMonth() + 1);
    const end = next.toISOString().slice(0, 10);
    const today = P.today();
    let result, upcoming;
    try {
      result = await api(`calendar?start=${start}&end=${end}`);
      upcoming = await api(`calendar?start=${today}&end=${P.addDays(today, 30)}`);
    } catch (error) {
      if (generation === calendarGeneration)
        $('#calendar-status').textContent =
          'No se ha podido cargar el calendario. Pulsa Actualizar para reintentar.';
      throw error;
    }
    if (generation !== calendarGeneration) return;
    const table = node('table', undefined, 'occupancy-table');
    table.append(
      node(
        'caption',
        new Intl.DateTimeFormat('es-ES', {
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(P.parseDate(start)),
      ),
    );
    const header = node('tr');
    const corner = node('th', 'Alojamiento');
    corner.scope = 'col';
    header.append(corner);
    const days = [];
    for (let day = start; day < end; day = P.addDays(day, 1)) {
      days.push(day);
      const th = node('th', String(Number(day.slice(-2))));
      th.scope = 'col';
      if (day === today) th.className = 'today';
      header.append(th);
    }
    const head = node('thead');
    head.append(header);
    table.append(head);
    const body = node('tbody');
    for (const property of ['casa', 'domo']) {
      const row = node('tr');
      const th = node('th', names[property]);
      th.scope = 'row';
      row.append(th);
      for (const day of days) {
        const item = result.items.find(
          (i) => i.property === property && i.checkin_date <= day && i.checkout_date > day,
        );
        const block = result.blocks.find(
          (i) => i.property === property && i.checkin_date <= day && i.checkout_date > day,
        );
        const cell = node('td');
        const button = node(
          'button',
          item ? (day === item.checkin_date ? '→' : '●') : block ? '×' : '·',
          item ? 'occupied' : block ? 'blocked' : 'free',
        );
        const description = `${names[property]} · ${day} · ${item ? `${ref(item.id)} · ${item.name}` : block ? `Bloqueo: ${block.note}` : 'Noche libre'}`;
        button.setAttribute('aria-label', description);
        button.title = description;
        if (item) button.addEventListener('click', () => run(button, () => openBooking(item.id)));
        else if (block)
          button.addEventListener('click', () => {
            view('blocks');
            notice(description);
          });
        else {
          button.disabled = day < today || day > P.addDays(today, 730);
          button.addEventListener('click', () => {
            const form = $('#manual-form');
            form.elements.property.value = property;
            form.elements.checkin.value = day;
            form.elements.checkout.value = P.addDays(day, 1);
            manualQuote();
            view('manual');
            form.elements.checkin.focus();
          });
        }
        cell.append(button);
        row.append(cell);
      }
      body.append(row);
    }
    table.append(body);
    $('#occupancy').replaceChildren(table);
    $('#calendar-status').textContent =
      `${result.items.filter((i) => i.checkout_date > start).length} estancias confirmadas · ${result.blocks.length} bloqueos.`;
    $('#upcoming').replaceChildren();
    for (const [key, label] of [
      ['checkin_date', 'Llegadas'],
      ['checkout_date', 'Salidas'],
    ]) {
      const section = node('section');
      section.append(node('h3', label));
      const entries = upcoming.items
        .filter((i) => i[key] >= today && i[key] < P.addDays(today, 30))
        .sort((a, b) => a[key].localeCompare(b[key]));
      if (!entries.length) section.append(node('p', 'No hay movimientos previstos.', 'muted'));
      for (const item of entries) {
        const button = node(
          'button',
          `${item[key]} · ${names[item.property]} · ${item.name}`,
          'arrival',
        );
        button.addEventListener('click', () => run(button, () => openBooking(item.id)));
        section.append(button);
      }
      $('#upcoming').append(section);
    }
  }
  async function openBooking(id) {
    const result = await api(`booking-requests/${id}`);
    booking = result.item;
    paymentKey = paymentFingerprint = null;
    $('#booking-dialog-title').textContent = `${ref(id)} · ${booking.name}`;
    $('#booking-finances').textContent = financialText(booking);
    $('#booking-dialog-error').hidden = true;
    const form = $('#edit-form');
    form.replaceChildren();
    const fields = $('#manual-form').cloneNode(true);
    fields.querySelector('[name=source]').closest('label').remove();
    fields.querySelector('#manual-quote').remove();
    fields.querySelector('button').remove();
    fields.querySelector('.muted').remove();
    form.append(...fields.childNodes);
    for (const [name, value] of Object.entries({
      property: booking.property,
      checkin: booking.checkin_date,
      checkout: booking.checkout_date,
      adults: booking.adults,
      children: booking.children,
      pets: booking.pets,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      language: booking.language || 'es',
      message: booking.message || '',
    }))
      form.elements[name].value = value;
    form.elements.checkin.min = booking.checkin_date < P.today() ? booking.checkin_date : P.today();
    form.elements.checkout.removeAttribute('min');
    form.elements.email.required = booking.source === 'website';
    const extra = node('div', undefined, 'grid');
    for (const [name, label, value] of [
      [
        'agreedTotal',
        'Precio acordado (€). Vacío: usar cálculo automático',
        booking.agreed_total_cents === null ? '' : booking.agreed_total_cents / 100,
      ],
      ['depositDue', 'Señal acordada (€)', (booking.deposit_due_cents || 0) / 100],
    ]) {
      const el = node('label', label);
      const input = node('input');
      input.type = 'number';
      input.name = name;
      input.min = '0';
      input.max = '1000000';
      input.step = '0.01';
      input.value = value;
      input.required = name === 'depositDue';
      el.append(input);
      extra.append(el);
    }
    form.append(extra);
    const quote = node('p', '', 'quote');
    quote.id = 'edit-quote';
    form.append(quote);
    const reason = node('label', 'Motivo del cambio (sin datos sensibles)');
    const reasonInput = node('input');
    reasonInput.name = 'reason';
    reasonInput.required = true;
    reasonInput.minLength = 3;
    reasonInput.maxLength = 300;
    reason.append(reasonInput);
    form.append(reason);
    const ack = node(
      'label',
      'He acordado el cambio con el huésped y le comunicaré los nuevos datos.',
      'checkbox',
    );
    const checkbox = node('input');
    checkbox.type = 'checkbox';
    checkbox.required = true;
    checkbox.name = 'ack';
    ack.prepend(checkbox);
    form.append(ack);
    form.append(
      node(
        'p',
        'Se recalcula el presupuesto, pero se conserva cualquier precio acordado explícitamente. No se envía un correo nuevo al editar. La señal no se cobra desde aquí.',
        'muted',
      ),
      node('button', 'Guardar cambios', 'primary'),
    );
    for (const el of form.elements)
      el.disabled = !['new', 'confirmed'].includes(booking.status) || !booking.quote_json;
    editQuote();
    $('#payment-form').reset();
    $('#payment-form [name=date]').removeAttribute('min');
    $('#payment-form [name=date]').max = P.today();
    $('#payment-form [name=date]').value = P.today();
    $('#payment-form [value=payment]').disabled = !['new', 'confirmed'].includes(booking.status);
    $('#payment-form [name=kind]').value = ['new', 'confirmed'].includes(booking.status)
      ? 'payment'
      : 'refund';
    $('#payment-history').replaceChildren();
    for (const p of result.payments)
      $('#payment-history').append(
        node(
          'p',
          `${p.payment_date} · ${p.kind === 'refund' ? 'Devolución' : 'Cobro'} · ${money(p.amount_cents / 100)} · ${{ transfer: 'Transferencia', cash: 'Efectivo', card: 'Tarjeta', other: 'Otro' }[p.method]} · ${p.note}`,
        ),
      );
    if (!result.payments.length)
      $('#payment-history').append(node('p', 'Todavía no hay movimientos.', 'muted'));
    $('#booking-history').replaceChildren();
    for (const change of result.changes) {
      const before = JSON.parse(change.before_json),
        after = JSON.parse(change.after_json);
      $('#booking-history').append(
        node('p', `${change.created_at} UTC · ${change.reason}`),
        node(
          'p',
          `${names[before.property]} ${before.checkin} / ${before.checkout} (${money(before.totalCents / 100)}) → ${names[after.property]} ${after.checkin} / ${after.checkout} (${money(after.totalCents / 100)})`,
          'muted',
        ),
      );
    }
    for (const event of result.decisions)
      $('#booking-history').append(
        node('p', `${event.created_at} UTC · ${labels[event.status]}`, 'muted'),
      );
    if (!$('#booking-dialog').open) $('#booking-dialog').showModal();
  }
  function editData() {
    const data = Object.fromEntries(new FormData($('#edit-form')));
    for (const field of ['adults', 'children', 'pets']) data[field] = Number(data[field]);
    data.agreedTotalCents = data.agreedTotal === '' ? null : cents(data.agreedTotal);
    data.depositDueCents = cents(data.depositDue);
    data.revision = booking.revision;
    delete data.agreedTotal;
    delete data.depositDue;
    delete data.ack;
    return data;
  }
  function editQuote() {
    if (!booking) return;
    try {
      const q = P.quote(editData());
      $('#edit-quote').textContent =
        `Tarifa calculada: ${money(q.total)} · ${q.nights} noches · limpieza incluida. No modifica los pagos registrados.`;
    } catch {
      $('#edit-quote').textContent = 'Revisa fechas y capacidad para calcular el precio.';
    }
  }
  async function modalRun(button, task) {
    if (button.disabled) return;
    button.disabled = true;
    $('#booking-dialog-error').hidden = true;
    try {
      await task();
    } catch (error) {
      $('#booking-dialog-error').textContent =
        errors[error.message] ||
        'No se pudo verificar el resultado. Cierra y vuelve a abrir la ficha para comprobarlo antes de repetir.';
      $('#booking-dialog-error').hidden = false;
    } finally {
      button.disabled = false;
    }
  }
  $('#edit-form').addEventListener('input', editQuote);
  $('#edit-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const button = $('#edit-form button');
    modalRun(button, async () => {
      const id = booking.id;
      await api(`booking-requests/${id}`, editData(), 'PATCH');
      await load();
      await openBooking(id);
      $('#edit-details').open = false;
      notice('Estancia actualizada. Comunica al huésped los cambios acordados.');
    });
  });
  $('#payment-form').addEventListener('submit', (event) => {
    event.preventDefault();
    modalRun($('#payment-form button'), async () => {
      const data = Object.fromEntries(new FormData($('#payment-form')));
      data.amountCents = cents(data.amount);
      delete data.amount;
      const fingerprint = JSON.stringify({ id: booking.id, ...data });
      if (fingerprint !== paymentFingerprint) {
        paymentFingerprint = fingerprint;
        paymentKey = crypto.randomUUID();
      }
      data.revision = booking.revision;
      const id = booking.id;
      await api(`booking-requests/${id}/payments`, data, 'POST', { 'Idempotency-Key': paymentKey });
      await load();
      await openBooking(id);
      notice('Movimiento registrado. No se ha realizado ningún cobro ni devolución desde la web.');
    });
  });
  $('#calendar-month').value = P.today().slice(0, 7);
  $('#calendar-month').addEventListener('change', () => run($('#calendar-month'), loadCalendar));
  async function signedIn(result) {
    csrf = result.csrf;
    emailEnabled = result.emailEnabled;
    clearTimeout(sessionTimer);
    sessionTimer = setTimeout(
      () => {
        signedOut();
        notice('La sesión ha caducado. Vuelve a entrar.');
      },
      Math.max(0, result.expires - Date.now()),
    );
    $('#login-form').reset();
    $('#login-view').hidden = true;
    $('#dashboard').hidden = false;
    $('#logout').hidden = false;
    $('#mail-warning').hidden = emailEnabled;
    if (/^#reserva=\d+$/.test(location.hash)) $('#filter').value = 'all';
    await load();
    if (/^#reserva=\d+$/.test(location.hash)) {
      const id = Number(location.hash.slice(9));
      if (!items.some((item) => item.id === id)) {
        const result = await api(`booking-requests/${id}`);
        items.push(result.item);
        render();
      }
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'center' });
    }
  }
  $('#login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    run($('#login-form button'), async () => {
      const result = await api('login', { password: $('#login-form [name=password]').value });
      await signedIn(result);
    });
  });
  $('#logout').addEventListener('click', () =>
    run($('#logout'), async () => {
      await api('logout', {});
      signedOut();
    }),
  );
  $('#refresh').addEventListener('click', () => run($('#refresh'), () => load()));
  $('#more').addEventListener('click', () => run($('#more'), () => load(true)));
  $('#filter').addEventListener('change', render);
  document
    .querySelectorAll('[data-view]')
    .forEach((button) => button.addEventListener('click', () => view(button.dataset.view)));
  $('#manual-form').addEventListener('input', manualQuote);
  $('#manual-form').addEventListener('submit', (event) => {
    event.preventDefault();
    run($('#manual-form button'), async () => {
      const data = manualData();
      const fingerprint = JSON.stringify(data);
      if (fingerprint !== manualFingerprint) {
        manualKey = crypto.randomUUID();
        manualFingerprint = fingerprint;
      }
      const result = await api('booking-requests', data, 'POST', { 'Idempotency-Key': manualKey });
      $('#manual-form').reset();
      manualKey = manualFingerprint = null;
      manualQuote();
      $('#filter').value = 'new';
      view('requests');
      await load();
      notice(`${ref(result.item.id)} guardada. Ahora puedes aceptarla.`);
    });
  });
  $('#block-form').addEventListener('submit', (event) => {
    event.preventDefault();
    run($('#block-form button'), async () => {
      await api('blocks', Object.fromEntries(new FormData($('#block-form'))));
      $('#block-form').reset();
      await load();
      notice('Fechas bloqueadas.');
    });
  });
  $('#decision-back').addEventListener('click', () => $('#decision-dialog').close());
  $('#decision-confirm').addEventListener('click', () =>
    run($('#decision-confirm'), async () => {
      if (!decision) return;
      const { item, status } = decision;
      const notifyGuest = $('#notify-guest').checked;
      await api(`booking-requests/${item.id}/decision`, {
        status,
        revision: item.revision,
        notifyGuest,
      });
      $('#decision-dialog').close();
      decision = null;
      await load();
      notice(
        `${ref(item.id)}: ${labels[status]}. ${notifyGuest ? 'El correo queda en cola para enviarse automáticamente.' : 'Recuerda avisar personalmente al huésped.'}`,
      );
    }),
  );
  $('#export').addEventListener('click', () =>
    run($('#export'), async () => {
      const response = await fetch(new URL('../api/admin/booking-requests.csv', location.href), {
        credentials: 'same-origin',
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      if (response.status === 401) {
        signedOut();
        throw new Error('unauthorized');
      }
      if (!response.ok || !response.headers.get('content-type')?.includes('text/csv'))
        throw new Error('backend');
      const url = URL.createObjectURL(await response.blob());
      const a = node('a');
      a.href = url;
      a.download = 'uxarbeiti-reservas.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }),
  );
  for (const field of document.querySelectorAll('input[type=date]')) field.min = P.today();
  api('session')
    .then(signedIn)
    .catch((error) => {
      signedOut();
      if (error.message !== 'unauthorized')
        notice(
          'El panel necesita el backend: no funciona en GitHub Pages ni en una vista estática.',
        );
    });
})();
