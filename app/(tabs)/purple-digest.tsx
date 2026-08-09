import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, type TextStyle } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { AppTextInput } from '../../components/AppTextInput';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { DigestBarChart } from '../../components/DigestChart';
import { GatedTabContent } from '../../components/GatedTabContent';
import type { HelpSection } from '../../components/HelpButton';
import { LensHub, type LensOption } from '../../components/LensHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { PurpleRibbonIcon } from '../../components/PurpleRibbonIcon';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { TAB_REVEAL_DURATION_MS } from '../../constants/tabReveal';
import { typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { getUserConditions, getVisibleFoodBaseNames } from '../../lib/db';
import { getDigestFeedbackFor, setDigestFeedback, type DigestFeedbackValue } from '../../lib/digestFeedback';
import {
  ALL_DIGEST_ENTRIES,
  DIGEST_CATEGORY_META,
  findDigestEntryById,
  getEntriesForCategory,
  isProblemFoodEntry,
  searchDigestEntries,
  searchEntries,
  type AnyDigestEntry,
  type DigestCategoryKey,
  type EvidenceTier,
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
// as Home's own background. Worth commissioning real Purple Digest art
// later; not a blocker for shipping real content.
const TAB_COLOR = colors.tabPurpleDigest;

const DIGEST_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'A growing set of categories, one evidence standard',
    body: 'Every entry here is tiered Strong/Moderate/Weak by its own actual evidence, the same discipline as this app\'s own 6 Dimensions scoring. A gold dot means trial-level support, not just "this app trusts it." This tab is meant to keep growing; if the picker below runs past what fits on screen at once, it scrolls.',
  },
  {
    heading: 'Search the whole Digest, or just one category',
    body: '"Search All" is its own selection in the menu below, right alongside Basic Health and every condition -- pick it to search every entry in this Digest at once. Every other category also has its own, separate search box, scoped to just that one category\'s own entries, once it\'s open.',
  },
  {
    heading: 'A quick way back',
    body: 'A "‹ Back to Digest" link sits at the top of every category\'s own resting content -- tap it to return straight to this tab\'s own resting screen, from any depth, so you can open the menu and pick something else. The moment you start searching within a category, that link becomes "‹ Clear search" instead -- it clears the search and returns you to that same category\'s own main page, not out to the picker.',
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
    body: 'Type a word or phrase to search every entry in this whole Digest at once, across every category, regardless of which one you searched last. Tap any result to jump straight to it, already expanded, in its own real category.',
  },
  {
    heading: 'A different way to look, not the only way',
    body: 'Every other category also has its own, separate search box, scoped to just that one category\'s own entries, once you\'ve opened it -- useful when you already know roughly where something lives and just want to narrow it down.',
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
    body: "How the body itself works, independent of any diagnosis: a real, direct \"Why This App Exists\" section (the app creator's own story and thesis, clearly attributed to him, not blended with this app's own researched content), a growing \"Essential Nutrients\" deep-dive series (Magnesium and Vitamin D so far), food additive dose-and-mechanism detail, food-and-swap entries for common everyday reactions (garlic, dairy, refined oils, commercial products), verified fermented-food bacterial strains, nutrient interactions (what helps or competes with what absorption), a food-industry history, general lifestyle and environmental exposures with no disease-specific claim, general exercise/autophagy biology, a full glossary, and general patient-advocacy skills like how to ask a doctor for a fuller lab panel. Deliberately excludes autoimmune-disease mechanisms and anything condition-specific, even when studied in a disease other than Hashimoto's -- that content lives in each condition's own area instead. This is what the Free tier shows in full. Organized as real, related groups, each its own horizontally-scrolling row -- scroll a row sideways to browse its own tabs, or scroll the screen down to move to the next group. Tap a tab to open its full entry directly below that same row; tap a different tab in the same row to switch, without leaving the group. A search bar above the groups searches only within Basic Health.",
  },
  hashimotos: {
    heading: "Hashimoto's",
    body: "Every Hashimoto's-specific and autoimmune-mechanism finding in this Digest, gathered into one real area, the same way each other condition already has its own: thyroid-specific nutrients (selenium, iodine, and newer candidates), labs and medication timing (levothyroxine, biotin interference, TSH's own diurnal rhythm), what to eat at each healing stage, how the disease reaches past the thyroid into other organs, the dated history behind Hashimoto's own diagnosis and treatment, pregnancy-specific guidance, gut-barrier and microbiome science (SCFAs, zonulin, what actually repairs a leaky gut), complementary therapies evaluated against thyroid/autoimmune outcomes specifically, corroborating cross-disease evidence, a Hashimoto's-specific problem-foods list, and Hashimoto's own self-advocacy section: which lab tests to ask for, why, and how often.",
  },
  rheumatoidArthritis: {
    heading: 'Rheumatoid Arthritis',
    body: "This app's second real condition, written as RA's own primary content rather than as evidence borrowed for someone else's disease. Covers the two food levers with the strongest trial evidence (omega-3s at a specific dose threshold, a Mediterranean eating pattern with real disease-activity-score results), a landmark fasting-then-vegetarian trial that only holds up for a real subset of people, and two medication interactions -- methotrexate with folate, and methotrexate with alcohol -- both more precise and more forgiving than the blanket warnings patients often hear. Closes on the real, common overlap between RA and Hashimoto's, the reason this condition was built first.",
  },
  psoriasis: {
    heading: 'Psoriasis',
    body: "This app's third real condition, covering psoriasis and psoriatic arthritis on their own terms. Weight loss and a Mediterranean eating pattern both carry strong trial evidence with real, measured PASI-score improvement; alcohol tracks with worse disease (most clearly in men) and a striking mortality finding regardless of sex; a specific antibody-positive minority sees real, biopsy-confirmed skin improvement from cutting gluten. Also covers two findings honestly reported as unproven rather than smoothed into false confidence -- nightshade avoidance and oral vitamin D supplementation -- plus two serious, specific medication-food interactions (cyclosporine with grapefruit, acitretin with alcohol) worth knowing exactly, not just generally.",
  },
  graves: {
    heading: "Graves' Disease",
    body: "This app's fourth real condition, covering hyperthyroidism's most common cause on its own terms. In several real ways it's the mirror image of this app's own Hashimoto's research: smoking raises Graves' eye-disease risk sharply while it lowers Hashimoto's risk, and iodine is both a real trigger and a real complication for antithyroid drug efficacy rather than simply something to avoid. Selenium carries strong trial evidence for mild eye disease specifically. Built with real self-advocacy content from day one: TRAb/TSI antibody testing's own quantified remission and relapse odds, specific warning signs for antithyroid drug side effects, and the real, measurable bone-density loss untreated hyperthyroidism causes.",
  },
  type1Diabetes: {
    heading: 'Type 1 Diabetes',
    body: "This app's fifth real condition, and a genuinely different shape from every one built before it: food's own daily relevance here isn't about triggering or avoiding a flare, it's about matching carbohydrate intake to insulin dosing accurately enough to stay safe. Covers carb-counting's own real, measured 21% average error and its direct link to worse blood glucose control, exercise and alcohol's own real (and sometimes delayed) hypoglycemia risks, DKA's real warning signs and a checkable ketone threshold, and the real, well-documented overlap with celiac disease. Built with real self-advocacy content from day one: the full autoantibody panel behind diagnosis, Time in Range as a genuine complement to HbA1c, and the real screening intervals for eye and kidney complications that start years before any symptom would.",
  },
  celiac: {
    heading: 'Celiac Disease',
    body: "This app's sixth real condition, and the one place here where a strict diet is the entire treatment, not one lever among several. Covers the real 20ppm cross-contamination standard and what actually breaks it in a kitchen, the oats controversy (safe for most, a real minority genuinely reacts to the oat protein itself), real market data on what commercial gluten-free products get nutritionally wrong, and a real, age-dependent healing timeline most people underestimate. Built with real self-advocacy content from day one: why going gluten-free before testing is the single most common diagnostic mistake, and a real, specific recommended age (45) for a bone-density scan. Closes on a real, quantified overlap with Hashimoto's roughly double the general population's own autoimmune thyroid risk.",
  },
  ibd: {
    heading: 'Inflammatory Bowel Disease',
    body: "This app's seventh real condition, covering two genuinely distinct diseases, Crohn's disease and ulcerative colitis, under one umbrella. Several findings here run in opposite directions depending on which one someone actually has, most sharply smoking, which worsens Crohn's while genuinely protecting against ulcerative colitis. Covers exclusive enteral nutrition's real, strong remission rates in pediatric Crohn's, the low-fiber-during-a-flare advice's own surprisingly thin evidence, and a real, honest null result on Hashimoto's comorbidity overall (with one real exception in older patients). Built with real self-advocacy content from day one: fecal calprotectin as a non-invasive way to check real gut inflammation, the colorectal cancer surveillance schedule (and why it moves up sharply with a specific complication), and azathioprine's own FDA-recommended genetic test before the first dose.",
  },
  multipleSclerosis: {
    heading: 'Multiple Sclerosis',
    body: "This app's eighth real condition, and a genuinely different shape from every one built before it: MS attacks the brain and spinal cord directly, not the gut, joints, skin, or thyroid, so its own single strongest finding isn't a food at all -- a 20-year study found MS risk rose 32-fold after Epstein-Barr virus infection, with a real, specific mechanism (a viral protein that closely resembles a piece of the nerve's own myelin coating) now understood behind it. Covers the real head-to-head trial between the historic Swank diet and the newer Wahls Protocol (both genuinely helped), and two honest corrections on supplements that looked promising in an early trial but didn't hold up in a larger one -- high-dose biotin and vitamin D. Also covers a real, striking overlap with Hashimoto's (present in 20-25% of untreated MS patients). Built with real self-advocacy content from day one: JC virus antibody monitoring for a common MS medication's own rare but serious safety risk, how MS is actually diagnosed, and a real fix for a common medication side effect.",
  },
  lupus: {
    heading: 'Lupus (SLE)',
    body: "This app's ninth real condition, and a genuinely wide-ranging one: lupus can affect the skin, joints, kidneys, blood, and nervous system all at once, giving this category its own shape rather than one dominant theme. Covers one of the most specific, well-documented individual food triggers in this app's whole research base -- alfalfa sprouts, via a real amino acid (L-canavanine) the body mistakenly builds into its own proteins -- plus a real catch-22 unique to lupus: sun protection helps prevent a flare, but also raises real vitamin D deficiency risk, with genuinely mixed trial evidence on whether treating that deficiency calms the disease itself. Also covers omega-3's own honest complexity (positive trial evidence, but a genetic study pointing the other way on lupus risk) and a real, striking cardiovascular risk (a 50-fold heart-attack risk increase in young women) that ordinary risk factors don't fully explain. Built with real self-advocacy content from day one: hydroxychloroquine's own eye-exam schedule, the real lab panel that catches kidney involvement early, and the first lupus-specific biologic in over 50 years.",
  },
  sjogrens: {
    heading: "Sjögren's Syndrome",
    body: "This app's tenth real condition, defined by an attack on the body's own moisture-making glands. Unlike most conditions here, it carries a real, direct, same-day relationship with food and drink -- alcohol and caffeine genuinely worsen dryness within hours, not through a slower inflammatory pathway, and omega-3 has real, fairly consistent positive trial evidence for both dry eyes and dry mouth at once. Covers the real mechanism behind Sjögren's own elevated dental-caries risk (saliva's protective role, genuinely lost, not just its comfort), a real and meaningfully elevated lymphoma risk worth knowing plainly, a real kidney complication (renal tubular acidosis) that can strike before the disease's own hallmark dryness is even recognized, and the real, substantial overlap with rheumatoid arthritis and lupus, both already covered elsewhere in this app. Built with real self-advocacy content from day one: the real antibody and gland tests behind an actual diagnosis, and how pilocarpine and cevimeline genuinely restore the body's own moisture production rather than just replacing it.",
  },
  pcos: {
    heading: 'PCOS',
    body: "This app's eleventh real condition, and its first genuinely non-autoimmune one -- PCOS is a real endocrine and metabolic disorder, not an immune attack on the body's own tissue, with insulin resistance as the single mechanism driving most of what else happens. Covers the well-studied myo-inositol/D-chiro-inositol 40:1 ratio (one of the better-evidenced supplements anywhere in this app's research, already tracked in this app's own My Meds data), spearmint tea's real anti-androgen trial evidence, and a real, quantified weight-loss finding (each 1% of body weight lost measurably raising the odds of ovulation returning). Also covers a real, elevated endometrial cancer risk tracing directly to PCOS's own anovulation mechanism, and a real, bidirectional overlap with Hashimoto's (each condition genuinely raising real risk of the other). Built with real self-advocacy content from day one: why a full glucose tolerance test catches what a simple fasting glucose misses, the real cardiometabolic lab panel PCOS deserves beyond a fertility checklist, and spironolactone's own real potassium caution.",
  },
  chronicKidneyDisease: {
    heading: 'Chronic Kidney Disease',
    body: "This app's twelfth real condition, and its second genuinely non-autoimmune one -- CKD's own real dietary management (potassium, phosphorus, sodium, protein) is more directly food-restrictive than almost any other condition here. Leads with a real, honest correction to some of the most commonly repeated CKD dietary advice anywhere: blanket potassium restriction has surprisingly thin trial evidence behind it, and 2020 KDIGO guidelines themselves found the evidence insufficient for a graded recommendation. Covers \"hidden phosphorus\" -- food-additive phosphate absorbed at over 90% versus 20-60% from real whole food, rarely labeled -- real, specific low-protein diet guidance now favoring plant-forward sources, and a real, simple, evidence-backed fix (sodium bicarbonate) for a lesser-known complication (metabolic acidosis). Also covers SGLT2 inhibitors' genuinely major, real kidney-protective effect, independent of their original diabetes purpose. Built with real self-advocacy content from day one: why eGFR and urine albumin need tracking together, and ACE inhibitors/ARBs' own real, manageable potassium-monitoring schedule.",
  },
  fattyLiverDisease: {
    heading: 'Fatty Liver Disease',
    body: "This app's thirteenth real condition, and its third genuinely non-autoimmune one -- MASLD (metabolic dysfunction-associated steatotic liver disease, the current, more precise name for what used to be called NAFLD) is built on top of a substantial amount of real, pre-existing liver research already in this app, written for a Hashimoto's reader, cross-linked here rather than repeated. Covers a real, graded weight-loss staircase (3% for real histological benefit to begin, 10% for the strongest fibrosis regression), the Mediterranean diet's own real, honest nuance (a plainer low-fat diet works about as well), coffee as one of the more consistently protective findings anywhere in this app's research, and a real, contested alcohol-threshold question (MetALD) that current guidance is still working out. Also covers two real, recent medication stories: resmetirom, the first-ever approved MASH drug, which works through a thyroid hormone receptor directly, a genuinely elegant echo of this app's own core focus, and semaglutide's real, large 2025 trial results. Built with real self-advocacy content from day one: FIB-4, a real, low-cost fibrosis-screening tool often calculable from labs already drawn.",
  },
  type2Diabetes: {
    heading: 'Type 2 Diabetes',
    body: "This app's fourteenth real condition, and its fourth genuinely non-autoimmune one -- T2D sits at the real center of the metabolic-syndrome cluster already built out across PCOS, MASLD, and CKD, cross-linked heavily to that existing content rather than re-derived. Covers a real, important distinction from Type 1 Diabetes (already covered in its own category, genuinely often confused with T2D by name alone, with real, different screening timelines that follow directly from that distinction), the DiRECT trial's own striking real remission rates (46% at one year), and low-carbohydrate diets' own real, honestly caveated short-term evidence. Also covers a real, recent treatment-guideline paradigm shift toward GLP-1/SGLT2 medications chosen for their own organ-protective benefits, not glucose control alone, and a real, quantified sulfonylurea hypoglycemia risk sharply elevated by reduced kidney function. Built with real self-advocacy content from day one: an honest correction to \"lower HbA1c is always better,\" backed by real trials finding intensive control didn't reduce cardiovascular risk while genuinely increasing harm.",
  },
  ibs: {
    heading: 'Irritable Bowel Syndrome',
    body: "This app's fifteenth real condition, and its fifth genuinely non-autoimmune one -- IBS is a real disorder of gut-brain interaction, not structural intestinal damage, leaning heavily on cross-links to this app's own already-built FODMAP and gut-microbiome content rather than re-deriving it. Covers a real, important distinction from IBD (already covered in its own category, genuinely often confused with IBS by name alone -- IBS carries no real inflammation and no elevated cancer risk, the opposite of IBD), real, genuinely non-dietary interventions with meaningful trial support (peppermint oil, gut-directed hypnotherapy), and a real, striking, underappreciated mechanism: post-infectious IBS may account for over half of all US cases, tracing back to a specific, identifiable past illness. Also covers real, non-FODMAP triggers (coffee, alcohol, artificial sweeteners) with their own documented timing, and two real, subtype-targeted medications with genuinely different mechanisms. Built with real self-advocacy content from day one: the specific red-flag symptoms and diagnostic workup, including a thyroid panel, that should come before assuming IBS by default.",
  },
  migraine: {
    heading: 'Migraine',
    body: "This app's sixteenth real condition, and its sixth genuinely non-autoimmune one -- migraine is a real neurological disease, not \"just a bad headache,\" with a real, specific signaling molecule (CGRP) central to how an attack actually happens. Covers a real, honest correction to popular food-trigger lists (tyramine's reputation as the culprit behind aged cheese and red wine doesn't fully hold up under refined modern measurement, and chocolate's own evidence is genuinely mixed), the magnesium/riboflavin/CoQ10 combination's own real, specific trial results, and CGRP inhibitors, the first medication class ever built specifically for migraine prevention. Also covers medication-overuse headache (a real, named condition with a real, specific day-per-month threshold), menstrual migraine's own leading explanation reported honestly alongside its real evidence gaps, and caffeine's genuine double role as both trigger and withdrawal cause. Built with real self-advocacy content from day one: the specific red-flag symptoms that mean a headache needs more than migraine management.",
  },
  cardiovascularDisease: {
    heading: 'Cardiovascular Disease',
    body: "This app's seventeenth real condition, and its seventh genuinely non-autoimmune one -- cardiovascular disease was already touched from five separate angles across this app's existing content (lupus's own real 50-fold heart attack risk in young women, Hashimoto's own organ-systems research on hypothyroid heart effects, PCOS's own lipid-panel entry, and both psoriasis's and rheumatoid arthritis's own self-advocacy entries on elevated cardiovascular risk) before this category itself existed to link back to. Covers real, whole-food dietary patterns with genuine trial support (the Mediterranean diet, including PREDIMED's own honest 2018 retraction-and-correction story, and DASH's specific sodium targets), a real, large, consistent statin evidence review, and two honest examples of medical guidance shifting because a real, large trial's own numbers said so: daily aspirin for primary prevention (a real, quantified trade-off between preventing vascular events and causing major bleeding) and omega-3 supplementation (a real, honest null result from the same trial). Built with real self-advocacy content from day one: lipid-panel testing intervals (with a brief, honestly-scoped note on apolipoprotein B) and the specific heart attack warning symptoms, including a real, documented pattern that differs by sex.",
  },
  gout: {
    heading: 'Gout',
    body: "This app's eighteenth real condition. Gout is a genuinely different shape of condition from most already covered: its own best real evidence is a specific, individually well-studied list of foods and drinks rather than one broad dietary pattern. Covers real, quantified findings on meat and seafood (raising risk) alongside dairy (lowering it, from the same real study), sugar-sweetened drinks and fructose (a real, dose-dependent risk diet soda doesn't share), beer specifically (carrying real, outsized risk compared to spirits, with wine showing none), and three real, individually-tested protective foods: cherries (including a real, striking combined effect with allopurinol), vitamin C, and coffee. Covers a real, serious cardiovascular safety difference between the two most common urate-lowering medications, and gout's own real, direct overlap with heart, kidney, and metabolic conditions already built out elsewhere in this app. Built with real self-advocacy content from day one: HLA-B*58:01 genetic testing before starting allopurinol in specific, named higher-risk populations, and recognizing when a flare might actually be a real, more urgent joint infection.",
  },
  prostateHealth: {
    heading: 'Prostate Health',
    body: "This app's nineteenth real condition, covering benign prostatic hyperplasia (BPH) and prostate cancer risk -- two extremely common conditions (BPH affects roughly half of men by their 50s, most by their 70s; prostate cancer is the most commonly diagnosed cancer in American men) with a genuine, direct gut-microbiome connection. Covers gut dysbiosis's real link to BPH through the same short-chain-fatty-acid mechanism this app's Gut & Microbiome content already documents, and a genuinely striking finding: specific gut bacteria can directly manufacture androgens from hormone precursors, and convert dietary choline into a compound (TMAO) linked to a real, quantified increase in lethal prostate cancer. Covers two real, individually strong protective foods (lycopene/tomatoes, cruciferous vegetables), the prostate's own distinctive zinc concentration, and two honest supplement corrections: a landmark trial found selenium doesn't prevent prostate cancer (and its usual supplement partner may raise risk), and saw palmetto's popularity outruns its genuinely mixed evidence. Self-advocacy covers a real lab-interpretation trap (BPH medications cut PSA roughly in half) and PSA screening's own honest, quantified benefit-versus-harm tradeoff.",
  },
};

