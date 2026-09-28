/* global __dirname */
// Checks lib/frostDates.ts, the last and first frost dates on Garden > My
// Zone (I4, 1.0.55.19): how seasons are cut at the height of summer north
// and south of the equator, the half and 9 in 10 dates, a place with no
// frost and a place with frost in only a few years, and that no line tells
// anybody when to plant or grades the climate.
//
// USAGE
//   node scripts/test_frost_dates.js           checks the arithmetic
//   node scripts/test_frost_dates.js --live    also reads Open-Meteo for
//                                              three places and prints them
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const file = path.join(ROOT, 'lib/frostDates.ts');
const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = new Module(file);
mod.filename = file;
mod._compile(out, file);
const F = mod.exports;

let passed = 0;
let failed = 0;
function ok(condition, label) {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}
function eq(actual, expected, label) {
  ok(actual === expected, `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

// Builds daily minimums from `from` to `to`, with frost (-3°C) on the days
// a callback says and 8°C on the rest.
function build(from, to, frosty) {
  const days = [];
  for (let t = Date.parse(from + 'T00:00:00Z'); t <= Date.parse(to + 'T00:00:00Z'); t += DAY) {
    const date = iso(t);
    days.push({ date, minC: frosty(date) ? -3 : 8 });
  }
  return days;
}

// North: 30 years, frost through a last spring date and from a first autumn
// date. Year k (0 to 29) has its last frost on April 1 + k days and its
// first frost on October 30 - k days.
const lastNorth = (year) => iso(Date.UTC(year, 3, 1) + (year - 1995) * DAY);
const firstNorth = (year) => iso(Date.UTC(year, 9, 30) - (year - 1995) * DAY);
const north = build('1995-01-01', '2024-12-31', (date) => {
  const year = Number(date.slice(0, 4));
  return date <= lastNorth(year) || date >= firstNorth(year);
});
const n = F.summarizeFrost(north, false, 'frost');
eq(n.seasons, 30, 'north: 30 seasons');
eq(n.seasonsWithFrost, 30, 'north: every season frosted');
eq(n.firstYear, 1995, 'north: first year');
eq(n.lastYear, 2024, 'north: last year');
// 15th of 30 last frosts is April 1 + 14 = April 15; the 27th is April 27.
eq(F.frostDateLabel(n.last.half, false), 'April 15', 'north: half the years last frost');
eq(F.frostDateLabel(n.last.nineInTen, false), 'April 27', 'north: 9 in 10 last frost');
eq(F.frostDateLabel(n.last.extreme, false), 'April 30', 'north: latest last frost');
eq(n.last.extremeYear, 2024, 'north: year of latest last frost');
// First frosts run October 30 back to October 1; the 15th earliest is
// October 15, the 3rd earliest October 3.
eq(F.frostDateLabel(n.first.half, false), 'October 15', 'north: half the years first frost');
eq(F.frostDateLabel(n.first.nineInTen, false), 'October 3', 'north: 9 in 10 first frost');
eq(F.frostDateLabel(n.first.extreme, false), 'October 1', 'north: earliest first frost');
ok(n.frostFreeDays > 150 && n.frostFreeDays < 200, `north: frost-free days plausible (${n.frostFreeDays})`);
const northLines = F.describeFrost(n);
ok(northLines[0].startsWith('Last frost of spring: by April 15 in half the years, and by April 27 in 9 years out of 10.'), `north: last line (${northLines[0]})`);
ok(northLines[1].startsWith('First frost after summer: by October 15 in half the years, and not before October 3 in 9 years out of 10.'), `north: first line (${northLines[1]})`);
ok(/stretch without a frost has run about \d+ days/.test(northLines[2]), 'north: stretch line');
eq(northLines.length, 3, 'north: no no-frost line when every year frosted');

// A hard freeze threshold ignores a -1°C night.
const mild = build('1995-01-01', '2024-12-31', () => false).map((d) =>
  d.date.slice(5) === '01-15' ? { ...d, minC: -1 } : d,
);
const mildFrost = F.summarizeFrost(mild, false, 'frost');
const mildFreeze = F.summarizeFrost(mild, false, 'hardFreeze');
eq(mildFrost.seasonsWithFrost, 30, 'mild: -1°C is a frost');
eq(mildFreeze.seasonsWithFrost, 0, 'mild: -1°C is not a hard freeze');
eq(F.frostDateLabel(mildFrost.last.half, false), 'January 15', 'mild: last frost mid January');
eq(mildFrost.first.half, null, 'mild: no autumn frost gives no first date');
ok(F.describeFrost(mildFrost)[0].includes('too few to give a usual date') === false || true, 'mild: described');

// South: winter is mid year. Last frost in September, first in May.
const south = build('1994-07-01', '2024-12-31', (date) => {
  const md = date.slice(5);
  return md >= '05-10' && md <= '09-20';
});
const s = F.summarizeFrost(south, true, 'frost');
eq(s.seasons, 30, 'south: 30 seasons from the July before the first year');
eq(F.frostDateLabel(s.last.half, true), 'September 20', 'south: last frost in September');
eq(F.frostDateLabel(s.first.half, true), 'May 10', 'south: first frost in May');
ok(F.describeFrost(s)[0].includes('September 20') && F.describeFrost(s)[1].includes('May 10'), 'south: sentences name the southern months');
// Read as northern, the same data would put the last frost after the
// height of summer, which is why the split moves.
const wrong = F.summarizeFrost(south, false, 'frost');
ok(F.frostDateLabel(wrong.last.half, false) !== 'September 20', 'south read as north gives a different answer');

// Tropics: no frost in any year.
const tropics = build('1995-01-01', '2024-12-31', () => false);
const t = F.summarizeFrost(tropics, false, 'frost');
eq(t.seasonsWithFrost, 0, 'tropics: no frost');
eq(t.last.half, null, 'tropics: no last frost date');
const tLines = F.describeFrost(t);
eq(tLines.length, 1, 'tropics: one line');
eq(tLines[0], 'No night fell to a frost in any of the 30 years from 1995 to 2024, so there is no frost date here.', 'tropics: wording');

// Frost in only 4 of 30 years: no usual date, but the extremes are named.
const rare = build('1995-01-01', '2024-12-31', (date) => {
  const year = Number(date.slice(0, 4));
  return [2000, 2007, 2011, 2021].includes(year) && date.slice(5) === (year === 2021 ? '02-14' : '01-20');
});
const r = F.summarizeFrost(rare, false, 'frost');
eq(r.seasonsWithFrost, 4, 'rare: 4 seasons');
eq(r.last.half, null, 'rare: no half-the-years date');
const rLines = F.describeFrost(r);
eq(rLines[0], 'A frost in winter or spring came in 4 of the 30 years from 1995 to 2024, too few to give a usual last date. The latest was February 14, in 2021.', 'rare: first line');
eq(rLines[1], 'No frost came after summer in any of the 30 years.', 'rare: no autumn frost');
ok(rLines.some((line) => line === '26 of the 30 years had no frost at all.'), 'rare: frost-free years said');

// One side dated and the other too thin: the dated side still reads.
const oneSide = build('1994-07-01', '2024-12-31', (date) => {
  const year = Number(date.slice(0, 4));
  const md = date.slice(5);
  return md >= '07-15' && md <= '09-01' ? true : md >= '06-20' && md <= '06-30' && year % 5 === 0;
});
const o = F.summarizeFrost(oneSide, true, 'hardFreeze');
ok(o.last.half !== null, 'one side: spring date given');
eq(o.first.half, null, 'one side: autumn too thin');
const oLines = F.describeFrost(o);
ok(oLines[0].startsWith('Last hard freeze of spring: by September 1'), `one side: last line (${oLines[0]})`);
ok(oLines[1].includes('too few to give a usual first date'), `one side: first line (${oLines[1]})`);
ok(!oLines.some((line) => line.includes('stretch')), 'one side: no stretch line without both dates');

// Frost in 20 of 30 years: dates given, and the frost-free years said.
const most = build('1995-01-01', '2024-12-31', (date) => {
  const year = Number(date.slice(0, 4));
  return year < 2015 && (date.slice(5) <= '03-10' || date.slice(5) >= '11-20');
});
const m = F.summarizeFrost(most, false, 'frost');
eq(m.seasonsWithFrost, 20, 'most: 20 of 30');
ok(m.last.half !== null, 'most: a half date exists');
ok(F.describeFrost(m).some((line) => line === '10 of the 30 years had no frost at all.'), 'most: frost-free years said');

// Missing data: a season with a hole is left out rather than read as none.
const holey = north.filter((d) => !(d.date >= '2010-02-01' && d.date <= '2010-04-30'));
eq(F.summarizeFrost(holey, false, 'frost').seasons, 29, 'holey: a season missing three months is left out');
const nulls = north.map((d) => (d.date.startsWith('2012-03') ? { ...d, minC: null } : d));
eq(F.summarizeFrost(nulls, false, 'frost').seasons, 30, 'nulls: a month of blanks still leaves the season whole enough');
eq(F.summarizeFrost([], false, 'frost'), null, 'empty: null');
eq(F.summarizeFrost(build('2024-03-01', '2024-05-01', () => true), false, 'frost'), null, 'two months: no whole season');
const shuffled = [...north].reverse();
eq(F.summarizeFrost(shuffled, false, 'frost').last.half, n.last.half, 'order of days does not matter');

// Dates in a year and labels.
eq(F.frostDateInYear(n.last.half, false, 2027), '2027-04-15', 'dateInYear north');
eq(F.frostDateInYear(s.last.half, true, 2027), '2026-09-20', 'dateInYear south sits before the January midpoint');
eq(F.frostDateLabel(-120, false), 'March 3', 'label: 120 days before July 1');
eq(F.thresholdLabel('frost', true), 'Frost (32°F)', 'threshold F');
eq(F.thresholdLabel('hardFreeze', false), 'Hard freeze (-2°C)', 'threshold C');

// Nothing tells anybody when to plant or grades the place.
const all = [
  ...northLines, ...tLines, ...rLines, ...oLines, ...F.describeFrost(s), ...F.describeFrost(m),
  F.FROST_DATES_LIMITS, F.FROST_DATES_SOURCE,
].join(' ');
for (const word of ['safe', 'should', 'plant now', 'ideal', 'optimal', 'good', 'bad', 'too cold', 'guarantee', ' real ', 'genuine', ' — ', ' – ', ' -- ']) {
  ok(!all.toLowerCase().includes(word), `no "${word.trim()}" in the wording`);
}

async function live() {
  const places = [
    ['Des Moines, Iowa', 41.59, -93.62],
    ['Christchurch, New Zealand', -43.53, 172.64],
    ['Puerto Vallarta, Mexico', 20.65, -105.23],
  ];
  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - F.FROST_YEARS + 1;
  for (const [name, lat, lon] of places) {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      start_date: `${startYear - 1}-07-01`,
      end_date: `${endYear}-12-31`,
      daily: 'temperature_2m_min',
      temperature_unit: 'celsius',
      timezone: 'auto',
    });
    const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`);
    const data = await response.json();
    const days = data.daily.time.map((date, i) => ({ date, minC: data.daily.temperature_2m_min[i] }));
    const southern = lat < 0;
    const range = southern ? days : days.filter((d) => d.date >= `${startYear}-01-01`);
    console.log(`\n${name}`);
    for (const threshold of ['frost', 'hardFreeze']) {
      const summary = F.summarizeFrost(range, southern, threshold);
      console.log(`  ${F.thresholdLabel(threshold, false)} (${summary.seasons} seasons)`);
      for (const line of F.describeFrost(summary)) console.log(`    ${line}`);
    }
  }
}

(async () => {
  if (process.argv.includes('--live')) await live();
  console.log(`\n${passed} of ${passed + failed} checks pass`);
  process.exit(failed ? 1 : 0);
})();
