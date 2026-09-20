// How the Digest's non-condition categories group into topics: Basic
// Health's prefix tree, the id-substring classifiers for Earth Matters and
// Home Gardening, and the shared groupEntriesForLens dispatcher. Moved out
// of app/(tabs)/purple-digest.tsx on 2026-09-19, when that screen was
// rebuilt on fold bands (one band per topic, subgroups inside, entries
// opening in place, the shape Conditions took in Life the same day) and
// components/DigestCategorySection.tsx needed the same grouping. The
// comments below are the history that came with the code; where one names
// a renderer (BasicHealthShelves, the topic menu, groupRefs) it is
// describing the shelf screen this replaced, and the data shape it
// documents is unchanged.
import { DIGEST_KEY_TO_CONDITION_CODE } from '../conditionCodeMap';
import {
  applyConditionTopicSubgroups,
  classifyConditionTopic,
  classifyRecipesTopic,
  groupConditionEntries,
  isTyingTogetherEntry,
  RECIPES_TOPIC_ORDER,
  sortDigestEntriesLogically,
  type RecipeTopic,
} from './conditionGrouping';
import type { AnyDigestEntry, DigestCategoryKey, RecipeDietTag } from './index';

export type TopicGroup = { label: string; entries: AnyDigestEntry[] };
export type GroupedLensEntries = { topics: TopicGroup[]; tyingTogether: AnyDigestEntry | null };

// Every band, subgroup and row on the Digest and Conditions pages is keyed
// by its label; this is the key the "Putting It Together" band uses.
export const TYING_TOGETHER_GROUP_KEY = '__tying-together__';

// Basic Health's own real, 2-level TREE, 2026-08-08 -- replacing the
// earlier flat, 31-group, all-shown-at-once shelf list (a real, direct
// correction after that flat list itself grew too large to be genuinely
// scannable): "a combination of tree style and categorized topic cards in
// related groups... moving strictly from broad categories down to highly
// specific, bite-sized pieces of information... all of the deep dive into
// macro, micro, acid, and hormone related nutrients should be one of the
// topics to dive into." That's exactly this structure: a real, named
// "Essential Nutrients" parent topic, containing every one of the 22
// individual nutrient shelves the old flat list used to show side by side
// as its own real, drill-down-able subtopics, alongside 9 other real
// topics that don't have a natural further subdivision and stay one level
// deep. Still built from each entry's own id prefix (the same real,
// already-established convention the old flat list already used) -- not a
// new field added to every entry, the same reasoning that design choice
// already carried.
export type BasicHealthSubtopic = { label: string; prefixes: string[] };
// 2026-08-23: `description` added, direct report that drilling into a
// subgroup (Essential Nutrients named directly) left its own header with
// nothing explaining what that subgroup actually covers or how it fits
// into Basic Health as a whole, once the generic "Food, vitamins,
// minerals..." Basic Health description stopped showing there. One short,
// specific line per topic, not a repeat of that shared blurb.
export type BasicHealthTopic = {
  label: string;
  description: string;
  prefixes?: string[];
  subtopics?: BasicHealthSubtopic[];
  // True for the two topics whose entries are each about one named
  // condition, or about autism, ADHD or dyslexia. They sit last, under
  // one heading of their own (BASIC_HEALTH_CONDITION_SPECIFIC_HEADING),
  // so the general run of Health Literacy is not mixed with them.
  conditionSpecific?: true;
};

