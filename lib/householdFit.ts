// Who in the household a food suits (G20, 2026-09-27).
//
// The one phrase on Food Lookup, a scan and a recipe spoke only about the
// person holding the phone. A household eats together, so this says the
// same thing once per person: the person themselves, then everyone on the
// Family roster in Life > Conditions, each against their own conditions,
// allergies, eating styles and food restrictions.
//
// It never says a food is safe for anyone. A clear line reads "Nothing on
// Sam's lists", because a list can miss a word, and where a recipe carries
// no condition data the line says the conditions were not checked rather
// than reading every condition as a miss.
//
// Pure, with no React and no database, so scripts/test_household_fit.js
// checks it without a phone. getHouseholdPeople in lib/foodPersonalization.ts
// builds the people.
import {
  foodOneWord,
  type FoodOneWord,
  type FoodOneWordTone,
} from "./foodOneWord";
import { restrictionHitsInText } from "./foodRestrictions";
import {
  checkIngredients,
  type CheckedIngredient,
  type IngredientCheckSettings,
} from "./ingredientFlags";
import {
  recipeMatchesDietPreference,
  type RecipeDietTag,
} from "./digest/types";
import type { PersonalizationProfile } from "./foodPersonalization";

export type HouseholdPerson = {
  /** 'you' for the person holding the phone, otherwise the family member's id. */
  id: string;
  name: string;
  isYou: boolean;
  profile: PersonalizationProfile;
};

export type HouseholdLine = {
  personId: string;
  /** "You" or the member's name. */
  who: string;
  phrase: string;
  tone: FoodOneWordTone;
  /** Anything this line could not check, said in words. */
  unchecked: string | null;
};

export const YOU_ID = "you";

/** "your", or "Sam's". */
export function possessiveFor(
  person: Pick<HouseholdPerson, "name" | "isYou">,
): string {
  return person.isYou ? "your" : `${person.name}'s`;
}

export function whoFor(
  person: Pick<HouseholdPerson, "name" | "isYou">,
): string {
  return person.isYou ? "You" : person.name;
}

function holdsAnything(profile: PersonalizationProfile): boolean {
  return (
    profile.trackedConditions.length > 0 ||
    profile.dietPreferences.length > 0 ||
    profile.foodAllergies.length > 0 ||
    profile.foodRestrictions.length > 0
  );
}

function nothingSetPhrase(person: HouseholdPerson): string {
  return person.isYou
    ? "Nothing set in Profile to check against"
    : `Nothing set for ${person.name} to check against`;
}

/**
 * foodOneWord for one person, with its "fits" phrase made honest for a
 * person whose conditions were not checked or who set nothing at all.
 */
export function oneWordFor(
  person: HouseholdPerson,
  input: Omit<Parameters<typeof foodOneWord>[0], "owner">,
  checked: { conditions: boolean; diet: boolean },
): FoodOneWord {
  const owner = possessiveFor(person);
  const result = foodOneWord({ ...input, owner });
  if (result.tone !== "fits") return result;
  if (!holdsAnything(person.profile))
    return { phrase: nothingSetPhrase(person), tone: "fits" };
  if (input.trackedConditions.length > 0) return result;
  if (checked.diet && person.profile.dietPreferences.length > 0) return result;
  return { phrase: `Nothing on ${owner} lists`, tone: "fits" };
}

