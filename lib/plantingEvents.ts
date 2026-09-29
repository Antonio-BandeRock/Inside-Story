// What was done to each planting (I14, 2026-09-28): watered, fed, pruned, a
// pest seen, one entry per thing done on one day, kept in
// garden_planting_events. The kinds are an open list (planting_event_kind
// in lib/growSetup.ts). Pure: no I/O, so scripts/test_planting_events.js can
// check every sentence.
//
// A record of care is a count of what was done, never a judgement of it.
// Nothing here says a planting was watered too little or fed too much, and
// where the counts stand beside a harvest (Trends > Garden Yield) they are
// what was recorded before the first picking, with the plain limit that one
// garden cannot say which of them made the difference.

export type PlantingEventRecord = {
  id: string;
  plantingId: string;
  plotId: string | null;
  occurredOn: string;
  kind: string;
  note: string | null;
  createdAt: string;
};

export type KindCount = { kind: string; label: string; count: number; lastOn: string };

/** How many times each kind was done, most often first, then by name. */
export function countByKind(
  events: Pick<PlantingEventRecord, 'kind' | 'occurredOn'>[],
  labelFor: (kind: string) => string,
): KindCount[] {
  const byKind = new Map<string, KindCount>();
  for (const event of events) {
    const found = byKind.get(event.kind);
    if (found) {
      found.count += 1;
      if (event.occurredOn > found.lastOn) found.lastOn = event.occurredOn;
    } else {
      byKind.set(event.kind, { kind: event.kind, label: labelFor(event.kind), count: 1, lastOn: event.occurredOn });
    }
  }
  return [...byKind.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** "Watered (12), Fed (3), Pest seen (1)": the label as the person picked
 *  it, and the count beside it, which reads right for every kind anybody
 *  might name. */
export function countsLine(counts: KindCount[]): string {
  return counts.map((entry) => `${entry.label} (${entry.count})`).join(', ');
}

/** The line under a planting's name before its record is opened. */
export function plantingCareSummary(counts: KindCount[]): string {
  if (counts.length === 0) return 'Nothing recorded as done to it yet.';
  const total = counts.reduce((sum, entry) => sum + entry.count, 0);
  return `${total} ${total === 1 ? 'entry' : 'entries'}: ${countsLine(counts)}.`;
}

/** Newest first, the order the record reads in: by the day it was done,
 *  then by when it was entered. */
export function sortEventsNewestFirst<T extends Pick<PlantingEventRecord, 'occurredOn' | 'createdAt'>>(events: T[]): T[] {
  return [...events].sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt));
}

/** Whether a typed date is a plain YYYY-MM-DD that exists. */
export function isPlainDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const at = new Date(Date.UTC(y, m - 1, d));
  return at.getUTCFullYear() === y && at.getUTCMonth() === m - 1 && at.getUTCDate() === d;
}

/** Why an entry cannot be saved yet, or null when it can. A date after
 *  today is refused, since this is a record of what was done; what is still
 *  to do belongs to a garden task. A date before the planting went in is
 *  allowed, since a bed is often fed or mulched before sowing. */
export function entryProblem(input: { kind: string | null; occurredOn: string; today: string }): string | null {
  if (!input.kind) return 'Pick what was done.';
  if (!isPlainDate(input.occurredOn)) return 'Enter the day as YYYY-MM-DD.';
  if (input.occurredOn > input.today) return 'That day has not come yet. This is a record of what was done; a garden task holds what is still to do.';
  return null;
}

// --- Beside the harvest (Trends > Garden Yield) -----------------------------

/** A planting picked in the range, as Trends > Garden Yield reads it. */
export type PickedPlanting = {
  id: string;
  foodName: string;
  plotName: string | null;
  plantedOn: string;
  firstHarvestOn: string | null;
};

/** An entry with its kind's label already resolved, for the yield band. */
export type CareEvent = { plantingId: string; occurredOn: string; kind: string; label: string };

export type CareRow = { plantingId: string; title: string; line: string };

export type CareBand = {
  hasAnything: boolean;
  headline: string;
  rows: CareRow[];
  caveat: string;
};

export const CARE_CAVEAT =
  'These are what was recorded beside each crop, set next to when it was first picked. One garden over a few seasons cannot say which of them made the difference, and anything done but not recorded is not counted.';

/** What was recorded as done to each planting picked in the range, from
 *  the day it went in up to its first picking. Entries before the planting
 *  went in count too when they are on the planting itself, since a bed fed
 *  before sowing was fed for that crop. */
export function summarizeCareBeforePicking(plantings: PickedPlanting[], events: CareEvent[]): CareBand {
  const picked = plantings.filter((planting) => planting.firstHarvestOn);
  const byPlanting = new Map<string, CareEvent[]>();
  for (const event of events) {
    const list = byPlanting.get(event.plantingId) ?? [];
    list.push(event);
    byPlanting.set(event.plantingId, list);
  }
  const rows: CareRow[] = [];
  let without = 0;
  for (const planting of picked) {
    const before = (byPlanting.get(planting.id) ?? []).filter((event) => event.occurredOn <= (planting.firstHarvestOn as string));
    const title = planting.plotName ? `${planting.foodName}, ${planting.plotName}` : planting.foodName;
    if (before.length === 0) {
      without += 1;
      continue;
    }
    const labels = new Map(before.map((event) => [event.kind, event.label]));
    const counts = countByKind(before, (kind) => labels.get(kind) ?? kind);
    rows.push({
      plantingId: planting.id,
      title,
      line: `Before its first picking on ${planting.firstHarvestOn}: ${countsLine(counts)}.`,
    });
  }
  let headline: string;
  if (picked.length === 0) headline = 'No planting had its first picking in this range.';
  else if (rows.length === 0) {
    headline = `${picked.length} ${picked.length === 1 ? 'planting was' : 'plantings were'} first picked in this range, with nothing recorded as done to ${picked.length === 1 ? 'it' : 'them'} beforehand.`;
  } else if (picked.length === 1) {
    headline = 'The one planting first picked in this range has a record of what was done beforehand.';
  } else {
    headline = `${rows.length} of the ${picked.length} ${picked.length === 1 ? 'planting' : 'plantings'} first picked in this range ${rows.length === 1 ? 'has' : 'have'} a record of what was done beforehand.`;
    if (without > 0) headline += ` ${without} ${without === 1 ? 'has' : 'have'} none.`;
  }
  return { hasAnything: rows.length > 0, headline, rows, caveat: CARE_CAVEAT };
}
