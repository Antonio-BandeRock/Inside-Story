// France's Ciqual -- the one real exception among these 7 sources:
// food_name is genuinely, still French (confirmed by direct inspection,
// identical to food_name_local, never translated at any earlier stage).
// Needs a real translate-source.js pass afterward, exactly the same as
// Sweden. See legacy-v3-shared.js.
const { ingestLegacySource } = require('./legacy-v3-shared.js');

module.exports = {
  sourceCode: 'France_Ciqual',
  sourceMeta: {
    sourceCode: 'France_Ciqual',
    displayName: 'Ciqual',
    countryOrRegion: 'France',
    language: 'fr', // genuinely French -- unlike the other 6 legacy sources, no real English exists here yet
    homeUrl: 'https://ciqual.anses.fr/',
    licenseOrTerms: 'Licence Ouverte / Open Licence',
    rawFormat: 'xls',
  },
  ingest: () => ingestLegacySource('France_Ciqual'),
};
