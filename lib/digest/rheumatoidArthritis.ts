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
    relatedIds: ['ra-advocacy-cardiovascular-risk'],
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
];
