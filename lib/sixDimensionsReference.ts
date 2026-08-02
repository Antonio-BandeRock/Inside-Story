// Shared reference data/logic for the D1-D6 Hashimoto's scoring rubric and
// the Nutrients status vocabulary -- used by the Insights tab (Nutrients /
// 6 Dimensions / Cooking & Prep). Moved out of the Meals screen once "Meal
// Insights" grew from a small popup flyout into its own full tab: this
// content belongs with whatever screen actually renders it, not with the
// meal builder.
import type { DailyDimensionItemBreakdown, DailyDimensionScore, FoodScore } from './db';

export const NUTRIENT_STATUS_LABELS: Record<string, string> = {
  deficient: 'Well short of target',
  low: 'Below target',
  adequate: 'On target',
  excess_risk: 'Above the safe upper limit',
  within_limit: 'Within the recommended ceiling',
};

export type PrepTip = {
  subCriterion: string;
  tier: string;
  instruction: string;
};

// Cooking & Prep Tips deliberately only surfaces a sub-criterion when it
// carries a real, actionable preparation instruction -- not a general
// definition, and not shown at all when the real answer is "no action
// needed" (that's a rating, not a tip, and belongs in the 6 Dimensions tab
// instead). Each case below is gated on the specific tier where cooking or
// prep genuinely changes the outcome (confirmed against real tier values in
// the database, not assumed), with instruction text grounded in the same
// citations already on file in SUB_CRITERION_SOURCES for that
// sub-criterion. Extend this function, not a flat sub-criterion list, as
// more actionable cases turn up, since the gating condition and the real
// citation behind it differ per sub-criterion.
export function selectPrepTips(scores: FoodScore[]): PrepTip[] {
  const tips: PrepTip[] = [];

  // Oxalate Tolerance Note's own tier value already IS the full
  // instruction ("boil and discard the cooking water...") for High/Very
  // High Oxalate Level foods -- nothing to compose, just surface it as-is.
  const oxalateLevel = scores.find((score) => score.subCriterion === 'Oxalate Level')?.tier;
  if (oxalateLevel === 'High' || oxalateLevel === 'Very High') {
    const note = scores.find((score) => score.subCriterion === 'Oxalate Tolerance Note');
    if (note) {
      tips.push({ subCriterion: 'Oxalate', tier: oxalateLevel, instruction: note.tier });
    }
  }

  // Raw cruciferous/goitrogenic vegetables interfere with thyroid iodine
  // uptake; cooking deactivates ~90% of that effect (Felker, Bunch & Leung,
  // Nutr Rev. 2016;74(4):248-58, PMID 26946249 -- same citation already in
  // SUB_CRITERION_SOURCES['Goitrogenic Load']). Nothing to flag once it's
  // actually been cooked (tier reads 'Minimal (Cooked)' at that point).
  const goitrogenicLoad = scores.find((score) => score.subCriterion === 'Goitrogenic Load');
  if (goitrogenicLoad?.tier === 'Goitrogenic (Raw)') {
    tips.push({
      subCriterion: 'Goitrogenic Load',
      tier: goitrogenicLoad.tier,
      instruction:
        'Raw, this food contains goitrogens that can interfere with thyroid iodine uptake. Cooking it -- ' +
        'boiling, steaming, or roasting -- deactivates roughly 90% of that effect, so cook it rather than ' +
        'eating it raw where you can.',
    });
  }

  // Legume lectins (e.g. phytohemagglutinin in raw/undercooked kidney
  // beans) are heat-labile but not uniformly so -- a quick rinse isn't
  // enough, they need a real soak-and-boil (PMID 21374488, same citation
  // already in SUB_CRITERION_SOURCES['Lectins (Legumes)']).
  const lectins = scores.find((score) => score.subCriterion === 'Lectins (Legumes)');
  if (lectins?.tier === 'High Risk' || lectins?.tier === 'Mild Risk') {
    tips.push({
      subCriterion: 'Lectins (Legumes)',
      tier: lectins.tier,
      instruction:
        "Raw or undercooked, this legume's lectins can irritate the gut. A quick rinse doesn't deactivate " +
        'them -- soak thoroughly, then boil (not just simmer) for the full cooking time before eating.',
    });
  }

  return tips;
}

