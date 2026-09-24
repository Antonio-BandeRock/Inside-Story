// An indoor grow's setup: the light, and everything else that runs it.
//
// 2026-09-21, direct instruction: "If I have already chosen above that it
// is an indoor grow, the app should automatically assume that Indoor LED or
// other older or newer technology will be used, and it should be asked for,
// along with all of the details about the light source itself. Indoor grows
// require different types and qualities of lights for different types of
// plants, and seedlings and younger plants. Such as, they could be growing
// in containers, and they could be fabric or they could be terracotta, or
// they could be using hydroponics, and they could be using a fog generator
// for humidity, and they may need to set timers, and they may need to have
// air conditioning, and they may need to have a water filtration system,
// and they may need to have fans, and exhaust systems, and air filters. In
// other words, all of these things would need to be accounted for in their
// grow when they are setting up everything. All of these items from the
// start will have a cost. They are expenses to get the grow going. Some
// will be ongoing expenses, like the lights, the AC, electricity usage - so
// there needs to be a way to record the current electricity bill prior to
// starting their indoor grow."
//
// Three things follow, and this module holds the vocabulary and arithmetic
// for all of them, with no database in it so scripts/test_grow_setup.js can
// check every rule.
//
//   1. INDOORS, THE LIGHT IS THE SUN. An indoor area is not asked how much
//      direct sun it gets; it is asked what lights it, in the detail a
//      grower needs: the kind of light, its wattage, how many hours a day it
//      runs, whether a timer runs it, its spectrum, and which stage of
//      growth it suits. A greenhouse is asked about sun and may add lights.
//      Outdoors is asked about sun alone.
//
//   2. A GROW IS A SET OF EQUIPMENT, each piece a garden_equipment row under
//      its area: lights, containers (and what they are made of), hydroponic
//      gear, humidity, timers, cooling, heating, water filtration, fans,
//      exhaust, air filters, meters, and any kind the person names. Each
//      piece has what it cost to buy (a growing cost under the area, in the
//      household budget once) and what it costs to keep running: an amount
//      on a cadence for a service or a filter that gets replaced, and its
//      wattage and hours, which is what the electricity estimate is made of.
//
//   3. ELECTRICITY IS MEASURED AGAINST A BASELINE. A bill from before the
//      grow started is the baseline; a bill from after is compared with it
//      per day, so bills of different lengths compare fairly, and the
//      difference is what the grow is costing in electricity. Beside that
//      figure sits the estimate from the equipment itself (watts times
//      hours), so a person can see whether the meter agrees with the plan.
//      A bill is the household's, never one area's, which is why bills live
//      under Growing Costs and not under an area.
//
// LISTS ARE OPEN. Every list here (equipment kinds, light types, light
// spectrums, container materials) is built-ins plus whatever the person adds, stored in one
// garden_custom_terms table keyed by which list the term belongs to, so the
// next list this app needs is a new code here and nothing else. Removal
// follows the standing rule: what is in use is moved first, what has
// history is retired, and nothing is orphaned.

import { sortByLabel } from './choiceOrder';
import { formatTradeMoney } from './harvestTrade';

// --- Open lists --------------------------------------------------------------

/** Which list a term the person named belongs to. */
export type GardenTermList = 'equipment_kind' | 'light_type' | 'light_spectrum' | 'container_material' | 'measurement_kind';

/** A term the person named, on one of the lists. */
export type CustomGardenTerm = { id: string; list: GardenTermList; name: string; retiredAt?: string | null };

export type GardenTermChoice = {
  code: string;
  label: string;
  help: string | null;
  mine: boolean;
};

