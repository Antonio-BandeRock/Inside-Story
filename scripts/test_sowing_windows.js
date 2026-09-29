// Runs lib/sowingWindows.ts and lib/sowingTraditions.ts: that every window
// belongs to a crop guide and reads the right way round, that a calendar
// comes out where the charts put it for a northern place, a southern one
// and a frost-free one, that a planting's expected dates move between
// sowing and planting out correctly, that the moon's quarters line up with
// published phases, and that the traditions are told without verdict or
// mocking words.
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath, deps = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (deps[name]) return deps[name];
    throw new Error(`unexpected import ${name} in ${relPath}`);
  });
  return module.exports;
}

const N = load('lib/plantNutrients.ts');
const P = load('lib/cropProblems.ts', { './plantNutrients': N });
const G = load('lib/cropGuides.ts', { './plantNutrients': N, './cropProblems': P });
const F = load('lib/frostDates.ts');
const W = load('lib/sowingWindows.ts', { './frostDates': F });
const M = load('lib/moonSky.ts');
const T = load('lib/sowingTraditions.ts', { './moonSky': M });

let failures = 0;
let checks = 0;
function ok(label, condition) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
}

// 1. Every window is a crop guide, and reads the right way round.
const guideKeys = new Set(G.CROP_GUIDES.map((g) => g.key));
const seen = new Set();
for (const w of W.SOWING_WINDOWS) {
  ok(`${w.key} is a crop guide`, guideKeys.has(w.key));
  ok(`${w.key} appears once`, !seen.has(w.key));
  seen.add(w.key);
  const guide = G.findCropGuideByKey(w.key);
  if (guide) ok(`${w.key} is not a perennial`, guide.season !== 'perennial' && guide.group !== 'fruit' || w.key === 'melon');
  if (w.indoors) ok(`${w.key} indoors counts down`, w.indoors[0] >= w.indoors[1] && w.indoors[1] >= 0);
  if (w.autumn) ok(`${w.key} autumn counts down`, w.autumn[0] >= w.autumn[1] && w.autumn[1] >= 0);
  for (const pair of [w.plantOut, w.direct, w.sprout, w.harvest]) if (pair) ok(`${w.key} range ${pair}`, pair[0] <= pair[1]);
  ok(`${w.key} has something to do`, !!(w.indoors || w.plantOut || w.direct || w.autumn));
  // Tender crops never go out before the last frost.
  if (guide && guide.season === 'warm') {
    for (const pair of [w.plantOut, w.direct]) if (pair) ok(`${w.key} tender, out after the frost`, pair[0] >= 0);
  }
  // A crop with nothing sown from seed has no sprouting days.
  if (w.plantWhat && !w.indoors && !w.direct) ok(`${w.key} planted, not sown, has no sprout`, !w.sprout);
}
// Every annual guide has a window, except the listed ones.
// Cannabis is a crop guide and nothing else (see its entry in lib/cropGuides.ts).
const NO_WINDOW = new Set(['chayote', 'lemongrass', 'cannabis']);
for (const g of G.CROP_GUIDES) {
  if (g.season === 'perennial' || g.group === 'fruit' || NO_WINDOW.has(g.key)) continue;
  ok(`${g.key} (${g.season}) has a sowing window`, seen.has(g.key));
}

// 2. Des Moines-like: last frost April 15, first October 16 (north).
const desMoines = {
  threshold: 'frost', southern: false, seasons: 30, seasonsWithFrost: 30, firstYear: 1996, lastYear: 2025,
  last: { half: -77, nineInTen: -63, extreme: -50, extremeYear: 2005, years: 30 },
  first: { half: 107, nineInTen: 95, extreme: 85, extremeYear: 2000, years: 30 },
  frostFreeDays: 184,
};
const dm = W.frostAnchor(desMoines, false);
ok('Des Moines anchors on a frost', dm.kind === 'frost');
ok('frostDateInYear gives April 15', F.frostDateInYear(-77, false, 2027) === '2027-04-15');
const tomato = W.findSowingWindow('tomato');
const tw = W.upcomingWindows(tomato, dm, '2027-01-10');
const indoors = tw.find((d) => d.action === 'indoors');
const out = tw.find((d) => d.action === 'plantOut');
ok(`tomato indoors Feb 18 to Mar 4 (${JSON.stringify(indoors)})`, indoors && indoors.start === '2027-02-18' && indoors.end === '2027-03-04');
ok(`tomato out Apr 22 to May 6 (${JSON.stringify(out)})`, out && out.start === '2027-04-22' && out.end === '2027-05-06');
const lettuce = W.upcomingWindows(W.findSowingWindow('lettuce'), dm, '2027-06-01');
const lAutumn = lettuce.find((d) => d.action === 'autumn');
ok(`lettuce autumn Aug 7 to Sep 4 (${JSON.stringify(lAutumn)})`, lAutumn && lAutumn.start === '2027-08-07' && lAutumn.end === '2027-09-04');
ok('a closed window is dropped', !W.upcomingWindows(tomato, dm, '2027-06-01').some((d) => d.start.startsWith('2027-02')));
ok('next year shows once this one closes', W.upcomingWindows(tomato, dm, '2027-06-01').some((d) => d.start.startsWith('2028-02')));
const near = W.windowsNear(tomato, dm, '2027-02-10', 14);
ok('windowsNear finds indoors opening in 8 days', near.length === 1 && near[0].action === 'indoors');
ok('isOpen', W.isOpen(indoors, '2027-02-20') && !W.isOpen(indoors, '2027-03-05'));