// Reconstructs a single item's FoodScore[] from its DailyDimensionScore[]
// shape (entries always length 1 at the item level, since it's just that
// one food) -- lets the item level of the daily Cooking & Prep breakdown
// reuse selectPrepTips exactly as-is, rather than duplicating its logic.
export function flattenItemScores(item: DailyDimensionItemBreakdown): FoodScore[] {
  return item.bySubCriterion.map((score) => ({
    dimension: score.dimension,
    subCriterion: score.subCriterion,
    tier: score.entries[0]?.tier ?? '',
  }));
}

// Groups a set of D1-D6 scores under their real dimension heading.
export function groupDailyScoresByDimension(scores: DailyDimensionScore[]) {
  const groups = new Map<string, DailyDimensionScore[]>();
  const order: string[] = [];

  for (const score of scores) {
    if (!groups.has(score.dimension)) {
      groups.set(score.dimension, []);
      order.push(score.dimension);
    }
    groups.get(score.dimension)!.push(score);
  }

  return order.map((dimension) => ({ dimension, items: groups.get(dimension)! }));
}

// Plain-language definitions for the recurring tier words used across all
// 31 sub-criteria (checked against the real distinct tier vocabulary in the
// database, not guessed). Looked up by stripping any parenthetical
// qualifier first (e.g. "Supportive (Cross-Source Estimate)" -> base word
// "Supportive"), then a qualifier note is appended separately if one
// matches -- see TIER_QUALIFIER_NOTES below. "Not Assessed" specifically
// means no credible, citable source could be matched for this food and
// factor -- confirmed against the Oxalate Tolerance Note's own explicit
// wording ("not scored rather than guessed... simply unknown"), not the
// same as the food being safe/neutral for that factor.
const TIER_DEFINITIONS: Record<string, string> = {
  Ideal: 'This food provides an amount of this nutrient in the range considered optimal, based on cited research.',
  Supportive: 'This food supports a healthy outcome for this factor, based on cited research.',
  Neutral: "This food doesn't meaningfully help or hurt this factor.",
  Goitrogenic:
    'Goitrogens are compounds that can interfere with thyroid iodine uptake. Cooking substantially reduces this effect for most foods in this category.',
  Minimal: 'Only a small, generally low-concern amount of this factor remains.',
  'Not Assessed':
    'No credible, citable research data could be matched to this specific food for this factor. This means the data is unavailable -- not that the food is safe or neutral for it.',
  'Use Carefully': 'This food may need portion awareness or a doctor’s guidance for this factor.',
  'Excess Risk': 'Consuming a lot of this food could push this factor above a healthy range.',
  'Mild Risk': 'This food carries a modest, generally minor concern for this factor.',
  'High Risk': 'This food carries a significant, well-documented concern for this factor.',
  Disruptive: 'This food may work against or interfere with this factor.',
  Low: 'This food is low in relation to this factor.',
  Moderate: 'This food is moderate in relation to this factor.',
  High: 'This food is high in relation to this factor.',
  'Very High': 'This food is very high in relation to this factor -- the highest tier used.',
  Safe: 'This food falls within a range generally considered safe for this factor.',
  Inhibiting: 'This food may reduce or block this factor.',
  Enhancing: 'This food may improve or boost this factor.',
  Imbalanced: 'This food skews unfavorably in the ratio this factor measures.',
  'Gluten-Free': 'This food does not naturally contain gluten.',
  'None Detected': 'No amount of this factor was detected in testing.',
  Present: 'A measurable amount of this factor is present in this food.',
};

