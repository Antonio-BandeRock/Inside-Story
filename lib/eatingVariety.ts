// What You Eat, 2026-09-23. Phase 2 of the cross-app push, and the lens
// closest to what this app is centrally for: helping somebody relearn how
// and what to eat. Everything here is counted from meals already logged,
// so nothing extra has to be recorded for any of it to work.
//
// Pure on purpose, with no imports at all, so scripts/test_eating_variety.js
// can check every sentence and every count without a phone or a database.
// lib/eatingVarietyDb.ts does the reading and hands the records in.
//
// The rule holding the whole file up: A WEEK WITH NOTHING LOGGED IS A GAP,
// NEVER A ZERO. A week somebody did not open the app is not a week they ate
// nothing, and a chart drawing it as zero teaches exactly the wrong lesson
// about their eating. Every weekly figure below is `number | null`, and null
// means nothing to say rather than none. This matches what every function in
// lib/trendAnalysis.ts already does with a day.

// Whether a logged item came out of a package or was put together at home.
// Three values rather than two, because most of what the app knows about a
// meal is a reference-database category, and plenty of entries resolve to
// nothing at all. Saying so is better than sorting free text into a guess.
export type PackagedKind = 'bought' | 'home' | 'unknown';

// One logged food entry, flattened. `foodKey` identifies the food for
// counting: '<foodId>|<source>' where the item resolved to the reference
// database, and a lowercased name where it did not, so free text still
// counts as something eaten rather than disappearing from the variety
// count entirely.
export type VarietyFoodRecord = {
  date: string; // 'YYYY-MM-DD', the local day the meal was eaten
  foodKey: string;
  foodName: string;
  category: string | null;
  cookingMethod: string | null;
  packaged: PackagedKind;
  // Microbiome Effects scored 'Supportive' in the reference database.
  // See lib/eatingVarietyDb.ts for where that comes from and why it is
  // used in place of a keyword list somebody made up.
  gutSupportive: boolean;
  fermented: boolean;
};

export type VarietyInputs = {
  records: VarietyFoodRecord[];
  // Every local date that had at least one meal logged, whether or not any
  // of its items resolved. This is what separates a gap from a quiet week.
  loggedDates: string[];
  startDate: string;
  endDate: string;
};

export type SafeFoodInput = { foodName: string; verdict: string; addedAt: string | null };
export type FoodTrialInput = { foodName: string; status: string; startedAt: string };

// ---------------------------------------------------------------------------
// Plain calendar arithmetic on 'YYYY-MM-DD' strings. The (year, month,
// day + n) constructor form rolls over month and year boundaries correctly
// and avoids the DST surprise a repeated setDate mutation can introduce.
// ---------------------------------------------------------------------------

