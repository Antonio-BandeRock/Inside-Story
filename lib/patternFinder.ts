import { getConditionScoresForFoodsBulk, getDatabase, getMealItemsInWindow, getStepCountTrend, listCheckins } from './db';
import {
  compareWindows,
  keysInWindow,
  MIN_PATTERN_OCCURRENCES,
  usualWindowEnds,
  verdictRank,
  type MealMoment,
  type PatternBasis,
  type PatternComparison,
} from './patternBasis';
import { contextLines, type TreatmentDates } from './patternContext';
import { OUTCOME_WORDS, scaleOutcomeEvents, type PatternOutcome } from './patternOutcome';
import { localStampOf } from './dailyScales';
import { getNutrientTrendSeriesForRange, getSleepTrendPoints } from './trendAnalysis';
import { getCheckinTagDefinition } from './checkinTags';
import { listScheduledDoses, rangeForDays } from './trendsMoreDb';
import { localClock, localDay } from './trendsMore';
import { trackerDailySeries } from './customTrackers';
import { listCustomTrackers, listTrackerEntriesSince } from './customTrackersDb';
import {
  assembleFactorFamilies,
  dayEndAt,
  doseMoments,
  findFactorCandidates,
  NOT_RECORDED_LINE,
  sleepAt,
  tagMoments,
  trackerMoments,
  usualRangeMoments,
  DAY_TOTAL_MIN_HOURS,
  type FactorFamilyResult,
  type FactorGroup,
  type FactorMoment,
  type TrackerDay,
} from './patternFactors';
import { isFlaggedTier } from './sixDimensionsReference';
import { listWorkCheckins } from './workDb';
import {
  compareMovementAgainstSymptoms,
  isMovementRefusal,
  weeksFromDailySteps,
  type MovementComparison,
  type MovementRefusal,
} from './movementMeaning';
import {
  compareStrainAgainstSymptoms,
  isStrainRefusal,
  weekOf,
  type StrainComparison,
  type StrainRefusal,
} from './workMeaning';

// The app's own core-mission gap, named directly in Trends' own in-app
// caveat since it was written: "Actually matching flares to specific
// foods or timing is a bigger, separate piece of work this app doesn't
// do yet." Built 2026-08-15 to close it -- but deliberately conservative
// about what it claims. This surfaces real correlations already present
// in a person's own logged data (what got eaten before a symptom, how
// many times), never a diagnosis and never a statistical "confidence"
// figure -- see the project's own standing "Signal quality" risk note.
// A candidate only ever appears once it's shown up before at least
// MIN_PATTERN_OCCURRENCES separate flare instances (lib/patternBasis.ts,
// which also says on screen that two can be chance).

export const PATTERN_WINDOW_HOURS = [6, 12, 24, 48] as const;
export type PatternWindowHours = (typeof PATTERN_WINDOW_HOURS)[number];

// Kept in sync by hand with lib/conditionDimensions.ts's own identical
// set -- see that file's own comment for why this small, 2-entry
// duplication is accepted rather than imported. Without this, Selenium &
// Zn synergy alone (a background signal on roughly half the reference
// database) would trivially clear MIN_PATTERN_OCCURRENCES for almost any tracked
// condition that owns it, burying every genuinely rare, worth-noticing
// candidate under one meaningless one.
const NEAR_UNIVERSAL_SUB_CRITERIA = new Set(['Selenium & Zn synergy', 'Iron Presence']);

export type FoodPatternCandidate = {
  kind: 'food';
  foodId: number;
  source: string;
  foodName: string;
  category: string | null;
  occurrenceCount: number;
  comparison: PatternComparison;
};

// 2026-08-26, rebuilt to be condition-scoped -- see this file's own
// findFoodPatterns comment for the full reasoning. conditionCode/
// conditionName name which of the person's own tracked conditions this
// candidate is actually relevant to (a shared sub-criterion can be
// relevant to more than one tracked condition at once, and now surfaces
// as a distinct candidate under each). Keyed by subCriterion, not just
// dimension+tier -- the pre-2026-08-26 version keyed on dimension+tier
// alone, which could silently merge two genuinely different sub-criteria
// that happened to share both, a real bug fixed in the same pass as the
// condition-scoping itself.
export type DimensionPatternCandidate = {
  kind: 'dimension';
  conditionCode: string;
  conditionName: string;
  dimension: string;
  subCriterion: string;
  tier: string;
  occurrenceCount: number;
  comparison: PatternComparison;
};

