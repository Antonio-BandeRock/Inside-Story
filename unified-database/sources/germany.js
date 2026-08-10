// Germany's BLS (Bundeslebensmittelschlüssel) -- real, confirmed
// English food_name already present (translated at an earlier stage of
// this project's own history; food_name_local preserves the real
// original German separately). See legacy-v3-shared.js.
const { ingestLegacySource } = require('./legacy-v3-shared.js');

module.exports = {
  sourceCode: 'Germany_BLS',
  sourceMeta: {
    sourceCode: 'Germany_BLS',
    displayName: 'Bundeslebensmittelschlüssel (BLS)',
    countryOrRegion: 'Germany',
    language: 'en', // the real, already-translated food_name is what's ingested here -- food_name_local (real German) is preserved in nameOriginal/raw
    homeUrl: 'https://www.blsdb.de/',
    licenseOrTerms: 'BLS license (research/non-commercial use)',
    rawFormat: 'zip',
  },
  ingest: () => ingestLegacySource('Germany_BLS'),
};
