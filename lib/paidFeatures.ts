// Which lenses sit behind payment, P27 (1.0.65.x, 2026-10-09). Direct
// request: "a free to paid switch in developer tools that puts the paid
// things behind a virtual wall so I am able to use the app in free mode to
// see what the user would see."
//
// The authority is the free/paid board
// (https://claude.ai/artifact/U9AUm2LG8f6dzrWmHPDJCt): every lens below is a
// function the board's tilted line, or a pin on it, puts on the paid side,
// read on 2026-10-09 with the split at left 3.6, right 2.05. When the board
// moves, this table moves with it; nothing else in the app decides.
//
// Three things never enter this table, checked by scripts/test_paid_features.js:
// safety (P28: the emergency card, My Meds and its interactions, the timing
// warnings, allergy cautions), what safety reads (the med list, dose
// reminders), and privacy (App Lock and the vault, by decision U4).
//
// Pure data and pure functions, no React and no Expo, so the test runs in
// plain Node. The setting itself lives in lib/entitlement.ts.

export type Tier = 'free' | 'paid';

/** The plan a paid lens comes with. Every one is in Individual today. */
export type PaidPlan = 'Individual';

export type PaidLens = {
  /** The function's id on the free/paid board. */
  board: string;
  /** What the lens does, finishing the sentence "With Individual you get ...". */
  gives: string;
  plan: PaidPlan;
};