const TIER_QUALIFIER_NOTES: { pattern: RegExp; note: string }[] = [
  {
    pattern: /Cross-Source Estimate/i,
    note: 'This specific food wasn’t directly tested for this factor -- the value shown is estimated from closely related foods that were, rather than measured directly.',
  },
  {
    pattern: /Preliminary/i,
    note: 'The research behind this factor is still emerging, not yet as well-established as other cited factors in this database.',
  },
  {
    pattern: /\(Raw\)/i,
    note: 'This rating applies to the food in its raw/uncooked state.',
  },
  {
    pattern: /\(Cooked\)/i,
    note: 'This rating applies to the food after cooking.',
  },
  {
    pattern: /Fortified/i,
    note: 'This value reflects iron added during processing/fortification, not naturally occurring in the food.',
  },
  {
    pattern: /Natural \(Ruminant\)/i,
    note: 'This trans fat occurs naturally in the digestion process of ruminant animals (cattle, sheep, etc.) and is treated differently from industrially-produced trans fat.',
  },
];

export function getTierDefinition(tier: string): string {
  const baseWord = tier.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const base = TIER_DEFINITIONS[baseWord] ?? TIER_DEFINITIONS[tier];
  const qualifier = TIER_QUALIFIER_NOTES.find(({ pattern }) => pattern.test(tier))?.note;

  if (base && qualifier) {
    return `${base} ${qualifier}`;
  }

  return base ?? qualifier ?? 'No further definition is available yet for this specific rating.';
}

// Real green/yellow/red severity for every tier word actually used across
// all 31 sub-criteria (checked against the real distinct tier vocabulary
// in the database via a direct query, not guessed -- see
// scripts/add_interaction_rules.py-style verification discipline used
// elsewhere in this app). 'unknown' is deliberately its own, non-judgment
// state, not folded into green: "Not Assessed" means this app has no
// credible, citable data for that food/factor, which is not the same
// thing as "this is fine" -- see TIER_DEFINITIONS['Not Assessed'] above.
// Qualifiers in parentheses (e.g. "Supportive (Cross-Source Estimate)",
// "Goitrogenic (Raw)") are stripped to their base word before lookup, the
// same way getTierDefinition already does -- matching on the raw string
// instead (the previous approach here) silently mis-classified several
// real tiers, since e.g. "Supportive (Cross-Source Estimate)" is a
// genuinely different string from "Supportive".
export type TierSeverity = 'green' | 'yellow' | 'red' | 'unknown';

// Actively good, or a low/absent amount of something only concerning at a
// higher level.
const GREEN_TIERS = new Set([
  'Neutral',
  'Ideal',
  'Supportive',
  'Minimal',
  'Low',
  'Safe',
  'Gluten-Free',
  'None Detected',
  'Enhancing',
  'Protective',
  'Fortified',
]);

// A real but moderate concern -- worth knowing about, not an alarm.
const YELLOW_TIERS = new Set(['Use Carefully', 'Mild Risk', 'Moderate', 'Disruptive', 'Inhibiting', 'Imbalanced', 'Natural']);

// A significant, well-documented concern -- anything Hashimoto's-specific
// (Goitrogenic, i.e. thyroid iodine-uptake interference), anything at the
// top of a severity scale (High/Very High/Excess Risk/High Risk),
// confirmed gluten content (the Gluten sub-criterion's own "High Risk"
// tier), confirmed industrial trans fat ("Present"), and active
// inflammatory potential.
const RED_TIERS = new Set(['Excess Risk', 'High Risk', 'High', 'Very High', 'Goitrogenic', 'Inflammatory', 'Present']);

export function tierSeverity(tier: string): TierSeverity {
  // Oxalate Tolerance Note stores a full instruction sentence as its own
  // "tier" value (see selectPrepTips above) rather than a short tier word
  // -- matched by its own distinctive opening phrase instead of the
  // word-based lookup below.
  if (tier.startsWith('No real, cited oxalate')) return 'unknown';
  if (tier.startsWith('Low oxalate')) return 'green';
  if (tier.startsWith('Moderate oxalate')) return 'yellow';
  if (tier.startsWith('Elevated oxalate')) return 'yellow';
  if (tier.startsWith('High oxalate')) return 'red';

  if (tier === 'Not Assessed') return 'unknown';

  const baseWord = tier.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (GREEN_TIERS.has(baseWord)) return 'green';
  if (YELLOW_TIERS.has(baseWord)) return 'yellow';
  if (RED_TIERS.has(baseWord)) return 'red';
  return 'unknown';
}

