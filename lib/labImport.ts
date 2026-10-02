// Labs without typing (G28, 2026-10-02): a whole lab sheet in at once, by a
// photo read on the phone (lib/ocr.ts), a pasted table or CSV, or a form
// holding a whole panel. Everything read lands as a row the person checks
// and confirms one at a time; nothing is saved that was not confirmed.
//
// Reading is word matching, not understanding: a line becomes a row when it
// has a name followed by a number, and the name is matched against the
// app's lab tests, their other names, and the tests the person has added.
// The value, unit and range are kept exactly as the sheet prints them. No
// unit is converted, and no row is called high, low or normal by the app;
// a flag the lab printed is shown as the lab printed it.
//
// Pure, with no imports, so scripts/test_lab_import.js checks it without a
// phone.

export type LabTestKey = {
  code: string;
  displayName: string;
  aliases: string | null;
  rangeUnit: string | null;
  categoryCode: string;
  isOwn?: boolean;
  retiredAt?: string | null;
};

export type ParsedLabRow = {
  /** The line as it was read, for the person to check against. */
  printed: string;
  /** The test name as printed. */
  name: string;
  testCode: string | null;
  value: number;
  /** The value as printed, which keeps a "<" or ">" the number drops. */
  valueText: string;
  unit: string;
  low: number | null;
  high: number | null;
  /** H, L, A or the like, exactly as printed. */
  flag: string | null;
  /** A date in this row's own column, when a CSV carries one. */
  testedAt: string | null;
};

export type SheetDate =
  | { kind: 'found'; date: string; printed: string }
  | { kind: 'ambiguous'; printed: string }
  | { kind: 'none' };

// ---------------------------------------------------------------------------
// Names

function normalizeName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// Other ways the same tests are printed on lab sheets (Labcorp, Quest and
// hospital reports), beyond the names and aliases in the reference database.
const PRINTED_NAMES: Record<string, string[]> = {
  tsh: ['tsh', 'thyroid stimulating hormone', 'tsh 3rd generation', 'tsh ultrasensitive', 'tsh sensitive'],
  free_t4: ['free t4', 't4 free', 'ft4', 'free thyroxine', 't4 free direct', 'thyroxine t4 free', 'thyroxine free', 'free t4 direct'],
  free_t3: ['free t3', 't3 free', 'ft3', 'free triiodothyronine', 'triiodothyronine t3 free', 'triiodothyronine free'],
  total_t4: ['total t4', 't4 total', 'thyroxine t4', 'thyroxine total', 'tt4'],
  total_t3: ['total t3', 't3 total', 'triiodothyronine t3', 'triiodothyronine total', 'tt3'],
  reverse_t3: ['reverse t3', 't3 reverse', 'rt3'],
  tpo_ab: ['tpo', 'tpo ab', 'tpoab', 'anti tpo', 'thyroid peroxidase', 'thyroid peroxidase ab', 'thyroid peroxidase antibodies', 'thyroid peroxidase tpo ab'],
  tg_ab: ['tgab', 'tg ab', 'anti tg', 'thyroglobulin ab', 'thyroglobulin antibody', 'thyroglobulin antibodies', 'anti thyroglobulin', 'antithyroglobulin ab'],
  thyroglobulin: ['thyroglobulin', 'tg'],
  tsi_trab: ['tsi', 'trab', 'tsh receptor', 'tsh receptor ab', 'tsh receptor antibody', 'tsh r ab', 'thyroid stimulating immunoglobulin', 'thyrotropin receptor ab'],
  hscrp: ['hs crp', 'hscrp', 'crp', 'c reactive protein', 'high sensitivity c reactive protein', 'c reactive protein cardiac', 'crp high sensitivity'],
  ferritin: ['ferritin', 'ferritin serum'],
  vitamin_d_test: ['vitamin d', 'vitamin d 25 hydroxy', '25 hydroxy vitamin d', '25 hydroxyvitamin d', '25 oh vitamin d', 'vitamin d 25 oh', '25 oh d', 'vitamin d3 25 hydroxy'],
  vitamin_b12_test: ['vitamin b12', 'b12', 'cobalamin', 'vitamin b 12'],
  selenium_test: ['selenium', 'selenium serum'],
  zinc_test: ['zinc', 'zinc serum', 'zinc plasma'],
  magnesium_test: ['magnesium', 'magnesium serum', 'magnesium rbc', 'rbc magnesium'],
  urine_iodine: ['iodine', 'urine iodine', 'iodine urine', 'iodine random urine'],
};

