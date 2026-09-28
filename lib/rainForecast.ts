// Rain forecast on a watering task (I2, 1.0.55.16). A garden task whose
// name is about watering carries one line saying what rain is forecast for
// its day and the day before, from the same Open-Meteo service and the same
// saved My Zone location Home's sky chips already use (lib/homeSky.ts,
// getRainForecast). Rain that falls on its own is water the garden did not
// have to be given, which is the point of showing it.
//
// The line reports the forecast and leaves the choice with the person: it
// never cancels, moves or marks a task, and it never says a task is not
// needed, since a forecast is a chance and a bed under a roof or deep mulch
// drinks differently from an open one. It says so once, in the suggestion
// to feel the soil first.
//
// Pure, with no I/O, so scripts/test_rain_forecast.js checks it without a
// phone.

export type RainUnit = 'mm' | 'in';

export type RainDay = {
  date: string; // 'YYYY-MM-DD', local to the forecast's place
  amount: number | null; // precipitation_sum, in `unit`
  chance: number | null; // precipitation_probability_max, 0 to 100
};

export type RainForecast = {
  unit: RainUnit;
  fetchedAt: string; // ISO stamp of when it was read
  days: RainDay[];
};

// Less than this is a trace: a damp morning, not water in the soil.
const RAIN_THRESHOLD: Record<RainUnit, number> = { mm: 1, in: 0.04 };

// Words that make a task a watering task. "rainwater" is left out on
// purpose: emptying a barrel is not watering anything.
const WATERING = /\b(water|waters|watering|watered|irrigate|irrigating|irrigation|hose|sprinkler|sprinklers|drip line|soak)\b/i;

export function isWateringTask(title: string): boolean {
  return WATERING.test(title);
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(y, m - 1, d + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

function dayName(date: string, today: string): string {
  if (date === today) return 'today';
  if (date === addDays(today, 1)) return 'tomorrow';
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long' });
}

export function describeRainAmount(amount: number, unit: RainUnit): string {
  if (unit === 'mm') return `about ${Math.round(amount)} mm`;
  return `about ${(Math.round(amount * 100) / 100).toFixed(2)} in`;
}

function describeDay(day: RainDay, unit: RainUnit): string {
  const amount = describeRainAmount(day.amount ?? 0, unit);
  return day.chance != null ? `${amount}, ${Math.round(day.chance)}% chance` : amount;
}

function isRainy(day: RainDay | undefined, unit: RainUnit): day is RainDay {
  return !!day && day.amount != null && day.amount >= RAIN_THRESHOLD[unit];
}

export type RainNote = { line: string; rain: boolean };

// The line for one task, or null when there is nothing to say: the task is
// not about watering, it is in the past, or its day is past the end of the
// forecast (a week out), where a guess would be worth less than nothing.
export function rainNoteForTask(
  task: { title: string; scheduledFor: string },
  forecast: RainForecast | null,
  today: string,
): RainNote | null {
  if (!forecast || !isWateringTask(task.title)) return null;
  const date = task.scheduledFor.slice(0, 10);
  if (date < today) return null;
  const byDate = new Map(forecast.days.map((day) => [day.date, day]));
  const that = byDate.get(date);
  if (!that) return null;
  const before = date > today ? byDate.get(addDays(date, -1)) : undefined;
  const name = dayName(date, today);
  const beforeName = before ? dayName(before.date, today) : null;
  const thatRains = isRainy(that, forecast.unit);
  const beforeRains = isRainy(before, forecast.unit);
  const feel = 'The soil may already be wet enough, so a finger in it first tells you whether this one is needed.';
  if (thatRains && beforeRains && before) {
    return {
      line: `Rain forecast ${beforeName} (${describeDay(before, forecast.unit)}) and ${name} (${describeDay(that, forecast.unit)}). ${feel}`,
      rain: true,
    };
  }
  if (thatRains) {
    return { line: `Rain forecast ${name}: ${describeDay(that, forecast.unit)}. ${feel}`, rain: true };
  }
  if (beforeRains && before) {
    return { line: `Rain forecast ${beforeName}: ${describeDay(before, forecast.unit)}. ${feel}`, rain: true };
  }
  return {
    line: before ? `No rain forecast ${beforeName} or ${name}.` : `No rain forecast ${name}.`,
    rain: false,
  };
}

// Whether any of these tasks could use the forecast at all, so nothing is
// fetched for a list with no watering in the coming week.
export function anyWateringSoon(tasks: readonly { title: string; scheduledFor: string }[], today: string): boolean {
  const end = addDays(today, 6);
  return tasks.some((task) => {
    const date = task.scheduledFor.slice(0, 10);
    return date >= today && date <= end && isWateringTask(task.title);
  });
}
