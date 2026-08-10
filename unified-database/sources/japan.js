// Japan's MEXT (Standard Tables of Food Composition in Japan) -- real,
// confirmed English food_name already present (translated at an
// earlier stage of this project's own history; food_name_local is
// empty for this source in the v3_full snapshot). See legacy-v3-shared.js.
const { ingestLegacySource } = require('./legacy-v3-shared.js');

module.exports = {
  sourceCode: 'Japan_MEXT',
  sourceMeta: {
    sourceCode: 'Japan_MEXT',
    displayName: 'Standard Tables of Food Composition in Japan (MEXT)',
    countryOrRegion: 'Japan',
    language: 'en', // the real, already-translated food_name is what's ingested here
    homeUrl: 'https://www.mext.go.jp/en/policy/science_technology/policy/title01/detail01/1374030.htm',
    licenseOrTerms: 'MEXT open data',
    rawFormat: 'xlsx',
  },
  ingest: () => ingestLegacySource('Japan_MEXT'),
};
