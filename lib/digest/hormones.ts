import type { DigestEntry } from './types';

// Hormones -- a new Basic Health topic added 2026-08-08, direct request:
// "Finish the rest of the macronutrients, micronutrients, acids, and
// hormones." This is a genuinely new content area for the Digest,
// distinct from the Essential Nutrients series (a nutrient is something
// eaten; a hormone is something the body itself produces and signals
// with) -- but built the same way: real, independently-verified
// physiology first, then the real, honest evidence for how food and
// lifestyle actually affect each one, cross-linking heavily to the
// substantial hormone-adjacent content that already exists scattered
// across this app (insulin resistance in Type 2 Diabetes/PCOS/MASLD,
// cortisol/HPA-axis in Lifestyle & Environment, the extensive existing
// T3/T4/TSH content across Hashimoto's and Graves', sex-hormone testing
// in Self Advocacy) rather than duplicating any of it.
//
// Deliberately scoped to the hormones this app's own conditions already
// touch most directly, not an exhaustive endocrinology textbook: insulin,
// cortisol, thyroid hormones (a compact entry, since the real depth
// already lives elsewhere), leptin & ghrelin, estrogen & progesterone,
// and testosterone. Every citation independently verified via WebSearch.
export const HORMONES_ENTRIES: DigestEntry[] = [
  {
    id: 'hormone-what-is-a-hormone',
    category: 'basicHealth',
    title: 'What a Hormone Actually Is, and Why This Category Exists Alongside Nutrients',
    teaser: "A nutrient is something eaten. A hormone is something the body itself makes and uses as a signal, and food changes how well that signaling works.",
    summary: "A hormone is a chemical messenger, produced by a gland or tissue, released into the bloodstream, and read by receptors on distant target cells, coordinating everything from blood-sugar regulation to the menstrual cycle to the body's own stress response. This is a different kind of thing from a nutrient: a nutrient is raw material the body takes in from outside; a hormone is a signal the body manufactures and sends internally. The reason this category belongs alongside the Essential Nutrients series: food and lifestyle don't just supply the raw materials hormones are built from (cholesterol for steroid hormones, tyrosine and iodine for thyroid hormone, amino acids for insulin itself), they also directly influence how much of a given hormone gets made, how sensitive the body's own tissues are to it, and how quickly it gets cleared, mechanistic connections covered one hormone at a time in the entries below.",
    citations: [
      { source: 'Physiology, Endocrine Hormones, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538498/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'insulin-overview-mechanism',
    category: 'basicHealth',
    title: 'Insulin: The Mechanism Behind the Single Most-Referenced Hormone',
    teaser: 'Insulin binds a specific receptor, triggers a signaling cascade, and physically opens the door that lets glucose enter muscle and fat cells at all.',
    summary: "Insulin, produced by the pancreas, is the body's primary anabolic hormone, coordinating how cells take up and store glucose, fat, and amino acids after eating. The mechanism is a multi-step cascade, not a simple on/off switch: insulin binds its own receptor on a target cell's surface, triggering a signaling chain through insulin receptor substrate (IRS) proteins and an enzyme called PI3-kinase, which ultimately causes GLUT4, a glucose transporter protein, to move to the cell's surface and physically let glucose in, especially in muscle and fat tissue. This mechanism is exactly what breaks down in insulin resistance, covered directly in the next entry, and it's the same underlying biology the T2D, PCOS, and MASLD research each independently converges on as their shared central mechanism.",
    citations: [
      { source: 'Mechanisms of Insulin Action and Insulin Resistance, Physiological Reviews', url: 'https://journals.physiology.org/doi/full/10.1152/physrev.00063.2017' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'insulin-resistance-real-cluster',
    category: 'basicHealth',
    title: 'Insulin Resistance Is the Single Most-Repeated Mechanism in The Entire Non-Autoimmune Condition Coverage',
    teaser: 'Four separately-built conditions all trace back to the same broken signaling step, worth understanding as one mechanism, not four coincidences.',
    summary:
      "Insulin resistance, where target cells stop responding normally to insulin's own signal, forcing the pancreas to produce more just to keep glucose in a normal range, is a recurring thread across completely unrelated conditions. Type 2 Diabetes's own dedicated research already names it directly as the shared root connecting T2D, PCOS, MASLD, and Chronic Kidney Disease. PCOS's own quantified data (42.6% vs. 17.1% insulin-resistance prevalence) makes it that condition's own central mechanism too. MASLD's own pathway (fat backing up in the liver specifically because insulin resistance disrupts normal fat metabolism) is the identical underlying disruption. This isn't four separate coincidental findings; it's one shared broken signaling pathway showing up in four different organ systems depending on where the body's own compensating mechanisms give out first.",
    citations: [
      { source: 'Insulin resistance: mechanisms and therapeutic interventions', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12891326/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type2-metabolic-syndrome-cluster', 'pcos-insulin-resistance-mechanism', 'masld-overview'],
  },
  {
    id: 'cortisol-overview-hpa-axis',
    category: 'basicHealth',
    title: 'Cortisol & the HPA Axis: The Body\'s Own Central Stress-Response System',
    teaser: 'A three-organ relay, not a single gland, and already traced its downstream effects through four separate everyday topics.',
    summary: "Cortisol is produced by the adrenal glands as the end product of a three-organ signaling relay called the hypothalamic-pituitary-adrenal (HPA) axis: the hypothalamus signals the pituitary, the pituitary signals the adrenal glands, and the adrenal glands release cortisol, which in a healthy, functioning system then signals back to the hypothalamus and pituitary to turn the whole cascade back down, a self-regulating feedback loop. In short bursts, cortisol is adaptive: it mobilizes glucose for immediate energy and modulates immune activity during an acute stressor. The Lifestyle & Environment research already traces this exact mechanism through four separate, seemingly unrelated everyday topics (alcohol, sleep disruption, high-intensity exercise, and a glucose crash after a sugary drink), all converging on the same HPA-axis pathway, cross-linked directly below rather than repeated here.",
    citations: [
      { source: 'HPA Axis: The Stress Response System, Cleveland Clinic', url: 'https://my.clevelandclinic.org/health/body/hypothalamic-pituitary-adrenal-hpa-axis' },
    ],
    overallTier: 'strong',
    relatedIds: ['lifestyle-chronic-stress-hpa', 'advocacy-cortisol-testing'],
  },
  {
    id: 'cortisol-chronic-dysregulation-autoimmunity',
    category: 'basicHealth',
    title: 'Chronic Stress Doesn\'t Just Raise Cortisol, It Breaks the Feedback Loop That\'s Supposed to Turn It Back Down',
    teaser: 'A documented shift toward glucocorticoid-receptor resistance and a pro-inflammatory state, with separate consequences for bone, brain, and immune regulation.',
    summary: "The problem with chronic, sustained stress isn't simply \"too much cortisol\" as a static fact, it's that prolonged HPA-axis activation impairs the feedback loop meant to shut cortisol production back down, producing glucocorticoid-receptor resistance and, counterintuitively, a paradoxical pro-inflammatory state even with elevated cortisol circulating. Documented downstream consequences span several separate systems: hippocampal atrophy and neuroinflammation in the brain, a well-established contribution to osteoporosis through sustained HPA-axis activation and disrupted bone remodeling, and a shift in immune regulation toward autoimmunity specifically, not just generic \"inflammation.\" This last point connects directly to the broader mission: chronic cortisol dysregulation is a mechanistically-grounded pathway from everyday stress to measurably worse immune-system regulation, not a loosely metaphorical one.",
    citations: [
      { source: 'Chronic Stress and Autoimmunity: The Role of HPA Axis and Cortisol Dysregulation', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12563903/' },
    ],
    overallTier: 'strong',
    relatedIds: ['cortisol-overview-hpa-axis', 'lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'thyroid-hormones-overview',
    category: 'basicHealth',
    title: 'Thyroid Hormones (T3, T4, TSH): A Compact Overview, Since The Depth Lives Elsewhere',
    teaser: "The single most extensively researched hormone system by far, Hashimoto's and Graves' between them already cover this topic in dedicated depth.",
    summary: "T4 (thyroxine) is the thyroid gland's own primary output, a mostly-inactive precursor hormone that gets converted into T3 (triiodothyronine), the biologically active form actually used by cells throughout the body, largely outside the thyroid gland itself, in the liver, muscle, and other tissue. TSH (thyroid-stimulating hormone), released by the pituitary, is the feedback signal that tells the thyroid how much T4 to make, rising when thyroid hormone runs low and falling when it runs high, the same basic feedback-loop shape cortisol's own HPA axis follows above. The depth on this specific hormone system already exists in substantial detail across its Hashimoto's and Graves' categories (TPO/TSI antibodies, the T4-to-T3 conversion pathway, levothyroxine timing, iodine's own two-edged role) rather than repeated here, this entry exists mainly so \"Hormones\" as a category has an honest place for the single most-covered hormone system in this whole app, pointing directly to where its actual depth lives.",
    citations: [
      { source: "Graves' Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)", url: 'https://www.niddk.nih.gov/health-information/endocrine-diseases/graves-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['glossary-tsh', 'glossary-t4', 'gut-vitamin-d-cldn2', 'cortisol-chronic-dysregulation-autoimmunity'],
  },
  {
    id: 'leptin-ghrelin-overview',
    category: 'basicHealth',
    title: 'Leptin & Ghrelin: Two Opposing Hormones That Tell the Brain Whether to Eat',
    teaser: 'One says "stop," the other says "start", both are measurable, and both get disrupted in a specific, counterintuitive way in obesity.',
    summary:
      "Leptin, produced by fat tissue itself, and ghrelin, produced mainly by the stomach, work as an opposing pair regulating appetite and long-term energy balance. Leptin is the \"stop eating, energy stores are adequate\" signal, acting on the hypothalamus to suppress appetite; ghrelin is the \"start eating\" signal, rising before meals and falling after. Together they're a physiological feedback system meant to keep body weight relatively stable over time, not just a single meal's worth of hunger.",
    citations: [
      { source: 'Leptin and ghrelin dynamics: unraveling their influence on food intake, energy balance, and the pathophysiology of type 2 diabetes mellitus', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11196531/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'leptin-resistance-obesity-paradox',
    category: 'basicHealth',
    title: 'A Counterintuitive Finding: Obesity Involves Too MUCH Leptin, Not Too Little',
    teaser: 'If leptin is the "stop eating" signal, more of it should mean less hunger. In obesity, the opposite happens, the signal stops being heard at all.',
    summary:
      "This is a counterintuitive, well-documented finding worth stating plainly: in obesity, circulating leptin levels are actually elevated, not deficient, while ghrelin, the \"start eating\" hormone, runs lower than expected. The problem isn't a leptin shortage; it's leptin resistance, the body's own cells becoming desensitized to a hormone that's chronically present at high levels, through several proposed mechanisms including impaired leptin transport across the blood-brain barrier and receptor desensitization from constant exposure, a similar pattern to how insulin resistance develops from chronically elevated insulin. The practical consequence: leptin resistance produces reduced satiety and drives further weight gain, a self-reinforcing cycle that a simple \"eat less\" framing misses entirely, since the body's own internal fullness signal has effectively stopped registering correctly.",
    citations: [
      { source: 'Leptin and Obesity: Role and Clinical Implication', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8167040/' },
    ],
    overallTier: 'strong',
    relatedIds: ['leptin-ghrelin-overview', 'mito-visceral-fat-treg-depletion'],
  },
  {
    id: 'estrogen-progesterone-cycle',
    category: 'basicHealth',
    title: 'Estrogen & Progesterone: A Sequential Partnership Across the Menstrual Cycle',
    teaser: "Estrogen leads the first half of the cycle, progesterone the second, a predictable handoff that perimenopause, covered next, eventually disrupts.",
    summary: "Estrogen and progesterone work in a sequential partnership across a normal menstrual cycle, not simultaneously at constant levels. Estrogen dominates the first half (the follicular phase), rising to trigger ovulation; progesterone then takes over in the second half (the luteal phase), produced by the corpus luteum after ovulation, thickening the uterine lining to support a potential pregnancy and helping regulate mood and body temperature along the way. Beyond reproduction, estrogen shapes bone health, cardiovascular function, and, as the gut-microbiome research separately documents, gut-barrier integrity through the CLDN2 tight-junction gene, a different, independently-discovered mechanism from its reproductive role.",
    citations: [
      { source: 'Steroid Hormone Secretion Over the Course of the Perimenopause: Findings From the Swiss Perimenopause Study', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8712488/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-vitamin-d-cldn2'],
  },
  {
    id: 'estrogen-progesterone-perimenopause',
    category: 'basicHealth',
    title: 'Perimenopause: A Multi-Year Shift Toward Estrogen Dominance, Not a Simple Decline of Both Hormones Together',
    teaser: 'Progesterone drops first and further, a specific imbalance, not just "hormones going down," and it can last 6-10 years before menopause itself.',
    summary: "Perimenopause is a multi-year transition (commonly 6-10 years) that begins with subtle changes in cycle length and ends 12 months after the final menstrual period. The specific hormonal shift isn't simply \"both hormones declining together\": more eggs get recruited and stimulated per cycle during this transition, producing higher-than-normal estrogen levels alongside lower-than-normal progesterone, since more cycles become anovulatory (no egg released) or have a shortened luteal phase, meaning less progesterone gets made at all. This shifted estrogen-to-progesterone balance is the documented driver behind many perimenopausal symptoms (hot flashes, sleep disruption, mood changes), not simply low hormones across the board. The Self Advocacy research already covers the counterintuitive finding that a full hormone panel usually isn't what actually confirms perimenopause is happening, symptom pattern and menstrual-cycle change are the more reliable signal, covered in depth there rather than repeated here.",
    citations: [
      { source: 'Steroid Hormone Secretion Over the Course of the Perimenopause: Findings From the Swiss Perimenopause Study', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8712488/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-sex-hormones-menopause', 'estrogen-progesterone-cycle'],
  },
  {
    id: 'testosterone-overview-function',
    category: 'basicHealth',
    title: 'Testosterone: Roles Well Beyond Reproduction, in Metabolism, Mood, and Cardiovascular Health',
    teaser: 'Not just a reproductive hormone, research links it directly to metabolic, psychological, and cardiovascular function too.',
    summary:
      "Testosterone, produced primarily in the testes (and in smaller amounts by the ovaries and adrenal glands), is central to sperm production, sexual desire, and secondary sexual characteristics (muscle mass, bone density, body hair), but its reach extends well past reproduction: it contributes significantly to metabolic regulation, psychological well-being, and cardiovascular function too, a broader role than its popular reputation as purely a reproductive hormone suggests.",
    citations: [
      { source: 'Aging and androgens: Physiology and clinical implications, PMID 36459352', url: 'https://pubmed.ncbi.nlm.nih.gov/36459352/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'testosterone-age-decline-real-data',
    category: 'basicHealth',
    title: 'Testosterone Decline With Age Is Gradual, and Common, With a Direct Connection to The Prostate Research',
    teaser: 'By 70, roughly 30% of men are testosterone deficient. By 80, roughly half are. And research links low testosterone to elevated disease risk of its own.',
    summary: "Testosterone decline with age is well-documented, and common, not a rare condition: total testosterone falls at a measured rate of roughly 0.4% per year in men aged 40-70, with free (biologically active) testosterone declining faster, around 1.3% per year. The cumulative prevalence is striking: roughly 20% of men over 60, 30% over 70, and up to 50% over 80 have clinically low testosterone by standard criteria. Documented health consequences of low testosterone include increased risk of diabetes, dementia, cardiovascular disease, and reduced quality of life, not simply reduced libido as popularly assumed. Worth reading directly alongside the Prostate Health category: both conditions share the same aging-male population, and testosterone-replacement decisions in men with BPH or prostate cancer risk require careful coordination with a urologist specifically, since androgens directly influence prostate tissue growth, the same mechanism the prostate research already covers for 5-alpha-reductase inhibitors working in the opposite direction.",
    citations: [
      { source: 'Prevalence of Low Testosterone According to Health Behavior in Older Adults Men', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7824172/' },
      { source: 'Understanding the Secular Decline in Testosterone: Mechanisms, Consequences, and Clinical Perspectives', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12841019/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-overview', 'prostate-medications-psa-monitoring'],
  },
  {
    id: 'hormones-tying-together',
    category: 'basicHealth',
    title: 'Hormones, Pulled Together',
    teaser: 'One shared mechanism (insulin resistance) explains four different conditions. One shared pathway (cortisol/HPA-axis) explains four different everyday habits. Hormones are where the separate research threads keep converging.',
    summary: "This category's own throughline isn't any single hormone, it's how often totally different topics turn out to run through the exact same hormonal mechanism once traced back far enough. Insulin resistance is the shared root independently found underneath Type 2 Diabetes, PCOS, MASLD, and Chronic Kidney Disease. Cortisol and the HPA axis is the shared pathway underneath alcohol, sleep disruption, high-intensity exercise, and glucose crashes, each covered as its own separate topic in the Lifestyle & Environment research, but all converging here. Leptin resistance mirrors insulin resistance's own \"too much of the signal, not too little\" shape almost exactly. And two hormone systems, thyroid hormones and testosterone, connect directly to the two most extensively built condition categories, Hashimoto's/Graves' and Prostate Health respectively, evidence the separate research threads keep arriving at the same small set of underlying biological mechanisms from different directions.",
    citations: [
      { source: 'Physiology, Endocrine Hormones, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538498/' },
    ],
    overallTier: 'strong',
    relatedIds: ['insulin-resistance-real-cluster', 'cortisol-chronic-dysregulation-autoimmunity', 'leptin-resistance-obesity-paradox', 'thyroid-hormones-overview', 'testosterone-age-decline-real-data'],
  },
];
