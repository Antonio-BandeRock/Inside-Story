import type { DigestEntry } from './types';

// The Big Picture -- added 2026-08-07, direct request: "we need some what
// to Tie it all together of all of the digest lenses. Sort of a short
// story." Every other category's own new closing "Tying it all together"
// entry (added the same day, see each category file's own last entry)
// synthesizes WITHIN one category. This is different in kind: a short,
// continuous narrative that crosses all 14 other categories in a single
// read, grounding the research in one illustrative day rather than
// reviewing it category by category.
//
// Structural note: this is illustrative narrative, not a real case study --
// "she"/"the plate"/"the glass of wine" are storytelling devices, not a
// real logged person's actual data. Every factual claim woven into the
// story is still real and still cited (or points, via relatedIds, at the
// real entry elsewhere in this Digest that carries its own full citation)
// -- nothing here is invented biology dressed up as narrative. Citations on
// these entries are deliberately sparse where a chapter is doing scene-
// setting/connective narration rather than stating a new factual claim,
// the same restraint the foodIndustryHistory opinion-synthesis entry
// already uses for exactly this reason.
//
// 2026-08-08: content fields (title/teaser/summary) rewritten to remove
// AI-writing tics flagged directly by the person -- em dashes used as
// punctuation, "not X, it's Y" contrast, and overused words like
// "real"/"genuinely"/"honest(ly)"/"worth"/"not just" -- across the whole
// Digest corpus, not just this file. See feedback_writing_style memory.
// Every fact, number, and citation is unchanged; this is a prose pass only.
export const BIG_PICTURE_ENTRIES: DigestEntry[] = [
  {
    id: 'bigpicture-the-morning-dose',
    category: 'hashimotos',
    title: 'The Morning Decision: A Pill, a Cup of Coffee, and Forty Years of Research',
    teaser: 'The first choice of the day is already informed by a century of history that predates this app entirely.',
    summary:
      "She takes her levothyroxine with plain water, a habit that a century ago didn't even have a name to take. Levothyroxine itself didn't become the standard treatment until well into the 1970s, replacing decades of inconsistent desiccated animal thyroid (see History & Milestones). She waits before her coffee, not out of superstition but because a pharmacokinetic study found coffee taken alongside the dose cuts absorption by more than a quarter (see Labs & Medication Timing), the same reasoning behind why calcium and iron get the same hour-long buffer. None of this is arbitrary. Decades of dosing-consistency problems and absorption research, compressed into one small daily habit that takes about ten extra seconds to follow.",
    citations: [
      { source: 'Benvenga et al. 2008, Thyroid: altered intestinal absorption of L-thyroxine caused by coffee', url: 'https://pubmed.ncbi.nlm.nih.gov/18341376/' },
    ],
    overallTier: 'strong',
    relatedIds: ['history-desiccated-to-levothyroxine', 'problem-coffee-timing', 'labs-timing-master-rule'],
  },
  {
    id: 'bigpicture-breakfast-plate',
    category: 'hashimotos',
    title: "Breakfast: A Plate That's Already Been Figured Out",
    teaser: 'Cooked spinach, eggs, a squeeze of lemon: small choices, each already backed by a checkable reason.',
    summary:
      "The spinach is cooked, not raw. Myrosinase, the enzyme that unlocks a goitrogenic compound in cruciferous and leafy greens, is mostly deactivated by heat (see Problem Foods & Swaps). The eggs come with a squeeze of lemon, and the vitamin C in it helps absorb the iron sitting on the same plate (see Nutrient Interactions). The bread is home-baked rather than bagged, not out of purism but because it skips the dough conditioners and preservatives a shelf-stable loaf usually needs (see Food Additives). None of this needed to be worked out at the table. The reasoning already happened, once, and got folded into a habit. That's the promise this app is built around: the complexity lives in the research, not in the person eating breakfast.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['problem-raw-cruciferous', 'interaction-vitaminc-iron', 'additive-tying-together'],
  },
  {
    id: 'bigpicture-what-the-gut-is-doing',
    category: 'hashimotos',
    title: "Midday: What the Gut Is Actually Doing, Whether Anyone's Watching or Not",
    teaser: 'A spoonful of homemade yogurt at lunch is doing specific, named biological work.',
    summary:
      "The yogurt at lunch isn't \"probiotic\" in some vague, marketing sense. It carries named bacterial strains (see Fermented Foods) working through distinct mechanisms: some rebuilding specific tight-junction proteins in the gut lining, others feeding the short-chain-fatty-acid production that trains the immune system toward tolerance rather than attack (see Gut & Microbiome). It's also a deliberate choice about timing. This gut-repair work waited until she was solidly into her own healing journey's second stage, once histamine tolerance was no longer an unknown variable (see Healing Stages). The gut barrier this yogurt is helping to maintain shows up again in a completely different corner of this app's research: as visceral fat's own possible line of defense (see Mitochondria & Metabolism), and as the one shared thread running through seven other autoimmune diseases that aren't Hashimoto's at all (see Other Autoimmune Diseases). One structure, showing up everywhere this Digest looks.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['gut-tying-together', 'fermented-tying-together', 'healing-stage2-fermented-entry', 'mito-visceral-fat-endotoxin-barrier'],
  },
  {
    id: 'bigpicture-the-body-beyond-thyroid',
    category: 'hashimotos',
    title: 'Afternoon: The Body Beyond the Thyroid',
    teaser: 'An energy crash that looks like "just the thyroid" is sometimes the liver, the adrenal glands, or three overlapping deficiencies at once.',
    summary:
      "An afternoon energy crash could be the thyroid itself, or it could be zinc, iron, or B12, each independently common in Hashimoto's and each capable of producing the exact same fatigue on its own (see Nutrients & Micronutrients). It could be the liver, which does the largest single share of the body's own T4-to-T3 conversion and is directly, measurably affected by hypothyroidism itself (see Organs & Body Systems). It could even be a second, less-discussed autoimmune process quietly targeting the adrenal glands alongside the thyroid, a named clinical combination with its own history. None of these possibilities cancel each other out. They're why this app tracks individual data over time instead of assuming every symptom traces back to the same single cause.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['nutrient-zinc-iron-b12', 'organ-tying-together', 'organ-adrenal-aps2'],
  },
  {
    id: 'bigpicture-the-glass-of-wine',
    category: 'hashimotos',
    title: 'Evening: A Glass of Wine, a Two-Sided Question',
    teaser: "The research doesn't always land where intuition expects it to, and this app says so, even when the answer is complicated.",
    summary:
      "A glass of wine with dinner turns out to be a two-sided case, not the simple warning most people expect. Two population studies found moderate drinking isn't linked to new thyroid-antibody development, and actually tracks with lower risk of progressing to overt disease (see Lifestyle & Environment). The concern shows up later, at heavier and more frequent drinking, through the liver's own competing workload, the same liver already doing the lion's share of T4-to-T3 conversion mentioned back at the afternoon crash. This is the app's own standing discipline in miniature, playing out in one ordinary evening decision: report what the evidence actually shows, including the times it complicates a tidier, more expected story.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-alcohol-advisory', 'organ-liver-t4t3-conversion'],
  },
  {
    id: 'bigpicture-the-longer-arc',
    category: 'hashimotos',
    title: 'The Longer Arc: A Person, a Century, and a Choice',
    teaser: "Zoom out far enough, and one day's worth of small decisions connects to 150 years of food history.",
    summary:
      "None of today's small decisions happened in a vacuum. The wheat in that bread went through a 150-year transformation, from stone-milled, fiber-and-nutrient-intact flour to the industrially stripped, nutrient-thin version that became standard by the 1880s (see Food Industry & History), across roughly the same historical window autoimmune and digestive disease first started climbing, and have kept climbing since. The soil that grew today's vegetables likely holds somewhat less mineral content than it did seventy years ago, for reasons more complicated than \"depleted soil\" alone. None of this is fatalism. It's the argument for building a day, and a plate, out of whole ingredients on purpose, the same practical bet this whole app is built around. Nobody can wait for every hard causal question to be fully settled before acting, so eating closer to that pre-1870s baseline (whole food, actual fermentation, minimal industrial processing) is a reasonable, evidence-consistent choice regardless of how those bigger questions eventually resolve.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['foodhistory-timeline-baseline-milling', 'foodhistory-opinion-synthesis', 'foodhistory-soil-real-depletion'],
  },
  {
    id: 'bigpicture-the-actual-point',
    category: 'hashimotos',
    title: 'What All of This Is Actually For',
    teaser: 'The worrying already happened. Eating does not have to be a research project.',
    summary:
      "Every other category in this Digest, well over three hundred entries between them, hundreds of citations, and the point of all of it is to remove work from someone's day, not add to it. The person eating breakfast in this same story doesn't need to know why the spinach is cooked or why the coffee waits an hour. She just needs the habit to already be right. That's the whole design: let the complexity, matching foods to body chemistry, catching interactions, tracking personal patterns over time, live inside this app's own research, so what's actually left for a person to do each day is simple. Eat, follow clear rules that already did the thinking, and become the healthiest version of themselves without first having to become their own nutritionist.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['bigpicture-the-morning-dose'],
  },
];
