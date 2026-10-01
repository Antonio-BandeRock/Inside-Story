// Calm (D15, 2026-09-30): a breathing pacer, relaxation scripts spoken by
// the device's voice, and later a player for recordings the person already
// has. Every pattern, script, sentence and piece of arithmetic is here, with
// no imports, so scripts/test_calm.js can check it without a phone.
//
// Why no music or recorded voice ships with the app: anything recorded
// would have to be licensed or recorded for it, and nothing free is good
// enough to stand behind. The scripts are written for the app and read by
// the voice already on the device (expo-speech), and the person's own
// recordings come through the player once expo-audio is in the R1 build.
//
// Evidence, kept honest in the words below:
//   Slow breathing near six breaths a minute is the most studied pattern:
//   Zaccaro et al., Front Hum Neurosci 2018;12:353 (systematic review, small
//   trials, short-term effects on heart rate variability and self-reported
//   calm). Box breathing and 4-7-8 are taught widely and have little trial
//   testing of their own.
//   Progressive muscle relaxation: Jacobson's method, with trials for
//   anxiety and sleep of modest size (for example Toussaint et al., Evid
//   Based Complement Alternat Med 2021;5924040).
//   Gut-directed hypnotherapy has trial evidence for IBS (Ford et al., Am J
//   Gastroenterol 2014;109:1350) and is delivered by a trained therapist or
//   a structured programme. The belly script here is a relaxation script and
//   is said not to be that.
//
// Nothing here is recorded as a session, scored or counted. A pacer is a
// tool for the moment, the same as a kitchen timer.

// ---------------------------------------------------------------------------
// Breathing patterns
// ---------------------------------------------------------------------------

export type BreathPhase = 'in' | 'holdIn' | 'out' | 'holdOut';

export type BreathPattern = {
  id: string;
  name: string;
  inSec: number;
  holdInSec: number;
  outSec: number;
  holdOutSec: number;
  /** One line under the pattern; empty for the person's own. */
  note: string;
  own?: boolean;
};

export const BUILT_IN_PATTERNS: BreathPattern[] = [
  {
    id: 'six',
    name: 'Six breaths a minute',
    inSec: 5,
    holdInSec: 0,
    outSec: 5,
    holdOutSec: 0,
    note: 'In for 5 and out for 5. This is the pace studied most.',
  },
  {
    id: 'longOut',
    name: 'Longer out-breath',
    inSec: 4,
    holdInSec: 0,
    outSec: 6,
    holdOutSec: 0,
    note: 'In for 4 and out for 6, letting the breath out slowly.',
  },
  {
    id: 'easy',
    name: 'Short and easy',
    inSec: 3,
    holdInSec: 0,
    outSec: 4,
    holdOutSec: 0,
    note: 'A shorter pace for when a longer breath feels like work.',
  },
  {
    id: 'box',
    name: 'Box breathing',
    inSec: 4,
    holdInSec: 4,
    outSec: 4,
    holdOutSec: 4,
    note: 'In, hold, out, hold, four seconds each. Taught widely, with little trial testing.',
  },
  {
    id: 'fourSevenEight',
    name: '4-7-8 breathing',
    inSec: 4,
    holdInSec: 7,
    outSec: 8,
    holdOutSec: 0,
    note: 'In for 4, hold for 7, out for 8. Taught widely, with little trial testing.',
  },
];

export const PHASE_ORDER: BreathPhase[] = ['in', 'holdIn', 'out', 'holdOut'];

export const PHASE_WORDS: Record<BreathPhase, string> = {
  in: 'Breathe in',
  holdIn: 'Hold',
  out: 'Breathe out',
  holdOut: 'Hold',
};

/** What the voice says at each change, when the person asks for it. */
export const PHASE_SPOKEN: Record<BreathPhase, string> = {
  in: 'In',
  holdIn: 'Hold',
  out: 'Out',
  holdOut: 'Hold',
};

export function phaseSeconds(pattern: BreathPattern, phase: BreathPhase): number {
  switch (phase) {
    case 'in':
      return pattern.inSec;
    case 'holdIn':
      return pattern.holdInSec;
    case 'out':
      return pattern.outSec;
    case 'holdOut':
      return pattern.holdOutSec;
  }
}

export function cycleSeconds(pattern: BreathPattern): number {
  return pattern.inSec + pattern.holdInSec + pattern.outSec + pattern.holdOutSec;
}

