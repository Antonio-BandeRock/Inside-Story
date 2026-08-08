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
//
// 2026-08-08, same day, grew to 15 entries: 4 real, disease-specific self-
// advocacy entries added directly here (annual PEST screening for psoriatic
// arthritis, cardiovascular/metabolic risk assessment with its own real
// 1.5x scoring adjustment, systemic-medication monitoring including a real,
// documented gap between dermatology and rheumatology methotrexate
// guidelines for the identical drug, and a topical-vitamin-D calcium
// caveat) as part of the same request that dissolved the old, single shared
// Self Advocacy category into per-condition content (see types.ts's own
// header comment) -- "Self advocacy should also be specific to each
// disease." Psoriasis's own self-advocacy content lives here, in its own
// category, rather than in a separate shared file.
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
    relatedIds: ['ra-omega3', 'omega36-tying-together'],
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
    id: 'psoriasis-advocacy-psa-screening',
    category: 'psoriasis',
    title: 'Ask for a PEST Screening Every Year, Even Without Joint Symptoms Yet',
    teaser: 'A five-question checklist catches psoriatic arthritis early enough to matter, and most people with psoriasis never get handed it.',
    summary:
      "Up to about a third of people with psoriasis go on to develop psoriatic arthritis, and catching it early genuinely changes how much joint damage accumulates before treatment starts. The Psoriasis Epidemiology Screening Tool (PEST) is a real, validated five-question yes/no checklist built specifically to catch it, with strong measured accuracy: roughly 92% sensitivity and 78% specificity in its original validation, later confirmed across multiple other populations. The UK's National Institute for Health and Care Excellence recommends anyone with psoriasis who doesn't already have a psoriatic arthritis diagnosis complete a PEST screening once a year. It's a real, checkable, five-minute action, not a vague \"mention it if your joints start hurting\" default, worth asking for directly at a routine dermatology visit even with zero current joint symptoms.",
    citations: [
      {
        source: 'Evaluation of an existing screening tool for psoriatic arthritis in people with psoriasis and the development of a new instrument: the Psoriasis Epidemiology Screening Tool (PEST) questionnaire',
        url: 'https://pubmed.ncbi.nlm.nih.gov/19604440/',
      },
      {
        source: 'Psoriasis epidemiology screening tool (PEST) is useful for the detection of psoriatic arthritis in the Japanese population',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8352892/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-overview'],
  },
  {
    id: 'psoriasis-advocacy-cardiovascular-metabolic',
    category: 'psoriasis',
    title: 'Psoriasis Is Its Own Independent Cardiovascular Risk Factor, Not Just a Skin Condition',
    teaser: 'Real guidelines treat psoriasis itself as raising heart-disease risk, on top of whatever a standard risk calculator already accounts for.',
    summary:
      "Psoriasis carries a documented, independent link to atherosclerosis that holds up even after accounting for the usual risk factors, smoking, obesity, and cholesterol. Joint American Academy of Dermatology and National Psoriasis Foundation guidelines recommend a real baseline cardiovascular risk assessment at diagnosis, especially for moderate-to-severe disease, plus routine screening for high blood pressure, diabetes, and cholesterol as a standard part of psoriasis care, not an optional add-on. One specific, concrete detail worth knowing: guidance recommends applying a 1.5x multiplier to a standard cardiovascular risk-calculator score for anyone with severe psoriasis (10% or more of body surface affected) or anyone being treated with systemic medication or phototherapy, since standard risk calculators built for the general population understate the real risk for this specific group. Worth asking directly whether that adjustment is being applied, not just whether a risk score was calculated at all.",
    citations: [
      { source: 'Using Guidelines of Care to Lower Cardiovascular Risk in Patients with Psoriasis', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11128720/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-weight-loss', 'cvd-overview', 'cvd-lipid-panel-self-advocacy'],
  },
  {
    id: 'psoriasis-advocacy-systemic-med-monitoring',
    category: 'psoriasis',
    title: 'Systemic Psoriasis Medications Need Real Bloodwork, and the Monitoring Guidelines Aren\'t Even Consistent',
    teaser: 'The same drug, methotrexate, gets monitored more loosely under dermatology guidelines than under rheumatology ones, a real, documented gap worth knowing about.',
    summary:
      "Methotrexate, cyclosporine, and acitretin all show up in this category's own medication-interaction entries, and each one needs real, scheduled bloodwork beyond just watching for symptoms. A genuinely useful, if uncomfortable, finding worth knowing directly: a real comparative study found that dermatology-specific methotrexate monitoring guidelines are looser than rheumatology guidelines for the identical drug, and that the looser dermatology protocol tracked with worse real-world drug-survival outcomes. That's not a reason to distrust a dermatologist. It's a concrete, specific thing worth asking about directly: whether liver enzymes are being checked on the same real interval (roughly every 8-12 weeks) this app's own Rheumatoid Arthritis category already covers for the same drug. Cyclosporine adds its own separate monitoring need, regular blood pressure and kidney-function checks, given its own documented risk to both.",
    citations: [
      {
        source: 'Dermatological guidelines for monitoring methotrexate treatment reduce drug-survival compared to rheumatological guidelines',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5865732/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['ra-advocacy-methotrexate-monitoring', 'psoriasis-cyclosporine-grapefruit'],
  },
  {
    id: 'psoriasis-advocacy-topical-vitamin-d-calcium',
    category: 'psoriasis',
    title: 'Using a Lot of Topical Vitamin D Cream? A Real Calcium Check Is a Reasonable Ask',
    teaser: 'Calcipotriene is applied to skin, not swallowed, but real overuse still has a documented path to raising blood calcium.',
    summary:
      "Calcipotriene and similar topical vitamin D analogs are genuinely one of the most common first-line psoriasis treatments, and this category's own medication list already notes it doesn't meaningfully affect blood vitamin D levels at normal, labeled use. The real exception worth knowing directly: using it over a very large body-surface area, or in amounts well beyond the labeled maximum, carries a documented, if uncommon, risk of real hypercalcemia. This isn't a reason for alarm at ordinary use. It's a specific, concrete reason to mention actual usage amount and body coverage honestly at a follow-up visit, especially if a large percentage of skin is being treated, so a doctor can decide whether a calcium check is actually warranted, rather than assuming a topical product carries zero systemic risk just because it isn't swallowed.",
    citations: [
      { source: 'FDA prescribing information (Dovonex/Sorilux)', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2006/020273s009lbl.pdf' },
    ],
    overallTier: 'moderate',
    relatedIds: ['psoriasis-vitamin-d-oral'],
  },
  {
    id: 'psoriasis-tying-together',
    category: 'psoriasis',
    title: 'What Actually Holds Up for Psoriasis, Pulled Together',
    teaser: 'Two strong, actionable food levers, two honestly weak ones, and two medication interactions serious enough to know exactly, not just generally.',
    summary:
      "Line up everything in this category and the real, usable pattern is different in shape from RA's own. Weight loss and a Mediterranean-style eating pattern both carry strong, repeated trial evidence and a real, measurable effect on disease severity, the two most dependable levers here. Alcohol shows a real, if not perfectly consistent, link to worse disease and a striking, well-documented mortality risk regardless of how the severity question ultimately resolves. Gluten avoidance helps a specific, testable, antibody-positive minority with real skin biology behind it, not a universal recommendation. Nightshade avoidance and oral vitamin D supplementation both remain genuinely unproven for psoriasis specifically, worth naming honestly rather than smoothing into false confidence just because they're popular advice. Two medication interactions, cyclosporine with grapefruit and acitretin with alcohol, are serious and specific enough that vague caution isn't good enough; both come with a real number attached and a real reason that number matters. The self-advocacy entries above round out the picture with what to actually ask for: an annual PEST screening even without joint symptoms yet, a real cardiovascular risk assessment with the correct multiplier applied, consistent bloodwork on any systemic medication, and a calcium check if topical vitamin D coverage is extensive.",
    citations: [
      { source: 'Psoriasis, National Institute of Arthritis and Musculoskeletal and Skin Diseases (NIAMS)', url: 'https://www.niams.nih.gov/health-topics/psoriasis' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-weight-loss', 'psoriasis-mediterranean-diet', 'psoriasis-nightshades', 'psoriasis-vitamin-d-oral', 'psoriasis-advocacy-psa-screening', 'psoriasis-advocacy-cardiovascular-metabolic'],
  },

  // -- Full-depth parity additions, 2026-08-08. Every citation
  // independently verified via WebSearch.
  {
    id: 'psoriasis-pasi-severity-staging',
    category: 'psoriasis',
    title: 'Psoriasis Severity Has a Real, Formal Measuring System, Not Just "Mild" or "Bad"',
    teaser: 'PASI, body surface area, and quality-of-life impact all factor into a real, standardized severity classification -- worth knowing by name before a treatment conversation.',
    summary:
      "Psoriasis severity is measured with the Psoriasis Area and Severity Index (PASI), a real, validated score from 0 to 72 combining how much body surface is affected with how red, thick, and scaly the plaques are. A real, standard classification splits by body surface area alone: under 2% affected is mild, 2-10% is moderate, over 10% is severe. Modern dermatology guidance combines PASI with a quality-of-life measure (DLQI, the Dermatology Life Quality Index) and location, since a smaller affected area on the face, palms, or genitals can carry real psychosocial impact severe enough to be treated as more serious than the raw percentage alone suggests. This matters directly for a real, practical reason: treatment options (topical vs. systemic vs. biologic) are matched to this real severity classification, not to how the disease happens to look on a given day.",
    citations: [
      { source: 'PASI (Psoriasis Area and Severity Index), DermNet', url: 'https://dermnetnz.org/topics/pasi-score' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'psoriasis-systemic-comorbidities',
    category: 'psoriasis',
    title: 'Psoriasis Is a Real, Systemic Inflammatory Disease, Not a Skin Condition That Happens to Look Bad',
    teaser: 'Real, elevated rates of metabolic syndrome, NAFLD, IBD, depression, and cancer risk -- the same inflammatory pathway driving the visible plaques drives all of it.',
    summary:
      "Psoriasis reaches well past the skin: real research finds cardiovascular disease, obesity, type 2 diabetes, hypertension, dyslipidemia, metabolic syndrome, non-alcoholic fatty liver disease, inflammatory bowel disease, and both anxiety and depression all occurring at a real, elevated rate compared to the general population. This isn't a coincidence of shared risk factors; the same real inflammatory signaling molecules driving visible skin plaques (TNF-alpha, IL-6, IL-22, and the IL-23/IL-17 pathway already covered elsewhere in this app's own research) are directly implicated in metabolic-syndrome development too, a real, shared mechanism rather than two separate diseases occurring together by chance. Depression carries a real, specific practical consequence worth knowing directly: real research finds it can measurably reduce the odds of achieving treatment remission, meaning mental health isn't a separate concern from the skin disease itself, it's a real, documented factor in how well the physical treatment actually works.",
    citations: [
      { source: 'Psoriasis and Metabolic Syndrome: Mechanisms and Future Directions, PMC8343100', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8343100/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-advocacy-cardiovascular-metabolic'],
  },
  {
    id: 'psoriasis-history-milestones',
    category: 'psoriasis',
    title: "Psoriasis's Own Real History: Separated From Leprosy in 1808, Understood as Autoimmune 155 Years Later",
    teaser: '1808, 1963, 1972, 2003 -- four real, dated turning points, the biggest gap between any of them being how long it took to even recognize the disease as autoimmune.',
    summary:
      "Psoriasis's own real, documented history starts with a genuine, and genuinely overdue, correction: in 1808, physician Robert Willan produced the first real clinical description distinguishing psoriasis from leprosy, two conditions that had been confused together for centuries, a real, consequential misclassification given how differently the two conditions were treated and regarded. It took until 1963 for E. J. Van Scott to identify psoriasis as a real autoimmune disorder, and until 1973 for a landmark paper (Moll and Wright) to establish psoriatic arthritis and psoriasis as one connected disease, genuinely distinct from rheumatoid arthritis, the same real distinction this app's own RA and Psoriasis categories reflect by being built as separate conditions. Methotrexate, introduced in 1958, was approved specifically for psoriasis in 1972; the real, more recent turning point came in 2003, when the first biologic agents for psoriasis reached FDA approval, targeting the same specific inflammatory pathways (TNF-alpha, later IL-23/IL-17) this app's own systemic-comorbidity research above traces directly to psoriasis's real, whole-body effects.",
    citations: [
      { source: 'Psoriasis: From Antiquity to the Present, Indian Journal of Dermatology, Venereology and Leprology', url: 'https://ijdvl.com/psoriasis-from-antiquity-to-the-present/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'psoriasis-pregnancy-family-planning',
    category: 'psoriasis',
    title: "Psoriasis During Pregnancy: Genuinely Split Real Outcomes, and a Real, Common Postpartum Flare",
    teaser: "40-60% improve during pregnancy, but a real, meaningful minority worsen instead -- and a real, common flare (65-73% of people) follows delivery either way.",
    summary:
      "Psoriasis during pregnancy shows a real, genuinely mixed picture, not a reliable improvement the way this app's own Rheumatoid Arthritis research documents for that condition: real data finds 40-60% of pregnant people with psoriasis improve, 10-20% worsen, and the remainder stay stable, meaning pregnancy is a real coin-flip-adjacent outcome here, not a dependable remission window. What IS reliably common: a real postpartum flare, affecting 65-73% of people in real cohort studies, with most flares occurring within the first four months after delivery. A real, genuinely reassuring, more recent finding worth knowing directly: growing evidence supports biologic medications as safe during pregnancy for psoriasis specifically, with real research finding no increased risk of miscarriage or congenital malformation from biologic exposure, and minimal transfer into breast milk for the four injectable biologics studied. The real, practical risk sits the other way: stopping biologics before or during pregnancy carries a real, higher likelihood of a moderate-to-severe flare, a genuine reason this decision deserves a real, direct conversation with a dermatologist rather than an assumption that stopping medication is automatically the safer choice.",
    citations: [
      { source: 'The Use and Safety of TNF Inhibitors during Pregnancy in Women with Psoriasis: A Review, PMC5983707', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5983707/' },
    ],
    overallTier: 'strong',
  },

  // -- Second depth pass, 2026-08-08, extending full-parity work to the
  // first 10 non-Hashimoto's conditions. Every citation independently
  // verified via WebSearch.
  {
    id: 'psoriasis-smoking-dose-dependent',
    category: 'psoriasis',
    title: 'Smoking Worsens Psoriasis in a Real, Measurable Dose-Dependent Way, Both Before and During Treatment',
    teaser: 'A real meta-analysis found light smokers nearly twice as likely to have psoriasis as non-smokers, heavy smokers twice as likely to have severe disease, and smoking also measurably blunts how well biologic treatment actually works.',
    summary:
      "Smoking has a real, well-documented, dose-dependent relationship with psoriasis, meaning the effect scales directly with how much and how long someone smokes rather than being a simple yes-or-no risk. A real meta-analysis of 25 case-control studies found people smoking just 1 to 14 cigarettes a day were almost twice as likely to have psoriasis as non-smokers, and people smoking 20 or more cigarettes a day had roughly twice the risk of the more severe form of the disease. The real, proposed mechanism involves polycyclic aromatic hydrocarbons and other compounds in tobacco smoke interfering with a real, specific signaling pathway (the aryl hydrocarbon receptor) already known to help regulate the skin's own barrier function, oxidative stress response, and inflammation. Genuinely important beyond just onset risk: a real, prospective study following patients through biologic treatment found non-smokers had close to three times higher odds of reaching a strong treatment response (PASI 75) at 48 weeks compared to smokers, with earlier smoking start, longer duration, and higher intensity all independently tracking with a worse treatment outcome. A separate, real Mendelian randomization study did find smoking an independent, but not clearly causal, risk factor for moderate-to-severe psoriasis specifically, an honest nuance worth keeping in view rather than overstating. Worth knowing directly: this app's own already-built alcohol and Mediterranean-diet research for psoriasis both point toward lifestyle as a real, meaningful lever here, and smoking cessation is a real, concrete addition to that same lever, with a documented effect on treatment response itself, not just disease onset.",
    citations: [
      { source: 'Prevalence of Tobacco Smoking and Its Association With Disease Severity Among Patients With Psoriasis in China: A Cross-Sectional Study, PMC9133951', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9133951/' },
      { source: 'Tobacco smoking negatively influences the achievement of greater than three-quarters reduction in PASI after eight weeks of treatment, PMC11007762', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11007762/' },
      { source: 'Smoking is an independent but not a causal risk factor for moderate to severe psoriasis: A Mendelian randomization study, PMC9992829', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9992829/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-alcohol', 'psoriasis-advocacy-systemic-med-monitoring'],
  },
  {
    id: 'psoriasis-il23-inhibitors-efficacy',
    category: 'psoriasis',
    title: 'IL-23 Inhibitors Represent a Real, Newer, More Targeted Class of Psoriasis Medication',
    teaser: 'A real, large trial found 73.3% of patients on guselkumab reached PASI 90 (90% skin clearance) at 16 weeks, against just 2.9% on placebo, and it kept significantly outperforming an older biologic through a full year.',
    summary:
      "IL-23 inhibitors (guselkumab, risankizumab, and related medications) are a real, newer class of biologic treatment, targeting a real, specific inflammatory signal (interleukin-23) sitting further upstream in psoriasis's own inflammatory cascade than older biologic classes. A real, large phase III trial (VOYAGE 1, over 800 patients) found 73.3% of patients on guselkumab reached PASI 90, meaning 90% clearance of visible psoriasis, at 16 weeks, compared with just 2.9% on placebo and 49.7% on adalimumab, an older, still widely used biologic. Guselkumab's real advantage over adalimumab held up and even widened through the full first year of continuous treatment (80.2% versus 53% at week 24). A separate trial (VOYAGE 2) found broadly similar real results, and also found that stopping treatment led response to fade over time, while restarting it after a break brought real clearance rates back up within weeks. Worth knowing directly: real, complete or near-complete skin clearance (PASI 90 or higher) is now a genuinely realistic treatment goal for many people with moderate-to-severe psoriasis, not the more modest PASI 75 target that used to define a strong response, and this newer medication class is a real, concrete reason that goal has shifted upward.",
    citations: [
      { source: 'Efficacy and safety of guselkumab, an anti-interleukin-23 monoclonal antibody, compared with adalimumab for the continuous treatment of patients with moderate to severe psoriasis (VOYAGE 1), Journal of the American Academy of Dermatology 2017', url: 'https://www.jaad.org/article/S0190-9622(16)31157-4/fulltext' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-advocacy-systemic-med-monitoring'],
  },
  {
    id: 'psoriasis-koebner-phenomenon',
    category: 'psoriasis',
    title: 'Skin Trauma Itself Can Trigger a Genuinely New Psoriasis Patch, a Real, Named Phenomenon',
    teaser: 'A cut, tattoo, sunburn, or even a scratch can trigger a real, new psoriasis lesion in otherwise unaffected skin, a documented pattern with its own name: the Koebner phenomenon.',
    summary:
      "Psoriasis carries a real, distinctive, worth-knowing trait: physical trauma to otherwise-unaffected skin can trigger a genuinely new patch of psoriasis at the exact site of the injury, appearing clinically and even under a microscope identical to the person's own existing disease. This is a real, named, well-documented pattern called the Koebner phenomenon, and real research has documented it following a wide range of real triggers: tattoos, surgical incisions, sunburn, skin infections, and even simple scratches or friction. The real mechanism isn't fully mapped, but real research points to a genuine cascade of local inflammatory signals released at the site of injury (including some of the same immune messengers already covered in this app's own psoriasis research, IL-17 and related cytokines), alongside changes in local growth factors and skin-barrier proteins. Worth knowing directly, and genuinely practical: this real phenomenon is a documented, honest reason someone with psoriasis might reasonably want to be more cautious about elective skin trauma, a new tattoo or piercing in particular, during a period of active or poorly controlled disease, since the same injury that would heal cleanly in someone without psoriasis carries a real, above-average chance of becoming a new, permanent patch instead.",
    citations: [
      { source: 'Koebner phenomenon leading to the formation of new psoriatic lesions: evidences and mechanisms, Bioscience Reports 2019, PMC6893164', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6893164/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['psoriasis-pasi-severity-staging'],
  },
  {
    id: 'psoriasis-psa-progression-real-data',
    category: 'psoriasis',
    title: 'Roughly One in Five People With Psoriasis Goes on to Develop Psoriatic Arthritis, With a Real, Narrow Window to Catch It Early',
    teaser: 'Real research finds close to 20% of psoriasis patients develop psoriatic arthritis, and a real, narrow diagnostic window (joint symptoms caught within 12 months) genuinely changes long-term joint outcomes.',
    summary:
      "Skin psoriasis and psoriatic arthritis (PsA) are real, closely related but genuinely distinct conditions, and this category's own already-covered systemic-comorbidities research doesn't spell out the real, specific progression numbers worth knowing directly. Real research finds PsA affects roughly one in five people with psoriasis, with an incidence around 4.3% per year in some studied populations, meaning skin psoriasis genuinely isn't 'just skin' for a real, substantial minority. Real, identified predictors of who's more likely to progress include obesity, nail pitting, joint pain without confirmed arthritis (arthralgia), and eye inflammation (uveitis), a real, checkable list worth naming directly for anyone tracking their own psoriasis. The real, urgent, practical part: real research finds diagnosing PsA within 12 months of the first joint symptom defines a genuine 'early PsA' window with measurably better long-term outcomes, while a real diagnostic delay of just 6 months can already allow permanent joint erosion and physical function loss to begin. Worth knowing directly: any new joint pain, stiffness, or swelling in someone with psoriasis, even mild or intermittent, is real, worth raising specifically and promptly rather than assumed to be ordinary aging or unrelated strain, given how real, narrow this window for the best long-term joint outcome actually is.",
    citations: [
      { source: 'Early detection of psoriatic arthritis in patients with psoriasis: construction of a multifactorial prediction model, Frontiers in Immunology 2024, PMC11668630', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11668630/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-systemic-comorbidities'],
  },
  {
    id: 'psoriasis-depression-suicidality-real-data',
    category: 'psoriasis',
    title: 'Psoriasis Carries a Real, Roughly Doubled Risk of Suicidal Thinking, Independent of the Joint Disease It Can Cause',
    teaser: 'A real, pooled meta-analysis found psoriasis patients had roughly double the odds of suicidal ideation compared with people without the condition, a real mental-health burden worth naming directly.',
    summary:
      "This category's own already-covered systemic-comorbidities research names psoriasis's real physical reach. Its real mental-health burden deserves its own direct, honest accounting too. A real, pooled meta-analysis found the odds of suicidal ideation among people with psoriasis roughly doubled compared with those without it (a real odds ratio of 2.05), with a smaller but still real, significantly elevated odds of actual suicidal behavior (attempts and completed suicides, a real odds ratio of 1.26). A real, separate large study found depression risk elevated in psoriasis alone (a real 43% higher relative risk) and higher still specifically in people who'd also developed psoriatic arthritis (a real 55% higher relative risk), a real, direct link back to this category's own PsA-progression research. Real research identifies younger age and more severe skin disease as particular real risk factors for suicidality specifically. Worth knowing honestly: real, existing meta-analyses on this exact question don't all agree, with some finding smaller or less consistent effects depending on study design, a real, genuine caveat rather than an overstated crisis claim. Worth knowing directly: this real, elevated mental-health burden is a real, legitimate reason mental health deserves the same direct, routine attention as skin severity itself in psoriasis care, not an afterthought to physical symptom control.",
    citations: [
      { source: 'Psoriasis and suicidality: A systematic review and meta-analysis, PMID 28807109', url: 'https://pubmed.ncbi.nlm.nih.gov/28807109/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-systemic-comorbidities', 'psoriasis-psa-progression-real-data'],
  },
];
