const LOW_SEASON_BASE_RATE = 57;
const SUMMER_BASE_RATE = 75;
const DOMO_BASE_SURCHARGE = 100;
const EXTRA_PERSON_RATE = 10;
const PET_RATE = 10;
const CHILD_RATE = 5;
const CLEANING_FEE = 40;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value) {
  if (typeof value !== 'string') return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getNights(checkin, checkout) {
  const checkinDate = parseDateOnly(checkin);
  const checkoutDate = parseDateOnly(checkout);

  if (!checkinDate || !checkoutDate) return 1;
  const diffMs = checkoutDate.getTime() - checkinDate.getTime();
  return Math.max(1, Math.round(diffMs / MS_PER_DAY));
}

function getSeasonDetails(checkin, property) {
  const checkinDate = parseDateOnly(checkin);
  const month = checkinDate ? checkinDate.getUTCMonth() : new Date().getUTCMonth();
  const isLowSeason = month <= 4 || month >= 9; // Jan-May, Oct-Dec

  const seasonBaseRate = isLowSeason ? LOW_SEASON_BASE_RATE : SUMMER_BASE_RATE;
  const propertySurcharge = property === 'domo' ? DOMO_BASE_SURCHARGE : 0;

  return {
    season: isLowSeason ? 'low' : 'summer',
    seasonBaseRate,
    propertySurcharge,
    baseRate: seasonBaseRate + propertySurcharge
  };
}

function calculatePricing(payload) {
  const property = payload?.property === 'domo' ? 'domo' : 'casa';
  const guests = Math.max(1, Number.parseInt(payload?.guests, 10) || 1);
  const pets = Number.parseInt(payload?.pets, 10) > 0 ? 1 : 0;
  const children = Number.parseInt(payload?.children, 10) > 0 ? 1 : 0;
  const nights = getNights(payload?.checkin, payload?.checkout);

  const {
    season,
    seasonBaseRate,
    propertySurcharge,
    baseRate
  } = getSeasonDetails(payload?.checkin, property);

  const extraPeople = Math.max(0, guests - 1);
  const baseTotal = baseRate * nights;
  const extraPeopleTotal = extraPeople * EXTRA_PERSON_RATE * nights;
  const petsTotal = pets * PET_RATE * nights;
  const childrenTotal = children * CHILD_RATE * nights;
  const subtotal = baseTotal + extraPeopleTotal + petsTotal + childrenTotal;
  const totalEstimate = subtotal + CLEANING_FEE;

  return {
    property,
    guests,
    pets,
    children,
    nights,
    season,
    seasonBaseRate,
    propertySurcharge,
    baseRate,
    extraPeople,
    baseTotal,
    extraPeopleTotal,
    petsTotal,
    childrenTotal,
    subtotal,
    cleaningFee: CLEANING_FEE,
    totalEstimate
  };
}

module.exports = {
  LOW_SEASON_BASE_RATE,
  SUMMER_BASE_RATE,
  DOMO_BASE_SURCHARGE,
  EXTRA_PERSON_RATE,
  PET_RATE,
  CHILD_RATE,
  CLEANING_FEE,
  calculatePricing
};
