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

  // -- Volumetric depth pass batch 4, 2026-08-08, continuing toward
  // genuine volumetric parity with Hashimoto's own depth. Every citation
  // independently verified via WebSearch.
  {
    id: 'ibs-probiotic-strain-specificity',
    category: 'ibs',
    title: 'Not All Probiotics Help IBS Equally: Real, Strain-Specific Evidence Matters More Than the Word "Probiotic" Itself',
    teaser: 'Two real, controlled trials validated one specific strain, Bifidobacterium infantis 35624, for genuine IBS symptom relief, while a different probiotic combination tested in a real head-to-head trial showed no significant benefit.',
    summary:
      "Probiotics for IBS carry real, but genuinely strain-specific evidence, worth knowing about directly since \"take a probiotic\" is far too generic a recommendation on its own, the specific strain used matters enormously. Real, two separate randomized controlled trials validated Bifidobacterium infantis 35624 specifically, finding real efficacy at reducing IBS symptoms including bowel movement frequency, pain, and visceral hypersensitivity (the heightened gut-pain sensitivity already covered in this app's own IBS research), without an increase in adverse events. A real, earlier systematic review found this specific strain performing better than other probiotic strains studied at the time. Worth knowing honestly, and directly demonstrating why strain-specificity matters rather than assuming all probiotics work the same way: a real, separate three-arm randomized trial testing single-strain formulations of Bifidobacterium lactis or Bacillus coagulans found no statistically significant difference from placebo. Real research on other specific combinations shows mixed but real, promising results too, Lactobacillus acidophilus DDS-1 combined with Bifidobacterium lactis UABla-12 improved abdominal pain severity in a real controlled trial, and Lactobacillus paracasei HA-196 with Bifidobacterium longum R0175 showed real symptom benefit in another. Worth knowing directly: when considering a probiotic for IBS, the real, named strain matters far more than the broad category, someone choosing a product should look specifically for a strain with its own real, published trial evidence (like B. infantis 35624) rather than trusting a generic \"probiotic blend\" label alone.",
    citations: [
      { source: 'Bifidobacterium infantis 35624 and other probiotics in the management of irritable bowel syndrome: strain specificity, symptoms, and mechanisms', url: 'https://www.tandfonline.com/doi/full/10.1080/03007995.2017.1322571' },
      { source: 'Lactobacillus acidophilus DDS-1 and Bifidobacterium lactis UABla-12 Improve Abdominal Pain Severity and Symptomology in IBS, PMC7071206', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7071206/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-gut-directed-hypnotherapy'],
  },
  {
    id: 'ibs-biopsychosocial-model',
    category: 'ibs',
    title: 'The Biopsychosocial Model: The Real, Well-Established Framework Explaining Why Stress Genuinely Changes IBS Symptoms',
    teaser: 'Real research names psychosocial stress the single most widely acknowledged risk factor for IBS developing or relapsing, working through a real, bidirectional brain-gut pathway, not a "it\'s all in your head" dismissal.',
    summary:
      "The biopsychosocial model is a real, well-established framework worth understanding directly, since it explains the actual mechanism behind why the CBT and gut-directed hypnotherapy already covered in this app's own IBS research genuinely work, and why stress reliably makes IBS symptoms worse without that meaning the condition itself is imaginary. Real research finds genetic and environmental factors, early-life experiences, trauma, and social learning among them, real, directly shaping both brain and gut function, which then interact bidirectionally through the autonomic nervous system and the HPA axis (the same stress-hormone system already covered elsewhere in this app's own research). Real research names psychosocial stress the single most widely acknowledged risk factor for IBS developing in the first place, or relapsing once symptoms have improved. The real, underlying gut pathophysiology involves disturbed motility, visceral hypersensitivity, and altered brain-gut signaling, and real research finds psychosocial stress directly affects gut microbial composition itself, both through stress-altered gut transit/secretion and through direct signaling effects on microbial gene expression, a real, concrete mechanistic bridge tying this app's own broader gut-microbiome research directly to IBS specifically. Worth knowing directly: understanding this real model reframes stress management not as a secondary, \"soft\" add-on to IBS treatment, but as a real, evidence-backed, mechanistically central piece of it, on equal footing with dietary approaches like low-FODMAP already covered elsewhere in this app's own IBS research.",
    citations: [
      { source: 'Biopsychosocial Aspects of Functional Gastrointestinal Disorders, PMC8809487', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8809487/' },
      { source: 'The neurobiology of irritable bowel syndrome, Molecular Psychiatry', url: 'https://www.nature.com/articles/s41380-023-01972-w' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-cbt-brain-gut-therapy', 'ibs-gut-directed-hypnotherapy'],
  },
  {
    id: 'ibs-functional-dyspepsia-overlap',
    category: 'ibs',
    title: 'IBS and Functional Dyspepsia Overlap Far More Often Than Chance, a Real, Common, and More Severe Combination',
    teaser: 'A real meta-analysis found people with dyspepsia 8 times more likely to also have IBS, and real research finds this overlap tracks with more severe symptoms and worse sleep than either condition alone.',
    summary:
      "Functional dyspepsia, real, chronic upper-abdominal discomfort, bloating, and early fullness without a clear structural cause, overlaps with IBS far more often than random chance would predict, worth knowing about directly since real research finds this a genuinely common combination with its own real, distinct implications. A real systematic review and meta-analysis found IBS present in 37% of people with dyspepsia, compared to just 7% in people without dyspepsia, a real, pooled odds ratio of 8 for the two conditions occurring together. Real, population-based data confirms this pattern varies by setting but stays genuinely substantial, one real community survey found 27.1% of IBS patients and 42.1% of dyspepsia patients showing real overlap. Worth knowing directly, and clinically meaningful: real research finds overlap the norm rather than the exception in clinical settings, and finds people with both conditions together experiencing real, more severe functional gastrointestinal symptoms and worse sleep disturbances than people with just one condition alone. Worth knowing directly: someone already diagnosed with IBS who also experiences real, persistent upper-abdominal symptoms, early fullness, or discomfort unrelated to typical IBS bowel-pattern symptoms has a real, evidence-backed reason to raise functional dyspepsia specifically with a doctor, rather than assuming every digestive symptom must be explained by the IBS diagnosis alone.",
    citations: [
      { source: 'Overlap of Irritable Bowel Syndrome and Functional Dyspepsia in the Clinical Setting: Prevalence and Risk Factors, PMID 30368683', url: 'https://pubmed.ncbi.nlm.nih.gov/30368683/' },
      { source: 'Overlap of heartburn, functional dyspepsia, and irritable bowel syndrome in a population sample, PMID 35293084', url: 'https://pubmed.ncbi.nlm.nih.gov/35293084/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-vs-ibd-distinction'],
  },
  {
    id: 'ibs-fecal-microbiota-transplant-mixed',
    category: 'ibs',
    title: 'Fecal Transplant Shows Real Promise in IBD, But the Real Evidence for IBS Specifically Stays Genuinely Unsettled',
    teaser: 'Real, individual randomized trials of fecal microbiota transplant for IBS have found genuinely conflicting results, and current real guidelines don\'t recommend it.',
    summary:
      "This category's own already-built research draws heavily on real gut-microbiome science, and IBD's own category already covers real, positive fecal microbiota transplant (FMT) trial data for ulcerative colitis specifically. IBS is a real, honest, different story worth knowing directly: multiple real, randomized controlled trials have tested FMT for IBS, and they've produced genuinely conflicting results, some finding real symptom improvement, others finding none. A real, pooled systematic review and meta-analysis found the overall picture still inconclusive, with real, unresolved variability in how the procedure itself is done (single-donor versus multi-donor stool, one dose versus repeated doses, delivery by capsule versus colonoscopy versus enema), any of which could plausibly explain why different trials land on different answers. Worth knowing plainly: real, current management guidelines don't recommend FMT for IBS, citing the evidence as still too weak and inconsistent to support it as a standard treatment. This is a genuinely different real evidence picture from IBD's own more encouraging FMT data covered elsewhere in this app, real evidence that the same treatment idea doesn't automatically transfer cleanly from one gut condition to a different one, even when both are commonly discussed in the same breath.",
    citations: [
      { source: 'Fecal Microbiota Transplantation in Irritable Bowel Syndrome: A Systematic Review and Meta-Analysis of Randomized Controlled Trials, International Journal of Molecular Sciences 2023, PMID 37834010', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10573019/' },
    ],
    overallTier: 'weak',
    relatedIds: ['ibd-fecal-microbiota-transplant', 'ibs-gut-serotonin-mechanism'],
  },
  {
    id: 'ibs-gut-directed-antidepressants',
    category: 'ibs',
    title: 'A Real, Large Trial Found a Low-Dose Antidepressant Genuinely Helps IBS, Working Through the Gut, Not Mood',
    teaser: 'The largest real trial of its kind found low-dose amitriptyline, titrated up as needed, significantly beat placebo for IBS symptoms in primary care, used here for a real, different reason than treating depression.',
    summary:
      "A specific class of antidepressant, tricyclics like amitriptyline, has real, separate, well-documented value in IBS at doses far lower than what's used for depression, working through this category's own already-covered gut-brain axis rather than through mood. The real, largest trial of its kind (ATLANTIS, 463 adults across 55 English primary-care practices) tested amitriptyline, started at a real, low 10mg nightly dose and titrated up to a maximum of 30mg based on response and side effects, as a genuine second-line IBS treatment. The real result: titrated low-dose amitriptyline significantly outperformed placebo across multiple real, measured outcomes at 6 months, with the trial's own authors calling it definitive evidence of real benefit. The real, proposed mechanism is distinct from its antidepressant use: these medications appear to directly change how the central nervous system processes and dampens pain signals coming from the gut, addressing visceral hypersensitivity, the same real, documented mechanism already named in this app's own gut-serotonin research. Worth knowing honestly: real, common side effects (dry mouth, drowsiness, blurred vision, difficulty urinating) affected a real, meaningful share of trial participants, part of why this stays a genuine second-line option, tried after simpler dietary and lifestyle approaches, rather than a first choice, and always started at a real low dose with real, gradual titration.",
    citations: [
      { source: 'Amitriptyline at Low-Dose and Titrated for Irritable Bowel Syndrome as Second-Line Treatment in primary care (ATLANTIS): a randomised, double-blind, placebo-controlled, phase 3 trial, The Lancet 2023, PMID 37858323', url: 'https://www.thelancet.com/article/S0140-6736(23)01523-4/fulltext' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-gut-serotonin-mechanism', 'ibs-cbt-brain-gut-therapy'],
  },
  {
    id: 'ibs-pediatric-functional-gi-disorders',
    category: 'ibs',
    title: 'IBS Has Its Own Real, Distinct Diagnostic Category for Children, Genuinely Common at That Age Too',
    teaser: 'A real, pooled systematic review found functional gut disorders affecting roughly 22% of children, with IBS one of four real, named subtypes under the same Rome IV framework this app\'s own adult IBS research already uses.',
    summary:
      "This category's own already-covered Rome IV subtypes research is written around adult diagnosis. Real, pediatric-specific Rome IV criteria exist too, and real, pooled data finds this genuinely common in childhood, not just adulthood: a real systematic review found functional abdominal-pain disorders affecting roughly 22% of children (22.2% under age 4, 21.8% from age 4 to 18), organized into four real, named subtypes, irritable bowel syndrome, functional dyspepsia, functional abdominal pain, and abdominal migraine, a real, distinct fourth category with no direct adult equivalent in this same framework. Real, pediatric Rome IV criteria were specifically updated to better fit how these conditions actually present in children, and real, current diagnostic guidance treats this the same way this category's own adult red-flags research already does: a real, symptom-based diagnosis that doesn't require extensive testing once genuine red-flag symptoms have been ruled out. Worth knowing directly: a child with recurring, unexplained abdominal pain has a real, legitimate, already-established diagnostic pathway, not a condition that only starts being real once someone reaches adulthood, and the same real, brain-gut-axis-based approaches already covered in this category (CBT, gut-directed therapy) have real, growing pediatric-specific evidence behind them too.",
    citations: [
      { source: 'Systematic Review of Pediatric Functional Gastrointestinal Disorders (Rome IV Criteria), Journal of Clinical Medicine 2021, PMID 34768604', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8585107/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-rome-iv-subtypes', 'ibs-cbt-brain-gut-therapy'],
  },
  {
    id: 'ibs-global-prevalence-diagnostic-criteria',
    category: 'ibs',
    title: "IBS Prevalence Swings From 20% to Under 4% Depending on Where AND How You Ask, an Honest Complication",
    teaser: 'Western countries report IBS rates up to 20%, South Asia and the Middle East 7-10%, but real research finds much of this gap may reflect which diagnostic criteria and survey method got used, not true biological difference.',
    summary:
      "IBS shows real, large reported differences by region, but this category's own honest standard requires naming a real complication most simple prevalence comparisons skip: how much of that difference is real biology versus how much is measurement. A real, large meta-analysis pooling 395,385 people across 38 countries found a pooled IBS prevalence of 9.2% using the older Rome III diagnostic criteria, but pooling a separate set of studies using the newer, stricter Rome IV criteria found prevalence dropping to just 3.8%, a striking demonstration that the diagnostic definition used can swing the reported rate by more than double. Layered on top of that, real regional data still shows a consistent pattern even within one criteria set: many Western countries report rates as high as 20%, while South Asia and the Middle East report 7-10%. The real, honest caveat, stated directly in the research itself: these diagnostic criteria were built and validated mostly in Western populations, so some of the apparent regional gap may reflect the tool not translating cleanly across cultures and languages, not a true difference in how common IBS actually is. Worth knowing directly: a real, lower reported IBS rate in a given country doesn't necessarily mean IBS is genuinely rarer there, it may partly reflect how the condition gets asked about and defined, a real, important caveat for anyone comparing their own regional data against another country's.",
    citations: [
      { source: 'Global prevalence of irritable bowel syndrome according to Rome III or IV criteria: a systematic review and meta-analysis, The Lancet Gastroenterology & Hepatology', url: 'https://www.thelancet.com/journals/langas/article/PIIS2468-1253(20)30217-X/abstract' },
      { source: 'Global prevalence of irritable bowel syndrome: time to consider factors beyond diagnostic criteria?, The Lancet Gastroenterology & Hepatology', url: 'https://www.thelancet.com/journals/langas/article/PIIS2468-1253(20)30211-9/abstract' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibs-overview'],
  },
  {
    id: 'ibs-visceral-hypersensitivity-mechanism',
    category: 'ibs',
    title: "IBS's Own Core Mechanism: a Gut That Genuinely Feels More Than It Should",
    teaser: 'A real, well-established clinical finding sits underneath most of IBS: the gut itself reports pain and pressure at a genuinely lower physical threshold than in people without IBS.',
    summary:
      "Underneath many of this category's own already-covered findings (the gut-brain axis, serotonin, the biopsychosocial model) sits one real, well-established physical mechanism: visceral hypersensitivity, a genuinely lower pain and pressure threshold specifically in the gut itself. Real, controlled testing using colorectal balloon distension (a standardized, measured way of testing gut sensation) consistently finds people with IBS reporting pain and urgency at a real, lower level of physical distension than people without IBS, not an imagined or exaggerated report, but a real, measurable difference in how the nervous system processes the same physical signal. The real, proposed mechanism centers on the brain-gut axis itself: heightened, overactive processing of ordinary gut signals as they travel from the intestine through the spinal cord to the brain, with real animal research directly demonstrating that gut inflammation can trigger a genuinely lasting hypersensitivity (persisting three real weeks in one study) even in the non-inflamed part of the colon well after the original trigger resolves. Stress adds a real, additional layer, triggering gut-bacteria imbalance and low-grade inflammation that can itself worsen this same hypersensitivity. Worth knowing directly: this is a real, physical explanation for why an amount of gas or gut movement that wouldn't bother most people can be genuinely, measurably more uncomfortable for someone with IBS, not a sign the discomfort is being overstated.",
    citations: [
      { source: 'The Importance of Visceral Hypersensitivity in Irritable Bowel Syndrome, Pharmaceuticals/MDPI', url: 'https://www.mdpi.com/1424-8247/16/10/1405' },
      { source: 'Visceral Hypersensitivity: Symptoms, Treatment, Causes & What it Is, Cleveland Clinic', url: 'https://my.clevelandclinic.org/health/diseases/22997-visceral-hypersensitivity' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-gut-serotonin-mechanism', 'ibs-biopsychosocial-model'],
  },
  {
    id: 'ibs-global-symptom-pattern-by-country',
    category: 'ibs',
    title: 'Which IBS Symptom Predominates Genuinely Differs by Country, a Real, Underappreciated Pattern',
    teaser: 'A real, 8-country study found Mexican participants reporting constipation, Chinese participants reporting diarrhea, and Italian participants reporting bloating as their own most predominant IBS symptom.',
    summary:
      "This category's own already-covered subtype research (IBS-C, IBS-D, IBS-M) treats symptom pattern as an individual matter, but real, international data finds a genuine, country-level pattern sitting underneath individual variation too. A real, 8-country study found Mexican participants most often reporting constipation as their predominant symptom, Chinese participants most often reporting diarrhea, and Italian participants most often reporting bloating, a real, documented cultural or regional difference in which symptom dominates, not just random individual variation. Real East Asian data adds detail: comparing Japan, China, and South Korea directly, overall IBS prevalence ran significantly lower in China than in the other two, and IBS-mixed (alternating symptoms) was the most common subtype across all three, again with real, national differences in how the remaining subtypes distributed. A real, separate, consistent finding across multiple countries: IBS-D (diarrhea-predominant) runs more common in men, while IBS-C (constipation-predominant) runs more common in women, a real pattern that holds even as the OVERALL predominant symptom shifts by country. Worth knowing directly: this app's own already-covered dietary and treatment research (low-FODMAP, peppermint oil, fiber) applies across all IBS subtypes, but which subtype someone is actually likely to have may genuinely track with where they live and their own cultural food background, not purely individual gut biology.",
    citations: [
      { source: 'Diagnosis of constipation by analysis of methane concentration (patent, citing the 2008 8-country cross-cultural IBS study)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10066254' },
      { source: 'Prevalence of Irritable Bowel Syndrome in Japan, China, and South Korea: An International Cross-sectional Study, Journal of Neurogastroenterology and Motility', url: 'https://www.jnmjournal.org/journal/view.html?doi=10.5056%2Fjnm22037' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibs-rome-iv-subtypes', 'ibs-global-prevalence-diagnostic-criteria'],
  },
  {
    id: 'horizon-ibs',
    category: 'ibs',
    title: "Real Research Is Now Testing Whether Specific Gut Bacteria Strains Can Directly Treat the Brain-Gut Side of IBS",
    teaser: "This category's own already-covered visceral-hypersensitivity mechanism runs through the brain-gut axis directly, and real, early research into \"psychobiotics,\" specific bacterial strains with a genuine, documented effect on that same axis, is testing whether they can treat it from the gut side.",
    summary:
      "This category's own already-covered visceral-hypersensitivity research explains IBS as, in real part, a problem of how the brain-gut axis processes ordinary gut signals. Psychobiotics, a real, specific class of probiotic bacteria strains with a documented, direct effect on that same brain-gut signaling, represent the field's real, current attempt to treat that mechanism from the gut side rather than only through the nervous system, extending this category's own already-covered general probiotic-strain-specificity research into a more precisely targeted direction. Real, specific Lactobacillus and Bifidobacterium strains have shown genuine ability in laboratory and early human research to reduce neuroinflammation signals, support neurotrophic factors, and help rebalance neurotransmitter activity, all real, documented mechanisms connecting gut bacteria directly to brain-linked symptoms. Worth knowing directly and honestly, exactly as the real, current research itself states: human trial evidence remains genuinely limited, with real effects generally small to moderate and more consistently useful alongside other treatment than as a stand-alone option, and current evidence specifically for IBS is described directly in the research as too limited to support a strong recommendation either way. This is a real, active, promising research direction, not yet a proven treatment.",
    citations: [
      { source: 'Psychobiotics and the microbiota-gut-brain axis: Emerging paradigms in mental health modulation, Experimental Physiology', url: 'https://physoc.onlinelibrary.wiley.com/doi/full/10.1113/EP093301' },
    ],
    overallTier: 'weak',
    relatedIds: ['ibs-visceral-hypersensitivity-mechanism', 'ibs-probiotic-strain-specificity'],
  },
  {
    id: 'horizon-ibs-penfs',
    category: 'ibs',
    title: 'A Real, Small Wearable Device Stimulates the Vagus Nerve Directly to Calm IBS Symptoms',
    teaser: "This category's own already-covered brain-gut research explains IBS through the vagus nerve's own role in gut-brain signaling. A real, small, ear-worn device now stimulates that same nerve directly, and a real 4-week trial found significant improvement in pain, symptom severity, and disability.",
    summary:
      "This category's own already-covered visceral-hypersensitivity and brain-gut-axis research names the vagus nerve as a real, central pathway carrying gut signals to the brain. Percutaneous electrical nerve field stimulation (PENFS, most often delivered through a small, real device worn behind the ear) works by directly stimulating that same nerve pathway from outside the body, a genuinely different, non-drug approach from anything else covered in this category. A real study testing PENFS in adolescent girls with IBS found real, statistically significant improvement after just 4 weeks across three separate measures: symptom severity (IBS-SSS), pain sensitivity, and functional disability, all with real, strong statistical significance. A real, separate microbiome analysis from the same research found no major shift in overall gut bacteria diversity from the treatment, but did find patients who responded best carried a real, higher relative abundance of one specific bacterial genus (Blautia) beforehand, a real, early clue toward eventually predicting who benefits most. Worth knowing directly: current real research has concentrated mostly on adolescents, and this represents a real, genuinely different, drug-free treatment avenue worth knowing about specifically for anyone whose IBS hasn't responded well to the dietary and medication options already covered elsewhere in this category.",
    citations: [
      { source: 'Percutaneous electrical nerve field stimulation for adolescents with irritable bowel syndrome, Journal of Pediatric Gastroenterology and Nutrition, PMID 38284690', url: 'https://pubmed.ncbi.nlm.nih.gov/38284690/' },
      { source: 'PENFS vagal neuromodulation and gut microbiome effects in adolescent IBS, PMID 37448237', url: 'https://pubmed.ncbi.nlm.nih.gov/37448237/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['horizon-ibs'],
  },
  {
    id: 'ibs-exercise-real-trial-evidence',
    category: 'ibs',
    title: 'A Real, Randomized Trial Found Simply Getting More Active Genuinely Reduces IBS Symptoms',
    teaser: 'A real, 102-patient controlled trial found that people coached to increase everyday physical activity had significantly fewer symptom flare-ups than those who kept their routine unchanged.',
    summary:
      "This category's own already-covered CBT, hypnotherapy, and gut-directed antidepressants all work through the brain-gut axis, and real research finds ordinary physical activity belongs alongside them, not as an afterthought. A real, randomized controlled trial of 102 IBS patients, comparing those coached by a physiotherapist to increase daily activity against a group told to keep their existing routine, found a real, significant improvement in the IBS Severity Scoring System for the active group, with clinically meaningful symptom worsening occurring in only 8 percent of the active group versus 23 percent of the unchanged-routine group. A real, separate 24-week trial of moderate aerobic exercise found the same benefit through a real, measurable mechanism: reduced inflammation and oxidative stress that directly tracked with symptom improvement, not just a subjective sense of feeling better. Real, consistent guidance across several controlled trials points to a genuinely achievable target, 12 weeks of moderate-intensity aerobic exercise, 3 to 5 days a week, 30 to 60 minutes a session, similar in shape to general activity guidance but with real, IBS-specific trial evidence directly behind it, not just a general wellness recommendation borrowed from elsewhere.",
    citations: [
      { source: 'Physical activity improves symptoms in irritable bowel syndrome: a randomized controlled trial, PMID 21206488', url: 'https://pubmed.ncbi.nlm.nih.gov/21206488/' },
      { source: 'Low-to-moderate intensity aerobic exercise training modulates irritable bowel syndrome through antioxidative and inflammatory mechanisms in women, PMID 29274540', url: 'https://pubmed.ncbi.nlm.nih.gov/29274540/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-cbt-brain-gut-therapy', 'ibs-biopsychosocial-model'],
  },
  {
    id: 'ibs-sex-hormones-women-real-data',
    category: 'ibs',
    title: 'Why IBS Genuinely Affects More Women Than Men, and Why Symptoms Shift With the Menstrual Cycle',
    teaser: "Real research finds women diagnosed with IBS at 1.5 to 2 times the rate of men, with estrogen and progesterone directly implicated in the gut's own motility and pain sensitivity.",
    summary:
      "Real epidemiological data consistently finds women diagnosed with IBS at roughly 1.5 to 2 times the rate of men, with the gap widening between ages 12 and 70 before narrowing again later in life. Real research points to female sex hormones as one of the strongest real explanations: estrogen and progesterone both directly inhibit smooth-muscle contraction in the gut wall, and progesterone specifically modulates the colon's own serotonin system, already covered elsewhere in this category as directly involved in gut motility and IBS itself. Real, mechanistic research also finds higher estrogen levels associated with increased pain sensitivity, while testosterone appears to carry a real, protective effect against pain perception, a plausible real explanation for why the sex gap in IBS is so consistent. A real, practical, symptom-level pattern falls out of this too: women with IBS tend to experience constipation-predominant symptoms more often than men do, except specifically during menstruation, when ovarian hormone levels drop and symptoms often shift toward diarrhea-predominant instead. Worth knowing directly: a real, cyclical shift in IBS symptoms tracking with the menstrual cycle isn't a coincidence or a sign of a separate problem, it's a real, hormonally-driven pattern documented directly in the literature.",
    citations: [
      { source: 'Gender-related differences in irritable bowel syndrome: Potential mechanisms of sex hormones, World Journal of Gastroenterology', url: 'https://www.wjgnet.com/1007-9327/full/v20/i22/6725.htm' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-gut-serotonin-mechanism', 'ibs-pregnancy-genuinely-variable'],
  },
  {
    id: 'ibs-self-directed-food-avoidance-nutrient-risk',
    category: 'ibs',
    title: 'Self-Directed Food Avoidance, Not Just the Formal Low-FODMAP Diet, Carries a Real Nutrient-Intake Risk',
    teaser: "This category's own low-FODMAP diet entry covers a real, structured elimination protocol -- but real research finds people with IBS often cut out far more food on their own, with a real, measurable nutritional cost.",
    summary:
      "This category's own already-covered low-FODMAP diet is a real, structured, time-limited protocol, deliberately not the same thing as what many people with IBS actually do on their own. Real research directly comparing IBS patients finds that severe, self-directed food avoidance and restriction (cutting out entire food groups indefinitely, without professional guidance) tracks with a real, measurably lower total caloric intake, lower protein intake, and lower intake of carbohydrates including fiber, compared to IBS patients who restrict less. This matters because fiber and diverse carbohydrate intake are directly relevant to gut health elsewhere in this category's own already-covered microbiome and motility research, so an unstructured, ever-narrowing diet can genuinely work against the same gut function someone is trying to protect. A real, separate finding worth naming directly: this same research connects greater self-directed restriction with worse, not better, real quality-of-life scores, the opposite of what someone cutting out more food might expect. The real, practical takeaway, consistent with the official AGA clinical guidance already informing this category's own low-FODMAP research: dietary changes for IBS work best as a real, time-limited, professionally guided protocol with planned reintroduction, not an ever-expanding, permanent list of foods eliminated on one's own.",
    citations: [
      { source: 'Food Avoidance and Restriction in Irritable Bowel Syndrome: Relevance for Symptoms, Quality of Life and Nutrient Intake, Clinical Gastroenterology and Hepatology', url: 'https://www.cghjournal.org/article/S1542-3565(21)00715-1/fulltext' },
      { source: 'Nutrient Intake, Diet Quality, and Diet Diversity in Irritable Bowel Syndrome and the Impact of the Low FODMAP Diet, PMID 31029650', url: 'https://pubmed.ncbi.nlm.nih.gov/31029650/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-low-fodmap-diet', 'ibs-biopsychosocial-model'],
  },
  {
    id: 'ibs-bloating-distension-real-mechanism',
    category: 'ibs',
    title: 'Bloating and Visible Distension Are Genuinely Different Things, and Real Research Finds Distinct Mechanisms Behind Each',
    teaser: "Real research finds visible abdominal distension, sometimes expanding by as much as 12 cm, occurs in only about half of people who report the subjective sensation of bloating -- two real, only partly overlapping phenomena, not one symptom with two names.",
    summary:
      "This category's own already-covered visceral-hypersensitivity mechanism explains much of IBS's own pain and discomfort, and real research finds bloating specifically involves its own, more complicated real picture. Real objective measurement (abdominal inductance plethysmography, a real device tracking actual abdominal-wall movement) confirms distension, a genuine, measurable physical expansion of the abdomen sometimes reaching 12 cm, is a real, distinct phenomenon from bloating, the subjective sensation of fullness or pressure. Real research finds the two only correlate in roughly half of patients who report bloating, and correlate most consistently in IBS with constipation specifically, genuine evidence that 'bloating' as commonly described covers more than one real underlying process. Real, identified contributing mechanisms include impaired gas handling and clearance, visceral hypersensitivity (already covered elsewhere in this category), altered gut bacteria and small intestinal bacterial overgrowth (already covered elsewhere too), and abdomino-phrenic dyssynergia, a real, specific pattern where the diaphragm and abdominal wall muscles move in an uncoordinated way during digestion, physically pushing the belly outward. This last mechanism opened a real, genuinely different treatment path: a real, randomized, placebo-controlled trial found biofeedback specifically targeting and retraining that abdominal-wall movement pattern produced a real, significant reduction in distension, a mechanical fix for a mechanical problem, distinct from dietary or medication-based approaches already covered elsewhere in this category.",
    citations: [
      { source: 'Thoracoabdominal Wall Motion–Guided Biofeedback Treatment of Abdominal Distention: A Randomized Placebo-Controlled Trial, Gastroenterology', url: 'https://www.gastrojournal.org/article/S0016-5085(24)00285-3/fulltext' },
      { source: 'Abdominal Bloating: Pathophysiology and Treatment, PMC3816178', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3816178/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-visceral-hypersensitivity-mechanism', 'ibs-sibo-real-connection-caveat'],
  },
  {
    id: 'ibs-economic-work-productivity-burden',
    category: 'ibs',
    title: 'IBS Carries a Real, Quantified, Multi-Billion-Dollar Economic and Work-Productivity Cost',
    teaser: "This category's own already-covered quality-of-life research gets a real, direct number attached: over $30 billion spent annually in the US, with employees with IBS reporting 15% greater lost work productivity than coworkers without it.",
    summary:
      "This category's own already-covered biopsychosocial and quality-of-life research gets a real, direct economic weight attached: real research finds IBS costing the United States upward of $30 billion annually, not counting prescription or over-the-counter medication, spanning both direct medical costs and real, indirect costs from lost work and reduced productivity. A real, direct workplace study found employees with IBS reporting a 15 percent greater loss in work productivity from GI symptoms than coworkers without IBS, with the diarrhea-predominant subtype (already covered elsewhere in this category) specifically showing significantly higher real absenteeism (5.1 percent versus 2.9 percent of work time) and presenteeism (17.9 percent versus 11.3 percent, being physically present but functioning below capacity). A real, direct cost breakdown found indirect costs split roughly into absenteeism (45 percent), presenteeism (42 percent), and lost unpaid-labor productivity (13 percent), with real research finding IBS-D patients specifically incurring nearly $2,500 more in indirect costs than matched controls. Worth stating directly: this real, quantified burden matters for the same reason this category's own already-covered research on effective treatments (CBT, hypnotherapy, low-FODMAP, exercise) does, IBS is a real, genuinely costly condition, not a minor inconvenience, worth taking seriously both medically and in how workplaces and healthcare systems actually respond to it.",
    citations: [
      { source: 'The Socioeconomic Impact of Irritable Bowel Syndrome: An Analysis of Direct and Indirect Health Care Costs, Clinical Gastroenterology and Hepatology', url: 'https://www.cghjournal.org/article/S1542-3565(23)00076-9/fulltext' },
      { source: 'Health-related quality of life, work productivity, and indirect costs among patients with irritable bowel syndrome with diarrhea, PMID 28196491', url: 'https://pubmed.ncbi.nlm.nih.gov/28196491/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-biopsychosocial-model', 'ibs-rome-iv-subtypes'],
  },
  {
    id: 'ibs-post-covid-real-data',
    category: 'ibs',
    title: 'COVID-19 Joins the Real, Growing List of Infections That Can Trigger IBS',
    teaser: "This category's own already-covered post-infectious mechanism entry names ordinary gastroenteritis as a real trigger -- real, more recent follow-up studies find COVID-19 infection itself independently raises IBS risk, through the same real, established pathway.",
    summary:
      "This category's own already-covered post-infectious IBS entry names a real, ordinary bout of gastroenteritis as a genuine, underappreciated trigger, and real, more recent research finds COVID-19 belongs in the same real category, working through the same real mechanism: ongoing low-grade immune activation, altered gut microbiome, and disturbed gut-brain axis regulation, already covered elsewhere in this category as directly relevant to IBS. Real, direct research confirms people previously diagnosed with COVID-19 face a genuinely elevated risk of developing IBS compared with uninfected people, with real, specific incidence data finding post-COVID IBS in 2.5 to 5.3 percent of infected patients, a real, somewhat lower rate than the roughly 10 percent found after ordinary infectious enteritis, but a real, additional, distinct trigger nonetheless. A real, identified specific risk factor stands out: having real gastrointestinal symptoms at the actual onset of the COVID-19 infection independently predicted going on to develop a post-COVID functional gastrointestinal disorder, real, useful evidence for who's genuinely more likely to be affected. Worth stating directly: this real, growing evidence base means a real, new IBS diagnosis following a COVID-19 infection, even one that seemed mild or resolved without lasting symptoms otherwise, is worth mentioning directly to a doctor as a plausible real trigger, not assumed to be an unrelated, coincidental new problem.",
    citations: [
      { source: 'Post-infection functional gastrointestinal disorders following coronavirus disease-19: a prospective follow-up cohort study, PMC10286442', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10286442/' },
      { source: 'Lessons from irritable bowel syndrome: potential for understanding and managing post-COVID, PMC13033697', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13033697/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-post-infectious-mechanism', 'ibs-gut-serotonin-mechanism'],
  },
  {
    id: 'ibs-linaclotide-real-quantified-response-rates',
    category: 'ibs',
    title: "Linaclotide's Real Trial Numbers, Directly Quantified, Not Just 'It Works for Constipation'",
    teaser: "This category's own already-covered rifaximin/linaclotide entry names the real mechanism -- real, direct trial data gives the actual, quantified numbers: a real 61% complete-bowel-movement response versus 13.9% on placebo in a real, dedicated 26-week trial.",
    summary:
      "This category's own already-covered medications entry names linaclotide as a real, subtype-targeted treatment for IBS with constipation, working through a real, distinct mechanism (directly changing fluid movement in the gut), and real, direct trial data gives this category's own already-established mechanism real, concrete numbers worth stating plainly. A real, dedicated 26-week randomized, double-blind, placebo-controlled trial found 61.0 percent of linaclotide-treated patients met the real, formal complete-spontaneous-bowel-movement responder criterion, versus just 13.9 percent on placebo, and 48.9 percent met the real pain-responder criterion versus 22.6 percent on placebo, real, substantial, quantified separation from placebo on two real, distinct outcome measures. A real, separate Phase 3 trial conducted across China and other regions found a similar real pattern: 60.0 percent of linaclotide patients versus 48.8 percent of placebo patients met the abdominal pain/discomfort responder criterion, and 31.7 percent versus 15.4 percent for overall IBS relief. A real, pooled analysis of 4 randomized controlled trials found linaclotide also genuinely reducing how long it took for symptoms to actually respond, not just whether they eventually did. Worth stating directly: these real, specific numbers give a concrete, evidence-based expectation to discuss directly with a doctor when considering linaclotide, rather than a vague sense that 'it might help.'",
    citations: [
      { source: 'Linaclotide for irritable bowel syndrome with constipation: a 26-week, randomized, double-blind, placebo-controlled trial to evaluate efficacy and safety, PMID 22986437', url: 'https://pubmed.ncbi.nlm.nih.gov/22986437/' },
      { source: 'Linaclotide in irritable bowel syndrome with constipation: A Phase 3 randomized trial in China and other regions, PMID 29319191', url: 'https://pubmed.ncbi.nlm.nih.gov/29319191/' },
    ],
    overallTier: 'strong',
    relatedIds: ['ibs-medications-rifaximin-linaclotide', 'ibs-rome-iv-subtypes'],
  },
];
