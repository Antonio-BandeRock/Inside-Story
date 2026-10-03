// Your Life in Squares (decided 2026-10-01, built 2026-10-02): every record
// the app keeps, on one timeline a person zooms through. Year, Month, Week,
// Day and Hour are the levels, and each square carries the colour of the tab
// the record lives on with the icon of its lens on top, so a stack shows
// which parts of life were recorded and never how much or how well.
//
// Loading follows the owner's direction of 2026-10-02: "The scroll left/right
// should access just what is necessary such as a placeholder for something
// instead of the thing, and once the placeholder is selected then the
// drilldown begins, that way it isn't the entire shelf of data being accessed
// all at one time." So each level reads only the period on screen: a year
// reads which parts of life appear in each of its months, a month which
// appear on each of its days, and only a week, a day or an hour reads the
// records themselves. The periods either side are placeholders until they
// are swiped to.
//
// Squares are at least SQUARE_MIN points across, so the lens icon fits on
// the colour and the square can be tapped ("they will need to be a little
// bigger to contain the icon on top of the color of the tab it represents
// for it to be tappable").
//
// A record with a date and no time goes in a "that day" row, never at an
// invented time. Nothing after now is drawn: a plan is not a record.
// Read only; a tap on a record opens the place it is kept.
//
// Pure, with no imports, so scripts/test_life_squares.js runs it without a
// phone. lib/lifeSquaresDb.ts reads the rows, components/LifeInSquares.tsx
// draws them.

export const SQUARE_MIN = 44;

export type SquareTab = 'food' | 'schedule' | 'log' | 'insights' | 'life' | 'garden';

/** The order parts of life are listed in, which is the tab order. */
export const SQUARE_TAB_ORDER: SquareTab[] = ['food', 'schedule', 'log', 'insights', 'life', 'garden'];

export const SQUARE_TAB_PATH: Record<SquareTab, string> = {
  food: '/food',
  schedule: '/schedule',
  log: '/log',
  insights: '/insights',
  life: '/life',
  garden: '/garden',
};

export const SQUARE_TAB_NAME: Record<SquareTab, string> = {
  food: 'Food',
  schedule: 'Schedules',
  log: 'Signals',
  insights: 'Insights',
  life: 'Life',
  garden: 'Garden',
};

const LENS_PARAM: Record<SquareTab, string> = {
  food: 'openFoodLens',
  schedule: 'openScheduleLens',
  log: 'openSignalsLens',
  insights: 'openInsightsLens',
  life: 'openLifeLens',
  garden: 'openGardenLens',
};

export type SquareSource = {
  key: string;
  /** What one record of this kind is called, for a screen reader. */
  label: string;
  tab: SquareTab;
  lens: string;
  lensLabel: string;
  /** The lens's hub icon, an Ionicons name. */
  icon: string;
  table: string;
  /** The column holding when it happened. A plain date, a local
   *  'YYYY-MM-DDTHH:mm', an ISO UTC stamp and SQLite's datetime('now') are
   *  all read correctly by placeStamp. */
  column: string;
  where?: string;
  /** An SQL expression for the line shown at the Hour level. */
  title: string;
};

