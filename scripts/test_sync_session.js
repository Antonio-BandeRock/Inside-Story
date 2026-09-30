// Checks lib/syncSession.ts, which of one person's two devices has the
// session (2026-09-30, 1.0.57.11: "Read only with Take over now"), and the
// read-only guard in lib/databaseActivity.ts that goes with it:
//
// 1. The timings sit in a sensible order: the holder says it is in use
//    well inside the half hour, and saves its copy well inside it too.
// 2. The note round-trips, and anything that is not a note reads as none.
// 3. Where a device stands: no note is free, its own note is mine, the
//    other device used within the half hour is waiting until the half
//    hour is up, and after that it is free. A holder clock far ahead of
//    this one does not shut this device out.
// 4. The holder writes the note again only after SESSION_TOUCH_MS.
// 5. The clock reads the way people say the time.
// 6. The guard: nothing is refused with no guard set; a change to a
//    travelling table is refused while one is; app_meta and device-local
//    tables, reads, suspended writes (a merge) and lifted work (a weather
//    station's readings) go through.
// 7. Every sentence a person reads is free of the banned dashes, filler
//    and verdict words.
//
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const cache = {};
function load(relPath) {
  if (cache[relPath]) return cache[relPath].exports;
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  cache[relPath] = module;
  const dir = path.dirname(relPath);
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    if (!name.startsWith('.')) throw new Error(`${relPath} must stay free of runtime imports (asked for ${name})`);
    return load(path.posix.join(dir, name) + '.ts');
  });
  return module.exports;
}

const S = load('lib/syncSession.ts');
const A = load('lib/databaseActivity.ts');

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

const phone = { kind: 'phone', fingerprint: 'abc123' };
const computer = { kind: 'computer', fingerprint: 'def456' };
const MIN = 60 * 1000;
const t0 = Date.parse('2026-09-30T15:00:00.000Z');
const iso = (ms) => new Date(ms).toISOString();

// 1. Timings.
check(S.SESSION_QUIET_MS === 30 * MIN, 'the half hour is thirty minutes');
check(S.SESSION_TOUCH_MS < S.SESSION_QUIET_MS / 3, 'the holder says it is in use several times inside the half hour');
check(S.SESSION_SAVE_QUIET_MS < S.SESSION_QUIET_MS / 2, 'the copy is saved well inside the half hour');
check(S.SESSION_FILE_NAME === 'inside-story-session.json', 'the note has its fixed name');

// 2. The note.
const note = S.buildSessionNote(phone, iso(t0), iso(t0));
check(JSON.stringify(S.parseSessionNote(JSON.stringify(note))) === JSON.stringify(note), 'note round-trips');
check(S.parseSessionNote('not json') === null, 'garbage is no note');
check(S.parseSessionNote('{"version":2}') === null, 'unknown version is no note');
check(S.parseSessionNote(JSON.stringify({ ...note, holder: { kind: 'tablet', fingerprint: 'x' } })) === null, 'unknown device kind');
check(S.parseSessionNote(JSON.stringify({ ...note, holder: { kind: 'phone', fingerprint: '' } })) === null, 'empty fingerprint');
check(S.parseSessionNote(JSON.stringify({ ...note, lastUsedAt: 'yesterday' })) === null, 'unreadable time');
check(!('extra' in S.parseSessionNote(JSON.stringify({ ...note, extra: 1 }))), 'only the known fields come back');

// 3. Where a device stands.
check(S.planSession(null, computer, t0).mode === 'free', 'no note is free');
check(S.planSession(note, phone, t0 + 5 * MIN).mode === 'mine', 'own note is mine');
check(S.planSession(note, phone, t0 + 5 * 60 * MIN).mode === 'mine', 'own note stays mine however old');
const waiting = S.planSession(note, computer, t0 + 10 * MIN);
check(waiting.mode === 'waiting', 'the phone used ten minutes ago means waiting');
check(waiting.freeAtMs === t0 + 30 * MIN, 'free at the end of the half hour');
check(waiting.holder.kind === 'phone', 'the holder is named');
check(S.planSession(note, computer, t0 + 30 * MIN).mode === 'free', 'free at exactly the half hour');
check(S.planSession(note, computer, t0 + 45 * MIN).mode === 'free', 'free after it');
check(S.planSession(note, computer, t0 - 10 * MIN).mode === 'waiting', 'a holder clock a little ahead still waits');
check(S.planSession(note, computer, t0 - 31 * MIN).mode === 'free', 'a holder clock far ahead does not shut this device out');
check(S.planSession(note, { kind: 'computer', fingerprint: 'abc123' }, t0).mode === 'waiting', 'same fingerprint, other kind, is the other device');

