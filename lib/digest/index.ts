import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { APP_HELPS_ENTRIES } from './appHelps';
import { BIG_PICTURE_ENTRIES } from './bigPicture';
import { CARDIOVASCULAR_DISEASE_ENTRIES } from './cardiovascularDisease';
import { CELIAC_ENTRIES } from './celiac';
import { CHOOSING_QUALITY_PRODUCTS_ENTRIES } from './choosingQualityProducts';
import { CHRONIC_KIDNEY_DISEASE_ENTRIES } from './chronicKidneyDisease';
import { ESSENTIAL_NUTRIENTS_ENTRIES } from './essentialNutrients';
import { FERMENTATION_METHODS_ENTRIES } from './fermentationMethods';
import { FATTY_LIVER_DISEASE_ENTRIES } from './fattyLiverDisease';
import { FERMENTED_FOODS_ENTRIES } from './fermentedFoods';
import { FOOD_ADDITIVES_ENTRIES } from './foodAdditives';
import { FOOD_INDUSTRY_HISTORY_ENTRIES } from './foodIndustryHistory';
import { GLOSSARY_ENTRIES } from './glossary';
import { GOUT_ENTRIES } from './gout';
import { GRAVES_ENTRIES } from './graves';
import { GUT_MICROBIOME_ENTRIES } from './gutMicrobiome';
import { HEALING_STAGES_ENTRIES } from './healingStages';
import { HOME_GARDENING_ENTRIES } from './homeGardening';
import { HORMONES_ENTRIES } from './hormones';
import { HISTORY_ENTRIES } from './history';
import { IBD_ENTRIES } from './ibd';
import { IBS_ENTRIES } from './ibs';
import { LABS_MEDICATION_ENTRIES } from './labsMedication';
import { LIFESTYLE_ENVIRONMENT_ENTRIES } from './lifestyleEnvironment';
import { LUPUS_ENTRIES } from './lupus';
import { MEDICATION_DEPLETION_ENTRIES } from './medicationDepletion';
import { MENTAL_HEALTH_ENTRIES } from './mentalHealth';
import { MIGRAINE_ENTRIES } from './migraine';
import { MITOCHONDRIA_METABOLISM_ENTRIES } from './mitochondriaMetabolism';
import { MULTIPLE_SCLEROSIS_ENTRIES } from './multipleSclerosis';
import { NUTRIENT_INTERACTIONS_ENTRIES } from './nutrientInteractions';
import { NUTRIENTS_ENTRIES } from './nutrients';
import { COMPLEMENTARY_THERAPIES_ENTRIES } from './complementaryTherapies';
import { ORGAN_SYSTEMS_ENTRIES } from './organSystems';
import { OTHER_AUTOIMMUNE_ENTRIES } from './otherAutoimmune';
import { PCOS_ENTRIES } from './pcos';
import { PEDIATRIC_NUTRITION_ENTRIES } from './pediatricNutrition';
import { POPULAR_DIETS_ENTRIES } from './popularDiets';
import { PORTIONS_AND_RDAS_ENTRIES } from './portionsAndRDAs';
import { PREGNANCY_FAMILY_PLANNING_ENTRIES } from './pregnancyFamilyPlanning';
import { PREVENTION_LIFESTYLE_ENTRIES } from './preventionLifestyle';
import { PROBLEM_FOODS_ENTRIES } from './problemFoods';
import { PRODUCE_PROFILES_ENTRIES } from './produceProfiles';
import { PROSTATE_HEALTH_ENTRIES } from './prostateHealth';
import { PSORIASIS_ENTRIES } from './psoriasis';
import { READING_LABELS_ENTRIES } from './readingLabels';
import { RHEUMATOID_ARTHRITIS_ENTRIES } from './rheumatoidArthritis';
import { SELF_ADVOCACY_ENTRIES } from './selfAdvocacy';
import { SJOGRENS_ENTRIES } from './sjogrens';
import { SLEEP_HEALTH_ENTRIES } from './sleepHealth';
import { TYPE_1_DIABETES_ENTRIES } from './type1Diabetes';
import { TYPE_2_DIABETES_ENTRIES } from './type2Diabetes';
import { isProblemFoodEntry, type AnyDigestEntry, type DigestEntryCategory } from './types';