// A deliberate line-break point for each category name that's long enough
// to wrap at 2 columns (see LensHub's own itemLabelLines), so the grid
// item's own auto-wrap never has to guess where to break -- 2026-08-07,
// explicitly requested: "Make sure the names of the icons have a forced
// carriage return at a logical spot." Every entry here breaks after a
// natural phrase boundary (usually right after an "&") so both halves
// still read as coherent pieces on their own, rather than wherever plain
// word-wrap happens to land. Short names that already fit comfortably on
// one line (Food Additives, Gut & Microbiome, Fermented Foods, Healing
// Stages) are deliberately left out -- forcing an unnecessary break on a
// name that already fits would just leave the second line looking sparse.
// Only affects the grid tile's own label (LensOption.gridLabel) -- the
// plain, unbroken `label` is still what's used everywhere else this name
// appears (the Info sheet's own heading, activeLensLabel, etc.).
// Empty as of the 2026-08-08 restructure -- all 4 real category labels
// (Basic Health, Hashimoto's, Rheumatoid Arthritis, Psoriasis) are short
// enough to fit on one line without a forced break. Kept as a real,
// live mechanism (not deleted) since a future condition with a longer name
// may need it again.
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
type BasicHealthTopic = { label: string; prefixes?: string[]; subtopics?: BasicHealthSubtopic[] };

