// Compost: what went in, when it was turned and watered, and how it is doing.
//
// 2026-09-20, direct instruction: "Garden should have Compost available as
// a lens that tracks the materials added to the compost, when it was
// turned, watered, and everything else about making good compost."
//
// The Horticulture lens already teaches composting in two entries
// (garden-composting-at-home and garden-hot-composting, lib/digest/
// homeGardening.ts). This is the tool side of the same subject: one record
// per pile, bin or tumbler (compost_piles) and a dated event for everything
// that happens to it (compost_events). The vocabulary and the summary a
// pile is read through live here, with no database in them, so
// scripts/test_compost.js can check the arithmetic.
//
// The guidance a summary gives comes from the same sources the reading
// entries cite and goes no further than they do: the EPA's home composting
// guidance puts browns at two to three parts for every part of greens, wants
// the pile as moist as a wrung-out sponge, and expects a turned pile to
// finish in three to five months; a hot pile holds 131°F (55°C) or more for
// several days to kill weed seeds and most pathogens. Nothing here claims a
// temperature the person did not record or a ratio they did not enter.

export type CompostPileKind = 'pile' | 'bin' | 'tumbler' | 'worm_bin' | 'trench';
export type CompostPileStatus = 'active' | 'curing' | 'finished';
export type CompostEventKind = 'added' | 'turned' | 'watered' | 'temperature' | 'moisture' | 'harvested' | 'applied' | 'note';
export type CompostMaterialClass = 'green' | 'brown' | 'other';
export type CompostMoisture = 'dry' | 'damp' | 'wet';

export const COMPOST_PILE_KINDS: { code: CompostPileKind; label: string }[] = [
  { code: 'pile', label: 'Open pile' },
  { code: 'bin', label: 'Bin' },
  { code: 'tumbler', label: 'Tumbler' },
  { code: 'worm_bin', label: 'Worm bin' },
  { code: 'trench', label: 'Trench' },
];

export const COMPOST_PILE_STATUSES: { code: CompostPileStatus; label: string; help: string }[] = [
  { code: 'active', label: 'Active', help: 'Still taking material.' },
  { code: 'curing', label: 'Curing', help: 'Nothing more going in; left to finish.' },
  { code: 'finished', label: 'Finished', help: 'Used up or emptied.' },
];

export const COMPOST_MATERIAL_CLASSES: { code: CompostMaterialClass; label: string; help: string }[] = [
  { code: 'green', label: 'Green', help: 'Wet and nitrogen-rich: kitchen scraps, grass clippings, coffee grounds, fresh manure.' },
  { code: 'brown', label: 'Brown', help: 'Dry and carbon-rich: dead leaves, straw, shredded paper and cardboard, wood chips.' },
  { code: 'other', label: 'Other', help: 'Finished compost, soil, a starter, water.' },
];

export const COMPOST_MOISTURE_LEVELS: { code: CompostMoisture; label: string; help: string }[] = [
  { code: 'dry', label: 'Dry', help: 'Crumbles, no water when squeezed.' },
  { code: 'damp', label: 'Damp', help: 'Like a wrung-out sponge. Where you want it.' },
  { code: 'wet', label: 'Wet', help: 'Drips when squeezed.' },
];

/** Common materials offered as a starting list; free text is always allowed. */
export const COMPOST_MATERIAL_SUGGESTIONS: { name: string; materialClass: CompostMaterialClass }[] = [
  { name: 'Kitchen scraps', materialClass: 'green' },
  { name: 'Coffee grounds', materialClass: 'green' },
  { name: 'Grass clippings', materialClass: 'green' },
  { name: 'Garden trimmings', materialClass: 'green' },
  { name: 'Fresh manure', materialClass: 'green' },
  { name: 'Eggshells', materialClass: 'other' },
  { name: 'Dead leaves', materialClass: 'brown' },
  { name: 'Straw', materialClass: 'brown' },
  { name: 'Shredded paper', materialClass: 'brown' },
  { name: 'Cardboard', materialClass: 'brown' },
  { name: 'Wood chips', materialClass: 'brown' },
  { name: 'Sawdust', materialClass: 'brown' },
  { name: 'Finished compost', materialClass: 'other' },
  { name: 'Garden soil', materialClass: 'other' },
];