// 4. Touching.
check(S.shouldTouchSession(null, phone, t0), 'no note: write one');
check(S.shouldTouchSession(note, computer, t0), 'someone else\'s note: write ours');
check(!S.shouldTouchSession(note, phone, t0 + 4 * MIN), 'not before five minutes');
check(S.shouldTouchSession(note, phone, t0 + 5 * MIN), 'at five minutes');

// 5. The clock.
const at = (h, m) => new Date(2026, 8, 30, h, m).getTime();
check(S.formatClock(at(15, 40)) === '3:40 pm', 'afternoon');
check(S.formatClock(at(0, 5)) === '12:05 am', 'just after midnight');
check(S.formatClock(at(12, 0)) === '12:00 pm', 'noon');
check(S.formatClock(at(9, 7)) === '9:07 am', 'morning, minutes padded');

// 6. The guard.
const travelling = 'INSERT INTO meals (name) VALUES (?)';
check(A.sessionRefusalFor(travelling) === null, 'no guard, nothing refused');
A.setSessionWriteGuard(() => 'refused');
check(A.sessionRefusalFor(travelling) === 'refused', 'a change to a travelling table is refused');
check(A.sessionRefusalFor('UPDATE symptoms SET severity = 2 WHERE id = 1') === 'refused', 'an update is refused');
check(A.sessionRefusalFor('SELECT * FROM meals') === null, 'a read goes through');
check(A.sessionRefusalFor("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('k', 'v')") === null, 'app_meta goes through');
check(A.sessionRefusalFor('INSERT INTO sync_change_log (at) VALUES (?)') === null, 'a device-local table goes through');
check(A.sessionRefusalFor('INSERT INTO app_meta (key) VALUES (1); INSERT INTO meals (name) VALUES (2)') === 'refused', 'a script reaching a travelling table is refused');
(async () => {
  let inside = 'unset';
  await A.withDatabaseWriteTrackingSuspended(async () => {
    inside = A.sessionRefusalFor(travelling);
  });
  check(inside === null, 'a merge (tracking suspended) goes through');
  await A.withSessionGuardLifted(async () => {
    inside = A.sessionRefusalFor(travelling);
  });
  check(inside === null, 'lifted work goes through');
  check(A.sessionRefusalFor(travelling) === 'refused', 'refused again once lifted work ends');

  const ran = [];
  const db = A.attachWriteTracking({
    runAsync: async (sql) => ran.push(sql),
    execAsync: async (sql) => ran.push(sql),
  });
  let threw = null;
  try {
    await db.runAsync(travelling);
  } catch (error) {
    threw = error;
  }
  check(threw instanceof A.SessionReadOnlyError && threw.message === 'refused', 'the refusal is thrown with its sentence');
  check(ran.length === 0, 'a refused statement never runs');
  A.setSessionWriteGuard(null);
  await db.runAsync(travelling);
  check(ran.length === 1, 'runs again once the guard is cleared');

  // 7. Sentences.
  const sentences = [
    S.describeWaiting(waiting),
    S.describeWaiting({ ...waiting, holder: computer }),
    S.waitingRefusal(phone),
    S.waitingRefusal(computer),
  ];
  const banned = /[–—]| -- |\breal\b|\bgenuine(ly)?\b|\bown\b|\b(must|should|ideal|optimal|too long)\b/i;
  for (const sentence of sentences) {
    check(!banned.test(sentence), 'clean sentence: ' + sentence);
    check(/Your (phone|computer)/.test(sentence), 'names the device: ' + sentence);
  }
  check(/take over now/i.test(sentences[0]) && /Take Over Now/.test(sentences[2]), 'both say how to take over');

  console.log(`${checks - failures}/${checks} sync session checks passed`);
  if (failures > 0) process.exit(1);
})();
