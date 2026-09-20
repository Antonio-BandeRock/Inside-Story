// The condition-grouping half of what used to sit inside
// app/(tabs)/purple-digest.tsx, moved here 2026-09-19 when Conditions moved
// out of the Digest tab and into Life (components/ConditionsSection.tsx).
// Both screens group a condition's entries the same way, so the grouping
// lives in one place and neither screen carries a copy. Nothing here was
// rewritten in the move; each comment below is the original, dated as it
// was written.
import { CONDITION_STAGING_MODELS } from '../conditionStages';
import {
  getEntriesForCategory,
  isProblemFoodEntry,
  recipeMatchesAllDietPreferences,
  RECIPE_DIET_TAGS,
  type AnyDigestEntry,
  type DigestCategoryKey,
  type RecipeDietTag,
} from './index';


// A real, deterministic sort applied to every rendered group of entries
// (a Basic Health topic/subtopic leaf list, a condition's own topic
// shelf) -- 2026-08-08, direct request: "there seems to be a randomness
// to how the data within each Digest area are being listed from start to
// finish or which other information is next to them. There needs to be an
// order to sorting applied to the group of each area so even if the user
// just decides to scroll around and look at random things it should all
// track in a logical order in each section." Before this, a group's own
// entries rendered in whatever order they happen to sit in the source
// array -- which reflects the literal order they were WRITTEN across many
// separate build passes over many days (an entry added in an early batch
// sits before one covering a closely related topic added weeks later),
// not any real reading order, so scrolling through felt arbitrary.
//
// The fix: within any one group, an "-overview" entry (at most one per
// condition/topic) always leads, a "tying-together" synthesis entry (if
// present in this same group -- a condition's own is already pulled out
// into its own standalone card by groupConditionEntries below, but a
// Basic Health topic can genuinely have one sitting right in its own leaf
// list) always trails, and everything in between sorts alphabetically by
// its own real title (or food name, for a ProblemFoodEntry). Alphabetical
// is the one ordering scheme that's fully deterministic, needs zero
// per-topic editorial judgment call, and lets someone scanning a list
// predict roughly where a given entry should sit -- the same "logical,
// not random" standard this request asks for, applied identically
// everywhere rather than hand-curating a bespoke narrative order for the
// 60+ separate groups (18 conditions x up to 4 pillars, plus every Basic
// Health topic/subtopic) this would otherwise mean reviewing one at a
// time.
// 2026-09-19: alphabetical order is wrong for the few shelves that tell a
// story in sequence. Earth Matters' history shelf was showing the 2017
// certification era before the 1972 origins before the Green Revolution
// that both respond to; "Do boycotts work?" came after the entry that
// answers "buycotts are too"; the Horticulture zone entries ran tropical,
// cold, moderate, warm. Each list below is one shelf's reading order. An
// id in a list sorts by its position, ahead of anything unlisted on the
// same shelf; everything unlisted keeps the alphabetical fallback, so a
// condition page (none of whose ids appear here) is unchanged.
const DIGEST_READING_ORDER: string[][] = [
  // Earth Matters, Soil Science: the two studies, the critique, the answer.
  ['foodhistory-soil-landmark-studies', 'foodhistory-soil-dilution-vs-depletion', 'foodhistory-soil-real-depletion'],
  // Earth Matters, The Gut Connection: mechanism, why it matters, the population evidence, the synthesis.
  [
    'foodhistory-regen-soil-gut-microbiome-axis',
    'foodhistory-regen-old-friends-hypothesis',
    'foodhistory-regen-karelia-biodiversity-study',
    'foodhistory-regen-microbiome-symbiosis-mission',
  ],
  // Earth Matters, History & Origins: chronological.
  ['foodhistory-regen-green-revolution-consequences', 'foodhistory-regen-timeline-origins', 'foodhistory-regen-timeline-certification-era'],
  // Earth Matters, How You Can Take Action: the question before the follow-up.
  ['foodhistory-regen-boycott-effectiveness-evidence', 'foodhistory-regen-buycott-versus-boycott'],
  // Horticulture, Getting Started: find the zone, then cold to hot, then no yard, then the caution.
  [
    'garden-understanding-your-zone',
    'garden-cold-short-season-crops',
    'garden-moderate-climate-crops',
    'garden-warm-climate-crops',
    'garden-tropical-subtropical-crops',
    'garden-container-small-space',
    'garden-soil-safety-lead',
  ],
  // Horticulture, Your Garden & Your Microbiome: the trial, the mechanism, the synthesis.
  ['garden-hands-in-soil-immune-training', 'garden-mycobacterium-vaccae-soil-microbes-mood', 'garden-symbiosis-mission'],
  // Health Literacy, B1, B2 & B3: one vitamin at a time, in order.
  [
    'thiamine-overview',
    'thiamine-deficiency-beriberi-wernicke',
    'thiamine-tying-together',
    'riboflavin-overview',
    'riboflavin-migraine-prevention',
    'riboflavin-tying-together',
    'niacin-overview',
    'niacin-deficiency-pellagra',
    'niacin-toxicity-flushing-liver',
    'niacin-tying-together',
  ],
  // Health Literacy, B5, B6 & B7: the same.
  ['pantothenate-overview-and-rarity', 'b6-overview', 'b6-toxicity-neuropathy', 'b6-tying-together', 'biotin-overview', 'biotin-deficiency-avidin-mechanism', 'biotin-tying-together'],
  // Health Literacy, Chromium, Manganese & Copper: the same.
  [
    'chromium-overview-essentiality-debate',
    'chromium-insulin-sensitivity-honest',
    'chromium-tying-together',
    'manganese-overview',
    'manganese-toxicity-manganism',
    'manganese-tying-together',
    'copper-overview',
    'copper-deficiency-anemia-neutropenia',
    'copper-tying-together',
  ],
  // Health Literacy, Insulin, Cortisol & Thyroid: what a hormone is, then one hormone at a time, then the closing entry.
  [
    'hormone-what-is-a-hormone',
    'insulin-overview-mechanism',
    'insulin-resistance-real-cluster',
    'cortisol-overview-hpa-axis',
    'cortisol-chronic-dysregulation-autoimmunity',
    'thyroid-hormones-overview',
    'hormones-tying-together',
  ],
  // Health Literacy, Appetite & Body Fat Hormones: the discovery, what leptin does, what goes wrong, then the rest.
  [
    'leptin-discovery-ob-mice',
    'leptin-ghrelin-overview',
    'leptin-resistance-obesity-paradox',
    'leptin-reproductive-axis',
    'leptin-autoimmune-inflammation',
    'adiponectin-overview',
    'lipodystrophy-fat-necessity',
  ],
  // Health Literacy, Sex Hormones: the cycle before its ending; testosterone's job before its decline.
  ['estrogen-progesterone-cycle', 'estrogen-progesterone-perimenopause', 'testosterone-overview-function', 'testosterone-age-decline-real-data'],
  // Health Literacy, How Your Body Works: within each shelf, the system before the finding about it.
  ['body-brain-nervous-system', 'body-brain-processed-meat-dementia-uk-biobank', 'body-eyes-vision'],
  ['body-bones-teeth-skeleton', 'body-muscular-system', 'body-skin-integumentary', 'body-hair-growth-cycle'],
  ['body-cardiovascular-electrolytes', 'body-respiratory-gas-exchange', 'body-respiratory-magnesium-asthma', 'body-lymphatic-system'],
  ['body-digestive-organs', 'body-kidneys-liver-filtration', 'body-kidney-stones-real-causes', 'body-kidney-stones-cooking-reduces-oxalate'],
  [
    'body-endocrine-crosstalk',
    'body-adrenal-glands-structure-function',
    'body-immune-system-nutrition',
    'body-reproductive-egg-supply-vs-sperm-production',
    'body-reproductive-zinc-fertility',
  ],
  // Health Literacy, Neurogenesis: the discovery, the dispute, then what moves it.
  [
    'neurogenesis-discovery-fundamentals',
    'neurogenesis-2018-controversy',
    'neurogenesis-bdnf-exercise',
    'neurogenesis-sleep',
    'neurogenesis-stress-cortisol-diet',
    'neurogenesis-depression-antidepressants',
  ],
  // Health Literacy, Chrononutrition: the clock first, then the rhythms it runs, then eating against it.
  [
    'chrono-circadian-clock-biology',
    'chrono-cortisol-awakening-response',
    'chrono-insulin-sensitivity-diurnal-rhythm',
    'chrono-gut-microbiome-diurnal-rhythm',
    'chrono-early-time-restricted-eating',
    'chrono-time-restricted-eating-nuance',
    'chrono-late-eating-cardiovascular-risk',
    'chrono-shift-work-metabolic-cardiovascular-risk',
    'chrono-autophagy-mixed-evidence',
  ],
  // Health Literacy, Sleep: what sleep is, its clock and its cycles, then what it does for the body.
  [
    'sleep-overview',
    'sleep-circadian-rhythm-basics',
    'sleep-architecture',
    'sleep-regularity-consistency',
    'sleep-glymphatic-system',
    'sleep-immune-vaccine-response',
    'sleep-inflammation-cytokine-mechanism',
    'sleep-autoimmune-risk',
    'sleep-autoimmune-disease-real-data',
    'sleep-cbti-first-line',
    'sleep-melatonin-real-dosing',
  ],
  // Health Literacy, Food Industry & History: chronological on the timeline shelf, the four cases before the pattern on the blame shelf.
  ['foodhistory-timeline-baseline-milling', 'foodhistory-timeline-chemical-convenience', 'foodhistory-timeline-glyphosate-hfcs', 'foodhistory-mechanism-disappearing-microbiota'],
  ['foodhistory-scapegoat-salt', 'foodhistory-scapegoat-margarine', 'foodhistory-scapegoat-sugar', 'foodhistory-scapegoat-eggs', 'foodhistory-eggs-nutrient-density', 'foodhistory-scapegoat-pattern'],
  ['foodhistory-cholesterol-real-drivers', 'foodhistory-apob-particle-count', 'foodhistory-butter-short-chain-fat'],
  // Health Literacy, Self Advocacy: why, then how, then the tests one at a time, then the caution.
  [
    'advocacy-why-it-matters',
    'advocacy-how-to-ask',
    'advocacy-cbc',
    'advocacy-hscrp',
    'advocacy-fasting-insulin',
    'advocacy-magnesium',
    'advocacy-zinc-copper',
    'advocacy-sex-hormones-menopause',
    'advocacy-prescribing-cascade',
  ],
  // Health Literacy, Hands-On & Complementary Therapies: the three compared, each in turn, then how to tell for yourself.
  [
    'handson-three-therapies-compared',
    'handson-chiropractic-back-pain-evidence',
    'handson-chiropractic-organ-claims',
    'handson-acupuncture-chronic-pain',
    'handson-acupuncture-where-it-does-nothing',
    'handson-deep-tissue-massage-evidence',
    'handson-targeted-versus-general-massage',
    'handson-safety-and-what-to-ask',
    'handson-tracking-whether-it-works',
  ],
  // Health Literacy, Portions: the three ideas, the reference numbers, then each nutrient's number, then what the app does with it.
  [
    'portion-overview',
    'portion-rda-ai-ul-explained',
    'portion-minimums-vs-optimal',
    'portion-calorie-needs-tdee',
    'portion-personalized-macro-targets',
    'portion-protein-real-need',
    'portion-fiber-real-need',
    'portion-sodium-ceiling',
    'portion-larger-portions-larger-intake',
    'portion-app-tracks-real-amounts',
  ],
  // Health Literacy, Fermentation Methods: the six methods, then where to go next.
  [
    'fermentmethod-overview',
    'fermentmethod-lacto-fermented-vegetables',
    'fermentmethod-sourdough',
    'fermentmethod-milk-kefir-and-yogurt',
    'fermentmethod-water-kefir',
    'fermentmethod-kombucha',
    'fermentmethod-wild-tonics',
    'fermentmethod-dairy-free-gluten-free-survey',
    'fermentmethod-reputable-sources',
  ],
  // Health Literacy, Mitochondria & Metabolism: the chain, then the two exercise findings.
  ['mito-sugar-visceral-fat-cytokine-chain', 'mito-exercise-autophagy-pgc1a', 'mito-exercise-intensity-inflammation'],
];

