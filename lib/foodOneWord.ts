// One phrase for a food, for this person (G15, 2026-09-27).
//
// The For You card on Insights > Food Lookup already worked out, for one
// food, a verdict per tracked condition, whether it contains something on
// the allergy list and whether it fits the diet preferences. It laid all
// of that out at once, one row per condition. This turns the same result
// into the one phrase a person reads first ("Fits all your conditions",
// "One caution"), never a number, with the rows one tap away.
//
// It speaks about the food against the person's profile and never about
// the person. Pure, with no React and no database, so
// scripts/test_food_one_word.js checks it without a phone.

export type FoodOneWordTone = 'fits' | 'caution' | 'stop';

export type FoodOneWordInput = {
  trackedConditions: { code: string; name: string }[];
  safeForConditions: string[];
  conditionCautions: Record<string, { severity: 'yellow' | 'red'; note: string }>;
  dietViolations: string[];
  allergyMatch: string | null;
};

export type FoodOneWord = { phrase: string; tone: FoodOneWordTone };

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

function joinParts(parts: string[]): string {
  const [first, ...rest] = parts;
  const tail = rest.map((part) => part.charAt(0).toLowerCase() + part.slice(1));
  if (tail.length === 0) return first;
  if (tail.length === 1) return `${first} and ${tail[0]}`;
  return `${[first, ...tail.slice(0, -1)].join(', ')} and ${tail[tail.length - 1]}`;
}

export function foodOneWord(input: FoodOneWordInput): FoodOneWord {
  if (input.allergyMatch) return { phrase: 'Contains one of your allergies', tone: 'stop' };

  // A condition that is neither safe nor cautioned matched an absolute
  // exclusion in lib/recipeDepth.ts, the same case verdictFor labels
  // Not Recommended.
  const notSuited = input.trackedConditions.filter(
    (condition) => !input.safeForConditions.includes(condition.code) && !input.conditionCautions[condition.code],
  );
  const cautions = input.trackedConditions.filter((condition) => input.conditionCautions[condition.code]);
  const anyRed = cautions.some((condition) => input.conditionCautions[condition.code].severity === 'red');

  const parts: string[] = [];
  if (notSuited.length === 1) parts.push(`Not suited to ${notSuited[0].name}`);
  else if (notSuited.length > 1) parts.push(`Not suited to ${countWord(notSuited.length).toLowerCase()} of your conditions`);
  if (cautions.length > 0) parts.push(`${countWord(cautions.length)} caution${cautions.length === 1 ? '' : 's'}`);
  if (input.dietViolations.length > 0) parts.push('Outside your eating style');

  if (parts.length > 0) {
    return { phrase: joinParts(parts), tone: notSuited.length > 0 || anyRed ? 'stop' : 'caution' };
  }
  if (input.trackedConditions.length > 1) return { phrase: 'Fits all your conditions', tone: 'fits' };
  if (input.trackedConditions.length === 1) return { phrase: `Fits ${input.trackedConditions[0].name}`, tone: 'fits' };
  return { phrase: 'Fits your eating style', tone: 'fits' };
}