const BASIC_HEALTH_TOPICS: BasicHealthTopic[] = [
  {
    label: 'Essential Nutrients',
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
      {
        label: 'Hormones',
        prefixes: ['hormone-', 'hormones-', 'insulin-', 'cortisol-', 'thyroid-hormones-', 'leptin-', 'estrogen-', 'testosterone-'],
      },
    ],
  },
  { label: 'Glossary', prefixes: ['glossary-'] },
  // 2026-08-09, direct request: "information about portions, and
  // recommended daily allowances and minimum amounts of anything." See
  // lib/digest/portionsAndRDAs.ts's own header comment -- every number
  // reused directly from this app's own bundled DRI reference table.
  { label: 'Portions & Recommended Amounts', prefixes: ['portion-'] },
  // 2026-08-09, direct request: "how to choose the right kinds of
  // products... so they aren't fooled and purchase the wrong things." See
  // lib/digest/choosingQualityProducts.ts's own header comment.
  { label: 'Choosing the Real Thing', prefixes: ['quality-'] },
  // 2026-08-09, same day, direct continuation of the same request: a real,
  // deliberate companion to "Choosing the Real Thing" -- that one covers
  // whether a product IS what it claims; this covers how to actually read
  // the label once you're holding a genuine one. See
  // lib/digest/readingLabels.ts's own header comment.
  { label: 'Reading Labels & Ingredient Lists', prefixes: ['label-'] },
  // 2026-08-09, same day: a real, systematized companion to this app's own
  // per-condition medication research -- which common medication CLASSES
  // measurably lower which nutrients over sustained use, regardless of
  // condition. See lib/digest/medicationDepletion.ts's own header comment.
  { label: 'Medications & Nutrient Depletion', prefixes: ['depletion-'] },
  { label: 'Prevention & Lifestyle by Condition', prefixes: ['prevention-', 'apphelps-'] },
  // 2026-08-09, direct request: "an honest medical science evidence based
  // perspective on the popular types of diets out there." A real, distinct
  // topic from "Prevention & Lifestyle by Condition" above -- that one is
  // scoped per-CONDITION (what to eat if you have Hashimoto's, RA, etc.);
  // this one is scoped per-DIET-PHILOSOPHY, condition-agnostic, and closes
  // with a real, honest entry on how this app helps track any of them.
  // See lib/digest/popularDiets.ts's own header comment.
  { label: 'Popular Diets & Eating Styles', prefixes: ['diet-'] },
  { label: 'Problem Foods & Swaps', prefixes: ['problem-'] },
  { label: 'Food Additives', prefixes: ['additive-'] },
  { label: 'Nutrient Interactions', prefixes: ['interaction-'] },
  { label: 'Fermented Foods', prefixes: ['fermented-'] },
  // 2026-08-09, direct request: "talk about the different ways of making
  // fermentations for drinks and foods... how they are generally made and
  // where to look for more information." A real, deliberate companion to
  // "Fermented Foods" above, not a merge into it -- see
  // lib/digest/fermentationMethods.ts's own header comment for why the two
  // stay separate (organized by strain vs. organized by method).
  { label: 'Fermentation Methods', prefixes: ['fermentmethod-'] },
  // 2026-08-09, direct request: "a group that has information about every
  // fruit and vegetable and their health benefits and types of problems...
  // This should also include nuts and seeds." See
  // lib/digest/produceProfiles.ts's own header comment, including the real,
  // new hide-sync mechanism this topic's own entries use (see
  // basicHealthEntriesForPrefixes below for where that filter is applied).
  { label: 'Fruits, Vegetables, Nuts & Seeds', prefixes: ['produce-'] },
  { label: 'Lifestyle & Environment', prefixes: ['lifestyle-'] },
  { label: 'Mitochondria & Metabolism', prefixes: ['mito-'] },
  { label: 'Self Advocacy', prefixes: ['advocacy-'] },
  { label: 'Food Industry & History', prefixes: ['foodhistory-'] },
];