// Health Literacy's nutrient shelves follow one arc: what the nutrient is,
// how the body takes it in, who runs short and what that looks like, where
// to get it, what to take if food is not enough, when too much becomes a
// problem, and what it interacts with. Ids on those shelves are named for
// the stage they cover, so the stage is read from the id. Anything the
// arc does not name keeps its alphabetical place after the named stages,
// and the closing entry stays last. Applied only inside Health Literacy,
// so no condition page changes. 'prevention-' before 'apphelps-' is the
// same idea on the Prevention shelves: what to do before what the app
// does about it.
const BASIC_HEALTH_STAGES: [RegExp, number][] = [
  [/(^|-)overview(-|$)|-what-is-a-|discovery-fundamentals$|^prevention-/, 0],
  [/absorption/, 1],
  [/deficiency-prevalence/, 2],
  [/deficiency/, 3],
  [/food-sources/, 4],
  [/supplement-forms|d2-vs-d3/, 5],
  [/toxicity/, 6],
  [/interaction|synergies-antagonists|drug-/, 7],
  [/^apphelps-/, 9],
];
const UNNAMED_STAGE = 8;
function basicHealthStage(entry: AnyDigestEntry): number {
  if (entry.category !== 'basicHealth') return UNNAMED_STAGE;
  const hit = BASIC_HEALTH_STAGES.find(([re]) => re.test(entry.id));
  return hit ? hit[1] : UNNAMED_STAGE;
}
const READING_RANK = new Map<string, number>();
for (const list of DIGEST_READING_ORDER) {
  list.forEach((id, index) => READING_RANK.set(id, index));
}

export function sortDigestEntriesLogically(entries: AnyDigestEntry[]): AnyDigestEntry[] {
  const titleOf = (entry: AnyDigestEntry) => (isProblemFoodEntry(entry) ? entry.foodName : entry.title);
  return [...entries].sort((a, b) => {
    // Two entries on the same listed shelf sort by their listed positions
    // before anything else, so a shelf holding several vitamins in turn
    // keeps each vitamin's overview and closing entry with that vitamin
    // instead of pulling every overview to the front and every closing
    // entry to the back.
    const aRank = READING_RANK.get(a.id);
    const bRank = READING_RANK.get(b.id);
    if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
    const aOverview = a.id.endsWith('overview');
    const bOverview = b.id.endsWith('overview');
    if (aOverview !== bOverview) return aOverview ? -1 : 1;
    const aTying = isTyingTogetherEntry(a);
    const bTying = isTyingTogetherEntry(b);
    if (aTying !== bTying) return aTying ? 1 : -1;
    if (aRank !== undefined || bRank !== undefined) {
      if (aRank === undefined) return 1;
      if (bRank === undefined) return -1;
      return aRank - bRank;
    }
    const stage = basicHealthStage(a) - basicHealthStage(b);
    if (stage !== 0) return stage;
    return titleOf(a).localeCompare(titleOf(b));
  });
}


// A real, computed-not-stored grouping applied to every CONDITION category
// (everything except Basic Health, which already has its own, more
// granular by-topic shelf grouping above, and the synthetic 'search' lens)
// -- reusing the exact same shelf UI mechanism rather than inventing a
// second one.
//
// 2026-08-12, rebuilt from the original 4-pillar version (Core Science,
// Self-Advocacy & Testing, Whole-Body Effects, History & Life Stages),
// direct correction: "there are tons of topics available for each
// condition, yet there are only [4] sections... even though they have the
// search utility [t]he user shouldn't need to dig looking for something...
// I want them to see something and take an interest to want to read more
// on their own." Four broad pillars was flattening real, specific,
// individually-inviting topics (Pregnancy & Family Planning, Mental
// Health, a condition's own Global Perspective/Research Horizon research)
// down into generic buckets nobody would tap out of curiosity. This
// version surfaces those real clusters as their own real shelves instead.
//
// Same "reasonable v1 heuristic" discipline as the version it replaces,
// and as every other grouping mechanism in this file (Basic Health's own
// id-prefix matching) and elsewhere in this app (lib/foodNameGrouping.ts)
// -- computed from each entry's own id and title/food name at render time,
// NOT hand-reviewed entry by entry across 900+ condition entries, and NOT
// stored as a new field on DigestEntry (the same reasoning
// BASIC_HEALTH_TOPICS above already gives for its own choice). Verified
// against every real entry across all 19 conditions before shipping (a
// throwaway Node script mirroring this exact logic, run against the real
// content files) -- every condition landed 8-17 real, non-empty topic
// shelves (up from a fixed 4), with every singleton-sized shelf spot-
// checked by hand and confirmed to be a real, correctly-placed, single
// entry (e.g. a condition with exactly one Mental Health finding still
// deserves its own real "Mental Health" shelf, not folding into a bigger,
// vaguer bucket). Worth a further spot-check once seen on-device -- some
// entries will still land in a less-than-ideal topic (keyword heuristics
// always do), the same standing caveat the original pillar version and
// every other grouping feature in this app already ships under.
export type ConditionTopic =
  | 'Meals You Can Eat'
  | 'Core Science'
  | 'Diet & Food'
  | 'Medications & Treatment'
  | 'Self-Advocacy & Testing'
  | 'Whole-Body Effects'
  | 'Mental Health'
  | 'Pregnancy & Family Planning'
  | 'History & Milestones'
  | 'Around the World'
  | 'On the Horizon'
  | 'Gut & Microbiome'
  | 'Mitochondria & Metabolism'
  | 'Healing Stages'
  | 'Complementary & Manual Therapies'
  | 'Lifestyle & Environment'
  | 'Other Autoimmune Diseases'
  | 'The Big Picture';

// Real row order, most inviting/actionable first -- Meals You Can Eat
// leads where it exists (2026-08-24: a real, computed positive recipe
// list, only present for the 18 conditions this app has actual
// condition-scoped food-scoring data for -- see groupConditionEntries'
// own comment below), the single most directly actionable thing a
// condition page can show. Diet & Food follows (this app's own core
// mission, and the most concrete narrative topic most conditions carry);
// Core Science follows as the grounding/mechanism read; the
// Hashimoto's-only clusters (Gut &
// Microbiome, Mitochondria & Metabolism, Lifestyle & Environment, Healing
// Stages, Complementary & Manual Therapies, Other Autoimmune Diseases, The
// Big Picture -- none of these ever populate for any other condition, see
// classifyConditionTopic's own id-prefix checks below) are interleaved
// where they read naturally rather than dumped at the end; History &
// Milestones trails last, the same "least actionable day-to-day" reasoning
// the original 4-pillar order already established for it. The Big Picture
// sits last of all, right before a condition's own closing "tying
// together" card (pulled out separately, below) -- a fitting spot for
// Hashimoto's own narrative-arc chapters.
export const CONDITION_TOPIC_ORDER: ConditionTopic[] = [
  'Meals You Can Eat',
  'Diet & Food',
  'Core Science',
  'Gut & Microbiome',
  'Mitochondria & Metabolism',
  'Medications & Treatment',
  'Self-Advocacy & Testing',
  'Whole-Body Effects',
  'Other Autoimmune Diseases',
  'Mental Health',
  'Lifestyle & Environment',
  'Healing Stages',
  'Complementary & Manual Therapies',
  'Pregnancy & Family Planning',
  'Around the World',
  'On the Horizon',
  'History & Milestones',
  'The Big Picture',
];

// Every condition's own real closing synthesis entry (see each condition
// file's own "-tying-together" id convention, established from the very
// first structural-parity pass) is pulled out of the topic shelves
// entirely and shown as its own standalone card instead -- it's a real
// summary ACROSS everything else in the category, not a fit for any one
// topic.
export function isTyingTogetherEntry(entry: AnyDigestEntry): boolean {
  return entry.id.includes('tying-together');
}

