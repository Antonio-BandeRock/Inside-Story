// Nine Trends lenses that only read, 1.0.52.7: Hydration, Blood Pressure,
// Doses Over Time, Appointments & Care, Work, Reactions & New Foods,
// Nights, Ferments, and Planned and Eaten.
//
// Direct instruction, 2026-09-25, on the output lenses marked Build on the
// inputs-to-outputs map: "Build all of them." Each builder here takes rows
// already read (lib/trendsMoreDb.ts) and hands back a ReadingView
// (lib/readingBands.ts), with no I/O, so scripts/test_output_lenses.js can
// run every one of them without a phone.
//
// The rules the cross-app push settled hold for all nine. A week with
// nothing recorded is a gap and never a zero. Two things that sit in the
// same week are placed beside each other and never linked: nothing here
// says one led to the other. Nothing scores anybody, and nothing about a
// dose is advice about the dose.
import { addDays, buildWeeks, daysBetween, shortDate, type VarietyWeek } from './eatingVariety';
import { emptyView, gapNote, plural, type ReadingBand, type ReadingRow, type ReadingView } from './readingBands';
import { formatTime12 } from './timeOfDay';
import { usualSentence } from './yourUsual';
import { SCALE_LABELS, WORK_DIMENSIONS, weekOf } from './workMeaning';

export type DayRange = { start: string; end: string };

// ---------------------------------------------------------------------------
// Stamps. Most tables here store a local 'YYYY-MM-DDTHH:mm', and some rows
// (health sync, anything written with toISOString) arrive as UTC. A UTC
// stamp goes through a Date so an evening west of Greenwich stays on its
// own day, the local-day rule the cross-app push wrote down.
// ---------------------------------------------------------------------------

const ZONED = /(Z|[+-]\d\d:?\d\d)$/;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function localDay(stamp: string): string {
  if (ZONED.test(stamp)) {
    const at = new Date(stamp);
    if (!Number.isNaN(at.getTime())) return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
  }
  return stamp.slice(0, 10);
}

export function localHour(stamp: string): number | null {
  if (ZONED.test(stamp)) {
    const at = new Date(stamp);
    return Number.isNaN(at.getTime()) ? null : at.getHours();
  }
  const match = /T(\d\d):/.exec(stamp);
  return match ? Number(match[1]) : null;
}

type DayPart = 'Morning' | 'Afternoon' | 'Evening' | 'Night';
const DAY_PARTS: DayPart[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

// Morning 5 to noon, afternoon noon to 5, evening 5 to 10, night after.
export function dayPart(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 22) return 'Evening';
  return 'Night';
}

function weekLabel(week: VarietyWeek): string {
  return week.partial ? `${shortDate(week.weekStart)} (part)` : shortDate(week.weekStart);
}

