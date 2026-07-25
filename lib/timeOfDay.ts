// Small, shared 12-hour <-> 24-hour "HH:mm" helpers -- used anywhere a
// person enters a time via separate hour/minute/AM-PM fields (Schedule's
// time picker, Profile's usual-meal-times and eating-window fields) and it
// needs to be stored as a plain, zero-padded 24h "HH:mm" string so it can
// be compared/sorted lexicographically (see isWithinEatingWindow in
// lib/db.ts, which relies on that).

export type TimeOfDayInput = { hour: string; minute: string; ampm: 'AM' | 'PM' | '' };

// Builds a zero-padded 24h "HH:mm" from a 12-hour hour/minute/AM-PM
// answer, or null if the answer isn't complete/valid yet.
export function buildTime24(hour: string, minute: string, ampm: 'AM' | 'PM' | ''): string | null {
  const parsedHour = Number(hour);
  const parsedMinute = minute === '' ? 0 : Number(minute);
  if (
    !hour ||
    !ampm ||
    !Number.isFinite(parsedHour) ||
    parsedHour < 1 ||
    parsedHour > 12 ||
    !Number.isFinite(parsedMinute) ||
    parsedMinute < 0 ||
    parsedMinute > 59
  ) {
    return null;
  }

  let hour24 = parsedHour % 12;
  if (ampm === 'PM') hour24 += 12;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hour24)}:${pad(parsedMinute)}`;
}

// The inverse of buildTime24 -- splits a stored 24h "HH:mm" back into the
// 12-hour hour/minute/AM-PM an edit form uses. Returns a blank buffer for
// null/unset.
export function splitTime24(value: string | null): TimeOfDayInput {
  if (!value) return { hour: '', minute: '', ampm: '' };
  const [hourStr, minuteStr] = value.split(':');
  const hour24 = Number(hourStr) || 0;
  const ampm: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour: String(hour12), minute: minuteStr ?? '00', ampm };
}

// "8:00 AM" for display from a stored 24h "HH:mm".
export function formatTime12(value: string): string {
  const [hourStr, minuteStr] = value.split(':');
  const hour24 = Number(hourStr);
  if (!Number.isFinite(hour24)) return value;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minuteStr ?? '00'} ${ampm}`;
}
