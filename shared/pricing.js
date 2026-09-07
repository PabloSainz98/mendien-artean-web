(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UxarbeitiPricing = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DAY = 86400000;
  const RATES = Object.freeze({
    low: 57,
    summer: 75,
    dome: 100,
    adult: 10,
    child: 5,
    pet: 10,
    cleaning: 40,
  });
  const CAPACITY = Object.freeze({ casa: 4, domo: 3 });

  function parseDate(value) {
    if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
      ? date
      : null;
  }

  function today() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  function addDays(value, days) {
    const date = parseDate(value);
    return date ? new Date(date.getTime() + days * DAY).toISOString().slice(0, 10) : '';
  }

  function quote(input) {
    const { property, checkin, checkout, adults, children, pets } = input;
    if (!Object.hasOwn(CAPACITY, property)) throw new Error('property');
    if (
      !Number.isInteger(adults) ||
      adults < 1 ||
      !Number.isInteger(children) ||
      children < 0 ||
      adults + children > CAPACITY[property]
    )
      throw new Error('capacity');
    if (!Number.isInteger(pets) || pets < 0 || pets > 4) throw new Error('pets');
    const start = parseDate(checkin);
    const end = parseDate(checkout);
    if (!start || !end) throw new Error('dates');
    const nights = (end - start) / DAY;
    if (nights < 1 || nights > 60) throw new Error('nights');
    let lowNights = 0;
    let summerNights = 0;
    // Charge the season of each occupied night, never the checkout date.
    for (let time = start.getTime(); time < end.getTime(); time += DAY) {
      const month = new Date(time).getUTCMonth();
      if (month >= 5 && month <= 8) summerNights++;
      else lowNights++;
    }
    const surcharge = property === 'domo' ? RATES.dome : 0;
    const lowRate = RATES.low + surcharge;
    const summerRate = RATES.summer + surcharge;
    const baseTotal = lowNights * lowRate + summerNights * summerRate;
    const adultsTotal = (adults - 1) * RATES.adult * nights;
    const childrenTotal = children * RATES.child * nights;
    const petsTotal = pets * RATES.pet * nights;
    return {
      property,
      nights,
      adults,
      children,
      pets,
      lowNights,
      summerNights,
      lowRate,
      summerRate,
      baseTotal,
      adultsTotal,
      childrenTotal,
      petsTotal,
      cleaning: RATES.cleaning,
      total: baseTotal + adultsTotal + childrenTotal + petsTotal + RATES.cleaning,
    };
  }
  return { RATES, CAPACITY, parseDate, today, addDays, quote };
});