export * from './types';

// A living, growing version marker, same pattern as REFERENCE_DB_VERSION
// (lib/referenceDbVersion.ts) -- bump whenever real content is added or
// changed, so a future "did this actually update" check has something
// concrete to compare, the same way the reference database's own version
// check already works. Format matches that file's own convention
// (YYYYMMDDHHMMSS, the moment this content was last meaningfully changed).
export const PURPLE_DIGEST_VERSION = '20260812100000';

// Every category's own real content array, aggregated into one flat list.
// ProblemFoodEntry is included in the SAME flat list as DigestEntry (via
// AnyDigestEntry) -- category-specific screens tell the two apart with
// isProblemFoodEntry (types.ts) rather than the aggregator needing two
// parallel lists.
export const ALL_DIGEST_ENTRIES: AnyDigestEntry[] = [
  ...GLOSSARY_ENTRIES,
  ...FOOD_ADDITIVES_ENTRIES,
  ...FERMENTED_FOODS_ENTRIES,
  ...PROBLEM_FOODS_ENTRIES,
  ...GUT_MICROBIOME_ENTRIES,
  ...NUTRIENTS_ENTRIES,
  ...LABS_MEDICATION_ENTRIES,
  ...LIFESTYLE_ENVIRONMENT_ENTRIES,
  ...MITOCHONDRIA_METABOLISM_ENTRIES,
  ...OTHER_AUTOIMMUNE_ENTRIES,
  ...HEALING_STAGES_ENTRIES,
  ...ORGAN_SYSTEMS_ENTRIES,
  ...HISTORY_ENTRIES,
  ...NUTRIENT_INTERACTIONS_ENTRIES,
  ...FOOD_INDUSTRY_HISTORY_ENTRIES,
  ...BIG_PICTURE_ENTRIES,
  ...SELF_ADVOCACY_ENTRIES,
  ...PREGNANCY_FAMILY_PLANNING_ENTRIES,
  ...COMPLEMENTARY_THERAPIES_ENTRIES,
  ...RHEUMATOID_ARTHRITIS_ENTRIES,
  ...PSORIASIS_ENTRIES,
  ...GRAVES_ENTRIES,
  ...TYPE_1_DIABETES_ENTRIES,
  ...CELIAC_ENTRIES,
  ...IBD_ENTRIES,
  ...MULTIPLE_SCLEROSIS_ENTRIES,
  ...LUPUS_ENTRIES,
  ...SJOGRENS_ENTRIES,
  ...PCOS_ENTRIES,
  ...CHRONIC_KIDNEY_DISEASE_ENTRIES,
  ...ESSENTIAL_NUTRIENTS_ENTRIES,
  ...FATTY_LIVER_DISEASE_ENTRIES,
  ...TYPE_2_DIABETES_ENTRIES,
  ...IBS_ENTRIES,
  ...MIGRAINE_ENTRIES,
  ...CARDIOVASCULAR_DISEASE_ENTRIES,
  ...GOUT_ENTRIES,
  ...PROSTATE_HEALTH_ENTRIES,
  ...HORMONES_ENTRIES,
  ...PREVENTION_LIFESTYLE_ENTRIES,
  ...APP_HELPS_ENTRIES,
  ...POPULAR_DIETS_ENTRIES,
  ...PORTIONS_AND_RDAS_ENTRIES,
  ...CHOOSING_QUALITY_PRODUCTS_ENTRIES,
  ...FERMENTATION_METHODS_ENTRIES,
  ...PRODUCE_PROFILES_ENTRIES,
  ...READING_LABELS_ENTRIES,
  ...MEDICATION_DEPLETION_ENTRIES,
  ...PEDIATRIC_NUTRITION_ENTRIES,
  ...SLEEP_HEALTH_ENTRIES,
  ...MENTAL_HEALTH_ENTRIES,
  ...HOME_GARDENING_ENTRIES,
];

// The old `| 'problemFoods'` union member is gone as of the 2026-08-08
// restructure -- ProblemFoodEntry.category now carries a real
// DigestEntryCategory value like every other entry (see types.ts), so this
// alias is kept only in case a future entry shape needs a category this
// union doesn't otherwise cover.
export type DigestCategoryKey = DigestEntryCategory;

