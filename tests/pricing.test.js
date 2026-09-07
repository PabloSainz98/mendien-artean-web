'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const P = require('../shared/pricing');
const { validateBookingPayload } = require('../backend/src/validation');
const base = {
  property: 'casa',
  checkin: '2027-01-12',
  checkout: '2027-01-13',
  adults: 2,
  children: 1,
  pets: 1,
};

test('today is an ISO date regardless of browser date ordering', () => {
  assert.match(P.today(), /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(P.parseDate(P.today()));
});

test('user example: house 82/night plus 40 cleaning = 122', () => {
  const q = P.quote(base);
  assert.equal(q.total, 122);
  assert.equal(q.baseTotal, 57);
  assert.equal(q.adultsTotal, 10);
  assert.equal(q.childrenTotal, 5);
  assert.equal(q.petsTotal, 10);
  assert.equal(q.cleaning, 40);
});
test('dome adds 100 per night, not per stay', () => {
  const input = { ...base, checkout: '2027-01-15' };
  assert.equal(P.quote({ ...input, property: 'domo' }).total - P.quote(input).total, 300);
});
test('summer base is 75 for house and 175 for dome', () => {
  for (const property of ['casa', 'domo'])
    assert.equal(
      P.quote({ ...base, property, checkin: '2027-07-12', checkout: '2027-07-13' }).summerRate,
      property === 'casa' ? 75 : 175,
    );
});
test('mixed season prices every occupied night independently', () => {
  const q = P.quote({
    ...base,
    checkin: '2027-05-31',
    checkout: '2027-06-02',
    adults: 1,
    children: 0,
    pets: 0,
  });
  assert.equal(q.lowNights, 1);
  assert.equal(q.summerNights, 1);
  assert.equal(q.total, 57 + 75 + 40);
  const autumn = P.quote({ ...base, checkin: '2027-09-30', checkout: '2027-10-02' });
  assert.equal(autumn.lowNights, 1);
  assert.equal(autumn.summerNights, 1);
});
test('checkout date is not charged', () =>
  assert.equal(
    P.quote({ ...base, checkin: '2027-05-30', checkout: '2027-06-01' }).summerNights,
    0,
  ));
test('DST changes do not change night count', () => {
  assert.equal(P.quote({ ...base, checkin: '2027-03-27', checkout: '2027-03-29' }).nights, 2);
  assert.equal(P.quote({ ...base, checkin: '2027-10-30', checkout: '2027-11-01' }).nights, 2);
});
test('children and pets are counted, not converted to booleans', () => {
  const q = P.quote({ ...base, adults: 1, children: 2, pets: 2 });
  assert.equal(q.childrenTotal, 10);
  assert.equal(q.petsTotal, 20);
  assert.equal(q.total, 127);
});
test('invalid dates, capacity, counts and stay length are rejected', () => {
  for (const value of ['2027-02-30', '2027-13-01', '2027-02-29', 'not-a-date'])
    assert.equal(P.parseDate(value), null);
  assert.ok(P.parseDate('2028-02-29'));
  for (const change of [
    { property: 'other' },
    { adults: 4, children: 1 },
    { property: 'domo', adults: 3, children: 1 },
    { pets: -1 },
    { adults: 1.5 },
    { children: '1' },
    { pets: 5 },
    { checkout: base.checkin },
    { checkout: '2028-01-13' },
  ])
    assert.throws(() => P.quote({ ...base, ...change }));
});
const validBody = () => ({
  ...base,
  name: 'Persona Prueba',
  email: 'guest@example.test',
  phone: '+34 600 000 000',
  message: '',
  consent: true,
  expectedTotal: 122,
});
test('server validation accepts the complete request and trims contact fields', () => {
  const result = validateBookingPayload({ ...validBody(), name: ' Persona Prueba ' }, '2026-09-07');
  assert.equal(result.ok, true);
  assert.equal(result.data.name, 'Persona Prueba');
  assert.equal(result.data.quote.total, 122);
});
test('server rejects forged prices, past dates, header injection and missing consent', () => {
  for (const change of [
    { expectedTotal: 1 },
    { consent: false },
    { email: 'guest@example.test\r\nBcc: attacker@example.test' },
    { name: 'a\rb' },
    { checkin: '2020-01-01', checkout: '2020-01-02' },
    { checkin: '2030-01-01', checkout: '2030-01-02' },
    { message: 'x'.repeat(1501) },
    { adults: '2' },
  ])
    assert.equal(validateBookingPayload({ ...validBody(), ...change }, '2026-09-07').ok, false);
  assert.equal(validateBookingPayload([]).ok, false);
  assert.equal(validateBookingPayload(null).ok, false);
  assert.equal(validateBookingPayload({ ...validBody(), website: 'bot' }).spam, true);
});