export const GROW_EQUIPMENT_KINDS: { code: string; label: string; help: string }[] = [
  { code: 'light', label: 'Grow light', help: 'LED, HPS, metal halide, fluorescent: what stands in for the sun.' },
  { code: 'container', label: 'Containers', help: 'Pots and bags, and what they are made of, since fabric dries faster than terracotta and plastic slower than either.' },
  { code: 'hydroponics', label: 'Hydroponic system', help: 'Reservoir, pump, trays, net pots, an air stone.' },
  { code: 'humidifier', label: 'Humidifier or fogger', help: 'A fog generator or humidifier for seedlings and cuttings.' },
  { code: 'dehumidifier', label: 'Dehumidifier', help: 'For a flowering room, or a damp basement.' },
  { code: 'timer', label: 'Timer', help: 'What switches the lights, pumps or fans on and off.' },
  { code: 'air_conditioning', label: 'Air conditioning', help: 'Cooling for a room the lights heat.' },
  { code: 'heater', label: 'Heater or heat mat', help: 'A space heater, or a mat under seed trays.' },
  { code: 'water_filtration', label: 'Water filtration', help: 'A carbon filter, reverse osmosis, a dechlorinator.' },
  { code: 'fan', label: 'Fan', help: 'Oscillating or clip-on, for airflow across the plants.' },
  { code: 'exhaust', label: 'Exhaust or intake', help: 'An inline fan and ducting moving air out of, or into, the space.' },
  { code: 'air_filter', label: 'Air filter', help: 'A carbon or HEPA filter on the exhaust, or a standalone purifier.' },
  { code: 'meter', label: 'Meter or monitor', help: 'Thermometer, hygrometer, pH or EC meter, a light meter.' },
];

export const LIGHT_TYPES: { code: string; label: string; help: string }[] = [
  { code: 'led', label: 'LED', help: 'Runs cool and uses the least power for the light it gives. Most new grow lights.' },
  { code: 'hps', label: 'HPS (high-pressure sodium)', help: 'Red-heavy and hot; the older standard for flowering and fruiting.' },
  { code: 'mh', label: 'Metal halide', help: 'Blue-heavy and hot; the older standard for leafy growth.' },
  { code: 'cmh', label: 'Ceramic metal halide (CMH, LEC)', help: 'Fuller spectrum than HPS or MH, still hot.' },
  { code: 't5', label: 'T5 fluorescent', help: 'Cool and gentle; a common choice over seedlings and cuttings.' },
  { code: 'cfl', label: 'CFL', help: 'Compact fluorescent; low power, close to the plant.' },
];

export const CONTAINER_MATERIALS: { code: string; label: string; help: string }[] = [
  { code: 'fabric', label: 'Fabric', help: 'Breathes and air-prunes roots; dries out fastest.' },
  { code: 'terracotta', label: 'Terracotta', help: 'Porous clay; wicks water out through the wall, so it dries faster than plastic.' },
  { code: 'plastic', label: 'Plastic', help: 'Holds water longest; light and cheap.' },
  { code: 'ceramic', label: 'Glazed ceramic', help: 'Holds water like plastic; heavy.' },
  { code: 'wood', label: 'Wood', help: 'A planter box or half barrel.' },
  { code: 'metal', label: 'Metal', help: 'A galvanized tub or trough; heats up under a lamp.' },
];

// A light's spectrum. Codes predate the open list (2026-09-21), so stored
// rows keep reading.
export const LIGHT_SPECTRUMS: { code: string; label: string; help: string }[] = [
  { code: 'adjustable', label: 'Adjustable', help: 'Dials or channels that shift the balance between blue and red.' },
  { code: 'veg', label: 'Blue-heavy (leafy growth)', help: 'Keeps plants short and leafy.' },
  { code: 'full', label: 'Full spectrum', help: 'Close to daylight; covers every stage.' },
  { code: 'bloom', label: 'Red-heavy (flowering and fruiting)', help: 'Pushes flowering and fruit.' },
];

// What can be measured about the conditions something grows in, 2026-09-23.
// An open list like every other, so a person measuring something nobody
// thought of records it under a name they chose rather than under Other.
// Each code's units live in lib/growingConditions.ts, beside the arithmetic
// that has to know which ones add up and which ones average.
export const MEASUREMENT_KINDS: { code: string; label: string; help: string }[] = [
  { code: 'soil_moisture', label: 'Soil moisture', help: 'How wet the ground is. A cheap probe reads a percentage; a tensiometer reads centibars, which go UP as the soil dries.' },
  { code: 'soil_temperature', label: 'Soil temperature', help: 'Measured at root depth. Seeds germinate on soil temperature rather than air temperature.' },
  { code: 'air_temperature', label: 'Air temperature', help: 'At the plants, not what the forecast said for the town.' },
  { code: 'humidity', label: 'Humidity', help: 'Relative humidity as a percentage. High humidity slows drying and invites mildew.' },
  { code: 'soil_ph', label: 'Soil pH', help: 'Acid below 7, alkaline above. It decides which nutrients in the soil a plant can actually take up.' },
  { code: 'light', label: 'Light', help: 'Lux from a phone or a light meter, or PPFD from a quantum sensor. The two are not interchangeable, since lux weights the colours a human eye sees.' },
  { code: 'soil_ec', label: 'Soil or water EC', help: 'Electrical conductivity: how much dissolved fertiliser and salt the water or soil is carrying.' },
  { code: 'rainfall', label: 'Rainfall', help: 'What fell, from a gauge. Added up over a month rather than averaged.' },
  { code: 'water_given', label: 'Water given', help: 'What you put on, by hand or through a system. Added up over a month.' },
  { code: 'co2', label: 'CO2', help: 'Parts per million. Around 420 outdoors; a closed room with plants in it runs lower.' },
];

