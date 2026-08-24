import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, Linking, Pressable, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View, type TextStyle } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { AppTextInput } from '../../components/AppTextInput';
import { useConfirmSheet } from '../../components/ConfirmSheet';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { DigestBarChart } from '../../components/DigestChart';
import { DIGEST_CONDITION_ICONS } from '../../components/DigestConditionIcons';
import { EdgeShadow } from '../../components/EdgeShadow';
import { EntryPhotoSection, resolvePhotoTarget } from '../../components/EntryPhotoSection';
import { GatedTabContent } from '../../components/GatedTabContent';
import { HelpSheet, type HelpSection } from '../../components/HelpButton';
import { useInfoAlert } from '../../components/InfoAlert';
import { LensHub, type LensOption } from '../../components/LensHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { PopoverSelect } from '../../components/PopoverSelect';
import { PurpleRibbonIcon } from '../../components/PurpleRibbonIcon';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { VoiceInputButton } from '../../components/VoiceInputButton';
import { colors } from '../../constants/colors';
import { NAVIGATION_HAND, useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { TAB_REVEAL_DURATION_MS } from '../../constants/tabReveal';
import { menuLabelShadow, typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { CONDITION_CODE_TO_DIGEST_KEY } from '../../lib/conditionCodeMap';
import {
  deleteFavorite,
  getCuratedRecipe,
  getUserConditions,
  getUserProfile,
  getVisibleFoodBaseNames,
  saveBuilderFavorite,
  scheduleMeal,
  scheduleSingleComponent,
  type BuilderFavoriteItemType,
} from '../../lib/db';
import { buildMyFavoritesEntries, buildMyKitchenEntries, buildSharedRecipeEntries } from '../../lib/digestDynamicEntries';
import { getDigestFeedbackFor, setDigestFeedback, type DigestFeedbackValue } from '../../lib/digestFeedback';
import { getPhotoForTarget } from '../../lib/mealPhotos';
import { shareFileIfAvailable } from '../../lib/nativeSharing';
import {
  buildBuilderFavoritePayload,
  deleteSharedRecipe,
  encodeMealShareLink,
  encodeShareLink,
  encodeShareLinkFromCuratedRecipe,
  promoteSharedRecipeToFavorite,
  promoteSharedRecipeToSaved,
  writeIsFileForComponent,
  writeIsFileForCuratedRecipe,
  writeIsFileForMeal,
} from '../../lib/sharing';
import { buildTime24, formatTime12 } from '../../lib/timeOfDay';
import {
  ALL_DIGEST_ENTRIES,
  DIGEST_CATEGORY_META,
  findDigestEntryById,
  getEntriesForCategory,
  isProblemFoodEntry,
  searchDigestEntriesScored,
  searchEntriesScored,
  type AnyDigestEntry,
  type DigestCategoryKey,
  type DigestEntry,
  type EvidenceTier,
  type RecipeCard,
  type SearchMatchInfo,
} from '../../lib/digest';

// A synthetic lens key, alongside every real category -- 2026-08-08,
// explicitly requested: "a way to search for things the person wants to
// read about in the Digest... draw from the entire list of all the
// available information," the same shape as Insights' own Food Lookup
// searching across every category at once rather than one at a time.
// Deliberately not folded into DigestCategoryKey itself (lib/digest/
// types.ts) -- 'search' isn't a real content category with its own
// entries, it's a tool for finding entries that already live in a real
// category, so it stays a screen-local concern rather than something every
// other consumer of DigestCategoryKey (getEntriesForCategory, etc.) would
// have to account for.
type PurpleDigestLens = DigestCategoryKey | 'search';

// The minimal shape scrollEntryIntoView actually needs from a card ref or
// the ScrollView ref -- both `Animated.View` (via Reanimated's own ref
// forwarding) and `ScrollView` expose a real `.measure()` imperative
// method (the same primitive React Native itself is built on for "where is
// this view really, right now" queries), so a narrow structural type here
// avoids needing an exact, brittle component type for either.
type Measurable = {
  measure: (
    callback: (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => void,
  ) => void;
};

// Promoted 2026-08-05 from a Stack-push placeholder (formerly
// app/purple-digest.tsx, now deleted -- see that file's own former header
// comment for the naming history) to a real tab: "a real location for the
// aggregator to exist full time," per the request that prompted this.
// Follows the exact same shape as every other lens-driven tab (see
// insights.tsx/schedule.tsx) -- SwipeableTabScreen -> GatedTabContent,
// gated on `revealed`, with LensHub choosing among real options rather
// than a single scrollable page.
//
// Content lives in lib/digest/ (one file per category + this screen's own
// consumer of the aggregator) -- see that folder's own types.ts for the
// two content shapes (DigestEntry vs. ProblemFoodEntry) and why they're
// kept separate rather than one shared schema with optional fields.
//
// No dedicated background artwork exists for this tab yet (unlike
// Insights/Schedule/Trends/Bio-Compass/Reports, each with their own
// commissioned image) -- variant="field" falls back to the same shared
// wildflower scene every tab rests on before its own art is picked, same
// as Home's own background. Worth commissioning real Digest art
// later; not a blocker for shipping real content.
const TAB_COLOR = colors.tabPurpleDigest;
// 2026-08-23, direct report: the darker TAB_COLOR above reads fine as a
// fill, border, or icon tint, but too dark to read comfortably as the
// color of on-screen text (category headers, topic menu labels, shelf and
// entry titles). TAB_TEXT_COLOR is the lighter, pre-darkening shade,
// reserved for every spot in this file where TAB_COLOR paints text itself
// rather than a background or outline. See colors.ts's own comment on
// `tabPurpleDigestText` for the full reasoning.
const TAB_TEXT_COLOR = colors.tabPurpleDigestText;

// fixedHeader's own horizontal padding, pulled out into a named constant
// so the EdgeShadow bar below it (see edgeShadowFullWidth) can cancel
// exactly that much back out with a negative margin, rather than a
// second, separately-typed "16" that could drift out of sync with it.
const FIXED_HEADER_HORIZONTAL_PADDING = 16;

// 2026-08-23, direct report: "why does it take so long for Basic Health to
// display?" The real cause -- confirmed by actually reading the render
// path, not re-guessed -- was never the grouping computation (already
// fixed once, correctly, but for a different problem: repeated
// recomputation on re-render, not this). BasicHealthShelves rendered
// every entry in every group eagerly, all at once, with no virtualization
// at all; Basic Health alone has 479 real entries (confirmed by count),
// far more than any single condition's own handful of groups, so it was
// the one place mounting hundreds of real ShelfTabCard view hierarchies
// synchronously ever became visible as a real, multi-second stall. Fixed
// by converting each shelf row from a plain ScrollView + .map() to a real
// FlatList, so only the cards actually near the visible window ever
// mount. SHELF_CARD_WIDTH/GAP exist so the FlatList's own getItemLayout
// (below, in BasicHealthShelves) can compute every card's exact scroll
// position up front without waiting for it to render first -- the same
// two numbers styles.shelfCard/shelfRow use themselves, one real source,
// not two that could quietly drift apart.
const SHELF_CARD_WIDTH = 200;
const SHELF_CARD_GAP = 10;
const SHELF_CARD_STRIDE = SHELF_CARD_WIDTH + SHELF_CARD_GAP;

// A recipe entry's own linkedBuilderType (see lib/digest/recipes.ts) maps
// onto one real param per builder in app/(tabs)/food.tsx -- openSideRecipeId,
// openSaladRecipeId, etc., 2026-08-14, the exact same per-builder-named-
// param convention editSideId/fromSideFavoriteId/etc. already use there.
// DigestCard's own "Build This Recipe" button reads this to know which
// param to push.
const RECIPE_BUILDER_PARAM: Record<BuilderFavoriteItemType, string> = {
  side: 'openSideRecipeId',
  salad: 'openSaladRecipeId',
  smoothie: 'openSmoothieRecipeId',
  fermentation: 'openFermentationRecipeId',
  beverage: 'openBeverageRecipeId',
  snack: 'openSnackRecipeId',
  bakedGoods: 'openBakedGoodsRecipeId',
  soup: 'openSoupRecipeId',
  sauce: 'openSauceRecipeId',
  handheld: 'openHandheldRecipeId',
  dessert: 'openDessertRecipeId',
};

const DIGEST_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this tab is for',
    body: "So you're not left researching your own condition on your own. Real, cited findings on every one of the 19 tracked conditions plus general food, body, and gut science, organized so you can actually find what applies to you, alongside your own saved kitchen, favorites, and curated recipes.",
  },
  {
    heading: 'A growing set of categories, one evidence standard',
    body: 'Every entry here is tiered Strong/Moderate/Weak by its own actual evidence, the same discipline as this app\'s own 6 Dimensions scoring. A gold dot means trial-level support, not just "this app trusts it." This tab is meant to keep growing; if the picker below runs past what fits on screen at once, it scrolls.',
  },
  {
    heading: 'Search the whole Digest, or just one category',
    body: '"Search All" is its own selection in the menu below, right alongside Basic Health and every condition, pick it to search every entry in this Digest at once. Every other category also has its own, separate search box, scoped to just that one category\'s own entries, once it\'s open.',
  },
  {
    heading: 'A quick way back',
    body: 'A "‹ Back to Digest" link sits at the top of every category\'s own resting content, tap it to return straight to this tab\'s own resting screen, from any depth, so you can open the menu and pick something else. The moment you start searching within a category, that link becomes "‹ Clear search" instead, it clears the search and returns you to that same category\'s own main page, not out to the picker.',
  },
  {
    heading: 'Problem Foods & Swaps is different on purpose',
    body: 'Every other category reviews evidence. This one starts from a food, names the problem and mechanism, then gives substitutes, teaching food choices directly rather than reviewing a body of research.',
  },
  {
    heading: 'Related entries',
    body: 'Where a finding connects to another entry, often in a different category, a Related chip jumps straight there.',
  },
];

// Appended to every lens's own Info content below (DIGEST_LENS_HELP) --
// same shared-trailing-section pattern Insights already uses for its own
// DRILLING_DOWN_HELP, rather than repeating this same "how to use this
// screen" explanation inside all 13 lenses' own bespoke text.
const DIGEST_READING_HELP: HelpSection = {
  heading: 'Reading an entry',
  body: 'Tap any card in this category to expand it to its full write-up and citations. Tap it again, or tap a different card, to collapse it and jump to the new one. The colored dot on each card is its own evidence tier, same discipline as the rest of this app. Where a finding connects to another entry, a Related chip jumps straight there.',
};

// The 'search' lens's own dedicated Info-sheet content -- restored
// 2026-08-08 alongside 'search' itself becoming a real LensHub tile again
// (see LENSES' own comment for the fuller back-and-forth). DIGEST_READING_
// HELP is deliberately NOT appended here the way it is for every other
// lens's own `help` -- its own "tap a card to expand" instructions don't
// apply the same way to a results list built from search matches across
// every category at once.
const DIGEST_SEARCH_HELP: HelpSection[] = [
  {
    heading: 'Search All',
    body: 'Type a word or phrase to search every entry in this whole Digest at once, across every category, regardless of which one you searched last. Tap any result to jump straight to it, already expanded, in its own category.',
  },
  {
    heading: 'A different way to look, not the only way',
    body: 'Every other category also has its own, separate search box, scoped to just that one category\'s own entries, once you\'ve opened it, useful when you already know roughly where something lives and just want to narrow it down.',
  },
  {
    heading: 'Reading a result\'s own match info',
    body: 'Typing more than one word searches for each of them independently, not the exact phrase, a result can match one, some, or all of them. The "X of Y search terms matched" line and the small pills below it show exactly which ones did: a filled pill means that word appeared in the entry\'s own title (the strongest kind of match), an outlined pill means it only showed up in the body or a citation, and a dim pill means that particular word never appeared in this entry at all.',
  },
];

// A small, standalone (i) icon 2026-08-09, direct request, sitting above
// the search box next to the breadcrumb -- deliberately NOT folded into
// DIGEST_SEARCH_HELP above, which is a different, harder-to-reach thing:
// that only surfaces via LensHub's own Info tile, and only while sitting on
// the 'search' lens specifically. The little match dots this explains show
// up in EVERY category's own scoped search too, not just Search All, so
// this needs to be reachable from anywhere someone's actually searching,
// not gated behind picking one particular lens first. Uses its own local
// HelpSheet (see the JSX below) rather than useRegisterScreenHelp's single
// per-screen registration, for the same reason.
const SEARCH_MATCH_HELP_SECTIONS: HelpSection[] = [
  {
    // 2026-08-09, rewritten, direct correction: "the first sentence... does
    // not read well. Please use a better explanation that there is no way
    // someone could get confused about what you are telling them." Split
    // into several short, one-idea-at-a-time sentences instead of the
    // original single, over-stacked one.
    heading: 'How the ranking works',
    body: 'When you type more than one word, this search does not look for that exact phrase. It checks each word on its own, one at a time. An entry can show up in your results even if it only matches some of your words, not all of them, and the words do not need to appear in the same order you typed them. Every entry then earns a score: matching a word in the entry\'s own title is worth three times as much as matching that same word only in its body text or a citation. Entries with the highest score are always shown first, so something about what you searched for rises above something that only mentions it once in passing.',
  },
  {
    heading: 'What the dots mean',
    body: 'Each small dot stands for one of the words you typed, in the order you typed them, showing how that specific word did against that specific entry. A solid purple dot means that word matched the entry\'s own title, the strongest kind of match. An outlined purple dot means it matched somewhere in the entry\'s body or a citation, but not its title. A solid grey dot means that word did not match this entry at all.',
  },
  {
    // 2026-08-09, shortened to a pointer -- the real, worked comparison
    // against Search All now lives in the visual example below (see
    // SearchMatchDemo), not repeated here as a second description of the
    // same thing.
    heading: 'See it in action',
    body: 'A worked example is below, using the search "sleep anxiety inflammation" against three illustrative entries, both as the compact dots you see here, and as Search All\'s own fuller version.',
  },
];

// A real, worked example for the sheet above -- 2026-08-09, direct
// request: "Show examples of the dots... with a few examples, such as
// Sleep and Anxiety and Inflammation... then show how the dots would be
// if they were searched for from the digest search all utility, and
// explain the variations of the dots in the return search then compared
// to the section specific search[.]" These three "entries" are
// deliberately illustrative, clearly labeled as such (see SearchMatchDemo
// below), not real Digest content -- their only job is to show all three
// real dot/pill states (title match, body match, no match) across one
// three-word query, exactly the scenario asked about.
const DEMO_QUERY_LABEL = '"sleep anxiety inflammation"';
const DEMO_EXAMPLES: { title: string; note: string; match: SearchMatchInfo }[] = [
  {
    title: 'How Sleep Disruption Drives Inflammation',
    note: '"sleep" and "inflammation" both appear in this title, "anxiety" is never mentioned anywhere in it.',
    match: {
      totalTermCount: 3,
      matchedTermCount: 2,
      score: 6,
      terms: [
        { term: 'sleep', matchedInTitle: true, matchedAnywhere: true },
        { term: 'anxiety', matchedInTitle: false, matchedAnywhere: false },
        { term: 'inflammation', matchedInTitle: true, matchedAnywhere: true },
      ],
    },
  },
  {
    title: 'Managing Everyday Stress and Anxiety',
    note: '"anxiety" is right in the title; "sleep" only comes up once in the body text; "inflammation" never appears.',
    match: {
      totalTermCount: 3,
      matchedTermCount: 2,
      score: 4,
      terms: [
        { term: 'sleep', matchedInTitle: false, matchedAnywhere: true },
        { term: 'anxiety', matchedInTitle: true, matchedAnywhere: true },
        { term: 'inflammation', matchedInTitle: false, matchedAnywhere: false },
      ],
    },
  },
  {
    title: 'The Gut-Brain Connection',
    note: 'None of the three words are in this title, only "inflammation" shows up at all, once, in a citation.',
    match: {
      totalTermCount: 3,
      matchedTermCount: 1,
      score: 1,
      terms: [
        { term: 'sleep', matchedInTitle: false, matchedAnywhere: false },
        { term: 'anxiety', matchedInTitle: false, matchedAnywhere: false },
        { term: 'inflammation', matchedInTitle: false, matchedAnywhere: true },
      ],
    },
  },
];

// One real, bespoke explanation per lens for the LensHub Info tile --
// 2026-08-07, explicitly requested: "Write the information about each
// digest lens for the information icon to display about it explaining
// that lens, as we have been doing on each of the other lenshub menus."
// Previously every lens's own `help` just reused DIGEST_CATEGORY_META's
// own one-line `description` (already shown as this screen's own category
// subtitle, see categoryDescription below) -- fine as a picker-tile
// caption, too thin to stand alone as a real explanation the way Insights'
// own lens help write-ups already do (see e.g. that file's own "Reading
// the table"/"Food Lookup" sections). `description` itself is untouched --
// still used for the on-screen subtitle -- this is genuinely additional
// content, not a replacement for it.
const DIGEST_LENS_HELP: Record<DigestCategoryKey, HelpSection> = {
  basicHealth: {
    heading: 'Basic Health',
    body: "How the body itself works, independent of any diagnosis: a growing \"Essential Nutrients\" deep-dive series covering most major vitamins, minerals, and macronutrients, food additive dose-and-mechanism detail, food-and-swap entries for common everyday reactions (garlic, dairy, refined oils, commercial products), verified fermented-food bacterial strains, nutrient interactions (what helps or competes with what absorption), a food-industry and scapegoat history, general lifestyle and environmental exposures with no disease-specific claim, general exercise/autophagy biology, a full glossary, and general patient-advocacy skills like how to ask a doctor for a fuller lab panel. Deliberately excludes autoimmune-disease mechanisms and anything condition-specific, even when studied in a disease other than Hashimoto's, and excludes planet/agriculture-system content like soil, pollinators, and pesticides, that content lives in each condition's own area, or in Earth Matters, instead. This is what the Free tier shows in full. Organized as related groups, each its own horizontally-scrolling row, scroll a row sideways to browse its own tabs, or scroll the screen down to move to the next group. Tap a tab to open its full entry directly below that same row; tap a different tab in the same row to switch, without leaving the group. A search bar above the groups searches only within Basic Health.",
  },
  hashimotos: {
    heading: "Hashimoto's Disease",
    body: "Every Hashimoto's-specific and autoimmune-mechanism finding in this Digest, gathered into one area, the same way each other condition already has its own: thyroid-specific nutrients (selenium, iodine, and newer candidates), labs and medication timing (levothyroxine, biotin interference, TSH's own diurnal rhythm), what to eat at each healing stage, how the disease reaches past the thyroid into other organs, the dated history behind Hashimoto's own diagnosis and treatment, pregnancy-specific guidance, gut-barrier and microbiome science (SCFAs, zonulin, what actually repairs a leaky gut), complementary therapies evaluated against thyroid/autoimmune outcomes specifically, corroborating cross-disease evidence, a Hashimoto's-specific problem-foods list, and Hashimoto's own self-advocacy section: which lab tests to ask for, why, and how often.",
  },
  rheumatoidArthritis: {
    heading: 'Rheumatoid Arthritis',
    body: "This app's second condition, written as RA's own primary content rather than as evidence borrowed for someone else's disease. Covers the two food levers with the strongest trial evidence (omega-3s at a specific dose threshold, a Mediterranean eating pattern with disease-activity-score results), a landmark fasting-then-vegetarian trial that only holds up for a subset of people, and two medication interactions, methotrexate with folate, and methotrexate with alcohol, both more precise and more forgiving than the blanket warnings patients often hear. Closes on the common overlap between RA and Hashimoto's, the reason this condition was built first.",
  },
  psoriasis: {
    heading: 'Psoriasis',
    body: "This app's third condition, covering psoriasis and psoriatic arthritis on their own terms. Weight loss and a Mediterranean eating pattern both carry strong trial evidence with measured PASI-score improvement; alcohol tracks with worse disease (most clearly in men) and a striking mortality finding regardless of sex; a specific antibody-positive minority sees biopsy-confirmed skin improvement from cutting gluten. Also covers two findings reported as unproven rather than smoothed into false confidence, nightshade avoidance and oral vitamin D supplementation, plus two serious, specific medication-food interactions to know precisely rather than generally (cyclosporine with grapefruit, acitretin with alcohol).",
  },
  graves: {
    heading: "Graves' Disease",
    body: "This app's fourth condition, covering hyperthyroidism's most common cause on its own terms. In several ways it's the mirror image of this app's own Hashimoto's research: smoking raises Graves' eye-disease risk sharply while it lowers Hashimoto's risk, and iodine is both a trigger and a complication for antithyroid drug efficacy rather than simply something to avoid. Selenium carries strong trial evidence for mild eye disease specifically. Built with self-advocacy content from day one: TRAb/TSI antibody testing's own quantified remission and relapse odds, specific warning signs for antithyroid drug side effects, and the measurable bone-density loss untreated hyperthyroidism causes.",
  },
  type1Diabetes: {
    heading: 'Type 1 Diabetes',
    body: "This app's fifth condition, and a different shape from every one built before it: food's own daily relevance here isn't about triggering or avoiding a flare, it's about matching carbohydrate intake to insulin dosing accurately enough to stay safe. Covers carb-counting's own measured 21% average error and its direct link to worse blood glucose control, exercise and alcohol's own (and sometimes delayed) hypoglycemia risks, DKA's warning signs and a checkable ketone threshold, and the well-documented overlap with celiac disease. Built with self-advocacy content from day one: the full autoantibody panel behind diagnosis, Time in Range as a complement to HbA1c, and the screening intervals for eye and kidney complications that start years before any symptom would.",
  },
  celiac: {
    heading: 'Celiac Disease',
    body: "This app's sixth condition, and the one place here where a strict diet is the entire treatment, not one lever among several. Covers the 20ppm cross-contamination standard and what actually breaks it in a kitchen, the oats controversy (safe for most, a minority reacts to the oat protein itself), market data on what commercial gluten-free products get nutritionally wrong, and an age-dependent healing timeline most people underestimate. Built with self-advocacy content from day one: why going gluten-free before testing is the single most common diagnostic mistake, and a specific recommended age (45) for a bone-density scan. Closes on a quantified overlap with Hashimoto's roughly double the general population's own autoimmune thyroid risk.",
  },
  ibd: {
    heading: 'Inflammatory Bowel Disease',
    body: "This app's seventh condition, covering two distinct diseases, Crohn's disease and ulcerative colitis, under one umbrella. Several findings here run in opposite directions depending on which one someone actually has, most sharply smoking, which worsens Crohn's while protecting against ulcerative colitis. Covers exclusive enteral nutrition's strong remission rates in pediatric Crohn's, the low-fiber-during-a-flare advice's own surprisingly thin evidence, and a null result on Hashimoto's comorbidity overall (with one exception in older patients). Built with self-advocacy content from day one: fecal calprotectin as a non-invasive way to check gut inflammation, the colorectal cancer surveillance schedule (and why it moves up sharply with a specific complication), and azathioprine's own FDA-recommended genetic test before the first dose.",
  },
  multipleSclerosis: {
    heading: 'Multiple Sclerosis',
    body: "This app's eighth condition, and a different shape from every one built before it: MS attacks the brain and spinal cord directly, not the gut, joints, skin, or thyroid, so its own single strongest finding isn't a food at all, a 20-year study found MS risk rose 32-fold after Epstein-Barr virus infection, with a specific mechanism (a viral protein that closely resembles a piece of the nerve's own myelin coating) now understood behind it. Covers the head-to-head trial between the historic Swank diet and the newer Wahls Protocol (both helped), and two corrections on supplements that looked promising in an early trial but didn't hold up in a larger one, high-dose biotin and vitamin D. Also covers a striking overlap with Hashimoto's (present in 20-25% of untreated MS patients). Built with self-advocacy content from day one: JC virus antibody monitoring for a common MS medication's own rare but serious safety risk, how MS is actually diagnosed, and a fix for a common medication side effect.",
  },
  lupus: {
    heading: 'Lupus (SLE)',
    body: "This app's ninth condition, and a wide-ranging one: lupus can affect the skin, joints, kidneys, blood, and nervous system all at once, giving this category its own shape rather than one dominant theme. Covers one of the most specific, well-documented individual food triggers in this app's whole research base, alfalfa sprouts, via an amino acid (L-canavanine) the body mistakenly builds into its own proteins, plus a catch-22 unique to lupus: sun protection helps prevent a flare, but also raises vitamin D deficiency risk, with mixed trial evidence on whether treating that deficiency calms the disease itself. Also covers omega-3's own mixed evidence (positive trial results, but a genetic study pointing the other way on lupus risk) and a striking cardiovascular risk (a 50-fold heart-attack risk increase in young women) that ordinary risk factors don't fully explain. Built with self-advocacy content from day one: hydroxychloroquine's own eye-exam schedule, the lab panel that catches kidney involvement early, and the first lupus-specific biologic in over 50 years.",
  },
  sjogrens: {
    heading: "Sjögren's Syndrome",
    body: "This app's tenth condition, defined by an attack on the body's own moisture-making glands. Unlike most conditions here, it carries a direct, same-day relationship with food and drink, alcohol and caffeine worsen dryness within hours, not through a slower inflammatory pathway, and omega-3 has fairly consistent positive trial evidence for both dry eyes and dry mouth at once. Covers the mechanism behind Sjögren's own elevated dental-caries risk (saliva's protective role, lost, not just its comfort), a meaningfully elevated lymphoma risk stated plainly, a kidney complication (renal tubular acidosis) that can strike before the disease's own hallmark dryness is even recognized, and the substantial overlap with rheumatoid arthritis and lupus, both already covered elsewhere in this app. Built with self-advocacy content from day one: the antibody and gland tests behind an actual diagnosis, and how pilocarpine and cevimeline restore the body's own moisture production rather than just replacing it.",
  },
  pcos: {
    heading: 'PCOS',
    body: "This app's eleventh condition, and its first non-autoimmune one, PCOS is an endocrine and metabolic disorder, not an immune attack on the body's own tissue, with insulin resistance as the single mechanism driving most of what else happens. Covers the well-studied myo-inositol/D-chiro-inositol 40:1 ratio (one of the better-evidenced supplements anywhere in this app's research, already tracked in this app's own My Meds data), spearmint tea's anti-androgen trial evidence, and a quantified weight-loss finding (each 1% of body weight lost measurably raising the odds of ovulation returning). Also covers an elevated endometrial cancer risk tracing directly to PCOS's own anovulation mechanism, and a bidirectional overlap with Hashimoto's (each condition raising risk of the other). Built with self-advocacy content from day one: why a full glucose tolerance test catches what a simple fasting glucose misses, the cardiometabolic lab panel PCOS deserves beyond a fertility checklist, and spironolactone's own potassium caution.",
  },
  chronicKidneyDisease: {
    heading: 'Chronic Kidney Disease',
    body: "This app's twelfth condition, and its second non-autoimmune one, CKD's own dietary management (potassium, phosphorus, sodium, protein) is more directly food-restrictive than almost any other condition here. Leads with a correction to some of the most commonly repeated CKD dietary advice anywhere: blanket potassium restriction has surprisingly thin trial evidence behind it, and 2020 KDIGO guidelines themselves found the evidence insufficient for a graded recommendation. Covers \"hidden phosphorus\", food-additive phosphate absorbed at over 90% versus 20-60% from whole food, rarely labeled, specific low-protein diet guidance now favoring plant-forward sources, and a simple, evidence-backed fix (sodium bicarbonate) for a lesser-known complication (metabolic acidosis). Also covers SGLT2 inhibitors' major, kidney-protective effect, independent of their original diabetes purpose. Built with self-advocacy content from day one: why eGFR and urine albumin need tracking together, and ACE inhibitors/ARBs' own manageable potassium-monitoring schedule.",
  },
  fattyLiverDisease: {
    heading: 'Fatty Liver Disease',
    body: "This app's thirteenth condition, and its third non-autoimmune one, MASLD (metabolic dysfunction-associated steatotic liver disease, the current, more precise name for what used to be called NAFLD) is built on top of a substantial amount of pre-existing liver research already in this app, written for a Hashimoto's reader, cross-linked here rather than repeated. Covers a graded weight-loss staircase (3% for histological benefit to begin, 10% for the strongest fibrosis regression), a nuance in the Mediterranean diet's own evidence (a plainer low-fat diet works about as well), coffee as one of the more consistently protective findings anywhere in this app's research, and a contested alcohol-threshold question (MetALD) that current guidance is still working out. Also covers two recent medication stories: resmetirom, the first-ever approved MASH drug, which works through a thyroid hormone receptor directly, an elegant echo of this app's own core focus, and semaglutide's large 2025 trial results. Built with self-advocacy content from day one: FIB-4, a low-cost fibrosis-screening tool often calculable from labs already drawn.",
  },
  type2Diabetes: {
    heading: 'Type 2 Diabetes',
    body: "This app's fourteenth condition, and its fourth non-autoimmune one, T2D sits at the center of the metabolic-syndrome cluster already built out across PCOS, MASLD, and CKD, cross-linked heavily to that existing content rather than re-derived. Covers an important distinction from Type 1 Diabetes (already covered in its own category, often confused with T2D by name alone, with different screening timelines that follow directly from that distinction), the DiRECT trial's own striking remission rates (46% at one year), and low-carbohydrate diets' own short-term evidence, with its limits stated plainly. Also covers a recent treatment-guideline paradigm shift toward GLP-1/SGLT2 medications chosen for their own organ-protective benefits, not glucose control alone, and a quantified sulfonylurea hypoglycemia risk sharply elevated by reduced kidney function. Built with self-advocacy content from day one: a correction to \"lower HbA1c is always better,\" backed by trials finding intensive control didn't reduce cardiovascular risk while increasing harm.",
  },
  ibs: {
    heading: 'Irritable Bowel Syndrome',
    body: "This app's fifteenth condition, and its fifth non-autoimmune one, IBS is a disorder of gut-brain interaction, not structural intestinal damage, leaning heavily on cross-links to this app's own already-built FODMAP and gut-microbiome content rather than re-deriving it. Covers an important distinction from IBD (already covered in its own category, often confused with IBS by name alone, IBS carries no inflammation and no elevated cancer risk, the opposite of IBD), non-dietary interventions with meaningful trial support (peppermint oil, gut-directed hypnotherapy), and a striking, underappreciated mechanism: post-infectious IBS may account for over half of all US cases, tracing back to a specific, identifiable past illness. Also covers non-FODMAP triggers (coffee, alcohol, artificial sweeteners) with their own documented timing, and two subtype-targeted medications with different mechanisms. Built with self-advocacy content from day one: the specific red-flag symptoms and diagnostic workup, including a thyroid panel, that should come before assuming IBS by default.",
  },
  migraine: {
    heading: 'Migraine',
    body: "This app's sixteenth condition, and its sixth non-autoimmune one, migraine is a neurological disease, not \"just a bad headache,\" with a specific signaling molecule (CGRP) central to how an attack actually happens. Covers a correction to popular food-trigger lists (tyramine's reputation as the culprit behind aged cheese and red wine doesn't fully hold up under refined modern measurement, and chocolate's own evidence is mixed), the magnesium/riboflavin/CoQ10 combination's own specific trial results, and CGRP inhibitors, the first medication class ever built specifically for migraine prevention. Also covers medication-overuse headache (a named condition with a specific day-per-month threshold), menstrual migraine's own leading explanation alongside its evidence gaps, and caffeine's double role as both trigger and withdrawal cause. Built with self-advocacy content from day one: the specific red-flag symptoms that mean a headache needs more than migraine management.",
  },
  cardiovascularDisease: {
    heading: 'Cardiovascular Disease',
    body: "This app's seventeenth condition, and its seventh non-autoimmune one, cardiovascular disease was already touched from five separate angles across this app's existing content (lupus's own 50-fold heart attack risk in young women, Hashimoto's own organ-systems research on hypothyroid heart effects, PCOS's own lipid-panel entry, and both psoriasis's and rheumatoid arthritis's own self-advocacy entries on elevated cardiovascular risk) before this category itself existed to link back to. Covers whole-food dietary patterns with trial support (the Mediterranean diet, including PREDIMED's own 2018 retraction-and-correction story, and DASH's specific sodium targets), a large, consistent statin evidence review, and two examples of medical guidance shifting because a large trial's own numbers said so: daily aspirin for primary prevention (a quantified trade-off between preventing vascular events and causing major bleeding) and omega-3 supplementation (a null result from the same trial). Built with self-advocacy content from day one: lipid-panel testing intervals (with a brief, narrowly-scoped note on apolipoprotein B) and the specific heart attack warning symptoms, including a documented pattern that differs by sex.",
  },
  gout: {
    heading: 'Gout',
    body: "This app's eighteenth condition. Gout is a different shape of condition from most already covered: its own best evidence is a specific, individually well-studied list of foods and drinks rather than one broad dietary pattern. Covers quantified findings on meat and seafood (raising risk) alongside dairy (lowering it, from the same study), sugar-sweetened drinks and fructose (a dose-dependent risk diet soda doesn't share), beer specifically (carrying outsized risk compared to spirits, with wine showing none), and three individually-tested protective foods: cherries (including a striking combined effect with allopurinol), vitamin C, and coffee. Covers a serious cardiovascular safety difference between the two most common urate-lowering medications, and gout's own direct overlap with heart, kidney, and metabolic conditions already built out elsewhere in this app. Built with self-advocacy content from day one: HLA-B*58:01 genetic testing before starting allopurinol in specific, named higher-risk populations, and recognizing when a flare might actually be a more urgent joint infection.",
  },
  prostateHealth: {
    heading: 'Prostate Health',
    body: "This app's nineteenth condition, covering benign prostatic hyperplasia (BPH) and prostate cancer risk, two extremely common conditions (BPH affects roughly half of men by their 50s, most by their 70s; prostate cancer is the most commonly diagnosed cancer in American men) with a direct gut-microbiome connection. Covers gut dysbiosis's link to BPH through the same short-chain-fatty-acid mechanism this app's Gut & Microbiome content already documents, and a striking finding: specific gut bacteria can directly manufacture androgens from hormone precursors, and convert dietary choline into a compound (TMAO) linked to a quantified increase in lethal prostate cancer. Covers two individually strong protective foods (lycopene/tomatoes, cruciferous vegetables), the prostate's own distinctive zinc concentration, and two supplement corrections: a landmark trial found selenium doesn't prevent prostate cancer (and its usual supplement partner may raise risk), and saw palmetto's popularity outruns its mixed evidence. Self-advocacy covers a lab-interpretation trap (BPH medications cut PSA roughly in half) and PSA screening's own quantified benefit-versus-harm tradeoff.",
  },
  // 2026-08-09, added alongside 'homeGardening' below: everything about the
  // planet, pollinators, chemical producers, and the economics/politics of
  // who controls food production moved here out of Basic Health, since it's
  // genuinely about the food system rather than the human body. See
  // foodIndustryHistory.ts's own header comment for the full reassignment.
  earthMatters: {
    heading: 'Earth Matters',
    body: 'Everything in this Digest about the planet the food system actually runs on, moved out of Basic Health since it describes the food system itself rather than the human body. Covers soil health and depletion, water use and the Ogallala Aquifer, the pesticide industry (DDT as a resolved case, glyphosate as a live dispute, and antibiotic resistance from livestock), the current pollinator crisis and which crops depend on pollinators most, seed diversity and industry consolidation, several dated international case studies in regenerative farming (Brazil, Niger, China), the lobbying and policy fights shaping all of this, and concrete, ways an individual can act on any of it, through voting, purchasing, shareholder activism, or direct investment.',
  },
  // 2026-08-09, same day, a genuinely new topic: real guidance on growing
  // food at home as a real, practical way to subsidize grocery cost. See
  // homeGardening.ts's own header comment.
  homeGardening: {
    heading: 'Gardening',
    body: "Cited guidance on growing fresh food at home, organized so it's actually usable in whichever climate someone lives in. Covers the economics of what a home garden saves, how to find and read a growing zone (the USDA Plant Hardiness Zone Map plus a short note on other countries' own systems), what to plant in four climate bands from short-season cold to true tropical, growing food in containers with no yard at all, which crops return the most grocery value, the easiest crops for a first garden, ways to extend a growing season, a measured freshness benefit over shipped produce, a soil-safety caution for urban soil, and a direct link to this app's own Earth Matters pollinator research, growing even a small amount of food at home is an individual-level way to act on several of that category's own larger findings.",
  },
  // 2026-08-14, direct request: "a new category of Recipes... will be
  // available." One card per bundled starter recipe, tap it to see the
  // whole ingredient list, then a "Build This Recipe" button opens the
  // matching Food builder with everything already filled in.
  recipes: {
    heading: 'Recipes',
    body: 'A pre-built starting point for every direct-ingredient Food builder: sides, salads, smoothies, fermentations, beverages, snacks, baked goods, soups, sauces, and handhelds. Each card shows the real flavor profile and health benefit up front, and a "Build This Recipe" button opens the matching builder already loaded with every ingredient, quantity, and prep step, ready to adjust, save, or log as-is.',
  },
  myKitchen: {
    heading: 'My Kitchen',
    body: 'Everything you\'ve saved from any Food builder, all in one place, with the same real ingredient list, yield, and nutrition detail Recipes gets, computed live from your own tracked conditions. Schedule anything here for a future date, or share it with someone else.',
  },
  myFavorites: {
    heading: 'My Favorites',
    body: 'Your favorited builds from every category, plus favorite meals, browsable the same way as My Kitchen. Favoriting something already tells this app you\'d make it again -- this is the place to actually do that: rebuild it, schedule it, or share it.',
  },
};

// A deliberate line-break point for each category name that's long enough
// to need one (see LensHub's own itemLabelLines), so the grid item's own
// auto-wrap never has to guess where to break -- 2026-08-07, explicitly
// requested: "Make sure the names of the icons have a forced carriage
// return at a logical spot." Every entry here breaks after a natural
// phrase boundary (usually right after an "&") so both halves still read
// as coherent pieces on their own, rather than wherever plain word-wrap
// happens to land. Short names that already fit comfortably on one line
// (Food Additives, Gut & Microbiome, Fermented Foods, Healing Stages) are
// deliberately left out -- forcing an unnecessary break on a name that
// already fits would just leave the second line looking sparse.
// Only affects the grid tile's own label (LensOption.gridLabel) -- the
// plain, unbroken `label` is still what's used everywhere else this name
// appears (the Info sheet's own heading, activeLensLabel, etc.).
// Empty as of the 2026-08-08 restructure to real per-condition names --
// checked again 2026-08-21 against the grid's real column width at the
// 3-column layout above, and every current label (Basic Health,
// Hashimoto's Disease, Rheumatoid Arthritis, Psoriasis, and all 15 other
// real conditions) still wraps cleanly to 2 lines on its own via plain
// word-wrap, with no ugly mid-phrase break to correct. Kept as a real,
// live mechanism (not deleted) since a future, longer condition name may
// still need it.
const DIGEST_GRID_LABEL_BREAKS: Partial<Record<DigestCategoryKey, string>> = {};

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
type BasicHealthSubtopic = { label: string; prefixes: string[] };
// 2026-08-23: `description` added, direct report that drilling into a
// subgroup (Essential Nutrients named directly) left its own header with
// nothing explaining what that subgroup actually covers or how it fits
// into Basic Health as a whole, once the generic "Food, vitamins,
// minerals..." Basic Health description stopped showing there. One short,
// specific line per topic, not a repeat of that shared blurb.
type BasicHealthTopic = { label: string; description: string; prefixes?: string[]; subtopics?: BasicHealthSubtopic[] };

const BASIC_HEALTH_TOPICS: BasicHealthTopic[] = [
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
  {
    label: 'How Your Body Works: Organs & Systems',
    description:
      "How your organs and body systems work, and how food and nutrient levels affect each one, independent of any specific condition. The foundation every condition-specific finding in this Digest builds on.",
    prefixes: ['body-'],
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
    description: 'Plain definitions for medical, nutrition, and lab terminology used throughout this Digest.',
    prefixes: ['glossary-'],
  },
  // 2026-08-09, direct request: "information about portions, and
  // recommended daily allowances and minimum amounts of anything." See
  // lib/digest/portionsAndRDAs.ts's own header comment -- every number
  // reused directly from this app's own bundled DRI reference table.
  {
    label: 'Portions & Recommended Amounts',
    description: "How much of each nutrient you need, and what a serving size actually looks like, drawn from this app's own bundled dietary reference intake data.",
    prefixes: ['portion-'],
  },
  // 2026-08-09, direct request: "how to choose the right kinds of
  // products... so they aren't fooled and purchase the wrong things." See
  // lib/digest/choosingQualityProducts.ts's own header comment.
  {
    label: 'Choosing the Real Thing',
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
  // A real, general Mental Health deep-dive, the same "scattered across
  // conditions, never its own topic" gap as Sleep above. See
  // lib/digest/mentalHealth.ts's own header comment.
  {
    label: 'Mental Health & Food',
    description: 'How diet and specific nutrients affect mood, cognition, and mental health.',
    prefixes: ['mentalhealth-'],
  },
  {
    label: 'Prevention & Lifestyle by Condition',
    description: 'What to eat and which lifestyle habits help prevent or manage each of the 19 conditions this app tracks, organized by condition.',
    prefixes: ['prevention-', 'apphelps-'],
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
  {
    label: 'Popular Diets & Eating Styles',
    description: 'An evidence-based look at popular diets, keto, paleo, intermittent fasting, and more, organized by philosophy rather than by condition.',
    prefixes: ['diet-', 'pbn-'],
  },
  {
    label: 'Problem Foods & Swaps',
    description: 'Foods worth watching for common problems, and practical swaps for each one.',
    prefixes: ['problem-'],
  },
  {
    label: 'Food Additives',
    description: 'What common food additives and preservatives actually do, and what the evidence says about their effects.',
    prefixes: ['additive-'],
  },
  {
    label: 'Nutrient Interactions',
    description: "Which nutrients help or block each other's absorption, and how to time meals and supplements to work with your body instead of against it.",
    prefixes: ['interaction-'],
  },
  {
    label: 'Fermented Foods',
    description: 'The health benefits of fermented foods, organized by the specific bacterial strains and cultures behind them.',
    prefixes: ['fermented-'],
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
  {
    label: 'Fruits, Vegetables, Nuts & Seeds',
    description: 'The health benefits, and things worth knowing, about specific fruits, vegetables, nuts, and seeds.',
    prefixes: ['produce-'],
  },
  {
    label: 'Lifestyle & Environment',
    description: 'How everyday lifestyle and environmental factors, beyond diet alone, affect your health.',
    prefixes: ['lifestyle-'],
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
];

// A real, dynamic safety net, not a hardcoded 32nd topic -- only ever
// appears if a real Basic Health entry's own id doesn't match any prefix
// above, the same "unmatched catch-all, not an expected real bucket" role
// the old flat list's own 'More' bucket already played.
const BASIC_HEALTH_MORE_TOPIC_LABEL = 'More';
// A short description for the same dynamic catch-all, 2026-08-23 -- not
// stored on a BasicHealthTopic entry, since 'More' never has one, but
// needed by the same drilled-in header every real topic's own description
// feeds.
const BASIC_HEALTH_MORE_TOPIC_DESCRIPTION = "Entries that cover general health topics without fitting neatly into one of Basic Health's other groups.";

function basicHealthTopicPathForEntryId(id: string): string[] {
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
function sortDigestEntriesLogically(entries: AnyDigestEntry[]): AnyDigestEntry[] {
  const titleOf = (entry: AnyDigestEntry) => (isProblemFoodEntry(entry) ? entry.foodName : entry.title);
  return [...entries].sort((a, b) => {
    const aOverview = a.id.endsWith('overview');
    const bOverview = b.id.endsWith('overview');
    if (aOverview !== bOverview) return aOverview ? -1 : 1;
    const aTying = isTyingTogetherEntry(a);
    const bTying = isTyingTogetherEntry(b);
    if (aTying !== bTying) return aTying ? 1 : -1;
    return titleOf(a).localeCompare(titleOf(b));
  });
}

function basicHealthEntriesForPrefixes(entries: AnyDigestEntry[], prefixes: string[]): AnyDigestEntry[] {
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
function basicHealthAllGroups(entries: AnyDigestEntry[]): { label: string; entries: AnyDigestEntry[] }[] {
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

// CONDITION_CODE_TO_DIGEST_KEY used to be defined locally here -- moved
// into its own shared lib/conditionCodeMap.ts, 2026-08-09, once Profile's
// own new TabHub-icon picker needed the identical snake_case-to-camelCase
// lookup (see that file's own header comment for the full reasoning) --
// one real source now, imported below, not two independently-maintained
// copies. Still used the same way here: figuring out which lens tiles
// correspond to conditions the person has actually told the app they have
// (via Profile's own condition picker, `user_conditions`) -- see
// pinnedDigestKeys below.

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
type ConditionTopic =
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

// Real row order, most inviting/actionable first -- Diet & Food leads
// deliberately (this app's own core mission, and the single most concrete,
// "I want to read more" topic most conditions carry); Core Science follows
// as the grounding/mechanism read; the Hashimoto's-only clusters (Gut &
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
const CONDITION_TOPIC_ORDER: ConditionTopic[] = [
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
function isTyingTogetherEntry(entry: AnyDigestEntry): boolean {
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
function classifyConditionTopic(entry: AnyDigestEntry): ConditionTopic {
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

// Buckets a condition's own entry list into the real topics above, with
// the "tying together" synthesis entry (if the condition has one) pulled
// out separately rather than folded into any of them -- shaped
// (`{label, entries}[]`) to match exactly what BasicHealthShelves below
// already expects, the shared shelf-row-plus-detail-panel component every
// condition's own topic grouping renders through.
function groupConditionEntries(entries: AnyDigestEntry[]): {
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
  const topics = CONDITION_TOPIC_ORDER.map((topic) => ({
    label: topic as string,
    entries: sortDigestEntriesLogically(buckets.get(topic) ?? []),
  })).filter((group) => group.entries.length > 0);
  return { topics, tyingTogether };
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
type EarthMattersTopic =
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
const EARTH_MATTERS_TOPIC_ORDER: EarthMattersTopic[] = [
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

function classifyEarthMattersTopic(entry: AnyDigestEntry): EarthMattersTopic {
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
  if (
    id.includes('brazil-case-study') ||
    id.includes('niger-fmnr') ||
    id.includes('china-loess-plateau') ||
    id.includes('rodale-farming-systems-trial') ||
    id.includes('netherlands-nitrogen-conflict') ||
    id.includes('individual-farm-case-study')
  ) {
    return 'Case Studies From Around the World';
  }
  if (id.includes('timeline-origins') || id.includes('timeline-certification-era') || id.includes('green-revolution')) {
    return 'History & Origins of the Movement';
  }
  if (id.includes('pesticides-') || id.includes('neonicotinoid')) return 'Pesticides & Chemical Inputs';
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
    id.includes('tribal-co-stewardship')
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
    id.includes('regen-environmental-impact') ||
    id.includes('no-till-greenwashing') ||
    id.includes('cover-crop-reality-check')
  ) {
    return 'Industry, Greenwashing & Honest Limits';
  }
  // Everything else remaining (verified via the throwaway script above to
  // be exactly the real soil-science/mechanism/urgency entries) falls here.
  return 'Soil Science & Why It Matters';
}

function groupEarthMattersEntries(entries: AnyDigestEntry[]): {
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
  const topics = EARTH_MATTERS_TOPIC_ORDER.map((topic) => ({
    label: topic as string,
    entries: sortDigestEntriesLogically(buckets.get(topic) ?? []),
  })).filter((group) => group.entries.length > 0);
  return { topics, tyingTogether };
}

type HomeGardeningTopic =
  | 'Getting Started: Zones, Climate & Site'
  | 'What to Grow First'
  | 'Building Real Soil'
  | 'Your Garden & Your Microbiome'
  | 'Growing Techniques'
  | 'After the Harvest'
  | 'The Real Case for a Home Garden';

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
const HOME_GARDENING_TOPIC_ORDER: HomeGardeningTopic[] = [
  'Getting Started: Zones, Climate & Site',
  'What to Grow First',
  'Building Real Soil',
  'Your Garden & Your Microbiome',
  'Growing Techniques',
  'After the Harvest',
  'The Real Case for a Home Garden',
];

function classifyHomeGardeningTopic(entry: AnyDigestEntry): HomeGardeningTopic {
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
    id.includes('cover-crops-home')
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
    id.includes('extending-the-season')
  ) {
    return 'Growing Techniques';
  }
  if (id.includes('preserving-the-harvest') || id.includes('seed-saving') || id.includes('freshness-nutrient-retention')) {
    return 'After the Harvest';
  }
  // Everything else remaining (verified via the throwaway script above to
  // be exactly the real economics/mental-health/community/pollinator-link
  // entries) falls here.
  return 'The Real Case for a Home Garden';
}

function groupHomeGardeningEntries(entries: AnyDigestEntry[]): {
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
  const topics = HOME_GARDENING_TOPIC_ORDER.map((topic) => ({
    label: topic as string,
    entries: sortDigestEntriesLogically(buckets.get(topic) ?? []),
  })).filter((group) => group.entries.length > 0);
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
type RecipeTopic =
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
const RECIPES_TOPIC_ORDER: RecipeTopic[] = [
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

function classifyRecipesTopic(entry: AnyDigestEntry): RecipeTopic {
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

// Deliberately no "tying together" pull here -- RECIPES_ENTRIES has no such
// closing synthesis entry (44 individual recipes, nothing to summarize
// across), but the function still returns the same real
// {topics, tyingTogether} shape every other category's own grouping
// function does, with tyingTogether always null, so groupEntriesForLens
// below can dispatch to it without a special case.
function groupRecipesEntries(entries: AnyDigestEntry[]): {
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

// My Kitchen/My Favorites (2026-08-15) group by the same real per-type
// shelf order Recipes' own RECIPES_TOPIC_ORDER already uses, plus a real
// "Favorite Meals" 12th group for My Favorites specifically -- but reads
// each entry's own dynamicGroupLabel directly (set once, at build time, in
// lib/digestDynamicEntries.ts) rather than re-deriving a topic from
// linkedBuilderType the way classifyRecipesTopic does, since these
// entries' real grouping is already known the moment they're built.
const DYNAMIC_ENTRY_GROUP_ORDER = [
  // 2026-08-15, direct request: "it shows up in their My Kitchen area
  // under a heading of Recipes Shared With Me" -- leads the whole shelf,
  // since a real, genuine share someone just sent is the thing most worth
  // seeing first.
  'Recipes Shared With Me',
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
  'Favorite Meals',
];

function classifyDynamicEntryTopic(entry: AnyDigestEntry): string {
  return (!isProblemFoodEntry(entry) && entry.dynamicGroupLabel) || 'Other';
}

function groupDynamicEntries(entries: AnyDigestEntry[]): {
  topics: { label: string; entries: AnyDigestEntry[] }[];
  tyingTogether: AnyDigestEntry | null;
} {
  const buckets = new Map<string, AnyDigestEntry[]>();
  for (const entry of entries) {
    const label = classifyDynamicEntryTopic(entry);
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label)!.push(entry);
  }
  const ordered = DYNAMIC_ENTRY_GROUP_ORDER.filter((label) => buckets.has(label)).map((label) => ({
    label,
    entries: sortDigestEntriesLogically(buckets.get(label)!),
  }));
  // A real safety net, not expected to ever fire given
  // digestDynamicEntries.ts only ever sets one of the labels above -- any
  // real group outside that fixed order sorts alphabetically after it
  // rather than silently dropping content.
  const extra = [...buckets.keys()]
    .filter((label) => !DYNAMIC_ENTRY_GROUP_ORDER.includes(label))
    .sort((a, b) => a.localeCompare(b))
    .map((label) => ({ label, entries: sortDigestEntriesLogically(buckets.get(label)!) }));
  return { topics: [...ordered, ...extra], tyingTogether: null };
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
function classifyTopicForCategory(entry: AnyDigestEntry, category: DigestCategoryKey): string {
  if (category === 'earthMatters') return classifyEarthMattersTopic(entry);
  if (category === 'homeGardening') return classifyHomeGardeningTopic(entry);
  if (category === 'recipes') return classifyRecipesTopic(entry);
  if (category === 'myKitchen' || category === 'myFavorites') return classifyDynamicEntryTopic(entry);
  return classifyConditionTopic(entry);
}

function groupEntriesForLens(
  category: DigestCategoryKey,
  entries: AnyDigestEntry[],
): {
  topics: { label: string; entries: AnyDigestEntry[] }[];
  tyingTogether: AnyDigestEntry | null;
} {
  if (category === 'earthMatters') return groupEarthMattersEntries(entries);
  if (category === 'homeGardening') return groupHomeGardeningEntries(entries);
  if (category === 'recipes') return groupRecipesEntries(entries);
  if (category === 'myKitchen' || category === 'myFavorites') return groupDynamicEntries(entries);
  return groupConditionEntries(entries);
}

// A fixed, internal-only ref key for a condition's own standalone "tying
// together" card, shared across every condition -- safe despite being the
// same literal string everywhere, since groupRefs itself is reset to `{}`
// on every lens switch (see the LensHub onSelect/jumpToRelated below), so a
// previous condition's own stale ref under this same key can never survive
// long enough to be scrolled to by mistake.
const TYING_TOGETHER_GROUP_KEY = '__tying-together__';

// How far above a scrolled-to card's own top edge to stop -- 2026-08-07,
// set to the exact figure given directly: "The header of the one I
// tapped should be at the top of the screen under the app's own header
// section by about 10 pixels." Hoisted to module scope 2026-08-08 so
// BasicHealthShelves' own detail panel (a separate, module-level
// component) can reference it too, not just PurpleDigestScreen itself.
const ENTRY_SCROLL_TOP_MARGIN = 10;

// How long the card list's own LinearTransition (on each card's own
// Animated.View) takes to finish sliding every card into its real, final
// position after an expand/collapse -- pinned to an explicit number here
// (LinearTransition.duration(CARD_LAYOUT_TRANSITION_MS)) rather than left
// at Reanimated's own implicit default, specifically so scrollEntryIntoView
// has a real, known number to wait out instead of guessing at one.
const CARD_LAYOUT_TRANSITION_MS = 300;
// A little slack on top of the animation's own real duration -- covers
// ordinary JS-thread/bridge scheduling delay, not because the animation
// itself is expected to run long.
const CARD_LAYOUT_SETTLE_BUFFER_MS = 60;

// Extra ScrollView bottom padding added ONLY while a card is expanded, so a
// group near the real end of a category's content can still scroll all the
// way up under the fixed header without the native scrollTo call clamping
// short -- see PurpleDigestScreen's own scrollNodeIntoView comment for the
// full reasoning. Deliberately a fixed, generous constant rather than a
// live useWindowDimensions() read: this value only has to be "clearly more
// than any real screen could ever need," never pixel-precise, so there's no
// reason to pay for a dimension-change subscription (and the resulting
// unstable style-object identity on every render) to get it. Hoisted to
// module scope for the same reason as the constants above -- a stable
// value, not something that needs recomputing per render.
const EXPANDED_EXTRA_SCROLL_PADDING = 1200;

function tierColor(tier: EvidenceTier): string {
  if (tier === 'strong') return colors.accent;
  if (tier === 'moderate') return colors.primary;
  return colors.textMuted;
}

function tierLabel(tier: EvidenceTier): string {
  if (tier === 'strong') return 'Strong evidence';
  if (tier === 'moderate') return 'Moderate evidence';
  return 'Weak / early evidence';
}

export default function PurpleDigestScreen() {
  useRegisterScreenHelp('Digest', DIGEST_HELP_SECTIONS, '/purple-digest');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  // 2026-08-09, real, direct report, reproduced with exact steps: "scroll
  // farther down below the one I had opened and open another a few down
  // below it, it scrolls way up the screen and then back down again with
  // the newly opened item just off the screen below the app footer."
  // scrollBottomPadding above is deliberately small -- sized only to clear
  // the floating TabHub/LensHub button (see its own comment), not to let
  // an arbitrary group scroll all the way up to sit just below the fixed
  // header. For a group sitting anywhere within roughly one screen height
  // of the real end of a category's content (exactly what "scroll farther
  // down, then tap something further down" reaches), scrollNodeIntoView's
  // own computed target legitimately exceeds the ScrollView's own real
  // maximum scroll extent -- the native scrollTo call simply clamps to
  // that real maximum, landing well short of the intended 10px-below-
  // header position, with the newly-expanded detail panel (which just
  // added real height right at the tail end of the content) ending up
  // partly or fully below the visible screen with no further room to
  // scroll it into view. A real, structural cause, not a timing race --
  // this is why the two earlier timing-focused fixes made no visible
  // difference. Fixed by adding real, extra bottom padding, but ONLY while
  // an entry is actually expanded -- applying it unconditionally would
  // leave a large, empty, confusing gap at the bottom of ordinary scrolling
  // with nothing open, which is a real, different problem this fix doesn't
  // need to introduce to solve the one that was actually reported.
  //
  // 2026-08-09, real, direct follow-up report, same day, right after
  // confirming the scroll fix itself worked: "the keyboard is slow to
  // react again... you have fixed this before." The first version of this
  // fix reached for useWindowDimensions() to size the extra padding against
  // the real, live device height -- reasonable-sounding, but it subscribes
  // this whole large screen to every dimension-change event RN fires, and
  // (worse) the resulting value was used to build a brand-new
  // contentContainerStyle array/object on every single render, forcing a
  // full Yoga layout recompute of a now much taller ScrollView on every one
  // of those renders. Neither risk is worth taking for a value that never
  // needed device precision in the first place -- this only has to be
  // "clearly more than any real screen could ever need," not exact, so a
  // fixed, generous constant does the identical job with none of the
  // subscription/re-render risk (see EXPANDED_EXTRA_SCROLL_PADDING, hoisted
  // to module scope above alongside the other layout-timing constants).
  // Also memoized below (see scrollContentContainerStyle) so the style
  // object itself only gets a new identity when expandedId's own
  // open/closed state actually changes, not on every unrelated render --
  // the second, independent half of the same real fix.
  const autoOpenLensHub = useAutoOpenLensHubSignal();
  // The real value actually handed to LensHub's own autoOpenSignal prop --
  // 2026-08-08, widened from just autoOpenLensHub (a TabHub-navigation-only
  // signal, see useAutoOpenLensHubSignal's own comment) to also react to a
  // real, deliberate in-screen tap: "when I hit back to digest breadcrumb
  // from any section, it should close the current section and display the
  // Digest LensHub menu." Unlike the two earlier, reverted "always
  // auto-open on arrival" attempts LensHub.tsx's own history already
  // documents, this isn't gated on arriving at the screen at all -- it only
  // fires from an explicit tap on the "‹ Back to Digest" link itself, so a
  // horizontal swipe between tabs (which never touches this state) still
  // can't trigger it, the same real distinction that made autoOpenLensHub
  // itself safe to reintroduce. Kept as its own state (not just passing
  // autoOpenLensHub straight through) so either source -- a real TabHub
  // navigation, or this screen's own back-link tap -- can independently
  // bump it to a fresh value at its own time, with LensHub's own
  // already-existing "is this genuinely a NEW value" dedup below deciding
  // whether to actually open.
  const [openTrigger, setOpenTrigger] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (autoOpenLensHub) setOpenTrigger(autoOpenLensHub);
  }, [autoOpenLensHub]);

  // A deep link straight into one specific category, 2026-08-16 -- built
  // for the Food builders' own new "Or Find a Recipe" links (My Kitchen /
  // Recipes Shared With Me / Recipes / My Favorites all point straight
  // here now, rather than the builder itself showing a duplicated, stripped-
  // down recipe list -- see SideBuilder.tsx's own header comment on that
  // section for the full reasoning). Read once here and consumed by the
  // focus effect just below; anything other than these three real category
  // keys is ignored, falling through to the ordinary reset. Mirrors
  // food.tsx's own editSideId-style deep-link params exactly, including why
  // this is safe to leave unconsumed after the fact: SwipeableTabScreen's
  // own swipe-driven navigation never carries params at all, so a later
  // swipe away and back always lands back on a bare, param-free route.
  // openEntryId, 2026-08-23: a real deep link straight to one specific
  // entry's own card, not just its category -- built for Home's own
  // Digest flip cards ("Read more" needs to land on the exact entry it
  // teased, not just that entry's own lens). Handled in the same
  // useFocusEffect below as openDigestLens, via the same jumpToRelated
  // this screen's own Related-entry chips already use, rather than a
  // second, parallel navigation mechanism.
  const { openDigestLens, openEntryId } = useLocalSearchParams<{ openDigestLens?: string; openEntryId?: string }>();
  const [lens, setLens] = useState<PurpleDigestLens>('basicHealth');
  // Hide-sync for any Digest entry tagged with `relatedFoodNames` (currently
  // just the Fruits, Vegetables, Nuts & Seeds profile guide -- see
  // lib/db.ts's own getVisibleFoodBaseNames comment) -- "if any of them get
  // hidden in the database... then their information should also
  // disappear." One bulk query on mount for every real food name any entry
  // in this whole Digest is tagged with, not one query per entry. `null`
  // means "still loading" -- entries.useMemo below deliberately treats that
  // as "show everything" rather than hiding food-tagged entries for the
  // brief window before this resolves, so a real slow load never reads as
  // content disappearing.
  const [visibleFoodNames, setVisibleFoodNames] = useState<Set<string> | null>(null);
  useEffect(() => {
    let cancelled = false;
    const allRelatedFoodNames = Array.from(
      new Set(
        ALL_DIGEST_ENTRIES.flatMap((entry) =>
          !isProblemFoodEntry(entry) && entry.relatedFoodNames ? entry.relatedFoodNames : [],
        ),
      ),
    );
    getVisibleFoodBaseNames(allRelatedFoodNames).then((names) => {
      if (!cancelled) setVisibleFoodNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  // The person's own selected conditions (Profile's own picker,
  // `user_conditions`), refetched every time this tab regains focus so a
  // condition added or removed on Profile shows up here without needing an
  // app restart. Used only to reorder/highlight the LensHub picker below --
  // never gates anything, every category stays fully reachable regardless.
  const [userConditionCodes, setUserConditionCodes] = useState<string[]>([]);
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getUserConditions()
        .then((codes) => {
          if (!cancelled) setUserConditionCodes(codes);
        })
        .catch(() => {
          // Best-effort only -- a failure here just means the picker falls
          // back to its own original, unpinned order, never a broken screen.
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );
  // 2026-08-15 -- the one genuinely new architectural pattern this whole
  // Digest introduces: My Kitchen/My Favorites' real content is the
  // PERSON'S OWN local data, computed live via lib/digestDynamicEntries.ts,
  // never bundled in lib/digest/*.ts the way every other category's
  // content is. null means "not loaded (yet)", distinct from a real, empty
  // [] (nothing saved/favorited yet) -- see the entries useMemo below for
  // how that distinction is used. Loaded via useFocusEffect (not a plain
  // useEffect) specifically so it refires both on a genuine tab re-focus
  // AND on `lens` itself changing while already focused (switching from
  // Recipes to My Kitchen via LensHub, say) -- lens is a real dependency of
  // the memoized callback below, and useFocusEffect re-runs its own
  // callback whenever that identity changes while the screen stays
  // focused, not just on a focus/blur transition. This is what makes a
  // side saved a moment ago in Side Builder show up here with no restart
  // needed.
  const [dynamicEntries, setDynamicEntries] = useState<{
    myKitchen: DigestEntry[] | null;
    myFavorites: DigestEntry[] | null;
  }>({ myKitchen: null, myFavorites: null });
  // 2026-08-15 -- bumped after a real, in-place action changes a person's
  // own saved/favorited/staged-shared data (a photo saved, a thumbs-up
  // added a favorite, a staged share promoted or deleted) so the effect
  // below re-fetches without needing a genuine focus/blur transition.
  // Threaded down through BasicHealthShelves/DigestCard/DynamicEntryActions
  // as onDynamicEntriesChanged -- the exact same real prop-drilling shape
  // onJumpToRelated already established.
  const [dynamicEntriesRefreshToken, setDynamicEntriesRefreshToken] = useState(0);
  const refreshDynamicEntries = useCallback(() => setDynamicEntriesRefreshToken((token) => token + 1), []);
  useFocusEffect(
    useCallback(() => {
      if (lens !== 'myKitchen' && lens !== 'myFavorites') return;
      let cancelled = false;
      // My Kitchen also carries a real, dynamic "Recipes Shared With Me"
      // group -- see lib/digestDynamicEntries.ts's own buildSharedRecipeEntries
      // and CLAUDE.md's own 2026-08-15 sharing-staging entry for why this
      // lives inside myKitchen rather than as its own category.
      const loader =
        lens === 'myKitchen'
          ? Promise.all([buildMyKitchenEntries(), buildSharedRecipeEntries()]).then(([kitchen, shared]) => [...shared, ...kitchen])
          : buildMyFavoritesEntries();
      loader
        .then((built) => {
          if (!cancelled) setDynamicEntries((prev) => ({ ...prev, [lens]: built }));
        })
        .catch((error) => {
          console.error(`[PurpleDigest] Failed to load ${lens}`, error);
          if (!cancelled) setDynamicEntries((prev) => ({ ...prev, [lens]: [] }));
        });
      return () => {
        cancelled = true;
      };
      // dynamicEntriesRefreshToken is deliberately never read inside this
      // callback -- it exists purely to force a fresh re-run after a real
      // in-place change (a photo save, a thumbs-up favorite-add, a staged
      // share promoted/deleted), the same real "bump a counter to trigger
      // a refetch" pattern this app already uses elsewhere.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lens, dynamicEntriesRefreshToken]),
  );
  // The Search All lens's own COMMITTED query text -- 2026-08-08, no longer
  // written to on every keystroke (see DigestSearchInput's own comment
  // below for the real, reported keyboard-lag reason why). This is now the
  // already-debounced value, updated only once per real pause in typing.
  // Still reset whenever the tab loses/regains focus below, same as
  // `revealed`, so returning to Digest never resumes a stale search.
  const [searchQuery, setSearchQuery] = useState('');
  // Same reset-on-focus-change pattern as Insights/Schedule/Food -- arriving
  // or re-arriving at this tab always shows the resting "pick a category"
  // prompt first, never an instant resume of whatever was last open.
  const [revealed, setRevealed] = useState(false);
  // A real, category-scoped search -- 2026-08-08, originally built for
  // Basic Health alone ("build a search utility for the Basic Health
  // category"), now generalized to every real category: "Basic Health
  // needs its own search utility, just as all of the other areas of the
  // Digest do." Deliberately a separate query string from Search All's own
  // `searchQuery` above (not the same state reused) -- the two searches
  // have genuinely different scope (this app's whole Digest vs. just
  // whichever one category is currently open) and can't share a single
  // "what's the user typing" value without one clobbering the other on a
  // lens switch. Reset alongside everything else on a fresh tab visit and
  // a fresh lens selection, same as searchQuery. Whichever category is
  // active reads this same state -- there's only ever one real "local
  // search" box on screen at a time, so one shared string is safe. Also the
  // already-debounced COMMITTED value now, same as searchQuery above.
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  // Whether a real search is actively narrowing what's on screen right
  // now -- 2026-08-08, real parent state now (used to be derived every
  // render from the raw query text) so DigestSearchInput's own instant
  // onActiveChange callback can flip it the moment typing starts or the box
  // empties, without this screen needing to re-render on every keystroke in
  // between just to keep re-deriving the same boolean. Drives headerCard's
  // own visibility and the empty/results branching below -- see
  // DigestSearchInput's own comment for the fuller reasoning.
  const [isSearchActive, setIsSearchActive] = useState(false);
  // 2026-08-23: Basic Health's own plain-browsing landing view, direct
  // request after the FlatList virtualization fix still left a delay
  // -- rendering all ~21 groups' own shelves at once (479 entries total)
  // is itself the cost, not just how each shelf renders internally. Null
  // shows a topic menu (DigestTopicMenu, below) instead of every shelf at
  // once. For Basic Health, this holds a TOP-LEVEL topic label
  // (basicHealthMenuGroups' own key, the part of a leaf group's
  // '::'-joined label before the first '::', e.g. "Essential Nutrients",
  // not "Essential Nutrients::Magnesium") rather than one single leaf
  // group -- direct follow-up request: Essential Nutrients' own 22
  // individual nutrient/hormone subtopics fold back under their one shared
  // parent row in the menu, rather than each showing as its own separate
  // row, and picking that one row shows every one of them together, the
  // same multi-shelf continuous view every condition category already
  // uses. Every other (subtopic-free) top-level topic still resolves to
  // exactly one leaf group, same as before.
  //
  // Direct follow-up, same day: "do the same for the other sections of the
  // Digest." Every non-Basic-Health category's own topics are already flat,
  // single-level labels (no '::' nesting, no Essential-Nutrients-style
  // clustering needed), so this same state directly holds that category's
  // own picked topic label with no splitting required -- see the generic
  // (non-basicHealth) render branch, below, and jumpToRelated's own
  // generalized drill-in logic.
  //
  // Search bypasses this entirely at every level (categorySearchGroups'
  // own branch, above, already narrows what's shown once a topic is
  // picked, so an extra menu step would be redundant).
  const [selectedTopicGroup, setSelectedTopicGroup] = useState<string | null>(null);
  // The new fixed-header Glossary shortcut, 2026-08-23 -- see
  // basicHealthMenuGroups' own comment for why Glossary no longer shows as
  // a normal Basic Health menu row. A real, separate boolean rather than
  // routing through lens/selectedTopicGroup: glossary- prefixed entries
  // are individually categorized across 14 different real categories (only
  // 55 of 100 are 'basicHealth', the rest scattered under Hashimoto's and
  // every other condition, whichever one each term's own deeper content
  // actually ties to), so "the Glossary" a person expects from this button
  // has to pull every one of them at once regardless of category, not just
  // the Basic-Health-categorized fraction Basic Health's own topic system
  // alone could ever show. Deliberately doesn't touch lens/selectedTopicGroup
  // at all when opening -- whatever category/topic was showing underneath
  // stays exactly as it was, ready to resume the instant Glossary closes.
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  // Every glossary- prefixed entry across every real category, flattened
  // into the one flat list Glossary's own view needs -- ALL_DIGEST_ENTRIES
  // is static app content, never changes at runtime, so this only ever
  // computes once.
  const allGlossaryEntries = useMemo(
    () => sortDigestEntriesLogically(ALL_DIGEST_ENTRIES.filter((entry) => entry.id.startsWith('glossary-'))),
    [],
  );
  // A real, deliberate remount trigger for DigestSearchInput (used as its
  // own `key` in the JSX below) -- 2026-08-08. Since that component now
  // owns its own local, per-keystroke text state (the whole point of this
  // fix), this screen can no longer just call a setter to clear the box the
  // way it used to; bumping this forces React to tear down and remount a
  // fresh instance, which resets that local state to its own default ('')
  // for free, no extra reset-effect logic needed inside the child at all.
  // Bumped everywhere this screen already resets searchQuery/
  // categorySearchQuery directly (focus change, jumpToRelated, a fresh
  // LensHub selection) -- see each of those for why.
  const [searchResetKey, setSearchResetKey] = useState(0);
  // basicHealthTopicPath (tracking a real drill-down position in Basic
  // Health's own tree) removed 2026-08-14 alongside BasicHealthTree itself
  // -- Basic Health now renders every one of its own topics as a shelf all
  // at once, the same as every other category, with no "current position"
  // left to track.
  useFocusEffect(
    useCallback(() => {
      // openDigestLens overrides the normal "always land on the resting
      // picker" reset below, the same way food.tsx's own editSideId etc.
      // already do -- without this, a real deep link from a Food builder
      // would still show the LensHub picker for a beat (or permanently,
      // once revealed was reset false on focus) instead of the category it
      // was actually sent to.
      if (openDigestLens === 'myKitchen' || openDigestLens === 'myFavorites' || openDigestLens === 'recipes') {
        setLens(openDigestLens);
        // 2026-08-23: a fresh deep-link arrival lands on that category's
        // own top-level menu, same as picking it from LensHub would --
        // without this, a stale selectedTopicGroup left over from a
        // previous visit could show that category already drilled into a
        // topic instead of its own menu.
        setSelectedTopicGroup(null);
        setRevealed(true);
        return;
      }
      // openEntryId takes the same "reveal and land directly" precedence
      // as openDigestLens above -- jumpToRelated already does everything a
      // fresh arrival needs (right category, right topic, the entry
      // expanded, scrolled into view), it just also needs revealed set
      // true first, since jumpToRelated itself assumes the screen is
      // already showing a category, not still on the resting LensHub
      // picker the way a brand-new navigation always starts.
      if (openEntryId) {
        setRevealed(true);
        jumpToRelated(openEntryId);
        return;
      }
      setRevealed(false);
      setSearchQuery('');
      setCategorySearchQuery('');
      setIsSearchActive(false);
      setSearchResetKey((key) => key + 1);
      return () => {
        setRevealed(false);
        setSearchQuery('');
        setCategorySearchQuery('');
        setIsSearchActive(false);
        setSearchResetKey((key) => key + 1);
      };
      // jumpToRelated deliberately left out of this dependency array --
      // it's a plain function, not a useCallback, so it's a genuinely new
      // reference every render, and this effect only needs to re-run when
      // openEntryId itself changes, not on every unrelated render of this
      // whole screen. Everything jumpToRelated reads is either a setState
      // setter (stable by React's own guarantee) or groupRefs.current (a
      // ref, always the current object regardless of which render's
      // closure captured it), so there's no real stale-closure risk here.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openDigestLens, openEntryId]),
  );

  // Which single entry (by id) is currently expanded to its full detail,
  // within whichever category is showing -- at most one open at a time,
  // same "tap again to collapse" accordion shape as Insights' own SixDsView.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // The small "how does search matching work" sheet, opened via the (i)
  // icon next to the breadcrumb -- see SEARCH_MATCH_HELP_SECTIONS' own
  // comment for why this is a local HelpSheet rather than folded into the
  // screen's usual useRegisterScreenHelp registration.
  const [searchMatchHelpVisible, setSearchMatchHelpVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  // A real ref to each rendered shelf GROUP's own outer container (keyed by
  // group label -- Basic Health's own by-topic label, or a condition's own
  // pillar label / TYING_TOGETHER_GROUP_KEY) -- 2026-08-08, replacing an
  // earlier per-CARD ref approach entirely, once every real category
  // (conditions included, not just Basic Health) moved to the same
  // shelf-row-plus-detail-panel shape. Scrolling targets the whole group
  // section, not the individual tapped card, so the group's own heading and
  // its full tab strip land together near the top of the screen when a row
  // is opened, per direct correction: "The entire row that is being looked
  // at should have each of their headers at the top of the row... so I
  // don't get lost." A plain RN View already exposes the same real
  // .measure() a card ref did, so this reuses the identical scroll
  // mechanism below, just keyed differently -- see scrollGroupIntoView.
  const groupRefs = useRef<Record<string, Measurable | null>>({});
  // The ScrollView's own current, live scroll position -- kept live via
  // onScroll, needed for two real reasons: converting the viewport-
  // relative measurement below into an absolute scroll target, and
  // stopping any in-flight scroll momentum before issuing a new
  // programmatic scroll (see scrollGroupIntoView's own comment). Plain
  // ref, not state, so onScroll firing repeatedly during a manual drag
  // doesn't itself force a re-render.
  const currentScrollY = useRef(0);
  // The real fix for the scroll-clamping bug described above
  // EXPANDED_EXTRA_SCROLL_PADDING -- extra bottom padding, but ONLY while a
  // card is actually expanded (expandedId !== null). Scrolling with nothing
  // open never needs this (there's no tall detail panel that could ever
  // need to reach the top of the screen), so the padding stays at its
  // normal, small, floating-button-clearing size the rest of the time --
  // no new empty-space-at-the-bottom complaint traded in for the fix.
  // Memoized (both the number and the style array below) rather than a
  // plain per-render expression, precisely because an unmemoized version of
  // this was the real cause of the 2026-08-09 keyboard-lag regression --
  // see EXPANDED_EXTRA_SCROLL_PADDING's own comment for the full story.
  const scrollExtraBottomPadding = useMemo(
    () => (expandedId !== null ? scrollBottomPadding + EXPANDED_EXTRA_SCROLL_PADDING : scrollBottomPadding),
    [expandedId, scrollBottomPadding],
  );
  const scrollContentContainerStyle = useMemo(
    () => [styles.bodyContent, { paddingBottom: scrollExtraBottomPadding }],
    [scrollExtraBottomPadding],
  );

  // Which real DigestCategoryKeys correspond to a condition the person has
  // actually told the app they have -- see CONDITION_CODE_TO_DIGEST_KEY's
  // own comment for why this needs a real lookup rather than a derived
  // transform.
  const pinnedDigestKeys = new Set(
    userConditionCodes
      .map((code) => CONDITION_CODE_TO_DIGEST_KEY[code])
      .filter((key): key is DigestCategoryKey => Boolean(key)),
  );

  // Reordered 2026-08-13, direct request: "move Earth Matters and Home
  // Gardening up to the top with Basic Health and Search All. Keep Search
  // All in the top left, followed by Basic Health, then Earth Matters, then
  // Gardening..., and then the conditions in alphabetical order with the
  // ones selected in the profile as their own top group, also alphabetical
  // within it." Basic Health/Earth Matters/Gardening are each a real,
  // fixed lookup rather than a filter -- there's exactly one of each, no
  // sorting needed. Every other real category (all 19 conditions,
  // Hashimoto's included -- no longer hardcoded second) is split into the
  // person's own selected conditions and everything else, each block
  // independently alphabetized by its own real display label rather than
  // hand-ordered, so this stays correct automatically if a condition's
  // name or the roster itself ever changes.
  const basicHealthMeta = DIGEST_CATEGORY_META.find((meta) => meta.key === 'basicHealth')!;
  const earthMattersMeta = DIGEST_CATEGORY_META.find((meta) => meta.key === 'earthMatters')!;
  const gardeningMeta = DIGEST_CATEGORY_META.find((meta) => meta.key === 'homeGardening')!;
  // 2026-08-14 -- a real, new "Recipes" category, given the same fixed,
  // always-near-the-top treatment as the three above rather than sorted
  // alphabetically among the 19 conditions (see recipes.ts's own header
  // comment): a real, discoverable food-building tool, not a disease
  // condition.
  const recipesMeta = DIGEST_CATEGORY_META.find((meta) => meta.key === 'recipes')!;
  // 2026-08-15 -- given the same fixed, always-near-the-top treatment,
  // right after Recipes: real, personal, computed content, not a disease
  // condition either.
  const myKitchenMeta = DIGEST_CATEGORY_META.find((meta) => meta.key === 'myKitchen')!;
  const myFavoritesMeta = DIGEST_CATEGORY_META.find((meta) => meta.key === 'myFavorites')!;
  const conditionMetas = DIGEST_CATEGORY_META.filter(
    (meta) =>
      meta.key !== 'basicHealth' &&
      meta.key !== 'earthMatters' &&
      meta.key !== 'homeGardening' &&
      meta.key !== 'recipes' &&
      meta.key !== 'myKitchen' &&
      meta.key !== 'myFavorites',
  );
  const pinnedConditionMetas = conditionMetas
    .filter((meta) => pinnedDigestKeys.has(meta.key))
    .sort((a, b) => a.label.localeCompare(b.label));
  const otherConditionMetas = conditionMetas
    .filter((meta) => !pinnedDigestKeys.has(meta.key))
    .sort((a, b) => a.label.localeCompare(b.label));
  const orderedCategoryMetas = [
    basicHealthMeta,
    earthMattersMeta,
    gardeningMeta,
    recipesMeta,
    myKitchenMeta,
    myFavoritesMeta,
    ...pinnedConditionMetas,
    ...otherConditionMetas,
  ];

  // 'search' IS one of these tiles, leading the list -- 2026-08-08, a real
  // correction of an in-between attempt this same day. The first pass had
  // Search All as a co-equal grid tile right alongside Basic Health and
  // every condition; a direct correction ("Search the whole digest should
  // be on the outside of Basic Health, not inside of it") was read, at the
  // time, as needing that structural sibling-ness removed entirely, so
  // Search became a persistent bar pinned above the whole screen instead.
  // The real, actual ask turned out narrower and different: "move the
  // 'Search the whole digest' search utility out of the Basic Health area
  // and into the Digest LensHub menu as a selection" -- a real, tappable
  // choice from the same menu every other lens already lives in, not a
  // second, parallel input mechanism outside that menu altogether. Since
  // LensHub's own grid already renders Basic Health and every condition as
  // plain, equal siblings, giving Search its own tile in that same list
  // already satisfies "outside of Basic Health" on its own -- it's a
  // sibling selection, not a child of Basic Health's own tree. The
  // persistent bar is gone; typing now only happens inside the 'search'
  // lens's own content, the same as any other lens.
  const LENSES: LensOption<PurpleDigestLens>[] = [
    {
      key: 'search',
      label: 'Search All',
      icon: 'search-outline',
      help: DIGEST_SEARCH_HELP,
    },
    ...orderedCategoryMetas.map((meta) => ({
      key: meta.key,
      // A leading star used to mark a condition the person had actually
      // told the app they have -- removed entirely, 2026-08-21, direct
      // report: selecting Hashimoto's and IBS in Profile put both above
      // the divider as expected, but only IBS showed a star, since
      // Hashimoto's was explicitly excluded from it back on 2026-08-09
      // (it's the one condition already built out to full depth, so
      // marking it "you told the app you have this" read as redundant).
      // That inconsistency read as a real bug from the grid's own
      // perspective (two pinned conditions, two different looks) rather
      // than a deliberate distinction, so instead of special-casing every
      // other condition the same way Hashimoto's already was, the star is
      // gone for all of them -- being pinned above the divider (see
      // dividerBefore/pinnedConditionMetas above) is already the real,
      // visible signal that a condition is selected, without a second,
      // inconsistently-applied marker on top of it. `label` now reads
      // straight from DIGEST_CATEGORY_META for every option, same as
      // every other place this name appears (the page header, the Info
      // sheet heading, activeLensLabel) already did.
      label: meta.label,
      gridLabel: DIGEST_GRID_LABEL_BREAKS[meta.key],
      icon: meta.icon,
      // 2026-08-09, real per-condition vector icons -- see
      // components/DigestConditionIcons.tsx's own header comment for the
      // full reasoning. `icon` above stays set regardless, as the real
      // fallback for the 3 non-condition categories (basicHealth/
      // earthMatters/homeGardening) this map has no bespoke icon for.
      renderIcon: DIGEST_CONDITION_ICONS[meta.key]
        ? (size: number, color: string) => {
            const ConditionIcon = DIGEST_CONDITION_ICONS[meta.key]!;
            return <ConditionIcon size={size} color={color} />;
          }
        : undefined,
      help: [DIGEST_LENS_HELP[meta.key], DIGEST_READING_HELP],
      // A plain divider line, 2026-08-21, direct request: "separate the
      // conditions from the rest of the icons... If the user in their
      // profile selects that they have any of the conditions then the
      // icon for the conditions they say they have can move up to above
      // the line, after the other icons." orderedCategoryMetas already
      // puts the non-condition tiles first, then pinnedConditionMetas
      // (the person's own selected conditions), then otherConditionMetas
      // (everything else) -- see that array's own comment above. The
      // line just needs to land on the first tile of that last group, so
      // it reads as "your conditions and everything else" above it,
      // "every other condition" below. Guarded on otherConditionMetas
      // actually having a first entry -- if the person has selected every
      // real condition, there's nothing left below the line to separate.
      dividerBefore: otherConditionMetas.length > 0 && meta.key === otherConditionMetas[0].key,
    })),
  ];

  const activeLensLabel =
    lens === 'search' ? 'Search All' : DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.label;
  // 2026-08-23, direct report: drilling into a Basic Health subgroup (say
  // Essential Nutrients) still showed the generic "Basic Health" title and
  // its own "Food, vitamins, minerals..." description above the shelves,
  // reading as if you were still on the topic-wide overview rather than
  // looking at one specific subgroup. That description belongs only on the
  // top-level menu, where every one of Basic Health's own groups is
  // actually listed -- once a subgroup is picked, the header card below
  // switches to that subgroup's own name instead.
  //
  // Direct follow-up, same day: generalized to every other category once
  // the menu-first browsing pattern itself was extended to all of them
  // (see selectedTopicGroup's own comment) -- drilling into any topic, in
  // any lens, shows that topic's own name here instead of the category's
  // own name, not just Basic Health's.
  const drilldownTopicLabel =
    lens !== 'search' && selectedTopicGroup !== null ? shelfGroupDisplayLabel(selectedTopicGroup) : null;
  // 2026-08-23, direct follow-up: an empty header once drilled in still
  // left nothing explaining what the subgroup actually covers or how it
  // connects to basic health generally -- each BASIC_HEALTH_TOPICS entry's
  // own `description` (BASIC_HEALTH_MORE_TOPIC_DESCRIPTION for the dynamic
  // 'More' catch-all, which isn't a real BASIC_HEALTH_TOPICS entry) fills
  // that in, specific to the picked subgroup rather than a repeat of Basic
  // Health's own shared blurb. Only Basic Health's own topics carry an
  // authored description at all -- no condition, Earth Matters, or Home
  // Gardening topic has one yet, so this stays null for every other
  // category's own drilled-in view (just the topic name above, no
  // paragraph under it), an honest gap rather than an invented blurb.
  const drilldownTopicDescription =
    lens === 'basicHealth' && selectedTopicGroup !== null
      ? (BASIC_HEALTH_TOPICS.find((topic) => topic.label === selectedTopicGroup)?.description ??
        BASIC_HEALTH_MORE_TOPIC_DESCRIPTION)
      : null;
  // 2026-08-23, direct follow-up: "Search within Basic Health" stayed
  // showing at every drilled-in level too, direct report that it should
  // instead search "the area where they are, filtered." Whatever the
  // search box's placeholder and empty-state text call the current scope
  // -- the drilled-in subgroup's own name once inside one, the ordinary
  // lens name otherwise. categorySearchGroups (below) does the matching
  // scoping on the actual results.
  const searchScopeLabel = drilldownTopicLabel ?? activeLensLabel;
  // The header card's own icon, 2026-08-09, direct request: "instead of
  // the digest icon, use a bigger version of the icon for that condition."
  // A real per-condition icon here, not the generic PurpleRibbonIcon --
  // `lens !== 'search'` narrows PurpleDigestLens down to a real
  // DigestCategoryKey, the same type DIGEST_CONDITION_ICONS is keyed on,
  // so this stays type-safe without a separate cast. Falls back to
  // PurpleRibbonIcon for the 4 lenses with no bespoke icon of their own
  // (Search, Basic Health, Earth Matters, Home Gardening).
  const ActiveConditionIcon = lens !== 'search' ? DIGEST_CONDITION_ICONS[lens] : undefined;
  // Plain, original category order -- no reordering. See cardOffsets' own
  // comment above for why (a real correction of an earlier "move the
  // expanded card to the front of the list" approach). A real useMemo, not
  // a plain expression -- getEntriesForCategory returns a freshly-built
  // array every call, so leaving this unmemoized would hand
  // categorySearchGroups below a new array identity on every render
  // regardless of whether `lens` actually changed, defeating that memo's
  // own point of skipping recomputation on unrelated re-renders (e.g. a
  // feedback tap, an unrelated state change elsewhere on screen).
  const entries = useMemo(() => {
    if (lens === 'search') return [];
    // My Kitchen/My Favorites: real, live, per-user data, not static
    // getEntriesForCategory content -- null (not yet loaded) reads as
    // genuinely empty here rather than "show everything", the opposite of
    // visibleFoodNames' own null handling below, since there's no bundled
    // fallback content to show while this loads the way there is for a
    // real hide-sync check.
    if (lens === 'myKitchen') return dynamicEntries.myKitchen ?? [];
    if (lens === 'myFavorites') return dynamicEntries.myFavorites ?? [];
    const raw = getEntriesForCategory(lens);
    // See visibleFoodNames' own comment above -- still loading (null) means
    // show everything; once resolved, drop any relatedFoodNames-tagged
    // entry whose every real food name has since been hidden.
    if (visibleFoodNames === null) return raw;
    return raw.filter((entry) => {
      if (isProblemFoodEntry(entry) || !entry.relatedFoodNames || entry.relatedFoodNames.length === 0) return true;
      return entry.relatedFoodNames.some((name) => visibleFoodNames.has(name));
    });
  }, [lens, visibleFoodNames, dynamicEntries]);
  // searchQuery/categorySearchQuery are already the debounced, COMMITTED
  // values by construction now (see DigestSearchInput below) -- a real,
  // second attempt at the reported keyboard-lag fix, 2026-08-08. The first
  // attempt (debouncing a value derived FROM this screen's own raw,
  // per-keystroke state) didn't actually work: this screen still re-
  // rendered its entire tree on every single character, since the raw text
  // itself lived here -- the debounce only skipped recomputing the
  // EXPENSIVE data, not the (much more expensive) React reconciliation of
  // however many real card/shelf components that data feeds, which still
  // happened in full on every keystroke regardless. The real fix moves the
  // raw, per-keystroke text into its own small, isolated child component
  // instead -- this screen (and everything below) now only re-renders once
  // per real pause in typing, not once per character, because it's simply
  // never told about a keystroke until the debounce inside that child
  // component has already settled.
  // 2026-08-09, real per-term match info added -- direct request: "the
  // search results should tell me if one or the other or both items
  // appeared in the result and how much weight this entry has." Scored
  // now, not just a plain ranked list -- each result carries its own real
  // SearchMatchInfo (which of the typed terms actually matched, and
  // whether each hit the title or only the body), rendered directly on
  // SearchResultCard below rather than left as an invisible internal
  // ranking number the way this screen's own sort order already was.
  const searchResults = useMemo(() => searchDigestEntriesScored(searchQuery), [searchQuery]);
  // The same filtered, grouped hierarchical view built for category search
  // (see the JSX below) -- pulled into its own real useMemo here, alongside
  // searchResults above, rather than left as an inline IIFE recomputed on
  // every render regardless of whether the query (or the category itself)
  // actually changed.
  // 2026-08-23, direct report: "why does it take so long for Basic Health
  // to display after selecting it from the Digest menu?" Root cause:
  // basicHealthAllGroups(entries) was called directly inline in this
  // screen's own JSX (below, at the real BasicHealthShelves render), not
  // memoized -- it walks all ~21 real Basic Health topics (Essential
  // Nutrients' own subtopics flattened among them) and filters the full
  // entries list once per topic, real, non-trivial work that was re-running
  // on every render of this whole screen while Basic Health was open, not
  // just once when it was first selected. categorySearchGroups just above
  // already gets this right (a real useMemo); this is the same fix applied
  // to the plain, non-search browsing path. Moved above
  // categorySearchScopeEntries (below), which now reads it too, so it's
  // declared before its own first use.
  const basicHealthGroups = useMemo(() => basicHealthAllGroups(entries), [entries]);
  // 2026-08-23, direct report: search stayed scoped to the whole Basic
  // Health category at every drilled-in level too ("search within Basic
  // Health should only be on the Basic Health page... the search on top
  // should change to search the area where they are, filtered") -- once a
  // subgroup is picked, both the scoring pool below and categorySearchGroups'
  // own base groups (below) narrow to just that subgroup's own entries, the
  // same real efficiency win the earlier virtualization fix made for
  // ordinary browsing.
  //
  // Direct follow-up, same day: generalized to every other category once
  // the menu-first browsing pattern itself was extended to all of them.
  // Basic Health alone needs the '::'-prefix clustering (Essential
  // Nutrients' own 22 subtopics); every other category's own topics are
  // already flat, single-level labels, so an exact match against
  // groupEntriesForLens' own topics is enough. lens === 'search' (the
  // whole-Digest search lens) never reaches the second branch in practice
  // -- selectedTopicGroup has no meaning there and stays null -- but the
  // null check above short-circuits before the type-narrowing cast below
  // would matter either way.
  const categorySearchScopeEntries = useMemo(() => {
    if (selectedTopicGroup === null) return entries;
    if (lens === 'basicHealth') {
      const scoped: AnyDigestEntry[] = [];
      for (const group of basicHealthGroups) {
        if (group.label.split('::')[0] === selectedTopicGroup) scoped.push(...group.entries);
      }
      return scoped;
    }
    const { topics } = groupEntriesForLens(lens as DigestCategoryKey, entries);
    return topics.find((topic) => topic.label === selectedTopicGroup)?.entries ?? entries;
  }, [entries, lens, selectedTopicGroup, basicHealthGroups]);
  // 2026-08-09, keyed by id to a real SearchMatchInfo now, not just a plain
  // Set -- the same "which terms actually matched, title or just body"
  // detail Search All's own results already carry, threaded through to
  // ShelfTabCard below so a category's own scoped search shows the same
  // real relevance signal, not just a filtered list with no visible reason
  // why each card is there.
  const categorySearchMatchInfo = useMemo(() => {
    const map = new Map<string, SearchMatchInfo>();
    for (const result of searchEntriesScored(categorySearchScopeEntries, categorySearchQuery)) map.set(result.entry.id, result.match);
    return map;
  }, [categorySearchScopeEntries, categorySearchQuery]);
  const categorySearchGroups = useMemo(() => {
    const baseGroups =
      lens === 'basicHealth'
        ? selectedTopicGroup === null
          ? basicHealthGroups
          : basicHealthGroups.filter((group) => group.label.split('::')[0] === selectedTopicGroup)
        : (() => {
            const { topics, tyingTogether } = groupEntriesForLens(lens as DigestCategoryKey, entries);
            const allTopics = tyingTogether ? [...topics, { label: TYING_TOGETHER_GROUP_KEY, entries: [tyingTogether] }] : topics;
            return selectedTopicGroup === null ? allTopics : allTopics.filter((topic) => topic.label === selectedTopicGroup);
          })();
    return baseGroups
      .map((group) => ({
        label: group.label,
        entries: group.entries.filter((entry) => categorySearchMatchInfo.has(entry.id)),
      }))
      .filter((group) => group.entries.length > 0);
  }, [entries, categorySearchMatchInfo, lens, basicHealthGroups, selectedTopicGroup]);
  const categorySearchTotalMatches = categorySearchGroups.reduce((sum, group) => sum + group.entries.length, 0);
  // Basic Health's own topic MENU rows, 2026-08-23, direct follow-up
  // request: folds every leaf group in basicHealthGroups back under its own
  // top-level topic (the part of a '::'-joined label before the first
  // '::') -- Essential Nutrients' own 22 individual nutrient/hormone leaf
  // groups collapse into one "Essential Nutrients" row here, summed to one
  // combined entry count, rather than showing as 22 separate rows. Every
  // other top-level topic (no subtopics of its own) still resolves to
  // exactly one row, same count as its own single leaf group. Sorted
  // alphabetically by display label (direct request), not
  // basicHealthGroups' own BASIC_HEALTH_TOPICS declared order -- "More",
  // the catch-all bucket, sorts in place with everything else rather than
  // being pinned last.
  // 2026-08-23, direct instruction: "The Glossary isn't a topic though
  // that should be listed in alphabetical order within the list of all
  // of the topics. It should have it's own button." Glossary stays a
  // real BASIC_HEALTH_TOPICS entry (basicHealthGroups/basicHealthAllGroups
  // still need it there to group glossary- entries correctly, the same
  // as any other topic), it's only excluded from this MENU list -- the
  // new fixed-header Glossary button (see openGlossary below) reaches the
  // exact same drilled-in view directly, bypassing this menu entirely.
  const basicHealthMenuGroups = useMemo(() => {
    const menu: { label: string; entryCount: number }[] = [];
    for (const group of basicHealthGroups) {
      const topLabel = group.label.split('::')[0];
      if (topLabel === 'Glossary') continue;
      const existing = menu.find((row) => row.label === topLabel);
      if (existing) existing.entryCount += group.entries.length;
      else menu.push({ label: topLabel, entryCount: group.entries.length });
    }
    return menu.sort((a, b) => shelfGroupDisplayLabel(a.label).localeCompare(shelfGroupDisplayLabel(b.label)));
  }, [basicHealthGroups]);

  // Scrolls the ScrollView so the named card's own top edge lands exactly
  // ENTRY_SCROLL_TOP_MARGIN below the top of the visible screen -- on
  // EVERY tap, unconditionally, regardless of where the card already sits.
  //
  // 2026-08-07, rebuilt around real, live measurement rather than a cached
  // offset, per explicit correction: "You seem to be trying to judge their
  // approximate location and approximate destination at the time instead
  // of just assigning something to be the mechanism for each box... place
  // the header of this box 10 pixels from the bottom of the header of the
  // app." `.measure()` (a real, standard React Native primitive, available
  // on both the target card's own ref and the ScrollView's own ref)
  // reports each one's own real, current on-screen (`pageY`) position,
  // queried fresh at the exact instant this function runs. The math:
  // `pageY - scrollPageY` is how far below the ScrollView's own visible
  // top edge the card currently sits; adding that to the ScrollView's own
  // current absolute scroll position gives the real absolute target.
  //
  // 2026-08-07, a real, later report: "some of the time" the box still
  // doesn't land under the header -- found by actually reasoning through
  // what "some of the time" implied, not by guessing again. Live
  // measurement was already correct in principle, but this function only
  // waited one real animation frame (~16ms) before measuring -- nowhere
  // near enough time for the LinearTransition animation collapsing
  // whatever card was previously open to actually finish (its own real,
  // now-explicit duration is CARD_LAYOUT_TRANSITION_MS above). Measuring
  // that early caught the target card still mid-slide, not yet at its real
  // final position -- exactly a "some of the time" bug, since it only ever
  // showed up when a DIFFERENT card had to collapse first (tapping the
  // very first card of a session, with nothing else open to collapse, has
  // nothing to wait for and was never actually broken). Fixed by waiting
  // the animation's own known duration (plus a small buffer) before
  // measuring at all, every time -- not a guess at "probably long enough,"
  // the literal real number the same LinearTransition call below is
  // configured to actually take. The one remaining frame of deferral below
  // is unrelated: it's still needed first, just to confirm the target
  // card's own ref exists at all yet (jumpToRelated can switch to a
  // category whose cards haven't mounted for the first time), retried a
  // few more frames if not -- once it exists, the real animation-settle
  // wait begins.
  //
  // The momentum-halt step (an immediate, unanimated scroll to the current
  // position before the real animated scroll) is kept from the previous
  // fix for the same reason as before: Android can otherwise blend a new
  // programmatic scroll with any still-running fling from a recent manual
  // drag, producing an inconsistent final position even when the target
  // itself was computed correctly.
  // The shared real mechanism both scrollEntryIntoView and
  // scrollGroupIntoView below now call -- 2026-08-08, extracted so the new
  // Basic Health group-level scroll target (a group's own outer container,
  // not any one card inside it) can reuse the exact same real, already-
  // hard-won .measure()-based logic rather than a second, parallel copy of
  // it. `getNode` is a real, live lookup (not a value captured once), the
  // same "always ask for the current position, never trust anything cached
  // earlier" discipline this whole mechanism has been rebuilt around
  // before.
  //
  // 2026-08-09, a real, direct, confirmed regression report (checked
  // against a genuinely fresh Metro reload first, per this app's own
  // standing discipline -- this wasn't staleness): "if I tap a topic... it
  // scrolls way up and then all the way down" or "just opens and doesn't
  // scroll up at all... This is exactly the problem you fixed before...
  // then we did structural changes to how the Digest area works, and ever
  // since it has been this way." The real, structural change that matches:
  // every condition's own entries used to sit in one flat list; the
  // pillar-shelf restructure (and, more recently, two much larger new
  // categories -- Earth Matters at 68 entries, Home Gardening -- built on
  // the exact same mechanism) means a normal tap can now need to run TWO
  // real, simultaneous LinearTransition animations at once, not one: the
  // PREVIOUSLY-open entry's own panel collapsing in one pillar, and the
  // newly-tapped entry's own panel expanding in a DIFFERENT one. The single
  // fixed wait below was tuned and proven against the simpler, one-
  // animation case (this file's own 2026-08-07 history); nothing
  // guarantees two independent, real UI-thread animations both finish
  // inside that exact same fixed window every time, especially with more
  // real content on screen for the JS/UI thread to lay out than existed
  // when that number was first tuned -- a genuine, real explanation for
  // "sometimes it's fine, sometimes it overshoots, sometimes it doesn't
  // move at all," not a guess made blind. Two real, low-risk changes,
  // rather than a bigger fixed-number guess that just moves where the same
  // class of timing bug can still happen:
  // 1. attemptsLeft raised from 5 to 15 (roughly 240ms of real retries at
  //    one frame apart, up from roughly 80ms) -- more room for a group's
  //    own ref to actually finish registering under real load before this
  //    gives up and silently does nothing at all.
  // 2. A real, second corrective pass, scheduled the same real wait length
  //    again AFTER the first one already fired. It re-asks for the node
  //    (getNode(), not a value captured once) and re-measures fresh --
  //    live, current numbers, the same discipline as the first pass, never
  //    anything cached. If the first pass already landed correctly, this
  //    second pass's own freshly-measured target is nearly identical to
  //    where the screen already sits, so the visible correction is
  //    negligible; if either of the two real animations was still
  //    genuinely settling when the first pass fired, this catches and
  //    fixes the resulting wrong position instead of leaving it wrong.
  function measureAndScrollTo(targetNode: Measurable, scrollNode: Measurable, haltMomentumFirst: boolean) {
    targetNode.measure((_cx, _cy, _cw, _ch, _cardPageX, cardPageY) => {
      scrollNode.measure((_sx, _sy, _sw, _sh, _scrollPageX, scrollPageY) => {
        const target = Math.max(currentScrollY.current + (cardPageY - scrollPageY) - ENTRY_SCROLL_TOP_MARGIN, 0);
        if (haltMomentumFirst) {
          (scrollNode as unknown as { scrollTo: (opts: { y: number; animated: boolean }) => void }).scrollTo({
            y: currentScrollY.current,
            animated: false,
          });
        }
        (scrollNode as unknown as { scrollTo: (opts: { y: number; animated: boolean }) => void }).scrollTo({
          y: target,
          animated: true,
        });
      });
    });
  }

  function scrollNodeIntoView(getNode: () => Measurable | null | undefined, attemptsLeft = 15) {
    requestAnimationFrame(() => {
      const targetNode = getNode();
      const scrollNode = scrollRef.current;
      if (!targetNode || !scrollNode) {
        if (attemptsLeft > 0) scrollNodeIntoView(getNode, attemptsLeft - 1);
        return;
      }
      setTimeout(() => {
        measureAndScrollTo(targetNode, scrollNode as unknown as Measurable, true);
        setTimeout(() => {
          const stillTargetNode = getNode();
          const stillScrollNode = scrollRef.current;
          if (stillTargetNode && stillScrollNode) {
            measureAndScrollTo(stillTargetNode, stillScrollNode as unknown as Measurable, false);
          }
        }, CARD_LAYOUT_TRANSITION_MS + CARD_LAYOUT_SETTLE_BUFFER_MS);
      }, CARD_LAYOUT_TRANSITION_MS + CARD_LAYOUT_SETTLE_BUFFER_MS);
    });
  }

  // Scrolls so a whole shelf group's own container (heading + its full
  // horizontal tab strip) lands near the top of the screen, rather than
  // just one card inside it -- see groupRefs' own comment above for why.
  function scrollGroupIntoView(label: string) {
    scrollNodeIntoView(() => groupRefs.current[label]);
  }

  // Resolves which shelf group a given entry's own card should scroll to --
  // Basic Health resolves the entry's own real topic path (joined into one
  // string, matching the exact group.label basicHealthAllGroups already
  // computes for it, which BasicHealthShelves registers a real ref under
  // for every shelf, all at once); every real condition uses the topic
  // grouping above, with its own "tying together" entry (if it has one)
  // routed to the fixed key that card renders under instead. 'search'
  // never reaches this (a search-result tap always resolves to a real
  // underlying category via jumpToRelated before this is called).
  function shelfGroupKeyForEntry(id: string, category: DigestCategoryKey): string {
    if (category === 'basicHealth') return basicHealthTopicPathForEntryId(id).join('::');
    const entry = findDigestEntryById(id);
    if (entry && isTyingTogetherEntry(entry)) return TYING_TOGETHER_GROUP_KEY;
    if (entry) return classifyTopicForCategory(entry, category);
    return TYING_TOGETHER_GROUP_KEY;
  }

  // Expanding/collapsing a single entry, wherever it's shown -- a
  // condition's own topic shelf, or one of Basic Health's own shelves,
  // rendered by the same real BasicHealthShelves component either way --
  // scrolls to that entry's own group section, not the individual card.
  function toggleEntry(id: string, category: DigestCategoryKey) {
    const wasExpanded = expandedId === id;
    setExpandedId(wasExpanded ? null : id);
    if (wasExpanded) return;
    scrollGroupIntoView(shelfGroupKeyForEntry(id, category));
  }

  // Jumping to a related entry: switch category (if it's a different one),
  // expand that entry, and collapse whatever was open before -- a related
  // chip always lands you looking at exactly that entry, wherever it
  // actually sits. The same function a shelf card's own tap, a
  // Related chip, and a search result (Search All or any category's own
  // scoped search) all use.
  //
  // 2026-08-23: no category's own plain-browsing view keeps every shelf
  // mounted at once anymore (see selectedTopicGroup's own comment) -- when
  // the target lives in a topic that isn't currently mounted, this now
  // also drills straight into it before scrolling, otherwise
  // scrollGroupIntoView would be reaching for a ref that was never mounted
  // (the topic menu would still be showing instead). Basic Health drills
  // into just the TOP-LEVEL part (before the first '::', so a
  // Magnesium-related jump drills into the whole "Essential Nutrients"
  // row, same as tapping it from the menu directly); every other
  // category's own topics are already flat, so the key itself is the
  // target. A tying-together entry is the one real exception -- it only
  // ever renders on that category's own top-level menu (see the main
  // render branch, below), so jumping to one resets to the menu (null)
  // instead of trying to drill into a topic it was deliberately pulled
  // out of.
  function jumpToRelated(id: string) {
    const target = findDigestEntryById(id);
    if (!target) return;
    // 2026-08-23: a Related chip tapped from inside the Glossary view
    // (glossaryOpen) needs to actually land on the target's own real
    // category/topic, not stay stuck showing Glossary's own unrelated
    // flat list underneath an already-changed lens.
    setGlossaryOpen(false);
    const category = target.category as DigestCategoryKey;
    setLens(category);
    if (category === 'basicHealth') {
      setSelectedTopicGroup(shelfGroupKeyForEntry(id, category).split('::')[0]);
    } else {
      setSelectedTopicGroup(isTyingTogetherEntry(target) ? null : shelfGroupKeyForEntry(id, category));
    }
    // A previous category's own shelf refs (Basic Health topic paths, or a
    // condition's own topic labels -- both real, plain strings that can
    // legitimately repeat across different categories, e.g. every
    // condition has its own "Core Science" shelf) are cleared here rather
    // than left to go stale -- otherwise a leftover ref from whichever
    // category was open before could transiently point scrollGroupIntoView
    // at the WRONG category's own already-unmounted section for the one
    // frame before the new category's real shelf finishes mounting and
    // overwrites it.
    groupRefs.current = {};
    // Jumping always lands on the grouped view -- there's no separate
    // "list mode" to switch into anymore -- and a search-in-progress
    // (either Search All or any category's own scoped search) is cleared,
    // since the person just told us exactly what they wanted by tapping a
    // real result. searchResetKey also bumps, 2026-08-08, so
    // DigestSearchInput's own local, per-keystroke text actually clears too
    // -- these two setters alone no longer reach it now that it lives in
    // its own isolated child component (see that component's own comment).
    setSearchQuery('');
    setCategorySearchQuery('');
    setIsSearchActive(false);
    setSearchResetKey((key) => key + 1);
    setExpandedId(id);
    scrollGroupIntoView(shelfGroupKeyForEntry(id, category));
  }

  // Opens the fixed-header Glossary shortcut's own view -- see
  // glossaryOpen's own comment above for why this is a separate boolean
  // rather than routing through lens/selectedTopicGroup. Clears a stale
  // search the same way jumpToRelated does (a lingering search shouldn't
  // survive the jump), but deliberately leaves lens/selectedTopicGroup
  // completely untouched -- there's nothing to drill into here, and
  // whatever was showing underneath needs to still be there, unchanged,
  // the instant Glossary closes again.
  function openGlossary() {
    setGlossaryOpen(true);
    setSearchQuery('');
    setCategorySearchQuery('');
    setIsSearchActive(false);
    setSearchResetKey((key) => key + 1);
    setExpandedId(null);
  }

  // Glossary's own single flat shelf has no per-topic groups to resolve a
  // real scroll target from the way toggleEntry's shared version needs
  // (shelfGroupKeyForEntry expects a real DigestCategoryKey, and glossary
  // entries span 14 different ones) -- there's only ever the one group,
  // so this scrolls to its own fixed label directly instead.
  function toggleGlossaryEntry(id: string) {
    const wasExpanded = expandedId === id;
    setExpandedId(wasExpanded ? null : id);
    if (!wasExpanded) scrollGroupIntoView('Glossary');
  }

  // Commits DigestSearchInput's own debounced text up to this screen's
  // real, "everything downstream reads this" state -- Search All's own
  // whole-Digest searchQuery, or every other lens's shared, category-scoped
  // categorySearchQuery. Only fires ~200ms after a real pause in typing
  // (the debounce lives inside DigestSearchInput itself now), so this
  // screen only re-renders that rarely while someone's actively typing, not
  // once per character.
  const handleDebouncedSearchChange = useCallback(
    (text: string) => {
      if (lens === 'search') setSearchQuery(text);
      else setCategorySearchQuery(text);
    },
    [lens],
  );
  // Fires the INSTANT DigestSearchInput's own local text crosses the empty/
  // non-empty boundary -- not once per character either, only on that one
  // real transition -- so headerCard can hide/show and the empty-vs-results
  // branching below can react immediately, well before the debounced text
  // above ever catches up. Two real fixes bundled into one callback, both
  // 2026-08-08, direct request: "when I start to search in any section...
  // the search results should automatically be displayed right below the
  // subheader... either moving the section specific starting box up out of
  // the way or some other method that displays the search results without
  // having to scroll to find them." headerCard (below) hides outright the
  // instant isSearchActive turns true, so results become the very first
  // thing in the ScrollView rather than sitting below it -- and snapping
  // the scroll position back to the top right here guards against a stale
  // position from before searching started (already scrolled deep into a
  // shelf or the tree when typing begins), so results land right under the
  // fixed subheader with nothing to scroll past either way.
  const handleSearchActiveChange = useCallback((active: boolean) => {
    setIsSearchActive(active);
    if (active) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, []);

  // Clears whichever search is currently active (Search All's own
  // searchQuery, or a category's own categorySearchQuery) and returns to
  // that same lens's own resting main page -- 2026-08-08, the real
  // companion to the breadcrumb's own new conditional behavior below.
  // Direct correction: "The Back to the digest breadcrumb should only be
  // available at the top of each of the initial lens opening areas...
  // If they are in one of the sections of the Digest already and they
  // search that section, [backing out] should take them back to the main
  // page for that section, not the digest lenshub menu." Deliberately does
  // NOT touch `lens`, `revealed`, or `openTrigger` -- unlike the "‹ Back to
  // Digest" link (which exits to the LensHub picker), this stays on the
  // exact same lens and just drops the search, the same real distinction
  // driving which of the two links renders in the fixedHeader below.
  function clearSearch() {
    setSearchQuery('');
    setCategorySearchQuery('');
    setIsSearchActive(false);
    setSearchResetKey((key) => key + 1);
  }

  return (
    <View style={styles.screen}>
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Digest" variant="field" revealed={revealed}>
          <View style={styles.screenColumn}>
            {/* A real, fixed (non-scrolling) header strip -- 2026-08-08,
                direct request: "move the internal search utility to the
                top and make it the subheader that stays at the top under
                the app header," the same treatment already given to the
                whole-Digest search bar earlier the same day before that
                bar itself moved back into the LensHub picker. Only the
                back link and the search box stay fixed here -- a real,
                direct follow-up correction the same day: "the search
                utility is supposed to be above the generic about this
                section box and that box should scroll under it just as
                the rest would. Only the search utility and the breadcrumb
                navigation remain in the subheader." headerCard (the
                icon/title/description block) moved below, now the first
                real item inside the ScrollView -- it scrolls away with
                everything else, same as every other piece of content. */}
            <View style={styles.fixedHeader}>
              {/* A real, always-available way back to the resting "nothing
                  picked yet" screen -- 2026-08-08, direct correction: "there
                  is no way to back out of an area to go back to the level
                  before, all the way to the Digest home screen with the
                  LensHub menu showing so the user can choose another lens if
                  they want to." Basic Health's own tree used to have a
                  separate, one-level-at-a-time "back" link of its own
                  (BasicHealthTree's own onBack, removed 2026-08-14 along
                  with the rest of the tree) -- this link always did, and
                  still does, something different: a real escape hatch back
                  to the LensHub picker itself, in one tap, from any lens, at
                  any depth of scroll.
                  2026-08-08, same day, real follow-up: "when I hit back to
                  digest breadcrumb from any section, it should close the
                  current section and display the Digest LensHub menu for
                  the user to select another topic." Bumps openTrigger (see
                  its own comment above) after a real, deliberate delay --
                  NOT the same tap that resets `revealed`, a real fix for a
                  real, reported regression: bumping both in the exact same
                  instant reintroduced the app's own known "popup visibly
                  drops in from above" glitch (see LensHub.tsx's own history
                  comment on that bug), since this screen's own large
                  ScrollView content was still mid-unmount from `revealed`
                  flipping false at the exact same moment the popup's own
                  opening animation began -- the same class of "two heavy
                  visual transitions landing on the same instant" problem
                  LensHub's own choose() already exists to avoid the other
                  direction (closing this popup before revealing new
                  content). TAB_REVEAL_DURATION_MS is that same shared
                  timing constant, reused here rather than a second,
                  separately-tuned number -- by the time it elapses, the
                  content this tap just hid has already finished
                  unmounting, so the popup opens against a settled screen. */}
              {/* 2026-08-08, direct correction: this link should only ever
                  open the LensHub picker (the "initial lens opening area"
                  for the tab as a whole) while sitting on a category's own
                  resting main page -- once a search (Search All's own, or
                  any category's own scoped search) is active, this becomes
                  a "‹ Clear search" link instead, which drops the search and
                  returns to that SAME lens's own main page rather than
                  exiting to the picker. Tapping an actual search result
                  already lands you on the right category's own main page too
                  (see jumpToRelated) -- this is the equivalent for backing
                  out without picking a result. */}
              {/* 2026-08-09, direct request: a small (i) icon "above the
                  search bar to the right of the breadcrumb" explaining the
                  multi-word search scoring and what the little match dots'
                  three colors mean. The breadcrumb link itself used to BE
                  this whole row (a single TouchableOpacity); now it's the
                  left side of a real row, with this icon as its own,
                  separate tap target on the right -- SEARCH_MATCH_HELP_
                  SECTIONS/searchMatchHelpVisible above own the actual
                  content and open state. */}
              <View style={styles.breadcrumbRow}>
                {glossaryOpen ? (
                  // 2026-08-23: closing Glossary just flips this one
                  // boolean back off -- lens/selectedTopicGroup were never
                  // touched opening it (see openGlossary's own comment),
                  // so whatever was showing underneath is still exactly
                  // there, unchanged.
                  <TouchableOpacity
                    onPress={() => setGlossaryOpen(false)}
                    accessibilityRole="button"
                    accessibilityLabel={`Back to ${activeLensLabel}`}
                  >
                    <Text style={styles.backToHomeText}>‹ Back to {activeLensLabel}</Text>
                  </TouchableOpacity>
                ) : isSearchActive ? (
                  <TouchableOpacity
                    onPress={clearSearch}
                    accessibilityRole="button"
                    accessibilityLabel={`Clear search, back to ${searchScopeLabel}`}
                  >
                    <Text style={styles.backToHomeText}>‹ Clear search</Text>
                  </TouchableOpacity>
                ) : drilldownTopicLabel ? (
                  // 2026-08-23, direct correction: drilled into a Basic
                  // Health subgroup, this link used to still say "‹ Back to
                  // Digest" and exit straight out to the LensHub picker,
                  // skipping right past the Basic Health menu itself. One
                  // step back at a time now, the same breadcrumb depth every
                  // other back link in this app respects -- this steps back
                  // to the current category's own menu; from there, the
                  // branch below steps back out to Digest, same as it
                  // always has.
                  //
                  // Direct follow-up, same day: generalized from "‹ Back to
                  // Basic Health" specifically to "‹ Back to {activeLensLabel}"
                  // once every category (not just Basic Health) gained the
                  // same menu-first drill-down, so a Hashimoto's topic reads
                  // "‹ Back to Hashimoto's Disease," a Recipes topic reads
                  // "‹ Back to Recipes," and so on.
                  <TouchableOpacity
                    onPress={() => setSelectedTopicGroup(null)}
                    accessibilityRole="button"
                    accessibilityLabel={`Back to ${activeLensLabel}, choose another topic`}
                  >
                    <Text style={styles.backToHomeText}>‹ Back to {activeLensLabel}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setRevealed(false);
                      setTimeout(() => setOpenTrigger(`back-${Date.now()}`), TAB_REVEAL_DURATION_MS);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Back to Digest home, choose another topic"
                  >
                    <Text style={styles.backToHomeText}>‹ Back to Digest</Text>
                  </TouchableOpacity>
                )}

                {/* 2026-08-23, direct instruction: Glossary gets its own
                    button "above the search bar to the right of the Back
                    to (place) button," in the exact slot the match-help
                    (i) icon used to sit -- that icon moved into the
                    search field itself instead (see DigestSearchInput's
                    own onPressInfo below). Same solid-fill pill treatment
                    backToHomeText already established on the left side of
                    this same row, not a separate style invented for one
                    more button. */}
                <TouchableOpacity
                  onPress={openGlossary}
                  accessibilityRole="button"
                  accessibilityLabel="Open the Glossary"
                >
                  <Text style={styles.backToHomeText}>Glossary</Text>
                </TouchableOpacity>
              </View>

              <DigestSearchInput
                key={searchResetKey}
                style={styles.searchInput}
                placeholder={lens === 'search' ? 'Search the whole Digest...' : `Search within ${searchScopeLabel}...`}
                onDebouncedChange={handleDebouncedSearchChange}
                onActiveChange={handleSearchActiveChange}
                onPressInfo={() => setSearchMatchHelpVisible(true)}
              />
              <EdgeShadow direction="down" style={styles.edgeShadowFullWidth} />
            </View>

            <HelpSheet
              visible={searchMatchHelpVisible}
              onClose={() => setSearchMatchHelpVisible(false)}
              pageTitle="Search Matching"
              sections={SEARCH_MATCH_HELP_SECTIONS}
              extra={<SearchMatchDemo />}
            />

            <ScrollView
              ref={scrollRef}
              style={styles.body}
              contentContainerStyle={scrollContentContainerStyle}
              onScroll={(event) => {
                currentScrollY.current = event.nativeEvent.contentOffset.y;
              }}
              // Two real, additional update points alongside onScroll itself
              // -- onScroll is throttled (scrollEventThrottle={16} below),
              // so a manual scroll/fling that lands right as this screen's
              // own scrollGroupIntoView needs a fresh currentScrollY value
              // could read a value that's a frame or two stale. Both of
              // these fire once, unthrottled, exactly when a real scroll
              // gesture genuinely finishes -- the same real pattern
              // LensHub.tsx already uses for its own scroll-hint tracking.
              onMomentumScrollEnd={(event) => {
                currentScrollY.current = event.nativeEvent.contentOffset.y;
              }}
              onScrollEndDrag={(event) => {
                currentScrollY.current = event.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
            >
              {/* Wrapped in an opaque card, not sitting bare on the shared
                  flower background -- reported as unreadable that way. Every
                  other tab's own top-of-content text either already sits on a
                  card (Insights/Schedule) or opts into textShadow when it
                  truly has to render straight over the photo (Home's
                  greeting) -- a card is the better fit here, since this
                  header block is real page-identity content, not a one-line
                  caption over open sky. The first real thing inside this
                  ScrollView, per the correction above -- it scrolls under the
                  fixed search box exactly like the rest of this category's
                  own content does.
                  Hidden outright the instant a real search is active (see
                  isSearchActive's own comment) -- "moving the section
                  specific starting box up out of the way," the option this
                  request named first, rather than leaving it sitting above
                  the results as something to scroll past. */}
              {isSearchActive ? null : (
                <View style={styles.headerCard}>
                  <View style={styles.categoryHeaderRow}>
                    {/* 2026-08-23: Glossary always gets the plain ribbon
                        icon, same as Basic Health's own generic header --
                        it isn't any one condition, so ActiveConditionIcon
                        (whichever condition `lens` currently is) would be
                        wrong here regardless of what's showing underneath. */}
                    {glossaryOpen ? (
                      <PurpleRibbonIcon size={22} color={TAB_COLOR} />
                    ) : ActiveConditionIcon ? (
                      <ActiveConditionIcon size={36} color={TAB_COLOR} />
                    ) : (
                      <PurpleRibbonIcon size={22} color={TAB_COLOR} />
                    )}
                    <Text style={styles.categoryHeaderText}>{glossaryOpen ? 'Glossary' : (drilldownTopicLabel ?? activeLensLabel)}</Text>
                  </View>
                  {/* 2026-08-23: the generic category-wide blurb ("Food,
                      vitamins, minerals..." for Basic Health, or any other
                      category's own DIGEST_CATEGORY_META description)
                      belongs to that category as a whole, not to whichever
                      one topic is currently drilled into -- shown only on
                      the top-level menu (drilldownTopicLabel === null).
                      Once a topic is picked, drilldownTopicDescription
                      (Basic Health topics only, see that variable's own
                      comment) takes its place if one exists; every other
                      category's own drilled-in topic renders no
                      description at all rather than incorrectly falling
                      back to the whole category's own blurb, the same real
                      bug this fixed for Basic Health originally, now
                      avoided everywhere else too. Glossary reuses its own
                      already-written BASIC_HEALTH_TOPICS description
                      directly (single source), not a second copy of the
                      same sentence. */}
                  {(() => {
                    const description = glossaryOpen
                      ? BASIC_HEALTH_TOPICS.find((topic) => topic.label === 'Glossary')?.description
                      : drilldownTopicLabel
                        ? drilldownTopicDescription
                        : lens === 'search'
                          ? `Search across all ${ALL_DIGEST_ENTRIES.length} entries in this Digest at once, not just one category.`
                          : DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.description;
                    return description ? <Text style={styles.categoryDescription}>{description}</Text> : null;
                  })()}
                </View>
              )}

              {glossaryOpen ? (
                // The one flat shelf every glossary- prefixed entry lives
                // in, regardless of which of the 14 real categories each
                // one is individually assigned to -- see glossaryOpen's own
                // comment above. Same BasicHealthShelves component (and
                // its own real tap-to-expand/scroll-into-view behavior)
                // every other category's own topic shelves already use,
                // just handed exactly one group instead of several.
                <BasicHealthShelves
                  groups={[{ label: 'Glossary', entries: allGlossaryEntries }]}
                  expandedId={expandedId}
                  groupRefs={groupRefs}
                  onToggleEntry={toggleGlossaryEntry}
                  onJumpToRelated={jumpToRelated}
                />
              ) : lens === 'search' ? (
                !isSearchActive ? (
                  <Text style={styles.emptyText}>
                    Type a word or phrase to search every category at once, a mechanism, a food, an
                    author&apos;s name, anything this Digest actually says somewhere.
                  </Text>
                ) : searchQuery.trim().length === 0 ? (
                  // isSearchActive already flipped true (DigestSearchInput's
                  // own instant signal), but the debounced searchQuery
                  // hasn't caught up yet -- render nothing for this brief
                  // window rather than a misleading "no matches" message.
                  null
                ) : searchResults.length === 0 ? (
                  <Text style={styles.emptyText}>No matches for &ldquo;{searchQuery.trim()}&rdquo;.</Text>
                ) : (
                  <>
                    <Text style={styles.searchResultCount}>
                      {searchResults.length} match{searchResults.length === 1 ? '' : 'es'}
                    </Text>
                    {searchResults.map(({ entry, match }) => (
                      <SearchResultCard key={entry.id} entry={entry} match={match} onPress={() => jumpToRelated(entry.id)} />
                    ))}
                  </>
                )
              ) : isSearchActive ? (
                // Every real category -- Basic Health included -- filters
                // its OWN real hierarchical structure now, rather than
                // swapping to a flat, undifferentiated results list --
                // 2026-08-08, direct request: "all things below in the
                // knowledgebase hierarchical set of the area are displayed
                // below and filtered to display the specific topics of
                // interest that are related to what they searched for."
                // Basic Health's own real topic/subtopic groups (every leaf
                // at once, not drilled into one at a time -- see
                // basicHealthAllGroups' own comment) or a condition's own
                // real topic groups (plus its closing synthesis entry, if
                // it has one) are each filtered down to just the entries
                // that actually match, with any group that ends up empty
                // dropped entirely -- reusing BasicHealthShelves' own
                // shelf-row-plus-detail-panel rendering unchanged, the same
                // real component every category already uses to show its
                // groups when NOT searching. categorySearchGroups is a real
                // useMemo above. Gated on isSearchActive (not
                // categorySearchQuery directly) so this branch is reached
                // the instant typing starts, never falling through to the
                // tree/shelf view below for the brief window before the
                // debounced categorySearchQuery itself catches up.
                categorySearchQuery.trim().length === 0 ? null : categorySearchTotalMatches === 0 ? (
                  <Text style={styles.emptyText}>
                    No matches for &ldquo;{categorySearchQuery.trim()}&rdquo; in {searchScopeLabel}.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.searchResultCount}>
                      {categorySearchTotalMatches} match{categorySearchTotalMatches === 1 ? '' : 'es'}
                    </Text>
                    <BasicHealthShelves
                      groups={categorySearchGroups}
                      expandedId={expandedId}
                      groupRefs={groupRefs}
                      onToggleEntry={(id) => toggleEntry(id, lens as DigestCategoryKey)}
                      onJumpToRelated={jumpToRelated}
                      matchInfoById={categorySearchMatchInfo}
                      onDynamicEntriesChanged={refreshDynamicEntries}
                      // 2026-08-23: was basicHealth-only; simplified once the
                      // menu-first pattern generalized to every category --
                      // harmless for the rest of them anyway, since none of
                      // their own topic labels contain '::' for this to
                      // match against.
                      hideTopLevelLabel={selectedTopicGroup ?? undefined}
                    />
                  </>
                )
              ) : lens === 'basicHealth' ? (
                // 2026-08-14, direct report: Basic Health used to be the
                // one real outlier still using a separate drill-down-then-
                // back tree (BasicHealthTree, removed) while every
                // condition, plus Earth Matters and Home Gardening, already
                // browsed as one continuous scroll of tap-to-expand shelves.
                // Same real component, same real interaction, as everywhere
                // else now -- basicHealthAllGroups is the exact function
                // Basic Health's own scoped search already proved this
                // shape works for, reused directly rather than a second,
                // parallel grouping mechanism.
                //
                // 2026-08-23, direct correction: showing all ~21 shelves
                // (479 entries) at once was itself the slowness, not
                // fixed by virtualizing each shelf alone. Basic Health's
                // plain-browsing view is now menu-first (DigestTopicMenu,
                // below) -- only the picked TOP-LEVEL topic's own shelf(es)
                // mount at a time, via the exact same BasicHealthShelves
                // component and interaction as before, unchanged. Same-day
                // follow-up: Essential Nutrients' own 22 individual leaf
                // groups are picked as ONE combined menu row
                // (basicHealthMenuGroups, above) and rendered TOGETHER here
                // (every leaf group whose own top-level part matches), the
                // same multi-shelf continuous view every condition category
                // already uses, not drilled one nutrient at a time. No other
                // category's own browsing view is touched by this.
                //
                // Direct follow-up: alphabetized (basicHealthMenuGroups'
                // own sort, and this drill-in view's own sort below, both by
                // shelfGroupDisplayLabel rather than BASIC_HEALTH_TOPICS'
                // declared order).
                //
                // 2026-08-23, direct correction: the back link that used to
                // sit here, in the scrolling body, is gone -- the fixed
                // breadcrumb row above (drilldownTopicLabel's own
                // branch) already reads "‹ Back to Basic Health" whenever a
                // subgroup is picked, and having a second back-to-the-same-
                // place link in the body duplicated it for no reason.
                selectedTopicGroup === null ? (
                  <DigestTopicMenu groups={basicHealthMenuGroups} onSelectGroup={setSelectedTopicGroup} />
                ) : (
                  <BasicHealthShelves
                    groups={basicHealthGroups
                      .filter((group) => group.label.split('::')[0] === selectedTopicGroup)
                      .sort((a, b) => shelfGroupDisplayLabel(a.label).localeCompare(shelfGroupDisplayLabel(b.label)))}
                    expandedId={expandedId}
                    groupRefs={groupRefs}
                    onToggleEntry={(id) => toggleEntry(id, 'basicHealth')}
                    onJumpToRelated={jumpToRelated}
                    onDynamicEntriesChanged={refreshDynamicEntries}
                    hideTopLevelLabel={selectedTopicGroup}
                  />
                )
              ) : entries.length === 0 ? (
                <Text style={styles.emptyText}>Nothing here yet.</Text>
              ) : (
                // Every real condition category, plus Earth Matters, Home
                // Gardening, Recipes, and My Kitchen/My Favorites -- 2026-08-08,
                // the same shelf-row-plus-detail-panel shape Basic Health's
                // own leaf level uses, grouped into many real topics (see
                // groupConditionEntries' own comment above, its 2026-08-12
                // rebuild from a fixed 4-pillar version, and
                // groupEntriesForLens' own comment for why Earth Matters/
                // Home Gardening each need their own dedicated classifier
                // rather than sharing this one, 2026-08-13).
                //
                // 2026-08-23, direct request: "do the same for the other
                // sections of the Digest," extending Basic Health's own
                // menu-first browsing pattern here too, rather than every
                // one of a category's own topic shelves mounting at once.
                // Reuses selectedTopicGroup and DigestTopicMenu directly --
                // no clustering step is needed the way Basic Health's own
                // Essential Nutrients required, since every one of these
                // categories' own topics is already a single flat level, no
                // '::'-nested subtopics. Topic ORDER is left exactly as each
                // category's own dedicated classifier already curates it
                // (CONDITION_TOPIC_ORDER, EARTH_MATTERS_TOPIC_ORDER, etc.) --
                // asked directly, the call was to keep that reasoned
                // narrative sequencing, not alphabetize it the way Basic
                // Health's own topic-free menu was.
                //
                // The category's own closing "tying together" synthesis, if
                // it has one, now shows on the top-level menu screen only,
                // alongside the topic list -- it's a whole-category
                // synthesis, not content belonging to any one topic, so it
                // doesn't make sense nested inside a single drilled-in
                // topic's own shelf. jumpToRelated resets back to the menu
                // (selectedTopicGroup null) before scrolling to it if
                // something was drilled in when a Related chip pointed here.
                (() => {
                  const { topics, tyingTogether } = groupEntriesForLens(lens as DigestCategoryKey, entries);
                  if (selectedTopicGroup !== null) {
                    return (
                      <BasicHealthShelves
                        groups={topics.filter((topic) => topic.label === selectedTopicGroup)}
                        expandedId={expandedId}
                        groupRefs={groupRefs}
                        onToggleEntry={(id) => toggleEntry(id, lens as DigestCategoryKey)}
                        onJumpToRelated={jumpToRelated}
                        onDynamicEntriesChanged={refreshDynamicEntries}
                      />
                    );
                  }
                  return (
                    <>
                      <DigestTopicMenu
                        groups={topics.map((topic) => ({ label: topic.label, entryCount: topic.entries.length }))}
                        onSelectGroup={setSelectedTopicGroup}
                      />
                      {tyingTogether ? (
                        <View
                          style={styles.shelfSection}
                          ref={(r) => {
                            groupRefs.current[TYING_TOGETHER_GROUP_KEY] = r as unknown as Measurable | null;
                          }}
                        >
                          <Text style={styles.shelfHeading}>Putting It Together</Text>
                          <Animated.View layout={LinearTransition.duration(CARD_LAYOUT_TRANSITION_MS)}>
                            <DigestCard
                              entry={tyingTogether}
                              expanded={expandedId === tyingTogether.id}
                              onToggle={() => toggleEntry(tyingTogether.id, lens as DigestCategoryKey)}
                              onJumpToRelated={jumpToRelated}
                              onDynamicEntriesChanged={refreshDynamicEntries}
                            />
                          </Animated.View>
                        </View>
                      ) : null}
                    </>
                  );
                })()
              )}
            </ScrollView>
          </View>
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Digest" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <LensHub
        pageTitle="Digest"
        // Corner trigger button reads just "Digest", 2026-08-07, explicitly
        // requested -- same buttonLabel-vs-pageTitle split Food's own corner
        // button already uses (that one says "Food" while its popup header
        // stays "Nutrition Builders"). pageTitle itself is untouched: it
        // still has to match TAB_ROUTES' own title exactly (constants/
        // tabs.ts) for the TAB_ROUTES lookup above (icon/color resolution)
        // to keep working, and it still drives the popup's own header text.
        buttonLabel="Digest"
        options={LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        // Back to 3 columns, 2026-08-21, direct request. Was dropped to 2
        // on 2026-08-07 (see git history) because the category set at the
        // time still had the old "Mitochondria & Metabolism"/"Other
        // Autoimmune Diseases" style names, which genuinely didn't fit 2
        // lines at 3 columns' ~95px width. The 2026-08-08 restructure to
        // real per-condition names (Rheumatoid Arthritis, Celiac Disease,
        // Chronic Kidney Disease, etc.) changed that: every current label
        // is 1-3 short words that RN's own greedy word-wrap already breaks
        // cleanly across 2 lines within ~95px (checked word-by-word against
        // the live DIGEST_CATEGORY_META list), so DIGEST_GRID_LABEL_BREAKS
        // stays empty rather than needing forced breaks reintroduced.
        itemLabelLines={2}
        // Still explicit `true` -- unrelated to the column count. Info
        // needs to stay a real grid tile (not the floating bottom-right
        // corner) any time this grid scrolls, which Digest's real
        // category count already does regardless of 2 vs. 3 columns. See
        // infoInGrid's own comment in LensHub.tsx for why the floating
        // corner assumes a non-scrolling grid.
        infoInGrid={true}
        // 2026-08-09, direct request: "The iridescnt circle that is
        // supposed to go around the tapped icon in Digest isn't big
        // enough on any of them, and... they appear to be smaller than
        // the ones used in the other LensHub menus." Every real condition
        // PNG (see components/DigestConditionIcons.tsx) has its own real,
        // non-square aspect ratio, so `contain`-fitting it inside the
        // ordinary shared 30px ceiling left its shorter edge visibly
        // smaller than the ring around it. Scoped to this one page (no
        // other LensHub caller passes these) -- ~29% bigger pill/ring,
        // with the custom-icon and Ionicons ceilings scaled by the same
        // factor so the grid's own 4 non-condition Ionicons tiles (Search,
        // Basic Health, Earth Matters, Home Gardening) stay visually
        // consistent with the 19 condition tiles rather than looking
        // small by comparison. 40 is gridPillSize's own real technical
        // ceiling for gridCustomIconSize (44 - 2*ringWidth, the same
        // "inner circle" math LensHub's own default 30 already follows).
        gridPillSize={44}
        gridCustomIconSize={40}
        gridIconSize={26}
        // Same real custom mark used everywhere else this tab is
        // represented (Home's own shortcut button, TabHub's own grid) --
        // without this, LensHub falls back to TAB_ROUTES' plain Ionicons
        // "ribbon" glyph, which reads as a race/award rosette rather than
        // an awareness ribbon (see PurpleRibbonIcon.tsx's own history).
        // TabHub already special-cases this same path; LensHub has no such
        // per-route special-casing of its own, so it needs this override
        // explicitly.
        renderIcon={(size) => <PurpleRibbonIcon size={size} color={TAB_COLOR} />}
        autoOpenSignal={openTrigger}
        onSelect={(key) => {
          // Same reasoning as jumpToRelated's own reset -- a fresh lens
          // means a fresh set of shelf groups, and a previous category's
          // own stale refs (real, plain labels like "Core Science" that
          // legitimately repeat across every condition) should never
          // linger long enough to be scrolled to by mistake.
          groupRefs.current = {};
          setLens(key);
          // 2026-08-23: same "fresh arrival" reasoning as the reset just
          // above -- picking a category from this picker always lands on
          // its own top-level menu, never mid-drilled into whatever topic
          // a previous visit happened to leave selected.
          setSelectedTopicGroup(null);
          setExpandedId(null);
          // 2026-08-12, direct report: picking a different lens from this
          // popup left the ScrollView sitting at whatever offset the
          // PREVIOUS lens had been scrolled to -- every other reset here
          // (groupRefs, expandedId, search state) already treats a lens
          // switch as a fresh arrival, but the
          // ScrollView's own native scroll offset is a real property of the
          // component instance that swapping its children does NOT reset on
          // its own. An unanimated jump (not scrollGroupIntoView's own
          // animated, measure-based scroll -- there's no target entry to
          // scroll to here, just "start at the top of the new page") plus a
          // matching reset of the same currentScrollY ref
          // measureAndScrollTo/onScroll rely on elsewhere, so nothing reads
          // a stale offset in the brief window before a real onScroll event
          // would otherwise correct it.
          scrollRef.current?.scrollTo({ y: 0, animated: false });
          currentScrollY.current = 0;
          setSearchQuery('');
          setCategorySearchQuery('');
          setIsSearchActive(false);
          // Forces DigestSearchInput to remount with fresh, empty local
          // text -- 2026-08-08, see its own comment for why the two plain
          // setters above alone no longer reach it.
          setSearchResetKey((key2) => key2 + 1);
          setRevealed(true);
        }}
      />
    </View>
  );
}

function categoryLabelForEntry(entry: AnyDigestEntry): string {
  return DIGEST_CATEGORY_META.find((meta) => meta.key === entry.category)?.label ?? entry.category;
}

// A rough, honest estimate -- word count over a real, standard average
// silent-reading pace (~200 words/minute), never rounding down to 0 even
// for a genuinely short entry. Computed from the same real body text
// already shown when expanded, not a separate field to author per entry.
function estimateReadingMinutes(entry: AnyDigestEntry): number {
  const text = isProblemFoodEntry(entry)
    ? `${entry.problem} ${entry.mechanism} ${entry.swaps.join(' ')}`
    : entry.summary;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Which OTHER categories this entry's own Related chips reach into --
// real, already-known data (every relatedId's own category is already
// resolvable via findDigestEntryById), just not previously surfaced as its
// own visible signal. Deliberately distinct categories only, deduplicated
// by label, and never includes this entry's own category (that's not
// "cross" anything). Real, low-cost readback of data this app already has,
// not a new per-entry tag to author across 800+ entries.
function crossConditionCategories(entry: AnyDigestEntry): { id: string; label: string }[] {
  if (!entry.relatedIds || entry.relatedIds.length === 0) return [];
  const seen = new Set<string>();
  const results: { id: string; label: string }[] = [];
  for (const relatedId of entry.relatedIds) {
    const target = findDigestEntryById(relatedId);
    if (!target || target.category === entry.category) continue;
    const label = categoryLabelForEntry(target);
    if (seen.has(label)) continue;
    seen.add(label);
    results.push({ id: relatedId, label });
  }
  return results;
}

// The fixed subheader's own search box -- 2026-08-08, a real second attempt
// at a reported keyboard-lag fix, this time the actual root cause: this
// component owns its own local, per-keystroke text (a cheap, tiny re-render
// on every character, this component only), and only reports up to
// PurpleDigestScreen via onDebouncedChange once ~200ms has passed with no
// further typing. The earlier attempt debounced a value DERIVED from that
// screen's own raw state instead of moving the raw state itself out of that
// screen -- meaning the screen (and its entire large content tree below)
// still re-rendered on every single keystroke regardless, since its own
// state was what changed; only the EXPENSIVE recomputation was skipped, not
// the (much more expensive) React reconciliation of however many real
// shelf/card components read that data. Isolating the raw keystroke here
// means PurpleDigestScreen is never even told a keystroke happened until
// the debounce below has already settled -- it only re-renders once per
// real pause in typing, the same real fix already proven for a very
// similar problem elsewhere in this app (AppTextInput.tsx's own history,
// which fixed a different specific mechanism but the same underlying
// "heavy owning screen blocking the next keypress" symptom).
//
// onActiveChange is a SEPARATE, non-debounced signal -- fires the instant
// this box's own text crosses the empty/non-empty boundary, not on every
// character, so the parent can hide headerCard and snap the scroll position
// immediately without needing to know about every keystroke to do it.
//
// Deliberately has no reset-on-prop-change logic of its own -- the caller
// remounts this component outright (via a changing `key`) whenever the box
// should clear, which resets `localValue` to its own default for free. See
// PurpleDigestScreen's own searchResetKey for where that's driven from.
function DigestSearchInput({
  placeholder,
  style,
  onDebouncedChange,
  onActiveChange,
  onPressInfo,
}: {
  placeholder: string;
  style: TextStyle;
  onDebouncedChange: (text: string) => void;
  onActiveChange: (active: boolean) => void;
  // 2026-08-23, direct request: the match-help (i) icon moved from its
  // own separate spot above the field (breadcrumbRow) to sitting inside
  // the field itself, on the right. Owned by the caller (opens a real
  // HelpSheet there), this component only renders the tap target.
  onPressInfo: () => void;
}) {
  const [localValue, setLocalValue] = useState('');
  const wasActive = useRef(false);

  // Wrapped in useCallback -- real, not just tidiness. AppTextInput's own
  // registration effect (see that file's own history comment) re-fires
  // AppKeyboard's own registration whenever onChangeText's identity
  // changes, not just when this component's own state does -- a plain,
  // unmemoized function here would get a brand new identity every time
  // this component re-renders (i.e. every keystroke), silently
  // reintroducing the exact per-keystroke AppKeyboard re-render cascade
  // this whole fix exists to avoid, just one layer further down than
  // before. onActiveChange is already stable from the parent (its own
  // useCallback), so this stays stable across every keystroke too.
  const handleChangeText = useCallback(
    (text: string) => {
      setLocalValue(text);
      const active = text.trim().length > 0;
      if (active !== wasActive.current) {
        wasActive.current = active;
        onActiveChange(active);
      }
    },
    [onActiveChange],
  );

  const debouncedValue = useDebouncedValue(localValue, 200);
  useEffect(() => {
    onDebouncedChange(debouncedValue);
    // onDebouncedChange is expected to be stable-ish (PurpleDigestScreen's
    // own useCallback), and even if it weren't, re-committing the same
    // already-current text is harmless -- this effect's real trigger is
    // debouncedValue changing, not onDebouncedChange's own identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  // 2026-08-19, direct request: the mic moved from a separate button beside
  // the field to actually sitting inside it, on whichever side
  // NAVIGATION_HAND currently favors -- the same shared flag
  // constants/floatingButton.ts already established for "which side are the
  // buttons on" (see that file's own comment), read here rather than a
  // second, Digest-only notion of handedness. An interactive control this
  // gets tapped/held while dictating belongs on the hand's own side, the
  // same reasoning the floating hubs already cluster that way; when a real
  // handedness setting eventually exists, NAVIGATION_HAND flipping to
  // 'right' moves this too, with no change needed here.
  const micOnLeft = NAVIGATION_HAND === 'left';

  return (
    <View style={styles.searchInputWrap}>
      {/* 2026-08-23: both sides now always need clearance, not just
          whichever one the mic happens to be on -- the match-help (i)
          icon (below) is deliberately pinned to the right regardless of
          NAVIGATION_HAND (a plain informational tap target, not something
          that needs to track hand preference the way the mic does), so as
          long as the mic sits on the left (true today), text needs room
          on both sides at once. If NAVIGATION_HAND ever really becomes
          'right', the mic would land on the same side as this icon --
          a real gap to revisit then, not solved preemptively for a
          setting that doesn't exist yet (see that flag's own comment). */}
      <AppTextInput style={[style, styles.searchInputPadBoth]} placeholder={placeholder} value={localValue} onChangeText={handleChangeText} />
      {/* Every result (partial included) replaces the query live, the
          same real "search as you speak" feel a phone's own voice
          search already has -- reuses handleChangeText directly, so a
          spoken result goes through the exact same debounce/
          active-change pipeline a typed one does, never a second,
          competing state path. */}
      <VoiceInputButton
        onResult={(transcript) => handleChangeText(transcript)}
        style={[styles.searchInputMicButton, micOnLeft ? styles.searchInputMicButtonLeft : styles.searchInputMicButtonRight]}
      />
      {/* 2026-08-23, direct request: "move the Information icon into the
          right hand side of the search field itself." Fixed right,
          unconditionally -- see this component's own header comment. */}
      <Pressable
        onPress={onPressInfo}
        hitSlop={10}
        style={styles.searchInputInfoButton}
        accessibilityRole="button"
        accessibilityLabel="How search matching and the match dots work"
      >
        <Ionicons name="information-circle-outline" size={20} color={TAB_COLOR} />
      </Pressable>
    </View>
  );
}

// A compact, unexpandable result row for the Search All lens -- tapping it
// reuses jumpToRelated (the same mechanism a Related chip already uses),
// so it lands you at the real card, in its real category, expanded and
// scrolled into view, rather than trying to render the full entry a second
// time inside the search results themselves.
// 2026-08-09, real per-term match display added directly to this card --
// direct request: "if I search for Sleep and Inflammation, or in reverse
// order, the search results should tell me if one or the other or both
// items appeared in the result and how much weight this entry has based
// on the search criteria." A plain summary line ("2 of 2 terms matched")
// answers the "how much weight" half on its own; the row of per-term pills
// below it answers the "one or the other or both" half directly and
// specifically -- each real typed term gets its own pill, filled solid
// when it hit this entry's own title (the same real, stronger 3x match
// this app's own ranking has always used internally), outlined when it
// only matched somewhere in the body or a citation, and shown dim/crossed
// out when it didn't match this particular entry at all -- so a two-word
// search instantly shows which entries are about BOTH words and which are
// only about one of them, rather than leaving that entirely to guesswork
// based on ranking order alone.
function MatchSummaryRow({ match }: { match: SearchMatchInfo }) {
  return (
    <View style={styles.matchBlock}>
      <Text style={styles.matchSummaryText}>
        {match.matchedTermCount} of {match.totalTermCount} search term{match.totalTermCount === 1 ? '' : 's'} matched
      </Text>
      <View style={styles.matchTermRow}>
        {match.terms.map((termMatch) => (
          <View
            key={termMatch.term}
            style={[
              styles.matchTermPill,
              termMatch.matchedInTitle
                ? styles.matchTermPillTitle
                : termMatch.matchedAnywhere
                  ? styles.matchTermPillBody
                  : styles.matchTermPillMiss,
            ]}
          >
            <Text
              style={[
                styles.matchTermPillText,
                termMatch.matchedInTitle ? styles.matchTermPillTextTitle : null,
                !termMatch.matchedAnywhere ? styles.matchTermPillTextMiss : null,
              ]}
            >
              {termMatch.term}
              {termMatch.matchedInTitle ? ' · title' : termMatch.matchedAnywhere ? '' : ' · not found'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// The demo-only, LABELED version of the same real dot row ShelfTabCard
// renders (see that component's own comment on `match`) -- the real,
// on-screen dots never carry a label, since a person already knows the
// order they typed their own words in; a worked example genuinely needs
// one so it's obvious which dot belongs to which word without that
// context. Reuses the exact real matchDot/matchDotTitle/matchDotBody/
// matchDotMiss styles for the dot itself, so this demo is honestly
// identical in color to what the real UI shows, not just a close
// approximation of it.
function DemoDotRow({ match }: { match: SearchMatchInfo }) {
  return (
    <View style={styles.demoDotRow}>
      {match.terms.map((termMatch) => (
        <View key={termMatch.term} style={styles.demoDotColumn}>
          <View
            style={[
              styles.matchDot,
              termMatch.matchedInTitle
                ? styles.matchDotTitle
                : termMatch.matchedAnywhere
                  ? styles.matchDotBody
                  : styles.matchDotMiss,
            ]}
          />
          <Text style={styles.demoDotLabel}>{termMatch.term}</Text>
        </View>
      ))}
    </View>
  );
}

// The real content handed to HelpSheet's own new `extra` slot -- a full
// worked example, not just prose, per direct request: "Show examples of
// the dots... and then show how the dots would be if they were searched
// for from the digest search all utility, and explain the variations of
// the dots in the return search then compared to the section specific
// search[.]" Reuses MatchSummaryRow (the exact real component Search
// All's own result cards already render) directly for the pill half,
// rather than a second, separately-styled mockup that could quietly drift
// out of sync with the real thing -- this demo is pixel-identical to what
// the app actually shows, not an approximation of it.
function SearchMatchDemo() {
  return (
    <View style={styles.demoBlock}>
      <Text style={styles.demoHeading}>Example: searching {DEMO_QUERY_LABEL}</Text>
      <Text style={styles.demoIntro}>
        Three illustrative entries below (not actual Digest content) show how the same three-word search can produce
        different dot patterns, depending on what each entry actually says.
      </Text>
      {DEMO_EXAMPLES.map((example) => (
        <View key={example.title} style={styles.demoExample}>
          <Text style={styles.demoExampleTitle}>{example.title}</Text>
          <DemoDotRow match={example.match} />
          <Text style={styles.demoExampleNote}>{example.note}</Text>
        </View>
      ))}

      <Text style={styles.demoSubheading}>The same three examples in Search All</Text>
      <Text style={styles.demoIntro}>
        Search All shows the identical information as labeled pills instead of plain dots, since its result cards
        have more room to spell out the actual word:
      </Text>
      {DEMO_EXAMPLES.map((example) => (
        <View key={`${example.title}-pills`} style={styles.demoExample}>
          <Text style={styles.demoExampleTitle}>{example.title}</Text>
          <MatchSummaryRow match={example.match} />
        </View>
      ))}

      <Text style={styles.demoClosing}>
        Dots and pills always mean the same three things: solid/filled purple is a title match, outlined purple is a
        body or citation match, and solid/dim grey means that word did not match this entry at all. Dots are the
        compact version, used wherever space is tight, inside the scoped search on every category. Pills are the
        fuller version, used only in Search All, where there is room to write out the actual matched word.
      </Text>
    </View>
  );
}

function SearchResultCard({
  entry,
  match,
  onPress,
}: {
  entry: AnyDigestEntry;
  match: SearchMatchInfo;
  onPress: () => void;
}) {
  const title = isProblemFoodEntry(entry) ? entry.foodName : entry.title;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeaderRow}>
        {!isProblemFoodEntry(entry) ? (
          <View style={[styles.tierDot, { backgroundColor: tierColor(entry.overallTier) }]} />
        ) : null}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.searchResultCategory}>{categoryLabelForEntry(entry)}</Text>
      <Text style={styles.cardTeaser}>{entry.teaser}</Text>
      <MatchSummaryRow match={match} />
    </TouchableOpacity>
  );
}

// Basic Health's own real, 2-level drill-down tree (BasicHealthTree,
// TopicCard) lived here from 2026-08-08 -- "a combination of tree style
// and categorized topic cards in related groups... moving strictly from
// broad categories down to highly specific, bite-sized pieces of
// information" -- through 2026-08-14, when it was removed. Direct report
// that day: "I like the way that the conditions' information is setup for
// how someone uses the information. The Basic Health section doesn't
// follow the same pattern... It seems that area somehow didn't follow the
// same flow as the other areas." Correct -- by then every condition, plus
// Earth Matters and Home Gardening, had already been unified into one
// continuous scroll of tap-to-expand shelf rows with no drilling in or
// backing out required at all (see groupConditionEntries' own comment
// below); Basic Health alone still made someone tap into a topic card,
// then a subtopic card for Essential Nutrients specifically, then tap
// "back" to see anything else. Basic Health now uses the exact same
// BasicHealthShelves component below, fed by basicHealthAllGroups (see
// that function's own comment) -- the same real grouping already proven
// correct here for Basic Health's own scoped search, reused for ordinary
// browsing too, rather than a second, parallel mechanism kept alongside it.

// Every real CONDITION's own grouped browsing view -- 2026-08-08, and, as
// of 2026-08-14, Basic Health's own real browsing view too (see the note
// above). Also used for a condition's own real topic grouping (see
// groupConditionEntries' own comment; rebuilt 2026-08-12 from a fixed
// 4-pillar version into many more, more specific real topics) and for
// every category's own scoped search results. The per-row interaction
// itself was
// rebuilt 2026-08-08, direct correction after an even earlier version (tapping a
// card jumped clean out of the shelf view into a
// completely different, much longer flat list) read as genuinely
// disorienting: "I kind of got lost looking at a few of the magnesium
// cards because it jumped around." The real fix, per direct, exact
// instruction: "The entire row that is being looked at should have each
// of their headers at the top of the row and as I scroll left or right, if
// I tap on one of them the whole row drops down for the one selected
// allowing me to scroll left or right to look at other info that is about
// that topic (Magnesium) so I don't get lost."
//
// So each group is now a self-contained mini-experience, not a launchpad
// into somewhere else: a heading, a horizontal strip of compact "tab"
// cards (their own real header + tier dot + short teaser, always visible,
// always scrollable, staying put regardless of what's expanded), and,
// directly below that same strip, a real detail panel -- the exact same
// DigestCard component every other category already uses, in its own
// expanded state -- that appears the instant one of the row's own tabs is
// tapped. Tapping a DIFFERENT tab in the same strip swaps which entry's
// detail shows below, without the tab strip itself moving or the person
// ever leaving this group's own section. `expandedId` is the same single,
// screen-wide "which one entry is open" state every other category's own
// flat list already uses (see toggleEntry) -- only one group's own panel
// can be genuinely open at once, matching the single-open-accordion
// convention this whole screen already follows everywhere else.
// Converts a group's real ref/scroll key (see BasicHealthShelves' own
// comment above) into what a person should actually see as the group's
// heading -- 2026-08-08, split out once a second special key
// (TYING_TOGETHER_GROUP_KEY) needed the same "real key, different display
// text" treatment the '::'-joined Basic Health path already had. A no-op
// for a plain condition topic label (Core Science, etc.), which is
// neither of these two special shapes.
function shelfGroupDisplayLabel(label: string): string {
  if (label === TYING_TOGETHER_GROUP_KEY) return 'Putting It Together';
  return label.split('::').join(' › ');
}

// A shelf's own heading, with its leading top-level segment dropped when
// already viewing that exact top-level topic (BasicHealthShelves' own
// hideTopLevelLabel prop, see that prop's own comment) -- "Essential
// Nutrients › Magnesium" becomes plain "Magnesium" once the page itself
// already says Essential Nutrients. Falls back to the ordinary full label
// whenever hideTopLevelLabel isn't set or doesn't match this group.
function shelfHeadingLabel(label: string, hideTopLevelLabel?: string): string {
  if (hideTopLevelLabel && label.startsWith(`${hideTopLevelLabel}::`)) {
    return shelfGroupDisplayLabel(label.slice(hideTopLevelLabel.length + 2));
  }
  return shelfGroupDisplayLabel(label);
}

// Every category's own plain-browsing landing view, 2026-08-23, direct
// request, first built for Basic Health: rendering all of a category's own
// groups' shelves at once (479 entries for Basic Health alone) was itself
// the delay, not fixed by virtualizing each shelf alone. A plain, tappable
// list of top-level topic names instead -- picking one drills into that
// topic's own group(s) through the unchanged BasicHealthShelves component
// below, same shelf-row-plus-detail-panel interaction as always.
//
// Direct follow-up, same day: "do the same for the other sections of the
// Digest" -- this component itself needed no change to extend beyond Basic
// Health, it was already generic (`{label, entryCount}[]` in, a label back
// out); only the CALLER differs per category. Basic Health's own caller
// passes basicHealthMenuGroups (already folded to one row per top-level
// topic, Essential Nutrients' own 22 subtopics summed into one row and one
// combined count, sorted alphabetically); every other category's own
// caller passes its topics straight from groupEntriesForLens, in that
// category's own deliberately curated order, left alone rather than
// alphabetized (a direct, separate decision -- see the main render
// branch's own comment).
function DigestTopicMenu({
  groups,
  onSelectGroup,
}: {
  groups: { label: string; entryCount: number }[];
  onSelectGroup: (label: string) => void;
}) {
  return (
    <View style={styles.digestTopicMenuList}>
      {groups.map((group) => (
        <TouchableOpacity
          key={group.label}
          style={styles.digestTopicMenuItem}
          onPress={() => onSelectGroup(group.label)}
          activeOpacity={0.85}
        >
          <Text style={styles.digestTopicMenuItemLabel}>{shelfGroupDisplayLabel(group.label)}</Text>
          <Text style={styles.digestTopicMenuItemCount}>
            {group.entryCount} {group.entryCount === 1 ? 'entry' : 'entries'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function BasicHealthShelves({
  groups,
  expandedId,
  groupRefs,
  onToggleEntry,
  onJumpToRelated,
  matchInfoById,
  onDynamicEntriesChanged,
  hideTopLevelLabel,
}: {
  groups: { label: string; entries: AnyDigestEntry[] }[];
  expandedId: string | null;
  groupRefs: MutableRefObject<Record<string, Measurable | null>>;
  onToggleEntry: (id: string) => void;
  onJumpToRelated: (id: string) => void;
  // 2026-08-09, real per-term match detail for a category's own scoped
  // search -- undefined for every ordinary (non-search) call site, which
  // is exactly what ShelfTabCard needs to know not to render a match
  // indicator at all outside of search.
  matchInfoById?: Map<string, SearchMatchInfo>;
  // 2026-08-15 -- real, in-place refresh for My Kitchen/My Favorites after
  // a photo save, a thumbs-up favorite-add, or a staged share getting
  // promoted/deleted. A harmless no-op prop everywhere else in this Digest.
  onDynamicEntriesChanged?: () => void;
  // 2026-08-23, direct report: drilled into Essential Nutrients, every one
  // of its own 22 shelves still read "Essential Nutrients › Magnesium,"
  // "Essential Nutrients › Vitamin D," and so on -- redundant once the
  // header above (drilldownTopicLabel) and the back link already say
  // exactly which subgroup this is. Set only by Basic Health's own
  // drilled-in view (selectedTopicGroup), to that same top-level
  // label -- a group whose own label starts with `${hideTopLevelLabel}::`
  // shows just its remainder ("Magnesium") instead of the full path.
  // Search results and every condition category's own topic shelves don't
  // pass this at all, so they're unaffected.
  hideTopLevelLabel?: string;
}) {
  // 2026-08-21, a real, repeatedly-reported bug: "the title box was
  // scrolled way to the right of the data card that is supposed to be
  // associated with it... I see this all the time happening." The row's
  // own horizontal ScrollView below had no ref and no scroll-into-view
  // logic at all -- tapping a tab correctly swapped which entry's detail
  // shows in the panel underneath, but nothing ever moved the row itself,
  // so however it happened to be scrolled (from earlier browsing, or a
  // fresh render after a search/category change) stayed exactly where it
  // was, however far the newly-selected tab's own gold-bordered highlight
  // now sat from view. The row deliberately not auto-following selection
  // was the original 2026-08-08 design (its own comment above: "so
  // scrolling left/right through the row never loses track of which one
  // is actually open," relying on the `selected` highlight alone) -- real
  // usage shows that's not enough on its own. This keeps that original
  // freedom to scroll left/right and browse once a tab's open (nothing
  // here fights an in-progress manual scroll), it only adds the one thing
  // that was missing: the instant a DIFFERENT tab actually gets selected,
  // the row scrolls to bring that tab back near view, the same "selecting
  // something scrolls it into view" behavior a tab strip anywhere else
  // would already have. rowScrollRefs is keyed by group.label, the same
  // real per-group key groupRefs above already uses, so each group's own
  // row scrolls independently of every other group's. (2026-08-23: the
  // mechanism below changed from ScrollView+onLayout/measure to FlatList+
  // getItemLayout, see that change's own comment further down -- the
  // problem this paragraph describes, and the fix, are unchanged.)
  // 2026-08-23: rebuilt around FlatList's own getItemLayout instead of the
  // old ScrollView + onLayout/measure approach (see git history for the
  // full prior version) -- that approach needed two real rounds of bug
  // fixing to get right (2026-08-21's own comment, preserved in git
  // history, covered both), and both problems were symptoms of the same
  // root issue: not knowing a card's real x position until it had already
  // rendered. getItemLayout sidesteps that entirely -- every card's exact
  // position is a known formula (SHELF_CARD_STRIDE * index) computed up
  // front, so FlatList can scroll to any entry reliably whether or not
  // it's ever been on screen yet, no race condition possible. This also
  // happens to be the actual fix for "why does it take so long for Basic
  // Health to display" -- FlatList only mounts the cards actually near the
  // visible window, where the old ScrollView + .map() mounted every single
  // one of a group's entries immediately, and Basic Health's own 479 real
  // entries made that the one place it became a real, multi-second stall.
  const rowScrollRefs = useRef<Record<string, FlatList<AnyDigestEntry> | null>>({});

  function tryScrollSelectedIntoView(groupLabel: string, entryId: string, entries: AnyDigestEntry[]) {
    const list = rowScrollRefs.current[groupLabel];
    const index = entries.findIndex((entry) => entry.id === entryId);
    if (list && index !== -1) list.scrollToIndex({ index, animated: true, viewPosition: 0 });
  }

  useEffect(() => {
    if (!expandedId) return;
    const group = groups.find((g) => g.entries.some((entry) => entry.id === expandedId));
    if (!group) return;
    tryScrollSelectedIntoView(group.label, expandedId, group.entries);
    // groups.length as a stand-in for "did the actual set of groups
    // change" -- the group objects themselves are rebuilt every render
    // (groupConditionEntries/BasicHealthTopicLeafView both return fresh
    // arrays), so depending on `groups` directly would refire this every
    // single render, including ones with no real selection change at all.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedId, groups.length]);

  return (
    <>
      {groups.map((group) => {
        const expandedEntry = group.entries.find((entry) => entry.id === expandedId);
        return (
          <View
            key={group.label}
            style={styles.shelfSection}
            // A plain RN View already exposes the same real .measure()
            // scrollGroupIntoView needs -- no Animated.View wrapper
            // required here the way the flat list's own per-card refs
            // need one, since this container's own height changing
            // (the detail panel appearing/disappearing below) doesn't
            // need its own layout-transition animation the way a card
            // growing in place did in the old design.
            ref={(r) => {
              groupRefs.current[group.label] = r as unknown as Measurable | null;
            }}
          >
            {/* group.label doubles as the real ref/scroll-target key
                (shelfGroupKeyForEntry computes the exact same value for a
                given entry -- a Basic Health entry's own '::'-joined tree
                path, or TYING_TOGETHER_GROUP_KEY for a closing synthesis
                entry -- so tapping a shelf tab scrolls correctly whether
                this group came from the plain topic/tree view or the new
                filtered-search view below), so it's converted to a plain,
                readable display string only here, at render time. See
                shelfGroupDisplayLabel's own comment. */}
            <Text style={styles.shelfHeading}>{shelfHeadingLabel(group.label, hideTopLevelLabel)}</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shelfRow}
              data={group.entries}
              keyExtractor={(entry) => entry.id}
              getItemLayout={(_, index) => ({ length: SHELF_CARD_STRIDE, offset: SHELF_CARD_STRIDE * index, index })}
              ref={(node) => {
                rowScrollRefs.current[group.label] = node;
              }}
              renderItem={({ item: entry }) => (
                <ShelfTabCard
                  entry={entry}
                  selected={expandedId === entry.id}
                  onPress={() => onToggleEntry(entry.id)}
                  match={matchInfoById?.get(entry.id)}
                />
              )}
            />
            {expandedEntry ? (
              <Animated.View layout={LinearTransition.duration(CARD_LAYOUT_TRANSITION_MS)} style={styles.shelfDetailPanel}>
                <DigestCard
                  entry={expandedEntry}
                  expanded
                  onToggle={() => onToggleEntry(expandedEntry.id)}
                  onJumpToRelated={onJumpToRelated}
                  onDynamicEntriesChanged={onDynamicEntriesChanged}
                />
              </Animated.View>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

// The row's own compact, always-visible "tab" -- title, tier dot, and a
// short teaser, never itself expandable (the real detail lives in the
// shared panel below the row instead, see BasicHealthShelves above).
// `selected` highlights whichever tab's own entry the panel below
// currently belongs to, so scrolling left/right through the row never
// loses track of which one is actually open.
//
// 2026-08-09, an optional `match` added -- present only when this card is
// being shown as part of a category's own scoped search (see
// BasicHealthShelves' own matchInfoById), undefined the rest of the time.
// Rendered as a compact row of small dots rather than SearchResultCard's
// own full text pills -- this card is already tight on space (title, tier
// dot, and teaser all in a fixed-width tab), so one small, filled/outline/
// dim dot per real search term gives the same "one, the other, or both,
// and how strongly" signal without needing room for the term text itself.
function ShelfTabCard({
  entry,
  selected,
  onPress,
  match,
}: {
  entry: AnyDigestEntry;
  selected: boolean;
  onPress: () => void;
  match?: SearchMatchInfo;
}) {
  const title = isProblemFoodEntry(entry) ? entry.foodName : entry.title;
  return (
    <TouchableOpacity
      style={[styles.shelfCard, selected ? styles.shelfCardSelected : null]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeaderRow}>
        {!isProblemFoodEntry(entry) ? (
          <View style={[styles.tierDot, { backgroundColor: tierColor(entry.overallTier) }]} />
        ) : null}
        <Text style={styles.shelfCardTitle} numberOfLines={3}>
          {title}
        </Text>
      </View>
      <Text style={styles.shelfCardTeaser} numberOfLines={4}>
        {entry.teaser}
      </Text>
      {match ? (
        <View style={styles.matchDotRow}>
          {match.terms.map((termMatch) => (
            <View
              key={termMatch.term}
              style={[
                styles.matchDot,
                termMatch.matchedInTitle
                  ? styles.matchDotTitle
                  : termMatch.matchedAnywhere
                    ? styles.matchDotBody
                    : styles.matchDotMiss,
              ]}
            />
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function RelatedChips({ ids, onJumpToRelated }: { ids: string[]; onJumpToRelated: (id: string) => void }) {
  const targets = ids.map((id) => findDigestEntryById(id)).filter((entry): entry is AnyDigestEntry => entry != null);
  if (targets.length === 0) return null;
  return (
    <View style={styles.relatedBlock}>
      <Text style={styles.relatedLabel}>Related</Text>
      <View style={styles.relatedRow}>
        {targets.map((target) => (
          <TouchableOpacity
            key={target.id}
            style={styles.relatedChip}
            onPress={() => onJumpToRelated(target.id)}
          >
            <Text style={styles.relatedChipText} numberOfLines={1}>
              {isProblemFoodEntry(target) ? target.foodName : target.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Each citation's own source text IS the tappable link (opens the real,
// verified page in the device's own browser) -- a real hyperlink-style
// reference list, not the URL-as-plain-text pattern linkifyText uses
// elsewhere in this app (Insights' own getSubCriterionSources): that
// pattern fits inline prose with an occasional embedded link; a references
// section reads better with the citation's own name as the link text.
// 2026-08-06: `url` is real and required now, not optional -- "the
// references... need to also be linked to the webpage where the
// information is derived, not just cited," per explicit request.
function CitationsBlock({ citations }: { citations: { source: string; url: string }[] }) {
  if (citations.length === 0) return null;
  return (
    <View style={styles.citationsBlock}>
      <Text style={styles.citationsLabel}>Sources</Text>
      {citations.map((citation, index) => (
        <Text
          key={index}
          style={styles.citationLink}
          onPress={() => Linking.openURL(citation.url)}
        >
          {citation.source}
        </Text>
      ))}
    </View>
  );
}

// A small, real metadata row shown right at the top of an entry's own
// expanded detail -- 2026-08-08. A reading-time estimate (a plain,
// computed number, not an authored field) plus, when this entry's own
// Related list reaches into a different condition, a plain, non-tappable
// pill naming that condition -- real, already-known data (every relatedId's
// own category was already resolvable), just not previously surfaced as
// its own visible signal at the top of a card. Deliberately NOT tappable --
// RelatedChips below already IS the real, existing tap-to-jump mechanism,
// labeled by the specific related entry's own title; a second, category-
// labeled tap target here would just be a confusing, redundant way to reach
// the same destination.
function EntryMetaRow({ entry }: { entry: AnyDigestEntry }) {
  const crossCategories = crossConditionCategories(entry);
  return (
    <View style={styles.metaRow}>
      <Text style={styles.readingTimeText}>{estimateReadingMinutes(entry)} min read</Text>
      {crossCategories.map((category) => (
        <View key={category.id} style={styles.crossConditionPill}>
          <Text style={styles.crossConditionPillText} numberOfLines={1}>
            {category.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Minimal, opt-in bold-text support -- 2026-08-08, one of the real,
// contained wins named in the original knowledge-base-design discussion
// ("bold key takeaways" inline in an article's own prose). Deliberately
// NOT a retrofit of all 840 existing entries (none of them use this
// syntax today, confirmed directly before building this -- a real,
// zero-risk no-op for every entry that already exists) -- this is
// infrastructure a FUTURE entry can opt into by wrapping a phrase in
// `**like this**`, the same familiar markdown convention, without any
// further rendering-layer work needed later. Deliberately minimal: no
// italics, no links, no nested formatting -- just the one, most-requested
// emphasis a plain evidence write-up actually benefits from.
function renderRichText(text: string, boldStyle: TextStyle) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part.length > 0);
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <Text key={index} style={boldStyle}>
        {part.slice(2, -2)}
      </Text>
    ) : (
      part
    ),
  );
}

// A real, local-only thumbs-up/down control -- 2026-08-08, self-contained
// (loads and saves its own one entry's value directly, see lib/
// digestFeedback.ts's own comment for why) rather than threaded as props
// through BasicHealthShelves, already several props deep. Tapping the
// already-active choice again clears it back to no opinion, the same
// toggle shape this app's own PopoverSelect-adjacent controls already use
// elsewhere.
// 2026-08-15, direct request: a thumbs-up doubles as "add to favorites"
// for any entry that has a real favoritable backing -- a My Kitchen
// creation, or one of the 47 curated Recipes. Only ever called on the real
// "just became up" transition (see FeedbackRow's own handlePress below),
// so re-tapping an already-up thumb, or toggling down then up again,
// never creates a duplicate favorite. Returns false (a real, silent no-op,
// not an error) for every entry with nothing real to favorite -- an
// already-favorited My Favorites entry, a favorite MEAL/staged-share
// entry (no single componentId to snapshot), or any of this Digest's
// 1,500+ ordinary science/content entries.
async function tryAddEntryToFavorites(entry: AnyDigestEntry): Promise<boolean> {
  if (isProblemFoodEntry(entry)) return false;
  if (entry.category === 'myFavorites') return false;

  if (entry.category === 'myKitchen' && entry.dynamicAction?.kind === 'component') {
    const payload = await buildBuilderFavoritePayload(entry.dynamicAction.componentType, entry.dynamicAction.componentId);
    if (!payload) return false;
    await saveBuilderFavorite(entry.dynamicAction.componentType, payload);
    return true;
  }

  if (entry.linkedCuratedRecipeId && entry.linkedBuilderType) {
    const recipe = await getCuratedRecipe(entry.linkedCuratedRecipeId);
    if (!recipe) return false;
    await saveBuilderFavorite(entry.linkedBuilderType, {
      name: recipe.name,
      servings: recipe.servings,
      servingSizeAmount: recipe.servingSizeAmount,
      servingSizeUnit: recipe.servingSizeUnit,
      ingredients: recipe.ingredients,
    });
    return true;
  }

  return false;
}

function FeedbackRow({ entry, onDynamicEntriesChanged }: { entry: AnyDigestEntry; onDynamicEntriesChanged?: () => void }) {
  const entryId = entry.id;
  const [value, setValue] = useState<DigestFeedbackValue | null>(null);
  const [justFavorited, setJustFavorited] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getDigestFeedbackFor(entryId).then((loaded) => {
      if (!cancelled) setValue(loaded);
    });
    setJustFavorited(false);
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  const handlePress = (next: DigestFeedbackValue) => {
    const becameUp = next === 'up' && value !== 'up';
    const resolved = value === next ? null : next;
    setValue(resolved);
    setDigestFeedback(entryId, resolved).catch(() => {
      // A failed local write isn't worth surfacing to the person over --
      // worst case, this one tap's own preference doesn't persist; the UI
      // itself already reflects the tap either way.
    });
    if (becameUp) {
      tryAddEntryToFavorites(entry)
        .then((added) => {
          if (added) {
            setJustFavorited(true);
            onDynamicEntriesChanged?.();
          }
        })
        .catch((error) => console.error('[FeedbackRow] Failed to add to favorites', error));
    }
  };

  return (
    <View>
      <View style={styles.feedbackRow}>
        <Text style={styles.feedbackPrompt}>Was this helpful?</Text>
        <TouchableOpacity
          onPress={() => handlePress('up')}
          accessibilityRole="button"
          accessibilityLabel="Mark this entry helpful"
          hitSlop={8}
        >
          <Ionicons
            name={value === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
            size={18}
            color={value === 'up' ? colors.accent : colors.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handlePress('down')}
          accessibilityRole="button"
          accessibilityLabel="Mark this entry not helpful"
          hitSlop={8}
        >
          <Ionicons
            name={value === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
            size={18}
            color={value === 'down' ? colors.danger : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
      {justFavorited ? <Text style={styles.favoriteAddedText}>Added to your Favorites.</Text> : null}
    </View>
  );
}

function DigestCard({
  entry,
  expanded,
  onToggle,
  onJumpToRelated,
  onDynamicEntriesChanged,
}: {
  entry: AnyDigestEntry;
  expanded: boolean;
  onToggle: () => void;
  onJumpToRelated: (id: string) => void;
  // 2026-08-15 -- real, in-place refresh for My Kitchen/My Favorites, see
  // BasicHealthShelves' own comment on the identical prop.
  onDynamicEntriesChanged?: () => void;
}) {
  const router = useRouter();
  if (isProblemFoodEntry(entry)) {
    return (
      <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{entry.foodName}</Text>
        </View>
        <Text style={styles.cardTeaser}>{entry.teaser}</Text>
        {expanded ? (
          <View style={styles.cardDetail}>
            <EntryMetaRow entry={entry} />
            <Text style={styles.detailLabel}>The problem</Text>
            <Text style={styles.detailText}>{renderRichText(entry.problem, styles.detailTextBold)}</Text>
            <Text style={styles.detailLabel}>The mechanism</Text>
            <Text style={styles.detailText}>{renderRichText(entry.mechanism, styles.detailTextBold)}</Text>
            <Text style={styles.detailLabel}>Swaps</Text>
            {entry.swaps.map((swap, index) => (
              <Text key={index} style={styles.swapText}>
                {'•'} {swap}
              </Text>
            ))}
            {entry.chart ? <DigestBarChart chart={entry.chart} color={colors.accent} /> : null}
            {entry.stageNote ? <Text style={styles.stageNoteText}>{entry.stageNote}</Text> : null}
            <CitationsBlock citations={entry.citations} />
            {entry.relatedIds ? <RelatedChips ids={entry.relatedIds} onJumpToRelated={onJumpToRelated} /> : null}
            <FeedbackRow entry={entry} />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.85}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.tierDot, { backgroundColor: tierColor(entry.overallTier) }]} />
        <Text style={styles.cardTitle}>{entry.title}</Text>
      </View>
      <Text style={styles.cardTeaser}>{entry.teaser}</Text>
      {expanded ? (
        <View style={styles.cardDetail}>
          <Text style={[styles.tierLabelText, { color: tierColor(entry.overallTier) }]}>
            {tierLabel(entry.overallTier)}
          </Text>
          <EntryMetaRow entry={entry} />
          <Text style={styles.detailText}>{renderRichText(entry.summary, styles.detailTextBold)}</Text>
          {entry.linkedCuratedRecipeId && entry.linkedBuilderType ? (
            <View style={styles.recipeButtonRow}>
              <TouchableOpacity
                style={[styles.buildRecipeButton, styles.recipeButtonFlex]}
                activeOpacity={0.85}
                onPress={() => {
                  const paramName = RECIPE_BUILDER_PARAM[entry.linkedBuilderType!];
                  router.push({ pathname: '/food', params: { [paramName]: entry.linkedCuratedRecipeId! } });
                }}
              >
                <Ionicons name="hammer-outline" size={18} color={colors.background} />
                <Text style={styles.buildRecipeButtonText}>Build This Recipe</Text>
              </TouchableOpacity>
              <CuratedRecipeShareButton recipeId={entry.linkedCuratedRecipeId} builderType={entry.linkedBuilderType} />
            </View>
          ) : null}
          {entry.recipeCard ? <RecipeCardDetail card={entry.recipeCard} /> : null}
          <EntryPhotoSection entry={entry} tabColor={TAB_COLOR} />
          {entry.dynamicAction ? <DynamicEntryActions entry={entry} onDynamicEntriesChanged={onDynamicEntriesChanged} /> : null}
          {entry.chart ? <DigestBarChart chart={entry.chart} color={tierColor(entry.overallTier)} /> : null}
          {entry.stageNote ? <Text style={styles.stageNoteText}>{entry.stageNote}</Text> : null}
          <CitationsBlock citations={entry.citations} />
          {entry.relatedIds ? <RelatedChips ids={entry.relatedIds} onJumpToRelated={onJumpToRelated} /> : null}
          <FeedbackRow entry={entry} onDynamicEntriesChanged={onDynamicEntriesChanged} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// 2026-08-15, direct request: every Recipes-category entry gets a real,
// detailed card -- a scaled ingredient list, step-by-step instructions, a
// stated yield, a nutrition rating, and condition-specific cautions,
// alongside the flavor description this whole entry was already built
// around. Reuses the same detailLabel/detailText labeled-section pattern
// every other card already uses (see DigestCard's own ProblemFoodEntry
// branch above), rather than a separate visual language just for this one
// field -- only entry.recipeCard's own real, computed content differs.
function RecipeCardDetail({ card }: { card: RecipeCard }) {
  return (
    <View>
      <Text style={styles.detailLabel}>Makes</Text>
      <Text style={styles.detailText}>{card.yield}</Text>

      <Text style={styles.detailLabel}>Ingredients</Text>
      {card.ingredients.map((ingredient, index) => (
        <Text key={index} style={styles.swapText}>
          {'•'} {ingredient.text}
        </Text>
      ))}

      {card.instructions ? (
        <>
          <Text style={styles.detailLabel}>How to make it</Text>
          {card.instructions.map((step, index) => (
            <Text key={index} style={styles.recipeStepText}>
              {index + 1}. {step}
            </Text>
          ))}
        </>
      ) : null}

      <View style={styles.recipeNutritionBox}>
        <Text style={styles.recipeNutritionLabel}>What this dish gives you</Text>
        {card.nutritionHighlights.map((highlight, index) => (
          <Text key={index} style={styles.recipeNutritionText}>
            {'•'} <Text style={styles.detailTextBold}>{highlight.nutrient}:</Text> {highlight.note}
          </Text>
        ))}
      </View>

      {card.conditionNotes.length > 0 ? (
        <View style={styles.recipeConditionBox}>
          <Text style={styles.recipeConditionLabel}>Worth knowing if you have...</Text>
          {card.conditionNotes.map((note, index) => (
            <View key={index} style={index > 0 ? styles.recipeConditionItemSpaced : undefined}>
              <Text style={styles.recipeConditionCondition}>{note.condition}</Text>
              <Text style={styles.recipeNutritionText}>{note.note}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {card.flavorNotes ? (
        <>
          <Text style={styles.detailLabel}>Flavor palette</Text>
          <Text style={styles.detailText}>{card.flavorNotes}</Text>
        </>
      ) : null}
    </View>
  );
}

// 2026-08-15, direct request: "I want the user to be able to share a
// recipe from the provided app recipes and their favorites and from their
// saved recipes." My Kitchen/My Favorites already share via
// DynamicEntryActions (they carry a real dynamicAction); a curated Recipe
// entry doesn't (there's no user-owned componentId to key one off), so it
// gets this small, separate real share button instead, sitting right next
// to "Build This Recipe."
function CuratedRecipeShareButton({ recipeId, builderType }: { recipeId: string; builderType: BuilderFavoriteItemType }) {
  const [sharing, setSharing] = useState(false);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  async function handleShare() {
    setSharing(true);
    try {
      const profile = await getUserProfile();
      const fromName = profile.firstName?.trim() || 'A friend';
      // Still built and checked -- confirms the recipe genuinely resolves
      // to something real before bothering the OS share sheet at all -- but
      // deliberately never shown: see the matching comment on the other
      // handleShare below for why the plain-text message stays genuinely
      // plain now, with no embedded link at all.
      const link = await encodeShareLinkFromCuratedRecipe(recipeId, builderType, fromName);
      if (!link) {
        showInfoAlert('Nothing to share', "This couldn't be prepared for sharing.");
        return;
      }
      const recipe = await getCuratedRecipe(recipeId);
      const ingredientLines = (recipe?.ingredients ?? [])
        .map((ingredient) => `${ingredient.quantity} ${ingredient.unit} ${ingredient.foodName}`)
        .join('\n');
      const message = [recipe?.name ?? '', ingredientLines, `Shared from Inside Story by ${fromName}.`]
        .filter(Boolean)
        .join('\n\n');
      // Step 6, 2026-08-15 -- a real, local .is file (the actual, real
      // signed envelope, richer than the deep link -- see lib/sharing.ts's
      // own writeIsFile), preferred over the plain photo below since the
      // photo already travels embedded inside the .is file's own content,
      // matching what a deep-link share already does. Anyone without the
      // app sees exactly the same plain message either way -- the .is file
      // (like the deep link before it) is completely inert to them.
      //
      // Two real, separate native actions, not one combined share --
      // 2026-08-16, see lib/nativeSharing.ts's own header comment for the
      // full, confirmed reason: React Native's core Share module silently
      // drops its own `url` field on Android before it ever reaches native
      // code, so a combined `{message, url}` call was never actually
      // attaching this file on Android at all, only ever sending the plain
      // message. Share.share({message}) still fires first, unconditionally
      // -- that half already worked correctly -- then shareFileIfAvailable
      // offers the real attachment as its own, second step.
      const isFileUri = await writeIsFileForCuratedRecipe(recipeId, builderType, fromName);
      const photoUri = isFileUri ? null : await getPhotoForTarget({ kind: 'curatedRecipe', recipeId });
      const attachmentUri = isFileUri ?? photoUri;
      await Share.share({ message });
      if (attachmentUri) {
        await shareFileIfAvailable(attachmentUri, {
          mimeType: isFileUri ? '*/*' : 'image/jpeg',
          dialogTitle: isFileUri ? 'Share this recipe' : 'Share this photo',
        });
      }
    } catch (error) {
      console.error('[CuratedRecipeShareButton] Failed to share', error);
      showInfoAlert('Something went wrong', "This couldn't be shared. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      {infoAlertElement}
      <TouchableOpacity style={styles.recipeShareButton} activeOpacity={0.85} onPress={handleShare} disabled={sharing}>
        <Ionicons name="share-outline" size={18} color={TAB_COLOR} />
      </TouchableOpacity>
    </>
  );
}

// 2026-08-15, real Schedule/Share actions for My Kitchen/My Favorites --
// direct request: "All items should be available to be added to the
// schedule from here on anytime in the future... there should be a way to
// share the recipes... to anyone else who has this app, or in a textual
// sort of way through messaging." Only ever rendered for an entry that
// carries a real dynamicAction (see lib/digestDynamicEntries.ts) -- every
// other entry in this whole Digest returns null here immediately.
const DYNAMIC_ENTRY_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage', 'salad', 'smoothie'];
// Today through 2 years out -- generous enough for "anytime in the
// future" without an unbounded list; matches Profile's own
// BIRTH_DAY_OPTIONS convention of a flat 1-31 day list with no real
// days-in-month validation (an invalid combination like Feb 30 rolls
// forward via the JS Date constructor's own normal overflow behavior,
// the same accepted quirk Profile's own date fields already carry).
// A real, stable module-level constant, computed once at import time, not
// a function called fresh in JSX on every render -- PopoverSelect is
// memo()-wrapped, and this app's own history already documents in
// exhaustive detail exactly what a fresh array identity on every render
// does to that memo (the Nutrient Ranking freeze investigation).
const FUTURE_YEAR_OPTIONS = Array.from({ length: 3 }, (_, index) => String(new Date().getFullYear() + index));
const SCHEDULE_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const SCHEDULE_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => String(index + 1));
const SCHEDULE_HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const SCHEDULE_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

// 2026-08-15 -- a real, plain dispatcher, narrowing entry.dynamicAction's
// own three real kinds (see lib/digest/types.ts) into the right one of two
// real sibling components: a not-yet-decided staged share gets its own
// real "try it, then decide" action set (SharedRecipeActions), never
// Schedule/Share; a genuine saved/favorited component or favorite meal
// keeps the original Schedule/Share pair (SavedOrFavoriteActions).
function DynamicEntryActions({ entry, onDynamicEntriesChanged }: { entry: DigestEntry; onDynamicEntriesChanged?: () => void }) {
  const action = entry.dynamicAction;
  if (!action) return null;
  if (action.kind === 'shared') {
    return <SharedRecipeActions sharedRecipeId={action.sharedRecipeId} onDynamicEntriesChanged={onDynamicEntriesChanged} />;
  }
  return <SavedOrFavoriteActions entry={entry} action={action} onDynamicEntriesChanged={onDynamicEntriesChanged} />;
}

// "Try it, then decide" -- 2026-08-15 direct request: "It stays there
// until they try it and decide if they want to add it to their own saved
// recipes or as a favorite... if they didn't like the recipe they can
// just delete it." Deliberately no Schedule/Share here -- there's nothing
// real to schedule or re-share until the person has actually decided what
// to do with a share someone else sent them.
function SharedRecipeActions({
  sharedRecipeId,
  onDynamicEntriesChanged,
}: {
  sharedRecipeId: string;
  onDynamicEntriesChanged?: () => void;
}) {
  const [busy, setBusy] = useState<'saved' | 'favorite' | 'delete' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  async function handleSaveToRecipes() {
    setBusy('saved');
    try {
      const result = await promoteSharedRecipeToSaved(sharedRecipeId);
      if (result && result.length > 0) {
        setMessage('Saved to My Kitchen, under your own saved recipes.');
        onDynamicEntriesChanged?.();
      }
    } catch (error) {
      console.error('[SharedRecipeActions] Failed to save', error);
      showInfoAlert('Something went wrong', "This couldn't be saved. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSaveAsFavorite() {
    setBusy('favorite');
    try {
      const result = await promoteSharedRecipeToFavorite(sharedRecipeId);
      if (result) {
        setMessage('Saved to your Favorites.');
        onDynamicEntriesChanged?.();
      }
    } catch (error) {
      console.error('[SharedRecipeActions] Failed to save as favorite', error);
      showInfoAlert('Something went wrong', "This couldn't be saved. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    setBusy('delete');
    try {
      await deleteSharedRecipe(sharedRecipeId);
      onDynamicEntriesChanged?.();
    } catch (error) {
      console.error('[SharedRecipeActions] Failed to delete', error);
      showInfoAlert('Something went wrong', "This couldn't be deleted. Please try again.");
      setBusy(null);
    }
  }

  return (
    <View>
      {infoAlertElement}
      <View style={styles.dynamicActionRow}>
        <TouchableOpacity style={styles.dynamicActionButton} activeOpacity={0.85} onPress={handleSaveToRecipes} disabled={busy !== null}>
          <Ionicons name="bookmark-outline" size={16} color={TAB_COLOR} />
          <Text style={styles.dynamicActionButtonText}>{busy === 'saved' ? 'Saving…' : 'Save to My Recipes'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dynamicActionButton} activeOpacity={0.85} onPress={handleSaveAsFavorite} disabled={busy !== null}>
          <Ionicons name="heart-outline" size={16} color={TAB_COLOR} />
          <Text style={styles.dynamicActionButtonText}>{busy === 'favorite' ? 'Saving…' : 'Save as Favorite'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dynamicActionButton} activeOpacity={0.85} onPress={handleDelete} disabled={busy !== null}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={[styles.dynamicActionButtonText, styles.dynamicActionButtonTextDanger]}>
            {busy === 'delete' ? 'Deleting…' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>
      {message ? <Text style={styles.dynamicActionConfirm}>{message}</Text> : null}
    </View>
  );
}

function SavedOrFavoriteActions({
  entry,
  action,
  onDynamicEntriesChanged,
}: {
  entry: DigestEntry;
  action: { kind: 'component'; componentType: BuilderFavoriteItemType; componentId: string } | { kind: 'meal'; mealFavoriteId: string };
  onDynamicEntriesChanged?: () => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  const [scheduleMealType, setScheduleMealType] = useState<string | null>(null);
  const [scheduleYear, setScheduleYear] = useState(String(today.getFullYear()));
  const [scheduleMonth, setScheduleMonth] = useState(String(today.getMonth() + 1));
  const [scheduleDay, setScheduleDay] = useState(String(today.getDate()));
  const [scheduleHour, setScheduleHour] = useState('');
  const [scheduleMinute, setScheduleMinute] = useState('');
  const [scheduleAmpm, setScheduleAmpm] = useState<'AM' | 'PM' | ''>('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduledMessage, setScheduledMessage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  async function handleConfirmSchedule() {
    if (!scheduleMealType || !scheduleYear || !scheduleMonth || !scheduleDay) return;
    // Hour/minute/AM-PM are optional -- a real, honest noon default rather
    // than forcing a time nobody asked to specify. buildTime24 already
    // returns null for an incomplete answer (see its own comment), which
    // this deliberately treats as "no time given" rather than an error.
    const time24 = buildTime24(scheduleHour, scheduleMinute, scheduleAmpm) ?? '12:00';
    const pad2 = (value: string) => value.padStart(2, '0');
    const scheduledFor = `${scheduleYear.padStart(4, '0')}-${pad2(scheduleMonth)}-${pad2(scheduleDay)}T${time24}`;

    setScheduling(true);
    try {
      if (action.kind === 'meal') {
        await scheduleMeal({
          title: entry.title,
          mealType: scheduleMealType,
          scheduledFor,
          sourceFavoriteId: action.mealFavoriteId,
        });
      } else {
        await scheduleSingleComponent({
          componentType: action.componentType,
          componentId: action.componentId,
          title: entry.title,
          mealType: scheduleMealType,
          scheduledFor,
        });
      }
      setScheduledMessage(
        `Scheduled for ${scheduleMonth}/${scheduleDay}/${scheduleYear}${
          scheduleHour ? ` at ${formatTime12(time24)}` : ''
        }. Find it on the Schedule tab's own Meals lens.`,
      );
      setSchedulingOpen(false);
    } catch (error) {
      console.error('[DynamicEntryActions] Failed to schedule', error);
      showInfoAlert('Something went wrong', "This couldn't be scheduled. Please try again.");
    } finally {
      setScheduling(false);
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      const profile = await getUserProfile();
      const fromName = profile.firstName?.trim() || 'A friend';
      const link =
        action.kind === 'meal'
          ? await encodeMealShareLink(action.mealFavoriteId, fromName)
          : await encodeShareLink(action.componentType, action.componentId, fromName);
      if (!link) {
        showInfoAlert('Nothing to share', "This couldn't be prepared for sharing. Try again once it's fully saved.");
        return;
      }
      // 2026-08-15, direct on-device report: embedding the deep link in
      // this plain-text message meant everyone -- including someone
      // without the app -- saw a long, unreadable encoded blob at the
      // bottom of a normal-looking text message. Base64-encoding it (see
      // lib/sharing.ts's own encodeEnvelope) made that blob look like an
      // opaque token instead of visibly broken text, but it's still a real
      // wall of characters nobody without the app has any use for -- and
      // the same day's own follow-up named the actual right fix directly:
      // once real device-to-device sharing exists (the app's own future
      // Connections list plus a real, OS-registered .is file format, see
      // CLAUDE.md's own security-requirement note), THAT is the real
      // mechanism for a rich, ready-to-import share reaching someone who
      // has the app -- plain text is genuinely just plain text, for anyone,
      // with nothing hidden in it. `link` above is still built and checked
      // (confirms this is genuinely shareable before bothering the OS share
      // sheet), just never shown -- the same real envelope/base64 encoding
      // it produces is exactly what a future .is file is expected to reuse,
      // written to a file instead of embedded in a URL.
      const ingredientLines = (entry.recipeCard?.ingredients ?? []).map((ingredient) => ingredient.text).join('\n');
      const message = [entry.title, entry.recipeCard?.yield ?? '', ingredientLines, `Shared from Inside Story by ${fromName}.`]
        .filter(Boolean)
        .join('\n\n');
      // Step 6, 2026-08-15 -- the real .is file this whole comment block
      // above already named as "the actual right fix" now exists (see
      // lib/sharing.ts's own writeIsFile/app.json's own real
      // android.intentFilters). Preferred over the plain photo below since
      // the photo already travels embedded inside the .is file's own
      // content, matching what a deep-link share already does. Anyone
      // without the app sees exactly the same plain message either way --
      // the .is file (like the deep link before it) is completely inert to
      // them.
      //
      // Two real, separate native actions, not one combined share --
      // 2026-08-16, see lib/nativeSharing.ts's own header comment for the
      // full, confirmed reason: React Native's core Share module silently
      // drops its own `url` field on Android before it ever reaches native
      // code, so a combined `{message, url}` call was never actually
      // attaching this file on Android at all, only ever sending the plain
      // message. Share.share({message}) still fires first, unconditionally
      // -- that half already worked correctly -- then shareFileIfAvailable
      // offers the real attachment as its own, second step.
      const isFileUri =
        action.kind === 'meal'
          ? await writeIsFileForMeal(action.mealFavoriteId, fromName)
          : await writeIsFileForComponent(action.componentType, action.componentId, fromName);
      const photoTarget = resolvePhotoTarget(entry);
      const photoUri = !isFileUri && photoTarget ? await getPhotoForTarget(photoTarget) : null;
      const attachmentUri = isFileUri ?? photoUri;
      await Share.share({ message });
      if (attachmentUri) {
        await shareFileIfAvailable(attachmentUri, {
          mimeType: isFileUri ? '*/*' : 'image/jpeg',
          dialogTitle: isFileUri ? 'Share this' : 'Share this photo',
        });
      }
    } catch (error) {
      console.error('[DynamicEntryActions] Failed to share', error);
      showInfoAlert('Something went wrong', "This couldn't be shared. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  // 2026-08-21, direct report: "Once I add a prebuilt item... it ends up
  // in My Favorites, there doesn't appear to be a way to remove it from
  // my favorites for any reason I might have to do that. There should
  // always be a way to do that." This component (SavedOrFavoriteActions)
  // is shared by both My Kitchen and My Favorites entries -- Schedule/
  // Share made sense for either, but this third button only makes sense
  // for a real favorite (see the `entry.category === 'myFavorites'` guard
  // on the button itself below), not a saved builder record. Same
  // confirmSheet pattern food-items.tsx's own favorite-delete flow already
  // uses, for the same "this cannot be undone" reason -- a favorite's own
  // ingredient list lives only in its own payload_json (see
  // lib/digestDynamicEntries.ts's own header comment), not tied to a
  // still-existing saved record elsewhere that could rebuild it.
  async function handleRemoveFavorite() {
    const ok = await confirmSheet({
      title: `Remove "${entry.title}" from Favorites?`,
      message: 'This cannot be undone.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    setRemoving(true);
    try {
      await deleteFavorite(action.kind === 'meal' ? action.mealFavoriteId : action.componentId);
      onDynamicEntriesChanged?.();
    } catch (error) {
      console.error('[DynamicEntryActions] Failed to remove favorite', error);
      showInfoAlert('Something went wrong', "This couldn't be removed. Please try again.");
      setRemoving(false);
    }
  }

  return (
    <View>
      {infoAlertElement}
      {confirmSheetElement}
      <View style={styles.dynamicActionRow}>
        <TouchableOpacity
          style={styles.dynamicActionButton}
          activeOpacity={0.85}
          onPress={() => setSchedulingOpen((open) => !open)}
          disabled={removing}
        >
          <Ionicons name="calendar-outline" size={16} color={TAB_COLOR} />
          <Text style={styles.dynamicActionButtonText}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dynamicActionButton} activeOpacity={0.85} onPress={handleShare} disabled={sharing || removing}>
          <Ionicons name="share-outline" size={16} color={TAB_COLOR} />
          <Text style={styles.dynamicActionButtonText}>{sharing ? 'Preparing…' : 'Share'}</Text>
        </TouchableOpacity>
        {entry.category === 'myFavorites' ? (
          <TouchableOpacity style={styles.dynamicActionButton} activeOpacity={0.85} onPress={handleRemoveFavorite} disabled={removing}>
            <Ionicons name="heart-dislike-outline" size={16} color={colors.danger} />
            <Text style={[styles.dynamicActionButtonText, styles.dynamicActionButtonTextDanger]}>
              {removing ? 'Removing…' : 'Remove from Favorites'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {scheduledMessage ? <Text style={styles.dynamicActionConfirm}>{scheduledMessage}</Text> : null}

      {schedulingOpen ? (
        <View style={styles.dynamicScheduleForm}>
          <Text style={styles.detailLabel}>Meal type</Text>
          <PopoverSelect
            options={DYNAMIC_ENTRY_MEAL_TYPES}
            selected={scheduleMealType}
            onSelect={setScheduleMealType}
            tabColor={TAB_COLOR}
            placeholder="Choose"
          />

          <Text style={styles.detailLabel}>Date</Text>
          <View style={styles.dynamicScheduleRow}>
            <PopoverSelect options={FUTURE_YEAR_OPTIONS} selected={scheduleYear} onSelect={setScheduleYear} tabColor={TAB_COLOR} minWidth={64} />
            <PopoverSelect options={SCHEDULE_MONTH_OPTIONS} selected={scheduleMonth} onSelect={setScheduleMonth} tabColor={TAB_COLOR} minWidth={44} />
            <PopoverSelect options={SCHEDULE_DAY_OPTIONS} selected={scheduleDay} onSelect={setScheduleDay} tabColor={TAB_COLOR} minWidth={44} />
          </View>

          <Text style={styles.detailLabel}>Time (optional -- defaults to noon)</Text>
          <View style={styles.dynamicScheduleRow}>
            <PopoverSelect
              options={SCHEDULE_HOUR_OPTIONS}
              selected={scheduleHour}
              onSelect={setScheduleHour}
              tabColor={TAB_COLOR}
              minWidth={44}
              placeholder="Hr"
            />
            <PopoverSelect
              options={SCHEDULE_MINUTE_OPTIONS}
              selected={scheduleMinute}
              onSelect={setScheduleMinute}
              tabColor={TAB_COLOR}
              minWidth={44}
              placeholder="Min"
            />
            <View style={styles.ampmRow}>
              {(['AM', 'PM'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.ampmPill, scheduleAmpm === option ? styles.ampmPillActive : null]}
                  activeOpacity={0.85}
                  onPress={() => setScheduleAmpm(scheduleAmpm === option ? '' : option)}
                >
                  <Text style={[styles.ampmPillText, scheduleAmpm === option ? styles.ampmPillTextActive : null]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.buildRecipeButton, (!scheduleMealType || scheduling) ? styles.buildRecipeButtonDisabled : null]}
            activeOpacity={0.85}
            onPress={handleConfirmSchedule}
            disabled={!scheduleMealType || scheduling}
          >
            <Text style={styles.buildRecipeButtonText}>{scheduling ? 'Scheduling…' : 'Confirm'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  // The real flex-column wrapper inside GatedTabContent -- fixedHeader
  // (auto height, non-scrolling) stacked above the ScrollView (flex: 1,
  // everything else). See fixedHeader's own comment for why this split
  // exists.
  screenColumn: { flex: 1 },
  // A real, non-scrolling header strip -- 2026-08-08, direct request:
  // "move the internal search utility to the top and make it the subheader
  // that stays at the top under the app header." Used to be the first
  // three things inside the ScrollView below (scrolling away with
  // everything else); now a real sibling above it, so the back link, this
  // category's own header, and its search box stay visible the whole time
  // someone scrolls the hierarchical content underneath. Same horizontal
  // padding as bodyContent below so both areas line up.
  //
  // 2026-08-23, direct report: with the shared photo background actually
  // showing behind this scrolling screen, the flat 1px bottom border this
  // used to carry read as a hard line sitting mid-screen, with scrolled
  // content visibly sliding behind it -- the same class of bug the footer's
  // own flat divider line was replaced for, 2026-08-21, never applied here
  // too. Border removed; EdgeShadow (below, in the JSX) takes its place,
  // the same soft, direction="down" shaded edge ScreenHeader's own bottom
  // edge already uses, not a new treatment invented here.
  // 2026-08-23, direct report: this box's own paddingBottom used to leave
  // a plain, un-shaded strip of its own background sitting below the
  // EdgeShadow (the box's own last child, see the JSX), so the subheader's
  // own bottom edge sat a few px past where the shadow itself actually
  // ends. Dropped to 0 so this box's own bottom edge now lands exactly at
  // the shadow's own bottom edge, "the bottom edge of that subheader
  // needs to move up to the bottom edge of the shadowy bar, and then the
  // page can scroll under it" -- scrolled content now starts appearing
  // right where the shadow itself ends, sliding under its own soft fade,
  // rather than under an extra few px of plain background first.
  fixedHeader: {
    paddingHorizontal: FIXED_HEADER_HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  // 2026-08-23, direct report: "that same shadowy bar needs to extend
  // all the way left and right to the edges of the screen." EdgeShadow's
  // own `wrap` style has no explicit width of its own -- as a plain flex
  // child of fixedHeader (a column container, default alignItems:
  // 'stretch'), it was stretching to fill fixedHeader's own PADDED
  // content box, not the screen's true edges. A negative horizontal
  // margin exactly canceling that padding pulls it back out to the real
  // screen edges without touching fixedHeader's own padding at all (the
  // search field, breadcrumb row, and Glossary button all still need
  // it).
  edgeShadowFullWidth: { marginHorizontal: -FIXED_HEADER_HORIZONTAL_PADDING },
  // The row the "‹ Back to Digest"/"‹ Clear search" link and the new (i)
  // match-help icon share -- 2026-08-09, the link used to BE this whole
  // row on its own; now it's the left side, with the icon as a second,
  // separate tap target on the right.
  breadcrumbRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  // 2026-08-23: given the same colors.surface/TAB_COLOR-border treatment
  // shelfHeading carries, then a moderate ${TAB_COLOR}33 tint, in two
  // earlier passes -- direct correction on both: "must be filled in with
  // the color of the tab they are a family of, not just have an outline
  // around them." A solid TAB_COLOR fill now, the same real filled-button
  // convention every builder's own primaryButton already uses (solid
  // tabColor background, colors.textOnPrimary text -- that token exists
  // specifically because every one of this app's tab-identity colors is a
  // light pastel, dark text is what actually reads on top of it, TAB_COLOR
  // text on a TAB_COLOR fill would vanish). No border needed once the fill
  // itself IS the tab's own color, a border in the same color would be
  // invisible anyway.
  backToHomeText: {
    ...typography.body,
    color: colors.textOnPrimary,
    fontWeight: '600',
    alignSelf: 'flex-start',
    backgroundColor: TAB_COLOR,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32 },
  // An opaque card, same surface every DigestCard below already sits on --
  // fixes this header text being unreadable directly over the shared
  // flower background (see the JSX's own comment above this style's use).
  headerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: TAB_COLOR,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  categoryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  // 2026-08-23: reconsidered, not actually safe just for sitting inside
  // headerCard -- that card's own backgroundColor is colors.surface, the
  // same 85%-opaque value cardTitle's own comment explains, not a fully
  // solid fill. Same menuLabelShadow fix applied here for real, not just
  // assumed-safe, protection.
  categoryHeaderText: { ...typography.screenTitle, ...menuLabelShadow, color: TAB_TEXT_COLOR },
  categoryDescription: { ...typography.body, color: colors.textSecondary, lineHeight: 19 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  // 2026-08-16 -- wraps the search AppTextInput with a real mic button
  // (VoiceInputButton), added inside DigestSearchInput itself rather than
  // at either of this screen's own two call sites, since that component
  // deliberately owns its whole search-input experience as one
  // self-contained unit (see its own header comment).
  // 2026-08-19: the mic moved from sitting beside the field to actually
  // inside it -- this wrap only needs `position: relative` now so the
  // mic button (searchInputMicButton below) can anchor to it; the field
  // itself is the wrap's only normal-flow child, so it already fills the
  // full width with no separate flex style needed.
  searchInputWrap: { position: 'relative' },
  // Leaves room for both the mic icon (left, today) and the match-help
  // (i) icon (right, always -- see DigestSearchInput's own comment) so
  // typed text never runs under either one. Used to be a conditional
  // single-side pad, back when the mic was the only icon actually living
  // inside the field; now both sides always need clearance.
  searchInputPadBoth: { paddingLeft: 40, paddingRight: 40 },
  // top/bottom rather than a plain vertical-center-of-wrap -- searchInput's
  // own marginBottom (4, see below) is trailing space AFTER the field's
  // visible box, not part of it; centering across the wrap's full height
  // (field + that trailing gap) would sit the icon a few px too high.
  // `bottom: 4` excludes exactly that gap, so this centers against the
  // field's own visible box instead.
  searchInputMicButton: { position: 'absolute', top: 0, bottom: 4, justifyContent: 'center' },
  searchInputMicButtonLeft: { left: 6 },
  searchInputMicButtonRight: { right: 6 },
  // 2026-08-23: same vertical centering as the mic button above, fixed to
  // the right regardless of NAVIGATION_HAND (see DigestSearchInput's own
  // comment on why this one icon doesn't track hand preference the mic
  // does).
  searchInputInfoButton: { position: 'absolute', top: 0, bottom: 4, right: 6, justifyContent: 'center' },
  searchInput: {
    ...typography.body,
    borderWidth: 1,
    borderColor: TAB_COLOR,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    // 2026-08-23, direct report: the EdgeShadow bar directly below this
    // field (see the JSX, `<EdgeShadow direction="down" />` right after
    // DigestSearchInput) sat too far below it -- moved 10px closer by
    // shrinking this gap alone, same as fixedHeader's own paddingBottom
    // below getting the matching other half of the same report.
    marginBottom: 4,
  },
  searchResultCount: { ...typography.eyebrow, color: colors.textMuted, marginBottom: 8 },
  searchResultCategory: { ...typography.caption, ...menuLabelShadow, color: TAB_TEXT_COLOR, marginBottom: 4 },
  // topicGrid/topicCard/topicCardTitle/topicCardCount/treeBackLink/
  // treeHeading (Basic Health's own real tree navigation) removed
  // 2026-08-14 alongside BasicHealthTree/TopicCard -- see that removal's
  // own comment, above this file's grouping functions.
  shelfSection: { marginBottom: 18 },
  // 2026-08-23, every category's own topic menu (DigestTopicMenu, above),
  // first built for Basic Health, then extended to every other category
  // the same day -- the same card look (colors.surface fill, TAB_COLOR
  // border) every other card on this screen already uses, not a new
  // treatment invented just for this.
  digestTopicMenuList: { gap: 10 },
  digestTopicMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: TAB_COLOR,
    borderRadius: 12,
    padding: 14,
  },
  digestTopicMenuItemLabel: { ...typography.label, ...menuLabelShadow, color: TAB_TEXT_COLOR, flex: 1, marginRight: 8 },
  digestTopicMenuItemCount: { ...typography.caption, color: colors.textSecondary },
  // 2026-08-23, direct report: this text floats directly over the real
  // photo background now that GatedTabContent actually reveals one, with
  // nothing behind it at all. A shadow-only first attempt, then a plain
  // dark chip, both missed what was actually asked for: the same
  // colors.surface fill and TAB_COLOR border every card in this screen
  // already uses (see `card`/`shelfCard`, above/below), not a one-off
  // black overlay. alignSelf: 'flex-start' so it hugs the heading text
  // rather than stretching edge to edge.
  shelfHeading: {
    ...typography.label,
    ...menuLabelShadow,
    color: TAB_TEXT_COLOR,
    marginBottom: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: TAB_COLOR,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  // Horizontal ScrollView's own contentContainerStyle -- a plain row with a
  // gap between cards and a little trailing padding so the last card in a
  // row doesn't sit flush against the screen edge once scrolled all the
  // way over.
  shelfRow: { flexDirection: 'row', gap: SHELF_CARD_GAP, paddingRight: 16 },
  shelfCard: {
    width: SHELF_CARD_WIDTH,
    minHeight: 128,
    borderWidth: 2,
    borderColor: TAB_COLOR,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 12,
  },
  // The one tab in a row whose own entry the detail panel below is
  // currently showing -- a visibly thicker, filled highlight so scrolling
  // left/right through the row never loses track of which one is open.
  // 2026-08-23: this used to override shelfCard's own colors.surface
  // (85% opaque) with `${TAB_COLOR}22`, roughly 13% opaque -- the real
  // reason "Essential Nutrients: Magnesium" (a shelf card's own title,
  // read while that card sits selected/open, the normal way anyone reads
  // one) stayed unreadable against the photo background even after the
  // menuLabelShadow fix below: a shadow has nothing solid to sit against
  // once its own card is nearly see-through. Border alone (thicker,
  // accent-colored) already marks the selected card; backgroundColor now
  // stays whatever shelfCard's own base style set, same as every
  // unselected sibling.
  shelfCardSelected: {
    borderColor: colors.accent,
    borderWidth: 3,
  },
  // 2026-08-23, direct correction: a solid background chip was added here
  // too, but that was never asked for -- shelfCardSelected's own near-
  // transparent fill (above) was the actual bug on this specific card, now
  // fixed at its own source. This card's title stays as it was, the shadow
  // alone, same as any entry title inside an already-opaque card.
  shelfCardTitle: { ...typography.label, ...menuLabelShadow, color: TAB_TEXT_COLOR, flex: 1, fontSize: 14 },
  shelfCardTeaser: { ...typography.caption, color: colors.textSecondary, lineHeight: 16, marginTop: 4 },
  // 2026-08-09, ShelfTabCard's own compact per-term match indicator, shown
  // only while this card is part of a category's own scoped search
  // results -- see ShelfTabCard's own comment for why this is a row of
  // small dots rather than SearchResultCard's own full text pills.
  matchDotRow: { flexDirection: 'row', gap: 5, marginTop: 6 },
  matchDot: { width: 8, height: 8, borderRadius: 4 },
  matchDotTitle: { backgroundColor: TAB_COLOR },
  matchDotBody: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: TAB_COLOR },
  matchDotMiss: { backgroundColor: colors.border },
  // The real detail panel appearing directly below a row's own tab strip
  // once one of its tabs is tapped -- "the whole row drops down for the
  // one selected," per direct request. A small top margin separates it
  // from the tab strip above; DigestCard itself already supplies its own
  // card border/background, so no extra chrome is added here.
  shelfDetailPanel: { marginTop: 10 },
  card: {
    borderWidth: 2,
    borderColor: TAB_COLOR,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  // 2026-08-23: a background chip was briefly added here too, direct
  // correction that it wasn't asked for and shouldn't apply inside an
  // already-opaque card. The actual culprit for "Essential Nutrients:
  // Magnesium" staying unreadable was shelfCardSelected's own near-
  // transparent fill (see that style's own 2026-08-23 comment), fixed at
  // its own source. This title stays as it was, the shadow alone.
  cardTitle: { ...typography.label, ...menuLabelShadow, color: TAB_TEXT_COLOR, flex: 1 },
  cardTeaser: { ...typography.caption, color: colors.textSecondary, lineHeight: 17 },
  // 2026-08-09, SearchResultCard's own real per-term match display -- see
  // MatchSummaryRow's own comment for the full reasoning. matchBlock sits
  // directly under the teaser, matchSummaryText states the plain "X of Y
  // matched" count, and matchTermRow holds one pill per real search term:
  // filled (matchTermPillTitle) when that term hit this entry's own title,
  // outlined (matchTermPillBody) when it only matched the body/citations,
  // and dim (matchTermPillMiss) when it didn't match this entry at all.
  matchBlock: { marginTop: 8 },
  matchSummaryText: { ...typography.caption, color: colors.textMuted, marginBottom: 6 },
  matchTermRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  matchTermPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  matchTermPillTitle: { backgroundColor: TAB_COLOR, borderColor: TAB_COLOR },
  matchTermPillBody: { backgroundColor: 'transparent', borderColor: TAB_COLOR },
  matchTermPillMiss: { backgroundColor: 'transparent', borderColor: colors.border },
  matchTermPillText: { ...typography.caption, ...menuLabelShadow, color: TAB_TEXT_COLOR, fontSize: 11 },
  matchTermPillTextTitle: { color: colors.background, fontWeight: '700' },
  matchTermPillTextMiss: { color: colors.textMuted },
  // SearchMatchDemo's own worked-example block, inside the "About Search
  // Matching" sheet -- 2026-08-09, direct request for real, visual dot/
  // pill examples rather than just prose. demoDotRow/demoDotColumn/
  // demoDotLabel are demo-only (the real ShelfTabCard dots have no
  // labels); everything else the demo shows -- the dot itself, and the
  // whole pill row via MatchSummaryRow -- reuses the app's real styles
  // directly, not a copy.
  demoBlock: { marginTop: 4 },
  demoHeading: { ...typography.label, ...menuLabelShadow, color: TAB_TEXT_COLOR, marginBottom: 4 },
  demoSubheading: { ...typography.label, ...menuLabelShadow, color: TAB_TEXT_COLOR, marginTop: 18, marginBottom: 4 },
  demoIntro: { ...typography.caption, color: colors.textMuted, marginBottom: 10, lineHeight: 17 },
  demoExample: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  demoExampleTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, marginBottom: 6 },
  demoExampleNote: { ...typography.caption, color: colors.textMuted, marginTop: 6, lineHeight: 16 },
  demoDotRow: { flexDirection: 'row', gap: 14 },
  demoDotColumn: { alignItems: 'center', gap: 3 },
  demoDotLabel: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
  demoClosing: { ...typography.body, color: colors.textSecondary, lineHeight: 19, marginTop: 4 },
  cardDetail: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  tierLabelText: { ...typography.eyebrow, marginBottom: 6 },
  // EntryMetaRow's own reading-time text plus, when relevant, the plain,
  // non-tappable cross-condition pills sitting right beside it.
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  readingTimeText: { ...typography.caption, color: colors.textMuted },
  crossConditionPill: {
    borderWidth: 1,
    borderColor: TAB_COLOR,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    maxWidth: 160,
  },
  crossConditionPillText: { ...typography.caption, ...menuLabelShadow, color: TAB_TEXT_COLOR, fontSize: 11 },
  detailLabel: { ...typography.eyebrow, ...menuLabelShadow, color: TAB_TEXT_COLOR, marginTop: 8, marginBottom: 2 },
  detailText: { ...typography.body, color: colors.textPrimary, lineHeight: 19 },
  detailTextBold: { fontWeight: '700' },
  swapText: { ...typography.body, color: colors.textPrimary, lineHeight: 19, marginTop: 2 },
  // The Recipes category's own real CTA, 2026-08-14 -- solid-filled with
  // TAB_COLOR (not the lightened popoverBackground tint other screens use
  // for a primary action), since this is the one, unambiguous "do the
  // thing" button on an entry that otherwise only ever shows plain,
  // read-only research text.
  buildRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: TAB_COLOR,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  buildRecipeButtonText: { ...typography.bodyEmphasis, color: colors.background },
  buildRecipeButtonDisabled: { opacity: 0.5 },
  // "Build This Recipe" plus its own small, real Share button sitting
  // right beside it, 2026-08-15 -- see CuratedRecipeShareButton's own
  // comment.
  recipeButtonRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recipeButtonFlex: { flex: 1, marginTop: 0 },
  recipeShareButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TAB_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  // DynamicEntryActions' own Schedule/Share (or Save/Favorite/Delete) row,
  // 2026-08-15 -- a lighter touch than buildRecipeButton's own solid fill,
  // since these are co-equal secondary actions sitting side by side rather
  // than the one unambiguous CTA a curated Recipe's own "Build This
  // Recipe" button is.
  dynamicActionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dynamicActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: TAB_COLOR,
    borderRadius: 10,
    paddingVertical: 10,
  },
  dynamicActionButtonText: { ...typography.bodyEmphasis, ...menuLabelShadow, color: TAB_TEXT_COLOR },
  dynamicActionButtonTextDanger: { color: colors.danger },
  dynamicActionConfirm: { ...typography.caption, color: colors.accent, marginTop: 8 },
  dynamicScheduleForm: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dynamicScheduleRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  ampmRow: { flexDirection: 'row', gap: 6 },
  ampmPill: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ampmPillActive: { backgroundColor: TAB_COLOR, borderColor: TAB_COLOR },
  ampmPillText: { ...typography.caption, color: colors.textSecondary },
  ampmPillTextActive: { color: colors.background },
  stageNoteText: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic', marginTop: 8 },
  // RecipeCardDetail's own numbered instruction steps -- same body/color
  // treatment as detailText, just its own style key so a slightly tighter
  // top margin per line (rather than detailText's single-block spacing)
  // reads correctly as a real numbered list rather than one dense paragraph.
  recipeStepText: { ...typography.body, color: colors.textPrimary, lineHeight: 19, marginTop: 4 },
  // The "what this dish gives you" nutrition callout -- a real, tinted box
  // (the same lightened-tab-color recipe already used elsewhere in this
  // app for a highlighted callout) so it reads as a distinct rating rather
  // than blending into the surrounding plain paragraphs.
  recipeNutritionBox: {
    backgroundColor: `${TAB_COLOR}18`,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  recipeNutritionLabel: { ...typography.eyebrow, ...menuLabelShadow, color: TAB_TEXT_COLOR, marginBottom: 4 },
  recipeNutritionText: { ...typography.body, color: colors.textPrimary, lineHeight: 18, marginTop: 2 },
  // The per-condition caution box -- a real, distinct tint from the
  // nutrition callout above (a warm accent rather than the tab's own
  // color) so a caution reads visually different from a highlight, and
  // only ever renders when a real recipeCard.conditionNotes entry exists.
  recipeConditionBox: {
    backgroundColor: `${colors.accent}18`,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  recipeConditionLabel: { ...typography.eyebrow, color: colors.accent, marginBottom: 4 },
  recipeConditionCondition: { ...typography.bodyEmphasis, color: colors.accent, marginTop: 4 },
  recipeConditionItemSpaced: { marginTop: 6 },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  feedbackPrompt: { ...typography.caption, color: colors.textMuted, marginRight: 2 },
  // 2026-08-15 -- the real, brief "thumbs-up doubled as add-to-favorites"
  // confirmation, see FeedbackRow's own comment.
  favoriteAddedText: { ...typography.caption, color: colors.accent, marginTop: 4 },
  citationsBlock: { marginTop: 10 },
  citationsLabel: { ...typography.eyebrow, ...menuLabelShadow, color: TAB_TEXT_COLOR, marginBottom: 2 },
  citationLink: {
    ...typography.caption,
    color: colors.primary,
    textDecorationLine: 'underline',
    lineHeight: 16,
    marginBottom: 2,
  },
  relatedBlock: { marginTop: 10 },
  relatedLabel: { ...typography.eyebrow, ...menuLabelShadow, color: TAB_TEXT_COLOR, marginBottom: 4 },
  relatedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relatedChip: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    // 2026-08-08, direct request: "Allow the Related chips... span the
    // entire horizontal space available to it within the bounds
    // controlling it." Was a fixed maxWidth: 220 regardless of how much
    // real room the row actually had, truncating a chip's own title with
    // numberOfLines={1} even when the card was comfortably wide enough to
    // show it in full. '100%' still caps a chip at its real container's
    // own width (relatedRow, itself bounded by the card it sits in) --
    // one chip alone on its own row can now use the whole row; several
    // chips sharing a row still wrap normally, each sized to its own
    // content, none of them artificially truncated below what the layout
    // actually allows.
    maxWidth: '100%',
  },
  relatedChipText: { ...typography.captionEmphasis, color: colors.primary },
});
