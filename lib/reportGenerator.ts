import {
  getLabTests,
  getUserConditions,
  listAllActiveTreatments,
  listAllConditions,
  listBodyMeasurements,
  listCheckins,
  listLabResults,
  listPersonalRules,
  getStoredMeasurementSystem,
  type LabResultRecord,
} from './db';
import { getCheckinTagDefinition } from './checkinTags';
import {
  getNutrientTrendSeriesForCodes,
  getSixDimensionsFlagTrendSeries,
  getSleepTrendPoints,
  getStepTrendPoints,
} from './trendAnalysis';
import { APP_VERSION } from '../constants/version';
import { REFERENCE_DB_VERSION } from './referenceDbVersion';
import { reportVersionLine } from './reportVersion';
import {
  costSections,
  eatingCostSection,
  gardenYieldSections,
  insuranceSection,
  medicalBillsSection,
  REPORT_KIND_BY_KEY,
  sectionsFromReading,
  type ReportKind,
} from './reportKinds';
import type { ReadingView } from './readingBands';
import { loadTrendsMoreView, type TrendsMoreLens } from './trendsMoreDb';
import { loadInsightsMoreView, type InsightsMoreLens } from './insightsMoreDb';
import { getActiveInsurancePlan, listMedicalBills } from './financeHealthDb';
import { describePlanStanding, planStanding } from './financeHealth';
import { getCostSummary } from './costOfEatingDb';
import { getHarvestYieldSummary } from './harvestYieldDb';
import { reportPhotoTextLine } from './reportPhotos';
import { plantingPhotoSection, symptomPhotoSection } from './reportPhotosDb';

// Same real, small nutrient set app/(tabs)/index.tsx (Home) and
// app/(tabs)/trends.tsx both already use, duplicated here rather than
// imported -- a lib/ file importing from an app/ screen would be a real,
// backwards architectural direction nowhere else in this codebase does,
// even though it happens to type-check fine. Matches the same "duplicate
// a small, real constant rather than reach the wrong direction for it"
// precedent already established for todayDateString (see
// trendAnalysis.ts's own identical comment).
const CORE_NUTRIENT_CODES = ['iodine', 'selenium', 'zinc', 'iron', 'vitamin_d', 'calcium', 'magnesium', 'copper', 'vitamin_b12'];

// The report is one document, built once, rendered two ways (2026-09-14).
// buildReport gathers everything into a ReportDocument; renderReportText
// turns it into the plain text the Reports tab shows on screen and the
// share sheet carries as a message, and lib/reportHtml.ts turns the same
// document into the HTML that expo-print lays out as a PDF. Neither
// renderer computes anything, so the two can never disagree about what
// was logged.
//
// Everything here reuses functions that already exist for a screen
// (getNutrientTrendSeriesForCodes and getSixDimensionsFlagTrendSeries are the
// same per-day loops Trends runs; listAllActiveTreatments is what My Meds
// reads; getStepTrendPoints and getSleepTrendPoints are Trends >
// Movement), matching this app's standing "computation stays in lib/,
// don't re-derive it twice" discipline.

export type ReportListSection = {
  kind: 'list';
  heading: string;
  /** Shown under the heading, before the rows. For a section whose
   *  contents need framing before anyone reads them. */
  note?: string;
  rows: string[];
  /** What to say when rows is empty. */
  empty: string;
};

export type ReportTableSection = {
  kind: 'table';
  heading: string;
  note?: string;
  columns: string[];
  rows: string[][];
  empty: string;
};

/** Photos at the report size (1.0.53.7). The PDF shows each one with its
 *  caption; the plain-text view says how many there are, since a text
 *  message cannot carry them. Built in lib/reportPhotosDb.ts. */
export type ReportPhotoSection = {
  kind: 'photos';
  heading: string;
  note?: string;
  rows: { caption: string; dataUri: string }[];
  empty: string;
};

export type ReportSection = ReportListSection | ReportTableSection | ReportPhotoSection;

export type ReportDocument = {
  title: string;
  /** "2026-08-16 to 2026-09-14" */
  rangeLabel: string;
  days: number;
  /** ISO date-time, local. */
  generatedAt: string;
  preface: string[];
  sections: ReportSection[];
  footer: string;
  /** What produced the figures. A score in this app is worked out live
   *  from the bundled reference database, which also holds the cited
   *  interaction rules, so the same weeks reported twice can differ after
   *  a reference update. Without this line nothing on the page would say
   *  why, and a clinician comparing two printouts could not tell a change
   *  in the person from a change in the app. */
  versionLine: string;
};

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rangeStartDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return isoDate(d);
}

