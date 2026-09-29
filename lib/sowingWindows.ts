// The sowing calendar (I5, 1.0.55.20): when to start each crop from seed,
// when it goes outside, how long it takes to come up and how long to its
// first harvest, worked out from the frost dates for the place saved in
// My Zone (lib/frostDates.ts).
//
// Every window is counted in weeks from the last frost of spring (negative
// is before it), or, for an autumn sowing, in weeks before the first frost
// after summer. Those are the terms the published charts use, so they carry
// to any place that has a frost date:
//   - University of Minnesota Extension, "Starting seeds indoors", and
//     Colorado State University Extension, "Vegetable Planting Guide"
//     (CMG GardenNotes #720), for the weeks before and after the last frost
//     and the days to come up;
//   - the Royal Horticultural Society's grow-your-own guides, which the crop
//     guides in lib/cropGuides.ts already cite, for sowing, planting out and
//     harvest. The figures here are kept in step with each guide's Sow and
//     Ready lines, and scripts/test_sowing_windows.js holds them to it.
// A place where no frost comes has no frost date to count from. There the
// published calendars go by the cool and warm parts of the year instead:
// University of Florida IFAS, "Florida Vegetable Gardening Guide" (SP 103,
// VH021), whose South Florida dates put cool-season crops in the cooler,
// drier months, most warm-season vegetables from late summer through
// spring, and the heat lovers (okra, sweet potato, cassava, malanga,
// roselle, pigeon pea) in spring and summer. Those months are given for the
// northern hemisphere and turned six months for the southern.
//
// Nothing here says a crop will grow where someone lives or grades a date.
// The windows are where the charts put them, and a person's own soil, a
// cold spring or a hot one moves them.
//
// Pure, with no fetch and no database.

import { frostDateInYear, type FrostSummary } from './frostDates';

export type FrostFreeSeason = 'cool' | 'mild' | 'heat';

export type SowingWindow = {
  /** The key of the crop guide in lib/cropGuides.ts. */
  key: string;
  /** Weeks before the last frost to start seed indoors, earliest first:
   *  [8, 6] is eight to six weeks before. */
  indoors?: [number, number];
  /** Weeks from the last frost to set plants, sets, slips or seed potatoes
   *  outside; negative is before it. */
  plantOut?: [number, number];
  /** What is planted out, when it is not a seedling raised indoors. */
  plantWhat?: string;
  /** Weeks from the last frost to sow seed straight into the ground. */
  direct?: [number, number];
  /** Weeks before the first frost after summer to sow or plant for an
   *  autumn or overwintered crop. */
  autumn?: [number, number];
  autumnWhat?: string;
  /** Days from sowing for the seedling to come up. Absent where nothing is
   *  sown from seed (seed potatoes, sets, slips, cuttings). */
  sprout?: [number, number];
  /** Days to the first harvest, counted from `harvestFrom`. Absent where a
   *  harvest is a season away rather than a count of days (garlic). */
  harvest?: [number, number];
  harvestFrom: 'sowing' | 'planting';
  /** How a frost-free place's calendar treats the crop. Absent where the
   *  crop needs a cold winter or long days that a frost-free place lacks. */
  frostFree?: FrostFreeSeason;
};

