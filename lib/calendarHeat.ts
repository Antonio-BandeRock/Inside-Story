// A year in squares, F15 (2026-10-01).
//
// One square per day for the past year, laid out a week to a column with
// Monday at the top, each coloured by that day's figure: drinks logged,
// flares, mood, times up in the night, minutes of exercise, steps, things
// marked done, or any tracker the person made. The answer to Daylio's
// Year in Pixels, drawn by components/CalendarHeatStrip.tsx.
//
// The gap rule holds here as everywhere on Trends: a day with nothing
// recorded is an empty outline, never the lowest colour. A day that was
// recorded with a figure of nothing (meals logged and no drink among
// them) is the faintest fill, so the two can be told apart at a glance.
// Darker means more of this person's own figure, measured against their
// own days across the year, so no square says a day was good, bad, too
// much or too little.
//
// Pure, no imports at run time, so scripts/test_calendar_heat.js can run
// every case without a phone. The reading is lib/calendarHeatDb.ts.

export const YEAR_DAYS = 365;

// 0 is a recorded day with a figure of nothing; 1 to 4 run from least to
// most. null is a day with nothing recorded.
export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export type HeatCell = {
  day: string;
  // Week column, 0 is the oldest; row 0 is Monday.
  column: number;
  row: number;
  value: number | null;
  level: HeatLevel | null;
};

export type HeatMonth = { column: number; label: string };

export type YearStripSpec = {
  key: string;
  heading: string;
  // How one recorded day is said when its square is tapped: "3 drinks".
  describe: (value: number) => string;
  // A fixed scale (mood 1 to 5) is coloured by where a day sits on it;
  // anything else by where it sits among this person's own days.
  scale?: [number, number];
};

