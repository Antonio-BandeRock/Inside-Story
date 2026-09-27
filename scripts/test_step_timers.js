// Checks G4 of the competitive build plan (Phase 2, 2026-09-26): cook
// mode's step timers. The durations a step names are found (ranges start at
// the lower figure, "1 hour and 30 minutes" is one timer, days and
// overnight are left alone), the countdown arithmetic rounds the right way,
// and nothing a timer says carries a verdict. Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
    throw new Error(`${file} must stay free of runtime imports (${name})`);
  });
  return mod.exports;
}

const T = load('lib/stepTimers.ts');

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

const secs = (step) => T.timersInStep(step).map((t) => t.seconds);

check('plain minutes', secs('Simmer for 20 minutes.'), [1200]);
check('about an hour', secs('Bake about an hour, until set.'), [3600]);
check('range takes the lower figure', secs('Simmer 25-30 minutes.'), [1500]);
check('range with an en dash', secs('Roast 25\u201330 minutes.'), [1500]);
check('en dash phrase shown with a hyphen', T.timersInStep('Roast 25\u201330 minutes.')[0].phrase, '25-30 minutes');
check('range in words', secs('Cook 6 to 8 minutes, stirring.'), [360]);
check('range marked', T.timersInStep('Simmer 25-30 minutes.')[0].isRange, true);
check('range phrase kept', T.timersInStep('Simmer 25-30 minutes.')[0].phrase, '25-30 minutes');
check('single is not a range', T.timersInStep('Simmer 20 minutes.')[0].isRange, false);
check('same figure twice is not a range', T.timersInStep('Rest 5-5 minutes.')[0].isRange, false);
check('seconds', secs('Blend for 45 seconds.'), [45]);
check('hours', secs('Chill 2 hours.'), [7200]);
check('half an hour', secs('Let it rest half an hour.'), [1800]);
check('one and a half as a fraction', secs('Braise 1 1/2 hours.'), [5400]);
check('decimal hours', secs('Braise 1.5 hours.'), [5400]);
check('word number', secs('Whisk for two minutes.'), [120]);
check('forty-five', secs('Bake forty-five minutes.'), [2700]);
check('abbreviations', secs('Boil 10 mins, then 1 hr more.'), [600, 3600]);
check('hour and minutes merge', secs('Roast 1 hour and 30 minutes.'), [5400]);
check('hour, minutes merge', secs('Roast 1 hour, 15 minutes.'), [4500]);
check('a second loaf is no timer', secs('Shape a second loaf the same way.'), []);
check('another second is no timer', secs('Wait another second.'), []);
check('another minute', secs('Stir for another minute.'), [60]);
check('more minutes range', secs('Cook 4-5 more minutes.'), [240]);
check('a full minute', secs('Blend on high for a full minute.'), [60]);
check('a couple of minutes', secs('Let cool for a couple of minutes.'), [120]);
check('additional minutes', secs('Bake 10 additional minutes.'), [600]);
check('minute and seconds merge', secs('Microwave 1 minute 30 seconds.'), [90]);
check('two separate steps stay separate', secs('Bake 20 minutes, then rest 10 minutes.'), [1200, 600]);
check('same unit after a comma stays separate', secs('Simmer 10 minutes, 5 minutes more if thick.'), [600, 300]);
check('same length offered once', secs('Stir for 5 minutes, then 5 minutes more.'), [300]);
check('days are not a timer', secs('Ferment for 3 days.'), []);
check('overnight is not a timer', secs('Soak overnight.'), []);
check('past 48 hours left alone', secs('Cure 72 hours.'), []);
check('48 hours kept', secs('Cure 48 hours.'), [172800]);
check('no duration', secs('Season to taste.'), []);
check('a number without a unit', secs('Use a 2-quart pot and 3 cups water.'), []);
check('minute inside a word ignored', secs('Add 2 minuteman peppers.'), []);
check('order kept', secs('Sear 3 minutes a side, then bake 12 minutes.'), [180, 720]);

check('label minutes', T.timerLabel(1200), '20 min');
check('label hours and minutes', T.timerLabel(5400), '1 hr 30 min');
check('label seconds', T.timerLabel(45), '45 sec');
check('label minute and seconds', T.timerLabel(90), '1 min 30 sec');
check('label zero', T.timerLabel(0), '0 sec');
check('start label', T.startLabel(T.timersInStep('Simmer 20 minutes.')[0]), 'Start 20 min timer');
check('range caption', T.rangeCaption(T.timersInStep('Simmer 25-30 minutes.')[0]), 'The step says 25-30 minutes; this starts at the shorter time.');
check('no range caption', T.rangeCaption(T.timersInStep('Simmer 20 minutes.')[0]), null);

check('remaining rounds up', T.remainingSeconds(10_500, 10_000), 1);
check('remaining exact', T.remainingSeconds(70_000, 10_000), 60);
check('remaining never negative', T.remainingSeconds(5_000, 10_000), 0);
check('format minutes', T.formatRemaining(245), '4:05');
check('format hours', T.formatRemaining(3729), '1:02:09');
check('format zero', T.formatRemaining(0), '0:00');
check('format negative', T.formatRemaining(-3), '0:00');

check('done line with recipe', T.timerDoneLine(3, { label: '20 min' }, 'Lentil Soup'), 'The 20 min timer for step 3 of Lentil Soup is up.');
check('done line without recipe', T.timerDoneLine(1, { label: '45 sec' }, '  '), 'The 45 sec timer for step 1 is up.');

// No verdict words in anything a timer says.
const FORBIDDEN = /\b(great|good|bad|well done|ideal|optimal|should|must|healthy|unhealthy|real|genuine|genuinely|own)\b|[\u2013\u2014]| -- /i;
const samples = [
  'Simmer 25-30 minutes.',
  'Bake about an hour.',
  'Roast 1 hour and 30 minutes.',
  'Blend for 45 seconds.',
].flatMap((step) =>
  T.timersInStep(step).flatMap((t) => [T.startLabel(t), T.rangeCaption(t) ?? '', T.timerDoneLine(2, t, 'Soup'), t.label]),
);
for (const line of samples) check(`no verdict words: ${line}`, FORBIDDEN.test(line), false);

console.log(`${total - failures}/${total} checks passed`);
if (failures > 0) process.exit(1);