// A real, dynamic safety net, not a hardcoded 32nd topic -- only ever
// appears if a real Basic Health entry's own id doesn't match any prefix
// above, the same "unmatched catch-all, not an expected real bucket" role
// the old flat list's own 'More' bucket already played.
const BASIC_HEALTH_MORE_TOPIC_LABEL = 'More';

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
// (a Basic Health topic/subtopic leaf list, a condition's own pillar
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

// Resolves whichever real node a path currently points at (top-level
// topic list when `path` is empty, a topic's own subtopics when `path` is
// one real "Essential Nutrients"-shaped topic, or the real leaf entries at
// the end of either path) -- the one real function every level of
// BasicHealthTree below reads from, so the path itself stays the single
// source of truth for "where the person currently is."
function basicHealthEntriesForPath(entries: AnyDigestEntry[], path: string[]): AnyDigestEntry[] {
  if (path.length === 0) return [];
  if (path[0] === BASIC_HEALTH_MORE_TOPIC_LABEL) {
    return sortDigestEntriesLogically(entries.filter((entry) => basicHealthTopicPathForEntryId(entry.id).length === 0));
  }
  const topic = BASIC_HEALTH_TOPICS.find((t) => t.label === path[0]);
  if (!topic) return [];
  if (path.length === 2 && topic.subtopics) {
    const sub = topic.subtopics.find((s) => s.label === path[1]);
    return sub ? basicHealthEntriesForPrefixes(entries, sub.prefixes) : [];
  }
  return topic.prefixes ? basicHealthEntriesForPrefixes(entries, topic.prefixes) : [];
}

// Every real Basic Health leaf group at once (every standalone topic, and
// every Essential Nutrients subtopic individually), flattened into the
// same {label, entries} shape BasicHealthShelves already renders --
// 2026-08-08, built for the new sticky-search filtered view below: "all
// things below in the knowledgebase hierarchical set of the area are
// displayed below and filtered." Rather than drilling through the tree one
// level at a time, a search shows every real leaf topic at once, filtered
// down to just the ones with a match. `label` is deliberately the same
// '::'-joined path string shelfGroupKeyForEntry already computes for a
// Basic Health entry (not a prettier "Topic › Subtopic" string) -- see
// BasicHealthShelves' own comment for why the ref/scroll-key and the
// display text have to stay the same underlying value.
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

// Maps the `conditions` reference table's own real, snake_case codes
// (confirmed directly against the live database, not guessed) to this
// screen's own camelCase DigestCategoryKey -- the two naming conventions
// never lined up automatically (`chronic_kidney_disease` vs.
// `chronicKidneyDisease`), so this is a real, hand-verified lookup, not a
// derived transform. Used only to figure out which lens tiles correspond
// to conditions the person has actually told the app they have (via
// Profile's own condition picker, `user_conditions`) -- see
// pinnedDigestKeys below.
const CONDITION_CODE_TO_DIGEST_KEY: Record<string, DigestCategoryKey> = {
  hashimotos: 'hashimotos',
  rheumatoid_arthritis: 'rheumatoidArthritis',
  psoriasis: 'psoriasis',
  graves: 'graves',
  type_1_diabetes: 'type1Diabetes',
  celiac: 'celiac',
  ibd: 'ibd',
  multiple_sclerosis: 'multipleSclerosis',
  lupus: 'lupus',
  sjogrens: 'sjogrens',
  pcos: 'pcos',
  chronic_kidney_disease: 'chronicKidneyDisease',
  fatty_liver_disease: 'fattyLiverDisease',
  type_2_diabetes: 'type2Diabetes',
  ibs: 'ibs',
  migraine: 'migraine',
  cardiovascular_disease: 'cardiovascularDisease',
  gout: 'gout',
  prostate_health: 'prostateHealth',
};

// A real, computed-not-stored grouping applied to every CONDITION category
// (everything except Basic Health, which already has its own, more
// granular by-topic shelf grouping above, and the synthetic 'search' lens)
// -- reusing the exact same shelf UI mechanism rather than inventing a
// second one. Loosely modeled on a real external UX recommendation (four
// universal "pillars" per condition: core science, self-advocacy/testing,
// life stages & history, whole-body effects), adapted to how this app's
// own condition content actually reads.
//
// This is a real, honest v1 heuristic, matching every other grouping
// mechanism already in this file (Basic Health's own id-prefix matching)
// and elsewhere in this app (the food-name-grouping work in
// lib/foodNameGrouping.ts) -- computed from each entry's own id and
// title/food name at render time, NOT hand-reviewed entry by entry across
// 800+ entries and 19 conditions, and NOT stored as a new field on
// DigestEntry (which would have meant touching every existing entry object
// by hand for a purely presentational concern, the same reasoning
// BASIC_HEALTH_TOPICS above already gives for its own choice). Worth a
// real spot-check across a few conditions once seen on-device before
// trusting the classification fully -- some entries will genuinely land in
// a less-than-ideal pillar (keyword heuristics always do), the same
// standing caveat the Basic Health grouping and food-name-grouping features
// both shipped under.
type ConditionPillar = 'science' | 'advocacy' | 'body' | 'stages';

const CONDITION_PILLAR_LABELS: Record<ConditionPillar, string> = {
  science: 'Core Science',
  advocacy: 'Self-Advocacy & Testing',
  body: 'Whole-Body Effects',
  stages: 'History & Life Stages',
};

// Real, intentional row order -- the deep-dive findings most people open
// this category to actually read lead; self-advocacy (what to ask a doctor
// for) and whole-body effects follow; history (interesting, but the least
// actionable day-to-day) trails last, the same "most useful first" ordering
// already established for BASIC_HEALTH_TOPICS above.
const CONDITION_PILLAR_ORDER: ConditionPillar[] = ['science', 'advocacy', 'body', 'stages'];

// Every condition's own real closing synthesis entry (see each condition
// file's own "-tying-together" id convention, established from the very
// first structural-parity pass) is pulled out of the pillar shelves
// entirely and shown as its own standalone card instead -- it's a real
// summary ACROSS everything else in the category, not a fit for any one
// pillar.
function isTyingTogetherEntry(entry: AnyDigestEntry): boolean {
  return entry.id.includes('tying-together');
}

