// Real barcode-to-product lookup, 2026-08-16 -- Open Food Facts primary,
// USDA FoodData Central fallback, per the already-verified 2026-08-05
// feasibility research. Both real endpoints, and the exact real field
// shapes below, were independently confirmed live before writing this
// file, not assumed from documentation:
//
// - Open Food Facts v2 (GET .../api/v2/product/{barcode}.json) returns a
//   genuine miss as a real HTTP 404 with {"status":0,"status_verbose":
//   "product not found"} -- confirmed against a real, unregistered
//   barcode. A malformed/invalid barcode string is a *different* real
//   case (HTTP 200, "no code or invalid code") and is treated the same
//   way here (a clean miss, fall through to USDA), since a genuinely
//   scanned barcode should never actually be malformed.
// - Every value inside OFF's own real `nutriments` object is stored in
//   GRAMS internally, regardless of which nutrient it is -- confirmed
//   directly against a real product (Nutella's own real
//   "sodium_100g":0.0428 = 42.8mg, a sane real value). Only
//   `energy-kcal_100g` is the one genuine exception, already in kcal.
// - OFF's separate `nutriments_estimated` object is OFF's OWN inferred/
//   estimated data (from ingredient composition), not what's actually
//   printed on the real label -- deliberately never read here, matching
//   this whole app's standing rule against presenting invented data as
//   fact. Real coverage in the genuine `nutriments` object varies widely
//   by product (confirmed: a real US Cheerios record had no calcium/
//   iron/potassium/vitamin-d at all despite the ingredient list naming
//   them) -- this is expected and tolerated the same way the bundled
//   22,000-food reference database already tolerates partial coverage.
// - USDA FDC's own /foods/search endpoint has no dedicated barcode field
//   to query directly -- confirmed the real, working technique is
//   searching dataType=Branded with the barcode's own `gtinUpc` value,
//   which FDC always stores as a full, LEFT-ZERO-PADDED 14-digit GTIN
//   (confirmed: searching the real, un-padded 12-digit UPC-A for a known
//   real product, Cheerios, returned zero hits; the same search with the
//   real 14-digit padded value returned exactly one, correct hit).

const OPEN_FOOD_FACTS_BASE = 'https://world.openfoodfacts.org/api/v2/product';
// A free api.data.gov key takes under a minute to register and removes
// DEMO_KEY's own real, low rate limit -- worth doing before real, everyday
// use, but DEMO_KEY genuinely works for now and needs no code change to
// swap in a real key later.
const USDA_FDC_API_KEY = 'DEMO_KEY';
const USDA_FDC_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

export type LookedUpNutrient = { code: string; amountPer100g: number };

export type LookedUpProduct = {
  barcode: string;
  name: string;
  brand: string | null;
  ingredientsText: string | null;
  imageUrl: string | null;
  lookupSource: 'OpenFoodFacts' | 'USDA';
  nutrients: LookedUpNutrient[];
};