function keysFor(test: LabTestKey): string[] {
  const keys = new Set<string>();
  const add = (text: string) => {
    const key = normalizeName(text);
    if (key.length >= 2) keys.add(key);
  };
  add(test.displayName);
  const beforeParen = test.displayName.split('(')[0];
  add(beforeParen);
  for (const inside of test.displayName.match(/\(([^)]*)\)/g) ?? []) add(inside);
  for (const alias of (test.aliases ?? '').split(/[,/]/)) add(alias);
  for (const printed of PRINTED_NAMES[test.code] ?? []) add(printed);
  return [...keys];
}

/**
 * The test a printed name is, or null. The longest matching name wins, so
 * "Thyroglobulin Antibodies" is the antibody test and not thyroglobulin, and
 * "TSH Receptor Ab" is not TSH. A retired test of the person's is not matched.
 */
export function matchLabTest(printedName: string, tests: readonly LabTestKey[]): string | null {
  const name = ` ${normalizeName(printedName)} `;
  if (name.trim().length === 0) return null;
  let best: { code: string; length: number } | null = null;
  for (const test of tests) {
    if (test.retiredAt) continue;
    for (const key of keysFor(test)) {
      if (!name.includes(` ${key} `)) continue;
      if (!best || key.length > best.length) best = { code: test.code, length: key.length };
    }
  }
  return best?.code ?? null;
}

// ---------------------------------------------------------------------------
// Numbers, units, flags and ranges

const NUMBER = /^[<>≤≥]?=?\d+(?:[.,]\d+)?$/;
const NUMBER_WITH_FLAG = /^([<>≤≥]?=?\d+(?:[.,]\d+)?)(HH|LL|H|L|A)$/;
const FLAG = /^(HH|LL|H|L|A|AH|AL|High|Low|Abnormal|Abn|Crit|Critical|\*+)$/i;
const RANGE_BETWEEN = /(\d+(?:[.,]\d+)?)\s*(?:-|–|to|a)\s*(\d+(?:[.,]\d+)?)/i;
const RANGE_BELOW = /(?:^|\s)(?:<|≤|<=|less than|under)\s*(\d+(?:[.,]\d+)?)/i;
const RANGE_ABOVE = /(?:^|\s)(?:>|≥|>=|greater than|over)\s*(\d+(?:[.,]\d+)?)/i;
// Words that sit in a result line without being the unit.
const NOT_A_UNIT = /^(final|ref|reference|range|result|results|normal|flag|units?|value|in|out|of|interval|optimal|desirable)$/i;
// Lines about the sheet and the person rather than a result.
const NOT_A_RESULT =
  /^(page|date|collected|collection|received|reported|report|printed|patient|name|dob|birth|age|sex|account|acct|specimen|accession|physician|doctor|provider|ordered|ordering|phone|fax|npi|id|mrn|address|lab director|clia|test|tests|analyte|component)\b/i;

function toNumber(text: string): number {
  return Number(text.replace(/^[<>≤≥]=?/, '').replace(',', '.'));
}

function readRange(text: string): { low: number | null; high: number | null } {
  const cleaned = text.replace(/[()[\]]/g, ' ');
  const between = cleaned.match(RANGE_BETWEEN);
  if (between) return { low: toNumber(between[1]), high: toNumber(between[2]) };
  const below = cleaned.match(RANGE_BELOW);
  if (below) return { low: null, high: toNumber(below[1]) };
  const above = cleaned.match(RANGE_ABOVE);
  if (above) return { low: toNumber(above[1]), high: null };
  return { low: null, high: null };
}

function isRangePiece(token: string): boolean {
  return /\d/.test(token) && /^[([]?[<>≤≥]?=?\d+(?:[.,]\d+)?(?:-|–)?(?:\d+(?:[.,]\d+)?)?[)\]]?$/.test(token);
}

