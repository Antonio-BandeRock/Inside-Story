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

// --- Does a harder week show up in how you felt? ----------------------------
//
// Added 2026-09-05, wiring work into Pattern Finder, which was named as the
// obvious next step when this module shipped.
//
// THE GRANULARITY PROBLEM, WHICH RULES OUT THE OBVIOUS APPROACH.
//
// Pattern Finder asks what was logged in the 6, 12, 24 or 48 hours BEFORE a
// flare. A work answer covers a whole week, so it cannot be put in one of
// those windows: the week contains the flare and six other days, and calling a
// weekly rating an antecedent of a Tuesday evening would be a category error
// dressed up as a correlation.
//
// So this is a different question, and a between-groups one rather than a
// within-window one: in the weeks you rated work worse than your own average,
// did more symptoms turn up than in the weeks you rated it better?
//
// SPLIT ON THE PERSON'S OWN AVERAGE, NOT A FIXED NUMBER.
//
// A threshold like "drain of 4 or more is a hard week" gives someone who never
// rates above 3 no hard weeks at all, and someone who always rates 5 no easy
// ones. Splitting on their own mean adapts to whatever range they actually use.
//
// Weeks landing exactly on the mean go in NEITHER group. They are neither
// better nor worse, and pushing them to one side would tilt the answer on an
// arbitrary choice. How many were set aside is reported, so the two figures are
// not read as covering every week.
//
// WHAT THIS IS NOT.
//
// Not causation, not a p-value, not a confidence figure, matching the rule the
// rest of Pattern Finder already holds. And four dimensions compared at once on
// a handful of weeks means one of them looking meaningful by luck is likely
// rather than surprising, which the wording says out loud rather than leaving
// for someone to work out.

export type WeekOutcome = { weekOf: string; symptomCount: number };

export type StrainComparison = {
  dimension: WorkDimension;
  /** Weeks rated worse than the person's own average FOR THIS DIMENSION,
   *  which for drain means higher and for the other three means lower. */
  worseWeeks: number;
  betterWeeks: number;
  /** Weeks sitting exactly on the average, in neither group. */
  setAside: number;
  symptomsPerWeekWhenWorse: number;
  symptomsPerWeekWhenBetter: number;
  /** Worse minus better. Positive means more symptoms in the weeks work was
   *  worse, which is the direction someone would expect and still not proof. */
  difference: number;
  /** Big enough to be worth a sentence rather than noise. */
  notable: boolean;
};

export type StrainRefusal = {
  reason: 'notEnoughWeeks' | 'noVariation' | 'groupTooSmall' | 'noSymptoms';
  weeksAnswered: number;
};

/** Fewer weeks than this and there is nothing to split into two groups. */
export const MIN_WEEKS_FOR_STRAIN_PATTERN = 6;
/** And each side needs more than a single week, or it is one week against
 *  several rather than a comparison. */
export const MIN_WEEKS_PER_GROUP = 2;
/** Below this difference in symptoms per week, the two groups are the same as
 *  far as anyone can tell from this much data. A stated judgment call. */
export const NOTABLE_DIFFERENCE = 0.5;

