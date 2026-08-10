// Real adapter for Sweden's Livsmedelsverket (the Swedish Food Agency).
//
// Unlike Norway, Sweden has no documented public API with a real
// English-language variant -- confirmed earlier this session (see
// CLAUDE.md's own account of the /nb//en/ Norway comparison). The real,
// live path is a direct "download the whole database" export, reverse-
// engineered from the real search UI at
// soknaringsinnehall.livsmedelsverket.se: a POST with an empty body to
// /Spara/HamtaHelaDatabasen returns a real, current XLSX file (confirmed
// live, re-verified this session -- HTTP 200, a genuine
// Content-Disposition attachment, 678,355 bytes).
//
// HONEST LIMITATION, stated directly rather than glossed over: every
// name here is genuinely, only Swedish. There is no source-verified
// English name to carry (unlike Norway's own real /en/ endpoint), so
// `nameEnglish` is deliberately left null for every record -- matching
// classify.js's own real safety rule, every Swedish record will
// correctly land in the "needs human review" bucket until a real,
// verified translation pass happens, not silently guessed at.
//
// REAL COLUMN STRUCTURE, confirmed by direct inspection of the live
// file (not assumed from memory): the actual header row is row index 2
// (0-based) -- rows 0-1 are a title/description banner, not headers.
// 62 real columns; Livsmedelsnamn (name), Livsmedelsnummer (a real,
// stable numeric food id), Gruppering (Sweden's own raw category
// label), then nutrient columns.
//
// NUTRIENT MAPPING -- verified directly against this app's own real,
// current 39-code nutrient vocabulary (same live query already used
// for Norway's own mapping). Real, honest gaps: biotin, caffeine,
// choline, copper, glycine, inositol, manganese, and pantothenic acid
// have no corresponding column anywhere in Sweden's real 62-column
// export at all (not even an always-null one, unlike some of Norway's
// own tracked-but-unmeasured nutrients) -- a real, different gap
// profile from Norway's, worth keeping distinct rather than assuming
// the same nutrients are missing for the same reasons across sources.
// Sub-component columns (individual fatty acids, mono-/di-saccharide
// breakdowns, niacin equivalents, an alternate vitamin-D-inclusive-
// metabolite column, salt as NaCl-equivalent grams) are deliberately
// NOT mapped, to avoid double-counting against the parent total column
// that already covers the same real nutrient.

const SWEDEN_COLUMN_INDEX = {
  name: 0,
  sourceFoodId: 1,
  category: 2,
  energy_kcal: 3,
  fat_total: 5,
  protein: 6,
  carbohydrate: 7,
  fiber_total: 8,
  water: 9,
  sugars_total: 12,
  fat_saturated: 18,
  fat_monounsaturated: 25,
  fat_polyunsaturated: 28,
  cholesterol: 35,
  vitamin_a: 36,
  vitamin_d: 39,
  vitamin_e: 41,
  vitamin_k: 42,
  thiamin_b1: 43,
  riboflavin_b2: 44,
  niacin_b3: 45,
  vitamin_b6: 47,
  folate_b9: 48,
  vitamin_b12: 49,
  vitamin_c: 50,
  phosphorus: 51,
  iodine: 52,
  iron: 53,
  calcium: 54,
  potassium: 55,
  magnesium: 56,
  sodium: 57,
  selenium: 59,
  zinc: 60,
};

function buildNutrients(row) {
  const nutrients = {};
  for (const [code, idx] of Object.entries(SWEDEN_COLUMN_INDEX)) {
    if (['name', 'sourceFoodId', 'category'].includes(code)) continue;
    const v = row[idx];
    if (typeof v === 'number') nutrients[code] = v;
  }
  return nutrients;
}

const HEADER_ROW_INDEX = 2;
const FIRST_DATA_ROW_INDEX = 3;

/**
 * Real, live fetch -- reproduces the exact real POST this session
 * already confirmed working directly against the browser-facing search
 * tool's own export mechanism, no cached file dependency.
 */
async function fetchRealWorkbook() {
  const res = await fetch('https://soknaringsinnehall.livsmedelsverket.se/Spara/HamtaHelaDatabasen', {
    method: 'POST',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
    body: '',
  });
  if (!res.ok) {
    throw new Error(`Livsmedelsverket export request failed: HTTP ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 100000) {
    // Real, concrete sanity check -- the genuine export is consistently
    // several hundred KB; anything drastically smaller almost certainly
    // means an error page or an empty response came back instead of a
    // real workbook, worth failing loudly on rather than trying to
    // parse it and producing confusing downstream errors.
    throw new Error(`Livsmedelsverket export response looks too small to be real (${buffer.length} bytes) -- refusing to parse it as a workbook.`);
  }
  return buffer;
}

async function ingest() {
  const XLSX = require('xlsx');
  const buffer = await fetchRealWorkbook();
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const header = rows[HEADER_ROW_INDEX];
  if (!header || header[0] !== 'Livsmedelsnamn') {
    // Real safety check -- if Livsmedelsverket ever restructures their
    // own export (a genuinely real risk with a hand-reverse-engineered
    // endpoint like this one, unlike Norway's documented API), fail
    // loudly here rather than silently ingesting garbage under wrong
    // column assumptions.
    throw new Error(`Unexpected Livsmedelsverket export header row -- expected 'Livsmedelsnamn' first, got: ${JSON.stringify(header ? header.slice(0, 3) : header)}`);
  }

  const dataRows = rows.slice(FIRST_DATA_ROW_INDEX).filter((r) => r && r[SWEDEN_COLUMN_INDEX.name]);

  return dataRows.map((r) => ({
    sourceFoodId: String(r[SWEDEN_COLUMN_INDEX.sourceFoodId]),
    nameOriginal: r[SWEDEN_COLUMN_INDEX.name],
    nameEnglish: null, // real, honest -- no verified English source exists for Sweden; see this file's own header comment
    latinName: null, // this export carries no scientific-name column at all
    langualCodes: null, // this export carries no LanguaL data at all
    categoryOriginal: r[SWEDEN_COLUMN_INDEX.category],
    nutrients: buildNutrients(r),
    raw: r,
  }));
}

module.exports = {
  sourceCode: 'Sweden_Livsmedelsverket',
  sourceMeta: {
    sourceCode: 'Sweden_Livsmedelsverket',
    displayName: 'Livsmedelsverket',
    countryOrRegion: 'Sweden',
    language: 'sv', // genuinely, only Swedish -- unlike Norway's real 'en' entry, this source's own language field reflects the truth: no verified English exists for this data
    homeUrl: 'https://www.livsmedelsverket.se/',
    licenseOrTerms: 'CC-BY 4.0',
    rawFormat: 'xlsx',
  },
  ingest,
  SWEDEN_COLUMN_INDEX,
};
