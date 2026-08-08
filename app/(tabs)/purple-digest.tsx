import { useCallback, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
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

// The 'search' lens's own Info content -- kept separate from
// DIGEST_LENS_HELP (typed Record<DigestCategoryKey, HelpSection>, so
// 'search' can't be a key there without widening every other consumer of
// that type unnecessarily).
const DIGEST_SEARCH_HELP: HelpSection[] = [
  {
    heading: 'Search All',
    body: 'Searches every entry in this Digest at once, across all categories, not just the one you last had open. Matches a word anywhere it appears: a title, a food name, the full write-up, or a cited source. Tap a result to jump straight to it, wherever it actually lives.',
  },
  DIGEST_READING_HELP,
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

// Basic Health groups related entries into horizontally-scrollable rows,
// 2026-08-08, direct request: "The Basic Health information isn't very
// well organized. Please make it more organized by grouping like or
// related kinds of information in a group on one row and the next group
// on the next row and then the next row, and all of the rows move when
// being scrolled vertically but each row scrolls horizantally." Scoped to
// Basic Health specifically, matching the request -- every other
// category's own entry count (9-18) already reads fine as one flat list;
// Basic Health alone has grown past 120 entries spanning genuinely
// different topics (a glossary, food additives, food-industry history,
// fermented-food strains, nutrient interactions, lifestyle/environment,
// mitochondria/metabolism, self-advocacy, problem foods, and now a real,
// growing "Essential Nutrients" deep-dive series).
//
// Groups are derived from each entry's own id prefix, the same real,
// already-established one-prefix-per-source-file convention every
// lib/digest/*.ts file already follows (glossary-, additive-, etc.) --
// not a new field added to every entry, which would have meant touching
// hundreds of existing entry objects by hand for a purely presentational
// concern. A new prefix (a future nutrient added to essentialNutrients.ts,
// say) needs one new line added here, the same "explicit, hand-maintained
// mapping" precedent this app already uses for DIGEST_CATEGORY_META and
// CATEGORY_DISPLAY_LABELS. Order here is the real, intentional row order
// on screen, not alphabetical -- Essential Nutrients (the newest, deepest
// content) and Glossary (reached for constantly, same reasoning as its
// own front-of-picker placement) lead; Food Industry & History, more a
// history essay than a lookup tool, trails last.
const BASIC_HEALTH_GROUPS: { label: string; prefix: string }[] = [
  // 2026-08-08, placed genuinely first, ahead of even Magnesium/Vitamin D:
  // real, direct, attributed answers to "why does this app exist" and
  // "whose voice is behind this content" -- foundational framing, not one
  // more topic to browse past on the way to something else.
  { label: 'Why This App Exists', prefix: 'about-' },
  { label: 'Magnesium', prefix: 'magnesium-' },
  { label: 'Vitamin D', prefix: 'vitamind-' },
  { label: 'Iron', prefix: 'iron-' },
  { label: 'Zinc', prefix: 'zinc-' },
  { label: 'Vitamin B12', prefix: 'b12-' },
  { label: 'Folate', prefix: 'folate-' },
  { label: 'Calcium', prefix: 'calcium-' },
  { label: 'Potassium', prefix: 'potassium-' },
  { label: 'Iodine (Deep-Dive)', prefix: 'iodine-' },
  { label: 'Vitamin C', prefix: 'vitaminc-' },
  { label: 'Vitamin A', prefix: 'vitamina-' },
  { label: 'Vitamin E', prefix: 'vitamine-' },
  { label: 'Vitamin K', prefix: 'vitamink-' },
  { label: 'Omega-3 & Omega-6', prefix: 'omega' },
  { label: 'Protein & Amino Acids', prefix: 'protein-' },
  // 2026-08-08, direct request: "Finish the rest of the macronutrients,
  // micronutrients, acids, and hormones" -- the B-vitamin family, four
  // remaining trace minerals/choline, the two remaining macronutrients,
  // and the new Hormones topic, completing the Essential Nutrients series
  // this app named as its own real "next" list two sessions earlier.
  { label: 'B-Vitamins (B1, B2, B3, B5, B6, B7)', prefix: 'thiamine-' },
  { label: 'B-Vitamins (B1, B2, B3, B5, B6, B7)', prefix: 'riboflavin-' },
  { label: 'B-Vitamins (B1, B2, B3, B5, B6, B7)', prefix: 'niacin-' },
  { label: 'B-Vitamins (B1, B2, B3, B5, B6, B7)', prefix: 'biotin-' },
  { label: 'B-Vitamins (B1, B2, B3, B5, B6, B7)', prefix: 'pantothenate-' },
  { label: 'B-Vitamins (B1, B2, B3, B5, B6, B7)', prefix: 'b6-' },
  { label: 'Chromium, Manganese & Copper', prefix: 'chromium-' },
  { label: 'Chromium, Manganese & Copper', prefix: 'manganese-' },
  { label: 'Chromium, Manganese & Copper', prefix: 'copper-' },
  { label: 'Choline', prefix: 'choline-' },
  { label: 'Carbohydrates & Fiber', prefix: 'carbfiber-' },
  { label: 'Water & Hydration', prefix: 'water-' },
  { label: 'Hormones', prefix: 'hormone' },
  { label: 'Glossary', prefix: 'glossary-' },
  { label: 'Problem Foods & Swaps', prefix: 'problem-' },
  { label: 'Food Additives', prefix: 'additive-' },
  { label: 'Nutrient Interactions', prefix: 'interaction-' },
  { label: 'Fermented Foods', prefix: 'fermented-' },
  { label: 'Lifestyle & Environment', prefix: 'lifestyle-' },
  { label: 'Mitochondria & Metabolism', prefix: 'mito-' },
  { label: 'Self Advocacy', prefix: 'advocacy-' },
  { label: 'Food Industry & History', prefix: 'foodhistory-' },
];

function basicHealthGroupLabel(id: string): string {
  const match = BASIC_HEALTH_GROUPS.find((group) => id.startsWith(group.prefix));
  return match?.label ?? 'More';
}

// Buckets a category's own already-ordered entry list into real groups,
// preserving each group's own internal order exactly as it already comes
// out of getEntriesForCategory (which itself follows ALL_DIGEST_ENTRIES'
// own file-by-file spread order in lib/digest/index.ts) -- no re-sorting
// needed, since each source file's entries are already contiguous there.
// 'More', the unmatched catch-all, only appears if a real entry's id
// doesn't match any known prefix above -- a safety net, not an expected
// real bucket, so it's appended after every named group rather than
// reserved a fixed position.
//
// 2026-08-08: BASIC_HEALTH_GROUPS itself can now list several DIFFERENT
// prefixes under the SAME label (e.g. 'thiamine-'/'riboflavin-'/'niacin-'
// all sharing "B-Vitamins"), since basicHealthGroupLabel's own .find()
// only ever returns one label per prefix match, not a merge -- so `order`
// must be de-duplicated before use, or a shared label would otherwise
// produce one identical, fully-duplicated shelf row per prefix that maps
// to it (six B-Vitamins rows, not one) rather than the single real,
// merged shelf this is actually meant to render.
const order = [...new Set(BASIC_HEALTH_GROUPS.map((group) => group.label))];
function groupBasicHealthEntries(entries: AnyDigestEntry[]): { label: string; entries: AnyDigestEntry[] }[] {
  const buckets = new Map<string, AnyDigestEntry[]>();
  for (const entry of entries) {
    const label = basicHealthGroupLabel(entry.id);
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label)!.push(entry);
  }
  const orderedLabels = [...order, ...[...buckets.keys()].filter((label) => !order.includes(label))];
  return orderedLabels
    .map((label) => ({ label, entries: buckets.get(label) ?? [] }))
    .filter((group) => group.entries.length > 0);
}

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

  const [lens, setLens] = useState<PurpleDigestLens>('basicHealth');
  // The Search All lens's own live query text -- reset whenever the tab
  // loses/regains focus below, same as `revealed`, so returning to Purple
  // Digest never resumes a stale search.
  const [searchQuery, setSearchQuery] = useState('');
  // Same reset-on-focus-change pattern as Insights/Schedule/Food -- arriving
  // or re-arriving at this tab always shows the resting "pick a category"
  // prompt first, never an instant resume of whatever was last open.
  const [revealed, setRevealed] = useState(false);
  // Basic Health's own real, category-scoped search -- 2026-08-08, direct
  // request: "build a search utility for the Basic Health category before
  // moving on to the next one." Deliberately a separate query string from
  // Search All's own `searchQuery` above (not the same state reused) --
  // the two searches have genuinely different scope (this app's whole
  // Digest vs. just this one category) and can't share a single "what's
  // the user typing" value without one clobbering the other on a lens
  // switch. Reset alongside everything else on a fresh tab visit and a
  // fresh lens selection, same as searchQuery.
  const [basicHealthSearchQuery, setBasicHealthSearchQuery] = useState('');
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      setSearchQuery('');
      setBasicHealthSearchQuery('');
      return () => {
        setRevealed(false);
        setSearchQuery('');
        setBasicHealthSearchQuery('');
      };
    }, []),
  );

  // Which single entry (by id) is currently expanded to its full detail,
  // within whichever category is showing -- at most one open at a time,
  // same "tap again to collapse" accordion shape as Insights' own SixDsView.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // A real ref to each rendered card, keyed by entry id -- 2026-08-07,
  // replacing the earlier onLayout-tracked "cached offset" approach
  // entirely, per direct, explicit correction: "You seem to be trying to
  // judge their approximate location and approximate destination at the
  // time instead of just assigning something to be the mechanism... place
  // the header of this box 10 pixels from the bottom of the header of the
  // app." That's exactly right, and it's what this now does: rather than
  // trusting a Y offset computed and cached at some earlier moment (which
  // onLayout only updates asynchronously, after the fact, and which three
  // separate real bugs turned out to trace back to), scrollEntryIntoView
  // below asks each card's own real, current position directly, at the
  // exact instant it's needed -- the same thing a web page's own anchor-
  // link navigation does under the hood (query the element's real
  // position, then scroll there), not a pre-computed guess.
  const cardRefs = useRef<Record<string, Measurable | null>>({});
  // A real ref to each Basic Health GROUP's own outer container (keyed by
  // group label, not entry id) -- 2026-08-08, added alongside the shelf
  // row's own new expand-in-place redesign (see BasicHealthShelves below).
  // Scrolling now targets the whole group section, not the individual
  // tapped card, so the group's own heading and its full tab strip land
  // together near the top of the screen when a row is opened, per direct
  // correction: "The entire row that is being looked at should have each
  // of their headers at the top of the row... so I don't get lost." A
  // plain RN View already exposes the same real .measure() a card ref
  // does, so this reuses the identical scroll mechanism below, just keyed
  // differently.
  const groupRefs = useRef<Record<string, Measurable | null>>({});
  // The ScrollView's own current, live scroll position -- kept live via
  // onScroll, needed for two real reasons: converting the viewport-
  // relative measurement below into an absolute scroll target, and
  // stopping any in-flight scroll momentum before issuing a new
  // programmatic scroll (see scrollEntryIntoView's own comment). Plain
  // ref, not state, so onScroll firing repeatedly during a manual drag
  // doesn't itself force a re-render.
  const currentScrollY = useRef(0);

  const LENSES: LensOption<PurpleDigestLens>[] = [
    // Placed first, same reasoning Glossary's own front placement already
    // established (see DIGEST_CATEGORY_META's own comment on that entry) --
    // a cross-category tool reached for constantly, not a category read
    // start to finish, belongs at the front of the picker, not appended
    // after every real category.
    {
      key: 'search',
      label: 'Search All',
      icon: 'search-outline',
      help: DIGEST_SEARCH_HELP,
    },
    ...DIGEST_CATEGORY_META.map((meta) => ({
      key: meta.key,
      label: meta.label,
      gridLabel: DIGEST_GRID_LABEL_BREAKS[meta.key],
      icon: meta.icon,
      help: [DIGEST_LENS_HELP[meta.key], DIGEST_READING_HELP],
    })),
  ];

  const activeLensLabel =
    lens === 'search' ? 'Search All' : DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.label;
  // Plain, original category order -- no reordering. See cardOffsets' own
  // comment above for why (a real correction of an earlier "move the
  // expanded card to the front of the list" approach).
  const entries = lens === 'search' ? [] : getEntriesForCategory(lens);
  // Recomputed on every keystroke -- a plain in-memory scan over a few
  // hundred entries (see searchDigestEntries's own comment, lib/digest/
  // index.ts), cheap enough that no debounce is needed for this to feel
  // instant.
  const searchResults = useMemo(() => searchDigestEntries(searchQuery), [searchQuery]);

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

  function scrollEntryIntoView(id: string) {
    scrollNodeIntoView(() => cardRefs.current[id]);
  }

  // Scrolls so a whole Basic Health group's own container (heading + its
  // full horizontal tab strip) lands near the top of the screen, rather
  // than just the one tapped card -- see groupRefs' own comment above for
  // why.
  function scrollGroupIntoView(label: string) {
    scrollNodeIntoView(() => groupRefs.current[label]);
  }

  // Expanding/collapsing a single entry, wherever it's shown -- the flat,
  // one-category-at-a-time list every non-Basic-Health category still
  // uses, or a Basic Health shelf row's own tab strip (see
  // BasicHealthShelves below, which calls this same function). `category`
  // decides which of the two real scroll targets above applies: Basic
  // Health scrolls to the whole group section it belongs to; every other
  // category scrolls to the card itself, unchanged from before.
  function toggleEntry(id: string, category: DigestCategoryKey) {
    const wasExpanded = expandedId === id;
    setExpandedId(wasExpanded ? null : id);
    if (wasExpanded) return;
    if (category === 'basicHealth') {
      scrollGroupIntoView(basicHealthGroupLabel(id));
    } else {
      scrollEntryIntoView(id);
    }
  }

  // Jumping to a related entry: switch category (if it's a different one),
  // expand that entry, and collapse whatever was open before -- a related
  // chip always lands you looking at exactly that entry, scrolled into
  // view, at wherever it actually sits in its own category's real
  // (unreordered) list, or, for Basic Health specifically, at wherever its
  // own group section sits. The same real function a Basic Health shelf
  // card's own tap, a Related chip, and a search result (both Search All's
  // and Basic Health's own scoped search) all use.
  function jumpToRelated(id: string) {
    const target = findDigestEntryById(id);
    if (!target) return;
    const category = target.category as DigestCategoryKey;
    setLens(category);
    // Jumping into Basic Health always lands on the grouped shelf view --
    // there's no separate "list mode" to switch into anymore -- and a
    // search-in-progress (either Search All or Basic Health's own scoped
    // search) is cleared, since the person just told us exactly what they
    // wanted by tapping a real result.
    setSearchQuery('');
    setBasicHealthSearchQuery('');
    setExpandedId(id);
    if (category === 'basicHealth') {
      scrollGroupIntoView(basicHealthGroupLabel(id));
    } else {
      scrollEntryIntoView(id);
    }
  }

  return (
    <View style={styles.screen}>
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Purple Digest" variant="field" revealed={revealed}>
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
                caption over open sky. */}
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

            {lens === 'search' ? (
              <>
                <AppTextInput
                  style={styles.searchInput}
                  placeholder="Search titles, findings, mechanisms, sources..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.trim().length === 0 ? (
                  <Text style={styles.emptyText}>
                    Type a word or phrase to search every category at once -- a mechanism, a food, an
                    author&apos;s name, anything this Digest actually says somewhere.
                  </Text>
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
                )}
              </>
            ) : lens === 'basicHealth' ? (
              <>
                <AppTextInput
                  style={styles.searchInput}
                  placeholder="Search within Basic Health..."
                  value={basicHealthSearchQuery}
                  onChangeText={setBasicHealthSearchQuery}
                />
                {basicHealthSearchQuery.trim().length > 0 ? (
                  (() => {
                    const basicHealthResults = searchEntries(entries, basicHealthSearchQuery);
                    return basicHealthResults.length === 0 ? (
                      <Text style={styles.emptyText}>
                        No matches for &ldquo;{basicHealthSearchQuery.trim()}&rdquo; in Basic Health.
                      </Text>
                    ) : (
                      <>
                        <Text style={styles.searchResultCount}>
                          {basicHealthResults.length} match{basicHealthResults.length === 1 ? '' : 'es'}
                        </Text>
                        {basicHealthResults.map((entry) => (
                          <SearchResultCard key={entry.id} entry={entry} onPress={() => jumpToRelated(entry.id)} />
                        ))}
                      </>
                    );
                  })()
                ) : (
                  <BasicHealthShelves
                    groups={groupBasicHealthEntries(entries)}
                    expandedId={expandedId}
                    groupRefs={groupRefs}
                    onToggleEntry={(id) => toggleEntry(id, 'basicHealth')}
                    onJumpToRelated={jumpToRelated}
                  />
                )}
              </>
            ) : entries.length === 0 ? (
              <Text style={styles.emptyText}>Nothing here yet.</Text>
            ) : (
              entries.map((entry) => (
                <Animated.View
                  key={entry.id}
                  // Explicit duration, not Reanimated's own implicit
                  // default -- CARD_LAYOUT_TRANSITION_MS above (see
                  // scrollEntryIntoView's own comment) has to wait out this
                  // exact real number, not a guess at what the default
                  // might be.
                  layout={LinearTransition.duration(CARD_LAYOUT_TRANSITION_MS)}
                  // A real ref to this card, not a cached measurement --
                  // scrollEntryIntoView calls .measure() on it directly, at
                  // the moment it's needed, rather than trusting a value
                  // recorded earlier. Reanimated's Animated.View forwards
                  // refs to the underlying native view, so this exposes the
                  // same real .measure() every plain View has.
                  ref={(r) => {
                    cardRefs.current[entry.id] = r as unknown as Measurable | null;
                  }}
                >
                  <DigestCard
                    entry={entry}
                    expanded={expandedId === entry.id}
                    onToggle={() => toggleEntry(entry.id, entry.category as DigestCategoryKey)}
                    onJumpToRelated={jumpToRelated}
                  />
                </Animated.View>
              ))
            )}
          </ScrollView>
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
        autoOpenSignal={autoOpenLensHub}
        onSelect={(key) => {
          setLens(key);
          setExpandedId(null);
          setBasicHealthSearchQuery('');
          setRevealed(true);
        }}
      />
    </View>
  );
}