// RESTRUCTURED 2026-08-08, same day Psoriasis shipped -- this array used to
// carry 20 topic-named categories (Glossary, Food Additives, Problem Foods
// & Swaps, Gut & Microbiome, Fermented Foods, Nutrients & Micronutrients,
// Labs & Medication Timing, Lifestyle & Environment, Mitochondria &
// Metabolism, Other Autoimmune Diseases, Healing Stages, Organs & Body
// Systems, History & Milestones, Nutrient Interactions, Food Industry &
// History, The Big Picture, Self Advocacy, Pregnancy & Family Planning,
// Complementary & Manual Therapies, plus Rheumatoid Arthritis and
// Psoriasis) -- collapsed down to 4, per direct request: "all of the
// Hashimoto's specific Digest information should be within a Hashimoto's
// area of the Digest, just as the Rheumatoid arthritis has... basic health
// and knowledge everyone should be aware of... should be listed in a Basic
// Health category like the free version will have. Each specific
// autoimmune disease... need each their own areas as well." See types.ts's
// own header comment for the full reasoning and how each of the 20 old
// topic files' own entries were individually reassigned a real `category`
// of 'basicHealth' or 'hashimotos' (RA and Psoriasis already had their own
// dedicated category and needed no reassignment). Basic Health is listed
// first, matching Free-tier visibility and Glossary's own earlier
// front-placement precedent; Hashimoto's second as the deepest-built,
// flagship condition; then each additional condition in build order.
export const DIGEST_CATEGORY_META: {
  key: DigestCategoryKey;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  description: string;
}[] = [
  {
    key: 'basicHealth',
    label: 'Basic Health',
    icon: 'reader-outline',
    description: 'Food, vitamins, minerals, and interactions everyone should understand about their own body, independent of any specific condition -- what the Free tier shows in full.',
  },
  {
    key: 'hashimotos',
    label: "Hashimoto's",
    icon: 'medkit-outline',
    description: "Every Hashimoto's-specific finding in this Digest, in one place: nutrients, labs and medication timing, healing stages, organ systems, history, pregnancy, corroborating cross-disease evidence, and Hashimoto's own self-advocacy guidance.",
  },
  // 2026-08-08, eleventh addition (unchanged from its own original build),
  // and the first genuinely new condition this app has ever built out:
  // Rheumatoid Arthritis. See rheumatoidArthritis.ts's own header comment.
  {
    key: 'rheumatoidArthritis',
    label: 'Rheumatoid Arthritis',
    icon: 'pulse-outline',
    description: 'Real food, medication, and self-advocacy guidance for RA on its own terms, including the most common real overlap with Hashimoto\'s of any two conditions in the research.',
  },
  // 2026-08-08, twelfth addition (unchanged from its own original build),
  // same day: Psoriasis / Psoriatic Arthritis, this app's third real
  // condition. See psoriasis.ts's own header comment.
  {
    key: 'psoriasis',
    label: 'Psoriasis',
    icon: 'bandage-outline',
    description: 'Real food, medication, and self-advocacy guidance for psoriasis and psoriatic arthritis on their own terms, including two findings honestly reported as unproven rather than smoothed into false confidence.',
  },
  // 2026-08-08, same day, fourth condition: Graves' Disease. See graves.ts's
  // own header comment -- the first condition built with its own real
  // self-advocacy content included from the start.
  {
    key: 'graves',
    label: "Graves' Disease",
    icon: 'eye-outline',
    description: 'Real food, medication, and self-advocacy guidance for Graves\' disease, including several findings that run in the literal opposite direction from this app\'s own Hashimoto\'s research.',
  },
  // 2026-08-08, same day, fifth condition: Type 1 Diabetes. See
  // type1Diabetes.ts's own header comment -- a genuinely different shape
  // of condition, where food's real relevance is matching carbohydrate
  // intake to insulin dosing rather than triggering or avoiding a flare.
  {
    key: 'type1Diabetes',
    label: 'Type 1 Diabetes',
    icon: 'water-outline',
    description: 'Real food, medication, and self-advocacy guidance for Type 1 Diabetes: carb-counting accuracy, exercise and alcohol timing, DKA recognition, and the real overlap with celiac disease and Hashimoto\'s.',
  },
  // 2026-08-08, same day, sixth condition: Celiac Disease. See celiac.ts's
  // own header comment -- the one condition in this app where diet is the
  // entire treatment, not one lever among several.
  {
    key: 'celiac',
    label: 'Celiac Disease',
    icon: 'nutrition-outline',
    description: 'Real, practical guidance for celiac disease: cross-contamination thresholds, the oats controversy, gluten-free diet nutritional pitfalls, real healing timelines, and self-advocacy for diagnosis and bone density.',
  },
  // 2026-08-08, same day, seventh condition: Inflammatory Bowel Disease.
  // See ibd.ts's own header comment -- two real, distinct diseases under
  // one name, several findings running in genuinely opposite directions
  // depending on which one someone has.
  {
    key: 'ibd',
    label: 'Inflammatory Bowel Disease',
    icon: 'body-outline',
    description: "Real food, medication, and self-advocacy guidance for Crohn's disease and ulcerative colitis, including the smoking paradox, the low-fiber-during-a-flare myth, and an honestly reported null result on Hashimoto's comorbidity.",
  },
  // 2026-08-08, same day, eighth condition: Multiple Sclerosis. See
  // multipleSclerosis.ts's own header comment -- a disease of the central
  // nervous system directly, where the single strongest finding is a
  // virus (EBV), not a food.
  {
    key: 'multipleSclerosis',
    label: 'Multiple Sclerosis',
    icon: 'flash-outline',
    description: "Real evidence for MS: the EBV trigger and its exact mechanism, the Swank/Wahls diet trial, honest corrections on high-dose biotin and vitamin D, and self-advocacy for JC virus monitoring and diagnosis.",
  },
  // 2026-08-08, same day, ninth condition: Lupus (SLE). See lupus.ts's own
  // header comment -- a genuinely wide-ranging condition reaching nearly
  // any organ system, with a real, specific food trigger and self-advocacy
  // spanning eyes, kidneys, and the immune system directly.
  {
    key: 'lupus',
    label: 'Lupus (SLE)',
    icon: 'shield-half-outline',
    description: 'Real evidence for lupus: the alfalfa sprout food trigger, the photosensitivity/vitamin D catch-22, omega-3\'s genuinely mixed evidence, and self-advocacy for retinopathy screening, kidney monitoring, and biologic treatment.',
  },
  // 2026-08-08, same day, tenth condition: Sjögren's Syndrome. See
  // sjogrens.ts's own header comment -- a disease defined by its attack on
  // the exocrine (moisture-making) glands, with a real, direct, same-day
  // relationship to food and drink.
  {
    key: 'sjogrens',
    label: "Sjögren's Syndrome",
    icon: 'rainy-outline',
    description: "Real evidence for Sjögren's: the direct dental-caries mechanism, alcohol/caffeine's immediate dryness effect, omega-3's genuinely positive trials, a real lymphoma risk, and self-advocacy for diagnosis and medication.",
  },
  // 2026-08-08, same day, eleventh condition, and this app's first
  // genuinely non-autoimmune one: PCOS. See pcos.ts's own header comment
  // -- a real endocrine/metabolic disorder driven centrally by insulin
  // resistance.
  {
    key: 'pcos',
    label: 'PCOS',
    icon: 'infinite-outline',
    description: 'Real evidence for PCOS: insulin resistance as the central mechanism, the well-studied 40:1 inositol ratio, modest weight loss\'s real quantified benefit, a real endometrial cancer risk, and self-advocacy for glucose/lipid screening.',
  },
  // 2026-08-08, same day, twelfth condition, and this app's second
  // genuinely non-autoimmune one: Chronic Kidney Disease. See
  // chronicKidneyDisease.ts's own header comment -- a real, honest
  // correction to some of the most commonly repeated CKD dietary advice
  // (blanket potassium restriction) leads this category.
  {
    key: 'chronicKidneyDisease',
    label: 'Chronic Kidney Disease',
    icon: 'filter-outline',
    description: 'Real evidence for CKD: an honest correction on potassium restriction, hidden phosphate additives, plant-forward protein guidance, SGLT2 inhibitors\' real kidney-protective effect, and self-advocacy for eGFR/ACR monitoring.',
  },
  // 2026-08-08, same day, thirteenth condition, and this app's third
  // genuinely non-autoimmune one: Fatty Liver Disease (MASLD). See
  // fattyLiverDisease.ts's own header comment -- resmetirom, the
  // first-ever approved MASH drug, works as a thyroid hormone receptor
  // agonist, a direct, elegant echo of this app's own core focus.
  {
    key: 'fattyLiverDisease',
    label: 'Fatty Liver Disease',
    icon: 'flame-outline',
    description: 'Real evidence for MASLD: a graded weight-loss staircase, coffee\'s consistently protective effect, resmetirom\'s thyroid-hormone-receptor mechanism, semaglutide\'s major trial results, and self-advocacy via the FIB-4 screening tool.',
  },
  // 2026-08-08, same day, fourteenth condition: Type 2 Diabetes. See
  // type2Diabetes.ts's own header comment -- sits at the real center of
  // the metabolic-syndrome cluster already built out across PCOS, MASLD,
  // and CKD.
  {
    key: 'type2Diabetes',
    label: 'Type 2 Diabetes',
    icon: 'trending-down-outline',
    description: 'Real evidence for T2D: the DiRECT remission trial, low-carb diet evidence, a real distinction from Type 1, a recent GLP-1/SGLT2 treatment paradigm shift, and self-advocacy on individualized HbA1c targets.',
  },
  // 2026-08-08, same day, fifteenth condition: Irritable Bowel Syndrome.
  // See ibs.ts's own header comment -- a real disorder of gut-brain
  // interaction, leaning heavily on cross-links to this app's own
  // already-built FODMAP and gut-microbiome content.
  {
    key: 'ibs',
    label: 'Irritable Bowel Syndrome',
    icon: 'sync-outline',
    description: 'Real evidence for IBS: the low-FODMAP diet, peppermint oil and gut-directed hypnotherapy, the post-infectious mechanism behind over half of all cases, and self-advocacy for distinguishing IBS from conditions that mimic it.',
  },
  // 2026-08-08, same day, sixteenth condition: Migraine. See migraine.ts's
  // own header comment -- a real neurological disease with its own
  // dedicated, genuinely major medication class (CGRP inhibitors).
  {
    key: 'migraine',
    label: 'Migraine',
    icon: 'thunderstorm-outline',
    description: 'Real evidence for migraine: an honest correction to food-trigger lists, the magnesium/riboflavin/CoQ10 combination trial, CGRP inhibitors, medication-overuse headache, and self-advocacy for recognizing real emergency red flags.',
  },
  // 2026-08-08, same day, seventeenth condition: Cardiovascular Disease.
  // See cardiovascularDisease.ts's own header comment -- already touched
  // from five separate angles across existing content (lupus, Hashimoto's
  // organ systems, PCOS, psoriasis, and RA) before this category itself
  // existed to link back to.
  {
    key: 'cardiovascularDisease',
    label: 'Cardiovascular Disease',
    icon: 'heart-outline',
    description: 'Real evidence for cardiovascular disease: the Mediterranean diet and DASH, an honest statin evidence review, a real reversal on daily aspirin and omega-3s for prevention, and self-advocacy for lipid testing and heart attack red flags.',
  },
  // 2026-08-08, same day, eighteenth condition, and -- per the `conditions`
  // table's own sort_order -- the last one currently planned: Gout. See
  // gout.ts's own header comment -- an unusually specific, individually
  // well-studied list of real dietary triggers and protective foods.
  {
    key: 'gout',
    label: 'Gout',
    icon: 'footsteps-outline',
    description: 'Real evidence for gout: the specific foods that raise and lower risk (meat, seafood, dairy, sugar drinks, beer, cherries, vitamin C, coffee), a real medication safety distinction, and self-advocacy for genetic testing and flare red flags.',
  },
  {
    key: 'prostateHealth',
    label: 'Prostate Health',
    icon: 'male-outline',
    description: 'Real evidence for BPH and prostate cancer risk: a genuine gut-microbiome connection (dysbiosis linked to BPH, gut bacteria directly making androgens and TMAO), lycopene and cruciferous vegetables, a real supplement correction, and self-advocacy on PSA testing and monitoring.',
  },
  // 2026-08-09, direct request: everything in this app's regenerative-
  // agriculture/pollinator/economic-power research cluster (previously
  // tagged basicHealth) is genuinely about the planet and food system, not
  // the human body -- it now has its own real area. See
  // foodIndustryHistory.ts's own header comment for the reassignment.
  {
    key: 'earthMatters',
    label: 'Earth Matters',
    icon: 'earth-outline',
    description: 'The planet the food system actually runs on: soil, water, pollinators, seed diversity, regenerative-farming case studies, the economics and politics of who controls food production, and real, concrete ways to push for change with your own money and voice.',
  },
  // 2026-08-09, same day, a genuinely new topic, direct request: real
  // guidance on growing your own fresh fruits and vegetables at home as a
  // real, practical way to subsidize food cost. See homeGardening.ts's own
  // header comment.
  {
    key: 'homeGardening',
    label: 'Home Gardening',
    icon: 'leaf-outline',
    description: "Growing even a modest amount of your own food is a real, documented way to cut a grocery bill and eat fresher produce -- what to grow, organized by climate zone so you can find guidance for where you actually live, plus container growing, beginner crops, and season extension.",
  },
];