export const COMPOST_EVENT_LABELS: Record<CompostEventKind, string> = {
  added: 'Added material',
  turned: 'Turned',
  watered: 'Watered',
  temperature: 'Temperature',
  moisture: 'Moisture check',
  harvested: 'Took out finished compost',
  applied: 'Applied to a plot',
  note: 'Note',
};

export type CompostPile = {
  id: string;
  name: string;
  kind: CompostPileKind;
  startedOn: string;
  location: string | null;
  status: CompostPileStatus;
  notes: string | null;
};

export type CompostEvent = {
  id: string;
  pileId: string;
  occurredOn: string;
  kind: CompostEventKind;
  material: string | null;
  materialClass: CompostMaterialClass | null;
  amount: number | null;
  unit: string;
  temperature: number | null;
  temperatureUnit: 'c' | 'f' | null;
  moisture: CompostMoisture | null;
  plotId: string | null;
  financeEntryId: string | null;
  note: string | null;
};

export type CompostPileSummary = {
  greenAdditions: number;
  brownAdditions: number;
  daysSinceStarted: number;
  daysSinceTurned: number | null;
  daysSinceWatered: number | null;
  lastTemperature: { value: number; unit: 'c' | 'f'; on: string } | null;
  lastMoisture: { level: CompostMoisture; on: string } | null;
  harvestedCount: number;
  /** One or two short sentences about what the pile needs, from what was
   *  recorded and nothing else. */
  guidance: string[];
};

