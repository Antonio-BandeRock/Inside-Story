// The people a meal plan feeds, read from the database (2026-09-27). The
// picking itself is pure and lives in lib/householdPlan.ts; this module only
// gathers who is at the table: you, a partner when there is one, and every
// family member on Life > Conditions marked for meal planning.
//
// You carry the conditions the plan has always been built around (your own,
// merged with a partner's where they share them), the eating style chosen
// for this plan, and the allergies and food restrictions from Profile. A
// partner joins as one more serving with nothing of their own to check,
// since their conditions are already in yours. Each family member carries
// their own lists, so their conditions shape the dishes they eat rather than
// narrowing every dish for everybody.
import { getFamilyMembers } from './db';
import { RECIPE_DIET_TAGS, type RecipeDietTag } from './digest/types';
import { getPersonalizationProfile } from './foodPersonalization';
import { knownRestrictions } from './foodRestrictions';
import {
  AGE_GROUP_CHOICES,
  PLAN_MEALS,
  YOU_EATER_ID,
  type AgeGroup,
  type PlanEater,
  type PlanMeal,
  type PlanSex,
  type PortionSize,
} from './householdPlan';
import type { PlanningScope } from './partnerPlanning';

const PORTIONS: PortionSize[] = ['smaller', 'regular', 'larger'];

export async function resolveHouseholdEaters(scope: PlanningScope, dietPreferences: RecipeDietTag[]): Promise<PlanEater[]> {
  const [profile, members] = await Promise.all([getPersonalizationProfile(), getFamilyMembers()]);
  const eaters: PlanEater[] = [
    {
      id: YOU_EATER_ID,
      name: 'You',
      isYou: true,
      conditionCodes: scope.tableCodes,
      dietTags: dietPreferences,
      allergies: profile.foodAllergies,
      restrictions: profile.foodRestrictions,
      portion: 'regular',
      soft: false,
      awayMeals: [],
      livesFrom: null,
      livesUntil: null,
      ageGroup: null,
      sex: null,
    },
  ];
  if (scope.partnerName) {
    eaters.push({
      id: 'partner',
      name: scope.partnerName,
      isYou: false,
      conditionCodes: [],
      dietTags: [],
      allergies: [],
      restrictions: [],
      portion: 'regular',
      soft: false,
      awayMeals: [],
      livesFrom: null,
      livesUntil: null,
      ageGroup: null,
      sex: null,
    });
  }
  for (const member of members) {
    if (!member.includeInMealPlan) continue;
    eaters.push({
      id: member.id,
      name: member.name,
      isYou: false,
      conditionCodes: [...new Set(member.conditionCodes)].sort(),
      dietTags: member.dietTags.filter((tag): tag is RecipeDietTag => (RECIPE_DIET_TAGS as readonly string[]).includes(tag)),
      allergies: member.allergies,
      restrictions: knownRestrictions(member.restrictions),
      portion: PORTIONS.includes(member.portion as PortionSize) ? (member.portion as PortionSize) : 'regular',
      soft: member.softFood,
      awayMeals: member.awayMeals.filter((meal): meal is PlanMeal => (PLAN_MEALS as string[]).includes(meal)),
      livesFrom: member.livesFrom,
      livesUntil: member.livesUntil,
      ageGroup: AGE_GROUP_CHOICES.some((choice) => choice.key === member.ageGroup) ? (member.ageGroup as AgeGroup) : null,
      sex: member.sex === 'male' || member.sex === 'female' ? (member.sex as PlanSex) : null,
    });
  }
  return eaters;
}
