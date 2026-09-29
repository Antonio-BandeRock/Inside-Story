// Runs lib/plantingEvents.ts: what was done to each planting (I14), and
// checks the places it is wired into.
//
// Built 2026-09-28.
//
// The rules checked:
//
//  1. Counts per kind add up, read most first, and a planting with nothing
//     recorded says so plainly.
//  2. An entry needs a kind and a plain date, and a day that has not come
//     yet is refused: this is a record of what was done, not a plan.
//  3. Trends > Garden Yield counts only what was done on or before a
//     planting's first picking, and its caveat says one garden cannot tell
//     which of them made the difference.
//  4. The kinds are an open list, and a planting with entries cannot be
//     removed, from the screen or from lib/db.ts, so no entry is orphaned.
//  5. No sentence judges a garden or tells anybody what to do to a plant.
//
// Run with: node scripts/test_planting_events.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

function run(relPath, resolve) {
  const { outputText } = ts.transpileModule(read(relPath), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    const found = resolve[name];
    if (!found) throw new Error(`unexpected import ${name}`);
    return found;
  });
  return module.exports;
}

let failures = 0;
let passes = 0;
function check(label, condition, detail) {
  if (condition) {
    passes += 1;
  } else {
    failures += 1;
    console.log(`FAIL ${label}${detail ? `\n     ${detail}` : ''}`);
  }
}

const P = run('lib/plantingEvents.ts', {});

// 1. Counting
const labels = { watered: 'Watered', fed: 'Fed', pruned: 'Pruned' };
const labelFor = (kind) => labels[kind] ?? kind;
const events = [
  { kind: 'watered', occurredOn: '2026-06-01' },
  { kind: 'fed', occurredOn: '2026-06-02' },
  { kind: 'watered', occurredOn: '2026-06-05' },
  { kind: 'pruned', occurredOn: '2026-06-03' },
  { kind: 'watered', occurredOn: '2026-06-03' },
];
const counts = P.countByKind(events, labelFor);
check('most counted first', counts[0].kind === 'watered' && counts[0].count === 3, JSON.stringify(counts));
check('ties read by label', counts[1].label === 'Fed' && counts[2].label === 'Pruned', JSON.stringify(counts));
check('last day kept', counts[0].lastOn === '2026-06-05', counts[0].lastOn);
check('counts line', P.countsLine(counts) === 'Watered (3), Fed (1), Pruned (1)', P.countsLine(counts));
check('summary with entries', P.plantingCareSummary(counts) === '5 entries: Watered (3), Fed (1), Pruned (1).', P.plantingCareSummary(counts));
check('summary with one entry', P.plantingCareSummary(P.countByKind([events[1]], labelFor)) === '1 entry: Fed (1).');
check('summary with none', P.plantingCareSummary([]) === 'Nothing recorded as done to it yet.');

// 2. Entries
check('kind needed', P.entryProblem({ kind: null, occurredOn: '2026-09-01', today: '2026-09-28' }) === 'Pick what was done.');
check('bad date refused', /YYYY-MM-DD/.test(P.entryProblem({ kind: 'fed', occurredOn: '2026-13-40', today: '2026-09-28' }) ?? ''));
check('words refused as a date', P.entryProblem({ kind: 'fed', occurredOn: 'last week', today: '2026-09-28' }) !== null);
check('future refused', /has not come yet/.test(P.entryProblem({ kind: 'fed', occurredOn: '2026-09-29', today: '2026-09-28' }) ?? ''));
check('today allowed', P.entryProblem({ kind: 'fed', occurredOn: '2026-09-28', today: '2026-09-28' }) === null);
check('past allowed', P.entryProblem({ kind: 'fed', occurredOn: '2025-04-01', today: '2026-09-28' }) === null);

// 3. The Garden Yield band
const planting = (id, food, first) => ({ id, foodName: food, plotName: 'Back bed', plantedOn: '2026-04-01', firstHarvestOn: first });
const care = (plantingId, occurredOn, kind) => ({ plantingId, occurredOn, kind, label: labelFor(kind) });

const none = P.summarizeCareBeforePicking([planting('a', 'Beans', null)], []);
check('nothing picked', none.headline === 'No planting had its first picking in this range.' && !none.hasAnything, none.headline);