export const SOWING_WINDOWS: SowingWindow[] = [
  // Warm-season fruiting crops: started indoors and set out after the frost.
  { key: 'tomato', indoors: [8, 6], plantOut: [1, 3], sprout: [5, 10], harvest: [60, 85], harvestFrom: 'planting', frostFree: 'mild' },
  { key: 'pepper', indoors: [10, 8], plantOut: [2, 4], sprout: [7, 14], harvest: [60, 90], harvestFrom: 'planting', frostFree: 'mild' },
  { key: 'aubergine', indoors: [10, 8], plantOut: [2, 4], sprout: [7, 14], harvest: [70, 85], harvestFrom: 'planting', frostFree: 'mild' },
  { key: 'cucumber', indoors: [4, 3], plantOut: [1, 3], direct: [1, 3], sprout: [3, 10], harvest: [50, 70], harvestFrom: 'sowing', frostFree: 'mild' },
  { key: 'courgette', indoors: [4, 3], plantOut: [1, 3], direct: [1, 3], sprout: [5, 10], harvest: [45, 55], harvestFrom: 'sowing', frostFree: 'mild' },
  { key: 'squash', indoors: [4, 3], plantOut: [1, 3], direct: [1, 3], sprout: [5, 10], harvest: [85, 120], harvestFrom: 'sowing', frostFree: 'mild' },
  { key: 'melon', indoors: [4, 3], plantOut: [2, 3], sprout: [3, 10], harvest: [80, 100], harvestFrom: 'sowing', frostFree: 'mild' },
  { key: 'sweetcorn', direct: [1, 3], sprout: [5, 10], harvest: [70, 100], harvestFrom: 'sowing', frostFree: 'mild' },
  { key: 'greenbeans', direct: [1, 4], autumn: [12, 10], sprout: [7, 10], harvest: [50, 65], harvestFrom: 'sowing', frostFree: 'mild' },
  { key: 'runnerbeans', indoors: [4, 2], plantOut: [1, 3], direct: [1, 3], sprout: [7, 14], harvest: [70, 90], harvestFrom: 'sowing' },
  { key: 'basil', indoors: [6, 4], plantOut: [1, 3], direct: [1, 3], sprout: [5, 10], harvest: [30, 40], harvestFrom: 'planting', frostFree: 'mild' },

  // Cool-season crops: sown or set out around the last frost, and again for
  // autumn where the guide says so.
  { key: 'potato', plantOut: [-4, -2], plantWhat: 'seed potatoes', harvest: [70, 140], harvestFrom: 'planting', frostFree: 'cool' },
  { key: 'lettuce', indoors: [6, 4], plantOut: [-2, 0], direct: [-4, 2], autumn: [10, 6], sprout: [2, 10], harvest: [30, 80], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'spinach', direct: [-6, -3], autumn: [8, 5], sprout: [5, 14], harvest: [40, 50], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'chard', direct: [-2, 2], autumn: [10, 8], sprout: [5, 14], harvest: [50, 60], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'kale', indoors: [6, 4], plantOut: [-2, 2], autumn: [12, 8], sprout: [5, 10], harvest: [55, 75], harvestFrom: 'planting', frostFree: 'cool' },
  { key: 'cabbage', indoors: [8, 6], plantOut: [-4, -2], autumn: [14, 10], sprout: [4, 10], harvest: [70, 120], harvestFrom: 'planting', frostFree: 'cool' },
  { key: 'broccoli', indoors: [8, 6], plantOut: [-2, 0], autumn: [14, 10], sprout: [4, 10], harvest: [60, 90], harvestFrom: 'planting', frostFree: 'cool' },
  { key: 'cauliflower', indoors: [8, 6], plantOut: [-2, 0], autumn: [14, 10], sprout: [4, 10], harvest: [60, 100], harvestFrom: 'planting', frostFree: 'cool' },
  { key: 'brussels', indoors: [6, 4], plantOut: [4, 8], sprout: [4, 10], harvest: [90, 120], harvestFrom: 'planting' },
  { key: 'kohlrabi', direct: [-4, 2], autumn: [10, 8], sprout: [4, 10], harvest: [45, 60], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'pakchoi', autumn: [10, 6], sprout: [3, 10], harvest: [30, 45], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'rocket', direct: [-4, 4], autumn: [8, 4], sprout: [3, 7], harvest: [21, 40], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'carrot', direct: [-3, 2], autumn: [12, 10], sprout: [10, 21], harvest: [70, 80], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'beetroot', direct: [-2, 4], autumn: [10, 8], sprout: [5, 14], harvest: [55, 70], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'radish', direct: [-4, 4], autumn: [6, 4], sprout: [3, 7], harvest: [25, 30], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'turnip', direct: [-4, 2], autumn: [10, 8], sprout: [3, 10], harvest: [40, 60], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'parsnip', direct: [-3, 0], sprout: [14, 28], harvest: [120, 150], harvestFrom: 'sowing' },
  { key: 'onion', indoors: [10, 8], plantOut: [-4, -2], sprout: [7, 14], harvest: [90, 150], harvestFrom: 'planting', frostFree: 'cool' },
  { key: 'shallot', plantOut: [-6, -2], plantWhat: 'sets', harvest: [90, 120], harvestFrom: 'planting', frostFree: 'cool' },
  { key: 'garlic', autumn: [4, 0], autumnWhat: 'cloves', harvestFrom: 'planting', frostFree: 'cool' },
  { key: 'leek', indoors: [12, 8], plantOut: [0, 4], sprout: [7, 14], harvest: [120, 150], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'peas', direct: [-6, -3], autumn: [10, 8], sprout: [7, 14], harvest: [60, 70], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'broadbeans', direct: [-6, -3], autumn: [4, 0], sprout: [7, 14], harvest: [80, 100], harvestFrom: 'sowing' },
  { key: 'celery', indoors: [12, 10], plantOut: [1, 3], sprout: [14, 21], harvest: [100, 130], harvestFrom: 'planting', frostFree: 'cool' },
  { key: 'parsley', indoors: [10, 8], plantOut: [-2, 0], direct: [-3, 0], sprout: [14, 28], harvest: [70, 90], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'coriander', direct: [-2, 2], autumn: [8, 4], sprout: [7, 14], harvest: [30, 45], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'dill', direct: [-2, 2], sprout: [7, 14], harvest: [40, 60], harvestFrom: 'sowing', frostFree: 'cool' },

  // Heat lovers of the warm group: in the ground once the soil is warm.
  { key: 'sweetpotato', plantOut: [3, 5], plantWhat: 'slips', harvest: [90, 120], harvestFrom: 'planting', frostFree: 'heat' },
  { key: 'okra', direct: [3, 5], sprout: [7, 14], harvest: [50, 65], harvestFrom: 'sowing', frostFree: 'heat' },
  { key: 'drybeans', direct: [1, 4], sprout: [7, 10], harvestFrom: 'sowing', frostFree: 'mild' },
  { key: 'chickpea', direct: [0, 3], harvest: [110, 130], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'lentil', direct: [-4, -1], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'soybean', indoors: [4, 2], plantOut: [1, 4], direct: [2, 5], harvestFrom: 'sowing', frostFree: 'mild' },
  { key: 'peanut', direct: [2, 4], harvest: [120, 150], harvestFrom: 'sowing', frostFree: 'heat' },
  { key: 'ginger', indoors: [8, 2], plantOut: [0, 4], plantWhat: 'a sprouted piece of rhizome', sprout: [21, 56], harvest: [240, 300], harvestFrom: 'planting', frostFree: 'heat' },
  { key: 'turmeric', indoors: [8, 2], plantOut: [0, 4], plantWhat: 'a sprouted piece of rhizome', sprout: [28, 56], harvest: [240, 300], harvestFrom: 'planting', frostFree: 'heat' },
  { key: 'collards', indoors: [8, 6], plantOut: [-2, 0], autumn: [12, 8], harvest: [50, 70], harvestFrom: 'planting', frostFree: 'cool' },
  { key: 'mustardgreens', direct: [-3, 3], autumn: [10, 6], harvest: [35, 50], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'fennel', indoors: [4, 2], plantOut: [0, 2], direct: [2, 8], sprout: [7, 10], harvest: [60, 90], harvestFrom: 'sowing', frostFree: 'cool' },
  { key: 'tomatillo', indoors: [8, 6], plantOut: [1, 3], harvestFrom: 'planting', frostFree: 'mild' },
  { key: 'cowpea', direct: [2, 6], harvest: [65, 125], harvestFrom: 'sowing', frostFree: 'heat' },
  { key: 'cassava', plantOut: [3, 6], plantWhat: 'stem cuttings', harvest: [240, 365], harvestFrom: 'planting', frostFree: 'heat' },
  { key: 'malanga', plantOut: [3, 6], plantWhat: 'corms', harvest: [270, 365], harvestFrom: 'planting', frostFree: 'heat' },
  { key: 'roselle', direct: [2, 4], sprout: [5, 14], harvestFrom: 'sowing', frostFree: 'heat' },
  { key: 'malabarspinach', direct: [2, 4], sprout: [10, 21], harvest: [70, 80], harvestFrom: 'sowing', frostFree: 'heat' },
  { key: 'pigeonpea', direct: [2, 4], sprout: [5, 14], harvest: [120, 150], harvestFrom: 'sowing', frostFree: 'heat' },
];

