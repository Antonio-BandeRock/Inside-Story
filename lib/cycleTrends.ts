// Trends > Cycle, E3 of the competitive build plan (2026-09-30, 1.0.57.25).
// What was recorded on each day of the cycle, across every cycle in the
// range: flares by cycle day, each check-in tag by week of the cycle, and
// mood, energy and stress by week of the cycle.
//
// Pure, so scripts/test_cycle_trends.js runs it without a phone. Two rules
// hold it up. A day with no check-in says nothing either way, so every
// count is taken against the days that had one, and a cycle day nobody
// checked in on is a gap, never a zero. And nothing here says the cycle
// brought anything on: one person's few cycles can look like a pattern
// when they are not, which the side-by-side note says every time.
import { addDays, cycleDayOn, periodsFrom, type CycleDay } from './cycle';
import { emptyView, plural, type ReadingBand, type ReadingItem, type ReadingRow, type ReadingView } from './readingBands';

export type CycleTrendsRange = { start: string; end: string };

export type CycleTrendsInputs = {
  range: CycleTrendsRange;
  today: string;
  // Every logged period day, from any date, so a period that began before
  // the range still numbers the days inside it.
  cycleDays: CycleDay[];
  // One row per check-in in the range, on its local day.
  checkins: { date: string; type: string; mood: number | null; energy: number | null; stress: number | null }[];
  // One row per tag put on a check-in, on its local day.
  tagged: { date: string; label: string }[];
};

// Cycles are read over at least this many days whatever range is picked,
// since a month holds one cycle at most.
export const CYCLE_TRENDS_MIN_DAYS = 180;
// Flares are shown one row per cycle day up to this day. Later days are
// put together in one row, since few cycles reach them.
export const CYCLE_DAY_ROWS = 35;
// Below this many cycles counted, the view says any difference between
// cycle days can come from chance.
export const FEW_CYCLES = 3;

export const CYCLE_SIDE_BY_SIDE_NOTE =
  'These sit side by side and nothing here says the cycle brought anything on. A few cycles of one person can look like a pattern when they are not, and day 20 of a short cycle and day 20 of a long one are set together.';

export const CYCLE_COUNTED_NOTE =
  'Each count is taken against the days that had a check-in, since a day with nothing logged says nothing either way.';

type Week = { key: string; label: string; from: number; to: number };

export const CYCLE_WEEKS: Week[] = [
  { key: 'w1', label: 'Days 1 to 7', from: 1, to: 7 },
  { key: 'w2', label: 'Days 8 to 14', from: 8, to: 14 },
  { key: 'w3', label: 'Days 15 to 21', from: 15, to: 21 },
  { key: 'w4', label: 'Days 22 to 28', from: 22, to: 28 },
  { key: 'w5', label: 'Day 29 on', from: 29, to: Number.POSITIVE_INFINITY },
];

function weekOf(cycleDay: number): Week {
  return CYCLE_WEEKS.find((week) => cycleDay >= week.from && cycleDay <= week.to) ?? CYCLE_WEEKS[CYCLE_WEEKS.length - 1];
}

type DayFacts = {
  date: string;
  cycleDay: number;
  start: string;
  checkedIn: boolean;
  flare: boolean;
  tags: Set<string>;
  mood: number[];
  energy: number[];
  stress: number[];
};

function average(values: number[]): number | null {
  return values.length > 0 ? values.reduce((sum, n) => sum + n, 0) / values.length : null;
}

