// How work is actually going, as opposed to what it pays or provides.
//
// Built 2026-09-05, the second half of a direct request covering both readings
// of "intrinsic values that a person's work could offer them": the things you
// can claim, and the value in the work itself.
//
// WHERE THE THREE DIMENSIONS COME FROM, AND WHERE THE FOURTH DOES NOT.
//
// Autonomy, competence and relatedness are the three basic psychological needs
// of Self-Determination Theory (Deci and Ryan). That is a named framework with
// decades of work behind it, not something invented here, and it is attributed
// rather than presented as this app's idea.
//
// Checked rather than recalled, which mattered: the first draft of this had
// FOUR dimensions, adding meaning or purpose as though it were part of the same
// framework. It is not. SDT has three. Meaning at work has its own separate
// literature, and quietly folding it in would have misattributed it.
//
// So the fourth question here is deliberately NOT a psychological need. It is
// what this app exists to ask: how much did work take out of you physically.
// That is the bridge between this and every other thing the app records.
//
// WHAT THE EVIDENCE SUPPORTS, AND WHAT IT DOES NOT.
//
// Job strain has a measurable association with inflammation: the MONICA/KORA
// study found a robust link between job strain and CRP (PMID 22813435). The
// same study found that adjusting for leisure-time physical activity removed
// the effect, meaning activity mediates a good part of it, which is worth
// knowing because this app already records exercise.
//
// It does NOT support "work stress causes flares". An individual-participant
// meta-analysis of about 95,000 adults found job strain was NOT associated
// with the onset of Crohn's disease or ulcerative colitis (PMC3928274). That is
// a well-powered null and it is exactly why this module offers no causal
// claim, no score against a norm, and no advice.
//
// What it does instead is what the rest of the app does with n=1 data: record
// it honestly, report the person's own trend, and leave the interpretation to
// them. Pattern Finder already looks backward from a symptom for what preceded
// it, and work strain is a plausible antecedent nobody is currently recording.
// Wiring it in there is named as a next step and not done here.

export type WorkDimension = 'autonomy' | 'competence' | 'relatedness' | 'drain';

export const WORK_DIMENSIONS: {
  code: WorkDimension;
  label: string;
  question: string;
  /** True where a HIGH answer is the good direction. Drain inverts, and
   *  getting that backwards would turn a bad week into a good one. */
  higherIsBetter: boolean;
  source: 'sdt' | 'app';
}[] = [
  {
    code: 'autonomy',
    label: 'Say over how you work',
    question: 'How much choice did you have over how you did your work?',
    higherIsBetter: true,
    source: 'sdt',
  },
  {
    code: 'competence',
    label: 'Being good at it',
    question: 'How much did you feel effective at what you were doing?',
    higherIsBetter: true,
    source: 'sdt',
  },
  {
    code: 'relatedness',
    label: 'The people',
    question: 'How connected did you feel to the people you work with?',
    higherIsBetter: true,
    source: 'sdt',
  },
  {
    code: 'drain',
    label: 'What it took out of you',
    question: 'How much did work take out of you physically this week?',
    higherIsBetter: false,
    source: 'app',
  },
];

export const SDT_ATTRIBUTION =
  'Say over how you work, being good at it, and the people are the three basic psychological needs of Self-Determination Theory (Deci and Ryan). They are a long-established framework rather than anything this app came up with. What work took out of you is a fourth question this app adds for its own reasons, since it is the one that might line up with how you have been feeling.';

export const NO_SCORE_NOTE =
  'There is no score here and nothing to be graded against. Four answers a week, in your own words about your own weeks, is enough to see a direction. What it means is yours to read: work strain does have a measured relationship with inflammation, and a large study also found no link between job strain and the onset of at least one of the conditions this app tracks, so an app that told you what your answers meant about your health would be going well past what anyone knows.';

/** The scale. Deliberately short: five points is enough to see a direction and
 *  few enough to answer in a second, which is what decides whether anyone
 *  keeps doing it. */
export const SCALE_MIN = 1;
export const SCALE_MAX = 5;

export const SCALE_LABELS: Record<number, string> = {
  1: 'Hardly at all',
  2: 'A little',
  3: 'Some',
  4: 'Quite a lot',
  5: 'A great deal',
};

export type WorkCheckin = {
  id: string;
  /** The Monday of the week this covers, so one check-in per week and a
   *  second answer on the same week corrects rather than duplicates. */
  weekOf: string;
  autonomy: number;
  competence: number;
  relatedness: number;
  drain: number;
  note: string | null;
};

