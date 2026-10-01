// This month in the garden (I12, 1.0.55.26). Once a month, on the day and
// at the time the person picks, what the sowing calendar (I5,
// lib/sowingWindows.ts) has open or opening over the next 30 days, one line
// for each kind of work, counted from the frost dates My Zone works out for
// the saved place (I4). Beside it, the full and new moons and any solstice
// or equinox in the same days, since the Sowing Calendar lens keeps those
// timings too. Pure: no I/O, so scripts/test_garden_month_notice.js can
// check it.
//
// A notification is written when the reminders are reconciled, not when it
// fires. The windows depend only on the date and the frost dates, which
// change only when the place does, so the list stays right however long it
// waits; the last line names the place it was worked out for.
//
// Since 2026-10-01 it names only the crops chosen in My Crops (lib/cropPlan.ts),
// and the reconcile sends nothing at all when none are chosen. Direct report:
// "I have a notification about planting certain things right now, but I never
// asked it to notify me about that because I don't have any crops built into
// the app for me to follow." `chosen` null still means every crop, which is
// what the test reads the calendar's shape with.
//
// Nothing here says a crop has to go in. A window is where a crop usually
// does well, and the body says what is open, never what to do.

import { findCropGuideByKey } from './cropGuides';
import { dateLabel, localDate, moonPhasesBetween, seasonMarkers } from './moonSky';
import {
  actionLabel,
  addDaysToDate,
  SOWING_WINDOWS,
  windowsNear,
  type FrostAnchor,
  type SowingAction,
} from './sowingWindows';

export const GARDEN_MONTH_NOTIFICATION_TITLE = 'This month in the garden';

/** How far ahead one month's notice looks. */
export const GARDEN_MONTH_DAYS = 30;

/** How many crops a line names before counting the rest. */
export const NAMES_PER_LINE = 6;

const ACTION_ORDER: SowingAction[] = ['indoors', 'direct', 'plantOut', 'autumn', 'frostFree'];

/** What the reconcile could learn about the place, mirroring the frost
 *  dates result without importing the module that fetches it. */
export type GardenMonthPlace =
  | { status: 'no-location' }
  | { status: 'unread' }
  | { status: 'ready'; anchor: FrostAnchor | null; placeLabel: string | null; southern: boolean };

export type GardenMonthLine = { label: string; crops: string[] };

function cropName(key: string): string {
  return findCropGuideByKey(key)?.name ?? key;
}

/** The crops open or opening between `today` and `GARDEN_MONTH_DAYS` on,
 *  one line per kind of work, in the order the work is done. A crop named
 *  under a special label (seed potatoes, garlic cloves) keeps that label,
 *  so a line is one label rather than one action. */
export function gardenMonthLines(anchor: FrostAnchor, today: string, chosen: ReadonlySet<string> | null = null): GardenMonthLine[] {
  const groups = new Map<string, { order: number; crops: string[] }>();
  for (const w of SOWING_WINDOWS) {
    if (chosen && !chosen.has(w.key)) continue;
    for (const d of windowsNear(w, anchor, today, GARDEN_MONTH_DAYS)) {
      const label = actionLabel(w, d.action);
      const group = groups.get(label) ?? { order: ACTION_ORDER.indexOf(d.action), crops: [] };
      const name = cropName(w.key);
      if (!group.crops.includes(name)) group.crops.push(name);
      groups.set(label, group);
    }
  }
  return [...groups.entries()]
    .sort((a, b) => a[1].order - b[1].order || a[0].localeCompare(b[0]))
    .map(([label, g]) => ({ label, crops: [...g.crops].sort((a, b) => a.localeCompare(b)) }));
}

function lineText(line: GardenMonthLine): string {
  const shown = line.crops.slice(0, NAMES_PER_LINE);
  const rest = line.crops.length - shown.length;
  return `${line.label}: ${shown.join(', ')}${rest > 0 ? `, with ${rest} more on the calendar` : ''}.`;
}

/** Full and new moons, and any solstice or equinox, in the same 30 days. */
export function skyLine(fireAt: Date, southern: boolean | null): string | null {
  const from = fireAt.getTime();
  const until = new Date(fireAt.getFullYear(), fireAt.getMonth(), fireAt.getDate() + GARDEN_MONTH_DAYS).getTime();
  const parts: { at: number; text: string }[] = [];
  for (const e of moonPhasesBetween(from, until)) {
    if (e.phase === 'full') parts.push({ at: e.at, text: `full moon ${dateLabel(localDate(e.at))}` });
    if (e.phase === 'new') parts.push({ at: e.at, text: `new moon ${dateLabel(localDate(e.at))}` });
  }
  for (const year of [fireAt.getFullYear(), fireAt.getFullYear() + 1]) {
    for (const m of seasonMarkers(year, southern ?? false)) {
      if (m.at >= from && m.at < until) parts.push({ at: m.at, text: `${m.name} ${dateLabel(localDate(m.at))}` });
    }
  }
  if (parts.length === 0) return null;
  const text = parts.sort((a, b) => a.at - b.at).map((p) => p.text).join(', ');
  return `In the sky: ${text}.`;
}

export function buildGardenMonthBody(place: GardenMonthPlace, fireAt: Date, chosen: ReadonlySet<string> | null = null): string {
  const today = localDate(fireAt.getTime());
  const until = addDaysToDate(today, GARDEN_MONTH_DAYS - 1);
  const lines: string[] = [];
  const southern = place.status === 'ready' ? place.southern : null;

  if (place.status === 'no-location') {
    lines.push('Save a place in Garden > My Zone and this will name what the sowing calendar has open each month.');
  } else if (place.status === 'unread') {
    lines.push('The frost dates for the place in My Zone have not been worked out yet. Opening Garden > Sowing Calendar works them out, and next month this will name crops.');
  } else if (place.anchor === null) {
    lines.push('The weather history for this place had too few days to work out its frost dates, so there are no windows to name.');
  } else {
    const found = gardenMonthLines(place.anchor, today, chosen);
    if (found.length === 0) {
      lines.push(
        chosen
          ? `Nothing in My Crops opens between ${dateLabel(today)} and ${dateLabel(until)}.`
          : `Nothing on the sowing calendar opens between ${dateLabel(today)} and ${dateLabel(until)}.`,
      );
    } else {
      lines.push(`Open or opening ${dateLabel(today)} to ${dateLabel(until)}:`);
      for (const line of found) lines.push(lineText(line));
    }
  }

  const sky = skyLine(fireAt, southern);
  if (sky) lines.push(sky);
  if (place.status === 'ready' && place.anchor !== null && place.placeLabel) {
    lines.push(`Worked out from the frost dates for ${place.placeLabel}.`);
  }
  return lines.join('\n');
}

function isValidMonthDay(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 28;
}

/** The next moment on or after `now` that falls on `monthDay` at `time`
 *  ('HH:mm'), within `withinDays`, or null. Days 29 to 31 are not offered,
 *  since not every month has them. */
export function nextGardenMonthFire(monthDay: number, time: string, now: Date, withinDays: number): Date | null {
  if (!isValidMonthDay(monthDay)) return null;
  const [h, m] = time.split(':').map(Number);
  for (let i = 0; i <= withinDays; i++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m, 0, 0);
    if (at.getDate() === monthDay && at.getTime() > now.getTime()) return at;
  }
  return null;
}