const BUILT_INS: Record<GardenTermList, { code: string; label: string; help: string }[]> = {
  equipment_kind: GROW_EQUIPMENT_KINDS,
  light_type: LIGHT_TYPES,
  light_spectrum: LIGHT_SPECTRUMS,
  container_material: CONTAINER_MATERIALS,
  measurement_kind: MEASUREMENT_KINDS,
};

/** What the picker says as its add-a-term choice and its placeholder. */
export const TERM_LIST_WORDS: Record<GardenTermList, { singular: string; example: string }> = {
  equipment_kind: { singular: 'kind of equipment', example: 'CO2 tank' },
  light_type: { singular: 'kind of light', example: 'Induction' },
  light_spectrum: { singular: 'spectrum', example: 'Far red' },
  container_material: { singular: 'material', example: 'Coir' },
  measurement_kind: { singular: 'measurement', example: 'Soil nitrogen' },
};

// What is recorded under a term on each list, and whether one of those
// records can be moved to another term at all. A reading cannot: moving it
// would change what was measured, so a measurement name with readings under
// it is retired and stays readable rather than being reassigned.
const TERM_RECORDS: Record<GardenTermList, { one: string; many: string; movable: boolean }> = {
  equipment_kind: { one: 'piece of equipment', many: 'pieces of equipment', movable: true },
  light_type: { one: 'light', many: 'lights', movable: true },
  light_spectrum: { one: 'light', many: 'lights', movable: true },
  container_material: { one: 'container', many: 'containers', movable: true },
  measurement_kind: { one: 'reading', many: 'readings', movable: false },
};

/** What the picker says under the box while a name is being added, so
 *  somebody knows what removing it later will do before they commit to it. */
export function termSaveNote(list: GardenTermList): string {
  const words = TERM_RECORDS[list];
  if (!words.movable) {
    return `Saving picks it here, and it is on the list from now on. Removing it later keeps every ${words.one} already recorded under it, and keeps this name on them.`;
  }
  return `Saving picks it here, and it is on the list from now on. Removing it later asks where to move the ${words.many} recorded under it, and deletes none of that.`;
}

/** What the picker says when a term with things under it is being removed. */
export function termRemovalNote(list: GardenTermList, name: string, counts: { current: number; past: number }): string {
  const words = TERM_RECORDS[list];
  const subject = counts.current === 1 ? `1 ${words.one} is` : `${counts.current} ${words.many} are`;
  let note = `${subject} recorded under ${name}. Pick what to move ${counts.current === 1 ? 'it' : 'them'} to; nothing is deleted.`;
  if (counts.past > 0) {
    const kept = words.movable ? 'retired' : 'past';
    note += counts.past === 1
      ? ` A ${kept} ${words.one} keeps ${name} as part of its record.`
      : ` ${counts.past} ${kept} ${words.many} keep ${name} as part of their record.`;
  }
  return note;
}

/** Every choice on a list, in alphabetical order, the person's merged in
 *  among the built-ins, retired ones left out. */
export function termChoices(list: GardenTermList, custom: CustomGardenTerm[] = []): GardenTermChoice[] {
  const built: GardenTermChoice[] = BUILT_INS[list].map((entry) => ({ code: entry.code, label: entry.label, help: entry.help, mine: false }));
  const mine: GardenTermChoice[] = custom
    .filter((term) => term.list === list && !term.retiredAt)
    .map((term) => ({ code: term.id, label: term.name, help: null, mine: true }));
  return sortByLabel([...built, ...mine]);
}

/** The choice a stored code reads as, retired terms included, or null for
 *  a code nothing knows. */
