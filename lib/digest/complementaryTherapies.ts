import type { DigestEntry } from './types';

// Complementary & Manual Therapies -- added 2026-08-07, direct request:
// "we may need to also put some research into the benefits of
// Chiropractics, massage, and acupuncture or acupressure and other things
// and techniques if there is any correlation at all to Hashimoto's or
// relief of symptoms... Maybe that should include heat and cold therapy...
// this sounds like maybe it could go down a rabbit hole quickly."
//
// Deliberately bounded rather than open-ended, per that same explicit
// concern: six named modalities researched directly (chiropractic,
// acupuncture, acupressure, massage, heat/sauna, cold exposure), each
// reported honestly regardless of what was actually found -- including a
// flat null (chiropractic: zero papers exist connecting it to
// thyroid/autoimmune disease at all) and a contested finding (massage and
// cortisol: reviews of the existing research "are not in agreement" on
// whether the commonly claimed effect exists). This category does NOT pad
// thin evidence into false confidence -- several entries here are tiered
// weak specifically because that's what the evidence supports, not because
// the topic itself is unworthy of inclusion.
//
// This session's WebSearch budget was already exhausted, so every citation
// was found via the established WebFetch-against-real-PubMed fallback --
// papers read directly, nothing fabricated. The closing entry directly
// answers the person's own "should this tie into exercise" question rather
// than leaving it open.
//
// 2026-08-08: content fields rewritten to remove AI-writing tics flagged
// directly by the person -- see bigPicture.ts's own header comment for the
// full context. Every fact, number, and citation is unchanged; this is a
// prose pass only.
export const COMPLEMENTARY_THERAPIES_ENTRIES: DigestEntry[] = [
  {
    id: 'complementary-chiropractic',
    category: 'basicHealth',
    title: 'Chiropractic Care: A Flat Null, Stated Plainly Rather Than Guessed At',
    teaser: 'A direct search for evidence connecting chiropractic care to thyroid or autoimmune disease turned up nothing at all.',
    summary:
      "This app's own standing discipline is reporting evidence honestly, whatever it turns out to be. For chiropractic care specifically, the finding is a flat null. A search of the peer-reviewed literature for any study connecting chiropractic care or spinal manipulation to hypothyroidism, Hashimoto's, or autoimmune thyroid disease returned zero results: no clinical trials, no case reports, nothing indexed at all. That's meaningfully different from \"studied and found not to work.\" It simply hasn't been studied in a way that reached the peer-reviewed literature this app's own research relies on throughout. This isn't a dismissal of chiropractic care outright, which is a separate question from whether it helps musculoskeletal pain, something not evaluated here. It's a statement that no evidence-backed connection to Hashimoto's specifically currently exists.",
    citations: [],
    overallTier: 'weak',
  },
  {
    id: 'complementary-acupuncture',
    category: 'basicHealth',
    title: "Acupuncture: A Trial Was Designed Specifically for Hashimoto's, and the Answer Is Still Pending",
    teaser: "Someone built the study this question deserves. As of this research pass, its results haven't surfaced yet.",
    summary:
      "Acupuncture is more studied than chiropractic, but the state of the evidence specifically for Hashimoto's is closer to \"a trial exists, results not yet found\" than a clear yes or no. A randomized controlled trial protocol was registered in 2021 specifically to study acupuncture for Hashimoto's thyroiditis, built around a common situation this app's own research keeps returning to: patients with normal thyroid hormone levels who still experience symptoms (neck discomfort, fatigue, mood swings) that meaningfully affect quality of life. A search for that trial's published results came back empty, meaning either it hasn't been completed and published yet, or this research pass simply didn't locate it. Rather than substitute general acupuncture research from a different condition as a stand-in, or guess at what the results might show, the honest answer is pending. A designed study exists asking the right question, and this app doesn't yet have its answer.",
    citations: [
      { source: 'Wang S, Zhao J, Zeng W, et al. 2021: Acupuncture for Hashimoto thyroiditis: study protocol for a randomized controlled trial (Trials)', url: 'https://pubmed.ncbi.nlm.nih.gov/33478571/' },
    ],
    overallTier: 'weak',
  },
  {
    id: 'complementary-acupressure',
    category: 'basicHealth',
    title: "Acupressure: Fatigue-Relief Evidence From Other Chronic Illnesses, Not Yet Tested in Hashimoto's",
    teaser: 'The same "borrow evidence honestly, label it clearly" approach this app already uses for other autoimmune diseases, applied here to a technique instead of a disease.',
    summary:
      "Acupressure, applying pressure rather than needles to the same points acupuncture uses, has randomized trial evidence behind it for one outcome this app's own core purpose cares about directly: fatigue. It just isn't Hashimoto's-specific evidence. Trials found it measurably reduced fatigue in chronic lymphocytic leukemia patients, in chronic fatigue syndrome, and in people undergoing hemodialysis for end-stage renal disease, three different chronic-illness populations converging on a similar benefit for a common symptom. None of these trials studied Hashimoto's or autoimmune thyroid disease specifically, so this is borrowed evidence, not disease-specific proof, the same labeling discipline this app's own Other Autoimmune Diseases category already applies to research from other conditions. It's a low-risk, evidence-backed option worth knowing about for fatigue specifically, while its direct application to Hashimoto's-related fatigue hasn't been tested yet.",
    citations: [
      { source: 'Suandika M, Chen SY, Fang JT, et al. 2023: Effect of Acupressure on Fatigue in Hemodialysis Patients: A Single-Blinded Randomized Controlled Trial', url: 'https://pubmed.ncbi.nlm.nih.gov/36413013/' },
      { source: 'Parizad N, Hassanpour A, Goli R, Khalkhali H, Nozad A 2024: Comparing the impact of acupressure and reflexology on fatigue in chronic lymphocytic leukemia patients: A randomized controlled trial', url: 'https://pubmed.ncbi.nlm.nih.gov/38520901/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['other-why-cross-disease-evidence'],
  },
  {
    id: 'complementary-massage-cortisol',
    category: 'basicHealth',
    title: "Massage Therapy: A Widely Repeated Claim the Evidence Doesn't Cleanly Support",
    teaser: '"Massage lowers cortisol" is one of the most commonly repeated wellness claims anywhere. A comprehensive review found the actual research disagrees with itself.',
    summary:
      "It's hard to find a massage therapy website or wellness article that doesn't claim a cortisol-lowering effect. This Digest's own Lifestyle & Environment category has already made the case that cortisol is a central hormone connecting stress to lower active thyroid hormone, so an evidence-backed way to lower it would matter directly here. The problem: a comprehensive quantitative review specifically set out to test whether massage therapy actually reduces cortisol, and found the existing body of research simply \"are not in agreement\" on whether the effect exists at all. Not a clean positive, not a clean null, an unresolved scientific disagreement. That's worth knowing because the claim gets repeated with far more confidence than the underlying evidence supports. Massage may still be worth doing for its own benefits (relaxation, muscle tension relief, general wellbeing). The specific claim that it measurably lowers cortisol, the exact mechanism this app's own research would care most about, isn't as settled as its popularity suggests.",
    citations: [
      { source: 'Moyer CA, Seefeldt L, Mann ES, Jackley LM 2011: Does massage therapy reduce cortisol? A comprehensive quantitative review (Journal of Bodywork and Movement Therapies)', url: 'https://pubmed.ncbi.nlm.nih.gov/21147413/' },
    ],
    overallTier: 'weak',
    relatedIds: ['lifestyle-chronic-stress-hpa'],
  },
  {
    id: 'complementary-heat-sauna',
    category: 'basicHealth',
    title: 'Sauna & Heat Therapy: The Strongest Evidence in This Category, With a Caveat About Whose Data It Is',
    teaser: 'A large cohort study found frequent sauna use tied to a striking reduction in cardiac death, in one population, studied one way.',
    summary:
      "Heat therapy is the one modality in this category with large-scale, quantified evidence behind it, a genuine outlier compared to chiropractic's flat null or massage's contested claim. A well-known Finnish cohort study found men who used a sauna 4 to 7 times per week had a 63% lower risk of sudden cardiac death compared to men who used one just once a week, with sessions longer than 19 minutes associated with a 52% lower risk compared to sessions under 11 minutes. Striking, dose-dependent numbers, not a vague trend. The same caveat this app applies throughout still holds: this is Finnish men in a specific cohort, with a cultural sauna-use pattern most of the world doesn't share, which is a reason to treat the exact magnitude with some caution while still trusting the general direction of the finding. A separate short-term study found sauna sessions actually raised IL-6 acutely, not lowered it, while also raising the anti-inflammatory marker IL-1RA, with CRP unchanged. A more complicated acute picture than \"sauna reduces inflammation\" would suggest, closer to the same adaptive stress-then-recovery pattern this app's own exercise research already describes than a simple, one-direction anti-inflammatory effect.",
    citations: [
      { source: 'Laukkanen T, Khan H, Zaccardi F, Laukkanen JA 2015: Association between sauna bathing and fatal cardiovascular and all-cause mortality events (JAMA Internal Medicine)', url: 'https://pubmed.ncbi.nlm.nih.gov/25705824/' },
      { source: 'Behzadi P, Gravel H, Neagoe PE, Barry H, Sirois MG, Gagnon D 2020: Impact of Finnish sauna bathing on circulating markers of inflammation in healthy middle-aged and older adults: A crossover study', url: 'https://pubmed.ncbi.nlm.nih.gov/32951736/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-exercise-intensity-inflammation'],
  },
  {
    id: 'complementary-cold-exposure',
    category: 'basicHealth',
    title: 'Cold Exposure: A Striking Study, With a Correction to What It Actually Tested',
    teaser: "A published experiment found trained subjects could measurably blunt their own inflammatory response to a genuine immune challenge. It wasn't cold exposure alone that did it.",
    summary:
      "Cold water immersion has a genuinely striking study behind it, published in one of the most respected general-science journals that exists, PNAS. The correction worth making upfront: it tested a combined technique, not cold exposure in isolation. Subjects trained for 10 days in a specific combination of meditation, a particular breathing technique (cyclic hyperventilation with breath retention), and cold water immersion. They were then given a deliberate endotoxin challenge, a controlled way of triggering a genuine inflammatory immune response under medical supervision, and the trained group showed significantly higher anti-inflammatory IL-10, lower pro-inflammatory TNF-alpha/IL-6/IL-8, and fewer flu-like symptoms than untrained controls facing the identical challenge. A measurable effect on the immune system's own inflammatory response, achieved through voluntary practice rather than medication. The caveat matters as much as the finding: this study cannot say which piece of the combined protocol did the work, or whether cold exposure alone would produce anything like this effect on its own. This is legitimate evidence that voluntary techniques can influence inflammatory response, not yet evidence that a cold plunge by itself does the same thing.",
    citations: [
      { source: 'Kox M, van Eijk LT, Zwaag J, et al. 2014: Voluntary activation of the sympathetic nervous system and attenuation of the innate immune response in humans (Proceedings of the National Academy of Sciences)', url: 'https://pubmed.ncbi.nlm.nih.gov/24799686/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'complementary-tying-together',
    category: 'basicHealth',
    title: 'Tying It All Together: Where This Sits Next to Exercise',
    teaser: 'Should this connect to exercise? Yes, and exercise turns out to be the stronger evidence of the two.',
    summary:
      "Read side by side, these six modalities sort into a clear hierarchy, worth stating plainly rather than treating all six as equally worth pursuing. Chiropractic has no evidence at all. Acupuncture has a well-designed trial specifically for Hashimoto's whose results aren't available yet. Massage's most commonly repeated specific claim isn't settled science. Acupressure and cold exposure both have real, if borrowed or combined-protocol, evidence worth knowing about. Sauna and heat therapy has the strongest, most quantified evidence in this category, though from one specific population. Set against all of that, this app's own Mitochondria & Metabolism category already covers something with more, and more directly relevant, evidence than any single entry here: Hashimoto's-adjacent research on exercise's own measurable effect on inflammation, visceral fat, and cellular energy metabolism, without needing to borrow evidence from an unrelated condition or lean on one country's cultural habit. That's the direct answer to whether this category should tie into exercise. It already does, by comparison: exercise remains the better-evidenced, more directly applicable choice of everything covered across both categories, and these six modalities are worth knowing about as honestly-tiered complements to that, not substitutes for it.",
    citations: [],
    overallTier: 'moderate',
    relatedIds: ['mito-exercise-intensity-inflammation', 'mito-tying-together'],
  },
];