// A tier is "flagged" (worth a glance) when it's a real yellow or red
// concern -- used to compute the compact per-dimension scorecard summary.
// 'unknown' (Not Assessed) deliberately does not count as flagged: there's
// nothing actionable to flag about a food this app simply has no data for.
export function isFlaggedTier(tier: string): boolean {
  const severity = tierSeverity(tier);
  return severity === 'yellow' || severity === 'red';
}

// Real methodology/citations behind each D1-D6 sub-criterion's rating
// logic -- extracted from this project's own ChangeLog sheet (in the
// master spreadsheet, never previously surfaced anywhere in the app),
// distilled from its build-history prose into 1-3 sentences per
// sub-criterion. Nothing here is invented: a sub-criterion with no
// specific named citation in that history (e.g. Gluten, Lectins, Fat
// Processing -- built as definitional/compositional rules rather than
// from one external study) is deliberately left out rather than backfilled
// with a plausible-sounding guess; getSubCriterionSources' fallback covers
// those honestly. Extend this dict as more of the ChangeLog gets mined or
// as new sub-criteria get their own cited build entry.
const SUB_CRITERION_SOURCES: Record<string, string> = {
  Selenium:
    'RDA reference: 55mcg/day (NIH Office of Dietary Supplements). "Ideal" = ≥20% RDA per 100g, matching the FDA’s definition of an "excellent source" nutrient claim (21 CFR 101.54).',
  Iodine:
    'RDA reference: 150mcg/day, UL 1,100mcg/day (NIH ODS). Same ≥20% RDA "Ideal" threshold (FDA 21 CFR 101.54). USDA measures no real iodine data at all -- where shown, "(Cross-Source Estimate)" values are real measurements borrowed from an identical food in one of this database’s other 6 national sources, never invented.',
  Zinc:
    'RDA reference: 8mg/day -- the women’s RDA specifically (NIH ODS), chosen because Hashimoto’s has a well-documented 7:1-10:1 female-to-male prevalence (StatPearls/NCBI Bookshelf NBK459262). "Ideal" = ≥20% RDA per 100g (FDA 21 CFR 101.54).',
  'Iron (contextual)':
    'RDA reference: 18mg/day, the women’s RDA (NIH ODS), same female-prevalence rationale (NBK459262). Refined-grain products crossing the "Ideal" line are labeled "Fortified (Added Iron)" instead, since that iron mostly comes from FDA-mandated flour enrichment (21 CFR 137) and is non-heme, materially less bioavailable than the heme iron in meat/poultry/fish (2-20% vs 15-35% absorbed -- Hurrell & Egli, Am J Clin Nutr 2010, PMID 20200263).',
  'Vitamin D':
    'RDA reference: 15mcg (600 IU)/day, UL 100mcg (4,000 IU), ages 19-70 (NIH ODS Vitamin D Health Professional Fact Sheet). Hashimoto’s-relevant: a 2022 systematic review (PMC9275446, "Association Between Vitamin D Deficiency and Autoimmune Thyroid Disorder") found vitamin D deficiency/insufficiency associated with higher rates of autoimmune thyroid disease generally -- the review itself discloses every included study was observational and calls for RCTs to confirm causation; it does not specifically measure TPO/Tg antibody titers, a correction from an earlier overstatement.',
  'Goitrogenic Load':
    'Raw cruciferous (Brassicaceae) vegetables contain glucosinolates that break down into thiocyanates/goitrin, competing with thyroid iodine uptake; cooking deactivates the enzyme responsible (roughly a 90% effect reduction). Source: Felker, Bunch & Leung, "Concentrations of thiocyanate and goitrin in human plasma...", Nutr Rev. 2016;74(4):248-58, PMID 26946249 (corrected from a misrecorded 26946251, which is an unrelated paper) -- also notes meaningful interference generally requires large intakes plus pre-existing iodine insufficiency.',
  Nightshades:
    'Solanaceae-family foods (tomato, potato, eggplant, peppers, etc.) contain solanine/capsaicin/tomatine alkaloids. The Autoimmune Protocol excludes this family based on a hypothesized gut-permeability mechanism (Ballantyne, "The Paleo Approach," Victory Belt Publishing -- cover-dated 2013, widely catalogued as 2014) -- scored "Mild Risk" rather than "High Risk" since the human evidence is mechanistic/elimination-diet-based, not established double-blind RCT causation.',
  'Antibody Triggers':
    'Iodine intake (from water/salt, not seaweed specifically) linked to progression to autoimmune thyroiditis in those with baseline TPO/Tg elevation: Teng et al., "Effect of Iodine Intake on Thyroid Diseases in China," N Engl J Med. 2006;354(26):2783-93 -- a correction from an earlier version of this note that mischaracterized it as a seaweed-specific study; high-iodine seaweed/kelp-supplement case reports are real but a weaker evidence tier than this cohort study. Gluten cross-referenced via Krysiak et al. 2019, Exp Clin Endocrinol Diabetes -- a small pilot study (34 women), gluten-free diet reduced TPOAb/TgAb titers. For vegetables specifically: tubers found protective (Ji et al. 2026, Front Endocrinol 17:1890093, OR 0.75); soy genistein reduced antibody titers in a double-blind RCT (Zhang et al. 2017, Immunobiology 222(2):183-187, PMID 27729167) -- explicitly noted as a concentrated pharmacological dose, not an ordinary serving.',
  Sodium:
    'UK Food Standards Agency’s published front-of-pack "traffic light" per-100g thresholds (food.gov.uk). Autoimmune-relevant citation: Wu et al., Nature 2013 -- dietary salt driving pathogenic Th17 autoimmune activity.',
  Sugar:
    'UK Food Standards Agency’s published front-of-pack per-100g sugar thresholds (food.gov.uk). Citation: Della Corte et al., Nutrients 2018 -- dietary sugar linked to inflammatory biomarkers.',
  Additives:
    'Named compounds only, each with its own citation: nitrite/nitrate curing (IARC/WHO Monograph Vol. 114, 2018 -- processed meat classified a Group 1 carcinogen via the nitrosamine mechanism); emulsifiers CMC/polysorbate-80/carrageenan (Chassaing et al. 2015, Nature, PMID 25731162); sulfites (FDA-mandated allergen declaration, 21 CFR 101.100); artificial dyes (McCann et al. 2007, Lancet). MSG is deliberately not flagged -- FDA and EFSA both maintain its GRAS/safe status.',
  Processing: 'NOVA ultra-processed food classification (Monteiro et al. 2019, Public Health Nutrition).',
  'Saturated Fat':
    'UK Food Standards Agency per-100g thresholds (food.gov.uk). Hashimoto’s-relevant citation: Rizos, Elisaf & Liberopoulos, Open Cardiovasc Med J. 2011;5:76-84 (PMID 21660244) -- hypothyroid states linked to unfavorable lipid profiles.',
  'Trans Fat':
    'FDA’s determination that partially hydrogenated oils are not "Generally Recognized as Safe" at any level: 80 FR 34650 (June 2015, the original determination -- corrected from a misrecorded 83 FR 23358, which is actually a later 2018 compliance-date notice, not the determination itself), reaffirmed in 83 FR 23382 (2018). Naturally-occurring ruminant trans fat (beef/lamb/dairy) is labeled separately from industrial trans fat, since only industrial isomers are linked to CHD risk (Gebauer et al., "Effects of Ruminant trans Fatty Acids on Cardiovascular Disease and Cancer," Adv Nutr. 2011;2(4):332-354).',
  'Omega-3 vs 6':
    'Computed from real measured EPA/DHA/ALA/linoleic-acid values (6 of 7 sources -- Japan_MEXT has no per-fatty-acid breakdown and is honestly Not Assessed) against Simopoulos 2002’s cited 1:1-4:1 optimal omega-6:omega-3 ratio.',
  'Selenium & Zn synergy':
    'Selenium powers the deiodinase enzymes that convert inactive T4 into active T3; zinc is structurally required for the nuclear thyroid hormone receptor to function. Clinical RCT: Mahmoodianfard et al., "Effects of Zinc and Selenium Supplementation on Thyroid Function in Overweight and Obese Hypothyroid Female Patients: A Randomized Double-Blind Controlled Trial," J Am Coll Nutr. 2015;34(5):391-399 (n=68) -- combined supplementation significantly improved FT4/FT3/TSH versus placebo.',
  'Iron Presence':
    'Thyroid peroxidase (TPO), the enzyme that catalyzes thyroid hormone synthesis, is itself a heme (iron-containing) enzyme. Source: Hess, Zimmermann, Arnold, Langhans & Hurrell, "Iron deficiency anemia reduces thyroid peroxidase activity in rats," J Nutr. 2002;132(7):1951-5, PMID 12097675 -- TPO activity fell 33-56% in iron-deficient animals versus controls.',
  Fermentability:
    'Monash University’s own published High/Low FODMAP food list and methodology (a portion-size-dependent traffic light, not a strict yes/no).',
  'Microbiome Effects':
    'Real cited prebiotic-fiber content: Van Loo et al., "On the presence of inulin and oligofructose as natural ingredients in the Western diet," Crit Rev Food Sci Nutr. 1995;35:525-52, and Franck, "Technological functionality of inulin and oligofructose," Br J Nutr. 2002;87(Suppl 2):S287-91 (chicory root, Jerusalem artichoke, leek, asparagus, garlic, onion, banana, wheat bran); Milani et al., "Extraction of inulin from Burdock root (Arctium lappa) using high intensity ultrasound," Int J Food Sci Technol. 2011;46:1699-1704 (burdock root); plus real fermented-food identity (kefir, kimchi, sauerkraut, miso, tempeh, kombucha, natto, live-culture yogurt).',
  'Oxalate Level':
    'Oxalosis and Hyperoxaluria Foundation (OHF), 2024 oxalate list -- direct PDF, the actual data table, not the site’s own gateway page (that page is just navigation tiles with no data of its own, confirmed directly, an earlier mistake in this citation): https://ohf.org/wp-content/uploads/2024/02/Oxalate-List-022724.pdf (OHF is a real 501(c)(3) since 1989, the largest private funder of hyperoxaluria research; their own list is a compiled secondary source, not original lab testing -- OHF says as much themselves). Wake Forest University Baptist Medical Center Urology’s own oxalate list: https://www.wakehealth.edu/-/media/wakeforest/clinical/files/urology/oxalate-food-list.pdf (a smaller, older list, used here to cross-check the subset of foods it shares with OHF, not as a second citation behind every food -- most individual foods here, including sweet potato and broccoli, are sourced from OHF alone, since neither is in Wake Forest’s own shorter list). Reported oxalate content genuinely varies a lot study to study, for any food, from any source -- a peer-reviewed comparison (Chai & Liebman, "Food Oxalate: Factors Affecting Measurement, Biological Variation, and Bioavailability," J Am Diet Assoc. 2005;105(2):297-307, PMID 15668690) found broccoli reported anywhere from 0.3 to 13mg/100g and wheat bran from 58 to 524mg/100g across different published sources, and found Harvard’s own oxalate database and NDSR nutrition software disagreed substantially across 536 foods compared head to head. That variance is a known limitation of this whole field, not a flaw specific to either source cited here.',
  'Oxalate Load Rank': 'Same sourcing as Oxalate Level -- see that entry for the real, linked citations and the honest note on cross-study measurement variance.',
  'Mineral Binding Risk': 'Same sourcing as Oxalate Level -- see that entry for the real, linked citations and the honest note on cross-study measurement variance.',
  'Oxalate Tolerance Note': 'Same sourcing as Oxalate Level -- see that entry for the real, linked citations and the honest note on cross-study measurement variance.',
  Gluten:
    'Gluten is linked to autoimmune thyroid disease via three real mechanisms: gut dysbiosis, intestinal permeability ("leaky gut") from zonulin release, and molecular cross-reactivity between anti-tissue-transglutaminase antibodies and thyroid tissue transglutaminase. Source: "The Role of Gluten in the Development of Autoimmune Thyroid Diseases: A Narrative Review," Int J Endocrinol Metab. 2024;22(3). Oats are excluded from the "safe" grain list since they are commonly wheat-cross-contaminated per celiac clinical guidance.',
  'Lectins (Legumes)':
    'Legume lectins (e.g. phytohemagglutinin in raw/undercooked kidney beans) are heat-labile but not uniformly so -- some require extended soak-and-boil times, not just a quick rinse, to fully deactivate (Assessment of Lectin Inactivation by Heat and Digestion, PMID 21374488). A 2025 study found phytohemagglutinin can still measurably disrupt intestinal barrier function via heat-shock-protein interference (PMC12278180) -- disclosed here as real but still-emerging mechanistic evidence, not a large clinical trial.',
  Soy:
    'Soy isoflavones (genistein, daidzein) can inhibit thyroid peroxidase and compete with iodine uptake in lab settings, but a 2006 narrative review of 14 clinical trials found neither soy nor isoflavones affect thyroid function in euthyroid people ("Goitrogenic and estrogenic activity of soy isoflavones," PMID 12060828; "Update on genistein and thyroid: an overall message of safety," PMC3459182). The real risk is concentrated in people with marginal iodine intake or pre-existing thyroid disease -- i.e., exactly the population this app is built for -- which is why Soy stays flagged even though the broader-population evidence is reassuring. Fermentation (miso, tempeh, natto) breaks down isoflavone-bound compounds, making fermented soy generally milder than soy protein isolate.',
  'Fat Processing':
    'Repeated/high-heat frying degrades oil via hydrolysis, oxidation, and polymerization, generating trans fats even from oils that started with none, plus oxidized cholesterol linked to endothelial dysfunction and inflammation ("Chemical Changes in Deep-Fat Frying: Reaction Mechanisms, Oil Degradation, and Health Implications," Food Sci Nutr. 2025).',
  'Oxidation Risk':
    'Lipid peroxidation (fat oxidation/rancidity) generates reactive aldehydes and other byproducts that are more stable than the free radicals that produced them and can travel to and damage other tissues -- implicated across a range of inflammatory and chronic disease processes ("Lipid Peroxidation Products in Human Health and Disease," PMC3835913).',
  'Excess Fiber or Anti-Nutrients':
    'Soluble fiber has consistent evidence for improving IBS-type digestive symptoms; insoluble fiber does not show the same benefit and can worsen bloating/gas at high intake, so tolerance genuinely depends on fiber type and amount, not just total grams (Rome Foundation, "Fiber and Functional Gastrointestinal Disorders").',
  'Fiber Type': 'Same soluble-vs-insoluble digestive-tolerance evidence as Excess Fiber or Anti-Nutrients (Rome Foundation, "Fiber and Functional Gastrointestinal Disorders").',
  Irritants:
    'Alcohol measurably impairs intestinal barrier function even at moderate doses in controlled human trials (20g ethanol, randomized cross-over design), increasing intestinal permeability via a MAP-kinase signaling pathway (PMC4165763). Caffeine\'s effect on gut permeability specifically is less directly evidenced in the literature checked so far and is flagged here as the weaker half of this sub-criterion, not backed to the same standard as the alcohol finding.',
};

export function getSubCriterionSources(subCriterion: string): string {
  return SUB_CRITERION_SOURCES[subCriterion] ?? 'No specific source citation is on file yet for this factor’s rating rule.';
}
