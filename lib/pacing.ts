// Pacing, a Trends lens and a Home card: D16 of the competitive build plan
// (2026-09-30, 1.0.57.24).
//
// Pacing apps for fatigue and post-exertional crashes hand the person a
// daily limit and warn when it is close. This app does not set a limit.
// What it does is lay a person's own days side by side: steps, exercise,
// hands-on therapy sessions, and the days they tagged overload or a crash
// on a check-in, against what their typical day has been. Where the limit
// goes, if one is wanted, is for the person and whoever looks after their
// health to decide, and the lens says so.
//
// The rules the cross-app push settled hold here. A day with nothing
// recorded is a gap and never a zero: a phone with step syncing off has
// nothing to say, and a day with no exercise logged may simply not have
// been logged. Bigger days and the days after them are set beside each
// other and never linked, since a sample of one person over a few weeks
// can look like a pattern when it is not. Usual is the middle 80% of the
// days shown (lib/yourUsual.ts), which is what the days have been, never
// what they should be.
//
// Pure, no I/O, so scripts/test_pacing.js runs it without a phone. Rows are
// read in lib/trendsMoreDb.ts (Trends) and lib/pacingDb.ts (Home).
import { addDays, shortDate } from './eatingVariety';
import { emptyView, gapNote, plural, type ReadingBand, type ReadingRow, type ReadingView } from './readingBands';
import { usualRange, type UsualRange } from './yourUsual';

export type PacingRange = { start: string; end: string };

// Check-in tags that say a day was too much input or ended in a crash.
// Fixed codes from lib/checkinTags.ts. A symptom the person named for
// themselves joins them when it sits under Energy or Sensory & Regulation
// and points the unwelcome way (pacingTagCodes in lib/trendsMoreDb.ts).
export const PACING_TAG_CODES = [
  'energy_crash',
  'fatigue',
  'overstimulated',
  'noise_light_sensitivity',
  'meltdown',
  'shutdown',
  'brain_fog',
];

// How many days after a bigger day are read beside it. Crashes after
// exertion are commonly described as arriving a day or two later.
export const DAYS_AFTER = 2;

// How many days the Day by day band lists, the latest last.
export const DAY_BY_DAY_LIMIT = 14;

export type PacingInputs = {
  range: PacingRange;
  today: string;
  // One count per day, whatever the source (daily_step_counts).
  steps: { date: string; value: number }[];
  // exercise_logs. A workout finished in the player writes one of these,
  // so its minutes are counted once. date is the local day.
  exercise: { date: string; name: string; minutes: number | null }[];
  // therapy_sessions, with the session's label already looked up.
  therapy: { date: string; label: string; minutes: number | null }[];
  // Check-ins carrying one of the pacing tags, one row per tag.
  tagged: { date: string; code: string; label: string }[];
};

type DayFacts = {
  date: string;
  steps: number | null;
  minutes: number | null;
  exerciseCount: number;
  therapy: string[];
  tags: string[];
};

function eachDay(range: PacingRange): string[] {
  const days: string[] = [];
  for (let day = range.start; day <= range.end; day = addDays(day, 1)) days.push(day);
  return days;
}

function stepsWords(value: number): string {
  return `${Math.round(value).toLocaleString()} steps`;
}

function minutesWords(value: number): string {
  return `${Math.round(value)} min`;
}

function rangeWords(range: UsualRange, format: (value: number) => string): string {
  return `${format(range.low)} to ${format(range.high)}`;
}

function factsByDay(input: PacingInputs): Map<string, DayFacts> {
  const days = new Map<string, DayFacts>();
  for (const date of eachDay(input.range)) {
    days.set(date, { date, steps: null, minutes: null, exerciseCount: 0, therapy: [], tags: [] });
  }
  for (const row of input.steps) {
    const day = days.get(row.date);
    if (day && Number.isFinite(row.value)) day.steps = row.value;
  }
  for (const row of input.exercise) {
    const day = days.get(row.date);
    if (!day) continue;
    day.exerciseCount += 1;
    if (row.minutes != null && Number.isFinite(row.minutes)) day.minutes = (day.minutes ?? 0) + row.minutes;
  }
  for (const row of input.therapy) {
    const day = days.get(row.date);
    if (day) day.therapy.push(row.label);
  }
  for (const row of input.tagged) {
    const day = days.get(row.date);
    if (day && !day.tags.includes(row.label)) day.tags.push(row.label);
  }
  return days;
}

// The typical day, from the days in the range that carry a figure. Null
// until there are enough days for a middle to mean anything.
export function typicalDay(input: Pick<PacingInputs, 'steps' | 'exercise'> & { range: PacingRange }): {
  steps: UsualRange | null;
  minutes: UsualRange | null;
} {
  const inRange = (date: string) => date >= input.range.start && date <= input.range.end;
  const steps = input.steps.filter((row) => inRange(row.date)).map((row) => row.value);
  const perDay = new Map<string, number>();
  for (const row of input.exercise) {
    if (!inRange(row.date) || row.minutes == null) continue;
    perDay.set(row.date, (perDay.get(row.date) ?? 0) + row.minutes);
  }
  return { steps: usualRange(steps), minutes: usualRange([...perDay.values()]) };
}

