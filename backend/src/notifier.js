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

      const subject = `Nueva reserva web #${booking.id} - ${propertyName} - ${booking.checkin} a ${booking.checkout}`;
      const text = [
        'NUEVA SOLICITUD DE RESERVA - MENDIEN ARTEAN',
        '-----------------------------------------',
        `ID:              ${booking.id}`,
        `Alojamiento:     ${propertyName}`,
        `Nombre:          ${booking.name}`,
        `Email cliente:   ${booking.email}`,
        `Telefono:        ${booking.phone}`,
        `Personas:        ${booking.guests}`,
        `Noches:          ${booking.nights}`,
        `Mascotas:        ${petsLabel}`,
        `Ninos:           ${childrenLabel}`,
        `Entrada:         ${booking.checkin}`,
        `Salida:          ${booking.checkout}`,
        '-----------------------------------------',
        `Temporada:       ${seasonLabel}`,
        `Tarifa base:     ${booking.baseRate}€ x ${booking.nights} = ${booking.baseTotal}€`,
        `Extras personas: ${booking.extraPeopleTotal}€`,
        `Mascotas:        ${booking.petsTotal}€`,
        `Ninos:           ${booking.childrenTotal}€`,
        `Limpieza:        ${booking.cleaningFee}€`,
        `TOTAL EST.:      ${booking.totalEstimate}€`,
        '-----------------------------------------',
        `Mensaje cliente: ${booking.message || '(ninguno)'}`,
        `Fecha envio:     ${booking.createdAt}`,
      ].join('\n');

      const result = await transporter.sendMail({
        from,
        to,
        replyTo: booking.email,
        subject,
        text
      });

      return { sent: true, messageId: result.messageId };
    }
  };
}

module.exports = {
  createBookingNotifier
};