// Checked in a real, deliberate priority order -- id-based signals first
// (far more reliable than title text, since this app's own id conventions
// are deliberate and consistent across every condition's own build
// history), title-text keyword matching as the fallback for everything an
// id alone can't distinguish.
//
// 1. "-overview" is checked before anything else, unconditionally -- an
//    overview's own title often names body systems, antibodies, or other
//    keyword-bait directly (Graves' own overview literally says
//    "Antibody"), which would otherwise trip a later check and land the
//    one entry meant to LEAD a category's reading order in the wrong shelf
//    entirely. Carried over unchanged from the original 4-pillar version,
//    where this exact case was already found and fixed once.
// 2. "horizon-" (Research Horizon, every condition's own real emerging-
//    treatment entries), "-global-" (Global Perspective, every condition's
//    own real international/regional research), and "pregnan" (this app's
//    own consistent "-pregnancy-..." id convention) are all real,
//    deliberate, reliable id signals established across every condition's
//    own build history -- checked by id substring, not title text, for the
//    same reliability reason "-overview" is.
// 3. "history"/"milestone" likewise -- every condition's own real
//    "-history-milestones" entry uses this exact wording in its own id.
// 4. A block of Hashimoto's-only id prefixes (gut-, mito-, healing-,
//    complementary-, bigpicture-, lifestyle-, other-, labs-, problem-,
//    nutrient-/additive-/interaction-/foodhistory-) -- real, dedicated
//    content clusters that only ever exist for Hashimoto's, since only
//    Hashimoto's content is assembled from this many separate, cross-
//    cutting source files (see lib/digest/index.ts's own DIGEST_CATEGORY_
//    META comment). A harmless no-op for every other condition, whose own
//    entries never carry these prefixes at all.
// 5. Keyword-in-title fallback for everything else, most specific first
//    (Mental Health's own vocabulary is narrow and reliable enough to
//    check before the much broader Diet/Medications/Self-Advocacy/Whole-
//    Body nets, which do have some real overlap with each other -- a food/
//    drug-interaction entry like "acitretin and alcohol" can plausibly
//    read as either, and lands in Diet & Food here deliberately, matching
//    this app's own food-first mission over a stricter "which is more
//    medically precise" reading).
export function classifyConditionTopic(entry: AnyDigestEntry): ConditionTopic {
  // 2026-08-24: a Recipe entry showing up here at all only ever happens
  // via the synthetic "Meals You Can Eat" topic (groupConditionEntries
  // builds that bucket directly, bypassing this classifier entirely) --
  // this check exists only so shelfGroupKeyForEntry's own real
  // classifyTopicForCategory call (used by toggleEntry/jumpToRelated to
  // scroll a tapped card into view) resolves a recipe card back to the
  // SAME topic key it was actually grouped under, not whatever this
  // classifier's own keyword/id heuristics would otherwise guess for a
  // recipe id it was never designed to recognize.
  if (entry.category === 'recipes') return 'Meals You Can Eat';
  const id = entry.id.toLowerCase();
  if (id.endsWith('overview')) return 'Core Science';

  if (id.startsWith('horizon-')) return 'On the Horizon';
  if (id.includes('-global-')) return 'Around the World';
  if (id.includes('pregnan')) return 'Pregnancy & Family Planning';
  if (id.includes('history') || id.includes('milestone')) return 'History & Milestones';
  // 2026-08-21, found and fixed directly: every one of the 19 "Fermented
  // Drinks and Foods for [Condition]" entries (one per tracked condition,
  // built 2026-08-20/21) was silently landing in the Core Science
  // fallback bucket instead of Diet & Food -- the keyword fallback below
  // checks `\bfood\b`, which never matches the plural "Foods" every one
  // of these titles actually uses (no word boundary between "food" and
  // its own trailing "s"), and none of them mention "diet," "dairy," or
  // any of the fallback's other literal words in the title either. A
  // real, deliberate id-based check, the same reliability reason every
  // other id-substring check above already exists for, rather than
  // patching the regex and hoping some future title still happens to
  // trip it.
  if (id.includes('fermented-drinks')) return 'Diet & Food';
  // 2026-09-17: the same kind of deliberate id check, for the same kind of
  // reason. lib/digest/neurodivergenceCrossover.ts adds one entry per
  // tracked condition covering where autism, ADHD or dyslexia crosses into
  // it. Nine of them are about the person rather than a child, and every
  // one of those is a whole-body finding: a gut condition, a heart, a
  // liver, a migraine. The keyword fallback below would scatter them
  // (anything with "diet" in the summary title would land in Diet & Food,
  // which is the one place a crossover entry must not imply it belongs).
  // The suffix was chosen over an "-adhd-" or "-autism-" marker because
  // those would also have caught celiac-adhd-symptoms-mixed-evidence and
  // pulled that existing card out of Diet & Food, where it belongs. The
  // seven pregnancy ones need no rule at all: the "pregnan" check above
  // already files them.
  if (id.endsWith('-crossover')) return 'Whole-Body Effects';

  if (id.startsWith('gut-')) return 'Gut & Microbiome';
  if (id.startsWith('mito-')) return 'Mitochondria & Metabolism';
  if (id.startsWith('healing-')) return 'Healing Stages';
  if (id.startsWith('complementary-')) return 'Complementary & Manual Therapies';
  if (id.startsWith('bigpicture-')) return 'The Big Picture';
  if (id.startsWith('lifestyle-')) return 'Lifestyle & Environment';
  if (id.startsWith('other-')) return 'Other Autoimmune Diseases';
  if (id.startsWith('problem-')) return 'Diet & Food';
  if (id.startsWith('nutrient-') || id.startsWith('additive-') || id.startsWith('interaction-') || id.startsWith('foodhistory-')) {
    return 'Diet & Food';
  }
  if (id.startsWith('labs-')) return 'Self-Advocacy & Testing';

  const title = (isProblemFoodEntry(entry) ? entry.foodName : entry.title).toLowerCase();
  const haystack = `${id} ${title}`;

  if (/depress|anxiety|suicid|psychiatric|mental health/.test(haystack)) return 'Mental Health';

  if (
    /\bdiet\b|nutrition|omega|mediterranean|\balcohol\b|gluten|nightshade|vitamin|fasting|weight loss|grapefruit|folate|\bfood\b|caffeine|coffee|\bsugar\b|\bfiber\b|probiotic|dairy/.test(
      haystack,
    )
  ) {
    return 'Diet & Food';
  }

  if (
    /advocacy|screening|\bscreen\b|monitoring|diagnos|antibody|\bpanel\b|biopsy|\blab\b|criteria|\bstaging\b|classification|\btest\b|scoring|das28|pasi|caspar/.test(
      haystack,
    )
  ) {
    return 'Self-Advocacy & Testing';
  }

  if (
    /medication|\bdrug\b|treatment|\btherapy\b|therapies|biologic|inhibitor|\bsurgery\b|surgical|\bdose\b|dosing|injection|infusion|transplant|prescri|steroid|antithyroid|nsaid|statin|metformin|insulin|allopurinol|colchicine|levothyroxine|phototherapy|biosimilar|vaccine|methotrexate|rituximab|tocilizumab|cyclosporine|acitretin|teprotumumab|methimazole|\bjak\b|il-?23|il-?6\b|sulfonylurea/.test(
      haystack,
    )
  ) {
    return 'Medications & Treatment';
  }

  if (
    /organ|systemic|comorbid|extra-articular|-systems|kidney|liver|cardiac|\bheart\b|\bbone\b|\blung\b|\beye\b|\bskin\b|neuro|\bbrain\b|cognitive|bladder|vascul|\bnail\b|paralysis|fibromyalgia/.test(
      haystack,
    )
  ) {
    return 'Whole-Body Effects';
  }

  return 'Core Science';
}