export const BASIC_HEALTH_TOPICS: BasicHealthTopic[] = [
  {
    label: 'Essential Nutrients',
    description:
      'The vitamins, minerals, macronutrients, and hormones your body needs to function, from magnesium and vitamin D to protein and dietary fat. Each entry below covers what it does, how much you need, and what happens when you get too little or too much, the foundation any deeper look at basic health starts from.',
    subtopics: [
      { label: 'Magnesium', prefixes: ['magnesium-'] },
      { label: 'Vitamin D', prefixes: ['vitamind-'] },
      { label: 'Iron', prefixes: ['iron-'] },
      { label: 'Zinc', prefixes: ['zinc-'] },
      { label: 'Vitamin B12', prefixes: ['b12-'] },
      { label: 'Folate', prefixes: ['folate-'] },
      { label: 'Calcium', prefixes: ['calcium-'] },
      { label: 'Potassium', prefixes: ['potassium-'] },
      { label: 'Iodine (Deep-Dive)', prefixes: ['iodine-'] },
      { label: 'Vitamin C', prefixes: ['vitaminc-'] },
      { label: 'Vitamin A', prefixes: ['vitamina-'] },
      { label: 'Vitamin E', prefixes: ['vitamine-'] },
      { label: 'Vitamin K', prefixes: ['vitamink-'] },
      { label: 'Omega-3 & Omega-6', prefixes: ['omega'] },
      { label: 'Protein & Amino Acids', prefixes: ['protein-'] },
      {
        label: 'B-Vitamins (B1, B2, B3, B5, B6, B7)',
        prefixes: ['thiamine-', 'riboflavin-', 'niacin-', 'biotin-', 'pantothenate-', 'b6-'],
      },
      { label: 'Chromium, Manganese & Copper', prefixes: ['chromium-', 'manganese-', 'copper-'] },
      { label: 'Choline', prefixes: ['choline-'] },
      { label: 'Carbohydrates & Fiber', prefixes: ['carbfiber-'] },
      { label: 'Water & Hydration', prefixes: ['water-'] },
      { label: 'Dietary Fat', prefixes: ['dietfat-'] },
      // A real, corrected prefix list -- 2026-08-08, caught by validating
      // this whole tree against every real Basic Health entry id before
      // shipping (the same throwaway-script discipline already established
      // for the pillar classifier above): the old flat list's own single
      // `'hormone'` prefix never actually matched any of this topic's real
      // entries, since `lib/digest/hormones.ts` names most of its own ids
      // after the specific hormone itself (`insulin-`, `cortisol-`,
      // `estrogen-`, etc.), not a shared "hormone-" prefix -- a real,
      // pre-existing gap this validation pass surfaced and fixed, not
      // something this restructure introduced.
      // 2026-08-23: 'adiponectin-' and 'lipodystrophy-' added -- these two
      // entries (lib/digest/hormones.ts) were part of the same 2026-08-21
      // fat-hormone research batch as every 'leptin-' entry already listed
      // here, but never got their own prefix, so they fell through to the
      // dynamic "More" catch-all. Found via a direct audit request: "In
      // Basic Health there are 8 entries in the More section... how about
      // now?"
      {
        label: 'Hormones',
        prefixes: [
          'hormone-',
          'hormones-',
          'insulin-',
          'cortisol-',
          'thyroid-hormones-',
          'leptin-',
          'estrogen-',
          'testosterone-',
          'adiponectin-',
          'lipodystrophy-',
        ],
      },
      // 2026-08-23, same audit: lib/digest/bodyFatBiology.ts's own 4
      // entries (body-weight heritability, constrained total energy
      // expenditure, the Hadza population studies, visceral-vs-subcutaneous
      // fat distribution) are the other half of that same research batch,
      // broader body-fat population biology rather than one specific
      // hormone, so they get their own subtopic alongside Hormones instead
      // of being folded into it.
      { label: 'Body Fat Biology', prefixes: ['bodyfat-'] },
    ],
  },
  // 2026-08-13, direct request: "I don't see much about each individual
  // organ, how they work together and interact with each other, and how
  // being deficient or toxic with any specific macronutrient,
  // micronutrient, or amino acids, or hormone, how does your diet relate
  // to your bones and teeth, and lymphatic system, eyes, brain, your skin,
  // your hair, and everything else about a person." The missing
  // organ/system-centered layer, deliberately placed right after Essential
  // Nutrients above (which already carries deep, nutrient-centered
  // deficiency/toxicity coverage this new topic cross-links to rather than
  // repeats). See lib/digest/bodySystems.ts's own header comment.
  // 2026-08-25, direct report: "There should be groups of information that
  // is specific to one diet or eating style or another, rather than one
  // continuous scrolling left to right list of them. This needs to be
  // followed throughout the digest." This topic's own 20 entries (every
  // organ/system at once, no further division) were exactly that same
  // problem in miniature -- given real subtopics here, one per organ or
  // body system, the same way Essential Nutrients already subdivides by
  // nutrient. body-systems-overview and body-tying-together don't belong
  // to any one organ, so they get their own small "Overview & Big Picture"
  // subtopic rather than being force-fit into one, or silently falling
  // through to Basic Health's "More" catch-all (a topic with real
  // subtopics has no undifferentiated top-level bucket of its own -- see
  // basicHealthTopicPathForEntryId above).
  {
    label: 'How Your Body Works: Organs & Systems',
    description:
      "How your organs and body systems work, and how food and nutrient levels affect each one, independent of any specific condition. The foundation every condition-specific finding in this app builds on.",
    subtopics: [
      { label: 'Overview & Big Picture', prefixes: ['body-systems-overview', 'body-tying-together'] },
      { label: 'Endocrine System', prefixes: ['body-adrenal-glands-structure-function', 'body-endocrine-crosstalk'] },
      { label: 'Bones, Teeth & Skeleton', prefixes: ['body-bones-teeth-skeleton'] },
      { label: 'Brain & Nervous System', prefixes: ['body-brain-nervous-system', 'body-brain-processed-meat-dementia-uk-biobank'] },
      { label: 'Cardiovascular System', prefixes: ['body-cardiovascular-electrolytes'] },
      { label: 'Digestive System', prefixes: ['body-digestive-organs'] },
      { label: 'Skin & Hair', prefixes: ['body-skin-integumentary', 'body-hair-growth-cycle'] },
      { label: 'Eyes & Vision', prefixes: ['body-eyes-vision'] },
      { label: 'Immune System', prefixes: ['body-immune-system-nutrition'] },
      { label: 'Kidneys & Liver', prefixes: ['body-kidneys-liver-filtration', 'body-kidney-stones-'] },
      { label: 'Lymphatic System', prefixes: ['body-lymphatic-system'] },
      { label: 'Muscular System', prefixes: ['body-muscular-system'] },
      { label: 'Reproductive System', prefixes: ['body-reproductive-egg-supply-vs-sperm-production', 'body-reproductive-zinc-fertility'] },
      { label: 'Respiratory System', prefixes: ['body-respiratory-gas-exchange', 'body-respiratory-magnesium-asthma'] },
    ],
  },
  // 2026-08-13, direct request: "Neurogenesis needs to be represented in
  // the Basic Health section." A real, general, condition-agnostic
  // topic -- see lib/digest/neurogenesis.ts's own header comment. Where
  // a real, specific condition-level connection exists instead, it lives
  // as its own entry in that condition's own file (Hashimoto's, Type 2
  // Diabetes, Cardiovascular Disease, Multiple Sclerosis, IBD), per the
  // same request's own direct follow-up.
  {
    label: 'Neurogenesis',
    description: 'How your brain grows new neurons throughout life, and which diet, exercise, and lifestyle factors support or suppress that process.',
    prefixes: ['neurogenesis-'],
  },
  {
    label: 'Glossary',
    description: 'Plain definitions for medical, nutrition, and lab terminology used throughout this app.',
    prefixes: ['glossary-'],
  },
  // 2026-08-09, direct request: "information about portions, and
  // recommended daily allowances and minimum amounts of anything." See
  // lib/digest/portionsAndRDAs.ts's own header comment -- every number
  // reused directly from this app's own bundled DRI reference table.
  {
    label: 'Portions & Recommended Amounts',
    description: "How much of each nutrient you need, and what a serving size actually looks like, drawn from this app's bundled dietary reference intake data.",
    prefixes: ['portion-'],
  },
  // 2026-08-09, direct request: "how to choose the right kinds of
  // products... so they aren't fooled and purchase the wrong things." See
  // lib/digest/choosingQualityProducts.ts's own header comment.
  {
    label: 'Is It What It Claims to Be?',
    description: "How to tell whether a product actually is what it claims to be, so a misleading label doesn't fool you into buying the wrong thing.",
    prefixes: ['quality-'],
  },
  // 2026-08-09, same day, direct continuation of the same request: a real,
  // deliberate companion to "Choosing the Real Thing" -- that one covers
  // whether a product IS what it claims; this covers how to actually read
  // the label once you're holding a genuine one. See
  // lib/digest/readingLabels.ts's own header comment.
  {
    label: 'Reading Labels & Ingredient Lists',
    description: 'How to read a nutrition label and ingredient list once you actually have a product in hand, from serving sizes to less familiar names hiding a familiar ingredient.',
    prefixes: ['label-'],
  },
  // 2026-08-09, same day: a real, systematized companion to this app's own
  // per-condition medication research -- which common medication CLASSES
  // measurably lower which nutrients over sustained use, regardless of
  // condition. See lib/digest/medicationDepletion.ts's own header comment.
  {
    label: 'Medications & Nutrient Depletion',
    description: "Which common medication classes lower which nutrients over sustained use, regardless of the condition they're prescribed for.",
    prefixes: ['depletion-'],
  },
  // 2026-08-09, same day, continuing directly off the same "what's missing"
  // conversation, in the same order named there: pediatric nutrition, a
  // real gap confirmed directly against the bundled reference database's
  // own dietary_reference_intakes table (zero rows under age 19). See
  // lib/digest/pediatricNutrition.ts's own header comment.
  {
    label: 'Pediatric Nutrition',
    description: 'How nutrient needs differ for children, since most recommended-intake data is built around adults.',
    prefixes: ['pediatric-'],
  },
  // A real, general Sleep deep-dive -- this Digest only ever touched sleep
  // incidentally before (lifestyle-sleep-circadian, lifestyle-sleep-apnea,
  // and several condition-specific entries). See
  // lib/digest/sleepHealth.ts's own header comment.
  {
    label: 'Sleep & Health',
    description: 'How sleep affects your metabolism, hormones, and long-term health, and how diet affects your sleep in turn.',
    prefixes: ['sleep-'],
  },
  // 2026-08-24, phase 3 of a larger request: "research the chrononutrition
  // way of eating and provide as many entries as possible in Basic
  // Health, and for each of the conditions as can be found." See
  // lib/digest/chrononutrition.ts's own header comment. Condition-specific
  // applications live in each of the 19 conditions' own files, cross-linked
  // back here rather than duplicated.
  {
    label: 'Chrononutrition & Meal Timing',
    description: 'The science of aligning when you eat with your circadian biology, and what the evidence does and does not support.',
    prefixes: ['chrono-'],
  },
  // A real, general Mental Health deep-dive, the same "scattered across
  // conditions, never its own topic" gap as Sleep above. See
  // lib/digest/mentalHealth.ts's own header comment.
  // 2026-08-25: real subtopics, part of the same-day sweep named at "How
  // Your Body Works: Organs & Systems," above.
  {
    label: 'Mental Health & Food',
    description: 'How diet and specific nutrients affect mood, cognition, and mental health.',
    subtopics: [
      { label: 'Overview & Framing', prefixes: ['mentalhealth-overview', 'mentalhealth-tying-together'] },
      // The ADHD entries that used to share this fold with OCD moved to
      // "Autism, ADHD & Dyslexia" on 2026-09-19, so everything written
      // about ADHD is in one place. OCD stays: it is a mental health
      // condition, not one of the three listed in Profile.
      { label: 'OCD', prefixes: ['mentalhealth-ocd-gut-brain-inflammation', 'mentalhealth-ocd-ketogenic-diet'] },
      { label: 'Gut-Brain Mechanisms', prefixes: ['mentalhealth-gut-scfa-mood-mechanism', 'mentalhealth-inflammation-link', 'mentalhealth-glycemic-instability-mood'] },
      { label: 'Nutrients & Mood', prefixes: ['mentalhealth-b12-folate-mood', 'mentalhealth-magnesium-zinc-mood', 'mentalhealth-omega3-epa-dha', 'mentalhealth-vitamin-d-mixed-evidence'] },
      { label: 'Diet Pattern & Lifestyle Evidence', prefixes: ['mentalhealth-smiles-trial', 'mentalhealth-ultraprocessed-food-risk', 'mentalhealth-exercise-honest-evidence'] },
      { label: 'When to Seek Help', prefixes: ['mentalhealth-when-to-seek-help'] },
    ],
  },
  // 2026-08-09, direct request: "an honest medical science evidence based
  // perspective on the popular types of diets out there." A real, distinct
  // topic from "Prevention & Lifestyle by Condition" above -- that one is
  // scoped per-CONDITION (what to eat if you have Hashimoto's, RA, etc.);
  // this one is scoped per-DIET-PHILOSOPHY, condition-agnostic, and closes
  // with a real, honest entry on how this app helps track any of them.
  // See lib/digest/popularDiets.ts's own header comment.
  // 2026-08-23: 'pbn-' added -- lib/digest/plantBasedNutrition.ts's own 2
  // entries (the Ornish Lifestyle Heart Trial, Esselstyn's long-term
  // cohort) are trial evidence for one specific dietary philosophy, the
  // same shape every other entry in this topic already covers, but never
  // got a prefix of their own and fell through to the dynamic "More"
  // catch-all. Found via a direct audit request: "In Basic Health there
  // are 8 entries in the More section... how about now?"
  // 2026-08-25, direct report after asking where diets are compared: "please
  // separate them into their own sections... groups of information that is
  // specific to one diet or eating style or another, rather than one
  // continuous scrolling left to right list of them." All 19 entries here
  // (17 diet- plus 2 pbn-, the Ornish/Esselstyn plant-based heart-disease
  // trials) used to render as one flat shelf. Grouped by what actually
  // distinguishes them nutritionally, not alphabetically: how much animal
  // food is included, a traditional whole-food pattern, what's eliminated,
  // when you eat rather than what, a specific macronutrient ratio, food
  // quality independent of macros, and this app's own tracking philosophy.
  // The two pbn- trial entries join the animal-food-spectrum group, since
  // both are evidence specifically for the plant-based end of it.
  {
    label: 'Popular Diets & Eating Styles',
    description: 'An evidence-based look at popular diets, keto, paleo, intermittent fasting, and more, organized by philosophy rather than by condition.',
    subtopics: [
      // 2026-08-25, direct follow-up after asking where diets are compared
      // nutritionally: "build the side by side comparison of the
      // different eating styles based on evidence and without assumptions
      // being made." Its own subgroup, alphabetizing to lead the menu
      // (subtopic order is sorted by display label at render time, not
      // declared array order, see basicHealthMenuGroups' own comment).
      { label: 'Comparing Them Side by Side', prefixes: ['diet-headtohead-network-metaanalysis', 'diet-sidebyside-comparison'] },
      {
        label: 'How Much Animal Food: Vegan to Carnivore',
        prefixes: ['diet-vegan', 'diet-vegetarian', 'diet-plant-based-flexitarian', 'diet-omnivore', 'diet-carnivore', 'pbn-'],
      },
      { label: 'Traditional & Whole-Food Patterns', prefixes: ['diet-mediterranean', 'diet-paleo', 'diet-aip'] },
      { label: 'Free-From & Elimination Diets', prefixes: ['diet-gluten-free', 'diet-dairy-free'] },
      { label: 'Timing, Not Composition', prefixes: ['diet-intermittent-fasting'] },
      { label: 'Macronutrient-Ratio Focused', prefixes: ['diet-keto', 'diet-high-protein', 'diet-fibermaxxing'] },
      { label: 'Food Quality, Not Macros', prefixes: ['diet-anti-processed', 'diet-gut-friendly'] },
      { label: 'How This App Tracks Any of Them', prefixes: ['diet-app-agnostic-tracking'] },
    ],
  },
  {
    label: 'Problem Foods & Swaps',
    description: 'Foods worth watching for common problems, and practical swaps for each one.',
    prefixes: ['problem-'],
  },
  // 2026-08-25: real subtopics, part of the same-day sweep named at "How
  // Your Body Works: Organs & Systems," above.
  {
    label: 'Food Additives',
    description: 'What common food additives and preservatives actually do, and what the evidence says about their effects.',
    subtopics: [
      { label: 'Sweeteners', prefixes: ['additive-aspartame', 'additive-sucralose', 'additive-hfcs', 'additive-sugar-umbrella-review-45-outcomes'] },
      { label: 'Preservatives', prefixes: ['additive-bha-bht', 'additive-nitrates-nitrites', 'additive-potassium-bromate', 'additive-sulfites', 'additive-phosphates'] },
      { label: 'Emulsifiers, Gums & Texture', prefixes: ['additive-carrageenan', 'additive-emulsifiers-cmc-polysorbate80', 'additive-xanthan-guar-gum'] },
      { label: 'Flavor, Color & Dough Agents', prefixes: ['additive-msg', 'additive-synthetic-dyes', 'additive-azodicarbonamide'] },
      { label: 'Ultra-Processing as a Whole', prefixes: ['additive-upf-convincing-evidence-class-i', 'additive-processed-meat-colorectal-cancer-uk-biobank', 'additive-trans-fats', 'additive-tying-together'] },
    ],
  },
  {
    label: 'Nutrient Interactions',
    description: "Which nutrients help or block each other's absorption, and how to time meals and supplements to work with your body instead of against it.",
    prefixes: ['interaction-'],
  },
  // 2026-08-25: real subtopics, matching this topic's own description
  // ("organized by the specific bacterial strains and cultures") for real
  // rather than only in name -- part of the same-day sweep named at "How
  // Your Body Works: Organs & Systems," above.
  {
    label: 'Fermented Foods',
    description: 'The health benefits of fermented foods, organized by the specific bacterial strains and cultures behind them.',
    subtopics: [
      { label: 'Lactobacillus Species', prefixes: ['fermented-lactobacillus-acidophilus', 'fermented-lactobacillus-plantarum'] },
      { label: 'Bifidobacterium & Streptococcus', prefixes: ['fermented-bifidobacterium', 'fermented-streptococcus-thermophilus'] },
      { label: 'Yeasts & Wild Cultures', prefixes: ['fermented-saccharomyces-boulardii', 'fermented-leuconostoc-mesenteroides', 'fermented-sauerkraut-succession'] },
      { label: 'Kefir & Kombucha', prefixes: ['fermented-milk-kefir', 'fermented-water-kefir', 'fermented-kombucha'] },
      { label: 'Other Ferments', prefixes: ['fermented-beet-kvass', 'fermented-fruit-brine'] },
      { label: 'Practical Basics', prefixes: ['fermented-cfu-dosing', 'fermented-sourcing-starters', 'fermented-filtered-water', 'fermented-tying-together'] },
    ],
  },
  // 2026-08-09, direct request: "talk about the different ways of making
  // fermentations for drinks and foods... how they are generally made and
  // where to look for more information." A real, deliberate companion to
  // "Fermented Foods" above, not a merge into it -- see
  // lib/digest/fermentationMethods.ts's own header comment for why the two
  // stay separate (organized by strain vs. organized by method).
  {
    label: 'Fermentation Methods',
    description: 'How different fermentation methods work, and where to learn more about making your own.',
    prefixes: ['fermentmethod-'],
  },
  // 2026-08-09, direct request: "a group that has information about every
  // fruit and vegetable and their health benefits and types of problems...
  // This should also include nuts and seeds." See
  // lib/digest/produceProfiles.ts's own header comment, including the real,
  // new hide-sync mechanism this topic's own entries use (see
  // basicHealthEntriesForPrefixes below for where that filter is applied).
  // 2026-08-25: real subtopics, part of the same-day sweep named at "How
  // Your Body Works: Organs & Systems," above. produce-chickpeas (a legume,
  // not a fruit, vegetable, nut, or seed on its own) joins the vegetables
  // group rather than getting a one-entry subtopic of its own, matching how
  // this topic's own everyday grocery-aisle framing already treats legumes.
  {
    label: 'Fruits, Vegetables, Nuts & Seeds',
    description: 'The health benefits, and things worth knowing, about specific fruits, vegetables, nuts, and seeds.',
    subtopics: [
      { label: 'Overview', prefixes: ['produce-overview', 'produce-closing'] },
      { label: 'Fruits', prefixes: ['produce-apple', 'produce-avocado', 'produce-blueberry', 'produce-citrus', 'produce-tomato'] },
      {
        label: 'Vegetables & Legumes',
        prefixes: [
          'produce-cruciferous',
          'produce-broccoli-sprouts-sulforaphane',
          'produce-garlic-onion',
          'produce-leafy-greens',
          'produce-sweet-potato',
          'produce-mustard-powder-myrosinase-restoration',
          'produce-chickpeas',
        ],
      },
      { label: 'Nuts & Seeds', prefixes: ['produce-almonds', 'produce-chia-seeds', 'produce-flaxseed', 'produce-walnut'] },
    ],
  },
  {
    label: 'Lifestyle & Environment',
    description: 'How everyday lifestyle and environmental factors, beyond diet alone, affect your health.',
    prefixes: ['lifestyle-'],
  },
  {
    // 2026-09-04: chiropractic care, acupuncture, and deep tissue massage
    // covered on their own terms, separate from lib/digest/
    // complementaryTherapies.ts, which asks the different question of
    // whether they help Hashimoto's specifically. Nine entries, so one
    // flat shelf is still the right shape here; if this grows past
    // roughly a dozen it needs subtopics, per the standing rule.
    label: 'Hands-On & Complementary Therapies',
    description:
      'What the research actually shows for chiropractic care, acupuncture, and deep tissue massage, including where it shows nothing at all. Also what can go wrong, what to tell a practitioner before a session, and how to work out whether any of it is helping you specifically rather than helping people on average.',
    prefixes: ['handson-'],
  },
  {
    label: 'Mitochondria & Metabolism',
    description: 'How your cells produce energy, and how diet and lifestyle affect that process.',
    prefixes: ['mito-'],
  },
  {
    label: 'Self Advocacy',
    description: 'How to advocate for yourself with doctors and the healthcare system, and get the care and answers you need.',
    prefixes: ['advocacy-'],
  },
  {
    label: 'Food Industry & History',
    description: "How the food industry and food history shape what's on your plate today.",
    prefixes: ['foodhistory-'],
  },
  // 2026-09-17, direct instruction: "I want as much as possible to be
  // provided about this in Basic Health." Autism, ADHD and dyslexia are
  // listed in Profile the way food allergies are, never tracked as
  // conditions, so everything written about them lives here where anybody
  // can read it without declaring anything. See
  // lib/digest/neurodivergence.ts for the writing and for the line it
  // holds: nutrition supports a person, it does not treat these three.
  // 2026-09-19: the three ADHD entries from "Mental Health & Food" joined
  // this topic, so everything about ADHD is read in one place, and the
  // topic moved to the end of Health Literacy beside "Prevention &
  // Lifestyle by Condition" under a heading of its own: "Health Literacy
  // is supposed to be about general, basic health that everyone should
  // know... The Health Literacy area shouldn't be a dump for these
  // specific Conditions." Kept here rather than moved, by the same
  // instruction, because these three have no Conditions page and the
  // Free tier reads Health Literacy.
  // Subtopics from the start rather than one 24-wide shelf, per the
  // standing rule. Every id is listed out rather than matched on a
  // 'neuro-autism-' style prefix, because the autism entries split across
  // two different subtopics (eating, and what tends to come with it) and a
  // prefix cannot tell them apart. The crossover entries themselves are
  // NOT here: each one lives inside the condition it is about
  // (lib/digest/neurodivergenceCrossover.ts), and
  // neuro-crossover-with-tracked-conditions is the index into them.
  {
    label: 'Autism, ADHD & Dyslexia',
    conditionSpecific: true,
    description: 'What the research shows about eating, nutrient shortfalls and reading, what it does not show, and where these cross into the conditions this app tracks. Listed in your Profile, never scored as a condition.',
    subtopics: [
      {
        label: 'Overview & Framing',
        prefixes: [
          'neuro-overview',
          'neuro-not-a-tracked-condition',
          'neuro-diet-does-not-treat',
          'mentalhealth-adhd-ocd-diet-does-not-cause',
          'neuro-autism-adhd-overlap',
          'neuro-crossover-with-tracked-conditions',
        ],
      },
      { label: 'Autism & Eating', prefixes: ['neuro-autism-feeding-differences', 'neuro-autism-arfid-overlap', 'neuro-autism-nutrient-shortfalls', 'neuro-autism-gi-symptoms', 'neuro-autism-texture-and-narrow-eating'] },
      {
        label: 'ADHD & Eating',
        prefixes: [
          'neuro-adhd-restriction-diets',
          'mentalhealth-adhd-dietary-triggers',
          'neuro-adhd-food-colours',
          'neuro-adhd-omega3',
          'mentalhealth-adhd-micronutrients-glycemic',
          'neuro-adhd-iron-ferritin',
        ],
      },
      { label: 'Dyslexia & Reading', prefixes: ['neuro-dyslexia-letter-spacing', 'neuro-dyslexia-fonts', 'neuro-dyslexia-what-this-app-changes'] },
      { label: 'What Tends to Come With Them', prefixes: ['neuro-autism-epilepsy', 'neuro-autism-anxiety-depression', 'neuro-autism-sleep', 'neuro-allergy-asthma-eczema', 'neuro-maternal-autoimmune-and-neurodevelopment', 'neuro-familial-autoimmune-adhd'] },
      { label: 'Words Used Here', prefixes: ['neuro-words-used-here'] },
    ],
  },
  // 2026-08-25: this topic's own description already said "organized by
  // condition," but nothing actually enforced that -- all 38 entries
  // (prevention- and apphelps-, one pair per tracked condition) rendered
  // as one flat 38-wide shelf. Real subtopics now match what the
  // description always claimed, one per condition, each holding that
  // condition's own prevention- and apphelps- pair. See the same-day
  // report at "How Your Body Works: Organs & Systems," above, for the
  // standing rule this applies throughout the Digest, not just here.
  // 2026-09-19: last in Health Literacy, beside "Autism, ADHD & Dyslexia"
  // under the condition-specific heading. It stays in Health Literacy by
  // direct instruction, "Prevention should stay in Health Literacy for
  // the free tier, but should be specifically grouped together", since
  // the Free tier reads nothing else and the apphelps- entries are how
  // the app says what it does for each condition.
  {
    label: 'Prevention & Lifestyle by Condition',
    conditionSpecific: true,
    description: 'What to eat and which lifestyle habits help prevent or manage each of the 19 conditions this app tracks, organized by condition.',
    subtopics: [
      { label: "Hashimoto's Thyroiditis", prefixes: ['prevention-hashimotos', 'apphelps-hashimotos'] },
      { label: "Graves' Disease", prefixes: ['prevention-graves', 'apphelps-graves'] },
      { label: 'Rheumatoid Arthritis', prefixes: ['prevention-ra', 'apphelps-ra'] },
      { label: 'Psoriasis', prefixes: ['prevention-psoriasis', 'apphelps-psoriasis'] },
      { label: 'Celiac Disease', prefixes: ['prevention-celiac', 'apphelps-celiac'] },
      { label: 'Inflammatory Bowel Disease', prefixes: ['prevention-ibd', 'apphelps-ibd'] },
      { label: 'Multiple Sclerosis', prefixes: ['prevention-ms', 'apphelps-ms'] },
      { label: 'Lupus (SLE)', prefixes: ['prevention-lupus', 'apphelps-lupus'] },
      { label: "Sjögren's Syndrome", prefixes: ['prevention-sjogrens', 'apphelps-sjogrens'] },
      { label: 'Type 1 Diabetes', prefixes: ['prevention-type1', 'apphelps-type1'] },
      { label: 'Type 2 Diabetes', prefixes: ['prevention-type2', 'apphelps-type2'] },
      { label: 'PCOS', prefixes: ['prevention-pcos', 'apphelps-pcos'] },
      { label: 'Chronic Kidney Disease', prefixes: ['prevention-ckd', 'apphelps-ckd'] },
      { label: 'Fatty Liver Disease', prefixes: ['prevention-masld', 'apphelps-masld'] },
      { label: 'Irritable Bowel Syndrome', prefixes: ['prevention-ibs', 'apphelps-ibs'] },
      { label: 'Migraine', prefixes: ['prevention-migraine', 'apphelps-migraine'] },
      { label: 'Cardiovascular Disease', prefixes: ['prevention-cvd', 'apphelps-cvd'] },
      { label: 'Gout', prefixes: ['prevention-gout', 'apphelps-gout'] },
      { label: 'Prostate Health', prefixes: ['prevention-prostate', 'apphelps-prostate'] },
    ],
  },

];

