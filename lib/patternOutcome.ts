// What Pattern Finder looks for patterns before (D1, 2026-09-26). Until now
// it was always flares and food reactions; mood, energy and stress answers
// make three more outcomes possible: days with a low mood, days with low
// energy, and days under a lot of stress.
//
// Pure and free of runtime imports (scripts/test_daily_scales.js loads it
// directly). The words each outcome is described with live here too, so
// every sentence Pattern Finder writes names what was actually counted
// rather than calling a low-mood day a flare.

export type PatternOutcome = 'flares' | 'lowMood' | 'lowEnergy' | 'highStress';

export type OutcomeWords = {
  /** "flare or reaction", counted: "Based on 1 flare or reaction". */
  one: string;
  /** "flares and reactions". */
  many: string;
  /** Used where one event is named on its own: "before a flare". */
  short: string;
  /** "within a week before 3 flares". */
  shortMany: string;
  /** What a rule sentence counts: "3 of my 5 logged flares". */
  owner: 'my' | 'the';
  logged: string;
  loggedMany: string;
};

export const PATTERN_OUTCOMES: { key: PatternOutcome; label: string }[] = [
  { key: 'flares', label: 'Flares and reactions' },
  { key: 'lowMood', label: 'Low mood days' },
  { key: 'lowEnergy', label: 'Low energy days' },
  { key: 'highStress', label: 'High stress days' },
];

export const OUTCOME_WORDS: Record<PatternOutcome, OutcomeWords> = {
  flares: {
    one: 'flare or reaction',
    many: 'flares and reactions',
    short: 'flare',
    shortMany: 'flares',
    owner: 'my',
    logged: 'logged flare or reaction',
    loggedMany: 'logged flares or reactions',
  },
  lowMood: {
    one: 'low mood day',
    many: 'low mood days',
    short: 'low mood day',
    shortMany: 'low mood days',
    owner: 'the',
    logged: 'day I rated my mood 1 or 2',
    loggedMany: 'days I rated my mood 1 or 2',
  },
  lowEnergy: {
    one: 'low energy day',
    many: 'low energy days',
    short: 'low energy day',
    shortMany: 'low energy days',
    owner: 'the',
    logged: 'day I rated my energy 1 or 2',
    loggedMany: 'days I rated my energy 1 or 2',
  },
  highStress: {
    one: 'high stress day',
    many: 'high stress days',
    short: 'high stress day',
    shortMany: 'high stress days',
    owner: 'the',
    logged: 'day I rated my stress 4 or 5',
    loggedMany: 'days I rated my stress 4 or 5',
  },
};

// Which answer counts. The two ends of each scale, and nothing in the
// middle, so a 3 is never read as a bad day.
const SCALE_OF: Record<Exclude<PatternOutcome, 'flares'>, { key: 'mood' | 'energy' | 'stress'; counts: (value: number) => boolean }> = {
  lowMood: { key: 'mood', counts: (value) => value <= 2 },
  lowEnergy: { key: 'energy', counts: (value) => value <= 2 },
  highStress: { key: 'stress', counts: (value) => value >= 4 },
};

export function outcomeCountsSentence(outcome: PatternOutcome): string {
  switch (outcome) {
    case 'flares':
      return 'Counting every flare and food reaction logged in Signals.';
    case 'lowMood':
      return 'Counting each day you rated your mood 1 or 2, once per day, at the time of that answer.';
    case 'lowEnergy':
      return 'Counting each day you rated your energy 1 or 2, once per day, at the time of that answer.';
    case 'highStress':
      return 'Counting each day you rated your stress 4 or 5, once per day, at the time of that answer.';
  }
}

export function emptyOutcomeSentence(outcome: PatternOutcome): string {
  if (outcome === 'flares') return "Log a flare or food reaction in Signals first; there's nothing to look for a pattern in yet.";
  const scale = SCALE_OF[outcome].key;
  const which = outcome === 'highStress' ? '4 or 5' : '1 or 2';
  return `No day in this range has a ${scale} answer of ${which}. Answer mood, energy and stress on Home's Today's Check-In or in Signals > General Note, and days that fit will show up here.`;
}

export type OutcomeCheckin = {
  loggedAt: string;
  mood: number | null;
  energy: number | null;
  stress: number | null;
};

// The check-ins a scale outcome is made of: one per local day, the latest
// answer that day (a second answer is a correction), kept only when it
// lands in the counted end of the scale. `localStampOf` is passed in rather
// than imported so this file keeps no runtime imports.
export function scaleOutcomeEvents<T extends OutcomeCheckin>(
  checkins: T[],
  outcome: Exclude<PatternOutcome, 'flares'>,
  rangeStart: string,
  localStampOf: (loggedAt: string) => string,
): (T & { loggedAt: string })[] {
  const { key, counts } = SCALE_OF[outcome];
  const latest = new Map<string, { stamp: string; checkin: T }>();
  for (const checkin of checkins) {
    const value = checkin[key];
    if (value == null) continue;
    const stamp = localStampOf(checkin.loggedAt);
    const day = stamp.slice(0, 10);
    if (day < rangeStart) continue;
    const seen = latest.get(day);
    if (!seen || stamp >= seen.stamp) latest.set(day, { stamp, checkin });
  }
  return [...latest.values()]
    .filter(({ checkin }) => counts(checkin[key] as number))
    .map(({ stamp, checkin }) => ({ ...checkin, loggedAt: stamp }))
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
}
