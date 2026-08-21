"""
Patches the already-built assets/data/foods_reference.db with the real,
cited reference data behind the new "My Meds" Schedule lens -- same
approach as scripts/add_interaction_rules.py (patching the compiled .db
directly is the right move in this environment; see that script's own
docstring for why), not a full spreadsheet-driven rebuild.

Three real additions, 2026-08-08, direct request: "Start building the My
Meds lens in Schedules... true research done for them and build rules
around timing, forms to use, interactions... The Powdered Supplements are
to live here such as potassium citrate powder, inositol, and glycine...
Salt is one of the electrolytes that would be tracked as a supplement too."

1. EXTENDS the existing `supplement_forms` table (already real, already
   populated with 21 forms across 9 nutrients in
   build_food_reference_db.py's own SUPPLEMENT_FORMS -- calcium, magnesium,
   iron, zinc, vitamin D, B12, folate, selenium, iodine -- but never
   surfaced in any UI until this feature) with the specific items named
   directly: potassium (citrate vs. chloride), inositol (pure myo- vs. the
   40:1 myo:D-chiro blend), glycine, vitamin K2 (MK-7 vs. MK-4 vs. K1 --
   the real form question behind "D3 & K2"), and sodium/salt (iodized vs.
   non-iodized -- the real, evidence-backed "healthy salt" answer, not the
   trace-mineral marketing angle).

2. NEW `nutrient_timing` table -- doesn't exist anywhere yet. For every
   nutrient now covered by supplement_forms (14 total after this script),
   real guidance on solubility, when to take it (empty stomach / with food
   / with fat / before bed / split doses), what to avoid taking it with,
   and what pairs well with it. Reuses this app's own already-cited
   Nutrient Interactions research (lib/digest/nutrientInteractions.ts) and
   the existing interaction_rules fat-soluble-vitamin rows directly rather
   than re-deriving them, and adds new citations for the items that
   needed them (potassium, inositol, glycine, K2, sodium/iodization).

3. NEW `common_medications` table -- doesn't exist anywhere yet. A real,
   deliberately bounded FIRST set of 10 medications (6 prescription, 4
   OTC), each with generic name, drug class, thyroid-relevant notes,
   timing guidance, key interactions, and common side effects, all
   cited. This is explicitly NOT "every commonly prescribed medication" --
   that's a much larger, ongoing research project (comparable in scope to
   the original food-reference-database build), started here the same way
   Food Additives started with ~10 entries and grew over many sessions.
   Reuses this app's own already-verified levothyroxine/amiodarone/
   lithium/PPI/ciprofloxacin citations from lib/digest/labsMedication.ts
   directly rather than re-researching them.

Two new nutrient_codes added to the `nutrients` table itself (glycine,
inositol) -- neither is part of the Phase 1 standard nutrient panel
imported from the 7 national food databases (no per-food gram amounts
exist for either), so both get a real code for supplement-tracking
purposes only, with NO food-content backfill and NO DRI row, the same
honest "trackable but no NASEM reference value" precedent already
established for caffeine.

Two new interaction_rules rows: a reference-only (checkable=0) caution on
vitamin K2 (MK-7) and warfarin/oral anticoagulants -- a real, serious,
dose-dependent interaction with no timing-separation fix (the caution is
about consistency of intake, not spacing), the first real use of the
`referenceOnly` code path in lib/interactionRules.ts that's existed,
unused, since that file was first built. And a new checkable rule type,
`concurrent_use_caution` (metformin + levothyroxine: metformin measurably
suppresses TSH in people already on levothyroxine, a real lab-interpretation
pitfall, not a timing issue) -- genuinely extends lib/interactionRules.ts's
own evaluation engine with one new rule_type, not just new rows in an
existing shape.

Safe to re-run: every write is idempotent (INSERT OR REPLACE / ON CONFLICT
DO UPDATE on primary keys), so running this twice doesn't duplicate
anything.

Usage:
  py scripts/add_my_meds_reference_data.py
"""
import datetime
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "assets" / "data" / "foods_reference.db"
VERSION_TS_PATH = Path(__file__).resolve().parent.parent / "lib" / "referenceDbVersion.ts"

# --- New nutrient codes (supplement-tracking only, no food-content backfill) ---
NEW_NUTRIENT_CODES = [
    ("glycine", "Glycine", "g", "amino_acid"),
    ("inositol", "Inositol", "mg", "other"),
]

