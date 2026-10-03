// What each home screen widget says (L2 of the competitive build plan,
// rebuild R1, 2026-10-02). Seven widgets, each one line of the app put
// where the phone's home screen can show it: the next thing in the day,
// the next dose, Capture, the grocery list, today's fuel gauges, the step
// a routine is on, and one tap for a glass of water.
//
// A widget reads; it never decides anything the app does not already say
// on its own screens. Every widget opens the exact place its line comes
// from, so a tap is the way to the full record rather than a second copy
// of it. Glass is the one that writes, and it writes the same drink the
// one-tap button on Schedules > Hydration logs (lib/quickDrinks.ts).
//
// Hide health details on widgets (a switch in Profile, off by default,
// kept on this phone only): a home screen is seen by anybody who picks the
// phone up, so with the switch on a dose reads "A dose" and an appointment
// "An appointment", and the fuel gauges say only that they are hidden.
// Meals, the grocery list, routines and Capture are left as they are.
//
// Pure, with no imports, so scripts/test_widget_content.js runs it without
// a phone. lib/widgetData.ts gathers the rows and lib/widgets/ draws them.

export const WIDGET_NAMES = ['NextThing', 'NextDose', 'Capture', 'Grocery', 'FuelGauges', 'RoutineStep', 'Glass'] as const;
export type WidgetName = (typeof WIDGET_NAMES)[number];

export function isWidgetName(name: string): name is WidgetName {
  return (WIDGET_NAMES as readonly string[]).includes(name);
}

/** app_meta row for the switch. A widget sits on one phone's home screen,
 *  so the row stays on this device (DEVICE_LOCAL_META_KEYS). */
export const WIDGET_HIDE_HEALTH_META_KEY = 'widget_hide_health';

/** The click a widget sends to the task handler to log a glass. */
export const LOG_GLASS_ACTION = 'LOG_GLASS';

export const WIDGET_LINKS = {
  timeline: 'hashimotosapp://timeline',
  meds: 'hashimotosapp://schedule?openScheduleLens=meds',
  capture: 'hashimotosapp://capture',
  captureSpeak: 'hashimotosapp://capture?speak=1',
  grocery: 'hashimotosapp://life?openLifeLens=groceryList',
  fuel: 'hashimotosapp://insights?openInsightsLens=nutrients',
  routines: 'hashimotosapp://life?openLifeLens=routines',
  hydration: 'hashimotosapp://schedule?openScheduleLens=hydration',
} as const;

export function routineLink(routineId: string): string {
  return `hashimotosapp://routine?id=${encodeURIComponent(routineId)}`;
}

/** What every widget is drawn from: a heading, up to a few lines, and where a tap goes. */
export type WidgetContent = {
  heading: string;
  lines: string[];
  /** One quiet line under the rest, or null. */
  caption: string | null;
  uri: string;
};

