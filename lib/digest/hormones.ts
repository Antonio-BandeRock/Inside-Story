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
      "This is a counterintuitive, well-documented finding: in obesity, circulating leptin levels are actually elevated, not deficient, while ghrelin, the \"start eating\" hormone, runs lower than expected. The problem isn't a leptin shortage; it's leptin resistance, the body's own cells becoming desensitized to a hormone that's chronically present at high levels, through several proposed mechanisms including impaired leptin transport across the blood-brain barrier and receptor desensitization from constant exposure, a similar pattern to how insulin resistance develops from chronically elevated insulin. The practical consequence: leptin resistance produces reduced satiety and drives further weight gain, a self-reinforcing cycle that a simple \"eat less\" framing misses entirely, since the body's own internal fullness signal has effectively stopped registering correctly.",
    citations: [
      { source: 'Leptin and Obesity: Role and Clinical Implication', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8167040/' },
    ],
    overallTier: 'strong',
    relatedIds: ['leptin-ghrelin-overview', 'mito-visceral-fat-treg-depletion'],
  },
  // 2026-08-21, five entries added after fact-checking NOVA's "The Truth
  // About Fat" (2020) documentary against the peer-reviewed literature
  // its own segments draw on, direct request. None of the documentary's
  // own footage or narration is treated as a citable source itself; every
  // claim below traces to the primary study or a review of that study,
  // independently verified via WebSearch, the same discipline every other
  // entry in this file already follows. One claim from the documentary,
  // the specific ratio of visceral to subcutaneous fat in sumo wrestlers,
  // could not be traced to a dedicated peer-reviewed study (a search for
  // one came back empty), so it appears below explicitly labeled as
  // an illustrative example from the documentary and secondary science
  // journalism, kept separate from the well-established general visceral-
  // fat science it's illustrating.
  {
    id: 'leptin-discovery-ob-mice',
    category: 'basicHealth',
    title: 'Leptin Was Found by Studying Mice That Never Felt Full',
    teaser: 'A strain of mice discovered in 1950, three times the normal weight with an insatiable appetite, led to the 1994 discovery that fat itself sends a hormone signal to the brain.',
    summary: "A strain of mice with a spontaneous mutation, first identified at the Jackson Laboratory in 1950, grew to roughly three times normal body weight and never stopped eating. It took until 1994 for Jeffrey Friedman's lab at Rockefeller University to identify the actual gene behind it, cloning the mouse \"obese\" (ob) gene and its human counterpart. The gene's product, a hormone made by fat tissue itself and named leptin, is the signal that tells the hypothalamus how much stored energy the body already has. This is the finding the documentary's framing rests on: fat isn't passive storage tissue, it's an organ that actively produces hormones and communicates with the brain, on par with any gland in the body.",
    citations: [
      { source: 'Zhang Y et al. 1994, Nature: Positional cloning of the mouse obese gene and its human homologue', url: 'https://pubmed.ncbi.nlm.nih.gov/7984236/' },
      { source: 'Kershaw EE, Flier JS. 2004, J Clin Endocrinol Metab: Adipose tissue as an endocrine organ', url: 'https://pubmed.ncbi.nlm.nih.gov/15181022/' },
    ],
    overallTier: 'strong',
    relatedIds: ['leptin-ghrelin-overview', 'leptin-resistance-obesity-paradox'],
  },
  {
    id: 'lipodystrophy-fat-necessity',
    category: 'basicHealth',
    title: 'A Rare Condition Shows What Happens When the Body Cannot Store Fat At All',
    teaser: 'Lipodystrophy, an inability to store fat in the usual places, causes severe insulin resistance, dangerously high triglycerides, and a fatty liver, the opposite of what "less fat" would predict.',
    summary: 'Lipodystrophy is a group of rare genetic or acquired disorders in which the body cannot store fat normally, either across most of the body or in specific regions. Someone with lipodystrophy typically has very little visible body fat, yet develops severe insulin resistance, dangerously elevated triglycerides, and a fatty liver, the same metabolic complications usually blamed on carrying too much fat. The explanation is that fat tissue has a storage job to do: without a place to safely deposit extra energy, fat instead accumulates in the liver, muscle, and pancreas, where it disrupts those organs directly. A landmark small trial (9 patients) found that replacing the missing leptin hormone with a recombinant version, metreleptin, dropped average triglycerides by 60% and shrank liver volume by an average of 28% within four months, with several patients able to stop or sharply reduce diabetes medication. The lesson generalizes past this one rare disease: fat tissue, in the right amount and place, is doing necessary metabolic work, not simply adding risk.',
    citations: [
      { source: 'Garg A. 2011, J Clin Endocrinol Metab: Lipodystrophies, Genetic and Acquired Body Fat Disorders', url: 'https://pubmed.ncbi.nlm.nih.gov/21865368/' },
      { source: 'Oral EA et al. 2002, New England Journal of Medicine: Leptin-Replacement Therapy for Lipodystrophy', url: 'https://pubmed.ncbi.nlm.nih.gov/11856796/' },
    ],
    overallTier: 'strong',
    stageNote: 'The leptin-replacement trial itself was small (9 patients); the underlying lipodystrophy syndrome and its metabolic consequences are well characterized across a larger body of research.',
    relatedIds: ['leptin-discovery-ob-mice', 'masld-overview', 'insulin-resistance-real-cluster'],
  },
  {
    id: 'leptin-reproductive-axis',
    category: 'basicHealth',
    title: "Leptin Also Signals to the Body's Reproductive System, Not Just Appetite",
    teaser: 'A small trial gave leptin to women whose periods had stopped from very low body fat, and their reproductive hormones measurably recovered.',
    summary: "Leptin's reach goes past hunger: it also signals to the hypothalamic-pituitary-gonadal axis, the hormonal chain that governs puberty, ovulation, and menstrual cycling. Hypothalamic amenorrhea, when periods stop from very low body fat or energy availability (seen in some athletes and in low-calorie dieting), tracks closely with low leptin levels. A small trial (8 women) tested giving these women recombinant leptin directly and found measurable improvement in reproductive hormone levels and ovarian function within weeks. This is the same hormone covered above, and it means body fat isn't only a metabolic-health question, it's directly tied to fertility signaling too, worth knowing for anyone whose periods have become irregular alongside a significant, sustained drop in body fat or calorie intake.",
    citations: [
      { source: 'Welt CK et al. 2004, New England Journal of Medicine: Recombinant Human Leptin in Women with Hypothalamic Amenorrhea', url: 'https://pubmed.ncbi.nlm.nih.gov/15342807/' },
    ],
    overallTier: 'moderate',
    stageNote: 'A small trial (8 women); directly measured, but not yet the basis of an approved treatment for hypothalamic amenorrhea outside a research setting.',
    relatedIds: ['leptin-discovery-ob-mice', 'pcos-overview'],
  },
  {
    id: 'adiponectin-overview',
    category: 'basicHealth',
    title: "Adiponectin: The Fat Hormone That Runs Backward From Leptin",
    teaser: "Unlike leptin, adiponectin levels go down as body fat goes up, and higher levels are consistently linked to better insulin sensitivity and less inflammation.",
    summary: "Adiponectin is another hormone made by fat tissue, but it behaves in the opposite direction from leptin: rather than rising with body fat, adiponectin levels tend to fall as fat mass, especially visceral fat, increases. Higher adiponectin is consistently associated with better insulin sensitivity, lower inflammation, and a protective effect on blood vessels, through receptors (AdipoR1 and AdipoR2) that activate an energy-sensing enzyme (AMPK) in muscle and liver tissue. Regular exercise is independently documented to raise adiponectin levels. This is the hormone behind the documentary's sumo-wrestler segment: active wrestlers, despite very high total body fat, were reported to carry higher adiponectin than their size alone would predict, illustrating why fat amount and fat function aren't the same measurement, though that specific sumo comparison traces to the documentary and secondary science journalism rather than a dedicated peer-reviewed study, kept distinct here from the well-established general adiponectin science above.",
    citations: [
      { source: 'Kadowaki T, Yamauchi T. 2005, Endocrine Reviews: Adiponectin and Adiponectin Receptors', url: 'https://pubmed.ncbi.nlm.nih.gov/15897298/' },
    ],
    overallTier: 'strong',
    stageNote: 'The adiponectin mechanism itself is well established; the sumo-wrestler illustration specifically is weak, documentary-sourced, and not independently verified here in a dedicated peer-reviewed study.',
    relatedIds: ['mito-sugar-visceral-fat-cytokine-chain', 'glossary-visceral-fat', 'type2-metabolic-syndrome-cluster', 'gout-metabolic-cluster-connection'],
  },
  {
    id: 'leptin-autoimmune-inflammation',
    category: 'basicHealth',
    title: 'Leptin Tilts the Immune System Toward Inflammation, With Direct Relevance Across Several Tracked Conditions',
    teaser: 'The same hormone that signals fullness also promotes the Th17 immune response and suppresses the regulatory T cells that keep the immune system from attacking the body, a documented mechanistic link to autoimmune disease activity.',
    summary: "Beyond appetite and reproduction, leptin also directly signals to immune cells: it promotes Th1 and Th17 immune responses (both implicated in autoimmune tissue damage) and suppresses regulatory T cells, the immune cells that normally keep the immune system from attacking the body's own tissue. A 2017 review in a major rheumatology journal traces this mechanism specifically through rheumatoid arthritis, lupus, and multiple sclerosis, the three autoimmune conditions where the leptin-immune connection is most directly studied so far. This is the same regulatory-T-cell mechanism the Hashimoto's research already documents separately, depleted specifically in visceral fat and restorable through a reinfusion experiment (see the linked entry). The honest caveat: this is a mechanistically grounded and active area of research, not yet a settled treatment target, and it is not evidence that body fat itself causes autoimmune disease, only that the hormones fat tissue produces are one input into how active an already-present autoimmune condition runs. Worth knowing directly across every autoimmune condition tracked in this app, not just the three named above, since Th17/regulatory-T-cell balance is shared underlying immune biology, not a mechanism unique to any single disease.",
    citations: [
      { source: 'Abella V et al. 2017, Nature Reviews Rheumatology: Leptin in the interplay of inflammation, metabolism and immune system disorders', url: 'https://pubmed.ncbi.nlm.nih.gov/28053336/' },
    ],
    overallTier: 'moderate',
    stageNote: 'Most directly documented in rheumatoid arthritis, lupus, and multiple sclerosis specifically; extension to every other tracked autoimmune condition is a reasonable mechanistic inference from shared Th17/regulatory-T-cell biology, not yet individually confirmed disease-by-disease.',
    relatedIds: ['mito-visceral-fat-treg-depletion', 'mito-visceral-fat-treg-reinfusion', 'leptin-resistance-obesity-paradox'],
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
    relatedIds: ['prostate-testosterone-nutrients-comparison'],
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