function inWeek(date: string, week: VarietyWeek): boolean {
  return date >= week.weekStart && date <= week.weekEnd;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function tally<T>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function topCounts(counts: Map<string, number>, limit: number): [string, number][] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

function weekRows(
  weeks: VarietyWeek[],
  value: (week: VarietyWeek) => number | null,
  display: (value: number, week: VarietyWeek) => string,
  emptyLabel: string,
): ReadingRow[] {
  return weeks.map((week) => {
    const figure = value(week);
    return {
      key: week.weekStart,
      label: weekLabel(week),
      value: figure,
      display: figure === null ? emptyLabel : display(figure, week),
    };
  });
}

function withGapNote(lines: string[], rows: ReadingRow[]): string[] {
  const note = gapNote(rows, 'week');
  return note ? [...lines, note] : lines;
}

// ---------------------------------------------------------------------------
// 1. Hydration
// ---------------------------------------------------------------------------

export type HydrationInputs = {
  range: DayRange;
  // Every meal in the range, drinks included, so a week with meals logged
  // and no drinks reads as none and a week with nothing logged reads as a gap.
  meals: { eatenAt: string; name: string; mealType: string }[];
  // Water from food and drink as a share of the day's target, one point per
  // day with a meal logged (getNutrientTrendSeriesForRange('water')).
  waterPercentByDay: { date: string; value: number }[];
};

export function buildHydrationView(input: HydrationInputs): ReadingView {
  const meals = input.meals.map((meal) => ({ ...meal, date: localDay(meal.eatenAt) }));
  if (meals.length === 0) {
    return emptyView('Nothing to show yet. Drinks logged under Schedules > Hydration, and meals with water in them, fill this in.');
  }
  const drinks = meals.filter((meal) => meal.mealType === 'beverage');
  const weeks = buildWeeks(input.range.start, input.range.end, meals.map((meal) => meal.date));
  const rows = weekRows(
    weeks,
    (week) => (week.hasLogging ? drinks.filter((drink) => inWeek(drink.date, week)).length : null),
    (count, week) => `${plural(count, 'drink')}${week.daysLogged < 7 ? `, ${week.daysLogged}d` : ''}`,
    'not logged',
  );
  const bands: ReadingBand[] = [
    {
      id: 'byWeek',
      title: 'Drinks by week',
      icon: 'water-outline',
      count: drinks.length,
      lines: withGapNote(
        [`${plural(drinks.length, 'drink')} logged across ${plural(new Set(meals.map((m) => m.date)).size, 'day')} with anything logged.`],
        rows,
      ),
      rows,
      notes: ['A week with meals logged and no drinks reads as none. A week with nothing logged at all is left blank.'],
    },
  ];

  const kinds = topCounts(tally(drinks.map((drink) => drink.name.trim() || 'A drink')), 8);
  if (kinds.length > 0) {
    bands.push({
      id: 'byKind',
      title: 'By kind',
      icon: 'cafe-outline',
      count: kinds.length,
      lines: ['What was logged most often, by the name it was logged under.'],
      rows: kinds.map(([name, count]) => ({ key: name, label: name, value: count, display: plural(count, 'time') })),
    });
  }

  const byPart = tally(drinks.map((drink) => localHour(drink.eatenAt)).filter((h): h is number => h !== null).map(dayPart));
  if (byPart.size > 0) {
    bands.push({
      id: 'byTime',
      title: 'Time of day',
      icon: 'time-outline',
      lines: ['When in the day the drinks were logged.'],
      rows: DAY_PARTS.map((part) => ({
        key: part,
        label: part,
        value: byPart.get(part) ?? 0,
        display: plural(byPart.get(part) ?? 0, 'drink'),
      })),
    });
  }

  const water = input.waterPercentByDay.filter((point) => point.date >= input.range.start && point.date <= input.range.end);
  const waterAverage = average(water.map((point) => point.value));
  if (waterAverage !== null) {
    bands.push({
      id: 'water',
      title: 'Water from everything',
      icon: 'beaker-outline',
      lines: [
        `On the ${plural(water.length, 'day')} with meals logged, water from food and drink together came to ${Math.round(waterAverage)}% of the day's target on average.`,
      ],
      notes: ['This counts water in food as well as drinks, and only what was logged, so a day with drinks nobody wrote down reads lower than it was.'],
    });
  }
  return { hasAnything: true, empty: '', bands };
}

// ---------------------------------------------------------------------------
// 2. Blood Pressure
// ---------------------------------------------------------------------------

export type BloodPressureInputs = {
  range: DayRange;
  // Every reading ever, oldest first, so "your usual range" can draw on the
  // readings before the range as well as within it.
  readings: { loggedAt: string; systolic: number; diastolic: number; pulse: number | null }[];
};

function bp(systolic: number, diastolic: number): string {
  return `${Math.round(systolic)}/${Math.round(diastolic)}`;
}

export function buildBloodPressureView(input: BloodPressureInputs): ReadingView {
  const all = input.readings.map((reading) => ({ ...reading, date: localDay(reading.loggedAt) }));
  const inRange = all.filter((reading) => reading.date >= input.range.start && reading.date <= input.range.end);
  if (inRange.length === 0) {
    return emptyView(
      all.length === 0
        ? 'No blood pressure readings yet. They go in on Signals, or come across from Health Connect.'
        : 'No blood pressure readings in this range. Pick a longer one to see earlier readings.',
    );
  }
  const latest = inRange[inRange.length - 1];
  const upTo = all.filter((reading) => reading.loggedAt <= latest.loggedAt);
  const bands: ReadingBand[] = [
    {
      id: 'latest',
      title: 'Latest reading',
      icon: 'pulse-outline',
      lines: [
        `${bp(latest.systolic, latest.diastolic)} mmHg on ${shortDate(latest.date)}${latest.pulse ? `, pulse ${Math.round(latest.pulse)}` : ''}.`,
        `Top number: ${usualSentence(upTo.map((r) => r.systolic), (v) => `${Math.round(v)}`)}`,
        `Bottom number: ${usualSentence(upTo.map((r) => r.diastolic), (v) => `${Math.round(v)}`)}`,
      ],
      notes: ['Your usual range is what your readings have been, never what they should be. The numbers to aim for are the ones your clinician gives you.'],
    },
  ];

  const weeks = buildWeeks(input.range.start, input.range.end, inRange.map((r) => r.date));
  const rows = weekRows(
    weeks,
    (week) => average(inRange.filter((r) => inWeek(r.date, week)).map((r) => r.systolic)),
    (value, week) => {
      const these = inRange.filter((r) => inWeek(r.date, week));
      return `${bp(value, average(these.map((r) => r.diastolic)) ?? 0)}, ${these.length}×`;
    },
    'no reading',
  );
  bands.push({
    id: 'byWeek',
    title: 'By week',
    icon: 'calendar-outline',
    count: inRange.length,
    lines: withGapNote([`The bar is the week's average top number, with both averages and how many readings at the end.`], rows),
    rows: rows.map((row) => (row.value === null ? row : { ...row, value: round1(row.value) })),
  });

  const parts = DAY_PARTS.map((part) => {
    const these = inRange.filter((r) => {
      const hour = localHour(r.loggedAt);
      return hour !== null && dayPart(hour) === part;
    });
    const sys = average(these.map((r) => r.systolic));
    return {
      key: part,
      label: part,
      value: sys === null ? null : round1(sys),
      display: sys === null ? 'none' : `${bp(sys, average(these.map((r) => r.diastolic)) ?? 0)}, ${these.length}×`,
    };
  });
  if (parts.some((part) => part.value !== null)) {
    bands.push({
      id: 'byTime',
      title: 'Time of day',
      icon: 'time-outline',
      lines: ['Readings taken at different times of day often differ. The same averages, split by when they were taken.'],
      rows: parts,
    });
  }
  return { hasAnything: true, empty: '', bands };
}

// ---------------------------------------------------------------------------
// 3. Doses Over Time
// ---------------------------------------------------------------------------

export type DoseInputs = {
  range: DayRange;
  today: string;
  // Scheduled supplement, prescription and OTC doses in the range.
  doses: { scheduledFor: string; title: string; status: string }[];
};

type DoseMark = 'taken' | 'skipped' | 'unmarked';

function doseMark(status: string): DoseMark {
  if (status === 'logged' || status === 'partial' || status === 'replaced') return 'taken';
  if (status === 'skipped') return 'skipped';
  return 'unmarked';
}

function describeMarks(marks: DoseMark[]): string {
  const counts = tally(marks);
  const parts = [
    counts.get('taken') ? `${counts.get('taken')} taken` : null,
    counts.get('skipped') ? `${counts.get('skipped')} skipped` : null,
    counts.get('unmarked') ? `${counts.get('unmarked')} unmarked` : null,
  ].filter(Boolean);
  return parts.join(', ') || 'none';
}

export function buildDosesView(input: DoseInputs): ReadingView {
  const doses = input.doses
    .map((dose) => ({ ...dose, date: localDay(dose.scheduledFor), mark: doseMark(dose.status) }))
    .filter((dose) => dose.date <= input.today && dose.date >= input.range.start && dose.date <= input.range.end);
  if (doses.length === 0) {
    return emptyView('No doses on the schedule in this range. Meds and supplements are set up on Life > My Meds, and their times on Schedules > Meds.');
  }
  const weeks = buildWeeks(input.range.start, input.range.end, doses.map((d) => d.date));
  const rows = weekRows(
    weeks,
    (week) => {
      const these = doses.filter((d) => inWeek(d.date, week));
      return these.length === 0 ? null : these.filter((d) => d.mark === 'taken').length;
    },
    (_value, week) => describeMarks(doses.filter((d) => inWeek(d.date, week)).map((d) => d.mark)),
    'none scheduled',
  );
  const bands: ReadingBand[] = [
    {
      id: 'byWeek',
      title: 'By week',
      icon: 'calendar-outline',
      count: doses.length,
      lines: withGapNote([`${plural(doses.length, 'scheduled dose')} up to today: ${describeMarks(doses.map((d) => d.mark))}. The bar is how many were marked taken.`], rows),
      rows,
    },
  ];

  const parts = DAY_PARTS.map((part) => {
    const these = doses.filter((d) => {
      const hour = localHour(d.scheduledFor);
      return hour !== null && dayPart(hour) === part;
    });
    return {
      key: part,
      label: part,
      value: these.length === 0 ? null : these.filter((d) => d.mark === 'taken').length,
      display: these.length === 0 ? 'none' : describeMarks(these.map((d) => d.mark)),
    };
  });
  bands.push({
    id: 'byTime',
    title: 'Time of day',
    icon: 'time-outline',
    lines: ['The same marks, split by when each dose was scheduled.'],
    rows: parts,
  });

  const byTitle = new Map<string, DoseMark[]>();
  for (const dose of doses) byTitle.set(dose.title, [...(byTitle.get(dose.title) ?? []), dose.mark]);
  bands.push({
    id: 'byItem',
    title: 'By med or supplement',
    icon: 'medkit-outline',
    count: byTitle.size,
    lines: [],
    items: [...byTitle.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([title, marks]) => ({ key: title, title, caption: describeMarks(marks) })),
    notes: [
      'These are marks on the schedule and nothing more. They say nothing about whether a dose is right; anything about the dose itself is for your prescriber.',
    ],
  });
  return { hasAnything: true, empty: '', bands };
}

// ---------------------------------------------------------------------------
// 4. Appointments & Care
// ---------------------------------------------------------------------------

export type CareInputs = {
  range: DayRange;
  today: string;
  // Every appointment, past and upcoming.
  appointments: { scheduledFor: string; title: string; providerName: string | null; appointmentType: string | null; status: string }[];
};

export function buildCareView(input: CareInputs): ReadingView {
  const all = input.appointments
    .map((a) => ({ ...a, date: localDay(a.scheduledFor), who: a.providerName?.trim() || a.title.trim() || 'An appointment' }))
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  if (all.length === 0) {
    return emptyView('No appointments yet. They go in on Schedules > Appointments.');
  }
  const past = all.filter((a) => a.date >= input.range.start && a.date <= input.range.end && a.date <= input.today && a.status !== 'skipped');
  const upcoming = all.filter((a) => a.date > input.today).slice(0, 8);
  const bands: ReadingBand[] = [];

  if (past.length > 0) {
    const kinds = topCounts(tally(past.map((a) => a.appointmentType?.trim() || 'Kind not said')), 10);
    bands.push({
      id: 'byKind',
      title: 'Visits by kind',
      icon: 'medkit-outline',
      count: past.length,
      lines: [`${plural(past.length, 'visit')} in this range.`],
      rows: kinds.map(([kind, count]) => ({ key: kind, label: kind, value: count, display: plural(count, 'visit') })),
    });
  }

  // Gaps are read from every past visit, not only those in the range, so
  // a provider seen once in the range still shows how long since before.
  const everyPast = all.filter((a) => a.date <= input.today && a.status !== 'skipped');
  const byWho = new Map<string, string[]>();
  for (const visit of everyPast) byWho.set(visit.who, [...(byWho.get(visit.who) ?? []), visit.date]);
  const providers = [...byWho.entries()].filter(([, dates]) => dates.some((d) => d >= input.range.start));
  if (providers.length > 0) {
    bands.push({
      id: 'byProvider',
      title: 'By provider',
      icon: 'people-outline',
      count: providers.length,
      lines: ['Each provider, how many visits in all, the last one, and the usual gap between them.'],
      items: providers
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([who, dates]) => {
          const gaps = dates.slice(1).map((date, index) => daysBetween(dates[index], date));
          const usualGap = median(gaps);
          const last = dates[dates.length - 1];
          return {
            key: who,
            title: who,
            caption: [
              plural(dates.length, 'visit'),
              `last ${shortDate(last)}, ${plural(daysBetween(last, input.today), 'day')} ago`,
              usualGap === null ? null : `usually ${plural(Math.round(usualGap), 'day')} apart`,
            ]
              .filter(Boolean)
              .join(' · '),
          };
        }),
    });
  }

  if (upcoming.length > 0) {
    bands.push({
      id: 'upcoming',
      title: 'Coming up',
      icon: 'calendar-outline',
      count: upcoming.length,
      lines: [],
      items: upcoming.map((a) => ({
        key: `${a.scheduledFor}-${a.who}`,
        title: a.who,
        caption: `${shortDate(a.date)}, in ${plural(daysBetween(input.today, a.date), 'day')}${a.appointmentType ? ` · ${a.appointmentType}` : ''}`,
      })),
    });
  }

  if (bands.length === 0) {
    return emptyView('No appointments in this range. Pick a longer one to see earlier visits.');
  }
  return { hasAnything: true, empty: '', bands };
}

