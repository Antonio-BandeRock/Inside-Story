// One check-in, one step at a time (D8 in the competitive build plan,
// 2026-09-30). Home already asks three separate questions in three places:
// the Morning Check-In (sleep, energy, a note), Today's Check-In (the daily
// list, mood, energy, stress and the symptom chips) and Log a Flare on
// Signals. This walks through the three in one sequence and ends on a
// summary of what was entered, so somebody who wants to check in once a
// day does it in one go rather than finding three forms.
//
// HOW IT BEHAVES
//
//   - Every step can be skipped, and a skipped step saves nothing.
//   - Each step saves when the person moves past it, into the same record
//     its own form writes, so leaving halfway keeps what was said.
//   - The energy answered in the morning step is carried into the feeling
//     step's energy, so the same question is not asked twice.
//   - The summary says what was entered and where it went, and nothing
//     more: no count, no score, no praise, and no reading of what the
//     answers mean.
//
// No I/O and no React, so scripts/test_checkin_flow.js checks it directly.

export type FlowStepKey = 'morning' | 'feeling' | 'flare' | 'summary';

export type FlowStep = { key: FlowStepKey; title: string; question: string };

export const FLOW_STEPS: FlowStep[] = [
  { key: 'morning', title: 'This Morning', question: 'How did you sleep, and how much energy do you have?' },
  { key: 'feeling', title: 'How You Feel', question: 'How are you feeling today? Pick everything that applies.' },
  { key: 'flare', title: 'Any Flare', question: 'Have you had a flare today?' },
  { key: 'summary', title: 'What You Entered', question: 'Everything from this check-in, and where it went.' },
];

export function stepIndex(key: FlowStepKey): number {
  return FLOW_STEPS.findIndex((step) => step.key === key);
}

export function nextStep(key: FlowStepKey): FlowStepKey {
  const index = stepIndex(key);
  return FLOW_STEPS[Math.min(index + 1, FLOW_STEPS.length - 1)].key;
}

export function previousStep(key: FlowStepKey): FlowStepKey {
  const index = stepIndex(key);
  return FLOW_STEPS[Math.max(index - 1, 0)].key;
}

/** "Step 2 of 3". The summary is not counted as a step. */
export function stepCaption(key: FlowStepKey): string | null {
  if (key === 'summary') return null;
  const asked = FLOW_STEPS.filter((step) => step.key !== 'summary');
  return `Step ${stepIndex(key) + 1} of ${asked.length}`;
}

/**
 * The feeling step's valence, the way Home's Today's Check-In works it out:
 * all positive tags reads positive, all negative reads negative, a mix or
 * nothing reads neutral. A tag with no known leaning is left out.
 */
export function valenceOfTags(
  tags: string[],
  leaningOf: (code: string) => 'positive' | 'negative' | undefined,
): 'positive' | 'negative' | 'neutral' {
  const leanings = tags.map(leaningOf).filter((value): value is 'positive' | 'negative' => value !== undefined);
  if (leanings.length === 0) return 'neutral';
  if (leanings.every((value) => value === 'positive')) return 'positive';
  if (leanings.every((value) => value === 'negative')) return 'negative';
  return 'neutral';
}

/** The feeling step's energy to start from: its own, else the morning's. */
export function carriedEnergy(feelingEnergy: number | null, morningEnergy: number | null): number | null {
  return feelingEnergy ?? morningEnergy;
}

export type FlowOutcome =
  | { saved: false }
  | { saved: true; lines: string[] };

export type SummaryRow = { title: string; lines: string[]; where: string | null };

/** What each step left behind, in the order they were asked. */
export function summaryRows(outcomes: { morning: FlowOutcome; feeling: FlowOutcome; flare: FlowOutcome }): SummaryRow[] {
  const where: Record<'morning' | 'feeling' | 'flare', string> = {
    morning: "Saved as this morning's check-in on Home.",
    feeling: "Saved as today's check-in on Home.",
    flare: 'Saved as a flare on Signals > Flares.',
  };
  return (['morning', 'feeling', 'flare'] as const).map((key) => {
    const outcome = outcomes[key];
    const title = FLOW_STEPS[stepIndex(key)].title;
    if (!outcome.saved) return { title, lines: ['Nothing entered.'], where: null };
    return { title, lines: outcome.lines.length > 0 ? outcome.lines : ['Answered.'], where: where[key] };
  });
}

/** The flare line: "Moderate, 6 out of 10, with Headache and Fatigue." */
export function flareLine(stepLabel: string, ten: number | null, tagLabels: string[]): string {
  const parts = [stepLabel];
  if (ten !== null) parts.push(`${ten} out of 10`);
  let line = parts.join(', ');
  if (tagLabels.length === 1) line += `, with ${tagLabels[0]}`;
  else if (tagLabels.length > 1) line += `, with ${tagLabels.slice(0, -1).join(', ')} and ${tagLabels[tagLabels.length - 1]}`;
  return `${line}.`;
}