const BY_KEY = new Map(SOWING_WINDOWS.map((w) => [w.key, w]));

export function findSowingWindow(cropKey: string): SowingWindow | null {
  return BY_KEY.get(cropKey) ?? null;
}

// The months a frost-free calendar gives each kind of crop, north of the
// equator (1 is January). The south is turned six months.
export const FROST_FREE_MONTHS: Record<FrostFreeSeason, number[]> = {
  cool: [10, 11, 12, 1],
  mild: [8, 9, 10, 11, 12, 1, 2, 3],
  heat: [3, 4, 5, 6, 7],
};

export const FROST_FREE_SEASON_LINES: Record<FrostFreeSeason, string> = {
  cool: 'a cool-season crop, sown in the cooler, drier months',
  mild: 'a warm-season crop, grown from late summer through spring and kept out of the hottest, wettest months',
  heat: 'a heat lover, planted in spring and summer',
};

export function frostFreeMonths(season: FrostFreeSeason, southern: boolean): number[] {
  return FROST_FREE_MONTHS[season].map((m) => (southern ? ((m + 5) % 12) + 1 : m));
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const DAY_MS = 86400000;

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DAY_MS);
}

export type SowingAction = 'indoors' | 'plantOut' | 'direct' | 'autumn' | 'frostFree';

