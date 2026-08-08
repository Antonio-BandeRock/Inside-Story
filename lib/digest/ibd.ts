import type { DigestEntry } from './types';

// Inflammatory Bowel Disease -- 11 entries, added 2026-08-08 as this app's
// seventh real condition, next in the same priority order every condition
// before it followed. Built with real self-advocacy content included from
// the start, the same lesson already applied to every condition since
// Graves'.
//
// IBD covers two real, distinct diseases under one umbrella, Crohn's
// disease and ulcerative colitis, and this category is deliberately
// precise about which findings apply to which, rather than treating IBD
// as one monolithic condition -- several of the strongest findings here
// (the smoking paradox, primary sclerosing cholangitis) run in genuinely
// different directions or affect the two diseases unevenly.
//
// Distinct from otherAutoimmune.ts's own 'other-ibd' entry, which stays
// exactly as it was: IBD's own endoscopically-confirmed AIP trial and
// SCFA-depletion findings, studied as corroborating evidence for
// Hashimoto's own research, written for a Hashimoto's reader. This
// category is the opposite direction -- IBD as its own real, primary
// condition, written for someone who has selected ibd in their own
// Profile. Cross-links back to that entry and to this app's own Gut &
// Microbiome category rather than re-explaining the same mechanisms twice.
//
// Every citation here was independently verified via WebSearch before
// being written in, the same discipline the rest of this Digest already
// holds to.
export const IBD_ENTRIES: DigestEntry[] = [
  {
    id: 'ibd-overview',
    category: 'ibd',
    title: "Inflammatory Bowel Disease: Two Real, Distinct Diseases Under One Name",
    teaser: "Crohn's and ulcerative colitis get grouped together constantly. Several of the real findings in this category only make sense once you know which one is which.",
    summary:
      "Inflammatory bowel disease is an umbrella term for two real, genuinely different autoimmune conditions. Ulcerative colitis causes continuous inflammation limited to the colon and rectum. Crohn's disease can affect any part of the digestive tract from mouth to anus, often in patchy \"skip lesions\" rather than one continuous stretch, and can penetrate deeper into the intestinal wall than ulcerative colitis typically does. This distinction isn't academic. Several of the real findings in this category, most strikingly how smoking affects each disease, run in genuinely different, even opposite, directions depending on which one someone actually has. This app's own Gut & Microbiome category already covers real, direct evidence from IBD research: an endoscopically-confirmed AIP diet trial and documented depletion of the same short-chain-fatty-acid-producing bacteria this app's whole gut-repair argument is built around. This category covers what's specific to actually living with and managing either disease.",
    citations: [
      { source: 'Crohn\'s Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/crohns-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-ibd', 'ibs-vs-ibd-distinction', 'vitamine-deficiency-real-causes'],
  },
  {
    id: 'ibd-smoking-paradox',
    category: 'ibd',
    title: "Smoking: Genuinely Protective for One IBD Subtype, Genuinely Harmful for the Other",
    teaser: "The same habit, the same gut bacterium even, producing opposite real effects depending on which disease is actually present.",
    summary:
      "Smoking's relationship with IBD is one of the most striking, well-documented paradoxes in this whole app's research: it's a real, established risk factor for developing and worsening Crohn's disease, while showing a real, paradoxical protective effect against ulcerative colitis. A recent, specific mechanism helps explain why. Smoking produces metabolites that let a particular mouth bacterium, Streptococcus mitis, establish itself in the gut, triggering an immune response through Th1 cells. In Crohn's disease, this worsens things, since Th1 cells are already central to the disease's own inflammatory process. In ulcerative colitis, those same Th1 cells work against the disease's own different underlying immune imbalance, genuinely calming inflammation instead. A separate, molecular-level mechanism adds to the Crohn's-specific harm: cigarette smoke upregulates a receptor (GPR15) that drives T cells toward becoming Th17 cells, the same inflammatory cell type this app's own Gut & Microbiome research already names as central to autoimmune disease broadly. This is included as a genuinely important finding to know, not a suggestion to smoke for ulcerative colitis. Smoking carries enough separately well-established harm, cardiovascular disease, cancer, to outweigh this one narrow protective association many times over, the same standing caveat this app already applies to Hashimoto's own smoking paradox.",
    citations: [
      { source: 'Impact of Cigarette Smoking on the Gastrointestinal Tract Inflammation: Opposing Effects in Crohn\'s Disease and Ulcerative Colitis', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5797634/' },
      { source: 'GPR15 differentially regulates the effects of cigarette smoke exposure on Crohn\'s disease and ulcerative colitis', url: 'https://www.nature.com/articles/s41392-025-02384-8' },
    ],
    overallTier: 'strong',
    relatedIds: ['lifestyle-smoking-paradox', 'graves-smoking'],
  },
  {
    id: 'ibd-een-crohns',
    category: 'ibd',
    title: "Exclusive Enteral Nutrition: Food-as-Medicine With Real, First-Line Trial Evidence in Pediatric Crohn's",
    teaser: 'A liquid-formula-only diet reaching real remission rates comparable to steroids, genuinely recommended before medication in appropriate cases.',
    summary:
      "Exclusive enteral nutrition (EEN), replacing all regular food with a complete liquid nutritional formula for a defined period, is a real, first-line therapy specifically for inducing remission in mild-to-moderate pediatric Crohn's disease, considered as effective as corticosteroid treatment by real clinical guidance. The real remission numbers are genuinely strong: one trial found 83% of pediatric patients in complete clinical remission after 6 weeks of EEN, and a separate trial using a reverse-engineered formula found 80% in remission after just 4 weeks. The real mechanism traces back to this app's own core gut-microbiome framework: research finds EEN works substantially by reshaping the gut microbiome itself, reducing proinflammatory microbial components rather than simply resting the bowel. The real, practical limitation worth knowing honestly: adherence is genuinely hard, with about 38% of patients discontinuing early in one real study, driven by taste, nausea, and discomfort from the nasogastric tube some patients need to complete the full liquid-only period. A real, first-line, food-based therapy this app's own mission is built to take seriously, with a real, honest cost attached.",
    citations: [
      { source: 'Exclusive Enteral Nutrition Induces Remission in Pediatric Crohn\'s Disease via Modulation of the Gut Microbiota', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5662815/' },
      { source: 'Exclusive enteral nutrition for induction of remission in pediatric Crohn\'s disease: Short- and long-term tolerance and acceptance', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11810808/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ibd-fiber-flare-myth',
    category: 'ibd',
    title: 'The "Low-Fiber During a Flare" Advice Has Real, Surprisingly Thin Evidence Behind It',
    teaser: 'Widely repeated, commonly prescribed, and a direct check of the actual research found almost nothing to support it.',
    summary:
      "Restricting fiber during an active IBD flare is some of the most commonly given dietary advice in this whole condition, routinely handed out by real clinicians. A direct check of the actual evidence behind it turns up a genuinely surprising gap: real reviews find no evidence that a low-residue or low-fiber diet actually reduces inflammation during a flare, and only limited, weak research supporting fiber restriction at all, mostly inherited practice rather than demonstrated benefit. The real evidence runs, if anything, in the opposite direction for the bigger picture. A large real dietary survey of 1,130 Crohn's disease patients found people in the highest quartile of fiber intake were less likely to have a flare within six months, and separate research finds adequate fiber intake (25-30 grams a day) genuinely linked to a healthier gut microbiome, lower inflammation markers, and better maintenance of remission. This isn't a case for eating high-fiber foods during active, severe symptoms, when genuine short-term GI distress is a real, separate consideration worth managing with a doctor's guidance. It's a real, honest correction to how confidently the low-fiber default gets applied as a blanket rule rather than a short-term, symptom-driven adjustment.",
    citations: [
      { source: 'Low Residue vs. Low Fiber Diets in Inflammatory Bowel Disease: Evidence to Support vs. Habit?', url: 'https://practicalgastro.com/2015/07/08/low-residue-vs-low-fiber-diets-in-inflammatory-bowel-disease-evidence-to-support-vs-habit/' },
      { source: 'Dietary Strategies for Gut Barrier Integrity in Inflammatory Bowel Disease: The Impact of Fiber and Beyond', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12893188/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'ibd-fodmap-remission-symptoms',
    category: 'ibd',
    title: "IBS-Type Symptoms During Real IBD Remission: A Different Problem, With Its Own Real Fix",
    teaser: 'Not every symptom during remission means the disease is active again. A real, separate mechanism, and a real diet built specifically for it, can explain a lot of it.',
    summary:
      "A real, common, and genuinely confusing situation in IBD: someone reaches true remission by every objective measure, calprotectin normal, no visible inflammation, and still has real, ongoing digestive symptoms. A meaningful share of this turns out to be a real, separate, overlapping condition, IBS-type symptoms occurring alongside quiet IBD rather than active disease itself. A low-FODMAP diet, already a real, evidenced approach for irritable bowel syndrome specifically, has real research support for exactly this situation, genuine symptom improvement in IBD patients in remission who still experience IBS-type symptoms. This is a real, important distinction to hold onto: a low-FODMAP diet targets symptom management for a real, separate overlapping issue, not inflammation itself, and isn't a substitute for the real disease-modifying treatment (medication, and where appropriate, EEN) that actually treats IBD. Worth raising directly with a doctor or dietitian when remission by every test still doesn't feel like remission, rather than assuming a flare is starting or that nothing more can be done.",
    citations: [
      { source: 'Low-FODMAP Diet for the Management of Irritable Bowel Syndrome in Remission of IBD', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9658010/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibd-calprotectin', 'ibs-low-fodmap-diet'],
  },
  {
    id: 'ibd-extraintestinal-manifestations',
    category: 'ibd',
    title: "IBD Reaches Well Past the Gut. Up to Half of Patients Develop a Real Symptom Somewhere Else Entirely.",
    teaser: 'Joints, skin, eyes, and, in one specific real case, the bile ducts themselves -- real, documented complications outside the digestive tract.',
    summary:
      "IBD's own real reach extends well beyond the gut. Real research finds up to 50% of IBD patients develop at least one extraintestinal manifestation during their disease course, a real symptom or complication in an organ system that has nothing to do with digestion on the surface. Joint inflammation (arthritis) is among the most common. Real skin manifestations include erythema nodosum (tender red nodules, usually on the shins) and pyoderma gangrenosum (a real, more serious ulcerating skin condition). Real eye involvement includes uveitis, inflammation inside the eye that needs prompt treatment to avoid vision complications. The single most specific, disease-linked example: primary sclerosing cholangitis (PSC), a real, chronic, progressive scarring of the bile ducts that can eventually lead to liver failure, shows up specifically alongside ulcerative colitis far more than Crohn's disease, real prevalence estimates running 2.4% to 7.4% of UC patients, and worth knowing directly because PSC itself, once present, calls for its own separate, more frequent colorectal cancer surveillance schedule.",
    citations: [
      { source: 'Inflammatory Bowel Disease and Primary Sclerosing Cholangitis: A Review of the Phenotype and Associated Specific Features', url: 'https://www.gutnliver.org/journal/view.html?doi=10.5009%2Fgnl16510' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-colonoscopy-surveillance', 'ibd-extraintestinal-real-prevalence-split'],
  },
  {
    id: 'ibd-thyroid-comorbidity-honest-null',
    category: 'ibd',
    title: "IBD and Hashimoto's: A Real Study Found No Overall Link, With One Real, Specific Exception",
    teaser: "Not every autoimmune condition pair in this app shows the same strong overlap. This one is a genuinely honest, more mixed picture.",
    summary:
      "This app's own Type 1 Diabetes and Celiac Disease categories both cover real, strong, quantified overlaps with Hashimoto's. IBD's own picture is genuinely more mixed, and worth reporting exactly as honestly as the stronger findings elsewhere in this app. A large, recent German primary care study found no significant overall association between IBD (either Crohn's or ulcerative colitis) and autoimmune thyroiditis. That's a real, meaningful null result, not a gap in the research. The same study did find one real, specific exception: among patients 65 and older, IBD was associated with a significantly higher risk specifically of Graves' disease, not Hashimoto's, roughly tripled in both Crohn's and ulcerative colitis patients in that age group. The honest takeaway: IBD doesn't carry the same broad, quantified Hashimoto's-comorbidity signal that T1D and celiac disease do, and pretending otherwise just because these conditions all share the word \"autoimmune\" would misrepresent the actual research. Worth knowing especially for anyone assuming every autoimmune diagnosis automatically raises Hashimoto's risk the same amount.",
    citations: [
      { source: 'Inflammatory Bowel Diseases Are Not Associated with an Increased Risk of Autoimmune Thyroiditis', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12921990/' },
      { source: 'Thyroid disorders and inflammatory bowel disease: an association present in adults but also in children and adolescents', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11832402/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'ibd-calprotectin',
    category: 'ibd',
    title: 'Fecal Calprotectin: A Real, Non-Invasive Way to Know Whether the Gut Is Actually Inflamed',
    teaser: 'A stool test that predicts what a colonoscopy would show, without needing the colonoscopy every time.',
    summary:
      "Fecal calprotectin is a real, genuinely useful non-invasive marker for actual gut inflammation, distinct from and often more specifically reliable than a general blood marker like CRP for IBD specifically. Real pooled research finds it correctly identifies IBD with about 88% sensitivity and 80% specificity, and a level at or below roughly 60 micrograms per gram predicts deep remission (genuinely healed gut tissue, not just symptom absence) with over 85% sensitivity and specificity in ulcerative colitis. It's also real, useful for predicting a coming relapse before symptoms fully return, with an optimal threshold around 152 micrograms per gram flagging real, elevated relapse risk. Worth asking for directly, especially when deciding whether new or returning symptoms mean real active inflammation (worth investigating further, possibly via colonoscopy) or something else entirely, like the real, separate IBS-overlap situation covered elsewhere in this category, since guessing from symptoms alone is exactly what this test exists to avoid.",
    citations: [
      { source: 'Diagnostic Accuracy of Fecal Calprotectin for Predicting Relapse in Inflammatory Bowel Disease: A Meta-Analysis', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9917450/' },
      { source: 'Fecal Calprotectin for the Evaluation of Inflammatory Bowel Disease, American Family Physician', url: 'https://www.aafp.org/afp/2021/0900/p303' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-fodmap-remission-symptoms', 'ibs-red-flags-workup'],
  },
  {
    id: 'ibd-colonoscopy-surveillance',
    category: 'ibd',
    title: 'Colorectal Cancer Surveillance: A Real, Specific Starting Point, With a Real Reason It Moves Up for Some',
    teaser: 'Long-standing colitis carries a real, elevated cancer risk. One specific complication cuts the wait to surveillance down to every single year.',
    summary:
      "Long-standing colonic inflammation from IBD carries a real, elevated colorectal cancer risk, which is exactly why real surveillance guidance exists on a defined schedule rather than waiting for symptoms. Real guidance recommends starting surveillance colonoscopy 8 years after diagnosis for left-sided or extensive ulcerative colitis, and for Crohn's disease involving over 30% of the colon or more than one colonic segment, then repeating every 1 to 2 years, extending to every 5 years for patients with no intermediate or high-risk features found on a prior exam. The one real, specific exception worth knowing directly: anyone who also has primary sclerosing cholangitis (PSC), the same bile-duct complication covered elsewhere in this category, should have annual surveillance starting immediately at PSC diagnosis, not the standard 8-year wait, since PSC itself substantially raises colorectal cancer risk on top of the IBD risk alone. Worth confirming which schedule actually applies given real, individual disease extent and any PSC diagnosis, rather than assuming the standard interval automatically applies to everyone.",
    citations: [
      { source: 'Colorectal cancer prevention: colonoscopic surveillance in adults with ulcerative colitis, Crohn\'s disease or adenomas', url: 'https://www.ncbi.nlm.nih.gov/books/NBK588749/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-extraintestinal-manifestations'],
  },
  {
    id: 'ibd-azathioprine-tpmt',
    category: 'ibd',
    title: 'Azathioprine: A Real, FDA-Recommended Genetic Test Before the First Dose',
    teaser: 'One gene largely determines how safely this drug gets metabolized. Testing for it before starting is a real, specific recommendation, not routine caution.',
    summary:
      "Azathioprine, a common immunomodulator used in IBD, is broken down in the body largely by an enzyme called TPMT (thiopurine methyltransferase), and how well someone's own TPMT gene works genuinely determines how safely a standard dose gets processed. The FDA specifically recommends TPMT genotyping or activity testing before starting azathioprine, not just as routine caution. The real reason: severe, sudden myelosuppression (a dangerous drop in blood cell production) can develop in an estimated 3% of patients, more likely with reduced TPMT function, and more likely in the first eight weeks of treatment. A related gene, NUDT15, matters especially for patients of Asian or Hispanic descent, where it's a more common cause of thiopurine intolerance than TPMT variants alone. Worth knowing directly: a normal TPMT/NUDT15 result doesn't mean monitoring stops. Regular complete blood counts remain necessary throughout treatment regardless of genetic test results, since the genetic test predicts risk, it doesn't replace watching for the real thing directly.",
    citations: [
      { source: 'Thiopurine methyltransferase (TPMT) genotyping to predict myelosuppression risk', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3094768/' },
      { source: 'Azathioprine Therapy and TPMT and NUDT15 Genotype, Medical Genetics Summaries, NCBI', url: 'https://www.ncbi.nlm.nih.gov/books/NBK100661/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ibd-tying-together',
    category: 'ibd',
    title: 'What Actually Holds Up for IBD, Pulled Together',
    teaser: 'A real, food-based first-line therapy, a widely repeated piece of advice with surprisingly thin support, and a genuinely honest null result on Hashimoto\'s.',
    summary:
      "Line up everything in this category and IBD reads as a condition where precision about which disease, and which real number, matters more than almost anywhere else in this app. Smoking is a real, opposite-direction risk factor depending on whether it's Crohn's or ulcerative colitis, not a single, uniform IBD finding. Exclusive enteral nutrition is a genuinely strong, food-based, first-line therapy for pediatric Crohn's specifically, real remission rates rivaling steroids. The low-fiber-during-a-flare advice, repeated constantly, turns out to have real, surprisingly thin support, while adequate fiber intake carries real evidence for reducing flare risk over time. The two self-advocacy entries carry the same kind of precise numbers already established as this app's own standard: fecal calprotectin's own real sensitivity/specificity and deep-remission threshold, and azathioprine's real, FDA-recommended genetic test before the first dose. And the honest, quantified null result on Hashimoto's comorbidity, alongside the real, specific Graves' exception in older patients, is exactly the kind of finding this whole Digest exists to report accurately rather than smooth into a pattern that isn't actually there.",
    citations: [
      { source: 'Crohn\'s Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/crohns-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-smoking-paradox', 'ibd-een-crohns', 'ibd-fiber-flare-myth', 'ibd-calprotectin', 'ibd-azathioprine-tpmt', 'ibd-thyroid-comorbidity-honest-null'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'ibd-montreal-classification',
    category: 'ibd',
    title: "IBD Has a Real, Formal Classification System That Directly Shapes Treatment Choice",
    teaser: "The Montreal classification real-world sorts Crohn's by age, location, and behavior, and ulcerative colitis by how far the inflammation actually reaches -- not just \"mild\" or \"severe.\"",
    summary:
      "IBD is real, formally classified using the Montreal classification, widely used at initial diagnosis to guide treatment. For Crohn's disease, three real dimensions are recorded: age at diagnosis (under 16, 17-40, or over 40), location (ileal, colonic, ileocolonic, or isolated upper-GI disease), and behavior (non-stricturing/non-penetrating, stricturing, or penetrating, with a separate marker for perianal disease). For ulcerative colitis, the real classification is about how far inflammation extends: E1 (proctitis, limited to the rectum), E2 (left-sided, up to the splenic flexure), or E3 (extensive, reaching beyond it). This isn't just record-keeping: the real, practical value is that a person's own specific classification (a penetrating Crohn's pattern, say, versus a non-stricturing one) directly shapes which treatment (immunomodulators, biologics, or surgery) a gastroenterologist actually recommends, real, useful vocabulary worth understanding rather than treating as an opaque chart note.",
    citations: [
      { source: 'Montreal Classification for Inflammatory Bowel Disease (IBD) Calculator, MDCalc', url: 'https://www.mdcalc.com/calc/10237/montreal-classification-inflammatory-bowel-disease-ibd' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ibd-extraintestinal-real-prevalence-split',
    category: 'ibd',
    title: "The Real, Quantified Split: Which Extraintestinal Symptoms Are More Common in Crohn's, and Which in Ulcerative Colitis",
    teaser: "A direct, more granular follow-up to this category's own PSC entry: a real meta-analysis breaks joint, skin, and eye involvement down by exact percentage and by which of the two diseases carries the higher real risk.",
    summary:
      "This app's own extraintestinal-manifestations entry above already names the real categories (joints, skin, eyes, and PSC specifically); a real, larger meta-analysis adds the exact numbers behind them. At least one joint, eye, or skin extraintestinal manifestation appears in 24% of IBD patients overall, 27% of ulcerative colitis, and 35% of Crohn's disease specifically, with roughly a quarter of affected patients experiencing more than one at once. Peripheral joint arthritis/arthralgia affects 5-10% of ulcerative colitis patients and 10-20% of Crohn's patients; erythema nodosum, tender red skin nodules, shows up in a real, smaller 1.6-1.9% of patients. The real, consistent pattern across this same body of research: eye involvement, peripheral joint manifestations, and erythema nodosum are all genuinely more common in Crohn's disease than ulcerative colitis, a real, useful, specific piece of context for anyone managing either disease and noticing a new joint or skin symptom that might otherwise seem unrelated.",
    citations: [
      { source: 'Prevalence of Extraintestinal Manifestations in Inflammatory Bowel Disease: A Systematic Review and Meta-analysis, PMID 37042969', url: 'https://pubmed.ncbi.nlm.nih.gov/37042969/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-extraintestinal-manifestations'],
  },
  {
    id: 'ibd-history-milestones',
    category: 'ibd',
    title: "IBD's Own Real History: Two Real, Separately Discovered Diseases That Took Decades to Be Told Apart",
    teaser: '1875, 1932, the early 2000s -- ulcerative colitis and Crohn\'s disease were described 57 real years apart, and a real genetic discovery over a century later finally explained part of why.',
    summary:
      "IBD's own two real, distinct diseases were discovered decades apart. Ulcerative colitis came first, in 1875, when English physicians Wilks and Moxon distinguished it from infectious diarrheal disease. Crohn's disease wasn't formally described until 1932, when Burrill Crohn, Leon Ginzberg, and Gordon Oppenheimer published a real, landmark 14-case paper describing what they initially called \"regional ileitis,\" a genuine advance over the era's default assumption that any small-intestine disease must be tuberculosis. Real, earlier isolated case observations actually predate the 1932 paper (Morgagni in the 1700s, Berg in 1898, Lesniowski in 1904, Dalziel in 1913), meaning the disease existed in medical records well before it was formally named and understood as its own condition. The real, modern genetic turning point came in the early 2000s: discovery of the NOD2/CARD15 gene mutation gave the first real, molecular explanation for Crohn's own genetic susceptibility, opening the door to the TNF-alpha-targeting biologic therapies (infliximab, adalimumab, both already covered in this app's own medication research) that transformed real treatment in the years that followed.",
    citations: [
      { source: "Historical aspects of inflammatory bowel disease, PMID 2980764", url: 'https://pubmed.ncbi.nlm.nih.gov/2980764/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ibd-pregnancy-remission-first',
    category: 'ibd',
    title: "The Single Biggest Real Predictor of a Healthy IBD Pregnancy: Remission Before Conception, Not During It",
    teaser: 'Real research names active disease at the moment of conception as one of the clearest, most consistent risk factors for a flare throughout pregnancy -- worth knowing before, not after, conceiving.',
    summary:
      "IBD pregnancy outcomes trace back to a real, specific, and genuinely actionable timing fact: real research consistently names active disease AT CONCEPTION, not just at some point during pregnancy, as one of the clearest risk factors for a flare throughout the pregnancy that follows, alongside having ulcerative colitis specifically (rather than Crohn's) and a real history of active disease during a previous pregnancy. This makes preconception planning genuinely more consequential here than in many other conditions this app covers: real guidance is to achieve disease remission before conception whenever possible, and, worth stating directly since it runs against a common, understandable instinct, to KEEP taking IBD medication through pregnancy rather than stopping it out of caution, since stopping is what actually raises real flare risk. The real, reassuring medication-safety finding: anti-TNF biologics (already covered in this app's own medication research) are considered safe across multiple real registries and observational studies, with continuing them through the third trimester specifically linked to a real, lower flare risk and no increased infant infection risk in the first year of life from in-utero exposure.",
    citations: [
      { source: 'Pregnancy and medications for inflammatory bowel disease: An updated narrative review, PMID 36969991', url: 'https://pubmed.ncbi.nlm.nih.gov/36969991/' },
    ],
    overallTier: 'strong',
  },

  // -- Second depth pass, 2026-08-08, extending full-parity work to the
  // first 10 non-Hashimoto's conditions. Every citation independently
  // verified via WebSearch.
  {
    id: 'ibd-fecal-microbiota-transplant',
    category: 'ibd',
    title: 'Fecal Microbiota Transplantation Shows Real, if Still Developing, Promise for Ulcerative Colitis',
    teaser: 'Already an established, FDA-recognized treatment for recurrent C. diff infection, real capsule-based FMT trials in ulcerative colitis found remission in over half of patients at 12 weeks, though results still vary meaningfully between studies.',
    summary:
      "Fecal microbiota transplantation, transferring processed stool from a screened, healthy donor into someone's own gut, is already a real, well-established treatment for recurrent Clostridioides difficile infection, and that established track record is what's driving real, serious research into whether it can do something similar for ulcerative colitis, a condition already tied directly to gut dysbiosis in this app's own existing research. A real study using capsulized (swallowable) FMT found clinical remission in 57.1% of patients and a clinical response in 76.2% after 12 weeks, with real mechanistic work showing the benefit tracks with actual gut microbial colonization and metabolite changes, not just a placebo effect. Worth stating honestly rather than oversold: results genuinely vary across different trial centers, with steroid-free remission reported at 32% in one trial and 44% in another, and a real 2025 systematic review and meta-analysis of randomized controlled trials found the evidence base still developing, calling for more standardized, robust trials before this becomes a routine option. The real, proposed mechanisms line up directly with this app's own already-established gut-health research: correcting microbiota dysbiosis, reducing intestinal permeability, and increasing short-chain fatty acid production, the same real, gut-barrier-protective pathway already covered for autoimmune disease broadly. Worth knowing directly: this is real, promising, mechanistically grounded evidence, not yet a settled, universally effective therapy, and anyone considering it should treat it as still-emerging alongside a real gastroenterologist's guidance, not a proven first-line option.",
    citations: [
      { source: 'Fecal microbiota transplantation for patients with ulcerative colitis: a systematic review and meta-analysis of randomized control trials, PMC12006273', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12006273/' },
      { source: 'Capsulized Fecal Microbiota Transplantation Induces Remission in Patients with Ulcerative Colitis by Gut Microbial Colonization and Metabolite Regulation, PMC10269780', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10269780/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibd-fiber-flare-myth', 'ibs-fecal-microbiota-transplant-mixed'],
  },

  // -- Volumetric depth pass, 2026-08-08, continuing toward genuine
  // volumetric parity with Hashimoto's own depth, per direct instruction
  // that all 18 non-Hashimoto's conditions deserve the same fully
  // encompassing treatment, individually and in combination. Every
  // citation independently verified via WebSearch.
  {
    id: 'ibd-vitamin-d-deficiency-severity',
    category: 'ibd',
    title: 'Vitamin D Deficiency Is Real, Common, and Real Tracks Directly With How Active IBD Actually Is',
    teaser: 'Real studies find vitamin D deficiency in 22-64% of IBD patients, with deficiency directly correlating with higher inflammatory markers, more relapses, more surgery, and a slower response to biologic medications.',
    summary:
      "Vitamin D deficiency is real, common, and genuinely more than an incidental finding in inflammatory bowel disease, it tracks directly with real disease severity itself. Real studies find deficiency prevalence ranging from 22% to 63% depending on the population and how deficiency is defined, with one study of 504 IBD patients finding 49.8% deficient overall and 10.9% severely so, and real clinical observation finding roughly 60-64% of both Crohn's and ulcerative colitis patients affected. This is real, more than a coincidental overlap: real research finds a statistically significant reverse correlation between lower vitamin D levels and higher inflammatory markers, and deficiency itself associated with a higher rate of relapse, increased risk of needing surgery, and a slower response to biologic medications. The real, biological explanation involves vitamin D's own active form playing a genuine, direct role in immune regulation and gut barrier function, the exact mechanism already covered in this app's own gut-microbiome Vitamin D/CLDN2 tight-junction research. Worth knowing directly: this makes vitamin D testing and correction a real, concrete, actionable piece of IBD management, not just a general wellness recommendation, someone with IBD experiencing more frequent flares or a weaker response to their current biologic treatment has a real, evidence-backed reason to ask specifically about their vitamin D status.",
    citations: [
      { source: 'High Prevalence and Clinical Associations of Vitamin D Deficiency in Inflammatory Bowel Disease, PMC12694141', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12694141/' },
      { source: 'Lower vitamin D levels are associated with the pathogenesis of inflammatory bowel diseases, PMC10578731', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10578731/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-vitamin-d-cldn2', 'vitamind-tying-together'],
  },
  {
    id: 'ibd-hygiene-hypothesis-early-life',
    category: 'ibd',
    title: 'Early-Life Microbial Exposure Genuinely Shapes IBD Risk, a Real Piece of "The Hygiene Hypothesis"',
    teaser: 'Real research finds having older siblings, and other markers of richer early-life microbial exposure, tied to real, lower IBD risk, while a more sterile early environment appears to leave real, lasting gaps in immune training.',
    summary:
      "The hygiene hypothesis proposes that reduced microbial exposure in early life, a real byproduct of modern hygiene and living conditions, may leave the developing immune system less well \"trained,\" real, plausibly raising the risk of immune-mediated diseases like IBD later on. Real animal research finds improved hygiene tied to decreased microbiota diversity and a shift toward a real, more proinflammatory immune response pattern, with early childhood specifically identified as the critical window for the developing gut immune system, microbiome, and mucosal-bacterial relationships to establish themselves. Real human research finds concrete, supporting evidence: having older siblings, a real marker of greater early-life microbial exposure, is associated with reduced IBD risk, while real research finds cesarean delivery (which bypasses the vaginal microbial exposure of a natural birth) can slow the pace of a newborn's own gut microbiome colonization. The real, proposed protective mechanism ties directly to this app's own already-established gut-immunology research: diverse early microbial exposure promotes the development of regulatory T cells (Tregs) and boosts anti-inflammatory signaling molecules like IL-10, the same real, protective pathway already covered elsewhere in this app for autoimmune disease broadly. Worth knowing directly: this is real, genuinely fascinating, if not yet fully actionable, context for why IBD rates have risen alongside modernization, and it reinforces, from a completely different angle, why supporting a diverse gut microbiome throughout life, not just in infancy, remains a real, central piece of this app's own core mission.",
    citations: [
      { source: 'Early-Life Hygiene-Related Factors and Risk of Inflammatory Bowel Disease: A Scandinavian Birth Cohort Study, PMC11447116', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11447116/' },
      { source: 'Early life exposures and the microbiome: implications for inflammatory bowel disease prevention, PMC11150004', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11150004/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibd-overview', 'gut-scfa-treg'],
  },
  {
    id: 'ibd-anti-tnf-loss-of-response',
    category: 'ibd',
    title: 'Anti-TNF Biologics Can Real Stop Working Over Time, a Real, Common, and Manageable Problem With Its Own Name',
    teaser: 'Real research finds secondary loss of response to anti-TNF biologics affecting 13-21% of patients per year, often caused by the body developing real antibodies against the drug itself, a real, testable, and addressable problem.',
    summary:
      "Anti-TNF biologics (already covered by name for both RA and IBD elsewhere in this app's own medication research) can genuinely stop working over time in a real, well-documented, and specifically named phenomenon: secondary loss of response. Real research finds this affects 13-21% of patients per year, on top of real primary non-response (the drug never working in the first place) affecting up to a third of patients from the start. The real, most common underlying cause is immunogenicity, the body developing its own real antibodies against the biologic drug (called anti-drug antibodies), which directly lowers the actual drug level in the blood and blocks its biological activity. Real, practical solutions exist once this is identified: therapeutic drug monitoring (measuring both the drug's own blood level and any anti-drug antibodies present) can guide real treatment adjustments, and real research finds adding an immunomodulator medication alongside the biologic can help reverse antibody-driven loss of response in some patients. A real, large UK study (13,222 patients) found people who lost response to their first anti-TNF drug had better real outcomes switching to a different class of biologic entirely rather than trying a second anti-TNF. Worth knowing directly: if an IBD medication that used to work well starts losing effectiveness, this is a real, well-understood, and named clinical phenomenon with real, testable next steps, not a sign that IBD itself has simply become untreatable, and it's worth raising directly with a gastroenterologist rather than assuming nothing more can be done.",
    citations: [
      { source: 'Management of Non-response and Loss of Response to Anti-tumor Necrosis Factor Therapy in Inflammatory Bowel Disease, PMC9241563', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9241563/' },
      { source: 'Biologic Therapy for Inflammatory Bowel Disease: Real-World Comparative Effectiveness and Impact of Drug Sequencing, PMC11147798', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11147798/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-azathioprine-tpmt'],
  },
  {
    id: 'ibd-iron-deficiency-anemia',
    category: 'ibd',
    title: 'Iron Deficiency Anemia: the Most Common Complication of IBD, and a Treatable One',
    teaser: "Roughly a fifth of IBD patients develop anemia, and when they do, it's genuinely iron deficiency the large majority of the time.",
    summary:
      "A cross-sectional study of 99 IBD patients found anemia in 20.5% of those with Crohn's disease and 23.6% of those with ulcerative colitis. Among the patients who had anemia, iron deficiency specifically accounted for 69.6% of cases in Crohn's and 76.7% in ulcerative colitis, making it the dominant cause by a wide margin rather than one possibility among several. The primary driver is chronic, often invisible blood loss from inflamed intestinal tissue, not simply eating too little iron. A second mechanism compounds it: inflammatory cytokines (IL-1, TNF, interferon-gamma) suppress the body's own production of erythropoietin, the hormone that signals bone marrow to make red blood cells, while a related pathway (hepcidin) actively traps iron inside intestinal immune cells where it can't be used. Iron malabsorption from diet alone only becomes a major factor when a large portion of the upper digestive tract is affected. This layered mechanism explains why anemia in IBD often doesn't respond to diet changes by themselves. Someone whose fatigue or breathlessness has been chalked up to just the disease has a testable, usually correctable explanation worth raising directly.",
    citations: [
      {
        source:
          "Anemia in inflammatory bowel disease: prevalence, differential diagnosis and association with clinical and laboratory variables, São Paulo Medical Journal 2014",
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10852089/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['ckd-anemia-erythropoietin', 'iron-deficiency-symptoms-staged'],
  },
  {
    id: 'ibd-sonic-combination-therapy',
    category: 'ibd',
    title: 'A Landmark Trial Found Two Medications Together Beat Either One Alone, by a Real, Wide Margin',
    teaser: 'The SONIC trial found combining a biologic with an immunomodulator put 57% of patients into steroid-free remission, against 44% on the biologic alone and 30% on the immunomodulator alone.',
    summary:
      "For a real, meaningful stretch of time, doctors treating moderate-to-severe Crohn's disease faced a genuine, unresolved question: does adding an older immunomodulator drug (azathioprine) to a newer biologic (infliximab) actually help, or does it just add side-effect risk without real added benefit? The SONIC trial gave a real, decisive answer. It randomized 508 adults who had never used either drug type before into three groups: infliximab alone, azathioprine alone, or both together. At 26 weeks, 56.8% of the combination group reached steroid-free clinical remission, compared with 44.4% on infliximab alone and 30.0% on azathioprine alone. Real, direct evidence of actual gut healing (mucosal healing, confirmed by endoscopy) followed the same pattern: 43.9% in the combination group versus 30.1% on infliximab alone and 16.5% on azathioprine alone. This is real, specific evidence that a combination approach can outperform either medication used by itself, not just theoretical reasoning about mechanism, and it remains a real, standard reference point in how Crohn's treatment decisions get made today. Worth knowing directly: which specific medications, and whether combination therapy makes sense for a given person, stays a real, individual medical decision (real added infection risk comes with real added immune suppression), not something to read off this one trial alone, but it's real, worth-having context for that conversation.",
    citations: [
      { source: "Infliximab, Azathioprine, or Combination Therapy for Crohn's Disease, New England Journal of Medicine 2010 (Colombel et al.), PMID 20393175", url: 'https://pubmed.ncbi.nlm.nih.gov/20393175/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-anti-tnf-loss-of-response', 'ibd-azathioprine-tpmt'],
  },
  {
    id: 'ibd-crohns-disease-exclusion-diet',
    category: 'ibd',
    title: 'A Real, Structured Whole-Food Diet Now Has Genuine Trial Evidence Alongside Exclusive Enteral Nutrition',
    teaser: "A randomized trial found the Crohn's Disease Exclusion Diet, paired with partial formula, worked about as well as a formula-only diet for inducing remission in children, and was genuinely easier to stick with.",
    summary:
      "This app's own already-built research covers exclusive enteral nutrition (EEN), a real, liquid-formula-only diet with strong evidence for inducing Crohn's remission, alongside its own real, honest limitation: many people find it genuinely hard to sustain, since it means giving up ordinary food entirely for weeks. The Crohn's Disease Exclusion Diet (CDED) is a real, more recent, structured alternative built to address exactly that gap, a genuine whole-food diet, not a liquid formula, designed to specifically limit foods with real, documented links to gut inflammation, animal fat, certain emulsifiers and additives, gluten, and dairy, while still allowing real, ordinary meals. A real, randomized controlled trial in 78 children directly compared CDED (paired with a smaller amount of supplemental formula) against standard EEN. At 6 weeks, both approaches induced remission in a comparable share of children (roughly 75 to 80%), and CDED was genuinely better tolerated, with meaningfully higher rates of people actually completing the full course of treatment. At 12 weeks, a real majority of children who reached remission were still in remission on CDED. Worth knowing directly: this is real, genuine progress toward an inflammatory-bowel-disease treatment someone can actually sustain day to day, not just a theoretically effective one, and it's a real, concrete example of dietary structure itself doing real therapeutic work, not simply avoiding a short list of trigger foods.",
    citations: [
      { source: "Crohn's Disease Exclusion Diet Plus Partial Enteral Nutrition Induces Sustained Remission in a Randomized Controlled Trial, Gastroenterology 2019 (Levine et al.), PMID 31170412", url: 'https://pubmed.ncbi.nlm.nih.gov/31170412/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-een-crohns', 'ibd-fiber-flare-myth'],
  },
];