function uncheckedSentence(parts: string[]): string | null {
  if (parts.length === 0) return null;
  const joined =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)} not checked for this one.`;
}

/** The shape of a recipe this reads; RecipeCard carries all of it. */
export type RecipeForFit = {
  dietTags?: RecipeDietTag[];
  safeForConditions?: string[];
  conditionCautions?: Record<
    string,
    { severity: "yellow" | "red"; note: string }
  >;
  ingredients: { text: string }[];
};

export function recipeFitFor(
  person: HouseholdPerson,
  card: RecipeForFit,
): HouseholdLine {
  const profile = person.profile;
  const text = card.ingredients.map((line) => line.text).join(", ");
  const lower = text.toLowerCase();
  const conditionsChecked = card.safeForConditions !== undefined;
  const dietChecked = card.dietTags !== undefined && card.dietTags.length > 0;
  const trackedConditions = conditionsChecked ? profile.trackedConditions : [];
  const dietViolations = dietChecked
    ? profile.dietPreferences.filter(
        (preference) => !recipeMatchesDietPreference(card.dietTags, preference),
      )
    : [];
  const allergyMatch =
    profile.foodAllergies.find(
      (name) => name.trim() && lower.includes(name.trim().toLowerCase()),
    ) ?? null;
  const restrictionHits = restrictionHitsInText(text, profile.foodRestrictions);
  const oneWord = oneWordFor(
    person,
    {
      trackedConditions,
      safeForConditions: card.safeForConditions ?? [],
      conditionCautions: card.conditionCautions ?? {},
      dietViolations,
      allergyMatch,
      restrictionHits,
    },
    { conditions: conditionsChecked, diet: dietChecked },
  );
  const unchecked: string[] = [];
  if (!conditionsChecked && profile.trackedConditions.length > 0)
    unchecked.push(`${possessiveFor(person)} conditions`);
  if (!dietChecked && profile.dietPreferences.length > 0)
    unchecked.push(`${possessiveFor(person)} eating style`);
  return {
    personId: person.id,
    who: whoFor(person),
    phrase: oneWord.phrase,
    tone: oneWord.tone,
    unchecked: uncheckedSentence(unchecked),
  };
}

/** Condition flags bound to one person's conditions; lib/scannedProductFlags.ts supplies it. */
export type ConditionFlagsForPerson = (
  conditionCodes: string[],
) => IngredientCheckSettings["conditionFlagsFor"];

export function labelSettingsFor(
  person: HouseholdPerson,
  conditionFlags?: ConditionFlagsForPerson,
): IngredientCheckSettings {
  const codes = person.profile.trackedConditions.map(
    (condition) => condition.code,
  );
  return {
    conditions: codes,
    dietTags: person.profile.dietPreferences,
    allergies: person.profile.foodAllergies,
    restrictions: person.profile.foodRestrictions,
    conditionFlagsFor: conditionFlags?.(codes),
    conditionName: (code) =>
      person.profile.trackedConditions.find(
        (condition) => condition.code === code,
      )?.name ?? code.replace(/_/g, " "),
  };
}

const COUNT_WORDS = [
  "No",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
];

function namesList(rows: CheckedIngredient[]): string {
  const names = rows.map((row) => row.name.toLowerCase());
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`;
}

/** One person's line for an ingredient list off a package. */
export function labelFitFor(
  person: HouseholdPerson,
  labelText: string,
  conditionFlags?: ConditionFlagsForPerson,
): HouseholdLine {
  const who = whoFor(person);
  const owner = possessiveFor(person);
  if (!holdsAnything(person.profile)) {
    return {
      personId: person.id,
      who,
      phrase: nothingSetPhrase(person),
      tone: "fits",
      unchecked: null,
    };
  }
  const rows = checkIngredients(
    labelText,
    labelSettingsFor(person, conditionFlags),
  );
  const touched = rows.filter((row) =>
    row.reasons.some((reason) => reason.tone === "yours"),
  );
  if (touched.length === 0)
    return {
      personId: person.id,
      who,
      phrase: `Nothing on ${owner} lists`,
      tone: "fits",
      unchecked: null,
    };
  const allergyRows = touched.filter((row) =>
    row.reasons.some(
      (reason) => reason.tone === "yours" && reason.kind === "allergy",
    ),
  );
  if (allergyRows.length > 0) {
    return {
      personId: person.id,
      who,
      phrase: `Contains one of ${owner} allergies: ${namesList(allergyRows)}`,
      tone: "stop",
      unchecked: null,
    };
  }
  const n = touched.length;
  const lead = `${COUNT_WORDS[n] ?? String(n)} ingredient${n === 1 ? "" : "s"} on ${owner} lists`;
  return {
    personId: person.id,
    who,
    phrase: `${lead}: ${namesList(touched)}`,
    tone: "caution",
    unchecked: null,
  };
}

export const HOUSEHOLD_FIT_CAPTION =
  "Each line checks this against what that person set: conditions, allergies, eating style and food restrictions. Family members are set in Life > Conditions. Allergen-aware, not allergy-safe: a word can be missed, so the package or the cook is the last word.";