// ------------------------------------------------------------------ time

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function localDayOf(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function tomorrowOf(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return localDayOf(new Date(y, m - 1, d + 1).getTime());
}

export function widgetClock(ms: number): string {
  const date = new Date(ms);
  const hour = date.getHours();
  const shown = hour % 12 === 0 ? 12 : hour % 12;
  return `${shown}:${pad(date.getMinutes())} ${hour < 12 ? 'AM' : 'PM'}`;
}

function minutesInWords(minutes: number): string {
  const whole = Math.max(1, Math.round(minutes));
  if (whole < 60) return whole === 1 ? '1 minute' : `${whole} minutes`;
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  const h = hours === 1 ? '1 hour' : `${hours} hours`;
  return rest === 0 ? h : `${h} ${rest} min`;
}

/** "in 25 minutes, at 8:00 AM", "at 6:30 PM", or "tomorrow at 7:00 AM". */
export function whenWords(start: number, now: number): string {
  const today = localDayOf(now);
  const day = localDayOf(start);
  const minutes = (start - now) / 60000;
  if (day === today && minutes <= 180) return `in ${minutesInWords(minutes)}, at ${widgetClock(start)}`;
  if (day === today) return `at ${widgetClock(start)}`;
  return `tomorrow at ${widgetClock(start)}`;
}

// ------------------------------------------------------------------ inputs

/** One row of the day timeline (lib/dayTimeline.ts), the parts a widget reads. */
export type WidgetTimelineItem = {
  kind: string;
  title: string;
  start: number;
  allDay: boolean;
  day: string;
  status: string;
};

const HEALTH_KINDS: Record<string, string> = {
  dose: 'A dose',
  appointment: 'An appointment',
};

function shownTitle(item: WidgetTimelineItem, hideHealth: boolean): string {
  if (hideHealth && HEALTH_KINDS[item.kind]) return HEALTH_KINDS[item.kind];
  return item.title;
}

function nextPlanned(items: WidgetTimelineItem[], now: number, kinds: string[] | null): WidgetTimelineItem | null {
  const today = localDayOf(now);
  const tomorrow = tomorrowOf(today);
  const found = items
    .filter(
      (item) =>
        !item.allDay &&
        item.status === 'planned' &&
        item.start > now &&
        (item.day === today || item.day === tomorrow) &&
        (kinds === null || kinds.includes(item.kind)),
    )
    .sort((a, b) => a.start - b.start);
  return found[0] ?? null;
}

// ------------------------------------------------------------------ the widgets

/** Kinds that are records rather than things waiting, never "next". */
const NOT_NEXT = ['checkin', 'flare', 'sleep', 'steps'];

export function nextThingContent(items: WidgetTimelineItem[], now: number, hideHealth: boolean): WidgetContent {
  const candidates = items.filter((item) => !NOT_NEXT.includes(item.kind));
  const next = nextPlanned(candidates, now, null);
  const today = localDayOf(now);
  const overdue = candidates.filter(
    (item) => item.day === today && item.status === 'overdue' && !item.allDay,
  ).length;
  const caption =
    overdue === 0 ? null : overdue === 1 ? '1 earlier thing today is not marked yet.' : `${overdue} earlier things today are not marked yet.`;
  if (!next) {
    return { heading: 'Next', lines: ['Nothing else is planned for today or tomorrow.'], caption, uri: WIDGET_LINKS.timeline };
  }
  return {
    heading: 'Next',
    lines: [shownTitle(next, hideHealth), whenWords(next.start, now)],
    caption,
    uri: WIDGET_LINKS.timeline,
  };
}

export function nextDoseContent(items: WidgetTimelineItem[], now: number, hideHealth: boolean): WidgetContent {
  const doses = items.filter((item) => item.kind === 'dose');
  const next = nextPlanned(doses, now, ['dose']);
  const today = localDayOf(now);
  const unmarked = doses.filter((item) => item.day === today && item.status === 'overdue').length;
  const caption =
    unmarked === 0 ? null : unmarked === 1 ? '1 earlier dose today is not marked yet.' : `${unmarked} earlier doses today are not marked yet.`;
  if (!next) {
    return { heading: 'Next dose', lines: ['No dose is scheduled for the rest of today or tomorrow.'], caption, uri: WIDGET_LINKS.meds };
  }
  return {
    heading: 'Next dose',
    lines: [shownTitle(next, hideHealth), whenWords(next.start, now)],
    caption,
    uri: WIDGET_LINKS.meds,
  };
}

export function captureContent(): WidgetContent {
  return { heading: 'Capture', lines: ['Anything on your mind'], caption: null, uri: WIDGET_LINKS.capture };
}

export const GROCERY_WIDGET_LINES = 6;

export function groceryContent(
  list: { name: string; stillToGet: string[]; total: number } | null,
): WidgetContent {
  if (!list) {
    return { heading: 'Grocery list', lines: ['No list in progress.'], caption: null, uri: WIDGET_LINKS.grocery };
  }
  if (list.stillToGet.length === 0) {
    return {
      heading: list.name || 'Grocery list',
      lines: [list.total === 0 ? 'Nothing on the list yet.' : 'Everything on the list is ticked.'],
      caption: null,
      uri: WIDGET_LINKS.grocery,
    };
  }
  const shown = list.stillToGet.slice(0, GROCERY_WIDGET_LINES);
  const more = list.stillToGet.length - shown.length;
  return {
    heading: list.name || 'Grocery list',
    lines: shown,
    caption: more > 0 ? `and ${more} more still to get` : `${list.stillToGet.length} of ${list.total} still to get`,
    uri: WIDGET_LINKS.grocery,
  };
}

/** One gauge, as Home's Today's Fuel Gauges hold it (lib/nutrientAnalysis.ts). */
export type WidgetGauge = {
  displayName: string;
  unit: string;
  fromFood: number;
  fromSupplements: number;
  target: number;
};

export const FUEL_WIDGET_LINES = 4;

function amount(value: number): string {
  if (value >= 100) return String(Math.round(value));
  if (value >= 10) return String(Math.round(value));
  return String(Math.round(value * 10) / 10);
}

/**
 * "Iron: 8 of 18 mg, all from food" or "Vitamin D: 20 of 15 mcg, 5 from food
 * and 15 from supplements". Food first, and it always says which source a
 * figure came from (the food-first rule). An amount and a target, never a
 * word about whether that is enough.
 */
export function gaugeLine(gauge: WidgetGauge): string {
  const total = gauge.fromFood + gauge.fromSupplements;
  const head = `${gauge.displayName}: ${amount(total)} of ${amount(gauge.target)} ${gauge.unit}`;
  if (total === 0) return `${head}, nothing logged yet`;
  if (gauge.fromSupplements === 0) return `${head}, all from food`;
  if (gauge.fromFood === 0) return `${head}, all from supplements`;
  return `${head}, ${amount(gauge.fromFood)} from food and ${amount(gauge.fromSupplements)} from supplements`;
}

export function fuelContent(gauges: WidgetGauge[], hideHealth: boolean): WidgetContent {
  if (hideHealth) {
    return {
      heading: 'Fuel gauges',
      lines: ['Hidden on widgets. Tap to open the app.'],
      caption: null,
      uri: WIDGET_LINKS.fuel,
    };
  }
  if (gauges.length === 0) {
    return { heading: 'Fuel gauges', lines: ['No gauges are chosen on Home.'], caption: null, uri: WIDGET_LINKS.fuel };
  }
  const shown = gauges.slice(0, FUEL_WIDGET_LINES);
  const more = gauges.length - shown.length;
  return {
    heading: 'Fuel gauges today',
    lines: shown.map(gaugeLine),
    caption: more > 0 ? `and ${more} more on Home` : null,
    uri: WIDGET_LINKS.fuel,
  };
}

/** A walk through a routine that was started and not finished. */
export type WidgetRoutineRun = {
  routineId: string;
  routineName: string;
  startedAt: number;
  stepsTotal: number;
  /** Zero-based position of the step it stopped on. */
  position: number | null;
  step: string | null;
};

/** A walk left longer than this is history rather than a step somebody is on. */
export const ROUTINE_RUN_FRESH_HOURS = 12;

export function routineStepContent(run: WidgetRoutineRun | null, now: number): WidgetContent {
  if (!run || now - run.startedAt > ROUTINE_RUN_FRESH_HOURS * 3600000 || run.step === null) {
    return { heading: 'Routine', lines: ['No routine in progress.'], caption: 'Tap to pick one to start.', uri: WIDGET_LINKS.routines };
  }
  const position = (run.position ?? 0) + 1;
  return {
    heading: run.routineName,
    lines: [run.step],
    caption: `Step ${position} of ${run.stepsTotal}`,
    uri: routineLink(run.routineId),
  };
}

export function glassContent(lastGlassAt: number | null, now: number, failed: string | null = null): WidgetContent {
  let caption: string;
  if (failed) caption = failed;
  else if (lastGlassAt !== null && localDayOf(lastGlassAt) === localDayOf(now)) caption = `Last one logged at ${widgetClock(lastGlassAt)}`;
  else caption = 'Tap to log one now';
  return { heading: 'Glass of water', lines: ['250 ml'], caption, uri: WIDGET_LINKS.hydration };
}