export function findTerm(list: GardenTermList, code: string, custom: CustomGardenTerm[] = []): GardenTermChoice | null {
  const built = BUILT_INS[list].find((entry) => entry.code === code);
  if (built) return { code: built.code, label: built.label, help: built.help, mine: false };
  const own = custom.find((term) => term.list === list && term.id === code);
  return own ? { code: own.id, label: own.name, help: null, mine: true } : null;
}

export function termLabel(list: GardenTermList, code: string | null, custom: CustomGardenTerm[] = []): string | null {
  if (!code) return null;
  return findTerm(list, code, custom)?.label ?? null;
}

/** Whether a stored code is off the picker: a removed term, or a retired
 *  one. A built-in never is. */
export function isRetiredTerm(list: GardenTermList, code: string | null, custom: CustomGardenTerm[] = []): boolean {
  if (!code) return false;
  if (BUILT_INS[list].some((entry) => entry.code === code)) return false;
  const own = custom.find((term) => term.list === list && term.id === code);
  return !own || !!own.retiredAt;
}

/** The list to move things to when a term goes: everything but the one
 *  being removed. */
export function replacementTermChoices(list: GardenTermList, removingCode: string, custom: CustomGardenTerm[] = []): GardenTermChoice[] {
  return termChoices(list, custom).filter((entry) => entry.code !== removingCode);
}

/** The plan for removing a term. In use by current equipment: a move is
 *  needed first. Read only by retired equipment: the row is kept, retired.
 *  Neither: the row goes. */
export type TermRemovalPlan = { ok: false; reason: 'needs_move' } | { ok: true; keepRow: boolean };
export function planTermRemoval(counts: { current: number; past: number }, moveTo: string | null): TermRemovalPlan {
  if (counts.current > 0 && !moveTo) return { ok: false, reason: 'needs_move' };
  return { ok: true, keepRow: counts.past > 0 };
}

// --- Fixed lists ------------------------------------------------------------

// The stage and cadence lists are scales and keep their order.
export const PLANT_STAGES: { value: string; label: string }[] = [
  { value: 'seedlings', label: 'Seedlings and cuttings' },
  { value: 'vegetative', label: 'Leafy growth' },
  { value: 'flowering', label: 'Flowering and fruiting' },
  { value: 'all', label: 'Every stage' },
];

export const ONGOING_CADENCES: { value: string; label: string; perMonth: number }[] = [
  { value: 'weekly', label: 'a week', perMonth: 52 / 12 },
  { value: 'monthly', label: 'a month', perMonth: 1 },
  { value: 'yearly', label: 'a year', perMonth: 1 / 12 },
];

export function fixedLabel(options: { value: string; label: string }[], value: string | null): string | null {
  if (!value) return null;
  return options.find((entry) => entry.value === value)?.label ?? null;
}

/** What an ongoing amount comes to per month. Null when either is missing. */
export function monthlyEquivalent(amount: number | null, cadence: string | null): number | null {
  if (amount === null || amount <= 0 || !cadence) return null;
  const entry = ONGOING_CADENCES.find((item) => item.value === cadence);
  return entry ? amount * entry.perMonth : null;
}

// --- Equipment --------------------------------------------------------------

/** One piece of a grow's setup. The light fields are null on anything that
 *  is not a light; the container fields are null on anything that is not a
 *  container. */
export type GrowEquipment = {
  id: string;
  plotId: string;
  kind: string;
  name: string | null;
  quantity: number;
  watts: number | null;
  hoursPerDay: number | null;
  onTimer: boolean;
  lightType: string | null;
  spectrum: string | null;
  plantStage: string | null;
  containerMaterial: string | null;
  containerSize: string | null;
  ongoingAmount: number | null;
  ongoingCadence: string | null;
  /** The finance entry its purchase was recorded as, if one was. */
  purchaseEntryId: string | null;
  notes: string | null;
  retiredAt: string | null;
};

/** The growing-cost kind a piece of equipment's purchase is recorded
 *  under: containers are containers, everything else is equipment. */
export function costKindForEquipment(kind: string): 'containers_structures' | 'tools_equipment' {
  return kind === 'container' ? 'containers_structures' : 'tools_equipment';
}

const DAYS_PER_MONTH = 365.25 / 12;

/** How much a piece draws in a month, from its wattage, its hours a day and
 *  how many of it there are. Null without wattage and hours. */
