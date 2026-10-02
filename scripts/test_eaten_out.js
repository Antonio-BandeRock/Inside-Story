// Checks lib/eatenOut.ts, G9: a meal eaten out is read the same way
// whether it was marked by the columns or by the older "Eaten out." note;
// every caption says the foods listed are a stand-in, or that nothing is
// known, and that a food without an amount adds nothing; the day and
// Pattern Finder lines count what they say they count; recent places come
// back once each, newest first; and every sentence stays clear of verdicts.
// Run: node scripts/test_eaten_out.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function load(file) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    throw new Error(`${file} imported ${name}`);
  });
  return mod.exports;
}
const e = load('lib/eatenOut.ts');
const u = load('lib/usualMeal.ts');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}

const FORBIDDEN = /\b(safe|unsafe|bad|should|must|healthy|unhealthy|real|genuine|genuinely|best|great|cause|caused|causes|because of|trigger|triggered)\b|[–—]| -- /i;
const sentences = [];
function clean(label, text) {
  sentences.push(text);
  ok(`${label} has no verdict words`, typeof text === 'string' && !FORBIDDEN.test(text), text);
}

// The note, both ways, and agreeing with the copy usual meals writes.
ok('note without a place', e.eatenOutNote() === 'Eaten out.');
ok('note with a place', e.eatenOutNote(' Luigi’s ') === 'Eaten out. Luigi’s.');
ok('note matches usual meals', e.eatenOutNote('Taco Stand') === u.eatenOutNote('Taco Stand'));
ok('parse a bare note', JSON.stringify(e.parseEatenOutNote('Eaten out.')) === JSON.stringify({ place: null }));
ok('parse a note with a place', e.parseEatenOutNote(e.eatenOutNote('Taco Stand')).place === 'Taco Stand');
ok('parse an ordinary note', e.parseEatenOutNote('Left half for tomorrow') === null);
ok('parse nothing', e.parseEatenOutNote(null) === null);

// Columns first, the note second.
const fromColumns = e.eatenOutOf({ eaten_out: 1, eaten_out_place: ' Pho 88 ', eaten_out_how: 'takeaway', notes: null });
ok('columns read', fromColumns.eatenOut && fromColumns.place === 'Pho 88' && fromColumns.how === 'takeaway', fromColumns);
const odd = e.eatenOutOf({ eaten_out: 1, eaten_out_place: '', eaten_out_how: 'drive-in' });
ok('an unknown how reads as none', odd.eatenOut && odd.how === null && odd.place === null, odd);
const fromNote = e.eatenOutOf({ eaten_out: 0, notes: 'Eaten out. Cafe Rio.' });
ok('note read when columns are off', fromNote.eatenOut && fromNote.place === 'Cafe Rio' && fromNote.how === null, fromNote);
ok('a meal at home', !e.eatenOutOf({ eaten_out: 0, notes: 'Dinner' }).eatenOut);

// Names.
ok('name, restaurant', e.eatenOutMealName('Pho 88', 'restaurant') === 'Eaten out at Pho 88');
ok('name, takeaway', e.eatenOutMealName('Pho 88', 'takeaway') === 'Takeaway from Pho 88');
ok('name, someone', e.eatenOutMealName('Mum', 'someone') === 'Cooked by Mum');
ok('name, no place', e.eatenOutMealName('  ', null) === 'Eaten out');
ok('name, takeaway no place', e.eatenOutMealName(null, 'takeaway') === 'Takeaway or delivery');
ok('three hows', e.EATEN_OUT_HOWS.length === 3 && e.EATEN_OUT_HOWS.every((h) => e.isEatenOutHow(h.key)));

