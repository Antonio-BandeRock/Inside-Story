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
    title: "Inflammatory Bowel Disease: Two Distinct Diseases Under One Name",
    teaser: "Crohn's and ulcerative colitis get grouped together constantly. Several of the findings in this category only make sense once you know which one is which.",
    summary: "Inflammatory bowel disease is an umbrella term for two different autoimmune conditions. Ulcerative colitis causes continuous inflammation limited to the colon and rectum. Crohn's disease can affect any part of the digestive tract from mouth to anus, often in patchy \"skip lesions\" rather than one continuous stretch, and can penetrate deeper into the intestinal wall than ulcerative colitis typically does. This distinction isn't academic. Several of the findings in this category, most strikingly how smoking affects each disease, run in different, even opposite, directions depending on which one someone actually has. The Gut & Microbiome category already covers direct evidence from IBD research: an endoscopically-confirmed AIP diet trial and documented depletion of the same short-chain-fatty-acid-producing bacteria the whole gut-repair argument is built around. This category covers what's specific to actually living with and managing either disease.",
    citations: [
      { source: 'Crohn\'s Disease, National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/crohns-disease' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-ibd', 'ibs-vs-ibd-distinction', 'vitamine-deficiency-real-causes'],
  },
  {
    id: 'ibd-smoking-paradox',
    category: 'ibd',
    title: "Smoking: Protective for One IBD Subtype, Harmful for the Other",
    teaser: "The same habit, the same gut bacterium even, producing opposite effects depending on which disease is actually present.",
    summary: "Smoking's relationship with IBD is one of the most striking, well-documented paradoxes in autoimmune research: it's an established risk factor for developing and worsening Crohn's disease, while showing a paradoxical protective effect against ulcerative colitis. A recent, specific mechanism helps explain why. Smoking produces metabolites that let a particular mouth bacterium, Streptococcus mitis, establish itself in the gut, triggering an immune response through Th1 cells. In Crohn's disease, this worsens things, since Th1 cells are already central to the disease's own inflammatory process. In ulcerative colitis, those same Th1 cells work against the disease's own different underlying immune imbalance, calming inflammation instead. A separate, molecular-level mechanism adds to the Crohn's-specific harm: cigarette smoke upregulates a receptor (GPR15) that drives T cells toward becoming Th17 cells, the same inflammatory cell type the Gut & Microbiome research already names as central to autoimmune disease broadly. This is included as an important finding to know, not a suggestion to smoke for ulcerative colitis. Smoking carries enough separately well-established harm, cardiovascular disease, cancer, to outweigh this one narrow protective association many times over, the same standing caveat already applied to Hashimoto's own smoking paradox.",
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
    title: "Exclusive Enteral Nutrition: Food-as-Medicine With First-Line Trial Evidence in Pediatric Crohn's",
    teaser: 'A liquid-formula-only diet reaching remission rates comparable to steroids, recommended before medication in appropriate cases.',
    summary: "Exclusive enteral nutrition (EEN), replacing all regular food with a complete liquid nutritional formula for a defined period, is a first-line therapy specifically for inducing remission in mild-to-moderate pediatric Crohn's disease, considered as effective as corticosteroid treatment by clinical guidance. The remission numbers are strong: one trial found 83% of pediatric patients in complete clinical remission after 6 weeks of EEN, and a separate trial using a reverse-engineered formula found 80% in remission after just 4 weeks. The mechanism traces back to the core gut-microbiome framework: research finds EEN works substantially by reshaping the gut microbiome itself, reducing proinflammatory microbial components rather than simply resting the bowel. The practical limitation worth knowing honestly: adherence is hard, with about 38% of patients discontinuing early in one study, driven by taste, nausea, and discomfort from the nasogastric tube some patients need to complete the full liquid-only period. A first-line, food-based therapy the mission is built to take seriously, with an honest cost attached.",
    citations: [
      { source: 'Exclusive Enteral Nutrition Induces Remission in Pediatric Crohn\'s Disease via Modulation of the Gut Microbiota', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5662815/' },
      { source: 'Exclusive enteral nutrition for induction of remission in pediatric Crohn\'s disease: Short- and long-term tolerance and acceptance', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11810808/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ibd-fiber-flare-myth',
    category: 'ibd',
    title: 'The "Low-Fiber During a Flare" Advice Has Surprisingly Thin Evidence Behind It',
    teaser: 'Widely repeated, commonly prescribed, and a direct check of the actual research found almost nothing to support it.',
    summary:
      "Restricting fiber during an active IBD flare is some of the most commonly given dietary advice in this whole condition, routinely handed out by clinicians. A direct check of the actual evidence behind it turns up a surprising gap: reviews find no evidence that a low-residue or low-fiber diet actually reduces inflammation during a flare, and only limited, weak research supporting fiber restriction at all, mostly inherited practice rather than demonstrated benefit. The evidence runs, if anything, in the opposite direction for the bigger picture. A large dietary survey of 1,130 Crohn's disease patients found people in the highest quartile of fiber intake were less likely to have a flare within six months, and separate research finds adequate fiber intake (25-30 grams a day) linked to a healthier gut microbiome, lower inflammation markers, and better maintenance of remission. This isn't a case for eating high-fiber foods during active, severe symptoms, when short-term GI distress is a separate consideration worth managing with a doctor's guidance. It's an honest correction to how confidently the low-fiber default gets applied as a blanket rule rather than a short-term, symptom-driven adjustment.",
    citations: [
      { source: 'Low Residue vs. Low Fiber Diets in Inflammatory Bowel Disease: Evidence to Support vs. Habit?', url: 'https://practicalgastro.com/2015/07/08/low-residue-vs-low-fiber-diets-in-inflammatory-bowel-disease-evidence-to-support-vs-habit/' },
      { source: 'Dietary Strategies for Gut Barrier Integrity in Inflammatory Bowel Disease: The Impact of Fiber and Beyond', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12893188/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'ibd-fodmap-remission-symptoms',
    category: 'ibd',
    title: "IBS-Type Symptoms During IBD Remission: A Different Problem, With Its Own Fix",
    teaser: 'Not every symptom during remission means the disease is active again. A separate mechanism, and a diet built specifically for it, can explain a lot of it.',
    summary:
      "A common, and confusing situation in IBD: someone reaches true remission by every objective measure, calprotectin normal, no visible inflammation, and still has ongoing digestive symptoms. A meaningful share of this turns out to be a separate, overlapping condition, IBS-type symptoms occurring alongside quiet IBD rather than active disease itself. A low-FODMAP diet, already an evidenced approach for irritable bowel syndrome specifically, has research support for exactly this situation, symptom improvement in IBD patients in remission who still experience IBS-type symptoms. This is an important distinction to hold onto: a low-FODMAP diet targets symptom management for a separate overlapping issue, not inflammation itself, and isn't a substitute for the disease-modifying treatment (medication, and where appropriate, EEN) that actually treats IBD. Worth raising directly with a doctor or dietitian when remission by every test still doesn't feel like remission, rather than assuming a flare is starting or that nothing more can be done.",
    citations: [
      { source: 'Low-FODMAP Diet for the Management of Irritable Bowel Syndrome in Remission of IBD', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9658010/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibd-calprotectin', 'ibs-low-fodmap-diet'],
  },
  {
    id: 'ibd-extraintestinal-manifestations',
    category: 'ibd',
    title: "IBD Reaches Well Past the Gut. Up to Half of Patients Develop a Symptom Somewhere Else Entirely.",
    teaser: 'Joints, skin, eyes, and, in one specific case, the bile ducts themselves, documented complications outside the digestive tract.',
    summary:
      "IBD's own reach extends well beyond the gut. Research finds up to 50% of IBD patients develop at least one extraintestinal manifestation during their disease course, a symptom or complication in an organ system that has nothing to do with digestion on the surface. Joint inflammation (arthritis) is among the most common. Skin manifestations include erythema nodosum (tender red nodules, usually on the shins) and pyoderma gangrenosum (a more serious ulcerating skin condition). Eye involvement includes uveitis, inflammation inside the eye that needs prompt treatment to avoid vision complications. The single most specific, disease-linked example: primary sclerosing cholangitis (PSC), a chronic, progressive scarring of the bile ducts that can eventually lead to liver failure, shows up specifically alongside ulcerative colitis far more than Crohn's disease, prevalence estimates running 2.4% to 7.4% of UC patients, and worth knowing directly because PSC itself, once present, calls for its own separate, more frequent colorectal cancer surveillance schedule.",
    citations: [
      { source: 'Inflammatory Bowel Disease and Primary Sclerosing Cholangitis: A Review of the Phenotype and Associated Specific Features', url: 'https://www.gutnliver.org/journal/view.html?doi=10.5009%2Fgnl16510' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-colonoscopy-surveillance', 'ibd-extraintestinal-real-prevalence-split'],
  },
  {
    id: 'ibd-thyroid-comorbidity-honest-null',
    category: 'ibd',
    title: "IBD and Hashimoto's: A Study Found No Overall Link, With One Specific Exception",
    teaser: "Not every autoimmune condition pair shows the same strong overlap. This one is an honest, more mixed picture.",
    summary: "The Type 1 Diabetes and Celiac Disease categories both cover strong, quantified overlaps with Hashimoto's. IBD's own picture is more mixed, and worth reporting exactly as honestly as the stronger findings elsewhere. A large, recent German primary care study found no significant overall association between IBD (either Crohn's or ulcerative colitis) and autoimmune thyroiditis. That's a meaningful null result, not a gap in the research. The same study did find one specific exception: among patients 65 and older, IBD was associated with a significantly higher risk specifically of Graves' disease, not Hashimoto's, roughly tripled in both Crohn's and ulcerative colitis patients in that age group. The honest takeaway: IBD doesn't carry the same broad, quantified Hashimoto's-comorbidity signal that T1D and celiac disease do, and pretending otherwise just because these conditions all share the word \"autoimmune\" would misrepresent the actual research. Worth knowing especially for anyone assuming every autoimmune diagnosis automatically raises Hashimoto's risk the same amount.",
    citations: [
      { source: 'Inflammatory Bowel Diseases Are Not Associated with an Increased Risk of Autoimmune Thyroiditis', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12921990/' },
      { source: 'Thyroid disorders and inflammatory bowel disease: an association present in adults but also in children and adolescents', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11832402/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'ibd-calprotectin',
    category: 'ibd',
    title: 'Fecal Calprotectin: A Non-Invasive Way to Know Whether the Gut Is Actually Inflamed',
    teaser: 'A stool test that predicts what a colonoscopy would show, without needing the colonoscopy every time.',
    summary:
      "Fecal calprotectin is a useful non-invasive marker for actual gut inflammation, distinct from and often more specifically reliable than a general blood marker like CRP for IBD specifically. Pooled research finds it correctly identifies IBD with about 88% sensitivity and 80% specificity, and a level at or below roughly 60 micrograms per gram predicts deep remission (healed gut tissue, not just symptom absence) with over 85% sensitivity and specificity in ulcerative colitis. It's also useful for predicting a coming relapse before symptoms fully return, with an optimal threshold around 152 micrograms per gram flagging elevated relapse risk. Worth asking for directly, especially when deciding whether new or returning symptoms mean active inflammation (worth investigating further, possibly via colonoscopy) or something else entirely, like the separate IBS-overlap situation covered elsewhere in this category, since guessing from symptoms alone is exactly what this test exists to avoid.",
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
    title: 'Colorectal Cancer Surveillance: A Specific Starting Point, With a Reason It Moves Up for Some',
    teaser: 'Long-standing colitis carries an elevated cancer risk. One specific complication cuts the wait to surveillance down to every single year.',
    summary:
      "Long-standing colonic inflammation from IBD carries an elevated colorectal cancer risk, which is exactly why surveillance guidance exists on a defined schedule rather than waiting for symptoms. Guidance recommends starting surveillance colonoscopy 8 years after diagnosis for left-sided or extensive ulcerative colitis, and for Crohn's disease involving over 30% of the colon or more than one colonic segment, then repeating every 1 to 2 years, extending to every 5 years for patients with no intermediate or high-risk features found on a prior exam. The one specific exception worth knowing directly: anyone who also has primary sclerosing cholangitis (PSC), the same bile-duct complication covered elsewhere in this category, should have annual surveillance starting immediately at PSC diagnosis, not the standard 8-year wait, since PSC itself substantially raises colorectal cancer risk on top of the IBD risk alone. Worth confirming which schedule actually applies given individual disease extent and any PSC diagnosis, rather than assuming the standard interval automatically applies to everyone.",
    citations: [
      { source: 'Colorectal cancer prevention: colonoscopic surveillance in adults with ulcerative colitis, Crohn\'s disease or adenomas', url: 'https://www.ncbi.nlm.nih.gov/books/NBK588749/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-extraintestinal-manifestations'],
  },
  {
    id: 'ibd-azathioprine-tpmt',
    category: 'ibd',
    title: 'Azathioprine: A FDA-Recommended Genetic Test Before the First Dose',
    teaser: 'One gene largely determines how safely this drug gets metabolized. Testing for it before starting is a specific recommendation, not routine caution.',
    summary:
      "Azathioprine, a common immunomodulator used in IBD, is broken down in the body largely by an enzyme called TPMT (thiopurine methyltransferase), and how well someone's own TPMT gene works determines how safely a standard dose gets processed. The FDA specifically recommends TPMT genotyping or activity testing before starting azathioprine, not just as routine caution. The reason: severe, sudden myelosuppression (a dangerous drop in blood cell production) can develop in an estimated 3% of patients, more likely with reduced TPMT function, and more likely in the first eight weeks of treatment. A related gene, NUDT15, matters especially for patients of Asian or Hispanic descent, where it's a more common cause of thiopurine intolerance than TPMT variants alone. Worth knowing directly: a normal TPMT/NUDT15 result doesn't mean monitoring stops. Regular complete blood counts remain necessary throughout treatment regardless of genetic test results, since the genetic test predicts risk, it doesn't replace watching for the thing directly.",
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
    teaser: 'A food-based first-line therapy, a widely repeated piece of advice with surprisingly thin support, and an honest null result on Hashimoto\'s.',
    summary: "Line up everything in this category and IBD reads as a condition where precision about which disease, and which number, matters more than almost anywhere else. Smoking is an opposite-direction risk factor depending on whether it's Crohn's or ulcerative colitis, not a single, uniform IBD finding. Exclusive enteral nutrition is a strong, food-based, first-line therapy for pediatric Crohn's specifically, remission rates rivaling steroids. The low-fiber-during-a-flare advice, repeated constantly, turns out to have surprisingly thin support, while adequate fiber intake carries evidence for reducing flare risk over time. The two self-advocacy entries carry the same kind of precise numbers already established as the standard: fecal calprotectin's own sensitivity/specificity and deep-remission threshold, and azathioprine's FDA-recommended genetic test before the first dose. And the honest, quantified null result on Hashimoto's comorbidity, alongside the specific Graves' exception in older patients, is exactly the kind of finding worth reporting accurately rather than smoothing into a pattern that isn't actually there.",
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
    title: "IBD Has a Formal Classification System That Directly Shapes Treatment Choice",
    teaser: "The Montclassification real-world sorts Crohn's by age, location, and behavior, and ulcerative colitis by how far the inflammation actually reaches, not just \"mild\" or \"severe.\"",
    summary:
      "IBD is formally classified using the Montclassification, widely used at initial diagnosis to guide treatment. For Crohn's disease, three dimensions are recorded: age at diagnosis (under 16, 17-40, or over 40), location (ileal, colonic, ileocolonic, or isolated upper-GI disease), and behavior (non-stricturing/non-penetrating, stricturing, or penetrating, with a separate marker for perianal disease). For ulcerative colitis, the classification is about how far inflammation extends: E1 (proctitis, limited to the rectum), E2 (left-sided, up to the splenic flexure), or E3 (extensive, reaching beyond it). This isn't just record-keeping: the practical value is that a person's own specific classification (a penetrating Crohn's pattern, say, versus a non-stricturing one) directly shapes which treatment (immunomodulators, biologics, or surgery) a gastroenterologist actually recommends, useful vocabulary worth understanding rather than treating as an opaque chart note.",
    citations: [
      { source: 'MontClassification for Inflammatory Bowel Disease (IBD) Calculator, MDCalc', url: 'https://www.mdcalc.com/calc/10237/montreal-classification-inflammatory-bowel-disease-ibd' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ibd-extraintestinal-real-prevalence-split',
    category: 'ibd',
    title: "The Quantified Split: Which Extraintestinal Symptoms Are More Common in Crohn's, and Which in Ulcerative Colitis",
    teaser: "A direct, more granular follow-up to this category's own PSC entry: a meta-analysis breaks joint, skin, and eye involvement down by exact percentage and by which of the two diseases carries the higher risk.",
    summary: "The extraintestinal-manifestations entry above already names the categories (joints, skin, eyes, and PSC specifically); a larger meta-analysis adds the exact numbers behind them. At least one joint, eye, or skin extraintestinal manifestation appears in 24% of IBD patients overall, 27% of ulcerative colitis, and 35% of Crohn's disease specifically, with roughly a quarter of affected patients experiencing more than one at once. Peripheral joint arthritis/arthralgia affects 5-10% of ulcerative colitis patients and 10-20% of Crohn's patients; erythema nodosum, tender red skin nodules, shows up in a smaller 1.6-1.9% of patients. The consistent pattern across this same body of research: eye involvement, peripheral joint manifestations, and erythema nodosum are all more common in Crohn's disease than ulcerative colitis, a useful, specific piece of context for anyone managing either disease and noticing a new joint or skin symptom that might otherwise seem unrelated.",
    citations: [
      { source: 'Prevalence of Extraintestinal Manifestations in Inflammatory Bowel Disease: A Systematic Review and Meta-analysis, PMID 37042969', url: 'https://pubmed.ncbi.nlm.nih.gov/37042969/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-extraintestinal-manifestations'],
  },
  {
    id: 'ibd-history-milestones',
    category: 'ibd',
    title: "IBD's Own History: Two Separately Discovered Diseases That Took Decades to Be Told Apart",
    teaser: '1875, 1932, the early 2000s, ulcerative colitis and Crohn\'s disease were described 57 years apart, and a genetic discovery over a century later finally explained part of why.',
    summary: "IBD's own two distinct diseases were discovered decades apart. Ulcerative colitis came first, in 1875, when English physicians Wilks and Moxon distinguished it from infectious diarrheal disease. Crohn's disease wasn't formally described until 1932, when Burrill Crohn, Leon Ginzberg, and Gordon Oppenheimer published a landmark 14-case paper describing what they initially called \"regional ileitis,\" an advance over the era's default assumption that any small-intestine disease must be tuberculosis. Earlier isolated case observations actually predate the 1932 paper (Morgagni in the 1700s, Berg in 1898, Lesniowski in 1904, Dalziel in 1913), meaning the disease existed in medical records well before it was formally named and understood as its own condition. The modern genetic turning point came in the early 2000s: discovery of the NOD2/CARD15 gene mutation gave the first molecular explanation for Crohn's own genetic susceptibility, opening the door to the TNF-alpha-targeting biologic therapies (infliximab, adalimumab, both already covered in the medication research) that transformed treatment in the years that followed.",
    citations: [
      { source: "Historical aspects of inflammatory bowel disease, PMID 2980764", url: 'https://pubmed.ncbi.nlm.nih.gov/2980764/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ibd-pregnancy-remission-first',
    category: 'ibd',
    title: "The Single Biggest Predictor of a Healthy IBD Pregnancy: Remission Before Conception, Not During It",
    teaser: 'Research names active disease at the moment of conception as one of the clearest, most consistent risk factors for a flare throughout pregnancy, worth knowing before, not after, conceiving.',
    summary: "IBD pregnancy outcomes trace back to a specific, and actionable timing fact: research consistently names active disease AT CONCEPTION, not just at some point during pregnancy, as one of the clearest risk factors for a flare throughout the pregnancy that follows, alongside having ulcerative colitis specifically (rather than Crohn's) and a history of active disease during a previous pregnancy. This makes preconception planning more consequential here than in many other conditions already covered: guidance is to achieve disease remission before conception whenever possible, and, worth stating directly since it runs against a common, understandable instinct, to KEEP taking IBD medication through pregnancy rather than stopping it out of caution, since stopping is what actually raises flare risk. The reassuring medication-safety finding: anti-TNF biologics (already covered in the medication research) are considered safe across multiple registries and observational studies, with continuing them through the third trimester specifically linked to a lower flare risk and no increased infant infection risk in the first year of life from in-utero exposure.",
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
    teaser: 'Already an established, FDA-recognized treatment for recurrent C. Diff infection, capsule-based FMT trials in ulcerative colitis found remission in over half of patients at 12 weeks, though results still vary meaningfully between studies.',
    summary: "Fecal microbiota transplantation, transferring processed stool from a screened, healthy donor into someone's own gut, is already a well-established treatment for recurrent Clostridioides difficile infection, and that established track record is what's driving serious research into whether it can do something similar for ulcerative colitis, a condition already tied directly to gut dysbiosis in the existing research. A study using capsulized (swallowable) FMT found clinical remission in 57.1% of patients and a clinical response in 76.2% after 12 weeks, with mechanistic work showing the benefit tracks with actual gut microbial colonization and metabolite changes, not just a placebo effect. Worth stating honestly rather than oversold: results vary across different trial centers, with steroid-free remission reported at 32% in one trial and 44% in another, and a 2025 systematic review and meta-analysis of randomized controlled trials found the evidence base still developing, calling for more standardized, robust trials before this becomes a routine option. The proposed mechanisms line up directly with the already-established gut-health research: correcting microbiota dysbiosis, reducing intestinal permeability, and increasing short-chain fatty acid production, the same gut-barrier-protective pathway already covered for autoimmune disease broadly. Worth knowing directly: this is promising, mechanistically grounded evidence, not yet a settled, universally effective therapy, and anyone considering it should treat it as still-emerging alongside a gastroenterologist's guidance, not a proven first-line option.",
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
    title: 'Vitamin D Deficiency Is Common, and Tracks Directly With How Active IBD Actually Is',
    teaser: 'Studies find vitamin D deficiency in 22-64% of IBD patients, with deficiency directly correlating with higher inflammatory markers, more relapses, more surgery, and a slower response to biologic medications.',
    summary: "Vitamin D deficiency is common, and more than an incidental finding in inflammatory bowel disease, it tracks directly with disease severity itself. Studies find deficiency prevalence ranging from 22% to 63% depending on the population and how deficiency is defined, with one study of 504 IBD patients finding 49.8% deficient overall and 10.9% severely so, and clinical observation finding roughly 60-64% of both Crohn's and ulcerative colitis patients affected. This is more than a coincidental overlap: research finds a statistically significant reverse correlation between lower vitamin D levels and higher inflammatory markers, and deficiency itself associated with a higher rate of relapse, increased risk of needing surgery, and a slower response to biologic medications. The biological explanation involves vitamin D's own active form playing a direct role in immune regulation and gut barrier function, the exact mechanism already covered in the gut-microbiome Vitamin D/CLDN2 tight-junction research. Worth knowing directly: this makes vitamin D testing and correction a concrete, actionable piece of IBD management, not just a general wellness recommendation, someone with IBD experiencing more frequent flares or a weaker response to their current biologic treatment has an evidence-backed reason to ask specifically about their vitamin D status.",
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
    title: 'Early-Life Microbial Exposure Shapes IBD Risk, a Piece of "The Hygiene Hypothesis"',
    teaser: 'Research finds having older siblings, and other markers of richer early-life microbial exposure, tied to lower IBD risk, while a more sterile early environment appears to leave lasting gaps in immune training.',
    summary: "The hygiene hypothesis proposes that reduced microbial exposure in early life, a byproduct of modern hygiene and living conditions, may leave the developing immune system less well \"trained,\" plausibly raising the risk of immune-mediated diseases like IBD later on. Animal research finds improved hygiene tied to decreased microbiota diversity and a shift toward a more proinflammatory immune response pattern, with early childhood specifically identified as the critical window for the developing gut immune system, microbiome, and mucosal-bacterial relationships to establish themselves. Human research finds concrete, supporting evidence: having older siblings, a marker of greater early-life microbial exposure, is associated with reduced IBD risk, while research finds cesarean delivery (which bypasses the vaginal microbial exposure of a natural birth) can slow the pace of a newborn's own gut microbiome colonization. The proposed protective mechanism ties directly to the already-established gut-immunology research: diverse early microbial exposure promotes the development of regulatory T cells (Tregs) and boosts anti-inflammatory signaling molecules like IL-10, the same protective pathway already covered elsewhere for autoimmune disease broadly. Worth knowing directly: this is fascinating, if not yet fully actionable, context for why IBD rates have risen alongside modernization, and it reinforces, from a completely different angle, why supporting a diverse gut microbiome throughout life, not just in infancy, remains a central piece of the core mission.",
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
    title: 'Anti-TNF Biologics Can Stop Working Over Time, a Common, and Manageable Problem With Its Own Name',
    teaser: 'Research finds secondary loss of response to anti-TNF biologics affecting 13-21% of patients per year, often caused by the body developing antibodies against the drug itself, a testable, and addressable problem.',
    summary: "Anti-TNF biologics (already covered by name for both RA and IBD elsewhere in the medication research) can stop working over time in a well-documented, and specifically named phenomenon: secondary loss of response. Research finds this affects 13-21% of patients per year, on top of primary non-response (the drug never working in the first place) affecting up to a third of patients from the start. The most common underlying cause is immunogenicity, the body developing its own antibodies against the biologic drug (called anti-drug antibodies), which directly lowers the actual drug level in the blood and blocks its biological activity. Practical solutions exist once this is identified: therapeutic drug monitoring (measuring both the drug's own blood level and any anti-drug antibodies present) can guide treatment adjustments, and research finds adding an immunomodulator medication alongside the biologic can help reverse antibody-driven loss of response in some patients. A large UK study (13,222 patients) found people who lost response to their first anti-TNF drug had better outcomes switching to a different class of biologic entirely rather than trying a second anti-TNF. Worth knowing directly: if an IBD medication that used to work well starts losing effectiveness, this is a well-understood, and named clinical phenomenon with testable next steps, not a sign that IBD itself has simply become untreatable, and it's worth raising directly with a gastroenterologist rather than assuming nothing more can be done.",
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
    teaser: "Roughly a fifth of IBD patients develop anemia, and when they do, it's iron deficiency the large majority of the time.",
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
    title: 'A Landmark Trial Found Two Medications Together Beat Either One Alone, by a Wide Margin',
    teaser: 'The SONIC trial found combining a biologic with an immunomodulator put 57% of patients into steroid-free remission, against 44% on the biologic alone and 30% on the immunomodulator alone.',
    summary:
      "For a meaningful stretch of time, doctors treating moderate-to-severe Crohn's disease faced an unresolved question: does adding an older immunomodulator drug (azathioprine) to a newer biologic (infliximab) actually help, or does it just add side-effect risk without added benefit? The SONIC trial gave a decisive answer. It randomized 508 adults who had never used either drug type before into three groups: infliximab alone, azathioprine alone, or both together. At 26 weeks, 56.8% of the combination group reached steroid-free clinical remission, compared with 44.4% on infliximab alone and 30.0% on azathioprine alone. Direct evidence of actual gut healing (mucosal healing, confirmed by endoscopy) followed the same pattern: 43.9% in the combination group versus 30.1% on infliximab alone and 16.5% on azathioprine alone. This is specific evidence that a combination approach can outperform either medication used by itself, not just theoretical reasoning about mechanism, and it remains a standard reference point in how Crohn's treatment decisions get made today. Worth knowing directly: which specific medications, and whether combination therapy makes sense for a given person, stays an individual medical decision (added infection risk comes with added immune suppression), not something to read off this one trial alone, but it's worth-having context for that conversation.",
    citations: [
      { source: "Infliximab, Azathioprine, or Combination Therapy for Crohn's Disease, New England Journal of Medicine 2010 (Colombel et al.), PMID 20393175", url: 'https://pubmed.ncbi.nlm.nih.gov/20393175/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-anti-tnf-loss-of-response', 'ibd-azathioprine-tpmt', 'problem-raw-undercooked-meat-eggs'],
  },
  {
    id: 'ibd-crohns-disease-exclusion-diet',
    category: 'ibd',
    title: 'A Structured Whole-Food Diet Now Has Trial Evidence Alongside Exclusive Enteral Nutrition',
    teaser: "A randomized trial found the Crohn's Disease Exclusion Diet, paired with partial formula, worked about as well as a formula-only diet for inducing remission in children, and was easier to stick with.",
    summary: "The already-built research covers exclusive enteral nutrition (EEN), a liquid-formula-only diet with strong evidence for inducing Crohn's remission, alongside its own honest limitation: many people find it hard to sustain, since it means giving up ordinary food entirely for weeks. The Crohn's Disease Exclusion Diet (CDED) is a more recent, structured alternative built to address exactly that gap, a whole-food diet, not a liquid formula, designed to specifically limit foods with documented links to gut inflammation, animal fat, certain emulsifiers and additives, gluten, and dairy, while still allowing ordinary meals. A randomized controlled trial in 78 children directly compared CDED (paired with a smaller amount of supplemental formula) against standard EEN. At 6 weeks, both approaches induced remission in a comparable share of children (roughly 75 to 80%), and CDED was better tolerated, with meaningfully higher rates of people actually completing the full course of treatment. At 12 weeks, a majority of children who reached remission were still in remission on CDED. Worth knowing directly: this is progress toward an inflammatory-bowel-disease treatment someone can actually sustain day to day, not just a theoretically effective one, and it's a concrete example of dietary structure itself doing therapeutic work, not simply avoiding a short list of trigger foods.",
    citations: [
      { source: "Crohn's Disease Exclusion Diet Plus Partial Enteral Nutrition Induces Sustained Remission in a Randomized Controlled Trial, Gastroenterology 2019 (Levine et al.), PMID 31170412", url: 'https://pubmed.ncbi.nlm.nih.gov/31170412/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-een-crohns', 'ibd-fiber-flare-myth'],
  },
  {
    id: 'ibd-therapeutic-drug-monitoring',
    category: 'ibd',
    title: 'Checking a Biologic\'s Own Blood Level Cuts Relapse, Even When Symptoms Don\'t Change',
    teaser: 'A controlled trial found adjusting infliximab dose to a measured target blood level, rather than reacting to symptoms alone, cut relapse rate from 17% to 7%.',
    summary:
      "This category's own already-covered biologic research (the SONIC combination trial, anti-TNF loss of response) raises a practical follow-up question: once someone's on a biologic like infliximab, how does a doctor actually know if the dose is right? Therapeutic drug monitoring (TDM) answers this by directly measuring the medication's own blood level (trough concentration) rather than relying on symptoms alone, since a meaningful share of apparent treatment failure turns out to be a dosing problem, not a lack of response. The landmark TAXIT trial tested a PROACTIVE version of this (a scheduled blood-level check adjusting dose toward a target range of 3 to 7 micrograms per milliliter, before problems appear) against a REACTIVE approach (checking blood levels only after symptoms return). The honest result: no significant difference in remission rates at 1 year between the two approaches, but the proactive group had significantly fewer relapses during the full follow-up period (7% versus 17%). Worth knowing directly: major gastroenterology associations still mostly recommend the simpler, reactive approach as standard, with proactive monitoring considered more useful but more debated, this is a worth-raising question for anyone whose biologic seems to be working less well than expected: has an actual blood level ever been checked, or has the dose only ever been adjusted based on symptoms alone?",
    citations: [
      { source: 'Trough Concentrations of Infliximab Guide Dosing for Patients With Inflammatory Bowel Disease (TAXIT), Gastroenterology 2015, PMID 25724455', url: 'https://pubmed.ncbi.nlm.nih.gov/25724455/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-anti-tnf-loss-of-response', 'ibd-sonic-combination-therapy'],
  },
  {
    id: 'ibd-smoking-cessation-real-benefit',
    category: 'ibd',
    title: 'Quitting Smoking Brings a Crohn\'s Patient\'s Relapse Risk Down to Match Someone Who Never Smoked',
    teaser: 'A prospective study found quitting smoking cut Crohn\'s relapse risk to the same level as lifelong nonsmokers, a benefit comparable in size to adding an immunosuppressant medication.',
    summary: "This category's own already-covered smoking-paradox research establishes that smoking worsens Crohn's disease specifically (the opposite of its documented protective effect in ulcerative colitis). What that entry doesn't cover directly is the concrete payoff for actually quitting, worth naming plainly rather than left as a general 'smoking is bad' statement. A prospective multicenter cohort study of 573 Crohn's patients, followed for a median of 3.25 years, found smoking an independent predictor of disease relapse, with continuing smokers facing a 1.6-times-higher relapse risk than nonsmokers, alongside a doubled rate of hospitalization and a shorter time before needing steroid treatment. The important, practical finding: patients who QUIT smoking had a relapse risk that dropped to match lifelong nonsmokers, essentially fully reversing the excess risk, not just partially reducing it. A earlier intervention study described this benefit as comparable in magnitude to starting an immunosuppressant medication. Worth knowing directly: for someone with Crohn's disease who smokes, the already-covered research already names WHY smoking matters here specifically, this is the concrete, motivating number for WHAT quitting actually does, an achievable, medication-free lever with a quantified, disease-modifying payoff.",
    citations: [
      { source: "Effects of cigarette smoking on the long-term course of Crohn's disease, Gastroenterology 1996 (Cosnes et al.), PMID 8566589", url: 'https://pubmed.ncbi.nlm.nih.gov/8566589/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-smoking-paradox'],
  },
  {
    id: 'ibd-elderly-onset-distinct-diagnosis-delay',
    category: 'ibd',
    title: 'IBD Diagnosed Later in Life Looks Different, and Takes Measurably Longer to Diagnose',
    teaser: 'IBD that first appears after age 60 tends to be milder-looking on the surface, and data finds it takes roughly three times longer to diagnose than IBD in younger adults.',
    summary:
      "Inflammatory bowel disease that first appears later in life follows a distinct pattern from the same disease in a younger person, and that difference has practical consequences for how quickly it gets recognized. Elderly-onset IBD often presents atypically and less severely, showing up as mild diarrhea, rectal bleeding, or vague abdominal discomfort that can easily be mistaken for ischemic or diverticular colitis rather than the more classic, more clearly IBD-looking picture doctors are trained to recognize in younger patients. The disease pattern itself differs too: multiple population-based studies have found late-onset ulcerative colitis tends toward left-sided involvement, and late-onset Crohn's disease tends to affect the colon rather than the small bowel, the opposite distribution from younger-onset cases. The practical cost of this atypical picture is a longer diagnostic delay, up to 6 years in elderly patients compared with roughly 2 years in younger adults in one dataset, and a higher initial misdiagnosis rate, 51% of adults over 40 receiving an incorrect first diagnosis compared with 39% of younger patients in the same study. Worth knowing directly: the wide list of other conditions that can look similar in an older adult, infectious colitis, diverticular disease, NSAID-related injury, radiation colitis, or colorectal cancer, means careful evaluation matters even more than usual, and persistent bowel symptoms in an older adult deserve follow-through rather than an easy default assumption.",
    citations: [
      { source: 'Challenges and Treatment Strategies in Elderly Patients with Inflammatory Bowel Disease: A Systematic Review, PMC12941479', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12941479/' },
      { source: 'Management of Inflammatory Bowel Disease in the Elderly Patient: Challenges and Opportunities, PMC5687915', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5687915/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-montreal-classification', 'ibd-overview'],
  },
  {
    id: 'ibd-global-westernization-asia-rising',
    category: 'ibd',
    title: 'IBD Is Rising Fastest Exactly Where Diets Are Westernizing Fastest, a Tracked Pattern',
    teaser: "India's own IBD prevalence is projected to quadruple by 2035, part of a documented pattern where newly industrializing regions are picking up IBD at the same time their diets shift toward the West's.",
    summary: "Inflammatory bowel disease has a distinct geographic story: it rose first and became common in North America and Northern Europe across the 20th century, and its prevalence there has now largely stabilized at a high level. Meanwhile, current projections find IBD accelerating sharply in newly industrializing regions: India's own IBD prevalence is projected to rise fourfold by 2035, West Asia's by 2.3 to 2.5 times, and East and Southeast Asia's by 1.6 to 1.7 times over the same window. This isn't happening randomly. Research ties the rise directly to the same regions' own rapid shift toward a Westernized diet, specifically higher consumption of red meat, processed foods, and refined sugar, alongside urbanization, industrialization, and the broader hygiene and lifestyle changes that come with rapid economic development. Worth knowing directly for anyone in a region where IBD has historically been rare: that historical rarity is a documented pattern tied to a traditional diet and lifestyle, not a permanent biological immunity, and IBD risk appears to rise measurably as a population's everyday eating pattern shifts toward the same processed, Western-style diet already linked to IBD risk everywhere else in the research.",
    citations: [
      { source: 'Evolving Trends and Burden of Inflammatory Bowel Disease in Asia, 1990-2019, Journal of Epidemiology and Global Health', url: 'https://link.springer.com/article/10.1007/s44197-023-00145-w' },
      { source: 'The epidemiology of inflammatory bowel disease in Asia and Asian immigrants to Western countries, United European Gastroenterology Journal', url: 'https://onlinelibrary.wiley.com/doi/full/10.1002/ueg2.12350' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-overview', 'ibd-hygiene-hypothesis-early-life'],
  },
  {
    id: 'ibd-global-second-generation-migrants',
    category: 'ibd',
    title: 'A Striking Study Found Second-Generation Immigrants Picking Up Their New Country\'s Own IBD Risk',
    teaser: "UK data found second-generation South Asian immigrants developing ulcerative colitis at rates matching the UK-born population, despite South Asia's own much lower native rates, direct evidence environment can override a whole generation's original low risk.",
    summary:
      "This category's own already-covered westernization research explains why IBD is rising in newly industrializing countries; a separate migrant study shows the same mechanism playing out within a single family across two generations. A British study of ulcerative colitis patients found second-generation South Asian immigrants (people born in the UK to South Asian immigrant parents) developing UC at rates that closely matched the UK's own Caucasian population, a striking finding given South Asia's own native IBD rates run substantially lower, already covered elsewhere in this category. This wasn't unique to the UK: research found the same pattern in Canada, individuals migrating from a low-prevalence region like South Asia to a high-prevalence country show an elevated IBD risk that continues rising across the first AND second generation, evidence this isn't simply about an individual adult adopting a new diet, but about a whole new environment (diet, hygiene, gut microbiome exposure from birth) reshaping risk across a generation raised entirely in the new setting. Worth knowing directly: this is some of the strongest evidence anywhere that IBD risk is substantially environmental rather than fixed by ancestry, a family's own IBD risk can shift to match a new home country within a single generation, not slowly over many.",
    citations: [
      { source: 'Inflammatory bowel disease and the South Asian diaspora, PMC6788368', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6788368/' },
      { source: 'Migratory Movements and the Risk of Inflammatory Bowel Disease, World Gastroenterology Organisation', url: 'https://www.worldgastroenterology.org/publications/e-wgn/e-wgn-expert-point-of-view-articles-collection/migratory-movements-and-the-risk-of-ibd' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-global-westernization-asia-rising'],
  },
  {
    id: 'horizon-ibd',
    category: 'ibd',
    title: 'IBD Care Is Shifting Toward Choosing the Right Drug for the Right Person Before Trying One at Random',
    teaser: 'Emerging blood and stool biomarkers are moving IBD treatment toward matching each drug to the person most likely to actually respond, replacing the current trial-and-error approach this category\'s own therapeutic-drug-monitoring research already works around.',
    summary:
      "This category's own already-covered therapeutic-drug-monitoring and biologic-loss-of-response research exists partly because current IBD treatment still works largely by trial and error, trying one biologic, then switching if it doesn't work well enough. The active direction the whole field is moving toward: precision medicine, matching a specific drug to a specific person's own disease biology from the start. Several biomarkers are now close to clinical use: an antibody test (αvβ6) and a blood marker (oncostatin M) are both described directly in current research as potentially near-ready for clinical practice, alongside microRNA panels and stool-based markers still in development. This builds on already-approved newer treatments (etrasimod, upadacitinib, mirikizumab, risankizumab) that already offer more mechanism-specific options than IBD care had even a few years ago. Worth knowing honestly: comprehensive, clinically validated biomarkers remain an acknowledged gap in the field today, this is an active direction rather than a solved problem, with AI-assisted prediction of treatment response also named directly as part of where the field expects this to head next.",
    citations: [
      { source: 'Paradigm Shift in Inflammatory Bowel Disease Management: Precision Medicine, Artificial Intelligence, and Emerging Therapies', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11899940/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibd-therapeutic-drug-monitoring', 'ibd-anti-tnf-loss-of-response'],
  },
  {
    id: 'horizon-ibd-darvadstrocel',
    category: 'ibd',
    title: "A Already-Approved Stem Cell Therapy Is Healing One of Crohn's Most Stubborn Complications",
    teaser: "Complex perianal fistulas, an especially hard-to-treat Crohn's complication, are now treated with darvadstrocel, an injected stem cell therapy achieving sustained healing in over three-quarters of patients in real-world use.",
    summary:
      "Complex perianal fistulas, abnormal tunnels connecting the bowel to the skin near the anus, are an especially stubborn Crohn's complication that often resists this category's own already-covered biologic treatments. Darvadstrocel, made from expanded mesenchymal stem cells derived from donor fat tissue, is injected directly into the fistula tract itself to promote local healing. It's already approved, not experimental, across the European Union, UK, Japan, and several other countries (though not yet in the US), and a recent meta-analysis pooling real-world data found 68.1% of patients in clinical remission (fistula healing) at 6 months, rising to 77.2% in more recent data. Current European treatment guidelines now describe it directly as having a strong level of evidence and a favorable safety profile. Worth knowing directly: this is a different treatment category from anything else already covered in this category, a localized, injected cell therapy rather than a systemic drug, aimed specifically at healing damaged tissue directly rather than suppressing inflammation throughout the body, and it's already an available option in much of the world for this specific, hard-to-treat complication.",
    citations: [
      { source: "Darvadstrocel for complex perianal fistulas in Crohn's disease: A systematic review and meta-analysis, United European Gastroenterology Journal", url: 'https://onlinelibrary.wiley.com/doi/full/10.1002/ueg2.12673' },
    ],
    overallTier: 'strong',
    relatedIds: ['horizon-ibd'],
  },
  {
    id: 'ibd-depression-anxiety-bidirectional-real-data',
    category: 'ibd',
    title: 'Depression and Anxiety in IBD Are Common, and Bidirectional With Disease Activity',
    teaser: 'Research finds up to a third of IBD patients affected by anxiety and a quarter by depression overall, rising to half and a third, respectively, during periods of active disease.',
    summary: 'A large systematic review and meta-analysis finds a high prevalence of anxiety and depression symptoms across IBD broadly (up to a third affected by anxiety, a quarter by depression), with substantially higher rates specifically during active disease periods, half of patients meeting criteria for anxiety and a third for depression when their IBD is flaring, more common in Crohn\'s disease than ulcerative colitis, and more common in women. The bidirectional relationship: IBD itself raises anxiety and depression risk by a 48 and 55 percent respectively, while a separate meta-analysis found people with depression carry roughly double the risk of later developing IBD, a two-way street, not psychiatric symptoms simply reacting to a physical illness. Proposed mechanisms tie directly into the already-covered gut-brain research: increased inflammatory cytokines, vagal nerve signaling, and gut dysbiosis all plausibly connect the two. Longitudinal evidence finds comorbid depression and anxiety worsen IBD\'s own subsequent disease course, a direct clinical reason treating the mental-health side isn\'t separate from managing the physical disease.',
    citations: [
      { source: 'Prevalence of symptoms of anxiety and depression in patients with inflammatory bowel disease: a systematic review and meta-analysis, The Lancet Gastroenterology & Hepatology', url: 'https://www.thelancet.com/journals/langas/article/PIIS2468-1253(21)00014-5/abstract' },
      { source: 'The bidirectional risk of inflammatory bowel disease and anxiety or depression: A systematic review and meta-analysis', url: 'https://www.sciencedirect.com/science/article/pii/S0163834323000774' },
    ],
    overallTier: 'strong',
    relatedIds: ['mentalhealth-overview', 'mentalhealth-inflammation-link', 'sleep-autoimmune-disease-real-data', 'ibd-gut-inflammation-hippocampal-neurogenesis'],
  },
  {
    id: 'ibd-corticosteroid-hypertension-real-data',
    category: 'ibd',
    title: 'Hypertension Is a Dose-Related Risk of the Corticosteroids IBD Itself Often Requires',
    teaser: 'Research finds hypertension in over 30% of long-term glucocorticoid users, a direct medication effect worth watching for anyone on repeated or extended prednisone courses for a flare.',
    summary: 'Research finds roughly 30 percent of people with IBD were exposed to oral glucocorticoids (prednisone and similar drugs, already covered directly in the IBD medication research) within just the preceding 12 months, since they remain a major treatment for moderate-to-severe flares despite progress with biologic therapies. Broader research on glucocorticoid use finds hypertension a dose-related risk of this drug class, with over 30 percent of long-term users developing measurably elevated blood pressure, a direct medication effect, not a coincidental overlap. The honest, current gap worth naming directly: dedicated research measuring hypertension prevalence specifically within IBD populations (as opposed to glucocorticoid users generally) is sparse in the literature, so the precise IBD-specific number isn\'t yet well established, even though the underlying mechanism (glucocorticoid exposure) clearly is. The practical takeaway: anyone on repeated or extended prednisone courses for IBD flares has a concrete, medication-driven reason to have blood pressure checked as part of that treatment, not assumed unrelated to a bowel-focused diagnosis.',
    citations: [
      { source: 'Oral glucocorticoids and incidence of hypertension in people with chronic inflammatory diseases: a population-based cohort study, CMAJ', url: 'https://www.cmaj.ca/content/192/12/e295' },
      { source: 'Is hypertension an extra-intestinal manifestation of inflammatory bowel disease?, PMC9892475', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9892475/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibd-overview'],
  },
  {
    id: 'ibd-perianal-fistula-real-data',
    category: 'ibd',
    title: "Perianal Fistulas Affect a Substantial Share of Crohn's Patients and Reach Well Beyond Physical Symptoms",
    teaser: 'Roughly 35% of Crohn\'s patients develop at least one fistula, and patient-survey data shows the impact reaching relationships, work, and sexual health, not just physical discomfort.',
    summary:
      "This category's own already-covered extraintestinal-manifestations research names complications reaching beyond the gut itself; perianal fistulas (abnormal tunnels forming between the bowel and skin near the anus) are a common, and often under-discussed complication of Crohn's disease specifically. Research finds roughly 35% of Crohn's patients develop at least one fistula, with 70-80% of these classified as complex. A international patient survey found the impact reaching well past physical symptoms into relationships, social life, and work life, with pain, scarring, discharge, fecal incontinence, and sexual difficulties all named directly as contributing factors to a measurable drop in quality of life. A honest treatment reality worth naming plainly: even with the best current medical and surgical therapy combined, only about a third of patients remain in sustained remission at one year, with research finding ACTIVE INFLAMMATION itself, not simply the fistula's own presence, the biggest driver of quality of life, a direct reason staying on top of disease control matters even when a fistula itself can't be fully resolved.",
    citations: [
      { source: "The Impact of Crohn's Perianal Fistula on Quality of Life: Results of an International Patient Survey, PMC10390083", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10390083/' },
      { source: "The Impact of Fistulizing Disease, Treatment Modalities, and Clinical Activity on Health-Related Quality of Life in Crohn's Disease, PubMed 42509398", url: 'https://pubmed.ncbi.nlm.nih.gov/42509398/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-extraintestinal-manifestations', 'ibd-depression-anxiety-bidirectional-real-data'],
  },
  {
    id: 'ibd-osteoporosis-bone-density',
    category: 'ibd',
    title: "IBD's Own Bone-Loss Risk Starts With Inflammation Itself, Not Just Steroid Treatment",
    teaser: 'Osteopenia affects up to 77% of IBD patients and osteoporosis up to 41%, and research finds low bone density even in newly diagnosed patients who have never taken a corticosteroid.',
    summary:
      "This category's own already-covered corticosteroid-hypertension research already flags one steroid side effect; bone loss is a second, real, and more surprising one, since it turns out NOT to depend on steroid use alone. Studies find osteopenia in 22-77% of IBD patients and full osteoporosis in 17-41%, figures that vary by disease location and severity but are consistently, substantially elevated. Corticosteroids do carry a fast-acting risk, measurable bone-density loss and increased fracture risk within just a few months of starting treatment, even at a low dose of 5mg/day, but the more surprising finding is that low bone density shows up in NEWLY DIAGNOSED patients who have never received any steroid treatment at all, pointing directly at chronic inflammation itself as an independent cause. The specific mechanism: inflammatory cytokines already covered elsewhere in this category (TNF-alpha, IL-6, IL-1, IL-17) directly stimulate the body's own bone-dissolving cells through a named signaling pathway (RANKL/RANK/OPG). The practical consequence: IBD patients carry a 15-45% higher risk of an osteoporotic fracture than the general population, worth a direct conversation about bone-density screening regardless of whether steroids have ever been part of treatment.",
    citations: [
      { source: 'Osteoporosis in inflammatory bowel disease, Journal of Crohn\'s and Colitis', url: 'https://academic.oup.com/ecco-jcc/article/2/3/202/477673' },
      { source: 'Bone health in patients with inflammatory bowel disease, Swiss Medical Weekly', url: 'https://smw.ch/index.php/smw/article/view/3407' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-corticosteroid-hypertension-real-data', 'celiac-bone-density'],
  },
  {
    id: 'ibd-venous-thromboembolism-real-risk',
    category: 'ibd',
    title: "IBD Raises Blood-Clot Risk, Most of All During an Active Flare",
    teaser: 'Meta-analyses find IBD carrying two to three times the general population\'s blood-clot risk, with a striking 8.4-fold spike specifically during an active flare.',
    summary:
      "This category's own already-covered corticosteroid and extraintestinal research names systemic effects beyond the gut, and venous thromboembolism (blood clots in the veins, including deep vein thrombosis and the more dangerous pulmonary embolism) is a serious, and directly quantified one. Meta-analyses consistently find IBD patients carrying two to three times the general population's risk of developing a blood clot. The most clinically useful finding is WHEN that risk peaks: research found the hazard ratio for a clot reaching 8.4 during an active disease flare compared to controls, still real and elevated (2.1-fold) even during remission, direct evidence the underlying inflammation itself, not just hospitalization or surgery, drives the risk. Identified contributing factors include a prior clot (a 4.44-fold risk multiplier), urgent surgery, blood transfusions, low blood albumin, and corticosteroid use (already covered elsewhere in this category), each independently raising risk further. A useful, reassuring finding: anti-TNF therapy, one of the biologic treatments already covered in this category, was NOT associated with increased clot risk, unlike corticosteroids. Worth stating directly: this elevated risk is exactly why hospitalized IBD patients, especially during a flare or after surgery, are often given preventive blood thinners as a matter of course, an evidence-based practice worth understanding rather than being surprised by.",
    citations: [
      { source: 'The risk of venous thromboembolic events in patients with inflammatory bowel disease: a systematic review and meta-analysis, PMID 34475739', url: 'https://pubmed.ncbi.nlm.nih.gov/34475739/' },
      { source: 'Risk Factors of Venous Thromboembolism in Inflammatory Bowel Disease: A Systematic Review and Meta-Analysis, PMC8273255', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8273255/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-corticosteroid-hypertension-real-data', 'ibd-anti-tnf-loss-of-response'],
  },
  {
    id: 'ibd-ustekinumab-vedolizumab-real-comparative',
    category: 'ibd',
    title: 'Two Newer Biologics for IBD Perform Comparably Overall, With One Specific Exception in Ulcerative Colitis',
    teaser: "This category's own already-covered anti-TNF and combination-therapy research covers one drug class, direct comparative studies of two newer biologics, ustekinumab and vedolizumab, find them broadly comparable, except in one specific quantified case.",
    summary:
      "This category's own already-covered anti-TNF and SONIC combination-therapy research names one biologic class, and ustekinumab and vedolizumab (two newer, differently-targeted biologics) have their own, direct head-to-head comparative data worth covering separately. A multicenter GETAID cohort study directly comparing the two in ulcerative colitis patients who had already failed anti-TNF therapy (already covered elsewhere in this category as a common scenario) found no significant difference between them after adjusting for other confounding factors. A separate study in the elderly IBD population found both comparably effective and safe, useful data for a population often excluded from the original approval trials. The worth-knowing exception: a study in pediatric and young-adult patients found vedolizumab producing significantly higher 1-year steroid-free remission specifically in ulcerative colitis and IBD-unclassified patients (61 percent versus 32 percent for ustekinumab), while the same study found the two performing comparably in Crohn's disease patients (63 versus 68 percent at 6 months), direct evidence the right choice can depend on which specific IBD subtype is being treated, not just biologic availability or cost. Worth stating directly: this is useful, evidence-backed nuance worth discussing directly with a gastroenterologist when choosing between the two, rather than assuming they're interchangeable across every IBD presentation.",
    citations: [
      { source: 'Comparative real-world effectiveness of vedolizumab and ustekinumab for patients with ulcerative colitis: a GETAID multicentre cohort study, PMID 35819361', url: 'https://pubmed.ncbi.nlm.nih.gov/35819361/' },
      { source: 'Real-world efficacy of ustekinumab and vedolizumab in pediatric and young adult patients with inflammatory bowel disease, PMID 40836379', url: 'https://pubmed.ncbi.nlm.nih.gov/40836379/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-sonic-combination-therapy', 'ibd-anti-tnf-loss-of-response'],
  },
  {
    id: 'ibd-crohns-strictures-real-surgery-rate',
    category: 'ibd',
    title: "Crohn's Own Physical Narrowing (Strictures) Is Common, and Data Names a High Eventual Surgery Rate",
    teaser: "This category's own already-covered perianal-fistula entry names one Crohn's complication, data finds intestinal strictures (physical narrowing from scarring) affecting a majority of patients within a decade, with a high cumulative surgery rate once they develop.",
    summary: "This category's own already-covered fistula and colonoscopy-surveillance research names physical complications specific to Crohn's disease, and intestinal strictures, physical narrowing of the bowel caused by chronic inflammation and scarring, deserve their own direct coverage. Data finds this common: roughly 50 to 70 percent of Crohn's patients develop stricturing or penetrating (fistula-forming) complications within 10 years of diagnosis, evidence this isn't a rare, unusual outcome but a common trajectory of the disease left to progress. The most direct, practical number: a study found the cumulative risk of Crohn's-related surgery in patients with stricturing disease climbing steadily, from 18.0 percent at year 1 to 46.4 percent by year 5, and a separate comparison found patients with a stricturing-penetrating phenotype needing surgery at a striking 77.7 percent rate versus just 12.2 percent for patients with purely inflammatory (non-stricturing) Crohn's, direct evidence of how much this specific disease behavior changes the practical outlook. Research also finds patients with strictures facing significantly higher rates of hospitalization, steroid dependency, and repeated endoscopy along the way, not just eventual surgery. Worth stating directly: this honest, higher-stakes trajectory is exactly why this category's own already-covered early, aggressive treatment approach (matching the already-established window-of-opportunity research for other conditions) matters specifically for Crohn's disease, worth discussing directly with a gastroenterologist rather than waiting to see how the disease behaves on its own.",
    citations: [
      { source: "Intestinal strictures in Crohn's disease: a 2021 update, PMC9218441", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9218441/' },
      { source: "Analysis of the risk of future gastrointestinal surgery in Crohn's disease with stricture, PMC10980300", url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10980300/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-perianal-fistula-real-data', 'ibd-anti-tnf-loss-of-response'],
  },
  {
    id: 'ibd-cdiff-elevated-risk-real-data',
    category: 'ibd',
    title: 'A Distinct Infection Risk Runs Alongside IBD Itself, and Complicates Telling a Flare From an Infection',
    teaser: "This category's own already-covered corticosteroid and combination-therapy research names infection-risk considerations, Clostridioides difficile infection specifically carries a four- to five-fold higher risk in IBD, and can look identical to a flare.",
    summary:
      "This category's own already-covered immunosuppressive-medication research already names general infection-risk tradeoffs, and Clostridioides difficile infection (C. Diff, a common cause of severe diarrhea) deserves its own direct coverage as an elevated, IBD-specific risk. Pooled data finds IBD patients carrying a four- to five-fold higher risk of C. Diff infection than the general population, with more severe courses once infected, higher rates of hospitalization, colectomy (surgical bowel removal), recurrence, and mortality. Testing during an active IBD flare finds C. Diff toxins present in a 5.5 to 20 percent of cases, an important number given how directly this complicates clinical decision-making: a person with IBD experiencing worsening diarrhea could be having a disease flare (which treatment escalates immunosuppression to control) or a C. Diff infection (which treatment requires antibiotics and REDUCING immunosuppression), two opposite treatment directions that look clinically identical without a direct stool test to distinguish them. Research names the specific, elevated-risk factors directly: active colonic inflammation itself, broad-spectrum antibiotic exposure, prolonged hospitalization, and corticosteroid or combined immunosuppressive therapy, all identifiable risk multipliers. Worth stating directly: this is exactly why a C. Diff stool test is a standard, recommended step before assuming worsening symptoms during a hospitalization or flare are simply the underlying disease getting worse, an important distinction this category's own already-covered fecal calprotectin research doesn't fully resolve on its own.",
    citations: [
      { source: 'Risk Factors, Diagnosis, and Management of Clostridioides difficile Infection in Patients with Inflammatory Bowel Disease, PMC9319314', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9319314/' },
      { source: 'Novel risk factors and outcomes in inflammatory bowel disease patients with Clostridioides difficile infection, PMID 33786065', url: 'https://pubmed.ncbi.nlm.nih.gov/33786065/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-calprotectin', 'ibd-corticosteroid-hypertension-real-data'],
  },
  {
    id: 'ibd-skin-manifestations-en-pg-real-prevalence',
    category: 'ibd',
    title: 'Two Distinct Skin Conditions Show Up Alongside IBD, One Common, One Rare but Serious',
    teaser: "This category's own already-covered extraintestinal-manifestation research already names joint and eye involvement, a large 2,402-patient cohort quantifies the skin's own two distinct manifestations directly: erythema nodosum in 4.0%, pyoderma gangrenosum in a rarer 0.75%.",
    summary:
      "This category's own already-covered extraintestinal-manifestation research already establishes joint, eye, and liver involvement beyond the gut itself, and the skin carries its own two distinct manifestations worth their own direct, quantified coverage. A large cohort study of 2,402 IBD patients found erythema nodosum, tender, red nodules typically on the shins, evidence of inflammation in the fat layer beneath the skin, present in 4.0 percent of patients, evidence this is a common, if still minority, extraintestinal sign. Pyoderma gangrenosum, a much rarer but far more serious skin condition (painful, rapidly enlarging ulcers that can develop from even minor skin trauma), was present in 0.75 percent of the same cohort. The useful, practical distinction: erythema nodosum tends to track closely with active intestinal inflammation and often improves as the underlying IBD itself is brought under control, while pyoderma gangrenosum can behave more independently, sometimes appearing even during disease remission, and research names it as having the most debilitating disease course of the two. Research also found both conditions more commonly associated with Crohn's disease than with ulcerative colitis specifically. Worth stating directly: erythema nodosum's own common, largely reassuring pattern is different from pyoderma gangrenosum's own rarer, more serious one, worth knowing to distinguish directly, since a new, unexplained, rapidly worsening skin ulcer deserves urgent evaluation rather than being assumed to be a minor, self-resolving IBD-related skin change.",
    citations: [
      { source: 'Significance of erythema nodosum and pyoderma gangrenosum in inflammatory bowel diseases: a cohort study of 2402 patients, Medicine (Baltimore), PMID 18794711', url: 'https://pubmed.ncbi.nlm.nih.gov/18794711/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-extraintestinal-manifestations', 'ibd-extraintestinal-real-prevalence-split'],
  },
  {
    id: 'ibd-gut-inflammation-hippocampal-neurogenesis',
    category: 'ibd',
    title: 'Gut Inflammation Itself Directly Suppresses New-Neuron Growth in the Brain, a Real, Specific Mechanism',
    teaser: "This category's own already-covered depression/anxiety research names inflammatory cytokines as a plausible mechanism, a real mouse colitis model traced that mechanism directly to the hippocampus itself, finding measurably suppressed new-neuron production during both active and ongoing gut inflammation.",
    summary:
      "This category's own already-covered depression and anxiety research names inflammatory cytokines, vagal signaling, and gut dysbiosis as plausible mechanisms; a real, more specific study traces one of those mechanisms directly into the brain's own hippocampus. A real mouse model of colitis (induced with dextran sodium sulfate, a standard, well-established way to model IBD-like intestinal inflammation) found that intestinal inflammation directly triggered a real, measurable inflammatory response in the hippocampus itself, including activation of the brain's own immune cells (microglia) and increased inflammatory signaling genes, alongside measurable deficits in hippocampal neurogenesis markers after both a single, acute flare and after chronic, repeated inflammation. The proposed mechanism is direct and specific: the same neural progenitor cells that would otherwise become new neurons carry receptors for the pro-inflammatory cytokines gut inflammation produces, and a sustained inflammatory environment in that cell niche directly works against normal neurogenic activity, rather than the gut and brain effects being separate, coincidental problems. Worth stating directly: this is animal research, not yet directly confirmed in human IBD patients, but it offers a real, specific, mechanistic explanation connecting active gut inflammation to the brain changes that plausibly underlie the mood and cognitive symptoms already covered in this category's own research, a genuine, biological throughline rather than two separate, loosely-associated conditions.",
    citations: [
      { source: 'Chronic intestinal inflammation alters hippocampal neurogenesis, PMID 25889852', url: 'https://pubmed.ncbi.nlm.nih.gov/25889852/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibd-depression-anxiety-bidirectional-real-data', 'neurogenesis-tying-together', 'gut-scfa-treg'],
  },
  {
    id: 'ibd-fermented-drinks',
    category: 'ibd',
    title: 'Fermented Drinks and Foods for IBD',
    teaser: 'Timing matters here more than for almost any other condition in this app: a fermented drink that\'s helpful during remission can still be the wrong thing to reach for during an active flare.',
    summary: 'This app\'s own Beet Kvass is traditionally taken as a 1-2 ounce shot, not a full glass, a practical fit for IBD\'s own "start low, go slow" approach to reintroducing fermented foods. During an active flare, carbonated drinks and anything still carrying meaningful fiber can worsen gas and bloating on an already inflamed gut, so a short, well-strained ferment (the liquid poured off, no pulp) is the safer choice over a longer-fermented, fizzier one. A compromised gut lining also produces less DAO, the enzyme that breaks down histamine, so long-fermented drinks (which accumulate more histamine the longer they sit) are worth watching closely for a flush, headache, or worsening symptoms; pulling back to shorter ferments if that happens is a useful signal, not something to push through.',
    citations: [
      { source: 'National Center for Home Food Preservation (University of Georgia) fermentation overview', url: 'https://nchfp.uga.edu/how/can_ferment.html' },
    ],
    overallTier: 'moderate',
    relatedIds: ['recipe-ferment-beet-kvass', 'fermentmethod-lacto-fermented-vegetables'],
  },
];
