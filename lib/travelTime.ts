// Travel and dose times (A7). Every dose time in schedule_items is a
// wall-clock string with no zone ('YYYY-MM-DDTHH:MM'), which is what "shift
// to local" means: 7:00 AM rings at 7:00 AM wherever the phone is. A med set
// to keep home time instead reads that string on the home zone's clock, so
// the reminder rings at the same moment it would have rung at home.
//
// Pure, no React and no database, so scripts/test_travel_time.js can check
// it on a PC. Zone arithmetic goes through Intl; where the engine cannot do
// it every function answers null and the reminder stays on the local clock,
// which is what the app did before A7.

export type TravelMode = 'local' | 'home';

export const TRAVEL_MODES: { mode: TravelMode; label: string; detail: string }[] = [
  {
    mode: 'local',
    label: 'Move to local time',
    detail: 'The reminder rings at the same clock time wherever you are.',
  },
  {
    mode: 'home',
    label: 'Keep home time',
    detail: 'The reminder rings at the moment it would ring at home, whatever the clock says where you are.',
  },
];

export const TRAVEL_LEAD =
  'Which of these suits a med across time zones is a question for your prescriber. This only moves when the reminder rings; it never changes a dose.';

export function parseTravelMode(value: string | null | undefined): TravelMode {
  return value === 'home' ? 'home' : 'local';
}

// The zone the phone is set to right now, or null where the engine cannot say.
export function currentZone(): string | null {
  try {
    const zone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof zone === 'string' && zone ? zone : null;
  } catch {
    return null;
  }
}

// "America/Mexico_City" reads as "Mexico City", "Etc/GMT+5" and "UTC" as
// themselves.
export function zoneName(zone: string): string {
  if (!zone.includes('/') || zone.startsWith('Etc/')) return zone.replace(/^Etc\//, '');
  const last = zone.split('/').pop() ?? zone;
  return last.replace(/_/g, ' ');
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(zone: string): Intl.DateTimeFormat | null {
  const cached = formatters.get(zone);
  if (cached) return cached;
  try {
    const made = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    formatters.set(zone, made);
    return made;
  } catch {
    return null;
  }
}

// The zone's wall clock at an instant, read from "MM/DD/YYYY, HH:MM", the
// shape en-US gives with every engine this app runs on.
function wallParts(ms: number, zone: string): number[] | null {
  const formatter = formatterFor(zone);
  if (!formatter) return null;
  try {
    const match = /(\d{2})\/(\d{2})\/(\d{4}),?\s+(\d{2}):(\d{2})/.exec(formatter.format(new Date(ms)));
    if (!match) return null;
    const [, month, day, year, hour, minute] = match.map(Number);
    return [year, month, day, hour === 24 ? 0 : hour, minute];
  } catch {
    return null;
  }
}

// Minutes the zone is ahead of UTC at an instant (Mexico City in winter is -360).
export function zoneOffsetMinutes(ms: number, zone: string): number | null {
  const parts = wallParts(ms, zone);
  if (!parts) return null;
  const [year, month, day, hour, minute] = parts;
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const floored = Math.floor(ms / 60_000) * 60_000;
  return Math.round((asUtc - floored) / 60_000);
}

function parseWall(wall: string): number[] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(wall);
  return match ? match.slice(1).map(Number) : null;
}

// The instant a wall-clock time falls at in a zone. Across a clock change a
// time that happens twice takes the first, and one that never happens moves
// on by the size of the change, the way a phone's alarm does.
export function instantInZone(wall: string, zone: string): number | null {
  const parts = parseWall(wall);
  if (!parts) return null;
  const [year, month, day, hour, minute] = parts;
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = zoneOffsetMinutes(guess, zone);
  if (first === null) return null;
  let ms = guess - first * 60_000;
  const second = zoneOffsetMinutes(ms, zone);
  if (second === null) return null;
  if (second !== first) {
    const retry = guess - second * 60_000;
    const third = zoneOffsetMinutes(retry, zone);
    ms = third === second ? retry : Math.min(ms, retry);
  }
  return ms;
}

const pad = (n: number) => String(n).padStart(2, '0');

// The wall clock in a zone at an instant, as 'YYYY-MM-DDTHH:MM'.
export function wallInZone(ms: number, zone: string): string | null {
  const parts = wallParts(ms, zone);
  if (!parts) return null;
  const [year, month, day, hour, minute] = parts;
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

// Away means the home clock and this one read differently right now. Two
// zone names that keep the same time (Monterrey and Mexico City) are not away.
export function isAway(homeZone: string | null, here: string | null, nowMs: number): boolean {
  if (!homeZone || !here || homeZone === here) return false;
  const home = zoneOffsetMinutes(nowMs, homeZone);
  const local = zoneOffsetMinutes(nowMs, here);
  return home !== null && local !== null && home !== local;
}

// A dose time set to keep home time, read on the clock where the phone is.
// Null when nothing moves: the med is on local time, the person is home, or
// the engine cannot work the zones out.
export function homeDoseHere(
  wall: string,
  mode: TravelMode,
  homeZone: string | null,
  here: string | null,
  nowMs: number,
): string | null {
  if (mode !== 'home' || !homeZone || !here || !isAway(homeZone, here, nowMs)) return null;
  const instant = instantInZone(wall, homeZone);
  if (instant === null) return null;
  const moved = wallInZone(instant, here);
  return moved && moved !== wall.slice(0, 16) ? moved : null;
}

function clock(wall: string): string {
  const [hour, minute] = wall.slice(11, 16).split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${pad(minute)} ${suffix}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// " · 3:00 PM here" under a dose kept on home time, with the day named when
// the move crosses midnight.
export function hereCaption(homeWall: string, hereWall: string): string {
  const sameDay = homeWall.slice(0, 10) === hereWall.slice(0, 10);
  const day = sameDay ? '' : `${Number(hereWall.slice(8, 10))} ${MONTHS[Number(hereWall.slice(5, 7)) - 1]}, `;
  return ` · ${day}${clock(hereWall)} here`;
}

// The line under a reminder: "7:00 AM home time (Mexico City)".
export function homeTimeWords(homeWall: string, homeZone: string): string {
  return `${clock(homeWall)} home time (${zoneName(homeZone)})`;
}

export function awayLine(homeZone: string, here: string, homeCount: number): string {
  const lead = `You are on ${zoneName(here)} time, and home is ${zoneName(homeZone)}.`;
  if (homeCount === 0) return `${lead} Every med here moves to local time, so each reminder rings at its usual clock time.`;
  const meds = homeCount === 1 ? '1 med keeps' : `${homeCount} meds keep`;
  return `${lead} ${meds} home time; its dose rows say when that is here.`;
}

export function modeLine(mode: TravelMode, homeZone: string | null): string {
  if (mode === 'home') {
    return homeZone
      ? `Keeps home time: while you are away, the reminder rings when it is due on ${zoneName(homeZone)} time.`
      : 'Keeps home time.';
  }
  return 'Moves to local time: the reminder rings at the same clock time wherever you are.';
}