// A real, dynamic safety net, not a hardcoded 32nd topic -- only ever
// appears if a real Basic Health entry's own id doesn't match any prefix
// above, the same "unmatched catch-all, not an expected real bucket" role
// the old flat list's own 'More' bucket already played.
export const BASIC_HEALTH_MORE_TOPIC_LABEL = 'More';
// A short description for the same dynamic catch-all, 2026-08-23 -- not
// stored on a BasicHealthTopic entry, since 'More' never has one, but
// needed by the same drilled-in header every real topic's own description
// feeds.
export const BASIC_HEALTH_MORE_TOPIC_DESCRIPTION = "Entries that cover general health topics without fitting neatly into one of Health Literacy's other groups.";

// The heading over the two conditionSpecific topics, which come last.
// 2026-09-19: "Health Literacy is supposed to be about general, basic
// health that everyone should know. I notice there are quite a few topics
// that are specifically related to the Conditions... The Health Literacy
// area shouldn't be a dump for these specific Conditions." Both topics
// stay here by the same instruction, grouped and labelled rather than
// mixed into the general run.
export const BASIC_HEALTH_CONDITION_SPECIFIC_HEADING = {
  title: 'About One Condition',
  description:
    'Everything above is general health, for anybody. These two groups are the exception: one is about the conditions this app tracks, one about autism, ADHD and dyslexia. The full reading for a condition you track is under Conditions.',
};

