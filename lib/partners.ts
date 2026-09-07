// A partner link: two people, two phones, one dinner.
//
// Built 2026-09-06. The first real two-person connection in this app, and
// deliberately the first, because it is the concrete case that forces the
// pairing handshake to be finished rather than described.
//
// WHAT WAS ALREADY BUILT, AND WHY THIS IS SMALLER THAN IT LOOKS.
//
// The nutrition half is already done and was done without knowing it. The meal
// generator never asks who it is planning for: generateMealPlanDays takes
// conditionCodes as a plain array from its caller, and recipeSafeAcrossConditions
// already loops however many codes it is given. So combining two people's
// conditions is a merge of two arrays, not a new engine.
//
// What was genuinely missing is trust and transport, which is what this file and
// its callers are about.
//
// THE DESIGN DECISION EVERYTHING ELSE FOLLOWS FROM, decided directly:
// SHARED MEAL, PER-PERSON CAUTIONS.
//
// The obvious reading of "combine our conditions" is an intersection: show only
// meals safe for both. That is wrong, and it fails loudly rather than quietly.
// This project already learned that intersecting conditions collapses the
// candidate pool, and recipeSafeAcrossConditions treats "no data for this
// condition" the same as "red", so one thinly-covered condition would empty a
// menu with no visible reason.
//
// So the rule here is narrower and more useful:
//
//   EXCLUDE a meal only if it is RED for someone. Keep it if it is yellow for
//   someone, and say for whom.
//
// One dinner gets cooked. Both people see the same plan. Each person's app says
// what that meal means for THEM. A shared dinner where one person leaves out one
// component is a real outcome, not a failure, and it is what actually happens in
// a house.
//
// WHAT CROSSES THE WIRE, decided directly: CONDITION CODES.
//
// Codes only. Never a symptom, never a lab result, never a healing stage, never
// a note. A condition list is the least that can be sent and still combine two
// people's meals, and it is a thing live-in partners already know about each
// other. It is still health data, so it is its own explicit grant rather than
// riding along with the meal sharing.
//
// ONE TABLE WITH ROLES, decided directly. A person is one row in connections
// whatever they are to you, because your sister can be both a partner and
// someone you send a recipe to, and two rows would guarantee her key goes stale
// in one of them.

export type ConnectionRole = 'recipe' | 'partner';

export const CONNECTION_ROLES: { code: ConnectionRole; label: string; what: string }[] = [
  {
    code: 'recipe',
    label: 'Recipes only',
    what: 'You can send each other a dish. Nothing else is shared and nothing happens on its own.',
  },
  {
    code: 'partner',
    label: 'Partner',
    what: 'You plan meals together. You both see the same days, each with what those meals mean for your own conditions.',
  },
];

// --- What you grant them ----------------------------------------------------
//
// These are one-directional on purpose: this is what YOU let THEM see. What they
// let you see arrives with their own data, so there is nothing to store for it.
// Absence of their data is absence of their grant, and the screen can say so
// without keeping a second set of columns that could disagree with reality.

export type ShareScope = 'meals' | 'shopping' | 'conditions';

export const SHARE_SCOPES: {
  code: ShareScope;
  label: string;
  what: string;
  /** Whether a fresh partner link starts with this on. */
  defaultOn: boolean;
}[] = [
  {
    code: 'meals',
    label: 'Meals',
    what: 'Permission to see what is planned for each day, once the two phones can pass a plan between them.',
    defaultOn: true,
  },
  {
    code: 'shopping',
    label: 'Shopping lists',
    what: 'Permission to see the list, so either of you can be the one who actually goes.',
    defaultOn: true,
  },
  {
    code: 'conditions',
    label: 'Which conditions you track',
    what: 'The names only, so meals can be planned around both of you at once. Never your symptoms, your labs, your healing stage or your notes, none of which are sent anywhere by this.',
    // Off until asked for. Meals and shopping are household facts; a list of
    // your diagnoses is not, and defaulting it on would be this app deciding
    // something on your behalf that it has no business deciding.
    defaultOn: false,
  },
];

export type ShareGrants = Record<ShareScope, boolean>;

export function defaultGrantsForRole(role: ConnectionRole): ShareGrants {
  if (role !== 'partner') return { meals: false, shopping: false, conditions: false };
  return SHARE_SCOPES.reduce((acc, scope) => {
    acc[scope.code] = scope.defaultOn;
    return acc;
  }, {} as ShareGrants);
}

