import type { DigestEntry } from './types';

// Prostate Health (BPH & Prostate Cancer Risk) -- 12 entries, added
// 2026-08-08 as this app's nineteenth real condition, and its ninth
// genuinely non-autoimmune one. Added after a direct question: "Is there
// any solid reason for prostate health to be included related to food
// health and gut microbiome and whole foods?" Real research says yes,
// clearly: benign prostatic hyperplasia (BPH) affects roughly 45% of men
// over 45 and up to 80-90% of men over 70-80, and prostate cancer is the
// most commonly diagnosed cancer in American men -- a genuinely enormous
// real population this app had no dedicated coverage for. The gut
// microbiome connection is real and specific too, not a stretch: gut
// bacteria directly metabolize dietary compounds into androgens and TMAO
// (both with documented prostate effects), gut dysbiosis is linked to BPH
// via reduced SCFA production and increased systemic inflammation (the
// same SCFA/Treg mechanism this app's own Gut & Microbiome research
// already covers for other conditions), and diet quality measurably shifts
// gut microbial diversity in ways connected to both conditions.
//
// Built with real self-advocacy content from the start, the same standard
// every condition since Graves' has followed. Every citation independently
// verified via WebSearch before being written in.
export const PROSTATE_HEALTH_ENTRIES: DigestEntry[] = [
  {
    id: 'prostate-overview',
    category: 'prostateHealth',
    title: 'Prostate Health: Two Real, Extremely Common Conditions With a Genuine Diet Connection',
    teaser: 'Benign prostatic hyperplasia affects roughly half of men by their 50s and most men by their 70s. Prostate cancer is the most commonly diagnosed cancer in American men. Both have real, documented dietary and gut-microbiome links.',
    summary:
      "Two real, separate conditions live under this category. Benign prostatic hyperplasia (BPH) is a non-cancerous enlargement of the prostate gland that squeezes the urethra, causing urinary symptoms (frequency, urgency, a weak stream, nighttime waking to urinate); it's genuinely age-dependent, real data showing 29% prevalence in men in their 50s, climbing to 44.7% in their 60s, 58.1% in their 70s, and 69.2% at 80 and older. Prostate cancer is a real, separate disease, the most commonly diagnosed cancer among American men, accounting for roughly 27% of new male cancer diagnoses in a recent year. Both conditions share real, overlapping risk factors and, notably for this app, both have genuine, independently documented connections to diet and the gut microbiome: specific gut bacteria convert dietary compounds into androgens that directly affect prostate tissue, gut dysbiosis is linked to BPH through reduced anti-inflammatory short-chain fatty acid production, and specific whole foods (tomatoes, cruciferous vegetables) carry real, quantified risk-reduction evidence. Diet won't cure either condition, and nothing here replaces a urologist's own evaluation and treatment plan. What follows is what the actual research supports, kept honest about how strong each finding really is.",
    citations: [
      { source: 'Benign Prostatic Hyperplasia, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK558920/' },
      { source: 'The prevalence of benign prostatic hyperplasia in mainland China: evidence from epidemiological surveys', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4549711/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-gut-microbiome-bph', 'prostate-psa-screening'],
  },
  {
    id: 'prostate-gut-microbiome-bph',
    category: 'prostateHealth',
    title: 'Gut Dysbiosis Is Directly Linked to BPH, Through the Same SCFA Mechanism This App Already Covers Elsewhere',
    teaser: 'A real systematic review found specific bacterial shifts and reduced microbial diversity in men with BPH, with a mechanism connecting straight back to short-chain fatty acids.',
    summary:
      "A real, direct gut-prostate connection, not a speculative one. A systematic review of gut microbial dysbiosis in BPH found real, measured differences in men with the condition compared to men without it: a significantly increased Firmicutes-to-Bacteroidetes ratio (a recognized marker of dysbiosis), and real shifts in the abundance of specific genera, including Prevotella, Ruminococcus, and Lactobacillus. The proposed mechanism is genuinely specific: gut dysbiosis reduces the population of short-chain-fatty-acid-producing bacteria, weakening SCFAs' own real anti-inflammatory effect, while simultaneously increasing bacteria linked to systemic inflammation. Inflammatory mediators from the gut are then thought to reach the prostate gland through the bloodstream, contributing to the localized inflammation that drives BPH progression. This is the same SCFA-to-inflammation pathway this app's own Gut & Microbiome research already documents as central to autoimmune disease broadly, now showing up in a real, separate, non-autoimmune condition through a genuinely similar mechanism. A real, separate rat-model study found Western-style diets (high fat, high refined sugar, low fiber) reduce gut microbial diversity in exactly this same direction.",
    citations: [
      { source: 'The gut-prostate axis in benign prostatic hyperplasia: systematic review of microbial dysbiosis and pathogenic mechanisms', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12866195/' },
      { source: 'The role of gut microbiota in prostate inflammation and benign prostatic hyperplasia and its therapeutic implications', url: 'https://www.sciencedirect.com/science/article/pii/S2405844024143332' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-scfa-treg', 'prostate-diet-pattern'],
  },
  {
    id: 'prostate-gut-microbiome-cancer-androgens',
    category: 'prostateHealth',
    title: 'Some Gut Bacteria Can Directly Manufacture Androgens, With a Real, Documented Prostate Cancer Connection',
    teaser: 'A specific gut bacterium found in some prostate cancer patients can convert a hormone precursor into testosterone itself, inside the gut, before it ever reaches the prostate.',
    summary:
      "This is a genuinely striking, specific finding, not a general 'gut bacteria matter' statement: certain strains of Ruminococcus, a real, common gut genus, can convert pregnenolone and hydroxypregnenolone (hormone precursor molecules) into downstream androgens, including testosterone itself, directly inside the gut. In men with castrate-resistant prostate cancer, a real, more advanced stage where standard hormone-blocking treatment has stopped working, increased Ruminococcus abundance is associated with a measurably worse prognosis. Separately, gut microbiota composition also affects estrogen metabolism through what's called the estrobolome, bacterial enzymes that free up estrogen for reabsorption into the body, a mechanism with its own real, documented cancer relevance. Real research also finds gut microbial diversity itself (a measure of how many different bacterial species are present) is significantly lower in prostate cancer patients than in healthy controls, a real, measurable difference, though not yet proof of which direction causation runs. This is a genuinely active, real research area, not a settled one, but the mechanism (specific gut bacteria directly manufacturing the hormones that drive prostate tissue growth) is real and documented, not speculative.",
    citations: [
      { source: 'Potential role of gut microbiota in prostate cancer: immunity, metabolites, pathways of action?', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10231684/' },
      { source: 'Gut microbiota in patients with prostate cancer: a systematic review and meta-analysis', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10893726/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['prostate-choline-tmao'],
  },
  {
    id: 'prostate-diet-pattern',
    category: 'prostateHealth',
    title: 'A Plant-Forward, High-Fiber Diet Pattern Carries Real, Consistent Evidence for Both Conditions',
    teaser: "The same real dietary pattern that supports a healthy gut microbiome elsewhere in this app shows up again here, with its own direct prostate evidence.",
    summary:
      "Diets rich in plant foods, fiber, and prebiotics are real, documented to promote gut microbial profiles linked to anti-inflammatory and anti-carcinogenic activity, while a Western dietary pattern, high in saturated fat and processed food, is real, documented to promote the dysbiosis linked to both BPH and worse prostate cancer outcomes. This isn't a single supplement or a single food; it's the same broad, whole-food pattern this app's own research already finds carrying real evidence across several other conditions, showing up here through its own real, prostate-specific mechanism. Short-term dietary changes are real, documented to measurably shift gut microbiota composition, and microbiota composition genuinely differs between prostate cancer patients and healthy individuals, a real, if not yet fully causal, connection worth taking seriously as a genuine lever rather than dismissed as unrelated to a gland-specific disease.",
    citations: [
      { source: 'The impact of diet and gut microbiota on development, treatment, and prognosis in prostate cancer', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12747913/' },
      { source: 'Microbiome and Prostate Cancer: Emerging Diagnostic and Therapeutic Opportunities', url: 'https://www.mdpi.com/1424-8247/17/1/112' },
    ],
    overallTier: 'moderate',
    relatedIds: ['prostate-gut-microbiome-bph'],
  },
  {
    id: 'prostate-lycopene-tomatoes',
    category: 'prostateHealth',
    title: 'Lycopene, Concentrated in Tomatoes, Carries a Real, Dose-Response Risk Reduction',
    teaser: 'A systematic review and meta-analysis found a real, linear relationship: the more lycopene in the diet or the bloodstream, the lower the measured prostate cancer risk.',
    summary:
      "Lycopene is the real, specific carotenoid pigment that gives tomatoes their red color, and it carries some of the best-established single-nutrient evidence for prostate cancer risk reduction in this whole research area. A systematic review and meta-analysis found a real, linear inverse association between dietary lycopene intake and prostate cancer risk, and separately found high blood levels of lycopene associated with an 11% reduction in overall cancer risk, a real, dose-response relationship rather than an all-or-nothing effect. The World Cancer Research Fund's own evidence review states there is sufficient evidence that high intake of tomatoes, tomato products, or lycopene supplementation can decrease prostate cancer risk. Cooking and processing tomatoes (into sauce, paste, or juice) actually increases lycopene's bioavailability compared to raw tomatoes, a real, practical, useful detail worth knowing rather than assuming raw is always better.",
    citations: [
      { source: 'Increased dietary and circulating lycopene are associated with reduced prostate cancer risk: a systematic review and meta-analysis, Prostate Cancer and Prostatic Diseases', url: 'https://www.nature.com/articles/pcan201725' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'prostate-cruciferous-sulforaphane',
    category: 'prostateHealth',
    title: 'Cruciferous Vegetables Carry Real Epidemiological and Mechanistic Evidence Against Prostate Cancer',
    teaser: 'Broccoli, cauliflower, and cabbage all contain a real compound that this app already covers for its Hashimoto\'s-relevant goitrogenic effect -- here, the same compound family shows a genuinely protective side.',
    summary:
      "Real epidemiological evidence links cruciferous vegetable intake (broccoli, cauliflower, cabbage, Brussels sprouts, kale) to reduced prostate cancer risk, with real research specifically finding diets rich in broccoli associated with a reduction in aggressive prostate cancer risk. The protective mechanism traces to real, specific metabolic products of glucosinolates, the same sulfur-containing compound family this app's own Hashimoto's research already covers for its real goitrogenic effect on the thyroid when eaten raw in large quantities. Here, the relevant metabolites, sulforaphane (from glucoraphanin) and indole-3-carbinol, show real, documented anti-cancer activity in laboratory research: arresting cell-cycle progression and modulating gene expression markers linked to cancer cell proliferation. This is a genuinely useful, real-world example of the same food family carrying a real risk in one context (raw, high-quantity, thyroid-specific) and a real benefit in another (cooked, moderate, prostate-specific) -- context and preparation matter, not a blanket rule either way.",
    citations: [
      { source: 'Phytochemicals from cruciferous vegetables, epigenetics, and prostate cancer prevention', url: 'https://pubmed.ncbi.nlm.nih.gov/23800833/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'prostate-choline-tmao',
    category: 'prostateHealth',
    title: 'High Choline Intake Is Linked to a Real, Quantified Increase in Lethal Prostate Cancer, Via a Gut-Bacteria-Made Compound',
    teaser: 'A real, large, 22-year study found men with the highest choline intake had a 70% higher risk of dying from prostate cancer, with gut bacteria doing the actual chemistry.',
    summary:
      "This is a real, direct, and genuinely cautionary gut-microbiome finding. A large prospective study (47,896 men, 22 years of follow-up) found men in the highest quintile of choline intake had a real, statistically significant 70% higher risk of developing lethal prostate cancer compared to men in the lowest quintile. The proposed mechanism is specific and gut-bacteria-mediated: dietary choline is converted by gut bacteria into trimethylamine, which the liver then converts into trimethylamine N-oxide (TMAO); real laboratory research finds TMAO directly enhances prostate cancer cell proliferation and migration by activating a specific inflammatory signaling pathway (p38 MAPK, upregulating a protein called HMOX1). Worth real, careful framing: choline is also a genuinely essential nutrient this app already tracks for its own real, separate benefits (see this app's own Magnesium-and-beyond nutrient series), and this finding is about the highest intake quintile in a specific population over decades, not a case for avoiding choline-containing foods (eggs, liver, fish) entirely. It's a real, useful reason to know that more isn't automatically better, and that gut bacteria are actively metabolizing what's eaten into compounds with their own real, independent health effects.",
    citations: [
      { source: 'Choline intake and risk of lethal prostate cancer: incidence and survival, American Journal of Clinical Nutrition, PMID 22952174', url: 'https://pubmed.ncbi.nlm.nih.gov/22952174/' },
      { source: 'Gut microbiota derived metabolite trimethylamine N-oxide influences prostate cancer progression via the p38/HMOX1 pathway', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11754881/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-gut-microbiome-cancer-androgens'],
  },
  {
    id: 'prostate-zinc-connection',
    category: 'prostateHealth',
    title: 'The Prostate Gland Holds the Highest Zinc Concentration of Any Organ in the Body',
    teaser: 'This is a real, distinctive physiological fact, and healthy prostate tissue depends on it directly.',
    summary:
      "Zinc, a real nutrient this app already tracks in depth (see this app's own Zinc deep-dive), has a genuinely distinctive relationship with the prostate specifically: healthy prostate tissue concentrates zinc at levels far higher than any other organ in the body, and that zinc plays a real, direct role in normal prostate cell metabolism. Real research finds prostate cancer tissue characteristically shows a dramatic loss of this normal zinc accumulation, a consistent enough finding that zinc status is studied as a real marker of prostate tissue health, though the evidence for zinc supplementation actually preventing or treating prostate disease remains genuinely less settled than the tissue-level association itself. This app's food-scoring for prostate health reuses its own existing, already-populated zinc scoring across the whole 22,000-plus-food reference database directly, on the strength of this real, distinctive physiological connection.",
    citations: [
      { source: 'Chemoprevention of Prostate Cancer by Natural Agents: Evidence from Molecular and Epidemiological Studies, Anticancer Research', url: 'https://ar.iiarjournals.org/content/39/10/5231' },
    ],
    overallTier: 'moderate',
    relatedIds: ['zinc-overview', 'zinc-tying-together'],
  },
  {
    id: 'prostate-selenium-select-trial-correction',
    category: 'prostateHealth',
    title: 'A Real, Large Trial Found Selenium Supplementation Does Not Prevent Prostate Cancer, and Vitamin E May Raise Risk',
    teaser: "One of this app's biggest supplement-evidence corrections: selenium is strongly evidenced for Hashimoto's, but a landmark 35,000-man trial found it doesn't help here, and its supplement partner may actually hurt.",
    summary:
      "This is a real, important, humbling correction, in the same honest tradition as several other supplement corrections already documented across this app. Selenium carries real, strong trial evidence for lowering TPO antibodies in Hashimoto's (see this app's own nutrient research), which made it a reasonable real candidate for prostate cancer prevention too, since earlier, smaller studies had suggested a possible benefit. The Selenium and Vitamin E Cancer Prevention Trial (SELECT), a real, large, randomized, placebo-controlled trial of 35,533 men followed for 7 to 12 years, found neither selenium (200 mcg/day) nor vitamin E (400 IU/day) reduced prostate cancer incidence. More concerning: vitamin E alone was associated with a real, statistically significant 17% increased risk of prostate cancer compared to placebo. A follow-up analysis of the same trial data found selenium supplementation was associated with an increased risk of high-grade prostate cancer specifically in men who already had adequate selenium status before starting, a real, direct reason more is not automatically better for a nutrient that's genuinely beneficial in a different, deficient context. This is a real, direct argument for getting nutrients through real, whole foods rather than high-dose supplementation, absent a specific, diagnosed deficiency.",
    citations: [
      { source: 'Effect of Selenium and Vitamin E on Risk of Prostate Cancer and Other Cancers: The Selenium and Vitamin E Cancer Prevention Trial (SELECT), JAMA', url: 'https://jamanetwork.com/journals/jama/fullarticle/183163' },
      { source: 'Selenium and Prostate Cancer Prevention: Insights from the Selenium and Vitamin E Cancer Prevention Trial (SELECT)', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3705339/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'prostate-saw-palmetto-mixed',
    category: 'prostateHealth',
    title: 'Saw Palmetto for BPH Symptoms: Genuinely Mixed Evidence, Not a Clean Yes or No',
    teaser: 'One of the most widely used prostate supplements has real trials on both sides, likely explained by a real, practical problem: different studies used different, non-standardized extracts.',
    summary:
      "Saw palmetto is a real, extremely commonly used supplement for BPH symptoms, and the honest evidence picture is genuinely mixed rather than settled either way. A real, rigorous, year-long randomized trial (the largest of its kind) found saw palmetto extract, even at double and triple the standard dose, was not superior to placebo for improving urinary symptoms or objective measures of BPH. Separately, though, real meta-analyses of a specific, standardized hexanic extract (used in 27 studies covering 5,800 patients) found real, significant improvement in peak urinary flow and reduced nighttime urination, and a 2020 meta-analysis found saw palmetto performed comparably to tamsulosin, a standard prescription medication, in men with BPH. The real, likely explanation for this split: saw palmetto products sold commercially are not standardized, meaning different trials, and different products someone might actually buy, may not contain comparable amounts of the active compounds at all. Worth knowing directly rather than picking whichever result sounds better: this is a real, unresolved case where the honest answer is 'it depends which product, and the evidence hasn't converged.'",
    citations: [
      { source: 'Saw Palmetto for Benign Prostatic Hyperplasia, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa053085' },
      { source: 'Effect of Increasing Doses of Saw Palmetto Extract on Lower Urinary Tract Symptoms: A Randomized Trial, JAMA', url: 'https://jamanetwork.com/journals/jama/fullarticle/1104439' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'prostate-medications-psa-monitoring',
    category: 'prostateHealth',
    title: 'A Real, Precise Lab-Interpretation Trap: 5-Alpha-Reductase Inhibitors Cut PSA Roughly in Half',
    teaser: "Finasteride and dutasteride, two of the most common BPH medications, genuinely change what a normal PSA number looks like -- a real, direct reason to double a reported value before comparing it to anything.",
    summary:
      "Finasteride and dutasteride (5-alpha-reductase inhibitors) are real, common, effective BPH medications that work by blocking the enzyme that converts testosterone into DHT, the more potent androgen actually driving prostate tissue growth; both real, documented to shrink prostate volume, improve urinary symptoms, and reduce the risk of acute urinary retention and BPH-related surgery over time. Dutasteride blocks a broader range of the enzyme than finasteride, producing a somewhat larger DHT reduction. The single most important self-advocacy fact here, a real, precise lab-interpretation trap the same way biotin's own lab-interference finding already documented elsewhere in this app: after 6-12 months on either medication, PSA levels drop by roughly 50%, meaning a reported PSA value needs to be doubled before comparing it against a normal reference range or tracking it for a real change over time. Tamsulosin, a genuinely different class of medication (an alpha-blocker), works by relaxing the muscle around the prostate and bladder neck directly rather than shrinking the gland, and doesn't carry this same PSA effect.",
    citations: [
      { source: '5-Alpha Reductase Inhibitors, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK555930/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'prostate-psa-screening',
    category: 'prostateHealth',
    title: 'PSA Screening Is a Real, Genuine Shared Decision, Not a Routine Test With an Obvious Right Answer',
    teaser: "Real, current guidance is honest that PSA screening's mortality benefit is small, and its harms, including a 1-in-5 chance of long-term incontinence after surgery, are real and significant.",
    summary:
      "PSA screening's own real evidence is more complicated than 'more screening is always better,' the same honest, current-guidance-vs-popular-assumption gap this app already documents for TSH range and other lab tests. Current USPSTF guidance states that for men 55 to 69, the decision to undergo periodic PSA screening should be an individual one, made together with a clinician, specifically because the real reduction in prostate cancer mortality after 10 to 14 years of follow-up is, at most, very small, even in this optimal age range, with no apparent reduction in all-cause mortality. The real reason screening isn't simply recommended for everyone: PSA elevation can come from BPH, prostatitis, or normal variation, not just cancer, and overdiagnosis, detecting a real cancer that would never have caused symptoms or death in that person's lifetime, is a real, documented consequence. The real harms of treatment are significant and worth knowing precisely: about 1 in 5 men who undergo radical prostatectomy develop long-term urinary incontinence requiring pads, roughly 2 in 3 experience long-term erectile dysfunction, and more than half of men receiving radiation therapy experience long-term erectile dysfunction, with up to 1 in 6 experiencing long-term bothersome bowel symptoms. Current guidance recommends against routine PSA screening for men 70 and older. None of this means skip the conversation with a doctor; it means going into that conversation with the real numbers rather than an assumption that screening is automatically the safer choice.",
    citations: [
      { source: 'Screening for Prostate Cancer: US Preventive Services Task Force Recommendation Statement', url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/prostate-cancer-screening' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-medications-psa-monitoring'],
  },
  {
    id: 'prostate-tying-together',
    category: 'prostateHealth',
    title: 'What Actually Holds Up for Prostate Health, Pulled Together',
    teaser: 'A real, direct gut-bacteria-to-hormone pathway, two individually strong protective foods, and a real, humbling correction on a supplement that works well for a different condition.',
    summary:
      "Line up everything in this category and prostate health reads as a real, genuinely gut-microbiome-connected condition, not a stretch to include here. Gut dysbiosis is directly linked to BPH through the same SCFA-and-inflammation mechanism this app's own Gut & Microbiome research already documents for autoimmune disease, and specific gut bacteria can directly manufacture the androgens and metabolize dietary compounds (choline into TMAO) that measurably affect prostate cancer risk and progression, a genuinely direct, mechanistic connection rather than a loose correlation. Lycopene and cruciferous vegetables both carry real, individually strong protective evidence, two dependable, concrete food-first levers. Zinc's own distinctive, outsized concentration in healthy prostate tissue makes it a real, natural reuse of this app's own existing nutrient scoring. And two honest corrections round out the practical picture: selenium, strongly evidenced for Hashimoto's, does not prevent prostate cancer and its usual supplement partner (vitamin E) may raise risk, while saw palmetto's own popularity outruns its actually mixed evidence, likely due to real product-standardization problems. The two self-advocacy entries carry the same kind of precise, practical numbers this app's other conditions have already established matter: 5-alpha-reductase inhibitors cutting PSA roughly in half (a real lab-interpretation trap), and PSA screening's own honest, quantified benefit-versus-harm tradeoff, a genuine shared decision rather than an automatic yes.",
    citations: [
      { source: 'Benign Prostatic Hyperplasia, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK558920/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-gut-microbiome-bph', 'prostate-lycopene-tomatoes', 'prostate-cruciferous-sulforaphane', 'prostate-selenium-select-trial-correction', 'prostate-psa-screening'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch. No pregnancy/family-planning
  // entry applies here for the obvious reason -- replaced with a real,
  // directly relevant male-line analog: family history and inherited
  // genetic risk, the closest real equivalent to what pregnancy-risk
  // content covers for other conditions (a real, actionable risk signal
  // worth knowing and acting on before symptoms appear).
  {
    id: 'prostate-real-staging-systems',
    category: 'prostateHealth',
    title: "Two Real, Completely Different Staging Systems -- One for BPH's Own Symptoms, One for Prostate Cancer's Own Aggressiveness",
    teaser: "The AUA Symptom Score (0-35) measures how much BPH is actually affecting daily life. The Gleason Grade Group (1-5) measures something entirely different: how dangerous a diagnosed cancer actually is.",
    summary:
      "BPH and prostate cancer, the two real conditions this category covers, use genuinely different real staging tools worth knowing apart. BPH severity is measured with the real AUA Symptom Index, 7 real questions covering urinary frequency, nighttime urination, weak stream, hesitancy, and more, scored 0-35: mild (0-7), moderate (8-19), or severe (20-35), a real, standardized way to track whether symptoms are actually worsening over time rather than relying on a vague impression. Prostate cancer, once diagnosed, uses a completely different real system: the Gleason score (from a real biopsy, grading how abnormal cancer cells look under a microscope, 6 or below is low-grade, 7 is intermediate, 8-10 is high-grade) is now organized into 5 real Grade Groups (1 through 5) by the International Society of Urological Pathologists, combined with the real TNM system (Tumor size/location, lymph Node spread, distant Metastasis) for overall staging. Worth knowing directly: these are two real, separate measurements answering two different questions, how much is BPH bothering daily life, versus how aggressive a diagnosed cancer actually is, not one continuous scale.",
    citations: [
      { source: 'The American Urological Association Symptom Index for Benign Prostatic Hyperplasia, PMID 28012747', url: 'https://pubmed.ncbi.nlm.nih.gov/28012747/' },
      { source: 'Grade Groups for prostate cancer, Cancer Research UK', url: 'https://www.cancerresearchuk.org/about-cancer/prostate-cancer/stages/grades' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-psa-screening'],
  },
  {
    id: 'prostate-untreated-bph-kidney-bladder',
    category: 'prostateHealth',
    title: "Untreated BPH Can Genuinely Damage the Bladder and, in Real, Severe Cases, the Kidneys",
    teaser: "BPH isn't just an inconvenience -- real, chronic obstruction can stretch and weaken the bladder permanently, and in real, severe cases, back pressure can reach the kidneys themselves.",
    summary:
      "Left untreated, BPH's own real reach extends beyond urinary inconvenience into genuine, documented organ damage. Real, chronic urethral obstruction can cause the bladder wall to thicken and become irritable, with real, reduced capacity to hold urine, and can lead to real complications: infected residual urine, bladder stones, and, in real, chronic cases, a bladder that stretches and permanently weakens, losing its own ability to contract effectively over time. The real, most acute complication is acute urinary retention, a complete inability to urinate when the enlarged prostate fully obstructs the urethra, a real, genuine medical emergency requiring immediate treatment. In real, severe, long-standing cases, backed-up pressure can reach the kidneys themselves, though real research notes actual kidney failure from this specific mechanism is genuinely uncommon when BPH is being monitored and treated appropriately, worth knowing as a real, serious but largely preventable worst case rather than a common outcome, and a real, direct reason the AUA Symptom Score above is worth tracking over time rather than waiting for a crisis.",
    citations: [
      { source: 'Male Urinary Retention: Acute and Chronic, StatPearls, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538499/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-real-staging-systems'],
  },
  {
    id: 'prostate-history-milestones',
    category: 'prostateHealth',
    title: "Prostate Health's Own Real History: A Blood Test That Didn't Exist Until 1986",
    teaser: "1904, the early 1940s, 1986 -- before a real PSA blood test existed, the digital rectal exam was the only screening tool available, often catching cancer only once it was already advanced.",
    summary:
      "Prostate cancer treatment's own real history moves through several genuine turning points. In 1904, Hugh Hampton Young performed one of the earliest real radical prostatectomies at Johns Hopkins, an early, if crude by modern standards, surgical approach. In the early 1940s, Charles Huggins and Clarence Hodges made a real, foundational discovery: prostate cancer growth is directly influenced by testosterone, and reducing androgen levels could shrink tumors and ease symptoms, the same real hormonal mechanism this app's own testosterone research already covers, and the actual basis for hormone therapy still used today. The real, most transformative diagnostic breakthrough came far later: PSA was first purified and characterized in 1979, but a real, usable blood test wasn't FDA-approved until 1986, initially only for monitoring already-diagnosed cancer, not expanded to real, general screening in asymptomatic men until 1994. Before 1986, the digital rectal exam was the only real screening tool available, and real, historical data shows it often caught cancer only once tumors were already too advanced to cure, a real, direct reason PSA testing's own arrival, despite the genuine overdiagnosis debate this app's own screening research already covers honestly, represented such a significant real diagnostic shift.",
    citations: [
      { source: "The 'True' History of the Discovery of Prostate-specific Antigen, The ASCO Post", url: 'https://ascopost.com/issues/december-15-2012/the-true-history-of-the-discovery-of-prostate-specific-antigen/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-psa-screening', 'testosterone-overview-function'],
  },
  {
    id: 'prostate-family-history-genetic-risk',
    category: 'prostateHealth',
    title: "A Real, Striking Genetic Risk: BRCA2 Carriers Face Up to a 60% Lifetime Prostate Cancer Risk",
    teaser: "The same BRCA2 gene most associated with breast cancer risk carries a real, direct, and genuinely serious prostate-cancer risk in men too -- and family history alone can raise real risk five-fold.",
    summary:
      "Prostate cancer carries a real, substantial inherited-risk component worth knowing directly, especially since it's this app's own most direct male-line equivalent to the real pregnancy/family-planning risk content built for other conditions. Real research finds having a father or brother with prostate cancer directly raises real personal risk, and having two or more close male relatives affected raises real lifetime risk a striking five-fold. The single most dramatic real genetic finding: men carrying a germline BRCA2 mutation, the same gene most commonly associated with breast cancer risk, face a real, quantified absolute prostate cancer risk of 27% by age 75 and 60% by age 85, with disease often striking before age 65, genuinely earlier than typical. BRCA2 mutations account for roughly 5% of familial prostate cancer cases specifically. BRCA1 carriers face a real, smaller but still meaningfully elevated risk too. Worth knowing directly: anyone with a real family history of prostate cancer, OR a family history of BRCA-related breast or ovarian cancer, has a real, concrete, genetics-based reason to discuss earlier or more frequent PSA screening (already covered in this app's own screening research) with a doctor, rather than waiting for the standard population-wide screening age to apply.",
    citations: [
      { source: 'Prostate Cancer Risks for Male BRCA1 and BRCA2 Mutation Carriers: A Prospective Cohort Study, PMC6926480', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6926480/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-psa-screening'],
  },

  // -- Second depth pass, 2026-08-08, continuing the full-parity work
  // beyond the first structural pass. Every citation independently
  // verified via WebSearch.
  {
    id: 'prostate-ejaculation-frequency',
    category: 'prostateHealth',
    title: 'A Real, Large Harvard Study Found More Frequent Ejaculation Tracked With Meaningfully Lower Prostate Cancer Risk',
    teaser: 'A real, 18-year study of nearly 32,000 men found those averaging 21+ ejaculations a month had a real 31% lower prostate cancer risk than those averaging 4-7, holding up after adjusting for lifestyle and screening habits.',
    summary:
      "This is a real, genuinely counterintuitive finding worth stating plainly: a large, real, prospective study run through the Harvard-affiliated Health Professionals Follow-Up Study (31,925 men, followed from 1992 through 2010) found more frequent ejaculation associated with a real, meaningfully LOWER risk of developing prostate cancer, not higher. Men averaging 21 or more ejaculations per month showed a real 31% lower risk of prostate cancer compared to men averaging just 4 to 7 per month, and the real, protective association held up specifically at two different life stages too, a 19% lower risk tied to frequency in their 20s and a 22% lower risk tied to frequency in their 40s. Genuinely important to how much this finding can be trusted: the real result held up even after adjusting for other lifestyle factors and, separately, after adjusting for how often each man actually got PSA screening, ruling out the more mundane explanation that more sexually active men might simply get tested more and catch more cancers incidentally. The real, proposed biological explanation involves clearing out potential carcinogens and reducing crystal-like deposits that can otherwise accumulate in prostatic fluid, though the exact mechanism remains an area of real, ongoing research rather than fully settled. Worth knowing directly: this is real, genuine, large-cohort evidence, not proof of direct causation, but a striking enough finding that it's worth naming by name rather than left as something patient-facing sources rarely mention.",
    citations: [
      { source: 'Ejaculation frequency and subsequent risk of prostate cancer, Harvard Health Publishing', url: 'https://www.health.harvard.edu/mens-health/ejaculation_frequency_and_prostate_cancer' },
    ],
    overallTier: 'moderate',
    relatedIds: ['prostate-psa-screening'],
  },

  // -- Volumetric depth pass batch 3, 2026-08-08, continuing toward
  // genuine volumetric parity with Hashimoto's own depth. Every citation
  // independently verified via WebSearch.
  {
    id: 'prostate-active-surveillance',
    category: 'prostateHealth',
    title: 'Active Surveillance: A Real, Major Shift Away From Immediately Treating Low-Risk Prostate Cancer',
    teaser: 'A real, large 21,000-patient study found 98.1% cancer-specific survival at 10 years for men on active surveillance, real, strong evidence that watching carefully, rather than treating immediately, is genuinely safe for the right cases.',
    summary:
      "Active surveillance represents a real, major, current shift in how low-risk prostate cancer is managed, worth knowing about directly since it changes the standard expectation that a cancer diagnosis automatically means immediate treatment. Rather than surgery or radiation right away, active surveillance means real, regular monitoring, PSA testing (already covered in this app's own screening research), digital exams, and MRI or biopsy as needed, with treatment held in reserve unless the cancer actually shows signs of progressing. Real, large population data (over 21,000 low-grade prostate cancer patients in a real Canadian study) found genuinely reassuring long-term outcomes: 94.2% metastasis-free survival, 88.7% overall survival, and 98.1% cancer-specific survival at 10 years, meaning the overwhelming majority of men managed this way do not die from their prostate cancer. Real, extended follow-up data (the Göteborg-1 trial, tracking men up to 25 years) and other real research confirm this pattern holds over the long term. Worth knowing honestly: real research also finds a genuine tradeoff, roughly half of men on active surveillance eventually transition to active treatment within 5 years as their disease shows real signs of progression, and a small, real, \"non-negligible\" risk exists of missing the right window for a cure in some cases. Worth knowing directly: this is a real, evidence-backed, worth-raising option for anyone diagnosed with low-risk prostate cancer, since it can genuinely avoid or delay real treatment side effects (already covered in this app's own PSA-screening research) while maintaining strong real long-term survival odds.",
    citations: [
      { source: 'Long-term Outcomes Following Active Surveillance of Low-grade Prostate Cancer: A Population-based Study Using a Landmark Approach, PMID 36475730', url: 'https://pubmed.ncbi.nlm.nih.gov/36475730/' },
      { source: 'Active Surveillance for Screen-detected Low- and Intermediate-risk Prostate Cancer: Extended Follow-up up to 25 Years in the GÖTEBORG-1 Trial', url: 'https://www.sciencedirect.com/science/article/pii/S0302283825003586' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-psa-screening', 'prostate-real-staging-systems'],
  },
  {
    id: 'prostate-prostatitis-distinct-condition',
    category: 'prostateHealth',
    title: 'Prostatitis: A Real, Genuinely Common, and Distinct Prostate Condition, Not the Same as BPH or Cancer',
    teaser: "Prostatitis is real prostate inflammation, most common in men under 50, causing real pain and fever that BPH's own painless urinary symptoms don't, and real research finds it can coexist with either BPH or cancer.",
    summary:
      "Prostatitis is a real, genuinely distinct prostate condition worth knowing about separately from the BPH and prostate cancer already covered in real depth in this app's own research, it's inflammation of the prostate gland, and real research finds it's actually the most common urologic diagnosis in men under 50, and the third most common in men over 50 (after BPH and prostate cancer). Real research names four real, distinct types: acute bacterial, chronic bacterial, chronic (nonbacterial) prostatitis/chronic pelvic pain syndrome, and asymptomatic inflammatory prostatitis, though real research finds true acute bacterial prostatitis genuinely rare despite the broader category being common. The real, key distinguishing clue from BPH: prostatitis typically causes real pelvic pain, fever (in acute cases), and painful urination, while BPH causes real, painless urinary flow problems without pain or fever, a genuinely useful, practical way to tell the two apart before any testing. Worth knowing directly: real research finds prostatitis isn't always a stand-alone diagnosis, one real histology study found it coexisting with prostate cancer in 23.3% of cases and with BPH in 58.9% of cases, meaning inflammation is real and common enough to show up alongside either of the other two real prostate conditions rather than always being a separate, competing diagnosis. Worth knowing directly: unexplained pelvic pain or painful urination, especially without the classic slow urinary stream BPH causes, is a real, worth-raising reason to ask specifically about prostatitis rather than assuming any prostate symptom automatically means BPH or cancer.",
    citations: [
      { source: 'Acute Bacterial Prostatitis: Practice Essentials, Pathophysiology, Etiology, Medscape', url: 'https://emedicine.medscape.com/article/2002872-overview' },
      { source: 'The histological prevalence of prostatitis at Potchefstroom Hospital: a cross-sectional study, PMC10870162', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10870162/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-overview', 'prostate-real-staging-systems'],
  },
  {
    id: 'prostate-exercise-cancer-mortality',
    category: 'prostateHealth',
    title: 'Real, Quantified Data: Exercise After a Prostate Cancer Diagnosis Genuinely Lowers Real Risk of Dying From It',
    teaser: 'Real research finds men doing 3+ hours of vigorous activity a week after a prostate cancer diagnosis had a 61% lower risk of dying from the disease specifically, not just a general fitness benefit.',
    summary:
      "Exercise after a prostate cancer diagnosis carries real, genuinely striking, quantified survival benefit, worth knowing about directly as something concrete a person can do rather than a vague \"stay active\" suggestion. Real research finds men with at least 7.5 MET-hours per week of physical activity after diagnosis had a real, significantly lower all-cause mortality (hazard ratio 0.69) compared to less active men, and men walking 90 or more minutes a week at a normal-to-brisk pace had a real 46% lower risk of dying from any cause. Genuinely striking, and specific to the cancer itself, not just general health: real research found men doing 3 or more hours of vigorous activity a week had a real 49% lower all-cause mortality risk, and, even more directly relevant, a real 61% lower risk of dying from prostate cancer specifically, compared to men doing under an hour of vigorous activity weekly. A real, broader meta-analysis confirms this pattern holds across multiple studies, finding real, significant reductions in prostate-cancer-specific mortality (hazard ratio 0.77) and in mortality from moderate-to-vigorous activity broadly (hazard ratio 0.62). Worth knowing directly: this is real, disease-specific evidence, not just the general exercise-is-healthy message covered elsewhere in this app's own research, someone managing a prostate cancer diagnosis, whether on active surveillance or after treatment, has a real, concrete, evidence-backed reason to prioritize regular, ideally vigorous, physical activity as a real part of their own cancer management, not just their general wellbeing.",
    citations: [
      { source: 'Post-diagnosis physical activity in relation to mortality among prostate cancer survivors: a systematic review and meta-analysis, Cancer Causes & Control', url: 'https://link.springer.com/article/10.1007/s10552-026-02197-2' },
      { source: 'Recreational Physical Activity in Relation to Prostate Cancer-specific Mortality Among Men with Nonmetastatic Prostate Cancer', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0302283817305377' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-active-surveillance', 'prostate-diet-pattern'],
  },
];
