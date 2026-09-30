// Checks lib/stepTimer.ts (B5, the shrinking ring on a timed routine step):
// counting down, pausing and starting again, the ring's drawing, when the
// signal is due, and that going past the time is counted quietly with no
// word of failure.
// Run: node scripts/test_step_timer.js
/* global __dirname */
const path = require('path');
const ts = require('typescript');
const fs = require('fs');

const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'stepTimer.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const m = { exports: {} };
new Function('module', 'exports', 'require', js)(m, m.exports, require);
const T = m.exports;

let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) pass++;
  else {
    fail++;
    console.log('FAIL', name);
  }
}

const t0 = 1_000_000;
const SEC = 1000;
const timer = T.startStepTimer(2, t0);

// Counting down.
check('starts full', T.remainingFraction(timer, t0) === 1);
check('half way', Math.abs(T.remainingFraction(timer, t0 + 60 * SEC) - 0.5) < 1e-9);
check('face at start', T.timerWords(timer, t0).face === '2:00');
check('face rounds up', T.timerWords(timer, t0 + 500).face === '2:00');
check('last second reads 0:01', T.timerWords(timer, t0 + 119.5 * SEC).face === '0:01');
check('caption while running', T.timerWords(timer, t0 + 5 * SEC).caption === 'Left');
check('ends at', T.endsAtMs(timer, t0 + 30 * SEC) === t0 + 120 * SEC);

// Pausing and starting again.
const paused = T.pauseStepTimer(timer, t0 + 30 * SEC);
check('paused', T.isPaused(paused));
check('paused holds time', T.elapsedMs(paused, t0 + 500 * SEC) === 30 * SEC);
check('paused caption', T.timerWords(paused, t0 + 500 * SEC).caption === 'Paused');
check('no signal while paused', T.endsAtMs(paused, t0 + 500 * SEC) === null);
check('pause twice is the same', T.pauseStepTimer(paused, t0 + 600 * SEC) === paused);
const resumed = T.resumeStepTimer(paused, t0 + 100 * SEC);
check('resumes from where it was', T.elapsedMs(resumed, t0 + 110 * SEC) === 40 * SEC);
check('signal moves with the pause', T.endsAtMs(resumed, t0 + 100 * SEC) === t0 + 190 * SEC);
check('resume twice is the same', T.resumeStepTimer(resumed, t0 + 120 * SEC) === resumed);

// Past the time: counted on, ring empty, no signal left to set.
const over = t0 + 125 * SEC;
check('past time', T.isPastTime(timer, over));
check('ring empty, never negative', T.remainingFraction(timer, over) === 0);
check('counts on past', T.timerWords(timer, over).face === '0:05');
check('past caption', T.timerWords(timer, over).caption === 'Past the 2 minutes');
check('paused past caption', T.timerWords(T.pauseStepTimer(timer, over), over).caption === 'Paused, past the 2 minutes');
check('no signal once past', T.endsAtMs(timer, over) === null);
check('one minute singular', T.timerWords(T.startStepTimer(1, t0), t0 + 61 * SEC).caption === 'Past the 1 minute');

// Drawing.
const dash = T.ringDash(10, 0.25);
check('circumference', Math.abs(dash.circumference - 2 * Math.PI * 10) < 1e-9);
check('offset leaves a quarter', Math.abs(dash.offset - dash.circumference * 0.75) < 1e-9);
check('offset clamps', T.ringDash(10, -1).offset === T.ringDash(10, 0).offset);

// Screen reader.
check('reader running', T.timerAccessibilityLabel(timer, t0) === '2:00 left');
check('reader paused', T.timerAccessibilityLabel(paused, t0) === 'Paused with 1:30 left');
check('reader past', T.timerAccessibilityLabel(timer, over) === 'Past the 2 minutes by 0:05');

// The signal names the step and leaves moving on to the person.
const signal = T.timerSignal('Morning', 'Brush teeth');
check('signal title', signal.title === 'Morning: time for this step is up');
check('signal body', signal.body === 'Brush teeth. Move on whenever you are ready.');

// No word of failure or hurry anywhere a person reads.
const words = [
  T.timerWords(timer, over).caption,
  T.timerWords(T.pauseStepTimer(timer, over), over).caption,
  T.timerAccessibilityLabel(timer, over),
  signal.title,
  signal.body,
  T.STEP_TIMER_HELP,
  T.STEP_TIMER_SIGNAL_HELP,
  T.STEP_TIMER_RING_LABEL,
  T.STEP_TIMER_SIGNAL_LABEL,
].join(' ').toLowerCase();
for (const bad of ['late', 'overdue', 'failed', 'too long', 'too slow', 'hurry', 'missed', 'behind', 'streak', 'score']) {
  check(`no "${bad}"`, !new RegExp(`\b${bad}\b`).test(words));
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
