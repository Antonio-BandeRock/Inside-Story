// UK's CoFID (Composition of Foods Integrated Dataset) -- real,
// confirmed English data, no translation needed. See legacy-v3-shared.js.
const { ingestLegacySource } = require('./legacy-v3-shared.js');

module.exports = {
  sourceCode: 'UK_CoFID',
  sourceMeta: {
    sourceCode: 'UK_CoFID',
    displayName: 'Composition of Foods Integrated Dataset (CoFID)',
    countryOrRegion: 'United Kingdom',
    language: 'en',
    homeUrl: 'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid',
    licenseOrTerms: 'Open Government Licence v3.0',
    rawFormat: 'xlsx',
  },
  ingest: () => ingestLegacySource('UK_CoFID'),
};