// Checked in a real, deliberate priority order, validated by running this
// exact logic against all 840 real entries across the whole Digest before
// shipping (a plain Node script over the real content files, the same
// "throwaway script, inspect real groups" discipline already used to
// refine the food-name-grouping feature and Basic Health's own grouping) --
// two real misclassifications that first pass surfaced are why the order
// is what it is now, not the order first guessed at:
//
// 1. Every condition's own "-overview" entry is forced to Core Science
//    outright, before any other check -- its own title often names body
//    systems directly (MS's own overview literally says "brain and spinal
//    cord"), which would otherwise trip the Whole-Body Effects check below
//    and land the one entry meant to LEAD a category's reading order in
//    the wrong shelf entirely.
// 2. The id-based "-stages" check (pregnancy, history, staging) runs
//    BEFORE the more title-text-driven "-advocacy" check, not after --
//    this app's own "-pregnancy-..." id suffix is a deliberate, reliable
//    per-condition naming convention already established since the very
//    first structural-parity pass, and it should win over a much weaker
//    signal like the word "diagnosed" merely appearing somewhere inside a
//    pregnancy entry's own title (exactly what happened to
//    celiac-pregnancy-fertility-real-data before this reorder: its own
//    title mentions "Once Diagnosed," which the advocacy check's `diagnos`
//    term matched first under the original order, before the id's own,
//    much more intentional "pregnan" signal ever got a chance).
//
// Title/food-name text is still checked as a real fallback beyond id alone
// -- not every self-advocacy entry has "advocacy" in its own id (e.g.
// `celiac-diagnostic-panel`, `type1-autoantibody-panel`), so id-only
// matching would miss real cases a title-text check catches.
function classifyConditionPillar(entry: AnyDigestEntry): ConditionPillar {
  const id = entry.id.toLowerCase();
  if (id.endsWith('overview')) return 'science';
  const title = (isProblemFoodEntry(entry) ? entry.foodName : entry.title).toLowerCase();
  const haystack = `${id} ${title}`;
  if (/pregnan|\bhistory\b|milestone|\bstaging\b|classification/.test(haystack)) {
    return 'stages';
  }
  if (/advocacy|screening|\bscreen\b|monitoring|\btest|antibody|\bpanel\b|biopsy|diagnos|\blab\b/.test(haystack)) {
    return 'advocacy';
  }
  if (
    /organ|systemic|comorbid|extra-articular|-systems|kidney|liver|cardiac|\bbone\b|lung|\beye\b|\bskin\b|neuro|\bbrain\b|cognitive|bladder/.test(
      haystack,
    )
  ) {
    return 'body';
  }
  return 'science';
}

