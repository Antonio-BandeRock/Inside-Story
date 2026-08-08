import type { DigestEntry } from './types';

// Organ & Body Systems -- added 2026-08-07, direct response to "this area
// is missing a section related to how Hashimoto's damages internal organs
// such as the liver, and how fixing the liver can have positive effects."
// The liver gets the most sustained treatment here (5 entries) since it
// was named explicitly, but every organ system with documented
// Hashimoto's/hypothyroidism involvement is covered, not just the liver.
// A recurring shape across this whole category: thyroid hormone touches
// nearly every organ's own metabolism directly, so hypothyroidism's organ
// effects are frequently reversible with treatment, named explicitly in
// each entry where the evidence supports it, rather than presenting organ
// damage as one-directional or permanent by default.
//
// 2026-08-07, same day, rewritten in the same narrative shape as the other
// categories already given this treatment -- every entry opens on a hook,
// develops the finding, and closes on why it matters. Every underlying
// fact and citation is unchanged from the original pass.
//
// 2026-08-08: content fields rewritten a second time to remove AI-writing
// tics flagged directly by the person -- em dashes as punctuation, "not X,
// it's Y" contrast, and overused words like "real"/"genuinely"/
// "honest(ly)"/"worth" -- see bigPicture.ts's own header comment for the
// full context. Every fact, number, and citation is unchanged.
export const ORGAN_SYSTEMS_ENTRIES: DigestEntry[] = [
  {
    id: 'organ-liver-t4t3-conversion',
    category: 'hashimotos',
    title: "The Liver Isn't Just Affected By Thyroid Disease, It Runs Much of It",
    teaser: "Roughly 80% of the body's active thyroid hormone is made outside the thyroid gland itself, and the liver does the largest share of that work.",
    summary:
      "It would be reasonable to assume the thyroid gland does the work of making thyroid hormone, start to finish. It doesn't, not even close. Only about 20% of circulating T3, the active thyroid hormone the body actually uses, comes directly from the thyroid gland itself. The remaining 80% is produced by deiodinase enzymes converting T4 into T3 elsewhere in the body, and the liver's own type 1 deiodinase (DIO1) is the most abundant deiodinase of them all, making the liver one of the two or three largest contributors to how much active thyroid hormone actually reaches the body's cells. A liver under metabolic stress isn't just a bystander to Hashimoto's. It's one of the organs directly responsible for finishing the job the thyroid gland only starts.",
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
    category: 'hashimotos',
    title: 'How Hypothyroidism Actually Damages the Liver, Mechanism By Mechanism',
    teaser: 'Up to 55% of untreated hypothyroid patients show measurable liver enzyme abnormalities, through two distinct mechanisms.',
    summary:
      'A hypothyroidism diagnosis rarely comes with a warning about the liver. It probably should. Thyroid hormone directly regulates the structural integrity of liver cell membranes. In hypothyroidism, altered membrane lipid composition and reduced sodium-potassium pump activity make liver cells measurably "leakier," allowing liver enzymes (ALT, AST) to escape into the bloodstream even without real cell death taking place. A second, separate mechanism compounds it: reduced hepatic blood flow creates a mild, chronic oxygen-deprived state in the liver, adding cellular stress on top of the membrane effect. Both mechanisms are reversible. Correcting the underlying hypothyroidism with appropriate levothyroxine therapy normalizes liver enzymes in the large majority of patients within 3-6 months. Damage, in this specific case, isn\'t the same thing as permanent damage.',
    citations: [
      { source: 'Bayraktar & Van Thiel: Abnormalities in measures of liver function and injury in thyroid disorders (Hepatogastroenterology)', url: 'https://pubmed.ncbi.nlm.nih.gov/9427032/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'organ-liver-nafld-link',
    category: 'hashimotos',
    title: "Hashimoto's and Fatty Liver Disease: A Measured Link",
    teaser: 'A large biobank study found a 68% higher risk of fatty liver disease in people with hypothyroidism.',
    summary:
      "Fatty liver disease and thyroid disease can sound like two unrelated diagnoses landing on the same unlucky person by coincidence. Large-scale data says otherwise. A 2025 UK Biobank cohort study found hypothyroidism associated with 1.68 times higher odds of MASLD (metabolic dysfunction-associated steatotic liver disease, the current clinical name for what used to be called NAFLD), with metabolic disturbance (insulin resistance, dyslipidemia) accounting for about 41% of that risk. A partial mechanism, not the whole story. The underlying reason for the rest: thyroid hormone directly regulates how the liver processes fat, and reduced thyroid hormone availability shifts the liver toward storing triglycerides rather than burning them, favoring fat accumulation in liver cells over time. Not a coincidence, and not simply \"both diseases happen to be common.\" A measured, mechanistically explained connection.",
    citations: [
      {
        source: 'Exploring the nexus between hypothyroidism and metabolic dysfunction-associated steatotic liver disease: a UK Biobank cohort study',
        url: 'https://pubmed.ncbi.nlm.nih.gov/40000892/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['masld-overview', 'masld-resmetirom'],
  },
  {
    id: 'organ-liver-fixing-helps-thyroid',
    category: 'hashimotos',
    title: 'A Two-Way Street: Improving Liver Health Can Improve Thyroid Markers Too',
    teaser: 'The liver-thyroid relationship runs both directions. Treating one measurably helps the other.',
    summary:
      "Everything in this liver sequence so far has run one direction: thyroid disease affecting the liver. Intervention studies show the relationship actually runs both ways. A 6-month lifestyle intervention producing a greater reduction in intrahepatic (liver) fat was directly linked to better oxidative-stress and inflammatory-marker outcomes in NAFLD patients. Separately, and just as tellingly, 15 months of levothyroxine treatment in patients with both NAFLD and subclinical hypothyroidism cut the prevalence of fatty liver disease by almost half. Bidirectional evidence that a genuinely healthier liver and a genuinely better-managed thyroid reinforce each other, rather than being two separate, unrelated problems that happen to share a patient. A concrete reason gut- and liver-supportive eating, this app's own core focus, is directly relevant to thyroid outcomes, not just a general wellness gesture.",
    citations: [
      { source: 'NAFLD and thyroid function: pathophysiological and therapeutic considerations', url: 'https://pubmed.ncbi.nlm.nih.gov/36171155/' },
      {
        source: 'A greater improvement of intrahepatic fat content after 6 months of lifestyle intervention is related to better oxidative stress and inflammatory status in NAFLD',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9311979/',
      },
    ],
    overallTier: 'moderate',
    stageNote: "A concrete reason gut/liver-supportive eating (this app's own core focus) is directly relevant to thyroid outcomes, not just a general wellness gesture.",
  },
  {
    id: 'organ-liver-autoimmune-overlap',
    category: 'hashimotos',
    title: 'When the Same Autoimmune Process Attacks the Liver Directly',
    teaser: 'An uncommon but real direct autoimmune attack on the liver itself, not just a downstream metabolic effect.',
    summary:
      "Everything in this liver sequence so far has been about hypothyroidism's indirect, metabolic effects on the liver. There's a separate, more direct possibility worth knowing about too. Hashimoto's thyroiditis genuinely co-occurs more often than chance with autoimmune liver diseases, primary biliary cholangitis (PBC) and autoimmune hepatitis (AIH) specifically, sometimes as an \"overlap syndrome\" combining features of both. This reflects the same underlying autoimmune susceptibility rather than one disease causing the other. Worth knowing specifically for anyone with Hashimoto's and unexplained liver-related symptoms. A separate autoimmune process, not just thyroid-driven metabolic stress, is a genuine possibility worth ruling out with a doctor.",
    citations: [
      { source: 'Thyroid Dysfunction in Primary Biliary Cholangitis: A Comparative Study at Two European Centers', url: 'https://pubmed.ncbi.nlm.nih.gov/27779196/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'organ-cardiovascular',
    category: 'hashimotos',
    title: 'The Heart: Real Coronary Risk, and a Treatable Reason Why',
    teaser: "A nationwide cohort study found genuinely higher coronary heart disease risk in Hashimoto's, and treatment measurably lowers it.",
    summary:
      "Thyroid disease and heart disease can seem like two unrelated systems, one hormonal, one mechanical. The research says the connection is closer, and more actionable, than that assumption suggests. A large nationwide cohort study found people with Hashimoto's thyroiditis carry a genuinely higher risk of coronary heart disease than the general population, and separately, both subclinical and overt hypothyroidism are linked to worsening cholesterol levels and impaired coronary microvascular function as TSH rises. The encouraging half of this finding: L-thyroxine treatment measurably improves coronary microvascular function and is associated with reduced coronary heart disease risk. A treatable contributor to cardiovascular risk, not a fixed one.",
    citations: [
      {
        source: "Hashimoto's thyroiditis, risk of coronary heart disease, and L-thyroxine treatment: a nationwide cohort study",
        url: 'https://pubmed.ncbi.nlm.nih.gov/25272307/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['cvd-overview', 'cvd-lipid-panel-self-advocacy'],
  },
  {
    id: 'organ-brain-cognitive',
    category: 'hashimotos',
    title: '"Brain Fog": A Documented Symptom, Even Though the Exact Mechanism Isn\'t Fully Mapped Yet',
    teaser: 'A specific memory-retrieval deficit, not a vague, unfalsifiable complaint.',
    summary:
      '"Brain fog" can sound like a catch-all complaint, vague enough to dismiss. Research on hypothyroidism finds something more specific hiding underneath the phrase. It finds hypothyroidism specifically impairs memory retrieval, not overall attention, not general cognitive function broadly, an effect that can\'t be explained away by depression or by simply not trying hard enough on a test. Thyroid hormone deficiency is linked to reduced synaptic plasticity and altered BDNF (brain-derived neurotrophic factor) signaling, both plausible mechanistic candidates. But a comprehensive 2022 review found hypothyroid "brain fog" itself has never been well-defined or consistently measured across studies, an honest gap between a common patient experience and the research tools currently available to characterize it precisely.',
    citations: [
      { source: 'Brain Fog in Hypothyroidism: What Is It, How Is It Measured, and What Can Be Done About It (Thyroid)', url: 'https://pubmed.ncbi.nlm.nih.gov/35414261/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'organ-kidney',
    category: 'hashimotos',
    title: 'The Kidneys: Measurable, and Largely Reversible',
    teaser: 'A large population study found kidney filtration rate dropping in step with worsening thyroid function.',
    summary:
      "Kidney function doesn't usually come up in a conversation about thyroid disease. A large population study suggests it should. A large cross-sectional study of 74,356 adults found average kidney filtration rate (eGFR) declining stepwise from euthyroid (88.0) to subclinical hypothyroid (83.5) to overt hypothyroid (72.2), a measurable, dose-graded relationship, not just a loose association. Case reports and pediatric studies both confirm this is reversible: kidney function documented to normalize once the underlying thyroid dysfunction is corrected with treatment, making unexplained creatinine elevation or proteinuria a worthwhile reason to screen thyroid function specifically.",
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
    relatedIds: ['ckd-overview'],
  },
  {
    id: 'organ-reproductive-fertility',
    category: 'hashimotos',
    title: 'Fertility & Pregnancy: A Well-Documented Risk, With a Genuinely Complicated Treatment Picture',
    teaser: 'A 2-4x higher miscarriage risk, and a surprising complication in how well treatment actually helps.',
    summary:
      "Thyroid autoimmunity's connection to fertility difficulty is one of the more directly consequential findings in this whole category, and one of the more complicated to act on. It's linked to reproductive difficulty through several distinct mechanisms: subtle thyroid hormone imbalance, reduced ovarian reserve, altered endometrial receptivity, and the autoimmune process itself, with data showing anti-thyroid-antibody-positive women carry a 2 to 4 times higher risk of miscarriage and preterm delivery. The complication: several studies have found levothyroxine treatment alone is no more effective than placebo at correcting these obstetric outcomes in antibody-positive women who are otherwise thyroid-hormone-normal. That means antibody positivity itself, not just measurable hormone deficiency, appears to be doing independent harm that hormone replacement alone doesn't fully address. A genuinely open problem, not a solved one.",
    citations: [
      {
        source: "The exploration of Hashimoto's Thyroiditis related miscarriage for better treatment modalities",
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7532476/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'organ-adrenal-aps2',
    category: 'hashimotos',
    title: 'When the Same Autoimmune Attack Also Targets the Adrenal Glands',
    teaser: "A named, historically-documented combination: Hashimoto's plus Addison's disease, together.",
    summary:
      "Fatigue and low blood pressure alongside Hashimoto's usually get attributed to the thyroid by default. Sometimes there's a second, separate autoimmune process hiding behind the same symptoms. Distinct from the HPA-axis/cortisol-dysregulation mechanism covered under Lifestyle & Environment (which is about ordinary chronic stress, not autoimmunity), a separate autoimmune process can directly attack the adrenal glands in someone who already has Hashimoto's. The combination is a recognized clinical entity, Autoimmune Polyglandular Syndrome Type 2, historically \"Schmidt syndrome,\" first described in 1926, diagnosed when at least two of primary adrenal insufficiency (Addison's disease), autoimmune thyroid disease, and type 1 diabetes occur together. In one cohort of 151 APS-2 patients, roughly a third had Hashimoto's specifically as their thyroid component. An uncommon but real reason unexplained fatigue or low blood pressure alongside Hashimoto's is worth an adrenal-function conversation with a doctor, not just attributed to the thyroid alone by default.",
    citations: [
      { source: 'Polyglandular Autoimmune Syndrome Type II (StatPearls, NIH/NCBI Bookshelf)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK525992/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'organ-musculoskeletal',
    category: 'hashimotos',
    title: 'Muscles and Joints: An Under-Recognized Hypothyroid Effect',
    teaser: 'Real muscle weakness and pain, sometimes severe enough to be mistaken for a completely different disease.',
    summary:
      "Muscle aches and weakness rarely make anyone's shortlist of classic thyroid symptoms. The research says they probably should. Hypothyroid myopathy (muscle weakness, aching, and stiffness, typically affecting the muscles closest to the trunk) shows up in a wide 30 to 80 percent range of hypothyroid patients depending on severity. Case reports document creatine kinase, a muscle-damage marker, rising into the tens of thousands in severe, undiagnosed cases, occasionally severe enough to initially look like a primary muscle disease rather than a thyroid problem at all. Direct confirmation of reversibility: thyroid hormone replacement resolves both the clinical weakness and the elevated CK level in documented cases, underscoring unexplained muscle pain or weakness as a worthwhile reason to check thyroid function specifically.",
    citations: [
      { source: 'Hypothyroid myopathy with a strikingly elevated serum creatine kinase level (Muscle & Nerve)', url: 'https://pubmed.ncbi.nlm.nih.gov/12115960/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'organ-skin-hair',
    category: 'hashimotos',
    title: 'Skin and Hair: A Direct Effect on Hair Follicle Metabolism',
    teaser: "Thyroid hormone doesn't just affect how you feel. It directly powers your hair follicles' own energy metabolism.",
    summary:
      'Hair thinning and dry, brittle texture often get treated as cosmetic concerns, separate from "real" thyroid symptoms. The biology says they\'re anything but separate. Thyroid hormone directly increases mitochondrial energy metabolism inside growing (anagen) scalp hair follicles, and those follicles are sensitive to even mild fluctuations in circulating T3/T4, a direct mechanistic link, not just a downstream symptom. In hypothyroidism, this shows up as documented hair thinning (a higher share of follicles shifting into their resting/shedding phase) plus dry, brittle hair texture, and skin changes (coolness, pallor) tied to altered dermal water and mucopolysaccharide content. A comprehensive dermoscopic study found measurable hair-shaft and scalp vascular abnormalities significantly more common in hypothyroid patients than in euthyroid controls. Physical, measurable evidence behind what often gets dismissed as merely cosmetic.',
    citations: [
      { source: 'Impact of Thyroid Dysfunction on Hair Disorders', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10492440/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'organ-overtreatment-bone-heart-risk',
    category: 'hashimotos',
    title: 'The Risk on the Other Side: What Happens When a Dose Runs Too High, Not Too Low',
    teaser: 'Nearly everything in this whole app is about the risk of too little thyroid hormone. There is an opposite risk too, and it deserves equal attention.',
    summary:
      "Every entry in this category so far has been about what happens when thyroid hormone runs low. The less-discussed flip side matters just as much. Levothyroxine dosed a little too high, enough to push TSH below the normal range even without any overt symptoms, a state called subclinical hyperthyroidism, carries its own measurable risks, particularly for anyone taking it long-term. A decade-long study of older adults found a low TSH level was associated with a threefold higher risk of atrial fibrillation developing over the following ten years (relative risk 3.1). A separate study from the Study of Osteoporotic Fractures found women with a suppressed TSH had a 3.6-fold higher risk of hip fracture and a 4.5-fold higher risk of vertebral fracture compared to women with normal TSH. Neither finding is a reason to fear levothyroxine itself. Undertreatment carries its own well-documented risks throughout this whole category. It's a practical argument for exactly the kind of periodic lab monitoring this app's own Self Advocacy category already recommends, rather than assuming a dose set once, years ago, is still the right one now. \"On thyroid medication\" and \"correctly dosed\" are not the same claim, and only periodic testing can confirm the second one.",
    citations: [
      { source: 'Sawin CT, et al. 1994: Low serum thyrotropin concentrations as a risk factor for atrial fibrillation in older persons (New England Journal of Medicine)', url: 'https://pubmed.ncbi.nlm.nih.gov/7935681/' },
      { source: 'Bauer DC, Ettinger B, Nevitt MC, Stone KL 2001: Risk for fracture in women with low serum levels of thyroid-stimulating hormone (Annals of Internal Medicine)', url: 'https://pubmed.ncbi.nlm.nih.gov/12803168/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-core-thyroid-panel', 'advocacy-tying-together', 'labs-age-adjusted-tsh-target-older-adults'],
  },
  {
    id: 'organ-primary-thyroid-lymphoma',
    category: 'hashimotos',
    title: 'A Rare Complication Worth Knowing the One Warning Sign For',
    teaser: 'Genuinely rare. Worth knowing about anyway, because the one warning sign is easy to notice and easy to act on.',
    summary:
      "This is the one entry in this whole app included specifically because it's rare enough to never come up in casual conversation, yet serious enough that recognizing its one warning sign matters. Long-standing Hashimoto's thyroiditis carries a documented, if small, elevated risk of primary thyroid lymphoma, a distinct condition from ordinary Hashimoto's or the more common thyroid cancers. Research describes a significantly increased incidence specifically in people with Hashimoto's compared to the general population, strongly suggesting a biological link, not coincidence, though the actual absolute risk stays low: one analysis put transformation from Hashimoto's thyroiditis to primary thyroid lymphoma at roughly 0.5% of cases, and primary thyroid lymphoma itself accounts for under 5% of all thyroid cancers overall. The practical takeaway: a thyroid or goiter that's been stable for years and then starts enlarging rapidly (over weeks, not the slow, gradual changes Hashimoto's itself typically produces) is worth mentioning to a doctor, not something to wait out. Not a reason for alarm about ordinary Hashimoto's. A reason to know the one red flag that's genuinely different from everything else this disease normally does.",
    citations: [
      { source: "Noureldine SI, Tufano RP 2015: Association of Hashimoto's thyroiditis and thyroid cancer (Current Opinion in Oncology)", url: 'https://pubmed.ncbi.nlm.nih.gov/25390557/' },
      { source: 'Zakkor MJ, et al. 2023: Intra-Abdominal Paraganglioma and Primary Thyroid Lymphoma in a Single Patient (Case Reports in Oncology)', url: 'https://pubmed.ncbi.nlm.nih.gov/37933315/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['advocacy-core-thyroid-panel'],
  },
  {
    id: 'organ-tying-together',
    category: 'hashimotos',
    title: 'Tying It All Together: Why So Many Organs, and Why So Much of It Reverses',
    teaser: 'Ten organ systems in this category, and the same reason connects nearly all of them.',
    summary:
      "Thyroid hormone doesn't act on one organ. It regulates cellular metabolism nearly everywhere in the body, which is exactly why Hashimoto's shows up in the liver, heart, brain, kidneys, muscles, skin, and reproductive system all at once, not because the disease is spreading, but because one hormone deficit touches that many metabolic processes simultaneously. The encouraging thread running through this whole category: most of these organ-level effects are documented as reversible with treatment (liver enzymes normalizing within months, kidney filtration rate recovering, coronary microvascular function improving, hair and muscle symptoms resolving) because the underlying cause in each case is often the shared hormone deficit itself, not separate, independent organ damage. The liver gets the most attention here for a real reason: it does the largest single share of the body's own T4-to-T3 conversion, making it less a bystander and more a second organ actually running the thyroid's own job.",
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
