import type { DigestEntry } from './types';

// Mitochondria & Metabolism -- 12 entries, drawn from this session's own
// research into mitochondrial dysfunction, autophagy, visceral fat, and
// exercise in Hashimoto's specifically (not just borrowed general
// metabolic/sports-science literature) -- each entry tagged with whether
// it was measured in Hashimoto's patients directly or in general/other-
// disease literature, the same disclosure discipline as Other Autoimmune
// Diseases.
export const MITOCHONDRIA_METABOLISM_ENTRIES: DigestEntry[] = [
  {
    id: 'mito-mots-c',
    category: 'mitochondriaMetabolism',
    title: 'MOTS-c: A Real, Hashimoto\'s-Specific Mitochondrial Finding',
    teaser: 'A mitochondrial-derived peptide, measured lower in real Hashimoto\'s patients -- not borrowed from another disease.',
    summary:
      'A real study measured circulating MOTS-c (a peptide produced by mitochondria that regulates insulin sensitivity and inflammation) in 90 Hashimoto\'s patients against 90 matched controls, finding it significantly lower in the patient group -- and inversely correlated with autoantibody levels, meaning lower MOTS-c tracked with a more active autoimmune process. A genuinely Hashimoto\'s-specific mitochondrial finding, not extrapolated from a different condition.',
    citations: [{ source: 'MOTS-c/Hashimoto\'s thyroiditis case-control study' }],
    overallTier: 'moderate',
  },
  {
    id: 'mito-il23-autophagy-suppression',
    category: 'mitochondriaMetabolism',
    title: 'IL-23 Directly Suppresses Autophagy in Thyroid Cells',
    teaser: 'A real causal experiment, not just correlation -- blocking three different points in one pathway each independently reversed the damage.',
    summary:
      'Hashimoto\'s thyroid follicular cells show elevated IL-23 actively suppressing autophagy and driving reactive oxygen species (ROS) accumulation via the AKT/mTOR/NF-κB pathway -- confirmed causally, not just observed: blocking IL-23, mTOR, or NF-κB independently each reversed both the suppressed autophagy and the ROS buildup. A rare case in this app\'s whole research base of a mechanism confirmed through direct experimental intervention rather than only measured association.',
    citations: [{ source: 'IL-23/AKT/mTOR/NF-κB autophagy suppression, Hashimoto\'s thyroid follicular cells' }],
    overallTier: 'strong',
  },
  {
    id: 'mito-mtor-cd4-reprogramming',
    category: 'mitochondriaMetabolism',
    title: 'The Same mTOR Pathway, a Second Time: T Cell Fuel Reprogramming',
    teaser: 'The identical pathway shows up reprogramming the immune cells that drive the attack itself -- a real mechanistic bridge, not two separate topics.',
    summary:
      'The same mTOR pathway implicated in suppressing thyroid-cell autophagy above shows up a second time reprogramming the CD4+ T cells that drive the autoimmune attack itself onto an altered fatty-acid-oxidation fuel source -- a real mechanistic bridge connecting two parts of the disease that would otherwise look unrelated (thyroid tissue damage and the immune cells attacking it), both converging on one shared metabolic pathway.',
    citations: [{ source: 'mTOR/CD4+ T cell metabolic reprogramming, fatty-acid oxidation' }],
    overallTier: 'moderate',
    relatedIds: ['mito-il23-autophagy-suppression'],
  },
  {
    id: 'mito-fasting-autophagy-tension',
    category: 'mitochondriaMetabolism',
    title: 'Fasting: A Real, Deliberately Two-Sided Finding',
    teaser: 'The most potent known autophagy trigger -- and a documented way to suppress active thyroid hormone at the same time.',
    summary:
      'Fasting and caloric restriction are genuinely the most potent known triggers of autophagy, the cellular cleanup process IL-23 was shown above to suppress in Hashimoto\'s specifically. But fasting also reliably suppresses T3 and raises reverse-T3 via hypothalamic TRH downregulation -- a real, well-documented thyroid-specific cost, not a minor caveat. Both facts are presented together deliberately rather than picking the flattering one; the most plausible reading is that short, moderate fasting windows (not multi-day extended fasts) are where the two effects most reasonably balance.',
    citations: [{ source: 'Fasting-induced autophagy, cellular biology literature' }, { source: 'Hypothalamic TRH downregulation and T3 suppression during fasting' }],
    overallTier: 'moderate',
    relatedIds: ['mito-ramadan-fasting-study'],
  },
  {
    id: 'mito-ramadan-fasting-study',
    category: 'mitochondriaMetabolism',
    title: 'A Real Fasting Study in Existing Hypothyroid Patients',
    teaser: 'Ramadan observance provided a real, naturally-occurring human fasting study -- in people already on thyroid medication.',
    summary:
      'Studies of Ramadan fasting in existing hypothyroid patients found independent TSH suppression during the fasting period, plus a real, practical complication: fasting disrupts the empty-stomach medication-absorption timing levothyroxine dosing depends on. A genuine, human (not animal-model) data point on how fasting interacts with existing thyroid treatment specifically, distinct from the general autophagy-benefit research above.',
    citations: [{ source: 'Ramadan fasting studies, hypothyroid patients on levothyroxine' }],
    overallTier: 'moderate',
    stageNote: 'Worth discussing with a doctor before combining any extended fast with existing thyroid medication.',
  },
  {
    id: 'mito-visceral-fat-treg-depletion',
    category: 'mitochondriaMetabolism',
    title: 'Visceral Fat: Depleted of Regulatory T Cells in Hashimoto\'s',
    teaser: 'The same Treg cells this app\'s Gut & Microbiome research keeps returning to -- specifically depleted in one tissue.',
    summary:
      'Hashimoto\'s patients show measurably depleted regulatory T cells (Tregs) specifically within visceral adipose tissue -- the same immune cell type SCFAs from dietary fiber were shown to induce elsewhere in this app\'s Gut & Microbiome research, here found specifically reduced in visceral fat rather than uniformly reduced everywhere in the body.',
    citations: [{ source: 'Visceral adipose Treg depletion, Hashimoto\'s thyroiditis studies' }],
    overallTier: 'moderate',
    relatedIds: ['gut-scfa-treg'],
  },
  {
    id: 'mito-visceral-fat-treg-reinfusion',
    category: 'mitochondriaMetabolism',
    title: 'A Real Causal Experiment: Reinfusing Tregs Into Visceral Fat',
    teaser: 'Not just correlation -- putting the missing cells back measurably improved insulin sensitivity, in a real experiment.',
    summary:
      'In a Hashimoto\'s mouse model, reinfusing healthy regulatory T cells (which preferentially homed back into visceral adipose tissue on their own) measurably improved insulin sensitivity -- a real causal experiment, not just an observed association, directly connecting the Treg depletion finding above to a concrete, measurable metabolic outcome.',
    citations: [{ source: 'Treg reinfusion, Hashimoto\'s mouse model, insulin sensitivity outcome' }],
    overallTier: 'moderate',
    relatedIds: ['mito-visceral-fat-treg-depletion'],
  },
  {
    id: 'mito-levothyroxine-body-fat-null',
    category: 'mitochondriaMetabolism',
    title: 'A Real, Humbling Counter-Finding: Levothyroxine Alone Doesn\'t Fix Body Fat',
    teaser: 'The well-established Hashimoto\'s/weight-gain link doesn\'t resolve just by treating the hormone.',
    summary:
      'Despite the well-established association between Hashimoto\'s and weight/body fat, correcting hypothyroidism itself with levothyroxine alone appears to have little effect on body fat in real studies -- meaning the relationship isn\'t simply "low thyroid hormone causes fat gain, treat the hormone and it resolves." A genuinely humbling finding worth stating plainly, since it complicates a very commonly assumed cause-and-effect story.',
    citations: [{ source: 'Levothyroxine treatment and body composition outcome studies' }],
    overallTier: 'moderate',
  },
  {
    id: 'mito-visceral-fat-endotoxin-barrier',
    category: 'mitochondriaMetabolism',
    title: 'A Real Complication: Visceral Fat as a Gut-Endotoxin Barrier',
    teaser: 'Some of what reads as "bad" visceral fat inflammation may actually be the body defending against a leaky gut.',
    summary:
      'A 2024 reappraisal argues visceral fat inflammation partly functions as an adaptive barrier, filtering gut-derived endotoxin before it reaches general circulation -- meaning some of the inflammation associated with visceral fat may be a downstream consequence of gut permeability rather than an independent problem in its own right. A real reason gut repair (see Gut & Microbiome) and visceral fat reduction likely need pursuing together, not as substitutes for each other.',
    citations: [{ source: '2024 reappraisal, visceral adipose tissue and endotoxin filtering' }],
    overallTier: 'weak',
    relatedIds: ['gut-leaky-gut-contested'],
  },
  {
    id: 'mito-exercise-intensity-inflammation',
    category: 'mitochondriaMetabolism',
    title: 'Exercise Intensity Barely Moves Inflammation Markers -- Doing It At All Does',
    teaser: 'A real systematic review answers "how hard do I need to exercise" -- and the answer is surprising.',
    summary:
      'A systematic review found exercise intensity itself barely moves most inflammation markers (IL-6, TNF-α, IL-10) -- doing the exercise at all matters far more than how hard it\'s done. This directly informs the real reason to prefer LOW intensity specifically for an autoimmune condition, which is a separate mechanism (see the next entry), not because low intensity reduces inflammation more effectively than higher intensity would.',
    citations: [{ source: 'Systematic review, exercise intensity and inflammatory marker response' }],
    overallTier: 'moderate',
    relatedIds: ['mito-exercise-cortisol'],
  },
  {
    id: 'mito-exercise-cortisol',
    category: 'mitochondriaMetabolism',
    title: 'Why Low Intensity, Specifically: The Cortisol/Overtraining Mechanism',
    teaser: 'The real reason to prefer gentle exercise for an autoimmune condition -- reached by a different route than the previous entry.',
    summary:
      'The real, separate reason to prefer low-intensity exercise specifically for an autoimmune condition is the overtraining/cortisol mechanism: high-intensity exercise drives cortisol toward levels comparable to Cushing\'s syndrome and can shift immune balance toward a Th2-dominant profile -- the identical HPA-axis/cortisol-suppressing-deiodinase pathway already covered under Lifestyle & Environment for alcohol, juice, and chronic stress, reached here by a different route.',
    citations: [{ source: 'High-intensity exercise, cortisol response, and Th2 immune shift studies' }],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'mito-exercise-autophagy-pgc1a',
    category: 'mitochondriaMetabolism',
    title: 'Exercise Independently Triggers Autophagy Too',
    teaser: 'A genuinely positive closing note: exercise, not just fasting, activates the same cellular repair process.',
    summary:
      'Exercise itself, independent of fasting, triggers autophagy and mitophagy (the mitochondria-specific version of the same cellular cleanup process) in skeletal muscle through the PGC-1α pathway -- a real, positive mechanism that doesn\'t carry fasting\'s own T3-suppression tradeoff, making moderate, consistent, low-intensity exercise a genuinely dual-benefit intervention across both the autophagy and the cortisol/inflammation mechanisms this category covers.',
    citations: [{ source: 'Exercise-induced autophagy/mitophagy, PGC-1α pathway, skeletal muscle studies' }],
    overallTier: 'strong',
    relatedIds: ['mito-fasting-autophagy-tension'],
  },
];