export function basicHealthTopicPathForEntryId(id: string): string[] {
  for (const topic of BASIC_HEALTH_TOPICS) {
    if (topic.subtopics) {
      const sub = topic.subtopics.find((s) => s.prefixes.some((p) => id.startsWith(p)));
      if (sub) return [topic.label, sub.label];
    } else if (topic.prefixes?.some((p) => id.startsWith(p))) {
      return [topic.label];
    }
  }
  return [];
}

export function basicHealthEntriesForPrefixes(entries: AnyDigestEntry[], prefixes: string[]): AnyDigestEntry[] {
  return sortDigestEntriesLogically(entries.filter((entry) => prefixes.some((p) => entry.id.startsWith(p))));
}

// basicHealthEntriesForPath (resolving one node of a drill-down path at a
// time) used to live here, for the tree-based BasicHealthTree component --
// removed 2026-08-14 alongside that whole component, once Basic Health's
// ordinary browsing view was unified with the same all-shelves-shown-at-
// once pattern every condition, Earth Matters, and Home Gardening already
// use. See basicHealthAllGroups below, and its own header comment.

// Every real Basic Health leaf group at once (every standalone topic, and
// every Essential Nutrients subtopic individually), flattened into the
// same {label, entries} shape BasicHealthShelves already renders --
// 2026-08-08, originally built for a sticky-search filtered view: "all
// things below in the knowledgebase hierarchical set of the area are
// displayed below and filtered." Rather than drilling through a tree one
// level at a time, a search shows every real leaf topic at once, filtered
// down to just the ones with a match.
//
// 2026-08-14, direct report: "I like the way that the conditions'
// information is setup for how someone uses the information. The Basic
// Health section doesn't follow the same pattern... It seems that area
// somehow didn't follow the same flow as the other areas." Correct --
// every real condition, plus Earth Matters and Home Gardening, already
// browse as one continuous vertical scroll of tap-to-expand shelf rows,
// with no drilling in or backing out required at all; Basic Health alone
// still forced a real, separate drill-down-then-back navigation (see the
// removed BasicHealthTree, below the render dispatch that used to call
// it). This same function -- already proven correct here for the search
// view -- is now ALSO the real, ordinary (non-search) Basic Health
// browsing view, closing that gap: every one of Basic Health's own 21 real
// topics (Essential Nutrients' own 21 nutrient/hormone subtopics flattened
// into their own real shelf rows, right where "Essential Nutrients" itself
// used to sit as one single container) renders as its own shelf, exactly
// like every other category.
//
// `label` is deliberately the same '::'-joined path string
// shelfGroupKeyForEntry already computes for a Basic Health entry (not a
// prettier "Topic › Subtopic" string) -- see BasicHealthShelves' own
// comment for why the ref/scroll-key and the display text have to stay the
// same underlying value.
//
// 2026-08-23: this function's own output is unchanged, still every leaf
// group at once -- Basic Health's own scoped search (categorySearchGroups)
// still renders all of it through BasicHealthShelves exactly as described
// above. Plain, non-search browsing no longer does: 479 entries across ~21
// shelves mounting at once turned out to be a direct cause of a
// multi-second display delay, so that ONE call site (see
// selectedTopicGroup, in the main component) now shows a topic menu
// first and renders only the picked group's own shelf through this same
// data. No other category's own browsing view changed.
export function basicHealthAllGroups(entries: AnyDigestEntry[]): { label: string; entries: AnyDigestEntry[] }[] {
  const groups: { label: string; entries: AnyDigestEntry[] }[] = [];
  for (const topic of BASIC_HEALTH_TOPICS) {
    if (topic.subtopics) {
      for (const sub of topic.subtopics) {
        groups.push({
          label: [topic.label, sub.label].join('::'),
          entries: basicHealthEntriesForPrefixes(entries, sub.prefixes),
        });
      }
    } else {
      groups.push({ label: topic.label, entries: basicHealthEntriesForPrefixes(entries, topic.prefixes ?? []) });
    }
  }
  const unmatched = sortDigestEntriesLogically(entries.filter((entry) => basicHealthTopicPathForEntryId(entry.id).length === 0));
  if (unmatched.length > 0) {
    groups.push({ label: BASIC_HEALTH_MORE_TOPIC_LABEL, entries: unmatched });
  }
  return groups;
}

