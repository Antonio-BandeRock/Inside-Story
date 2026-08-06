import type { DigestEntry } from './types';

// Organ & Body Systems -- added 2026-08-07, direct response to "this area
// is missing a section related to how Hashimoto's damages internal organs
// such as the liver, and how fixing the liver can have positive effects."
// The liver gets the most sustained treatment here (4 entries) since it
// was named explicitly -- but every organ system with real, documented
// Hashimoto's/hypothyroidism involvement is covered, not just the liver.
// A real, recurring shape across this whole category: thyroid hormone
// touches nearly every organ's own metabolism directly, so hypothyroidism's
// organ effects are frequently reversible with real treatment -- named
// explicitly in each entry where the evidence supports it, rather than
// presenting organ damage as one-directional or permanent by default.
export const ORGAN_SYSTEMS_ENTRIES: DigestEntry[] = [
  {
    id: 'organ-liver-t4t3-conversion',
    category: 'organSystems',
    title: 'The Liver Isn\'t Just Affected By Thyroid Disease -- It Runs Much of It',
    teaser: 'Roughly 80% of your body\'s active thyroid hormone is made outside the thyroid -- and the liver does a large share of that work.',
    summary:
      'Only about 20% of circulating T3 (the active thyroid hormone) comes directly from the thyroid gland itself -- the remaining ~80% is produced by deiodinase enzymes converting T4 into T3 elsewhere in the body, and the liver\'s own type 1 deiodinase (DIO1) is the most abundant deiodinase there, making the liver one of the two or three largest real contributors to how much active thyroid hormone actually reaches your cells. A liver under real metabolic stress isn\'t just a bystander to Hashimoto\'s -- it\'s one of the organs directly responsible for finishing the job the thyroid starts.',
    citations: [
      {
        source: 'Role of hepatic deiodinases in thyroid hormone homeostasis and liver metabolism, inflammation, and fibrosis (European Thyroid Journal)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10160546/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['additive-hfcs'],
  },
  {
    id: 'organ-liver-hashimotos-damage',
    category: 'organSystems',
    title: 'How Hypothyroidism Actually Damages the Liver, Mechanism By Mechanism',
    teaser: 'Up to 55% of untreated hypothyroid patients show real, measurable liver enzyme abnormalities.',
    summary:
      'Thyroid hormone directly regulates the structural integrity of liver cell membranes -- in hypothyroidism, altered membrane lipid composition and reduced sodium-potassium pump activity make liver cells measurably "leakier," allowing liver enzymes (ALT, AST) to escape into the bloodstream even without real cell death. A second, separate mechanism: reduced hepatic blood flow creates a mild, chronic oxygen-deprived state in the liver, adding real cellular stress on top of the membrane effect. Both mechanisms are genuinely reversible: correcting the underlying hypothyroidism with appropriate levothyroxine therapy normalizes liver enzymes in the large majority of patients within 3-6 months.',
    citations: [
      { source: 'Bayraktar & Van Thiel -- Abnormalities in measures of liver function and injury in thyroid disorders (Hepatogastroenterology)', url: 'https://pubmed.ncbi.nlm.nih.gov/9427032/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'organ-liver-nafld-link',
    category: 'organSystems',
    title: 'Hashimoto\'s and Fatty Liver Disease: a Real, Measured Link',
    teaser: 'A real, large biobank study found a 68% higher risk of fatty liver disease in people with hypothyroidism.',
    summary:
      'A 2025 UK Biobank cohort study found hypothyroidism associated with 1.68x higher odds of MASLD (metabolic dysfunction-associated steatotic liver disease, the current clinical name for what used to be called NAFLD), with metabolic disturbance (insulin resistance, dyslipidemia) accounting for about 41% of that risk -- meaning a real but partial mechanism, not the whole story. The underlying reason: thyroid hormone directly regulates how the liver processes fat, and reduced thyroid hormone availability shifts the liver toward storing triglycerides rather than burning them, favoring fat accumulation in liver cells (hepatic steatosis) over time.',
    citations: [
      {
        source: 'Exploring the nexus between hypothyroidism and metabolic dysfunction-associated steatotic liver disease: a UK Biobank cohort study',
        url: 'https://pubmed.ncbi.nlm.nih.gov/40000892/',
      },
    ],
    overallTier: 'strong',
  },
  {
    id: 'organ-liver-fixing-helps-thyroid',
    category: 'organSystems',
    title: 'A Real, Two-Way Street: Improving Liver Health Can Improve Thyroid Markers Too',
    teaser: 'The liver-thyroid relationship runs both directions -- treating one measurably helps the other.',
    summary:
      'This isn\'t only thyroid hormone affecting the liver -- real intervention studies show the reverse holds too. A 6-month lifestyle intervention producing a greater reduction in intrahepatic (liver) fat was directly linked to better oxidative-stress and inflammatory-marker outcomes in NAFLD patients, and separately, 15 months of levothyroxine treatment in patients with both NAFLD and subclinical hypothyroidism cut the prevalence of fatty liver disease by almost half -- real, bidirectional evidence that a genuinely healthier liver and a genuinely better-managed thyroid reinforce each other rather than being two separate, unrelated problems.',
    citations: [
      { source: 'NAFLD and thyroid function: pathophysiological and therapeutic considerations', url: 'https://pubmed.ncbi.nlm.nih.gov/36171155/' },
      {
        source: 'A greater improvement of intrahepatic fat content after 6 months of lifestyle intervention is related to better oxidative stress and inflammatory status in NAFLD',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9311979/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, concrete reason gut/liver-supportive eating (this app\'s own core focus) is directly relevant to thyroid outcomes, not just a general wellness gesture.',
  },
  {
    id: 'organ-liver-autoimmune-overlap',
    category: 'organSystems',
    title: 'When the Same Autoimmune Process Attacks the Liver Directly',
    teaser: 'A real, if uncommon, direct autoimmune attack on the liver itself -- not just a downstream metabolic effect.',
    summary:
      'Separate from hypothyroidism\'s indirect metabolic effects on the liver, Hashimoto\'s thyroiditis genuinely co-occurs more often than chance with real autoimmune liver diseases -- primary biliary cholangitis (PBC) and autoimmune hepatitis (AIH) specifically, sometimes as a real "overlap syndrome" combining features of both. This reflects the same underlying autoimmune susceptibility rather than one disease causing the other -- worth knowing specifically for anyone with Hashimoto\'s and unexplained liver-related symptoms, since a real, separate autoimmune process (not just thyroid-driven metabolic stress) is a genuine possibility worth ruling out with a doctor.',
    citations: [
      { source: 'Thyroid Dysfunction in Primary Biliary Cholangitis: A Comparative Study at Two European Centers', url: 'https://pubmed.ncbi.nlm.nih.gov/27779196/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'organ-cardiovascular',
    category: 'organSystems',
    title: 'The Heart: Real Coronary Risk, and a Real, Treatable Reason Why',
    teaser: 'A real nationwide cohort study found genuinely higher coronary heart disease risk in Hashimoto\'s -- and treatment measurably lowers it.',
    summary:
      'A large, real nationwide cohort study found people with Hashimoto\'s thyroiditis carry a genuinely higher risk of coronary heart disease than the general population, and separately, both subclinical and overt hypothyroidism are linked to worsening cholesterol levels and impaired coronary microvascular function as TSH rises. The real, encouraging half of this finding: L-thyroxine treatment measurably improves coronary microvascular function and is associated with reduced coronary heart disease risk -- this is a real, treatable contributor to cardiovascular risk, not a fixed one.',
    citations: [
      {
        source: 'Hashimoto\'s thyroiditis, risk of coronary heart disease, and L-thyroxine treatment: a nationwide cohort study',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25272307/',
      },
    ],
    overallTier: 'strong',
  },
  {
    id: 'organ-brain-cognitive',
    category: 'organSystems',
    title: '"Brain Fog": a Real, Documented Symptom, Even Though the Exact Mechanism Isn\'t Fully Mapped Yet',
    teaser: 'A real, specific memory-retrieval deficit -- not a vague, unfalsifiable complaint.',
    summary:
      'Real research finds hypothyroidism specifically impairs memory retrieval (not overall attention or general cognitive function), an effect that can\'t be explained away by depression or by simply not trying hard enough on a test. Thyroid hormone deficiency is linked to reduced synaptic plasticity and altered BDNF (brain-derived neurotrophic factor) signaling, both real, plausible mechanistic candidates -- but a comprehensive 2022 review found hypothyroid "brain fog" itself has never been well-defined or consistently measured across studies, an honest gap between a real, common patient experience and the research tools available to characterize it precisely.',
    citations: [
      { source: 'Brain Fog in Hypothyroidism: What Is It, How Is It Measured, and What Can Be Done About It (Thyroid)', url: 'https://pubmed.ncbi.nlm.nih.gov/35414261/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'organ-kidney',
    category: 'organSystems',
    title: 'The Kidneys: Real, Measurable, and Largely Reversible',
    teaser: 'A large population study found kidney filtration rate dropping in step with worsening thyroid function.',
    summary:
      'A real, large cross-sectional study (74,356 adults) found average kidney filtration rate (eGFR) declining stepwise from euthyroid (88.0) to subclinical hypothyroid (83.5) to overt hypothyroid (72.2) -- a real, measurable, dose-graded relationship, not just a loose association. Real case reports and pediatric studies both confirm this is genuinely reversible: kidney function documented to normalize once the underlying thyroid dysfunction is corrected with treatment, making unexplained creatinine elevation or proteinuria a real, worthwhile reason to screen thyroid function specifically.',
    citations: [
      {
        source: 'Subclinical and overt hypothyroidism is associated with reduced glomerular filtration rate and proteinuria: a large cross-sectional population study (Scientific Reports)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5795015/',
      },
    ],
    overallTier: 'strong',
    chart: {
      title: 'Kidney Filtration Rate (eGFR) by Thyroid Status',
      unit: '',
      data: [
        { label: 'Euthyroid', value: 88.0 },
        { label: 'Subclinical Hypothyroid', value: 83.5 },
        { label: 'Overt Hypothyroid', value: 72.2 },
      ],
      sourceNote: '74,356-adult cross-sectional study, Scientific Reports (PMC5795015)',
    },
  },
  {
    id: 'organ-reproductive-fertility',
    category: 'organSystems',
    title: 'Fertility & Pregnancy: a Real, Well-Documented Risk, With a Genuinely Complicated Treatment Picture',
    teaser: 'Real evidence of a 2-4x higher miscarriage risk -- and a real, surprising complication in how well treatment actually helps.',
    summary:
      'Thyroid autoimmunity is genuinely linked to real reproductive difficulty through several real, distinct mechanisms: subtle thyroid hormone imbalance, reduced ovarian reserve, altered endometrial receptivity, and the autoimmune process itself -- with real data showing anti-thyroid-antibody-positive women carry a 2-4x higher risk of miscarriage and preterm delivery. The real, honest complication: several real studies have found levothyroxine treatment alone is no more effective than placebo at correcting these obstetric outcomes in antibody-positive women who are otherwise thyroid-hormone-normal -- meaning antibody positivity itself, not just measurable hormone deficiency, appears to be doing real independent harm that hormone replacement alone doesn\'t fully address.',
    citations: [
      {
        source: 'The exploration of Hashimoto\'s Thyroiditis related miscarriage for better treatment modalities',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7532476/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'organ-adrenal-aps2',
    category: 'organSystems',
    title: 'When the Same Autoimmune Attack Also Targets the Adrenal Glands',
    teaser: 'A real, named, historically-documented combination: Hashimoto\'s plus Addison\'s disease, together.',
    summary:
      'Distinct from the HPA-axis/cortisol-dysregulation mechanism covered under Lifestyle & Environment (which is about ordinary chronic stress, not autoimmunity), a real, separate autoimmune process can directly attack the adrenal glands in someone who already has Hashimoto\'s -- the combination is a recognized clinical entity, Autoimmune Polyglandular Syndrome Type 2 (historically "Schmidt syndrome," first described in 1926), diagnosed when at least two of primary adrenal insufficiency (Addison\'s disease), autoimmune thyroid disease, and type 1 diabetes occur together. In one real cohort of 151 APS-2 patients, roughly a third had Hashimoto\'s specifically as their thyroid component -- a real, if uncommon, reason unexplained fatigue or low blood pressure alongside Hashimoto\'s is worth a real adrenal-function conversation with a doctor, not just attributed to the thyroid alone.',
    citations: [
      { source: 'Polyglandular Autoimmune Syndrome Type II (StatPearls, NIH/NCBI Bookshelf)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK525992/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'organ-musculoskeletal',
    category: 'organSystems',
    title: 'Muscles and Joints: a Real, Under-Recognized Hypothyroid Effect',
    teaser: 'Real muscle weakness and pain, sometimes severe enough to be mistaken for a completely different disease.',
    summary:
      'Hypothyroid myopathy -- real muscle weakness, aching, and stiffness, typically affecting the muscles closest to the trunk -- shows up in a genuinely wide 30-80% range of hypothyroid patients depending on severity, and real case reports document creatine kinase (a muscle-damage marker) rising into the tens of thousands in severe, undiagnosed cases, occasionally severe enough to initially look like a primary muscle disease rather than a thyroid problem. Real, direct confirmation of reversibility: thyroid hormone replacement resolves both the clinical weakness and the elevated CK level in documented cases, underscoring unexplained muscle pain or weakness as a real, worthwhile reason to check thyroid function specifically.',
    citations: [
      { source: 'Hypothyroid myopathy with a strikingly elevated serum creatine kinase level (Muscle & Nerve)', url: 'https://pubmed.ncbi.nlm.nih.gov/12115960/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'organ-skin-hair',
    category: 'organSystems',
    title: 'Skin and Hair: a Real, Direct Effect on Hair Follicle Metabolism',
    teaser: 'Thyroid hormone doesn\'t just affect how you feel -- it directly powers your hair follicles\' own energy metabolism.',
    summary:
      'Thyroid hormone directly increases mitochondrial energy metabolism inside growing (anagen) scalp hair follicles, and follicles are genuinely sensitive to even mild fluctuations in circulating T3/T4 -- a real, direct mechanistic link, not just a downstream symptom. In hypothyroidism, this shows up as real, documented hair thinning (a higher share of follicles shifting into their resting/shedding phase) plus dry, brittle hair texture, and skin changes (coolness, pallor) tied to altered dermal water and mucopolysaccharide content. A real, comprehensive dermoscopic study found measurable hair-shaft and scalp vascular abnormalities significantly more common in hypothyroid patients than in euthyroid controls.',
    citations: [
      { source: 'Impact of Thyroid Dysfunction on Hair Disorders', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10492440/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'organ-tying-together',
    category: 'organSystems',
    title: 'Tying It All Together: Why So Many Organs, and Why So Much of It Reverses',
    teaser: 'Ten organ systems in this category -- and the same real reason connects nearly all of them.',
    summary:
      "Thyroid hormone doesn't act on one organ -- it regulates cellular metabolism nearly everywhere in the body, which is exactly why Hashimoto's shows up in the liver, heart, brain, kidneys, muscles, skin, and reproductive system all at once, not because the disease is spreading, but because one hormone deficit touches that many real metabolic processes simultaneously. The genuinely encouraging thread running through this whole category: most of these organ-level effects are documented as reversible with real treatment -- liver enzymes normalizing within months, kidney filtration rate recovering, coronary microvascular function improving, hair and muscle symptoms resolving -- because the underlying cause in each case is often the shared hormone deficit itself, not separate, independent organ damage. The liver gets the most attention here for a real reason: it does the largest single share of the body's own T4-to-T3 conversion, making it less a bystander and more a second organ actually running the thyroid's own job.",
    citations: [
      {
        source: 'Role of hepatic deiodinases in thyroid hormone homeostasis and liver metabolism, inflammation, and fibrosis (European Thyroid Journal)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10160546/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['organ-liver-t4t3-conversion', 'organ-liver-fixing-helps-thyroid'],
  },
];