// Every kind of record with a moment of its own. Rows that describe
// something rather than record it happening (a recipe, a planted bed's
// details, a bill rule) are left out, and so are rows another kind already
// stands for: a workout writes an exercise_logs row, so workout_sessions
// would draw it twice, and every answer to a to-do writes a todo_doings
// row, one-offs included, so todos itself is not read.
export const SQUARE_SOURCES: SquareSource[] = [
  { key: 'meal', label: 'Meal', tab: 'schedule', lens: 'meals', lensLabel: 'Meals', icon: 'restaurant-outline', table: 'meals', column: 'eaten_at', where: "meal_type <> 'beverage'", title: "COALESCE(NULLIF(name, ''), 'A meal')" },
  { key: 'drink', label: 'Drink', tab: 'schedule', lens: 'hydration', lensLabel: 'Hydration', icon: 'water-outline', table: 'meals', column: 'eaten_at', where: "meal_type = 'beverage'", title: "COALESCE(NULLIF(name, ''), 'A drink')" },
  { key: 'dose', label: 'Dose taken', tab: 'schedule', lens: 'meds', lensLabel: 'Meds', icon: 'flask-outline', table: 'schedule_items', column: 'scheduled_for', where: "item_type IN ('prescription', 'supplement') AND status = 'logged'", title: 'title' },
  { key: 'appointment', label: 'Appointment', tab: 'schedule', lens: 'appointments', lensLabel: 'Appointments', icon: 'calendar-outline', table: 'schedule_items', column: 'scheduled_for', where: "item_type = 'appointment' AND status NOT IN ('skipped', 'cancelled')", title: 'title' },
  { key: 'flare', label: 'Flare', tab: 'log', lens: 'flares', lensLabel: 'Flares', icon: 'pulse-outline', table: 'wellbeing_checkins', column: 'logged_at', where: "checkin_type = 'flare'", title: "'A flare'" },
  { key: 'reaction', label: 'After a meal', tab: 'log', lens: 'foodReactions', lensLabel: 'Food Reactions', icon: 'warning-outline', table: 'wellbeing_checkins', column: 'logged_at', where: "checkin_type = 'post_meal'", title: "CASE WHEN food_name IS NOT NULL AND food_name <> '' THEN 'After ' || food_name ELSE 'After a meal' END" },
  { key: 'trialDay', label: 'Food test day', tab: 'log', lens: 'newFoods', lensLabel: 'New Foods & Experiments', icon: 'add-circle-outline', table: 'wellbeing_checkins', column: 'logged_at', where: "checkin_type = 'food_trial_daily'", title: "COALESCE(NULLIF(food_name, ''), 'A food test day')" },
  { key: 'checkin', label: 'Check-in', tab: 'log', lens: 'generalNote', lensLabel: 'General Note', icon: 'document-text-outline', table: 'wellbeing_checkins', column: 'logged_at', where: "checkin_type IN ('general', 'stress', 'sleep', 'post_exercise')", title: "CASE checkin_type WHEN 'stress' THEN 'Stress check-in' WHEN 'sleep' THEN 'Sleep check-in' WHEN 'post_exercise' THEN 'After exercise' ELSE 'A note' END" },
  { key: 'foodTrial', label: 'Food test started', tab: 'log', lens: 'newFoods', lensLabel: 'New Foods & Experiments', icon: 'add-circle-outline', table: 'food_trials', column: 'started_at', title: "'Started testing ' || COALESCE(NULLIF(food_name, ''), 'a food')" },
  { key: 'exercise', label: 'Exercise', tab: 'log', lens: 'exercise', lensLabel: 'Exercise', icon: 'walk-outline', table: 'exercise_logs', column: 'logged_at', title: "COALESCE(NULLIF(exercise_type, ''), 'Exercise')" },
  { key: 'bloodPressure', label: 'Blood pressure', tab: 'log', lens: 'bloodPressure', lensLabel: 'Blood Pressure', icon: 'heart-outline', table: 'body_measurements', column: 'logged_at', where: "measurement_type = 'blood_pressure_systolic'", title: "'Blood pressure'" },
  { key: 'therapy', label: 'Hands-on therapy', tab: 'log', lens: 'therapies', lensLabel: 'Hands-On Therapies', icon: 'hand-left-outline', table: 'therapy_sessions', column: 'performed_at', title: "COALESCE(NULLIF(therapy_type, ''), 'A session')" },
  { key: 'night', label: 'Night', tab: 'log', lens: 'nocturia', lensLabel: 'Nocturia', icon: 'moon-outline', table: 'nocturia_nights', column: 'night_of', title: "'A night'" },
  { key: 'bowel', label: 'Bowel movement', tab: 'log', lens: 'bowel', lensLabel: 'Bowel Movements', icon: 'ellipse-outline', table: 'bowel_movements', column: 'occurred_at', title: "'Bowel movement'" },
  { key: 'microbiome', label: 'Microbiome sample', tab: 'log', lens: 'microbiome', lensLabel: 'Microbiome Tests', icon: 'flask-outline', table: 'microbiome_tests', column: 'sampled_on', title: "COALESCE(NULLIF(provider, ''), 'A microbiome sample')" },
  { key: 'cycle', label: 'Cycle day', tab: 'log', lens: 'cycle', lensLabel: 'Cycle', icon: 'water-outline', table: 'cycle_days', column: 'day', title: "'Cycle day'" },
  { key: 'tracker', label: 'Tracker entry', tab: 'log', lens: 'trackers', lensLabel: 'My Trackers', icon: 'options-outline', table: 'custom_tracker_entries', column: 'logged_at', title: "COALESCE((SELECT name FROM custom_trackers WHERE custom_trackers.id = custom_tracker_entries.tracker_id), 'A tracker')" },
  { key: 'lab', label: 'Lab result', tab: 'insights', lens: 'labs', lensLabel: 'Labs', icon: 'flask-outline', table: 'lab_results', column: 'tested_at', title: "COALESCE(NULLIF(test_code, ''), 'A lab result')" },
  { key: 'body', label: 'Body measurement', tab: 'life', lens: 'movement', lensLabel: 'Movement', icon: 'walk-outline', table: 'body_measurements', column: 'logged_at', where: "measurement_type NOT LIKE 'blood_pressure%'", title: "upper(substr(measurement_type, 1, 1)) || replace(substr(measurement_type, 2), '_', ' ')" },
  { key: 'didIt', label: 'Marked done', tab: 'life', lens: 'didIDoIt', lensLabel: 'Did I Do It', icon: 'checkmark-done-outline', table: 'done_check_marks', column: 'marked_at', title: "COALESCE((SELECT name FROM done_checks WHERE done_checks.id = done_check_marks.check_id), 'Marked done')" },
  { key: 'routine', label: 'Routine finished', tab: 'life', lens: 'routines', lensLabel: 'Routines', icon: 'footsteps-outline', table: 'routine_runs', column: 'completed_at', where: 'completed_at IS NOT NULL', title: "COALESCE(NULLIF(routine_name, ''), 'A routine')" },
  { key: 'upkeep', label: 'Upkeep done', tab: 'life', lens: 'upkeep', lensLabel: 'Upkeep', icon: 'construct-outline', table: 'upkeep_doings', column: 'done_on', title: "COALESCE(NULLIF(item_name, ''), 'Upkeep')" },
  { key: 'todo', label: 'To-do done', tab: 'life', lens: 'todos', lensLabel: 'To-Do', icon: 'checkbox-outline', table: 'todo_doings', column: 'done_at', where: "done_at IS NOT NULL AND kind = 'done'", title: "COALESCE((SELECT title FROM todos WHERE todos.id = todo_doings.todo_id), 'A to-do')" },
  { key: 'money', label: 'Money in or out', tab: 'life', lens: 'finances', lensLabel: 'Finances', icon: 'wallet-outline', table: 'finance_entries', column: 'occurred_on', title: "COALESCE(NULLIF(description, ''), NULLIF(category, ''), 'An entry')" },
  { key: 'work', label: 'Work check-in', tab: 'life', lens: 'work', lensLabel: 'Work', icon: 'briefcase-outline', table: 'work_checkins', column: 'week_of', title: "'Work check-in'" },
  { key: 'harvest', label: 'Harvest', tab: 'garden', lens: 'harvestLog', lensLabel: 'Harvest Log', icon: 'basket-outline', table: 'garden_harvests', column: 'harvested_at', title: "COALESCE(NULLIF(food_name, ''), 'A harvest')" },
  { key: 'planted', label: 'Planted', tab: 'garden', lens: 'plotsAndPlantings', lensLabel: 'Plots & Plantings', icon: 'flower-outline', table: 'garden_plantings', column: 'planted_at', title: "'Planted ' || COALESCE(NULLIF(food_name, ''), 'something')" },
  { key: 'plantingEvent', label: 'Garden note', tab: 'garden', lens: 'plotsAndPlantings', lensLabel: 'Plots & Plantings', icon: 'flower-outline', table: 'garden_planting_events', column: 'occurred_on', title: "COALESCE(NULLIF(note, ''), NULLIF(kind, ''), 'A planting note')" },
  { key: 'compost', label: 'Compost', tab: 'garden', lens: 'compost', lensLabel: 'Compost', icon: 'layers-outline', table: 'compost_events', column: 'occurred_on', title: "COALESCE(NULLIF(material, ''), NULLIF(kind, ''), 'Compost')" },
  { key: 'reading', label: 'Growing reading', tab: 'garden', lens: 'growingConditions', lensLabel: 'Growing Conditions', icon: 'thermometer-outline', table: 'garden_readings', column: 'measured_on', where: "source = 'hand'", title: "COALESCE(NULLIF(measurement, ''), 'A reading')" },
  { key: 'seedTest', label: 'Seed test', tab: 'garden', lens: 'seeds', lensLabel: 'Seeds', icon: 'albums-outline', table: 'garden_seed_tests', column: 'tested_on', title: "'Seed test'" },
  { key: 'ferment', label: 'Ferment started', tab: 'food', lens: 'fermentationBuilder', lensLabel: 'Fermentation', icon: 'flask-outline', table: 'fermentation_batches', column: 'started_at', title: "COALESCE((SELECT name FROM fermentations WHERE fermentations.id = fermentation_batches.fermentation_id), 'A ferment')" },
  { key: 'scan', label: 'Product scanned', tab: 'food', lens: 'scanProduct', lensLabel: 'Scan a Product', icon: 'barcode-outline', table: 'scanned_products', column: 'scanned_at', title: "COALESCE(NULLIF(name, ''), 'A product')" },
];

