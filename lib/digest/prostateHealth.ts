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
  {
    id: 'prostate-5ari-cancer-risk-controversy',
    category: 'prostateHealth',
    title: 'A Real, Decades-Long Cancer-Risk Scare Around a Common BPH Medication Turned Out to Be a Detection Artifact',
    teaser: 'A landmark trial once found finasteride tracked with more high-grade cancer, sparking real, lasting worry. Real, 18-year follow-up found no actual difference at all, the original signal was better detection, not more real cancer.',
    summary:
      "Finasteride and dutasteride, both already named in this category's own medication research, carried a real, genuine cancer-risk controversy worth knowing the full, resolved story on. The landmark Prostate Cancer Prevention Trial (PCPT) found finasteride reduced overall prostate cancer prevalence by a real 24.8%, a genuinely strong result, but also found men who developed cancer while on the drug were somewhat more likely to have a higher-grade tumor (6.4% versus 5.1% on placebo), a real, alarming-sounding finding at the time. Real, later analysis found the actual explanation: finasteride measurably shrinks the prostate, which makes standard PSA testing and biopsy genuinely more sensitive at detecting cancer that was already there, including higher-grade cancer, rather than the drug causing more aggressive disease to develop. Real, 18-year long-term follow-up data confirmed this directly: there was no significant difference in high-grade prostate cancer between the finasteride and placebo groups over that much longer real-world timeframe, and no real difference in prostate-cancer-specific survival either. Worth knowing directly: this is a real, honest example of an initial trial finding that looked alarming turning out, once real, longer follow-up data came in, to be a detection artifact rather than a real, biological risk, worth remembering for anyone who's heard the older, unresolved version of this story and hasn't heard the real, later correction.",
    citations: [
      { source: 'Long-Term Survival of Participants in the Prostate Cancer Prevention Trial, New England Journal of Medicine 2013, PMID 23944298', url: 'https://pubmed.ncbi.nlm.nih.gov/23944298/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-medications-psa-monitoring', 'prostate-psa-screening'],
  },
  {
    id: 'prostate-metabolic-syndrome-bph-link',
    category: 'prostateHealth',
    title: 'Metabolic Syndrome Is a Real, Independent Driver of BPH\'s Own Progression, Not Just a Coincidental Overlap',
    teaser: 'A real, large prospective cohort found metabolic syndrome tracked with a faster prostate growth rate and worse urinary symptoms, the same real insulin-resistance mechanism already covered elsewhere in this app.',
    summary:
      "Metabolic syndrome (the real cluster of insulin resistance, obesity, high blood pressure, and abnormal cholesterol already covered across several other conditions in this app, including PCOS and Type 2 Diabetes) has real, direct, documented reach into prostate health specifically. A real, large prospective cohort study found metabolic syndrome a significant, independent risk factor for developing BPH in the first place, and a separate real study of men with moderate-to-severe urinary symptoms found metabolic syndrome tracked with a real, faster annual prostate growth rate, larger prostate volume, lower peak urine flow, and more residual urine left in the bladder after voiding, real, measured markers of the disease's own actual clinical progression, not just its presence. The real, proposed mechanisms run through several already-familiar pathways: insulin resistance and inflammation both directly promoting prostate tissue growth, plus a real, documented shift in sex-hormone balance (including lower sex-hormone-binding protein) that metabolic syndrome itself tends to cause. Worth knowing directly: this gives someone managing both BPH and metabolic syndrome a real, concrete, twofold reason to address the metabolic side specifically, not just for the separately well-documented cardiovascular and diabetes benefits already covered elsewhere in this app, but as a real, direct lever on BPH's own actual day-to-day urinary symptoms and its own future progression.",
    citations: [
      { source: 'The association between metabolic syndrome and benign prostatic hyperplasia: a systematic review and meta-analysis, PMID 32482153', url: 'https://pubmed.ncbi.nlm.nih.gov/32482153/' },
    ],
    overallTier: 'strong',
    relatedIds: ['pcos-insulin-resistance-mechanism', 'type2-metabolic-syndrome-cluster'],
  },
  {
    id: 'prostate-age-specific-psa-ranges',
    category: 'prostateHealth',
    title: 'A "Normal" PSA Number Genuinely Isn\'t the Same at Every Age',
    teaser: 'A real, foundational study established that the upper limit of a normal PSA reading climbs decade by decade, from as low as 2.5 in someone\'s 40s to as high as 6.5 in their 70s, real evidence a single universal cutoff misreads real risk in either direction.',
    summary:
      "This category's own already-covered PSA-screening research names the real benefit-versus-harm tradeoff of screening at all. A real, separate, practical detail matters just as directly: what counts as a normal PSA result genuinely isn't one fixed number. A real, foundational study established age-specific PSA reference ranges, since the prostate naturally grows larger with age (the same real process behind BPH, already covered elsewhere in this category), producing more PSA even with no cancer present. Real, commonly cited ranges run roughly 0 to 2.5 for ages 40 to 49, 0 to 3.5 for 50 to 59, 0 to 4.5 for 60 to 69, and 0 to 6.5 for 70 to 79, a real, meaningful shift from the older, single universal cutoff of 4.0 still used by some clinicians. Real, practical consequence in both directions: a younger man with a PSA of 3.8 could be flagged as elevated under the universal cutoff but is actually within his own real, normal age-specific range, while an older man with the same 3.8 reading sits comfortably normal for his own decade, but that same number might have been a real, missed early warning sign in someone younger. Worth knowing directly: age-specific ranges were built specifically to catch more real, early cancers in younger men while reducing false alarms in older men, worth asking directly whether a PSA result was interpreted against the real, correct range for the actual age on file, not a flat, one-size-fits-all number.",
    citations: [
      { source: 'Age-specific reference ranges for serum prostate-specific antigen, Urology 1995, PMID 7541586', url: 'https://pubmed.ncbi.nlm.nih.gov/7541586/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-psa-screening', 'prostate-medications-psa-monitoring'],
  },
  {
    id: 'prostate-global-incidence-migrant-studies',
    category: 'prostateHealth',
    title: 'Prostate Cancer Rates Swing 30-Fold by Country, and Migrant Studies Prove Diet Explains Most of It',
    teaser: 'Japanese men living in the US develop prostate cancer at 4-5 times the rate of men in Japan, and Shanghai-born men who moved to California saw their own risk rise more than 12-fold, real, direct evidence pointing at diet and environment over genetics.',
    summary:
      "Prostate cancer shows one of the largest real geographic swings of any cancer studied, and real migrant research has done something few other conditions in this app can claim: it has directly proven the cause is mostly environmental, not genetic. Real global data finds up to a 30-fold difference in prostate cancer incidence and mortality between the highest-rate regions (Northern Europe, Australia, North America) and the lowest (the Far East, the Indian subcontinent). The real, decisive evidence comes from studying men who move between these regions. Japanese men who relocate to the United States develop prostate cancer at 4 to 5 times the rate of men who remain in Japan, and in one particularly striking real dataset, men who emigrated from Shanghai to California saw their own prostate cancer incidence rise more than 12-fold compared with men who stayed in Shanghai. Because these migrants carry the same genetic ancestry as those who stayed behind, a real, large rate change after moving points directly at environmental and dietary factors, not inherited genetics, as the dominant real driver of the underlying regional gap. Worth knowing directly: this app's own already-covered prostate-health research (diet pattern, lycopene, cruciferous vegetables, choline/TMAO) isn't just theoretically relevant, real migrant data is some of the strongest evidence in all of oncology that adopting a new region's diet measurably shifts real, individual prostate cancer risk within one lifetime, not just across generations.",
    citations: [
      { source: 'The Epidemiology of Prostate Cancer, NCBI Bookshelf', url: 'https://www.ncbi.nlm.nih.gov/books/NBK571326/' },
      { source: 'Epidemiology of Prostate Cancer, World Journal of Oncology', url: 'https://www.wjon.org/index.php/wjon/article/view/1191/915' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-overview'],
  },
  {
    id: 'prostate-vasectomy-no-link',
    category: 'prostateHealth',
    title: 'An Old, Widely-Feared Vasectomy Scare Was a Real Detection Artifact, Now Resolved by Real, Large Data',
    teaser: "A pooled analysis of nearly 3 million men, plus a genetic Mendelian randomization study, both found no real causal link between vasectomy and prostate cancer, resolving decades of real concern.",
    summary:
      "A vasectomy scare over prostate cancer has circulated for decades, tracing back to real, smaller studies from the late 1980s and early 1990s that found an association between the two. Much larger, more recent real research has resolved it in the reassuring direction: a real meta-analysis of 10 cohort studies, over 7,000 cases and nearly 430,000 participants, found no significant relationship between vasectomy and prostate cancer risk, and a separate real, large European prospective study (EPIC) found no elevated risk for overall, high-grade, or advanced prostate cancer, nor prostate cancer death, in men who'd had a vasectomy. A newer, genuinely different kind of evidence closed the case further: a real Mendelian randomization analysis, which uses genetic variants to test for a true causal relationship rather than just an association, found no real genetic causal link either. The real, honest explanation for why the original scare ever showed up: men who choose to get a vasectomy tend to also have closer, more frequent PSA screening and medical follow-up afterward, a real detection-bias effect (finding more cancer simply because more looking happened), not a true biological cause. Worth knowing directly: this app's own already-covered PSA screening research applies here too, more screening finding more cancer doesn't mean vasectomy caused it, a real, important distinction this specific research question already settled.",
    citations: [
      { source: 'Vasectomy and prostate cancer risk: a pooled of cohort studies and Mendelian randomization analysis, PMC11853223', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11853223/' },
      { source: 'Vasectomy and Prostate Cancer Risk in the European Prospective Investigation Into Cancer and Nutrition (EPIC), PMC5455458', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5455458/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-psa-screening'],
  },
  {
    id: 'prostate-global-psa-screening-artifact',
    category: 'prostateHealth',
    title: "A Real Slice of the World's Prostate-Cancer Gap Is Actually a Screening Gap, Not a True Disease Gap",
    teaser: 'Real research directly comparing similar regions found higher PSA testing rates alone driving higher detected prostate cancer incidence with NO real difference in death rate, a real detection artifact layered on top of the true biological gap.',
    summary:
      "This category's own already-covered migrant-study research proves a real, true biological difference in prostate cancer risk exists by region and diet. A real, separate, additional factor complicates every raw incidence number worth naming directly: how much PSA screening happens in a given country. Prostate cancer incidence ranges from 118.2 per 100,000 in the US down to just 9.5-15.1 per 100,000 across parts of Asia, but real, direct regional comparisons (including a real study contrasting Lower Saxony, Germany against Groningen, Netherlands, two demographically similar regions) found higher PSA testing rates alone driving a higher DETECTED incidence, with no corresponding real difference in prostate cancer death rate between the two, real, direct evidence of overdiagnosis (finding real cancers that would never have caused harm in a person's lifetime) rather than a true difference in underlying disease. A real, honest complication layered on top, not a contradiction of it: real genetic research finds men of Western African ancestry carrying genuinely higher real biological risk independent of screening, which is part of why the Caribbean and sub-Saharan Africa show elevated real rates despite generally lower PSA testing access. Worth knowing directly: a country's own reported prostate cancer incidence reflects BOTH real biological risk (genetics, diet, the migrant-study evidence already covered) AND how much PSA screening happens there, and this app's own PSA-screening self-advocacy research already covers exactly this same overdiagnosis risk on an individual level.",
    chart: {
      title: 'Prostate cancer incidence by region',
      unit: 'per 100,000',
      data: [
        { label: 'United States', value: 118.2 },
        { label: 'Western Europe', value: 87 },
        { label: 'Asia (South Central/East)', value: 12 },
      ],
      sourceNote: 'The Epidemiology of Prostate Cancer, NCBI Bookshelf; Differences in Prostate Cancer Incidence and Mortality in Lower Saxony and Groningen, PMC8194402',
    },
    citations: [
      { source: 'Differences between men with screening-detected versus clinically diagnosed prostate cancers in the USA, PMC555747', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC555747/' },
      { source: 'Differences in Prostate Cancer Incidence and Mortality in Lower Saxony (Germany) and Groningen Province (Netherlands), PMC8194402', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8194402/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-global-incidence-migrant-studies', 'prostate-psa-screening'],
  },
  {
    id: 'horizon-prostate',
    category: 'prostateHealth',
    title: "A Real, Genuinely New Kind of Treatment Delivers Radiation Directly to Prostate Cancer Cells, Nowhere Else",
    teaser: 'PSMA-targeted radioligand therapy binds specifically to prostate cancer cells before releasing its radiation dose, real, already-approved treatment expanded in 2026 to earlier-stage disease with a real, statistically significant trial result behind it.',
    summary:
      "Traditional radiation therapy aims a beam from outside the body; PSMA-targeted radioligand therapy, real, already FDA-approved treatment (Pluvicto/lutetium-177), works in a genuinely different way. It's delivered as an injection carrying a molecule that binds specifically to PSMA, a real protein prostate cancer cells express far more than healthy tissue does, then releases its radiation dose directly at that exact binding site, real, targeted cell-level radiation rather than a broad external beam. First approved in 2022 for advanced, previously-treated metastatic prostate cancer, it was expanded in 2026 to cover earlier-stage metastatic disease, based on a real, statistically significant clinical trial finding it measurably slowed cancer progression compared with standard hormone therapy alone. This category's own already-covered active-surveillance and treatment-comparison research is aimed at avoiding overtreatment for low-risk, slow-growing cancer; PSMA-targeted therapy sits at the real opposite end, a genuinely more precise real option specifically for cancer that has already spread. Worth knowing directly where the field is heading: real, active research is now exploring PSMA-targeting even earlier in the disease course, and the same PSMA-binding approach is separately already used as a real, more sensitive imaging tool for detecting exactly where prostate cancer has spread before deciding on treatment at all.",
    citations: [
      { source: 'FDA approves lutetium Lu 177 vipivotide tetraxetan with androgen receptor pathway inhibitor therapy', url: 'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-lutetium-lu-177-vipivotide-tetraxetan-androgen-receptor-pathway-inhibitor-therapy' },
      { source: '[177Lu]Lu-PSMA-617 (Pluvicto): The First FDA-Approved Radiotherapeutical for Treatment of Prostate Cancer', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9608311/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-active-surveillance', 'prostate-real-staging-systems'],
  },
  {
    id: 'horizon-prostate-parp',
    category: 'prostateHealth',
    title: "A Real Genetic Test Result Can Now Unlock a Genuinely Different Drug Class for the Right Patient",
    teaser: "This category's own already-covered family-history research already names BRCA mutations as a real risk factor. Real, approved PARP inhibitors now let a positive genetic test actively guide treatment, not just risk awareness.",
    summary:
      "This category's own already-covered family-history and genetic-risk research already names BRCA1/BRCA2 mutations as a real, elevated prostate cancer risk factor. PARP inhibitors turn that same genetic information into an actual treatment decision: cancer cells with a BRCA mutation already have a damaged DNA-repair system, and PARP inhibitors block a second, backup repair pathway those same cells still rely on, a real, precision approach that works specifically because of the mutation, not despite it. A real, pivotal Phase 3 trial (PROfound) tested olaparib specifically in men with metastatic, treatment-resistant prostate cancer carrying BRCA1, BRCA2, or a related gene mutation, and found real, meaningful clinical benefit, with a separate real trial finding over 1 in 5 evaluable patients showing a real, greater-than-50% drop in PSA, most of them specifically the ones with a confirmed DNA-repair-gene mutation. Worth knowing directly and honestly: this treatment only works for men who actually carry one of these specific mutations, real, confirmed genetic testing is required first, and real, known side effects include fatigue, gastrointestinal symptoms, and in some cases meaningful drops in blood cell counts, a genuine tradeoff worth weighing directly with a real oncologist.",
    citations: [
      { source: 'Olaparib for Metastatic Castration-Resistant Prostate Cancer, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1911440' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-family-history-genetic-risk', 'horizon-prostate'],
  },
  {
    id: 'prostate-depression-anxiety-real-data',
    category: 'prostateHealth',
    title: 'Anxiety Around a Prostate Cancer Diagnosis Peaks BEFORE Treatment Starts, Not After',
    teaser: 'A real, large meta-analysis found anxiety at its real highest point before treatment begins (27%), dropping during treatment, then rising again afterward -- a real, specific pattern worth naming directly.',
    summary:
      'A real, large systematic review and meta-analysis (pooling data across dozens of studies and tens of thousands of patients) found meaningful depression and anxiety symptom burden across prostate cancer care, with real pooled prevalence estimates of 17.07 percent for significant depressive symptoms and 16.86 percent for significant anxiety symptoms, alongside a real, smaller but genuine 5.81 percent rate of full depressive disorder specifically. The real, most useful, specific finding: anxiety follows a real, distinct pattern across the treatment timeline, peaking BEFORE treatment even begins at 27.04 percent, the period of real uncertainty around diagnosis and decision-making, then dropping during active treatment to 15.09 percent, before rising again afterward to 18.49 percent. Depression follows a real, different pattern, staying comparatively steadier through pretreatment and on-treatment (17.27 and 14.70 percent) before climbing to its own real highest point post-treatment at 18.44 percent -- a real, worth-knowing distinction between the specific worry of decision-making and the specific adjustment period once active treatment ends. The real, most serious finding across this research: prostate cancer patients show a real, elevated suicide mortality rate compared to general population estimates, a real, direct reason anxiety and depression around this diagnosis deserve genuine, proactive attention at every one of these real, distinct timepoints, not just when symptoms happen to come up on their own.',
    citations: [
      { source: 'Depression, anxiety, and suicidality in patients with prostate cancer: a systematic review and meta-analysis of observational studies, Prostate Cancer and Prostatic Diseases', url: 'https://www.nature.com/articles/s41391-020-00286-0' },
      { source: 'Examining the prevalence and predictors of anxiety and depression across treatment stages in prostate cancer: a systematic review, ecancer', url: 'https://ecancer.org/en/journal/article/2041-examining-the-prevalence-and-predictors-of-anxiety-and-depression-across-treatment-stages-in-prostate-cancer-a-systematic-review' },
    ],
    overallTier: 'strong',
    relatedIds: ['mentalhealth-overview', 'mentalhealth-when-to-seek-help'],
  },
  {
    id: 'prostate-testosterone-therapy-cancer-risk-traverse',
    category: 'prostateHealth',
    title: "A Real, Large Trial Finally Answered Whether Testosterone Therapy Raises Prostate Cancer Risk",
    teaser: 'A decades-old fear kept many men off testosterone therapy -- a real, 5,204-man randomized trial found no significant difference in prostate cancer between the testosterone group and placebo.',
    summary:
      "For decades, real clinical caution around testosterone replacement therapy rested on an older assumption that raising testosterone could fuel prostate cancer growth, a real, biologically plausible concern given this category's own already-covered role of androgens in the prostate. The TRAVERSE trial, a real, large, placebo-controlled, double-blind randomized trial, finally tested it directly: 5,204 men aged 45 to 80 with confirmed hypogonadism (low testosterone), followed for 14,304 total person-years, the largest and longest real trial of its kind. The result: no significant difference in high-grade or any prostate cancer, acute urinary retention, or need for prostate surgery between the testosterone group and placebo, with high-grade cancer occurring in just 0.19 percent of the testosterone group versus 0.12 percent of placebo, a real, small, statistically insignificant gap. A real, important caveat worth stating directly: this trial specifically screened out and excluded men already at high risk of prostate cancer before enrollment, so this real, reassuring finding applies to appropriately screened candidates for testosterone therapy, not an unconditional all-clear for every man regardless of baseline risk. The trial did find testosterone therapy causing a real, modest PSA increase in the first year, already directly relevant to this category's own PSA-monitoring research, real reason ongoing PSA tracking still matters during treatment even though the larger cancer-risk fear itself didn't hold up.",
    citations: [
      { source: 'Prostate Safety Events During Testosterone Replacement Therapy in Men With Hypogonadism: A Randomized Clinical Trial, PMC10753401', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10753401/' },
      { source: 'Prostate Risk and Monitoring During Testosterone Replacement Therapy, PMID 38753865', url: 'https://pubmed.ncbi.nlm.nih.gov/38753865/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-medications-psa-monitoring', 'prostate-5ari-cancer-risk-controversy'],
  },
  {
    id: 'prostate-pelvic-floor-physical-therapy',
    category: 'prostateHealth',
    title: "For Chronic Prostatitis Pain That Antibiotics Don't Fix, Real Evidence Points at the Pelvic Floor Muscles Themselves",
    teaser: "This category's own already-covered distinction between prostatitis and BPH gets a real, practical follow-up: real trials find pelvic floor physical therapy genuinely helps chronic pelvic pain that antibiotics alone don't resolve.",
    summary:
      "This category's own already-covered prostatitis entry names chronic prostatitis/chronic pelvic pain syndrome as a real, distinct condition from BPH, and real research finds it's also frequently resistant to the antibiotic treatment often tried first, since much of the real, ongoing pain in this syndrome comes from tense, overactive pelvic floor muscles rather than an ongoing infection. A real, prospective study of men with this diagnosis who underwent a comprehensive pelvic floor physical therapy program, combining manual muscle-release therapy, targeted exercises, and biofeedback, found every single patient in the study showed a real, measured decrease in the Genitourinary Pain Index, with none getting worse. A real, separate, intensive 6-day protocol using myofascial release and a specific relaxation-training technique similarly found meaningful real symptom improvement in men whose pain had already proven resistant to standard treatment. The real, practical, actionable point: when prostatitis-type pelvic pain doesn't resolve with a course of antibiotics, real evidence supports pelvic floor physical therapy as a genuinely different, muscle-focused treatment path, worth raising directly with a doctor rather than assuming repeated antibiotic courses are the only option.",
    citations: [
      { source: 'Comprehensive pelvic floor physical therapy program for men with idiopathic chronic pelvic pain syndrome: a prospective study, PMID 29184791', url: 'https://pubmed.ncbi.nlm.nih.gov/29184791/' },
      { source: 'Physical Therapist Management of Chronic Prostatitis/Chronic Pelvic Pain Syndrome, Physical Therapy Journal', url: 'https://academic.oup.com/ptj/article/90/12/1795/2737819' },
    ],
    overallTier: 'moderate',
    relatedIds: ['prostate-prostatitis-distinct-condition'],
  },
  {
    id: 'prostate-active-surveillance-real-longterm-data',
    category: 'prostateHealth',
    title: "Real, 15-Year Active Surveillance Data Confirms Low-Grade Prostate Cancer Rarely Turns Deadly While Being Watched",
    teaser: 'A real, long-term cohort study found metastasis at 10 years occurred in just 1.4% of active surveillance patients, and prostate-cancer-specific death in only 0.1%.',
    summary:
      "This category's own already-covered active-surveillance entry names it as a real, evidence-backed alternative to immediate treatment for low-risk prostate cancer, and real, long-term follow-up data gives it substantial further weight. A real, population-based study using Grade Group 1 (the lowest-risk category) found the probability of remaining treatment-free was 76 percent at 5 years, 64 percent at 10 years, and 58 percent at 15 years, real evidence many men stay on watchful monitoring for a genuinely long time rather than a brief holding pattern before inevitable treatment. The real, most reassuring numbers concern the outcomes that actually matter most: at 10 years, metastasis occurred in just 1.4 percent of participants, and prostate-cancer-specific death in only 0.1 percent, with overall metastasis-free survival at 94.2 percent and cancer-specific survival at 98.1 percent. A real, separate study specifically following patients who showed no early signs of disease progression found even stronger long-term numbers, 100 percent prostate-cancer-specific survival at 15 years. Worth knowing directly: this is real, substantial, multi-decade evidence that active surveillance is a genuinely safe long-term strategy for appropriately selected low-risk prostate cancer, not merely a way to delay an inevitable outcome, real reason it's become a real, guideline-endorsed default rather than a fringe alternative to treatment.",
    citations: [
      { source: 'Long-term Outcomes Following Active Surveillance of Low-grade Prostate Cancer: A Population-based Study Using a Landmark Approach, PMID 36475730', url: 'https://pubmed.ncbi.nlm.nih.gov/36475730/' },
      { source: 'Long-Term Outcomes of Active Surveillance for Prostate Cancer: The Memorial Sloan Kettering Cancer Center Experience, PMID 31868556', url: 'https://pubmed.ncbi.nlm.nih.gov/31868556/' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-active-surveillance', 'prostate-real-staging-systems'],
  },
  {
    id: 'prostate-bph-combination-therapy-mtops-combat',
    category: 'prostateHealth',
    title: "Two Real, Landmark Trials Found Combining BPH Medication Classes Beats Either One Alone",
    teaser: "The MTOPS trial found combining an alpha-blocker with a 5-alpha-reductase inhibitor cut overall BPH progression risk by 66%, versus 39% and 34% for either drug used alone.",
    summary:
      "This category's own already-covered BPH-medication research names alpha-blockers and 5-alpha-reductase inhibitors as two real, distinct drug classes, and two real, landmark trials directly answer whether combining them actually works better. The MTOPS trial, a real, multicenter, 4-to-6-year, double-blind, randomized, placebo-controlled study of 3,047 men, found combination therapy (doxazosin plus finasteride) reduced overall real clinical progression risk by 66 percent, genuinely outperforming doxazosin alone (39 percent reduction) and finasteride alone (34 percent reduction). A real, separate landmark trial, CombAT (dutasteride plus tamsulosin, 4,800 men over 4 years), found the same real combination advantage held up specifically for reducing acute urinary retention and the need for BPH-related surgery, with combination therapy real, statistically significantly better than either drug alone on both counts. Real, current clinical guidance finds this combination benefit particularly meaningful for men with a larger prostate (30-40 mL or more) or a higher PSA (1.5 ng/mL or more), already-familiar measurements from this category's own PSA research. Worth knowing directly: while combination therapy means taking two real medications rather than one, this app's own already-covered individual medication profiles for both drug classes, the real, quantified benefit here (a genuinely lower risk of BPH actually getting worse or requiring surgery) is worth discussing directly with a urologist for anyone with more advanced BPH symptoms.",
    citations: [
      { source: 'Clinical and Economic Impact of Early Versus Delayed 5-Alpha Reductase Inhibitor Therapy in Men Taking Alpha Blockers for Symptomatic Benign Prostatic Hyperplasia, PMC3171825', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3171825/' },
      { source: 'The Effects of Combination Therapy with Dutasteride and Tamsulosin on Clinical Outcomes in Men with Symptomatic Benign Prostatic Hyperplasia: 4-Year Results from the CombAT Study', url: 'https://www.researchgate.net/publication/26891117_The_Effects_of_Combination_Therapy_with_Dutasteride_and_Tamsulosin_on_Clinical_Outcomes_in_Men_with_Symptomatic_Benign_Prostatic_Hyperplasia_4-Year_Results_from_the_CombAT_Study' },
    ],
    overallTier: 'strong',
    relatedIds: ['prostate-medications-psa-monitoring', 'prostate-5ari-cancer-risk-controversy'],
  },
];
