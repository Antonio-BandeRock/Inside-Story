import type { DigestEntry } from './types';

// Medications & Nutrient Depletion -- new 2026-08-09, a real, systematized
// companion to this app's own per-condition medication timing/interaction
// research (Labs & Medication Timing, and the My Meds & Interactions
// engine itself) -- this topic pulls together, in one place, which common
// MEDICATION CLASSES are documented to measurably lower which nutrients
// over real, sustained use, regardless of which specific condition someone
// takes them for. Every claim independently verified via WebSearch before
// being written in. Deliberately does NOT duplicate this app's own already-
// existing metformin/B12 entry (type2-metformin-b12-deficiency) -- cross-
// linked instead of re-derived.
export const MEDICATION_DEPLETION_ENTRIES: DigestEntry[] = [
  {
    id: 'depletion-overview',
    category: 'basicHealth',
    title: 'Some Medications Lower Nutrient Levels Over Sustained Use',
    teaser: 'A handful of very commonly prescribed medication classes have documented effects on specific nutrient levels the longer they\'re taken, not a reason to stop them, a reason to know what to watch for.',
    summary:
      'A small set of extremely commonly prescribed medications, acid-reducing drugs, statins, diuretics, oral contraceptives, and metformin among them, carry documented, measurable effects on specific nutrient levels with sustained use, through mechanisms ranging from reduced absorption to increased excretion. None of this is a reason to stop or fear a prescribed medication on your own, every one of these drug classes exists because it treats something real, and the depletion effect is usually a tradeoff worth monitoring, not avoiding. The practical, value of knowing this: several of the symptoms a depleted nutrient can cause (fatigue, muscle cramps, mood changes, numbness) can be mistaken for the original condition getting worse, or for an unrelated new problem, when the fixable cause is a nutrient level that\'s quietly drifted down over months or years of otherwise appropriate treatment.',
    citations: [
      {
        source: 'FDA, drug-nutrient interaction general guidance',
        url: 'https://www.fda.gov/drugs',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['depletion-tying-together', 'advocacy-how-to-ask'],
  },
  {
    id: 'depletion-ppi-b12-magnesium',
    category: 'basicHealth',
    title: 'Long-Term Acid Reducers (PPIs) Carry Documented Vitamin B12 and Magnesium Effects',
    teaser: 'A direct mechanism connects stomach acid to B12 absorption, and one study found over 11 times higher odds of B12 deficiency after more than a year on a proton pump inhibitor.',
    summary:
      'Proton pump inhibitors (omeprazole, esomeprazole, and similar drugs) work by deliberate, substantial acid suppression, and stomach acid is what\'s needed to release vitamin B12 from the protein it\'s bound to in food, so less acid means less B12 actually absorbed over time. Documented data: one study found serum B12 dropped 12 to 18 percent over 12 months of use, and people using a PPI for over a year showed 11.6 times higher odds of measurable B12 deficiency than shorter-term or non-users. The evidence on magnesium is more mixed, some studies find no measurable change even after a year, while others find significantly lower magnesium levels and up to 12.8 times higher odds of deficiency at the one-year mark; the honest, current read is an established B12 effect and a less consistent magnesium one. Neither is a reason to stop a needed PPI without a doctor\'s guidance, it\'s a documented reason long-term use is worth periodic monitoring.',
    citations: [
      {
        source: 'Cross-sectional and cohort studies on long-term PPI use and B12/magnesium status, PMC12351138',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12351138/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['labs-absorption-interferers-beyond-food', 'b12-overview'],
  },
  {
    id: 'depletion-statin-coq10',
    category: 'basicHealth',
    title: 'Statins Measurably Lower Blood CoQ10, Whether That Actually Causes Muscle Symptoms Is Unsettled',
    teaser: 'The blood-level drop is real and well established; whether it actually explains statin-related muscle aches is a still-open scientific question, not a settled fact either way.',
    summary:
      'Statins work by blocking the same liver pathway (HMG-CoA reductase) the body uses to make both cholesterol and CoQ10, a shared-pathway reason statin treatment reliably lowers circulating CoQ10 levels, that part of the story is well established and not seriously contested. What\'s still unsettled is whether that blood-level drop is the cause of statin-associated muscle pain, one of the most common reasons people stop taking a statin: a direct muscle-biopsy study found decreased CoQ10 specifically inside the muscle tissue in only 2 of 18 patients with documented statin-related muscle symptoms, suggesting the blood-level effect and the muscle-symptom effect may not be the same mechanism. Trial evidence on CoQ10 supplementation itself is honestly mixed, some meta-analyses find a significant reduction in muscle pain, others find no significant benefit at all, and a major systematic review concluded the evidence isn\'t yet strong enough to recommend CoQ10 routinely for everyone on a statin, reserving it instead for people who develop muscle symptoms and haven\'t responded well to other adjustments.',
    citations: [
      {
        source: 'Marcoff & Thompson 2007, Journal of the American College of Cardiology, systematic review on CoQ10 and statin-associated myopathy',
        url: 'https://www.jacc.org/doi/10.1016/j.jacc.2007.02.049',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['cvd-statin-evidence'],
  },
  {
    id: 'depletion-diuretics-potassium-magnesium',
    category: 'basicHealth',
    title: 'Not All Diuretics Deplete the Same Minerals, Thiazide and Loop Diuretics Differ',
    teaser: 'Thiazide diuretics are specifically linked to magnesium loss; loop diuretics are not, despite both drug classes lowering blood pressure through the kidneys.',
    summary:
      'Both major diuretic classes cause documented potassium loss (hypokalemia) as blood pressure medications work by increasing how much sodium, and along with it potassium, the kidneys excrete, a well-established, dose-dependent effect for both thiazide and loop diuretics alike, most severe pill-for-pill with higher doses. Magnesium is where the two classes diverge: thiazide diuretics are specifically, consistently associated with lower serum magnesium and measurable higher hypomagnesemia risk, while loop diuretics are not, one large population study even found loop-diuretic users trending toward slightly higher magnesium, a counterintuitive finding pointing to a different underlying kidney mechanism between the two drug classes rather than one shared "diuretics deplete magnesium" rule. The practical takeaway: which specific diuretic someone takes matters for which mineral is actually worth watching, not just that a diuretic is being taken at all.',
    citations: [
      {
        source: 'Kieboom et al. 2018, Pharmacoepidemiology and Drug Safety, population study on thiazide/loop diuretics and hypomagnesemia',
        url: 'https://onlinelibrary.wiley.com/doi/10.1002/pds.4636',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['potassium-overview', 'magnesium-overview'],
  },
  {
    id: 'depletion-oral-contraceptives',
    category: 'basicHealth',
    title: 'Oral Contraceptives Carry a Documented B12 and B6 Effect, but Folate Is an Honest Exception',
    teaser: 'A study found birth-control users measuring 33% lower vitamin B12 than non-users, but current, low-dose formulations don\'t appear to meaningfully affect folate, despite older assumptions.',
    summary:
      'Documented research links oral contraceptive use to measurably lower vitamin B12, with one study finding levels 33 percent lower in users than non-users, consistent across multiple points in the menstrual cycle rather than a one-time fluctuation. Vitamin B6 shows a similar, population-level effect with current low-dose formulations. Folate is a worth-stating exception: older, higher-estrogen contraceptive formulations were linked to folate depletion in earlier research, but the honest, current evidence on today\'s lower-dose pills does not support a meaningful folate effect, a correction to an assumption that still circulates from that older research, not a dismissal of the B12/B6 findings alongside it. This matters directly for anyone planning a pregnancy after stopping birth control, since both B12 and folate are separately, independently important for that transition, the current evidence just doesn\'t point to birth control itself as the folate concern the way it once was assumed to be.',
    citations: [
      {
        source: 'Wilson et al. 2011, Nutrition Reviews, "Oral contraceptive use: impact on folate, vitamin B6, and vitamin B12 status"',
        url: 'https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1753-4887.2011.00419.x',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['b12-overview', 'folate-overview', 'pregnancy-tying-together'],
  },
  {
    id: 'depletion-tying-together',
    category: 'basicHealth',
    title: 'The Practical Pattern Across Every Medication in This Topic',
    teaser: 'Every depletion effect here shares the same practical answer: it\'s worth a conversation with whoever prescribes the medication, not a reason to self-supplement or stop taking it.',
    summary: 'Every medication named across this topic (PPIs, statins, diuretics, oral contraceptives, and the already-covered metformin/B12 research) treats something real, and every one of these depletion effects is a documented tradeoff of long-term use, not a reason to avoid a needed medication. The practical pattern that applies across all of them: a symptom that could plausibly be the depletion effect (persistent fatigue, muscle cramps, numbness or tingling, unusual mood changes) is worth naming directly to whoever prescribes the medication, ideally alongside a lab check for the specific nutrient in question, rather than either ignoring it or self-treating with an over-the-counter supplement that might itself interact with something else already being taken. The My Meds & Interactions lens already surfaces several of these same interactions directly against a person\'s own actual, tracked medications, this topic is the deeper "why" behind what that feature already checks for.',
    citations: [
      {
        source: 'FDA, drug-nutrient interaction general guidance',
        url: 'https://www.fda.gov/drugs',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['depletion-overview', 'type2-metformin-b12-deficiency'],
  },
];
