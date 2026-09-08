'use strict';
const pricing = require('../../shared/pricing');
const { validateBookingPayload } = require('./validation');
const MAX_CENTS = 100000000;
const validMoney = (n) => Number.isSafeInteger(n) && n >= 0 && n <= MAX_CENTS;

function validateEdit(input, item) {
  if (
    !input ||
    !Number.isSafeInteger(input.revision) ||
    input.revision < 0 ||
    typeof input.reason !== 'string' ||
    input.reason.trim().length < 3 ||
    input.reason.length > 300
  )
    return { ok: false, error: 'form' };
  let quote;
  try {
    quote = pricing.quote(input);
  } catch {
    return { ok: false, error: 'form' };
  }
  // Existing/in-progress stays remain editable without permitting a new backdated arrival.
  const result = validateBookingPayload(
    {
      ...input,
      email: input.email || 'manual@example.test',
      consent: true,
      expectedTotal: quote.total,
    },
    item.checkin_date < pricing.today() ? item.checkin_date : pricing.today(),
  );
  if (!result.ok) return result;
  if (!input.email && item.source === 'website') return { ok: false, error: 'form' };
  result.data.email = input.email ? result.data.email : '';
  if (input.agreedTotalCents !== null && !validMoney(input.agreedTotalCents))
    return { ok: false, error: 'form' };
  if (
    !validMoney(input.depositDueCents) ||
    input.depositDueCents > (input.agreedTotalCents ?? quote.total * 100)
  )
    return { ok: false, error: 'form' };
  result.data.agreedTotalCents = input.agreedTotalCents;
  result.data.depositDueCents = input.depositDueCents;
  result.data.reason = input.reason.trim();
  return result;
}
function validatePayment(input) {
  return Boolean(
    input &&
    Number.isSafeInteger(input.revision) &&
    input.revision >= 0 &&
    ['payment', 'refund'].includes(input.kind) &&
    validMoney(input.amountCents) &&
    input.amountCents > 0 &&
    ['transfer', 'cash', 'card', 'other'].includes(input.method) &&
    pricing.parseDate(input.date) &&
    input.date <= pricing.today() &&
    typeof input.note === 'string' &&
    input.note.length <= 300 &&
    !/[\x00-\x1f\x7f]/.test(input.note),
  );
}
function financials(item) {
  const quote = item.quote_json ? JSON.parse(item.quote_json) : null;
  const totalCents = item.agreed_total_cents ?? (quote ? Math.round(quote.total * 100) : null);
  const paidCents = item.paid_cents || 0;
  return {
    totalCents,
    paidCents,
    balanceCents: totalCents === null ? null : totalCents - paidCents,
    depositDueCents: item.deposit_due_cents || 0,
    depositRemainingCents: Math.max(0, (item.deposit_due_cents || 0) - paidCents),
  };
}
module.exports = { validateEdit, validatePayment, financials };
