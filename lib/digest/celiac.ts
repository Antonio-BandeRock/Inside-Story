import type { DigestEntry } from './types';

// Celiac Disease -- 11 entries, added 2026-08-08 as this app's sixth real
// condition, next in the same priority order every condition before it
// followed. Built with real self-advocacy content included from the start,
// the same lesson already applied to Graves' and Type 1 Diabetes.
//
// Celiac is a genuinely different kind of condition from every one built
// so far in one specific way: for Hashimoto's, RA, psoriasis, and even
// T1D, diet is one real lever among several (medication, exercise,
// screening). For celiac disease, a strict, lifelong gluten-free diet is
// the entire treatment -- there is no medication that substitutes for it.
// That changes what "food-friendliness" even means here: the real, hard
// questions aren't which foods help or hurt at the margins, they're how
// much cross-contamination actually matters, whether oats are safe, what
// a gluten-free diet itself gets nutritionally wrong if not managed
// carefully, and how long real healing actually takes.
//
// This app's own Gut & Microbiome category already carries the central
// mechanism (gliadin, zonulin, intestinal permeability) that celiac
// disease was the original research population for -- this category
// doesn't re-explain that mechanism, it cross-links back to it and covers
// what's specific to actually living with and being diagnosed with celiac
// disease itself.
//
// Every citation here was independently verified via WebSearch before
// being written in, the same discipline the rest of this Digest already
// holds to.
export const CELIAC_ENTRIES: DigestEntry[] = [
  {
    id: 'celiac-overview',
    category: 'celiac',
    title: 'Celiac Disease: The One Condition Where Diet Is the Entire Treatment',
    teaser: 'No medication substitutes for a strict gluten-free diet here. That makes the practical questions different from every other condition.',
    summary: "Celiac disease is an autoimmune reaction to gluten, a protein in wheat, barley, and rye, that damages the lining of the small intestine, specifically the villi responsible for absorbing nutrients. Unlike every other condition built out so far, there's no medication that treats celiac disease itself. A strict, lifelong gluten-free diet is the entire treatment, which means the practical questions here are different in kind from \"does this food help or hurt at the margins.\" They're about how strict is strict enough, whether trace cross-contamination matters, whether oats are safe, and what a gluten-free diet itself can get nutritionally wrong if it isn't managed carefully. The Gut & Microbiome category already covers the mechanism (gliadin, zonulin, intestinal permeability) that celiac disease was the original research population for. This category covers what's specific to actually living with and being diagnosed with the disease itself.",
    citations: [
      { source: 'Celiac Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/celiac-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-zonulin-gliadin', 'b12-absorption-mechanism', 'vitamine-deficiency-real-causes'],
  },
  {
    id: 'celiac-diagnostic-panel',
    category: 'celiac',
    title: 'Diagnostic Testing Requires Still Eating Gluten. Going Gluten-Free First Is the Single Most Common Mistake.',
    teaser: 'Every antibody and biopsy test can turn falsely negative within weeks of cutting gluten out, before a diagnosis is even confirmed.',
    summary:
      "Celiac disease testing has a specific trap that catches a lot of people: every diagnostic test, from blood antibodies to a biopsy, requires actively eating gluten at the time of testing, and stopping gluten beforehand can cause a false negative within weeks. The standard first test is tTG-IgA (tissue transglutaminase antibody), almost always paired with a total IgA measurement, since IgA deficiency, itself associated with celiac disease, can cause a false negative on the antibody test alone. EMA (endomysial antibody) is a highly specific confirming test. HLA-DQ2/DQ8 genetic testing can't diagnose celiac disease on its own, since up to 25-30% of the general population carries one or both genes without ever developing the disease, but a negative result on both genes can essentially rule celiac disease out. A 2025 European guideline confirmed a biopsy remains required for most adult diagnoses, though a very high antibody level combined with a positive EMA and positive genetic result can be enough on its in selected pediatric cases. For anyone who already went gluten-free before ever getting properly tested, a structured \"gluten challenge,\" eating gluten again under medical guidance for long enough to let the antibodies and intestinal changes reappear, is the honest path to an accurate diagnosis, not a diagnosis assumed from symptom improvement alone.",
    citations: [
      { source: 'Celiac Disease Screening, Celiac Disease Foundation', url: 'https://celiac.org/about-celiac-disease/screening-and-diagnosis/screening/' },
      { source: 'Celiac disease diagnosis: transglutaminase, duodenal biopsy and genetic tests correlations', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11390444/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-red-flags-workup'],
  },
  {
    id: 'celiac-cross-contamination',
    category: 'celiac',
    title: 'The 20ppm Standard, and What Actually Breaks It in a Kitchen',
    teaser: 'Roughly a fifth of products labeled gluten-free measured over the legal threshold, though dangerous contamination turned out much rarer than that.',
    summary:
      "Gluten-free food labeling in most places is legally defined as under 20 parts per million (ppm) of gluten, and individual sensitivity thresholds run even lower, roughly 10-50 milligrams of gluten total. Testing of products labeled or intended to be gluten-free found about 20% measured over that 20ppm legal standard, a common labeling gap, though clinically significant contamination (over 200ppm, enough to reliably cause a reaction) showed up in under 1% of samples, meaningfully rarer than the labeling-compliance gap alone would suggest. Kitchen-practice research found one specific, common mistake: cooking gluten-free pasta in water previously used for regular pasta consistently pushed gluten content over the 20ppm line, but the same research found even a simple rinse of the pasta or the pot afterward was enough to bring it back down to a safe level, a low-effort fix for a common source of contamination.",
    citations: [
      { source: 'Celiac Disease: Risks of Cross-Contamination and Strategies for Gluten Removal in Food Environments', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10888188/' },
      { source: 'Risk of Gluten Cross-Contamination Due to Food Handling Practices: A Mini-Review', url: 'https://pubmed.ncbi.nlm.nih.gov/38674888/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'celiac-oats-controversy',
    category: 'celiac',
    title: "Oats: Safe for Most, and a Separate Reason Beyond Contamination for the Rest",
    teaser: 'Oats carry their gluten-like protein, and a minority of celiac patients react to it even when the oats themselves are completely uncontaminated.',
    summary:
      "Oats are naturally gluten-free, but the oats-and-celiac-disease question is more complicated than that fact alone suggests, and for two separate reasons. The first is ordinary cross-contamination: oats are frequently grown, harvested, or processed alongside wheat, making contamination a common risk unless a product is specifically certified gluten-free. The second is real and separate from contamination entirely: oats contain avenin, their gluten-like protein, and a minority of celiac patients react to avenin itself, even in laboratory-confirmed, completely uncontaminated pure oats. Research finds pure oats are well-tolerated by most celiac patients at moderate amounts (roughly 20-25 grams a day for children, 50-70 grams for adults), and even in the studies where some patients reacted to purified avenin with symptoms, no actual intestinal damage was found in those reactors, a reassuring, if not fully resolved, detail. The honest, practical takeaway: certified gluten-free oats are a reasonable thing to try, but worth introducing carefully and watching for a personal reaction, not assumed universally safe just because they're gluten-free by definition.",
    citations: [
      { source: 'To Be Oats or Not to Be? An Update on the Ongoing Debate on Oats for Patients With Celiac Disease', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6775206/' },
      { source: 'A small subset of those with celiac disease react to the protein in oat, study confirms', url: 'https://www.beyondceliac.org/research-news/a-small-subset-of-those-with-celiac-disease-react-to-the-protein-in-oat-study-confirms/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'celiac-gf-diet-nutritional-pitfalls',
    category: 'celiac',
    title: "A Gluten-Free Diet Isn't Automatically a Healthier One. Data on What Commercial GF Products Get Wrong.",
    teaser: 'Market research found gluten-free products running lower in protein and fiber, higher in sugar and saturated fat, and costing up to 4x more.',
    summary:
      "Going gluten-free is medically necessary for celiac disease, but it isn't automatically a nutritional upgrade, and market research backs that up directly. Comparing gluten-free products against their gluten-containing equivalents found the gluten-free versions running measurably lower in protein and fiber while carrying more saturated fat, sugar, and salt, largely because they're typically built from refined starches rather than whole grains. Broader nutritional research on the diet extends the concern: adherence to a gluten-free diet is linked to lower fiber intake and documented deficiencies in iron, folate, vitamin B12, vitamin D, calcium, zinc, and magnesium, made worse by the fact that gluten-free products aren't required to be fortified with these nutrients the way many gluten-containing staples (fortified bread and cefor instance) already are. On top of the nutritional gap, market pricing data found gluten-free products running 46% to as much as 443% more expensive than their gluten-containing counterparts. None of this is a reason to avoid a gluten-free diet, medically necessary for celiac disease regardless. It's a practical reason a gluten-free diet benefits from active nutritional planning (whole foods, not just gluten-free packaged substitutes) rather than being assumed automatically balanced just because it's medically required.",
    citations: [
      { source: 'Nutritional quality and costs of gluten-free products: a case-control study of food products on the Norwegian market', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8009084/' },
      { source: 'Gluten free diet and nutrient deficiencies: A review', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0261561416300887' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-bone-density'],
  },
  {
    id: 'celiac-villi-healing-timeline',
    category: 'celiac',
    title: 'How Long Does the Gut Actually Take to Heal? A Age-Dependent Answer',
    teaser: 'Symptoms often improve within weeks. The actual intestinal lining takes far longer, and research found age changes how much healing happens at all.',
    summary:
      "Starting a gluten-free diet often brings symptom relief within days to a few weeks, but that's a different timeline from the intestinal lining actually healing underneath. Research on children and younger adults found the small intestine typically fully healed within 3 to 6 months. For older adults, that same healing can take up to 2 years, and a specific finding: research tracking recovery by age found people between 30 and 60 showing real but incomplete recovery, while people over 60 showed no statistically significant healing at all in the same studies. Looking at recovery rates over time rather than by age alone, research found only about 34% of adults reached full mucosal healing within 2 years, rising to about 66% by 5 years, meaning a meaningful share of adults on a strict gluten-free diet still show some persistent villous damage well beyond the timeline most people expect. None of this means the diet isn't working. It means healing is a slow, individual process, not a switch that flips once symptoms improve.",
    citations: [
      { source: 'Mucosal Healing in Celiac Disease: Villous Architecture and Immunohistochemical Features in Children on a Long-Term Gluten Free Diet', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9504881/' },
      { source: 'Outcomes in Adults with Celiac Disease Following a Gluten-Free Diet', url: 'https://www.mdpi.com/2077-0383/14/14/5144' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'celiac-refractory-celiac',
    category: 'celiac',
    title: 'When Symptoms Persist Despite a Strict Diet: A Rare, Named Condition',
    teaser: 'Under 0.5% of adults with celiac disease don\'t respond to diet alone, and ordinary cross-contamination is the first thing to rule out.',
    summary:
      "For the large majority of people with celiac disease, a strict gluten-free diet resolves both symptoms and, eventually, intestinal healing. A rare subset doesn't respond that way: refractory celiac disease, persistent villous damage and symptoms despite a verified, strict gluten-free diet with no ongoing gluten exposure, affects under 0.5% of adult celiac patients. This is a named, medically distinct condition, not just \"celiac disease that's hard to manage,\" and it carries its risk of malnutrition and impaired bone health beyond what typical, diet-responsive celiac disease involves. Knowing it exists means persistent symptoms get investigated properly (ruling out ongoing hidden cross-contamination first, since that's a far more common explanation) rather than either assumed to be refractory disease prematurely or dismissed as the diet simply not working hard enough.",
    citations: [
      { source: 'The Dietary and Non-Dietary Management of Osteoporosis in Adult-Onset Celiac Disease: Current Status and Practical Guidance', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9654202/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['celiac-refractory-type1-vs-type2', 'celiac-villi-healing-timeline'],
  },
  {
    id: 'celiac-bone-density',
    category: 'celiac',
    title: 'Bone Density: A Common Finding at Diagnosis, With a Recommended Screening Age',
    teaser: 'Over half of newly diagnosed adults show reduced bone density. A specific age is now recommended for a baseline scan.',
    summary:
      "Reduced bone density is common at celiac disease diagnosis, not a rare complication. Research finds osteopenia or osteoporosis in an estimated 38% to 72% of newly diagnosed patients, with decreased bone mineral density showing up in over half of newly diagnosed adults specifically, driven by the same malabsorption (of calcium and vitamin D, among other nutrients) that damaged villi cause before treatment starts. A specific, actionable recommendation came out of a 2025 study: bone mineral density screening at age 45 for people with celiac disease, given a documented increased risk of lumbar osteoporosis by middle age. The encouraging part: in patients confirmed celiac and started on a strict gluten-free diet, bone density measurably responds to treatment as the gut heals and nutrient absorption improves, meaning this isn't a permanent, fixed loss the way some bone-density findings in other conditions can be. Worth asking for a DEXA scan at diagnosis regardless of age, and again around 45 if not already screened, rather than assuming bone health is fine just because nothing hurts yet.",
    citations: [
      { source: 'Prevalence of osteoporosis and osteopenia in men and premenopausal women with celiac disease: a systematic review', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6504166/' },
      { source: 'The Dietary and Non-Dietary Management of Osteoporosis in Adult-Onset Celiac Disease: Current Status and Practical Guidance', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9654202/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-gf-diet-nutritional-pitfalls', 'ra-advocacy-bone-density', 'lupus-glucocorticoid-osteoporosis'],
  },
  {
    id: 'celiac-hashimotos-comorbidity',
    category: 'celiac',
    title: "Celiac Disease and Hashimoto's: A Quantified Overlap",
    teaser: 'Autoimmune thyroid disease shows up roughly twice as often in celiac patients as in the general population, in a large case-control study.',
    summary: "The Type 1 Diabetes category already covers celiac disease's overlap with T1D. The overlap with Hashimoto's specifically is just as real and, in at least one pediatric comparison, even more pronounced. A large case-control study of 8,489 participants found autoimmune thyroid disorders present in 15.4% of celiac patients compared to 7.5% of controls, roughly double the risk. A separate pediatric study found celiac disease prevalence among children with autoimmune thyroiditis running 1.92 times higher than among children with type 1 diabetes, meaning the celiac-Hashimoto's connection specifically may be even stronger than the celiac-T1D connection already covered elsewhere. The proposed explanation is a shared genetic background predisposing someone to autoimmune attack broadly, not a coincidence. The practical takeaway: anyone diagnosed with either condition has a quantified reason to ask about screening for the other, not just watch for symptoms and hope they'd notice.",
    citations: [
      { source: 'Autoimmune Thyroid Disorders Are More Prevalent in Patients with Celiac Disease: A Retrospective Case-Control Study', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9605329/' },
      { source: 'Celiac Disease and Autoimmune Thyroid Disease: The Two Peas in a Pod', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9312543/' },
    ],
    overallTier: 'strong',
    relatedIds: ['type1-celiac-comorbidity', 'other-type1-diabetes'],
  },
  {
    id: 'celiac-tying-together',
    category: 'celiac',
    title: 'What Actually Holds Up for Celiac Disease, Pulled Together',
    teaser: 'A condition where the diet itself needs careful nutritional attention, plus an age-dependent healing timeline.',
    summary: "Line up everything in this category and celiac disease reads differently in shape from every condition already built, because diet here isn't one lever among several, it's the entire treatment. The practical strictness questions have specific answers: cross-contamination matters below the level most people would guess, but a simple rinse fixes the single most common kitchen mistake; oats are safe for most people at moderate amounts, but a minority react to the oat protein itself, not just contamination; and the diet itself needs active nutritional attention, since market data shows commercial gluten-free products running lower in fiber and protein and higher in sugar and cost than their gluten-containing equivalents. Healing takes honest time, faster and more complete in children and younger adults than in people diagnosed later in life, a slow recovery that shouldn't get mistaken for the diet not working. The two self-advocacy entries carry the same kind of precise numbers the other conditions have already established matter: the testing sequence that requires still eating gluten, and a specific screening age (45) for bone density most people wouldn't otherwise know to ask about. And the quantified overlap with both Hashimoto's and Type 1 Diabetes is a direct, practical reason a celiac diagnosis is worth pairing with a broader autoimmune screening conversation, not treated as an isolated finding.",
    citations: [
      { source: 'Celiac Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/celiac-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-cross-contamination', 'celiac-oats-controversy', 'celiac-gf-diet-nutritional-pitfalls', 'celiac-villi-healing-timeline', 'celiac-diagnostic-panel', 'celiac-bone-density', 'celiac-hashimotos-comorbidity'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'celiac-marsh-staging',
    category: 'celiac',
    title: "Celiac Damage Has a Formal Staging Scale, From Normal Tissue to Total Villous Atrophy",
    teaser: 'The Marsh scale runs 0 to 3c, a biopsy-based measure of exactly how much of the gut lining\'s absorbing surface has actually been lost.',
    summary:
      "Celiac disease's own tissue damage is measured with the Marsh (or Marsh-Oberhuber) classification, a biopsy-based staging scale still used today. Marsh 0 is normal, healthy intestinal lining. Marsh 1 shows an increased number of immune cells in the tissue (intraepithelial lymphocytes) with the villi themselves still intact. Marsh 2 adds crypt hyperplasia, the gut's own glands enlarging in response to ongoing damage. Marsh 3, split into 3a (mild), 3b (moderate), and 3c (total villous atrophy), is where the absorbing surface of the small intestine actually starts flattening and disappearing, the direct physical mechanism behind celiac's malabsorption and nutrient-deficiency risks already covered elsewhere in this category. This staging scale is exactly what a biopsy result is reporting when it comes back with a Marsh number, rather than just a \"positive\" or \"negative.\"",
    citations: [
      { source: 'Celiac disease: histology-differential diagnosis-complications. A practical approach, PMC7931573', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7931573/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-villi-healing-timeline'],
  },
  {
    id: 'celiac-systemic-effects-real-data',
    category: 'celiac',
    title: "Celiac Disease Reaches Well Past the Gut, Documented Neurological, Skin, and Reproductive Effects",
    teaser: "A pathognomonic skin rash, neurological symptoms including seizures, and effects on fertility in both women and men, celiac's reach extends far beyond digestion.",
    summary: "Celiac disease's non-digestive effects are wide-ranging, a direct consequence of the malabsorption Marsh-stage gut damage causes. Dermatitis herpetiformis, an intensely itchy, blistering rash, is real and pathognomonic for celiac, meaning its presence alone can point to the diagnosis even with zero digestive symptoms present. Documented neurological effects include numbness, motor weakness, loss of coordination, and, in severe cases, seizures. Osteoporosis and osteopenia, already covered in the bone-density self-advocacy entry, trace directly to malabsorbed calcium and vitamin D. Reproductive effects are real and significant in both sexes: delayed menarche, amenorrhea, and infertility in women, and impotence and infertility in men, with impaired vitamin E absorption specifically implicated as one contributing mechanism. Global prevalence data (1.4% by antibody testing, 0.7% biopsy-confirmed) also shows a sex and age skew: roughly 0.6% in women versus 0.4% in men, and higher in children (0.9%) than adults (0.5%).",
    citations: [
      { source: 'Celiac Disease, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK441900/' },
      { source: 'Global Prevalence of Celiac Disease: Systematic Review and Meta-analysis, PMID 29551598', url: 'https://pubmed.ncbi.nlm.nih.gov/29551598/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-bone-density'],
  },
  {
    id: 'celiac-history-milestones',
    category: 'celiac',
    title: "Celiac's Own History: A Wartime Bread Shortage Accidentally Solved a Medical Mystery",
    teaser: '1888, 1940s, 1952, a remarkable discovery story: the actual trigger food was identified because of an accidental wartime experiment nobody intended to run.',
    summary:
      "Celiac disease's modern medical description dates to 1888, when physician Samuel Gee first described the condition and correctly guessed, without proof, that diet held the cure, even trying misguided treatments (including a Dutch mussel-based diet) that never worked because he hadn't yet identified wheat as the actual trigger. The breakthrough came from an unplanned, remarkable wartime natural experiment: Dutch pediatrician Willem Dicke noticed that celiac mortality at his own hospital dropped to zero during a severe World War II bread shortage in the Netherlands, when wheat simply wasn't available to eat. His 1950 doctoral thesis formally established that removing wheat, rye, and oats produced dramatic improvement, identifying gluten, a specific protein component, as the actual toxic trigger. A 1952 study from an English medical team independently confirmed the same finding. This is an unusual origin story in medical history: the key discovery came from an accidental, real-world dietary experiment nobody designed on purpose, not a planned clinical trial.",
    citations: [
      { source: 'History of Coeliac Disease. Dicke and the Origin of the Gluten-Free Diet', url: 'https://link.springer.com/chapter/10.1007/978-94-015-7943-8_1' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'celiac-pregnancy-fertility-real-data',
    category: 'celiac',
    title: 'Untreated Celiac Carries a Quantified Miscarriage and Infertility Risk, and a Reassuring Reversal Once Diagnosed',
    teaser: 'Data finds an 8.9-fold higher miscarriage risk with undiagnosed celiac, and that same elevated risk fully disappears once someone starts a gluten-free diet.',
    summary:
      "This is one of the more striking, and ultimately hopeful findings in this whole category. Research finds women with undiagnosed celiac disease experience 11 more miscarriages and 1.62 more stillbirths per 1,000 pregnancies than the general population, with a 8.9-fold higher overall miscarriage risk, and up to 50% experiencing at least one miscarriage or a poor pregnancy outcome. Fertility itself is affected too: women become pregnant less often in the years before diagnosis (25 fewer pregnancies per 1,000), and research on unexplained infertility specifically found a 6-fold higher rate of undiagnosed celiac disease in that population, a reason unexplained infertility is worth celiac screening even without any digestive symptoms present. The mechanism traces to malabsorbed nutrients and to tissue transglutaminase antibodies directly interfering with embryo implantation. The reassuring finding: this whole elevated risk pattern disappeared once women started a gluten-free diet, with diagnosed and treated celiac patients showing no higher rate of pregnancy loss than anyone else.",
    citations: [
      { source: 'Fertility in Celiac Disease: The Impact of Gluten on Male and Female Reproductive Health, PMC12073710', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12073710/' },
    ],
    overallTier: 'strong',
  },

  // -- Second depth pass, 2026-08-08, extending full-parity work to the
  // first 10 non-Hashimoto's conditions. Every citation independently
  // verified via WebSearch.
  {
    id: 'celiac-dermatitis-herpetiformis',
    category: 'celiac',
    title: 'Dermatitis Herpetiformis: The Intensely Itchy Skin Rash That Is Actually Celiac Disease',
    teaser: 'A distinct, itchy blistering rash affects 15-25% of celiac patients, driven by the exact same gluten-triggered antibody response as the gut, and some people have it with no digestive symptoms at all.',
    summary: "Dermatitis herpetiformis is a distinct manifestation of celiac disease, not a separate skin condition that happens to occur alongside it. It's caused by the same underlying gluten-triggered immune process, but the specific IgA antibodies involved deposit in the skin rather than (or in addition to) the gut: epidermal transglutaminase (TG3) is the skin-specific target antigen, distinct from the tissue transglutaminase (TG2) already covered in the celiac diagnostic-panel research as the standard gut-focused test. The result is an intensely itchy, blistering rash, most classically on the elbows, knees, and buttocks. Research finds more than 90% of people with dermatitis herpetiformis also have confirmable gluten-sensitive enteropathy on biopsy, even when they have no digestive symptoms at all, and conversely, a 15-25% of people with celiac disease develop this same skin manifestation at some point. Dermatitis herpetiformis responds to the exact same gluten-free diet already covered in the celiac research, with excellent long-term prognosis once gluten is removed, and it's worth raising directly with a doctor as a possible celiac clue for anyone with an unexplained, persistently itchy, blistering rash, since it can be the very first, or only, visible sign of the disease.",
    citations: [
      { source: 'Dermatitis herpetiformis: pathognomonic transglutaminase IgA deposits in the skin and excellent prognosis on a gluten-free diet, PMID 26059085', url: 'https://pubmed.ncbi.nlm.nih.gov/26059085/' },
      { source: 'Dermatitis Herpetiformis, Celiac Disease Foundation', url: 'https://celiac.org/about-celiac-disease/related-conditions/dermatitis-herpetiformis/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-diagnostic-panel'],
  },

  // -- Volumetric depth pass, 2026-08-08, continuing full-parity work
  // beyond the second structural depth pass, working toward Hashimoto's
  // own real 176-entry depth. Every citation independently verified via
  // WebSearch.
  {
    id: 'celiac-non-celiac-gluten-sensitivity',
    category: 'celiac',
    title: 'Non-Celiac Gluten Sensitivity Is a Contested Diagnosis, Distinct From Celiac Disease Itself',
    teaser: 'Roughly 10% of people self-report gluten sensitivity, but controlled challenge studies find only 16-30% of them actually react to gluten specifically when tested blind, an honest gap between what people believe and what testing confirms.',
    summary: "Non-celiac gluten sensitivity (NCGS) is a distinct condition from celiac disease, someone with symptoms after eating gluten but without the celiac-specific antibodies or intestinal damage already covered in the diagnostic-panel and Marsh-staging research, and it remains a contested clinical entity rather than a settled diagnosis. Research finds a striking gap between self-report and confirmed cases: approximately 10% of the global population self-reports gluten or wheat sensitivity, but controlled double-blind challenge studies (where neither the patient nor the tester knows whether gluten or a placebo was actually given) find only 16-30% of self-reporting individuals actually react specifically to gluten when properly tested, with research pointing to high nocebo and placebo effects as a major confounding factor. An important nuance: emerging evidence suggests gluten may not even be the sole trigger in NCGS, with other wheat components, amylase-trypsin inhibitors, wheat germ agglutinin, and fructans among them, potentially contributing to symptoms independent of gluten itself. NCGS lacks validated diagnostic criteria or a reliable biomarker, unlike celiac disease's testable antibody and biopsy panel, meaning anyone suspecting gluten sensitivity should still be tested for celiac disease FIRST, and while still eating gluten, since a self-directed gluten-free trial before proper testing (the same trap already covered in the diagnostic-panel research) can make a true celiac diagnosis much harder to confirm later.",
    citations: [
      { source: 'Non-celiac Gluten Sensitivity: A New Clinical Entity or Growing Controversy?, PMC12932325', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12932325/' },
      { source: 'Non-celiac gluten/wheat sensitivity (NCGS), position statement of the German Society of Allergology and Clinical Immunology, PMC6153714', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6153714/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['celiac-diagnostic-panel'],
  },
  {
    id: 'celiac-dental-enamel-defects',
    category: 'celiac',
    title: 'Dental Enamel Defects Are an Often-Overlooked Clue to Undiagnosed Celiac Disease in Children',
    teaser: 'Studies find dental enamel defects in 48-94% of children with celiac disease versus a much lower rate in healthy children, enough that dentists are now encouraged to screen for celiac disease when they see the pattern.',
    summary: "Dental enamel defects are a distinctive and often-overlooked sign of celiac disease in children, sometimes appearing before a child ever shows the more familiar digestive symptoms already covered in the celiac research. Studies find these defects in a striking range, 48% to as high as 94.1% of children with celiac disease, compared to a much lower rate in healthy children in the same studies (one pilot study found 83.3% in celiac children versus 53.3% in controls; another found 61.54% versus 21.15%). Research finds these defects most commonly appear on deciduous (baby) molars and incisors, often in a symmetric pattern across the mouth, and are most consistently seen in children who developed celiac symptoms before age 7, tied to how tooth enamel actually forms during that same developmental window. Useful and actionable: clinical research now recommends that dentists specifically screen for celiac disease when they observe this pattern of enamel defects, since the connection is well-documented enough to serve as an early diagnostic clue rather than just a coincidental dental finding. This is a concrete reason for parents of a child with unexplained, symmetric enamel defects, especially alongside any other celiac risk factor like a family history or the Hashimoto's comorbidity already covered in the research, to bring it up directly with a doctor rather than treat it as a purely dental issue.",
    citations: [
      { source: 'Celiac Disease-Related Enamel Defects: A Systematic Review, MDPI Journal of Clinical Medicine', url: 'https://www.mdpi.com/2077-0383/13/5/1382' },
      { source: 'Screening for Celiac Disease in Children with Dental Enamel Defects, PMC3376764', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3376764/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-hashimotos-comorbidity'],
  },
  {
    id: 'celiac-gf-product-fortification-gap',
    category: 'celiac',
    title: 'A Legal Gap: Regular Wheat Flour Is Required by Law to Be Fortified, Gluten-Free Flour Almost Never Is',
    teaser: 'Federal law requires folic acid and iron fortification in ordinary wheat products, but that same requirement doesn\'t extend to gluten-free substitutes, and testing found only 9% of US gluten-free breads fortified with B vitamins at all.',
    summary: "This is a worth-knowing legal gap directly relevant to the gluten-free-diet nutritional pitfalls already covered in the celiac research: federal law in the United States requires manufacturers to add folic acid to wheat-based breads, cereals, flours, and pastas, and the UK legally requires wheat flour to be fortified with calcium, iron, niacin, and thiamin, but neither requirement extends to the gluten-free products that replace them. Product testing found only 9% of US gluten-free bread products fortified with thiamin, riboflavin, and niacin, iron fortification present in just 23% of gluten-free breads and in NO tested gluten-free pasta products at all. Calcium showed the same gap: gluten-free white loaves averaged 99mg of calcium per 100g compared to 177mg in wheat-based loaves, with only 27% of gluten-free loaves fortified at all versus 100% of standard wheat loaves. Someone eating gluten-free isn't just avoiding one ingredient, they're very likely also losing a legally-mandated layer of fortification most people eating regular wheat products get automatically and never think about. This directly reinforces the already-established Nutrients & Micronutrients research on B12, folate, and iron: someone managing celiac disease has a concrete, food-industry-driven reason to pay closer attention to these specific nutrients than someone eating a standard wheat-containing diet would.",
    citations: [
      { source: 'Not All Grains Are Created Equal: Gluten-Free Products Not Included in Mandatory Folate Fortification, Current Developments in Nutrition', url: 'https://cdn.nutrition.org/article/s2475-2991(22)13018-0/fulltext' },
      { source: 'Calcium and Iron Content of Cereal-Based Gluten-Free Products, PMC9321653', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9321653/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-gf-diet-nutritional-pitfalls'],
  },

  // -- Volumetric depth pass batch 3, 2026-08-08, continuing toward
  // genuine volumetric parity with Hashimoto's own depth. Every citation
  // independently verified via WebSearch.
  {
    id: 'celiac-depression-anxiety-mental-health',
    category: 'celiac',
    title: 'Celiac Disease Carries a Quantified Mental Health Burden, and a Gluten-Free Diet Only Partly Fixes It',
    teaser: 'Research finds anxiety 2.26 times more common and depression 3.36 times more common in celiac disease, with a gluten-free diet helping anxiety more consistently than it helps depression.',
    summary: "Celiac disease carries a substantially elevated mental health burden, not just a byproduct of managing a chronic illness. Meta-analysis data finds people with celiac disease at a 2.26 times higher risk of anxiety and a 3.36 times higher risk of depression compared to the general population. Pediatric research finds this burden shows up early and is underrecognized by caregivers, one study found 39% of children with celiac disease reporting clinically significant anxiety or depression concerns on their self-report, while their caregivers flagged concerns in only 7% (anxiety) and 14% (depression) of the same children, a striking gap between what a child experiences and what a parent perceives. Important and honestly nuanced: research finds a gluten-free diet associated with lower depression and anxiety overall, but the effect isn't consistent or complete, anxiety symptoms tend to improve more reliably with dietary treatment, while research finds depression often continues even once physical, digestive symptoms have resolved. This biological connection likely runs deeper than just \"living with a chronic illness is hard,\" research increasingly points to direct gut-brain mechanisms (already covered in the broader gut-microbiome research). Clinical research explicitly recommends integrating mental healthcare into celiac disease management, not treating it as a separate, unrelated concern, someone with celiac disease experiencing persistent low mood or anxiety, even after successfully going gluten-free, has an evidence-backed reason to seek dedicated mental health support alongside their dietary treatment.",
    citations: [
      { source: 'Anxiety and Depression Among Adults and Children With Celiac Disease: A Meta-Analysis of Different Psychiatry Scales, PMC11633532', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11633532/' },
      { source: 'Psychiatric and Neurological Manifestations of Celiac Disease in Adults, PMC9984242', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9984242/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-overview', 'celiac-adhd-symptoms-mixed-evidence'],
  },
  // Added 2026-08-24, fact-checking a shared Google AI Mode conversation on
  // diet's effect on ADHD and OCD. The depression/anxiety entry above
  // already covers celiac's own quantified mood-disorder burden, this entry
  // covers a distinct, separately studied question, ADHD-spectrum symptoms
  // rather than mood, and reports the evidence honestly as mixed rather
  // than settled either way.
  {
    id: 'celiac-adhd-symptoms-mixed-evidence',
    category: 'celiac',
    title: 'ADHD-Like Symptoms Track With Gluten-Free Diet Compliance in Celiac Disease, Though the Evidence Stays Mixed',
    teaser: 'Inattention and learning difficulties show up more often in celiac patients who aren\'t sticking to their gluten-free diet, but researchers reviewing the same literature find no conclusive proof that celiac disease and ADHD are directly linked.',
    summary:
      "Celiac disease and ADHD share enough surface overlap, inattention, learning difficulties, and behavioral symptoms, that the connection gets asked about often, and the honest answer is a documented association without a settled explanation. Research finds ADHD-like cognitive symptoms, along with psychosomatic complaints and poorer prosocial behavior, more common specifically in celiac patients who aren't strictly following their gluten-free diet, a correlation between diet compliance and these symptoms that held up at a statistically significant level in the underlying study. At the same time, a dedicated review asking the direct question, is there a relationship between ADHD and celiac disease, concluded there isn't yet conclusive evidence for one. Both things can be true at once: gluten exposure in an already-diagnosed celiac patient plausibly worsens inattention and related symptoms through the same intestinal and inflammatory pathways already covered in this category's research, without celiac disease being a cause of ADHD itself. Strict adherence to the existing gluten-free diet guidance already covers the actionable step here, not a separate ADHD-specific protocol.",
    citations: [
      { source: 'Research: ADHD-like symptoms in celiac disease, GIG Gluten Intolerance Group', url: 'https://gluten.org/2023/02/23/research-adhd-like-symptoms-in-celiac-disease-and-relationship-between-covid-infection-and-autoimmune-disease-development/' },
      { source: 'Association of ADHD and Celiac Disease: What Is the Evidence?, Journal of Attention Disorders', url: 'https://chadd.org/adhd-weekly/gluten-free-for-adhd-check-the-research/' },
    ],
    overallTier: 'weak',
    relatedIds: ['celiac-depression-anxiety-mental-health', 'mentalhealth-adhd-dietary-triggers', 'mentalhealth-adhd-ocd-diet-does-not-cause'],
  },
  {
    id: 'celiac-iceberg-underdiagnosis',
    category: 'celiac',
    title: 'The "Celiac Iceberg": Striking Evidence That Most Celiac Disease Cases Remain Undiagnosed',
    teaser: 'Research finds the ratio of diagnosed to undiagnosed celiac disease cases running anywhere from 1:5 to 1:8, meaning the visible, symptomatic cases people know about may be a small fraction of the whole.',
    summary: "The \"celiac iceberg\" is a widely used concept in celiac research describing a striking pattern: the visible, diagnosed cases of celiac disease represent only a small fraction of everyone who actually has it. Research finds the estimated ratio of diagnosed to undiagnosed cases running anywhere from 1:5 to 1:8, meaning for every person with a confirmed celiac diagnosis, research suggests 5 to 8 more people may have the disease without knowing it. The primary reason: only 10-20% of people with celiac disease show the classic, fully developed digestive symptoms most people associate with the condition, research finds the majority have atypical symptoms (like the iron-deficiency anemia, osteoporosis, or infertility already covered in the celiac research), only mild symptoms, or none at all. This connects directly to the concept of \"silent\" celiac disease, confirmed cases (positive antibodies, intestinal damage on biopsy) with no noticeable symptoms at all, often only discovered through screening a family member of someone already diagnosed, since celiac disease's established genetic and familial risk (already covered elsewhere) makes this a worthwhile screening trigger. This is important context for anyone with a family member diagnosed with celiac disease, or anyone with unexplained, atypical symptoms like persistent fatigue, anemia, or low bone density, testing (already covered in the diagnostic-panel research) is worth pursuing even without classic digestive symptoms, since the visible cases may be the minority.",
    citations: [
      { source: 'Recognizing the Emergent and Submerged Iceberg of the Celiac Disease: ITAMA Project—Global Strategy Protocol, PMC9227897', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9227897/' },
      { source: 'Prevalence and Morbidity of Undiagnosed Celiac Disease From a Community-Based Study, PMID 27916669', url: 'https://pubmed.ncbi.nlm.nih.gov/27916669/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-hashimotos-comorbidity'],
  },
  {
    id: 'celiac-gluten-challenge-protocol',
    category: 'celiac',
    title: 'The Specific Gluten Amount and Timeline Needed for an Accurate Celiac Test',
    teaser: 'Medical guidance calls for 3-10 grams of gluten daily, roughly 1.5-2 slices of wheat bread, for 6-8 weeks before blood testing, a specific protocol to know before assuming any celiac test result is final.',
    summary: "Getting an accurate celiac disease test requires a specific amount of gluten intake beforehand: going gluten-free too early, even briefly, is the single most common reason for a false-negative celiac test result already implied elsewhere in the diagnostic-panel research. Medical guidance recommends consuming 3 to 10 grams of gluten per day, roughly equivalent to 1.5 to 2 slices of ordinary wheat bread, for a specific duration of 6 to 8 weeks before blood antibody testing, giving the body enough time to reactivate the autoimmune antibody response the test is actually looking for. Research finds a shorter gluten challenge, at least 2 weeks, generally sufficient before an endoscopy/biopsy specifically, since that test looks directly at intestinal tissue damage rather than relying on the slower antibody response blood testing depends on. Guidance finds a gluten challenge is NOT recommended before age 5, during puberty, or during pregnancy, since research finds gluten intake during these periods can affect nutrient absorption in ways that risk contributing to growth or pregnancy complications. Anyone who has already reduced or eliminated gluten before ever being tested, a common and understandable reaction to feeling unwell, needs this specific reintroduction protocol before a test result can be trusted either way, working with a doctor to plan the challenge safely rather than either avoiding testing altogether or assuming a test taken after already cutting gluten is accurate.",
    citations: [
      { source: 'The Gluten Challenge, Beyond Celiac', url: 'https://www.beyondceliac.org/celiac-disease/the-gluten-challenge/' },
      { source: 'Gluten Challenge, Celiac Canada', url: 'https://www.celiac.ca/healthcare-professionals/diagnosis/gluten-challenge/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-diagnostic-panel'],
  },
  {
    id: 'celiac-lymphoma-malignancy-risk',
    category: 'celiac',
    title: 'A Rare Cancer Risk That Strict Diet Adherence Lowers',
    teaser: 'Enteropathy-associated T-cell lymphoma is a rare, serious complication of celiac disease, and evidence finds sticking to a gluten-free diet lowers the odds of it developing at all.',
    summary:
      "Celiac disease carries a real, if rare, elevated risk of a specific cancer: enteropathy-associated T-cell lymphoma (EATL), a malignant transformation of the same immune cells already driving the disease's intestinal damage. Research finds this and other serious complications, including refractory celiac disease, develop in a 2 to 5% of adults diagnosed with celiac disease. Identified risk factors include poor adherence to a gluten-free diet, a specific genetic profile (HLA-DQ2 homozygosity), and a late diagnosis, all pointing toward the same practical conclusion: evidence finds sticking to the diet itself measurably lowers the odds of this complication developing. EATL itself carries a serious prognosis once it does develop, and diagnosing it can be difficult, since the exact same red flags (weight loss, abdominal pain, diarrhea returning despite a strict diet) can also just mean the diet itself has slipped or another condition has been missed. This isn't meant to cause alarm over an already rare event, it's honest context for why sustained, strict adherence matters for reasons beyond day-to-day symptom control, and why new or returning symptoms after a period of feeling well are always worth raising directly rather than assumed to be a minor slip.",
    citations: [
      { source: 'The Risk of Malignancies in Celiac Disease — A Literature Review, Cancers 2021, PMID 34771450', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8582432/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-refractory-celiac', 'celiac-gf-diet-nutritional-pitfalls'],
  },
  {
    id: 'celiac-enzyme-therapy-emerging',
    category: 'celiac',
    title: 'A Emerging Enzyme Pill Aims to Catch Accidental Gluten, Not Replace the Diet',
    teaser: 'A investigational enzyme (latiglutenase) broke down 95% of gluten in the stomach in trial testing, protecting against the accidental cross-contamination this category\'s research already covers.',
    summary:
      "This category's research already covers how hard real-world cross-contamination is to avoid entirely, even with careful, strict effort. Latiglutenase (formerly ALV003) is an investigational two-enzyme therapy, taken with meals, specifically designed to break down gluten in the stomach before it can reach and damage the small intestine, an adjunct to the gluten-free diet, not a replacement for it. A controlled trial in adults with celiac disease found latiglutenase significantly protected against gluten-induced intestinal damage during a deliberate gluten challenge, with stable villus height and immune-cell counts compared to a measurable decline in the placebo group, and urine testing found it broke down 95% of ingested gluten in the stomach itself. This remains an investigational therapy, still working through the trial process rather than an approved, available treatment, and its intended real-world role is protecting against accidental, low-level gluten exposure (a shared fryer, an unlabeled sauce), not permitting someone to eat gluten freely. This is most relevant for anyone whose biggest remaining risk is the accidental exposure this category's cross-contamination research already names, rather than a deliberate dietary choice.",
    citations: [
      { source: 'Latiglutenase Protects the Mucosa and Attenuates Symptom Severity in Patients With Celiac Disease Exposed to a Gluten Challenge, Gastroenterology 2022', url: 'https://www.gastrojournal.org/article/S0016-5085(22)00901-5/fulltext' },
    ],
    overallTier: 'moderate',
    relatedIds: ['celiac-cross-contamination'],
  },
  {
    id: 'celiac-pediatric-vs-adult-presentation',
    category: 'celiac',
    title: 'Celiac Disease Looks, and Gets Diagnosed, Differently in Children Than in Adults',
    teaser: 'A direct comparison found classic gut symptoms in 79% of children with celiac disease, but only 14% of adults, evidence for why the same disease is missed far more often once someone is grown.',
    summary:
      "This category's already-covered iceberg-underdiagnosis research names how common a missed celiac diagnosis is. A direct age comparison explains a meaningful part of why: classic, textbook celiac symptoms (chronic diarrhea, growth failure, malabsorption) were the presenting picture in a 79% of children, but only 14% of adults, with adults instead presenting far more often with nonspecific symptoms (anemia in 42% of adults versus 19% of children, plus vague abdominal pain and chronic fatigue). Lab and biopsy findings track the same pattern: tissue transglutaminase antibodies were positive in a 88% of children versus 31% of adults, and visible villous atrophy on biopsy in 95% of children versus 33% of adults, meaning even the objective test results themselves look different by age, not just the symptoms. Research also finds coexisting autoimmune disease (type 1 diabetes, Sjögren's, dermatitis herpetiformis) far more common in adults with celiac (42%) than in children (5%), and a longer average diagnostic delay in adolescents and adults (4.9 years) than in children (3.5 years). An adult with nonspecific symptoms, anemia, fatigue, or vague digestive discomfort, has legitimate standing to ask about celiac testing specifically, even without the more classic picture a doctor might expect from having seen it more often in children.",
    citations: [
      { source: 'The Spectrum of Differences between Childhood and Adulthood Celiac Disease, Nutrients 2015, PMID 26506381', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4632446/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-iceberg-underdiagnosis', 'celiac-diagnostic-panel'],
  },
  {
    id: 'celiac-global-hla-dq2-gradient',
    category: 'celiac',
    title: "Celiac Disease Follows a Genetic Map, From Nearly 6% in One Population to Virtually Absent in Another",
    teaser: 'A specific genetic marker for celiac disease, HLA-DQ2, is common across Western Sahara, Europe, and the Middle East, declines steadily moving east, and is virtually absent in Japan.',
    summary:
      "Celiac disease prevalence maps closely onto a specific inherited genetic marker, HLA-DQ2, and where that marker is common or rare in a given population's ancestry explains much of why celiac rates differ so widely by region. A study of 989 Saharawi children (Western Sahara) found a 5.6% celiac prevalence, among the highest ever documented anywhere in the world, tied directly to a very high frequency of the DQ2 gene variant in that population. HLA-DQ2 frequency runs at 20-30% across Western Europe and stays relatively high through Northern Africa, the Middle East, and Central Asia, then declines steadily moving further east, with a near-total absence in Japan. Seroprevalence data confirms the pattern in practice: the Middle East (1.4%) and South Asia (1.2%) both run measurably higher than East Asia (0.06%), and celiac disease is rare in the Far East and sub-Saharan Africa, where wheat and other gluten grains have also never been dietary staples the way they are further west. Celiac disease being reported as rare in a given home region can reflect a difference in inherited genetic risk and traditional diet, not necessarily under-diagnosis, though rising wheat consumption in newly-Westernizing diets is a separate factor worth watching in any population regardless of its baseline genetic risk.",
    citations: [
      { source: 'Prevalence of celiac disease in low and high risk population in Asia-Pacific region: a systematic review and meta-analysis, PMC7841177', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7841177/' },
      { source: 'Celiac disease: Prevalence, diagnosis, pathogenesis and treatment, World Journal of Gastroenterology', url: 'https://www.wjgnet.com/1007-9327/full/v18/i42/6036.htm' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-overview'],
  },
  {
    id: 'celiac-firstdegree-relative-screening',
    category: 'celiac',
    title: 'A Celiac Diagnosis Is a Direct Reason to Screen the Rest of the Family',
    teaser: 'Roughly 1 in 14 first-degree relatives of a celiac patient also has celiac disease, more than 10 times the general-population rate, and guidelines recommend screening every one of them.',
    summary:
      "A celiac diagnosis in one family member is direct medical information about everyone else's risk, not just that one person's. A meta-analysis of 34 studies and roughly 10,000 first-degree relatives found celiac disease present in 11% by blood-antibody testing and 7% by biopsy confirmation, numbers that translate to roughly 1 in 14 first-degree relatives (parents, siblings, children) also having the disease, with the highest rates found among a patient's own daughters and sisters. This runs well above the general-population prevalence already covered elsewhere in this category. A important complication: an estimated 34% of these biopsy-confirmed relative cases were completely asymptomatic, meaning waiting for symptoms to prompt testing would miss a substantial share of them. Guidance from the American College of Gastroenterology reflects this directly: every first-degree relative of a confirmed celiac patient should be screened, not just relatives who happen to report symptoms. A documented gap exists between this guidance and everyday practice, one study found physicians don't routinely recommend this screening to their patients' own family members, meaning the responsibility often falls on the diagnosed person to raise it directly rather than assume it will happen automatically.",
    chart: {
      title: 'Celiac prevalence: general population vs. First-degree relatives',
      unit: '%',
      data: [
        { label: 'General population', value: 1 },
        { label: 'First-degree relatives (biopsy-confirmed)', value: 7 },
        { label: 'First-degree relatives (antibody-positive)', value: 11 },
      ],
      sourceNote: 'Meta-analysis of 34 studies, ~10,000 first-degree relatives; celiac.com / Gastroenterology Advisor coverage',
    },
    citations: [
      { source: 'High Rates of Celiac Disease Among First-Degree Relatives, Celiac.com', url: 'https://www.celiac.com/celiac-disease/high-rates-of-celiac-disease-among-first-degree-relatives-r4906/' },
      { source: 'Screening for celiac disease in 1st degree relatives: a 10-year follow-up study, PMC3941942', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3941942/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-diagnostic-panel', 'celiac-iceberg-underdiagnosis'],
  },
  {
    id: 'celiac-global-italy-screening-vs-us',
    category: 'celiac',
    title: "Italy Now Mandates Nationwide Celiac Screening, and What It Found Confirms The Iceberg Research",
    teaser: "Italy's national mass-screening program found celiac disease in 1.6% of children, with only 40% of confirmed cases already diagnosed before the screening, direct proof of the underdiagnosis the research already names.",
    summary: "This category's already-covered celiac-iceberg research describes underdiagnosis in general terms; Italy's national policy response gives it concrete numbers. In 2023, Italy became the first country in the world to pass a law (National Law 130/2023) mandating that every child between ages 1 and 17 be offered celiac disease screening, tested at ages 2, 6, and 10. The direct result confirmed exactly the underdiagnosis problem the iceberg research already describes: a mass school-based screening program found celiac disease present in 1.6% of tested children, and only 40% of those confirmed cases had already been diagnosed before the screening caught them, meaning a 60% of celiac cases in this specific population had been sitting completely undetected. The US, by contrast, has no equivalent national screening mandate, estimates finding at least two-thirds of US celiac cases remain undiagnosed, and the US Preventive Services Task Force concluded in 2017 that the evidence was insufficient to even recommend for or against population screening. Italy's national experiment is direct, concrete evidence for what the iceberg research already argues in the abstract: most celiac disease hides beneath the surface until someone actually goes looking for it systematically.",
    chart: {
      title: "Italy's national celiac screening: already diagnosed vs. Newly found",
      unit: '%',
      data: [
        { label: 'Confirmed cases already diagnosed beforehand', value: 40 },
        { label: 'Confirmed cases newly found by screening', value: 60 },
      ],
      sourceNote: "Should We All Copy Italy & Screen Kids for Celiac Disease?, Medscape; From Law to Action, Celiac Disease Foundation",
    },
    citations: [
      { source: "Italy Tests Nationwide Screening to Catch Hidden Celiac Disease in Children, Celiac.com", url: 'https://www.celiac.com/celiac-disease/italy-tests-nationwide-screening-to-catch-hidden-celiac-disease-in-children-r7069' },
      { source: "Should We All Copy Italy & Screen Kids for Celiac Disease?, Medscape", url: 'https://www.medscape.com/viewarticle/should-we-all-copy-italy-screen-kids-celiac-disease-2024a10009wv' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-iceberg-underdiagnosis', 'celiac-firstdegree-relative-screening'],
  },
  {
    id: 'horizon-celiac',
    category: 'celiac',
    title: 'Two Drug Candidates Are Trying to Do What This Category\'s Own Enzyme Therapy Entry Says Isn\'t Here Yet',
    teaser: 'ZED1227, a transglutaminase-2-blocking drug, measurably reduced gluten-induced gut damage in a randomized trial, and a second candidate, TAK-101, cut the immune system\'s gluten-triggered response by a 88% in early testing.',
    summary:
      "This category's already-covered enzyme-therapy research names an adjunct to the gluten-free diet, not a replacement for it, and two further, more advanced drug candidates are actively working to change that. ZED1227, described in research as the leading candidate in its drug class, blocks the specific enzyme (transglutaminase 2) that gluten triggers to cause intestinal damage in celiac disease, and a randomized trial found it measurably reduced gluten-induced gut injury at every dose tested. It's now moving through larger Phase 2b/3 trials expected to report through 2026-2027. A second, different candidate, TAK-101, works through a different mechanism (training the immune system toward tolerance rather than blocking an enzyme) and showed a striking 88% reduction in the gluten-triggered immune signal that drives symptoms in early testing, though its most recent Phase 2 trial found the difference in actual intestinal healing didn't reach statistical significance, an honest result alongside the more flattering number above. Neither drug is intended to replace this category's primary treatment (strict gluten avoidance), both are being developed as a safety buffer against accidental exposure, not permission to eat gluten again.",
    citations: [
      { source: 'A Randomized Trial of a Transglutaminase 2 Inhibitor for Celiac Disease, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2032441' },
      { source: 'New therapies in celiac disease: 2026 pipeline', url: 'https://novapharmanews.com/us/news/celiac-disease-new-era-therapeutic-innovation' },
    ],
    overallTier: 'moderate',
    relatedIds: ['celiac-enzyme-therapy-emerging'],
  },
  {
    id: 'horizon-celiac-latiglutenase',
    category: 'celiac',
    title: 'A Third Drug Candidate Broke Down 95% of Gluten in the Stomach Before It Could Reach the Gut',
    teaser: "This category's already-covered ZED1227 and TAK-101 research works after gluten has already reached the intestine. Latiglutenase, a two-enzyme combination, degrades gluten in the stomach first, and a trial found striking protection against gut damage.",
    summary:
      "This category's already-covered ZED1227 and TAK-101 research both intervene after gluten has already reached the small intestine. Latiglutenase takes an earlier approach: two enzymes working together to break down gluten proteins directly in the stomach, before they can reach and damage the intestinal lining at all. A Mayo Clinic-led Phase 2b trial, funded by the NIH, tested it directly against a 6-week gluten challenge, and found substantial protection: 88% less damage to the small intestine's lining, 60% fewer of the specific immune cells (intraepithelial lymphocytes) that signal active gut injury, and urine testing confirmed 95% of the gluten itself was broken down in the stomach before it could act. Symptom relief followed the same pattern, 53 to 99% less symptom severity than placebo during the same gluten exposure. Like ZED1227 and TAK-101 already covered in this category, latiglutenase is being developed as a safety buffer against accidental gluten exposure, meant to work alongside the gluten-free diet, not replace this category's primary treatment.",
    citations: [
      { source: 'Latiglutenase Protects the Mucosa and Attenuates Symptom Severity in Patients With Celiac Disease Exposed to a Gluten Challenge, Gastroenterology', url: 'https://www.gastrojournal.org/article/S0016-5085(22)00901-5/fulltext' },
    ],
    overallTier: 'strong',
    relatedIds: ['horizon-celiac'],
  },
  {
    id: 'celiac-hypertension-paradox-real-data',
    category: 'celiac',
    title: 'A Counterintuitive Finding: Celiac Disease Tracks With LOWER Hypertension, Not Higher',
    teaser: 'Research finds hypertension rates lower in celiac patients than in matched controls, even though the same patients face a measurably higher risk of heart attack and ischemic heart disease.',
    summary:
      'Published research finds a counterintuitive pattern: celiac disease patients show LOWER rates of hypertension than matched controls (15.2 percent versus 26.7 percent in one study), and research more broadly finds celiac patients carry a lower prevalence of several traditional cardiac risk factors at once, hypertension, high cholesterol, smoking, and obesity all included. This makes the separate finding sitting right alongside it surprising: despite this favorable traditional-risk-factor profile, large studies still find celiac disease associated with a measurably higher risk of overall cardiovascular disease, including a 1.5-fold higher hazard of ischemic heart disease and 1.59-fold higher risk of heart attack specifically. The proposed explanation is a different mechanism than the usual hypertension/cholesterol story: research points to a gut-to-cardiovascular inflammatory pathway, involving immune cell activity and a specific inflammatory signaling molecule (IL-17A) tied directly to active, untreated celiac disease, and research finds this same cardiovascular risk measurably reversible with a gluten-free diet, a direct, food-first reason strict dietary adherence matters for the heart, not just the gut.',
    citations: [
      { source: 'Celiac Disease and the Risk of Cardiovascular Diseases, PMC10298430', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10298430/' },
      { source: 'Celiac Disease and Cardiovascular Risk: A Retrospective Case-Control Study', url: 'https://www.mdpi.com/2077-0383/12/6/2087' },
    ],
    overallTier: 'moderate',
    relatedIds: ['celiac-overview'],
  },
  {
    id: 'celiac-persistent-symptoms-ibs-overlap',
    category: 'celiac',
    title: "A Strict Gluten-Free Diet Doesn't Always Mean Symptoms Fully Resolve",
    teaser: 'Research finds up to 50% of celiac patients still experience ongoing digestive symptoms on a strict gluten-free diet, with an IBS overlap in 22%, a separate problem, not a sign the diet isn\'t working.',
    summary: "This category's already-covered villi-healing-timeline research already names the gap between symptom relief and actual gut healing; research on ONGOING symptoms adds a further, honest layer most patients aren't warned about. Studies find at least 20%, and by some estimates up to 50%, of celiac patients continue experiencing chronic digestive symptoms consistent with a functional gastrointestinal disorder despite strict, confirmed gluten-free adherence. A direct study found 36.3% still had persistent symptoms or malabsorption signs even after adequate dietary adherence. A IBS overlap explains a meaningful share of this: research places IBS prevalence in celiac patients at 22%, against a 4-11% background rate in the general population, with over a third of celiac patients showing IBS-LIKE altered gut motility even without a formal IBS diagnosis. The practical answer the already-cited low-FODMAP research already covers: systematic review evidence supports a low-FODMAP approach specifically for celiac patients with these persistent, IBS-like symptoms after their gluten-free diet is already confirmed strict and adequate. Lingering symptoms on a strict gluten-free diet are a common, and separately addressable problem, not automatic proof gluten is still sneaking in somewhere.",
    citations: [
      { source: 'Efficacy of a Low-FODMAP Diet for Coeliac Patients with Persistent IBS-like Symptoms despite a Gluten-Free Diet: A Systematic Review, PMC11013587', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11013587/' },
      { source: 'Relationship between Persistent Gastrointestinal Symptoms and Duodenal Histological Findings after Adequate Gluten-Free Diet, PMC7918091', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7918091/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-villi-healing-timeline', 'ibs-overview'],
  },
  {
    id: 'celiac-skin-manifestations-beyond-dh',
    category: 'celiac',
    title: "Dermatitis Herpetiformis Is the Best-Known Celiac Skin Sign, But Research Names Several More",
    teaser: 'Beyond dermatitis herpetiformis, research links celiac disease to alopecia areata, urticaria, and eczema flares, with up to 20% of celiac patients first presenting through a skin symptom rather than a digestive one.',
    summary:
      "This category's already-covered dermatitis herpetiformis research names the single most specific, well-established celiac skin marker; broader dermatology research finds it isn't the only one. Alopecia areata (an autoimmune hair-loss condition) and urticaria (recurring itchy hives) are both documented skin conditions that can improve once gluten is fully removed from the diet in someone with underlying celiac disease. Research also connects celiac to vitiligo, with patients carrying dermatitis herpetiformis specifically showing elevated rates of vitiligo and other autoimmune disease in their personal or family history. A honest caveat: celiac's association with psoriasis specifically has been directly described as likely coincidental in research, not confirmed causal, an important distinction from the more solidly established links above. The most practically useful number here: up to 20% of celiac patients FIRST present through a skin symptom rather than a digestive one, meaning an unexplained, persistent skin issue is a legitimate reason to ask about celiac testing even without any digestive complaint at all.",
    citations: [
      { source: 'Frequency of Cutaneous Disorders in Patients With Celiac Disease, PMC8529358', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8529358/' },
      { source: 'Skin Manifestations and Coeliac Disease in Paediatric Population, PMC8537533', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8537533/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['celiac-dermatitis-herpetiformis', 'celiac-iceberg-underdiagnosis'],
  },
  {
    id: 'celiac-refractory-type1-vs-type2',
    category: 'celiac',
    title: "Refractory Celiac Disease Is Real and Rare, and Its Two Types Carry Different Survival Odds",
    teaser: "For the small minority whose symptoms don't resolve on a strict gluten-free diet, a formal classification into Type I and Type II carries a different prognosis.",
    summary:
      "This category's already-covered villi-healing research assumes a strict gluten-free diet eventually resolves the disease, and for the overwhelming majority it does. A small minority, roughly 1 percent of celiac patients, develops refractory celiac disease (RCD), persistent villous atrophy and symptoms despite at least 12 months of confirmed, strict dietary adherence. Pathology splits RCD into two distinct types: Type I shows a normal, polyclonal population of the gut's own immune cells, while Type II shows an abnormal, monoclonal (single-lineage) expansion of those same cells, a distinguishing lab finding, not just a severity label. The worth-knowing difference is prognosis: a Mayo Clinic cohort study found 5-year survival at 80 percent for Type I versus a markedly lower 45 percent for Type II, with the excess mortality in Type II driven mainly by a serious complication, enteropathy-associated T-cell lymphoma. Clinical data also finds Type II presenting with more severe features across the board, including diarrhea, anemia, and low blood protein, at higher rates than Type I. This is rare, and serious territory that needs a gastroenterologist's direct involvement, not something to self-diagnose from persistent symptoms alone, since far more common explanations (unintentional gluten exposure, the IBS-overlap this category already covers) explain the vast majority of ongoing symptoms.",
    citations: [
      { source: 'Presentation and Long-Term Follow-up of Refractory Celiac Disease: Comparison of Type I With Type II, PMID 18996383', url: 'https://pubmed.ncbi.nlm.nih.gov/18996383/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-villi-healing-timeline', 'celiac-persistent-symptoms-ibs-overlap', 'celiac-refractory-celiac'],
  },
  {
    id: 'celiac-gut-dysbiosis-reversal-gfd',
    category: 'celiac',
    title: "A Direct Study Confirms a Strict Gluten-Free Diet Helps Repair the Gut Microbiome Itself",
    teaser: "This category's already-covered villi-healing timeline tracks tissue-level recovery, direct microbiome sequencing finds a strict, sustained gluten-free diet also measurably restoring gut bacterial balance.",
    summary: "This category's already-covered villi-healing research tracks how the intestinal LINING heals over time, and direct microbiome research finds a parallel, recovery happening in the gut's own bacterial population too. A controlled animal model first demonstrated this directly: gluten-sensitive macaques showed reduced gut microbial diversity while eating gluten, and within just weeks of switching to a gluten-free diet, their microbiome composition began shifting back toward that of a normal, non-sensitive animal, controlled evidence of reversibility. A direct human study, sequencing the gut bacteria of 10 women with celiac disease who had followed a strict gluten-free diet for over a year and comparing them to 10 healthy controls, found that prolonged adherence supported remission of the dysbiosis (bacterial imbalance) associated with untreated celiac disease, and measurably enhanced overall microbiota functionality. A separate, more detailed study combining MRI imaging with microbiome analysis specifically tracked gut function and bacterial composition across a full year of gluten-free eating, directly measuring this same recovery process rather than assuming it from symptom improvement alone. This microbiome-level recovery ties directly into the broader gut-health research (already covered elsewhere) — a strict gluten-free diet isn't just calming symptoms or healing visible tissue, evidence finds it also restoring the gut's own bacterial ecosystem over time.",
    citations: [
      { source: 'Effect of a Gluten-Free Diet on the Intestinal Microbiota of Women with Celiac Disease, PMC12382989', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12382989/' },
      { source: 'Dietary Gluten-Induced Gut Dysbiosis Is Accompanied by Selective Upregulation of microRNAs with Intestinal Tight Junction and Bacteria-Binding Motifs in Rhesus Macaque Model of Celiac Disease, PMC5133072', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5133072/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-villi-healing-timeline', 'gut-scfa-treg'],
  },
  {
    id: 'celiac-pediatric-bone-density-reversal',
    category: 'celiac',
    title: "A Child's Own Low Bone Density From Celiac Disease Can Fully Reverse, but Only With Early Diagnosis",
    teaser: "This category's already-covered adult bone-density entry names a screening age, direct pediatric research finds children's own bone density can return to completely normal on a gluten-free diet, if caught early enough.",
    summary:
      "This category's already-covered bone-density entry names common reduced bone density at diagnosis in ADULTS, and direct pediatric research finds a more hopeful, reversible picture in children specifically, with one important condition attached. Research consistently finds children and adolescents newly diagnosed with celiac disease showing significantly reduced bone mineral density at the spine and across the whole body compared to healthy peers. The encouraging finding: a direct study found a gluten-free diet promoting a rapid, increase in bone mineral density leading to complete recovery, with bone density values in treated children becoming statistically indistinguishable from control children without celiac disease at all. A meta-analysis confirmed this pattern held across multiple studies, and a longitudinal study found bone mineral content, bone area, and density all significantly low at diagnosis but normal after treatment. The one condition attached: research found the degree of recovery statistically tied to how strictly the gluten-free diet was actually followed, and separately emphasized that early diagnosis specifically matters, since achieving adequate peak bone mass by the end of puberty is a one-time developmental window that doesn't reopen later. This is good news for a child diagnosed early and kept strictly on the diet, a meaningfully more complete recovery than this category's adult bone-density research describes.",
    citations: [
      { source: 'Effect of a gluten-free diet on bone mineral density in children and adolescents with celiac disease: Systematic review and meta-analysis, PMID 36469632', url: 'https://pubmed.ncbi.nlm.nih.gov/36469632/' },
      { source: 'Bone mineral density and growth in children with coeliac disease on a gluten free-diet, PMID 28081333', url: 'https://pubmed.ncbi.nlm.nih.gov/28081333/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-bone-density', 'celiac-pediatric-vs-adult-presentation'],
  },
  {
    id: 'celiac-seronegative-real-prevalence',
    category: 'celiac',
    title: "A Minority of Celiac Cases Test Negative on Antibody Bloodwork Entirely",
    teaser: "This category's already-covered diagnostic-panel entry names standard antibody testing as the starting point, research finds a genuine, if small, share of confirmed celiac cases test completely negative on that same bloodwork.",
    summary:
      "This category's already-covered diagnostic-panel entry names antibody testing (tissue transglutaminase, endomysial antibodies) as the standard first step toward a celiac diagnosis, and research confirms a genuine, if small, exception: seronegative celiac disease, biopsy-confirmed celiac disease with completely negative antibody bloodwork. Research found seronegative celiac disease in roughly 1.7 percent of a large cohort of 810 confirmed celiac patients, a minority, but not a vanishingly rare curiosity either. The useful, distinguishing clinical pattern: research found seronegative patients tending to be diagnosed at a significantly older age, with a higher rate of the classical malabsorption presentation, other autoimmune conditions, and more severe villous atrophy on biopsy, a different clinical picture than typical, antibody-positive celiac disease. A direct, related finding explains part of why this happens: antibody positivity itself was found to track with how SEVERE the villous atrophy already is, with endomysial antibody positive in 77 percent of cases with total villous atrophy but only 33 percent with partial atrophy, evidence that milder, earlier tissue damage can fail to trigger a positive antibody result yet. This honest gap is exactly why a direct biopsy remains important when celiac disease is still strongly suspected despite negative antibody bloodwork, not something to rule out purely from a negative blood test alone.",
    citations: [
      { source: 'Seronegative celiac disease: Shedding light on an obscure clinical entity, PMID 27352981', url: 'https://pubmed.ncbi.nlm.nih.gov/27352981/' },
      { source: 'Seronegative celiac disease: increased prevalence with lesser degrees of villous atrophy, PMID 15185855', url: 'https://pubmed.ncbi.nlm.nih.gov/15185855/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-diagnostic-panel', 'celiac-marsh-staging'],
  },
  {
    id: 'celiac-male-fertility-honest-null',
    category: 'celiac',
    title: "A Widely Repeated 'Celiac Causes Male Infertility' Claim, and a Large Study Found No Overall Fertility Risk",
    teaser: "This category's already-covered pregnancy/fertility research focuses on women, for men specifically, smaller studies found abnormal sperm parameters, but a large, 7,121-man Swedish cohort found no meaningful overall fertility risk at all.",
    summary:
      "This category's already-covered pregnancy and fertility research names direct risks in women (miscarriage risk that reverses on a gluten-free diet), and male fertility deserves its honest, direct coverage precisely because the evidence here is mixed rather than settled. Smaller studies do find measurable sperm abnormalities in men with untreated celiac disease, including significantly impaired sperm chromatin maturation (persistent histones and protamine deficiency, both markers of sperm-DNA packaging quality), plausibly linked to already-covered nutrient deficiencies this condition can cause, particularly selenium and zinc, both directly involved in sperm development. But the most decisive evidence comes from a much larger, nationwide Swedish population-based cohort of 7,121 men with biopsy-confirmed celiac disease (villous atrophy), which found an overall fertility hazard ratio of 1.02, essentially no meaningful difference from men without celiac disease. Separate research directly titled the underlying question 'fact or fiction' found the broader literature conflicting: some smaller studies report higher infertility rates in celiac patients, others find no such association at all. Rather than picking whichever finding sounds more dramatic, the best, largest, population-level evidence currently available does not support a meaningful male-fertility risk from celiac disease itself, even though measurable sperm-parameter changes can occur, a useful distinction between a detectable biological signal and an actual, population-level fertility outcome.",
    citations: [
      { source: 'Celiac disease is not a risk factor for infertility in men, ScienceDirect', url: 'https://www.sciencedirect.com/science/article/pii/S001502821100166X' },
      { source: 'Fertility in Celiac Disease: The Impact of Gluten on Male and Female Reproductive Health, PMC12073710', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12073710/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['celiac-pregnancy-fertility-real-data', 'celiac-gf-diet-nutritional-pitfalls'],
  },
  {
    id: 'celiac-atrial-fibrillation-real-risk',
    category: 'celiac',
    title: "Celiac Disease Carries a Distinct Arrhythmia Risk Too, Not Just the Heart Attack Risk This Category Already Covers",
    teaser: "This category's already-covered hypertension-paradox entry names a counterintuitive lower blood-pressure finding alongside higher heart-attack risk, a pooled meta-analysis finds atrial fibrillation, a distinct kind of heart problem, also significantly elevated.",
    summary:
      "This category's already-covered hypertension-paradox research already establishes celiac disease's counterintuitive cardiovascular pattern (lower blood pressure, yet higher heart-attack risk), and atrial fibrillation, a distinct kind of heart-rhythm problem rather than a blockage or blood-pressure issue, deserves its own direct coverage as part of that same broader picture. A pooled meta-analysis of 4 observational studies (64,397 total participants) found celiac disease associated with a significant 38 percent increased risk of atrial fibrillation (pooled odds ratio 1.38). The plausible mechanism the researchers themselves proposed connects directly to this category's core, already-covered identity: celiac disease's autoimmune, inflammatory nature, the same systemic inflammatory process already implicated elsewhere in this category's cardiovascular and bone-density research, rather than a mechanism unique to blood pressure or cholesterol. Consistent with how this category's hypertension-paradox entry already treats a similarly counterintuitive finding, this elevated arrhythmia risk occurs even though traditional cardiovascular risk factors (hypertension, high cholesterol, obesity) tend to be LESS common in celiac patients, further evidence this category's cardiovascular risk runs through a different, inflammation-driven pathway rather than the standard risk-factor profile most heart-disease prevention advice is built around. This specific arrhythmia risk is worth mentioning directly to a doctor alongside a celiac diagnosis, particularly for anyone noticing new heart-palpitation symptoms, rather than assuming celiac disease's cardiovascular reach stops at the heart-attack risk already covered elsewhere in this category.",
    citations: [
      { source: 'Celiac Disease and Risk of Atrial Fibrillation: A Meta-analysis and Systematic Review, Cureus, 2020', url: 'https://pubmed.ncbi.nlm.nih.gov/32206461/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-hypertension-paradox-real-data', 'celiac-systemic-effects-real-data'],
  },
  {
    id: 'celiac-fermented-drinks',
    category: 'celiac',
    title: 'Fermented Drinks and Foods for Celiac Disease',
    teaser: 'Two traditional grain ferments (Rejuvelac and rye-style Kvass) were deliberately rebuilt on quinoa instead of wheat or rye, so the recipe itself is gluten-free rather than something to modify.',
    summary: 'This app\'s Rejuvelac and Rye-Style Kvass (both in Recipes) use sprouted or toasted quinoa in place of the sprouted wheat berries and rye bread their traditional versions call for, so they\'re buildable here without any substitution on your own end. Every other recipe in this collection was independently verified gluten-free by ingredient. Since celiac disease carries a much higher stake than general gluten sensitivity: a shared kitchen where wheat flour, rye bread, or barley malt has recently been handled (cutting boards, wooden spoons, flour dust in the air) is a cross-contact risk for any of these ferments, not just the grain-based ones, since an open fermentation jar sits uncovered by anything but a breathable cloth for days. Dedicate separate equipment if celiac disease, not just gluten sensitivity, is the reason you\'re fermenting gluten-free.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['recipe-ferment-rejuvelac', 'recipe-ferment-rye-style-kvass-quinoa', 'fermentmethod-dairy-free-gluten-free-survey'],
  },
  {
    id: 'celiac-circadian-clock-disruption',
    category: 'celiac',
    title: "Clock Genes Are Disrupted in Celiac Disease's Immune Cells, an Early Finding",
    teaser: 'A study found circadian clock gene disruption in the white blood cells of people with celiac disease, an early piece of a still-developing research direction.',
    summary: "Circadian clock gene disruption has been documented in the white blood cells of people with celiac disease, joining a broader pattern already established for other gut-inflammatory conditions covered elsewhere in this Digest: inflammation and circadian clock disruption appear to reinforce each other in the gut. A registered clinical trial is actively studying circadian rhythms in people with either inflammatory bowel disease or celiac disease at diagnosis and through follow-up, evidence this is an active, not-yet-settled research direction rather than a closed question. What this doesn't yet establish: whether adjusting meal timing specifically changes celiac disease activity or the gluten-triggered immune response itself. Strict gluten avoidance remains the entire, non-negotiable treatment; this is a mechanistic finding worth tracking, not a reason to treat meal timing as a substitute for it.",
    citations: [
      { source: 'Circadian clock gene disruption in white blood cells of patients with celiac disease', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0300908423001815' },
      { source: 'Circadian Rhythms in Patients With IBD or Celiac Disease Upon Diagnosis and Medical Follow-up', url: 'https://clinicaltrials.gov/study/NCT03662646' },
    ],
    overallTier: 'weak',
    relatedIds: ['chrono-circadian-clock-biology', 'ibd-circadian-clock-disruption'],
  },
];