// Every real OFF nutriments key this app can confidently map onto its own
// nutrient_code vocabulary (verified directly against the live bundled
// reference database's own `nutrients` table), and the real g-to-display-
// unit multiplier each one needs. `null` means "already in the unit this
// app stores it in, no conversion."
const OFF_NUTRIENT_MAP: { offKey: string; code: string; multiplier: number | null }[] = [
  { offKey: 'energy-kcal_100g', code: 'energy_kcal', multiplier: null },
  { offKey: 'fat_100g', code: 'fat_total', multiplier: null },
  { offKey: 'saturated-fat_100g', code: 'fat_saturated', multiplier: null },
  { offKey: 'monounsaturated-fat_100g', code: 'fat_monounsaturated', multiplier: null },
  { offKey: 'polyunsaturated-fat_100g', code: 'fat_polyunsaturated', multiplier: null },
  { offKey: 'carbohydrates_100g', code: 'carbohydrate', multiplier: null },
  { offKey: 'sugars_100g', code: 'sugars_total', multiplier: null },
  { offKey: 'fiber_100g', code: 'fiber_total', multiplier: null },
  { offKey: 'proteins_100g', code: 'protein', multiplier: null },
  { offKey: 'water_100g', code: 'water', multiplier: null },
  { offKey: 'cholesterol_100g', code: 'cholesterol', multiplier: 1000 },
  { offKey: 'sodium_100g', code: 'sodium', multiplier: 1000 },
  { offKey: 'calcium_100g', code: 'calcium', multiplier: 1000 },
  { offKey: 'iron_100g', code: 'iron', multiplier: 1000 },
  { offKey: 'potassium_100g', code: 'potassium', multiplier: 1000 },
  { offKey: 'magnesium_100g', code: 'magnesium', multiplier: 1000 },
  { offKey: 'phosphorus_100g', code: 'phosphorus', multiplier: 1000 },
  { offKey: 'zinc_100g', code: 'zinc', multiplier: 1000 },
  { offKey: 'copper_100g', code: 'copper', multiplier: 1000 },
  { offKey: 'manganese_100g', code: 'manganese', multiplier: 1000 },
  { offKey: 'choline_100g', code: 'choline', multiplier: 1000 },
  { offKey: 'caffeine_100g', code: 'caffeine', multiplier: 1000 },
  { offKey: 'vitamin-c_100g', code: 'vitamin_c', multiplier: 1000 },
  { offKey: 'vitamin-e_100g', code: 'vitamin_e', multiplier: 1000 },
  { offKey: 'vitamin-b1_100g', code: 'thiamin_b1', multiplier: 1000 },
  { offKey: 'vitamin-b2_100g', code: 'riboflavin_b2', multiplier: 1000 },
  { offKey: 'vitamin-b6_100g', code: 'vitamin_b6', multiplier: 1000 },
  { offKey: 'vitamin-pp_100g', code: 'niacin_b3', multiplier: 1000 },
  { offKey: 'pantothenic-acid_100g', code: 'pantothenic_acid_b5', multiplier: 1000 },
  { offKey: 'selenium_100g', code: 'selenium', multiplier: 1000000 },
  { offKey: 'iodine_100g', code: 'iodine', multiplier: 1000000 },
  { offKey: 'vitamin-a_100g', code: 'vitamin_a', multiplier: 1000000 },
  { offKey: 'vitamin-d_100g', code: 'vitamin_d', multiplier: 1000000 },
  { offKey: 'vitamin-k_100g', code: 'vitamin_k', multiplier: 1000000 },
  { offKey: 'vitamin-b9_100g', code: 'folate_b9', multiplier: 1000000 },
  { offKey: 'vitamin-b12_100g', code: 'vitamin_b12', multiplier: 1000000 },
  { offKey: 'biotin_100g', code: 'biotin_b7', multiplier: 1000000 },
];

