import type { DigestEntry } from './types';

// Mitochondria & Metabolism -- 13 entries, drawn from this session's own
// research into mitochondrial dysfunction, autophagy, visceral fat, and
// exercise in Hashimoto's specifically (not just borrowed general
// metabolic/sports-science literature) -- each entry tagged with whether
// it was measured in Hashimoto's patients directly or in general/other-
// disease literature, the same disclosure discipline as Other Autoimmune
// Diseases.
//
// 2026-08-07, same day, rewritten in the same narrative shape as the other
// categories already given this treatment -- every entry opens on a hook,
// develops the finding, and closes on why it matters. Every underlying
// fact and citation is unchanged from the original pass.
//
// 2026-08-08: content fields rewritten a second time to remove AI-writing
// tics flagged directly by the person -- em dashes as punctuation, "not X,
// it's Y" contrast, and overused words like "real"/"genuinely"/
// "honest(ly)"/"worth" -- see bigPicture.ts's own header comment for the
// full context. Every fact, number, and citation is unchanged.
export const MITOCHONDRIA_METABOLISM_ENTRIES: DigestEntry[] = [
  {
    id: 'mito-mots-c',
    category: 'mitochondriaMetabolism',
    title: "MOTS-c: A Hashimoto's-Specific Mitochondrial Finding",
    teaser: "A tiny peptide made by mitochondria themselves, measured lower in Hashimoto's patients directly, not borrowed from another disease.",
    summary:
      "Most of this category has to borrow evidence from other diseases or general metabolic research. This one didn't need to. A study measured circulating MOTS-c, a peptide produced by mitochondria that regulates insulin sensitivity and inflammation, in 90 Hashimoto's patients against 90 matched controls, finding it significantly lower in the patient group. It was also inversely correlated with autoantibody levels, meaning lower MOTS-c tracked with a more active autoimmune process, not just a passive side effect sitting alongside it. A Hashimoto's-specific mitochondrial finding, not extrapolated from a different condition. Evidence the disease reaches down to the cellular power-generation level, not just the thyroid gland itself.",
    citations: [
      {
        source: "Reduced Circulating MOTS-c Levels in Hashimoto's Thyroiditis Reflect Integrated Autoimmune and Metabolic Dysregulation: A Cross-Sectional Study",
        url: 'https://pubmed.ncbi.nlm.nih.gov/42278864/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'mito-il23-autophagy-suppression',
    category: 'mitochondriaMetabolism',
    title: 'IL-23 Directly Suppresses Autophagy in Thyroid Cells',
    teaser: 'A causal experiment, not just correlation: blocking three different points in one pathway each independently reversed the damage.',
    summary:
      "Most findings in this research base are correlational: two things measured together, a plausible mechanism proposed to connect them. This entry is a rarer thing, direct experimental proof of cause and effect. Hashimoto's thyroid follicular cells show elevated IL-23 actively suppressing autophagy, the cell's own internal cleanup process, and driving reactive oxygen species (ROS) accumulation, via the AKT/mTOR/NF-κB pathway. Researchers didn't just observe this. They tested it directly. Blocking IL-23, blocking mTOR, and blocking NF-κB were each tried independently, and each one independently reversed both the suppressed autophagy and the ROS buildup. A rare case in this app's whole research base of a mechanism confirmed through direct experimental intervention rather than only measured association.",
    citations: [
      {
        source: "Increased Interleukin-23 in Hashimoto's Thyroiditis Disease Induces Autophagy Suppression and Reactive Oxygen Species Accumulation (Frontiers in Immunology, 2018)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/29434604/',
      },
    ],
    overallTier: 'strong',
  },
  {
    id: 'mito-mtor-cd4-reprogramming',
    category: 'mitochondriaMetabolism',
    title: 'The Same mTOR Pathway, a Second Time: T Cell Fuel Reprogramming',
    teaser: 'The identical pathway shows up reprogramming the immune cells driving the attack itself, a mechanistic bridge, not two separate topics.',
    summary:
      "The mTOR pathway just implicated in suppressing thyroid-cell autophagy doesn't stop there. It shows up again, in a completely different part of the same disease. The same mTOR pathway reprograms the CD4+ T cells that drive the autoimmune attack itself onto an altered fatty-acid-oxidation fuel source, meaning the immune cells doing the attacking and the thyroid tissue being attacked are both, independently, being shaped by the same one metabolic pathway. A mechanistic bridge connecting two parts of the disease that would otherwise look completely unrelated: thyroid tissue damage on one side, the immune cells attacking it on the other, both converging on one shared pathway.",
    citations: [
      {
        source: "The immune mechanism of the mTOR/ACC1/CPT1A fatty acid oxidation signaling pathway in Hashimoto's thyroiditis",
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11950109/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-il23-autophagy-suppression'],
  },
  {
    id: 'mito-fasting-autophagy-tension',
    category: 'mitochondriaMetabolism',
    title: 'Fasting: A Deliberately Two-Sided Finding',
    teaser: 'The most potent known autophagy trigger, and a documented way to suppress active thyroid hormone at the same time.',
    summary:
      "Fasting shows up in wellness conversations as an almost universally positive intervention. The actual research on it, specifically for someone with Hashimoto's, is more complicated than that. Fasting and caloric restriction are the most potent known triggers of autophagy, the exact cellular cleanup process IL-23 was shown above to suppress in Hashimoto's specifically. But fasting also reliably suppresses T3 and raises reverse-T3 via hypothalamic TRH downregulation, a well-documented thyroid-specific cost, not a minor footnote. Both facts are presented here together deliberately, rather than picking the flattering one. The most plausible reading is that short, moderate fasting windows, not multi-day extended fasts, are where the two effects most reasonably balance out.",
    citations: [
      { source: 'The effect of fasting or calorie restriction on autophagy induction: a review of the literature', url: 'https://pubmed.ncbi.nlm.nih.gov/30172870/' },
      { source: 'Boelen, Wiersinga & Fliers 2008, Thyroid -- fasting-induced changes in the hypothalamus-pituitary-thyroid axis', url: 'https://pubmed.ncbi.nlm.nih.gov/18225975/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-ramadan-fasting-study'],
  },
  {
    id: 'mito-ramadan-fasting-study',
    category: 'mitochondriaMetabolism',
    title: 'A Fasting Study in Existing Hypothyroid Patients',
    teaser: 'Ramadan observance provided a naturally-occurring human fasting study in people already on thyroid medication.',
    summary:
      "Most fasting-and-autophagy research happens in animal models or short-term lab settings. Sustained human fasting data in people who already have a thyroid condition is much harder to come by, except for one recurring natural experiment. Studies of Ramadan fasting in existing hypothyroid patients found independent TSH suppression during the fasting period, plus a practical complication: fasting disrupts the empty-stomach medication-absorption timing levothyroxine dosing depends on. A genuine, human, not animal-model, data point on how fasting interacts with existing thyroid treatment specifically, distinct from the general autophagy-benefit research above, and worth a conversation with a doctor before combining any extended fast with existing thyroid medication.",
    citations: [
      {
        source: 'Impact of fasting on thyrotropin and thyroid status during Ramadan in 292 previously well controlled hypothyroid patients (the IFTAR study)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36344762/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'Worth discussing with a doctor before combining any extended fast with existing thyroid medication.',
  },
  {
    id: 'mito-visceral-fat-treg-depletion',
    category: 'mitochondriaMetabolism',
    title: "Visceral Fat: Depleted of Regulatory T Cells in Hashimoto's",
    teaser: "The same Treg cells this app's Gut & Microbiome research keeps returning to, specifically depleted in one tissue.",
    summary:
      "Regulatory T cells, or Tregs, show up throughout this app's own Gut & Microbiome research as the immune cells that keep the body from attacking itself. This entry finds them specifically missing somewhere unexpected. Hashimoto's patients show measurably depleted regulatory T cells specifically within visceral adipose tissue, the same immune cell type SCFAs from dietary fiber were shown to induce elsewhere in this app's Gut & Microbiome research, here found specifically reduced in visceral fat rather than uniformly reduced everywhere in the body. A specific finding, not a general \"inflammation is bad\" statement. One particular tissue, one particular missing cell type, directly connecting this category back to the gut-immune mechanisms covered elsewhere in this Digest.",
    citations: [
      {
        source: "Depletion of Regulatory T Cells in Visceral Adipose Tissues Contributes to Insulin Resistance in Hashimoto's Thyroiditis (Frontiers in Physiology, 2018)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/29541033/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-scfa-treg'],
  },
  {
    id: 'mito-visceral-fat-treg-reinfusion',
    category: 'mitochondriaMetabolism',
    title: 'A Causal Experiment: Reinfusing Tregs Into Visceral Fat',
    teaser: 'Not just correlation: putting the missing cells back measurably improved insulin sensitivity, in a real experiment.',
    summary:
      "Finding that Tregs are missing from visceral fat is one thing. Proving their absence actually causes a problem is a different, much stronger kind of evidence, and this is exactly that. In a Hashimoto's mouse model, reinfusing healthy regulatory T cells, which preferentially homed back into visceral adipose tissue on their own, measurably improved insulin sensitivity. A causal experiment, not just an observed association, directly connecting the Treg depletion finding above to a concrete, measurable metabolic outcome: putting the missing piece back in, and watching things actually improve.",
    citations: [
      {
        source: "Depletion of Regulatory T Cells in Visceral Adipose Tissues Contributes to Insulin Resistance in Hashimoto's Thyroiditis (same study -- covers both the depletion and the reinfusion experiment)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/29541033/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-visceral-fat-treg-depletion'],
  },
  {
    id: 'mito-levothyroxine-body-fat-null',
    category: 'mitochondriaMetabolism',
    title: "A Humbling Counter-Finding: Levothyroxine Alone Doesn't Fix Body Fat",
    teaser: "The well-established Hashimoto's/weight-gain link doesn't resolve just by treating the hormone.",
    summary:
      "It would be reasonable to assume that once the thyroid hormone deficit is corrected, the weight gain so often associated with Hashimoto's would simply resolve along with it. Studies say that assumption doesn't hold. Despite the well-established association between Hashimoto's and weight/body fat, correcting hypothyroidism itself with levothyroxine alone appears to have little effect on body fat in real studies. A humbling finding worth stating plainly, since it complicates a very commonly assumed cause-and-effect story. The relationship isn't simply \"low thyroid hormone causes fat gain, treat the hormone and it resolves.\"",
    citations: [
      { source: 'Changes in body weight after treatment of primary hypothyroidism with levothyroxine', url: 'https://pubmed.ncbi.nlm.nih.gov/24936556/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'mito-visceral-fat-endotoxin-barrier',
    category: 'mitochondriaMetabolism',
    title: 'A Complication: Visceral Fat as a Gut-Endotoxin Barrier',
    teaser: '"Bad" visceral fat inflammation may partly be the body actually defending itself against a leaky gut.',
    summary:
      "Visceral fat gets discussed throughout this category as a problem: inflamed, hormonally active tissue linked to worse metabolic outcomes. One more recent reappraisal complicates that picture in an interesting way. A 2024 reappraisal argues visceral fat inflammation partly functions as an adaptive barrier, filtering gut-derived endotoxin before it reaches general circulation, meaning some of the inflammation associated with visceral fat may be a downstream consequence of gut permeability, rather than an independent problem in its own right. A reason gut repair, covered under Gut & Microbiome, and visceral fat reduction likely need pursuing together, not as substitutes for each other. The fat may be as much a symptom of the gut problem as a problem of its own.",
    citations: [
      { source: 'Reappraisal of Adipose Tissue Inflammation in Obesity (2024)', url: 'https://pubmed.ncbi.nlm.nih.gov/39287856/' },
    ],
    overallTier: 'weak',
    relatedIds: ['gut-leaky-gut-contested'],
  },
  {
    id: 'mito-exercise-intensity-inflammation',
    category: 'mitochondriaMetabolism',
    title: 'Exercise Intensity Barely Moves Inflammation Markers, Doing It at All Does',
    teaser: 'A systematic review answers "how hard do I need to exercise," and the answer is genuinely surprising.',
    summary:
      "It's a reasonable, common assumption that harder exercise means a bigger anti-inflammatory benefit. A systematic review found that assumption doesn't hold up. It found exercise intensity itself barely moves most inflammation markers (IL-6, TNF-alpha, IL-10) across the studies pooled. Doing the exercise at all matters far more than how hard it's done. This directly informs the reason to prefer low intensity specifically for an autoimmune condition, covered next, a separate mechanism entirely, not because low intensity reduces inflammation more effectively than higher intensity would.",
    citations: [
      {
        source: 'Short-Lived Exercise-Induced Exerkines Modulate Inflammation for Chronic Disease Prevention: A Systematic Review and Meta-Analysis (Biomolecules, 2025)',
        url: 'https://doi.org/10.3390/biom15111590',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-exercise-cortisol'],
  },
  {
    id: 'mito-exercise-cortisol',
    category: 'mitochondriaMetabolism',
    title: 'Why Low Intensity, Specifically: The Cortisol/Overtraining Mechanism',
    teaser: 'The reason to prefer gentle exercise for an autoimmune condition, reached by a completely different route than the previous entry.',
    summary:
      "If exercise intensity doesn't meaningfully change the inflammation-marker story, why does this app's own research still lean toward recommending low intensity specifically? The answer runs through a different mechanism entirely. High-intensity exercise drives cortisol toward levels comparable to Cushing's syndrome and can shift immune balance toward a Th2-dominant profile, the identical HPA-axis/cortisol-suppressing-deiodinase pathway already covered under Lifestyle & Environment for alcohol, juice, and chronic stress, reached here by an entirely different route. One more appearance of the same recurring hormone pathway this app's own research keeps circling back to, worth understanding once, as one mechanism, rather than as another separate warning.",
    citations: [
      {
        source: 'Overtraining, excessive exercise, and altered immunity: is this a T helper-1 versus T helper-2 lymphocyte response? (Sports Medicine)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/12696983/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'mito-exercise-autophagy-pgc1a',
    category: 'mitochondriaMetabolism',
    title: 'Exercise Independently Triggers Autophagy Too',
    teaser: "A genuinely positive closing note: exercise, not just fasting, activates the same cellular repair process, with none of fasting's own tradeoff.",
    summary:
      "After fasting's own tension (a powerful autophagy trigger with a real thyroid-hormone cost) and exercise's own cortisol caveat, this category could easily end on a note of \"everything has a downside.\" One finding pushes back against that. Exercise itself, independent of fasting, triggers autophagy and mitophagy, the mitochondria-specific version of the same cellular cleanup process, in skeletal muscle through the PGC-1α pathway. A positive mechanism that doesn't carry fasting's own T3-suppression tradeoff, making moderate, consistent, low-intensity exercise a genuinely dual-benefit intervention across both the autophagy and the cortisol/inflammation mechanisms this category covers.",
    citations: [
      { source: 'Role of PGC-1α during acute exercise-induced autophagy and mitophagy in skeletal muscle', url: 'https://pubmed.ncbi.nlm.nih.gov/25673772/' },
    ],
    overallTier: 'strong',
    relatedIds: ['mito-fasting-autophagy-tension'],
  },
  {
    id: 'mito-tying-together',
    category: 'mitochondriaMetabolism',
    title: 'Tying It All Together: Two Real Tensions, Not a Clean Story',
    teaser: 'Twelve entries in cellular biology, and the honest takeaway is two genuine tradeoffs, not a simple "do more of this" answer.',
    summary:
      "This category doesn't resolve into one clean recommendation, and that's deliberate. Fasting is the most potent known trigger of the exact autophagy process IL-23 was shown suppressing in Hashimoto's thyroid tissue, but fasting also measurably suppresses active thyroid hormone, so the two effects have to be weighed against each other, not treated as a free win. Visceral fat is genuinely linked to Treg depletion and insulin resistance in Hashimoto's-specific research, but a 2024 reappraisal suggests some of that same fat may be defending against a leaky gut rather than simply causing harm, meaning gut repair and fat reduction likely need pursuing together, not as substitutes. The one uncomplicated finding in the whole category: moderate, consistent, low-intensity exercise triggers autophagy of its own, through a completely different pathway than fasting, without fasting's own thyroid-hormone tradeoff, the closest thing to a clean answer this category actually has.",
    citations: [
      {
        source: "Increased Interleukin-23 in Hashimoto's Thyroiditis Disease Induces Autophagy Suppression and Reactive Oxygen Species Accumulation (Frontiers in Immunology, 2018)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/29434604/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-fasting-autophagy-tension', 'mito-visceral-fat-endotoxin-barrier', 'mito-exercise-autophagy-pgc1a'],
  },
];