export function describeGrants(grants: ShareGrants): string {
  const on = SHARE_SCOPES.filter((scope) => grants[scope.code]);
  if (on.length === 0) return 'You have allowed them nothing.';
  return `You have allowed: ${on.map((scope) => scope.label.toLowerCase()).join(', ')}.`;
}

/**
 * The honest state of a partner link, today.
 *
 * Pairing is real and finished: the keys are exchanged, the role is stored, and
 * these permissions are recorded. What does NOT exist yet is any way for one
 * phone to hand a meal plan to the other, so nothing actually moves between the
 * two devices.
 *
 * This is deliberately one string in one place rather than wording scattered
 * across the screens, so that when transport ships there is exactly one thing
 * to delete rather than several claims to hunt down. Until then the app says so
 * plainly, because a partner screen that reads as finished while nothing flows
 * is the same overclaiming this project refuses everywhere else.
 */
export const PARTNER_SHARING_NOT_LIVE =
  'Which conditions you track crosses when you show each other your codes, and a meal plan you generate is then built around both of you. Passing the plan itself, and shopping lists, between two phones is not built yet.';

// --- Whether the link actually works both ways -------------------------------
//
// Pairing has no cryptographic guarantee before the keys are exchanged, which
// app/connect.tsx has said honestly since it was written. So this does not claim
// a verified mutual link. It tracks what each side actually KNOWS:
//
//   I have them        the row exists at all
//   they have me       they sent back a confirmation saying so
//
// If the second never arrives, the screen says exactly that rather than implying
// a working two-way link. Sending still works one way in the meantime, so this
// reports a state rather than blocking anything.

export type LinkState = 'awaiting-them' | 'linked';

export function linkState(theyHaveMeAt: string | null): LinkState {
  return theyHaveMeAt ? 'linked' : 'awaiting-them';
}

export function describeLinkState(state: LinkState, name: string): string {
  return state === 'linked'
    ? `${name} has confirmed they added you, so this works both ways.`
    : `You have added ${name}. They have not confirmed adding you yet, so anything you send may not have anywhere to land. Send them the link again if it has been a while.`;
}

/**
 * Whether the fingerprint step has been done.
 *
 * For a single recipe this is genuinely optional, which is how it shipped. For a
 * partner link it is the only defence against having accepted a substituted key,
 * and the link carries health data continuously rather than once, so a partner
 * link that has not been checked says so rather than looking finished.
 */
export function fingerprintStanding(role: ConnectionRole, verifiedAt: string | null): {
  verified: boolean;
  matters: boolean;
  message: string;
} {
  const verified = !!verifiedAt;
  const matters = role === 'partner';
  if (verified) {
    return { verified: true, matters, message: 'You have compared this code with them.' };
  }
  return {
    verified: false,
    matters,
    message: matters
      ? 'You have not compared the code with them yet. Read the four groups out loud to each other, on the phone or across the room, and confirm they match. It is the only way to be sure the link is with them and not with whoever passed it along.'
      : 'You can compare the code with them if you want to be certain, though nothing here depends on it.',
  };
}

// --- Combining two people's conditions ---------------------------------------

export type PartnerConditions = {
  name: string;
  codes: string[];
  /** When they last sent them. Their list going stale is a real thing. */
  receivedAt: string | null;
};

/** Beyond this, a partner's condition list is worth asking about again. */
export const CONDITIONS_STALE_AFTER_DAYS = 180;

export type MergeResult = {
  /** Every code to plan against, deduped and stable. */
  codes: string[];
  /** Why combining is not possible, when it is not. */
  refusal: 'notLinked' | 'notShared' | 'noneOfTheirs' | null;
  /** Their list is old enough to be worth confirming. Not a refusal. */
  stale: boolean;
};

export function mergeConditionCodes(input: {
  mine: string[];
  partner: PartnerConditions | null;
  partnerSharesConditions: boolean;
  linked: LinkState;
  today: string;
}): MergeResult {
  const mine = [...new Set(input.mine)].sort();

  if (input.linked !== 'linked') return { codes: mine, refusal: 'notLinked', stale: false };
  if (!input.partnerSharesConditions) return { codes: mine, refusal: 'notShared', stale: false };
  if (!input.partner || input.partner.codes.length === 0) {
    return { codes: mine, refusal: 'noneOfTheirs', stale: false };
  }

  const stale = isStale(input.partner.receivedAt, input.today);
  // Sorted so the merged array is stable regardless of which side is read
  // first: the generator caches candidate pools, and an order that flipped
  // between reads would look like a different request for the same thing.
  return { codes: [...new Set([...mine, ...input.partner.codes])].sort(), refusal: null, stale };
}

