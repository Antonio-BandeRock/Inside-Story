// One line at the top of a scan report (G17, 2026-09-27).
//
// The report already lists every additive flag and every concern for a
// tracked condition, one card each. This puts the gist in one sentence
// above them, the way "Worth a second look for two of your conditions:
// sodium, carrageenan" reads: how many of the person's conditions the
// label touched, then what it touched, the stronger flags named first.
//
// Informational additive flags (MSG, the gums) are left out of the line,
// since the entries behind them conclude they are generally fine; they
// still show in the list below. The line talks about the label and never
// about the person. Pure, with no React and no database, so
// scripts/test_scan_summary_line.js checks it without a phone.

export type ScanSummaryTone = 'none' | 'yellow' | 'red';

export type ScanSummaryInput = {
  hasIngredients: boolean;
  additiveFlags: { severity: 'red' | 'yellow' | 'info'; label: string }[];
  conditionFlags: { conditionCode: string; label: string }[];
  /** True when the FODMAP card shows at least one group for this label. */
  fodmapMatched: boolean;
  conditionName: (code: string) => string;
};

export type ScanSummaryLine = { text: string; tone: ScanSummaryTone };

const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const NAMED_AT_MOST = 3;

function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

// "Sodium" reads as "sodium" mid-sentence, but "MSG" and "CMC" stay as
// they are: only a label whose second letter is lower case is lowered.
function inSentence(label: string): string {
  return label.length > 1 && label[1] === label[1].toLowerCase() ? label[0].toLowerCase() + label.slice(1) : label;
}

function joinNames(names: string[]): string {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function scanSummaryLine(input: ScanSummaryInput): ScanSummaryLine {
  if (!input.hasIngredients) return { text: 'No ingredients to check yet.', tone: 'none' };

  // Red additives first, then each condition concern, then yellow
  // additives and FODMAP ingredients. A label matched for two conditions
  // (gluten for celiac and for Hashimoto's) is named once.
  const ranked: { rank: number; label: string }[] = [
    ...input.additiveFlags.filter((flag) => flag.severity === 'red').map((flag) => ({ rank: 0, label: flag.label })),
    ...input.conditionFlags.map((flag) => ({ rank: 1, label: flag.label })),
    ...input.additiveFlags.filter((flag) => flag.severity === 'yellow').map((flag) => ({ rank: 2, label: flag.label })),
    ...(input.fodmapMatched ? [{ rank: 2, label: 'FODMAP ingredients' }] : []),
  ];
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of ranked.sort((a, b) => a.rank - b.rank)) {
    const key = item.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(inSentence(item.label));
  }

  if (names.length === 0) {
    return { text: 'Nothing on this label matched your conditions or the additives worth a second look.', tone: 'none' };
  }

  const conditionCodes = [...new Set(input.conditionFlags.map((flag) => flag.conditionCode))];
  const lead =
    conditionCodes.length > 1
      ? `Worth a second look for ${countWord(conditionCodes.length)} of your conditions`
      : conditionCodes.length === 1
        ? `Worth a second look for ${input.conditionName(conditionCodes[0])}`
        : 'Worth a second look';

  const shown = names.slice(0, NAMED_AT_MOST);
  const more = names.length - shown.length;
  const list = more > 0 ? `${shown.join(', ')} and ${countWord(more)} more` : joinNames(shown);
  const tone: ScanSummaryTone = input.additiveFlags.some((flag) => flag.severity === 'red') ? 'red' : 'yellow';
  return { text: `${lead}: ${list}.`, tone };
}
