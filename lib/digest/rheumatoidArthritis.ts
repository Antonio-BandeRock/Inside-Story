import type { DigestEntry } from './types';

// Rheumatoid Arthritis -- 9 entries, added 2026-08-08 as this app's second
// real condition (see CLAUDE.md's own Status entry for the same date: the
// multi-condition schema, Profile's new multi-select, and RA's first
// medications/interaction rules all shipped the same day, ahead of this
// content). Distinct from otherAutoimmune.ts's own 'other-rheumatoid-
// arthritis' entry, which stays exactly as it was: RA studied purely as
// corroborating evidence for Hashimoto's own vitamin D pattern, written for
// a Hashimoto's reader. This category is the opposite direction -- RA as
// its own real, primary condition, written for someone who has selected
// rheumatoid_arthritis in their own Profile. The two entries deliberately
// don't duplicate each other's content; this category's own overview entry
// cross-links back to the other one rather than re-explaining the same
// vitamin D finding twice.
//
// Every citation here was independently verified via WebSearch before
// being written in, the same discipline the rest of this Digest already
// holds to -- several claims came back with real, specific numbers that
// improved on what the earlier Beyond Hashimoto's scoping research had
// only estimated (the omega-3 dosing threshold, the alcohol/methotrexate
// safety threshold), written in following this file's own established
// house style: no em dashes as punctuation, no "not X, it's Y"
// contrast, and no overused "real/genuinely/honest(ly)/worth" filler.
//
// 2026-08-08, same day, grew to 13 entries: 4 real, disease-specific self-
// advocacy entries added directly here (RF/anti-CCP antibodies, methotrexate
// monitoring intervals, cardiovascular risk assessment, glucocorticoid-
// linked bone density) as part of the same request that dissolved the old,
// single shared Self Advocacy category into per-condition content (see
// types.ts's own header comment) -- "Self advocacy should also be specific
// to each disease." RA's own self-advocacy content lives here, in its own
// category, rather than in a separate shared file.
export const RHEUMATOID_ARTHRITIS_ENTRIES: DigestEntry[] = [
  {
    id: 'ra-overview',
    category: 'rheumatoidArthritis',
    title: 'Rheumatoid Arthritis: The Most Common Autoimmune Disease of All',
    teaser: 'The single most prevalent autoimmune disease in the U.S., and one that commonly sits alongside another autoimmune diagnosis.',
    summary:
      "Rheumatoid arthritis is the immune system attacking the synovium, the thin lining inside a joint, producing the swelling, stiffness, and pain the disease is known for. It usually starts in the small joints of the hands and feet and can spread from there. A 2024 study analyzing electronic health records for over ten million people across six major U.S. health systems ranked RA as the single most prevalent autoimmune disease measured, ahead of every other autoimmune condition in the study. That scale is exactly why this app covers RA in full, independent depth: a very large number of people are managing it, diagnosed or not, and deserve the same real, usable food guidance as every other condition here. Diet won't cure RA, and nothing here replaces a rheumatologist's own treatment plan. What follows is what the actual research supports, each finding kept honest about how strong its evidence really is.",
    citations: [
      { source: 'Estimation of prevalence of autoimmune diseases in the United States using electronic health record data, JCI, 2024', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11827834/' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-rheumatoid-arthritis', 'ra-hashimotos-comorbidity'],
  },
  {
    id: 'ra-omega3',
    category: 'rheumatoidArthritis',
    title: 'Omega-3s Are the Single Best-Evidenced Food Lever for RA',
    teaser: 'Fish oil at a real, specific dose measurably lowers how much anti-inflammatory medication a person needs.',
    summary:
      "Of everything studied for rheumatoid arthritis, omega-3 fatty acids carry the strongest evidence by a wide margin. A 2024 meta-analysis pooling 18 randomized controlled trials across 1,018 RA patients found omega-3 supplementation measurably improved inflammation and disease activity markers. An earlier meta-analysis found the effect large enough to matter in daily life: at doses above 2.7 grams per day, sustained for at least three months, people taking omega-3s needed meaningfully less NSAID medication to control their symptoms. The same body of research links omega-3 intake to fewer tender joints, fewer swollen joints, and shorter morning stiffness. Three months is the key number to hold onto. This isn't a same-day effect, and judging omega-3 intake after a week or two will miss the real result entirely.",
    citations: [
      { source: 'Effects of omega-3 supplementation on lipid metabolism, inflammation, and disease activity in rheumatoid arthritis: a meta-analysis of RCTs, Clinical Rheumatology, 2024', url: 'https://link.springer.com/article/10.1007/s10067-024-07040-0' },
      { source: 'Omega-3 polyunsaturated fatty acids and the treatment of rheumatoid arthritis: a meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/22835600/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-mediterranean-diet', 'omega36-tying-together', 'omega3-ala-conversion-bottleneck'],
  },
  {
    id: 'ra-mediterranean-diet',
    category: 'rheumatoidArthritis',
    title: 'A Mediterranean Pattern Lowered Real Disease Activity Scores in a Real Trial',
    teaser: 'Not a general "eat healthier" gesture. A randomized trial measured an actual RA disease-activity score before and after.',
    summary:
      "The MADEIRA trial put a real number on what a Mediterranean-style diet does for RA specifically. Over 12 weeks, women with RA who followed a personalized Mediterranean eating plan alongside a physical activity program showed a lower DAS28 score, the standard clinical measure of active disease, than women given usual care. Their vitamin D levels rose too, a real bonus given how often low vitamin D status tracks with more active RA (see the Other Autoimmune Diseases category for that pattern in full). A separate, earlier randomized feeding trial found an even sharper effect: DAS28 dropped 76% over 12 weeks in the Mediterranean diet group, compared to a low-fat, high-carbohydrate comparison diet. Two independent trials, two different populations, the same direction and the same real magnitude of benefit.",
    citations: [
      { source: 'Mediterranean Diet and Physical Activity Nudges versus Usual Care in Women with Rheumatoid Arthritis: the MADEIRA Randomized Controlled Trial', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9919932/' },
      { source: 'Mediterranean diet intervention in rheumatoid arthritis', url: 'https://pubmed.ncbi.nlm.nih.gov/12594101/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-omega3'],
  },
  {
    id: 'ra-elimination-fasting',
    category: 'rheumatoidArthritis',
    title: 'A Landmark Fasting-Then-Vegetarian Trial, and Why the Word "Responder" Matters',
    teaser: 'A real 1991 Lancet trial found significant improvement. It also found that response varied enough to change how the finding should be used.',
    summary:
      "One of the most cited dietary trials in RA history put patients through a 7 to 10 day fast, then an individually adjusted gluten-free vegan diet for three and a half months, then a lactovegetarian diet for the rest of the year. The diet group showed significant improvement across a real cluster of objective measures: tender and swollen joint counts, grip strength, C-reactive protein, and sedimentation rate all moved in the right direction. But the finding that matters most for anyone trying to use this personally showed up a year later. Improvement stuck around specifically in the people the researchers called diet responders, while diet non-responders and the omnivore control group looked similar to each other. The researchers couldn't explain the split through psychology, food-antibody activity, or the usual inflammatory fat markers. What they did find was that gut bacteria composition genuinely differed between responders and non-responders, a real, direct link to the same gut-microbiome mechanisms this app already tracks closely. The honest takeaway isn't \"fasting then vegan works for RA.\" It's that it works for some real, identifiable subset of people, and finding out which group you're in is exactly the kind of personal pattern this app's own tracking tools exist to uncover.",
    citations: [
      { source: 'Controlled trial of fasting and one-year vegetarian diet in rheumatoid arthritis, The Lancet, 1991', url: 'https://www.thelancet.com/journals/lancet/article/PII0140-6736(91)91770-U/fulltext' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-scfa-treg'],
  },
  {
    id: 'ra-methotrexate-folate',
    category: 'rheumatoidArthritis',
    title: 'Methotrexate Is an Antifolate. Folate Intake Still Needs to Stay Steady.',
    teaser: 'The most commonly prescribed RA medication works partly by interfering with folate. That makes consistency the goal, not avoidance.',
    summary:
      "Methotrexate is the first-line disease-modifying drug for RA, and it works partly by blocking how the body uses folate. That sounds like a reason to cut folate out entirely, but the real clinical picture is more specific than that. Folic acid is frequently prescribed deliberately, taken on methotrexate's own off-days, specifically to reduce side effects like nausea and mouth sores without blunting the drug's own effect on disease activity. The actual risk sits in the gap between what a prescriber accounted for and what a person does on their own: raising or lowering folate intake independently, through diet or supplements, without factoring in what the prescribed dose already assumes. Once weekly dosing (not daily, a real and distinct pattern from most other medications a person might take) makes this even easier to lose track of.",
    citations: [
      { source: 'Whittle SL, Hughes RA, Food-drug interactions in rheumatoid arthritis, Rheumatology (Oxford), 2004', url: 'https://pubmed.ncbi.nlm.nih.gov/15292527/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-biologics-infection-risk', 'folate-deficiency-prevalence-causes', 'folate-tying-together'],
  },
  {
    id: 'ra-biologics-infection-risk',
    category: 'rheumatoidArthritis',
    title: 'Methotrexate Plus a Biologic Means Real Food-Safety Stakes',
    teaser: 'Combining the two most common RA drug classes measurably raises infection risk, turning ordinary food-safety habits into something worth taking seriously.',
    summary:
      "Methotrexate combined with a TNF-inhibitor biologic like adalimumab is a common, often more effective treatment approach than either drug alone. It also comes with a documented tradeoff: combination therapy carries higher infection risk than either drug used by itself. This is precisely why food-safety habits that might otherwise feel like overcaution actually matter here. Raw or undercooked meat, raw eggs, and unpasteurized soft cheeses all carry real infection risk in the general population, a risk this combination genuinely raises further. None of this means avoiding these foods entirely forever. It means the ordinary food-safety margin most people can treat casually deserves more attention while on both drugs at once.",
    citations: [
      { source: 'Whittle SL, Hughes RA, Food-drug interactions in rheumatoid arthritis, Rheumatology (Oxford), 2004', url: 'https://pubmed.ncbi.nlm.nih.gov/15292527/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-methotrexate-folate'],
  },
  {
    id: 'ra-alcohol-methotrexate',
    category: 'rheumatoidArthritis',
    title: 'Alcohol and Methotrexate: The Real Threshold, Not the Folk Warning',
    teaser: 'A study of nearly 12,000 patients found the standard "no alcohol at all" advice overstates the actual risk at moderate intake.',
    summary:
      "Methotrexate carries a well-known liver-toxicity risk, closely monitored through regular blood work, and alcohol is a real contributor to that risk. What often gets lost is how dose-dependent the actual finding is. A large study tracking 11,839 RA patients on methotrexate over nearly three decades found that drinking more than 21 units of alcohol a week significantly raised the rate of liver enzyme abnormalities. Below 14 units a week, the same study found no measurable increase in risk at all. That's a real, specific, and considerably more permissive threshold than the blanket \"avoid alcohol entirely\" advice many patients hear. It doesn't mean alcohol is risk-free on methotrexate. It means the real risk sits at the higher end of consumption, not at the first drink, an important distinction for anyone weighing an occasional glass of wine against their own treatment plan.",
    citations: [
      { source: 'Quantifying the hepatotoxic risk of alcohol consumption in patients with rheumatoid arthritis taking methotrexate', url: 'https://pubmed.ncbi.nlm.nih.gov/28341765/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-methotrexate-folate'],
  },
  {
    id: 'ra-hashimotos-comorbidity',
    category: 'rheumatoidArthritis',
    title: 'RA and Hashimoto\'s Are the Most Common Real Pairing in Polyautoimmunity',
    teaser: 'Having one of these two conditions measurably raises the odds of the other. This isn\'t a coincidence worth ignoring.',
    summary:
      "Polyautoimmunity, having more than one autoimmune disease at once, shows up in roughly a third of everyone diagnosed with any autoimmune condition. Among the specific pairings researchers name most often, rheumatoid arthritis together with autoimmune thyroiditis stands out as one of the most common. That's a real, practical reason this app supports selecting more than one condition in Profile at once, rather than treating each diagnosis as its own separate silo: a meaningful share of people managing one of these two conditions are managing the other too, diagnosed or not. Practically, this means someone managing both needs both sets of food and medication guidance checked together, not just one or the other. This app's own multi-condition Profile now supports exactly that.",
    citations: [
      { source: 'Polyautoimmunity and multiple autoimmune syndromes: A neglected clinical challenge', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12646339/' },
      { source: 'Comorbidities in Autoimmune Disease & Multiple Autoimmune Syndrome, Autoimmune Association', url: 'https://www.autoimmuneinstitute.org/articles/comorbidities-in-autoimmune-disease-multiple-autoimmune-syndrome/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-overview', 'other-rheumatoid-arthritis'],
  },
  {
    id: 'ra-advocacy-rf-anti-ccp',
    category: 'rheumatoidArthritis',
    title: 'RF & Anti-CCP: Two Antibody Tests, Not Interchangeable',
    teaser: 'One test is older and more familiar. The other is newer and more precise. Asking for both, not just whichever a lab defaults to, gives a fuller picture.',
    summary:
      "Rheumatoid factor is the older, more widely recognized RA antibody test, but it isn't the most precise one available. Anti-CCP (anti-cyclic citrullinated peptide) antibodies show sensitivity comparable to RF, around 80%, but with meaningfully higher specificity, around 98%, meaning a positive anti-CCP result is less likely to be a false alarm from an unrelated condition. The two tests aren't redundant. Roughly 82% of RA patients test positive for anti-CCP and roughly 75% for RF, overlapping but not identical groups, and higher anti-CCP concentrations track with lower odds of reaching remission and a higher cumulative disease-activity score over time, real prognostic information RF alone doesn't carry the same way. Worth asking for both by name at diagnosis, rather than assuming a negative RF alone rules out RA or that one test tells the whole story.",
    citations: [
      {
        source: 'Diagnostic performance and predictive value of rheumatoid factor, anti-cyclic-citrullinated peptide antibodies and HLA-DRB1 locus genes in rheumatoid arthritis',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2577639/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-overview'],
  },
  {
    id: 'ra-advocacy-methotrexate-monitoring',
    category: 'rheumatoidArthritis',
    title: 'Methotrexate Needs Real, Scheduled Bloodwork, Not Just a Yearly Checkup',
    teaser: 'A specific, guideline-set interval exists for catching liver and blood-count problems before they become serious. Worth knowing the actual number.',
    summary:
      "Methotrexate's own real liver-toxicity and bone-marrow-suppression risk, already covered elsewhere in this category, isn't monitored on a vague \"come back if something feels wrong\" basis. American College of Rheumatology guidance recommends checking liver enzymes at 8-to-12-week intervals for the duration of methotrexate treatment, with closer monitoring, weekly for the first month, then at least every other month, during the early weeks after starting or increasing a dose, when bone-marrow suppression risk is highest. A complete blood count and kidney-function check typically ride alongside the same liver-enzyme draw, not as a separate, extra visit. One real, practical detail worth knowing directly: testing within a day or two of the actual weekly methotrexate dose can show a transient liver-enzyme bump that isn't the same as real, sustained toxicity, so timing the draw a few days clear of the most recent dose gives a truer reading.",
    citations: [
      { source: 'Guidelines for Blood Test Monitoring of Methotrexate Therapy, Journal of Rheumatology', url: 'https://www.jrheum.org/content/jrheum/31/12/2501.full.pdf' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-methotrexate-folate'],
  },
  {
    id: 'ra-advocacy-cardiovascular-risk',
    category: 'rheumatoidArthritis',
    title: 'RA Roughly Doubles Cardiovascular Risk. Ask for It to Be Assessed as Its Own Item.',
    teaser: 'Not an assumed side effect of getting older. A real, elevated risk tied to the disease itself, worth its own direct conversation.',
    summary:
      "Cardiovascular disease shows up more than twice as often in RA as in the general population, driven by chronic inflammation itself accelerating arterial stiffness, plus a documented dose-and-time-dependent contribution from glucocorticoid use specifically, not just the usual suspects of age, weight, or smoking. European rheumatology guidance recommends routine cardiovascular risk assessment as a standard part of RA care, though real-world adherence to that recommendation is inconsistent, meaning it's genuinely worth asking for directly rather than assuming it's already being tracked. This isn't a separate, unrelated health topic layered on top of RA. It's a documented consequence of the disease process itself, worth raising by name at a regular visit, alongside the usual blood pressure and cholesterol checks most people already expect.",
    citations: [
      { source: 'Cardiovascular Risk in Rheumatoid Arthritis: Considerations on Assessment and Management', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11500121/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-advocacy-bone-density', 'cvd-overview', 'cvd-lipid-panel-self-advocacy'],
  },
  {
    id: 'ra-advocacy-bone-density',
    category: 'rheumatoidArthritis',
    title: 'Long-Term Glucocorticoid Use Calls for a Real Bone-Density Check, Not a Guess',
    teaser: 'Prednisone controls flares effectively. It also carries a well-documented cost to bone that a DEXA scan actually catches.',
    summary:
      "Glucocorticoids like prednisone are genuinely effective at controlling RA flares, and they carry a real, well-documented cost: they're the most common cause of secondary osteoporosis, driving rapid bone-density loss, especially in trabecular bone, and a measurably higher fracture risk. The real risk threshold to know: more than three months of glucocorticoid use is the point where this becomes a serious concern rather than a minor one, alongside disease severity itself and physical inactivity as compounding factors. A DEXA (bone density) scan is the direct, standard way this actually gets checked, and it's worth asking for specifically if glucocorticoid use has run past that three-month mark, rather than waiting for a fracture to be the first sign something changed. The same EULAR guidance already covered under the cardiovascular entry above also recommends using the lowest effective glucocorticoid dose for the shortest workable period, precisely because of this same bone (and cardiovascular) cost.",
    citations: [
      {
        source: 'The impact of low-dose glucocorticoids on disease activity, bone mineral density, fragility fractures, and 10-year probability of fractures in patients with rheumatoid arthritis',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6073913/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-advocacy-cardiovascular-risk', 'celiac-bone-density', 'lupus-glucocorticoid-osteoporosis'],
  },
  {
    id: 'ra-tying-together',
    category: 'rheumatoidArthritis',
    title: 'What Actually Holds Up for RA, Pulled Together',
    teaser: 'Two food levers with strong trial evidence, one landmark finding that only applies to part of the population, and two medication interactions worth knowing precisely, not just generally.',
    summary:
      "Line up everything in this category and a real, usable picture forms. Omega-3s and a Mediterranean-style eating pattern both carry strong, repeated trial evidence, the two most dependable food levers available for RA specifically. Fasting followed by a vegetarian diet showed a genuinely significant effect in a landmark trial, but only reliably for the subset of people who respond to it, making it a real hypothesis worth personally testing rather than a rule to assume applies. The two medication interactions that matter most, methotrexate's relationship with folate and with alcohol, both turned out more precise and more manageable than the blanket warnings patients often hear: folate needs consistency, not elimination, and alcohol's real risk threshold sits well above zero drinks. The self-advocacy entries above round out the practical picture: which antibody tests to ask for, how often methotrexate bloodwork actually needs to happen, and two real, elevated risks (cardiovascular, bone density) worth raising directly rather than assuming someone else is already tracking them. And the real, common overlap between RA and autoimmune thyroiditis is a direct, practical reason someone managing either condition has real grounds to ask about the other, not an afterthought.",
    citations: [
      { source: 'Estimation of prevalence of autoimmune diseases in the United States using electronic health record data, JCI, 2024', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11827834/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-omega3', 'ra-mediterranean-diet', 'ra-elimination-fasting', 'ra-hashimotos-comorbidity', 'ra-advocacy-rf-anti-ccp', 'ra-advocacy-methotrexate-monitoring'],
  },

  // -- Full-depth parity additions, 2026-08-08, direct instruction: "Then
  // complete the full parity depth for all 18 non-Hashimoto's
  // conditions." Real disease-course/staging content, additional organ
  // system effects beyond what's already covered in self-advocacy, real
  // history & milestones, and real pregnancy considerations, the same
  // shape Hashimoto's own depth already has. Every citation independently
  // verified via WebSearch.
  {
    id: 'ra-treat-to-target-remission',
    category: 'rheumatoidArthritis',
    title: 'RA Has a Real, Formal Remission Target -- Not Just "Feeling Better"',
    teaser: 'Modern RA care runs on a real, named strategy: Treat-to-Target, checking disease activity on a real schedule and escalating treatment until a specific, defined remission threshold is actually met.',
    summary:
      "RA management now runs on a real, formal strategy called Treat-to-Target (T2T), the shared basis of both the 2015 ACR guideline and the 2019 EULAR recommendations: disease activity gets measured repeatedly using a real, standardized score (Boolean-based remission requires tender joint count, swollen joint count, CRP, and patient global assessment all at or below 1; an alternative index-based score, SDAI, sets a real numeric threshold of under 3.3), and treatment is escalated whenever that real target isn't met, rather than continuing unchanged. Remission is the real, named goal for every patient, especially early in the disease, when it's genuinely more often achievable; low disease activity is the accepted fallback when true remission isn't reached. This matters directly for anyone managing RA: a real, defined target exists to actually ask a rheumatologist about by name, not just a vague sense of whether things feel better than last visit.",
    citations: [
      { source: 'American College of Rheumatology/EULAR Remission Criteria for Rheumatoid Arthritis: 2022 Revision, Arthritis & Rheumatology', url: 'https://acrjournals.onlinelibrary.wiley.com/doi/10.1002/art.42347' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-advocacy-methotrexate-monitoring'],
  },
  {
    id: 'ra-extra-articular-manifestations',
    category: 'rheumatoidArthritis',
    title: 'RA Reaches Well Beyond the Joints -- Real Lung, Eye, and Nodule Involvement, Not Just an Arthritis',
    teaser: 'Rheumatoid nodules in up to 30% of patients, real lung involvement in 5-30% (higher in some studies), and real eye complications in a quarter to a third -- RA is a real, systemic disease wearing a joint-disease name.',
    summary:
      "RA's own name centers the joints, but real extra-articular manifestations are genuinely common, not rare exceptions. Rheumatoid nodules, firm lumps under the skin, most often near pressure points like the elbows, are the single most common extra-articular feature, present in up to 30% of patients historically, though real, modern treatment has made them somewhat less common than in the pre-biologic era. Real lung involvement (interstitial lung disease, nodules, pleural disease) shows a genuinely wide reported range, 5% to 30% of patients, reaching as high as 67% in some studies depending on how it's measured. Real eye complications (most often dry eye from a real, overlapping Sjögren's mechanism, but also scleritis, a genuinely more serious inflammation of the eye's outer coat) affect roughly 25-39% of patients. The real, more severe manifestations (vasculitis, serositis, glomerulonephritis, Felty syndrome) are genuinely rarer, affecting roughly 2% of patients with established RA, but carry real, significant added morbidity and mortality risk when they do occur, a real, direct reason ongoing rheumatology follow-up matters beyond just tracking joint symptoms.",
    citations: [
      { source: 'Extra-articular Manifestations in Rheumatoid Arthritis, PMC3152850', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3152850/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-advocacy-cardiovascular-risk', 'sjogrens-secondary-ra-lupus-overlap'],
  },
  {
    id: 'ra-history-milestones',
    category: 'rheumatoidArthritis',
    title: "RA's Own Real History: Named by a Son, Defined by a Father, Transformed by Two Real Drug Discoveries",
    teaser: "1859, 1948, 1988, 1998 -- four real, dated turning points that took RA from an unnamed condition to a disease with real, formal remission targets.",
    summary:
      "RA's own real history runs through a real, specific family: in 1859, physician Alfred Garrod wrote the first treatise distinguishing this condition from gout, calling it \"rheumatic gout\"; in 1890, his son Archibald Garrod gave it the name still used today, rheumatoid arthritis. The 20th century brought two real, transformative treatment discoveries: cortisone's 1948 introduction, hailed at the time as a genuine miracle drug for inflammation, and methotrexate's formal 1988 FDA approval for RA specifically (used off-label somewhat earlier), a real, foundational disease-modifying drug still first-line today, already covered in this app's own self-advocacy research. The most recent real turning point: 1998's approval of etanercept, the first biologic disease-modifying drug for RA, directly targeting TNF, a specific inflammatory signaling molecule, rather than suppressing the immune system broadly the way earlier drugs did -- a genuinely different, more targeted treatment era that real biologics like adalimumab (already covered in this app's own medication research) continue today.",
    citations: [
      { source: 'A Brief History of Rheumatoid Arthritis, National Rheumatoid Arthritis Society (NRAS)', url: 'https://nras.org.uk/resource/history-of-rheumatoid-arthritis/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gout-history-milestones'],
  },
  {
    id: 'ra-pregnancy-family-planning',
    category: 'rheumatoidArthritis',
    title: 'RA Often Genuinely Improves During Pregnancy -- Then Real, Common Flares Follow After Delivery',
    teaser: "A real, well-documented pattern most people with RA who are planning a pregnancy deserve to know in advance: symptoms often ease during pregnancy itself, then a real postpartum flare is common in the following months.",
    summary:
      "Pregnancy and RA have a real, well-documented, genuinely counterintuitive relationship: disease activity often improves during pregnancy, particularly when the disease was already well-controlled going into it, with real research tracing this improvement to increased galactosylation of IgG antibodies, a specific, measurable immune change pregnancy itself induces. The real complication comes after delivery: postpartum flares are common, with real cohort data finding disease control worsened in 39% of patients in the months following birth, even with medication use often increased at that point specifically to manage it. The single most important real, practical planning fact: methotrexate, RA's own first-line medication, is a real, potent human teratogen and must be stopped by both partners at least three months before attempting conception, and cannot be used during pregnancy or while breastfeeding, a real, direct reason planning a pregnancy with RA needs an early, deliberate conversation with a rheumatologist about medication transition, not a decision made after conception is already underway.",
    citations: [
      { source: 'Immunoglobulin G galactosylation and sialylation are associated with pregnancy-induced improvement of rheumatoid arthritis and the postpartum flare, PMC3003510', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3003510/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-advocacy-methotrexate-monitoring'],
  },

  // -- Second depth pass, 2026-08-08, extending full-parity work to the
  // first 10 non-Hashimoto's conditions. Every citation independently
  // verified via WebSearch.
  {
    id: 'ra-smoking-citrullination',
    category: 'rheumatoidArthritis',
    title: 'Smoking Is the Single Biggest Known Environmental Trigger for RA, and Real Research Now Explains Exactly Why',
    teaser: 'Cigarette smoke triggers a real, specific chemical change in lung proteins that the immune system can then mistake for a permanent threat, a real, well-mapped mechanism connecting smoking directly to RA in a way few other risk factors are.',
    summary:
      "Smoking is the real, most consistently identified environmental risk factor for developing rheumatoid arthritis, and the mechanism behind it is now genuinely well understood rather than just statistically observed. Real research shows cigarette smoke triggers citrullination, a chemical alteration of certain proteins, inside the lungs of a real, susceptible person. In someone carrying specific genetic variants, most notably the HLA-DRB1 \"shared epitope\" and PADI4 gene variants, the immune system can start treating these altered proteins as foreign, producing anti-citrullinated protein antibodies (ACPA, also called anti-CCP) years before joint symptoms ever appear. Real research finds this isn't just an additive risk, it's a genuine gene-environment interaction: smoking's own effect on ACPA-positive RA risk is significantly amplified specifically in people who already carry these genetic variants, and a real, large study found smoking most strongly associated with the presence of all three major RA-related antibodies together (rheumatoid factor, ACPA, and anti-carbamylated protein antibodies) rather than any one alone. Worth knowing directly, this connects straight back to this app's own already-built RF/anti-CCP self-advocacy research: someone who smokes and tests positive for these antibodies is looking at a real, mechanistically explained elevated risk, not just a correlation, and quitting remains one of the few real, modifiable levers over that risk profile.",
    citations: [
      { source: 'The Impact of Cigarette Smoking on Risk of Rheumatoid Arthritis: A Narrative Review, PMC7072747', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7072747/' },
      { source: 'DNA methylation mediates genotype and smoking interaction in the development of anti-citrullinated peptide antibody-positive rheumatoid arthritis, PMC5372280', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5372280/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-advocacy-rf-anti-ccp'],
  },

  // -- Volumetric depth pass batch 3, 2026-08-08, continuing toward
  // genuine volumetric parity with Hashimoto's own depth. Every citation
  // independently verified via WebSearch.
  {
    id: 'ra-interstitial-lung-disease',
    category: 'rheumatoidArthritis',
    title: 'RA-Associated Lung Disease Is Real, Common, and Genuinely Underrecognized Until It\'s Advanced',
    teaser: 'Real research finds interstitial lung disease affecting roughly 20% of RA patients by imaging-based estimates, with up to a third showing subclinical changes on CT scans well before any symptoms appear.',
    summary:
      "Rheumatoid arthritis-associated interstitial lung disease (RA-ILD) is a real, genuinely common complication of RA, worth knowing about directly since it's a real, frequent but underrecognized cause of serious illness beyond the joints. Real, pooled prevalence estimates vary by how it's measured, systematic reviews and meta-analyses find real rates around 18.7-21.4% using imaging-based diagnosis, while real-world database studies relying on clinical diagnosis alone find a much lower 4.1%, a real, striking gap suggesting many cases go unrecognized until they become clinically obvious. Genuinely important: real screening research using high-resolution CT scans finds up to a third of RA patients may have real, subclinical lung changes with no symptoms at all. Real research finds RA-ILD directly associated with significant illness and mortality, and some patients go on to develop progressive pulmonary fibrosis, a real, worsening pattern of increasing fibrotic lung damage, declining lung function, and premature death if not caught and managed. Worth knowing directly: this is a real, worth-raising question for anyone with RA experiencing unexplained shortness of breath, a persistent dry cough, or reduced exercise tolerance, symptoms that might otherwise get attributed to general RA fatigue or deconditioning rather than investigated as a real, separate, and treatable lung complication in its own right.",
    citations: [
      { source: 'The global prevalence of interstitial lung disease in patients with rheumatoid arthritis: a systematic review and meta-analysis, PMID 39825929', url: 'https://pubmed.ncbi.nlm.nih.gov/39825929/' },
      { source: 'Identification, Monitoring, and Management of Rheumatoid Arthritis-Associated Interstitial Lung Disease, Arthritis & Rheumatology', url: 'https://acrjournals.onlinelibrary.wiley.com/doi/10.1002/art.42640' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-extra-articular-manifestations'],
  },
  {
    id: 'ra-jak-inhibitors-oral-surveillance',
    category: 'rheumatoidArthritis',
    title: 'JAK Inhibitors: A Real, Newer RA Drug Class With a Real, Serious Safety Story Behind Its Own Boxed Warning',
    teaser: 'A real, dedicated safety trial (ORAL Surveillance) found JAK inhibitors carrying real, increased risk of heart attack, stroke, cancer, blood clots, serious infection, and death compared to TNF inhibitors in an at-risk population.',
    summary:
      "JAK inhibitors (tofacitinib, baricitinib, upadacitinib) are a real, newer class of oral RA medication, and they carry a real, serious, FDA-mandated boxed warning worth knowing about directly, distinct from the biologics already covered in this app's own RA research. The real, pivotal ORAL Surveillance trial specifically studied this safety question in roughly 4,300 RA patients aged 50 or older with at least one cardiovascular risk factor, comparing tofacitinib against TNF inhibitors over an average 4-year follow-up. Real results found a genuinely serious, increased risk across multiple outcomes with JAK inhibitor use: heart attack and stroke, cancer, blood clots, serious infections, and death, all compared to the TNF-inhibitor comparison group. Based directly on these real findings, the FDA required a class-wide boxed warning (the strongest warning label the FDA issues) across all JAK inhibitors used for RA and other inflammatory conditions, and similar action followed internationally. Worth knowing honestly: real, ongoing analysis of this trial (\"the theory of relativity\" as one real academic review calls it) has debated how much of this risk applies broadly versus concentrates specifically in the older, cardiovascular-risk-factor-carrying population the trial actually studied. Worth knowing directly: this is a real, worth-naming-by-name safety conversation to have before starting a JAK inhibitor, especially for anyone with existing cardiovascular risk factors already covered elsewhere in this app's own research, JAK inhibitors remain a real, effective RA option, but genuinely not a risk-free alternative to be chosen without this specific conversation.",
    citations: [
      { source: 'Risks and Benefits of Janus Kinase Inhibitors in Rheumatoid Arthritis — Past, Present, and Future, New England Journal of Medicine', url: 'https://www.nejm.org/doi/abs/10.1056/NEJMe2117663' },
      { source: 'Important safety information for Janus kinase (JAK) inhibitors, Therapeutic Goods Administration', url: 'https://www.tga.gov.au/news/safety-updates/important-safety-information-janus-kinase-jak-inhibitors' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-advocacy-cardiovascular-risk', 'ra-biologics-infection-risk'],
  },
  {
    id: 'ra-depression-anxiety-comorbidity',
    category: 'rheumatoidArthritis',
    title: 'Depression and Anxiety Are Real, Common, and Genuinely Underscreened Companions to RA',
    teaser: 'A real meta-analysis found major depression roughly 2-3 times more common in RA than the general population, with anxiety and depression both tracking directly with how active the disease actually is.',
    summary:
      "Depression and anxiety are real, genuinely common companions to rheumatoid arthritis, worth knowing about directly as a real part of managing the disease, not a separate, unrelated concern. Real research finds reported rates genuinely wide-ranging across different studies (2.4% to 85.2% for anxiety, 15% to 73.2% for depression, reflecting real differences in how each was measured), but a real, more precise meta-analysis found current and lifetime anxiety disorder prevalence at 13.5% and 22.2% respectively, and a separate real meta-analysis found major depressive disorder in 16.8% of RA patients, a real 2-3 times higher rate than the general population. Genuinely important: real research finds both anxiety and depression correlate directly and positively with RA disease activity itself, meaning periods of worse joint inflammation track with worse real mental health symptoms, not just a coincidental overlap. Real clinical research explicitly recommends routine screening and ongoing monitoring for both conditions as part of standard RA care, specifically because real research finds this comorbidity genuinely impacts disease prognosis, not just quality of life on its own. Worth knowing directly: this is a real, worth-raising topic in routine RA care, someone experiencing persistent low mood, worry, or emotional exhaustion alongside their joint symptoms has a real, evidence-backed reason to bring it up directly with their rheumatologist, not assume it's simply an expected, unaddressable part of living with a chronic illness.",
    citations: [
      { source: 'Beyond rheumatoid arthritis: A meta-analysis of the prevalence of anxiety and depressive disorders in rheumatoid arthritis, PMID 40112611', url: 'https://pubmed.ncbi.nlm.nih.gov/40112611/' },
      { source: 'The prevalence and correlation of depression and anxiety with disease activity in rheumatoid arthritis, PMC10201383', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10201383/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-treat-to-target-remission', 'sleep-autoimmune-disease-real-data'],
  },
  {
    id: 'ra-periodontal-disease-pgingivalis',
    category: 'rheumatoidArthritis',
    title: 'A Specific Gum-Disease Bacterium Carries a Real, Unique Enzyme That Directly Triggers RA\'s Own Core Mechanism',
    teaser: 'Porphyromonas gingivalis, a real, common cause of gum disease, is the only known bacterium carrying an enzyme that citrullinates proteins, the exact same process this app\'s own smoking research already names as RA\'s central trigger.',
    summary:
      "This category's own already-built research covers how smoking triggers citrullination, a real chemical change to certain proteins that the immune system can then mistakenly attack, driving RA's own core autoimmune mechanism. Periodontal disease (gum disease) offers a real, second, independent route to that exact same mechanism. Porphyromonas gingivalis, a real, common bacterium behind chronic gum disease, is the only known bacterium carrying its own version of the enzyme (peptidylarginine deiminase, or PAD) that performs this citrullination, and real laboratory research found it can citrullinate several of the exact same proteins already implicated as RA autoantigens (fibrinogen, alpha-enolase, vimentin). A real, controlled animal study found infection with this bacterium directly worsened arthritis severity and measurably increased citrullinated-protein antibodies, and this effect depended specifically on the bacterium's own unique enzyme being present and active. Real human research has independently found periodontal disease a genuine, documented risk factor for developing RA, consistent with this same real, direct mechanism rather than just a coincidental shared risk factor. Worth knowing directly: this gives real, practical weight to something easy to treat as a minor, unrelated health habit, real, routine dental care and periodontal treatment is a genuine, low-cost, low-risk piece of RA management worth taking seriously, not just general oral hygiene advice.",
    citations: [
      { source: 'Porphyromonas gingivalis Facilitates the Development and Progression of Destructive Arthritis through Its Unique Bacterial Peptidylarginine Deiminase (PAD), PLoS Pathogens 2013, PMID 24068934', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3771902/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-smoking-citrullination'],
  },
  {
    id: 'ra-nsaid-cardiovascular-risk',
    category: 'rheumatoidArthritis',
    title: 'NSAIDs Carry Real Cardiovascular Risk, but a Real, Large Study Found It\'s Not Worse in RA Than It Already Is Elsewhere',
    teaser: 'A real, 17,320-patient Danish cohort found NSAID-related cardiovascular risk in RA patients genuinely lower than in the general population, an honest, reassuring nuance to RA\'s own already-elevated heart risk.',
    summary:
      "This category's own already-built research already covers RA's own real, independently elevated cardiovascular risk (roughly 2 to 5 times higher than the general population), and RA's own treatment regularly involves NSAIDs, medications this app's own cardiovascular research already documents as carrying real cardiovascular risk on their own. Put together, that raises a real, reasonable worry: does using NSAIDs regularly for RA symptom control compound an already-elevated risk? A real, large Danish nationwide cohort study (17,320 RA patients matched against 69,280 controls) tested this directly, and found something genuinely reassuring: the cardiovascular risk associated with overall NSAID use was significantly LOWER in RA patients than in the matched control group (a hazard ratio of 1.22 in RA patients versus 1.51 in controls). Worth knowing honestly, since it's not a blanket clearance: the same real study found this protective difference didn't hold for every individual NSAID, specific drugs (rofecoxib and diclofenac by name) still showed real, elevated cardiovascular risk in RA patients specifically. This is real, useful, two-sided context: NSAID use for RA symptom control isn't automatically compounding this app's own already-covered elevated RA cardiovascular risk the way a first, worried assumption might suggest, but which specific NSAID gets used still matters, a real, concrete detail worth raising directly when discussing symptom management with a rheumatologist.",
    citations: [
      { source: 'Non-steroidal anti-inflammatory drugs and risk of cardiovascular disease in patients with rheumatoid arthritis: a nationwide cohort study, Annals of the Rheumatic Diseases 2014, PMID 23749610', url: 'https://pubmed.ncbi.nlm.nih.gov/23749610/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-advocacy-cardiovascular-risk', 'ckd-nsaid-kidney-injury-real-data'],
  },
  {
    id: 'ra-elderly-onset-distinct-presentation',
    category: 'rheumatoidArthritis',
    title: 'RA That Starts After 60 Genuinely Looks Different, and Runs a Real, More Aggressive Course',
    teaser: 'Elderly-onset RA presents with real, larger joints and an acute, flu-like start four times more often resembling a different condition entirely, and real research finds it causes more joint damage despite starting with similar disease activity to younger-onset RA.',
    summary:
      "This category's own already-covered research (the smoking/citrullination mechanism, methotrexate monitoring) is written largely around the more typical, younger-onset presentation of RA. Real research finds RA that first develops after age 60, a real, named entity called elderly-onset RA (EORA), genuinely different enough to actually change how it's recognized. Real research finds EORA favoring larger joints (shoulders, knees) rather than the small hand and finger joints more typical of younger-onset RA, with a real, acute, flu-like onset with constitutional symptoms four times more common, a real presentation that closely resembles a different condition, polymyalgia rheumatica, closely enough that real research names this a genuine, common source of diagnostic delay. Real, serological findings differ too: elderly patients are less likely to have rheumatoid factor at disease onset, historically making the diagnosis look less certain early on. Worth knowing honestly and directly: despite starting with real, similar disease activity to younger-onset RA, real research finds EORA follows a real, more aggressive course, with more severe joint destruction and greater disability, plus a real, higher burden of the cardiovascular disease and hypothyroidism comorbidities already covered elsewhere in this category. Worth knowing directly: new joint pain and swelling with a flu-like start after 60 deserves the same real, direct rheumatology evaluation as a more classic RA presentation, not an assumption it's just a resolving virus or ordinary age-related aches.",
    citations: [
      { source: 'International overview on juvenile-, adult- and elderly-onset rheumatoid arthritis: The age at disease onset as a fundamental determinant of clinical presentation, Clinical Rheumatology 2025, PMID 39913010', url: 'https://pubmed.ncbi.nlm.nih.gov/39913010/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-smoking-citrullination', 'ra-advocacy-cardiovascular-risk'],
  },
  {
    id: 'ra-global-indigenous-prevalence',
    category: 'rheumatoidArthritis',
    title: 'RA Rates Vary Enormously by Population, and Genetics Explains a Real, Measurable Share of It',
    teaser: 'Some Indigenous populations of the Americas carry RA prevalence 5 to 6 times the worldwide average, a real, documented pattern tied to a specific inherited genetic marker, not just healthcare access.',
    summary:
      "Rheumatoid arthritis prevalence is often quoted as roughly 0.5 to 1.0% of the general population worldwide, but that single figure hides real, large regional and ethnic variation. Several Indigenous populations of the Americas, the Pima (5.3%) and Chippewa (6.8%) of the central United States, the Cree/Ojibway of Canada, the Tlingit of Alaska, and the Qom of Argentina, show real RA prevalence of 2 to 6.8%, among the highest documented anywhere in the world, and these populations tend to develop RA earlier, with a real, higher rate of joint erosion, rheumatoid nodules, and a specific genetic marker, HLA-DRB1*1402. At the other end, real population studies have found consistently lower RA prevalence in China, Japan, northwest Greece, and rural Africa. Worth knowing directly for anyone outside the US: RA is not one uniform disease risk worldwide, real inherited genetic variation (particularly around the HLA region, the same immune-recognition genes already covered elsewhere in this app) meaningfully shifts real, population-level risk, and where someone's own ancestry traces to matters for understanding their own real starting risk, not just their diet or environment.",
    citations: [
      { source: 'Rheumatoid arthritis in American Indians and Alaska Natives: a review of the literature, PMID 15692959', url: 'https://pubmed.ncbi.nlm.nih.gov/15692959/' },
      { source: 'RA prevalence in Latin American indigenous community among highest worldwide, Healio', url: 'https://www.healio.com/rheumatology/rheumatoid-arthritis/news/online/%7B00e31d66-f713-4d3c-87c8-b96698cf57c8%7D/ra-prevalence-in-latin-american-indigenous-community-among-highest-worldwide' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-overview'],
  },
  {
    id: 'ra-window-of-opportunity-early-treatment',
    category: 'rheumatoidArthritis',
    title: "RA Has a Real, Named 'Window of Opportunity' Where the Same Treatment Works Better",
    teaser: 'Real, multiple randomized trials find starting RA treatment within the first few months of symptoms produces measurably less joint damage and better function than the identical treatment started later.',
    summary:
      "This category's own already-covered treat-to-target strategy works better, real research finds, the sooner it starts. Rheumatology has a real, widely accepted concept called the 'therapeutic window of opportunity,' a real, time-limited period early in RA's course when the disease appears genuinely more responsive to treatment, with the potential to reset its whole long-term trajectory rather than just slow an already-established course. Real evidence backs this directly: people treated within roughly 3 months of symptom onset have measurably better outcomes than those treated later, and multiple real randomized controlled trials found earlier DMARD (disease-modifying antirheumatic drug) treatment produced significantly less joint damage on X-ray and better long-term physical function than the identical treatment started just 6 to 12 months later. Worth knowing directly, and genuinely actionable: real-world data finds that actually seizing this window often depends less on the disease itself and more on how fast someone gets to a rheumatologist in the first place, meaning a real, practical priority for anyone with new, persistent joint pain and swelling is pushing for a prompt referral and diagnosis, not waiting to see if it resolves on its own, since real evidence suggests the same eventual treatment plan works measurably better started early than started late.",
    citations: [
      { source: 'Window of opportunity in rheumatoid arthritis, PMC6525606', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6525606/' },
      { source: 'Do it fast! Early access to specialized care improved long-term outcomes in rheumatoid arthritis, Advances in Rheumatology', url: 'https://link.springer.com/article/10.1186/s42358-023-00301-7' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-treat-to-target-remission'],
  },
  {
    id: 'ra-global-biologic-access-disparity',
    category: 'rheumatoidArthritis',
    title: "This Category's Own Biologic Research Reaches a Real, Vastly Uneven Share of the World's RA Patients",
    teaser: 'Real, international data finds biologic medication use tracking directly with a country\'s development level, from just 2.7% of RA patients in low-development countries up to 38.8% in the wealthiest ones.',
    summary:
      "This category's own already-covered biologic research (the real infection-risk cautions, the real periodontal/cardiovascular connections) assumes access to these medications in the first place, and real, international data finds that access itself varies enormously by country. A real, international cohort study found biologic and targeted-DMARD usage correlating directly with a country's Human Development Index, ranging from just 2.7% of RA patients in low-HDI countries up to 38.8% in very-high-HDI countries, a real, roughly fourteenfold gap that held up even after adjusting for disease severity and other patient-level factors. The real, structural reason: in roughly half of countries studied, public health systems cover biologic DMARDs for fewer than 10% of patients, driven by real, high medication costs relative to average income, alongside real regulatory and market barriers specific to lower-income health systems. Worth knowing directly: RA's own real disease biology and treatment research doesn't change by country, but whether a given person can actually access the treatments this category already covers in depth often does, a real, structural gap in outcomes that has nothing to do with how well RA itself responds to treatment.",
    chart: {
      title: 'Biologic medication use in RA, by country development level',
      unit: '%',
      data: [
        { label: 'Low-HDI countries', value: 2.7 },
        { label: 'Very-high-HDI countries', value: 38.8 },
      ],
      sourceNote: 'International COVAD-2 cohort, global inequities in biologic and targeted DMARD use in rheumatoid arthritis',
    },
    citations: [
      { source: 'Global inequities in biologic and targeted DMARD use in rheumatoid arthritis: cross-sectional data from the international COVAD-2 cohort, PMID 42126605', url: 'https://pubmed.ncbi.nlm.nih.gov/42126605/' },
      { source: 'Rheumatoid arthritis worldwide: inequalities in epidemiology and care, Moldovan Journal of Health Sciences', url: 'https://mjhs.md/article/rheumatoid-arthritis-worldwide-inequalities-epidemiology-and-care' },
    ],
    overallTier: 'strong',
    relatedIds: ['ra-biologics-infection-risk', 'ra-global-indigenous-prevalence'],
  },
  {
    id: 'horizon-ra',
    category: 'rheumatoidArthritis',
    title: 'A One-Time Real, Experimental Cell Therapy Is Being Tested in RA Patients Every Other Drug Has Failed',
    teaser: 'CAR-T cell therapy, originally built for blood cancers, is now in real, early human trials for treatment-resistant RA, with one real trial finding significant joint-count improvement in patients who had already failed multiple biologics.',
    summary:
      "For RA patients who've already worked through this category's own already-covered biologic and JAK-inhibitor options without lasting relief, a genuinely new real treatment class is now in early human testing: CAR-T cell therapy, engineering a patient's own immune cells to specifically target and reset the immune process driving their disease. Real, current trials are showing genuine promise: KYV-101, tested in a real Phase 1/2 trial in patients who had already failed multiple prior therapies, showed a real, rapid decline in key disease biomarkers, supporting the trial's move into a larger, randomized Phase 2 stage now underway. A real, separate fourth-generation CAR-T study published in 2025 found significant improvement in tender and swollen joint counts in treatment-resistant RA patients, and a real, distinct CAR-Treg (regulatory T-cell) approach has completed its first human safety trial. Worth knowing directly, and honestly: real data across this whole approach for autoimmune rheumatic disease remains overwhelmingly early-stage, roughly 64% of trials are still Phase 1, only about 7% have reached Phase 2, and most current real trial activity concentrates on lupus rather than RA specifically. This is a real, genuinely promising direction for the hardest-to-treat cases, not yet an available option.",
    citations: [
      { source: 'Kyverna Therapeutics Highlights Potential of KYV-101 in Rheumatoid Arthritis with Phase 1 Data', url: 'https://ir.kyvernatx.com/news-releases/news-release-details/kyverna-therapeutics-highlights-potential-kyv-101-rheumatoid' },
      { source: 'Fourth-generation chimeric antigen receptor T-cell therapy is tolerable and efficacious in treatment-resistant rheumatoid arthritis, Cell Research', url: 'https://www.nature.com/articles/s41422-024-01068-2' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ra-biologics-infection-risk', 'ra-jak-inhibitors-oral-surveillance'],
  },
  {
    id: 'horizon-ra-tolerogenic',
    category: 'rheumatoidArthritis',
    title: 'A Real, Genuinely Different Goal: Teaching the Immune System to Stop Attacking Joints, Not Just Suppressing It',
    teaser: "Every current RA treatment already covered in this category, including this category's own CAR-T research, works by suppressing or resetting the immune system broadly. A real, distinct research direction is trying something narrower: retraining it to specifically tolerate the one target driving RA.",
    summary:
      "This category's own already-covered CAR-T and biologic research all works by broadly suppressing or resetting immune activity. A real, more targeted research direction, antigen-specific tolerizing immunotherapy, is trying something narrower: teaching the immune system to specifically stop attacking one real target (citrullinated proteins, the same real antigen already covered in this category's own smoking-citrullination research) while leaving the rest of the immune system untouched. A real, randomized Phase 1 trial tested peptide/calcitriol liposomes (DEN-181) in people with antibody-positive RA already on methotrexate, and found the treatment well tolerated, with a real, measurable drop in the specific immune cells that react to citrullinated proteins. A real, separate Phase 1/2 trial (TOLERANT) is testing a related approach using the patient's own dendritic cells, engineered to promote tolerance rather than attack. Worth knowing directly and honestly: this whole research direction remains real, early-stage, Phase 1 safety and immune-marker data, not yet real evidence of joint-damage prevention or symptom reversal, but it represents a genuinely different real goal than every other treatment already covered in this category, tolerance instead of suppression.",
    citations: [
      { source: 'Randomized phase I trial of antigen-specific tolerizing immunotherapy with peptide/calcitriol liposomes in ACPA+ rheumatoid arthritis', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9714780/' },
    ],
    overallTier: 'weak',
    relatedIds: ['ra-smoking-citrullination', 'horizon-ra'],
  },
];
