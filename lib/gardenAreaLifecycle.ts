// What happens to a garden area and the grows in it over time, decided
// without the database so node scripts/test_garden_area_lifecycle.js can
// check it.
//
// Built 2026-09-21, from "the area should only be able to be removed if a
// grow currently using it is completed. After a grow completes, yes they
// might not be able to use the area anymore, or maybe they are moving and
// will have new areas, so this area they are removing is actually just a
// past area they were using before. Usually a person would want to use the
// information as documentation at the very least."
//
// So an area is never deleted once anything was recorded under it. It is
// moved to Past Areas (garden_plots.archived_at), where its plantings,
// harvests and costs stay readable, and only once every grow in it has
// finished. Delete exists only for an area with nothing recorded under it,
// the one made by mistake. Until this pass a planting's status could not be
// changed from the screen at all; the four values garden_plantings.status
// has always held are now the picker on each planting row.

import type { GardenPlanting } from './db';

export type PlantingStatus = GardenPlanting['status'];

export const PLANTING_STATUS_OPTIONS: { value: PlantingStatus; label: string }[] = [
  { value: 'growing', label: 'Growing' },
  { value: 'harvested', label: 'Harvested' },
  { value: 'failed', label: 'Failed' },
  { value: 'removed', label: 'Pulled out' },
];

export function plantingStatusLabel(status: string): string {
  return PLANTING_STATUS_OPTIONS.find((entry) => entry.value === status)?.label ?? status;
}

/** A grow is finished once its status has moved off growing. */
export function isFinishedPlanting(planting: Pick<GardenPlanting, 'status'>): boolean {
  return planting.status !== 'growing';
}

/** The plantings still growing in an area, which is what stands between it
 *  and Past Areas. */
export function stillGrowing(plantings: Pick<GardenPlanting, 'status'>[]): number {
  return plantings.filter((planting) => !isFinishedPlanting(planting)).length;
}

/** The line shown in place of Move to Past Areas while grows are still
 *  going, or null when the area can move now. */
export function pastAreaBlocker(plantings: Pick<GardenPlanting, 'status'>[]): string | null {
  const count = stillGrowing(plantings);
  if (count === 0) return null;
  const noun = count === 1 ? 'planting is' : 'plantings are';
  return `${count} ${noun} still growing here. Mark each one harvested, failed or pulled out first; the area then moves to Past Areas with everything recorded under it kept.`;
}