// 2026-08-25, direct follow-up after Basic Health's own oversized topics
// were split into real subtopics: "Yes, throughout the Digest. Everything
// must have continuity throughout the Digest." A real per-(condition,
// topic) count (a throwaway Node script reimplementing classifyConditionTopic
// above against every real entry, not guessed) found this exact same
// "one continuous scrolling shelf" problem inside 18 separate (condition,
// topic) shelves across 11 different conditions, several worse than
// anything Basic Health had (prostateHealth's own Core Science bucket
// alone held 30 entries in one shelf). Every one of these 18 groupings
// was designed by reading every real title in that shelf, the same
// discipline as Basic Health's own subtopics, not guessed from the topic
// name alone.
//
// Keyed by the entries' own real `category` field (a DigestCategoryKey,
// confirmed identical to what classifyConditionTopic's caller already
// has on hand) rather than by conditionCode -- groupConditionEntries
// below is handed a mixed conditionCode/entries pairing whose exact
// casing convention isn't worth re-deriving here when entry.category is
// already the one reliable, already-present source of truth.
//
// A topic/condition pair with no entry here is untouched, rendering
// exactly as one flat shelf as before -- most (condition, topic) pairs
// are genuinely small enough (2-10 entries) that further subdivision
// would only fragment them for no real benefit, matching the same
// judgment call Basic Health's own smaller topics (Neurogenesis,
// Depletion, Mitochondria & Metabolism, and so on) were left alone under.
// 2026-08-29: widened from ConditionTopic to a plain string key so Earth
// Matters and Home Gardening topics can declare subgroups through the same
// mechanism, rather than only condition pages being able to. Direct
// request to make absolutely sure EVERY shelf in Digest gets split when it
// covers more than one thing, not just the condition ones.
export const CONDITION_TOPIC_SUBGROUPS: Partial<Record<DigestCategoryKey, Partial<Record<string, { label: string; ids: string[] }[]>>>> = {
  rheumatoidArthritis: {
    'Core Science': [
      { label: 'What Triggers It', ids: ['ra-smoking-citrullination', 'ra-periodontal-disease-pgingivalis', 'ra-hla-drb1-molecular-mechanism'] },
      { label: 'Diagnosis & Measurement', ids: ['ra-seronegative-real-data', 'ra-mri-ultrasound-early-erosion', 'ra-treat-to-target-remission'] },
      { label: 'Distinct Presentations', ids: ['ra-elderly-onset-distinct-presentation', 'ra-felty-syndrome'] },
      { label: 'Disease Activity & Timing', ids: ['ra-leptin-disease-activity-correlation', 'ra-capra-chronotherapy-trial'] },
    ],
  },
  earthMatters: {
    'Soil Science & Why It Matters': [
      { label: 'Is Soil Depletion Actually Happening?', ids: ['foodhistory-soil-landmark-studies', 'foodhistory-soil-dilution-vs-depletion', 'foodhistory-soil-real-depletion', 'foodhistory-regen-nutrient-density-honest-evidence', 'foodhistory-regen-co2-nutrient-decline', 'foodhistory-regen-fao-baseline-stakes'] },
      { label: 'How Soil Fertility Actually Works', ids: ['foodhistory-regen-innovations-soil-biology', 'foodhistory-regen-mycorrhizal-networks', 'foodhistory-regen-liquid-carbon-pathway', 'foodhistory-regen-soil-food-web-mineralization', 'foodhistory-regen-rhizobia-nitrogen-fixation', 'foodhistory-regen-darwin-earthworms-vermicompost', 'foodhistory-regen-terra-preta-ancient-biochar', 'foodhistory-regen-engineered-nitrogen-fixing-microbes'] },
      { label: 'Practices, Measured', ids: ['foodhistory-regen-agroforestry-quantified', 'foodhistory-regen-water-infiltration-quantified', 'foodhistory-regen-nrcs-soil-health-demonstrations', 'foodhistory-regen-uc-davis-century-experiment', 'foodhistory-regen-holistic-grazing-disputed', 'foodhistory-regen-organic-yield-gap-meta-analysis', 'foodhistory-regen-yield-gap-context-dependent', 'foodhistory-regen-biodynamic-farming-correction'] },
    ],
    // 2026-09-19: thirteen case studies, split by region. Korean Natural
    // Farming and the six added after the classifier was written moved
    // here from a same-named subgroup inside Soil Science.
    'Case Studies From Around the World': [
      { label: 'The Americas', ids: ['foodhistory-regen-individual-farm-case-study', 'foodhistory-regen-rodale-farming-systems-trial', 'foodhistory-regen-brazil-case-study', 'foodhistory-regen-colombia-shade-coffee-birds'] },
      { label: 'Africa', ids: ['foodhistory-regen-niger-fmnr-case-study', 'foodhistory-regen-kenya-rangeland-enclosures', 'foodhistory-regen-elephant-dung-fertilizer'] },
      { label: 'Asia', ids: ['foodhistory-regen-china-loess-plateau', 'foodhistory-regen-india-water-harvesting-case-study', 'foodhistory-regen-india-zbnf-case-study', 'foodhistory-regen-sikkim-organic-state', 'foodhistory-regen-korean-natural-farming-jadam'] },
      { label: 'Europe', ids: ['foodhistory-regen-netherlands-nitrogen-conflict'] },
    ],
    // 2026-09-19: fourteen policy entries once the three standards and
    // land-ownership entries moved here from Soil Science.
    'Policy, Economics & Power': [
      { label: 'Why Regeneration Is Not Mandated', ids: ['foodhistory-regen-why-not-mandated', 'foodhistory-regen-lobbying-imbalance', 'foodhistory-regen-pesticide-liability-shields', 'foodhistory-regen-eu-cap-structural-disincentive'] },
      { label: 'Standards, Certification & Carbon Programs', ids: ['foodhistory-regen-usda-organic-certification', 'foodhistory-regen-4-per-1000-initiative', 'foodhistory-regen-carbon-credit-integrity-problems'] },
      { label: 'Who Owns the Seeds, the Land & the Machines', ids: ['foodhistory-regen-seed-industry-consolidation', 'foodhistory-regen-seed-patent-litigation', 'foodhistory-regen-right-to-repair-farm-equipment', 'foodhistory-regen-farmland-ownership-concentration', 'foodhistory-regen-tribal-co-stewardship-policy'] },
      { label: 'The Human Cost & Who Is Pushing Back', ids: ['foodhistory-regen-farmer-mental-health-debt-crisis', 'foodhistory-regen-reform-coalition-orgs'] },
    ],
    Pollinators: [
      { label: 'The Scale of the Decline', ids: ['foodhistory-regen-pollinator-decline-crisis', 'foodhistory-regen-insect-apocalypse-hallmann', 'foodhistory-regen-honeybee-genetic-bottleneck', 'foodhistory-regen-bat-pollinators-white-nose'] },
      { label: 'What\'s Actually at Stake', ids: ['foodhistory-regen-pollinator-dependent-crops', 'foodhistory-regen-pollinator-nutrition-stakes', 'foodhistory-regen-almond-pollination-rental-economics', 'foodhistory-regen-smallholder-pollinator-vulnerability'] },
      { label: 'Wild Pollinators & Mechanisms', ids: ['foodhistory-regen-wild-bees-buzz-pollination', 'foodhistory-regen-phenological-mismatch', 'foodhistory-regen-organic-farming-pollinator-abundance'] },
      { label: 'What Is Being Done About It', ids: ['foodhistory-regen-robotic-drone-pollination', 'foodhistory-regen-pollinator-habitat-regenerative-link'] },
    ],
  },
  // homeGardening has no subgroups since 2026-09-19: its indoor, soil and
  // technique entries moved to topics of their own in
  // classifyHomeGardeningTopic, and no Horticulture topic holds more than
  // eight entries.
  lupus: {
    'Core Science': [
      { label: 'Terms & Definitions', ids: ['glossary-aps-antiphospholipid', 'glossary-sledai'] },
      { label: 'Mechanisms & Triggers', ids: ['lupus-uv-light-flare-mechanism', 'lupus-c1q-complement-deficiency-genetic', 'lupus-circadian-clock-bmal1', 'lupus-immune-stimulating-herbs'] },
      { label: 'Complications', ids: ['lupus-antiphospholipid-syndrome', 'lupus-glucocorticoid-osteoporosis', 'lupus-raynauds-thrombosis-risk', 'lupus-fatigue-real-prevalence-mechanism'] },
      { label: 'Treatment Adherence', ids: ['lupus-hydroxychloroquine-adherence-flare-prevention'] },
    ],
  },
  celiac: {
    'Core Science': [
      { label: 'Living Gluten-Free in Practice', ids: ['celiac-cross-contamination', 'celiac-oats-controversy', 'celiac-villi-healing-timeline', 'celiac-gut-dysbiosis-reversal-gfd'] },
      { label: 'When Symptoms Persist', ids: ['celiac-persistent-symptoms-ibs-overlap', 'celiac-refractory-type1-vs-type2', 'celiac-seronegative-real-prevalence'] },
      { label: 'Beyond the Gut', ids: ['celiac-hypertension-paradox-real-data', 'celiac-atrial-fibrillation-real-risk', 'celiac-male-fertility-honest-null', 'celiac-circadian-clock-disruption'] },
    ],
  },
  chronicKidneyDisease: {
    'Core Science': [
      { label: 'Diet & Restrictions, Reconsidered', ids: ['ckd-potassium-restriction-reconsidered', 'ckd-protein-restriction-plant-based', 'ckd-metabolic-acidosis-bicarbonate'] },
      { label: 'Anemia & Iron', ids: ['ckd-anemia-erythropoietin', 'ckd-iv-vs-oral-iron-real-trials'] },
      { label: 'Symptoms That Get Overlooked', ids: ['ckd-associated-pruritus', 'ckd-restless-legs-syndrome-real-prevalence', 'ckd-nocturnal-blood-pressure-circadian'] },
      { label: 'Staging & Measurement Debates', ids: ['ckd-age-adapted-egfr-debate', 'ckd-adiponectin-paradox'] },
    ],
  },
  gout: {
    'Core Science': [
      { label: 'Getting the Diagnosis Right', ids: ['gout-flare-vs-septic-arthritis', 'gout-pseudogout-cppd-distinction'] },
      { label: 'Diet & Triggers', ids: ['gout-cherries', 'gout-dash-sodium-trial-real-mechanism'] },
      { label: 'What Gout Travels With', ids: ['gout-metabolic-cluster-connection', 'gout-sleep-apnea-bidirectional-real-data', 'gout-erectile-dysfunction-real-data'] },
      { label: 'Damage & Advanced Treatment', ids: ['gout-tophi-real-prevalence-joint-damage', 'gout-pegloticase-tophus-resolution-real-data'] },
      { label: 'Why Flares Strike at Night', ids: ['gout-nocturnal-flare-circadian-pattern'] },
    ],
  },
  prostateHealth: {
    'Core Science': [
      { label: 'Overview & Glossary', ids: ['prostate-overview', 'glossary-bph', 'glossary-brca2', 'glossary-psa', 'glossary-psma'] },
      { label: 'Gut Microbiome Connections', ids: ['prostate-gut-microbiome-bph', 'prostate-gut-microbiome-cancer-androgens'] },
      {
        label: 'Nutrients & Compounds',
        ids: [
          'prostate-lycopene-bph-clinical-trial',
          'prostate-cruciferous-sulforaphane',
          'prostate-choline-tmao',
          'prostate-zinc-citrate-truncated-krebs-cycle',
          'prostate-seminal-citrate-cancer-marker',
          'prostate-zinc-testosterone-deficiency',
          'prostate-saw-palmetto-mixed',
          'prostate-beta-sitosterol-bph-evidence',
          'prostate-beta-sitosterol-testosterone-dht',
          'prostate-testosterone-nutrients-comparison',
          'prostate-ornish-lifestyle-trial',
        ],
      },
      {
        label: 'BPH & Prostatitis',
        ids: [
          'prostate-metabolic-syndrome-bph-link',
          'prostate-prostatitis-distinct-condition',
          'prostate-hif-vegf-angiogenesis-shared-pathway',
          'prostate-pae-mechanism-paradox',
          'prostate-tadalafil-dual-bph-ed',
          'prostate-nocturia-circadian-vasopressin',
          'prostate-finasteride-vs-dutasteride-comparison',
        ],
      },
      {
        label: 'PSA, Cancer & Surveillance',
        ids: ['prostate-age-specific-psa-ranges', 'prostate-active-surveillance', 'prostate-active-surveillance-real-longterm-data', 'prostate-vasectomy-no-link', 'prostate-ejaculation-frequency'],
      },
    ],
  },
  hashimotos: {
    'Core Science': [
      { label: 'Terms & Definitions', ids: ['glossary-aip', 'glossary-aps2', 'glossary-autoimmune-disease', 'glossary-autophagy-mitophagy', 'glossary-euthyroid-hypothyroid', 'glossary-healing-stages', 'glossary-molecular-mimicry', 'glossary-mots-c', 'glossary-th17', 'glossary-wolff-chaikoff', 'glossary-ndt'] },
    ],
    'Healing Stages': [
      { label: 'How the Stages Map Out', ids: ['healing-stage-map'] },
      { label: 'Stage 1: Settling Things Down', ids: ['healing-stage1-eat', 'healing-stage1-avoid', 'healing-stage1-bone-broth', 'healing-stage1-fermented-exclusion'] },
      { label: 'Stage 2: Reintroducing', ids: ['healing-stage2-reintroduction', 'healing-stage2-fermented-entry', 'healing-stage2-fiber-expansion'] },
      { label: 'Stage 3: Well-Healed', ids: ['healing-stage3-what-it-looks-like', 'healing-stage3-practical-shifts'] },
      { label: 'Corrections', ids: ['healing-tension-detox-myth'] },
    ],
    'Mitochondria & Metabolism': [
      { label: 'Autophagy & Cellular Cleanup', ids: ['mito-il23-autophagy-suppression', 'mito-mtor-cd4-reprogramming', 'mito-mots-c'] },
      { label: 'Fasting: Both Sides', ids: ['mito-fasting-autophagy-tension', 'mito-ramadan-fasting-study'] },
    ],
    'Diet & Food': [
      {
        label: 'Nutrients & Supplements',
        ids: [
          'nutrient-selenium',
          'nutrient-myo-inositol',
          'nutrient-iodine',
          'nutrient-vitamin-d',
          'nutrient-zinc-iron-b12',
          'nutrient-folate-antioxidants',
          'nutrient-nigella-sativa',
          'nutrient-ashwagandha',
          'nutrient-iodine-supplement-caution',
          'nutrient-magnesium-thyroid-connection',
          'interaction-selenium-iodine',
          'glossary-d1-d6',
        ],
      },
      { label: 'Fermented & Everyday Foods', ids: ['nutrients-fermented-drinks-hashimotos', 'additive-nitrates-nitrites'] },
      {
        label: 'Foods to Watch',
        ids: [
          'problem-gluten-grains',
          'problem-raw-cruciferous',
          'problem-nightshades',
          'problem-high-histamine',
          'problem-sugar-sweetened-beverages',
          'problem-soy',
          'problem-coffee-timing',
          'problem-excess-iodine-kelp',
          'problem-gluten-free-without-celiac',
        ],
      },
      { label: 'Labs Tied to Diet', ids: ['advocacy-vitamin-d', 'advocacy-b12-folate', 'advocacy-lipid-panel', 'advocacy-a1c-glucose'] },
    ],
    'Self-Advocacy & Testing': [
      { label: 'Antibody & Thyroid Panel Basics', ids: ['glossary-tg-antitg', 'glossary-tpo', 'advocacy-core-thyroid-panel', 'advocacy-thyroid-antibodies', 'advocacy-seronegative-hashimotos'] },
      {
        label: 'Levothyroxine Timing & Absorption',
        ids: [
          'labs-biotin-interference',
          'labs-calcium-iron-absorption',
          'labs-magnesium-levothyroxine-timing',
          'labs-grapefruit-juice',
          'labs-tsh-diurnal-timing',
          'labs-bedtime-dosing',
          'labs-breakfast-higher-dose',
          'labs-absorption-interferers-beyond-food',
          'labs-timing-master-rule',
        ],
      },
      {
        label: 'Beyond Standard Dosing',
        ids: [
          'labs-combination-t3-ndt',
          'labs-drug-induced-thyroid-dysfunction',
          'labs-checkpoint-inhibitor-thyroiditis',
          'labs-age-adjusted-tsh-target-older-adults',
          'advocacy-reverse-t3',
          'advocacy-tsh-optimal-range-debate',
        ],
      },
      {
        label: 'Related Labs Worth Asking For',
        ids: ['advocacy-iron-ferritin', 'advocacy-selenium-testing', 'advocacy-cmp', 'advocacy-cortisol-testing', 'advocacy-elimination-protocol-exception', 'advocacy-fibromyalgia-thyroid-overlap'],
      },
    ],
    'Gut & Microbiome': [
      { label: 'Core Mechanisms', ids: ['gut-scfa-treg', 'gut-zonulin-gliadin', 'gut-th17-treg-imbalance', 'gut-molecular-mimicry', 'gut-leaky-gut-contested'] },
      {
        label: 'Specific Compounds & Repair',
        ids: ['gut-glutamine-null-result', 'gut-vitamin-d-cldn2', 'gut-zinc-carnosine', 'gut-strain-specific-mechanisms', 'gut-larazotide', 'gut-zonulin-timeline', 'gut-4r-protocol'],
      },
      { label: 'Research From Other Diseases', ids: ['gut-blautia-lupus-zonulin', 'gut-aip-ibd-rct', 'gut-probiotic-yogurt-lupus-rct'] },
      { label: "Hashimoto's-Specific Studies", ids: ['gut-fiber-hashimotos-microbiota'] },
    ],
    'History & Milestones': [
      { label: 'The Original Discovery & Mechanism', ids: ['history-1912-first-description', 'history-1956-autoimmune-mechanism', 'history-1985-tpo-identified', 'history-genetic-era', 'history-heritability-family-risk'] },
      {
        label: 'Public Health & Treatment Evolution',
        ids: ['history-1924-iodized-salt', 'history-1960s-tsh-testing', 'history-desiccated-to-levothyroxine', 'history-desiccated-thyroid-standardization', 'history-whickham-progression-rate'],
      },
      { label: 'The Modern Surge & Mechanism Links', ids: ['foodhistory-timeline-modern-surge', 'foodhistory-mechanism-gut-barrier', 'foodhistory-mechanism-soil-nutrients-bridge'] },
      { label: 'Healing-Stage Milestones', ids: ['healing-stage1-milestones', 'healing-stage2-milestones'] },
    ],
    'Whole-Body Effects': [
      { label: 'The Liver Connection', ids: ['organ-liver-t4t3-conversion', 'organ-liver-hashimotos-damage', 'organ-liver-nafld-link', 'organ-liver-fixing-helps-thyroid', 'organ-liver-autoimmune-overlap', 'glossary-alt-ast'] },
      { label: 'Heart, Brain & Kidneys', ids: ['organ-cardiovascular', 'organ-brain-cognitive', 'organ-brain-neurogenesis-thyroid-mechanism', 'organ-kidney'] },
      { label: 'Other Organ Systems', ids: ['organ-adrenal-aps2', 'organ-musculoskeletal', 'organ-skin-hair', 'organ-primary-thyroid-lymphoma'] },
    ],
    'Lifestyle & Environment': [
      { label: 'Stress, Sleep & Hormones', ids: ['lifestyle-chronic-stress-hpa', 'lifestyle-il6-deiodinase', 'lifestyle-sleep-circadian', 'lifestyle-sleep-apnea'] },
      { label: 'Environmental Exposures', ids: ['lifestyle-edc-bpa-phthalates', 'lifestyle-environmental-goitrogens-water', 'lifestyle-air-pollution', 'lifestyle-nsaids-gut'] },
      { label: 'Infections & Triggers', ids: ['lifestyle-ebv-viral-trigger', 'lifestyle-covid19-thyroid-trigger'] },
      { label: 'Alcohol, Smoking & Diet-Adjacent Habits', ids: ['lifestyle-alcohol-advisory', 'lifestyle-smoking-paradox', 'lifestyle-synbiotic-il6-vijay-2025'] },
    ],
  },
  migraine: {
    'Core Science': [
      { label: 'Overview & Mechanisms', ids: ['migraine-overview', 'glossary-cgrp', 'migraine-episodic-chronic-real-debate', 'migraine-transformation-real-risk-factors', 'migraine-circadian-clock-genes'] },
      { label: 'Types & Red Flags', ids: ['migraine-red-flags', 'migraine-vestibular-underrecognized', 'migraine-hemiplegic-genetic-subtype', 'migraine-menopause-new-onset-redflag'] },
      {
        label: 'Hormonal & Lifestyle Triggers',
        ids: [
          'migraine-menstrual-estrogen-withdrawal',
          'migraine-aura-hormonal-contraceptives',
          'migraine-sleep-bidirectional',
          'migraine-obesity-chronification-risk',
          'migraine-weather-barometric-pressure-mixed',
          'migraine-histamine-dao-deficiency',
        ],
      },
      { label: 'Nutrients & Gut', ids: ['migraine-magnesium-riboflavin-coq10', 'migraine-iv-magnesium-acute-er', 'migraine-gut-microbiome-real-association'] },
      { label: 'Treatment Evidence & Living With It', ids: ['migraine-acupuncture-real-evidence-honest', 'migraine-botox-realworld-longterm-data', 'migraine-stigma-workplace-real-survey-data'] },
    ],
  },
  ibd: {
    'Core Science': [
      { label: 'Overview & Terminology', ids: ['ibd-overview', 'glossary-uc-crohns', 'glossary-psc', 'glossary-tpmt'] },
      {
        label: 'Complications Beyond the Gut',
        ids: [
          'ibd-extraintestinal-manifestations',
          'ibd-extraintestinal-real-prevalence-split',
          'ibd-creeping-fat-crohns',
          'ibd-perianal-fistula-real-data',
          'ibd-iron-deficiency-anemia',
          'ibd-venous-thromboembolism-real-risk',
          'ibd-cdiff-elevated-risk-real-data',
        ],
      },
      { label: 'Monitoring & Risk', ids: ['ibd-calprotectin', 'ibd-colonoscopy-surveillance'] },
      { label: 'Triggers & Mechanisms', ids: ['ibd-smoking-paradox', 'ibd-smoking-cessation-real-benefit', 'ibd-hygiene-hypothesis-early-life', 'ibd-circadian-clock-disruption'] },
      { label: 'Living With IBD', ids: ['ibd-fodmap-remission-symptoms'] },
    ],
  },
  ibs: {
    'Core Science': [
      {
        label: 'Overview & Mechanism',
        ids: ['ibs-overview', 'ibs-vs-ibd-distinction', 'ibs-visceral-hypersensitivity-mechanism', 'ibs-gut-serotonin-mechanism', 'ibs-post-infectious-mechanism', 'ibs-circadian-motility-disruption'],
      },
      { label: 'Symptoms & Diagnosis', ids: ['ibs-red-flags-workup', 'ibs-bloating-distension-real-mechanism', 'ibs-functional-dyspepsia-overlap', 'ibs-post-covid-real-data'] },
      {
        label: 'Treatment Evidence',
        ids: ['ibs-peppermint-oil', 'ibs-gut-directed-hypnotherapy', 'ibs-kiwifruit-prunes-psyllium-constipation-trial', 'ibs-exercise-real-trial-evidence', 'ibs-linaclotide-real-quantified-response-rates'],
      },
      { label: 'Who It Affects & Its Cost', ids: ['ibs-sex-hormones-women-real-data', 'ibs-economic-work-productivity-burden'] },
    ],
  },
  multipleSclerosis: {
    'Core Science': [
      { label: 'Overview & Cause', ids: ['ms-overview', 'ms-ebv-trigger', 'ms-ebna1-glialcam-mimicry', 'ms-smoking-risk'] },
      {
        label: 'Disease Course & Symptoms',
        ids: ['ms-disease-course-types', 'ms-uhthoffs-phenomenon-heat', 'ms-optic-neuritis-real-data', 'ms-pediatric-onset-real-differences', 'ms-fracture-risk-real-meta-analysis'],
      },
      { label: 'Diet Trials & Treatment', ids: ['ms-waves-trial', 'ms-sodium-th17-contested', 'ms-dmf-flushing-management', 'ms-nabiximols-spasticity-real-trials', 'ms-exercise-fatigue-real-evidence'] },
      { label: 'Emerging Markers', ids: ['ms-leptin-activity-marker-conflicting', 'ms-melatonin-circadian-relapse'] },
    ],
  },
  graves: {
    'Core Science': [
      { label: 'Terms & Definitions', ids: ['glossary-graves-disease', 'glossary-ptu'] },
      { label: 'What Causes It, and Who Gets It', ids: ['graves-overview', 'graves-genetic-family-risk', 'graves-stress-trigger', 'graves-subclinical-hyperthyroidism', 'graves-iodine', 'graves-leptin-lower-than-controls', 'graves-circadian-clock-disruption'] },
      { label: 'Treatment & Measured Outcomes', ids: ['graves-beta-blockers', 'graves-remission-real-rates', 'graves-rai-hypothyroidism-real-rate', 'graves-thyroidectomy-real-complication-rates', 'graves-orbital-decompression-real-outcomes', 'graves-selenium-orbitopathy-5year-honest-followup'] },
      { label: 'Beyond the Thyroid', ids: ['graves-dermopathy-pretibial-myxedema', 'graves-atrial-fibrillation-real-risk', 'graves-hair-loss-honest-evidence-gap'] },
    ],
    'Medications & Treatment': [
      {
        label: 'Antithyroid Drug Treatment',
        ids: [
          'graves-remission-real-rates',
          'graves-block-replace-vs-titration',
          'graves-pediatric-lower-remission-real-data',
          'graves-recurrence-after-drug-withdrawal',
          'graves-longterm-low-dose-atd-maintenance',
          'graves-methimazole-embryopathy-real-data',
        ],
      },
      { label: 'Surgery & Radioactive Iodine', ids: ['graves-treatment-comparison-real-outcomes', 'graves-thyroidectomy-real-complication-rates', 'graves-iodine'] },
      {
        label: 'Thyroid Eye Disease Treatment',
        ids: ['graves-teprotumumab-thyroid-eye-disease', 'graves-teprotumumab-hearing-real-data', 'graves-orbital-decompression-real-outcomes', 'graves-eye-disease-quality-of-life-real-data'],
      },
      { label: 'Cardiac & Other Complications', ids: ['graves-persistent-cardiac-symptoms-post-treatment', 'graves-atrial-fibrillation-real-risk'] },
    ],
  },
  pcos: {
    'Core Science': [
      { label: 'Overview & Diagnosis', ids: ['pcos-overview', 'pcos-rotterdam-phenotypes', 'pcos-lean-phenotype-real-data', 'glossary-ivf'] },
      { label: 'Metabolic & Gut Mechanisms', ids: ['pcos-gut-microbiome-hyperandrogenism', 'pcos-adiponectin-leptin-imbalance', 'pcos-hypertension-real-data', 'pcos-endometrial-cancer-risk'] },
      { label: 'Nutrients & Diet Trials', ids: ['pcos-myo-dchiro-inositol', 'pcos-spearmint-tea', 'pcos-time-restricted-eating-trial'] },
      { label: 'Fertility & Quality of Life', ids: ['pcos-ivf-real-outcomes', 'pcos-eating-disorder-risk-real-data', 'pcos-hirsutism-quality-of-life-real-data'] },
    ],
  },
  psoriasis: {
    'Diet & Food': [
      { label: 'Weight & Diet Pattern Evidence', ids: ['psoriasis-weight-loss', 'psoriasis-mediterranean-diet', 'psoriasis-bariatric-surgery', 'psoriasis-intermittent-fasting-real-trial'] },
      {
        label: 'Foods & Triggers',
        ids: ['psoriasis-gluten-mechanism', 'psoriasis-nightshades', 'psoriasis-alcohol', 'psoriasis-alcohol-treatment-response-real-data', 'psoriasis-fermented-drinks'],
      },
      { label: 'Nutrients', ids: ['psoriasis-vitamin-d-oral', 'psoriasis-omega3-mixed', 'psoriasis-advocacy-topical-vitamin-d-calcium'] },
      { label: 'Medication Interactions', ids: ['psoriasis-cyclosporine-grapefruit', 'psoriasis-acitretin-alcohol'] },
    ],
  },
  cardiovascularDisease: {
    'Core Science': [
      { label: 'Terms & Definitions', ids: ['glossary-ldl-hdl', 'glossary-pad', 'glossary-tmao'] },
      { label: 'Diet & Sodium', ids: ['cvd-dash-sodium', 'cvd-potassium-salt-substitute-real-trial', 'cvd-legumes-cruciferous-sex-specific-young-adults'] },
      { label: 'Testing & Risk Markers', ids: ['cvd-coronary-calcium-score', 'cvd-hypoadiponectinemia-independent-risk'] },
      { label: 'Treatment, With Reversals', ids: ['cvd-aspirin-primary-prevention-reversal', 'cvd-pad-supervised-exercise-real-data', 'cvd-afib-catheter-ablation-real-trial'] },
    ],
    'Whole-Body Effects': [
      { label: 'Heart Attack & Symptoms', ids: ['cvd-heart-attack-red-flags', 'cvd-elderly-atypical-mi-presentation'] },
      { label: 'Beyond the Heart', ids: ['cvd-kidney-brain-pad-real-data', 'cvd-myocardial-ischemia-neurogenesis-impairment'] },
      { label: 'Risk Markers', ids: ['cvd-lipoprotein-a-underrecognized', 'cvd-tmao-gut-microbiome-real-data', 'cvd-air-pollution-pm25-real-data', 'cvd-late-eating-nutrinet-sante'] },
      {
        label: 'Treatment & Prevention Evidence',
        ids: [
          'cvd-cantos-inflammation-hypothesis',
          'cvd-cardiac-rehabilitation-underused',
          'cvd-cardiac-rehab-real-barriers-completion',
          'cvd-polypill-primary-prevention',
          'cvd-afib-catheter-ablation-real-trial',
        ],
      },
    ],
  },
  fattyLiverDisease: {
    'Diet & Food': [
      {
        label: 'Diet Pattern Evidence',
        ids: ['masld-mediterranean-diet', 'masld-mediterranean-diet-2year-real-biomarkers', 'masld-vegetarian-diet-rct-weight-loss-mechanism', 'masld-fermented-drinks'],
      },
      { label: 'Weight, Exercise & Alcohol', ids: ['masld-weight-loss-thresholds', 'masld-exercise-independent-weight-loss', 'masld-metald-alcohol-threshold'] },
      {
        label: 'Nutrients & Supplements',
        ids: ['masld-coffee-protective', 'masld-vitamin-e-pivens-trial', 'masld-fiber-intake-real-data', 'masld-probiotics-real-trial-mixed', 'masld-vitamin-d-mixed-evidence'],
      },
      { label: 'Genetics', ids: ['masld-pnpla3-genetic-risk'] },
    ],
  },
  type2Diabetes: {
    'Core Science': [
      { label: 'Overview & Diagnosis', ids: ['type2-overview', 'type2-vs-type1-distinction', 'type2-prediabetes-real-progression', 'glossary-glp1'] },
      { label: 'Remission Evidence', ids: ['type2-direct-remission-trial', 'type2-remission-ada-consensus-definition', 'type2-individualized-hba1c-targets'] },
      { label: 'Related Conditions', ids: ['type2-metabolic-syndrome-cluster', 'type2-periodontal-disease-bidirectional', 'type2-sleep-apnea-glycemic-control'] },
      { label: 'Complications', ids: ['type2-diabetic-foot-ulcer-amputation-risk', 'type2-hearing-loss-real-prevalence', 'type2-pancreatic-cancer-risk-real-data'] },
    ],
  },
  sjogrens: {
    'Core Science': [
      { label: 'Overview & Distinctions', ids: ['sjogrens-overview', 'sjogrens-primary-secondary-real-distinction', 'sjogrens-secondary-ra-lupus-overlap'] },
      {
        label: 'Symptoms & Daily Impact',
        ids: ['sjogrens-fatigue-most-disabling', 'sjogrens-dental-caries-risk', 'sjogrens-oral-candidiasis-risk', 'sjogrens-exercise-fatigue-real-trials', 'sjogrens-fluoride-varnish-real-trial-honest-null'],
      },
      { label: 'Lymphoma Risk', ids: ['sjogrens-lymphoma-risk', 'sjogrens-parotid-swelling-lymphoma-predictor', 'sjogrens-lymphoma-specific-risk-factors-checkable'] },
      { label: 'Emerging Markers', ids: ['sjogrens-leptin-mixed-inconclusive', 'sjogrens-salivary-gland-clock-genes'] },
    ],
  },
};

