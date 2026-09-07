'use strict';
const nodemailer = require('nodemailer');
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
const money = (value) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
const date = (value) =>
  new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00Z`),
  );

function buildEmail(request, config) {
  const q = JSON.parse(request.quote_json);
  const property = request.property === 'domo' ? 'Domo Gorbeia' : 'Urkiola Etxea';
  const reference = `UX-${String(request.id).padStart(6, '0')}`;
  const details = [
    ['Referencia', reference],
    ['Alojamiento', property],
    ['Llegada', date(request.checkin_date)],
    ['Salida', date(request.checkout_date)],
    ['Noches', q.nights],
    ['Adultos', q.adults],
    ['Niños (cuna)', q.children],
    ['Mascotas', q.pets],
  ];
  const guest = [
    ['Nombre', request.name],
    ['Correo', request.email],
    ['Teléfono', request.phone],
    [
      'Idioma',
      { es: 'Español', en: 'Inglés', eu: 'Euskera' }[request.language] || request.language,
    ],
  ];
  const prices = [];
  if (q.lowNights)
    prices.push([
      `${q.lowNights} noches de temporada baja × ${money(q.lowRate)}`,
      money(q.lowNights * q.lowRate),
    ]);
  if (q.summerNights)
    prices.push([
      `${q.summerNights} noches de verano × ${money(q.summerRate)}`,
      money(q.summerNights * q.summerRate),
    ]);
  if (q.adultsTotal)
    prices.push([
      `${q.adults - 1} adultos adicionales × 10 € × ${q.nights} noches`,
      money(q.adultsTotal),
    ]);
  if (q.childrenTotal)
    prices.push([`${q.children} niños × 5 € × ${q.nights} noches`, money(q.childrenTotal)]);
  if (q.petsTotal)
    prices.push([`${q.pets} mascotas × 10 € × ${q.nights} noches`, money(q.petsTotal)]);
  prices.push(['Limpieza final (una vez)', money(q.cleaning)], ['TOTAL ESTIMADO', money(q.total)]);
  const table = (rows) =>
    `<table role="presentation" style="width:100%;border-collapse:collapse">${rows.map(([label, value]) => `<tr><td style="padding:10px 0;border-bottom:1px solid #dee2d7;color:#596559;font-size:13px;width:55%;vertical-align:top">${escape(label)}</td><td style="padding:10px 0 10px;border-bottom:1px solid #dee2d7;font-size:14px;font-weight:bold;vertical-align:top;word-break:break-word">${escape(value)}</td></tr>`).join('')}</table>`;
  return {
    from: config.from,
    to: config.to,
    replyTo: { address: request.email, name: request.name },
    messageId: `<uxarbeiti-request-${request.id}@${config.messageDomain || 'uxarbeiti.local'}>`,
    subject: `[UXARBEITI ${reference}] ${property} · ${request.checkin_date} · ${q.nights} noches`,
    text: `UXARBEITI BASERRIA\nNUEVA SOLICITUD DE ESTANCIA\nPendiente de confirmar; no se ha realizado ningún cobro.\n\nESTANCIA\n${details.map((row) => row.join(': ')).join('\n')}\n\nCONTACTO\n${guest.map((row) => row.join(': ')).join('\n')}\n\nDESGLOSE\n${prices.map((row) => row.join(': ')).join('\n')}\n\nMENSAJE\n${request.message || 'Sin mensaje adicional.'}\n\nSIGUIENTE PASO\nComprueba disponibilidad y responde a este correo para contactar con el huésped. La estancia no está confirmada automáticamente.`,
    html: `<!doctype html><html lang="es"><body style="margin:0;background:#f4f3ec;color:#243e32;font-family:Verdana,sans-serif"><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:24px 12px"><table role="presentation" style="max-width:620px;width:100%;margin:auto;background:#fff;border-collapse:collapse"><tr><td style="padding:30px;background:#243e32;color:#f8f7f1"><p style="font-size:11px;letter-spacing:3px">UXARBEITI BASERRIA</p><h1 style="font:normal 28px Georgia,serif">Nueva solicitud de estancia</h1><p style="font-size:12px">${reference} · Pendiente de confirmar</p></td></tr><tr><td style="padding:28px"><p style="font-size:13px;line-height:1.8">Se ha guardado una nueva solicitud. <strong>No es una reserva confirmada y no se ha realizado ningún cobro.</strong></p><h2 style="font:normal 23px Georgia,serif">La estancia</h2>${table(details)}<h2 style="font:normal 23px Georgia,serif;margin-top:28px">Contacto del huésped</h2>${table(guest)}<h2 style="font:normal 23px Georgia,serif;margin-top:28px">Desglose de precios</h2>${table(prices)}<h2 style="font:normal 23px Georgia,serif;margin-top:28px">Mensaje</h2><p style="white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.8">${escape(request.message || 'Sin mensaje adicional.')}</p><p style="padding:18px;background:#eeefe5;font-size:13px;line-height:1.8">Comprueba la disponibilidad y <strong>responde a este correo</strong> para contactar con el huésped. El alojamiento se confirma personalmente.</p></td></tr></table></td></tr></table></body></html>`,
  };
}

function createNotifier(env = process.env) {
  if (env.SMTP_ENABLED !== 'true') return { enabled: false };
  const config = {
    from: env.SMTP_FROM,
    to: env.BOOKING_NOTIFICATION_TO || 'pablosainz1998@gmail.com',
    messageDomain: env.SMTP_MESSAGE_DOMAIN || 'uxarbeiti.local',
  };
  if (!env.SMTP_HOST || !env.SMTP_FROM || !env.SMTP_USER || !env.SMTP_PASS)
    throw new Error('SMTP_ENABLED requires SMTP_HOST, SMTP_FROM, SMTP_USER and SMTP_PASS');
  if (!/^[a-z0-9.-]+$/i.test(config.messageDomain)) throw new Error('Invalid SMTP_MESSAGE_DOMAIN');
  const port = Number(env.SMTP_PORT || 587);
  if (![465, 587, 2525].includes(port)) throw new Error('SMTP_PORT must be 465, 587 or 2525');
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return {
    enabled: true,
    send: (request) => transport.sendMail(buildEmail(request, config)),
    close: () => transport.close(),
  };
}

function startOutbox(db, notifier, logger = console) {
  if (!notifier.enabled) return { kick() {}, async stop() {} };
  let pending = null;
  let stopped = false;
  function kick() {
    if (pending || stopped) return;
    pending = (async () => {
      for (let i = 0; i < 10 && !stopped; i++) {
        const request = db.claimEmail();
        if (!request) break;
        try {
          await notifier.send(request);
          db.markEmailSent(request.id);
        } catch (error) {
          const code = /^[A-Z0-9_]+$/.test(error.code || '') ? error.code : 'SMTP_ERROR';
          db.retryEmail(request.id, request.attempt, code);
          logger.error(`Email pending for request ${request.id} (${code}). Will retry.`);
        }
      }
    })()
      .catch(() => logger.error('Could not process email outbox. Will retry.'))
      .finally(() => {
        pending = null;
      });
  }
  const timer = setInterval(kick, 15000);
  timer.unref();
  kick();
  return {
    kick,
    async stop() {
      stopped = true;
      clearInterval(timer);
      if (pending) await pending;
      notifier.close?.();
    },
  };
}

module.exports = { buildEmail, createNotifier, startOutbox };
