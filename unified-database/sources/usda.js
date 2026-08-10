// USDA FoodData Central (SR Legacy) -- real, confirmed English data,
// no translation needed. See legacy-v3-shared.js for the real, shared
// ingestion logic all 7 original sources use.
const { ingestLegacySource } = require('./legacy-v3-shared.js');

module.exports = {
  sourceCode: 'USDA',
  sourceMeta: {
    sourceCode: 'USDA',
    displayName: "USDA FoodData Central (SR Legacy)",
    countryOrRegion: 'United States',
    language: 'en',
    homeUrl: 'https://fdc.nal.usda.gov/',
    licenseOrTerms: 'Public Domain',
    rawFormat: 'zip-csv',
  },
  ingest: () => ingestLegacySource('USDA'),
};