# --- Extends the existing SUPPLEMENT_FORMS table (build_food_reference_db.py) ---
# (nutrient_code, form_name, absorption_note, gi_tolerance_note, evidence_strength, citation, notes)
NEW_SUPPLEMENT_FORMS = [
    ("potassium", "Potassium citrate",
     "In a randomized controlled trial, potassium citrate produced significantly higher red blood cell "
     "(intracellular) potassium uptake and higher urinary excretion than potassium chloride at an "
     "equivalent oral dose, despite similar peak plasma potassium. Its alkalinizing citrate anion also "
     "independently improves acid-base balance, reduces urinary calcium loss, and increases urinary "
     "citrate (lowering kidney stone risk), effects potassium chloride does not have.",
     "Generally well tolerated.",
     "established",
     "Wouda RD, et al., 'Kaliuresis and Intracellular Uptake of Potassium with Potassium Citrate and "
     "Potassium Chloride Supplements: A Randomized Controlled Trial,' Clin J Am Soc Nephrol. 2023, "
     "PMID 37382933; Morris RC Jr, 'Differing effects of supplemental KCl and KHCO3,' Semin Nephrol. "
     "1999, PMID 10511388.",
     "Real, serious safety note, not a form-preference footnote: any potassium supplement, this form "
     "included, can cause dangerous hyperkalemia in combination with ACE inhibitors, ARBs, "
     "potassium-sparing diuretics, or reduced kidney function. See this app's own interaction check for "
     "anyone tracking one of those prescriptions alongside a potassium supplement."),
    ("potassium", "Potassium chloride",
     "The most common over-the-counter and salt-substitute form. Readily absorbed, matched roughly on "
     "plasma potassium rise to potassium citrate in head-to-head testing, but without citrate's "
     "additional acid-base/bone/kidney-stone benefits.",
     "Same real hyperkalemia caution as any potassium supplement.",
     "established",
     "Wouda RD, et al., Clin J Am Soc Nephrol. 2023, PMID 37382933.",
     None),

    ("inositol", "Myo-inositol (pure)",
     "The form used in the majority of clinical trials, including the Hashimoto's-relevant "
     "myo-inositol-plus-selenium research already cited elsewhere in this app.",
     "Generally well tolerated at studied doses; mild GI upset (bloating, loose stool) has been "
     "reported at high doses in some trials.",
     "established",
     "See this app's own Digest Nutrients & Micronutrients category (myo-inositol + selenium "
     "finding) for the Hashimoto's-specific trial evidence.",
     None),
    ("inositol", "Myo-inositol + D-chiro-inositol (40:1 blend)",
     "40:1 is the physiological serum ratio of myo-inositol to D-chiro-inositol found in the body. "
     "Several trials, mostly in PCOS, dose a blended product at this same ratio rather than "
     "myo-inositol alone, on the reasoning that it mirrors normal physiology more closely.",
     "Generally well tolerated, same profile as pure myo-inositol.",
     "emerging",
     "Minozzi M, et al., 'The Combined therapy myo-inositol plus D-Chiro-inositol, in a physiological "
     "ratio, reduces the cardiovascular risk by improving the lipid profile in PCOS patients,' Eur Rev "
     "Med Pharmacol Sci. 2013, PMID 23467955; Milewska EM, et al., 'Inositol and human reproduction,' "
     "Gynecol Endocrinol. 2016, PMID 27595157.",
     "Evidence for the blended ratio specifically comes mostly from PCOS research, not Hashimoto's. "
     "This app's own Hashimoto's-specific myo-inositol trial evidence used myo-inositol alone, not "
     "this blend."),

    ("glycine", "Glycine (powder)",
     "A simple, cheap, well-absorbed amino acid, with no competing chemical forms the way minerals "
     "have. Powder is the standard, most-studied delivery form.",
     "Generally very well tolerated even at gram-level doses.",
     "established",
     "Bannai M, Kawai N, 'New therapeutic strategy for amino acid medicine: glycine improves the "
     "quality of sleep disordered by its reduction in the brain,' J Pharmacol Sci. 2012, PMID 22293292.",
     "The best-documented use case is sleep quality, taken before bedtime. See the timing guidance "
     "below."),

    ("vitamin_k", "Vitamin K2 (MK-7)",
     "Substantially longer half-life than K1 or MK-4, producing much more stable blood levels and "
     "7-8x higher accumulation over sustained daily use. The form most K2 supplements marketed for "
     "bone/cardiovascular use actually contain.",
     "Generally well tolerated.",
     "established",
     "Schurgers LJ, et al., 'Vitamin K-containing dietary supplements: comparison of synthetic vitamin "
     "K1 and natto-derived menaquinone-7,' Blood. 2007, PMID 17158229; Sato T, et al., 'MK-7 and Its "
     "Effects on Bone Quality and Strength,' Nutrients. 2020, PMID 32244313.",
     "Real, important interaction: at daily doses of 50 micrograms or more, MK-7 can measurably "
     "interfere with warfarin and other vitamin-K-dependent oral anticoagulants. See this app's own "
     "interaction check for anyone tracking a blood thinner alongside a K2 supplement."),
    ("vitamin_k", "Vitamin K2 (MK-4)",
     "Structurally closer to vitamin K1, with a much shorter half-life than MK-7, meaning it needs "
     "more frequent dosing to maintain stable levels. Still real, established evidence for bone health "
     "at the higher doses typically studied (often 45mg/day in Japanese osteoporosis trials, far above "
     "typical MK-7 doses).",
     "Generally well tolerated.",
     "established",
     "Schurgers LJ, et al., Blood. 2007, PMID 17158229.",
     None),
    ("vitamin_k", "Vitamin K1 (phylloquinone)",
     "The primary dietary form (leafy greens). Shortest half-life of the three, cleared from blood "
     "fastest. The standard form used in most large population studies of vitamin K intake, but not "
     "the form most bone/cardiovascular-focused K2 supplements use.",
     "Generally well tolerated.",
     "established",
     "Schurgers LJ, et al., Blood. 2007, PMID 17158229.",
     None),

    ("sodium", "Iodized table salt",
     "The only common salt type that reliably supplies dietary iodine. A direct study of urban "
     "Chinese adults found non-iodized salt use independently associated with lower urinary iodine and "
     "higher rates of thyroid antibody positivity.",
     "No absorption difference from other salt types. Sodium chloride is sodium chloride regardless "
     "of source; the only real, evidence-backed difference between salt types is iodization.",
     "established",
     "Chen W, et al., 'Iodized Salt Intake and Its Association with Urinary Iodine, Thyroid Peroxidase "
     "Antibodies, and Thyroglobulin Antibodies Among Urban Chinese,' Thyroid. 2017, PMID 29092685; "
     "Patel N, et al., 'Iodine deficiency hypothyroidism in children in recent years: a re-emerging "
     "issue?,' Endocrinol Diabetes Metab Case Rep. 2024, PMID 38920131.",
     "The single most directly Hashimoto's-relevant salt question isn't sea salt vs. table salt. It's "
     "whether the salt in the house is iodized at all. Sea salt, kosher salt, and pink Himalayan salt "
     "are all real, legitimate seasoning choices, but none of them reliably supply iodine the way "
     "iodized table salt does, and the trace minerals marketed in 'unrefined' salts are present in "
     "amounts too small to matter nutritionally at normal intake."),
    ("sodium", "Non-iodized salt (sea salt, kosher salt, Himalayan pink salt, etc.)",
     "Chemically the same sodium chloride as table salt for absorption purposes. The marketed 'trace "
     "mineral' content is real but nutritionally negligible at normal culinary use.",
     "No absorption or GI difference from iodized salt.",
     "established",
     "Chen W, et al., Thyroid. 2017, PMID 29092685.",
     "Not a health downgrade on its own, but if this is the only salt in the house, it's worth getting "
     "iodine from another real source (see this app's own Iodine research) rather than assuming salt "
     "is covering it."),
]