export function monthlyKwh(item: { watts: number | null; hoursPerDay: number | null; quantity: number }): number | null {
  if (item.watts === null || item.hoursPerDay === null || item.watts <= 0 || item.hoursPerDay <= 0) return null;
  const quantity = item.quantity > 0 ? item.quantity : 1;
  return (item.watts * quantity * item.hoursPerDay * DAYS_PER_MONTH) / 1000;
}

/** A setup's monthly draw: the sum over what is still in use. Pieces without
 *  wattage and hours are counted and named, never guessed at. */
export function summarizeSetupPower(items: GrowEquipment[]): { kwhPerMonth: number; metered: number; unmetered: number } {
  let kwhPerMonth = 0;
  let metered = 0;
  let unmetered = 0;
  for (const item of items) {
    if (item.retiredAt) continue;
    const kwh = monthlyKwh(item);
    if (kwh === null) unmetered += 1;
    else {
      metered += 1;
      kwhPerMonth += kwh;
    }
  }
  return { kwhPerMonth, metered, unmetered };
}

/** A setup's other running costs per month: services, filters, anything
 *  with an amount on a cadence, over what is still in use. */
export function summarizeOngoing(items: GrowEquipment[]): number {
  let total = 0;
  for (const item of items) {
    if (item.retiredAt) continue;
    total += monthlyEquivalent(item.ongoingAmount, item.ongoingCadence) ?? 0;
  }
  return total;
}

/** The one line a piece of equipment reads as under its area. */
export function describeEquipment(item: GrowEquipment, custom: CustomGardenTerm[] = []): string {
  const parts: string[] = [];
  const kind = termLabel('equipment_kind', item.kind, custom) ?? 'Equipment no longer on the list';
  parts.push(item.quantity > 1 ? `${item.quantity} × ${kind}` : kind);
  if (item.kind === 'light') {
    const type = termLabel('light_type', item.lightType, custom);
    if (type) parts.push(type);
    const spectrum = termLabel('light_spectrum', item.spectrum, custom);
    if (spectrum) parts.push(spectrum);
    if (item.plantStage) parts.push(`for ${(fixedLabel(PLANT_STAGES, item.plantStage) ?? item.plantStage).toLowerCase()}`);
  }
  if (item.kind === 'container') {
    const material = termLabel('container_material', item.containerMaterial, custom);
    if (material) parts.push(material.toLowerCase());
    if (item.containerSize) parts.push(item.containerSize);
  }
  if (item.watts !== null && item.watts > 0) parts.push(`${item.watts} W`);
  if (item.hoursPerDay !== null && item.hoursPerDay > 0) parts.push(`${item.hoursPerDay} h a day${item.onTimer ? ' on a timer' : ''}`);
  else if (item.onTimer) parts.push('on a timer');
  const ongoing = monthlyEquivalent(item.ongoingAmount, item.ongoingCadence);
  if (ongoing !== null && item.ongoingAmount !== null && item.ongoingCadence) {
    const cadence = ONGOING_CADENCES.find((entry) => entry.value === item.ongoingCadence);
    parts.push(`${formatTradeMoney(item.ongoingAmount)} ${cadence?.label ?? item.ongoingCadence}`);
  }
  return parts.join(' · ');
}

// --- Electricity ------------------------------------------------------------

export type ElectricityBill = {
  id: string;
  periodStart: string;
  periodEnd: string;
  kwh: number | null;
  amount: number;
  /** Recorded as from before the grow started: the baseline. */
  beforeGrow: boolean;
  notes: string | null;
};