// 3. Christchurch-like: south, last frost October 13, first April 20.
const christchurch = {
  ...desMoines, southern: true,
  last: { half: -80, nineInTen: -60, extreme: -45, extremeYear: 2003, years: 30 },
  first: { half: 109, nineInTen: 95, extreme: 80, extremeYear: 2012, years: 30 },
};
const cc = W.frostAnchor(christchurch, true);
const ccOut = W.upcomingWindows(tomato, cc, '2027-07-01').find((d) => d.action === 'plantOut');
ok(`Christchurch tomato out Oct 20 to Nov 3 (${JSON.stringify(ccOut)})`, ccOut && ccOut.start === '2027-10-20' && ccOut.end === '2027-11-03');

// 4. Puerto Vallarta-like: frost in 1 of 30 years, too few for a date.
const vallarta = {
  ...desMoines, seasonsWithFrost: 1,
  last: { half: null, nineInTen: null, extreme: -150, extremeYear: 1997, years: 1 },
  first: { half: null, nineInTen: null, extreme: null, extremeYear: null, years: 0 },
  frostFreeDays: null,
};
const pv = W.frostAnchor(vallarta, false);
ok('Vallarta is frost-free', pv.kind === 'frostFree' && pv.frostYears === 1);
const pvLettuce = W.upcomingWindows(W.findSowingWindow('lettuce'), pv, '2027-09-15');
ok(`Vallarta lettuce Oct 1 to Jan 31 (${JSON.stringify(pvLettuce[0])})`, pvLettuce[0].start === '2027-10-01' && pvLettuce[0].end === '2028-01-31');
const pvOkra = W.upcomingWindows(W.findSowingWindow('okra'), pv, '2027-01-15');
ok(`Vallarta okra Mar 1 to Jul 31 (${JSON.stringify(pvOkra[0])})`, pvOkra[0].start === '2027-03-01' && pvOkra[0].end === '2027-07-31');
const pvTomato = W.upcomingWindows(tomato, pv, '2027-09-15');
ok(`Vallarta tomato open Aug 1 to Mar 31 (${JSON.stringify(pvTomato[0])})`, pvTomato[0].start === '2027-08-01' && pvTomato[0].end === '2028-03-31');
ok('no frost-free window for parsnip', W.upcomingWindows(W.findSowingWindow('parsnip'), pv, '2027-09-15').length === 0);
ok('south turns six months', JSON.stringify(W.frostFreeMonths('cool', true)) === JSON.stringify([4, 5, 6, 7]));
ok('no frost summary, no anchor', W.frostAnchor(null, false) === null);

