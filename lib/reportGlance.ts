// At a glance: K2 of the competitive build plan (2026-09-29). The first
// section of the Overview, Doctor and Caregiver reports, a few lines a
// clinician can read before turning the page: which symptoms were marked
// on the most days, doses said in words, the latest weight and blood
// pressure, and the latest lab results that sit outside the range their
// lab printed.
//
// Every line is a count or a reading with its date, the same figures the
// sections after it hold in full. Nothing here says what any of it means,
// and nothing is a share or a score: a symptom is counted by the days it
// was marked, with the number of days anything was checked in beside it.
// Pure, so scripts/test_report_glance.js checks it without a phone.
import { shortDate } from './eatingVariety';
import { plural } from './readingBands';
import type { ReportListSection } from './reportGenerator';
import { labLine, type VisitLab } from './sinceLastVisit';
import { describeDoseDays, doseMark, localDay } from './trendsMore';

export type GlanceTag = { loggedAt: string; checkinType: string; tagCode: string | null; label: string | null; negative: boolean; severity: number | null };
export type GlanceDose = { scheduledFor: string; status: string };
export type GlanceReading = { loggedAt: string; value: number; unit: string };

export type GlanceInputs = {
  rangeStart: string;
  today: string;
  /** One row per check-in and tag in the range, and one with a null tag for
   *  a check-in carrying none, so days checked in are counted too. */
  checkins: GlanceTag[];
  doses: GlanceDose[];
  /** Every weight reading, any order. */
  weights: GlanceReading[];
  bloodPressure: { systolic: number; diastolic: number; unit: string; loggedAt: string } | null;
  /** The latest result of each test, whenever it was drawn. */
  labs: VisitLab[];
};

/** How many symptoms the line names before counting the rest. */
export const GLANCE_TOP_SYMPTOMS = 5;

export const GLANCE_NOTE =
  'Counts and the latest readings, from the sections that follow. What any of it means is for the person and their clinician to talk through.';

function inRange(day: string, input: GlanceInputs): boolean {
  return day >= input.rangeStart && day <= input.today;
}

export function glanceSymptomLine(input: GlanceInputs): string {
  const checkedIn = new Set<string>();
  const flareDays = new Set<string>();
  const daysByTag = new Map<string, { label: string; days: Set<string> }>();
  for (const row of input.checkins) {
    const day = localDay(row.loggedAt);
    if (!inRange(day, input)) continue;
    checkedIn.add(day);
    if (row.checkinType === 'flare') flareDays.add(day);
    // A symptom rated none today is stored as a tag with severity 0; it
    // says the symptom was absent, so it is not counted as marked.
    if (!row.tagCode || !row.negative || row.severity === 0) continue;
    const entry = daysByTag.get(row.tagCode) ?? { label: row.label ?? row.tagCode, days: new Set<string>() };
    entry.days.add(day);
    daysByTag.set(row.tagCode, entry);
  }
  if (checkedIn.size === 0) return 'Symptoms: nothing checked in during this range.';
  const ranked = [...daysByTag.values()].sort((a, b) => b.days.size - a.days.size || a.label.localeCompare(b.label));
  const flares = flareDays.size > 0 ? ` Flares logged on ${plural(flareDays.size, 'day')}.` : ' No flares logged.';
  const basis = `of ${plural(checkedIn.size, 'day')} with a check-in`;
  if (ranked.length === 0) return `Symptoms: none marked, across ${plural(checkedIn.size, 'day')} with a check-in.${flares}`;
  const named = ranked.slice(0, GLANCE_TOP_SYMPTOMS).map((entry) => `${entry.label.toLowerCase()} on ${plural(entry.days.size, 'day')}`);
  const rest = ranked.length - named.length;
  const more = rest > 0 ? `, and ${plural(rest, 'other symptom')}` : '';
  return `Symptoms marked on the most days (${basis}): ${named.join(', ')}${more}.${flares}`;
}

export function glanceDoseLine(input: GlanceInputs): string {
  const doses = input.doses
    .map((dose) => ({ date: localDay(dose.scheduledFor), mark: doseMark(dose.status) }))
    .filter((dose) => inRange(dose.date, input));
  if (doses.length === 0) return 'Doses: none on the schedule in this range.';
  return `Doses: ${describeDoseDays(doses)}`;
}

function amount(value: number): string {
  return String(Math.round(value * 10) / 10);
}

export function glanceWeightLine(input: GlanceInputs): string | null {
  const sorted = [...input.weights].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const latest = sorted[sorted.length - 1];
  if (!latest) return null;
  const latestDay = localDay(latest.loggedAt);
  const line = `Weight: ${amount(latest.value)} ${latest.unit} on ${shortDate(latestDay)}`;
  const first = sorted.find((row) => row.unit === latest.unit && inRange(localDay(row.loggedAt), input));
  if (!first || first === latest || localDay(first.loggedAt) === latestDay) return `${line}.`;
  const change = latest.value - first.value;
  const since = shortDate(localDay(first.loggedAt));
  if (Math.abs(change) < 0.05) return `${line}, the same as on ${since}.`;
  return `${line}, ${change > 0 ? 'up' : 'down'} ${amount(Math.abs(change))} ${latest.unit} since ${since}.`;
}

export function glanceBloodPressureLine(input: GlanceInputs): string | null {
  const bp = input.bloodPressure;
  if (!bp) return null;
  return `Blood pressure: ${Math.round(bp.systolic)}/${Math.round(bp.diastolic)} ${bp.unit} on ${shortDate(localDay(bp.loggedAt))}.`;
}

function outside(lab: VisitLab): boolean {
  return (lab.high !== null && lab.value > lab.high) || (lab.low !== null && lab.value < lab.low);
}

export function glanceLabLines(input: GlanceInputs): string[] {
  if (input.labs.length === 0) return ['Labs: none recorded.'];
  const off = input.labs.filter(outside).sort((a, b) => b.testedAt.localeCompare(a.testedAt));
  if (off.length === 0) {
    const withRange = input.labs.filter((lab) => lab.low !== null || lab.high !== null).length;
    if (withRange === 0) return ['Labs: none of the latest results has a range from its lab to read it against.'];
    return [`Labs: the latest result of each test is inside the range its lab printed, for the ${plural(withRange, 'test')} with a range.`];
  }
  return off.map((lab) => `${lab.displayName}: ${labLine(lab)}, tested ${shortDate(lab.testedAt.slice(0, 10))}.`);
}

export function buildAtAGlance(input: GlanceInputs): ReportListSection {
  const rows = [
    glanceSymptomLine(input),
    glanceDoseLine(input),
    glanceWeightLine(input),
    glanceBloodPressureLine(input),
    ...glanceLabLines(input),
  ].filter((row): row is string => !!row);
  return { kind: 'list', heading: 'At a glance', note: GLANCE_NOTE, rows, empty: 'Nothing recorded yet.' };
}
