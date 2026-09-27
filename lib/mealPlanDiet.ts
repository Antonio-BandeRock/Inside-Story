// The eating style a meal plan is built around (2026-09-27, direct
// request: "When generating my meal plan, it should also ask me which
// eating style do I use and then it creates the meals around that plan").
//
// Profile > Diet Preferences already held the answer and the generator
// already filtered by it, but the plan form never asked, so the only way
// to plan a Mediterranean week for somebody whose Profile says Paleo was
// to change Profile. This splits the one tag list (RecipeDietTag) into
// the three questions a person would answer about how they eat: what
// they eat at all, the style they follow, and anything they leave out or
// lean toward. The form starts from Profile and a change there holds for
// the plan being made, never written back.
//
// Pure, with no React and no database, so scripts/test_meal_plan_diet.js
// checks it without a phone.
import type { RecipeDietTag } from './digest/types';

export type BaseDietChoice = { label: string; tag: RecipeDietTag | null; caption: string };

/** What a person eats at all. Omnivore matches every recipe, so it is the same as no answer. */
export const BASE_DIET_CHOICES: BaseDietChoice[] = [
  { label: 'Everything', tag: null, caption: 'Meat, fish, eggs, dairy and plants.' },
  { label: 'Vegetarian', tag: 'Vegetarian', caption: 'No meat or fish. Eggs and dairy are fine.' },
  { label: 'Vegan', tag: 'Vegan', caption: 'Nothing from an animal.' },
];

export type StyleChoice = { tag: RecipeDietTag; label: string; caption: string };

/** The named eating styles a recipe is tagged for, from scripts/compute_recipe_diet_tags.js. */
export const EATING_STYLE_CHOICES: StyleChoice[] = [
  { tag: 'Mediterranean', label: 'Mediterranean', caption: 'Cooked with olive oil, and no red meat.' },
  { tag: 'Paleo', label: 'Paleo', caption: 'No grains, legumes, dairy or refined sugar.' },
  { tag: 'AIP', label: 'AIP', caption: 'Paleo without eggs, nuts, seeds or nightshades.' },
  { tag: 'Plant-Based/Flexitarian', label: 'Plant-Based / Flexitarian', caption: 'Plants, or poultry and fish, and no red meat.' },
];

/** Things a person leaves out or leans toward, on top of the style. */
export const DIET_EXTRA_CHOICES: StyleChoice[] = [
  { tag: 'Gluten-Free', label: 'Gluten-Free', caption: 'No wheat, barley or rye.' },
  { tag: 'Dairy-Free', label: 'Dairy-Free', caption: 'No milk, cheese, butter or yogurt.' },
  { tag: 'High-Protein', label: 'High-Protein', caption: 'Every dish has meat, fish, eggs, beans, tofu or a high-protein dairy food in it.' },
];

export type PlanDiet = {
  base: RecipeDietTag | null;
  styles: RecipeDietTag[];
  extras: RecipeDietTag[];
};

const STYLE_TAGS = new Set<string>(EATING_STYLE_CHOICES.map((choice) => choice.tag));
const EXTRA_TAGS = new Set<string>(DIET_EXTRA_CHOICES.map((choice) => choice.tag));

/** Profile's saved list, split into the three questions. Unknown tags are dropped. */
export function splitDietPreferences(tags: readonly string[]): PlanDiet {
  // The strictest base wins, the same ordering BASE_DIET_TIER_RANK uses.
  const base: RecipeDietTag | null = tags.includes('Vegan') ? 'Vegan' : tags.includes('Vegetarian') ? 'Vegetarian' : null;
  const styles = EATING_STYLE_CHOICES.map((choice) => choice.tag).filter((tag) => tags.includes(tag));
  const extras = DIET_EXTRA_CHOICES.map((choice) => choice.tag).filter((tag) => tags.includes(tag));
  return { base, styles, extras };
}

/** The tag list the generator filters by: every tag has to hold at once. */
export function planDietTags(diet: PlanDiet): RecipeDietTag[] {
  return [
    ...(diet.base ? [diet.base] : []),
    ...diet.styles.filter((tag) => STYLE_TAGS.has(tag)),
    ...diet.extras.filter((tag) => EXTRA_TAGS.has(tag)),
  ];
}

export function toggleTag(list: RecipeDietTag[], tag: RecipeDietTag): RecipeDietTag[] {
  return list.includes(tag) ? list.filter((item) => item !== tag) : [...list, tag];
}

export function baseChoiceLabel(base: RecipeDietTag | null): string {
  return BASE_DIET_CHOICES.find((choice) => choice.tag === base)?.label ?? 'Everything';
}

export function sameDiet(a: PlanDiet, b: PlanDiet): boolean {
  return JSON.stringify(planDietTags(a)) === JSON.stringify(planDietTags(b));
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function labelOf(tag: RecipeDietTag): string {
  return [...EATING_STYLE_CHOICES, ...DIET_EXTRA_CHOICES].find((choice) => choice.tag === tag)?.label ?? tag;
}

/** One sentence under a plan saying which way of eating it was built around. */
export function describePlanDiet(diet: PlanDiet): string {
  const parts: string[] = [];
  if (diet.base) parts.push(diet.base.toLowerCase());
  for (const tag of diet.styles) parts.push(tag === 'AIP' ? 'AIP' : labelOf(tag));
  for (const tag of diet.extras) parts.push(labelOf(tag).toLowerCase());
  if (parts.length === 0) return 'Built from every recipe, with no eating style chosen.';
  return `Every dish fits ${joinWords(parts)} eating.`;
}

/** Said when the form no longer matches Profile, so the person knows Profile is unchanged. */
export function describeDifferenceFromProfile(diet: PlanDiet, profile: PlanDiet): string | null {
  if (sameDiet(diet, profile)) return null;
  return 'This plan only. Profile > Diet Preferences stays as it is.';
}
