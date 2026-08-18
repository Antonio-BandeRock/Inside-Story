import {
  getUserConditions,
  listAllActiveTreatments,
  listAllConditions,
  listCheckins,
  listLabResults,
  listPersonalRules,
  type LabResultRecord,
} from './db';
import { getCheckinTagDefinition } from './checkinTags';
import { getNutrientTrendSeries, getSixDimensionsFlagTrendSeries } from './trendAnalysis';

// Same real, small nutrient set app/(tabs)/index.tsx (Home) and
// app/(tabs)/trends.tsx both already use, duplicated here rather than
// imported -- a lib/ file importing from an app/ screen would be a real,
// backwards architectural direction nowhere else in this codebase does,
// even though it happens to type-check fine. Matches the same "duplicate
// a small, real constant rather than reach the wrong direction for it"
// precedent already established for todayDateString (see
// trendAnalysis.ts's own identical comment).
const CORE_NUTRIENT_CODES = ['iodine', 'selenium', 'zinc', 'iron', 'vitamin_d', 'calcium', 'magnesium', 'copper', 'vitamin_b12'];

// Real, working v1, per the plan's own scope note: a plain, formatted
// document a person can read on-device and hand to a doctor via the OS's
// own share sheet -- not yet a laid-out PDF (that needs new native
// dependencies, expo-print + expo-sharing, and a real rebuild -- a
// deliberate, separate follow-up, not this pass). Deliberately reuses
// already-existing, already-proven functions rather than new aggregation
// logic wherever one exists (getNutrientTrendSeries/
// getSixDimensionsFlagTrendSeries -- the same per-day loops Trends' own
// Nutrients/6 Dimensions lenses already run, Phase 1/2 of this same pass),
// matching this app's own standing "computation stays in lib/, don't
// re-derive it twice" discipline.

