import { getConditionScoresForFoodsBulk, getMealItemsInWindow, listCheckins } from './db';
import { isFlaggedTier } from './sixDimensionsReference';

// The app's own core-mission gap, named directly in Trends' own in-app
// caveat since it was written: "Actually matching flares to specific
// foods or timing is a bigger, separate piece of work this app doesn't
// do yet." Built 2026-08-15 to close it -- but deliberately conservative
// about what it claims. This surfaces real correlations already present
// in a person's own logged data (what got eaten before a symptom, how
// many times), never a diagnosis and never a statistical "confidence"
// figure -- see the project's own standing "Signal quality" risk note.
// A candidate only ever appears once it's shown up before at least
// MIN_OCCURRENCES separate flare instances; one co-occurrence is a
// coincidence, not a pattern.

export const PATTERN_WINDOW_HOURS = [6, 12, 24, 48] as const;
export type PatternWindowHours = (typeof PATTERN_WINDOW_HOURS)[number];

const MIN_OCCURRENCES = 2;

// Kept in sync by hand with lib/conditionDimensions.ts's own identical
// set -- see that file's own comment for why this small, 2-entry
// duplication is accepted rather than imported. Without this, Selenium &
// Zn synergy alone (a background signal on roughly half the reference
// database) would trivially clear MIN_OCCURRENCES for almost any tracked
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
};

export type CategoryPatternCandidate = {
  kind: 'category';
  category: string;
  occurrenceCount: number;
};