export function getEntriesForCategory(category: DigestCategoryKey): AnyDigestEntry[] {
  return ALL_DIGEST_ENTRIES.filter((entry) => entry.category === category);
}

export function findDigestEntryById(id: string): AnyDigestEntry | undefined {
  return ALL_DIGEST_ENTRIES.find((entry) => entry.id === id);
}

export function findDigestEntriesByIds(ids: string[]): AnyDigestEntry[] {
  return ids
    .map((id) => findDigestEntryById(id))
    .filter((entry): entry is AnyDigestEntry => entry != null);
}

// 2026-08-08, explicitly requested: "a way to search for things the person
// wants to read about in the Digest... draw from the entire list of all the
// available information." Every category's own list stays scoped to just
// that category (unchanged) -- this is a separate, cross-category search
// over ALL_DIGEST_ENTRIES at once, the same shape as Insights' own Food
// Lookup searching the whole reference database regardless of which
// category a food happens to sit in.
//
// A plain, in-memory, every-term-must-match-somewhere substring search --
// no SQL involved (this content lives in TS arrays, not the SQLite
// reference database), and with only a few hundred entries total, no
// indexing or debouncing is needed for this to feel instant. Matches
// against everything a person would actually recognize a topic by: the
// title/food name and one-line teaser (what shows on the collapsed card),
// the full summary/problem/mechanism/swaps text (so a search for a specific
// mechanism like "zonulin" or "deiodinase" finds entries that discuss it
// without naming it in the title), and each citation's own source text (so
// a remembered author/journal name works too).
function digestSearchHaystack(entry: AnyDigestEntry): string {
  const citationText = entry.citations.map((citation) => citation.source).join(' ');
  if (isProblemFoodEntry(entry)) {
    return [entry.foodName, entry.teaser, entry.problem, entry.mechanism, entry.swaps.join(' '), citationText]
      .join(' ')
      .toLowerCase();
  }
  return [entry.title, entry.teaser, entry.summary, citationText].join(' ').toLowerCase();
}