// Splits one topic's own entries into real '::'-joined sub-shelves when
// CONDITION_TOPIC_SUBGROUPS above defines them for this exact (category,
// topic) pair, the same generic mechanism "Meals You Can Eat" already
// proved out for a condition page (BasicHealthShelves' own drill-in
// filter, collapseTopicsForMenu, and shelfHeadingLabel all already key
// off a label's own '::'-split first segment, with no changes needed
// here). An entry whose id isn't named in any of this topic's own
// subgroups still shows, under a plain "Other" sub-shelf, rather than
// silently vanishing -- unlike Basic Health's own subtopics (which fall
// through to a shared "More" catch-all elsewhere in the category), a
// condition page has no equivalent safety net, so a missed id here would
// otherwise just disappear.
export function applyConditionTopicSubgroups(
  categoryKey: string | undefined,
  // Plain string, not ConditionTopic: Earth Matters and Home Gardening
  // route their own topics through this same function now (2026-08-29), so
  // every category can declare subgroups rather than only condition pages.
  topic: string,
  topicEntries: AnyDigestEntry[],
): { label: string; entries: AnyDigestEntry[] }[] {
  const subgroups = categoryKey ? CONDITION_TOPIC_SUBGROUPS[categoryKey as DigestCategoryKey]?.[topic] : undefined;
  if (!subgroups) return [{ label: topic, entries: sortDigestEntriesLogically(topicEntries) }];
  const idToLabel = new Map<string, string>();
  for (const sub of subgroups) {
    for (const id of sub.ids) idToLabel.set(id, sub.label);
  }
  const byLabel = new Map<string, AnyDigestEntry[]>();
  for (const entry of topicEntries) {
    const label = idToLabel.get(entry.id) ?? 'Other';
    if (!byLabel.has(label)) byLabel.set(label, []);
    byLabel.get(label)!.push(entry);
  }
  const order = [...subgroups.map((sub) => sub.label), 'Other'];
  return order
    .filter((label) => byLabel.has(label))
    .map((label) => ({ label: `${topic}::${label}`, entries: sortDigestEntriesLogically(byLabel.get(label)!) }));
}