export type PatternFinderResult = {
  // The real denominator for "logged before N of your M flares" -- every
  // symptom check-in actually considered, whether or not it produced any
  // candidate on its own.
  totalSymptomInstances: number;
  foodCandidates: FoodPatternCandidate[];
  dimensionCandidates: DimensionPatternCandidate[];
  categoryCandidates: CategoryPatternCandidate[];
};

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
): Promise<PatternFinderResult> {
  const rangeStart = dateStringDaysAgo(days - 1);

  // Flares and reactions are the two real checkin types Trends' own
  // Symptoms & Flares lens already charts (getCheckinSeverityTrendSeries)
  // -- the same real symptom population, reused here rather than a
  // separately-decided one.
  const [flares, reactions] = await Promise.all([
    listCheckins({ checkinType: 'flare', limit: 200 }),
    listCheckins({ checkinType: 'post_meal', limit: 200 }),
  ]);
  const symptomCheckins = [...flares, ...reactions].filter(
    (checkin) => checkin.severity != null && checkin.loggedAt.slice(0, 10) >= rangeStart,
  );

  const foodCounts = new Map<
    string,
    { count: number; foodName: string; category: string | null; foodId: number; source: string }
  >();
  const categoryCounts = new Map<string, { count: number; category: string }>();

  // Every checkin's own window, resolved to its own distinct foods once
  // here and kept for the condition-scoped second pass below -- dimension
  // candidates need the bulk-fetched condition scores, only available
  // once every distinct food across the WHOLE run is known, so this can't
  // be folded into one single pass the way it could when scores were
  // fetched generically, one food at a time.
  const windowFoodsByCheckin: { foodId: number; source: string }[][] = [];
  const distinctFoodPairs = new Map<string, { foodId: number; source: string }>();

  for (const checkin of symptomCheckins) {
    const windowEnd = new Date(checkin.loggedAt);
    if (Number.isNaN(windowEnd.getTime())) {
      windowFoodsByCheckin.push([]);
      continue;
    }
    const windowStart = new Date(windowEnd.getTime() - windowHours * 60 * 60 * 1000);
    const items = await getMealItemsInWindow(toLocalDateTimeString(windowStart), toLocalDateTimeString(windowEnd));

    // Deduped WITHIN this one checkin's own window -- eating the same food
    // three times before one flare is one real occurrence of "this food
    // showed up before a flare," not three. Tallying the raw meal-log count
    // instead would double-count a single day's own repeated eating as if
    // it were repeated real-world evidence.
    const foodKeysSeen = new Set<string>();
    const categoryKeysSeen = new Set<string>();
    const windowFoods: { foodId: number; source: string }[] = [];

    for (const item of items) {
      if (!item.foodId) continue;
      const [foodIdStr, source] = item.foodId.split('|');
      const foodId = Number(foodIdStr);
      if (!Number.isFinite(foodId) || !source) continue;
      const foodKey = `${foodId}|${source}`;
      distinctFoodPairs.set(foodKey, { foodId, source });

      if (!foodKeysSeen.has(foodKey)) {
        foodKeysSeen.add(foodKey);
        windowFoods.push({ foodId, source });
        const existing = foodCounts.get(foodKey);
        if (existing) existing.count += 1;
        else foodCounts.set(foodKey, { count: 1, foodName: item.foodName, category: item.category, foodId, source });
      }

      if (item.category && !categoryKeysSeen.has(item.category)) {
        categoryKeysSeen.add(item.category);
        const existing = categoryCounts.get(item.category);
        if (existing) existing.count += 1;
        else categoryCounts.set(item.category, { count: 1, category: item.category });
      }
    }
    windowFoodsByCheckin.push(windowFoods);
  }

  const dimensionCounts = new Map<
    string,
    { count: number; conditionCode: string; conditionName: string; dimension: string; subCriterion: string; tier: string }
  >();

  if (trackedConditions.length > 0) {
    const conditionScoresByFood = await getConditionScoresForFoodsBulk(
      Array.from(distinctFoodPairs.values()),
      trackedConditions.map((condition) => condition.code),
    );

    for (const windowFoods of windowFoodsByCheckin) {
      // Same "one real occurrence per checkin window" dedup as the
      // food/category counts above, scoped per (condition, sub-criterion,
      // tier) so eating three flagged foods before one flare still counts
      // as one real occurrence of that specific concern, not three.
      const seenKeys = new Set<string>();
      for (const food of windowFoods) {
        const byCondition = conditionScoresByFood.get(`${food.foodId}|${food.source}`);
        if (!byCondition) continue;
        for (const condition of trackedConditions) {
          for (const score of byCondition.get(condition.code) ?? []) {
            if (NEAR_UNIVERSAL_SUB_CRITERIA.has(score.subCriterion)) continue;
            if (!isFlaggedTier(score.tier)) continue;
            const key = `${condition.code}::${score.subCriterion}::${score.tier}`;
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);
            const existing = dimensionCounts.get(key);
            if (existing) existing.count += 1;
            else {
              dimensionCounts.set(key, {
                count: 1,
                conditionCode: condition.code,
                conditionName: condition.name,
                dimension: score.dimension,
                subCriterion: score.subCriterion,
                tier: score.tier,
              });
            }
          }
        }
      }
    }
  }

  const foodCandidates: FoodPatternCandidate[] = [...foodCounts.values()]
    .filter((entry) => entry.count >= MIN_OCCURRENCES)
    .map((entry) => ({
      kind: 'food' as const,
      foodId: entry.foodId,
      source: entry.source,
      foodName: entry.foodName,
      category: entry.category,
      occurrenceCount: entry.count,
    }))
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount || a.foodName.localeCompare(b.foodName));

  const dimensionCandidates: DimensionPatternCandidate[] = [...dimensionCounts.values()]
    .filter((entry) => entry.count >= MIN_OCCURRENCES)
    .map((entry) => ({
      kind: 'dimension' as const,
      conditionCode: entry.conditionCode,
      conditionName: entry.conditionName,
      dimension: entry.dimension,
      subCriterion: entry.subCriterion,
      tier: entry.tier,
      occurrenceCount: entry.count,
    }))
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount || a.subCriterion.localeCompare(b.subCriterion));

  const categoryCandidates: CategoryPatternCandidate[] = [...categoryCounts.values()]
    .filter((entry) => entry.count >= MIN_OCCURRENCES)
    .map((entry) => ({ kind: 'category' as const, category: entry.category, occurrenceCount: entry.count }))
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount || a.category.localeCompare(b.category));

  return { totalSymptomInstances: symptomCheckins.length, foodCandidates, dimensionCandidates, categoryCandidates };
}