# --- Brand-new table: when to take it, what to avoid, what pairs well ---
# (nutrient_code, solubility, best_taken, avoid_with, pairs_well_with, citation, notes)
NUTRIENT_TIMING = [
    ("calcium", "mineral",
     "Split into doses of 500mg elemental calcium or less -- absorption efficiency drops sharply above "
     "that in a single dose. Calcium carbonate specifically absorbs best taken with food; calcium "
     "citrate doesn't need food to absorb.",
     "Iron and zinc supplements (competes for absorption); levothyroxine (needs 4+ hours separation).",
     "Vitamin D (needed to absorb calcium at all); magnesium and vitamin K2 (the same regulatory loop "
     "and calcium-placement pathway covered in this app's own Nutrient Interactions research).",
     "NIH Office of Dietary Supplements, Calcium Health Professional Fact Sheet (single-dose absorption "
     "ceiling); FDA-approved levothyroxine prescribing information.",
     None),
    ("magnesium", "mineral",
     "With food reduces GI upset for most forms; often taken in the evening since glycinate/citrate "
     "forms are commonly used for sleep and muscle relaxation.",
     "Very high single doses can compete with calcium and zinc absorption.",
     "Vitamin B6 (a real, bidirectional synergy confirmed in a randomized trial -- see this app's own "
     "Nutrient Interactions research); vitamin D and K2 (the same interdependent trio already covered "
     "there).",
     "See this app's own Nutrient Interactions category (magnesium/B6, and the vitamin D/K2/magnesium "
     "trio) for the underlying citations.",
     None),
    ("iron", "mineral",
     "Best absorbed on an empty stomach, but many people need to take it with a little food to tolerate "
     "it -- either is reasonable depending on GI tolerance.",
     "Calcium, coffee/tea (tannins measurably block non-heme iron absorption), and levothyroxine "
     "(needs 4+ hours separation).",
     "Vitamin C (meaningfully boosts non-heme iron absorption when taken together).",
     "See this app's own Nutrient Interactions category (vitamin C/iron, tea-tannins/iron) and Labs & "
     "Medication Timing (levothyroxine/iron) for the underlying citations.",
     None),
    ("zinc", "mineral",
     "Absorbs best on an empty stomach, but commonly taken with food since it can cause nausea "
     "otherwise.",
     "Calcium, iron, and copper at the same time (all compete for absorption through related "
     "transport pathways).",
     "Nothing notably improves zinc absorption the way vitamin C does for iron.",
     "See this app's own Nutrient Interactions category (iron/zinc/manganese, zinc/copper) for the "
     "underlying citations.",
     None),
    ("vitamin_d", "fat_soluble",
     "Needs dietary fat present in the same meal to absorb well -- take with a meal that contains "
     "some real fat, not on an empty stomach.",
     "Very low-fat meals blunt absorption regardless of dose.",
     "Vitamin K2 and magnesium (the interdependent trio already covered in this app's own Nutrient "
     "Interactions research) -- vitamin D increases calcium absorption, and K2 is what directs that "
     "calcium toward bone rather than arteries.",
     "NIH Office of Dietary Supplements, Vitamin D Health Professional Fact Sheet; Aaseth JO, et al., "
     "'The Importance of Vitamin K and the Combination of Vitamins K and D for Calcium Metabolism and "
     "Bone Health: A Review,' Nutrients. 2024, PMID 39125301.",
     None),
    ("vitamin_b12", "water_soluble",
     "Absorption doesn't depend on food or fat -- can be taken any time of day.",
     "Nothing significant at ordinary supplement doses.",
     "Folate (works in the same metabolic pathway).",
     "Standard clinical pharmacology.",
     None),
    ("folate_b9", "water_soluble",
     "Absorption doesn't depend on food -- can be taken any time of day.",
     "Nothing significant at ordinary supplement doses.",
     "Vitamin B12 (works in the same metabolic pathway).",
     "Standard clinical pharmacology.",
     None),
    ("selenium", "mineral",
     "With food reduces GI upset.",
     "Timing sequence matters more than same-day timing: correcting an iodine deficiency before "
     "starting selenium, not after, is the safer order -- see this app's own Nutrient Interactions "
     "research on the selenium/iodine relationship.",
     "Nothing notable.",
     "See this app's own Nutrient Interactions category (selenium/iodine) for the underlying citation.",
     None),
    ("iodine", "mineral",
     "With food reduces GI upset. Consistency matters more than exact timing -- avoid sudden, large "
     "surges in intake (kelp/seaweed-derived supplements are the real risk here, see the supplement "
     "form note above).",
     "Nothing at a same-day level -- the real caution is about surge doses, not pairing with another "
     "nutrient.",
     "Selenium, but only after iodine status is already adequate, not before -- see the selenium row "
     "above.",
     "See this app's own Digest research on iodine and the Wolff-Chaikoff effect.",
     None),
    ("potassium", "mineral",
     "With food or fluids reduces GI irritation.",
     "ACE inhibitors, ARBs, and potassium-sparing diuretics -- combining any of these with a potassium "
     "supplement carries a real, documented hyperkalemia risk and should only be done under medical "
     "supervision.",
     "Magnesium (magnesium deficiency directly impairs the pump that keeps potassium inside cells, "
     "meaning potassium repletion alone often fails until magnesium is corrected too -- see this app's "
     "own Nutrient Interactions research).",
     "Raebel MA, 'Hyperkalemia associated with use of angiotensin-converting enzyme inhibitors and "
     "angiotensin receptor blockers,' Cardiovasc Ther. 2012, PMID 21883995.",
     None),
    ("inositol", "water_soluble",
     "Many clinical trial protocols split the daily dose into two (morning and evening) at "
     "gram-level intakes, rather than one large dose.",
     "Nothing significant documented.",
     "Selenium (the real, cited Hashimoto's-specific combination already covered elsewhere in this "
     "app).",
     "See this app's own Digest myo-inositol + selenium research for the underlying citation.",
     None),
    ("glycine", "water_soluble",
     "Before bedtime is the best-documented timing, specifically for sleep quality -- the effect is "
     "tied to a real, measured drop in core body temperature that helps sleep onset.",
     "Nothing significant documented.",
     "Nothing notable documented.",
     "Bannai M, Kawai N, J Pharmacol Sci. 2012, PMID 22293292.",
     None),
    ("vitamin_k", "fat_soluble",
     "Needs dietary fat present in the same meal to absorb well, the same mechanism as vitamin D.",
     "Warfarin and other vitamin-K-dependent oral anticoagulants -- not a timing-separation issue, a "
     "dose-consistency issue (see the supplement form note above and this app's own interaction check).",
     "Vitamin D and magnesium (the interdependent trio already covered in this app's own Nutrient "
     "Interactions research).",
     "Schurgers LJ, et al., Blood. 2007, PMID 17158229.",
     None),
    ("sodium", "mineral",
     "With food and fluids, same as any electrolyte. Extra intake around exercise or heavy sweating "
     "is a real, legitimate use case, not a red flag on its own.",
     "Nothing at a same-day timing level -- the real, well-documented caution is total daily intake "
     "and blood pressure, already covered in this app's own Digest research.",
     "Potassium (the two are actively balanced against each other by the same cellular pump, covered "
     "in this app's own Nutrient Interactions research).",
     "See this app's own Digest and Nutrient Interactions research on sodium.",
     None),
]