// Captions.
const none = e.eatenOutCaption({ place: 'Pho 88', how: 'restaurant', itemCount: 0, unmeasured: 0 });
ok('nothing listed says not known', /not known/.test(none), none);
clean('caption, nothing listed', none);
const all = e.eatenOutCaption({ place: null, how: 'takeaway', itemCount: 3, unmeasured: 0 });
ok('measured says stand-in', /stand-in/.test(all) && !/adds? nothing/.test(all), all);
clean('caption, measured', all);
const noAmounts = e.eatenOutCaption({ place: null, how: null, itemCount: 2, unmeasured: 2 });
ok('no amounts add nothing', /no amounts/.test(noAmounts) && /add nothing/.test(noAmounts), noAmounts);
clean('caption, no amounts', noAmounts);
const some = e.eatenOutCaption({ place: 'Mum', how: 'someone', itemCount: 4, unmeasured: 1 });
ok('some unmeasured counted', /1 of 4/.test(some) && /Cooked by Mum/.test(some), some);
clean('caption, some unmeasured', some);

// The day line.
ok('no meals out, no line', e.eatenOutDayLine([]) === null);
const oneDay = e.eatenOutDayLine([{ mealName: 'Eaten out at Pho 88', itemCount: 0, unmeasured: 0 }]);
ok('one meal named', /^Eaten out at Pho 88 was eaten out/.test(oneDay), oneDay);
ok('one meal, nothing listed says adds nothing', /Nothing in it was listed/.test(oneDay), oneDay);
clean('day line, one', oneDay);
const twoDay = e.eatenOutDayLine([
  { mealName: 'Takeaway from Pho 88', itemCount: 0, unmeasured: 0 },
  { mealName: 'Cooked by Mum', itemCount: 3, unmeasured: 2 },
]);
ok('two meals counted', /^2 meals that day/.test(twoDay) && /1 had nothing listed/.test(twoDay) && /2 foods listed without an amount add nothing/.test(twoDay), twoDay);
clean('day line, two', twoDay);
const oneUnmeasured = e.eatenOutDayLine([{ mealName: 'Lunch out', itemCount: 2, unmeasured: 1 }]);
ok('one food without an amount, singular', /1 food listed without an amount adds nothing/.test(oneUnmeasured), oneUnmeasured);
clean('day line, singular', oneUnmeasured);

// Pattern Finder.
ok('no flares after a meal out, no line', e.eatenOutPatternLine(5, 0, 24) === null);
ok('no flares, no line', e.eatenOutPatternLine(0, 0, 24) === null);
const pattern = e.eatenOutPatternLine(6, 2, 24);
ok('pattern line counts', /^2 of the 6 flares came within 24 hours/.test(pattern), pattern);
clean('pattern line', pattern);
clean('pattern line, other word', e.eatenOutPatternLine(3, 1, 48, 'headaches'));

const meals = ['2026-09-20T12:30', '2026-09-25T19:00'];
ok('flare inside the window', e.flaresAfterEatenOut(['2026-09-21T08:00'], meals, 24) === 1);
ok('flare outside the window', e.flaresAfterEatenOut(['2026-09-22T08:00'], meals, 24) === 0);
ok('flare before the meal', e.flaresAfterEatenOut(['2026-09-20T11:00'], meals, 24) === 0);
ok('each flare once', e.flaresAfterEatenOut(['2026-09-25T20:00', '2026-09-26T07:00', 'not a date'], meals, 24) === 2);

// Recent places.
const places = e.recentPlaces(['Pho 88', ' pho 88 ', null, '', 'Cafe Rio', 'Mum', 'CAFE RIO', 'A', 'B', 'C', 'D'], 5);
ok('places once each, newest first, limited', JSON.stringify(places) === JSON.stringify(['Pho 88', 'Cafe Rio', 'Mum', 'A', 'B']), places);

// The text on the screen that logs it, swept with the same words.
const view = fs.readFileSync(path.join(__dirname, '..', 'components/FindMealView.tsx'), 'utf8');
const band = view.slice(view.indexOf('function renderEatenOutBand'), view.indexOf('function renderList'));
ok('the band exists', band.length > 100);
for (const literal of band.match(/>([^<>{}]{12,})</g) || []) clean('band text', literal.slice(1, -1).trim());

if (failures > 0) {
  console.log(`${failures} failure(s)`);
  process.exit(1);
}
console.log(`eatenOut: all checks passed (${sentences.length} sentences swept)`);
