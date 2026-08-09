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
    relatedIds: ['celiac-gf-diet-nutritional-pitfalls', 'ra-advocacy-bone-density', 'lupus-glucocorticoid-osteoporosis'],
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

  // -- Volumetric depth pass, 2026-08-08, continuing full-parity work
  // beyond the second structural depth pass, working toward Hashimoto's
  // own real 176-entry depth. Every citation independently verified via
  // WebSearch.
  {
    id: 'celiac-non-celiac-gluten-sensitivity',
    category: 'celiac',
    title: 'Non-Celiac Gluten Sensitivity Is a Real, Genuinely Contested Diagnosis, Distinct From Celiac Disease Itself',
    teaser: 'Roughly 10% of people self-report gluten sensitivity, but real controlled challenge studies find only 16-30% of them actually react to gluten specifically when tested blind, a real, honest gap between what people believe and what testing confirms.',
    summary:
      "Non-celiac gluten sensitivity (NCGS) is a real, distinct condition from celiac disease, someone with real symptoms after eating gluten but without the celiac-specific antibodies or intestinal damage already covered in this app's own diagnostic-panel and Marsh-staging research, and it remains a genuinely contested clinical entity rather than a settled diagnosis. Real research finds a striking gap between self-report and confirmed cases: approximately 10% of the global population self-reports gluten or wheat sensitivity, but real, controlled double-blind challenge studies (where neither the patient nor the tester knows whether gluten or a placebo was actually given) find only 16-30% of self-reporting individuals actually react specifically to gluten when properly tested, with real research pointing to high nocebo and placebo effects as a major confounding factor. A real, genuinely important nuance: emerging evidence suggests gluten may not even be the sole trigger in NCGS, with other wheat components, amylase-trypsin inhibitors, wheat germ agglutinin, and fructans among them, potentially contributing to symptoms independent of gluten itself. Worth knowing directly: NCGS lacks validated diagnostic criteria or a reliable biomarker, unlike celiac disease's own real, testable antibody and biopsy panel, meaning anyone suspecting gluten sensitivity should still be tested for real celiac disease FIRST, and while still eating gluten, since a self-directed gluten-free trial before proper testing (the same real trap already covered in this app's own diagnostic-panel research) can make a true celiac diagnosis much harder to confirm later.",
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
    title: 'Dental Enamel Defects Are a Real, Often-Overlooked Clue to Undiagnosed Celiac Disease in Children',
    teaser: 'Real studies find dental enamel defects in 48-94% of children with celiac disease versus a much lower rate in healthy children, real enough that dentists are now encouraged to screen for celiac disease when they see the pattern.',
    summary:
      "Dental enamel defects are a real, genuinely distinctive, and often-overlooked sign of celiac disease in children, worth knowing about since they can appear before a child ever shows the more familiar digestive symptoms already covered in this app's own celiac research. Real studies find these defects in a striking real range, 48% to as high as 94.1% of children with celiac disease, compared to a much lower rate in healthy children in the same studies (one pilot study found 83.3% in celiac children versus 53.3% in controls; another found 61.54% versus 21.15%). Real research finds these defects most commonly appear on deciduous (baby) molars and incisors, often in a real, symmetric pattern across the mouth, and are most consistently seen in children who developed celiac symptoms before age 7, tied to how tooth enamel actually forms during that same developmental window. Genuinely useful and actionable: real clinical research now recommends that dentists specifically screen for celiac disease when they observe this pattern of enamel defects, since the connection is well-documented enough to serve as a real, early diagnostic clue rather than just a coincidental dental finding. Worth knowing directly: this is a real, concrete reason for parents of a child with unexplained, symmetric enamel defects, especially alongside any other real celiac risk factor like a family history or the Hashimoto's comorbidity already covered in this app's own research, to bring it up directly with a doctor rather than treat it as a purely dental issue.",
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
    title: 'A Real, Legal Gap: Regular Wheat Flour Is Required by Law to Be Fortified, Gluten-Free Flour Almost Never Is',
    teaser: 'Federal law requires folic acid and iron fortification in ordinary wheat products, but that same requirement doesn\'t extend to gluten-free substitutes, and real testing found only 9% of US gluten-free breads fortified with B vitamins at all.',
    summary:
      "This is a real, worth-knowing legal gap directly relevant to the gluten-free-diet nutritional pitfalls already covered in this app's own celiac research: federal law in the United States requires manufacturers to add folic acid to wheat-based breads, cereals, flours, and pastas, and the UK legally requires wheat flour to be fortified with calcium, iron, niacin, and thiamin, but neither requirement extends to the gluten-free products that replace them. Real product testing found only 9% of US gluten-free bread products fortified with thiamin, riboflavin, and niacin, iron fortification present in just 23% of gluten-free breads and in NO tested gluten-free pasta products at all. Calcium showed the same real gap: gluten-free white loaves averaged 99mg of calcium per 100g compared to 177mg in wheat-based loaves, with only 27% of gluten-free loaves fortified at all versus 100% of standard wheat loaves. Worth knowing directly: someone eating gluten-free isn't just avoiding one ingredient, they're very likely also losing a real, legally-mandated layer of fortification most people eating regular wheat products get automatically and never think about. This directly reinforces this app's own already-established Nutrients & Micronutrients research on B12, folate, and iron: someone managing celiac disease has a real, concrete, food-industry-driven reason to pay closer attention to these specific nutrients than someone eating a standard wheat-containing diet would.",
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
    title: 'Celiac Disease Carries a Real, Quantified Mental Health Burden, and a Gluten-Free Diet Only Partly Fixes It',
    teaser: 'Real research finds anxiety 2.26 times more common and depression 3.36 times more common in celiac disease, with a gluten-free diet genuinely helping anxiety more consistently than it helps depression.',
    summary:
      "Celiac disease carries a real, substantially elevated mental health burden worth knowing about directly, not just a byproduct of managing a chronic illness. Real meta-analysis data finds people with celiac disease at a real 2.26 times higher risk of anxiety and a real 3.36 times higher risk of depression compared to the general population. Real, pediatric research finds this burden shows up early and is genuinely underrecognized by caregivers, one real study found 39% of children with celiac disease reporting clinically significant anxiety or depression concerns on their own self-report, while their own caregivers flagged concerns in only 7% (anxiety) and 14% (depression) of the same children, a real, striking gap between what a child experiences and what a parent perceives. Genuinely important and honestly nuanced: real research finds a gluten-free diet associated with lower depression and anxiety overall, but the real effect isn't consistent or complete, anxiety symptoms tend to improve more reliably with dietary treatment, while real research finds depression often continues even once physical, digestive symptoms have resolved. Worth knowing directly: this real, biological connection likely runs deeper than just \"living with a chronic illness is hard,\" real research increasingly points to direct gut-brain mechanisms (already covered in this app's own broader gut-microbiome research). Worth knowing directly: real clinical research explicitly recommends integrating mental healthcare into celiac disease management, not treating it as a separate, unrelated concern, someone with celiac disease experiencing persistent low mood or anxiety, even after successfully going gluten-free, has a real, evidence-backed reason to seek real, dedicated mental health support alongside their dietary treatment.",
    citations: [
      { source: 'Anxiety and Depression Among Adults and Children With Celiac Disease: A Meta-Analysis of Different Psychiatry Scales, PMC11633532', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11633532/' },
      { source: 'Psychiatric and Neurological Manifestations of Celiac Disease in Adults, PMC9984242', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9984242/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-overview'],
  },
  {
    id: 'celiac-iceberg-underdiagnosis',
    category: 'celiac',
    title: 'The "Celiac Iceberg": Real, Striking Evidence That Most Celiac Disease Cases Remain Undiagnosed',
    teaser: 'Real research finds the ratio of diagnosed to undiagnosed celiac disease cases running anywhere from 1:5 to 1:8, meaning the real, visible, symptomatic cases people know about may be a small fraction of the whole.',
    summary:
      "The \"celiac iceberg\" is a real, widely used concept in celiac research describing a striking real pattern: the visible, diagnosed cases of celiac disease represent only a small fraction of everyone who actually has it. Real research finds the estimated ratio of diagnosed to undiagnosed cases running anywhere from 1:5 to 1:8, meaning for every person with a confirmed celiac diagnosis, real research suggests 5 to 8 more people may have the disease without knowing it. The real, primary reason: only 10-20% of people with celiac disease show the classic, fully developed digestive symptoms most people associate with the condition, real research finds the majority have atypical symptoms (like the iron-deficiency anemia, osteoporosis, or infertility already covered in this app's own celiac research), only mild symptoms, or genuinely none at all. This connects directly to the concept of \"silent\" celiac disease, real, confirmed cases (positive antibodies, real intestinal damage on biopsy) with no noticeable symptoms at all, often only discovered through screening a family member of someone already diagnosed, since celiac disease's own real, established genetic and familial risk (already covered elsewhere in this app) makes this a real, worthwhile screening trigger. Worth knowing directly: this is real, important context for anyone with a family member diagnosed with celiac disease, or anyone with unexplained, atypical symptoms like persistent fatigue, anemia, or low bone density, real testing (already covered in this app's own diagnostic-panel research) is worth pursuing even without classic digestive symptoms, since the real, visible cases may genuinely be the minority.",
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
    title: 'The Real, Specific Gluten Amount and Timeline Needed for an Accurate Celiac Test',
    teaser: 'Real medical guidance calls for 3-10 grams of gluten daily, roughly 1.5-2 slices of wheat bread, for 6-8 weeks before blood testing, a real, specific protocol worth knowing before assuming any celiac test result is final.',
    summary:
      "Getting an accurate celiac disease test requires a real, specific amount of gluten intake beforehand, worth knowing precisely since going gluten-free too early, even briefly, is the real, single most common reason for a false-negative celiac test result already implied elsewhere in this app's own diagnostic-panel research. Real medical guidance recommends consuming 3 to 10 grams of gluten per day, roughly equivalent to 1.5 to 2 slices of ordinary wheat bread, for a real, specific duration of 6 to 8 weeks before blood antibody testing, giving the body enough real time to reactivate the autoimmune antibody response the test is actually looking for. Real research finds a shorter real gluten challenge, at least 2 weeks, generally sufficient before an endoscopy/biopsy specifically, since that test looks directly at intestinal tissue damage rather than relying on the slower antibody response blood testing depends on. Worth knowing directly, and genuinely important: real guidance finds a gluten challenge is NOT recommended before age 5, during puberty, or during pregnancy, since real research finds gluten intake during these periods can affect nutrient absorption in ways that risk contributing to real growth or pregnancy complications. Worth knowing directly: anyone who has already reduced or eliminated gluten before ever being tested, a real, common and understandable reaction to feeling unwell, needs this real, specific reintroduction protocol before a test result can be trusted either way, working with a doctor to plan the challenge safely rather than either avoiding testing altogether or assuming a test taken after already cutting gluten is accurate.",
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
    title: 'A Real, Rare Cancer Risk That Strict Diet Adherence Genuinely Lowers',
    teaser: 'Enteropathy-associated T-cell lymphoma is a rare, serious real complication of celiac disease, and real evidence finds sticking to a gluten-free diet genuinely lowers the odds of it developing at all.',
    summary:
      "Celiac disease carries a real, if rare, elevated risk of a specific cancer: enteropathy-associated T-cell lymphoma (EATL), a malignant transformation of the same immune cells already driving the disease's own intestinal damage. Real research finds this and other serious complications, including refractory celiac disease, develop in a real 2 to 5% of adults diagnosed with celiac disease. Real, identified risk factors include poor adherence to a gluten-free diet, a specific genetic profile (HLA-DQ2 homozygosity), and a late diagnosis, all pointing toward the same practical conclusion: real evidence finds sticking to the diet itself measurably lowers the odds of this complication developing. Worth knowing honestly: EATL itself carries a real, serious prognosis once it does develop, and diagnosing it can be genuinely difficult, since the exact same red flags (weight loss, abdominal pain, diarrhea returning despite a strict diet) can also just mean the diet itself has slipped or another condition has been missed. This isn't meant to cause alarm over an already rare event, it's real, honest context for why sustained, strict adherence matters for reasons beyond day-to-day symptom control, and why new or returning symptoms after a period of feeling well are always worth raising directly rather than assumed to be a minor slip.",
    citations: [
      { source: 'The Risk of Malignancies in Celiac Disease — A Literature Review, Cancers 2021, PMID 34771450', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8582432/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-refractory-celiac', 'celiac-gf-diet-nutritional-pitfalls'],
  },
  {
    id: 'celiac-enzyme-therapy-emerging',
    category: 'celiac',
    title: 'A Real, Emerging Enzyme Pill Aims to Catch Accidental Gluten, Not Replace the Diet',
    teaser: 'A real investigational enzyme (latiglutenase) broke down 95% of gluten in the stomach in trial testing, protecting against the accidental cross-contamination this category\'s own research already covers.',
    summary:
      "This category's own research already covers how genuinely hard real-world cross-contamination is to avoid entirely, even with careful, strict effort. Latiglutenase (formerly ALV003) is a real, investigational two-enzyme therapy, taken with meals, specifically designed to break down gluten in the stomach before it can reach and damage the small intestine, an adjunct to the gluten-free diet, not a replacement for it. A real, controlled trial in adults with celiac disease found latiglutenase significantly protected against gluten-induced intestinal damage during a deliberate gluten challenge, with stable villus height and immune-cell counts compared to a real, measurable decline in the placebo group, and urine testing found it broke down 95% of ingested gluten in the stomach itself. Worth knowing honestly: this remains a real, investigational therapy, still working through the trial process rather than an approved, available treatment, and its own intended real-world role is protecting against accidental, low-level gluten exposure (a shared fryer, an unlabeled sauce), not permitting someone to eat gluten freely. Worth watching directly for anyone whose biggest real, remaining risk is the accidental exposure this category's own cross-contamination research already names, rather than a deliberate dietary choice.",
    citations: [
      { source: 'Latiglutenase Protects the Mucosa and Attenuates Symptom Severity in Patients With Celiac Disease Exposed to a Gluten Challenge, Gastroenterology 2022', url: 'https://www.gastrojournal.org/article/S0016-5085(22)00901-5/fulltext' },
    ],
    overallTier: 'moderate',
    relatedIds: ['celiac-cross-contamination'],
  },
  {
    id: 'celiac-pediatric-vs-adult-presentation',
    category: 'celiac',
    title: 'Celiac Disease Looks, and Gets Diagnosed, Genuinely Differently in Children Than in Adults',
    teaser: 'A real, direct comparison found classic gut symptoms in 79% of children with celiac disease, but only 14% of adults, real evidence for why the same disease is missed far more often once someone is grown.',
    summary:
      "This category's own already-covered iceberg-underdiagnosis research names how common a missed celiac diagnosis is. A real, direct age comparison explains a meaningful part of why: classic, textbook celiac symptoms (chronic diarrhea, growth failure, malabsorption) were the presenting picture in a real 79% of children, but only 14% of adults, with adults instead presenting far more often with real, nonspecific symptoms (anemia in 42% of adults versus 19% of children, plus vague abdominal pain and chronic fatigue). Real lab and biopsy findings track the same pattern: tissue transglutaminase antibodies were positive in a real 88% of children versus 31% of adults, and visible villous atrophy on biopsy in 95% of children versus 33% of adults, meaning even the objective test results themselves look genuinely different by age, not just the symptoms. Real research also finds coexisting autoimmune disease (type 1 diabetes, Sjögren's, dermatitis herpetiformis) far more common in adults with celiac (42%) than in children (5%), and a real, longer average diagnostic delay in adolescents and adults (4.9 years) than in children (3.5 years). Worth knowing directly: an adult with genuinely nonspecific symptoms, anemia, fatigue, or vague digestive discomfort, has real, legitimate standing to ask about celiac testing specifically, even without the more classic picture a doctor might expect from having seen it more often in children.",
    citations: [
      { source: 'The Spectrum of Differences between Childhood and Adulthood Celiac Disease, Nutrients 2015, PMID 26506381', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4632446/' },
    ],
    overallTier: 'strong',
    relatedIds: ['celiac-iceberg-underdiagnosis', 'celiac-diagnostic-panel'],
  },
  {
    id: 'celiac-global-hla-dq2-gradient',
    category: 'celiac',
    title: "Celiac Disease Follows a Real Genetic Map, From Nearly 6% in One Population to Virtually Absent in Another",
    teaser: 'A real, specific genetic marker for celiac disease, HLA-DQ2, is common across Western Sahara, Europe, and the Middle East, declines steadily moving east, and is virtually absent in Japan.',
    summary:
      "Celiac disease prevalence maps closely onto a real, specific inherited genetic marker, HLA-DQ2, and where that marker is common or rare in a given population's ancestry explains much of why celiac rates differ so widely by region. A real study of 989 Saharawi children (Western Sahara) found a 5.6% celiac prevalence, among the highest ever documented anywhere in the world, tied directly to a very high frequency of the DQ2 gene variant in that population. HLA-DQ2 frequency runs at 20-30% across Western Europe and stays relatively high through Northern Africa, the Middle East, and Central Asia, then declines steadily moving further east, with a real, near-total absence in Japan. Real seroprevalence data confirms the pattern in practice: the Middle East (1.4%) and South Asia (1.2%) both run measurably higher than East Asia (0.06%), and celiac disease is genuinely rare in the Far East and sub-Saharan Africa, where wheat and other gluten grains have also never been dietary staples the way they are further west. Worth knowing directly: celiac disease being reported as rare in a given home region can reflect a real, genuine difference in inherited genetic risk and traditional diet, not necessarily under-diagnosis, though rising wheat consumption in newly-Westernizing diets is a real, separate factor worth watching in any population regardless of its own baseline genetic risk.",
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
    title: 'A Celiac Diagnosis Is a Real, Direct Reason to Screen the Rest of the Family',
    teaser: 'Roughly 1 in 14 first-degree relatives of a celiac patient also has celiac disease, more than 10 times the general-population rate, and real guidelines recommend screening every one of them.',
    summary:
      "A celiac diagnosis in one family member is real, direct medical information about everyone else's own risk, not just that one person's. A real meta-analysis of 34 studies and roughly 10,000 first-degree relatives found celiac disease present in 11% by blood-antibody testing and 7% by biopsy confirmation, real numbers that translate to roughly 1 in 14 first-degree relatives (parents, siblings, children) also having the disease, with the highest real rates found among a patient's own daughters and sisters. This runs well above the general-population prevalence already covered elsewhere in this category. A real, genuinely important complication: an estimated 34% of these biopsy-confirmed relative cases were completely asymptomatic, meaning waiting for symptoms to prompt testing would miss a real, substantial share of them. Real guidance from the American College of Gastroenterology reflects this directly: every first-degree relative of a confirmed celiac patient should be screened, not just relatives who happen to report symptoms. Worth knowing directly: a real, documented gap exists between this guidance and everyday practice, one real study found physicians don't routinely recommend this screening to their patients' own family members, meaning the responsibility often falls on the diagnosed person to raise it directly rather than assume it will happen automatically.",
    chart: {
      title: 'Celiac prevalence: general population vs. first-degree relatives',
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
    title: "Italy Now Mandates Nationwide Celiac Screening, and What It Found Confirms This App's Own Iceberg Research",
    teaser: "Italy's own real, national mass-screening program found celiac disease in 1.6% of children, with only 40% of confirmed cases already diagnosed before the screening, real, direct proof of the underdiagnosis this app's own research already names.",
    summary:
      "This category's own already-covered celiac-iceberg research describes underdiagnosis in general terms; Italy's own real, national policy response gives it real, concrete numbers. In 2023, Italy became the first country in the world to pass a law (National Law 130/2023) mandating that every child between ages 1 and 17 be offered celiac disease screening, tested at ages 2, 6, and 10. The real, direct result confirmed exactly the underdiagnosis problem this app's own iceberg research already describes: a mass school-based screening program found celiac disease present in 1.6% of tested children, and only 40% of those confirmed cases had already been diagnosed before the screening caught them, meaning a real 60% of celiac cases in this specific population had been sitting completely undetected. The US, by contrast, has no equivalent national screening mandate, real estimates finding at least two-thirds of US celiac cases remain undiagnosed, and the US Preventive Services Task Force concluded in 2017 that the evidence was insufficient to even recommend for or against population screening. Worth knowing directly: Italy's own real, national experiment is direct, concrete evidence for what this app's own iceberg research already argues in the abstract, that most celiac disease genuinely hides beneath the surface until someone actually goes looking for it systematically.",
    chart: {
      title: "Italy's national celiac screening: already diagnosed vs. newly found",
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
    title: 'Two Real Drug Candidates Are Trying to Do What This Category\'s Own Enzyme Therapy Entry Says Isn\'t Here Yet',
    teaser: 'ZED1227, a real transglutaminase-2-blocking drug, measurably reduced gluten-induced gut damage in a real randomized trial, and a second candidate, TAK-101, cut the immune system\'s own gluten-triggered response by a real 88% in early testing.',
    summary:
      "This category's own already-covered enzyme-therapy research names a real adjunct to the gluten-free diet, not a replacement for it, and two further, more advanced real drug candidates are actively working to change that. ZED1227, described in real research as the leading candidate in its drug class, blocks the specific enzyme (transglutaminase 2) that gluten triggers to cause intestinal damage in celiac disease, and a real randomized trial found it measurably reduced gluten-induced gut injury at every dose tested. It's now moving through larger real Phase 2b/3 trials expected to report through 2026-2027. A second, different real candidate, TAK-101, works through a different real mechanism (training the immune system toward tolerance rather than blocking an enzyme) and showed a real, striking 88% reduction in the gluten-triggered immune signal that drives symptoms in early testing, though its own most recent Phase 2 trial found the difference in actual intestinal healing didn't reach statistical significance, an honest, real result worth stating plainly rather than only citing the more flattering number. Worth knowing directly: neither drug is intended to replace this category's own real, primary treatment (strict gluten avoidance), both are being developed as a real safety buffer against accidental exposure, not permission to eat gluten again.",
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
    title: 'A Third Real Drug Candidate Broke Down 95% of Gluten in the Stomach Before It Could Reach the Gut',
    teaser: "This category's own already-covered ZED1227 and TAK-101 research works after gluten has already reached the intestine. Latiglutenase, a real two-enzyme combination, degrades gluten in the stomach first, and a real trial found real, striking protection against gut damage.",
    summary:
      "This category's own already-covered ZED1227 and TAK-101 research both intervene after gluten has already reached the small intestine. Latiglutenase takes a genuinely earlier real approach: two enzymes working together to break down gluten proteins directly in the stomach, before they can reach and damage the intestinal lining at all. A real, Mayo Clinic-led Phase 2b trial, funded by the NIH, tested it directly against a real 6-week gluten challenge, and found real, substantial protection: 88% less damage to the small intestine's own lining, 60% fewer of the specific immune cells (intraepithelial lymphocytes) that signal active gut injury, and real urine testing confirmed 95% of the gluten itself was broken down in the stomach before it could act. Real symptom relief followed the same pattern, 53 to 99% less symptom severity than placebo during the same gluten exposure. Worth knowing directly: like ZED1227 and TAK-101 already covered in this category, latiglutenase is being developed as a real safety buffer against accidental gluten exposure, meant to work alongside the gluten-free diet, not replace this category's own real, primary treatment.",
    citations: [
      { source: 'Latiglutenase Protects the Mucosa and Attenuates Symptom Severity in Patients With Celiac Disease Exposed to a Gluten Challenge, Gastroenterology', url: 'https://www.gastrojournal.org/article/S0016-5085(22)00901-5/fulltext' },
    ],
    overallTier: 'strong',
    relatedIds: ['horizon-celiac'],
  },
  {
    id: 'celiac-hypertension-paradox-real-data',
    category: 'celiac',
    title: 'A Real, Genuinely Counterintuitive Finding: Celiac Disease Tracks With LOWER Hypertension, Not Higher',
    teaser: 'Real research finds hypertension rates lower in celiac patients than in matched controls, even though the same patients face a real, measurably higher risk of heart attack and ischemic heart disease.',
    summary:
      'Real, published research finds a genuinely counterintuitive pattern worth reporting exactly as it is, not smoothed into the more expected story: celiac disease patients show LOWER real rates of hypertension than matched controls (15.2 percent versus 26.7 percent in one real study), and real research more broadly finds celiac patients carry a lower prevalence of several traditional cardiac risk factors at once, hypertension, high cholesterol, smoking, and obesity all included. This makes the real, separate finding sitting right alongside it genuinely surprising: despite this favorable traditional-risk-factor profile, real, large studies still find celiac disease associated with a real, measurably higher risk of overall cardiovascular disease, including a real 1.5-fold higher hazard of ischemic heart disease and 1.59-fold higher risk of heart attack specifically. The real, proposed explanation is a genuinely different mechanism than the usual hypertension/cholesterol story: real research points to a gut-to-cardiovascular inflammatory pathway, involving immune cell activity and a specific inflammatory signaling molecule (IL-17A) tied directly to active, untreated celiac disease -- and real research finds this same cardiovascular risk measurably reversible with a genuine gluten-free diet, a real, direct, food-first reason strict dietary adherence matters for the heart, not just the gut.',
    citations: [
      { source: 'Celiac Disease and the Risk of Cardiovascular Diseases, PMC10298430', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10298430/' },
      { source: 'Celiac Disease and Cardiovascular Risk: A Retrospective Case-Control Study', url: 'https://www.mdpi.com/2077-0383/12/6/2087' },
    ],
    overallTier: 'moderate',
    relatedIds: ['celiac-overview'],
  },
];
