// Checks lib/calm.ts, the breathing pacer and spoken relaxation on
// Signals > Calm (D15, 2026-09-30).
//
// 1. phaseAt lands on the right phase at each boundary, skipping a hold of 0.
// 2. Breaths a minute and the pattern sentence.
// 3. A session with a set length ends at the end of a breath, never mid-breath.
// 4. A pattern of the person's own is checked before it is kept.
// 5. A script of their own: one line said per line, an empty line lengthens the pause.
// 6. What is kept round-trips and ignores what it does not know.
// 7. The voice choice stays on the device (DEVICE_LOCAL_META_KEYS).
// 8. No word in the module judges, scores or claims to treat.
//
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'lib', 'calm.ts');
const source = fs.readFileSync(file, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = { exports: {} };
new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
  throw new Error('lib/calm.ts must stay free of imports (asked for ' + name + ')');
});
const C = mod.exports;

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

const pattern = (id) => C.BUILT_IN_PATTERNS.find((p) => p.id === id);
const six = pattern('six');
const box = pattern('box');
const fse = pattern('fourSevenEight');

// 1. Phases.
check(C.phaseAt(six, 0).phase === 'in' && C.phaseAt(six, 0).secondsLeft === 5, 'six starts breathing in, 5 left');
check(C.phaseAt(six, 4999).phase === 'in', 'six still in at 4.999 s');
check(C.phaseAt(six, 5000).phase === 'out', 'six skips the empty hold and goes straight to out');
check(C.phaseAt(six, 10000).phase === 'in' && C.phaseAt(six, 10000).breath === 1, 'six second breath');
check(C.phaseAt(box, 4000).phase === 'holdIn' && C.phaseAt(box, 12000).phase === 'holdOut', 'box has both holds');
check(C.phaseAt(fse, 4000).phase === 'holdIn' && C.phaseAt(fse, 11000).phase === 'out' && C.phaseAt(fse, 19000).phase === 'in', '4-7-8 boundaries');
check(C.phaseAt(six, 2500).progress === 0.5, 'progress halfway');
const steps = new Set();
for (let t = 0; t < 20000; t += 250) steps.add(C.phaseAt(six, t).step);
check(steps.size === 4, 'six changes phase four times in two breaths');
check(C.phaseAt(six, -50).phase === 'in', 'negative time is the start');
check(C.circleTarget('in') === 1 && C.circleTarget('holdIn') === 1 && C.circleTarget('out') === 0, 'circle targets');
check(C.circleSizeAt({ phase: 'out', progress: 0.25 }) === 0.75, 'circle size on the way out');

// 2. Rate and sentence.
check(C.breathsPerMinute(six) === 6, 'six is 6 a minute');
check(C.breathsPerMinute(fse) === 3.2, '4-7-8 is 3.2 a minute');
check(C.patternSentence(fse) === 'In 4, hold 7, out 8. About 3.2 breaths a minute.', '4-7-8 sentence');
check(C.patternSentence(six) === 'In 5, out 5. About 6 breaths a minute.', 'six sentence');

// 3. Session end.
check(!C.sessionFinished(six, 59000, 1), 'not finished before a minute');
check(C.sessionFinished(six, 60000, 1), 'finished at a minute when breaths fit exactly');
check(!C.sessionFinished(fse, 60000, 1), '4-7-8 runs on to the end of the breath');
check(C.sessionFinished(fse, 76000, 1), '4-7-8 ends after 4 whole breaths');
check(!C.sessionFinished(six, 10 * 60 * 60 * 1000, null), 'until I stop never finishes');
check(C.sessionClock(135000, 5) === '2:15 of 5:00' && C.sessionClock(135000, null) === '2:15', 'session clock');

// 4. Own pattern.
const fields = (o) => ({ name: 'Mine', inSec: '4', holdInSec: '', outSec: '6', holdOutSec: '', ...o });
check(C.ownPatternProblem(fields({}), []) === null, 'a good pattern');
check(C.ownPatternProblem(fields({ name: ' ' }), []) !== null, 'needs a name');
check(C.ownPatternProblem(fields({ name: 'box breathing' }), ['Box breathing']) !== null, 'name taken, any case');
check(C.ownPatternProblem(fields({ inSec: '0' }), []) !== null, 'in of 0 refused');
check(C.ownPatternProblem(fields({ outSec: '21' }), []) !== null, 'out over 20 refused');
check(C.ownPatternProblem(fields({ holdInSec: '2.5' }), []) !== null, 'hold must be whole');
check(C.ownPatternProblem(fields({ holdInSec: '0' }), []) === null, 'hold of 0 is fine');
const made = C.patternFromFields('p1', fields({ holdInSec: '3' }));
check(made.inSec === 4 && made.holdInSec === 3 && made.outSec === 6 && made.holdOutSec === 0 && made.own === true, 'pattern from fields');
check(JSON.stringify(C.fieldsFromPattern(made)) === JSON.stringify(fields({ holdInSec: '3' })), 'fields from pattern round-trip');

