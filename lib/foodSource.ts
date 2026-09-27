// Where each food's numbers come from, said on every food (G11, 2026-09-27).
//
// The reference database draws on ten national food composition tables.
// Until now a food said where it came from only when it was NOT from USDA
// ("Not in USDA: from France (Ciqual)"), so a USDA food said nothing and a
// person comparing two foods could not tell that one set of numbers was
// measured in Tokyo and the other in Maryland. Now every resolved food
// carries one caption naming the table and the country it belongs to, and
// the fallback sentence becomes its second half.
//
// Pure, with no React and no database, so scripts/test_food_source.js
// checks every source the database holds.

type SourceInfo = { table: string; country: string | null };

const SOURCES: Record<string, SourceInfo> = {
  USDA: { table: 'USDA FoodData Central', country: 'United States' },
  Canada_CNF: { table: 'the Canadian Nutrient File', country: 'Canada' },
  UK_CoFID: { table: 'the UK Composition of Foods Integrated Dataset (CoFID)', country: 'United Kingdom' },
  Germany_BLS: { table: 'the German Nutrient Database (BLS)', country: 'Germany' },
  Australia_AFCD: { table: 'the Australian Food Composition Database', country: 'Australia' },
  France_Ciqual: { table: 'the Ciqual food composition table', country: 'France' },
  Japan_MEXT: { table: 'the Standard Tables of Food Composition in Japan (MEXT)', country: 'Japan' },
  Norway_Matvaretabellen: { table: 'the Norwegian Food Composition Table (Matvaretabellen)', country: 'Norway' },
  Sweden_Livsmedelsverket: { table: 'the Swedish Food Agency food database', country: 'Sweden' },
};

// Sources a builder settles on without falling back. Kept in step with
// USDA_PREFERRED_SOURCES in lib/db.ts, which this module cannot import.
const PREFERRED = new Set(['USDA', 'Derived']);

/** The one caption under a resolved food, naming where its numbers come from. */
export function foodSourceCaption(source: string): string {
  if (source === 'Derived') {
    return 'Numbers worked out from USDA figures, since no national table measures this one separately.';
  }
  const info = SOURCES[source];
  const where = info
    ? info.country
      ? `${info.table}, ${info.country}`
      : info.table
    : source;
  const first = `Numbers from ${where}.`;
  if (PREFERRED.has(source)) return first;
  return `${first} USDA has no entry for this food prepared this way.`;
}

/** Every source this module can name, for the test script. */
export const NAMED_SOURCES = Object.keys(SOURCES).concat('Derived');