function oneDecimal(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

// The latest start on or before the day, the same one cycleDayOn counts from.
function startFor(day: string, starts: string[]): string | null {
  let latest: string | null = null;
  for (const start of starts) if (start <= day && (latest === null || start > latest)) latest = start;
  return latest;
}

export function cycleFacts(input: CycleTrendsInputs): { days: DayFacts[]; starts: string[] } {
  const starts = periodsFrom(input.cycleDays).map((period) => period.start);
  const byDate = new Map<string, DayFacts>();
  const last = input.range.end < input.today ? input.range.end : input.today;
  for (let date = input.range.start; date <= last; date = addDays(date, 1)) {
    const cycleDay = cycleDayOn(date, starts);
    const start = startFor(date, starts);
    if (cycleDay === null || start === null) continue;
    byDate.set(date, { date, cycleDay, start, checkedIn: false, flare: false, tags: new Set(), mood: [], energy: [], stress: [] });
  }
  for (const row of input.checkins) {
    const day = byDate.get(row.date);
    if (!day) continue;
    day.checkedIn = true;
    if (row.type === 'flare') day.flare = true;
    if (row.mood != null) day.mood.push(row.mood);
    if (row.energy != null) day.energy.push(row.energy);
    if (row.stress != null) day.stress.push(row.stress);
  }
  for (const row of input.tagged) {
    const day = byDate.get(row.date);
    if (!day) continue;
    day.checkedIn = true;
    day.tags.add(row.label);
  }
  return { days: [...byDate.values()], starts };
}

export function buildCycleTrendsView(input: CycleTrendsInputs): ReadingView {
  const { days, starts } = cycleFacts(input);
  if (starts.length === 0) {
    return emptyView('No period days logged yet. Log them in Signals > Cycle, and each day after a start is numbered here with what you recorded on it.');
  }
  if (days.length === 0) {
    return emptyView('No period start falls in or within 60 days before this range. Log period days in Signals > Cycle, or pick a longer range.');
  }
  const checked = days.filter((day) => day.checkedIn);
  const cycles = new Set(days.map((day) => day.start));
  const bands: ReadingBand[] = [];

  // 1. What is being read.
  {
    const lines = [
      `${plural(cycles.size, 'cycle')} in this range, counted from the day each period started. ${plural(checked.length, 'day')} of ${days.length} had a check-in.`,
    ];
    if (cycles.size < FEW_CYCLES) {
      lines.push(`With ${plural(cycles.size, 'cycle')}, any difference between one cycle day and another can come from chance alone.`);
    }
    lines.push('Days more than 60 days after the last start logged are left out, since a start may have gone unlogged.');
    bands.push({ id: 'cycles', title: 'What is counted', icon: 'water-outline', count: cycles.size, lines, notes: [CYCLE_COUNTED_NOTE] });
  }

  if (checked.length === 0) {
    bands.push({
      id: 'noCheckins',
      title: 'Nothing checked in yet',
      icon: 'chatbubble-ellipses-outline',
      lines: ['No check-in falls on a numbered cycle day in this range. Check-ins, flares and tags from Home or Signals line up here by cycle day.'],
    });
    return { hasAnything: true, empty: '', bands };
  }

  // 2. Flares by cycle day.
  {
    const rows: ReadingRow[] = [];
    const rowFor = (label: string, key: string, match: (n: number) => boolean) => {
      const here = checked.filter((day) => match(day.cycleDay));
      const flares = here.filter((day) => day.flare).length;
      rows.push({
        key,
        label,
        value: here.length > 0 ? flares : null,
        display: here.length > 0 ? `${flares} of ${plural(here.length, 'day')} checked in` : 'No check-in',
      });
    };
    for (let n = 1; n <= CYCLE_DAY_ROWS; n += 1) rowFor(`Day ${n}`, `d${n}`, (d) => d === n);
    if (checked.some((day) => day.cycleDay > CYCLE_DAY_ROWS)) {
      rowFor(`Day ${CYCLE_DAY_ROWS + 1} on`, 'later', (d) => d > CYCLE_DAY_ROWS);
    }
    const total = checked.filter((day) => day.flare).length;
    const gaps = rows.filter((row) => row.value === null).length;
    bands.push({
      id: 'flares',
      title: 'Flares by cycle day',
      icon: 'flame-outline',
      count: total,
      lines: [
        total === 0
          ? 'No flare was logged on a numbered cycle day in this range.'
          : `${plural(total, 'day')} with a flare logged. Each bar is how many of the days checked in on that cycle day had one.`,
        ...(gaps > 0 ? [`${plural(gaps, 'cycle day')} had no check-in in any cycle and ${gaps === 1 ? 'shows' : 'show'} as a gap.`] : []),
      ],
      rows,
      notes: [CYCLE_SIDE_BY_SIDE_NOTE],
    });
  }

  // 3. Each tag by week of the cycle.
  {
    const perWeek = CYCLE_WEEKS.map((week) => checked.filter((day) => day.cycleDay >= week.from && day.cycleDay <= week.to));
    const labels = new Map<string, number>();
    for (const day of checked) for (const label of day.tags) labels.set(label, (labels.get(label) ?? 0) + 1);
    const ordered = [...labels.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (ordered.length > 0) {
      const items: ReadingItem[] = ordered.map(([label, count]) => {
        const parts = CYCLE_WEEKS.map((week, index) => {
          const here = perWeek[index];
          if (here.length === 0) return null;
          const tagged = here.filter((day) => day.tags.has(label)).length;
          return `${week.label.toLowerCase()}, ${tagged} of ${here.length}`;
        }).filter((part): part is string => part !== null);
        return { key: label, title: `${label}, ${plural(count, 'day')}`, caption: `Days tagged of days checked in: ${parts.join('; ')}.` };
      });
      bands.push({
        id: 'tags',
        title: 'Tags by week of the cycle',
        icon: 'pricetags-outline',
        count: ordered.length,
        lines: ['Each tag you put on a check-in, with how many of the days checked in during each week of the cycle carried it.'],
        items,
        notes: [CYCLE_SIDE_BY_SIDE_NOTE],
      });
    }
  }

  // 4. Mood, energy and stress by week of the cycle.
  {
    const scales: { key: 'mood' | 'energy' | 'stress'; label: string }[] = [
      { key: 'mood', label: 'Mood' },
      { key: 'energy', label: 'Energy' },
      { key: 'stress', label: 'Stress' },
    ];
    for (const scale of scales) {
      const rated = checked.filter((day) => day[scale.key].length > 0);
      if (rated.length === 0) continue;
      const rows: ReadingRow[] = CYCLE_WEEKS.map((week) => {
        const values = rated.filter((day) => weekOf(day.cycleDay) === week).map((day) => average(day[scale.key]) as number);
        const mean = average(values);
        return {
          key: `${scale.key}-${week.key}`,
          label: week.label,
          value: mean,
          display: mean === null ? 'Not rated' : `${oneDecimal(mean)} of 5, ${plural(values.length, 'day')}`,
        };
      });
      bands.push({
        id: `scale-${scale.key}`,
        title: `${scale.label} by week of the cycle`,
        icon: scale.key === 'mood' ? 'happy-outline' : scale.key === 'energy' ? 'battery-half-outline' : 'pulse-outline',
        count: rated.length,
        lines: [`The average ${scale.label.toLowerCase()} you gave, 1 to 5, on the days you rated it in each week of the cycle.`],
        rows,
      });
    }
  }

  return { hasAnything: true, empty: '', bands };
}
