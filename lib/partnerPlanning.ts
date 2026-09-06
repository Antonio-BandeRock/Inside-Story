// Who a meal plan is actually being generated for.
//
// This is the piece that turns a stored partner link into something the meal
// generator can use. Everything it needs already existed and was tested and
// wired to nothing: mergeConditionCodes in lib/partners.ts, and
// generateMealPlanDays, which takes its condition array FROM ITS CALLER and
// never fetches conditions itself. So planning for two people is a merge at the
// call site rather than a change to the generator.
//
// THE DECISION THIS RESTS ON, given directly: generate fresh for both, rather
// than adopting whichever person's existing plan came first. A plan built for
// one person was never filtered against the other's conditions, so adopting it
// means serving meals nobody checked. Generating fresh costs one regeneration
// and checks every day against both.
//
// The refusals matter as much as the merge. Planning around one person while a
// screen implies both is the failure mode worth avoiding, so every case where
// the partner's conditions are NOT included says which piece is missing.
import { getMealPlanningPartner } from './connections';
import {
  type LinkState,
  type MergeResult,
  linkState,
  mergeConditionCodes,
} from './partners';

export type PlanningScope = {
  /** What to hand the generator. Merged when a partner's conditions are in play, mine alone otherwise. */
  conditionCodes: string[];
  /** Null when planning for one person. */
  partnerName: string | null;
  /** Present whenever a partner exists at all, even if their conditions are not usable. */
  merge: MergeResult | null;
  link: LinkState | null;
  /** Whether the codes handed to the generator actually cover two people. */
  coversBoth: boolean;
  /**
   * How many OTHER people are also marked partner.
   *
   * Surfaced rather than hidden. Nothing stops someone marking two people as
   * partners, and planning one dinner around three sets of conditions is a
   * different feature from the one asked for. Guessing which two to use would
   * be worse than saying there is more than one.
   */
  otherPartners: number;
};

/**
 * Resolves the scope for a plan about to be generated.
 *
 * Reads the partner rather than taking one as an argument, so no call site can
 * plan for two people by passing the wrong thing, and no call site can miss a
 * partner by forgetting to look. The same reasoning buildPartnerInvite already
 * follows for the condition grant.
 */
export async function resolvePlanningScope(input: {
  myConditionCodes: string[];
  today: string;
}): Promise<PlanningScope> {
  const mine = [...new Set(input.myConditionCodes)].sort();
  const { partner, others } = await getMealPlanningPartner();

  if (!partner) {
    return { conditionCodes: mine, partnerName: null, merge: null, link: null, coversBoth: false, otherPartners: 0 };
  }

  const link = linkState(partner.theyHaveMeAt);
  const merge = mergeConditionCodes({
    mine,
    partner: partner.theirConditionCodes.length
      ? { name: partner.name, codes: partner.theirConditionCodes, receivedAt: partner.theirConditionsAt }
      : null,
    // Read from the grant rather than from whether codes happen to be present,
    // so a stale list left behind by a grant that was since switched off does
    // not quietly keep being planned around.
    partnerSharesConditions: partner.grants.conditions,
    linked: link,
    today: input.today,
  });

  return {
    conditionCodes: merge.codes,
    partnerName: partner.name,
    merge,
    link,
    coversBoth: merge.refusal === null,
    otherPartners: others,
  };
}

/**
 * One sentence for the screen about who this plan was built for.
 *
 * Deliberately never silent. A plan generated for one person while a partner is
 * linked has to say so, because the whole reason someone set up a partner is
 * the expectation that both are being planned around.
 */
export function describePlanningScope(scope: PlanningScope): string {
  if (!scope.partnerName) return 'Planned around your conditions.';
  const extra = scope.otherPartners > 0
    ? ` You have ${scope.otherPartners} other ${scope.otherPartners === 1 ? 'partner' : 'partners'}, and only ${scope.partnerName} is planned around.`
    : '';
  if (scope.coversBoth) {
    const count = scope.conditionCodes.length;
    const base = `Planned around both of you, across ${count} ${count === 1 ? 'condition' : 'conditions'} between you.`;
    return scope.merge?.stale
      ? `${base} ${scope.partnerName}'s list is more than six months old, so it is worth asking whether it is still right.${extra}`
      : `${base}${extra}`;
  }
  switch (scope.merge?.refusal) {
    case 'notLinked':
      return `Planned around you alone. ${scope.partnerName} has not confirmed the link yet, so their conditions are not here to plan around.${extra}`;
    case 'notShared':
      return `Planned around you alone. ${scope.partnerName} has not shared which conditions they track, and that is theirs to offer rather than yours to switch on.${extra}`;
    case 'noneOfTheirs':
      return `Planned around both of you. ${scope.partnerName} tracks no conditions, so there is nothing extra to plan around.${extra}`;
    default:
      return 'Planned around your conditions.';
  }
}

/**
 * Whether a freshly generated plan should replace one that already exists.
 *
 * Named as its own decision rather than left implicit at a call site, because
 * it is the one the person was asked about directly. A plan generated for a
 * narrower set of conditions than the one now in play was never checked against
 * the conditions it is missing, so it is not safe to keep.
 */
export function shouldRegenerateForScope(input: {
  planWasBuiltFor: string[] | null;
  scope: PlanningScope;
}): { regenerate: boolean; why: string | null } {
  if (!input.planWasBuiltFor) return { regenerate: false, why: null };
  const before = [...new Set(input.planWasBuiltFor)].sort().join(',');
  const now = [...new Set(input.scope.conditionCodes)].sort().join(',');
  if (before === now) return { regenerate: false, why: null };
  return {
    regenerate: true,
    why: input.scope.coversBoth && input.scope.partnerName
      ? `This plan was built before ${input.scope.partnerName}'s conditions were part of it. Generating it again checks every day against both of you.`
      : 'The conditions this plan was built around have changed. Generating it again checks every day against the current set.',
  };
}
