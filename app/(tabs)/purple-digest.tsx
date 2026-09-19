import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { DigestCategorySection, MatchDotRow } from '../../components/DigestCategorySection';
import { categoryLabelForEntry } from '../../components/DigestEntryDetail';
import { DigestEntryRow, makeDigestRowStyles } from '../../components/DigestEntryRow';
import { EdgeShadow } from '../../components/EdgeShadow';
import { EntrySearchInput } from '../../components/EntrySearchInput';
import { GatedTabContent } from '../../components/GatedTabContent';
import { HelpSheet, type HelpSection } from '../../components/HelpButton';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP } from '../../components/HomeSectionBand';
import { LensHub, type LensOption } from '../../components/LensHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { BUTTON_SHADOW, colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { TAB_REVEAL_DURATION_MS } from '../../constants/tabReveal';
import { menuLabelShadow, textShadow, typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import { getVisibleFoodBaseNames } from '../../lib/db';
import { isConditionCategory, routeForDigestEntry } from '../../lib/digestNavigation';
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
  type SearchMatchInfo,
} from '../../lib/digest';
import { BASIC_HEALTH_TOPICS } from '../../lib/digest/categoryGrouping';
import { sortDigestEntriesLogically } from '../../lib/digest/conditionGrouping';

// The Digest on fold bands, 2026-09-19. Direct request, the same day
// Conditions moved to Life and took this shape there: "the full screen
// width and new formatting for everything is needed wherever it isn't
// already in place," with the choice for this tab made by name, "Fold
// bands like Conditions." Each of Basic Health, Earth Matters and Home
// Gardening is one band per topic, its subgroups as inset folds, each
// entry a row that opens in place (components/DigestCategorySection.tsx);
// Search All and the Glossary are one ranked or alphabetical list of the
// same rows. The horizontal shelves, the topic menus, the drill-down
// breadcrumbs, the measure-and-scroll machinery and the shelf
// virtualisation this file carried from 2026-08-08 to 2026-09-19 are gone
// with them; the grouping they drew on is unchanged and lives in
// lib/digest/categoryGrouping.ts.
//
// What stayed: the resting LensHub picker and its reveal, the fixed
// header (the back link, the Glossary button, the search box and the
// EdgeShadow under it), the Search Matching help sheet with its worked
// example, and every help text.


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

