// Runs lib/moonSky.ts: the moon's phases, the sign it is in, the equinoxes
// and solstices, the solar terms and Good Friday, against published times.
// The positions come from Meeus's low-precision series, so a phase or an
// equinox is allowed to land within 90 minutes of the published moment.
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function run(relPath, deps = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => deps[name]);
  return module.exports;
}

let failures = 0;
let checks = 0;
function check(ok, label) {
  checks++;
  if (!ok) {
    failures++;
    console.log('FAIL', label);
  }
}
function near(ms, iso, minutes, label) {
  const want = Date.parse(iso);
  const off = Math.abs(ms - want) / 60000;
  check(off <= minutes, `${label}: ${new Date(ms).toISOString()} vs ${iso} (${off.toFixed(0)} min off)`);
}

const S = run('lib/moonSky.ts');
const H = 90;

// Published times (UTC), from the US Naval Observatory's phase tables and
// equinox and solstice tables for 2026.
near(S.nextMoonPhase('new', Date.parse('2026-02-10T00:00Z')), '2026-02-17T12:01Z', H, 'new moon of the February 2026 annular eclipse');
near(S.nextMoonPhase('full', Date.parse('2026-02-25T00:00Z')), '2026-03-03T11:38Z', H, 'full moon of the March 2026 lunar eclipse');
near(S.nextMoonPhase('full', Date.parse('2026-08-20T00:00Z')), '2026-08-28T04:18Z', H, 'full moon of the August 2026 lunar eclipse');
near(S.nextMoonPhase('new', Date.parse('2026-01-10T00:00Z')), '2026-01-18T19:52Z', H, 'new moon of January 2026');
near(S.nextMoonPhase('new', Date.parse('2024-03-30T00:00Z')), '2024-04-08T18:21Z', H, 'new moon of the April 2024 total eclipse');

near(S.sunReaches(0, 2026), '2026-03-20T14:46Z', H, 'March equinox 2026');
near(S.sunReaches(90, 2026), '2026-06-21T08:24Z', H, 'June solstice 2026');
near(S.sunReaches(180, 2026), '2026-09-23T00:05Z', H, 'September equinox 2026');
near(S.sunReaches(270, 2026), '2026-12-21T20:50Z', H, 'December solstice 2026');
near(S.sunReaches(90, 2024), '2024-06-20T20:51Z', H, 'June solstice 2024');

// Phases between two moments come in order and a week or so apart.
const phases = S.moonPhasesBetween(Date.parse('2026-01-01T00:00Z'), Date.parse('2026-12-31T00:00Z'));
check(phases.length >= 48 && phases.length <= 50, `a year holds about 49 principal phases (${phases.length})`);
const order = ['new', 'firstQuarter', 'full', 'lastQuarter'];
check(phases.every((p, i) => i === 0 || order.indexOf(p.phase) === (order.indexOf(phases[i - 1].phase) + 1) % 4), 'phases follow one another in order');
check(phases.every((p, i) => i === 0 || (p.at - phases[i - 1].at) / 86400000 > 5.5 && (p.at - phases[i - 1].at) / 86400000 < 9), 'phases are a week or so apart');

// The lit share and the names agree with the phase.
const fullAt = Date.parse('2026-03-03T11:38Z');
check(S.moonIllumination(fullAt) > 0.99, 'a full moon is lit all over');
check(S.moonPhaseName(fullAt) === 'Full moon', 'a full moon is called one');
check(S.moonIllumination(Date.parse('2026-02-17T12:01Z')) < 0.01, 'a new moon is dark');
check(S.moonQuarter(fullAt + 86400000) === 3, 'the day after full is the third quarter');
check(S.isWaxing(fullAt - 86400000) && !S.isWaxing(fullAt + 86400000), 'waxing before full, waning after');

// The moon's sign. The Old Farmer's Almanac and ephemerides put the moon in
// Virgo at the March 2026 full moon (opposite the sun in Pisces).
check(S.moonSign(fullAt) === 'Virgo', `the moon at the March 2026 full moon is in Virgo (${S.moonSign(fullAt)})`);
check(Math.abs(S.moonLongitude(fullAt) - ((S.sunLongitude(fullAt) + 180) % 360)) < 0.5, 'a full moon stands opposite the sun');
const spans = S.moonSignSpans(Date.parse('2026-10-01T00:00Z'), Date.parse('2026-10-29T00:00Z'));
check(spans.length >= 11 && spans.length <= 13, `the moon passes through about a dozen signs in four weeks (${spans.length})`);
check(spans.every((s) => s.until > s.from), 'every span has length');
check(spans.slice(1, -1).every((s) => (s.until - s.from) / 86400000 > 1.8 && (s.until - s.from) / 86400000 < 3.2), 'a whole sign lasts two to three days');
check(spans.every((s, i) => i === 0 || S.ZODIAC_SIGNS.indexOf(s.sign) === (S.ZODIAC_SIGNS.indexOf(spans[i - 1].sign) + 1) % 12), 'signs follow one another in order');
check(Object.keys(S.SIGN_CLASS).length === 12 && Object.values(S.SIGN_CLASS).filter((c) => c === 'fruitful').length === 5, 'five fruitful signs');

// The seasons are named for the hemisphere.
const north = S.seasonMarkers(2026, false);
const south = S.seasonMarkers(2026, true);
check(north[1].note.includes('longest') && south[1].note.includes('shortest'), 'the June solstice is longest north, shortest south');
check(north[0].note.startsWith('Spring') && south[0].note.startsWith('Autumn'), 'the March equinox is spring north, autumn south');

// The solar terms: every term once, and Qingming begins around 5 April.
check(S.SOLAR_TERMS.length === 24 && new Set(S.SOLAR_TERMS.map((t) => t.longitude)).size === 24, '24 terms, one per 15 degrees');
const qingming = S.solarTermNow(Date.parse('2026-04-10T00:00Z'));
check(qingming.current.name === 'Pure Brightness', `10 April 2026 is in Pure Brightness (${qingming.current.name})`);
near(qingming.current.at, '2026-04-04T20:40Z', 180, 'Pure Brightness 2026 begins');
check(qingming.next.name === 'Grain Rain', 'Grain Rain follows');
near(qingming.next.at, '2026-04-20T03:39Z', 180, 'Grain Rain 2026 begins');
const winter = S.solarTermNow(Date.parse('2026-12-28T00:00Z'));
check(winter.current.name === 'Winter Solstice' && winter.next.name === 'Minor Cold', 'the terms wrap past the end of the year');

// Good Friday, from published Easter dates.
check(S.easterSunday(2026) === '2026-04-05', 'Easter 2026 is April 5');
check(S.goodFriday(2026) === '2026-04-03', 'Good Friday 2026 is April 3');
check(S.easterSunday(2027) === '2027-03-28', 'Easter 2027 is March 28');
check(S.goodFriday(2027) === '2027-03-26', 'Good Friday 2027 is March 26');
check(S.easterSunday(2038) === '2038-04-25', 'Easter 2038 is April 25, the latest possible');
check(S.dateLabel('2026-04-03') === 'April 3', 'a date reads as a month and day');

console.log(`${checks - failures}/${checks} checks passed`);
if (failures) process.exit(1);