/** Days a bill covers, both ends counted, never less than one. */
export function billDays(bill: { periodStart: string; periodEnd: string }): number {
  const start = Date.parse(`${bill.periodStart}T00:00:00Z`);
  const end = Date.parse(`${bill.periodEnd}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

/** What the bills say a kilowatt-hour costs: total paid over total used,
 *  across every bill that states its kWh. Null when none does. */
export function electricityRate(bills: ElectricityBill[]): number | null {
  let amount = 0;
  let kwh = 0;
  for (const bill of bills) {
    if (bill.kwh !== null && bill.kwh > 0) {
      amount += bill.amount;
      kwh += bill.kwh;
    }
  }
  return kwh > 0 ? amount / kwh : null;
}

type PerDay = { amountPerDay: number; kwhPerDay: number | null; bills: number };

function perDay(bills: ElectricityBill[]): PerDay | null {
  if (bills.length === 0) return null;
  let days = 0;
  let amount = 0;
  let kwh = 0;
  let kwhDays = 0;
  for (const bill of bills) {
    const d = billDays(bill);
    days += d;
    amount += bill.amount;
    if (bill.kwh !== null && bill.kwh > 0) {
      kwh += bill.kwh;
      kwhDays += d;
    }
  }
  return { amountPerDay: amount / days, kwhPerDay: kwhDays > 0 ? kwh / kwhDays : null, bills: bills.length };
}

export type ElectricityComparison = {
  baseline: PerDay | null;
  since: PerDay | null;
  /** What the bills since the grow run above the baseline, per month. Null
   *  until there is one of each. */
  extraPerMonth: number | null;
  extraKwhPerMonth: number | null;
};

/** The bills from before the grow against the bills since, per day so a
 *  28-day bill and a 33-day bill compare fairly. */
export function compareElectricity(bills: ElectricityBill[]): ElectricityComparison {
  const baseline = perDay(bills.filter((bill) => bill.beforeGrow));
  const since = perDay(bills.filter((bill) => !bill.beforeGrow));
  const extraPerMonth = baseline && since ? (since.amountPerDay - baseline.amountPerDay) * DAYS_PER_MONTH : null;
  const extraKwhPerMonth =
    baseline && since && baseline.kwhPerDay !== null && since.kwhPerDay !== null
      ? (since.kwhPerDay - baseline.kwhPerDay) * DAYS_PER_MONTH
      : null;
  return { baseline, since, extraPerMonth, extraKwhPerMonth };
}

/** What a setup's draw would cost a month at the bills' rate. Null without
 *  a rate or a draw. */
export function estimateMonthlyCost(kwhPerMonth: number, rate: number | null): number | null {
  if (rate === null || kwhPerMonth <= 0) return null;
  return kwhPerMonth * rate;
}

function round1(value: number): string {
  return (Math.round(value * 10) / 10).toString();
}

/** The sentence under a setup: its monthly draw, priced when the bills
 *  give a rate. */
export function describeSetupPower(power: { kwhPerMonth: number; metered: number; unmetered: number }, rate: number | null): string {
  if (power.metered === 0) {
    return power.unmetered === 0
      ? 'Nothing recorded here yet.'
      : 'Add wattage and hours a day to each piece and the app works out what the setup draws.';
  }
  const cost = estimateMonthlyCost(power.kwhPerMonth, rate);
  let line = `Runs about ${round1(power.kwhPerMonth)} kWh a month at the wattage and hours recorded`;
  line += cost === null ? '. Record an electricity bill under Growing Costs and the app prices it.' : `, about ${formatTradeMoney(cost)} a month at what your bills say a kWh costs.`;
  if (power.unmetered > 0) line += ` ${power.unmetered === 1 ? '1 piece has' : `${power.unmetered} pieces have`} no wattage or hours recorded and ${power.unmetered === 1 ? 'is' : 'are'} not in that figure.`;
  return line;
}

/** The sentence under the bills. */
export function describeElectricity(comparison: ElectricityComparison): string {
  const { baseline, since } = comparison;
  if (!baseline && !since) return 'Record the bill you have now, before the grow starts, and every bill after it has something to be measured against.';
  if (baseline && !since) {
    return `Before the grow: ${formatTradeMoney(baseline.amountPerDay)} a day${baseline.kwhPerDay !== null ? `, ${round1(baseline.kwhPerDay)} kWh a day` : ''}, from ${baseline.bills === 1 ? 'one bill' : `${baseline.bills} bills`}. Record the bills that come in once the grow is running and the difference shows here.`;
  }
  if (!baseline && since) {
    return 'No bill from before the grow is recorded, so there is nothing to measure these against. Mark a bill as from before the grow, if you have one.';
  }
  const extra = comparison.extraPerMonth ?? 0;
  let line = `Before the grow: ${formatTradeMoney(baseline!.amountPerDay)} a day. Since: ${formatTradeMoney(since!.amountPerDay)} a day.`;
  if (extra > 0) line += ` The grow is running about ${formatTradeMoney(extra)} a month in electricity`;
  else if (extra < 0) line += ` The bills since run about ${formatTradeMoney(-extra)} a month under the baseline, so the grow is not showing on the meter yet`;
  else line += ' The bills since match the baseline';
  if (comparison.extraKwhPerMonth !== null && extra > 0) line += `, ${round1(comparison.extraKwhPerMonth)} kWh a month`;
  return `${line}.`;
}
