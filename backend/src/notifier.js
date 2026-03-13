let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch {
  nodemailer = null;
}

function asBoolean(value, defaultValue = false) {
  if (value == null || value === '') return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function getPropertyName(property) {
  return property === 'domo' ? 'Domo Gorbeia' : 'Urkiola Etxea';
}

function formatCurrency(value) {
  const amount = Number.parseInt(value, 10) || 0;
  return `${amount} EUR`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createBookingNotifier(env = process.env) {
  const host = (env.SMTP_HOST || '').trim();
  const port = toInt(env.SMTP_PORT, 587);
  const secure = asBoolean(env.SMTP_SECURE, false);
  const user = (env.SMTP_USER || '').trim();
  const pass = env.SMTP_PASS || '';
  const from = (env.SMTP_FROM || '').trim();
  const to = (env.BOOKING_NOTIFICATION_TO || '').trim();
  const enabled = asBoolean(env.SMTP_ENABLED, false);

  if (!enabled) {
    return {
      enabled: false,
      async sendBookingNotification() {
        return { sent: false, skipped: true, reason: 'SMTP disabled' };
      }
    };
  }

  if (!nodemailer) {
    return {
      enabled: false,
      async sendBookingNotification() {
        return { sent: false, skipped: true, reason: 'nodemailer not installed' };
      }
    };
  }

  if (!host || !from || !to) {
    return {
      enabled: false,
      async sendBookingNotification() {
        return { sent: false, skipped: true, reason: 'SMTP config incomplete' };
      }
    };
  }

  const transportConfig = {
    host,
    port,
    secure
  };

  if (user && pass) {
    transportConfig.auth = { user, pass };
  }

  const transporter = nodemailer.createTransport(transportConfig);

  return {
    enabled: true,
    async sendBookingNotification(booking) {
      const propertyName = getPropertyName(booking.property);
      const seasonLabel = booking.season === 'low' ? 'Temporada baja' : 'Verano';
      const petsLabel = Number(booking.pets) > 0 ? 'Si' : 'No';
      const childrenLabel = Number(booking.children) > 0 ? 'Si' : 'No';
      const message = booking.message || '(sin mensaje)';

      const subject = `Nueva reserva web #${booking.id} - ${propertyName} - ${booking.checkin} a ${booking.checkout}`;
      const text = [
        'NUEVA SOLICITUD DE RESERVA | UXARBEITI BASERRIA',
        '=========================================',
        `ID:              ${booking.id}`,
        `Fecha envio:     ${booking.createdAt}`,
        `Alojamiento:     ${propertyName}`,
        `Temporada:       ${seasonLabel}`,
        `Entrada:         ${booking.checkin}`,
        `Salida:          ${booking.checkout}`,
        `Noches:          ${booking.nights}`,
        '',
        'CLIENTE',
        '-----------------------------------------',
        `Nombre:          ${booking.name}`,
        `Email cliente:   ${booking.email}`,
        `Telefono:        ${booking.phone}`,
        `Personas:        ${booking.guests}`,
        `Mascotas:        ${petsLabel}`,
        `Ninos:           ${childrenLabel}`,
        '',
        'PRECIO ESTIMADO',
        '-----------------------------------------',
        `Tarifa base:     ${formatCurrency(booking.baseRate)} x ${booking.nights} = ${formatCurrency(booking.baseTotal)}`,
        `Extras personas: ${formatCurrency(booking.extraPeopleTotal)}`,
        `Mascotas:        ${formatCurrency(booking.petsTotal)}`,
        `Ninos:           ${formatCurrency(booking.childrenTotal)}`,
        `Limpieza:        ${formatCurrency(booking.cleaningFee)}`,
        `TOTAL EST.:      ${formatCurrency(booking.totalEstimate)}`,
        '',
        'MENSAJE CLIENTE',
        '-----------------------------------------',
        message
      ].join('\n');

      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.45;color:#1f2937">
          <h2 style="margin:0 0 12px;color:#1f2937">Nueva solicitud de reserva</h2>
          <p style="margin:0 0 18px;color:#4b5563">Uxarbeiti Baserria · ID #${escapeHtml(booking.id)} · ${escapeHtml(booking.createdAt)}</p>

          <table style="border-collapse:collapse;width:100%;margin:0 0 18px">
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600">Alojamiento</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(propertyName)}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600">Temporada</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(seasonLabel)}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600">Entrada</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(booking.checkin)}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600">Salida</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(booking.checkout)}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600">Noches</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(booking.nights)}</td></tr>
          </table>

          <h3 style="margin:0 0 8px">Datos del cliente</h3>
          <table style="border-collapse:collapse;width:100%;margin:0 0 18px">
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600">Nombre</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(booking.name)}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600">Email</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(booking.email)}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600">Telefono</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(booking.phone)}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600">Personas</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(booking.guests)}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600">Mascotas</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(petsLabel)}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:600">Ninos</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${escapeHtml(childrenLabel)}</td></tr>
          </table>

          <h3 style="margin:0 0 8px">Desglose de precio estimado</h3>
          <table style="border-collapse:collapse;width:100%;margin:0 0 18px">
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb">Tarifa base</td><td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:right">${escapeHtml(formatCurrency(booking.baseRate))} x ${escapeHtml(booking.nights)} = ${escapeHtml(formatCurrency(booking.baseTotal))}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb">Extras personas</td><td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:right">${escapeHtml(formatCurrency(booking.extraPeopleTotal))}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb">Mascotas</td><td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:right">${escapeHtml(formatCurrency(booking.petsTotal))}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb">Ninos</td><td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:right">${escapeHtml(formatCurrency(booking.childrenTotal))}</td></tr>
            <tr><td style="padding:6px 10px;border:1px solid #e5e7eb">Limpieza</td><td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:right">${escapeHtml(formatCurrency(booking.cleaningFee))}</td></tr>
            <tr><td style="padding:8px 10px;border:1px solid #d1d5db;font-weight:700">TOTAL EST.</td><td style="padding:8px 10px;border:1px solid #d1d5db;text-align:right;font-weight:700">${escapeHtml(formatCurrency(booking.totalEstimate))}</td></tr>
          </table>

          <h3 style="margin:0 0 8px">Mensaje del cliente</h3>
          <div style="padding:10px;border:1px solid #e5e7eb;border-radius:6px;background:#f9fafb;white-space:pre-wrap">${escapeHtml(message)}</div>
        </div>
      `;

      const result = await transporter.sendMail({
        from,
        to,
        replyTo: booking.email,
        subject,
        text,
        html
      });

      return { sent: true, messageId: result.messageId };
    }
  };
}

module.exports = {
  createBookingNotifier
};