export type CategoryPatternCandidate = {
  kind: 'category';
  category: string;
  occurrenceCount: number;
  comparison: PatternComparison;
};

// Work strain, added 2026-09-05, and deliberately NOT a candidate array
// like the three above it.
//
// Those count occurrences inside a 6 to 48 hour window before a flare. A
// work answer covers a whole WEEK, so it cannot go in one of those windows:
// the week contains the flare and six other days, and calling a weekly
// rating an antecedent of a Tuesday evening would be a category error
// dressed up as a correlation.
//
// So it is a between-groups comparison instead, and it keeps its own field
// with its own name so nothing conflates the two. The arithmetic and every
// refusal live in lib/workMeaning.ts, which is testable without a database;
// this file only assembles the inputs.
export type PatternFinderResult = {
  /** What was counted: flares and reactions, or a kind of day (D1). */
  outcome: PatternOutcome;
  // The real denominator for "logged before N of your M flares" -- every
  // symptom check-in actually considered, whether or not it produced any
  // candidate on its own.
  totalSymptomInstances: number;
  /** What every count is measured against (lib/patternBasis.ts). */
  basis: PatternBasis;
  /** Other things on record around the same flares (lib/patternContext.ts). */
  context: string[];
  foodCandidates: FoodPatternCandidate[];
  dimensionCandidates: DimensionPatternCandidate[];
  categoryCandidates: CategoryPatternCandidate[];
  /** Empty when there is not enough to say anything, in which case
   *  workStrainRefusal names which piece is missing. */
  workStrainComparisons: StrainComparison[];
  workStrainRefusal: StrainRefusal | null;
  /** Steps a day, week by week, beside the same flares (2026-09-14). Null
   *  when there is not enough to say anything, in which case
   *  movementRefusal names which piece is missing. */
  movementComparison: MovementComparison | null;
  movementRefusal: MovementRefusal | null;
  /** F1: everything besides food, each family counted against the outcomes
   *  that had it recorded before them (lib/patternFactors.ts). */
  factorFamilies: FactorFamilyResult[];
  /** Lines about the factors as a whole, such as what is not recorded yet. */
  factorNotes: string[];
};

