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
    title: 'Celiac Disease: The One Condition in This App Where Diet Is the Entire Treatment',
    teaser: 'No medication substitutes for a strict gluten-free diet here. That makes the real, practical questions genuinely different from every other condition in this app.',
    summary:
      "Celiac disease is an autoimmune reaction to gluten, a protein in wheat, barley, and rye, that damages the lining of the small intestine, specifically the villi responsible for absorbing nutrients. Unlike every other condition built out in this app so far, there's no medication that treats celiac disease itself. A strict, lifelong gluten-free diet is the entire treatment, which means the real, practical questions here are different in kind from \"does this food help or hurt at the margins.\" They're about how strict is strict enough, whether trace cross-contamination genuinely matters, whether oats are safe, and what a gluten-free diet itself can get nutritionally wrong if it isn't managed carefully. This app's own Gut & Microbiome category already covers the real mechanism (gliadin, zonulin, intestinal permeability) that celiac disease was the original research population for. This category covers what's specific to actually living with and being diagnosed with the disease itself.",
    citations: [
      { source: 'Celiac Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/celiac-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-zonulin-gliadin', 'b12-absorption-mechanism', 'vitamine-deficiency-real-causes'],
  },
  {
    id: 'celiac-diagnostic-panel',
    category: 'celiac',
    title: 'Real Diagnostic Testing Requires Still Eating Gluten. Going Gluten-Free First Is the Single Most Common Mistake.',
    teaser: 'Every real antibody and biopsy test can turn falsely negative within weeks of cutting gluten out, before a diagnosis is even confirmed.',
    summary:
      "Celiac disease testing has a real, specific trap that catches a lot of people: every diagnostic test, from blood antibodies to a biopsy, requires actively eating gluten at the time of testing, and stopping gluten beforehand can cause a false negative within weeks. The standard first test is tTG-IgA (tissue transglutaminase antibody), almost always paired with a total IgA measurement, since real IgA deficiency, itself associated with celiac disease, can cause a false negative on the antibody test alone. EMA (endomysial antibody) is a real, highly specific confirming test. HLA-DQ2/DQ8 genetic testing can't diagnose celiac disease on its own, since up to 25-30% of the general population carries one or both genes without ever developing the disease, but a negative result on both genes can essentially rule celiac disease out. A real 2025 European guideline confirmed a biopsy remains required for most adult diagnoses, though a very high antibody level combined with a positive EMA and positive genetic result can be enough on its own in selected pediatric cases. For anyone who already went gluten-free before ever getting properly tested, a real, structured \"gluten challenge,\" eating gluten again under medical guidance for long enough to let the antibodies and intestinal changes reappear, is the honest path to an accurate diagnosis, not a diagnosis assumed from symptom improvement alone.",
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
    title: 'The Real 20ppm Standard, and What Actually Breaks It in a Real Kitchen',
    teaser: 'Roughly a fifth of products labeled gluten-free measured over the legal threshold, though genuinely dangerous contamination turned out much rarer than that.',
    summary:
      "Gluten-free food labeling in most places is legally defined as under 20 parts per million (ppm) of gluten, and real individual sensitivity thresholds run even lower, roughly 10-50 milligrams of gluten total. Real testing of products labeled or intended to be gluten-free found about 20% measured over that 20ppm legal standard, a genuinely common labeling gap, though clinically significant contamination (over 200ppm, enough to reliably cause a real reaction) showed up in under 1% of samples, meaningfully rarer than the labeling-compliance gap alone would suggest. Real kitchen-practice research found one specific, common mistake worth knowing directly: cooking gluten-free pasta in water previously used for regular pasta consistently pushed gluten content over the 20ppm line, but the same research found even a simple rinse of the pasta or the pot afterward was enough to bring it back down to a safe level, a real, low-effort fix for a real, common source of contamination.",
    citations: [
      { source: 'Celiac Disease: Risks of Cross-Contamination and Strategies for Gluten Removal in Food Environments', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10888188/' },
      { source: 'Risk of Gluten Cross-Contamination Due to Food Handling Practices: A Mini-Review', url: 'https://pubmed.ncbi.nlm.nih.gov/38674888/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'celiac-oats-controversy',
    category: 'celiac',
    title: "Oats: Safe for Most, and a Real, Separate Reason Beyond Contamination for the Rest",
    teaser: 'Oats carry their own real, gluten-like protein, and a genuine minority of celiac patients react to it even when the oats themselves are completely uncontaminated.',
    summary:
      "Oats are naturally gluten-free, but the oats-and-celiac-disease question is genuinely more complicated than that fact alone suggests, and for two separate real reasons. The first is ordinary cross-contamination: oats are frequently grown, harvested, or processed alongside wheat, making contamination a real, common risk unless a product is specifically certified gluten-free. The second is real and separate from contamination entirely: oats contain avenin, their own gluten-like protein, and a genuine minority of celiac patients react to avenin itself, even in laboratory-confirmed, completely uncontaminated pure oats. Real research finds pure oats are well-tolerated by most celiac patients at moderate amounts (roughly 20-25 grams a day for children, 50-70 grams for adults), and even in the studies where some patients reacted to purified avenin with real symptoms, no actual intestinal damage was found in those reactors, a genuinely reassuring, if not fully resolved, detail. The honest, practical takeaway: certified gluten-free oats are a reasonable thing to try, but worth introducing carefully and watching for a real, personal reaction, not assumed universally safe just because they're gluten-free by definition.",
    citations: [
      { source: 'To Be Oats or Not to Be? An Update on the Ongoing Debate on Oats for Patients With Celiac Disease', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6775206/' },
      { source: 'A small subset of those with celiac disease react to the protein in oat, study confirms', url: 'https://www.beyondceliac.org/research-news/a-small-subset-of-those-with-celiac-disease-react-to-the-protein-in-oat-study-confirms/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'celiac-gf-diet-nutritional-pitfalls',
    category: 'celiac',
    title: "A Gluten-Free Diet Isn't Automatically a Healthier One. Real Data on What Commercial GF Products Get Wrong.",
    teaser: 'Real market research found gluten-free products running lower in protein and fiber, higher in sugar and saturated fat, and costing up to 4x more.',
    summary:
      "Going gluten-free is medically necessary for celiac disease, but it isn't automatically a nutritional upgrade, and real market research backs that up directly. Comparing real gluten-free products against their gluten-containing equivalents found the gluten-free versions running measurably lower in protein and fiber while carrying more saturated fat, sugar, and salt, largely because they're typically built from refined starches rather than whole grains. Real broader nutritional research on the diet extends the concern: adherence to a gluten-free diet is genuinely linked to lower fiber intake and real, documented deficiencies in iron, folate, vitamin B12, vitamin D, calcium, zinc, and magnesium, made worse by the fact that gluten-free products aren't required to be fortified with these nutrients the way many gluten-containing staples (fortified bread and cereal, for instance) already are. On top of the nutritional gap, real market pricing data found gluten-free products running 46% to as much as 443% more expensive than their gluten-containing counterparts. None of this is a reason to avoid a gluten-free diet, medically necessary for celiac disease regardless. It's a real, practical reason a gluten-free diet benefits from active nutritional planning (real whole foods, not just gluten-free packaged substitutes) rather than being assumed automatically balanced just because it's medically required.",
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
    title: 'How Long Does the Gut Actually Take to Heal? A Real, Age-Dependent Answer',
    teaser: 'Symptoms often improve within weeks. The actual intestinal lining takes far longer, and real research found age genuinely changes how much healing happens at all.',
    summary:
      "Starting a gluten-free diet often brings real symptom relief within days to a few weeks, but that's a genuinely different timeline from the intestinal lining actually healing underneath. Real research on children and younger adults found the small intestine typically fully healed within 3 to 6 months. For older adults, that same healing can take up to 2 years, and a real, specific finding worth knowing directly: research tracking recovery by age found people between 30 and 60 showing real but incomplete recovery, while people over 60 showed no statistically significant healing at all in the same studies. Looking at recovery rates over time rather than by age alone, real research found only about 34% of adults reached full mucosal healing within 2 years, rising to about 66% by 5 years, meaning a real, meaningful share of adults on a genuinely strict gluten-free diet still show some persistent villous damage well beyond the timeline most people expect. None of this means the diet isn't working. It means healing is a real, slow, individual process, not a switch that flips once symptoms improve.",
    citations: [
      { source: 'Mucosal Healing in Celiac Disease: Villous Architecture and Immunohistochemical Features in Children on a Long-Term Gluten Free Diet', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9504881/' },
      { source: 'Outcomes in Adults with Celiac Disease Following a Gluten-Free Diet', url: 'https://www.mdpi.com/2077-0383/14/14/5144' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'celiac-refractory-celiac',
    category: 'celiac',
    title: 'When Symptoms Persist Despite a Genuinely Strict Diet: A Real, Rare, Named Condition',
    teaser: 'Under 0.5% of adults with celiac disease don\'t respond to diet alone. Worth knowing this exists, and worth ruling out ordinary cross-contamination first.',
    summary:
      "For the large majority of people with celiac disease, a genuinely strict gluten-free diet resolves both symptoms and, eventually, intestinal healing. A real, rare subset doesn't respond that way: refractory celiac disease, persistent villous damage and symptoms despite a verified, strict gluten-free diet with no ongoing gluten exposure, affects under 0.5% of adult celiac patients. This is a real, named, medically distinct condition, not just \"celiac disease that's hard to manage,\" and it carries its own real risk of malnutrition and impaired bone health beyond what typical, diet-responsive celiac disease involves. Worth knowing this exists specifically so persistent symptoms get investigated properly (ruling out ongoing hidden cross-contamination first, since that's a far more common explanation) rather than either assumed to be refractory disease prematurely or dismissed as the diet simply not working hard enough.",
    citations: [
      { source: 'The Dietary and Non-Dietary Management of Osteoporosis in Adult-Onset Celiac Disease: Current Status and Practical Guidance', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9654202/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'celiac-bone-density',
    category: 'celiac',
    title: 'Bone Density: A Real, Common Finding at Diagnosis, With a Real Recommended Screening Age',
    teaser: 'Over half of newly diagnosed adults show reduced bone density. A real, specific age is now recommended for a baseline scan.',
    summary:
      "Reduced bone density is genuinely common at celiac disease diagnosis, not a rare complication. Real research finds osteopenia or osteoporosis in an estimated 38% to 72% of newly diagnosed patients, with decreased bone mineral density showing up in over half of newly diagnosed adults specifically, driven by the same malabsorption (of calcium and vitamin D, among other nutrients) that damaged villi cause before treatment starts. A real, specific, actionable recommendation came out of a 2025 study: bone mineral density screening at age 45 for people with celiac disease, given a documented increased risk of lumbar osteoporosis by middle age. The genuinely encouraging part: in patients confirmed celiac and started on a real, strict gluten-free diet, bone density measurably responds to treatment as the gut heals and nutrient absorption improves, meaning this isn't a permanent, fixed loss the way some bone-density findings in other conditions can be. Worth asking for a DEXA scan at diagnosis regardless of age, and again around 45 if not already screened, rather than assuming bone health is fine just because nothing hurts yet.",
    citations: [
      { source: 'Prevalence of osteoporosis and osteopenia in men and premenopausal women with celiac disease: a systematic review', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6504166/' },
      { source: 'The Dietary and Non-Dietary Management of Osteoporosis in Adult-Onset Celiac Disease: Current Status and Practical Guidance', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9654202/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-gf-diet-nutritional-pitfalls', 'ra-advocacy-bone-density'],
  },
  {
    id: 'celiac-hashimotos-comorbidity',
    category: 'celiac',
    title: "Celiac Disease and Hashimoto's: A Real, Quantified Overlap Worth Screening For Directly",
    teaser: 'Autoimmune thyroid disease shows up roughly twice as often in celiac patients as in the general population, in a real, large case-control study.',
    summary:
      "This app's own Type 1 Diabetes category already covers celiac disease's real overlap with T1D. The overlap with Hashimoto's specifically is just as real and, in at least one pediatric comparison, even more pronounced. A large real case-control study of 8,489 participants found autoimmune thyroid disorders present in 15.4% of celiac patients compared to 7.5% of controls, roughly double the risk. A separate pediatric study found celiac disease prevalence among children with autoimmune thyroiditis running 1.92 times higher than among children with type 1 diabetes, meaning the celiac-Hashimoto's connection specifically may be even stronger than the celiac-T1D connection this app already covers elsewhere. The proposed explanation is a shared genetic background predisposing someone to autoimmune attack broadly, not a coincidence. The real, practical takeaway: anyone diagnosed with either condition has a real, quantified reason to ask about screening for the other, not just watch for symptoms and hope they'd notice.",
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
    teaser: 'A condition where the diet itself needs real, careful nutritional attention, plus a real, age-dependent healing timeline worth knowing honestly.',
    summary:
      "Line up everything in this category and celiac disease reads differently in shape from every condition already built in this app, because diet here isn't one lever among several, it's the entire treatment. The real, practical strictness questions have real, specific answers: cross-contamination genuinely matters below the level most people would guess, but a simple rinse fixes the single most common kitchen mistake; oats are safe for most people at moderate amounts, but a real minority genuinely react to the oat protein itself, not just contamination; and the diet itself needs active nutritional attention, since real market data shows commercial gluten-free products running lower in fiber and protein and higher in sugar and cost than their gluten-containing equivalents. Healing takes real, honest time, faster and more complete in children and younger adults than in people diagnosed later in life, worth knowing so a slow recovery doesn't get mistaken for the diet not working. The two self-advocacy entries carry the same kind of precise numbers this app's other conditions have already established matter: the real testing sequence that requires still eating gluten, and a real, specific screening age (45) for bone density most people wouldn't otherwise know to ask about. And the real, quantified overlap with both Hashimoto's and Type 1 Diabetes is a direct, practical reason a celiac diagnosis is worth pairing with a broader autoimmune screening conversation, not treated as an isolated finding.",
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
    title: "Celiac Damage Has a Real, Formal Staging Scale, From Normal Tissue to Total Villous Atrophy",
    teaser: 'The Marsh scale runs 0 to 3c -- a real, biopsy-based measure of exactly how much of the gut lining\'s absorbing surface has actually been lost.',
    summary:
      "Celiac disease's own real tissue damage is measured with the Marsh (or Marsh-Oberhuber) classification, a real, biopsy-based staging scale still used today. Marsh 0 is normal, healthy intestinal lining. Marsh 1 shows an increased number of immune cells in the tissue (intraepithelial lymphocytes) with the villi themselves still intact. Marsh 2 adds crypt hyperplasia, the gut's own glands enlarging in response to ongoing damage. Marsh 3, split into 3a (mild), 3b (moderate), and 3c (total villous atrophy), is where the real, absorbing surface of the small intestine actually starts flattening and disappearing, the direct physical mechanism behind celiac's own real malabsorption and nutrient-deficiency risks already covered elsewhere in this category. This real staging scale is exactly what a biopsy result is reporting when it comes back with a Marsh number, worth understanding directly rather than treating an unfamiliar score as just \"positive\" or \"negative.\"",
    citations: [
      { source: 'Celiac disease: histology-differential diagnosis-complications. A practical approach, PMC7931573', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7931573/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-villi-healing-timeline'],
  },
  {
    id: 'celiac-systemic-effects-real-data',
    category: 'celiac',
    title: "Celiac Disease Reaches Well Past the Gut -- Real, Documented Neurological, Skin, and Reproductive Effects",
    teaser: "A pathognomonic skin rash, real neurological symptoms including seizures, and effects on fertility in both women and men -- celiac's own real reach extends far beyond digestion.",
    summary:
      "Celiac disease's own real, non-digestive effects are genuinely wide-ranging, a direct consequence of the malabsorption Marsh-stage gut damage causes. Dermatitis herpetiformis, an intensely itchy, blistering rash, is real and pathognomonic for celiac, meaning its presence alone can point to the diagnosis even with zero digestive symptoms present. Real, documented neurological effects include numbness, motor weakness, loss of coordination, and, in real, severe cases, seizures. Osteoporosis and osteopenia, already covered in this app's own bone-density self-advocacy entry, trace directly to malabsorbed calcium and vitamin D. Reproductive effects are real and significant in both sexes: delayed menarche, amenorrhea, and infertility in women, and impotence and infertility in men, with impaired vitamin E absorption specifically implicated as one real, contributing mechanism. Real global prevalence data (1.4% by antibody testing, 0.7% biopsy-confirmed) also shows a genuine sex and age skew worth knowing: roughly 0.6% in women versus 0.4% in men, and higher in children (0.9%) than adults (0.5%).",
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
    title: "Celiac's Own Real History: A Wartime Bread Shortage Accidentally Solved a Medical Mystery",
    teaser: '1888, 1940s, 1952 -- a real, genuinely remarkable discovery story: the actual trigger food was identified because of a real, accidental wartime experiment nobody intended to run.',
    summary:
      "Celiac disease's own real modern medical description dates to 1888, when physician Samuel Gee first described the condition and correctly guessed, without proof, that diet held the real cure, even trying real, misguided treatments (including a Dutch mussel-based diet) that never worked because he hadn't yet identified wheat as the actual trigger. The real breakthrough came from an unplanned, genuinely remarkable wartime natural experiment: Dutch pediatrician Willem Dicke noticed that celiac mortality at his own hospital dropped to zero during a real, severe World War II bread shortage in the Netherlands, when wheat simply wasn't available to eat. His 1950 doctoral thesis formally established that removing wheat, rye, and oats produced dramatic real improvement, identifying gluten, a specific protein component, as the actual toxic trigger. A 1952 study from an English medical team independently confirmed the same real finding. This is a genuinely unusual origin story in medical history: the key discovery came from an accidental, real-world dietary experiment nobody designed on purpose, not a planned clinical trial.",
    citations: [
      { source: 'History of Coeliac Disease. Dicke and the Origin of the Gluten-Free Diet', url: 'https://link.springer.com/chapter/10.1007/978-94-015-7943-8_1' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'celiac-pregnancy-fertility-real-data',
    category: 'celiac',
    title: 'Untreated Celiac Carries a Real, Quantified Miscarriage and Infertility Risk -- and a Real, Reassuring Reversal Once Diagnosed',
    teaser: 'Real data finds an 8.9-fold higher miscarriage risk with undiagnosed celiac -- and that same elevated risk fully disappears once someone starts a real gluten-free diet.',
    summary:
      "This is one of the more real, striking, and ultimately hopeful findings in this whole category. Real research finds women with undiagnosed celiac disease experience 11 more miscarriages and 1.62 more stillbirths per 1,000 pregnancies than the general population, with a real 8.9-fold higher overall miscarriage risk, and up to 50% experiencing at least one miscarriage or a poor pregnancy outcome. Fertility itself is affected too: women become pregnant less often in the years before diagnosis (25 fewer pregnancies per 1,000), and real research on unexplained infertility specifically found a 6-fold higher rate of undiagnosed celiac disease in that population, a genuine, real reason unexplained infertility is worth real celiac screening even without any digestive symptoms present. The real mechanism traces to malabsorbed nutrients and to tissue transglutaminase antibodies directly interfering with embryo implantation. The genuinely reassuring real finding, worth leading with rather than burying: this whole elevated risk pattern disappeared once women started a real gluten-free diet, with diagnosed and treated celiac patients showing no higher rate of pregnancy loss than anyone else.",
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
    title: 'Dermatitis Herpetiformis: The Real, Intensely Itchy Skin Rash That Is Actually Celiac Disease',
    teaser: 'A real, distinct, itchy blistering rash affects 15-25% of celiac patients, driven by the exact same gluten-triggered antibody response as the gut, and some people have it with no digestive symptoms at all.',
    summary:
      "Dermatitis herpetiformis is a real, genuinely distinct manifestation of celiac disease, not a separate skin condition that happens to occur alongside it. It's caused by the same underlying gluten-triggered immune process, but the real, specific IgA antibodies involved deposit in the skin rather than (or in addition to) the gut: epidermal transglutaminase (TG3) is the real skin-specific target antigen, distinct from the tissue transglutaminase (TG2) already covered in this app's own celiac diagnostic-panel research as the standard gut-focused test. The result is a real, intensely itchy, blistering rash, most classically on the elbows, knees, and buttocks. Real research finds more than 90% of people with dermatitis herpetiformis also have real, confirmable gluten-sensitive enteropathy on biopsy, even when they have no digestive symptoms at all, and conversely, a real 15-25% of people with celiac disease develop this same skin manifestation at some point. Worth knowing directly: dermatitis herpetiformis responds to the exact same gluten-free diet already covered in this app's own celiac research, with real, excellent long-term prognosis once gluten is removed, and it's worth raising directly with a doctor as a possible celiac clue for anyone with an unexplained, persistently itchy, blistering rash, since it can be the very first, or only, visible sign of the disease.",
    citations: [
      { source: 'Dermatitis herpetiformis: pathognomonic transglutaminase IgA deposits in the skin and excellent prognosis on a gluten-free diet, PMID 26059085', url: 'https://pubmed.ncbi.nlm.nih.gov/26059085/' },
      { source: 'Dermatitis Herpetiformis, Celiac Disease Foundation', url: 'https://celiac.org/about-celiac-disease/related-conditions/dermatitis-herpetiformis/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-diagnostic-panel'],
  },
];
