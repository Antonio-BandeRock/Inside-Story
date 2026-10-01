// What Pattern Finder looks for patterns before (D1, 2026-09-26). Until now
// it was always flares and food reactions; mood, energy and stress answers
// make three more outcomes possible: days with a low mood, days with low
// energy, and days under a lot of stress.
//
// Pure and free of runtime imports (scripts/test_daily_scales.js loads it
// directly). The words each outcome is described with live here too, so
// every sentence Pattern Finder writes names what was actually counted
// rather than calling a low-mood day a flare.

// D6 adds a fifth: days something on the daily list was rated Moderate or
// worse (lib/dailyList.ts). D10 adds two from the bowel log: days with a
// Bristol type 1 or 2, and days with a type 6 or 7 (lib/bowel.ts), named by
// the type numbers rather than called good or bad.
export type PatternOutcome =
  | 'flares'
  | 'lowMood'
  | 'lowEnergy'
  | 'highStress'
  | 'listSymptoms'
  | 'bowelTypesOneTwo'
  | 'bowelTypesSixSeven';
export type ScaleOutcome = 'lowMood' | 'lowEnergy' | 'highStress';

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
  { key: 'listSymptoms', label: 'Daily list days' },
  { key: 'bowelTypesOneTwo', label: 'Bristol type 1 or 2 days' },
  { key: 'bowelTypesSixSeven', label: 'Bristol type 6 or 7 days' },
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
  listSymptoms: {
    one: 'daily list day',
    many: 'daily list days',
    short: 'daily list day',
    shortMany: 'daily list days',
    owner: 'the',
    logged: 'day I rated something on my daily list Moderate or worse',
    loggedMany: 'days I rated something on my daily list Moderate or worse',
  },
  bowelTypesOneTwo: {
    one: 'Bristol type 1 or 2 day',
    many: 'Bristol type 1 or 2 days',
    short: 'type 1 or 2 day',
    shortMany: 'type 1 or 2 days',
    owner: 'the',
    logged: 'day I logged a Bristol type 1 or 2',
    loggedMany: 'days I logged a Bristol type 1 or 2',
  },
  bowelTypesSixSeven: {
    one: 'Bristol type 6 or 7 day',
    many: 'Bristol type 6 or 7 days',
    short: 'type 6 or 7 day',
    shortMany: 'type 6 or 7 days',
    owner: 'the',
    logged: 'day I logged a Bristol type 6 or 7',
    loggedMany: 'days I logged a Bristol type 6 or 7',
  },
};

// Which answer counts. The two ends of each scale, and nothing in the
// middle, so a 3 is never read as a bad day.
const SCALE_OF: Record<ScaleOutcome, { key: 'mood' | 'energy' | 'stress'; counts: (value: number) => boolean }> = {
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
    case 'listSymptoms':
      return 'Counting each day you rated something on your daily list Moderate or worse, once per day, at the time of that answer.';
    case 'bowelTypesOneTwo':
      return 'Counting each day you logged a Bristol type 1 or 2 in Signals > Bowel Movements, once per day, at the time of the first one.';
    case 'bowelTypesSixSeven':
      return 'Counting each day you logged a Bristol type 6 or 7 in Signals > Bowel Movements, once per day, at the time of the first one.';
  }
}

export function emptyOutcomeSentence(outcome: PatternOutcome): string {
  if (outcome === 'flares') return "Log a flare or food reaction in Signals first; there's nothing to look for a pattern in yet.";
  if (outcome === 'listSymptoms') {
    return "No day in this range has anything on your daily list rated Moderate or worse. The daily list is at the top of Home's Today's Check-In once you add a symptom to it.";
  }
  if (outcome === 'bowelTypesOneTwo' || outcome === 'bowelTypesSixSeven') {
    const which = outcome === 'bowelTypesOneTwo' ? '1 or 2' : '6 or 7';
    return `No day in this range has a Bristol type ${which} logged. Bowel movements go in Signals > Bowel Movements.`;
  }
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
  outcome: ScaleOutcome,
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
