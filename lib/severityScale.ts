// Severity in two grains, D5 of the competitive build plan (Phase 2,
// 2026-09-26). A flare or a reaction has always been logged as one of four
// named steps (Mild, Moderate, Severe, Very severe), stored 1 to 4 in
// wellbeing_checkins.severity. Some people want finer grain, so an optional
// 0 to 10 sits beside the steps (severity_ten). Picking a number also sets
// the step it falls in, so everything that already reads the step keeps
// working; Trends draws on the 0 to 10 scale and places an older entry that
// only has a step at the middle of that step's range, and says so. Pure, so
// scripts/test_symptom_tags.js can check it without a phone.

export const SEVERITY_STEPS: { value: number; label: string }[] = [
  { value: 1, label: 'Mild' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Severe' },
  { value: 4, label: 'Very severe' },
];

/** Which numbers on the 0 to 10 scale each step covers. */
export const STEP_RANGES: Record<number, [number, number]> = {
  1: [0, 3],
  2: [4, 5],
  3: [6, 8],
  4: [9, 10],
};

export function severityStepLabel(step: number | null | undefined): string | null {
  return SEVERITY_STEPS.find((option) => option.value === step)?.label ?? null;
}

/** The named step a 0 to 10 number falls in. */
export function stepFromTen(value: number): number {
  const n = Math.max(0, Math.min(10, Math.round(value)));
  for (const [step, [low, high]] of Object.entries(STEP_RANGES)) {
    if (n >= low && n <= high) return Number(step);
  }
  return 4;
}

/** Where an entry sits on the 0 to 10 scale: its number when one was
 *  picked, otherwise the middle of its step's range, otherwise null. */
export function severityOnTen(step: number | null | undefined, ten: number | null | undefined): number | null {
  if (ten !== null && ten !== undefined) return Math.max(0, Math.min(10, ten));
  if (step === null || step === undefined) return null;
  const range = STEP_RANGES[step];
  return range ? (range[0] + range[1]) / 2 : null;
}

/** How a logged entry reads: "Severe", or "Severe, 7 of 10". */
export function describeSeverity(step: number | null | undefined, ten: number | null | undefined): string | null {
  const word = severityStepLabel(ten !== null && ten !== undefined ? stepFromTen(ten) : step);
  if (!word) return null;
  return ten !== null && ten !== undefined ? `${word}, ${ten} of 10` : word;
}