// Buckets a condition's own entry list into the 4 real pillars above, with
// the "tying together" synthesis entry (if the condition has one) pulled
// out separately rather than folded into any of them -- shaped
// (`{label, entries}[]`) to match exactly what BasicHealthShelves below
// already expects, the shared shelf-row-plus-detail-panel component every
// condition's own pillar grouping renders through.
function groupConditionEntries(entries: AnyDigestEntry[]): {
  pillars: { label: string; entries: AnyDigestEntry[] }[];
  tyingTogether: AnyDigestEntry | null;
} {
  const tyingTogether = entries.find(isTyingTogetherEntry) ?? null;
  const rest = entries.filter((entry) => !isTyingTogetherEntry(entry));
  const buckets = new Map<ConditionPillar, AnyDigestEntry[]>();
  for (const entry of rest) {
    const pillar = classifyConditionPillar(entry);
    if (!buckets.has(pillar)) buckets.set(pillar, []);
    buckets.get(pillar)!.push(entry);
  }
  const pillars = CONDITION_PILLAR_ORDER.map((pillar) => ({
    label: CONDITION_PILLAR_LABELS[pillar],
    entries: sortDigestEntriesLogically(buckets.get(pillar) ?? []),
  })).filter((group) => group.entries.length > 0);
  return { pillars, tyingTogether };
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
  useRegisterScreenHelp('Purple Digest', DIGEST_HELP_SECTIONS, '/purple-digest');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
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
  // The Search All lens's own COMMITTED query text -- 2026-08-08, no longer
  // written to on every keystroke (see DigestSearchInput's own comment
  // below for the real, reported keyboard-lag reason why). This is now the
  // already-debounced value, updated only once per real pause in typing.
  // Still reset whenever the tab loses/regains focus below, same as
  // `revealed`, so returning to Purple Digest never resumes a stale search.
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
  // Basic Health's own real tree position -- [] at the top-level topic
  // grid, [topicLabel] one level in, [topicLabel, subtopicLabel] two
  // levels in (only "Essential Nutrients" currently has real subtopics).
  // Reset the same way as everything else on a fresh tab visit and a fresh
  // lens selection -- landing back on Basic Health should always start at
  // its own top level, never mid-tree from a previous visit.
  const [basicHealthTopicPath, setBasicHealthTopicPath] = useState<string[]>([]);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      setSearchQuery('');
      setCategorySearchQuery('');
      setIsSearchActive(false);
      setSearchResetKey((key) => key + 1);
      setBasicHealthTopicPath([]);
      return () => {
        setRevealed(false);
        setSearchQuery('');
        setCategorySearchQuery('');
        setIsSearchActive(false);
        setSearchResetKey((key) => key + 1);
        setBasicHealthTopicPath([]);
      };
    }, []),
  );

  // Which single entry (by id) is currently expanded to its full detail,
  // within whichever category is showing -- at most one open at a time,
  // same "tap again to collapse" accordion shape as Insights' own SixDsView.
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  // Which real DigestCategoryKeys correspond to a condition the person has
  // actually told the app they have -- see CONDITION_CODE_TO_DIGEST_KEY's
  // own comment for why this needs a real lookup rather than a derived
  // transform.
  const pinnedDigestKeys = new Set(
    userConditionCodes
      .map((code) => CONDITION_CODE_TO_DIGEST_KEY[code])
      .filter((key): key is DigestCategoryKey => Boolean(key)),
  );

  // Basic Health always leads (matches Free-tier visibility and its own
  // established front-of-picker precedent), then every condition the
  // person actually has, in their own already-established build order, then
  // every remaining condition -- real, fewer taps to reach a condition
  // someone actually tracks, without hiding or removing anything else.
  const basicHealthMeta = DIGEST_CATEGORY_META.find((meta) => meta.key === 'basicHealth')!;
  const pinnedConditionMetas = DIGEST_CATEGORY_META.filter(
    (meta) => meta.key !== 'basicHealth' && pinnedDigestKeys.has(meta.key),
  );
  const otherConditionMetas = DIGEST_CATEGORY_META.filter(
    (meta) => meta.key !== 'basicHealth' && !pinnedDigestKeys.has(meta.key),
  );
  const orderedCategoryMetas = [basicHealthMeta, ...pinnedConditionMetas, ...otherConditionMetas];

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
      // A leading star marks a condition the person has actually told the
      // app they have -- a real, visible reason it's sorted to the top,
      // not just an unexplained reorder. Applied to the grid tile's own
      // label only (via LensOption.label, what the tile falls back to
      // rendering when gridLabel is unset) -- every other place this
      // name appears (the page header, the Info sheet heading,
      // activeLensLabel) reads straight from DIGEST_CATEGORY_META itself,
      // untouched by this screen-local reorder.
      label: pinnedDigestKeys.has(meta.key) && meta.key !== 'basicHealth' ? `★ ${meta.label}` : meta.label,
      gridLabel: DIGEST_GRID_LABEL_BREAKS[meta.key],
      icon: meta.icon,
      help: [DIGEST_LENS_HELP[meta.key], DIGEST_READING_HELP],
    })),
  ];

  const activeLensLabel =
    lens === 'search' ? 'Search All' : DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.label;
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
    const raw = getEntriesForCategory(lens);
    // See visibleFoodNames' own comment above -- still loading (null) means
    // show everything; once resolved, drop any relatedFoodNames-tagged
    // entry whose every real food name has since been hidden.
    if (visibleFoodNames === null) return raw;
    return raw.filter((entry) => {
      if (isProblemFoodEntry(entry) || !entry.relatedFoodNames || entry.relatedFoodNames.length === 0) return true;
      return entry.relatedFoodNames.some((name) => visibleFoodNames.has(name));
    });
  }, [lens, visibleFoodNames]);
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
  const searchResults = useMemo(() => searchDigestEntries(searchQuery), [searchQuery]);
  // The same filtered, grouped hierarchical view built for category search
  // (see the JSX below) -- pulled into its own real useMemo here, alongside
  // searchResults above, rather than left as an inline IIFE recomputed on
  // every render regardless of whether the query (or the category itself)
  // actually changed.
  const categorySearchGroups = useMemo(() => {
    const matchedIds = new Set(searchEntries(entries, categorySearchQuery).map((entry) => entry.id));
    const baseGroups =
      lens === 'basicHealth'
        ? basicHealthAllGroups(entries)
        : (() => {
            const { pillars, tyingTogether } = groupConditionEntries(entries);
            return tyingTogether ? [...pillars, { label: TYING_TOGETHER_GROUP_KEY, entries: [tyingTogether] }] : pillars;
          })();
    return baseGroups
      .map((group) => ({
        label: group.label,
        entries: group.entries.filter((entry) => matchedIds.has(entry.id)),
      }))
      .filter((group) => group.entries.length > 0);
  }, [entries, categorySearchQuery, lens]);
  const categorySearchTotalMatches = categorySearchGroups.reduce((sum, group) => sum + group.entries.length, 0);

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
  function scrollNodeIntoView(getNode: () => Measurable | null | undefined, attemptsLeft = 5) {
    requestAnimationFrame(() => {
      const targetNode = getNode();
      const scrollNode = scrollRef.current;
      if (!targetNode || !scrollNode) {
        if (attemptsLeft > 0) scrollNodeIntoView(getNode, attemptsLeft - 1);
        return;
      }
      setTimeout(() => {
        targetNode.measure((_cx, _cy, _cw, _ch, _cardPageX, cardPageY) => {
          (scrollNode as unknown as Measurable).measure((_sx, _sy, _sw, _sh, _scrollPageX, scrollPageY) => {
            const target = currentScrollY.current + (cardPageY - scrollPageY) - ENTRY_SCROLL_TOP_MARGIN;
            scrollNode.scrollTo({ y: currentScrollY.current, animated: false });
            scrollNode.scrollTo({ y: Math.max(target, 0), animated: true });
          });
        });
      }, CARD_LAYOUT_TRANSITION_MS + CARD_LAYOUT_SETTLE_BUFFER_MS);
    });
  }

  // Scrolls so a whole shelf group's own container (heading + its full
  // horizontal tab strip) lands near the top of the screen, rather than
  // just one card inside it -- see groupRefs' own comment above for why.
  function scrollGroupIntoView(label: string) {
    scrollNodeIntoView(() => groupRefs.current[label]);
  }

  // Resolves which shelf/leaf group a given entry's own card should scroll
  // to -- Basic Health resolves the entry's own real tree path (joined into
  // one string, matching the ref key BasicHealthTree's own leaf container
  // registers itself under); every real condition uses the pillar grouping
  // above, with its own "tying together" entry (if it has one) routed to
  // the fixed key that card renders under instead. 'search' never reaches
  // this (a search-result tap always resolves to a real underlying
  // category via jumpToRelated before this is called).
  function shelfGroupKeyForEntry(id: string, category: DigestCategoryKey): string {
    if (category === 'basicHealth') return basicHealthTopicPathForEntryId(id).join('::');
    const entry = findDigestEntryById(id);
    if (entry && isTyingTogetherEntry(entry)) return TYING_TOGETHER_GROUP_KEY;
    if (entry) return CONDITION_PILLAR_LABELS[classifyConditionPillar(entry)];
    return TYING_TOGETHER_GROUP_KEY;
  }

  // Expanding/collapsing a single entry, wherever it's shown -- a
  // condition's own pillar shelf, or a leaf inside Basic Health's own tree
  // (the tree's own drill-down navigation, separately, is owned by
  // BasicHealthTree itself, not this function) -- scrolls to that entry's
  // own group/leaf section, not the individual card.
  function toggleEntry(id: string, category: DigestCategoryKey) {
    const wasExpanded = expandedId === id;
    setExpandedId(wasExpanded ? null : id);
    if (wasExpanded) return;
    scrollGroupIntoView(shelfGroupKeyForEntry(id, category));
  }

  // Jumping to a related entry: switch category (if it's a different one),
  // expand that entry, and collapse whatever was open before -- a related
  // chip always lands you looking at exactly that entry, wherever it
  // actually sits. For Basic Health specifically, this also has to drive
  // the tree itself directly to the entry's own real leaf (its own topic,
  // or topic+subtopic) -- without this, the tree would still be sitting
  // wherever it was left, and the entry wouldn't be showing at all. The
  // same real function a shelf card's own tap, a Related chip, and a
  // search result (Search All or any category's own scoped search) all use.
  function jumpToRelated(id: string) {
    const target = findDigestEntryById(id);
    if (!target) return;
    const category = target.category as DigestCategoryKey;
    setLens(category);
    // A previous category's own shelf refs (Basic Health topic paths, or a
    // condition's own pillar labels -- both real, plain strings that can
    // legitimately repeat across different categories, e.g. every
    // condition has its own "Core Science" shelf) are cleared here rather
    // than left to go stale -- otherwise a leftover ref from whichever
    // category was open before could transiently point scrollGroupIntoView
    // at the WRONG category's own already-unmounted section for the one
    // frame before the new category's real shelf finishes mounting and
    // overwrites it.
    groupRefs.current = {};
    if (category === 'basicHealth') {
      setBasicHealthTopicPath(basicHealthTopicPathForEntryId(id));
    }
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
        <GatedTabContent pageTitle="Purple Digest" variant="field" revealed={revealed}>
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
                  they want to." Basic Health's own tree already has a
                  one-level-at-a-time "back" link (BasicHealthTree's own
                  onBack), and that stays exactly as it is for stepping
                  between tree levels -- this is a second, separate escape
                  hatch that always works in one tap, from any lens, at any
                  depth (a condition's pillar shelves, Search's own results,
                  or any level of Basic Health's tree).
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
              {isSearchActive ? (
                <TouchableOpacity
                  style={styles.backToHomeRow}
                  onPress={clearSearch}
                  accessibilityRole="button"
                  accessibilityLabel={`Clear search, back to ${activeLensLabel}`}
                >
                  <Text style={styles.backToHomeText}>‹ Clear search</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.backToHomeRow}
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

              <DigestSearchInput
                key={searchResetKey}
                style={styles.searchInput}
                placeholder={lens === 'search' ? 'Search the whole Digest...' : `Search within ${activeLensLabel}...`}
                onDebouncedChange={handleDebouncedSearchChange}
                onActiveChange={handleSearchActiveChange}
              />
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.body}
              contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}
              onScroll={(event) => {
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
                    <PurpleRibbonIcon size={22} color={TAB_COLOR} />
                    <Text style={styles.categoryHeaderText}>{activeLensLabel}</Text>
                  </View>
                  <Text style={styles.categoryDescription}>
                    {lens === 'search'
                      ? `Search across all ${ALL_DIGEST_ENTRIES.length} entries in this Digest at once, not just one category.`
                      : DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.description}
                  </Text>
                </View>
              )}

              {lens === 'search' ? (
                !isSearchActive ? (
                  <Text style={styles.emptyText}>
                    Type a word or phrase to search every category at once -- a mechanism, a food, an
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
                    {searchResults.map((entry) => (
                      <SearchResultCard key={entry.id} entry={entry} onPress={() => jumpToRelated(entry.id)} />
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
                // real pillar groups (plus its closing synthesis entry, if
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
                    No matches for &ldquo;{categorySearchQuery.trim()}&rdquo; in {activeLensLabel}.
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
                    />
                  </>
                )
              ) : lens === 'basicHealth' ? (
                <BasicHealthTree
                  entries={entries}
                  path={basicHealthTopicPath}
                  onDrillIn={(label) => setBasicHealthTopicPath((prev) => [...prev, label])}
                  onBack={() => setBasicHealthTopicPath((prev) => prev.slice(0, -1))}
                  expandedId={expandedId}
                  groupRefs={groupRefs}
                  onToggleEntry={(id) => toggleEntry(id, 'basicHealth')}
                  onJumpToRelated={jumpToRelated}
                />
              ) : entries.length === 0 ? (
                <Text style={styles.emptyText}>Nothing here yet.</Text>
              ) : (
                // Every real condition category -- 2026-08-08, the same
                // shelf-row-plus-detail-panel shape Basic Health's own
                // leaf level uses, grouped into 4 real pillars (see
                // groupConditionEntries' own comment above). The
                // category's own closing "tying together" synthesis, if
                // it has one, is pulled out of the shelves and shown as
                // its own standalone card below them, always visible,
                // never nested inside a pillar it doesn't really belong to.
                (() => {
                  const { pillars, tyingTogether } = groupConditionEntries(entries);
                  return (
                    <>
                      <BasicHealthShelves
                        groups={pillars}
                        expandedId={expandedId}
                        groupRefs={groupRefs}
                        onToggleEntry={(id) => toggleEntry(id, lens as DigestCategoryKey)}
                        onJumpToRelated={jumpToRelated}
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

      <PageIdentityLabel title="Purple Digest" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <LensHub
        pageTitle="Purple Digest"
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
        columns={2}
        // 2 columns, not the original 3 -- switched 2026-08-07 alongside
        // itemLabelLines below, explicitly requested: "we need to make the
        // names of the digest lenses be on two rows so they can be read, or
        // we need shorter names for them." Real category names here
        // ("Mitochondria & Metabolism", "Other Autoimmune Diseases") are
        // meaningfully longer than any other page's lens labels, and even
        // wrapped to 2 lines, 3 columns' own ~95px-wide column was still
        // too narrow for several of them not to need a 3rd line. 2 columns
        // (~142px wide) comfortably fits every real category name at 2
        // lines without shortening any of them.
        itemLabelLines={2}
        // Explicit `true`, same day, immediate follow-up: switching to 2
        // columns above defaulted Info back to its usual floating
        // bottom-right corner (LensHub's own `infoInGrid` default is
        // `columns !== 2`) -- reported directly as "gets in the way being
        // on top of the rest" once Purple Digest's own grid grew tall
        // enough to scroll (the floating-corner trick assumes that corner
        // is always blank, which stops being true the moment real content
        // scrolls underneath it). Forcing this true keeps Info as a real
        // grid tile -- right after the last category, filling the empty
        // half of the final row -- regardless of the 2-column layout.
        infoInGrid={true}
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
          setExpandedId(null);
          setSearchQuery('');
          setCategorySearchQuery('');
          setIsSearchActive(false);
          // Forces DigestSearchInput to remount with fresh, empty local
          // text -- 2026-08-08, see its own comment for why the two plain
          // setters above alone no longer reach it.
          setSearchResetKey((key2) => key2 + 1);
          // Picking Basic Health from the picker always lands on its own
          // top-level topic grid, never mid-tree from an earlier visit --
          // the same "never an instant resume of whatever was last open"
          // convention this whole screen already follows on every fresh
          // arrival at the tab.
          setBasicHealthTopicPath([]);
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
}: {
  placeholder: string;
  style: TextStyle;
  onDebouncedChange: (text: string) => void;
  onActiveChange: (active: boolean) => void;
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

  return <AppTextInput style={style} placeholder={placeholder} value={localValue} onChangeText={handleChangeText} />;
}

// A compact, unexpandable result row for the Search All lens -- tapping it
// reuses jumpToRelated (the same mechanism a Related chip already uses),
// so it lands you at the real card, in its real category, expanded and
// scrolled into view, rather than trying to render the full entry a second
// time inside the search results themselves.
function SearchResultCard({ entry, onPress }: { entry: AnyDigestEntry; onPress: () => void }) {
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
    </TouchableOpacity>
  );
}

// Basic Health's own real, 2-level tree navigation -- 2026-08-08, direct
// correction: "I think there needs to be a combination of tree style and
// categorized topic cards in related groups... moving strictly from broad
// categories down to highly specific, bite-sized pieces of information."
// Replaces Basic Health's earlier all-31-groups-shown-at-once shelf view
// entirely (BasicHealthShelves below is now used only by conditions' own
// 4-pillar grouping, not by Basic Health at all).
//
// Top level (`path` is empty): a real, scannable grid of topic cards --
// BASIC_HEALTH_TOPICS' own 10 real entries (9 standalone, plus "Essential
// Nutrients" as one single topic representing all 22 individual nutrient
// deep-dives, exactly the example given: "all of the deep dive into macro,
// micro, acid, and hormone related nutrients should be one of the topics
// to dive into"). One level in: either a real subtopic grid (only
// "Essential Nutrients" has one today) or, for every standalone topic,
// straight to the real leaf. A real leaf -- one or two levels down,
// depending on the topic -- is a plain, scannable list of that leaf's own
// entries, reusing DigestCard exactly as every other category's own
// accordion list already does ("the app dynamically generates a clean...
// list of distinct, scannable visual cards... letting the user immediately
// choose the exact type of information they want to read").
function BasicHealthTree({
  entries,
  path,
  onDrillIn,
  onBack,
  expandedId,
  groupRefs,
  onToggleEntry,
  onJumpToRelated,
}: {
  entries: AnyDigestEntry[];
  path: string[];
  onDrillIn: (label: string) => void;
  onBack: () => void;
  expandedId: string | null;
  groupRefs: MutableRefObject<Record<string, Measurable | null>>;
  onToggleEntry: (id: string) => void;
  onJumpToRelated: (id: string) => void;
}) {
  if (path.length === 0) {
    const unmatchedCount = entries.filter(
      (entry) => basicHealthTopicPathForEntryId(entry.id).length === 0,
    ).length;
    return (
      <View style={styles.topicGrid}>
        {BASIC_HEALTH_TOPICS.map((topic) => (
          <TopicCard
            key={topic.label}
            label={topic.label}
            count={
              topic.subtopics ? topic.subtopics.length : basicHealthEntriesForPrefixes(entries, topic.prefixes ?? []).length
            }
            countNoun={topic.subtopics ? 'topics' : 'entries'}
            onPress={() => onDrillIn(topic.label)}
          />
        ))}
        {/* A real, dynamic safety net -- only ever appears if a real entry
            genuinely doesn't match any known topic's own prefixes. See
            BASIC_HEALTH_MORE_TOPIC_LABEL's own comment. */}
        {unmatchedCount > 0 ? (
          <TopicCard
            label={BASIC_HEALTH_MORE_TOPIC_LABEL}
            count={unmatchedCount}
            countNoun="entries"
            onPress={() => onDrillIn(BASIC_HEALTH_MORE_TOPIC_LABEL)}
          />
        ) : null}
      </View>
    );
  }

  const topic = BASIC_HEALTH_TOPICS.find((t) => t.label === path[0]);

  // One level in, and this real topic has its own real subtopics
  // (Essential Nutrients, the only one today) -- a subtopic grid, not the
  // leaf list yet.
  if (path.length === 1 && topic?.subtopics) {
    return (
      <>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.treeBackLink}>{'‹'} Basic Health</Text>
        </TouchableOpacity>
        <Text style={styles.treeHeading}>{topic.label}</Text>
        <View style={styles.topicGrid}>
          {topic.subtopics.map((sub) => (
            <TopicCard
              key={sub.label}
              label={sub.label}
              count={basicHealthEntriesForPrefixes(entries, sub.prefixes).length}
              countNoun="entries"
              onPress={() => onDrillIn(sub.label)}
            />
          ))}
        </View>
      </>
    );
  }

  // A real leaf -- either a standalone topic with no subtopics, or one
  // specific Essential Nutrients subtopic (or the dynamic "More" bucket).
  const leafEntries = basicHealthEntriesForPath(entries, path);
  const leafKey = path.join('::');
  const backLabel = path.length === 2 ? path[0] : 'Basic Health';
  return (
    <View
      ref={(r) => {
        groupRefs.current[leafKey] = r as unknown as Measurable | null;
      }}
    >
      <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.treeBackLink}>
          {'‹'} {backLabel}
        </Text>
      </TouchableOpacity>
      <Text style={styles.treeHeading}>{path[path.length - 1]}</Text>
      {leafEntries.length === 0 ? (
        <Text style={styles.emptyText}>Nothing here yet.</Text>
      ) : (
        leafEntries.map((entry) => (
          <Animated.View key={entry.id} layout={LinearTransition.duration(CARD_LAYOUT_TRANSITION_MS)}>
            <DigestCard
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() => onToggleEntry(entry.id)}
              onJumpToRelated={onJumpToRelated}
            />
          </Animated.View>
        ))
      )}
    </View>
  );
}

function TopicCard({
  label,
  count,
  countNoun,
  onPress,
}: {
  label: string;
  count: number;
  countNoun: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.topicCard} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.topicCardTitle}>{label}</Text>
      <Text style={styles.topicCardCount}>
        {count} {countNoun}
      </Text>
    </TouchableOpacity>
  );
}

// Every real CONDITION's own grouped browsing view -- 2026-08-08, since
// Basic Health moved to its own real tree (BasicHealthTree above), this
// component is now used only for a condition's own 4-pillar grouping, not
// for Basic Health at all (its earlier, original job, before Basic Health
// outgrew a flat shelf list entirely). The per-row interaction itself was
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
// for a plain condition pillar label (Core Science, etc.), which is
// neither of these two special shapes.
function shelfGroupDisplayLabel(label: string): string {
  if (label === TYING_TOGETHER_GROUP_KEY) return 'Putting It Together';
  return label.split('::').join(' › ');
}

function BasicHealthShelves({
  groups,
  expandedId,
  groupRefs,
  onToggleEntry,
  onJumpToRelated,
}: {
  groups: { label: string; entries: AnyDigestEntry[] }[];
  expandedId: string | null;
  groupRefs: MutableRefObject<Record<string, Measurable | null>>;
  onToggleEntry: (id: string) => void;
  onJumpToRelated: (id: string) => void;
}) {
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
                this group came from the plain pillar/tree view or the new
                filtered-search view below), so it's converted to a plain,
                readable display string only here, at render time. See
                shelfGroupDisplayLabel's own comment. */}
            <Text style={styles.shelfHeading}>{shelfGroupDisplayLabel(group.label)}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shelfRow}
            >
              {group.entries.map((entry) => (
                <ShelfTabCard
                  key={entry.id}
                  entry={entry}
                  selected={expandedId === entry.id}
                  onPress={() => onToggleEntry(entry.id)}
                />
              ))}
            </ScrollView>
            {expandedEntry ? (
              <Animated.View layout={LinearTransition.duration(CARD_LAYOUT_TRANSITION_MS)} style={styles.shelfDetailPanel}>
                <DigestCard
                  entry={expandedEntry}
                  expanded
                  onToggle={() => onToggleEntry(expandedEntry.id)}
                  onJumpToRelated={onJumpToRelated}
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
function ShelfTabCard({
  entry,
  selected,
  onPress,
}: {
  entry: AnyDigestEntry;
  selected: boolean;
  onPress: () => void;
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
// through BasicHealthTree/BasicHealthShelves, both already several props
// deep. Tapping the already-active choice again clears it back to no
// opinion, the same toggle shape this app's own PopoverSelect-adjacent
// controls already use elsewhere.
function FeedbackRow({ entryId }: { entryId: string }) {
  const [value, setValue] = useState<DigestFeedbackValue | null>(null);
  useEffect(() => {
    let cancelled = false;
    getDigestFeedbackFor(entryId).then((loaded) => {
      if (!cancelled) setValue(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  const handlePress = (next: DigestFeedbackValue) => {
    const resolved = value === next ? null : next;
    setValue(resolved);
    setDigestFeedback(entryId, resolved).catch(() => {
      // A failed local write isn't worth surfacing to the person over --
      // worst case, this one tap's own preference doesn't persist; the UI
      // itself already reflects the tap either way.
    });
  };

  return (
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
  );
}

function DigestCard({
  entry,
  expanded,
  onToggle,
  onJumpToRelated,
}: {
  entry: AnyDigestEntry;
  expanded: boolean;
  onToggle: () => void;
  onJumpToRelated: (id: string) => void;
}) {
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
            <Text style={styles.detailLabel}>Real swaps</Text>
            {entry.swaps.map((swap, index) => (
              <Text key={index} style={styles.swapText}>
                {'•'} {swap}
              </Text>
            ))}
            {entry.chart ? <DigestBarChart chart={entry.chart} color={colors.accent} /> : null}
            {entry.stageNote ? <Text style={styles.stageNoteText}>{entry.stageNote}</Text> : null}
            <CitationsBlock citations={entry.citations} />
            {entry.relatedIds ? <RelatedChips ids={entry.relatedIds} onJumpToRelated={onJumpToRelated} /> : null}
            <FeedbackRow entryId={entry.id} />
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
          {entry.chart ? <DigestBarChart chart={entry.chart} color={tierColor(entry.overallTier)} /> : null}
          {entry.stageNote ? <Text style={styles.stageNoteText}>{entry.stageNote}</Text> : null}
          <CitationsBlock citations={entry.citations} />
          {entry.relatedIds ? <RelatedChips ids={entry.relatedIds} onJumpToRelated={onJumpToRelated} /> : null}
          <FeedbackRow entryId={entry.id} />
        </View>
      ) : null}
    </TouchableOpacity>
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
  // padding as bodyContent below so both areas line up, plus a real
  // bottom border marking where the fixed strip ends and the scrollable
  // area begins.
  fixedHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // The "‹ Back to Digest" escape hatch -- see its own JSX comment above
  // headerCard for what it does. Plain text, not another bordered card, so
  // it reads as a lightweight navigation control rather than competing
  // with headerCard's own real page-identity content directly below it.
  backToHomeRow: { marginBottom: 10 },
  backToHomeText: { ...typography.body, color: TAB_COLOR, fontWeight: '600' },
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
  categoryHeaderText: { ...typography.screenTitle, color: TAB_COLOR },
  categoryDescription: { ...typography.body, color: colors.textSecondary, lineHeight: 19 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  searchInput: {
    ...typography.body,
    borderWidth: 1,
    borderColor: TAB_COLOR,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  searchResultCount: { ...typography.eyebrow, color: colors.textMuted, marginBottom: 8 },
  searchResultCategory: { ...typography.caption, color: TAB_COLOR, marginBottom: 4 },
  // Basic Health's own real tree navigation -- a wrapping grid of topic
  // cards (top level and, for Essential Nutrients, one level in), plus a
  // plain back-link and heading shown once a real leaf is reached.
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  topicCard: {
    width: '47%',
    minHeight: 76,
    borderWidth: 2,
    borderColor: TAB_COLOR,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 12,
    justifyContent: 'center',
  },
  topicCardTitle: { ...typography.label, color: TAB_COLOR, fontSize: 14, marginBottom: 4 },
  topicCardCount: { ...typography.caption, color: colors.textMuted },
  treeBackLink: { ...typography.captionEmphasis, color: colors.primary, marginBottom: 10 },
  treeHeading: { ...typography.screenTitle, color: TAB_COLOR, marginBottom: 12 },
  shelfSection: { marginBottom: 18 },
  shelfHeading: { ...typography.label, color: TAB_COLOR, marginBottom: 8 },
  // Horizontal ScrollView's own contentContainerStyle -- a plain row with a
  // gap between cards and a little trailing padding so the last card in a
  // row doesn't sit flush against the screen edge once scrolled all the
  // way over.
  shelfRow: { flexDirection: 'row', gap: 10, paddingRight: 16 },
  shelfCard: {
    width: 200,
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
  shelfCardSelected: {
    borderColor: colors.accent,
    borderWidth: 3,
    backgroundColor: `${TAB_COLOR}22`,
  },
  shelfCardTitle: { ...typography.label, color: TAB_COLOR, flex: 1, fontSize: 14 },
  shelfCardTeaser: { ...typography.caption, color: colors.textSecondary, lineHeight: 16, marginTop: 4 },
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
  cardTitle: { ...typography.label, color: TAB_COLOR, flex: 1 },
  cardTeaser: { ...typography.caption, color: colors.textSecondary, lineHeight: 17 },
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
  crossConditionPillText: { ...typography.caption, color: TAB_COLOR, fontSize: 11 },
  detailLabel: { ...typography.eyebrow, color: TAB_COLOR, marginTop: 8, marginBottom: 2 },
  detailText: { ...typography.body, color: colors.textPrimary, lineHeight: 19 },
  detailTextBold: { fontWeight: '700' },
  swapText: { ...typography.body, color: colors.textPrimary, lineHeight: 19, marginTop: 2 },
  stageNoteText: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic', marginTop: 8 },
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
  citationsBlock: { marginTop: 10 },
  citationsLabel: { ...typography.eyebrow, color: TAB_COLOR, marginBottom: 2 },
  citationLink: {
    ...typography.caption,
    color: colors.primary,
    textDecorationLine: 'underline',
    lineHeight: 16,
    marginBottom: 2,
  },
  relatedBlock: { marginTop: 10 },
  relatedLabel: { ...typography.eyebrow, color: TAB_COLOR, marginBottom: 4 },
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
