'use strict';
const pricing = require('../../shared/pricing');
const normalized = (value) => (typeof value === 'string' ? value.trim() : '');

function validateBookingPayload(body, today = pricing.today()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'form' };
  if (normalized(body.website)) return { ok: false, spam: true };
  const data = {
    property: body.property,
    checkin: body.checkin,
    checkout: body.checkout,
    adults: body.adults,
    children: body.children,
    pets: body.pets,
    name: normalized(body.name),
    email: normalized(body.email),
    phone: normalized(body.phone),
    message: normalized(body.message),
    language: ['es', 'en', 'eu'].includes(body.language) ? body.language : 'es',
    consentVersion: '2026-09-07',
  };
  if (
    body.consent !== true ||
    data.name.length < 2 ||
    data.name.length > 120 ||
    /[\x00-\x1f\x7f]/.test(data.name)
  )
    return { ok: false, error: 'form' };
  if (
    data.email.length > 200 ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email) ||
    /[\x00-\x1f\x7f]/.test(data.email)
  )
    return { ok: false, error: 'form' };
  if (
    !/^[+\d][\d ()+.-]{5,29}$/.test(data.phone) ||
    data.message.length > 1500 ||
    /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(data.message)
  )
    return { ok: false, error: 'form' };
  try {
    data.quote = pricing.quote(data);
  } catch (error) {
    return { ok: false, error: error.message };
  }
  if (data.checkin < today || data.checkin > pricing.addDays(today, 730))
    return { ok: false, error: 'past' };
  if (!Number.isFinite(body.expectedTotal) || body.expectedTotal !== data.quote.total)
    return { ok: false, error: 'changed' };
  return { ok: true, data };
}
module.exports = { validateBookingPayload };