function looksLikeUnit(token: string): boolean {
  if (NOT_A_UNIT.test(token) || FLAG.test(token)) return false;
  if (/^(-|–|to|a)$/i.test(token)) return false;
  return /[\p{L}%µμ/]/u.test(token);
}

/** A line split into its fields: tabs, bars, semicolons, or a CSV's commas. */
function tokensOf(line: string): string[] {
  let text = line.replace(/[\t|;]/g, '  ');
  // A line printed with decimal commas (31,4) and no decimal points keeps
  // a comma between two digits; any other comma is a field break.
  const decimalCommas = /\d,\d/.test(text) && !/\d\.\d/.test(text);
  text = text.replace(decimalCommas ? /(?<!\d),|,(?!\d)/g : /,/g, '  ');
  return text.split(/\s+/).filter(Boolean);
}

/** One line read as a result, or null when it is not one. */
export function parseLabLine(line: string, tests: readonly LabTestKey[]): ParsedLabRow | null {
  const printed = line.replace(/\s+/g, ' ').trim();
  if (!printed || NOT_A_RESULT.test(printed)) return null;
  const tokens = tokensOf(line);
  let valueIndex = -1;
  let valueText = '';
  let glued: string | null = null;
  for (let i = 1; i < tokens.length; i++) {
    const before = tokens.slice(0, i).join(' ');
    if (!/\p{L}/u.test(before)) continue;
    const token = tokens[i];
    // A number joined to the next token by a dash is the start of a range.
    if (NUMBER.test(token) && !/^(-|–)$/.test(tokens[i + 1] ?? '')) {
      valueIndex = i;
      valueText = token;
      break;
    }
    const withFlag = token.match(NUMBER_WITH_FLAG);
    if (withFlag) {
      valueIndex = i;
      valueText = withFlag[1];
      glued = withFlag[2];
      break;
    }
  }
  if (valueIndex < 0) return null;
  const name = tokens
    .slice(0, valueIndex)
    .join(' ')
    .replace(/[:\s.,-]+$/u, '')
    .trim();
  if ((name.match(/\p{L}/gu) ?? []).length < 2) return null;

  const rest = tokens.slice(valueIndex + 1);
  let flag = glued;
  let unit = '';
  const rangeTokens: string[] = [];
  for (const token of rest) {
    if (!flag && FLAG.test(token)) {
      flag = token;
      continue;
    }
    if (isRangePiece(token) || /^(-|–|to)$/i.test(token)) {
      rangeTokens.push(token);
      continue;
    }
    if (!unit && looksLikeUnit(token)) unit = token;
  }
  const { low, high } = readRange(rangeTokens.join(' '));
  return {
    printed,
    name,
    testCode: matchLabTest(name, tests),
    value: toNumber(valueText),
    valueText: valueText.replace(',', '.'),
    unit,
    low,
    high,
    flag,
    testedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Dates

const MONTHS: Record<string, number> = {
  jan: 1, ene: 1, feb: 2, mar: 3, apr: 4, abr: 4, may: 5, jun: 6, jul: 7, aug: 8, ago: 8,
  sep: 9, sept: 9, oct: 10, nov: 11, dec: 12, dic: 12,
};

function monthNumber(word: string): number | null {
  const lower = word.toLowerCase();
  return MONTHS[lower.slice(0, 4)] ?? MONTHS[lower.slice(0, 3)] ?? null;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function fullYear(year: number): number {
  return year < 100 ? 2000 + year : year;
}

function validDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * A printed date as YYYY-MM-DD, 'ambiguous' when the day and month could be
 * either way round (03/04/2026), or null. 03/04 is never guessed at: a lab
 * in Mexico and a lab in the United States print it opposite ways.
 */
export function readPrintedDate(text: string): string | 'ambiguous' | null {
  const iso = text.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) return validDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const numeric = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (numeric) {
    const a = Number(numeric[1]);
    const b = Number(numeric[2]);
    const year = fullYear(Number(numeric[3]));
    if (a > 12 && b <= 12) return validDate(year, b, a);
    if (b > 12 && a <= 12) return validDate(year, a, b);
    if (a === b) return validDate(year, a, b);
    return 'ambiguous';
  }
  const monthFirst = text.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})\b/);
  const monthFirstMonth = monthFirst ? monthNumber(monthFirst[1]) : null;
  if (monthFirst && monthFirstMonth) return validDate(Number(monthFirst[3]), monthFirstMonth, Number(monthFirst[2]));
  const dayFirst = text.match(/\b(\d{1,2})[\s-]+(?:de\s+)?([A-Za-z]{3,10})\.?[\s-]+(?:de\s+)?(\d{4})\b/i);
  const dayFirstMonth = dayFirst ? monthNumber(dayFirst[2]) : null;
  if (dayFirst && dayFirstMonth) return validDate(Number(dayFirst[3]), dayFirstMonth, Number(dayFirst[1]));
  return null;
}