// Just the title/food name, lowercased -- used by searchEntries below to
// weight a real title match higher than an incidental mention buried in a
// citation or a long paragraph. Not part of digestSearchHaystack's own
// return value -- kept as a separate, smaller function since it's already
// a substring of that larger haystack, and computing it twice from scratch
// would be wasteful.
function digestSearchTitle(entry: AnyDigestEntry): string {
  return (isProblemFoodEntry(entry) ? entry.foodName : entry.title).toLowerCase();
}

// Stripped out of a query before matching -- 2026-08-08, built specifically
// so this search can handle a real, typed QUESTION reasonably well
// ("Why do I have such a bad reaction to horchata but I can eat rice
// dishes without a problem?"), not just a short keyword phrase. English
// question/connector words that would otherwise count as real search
// terms and dilute relevance scoring with near-universal matches (almost
// every entry in this Digest contains "the," "to," "of," etc. somewhere).
// Deliberately does NOT filter by term length -- a real, short, meaningful
// token like a bare vitamin letter ("d," "c," "k") needs to survive this
// list untouched (see the real "vitamin a" collision named directly below,
// an accepted, narrow exception, not something this list tries to solve).
const SEARCH_STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'i',
  'me',
  'my',
  'you',
  'your',
  'he',
  'she',
  'it',
  'we',
  'they',
  'them',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'do',
  'does',
  'did',
  'have',
  'has',
  'had',
  'can',
  'could',
  'will',
  'would',
  'should',
  'shall',
  'may',
  'might',
  'must',
  'why',
  'what',
  'when',
  'where',
  'who',
  'whom',
  'which',
  'how',
  'and',
  'or',
  'but',
  'if',
  'so',
  'because',
  'due',
  'to',
  'of',
  'for',
  'in',
  'on',
  'at',
  'with',
  'without',
  'from',
  'by',
  'about',
  'than',
  'then',
  'that',
  'this',
  'these',
  'those',
  'not',
  'no',
  'yet',
  'just',
  'such',
  'very',
  'really',
  'too',
  'also',
  'get',
  'getting',
  'need',
  'needs',
  'want',
  'wants',
  'help',
  'out',
  'please',
  'tell',
  'know',
]);