function daysBetween(fromDate: string, toDate: string): number {
  const from = Date.UTC(Number(fromDate.slice(0, 4)), Number(fromDate.slice(5, 7)) - 1, Number(fromDate.slice(8, 10)));
  const to = Date.UTC(Number(toDate.slice(0, 4)), Number(toDate.slice(5, 7)) - 1, Number(toDate.slice(8, 10)));
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

function latest(events: CompostEvent[], kind: CompostEventKind): CompostEvent | null {
  let found: CompostEvent | null = null;
  for (const event of events) {
    if (event.kind !== kind) continue;
    if (!found || event.occurredOn > found.occurredOn) found = event;
  }
  return found;
}

export function isHotTemperature(value: number, unit: 'c' | 'f'): boolean {
  return unit === 'f' ? value >= 131 : value >= 55;
}

export function summarizeCompostPile(pile: CompostPile, events: CompostEvent[], today: string): CompostPileSummary {
  const own = events.filter((event) => event.pileId === pile.id);
  const greenAdditions = own.filter((event) => event.kind === 'added' && event.materialClass === 'green').length;
  const brownAdditions = own.filter((event) => event.kind === 'added' && event.materialClass === 'brown').length;
  const lastTurned = latest(own, 'turned');
  const lastWatered = latest(own, 'watered');
  const lastTemp = latest(own, 'temperature');
  const lastMoist = latest(own, 'moisture');
  const harvestedCount = own.filter((event) => event.kind === 'harvested').length;

  const summary: CompostPileSummary = {
    greenAdditions,
    brownAdditions,
    daysSinceStarted: daysBetween(pile.startedOn, today),
    daysSinceTurned: lastTurned ? daysBetween(lastTurned.occurredOn, today) : null,
    daysSinceWatered: lastWatered ? daysBetween(lastWatered.occurredOn, today) : null,
    lastTemperature:
      lastTemp && lastTemp.temperature !== null && lastTemp.temperatureUnit
        ? { value: lastTemp.temperature, unit: lastTemp.temperatureUnit, on: lastTemp.occurredOn }
        : null,
    lastMoisture: lastMoist && lastMoist.moisture ? { level: lastMoist.moisture, on: lastMoist.occurredOn } : null,
    harvestedCount,
    guidance: [],
  };

  if (pile.status === 'finished') return summary;

  // Balance. The EPA guidance is two to three parts browns to one of greens
  // by volume; additions are counted rather than measured, since most
  // people never weigh a bucket of scraps, so the line is worded as a lean
  // and not a ratio.
  if (greenAdditions + brownAdditions >= 3) {
    if (brownAdditions < greenAdditions) {
      summary.guidance.push(
        'More greens than browns so far. Browns should be about two to three parts for every one of greens; add dead leaves, straw or shredded cardboard.',
      );
    } else if (brownAdditions >= greenAdditions * 4) {
      summary.guidance.push('Heavy on browns. A pile this dry breaks down slowly; add kitchen scraps or grass clippings.');
    }
  }

  // Moisture, from the last hand check only.
  if (summary.lastMoisture?.level === 'dry') {
    summary.guidance.push('Dry at the last check. Water it until it feels like a wrung-out sponge.');
  } else if (summary.lastMoisture?.level === 'wet') {
    summary.guidance.push('Wet at the last check. Turn it and add browns so it can drain and breathe.');
  }

  // Turning. Only said for an active pile; a curing pile is left alone by
  // definition.
  if (pile.status === 'active') {
    if (summary.daysSinceTurned === null && summary.daysSinceStarted >= 7) {
      summary.guidance.push('Not turned yet. Turning brings air in and keeps a pile from going sour.');
    } else if (summary.daysSinceTurned !== null && summary.daysSinceTurned >= 14) {
      summary.guidance.push(`${summary.daysSinceTurned} days since it was turned. A pile turned every week or two finishes in three to five months.`);
    }
  }

  // Heat, from the last reading only.
  if (summary.lastTemperature) {
    if (isHotTemperature(summary.lastTemperature.value, summary.lastTemperature.unit)) {
      summary.guidance.push('Hot at the last reading, 131°F (55°C) or more. Held there for a few days it kills weed seeds and most pathogens.');
    } else if (summary.daysSinceStarted >= 14 && greenAdditions + brownAdditions >= 3) {
      summary.guidance.push('Below 131°F (55°C) at the last reading. A cool pile still finishes, more slowly; more greens, water and a turn will heat it.');
    }
  }

  return summary;
}

export function describeCompostEvent(event: CompostEvent): string {
  switch (event.kind) {
    case 'added': {
      const what = event.material?.trim() || 'material';
      const amount = event.amount !== null && event.amount > 0 ? ` (${formatCompostAmount(event.amount, event.unit)})` : '';
      const cls = event.materialClass && event.materialClass !== 'other' ? `, ${event.materialClass}` : '';
      return `Added ${what}${amount}${cls}`;
    }
    case 'temperature':
      return event.temperature !== null && event.temperatureUnit
        ? `${event.temperature}°${event.temperatureUnit.toUpperCase()}`
        : 'Temperature';
    case 'moisture':
      return event.moisture ? `${COMPOST_MOISTURE_LEVELS.find((entry) => entry.code === event.moisture)?.label ?? event.moisture} at a squeeze test` : 'Moisture check';
    case 'harvested':
      return event.amount !== null && event.amount > 0
        ? `Took out ${formatCompostAmount(event.amount, event.unit)} of finished compost`
        : 'Took out finished compost';
    case 'applied':
      return event.amount !== null && event.amount > 0
        ? `Applied ${formatCompostAmount(event.amount, event.unit)} to a plot`
        : 'Applied to a plot';
    case 'note':
      return event.note?.trim() || 'Note';
    default:
      return COMPOST_EVENT_LABELS[event.kind];
  }
}

export function formatCompostAmount(amount: number, unit: string): string {
  const rounded = Math.round(amount * 100) / 100;
  return unit.trim() ? `${rounded} ${unit.trim()}` : String(rounded);
}

export const COMPOST_AMOUNT_UNITS = ['bucket', 'bag', 'wheelbarrow', 'handful', 'L', 'gal', 'kg', 'lb'] as const;

/** How many days between turnings the reminder offers. */
export const COMPOST_TURN_INTERVALS = [3, 5, 7, 10, 14] as const;
