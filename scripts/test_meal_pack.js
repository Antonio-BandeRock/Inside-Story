// Checks lib/mealPack.ts, Pack for tomorrow and standing meals: tomorrow's
// open meals appear only in the evening (or any time on Your Usual Meals),
// a planned meal needs no choosing, a standing meal holds its weekdays and
// leaves them open on the plan, Home's order is planned, packed, standing,
// then the usual list, a meal eaten out never carries a source the schedule
// could log by itself, the reminder times fall where they are said to, and
// every sentence stays clear of verdicts.
// Run: node scripts/test_meal_pack.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

function load(file, deps = {}) {
  const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
    if (deps[name]) return deps[name];
    throw new Error(`${file} imported ${name}`);
  });
  return mod.exports;
}
const o = load('lib/openMeals.ts');
const u = load('lib/usualMeal.ts');
const p = load('lib/mealPack.ts', { './openMeals': o, './usualMeal': u });

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}
const FORBIDDEN = /\b(safe|unsafe|bad|should|must|healthy|unhealthy|real|genuine|genuinely|best|great|well done|streak)\b|[–—]| -- /i;
function clean(label, text) {
  ok(`${label} has no verdict words`, typeof text === 'string' && !FORBIDDEN.test(text), text);
}

function meal(id, fields) {
  return {
    id,
    mealType: 'lunch',
    kind: 'home',
    source: 'typed',
    name: id,
    favoriteId: null,
    sourceMealId: null,
    place: null,
    foods: [],
    lastUsedAt: null,
    createdAt: '2026-09-20T10:00:00.000Z',
    standingWeekdays: [],
    ...fields,
  };
}
function pack(fields) {
  return {
    id: 'pack1',
    date: '2026-09-29',
    mealType: 'lunch',
    kind: 'home',
    source: 'usual',
    usualMealId: 'Soup',
    favoriteId: null,
    sourceMealId: null,
    name: 'Soup in a flask',
    place: null,
    foods: ['Vegetable soup'],
    scheduleItemId: 'sched1',
    prepReminderId: null,
    prepAt: null,
    status: 'planned',
    ...fields,
  };
}

// 2026-09-28 is a Monday, so tomorrow is a Tuesday.
const TODAY = '2026-09-28';
const TUESDAY = '2026-09-29';
const FRIDAY = '2026-10-02';
const workLunch = [{ meal: 'lunch', weekdays: [1, 2, 3, 4, 5] }];
const soup = meal('Soup', { name: 'Soup in a flask', foods: ['Vegetable soup'] });
const friday = meal('Friday bowl', { kind: 'out', place: 'Corner taqueria', standingWeekdays: [5] });
const tuesdayDinner = meal('Taco night', { mealType: 'dinner', standingWeekdays: [2] });

ok('addDays crosses into October', p.addDays('2026-09-30', 1) === '2026-10-01', p.addDays('2026-09-30', 1));

// Standing meals.
ok('standing meal found on its weekday', p.standingMealFor([friday], FRIDAY, 'lunch')?.id === 'Friday bowl');
ok('no standing meal on another weekday', p.standingMealFor([friday], TUESDAY, 'lunch') === null);
const merged = p.withStandingMeals([{ meal: 'lunch', weekdays: [1, 2] }], [friday, tuesdayDinner]);
ok(
  'standing weekdays join the open rule',
  JSON.stringify(merged) ===
    JSON.stringify([
      { meal: 'lunch', weekdays: [1, 2, 5] },
      { meal: 'dinner', weekdays: [2] },
    ]),
  merged,
);
ok('no rules and no standing meals leave nothing open', p.withStandingMeals([], [soup]).length === 0);
const taken = p.takenWeekdays([soup, friday], meal('Other'));
ok('a weekday another lunch holds is taken', taken.get(5) === 'Friday bowl' && taken.size === 1, [...taken]);
ok('a meal does not take its own weekdays', p.takenWeekdays([friday], friday).size === 0);
ok('a dinner does not take a lunch weekday', p.takenWeekdays([tuesdayDinner], meal('X')).size === 0);
ok('standing phrase names the day', p.standingPhrase(friday) === 'Standing lunch on Fridays.', p.standingPhrase(friday));
ok('no standing phrase without days', p.standingPhrase(soup) === null);
clean('standingMealsLine', p.standingMealsLine([friday]));
ok('no standingMealsLine without standing meals', p.standingMealsLine([soup]) === null);