const bare = P.summarizeCareBeforePicking([planting('a', 'Beans', '2026-07-01'), planting('b', 'Peas', '2026-06-20')], []);
check('picked with nothing recorded', /^2 plantings were first picked.*nothing recorded/.test(bare.headline) && !bare.hasAnything, bare.headline);

const one = P.summarizeCareBeforePicking(
  [planting('a', 'Beans', '2026-07-01')],
  [care('a', '2026-06-01', 'watered'), care('a', '2026-07-01', 'fed'), care('a', '2026-07-15', 'pruned')],
);
check('one planting headline', one.headline.startsWith('The one planting'), one.headline);
check('after the first picking left out', one.rows[0].line === 'Before its first picking on 2026-07-01: Fed (1), Watered (1).', one.rows[0].line);
check('title names the area', one.rows[0].title === 'Beans, Back bed', one.rows[0].title);
check('caveat present', /cannot say which of them made the difference/.test(one.caveat));

const mixed = P.summarizeCareBeforePicking(
  [planting('a', 'Beans', '2026-07-01'), planting('b', 'Peas', '2026-06-20'), planting('c', 'Kale', null)],
  [care('a', '2026-06-01', 'watered'), care('b', '2026-06-25', 'fed')],
);
check('some with, some without', mixed.headline === '1 of the 2 plantings first picked in this range has a record of what was done beforehand. 1 has none.', mixed.headline);

// 4. Wiring
const growSetup = read('lib/growSetup.ts');
const growSetupDb = read('lib/growSetupDb.ts');
const garden = read('app/(tabs)/garden.tsx');
const db = read('lib/db.ts');
const yieldTs = read('lib/harvestYield.ts');
const yieldDb = read('lib/harvestYieldDb.ts');
const trends = read('app/(tabs)/trends.tsx');
const section = read('components/PlantingEventsSection.tsx');
const changes = read('lib/snapshotChanges.ts');
const progress = read('lib/progressDb.ts');

check('open list declared', /'planting_event_kind'/.test(growSetup) && /planting_event_kind: PLANTING_EVENT_KINDS/.test(growSetup));
check('open list reads the events table', /planting_event_kind: \{ table: 'garden_planting_events', column: 'kind'/.test(growSetupDb));
check('picker is GardenTermField', /<GardenTermField\s+list="planting_event_kind"/.test(section));
check('table created', /CREATE TABLE IF NOT EXISTS garden_planting_events/.test(db));
check('planting delete refuses entries', /FROM garden_planting_events WHERE planting_id = \?/.test(db));
check('section under each planting', /<PlantingEventsSection/.test(garden));
check('Remove hidden with entries', /harvests === 0 && doneEntries === 0/.test(garden));
check('yield summary carries care', /care: CareBand/.test(yieldTs) && /care\.hasAnything/.test(yieldTs));
check('yield reads the events', /listPlantingEventsFor\(/.test(yieldDb));
check('band on Trends', /id="trends:harvest:care"/.test(trends));
check('sync names it', /'garden_planting_events'/.test(changes));
check('garden record days count it', /FROM garden_planting_events/.test(progress));

// 5. Wording
const source = read('lib/plantingEvents.ts');
const builtIns = growSetup.slice(growSetup.indexOf('PLANTING_EVENT_KINDS'), growSetup.indexOf('];', growSetup.indexOf('PLANTING_EVENT_KINDS')));
const strings = [source, builtIns, section]
  .join('\n')
  .match(/'[^'\n]*'|`[^`]*`|>[^<>{}\n]+</g) || [];
const text = strings.join('\n');
const forbidden = [
  /\bshould\b/i, /\bmust\b/i, /\bneeds? to\b/i, /\bideal\b/i, /\boptimal\b/i, /\bbest\b/i, /\bworst\b/i,
  /\bgood\b/i, /\bbad\b/i, /\bcaused?\b/i, /\bbecause of\b/i, /\bimproved?\b/i, /\bwell done\b/i,
  /\bgreat\b/i, /\breal\b/i, /\bgenuine(ly)?\b/i, /—|–| -- /,
];
for (const pattern of forbidden) {
  const hit = strings.find((s) => pattern.test(s));
  check(`no ${pattern}`, !hit, hit);
}
check('text scanned', text.length > 500, String(text.length));

console.log(`${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
