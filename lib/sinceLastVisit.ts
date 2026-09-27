// Since your last appointment: F19 of the competitive build plan (Phase 2,
// 2026-09-26). Counts forward from the most recent appointment of any kind
// that has already happened: the flares logged, the lab results recorded
// and the medicine and supplement changes made since. It appears as a band
// on Trends > Appointments and Care and as a section of the doctor report.
//
// Before an Appointment on Insights (lib/insightsMore.ts) reads the same
// records keyed to the NEXT visit's provider; this one is keyed to the last
// visit with anybody, so it answers "what has happened since I was last
// seen" even when nothing is booked. Pure: every sentence is a count and a
// date, never what a result or a change means. Checked by
// scripts/test_output_lenses.js.
import { daysBetween, shortDate } from './eatingVariety';
import { emptyView, plural, type ReadingBand, type ReadingItem, type ReadingView } from './readingBands';
import { localDay } from './trendsMore';

export type VisitRecord = { scheduledFor: string; title: string; providerName: string | null; appointmentType: string | null; status: string };
export type VisitLab = { displayName: string; value: number; unit: string | null; low: number | null; high: number | null; testedAt: string };
export type VisitFlare = { loggedAt: string; severity: number | null; notes: string | null };
export type VisitTreatment = {
  name: string;
  treatmentType: string;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string | null;
  doseAmount: number | null;
  doseUnit: string | null;
};

export type SinceLastVisitInputs = {
  today: string;
  appointments: VisitRecord[];
  labs: VisitLab[];
  flares: VisitFlare[];
  treatments: VisitTreatment[];
};

export function labLine(lab: VisitLab): string {
  const unit = lab.unit ? ` ${lab.unit}` : '';
  if (lab.high !== null && lab.value > lab.high) return `${lab.value}${unit}, above the range printed by the lab`;
  if (lab.low !== null && lab.value < lab.low) return `${lab.value}${unit}, below the range printed by the lab`;
  if (lab.low !== null || lab.high !== null) return `${lab.value}${unit}, inside the range printed by the lab`;
  return `${lab.value}${unit}`;
}

// Starts, ends and edits recorded on Life > My Meds after `since` and no
// later than `today`, each with the date it carries.
export function treatmentChanges(treatments: VisitTreatment[], since: string, today: string): (ReadingItem & { date: string })[] {
  const changes: (ReadingItem & { date: string })[] = [];
  treatments.forEach((treatment, index) => {
    const dose = treatment.doseAmount !== null ? `${treatment.doseAmount}${treatment.doseUnit ? ` ${treatment.doseUnit}` : ''}` : null;
    if (treatment.startDate && treatment.startDate > since && treatment.startDate <= today) {
      changes.push({
        key: `start-${index}`,
        date: treatment.startDate,
        title: `Started ${treatment.name}`,
        caption: [shortDate(treatment.startDate), dose].filter(Boolean).join(' · '),
      });
    }
    if (treatment.endDate && treatment.endDate > since && treatment.endDate <= today) {
      changes.push({ key: `end-${index}`, date: treatment.endDate, title: `Ended ${treatment.name}`, caption: shortDate(treatment.endDate) });
    } else if (treatment.updatedAt && localDay(treatment.updatedAt) > since && !(treatment.startDate && treatment.startDate > since)) {
      const edited = localDay(treatment.updatedAt);
      changes.push({
        key: `edit-${index}`,
        date: edited,
        title: `${treatment.name}, details edited`,
        caption: [`on ${shortDate(edited)}`, dose ? `now ${dose}` : null].filter(Boolean).join(' · '),
      });
    }
  });
  return changes;
}

// The most recent appointment dated before today that was not skipped. A
// visit later today has not happened yet, so it is not counted from.
export function lastVisit(appointments: VisitRecord[], today: string): (VisitRecord & { date: string }) | null {
  const past = appointments
    .map((a) => ({ ...a, date: localDay(a.scheduledFor) }))
    .filter((a) => a.date < today && a.status !== 'skipped')
    .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));
  return past[0] ?? null;
}

const SEVERITY_WORDS: Record<number, string> = { 1: 'mild', 2: 'moderate', 3: 'severe', 4: 'very severe' };
const MAX_ITEMS = 40;

export const SINCE_LAST_VISIT_NOTE =
  'These are counts of what was recorded. What a result or a flare means is a question for the next visit, and any change to a prescription is the prescriber’s to make.';

export function buildSinceLastVisitBand(input: SinceLastVisitInputs): ReadingBand | null {
  const last = lastVisit(input.appointments, input.today);
  if (!last) return null;
  const since = last.date;
  const who = last.providerName?.trim() ? `${last.title.trim() || 'An appointment'} with ${last.providerName.trim()}` : last.title.trim() || 'An appointment';
  const ago = daysBetween(since, input.today);

  const flares = input.flares.filter((f) => {
    const day = localDay(f.loggedAt);
    return day > since && day <= input.today;
  });
  const flareDays = new Set(flares.map((f) => localDay(f.loggedAt))).size;
  const labs = input.labs.filter((lab) => {
    const day = localDay(lab.testedAt);
    return day > since && day <= input.today;
  });
  const changes = treatmentChanges(input.treatments, since, input.today);

  const lines = [
    `${who}, on ${shortDate(since)}, ${plural(ago, 'day')} ago. Everything here was recorded from the day after it.`,
    flares.length > 0 ? `${plural(flares.length, 'flare')} logged, on ${plural(flareDays, 'day')}.` : 'No flares logged.',
    labs.length > 0 ? `${plural(labs.length, 'lab result')} recorded.` : 'No lab results recorded.',
    changes.length > 0 ? `${plural(changes.length, 'change')} to medicines or supplements recorded.` : 'No changes to medicines or supplements recorded.',
  ];

  const items: (ReadingItem & { date: string })[] = [
    ...labs.map((lab, index) => {
      const day = localDay(lab.testedAt);
      return { key: `lab-${index}`, date: day, title: `Lab: ${lab.displayName}`, caption: `${labLine(lab)} · ${shortDate(day)}` };
    }),
    ...flares.map((flare, index) => {
      const day = localDay(flare.loggedAt);
      const severity = flare.severity ? SEVERITY_WORDS[flare.severity] : undefined;
      return {
        key: `flare-${index}`,
        date: day,
        title: `Flare${severity ? `, ${severity}` : ''}`,
        caption: [shortDate(day), flare.notes?.trim() || null].filter(Boolean).join(' · '),
      };
    }),
    ...changes,
  ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const shown = items.slice(-MAX_ITEMS);
  const notes = [SINCE_LAST_VISIT_NOTE];
  if (items.length > shown.length) notes.unshift(`The latest ${shown.length} are listed; the ${items.length - shown.length} before them are counted above.`);

  return {
    id: 'sinceLastVisit',
    title: 'Since your last appointment',
    icon: 'time-outline',
    count: items.length,
    lines,
    items: shown.map(({ key, title, caption }) => ({ key, title, caption })),
    notes,
  };
}

export function buildSinceLastVisitView(input: SinceLastVisitInputs): ReadingView {
  const band = buildSinceLastVisitBand(input);
  if (!band) return emptyView('No earlier appointment is recorded, so there is nothing to count from. Appointments go in on Schedules > Appointments.');
  return { hasAnything: true, empty: '', bands: [band] };
}