// True only for a top-level Basic Health topic that actually has its own
// real subtopics (Essential Nutrients, as of this writing, the only one) --
// see selectedBasicHealthSubgroup's own comment for why this drives a real,
// second menu step rather than showing every one of that topic's own
// subtopic shelves together. A no-op false for BASIC_HEALTH_MORE_TOPIC_LABEL
// (the dynamic "More" catch-all isn't a real BASIC_HEALTH_TOPICS entry) and
// for every other category entirely, since only Basic Health topics are
// ever looked up here.
export function basicHealthTopicHasSubtopics(label: string): boolean {
  const topic = BASIC_HEALTH_TOPICS.find((t) => t.label === label);
  return !!topic?.subtopics && topic.subtopics.length > 0;
}

// Earth Matters and Home Gardening each need their own real, dedicated
// classifier -- 2026-08-13, a real, direct bug report: "There are only two
// categories listed in Earth Matters... they don't all belong in History
// and Milestones and Putting it Together." Root cause, confirmed by
// reading classifyConditionTopic directly rather than guessed: its own
// early, broad `id.includes('history')` check (written for a real
// condition's own "-history-milestones" id convention) also matches every
// single Earth Matters entry, since every one of them lives in
// foodIndustryHistory.ts and carries the literal substring "history" in
// its own id prefix (foodhistory-... or foodhistory-regen-...) -- an
// unrelated file-naming coincidence, not a real topical match. That one
// check alone silently swallowed the entire category before any later,
// more specific branch (Diet & Food, etc.) ever got a chance to run, which
// is why only "History & Milestones" (everything) plus the always-separate
// "Putting It Together" closing card ever showed up. Home Gardening never
// hit that same specific trap (its own `garden-` ids don't contain
// "history"), but it was still routed through the identical
// disease-oriented classifier, whose keyword nets (Medications & Treatment,
// Self-Advocacy & Testing, Whole-Body Effects, etc.) mean nothing for
// composting or seed-starting -- Basic Health was checked too and is
// genuinely fine, since it already has its own separate, dedicated,
// prefix-based tree (BASIC_HEALTH_TOPICS below), never routed through
// classifyConditionTopic at all.
//
// Both classifiers below are built as an explicit, verified id-substring
// lookup, not a fresh attempt at a broad keyword net -- every one of the
// real ids in both files was extracted and run through this exact logic
// via a throwaway script before this shipped (the same "verify against
// real data first" discipline this whole Digest has used throughout),
// confirming 100% real coverage with zero entries falling through
// unmatched and zero double-matches, rather than trusting that the
// substrings chosen don't collide the way "history" once silently did.
export type EarthMattersTopic =
  | 'Soil Science & Why It Matters'
  | 'Climate Science & the Weather Machine'
  | 'The Gut Connection'
  | 'Pollinators'
  | 'Pesticides & Chemical Inputs'
  | 'Case Studies From Around the World'
  | 'History & Origins of the Movement'
  | 'Water, Seeds & Resources'
  | 'Industry, Greenwashing & Honest Limits'
  | 'Policy, Economics & Power'
  | 'How You Can Take Action';

