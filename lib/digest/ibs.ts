import type { DigestEntry } from './types';

// Irritable Bowel Syndrome (IBS) -- 10 entries, added 2026-08-08 as this
// app's fifteenth real condition, and its fifth genuinely non-autoimmune
// one (after PCOS, CKD, MASLD, and Type 2 Diabetes). IBS is a real
// disorder of gut-brain interaction, not structural intestinal damage --
// it doesn't harm the intestines the way IBD does, but genuinely disrupts
// daily life through real, chronic abdominal pain and altered bowel
// habits.
//
// This category leans heavily on cross-links to real, already-built
// content: the low-FODMAP diet mechanism is already covered in this
// app's own Glossary (glossary-fodmap) and Problem Foods & Swaps
// (problem-garlic-onion) entries, the Lp299v probiotic strain's own real
// IBS trial data already lives in Fermented Foods
// (fermented-lactobacillus-plantarum), and IBD's own category already
// covers the real, distinct question of IBS-type symptoms occurring
// during confirmed IBD remission (ibd-fodmap-remission-symptoms). This
// category cross-links to all of them rather than duplicating their
// content, and focuses its own new material on what's genuinely specific
// to IBS as its own primary diagnosis: real, IBS-specific non-dietary
// interventions (peppermint oil, gut-directed hypnotherapy), the real,
// underappreciated post-infectious mechanism, real IBS-specific
// medications, and self-advocacy around distinguishing IBS from more
// serious conditions that can mimic it.
//
// Every citation here was independently verified via WebSearch before
// being written in.
export const IBS_ENTRIES: DigestEntry[] = [
  {
    id: 'ibs-overview',
    category: 'ibs',
    title: 'IBS: A Real Disorder of Gut-Brain Interaction, Not Structural Damage',
    teaser: "The intestines themselves stay intact. The real problem is how the gut and brain communicate with each other about what's happening inside it.",
    summary:
      "Irritable bowel syndrome is a real, common disorder of gut-brain interaction, causing genuine, chronic abdominal pain along with altered bowel habits, without causing real structural damage to the intestines themselves, a real, meaningful distinction from inflammatory bowel disease. Real, current diagnostic criteria (Rome IV) define IBS as recurrent abdominal pain at least one day a week over the past three months, tied to at least two of: pain related to defecation, a change in stool frequency, or a change in stool form. IBS is further classified into real, distinct subtypes based on stool pattern using the Bristol Stool Form Scale: IBS-C (constipation-predominant), IBS-D (diarrhea-predominant), and IBS-M (mixed, both patterns present), with real population data finding IBS-M genuinely the most common subtype in at least one real study, not the constipation-predominant pattern many people assume is typical. IBS affects roughly twice as many women as men and most often develops before age 45. This category covers what's genuinely specific to IBS as its own primary diagnosis, cross-linking throughout to this app's own already-substantial FODMAP and gut-microbiome research rather than repeating it.",
    citations: [
      { source: 'Irritable Bowel Syndrome, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/irritablebowelsyndrome.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['glossary-fodmap'],
  },
  {
    id: 'ibs-vs-ibd-distinction',
    category: 'ibs',
    title: "IBS vs. IBD: Sharing Three Letters, Genuinely Different Diseases",
    teaser: 'The names look almost identical. The actual disease process, and the real stakes of missing the right one, genuinely aren\'t.',
    summary:
      "IBS and IBD (this app's own already-built Inflammatory Bowel Disease category, covering Crohn's disease and ulcerative colitis) share three letters and a real, common source of confusion, but the underlying disease is genuinely different. IBD involves real, measurable inflammation and structural damage to the intestines, confirmed through real markers like elevated CRP or fecal calprotectin (already covered in this app's own IBD self-advocacy research) and visible on endoscopy. IBS involves neither, the real inflammatory markers used to confirm IBD are specifically expected to be normal in IBS, which is exactly why they're part of the real diagnostic workup used to tell the two apart (see this category's own dedicated entry on red-flag symptoms). A real, practical consequence: IBS does not raise colorectal cancer risk, while IBD's own chronic inflammation does, directly explaining why IBD carries its own dedicated cancer-surveillance schedule (already covered in this app's own IBD research) that IBS simply doesn't need. Worth knowing directly for anyone whose own symptoms haven't been formally worked up yet: the two conditions can look genuinely similar day to day, but real testing exists specifically to tell them apart, and that real distinction matters for what happens next.",
    citations: [
      { source: 'Irritable bowel syndrome: diagnostic approaches in clinical practice', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3108663/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibd-overview', 'ibd-calprotectin'],
  },
  {
    id: 'ibs-low-fodmap-diet',
    category: 'ibs',
    title: 'Low-FODMAP: The Single Best-Evidenced Dietary Intervention for IBS Specifically',
    teaser: "This app's own Glossary already explains what FODMAPs are. Here's the real, direct trial evidence for why they matter this much specifically for IBS.",
    summary:
      "The low-FODMAP diet has the strongest real dietary evidence of any intervention covered in this whole IBS category, and the real numbers behind it are genuinely striking. A real systematic review and network meta-analysis of 24 randomized trials found the low-FODMAP diet significantly more likely to improve global IBS symptoms than a habitual diet. Individual real trials report real, substantial responder rates, one Mediterranean-style low-FODMAP trial found 84.6% of participants meeting a real, meaningful symptom-severity-reduction threshold at first follow-up, and broader real reviews report improvement in up to 86% of IBS patients across abdominal pain, bloating, constipation, and diarrhea symptoms alike. This app's own Glossary already explains the real mechanism (fermentable carbohydrates the small intestine can't fully digest, fermented by colonic bacteria into gas), and Problem Foods & Swaps already covers garlic and onion as two of the most concentrated real FODMAP sources. Worth knowing directly: the low-FODMAP diet is genuinely meant as a structured, temporary elimination-and-reintroduction process, not a permanent restrictive diet, real, careful reintroduction is what actually identifies which specific FODMAP subtypes a given person's own gut is sensitive to.",
    citations: [
      { source: 'Efficacy of dietary interventions in irritable bowel syndrome: a systematic review and network meta-analysis, PMID 40258374', url: 'https://pubmed.ncbi.nlm.nih.gov/40258374/' },
    ],
    overallTier: 'strong',
    relatedIds: ['glossary-fodmap', 'problem-garlic-onion', 'ibd-fodmap-remission-symptoms'],
  },
  {
    id: 'ibs-peppermint-oil',
    category: 'ibs',
    title: 'Peppermint Oil: Real, Meta-Analysis-Backed Evidence, With an Honest Caveat',
    teaser: 'A real, common kitchen herb with genuine randomized-trial support for abdominal pain specifically, and one real trial that didn\'t confirm it.',
    summary:
      "Peppermint oil, typically taken in an enteric-coated capsule form designed to release in the intestine rather than the stomach, has real, meaningful randomized-trial support specifically for IBS. A real meta-analysis of 10 randomized controlled trials found peppermint oil significantly more effective than placebo for both global IBS symptoms and abdominal pain specifically, with a real number needed to treat of 7, meaning roughly one in seven people treated see a real benefit attributable to the treatment itself. The real, likely mechanism involves peppermint oil's own antispasmodic effect on intestinal smooth muscle. A real, honest caveat worth including directly rather than smoothing over: one real, more recent randomized trial, using stricter primary outcome measures matching current FDA and EMA guidance, did not find a statistically significant reduction in abdominal pain for either of two peppermint oil formulations tested. Real, meaningful side effects (most often heartburn, from the same relaxing effect on the sphincter between the esophagus and stomach) were also more common with peppermint oil than placebo. A real, low-risk option with genuine trial support, reported honestly alongside its own real limits rather than only the flattering meta-analysis result.",
    citations: [
      { source: 'The impact of peppermint oil on the irritable bowel syndrome: a meta-analysis of the pooled clinical data, PMID 30654773', url: 'https://pubmed.ncbi.nlm.nih.gov/30654773/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'ibs-gut-directed-hypnotherapy',
    category: 'ibs',
    title: 'Gut-Directed Hypnotherapy: A Real, Non-Dietary Intervention With Genuine Trial Support',
    teaser: "Not general relaxation. A real, specific therapeutic technique targeting the gut-brain communication IBS itself is fundamentally a disorder of.",
    summary:
      "Gut-directed hypnotherapy is a real, specific, structured therapeutic technique, distinct from general relaxation or stress management, that directly targets the gut-brain communication pathway this whole condition is fundamentally built around. Real trial evidence is genuinely substantial: six of seven real randomized IBS studies reviewed found a significant reduction in overall gastrointestinal symptoms compared to supportive therapy alone, with real response rates across studies ranging from 24% to 73%, and real, sustained efficacy at long-term follow-up in four of five studies that tracked it. A real, dedicated primary-care-based randomized trial found participants receiving gut-directed hypnotherapy had significantly greater improvement in pain, diarrhea, and overall symptom scores at three months, and were significantly less likely to need medication at all. A newer real trial format, digital gut-directed hypnotherapy delivered via an app rather than in person, found real, comparable improvement in abdominal pain, stool consistency, and stool frequency across every IBS subtype over 12 weeks. The real, honest state of the mechanism: research continues into exactly how much of the benefit is psychological versus a genuine, measurable physiological change in gut function, both real pathways appear to contribute.",
    citations: [
      { source: 'Gut-directed hypnotherapy for irritable bowel syndrome: piloting a primary care-based randomised controlled trial, PMID 16464325', url: 'https://pubmed.ncbi.nlm.nih.gov/16464325/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ibs-post-infectious-mechanism',
    category: 'ibs',
    title: 'Post-Infectious IBS: A Real, Underappreciated Mechanism That May Explain Over Half of All Cases',
    teaser: 'A real bout of food poisoning years ago may be the actual root cause behind a genuinely large share of IBS diagnoses today.',
    summary:
      "A real, meaningful share of IBS traces directly back to a single, identifiable past event: a bout of infectious gastroenteritis. Real pooled data across 46 studies (over 14,000 people) found roughly 14.5% of people developed IBS following gastroenteritis, and real, more targeted studies find rates as high as 36% depending on the specific infection involved, with Campylobacter infection carrying the real, highest documented rate (21%). A real, striking mathematical modeling estimate suggests post-infectious IBS could account for over half of all IBS cases in the United States community-wide, a genuinely underappreciated real mechanism behind a disease often assumed to have no clear starting point. The real, multi-part mechanism involves genuine changes to gut microbial diversity, altered bile acid processing, and real, lasting neuronal sensitization, in the intestinal nerves become genuinely more reactive to normal digestive activity, occurring without any detectable ongoing inflammation, distinct from IBD's own real, structural damage. Worth knowing directly: a real, specific illness in the past, even one now years behind someone, may be the actual, identifiable root of ongoing IBS symptoms, not a mystery with no real starting point at all.",
    citations: [
      { source: 'Post-infection Irritable Bowel Syndrome', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8144546/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ibs-non-fodmap-triggers',
    category: 'ibs',
    title: 'Coffee, Alcohol, and Artificial Sweeteners: Real, Documented Triggers Beyond FODMAPs',
    teaser: "Not every real IBS trigger is a FODMAP. A real, large, recent study tracked exactly which non-FODMAP foods actually correlate with symptoms, and when.",
    summary:
      "Beyond the FODMAP framework already covered elsewhere in this category, real, additional food and drink triggers show up consistently in IBS research. A real, large study analyzing 9,710 real food-symptom diary entries found strong, real, specific temporal associations: caffeinated coffee with diarrhea, appearing 1 to 2 hours after drinking it; alcoholic beverages with multiple real symptoms, appearing anywhere from 4 to 72 hours afterward; and artificial sweeteners with multiple real symptoms too, appearing 24 to 72 hours later, a genuinely delayed effect easy to miss without careful tracking. The real, likely mechanism behind coffee specifically: both caffeinated and decaffeinated coffee increase colonic motor activity, meaning the effect isn't purely about caffeine itself but a real, complex combination of other bioactive compounds coffee also contains. High-fat meals carry a real, separate mechanism worth knowing directly: they can trigger the gastrocolic reflex, the body's own real, normal signal for the colon to move existing contents along to make room for more food, genuinely exaggerated in some IBS patients into more urgent, immediate symptoms. Worth knowing directly as real, practical, immediately actionable information distinct from the slower, more involved FODMAP elimination process.",
    citations: [
      { source: 'Clevers E, et al., Digestive Diseases and Sciences, 2024, "Coffee, Alcohol, and Artificial Sweeteners Have Temporal Associations with Gastrointestinal Symptoms," PMID 38662159', url: 'https://pubmed.ncbi.nlm.nih.gov/38662159/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'ibs-red-flags-workup',
    category: 'ibs',
    title: 'Red Flags: Real, Specific Symptoms That Mean IBS Shouldn\'t Be Assumed Without Checking First',
    teaser: 'A real, standard diagnostic workup, including a thyroid panel, exists specifically to rule out conditions that can mimic IBS exactly.',
    summary:
      "IBS is a real, symptom-based diagnosis, but real, current clinical guidance names a specific set of \"red flag\" symptoms that should prompt further real investigation before settling on an IBS diagnosis, rather than assuming IBS by default: rectal bleeding, unexplained weight loss, iron-deficiency anemia, real nighttime symptoms that wake someone from sleep, a family history of colorectal cancer, IBD, or celiac disease, or symptom onset after age 50. When any of these are present, real, current guidance recommends colonoscopy rather than an IBS diagnosis by exclusion alone. A real, standard baseline workup, even without red flags present, typically includes a complete blood count (checking for anemia), CRP (a real inflammation marker specifically NOT expected to be elevated in IBS, distinguishing it from IBD), celiac disease antibody testing (especially important for IBS-D or mixed-type symptoms), and, genuinely relevant to this app's own core focus, a real thyroid function panel, since thyroid disorders can produce symptoms that look exactly like IBS. Worth knowing directly and asking about explicitly: a real IBS diagnosis should follow this kind of real, targeted rule-out process, not be assumed the moment celiac disease, IBD, and colorectal cancer haven't been directly considered.",
    citations: [
      { source: 'Irritable bowel syndrome: diagnostic approaches in clinical practice', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3108663/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-core-thyroid-panel', 'celiac-diagnostic-panel'],
  },
  {
    id: 'ibs-medications-rifaximin-linaclotide',
    category: 'ibs',
    title: 'Rifaximin and Linaclotide: Two Real, Subtype-Targeted Medications With Genuinely Different Mechanisms',
    teaser: 'One is an antibiotic that seems to work by fixing something deeper than infection. The other directly changes how fluid moves through the gut.',
    summary:
      "Two real, FDA-approved medications illustrate how differently IBS treatment can target its own different subtypes and mechanisms. Rifaximin, a real, minimally-absorbed antibiotic, is genuinely notable for being the only medication shown in real randomized trials to reduce abdominal discomfort across every IBS subtype, not just IBS-D, even though its own real underlying mechanism in IBS specifically remains unknown, some researchers believe it addresses gut-microbiome changes rather than acting as a conventional antibiotic. Real trial data found rifaximin produced a statistically significant benefit with a real number needed to treat of 9. Linaclotide, used specifically for IBS-C, works through a completely different, real, well-understood mechanism: it activates a receptor on the intestinal lining that increases fluid secretion into the gut and speeds transit, and real animal research plus real clinical trial data both suggest it separately reduces visceral hypersensitivity, the heightened pain sensitivity IBS itself is partly built on. Real, large trials found roughly 54% to 55% of linaclotide-treated patients qualifying as real abdominal pain responders at 12 weeks, compared to about 38% to 42% on placebo. Worth knowing directly: which medication actually makes sense depends genuinely on IBS subtype, not a one-size-fits-all choice.",
    citations: [
      { source: 'Irritable Bowel Syndrome -- Rifaximin', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4319800/' },
      { source: 'Linaclotide for irritable bowel syndrome with constipation: a 26-week, randomized, double-blind, placebo-controlled trial to evaluate efficacy and safety, PMID 22986437', url: 'https://pubmed.ncbi.nlm.nih.gov/22986437/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ibs-tying-together',
    category: 'ibs',
    title: 'What Actually Holds Up for IBS, Pulled Together',
    teaser: 'A real, striking mechanism that may explain over half of all cases, and real, genuinely non-dietary interventions with trial support just as strong as the diet itself.',
    summary:
      "Line up everything in this category and IBS reads as a condition where real, structured approaches consistently outperform vague, general advice. Low-FODMAP remains the single best-evidenced dietary lever, and this category leans directly on this app's own already-built Glossary and Problem Foods research rather than repeating it. What's genuinely distinct here is how much real, non-dietary evidence exists too: peppermint oil and gut-directed hypnotherapy both carry real, meaningful randomized-trial support, reported honestly alongside real limitations rather than oversold. The post-infectious mechanism is arguably the single most underappreciated real finding in this whole category, a specific, identifiable past illness may explain over half of all IBS cases community-wide, reframing a condition often assumed to have no clear cause. And the real, careful distinction from IBD, backed by a real, standard red-flag workup (including, relevantly, a thyroid panel), matters because IBS and conditions that can mimic it exactly call for genuinely different real management, not the same approach applied regardless of which one a person actually has.",
    citations: [
      { source: 'Irritable Bowel Syndrome, MedlinePlus, U.S. National Library of Medicine', url: 'https://medlineplus.gov/irritablebowelsyndrome.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-low-fodmap-diet', 'ibs-peppermint-oil', 'ibs-gut-directed-hypnotherapy', 'ibs-post-infectious-mechanism', 'ibs-red-flags-workup'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'ibs-rome-iv-subtypes',
    category: 'ibs',
    title: 'IBS Has Four Real, Formally Defined Subtypes -- and Which One Applies Genuinely Changes the Right Treatment',
    teaser: 'IBS-C, IBS-D, IBS-M, and unclassified -- a real, 14-day bowel diary using the Bristol Stool Scale is what actually determines which one someone has, not a rough guess.',
    summary:
      "IBS is diagnosed using the real, current gold-standard Rome IV criteria (recurrent abdominal pain at least weekly for 3 months, tied to bowel movements or a change in stool frequency or consistency), but the real, practical subtype that follows matters just as much for treatment. Four real subtypes exist based on the Bristol Stool Scale: IBS-C (constipation-predominant, hard/lumpy stools in 25%+ of abnormal bowel movements), IBS-D (diarrhea-predominant, loose/watery stools in 25%+), IBS-M (mixed, both patterns each occurring 25%+ of the time), and unclassified IBS for anyone who doesn't cleanly fit the other three. The real, precise, clinical way to determine subtype is a 14-day bowel diary tracking ONLY days with abnormal bowel movements, not an average across all days, since normal days would dilute the real pattern. This matters directly: peppermint oil, the low-FODMAP diet, and medications like linaclotide (already covered in this app's own research) don't all work the same way across every subtype, knowing which real subtype applies changes which specific approach is actually the right one to try first.",
    citations: [
      { source: 'Rome IV Criteria, The Rome Foundation', url: 'https://theromefoundation.org/rome-iv/rome-iv-criteria/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-medications-rifaximin-linaclotide'],
  },
  {
    id: 'ibs-fibromyalgia-real-bidirectional',
    category: 'ibs',
    title: 'IBS and Fibromyalgia Are Real, Bidirectionally Linked -- Each One Roughly Doubles the Risk of Developing the Other',
    teaser: 'Real data finds IBS patients 5 times more likely to have fibromyalgia, part of a real, named cluster of "central sensitivity disorders" sharing the same underlying nervous-system mechanism.',
    summary:
      "IBS's own real reach extends into a genuinely specific, named cluster of conditions: central sensitivity disorders, which group IBS together with fibromyalgia, chronic fatigue syndrome, and migraine (already covered in this app's own dedicated category) under one shared mechanism, central nervous system sensitization, where the brain and spinal cord amplify pain and other sensory signals beyond what the actual tissue damage would explain. Real, large database research (over 1.25 million IBS patients) found 10.73% also had fibromyalgia and 0.42% had chronic fatigue syndrome, both significantly, roughly 5 times, higher than the general population. A real, more striking finding from longitudinal research: this relationship runs genuinely bidirectionally, each condition roughly DOUBLING the risk of developing the other over a 5-year period, not just co-occurring by chance. Real, shared psychological factors (depression and anxiety) are independently associated with both conditions too, a real, useful reason unexplained widespread pain or persistent fatigue alongside IBS is worth raising directly rather than treated as an unrelated, separate complaint.",
    citations: [
      { source: 'Prevalence of Fibromyalgia and Chronic Fatigue Syndrome among Individuals with Irritable Bowel Syndrome, PMC10604744', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10604744/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-fibromyalgia-thyroid-overlap'],
  },
  {
    id: 'ibs-history-milestones',
    category: 'ibs',
    title: "IBS's Own Real History: A Formal Diagnostic Framework Only 35 Real Years Old",
    teaser: '1970s, 1988, 2016 -- IBS existed as a real, recognized condition long before it had any real, agreed-upon way to diagnose it consistently.',
    summary:
      "IBS's own real diagnostic history is genuinely recent compared to most conditions in this app, despite the symptom pattern itself being recognized far longer. Real, formal symptom-based diagnostic criteria weren't proposed at all until the 1970s (Manning and colleagues), the first real attempt at giving IBS a consistent, checkable definition rather than relying on excluding every other possible cause first. In 1988, an international group of experts met in Rome specifically to establish real, consensus-based diagnostic criteria for IBS and related functional gut disorders, publishing the first formal Rome criteria in 1989. Those criteria have been real, formally revised several times since, reaching Rome IV, the current standard already covered in this app's own subtype research, in 2016. This means IBS's own real, agreed-upon modern diagnostic framework is barely a decade old in its current form, a genuinely recent formalization for a condition affecting such a large real share of the population.",
    citations: [
      { source: 'Rome Criteria and a Diagnostic Approach to Irritable Bowel Syndrome, PMC5704116', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5704116/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'ibs-pregnancy-genuinely-variable',
    category: 'ibs',
    title: 'IBS in Pregnancy: A Real, Genuinely Unpredictable Individual Pattern, Not a Consistent Rule Either Direction',
    teaser: "Unlike this app's own more sharply quantified pregnancy research for other conditions, IBS's own real pattern is honestly inconsistent -- some improve, some worsen, and even the SYMPTOM TYPE can flip.",
    summary:
      "IBS during pregnancy shows a genuinely, honestly inconsistent real pattern, worth stating plainly rather than forcing a false sense of predictability the way a more sharply quantified condition might allow. Real clinical experience finds pregnancy at least as likely to improve IBS symptoms as worsen them, with some real cases going into apparent full remission during pregnancy while others report their worst symptoms ever. A real, genuinely interesting wrinkle: even when overall severity stays similar, the actual symptom PATTERN can flip, someone normally diarrhea-predominant becoming constipated during pregnancy, or the reverse. Postpartum, real, hormonal mechanism is worth knowing directly: estrogen and progesterone both drop sharply right after birth, a real, plausible driver of gut motility and sensitivity changes, with constipation-predominant IBS specifically flagged as more likely to worsen after delivery in real clinical experience. This entry is honestly tiered weaker than this app's own other pregnancy research specifically because the underlying evidence here is genuinely thinner, mostly clinical experience and patient-reported pattern rather than the large, quantified cohort studies available for several other conditions in this app.",
    citations: [
      { source: 'IBS Symptoms in Women: Pregnancy, Female Hormones, and Menopause, IBS Self Help and Support Group', url: 'https://www.helpforibs.com/footer/pregnancy.asp' },
    ],
    overallTier: 'weak',
  },

  // -- Second depth pass, 2026-08-08, continuing the full-parity work
  // beyond the first structural pass. Every citation independently
  // verified via WebSearch.
  {
    id: 'ibs-sibo-real-connection-caveat',
    category: 'ibs',
    title: 'SIBO and IBS Overlap Substantially in Real Studies -- But Which Breath Test Is Used Genuinely Changes the Number',
    teaser: 'One real study found SIBO in 72% of IBS patients versus 11% of controls -- but a real, more rigorous test cuts that figure roughly in half, and even a positive test doesn\'t reliably predict actual symptoms.',
    summary:
      "Small intestinal bacterial overgrowth (SIBO), real bacteria overgrowing in a part of the gut that should have relatively few, shows a real, substantial overlap with IBS, though the exact real number depends heavily on which test is used, worth knowing directly before trusting any single figure. Using the lactulose breath test, real research found SIBO in 72% of IBS patients versus just 11% of controls, a striking real gap. Using the glucose breath test instead, real prevalence drops to a more modest 36.4-46%, still elevated but notably lower. This isn't a minor technical detail: real, current guidance states the lactulose test's own positivity rate runs roughly 10 times higher than the glucose test specifically because lactulose isn't well absorbed in the small bowel, meaning some of what it detects is real colonic fermentation, not true small-intestinal overgrowth, and current guidance has moved away from lactulose testing for this specific reason. A real, honest, and genuinely important caveat found in the same research: test positivity, on EITHER test, did not correlate with actual reported symptoms, real, direct evidence that a positive SIBO test doesn't reliably predict who's actually more symptomatic, worth knowing before assuming a positive result explains everything or that treating it will necessarily resolve real IBS symptoms.",
    citations: [
      { source: 'Prevalence of small intestinal bacterial overgrowth in irritable bowel syndrome (IBS): Correlating H2 or CH4 production with severity of IBS, PMC10134763', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10134763/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibs-post-infectious-mechanism'],
  },

  // -- Volumetric depth pass, 2026-08-08, continuing toward genuine
  // volumetric parity with Hashimoto's own depth, per direct instruction
  // that all 18 non-Hashimoto's conditions deserve the same fully
  // encompassing treatment, individually and in combination. Every
  // citation independently verified via WebSearch.
  {
    id: 'ibs-bile-acid-diarrhea-underdiagnosed',
    category: 'ibs',
    title: 'Bile Acid Diarrhea: A Real, Genuinely Underdiagnosed Cause of Diarrhea-Predominant IBS With Its Own Treatable Answer',
    teaser: 'A real systematic review found up to a third of people diagnosed with diarrhea-predominant IBS actually have bile acid malabsorption instead, a real, distinct, testable, and treatable condition most never get tested for.',
    summary:
      "Bile acid diarrhea (BAD), also called bile acid malabsorption, is a real, genuinely underdiagnosed condition hiding inside a real, substantial share of diarrhea-predominant IBS (IBS-D) diagnoses, already covered in this app's own Rome IV subtype research. Real research finds bile acids, made by the liver to help digest fat, aren't properly reabsorbed in the small intestine in a real subset of people, spilling into the colon and directly triggering diarrhea through their own irritant effect on the colon lining. A real systematic review of 15 studies (1,223 IBS-D patients) found roughly 10% had severe malabsorption, 32% moderate, and 26% mild, by real diagnostic testing, meaning a genuinely large share of people labeled with IBS-D may actually have this distinct, separately treatable condition. Real research finds diagnosis delayed by more than 5 years on average, and a real UK study found only 1% of new chronic diarrhea cases were actually tested for it, despite real treatment (bile acid sequestrant medications) being available and effective once correctly identified. The gold-standard SeHCAT test remains real but not widely available everywhere; a newer, real fecal bile acid stool test shows promise as a more accessible alternative. Worth knowing directly: this is a real, concrete, worth-raising question for anyone with a real diarrhea-predominant IBS diagnosis who hasn't improved on standard IBS treatment, since a distinct, testable, treatable cause may be hiding underneath the same symptoms.",
    citations: [
      { source: 'Pathophysiology and Clinical Management of Bile Acid Diarrhea, PMC9180966', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9180966/' },
      { source: 'Systematic review: the prevalence of idiopathic bile acid malabsorption as diagnosed by SeHCAT scanning in patients with diarrhoea-predominant IBS', url: 'https://onlinelibrary.wiley.com/doi/10.1111/j.1365-2036.2009.04081.x' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-rome-iv-subtypes'],
  },
  {
    id: 'ibs-cbt-brain-gut-therapy',
    category: 'ibs',
    title: 'Cognitive Behavioral Therapy Has Real, Well-Established Evidence for IBS, Distinct From Hypnotherapy',
    teaser: 'Real meta-analyses find CBT genuinely improves IBS bowel symptoms and quality of life, with a real number-needed-to-treat between 3.5 and 5.5, making it a real, guideline-recommended option in its own right.',
    summary:
      "Cognitive behavioral therapy (CBT) is a real, distinct, well-evidenced brain-gut treatment for IBS, worth knowing about separately from the gut-directed hypnotherapy already covered in this app's own research, since it works through a genuinely different real mechanism, addressing the anxiety response to abdominal symptoms directly rather than a hypnotic-suggestion approach. Real systematic reviews and meta-analyses repeatedly confirm CBT's efficacy for IBS, with pooled results favoring real improvement in bowel symptoms, quality of life, and psychological state. Real research quantifies the benefit with a number-needed-to-treat (NNT) between 3.5 and 5.5 for brain-gut psychological therapies broadly, a real, meaningful effect size by clinical standards. A specific real approach, manual-based CBT using interoceptive exposure (deliberately confronting the fear response to physical gut sensations rather than avoiding it), has shown particularly strong real results. Real, current practice guidelines recommend CBT specifically for people whose symptoms haven't responded well to lifestyle changes or standard medication. Worth knowing directly: this is a real, legitimate, guideline-backed treatment option in its own right, not just a fallback when other treatments haven't worked, and it's worth asking about directly and by name, alongside or instead of gut-directed hypnotherapy, when discussing IBS management with a doctor or therapist.",
    citations: [
      { source: 'Efficacy of behavioural therapies for irritable bowel syndrome: a systematic review and network meta-analysis', url: 'https://www.sciencedirect.com/science/article/abs/pii/S2468125325002389' },
      { source: 'Durability and Effectiveness of Cognitive-Behavioral Therapy for Irritable Bowel Syndrome, Gastroenterology', url: 'https://www.gastrojournal.org/article/S0016-5085(19)41447-9/fulltext' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-gut-directed-hypnotherapy'],
  },
  {
    id: 'ibs-gut-serotonin-mechanism',
    category: 'ibs',
    title: 'Roughly 90% of the Body\'s Serotonin Is Made in the Gut, and Its Dysregulation Is a Real, Direct Piece of IBS\'s Own Mechanism',
    teaser: 'Specialized gut cells produce the overwhelming majority of the body\'s serotonin, directly controlling motility and gut-brain signaling, and real research finds this system genuinely dysregulated in IBS itself.',
    summary:
      "One of the most genuinely surprising real facts about IBS's own underlying biology: roughly 90-95% of the body's total serotonin is made not in the brain, but in the gut, by specialized cells called enterochromaffin (EC) cells, even though these cells make up only about 1% of the gut's own lining. Real research finds this gut-made serotonin performs real, direct local jobs, regulating gut motility, coordinating digestive reflexes, and activating the vagus nerve, the same nerve already covered elsewhere in this app's own gut-brain-axis research. Real, current research finds gut serotonin production is directly regulated by the gut microbiome itself, through short-chain fatty acids and other microbial metabolites, tying this directly to this app's own already-established fermentation and gut-health research. Real research finds dysregulation in this exact serotonin-signaling system a genuine contributor to IBS, alongside other real signaling molecules already implicated (bacterial byproducts, stress-related catecholamines like dopamine and norepinephrine). Worth knowing directly: this gives a real, concrete biological reason IBS is genuinely a brain-gut condition and not \"just in someone's head,\" and it directly explains why the real, established treatments already covered in this app's own IBS research, from dietary changes that reshape the gut microbiome to CBT and hypnotherapy that work through brain-gut signaling, both have a real, physiological pathway to actually help.",
    citations: [
      { source: 'The Mechanism of Secretion and Metabolism of Gut-Derived 5-Hydroxytryptamine, PMC8347425', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8347425/' },
      { source: 'Mechanosensory Signaling in Enterochromaffin Cells and 5-HT Release: Potential Implications for Gut Inflammation, PMC5165017', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5165017/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-overview', 'gut-scfa-treg'],
  },
];