export function compareStrainAgainstSymptoms(input: {
  checkins: WorkCheckin[];
  weeks: WeekOutcome[];
}): { comparisons: StrainComparison[] } | StrainRefusal {
  const byWeek = new Map(input.weeks.map((week) => [week.weekOf, week.symptomCount]));
  // Only weeks that were both answered AND have a symptom count available can
  // take part. A week with no outcome recorded is unknown, not zero.
  const usable = input.checkins.filter((checkin) => byWeek.has(checkin.weekOf));

  if (usable.length < MIN_WEEKS_FOR_STRAIN_PATTERN) {
    return { reason: 'notEnoughWeeks', weeksAnswered: usable.length };
  }
  const anySymptoms = usable.some((checkin) => (byWeek.get(checkin.weekOf) ?? 0) > 0);
  if (!anySymptoms) return { reason: 'noSymptoms', weeksAnswered: usable.length };

  const comparisons: StrainComparison[] = [];
  let anyVariation = false;
  let anyBigEnoughGroup = false;

  for (const meta of WORK_DIMENSIONS) {
    const values = usable.map((checkin) => dimensionValue(checkin, meta.code));
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    if (values.some((value) => value !== values[0])) anyVariation = true;

    let worseTotal = 0;
    let worseWeeks = 0;
    let betterTotal = 0;
    let betterWeeks = 0;
    let setAside = 0;

    for (const checkin of usable) {
      const value = dimensionValue(checkin, meta.code);
      const symptoms = byWeek.get(checkin.weekOf) ?? 0;
      if (value === mean) {
        setAside += 1;
        continue;
      }
      // Worse means a lower number where higher is better, and a higher number
      // for drain. Getting this backwards would report a hard week as an easy
      // one, which is the whole risk in this function.
      const isWorse = meta.higherIsBetter ? value < mean : value > mean;
      if (isWorse) {
        worseWeeks += 1;
        worseTotal += symptoms;
      } else {
        betterWeeks += 1;
        betterTotal += symptoms;
      }
    }

    if (worseWeeks < MIN_WEEKS_PER_GROUP || betterWeeks < MIN_WEEKS_PER_GROUP) continue;
    anyBigEnoughGroup = true;

    const perWorse = worseTotal / worseWeeks;
    const perBetter = betterTotal / betterWeeks;
    comparisons.push({
      dimension: meta.code,
      worseWeeks,
      betterWeeks,
      setAside,
      symptomsPerWeekWhenWorse: perWorse,
      symptomsPerWeekWhenBetter: perBetter,
      difference: perWorse - perBetter,
      notable: Math.abs(perWorse - perBetter) >= NOTABLE_DIFFERENCE,
    });
  }

  if (!anyVariation) return { reason: 'noVariation', weeksAnswered: usable.length };
  if (!anyBigEnoughGroup) return { reason: 'groupTooSmall', weeksAnswered: usable.length };

  // Biggest gap first, by size in either direction, since a dimension where
  // the worse weeks were EASIER is just as worth seeing as the reverse.
  comparisons.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  return { comparisons };
}

export function isStrainRefusal(
  value: { comparisons: StrainComparison[] } | StrainRefusal,
): value is StrainRefusal {
  return 'reason' in value;
}

export function describeStrainRefusal(refusal: StrainRefusal): string {
  switch (refusal.reason) {
    case 'notEnoughWeeks':
      return `${refusal.weeksAnswered} of the ${MIN_WEEKS_FOR_STRAIN_PATTERN} weeks needed. Below that there is nothing to split into a harder half and an easier one.`;
    case 'noSymptoms':
      return 'No flares or reactions logged in the weeks you have answered, so there is nothing to compare them against. That is good news rather than a gap.';
    case 'noVariation':
      return 'Your answers have been the same every week so far, so there is no harder half and no easier half to tell apart.';
    case 'groupTooSmall':
      return `Not enough weeks on both sides yet. Each side needs at least ${MIN_WEEKS_PER_GROUP}, and so far one of them has fewer.`;
  }
}

export function describeStrainComparison(comparison: StrainComparison): string {
  const worse = comparison.symptomsPerWeekWhenWorse.toFixed(1);
  const better = comparison.symptomsPerWeekWhenBetter.toFixed(1);
  const label = dimensionLabel(comparison.dimension).toLowerCase();
  const base = `In the ${comparison.worseWeeks} weeks ${label} was worse than your own average, ${worse} flares or reactions a week. In the ${comparison.betterWeeks} weeks it was better, ${better}.`;

  if (!comparison.notable) {
    return `${base} Close enough that this does not say anything either way.`;
  }
  const direction =
    comparison.difference > 0
      ? 'More in the harder weeks, which is the direction you might expect.'
      : 'Fewer in the harder weeks, which is the opposite of what you might expect and worth noticing for that reason.';
  return `${base} ${direction}`;
}

export const STRAIN_CAVEAT =
  'This is your own weeks side by side and nothing more. It is not evidence that work caused anything: four things are being compared at once across a handful of weeks, which makes one of them looking meaningful by luck likely rather than surprising. Work strain does have a measured link to inflammation, and a large study also found no link between it and the onset of one of the conditions tracked here, so a pattern worth mentioning to someone is as far as this goes.';

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
