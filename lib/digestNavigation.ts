import { DIGEST_KEY_TO_CONDITION_CODE } from './conditionCodeMap';
import { findDigestEntryById, type DigestCategoryKey } from './digest';

// Where a Digest entry opens, now that the conditions have moved.
//
// Direct instruction, 2026-09-19: "we are moving the conditions all to
// Life." Every condition's entries render in Life > Conditions
// (components/ConditionsSection.tsx) and are no longer reachable through
// the Digest's picker, so anything that pushes to an entry by id (a Home
// flip card's Read More, Profile's neurodivergence link, a Related chip
// tapped from a non-condition entry, a Search All hit) has to ask this
// rather than push '/purple-digest' and hope. One place decides, so a
// category moving again is one edit here.

/** Whether a category is one of the 19 tracked conditions. */
export function isConditionCategory(category: DigestCategoryKey): boolean {
  return DIGEST_KEY_TO_CONDITION_CODE[category] !== undefined;
}

export type DigestEntryRoute =
  | { pathname: '/life'; params: { openLifeLens: 'conditions'; openEntryId: string } }
  | { pathname: '/purple-digest'; params: { openEntryId: string } };

/**
 * The route that opens one entry in place. An unknown id still goes to
 * the Digest, which ignores an id it cannot find rather than breaking.
 */
export function routeForDigestEntry(id: string): DigestEntryRoute {
  const entry = findDigestEntryById(id);
  if (entry && isConditionCategory(entry.category as DigestCategoryKey)) {
    return { pathname: '/life', params: { openLifeLens: 'conditions', openEntryId: id } };
  }
  return { pathname: '/purple-digest', params: { openEntryId: id } };
}
