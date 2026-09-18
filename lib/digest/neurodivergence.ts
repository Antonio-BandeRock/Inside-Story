import type { DigestEntry } from './types';

// Autism, ADHD and Dyslexia, added 2026-09-17, by direct instruction: "I
// want as much as possible to be provided about this in Basic Health and if
// any of them cross over into the tracked conditions, there should be
// entries made specifically."
//
// The hardest thing about writing this category was deciding what NOT to
// say. There is an enormous popular literature claiming diet treats autism
// and ADHD, and the honest research picture is much narrower: eating
// differences and nutrient shortfalls are common and worth
// attention, and that is not the same claim as food being a
// treatment. Every entry below holds that line, including the ones that
// report a positive trial, because the positive trials are small and their
// effect sizes shrink when publication bias is corrected for.
//
// So the shape of this category is: what the eating actually looks like,
// what the shortfalls actually are, what the trials actually found
// including the null ones, what tends to co-occur, and where any of it
// touches one of the 19 conditions this app tracks. That last
// group lives in the condition categories themselves, one entry each, and
// neuro-crossover-with-tracked-conditions below is the index into them.
//
// The app-side half of this work is lib/neuroProfile.ts (listing one in
// Profile, and which settings it switches on) and lib/textSpacing.ts (the
// reading settings). Neither touches food scoring, and nothing in this
// category asks them to.
export const NEURODIVERGENCE_ENTRIES: DigestEntry[] = [
  // ---------------------------------------------------------------- framing
  {
    id: 'neuro-overview',
    category: 'basicHealth',
    title: 'Why These Three Are in a Food App',
    teaser: 'Eating differences and nutrient shortfalls are common enough to be worth watching, and the rest of what this app does happens to be exactly the daily-living support that helps. Food is not a treatment for any of the three.',
    summary:
      'This app covers autism, ADHD and dyslexia for two reasons. The first is nutritional: narrow eating, sensory-driven food refusal and specific measurable shortfalls are well documented in autism, and the research on ADHD and diet is a substantial body of work with modest but measurable findings. The second reason has nothing to do with food at all. Most of what this app is, holding reminders, routines, appointments, bills, upkeep, a place to put a thought before it is gone, is the kind of outside scaffolding that helps anybody whose daily details will not stay in their head. What this topic does not do, anywhere, is claim that changing what you eat treats autism, ADHD or dyslexia. The trials that tested that are covered below, including the ones that found nothing, and diet is not a treatment for any of the three.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['neuro-not-a-tracked-condition', 'neuro-diet-does-not-treat', 'neuro-crossover-with-tracked-conditions', 'mentalhealth-adhd-ocd-diet-does-not-cause'],
  },
  {
    id: 'neuro-not-a-tracked-condition',
    category: 'basicHealth',
    title: 'Why These Are Listed in Your Profile Rather Than Tracked as Conditions',
    teaser: 'The 19 tracked conditions change what the app says about a food, because there is cited evidence tying that food to that condition. These three change which settings make sense, which is a different job.',
    summary:
      'Declaring one of the 19 tracked conditions changes food scoring: it changes what this app says about an ingredient, because there is cited evidence connecting that ingredient to that condition. Autism, ADHD and dyslexia do not work that way, and wiring them into the scoring engine would quietly assert that they do. So they sit in Profile alongside food allergies instead, listed rather than tracked. Listing one switches on the settings that go with it: a quieter Home, somewhere to throw a thought the moment you have it, reminders for routines and for the things that carry a date, roomier line spacing. Every one of those settings already exists and can be set by hand without listing anything, nothing is gated behind a declaration, and nothing is switched on without being shown to you first. The listing saves you the finding. It also stays on your phone: nothing here is shared with anybody you have connected to, and nothing here leaves the device. Taking a listing back off removes the listing and leaves the settings alone, because by then they are settings you are using.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['neuro-overview', 'neuro-dyslexia-what-this-app-changes'],
  },
  {
    id: 'neuro-diet-does-not-treat',
    category: 'basicHealth',
    title: 'The Diet Trials for Autism Were Small, and the Pooled Result Was Nothing',
    teaser: 'A Cochrane review found only two small randomized trials of the gluten-free, casein-free diet, too few to pool. A later meta-analysis managed six trials across 143 participants and found no effect on autism symptoms.',
    summary:
      'The gluten-free, casein-free (GFCF) diet is the most widely promoted dietary intervention for autism, and it has been tested. A Cochrane systematic review found only two small randomized controlled trials meeting its standard, 35 participants between them, which was too little to meta-analyse at all: the conclusion was that the evidence was insufficient, not that the diet worked. A later meta-analysis assembled six randomized trials totalling 143 participants and found no significant effect on core autism symptoms. That is a small evidence base by any standard. A null result of that size does not prove no individual child ever responds, and it does prove there is no demonstrated population-level benefit that would justify putting a child on a restrictive diet as a treatment. The cost side is not theoretical either, since removing gluten and dairy from the diet of a child who already eats a narrow range of foods removes more of the little that was being eaten. Where a specific food causes a specific problem for a specific person, that is worth finding, and this app has a food-trial tool for exactly that. It is a different claim from treating autism with diet.',
    citations: [
      { source: 'Gluten- and casein-free diets for autistic spectrum disorder, Cochrane Database of Systematic Reviews', url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD003498.pub3/full' },
      { source: 'Gluten-free and casein-free diets in the treatment of autism spectrum disorders: a systematic review, Research in Autism Spectrum Disorders', url: 'https://pubmed.ncbi.nlm.nih.gov/29649707/' },
    ],
    overallTier: 'strong',
    relatedIds: ['neuro-overview', 'neuro-autism-nutrient-shortfalls', 'neuro-adhd-restriction-diets'],
  },
  {
    id: 'neuro-autism-adhd-overlap',
    category: 'basicHealth',
    title: 'Autism and ADHD Co-Occur Often Enough That Reading About One Alone Gives a Partial Picture',
    teaser: 'A systematic review of co-occurring conditions in autism put ADHD at around 37%, and the range across studies runs from roughly 30% to 70% depending on how it is measured.',
    summary:
      'Until 2013 the diagnostic manuals did not permit the two diagnoses together at all, which is a large part of why the co-occurrence figures vary so much across studies: the older ones were counting something the rules did not let them count. Current systematic reviews of co-occurring conditions in autism put ADHD at roughly 37%, and across the wider literature the reported range runs from about 30% to 70%, moving with the age of the sample, the diagnostic criteria and whether the assessment was clinical or questionnaire-based. Two practical things follow. First, reading about one of them alone gives a partial picture of a person who has both, and the settings that suit them will be a mix rather than a matched set, which is why listing both in Profile turns on the union of what each asks for rather than the settings of whichever was tapped last. Second, the eating research divides along the same lines as the diagnoses, so someone with both may recognise the narrow-range, sensory-driven eating described in the autism entries below and the forgetting-to-eat, irregular-timing pattern described in the ADHD ones.',
    citations: [
      { source: 'Prevalence of co-occurring conditions in children and adults with autism spectrum disorder: a systematic review and meta-analysis, Neuroscience & Biobehavioral Reviews', url: 'https://www.sciencedirect.com/science/article/pii/S0149763423004050' },
      { source: 'Prevalence of attention-deficit/hyperactivity disorder in individuals with autism spectrum disorder: a meta-analysis, Research in Autism Spectrum Disorders', url: 'https://www.sciencedirect.com/science/article/abs/pii/S1750946721000349' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-overview', 'neuro-autism-feeding-differences', 'neuro-adhd-restriction-diets'],
  },
  {
    id: 'neuro-crossover-with-tracked-conditions',
    category: 'basicHealth',
    title: 'Where Autism and ADHD Overlap With the 19 Conditions This App Tracks, and Where They Do Not',
    teaser: 'Sixteen of the nineteen carry something documented enough for an entry inside that condition’s category, including one that came back negative. Three carry nothing, and saying so is part of the answer.',
    summary:
      'Autism and ADHD show documented associations with most of the conditions this app tracks, and each one is written up inside that condition’s category rather than summarised here, because it is written for somebody who already has that condition. Seven are about a parent’s condition and a child’s development, and they sit under Pregnancy & Family Planning: Hashimoto’s, Graves’, PCOS, rheumatoid arthritis, lupus and Sjögren’s each carry a finding, and multiple sclerosis carries a study that looked and found nothing, which is there so that silence is not mistaken for nobody having asked. Nine more are about the person themselves and sit under Whole-Body Effects: celiac disease, inflammatory bowel disease, IBS, cardiovascular disease, migraine, type 1 diabetes, type 2 diabetes, psoriasis and fatty liver disease. Three of the nineteen carry nothing, and naming them is part of the answer: chronic kidney disease, gout and prostate health. Gout is worth a sentence of its own, because a genetic-correlation analysis has suggested overlapping mechanisms with ADHD and no clinical study has followed it up, and a shared genetic signal is not an association between two diagnoses. Read all of this as observational. An association is not a cause, the absolute numbers behind these ratios are mostly small, and where a study was built to test whether shared family background explained the link, sometimes it did.',
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['neuro-overview', 'pregnancy-thyroid-offspring-neurodevelopment', 'celiac-adhd-crossover', 'ibd-autism-crossover', 'ibs-adhd-crossover', 'cvd-adhd-crossover', 'pcos-pregnancy-offspring-adhd'],
  },

  // ---------------------------------------------------------- autism, eating
  {
    id: 'neuro-autism-feeding-differences',
    category: 'basicHealth',
    title: 'Feeding Differences Are About Five Times More Common in Autistic Children, With Measurable Nutritional Consequences',
    teaser: 'A meta-analysis found feeding problems at an odds ratio of 5.11, alongside measurably lower calcium and protein intake than matched peers.',
    summary:
      'Sharp and colleagues pooled the available comparative research and found feeding problems roughly five times more common in autistic children than in peers, an odds ratio of 5.11 with a confidence interval of 3.74 to 6.97, which is a wide margin above no difference rather than a marginal finding. The same analysis found the nutritional consequence rather than just the behaviour: calcium intake lower by a standardised mean difference of 0.65 and protein intake lower by 0.58. This is not picky eating in the ordinary sense that most children grow out of. The pattern described in the research is narrower and more stable, driven by how a food feels, smells, sounds and looks rather than by whether it is liked, and it commonly holds to specific brands, specific temperatures and specific presentations. Treating it as a discipline problem does not work and makes mealtimes worse. The research supports watching the nutrition rather than the behaviour: knowing which nutrients a narrow range is short on, and widening from what is already accepted rather than replacing it.',
    citations: [
      { source: 'Feeding problems and nutrient intake in children with autism spectrum disorders: a meta-analysis and comprehensive review of the literature, Journal of Autism and Developmental Disorders', url: 'https://pubmed.ncbi.nlm.nih.gov/23408090/' },
    ],
    overallTier: 'strong',
    relatedIds: ['neuro-autism-nutrient-shortfalls', 'neuro-autism-arfid-overlap', 'neuro-autism-texture-and-narrow-eating'],
  },
  {
    id: 'neuro-autism-arfid-overlap',
    category: 'basicHealth',
    title: 'Avoidant/Restrictive Food Intake Disorder and Autism Overlap in Both Directions',
    teaser: 'Around 16% of people diagnosed with ARFID are autistic, and around 11% of autistic people meet ARFID criteria, against a general-population figure closer to 3%.',
    summary:
      'ARFID is the diagnosis for eating a range so narrow that nutrition, weight or daily functioning suffers, without the body-image concerns that define anorexia. A prevalence-based meta-analysis found autism in roughly 16.3% of ARFID groups and ARFID in roughly 11.4% of autistic groups, both several times the general-population rate of around 3%. Two things follow from that. The first is that narrow eating in autism is common but not automatically a disorder: the great majority of autistic people in these studies did not meet ARFID criteria, and the line is whether the narrowness is actually costing something measurable. The second is that when it is costing something, it has a name, a diagnosis and specialist treatment, and it is not a parenting failure or a phase. Feeding therapy for ARFID is an established field with tested approaches, and the signs that make it worth asking about are weight loss or faltering growth, dependence on supplements to meet basic needs, a range that keeps shrinking rather than holding steady, and distress or avoidance around eating that goes beyond preference.',
    citations: [
      { source: 'The co-occurrence of autism and avoidant/restrictive food intake disorder (ARFID): a prevalence-based meta-analysis', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11891632/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-autism-feeding-differences', 'neuro-autism-nutrient-shortfalls', 'neuro-words-used-here'],
  },
  {
    id: 'neuro-autism-nutrient-shortfalls',
    category: 'basicHealth',
    title: 'The Shortfalls That Turn Up, and Why Normal Growth Does Not Rule Them Out',
    teaser: 'Reviews put vitamin D deficiency at 25% and vitamin A at 24.8% in autistic children, and a case series of 76 children admitted with nutritional deficiency found scurvy in 69.7% of them, several with normal height and weight.',
    summary:
      'Where narrow eating persists, specific deficiencies follow, and they are not random. Reviews of nutritional status in autistic children report vitamin D deficiency at around 25.0%, vitamin A at 24.8%, B vitamins at 18.0%, calcium at 10.8% and iron at 9.6%. The sharp end of this is documented in a case series of 76 children admitted with a nutritional deficiency in the context of restrictive eating: 69.7% had scurvy from vitamin C deficiency, 17.1% had vitamin A-related eye disorders, and 70% had more than one deficiency at once. A number of these children had normal growth parameters. Height and weight tracking normally is the reassurance most often relied on, and it is the wrong instrument: a diet of crackers, chips and one brand of chicken nugget supplies enough energy to grow on while supplying almost no vitamin C, vitamin A or calcium. Scurvy in a well-grown child is a regularly reported presentation, and the first signs (sore legs, refusing to walk, bleeding gums, bruising) are commonly attributed to something else for months. If eating is narrow, the thing to watch is which nutrients the accepted foods do not contain, and the thing to raise with a clinician is a blood test rather than the growth chart.',
    citations: [
      { source: 'Nutritional deficiencies in children with autism spectrum disorders: a case series, Journal of Paediatrics and Child Health', url: 'https://pubmed.ncbi.nlm.nih.gov/34382290/' },
      { source: 'Nutritional status and nutrient intake in children with autism spectrum disorder: a review', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8912002/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-autism-feeding-differences', 'neuro-autism-texture-and-narrow-eating', 'vitaminc-deficiency-scurvy'],
  },
  {
    id: 'neuro-autism-gi-symptoms',
    category: 'basicHealth',
    title: 'Gastrointestinal Symptoms Are Around Four Times More Common, Which Changes What a Food Refusal Might Mean',
    teaser: 'A meta-analysis in Pediatrics found general GI symptoms at an odds ratio of 4.42, constipation at 3.86 and diarrhea at 3.63 compared with matched controls.',
    summary:
      'McElhanon and colleagues pooled fifteen studies and found autistic children significantly more likely to report gastrointestinal symptoms than controls: an odds ratio of 4.42 for GI symptoms overall, 3.86 for constipation and 3.63 for diarrhea. Pain that cannot be described easily gets expressed some other way, and a child who has become reluctant about food, or whose behaviour has changed around mealtimes, may be reporting abdominal pain in the only available language. Constipation in particular is easy to miss and easy to treat, and it is worth ruling out before a food refusal is read as a preference or a behaviour. The direction of the association is not settled: restricted eating that is low in fibre and fluid plausibly causes some of the constipation, and discomfort plausibly causes some of the restriction, and the research so far cannot separate those. That uncertainty does not affect the practical advice, which is to have the GI symptoms looked at as GI symptoms.',
    citations: [
      { source: 'Gastrointestinal symptoms in autism spectrum disorder: a meta-analysis, Pediatrics 2014;133(5):872', url: 'https://pubmed.ncbi.nlm.nih.gov/24777214/' },
    ],
    overallTier: 'strong',
    relatedIds: ['neuro-autism-feeding-differences', 'ibd-autism-crossover', 'ibs-adhd-crossover'],
  },
  {
    id: 'neuro-autism-texture-and-narrow-eating',
    category: 'basicHealth',
    title: 'Texture Is Usually the Thing, and Widening From What Already Works Beats Replacing It',
    teaser: 'Sensory-driven food refusal tracks how a food feels in the mouth more than how it tastes, which is why an unfamiliar food that matches an accepted texture has a better chance than a familiar food in a new form.',
    summary:
      'Across the feeding research, the property that predicts whether a food is accepted is most often texture rather than flavour: how it resists the teeth, whether it is uniform or mixed, whether it is wet, whether it changes as it is chewed. Mixed textures in one mouthful are the most commonly refused, which is why a casserole fails where each of its parts might have been eaten separately. Offering a completely different food and hoping is close to random. Offering something that matches an already-accepted food on texture, and changing one property at a time, is the approach that feeding therapists use, and it is usually called food chaining: a crisp, dry, pale cracker leads more easily to a different crisp, dry, pale cracker than to anything soft or wet, whatever the nutritional argument for the soft wet thing. Two more things the research supports. Repeated neutral exposure with no pressure to eat does more than any single mealtime, and pressure reliably makes acceptance worse rather than better. And the point of widening a range is coverage of the nutrients the current range misses, not variety for its own sake, so knowing which nutrients are actually thin comes before deciding what to aim at.',
    citations: [
      { source: 'Feeding problems and nutrient intake in children with autism spectrum disorders: a meta-analysis and comprehensive review of the literature, Journal of Autism and Developmental Disorders', url: 'https://pubmed.ncbi.nlm.nih.gov/23408090/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-autism-feeding-differences', 'neuro-autism-nutrient-shortfalls', 'neuro-words-used-here'],
  },

  // ------------------------------------------------------------ ADHD, eating
  {
    id: 'neuro-adhd-restriction-diets',
    category: 'basicHealth',
    title: 'Elimination Diets for ADHD Have a Measurable but Small Pooled Effect',
    teaser: 'A meta-analysis of restriction diets found a standardised effect of 0.29, small but above zero, and substantially smaller than the individual trials that made the diets famous.',
    summary:
      'The trials that made elimination diets famous for ADHD reported striking results: the INCA trial in The Lancet found a meaningful symptom reduction in 64% of the children placed on a strict restricted diet, with relapse on reintroduction. When Nigg and colleagues pooled the restriction-diet literature rather than reading any single trial, the effect held but shrank, to a standardised mean difference of about 0.29 with a confidence interval of 0.07 to 0.53. That is small, and it is above zero. A restricted diet is not nothing, and it is also not a treatment on the scale the individual trials suggested, and the people who respond are a subset rather than the average child. There is a practical reason the pooled figure is the one to plan against: an elimination diet is expensive in effort, it narrows what a child eats at exactly the point where narrow eating is already a risk, and it usually needs supervision to avoid creating a nutritional problem while looking for a behavioural one. Where a specific food matters for a specific person, a structured trial of that food under guidance is the way to find out, and this app has a food-trial tool built for it.',
    citations: [
      { source: 'Meta-analysis of attention-deficit/hyperactivity disorder or attention-deficit/hyperactivity disorder symptoms, restriction diet, and synthetic food color additives, Journal of the American Academy of Child & Adolescent Psychiatry', url: 'https://pubmed.ncbi.nlm.nih.gov/22176942/' },
      { source: 'Effects of a restricted elimination diet on the behaviour of children with ADHD (INCA study): a randomised controlled trial, The Lancet', url: 'https://pubmed.ncbi.nlm.nih.gov/21296224/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-adhd-food-colours', 'mentalhealth-adhd-dietary-triggers', 'neuro-diet-does-not-treat'],
  },
  {
    id: 'neuro-adhd-food-colours',
    category: 'basicHealth',
    title: 'Artificial Food Colours: a Small Effect That Got Smaller When Publication Bias Was Corrected For',
    teaser: 'The pooled effect of synthetic colours on ADHD symptoms was 0.18, falling to about 0.12 once the missing negative studies were accounted for. European regulators declined to call it causal, and lowered three intake limits anyway.',
    summary:
      'The Southampton trial in The Lancet found a mixture of artificial colours with sodium benzoate measurably increased hyperactivity in the general child population, which is why this question stayed open. Pooling the wider literature gives a smaller number: Nigg and colleagues found a standardised effect of about 0.18 for synthetic food colours, dropping to roughly 0.12 after adjusting for publication bias, the tendency of studies that found nothing to never appear. The regulatory response went both ways, and is often reported as having gone only one. The European Food Safety Authority reviewed the evidence and did not consider a causal link to ADHD substantiated, and separately lowered the acceptable daily intakes for three of the colours involved on other grounds. At population level the effect is small, it is plausibly larger in a subset, avoiding synthetic colours is one of the few dietary changes that costs essentially nothing nutritionally, and it should not be expected to do much on its own.',
    citations: [
      { source: 'Meta-analysis of ADHD or ADHD symptoms, restriction diet, and synthetic food color additives, Journal of the American Academy of Child & Adolescent Psychiatry', url: 'https://pubmed.ncbi.nlm.nih.gov/22176942/' },
      { source: 'Food additives and hyperactive behaviour in 3-year-old and 8/9-year-old children in the community: a randomised, double-blinded, placebo-controlled trial, The Lancet', url: 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(07)61306-3/abstract' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-adhd-restriction-diets', 'additive-synthetic-dyes', 'mentalhealth-adhd-dietary-triggers'],
  },
  {
    id: 'neuro-adhd-omega3',
    category: 'basicHealth',
    title: 'Omega-3 Supplementation for ADHD: Modestly Effective, Far Below Medication',
    teaser: 'Ten randomized trials across 699 children gave a pooled effect of 0.31 on ADHD symptoms, roughly a third of what stimulant medication achieves in the same measures.',
    summary:
      'Bloch and Qawasmi pooled ten randomized controlled trials covering 699 children and found omega-3 supplementation produced a small but statistically significant improvement in ADHD symptoms, a standardised mean difference of 0.31. Trials with a higher eicosapentaenoic acid (EPA) content tended to perform better, which is a consistent enough pattern across this literature to be worth noting rather than a confirmed dose-response relationship. Stimulant medication in the same outcome measures typically lands around three times that. The authors concluded that omega-3 supplementation is modestly effective, is not a replacement for established treatments, and may be reasonable as an addition, particularly where medication is not tolerated or not wanted. The wider nutritional case is separate and stronger, since adequate omega-3 intake matters for reasons that have nothing to do with ADHD, and oily fish is one of the foods most often absent from a narrow range.',
    citations: [
      { source: 'Omega-3 fatty acid supplementation for the treatment of children with attention-deficit/hyperactivity disorder symptomatology: systematic review and meta-analysis, Journal of the American Academy of Child & Adolescent Psychiatry', url: 'https://pubmed.ncbi.nlm.nih.gov/21961774/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-adhd-restriction-diets', 'mentalhealth-omega3-epa-dha', 'omega36-overview'],
  },
  {
    id: 'neuro-adhd-iron-ferritin',
    category: 'basicHealth',
    title: 'Ferritin Runs Lower in ADHD, but Serum Iron Does Not, Which Argues Against Routine Supplementing',
    teaser: 'A meta-analysis found lower serum ferritin in children with ADHD, with no difference in serum iron or transferrin. That combination is a reason to test, not a reason to supplement.',
    summary:
      'Tseng and colleagues pooled the comparative studies and found serum ferritin measurably lower in children with ADHD than in controls, while serum iron and transferrin showed no significant difference. Ferritin reflects stored iron and is also an inflammatory marker, so a lower ferritin with normal circulating iron is not the same picture as iron-deficiency anaemia and does not have the same answer. Iron status is worth measuring in a child with ADHD, particularly one whose eating is narrow or who eats little meat, and iron supplementation without a measured deficiency is not supported by this evidence and is not harmless: iron overload is a clinical problem and iron tablets are a leading cause of poisoning in young children. Test, then treat what the test shows. The same caution applies to the wider supplement literature for ADHD, where micronutrient trials have produced mixed results and the strongest case for supplementing anything remains a measured shortfall in that specific person.',
    citations: [
      { source: 'Peripheral iron levels in children with attention-deficit hyperactivity disorder: a systematic review and meta-analysis, Scientific Reports', url: 'https://pubmed.ncbi.nlm.nih.gov/29317744/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-adhd-omega3', 'iron-overview', 'mentalhealth-adhd-micronutrients-glycemic'],
  },

  // ------------------------------------------------------- dyslexia, reading
  {
    id: 'neuro-dyslexia-letter-spacing',
    category: 'basicHealth',
    title: 'Doubling the Space Between Letters Improved Reading Immediately, With No Training at All',
    teaser: 'In a PNAS study, dyslexic children read about 10% faster and made roughly half as many errors when letter spacing was doubled, replicated across two languages.',
    summary:
      'Zorzi and colleagues tested a change to the text rather than to the reader: doubling the space between letters, with no training, no practice and no warning. Dyslexic children of around ten years old read approximately 10% more quickly and made roughly 50% fewer errors, and the effect replicated across separate sessions, separate reading materials and separate groups of children reading Italian and French. The proposed mechanism is crowding, a well-established visual phenomenon in which recognising a letter is degraded by how close its neighbours are, and which is more pronounced in dyslexia. Two limits belong with this result. It is about the space between letters on a line, not the space between lines, and this app carries a setting for each, so this trial is the evidence behind the letter spacing one specifically rather than behind both. And an immediate gain in reading speed on a test passage is not the same as a long-term improvement in reading development, which the study did not measure and did not claim. How text is set has a measurable effect on how easily it is read, which is not a matter of preference.',
    citations: [
      { source: 'Extra-large letter spacing improves reading in dyslexia, PNAS 2012;109(28):11455', url: 'https://www.pnas.org/doi/full/10.1073/pnas.1205566109' },
    ],
    overallTier: 'strong',
    relatedIds: ['neuro-dyslexia-fonts', 'neuro-dyslexia-what-this-app-changes'],
  },
  {
    id: 'neuro-dyslexia-fonts',
    category: 'basicHealth',
    title: 'The Dyslexia-Specific Fonts Have Been Tested, and They Did Not Help',
    teaser: 'Studies of both OpenDyslexic and Dyslexie found no improvement in reading rate or accuracy. In one, not a single participant preferred the specialist font.',
    summary:
      'OpenDyslexic and Dyslexie are typefaces designed specifically for dyslexic readers, using weighted bottoms and distinctive letterforms on the reasoning that dyslexic readers confuse mirror-image letters. Both have been tested against ordinary fonts. Wery and Diliberto found no improvement in reading rate or accuracy with OpenDyslexic, and reported that no participant preferred it. Kuster and colleagues reached the same conclusion for Dyslexie across two experiments, finding no advantage over a standard font once size and spacing were controlled. Both specialist fonts are set with wider default spacing than the fonts they are compared against, and once the spacing is matched the advantage disappears. So the thing that helps is the spacing, which is measurable and adjustable in any font, and not the letterforms. These fonts are widely recommended and occasionally sold, and a reader who tries one and finds it does not help can reasonably conclude the problem is them. It is not.',
    citations: [
      { source: 'Effects of a specialized dyslexia font, OpenDyslexic, on reading rate and accuracy, Annals of Dyslexia', url: 'https://pubmed.ncbi.nlm.nih.gov/27193334/' },
      { source: 'Dyslexie font does not benefit reading in children with or without dyslexia, Annals of Dyslexia 2018', url: 'https://pubmed.ncbi.nlm.nih.gov/28455639/' },
    ],
    overallTier: 'strong',
    relatedIds: ['neuro-dyslexia-letter-spacing', 'neuro-dyslexia-what-this-app-changes'],
  },
  {
    id: 'neuro-dyslexia-what-this-app-changes',
    category: 'basicHealth',
    title: 'What This App Lets You Change About Its Text, and What Your Phone Already Does',
    teaser: 'Text size is your phone’s setting and this app has always followed it. Line spacing and letter spacing are this app’s settings, in Profile under Appearance.',
    summary:
      'Two separate things get confused for each other. Text size is set by your phone, not by this app, and this app follows it everywhere: turn it up in your phone settings and everything here comes up with it, including this page. On an iPhone that is Settings, then Accessibility, then Display & Text Size, then Larger Text. On an Android phone it is usually Settings, then Display, then Font size, though some phones keep it under Accessibility. Spacing is the part your phone does not touch, because raising the font size moves the lines apart by the same factor and the ratio of gap to letter never changes. That ratio is what makes lines run together. So Profile, under Appearance and Navigation, carries two settings of its own: line spacing, with a Roomy step set to the 1.5 times figure the accessibility standard asks for and a Roomier step past it, and letter spacing, which is the one with a randomized trial behind it. Both start off, both apply everywhere in the app at once, and both restart the app for a moment when changed, because the text styles are built when the app starts. Listing dyslexia in your Profile switches line spacing on and points you at the rest; you can set any of it by hand without listing anything.',
    citations: [
      { source: 'Web Content Accessibility Guidelines 2.1, success criterion 1.4.12 Text Spacing, W3C', url: 'https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html' },
    ],
    overallTier: 'strong',
    relatedIds: ['neuro-dyslexia-letter-spacing', 'neuro-dyslexia-fonts', 'neuro-not-a-tracked-condition'],
  },

  // ------------------------------------------------------- what comes with it
  {
    id: 'neuro-autism-epilepsy',
    category: 'basicHealth',
    title: 'Epilepsy in Autism: Around 10% Pooled, and Nearly Three Times Higher in Adults Than Children',
    teaser: 'A meta-analysis of 66 studies put pooled epilepsy prevalence at 10%, 7% in children and 19% in adults, against a general-population figure of around 1%.',
    summary:
      'Liu and colleagues pooled 66 studies and found epilepsy in about 10% of autistic people overall, with a confidence interval of 6% to 14%. The split by age is the part that matters practically: 7% in children and 19% in adults, against a general-population prevalence of roughly 1%. A rate that rises with age means new onset through adolescence and adulthood rather than a childhood condition that resolves, so this does not stop being relevant once someone is grown. The nutritional connection is indirect but concrete. Several anti-seizure medications deplete specific nutrients, carbamazepine and phenytoin affect vitamin D and folate in particular, and the ketogenic diet used for drug-resistant epilepsy is a medically supervised diet with monitoring requirements and is not something to attempt from a phone app. If seizure medication is in the picture, it belongs in My Meds, where this app’s interaction rules and depletion entries can see it.',
    citations: [
      { source: 'Prevalence of epilepsy in autism spectrum disorders: a systematic review and meta-analysis, Autism 2022', url: 'https://pubmed.ncbi.nlm.nih.gov/34955049/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-autism-anxiety-depression', 'depletion-overview'],
  },
  {
    id: 'neuro-autism-anxiety-depression',
    category: 'basicHealth',
    title: 'Anxiety and Depression Are Common in Autism, and Commonly Missed',
    teaser: 'Pooled figures put current anxiety at 27% and lifetime at 42%, current depression at 23% and lifetime at 37%.',
    summary:
      'Hollocks and colleagues pooled the available studies of autistic adults and found current anxiety in about 27% and lifetime anxiety in about 42%, with current depression at about 23% and lifetime depression at about 37%. All four figures sit well above general-population rates. Anxiety and depression often present differently here, and the presentation can be read as part of the autism rather than as a separate treatable thing. Increased rigidity, more repetitive behaviour, withdrawal from things previously enjoyed, more frequent shutdowns, or a change in eating or sleeping can all be a mood or anxiety disorder rather than a change in the autism, and they respond to treatment when they are recognised. This app’s Mental Health & Food topic covers the general biology, and none of it is a substitute for asking a clinician directly. If something has changed and stayed changed, that is the thing to raise.',
    citations: [
      { source: 'Anxiety and depression in adults with autism spectrum disorder: a systematic review and meta-analysis, Psychological Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/30178724/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-autism-sleep', 'mentalhealth-overview', 'mentalhealth-when-to-seek-help'],
  },
  {
    id: 'neuro-autism-sleep',
    category: 'basicHealth',
    title: 'Sleep Problems Are the Most Common Co-Occurring Difficulty, and They Feed Everything Else',
    teaser: 'A meta-analysis of 22 studies covering 3,771 participants found sleep disorders in 60% of autistic children and adolescents, with the wider literature reporting anywhere from 40% to 80%.',
    summary:
      'A recent meta-analysis of 22 studies covering 3,771 children and adolescents put the prevalence of sleep disorders in autism at 60%, and the wider literature spans roughly 40% to 80% depending on whether the measure is broad sleep disturbance or a formal diagnosis. Typically developing children sit around 20% to 30% by comparable measures. This matters beyond being tiring, because poor sleep amplifies almost everything else in this topic: sensory sensitivity increases, irritability and shutdowns increase, eating gets narrower rather than wider, and attention and mood both worsen. Sleep is often the highest-value thing to address first, before anything dietary is attempted. The evidence-based approaches are the ordinary ones, a consistent schedule, a predictable wind-down, light exposure in the morning and less of it at night. Melatonin has an evidence base in autism specifically, and it is a medication decision for a clinician rather than a supplement choice, because dose and timing both matter and the timing matters more than most people expect.',
    citations: [
      { source: 'Prevalence and associated factors of sleep disorders in children and adolescents with autism spectrum disorder: a meta-analysis and systematic review, BMC Psychiatry', url: 'https://pubmed.ncbi.nlm.nih.gov/42192550/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-autism-anxiety-depression', 'sleep-overview'],
  },
  {
    id: 'neuro-allergy-asthma-eczema',
    category: 'basicHealth',
    title: 'Allergic Conditions Turn Up More Often Alongside Autism and ADHD, From Survey Data',
    teaser: 'A large US survey analysis found food allergy, respiratory allergy and skin allergy all reported more often in children with autism or ADHD. It is parent-reported and cross-sectional, which limits what it can mean.',
    summary:
      'Xu and colleagues analysed the US National Health Interview Survey across 1997 to 2016 for children aged 3 to 17 and found food allergy, respiratory allergy and skin allergy each reported more often among children with autism or ADHD than among other children. Every diagnosis and every allergy in that dataset is parent-reported rather than clinically confirmed, and the design is cross-sectional, so it captures both conditions at one moment and can say nothing about which came first or whether either caused the other. A shared inflammatory or immune pathway is one plausible explanation, and differences in who gets assessed for what is another that this design cannot rule out. A diagnosed food allergy is a separate thing from sensory food refusal and needs separate handling, and if a food is causing a reaction rather than being disliked, that is a clinical question. This app keeps declared food allergies in Profile, and the matching it does is allergen-aware rather than allergy-safe: it flags what it recognises by name, which is not the same as a guarantee.',
    citations: [
      { source: 'Association of food allergy and other allergic conditions with autism spectrum disorder in children, JAMA Network Open 2018', url: 'https://pubmed.ncbi.nlm.nih.gov/30646205/' },
    ],
    overallTier: 'weak',
    relatedIds: ['neuro-autism-feeding-differences', 'neuro-autism-gi-symptoms'],
  },
  {
    id: 'neuro-maternal-autoimmune-and-neurodevelopment',
    category: 'basicHealth',
    title: 'Maternal Autoimmune Disease Shows a Small Association With Autism in Offspring',
    teaser: 'Pooled across studies, maternal autoimmune disease carried an odds ratio of 1.34 for autism in the child. Small, consistent, observational, and not a reason for anybody to change a treatment plan.',
    summary:
      'Meta-analysis across the available studies finds maternal autoimmune disease associated with autism in offspring at a pooled odds ratio of 1.34, with a confidence interval of 1.23 to 1.46, and maternal thyroid disease specifically at around 1.29. These are small effects on top of a low baseline rate: a 34% increase in a risk of roughly 1 in 50 is not a large absolute change. They are also observational, which means an association and not a cause, and several mechanisms could produce the same numbers, including shared genetics between the mother and child, maternal antibodies crossing the placenta, and inflammation during pregnancy. None of this is a reason to change anything. Untreated autoimmune disease in pregnancy carries known risks that are considerably better established than this association, and the treated condition is the safer one. This app tracks nine autoimmune conditions among its nineteen, and the condition-specific findings are in the condition categories themselves.',
    citations: [
      { source: 'Maternal autoimmune disease and risk of autism spectrum disorder in offspring: a systematic review and meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/35550523/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-crossover-with-tracked-conditions', 'pregnancy-thyroid-offspring-neurodevelopment', 'graves-pregnancy-offspring-neurodevelopment'],
  },
  {
    id: 'neuro-familial-autoimmune-adhd',
    category: 'basicHealth',
    title: 'ADHD and Autoimmune Disease Cluster in Families, Which Points at Shared Background Rather Than Cause',
    teaser: 'Swedish population registers found ADHD and autoimmune disease co-aggregating across relatives, a pattern that shared genetics explains more easily than one condition causing the other.',
    summary:
      'A study across Swedish population registers examined whether ADHD and autoimmune disease cluster within families, and found that they do: relatives of a person with ADHD had a raised rate of autoimmune disease and the reverse also held, with the association weakening as the relatives became more distant. When an association holds across relatives who never shared an environment and weakens with genetic distance, shared inherited background is the more economical explanation than one condition causing the other. This is the same kind of design that complicated the PCOS and offspring ADHD finding, where a cousin comparison substantially weakened what had looked like a prenatal effect. This stops a family-history pattern being read as somebody having caused something, and it shows that a sound statistical association can have no direct causal path underneath it at all.',
    citations: [
      { source: 'Familial co-aggregation of attention-deficit/hyperactivity disorder and autoimmune diseases, International Journal of Epidemiology 2022;51(3):898', url: 'https://pubmed.ncbi.nlm.nih.gov/34999875/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['neuro-maternal-autoimmune-and-neurodevelopment', 'neuro-crossover-with-tracked-conditions', 'pcos-pregnancy-offspring-adhd'],
  },

  // ------------------------------------------------------------- definitions
  {
    id: 'neuro-words-used-here',
    category: 'basicHealth',
    title: 'Words Used in This Topic',
    teaser: 'Executive function, sensory processing, interoception, stimming, masking, food chaining, ARFID and crowding, defined plainly.',
    summary:
      'Executive function is the set of mental tools used to start a task, hold a plan while carrying it out, switch between tasks and stop one thing to begin another. Difficulty here is the gap between knowing what to do and starting, which is why an outside system that holds the steps helps. Sensory processing is how the nervous system takes in and organises what the senses deliver, and differences in it can make ordinary noise, light, touch or texture painful rather than merely annoying. Interoception is the sense of the body’s internal state, hunger, thirst, temperature, needing the bathroom, and reduced interoception is one reason meals get missed without feeling hungry. Stimming is repetitive movement or sound that regulates that input, and it is usually useful rather than a symptom to suppress. Masking is the effort of performing as expected in social settings, and it is tiring and associated with worse mental health outcomes over time. Food chaining is the feeding-therapy approach of moving from an accepted food to a new one by changing a single property at a time rather than by replacing the food. ARFID, avoidant/restrictive food intake disorder, is the diagnosis for eating a range so narrow that nutrition, weight or daily functioning suffers, without the body-image concerns that define anorexia. Crowding is the visual effect where recognising a letter is made harder by how close its neighbours are, and is the proposed reason letter spacing changes reading speed.',
    citations: [],
    overallTier: 'strong',
    relatedIds: ['neuro-overview', 'neuro-autism-texture-and-narrow-eating', 'neuro-dyslexia-letter-spacing'],
  },
];
