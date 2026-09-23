// Trends > Garden Yield, 2026-09-23. Phase 4 of the cross-app push, and the
// first lens whose clock is seasonal rather than weekly: a garden gives
// nothing for months and then gives everything at once, so this one counts by
// calendar month and offers a year or more at a time.
//
// Pure, so scripts/test_harvest_yield.js can check every figure and every
// sentence without a phone. lib/harvestYieldDb.ts does the reading.
//
// Three rules hold the file up.
//
// 1. A MONTH WITH NOTHING RECORDED IS A GAP, NEVER A ZERO. It is the rule
//    phase 2 established, and it bites harder here: a January with no
//    harvest is usually January rather than a month somebody forgot to log.
//    Either way the app does not know which, so a blank month says nothing
//    was recorded and stops there.
//
// 2. UNITS ARE NEVER CONVERTED ACROSS KINDS. Mass converts exactly and goes
//    through lib/unitConversion.ts, so grams, kilos, ounces and pounds all
//    add up. A count of cucumbers is not a weight, a bucket of compost is
//    not a kilo, and nothing here pretends otherwise. This is the same
//    refusal lib/harvestTrade.ts already makes about prices.
//
// 3. NOTHING HERE MARKS A GARDEN. A thin month is said plainly and left
//    alone. Days to harvest reads against what the person expected, which is
//    a note they wrote themselves, never against a figure the app invented.

import { daysBetween } from './eatingVariety';
import {
  describeSurplus,
  formatQuantity,
  formatTradeMoney,
  summarizeSurplus,
  type DispositionRecord,
  type SurplusSummary,
} from './harvestTrade';
import { convertToGrams, type MeasurementUnit } from './unitConversion';

export type MeasureSystem = 'metric' | 'imperial';

// ---------------------------------------------------------------------------
// What gets handed in
// ---------------------------------------------------------------------------

export type HarvestRecord = {
  id: string;
  harvestedOn: string; // 'YYYY-MM-DD', already a local date in garden_harvests
  foodName: string;
  quantity: number;
  unit: string;
  plotName: string | null;
  plantingId: string | null;
};

export type PlantingTiming = {
  id: string;
  foodName: string;
  plotName: string | null;
  plantedOn: string;
  expectedHarvestStart: string | null;
  status: string;
  /** The earliest harvest logged against this planting, where there is one. */
  firstHarvestOn: string | null;
};

export type CompostMovement = {
  occurredOn: string;
  kind: string;
  materialClass: string | null;
  amount: number | null;
  unit: string;
  plotName: string | null;
};

export type CompostPileStanding = { active: number; curing: number; finished: number };

export type ReceivedShare = {
  receivedOn: string;
  fromWhom: string | null;
  foodName: string;
  quantity: number;
  unit: string;
};

export type HarvestYieldInputs = {
  startDate: string;
  endDate: string;
  system: MeasureSystem;
  harvests: HarvestRecord[];
  plantings: PlantingTiming[];
  compostEvents: CompostMovement[];
  compostPiles: CompostPileStanding;
  dispositions: DispositionRecord[];
  shares: ReceivedShare[];
};

// ---------------------------------------------------------------------------
// Months
// ---------------------------------------------------------------------------

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function lastDayOfMonth(year: number, month: number): string {
  // Day 0 of the following month is the last day of this one, which handles
  // February and leap years without a table.
  return `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;
}

export type YieldMonth = {
  monthStart: string;
  monthEnd: string;
  label: string;
  /** The range clipped this month at one end or both, so it covers fewer
   *  days than the months beside it and is marked rather than compared. */
  partial: boolean;
};

export function buildMonths(startDate: string, endDate: string): YieldMonth[] {
  if (endDate < startDate) return [];
  const months: YieldMonth[] = [];
  let year = Number(startDate.slice(0, 4));
  let month = Number(startDate.slice(5, 7));
  for (let guard = 0; guard < 600; guard += 1) {
    const first = `${year}-${pad(month)}-01`;
    if (first > endDate) break;
    const last = lastDayOfMonth(year, month);
    const monthStart = first < startDate ? startDate : first;
    const monthEnd = last > endDate ? endDate : last;
    months.push({
      monthStart,
      monthEnd,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
      partial: monthStart !== first || monthEnd !== last,
    });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

export function monthsBack(endDate: string, count: number): string {
  const year = Number(endDate.slice(0, 4));
  const month = Number(endDate.slice(5, 7));
  const total = year * 12 + (month - 1) - (count - 1);
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}-01`;
}