/** Breaths a minute, to one decimal place. */
export function breathsPerMinute(pattern: BreathPattern): number {
  const cycle = cycleSeconds(pattern);
  if (cycle <= 0) return 0;
  return Math.round((600 / cycle)) / 10;
}

function trimNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** "In 4, hold 7, out 8. About 5.3 breaths a minute." */
export function patternSentence(pattern: BreathPattern): string {
  const parts = [`In ${pattern.inSec}`];
  if (pattern.holdInSec > 0) parts.push(`hold ${pattern.holdInSec}`);
  parts.push(`out ${pattern.outSec}`);
  if (pattern.holdOutSec > 0) parts.push(`hold ${pattern.holdOutSec}`);
  const perMinute = breathsPerMinute(pattern);
  const per = perMinute === 1 ? 'breath' : 'breaths';
  return `${parts.join(', ')}. About ${trimNumber(perMinute)} ${per} a minute.`;
}

export type PhaseState = {
  phase: BreathPhase;
  /** Which breath this is, counting from 0. */
  breath: number;
  /** Seconds this phase lasts. */
  length: number;
  /** Whole seconds left in this phase, counting down to 1. */
  secondsLeft: number;
  /** How far through this phase, 0 to 1. */
  progress: number;
  /** Changes every time the phase does, for starting an animation. */
  step: number;
};

/** Where in the pattern a session is, a given time after it started. */
export function phaseAt(pattern: BreathPattern, elapsedMs: number): PhaseState {
  const cycleMs = cycleSeconds(pattern) * 1000;
  const elapsed = Math.max(0, elapsedMs);
  const breath = cycleMs > 0 ? Math.floor(elapsed / cycleMs) : 0;
  let into = cycleMs > 0 ? elapsed - breath * cycleMs : 0;
  let index = 0;
  for (const phase of PHASE_ORDER) {
    const lengthMs = phaseSeconds(pattern, phase) * 1000;
    if (lengthMs > 0 && into < lengthMs) {
      return {
        phase,
        breath,
        length: lengthMs / 1000,
        secondsLeft: Math.max(1, Math.ceil((lengthMs - into) / 1000)),
        progress: into / lengthMs,
        step: breath * PHASE_ORDER.length + index,
      };
    }
    into -= Math.max(0, lengthMs);
    index += 1;
  }
  return { phase: 'in', breath, length: pattern.inSec, secondsLeft: pattern.inSec, progress: 0, step: breath * PHASE_ORDER.length };
}

/**
 * How big the circle is, 0 (smallest) to 1 (largest): it grows through the
 * in-breath, stays full through a hold after it, shrinks through the
 * out-breath and stays small through a hold after that.
 */
export function circleSizeAt(state: Pick<PhaseState, 'phase' | 'progress'>): number {
  switch (state.phase) {
    case 'in':
      return state.progress;
    case 'holdIn':
      return 1;
    case 'out':
      return 1 - state.progress;
    case 'holdOut':
      return 0;
  }
}

/** The size the circle is heading for by the end of this phase. */
export function circleTarget(phase: BreathPhase): number {
  return phase === 'in' || phase === 'holdIn' ? 1 : 0;
}

export type SessionLength = { label: string; minutes: number | null };

export const SESSION_LENGTHS: SessionLength[] = [
  { label: '1 minute', minutes: 1 },
  { label: '3 minutes', minutes: 3 },
  { label: '5 minutes', minutes: 5 },
  { label: '10 minutes', minutes: 10 },
  { label: '15 minutes', minutes: 15 },
  { label: 'Until I stop', minutes: null },
];

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** "2:15 of 5:00", or "2:15" for a session with no set length. */
export function sessionClock(elapsedMs: number, minutes: number | null): string {
  const done = formatClock(elapsedMs / 1000);
  return minutes == null ? done : `${done} of ${formatClock(minutes * 60)}`;
}

/**
 * Whether a session with a set length has run its course. It ends at the
 * end of the breath that crosses the time, so it never stops halfway
 * through breathing in.
 */
export function sessionFinished(pattern: BreathPattern, elapsedMs: number, minutes: number | null): boolean {
  if (minutes == null) return false;
  const cycleMs = cycleSeconds(pattern) * 1000;
  if (cycleMs <= 0) return true;
  const breathsNeeded = Math.ceil((minutes * 60 * 1000) / cycleMs);
  return elapsedMs >= breathsNeeded * cycleMs;
}

