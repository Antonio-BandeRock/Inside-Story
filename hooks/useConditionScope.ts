import { useEffect, useState } from 'react';
import { getCuriousAboutConditions, getUserConditions } from '../lib/db';

// The two lists that decide whose cautions a person is shown, and the wall
// between them.
//
// Direct instruction, 1.0.40.10: "The Worth Knowing if you have part of each
// recipe should be related only to their selected conditions, and not just any
// condition as it appears to be currently. If they have selected to be
// interested in any other conditions, that should also be identified in case
// they are keeping a watchful eye for someone else, but those interests are
// never used with their own Inside Story."
//
// `own` is user_conditions: what the person has, and the only list that is
// ever allowed to shape anything about them. `curious` is
// curious_about_conditions, added 2026-08-23 for exactly this reason, in the
// owner's own words then: "they should be able to select to include data from
// any of the other conditions... this shouldn't mean that those conditions are
// now added to their own that the app tracks and helps with."
//
// **The hard rule, and it has no exceptions: `curious` never feeds food
// scoring, meal planning, advisories, interaction rules, healing stages or
// safe-food logic.** It decides what a person is SHOWN and labels it plainly
// as somebody else's, and it stops there. Anything computing a result about
// this person reads `own` alone. The two are returned as separate fields, and
// never merged into one array, so a future caller has to decide deliberately
// rather than reach for a combined list that does the wrong thing quietly.
export type ConditionScope = {
  own: string[];
  curious: string[];
  // False until the first read comes back. A caller showing conditions-based
  // text should wait rather than flash the unscoped version and then cut it
  // down, which reads as content disappearing.
  ready: boolean;
};

// Held across mounts because a recipe card mounts once per opened recipe and
// this answer does not change between two of them. First open pays for the
// read; every later one starts from the answer and refreshes behind itself,
// so a condition ticked in Profile lands on the next recipe opened.
let cached: { own: string[]; curious: string[] } | null = null;

export function useConditionScope(): ConditionScope {
  const [scope, setScope] = useState<ConditionScope>(
    cached ? { ...cached, ready: true } : { own: [], curious: [], ready: false },
  );

  useEffect(() => {
    let mounted = true;
    Promise.all([getUserConditions(), getCuriousAboutConditions()])
      .then(([own, curious]) => {
        cached = { own, curious };
        if (mounted) setScope({ own, curious, ready: true });
      })
      .catch(() => {
        // A failed read must not be mistaken for "this person has no
        // conditions", which would silently hide every caution. Staying
        // un-ready keeps the caller on its unscoped fallback instead.
      });
    return () => {
      mounted = false;
    };
  }, []);

  return scope;
}