// Splits a raw query into real search terms -- lowercased, punctuation
// stripped (so "horchata?" matches the same as "horchata"), and every
// stopword above removed. A single-letter token like "d" (a real vitamin
// code, not filtered here at all) can survive right alongside a whole
// question's worth of filler getting stripped out around it.
function extractSearchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[?!.,;:'"()]/g, ' ')
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0 && !SEARCH_STOPWORDS.has(term));
}

function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// A real, caught-before-shipping bug, found by test-running this against a
// real "vitamin d" search before trusting it: a short term (any single- or
// double-letter one, most importantly the bare vitamin letters -- "d,"
// "a," "c," "k") matched via plain substring is nearly useless, since
// almost any real sentence contains that letter somewhere ("and," "diet,"
// "reaction" all contain a bare "d") -- meaning "vitamin d" was scoring
// nearly every entry in the whole Digest as if it genuinely matched "d,"
// drowning out the entries actually about Vitamin D specifically. A real
// word-boundary check fixes this for short terms without giving up
// substring matching for longer, more distinctive ones -- "vitamin"
// matching "vitamins," or "goitrogen" matching "goitrogenic," is a real,
// wanted feature this app's search has always had, only the SHORT-term
// case needed a different rule.
function termMatches(haystack: string, term: string): boolean {
  if (term.length <= 2) {
    return new RegExp(`\\b${escapeForRegExp(term)}\\b`).test(haystack);
  }
  return haystack.includes(term);
}