function isStale(receivedAt: string | null, today: string): boolean {
  if (!receivedAt) return true;
  const a = Date.parse(`${receivedAt.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${today.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return true;
  return Math.round((b - a) / 86400000) > CONDITIONS_STALE_AFTER_DAYS;
}

export function describeMerge(result: MergeResult, partnerName: string): string {
  switch (result.refusal) {
    case 'notLinked':
      return `Planning around you alone. ${partnerName} has not confirmed the link yet, so their conditions are not here to plan around.`;
    case 'notShared':
      return `Planning around you alone. ${partnerName} has not shared which conditions they track, and that is theirs to offer rather than yours to switch on.`;
    case 'noneOfTheirs':
      return `Planning around you alone, because ${partnerName} tracks no conditions. Meals are still shared; there is just nothing extra to plan around.`;
    default:
      break;
  }
  const base = `Planning around both of you, across ${result.codes.length} ${result.codes.length === 1 ? 'condition' : 'conditions'} between you.`;
  return result.stale
    ? `${base} Their list is more than six months old, so it is worth asking whether it is still right.`
    : base;
}

// --- Per-person cautions on one shared meal ----------------------------------

export type PersonTier = 'green' | 'yellow' | 'red' | 'unknown';

export type PersonVerdict = {
  who: string;
  tier: PersonTier;
};

export type SharedMealVerdict = {
  /** Whether this meal can be planned for both at all. */
  plannable: boolean;
  perPerson: PersonVerdict[];
  /** Who, if anyone, it is red for. The reason it cannot be planned. */
  excludedFor: string[];
};

/**
 * The rule, stated once: a meal is out if it is RED for anyone, and kept with a
 * note if it is merely yellow.
 *
 * tierFor is injected rather than imported so this stays free of the database
 * and of lib/dailyMealPlan.ts, which cannot be loaded without one. The caller
 * passes the same conditionTierForEntry the generator already uses.
 *
 * 'unknown' is treated as NOT excluding. That is deliberate and it is the
 * opposite of what the generator does for a single person, where no data counts
 * as red. Here the meal has already survived that gate for whoever is planning;
 * refusing again because the app has no data about the partner's condition would
 * empty a shared menu over a coverage gap rather than a real risk, and would look
 * like a bug rather than a caution.
 */
export function verdictForSharedMeal(
  people: { name: string; codes: string[] }[],
  tierFor: (code: string) => PersonTier,
): SharedMealVerdict {
  const perPerson: PersonVerdict[] = people.map((person) => {
    let worst: PersonTier = 'green';
    for (const code of person.codes) {
      const tier = tierFor(code);
      if (tier === 'red') { worst = 'red'; break; }
      if (tier === 'yellow') worst = 'yellow';
      else if (tier === 'unknown' && worst === 'green') worst = 'unknown';
    }
    return { who: person.name, tier: worst };
  });

  const excludedFor = perPerson.filter((entry) => entry.tier === 'red').map((entry) => entry.who);
  return { plannable: excludedFor.length === 0, perPerson, excludedFor };
}

export function describeSharedMealVerdict(verdict: SharedMealVerdict): string {
  if (!verdict.plannable) {
    return `Not planned for both: it is one to avoid for ${verdict.excludedFor.join(' and ')}.`;
  }
  const cautioned = verdict.perPerson.filter((entry) => entry.tier === 'yellow');
  if (cautioned.length === 0) return 'Fine for both of you.';
  if (cautioned.length === verdict.perPerson.length) {
    return 'Worth a closer look for both of you.';
  }
  return `Fine for ${verdict.perPerson
    .filter((entry) => entry.tier !== 'yellow')
    .map((entry) => entry.who)
    .join(' and ')}, worth a closer look for ${cautioned.map((entry) => entry.who).join(' and ')}.`;
}

/**
 * What to say when planning for two people leaves nothing to plan.
 *
 * Named rather than left as an empty screen, because an empty menu after pairing
 * reads as a broken feature when it is actually a gap in what has been written.
 * Same honesty the generator already holds when a diet and condition combination
 * has no recipes behind it.
 */
export function describeEmptyPool(people: { name: string; codes: string[] }[]): string {
  const everyone = people.map((person) => person.name).join(' and ');
  return `Nothing can be planned for ${everyone} together right now. That is a gap in the recipes written so far rather than a setting to change, and planning for one of you at a time still works.`;
}