// Buckets a condition's own entry list into the real topics above, with
// the "tying together" synthesis entry (if the condition has one) pulled
// out separately rather than folded into any of them -- shaped
// (`{label, entries}[]`) to match exactly what BasicHealthShelves below
// already expects, the shared shelf-row-plus-detail-panel component every
// condition's own topic grouping renders through.
// 2026-08-24, direct request: "there needs to be an association between
// the recipes and the conditions somehow, so that the user can look
// through their specific condition that will then show them meals they
// can eat, depending on the stage of their conditions." A real,
// synthetic "Meals You Can Eat" topic, built from RecipeCard.
// safeForConditions (computed offline against this app's own real
// condition-scoped food-scoring data, see scripts/
// compute_recipe_condition_data.js) -- the one topic on a condition's
// own page whose entries come from a DIFFERENT category (Recipes), not
// that condition's own content array. Deliberately reuses the exact
// same DigestCard/RecipeCardDetail rendering every Recipes-category
// entry already uses (an entry's own real `category` field still reads
// 'recipes', which is honest, not a bug -- a Related-entry chip or any
// other place that reads `entry.category` sees exactly what this really
// is). All 19 tracked conditions get real coverage as of 2026-08-24 --
// Migraine, the one real gap when this topic first shipped the same
// day, was closed a few hours later by a direct follow-up request,
// adding a real Additives/Processing relevance mapping grounded in the
// AIP/migraine research also shipped that day (see
// scripts/add_migraine_condition_relevance.js). A condition with truly
// no relevant sub-criteria at all still contributes nothing here,
// silently and correctly, the same "no real data, no guessed
// placeholder" precedent lib/conditionStageAdvisory.ts's own dispatcher
// already established -- there just isn't one anymore.
// Computed once and cached at module scope, not per-render -- 2026-08-24,
// the same "static bundled content never changes at runtime, so a
// one-time bulk pass beats recomputing it" reasoning lib/db.ts's own
// getSafeFoodIds already established. getEntriesForCategory('recipes')
// itself does a full filter() over every Digest entry, and this whole
// function would otherwise re-run on every render of a condition's own
// page (groupEntriesForLens is called inline in JSX, not memoized),
// exactly the class of bug already found and fixed for
// basicHealthAllGroups/categorySearchGroups on 2026-08-23.
// 2026-08-24, direct correction: "What they can eat is exactly that,
// everything they can eat, at the levels of healing that they need to
// start from and achieve along the way." The original version of this
// bucketed only recipeCard.safeForConditions -- a hard include/exclude
// gate that meant a wide-criteria condition like Hashimoto's (25 real
// relevant sub-criteria) could only ever show near-single-ingredient
// recipes, confirmed directly: 18 of 300, every one a fermented drink,
// zero actual meals. Buckets BOTH halves separately (genuinely clean,
// and flagged-with-a-real-caution), so a flagged recipe is never
// excluded, matching this app's own standing healing-stage rule
// (advisory and reordering only, never gating) instead of contradicting
// it.
//
// 2026-08-25, direct correction to THAT correction: "All of the
// conditions list all 300 meals saying they can eat all of them. That
// cannot be." Correct -- a single flat "cautioned" bucket treated a
// mild, portion-aware flag (Sodium: Moderate) the same as a serious,
// well-documented, never-safe-in-any-amount one (Gluten: High Risk for
// Celiac), which reads exactly like "everything here is fine to eat"
// even for a genuinely dangerous trigger. "cautioned" is now split into
// "yellow" and "red" -- see RecipeCard.conditionCautions' own comment
// (lib/digest/types.ts) for what each severity actually means. See
// mealsYouCanEatForCondition below for how the three are combined and
// labeled.
let recipesByConditionCodeCache: Map<
  string,
  { safe: AnyDigestEntry[]; yellow: AnyDigestEntry[]; red: AnyDigestEntry[] }