// 5. Expected dates.
const lead = W.indoorLeadDays(tomato); // indoors mid 7 before, out mid 2 after = 9 weeks
ok(`tomato lead 63 days (${lead})`, lead === 63);
const fromStart = W.expectedDates(tomato, '2027-05-01', 'start');
ok(`tomato from a start: harvest Jun 30 to Jul 25 (${fromStart.harvestStart} ${fromStart.harvestEnd})`, fromStart.harvestStart === '2027-06-30' && fromStart.harvestEnd === '2027-07-25');
ok('a start has no sprouting date', fromStart.sproutBy === null);
const sownIndoors = W.expectedDates(tomato, '2027-02-20', 'seed', true);
ok(`tomato sown indoors adds the lead (${sownIndoors.harvestDays})`, sownIndoors.harvestDays[0] === 123 && sownIndoors.sproutBy === '2027-03-02');
const carrot = W.expectedDates(W.findSowingWindow('carrot'), '2027-04-01', 'seed');
ok(`carrot up by Apr 22, ready Jun 10 to Jun 20 (${carrot.sproutBy} ${carrot.harvestStart} ${carrot.harvestEnd})`, carrot.sproutBy === '2027-04-22' && carrot.harvestStart === '2027-06-10' && carrot.harvestEnd === '2027-06-20');
const garlic = W.expectedDates(W.findSowingWindow('garlic'), '2027-10-15', 'start');
ok('garlic has no day count', garlic.harvestStart === null && garlic.sproutBy === null);
const lettuceStart = W.expectedDates(W.findSowingWindow('lettuce'), '2027-04-01', 'start');
ok(`lettuce from a start subtracts the lead (${lettuceStart.harvestDays})`, lettuceStart.harvestDays[0] < 30);
ok('asks how started for tomato', W.asksHowStarted(tomato));
ok('does not ask for carrot', !W.asksHowStarted(W.findSowingWindow('carrot')));
ok('does not ask for potato', !W.asksHowStarted(W.findSowingWindow('potato')));
ok('label names seed potatoes', W.actionLabel(W.findSowingWindow('potato'), 'plantOut') === 'Plant seed potatoes');

// 6. The moon's quarters, from the new moon of 17 February 2026.
const from = Date.parse('2026-02-15T00:00Z');
const spans = T.quarterSpans(from, from + 30 * 86400000);
const leafy = spans.find((s) => s.quarter === 1);
ok(`first quarter begins at the Feb 17 new moon (${leafy && new Date(leafy.from).toISOString()})`, leafy && Math.abs(leafy.from - Date.parse('2026-02-17T12:01Z')) < 90 * 60000);
ok('spans are in order and touch', spans.every((s, i) => i === 0 || s.from === spans[i - 1].until));
ok('quarters cycle', spans.every((s, i) => i === 0 || s.quarter === (spans[i - 1].quarter % 4) + 1));
const fruitDays = T.moonDaysFor('fruiting', from, 30);
ok('fruiting days are second-quarter spans', fruitDays.length >= 1 && fruitDays.every((d) => d.span.quarter === 2));
ok('fruitful days are inside their span', fruitDays.every((d) => d.fruitful.every((f) => f.from >= d.span.from && f.until <= d.span.until)));
ok('fruitful days are fruitful signs', fruitDays.every((d) => d.fruitful.every((f) => M.SIGN_CLASS[f.sign] === 'fruitful')));
const kinds = { tomato: 'fruiting', lettuce: 'leafy', potato: 'root', apple: 'root', asparagus: 'root', basil: 'leafy', peas: 'fruiting' };
for (const [key, kind] of Object.entries(kinds)) ok(`${key} is ${kind}`, T.moonKindFor(G.findCropGuideByKey(key)) === kind);

// 7. The traditions: complete, sourced, and told without verdicts or mockery.
const MOCK = /\b(superstition|superstitious|nonsense|myth|pseudo|silly|debunk|quack|lunacy|old wives|foolish|primitive|bogus|hocus)/i;
const DASHES = /[–—]| -- /;
const FILLER = /\b(real|genuine|genuinely)\b/i;
const MUST = /\b(you must|must plant|always plant|never plant)\b/i;
const keys = new Set();
for (const t of T.SOWING_TRADITIONS) {
  ok(`${t.key} unique`, !keys.has(t.key));
  keys.add(t.key);
  ok(`${t.key} has sayings`, t.says.length >= 2);
  ok(`${t.key} has a tier`, !!T.EVIDENCE_TIER_LABELS[t.tier]);
  ok(`${t.key} has sources`, t.sources.length >= 1 && t.sources.every((s) => /^https:\/\//.test(s.url)));
  const text = [t.name, t.whoKeeps, t.evidence, ...t.says].join(' ');
  ok(`${t.key} no mocking words`, !MOCK.test(text));
  ok(`${t.key} no dashes`, !DASHES.test(text));
  ok(`${t.key} no filler`, !FILLER.test(text));
  ok(`${t.key} no orders`, !MUST.test(text));
}
for (const k of ['moonPhase', 'signs', 'biodynamic', 'sunDays', 'phenology', 'solarTerms', 'rains', 'maramataka']) ok(`tradition ${k} present`, keys.has(k));
for (const text of [T.TRADITIONS_INTRO, W.SOWING_LIMITS, ...Object.values(W.FROST_FREE_SEASON_LINES)]) {
  ok('module text no dashes', !DASHES.test(text));
  ok('module text no mocking', !MOCK.test(text));
}

console.log(`${checks - failures}/${checks} checks passed`);
process.exit(failures ? 1 : 0);
