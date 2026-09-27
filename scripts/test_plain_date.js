// Checks lib/plainDate.ts (C4 of the competitive build plan, Phase 2,
// 2026-09-26): dates read out of plain words, and the note splitting in
// lib/captureNotes.ts that C6 and C7 use. Pure, so it runs here rather than
// on a phone. Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath, stubs = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (name in stubs) return stubs[name];
    throw new Error(`${relPath} must stay free of runtime imports (${name})`);
  });
  return module.exports;
}

const p = load('lib/plainDate.ts');
const c = load('lib/captureNotes.ts');

let failures = 0;
let total = 0;
function check(name, actual, expected) {
  total += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.log(`FAIL  ${name}\n      expected ${e}\n      got      ${a}`);
  }
}

// Tuesday 2026-09-22, 10:00 local.
const tue = new Date(2026, 8, 22, 10, 0, 0);
const first = (text, lean, now = tue) => {
  const found = p.readPlainDates(text, now, lean)[0];
  return found ? [found.date, found.time] : null;
};

// --- Days -----------------------------------------------------------------------
check('today', first('call mum today'), ['2026-09-22', null]);
check('tomorrow', first('Dentist tomorrow'), ['2026-09-23', null]);
check('day after tomorrow', first('the day after tomorrow'), ['2026-09-24', null]);
check('yesterday leans back', first('paid it yesterday', 'past'), ['2026-09-21', null]);
check('tonight is seven', first('ring Ana tonight'), ['2026-09-22', '19:00']);
check('bare Friday is this week', first('Call the dentist Friday'), ['2026-09-25', null]);
check('this Friday is this week', first('this friday'), ['2026-09-25', null]);
check('next Friday skips this week', first('next Friday'), ['2026-10-02', null]);
check('next Monday is the coming one', first('next monday'), ['2026-09-28', null]);
check('bare Tuesday on a Tuesday is next week', first('bins tuesday'), ['2026-09-29', null]);
check('last Friday leans back', first('last friday', 'past'), ['2026-09-18', null]);
check('Friday leaning back', first('did it friday', 'past'), ['2026-09-18', null]);
check('this weekend', first('clean the garage this weekend'), ['2026-09-26', null]);
check('next week is Monday', first('next week'), ['2026-09-28', null]);
check('next month is the first', first('next month'), ['2026-10-01', null]);
check('in 3 days', first('in 3 days'), ['2026-09-25', null]);
check('in two weeks', first('in two weeks'), ['2026-10-06', null]);
check('in a month', first('in a month'), ['2026-10-22', null]);
check('in a month from the 31st', first('in a month', 'future', new Date(2027, 0, 31, 9)), ['2027-02-28', null]);
check('in 2 years', first('in 2 years'), ['2028-09-22', null]);
check('three days ago', first('three days ago', 'past'), ['2026-09-19', null]);

// --- Named dates ------------------------------------------------------------------
check('3 October', first('passport photo 3 October'), ['2026-10-03', null]);
check('October 3rd', first('October 3rd'), ['2026-10-03', null]);
check('3rd of Oct 2027', first('3rd of Oct 2027'), ['2027-10-03', null]);
check('Oct 3, 2027', first('Oct 3, 2027'), ['2027-10-03', null]);
check('March 3 is next year', first('renew by March 3'), ['2027-03-03', null]);
check('March 3 leaning back is this year', first('done on March 3', 'past'), ['2026-03-03', null]);
check('December 25 leaning back is last year', first('December 25', 'past'), ['2025-12-25', null]);
check('31 February is nothing', first('31 February'), null);
check('the 15th coming', first('pay rent the 15th'), ['2026-10-15', null]);
check('the 30th this month', first('the 30th'), ['2026-09-30', null]);
check('the 31st skips September', first('the 31st'), ['2026-10-31', null]);
check('ISO date', first('expires 2031-03-03'), ['2031-03-03', null]);