> | null = null;
export function recipesByConditionCode(): Map<string, { safe: AnyDigestEntry[]; yellow: AnyDigestEntry[]; red: AnyDigestEntry[] }> {
  if (!recipesByConditionCodeCache) {
    const map = new Map<string, { safe: AnyDigestEntry[]; yellow: AnyDigestEntry[]; red: AnyDigestEntry[] }>();
    for (const entry of getEntriesForCategory('recipes')) {
      if (isProblemFoodEntry(entry)) continue;
      const card = entry.recipeCard;
      if (!card) continue;
      for (const code of card.safeForConditions ?? []) {
        if (!map.has(code)) map.set(code, { safe: [], yellow: [], red: [] });
        map.get(code)!.safe.push(entry);
      }
      for (const [code, caution] of Object.entries(card.conditionCautions ?? {})) {
        if (!map.has(code)) map.set(code, { safe: [], yellow: [], red: [] });
        map.get(code)![caution.severity].push(entry);
      }
    }
    recipesByConditionCodeCache = map;
  }
  return recipesByConditionCodeCache;
}

// 2026-08-24, direct follow-up: "Now factor in their declared healing
// stage too." Builds the exact RecipeConditionNote.condition string a
// stage-specific hit is stored under (see compute_recipe_condition_
// data.js's own stageAdvisoryNotes -- `${conditionLabel}: ${stageLabel}`),
// from the one real, canonical source for both halves
// (CONDITION_STAGING_MODELS, lib/conditionStages.ts) rather than a second
// hand-copied label table. Returns null for a condition with no real
// staging model, or a stage code that model doesn't recognize -- either
// way, nothing to look up, not an error.
export function stageNoteKeyFor(conditionCode: string, stageCode: string): string | null {
  const model = CONDITION_STAGING_MODELS.find((m) => m.conditionCode === conditionCode);
  const stage = model?.stages.find((s) => s.code === stageCode);
  return model && stage ? `${model.conditionLabel}: ${stage.label}` : null;
}

// Whether this recipe carries a real, computed stage-specific advisory
// note for exactly the condition/stage pair given -- reuses the note
// entries already computed into recipeCard.conditionNotes by
// compute_recipe_condition_data.js, not a second parallel check.
export function hasStageNote(entry: AnyDigestEntry, conditionCode: string, stageCode: string): boolean {
  if (isProblemFoodEntry(entry) || !entry.recipeCard) return false;
  const key = stageNoteKeyFor(conditionCode, stageCode);
  return key !== null && entry.recipeCard.conditionNotes.some((note) => note.condition === key);
}

// The one caution actually shown in a recipe's own "A note for this
// condition" box once opened from a specific condition's own page --
// 2026-08-24 direct follow-up: prefers a real, computed stage-specific
// note (richer, tied to exactly the person's own currently-declared
// stage) over the plain per-condition caution, falling back to the plain
// one whenever no stage is declared, the condition has no real staging
// model, or this particular recipe has no stage-specific hit even though
// it does have a generic one. Returns undefined outright when there's no
// active condition context at all (plain Recipes browsing, or any
// non-recipe entry).
export function resolveActiveConditionCaution(
  entry: AnyDigestEntry,
  activeConditionCode?: string,
  activeStageCode?: string,
): string | undefined {
  if (!activeConditionCode || isProblemFoodEntry(entry) || !entry.recipeCard) return undefined;
  if (activeStageCode) {
    const stageKey = stageNoteKeyFor(activeConditionCode, activeStageCode);
    const stageNote = stageKey ? entry.recipeCard.conditionNotes.find((note) => note.condition === stageKey) : undefined;
    if (stageNote) return stageNote.note;
  }
  return entry.recipeCard.conditionCautions?.[activeConditionCode]?.note;
}

// 2026-08-25, direct correction: "All of the conditions list all 300
// meals saying they can eat all of them. That cannot be." The one real
// signal that actually answers "can I eat this" for a specific
// condition -- 'green' (genuinely clean), 'yellow' (a milder, worth-
// knowing flag), 'red' (a serious, well-documented concern), or
// undefined when there's no active condition context at all (plain
// Recipes browsing). Drives both the shelf card's own color dot and the
// detail view's own severity-labeled caution box, so the difference
// between "fine" and "approach with real caution" is visible before a
// person even taps a card open, not just buried in the caption text.
export function resolveActiveConditionSeverity(
  entry: AnyDigestEntry,
  activeConditionCode?: string,
): 'green' | 'yellow' | 'red' | undefined {
  if (!activeConditionCode || isProblemFoodEntry(entry) || !entry.recipeCard) return undefined;
  if (entry.recipeCard.safeForConditions?.includes(activeConditionCode)) return 'green';
  return entry.recipeCard.conditionCautions?.[activeConditionCode]?.severity;
}

// Orders one severity tier (yellow or red) the same way regardless of
// which tier it is: no declared stage leaves it in plain logical order;
// a declared stage pushes any recipe with a real, stage-specific
// advisory hit for the CURRENT stage to the end of the tier, so
// "further along, less currently relevant" concerns sort behind "worth
// a look right now" ones -- see hasStageNote's own comment. Shared by
// mealsYouCanEatForCondition below so the yellow and red tiers don't
// each carry their own copy of this same ordering rule.
export function orderCautionTier(entries: AnyDigestEntry[], conditionCode: string, declaredStageCode?: string): AnyDigestEntry[] {
  if (!declaredStageCode) return sortDigestEntriesLogically(entries);
  const lessUrgent = entries.filter((entry) => !hasStageNote(entry, conditionCode, declaredStageCode));
  const stageFlagged = entries.filter((entry) => hasStageNote(entry, conditionCode, declaredStageCode));
  return [...sortDigestEntriesLogically(lessUrgent), ...sortDigestEntriesLogically(stageFlagged)];
}