export type DatedWindow = { action: SowingAction; start: string; end: string };

/** The frost dates a calendar counts from, taken from the frost summary for
 *  the place: the last frost of spring in half the years, the date 9 years
 *  in 10 had passed, and the first frost after summer in half the years. */
export type FrostAnchor =
  | { kind: 'frost'; southern: boolean; lastHalf: number; lastNineInTen: number; firstHalf: number | null }
  | { kind: 'frostFree'; southern: boolean; frostYears: number; seasons: number };

/** What the calendar counts from. A place where frost came in too few years
 *  to give a usual last date is treated as frost-free, and the count of
 *  frost years is carried so the screen can say so. */
export function frostAnchor(summary: FrostSummary | null, southern: boolean): FrostAnchor | null {
  if (!summary) return null;
  if (summary.last.half === null) {
    return { kind: 'frostFree', southern, frostYears: summary.last.years, seasons: summary.seasons };
  }
  return {
    kind: 'frost',
    southern,
    lastHalf: summary.last.half,
    lastNineInTen: summary.last.nineInTen ?? summary.last.half,
    firstHalf: summary.first.half,
  };
}

function weekWindow(anchor: string, weeks: [number, number]): { start: string; end: string } {
  const a = addDays(anchor, weeks[0] * 7);
  const b = addDays(anchor, weeks[1] * 7);
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

/** Every window a crop has in the growing season that holds `year`'s last
 *  frost of spring (north: that spring; south: the spring that ends that
 *  season, which falls in the year before). */
function seasonWindows(w: SowingWindow, anchor: Extract<FrostAnchor, { kind: 'frost' }>, year: number): DatedWindow[] {
  const last = frostDateInYear(anchor.lastHalf, anchor.southern, year);
  const out: DatedWindow[] = [];
  if (w.indoors) out.push({ action: 'indoors', ...weekWindow(last, [-w.indoors[0], -w.indoors[1]]) });
  if (w.plantOut) out.push({ action: 'plantOut', ...weekWindow(last, w.plantOut) });
  if (w.direct) out.push({ action: 'direct', ...weekWindow(last, w.direct) });
  if (w.autumn && anchor.firstHalf !== null) {
    const first = frostDateInYear(anchor.firstHalf, anchor.southern, year);
    out.push({ action: 'autumn', ...weekWindow(first, [-w.autumn[0], -w.autumn[1]]) });
  }
  return out;
}

function frostFreeWindows(w: SowingWindow, southern: boolean, year: number): DatedWindow[] {
  if (!w.frostFree) return [];
  const months = frostFreeMonths(w.frostFree, southern);
  // A run of months that crosses the new year (October to January) is one
  // window, so the months are walked from the first one after a gap.
  const set = new Set(months);
  const startMonth = months.find((m) => !set.has(m === 1 ? 12 : m - 1)) ?? months[0];
  const length = months.length;
  const out: DatedWindow[] = [];
  for (const y of [year - 1, year]) {
    const start = `${y}-${String(startMonth).padStart(2, '0')}-01`;
    const endMonthIndex = startMonth - 1 + length;
    const endYear = y + Math.floor(endMonthIndex / 12);
    const endMonth = (endMonthIndex % 12) + 1;
    const end = addDays(`${endYear}-${String(endMonth).padStart(2, '0')}-01`, -1);
    out.push({ action: 'frostFree', start, end });
  }
  return out;
}

/** The crop's windows that have not yet closed on `today`, soonest first,
 *  looking far enough ahead to reach the next season. */
export function upcomingWindows(w: SowingWindow, anchor: FrostAnchor, today: string): DatedWindow[] {
  const year = Number(today.slice(0, 4));
  const all: DatedWindow[] = [];
  for (const y of [year - 1, year, year + 1, year + 2]) {
    if (anchor.kind === 'frost') all.push(...seasonWindows(w, anchor, y));
    else all.push(...frostFreeWindows(w, anchor.southern, y));
  }
  const seen = new Set<string>();
  return all
    .filter((d) => d.end >= today)
    .filter((d) => {
      const id = `${d.action}|${d.start}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

/** The windows open today or opening within `aheadDays`. */
export function windowsNear(w: SowingWindow, anchor: FrostAnchor, today: string, aheadDays: number): DatedWindow[] {
  const horizon = addDays(today, aheadDays);
  return upcomingWindows(w, anchor, today).filter((d) => d.start <= horizon);
}

export function isOpen(d: DatedWindow, today: string): boolean {
  return d.start <= today && today <= d.end;
}

export const ACTION_LABELS: Record<SowingAction, string> = {
  indoors: 'Start indoors',
  plantOut: 'Plant out',
  direct: 'Sow outside',
  autumn: 'Sow for autumn',
  frostFree: 'Plant',
};

/** The label for a window, naming what goes in where it is not seed. */
export function actionLabel(w: SowingWindow, action: SowingAction): string {
  if (action === 'plantOut' && w.plantWhat) return `Plant ${w.plantWhat}`;
  if (action === 'autumn' && w.autumnWhat) return `Plant ${w.autumnWhat} for next year`;
  if (action === 'autumn' && w.key === 'broadbeans') return 'Sow to overwinter';
  return ACTION_LABELS[action];
}

// ---------------------------------------------------------------------------
// A planting's expected dates
// ---------------------------------------------------------------------------

export type StartedAs = 'seed' | 'start';

/** Days between sowing indoors and planting out, taken at the middle of the
 *  two windows, for moving a days-to-harvest figure from one basis to the
 *  other. null when the crop is not raised indoors. */
export function indoorLeadDays(w: SowingWindow): number | null {
  if (!w.indoors || !w.plantOut) return null;
  const sowWeek = -(w.indoors[0] + w.indoors[1]) / 2;
  const outWeek = (w.plantOut[0] + w.plantOut[1]) / 2;
  return Math.max(0, Math.round((outWeek - sowWeek) * 7));
}

export type ExpectedDates = {
  sproutBy: string | null;
  sproutDays: number | null;
  harvestStart: string | null;
  harvestEnd: string | null;
  harvestDays: [number, number] | null;
};

/** What a planting can expect from the day it went in: when seed should be
 *  up, and the first harvest window. A crop counted from planting out and
 *  sown as seed straight in the ground takes about as long as from planting
 *  out; one sown indoors adds the weeks before it goes out. */
export function expectedDates(w: SowingWindow, plantedOn: string, startedAs: StartedAs, sownIndoors = false): ExpectedDates {
  const sproutDays = startedAs === 'seed' && w.sprout ? w.sprout[1] : null;
  let harvestDays: [number, number] | null = w.harvest ? [w.harvest[0], w.harvest[1]] : null;
  const lead = indoorLeadDays(w);
  if (harvestDays && lead !== null) {
    if (w.harvestFrom === 'planting' && startedAs === 'seed' && sownIndoors) {
      harvestDays = [harvestDays[0] + lead, harvestDays[1] + lead];
    } else if (w.harvestFrom === 'sowing' && startedAs === 'start') {
      harvestDays = [Math.max(14, harvestDays[0] - lead), Math.max(21, harvestDays[1] - lead)];
    }
  }
  return {
    sproutBy: sproutDays === null ? null : addDays(plantedOn, sproutDays),
    sproutDays,
    harvestStart: harvestDays ? addDays(plantedOn, harvestDays[0]) : null,
    harvestEnd: harvestDays ? addDays(plantedOn, harvestDays[1]) : null,
    harvestDays,
  };
}

/** Whether the question "from seed or a start?" means anything for a crop:
 *  only where both are usual. */
export function asksHowStarted(w: SowingWindow): boolean {
  return !!(w.indoors && w.plantOut) || (!!w.sprout && !!w.plantOut);
}

export { addDays as addDaysToDate, daysBetween };

export const SOWING_SOURCES = [
  'University of Minnesota Extension, "Starting seeds indoors" (extension.umn.edu).',
  'Colorado State University Extension, "Vegetable Planting Guide", CMG GardenNotes #720.',
  'Royal Horticultural Society, grow-your-own crop guides (rhs.org.uk).',
  'University of Florida IFAS Extension, "Florida Vegetable Gardening Guide", SP 103 / VH021 (ask.ifas.ufl.edu/publication/VH021).',
];

export const SOWING_LIMITS =
  'The weeks are counted from the date the last frost had passed in half of the last 30 years, so in about half of springs a frost still comes after it. Tender plants set out in the first days of a window may need a cover on a cold night, and the date 9 years in 10 had passed is the safer one for them. A cold, wet spring or a hot one moves every window, and soil that is still cold holds seed back whatever the calendar says.';
