// Checks lib/symptomPhotos.ts, photos of a symptom over time (D12, 2026-09-30).
//
// 1. Photos line up oldest first, grouped by the day they were taken.
// 2. A symptom or an area narrows the list, and only choices with a photo
//    are offered.
// 3. The sentence names the days with no photo rather than closing them up.
// 4. Captions say only what was logged, and a photo whose entry is gone says so.
// 5. No word in the module compares or judges a photo.
// 6. The media table is on no list of what travels between people.
//
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'lib', 'symptomPhotos.ts');
const source = fs.readFileSync(file, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = { exports: {} };
new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
  throw new Error('lib/symptomPhotos.ts must stay free of imports (asked for ' + name + ')');
});
const P = mod.exports;

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

const photo = (id, ownerId, takenOn, createdAt) => ({ id, ownerId, takenOn, createdAt, fileName: id + '.jpg' });
const entry = (id, checkinType, tags, bodyRegions, extra = {}) => ({
  id, loggedAt: '2026-09-01T08:00', checkinType, severity: 2, severityTen: null, foodName: null, tags, bodyRegions, ...extra,
});
const words = {
  tag: (code) => ({ rash: 'Rash', itching: 'Itching', swelling: 'Swelling' })[code] ?? code,
  region: (key) => ({ left_forearm: 'Left forearm', chest: 'Chest' })[key] ?? key,
  severity: (step) => (step === 2 ? 'Moderate' : null),
};

const photos = [
  photo('p3', 'e2', '2026-09-12', '2026-09-12T10:00'),
  photo('p1', 'e1', '2026-09-03', '2026-09-03T09:00'),
  photo('p2b', 'e1', '2026-09-03', '2026-09-03T09:05'),
  photo('p4', 'e3', '2026-09-28', '2026-09-28T20:00'),
  photo('p5', 'gone', '2026-09-20', '2026-09-20T07:00'),
];
const entries = [
  entry('e1', 'flare', ['rash', 'itching'], ['left_forearm']),
  entry('e2', 'post_meal', ['swelling'], [], { foodName: 'Shrimp' }),
  entry('e3', 'flare', ['rash'], ['left_forearm', 'chest']),
];

// 1. Order and days.
const all = P.photoTimeline(photos, entries, P.ALL_PHOTOS);
check(all.map((d) => d.day).join() === '2026-09-03,2026-09-12,2026-09-20,2026-09-28', 'days oldest first');
check(all[0].photos.map((x) => x.photo.id).join() === 'p1,p2b', 'within a day, the order added');
check(all[0].label === 'Sep 3, 2026', 'day label');
check(P.photoSequence(photos, entries, P.ALL_PHOTOS).length === 5, 'every photo is in the sequence');
check(all[2].photos[0].entry === null, 'a photo with no entry keeps its place');

// 2. Filters.
const rash = P.photoTimeline(photos, entries, { kind: 'tag', key: 'rash' });
check(rash.map((d) => d.day).join() === '2026-09-03,2026-09-28', 'one symptom narrows the list');
const chest = P.photoSequence(photos, entries, { kind: 'region', key: 'chest' });
check(chest.map((x) => x.photo.id).join() === 'p4', 'one area narrows the list');
const choices = P.filterChoices(photos, entries, words);
check(choices[0].value === 'all' && choices[0].label === 'Every photo (5 photos)', 'every photo first, with its count');
check(choices.some((c) => c.value === 'tag:rash' && c.label === 'Rash (3 photos)'), 'a symptom counts its photos');
check(choices.some((c) => c.value === 'region:chest' && c.label === 'Chest (1 photo)'), 'an area counts its photos');
check(!choices.some((c) => c.value === 'tag:headache'), 'nothing without a photo is offered');
check(P.filterValue({ kind: 'tag', key: 'rash' }) === 'tag:rash' && P.filterValue(P.ALL_PHOTOS) === 'all', 'filter values');

// 3. Sentence.
check(P.timelineSentence(rash) === '3 photos on 2 days, from Sep 3, 2026 to Sep 28, 2026. No photo on the other 24 days in that stretch.', 'sentence names the gap');
check(P.timelineSentence([]) === 'No photos for this choice.', 'empty sentence');
check(P.timelineSentence(P.photoTimeline([photos[0]], entries, P.ALL_PHOTOS)) === 'One photo on Sep 12, 2026.', 'one photo');
const twoDays = P.photoTimeline([photo('a', 'e1', '2026-09-03', 'x'), photo('b', 'e1', '2026-09-04', 'y')], entries, P.ALL_PHOTOS);
check(P.timelineSentence(twoDays) === '2 photos on 2 days, from Sep 3, 2026 to Sep 4, 2026.', 'no gap, no tail');
check(P.positionLine(2, 7, '2026-09-12') === 'Photo 3 of 7, taken Sep 12, 2026', 'position line');

// 4. Captions.
check(P.entryCaption(entries[0], words) === 'Flare, Moderate · Rash, Itching · Left forearm', 'flare caption');
check(P.entryCaption(entries[1], words) === 'Food reaction, Moderate, after Shrimp · Swelling', 'reaction caption');
check(P.entryCaption(entry('x', 'food_trial_daily', [], [], { severity: null }), words) === 'Food trial day', 'bare caption');
check(P.entryCaption(null, words) === 'Its entry could not be found.', 'missing entry');

// 5. Words.
const code = source.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*\*[\s\S]*?\*\//g, '');
for (const word of ['better', 'worse', 'improv', 'healing', 'progress', 'normal', 'because', 'caused', 'streak', 'score']) {
  check(!new RegExp('\\b' + word, 'i').test(code), 'no "' + word + '" in the module');
}

// 6. Nothing about photos travels between people.
const peer = fs.readFileSync(path.join(__dirname, '..', 'lib', 'peerRelationships.ts'), 'utf8');
check(!/table:\s*'media'/.test(peer), 'the media table is on no peer area');
check(!/'media'/.test(peer), 'the media table is not named in the peer allowlist at all');
const component = fs.readFileSync(path.join(__dirname, '..', 'components', 'SymptomPhotosOverTime.tsx'), 'utf8');
check(!/share|Sharing/.test(component.replace(/^\s*\/\/.*$/gm, '')), 'the band offers no way to share a photo');

console.log(`${checks - failures}/${checks} symptom photo checks passed`);
if (failures > 0) process.exit(1);