function formatDateRange(days: number): string {
  return `${rangeStartDate(days)} to ${isoDate(new Date())}`;
}

function severityLabel(severity: number | null): string {
  if (severity == null) return 'unspecified';
  const labels = ['', 'mild', 'moderate', 'significant', 'severe'];
  return labels[severity] ?? String(severity);
}

function plural(count: number, singular: string, pluralWord = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

// Which report is being built (1.0.52.7). The Overview carries every core
// section; each narrower report names the core sections its reader needs
// in lib/reportKinds.ts, and the ones it leaves out are never gathered, so
// the Trainer report does not wait on a nutrient pass it will not show.
export async function buildReport(days: number, kind: ReportKind = 'overview'): Promise<ReportDocument> {
  const def = REPORT_KIND_BY_KEY[kind];
  const want = new Set(def.core);
  const sections: ReportSection[] = [];
  const rangeStart = rangeStartDate(days);

  // Tracked conditions. The codes are read whenever the flags section is
  // wanted too, since that section is scoped to them.
  const userConditionCodes = want.has('conditions') || want.has('flags') ? await getUserConditions() : [];
  if (want.has('conditions')) {
    const allConditions = await listAllConditions();
    const conditionNames = userConditionCodes
      .map((code) => allConditions.find((c) => c.code === code)?.name ?? code)
      .sort((a, b) => a.localeCompare(b));
    sections.push({
      kind: 'list',
      heading: 'Tracked conditions',
      rows: conditionNames,
      empty: 'None selected in Profile.',
    });
  }

  // Nutrient highlights: the same per-nutrient series Trends' Nutrients
  // lens computes, averaged across the range rather than plotted point by
  // point. All nine come from one pass over the logged ingredients
  // (2026-09-14): nine separate passes took minutes on a phone.
  if (want.has('nutrients')) {
    const nutrientRows: string[][] = [];
    const nutrientSeries = await getNutrientTrendSeriesForCodes(CORE_NUTRIENT_CODES, rangeStart, isoDate(new Date()));
    for (const code of CORE_NUTRIENT_CODES) {
      const series = nutrientSeries.get(code);
      if (!series || series.points.length === 0 || !series.displayName) continue;
      const avg = series.points.reduce((sum, point) => sum + point.value, 0) / series.points.length;
      nutrientRows.push([series.displayName, `${Math.round(avg)}%`, String(series.points.length)]);
    }
    sections.push({
      kind: 'table',
      heading: 'Nutrient intake',
      note: 'Average percent of the daily target, over the days with a logged meal. Days with nothing logged are left out rather than counted as zero.',
      columns: ['Nutrient', 'Average of target', 'Days logged'],
      rows: nutrientRows,
      empty: 'No meals logged in this range yet.',
    });
  }

  // Condition-scoped flag summary -- reuses the exact same real daily
  // series the Trends Condition Scores lens already computes, and the
  // same userConditionCodes already fetched above for the tracked-
  // conditions section, rather than a second fetch. 2026-08-26: this used
  // to count every currently-scored sub-criterion regardless of
  // relevance; now it's scoped to what's actually relevant to the
  // conditions named directly above it, so the two sections agree with
  // each other.
  if (want.has('flags')) {
    const sixDsSeries = await getSixDimensionsFlagTrendSeries(days, userConditionCodes);
    const totalFlaggedItemDays = sixDsSeries.reduce((sum, point) => sum + point.value, 0);
    sections.push({
      kind: 'list',
      heading: 'Condition score flags',
      note: 'Logged foods whose scored properties matter for the conditions above. A flag is a property worth knowing about, not a verdict on the food.',
      rows:
        sixDsSeries.length > 0
          ? [`${plural(totalFlaggedItemDays, 'flagged item')} logged across ${plural(sixDsSeries.length, 'day')} with meals.`]
          : [],
      empty: 'No meals logged in this range yet.',
    });
  }

  // Symptom/flare log -- real, chronological, everything actually logged
  // in the window, not just a count the way the 6-DFF section above is.
  if (want.has('symptoms')) {
    const [flares, reactions] = await Promise.all([
      listCheckins({ checkinType: 'flare', limit: 200 }),
      listCheckins({ checkinType: 'post_meal', limit: 200 }),
    ]);
    const symptomEntries = [...flares, ...reactions]
      .filter((entry) => entry.loggedAt.slice(0, 10) >= rangeStart)
      .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
    sections.push({
      kind: 'table',
      heading: 'Symptoms and flares',
      note: 'Every flare and after-meal reaction logged in the range, in order. Severity is as the person rated it at the time.',
      columns: ['When', 'Kind', 'Severity', 'Food', 'Tags', 'Notes'],
      rows: symptomEntries.map((entry) => [
        entry.loggedAt.slice(0, 16).replace('T', ' '),
        entry.checkinType === 'flare' ? 'Flare' : 'Reaction',
        severityLabel(entry.severity),
        entry.foodName ?? '',
        entry.tags.map((code) => getCheckinTagDefinition(code)?.label ?? code).join(', '),
        entry.notes ?? '',
      ]),
      empty: 'None logged in this range.',
    });
  }

  // Active meds/supplements/prescriptions -- reuses the exact real
  // registry My Meds & Interactions already reads (listAllActiveTreatments,
  // 2026-08-08), so this section can never drift from what's actually
  // marked active there.
  if (want.has('meds')) {
    const treatments = await listAllActiveTreatments();
    sections.push({
      kind: 'table',
      heading: 'Active medications and supplements',
      note: 'Everything currently marked active in Life > My Meds. Not scoped to the date range.',
      columns: ['Name', 'Dose', 'How often', 'Type'],
      rows: treatments.map((treatment) => [
        treatment.name,
        treatment.doseAmount != null ? `${treatment.doseAmount}${treatment.doseUnit ?? ''}` : '',
        treatment.frequency ?? '',
        treatment.treatmentType,
      ]),
      empty: 'None currently marked active.',
    });
  }

  // Movement, 2026-09-14: what the phone's health store brought in by way
  // of Life > Movement, summarised the way Trends > Movement captions it.
  // Steps and sleep are the two signals a doctor or trainer asks about
  // first; the rest of the store stays in the app. Weight and blood
  // pressure follow in a separate section since they are readings, not a
  // range average.
  if (want.has('movement')) {
    const [stepPoints, sleepPoints] = await Promise.all([getStepTrendPoints(days), getSleepTrendPoints(days)]);
    const movementRows: string[] = [];
    if (stepPoints.length > 0) {
      const average = stepPoints.reduce((sum, point) => sum + point.value, 0) / stepPoints.length;
      movementRows.push(`Steps: ${Math.round(average).toLocaleString()} a day, averaged over ${plural(stepPoints.length, 'recorded day')}.`);
    }
    if (sleepPoints.length > 0) {
      const average = sleepPoints.reduce((sum, point) => sum + point.value, 0) / sleepPoints.length;
      movementRows.push(`Sleep: ${average.toFixed(1)} hours a night, averaged over ${plural(sleepPoints.length, 'recorded night')}.`);
    }
    sections.push({
      kind: 'list',
      heading: 'Movement and sleep',
      note: "From the phone's health store, where connected. Days the phone did not record are left out rather than counted as zero.",
      rows: movementRows,
      empty: "Nothing from the phone's health store in this range. Life > Movement connects it.",
    });
  }

  // Weight and blood pressure: the most recent reading of each, whether
  // typed in or brought in from the phone, plus the earliest in the range
  // for weight so a change over the window is visible without a chart.
  if (want.has('body')) {
    const measurements = await listBodyMeasurements(undefined, 400);
    const latestOf = (type: string) => measurements.find((row) => row.measurementType === type) ?? null;
    const bodyRows: string[][] = [];
    const weight = latestOf('weight');
    if (weight) {
      const inRange = measurements
        .filter((row) => row.measurementType === 'weight' && row.loggedAt.slice(0, 10) >= rangeStart)
        .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
      const earliest = inRange[0];
      const change =
        earliest && earliest.id !== weight.id && earliest.unit === weight.unit
          ? `${weight.value - earliest.value >= 0 ? '+' : ''}${(weight.value - earliest.value).toFixed(1)} ${weight.unit} since ${earliest.loggedAt.slice(0, 10)}`
          : '';
      bodyRows.push(['Weight', `${weight.value} ${weight.unit}`, weight.loggedAt.slice(0, 10), change]);
    }
    const systolic = latestOf('blood_pressure_systolic');
    const diastolic = latestOf('blood_pressure_diastolic');
    if (systolic && diastolic) {
      bodyRows.push([
        'Blood pressure',
        `${Math.round(systolic.value)}/${Math.round(diastolic.value)} ${systolic.unit}`,
        systolic.loggedAt.slice(0, 10),
        '',
      ]);
    }
    sections.push({
      kind: 'table',
      heading: 'Weight and blood pressure',
      note: 'The most recent reading of each, typed in or brought in from the phone. Not scoped to the date range.',
      columns: ['Measure', 'Reading', 'Date', 'Change in range'],
      rows: bodyRows,
      empty: 'None logged yet.',
    });
  }

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
  if (want.has('rules')) {
    const activePersonalRules = (await listPersonalRules(true)).filter((rule) => rule.active);
    sections.push({
      kind: 'list',
      heading: 'Personal notes and rules',
      note: 'Self-reported. These are observations the person has made or instructions a clinician has given them, written in their words. None of it is from cited research, and none of it has been verified by this app.',
      rows: activePersonalRules.map(
        (rule) => `${rule.description} (${rule.source === 'doctor' ? 'an instruction from a clinician' : "the person's observation"})`,
      ),
      empty: 'None saved.',
    });
  }

  // Recent labs -- most recent result per test, matching Insights' own
  // Labs lens precedent, deliberately not scoped to the date range: a
  // lab drawn 4 months ago is still the real, current, relevant value for
  // a report handed to a doctor, unlike daily nutrient/symptom logging.
  if (want.has('labs')) {
    const [labResults, labTests] = await Promise.all([listLabResults(undefined, 100), getLabTests()]);
    const testNames = new Map(labTests.map((test) => [test.code, test.displayName]));
    const mostRecentByTest = new Map<string, LabResultRecord>();
    for (const result of labResults) {
      if (!mostRecentByTest.has(result.testCode)) mostRecentByTest.set(result.testCode, result);
    }
    const recentLabs = [...mostRecentByTest.values()].sort((a, b) => b.testedAt.localeCompare(a.testedAt));
    sections.push({
      kind: 'table',
      heading: 'Most recent lab results',
      note: "The latest result for each test, whenever it was drawn. The range shown is the one the person's lab reported, not a general reference range.",
      columns: ['Test', 'Result', 'Lab range', 'Tested', 'Lab'],
      rows: recentLabs.map((result) => [
        testNames.get(result.testCode) ?? result.testCode,
        `${result.value} ${result.unit}`,
        result.labRangeLow != null && result.labRangeHigh != null ? `${result.labRangeLow} to ${result.labRangeHigh}` : '',
        result.testedAt.slice(0, 10),
        result.labName ?? '',
      ]),
      empty: 'None logged yet.',
    });
  }

  sections.push(...(await kindSections(kind, days)));

  return {
    title: def.title,
    rangeLabel: formatDateRange(days),
    days,
    generatedAt: new Date().toISOString(),
    preface: def.preface,
    sections,
    footer: `Generated on the phone by Inside Story ${APP_VERSION}. Nothing in this report left the phone until the person chose to share it.`,
    versionLine: reportVersionLine(APP_VERSION, REFERENCE_DB_VERSION),
  };
}

// The sections each narrower report adds after its core ones. A Trends or
// Insights lens is read through its loader and turned into sections by
// sectionsFromReading, so the report says what the lens says. Each lens is
// read separately and a failure reads as a section saying so, since one
// unreadable lens should not cost somebody the whole report.
async function readingSections(heading: string, read: () => Promise<ReadingView>): Promise<ReportSection[]> {
  try {
    return sectionsFromReading(heading, await read());
  } catch {
    return [{ kind: 'list', heading, rows: [], empty: 'Could not be read for this report.' }];
  }
}

function trends(lens: TrendsMoreLens, heading: string, days: number): Promise<ReportSection[]> {
  return readingSections(heading, () => loadTrendsMoreView(lens, days));
}

function insights(lens: InsightsMoreLens, heading: string): Promise<ReportSection[]> {
  return readingSections(heading, () => loadInsightsMoreView(lens));
}

async function kindSections(kind: ReportKind, days: number): Promise<ReportSection[]> {
  const start = rangeStartDate(days);
  const end = isoDate(new Date());
  const parts: Promise<ReportSection[]>[] = [];
  switch (kind) {
    case 'overview':
      break;
    case 'r-doctor':
      parts.push(
        insights('i-appointment', 'Appointments'),
        trends('bloodPressure', 'Blood pressure', days),
        trends('doses', 'Doses', days),
        symptomPhotoSection(start, end).then((section) => [section]),
      );
      break;
    case 'r-nutrition':
      parts.push(trends('hydration', 'Hydration', days), trends('planned', 'Planned and eaten', days), trends('reactions', 'After-meal reactions', days));
      break;
    case 'r-trainer':
      parts.push(
        trends('bloodPressure', 'Blood pressure', days),
        trends('hydration', 'Hydration', days),
        trends('nights', 'Nights', days),
        trends('work', 'Work', days),
      );
      break;
    case 'r-month':
      parts.push(
        trends('planned', 'Planned and eaten', days),
        trends('doses', 'Doses', days),
        trends('care', 'Appointments and care', days),
        trends('work', 'Work', days),
        trends('reactions', 'After-meal reactions', days),
        trends('nights', 'Nights', days),
        trends('ferments', 'Ferments', days),
        getCostSummary(start, end)
          .then((cost) => [eatingCostSection(cost)])
          .catch(() => [eatingCostSection(null)]),
      );
      break;
    case 'r-care':
      parts.push(insights('i-today', 'Today'), trends('doses', 'Doses', days), trends('care', 'Appointments and care', days));
      break;
    case 'r-medical-costs':
      parts.push(
        (async () => {
          const [bills, plan] = await Promise.all([listMedicalBills(1000), getActiveInsurancePlan()]);
          return [medicalBillsSection(bills, start, end), insuranceSection(plan ? describePlanStanding(planStanding(plan, bills)) : null)];
        })(),
        getCostSummary(start, end)
          .then(costSections)
          .catch(() => costSections(null)),
      );
      break;
    case 'r-garden':
      parts.push(
        (async () => {
          const system = (await getStoredMeasurementSystem()) === 'imperial' ? 'imperial' : 'metric';
          return gardenYieldSections(await getHarvestYieldSummary(start, end, system));
        })(),
        insights('i-garden', 'On hand now'),
        plantingPhotoSection(start, end).then((section) => [section]),
      );
      break;
  }
  return (await Promise.all(parts)).flat();
}

// The plain-text view: what the Reports tab shows on screen and what the
// share sheet carries as a message. Tables become one line per row, the
// first cell leading and the rest labelled by their column, so a row
// still reads as a sentence in a text message.
export function renderReportText(doc: ReportDocument): string {
  const lines: string[] = [];
  lines.push(doc.title.toUpperCase());
  lines.push(`Range: ${doc.rangeLabel} (last ${doc.days} days)`);
  lines.push(`Generated: ${new Date(doc.generatedAt).toLocaleString()}`);
  lines.push('');
  for (const paragraph of doc.preface) lines.push(paragraph);
  lines.push('');

  for (const section of doc.sections) {
    lines.push(section.heading.toUpperCase());
    if (section.note) lines.push(section.note);
    if (section.rows.length === 0) {
      lines.push(section.empty);
    } else if (section.kind === 'photos') {
      lines.push(reportPhotoTextLine(section.rows.length));
    } else if (section.kind === 'list') {
      for (const row of section.rows) lines.push(`- ${row}`);
    } else {
      for (const cells of section.rows) {
        const parts: string[] = [];
        cells.forEach((cell, index) => {
          if (!cell) return;
          if (index === 0) parts.push(cell);
          else if (index === 1) parts.push(cell);
          else parts.push(`${section.columns[index].toLowerCase()}: ${cell}`);
        });
        const [first, ...rest] = parts;
        lines.push(rest.length > 0 ? `- ${first}: ${rest.join(', ')}` : `- ${first}`);
      }
    }
    lines.push('');
  }

  lines.push(doc.footer);
  lines.push(doc.versionLine);
  return lines.join('\n');
}

export async function generateReport(days: number, kind: ReportKind = 'overview'): Promise<string> {
  return renderReportText(await buildReport(days, kind));
}