// ---------------------------------------------------------------------------
// 5. Work
// ---------------------------------------------------------------------------

export type WorkInputs = {
  range: DayRange;
  checkins: { weekOf: string; autonomy: number; competence: number; relatedness: number; drain: number }[];
  sleep: { date: string; value: number }[];
  flareDates: string[];
};

export function buildWorkView(input: WorkInputs): ReadingView {
  const firstWeek = weekOf(input.range.start);
  const checkins = input.checkins.filter((c) => c.weekOf >= firstWeek && c.weekOf <= input.range.end);
  if (checkins.length === 0) {
    return emptyView(
      input.checkins.length === 0
        ? 'No work check-ins yet. Four quick answers a week go in on Life > Work.'
        : 'No work check-ins in this range. Pick a longer one to see earlier weeks.',
    );
  }
  const weekStarts: string[] = [];
  for (let week = firstWeek; week <= input.range.end; week = addDays(week, 7)) weekStarts.push(week);
  const byWeek = new Map(checkins.map((c) => [c.weekOf, c]));
  const drain = WORK_DIMENSIONS.find((d) => d.code === 'drain');

  const rows: ReadingRow[] = weekStarts.map((week) => {
    const found = byWeek.get(week);
    return {
      key: week,
      label: shortDate(week),
      value: found ? found.drain : null,
      display: found ? SCALE_LABELS[found.drain] ?? String(found.drain) : 'no check-in',
    };
  });

  const beside = weekStarts
    .filter((week) => byWeek.has(week))
    .map((week) => {
      const end = addDays(week, 6);
      const nights = input.sleep.filter((s) => s.date >= week && s.date <= end);
      const sleepAverage = average(nights.map((s) => s.value));
      const flares = input.flareDates.filter((d) => d >= week && d <= end).length;
      const found = byWeek.get(week)!;
      const answers = WORK_DIMENSIONS.filter((d) => d.code !== 'drain')
        .map((d) => `${d.label.toLowerCase()}: ${(SCALE_LABELS[found[d.code]] ?? String(found[d.code])).toLowerCase()}`)
        .join(', ');
      return {
        key: week,
        title: `Week of ${shortDate(week)}`,
        caption: [
          answers,
          sleepAverage === null ? 'no sleep logged' : `sleep ${round1(sleepAverage)} h a night over ${plural(nights.length, 'night')}`,
          flares === 0 ? 'no flares logged' : plural(flares, 'flare'),
        ].join(' · '),
      };
    });

  return {
    hasAnything: true,
    empty: '',
    bands: [
      {
        id: 'drain',
        title: drain?.label ?? 'What it took out of you',
        icon: 'battery-half-outline',
        count: checkins.length,
        lines: withGapNote([`Your answer each week to "${drain?.question ?? 'How much did work take out of you?'}"`], rows),
        rows,
      },
      {
        id: 'beside',
        title: 'Beside sleep and flares',
        icon: 'git-compare-outline',
        count: beside.length,
        lines: ['Each week you checked in, with the other three answers, sleep, and flares from the same seven days.'],
        items: beside,
        notes: ['These sit side by side and nothing more. A hard week and a flare in the same seven days can share a week without one leading to the other.'],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// 6. Reactions & New Foods
// ---------------------------------------------------------------------------

export type ReactionsInputs = {
  range: DayRange;
  mealDates: string[];
  reactions: { loggedAt: string; severity: number | null; mealName: string | null }[];
  trials: { foodName: string; status: string; startedAt: string; resolvedAt: string | null; design: string | null }[];
};

// The same words the Signals check-in form offers (app/(tabs)/log.tsx).
const SEVERITY_WORDS: Record<number, string> = { 1: 'mild', 2: 'moderate', 3: 'severe', 4: 'very severe' };

const TRIAL_WORDS: Record<string, string> = {
  waiting: 'waiting to start',
  trialing: 'being tried now',
  cleared: 'finished, no reaction noted',
  flagged: 'finished, a reaction noted',
};

export function buildReactionsView(input: ReactionsInputs): ReadingView {
  const reactions = input.reactions
    .map((r) => ({ ...r, date: localDay(r.loggedAt) }))
    .filter((r) => r.date >= input.range.start && r.date <= input.range.end);
  const trials = input.trials.filter((t) => {
    const started = localDay(t.startedAt);
    const resolved = t.resolvedAt ? localDay(t.resolvedAt) : null;
    return (started <= input.range.end && (resolved === null || resolved >= input.range.start)) || (started >= input.range.start && started <= input.range.end);
  });
  if (reactions.length === 0 && trials.length === 0) {
    return emptyView('Nothing yet. Reactions are logged after a meal on Signals, and a new food is tried on Signals > Food Trials.');
  }
  const bands: ReadingBand[] = [];

  if (trials.length > 0) {
    bands.push({
      id: 'trials',
      title: 'New foods tried',
      icon: 'flask-outline',
      count: trials.length,
      lines: [],
      items: trials
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .map((t) => ({
          key: `${t.foodName}-${t.startedAt}`,
          title: t.foodName,
          caption: [
            t.design === 'remove_return' ? 'left out, then brought back' : 'tried',
            `from ${shortDate(localDay(t.startedAt))}`,
            TRIAL_WORDS[t.status] ?? t.status,
          ].join(' · '),
        })),
      notes: ['One run of a trial is one run. A result here is what happened that time, and a second run is how to know more.'],
    });
  }

  const loggedInRange = input.mealDates.filter((d) => d >= input.range.start && d <= input.range.end);
  const weeks = buildWeeks(input.range.start, input.range.end, [...loggedInRange, ...reactions.map((r) => r.date)]);
  const rows = weekRows(
    weeks,
    (week) => (week.hasLogging ? reactions.filter((r) => inWeek(r.date, week)).length : null),
    (count) => plural(count, 'reaction'),
    'not logged',
  );
  bands.push({
    id: 'byWeek',
    title: 'Reactions by week',
    icon: 'alert-circle-outline',
    count: reactions.length,
    lines: withGapNote([`${plural(reactions.length, 'reaction')} logged after a meal in this range.`], rows),
    rows,
  });

  if (reactions.length > 0) {
    bands.push({
      id: 'list',
      title: 'Each reaction',
      icon: 'list-outline',
      count: reactions.length,
      lines: [],
      items: reactions
        .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
        .slice(0, 20)
        .map((r, index) => ({
          key: `${r.loggedAt}-${index}`,
          title: r.mealName ? `After ${r.mealName}` : 'After a meal',
          caption: `${shortDate(r.date)}${r.severity !== null && SEVERITY_WORDS[r.severity] ? ` · ${SEVERITY_WORDS[r.severity]}` : ''}`,
        })),
      notes: ['The meal named is the one the reaction was logged against. Pattern Finder on this tab is where foods are compared across many reactions, and even there a sample of one person cannot show what brought a reaction on.'],
    });
  }
  return { hasAnything: true, empty: '', bands };
}

// ---------------------------------------------------------------------------
// 7. Nights
// ---------------------------------------------------------------------------

export type NightsInputs = {
  range: DayRange;
  nights: { nightOf: string; times: number; firstWake: string | null }[];
  // Every meal in the range, drinks included: a night whose evening had
  // meals logged and no drink after six is compared, and an evening with
  // nothing logged at all is left out of the comparison.
  meals: { eatenAt: string; mealType: string }[];
};

export const EVENING_FROM_HOUR = 18;

export function buildNightsView(input: NightsInputs): ReadingView {
  const nights = input.nights.filter((n) => n.nightOf >= input.range.start && n.nightOf <= input.range.end);
  if (nights.length === 0) {
    return emptyView(
      input.nights.length === 0
        ? 'No nights logged yet. How many times you got up goes in on Signals > Nocturia.'
        : 'No nights logged in this range. Pick a longer one to see earlier nights.',
    );
  }
  const weeks = buildWeeks(input.range.start, input.range.end, nights.map((n) => n.nightOf));
  const rows = weekRows(
    weeks,
    (week) => {
      const these = nights.filter((n) => inWeek(n.nightOf, week));
      const avg = average(these.map((n) => n.times));
      return avg === null ? null : round1(avg);
    },
    (value, week) => `${value} a night, ${nights.filter((n) => inWeek(n.nightOf, week)).length}n`,
    'not logged',
  );
  const bands: ReadingBand[] = [
    {
      id: 'byWeek',
      title: 'Times up, by week',
      icon: 'moon-outline',
      count: nights.length,
      lines: withGapNote([`${plural(nights.length, 'night')} logged. The bar is the average times up on the nights logged that week.`], rows),
      rows,
    },
  ];

  const meals = input.meals.map((m) => ({ date: localDay(m.eatenAt), hour: localHour(m.eatenAt), drink: m.mealType === 'beverage' }));
  const withDrink: number[] = [];
  const without: number[] = [];
  let unknown = 0;
  for (const night of nights) {
    const sameDay = meals.filter((m) => m.date === night.nightOf);
    if (sameDay.length === 0) {
      unknown += 1;
      continue;
    }
    const late = sameDay.some((m) => m.drink && m.hour !== null && m.hour >= EVENING_FROM_HOUR);
    (late ? withDrink : without).push(night.times);
  }
  const lines: string[] = [];
  const withAverage = average(withDrink);
  const withoutAverage = average(without);
  if (withAverage !== null) lines.push(`After an evening with a drink logged from 6 pm on: ${round1(withAverage)} times up on average, over ${plural(withDrink.length, 'night')}.`);
  if (withoutAverage !== null) lines.push(`After an evening with meals logged and no drink from 6 pm on: ${round1(withoutAverage)} times up on average, over ${plural(without.length, 'night')}.`);
  if (unknown > 0) lines.push(`${plural(unknown, 'night')} had nothing logged that day and ${unknown === 1 ? 'is' : 'are'} left out of this comparison.`);
  bands.push({
    id: 'evening',
    title: 'Beside the evening before',
    icon: 'water-outline',
    lines: lines.length > 0 ? lines : ['None of the nights logged had meals or drinks logged the day before, so there is nothing to set beside them yet.'],
    notes: ['This counts drinks logged, not how much, and places the two side by side. Many things change how often somebody wakes, and a handful of nights cannot separate them.'],
  });

  const wakes = nights
    .map((n) => n.firstWake)
    .filter((w): w is string => !!w)
    .map((w) => {
      const [h, m] = w.split(':').map(Number);
      // Minutes past noon, so 11 pm and 2 am sit in the right order.
      return ((h + 12) % 24) * 60 + (m || 0);
    });
  const middleWake = median(wakes);
  if (middleWake !== null) {
    const minutes = (Math.round(middleWake) + 12 * 60) % (24 * 60);
    bands.push({
      id: 'firstWake',
      title: 'First time up',
      icon: 'alarm-outline',
      lines: [`On the ${plural(wakes.length, 'night')} with a time noted, the middle first waking was ${formatTime12(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`)}.`],
    });
  }
  return { hasAnything: true, empty: '', bands };
}

// ---------------------------------------------------------------------------
// 8. Ferments
// ---------------------------------------------------------------------------

export type FermentsInputs = {
  range: DayRange;
  batches: { fermentationName: string; startedAt: string; stage: string }[];
  harvests: { drinkName: string; readyAt: string; quantity: number; quantityRemaining: number; unit: string }[];
};

const STAGE_WORDS: Record<string, string> = {
  primary: 'first ferment',
  carbonating: 'carbonating',
  refrigerated: 'in the fridge',
  finished: 'finished',
};

function trimNumber(value: number): string {
  return String(Math.round(value * 10) / 10);
}

export function buildFermentsView(input: FermentsInputs): ReadingView {
  const batches = input.batches.map((b) => ({ ...b, date: localDay(b.startedAt) })).filter((b) => b.date >= input.range.start && b.date <= input.range.end);
  const harvests = input.harvests.map((h) => ({ ...h, date: localDay(h.readyAt) })).filter((h) => h.date >= input.range.start && h.date <= input.range.end);
  const going = input.batches.filter((b) => b.stage !== 'finished');
  if (batches.length === 0 && harvests.length === 0 && going.length === 0) {
    return emptyView('No ferments in this range. Batches are started from Food > Fermentation, and what they make is drawn down as it is drunk.');
  }
  const bands: ReadingBand[] = [];

  const byName = tally(batches.map((b) => b.fermentationName));
  bands.push({
    id: 'made',
    title: 'Batches started',
    icon: 'flask-outline',
    count: batches.length,
    lines: [
      batches.length === 0
        ? 'No batches started in this range.'
        : `${plural(batches.length, 'batch', 'batches')} of ${plural(byName.size, 'different ferment')} started in this range.`,
    ],
    rows: topCounts(byName, 10).map(([name, count]) => ({ key: name, label: name, value: count, display: plural(count, 'batch', 'batches') })),
    notes: ['Different ferments carry different cultures, so the count of different ones is worth as much as the count of batches.'],
  });

  if (going.length > 0) {
    bands.push({
      id: 'going',
      title: 'Going now',
      icon: 'hourglass-outline',
      count: going.length,
      lines: [],
      items: going.map((b, index) => ({
        key: `${b.fermentationName}-${b.startedAt}-${index}`,
        title: b.fermentationName,
        caption: `started ${shortDate(localDay(b.startedAt))} · ${STAGE_WORDS[b.stage] ?? b.stage}`,
      })),
    });
  }

  if (harvests.length > 0) {
    // Amounts only add within one unit, never across units.
    const byUnit = new Map<string, { made: number; drunk: number }>();
    for (const h of harvests) {
      const entry = byUnit.get(h.unit) ?? { made: 0, drunk: 0 };
      entry.made += h.quantity;
      entry.drunk += Math.max(0, h.quantity - h.quantityRemaining);
      byUnit.set(h.unit, entry);
    }
    bands.push({
      id: 'drunk',
      title: 'Made and drunk',
      icon: 'wine-outline',
      count: harvests.length,
      lines: [...byUnit.entries()].map(
        ([unit, { made, drunk }]) => `${trimNumber(made)} ${unit} made ready in this range, ${trimNumber(drunk)} ${unit} of it drawn down so far.`,
      ),
      items: harvests
        .sort((a, b) => b.readyAt.localeCompare(a.readyAt))
        .slice(0, 12)
        .map((h, index) => ({
          key: `${h.drinkName}-${h.readyAt}-${index}`,
          title: h.drinkName,
          caption: `ready ${shortDate(h.date)} · ${trimNumber(h.quantityRemaining)} of ${trimNumber(h.quantity)} ${h.unit} left`,
        })),
    });
  }
  return { hasAnything: true, empty: '', bands };
}

// ---------------------------------------------------------------------------
// 9. Planned and Eaten
// ---------------------------------------------------------------------------

export type PlannedInputs = {
  range: DayRange;
  today: string;
  // Meals on the schedule in the range (item_type 'meal').
  planned: { scheduledFor: string; status: string; mealType: string | null }[];
};

type PlanOutcome = 'asPlanned' | 'partly' | 'instead' | 'skipped' | 'unmarked';

const OUTCOME_WORDS: Record<PlanOutcome, string> = {
  asPlanned: 'eaten as planned',
  partly: 'partly eaten',
  instead: 'something else eaten instead',
  skipped: 'skipped',
  unmarked: 'not marked',
};

function planOutcome(status: string): PlanOutcome {
  if (status === 'logged') return 'asPlanned';
  if (status === 'partial') return 'partly';
  if (status === 'replaced') return 'instead';
  if (status === 'skipped') return 'skipped';
  return 'unmarked';
}

export function buildPlannedView(input: PlannedInputs): ReadingView {
  const planned = input.planned
    .map((p) => ({ ...p, date: localDay(p.scheduledFor), outcome: planOutcome(p.status) }))
    .filter((p) => p.date >= input.range.start && p.date <= input.range.end && p.date <= input.today);
  if (planned.length === 0) {
    return emptyView('No planned meals in this range up to today. A plan is made on Schedules > Meal Plan, or by scheduling a meal ahead.');
  }
  const weeks = buildWeeks(input.range.start, input.range.end, planned.map((p) => p.date));
  const rows = weekRows(
    weeks,
    (week) => {
      const these = planned.filter((p) => inWeek(p.date, week));
      return these.length === 0 ? null : Math.round((these.filter((p) => p.outcome === 'asPlanned').length / these.length) * 100);
    },
    (_value, week) => {
      const these = planned.filter((p) => inWeek(p.date, week));
      return `${these.filter((p) => p.outcome === 'asPlanned').length} of ${these.length}`;
    },
    'none planned',
  );
  const counts = tally(planned.map((p) => p.outcome));
  const order: PlanOutcome[] = ['asPlanned', 'partly', 'instead', 'skipped', 'unmarked'];
  const byType = new Map<string, typeof planned>();
  for (const p of planned) {
    const key = p.mealType?.trim() ? p.mealType.charAt(0).toUpperCase() + p.mealType.slice(1) : 'Meal';
    byType.set(key, [...(byType.get(key) ?? []), p]);
  }
  return {
    hasAnything: true,
    empty: '',
    bands: [
      {
        id: 'byWeek',
        title: 'As planned, by week',
        icon: 'calendar-outline',
        count: planned.length,
        lines: withGapNote([`${plural(planned.length, 'planned meal')} up to today. The bar is the share eaten as planned that week.`], rows),
        rows,
      },
      {
        id: 'howItWent',
        title: 'How the plan went',
        icon: 'list-outline',
        lines: [],
        rows: order.map((outcome) => ({
          key: outcome,
          label: OUTCOME_WORDS[outcome].replace(/^./, (c) => c.toUpperCase()),
          value: counts.get(outcome) ?? 0,
          display: plural(counts.get(outcome) ?? 0, 'meal'),
        })),
        notes: ['A plan is a starting point. Eating something else instead is still eating, and the count here is only a record of which way each day went.'],
      },
      {
        id: 'byType',
        title: 'By meal',
        icon: 'restaurant-outline',
        count: byType.size,
        lines: [],
        items: [...byType.entries()].map(([type, these]) => ({
          key: type,
          title: type,
          caption: `${these.filter((p) => p.outcome === 'asPlanned').length} of ${these.length} as planned`,
        })),
      },
    ],
  };
}