// 5. Own script.
const own = C.scriptFromOwn({ id: 's1', name: ' Evening ', text: 'First\n\nSecond\nThird\n\n\n' });
check(own.lines.length === 3 && own.name === 'Evening', 'three lines said');
check(own.lines[0].pause === C.OWN_BLANK_LINE_PAUSE && own.lines[1].pause === C.OWN_LINE_PAUSE, 'blank line lengthens the pause');
check(own.lines[2].pause === C.OWN_BLANK_LINE_PAUSE, 'trailing blank lines lengthen the last pause');
check(C.scriptFromOwn({ id: 's', name: 'x', text: '\n\nHello' }).lines.length === 1, 'leading blank lines ignored');
check(C.ownScriptProblem('A', '  \n ', []) !== null, 'empty text refused');
check(C.ownScriptProblem('Sleep', 'x', ['sleep']) !== null, 'script name taken');
check(C.ownScriptProblem('Mine', 'x', []) === null, 'a good script');

// Built-ins.
const ids = C.BUILT_IN_SCRIPTS.map((s) => s.id);
check(new Set(ids).size === ids.length && ids.length === 6, 'six built-in scripts, unique ids');
check(C.BUILT_IN_SCRIPTS.every((s) => s.lines.length > 5 && s.lines.every((l) => l.say.trim() && l.pause >= 0)), 'every line has words');
check(C.BUILT_IN_SCRIPTS.find((s) => s.id === 'belly').note.includes('not gut-directed hypnotherapy'), 'belly script says what it is not');
check(C.BUILT_IN_SCRIPTS.every((s) => /^About \d+ minutes?$/.test(C.aboutMinutesLine(s))), 'about minutes line');
check(C.scriptPositionLine(2, C.BUILT_IN_SCRIPTS[0]) === 'Line 3 of 12', 'position line');

// 6. Storage.
const kept = { patterns: [made], scripts: [{ id: 's1', name: 'Evening', text: 'Hi' }] };
const back = C.parseCalmOwn(C.serializeCalmOwn(kept));
check(back.patterns.length === 1 && back.patterns[0].holdInSec === 3 && back.patterns[0].own === true, 'patterns round-trip');
check(back.scripts.length === 1 && back.scripts[0].text === 'Hi', 'scripts round-trip');
check(C.parseCalmOwn('{"patterns":[{"id":"x","name":"y","inSec":0,"holdInSec":0,"outSec":4,"holdOutSec":0}],"scripts":[1]}').patterns.length === 0, 'bad rows dropped');
check(C.parseCalmOwn('not json').patterns.length === 0 && C.parseCalmOwn(null).scripts.length === 0, 'nothing kept reads as empty');
check(JSON.stringify(C.parseVoiceChoice(null)) === '{"voice":null,"pace":"slower"}', 'voice default is slower');
check(C.parseVoiceChoice(C.serializeVoiceChoice({ voice: 'en-gb-x', pace: 'usual' })).voice === 'en-gb-x', 'voice round-trip');
check(C.speechRate('slower') < C.speechRate('usual'), 'slower is slower');

// 7. Device-local voice.
const sync = fs.readFileSync(path.join(__dirname, '..', 'lib', 'snapshotSync.ts'), 'utf8');
const localBlock = sync.slice(sync.indexOf('DEVICE_LOCAL_META_KEYS'), sync.indexOf('];', sync.indexOf('DEVICE_LOCAL_META_KEYS')));
check(localBlock.includes(`'${C.CALM_VOICE_META_KEY}'`), 'calm_voice stays on the device');
check(!localBlock.includes(`'${C.CALM_OWN_META_KEY}'`), 'calm_own travels between devices');

// 8. Words.
const code = source.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*\*[\s\S]*?\*\//g, '');
const scan = code.replace(/None of these treats a condition/g, '');
for (const word of ['better', 'worse', 'improv', 'cure', 'heal', 'treat', 'streak', 'score', 'well done', 'great job', 'should\\b']) {
  check(!new RegExp('\\b' + word, 'i').test(scan), 'no "' + word + '" in the module');
}
check(!/[–—]/.test(source), 'no long dashes');

console.log(`${checks - failures}/${checks} calm checks passed`);
if (failures > 0) process.exit(1);
