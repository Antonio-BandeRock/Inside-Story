// A9 (1.0.53.35), direct instruction 2026-09-26: "Yes, add the major
// level of severity." Every cited interaction rule carries one of three
// levels, graded against its citation in the reference database:
//
//   major   the label or guideline says to avoid the combination, or to
//           use it only with a changed dose or monitoring a prescriber
//           arranges (a boxed warning, a contraindication, a dose cut the
//           label names)
//   caution the combination is common and the source names something to
//           time, space out, watch for or check
//   note    background: how well something absorbs, how a test reads
//
// Pure, with no React, so scripts/test_rule_severity.js can check it.
// The words say what the level means and who decides, never what to do
// with a medication.

export type RuleSeverity = 'major' | 'caution' | 'note';

export const RULE_SEVERITIES: readonly RuleSeverity[] = ['major', 'caution', 'note'];

const RANK: Record<RuleSeverity, number> = { major: 0, caution: 1, note: 2 };

const LABEL: Record<RuleSeverity, string> = {
  major: 'Major',
  caution: 'Caution',
  note: 'Note',
};

const MEANING: Record<RuleSeverity, string> = {
  major:
    'The drug label or guideline behind this rule says to avoid the combination, or to use it only with a changed dose or with monitoring a prescriber arranges. Bring it up with your prescriber or pharmacist. Do not stop or change a medication because of it without asking them first.',
  caution:
    'The combination is commonly used, and the source behind this rule names something to time, space apart, watch for or have checked. Your prescriber or pharmacist can say how it applies to you.',
  note:
    'Background worth knowing, usually about how well something is absorbed or how a test result reads. Your prescriber or pharmacist can say how it applies to you.',
};

// Anything the database hands back that is not one of the three reads as
// caution, the level every rule carried before major existed.
export function toRuleSeverity(value: string | null | undefined): RuleSeverity {
  return value === 'major' || value === 'note' ? value : 'caution';
}

export function ruleSeverityLabel(severity: RuleSeverity): string {
  return LABEL[severity];
}

export function ruleSeverityMeaning(severity: RuleSeverity): string {
  return MEANING[severity];
}

// Major first, then caution, then note. Stable, so rules of the same level
// keep the order they arrived in.
export function sortBySeverity<T extends { severity: RuleSeverity }>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => RANK[a.item.severity] - RANK[b.item.severity] || a.index - b.index)
    .map(({ item }) => item);
}

// For plain-text output such as the report: "Major: Title".
export function withSeverityPrefix(severity: RuleSeverity, title: string): string {
  return `${LABEL[severity]}: ${title}`;
}
