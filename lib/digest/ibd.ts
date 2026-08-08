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
    relatedIds: ['other-ibd'],
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
    relatedIds: ['ibd-calprotectin'],
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
    relatedIds: ['ibd-colonoscopy-surveillance'],
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
    relatedIds: ['ibd-fodmap-remission-symptoms'],
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
];
