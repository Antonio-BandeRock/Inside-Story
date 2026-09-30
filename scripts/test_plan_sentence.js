// Checks lib/planSentence.ts (C9, plan by sentence) against sentences written
// the way people say them. "now" is fixed at Wednesday 30 September 2026,
// 10:00 local, so every expected date is known.
//
// Two sets. The TUNED set is what the reader was built against. The HELD-OUT
// set was written separately and is never adjusted to make it pass: a miss
// there is reported as a measurement, not fixed by editing the sentence.
// Run: node scripts/test_plan_sentence.js
/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const cache = {};
function load(rel) {
  const file = path.join(__dirname, '..', 'lib', `${rel}.ts`);
  if (cache[file]) return cache[file];
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const m = { exports: {} };
  cache[file] = m.exports;
  new Function('module', 'exports', 'require', outputText)(m, m.exports, (name) => {
    if (name.startsWith('./')) return load(name.slice(2));
    throw new Error(`lib/planSentence.ts must stay pure, asked for ${name}`);
  });
  cache[file] = m.exports;
  return m.exports;
}
const P = load('planSentence');
const NOW = new Date(2026, 8, 30, 10, 0);

// node scripts/test_plan_sentence.js "some sentence" prints its reading.
if (process.argv[2]) {
  console.log(JSON.stringify(P.readPlanSentence(process.argv[2], NOW, {}), null, 1));
  process.exit(0);
}
const vocab = { growing: ['Tomatoes', 'Lettuce', 'Basil'], gardenAreas: ['Back bed'], meds: ['Levothyroxine'] };

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) pass++;
  else {
    fail++;
    console.log('FAIL', name, detail ?? '');
  }
}

// Each case: sentence and what must be true. Keys: date, time, kind, action,
// type, weekdays, interval, endType, until, count, assumed, blocked,
// unsettled (substring expected in some unsettled line), none (reads as null).
const TUNED = [
  ['dentist next Tuesday at 3', { date: '2026-10-06', time: '15:00', kind: 'appointment', action: 'Dentist', type: 'none' }],
  ['water the tomatoes every Friday', { date: '2026-10-02', time: '09:00', assumed: true, kind: 'garden', type: 'weekly', weekdays: [5] }],
  ['pay rent on the 1st of every month', { date: '2026-10-01', type: 'monthly', interval: 1, kind: 'reminder', action: 'Pay rent' }],
  ['take vitamin D every day at 8am', { date: '2026-10-01', time: '08:00', type: 'daily', kind: 'reminder', unsettled: 'My Meds' }],
  ['physio every Tuesday at 10 for 6 weeks', { date: '2026-10-06', time: '10:00', type: 'weekly', endType: 'until_date', until: '2026-11-16', kind: 'reminder' }],
  ['gym Mondays Wednesdays and Fridays at 6pm', { date: '2026-09-30', time: '18:00', type: 'weekly', weekdays: [1, 3, 5], action: 'Gym' }],
  ['every weekday at 7:30 walk the dog', { date: '2026-10-01', time: '07:30', type: 'weekly', weekdays: [1, 2, 3, 4, 5], action: 'Walk the dog' }],
  ['mow the lawn every 2 weeks on Saturday', { date: '2026-10-03', type: 'weekly', interval: 2, weekdays: [6], kind: 'garden' }],
  ['water seedlings every other day', { date: '2026-10-01', time: '09:00', type: 'every_n_days', interval: 2, kind: 'garden' }],
  ['anniversary dinner 14 Feb every year', { date: '2027-02-14', type: 'monthly', interval: 12, action: 'Anniversary dinner' }],
  ['call the dentist tomorrow', { date: '2026-10-01', kind: 'reminder', action: 'Call the dentist' }],
  ['doctor today at 8', { blocked: true }],
  ['buy milk', { none: true }],
  ['biweekly team meeting', { unsettled: 'biweekly', type: 'none' }],
  ['3/10 dentist', { unsettled: '3/10' }],
  ['prune the roses in March', { unsettled: 'March' }],
  ['therapy session every Thursday at 4 until 18 December', { date: '2026-10-01', time: '16:00', type: 'weekly', weekdays: [4], endType: 'until_date', until: '2026-12-18' }],
  ['Friday evening at 7', { date: '2026-10-02', time: '19:00', blocked: true }],
  ['harvest the lettuce this weekend', { kind: 'garden', action: 'Harvest the lettuce' }],
  ['vet appointment for Max on the 15th at 11', { date: '2026-10-15', time: '11:00', kind: 'appointment' }],
  ['pay the water bill on the 20th', { date: '2026-10-20', kind: 'reminder', action: 'Pay the water bill' }],
];