const DATE_LINE = /\b(collected|collection|drawn|specimen|date of service|fecha de toma|fecha)\b/i;

/** The date the blood was drawn, when the sheet prints it on a line that says so. */
export function findSheetDate(text: string): SheetDate {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!DATE_LINE.test(line)) continue;
    const date = readPrintedDate(line);
    if (date === 'ambiguous') return { kind: 'ambiguous', printed: line };
    if (date) return { kind: 'found', date, printed: line };
  }
  return { kind: 'none' };
}

// ---------------------------------------------------------------------------
// A whole sheet

const HEADER_NAME = /^(test|test name|analyte|name|component|description|prueba|estudio)$/i;
const HEADER_VALUE = /^(result|results|value|resultado|valor)$/i;

function splitCsvLine(line: string): string[] {
  const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
  const fields: string[] = [];
  let current = '';
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) {
      fields.push(current.trim());
      current = '';
    } else current += char;
  }
  fields.push(current.trim());
  return fields;
}

/** A CSV or pasted spreadsheet whose first row names its columns. */
function parseWithHeader(lines: string[], tests: readonly LabTestKey[]): ParsedLabRow[] | null {
  const header = splitCsvLine(lines[0]).map((field) => field.toLowerCase());
  const nameAt = header.findIndex((field) => HEADER_NAME.test(field));
  const valueAt = header.findIndex((field) => HEADER_VALUE.test(field));
  if (nameAt < 0 || valueAt < 0) return null;
  const find = (pattern: RegExp) => header.findIndex((field) => pattern.test(field));
  const unitAt = find(/^(units?|unidad(es)?)$/);
  const rangeAt = find(/(range|reference|ref|interval|rango)/);
  const lowAt = find(/^(low|min|minimum|ref low|range low)$/);
  const highAt = find(/^(high|max|maximum|ref high|range high)$/);
  const flagAt = find(/^(flag|abnormal|status)$/);
  const dateAt = find(/(date|collected|drawn|fecha)/);
  const rows: ParsedLabRow[] = [];
  for (const line of lines.slice(1)) {
    const fields = splitCsvLine(line);
    const name = fields[nameAt] ?? '';
    const valueField = (fields[valueAt] ?? '').trim();
    const valueMatch = valueField.match(/^([<>≤≥]?=?\d+(?:[.,]\d+)?)/);
    if (!name || !valueMatch) continue;
    const range = rangeAt >= 0 ? readRange(fields[rangeAt] ?? '') : { low: null, high: null };
    const low = lowAt >= 0 && fields[lowAt] ? toNumber(fields[lowAt]) : range.low;
    const high = highAt >= 0 && fields[highAt] ? toNumber(fields[highAt]) : range.high;
    const date = dateAt >= 0 ? readPrintedDate(fields[dateAt] ?? '') : null;
    rows.push({
      printed: fields.filter(Boolean).join(', '),
      name,
      testCode: matchLabTest(name, tests),
      value: toNumber(valueMatch[1]),
      valueText: valueMatch[1].replace(',', '.'),
      unit: unitAt >= 0 ? (fields[unitAt] ?? '') : '',
      low: Number.isFinite(low as number) ? low : null,
      high: Number.isFinite(high as number) ? high : null,
      flag: flagAt >= 0 && fields[flagAt] ? fields[flagAt] : null,
      testedAt: date && date !== 'ambiguous' ? date : null,
    });
  }
  return rows;
}

