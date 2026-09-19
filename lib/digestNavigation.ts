import { DIGEST_KEY_TO_CONDITION_CODE } from './conditionCodeMap';
import { findDigestEntryById, type DigestCategoryKey } from './digest';

// Where a Digest entry opens, now that the Digest is no longer a tab.
//
// Direct instruction, 2026-09-19: "we are moving the conditions all to
// Life," then the same day, "Gardening needs to be moved from Digest to
// Garden ... Earth Matters and Basic Health both should become a lens
// each in the Life tab ... Let's remove Digest as a tab after everything
// is moved." So every category now lives as a lens on some other tab:
// the 19 conditions, Health Literacy and Earth Matters on Life,
// Horticulture on Garden, and the recipe categories on Food. Anything
// that opens an entry by id (a Home flip card's Read More, Profile's
// neurodivergence link, a Related chip tapped from another category, a
// Search Reading hit) asks this rather than guessing a route. One place
// decides, so a category moving again is one edit here.

/** Whether a category is one of the 19 tracked conditions. */
export function isConditionCategory(category: DigestCategoryKey): boolean {
  return DIGEST_KEY_TO_CONDITION_CODE[category] !== undefined;
}

export type LifeReadingLens = 'conditions' | 'healthLiteracy' | 'earthMatters';

export type DigestEntryRoute =
  | { pathname: '/life'; params: { openLifeLens: LifeReadingLens; openEntryId: string } }
  | { pathname: '/garden'; params: { openGardenLens: 'horticulture'; openEntryId: string } }
  | { pathname: '/food'; params: { openFoodLens: 'systemRecipes' | 'myRecipes'; openEntryId: string } };

/** The tab an entry's category lives on, for colouring a card by its source. */
export function tabPathForDigestCategory(category: DigestCategoryKey): '/life' | '/garden' | '/food' {
  if (category === 'homeGardening') return '/garden';
  if (category === 'recipes' || category === 'myKitchen' || category === 'myFavorites') return '/food';
  return '/life';
}

/**
 * The route that opens one entry in place. An unknown id goes to Health
 * Literacy on Life, which ignores an id it cannot find rather than
 * breaking.
 */
export function routeForDigestEntry(id: string): DigestEntryRoute {
  const entry = findDigestEntryById(id);
  const category = (entry?.category ?? 'basicHealth') as DigestCategoryKey;
  if (isConditionCategory(category)) {
    return { pathname: '/life', params: { openLifeLens: 'conditions', openEntryId: id } };
  }
  if (category === 'homeGardening') {
    return { pathname: '/garden', params: { openGardenLens: 'horticulture', openEntryId: id } };
  }
  if (category === 'recipes') {
    return { pathname: '/food', params: { openFoodLens: 'systemRecipes', openEntryId: id } };
  }
  if (category === 'myKitchen' || category === 'myFavorites') {
    return { pathname: '/food', params: { openFoodLens: 'myRecipes', openEntryId: id } };
  }
  if (category === 'earthMatters') {
    return { pathname: '/life', params: { openLifeLens: 'earthMatters', openEntryId: id } };
  }
  return { pathname: '/life', params: { openLifeLens: 'healthLiteracy', openEntryId: id } };
}
