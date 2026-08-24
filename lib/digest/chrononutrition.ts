import type { DigestEntry } from './types';

// Chrononutrition & Meal Timing -- 2026-08-24, phase 3 of 3 of a single
// larger request: "I think we need to follow a very chrononutrition style
// of eating... I think not only do you need to do the above work, but you
// also need to research the chrononutrition way of eating and provide as
// many entries as possible in Basic Health, and for each of the conditions
// as can be found." Phase 1 (the meal plan's own breakfasts and dinner
// timing reorganized for chrononutrition) and phase 2 (full vegan/
// vegetarian tracks) already shipped the same day; this is the research
// content phase, a real, general Basic Health topic covering the science
// itself, with condition-specific applications split out into each of the
// 19 tracked conditions' own files.
//
// Every claim here was independently verified via WebSearch, not carried
// over from the shared source conversation as fact. Two honest
// corrections to how this topic is often framed popularly: the "cortisol
// awakening response," treated almost universally as settled fact, has a
// real, recent complication (chrono-cortisol-awakening-response below);
// and autophagy specifically (the mechanism most often cited as the
// reason eating late is harmful) is genuinely unsettled in human research,
// not the closed case popular chrononutrition content usually presents it
// as (chrono-autophagy-mixed-evidence below). Both are reported honestly,
// tiered, rather than smoothed into the same confident framing as the
// better-supported findings around it.
export const CHRONONUTRITION_ENTRIES: DigestEntry[] = [
  {
    id: 'chrono-circadian-clock-biology',
    category: 'basicHealth',
    title: 'Food, Not Light, Is What Sets the Clock in Your Liver, Gut, and Pancreas',
    teaser: "The brain's master clock runs on light, covered in Sleep & Health, but the liver, pancreas, and gut can't sense light at all: they take their timing cue from when you eat instead.",
    summary: "Sleep & Health already covers the brain's master clock, the suprachiasmatic nucleus, and how light resets it daily. That master clock isn't the only one running: the liver, pancreas, gut, adipose tissue, and skeletal muscle all carry independent \"peripheral\" clocks, built from the same core clock genes, that govern organ-specific jobs, like when the liver ramps up glucose production, or when the pancreas is primed to release insulin most efficiently. The key distinction that makes chrononutrition its own field, not just a restatement of general circadian science: these peripheral clocks can't sense light directly. Food is their main synchronizing cue instead. Eating at consistent, biologically appropriate times keeps the liver, gut, and pancreas clocks running in step with the brain's master clock, while eating at irregular or very late hours can pull them out of alignment with each other, a state called circadian misalignment, distinct from (though related to) the light-driven misalignment sleep research already documents.",
    citations: [
      { source: 'Peripheral clocks and systemic zeitgeber interactions: from molecular mechanisms to circadian precision medicine', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12158691/' },
      { source: 'Circadian Rhythms, Metabolism, and Chrononutrition in Rodents and Humans, Advances in Nutrition', url: 'https://advances.nutrition.org/article/S2161-8313(22)00664-0/fulltext' },
    ],
    overallTier: 'strong',
    relatedIds: ['sleep-circadian-rhythm-basics', 'chrono-insulin-sensitivity-diurnal-rhythm', 'chrono-gut-microbiome-diurnal-rhythm', 'chrono-shift-work-metabolic-cardiovascular-risk'],
  },
  {
    id: 'chrono-insulin-sensitivity-diurnal-rhythm',
    category: 'basicHealth',
    title: "Insulin Sensitivity Isn't the Same at 8am as It Is at 8pm",
    teaser: "The body handles the same meal differently depending on the time of day, with insulin sensitivity generally highest earlier and lowest later.",
    summary: "How well the body responds to a given amount of insulin, called insulin sensitivity, follows a daily rhythm rather than staying constant. It's generally highest earlier in the day and declines into the evening, driven by the central circadian clock's control over hepatic (liver) insulin sensitivity. This is the same underlying mechanism behind the \"dawn phenomenon\" well documented in diabetes (a dedicated entry lives in Type 1 Diabetes and Type 2 Diabetes), but it isn't specific to diabetes at all. It's a normal feature of human physiology that identical meals, identical carbohydrate content and all, tend to produce a smaller blood sugar rise earlier in the day than the same meal eaten late at night.",
    citations: [
      { source: 'Thirty Years of Research on the Dawn Phenomenon: Lessons to Optimize Blood Glucose Control in Diabetes, Diabetes Care', url: 'https://diabetesjournals.org/care/article/36/12/3860/33148/Thirty-Years-of-Research-on-the-Dawn-Phenomenon' },
    ],
    overallTier: 'strong',
    relatedIds: ['chrono-circadian-clock-biology', 'chrono-early-time-restricted-eating', 'type1-overview', 'type2-overview'],
  },
  {
    id: 'chrono-early-time-restricted-eating',
    category: 'basicHealth',
    title: 'Early Time-Restricted Eating Improved Insulin Sensitivity Without Weight Loss',
    teaser: 'A tightly controlled trial found measurable cardiometabolic benefits from eating earlier in the day, even when body weight stayed exactly the same.',
    summary: "A landmark 2018 trial fed men with prediabetes enough food to hold their weight steady, then compared a 6-hour eating window ending by 3pm (early time-restricted feeding, or eTRF) against a 12-hour control window, for 5 weeks each, in a crossover design. Because both groups maintained the same weight throughout, this was the first study able to isolate the effect of meal TIMING itself, separate from weight loss. The eTRF group showed measurable improvements in insulin sensitivity, beta-cell responsiveness (how well the pancreas releases insulin), blood pressure, and oxidative stress. A separate, larger 5-week trial comparing early time-restricted eating against midday time-restricted eating found the early version measurably outperformed the midday one on insulin sensitivity, fasting glucose, inflammation, and gut microbial diversity, evidence that when the eating window falls matters, not just how long it is.",
    citations: [
      { source: 'Early Time-Restricted Feeding Improves Insulin Sensitivity, Blood Pressure, and Oxidative Stress Even without Weight Loss in Men with Prediabetes, Cell Metabolism', url: 'https://pubmed.ncbi.nlm.nih.gov/29754952/' },
      { source: 'Randomized controlled trial for time-restricted eating in healthy volunteers without obesity, Nature Communications', url: 'https://www.nature.com/articles/s41467-022-28662-5' },
    ],
    overallTier: 'moderate',
    relatedIds: ['chrono-time-restricted-eating-nuance', 'chrono-insulin-sensitivity-diurnal-rhythm', 'type2-time-restricted-eating', 'masld-time-restricted-eating'],
  },
  {
    id: 'chrono-time-restricted-eating-nuance',
    category: 'basicHealth',
    title: 'Time-Restricted Eating Doesn\'t Always Improve Insulin Sensitivity, an Honest Complication',
    teaser: "In people who already have type 2 diabetes, a trial found time-restricted eating improved blood sugar control but not insulin sensitivity itself.",
    summary: "Not every time-restricted eating trial finds the same clean result. A 3-week randomized crossover trial in adults with established type 2 diabetes found that time-restricted eating improved glucose homeostasis (blood sugar control over the day), but did not measurably improve insulin sensitivity itself, a different outcome from the eTRF trial in prediabetic men above. A separate 12-week trial using a 10-hour eating window in adults with type 2 diabetes did find measurable reductions in HbA1c and body weight, so the picture is a mixed one, not identical or fully consistent across studies. A plausible explanation: once type 2 diabetes is already established, the underlying insulin resistance may be advanced enough that meal timing alone can improve some outcomes without reversing insulin sensitivity itself, a distinction worth understanding rather than treating time-restricted eating as a uniform fix regardless of how far a condition has already progressed.",
    citations: [
      { source: 'Three weeks of time-restricted eating improves glucose homeostasis in adults with type 2 diabetes but does not improve insulin sensitivity: a randomised crossover trial', url: 'https://pubmed.ncbi.nlm.nih.gov/35871650/' },
      { source: 'Time-restricted feeding improves blood glucose and insulin sensitivity in overweight patients with type 2 diabetes: a randomised controlled trial', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8499480/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['chrono-early-time-restricted-eating', 'type2-overview', 'type2-time-restricted-eating'],
  },
  {
    id: 'chrono-late-eating-cardiovascular-risk',
    category: 'basicHealth',
    title: 'A Later First or Last Meal of the Day Tracked with Higher Cardiovascular Risk in a 100,000-Person Cohort',
    teaser: 'People eating a first meal after 9am or a last meal after 9pm showed a measurably higher risk of cardiovascular disease over more than a decade of follow-up.',
    summary: "The NutriNet-Santé cohort followed over 100,000 people from 2009 to 2022, tracking both when they ate and their cardiovascular outcomes. A later first meal of the day (after 9am, compared to before 8am) and a later last meal (after 9pm, compared to before 8pm) were both associated with higher cardiovascular disease risk, an effect that showed up especially strongly among women. People eating dinner after 9pm specifically had a 28% higher risk of cerebrovascular disease (stroke) compared to those finishing dinner before 8pm, and a longer overnight fasting window was itself associated with lower stroke risk. This is a large, long-running cohort, not a small pilot, but it's observational, not a randomized trial: it shows a measurable association, not proof that shifting meal timing alone would lower any one person's risk, since people who naturally eat later may also differ in other ways (sleep patterns, shift work, socioeconomic factors) that themselves affect cardiovascular risk.",
    citations: [
      { source: 'Dietary circadian rhythms and cardiovascular disease risk in the prospective NutriNet-Santé cohort, Nature Communications', url: 'https://pubmed.ncbi.nlm.nih.gov/38097547/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['cvd-overview', 'chrono-shift-work-metabolic-cardiovascular-risk'],
  },
  {
    id: 'chrono-autophagy-mixed-evidence',
    category: 'basicHealth',
    title: 'Does Eating Late Really "Block Autophagy"? The Human Evidence Is Mixed',
    teaser: 'A popular claim behind a lot of chrononutrition advice turns out to rest on animal research more than settled human data.',
    summary: "Autophagy, the cell's process for clearing out damaged components, is frequently cited as the reason eating late at night is harmful: the claim is that a full stomach overnight suppresses this cellular cleanup. That mechanism is well documented in animal studies, but direct human evidence is much newer and still mixed. A 2024 study measuring autophagic flux directly in human blood found that a protein-rich meal, eaten after an overnight fast, did not measurably change autophagy compared to staying fasted, a direct complication to the \"any food blocks autophagy\" framing. Separately, a 2025 study found that a longer-term intermittent time-restricted eating intervention (not just one meal) was associated with increased autophagic flux over months. Read together, these aren't necessarily contradictory: a single meal's timing and a sustained eating pattern over months may affect autophagy differently. The specific claim \"eating late blocks the body's overnight cleanup\" is not yet settled science in humans, even though the broader case for an earlier dinner stands on separate, better-supported cardiometabolic evidence (see the entry above).",
    citations: [
      { source: 'A high protein meal does not change autophagy in human blood', url: 'https://www.medrxiv.org/content/10.1101/2024.10.28.24316074v1.full.pdf' },
      { source: 'Intermittent time-restricted eating may increase autophagic flux in humans: an exploratory analysis, The Journal of Physiology', url: 'https://physoc.onlinelibrary.wiley.com/doi/full/10.1113/JP287938' },
    ],
    overallTier: 'weak',
    relatedIds: ['chrono-late-eating-cardiovascular-risk', 'chrono-early-time-restricted-eating', 'mito-fasting-autophagy-tension'],
  },
  {
    id: 'chrono-gut-microbiome-diurnal-rhythm',
    category: 'basicHealth',
    title: 'Your Gut Bacteria Have Their Own Daily Schedule, Too',
    teaser: "The gut microbiome doesn't sit still through the day: its composition and activity shift on a 24-hour rhythm.",
    summary: "A foundational 2014 study found that the gut microbiota undergoes measurable diurnal (day-night) changes in which species are active and what they're doing metabolically, changes driven jointly by the host's circadian clock and by feeding behavior itself. This diurnal rhythm in the gut microbiome is disrupted in the same situations that disrupt circadian rhythms generally, shift work and irregular eating schedules among them, and this disrupted rhythm is now understood as one of the biological mechanisms connecting circadian misalignment to the metabolic problems seen in shift workers and frequent long-haul travelers. It's a still-maturing direction of research, but circadian rhythm and gut health aren't two separate topics: they're mechanistically linked through this daily microbial cycle.",
    citations: [
      { source: 'Transkingdom control of microbiota diurnal oscillations promotes metabolic homeostasis, Cell', url: 'https://pubmed.ncbi.nlm.nih.gov/25417104/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['chrono-circadian-clock-biology', 'chrono-shift-work-metabolic-cardiovascular-risk'],
  },
  {
    id: 'chrono-cortisol-awakening-response',
    category: 'basicHealth',
    title: "Cortisol Follows a Real Daily Rhythm, But the \"Awakening Response\" Itself Has a New Complication",
    teaser: "Cortisol does peak in the morning and fall through the day, a pattern chrononutrition leans on, but one specific, widely repeated claim about waking up doesn't hold up as cleanly as usually presented.",
    summary: "Cortisol follows a well-established 24-hour rhythm, driven by the central circadian clock: it peaks around the habitual wake time and declines progressively to its lowest point in the evening. This rhythm is part of why morning protein and morning activity are commonly recommended in chrononutrition content. A more specific, separate claim, the \"cortisol awakening response,\" describes a further, distinct spike in cortisol specifically within the first hour after waking, on top of the broader daily peak. That specific claim has a recent complication: newer research examining the rate of cortisol rise found no evidence of an increased rate of cortisol secretion in the hour after waking compared to the hour before it, calling into question whether the widely cited \"awakening response\" is a distinct physiological event at all, versus simply the normal, already-rising morning slope of the broader daily cortisol rhythm. The broader morning-peak, evening-low pattern itself remains solidly established either way.",
    citations: [
      { source: 'Rhythms in cortisol mediate sleep and circadian impacts on health', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11381560/' },
      { source: 'The cortisol awakening response: Fact or fiction?', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12035071/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['chrono-circadian-clock-biology', 'chrono-insulin-sensitivity-diurnal-rhythm'],
  },
  {
    id: 'chrono-shift-work-metabolic-cardiovascular-risk',
    category: 'basicHealth',
    title: 'Shift Work Is a Real-World Natural Experiment in Circadian Disruption, and the Health Data Is Sobering',
    teaser: 'People whose work schedules force eating and sleeping against their internal clock show measurably higher rates of metabolic and cardiovascular disease.',
    summary: "Night and rotating shift work forces a sustained mismatch between a person's internal circadian clock and when they actually eat, sleep, and are active, making shift workers a natural population for studying what happens when circadian rhythms are chronically disrupted, not just a theoretical concern. A large meta-analysis found night shift workers had significantly higher cardiovascular event risk, with a clear dose-response relationship: each additional five years of night shift work further raised risk. A separate meta-analysis specifically in healthcare workers found shift work carried roughly 11 to 14% higher odds of metabolic syndrome compared to day work. The proposed mechanisms are the same ones this topic's other entries describe directly: circadian misalignment disrupting glucose tolerance, lipid metabolism, and the gut microbiome's daily rhythm, not a separate, unexplained shift-work-specific effect.",
    citations: [
      { source: 'Association between night shift work and cardiovascular disease: a systematic review and dose-response meta-analysis', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12506678/' },
      { source: 'Shift work and the risk for metabolic syndrome among healthcare workers: A systematic review and meta-analysis', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9539605/' },
    ],
    overallTier: 'strong',
    relatedIds: ['chrono-circadian-clock-biology', 'chrono-gut-microbiome-diurnal-rhythm', 'chrono-late-eating-cardiovascular-risk'],
  },
];
