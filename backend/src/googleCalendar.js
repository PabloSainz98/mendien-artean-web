const { google } = require('googleapis');

function parseBoolean(value) {
  return String(value || '').toLowerCase() === 'true';
}

function createGoogleCalendarIntegration() {
  const enabled = parseBoolean(process.env.GOOGLE_CALENDAR_ENABLED);
  const calendarId = process.env.GOOGLE_CALENDAR_ID || '';
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  const configured = Boolean(enabled && calendarId && clientEmail && privateKey);

  if (!configured) {
    return {
      enabled: false,
      async createBookingEvent() {
        return null;
      }
    };
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar']
  });

  const calendar = google.calendar({ version: 'v3', auth });

  return {
    enabled: true,
    async createBookingEvent(booking) {
      const summary = `Nueva reserva: ${booking.name} (${booking.guests} huésped/es)`;
      const description = [
        `Solicitud ID: ${booking.id}`,
        `Email: ${booking.email}`,
        `Teléfono: ${booking.phone}`,
        `Check-in: ${booking.checkin}`,
        `Check-out: ${booking.checkout}`,
        booking.message ? `Mensaje: ${booking.message}` : ''
      ]
        .filter(Boolean)
        .join('\n');

      const event = {
        summary,
        description,
        start: { date: booking.checkin },
        end: { date: booking.checkout }
      };

      const result = await calendar.events.insert({
        calendarId,
        requestBody: event,
        sendUpdates: 'none'
      });

      return result.data.id || null;
    }
  };
}

module.exports = {
  createGoogleCalendarIntegration
};