/** One drawn row of a periodic chart. `value` is null where nothing was
 *  recorded, which is what keeps a gap from being drawn as a zero. */
export type PeriodRow = { key: string; label: string; value: number | null; display: string };

// ---------------------------------------------------------------------------
// Weight, count, and everything else
// ---------------------------------------------------------------------------

const COUNT_UNITS = ['count', 'counts', 'each', 'item', 'items', 'piece', 'pieces'];

export function isCountUnit(unit: string): boolean {
  return COUNT_UNITS.includes(unit.trim().toLowerCase());
}

/** Grams, where the unit is a mass. Null for a count, a volume, or anything
 *  else: no density is passed, so a volume declines rather than being
 *  guessed at. */
export function harvestGrams(quantity: number, unit: string): number | null {
  const normalized = unit.trim().toLowerCase();
  if (isCountUnit(normalized)) return null;
  const result = convertToGrams(quantity, normalized as MeasurementUnit);
  return result.ok ? result.grams : null;
}

function roundTo(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function formatWeight(grams: number, system: MeasureSystem): string {
  if (system === 'imperial') {
    const pounds = grams / 453.592;
    if (pounds < 1) return `${Math.round(grams / 28.3495)} oz`;
    return `${roundTo(pounds, 1)} lb`;
  }
  if (grams < 1000) return `${Math.round(grams)} g`;
  return `${roundTo(grams / 1000, 1)} kg`;
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/** Everything harvested out of one bucket, kept in the three shapes that
 *  cannot be added together. */
type Tally = { grams: number; counted: number; other: Map<string, number> };

function emptyTally(): Tally {
  return { grams: 0, counted: 0, other: new Map() };
}

function addToTally(tally: Tally, quantity: number, unit: string): void {
  const grams = harvestGrams(quantity, unit);
  if (grams != null) {
    tally.grams += grams;
    return;
  }
  if (isCountUnit(unit)) {
    tally.counted += quantity;
    return;
  }
  const key = unit.trim().toLowerCase() || 'unmarked';
  tally.other.set(key, (tally.other.get(key) ?? 0) + quantity);
}

function tallyIsEmpty(tally: Tally): boolean {
  return tally.grams <= 0 && tally.counted <= 0 && tally.other.size === 0;
}

function otherUnitList(tally: Tally): { unit: string; amount: number }[] {
  return [...tally.other.entries()]
    .map(([unit, amount]) => ({ unit, amount: roundTo(amount, 2) }))
    .sort((a, b) => b.amount - a.amount);
}

export function describeTally(tally: Tally, system: MeasureSystem): string {
  const parts: string[] = [];
  if (tally.grams > 0) parts.push(formatWeight(tally.grams, system));
  if (tally.counted > 0) parts.push(`${roundTo(tally.counted, 2)} picked by count`);
  for (const entry of otherUnitList(tally)) {
    parts.push(formatQuantity(entry.amount, entry.unit));
  }
  if (parts.length === 0) return 'nothing recorded';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

// ---------------------------------------------------------------------------
// Band 1: what the garden gave
// ---------------------------------------------------------------------------

export type YieldSlice = {
  name: string;
  display: string;
  grams: number;
  counted: number;
  /** Share of the weight, where there is a weight to take a share of. Null
   *  for anything measured only by count, since the two have no shared
   *  total to divide. */
  share: number | null;
};

export type YieldBand = {
  hasAnything: boolean;
  headline: string;
  rows: PeriodRow[];
  totalDisplay: string;
  countLine: string | null;
  otherUnitsLine: string | null;
  blankMonths: number;
  gapNote: string | null;
  byCrop: YieldSlice[];
  byArea: YieldSlice[];
  unassignedLine: string | null;
};

function sliceFrom(name: string, tally: Tally, totalGrams: number, system: MeasureSystem): YieldSlice {
  return {
    name,
    display: describeTally(tally, system),
    grams: roundTo(tally.grams, 2),
    counted: roundTo(tally.counted, 2),
    share: tally.grams > 0 && totalGrams > 0 ? Math.round((tally.grams / totalGrams) * 100) : null,
  };
}

function sortSlices(slices: YieldSlice[]): YieldSlice[] {
  return slices.sort((a, b) => {
    if (b.grams !== a.grams) return b.grams - a.grams;
    if (b.counted !== a.counted) return b.counted - a.counted;
    return a.name.localeCompare(b.name);
  });
}

export function summarizeYield(
  harvests: HarvestRecord[],
  months: YieldMonth[],
  system: MeasureSystem,
): YieldBand {
  const total = emptyTally();
  const byCrop = new Map<string, { name: string; tally: Tally }>();
  const byArea = new Map<string, { name: string; tally: Tally }>();
  const unassigned = emptyTally();

  for (const harvest of harvests) {
    addToTally(total, harvest.quantity, harvest.unit);

    const cropKey = harvest.foodName.trim().toLowerCase();
    const crop = byCrop.get(cropKey) ?? { name: harvest.foodName, tally: emptyTally() };
    addToTally(crop.tally, harvest.quantity, harvest.unit);
    byCrop.set(cropKey, crop);

    if (harvest.plotName) {
      const areaKey = harvest.plotName.trim().toLowerCase();
      const area = byArea.get(areaKey) ?? { name: harvest.plotName, tally: emptyTally() };
      addToTally(area.tally, harvest.quantity, harvest.unit);
      byArea.set(areaKey, area);
    } else {
      addToTally(unassigned, harvest.quantity, harvest.unit);
    }
  }

  const rows: PeriodRow[] = months.map((month) => {
    const inMonth = harvests.filter(
      (harvest) => harvest.harvestedOn >= month.monthStart && harvest.harvestedOn <= month.monthEnd,
    );
    if (inMonth.length === 0) {
      return { key: month.monthStart, label: month.label, value: null, display: 'nothing recorded' };
    }
    const tally = emptyTally();
    for (const harvest of inMonth) addToTally(tally, harvest.quantity, harvest.unit);
    return {
      key: month.monthStart,
      label: month.partial ? `${month.label} (part)` : month.label,
      value: roundTo(tally.grams, 2),
      display: describeTally(tally, system),
    };
  });

  const blankMonths = rows.filter((row) => row.value === null).length;
  const hasAnything = harvests.length > 0;

  const crops = sortSlices([...byCrop.values()].map((entry) => sliceFrom(entry.name, entry.tally, total.grams, system)));
  const areas = sortSlices([...byArea.values()].map((entry) => sliceFrom(entry.name, entry.tally, total.grams, system)));

  let headline: string;
  if (!hasAnything) {
    headline =
      'Nothing harvested in this stretch. Log a picking in Garden > Harvest Log and every band here fills in on its own.';
  } else {
    const weightPart = total.grams > 0 ? formatWeight(total.grams, system) : null;
    const countPart = total.counted > 0 ? `${roundTo(total.counted, 2)} picked by count` : null;
    const measure = [weightPart, countPart].filter(Boolean).join(' and ') || 'harvests';
    const areaPart = areas.length > 0 ? ` across ${areas.length} ${plural(areas.length, 'area', 'areas')}` : '';
    headline = `${measure} from ${crops.length} ${plural(crops.length, 'crop', 'crops')}${areaPart}.`;
  }

  const otherUnits = otherUnitList(total);

  return {
    hasAnything,
    headline,
    rows,
    totalDisplay: describeTally(total, system),
    countLine:
      total.counted > 0 && total.grams > 0
        ? `${roundTo(total.counted, 2)} of those were picked by count rather than weighed, so they sit beside the weight rather than inside it.`
        : null,
    otherUnitsLine:
      otherUnits.length > 0
        ? `Also recorded in units that do not become a weight: ${otherUnits
            .map((entry) => formatQuantity(entry.amount, entry.unit))
            .join(', ')}.`
        : null,
    blankMonths,
    gapNote:
      blankMonths > 0
        ? `${blankMonths} of these ${rows.length} months have nothing recorded. A quiet month is often simply out of season, so those are left blank rather than drawn as a month that grew nothing.`
        : null,
    byCrop: crops,
    byArea: areas,
    unassignedLine: tallyIsEmpty(unassigned)
      ? null
      : `${describeTally(unassigned, system)} came from harvests with no area on them, so it is counted in the total and in the crop list but not under any area.`,
  };
}

// ---------------------------------------------------------------------------
// Band 2: days to harvest, expected against actual
// ---------------------------------------------------------------------------

export type TimingRun = {
  plantingId: string;
  foodName: string;
  areaName: string | null;
  actualDays: number;
  expectedDays: number | null;
  /** Positive means later than expected. Null where no date was expected. */
  difference: number | null;
  line: string;
};

export type TimingCrop = { foodName: string; runs: number; median: number; line: string };

export type StillGrowing = { plantingId: string; foodName: string; daysPast: number; line: string };

export type TimingBand = {
  hasAnything: boolean;
  headline: string;
  runs: TimingRun[];
  byCrop: TimingCrop[];
  stillGrowing: StillGrowing[];
  noExpectedLine: string | null;
  caveat: string;
};

/** The middle value, taking the lower of the two middles on an even count.
 *  A median rather than an average, because one crop that came in two
 *  months late would drag an average nobody would recognise. */
export function middleValue(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

export function describeDifference(difference: number): string {
  if (difference === 0) return 'on the day you expected';
  const size = Math.abs(difference);
  const word = plural(size, 'day', 'days');
  return difference > 0 ? `${size} ${word} later than you expected` : `${size} ${word} earlier than you expected`;
}

export function summarizeTiming(plantings: PlantingTiming[], endDate: string): TimingBand {
  const runs: TimingRun[] = [];
  const stillGrowing: StillGrowing[] = [];
  let noExpected = 0;

  for (const planting of plantings) {
    if (planting.firstHarvestOn) {
      const actualDays = daysBetween(planting.plantedOn, planting.firstHarvestOn);
      // A first picking dated before the planting is a typo somewhere, and
      // charting a negative growing time would be worse than leaving it out.
      if (actualDays < 0) continue;
      const expectedDays = planting.expectedHarvestStart
        ? daysBetween(planting.plantedOn, planting.expectedHarvestStart)
        : null;
      const difference = expectedDays == null ? null : actualDays - expectedDays;
      if (expectedDays == null) noExpected += 1;
      const where = planting.plotName ? ` in ${planting.plotName}` : '';
      const line =
        difference == null
          ? `${planting.foodName}${where}: ${actualDays} ${plural(actualDays, 'day', 'days')} from planting to first picking. No date was expected for it, so there is nothing to compare it against.`
          : `${planting.foodName}${where}: ${actualDays} ${plural(actualDays, 'day', 'days')} from planting to first picking, ${describeDifference(difference)}.`;
      runs.push({
        plantingId: planting.id,
        foodName: planting.foodName,
        areaName: planting.plotName,
        actualDays,
        expectedDays,
        difference,
        line,
      });
      continue;
    }

    if (planting.status === 'growing' && planting.expectedHarvestStart && planting.expectedHarvestStart < endDate) {
      const daysPast = daysBetween(planting.expectedHarvestStart, endDate);
      const where = planting.plotName ? ` in ${planting.plotName}` : '';
      stillGrowing.push({
        plantingId: planting.id,
        foodName: planting.foodName,
        daysPast,
        line: `${planting.foodName}${where}: ${daysPast} ${plural(daysPast, 'day', 'days')} past the date you expected to start picking, and nothing logged from it yet.`,
      });
    }
  }

  runs.sort((a, b) => b.actualDays - a.actualDays);
  stillGrowing.sort((a, b) => b.daysPast - a.daysPast);

  const compared = runs.filter((run) => run.difference != null);
  const median = middleValue(compared.map((run) => run.difference as number));

  const cropGroups = new Map<string, { foodName: string; differences: number[] }>();
  for (const run of compared) {
    const key = run.foodName.trim().toLowerCase();
    const group = cropGroups.get(key) ?? { foodName: run.foodName, differences: [] };
    group.differences.push(run.difference as number);
    cropGroups.set(key, group);
  }
  const byCrop: TimingCrop[] = [...cropGroups.values()]
    .filter((group) => group.differences.length > 1)
    .map((group) => {
      const groupMedian = middleValue(group.differences) as number;
      return {
        foodName: group.foodName,
        runs: group.differences.length,
        median: groupMedian,
        line: `${group.foodName}, over ${group.differences.length} plantings: ${describeDifference(groupMedian)} in the middle case.`,
      };
    })
    .sort((a, b) => b.runs - a.runs);

  let headline: string;
  if (runs.length === 0) {
    headline =
      'Nothing has been picked from a tracked planting in this stretch, so there is no growing time to read yet. A planting needs both its planting date and a harvest logged against it before it shows up here.';
  } else if (median == null) {
    headline = `${runs.length} ${plural(runs.length, 'planting has', 'plantings have')} been picked. None of them carried a date you expected, so there is nothing to compare them against.`;
  } else {
    headline = `${runs.length} ${plural(runs.length, 'planting', 'plantings')} picked, and across the ${compared.length} that carried a date you expected, the middle one came in ${describeDifference(median)}.`;
  }

  return {
    hasAnything: runs.length > 0 || stillGrowing.length > 0,
    headline,
    runs,
    byCrop,
    stillGrowing,
    noExpectedLine:
      noExpected > 0
        ? `${noExpected} of these had no expected date on the planting, so ${plural(noExpected, 'it is', 'they are')} counted and left uncompared.`
        : null,
    caveat:
      'Growing time is counted from the day something went in to the day it was first picked, so a crop picked over several weeks counts from its first picking. The date expected is the one written on the planting, never a figure the app worked out.',
  };
}

// ---------------------------------------------------------------------------
// Band 3: compost produced and compost used
// ---------------------------------------------------------------------------

export type CompostAmount = { unit: string; amount: number; display: string };

export type CompostBand = {
  hasAnything: boolean;
  headline: string;
  produced: CompostAmount[];
  applied: CompostAmount[];
  appliedByArea: { name: string; display: string }[];
  materialsLine: string | null;
  turnsLine: string | null;
  pilesLine: string | null;
  unmeasuredLine: string | null;
};

function amountsByUnit(events: CompostMovement[]): CompostAmount[] {
  const byUnit = new Map<string, number>();
  for (const event of events) {
    if (event.amount == null || event.amount <= 0) continue;
    const unit = event.unit.trim().toLowerCase() || 'unmarked';
    byUnit.set(unit, (byUnit.get(unit) ?? 0) + event.amount);
  }
  return [...byUnit.entries()]
    .map(([unit, amount]) => ({ unit, amount: roundTo(amount, 2), display: formatQuantity(roundTo(amount, 2), unit) }))
    .sort((a, b) => b.amount - a.amount);
}

function joinAmounts(amounts: CompostAmount[]): string {
  const parts = amounts.map((entry) => entry.display);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

export function summarizeCompost(events: CompostMovement[], piles: CompostPileStanding): CompostBand {
  const produced = events.filter((event) => event.kind === 'harvested');
  const applied = events.filter((event) => event.kind === 'applied');
  const added = events.filter((event) => event.kind === 'added');
  const turned = events.filter((event) => event.kind === 'turned');

  const producedAmounts = amountsByUnit(produced);
  const appliedAmounts = amountsByUnit(applied);

  const areaTotals = new Map<string, { name: string; events: CompostMovement[] }>();
  for (const event of applied) {
    if (!event.plotName) continue;
    const key = event.plotName.trim().toLowerCase();
    const entry = areaTotals.get(key) ?? { name: event.plotName, events: [] };
    entry.events.push(event);
    areaTotals.set(key, entry);
  }

  const greens = added.filter((event) => event.materialClass === 'green').length;
  const browns = added.filter((event) => event.materialClass === 'brown').length;
  const others = added.length - greens - browns;

  const unmeasured = [...produced, ...applied].filter((event) => event.amount == null || event.amount <= 0).length;

  const totalPiles = piles.active + piles.curing + piles.finished;
  const hasAnything = events.length > 0 || totalPiles > 0;

  let headline: string;
  if (!hasAnything) {
    headline =
      'No compost recorded yet. Start a pile in Garden > Compost and what goes in, what comes out, and where it ends up all read here.';
  } else if (producedAmounts.length === 0 && appliedAmounts.length === 0) {
    headline = 'Nothing has come out of a pile in this stretch yet. What has gone in is below.';
  } else {
    const parts: string[] = [];
    if (producedAmounts.length > 0) parts.push(`${joinAmounts(producedAmounts)} of finished compost taken out`);
    if (appliedAmounts.length > 0) parts.push(`${joinAmounts(appliedAmounts)} put on your growing areas`);
    headline = `${parts.join(', and ')}.`;
  }

  return {
    hasAnything,
    headline,
    produced: producedAmounts,
    applied: appliedAmounts,
    appliedByArea: [...areaTotals.values()]
      .map((entry) => ({ name: entry.name, display: joinAmounts(amountsByUnit(entry.events)) || 'amount not recorded' }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    materialsLine:
      added.length > 0
        ? `${added.length} ${plural(added.length, 'thing', 'things')} added: ${greens} green, ${browns} brown${others > 0 ? `, ${others} neither` : ''}.`
        : null,
    turnsLine: turned.length > 0 ? `Turned ${turned.length} ${plural(turned.length, 'time', 'times')} in this stretch.` : null,
    pilesLine:
      totalPiles > 0
        ? `${totalPiles} ${plural(totalPiles, 'pile', 'piles')} on the go: ${piles.active} taking material, ${piles.curing} curing, ${piles.finished} finished.`
        : null,
    unmeasuredLine:
      unmeasured > 0
        ? `${unmeasured} of those comings and goings had no amount written down, so ${plural(unmeasured, 'it is', 'they are')} counted and not totalled.`
        : null,
  };
}

// ---------------------------------------------------------------------------
// Band 4: given away, traded and received
// ---------------------------------------------------------------------------

export type SharingBand = {
  hasAnything: boolean;
  headline: string;
  surplus: SurplusSummary;
  outgoing: { foodName: string; display: string; kinds: string }[];
  received: { foodName: string; display: string; from: string | null }[];
  receivedLine: string | null;
  note: string | null;
};

const KIND_WORDS: Record<string, string> = { sold: 'sold', traded: 'traded', given: 'given away' };

export function summarizeSharing(dispositions: DispositionRecord[], shares: ReceivedShare[]): SharingBand {
  const surplus = summarizeSurplus(dispositions);

  const receivedByFood = new Map<string, { foodName: string; quantity: number; unit: string; from: Set<string> }>();
  for (const share of shares) {
    const key = `${share.foodName.trim().toLowerCase()}|${share.unit.trim().toLowerCase()}`;
    const entry = receivedByFood.get(key) ?? {
      foodName: share.foodName,
      quantity: 0,
      unit: share.unit,
      from: new Set<string>(),
    };
    entry.quantity += share.quantity;
    if (share.fromWhom) entry.from.add(share.fromWhom);
    receivedByFood.set(key, entry);
  }

  return {
    hasAnything: dispositions.length > 0 || shares.length > 0,
    headline: describeSurplus(surplus),
    surplus,
    outgoing: surplus.byFood.map((entry) => ({
      foodName: entry.foodName,
      display: formatQuantity(roundTo(entry.quantityGiven, 2), entry.unit),
      kinds: entry.kinds.map((kind) => KIND_WORDS[kind] ?? kind).join(' and '),
    })),
    received: [...receivedByFood.values()]
      .map((entry) => ({
        foodName: entry.foodName,
        display: formatQuantity(roundTo(entry.quantity, 2), entry.unit),
        from: entry.from.size > 0 ? [...entry.from].join(', ') : null,
      }))
      .sort((a, b) => a.foodName.localeCompare(b.foodName)),
    receivedLine:
      shares.length > 0
        ? `${shares.length} ${plural(shares.length, 'lot', 'lots')} came in from somebody else's garden in this stretch.`
        : null,
    note:
      surplus.salesWithoutStream > 0
        ? `${surplus.salesWithoutStream} of those sales had no amount on them, so the money figure covers less than every sale.`
        : null,
  };
}

// ---------------------------------------------------------------------------
// The whole lens
// ---------------------------------------------------------------------------

export type HarvestYieldSummary = {
  startDate: string;
  endDate: string;
  system: MeasureSystem;
  months: YieldMonth[];
  hasAnything: boolean;
  yields: YieldBand;
  timing: TimingBand;
  compost: CompostBand;
  sharing: SharingBand;
};

export function summarizeHarvestYield(inputs: HarvestYieldInputs): HarvestYieldSummary {
  const months = buildMonths(inputs.startDate, inputs.endDate);
  const yields = summarizeYield(inputs.harvests, months, inputs.system);
  const timing = summarizeTiming(inputs.plantings, inputs.endDate);
  const compost = summarizeCompost(inputs.compostEvents, inputs.compostPiles);
  const sharing = summarizeSharing(inputs.dispositions, inputs.shares);
  return {
    startDate: inputs.startDate,
    endDate: inputs.endDate,
    system: inputs.system,
    months,
    hasAnything: yields.hasAnything || timing.hasAnything || compost.hasAnything || sharing.hasAnything,
    yields,
    timing,
    compost,
    sharing,
  };
}

// ---------------------------------------------------------------------------
// The Home card
// ---------------------------------------------------------------------------

export type GardenYieldHomeInput = {
  monthLabel: string;
  harvests: HarvestRecord[];
  system: MeasureSystem;
  /** What this month's picking would have cost at prices the person has
   *  recorded paying before. Money kept rather than money earned, which is
   *  the wording lib/harvestTrade.ts established and this keeps. */
  avoidedCost: number;
  unpricedCount: number;
  lastHarvestOn: string | null;
  today: string;
};

export type GardenYieldHomeSummary = {
  /** The figure drawn large, or null when there is nothing to draw. */
  headline: string | null;
  line: string;
  caption: string | null;
};

export function describeGardenYieldHome(input: GardenYieldHomeInput): GardenYieldHomeSummary {
  if (input.harvests.length === 0) {
    const caption = input.lastHarvestOn
      ? `Last picking logged ${describeDaysAgo(daysBetween(input.lastHarvestOn, input.today))}.`
      : 'Log a picking in Garden > Harvest Log and this fills in on its own.';
    return { headline: null, line: `Nothing picked yet in ${input.monthLabel}.`, caption };
  }

  const tally = emptyTally();
  const crops = new Set<string>();
  for (const harvest of input.harvests) {
    addToTally(tally, harvest.quantity, harvest.unit);
    crops.add(harvest.foodName.trim().toLowerCase());
  }

  const headline = tally.grams > 0 ? formatWeight(tally.grams, input.system) : describeTally(tally, input.system);
  const extras = tally.grams > 0 && (tally.counted > 0 || tally.other.size > 0);
  const line = `${input.monthLabel}, from ${crops.size} ${plural(crops.size, 'crop', 'crops')}${
    extras ? `, plus ${describeTally({ grams: 0, counted: tally.counted, other: tally.other }, input.system)}` : ''
  }.`;

  let caption: string | null = null;
  if (input.avoidedCost > 0) {
    caption = `About ${formatTradeMoney(input.avoidedCost)} you did not have to buy, at prices you have paid before.`;
    if (input.unpricedCount > 0) {
      caption += ` ${input.unpricedCount} ${plural(input.unpricedCount, 'crop has', 'crops have')} no price you have recorded, so ${plural(input.unpricedCount, 'it is', 'they are')} left out of that.`;
    }
  } else if (input.unpricedCount > 0) {
    caption = 'None of this month’s crops has a price you have recorded, so there is no figure to put on it yet.';
  }

  return { headline, line, caption };
}

export function describeDaysAgo(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return `about ${months} ${plural(months, 'month', 'months')} ago`;
}