const DIGEST_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this tab is for',
    body: 'The general reading: cited findings on food, the body and gut science in Basic Health, the planet and the food system in Earth Matters, and growing your own in Home Gardening. The reading on each of the 19 tracked conditions lives in Life > Conditions, listed by whose condition it is, and a search or a Related chip here that lands on one opens it there.',
  },
  {
    heading: 'A growing set of categories, one evidence standard',
    body: 'Every entry here is tiered Strong/Moderate/Weak by its actual evidence. A gold dot means trial-level support, not just "this app trusts it." This tab is meant to keep growing; if the picker below runs past what fits on screen at once, it scrolls.',
  },
  {
    heading: 'Search the whole Digest, or just one category',
    body: '"Search All" is a separate selection in the menu below, alongside Basic Health. Pick it to search every entry at once, the condition entries included. Every other category also has a separate search box, scoped to just that one category\'s entries, once it\'s open.',
  },
  {
    heading: 'A quick way back',
    body: 'A "‹ Back to Digest" link sits at the top of every category\'s resting content, tap it to return straight to this tab\'s resting screen, from any depth, so you can open the menu and pick something else. The moment you start searching within a category, that link becomes "‹ Clear search" instead, it clears the search and returns you to that same category\'s main page, not out to the picker.',
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
  body: 'Each topic in this category is a band that folds open to its entries, with the larger topics grouped inside. Tap an entry to open its full write-up and citations in place, and tap it again to close it. The colored dot beside each title is its evidence tier, same discipline as the rest of this app. Where a finding connects to another entry, a Related chip jumps straight there.',
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
    body: 'Type a word or phrase to search every entry at once, across every category and every condition, regardless of which one you searched last. Tap a result to open it in place. A condition entry opens in Life > Conditions instead, where the conditions live.',
  },
  {
    heading: 'A different way to look, not the only way',
    body: 'Every other category also has a separate search box, scoped to just that one category\'s entries, once you\'ve opened it, useful when you already know roughly where something lives and just want to narrow it down.',
  },
  {
    heading: 'Reading a result\'s match info',
    body: 'Typing more than one word searches for each of them independently, not the exact phrase, a result can match one, some, or all of them. The "X of Y search terms matched" line and the small pills below it show exactly which ones did: a filled pill means that word appeared in the entry\'s title (the strongest kind of match), an outlined pill means it only showed up in the body or a citation, and a dim pill means that particular word never appeared in this entry at all.',
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
    body: 'When you type more than one word, this search does not look for that exact phrase. It checks each word on its own, one at a time. An entry can show up in your results even if it only matches some of your words, not all of them, and the words do not need to appear in the same order you typed them. Every entry then earns a score: matching a word in the entry\'s title is worth three times as much as matching that same word only in its body text or a citation. Entries with the highest score are always shown first, so something about what you searched for rises above something that only mentions it once in passing.',
  },
  {
    heading: 'What the dots mean',
    body: 'Each small dot stands for one of the words you typed, in the order you typed them, showing how that specific word did against that specific entry. A solid purple dot means that word matched the entry\'s title, the strongest kind of match. An outlined purple dot means it matched somewhere in the entry\'s body or a citation, but not its title. A solid grey dot means that word did not match this entry at all.',
  },
  {
    // 2026-08-09, shortened to a pointer -- the real, worked comparison
    // against Search All now lives in the visual example below (see
    // SearchMatchDemo), not repeated here as a second description of the
    // same thing.
    heading: 'See it in action',
    body: 'A worked example is below, using the search "sleep anxiety inflammation" against three illustrative entries, both as the compact dots you see here, and as Search All\'s fuller version.',
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
    body: "How the body itself works, independent of any diagnosis: a growing \"Essential Nutrients\" deep-dive series covering most major vitamins, minerals, and macronutrients, food additive dose-and-mechanism detail, food-and-swap entries for common everyday reactions (garlic, dairy, refined oils, commercial products), verified fermented-food bacterial strains, nutrient interactions (what helps or competes with what absorption), a food-industry and scapegoat history, general lifestyle and environmental exposures with no disease-specific claim, general exercise/autophagy biology, a full glossary, and general patient-advocacy skills like how to ask a doctor for a fuller lab panel. Deliberately excludes autoimmune-disease mechanisms and anything condition-specific, even when studied in a disease other than Hashimoto's, and excludes planet/agriculture-system content like soil, pollinators, and pesticides, that content lives in each condition's area, or in Earth Matters, instead. This is what the Free tier shows in full. Organized as related groups, each a horizontally-scrolling row, scroll a row sideways to browse its tabs, or scroll the screen down to move to the next group. Tap a tab to open its full entry directly below that same row; tap a different tab in the same row to switch, without leaving the group. A search bar above the groups searches only within Basic Health.",
  },
  hashimotos: {
    heading: "Hashimoto's Thyroiditis",
    body: "Every Hashimoto's-specific and autoimmune-mechanism finding in this Digest, gathered into one area, the same way each other condition already has its own: thyroid-specific nutrients (selenium, iodine, and newer candidates), labs and medication timing (levothyroxine, biotin interference, TSH's diurnal rhythm), what to eat at each healing stage, how the disease reaches past the thyroid into other organs, the dated history behind Hashimoto's diagnosis and treatment, pregnancy-specific guidance, gut-barrier and microbiome science (SCFAs, zonulin, what actually repairs a leaky gut), complementary therapies evaluated against thyroid/autoimmune outcomes specifically, corroborating cross-disease evidence, a Hashimoto's-specific problem-foods list, and Hashimoto's self-advocacy section: which lab tests to ask for, why, and how often.",
  },
  rheumatoidArthritis: {
    heading: 'Rheumatoid Arthritis',
    body: "This app's second condition, written as RA's primary content rather than as evidence borrowed for someone else's disease. Covers the two food levers with the strongest trial evidence (omega-3s at a specific dose threshold, a Mediterranean eating pattern with disease-activity-score results), a landmark fasting-then-vegetarian trial that only holds up for a subset of people, and two medication interactions, methotrexate with folate, and methotrexate with alcohol, both more precise and more forgiving than the blanket warnings patients often hear. Closes on the common overlap between RA and Hashimoto's, the reason this condition was built first.",
  },
  psoriasis: {
    heading: 'Psoriasis',
    body: "This app's third condition, covering psoriasis and psoriatic arthritis on their own terms. Weight loss and a Mediterranean eating pattern both carry strong trial evidence with measured PASI-score improvement; alcohol tracks with worse disease (most clearly in men) and a striking mortality finding regardless of sex; a specific antibody-positive minority sees biopsy-confirmed skin improvement from cutting gluten. Also covers two findings reported as unproven rather than smoothed into false confidence, nightshade avoidance and oral vitamin D supplementation, plus two serious, specific medication-food interactions to know precisely rather than generally (cyclosporine with grapefruit, acitretin with alcohol).",
  },
  graves: {
    heading: "Graves' Disease",
    body: "This app's fourth condition, covering hyperthyroidism's most common cause on its own terms. In several ways it's the mirror image of this app's Hashimoto's research: smoking raises Graves' eye-disease risk sharply while it lowers Hashimoto's risk, and iodine is both a trigger and a complication for antithyroid drug efficacy rather than simply something to avoid. Selenium carries strong trial evidence for mild eye disease specifically. Built with self-advocacy content from day one: TRAb/TSI antibody testing's quantified remission and relapse odds, specific warning signs for antithyroid drug side effects, and the measurable bone-density loss untreated hyperthyroidism causes.",
  },
  type1Diabetes: {
    heading: 'Type 1 Diabetes',
    body: "This app's fifth condition, and a different shape from every one built before it: food's daily relevance here isn't about triggering or avoiding a flare, it's about matching carbohydrate intake to insulin dosing accurately enough to stay safe. Covers carb-counting's measured 21% average error and its direct link to worse blood glucose control, exercise and alcohol's own (and sometimes delayed) hypoglycemia risks, DKA's warning signs and a checkable ketone threshold, and the well-documented overlap with celiac disease. Built with self-advocacy content from day one: the full autoantibody panel behind diagnosis, Time in Range as a complement to HbA1c, and the screening intervals for eye and kidney complications that start years before any symptom would.",
  },
  celiac: {
    heading: 'Celiac Disease',
    body: "This app's sixth condition, and the one place here where a strict diet is the entire treatment, not one lever among several. Covers the 20ppm cross-contamination standard and what actually breaks it in a kitchen, the oats controversy (safe for most, a minority reacts to the oat protein itself), market data on what commercial gluten-free products get nutritionally wrong, and an age-dependent healing timeline most people underestimate. Built with self-advocacy content from day one: why going gluten-free before testing is the single most common diagnostic mistake, and a specific recommended age (45) for a bone-density scan. Closes on a quantified overlap with Hashimoto's roughly double the general population's autoimmune thyroid risk.",
  },
  ibd: {
    heading: 'Inflammatory Bowel Disease',
    body: "This app's seventh condition, covering two distinct diseases, Crohn's disease and ulcerative colitis, under one umbrella. Several findings here run in opposite directions depending on which one someone actually has, most sharply smoking, which worsens Crohn's while protecting against ulcerative colitis. Covers exclusive enteral nutrition's strong remission rates in pediatric Crohn's, the low-fiber-during-a-flare advice's surprisingly thin evidence, and a null result on Hashimoto's comorbidity overall (with one exception in older patients). Built with self-advocacy content from day one: fecal calprotectin as a non-invasive way to check gut inflammation, the colorectal cancer surveillance schedule (and why it moves up sharply with a specific complication), and azathioprine's FDA-recommended genetic test before the first dose.",
  },
  multipleSclerosis: {
    heading: 'Multiple Sclerosis',
    body: "This app's eighth condition, and a different shape from every one built before it: MS attacks the brain and spinal cord directly, not the gut, joints, skin, or thyroid, so its single strongest finding isn't a food at all, a 20-year study found MS risk rose 32-fold after Epstein-Barr virus infection, with a specific mechanism (a viral protein that closely resembles a piece of the nerve's myelin coating) now understood behind it. Covers the head-to-head trial between the historic Swank diet and the newer Wahls Protocol (both helped), and two corrections on supplements that looked promising in an early trial but didn't hold up in a larger one, high-dose biotin and vitamin D. Also covers a striking overlap with Hashimoto's (present in 20-25% of untreated MS patients). Built with self-advocacy content from day one: JC virus antibody monitoring for a common MS medication's rare but serious safety risk, how MS is actually diagnosed, and a fix for a common medication side effect.",
  },
  lupus: {
    heading: 'Lupus (SLE)',
    body: "This app's ninth condition, and a wide-ranging one: lupus can affect the skin, joints, kidneys, blood, and nervous system all at once, giving this category a distinctive shape rather than one dominant theme. Covers one of the most specific, well-documented individual food triggers in this app's whole research base, alfalfa sprouts, via an amino acid (L-canavanine) the body mistakenly builds into its proteins, plus a catch-22 unique to lupus: sun protection helps prevent a flare, but also raises vitamin D deficiency risk, with mixed trial evidence on whether treating that deficiency calms the disease itself. Also covers omega-3's mixed evidence (positive trial results, but a genetic study pointing the other way on lupus risk) and a striking cardiovascular risk (a 50-fold heart-attack risk increase in young women) that ordinary risk factors don't fully explain. Built with self-advocacy content from day one: hydroxychloroquine's eye-exam schedule, the lab panel that catches kidney involvement early, and the first lupus-specific biologic in over 50 years.",
  },
  sjogrens: {
    heading: "Sjögren's Syndrome",
    body: "This app's tenth condition, defined by an attack on the body's moisture-making glands. Unlike most conditions here, it carries a direct, same-day relationship with food and drink, alcohol and caffeine worsen dryness within hours, not through a slower inflammatory pathway, and omega-3 has fairly consistent positive trial evidence for both dry eyes and dry mouth at once. Covers the mechanism behind Sjögren's elevated dental-caries risk (saliva's protective role, lost, not just its comfort), a meaningfully elevated lymphoma risk, a kidney complication (renal tubular acidosis) that can strike before the disease's hallmark dryness is even recognized, and the substantial overlap with rheumatoid arthritis and lupus, both already covered elsewhere in this app. Built with self-advocacy content from day one: the antibody and gland tests behind an actual diagnosis, and how pilocarpine and cevimeline restore the body's moisture production rather than just replacing it.",
  },
  pcos: {
    heading: 'PCOS',
    body: "This app's eleventh condition, and its first non-autoimmune one, PCOS is an endocrine and metabolic disorder, not an immune attack on the body's own tissue, with insulin resistance as the single mechanism driving most of what else happens. Covers the well-studied myo-inositol/D-chiro-inositol 40:1 ratio (one of the better-evidenced supplements anywhere in this app's research, already tracked in this app's My Meds data), spearmint tea's anti-androgen trial evidence, and a quantified weight-loss finding (each 1% of body weight lost measurably raising the odds of ovulation returning). Also covers an elevated endometrial cancer risk tracing directly to PCOS's anovulation mechanism, and a bidirectional overlap with Hashimoto's (each condition raising risk of the other). Built with self-advocacy content from day one: why a full glucose tolerance test catches what a simple fasting glucose misses, the cardiometabolic lab panel PCOS deserves beyond a fertility checklist, and spironolactone's potassium caution.",
  },
  chronicKidneyDisease: {
    heading: 'Chronic Kidney Disease',
    body: "This app's twelfth condition, and its second non-autoimmune one, CKD's dietary management (potassium, phosphorus, sodium, protein) is more directly food-restrictive than almost any other condition here. Leads with a correction to some of the most commonly repeated CKD dietary advice anywhere: blanket potassium restriction has surprisingly thin trial evidence behind it, and 2020 KDIGO guidelines themselves found the evidence insufficient for a graded recommendation. Covers \"hidden phosphorus\", food-additive phosphate absorbed at over 90% versus 20-60% from whole food, rarely labeled, specific low-protein diet guidance now favoring plant-forward sources, and a simple, evidence-backed fix (sodium bicarbonate) for a lesser-known complication (metabolic acidosis). Also covers SGLT2 inhibitors' major, kidney-protective effect, independent of their original diabetes purpose. Built with self-advocacy content from day one: why eGFR and urine albumin need tracking together, and ACE inhibitors/ARBs' own manageable potassium-monitoring schedule.",
  },
  fattyLiverDisease: {
    heading: 'Fatty Liver Disease',
    body: "This app's thirteenth condition, and its third non-autoimmune one, MASLD (metabolic dysfunction-associated steatotic liver disease, the current, more precise name for what used to be called NAFLD) is built on top of a substantial amount of pre-existing liver research already in this app, written for a Hashimoto's reader, cross-linked here rather than repeated. Covers a graded weight-loss staircase (3% for histological benefit to begin, 10% for the strongest fibrosis regression), a wrinkle in the Mediterranean diet's evidence (a plainer low-fat diet works about as well), coffee as one of the more consistently protective findings anywhere in this app's research, and a contested alcohol-threshold question (MetALD) that current guidance is still working out. Also covers two recent medication stories: resmetirom, the first-ever approved MASH drug, which works through a thyroid hormone receptor directly, an elegant echo of this app's core focus, and semaglutide's large 2025 trial results. Built with self-advocacy content from day one: FIB-4, a low-cost fibrosis-screening tool often calculable from labs already drawn.",
  },
  type2Diabetes: {
    heading: 'Type 2 Diabetes',
    body: "This app's fourteenth condition, and its fourth non-autoimmune one, T2D sits at the center of the metabolic-syndrome cluster already built out across PCOS, MASLD, and CKD, cross-linked heavily to that existing content rather than re-derived. Covers an important distinction from Type 1 Diabetes (already covered in a separate category, often confused with T2D by name alone, with different screening timelines that follow directly from that distinction), the DiRECT trial's striking remission rates (46% at one year), and low-carbohydrate diets' short-term evidence, limits included. Also covers a recent treatment-guideline shift toward GLP-1/SGLT2 medications chosen for their organ-protective benefits, not glucose control alone, and a quantified sulfonylurea hypoglycemia risk sharply elevated by reduced kidney function. Built with self-advocacy content from day one: a correction to \"lower HbA1c is always better,\" backed by trials finding intensive control didn't reduce cardiovascular risk while increasing harm.",
  },
  ibs: {
    heading: 'Irritable Bowel Syndrome',
    body: "This app's fifteenth condition, and its fifth non-autoimmune one, IBS is a disorder of gut-brain interaction, not structural intestinal damage, leaning heavily on cross-links to this app's already-built FODMAP and gut-microbiome content rather than re-deriving it. Covers an important distinction from IBD (already covered in a separate category, often confused with IBS by name alone, IBS carries no inflammation and no elevated cancer risk, the opposite of IBD), non-dietary interventions with meaningful trial support (peppermint oil, gut-directed hypnotherapy), and a striking, underappreciated mechanism: post-infectious IBS may account for over half of all US cases, tracing back to a specific, identifiable past illness. Also covers non-FODMAP triggers (coffee, alcohol, artificial sweeteners) with their documented timing, and two subtype-targeted medications with different mechanisms. Built with self-advocacy content from day one: the specific red-flag symptoms and diagnostic workup, including a thyroid panel, that should come before assuming IBS by default.",
  },
  migraine: {
    heading: 'Migraine',
    body: "This app's sixteenth condition, and its sixth non-autoimmune one, migraine is a neurological disease, not \"just a bad headache,\" with a specific signaling molecule (CGRP) central to how an attack actually happens. Covers a correction to popular food-trigger lists (tyramine's reputation as the culprit behind aged cheese and red wine doesn't fully hold up under refined modern measurement, and chocolate's evidence is mixed), the magnesium/riboflavin/CoQ10 combination's specific trial results, and CGRP inhibitors, the first medication class ever built specifically for migraine prevention. Also covers medication-overuse headache (a named condition with a specific day-per-month threshold), menstrual migraine's leading explanation alongside its evidence gaps, and caffeine's double role as both trigger and withdrawal cause. Built with self-advocacy content from day one: the specific red-flag symptoms that mean a headache needs more than migraine management.",
  },
  cardiovascularDisease: {
    heading: 'Cardiovascular Disease',
    body: "This app's seventeenth condition, and its seventh non-autoimmune one, cardiovascular disease was already touched from five separate angles across this app's existing content (lupus's 50-fold heart attack risk in young women, Hashimoto's organ-systems research on hypothyroid heart effects, PCOS's lipid-panel entry, and both psoriasis's and rheumatoid arthritis's self-advocacy entries on elevated cardiovascular risk) before this category itself existed to link back to. Covers whole-food dietary patterns with trial support (the Mediterranean diet, including PREDIMED's 2018 retraction-and-correction story, and DASH's specific sodium targets), a large, consistent statin evidence review, and two examples of medical guidance shifting because a large trial's numbers said so: daily aspirin for primary prevention (a quantified trade-off between preventing vascular events and causing major bleeding) and omega-3 supplementation (a null result from the same trial). Built with self-advocacy content from day one: lipid-panel testing intervals (with a brief, narrowly-scoped note on apolipoprotein B) and the specific heart attack warning symptoms, including a documented pattern that differs by sex.",
  },
  gout: {
    heading: 'Gout',
    body: "This app's eighteenth condition. Gout is a different shape of condition from most already covered: its best evidence is a specific, individually well-studied list of foods and drinks rather than one broad dietary pattern. Covers quantified findings on meat and seafood (raising risk) alongside dairy (lowering it, from the same study), sugar-sweetened drinks and fructose (a dose-dependent risk diet soda doesn't share), beer specifically (carrying outsized risk compared to spirits, with wine showing none), and three individually-tested protective foods: cherries (including a striking combined effect with allopurinol), vitamin C, and coffee. Covers a serious cardiovascular safety difference between the two most common urate-lowering medications, and gout's direct overlap with heart, kidney, and metabolic conditions already built out elsewhere in this app. Built with self-advocacy content from day one: HLA-B*58:01 genetic testing before starting allopurinol in specific, named higher-risk populations, and recognizing when a flare might actually be a more urgent joint infection.",
  },
  prostateHealth: {
    heading: 'Prostate Health',
    body: "This app's nineteenth condition, covering benign prostatic hyperplasia (BPH) and prostate cancer risk, two extremely common conditions (BPH affects roughly half of men by their 50s, most by their 70s; prostate cancer is the most commonly diagnosed cancer in American men) with a direct gut-microbiome connection. Covers gut dysbiosis's link to BPH through the same short-chain-fatty-acid mechanism this app's Gut & Microbiome content already documents, and a striking finding: specific gut bacteria can directly manufacture androgens from hormone precursors, and convert dietary choline into a compound (TMAO) linked to a quantified increase in lethal prostate cancer. Covers two individually strong protective foods (lycopene/tomatoes, cruciferous vegetables), the prostate's distinctive zinc concentration, and two supplement corrections: a landmark trial found selenium doesn't prevent prostate cancer (and its usual supplement partner may raise risk), and saw palmetto's popularity outruns its mixed evidence. Self-advocacy covers a lab-interpretation trap (BPH medications cut PSA roughly in half) and PSA screening's quantified benefit-versus-harm tradeoff.",
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
    body: "Cited guidance on growing fresh food at home, organized so it's actually usable in whichever climate someone lives in. Covers the economics of what a home garden saves, how to find and read a growing zone (the USDA Plant Hardiness Zone Map plus a short note on other countries' own systems), what to plant in four climate bands from short-season cold to true tropical, growing food in containers with no yard at all, which crops return the most grocery value, the easiest crops for a first garden, ways to extend a growing season, a measured freshness benefit over shipped produce, a soil-safety caution for urban soil, and a direct link to this app's Earth Matters pollinator research, growing even a small amount of food at home is an individual-level way to act on several of that category's larger findings.",
  },
  // 2026-08-14, direct request: "a new category of Recipes... will be
  // available." One card per bundled starter recipe, tap it to see the
  // whole ingredient list, then a "Build This Recipe" button opens the
  // matching Food builder with everything already filled in.
  recipes: {
    heading: 'Recipes',
    body: 'A pre-built starting point for every direct-ingredient Food builder: sides, salads, smoothies, fermentations, beverages, snacks, baked goods, soups, sauces, and handhelds. Each card shows the flavor profile and health benefit up front, and a "Build This Recipe" button opens the matching builder already loaded with every ingredient, quantity, and prep step, ready to adjust, save, or log as-is.',
  },
  myKitchen: {
    heading: 'My Kitchen',
    body: 'Everything you\'ve saved from any Food builder, all in one place, with the same ingredient list, yield, and nutrition detail Recipes gets, computed live from your tracked conditions. Schedule anything here for a future date, or share it with someone else.',
  },
  myFavorites: {
    heading: 'My Favorites',
    body: 'Your favorited builds from every category, plus favorite meals, browsable the same way as My Kitchen. Favoriting something already tells this app you\'d make it again. This is the place to actually do that: rebuild it, schedule it, or share it.',
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
// Hashimoto's Thyroiditis, Rheumatoid Arthritis, Psoriasis, and all 15 other
// real conditions) still wraps cleanly to 2 lines on its own via plain
// word-wrap, with no ugly mid-phrase break to correct. Kept as a real,
// live mechanism (not deleted) since a future, longer condition name may
// still need it.
const DIGEST_GRID_LABEL_BREAKS: Partial<Record<DigestCategoryKey, string>> = {};


// The per-term match display under every Search All result row.
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

// The demo-only, LABELED version of the dot row MatchDotRow
// (components/DigestCategorySection.tsx) renders under a scoped search
// result. The on-screen dots never carry a label, since a person already
// knows the order they typed their words in; a worked example needs one
// so it is obvious which dot belongs to which word without that context.
// The matchDot styles below are the same sizes and colors MatchDotRow
// uses, so the demo matches what the category search shows.
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
// search[.]" Reuses MatchSummaryRow (the component Search All's result
// rows render) directly for the pill half, rather than a second,
// separately-styled mockup that could drift out of sync with it.
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
        Search All shows the identical information as labeled pills instead of plain dots, since its result rows
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

// The Basic Health topic the Glossary button opens: its entries as one
// alphabetical list under its own description.
const GLOSSARY_TOPIC = BASIC_HEALTH_TOPICS.find((topic) => topic.label === 'Glossary');

// The lens the screen lands on once revealed. A jump to a category with
// no picker tile (a recipe reached from a Related chip, say) still works,
// since DigestCategorySection groups any non-condition category.
const DEFAULT_LENS: PurpleDigestLens = 'basicHealth';

export default function PurpleDigestScreen() {
  useRegisterScreenHelp('Digest', DIGEST_HELP_SECTIONS, '/purple-digest');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const rowStyles = useMemo(() => makeDigestRowStyles(TAB_COLOR), []);
  const autoOpenLensHub = useAutoOpenLensHubSignal();
  // Either a TabHub arrival or the "‹ Back to Digest" link can ask the
  // LensHub to open itself; both feed the one signal LensHub watches.
  const [openTrigger, setOpenTrigger] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (autoOpenLensHub) setOpenTrigger(autoOpenLensHub);
  }, [autoOpenLensHub]);
  const router = useRouter();
  const { openEntryId } = useLocalSearchParams<{ openEntryId?: string }>();

  const [lens, setLens] = useState<PurpleDigestLens>(DEFAULT_LENS);
  const [revealed, setRevealed] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  // Search All's query, and the scoped query for whichever category is
  // showing, kept apart so switching between them never carries text over.
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  // Remounts EntrySearchInput with empty text; it owns its own local value.
  const [searchResetKey, setSearchResetKey] = useState(0);
  // The entry opened in Search All or the Glossary. A category's own open
  // entry is DigestCategorySection's to track.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // The entry a category should open on arrival, handed down once.
  const [sectionOpenId, setSectionOpenId] = useState<string | null>(null);
  const [searchMatchHelpVisible, setSearchMatchHelpVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Entries tagged with foods that have since been hidden go with them.
  // One bulk lookup for every related food name in the Digest, so a
  // category switch never waits on the database.
  const [visibleFoodNames, setVisibleFoodNames] = useState<Set<string> | null>(null);
  useEffect(() => {
    let cancelled = false;
    const names = new Set<string>();
    for (const entry of ALL_DIGEST_ENTRIES) {
      if (!isProblemFoodEntry(entry) && entry.relatedFoodNames) for (const name of entry.relatedFoodNames) names.add(name);
    }
    getVisibleFoodBaseNames(Array.from(names))
      .then((visible) => {
        if (!cancelled) setVisibleFoodNames(visible);
      })
      .catch(() => {
        if (!cancelled) setVisibleFoodNames(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const isEntryVisible = useCallback(
    (entry: AnyDigestEntry) => {
      if (!visibleFoodNames) return true;
      if (isProblemFoodEntry(entry) || !entry.relatedFoodNames || entry.relatedFoodNames.length === 0) return true;
      return entry.relatedFoodNames.some((name) => visibleFoodNames.has(name));
    },
    [visibleFoodNames],
  );

  const resetSearch = useCallback(() => {
    setSearchQuery('');
    setCategorySearchQuery('');
    setIsSearchActive(false);
    setSearchResetKey((key) => key + 1);
  }, []);

  // Open an entry wherever it lives: a condition entry goes to Life, and
  // anything else switches this screen to its category and hands the id
  // down for the section to open and scroll to.
  const jumpToRelated = useCallback(
    (id: string) => {
      const target = findDigestEntryById(id);
      if (!target) return;
      const category = target.category as DigestCategoryKey;
      if (isConditionCategory(category)) {
        router.push(routeForDigestEntry(id));
        return;
      }
      if (category === 'basicHealth' && id.startsWith('glossary-')) {
        setGlossaryOpen(true);
        setLens('basicHealth');
        resetSearch();
        setExpandedId(id);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
        return;
      }
      setGlossaryOpen(false);
      setLens(category);
      resetSearch();
      setExpandedId(null);
      setSectionOpenId(id);
    },
    [router, resetSearch],
  );

  useFocusEffect(
    useCallback(() => {
      // A link in takes precedence over the resting picker a fresh arrival
      // starts on: reveal, then open the entry.
      if (openEntryId) {
        setRevealed(true);
        jumpToRelated(openEntryId);
        return;
      }
      setRevealed(false);
      resetSearch();
      return () => {
        setRevealed(false);
        resetSearch();
      };
    }, [openEntryId, jumpToRelated, resetSearch]),
  );

  const orderedCategoryMetas = useMemo(() => {
    const basicHealthMeta = DIGEST_CATEGORY_META.find((meta) => meta.key === 'basicHealth');
    const earthMattersMeta = DIGEST_CATEGORY_META.find((meta) => meta.key === 'earthMatters');
    const gardeningMeta = DIGEST_CATEGORY_META.find((meta) => meta.key === 'homeGardening');
    return [basicHealthMeta, earthMattersMeta, gardeningMeta].filter((meta): meta is (typeof DIGEST_CATEGORY_META)[number] => Boolean(meta));
  }, []);

  // Search All first, then the three categories. The conditions are in
  // Life since 2026-09-19 and have no tile here.
  const LENSES = useMemo<LensOption<PurpleDigestLens>[]>(
    () => [
      { key: 'search', label: 'Search All', icon: 'search-outline', help: DIGEST_SEARCH_HELP },
      ...orderedCategoryMetas.map((meta) => ({
        key: meta.key,
        label: meta.label,
        gridLabel: DIGEST_GRID_LABEL_BREAKS[meta.key],
        icon: meta.icon,
        help: [DIGEST_LENS_HELP[meta.key], DIGEST_READING_HELP],
      })),
    ],
    [orderedCategoryMetas],
  );

  const activeLensLabel = useMemo(() => {
    if (lens === 'search') return 'Search All';
    return DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.label ?? 'Digest';
  }, [lens]);
  const searchScopeLabel = glossaryOpen ? 'Glossary' : activeLensLabel;

  const entries = useMemo(() => {
    if (lens === 'search') return [];
    return getEntriesForCategory(lens).filter(isEntryVisible);
  }, [lens, isEntryVisible]);

  const glossaryEntries = useMemo(
    () => sortDigestEntriesLogically(ALL_DIGEST_ENTRIES.filter((entry) => entry.id.startsWith('glossary-'))),
    [],
  );
  const glossaryShown = useMemo(() => {
    const trimmed = categorySearchQuery.trim();
    if (trimmed.length === 0) return glossaryEntries.map((entry) => ({ entry, match: null as SearchMatchInfo | null }));
    return searchEntriesScored(glossaryEntries, trimmed, glossaryEntries.length).map((result) => ({ entry: result.entry, match: result.match }));
  }, [categorySearchQuery, glossaryEntries]);

  const searchResults = useMemo(() => searchDigestEntriesScored(searchQuery), [searchQuery]);

  const openGlossary = useCallback(() => {
    setGlossaryOpen(true);
    resetSearch();
    setExpandedId(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [resetSearch]);

  const handleDebouncedSearchChange = useCallback(
    (text: string) => {
      if (lens === 'search') setSearchQuery(text);
      else setCategorySearchQuery(text);
    },
    [lens],
  );
  const handleSearchActiveChange = useCallback((active: boolean) => {
    setIsSearchActive(active);
    if (active) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);
  const clearSearch = useCallback(() => {
    resetSearch();
    setExpandedId(null);
  }, [resetSearch]);

  const scrollToY = useCallback((y: number) => {
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);

  // A Search All hit opens in place unless it belongs to a condition, in
  // which case it opens in Life, where the conditions live.
  const toggleSearchResult = useCallback(
    (entry: AnyDigestEntry) => {
      if (isConditionCategory(entry.category as DigestCategoryKey)) {
        router.push(routeForDigestEntry(entry.id));
        return;
      }
      setExpandedId((current) => (current === entry.id ? null : entry.id));
    },
    [router],
  );

  const breadcrumb = glossaryOpen ? (
    <TouchableOpacity onPress={() => setGlossaryOpen(false)} accessibilityRole="button" accessibilityLabel={`Back to ${activeLensLabel}`}>
      <Text style={styles.backToHomeText}>‹ Back to {activeLensLabel}</Text>
    </TouchableOpacity>
  ) : isSearchActive ? (
    <TouchableOpacity onPress={clearSearch} accessibilityRole="button" accessibilityLabel={`Clear search, back to ${searchScopeLabel}`}>
      <Text style={styles.backToHomeText}>‹ Clear search</Text>
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
  );

  return (
    <View style={styles.screen}>
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Digest" variant="field" revealed={revealed}>
          <View style={styles.screenColumn}>
            <View style={styles.fixedHeader}>
              <View style={styles.breadcrumbRow}>
                {breadcrumb}
                {glossaryOpen ? null : (
                  <TouchableOpacity onPress={openGlossary} accessibilityRole="button" accessibilityLabel="Open the Glossary">
                    <Text style={styles.backToHomeText}>Glossary</Text>
                  </TouchableOpacity>
                )}
              </View>
              <EntrySearchInput
                key={searchResetKey}
                style={styles.searchInput}
                tabColor={TAB_COLOR}
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
              contentContainerStyle={{ paddingBottom: scrollBottomPadding, gap: HOME_BAND_GAP }}
              keyboardShouldPersistTaps="handled"
            >
              {glossaryOpen ? (
                <>
                  {isSearchActive ? null : (
                    <View style={styles.headerBox}>
                      <View style={styles.headerRow}>
                        <Ionicons name="ribbon" size={22} color={TAB_COLOR} style={textShadow} />
                        <Text style={styles.headerText}>Glossary</Text>
                      </View>
                      {GLOSSARY_TOPIC?.description ? <Text style={styles.headerDescription}>{GLOSSARY_TOPIC.description}</Text> : null}
                    </View>
                  )}
                  <View style={styles.countBox}>
                    <Text style={styles.countText}>
                      {categorySearchQuery.trim().length === 0
                        ? `${glossaryShown.length} term${glossaryShown.length === 1 ? '' : 's'}, A to Z`
                        : glossaryShown.length === 0
                          ? `No matches for “${categorySearchQuery.trim()}” in the Glossary.`
                          : `${glossaryShown.length} match${glossaryShown.length === 1 ? '' : 'es'} in the Glossary`}
                    </Text>
                  </View>
                  {glossaryShown.length > 0 ? (
                    <View style={styles.resultList}>
                      {glossaryShown.map((item, index) => (
                        <Fragment key={item.entry.id}>
                          {index > 0 ? <View style={rowStyles.rowDivider} /> : null}
                          <DigestEntryRow
                            entry={item.entry}
                            expanded={expandedId === item.entry.id}
                            onToggle={() => setExpandedId(expandedId === item.entry.id ? null : item.entry.id)}
                            onJumpToRelated={jumpToRelated}
                            tabColor={TAB_COLOR}
                            styles={rowStyles}
                            below={item.match ? <MatchDotRow match={item.match} tabColor={TAB_COLOR} /> : undefined}
                          />
                        </Fragment>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : lens === 'search' ? (
                <>
                  {isSearchActive ? null : (
                    <View style={styles.headerBox}>
                      <View style={styles.headerRow}>
                        <Ionicons name="ribbon" size={22} color={TAB_COLOR} style={textShadow} />
                        <Text style={styles.headerText}>Search All</Text>
                      </View>
                      <Text style={styles.headerDescription}>
                        Search across all {ALL_DIGEST_ENTRIES.length} entries at once, the conditions in Life included.
                      </Text>
                    </View>
                  )}
                  {!isSearchActive ? (
                    <View style={styles.countBox}>
                      <Text style={styles.countText}>
                        Type a word or phrase to search every category at once, a mechanism, a food, an author&apos;s name,
                        anything this Digest actually says somewhere.
                      </Text>
                    </View>
                  ) : searchQuery.trim().length === 0 ? null : (
                    <View style={styles.countBox}>
                      <Text style={styles.countText}>
                        {searchResults.length === 0
                          ? `No matches for “${searchQuery.trim()}”.`
                          : `${searchResults.length} match${searchResults.length === 1 ? '' : 'es'}`}
                      </Text>
                    </View>
                  )}
                  {searchResults.length > 0 && searchQuery.trim().length > 0 ? (
                    <View style={styles.resultList}>
                      {searchResults.map((result, index) => (
                        <Fragment key={result.entry.id}>
                          {index > 0 ? <View style={rowStyles.rowDivider} /> : null}
                          <DigestEntryRow
                            entry={result.entry}
                            groupLabel={categoryLabelForEntry(result.entry)}
                            expanded={expandedId === result.entry.id}
                            onToggle={() => toggleSearchResult(result.entry)}
                            onJumpToRelated={jumpToRelated}
                            tabColor={TAB_COLOR}
                            styles={rowStyles}
                            below={<MatchSummaryRow match={result.match} />}
                          />
                        </Fragment>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : (
                <DigestCategorySection
                  categoryKey={lens}
                  entries={entries}
                  query={categorySearchQuery}
                  searchActive={isSearchActive}
                  tabColor={TAB_COLOR}
                  tabTextColor={TAB_TEXT_COLOR}
                  openEntryId={sectionOpenId}
                  scrollToY={scrollToY}
                  onJumpToRelated={jumpToRelated}
                />
              )}
            </ScrollView>
          </View>
        </GatedTabContent>
      </SwipeableTabScreen>
      <PageIdentityLabel title="Digest" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <LensHub
        pageTitle="Digest"
        buttonLabel="Digest"
        options={LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        itemLabelLines={2}
        infoInGrid={true}
        gridPillSize={44}
        gridCustomIconSize={40}
        gridIconSize={26}
        autoOpenSignal={openTrigger}
        onSelect={(key) => {
          setLens(key);
          setGlossaryOpen(false);
          setExpandedId(null);
          setSectionOpenId(null);
          // A lens switch is a fresh arrival: the ScrollView's offset is a
          // property of the instance that swapping its children does not
          // reset on its own.
          scrollRef.current?.scrollTo({ y: 0, animated: false });
          resetSearch();
          setRevealed(true);
        }}
      />
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
  // 2026-08-24, direct report: "buttons... should follow the color of the
  // ground color chosen in the Profile... look like buttons, not like
  // pills... have some depth." This is a real, tappable navigation
  // control ("‹ Back to Digest," "‹ Clear search," and so on) -- was
  // filled with TAB_COLOR at a fully-rounded 20px radius, reading as a
  // pill rather than a button, and every tab's own version looked
  // different from every other tab's. Now colors.buttonColor (the one
  // shared, ground-theme-derived button fill, see its own comment in
  // constants/colors.ts) at the standing 8px button radius plus
  // BUTTON_SHADOW for real depth, so this reads and behaves the same way
  // regardless of which Digest category it's on.
  backToHomeText: {
    ...typography.body,
    color: colors.textOnButton,
    fontWeight: '400',
    alignSelf: 'flex-start',
    backgroundColor: colors.buttonColor,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...BUTTON_SHADOW,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  body: { flex: 1 },
  // The surfaces this screen draws itself, beside the shared row styles:
  // the box naming a lens or the Glossary at the top of its list, the chip
  // stating a count or an empty result, and the surface a list of rows
  // sits on. Every one reaches both edges of the screen, the same as the
  // bands in DigestCategorySection and the Conditions page in Life.
  headerBox: { backgroundColor: colors.surface, paddingHorizontal: HOME_BAND_CONTENT_PADDING, paddingVertical: 14, gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { ...typography.screenTitle, ...menuLabelShadow, fontWeight: '400', color: TAB_TEXT_COLOR, flex: 1 },
  headerDescription: { ...typography.body, color: colors.textSecondary, lineHeight: 20, ...textShadow },
  countBox: { backgroundColor: colors.surface, paddingHorizontal: HOME_BAND_CONTENT_PADDING, paddingVertical: 10 },
  countText: { ...typography.body, color: colors.textSecondary, lineHeight: 20, ...textShadow },
  resultList: { backgroundColor: colors.surface, paddingHorizontal: HOME_BAND_CONTENT_PADDING, paddingVertical: 4 },
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
    // EntrySearchInput) sat too far below it -- moved 10px closer by
    // shrinking this gap alone, same as fixedHeader's own paddingBottom
    // below getting the matching other half of the same report.
    marginBottom: 4,
    ...textShadow,
  },
  matchDotRow: { flexDirection: 'row', gap: 5, marginTop: 6 },
  matchDot: { width: 8, height: 8, borderRadius: 4 },
  matchDotTitle: { backgroundColor: TAB_COLOR },
  matchDotBody: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: TAB_COLOR },
  matchDotMiss: { backgroundColor: colors.border },
  // 2026-08-09, SearchResultCard's own real per-term match display -- see
  // MatchSummaryRow's own comment for the full reasoning. matchBlock sits
  // directly under the teaser, matchSummaryText states the plain "X of Y
  // matched" count, and matchTermRow holds one pill per real search term:
  // filled (matchTermPillTitle) when that term hit this entry's own title,
  // outlined (matchTermPillBody) when it only matched the body/citations,
  // and dim (matchTermPillMiss) when it didn't match this entry at all.
  matchBlock: { marginTop: 8 },
  matchSummaryText: { ...typography.caption, color: colors.textMuted, marginBottom: 6, ...textShadow },
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
  // No shadow at all, 2026-08-29, direct instruction after the lighter
  // shadow still read wrong: "The pills in the search Digest still show up
  // as smudgy looking. Remove drop shadowing from those completely." A
  // deliberate, named exception to this app's own standing "drop shadow on
  // all text" rule: at 11px, inside a bordered pill that already separates
  // the text from whatever is behind it, any shadow smears the glyphs
  // rather than helping them read.
  matchTermPillText: { ...typography.caption, color: TAB_TEXT_COLOR, fontSize: 11 },
  // 2026-08-25, direct report: "drop shadowed is fine only if the font is
  // not already bolded," the same rule dietTagPillText (which now lives
  // in components/RecipeDetailCard.tsx) was already fixed under --
  // matchTermPillText (below) already carries menuLabelShadow, so this
  // filled/title-matched variant loses its fontWeight: '400' rather than
  // stacking bold on top of an already-shadowed pill.
  matchTermPillTextTitle: { color: colors.background,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  matchTermPillTextMiss: { color: colors.textMuted },
  // SearchMatchDemo's own worked-example block, inside the "About Search
  // Matching" sheet -- 2026-08-09, direct request for real, visual dot/
  // pill examples rather than just prose. demoDotRow/demoDotColumn/
  // demoDotLabel are demo-only (the real ShelfTabCard dots have no
  // labels); everything else the demo shows -- the dot itself, and the
  // whole pill row via MatchSummaryRow -- reuses the app's real styles
  // directly, not a copy.
  demoBlock: { marginTop: 4, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12 },
  demoHeading: { ...typography.label, ...menuLabelShadow, fontWeight: '400', color: TAB_TEXT_COLOR, marginBottom: 4 },
  demoSubheading: { ...typography.label, ...menuLabelShadow, fontWeight: '400', color: TAB_TEXT_COLOR, marginTop: 18, marginBottom: 4 },
  demoIntro: { ...typography.caption, color: colors.textMuted, marginBottom: 10, lineHeight: 17, ...textShadow },
  demoExample: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  demoExampleTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, marginBottom: 6, ...textShadow },
  demoExampleNote: { ...typography.caption, color: colors.textMuted, marginTop: 6, lineHeight: 16, ...textShadow },
  demoDotRow: { flexDirection: 'row', gap: 14 },
  demoDotColumn: { alignItems: 'center', gap: 3 },
  demoDotLabel: { ...typography.caption, color: colors.textMuted, fontSize: 10, ...textShadow },
  demoClosing: { ...typography.body, color: colors.textSecondary, lineHeight: 19, marginTop: 4, ...textShadow },
});
