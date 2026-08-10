// Australia's AFCD (Australian Food Composition Database) -- real,
// confirmed English data, no translation needed. See legacy-v3-shared.js.
const { ingestLegacySource } = require('./legacy-v3-shared.js');

module.exports = {
  sourceCode: 'Australia_AFCD',
  sourceMeta: {
    sourceCode: 'Australia_AFCD',
    displayName: 'Australian Food Composition Database (AFCD)',
    countryOrRegion: 'Australia',
    language: 'en',
    homeUrl: 'https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd',
    licenseOrTerms: 'Creative Commons Attribution 3.0 Australia',
    rawFormat: 'xlsx',
  },
  ingest: () => ingestLegacySource('Australia_AFCD'),
};