// 2026-08-08, rebuilt from a strict "every term must appear somewhere"
// substring match into a real, relevance-ranked one -- direct request:
// someone should be able to type an actual question ("Why do I have such
// a bad reaction to horchata but I can eat rice dishes without a
// problem?") and get back whatever this Digest's own real entries say
// that's most relevant, not nothing at all because the exact phrase never
// appears verbatim anywhere. Every real content word (see
// extractSearchTerms above) is checked independently now -- an entry needs
// to match at least ONE of them, not all of them, and results are sorted
// by how many terms actually matched (title matches count 3x an ordinary
// body/citation match, so an entry literally about the thing being asked
// about outranks one that just happens to mention it once in passing).
// This is still a real, honest search over this app's own already-written
// content, not a generated answer -- see this app's own recorded
// architecture decision (2026-08-08) for why a real AI-summarized-answer
// version of this was deliberately NOT built: it would mean a person's own
// typed health question leaving the device to reach an external API, a
// real, first-time departure from this app's whole local-first design that
// needs its own dedicated conversation before ever being built, not folded
// into this pass.
//
// Extracted from searchDigestEntries's own original body (below) so a
// real, scoped search over an arbitrary subset of entries -- Basic
// Health's own category-scoped search utility, see purple-digest.tsx --
// can reuse the exact same real matching/ranking logic rather than a
// second, separately-maintained copy of it. searchDigestEntries itself is
// now just this function called with the full ALL_DIGEST_ENTRIES pool.
//
// 2026-08-09, real per-term match detail added, direct request: "if I
// search for Sleep and Inflammation... the search results should tell me
// if one or the other or both items appeared in the result and how much
// weight this entry has based on the search criteria." The plain score
// this function already computed internally was never surfaced anywhere
// -- a result card had no way to show WHICH terms actually matched or
// where. searchEntriesScored below is the real, richer version (one
// SearchTermMatch per real query term, plus the same score), and this
// function is now just a thin wrapper around it that keeps returning
// exactly what it always has -- every existing call site (the category-
// scoped search's own matchedIds Set, built purely to filter which
// entries belong in a group) needs nothing more than the plain entry list
// and stays completely unchanged.
export type SearchTermMatch = {
  // The real, extracted query term this describes (lowercased, stopwords
  // and punctuation already stripped -- see extractSearchTerms).
  term: string;
  // True when this term matched the entry's own title/food name directly
  // -- the real, stronger 3x-weighted match this function's own scoring
  // has always used internally, now exposed rather than hidden inside a
  // single opaque number.
  matchedInTitle: boolean;
  // True when this term matched anywhere at all (title, summary, or a
  // citation's own source text) -- always true when matchedInTitle is,
  // since the title is itself part of the full haystack; false only when
  // this specific term never appeared anywhere in this specific entry.
  matchedAnywhere: boolean;
};