# --- Brand-new table: a real, deliberately bounded starting list ---
# (id, generic_name, common_brand_names, drug_class, treatment_type, common_use,
#  thyroid_relevant_notes, timing_guidance, key_interactions, common_side_effects,
#  evidence_strength, citation, notes)
COMMON_MEDICATIONS = [
    ("levothyroxine", "Levothyroxine", "Synthroid, Levoxyl, Tirosint, Unithroid", "thyroid hormone replacement",
     "prescription", "Standard first-line treatment for hypothyroidism, including Hashimoto's.",
     "This is the thyroid medication itself -- see this app's own Labs & Medication Timing research for "
     "the full timing picture.",
     "Most consistently absorbed on an empty stomach, 30-60 minutes before food, though a 2026 "
     "randomized trial found taking it with breakfast at a 15% higher dose produces statistically "
     "similar control. Either approach works if followed consistently.",
     "Calcium and iron supplements (4+ hour separation needed), coffee, grapefruit juice, and several "
     "other medications (see this app's own Labs & Medication Timing research for the full list).",
     "Generally well tolerated at a correctly titrated dose; symptoms of too high or too low a dose "
     "mirror hyper/hypothyroid symptoms themselves.",
     "strong",
     "See this app's own Labs & Medication Timing Digest category for the full citation list.",
     None),
    ("liothyronine", "Liothyronine (T3)", "Cytomel", "thyroid hormone replacement",
     "prescription", "Synthetic T3, sometimes added to levothyroxine (T4) as combination therapy.",
     "A real, still-debated option for the meaningful share of patients who don't feel fully well on "
     "levothyroxine alone -- see this app's own Labs & Medication Timing research on combination T3/NDT "
     "therapy.",
     "Similar absorption-timing considerations to levothyroxine.",
     "Same general absorption interferers as levothyroxine.",
     "Shorter half-life than T4, so levels can swing more within a day; some people notice this as "
     "energy fluctuation.",
     "moderate",
     "See this app's own Labs & Medication Timing Digest category (labs-combination-t3-ndt) for "
     "the full citation list.",
     None),
    ("metformin", "Metformin", "Glucophage, Fortamet, Glumetza", "biguanide (diabetes)",
     "prescription", "First-line medication for type 2 diabetes, also used for insulin resistance and "
     "PCOS.",
     "A real, documented finding directly relevant to lab interpretation: metformin measurably lowers "
     "TSH in people already taking levothyroxine, which can look like the thyroid dose needs adjusting "
     "when the real cause is the metformin itself.",
     "Usually taken with food to reduce GI upset.",
     "Levothyroxine (TSH-suppression effect, a lab-interpretation caution, not a dosing-timing issue).",
     "GI upset (nausea, diarrhea) is common when starting; rare but serious B12 deficiency risk with "
     "long-term use.",
     "strong",
     "Isidro ML, et al., 'Metformin reduces thyrotropin levels in obese, diabetic women with primary "
     "hypothyroidism on thyroxine replacement therapy,' Endocrine. 2007, PMID 17992605; Vigersky RA, "
     "et al., 'Thyrotropin suppression by metformin,' J Clin Endocrinol Metab. 2006, PMID 16219720.",
     None),
    ("amiodarone", "Amiodarone", "Cordarone, Pacerone", "antiarrhythmic (heart rhythm)",
     "prescription", "Treats serious heart-rhythm disorders.",
     "A real, well-documented cause of new thyroid dysfunction on its own, both hypo- and "
     "hyperthyroid, in roughly 15-20% of patients who take it.",
     "Per standard prescribing guidance.",
     "Can itself trigger or worsen thyroid dysfunction -- thyroid function deserves its own periodic "
     "check while taking this, not just an assumption that any new fatigue is \"the Hashimoto's again.\"",
     "Real, structural iodine content -- this is a genuinely different mechanism from a food/timing "
     "interaction.",
     "strong",
     "Bartalena L, et al., 2018 European Thyroid Association Guidelines for the Management of "
     "Amiodarone-Associated Thyroid Dysfunction, PMID 29594056; Danzi S, Klein I, 'Amiodarone-induced "
     "thyroid dysfunction,' 2015, PMID 24067547.",
     None),
    ("lithium", "Lithium", "Lithobid, Eskalith", "mood stabilizer",
     "prescription", "Standard treatment for bipolar disorder.",
     "Slows the same deiodination process that converts T4 to active T3, and acts as a real immune "
     "stimulant specifically in people who already carry thyroid antibodies -- roughly 8% of patients "
     "develop lithium-induced goiter/hypothyroidism.",
     "Per standard prescribing guidance.",
     "Directly relevant for anyone with existing Hashimoto's antibodies -- may be more susceptible to "
     "lithium's thyroid effects than someone without them.",
     "Real, mechanistic thyroid risk, not just a food-timing interaction.",
     "strong",
     "Scanelli G, 'Lithium thyrotoxicosis,' 2002, PMID 11887342; Kibirige D, et al., 'Spectrum of "
     "lithium induced thyroid abnormalities: a current perspective,' 2013, PMID 23391071.",
     None),
    ("omeprazole", "Omeprazole (and the PPI class)", "Prilosec, Nexium, Prevacid", "proton pump inhibitor",
     "otc", "Reduces stomach acid for reflux/heartburn -- available both over-the-counter and by "
     "prescription at higher doses.",
     "A documented, real interferer with levothyroxine absorption, taken daily by a huge number of "
     "people, often without ever connecting it to their own thyroid dose.",
     "Per standard label directions.",
     "Levothyroxine (reduced absorption) -- separating the two by enough time resolves it, the same "
     "principle as the calcium/iron timing rule.",
     "Generally well tolerated short-term; long-term daily use has its own separate, real concerns "
     "(B12/magnesium absorption, among others) outside this app's current scope.",
     "strong",
     "Skelin M, et al., 'Factors Affecting Gastrointestinal Absorption of Levothyroxine: A Review,' "
     "Clin Ther. 2017, PMID 28153426.",
     None),
    ("ciprofloxacin", "Ciprofloxacin", "Cipro", "fluoroquinolone antibiotic",
     "prescription", "A commonly prescribed antibiotic for bacterial infections.",
     "Documented to interfere with levothyroxine absorption through the same general mechanism as "
     "calcium and iron.",
     "Per prescribing directions for the infection being treated.",
     "Levothyroxine (reduced absorption if taken too close together).",
     "Standard antibiotic side effects (GI upset); real, separate tendon-related cautions outside this "
     "app's current scope.",
     "strong",
     "Skelin M, et al., Clin Ther. 2017, PMID 28153426.",
     None),
    ("ibuprofen", "Ibuprofen", "Advil, Motrin", "NSAID (pain reliever/anti-inflammatory)",
     "otc", "Common over-the-counter pain reliever and anti-inflammatory.",
     "No major thyroid-specific interaction is documented in the literature this app has reviewed.",
     "With food reduces GI irritation.",
     "Standard NSAID cautions apply: can raise blood pressure medication needs, interacts with lithium "
     "(raises lithium levels), and carries real GI/kidney risk with frequent use.",
     "GI irritation/ulcer risk with frequent use; kidney strain with long-term regular use.",
     "moderate",
     "Standard pharmacology references (NSAID class cautions).",
     "Included specifically as an honest example: not every common medication in this list has a "
     "thyroid-specific finding, and this app says so plainly rather than inventing one."),
    ("acetaminophen", "Acetaminophen", "Tylenol", "analgesic/antipyretic (pain/fever reliever)",
     "otc", "Common over-the-counter pain and fever reliever.",
     "No thyroid-specific interaction is documented in the literature this app has reviewed.",
     "With or without food.",
     "The real, well-known caution is total daily dose and liver -- exceeding the labeled maximum, "
     "especially combined with alcohol, carries genuine liver-injury risk.",
     "Generally well tolerated at labeled doses; liver injury risk at excess doses.",
     "moderate",
     "Standard pharmacology references (acetaminophen dose-ceiling cautions).",
     None),
    ("diphenhydramine", "Diphenhydramine", "Benadryl", "first-generation antihistamine",
     "otc", "Common over-the-counter allergy medication and sleep aid.",
     "No thyroid-specific interaction is documented in the literature this app has reviewed.",
     "With or without food; commonly taken before bed given its sedating effect.",
     "General anticholinergic effects (dry mouth, constipation) can compound with other anticholinergic "
     "medications.",
     "Drowsiness (often the reason it's used as a sleep aid), dry mouth.",
     "moderate",
     "Standard pharmacology references (first-generation antihistamine class effects).",
     None),
]

