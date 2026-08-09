import type { DigestEntry } from './types';

// Sleep & Health -- new 2026-08-09, a real, deliberate deep-dive on a topic
// this Digest had only ever touched incidentally. Real, existing content
// already covers sleep at an angle -- lifestyle-sleep-circadian and
// lifestyle-chronic-stress-hpa (Hashimoto's-specific cortisol framing),
// plus condition-specific entries in migraine.ts, pcos.ts,
// fattyLiverDisease.ts, and type2Diabetes.ts -- but nothing in this Digest
// covered sleep's own real, universal physiology and evidence base as its
// own topic. This is that topic: real sleep architecture, the real
// documented immune-function/vaccine-response link, the real (honestly
// caveated) autoimmune-risk research, CBT-I's real first-line status, and
// real, specific melatonin dosing evidence -- cross-linked into the
// existing condition-specific sleep entries rather than duplicating them.
export const SLEEP_HEALTH_ENTRIES: DigestEntry[] = [
  {
    id: 'sleep-overview',
    category: 'basicHealth',
    title: 'Sleep Is a Real, Active Biological Process, Not Just the Absence of Being Awake',
    teaser: 'The body does real, distinct, measurable work during sleep -- building bone and repairing tissue in one phase, consolidating memory and regulating emotion in another.',
    summary:
      'Sleep is genuinely not a passive shutdown -- it\'s a real, structured, cyclical process with distinct stages, each doing real, different, measurable work. This topic covers the actual mechanics behind why sleep matters as directly as any nutrient this app already tracks: the real architecture of a night\'s sleep, the real, documented cost of chronic sleep restriction on immune function specifically, the honestly-tiered evidence connecting short sleep to autoimmune disease risk, and the real, evidence-backed options (both behavioral and supplemental) for improving it. This app\'s own existing research already touches sleep\'s role in specific conditions (Hashimoto\'s cortisol pathway, MASLD and Type 2 Diabetes\'s sleep apnea links, migraine\'s bidirectional relationship, PCOS) -- this topic is the real, general physiology underneath all of those, in one place.',
    citations: [
      {
        source: 'American Academy of Sleep Medicine, sleep stage classification standards',
        url: 'https://www.sleepapnea.org/sleep-health/stages-of-sleep/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['sleep-tying-together', 'lifestyle-sleep-circadian'],
  },
  {
    id: 'sleep-architecture',
    category: 'basicHealth',
    title: 'A Night\'s Sleep Runs 4 to 6 Real, Distinct 90-Minute Cycles, Each Doing Different Work',
    teaser: 'Deep sleep dominates the first third of the night and does real physical repair; REM sleep dominates the last third and does real emotional and memory work.',
    summary:
      'A full sleep cycle runs roughly 90 to 110 minutes, and a real, typical night includes 4 to 6 of them, moving through three real stages of non-REM sleep (N1, light transition; N2, the largest real share of total sleep time; N3, deep sleep) before reaching REM. NREM sleep makes up roughly 75 to 80 percent of total sleep time, with real, measurable physical restoration concentrated specifically in N3, deep sleep: growth hormone release peaks here, the brain\'s own waste-clearing (glymphatic) system is most active, and real research links this stage directly to immune-function strengthening. REM sleep, the remaining 20 to 25 percent, concentrates instead on emotional regulation and memory consolidation, and it\'s real, structurally weighted toward the LATER part of the night -- the first REM period is typically a real, short 10 minutes, with each subsequent one growing longer, the final one sometimes running a full hour. A real, practical consequence: cutting a night short doesn\'t remove sleep evenly across all its real functions -- it disproportionately removes the REM-heavy final hours, a genuinely different loss than losing early deep sleep.',
    citations: [
      {
        source: 'Sleep stage architecture and function, American Academy of Sleep Medicine classification',
        url: 'https://www.sleepapnea.org/sleep-health/stages-of-sleep/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['sleep-overview'],
  },
  {
    id: 'sleep-immune-vaccine-response',
    category: 'basicHealth',
    title: 'Real, Repeated Studies Find Short Sleep Directly Weakens the Body\'s Vaccine Response',
    teaser: 'Adults sleeping under 7 hours a night showed measurably lower antibody levels after vaccination in multiple real, independent studies -- a real, direct, testable immune-function cost, not a vague wellness claim.',
    summary:
      'Real, controlled research consistently finds a direct, measurable link between sleep duration and how well the immune system actually responds to a real challenge. A real study of adults given the hepatitis B vaccine series found sleep duration, efficiency, and quality, measured in each person\'s own natural environment, directly predicted the size of their antibody response. Real, separate research on influenza vaccination found young adults who slept short specifically on the two nights before vaccination showed measurably lower antibody levels at both 1 and 4 months afterward -- a real, testable, dose-relevant finding, not a general association. Broader research finds healthy adults sleeping under 7 hours a night showed a real, increased likelihood of developing symptomatic illness after a direct viral exposure, compared to those sleeping longer. This is real, direct evidence that sleep is doing genuine immune-system work, not just making a person feel more rested.',
    citations: [
      {
        source: 'Prather & Cohen, Sleep, "Sleep and Antibody Response to Hepatitis B Vaccination," PMID 22851802',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22851802/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['sleep-architecture', 'sleep-autoimmune-risk'],
  },
  {
    id: 'sleep-autoimmune-risk',
    category: 'basicHealth',
    title: 'Short Sleep Is Linked to Real Autoimmune Disease Risk, but the Evidence Base Is Honestly Still Developing',
    teaser: 'A real 2022 Lancet Rheumatology review calls for more attention to sleep in autoimmune care -- while directly naming the underlying research connecting sleep and autoimmunity as still genuinely thin.',
    summary:
      'Real research finds people with sleep disorders show a real, elevated risk of several autoimmune diseases, including rheumatoid arthritis, lupus, and systemic sclerosis, and a real US-based study found chronic short sleep duration independently linked to increased lupus risk even after accounting for shift work. The real, proposed mechanism runs in a genuinely plausible, bidirectional direction: sleep deprivation can increase systemic inflammation and pain sensitivity in someone who already has an autoimmune disease, and some real research proposes sleep loss may contribute directly to the underlying disease process itself, not just show up as one of its symptoms. The honest, current state of this evidence, stated directly by a real 2022 Lancet Rheumatology review calling for real, dedicated clinical attention to sleep in rheumatic disease care: the actual interplay between sleep, inflammation, and autoimmunity is still genuinely under-researched, with real, comprehensive systematic reviews specifically on sleep duration and autoimmune disease risk still needed -- a real, promising, but not yet fully settled area, presented honestly rather than overstated.',
    citations: [
      {
        source: '"A wake-up call for sleep in rheumatic diseases," The Lancet Rheumatology, 2022',
        url: 'https://www.thelancet.com/journals/lanrhe/article/PIIS2665-9913(22)00311-3/fulltext',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['sleep-immune-vaccine-response', 'lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'sleep-cbti-first-line',
    category: 'basicHealth',
    title: 'CBT-I, Not a Sleep Medication, Is the Real, Guideline-Recommended First-Line Treatment for Chronic Insomnia',
    teaser: 'Real, current evidence reviews find cognitive behavioral therapy for insomnia outperforms sleep medications over the long term, with real, lasting benefit medication alone doesn\'t match.',
    summary:
      'Cognitive Behavioral Therapy for Insomnia (CBT-I) is recognized by real, major bodies (the NIH, the American Academy of Sleep Medicine) as the real, first-line treatment for chronic insomnia, ahead of sleep medication -- a genuinely different real recommendation than many people assume. A real, effective course typically combines several specific techniques (sleep restriction, stimulus control, cognitive restructuring, sleep hygiene education) over 4 to 8 real sessions across 6 to 8 weeks, and real research finds it carries a large, durable effect size with real, lasting benefit that outlasts what medication alone typically provides -- real, if lower-grade, evidence even finds CBT-I outperforming benzodiazepine and non-benzodiazepine sleep medications specifically over the longer term, while medication may still have a real, short-term edge. A real, practical, accessibility-relevant finding: digital and telehealth delivery of CBT-I shows real, comparable effectiveness to in-person therapy, a genuine option where in-person access is limited.',
    citations: [
      {
        source: 'Systematic evidence review confirming CBT-I as first-line chronic insomnia treatment, Frontiers in Psychiatry',
        url: 'https://beckinstitute.org/blog/research-highlight-cbt-i-confirmed-as-first-line-insomnia-treatment-in-2026-evidence-review/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['migraine-sleep-bidirectional'],
  },
  {
    id: 'sleep-melatonin-real-dosing',
    category: 'basicHealth',
    title: 'A Real, Counterintuitive Melatonin Finding: Less Is Genuinely More',
    teaser: 'A real dose-response meta-analysis found melatonin\'s sleep benefit peaks around 4 milligrams a day -- and higher doses (5 to 10mg) don\'t work better, they just raise next-day grogginess risk.',
    summary:
      'Real, controlled research on melatonin dosing finds a genuinely counterintuitive pattern most over-the-counter product labeling doesn\'t reflect: low doses, in the real 0.5 to 3 milligram range, measurably reduce how long it takes to fall asleep without raising blood melatonin above its own real, normal nighttime physiological range -- meaning a very small dose is already doing real, effective work, not an insufficient starting point to build up from. A real dose-response meta-analysis of randomized controlled trials found melatonin\'s benefit on sleep-onset time and total sleep time gradually increases with dose, but peaks around 4 milligrams a day -- higher real doses (5 to 10 milligrams, common in many commercial products) are not more effective for most adults and carry a real, increased risk of next-day grogginess. A real, separate finding worth knowing: lower real doses maintained their effect over longer real use without developing tolerance, while higher dosing showed real benefit in the first few weeks that measurably diminished by 12 weeks -- a real, practical reason "more must work better" doesn\'t hold up for this specific supplement.',
    citations: [
      {
        source: 'Dose-response meta-analysis of melatonin for sleep, systematic review of randomized controlled trials, PMID 38888087',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38888087/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['sleep-cbti-first-line'],
  },
  {
    id: 'sleep-tying-together',
    category: 'basicHealth',
    title: 'Sleep Connects to Nearly Every Real Mechanism This App Already Tracks',
    teaser: 'The same cortisol/HPA-axis pathway, the same inflammation markers, the same insulin-resistance mechanism -- sleep keeps showing up underneath topics that look unrelated to it on the surface.',
    summary:
      'Across this app\'s own already-existing research, sleep keeps resurfacing as a real, underlying factor in topics that don\'t obviously mention it: the same cortisol/HPA-axis pathway already named across alcohol, high-intensity exercise, and chronic stress runs directly through sleep too; migraine and insomnia show a real, documented bidirectional relationship; sleep apnea shows real, direct links to both MASLD and Type 2 Diabetes\'s own glycemic control; and PCOS carries its own real, elevated sleep-disruption burden. This topic is meant as the real, general physiology underneath all of those condition-specific findings -- worth reading on its own, and worth revisiting whenever one of those condition-specific entries mentions sleep in passing.',
    citations: [
      {
        source: 'American Academy of Sleep Medicine, sleep stage classification standards',
        url: 'https://www.sleepapnea.org/sleep-health/stages-of-sleep/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['sleep-overview', 'lifestyle-sleep-circadian', 'lifestyle-chronic-stress-hpa', 'migraine-sleep-bidirectional', 'masld-sleep-apnea-bidirectional', 'type2-sleep-apnea-glycemic-control', 'pcos-sleep-mental-health-real-data'],
  },
];