// Written apart from the reader, never edited to pass.
const HELD_OUT = [
  ['remind me to renew my passport on 12 November', { date: '2026-11-12', kind: 'reminder', action: 'Renew my passport' }],
  ['blood test Monday at 8:15am', { date: '2026-10-05', time: '08:15', kind: 'appointment' }],
  ['feed the sourdough starter every 3 days', { type: 'every_n_days', interval: 3 }],
  ['book club every other Thursday at 7pm', { date: '2026-10-01', time: '19:00', type: 'weekly', interval: 2, weekdays: [4] }],
  ['check the smoke alarms every 6 months', { type: 'monthly', interval: 6, kind: 'reminder' }],
  ['bins out every Tuesday night', { time: '21:00', type: 'weekly', weekdays: [2] }],
  ['sow the carrots next Saturday morning', { date: '2026-10-03', time: '09:00', kind: 'garden' }],
  ['endocrinologist on 4 November at 2:30pm', { date: '2026-11-04', time: '14:30', kind: 'appointment' }],
  ['pick up the prescription tomorrow afternoon', { date: '2026-10-01', time: '15:00', kind: 'reminder' }],
  ['stretch every morning for 2 weeks', { type: 'daily', time: '09:00', endType: 'until_date' }],
  ['call mum on Sundays at 5', { time: '17:00', type: 'weekly', weekdays: [0], kind: 'reminder' }],
  ['water the back bed every morning at 6:30', { time: '06:30', type: 'daily', kind: 'garden' }],
  ['twice a week yoga', { unsettled: 'which days', type: 'none' }],
  ['take levothyroxine every day at 6am', { time: '06:00', type: 'daily', unsettled: 'My Meds' }],
  ['dentist checkup in 2 weeks', { date: '2026-10-14', kind: 'appointment' }],
  ['quarterly tax payment on the 15th', { type: 'monthly', interval: 3, date: '2026-10-15' }],
  ['change the furnace filter monthly', { type: 'monthly', kind: 'reminder' }],
  ['piano lesson every Wednesday at 4 for 10 times', { type: 'weekly', count: 10, endType: 'count' }],
  ['what a lovely day', { none: true }],
  ['order more coffee beans on friday', { date: '2026-10-02', kind: 'reminder' }],
];

function evaluate(set, label) {
  let right = 0;
  const misses = [];
  for (const [text, want] of set) {
    const r = P.readPlanSentence(text, NOW, vocab);
    const wrong = [];
    if (want.none) {
      if (r !== null) wrong.push(`expected nothing, got ${JSON.stringify(r && r.start)}`);
    } else if (!r) {
      wrong.push('read as nothing');
    } else {
      if (want.date && r.start?.date !== want.date) wrong.push(`date ${r.start?.date} not ${want.date}`);
      if (want.time && r.start?.time !== want.time) wrong.push(`time ${r.start?.time} not ${want.time}`);
      if (want.kind && r.kind !== want.kind) wrong.push(`kind ${r.kind} not ${want.kind}`);
      if (want.action && r.action !== want.action) wrong.push(`action "${r.action}" not "${want.action}"`);
      if (want.type && r.repeat.type !== want.type) wrong.push(`repeat ${r.repeat.type} not ${want.type}`);
      if (want.weekdays && JSON.stringify(r.repeat.weekdays) !== JSON.stringify(want.weekdays)) wrong.push(`weekdays ${JSON.stringify(r.repeat.weekdays)}`);
      if (want.interval && (r.repeat.interval ?? 1) !== want.interval) wrong.push(`interval ${r.repeat.interval}`);
      if (want.endType && r.repeat.endType !== want.endType) wrong.push(`end ${r.repeat.endType}`);
      if (want.until && r.repeat.until !== want.until) wrong.push(`until ${r.repeat.until}`);
      if (want.count && r.repeat.count !== want.count) wrong.push(`count ${r.repeat.count}`);
      if (want.assumed !== undefined && r.timeAssumed !== want.assumed) wrong.push(`assumed ${r.timeAssumed}`);
      if (want.blocked !== undefined && Boolean(r.blocked) !== want.blocked) wrong.push(`blocked ${r.blocked}`);
      if (want.unsettled && !r.unsettled.some((line) => line.includes(want.unsettled))) wrong.push(`no unsettled line with "${want.unsettled}": ${JSON.stringify(r.unsettled)}`);
    }
    if (wrong.length === 0) right++;
    else misses.push(`  "${text}": ${wrong.join('; ')}`);
  }
  console.log(`${label}: ${right} of ${set.length} read as expected`);
  for (const miss of misses) console.log(miss);
  return { right, total: set.length, misses };
}

const tuned = evaluate(TUNED, 'Tuned set');
check('every tuned sentence reads as expected', tuned.misses.length === 0);
const held = evaluate(HELD_OUT, 'Held-out set');
// The bar on sentences it never saw: nine in ten.
check('held-out at least 90%', held.right / held.total >= 0.9, `${held.right}/${held.total}`);

// Nothing is saved on its own, and every reading can say what it is.
for (const [text] of [...TUNED, ...HELD_OUT]) {
  const r = P.readPlanSentence(text, NOW, vocab);
  if (!r) continue;
  if (r.start) {
    check(`when is described: ${text}`, P.describePlanWhen(r, NOW).length > 0);
    check(`scheduledFor shape: ${text}`, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(P.planScheduledFor(r)));
  }
  check(`kind reason: ${text}`, r.kindReason.length > 0);
  for (const kind of P.PLAN_KINDS) check(`save label: ${text} ${kind}`, P.planSaveLabel(r, kind).startsWith('Save'));
}

// The wording never uses a dash as punctuation, and never scores.
const FORBIDDEN = /[–—]| -- |\b(?:real|genuine|genuinely|great job|well done|streak)\b/i;
for (const [text] of [...TUNED, ...HELD_OUT]) {
  const r = P.readPlanSentence(text, NOW, vocab);
  if (!r) continue;
  const lines = [r.kindReason, ...r.unsettled, r.blocked ?? '', ...r.pieces.map((p) => p.reads), r.start ? P.describePlanWhen(r, NOW) : ''];
  for (const line of lines) check(`wording: ${line}`, !FORBIDDEN.test(line), line);
}

const repeating = P.readPlanSentence('physio every Tuesday at 10 for 6 weeks', NOW, vocab);
check('repeating visit button names the first visit', P.planSaveLabel(repeating, 'appointment') === 'Save the first visit as an appointment');
console.log(P.describePlanWhen(repeating, NOW));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