function categoryLabelForEntry(entry: AnyDigestEntry): string {
  return DIGEST_CATEGORY_META.find((meta) => meta.key === entry.category)?.label ?? entry.category;
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

// Basic Health's own real, grouped browsing view -- see BASIC_HEALTH_GROUPS'
// own comment above for the original grouping reasoning. The per-row
// interaction itself was rebuilt 2026-08-08, direct correction after the
// first version (tapping a card jumped clean out of the shelf view into a
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
            <Text style={styles.shelfHeading}>{group.label}</Text>
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
            <Text style={styles.detailLabel}>The problem</Text>
            <Text style={styles.detailText}>{entry.problem}</Text>
            <Text style={styles.detailLabel}>The mechanism</Text>
            <Text style={styles.detailText}>{entry.mechanism}</Text>
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
          <Text style={styles.detailText}>{entry.summary}</Text>
          {entry.chart ? <DigestBarChart chart={entry.chart} color={tierColor(entry.overallTier)} /> : null}
          {entry.stageNote ? <Text style={styles.stageNoteText}>{entry.stageNote}</Text> : null}
          <CitationsBlock citations={entry.citations} />
          {entry.relatedIds ? <RelatedChips ids={entry.relatedIds} onJumpToRelated={onJumpToRelated} /> : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  detailLabel: { ...typography.eyebrow, color: TAB_COLOR, marginTop: 8, marginBottom: 2 },
  detailText: { ...typography.body, color: colors.textPrimary, lineHeight: 19 },
  swapText: { ...typography.body, color: colors.textPrimary, lineHeight: 19, marginTop: 2 },
  stageNoteText: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic', marginTop: 8 },
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
    maxWidth: 220,
  },
  relatedChipText: { ...typography.captionEmphasis, color: colors.primary },
});