// Keyed by the tab's title in TAB_ROUTES, then by the lens key that tab's
// LensHub uses.
export const PAID_LENSES: Record<string, Record<string, PaidLens>> = {
  Food: {
    systemRecipes: {
      board: 'food-recipes',
      gives: 'the ready-made recipes, each checked against your conditions and diet',
      plan: 'Individual',
    },
    fermentationBuilder: {
      board: 'food-ferment',
      gives: 'the Fermentation builder and its batch tracker',
      plan: 'Individual',
    },
  },
  Schedules: {
    todaysMeals: {
      board: 'sch-today',
      gives: 'meals and doses side by side, with each dose checked against the meals around it',
      plan: 'Individual',
    },
    dailyMealPlan: {
      board: 'sch-plan',
      gives: 'a meal plan made for you, up to six weeks ahead',
      plan: 'Individual',
    },
  },
  Signals: {
    foodReactions: {
      board: 'sig-reactions',
      gives: 'a record of how foods have affected you',
      plan: 'Individual',
    },
    newFoods: {
      board: 'sig-experiments',
      gives: 'leave-it-out experiments that compare before, without and back',
      plan: 'Individual',
    },
    microbiome: {
      board: 'sig-microbiome',
      gives: 'your microbiome test results kept side by side',
      plan: 'Individual',
    },
  },
  Insights: {
    nutrients: {
      board: 'ins-nutrients',
      gives: 'every nutrient today, from food and from supplements',
      plan: 'Individual',
    },
    sixDs: {
      board: 'ins-scores',
      gives: 'what each food means for each of your conditions',
      plan: 'Individual',
    },
    prep: {
      board: 'ins-prep',
      gives: 'how preparing a food changes what it carries',
      plan: 'Individual',
    },
    labelCheck: {
      board: 'ins-label',
      gives: 'a label read against your conditions',
      plan: 'Individual',
    },
    safeFoods: {
      board: 'ins-safe',
      gives: 'the foods that suit your conditions',
      plan: 'Individual',
    },
    healingStage: {
      board: 'ins-stage',
      gives: 'foods ordered for the stage of healing you are in',
      plan: 'Individual',
    },
    labs: {
      board: 'ins-labs',
      gives: 'your lab results read with what they mean',
      plan: 'Individual',
    },
    'i-appointment': {
      board: 'ins-appt',
      gives: 'what to bring to your next appointment, gathered from your records',
      plan: 'Individual',
    },
    'i-garden': {
      board: 'ins-garden',
      gives: 'what your garden adds to what you eat',
      plan: 'Individual',
    },
  },
  Trends: {
    nutrients: { board: 'tr-nutrients', gives: 'nutrients over time', plan: 'Individual' },
    sixDs: { board: 'tr-scores', gives: 'condition scores over time', plan: 'Individual' },
    variety: {
      board: 'tr-eat',
      gives: 'variety, gut-supporting foods and how much is packaged, over time',
      plan: 'Individual',
    },
    pacing: { board: 'tr-pacing', gives: 'your energy envelope over time', plan: 'Individual' },
    labs: { board: 'tr-labs', gives: 'labs over time beside your usual range', plan: 'Individual' },
    cost: { board: 'tr-cost', gives: 'what food, meds and the garden cost together', plan: 'Individual' },
    therapyResponse: {
      board: 'tr-therapy',
      gives: 'how a treatment has gone since it started',
      plan: 'Individual',
    },
    doses: { board: 'tr-doses', gives: 'doses over time', plan: 'Individual' },
    reactions: { board: 'tr-reactions', gives: 'reactions and new foods over time', plan: 'Individual' },
    compare: { board: 'tr-compare', gives: 'any two of your records read against each other', plan: 'Individual' },
    ferments: { board: 'tr-ferments', gives: 'your ferments over time', plan: 'Individual' },
    planned: { board: 'tr-planned', gives: 'what was planned beside what was eaten', plan: 'Individual' },
    patterns: {
      board: 'tr-pattern',
      gives: 'Pattern Finder, which looks for what tends to come before a flare',
      plan: 'Individual',
    },
    squares: { board: 'home-squares', gives: 'your life drawn as squares, one per day', plan: 'Individual' },
  },
  Reports: {
    overview: { board: 'rep-overview', gives: 'the Overview report', plan: 'Individual' },
    'r-doctor': { board: 'rep-doctor', gives: 'a report made for your doctor', plan: 'Individual' },
    'r-nutrition': { board: 'rep-nutritionist', gives: 'a report made for a nutritionist', plan: 'Individual' },
    'r-trainer': { board: 'rep-trainer', gives: 'a report made for a trainer', plan: 'Individual' },
    'r-month': { board: 'rep-looking', gives: 'a look back over a stretch of time', plan: 'Individual' },
    'r-care': { board: 'rep-caregiver', gives: 'a report made for a caregiver', plan: 'Individual' },
    'r-medical-costs': { board: 'rep-costs', gives: 'your medical costs in one report', plan: 'Individual' },
    'r-garden': { board: 'rep-garden', gives: 'your garden record as a report', plan: 'Individual' },
  },
  Garden: {
    sowingCalendar: { board: 'g-sowing', gives: 'a sowing calendar for where you grow', plan: 'Individual' },
    growingConditions: {
      board: 'g-conditions',
      gives: 'growing conditions from your readings and sensors',
      plan: 'Individual',
    },
    growingCosts: { board: 'g-costs', gives: 'growing costs, electricity included', plan: 'Individual' },
    horticulture: {
      board: 'g-hort',
      gives: 'the crop guides, each put right from the soil',
      plan: 'Individual',
    },
  },
  Life: {
    conditions: {
      board: 'l-conditions',
      gives: 'the reading on all nineteen conditions',
      plan: 'Individual',
    },
    finances: { board: 'l-finances', gives: 'Finances', plan: 'Individual' },
  },
};

/** The paid lens a tab's lens is, or null when it is Free. */
export function paidLens(tabTitle: string, lens: string | undefined): PaidLens | null {
  if (!lens) return null;
  return PAID_LENSES[tabTitle]?.[lens] ?? null;
}

/** True when this lens is behind the wall for the tier given. */
export function isLensWalled(tier: Tier, tabTitle: string, lens: string | undefined): boolean {
  return tier === 'free' && paidLens(tabTitle, lens) !== null;
}

/** The words the wall shows. Never says the person did anything wrong, and
 *  says plainly that what they recorded is kept. */
export function paidWallWords(paid: PaidLens): { title: string; message: string; kept: string } {
  return {
    title: `Part of ${paid.plan}`,
    message: `With ${paid.plan} you get ${paid.gives}.`,
    kept: 'Nothing you have recorded is lost. Everything you have entered stays on this device, and shows here again as soon as the plan is on.',
  };
}