export type CalendarHeat = {
  key: string;
  heading: string;
  start: string;
  end: string;
  columns: number;
  cells: HeatCell[];
  months: HeatMonth[];
  recorded: number;
  total: number;
  summary: string;
  accessibilityLabel: string;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

function formatDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Whole calendar days, built from the calendar rather than by adding 24
// hours, so a daylight saving change never skips or repeats a day.
export function shiftDay(day: string, by: number): string {
  const date = parseDay(day);
  date.setDate(date.getDate() + by);
  return formatDay(date);
}

// Monday 0 through Sunday 6.
export function weekdayRow(day: string): number {
  return (parseDay(day).getDay() + 6) % 7;
}

// "Tue 14 May 2026".
export function sayDay(day: string): string {
  const date = parseDay(day);
  return `${WEEKDAYS[weekdayRow(day)]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`;
}

// Where each positive figure sits among the person's own positive
// figures: the lowest quarter is 1, the highest is 4. When every recorded
// figure is the same there is nothing to rank, and each gets the middle.
export function levelsFor(values: number[], scale?: [number, number]): (value: number) => HeatLevel {
  if (scale) {
    const [low, high] = scale;
    return (value) => {
      if (value <= 0) return 0;
      if (high <= low) return 3;
      const share = (Math.min(high, Math.max(low, value)) - low) / (high - low);
      return (1 + Math.round(share * 3)) as HeatLevel;
    };
  }
  const positive = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (positive.length === 0) return () => 0;
  const at = (q: number) => positive[Math.min(positive.length - 1, Math.floor(q * positive.length))];
  const [q1, q2, q3] = [at(0.25), at(0.5), at(0.75)];
  if (positive[0] === positive[positive.length - 1]) return (value) => (value <= 0 ? 0 : 3);
  return (value) => {
    if (value <= 0) return 0;
    if (value < q1) return 1;
    if (value < q2) return 2;
    if (value < q3) return 3;
    return 4;
  };
}

// `values` holds the recorded days only, day to figure; a day missing from
// it is a day with nothing recorded. `end` is the last day drawn (today).
export function buildCalendarHeat(spec: YearStripSpec, values: ReadonlyMap<string, number>, end: string, days = YEAR_DAYS): CalendarHeat {
  const start = shiftDay(end, -(days - 1));
  const inRange = [...values.entries()].filter(([day, value]) => day >= start && day <= end && Number.isFinite(value));
  const level = levelsFor(inRange.map(([, value]) => value), spec.scale);
  const lead = weekdayRow(start);
  const cells: HeatCell[] = [];
  const months: HeatMonth[] = [];
  let day = start;
  for (let index = 0; index < days; index += 1) {
    const slot = index + lead;
    const column = Math.floor(slot / 7);
    const row = slot % 7;
    const value = values.has(day) ? (values.get(day) as number) : null;
    cells.push({ day, column, row, value: value !== null && Number.isFinite(value) ? value : null, level: value !== null && Number.isFinite(value) ? level(value) : null });
    // A month is labelled at the first column wholly inside it.
    if (day.endsWith('-01')) months.push({ column: row === 0 ? column : column + 1, label: MONTHS[Number(day.slice(5, 7)) - 1] });
    day = shiftDay(day, 1);
  }
  const columns = Math.floor((days - 1 + lead) / 7) + 1;
  const recorded = cells.filter((cell) => cell.value !== null).length;
  const empty = days - recorded;
  const summary =
    recorded === 0
      ? `Nothing recorded in the last ${plural(days, 'day')}, so every square is an empty outline.`
      : `${plural(recorded, 'day')} of the last ${days} ${recorded === 1 ? 'has' : 'have'} something recorded. ${
          empty === 0 ? 'None are left empty.' : `The other ${plural(empty, 'day')} ${empty === 1 ? 'is an empty outline' : 'are empty outlines'}, never the lightest colour.`
        }`;
  return {
    key: spec.key,
    heading: spec.heading,
    start,
    end,
    columns,
    cells,
    // A name too close to the right edge to fit is left off.
    months: months.filter((month) => month.column <= columns - 2),
    recorded,
    total: days,
    summary,
    accessibilityLabel: `${spec.heading}, the last ${days} days. ${summary}`,
  };
}

// What a tapped square says.
export function describeCell(spec: Pick<YearStripSpec, 'describe'>, cell: Pick<HeatCell, 'day' | 'value'>): string {
  return `${sayDay(cell.day)}: ${cell.value === null ? 'nothing recorded' : spec.describe(cell.value)}.`;
}

export const HEAT_SHADE_NOTE =
  'Darker squares are days with more, measured against your other days in the year. The faintest fill is a day recorded with none; an empty outline is a day with nothing recorded. Tap a square to see its day.';

// The strips each lens shows. Trackers are added one strip per tracker
// by lib/calendarHeatDb.ts, since their names and units are the person's.
export const YEAR_STRIPS = {
  drinks: {
    key: 'drinks',
    heading: 'Drinks logged',
    describe: (v: number) => (v === 0 ? 'meals logged, no drink among them' : plural(v, 'drink') + ' logged'),
  },
  flares: {
    key: 'flares',
    heading: 'Flares and meal reactions',
    describe: (v: number) => (v === 0 ? 'other things logged, no flare or reaction' : plural(v, 'flare or reaction', 'flares and reactions')),
  },
  reactions: {
    key: 'reactions',
    heading: 'Meal reactions',
    describe: (v: number) => (v === 0 ? 'meals logged, no reaction' : plural(v, 'reaction') + ' after a meal'),
  },
  mood: {
    key: 'mood',
    heading: 'Mood',
    describe: (v: number) => `mood ${v} of 5`,
    scale: [1, 5] as [number, number],
  },
  nights: {
    key: 'nights',
    heading: 'Times up in the night',
    describe: (v: number) => (v === 0 ? 'not up in the night' : `up ${plural(v, 'time')}`),
  },
  exercise: {
    key: 'exercise',
    heading: 'Minutes of exercise',
    describe: (v: number) => (v === 0 ? 'exercise logged with no minutes given' : plural(Math.round(v), 'minute') + ' of exercise'),
  },
  steps: {
    key: 'steps',
    heading: 'Steps',
    describe: (v: number) => plural(Math.round(v), 'step'),
  },
  done: {
    key: 'done',
    heading: 'Things marked done',
    describe: (v: number) => plural(v, 'thing') + ' marked done',
  },
} satisfies Record<string, YearStripSpec>;

export type YearSquareSet =
  | 'hydration'
  | 'nights'
  | 'reactions'
  | 'workouts'
  | 'movement'
  | 'symptoms'
  | 'keepingUp'
  | 'trackers'
  | 'flares'
  | 'exercise';

// Which strips each lens shows, in order.
export const YEAR_SQUARE_SETS: Record<YearSquareSet, (keyof typeof YEAR_STRIPS | 'trackers')[]> = {
  hydration: ['drinks'],
  nights: ['nights'],
  reactions: ['reactions'],
  workouts: ['exercise'],
  movement: ['steps'],
  symptoms: ['flares', 'mood'],
  keepingUp: ['done'],
  trackers: ['trackers'],
  flares: ['flares', 'mood'],
  exercise: ['exercise'],
};

// A count per day: each event day adds one, and a day in `recordedDays`
// with no event is a recorded day with a figure of nothing. A day in
// neither stays out of the map, which draws it as an empty outline.
export function dayCounts(eventDays: readonly string[], recordedDays: readonly string[] = []): Map<string, number> {
  const out = new Map<string, number>();
  for (const day of recordedDays) out.set(day, 0);
  for (const day of eventDays) out.set(day, (out.get(day) ?? 0) + 1);
  return out;
}

// A total per day; a null amount still marks the day as recorded.
export function daySums(entries: readonly { day: string; value: number | null }[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const { day, value } of entries) out.set(day, (out.get(day) ?? 0) + (value !== null && Number.isFinite(value) ? value : 0));
  return out;
}