/**
 * Every line of a sheet that reads as a result. A name on a line by itself
 * with its number on the next line (the way some photos read) is joined up.
 */
export function parseLabSheet(text: string, tests: readonly LabTestKey[]): ParsedLabRow[] {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const withHeader = parseWithHeader(lines, tests);
  if (withHeader) return withHeader;

  const rows: ParsedLabRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const row = parseLabLine(lines[i], tests);
    if (row) {
      rows.push(row);
      continue;
    }
    const next = lines[i + 1];
    const startsWithNumber = next ? NUMBER.test(next.split(/\s+/)[0] ?? '') || NUMBER_WITH_FLAG.test(next.split(/\s+/)[0] ?? '') : false;
    if (next && startsWithNumber && /\p{L}{2}/u.test(lines[i]) && !/\d/.test(lines[i].replace(/\b(t3|t4|b12|25)\b/gi, ''))) {
      const joined = parseLabLine(`${lines[i]}  ${next}`, tests);
      if (joined) {
        rows.push(joined);
        i++;
      }
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// A photo's lines put back into rows

export type PositionedLine = { text: string; x: number; y: number; height: number };

/**
 * A photographed table read back into rows. On-device text recognition
 * often hands a table back column by column (every name, then every
 * number), so lines are regrouped by height on the page: lines whose middles
 * sit within half a line of each other are one row, read left to right.
 */
export function rowsFromPositionedLines(lines: readonly PositionedLine[]): string {
  const usable = lines.filter((line) => line.text.trim());
  if (usable.length === 0) return '';
  const heights = usable.map((line) => line.height).sort((a, b) => a - b);
  const typical = heights[Math.floor(heights.length / 2)] || 1;
  const sorted = [...usable].sort((a, b) => a.y + a.height / 2 - (b.y + b.height / 2));
  const rows: { middle: number; lines: PositionedLine[] }[] = [];
  for (const line of sorted) {
    const middle = line.y + line.height / 2;
    const row = rows[rows.length - 1];
    if (row && Math.abs(middle - row.middle) <= typical / 2) {
      row.lines.push(line);
      row.middle = (row.middle * (row.lines.length - 1) + middle) / row.lines.length;
    } else {
      rows.push({ middle, lines: [line] });
    }
  }
  return rows
    .map((row) =>
      [...row.lines]
        .sort((a, b) => a.x - b.x)
        .map((line) => line.text.trim())
        .join('  '),
    )
    .join('\n');
}

// ---------------------------------------------------------------------------
// Rows the person checks

export type LabDraft = {
  key: string;
  /** 'read' for a row read off a photo or pasted text, 'form' for a panel row. */
  source: 'read' | 'form';
  printed: string;
  /** The test code, or OWN_TEST for a new test of the person's. */
  testCode: string | null;
  ownName: string;
  value: string;
  unit: string;
  low: string;
  high: string;
  flag: string | null;
  testedAt: string | null;
  confirmed: boolean;
};

export const OWN_TEST = '__own__';

function numberText(value: number | null): string {
  return value == null ? '' : String(value);
}

export function draftsFromRows(rows: readonly ParsedLabRow[], tests: readonly LabTestKey[]): LabDraft[] {
  const byCode = new Map(tests.map((test) => [test.code, test]));
  return rows.map((row, index) => ({
    key: `read_${index}`,
    source: 'read',
    printed: row.printed,
    testCode: row.testCode ?? OWN_TEST,
    ownName: row.testCode ? '' : row.name,
    value: row.valueText,
    unit: row.unit || (row.testCode ? (byCode.get(row.testCode)?.rangeUnit ?? '') : ''),
    low: numberText(row.low),
    high: numberText(row.high),
    flag: row.flag,
    testedAt: row.testedAt,
    confirmed: false,
  }));
}

export type LabPanel = { key: string; label: string };

export const LAB_PANELS: readonly LabPanel[] = [
  { key: 'thyroid', label: 'Thyroid' },
  { key: 'thyroidEvery', label: 'Every thyroid test' },
  { key: 'nutrients', label: 'Nutrient status' },
  { key: 'inflammation', label: 'Inflammation' },
  { key: 'lastTime', label: 'The tests from last time' },
  { key: 'mine', label: 'Tests you added' },
  { key: 'every', label: 'Every test' },
];

const THYROID_CORE = ['tsh', 'free_t4', 'free_t3', 'tpo_ab', 'tg_ab'];

/** The tests a panel holds, in the order the form shows them. */
export function panelTestCodes(
  panelKey: string,
  tests: readonly LabTestKey[],
  lastTimeCodes: readonly string[],
): string[] {
  const live = tests.filter((test) => !test.retiredAt);
  const has = new Set(live.map((test) => test.code));
  switch (panelKey) {
    case 'thyroid':
      return THYROID_CORE.filter((code) => has.has(code));
    case 'thyroidEvery':
      return live.filter((test) => test.categoryCode.startsWith('thyroid')).map((test) => test.code);
    case 'nutrients':
      return live.filter((test) => test.categoryCode === 'nutrient_status').map((test) => test.code);
    case 'inflammation':
      return live.filter((test) => test.categoryCode === 'inflammation_metabolic').map((test) => test.code);
    case 'lastTime':
      return lastTimeCodes.filter((code) => has.has(code));
    case 'mine':
      return live.filter((test) => test.isOwn).map((test) => test.code);
    default:
      return live.map((test) => test.code);
  }
}

export function draftsForPanel(codes: readonly string[], tests: readonly LabTestKey[]): LabDraft[] {
  const byCode = new Map(tests.map((test) => [test.code, test]));
  return codes.map((code, index) => ({
    key: `form_${index}_${code}`,
    source: 'form',
    printed: '',
    testCode: code,
    ownName: '',
    value: '',
    unit: byCode.get(code)?.rangeUnit ?? '',
    low: '',
    high: '',
    flag: null,
    testedAt: null,
    confirmed: false,
  }));
}

/** A panel row counts once a value is typed; a read row once it is confirmed. */
export function draftIsConfirmed(draft: LabDraft): boolean {
  return draft.source === 'form' ? draft.value.trim() !== '' : draft.confirmed;
}

function parseTyped(text: string): number | null {
  const trimmed = text.trim().replace(/^[<>≤≥]=?/, '').replace(',', '.');
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : NaN;
}

/** What stops a row from being saved, in a sentence, or null. */
export function draftProblem(draft: LabDraft): string | null {
  if (!draft.testCode) return 'Pick which test this is.';
  if (draft.testCode === OWN_TEST && !draft.ownName.trim()) return 'Give the test a name.';
  const value = parseTyped(draft.value);
  if (value === null) return 'Type the result.';
  if (Number.isNaN(value)) return 'The result needs to be a number.';
  const low = parseTyped(draft.low);
  const high = parseTyped(draft.high);
  if (Number.isNaN(low as number) || Number.isNaN(high as number)) return 'The range needs to be numbers.';
  if (low != null && high != null && low > high) return 'The low end of the range is above the high end.';
  return null;
}

export type LabSave = {
  testCode: string;
  ownName: string | null;
  value: number;
  unit: string;
  labRangeLow: number | null;
  labRangeHigh: number | null;
  testedAt: string;
  notes: string | null;
};

/** The confirmed rows with nothing wrong, ready for recordLabResult. */
export function savesFromDrafts(drafts: readonly LabDraft[], panelDate: string): LabSave[] {
  const saves: LabSave[] = [];
  for (const draft of drafts) {
    if (!draftIsConfirmed(draft) || draftProblem(draft) || !draft.testCode) continue;
    const printedSign = draft.value.trim().match(/^[<>≤≥]=?/);
    const notes = [
      printedSign ? `Printed as ${draft.value.trim()}` : null,
      draft.flag ? `Marked ${draft.flag} on the sheet` : null,
    ].filter(Boolean);
    saves.push({
      testCode: draft.testCode,
      ownName: draft.testCode === OWN_TEST ? draft.ownName.trim() : null,
      value: parseTyped(draft.value) as number,
      unit: draft.unit.trim(),
      labRangeLow: parseTyped(draft.low),
      labRangeHigh: parseTyped(draft.high),
      testedAt: draft.testedAt ?? panelDate,
      notes: notes.length > 0 ? notes.join('. ') : null,
    });
  }
  return saves;
}

// ---------------------------------------------------------------------------
// Words

export const LAB_SHEET_TITLE = 'Log a Whole Sheet';

export const LAB_SHEET_INTRO =
  'Photograph a lab sheet, paste a table or a CSV from a patient portal, or fill in a whole panel at once. Every row waits for you to check it against the sheet, and only the rows you confirm are saved.';

export const LAB_TEXT_HINT =
  'One result to a line works best: the test, the result, the unit and the range. Fix anything the photo read wrongly before reading the lines.';

export const LAB_PANEL_HINT = 'Type the results you have. A test left blank is not saved.';

export const LAB_SHEET_CAPTION =
  'The value, unit and range are kept as your sheet prints them. Nothing is converted, and the app does not decide whether a result is high or low; the range beside it is the one your lab printed.';

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

function lower(word: string): string {
  return word.charAt(0).toLowerCase() + word.slice(1);
}

/** The line above the rows read off a sheet. */
export function describeReadRows(drafts: readonly LabDraft[]): string {
  const read = drafts.filter((draft) => draft.source === 'read');
  if (read.length === 0) {
    return 'No line here reads as a result yet. Each result needs the test name and then its number on the same line.';
  }
  const known = read.filter((draft) => draft.testCode && draft.testCode !== OWN_TEST).length;
  const lead = `${countWord(read.length)} ${read.length === 1 ? 'line reads' : 'lines read'} as results.`;
  if (known === read.length) return `${lead} Each one names a test the app knows.`;
  const unknown = read.length - known;
  const knownPart = known === 0 ? 'None names a test the app knows' : `${countWord(known)} ${known === 1 ? 'names a test' : 'name tests'} the app knows`;
  return `${lead} ${knownPart}, and ${lower(countWord(unknown))} can be added as ${unknown === 1 ? 'a new test' : 'new tests'} or left out.`;
}

/** The save button's label. */
export function describeSaveButton(drafts: readonly LabDraft[]): string {
  const ready = drafts.filter((draft) => draftIsConfirmed(draft) && !draftProblem(draft)).length;
  if (ready === 0) return 'Nothing Confirmed Yet';
  return `Save ${ready} ${ready === 1 ? 'Result' : 'Results'}`;
}

/** Under the save button, when some rows will not be saved. */
export function describeUnsaved(drafts: readonly LabDraft[]): string | null {
  const waiting = drafts.filter((draft) => draft.source === 'read' && !draft.confirmed).length;
  const troubled = drafts.filter((draft) => draftIsConfirmed(draft) && draftProblem(draft)).length;
  const parts: string[] = [];
  if (waiting > 0) parts.push(`${countWord(waiting)} ${waiting === 1 ? 'row is' : 'rows are'} not confirmed yet`);
  if (troubled > 0) parts.push(`${lower(countWord(troubled))} ${troubled === 1 ? 'needs' : 'need'} fixing first`);
  if (parts.length === 0) return null;
  return `${parts.join(', and ')}, so ${waiting + troubled === 1 ? 'it is' : 'they are'} left out of the save.`;
}

/** Said when the sheet prints its date. */
export function describeSheetDate(found: SheetDate): string | null {
  if (found.kind === 'found') return `Date drawn taken from the sheet ("${found.printed}"). Change it below if that is wrong.`;
  if (found.kind === 'ambiguous') {
    return `The sheet's date ("${found.printed}") could be read day first or month first, so it was not used. Set the date drawn below.`;
  }
  return null;
}

/** Under a row whose unit differs from the one the app usually writes the test in. */
export function describeUnitDifference(rowUnit: string, testUnit: string, testName: string): string | null {
  const a = rowUnit.trim().toLowerCase().replace(/μ/g, 'µ');
  const b = testUnit.trim().toLowerCase().replace(/μ/g, 'µ');
  if (!a || !b || a === b) return null;
  return `Your sheet prints ${rowUnit.trim()}; the app usually writes ${testName} in ${testUnit}. It is kept as printed.`;
}
