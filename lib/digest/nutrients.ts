import type { DigestEntry } from './types';

// Nutrients & Micronutrients -- 8 entries. Selenium and myo-inositol are
// deliberately split into two entries (not combined) so the real, useful
// finding that the COMBINATION outperforms selenium alone is legible on
// its own, not buried inside selenium's own entry.
//
// 2026-08-07, same day, rewritten in the same narrative shape as the
// other categories already given this treatment -- every entry opens on
// a real hook, develops the finding, and closes on why it matters. Every
// underlying fact and citation is unchanged from the original pass.
export const NUTRIENTS_ENTRIES: DigestEntry[] = [
  {
    id: 'nutrient-selenium',
    category: 'nutrients',
    title: "Selenium: The Single Strongest-Evidenced Supplement in This App's Entire Research Base",
    teaser: 'Out of everything this app has researched, one supplement stands clearly above the rest in trial-level evidence -- with one honest caveat worth knowing.',
    summary:
      "If someone with Hashimoto's asked which single supplement has the most real trial evidence behind it, out of everything covered anywhere in this app, the honest answer is selenium, and it isn't particularly close. A systematic meta-analysis of 21 randomized controlled trials, 1,610 subjects combined, found selenium supplementation measurably reduces TPO antibody levels over 3-6 months -- the strongest trial-level evidence behind any Hashimoto's-specific supplement claim this app has researched anywhere. Worth knowing, though: a separate Cochrane Library review of the same general evidence base (a smaller slice, 4 studies, 463 participants) rated it unclear-to-high risk of bias and concluded the evidence was \"incomplete and not reliable to help inform clinical decision making.\" That's not a contradiction -- Cochrane's own methodology is deliberately stricter about bias risk than a typical meta-analysis -- but it's a real, honest reason to hold this tier a notch more provisionally than the larger meta-analysis alone would suggest. Still the strongest single finding in this entire research base, and still worth a real, honest asterisk rather than an unqualified endorsement.",
    citations: [
      {
        source: 'Selenium supplementation in patients with Hashimoto thyroiditis: a systematic review and meta-analysis of 21 studies (1,610 subjects)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10194801/',
      },
      {
        source: "Selenium Supplementation for Hashimoto's Thyroiditis: Summary of a Cochrane Systematic Review (European Thyroid Journal, 2014)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/24847462/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-myo-inositol'],
  },
  {
    id: 'nutrient-myo-inositol',
    category: 'nutrients',
    title: 'Myo-Inositol: A Real, Updated Finding -- Pairing It With Selenium Beats Selenium Alone',
    teaser: "The strongest supplement in this app's research just got a real, evidence-backed upgrade.",
    summary:
      "Selenium's own case above is already the strongest single finding in this app's research base. A 2024 update to the evidence found a way to make it stronger still. An updated meta-analysis found that myo-inositol, combined with selenium, outperforms selenium supplementation by itself for reducing TPO antibody levels -- a genuinely new supplement candidate this app's own research surfaced beyond what was already established for selenium alone, and specifically studied as a real combination, not myo-inositol taken on its own. Worth discussing alongside selenium itself, not as a replacement for it -- the real finding here is about the pairing, not about myo-inositol as an independent supplement with its own separate case.",
    citations: [
      {
        source: "Myo-Inositol Plus Selenium vs. Selenium Alone in Hashimoto's Thyroiditis with Subclinical Hypothyroidism: A Systematic Review and Updated Meta-Analysis",
        url: 'https://pubmed.ncbi.nlm.nih.gov/42122912/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-selenium'],
  },
  {
    id: 'nutrient-iodine',
    category: 'nutrients',
    title: 'Iodine: A Genuinely Two-Edged Nutrient -- Rare for a Single Nutrient to Work This Way',
    teaser: 'Most nutrients follow a simple rule: more is better, up to a point. Iodine breaks that rule in both directions at once.',
    summary:
      "Most of the nutrients in this category follow a familiar shape: not enough is a problem, and getting to \"enough\" solves it. Iodine is the real exception, and it's worth understanding exactly why. Iodine is required for thyroid hormone synthesis, so deficiency is a well-established cause of hypothyroidism worldwide -- the more familiar half of the story. But excess iodine intake, particularly a rapid increase from a previously deficient baseline, is separately documented as a real trigger for autoimmune thyroiditis in genetically susceptible people. That makes iodine a genuinely two-edged case where \"more is better\" simply doesn't hold, unlike most of the other nutrients in this category. A real, practical reason to track actual intake rather than supplement broadly on the assumption that more of a needed nutrient can only help -- see Problem Foods & Swaps for exactly where that assumption goes wrong in practice, with kelp and other iodine-heavy sea vegetables.",
    citations: [
      {
        source: "Iodine intake from universal salt iodization programs and Hashimoto's thyroiditis: a systematic review",
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12191997/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['additive-nitrates-nitrites', 'problem-excess-iodine-kelp'],
  },
  {
    id: 'nutrient-vitamin-d',
    category: 'nutrients',
    title: "Vitamin D: A Genuinely Mixed Picture -- Not the Clean Win It's Often Presented As",
    teaser: 'Vitamin D gets recommended almost reflexively for autoimmune disease. The real evidence is more honest, and more interesting, than that reflex suggests.',
    summary:
      "Vitamin D shows up in almost every general autoimmune-health conversation, usually recommended with more confidence than the actual research quite supports. The real evidence is authentically split, not one-sided: a positive meta-analysis links higher vitamin D status to lower TPO antibody levels, while a separate, placebo-controlled randomized trial found no significant effect of supplementation on thyroid autoimmunity markers. That specific pattern -- a real correlation, alongside unreliable intervention trials -- doesn't stop at Hashimoto's. It shows up independently in rheumatoid arthritis and multiple sclerosis too, confirmed three separate times across three genuinely different diseases studied by three different research groups with no reason to influence each other's results. Named explicitly in this app's own research as one real biological uncertainty, confirmed three separate times rather than once -- not a reason to dismiss vitamin D, but a real reason not to treat it as a settled, guaranteed fix either. See Gut & Microbiome's own CLDN2 entry for a second, independent mechanism that might explain part of the picture.",
    citations: [
      { source: 'Meta-analysis of the association between vitamin D and autoimmune thyroid disease', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4425156/' },
      {
        source: "Effect of vitamin D deficiency treatment on thyroid function and autoimmunity markers in Hashimoto's thyroiditis: a double-blind randomized placebo-controlled trial",
        url: 'https://pubmed.ncbi.nlm.nih.gov/29026419/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-vitamin-d-cldn2'],
  },
  {
    id: 'nutrient-zinc-iron-b12',
    category: 'nutrients',
    title: "Zinc, Iron & B12: Three Common Deficiencies That Overlap With Hashimoto's Symptoms -- and With Each Other",
    teaser: "Fatigue, hair thinning, brain fog -- and no easy way to tell, from symptoms alone, whether the thyroid or one of three separate deficiencies is actually responsible.",
    summary:
      "Someone with Hashimoto's feeling exhausted, noticing their hair thinning, struggling to think clearly, has every reason to assume it's the thyroid. Sometimes it is. Often, it's more complicated than that. Zinc, iron, and B12 deficiency are all independently common in Hashimoto's patients, and each one can independently cause fatigue, hair thinning, and cognitive symptoms that overlap heavily with thyroid symptoms themselves -- meaning a real deficiency in any of these three can be mistaken for, or can quietly compound, undertreated thyroid disease. Iron deficiency specifically goes one step further: it directly impairs thyroid peroxidase activity, a real, mechanistic interaction, not just a coincidental symptom overlap. Worth real bloodwork rather than assuming every symptom traces back to the same single cause -- three separate, checkable possibilities hiding behind what can look like one familiar complaint.",
    citations: [
      { source: 'Iron: Not Just a Passive Bystander in Autoimmune Thyroid Disease (Nutrients, 2022)', url: 'https://pubmed.ncbi.nlm.nih.gov/36364944/' },
      {
        source: "Evaluation of vitamin D and vitamin B12 levels in patients with and without Hashimoto's thyroiditis: a case-control study",
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12582684/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-zinc-carnosine'],
  },
  {
    id: 'nutrient-folate-antioxidants',
    category: 'nutrients',
    title: "Folate & Antioxidant Vitamins: A Real, Less-Discussed Link, Straight From This App's Own Literature Scan",
    teaser: "Not every real finding in this research base gets the attention selenium or vitamin D does -- these two get far less, despite being genuinely real.",
    summary:
      "Selenium and vitamin D dominate most conversations about nutrients and Hashimoto's. Two more nutrients turned up in this app's own literature scan with real, if quieter, findings attached to them. Folate status has been linked to autoimmune thyroiditis risk in real observational research, and specific antioxidant vitamins -- vitamin E, vitamin C, and retinol -- show a negative correlation with TPO antibody levels in separate studies. Both are genuine findings that get far less attention than selenium or vitamin D typically do. Worth naming even though the evidence base behind each is thinner and mostly observational rather than interventional -- an honest, appropriately modest tier, not a call to supplement aggressively based on correlation alone.",
    citations: [
      { source: 'Lower dietary folate intake increases the risk of autoimmune thyroiditis (NHANES-based study, Frontiers in Nutrition, 2025)', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12221903/' },
      {
        source: 'Effects of selenium and vitamin C on the serum level of antithyroid peroxidase antibody in patients with autoimmune thyroiditis',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30182359/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'nutrient-nigella-sativa',
    category: 'nutrients',
    title: "Nigella Sativa (Black Seed): A Real Candidate Sitting Entirely Outside This App's Existing Scoring",
    teaser: "Two independent randomized trials, real numbers on TSH and antibodies -- and this app hasn't even built a place to score it yet.",
    summary:
      "Not every real finding in this research base fits neatly into the six-dimension scoring system this app already uses. Nigella sativa -- black seed, or black cumin -- is a genuine example of research getting ahead of the app's own framework. An 8-week trial of 40 patients showed TSH dropping roughly 2.0 mIU/L on average, alongside reduced anti-TPO antibodies and increased T3 -- real, specific numbers, not a vague \"may help\" claim. A second, separately published trial in the same population found improved lipid and cardiometabolic markers on top of that. Currently outside this app's own D1-D6 scoring system entirely -- flagged here as a real, evidence-backed candidate worth a future closer look, not yet formally incorporated, and worth knowing about now rather than waiting for the scoring system to catch up to it.",
    citations: [
      {
        source: "The effects of Nigella sativa on thyroid function in patients with Hashimoto's thyroiditis: a randomized controlled trial",
        url: 'https://pubmed.ncbi.nlm.nih.gov/27852303/',
      },
      {
        source: "Powdered black cumin seeds strongly improves serum lipids, atherogenic index of plasma and anthropometric features in patients with Hashimoto's thyroiditis",
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5870944/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'nutrient-ashwagandha',
    category: 'nutrients',
    title: 'Ashwagandha: The Most Commonly Asked-About Herb in Hashimoto\'s Communities, With Real Trial Evidence Behind It',
    teaser: 'Nigella sativa already got its own entry here for real trial evidence. Ashwagandha, the herb Hashimoto\'s patients actually ask about most, hadn\'t -- until now.',
    summary:
      "Nigella sativa (black seed) already earned its own entry in this app for real, if newer, trial evidence -- but it's genuinely not the herbal supplement most commonly discussed in real Hashimoto's patient communities. That title belongs to ashwagandha, an adaptogenic herb used in Ayurvedic medicine for centuries, and it has real, if still limited, randomized trial evidence behind it too. A real double-blind, placebo-controlled trial of 50 subclinical hypothyroid patients (46 completed) found 8 weeks of 600mg daily ashwagandha root extract significantly improved TSH, T3, and T4 compared to placebo -- a real, measured effect, not just a traditional-use claim. Worth a real, honest caveat specifically because of how it works: as a real thyroid-hormone-raising herb, it carries a real, mechanistic reason for caution in anyone already hyperthyroid or being treated for Graves' disease, not just Hashimoto's -- adding a hormone-raising supplement on top of a condition that already has too much thyroid hormone is a real, avoidable risk, not a theoretical one. Worth discussing with a doctor before starting, the same standing advice this app gives for every real supplement candidate, especially given this evidence is still just one trial deep, not the multi-study depth selenium's own entry has.",
    citations: [
      { source: 'Sharma AK, Basu I, Singh S 2018 -- Efficacy and Safety of Ashwagandha Root Extract in Subclinical Hypothyroid Patients: A Double-Blind, Randomized Placebo-Controlled Trial (Journal of Alternative and Complementary Medicine)', url: 'https://pubmed.ncbi.nlm.nih.gov/28829155/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-nigella-sativa'],
  },
  {
    id: 'nutrient-iodine-supplement-caution',
    category: 'nutrients',
    title: 'Iodine Pills Are a Real, Different Risk Than Iodine-Rich Food -- Worth Knowing the Distinction',
    teaser: 'The same real warning this app already gives about kelp applies just as much to a bottle of "thyroid support" iodine tablets -- arguably more.',
    summary:
      "This app's own iodine entry above already makes the real case that iodine is a genuine exception to \"more is better\" -- excess intake, especially a sudden increase from a lower baseline, is a real, documented trigger for autoimmune thyroid flares in genetically susceptible people, and Problem Foods & Swaps already covers exactly how that plays out with kelp and other iodine-heavy sea vegetables. The same real mechanism applies at least as strongly, arguably more, to a genuinely different and easy-to-overlook source: standalone potassium iodide or iodine supplement pills, often marketed directly as \"thyroid support\" to the exact population -- people with a diagnosed thyroid condition -- most at risk of the excess-iodine trigger this app's own research already documents. A supplement pill makes it far easier to take a large, concentrated, precisely-repeatable dose than eating kelp ever would, which is exactly what makes it a genuinely higher-risk exposure route for the identical underlying mechanism, not a separate concern needing its own new evidence base. The real, practical takeaway: a \"thyroid support\" label on a supplement bottle is not, on its own, a reason to trust it's safe for a Hashimoto's-specific iodine level -- worth checking with a doctor before starting one, the same as any other supplement decision in this app.",
    citations: [
      {
        source: "Iodine intake from universal salt iodization programs and Hashimoto's thyroiditis: a systematic review",
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12191997/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-iodine', 'problem-excess-iodine-kelp'],
  },
  {
    id: 'nutrient-tying-together',
    category: 'nutrients',
    title: 'Tying It All Together: Which of These Actually Has the Strongest Evidence',
    teaser: 'Nine real nutrient entries, honestly ranked -- not by how often each one gets talked about, but by how strong its own actual evidence really is.',
    summary:
      "Read one at a time, all of these nutrients can start to sound equally important -- each entry makes its own real case, and none of them says \"skip this one.\" Read side by side instead, and they sort into a real hierarchy. Selenium, paired with myo-inositol, carries the strongest trial-level evidence of anything in this app's entire research base, with iodine's own two-edged deficiency/excess risk close behind as similarly well-established -- a risk that applies whether the source is food, kelp, or a supplement pill, not three separate concerns. Vitamin D, zinc/iron/B12, Nigella sativa, and ashwagandha sit in a real middle tier -- genuine mechanisms and real trial data, but each still resting on fewer, smaller trials than selenium's own much deeper evidence base. Folate and the antioxidant vitamins sit at the honest bottom -- real findings worth knowing, but thin and mostly observational. None of this is a reason to ignore the weaker entries. It's a reason to prioritize selenium and iodine status first if choosing where to actually start, and to treat everything below that as worth a real conversation with a doctor rather than aggressive self-supplementing based on a correlation alone.",
    citations: [
      {
        source: 'Selenium supplementation in patients with Hashimoto thyroiditis: a systematic review and meta-analysis of 21 studies (1,610 subjects)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10194801/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-selenium', 'nutrient-iodine'],
  },
];