// F1, 2026-09-26. Reads everything besides food that the app records and
// turns it into moments for lib/patternFactors.ts, which does the counting
// and holds every sentence.
async function findFactorFamilies(input: {
  days: number;
  rangeStart: string;
  today: string;
  now: Date;
  windowHours: PatternWindowHours;
  outcomeEnds: (Date | null)[];
  words: { one: string; many: string };
  sleepPoints: { date: string; value: number }[];
}): Promise<FactorFamilyResult[]> {
  const { days, rangeStart, today, now, windowHours } = input;
  const reachBack = dateStringDaysAgo(days + 1);
  const dayTotals = windowHours >= DAY_TOTAL_MIN_HOURS;
  const [checkins, doses, stepRows, water, trackers, trackerEntries] = await Promise.all([
    listCheckins({ limit: 2000 }),
    listScheduledDoses(rangeForDays(days + 2, today)),
    getStepCountTrend(days + 2),
    dayTotals ? getNutrientTrendSeriesForRange('water', reachBack, today) : Promise.resolve(null),
    listCustomTrackers(),
    listTrackerEntriesSince(reachBack),
  ]);

  const moments: FactorMoment[] = [];
  const groups: FactorGroup[] = [];
  const labels = new Map<string, string>();

  const tagged = tagMoments(
    checkins
      .map((checkin) => ({ at: localStampOf(checkin.loggedAt), tags: checkin.tags }))
      .filter((checkin) => checkin.at.slice(0, 10) >= reachBack),
  );
  if (tagged.length > 0) {
    moments.push(...tagged);
    groups.push({ group: 'tags', family: 'tags', noun: 'a check-in tag', dayTotal: false, usualShort: null });
    for (const moment of tagged) {
      for (const key of moment.keys) {
        const code = key.slice(4);
        labels.set(key, getCheckinTagDefinition(code)?.label ?? code);
      }
    }
  }

  const nights = input.sleepPoints.filter((point) => point.date >= reachBack);
  if (nights.length > 0) {
    const made = usualRangeMoments(nights, 'sleep', 'sleep', sleepAt);
    moments.push(...made.moments);
    groups.push({ group: 'sleep', family: 'sleep', noun: 'sleep', dayTotal: false, usualShort: made.usualShort });
    labels.set('sleep:below', 'Nights shorter than your usual range');
    labels.set('sleep:above', 'Nights longer than your usual range');
  }

  const marked = doseMoments(
    doses.map((dose) => ({ ...dose, scheduledFor: `${localDay(dose.scheduledFor)}T${localClock(dose.scheduledFor) ?? '00:00'}` })),
  );
  if (marked.length > 0) {
    moments.push(...marked);
    groups.push({ group: 'doses', family: 'doses', noun: 'a dose marked taken or skipped', dayTotal: false, usualShort: null });
    for (const moment of marked) for (const key of moment.keys) labels.set(key, `${key.slice(5)} skipped`);
  }

  // Today is left out of every day total, since today's figure is not whole.
  const steps = stepRows
    .filter((row) => row.date >= reachBack && row.date < today)
    .map((row) => ({ date: row.date, value: row.stepCount }));
  if (steps.length > 0) {
    const made = usualRangeMoments(steps, 'steps', 'steps', dayEndAt);
    moments.push(...made.moments);
    groups.push({ group: 'steps', family: 'steps', noun: 'a day of steps', dayTotal: true, usualShort: made.usualShort });
    labels.set('steps:below', 'Days with fewer steps than your usual range');
    labels.set('steps:above', 'Days with more steps than your usual range');
  }

  // Water is only read when it can be counted, since reading it means
  // working out every meal's nutrients across the range. Below 24 hours the
  // family still shows, saying when it is counted.
  const waterDays = (water?.points ?? [])
    .filter((point) => point.date < today)
    .map((point) => ({ date: point.date, value: point.value }));
  if (waterDays.length > 0 || !dayTotals) {
    const made = usualRangeMoments(waterDays, 'water', 'water', dayEndAt);
    moments.push(...made.moments);
    groups.push({ group: 'water', family: 'water', noun: 'a day of water', dayTotal: true, usualShort: made.usualShort });
    labels.set('water:below', 'Days with less water than your usual range');
    labels.set('water:above', 'Days with more water than your usual range');
  }

  const trackerDays: TrackerDay[] = [];
  for (const tracker of trackers) {
    const entries = trackerEntries.filter((entry) => entry.trackerId === tracker.id);
    if (entries.length === 0) continue;
    const lastAt = new Map<string, string>();
    for (const entry of entries) {
      const day = entry.loggedAt.slice(0, 10);
      if ((lastAt.get(day) ?? '') < entry.loggedAt) lastAt.set(day, entry.loggedAt);
    }
    for (const point of trackerDailySeries(tracker.kind, entries, reachBack)) {
      trackerDays.push({
        trackerId: tracker.id,
        date: point.date,
        value: point.value,
        lastAt: lastAt.get(point.date) ?? dayEndAt(point.date),
      });
    }
  }
  const trackerMade = trackerMoments(trackerDays);
  moments.push(...trackerMade.moments);
  for (const tracker of trackers) {
    if (!trackerDays.some((day) => day.trackerId === tracker.id)) continue;
    groups.push({
      group: `tr:${tracker.id}`,
      family: 'trackers',
      noun: tracker.name,
      dayTotal: false,
      usualShort: trackerMade.usualShort.get(tracker.id) ?? null,
    });
    labels.set(`tr:${tracker.id}:below`, `${tracker.name}: below your usual range`);
    labels.set(`tr:${tracker.id}:above`, `${tracker.name}: above your usual range`);
  }

  const counted = findFactorCandidates({
    moments,
    groups,
    outcomeEnds: input.outcomeEnds,
    usualEnds: usualWindowEnds(rangeStart, today, now),
    windowHours,
    label: (key) => labels.get(key) ?? key,
  });
  return assembleFactorFamilies(groups, counted, input.outcomeEnds.length, windowHours, input.words);
}

// Same 'YYYY-MM-DD' local-time convention already duplicated across this
// app's own screens (see trendAnalysis.ts's own identical comment) --
// kept local here rather than imported, matching that same precedent.
function dateStringDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// The inverse of resolveDateTime's own `${date}T${time24}` construction
// (app/(tabs)/log.tsx) -- re-formats a real, local-time-parsed Date back
// into the exact same plain 'YYYY-MM-DDTHH:mm' shape meals.eaten_at and
// wellbeing_checkins.logged_at both already use, so the window computed
// below stays comparable to them. Deliberately NOT toISOString() -- that
// converts to UTC and would silently reintroduce the exact timezone
// mismatch this whole function's own comparisons depend on not having.
function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// When each medication and supplement started and stopped, for the
// "other things that changed" lines. Dates only; nothing about doses.
async function listTreatmentDates(): Promise<TreatmentDates[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ name: string; start_date: string | null; end_date: string | null }>(
    'SELECT name, start_date, end_date FROM treatments WHERE start_date IS NOT NULL OR end_date IS NOT NULL',
  );
  return rows.map((row) => ({ name: row.name, startDate: row.start_date, endDate: row.end_date }));
}