export type CueChoice = 'none' | 'vibrate' | 'voice';

export const CUE_CHOICES: { label: string; value: CueChoice }[] = [
  { label: 'Nothing, just the circle', value: 'none' },
  { label: 'A short vibration at each change', value: 'vibrate' },
  { label: 'The voice says in, hold and out', value: 'voice' },
];

export const PACER_NOTE =
  'Slow breathing, around six breaths a minute with the out-breath as long as the in-breath or longer, is the pattern studied most. Small trials report people feeling calmer and a slower heart rate during and soon after. Box breathing and 4-7-8 are taught widely and have had little trial testing. None of these treats a condition.';

export const DIZZY_NOTE =
  'If you feel dizzy, light-headed or short of breath, stop and breathe the way you usually do. Holding the breath is never required; the patterns without holds are there for that.';

export const SCREEN_ON_NOTE =
  'Keep the screen on while it runs. Until the next full install of the app, it cannot stop the phone dimming the screen by itself.';

// ---------------------------------------------------------------------------
// The person's own breathing patterns
// ---------------------------------------------------------------------------

export type PatternFields = { name: string; inSec: string; holdInSec: string; outSec: string; holdOutSec: string };

const MAX_PHASE = 20;

function wholeSeconds(text: string, allowZero: boolean): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return allowZero ? 0 : null;
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (n > MAX_PHASE) return null;
  if (!allowZero && n < 1) return null;
  return n;
}

/** What is wrong with a pattern the person is adding, or null. */
export function ownPatternProblem(fields: PatternFields, takenNames: string[]): string | null {
  const name = fields.name.trim();
  if (name === '') return 'Give the pattern a name.';
  if (takenNames.some((each) => each.trim().toLowerCase() === name.toLowerCase())) {
    return 'There is already a pattern with that name.';
  }
  if (wholeSeconds(fields.inSec, false) == null) return `Breathing in needs a whole number of seconds from 1 to ${MAX_PHASE}.`;
  if (wholeSeconds(fields.outSec, false) == null) return `Breathing out needs a whole number of seconds from 1 to ${MAX_PHASE}.`;
  if (wholeSeconds(fields.holdInSec, true) == null || wholeSeconds(fields.holdOutSec, true) == null) {
    return `A hold is left empty for none, or a whole number of seconds up to ${MAX_PHASE}.`;
  }
  return null;
}

export function patternFromFields(id: string, fields: PatternFields): BreathPattern {
  return {
    id,
    name: fields.name.trim(),
    inSec: wholeSeconds(fields.inSec, false) ?? 4,
    holdInSec: wholeSeconds(fields.holdInSec, true) ?? 0,
    outSec: wholeSeconds(fields.outSec, false) ?? 4,
    holdOutSec: wholeSeconds(fields.holdOutSec, true) ?? 0,
    note: '',
    own: true,
  };
}

export function fieldsFromPattern(pattern: BreathPattern): PatternFields {
  const hold = (n: number) => (n > 0 ? String(n) : '');
  return {
    name: pattern.name,
    inSec: String(pattern.inSec),
    holdInSec: hold(pattern.holdInSec),
    outSec: String(pattern.outSec),
    holdOutSec: hold(pattern.holdOutSec),
  };
}

// ---------------------------------------------------------------------------
// Relaxation scripts
// ---------------------------------------------------------------------------

export type ScriptLine = { say: string; pause: number };

export type RelaxScript = {
  id: string;
  name: string;
  about: string;
  /** Said once before the script starts, shown under it. */
  note?: string;
  lines: ScriptLine[];
  own?: boolean;
};

const l = (say: string, pause = 4): ScriptLine => ({ say, pause });

export const BELLY_SCRIPT_NOTE =
  'This is a relaxation script that brings attention to the belly. It is not gut-directed hypnotherapy, which is given by a trained therapist or a structured programme and has trial evidence for irritable bowel syndrome. Your clinician can say whether that would suit you.';

export const MUSCLE_SCRIPT_NOTE =
  'Tense each part gently, never hard, and leave out any part that is painful, injured or recently operated on. Just let that part rest while the others take their turn.';

