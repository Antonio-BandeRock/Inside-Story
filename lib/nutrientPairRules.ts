// The nutrient pair rules: two nutrients that meet in one meal, where one
// helps the other be absorbed (synergy) or competes with it (antagonism).
// Held apart from lib/dailyMealPlan.ts, which scores a meal against them,
// so Trends > Compare Two (lib/compareSeries.ts) reads the same facts
// without the meal generator coming with them. One fact, one place: a rule
// added here reaches the meal generator and Compare Two together.
//
// `compare` says how Compare Two reads a rule. The effect happens inside
// one meal, so two daily totals side by side cannot show it; `inAMeal`
// says so in words. Where the nutrient affected has a lab that shows its
// store over weeks, `labs` names it, and the intake of the first nutrient
// against that lab becomes a known pair. A rule whose nutrients are not
// recorded as daily series (dietary fat is not) or whose lab the app has
// no code for (copper) has nothing in `labs`.

export type PairRuleLab = {
  // The nutrient of nutrientB this lab measures the store of.
  nutrient: string;
  lab: string;
  why: string;
  tier: 'strong' | 'moderate' | 'weak';
  source: string;
};

export type NutrientPairRule = {
  id: string;
  label: string;
  kind: 'synergy' | 'antagonism';
  nutrientA: string;
  // An array, not a single code -- the fat/fat-soluble-vitamin rule needs
  // to check dietary fat against any of four real vitamins (A, D, E, K)
  // at once, not just one.
  nutrientB: string[];
  citation: string;
  mechanism: string;
  compare: {
    // One sentence for Compare Two, said when both nutrients are picked.
    inAMeal: string;
    // A short source for Compare Two to name beside the sentence.
    source: string;
    labs: PairRuleLab[];
  };
};

export const NUTRIENT_SYNERGY_RULES: NutrientPairRule[] = [
  {
    id: 'vitamin-c-iron',
    label: 'Vitamin C with iron',
    kind: 'synergy',
    nutrientA: 'vitamin_c',
    nutrientB: ['iron'],
    citation:
      'Effect of ascorbic acid intake on nonheme-iron absorption from a complete diet, Cook & Reddy, Am J Clin Nutr 2001, PMID 11124756 -- iron absorption from a mixed meal rose 1.65x to 9.57x depending on how much vitamin C was added.',
    mechanism:
      'Vitamin C reduces iron to the form the body absorbs more easily and keeps it soluble through the small intestine, directly countering the same plant compounds (phytates, polyphenols) that make iron from plant foods harder to absorb on its own. This matters most for whichever specific meal is actually carrying the iron, not just the day\'s total intake of either.',
    compare: {
      inAMeal: 'Vitamin C eaten in the same meal as iron from plant foods helps more of that iron be absorbed.',
      source: 'Cook JD, Reddy MB. Am J Clin Nutr 2001;73:93-98.',
      labs: [
        {
          nutrient: 'iron',
          lab: 'ferritin',
          why: 'Vitamin C eaten in the same meal raises how much iron from plant foods is absorbed. Over months the effect on ferritin has been small in most studies.',
          tier: 'moderate',
          source: 'Hallberg L et al. Am J Clin Nutr 1989;49:140-144. Cook JD, Reddy MB. Am J Clin Nutr 2001;73:93-98.',
        },
      ],
    },
  },
  {
    id: 'fat-fat-soluble-vitamins',
    label: 'Dietary fat with fat-soluble vitamins',
    kind: 'synergy',
    nutrientA: 'fat_total',
    nutrientB: ['vitamin_a', 'vitamin_d', 'vitamin_e', 'vitamin_k'],
    citation:
      'The same real fact already cited in this app\'s own interaction_rules table (vitamin_a_dietary_fat/vitamin_d_dietary_fat/vitamin_e_dietary_fat/vitamin_k_dietary_fat), reused here rather than cited a second time.',
    mechanism:
      'Vitamins A, D, E, and K are fat-soluble: the body needs some dietary fat present in the same meal to absorb them well, regardless of the dose.',
    compare: {
      inAMeal: 'Vitamins A, D, E and K need some fat in the same meal to be absorbed well.',
      source: 'NIH Office of Dietary Supplements, fact sheets for vitamins A, D, E and K.',
      labs: [],
    },
  },
];

export const NUTRIENT_ANTAGONISM_RULES: NutrientPairRule[] = [
  {
    id: 'calcium-iron',
    label: 'Calcium with iron',
    kind: 'antagonism',
    nutrientA: 'calcium',
    nutrientB: ['iron'],
    citation:
      'Inhibition of haem-iron absorption in man by calcium, Hallberg et al., Br J Nutr 1993, PMID 8490006 -- a real, replicated finding (the exact transport-level mechanism is still debated; current thinking points to competition at the DMT1 transporter). The same real competition is already cited in this app\'s own interaction_rules table (calcium_iron_timing) for supplement timing specifically.',
    mechanism:
      'Calcium measurably reduces how much iron the body absorbs when both are present in the same meal, whether from food or a supplement.',
    compare: {
      inAMeal: 'Calcium in the same meal lowers how much iron from that meal is absorbed, from food or a supplement.',
      source: 'Hallberg L et al. Br J Nutr 1993;69:533-540.',
      labs: [
        {
          nutrient: 'iron',
          lab: 'ferritin',
          why: 'Calcium in the same meal lowers iron absorption from that meal. Over months the effect on iron stores has been small in most studies.',
          tier: 'moderate',
          source: 'Lönnerdal B. Int J Vitam Nutr Res 2010;80:293-299.',
        },
      ],
    },
  },
  {
    id: 'zinc-copper',
    label: 'High zinc with copper',
    kind: 'antagonism',
    nutrientA: 'zinc',
    nutrientB: ['copper'],
    citation:
      'Copper and zinc absorption in the rat: mechanism of mutual antagonism, PMID 3968585; Linus Pauling Institute\'s own summary names this as clinically relevant mainly at supplement-level zinc intake (50mg/day or more) sustained over weeks, named honestly here rather than overstated for ordinary food-level amounts in one meal.',
    mechanism:
      'High zinc intake induces an intestinal protein (metallothionein) that binds copper in preference to zinc, trapping it in gut cells rather than letting it pass into circulation.',
    compare: {
      inAMeal: 'A lot of zinc, mostly from supplements of 50 mg a day or more taken for weeks, lowers how much copper is absorbed.',
      source: 'Linus Pauling Institute, Micronutrient Information Center, Zinc.',
      labs: [],
    },
  },
];