// 2026-08-25, direct request: "if I select vegan from Profile, and I
// select that my condition is Hashimoto's, and then I go into Digest >
// Hashimoto's Disease > Meals You Can Eat, I should only see recipes
// that comply with both vegan and Hashimoto's. The same applies for
// every other dietary preference and condition." "Meals You Can Eat"
// already silently applies a declared healing stage (see
// declaredStageCode below); it never applied a declared diet preference
// at all, despite RecipeCard.dietTags already existing for every one of
// the 300 curated recipes and Profile's own "Diet Preferences" card
// already collecting exactly this.
//
// recipeMatchesDietPreference/recipeMatchesAllDietPreferences moved to
// lib/digest/types.ts, 2026-08-25, once the new Daily Meal Plan
// generator (lib/dailyMealPlan.ts) needed the exact same logic -- one
// shared home for this vocabulary's own matching rules instead of a
// second, duplicated copy.

// The real, full "Meals You Can Eat" list for a condition: every recipe
// with real per-condition data, genuinely clean ones first (so the
// least-cautioned options still lead), then every yellow-severity
// (milder, worth-knowing) recipe, then every red-severity (serious,
// well-documented concern) recipe last -- 2026-08-25, direct correction:
// "All of the conditions list all 300 meals saying they can eat all of
// them. That cannot be." A flat, undifferentiated "cautioned" group
// used to treat a mild sodium note and an absolute, never-safe gluten
// hit for Celiac as interchangeable; keeping them as two real, separate,
// distinctly labeled and colored groups (see groupConditionEntries and
// RecipeCardDetail) is what actually answers "can I eat this," not just
// reordering within one bucket.
//
// 2026-08-24, direct follow-up: declaredStageCode (the person's own
// Profile-declared stage for this condition, when they have one) further
// orders EACH of the yellow/red tiers the same way (see
// orderCautionTier). A recipe already can't be both genuinely clean AND
// carry a stage note (every stage-advisory check is itself one of that
// condition's own relevant sub-criteria, so tripping one always trips
// the generic flag too, confirmed by reading both rule sets side by
// side) -- this ordering only ever matters within the yellow/red tiers,
// never against the clean one.
//
// 2026-08-25, direct follow-up: dietPreferences (Profile's own "Diet
// Preferences" card) filters all three tiers down to only what's
// actually eatable under every declared preference at once, applied
// before sorting so the tier ordering above is computed against the
// same, already-narrowed set a person will actually see.
export function mealsYouCanEatForCondition(conditionCode: string, declaredStageCode?: string, dietPreferences: RecipeDietTag[] = []): AnyDigestEntry[] {
  const bucket = recipesByConditionCode().get(conditionCode);
  if (!bucket) return [];
  const matchesDiet = (entry: AnyDigestEntry) => recipeMatchesAllDietPreferences(entry, dietPreferences);
  return [
    ...sortDigestEntriesLogically(bucket.safe.filter(matchesDiet)),
    ...orderCautionTier(bucket.yellow.filter(matchesDiet), conditionCode, declaredStageCode),
    ...orderCautionTier(bucket.red.filter(matchesDiet), conditionCode, declaredStageCode),
  ];
}

export function groupConditionEntries(
  entries: AnyDigestEntry[],
  conditionCode?: string,
  declaredStageCode?: string,
  dietPreferences: RecipeDietTag[] = [],
): {
  topics: { label: string; entries: AnyDigestEntry[] }[];
  tyingTogether: AnyDigestEntry | null;
} {
  const tyingTogether = entries.find(isTyingTogetherEntry) ?? null;
  const rest = entries.filter((entry) => !isTyingTogetherEntry(entry));
  const buckets = new Map<ConditionTopic, AnyDigestEntry[]>();
  for (const entry of rest) {
    const topic = classifyConditionTopic(entry);
    if (!buckets.has(topic)) buckets.set(topic, []);
    buckets.get(topic)!.push(entry);
  }
  // 2026-08-25, direct report: "The meals you can eat should be separated
  // into groups specific to what they are... related to the Food builders
  // that they would open into." Sub-grouped by the exact same
  // classifyRecipesTopic/RECIPES_TOPIC_ORDER the plain Recipes category
  // already uses (Sides, Salads & Bowls, Soups, and so on), '::'-joined
  // under the "Meals You Can Eat" label the same way Essential Nutrients'
  // own subtopics already are -- shelfHeadingLabel and the topic-menu
  // collapsing logic at this screen's own render call site already handle
  // that prefix generically, no changes needed to either. Order within
  // each sub-shelf is preserved exactly as mealsYouCanEatForCondition
  // already computed it (clean-first, then cautioned), since entries are
  // bucketed here in the same order they arrive in, not independently
  // re-sorted.
  const mealsYouCanEatSubTopics: { label: string; entries: AnyDigestEntry[] }[] = [];
  if (conditionCode) {
    const mealsYouCanEat = mealsYouCanEatForCondition(conditionCode, declaredStageCode, dietPreferences);
    const byBuilderType = new Map<RecipeTopic, AnyDigestEntry[]>();
    for (const entry of mealsYouCanEat) {
      const subTopic = classifyRecipesTopic(entry);
      if (!byBuilderType.has(subTopic)) byBuilderType.set(subTopic, []);
      byBuilderType.get(subTopic)!.push(entry);
    }
    for (const subTopic of RECIPES_TOPIC_ORDER) {
      const subEntries = byBuilderType.get(subTopic);
      if (subEntries && subEntries.length > 0) {
        mealsYouCanEatSubTopics.push({ label: `Meals You Can Eat::${subTopic}`, entries: subEntries });
      }
    }
  }
  // 2026-08-25: entries[0]?.category (not the conditionCode parameter,
  // whose own casing convention differs, snake_case DB codes versus the
  // camelCase DigestCategoryKey CONDITION_TOPIC_SUBGROUPS is keyed by) is
  // the one reliable source for which condition this whole entries array
  // actually belongs to, already the same value on every entry passed in.
  const categoryKey = entries[0]?.category;
  const topics = CONDITION_TOPIC_ORDER.flatMap((topic) => {
    if (topic === 'Meals You Can Eat') return mealsYouCanEatSubTopics;
    const topicEntries = buckets.get(topic) ?? [];
    if (topicEntries.length === 0) return [];
    return applyConditionTopicSubgroups(categoryKey, topic, topicEntries);
  }).filter((group) => group.entries.length > 0);
  return { topics, tyingTogether };
}

// Recipes needs its own real, dedicated classifier too, 2026-08-14 -- a
// direct report right after the category shipped: "the current sort seems
// to be based on the condition categories," since every RECIPES_ENTRIES
// row was falling through classifyTopicForCategory's own default branch
// straight into classifyConditionTopic (the disease-oriented one, meant for
// Core Science/Self-Advocacy/Whole-Body Effects, none of which mean
// anything for a recipe). Unlike Earth Matters/Home Gardening, this one
// doesn't need a keyword net at all -- every real recipe entry already
// carries a genuine, structured `linkedBuilderType` field (see recipes.ts's
// own header comment: it's what lets DigestCard's "Build This Recipe"
// button navigate into the right builder), so classification is a direct,
// reliable field lookup rather than an inferred guess from title text.
export type RecipeTopic =
  | 'Sides'
  | 'Salads & Bowls'
  | 'Smoothies'
  | 'Fermentation'
  | 'Beverages'
  | 'Snacks'
  | 'Baked Goods'
  | 'Soups'
  | 'Sauces'
  | 'Handhelds'
  | 'Desserts'
  | 'Other Recipes';

// Same real order as Food's own FOOD_LENSES builder list (app/(tabs)/
// food.tsx), minus Meal Builder itself -- a curated recipe is always one of
// the ten (soon eleven, once Dessert Builder exists) direct-ingredient
// builders' own saved output, never an assembled meal. "Other Recipes" is a
// real, dynamic safety net for any future recipe entry that somehow arrives
// with no linkedBuilderType at all, not a bucket any of today's 44 real
// entries ever lands in.
// 2026-08-24, direct request: recipes "grouped so they can be
// identified" by real diet compatibility, not just badged individually --
// this is the actual grouping/filter control, sitting above the Recipes
// topic menu and every shelf underneath it. 'All Diets' is the plain
// "no filter" option, not a real RecipeDietTag itself. Derived from the
// shared RECIPE_DIET_TAGS list (lib/digest/types.ts) rather than a second
// hand-maintained copy of the same vocabulary -- Profile's own diet
// preference picker draws from the same list.
export const RECIPE_DIET_FILTER_OPTIONS: string[] = ['All Diets', ...RECIPE_DIET_TAGS];

export const RECIPES_TOPIC_ORDER: RecipeTopic[] = [
  'Sides',
  'Salads & Bowls',
  'Smoothies',
  'Fermentation',
  'Beverages',
  'Snacks',
  'Baked Goods',
  'Soups',
  'Sauces',
  'Handhelds',
  'Desserts',
  'Other Recipes',
];

export function classifyRecipesTopic(entry: AnyDigestEntry): RecipeTopic {
  const builderType = isProblemFoodEntry(entry) ? undefined : entry.linkedBuilderType;
  switch (builderType) {
    case 'side':
      return 'Sides';
    case 'salad':
      return 'Salads & Bowls';
    case 'smoothie':
      return 'Smoothies';
    case 'fermentation':
      return 'Fermentation';
    case 'beverage':
      return 'Beverages';
    case 'snack':
      return 'Snacks';
    case 'bakedGoods':
      return 'Baked Goods';
    case 'soup':
      return 'Soups';
    case 'sauce':
      return 'Sauces';
    case 'handheld':
      return 'Handhelds';
    // 'dessert' isn't a real BuilderFavoriteItemType value yet as of this
    // comment, but a case label isn't restricted to the switched value's
    // own type -- this branch is inert (never matched) until Dessert
    // Builder's own curated recipes exist, then starts working with zero
    // further changes needed here.
    case 'dessert':
      return 'Desserts';
    default:
      return 'Other Recipes';
  }
}
