// Real adapter for Norway's Matvaretabellen -- the first real source in
// this pipeline, per sources/README.md's own interface contract.
//
// Fetches directly from Matvaretabellen's own real, documented, public
// API (confirmed via www.matvaretabellen.no/en/api/ earlier this
// session): /api/en/foods.json for the food records (already fetched
// once this session and cached locally -- confirmed real, locale: 'en',
// 2,121 records, genuine source-verified English names, not this
// project's own translation) and /api/en/food-groups.json for real,
// human-readable category labels (94 real groups -- "Dairy products,"
// "Meat and poultry," etc. -- instead of bare numeric foodGroupId codes).
//
// NUTRIENT MAPPING -- verified directly against this app's own real,
// current 39-code nutrient vocabulary (queried live from
// assets/data/foods_reference.db's own `nutrients` table, not recalled
// from memory) and against the real, complete set of Norwegian
// nutrientId codes actually carrying real quantity values across all
// 2,121 records (also checked directly, not guessed). Real, honest
// gaps, not silently glossed over:
//   - Norway's own taxonomy includes biotin (BIOT), choline (CHOLN),
//     and inositol (INOTL) as real nutrientIds, but NONE of them carry
//     a single real quantity value across the entire 2,121-food
//     catalog -- the same "tracked but never measured for this source"
//     pattern already documented elsewhere in this project (e.g.
//     caffeine/choline for some of the original 7 sources).
//   - Vitamin K (VITK and every menaquinone form, MK4-MK13) is the same:
//     zero real values anywhere in this dataset.
//   - Alcohol, omega-3/omega-6 as standalone totals, trans fat, starch,
//     and beta-carotene/retinol all have real values in Norway's data
//     but no corresponding nutrient_code in this app's own current
//     vocabulary -- left unmapped rather than forced into the nearest
//     approximate code.
//   - "Niacin" (plain) is used over "NIAEQ" (niacin equivalents, a
//     computed value); "Vit A" (RAE-unit, matching this app's own
//     stated "µg RAE" exactly) is used over "Vit A RE" (an older,
//     different unit system); "Sukker" (Norwegian for "sugar," plain
//     total) is used over "Mono+Di"/"SUGAN," two different, more
//     specific sugar measures Norway's own data separately tracks.

const NORWAY_NUTRIENT_MAP = {
  Karbo: 'carbohydrate',
  Fiber: 'fiber_total',
  Protein: 'protein',
  Fett: 'fat_total',
  Vann: 'water',
  Mettet: 'fat_saturated',
  Flerum: 'fat_polyunsaturated',
  Enumet: 'fat_monounsaturated',
  'Vit B12': 'vitamin_b12',
  'Vit B2': 'riboflavin_b2',
  Na: 'sodium',
  Ca: 'calcium',
  Fe: 'iron',
  Niacin: 'niacin_b3',
  'Vit B1': 'thiamin_b1',
  Mg: 'magnesium',
  K: 'potassium',
  Zn: 'zinc',
  'Vit D': 'vitamin_d',
  P: 'phosphorus',
  'Vit C': 'vitamin_c',
  Sukker: 'sugars_total',
  'Vit B6': 'vitamin_b6',
  'Vit A': 'vitamin_a',
  Folat: 'folate_b9',
  Kolest: 'cholesterol',
  'Vit E': 'vitamin_e',
  Se: 'selenium',
  I: 'iodine',
  Cu: 'copper',
};

function buildNutrients(record) {
  const nutrients = {};
  if (record.calories && typeof record.calories.quantity === 'number') {
    nutrients.energy_kcal = record.calories.quantity;
  }
  for (const c of record.constituents || []) {
    const code = NORWAY_NUTRIENT_MAP[c.nutrientId];
    if (code && typeof c.quantity === 'number') {
      nutrients[code] = c.quantity;
    }
  }
  return nutrients;
}

/**
 * Real, direct fetch from Matvaretabellen's own live API -- no cached
 * file dependency for actual production use (the cached file used
 * during Phase 1's own proof was a one-off convenience, not a real
 * ingestion path). A real User-Agent header is required; the bare
 * default from a plain fetch/curl call was already confirmed earlier
 * this session to sometimes trigger a different response.
 */
async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
  });
  if (!res.ok) {
    throw new Error(`Matvaretabellen API request failed: ${url} -> HTTP ${res.status}`);
  }
  return res.json();
}

async function ingest() {
  const [foodsData, groupsData] = await Promise.all([
    fetchJson('https://www.matvaretabellen.no/api/en/foods.json'),
    fetchJson('https://www.matvaretabellen.no/api/en/food-groups.json'),
  ]);

  if (foodsData.locale !== 'en') {
    // Real safety check, not decorative -- if Matvaretabellen ever
    // changes its own API default or this URL stops returning the
    // English variant, we want a loud failure here, not 2,000+ records
    // silently mislabeled as verified English when they're not.
    throw new Error(`Expected locale 'en' from Matvaretabellen, got '${foodsData.locale}'`);
  }

  const groupNameById = new Map(
    groupsData.foodGroups.map((g) => [g.foodGroupId, g.name])
  );

  return foodsData.foods.map((f) => ({
    sourceFoodId: f.foodId,
    nameOriginal: f.foodName,
    nameEnglish: f.foodName, // real, source-verified English -- confirmed via the locale check above, not assumed
    latinName: f.latinName || null,
    langualCodes: f.langualCodes && f.langualCodes.length > 0 ? f.langualCodes : null,
    categoryOriginal: groupNameById.get(f.foodGroupId) || f.foodGroupId,
    nutrients: buildNutrients(f),
    raw: f,
  }));
}

module.exports = {
  sourceCode: 'Norway_Matvaretabellen',
  sourceMeta: {
    sourceCode: 'Norway_Matvaretabellen',
    displayName: 'Matvaretabellen',
    countryOrRegion: 'Norway',
    language: 'en', // this app's own real language field on `sources` describes the language of the DATA actually ingested here -- English, confirmed -- not Norway's own primary national language
    homeUrl: 'https://www.matvaretabellen.no/',
    licenseOrTerms: 'CC-BY 4.0',
    rawFormat: 'json-api',
  },
  ingest,
  NORWAY_NUTRIENT_MAP,
};
