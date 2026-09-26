// Other things on record around the same flares (Phase B of the
// 2026-09-24 gap review, item 22). Pure: no imports, no I/O.
//
// A food count on its own invites the reader to credit the food with
// everything that happened that week. So beside the food findings,
// Pattern Finder lists what else the records show around the same flares:
// sleep the night before against other nights, a medication or supplement
// started or stopped in the week before, and flares with no meals logged
// at all. Each line only says what happened alongside; none of them is
// offered as the explanation, and the closing line says the app cannot
// tell any of them apart from food.

export const MIN_FLARE_NIGHTS = 2;
export const MIN_OTHER_NIGHTS = 3;
export const TREATMENT_CHANGE_DAYS = 7;

export type SleepNight = { date: string; hours: number };
export type TreatmentDates = { name: string; startDate: string | null; endDate: string | null };

// What the dates are dates of (lib/patternOutcome.ts). Flares unless
// Pattern Finder was asked about low mood, low energy or high stress days.
export type ContextWords = { short: string; shortMany: string };
const FLARE_WORDS: ContextWords = { short: 'flare', shortMany: 'flares' };

function addDays(date: string, offset: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const moved = new Date(y, m - 1, d + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${moved.getFullYear()}-${pad(moved.getMonth() + 1)}-${pad(moved.getDate())}`;
}

function oneDecimal(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// Sleep is dated by the morning it ended, so the night before a flare on a
// given day is the sleep dated that same day.
export function sleepLine(flareDates: string[], nights: SleepNight[], words: ContextWords = FLARE_WORDS): string | null {
  const flareDays = new Set(flareDates);
  const before = nights.filter((night) => flareDays.has(night.date)).map((night) => night.hours);
  const others = nights.filter((night) => !flareDays.has(night.date)).map((night) => night.hours);
  if (before.length < MIN_FLARE_NIGHTS || others.length < MIN_OTHER_NIGHTS) return null;
  return `Sleep the night before a ${words.short} averaged ${oneDecimal(average(before))} hours across ${before.length} nights, against ${oneDecimal(average(others))} hours across ${others.length} other nights.`;
}

// A treatment started or stopped in the week before one or more flares.
export function treatmentLines(flareDates: string[], treatments: TreatmentDates[], words: ContextWords = FLARE_WORDS): string[] {
  const lines: string[] = [];
  const within = (changed: string) =>
    flareDates.filter((flare) => changed <= flare && changed >= addDays(flare, -TREATMENT_CHANGE_DAYS)).length;
  for (const treatment of treatments) {
    for (const [date, verb] of [
      [treatment.startDate?.slice(0, 10) ?? null, 'Started'],
      [treatment.endDate?.slice(0, 10) ?? null, 'Stopped'],
    ] as const) {
      if (!date) continue;
      const count = within(date);
      if (count === 0) continue;
      lines.push(
        `${verb} ${treatment.name} on ${date}, within a week before ${count === 1 ? `1 ${words.short}` : `${count} ${words.shortMany}`}.`,
      );
    }
  }
  return lines.sort();
}

export function unloggedLine(flares: number, flaresWithMeals: number, windowHours: number): string | null {
  const without = flares - flaresWithMeals;
  if (without <= 0) return null;
  return `${without} of the ${flares} had no meals logged in the ${windowHours} hours before, so what was eaten then is not known.`;
}

export const CONTEXT_CAVEAT =
  'These happened around the same flares as the foods above. The app cannot separate any of them from food, so none of them is shown as the explanation.';

export function contextCaveat(words: ContextWords = FLARE_WORDS): string {
  return `These happened around the same ${words.shortMany} as the foods above. The app cannot separate any of them from food, so none of them is shown as the explanation.`;
}

export function contextLines(input: {
  flareDates: string[];
  nights: SleepNight[];
  treatments: TreatmentDates[];
  flares: number;
  flaresWithMeals: number;
  windowHours: number;
  words?: ContextWords;
}): string[] {
  const lines: string[] = [];
  const unlogged = unloggedLine(input.flares, input.flaresWithMeals, input.windowHours);
  if (unlogged) lines.push(unlogged);
  const sleep = sleepLine(input.flareDates, input.nights, input.words);
  if (sleep) lines.push(sleep);
  lines.push(...treatmentLines(input.flareDates, input.treatments, input.words));
  return lines;
}