function dayWords(day: DayFacts): string {
  const parts: string[] = [];
  if (day.steps != null) parts.push(stepsWords(day.steps));
  if (day.minutes != null) parts.push(`${minutesWords(day.minutes)} exercise`);
  else if (day.exerciseCount > 0) parts.push(plural(day.exerciseCount, 'exercise entry', 'exercise entries'));
  if (day.therapy.length > 0) parts.push(day.therapy.join(' and '));
  if (day.tags.length > 0) parts.push(`tagged ${day.tags.join(', ').toLowerCase()}`);
  return parts.length > 0 ? parts.join(', ') : 'nothing recorded';
}

function hasAnything(day: DayFacts): boolean {
  return day.steps != null || day.exerciseCount > 0 || day.therapy.length > 0 || day.tags.length > 0;
}

export const PACING_NO_LIMIT_NOTE =
  'Your usual is the middle of the days shown, which is what your days have been, never what they should be. The app sets no limit. Where one goes, if you want one, is for you and whoever looks after your health to decide.';

export const PACING_SIDE_BY_SIDE_NOTE =
  'These sit side by side and nothing here says one led to the other. A few weeks of one person can look like a pattern when it is not, and a tag only counts when it was put on a check-in.';

export function buildPacingView(input: PacingInputs): ReadingView {
  const days = factsByDay(input);
  const all = [...days.values()];
  const recorded = all.filter(hasAnything);
  if (recorded.length === 0) {
    return emptyView(
      'Nothing to pace against in this range yet. Steps come in from Life > Movement, exercise from the quick log or Schedules > Exercise, therapy sessions from Signals, and overload or a crash from the tags on a check-in.',
    );
  }
  const usual = typicalDay(input);
  const bands: ReadingBand[] = [];

  // 1. The typical day.
  {
    const stepDays = all.filter((day) => day.steps != null).length;
    const exerciseDays = all.filter((day) => day.exerciseCount > 0).length;
    const therapyCount = all.reduce((sum, day) => sum + day.therapy.length, 0);
    const taggedDays = all.filter((day) => day.tags.length > 0).length;
    const lines: string[] = [];
    lines.push(
      usual.steps
        ? `On a typical day here you walked ${rangeWords(usual.steps, stepsWords)}, from ${plural(stepDays, 'day')} with steps recorded.`
        : `${plural(stepDays, 'day')} with steps recorded. A usual range needs at least 8.`,
    );
    lines.push(
      usual.minutes
        ? `On days you logged exercise with minutes, it came to ${rangeWords(usual.minutes, minutesWords)}.`
        : `${plural(exerciseDays, 'day')} with exercise logged. A usual range for minutes needs at least 8 days with minutes given.`,
    );
    if (therapyCount > 0) lines.push(`${plural(therapyCount, 'therapy session')} in this range.`);
    lines.push(`Overload or a crash was tagged on ${plural(taggedDays, 'day')} of ${all.length}.`);
    bands.push({ id: 'typical', title: 'Your typical day', icon: 'pulse-outline', lines, notes: [PACING_NO_LIMIT_NOTE] });
  }

  // 2. Day by day, the latest fortnight of the range.
  {
    const shown = all.slice(-DAY_BY_DAY_LIMIT);
    const rows: ReadingRow[] = shown.map((day) => ({
      key: day.date,
      label: shortDate(day.date),
      value: day.steps,
      display: dayWords(day),
    }));
    const note = gapNote(rows, 'day');
    bands.push({
      id: 'dayByDay',
      title: 'Day by day',
      icon: 'calendar-outline',
      count: shown.filter(hasAnything).length,
      lines: [
        `The last ${plural(shown.length, 'day')} of the range. The bar is the day's steps; what else happened is in the words beside it.`,
        ...(note ? [note] : []),
      ],
      rows,
    });
  }

  // 3. Bigger days and the two days after, beside the rest.
  if (usual.steps || usual.minutes) {
    const bigger = (day: DayFacts) =>
      (usual.steps != null && day.steps != null && day.steps > usual.steps.high) ||
      (usual.minutes != null && day.minutes != null && day.minutes > usual.minutes.high);
    const within = (day: DayFacts) =>
      !bigger(day) && (day.steps != null || day.minutes != null);
    const tagWithin = (day: DayFacts) => {
      for (let offset = 0; offset <= DAYS_AFTER; offset += 1) {
        const later = days.get(addDays(day.date, offset));
        if (later && later.tags.length > 0) return true;
      }
      return false;
    };
    const finished = (day: DayFacts) => addDays(day.date, DAYS_AFTER) <= input.today && addDays(day.date, DAYS_AFTER) <= input.range.end;
    const biggerDays = all.filter((day) => finished(day) && bigger(day));
    const otherDays = all.filter((day) => finished(day) && within(day));
    const biggerTagged = biggerDays.filter(tagWithin).length;
    const otherTagged = otherDays.filter(tagWithin).length;
    const lines = [
      biggerDays.length === 0
        ? 'No day in this range went past the top of your usual.'
        : `${plural(biggerDays.length, 'day')} went past the top of your usual steps or exercise minutes. Overload or a crash was tagged that day or in the ${DAYS_AFTER} after on ${biggerTagged} of them.`,
      `On the ${plural(otherDays.length, 'other day')} with steps or minutes recorded, it was tagged that day or in the ${DAYS_AFTER} after on ${otherTagged}.`,
      `The last ${DAYS_AFTER} days of the range are left out, since the days after them have not all happened yet.`,
    ];
    bands.push({
      id: 'biggerDays',
      title: 'Bigger days and the days after',
      icon: 'trending-up-outline',
      count: biggerDays.length,
      lines,
      items: biggerDays
        .slice()
        .reverse()
        .map((day) => {
          const after: string[] = [];
          for (let offset = 1; offset <= DAYS_AFTER; offset += 1) {
            const later = days.get(addDays(day.date, offset));
            if (later && later.tags.length > 0) after.push(`${shortDate(later.date)}: ${later.tags.join(', ').toLowerCase()}`);
          }
          return {
            key: day.date,
            title: `${shortDate(day.date)}, ${dayWords(day)}`,
            caption: after.length > 0 ? `After: ${after.join('; ')}` : 'Nothing tagged in the two days after.',
          };
        }),
      notes: [PACING_SIDE_BY_SIDE_NOTE],
    });
  }

  // 4. The tags themselves.
  if (input.tagged.length > 0) {
    const counts = new Map<string, Set<string>>();
    for (const row of input.tagged) {
      if (!days.has(row.date)) continue;
      const set = counts.get(row.label) ?? new Set<string>();
      set.add(row.date);
      counts.set(row.label, set);
    }
    const ordered = [...counts.entries()].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
    if (ordered.length > 0) {
      bands.push({
        id: 'tags',
        title: 'Overload and crash tags',
        icon: 'battery-dead-outline',
        count: ordered.length,
        lines: ['How many days each tag was put on a check-in in this range.'],
        rows: ordered.map(([label, dates]) => ({ key: label, label, value: dates.size, display: plural(dates.size, 'day') })),
      });
    }
  }

  // 5. Therapy sessions.
  const sessions = input.therapy.filter((row) => days.has(row.date));
  if (sessions.length > 0) {
    bands.push({
      id: 'therapy',
      title: 'Therapy sessions',
      icon: 'hand-left-outline',
      count: sessions.length,
      lines: ['Each hands-on session in this range, with what was tagged in the two days after it.'],
      items: sessions
        .slice()
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((session, index) => {
          const after: string[] = [];
          for (let offset = 1; offset <= DAYS_AFTER; offset += 1) {
            const later = days.get(addDays(session.date, offset));
            if (later && later.tags.length > 0) after.push(later.tags.join(', ').toLowerCase());
          }
          return {
            key: `${session.date}-${index}`,
            title: `${shortDate(session.date)}, ${session.label}${session.minutes != null ? `, ${minutesWords(session.minutes)}` : ''}`,
            caption: after.length > 0 ? `Tagged in the two days after: ${after.join('; ')}` : 'Nothing tagged in the two days after.',
          };
        }),
      notes: ['Trends > Therapy Response reads each kind of session against your symptoms over a longer stretch.'],
    });
  }

  return { hasAnything: true, empty: '', bands };
}