const SOURCE_BY_KEY = new Map(SQUARE_SOURCES.map((source) => [source.key, source]));

export function squareSource(key: string): SquareSource | undefined {
  return SOURCE_BY_KEY.get(key);
}

export function squareRoute(source: SquareSource): { pathname: string; params: Record<string, string> } {
  return { pathname: SQUARE_TAB_PATH[source.tab], params: { [LENS_PARAM[source.tab]]: source.lens } };
}

// ------------------------------------------------------------------ days

const pad = (n: number) => String(n).padStart(2, '0');

export function dayString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDay(day: string): Date {
  return new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
}

export function shiftDay(day: string, days: number): string {
  const date = parseDay(day);
  date.setDate(date.getDate() + days);
  return dayString(date);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 0 for Sunday. */
export function weekdayOf(day: string): number {
  return parseDay(day).getDay();
}

/** Weeks start on Sunday, the way the app's reminder days count. */
export function weekStartOf(day: string): string {
  return shiftDay(day, -weekdayOf(day));
}

const ZONED = /(Z|[+-]\d\d:?\d\d)$/;
const SQLITE_UTC = /^\d{4}-\d\d-\d\d \d\d:\d\d(:\d\d)?$/;

/** Where a stored moment falls on the person's own clock. A plain date
 *  has no time and goes in the day's "that day" row. An ISO stamp with a
 *  zone, or SQLite's datetime('now'), which is UTC without saying so, goes
 *  through a Date so an evening entry west of Greenwich stays on its day.
 *  A local 'YYYY-MM-DDTHH:mm' is read as written. */
export function placeStamp(stamp: string | null | undefined): { day: string; minute: number | null } | null {
  if (!stamp || !/^\d{4}-\d\d-\d\d/.test(stamp)) return null;
  if (stamp.length === 10) return { day: stamp, minute: null };
  if (ZONED.test(stamp) || SQLITE_UTC.test(stamp)) {
    const at = new Date(SQLITE_UTC.test(stamp) ? `${stamp.replace(' ', 'T')}Z` : stamp);
    if (Number.isNaN(at.getTime())) return { day: stamp.slice(0, 10), minute: null };
    return { day: dayString(at), minute: at.getHours() * 60 + at.getMinutes() };
  }
  const hour = Number(stamp.slice(11, 13));
  const minute = Number(stamp.slice(14, 16));
  if (Number.isNaN(hour) || Number.isNaN(minute)) return { day: stamp.slice(0, 10), minute: null };
  return { day: stamp.slice(0, 10), minute: hour * 60 + minute };
}

/** Whether a placed record is already in the past. */
export function isRecorded(placed: { day: string; minute: number | null }, today: string, nowMinute: number): boolean {
  if (placed.day < today) return true;
  if (placed.day > today) return false;
  return placed.minute === null || placed.minute <= nowMinute;
}

// ------------------------------------------------------------------ places

export type SquareLevel = 'year' | 'month' | 'week' | 'day' | 'hour';

export const SQUARE_LEVELS: SquareLevel[] = ['year', 'month', 'week', 'day', 'hour'];

export const SQUARE_LEVEL_LABEL: Record<SquareLevel, string> = {
  year: 'Year',
  month: 'Month',
  week: 'Week',
  day: 'Day',
  hour: 'Hour',
};

/** A place on the timeline: the level, a day inside the period, and for
 *  the Hour level the hour. Every period is worked out from the day. */
export type SquarePlace = { level: SquareLevel; day: string; hour: number };

export function samePlace(a: SquarePlace, b: SquarePlace): boolean {
  return periodKey(a) === periodKey(b);
}

/** One string per period, so two places in the same month at the Month
 *  level are the same page. */
export function periodKey(place: SquarePlace): string {
  switch (place.level) {
    case 'year':
      return `y:${place.day.slice(0, 4)}`;
    case 'month':
      return `m:${place.day.slice(0, 7)}`;
    case 'week':
      return `w:${weekStartOf(place.day)}`;
    case 'day':
      return `d:${place.day}`;
    case 'hour':
      return `h:${place.day}T${pad(place.hour)}`;
  }
}

/** The first and last day a period covers. */
export function periodDays(place: SquarePlace): { from: string; through: string } {
  const year = Number(place.day.slice(0, 4));
  const month = Number(place.day.slice(5, 7));
  switch (place.level) {
    case 'year':
      return { from: `${year}-01-01`, through: `${year}-12-31` };
    case 'month':
      return { from: `${place.day.slice(0, 7)}-01`, through: `${place.day.slice(0, 7)}-${pad(daysInMonth(year, month))}` };
    case 'week': {
      const from = weekStartOf(place.day);
      return { from, through: shiftDay(from, 6) };
    }
    case 'day':
    case 'hour':
      return { from: place.day, through: place.day };
  }
}

/** The period before or after, at the same level. */
export function shiftPlace(place: SquarePlace, step: number): SquarePlace {
  switch (place.level) {
    case 'year': {
      const year = Number(place.day.slice(0, 4)) + step;
      return { ...place, day: `${year}-${place.day.slice(5, 7)}-01` };
    }
    case 'month': {
      const date = new Date(Number(place.day.slice(0, 4)), Number(place.day.slice(5, 7)) - 1 + step, 1);
      return { ...place, day: dayString(date) };
    }
    case 'week':
      return { ...place, day: shiftDay(place.day, 7 * step) };
    case 'day':
      return { ...place, day: shiftDay(place.day, step) };
    case 'hour': {
      const total = place.hour + step;
      const days = Math.floor(total / 24);
      return { ...place, day: shiftDay(place.day, days), hour: ((total % 24) + 24) % 24 };
    }
  }
}

/** Whether a period starts after now, so there is nothing recorded in it
 *  yet and no page to swipe to. */
export function isFuture(place: SquarePlace, today: string, nowHour: number): boolean {
  const { from } = periodDays(place);
  if (from > today) return true;
  if (place.level === 'hour') return place.day === today && place.hour > nowHour;
  return false;
}

/** Moving to another level keeps the same moment in view: going out from
 *  a day to its month, or in from a month to its first day. Going in from
 *  a period lands on today when today is inside it, so a person who goes
 *  in from this month lands on this week rather than its first. */
export function placeAtLevel(place: SquarePlace, level: SquareLevel, today: string, nowHour: number): SquarePlace {
  const { from, through } = periodDays(place);
  const inside = today >= from && today <= through;
  const deeper = SQUARE_LEVELS.indexOf(level) > SQUARE_LEVELS.indexOf(place.level);
  const day = deeper ? (inside ? today : place.level === 'hour' || place.level === 'day' ? place.day : from) : place.day;
  const hour = level === 'hour' && place.level !== 'hour' ? (day === today ? nowHour : 8) : place.hour;
  return { level, day, hour };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function hourLabel(hour: number): string {
  const shown = hour % 12 === 0 ? 12 : hour % 12;
  return `${shown}${hour < 12 ? 'am' : 'pm'}`;
}

export function minuteLabel(minute: number): string {
  const hour = Math.floor(minute / 60);
  const rest = minute % 60;
  const shown = hour % 12 === 0 ? 12 : hour % 12;
  return rest === 0 ? `${shown}${hour < 12 ? 'am' : 'pm'}` : `${shown}:${pad(rest)}${hour < 12 ? 'am' : 'pm'}`;
}

function longDay(day: string): string {
  const date = parseDay(day);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function shortDay(day: string): string {
  const date = parseDay(day);
  return `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`;
}

/** The heading over a page. */
export function placeLabel(place: SquarePlace): string {
  const date = parseDay(place.day);
  switch (place.level) {
    case 'year':
      return String(date.getFullYear());
    case 'month':
      return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    case 'week': {
      const { from, through } = periodDays(place);
      return `${shortDay(from)} to ${shortDay(through)} ${parseDay(through).getFullYear()}`;
    }
    case 'day':
      return longDay(place.day);
    case 'hour':
      return `${hourLabel(place.hour)} to ${hourLabel((place.hour + 1) % 24)}, ${longDay(place.day)}`;
  }
}

export type SquareCrumb = { level: SquareLevel; label: string; place: SquarePlace };

/** The path across the top: every level from the year down to this one,
 *  each a way back out. */
export function crumbsFor(place: SquarePlace): SquareCrumb[] {
  const date = parseDay(place.day);
  const crumbs: SquareCrumb[] = [];
  const depth = SQUARE_LEVELS.indexOf(place.level);
  for (let i = 0; i <= depth; i += 1) {
    const level = SQUARE_LEVELS[i];
    const at: SquarePlace = { level, day: place.day, hour: place.hour };
    let label: string;
    switch (level) {
      case 'year':
        label = String(date.getFullYear());
        break;
      case 'month':
        label = MONTHS[date.getMonth()];
        break;
      case 'week':
        label = `Week of ${shortDay(weekStartOf(place.day))}`;
        break;
      case 'day':
        label = `${WEEKDAYS[date.getDay()].slice(0, 3)} ${date.getDate()}`;
        break;
      case 'hour':
        label = hourLabel(place.hour);
        break;
    }
    crumbs.push({ level, label, place: at });
  }
  return crumbs;
}

// ------------------------------------------------------------------ pages

/** Which parts of life appear, never how often: a set of source keys. */
export type Presence = Map<string, Set<string>>;

export type SquareRecord = {
  id: string;
  source: string;
  title: string;
  day: string;
  /** Minutes after local midnight, or null for a record with a date only. */
  minute: number | null;
};

/** The parts of life a set of source keys touches, in tab order. */
export function tabsOf(sources: Iterable<string>): SquareTab[] {
  const seen = new Set<SquareTab>();
  for (const key of sources) {
    const source = SOURCE_BY_KEY.get(key);
    if (source) seen.add(source.tab);
  }
  return SQUARE_TAB_ORDER.filter((tab) => seen.has(tab));
}

/** How a square describes itself to a screen reader: what was recorded,
 *  by part of life, with no counts. */
export function describeTabs(tabs: SquareTab[]): string {
  if (tabs.length === 0) return 'nothing recorded';
  return `recorded in ${tabs.map((tab) => SQUARE_TAB_NAME[tab]).join(', ')}`;
}

export type MonthTile = { month: number; label: string; place: SquarePlace; tabs: SquareTab[]; future: boolean };

/** The Year level: twelve months, each saying which parts of life appear
 *  in it. presence is keyed 'YYYY-MM'. */
export function buildYearPage(year: number, presence: Presence, today: string): MonthTile[] {
  const tiles: MonthTile[] = [];
  for (let month = 1; month <= 12; month += 1) {
    const key = `${year}-${pad(month)}`;
    tiles.push({
      month,
      label: MONTHS[month - 1].slice(0, 3),
      place: { level: 'month', day: `${key}-01`, hour: 8 },
      tabs: tabsOf(presence.get(key) ?? []),
      future: `${key}-01` > today,
    });
  }
  return tiles;
}

export type DayTile = { day: string; dayNumber: number; place: SquarePlace; tabs: SquareTab[]; future: boolean; today: boolean };

/** The Month level: a calendar of weeks starting on Sunday, a blank where
 *  the month has not started or has ended. presence is keyed by day. */
export function buildMonthPage(year: number, month: number, presence: Presence, today: string): (DayTile | null)[][] {
  const first = `${year}-${pad(month)}-01`;
  const lead = weekdayOf(first);
  const total = daysInMonth(year, month);
  const cells: (DayTile | null)[] = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= total; d += 1) {
    const day = `${year}-${pad(month)}-${pad(d)}`;
    cells.push({ day, dayNumber: d, place: { level: 'day', day, hour: 8 }, tabs: tabsOf(presence.get(day) ?? []), future: day > today, today: day === today });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (DayTile | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** A square holding whatever was recorded in its stretch of time: the first
 *  record shows its colour and icon, and more says how many others share
 *  the square. */
export type TimeSquare = { first: SquareRecord | null; more: number; records: SquareRecord[] };

function squareOf(records: SquareRecord[]): TimeSquare {
  const sorted = [...records].sort((a, b) => (a.minute ?? -1) - (b.minute ?? -1) || a.title.localeCompare(b.title));
  return { first: sorted[0] ?? null, more: Math.max(0, sorted.length - 1), records: sorted };
}

export type WeekColumn = { day: string; label: string; dayNumber: number; future: boolean; thatDay: TimeSquare; hours: TimeSquare[] };

/** The Week level: seven day columns of twenty-four hours, with each day's
 *  date-only records in a square above its hours. */
export function buildWeekPage(weekStart: string, records: SquareRecord[], today: string): WeekColumn[] {
  const columns: WeekColumn[] = [];
  for (let i = 0; i < 7; i += 1) {
    const day = shiftDay(weekStart, i);
    const mine = records.filter((record) => record.day === day);
    const hours: TimeSquare[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      hours.push(squareOf(mine.filter((record) => record.minute !== null && Math.floor(record.minute / 60) === hour)));
    }
    columns.push({
      day,
      label: WEEKDAYS[i].slice(0, 3),
      dayNumber: parseDay(day).getDate(),
      future: day > today,
      thatDay: squareOf(mine.filter((record) => record.minute === null)),
      hours,
    });
  }
  return columns;
}

export type DayRow = { hour: number; label: string; quarters: TimeSquare[] };

export type DayPage = { thatDay: SquareRecord[]; rows: DayRow[] };

/** The Day level: ninety-six fifteen-minute squares, laid out as twenty-four
 *  rows of four, with the date-only records in a row above. */
export function buildDayPage(day: string, records: SquareRecord[]): DayPage {
  const mine = records.filter((record) => record.day === day);
  const rows: DayRow[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const quarters: TimeSquare[] = [];
    for (let q = 0; q < 4; q += 1) {
      const from = hour * 60 + q * 15;
      quarters.push(squareOf(mine.filter((record) => record.minute !== null && record.minute >= from && record.minute < from + 15)));
    }
    rows.push({ hour, label: hourLabel(hour), quarters });
  }
  return { thatDay: squareOf(mine.filter((record) => record.minute === null)).records, rows };
}

export type HourQuarter = { label: string; records: SquareRecord[] };

/** The Hour level: the four quarters, each listing every record in it by
 *  name and time, so nothing is hidden behind a +N any more. */
export function buildHourPage(day: string, hour: number, records: SquareRecord[]): HourQuarter[] {
  const quarters: HourQuarter[] = [];
  for (let q = 0; q < 4; q += 1) {
    const from = hour * 60 + q * 15;
    quarters.push({
      label: minuteLabel(from),
      records: squareOf(records.filter((record) => record.day === day && record.minute !== null && record.minute >= from && record.minute < from + 15)).records,
    });
  }
  return quarters;
}

/** The line under a record at the Hour level. */
export function recordCaption(record: SquareRecord): string {
  const source = SOURCE_BY_KEY.get(record.source);
  const where = source ? `${SQUARE_TAB_NAME[source.tab]} > ${source.lensLabel}` : '';
  const when = record.minute === null ? 'That day' : minuteLabel(record.minute);
  return where ? `${when} · ${where}` : when;
}

export const SQUARES_NOTE =
  'Each square is coloured by the tab a record lives on, with the icon of its lens. It shows which parts of life were recorded, never how much or how well, and an empty square only means nothing was written down. A record with a date and no time sits in the That Day row rather than at a time nobody chose.';
