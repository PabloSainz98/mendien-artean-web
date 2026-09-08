'use strict';
const crypto = require('node:crypto');
const config = require('./legal-config.json');
// Exact public notice preserved from uxarbeiti.eus on 2026-09-08, not a legal approval.
const published = require('./published-privacy.json');
const publishedVersion = `published-2026-09-08-${crypto.createHash('sha256').update(JSON.stringify(published)).digest('hex').slice(0, 12)}`;
const version = `${config.version}-${crypto.createHash('sha256').update(JSON.stringify(config)).digest('hex').slice(0, 12)}`;
function issues(value = config) {
  const missing = [];
  for (const key of [
    'holder',
    'taxId',
    'address',
    'privacyEmail',
    'commercialRegistry',
    'reviewedOn',
  ])
    if (typeof value[key] !== 'string' || !value[key].trim()) missing.push(key);
  for (const group of ['registrations', 'categories'])
    for (const key of ['casa', 'domo'])
      if (!value[group]?.[key]?.trim()) missing.push(`${group}.${key}`);
  for (const key of ['payment', 'cancellation', 'houseRules', 'retention', 'providers'])
    for (const lang of ['es', 'en', 'eu'])
      if (!value.policies?.[key]?.[lang]?.trim()) missing.push(`policies.${key}.${lang}`);
  if (value.pricesIncludeTaxes !== true) missing.push('pricesIncludeTaxes');
  if (value.approvedForPublication !== true) missing.push('approvedForPublication');
  return missing;
}
module.exports = { config, version, issues, published, publishedVersion };
