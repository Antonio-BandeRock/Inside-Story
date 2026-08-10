// Canada's CNF (Canadian Nutrient File) -- real, confirmed English
// data, no translation needed. See legacy-v3-shared.js.
const { ingestLegacySource } = require('./legacy-v3-shared.js');

module.exports = {
  sourceCode: 'Canada_CNF',
  sourceMeta: {
    sourceCode: 'Canada_CNF',
    displayName: 'Canadian Nutrient File (CNF)',
    countryOrRegion: 'Canada',
    language: 'en',
    homeUrl: 'https://food-nutrition.canada.ca/cnf-fce/',
    licenseOrTerms: 'Open Government Licence - Canada',
    rawFormat: 'zip-csv',
  },
  ingest: () => ingestLegacySource('Canada_CNF'),
};