export const BUILT_IN_SCRIPTS: RelaxScript[] = [
  {
    id: 'reset',
    name: 'Two-minute pause',
    about: 'A short stop in the middle of a day.',
    lines: [
      l('Wherever you are, let yourself stop for a moment.', 3),
      l('Let your feet rest on the floor, and let the floor hold them.', 4),
      l('Let your shoulders drop a little, away from your ears.', 4),
      l('Breathe in through your nose, slowly.', 4),
      l('And let it go, slowly, a little longer than it took to come in.', 6),
      l('Again. In.', 4),
      l('And out, slowly.', 6),
      l('Notice three things you can hear right now. You do not have to do anything about them.', 10),
      l('Notice where your body touches the chair, or the ground.', 8),
      l('One more slow breath in.', 4),
      l('And out.', 6),
      l('When you are ready, carry on with your day.', 2),
    ],
  },
  {
    id: 'breathing',
    name: 'Slow breathing with a voice',
    about: 'Counted breaths at about six a minute, spoken for you.',
    lines: [
      l('Sit or lie however is comfortable. Let your eyes close, or rest them on one spot.', 4),
      l('For the next few minutes we will breathe slowly together. Breathe through your nose if that is easy for you.', 3),
      l('Breathe in, two, three, four, five.', 0),
      l('And out, two, three, four, five.', 1),
      l('In, two, three, four, five.', 0),
      l('Out, two, three, four, five.', 1),
      l('In, letting the belly rise.', 3),
      l('Out, letting it fall.', 4),
      l('In.', 4),
      l('Out.', 5),
      l('Keep going at this pace. I will be quiet for a while.', 30),
      l('If your mind has wandered, that is what minds do. Just come back to the next breath.', 30),
      l('In, two, three, four, five.', 0),
      l('Out, two, three, four, five.', 1),
      l('Keep going like this.', 40),
      l('Let the next breath be an ordinary one, and let your breathing find its way again.', 5),
      l('When you are ready, open your eyes.', 2),
    ],
  },
  {
    id: 'bodyScan',
    name: 'Body scan',
    about: 'Attention moving slowly from the feet to the head.',
    lines: [
      l('Lie down or sit back, and let your body be heavy.', 4),
      l('Take a slow breath in, and a slow breath out.', 6),
      l('Bring your attention to your feet. Notice whatever is there: warmth, coolness, tingling, or nothing at all. All of it is fine.', 10),
      l('Let your feet soften.', 6),
      l('Move your attention up to your ankles and your calves.', 8),
      l('Let them be heavy.', 6),
      l('Now your knees, and the long muscles of your thighs.', 8),
      l('Let them rest.', 6),
      l('Notice your hips, and the weight of your body where it is supported.', 10),
      l('Bring your attention to your belly. Let it rise and fall with your breath, without changing anything.', 12),
      l('Notice your chest, and your back against whatever is holding you.', 10),
      l('Your hands. Your fingers. Let them uncurl.', 8),
      l('Your arms, from the wrists up to the shoulders.', 8),
      l('Let your shoulders sink.', 8),
      l('Your neck. Let it be long and easy.', 8),
      l('Your jaw. Let your teeth part a little, and your tongue rest.', 8),
      l('Your cheeks, your eyes, your forehead. Let them be smooth.', 10),
      l('Now notice your whole body at once, breathing.', 15),
      l('Stay here as long as you like.', 20),
      l('When you are ready, wiggle your fingers and toes, and come back slowly.', 3),
    ],
  },
  {
    id: 'muscle',
    name: 'Tense and let go',
    about: 'Progressive muscle relaxation: each part tensed gently, then released.',
    note: MUSCLE_SCRIPT_NOTE,
    lines: [
      l('Sit or lie comfortably. We will gently tense one part of the body at a time, then let it go.', 4),
      l('Only tense as much as feels comfortable. If a part hurts, leave it resting.', 4),
      l('Start with your hands. Make loose fists, gently. Hold.', 5),
      l('And let go. Notice the difference as they soften.', 10),
      l('Now your arms. Bend your elbows a little and tense your upper arms. Hold.', 5),
      l('And let go. Let your arms fall heavy.', 10),
      l('Lift your shoulders toward your ears. Hold.', 5),
      l('And let them drop.', 10),
      l('Scrunch your face gently: eyes, nose, forehead. Hold.', 5),
      l('And let it go smooth.', 10),
      l('Tighten your belly a little, as if bracing. Hold.', 5),
      l('And let it soften, and breathe into it.', 10),
      l('Press your thighs together, or tense them. Hold.', 5),
      l('And let go.', 10),
      l('Point your toes gently, or pull them toward you. Hold.', 5),
      l('And let go.', 10),
      l('Now let your whole body rest, heavy and still.', 20),
      l('Breathe slowly, and notice how your body feels now.', 20),
      l('When you are ready, come back slowly.', 2),
    ],
  },
  {
    id: 'belly',
    name: 'Warmth in the belly',
    about: 'A slow relaxation that brings attention to the belly and the gut.',
    note: BELLY_SCRIPT_NOTE,
    lines: [
      l('Lie down or sit back, and rest one hand or both hands on your belly, if that is comfortable.', 4),
      l('Breathe in slowly, and feel your hand rise.', 5),
      l('Breathe out, and feel it fall.', 6),
      l('Again. In, the belly rising.', 5),
      l('Out, the belly falling.', 8),
      l('Imagine warmth under your hands, like sun on skin, or a warm cloth.', 10),
      l('Let the warmth spread slowly through your belly.', 10),
      l('With each out-breath, let the muscles of your belly soften a little more.', 12),
      l('Nothing needs to happen. Your gut knows its work, and it can take its time.', 12),
      l('Picture the warmth moving gently, slowly, all the way through.', 15),
      l('If there is a tight or uncomfortable place, let your breath go there, without pushing.', 15),
      l('Let your jaw and your shoulders soften too. They often hold on when the belly does.', 12),
      l('Rest here, breathing, with the warmth under your hands.', 30),
      l('Take one more slow breath in.', 5),
      l('And out.', 6),
      l('When you are ready, let your hands rest wherever they like, and come back slowly.', 2),
    ],
  },
  {
    id: 'sleep',
    name: 'Winding down for sleep',
    about: 'Slow and quiet, for lying in bed with the lights off.',
    lines: [
      l('Lie however you usually sleep. There is nothing you need to do now.', 5),
      l('Let the bed take all of your weight.', 6),
      l('Breathe in slowly.', 5),
      l('And let it out, long and slow.', 8),
      l('Let the day go. Whatever is left can wait for the morning.', 10),
      l('If a thought comes, let it pass by, like a car on a road at night.', 12),
      l('Let your feet and legs grow heavy.', 10),
      l('Let your arms grow heavy.', 10),
      l('Let your face soften, your jaw loose, your eyes still.', 12),
      l('Each breath out a little slower than the last.', 15),
      l('Heavy, and warm, and still.', 20),
      l('You can stay here and drift.', 20),
      l('Nothing more is needed tonight.', 1),
    ],
  },
];