export type SearchMatchInfo = {
  // One entry per real term the query broke down into, in the same order
  // the query itself listed them -- searching "sleep inflammation" and
  // "inflammation sleep" produces the same two SearchTermMatch objects,
  // just in the order the person actually typed them, so a result card can
  // genuinely answer "did the FIRST thing I typed match, and the second."
  terms: SearchTermMatch[];
  matchedTermCount: number;
  totalTermCount: number;
  // The same real, internal relevance score this function has always
  // computed (a title match counts 3x an ordinary body match) -- now a
  // real, visible part of this type instead of being thrown away the
  // instant sorting finished.
  score: number;
};

export type ScoredDigestEntry = { entry: AnyDigestEntry; match: SearchMatchInfo };

export function searchEntriesScored(pool: AnyDigestEntry[], query: string, limit = 60): ScoredDigestEntry[] {
  const terms = extractSearchTerms(query);
  if (terms.length === 0) return [];

  const scored: ScoredDigestEntry[] = [];
  for (const entry of pool) {
    const haystack = digestSearchHaystack(entry);
    const title = digestSearchTitle(entry);
    let score = 0;
    let matchedTermCount = 0;
    const termMatchList: SearchTermMatch[] = terms.map((term) => {
      const matchedInTitle = termMatches(title, term);
      const matchedAnywhere = matchedInTitle || termMatches(haystack, term);
      if (matchedInTitle) score += 3;
      else if (matchedAnywhere) score += 1;
      if (matchedAnywhere) matchedTermCount += 1;
      return { term, matchedInTitle, matchedAnywhere };
    });
    if (score > 0) {
      scored.push({ entry, match: { terms: termMatchList, matchedTermCount, totalTermCount: terms.length, score } });
    }
  }
  // Highest relevance first; a stable sort keeps equally-relevant entries
  // in their own original pool order rather than shuffling them.
  scored.sort((a, b) => b.match.score - a.match.score);
  return scored.slice(0, limit);
}

export function searchEntries(pool: AnyDigestEntry[], query: string, limit = 60): AnyDigestEntry[] {
  return searchEntriesScored(pool, query, limit).map((result) => result.entry);
}

export function searchDigestEntries(query: string, limit = 60): AnyDigestEntry[] {
  return searchEntries(ALL_DIGEST_ENTRIES, query, limit);
}

export function searchDigestEntriesScored(query: string, limit = 60): ScoredDigestEntry[] {
  return searchEntriesScored(ALL_DIGEST_ENTRIES, query, limit);
}
