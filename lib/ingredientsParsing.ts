// Real, readable ingredient-list parsing, 2026-08-16 -- direct request:
// "the output needs to be in a readable and completely understandable
// format or table of information." Photographed/OCR'd (or Open Food
// Facts-supplied) ingredients text arrives as one dense, comma-separated
// paragraph -- often straight-from-the-label ALL CAPS -- which reads as a
// wall of text, not something a person can actually scan at a glance.
//
// This module is a pure DISPLAY transform on top of that same real string
// -- it never changes what's actually stored, edited, or fed into
// lib/scannedProductFlags.ts's own real keyword matching. The raw text
// stays the single source of truth; this just turns it into a real,
// readable list for the "ingredients" screen's own table.

// A real, short, defensible whitelist of genuine food-science acronyms
// that should stay upper-case rather than get title-cased into nonsense
// ("BHA" -> "Bha") -- kept deliberately small and tied directly to this
// app's own already-cited additive keywords (lib/scannedProductFlags.ts),
// not guessed at broadly.
const KNOWN_ACRONYMS = new Set(['BHA', 'BHT', 'MSG', 'EDTA', 'TBHQ', 'GMO', 'FD&C']);

function looksAllCapsDominant(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 6) return false;
  const upper = letters.replace(/[^A-Z]/g, '');
  return upper.length / letters.length > 0.7;
}

// Capitalizes the first real letter in a token, leaving any leading
// punctuation (an opening "(" from a sub-ingredient list, say) untouched
// before it, and lower-cases the rest -- a plain word.charAt(0) would
// wrongly "capitalize" a leading paren instead of the real first letter.
function titleCaseWord(word: string): string {
  const match = word.match(/[A-Za-z]/);
  if (!match || match.index === undefined) return word;
  const idx = match.index;
  return word.slice(0, idx) + word.charAt(idx).toUpperCase() + word.slice(idx + 1).toLowerCase();
}

// A real, conservative Title Case transform -- only ever applied when the
// WHOLE raw ingredients text reads as genuinely all-caps-dominant (a real,
// direct signal it's straight OCR off a printed label, not already-decent
// text from Open Food Facts or a careful manual edit). Text that isn't
// predominantly upper-case is returned completely unchanged, so this can
// never mangle text that already reads fine.
export function formatIngredientLabel(raw: string, wholeTextIsAllCaps: boolean): string {
  const trimmed = raw.trim();
  if (!wholeTextIsAllCaps || !trimmed) return trimmed;
  return trimmed
    .split(/\s+/)
    .map((word) => {
      const bare = word.replace(/[^A-Za-z&]/g, '');
      if (bare.length > 0 && bare.length <= 5 && KNOWN_ACRONYMS.has(bare.toUpperCase())) return word;
      return titleCaseWord(word);
    })
    .join(' ');
}

// A real, paren-aware split -- a plain comma-split would break apart a
// real sub-ingredient list like "Wheat Flour (Niacin, Reduced Iron,
// Thiamine)" into three separate top-level entries instead of the one
// real ingredient it actually is.
export function parseIngredientEntries(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const entries: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of trimmed) {
    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth = Math.max(0, depth - 1);
    if ((char === ',' || char === ';') && depth === 0) {
      entries.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) entries.push(current);
  return entries
    .map((entry) => entry.trim().replace(/^[.\-–]+|[.\-–]+$/g, '').trim())
    .filter((entry) => entry.length > 0);
}

export type ParsedIngredientEntry = {
  // The exact, unmodified substring -- what any keyword-flag matching
  // should always run against, so a flag can never be missed just because
  // the display transform re-cased or reformatted the text it's checking.
  raw: string;
  // A real, readable version of the same entry, for display only.
  label: string;
};

export function parseIngredientsForDisplay(text: string): ParsedIngredientEntry[] {
  const allCaps = looksAllCapsDominant(text);
  return parseIngredientEntries(text).map((raw) => ({ raw, label: formatIngredientLabel(raw, allCaps) }));
}