// Tomorrow.
const base = { today: TODAY, nowTime: '19:00', openRules: workLunch, usualMeals: [soup], plannedTomorrow: [], packsTomorrow: [] };
ok('nothing before the evening', p.tomorrowSlots({ ...base, nowTime: '15:59' }).length === 0);
ok('any time shows it before the evening', p.tomorrowSlots({ ...base, nowTime: '09:00', anyTime: true }).length === 1);
let slots = p.tomorrowSlots(base);
ok('an open lunch tomorrow appears', slots.length === 1 && slots[0].slot === 'lunch' && slots[0].date === TUESDAY && !slots[0].pack, slots);
ok('a planned lunch needs no choosing', p.tomorrowSlots({ ...base, plannedTomorrow: ['lunch'] }).length === 0);
ok('nothing when tomorrow is not open', p.tomorrowSlots({ ...base, openRules: [{ meal: 'lunch', weekdays: [5] }] }).length === 0);
slots = p.tomorrowSlots({ ...base, packsTomorrow: [pack()] });
ok('a chosen pack comes back', slots[0]?.pack?.id === 'pack1' && slots[0].standing === null, slots);
slots = p.tomorrowSlots({ ...base, packsTomorrow: [pack({ status: 'skipped' })] });
ok('a skipped pack is not offered again as chosen', slots[0] && slots[0].pack === null, slots);
const standingSlots = p.tomorrowSlots({ ...base, openRules: [], usualMeals: [soup, tuesdayDinner] });
ok(
  'a standing dinner opens tomorrow',
  standingSlots.length === 1 && standingSlots[0].slot === 'dinner' && standingSlots[0].standing?.id === 'Taco night',
  standingSlots,
);
const outSlots = p.tomorrowSlots({ ...base, packsTomorrow: [pack({ kind: 'out', place: 'Cafe' })] });
for (const entry of [...p.tomorrowSlots(base), ...standingSlots, ...outSlots]) {
  clean(`tomorrowCaption ${entry.slot}`, p.tomorrowCaption(entry));
  clean(`tomorrowTitle ${entry.slot}`, p.tomorrowTitle(entry.slot));
}

// What a choice writes.
let row = p.packRowFor({ source: 'usual', meal: friday });
ok('eaten out carries no schedule source', row.scheduleFavoriteId === null && row.scheduleMealId === null, row);
ok('eaten out keeps the eaten-out note', row.scheduleNotes.startsWith('Eaten out.'), row.scheduleNotes);
ok('eaten out keeps its place', row.place === 'Corner taqueria' && row.kind === 'out');
row = p.packRowFor({ source: 'usual', meal: meal('Fav', { source: 'favorite', favoriteId: 'f1' }) });
ok('a saved usual meal schedules from its favorite', row.scheduleFavoriteId === 'f1' && row.usualMealId === 'Fav');
row = p.packRowFor({ source: 'usual', meal: soup });
ok('a typed home meal lists its foods in the note', row.scheduleNotes === `${p.PACKED_NOTE} Vegetable soup.`, row.scheduleNotes);
row = p.packRowFor({ source: 'favorite', favoriteId: 'f2', name: 'Rice bowl' });
ok('a saved meal is from home', row.kind === 'home' && row.scheduleFavoriteId === 'f2' && row.name === 'Rice bowl');
row = p.packRowFor({ source: 'leftovers', dinnerName: 'Chili', dinnerId: 'm9' });
ok('leftovers name the dinner', row.name === 'Leftovers: Chili' && row.scheduleMealId === 'm9', row);
ok('leftovers without a dinner', p.leftoversName(null) === "Tonight's leftovers");
row = p.packRowFor({ source: 'typed', name: '  Pho  ', kind: 'out', place: ' Pho place ', foods: [] });
ok('typed out trims name and place', row.name === 'Pho' && row.place === 'Pho place' && row.scheduleMealId === null, row);
row = p.packRowFor({ source: 'typed', name: 'Wrap', kind: 'home', place: 'ignored', foods: ['Tortilla'] });
ok('typed home has no place', row.place === null && row.foods[0] === 'Tortilla', row);