// Real reading order: the grounding soil-science read leads, then the
// single most directly app-relevant entry (the soil-to-gut-microbiome
// connection) gets its own real, visible spot rather than being buried,
// then the large, vivid pollinator sub-cluster, then the more
// context-setting material (chemical inputs, real-world case studies, the
// movement's own history, resources), then the honest-limits/critique
// material, then policy, with "How You Can Take Action" last of all --
// the natural "what do I do with this" capstone position right before the
// category's own closing "Putting It Together" card. 2026-08-23: "Climate
// Science & the Weather Machine" added right after the soil-science lead,
// the other planetary-systems foundation this category covers, before the
// zoom into more specific topics -- see lib/digest/climateScience.ts's own
// header comment for what this new topic covers and why.
export const EARTH_MATTERS_TOPIC_ORDER: EarthMattersTopic[] = [
  'Soil Science & Why It Matters',
  'Climate Science & the Weather Machine',
  'The Gut Connection',
  'Pollinators',
  'Pesticides & Chemical Inputs',
  'Case Studies From Around the World',
  'History & Origins of the Movement',
  'Water, Seeds & Resources',
  'Industry, Greenwashing & Honest Limits',
  'Policy, Economics & Power',
  'How You Can Take Action',
];

export function classifyEarthMattersTopic(entry: AnyDigestEntry): EarthMattersTopic {
  const id = entry.id.toLowerCase();

  if (id.startsWith('climate-')) return 'Climate Science & the Weather Machine';
  if (
    id.includes('pollinator') ||
    id.includes('bee') ||
    id.includes('bat-pollinators') ||
    id.includes('phenological-mismatch') ||
    id.includes('insect-apocalypse') ||
    id.includes('robotic-drone-pollination') ||
    id.includes('almond-pollination')
  ) {
    return 'Pollinators';
  }
  if (
    id.includes('soil-gut-microbiome') ||
    id.includes('old-friends-hypothesis') ||
    id.includes('karelia-biodiversity') ||
    id.includes('microbiome-symbiosis')
  ) {
    return 'The Gut Connection';
  }
  if (
    id.includes('boycott') ||
    id.includes('bcorp') ||
    id.includes('divestment') ||
    id.includes('shareholder-activism') ||
    id.includes('institutional-purchasing') ||
    id.includes('direct-investment') ||
    id.includes('how-to-get-involved') ||
    id.includes('buycott')
  ) {
    return 'How You Can Take Action';
  }
  // 2026-09-19: seven case studies added after this classifier was written
  // (India twice, Kenya, Colombia, Sikkim, the elephant-dung trial, Korean
  // Natural Farming) had fallen through to the Soil Science bucket, where
  // a subgroup named "Case Studies Around the World" sat one screen away
  // from this topic. They live here now, split by region in
  // CONDITION_TOPIC_SUBGROUPS.
  if (
    id.includes('brazil-case-study') ||
    id.includes('niger-fmnr') ||
    id.includes('china-loess-plateau') ||
    id.includes('rodale-farming-systems-trial') ||
    id.includes('netherlands-nitrogen-conflict') ||
    id.includes('individual-farm-case-study') ||
    id.includes('india-water-harvesting') ||
    id.includes('india-zbnf') ||
    id.includes('kenya-rangeland') ||
    id.includes('colombia-shade-coffee') ||
    id.includes('sikkim-organic-state') ||
    id.includes('elephant-dung-fertilizer') ||
    id.includes('korean-natural-farming')
  ) {
    return 'Case Studies From Around the World';
  }
  if (id.includes('timeline-origins') || id.includes('timeline-certification-era') || id.includes('green-revolution')) {
    return 'History & Origins of the Movement';
  }
  if (id.includes('pesticides-') || id.includes('neonicotinoid') || id.includes('regen-environmental-impact')) {
    return 'Pesticides & Chemical Inputs';
  }
  if (
    id.includes('why-not-mandated') ||
    id.includes('lobbying-imbalance') ||
    id.includes('pesticide-liability-shields') ||
    id.includes('reform-coalition-orgs') ||
    id.includes('carbon-credit-integrity') ||
    id.includes('eu-cap-structural') ||
    id.includes('seed-industry-consolidation') ||
    id.includes('seed-patent-litigation') ||
    id.includes('right-to-repair') ||
    id.includes('farmer-mental-health-debt') ||
    id.includes('tribal-co-stewardship') ||
    id.includes('usda-organic-certification') ||
    id.includes('farmland-ownership-concentration') ||
    id.includes('4-per-1000-initiative')
  ) {
    return 'Policy, Economics & Power';
  }
  if (
    id.includes('ogallala-water') ||
    id.includes('antibiotic-resistance-livestock') ||
    id.includes('seed-diversity-loss') ||
    id.includes('svalbard-seed-vault') ||
    id.includes('food-waste-scale') ||
    id.includes('food-desert-access')
  ) {
    return 'Water, Seeds & Resources';
  }
  if (
    id.includes('whole-foods-organic-industry') ||
    id.includes('no-till-greenwashing') ||
    id.includes('cover-crop-reality-check')
  ) {
    return 'Industry, Greenwashing & Honest Limits';
  }
  // Everything else remaining (verified via the throwaway script above to
  // be exactly the real soil-science/mechanism/urgency entries) falls here.
  return 'Soil Science & Why It Matters';
}

