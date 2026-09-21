// The kinds of space a garden area is: what garden_plots.space_type holds
// and what its picker offers.
//
// Added 2026-09-20, from "The same needs to be applied for Spaces where
// the grow might be. LED Lights, Hydroponic, and Temperature & Humidity,
// and Not Said yet are all not spaces, they are expenses." The list had
// carried seven values since the New Garden Area wizard was built, three
// of which name equipment rather than a place; those three are retired
// here, and the placeholder that stood for no answer is gone with them.
// What is left is four built-in spaces, plus any the person names, on the
// same footing as a kind of growing cost (KINDS in lib/gardenMoney.ts).
//
// A plot recorded under a retired value still reads by its old name until
// the person changes it, since a record is never blanked by a list change.
// The picker never offers a retired value.
//
// No database here; lib/gardenSpacesDb.ts reads and writes the person's
// spaces, and node scripts/test_garden_spaces.js checks this file.

export type BuiltInGardenSpace = 'in_ground' | 'raised_bed' | 'containers' | 'tent';

export const GARDEN_SPACE_TYPES: { code: BuiltInGardenSpace; label: string }[] = [
  { code: 'in_ground', label: 'In-Ground Plot' },
  { code: 'raised_bed', label: 'Raised Bed' },
  { code: 'containers', label: 'Containers & Pots' },
  { code: 'tent', label: 'Tent' },
];

/** A space the person named. */
export type CustomGardenSpace = { id: string; name: string };

/** A built-in and a person's own seen the same way. */
export type GardenSpaceChoice = {
  code: string;
  label: string;
  /** Whether the person made it, which is the only kind that can be renamed
   *  or removed. */
  mine: boolean;
};

/** Values the picker once offered and no longer does. A plot still holding
 *  one reads by this name. */
export const RETIRED_GARDEN_SPACE_LABELS: Record<string, string> = {
  hydroponic: 'Hydroponic',
  led_lights: 'LED Lights',
  temp_humidity_control: 'Temperature & Humidity Control',
};

/** Every space the picker offers: the built-ins first, in their order,
 *  then the person's, in the order they were added. */
export function gardenSpaceChoices(custom: CustomGardenSpace[] = []): GardenSpaceChoice[] {
  const built: GardenSpaceChoice[] = GARDEN_SPACE_TYPES.map((entry) => ({ code: entry.code, label: entry.label, mine: false }));
  const mine: GardenSpaceChoice[] = custom.map((entry) => ({ code: entry.id, label: entry.name, mine: true }));
  return [...built, ...mine];
}

export function findGardenSpace(code: string, custom: CustomGardenSpace[] = []): GardenSpaceChoice | null {
  return gardenSpaceChoices(custom).find((entry) => entry.code === code) ?? null;
}

/** What a plot's space reads as: a built-in label, the person's name for
 *  it, the old name of a retired value, or null when the plot has no space
 *  or its space was removed. */
export function gardenSpaceLabel(code: string | null | undefined, custom: CustomGardenSpace[] = []): string | null {
  if (!code) return null;
  return findGardenSpace(code, custom)?.label ?? RETIRED_GARDEN_SPACE_LABELS[code] ?? null;
}
