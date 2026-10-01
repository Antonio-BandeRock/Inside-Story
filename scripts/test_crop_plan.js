// Runs lib/cropPlan.ts: My Crops, 2026-10-01.
//
// The rules checked:
//
//  1. A chosen crop raises a get-ready reminder a week before each window
//     and a sowing reminder on the day it opens, and nothing past the reach.
//  2. Prepped quiets the get-ready reminder for that window; Sown quiets both.
//  3. An indoor area is reminded only of starting seed indoors, and a crop
//     with nothing to wait for says so rather than inventing a season.
//  4. The id a notification carries comes back to the same crop and window.
//  5. The wiring: two dated kinds, on by default, answerable on the
//     notification, opening the Sowing Calendar, read from chosen crops only.
//  6. No dashes and no verdict words.
//
// Run with: node scripts/test_crop_plan.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadModule(relPath, deps = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name in deps) return deps[name];
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

const N = loadModule('lib/plantNutrients.ts');
const P = loadModule('lib/cropProblems.ts', { './plantNutrients': N });
const G = loadModule('lib/cropGuides.ts', { './plantNutrients': N, './cropProblems': P });
const F = loadModule('lib/frostDates.ts');
const S = loadModule('lib/sowingWindows.ts', { './frostDates': F });
const C = loadModule('lib/cropPlan.ts', { './cropGuides': G, './sowingWindows': S });

let passed = 0;
let failed = 0;
function check(label, ok) {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}

const north = { kind: 'frost', southern: false, lastHalf: 288, lastNineInTen: 298, firstHalf: 105 };
const frostFree = { kind: 'frostFree', southern: false, frostYears: 0, seasons: 30 };

const outdoor = { id: 'p1', cropKey: 'lettuce', plotId: 'a1', plotName: 'Back bed', plotLocation: 'outdoor', plotArchived: false };
const today = '2027-02-01';

// 1. Reminders.
const rs = C.cropPlanReminders([outdoor], [], north, today);
const prep = rs.filter((r) => r.kind === 'cropPrep');
const sow = rs.filter((r) => r.kind === 'cropSow');
check('a chosen crop raises reminders', prep.length > 0 && sow.length > 0);
for (const r of sow) {
  const parsed = C.parseCropStepSourceId(r.sourceId);
  check(`sowing reminder lands on its window ${r.dueOn}`, parsed && parsed.windowStart === r.dueOn);
  const pair = prep.find((p) => p.sourceId === r.sourceId);
  check(`get-ready comes a week ahead of ${r.dueOn}`, pair && pair.dueOn === S.addDaysToDate(r.dueOn, -C.PREP_LEAD_DAYS));
}
const horizon = S.addDaysToDate(today, C.PLAN_AHEAD_DAYS);
check('nothing past the reach', sow.every((r) => r.dueOn <= horizon));
check('the get-ready line names the area', prep.some((r) => r.detail.includes('Back bed')));
check('no crops, no reminders', C.cropPlanReminders([], [], north, today).length === 0);

// 2. Steps quiet them.
const first = sow[0];
const w = C.parseCropStepSourceId(first.sourceId);
const prepped = [{ id: 's1', planId: 'p1', action: w.action, windowStart: w.windowStart, step: 'prepped', doneOn: today }];
const afterPrep = C.cropPlanReminders([outdoor], prepped, north, today);
check('Prepped quiets get-ready for that window', !afterPrep.some((r) => r.kind === 'cropPrep' && r.sourceId === first.sourceId));
check('Prepped leaves the sowing reminder', afterPrep.some((r) => r.kind === 'cropSow' && r.sourceId === first.sourceId));
const sown = [{ ...prepped[0], id: 's2', step: 'sown' }];
const afterSow = C.cropPlanReminders([outdoor], sown, north, today);
check('Sown quiets both for that window', !afterSow.some((r) => r.sourceId === first.sourceId));
check('another crop is untouched by a step', C.cropPlanReminders([{ ...outdoor, id: 'p2' }], sown, north, today).some((r) => r.sourceId.startsWith('p2~')));

// The row.
const row = C.cropRowState(outdoor, [], north, today);
check('the row names the next window', row.kind === 'next' && row.line.length > 0);
const rowSown = C.cropRowState(outdoor, sown, north, today);
check('the row moves past a sown window', rowSown.kind === 'next' && (rowSown.window.start !== w.windowStart || rowSown.sown));
check('no place says where to save one', C.cropRowState(outdoor, [], null, today).line.includes('My Zone'));

// 3. Indoors.
const indoor = { ...outdoor, id: 'p3', plotLocation: 'indoor' };
const indoorRs = C.cropPlanReminders([indoor], [], north, today);
check('indoors is reminded only of starting seed', indoorRs.every((r) => C.parseCropStepSourceId(r.sourceId).action === 'indoors'));
const indoorFF = C.cropRowState({ ...indoor, cropKey: 'garlic' }, [], frostFree, '2026-10-01');
check('a crop with no indoor window says there is nothing to wait for', indoorFF.kind === 'noWindows' && indoorFF.line.includes('no season'));
const ff = C.cropPlanReminders([{ ...outdoor, cropKey: 'lettuce' }], [], frostFree, '2026-10-01');
check('a frost-free place still gets reminders', ff.length > 0);

// 4. Ids.
const id = C.cropStepSourceId('crop_plan_1_abc', 'direct', '2027-03-04');
const back = C.parseCropStepSourceId(id);
check('an id comes back whole', back && back.planId === 'crop_plan_1_abc' && back.action === 'direct' && back.windowStart === '2027-03-04');
check('a broken id is refused', C.parseCropStepSourceId('x~nope~2027-03-04') === null && C.parseCropStepSourceId('x') === null);

// 5. Wiring.
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const schedule = read('lib/reminderSchedule.ts');
check('two dated kinds', schedule.includes("| 'cropPrep'") && schedule.includes("| 'cropSow'"));
const prefs = read('lib/reminderPreferences.ts');
check('both on by default', prefs.includes('cropPrep: true,') && prefs.includes('cropSow: true,'));
const sources = read('lib/reminderSources.ts');
check('read from chosen crops', sources.includes('cropPlanReminders(plans, steps, anchor, today)') && sources.includes("lens: 'sowingCalendar'"));
check('never fetched in the background', !/getFrostDates\(/.test(sources));
const notes = read('lib/reminderNotifications.ts');
check('a press records the step', notes.includes("plan.write === 'cropStep'") && notes.includes('recordCropStep(parsed.planId'));
const db = read('lib/db.ts');
check('the tables exist', db.includes('CREATE TABLE IF NOT EXISTS garden_crop_plans') && db.includes('CREATE TABLE IF NOT EXISTS garden_crop_plan_steps'));
check('an area with a crop planned for it holds records', db.includes('SELECT COUNT(*) AS n FROM garden_crop_plans WHERE plot_id = ?') || /garden_crop_plans WHERE plot_id = \?/.test(db));
const lens = read('components/SowingCalendarLens.tsx');
check('My Crops is on the Sowing Calendar', lens.includes('<MyCropsBand'));

// 6. Words.
const said = [...rs.map((r) => r.detail), row.line, indoorFF.line, C.cropRowState(outdoor, [], null, today).line];
const band = read('components/MyCropsBand.tsx');
for (const text of [...said, ...(band.match(/>[^<>{}]+</g) || [])]) {
  check(`no verdict words: ${text.slice(0, 60)}`, !/\b(must|should|ideal|optimal|best time)\b/i.test(text));
  check(`no dashes: ${text.slice(0, 60)}`, !/[–—]| -- /.test(text));
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
