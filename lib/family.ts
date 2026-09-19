// The family members whose conditions a meal plan is planned around.
//
// A thin read over lib/db.ts's family roster, kept in its own module for the
// same reason lib/connections.ts sits between the partner tables and
// lib/partnerPlanning.ts: resolvePlanningScope reads the household itself
// rather than taking it as an argument, so no call site can plan for the
// family by passing the wrong thing or miss it by forgetting to look, and
// scripts/test_partner_planning.js can swap this one module for a fake
// without stubbing the whole database.
import { getFamilyMembers } from './db';

export type FamilyPlanningMember = {
  name: string;
  conditionCodes: string[];
};

/** Every family member marked for meal planning, with their conditions. */
export async function getMealPlanningFamily(): Promise<FamilyPlanningMember[]> {
  const members = await getFamilyMembers();
  return members
    .filter((member) => member.includeInMealPlan)
    .map((member) => ({ name: member.name, conditionCodes: [...new Set(member.conditionCodes)].sort() }));
}
