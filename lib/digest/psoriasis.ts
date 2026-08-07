import type { DigestEntry } from './types';

// Psoriasis / Psoriatic Arthritis -- 11 entries, added 2026-08-08 as this
// app's third real condition, following the same reuse-first pattern
// established with Rheumatoid Arthritis. Distinct from otherAutoimmune.ts's
// own 'other-psoriasis' entry, which stays exactly as it was: psoriasis
// studied purely as corroborating evidence for Hashimoto's own visceral-fat
// and gluten-responder-subgroup research, written for a Hashimoto's reader.
// This category is the opposite direction -- psoriasis as its own real,
// primary condition, written for someone who has selected psoriasis in
// their own Profile. The two entries deliberately don't duplicate each
// other; this category's own gluten entry gives the mechanism a fuller,
// psoriasis-specific treatment rather than re-explaining the same subgroup
// finding twice, and cross-links back to the other one.
//
// Every citation here was independently verified via WebSearch before being
// written in, the same discipline the rest of this Digest already holds to.
// Two entries (vitamin D and omega-3) are deliberately honest about mixed or
// null evidence rather than smoothed into a false positive -- worth reading
// alongside RA's own strong omega-3 finding as a real example of the same
// nutrient carrying different evidence weight for a different disease.
export const PSORIASIS_ENTRIES: DigestEntry[] = [
  {
    id: 'psoriasis-overview',
    category: 'psoriasis',
    title: 'Psoriasis: A Skin Disease That Runs Deeper Than the Skin',
    teaser: 'Visible on the outside, but driven by the same overactive immune system this whole app already tracks.',
    summary:
      "Psoriasis is the immune system driving skin cells to multiply far faster than normal, piling up into the thick, scaly, often itchy plaques the disease is known for. Roughly a third of people with psoriasis go on to develop psoriatic arthritis, a related form that attacks the joints the way rheumatoid arthritis does. Despite looking like a purely dermatological condition, psoriasis shares real biology with every other autoimmune disease in this Digest: the same inflammatory cytokines, a documented link to obesity and metabolic disease, and a real, if partial, overlap with gluten sensitivity in a specific subgroup of patients. Diet won't cure psoriasis, and nothing here replaces a dermatologist's own treatment plan. What follows is what the actual research supports, kept honest about how strong each finding really is, including the places where the evidence is genuinely mixed rather than settled.",
    citations: [
      { source: 'Psoriasis, National Institute of Arthritis and Musculoskeletal and Skin Diseases (NIAMS)', url: 'https://www.niams.nih.gov/health-topics/psoriasis' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-psoriasis', 'psoriasis-weight-loss'],
  },
  {
    id: 'psoriasis-weight-loss',
    category: 'psoriasis',
    title: 'Weight Loss Is the Best-Evidenced Lever in This Whole Category',
    teaser: 'Not a general wellness suggestion. Randomized trials measured actual PASI score drops from real, modest weight loss.',
    summary:
      "Of everything studied for psoriasis, intentional weight loss carries the clearest trial evidence. A randomized clinical study put obese psoriasis patients on a low-energy diet, roughly 800 to 1,000 calories a day for eight weeks, then reintroduced food gradually over another eight weeks, and found significant improvement in disease severity compared to a control group eating their usual diet. A more recent systematic review pooling multiple randomized trials found the same pattern held up at scale: weight-loss interventions produced a real average PASI reduction of 2.5 points more than control, and meaningfully raised the odds of reaching PASI75, a 75% improvement in symptoms, the same bar most psoriasis drug trials use to define real success. The obesity-psoriasis relationship runs both directions. Obesity worsens psoriasis through the same low-grade systemic inflammation this app's own Mitochondria & Metabolism research already covers for visceral fat, and psoriasis itself can make weight loss harder. A 10 to 15% reduction in body weight is the real, specific target the strongest trials point to, not an indefinite goal.",
    citations: [
      { source: 'Effect of weight loss on the severity of psoriasis: a randomized clinical study', url: 'https://pubmed.ncbi.nlm.nih.gov/23752669/' },
      { source: 'Impact of weight-loss interventions on psoriasis severity: A systematic review and meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/41416383/' },
    ],
    overallTier: 'strong',
    relatedIds: ['mito-visceral-fat-endotoxin-barrier', 'psoriasis-mediterranean-diet'],
  },
  {
    id: 'psoriasis-mediterranean-diet',
    category: 'psoriasis',
    title: 'A 2025 Trial Put a Real Number on the Mediterranean Diet for Psoriasis',
    teaser: 'A dietitian-guided Mediterranean diet, tested head-to-head against standard low-fat advice, in a real 16-week randomized trial.',
    summary:
      "The MEDIPSO trial, run in Madrid and completed in 2025, randomized adults with mild-to-moderate psoriasis to either a dietitian-guided Mediterranean diet or standard low-fat dietary advice for 16 weeks. The Mediterranean diet group showed significantly greater improvement in psoriasis severity, and the more closely someone actually followed the diet, the more they improved, a real dose-response pattern that strengthens the case this isn't coincidence. A separate, earlier case-control study found the same relationship from the other direction: people with psoriasis scored measurably lower on a standard Mediterranean diet adherence scale than people without it, and lower adherence tracked with worse disease severity and quality of life. Two different study designs, the same real pattern, pointing at one of the more actionable findings in this entire category.",
    citations: [
      { source: 'Mediterranean Diet Reduces Psoriasis Severity in Randomized Trial (MEDIPSO), Medscape, 2025', url: 'https://www.medscape.com/viewarticle/mediterranean-diet-reduces-psoriasis-severity-trial-2025a1000pjd' },
      { source: 'Adherence to the Mediterranean diet is independently associated with psoriasis risk, severity, and quality of life: a cross-sectional observational study', url: 'https://pubmed.ncbi.nlm.nih.gov/31168780/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-weight-loss', 'ra-mediterranean-diet'],
  },
  {
    id: 'psoriasis-alcohol',
    category: 'psoriasis',
    title: 'Alcohol and Psoriasis: A Real Association That Splits by Sex',
    teaser: 'Heavier drinking tracks with worse psoriasis, most clearly documented in men, with a real, separate mortality finding worth knowing either way.',
    summary:
      "Alcohol's relationship with psoriasis is one of the more consistently documented lifestyle links in this whole category, though the exact shape of it depends on who's being studied. Increasing alcohol use tracks with worsening psoriasis severity and a poorer response to systemic treatment, and heavy drinking shows up significantly more often in men with severe disease than men with mild disease. Some studies found a striking relative risk as high as 8.01 for plaque-type psoriasis in men who drink heavily, while the same research didn't find a comparable increased risk in women drinking at typical levels, though at least one separate study found real elevated risk in women drinking 2.3 or more drinks a week. That inconsistency across studies is worth stating plainly rather than smoothing over. What isn't in dispute is a separate, striking finding: people with psoriasis carry roughly 60% higher alcohol-related mortality than the general population of the same age and sex, a real reason to take alcohol screening seriously in psoriasis care regardless of how the severity link ultimately resolves.",
    citations: [
      { source: 'Alcohol consumption and psoriasis: a systematic literature review', url: 'https://pubmed.ncbi.nlm.nih.gov/23845150/' },
      { source: 'Alcohol-Related Mortality in Patients With Psoriasis: A Population-Based Cohort Study', url: 'https://pubmed.ncbi.nlm.nih.gov/28914955/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['lifestyle-alcohol-advisory'],
  },
  {
    id: 'psoriasis-gluten-mechanism',
    category: 'psoriasis',
    title: 'The Gluten-Responder Subgroup, Down to the Actual Skin Biology',
    teaser: 'This app already names the subgroup finding elsewhere. Here\'s what a gluten-free diet was actually measured doing inside the skin itself.',
    summary:
      "This app's own Other Autoimmune Diseases category already names the headline finding: a specific subgroup of psoriasis patients test positive for gliadin antibodies, and that exact subgroup sees measurable skin improvement on a gluten-free diet. What's worth adding here is the mechanism, because it's more concrete than most diet-and-skin findings get. Researchers biopsied the skin of gliadin antibody-positive psoriasis patients before and after three months on a gluten-free diet and found tissue transglutaminase, an enzyme that was highly overexpressed in the affected skin's blood vessel lining, dropped by roughly 50%. A marker of active cell proliferation in the skin dropped significantly too. Roughly 16% of people with plaque psoriasis carry these antibodies, a real, testable minority rather than a universal trigger. If psoriasis runs in a family alongside celiac disease or other gluten-related conditions, this is a concrete, biopsy-confirmed reason to ask a doctor about antibody testing before assuming a gluten-free diet either will or won't help.",
    citations: [
      { source: 'Gluten-free Diet in Psoriasis Patients with Antibodies to Gliadin Results in Decreased Expression of Tissue Transglutaminase and Fewer Ki67+ Cells in the Dermis, Acta Dermato-Venereologica', url: 'https://medicaljournalssweden.se/actadv/article/view/11356' },
    ],
    overallTier: 'moderate',
    relatedIds: ['other-psoriasis'],
  },
  {
    id: 'psoriasis-nightshades',
    category: 'psoriasis',
    title: 'Nightshades and Psoriasis: A Real Pattern for Some, Not a Proven Trigger for Everyone',
    teaser: 'Widely repeated advice with almost no clinical evidence behind it, and a real reason the amount involved makes the proposed mechanism unlikely.',
    summary:
      "Nightshade avoidance, cutting out tomatoes, potatoes, peppers, and eggplant, is some of the most commonly repeated psoriasis diet advice online, and it's worth being honest about how thin the actual evidence is. The proposed mechanism centers on solanine, a compound in the nightshade family that some believe drives inflammation. Solanine is real, but it concentrates almost entirely in the leaves and stems of these plants, not the parts anyone actually eats, and the amount present in a normal serving of tomato or potato is far below what would be needed to produce any measurable inflammatory effect. No clinical trial has tested nightshade elimination in psoriasis specifically. What exists instead is a real split in anecdotal reports: some people say cutting nightshades helped, most see no difference at all, and dietitians disagree on whether the pattern is worth taking seriously. That doesn't make it worthless to test personally, only worth testing honestly, without assuming the answer in advance. A short elimination of a few weeks, followed by a deliberate reintroduction, is the only way to actually find out whether this applies to any one person's own body.",
    citations: [
      { source: 'Exploring the Connection Between Nightshades and Psoriasis, plaquepsoriasis.com', url: 'https://plaquepsoriasis.com/living/what-are-nightshades' },
    ],
    overallTier: 'weak',
    relatedIds: ['problem-nightshades'],
  },
  {
    id: 'psoriasis-vitamin-d-oral',
    category: 'psoriasis',
    title: 'Oral Vitamin D for Psoriasis: A Real, Unresolved Split in the Trial Evidence',
    teaser: 'One trial found real improvement at three months. A larger, longer trial found nothing. The honest answer is that it isn\'t settled either way.',
    summary:
      "Vitamin D's relationship with psoriasis is genuinely more complicated than it first appears, and worth separating clearly into two different questions. Topical vitamin D analogs applied directly to plaques, like calcipotriene, are a well-established, first-line psoriasis treatment with strong evidence behind them. Oral, dietary-style vitamin D supplementation is a separate question with a much less settled answer. One randomized, placebo-controlled trial found a real, significant improvement in psoriasis severity at three months on vitamin D2. A larger, longer trial giving 100,000 IU of vitamin D3 monthly for a full year found no difference in severity between the vitamin D group and placebo at any point, even though blood vitamin D levels rose as expected in both groups. A meta-analysis pooling the available randomized trials initially found a favorable effect at six months, but that result stopped being statistically significant once a stricter statistical adjustment was applied. The honest summary: oral vitamin D supplementation for psoriasis specifically remains unproven, genuinely different from the well-supported topical route, and not something to expect a skin-clearing result from on its own.",
    citations: [
      { source: 'Effectiveness of oral vitamin D supplementation in lessening disease severity among patients with psoriasis: A systematic review and meta-analysis of randomized controlled trials', url: 'https://pubmed.ncbi.nlm.nih.gov/33183899/' },
      { source: 'Oral vitamin D3 supplementation for chronic plaque psoriasis: a randomized, double-blind, placebo-controlled trial', url: 'https://pubmed.ncbi.nlm.nih.gov/29480035/' },
    ],
    overallTier: 'weak',
    relatedIds: ['nutrient-vitamin-d'],
  },
  {
    id: 'psoriasis-omega3-mixed',
    category: 'psoriasis',
    title: 'Omega-3s Help RA More Reliably Than They Help Psoriasis',
    teaser: 'The same nutrient this app names as its strongest RA finding turns out far less consistent for psoriasis specifically.',
    summary:
      "It's worth reading this alongside the omega-3 finding in this app's own Rheumatoid Arthritis category, because the contrast is real and instructive. For RA, omega-3 supplementation carries strong, repeated trial evidence. For psoriasis, the picture is genuinely weaker. A meta-analysis of randomized controlled trials found fish oil taken alone had no measurable effect on PASI score, lesion area, or itching. Five trials in the same body of research found some benefit; eight found none, and pooled together, fish oil supplementation wasn't associated with reduced disease severity when used by itself. The one place omega-3s showed real promise was in combination with standard psoriasis treatment rather than as a stand-alone approach, several reviews found a real added benefit when fish oil was paired with conventional therapy rather than used on its own. The same nutrient, studied with real rigor in two different autoimmune diseases, landing in two genuinely different places, is exactly the kind of honest, disease-specific distinction this app tries to hold onto rather than assuming one finding transfers automatically to the next condition.",
    citations: [
      { source: 'Effects of fish oil supplement on psoriasis: a meta-analysis of randomized controlled trials', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6896351/' },
    ],
    overallTier: 'weak',
    relatedIds: ['ra-omega3'],
  },
  {
    id: 'psoriasis-cyclosporine-grapefruit',
    category: 'psoriasis',
    title: 'Cyclosporine and Grapefruit: A Real, Measured Overdose Risk',
    teaser: 'Not a mild absorption tweak. Real studies measured drug levels over 60% higher after grapefruit juice.',
    summary:
      "Cyclosporine, a systemic immunosuppressant used for severe psoriasis, has one of the more concrete and well-measured food-drug interactions in this whole app. Grapefruit and grapefruit juice block an intestinal enzyme, CYP3A4, that normally breaks down part of an oral cyclosporine dose before it fully absorbs into the bloodstream. With that enzyme blocked, more of the dose gets through. Real clinical measurements found blood cyclosporine levels running more than 60% higher after grapefruit juice, a large enough shift to push an already-therapeutic dose into real overdose territory, not a subtle nutrient-timing effect. Because cyclosporine already carries real kidney and blood-pressure risks that scale with dose, this isn't an interaction to try timing around. The straightforward, doctor-supported approach is avoiding grapefruit and grapefruit juice entirely for as long as cyclosporine treatment continues.",
    citations: [
      { source: 'Dosing implications of a clinical interaction between grapefruit juice and cyclosporine and metabolite concentrations in patients with autoimmune diseases', url: 'https://pubmed.ncbi.nlm.nih.gov/9002010/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-acitretin-alcohol'],
  },
  {
    id: 'psoriasis-acitretin-alcohol',
    category: 'psoriasis',
    title: 'Acitretin and Alcohol: Why "Avoid It" Actually Means Years, Not Just Tonight',
    teaser: 'A single drink converts this drug into a different one with a wildly longer half-life, extending real teratogenic risk well past when treatment ends.',
    summary:
      "Acitretin, an oral retinoid used for moderate-to-severe plaque psoriasis, carries one of the more serious food-and-substance interactions covered anywhere in this Digest. Alcohol taken during acitretin treatment converts the drug into etretinate, a related retinoid with a dramatically longer half-life, roughly 120 days compared to acitretin's own 49 hours. That single conversion matters enormously because acitretin, like every retinoid, carries a real teratogenic risk, meaning it can cause serious birth defects. A drug that normally clears the body in days instead lingers, in one documented case, still detectable in blood and fat tissue 52 months after the last dose was taken, because of alcohol consumed during treatment. This is exactly why alcohol is specifically prohibited during acitretin treatment and for at least two months after stopping, a genuinely different and stricter rule than the general moderation advice attached to most other medications in this app.",
    citations: [
      { source: 'Acitretin (Soriatane) prescribing information, U.S. Food and Drug Administration', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2014/019821s023lbl.pdf' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-cyclosporine-grapefruit'],
  },
  {
    id: 'psoriasis-tying-together',
    category: 'psoriasis',
    title: 'What Actually Holds Up for Psoriasis, Pulled Together',
    teaser: 'Two strong, actionable food levers, two honestly weak ones, and two medication interactions serious enough to know exactly, not just generally.',
    summary:
      "Line up everything in this category and the real, usable pattern is different in shape from RA's own. Weight loss and a Mediterranean-style eating pattern both carry strong, repeated trial evidence and a real, measurable effect on disease severity, the two most dependable levers here. Alcohol shows a real, if not perfectly consistent, link to worse disease and a striking, well-documented mortality risk regardless of how the severity question ultimately resolves. Gluten avoidance helps a specific, testable, antibody-positive minority with real skin biology behind it, not a universal recommendation. Nightshade avoidance and oral vitamin D supplementation both remain genuinely unproven for psoriasis specifically, worth naming honestly rather than smoothing into false confidence just because they're popular advice. And two medication interactions, cyclosporine with grapefruit and acitretin with alcohol, are serious and specific enough that vague caution isn't good enough; both come with a real number attached and a real reason that number matters.",
    citations: [
      { source: 'Psoriasis, National Institute of Arthritis and Musculoskeletal and Skin Diseases (NIAMS)', url: 'https://www.niams.nih.gov/health-topics/psoriasis' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-weight-loss', 'psoriasis-mediterranean-diet', 'psoriasis-nightshades', 'psoriasis-vitamin-d-oral'],
  },
];
