import type { DigestEntry } from './types';

// Healing Stages -- added 2026-08-07, directly porting this app's own
// already-published research ("The Healing Stages: A Grounded, Staged Food
// Guide," an Artifact from 2026-08-05/06) into real in-app digest content,
// rather than leaving it as a standalone document nobody browsing this tab
// would ever find. CLAUDE.md's own healing-journey-stages section has
// named a real, decided 5-stage clinical framework (Triage -> Digging ->
// Gut Repair -> Rebalancing -> Maintenance, attributed to Dr. Izabella
// Wentz) since 2026-07-31 -- but until this pass, nothing in the app
// actually explained what to DO at each stage. That source document cross-
// mapped the 5 clinical stages onto a simpler, practically useful 3-tier
// structure (matching CLAUDE.md's own "only stages 2 and 3 meaningfully
// drive food decisions" scoping note): Stage 1 Getting Started (~clinical
// Triage+Digging), Stage 2 Rebuilding (~Gut Repair), Stage 3 Well-Healed
// (~Rebalancing+Maintenance). Every entry below keeps that source
// document's own real, upfront honesty check: the 5-stage clinical
// SCAFFOLD is a practitioner framework, not peer-reviewed consensus (already
// disclosed as such in CLAUDE.md) -- but the specific food lists,
// timelines, and reintroduction methodology inside each stage are drawn
// from real elimination-diet, SIBO, gut-barrier, and Hashimoto's-specific
// trials, held to the identical evidence-tier discipline as every other
// category here.
export const HEALING_STAGES_ENTRIES: DigestEntry[] = [
  {
    id: 'healing-stage-map',
    category: 'healingStages',
    title: 'Three Practical Stages, Mapped Onto the Five Already Named',
    teaser: 'The organizing idea behind everything else in this category.',
    summary:
      'This app\'s own already-decided 5-stage clinical framework (Triage, Digging, Gut Repair, Rebalancing, Maintenance) only really drives food decisions in two of those five stages -- the rest are mostly about hormone dosing, nutrient correction, and lab monitoring. A simpler, more practically useful 3-tier structure covers the same ground for food purposes: Stage 1 "Getting Started" (elimination first, a short, well-reasoned list of genuinely safe foods), Stage 2 "Rebuilding" (systematic, one-food-at-a-time reintroduction, fermented foods enter here deliberately), and Stage 3 "Well-Healed" (broad, diverse eating; tracking becomes a spot-check tool rather than a daily requirement).',
    citations: [
      {
        source: 'The Autoimmune Protocol diet: a systematic review of the literature -- the real 6-week elimination + 5-week reintroduction clinical protocol structure',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31832627/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'healing-stage1-eat',
    category: 'healingStages',
    title: 'Stage 1: What to Eat, and Why Each Food Earns Its Place',
    teaser: 'A short, deliberately narrow list -- the goal is a stable, low-noise baseline, not variety yet.',
    summary:
      'Every Stage 1 food is included for a specific, stated reason: low FODMAP (won\'t feed an already-overgrown small intestine), low goitrogenic load, low histamine, low antigenic/allergenic potential, nutrient-dense, and easy to digest for a currently-inflamed gut. Fresh (not aged/cured/canned) poultry and white fish, eggs if tolerated, cooked low-FODMAP vegetables (carrots, cucumber, zucchini, green beans, bok choy, cooked spinach), white rice and sweet potato, low-FODMAP fruits in moderation (blueberries, cantaloupe, kiwi, strawberries), and olive/coconut oil as base fats. Cooking vegetables rather than eating them raw specifically helps fiber tolerance in an inflamed gut without giving up fiber\'s own real benefit.',
    citations: [
      {
        source: 'Texture-modified (cooked/pureed) fiber sources improve tolerability in an inflamed gut without withholding fiber\'s benefit (IBD population evidence)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/40131665/',
      },
      {
        source: 'Citrus and banana contain putrescine, which can interfere with the same DAO enzyme that clears histamine -- a real, if secondary, reason to track these individually',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6306728/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'Weeks 1-6 of the healing journey.',
  },
  {
    id: 'healing-stage1-bone-broth',
    category: 'healingStages',
    title: 'Bone Broth: A Real, Honest Inclusion With a Caveat',
    teaser: 'A real mechanism exists -- but it\'s one reasonable food among several, not a singular "magic" gut-healer.',
    summary:
      'Bone broth\'s real, cited mechanism is its glutamine, glycine, and proline content, all supporting gut-barrier function. The honest caveat: measured amino-acid content varies enormously by recipe, and commercial versions run measurably lower than a real homemade batch -- worth including as one reasonable Stage 1 food, not treating as a singular fix.',
    citations: [
      { source: 'Amino acid composition of bone broth varies substantially by preparation method', url: 'https://pubmed.ncbi.nlm.nih.gov/40180691/' },
      { source: 'Glutamine, glycine, and proline support enterocyte and gut-barrier function', url: 'https://pubmed.ncbi.nlm.nih.gov/29893587/' },
    ],
    overallTier: 'weak',
    stageNote: 'A Stage 1 food, included with a real, stated caveat rather than oversold.',
  },
  {
    id: 'healing-stage1-avoid',
    category: 'healingStages',
    title: 'Stage 1: What\'s Eliminated, and the Specific Reason for Each',
    teaser: 'Every exclusion has its own stated reason -- nothing here is a generic "eat clean" gesture.',
    summary:
      'Gluten and conventional dairy (screening for the real celiac-Hashimoto\'s link and keeping the elimination phase interpretable). High-FODMAP foods -- garlic, onion, most mushrooms, cauliflower, legumes -- the single highest-confidence exclusion in this whole list, given how fast and well-replicated the real symptom-response data is. Raw cruciferous/goitrogenic vegetables (cook first, rather than a hard exclusion). Nightshades, included as a tentative rather than confident exclusion -- genuinely contested, worth isolating specifically because it\'s untested and easy to separate out for a later reintroduction. The 15 additives, alcohol, and added sugar/HFCS already covered elsewhere in this Digest, since every real concern documented for those applies with full force during exactly the window Stage 1 is trying to establish a clean baseline in.',
    citations: [
      {
        source: 'Nightshade solanine/glycoalkaloid compounds and gut permeability: mechanistically plausible, genuinely contested, no RCT in any autoimmune population',
        url: 'https://pubmed.ncbi.nlm.nih.gov/39127701/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['problem-nightshades', 'problem-gluten-grains'],
  },
  {
    id: 'healing-stage1-fermented-exclusion',
    category: 'healingStages',
    title: 'Stage 1: Why Most Fermented Foods Wait, Even Though This App\'s Own Research Backs Them',
    teaser: 'A real, genuinely counterintuitive exclusion -- named directly rather than smoothed over.',
    summary:
      'Fermented foods are the single most consistently flagged high-histamine food category across real low-histamine-diet literature. Since Stage 1 deliberately keeps histamine load low while a possibly-inflamed gut\'s own DAO clearance capacity is still unknown, most ferments wait for Stage 2 -- a real, direct tension with this app\'s own Fermented Foods research (which is built on real, strong evidence that fermented foods support gut-barrier repair). Neither claim is wrong; they\'re optimizing for different things at different points in the timeline.',
    citations: [
      { source: 'Fermented foods are consistently identified as a high-histamine food category', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8143338/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermented-lactobacillus-acidophilus', 'problem-high-histamine'],
  },
  {
    id: 'healing-stage1-milestones',
    category: 'healingStages',
    title: 'Stage 1: Real Milestones to Graduate, Not Guesswork',
    teaser: 'Concrete, checkable markers -- not "when it feels right."',
    summary:
      'Symptom stability across at least 2-4 consecutive weeks on the eliminated baseline (matching the real 2-week-minimum response window low-FODMAP trials use before judging effect). A real, logged food-symptom baseline -- not perfection, just consistent tracking. And reaching the real 6-week mark, the actual clinical AIP elimination-phase length, not an arbitrary cutoff. Worth pairing with an honest caveat about food diaries themselves: they helped 75% of patients identify real trigger candidates when used to guide an elimination diet, but only 47% of those held up under a real, controlled challenge -- a real reason to build confidence gradually from logged data rather than over-claim certainty early.',
    citations: [
      {
        source: 'Food and symptom diaries as a tool for identifying dietary triggers: real candidate-identification rate vs. real confirmed-trigger rate on controlled challenge',
        url: 'https://pubmed.ncbi.nlm.nih.gov/7870442/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'healing-stage2-reintroduction',
    category: 'healingStages',
    title: 'Stage 2: The Real Reintroduction Order, and Why',
    teaser: 'Not "just start eating everything again" -- a deliberate, one-variable-at-a-time method.',
    summary:
      'The real methodology: one food, in its purest additive-free form, a small amount on an empty stomach, a 24-hour wait, then a full portion, then 2 more days of monitoring before the next food -- roughly every 3-5 days per food. The real, reasoned order, lowest-risk first: cooked goitrogenic vegetables and legumes first (mechanism already well-characterized, risk concentrated specifically in raw form and low-iodine status); nightshades next, since Stage 1 isolated them cleanly and a genuinely contested food deserves individual data rather than a blanket guess; dairy next, watching specifically for the lactose-intolerance-linked TSH pattern; gluten last and most cautiously, given the real celiac-screening stakes.',
    citations: [
      {
        source: 'Long-term restriction (staying low-fiber/low-variety past the diagnostic window) causes MORE dysbiosis and permeability, not less -- real IBD-population evidence that Stage 1\'s restriction is a temporary diagnostic tool, not a destination',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38674799/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'Roughly months 2-6 of the healing journey.',
  },
  {
    id: 'healing-stage2-fermented-entry',
    category: 'healingStages',
    title: 'Stage 2: Where Fermented Foods Actually Enter -- Deliberately, Not By Default',
    teaser: 'The direct resolution to Stage 1\'s own histamine tension.',
    summary:
      'This is where this app\'s own two-yogurt system and Fermented Foods bacterial-strain research become directly actionable: Stage 2 is specifically the point where a controlled, single-strain DIY ferment (known ingredients, known strain, a known histamine profile from that strain\'s own fermentation behavior) is a real, deliberate reintroduction target -- not a blind "just eat probiotic foods" gesture. The real gut-barrier evidence for probiotic strains genuinely applies once histamine tolerance itself is no longer an unknown variable.',
    citations: [
      { source: 'Fermented foods are consistently identified as a high-histamine food category (same underlying evidence Stage 1\'s exclusion is built on)', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8143338/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermented-lactobacillus-acidophilus', 'fermented-cfu-dosing'],
  },
  {
    id: 'healing-stage2-fiber-expansion',
    category: 'healingStages',
    title: 'Stage 2: Real Fiber Expansion, Texture First',
    teaser: 'A specific, evidence-backed progression -- not "just eat more fiber."',
    summary:
      'Real IBD evidence supports a specific progression: fiber introduced during a genuinely stable period (not an active flare), with texture-modified sources (cooked, pureed) coming first and raw/varied sources following only as tolerance is directly confirmed through tracking rather than assumed. This is disease-adjacent evidence (IBD, not Hashimoto\'s directly), included as real corroborating support for a reasonable progression rather than a Hashimoto\'s-specific finding.',
    citations: [
      { source: 'Texture-modified fiber introduction during a stable period, with real measurable benefit and tolerability', url: 'https://pubmed.ncbi.nlm.nih.gov/40131665/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'healing-stage2-milestones',
    category: 'healingStages',
    title: 'Stage 2: Real Milestones to Graduate',
    teaser: 'A real, physiological time window -- not just "feeling better generally."',
    summary:
      'A real, documented tolerance map -- a growing, individually-confirmed list of successfully reintroduced foods. The real 12-24 week gut-barrier repair window (already established elsewhere in this Digest\'s own Gut & Microbiome research) having passed, giving the mechanisms this stage relies on real physiological time to actually take effect rather than just masking symptoms. And a real 3-month and/or 6-month checkpoint, matching the actual interval real Hashimoto\'s dietary-intervention trials use as their own standard measurement points.',
    citations: [
      {
        source: 'Real Hashimoto\'s-specific dietary-intervention trials use 3-month and 6-month checkpoints as standard measurement intervals',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38965727/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-zonulin-timeline'],
  },
  {
    id: 'healing-stage3-what-it-looks-like',
    category: 'healingStages',
    title: 'Stage 3: What "Well-Healed" Actually Means, in Checkable Terms',
    teaser: 'Not "cured" -- Hashimoto\'s has no cure, and this framework doesn\'t imply one.',
    summary:
      'A real, declining TPO-antibody trend across multiple checks spanning 12+ months -- direction of change, not a single value, is the real signal. Real 6-month Hashimoto\'s dietary-intervention trials have shown measurable fT3/fT4 increases alongside anti-TPO/anti-Tg decreases from sustained elimination-diet-style intervention. Broad, confirmed tolerance across most real food categories, with the diagnostic, one-food-at-a-time discipline of Stage 2 having done its job -- real, occasional trigger foods (if any remain) are known specifically, not guessed at generally.',
    citations: [
      {
        source: 'Real 6-month Hashimoto\'s dietary-intervention trials showing measurable thyroid-function and antibody changes from sustained intervention',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38965727/',
      },
    ],
    overallTier: 'moderate',
    stageNote: '6+ months, ongoing -- the maintenance phase.',
  },
  {
    id: 'healing-stage3-practical-shifts',
    category: 'healingStages',
    title: 'Stage 3: What Actually Changes Day-to-Day',
    teaser: 'Tracking shifts from a daily necessity to a spot-check tool -- a deliberate change, not neglect.',
    summary:
      'Tracking becomes optional/periodic rather than constant -- matching this app\'s own core purpose directly: the goal was always personal pattern-discovery, not permanent daily logging as an end in itself. Real, occasional flexibility with lower-tier concerns (a "chronic, cumulative" category additive, in genuine moderation) becomes reasonable once a real, stable baseline exists to notice a real deviation against. And periodic re-baseline checks: a real flare, a new symptom, or a genuine life disruption (illness, high stress, an antibiotic course) is a real, legitimate reason to step back toward Stage 1 or 2 temporarily -- not a failure of this stage.',
    citations: [
      {
        source: 'A single course of antibiotics reliably reduces gut microbial diversity, a real, legitimate reason to temporarily revisit an earlier stage',
        url: 'https://pubmed.ncbi.nlm.nih.gov/20847294/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-antibiotic-overuse'],
  },
  {
    id: 'healing-tension-detox-myth',
    category: 'healingStages',
    title: '"Detox" Is Not a Real, Separate Physiological Phase',
    teaser: 'Worth stating directly, since it\'s a common claim in this exact space.',
    summary:
      'No real evidence anywhere in this app\'s own research supports a literal "detox" period distinct from ordinary elimination-diet adaptation. Early symptom changes during Stage 1 are more plausibly explained by real, already-documented mechanisms elsewhere in this Digest: gut-microbiome composition shifts measurable within days to two weeks of a real dietary change, real withdrawal-type effects from reducing caffeine or sugar, or simply the genuine adjustment period of eating a meaningfully different way. This framework deliberately avoids "detox" language anywhere in its own reasoning.',
    citations: [
      {
        source: 'Gut microbiome composition shifts are measurable within days to 2 weeks of a real dietary change, with downstream host effects running on a slower weeks-to-months timescale',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31766592/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'healing-tying-together',
    category: 'healingStages',
    title: 'Tying It All Together: A Journey With Real Checkpoints, Not a Fixed Timeline',
    teaser: 'Three stages, real milestones at each -- and the honest point is that this moves at the pace your own data shows, not a calendar.',
    summary:
      "Read end to end, these entries describe a real, sequenced journey -- narrow and restrictive in Stage 1, systematically widening in Stage 2, broad and mostly self-monitoring by Stage 3 -- built on real elimination-diet, gut-barrier-repair, and Hashimoto's-specific trial timelines, not guesswork. The honest throughline across all three stages: this app's own tracking is what actually shows which stage someone is really in, not a fixed number of weeks on a calendar -- the milestones in each stage (symptom stability, a real tolerance map, a declining antibody trend) are checkable signals to look for in real logged data, and a real flare or disruption is a legitimate reason to step back a stage temporarily, not a failure of the process.",
    citations: [
      {
        source: 'The Autoimmune Protocol diet: a systematic review of the literature -- the real 6-week elimination + 5-week reintroduction clinical protocol structure',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31832627/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['healing-stage-map', 'healing-stage3-what-it-looks-like'],
  },
];