function formatDateRange(days: number): string {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${fmt(start)} to ${fmt(end)}`;
}

function severityLabel(severity: number | null): string {
  if (severity == null) return 'unspecified';
  const labels = ['', 'mild', 'moderate', 'significant', 'severe'];
  return labels[severity] ?? String(severity);
}

export async function generateReport(days: number): Promise<string> {
  const lines: string[] = [];
  lines.push('INSIDE STORY: HEALTH SUMMARY');
  lines.push(`Range: ${formatDateRange(days)} (last ${days} days)`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');
  lines.push('This is a plain summary of what was logged in the app during this window.');
  lines.push('It is not a diagnosis; it reflects self-reported entries only.');
  lines.push('');

  // Tracked conditions
  const [userConditionCodes, allConditions] = await Promise.all([getUserConditions(), listAllConditions()]);
  const conditionNames = userConditionCodes
    .map((code) => allConditions.find((c) => c.code === code)?.name ?? code)
    .sort((a, b) => a.localeCompare(b));
  lines.push('TRACKED CONDITIONS');
  lines.push(conditionNames.length > 0 ? conditionNames.map((name) => `- ${name}`).join('\n') : 'None selected in Profile.');
  lines.push('');

  // Nutrient highlights -- reuses the exact real per-nutrient series Trends'
  // own Nutrients lens already computes, just averaged across the range
  // rather than plotted point by point.
  lines.push('NUTRIENT INTAKE (average % of daily target, days with a logged meal)');
  const nutrientLines: string[] = [];
  for (const code of CORE_NUTRIENT_CODES) {
    const series = await getNutrientTrendSeries(code, days);
    if (series.points.length === 0 || !series.displayName) continue;
    const avg = series.points.reduce((sum, point) => sum + point.value, 0) / series.points.length;
    nutrientLines.push(`- ${series.displayName}: ${Math.round(avg)}% avg (${series.points.length} day${series.points.length === 1 ? '' : 's'} logged)`);
  }
  lines.push(nutrientLines.length > 0 ? nutrientLines.join('\n') : 'No meals logged in this range yet.');
  lines.push('');

  // 6 Dimensions flag summary -- reuses the exact same real daily series
  // the 6 Dimensions trend lens already computes.
  const sixDsSeries = await getSixDimensionsFlagTrendSeries(days);
  const totalFlaggedItemDays = sixDsSeries.reduce((sum, point) => sum + point.value, 0);
  lines.push('6 DIMENSIONS FLAGS');
  lines.push(
    sixDsSeries.length > 0
      ? `${totalFlaggedItemDays} flagged item${totalFlaggedItemDays === 1 ? '' : 's'} logged across ${sixDsSeries.length} day${sixDsSeries.length === 1 ? '' : 's'} with meals.`
      : 'No meals logged in this range yet.',
  );
  lines.push('');

  // Symptom/flare log -- real, chronological, everything actually logged
  // in the window, not just a count the way the 6-DFF section above is.
  const rangeStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const [flares, reactions] = await Promise.all([
    listCheckins({ checkinType: 'flare', limit: 200 }),
    listCheckins({ checkinType: 'post_meal', limit: 200 }),
  ]);
  const symptomEntries = [...flares, ...reactions]
    .filter((entry) => entry.loggedAt.slice(0, 10) >= rangeStart)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  lines.push('SYMPTOMS & FLARES');
  if (symptomEntries.length === 0) {
    lines.push('None logged in this range.');
  } else {
    for (const entry of symptomEntries) {
      const tagLabels = entry.tags.map((code) => getCheckinTagDefinition(code)?.label ?? code);
      const kind = entry.checkinType === 'flare' ? 'Flare' : 'Reaction';
      const parts = [`${entry.loggedAt.replace('T', ' ')}: ${kind}, ${severityLabel(entry.severity)}`];
      if (entry.foodName) parts.push(`food: ${entry.foodName}`);
      if (tagLabels.length > 0) parts.push(`tags: ${tagLabels.join(', ')}`);
      if (entry.notes) parts.push(`notes: ${entry.notes}`);
      lines.push(`- ${parts.join(' | ')}`);
    }
  }
  lines.push('');

  // Active meds/supplements/prescriptions -- reuses the exact real
  // registry My Meds & Interactions already reads (listAllActiveTreatments,
  // 2026-08-08), so this section can never drift from what's actually
  // marked active there.
  const treatments = await listAllActiveTreatments();
  lines.push('ACTIVE MEDICATIONS & SUPPLEMENTS');
  if (treatments.length === 0) {
    lines.push('None currently marked active.');
  } else {
    for (const treatment of treatments) {
      const dose = treatment.doseAmount != null ? `${treatment.doseAmount}${treatment.doseUnit ?? ''}` : null;
      const parts = [treatment.name];
      if (dose) parts.push(dose);
      if (treatment.frequency) parts.push(treatment.frequency);
      lines.push(`- ${parts.join(', ')} (${treatment.treatmentType})`);
    }
  }
  lines.push('');

  // The person's own rules -- the personal half of the interaction rules
  // engine, 2026-08-18. Kept in a clearly separate, clearly labeled
  // section, on purpose: this app's own architecture plan requires that
  // a personal hunch or a doctor's own specific instruction never gets
  // confused with the cited research elsewhere in this same report, and
  // that requirement applies here most of all, since a report like this
  // is likely to actually be read by a doctor. Only active rules are
  // included -- a paused one isn't currently something the person is
  // acting on. Each line states plainly whether it came from the person
  // or their own doctor, never presented as verified medical fact.
  const activePersonalRules = (await listPersonalRules(true)).filter((rule) => rule.active);
  lines.push('YOUR OWN NOTES (not from cited research -- self-reported)');
  if (activePersonalRules.length === 0) {
    lines.push('None saved.');
  } else {
    for (const rule of activePersonalRules) {
      const sourceLabel = rule.source === 'doctor' ? 'from your own doctor' : 'your own observation';
      lines.push(`- ${rule.description} (${sourceLabel})`);
    }
  }
  lines.push('');

  // Recent labs -- most recent result per test, matching Insights' own
  // Labs lens precedent, deliberately not scoped to the date range: a
  // lab drawn 4 months ago is still the real, current, relevant value for
  // a report handed to a doctor, unlike daily nutrient/symptom logging.
  const labResults = await listLabResults(undefined, 100);
  const mostRecentByTest = new Map<string, LabResultRecord>();
  for (const result of labResults) {
    if (!mostRecentByTest.has(result.testCode)) mostRecentByTest.set(result.testCode, result);
  }
  const recentLabs = [...mostRecentByTest.values()].sort((a, b) => b.testedAt.localeCompare(a.testedAt));
  lines.push('MOST RECENT LAB RESULTS');
  if (recentLabs.length === 0) {
    lines.push('None logged yet.');
  } else {
    for (const result of recentLabs) {
      const range =
        result.labRangeLow != null && result.labRangeHigh != null
          ? ` (lab range ${result.labRangeLow}-${result.labRangeHigh})`
          : '';
      lines.push(`- ${result.testCode}: ${result.value} ${result.unit}${range}, tested ${result.testedAt}`);
    }
  }

  return lines.join('\n');
}