export function addDays(dateStr: string, offset: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(y, m - 1, d + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

export function daysBetween(earlier: string, later: string): number {
  const [ay, am, ad] = earlier.split('-').map(Number);
  const [by, bm, bd] = later.split('-').map(Number);
  const a = new Date(ay, am - 1, ad).getTime();
  const b = new Date(by, bm - 1, bd).getTime();
  return Math.round((b - a) / 86400000);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function shortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${MONTHS[Number(m) - 1] ?? m} ${Number(d)}`;
}

// ---------------------------------------------------------------------------
// Weeks
// ---------------------------------------------------------------------------

export type VarietyWeek = {
  weekStart: string;
  weekEnd: string;
  // The oldest block, where the range did not divide evenly into sevens.
  // Counts drawn from it are over fewer days, so it is marked rather than
  // quietly compared against the full weeks beside it.
  partial: boolean;
  daysLogged: number;
  hasLogging: boolean;
};

// Anchored at endDate and walked backwards in blocks of seven, so the block
// somebody thinks of as "this week" is a clean one and the ragged remainder
// falls at the far end where it belongs. Returned oldest first, the order a
// chart reads in.
export function buildWeeks(startDate: string, endDate: string, loggedDates: string[]): VarietyWeek[] {
  if (endDate < startDate) return [];
  const logged = new Set(loggedDates);
  const weeks: VarietyWeek[] = [];
  let blockEnd = endDate;
  while (blockEnd >= startDate) {
    let blockStart = addDays(blockEnd, -6);
    let partial = false;
    if (blockStart < startDate) {
      blockStart = startDate;
      partial = true;
    }
    let daysLogged = 0;
    for (let cursor = blockStart; cursor <= blockEnd; cursor = addDays(cursor, 1)) {
      if (logged.has(cursor)) daysLogged += 1;
    }
    weeks.push({ weekStart: blockStart, weekEnd: blockEnd, partial, daysLogged, hasLogging: daysLogged > 0 });
    blockEnd = addDays(blockStart, -1);
  }
  weeks.reverse();
  return weeks;
}

export function describeWeek(week: VarietyWeek): string {
  return `${shortDate(week.weekStart)} to ${shortDate(week.weekEnd)}`;
}

function recordsInWeek(records: VarietyFoodRecord[], week: VarietyWeek): VarietyFoodRecord[] {
  return records.filter((record) => record.date >= week.weekStart && record.date <= week.weekEnd);
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

function roundShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

// ---------------------------------------------------------------------------
// Band 1: how many different foods, week by week
// ---------------------------------------------------------------------------

export type WeekCount = {
  weekStart: string;
  weekEnd: string;
  label: string;
  partial: boolean;
  hasLogging: boolean;
  value: number | null;
};

export type DistinctFoodsResult = {
  weeks: WeekCount[];
  latest: number | null;
  // Averaged over the complete, logged weeks before the latest one. A
  // partial week is left out of it, since fewer days will always show fewer
  // foods and comparing the two would invent a decline that is not there.
  earlierAverage: number | null;
  earlierWeeksCounted: number;
  distinctAcrossRange: number;
  weeksWithoutLogging: number;
  headline: string;
  gapNote: string | null;
};

export function summarizeDistinctFoods(inputs: VarietyInputs, weeks: VarietyWeek[]): DistinctFoodsResult {
  const weekCounts: WeekCount[] = weeks.map((week) => {
    const keys = new Set(recordsInWeek(inputs.records, week).map((record) => record.foodKey));
    return {
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      label: describeWeek(week),
      partial: week.partial,
      hasLogging: week.hasLogging,
      value: week.hasLogging ? keys.size : null,
    };
  });

  const distinctAcrossRange = new Set(inputs.records.map((record) => record.foodKey)).size;
  const weeksWithoutLogging = weekCounts.filter((week) => !week.hasLogging).length;

  const latestWeek = weekCounts.length > 0 ? weekCounts[weekCounts.length - 1] : null;
  const latest = latestWeek?.value ?? null;

  const earlier = weekCounts
    .slice(0, Math.max(weekCounts.length - 1, 0))
    .filter((week) => week.hasLogging && !week.partial && week.value != null);
  const earlierAverage =
    earlier.length > 0 ? Math.round(earlier.reduce((sum, week) => sum + (week.value ?? 0), 0) / earlier.length) : null;

  let headline: string;
  if (latest == null) {
    headline =
      distinctAcrossRange > 0
        ? `Nothing logged in the most recent week. Across the whole range you ate ${distinctAcrossRange} different ${plural(distinctAcrossRange, 'food', 'foods')}.`
        : 'Nothing logged in this range yet, so there is nothing to count.';
  } else if (earlierAverage == null) {
    headline = `${latest} different ${plural(latest, 'food', 'foods')} in the most recent week. There are not enough earlier full weeks yet to compare it against.`;
  } else {
    const earlierPhrase = earlier.length === 1 ? 'the week before it' : `the ${earlier.length} weeks before it`;
    const countPhrase = `${latest} different ${plural(latest, 'food', 'foods')} in the most recent week`;
    if (latest > earlierAverage) {
      headline = `${countPhrase}, against an average of ${earlierAverage} over ${earlierPhrase}.`;
    } else if (latest < earlierAverage) {
      headline = `${countPhrase}. ${earlierPhrase.charAt(0).toUpperCase()}${earlierPhrase.slice(1)} averaged ${earlierAverage}.`;
    } else {
      headline = `${countPhrase}, the same as the average over ${earlierPhrase}.`;
    }
  }

  const gapNote =
    weeksWithoutLogging > 0
      ? `${weeksWithoutLogging} ${plural(weeksWithoutLogging, 'week has', 'weeks have')} nothing logged and ${plural(weeksWithoutLogging, 'is', 'are')} left off the chart rather than drawn as zero.`
      : null;

  return {
    weeks: weekCounts,
    latest,
    earlierAverage,
    earlierWeeksCounted: earlier.length,
    distinctAcrossRange,
    weeksWithoutLogging,
    headline,
    gapNote,
  };
}

// Things already marked safe that have not come up lately. Deliberately
// drawn from the safe list rather than from the reference database: a
// suggestion out of 22,000 foods is noise, and one out of what somebody has
// already told the app agrees with them is worth acting on. Most recently
// added first, since that is the closest thing to what they are interested
// in right now.
export function suggestNearThings(safeFoods: SafeFoodInput[], records: VarietyFoodRecord[], limit = 3): string[] {
  const eaten = new Set(records.map((record) => record.foodName.trim().toLowerCase()));
  return safeFoods
    .filter((food) => food.verdict === 'safe')
    .filter((food) => !eaten.has(food.foodName.trim().toLowerCase()))
    .slice()
    .sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''))
    .slice(0, limit)
    .map((food) => food.foodName);
}

export function describeNearThings(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return `${names[0]} is on your safe list and has not come up in this range.`;
  const last = names[names.length - 1];
  const rest = names.slice(0, -1).join(', ');
  return `${rest} and ${last} are on your safe list and have not come up in this range.`;
}

// ---------------------------------------------------------------------------
// Band 2: what keeps coming back, and how long a gap sits between repeats
// ---------------------------------------------------------------------------

export type RepeatSummary = {
  foodKey: string;
  foodName: string;
  timesLogged: number;
  daysOnWhichLogged: number;
  // Counted to the end of the charted range. Every range this lens offers
  // ends today, so this reads as how long ago in the sentence built below.
  daysSinceLast: number | null;
  // The mean gap between the days this food was logged on. Null where it
  // was logged on a single day, since one appearance has no gap.
  averageGapDays: number | null;
};

export type RotationResult = {
  mostRepeated: RepeatSummary[];
  totalEntries: number;
  distinctFoods: number;
  topFiveShare: number | null;
  headline: string;
  concentrationNote: string | null;
};

export function summarizeRotation(inputs: VarietyInputs, limit = 8): RotationResult {
  const byFood = new Map<string, { foodName: string; entries: number; dates: Set<string> }>();
  for (const record of inputs.records) {
    const existing = byFood.get(record.foodKey);
    if (existing) {
      existing.entries += 1;
      existing.dates.add(record.date);
    } else {
      byFood.set(record.foodKey, { foodName: record.foodName, entries: 1, dates: new Set([record.date]) });
    }
  }

  const summaries: RepeatSummary[] = [];
  byFood.forEach((value, foodKey) => {
    const dates = Array.from(value.dates).sort();
    let averageGapDays: number | null = null;
    if (dates.length > 1) {
      let total = 0;
      for (let i = 1; i < dates.length; i += 1) total += daysBetween(dates[i - 1], dates[i]);
      averageGapDays = Math.round((total / (dates.length - 1)) * 10) / 10;
    }
    summaries.push({
      foodKey,
      foodName: value.foodName,
      timesLogged: value.entries,
      daysOnWhichLogged: dates.length,
      daysSinceLast: daysBetween(dates[dates.length - 1], inputs.endDate),
      averageGapDays,
    });
  });

  summaries.sort((a, b) => b.timesLogged - a.timesLogged || a.foodName.localeCompare(b.foodName));

  const totalEntries = inputs.records.length;
  const distinctFoods = summaries.length;
  const topFive = summaries.slice(0, 5).reduce((sum, food) => sum + food.timesLogged, 0);
  const topFiveShare = totalEntries > 0 && distinctFoods >= 5 ? roundShare(topFive, totalEntries) : null;

  const headline =
    totalEntries === 0
      ? 'Nothing logged in this range yet, so there is nothing to count.'
      : `${totalEntries} food ${plural(totalEntries, 'entry', 'entries')} across ${distinctFoods} different ${plural(distinctFoods, 'food', 'foods')}.`;

  const concentrationNote =
    topFiveShare == null
      ? null
      : `The five that come up most are ${topFiveShare}% of everything you logged.`;

  return { mostRepeated: summaries.slice(0, limit), totalEntries, distinctFoods, topFiveShare, headline, concentrationNote };
}

export function describeRepeat(summary: RepeatSummary): string {
  const parts: string[] = [`${summary.timesLogged} ${plural(summary.timesLogged, 'time', 'times')}`];
  if (summary.averageGapDays != null) {
    parts.push(`about every ${summary.averageGapDays} ${plural(summary.averageGapDays, 'day', 'days')}`);
  }
  if (summary.daysSinceLast != null) {
    parts.push(
      summary.daysSinceLast === 0
        ? 'last logged today'
        : `last logged ${summary.daysSinceLast} ${plural(summary.daysSinceLast, 'day', 'days')} ago`,
    );
  }
  return `${parts.join(', ')}.`;
}

// ---------------------------------------------------------------------------
// Band 3: foods that feed the gut
// ---------------------------------------------------------------------------

export type GutFoodWeek = WeekCount & { fermentedEntries: number | null };

export type GutFoodResult = {
  weeks: GutFoodWeek[];
  distinctAcrossRange: number;
  fermentedEntriesAcrossRange: number;
  names: string[];
  latest: number | null;
  headline: string;
};

export function summarizeGutFoods(inputs: VarietyInputs, weeks: VarietyWeek[], nameLimit = 8): GutFoodResult {
  const weekRows: GutFoodWeek[] = weeks.map((week) => {
    const inWeek = recordsInWeek(inputs.records, week);
    const keys = new Set(inWeek.filter((record) => record.gutSupportive || record.fermented).map((record) => record.foodKey));
    return {
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      label: describeWeek(week),
      partial: week.partial,
      hasLogging: week.hasLogging,
      value: week.hasLogging ? keys.size : null,
      fermentedEntries: week.hasLogging ? inWeek.filter((record) => record.fermented).length : null,
    };
  });

  const matching = inputs.records.filter((record) => record.gutSupportive || record.fermented);
  const names: string[] = [];
  const seen = new Set<string>();
  for (const record of matching) {
    if (seen.has(record.foodKey)) continue;
    seen.add(record.foodKey);
    names.push(record.foodName);
  }

  const latest = weekRows.length > 0 ? weekRows[weekRows.length - 1].value : null;
  const distinctAcrossRange = seen.size;
  const fermentedEntriesAcrossRange = inputs.records.filter((record) => record.fermented).length;

  let headline: string;
  if (inputs.records.length === 0) {
    headline = 'Nothing logged in this range yet, so there is nothing to count.';
  } else if (distinctAcrossRange === 0) {
    headline = 'None of what you logged in this range is scored as feeding the gut bacteria. The Info button says which foods are.';
  } else if (latest == null) {
    headline = `${distinctAcrossRange} different gut-feeding ${plural(distinctAcrossRange, 'food', 'foods')} across the range. Nothing logged in the most recent week.`;
  } else {
    headline = `${latest} different gut-feeding ${plural(latest, 'food', 'foods')} in the most recent week, and ${distinctAcrossRange} across the whole range.`;
  }

  return {
    weeks: weekRows,
    distinctAcrossRange,
    fermentedEntriesAcrossRange,
    names: names.slice(0, nameLimit),
    latest,
    headline,
  };
}

// ---------------------------------------------------------------------------
// Band 4: how it was cooked
// ---------------------------------------------------------------------------

export const METHOD_NOT_SAID = 'Not said';

export function methodLabel(cookingMethod: string | null): string {
  const trimmed = (cookingMethod ?? '').trim();
  if (!trimmed || trimmed.toUpperCase() === 'N/A') return METHOD_NOT_SAID;
  return trimmed;
}

export type MethodShare = { method: string; count: number; share: number };

export type MethodMixResult = {
  shares: MethodShare[];
  totalEntries: number;
  notSaidShare: number;
  headline: string;
  notSaidNote: string | null;
};

export function summarizeMethodMix(inputs: VarietyInputs): MethodMixResult {
  const counts = new Map<string, number>();
  for (const record of inputs.records) {
    const label = methodLabel(record.cookingMethod);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const totalEntries = inputs.records.length;
  const shares: MethodShare[] = [];
  counts.forEach((count, method) => shares.push({ method, count, share: roundShare(count, totalEntries) }));
  shares.sort((a, b) => b.count - a.count || a.method.localeCompare(b.method));

  const notSaidShare = roundShare(counts.get(METHOD_NOT_SAID) ?? 0, totalEntries);
  const named = shares.filter((share) => share.method !== METHOD_NOT_SAID);

  const headline =
    totalEntries === 0
      ? 'Nothing logged in this range yet, so there is nothing to count.'
      : named.length === 0
        ? 'None of what you logged in this range said how it was cooked.'
        : `Most of what said how it was cooked was ${named[0].method.toLowerCase()}, at ${named[0].share}% of everything logged.`;

  const notSaidNote =
    notSaidShare > 0
      ? `${notSaidShare}% of entries did not say how they were cooked, so they are counted here as not said rather than sorted into a guess.`
      : null;

  return { shares, totalEntries, notSaidShare, headline, notSaidNote };
}

// ---------------------------------------------------------------------------
// Band 5: out of a package, or put together at home
// ---------------------------------------------------------------------------

export type PackagedShareResult = {
  bought: number;
  home: number;
  unknown: number;
  totalEntries: number;
  // Worked out over bought plus home only, so entries the app could not
  // place do not quietly drag the figure down.
  boughtShare: number | null;
  headline: string;
  unknownNote: string | null;
};

export function summarizePackagedShare(inputs: VarietyInputs): PackagedShareResult {
  let bought = 0;
  let home = 0;
  let unknown = 0;
  for (const record of inputs.records) {
    if (record.packaged === 'bought') bought += 1;
    else if (record.packaged === 'home') home += 1;
    else unknown += 1;
  }

  const placed = bought + home;
  const boughtShare = placed > 0 ? roundShare(bought, placed) : null;
  const totalEntries = inputs.records.length;

  const headline =
    totalEntries === 0
      ? 'Nothing logged in this range yet, so there is nothing to count.'
      : boughtShare == null
        ? 'None of what you logged in this range could be placed as bought ready or made at home.'
        : `${boughtShare}% of what could be placed came ready to eat out of a package. The other ${100 - boughtShare}% was put together at home.`;

  const unknownNote =
    unknown > 0
      ? `${unknown} ${plural(unknown, 'entry', 'entries')} could not be told either way and ${plural(unknown, 'is', 'are')} left out of that split. A meal typed in as free text has nothing for the app to look up.`
      : null;

  return { bought, home, unknown, totalEntries, boughtShare, headline, unknownNote };
}

// ---------------------------------------------------------------------------
// Band 6: how the safe list has grown
// ---------------------------------------------------------------------------

export type SafeListResult = {
  points: { date: string; value: number }[];
  totalSafe: number;
  totalUnsure: number;
  totalAvoid: number;
  addedInRange: number;
  trialsCleared: number;
  trialsFlagged: number;
  trialsRunning: number;
  headline: string;
  trialNote: string | null;
};

// A running count of foods marked safe, by the day each one was marked.
// Cumulative rather than per-week, since the safe list is a thing that
// grows: a week where nothing was added is still a week with the same list,
// which is why this one chart does not use the gap rule above.
export function summarizeSafeList(
  safeFoods: SafeFoodInput[],
  trials: FoodTrialInput[],
  startDate: string,
  endDate: string,
): SafeListResult {
  const safe = safeFoods.filter((food) => food.verdict === 'safe');
  const dated = safe
    .filter((food) => food.addedAt)
    .map((food) => ({ date: (food.addedAt as string).slice(0, 10) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const points: { date: string; value: number }[] = [];
  let running = 0;
  for (const entry of dated) {
    running += 1;
    if (entry.date < startDate || entry.date > endDate) continue;
    const last = points[points.length - 1];
    if (last && last.date === entry.date) last.value = running;
    else points.push({ date: entry.date, value: running });
  }

  const addedInRange = dated.filter((entry) => entry.date >= startDate && entry.date <= endDate).length;
  const totalSafe = safe.length;
  const totalUnsure = safeFoods.filter((food) => food.verdict === 'unsure').length;
  const totalAvoid = safeFoods.filter((food) => food.verdict === 'avoid').length;

  const inRangeTrials = trials.filter((trial) => trial.startedAt.slice(0, 10) >= startDate);
  const trialsCleared = inRangeTrials.filter((trial) => trial.status === 'cleared').length;
  const trialsFlagged = inRangeTrials.filter((trial) => trial.status === 'flagged').length;
  const trialsRunning = inRangeTrials.filter((trial) => trial.status === 'trialing' || trial.status === 'waiting').length;

  const headline =
    totalSafe === 0
      ? 'Nothing on your safe list yet. Mark a food safe from Food > Safe Foods once you know it agrees with you.'
      : addedInRange === 0
        ? `${totalSafe} ${plural(totalSafe, 'food', 'foods')} marked safe, none of them added in this range.`
        : `${totalSafe} ${plural(totalSafe, 'food', 'foods')} marked safe, ${addedInRange} of them added in this range.`;

  const trialNote =
    inRangeTrials.length === 0
      ? null
      : `Food trials started in this range: ${trialsCleared} cleared, ${trialsFlagged} flagged, ${trialsRunning} still running.`;

  return {
    points,
    totalSafe,
    totalUnsure,
    totalAvoid,
    addedInRange,
    trialsCleared,
    trialsFlagged,
    trialsRunning,
    headline,
    trialNote,
  };
}

// ---------------------------------------------------------------------------
// The whole lens in one call
// ---------------------------------------------------------------------------

export type EatingVarietySummary = {
  weeks: VarietyWeek[];
  distinct: DistinctFoodsResult;
  nearThings: string[];
  nearThingsNote: string | null;
  rotation: RotationResult;
  gutFoods: GutFoodResult;
  methodMix: MethodMixResult;
  packaged: PackagedShareResult;
  safeList: SafeListResult;
  hasAnything: boolean;
};

export function summarizeEatingVariety(
  inputs: VarietyInputs,
  safeFoods: SafeFoodInput[],
  trials: FoodTrialInput[],
): EatingVarietySummary {
  const weeks = buildWeeks(inputs.startDate, inputs.endDate, inputs.loggedDates);
  const distinct = summarizeDistinctFoods(inputs, weeks);
  const nearThings = suggestNearThings(safeFoods, inputs.records);
  return {
    weeks,
    distinct,
    nearThings,
    nearThingsNote: describeNearThings(nearThings),
    rotation: summarizeRotation(inputs),
    gutFoods: summarizeGutFoods(inputs, weeks),
    methodMix: summarizeMethodMix(inputs),
    packaged: summarizePackagedShare(inputs),
    safeList: summarizeSafeList(safeFoods, trials, inputs.startDate, inputs.endDate),
    hasAnything: inputs.records.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

// One line for the Home card. Short on purpose: Home says enough to be worth
// a tap and keeps the reading for the lens itself.
export function describeVarietyThisWeek(distinct: DistinctFoodsResult): string {
  if (distinct.latest == null) {
    return distinct.distinctAcrossRange > 0
      ? 'No meals logged this week yet.'
      : 'Log a few meals to start seeing how varied your eating is.';
  }
  if (distinct.earlierAverage == null) {
    return `${distinct.latest} different ${plural(distinct.latest, 'food', 'foods')} this week.`;
  }
  const difference = distinct.latest - distinct.earlierAverage;
  if (difference === 0) return `${distinct.latest} different foods this week, level with your recent average.`;
  if (difference > 0) {
    return `${distinct.latest} different ${plural(distinct.latest, 'food', 'foods')} this week, ${difference} more than your recent average.`;
  }
  return `${distinct.latest} different ${plural(distinct.latest, 'food', 'foods')} this week, ${Math.abs(difference)} fewer than your recent average.`;
}