// Reminder times.
let opts = p.prepOptions(TODAY, '18:00', '12:30');
ok('early evening offers 8pm and 7am', opts.map((x) => x.scheduledFor).join() === `${TODAY}T20:00,${TUESDAY}T07:00`, opts);
opts = p.prepOptions(TODAY, '21:07', '12:30');
ok('after 8 offers half an hour', opts[0].key === 'soon' && opts[0].scheduledFor === `${TODAY}T21:40`, opts);
opts = p.prepOptions(TODAY, '23:30', '12:30');
ok('late at night offers only the morning', opts.length === 1 && opts[0].key === 'morning', opts);
opts = p.prepOptions(TODAY, '18:00', '06:45');
ok('an early meal moves the morning reminder earlier', opts[1].scheduledFor === `${TUESDAY}T06:15`, opts);
opts = p.prepOptions(TODAY, '18:00', '04:30');
ok('the morning reminder is never before 5', opts[1].scheduledFor === `${TUESDAY}T05:00`, opts);
for (const opt of p.prepOptions(TODAY, '18:00', null)) clean(`prep option ${opt.key}`, opt.label);

// Home's order: planned, packed, standing, then the usual list.
const usualTimes = { breakfast: '08:00', lunch: '12:30', dinner: '19:00' };
function card(extra) {
  return u.usualMealsCard({
    history: [],
    today: TUESDAY,
    nowTime: '12:15',
    usualTimes,
    plannedToday: [],
    dismissed: null,
    usualMeals: [soup, friday],
    openToday: ['lunch'],
    packsToday: [],
    ...extra,
  });
}
let c = card({ packsToday: [pack()] });
ok('a pack comes before everything but the plan', c && c.packed?.id === 'pack1' && c.standing === null, c);
c = card({ plannedToday: ['lunch'], packsToday: [pack()] });
ok('a planned lunch hides the card', c === null, c);
c = card({ packsToday: [pack({ status: 'logged' })] });
ok('a logged pack is not offered again', c === null || !c.packed, c);
c = card({ today: FRIDAY });
ok('a standing meal comes on its day', c && c.standing?.id === 'Friday bowl' && !c.packed, c);
c = card({ today: FRIDAY, packsToday: [pack({ date: FRIDAY, status: 'skipped' })] });
ok('a skipped pack does not bring the standing meal back', c && c.standing === null, c);
c = card({ today: FRIDAY, dismissed: u.standingDismissKeyFor(FRIDAY, 'lunch') });
ok('Had something else puts the standing meal away for the day', c && c.standing === null, c);
c = card({});
ok('with nothing chosen the usual list shows', c && !c.packed && !c.standing && c.home.length + c.out.length > 0, c);

// Sentences.
for (const pk of [pack(), pack({ kind: 'out', place: 'Corner taqueria' })]) {
  clean('packedTitle', p.packedTitle(pk));
  clean('packedCaption', p.packedCaption(pk));
}
clean('standingTitle', p.standingTitle(friday));
clean('standingCaption', p.standingCaption(friday, FRIDAY));
clean('prepReminderTitle', p.prepReminderTitle('lunch', 'Soup'));
clean('prepSetSentence', p.prepSetSentence(`${TODAY}T20:00`));
clean('NO_SAVED_MEALS', p.NO_SAVED_MEALS);
clean('PACKED_NOTE', p.PACKED_NOTE);

if (failures > 0) {
  console.log(`test_meal_pack: ${failures} failed`);
  process.exit(1);
}
console.log('test_meal_pack: all passed');