export function groupEarthMattersEntries(entries: AnyDigestEntry[]): {
  topics: { label: string; entries: AnyDigestEntry[] }[];
  tyingTogether: AnyDigestEntry | null;
} {
  const tyingTogether = entries.find(isTyingTogetherEntry) ?? null;
  const rest = entries.filter((entry) => !isTyingTogetherEntry(entry));
  const buckets = new Map<EarthMattersTopic, AnyDigestEntry[]>();
  for (const entry of rest) {
    const topic = classifyEarthMattersTopic(entry);
    if (!buckets.has(topic)) buckets.set(topic, []);
    buckets.get(topic)!.push(entry);
  }
  const topics = EARTH_MATTERS_TOPIC_ORDER.flatMap((topic) =>
    applyConditionTopicSubgroups('earthMatters', topic, buckets.get(topic) ?? []),
  ).filter((group) => group.entries.length > 0);
  return { topics, tyingTogether };
}

export type HomeGardeningTopic =
  | 'Getting Started: Zones, Climate & Site'
  | 'What to Grow First'
  | 'Building Real Soil'
  | 'Your Garden & Your Microbiome'
  | 'Growing Techniques'
  | 'Growing Indoors'
  | 'After the Harvest'
  | 'The Case for a Home Garden';

// Real reading order: the natural first step (finding your zone, picking a
// site) leads, then what to actually plant, then the two real ongoing-care
// clusters (soil, technique), then what happens once something's grown,
// with the motivational/why-bother material last, the same "capstone
// right before the closing card" position Earth Matters' own "How You Can
// Take Action" uses. "Your Garden & Your Microbiome" was added 2026-08-13,
// direct request to build a real section on how the app's own features
// connect to the microbiome/microbial-network research, deliberately
// placed right after "Building Real Soil" -- soil is literally what the
// entries here are about, so learning to build it and then learning what
// direct contact with it does to a person's own immune system is a real,
// natural read order, ahead of the more mechanical growing-technique
// content.
export const HOME_GARDENING_TOPIC_ORDER: HomeGardeningTopic[] = [
  'Getting Started: Zones, Climate & Site',
  'What to Grow First',
  'Building Real Soil',
  'Your Garden & Your Microbiome',
  'Growing Techniques',
  // 2026-09-19: hydroponics, grow lights and water filtration were a
  // subgroup inside the closing "why bother" bucket, which is not where
  // anyone would look for them.
  'Growing Indoors',
  'After the Harvest',
  'The Case for a Home Garden',
];