/** A rough time to say a script aloud, from its words and its pauses. */
export function scriptSeconds(script: RelaxScript, wordsPerSecond = 2.2): number {
  let total = 0;
  for (const line of script.lines) {
    const words = line.say.split(/\s+/).filter(Boolean).length;
    total += words / wordsPerSecond + line.pause;
  }
  return Math.round(total);
}

/** "About 6 minutes" or "About 1 minute". */
export function aboutMinutesLine(script: RelaxScript): string {
  const minutes = Math.max(1, Math.round(scriptSeconds(script) / 60));
  return `About ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

/** "Line 3 of 12" while a script is being read. */
export function scriptPositionLine(index: number, script: RelaxScript): string {
  return `Line ${Math.min(index + 1, script.lines.length)} of ${script.lines.length}`;
}

// ---------------------------------------------------------------------------
// The person's own scripts
// ---------------------------------------------------------------------------

export const OWN_LINE_PAUSE = 4;
export const OWN_BLANK_LINE_PAUSE = 8;

export type OwnScript = { id: string; name: string; text: string };

/**
 * A script the person wrote: each line of text is said, with a short pause
 * after it, and an empty line between two lines makes the pause longer.
 */
export function scriptFromOwn(own: OwnScript): RelaxScript {
  const rows = own.text.split(/\r?\n/).map((row) => row.trim());
  const lines: ScriptLine[] = [];
  for (const row of rows) {
    if (row === '') {
      const last = lines[lines.length - 1];
      if (last) last.pause = OWN_BLANK_LINE_PAUSE;
      continue;
    }
    lines.push({ say: row, pause: OWN_LINE_PAUSE });
  }
  return { id: own.id, name: own.name.trim(), about: 'Written by you.', lines, own: true };
}

export function ownScriptProblem(name: string, text: string, takenNames: string[]): string | null {
  const trimmed = name.trim();
  if (trimmed === '') return 'Give the script a name.';
  if (takenNames.some((each) => each.trim().toLowerCase() === trimmed.toLowerCase())) {
    return 'There is already a script with that name.';
  }
  if (!text.split(/\r?\n/).some((row) => row.trim() !== '')) return 'Write at least one line for the voice to say.';
  return null;
}

export const OWN_SCRIPT_HINT =
  'Write one thing to say on each line. The voice pauses briefly after every line, and an empty line between two lines makes the pause longer.';

// ---------------------------------------------------------------------------
// What is kept
// ---------------------------------------------------------------------------

/** The person's patterns and scripts, in app_meta, carried between their devices. */
export const CALM_OWN_META_KEY = 'calm_own';

/** Which voice and how fast, kept on this device only: voices differ by device. */
export const CALM_VOICE_META_KEY = 'calm_voice';

export type CalmOwn = { patterns: BreathPattern[]; scripts: OwnScript[] };

function isPattern(value: unknown): value is BreathPattern {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    [v.inSec, v.holdInSec, v.outSec, v.holdOutSec].every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0) &&
    (v.inSec as number) > 0 &&
    (v.outSec as number) > 0
  );
}

function isOwnScript(value: unknown): value is OwnScript {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.name === 'string' && typeof v.text === 'string';
}

export function parseCalmOwn(raw: string | null | undefined): CalmOwn {
  if (!raw) return { patterns: [], scripts: [] };
  try {
    const parsed = JSON.parse(raw) as { patterns?: unknown; scripts?: unknown };
    const patterns = Array.isArray(parsed.patterns)
      ? parsed.patterns.filter(isPattern).map((p) => ({ ...p, note: '', own: true }))
      : [];
    const scripts = Array.isArray(parsed.scripts) ? parsed.scripts.filter(isOwnScript) : [];
    return { patterns, scripts };
  } catch {
    return { patterns: [], scripts: [] };
  }
}

export function serializeCalmOwn(own: CalmOwn): string {
  return JSON.stringify({
    patterns: own.patterns.map(({ id, name, inSec, holdInSec, outSec, holdOutSec }) => ({ id, name, inSec, holdInSec, outSec, holdOutSec })),
    scripts: own.scripts.map(({ id, name, text }) => ({ id, name, text })),
  });
}

export type VoicePace = 'slower' | 'usual';

export type VoiceChoice = { voice: string | null; pace: VoicePace };

export const VOICE_PACES: { label: string; value: VoicePace }[] = [
  { label: 'Slower', value: 'slower' },
  { label: 'Usual speed', value: 'usual' },
];

/** The speech rate handed to the device's voice for each pace. */
export function speechRate(pace: VoicePace): number {
  return pace === 'slower' ? 0.8 : 1;
}

export function parseVoiceChoice(raw: string | null | undefined): VoiceChoice {
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<VoiceChoice>) : {};
    return {
      voice: typeof parsed.voice === 'string' && parsed.voice !== '' ? parsed.voice : null,
      pace: parsed.pace === 'usual' ? 'usual' : 'slower',
    };
  } catch {
    return { voice: null, pace: 'slower' };
  }
}

export function serializeVoiceChoice(choice: VoiceChoice): string {
  return JSON.stringify(choice);
}

/** The value a picker uses for the device's default voice. */
export const DEFAULT_VOICE = 'default';

// ---------------------------------------------------------------------------
// Words on the lens
// ---------------------------------------------------------------------------

export const CALM_INTRO =
  'Breathing at a slower pace, and relaxation read aloud by the voice on your device. Nothing here is recorded or counted; use it whenever it helps.';

export const SCRIPTS_INTRO =
  'Each script is read aloud by the voice already on your device, with pauses between the lines. Turn the volume up, or use headphones.';

export const NO_VOICE_LINE =
  'This device has no voice to read with. On a phone, a voice can be added in the text-to-speech settings; on a computer, in its speech or narrator settings.';

export const RECORDINGS_HELP =
  'Bring in audio you already have, such as a guided relaxation, a hypnotherapy programme you bought or music you like. Each recording is kept in the Recordings folder in your shared folder, so it takes no room on a device until it is played there, and any player can open it from the folder too. The computer plays it here. On a phone it opens in another app for now, and playing it inside this app comes with the next full install.';
