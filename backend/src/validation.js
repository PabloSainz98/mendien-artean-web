const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{6,30}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PROPERTY_VALUES = new Set(['casa', 'domo']);

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseDateOnly(value) {
  if (!ISO_DATE_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseBinaryFlag(value) {
  if (value === true || value === 'true') return 1;
  if (value === false || value === 'false') return 0;
  const numericValue = Number(value);
  return numericValue > 0 ? 1 : 0;
}

function validateBookingPayload(payload) {
  const errors = [];

  const name = normalizeString(payload?.name);
  const email = normalizeString(payload?.email).toLowerCase();
  const phone = normalizeString(payload?.phone);
  const property = normalizeString(payload?.property).toLowerCase();
  const checkin = normalizeString(payload?.checkin);
  const checkout = normalizeString(payload?.checkout);
  const message = normalizeString(payload?.message);
  const honeypot = normalizeString(payload?.company);

  const rawGuests = Number(payload?.guests);
  const guests = Number.isInteger(rawGuests) ? rawGuests : NaN;
  const pets = parseBinaryFlag(payload?.pets);
  const children = parseBinaryFlag(payload?.children);

  if (name.length < 2 || name.length > 120) {
    errors.push('name');
  }

  if (!EMAIL_RE.test(email) || email.length > 200) {
    errors.push('email');
  }

  if (!PHONE_RE.test(phone)) {
    errors.push('phone');
  }

  if (!PROPERTY_VALUES.has(property)) {
    errors.push('property');
  }

  if (!Number.isInteger(guests) || guests < 1 || guests > 4) {
    errors.push('guests');
  }

  const checkinDate = parseDateOnly(checkin);
  const checkoutDate = parseDateOnly(checkout);

  if (!checkinDate) {
    errors.push('checkin');
  }

  if (!checkoutDate) {
    errors.push('checkout');
  }

  if (checkinDate && checkoutDate && checkoutDate <= checkinDate) {
    errors.push('dateRange');
  }

  if (message.length > 1500) {
    errors.push('message');
  }

  return {
    valid: errors.length === 0,
    errors,
    values: {
      name,
      email,
      phone,
      property,
      guests,
      pets,
      children,
      checkin,
      checkout,
      message,
      company: honeypot
    }
  };
}

module.exports = {
  validateBookingPayload
};