// --- Times ------------------------------------------------------------------------
check('Friday at 3 is afternoon', first('dentist Friday at 3'), ['2026-09-25', '15:00']);
check('at 9 is morning', first('tomorrow at 9'), ['2026-09-23', '09:00']);
check('3:30pm', first('Friday 3:30pm'), ['2026-09-25', '15:30']);
check('3:30 p.m.', first('Friday 3:30 p.m.'), ['2026-09-25', '15:30']);
check('12am is midnight', first('tomorrow 12am'), ['2026-09-23', '00:00']);
check('15:00', first('Friday 15:00'), ['2026-09-25', '15:00']);
check('noon', first('lunch Friday noon'), ['2026-09-25', '12:00']);
check('Friday morning', first('Friday morning'), ['2026-09-25', '09:00']);
check('time only, still ahead, is today', first('at 3pm'), ['2026-09-22', '15:00']);
check('time only, gone by, is tomorrow', first('at 8am'), ['2026-09-23', '08:00']);
check('in 20 minutes', first('move the laundry in 20 minutes'), ['2026-09-22', '10:20']);
check('in an hour', first('in an hour'), ['2026-09-22', '11:00']);
check('at 3 days is not a time', first('at 3 days'), null);

// --- Words that are not dates -------------------------------------------------------
check('may is a verb', first('I may call'), null);
check('march is a verb', first('march on'), null);
check('sat is a word', first('sat down with the post'), null);
check('3/10 is left alone', first('3/10'), null);
check('nothing is nothing', p.readPlainDates('', tue), []);

// --- Several dates, the field reader, the words --------------------------------------
check('two dates in order', p.readPlainDates('Friday or next Monday', tue).map((d) => d.date), ['2026-09-25', '2026-09-28']);
check('the same day once', p.readPlainDates('tomorrow, tomorrow', tue).length, 1);
check('matched keeps the words', p.readPlainDates('Call the dentist Friday at 3', tue)[0].matched, 'Friday');
check('field leaves a written date alone', p.readPlainDateField('2026-10-03', tue, 'future'), null);
check('field reads words', p.readPlainDateField('next friday', tue, 'future').date, '2026-10-02');
check('describe today with time', p.describePlainDate({ date: '2026-09-22', time: '15:00', matched: '' }, tue), 'Today at 3:00 PM');
check('describe tomorrow', p.describePlainDate({ date: '2026-09-23', time: null, matched: '' }, tue), 'Tomorrow');
check('describe a day', p.describePlainDate({ date: '2026-10-03', time: null, matched: '' }, tue), 'Saturday 3 October');
check('describe another year', p.describePlainDate({ date: '2031-03-03', time: '09:30', matched: '' }, tue), 'Monday 3 March 2031 at 9:30 AM');
check('to a reminder, no time', p.plainDateToLocalDateTime({ date: '2026-10-03', time: null, matched: '' }), '2026-10-03T09:00');
check('days from today', p.daysFromToday({ date: '2026-10-03', time: null, matched: '' }, tue), 11);

// --- Splitting a note ---------------------------------------------------------------
check('routine with a heading', c.splitCaptureNote('Morning: pills, water the plants and feed the cat'), { heading: 'Morning', items: ['pills', 'water the plants', 'feed the cat'] });
check('then splits', c.splitCaptureNote('shower then dress then coffee'), { heading: null, items: ['shower', 'dress', 'coffee'] });
check('a time colon is not a heading', c.splitCaptureNote('call at 3:30, then email').heading, null);
check('and kept together when asked', c.splitCaptureNote('salt and pepper, bread', false).items, ['salt and pepper', 'bread']);
check('grocery drops the buy', c.groceryItemsFromNote('buy eggs, milk and bread'), ['Eggs', 'Milk', 'Bread']);
check('grocery drops we need', c.groceryItemsFromNote('we need more olive oil; lemons'), ['Olive oil', 'Lemons']);
check('grocery drops repeats', c.groceryItemsFromNote('eggs, Eggs, milk'), ['Eggs', 'Milk']);
check('grocery keeps and together', c.groceryItemsFromNote('mac and cheese', false), ['Mac and cheese']);

// --- The words -----------------------------------------------------------------------
const said = [
  p.describePlainDate({ date: '2026-09-22', time: '15:00', matched: '' }, tue),
  p.describePlainDate({ date: '2031-03-03', time: null, matched: '' }, tue),
];
const FORBIDDEN = /\b(streak|great job|well done|good job|failed|missed|behind|lazy|should have|real|genuine|genuinely|score|%)\b|[–—]| -- /i;
for (const line of said) check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);

console.log(failures === 0 ? `All ${total} checks passed` : `\n${failures} of ${total} checks failed`);
process.exit(failures === 0 ? 0 : 1);