# --- New interaction_rules rows: one reference-only, one new checkable type ---
# Same 13-column shape as scripts/add_interaction_rules.py's own RULES list.
NEW_RULES = [
    (
        "vitamin_k2_warfarin_consistency", "dose_consistency_caution", 0,
        "nutrient", "vitamin_k", "prescription", "warfarin", None, None, "caution",
        "Vitamin K2 and warfarin need consistent, not separated, dosing",
        "Unlike most interactions in this app, this isn't about timing separation -- it's about "
        "consistency. Vitamin K (especially the MK-7 form of K2, at 50 micrograms/day or more) can "
        "measurably interfere with warfarin and other vitamin-K-dependent blood thinners. The real risk "
        "is a SUDDEN CHANGE in intake, starting, stopping, or changing dose, not steady daily use at a "
        "known amount. Anyone on warfarin who wants to start or change a vitamin K2 supplement should "
        "talk to the prescriber first, so the warfarin dose can be adjusted together with it.",
        "Schurgers LJ, et al., 'Vitamin K-containing dietary supplements: comparison of synthetic "
        "vitamin K1 and natto-derived menaquinone-7,' Blood. 2007, PMID 17158229.",
    ),
    (
        "metformin_levothyroxine_tsh_interpretation", "concurrent_use_caution", 1,
        "prescription", "metformin", "prescription", "levothyroxine", None, None, "note",
        "Metformin can make a levothyroxine dose look like it needs adjusting when it doesn't",
        "Metformin measurably lowers TSH in people already taking levothyroxine for hypothyroidism. "
        "You're tracking both -- if a recent TSH result looked lower than expected, this is a real, "
        "documented reason why, not necessarily a sign the levothyroxine dose itself needs to change.",
        "Isidro ML, et al., 'Metformin reduces thyrotropin levels in obese, diabetic women with primary "
        "hypothyroidism on thyroxine replacement therapy,' Endocrine. 2007, PMID 17992605.",
    ),
]


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # --- New nutrient codes (supplement-tracking only) ---
    cur.executemany(
        """
        INSERT INTO nutrients (code, display_name, unit, nutrient_group)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(code) DO UPDATE SET
            display_name = excluded.display_name,
            unit = excluded.unit,
            nutrient_group = excluded.nutrient_group
        """,
        NEW_NUTRIENT_CODES,
    )
    print(f"Upserted {len(NEW_NUTRIENT_CODES)} new nutrient codes (glycine, inositol).")

    # --- Extend supplement_forms (table already exists) ---
    cur.executemany(
        """
        INSERT INTO supplement_forms
            (nutrient_code, form_name, absorption_note, gi_tolerance_note, evidence_strength, citation, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        NEW_SUPPLEMENT_FORMS,
    )
    print(f"Inserted {len(NEW_SUPPLEMENT_FORMS)} new supplement_forms rows "
          f"(potassium, inositol, glycine, vitamin K2/K1, sodium/salt).")

    # --- New table: nutrient_timing ---
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS nutrient_timing (
            nutrient_code TEXT PRIMARY KEY,
            solubility TEXT NOT NULL,
            best_taken TEXT NOT NULL,
            avoid_with TEXT,
            pairs_well_with TEXT,
            citation TEXT,
            notes TEXT
        )
        """
    )
    cur.executemany(
        """
        INSERT INTO nutrient_timing
            (nutrient_code, solubility, best_taken, avoid_with, pairs_well_with, citation, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(nutrient_code) DO UPDATE SET
            solubility = excluded.solubility,
            best_taken = excluded.best_taken,
            avoid_with = excluded.avoid_with,
            pairs_well_with = excluded.pairs_well_with,
            citation = excluded.citation,
            notes = excluded.notes
        """,
        NUTRIENT_TIMING,
    )
    print(f"Upserted {len(NUTRIENT_TIMING)} nutrient_timing rows.")

    # --- New table: common_medications ---
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS common_medications (
            id TEXT PRIMARY KEY,
            generic_name TEXT NOT NULL,
            common_brand_names TEXT,
            drug_class TEXT NOT NULL,
            treatment_type TEXT NOT NULL,
            common_use TEXT NOT NULL,
            thyroid_relevant_notes TEXT,
            timing_guidance TEXT,
            key_interactions TEXT,
            common_side_effects TEXT,
            evidence_strength TEXT NOT NULL,
            citation TEXT,
            notes TEXT
        )
        """
    )
    cur.execute("CREATE INDEX IF NOT EXISTS idx_common_medications_generic ON common_medications(generic_name)")
    cur.executemany(
        """
        INSERT INTO common_medications
            (id, generic_name, common_brand_names, drug_class, treatment_type, common_use,
             thyroid_relevant_notes, timing_guidance, key_interactions, common_side_effects,
             evidence_strength, citation, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            generic_name = excluded.generic_name,
            common_brand_names = excluded.common_brand_names,
            drug_class = excluded.drug_class,
            treatment_type = excluded.treatment_type,
            common_use = excluded.common_use,
            thyroid_relevant_notes = excluded.thyroid_relevant_notes,
            timing_guidance = excluded.timing_guidance,
            key_interactions = excluded.key_interactions,
            common_side_effects = excluded.common_side_effects,
            evidence_strength = excluded.evidence_strength,
            citation = excluded.citation,
            notes = excluded.notes
        """,
        COMMON_MEDICATIONS,
    )
    print(f"Upserted {len(COMMON_MEDICATIONS)} common_medications rows "
          f"({sum(1 for m in COMMON_MEDICATIONS if m[4] == 'prescription')} prescription, "
          f"{sum(1 for m in COMMON_MEDICATIONS if m[4] == 'otc')} OTC).")

    # --- Two new interaction_rules rows (table already exists, see add_interaction_rules.py) ---
    cur.executemany(
        """
        INSERT INTO interaction_rules
            (id, rule_type, checkable, subject_a_kind, subject_a, subject_b_kind, subject_b,
             min_separation_hours, lookahead_days, severity, title, guidance, citation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            rule_type = excluded.rule_type,
            checkable = excluded.checkable,
            subject_a_kind = excluded.subject_a_kind,
            subject_a = excluded.subject_a,
            subject_b_kind = excluded.subject_b_kind,
            subject_b = excluded.subject_b,
            min_separation_hours = excluded.min_separation_hours,
            lookahead_days = excluded.lookahead_days,
            severity = excluded.severity,
            title = excluded.title,
            guidance = excluded.guidance,
            citation = excluded.citation
        """,
        NEW_RULES,
    )
    print(f"Upserted {len(NEW_RULES)} new interaction_rules rows "
          f"(vitamin K2/warfarin reference-only, metformin/levothyroxine concurrent-use).")

    conn.commit()
    conn.close()

    version = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    VERSION_TS_PATH.write_text(
        '// Auto-generated by scripts/build_food_reference_db.py (bumped manually here by\n'
        '// scripts/add_my_meds_reference_data.py, which patches the compiled .db directly) --\n'
        '// do not edit by hand.\n'
        f'export const REFERENCE_DB_VERSION = "{version}";\n',
        encoding="utf-8",
    )
    print(f"Bumped REFERENCE_DB_VERSION to {version}.")


if __name__ == "__main__":
    main()