// trackedConditions, 2026-08-26 -- the person's own conditions, set in
// Profile, no separate picker here. Direct instruction carried over from
// the rest of this same rebuild: "use the condition picked from the
// profile for all of these." A real, named trade-off, not a free
// improvement: dimension candidates now only ever surface a concern
// relevant to a tracked condition, narrower than the old version, which
// checked every sub-criterion this app currently scores at all regardless
// of relevance. Tracking nothing yet means no dimension candidates at
// all (an honest empty state), not a fallback to the old, noisier,
// generic behavior -- unlike the flag-count fix (phase 4 of this same
// rebuild), there's no real "your own condition" concept left to check
// once nothing is tracked, and falling back to the generic list would
// just reintroduce the near-universal noise this rebuild exists to
// remove. Food and category candidates are untouched: "you logged this
// before N flares" is a real correlation independent of any condition's
// own scoring, not something that needs this same scoping.
export async function findFoodPatterns(
  days: number,
  windowHours: PatternWindowHours,
  trackedConditions: { code: string; name: string }[],
  outcome: PatternOutcome = 'flares',
): Promise<PatternFinderResult> {
  const rangeStart = dateStringDaysAgo(days - 1);
  const words = OUTCOME_WORDS[outcome];

  // Flares and reactions are the two real checkin types Trends' own
  // Symptoms & Flares lens already charts (getCheckinSeverityTrendSeries)
  // -- the same real symptom population, reused here rather than a
  // separately-decided one.
  //
  // D1, 2026-09-26: or, when asked, the days somebody rated their mood or
  // energy 1 or 2, or their stress 4 or 5, one per day at the time of that
  // answer (lib/patternOutcome.ts). Everything below counts whichever
  // population this is; only the words change.
  const symptomCheckins =
    outcome === 'flares'
      ? await Promise.all([
          listCheckins({ checkinType: 'flare', limit: 200 }),
          listCheckins({ checkinType: 'post_meal', limit: 200 }),
        ]).then(([flares, reactions]) =>
          [...flares, ...reactions].filter(
            (checkin) => checkin.severity != null && checkin.loggedAt.slice(0, 10) >= rangeStart,
          ),
        )
      : scaleOutcomeEvents(await listCheckins({ checkinType: 'general', limit: 1000 }), outcome, rangeStart, localStampOf);

  // Phase B, 2026-09-24: every meal in the range is read once, and both the
  // flare windows and the ordinary stretches they are compared against are
  // cut from that one list (lib/patternBasis.ts), so a food's count before
  // flares and its count on any day come from the same records. Reaching
  // back two days before the range lets a 48-hour window on the first day
  // see what came before it.
  const now = new Date();
  const today = toLocalDateTimeString(now).slice(0, 10);
  const items = await getMealItemsInWindow(`${dateStringDaysAgo(days + 1)}T00:00`, toLocalDateTimeString(now));

  const foodInfo = new Map<string, { foodName: string; category: string | null; foodId: number; source: string }>();
  const distinctFoodPairs = new Map<string, { foodId: number; source: string }>();
  const daysWithMeals = new Set<string>();
  for (const item of items) {
    if (item.eatenAt.slice(0, 10) >= rangeStart) daysWithMeals.add(item.eatenAt.slice(0, 10));
    if (!item.foodId) continue;
    const [foodIdStr, source] = item.foodId.split('|');
    const foodId = Number(foodIdStr);
    if (!Number.isFinite(foodId) || !source) continue;
    const foodKey = `${foodId}|${source}`;
    distinctFoodPairs.set(foodKey, { foodId, source });
    if (!foodInfo.has(foodKey)) foodInfo.set(foodKey, { foodName: item.foodName, category: item.category, foodId, source });
  }

  // Dimension keys need each food's condition scores, fetched once for
  // every food in the range so the ordinary stretches carry them too.
  const dimensionInfo = new Map<
    string,
    { conditionCode: string; conditionName: string; dimension: string; subCriterion: string; tier: string }
  >();
  const dimensionKeysByFood = new Map<string, string[]>();
  if (trackedConditions.length > 0 && distinctFoodPairs.size > 0) {
    const conditionScoresByFood = await getConditionScoresForFoodsBulk(
      Array.from(distinctFoodPairs.values()),
      trackedConditions.map((condition) => condition.code),
    );
    for (const [foodKey, byCondition] of conditionScoresByFood) {
      const keys: string[] = [];
      for (const condition of trackedConditions) {
        for (const score of byCondition.get(condition.code) ?? []) {
          if (NEAR_UNIVERSAL_SUB_CRITERIA.has(score.subCriterion)) continue;
          if (!isFlaggedTier(score.tier)) continue;
          const key = `d:${condition.code}::${score.subCriterion}::${score.tier}`;
          keys.push(key);
          if (!dimensionInfo.has(key)) {
            dimensionInfo.set(key, {
              conditionCode: condition.code,
              conditionName: condition.name,
              dimension: score.dimension,
              subCriterion: score.subCriterion,
              tier: score.tier,
            });
          }
        }
      }
      dimensionKeysByFood.set(foodKey, keys);
    }
  }

  // Every key a meal item stands for: the food itself, its category, and
  // each flagged concern it carries for a tracked condition. Eating the
  // same food three times before one flare is one occurrence, since each
  // window is a set.
  const meals: MealMoment[] = items.map((item) => {
    const keys: string[] = [];
    if (item.category) keys.push(`c:${item.category}`);
    if (item.foodId) {
      const [foodIdStr, source] = item.foodId.split('|');
      const foodKey = `${Number(foodIdStr)}|${source}`;
      if (foodInfo.has(foodKey)) {
        keys.push(`f:${foodKey}`);
        keys.push(...(dimensionKeysByFood.get(foodKey) ?? []));
      }
    }
    return { eatenAt: item.eatenAt, keys };
  });

  const flareWindows = symptomCheckins.map((checkin) => {
    const end = new Date(checkin.loggedAt);
    return Number.isNaN(end.getTime()) ? null : keysInWindow(meals, end, windowHours);
  });
  const usualWindows = usualWindowEnds(rangeStart, today, now).map((end) => keysInWindow(meals, end, windowHours));
  const flaresWithMeals = flareWindows.filter((window) => window !== null).length;

  const beforeCounts = new Map<string, number>();
  for (const window of flareWindows) {
    for (const key of window ?? []) beforeCounts.set(key, (beforeCounts.get(key) ?? 0) + 1);
  }
  const counted = [...beforeCounts.entries()]
    .filter(([, count]) => count >= MIN_PATTERN_OCCURRENCES)
    .map(([key, count]) => ({ key, count, comparison: compareWindows(key, flareWindows, usualWindows) }));
  const byStanding = (a: { count: number; comparison: PatternComparison }, b: { count: number; comparison: PatternComparison }) =>
    verdictRank(a.comparison.verdict) - verdictRank(b.comparison.verdict) || b.count - a.count;

  const foodCandidates: FoodPatternCandidate[] = counted
    .filter((entry) => entry.key.startsWith('f:'))
    .sort((a, b) => byStanding(a, b) || foodInfo.get(a.key.slice(2))!.foodName.localeCompare(foodInfo.get(b.key.slice(2))!.foodName))
    .map((entry) => {
      const info = foodInfo.get(entry.key.slice(2))!;
      return {
        kind: 'food' as const,
        foodId: info.foodId,
        source: info.source,
        foodName: info.foodName,
        category: info.category,
        occurrenceCount: entry.count,
        comparison: entry.comparison,
      };
    });

  const dimensionCandidates: DimensionPatternCandidate[] = counted
    .filter((entry) => entry.key.startsWith('d:'))
    .map((entry) => ({ kind: 'dimension' as const, ...dimensionInfo.get(entry.key)!, occurrenceCount: entry.count, comparison: entry.comparison }))
    .sort((a, b) => byStanding({ count: a.occurrenceCount, comparison: a.comparison }, { count: b.occurrenceCount, comparison: b.comparison }) || a.subCriterion.localeCompare(b.subCriterion));

  const categoryCandidates: CategoryPatternCandidate[] = counted
    .filter((entry) => entry.key.startsWith('c:'))
    .map((entry) => ({ kind: 'category' as const, category: entry.key.slice(2), occurrenceCount: entry.count, comparison: entry.comparison }))
    .sort((a, b) => byStanding({ count: a.occurrenceCount, comparison: a.comparison }, { count: b.occurrenceCount, comparison: b.comparison }) || a.category.localeCompare(b.category));

  // Other things on record around the same flares (lib/patternContext.ts).
  const flareDates = symptomCheckins.map((checkin) => checkin.loggedAt.slice(0, 10));
  const [sleepPoints, treatmentDates] = await Promise.all([getSleepTrendPoints(days + 1), listTreatmentDates()]);
  const context = contextLines({
    flareDates,
    nights: sleepPoints.filter((point) => point.date >= rangeStart).map((point) => ({ date: point.date, hours: point.value })),
    treatments: treatmentDates,
    flares: symptomCheckins.length,
    flaresWithMeals,
    windowHours,
    words,
  });

  // Work strain. The symptom population is the same one every candidate above
  // was counted from, grouped into the weeks it fell in, so the two halves of
  // this screen are talking about the same flares.
  //
  // Every week that has a work answer gets an entry, including weeks with zero
  // symptoms, because a week someone answered and had no flare in is a real
  // data point. A week with no work answer contributes nothing, since an
  // unanswered week is unknown rather than easy.
  // Weekly work answers and weekly steps are compared against flares only;
  // for a kind of day, both are left out rather than half reworded.
  const weeklyApplies = outcome === 'flares';
  const workCheckins = weeklyApplies ? (await listWorkCheckins()).filter((checkin) => checkin.weekOf >= weekOf(rangeStart)) : [];
  const symptomsByWeek = new Map<string, number>();
  for (const checkin of workCheckins) symptomsByWeek.set(checkin.weekOf, 0);
  for (const checkin of symptomCheckins) {
    const week = weekOf(checkin.loggedAt.slice(0, 10));
    if (!symptomsByWeek.has(week)) continue;
    symptomsByWeek.set(week, (symptomsByWeek.get(week) ?? 0) + 1);
  }

  const strain = compareStrainAgainstSymptoms({
    checkins: workCheckins,
    weeks: [...symptomsByWeek.entries()].map(([week, symptomCount]) => ({ weekOf: week, symptomCount })),
  });

  // Movement, the same way: the weeks the phone recorded enough days of
  // steps for, each beside the flares logged in it. A week the phone has no
  // steps for is unknown rather than still, so it contributes nothing.
  const stepDays = weeklyApplies ? (await getStepCountTrend(days)).filter((row) => row.date >= rangeStart) : [];
  const movementWeeks = weeksFromDailySteps(stepDays);
  const symptomsByMovementWeek = new Map<string, number>();
  for (const week of movementWeeks) symptomsByMovementWeek.set(week.weekOf, 0);
  for (const checkin of symptomCheckins) {
    const week = weekOf(checkin.loggedAt.slice(0, 10));
    if (!symptomsByMovementWeek.has(week)) continue;
    symptomsByMovementWeek.set(week, (symptomsByMovementWeek.get(week) ?? 0) + 1);
  }
  const movement = compareMovementAgainstSymptoms({ weeks: movementWeeks, symptomsByWeek: symptomsByMovementWeek });

  const factorFamilies =
    symptomCheckins.length === 0
      ? []
      : await findFactorFamilies({
          days,
          rangeStart,
          today,
          now,
          windowHours,
          outcomeEnds: symptomCheckins.map((checkin) => {
            const end = new Date(checkin.loggedAt);
            return Number.isNaN(end.getTime()) ? null : end;
          }),
          words: { one: words.one, many: words.many },
          sleepPoints,
        });

  return {
    outcome,
    totalSymptomInstances: symptomCheckins.length,
    basis: {
      flares: symptomCheckins.length,
      flaresWithMeals,
      windowHours,
      daysInRange: days,
      daysWithMeals: daysWithMeals.size,
    },
    context,
    foodCandidates,
    dimensionCandidates,
    categoryCandidates,
    workStrainComparisons: !weeklyApplies || isStrainRefusal(strain) ? [] : strain.comparisons,
    workStrainRefusal: weeklyApplies && isStrainRefusal(strain) ? strain : null,
    movementComparison: !weeklyApplies || isMovementRefusal(movement) ? null : movement,
    movementRefusal: weeklyApplies && isMovementRefusal(movement) ? movement : null,
    factorFamilies,
    factorNotes: [NOT_RECORDED_LINE],
  };
}