export function classifyHomeGardeningTopic(entry: AnyDigestEntry): HomeGardeningTopic {
  const id = entry.id.toLowerCase();

  if (
    id.includes('understanding-your-zone') ||
    id.includes('cold-short-season-crops') ||
    id.includes('moderate-climate-crops') ||
    id.includes('warm-climate-crops') ||
    id.includes('tropical-subtropical-crops') ||
    id.includes('container-small-space') ||
    id.includes('soil-safety-lead')
  ) {
    return 'Getting Started: Zones, Climate & Site';
  }
  if (
    id.includes('highest-value-crops') ||
    id.includes('easiest-beginner-crops') ||
    id.includes('herbs-indoor-windowsill') ||
    id.includes('microgreens-sprouts') ||
    id.includes('growing-fruit-perennials')
  ) {
    return 'What to Grow First';
  }
  if (
    id.includes('composting-at-home') ||
    id.includes('no-dig-raised-beds') ||
    id.includes('mulching') ||
    id.includes('crop-rotation') ||
    id.includes('cover-crops-home') ||
    id.includes('hot-composting') ||
    id.includes('organic-fertility-amendments') ||
    id.includes('carbon-in-the-ground')
  ) {
    return 'Building Real Soil';
  }
  if (
    id.includes('hands-in-soil-immune-training') ||
    id.includes('mycobacterium-vaccae') ||
    id.includes('garden-symbiosis-mission')
  ) {
    return 'Your Garden & Your Microbiome';
  }
  if (
    id.includes('seed-starting-vs-transplants') ||
    id.includes('watering-efficiency') ||
    id.includes('natural-pest-management') ||
    id.includes('vertical-trellising') ||
    id.includes('extending-the-season') ||
    id.includes('organic-approved-pesticides') ||
    id.includes('three-sisters-companion-planting')
  ) {
    return 'Growing Techniques';
  }
  if (
    id.includes('indoor-growing-methods-overview') ||
    id.includes('led-grow-lights') ||
    id.includes('water-quality-filtration')
  ) {
    return 'Growing Indoors';
  }
  if (id.includes('preserving-the-harvest') || id.includes('seed-saving') || id.includes('freshness-nutrient-retention')) {
    return 'After the Harvest';
  }
  // Everything else remaining (economics, mental health, community
  // gardens, grow-what-you-can, the pollinator link) falls here. Five
  // entries as of 2026-09-19; a new entry that is not one of those needs
  // its own line above, or it lands in the closing bucket by default.
  return 'The Case for a Home Garden';
}

export function groupHomeGardeningEntries(entries: AnyDigestEntry[]): {
  topics: { label: string; entries: AnyDigestEntry[] }[];
  tyingTogether: AnyDigestEntry | null;
} {
  const tyingTogether = entries.find(isTyingTogetherEntry) ?? null;
  const rest = entries.filter((entry) => !isTyingTogetherEntry(entry));
  const buckets = new Map<HomeGardeningTopic, AnyDigestEntry[]>();
  for (const entry of rest) {
    const topic = classifyHomeGardeningTopic(entry);
    if (!buckets.has(topic)) buckets.set(topic, []);
    buckets.get(topic)!.push(entry);
  }
  const topics = HOME_GARDENING_TOPIC_ORDER.flatMap((topic) =>
    applyConditionTopicSubgroups('homeGardening', topic, buckets.get(topic) ?? []),
  ).filter((group) => group.entries.length > 0);
  return { topics, tyingTogether };
}

// Deliberately no "tying together" pull here -- RECIPES_ENTRIES has no such
// closing synthesis entry (44 individual recipes, nothing to summarize
// across), but the function still returns the same real
// {topics, tyingTogether} shape every other category's own grouping
// function does, with tyingTogether always null, so groupEntriesForLens
// below can dispatch to it without a special case.
export function groupRecipesEntries(entries: AnyDigestEntry[]): {
  topics: { label: string; entries: AnyDigestEntry[] }[];
  tyingTogether: AnyDigestEntry | null;
} {
  const buckets = new Map<RecipeTopic, AnyDigestEntry[]>();
  for (const entry of entries) {
    const topic = classifyRecipesTopic(entry);
    if (!buckets.has(topic)) buckets.set(topic, []);
    buckets.get(topic)!.push(entry);
  }
  const topics = RECIPES_TOPIC_ORDER.map((topic) => ({
    label: topic as string,
    entries: sortDigestEntriesLogically(buckets.get(topic) ?? []),
  })).filter((group) => group.entries.length > 0);
  return { topics, tyingTogether: null };
}

// A single, shared dispatcher used everywhere a lens' own entries need
// grouping into real topic shelves -- Earth Matters, Home Gardening,
// Recipes, and My Kitchen/My Favorites each route to their own dedicated
// classifier above; every real disease condition still routes to
// classifyConditionTopic/groupConditionEntries, unchanged. Basic Health is
// deliberately NOT handled here -- not because
// it renders differently anymore (2026-08-14: it uses the same real
// BasicHealthShelves component as everything else), but because its own
// real shape is genuinely different from what this dispatcher's return
// type assumes: `groupEntriesForLens` below also pulls a category-wide
// "tying together" entry out into its own standalone card, and Basic
// Health has no such single, category-wide entry -- only real, per-topic
// tying-together entries that already sort correctly to the end of their
// own shelf via sortDigestEntriesLogically. Basic Health calls
// basicHealthAllGroups directly instead, a flat {label, entries}[] with no
// separate tyingTogether field to extract.
export function classifyTopicForCategory(entry: AnyDigestEntry, category: DigestCategoryKey): string {
  if (category === 'earthMatters') return classifyEarthMattersTopic(entry);
  if (category === 'homeGardening') return classifyHomeGardeningTopic(entry);
  if (category === 'recipes') return classifyRecipesTopic(entry);
  return classifyConditionTopic(entry);
}

export function groupEntriesForLens(
  category: DigestCategoryKey,
  entries: AnyDigestEntry[],
  // 2026-08-24, direct follow-up: "Now factor in their declared healing
  // stage too." A plain conditionCode -> stageCode map (getConditionStages'
  // own real shape), read once by the caller and passed straight through --
  // only groupConditionEntries below has any use for it.
  declaredStages?: Record<string, string>,
  // 2026-08-25, direct follow-up: "Meals You Can Eat should only show
  // recipes that comply with both [the declared diet] and [the
  // condition]." Same pass-through shape as declaredStages -- only
  // groupConditionEntries's own "Meals You Can Eat" sub-shelf has any use
  // for it.
  dietPreferences?: RecipeDietTag[],
): {
  topics: { label: string; entries: AnyDigestEntry[] }[];
  tyingTogether: AnyDigestEntry | null;
} {
  if (category === 'earthMatters') return groupEarthMattersEntries(entries);
  if (category === 'homeGardening') return groupHomeGardeningEntries(entries);
  if (category === 'recipes') return groupRecipesEntries(entries);
  const conditionCode = DIGEST_KEY_TO_CONDITION_CODE[category];
  return groupConditionEntries(entries, conditionCode, conditionCode ? declaredStages?.[conditionCode] : undefined, dietPreferences);
}