export function dimensionValue(checkin: WorkCheckin, dimension: WorkDimension): number {
  return checkin[dimension];
}

// --- Trend, measured and never scored ---------------------------------------

export type DimensionTrend = {
  dimension: WorkDimension;
  /** Mean across the check-ins given, which is a description of them and not
   *  a comparison against anybody else. */
  average: number;
  first: number;
  latest: number;
  /** Latest minus first. Positive means the number went up, which is only
   *  good news where higherIsBetter. */
  change: number;
  /** Whether the change is in the good direction for this dimension. Null
   *  when nothing changed, since "no movement" is not an improvement. */
  improving: boolean | null;
};

export type WorkTrend = {
  checkinCount: number;
  weeksCovered: number;
  dimensions: DimensionTrend[];
  /** The dimension that has moved furthest in the wrong direction, which is
   *  the honest answer to "what is getting worse". Null when nothing has. */
  worsening: DimensionTrend | null;
};

/** Below this there is no trend, only two data points and a straight line
 *  through them. Three weeks is the least that can show a direction. */
export const MIN_CHECKINS_FOR_TREND = 3;

export function buildWorkTrend(checkins: WorkCheckin[]): WorkTrend | null {
  if (checkins.length < MIN_CHECKINS_FOR_TREND) return null;
  const sorted = [...checkins].sort((a, b) => a.weekOf.localeCompare(b.weekOf));

  const dimensions: DimensionTrend[] = WORK_DIMENSIONS.map((meta) => {
    const values = sorted.map((entry) => dimensionValue(entry, meta.code));
    const first = values[0];
    const latest = values[values.length - 1];
    const change = latest - first;
    return {
      dimension: meta.code,
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
      first,
      latest,
      change,
      improving: change === 0 ? null : meta.higherIsBetter ? change > 0 : change < 0,
    };
  });

  // Worst movement in the wrong direction, by size of the move. Only
  // dimensions actually going the wrong way are eligible.
  const declining = dimensions.filter((entry) => entry.improving === false);
  const worsening =
    declining.length > 0
      ? declining.reduce((worst, entry) => (Math.abs(entry.change) > Math.abs(worst.change) ? entry : worst))
      : null;

  return {
    checkinCount: sorted.length,
    weeksCovered: distinctWeeks(sorted),
    dimensions,
    worsening,
  };
}

function distinctWeeks(checkins: WorkCheckin[]): number {
  return new Set(checkins.map((entry) => entry.weekOf)).size;
}

export function dimensionLabel(dimension: WorkDimension): string {
  return WORK_DIMENSIONS.find((entry) => entry.code === dimension)?.label ?? dimension;
}

export function describeWorkTrend(trend: WorkTrend | null): string {
  if (!trend) {
    return `Answer these for ${MIN_CHECKINS_FOR_TREND} weeks and a direction starts to show. Fewer than that is a couple of points and a line drawn through them.`;
  }
  const parts = [
    `${trend.checkinCount} ${trend.checkinCount === 1 ? 'week' : 'weeks'} answered.`,
  ];
  if (trend.worsening) {
    const meta = WORK_DIMENSIONS.find((entry) => entry.code === trend.worsening?.dimension);
    const direction = meta?.higherIsBetter ? 'down' : 'up';
    parts.push(
      `${dimensionLabel(trend.worsening.dimension)} has moved ${direction} the most since you started, from ${trend.worsening.first} to ${trend.worsening.latest}.`,
    );
  } else {
    parts.push('Nothing has moved in the wrong direction since you started.');
  }
  return parts.join(' ');
}

export function describeDimensionTrend(trend: DimensionTrend): string {
  const rounded = Math.round(trend.average * 10) / 10;
  const average = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  if (trend.improving === null) {
    return `Averaging ${average}, and the same now as when you started.`;
  }
  const word = trend.change > 0 ? 'up' : 'down';
  return `Averaging ${average}, ${word} from ${trend.first} to ${trend.latest}. ${trend.improving ? 'That is the better direction for this one.' : 'That is the worse direction for this one.'}`;
}

/** The Monday of the week a date falls in, so a check-in belongs to a week
 *  rather than a day and answering twice corrects instead of duplicating. */
export function weekOf(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  // getUTCDay: 0 is Sunday, so Sunday counts back six days rather than none.
  const day = parsed.getUTCDay();
  const back = day === 0 ? 6 : day - 1;
  parsed.setUTCDate(parsed.getUTCDate() - back);
  return parsed.toISOString().slice(0, 10);
}