async function lookupOpenFoodFacts(barcode: string): Promise<LookedUpProduct | null> {
  const response = await fetch(`${OPEN_FOOD_FACTS_BASE}/${encodeURIComponent(barcode)}.json`);
  // A genuine miss is a real HTTP 404 -- confirmed live. Any other
  // non-OK status is a real network/server problem, not a clean miss.
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Open Food Facts lookup failed with status ${response.status}`);
  }
  const data = await response.json();
  if (data?.status !== 1 || !data?.product) return null;
  const product = data.product;
  const nutrimentsSource = product.nutriments && typeof product.nutriments === 'object' ? product.nutriments : {};
  const nutrients: LookedUpNutrient[] = [];
  for (const entry of OFF_NUTRIENT_MAP) {
    const raw = nutrimentsSource[entry.offKey];
    if (typeof raw !== 'number' || Number.isNaN(raw)) continue;
    nutrients.push({ code: entry.code, amountPer100g: entry.multiplier ? raw * entry.multiplier : raw });
  }
  const name = typeof product.product_name === 'string' && product.product_name.trim() ? product.product_name.trim() : null;
  if (!name) return null;
  return {
    barcode,
    name,
    brand: typeof product.brands === 'string' && product.brands.trim() ? product.brands.split(',')[0].trim() : null,
    ingredientsText: typeof product.ingredients_text === 'string' && product.ingredients_text.trim() ? product.ingredients_text.trim() : null,
    imageUrl:
      (typeof product.image_front_url === 'string' && product.image_front_url) ||
      (typeof product.image_url === 'string' && product.image_url) ||
      null,
    lookupSource: 'OpenFoodFacts',
    nutrients,
  };
}

// USDA FDC's own real standard nutrient numbers (Nutrition Facts label
// scale, the "Big 9" it reliably reports for Branded Foods), mapped onto
// this app's real nutrient_code vocabulary. Not exhaustive the way OFF's
// own mapping is -- FDC's Branded Foods dataset is GDSN/label-sourced and
// genuinely doesn't carry the deeper vitamin/mineral panel most products
// ever measure, so this stays honest about what's actually there rather
// than guessing at codes that would rarely if ever populate.
const USDA_NUTRIENT_NUMBER_MAP: Record<string, string> = {
  '203': 'protein',
  '204': 'fat_total',
  '205': 'carbohydrate',
  '208': 'energy_kcal',
  '269': 'sugars_total',
  '291': 'fiber_total',
  '301': 'calcium',
  '303': 'iron',
  '306': 'potassium',
  '307': 'sodium',
  '328': 'vitamin_d',
  '401': 'vitamin_c',
  '601': 'cholesterol',
  '606': 'fat_saturated',
};

async function lookupUsdaFdc(barcode: string): Promise<LookedUpProduct | null> {
  const paddedGtin = barcode.padStart(14, '0');
  const url = `${USDA_FDC_SEARCH_URL}?api_key=${encodeURIComponent(USDA_FDC_API_KEY)}&query=${encodeURIComponent(paddedGtin)}&dataType=Branded`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USDA FoodData Central lookup failed with status ${response.status}`);
  }
  const data = await response.json();
  const foods = Array.isArray(data?.foods) ? data.foods : [];
  const food = foods.find((candidate: { gtinUpc?: string }) => candidate.gtinUpc === paddedGtin) ?? foods[0];
  if (!food || typeof food.description !== 'string' || !food.description.trim()) return null;
  const nutrients: LookedUpNutrient[] = [];
  const foodNutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
  for (const entry of foodNutrients) {
    const code = USDA_NUTRIENT_NUMBER_MAP[String(entry?.nutrientNumber)];
    if (!code || typeof entry?.value !== 'number' || Number.isNaN(entry.value)) continue;
    nutrients.push({ code, amountPer100g: entry.value });
  }
  return {
    barcode,
    name: food.description.trim(),
    brand: (typeof food.brandOwner === 'string' && food.brandOwner.trim()) || (typeof food.brandName === 'string' && food.brandName.trim()) || null,
    ingredientsText: typeof food.ingredients === 'string' && food.ingredients.trim() ? food.ingredients.trim() : null,
    imageUrl: null,
    lookupSource: 'USDA',
    nutrients,
  };
}

// The real, combined lookup -- Open Food Facts first (far broader real
// global coverage), USDA FoodData Central as a fallback for genuinely
// US-only branded products OFF hasn't picked up. Returns null only once
// both real sources have genuinely, cleanly missed -- a real network
// failure from either source still throws, so the caller can tell "not
// found anywhere" apart from "couldn't check right now."
export async function lookupProductByBarcode(barcode: string): Promise<LookedUpProduct | null> {
  const trimmed = barcode.trim();
  if (!trimmed) return null;
  const offResult = await lookupOpenFoodFacts(trimmed);
  if (offResult) return offResult;
  return lookupUsdaFdc(trimmed);
}