// The Home card: today so far beside the typical day. Steps for today are
// still going up, so the sentence says "so far" and never compares today
// with the top of the range as if the day were over.
export type PacingTodayLine = { key: string; sentence: string };

export function pacingTodayLines(input: PacingInputs): PacingTodayLine[] {
  const days = factsByDay(input);
  const today = days.get(input.today);
  const usual = typicalDay({ ...input, range: { start: input.range.start, end: addDays(input.today, -1) } });
  if (!usual.steps && !usual.minutes) return [];
  const lines: PacingTodayLine[] = [];
  if (usual.steps) {
    lines.push({
      key: 'steps',
      sentence:
        today?.steps != null
          ? `${stepsWords(today.steps)} so far today. Your usual day has been ${rangeWords(usual.steps, stepsWords)}.`
          : `No steps recorded today yet. Your usual day has been ${rangeWords(usual.steps, stepsWords)}.`,
    });
  }
  if (usual.minutes) {
    lines.push({
      key: 'minutes',
      sentence:
        today?.minutes != null
          ? `${minutesWords(today.minutes)} of exercise logged today. On days you exercise it has been ${rangeWords(usual.minutes, minutesWords)}.`
          : `No exercise logged today. On days you exercise it has been ${rangeWords(usual.minutes, minutesWords)}.`,
    });
  }
  const yesterday = days.get(addDays(input.today, -1));
  if (yesterday && yesterday.tags.length > 0) {
    lines.push({ key: 'yesterday', sentence: `Yesterday was tagged ${yesterday.tags.join(', ').toLowerCase()}.` });
  }
  return lines;
}

export const PACING_TODAY_CAPTION = 'What your days have been. The app sets no limit.';
