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
    teaser: 'Visible on the outside, but driven by the same overactive immune system already tracked throughout this research.',
    summary:
      "Psoriasis is the immune system driving skin cells to multiply far faster than normal, piling up into the thick, scaly, often itchy plaques the disease is known for. Roughly a third of people with psoriasis go on to develop psoriatic arthritis, a related form that attacks the joints the way rheumatoid arthritis does. Despite looking like a purely dermatological condition, psoriasis shares biology with every other autoimmune disease in this Digest: the same inflammatory cytokines, a documented link to obesity and metabolic disease, and a real, if partial, overlap with gluten sensitivity in a specific subgroup of patients. Diet won't cure psoriasis, and nothing here replaces a dermatologist's treatment plan. What follows is what the actual research supports, kept honest about how strong each finding really is, including the places where the evidence is mixed rather than settled.",
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
    teaser: 'Not a general wellness suggestion. Randomized trials measured actual PASI score drops from modest weight loss.',
    summary: "Of everything studied for psoriasis, intentional weight loss carries the clearest trial evidence. A randomized clinical study put obese psoriasis patients on a low-energy diet, roughly 800 to 1,000 calories a day for eight weeks, then reintroduced food gradually over another eight weeks, and found significant improvement in disease severity compared to a control group eating their usual diet. A more recent systematic review pooling multiple randomized trials found the same pattern held up at scale: weight-loss interventions produced an average PASI reduction of 2.5 points more than control, and meaningfully raised the odds of reaching PASI75, a 75% improvement in symptoms, the same bar most psoriasis drug trials use to define success. The obesity-psoriasis relationship runs both directions. Obesity worsens psoriasis through the same low-grade systemic inflammation the Mitochondria & Metabolism research already covers for visceral fat, and psoriasis itself can make weight loss harder. A 10 to 15% reduction in body weight is the specific target the strongest trials point to, not an indefinite goal.",
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
    title: 'A 2025 Trial Put a Number on the Mediterranean Diet for Psoriasis',
    teaser: 'A dietitian-guided Mediterranean diet, tested head-to-head against standard low-fat advice, in a 16-week randomized trial.',
    summary:
      "The MEDIPSO trial, run in Madrid and completed in 2025, randomized adults with mild-to-moderate psoriasis to either a dietitian-guided Mediterranean diet or standard low-fat dietary advice for 16 weeks. The Mediterranean diet group showed significantly greater improvement in psoriasis severity, and the more closely someone actually followed the diet, the more they improved, a dose-response pattern that strengthens the case this isn't coincidence. A separate, earlier case-control study found the same relationship from the other direction: people with psoriasis scored measurably lower on a standard Mediterranean diet adherence scale than people without it, and lower adherence tracked with worse disease severity and quality of life. Two different study designs, the same pattern, pointing at one of the more actionable findings in this entire category.",
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
    title: 'Alcohol and Psoriasis: An Association That Splits by Sex',
    teaser: 'Heavier drinking tracks with worse psoriasis, most clearly documented in men, and a separate mortality finding applies regardless of sex.',
    summary:
      "Alcohol's relationship with psoriasis is one of the more consistently documented lifestyle links in this whole category, though the exact shape of it depends on who's being studied. Increasing alcohol use tracks with worsening psoriasis severity and a poorer response to systemic treatment, and heavy drinking shows up significantly more often in men with severe disease than men with mild disease. Some studies found a striking relative risk as high as 8.01 for plaque-type psoriasis in men who drink heavily, while the same research didn't find a comparable increased risk in women drinking at typical levels, though at least one separate study found elevated risk in women drinking 2.3 or more drinks a week. That inconsistency across studies is worth stating plainly rather than smoothing over. What isn't in dispute is a separate, striking finding: people with psoriasis carry roughly 60% higher alcohol-related mortality than the general population of the same age and sex, a reason to take alcohol screening seriously in psoriasis care regardless of how the severity link ultimately resolves.",
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
    teaser: 'The subgroup finding is already named elsewhere. Here\'s what a gluten-free diet was actually measured doing inside the skin itself.',
    summary: "The Other Autoimmune Diseases category already names the headline finding: a specific subgroup of psoriasis patients test positive for gliadin antibodies, and that exact subgroup sees measurable skin improvement on a gluten-free diet. What's worth adding here is the mechanism, because it's more concrete than most diet-and-skin findings get. Researchers biopsied the skin of gliadin antibody-positive psoriasis patients before and after three months on a gluten-free diet and found tissue transglutaminase, an enzyme that was highly overexpressed in the affected skin's blood vessel lining, dropped by roughly 50%. A marker of active cell proliferation in the skin dropped significantly too. Roughly 16% of people with plaque psoriasis carry these antibodies, a testable minority rather than a universal trigger. If psoriasis runs in a family alongside celiac disease or other gluten-related conditions, this is a concrete, biopsy-confirmed reason to ask a doctor about antibody testing before assuming a gluten-free diet either will or won't help.",
    citations: [
      { source: 'Gluten-free Diet in Psoriasis Patients with Antibodies to Gliadin Results in Decreased Expression of Tissue Transglutaminase and Fewer Ki67+ Cells in the Dermis, Acta Dermato-Venereologica', url: 'https://medicaljournalssweden.se/actadv/article/view/11356' },
    ],
    overallTier: 'moderate',
    relatedIds: ['other-psoriasis'],
  },
  {
    id: 'psoriasis-nightshades',
    category: 'psoriasis',
    title: 'Nightshades and Psoriasis: A Pattern for Some, Not a Proven Trigger for Everyone',
    teaser: 'Widely repeated advice with almost no clinical evidence behind it, and a reason the amount involved makes the proposed mechanism unlikely.',
    summary:
      "Nightshade avoidance, cutting out tomatoes, potatoes, peppers, and eggplant, is some of the most commonly repeated psoriasis diet advice online, and it's worth being honest about how thin the actual evidence is. The proposed mechanism centers on solanine, a compound in the nightshade family that some believe drives inflammation. Solanine is real, but it concentrates almost entirely in the leaves and stems of these plants, not the parts anyone actually eats, and the amount present in a normal serving of tomato or potato is far below what would be needed to produce any measurable inflammatory effect. No clinical trial has tested nightshade elimination in psoriasis specifically. What exists instead is a split in anecdotal reports: some people say cutting nightshades helped, most see no difference at all, and dietitians disagree on whether the pattern is worth taking seriously. That doesn't make it worthless to test personally, only worth testing honestly, without assuming the answer in advance. A short elimination of a few weeks, followed by a deliberate reintroduction, is the only way to actually find out whether this applies to any one person's own body.",
    citations: [
      { source: 'Exploring the Connection Between Nightshades and Psoriasis, plaquepsoriasis.com', url: 'https://plaquepsoriasis.com/living/what-are-nightshades' },
    ],
    overallTier: 'weak',
    relatedIds: ['problem-nightshades'],
  },
  {
    id: 'psoriasis-vitamin-d-oral',
    category: 'psoriasis',
    title: 'Oral Vitamin D for Psoriasis: A Unresolved Split in the Trial Evidence',
    teaser: 'One trial found improvement at three months. A larger, longer trial found nothing. The honest answer is that it isn\'t settled either way.',
    summary:
      "Vitamin D's relationship with psoriasis is more complicated than it first appears, and worth separating clearly into two different questions. Topical vitamin D analogs applied directly to plaques, like calcipotriene, are a well-established, first-line psoriasis treatment with strong evidence behind them. Oral, dietary-style vitamin D supplementation is a separate question with a much less settled answer. One randomized, placebo-controlled trial found a significant improvement in psoriasis severity at three months on vitamin D2. A larger, longer trial giving 100,000 IU of vitamin D3 monthly for a full year found no difference in severity between the vitamin D group and placebo at any point, even though blood vitamin D levels rose as expected in both groups. A meta-analysis pooling the available randomized trials initially found a favorable effect at six months, but that result stopped being statistically significant once a stricter statistical adjustment was applied. The honest summary: oral vitamin D supplementation for psoriasis specifically remains unproven, different from the well-supported topical route, and not something to expect a skin-clearing result from on its own.",
    citations: [
      { source: 'Effectiveness of oral vitamin D supplementation in lessening disease severity among patients with psoriasis: A systematic review and meta-analysis of randomized controlled trials', url: 'https://pubmed.ncbi.nlm.nih.gov/33183899/' },
      { source: 'Oral vitamin D3 supplementation for chronic plaque psoriasis: a randomized, double-blind, placebo-controlled trial', url: 'https://pubmed.ncbi.nlm.nih.gov/29480035/' },
    ],
    overallTier: 'weak',
    relatedIds: ['nutrient-vitamin-d', 'psoriasis-advocacy-topical-vitamin-d-calcium'],
  },
  {
    id: 'psoriasis-omega3-mixed',
    category: 'psoriasis',
    title: 'Omega-3s Help RA More Reliably Than They Help Psoriasis',
    teaser: 'The same nutrient already named as its strongest RA finding turns out far less consistent for psoriasis specifically.',
    summary: "It's worth reading this alongside the omega-3 finding in the Rheumatoid Arthritis category, because the contrast is real and instructive. For RA, omega-3 supplementation carries strong, repeated trial evidence. For psoriasis, the picture is weaker. A meta-analysis of randomized controlled trials found fish oil taken alone had no measurable effect on PASI score, lesion area, or itching. Five trials in the same body of research found some benefit; eight found none, and pooled together, fish oil supplementation wasn't associated with reduced disease severity when used by itself. The one place omega-3s showed promise was in combination with standard psoriasis treatment rather than as a stand-alone approach, several reviews found an added benefit when fish oil was paired with conventional therapy rather than used on its own. The same nutrient, studied with rigor in two different autoimmune diseases, landing in two different places, is exactly the kind of honest, disease-specific distinction worth holding onto rather than assuming one finding transfers automatically to the next condition.",
    citations: [
      { source: 'Effects of fish oil supplement on psoriasis: a meta-analysis of randomized controlled trials', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6896351/' },
    ],
    overallTier: 'weak',
    relatedIds: ['ra-omega3', 'omega36-tying-together'],
  },
  {
    id: 'psoriasis-cyclosporine-grapefruit',
    category: 'psoriasis',
    title: 'Cyclosporine and Grapefruit: A Measured Overdose Risk',
    teaser: 'Not a mild absorption tweak. Studies measured drug levels over 60% higher after grapefruit juice.',
    summary:
      "Cyclosporine, a systemic immunosuppressant used for severe psoriasis, has one of the more concrete and well-measured food-drug interactions covered anywhere here. Grapefruit and grapefruit juice block an intestinal enzyme, CYP3A4, that normally breaks down part of an oral cyclosporine dose before it fully absorbs into the bloodstream. With that enzyme blocked, more of the dose gets through. Clinical measurements found blood cyclosporine levels running more than 60% higher after grapefruit juice, a large enough shift to push an already-therapeutic dose into overdose territory, not a subtle nutrient-timing effect. Because cyclosporine already carries kidney and blood-pressure risks that scale with dose, this isn't an interaction to try timing around. The straightforward, doctor-supported approach is avoiding grapefruit and grapefruit juice entirely for as long as cyclosporine treatment continues.",
    citations: [
      { source: 'Dosing implications of a clinical interaction between grapefruit juice and cyclosporine and metabolite concentrations in patients with autoimmune diseases', url: 'https://pubmed.ncbi.nlm.nih.gov/9002010/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-acitretin-alcohol', 'problem-raw-undercooked-meat-eggs'],
  },
  {
    id: 'psoriasis-acitretin-alcohol',
    category: 'psoriasis',
    title: 'Acitretin and Alcohol: Why "Avoid It" Actually Means Years, Not Just Tonight',
    teaser: 'A single drink converts this drug into a different one with a wildly longer half-life, extending teratogenic risk well past when treatment ends.',
    summary: "Acitretin, an oral retinoid used for moderate-to-severe plaque psoriasis, carries one of the more serious food-and-substance interactions covered anywhere. Alcohol taken during acitretin treatment converts the drug into etretinate, a related retinoid with a dramatically longer half-life, roughly 120 days compared to acitretin's 49 hours. That single conversion matters enormously because acitretin, like every retinoid, carries a teratogenic risk, meaning it can cause serious birth defects. A drug that normally clears the body in days instead lingers, in one documented case, still detectable in blood and fat tissue 52 months after the last dose was taken, because of alcohol consumed during treatment. This is exactly why alcohol is specifically prohibited during acitretin treatment and for at least two months after stopping, a different and stricter rule than the general moderation advice attached to most other medications.",
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
      "Up to about a third of people with psoriasis go on to develop psoriatic arthritis, and catching it early changes how much joint damage accumulates before treatment starts. The Psoriasis Epidemiology Screening Tool (PEST) is a validated five-question yes/no checklist built specifically to catch it, with strong measured accuracy: roughly 92% sensitivity and 78% specificity in its original validation, later confirmed across multiple other populations. The UK's National Institute for Health and Care Excellence recommends anyone with psoriasis who doesn't already have a psoriatic arthritis diagnosis complete a PEST screening once a year. It's a checkable, five-minute action, not a vague \"mention it if your joints start hurting\" default, worth asking for directly at a routine dermatology visit even with zero current joint symptoms.",
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
    teaser: 'Guidelines treat psoriasis itself as raising heart-disease risk, on top of whatever a standard risk calculator already accounts for.',
    summary:
      "Psoriasis carries a documented, independent link to atherosclerosis that holds up even after accounting for the usual risk factors, smoking, obesity, and cholesterol. Joint American Academy of Dermatology and National Psoriasis Foundation guidelines recommend a baseline cardiovascular risk assessment at diagnosis, especially for moderate-to-severe disease, plus routine screening for high blood pressure, diabetes, and cholesterol as a standard part of psoriasis care, not an optional add-on. One specific, concrete detail: guidance recommends applying a 1.5x multiplier to a standard cardiovascular risk-calculator score for anyone with severe psoriasis (10% or more of body surface affected) or anyone being treated with systemic medication or phototherapy, since standard risk calculators built for the general population understate the risk for this specific group. Worth asking directly whether that adjustment is being applied, not just whether a risk score was calculated at all.",
    citations: [
      { source: 'Using Guidelines of Care to Lower Cardiovascular Risk in Patients with Psoriasis', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11128720/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-weight-loss', 'cvd-overview', 'cvd-lipid-panel-self-advocacy'],
  },
  {
    id: 'psoriasis-advocacy-systemic-med-monitoring',
    category: 'psoriasis',
    title: 'Systemic Psoriasis Medications Need Bloodwork, and the Monitoring Guidelines Aren\'t Even Consistent',
    teaser: 'The same drug, methotrexate, gets monitored more loosely under dermatology guidelines than under rheumatology ones, a documented gap.',
    summary: "Methotrexate, cyclosporine, and acitretin all show up in this category's medication-interaction entries, and each one needs scheduled bloodwork beyond just watching for symptoms. A useful, if uncomfortable, finding: a comparative study found that dermatology-specific methotrexate monitoring guidelines are looser than rheumatology guidelines for the identical drug, and that the looser dermatology protocol tracked with worse real-world drug-survival outcomes. That's not a reason to distrust a dermatologist. It's a concrete, specific thing worth asking about directly: whether liver enzymes are being checked on the same interval (roughly every 8-12 weeks) the Rheumatoid Arthritis category already covers for the same drug. Cyclosporine adds its separate monitoring need, regular blood pressure and kidney-function checks, given its documented risk to both.",
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
    title: 'Using a Lot of Topical Vitamin D Cream? A Calcium Check Is a Reasonable Ask',
    teaser: 'Calcipotriene is applied to skin, not swallowed, but overuse still has a documented path to raising blood calcium.',
    summary:
      "Calcipotriene and similar topical vitamin D analogs are one of the most common first-line psoriasis treatments, and this category's medication list already notes it doesn't meaningfully affect blood vitamin D levels at normal, labeled use. The exception: using it over a very large body-surface area, or in amounts well beyond the labeled maximum, carries a documented, if uncommon, risk of hypercalcemia. This isn't a reason for alarm at ordinary use. It's a specific, concrete reason to mention actual usage amount and body coverage honestly at a follow-up visit, especially if a large percentage of skin is being treated, so a doctor can decide whether a calcium check is actually warranted, rather than assuming a topical product carries zero systemic risk just because it isn't swallowed.",
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
      "Line up everything in this category and the usable pattern is different in shape from RA's own. Weight loss and a Mediterranean-style eating pattern both carry strong, repeated trial evidence and a measurable effect on disease severity, the two most dependable levers here. Alcohol shows a real, if not perfectly consistent, link to worse disease and a striking, well-documented mortality risk regardless of how the severity question ultimately resolves. Gluten avoidance helps a specific, testable, antibody-positive minority with skin biology behind it, not a universal recommendation. Nightshade avoidance and oral vitamin D supplementation both remain unproven for psoriasis specifically, despite being popular advice. Two medication interactions, cyclosporine with grapefruit and acitretin with alcohol, are serious and specific enough that vague caution isn't good enough; both come with a number attached and a reason that number matters. The self-advocacy entries above round out the picture with what to actually ask for: an annual PEST screening even without joint symptoms yet, a cardiovascular risk assessment with the correct multiplier applied, consistent bloodwork on any systemic medication, and a calcium check if topical vitamin D coverage is extensive.",
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
    title: 'Psoriasis Severity Has a Formal Measuring System, Not Just "Mild" or "Bad"',
    teaser: 'PASI, body surface area, and quality-of-life impact all factor into a standardized severity classification, useful to know by name before a treatment conversation.',
    summary:
      "Psoriasis severity is measured with the Psoriasis Area and Severity Index (PASI), a validated score from 0 to 72 combining how much body surface is affected with how red, thick, and scaly the plaques are. A standard classification splits by body surface area alone: under 2% affected is mild, 2-10% is moderate, over 10% is severe. Modern dermatology guidance combines PASI with a quality-of-life measure (DLQI, the Dermatology Life Quality Index) and location, since a smaller affected area on the face, palms, or genitals can carry psychosocial impact severe enough to be treated as more serious than the raw percentage alone suggests. This matters directly for a practical reason: treatment options (topical vs. Systemic vs. Biologic) are matched to this severity classification, not to how the disease happens to look on a given day.",
    citations: [
      { source: 'PASI (Psoriasis Area and Severity Index), DermNet', url: 'https://dermnetnz.org/topics/pasi-score' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'psoriasis-systemic-comorbidities',
    category: 'psoriasis',
    title: 'Psoriasis Is a Systemic Inflammatory Disease, Not a Skin Condition That Happens to Look Bad',
    teaser: 'Elevated rates of metabolic syndrome, NAFLD, IBD, depression, and cancer risk, the same inflammatory pathway driving the visible plaques drives all of it.',
    summary: "Psoriasis reaches well past the skin: research finds cardiovascular disease, obesity, type 2 diabetes, hypertension, dyslipidemia, metabolic syndrome, non-alcoholic fatty liver disease, inflammatory bowel disease, and both anxiety and depression all occurring at an elevated rate compared to the general population. This isn't a coincidence of shared risk factors; the same inflammatory signaling molecules driving visible skin plaques (TNF-alpha, IL-6, IL-22, and the IL-23/IL-17 pathway already covered elsewhere in the research) are directly implicated in metabolic-syndrome development too, a shared mechanism rather than two separate diseases occurring together by chance. Depression carries a specific practical consequence: research finds it can measurably reduce the odds of achieving treatment remission, meaning mental health isn't a separate concern from the skin disease itself, it's a documented factor in how well the physical treatment actually works.",
    citations: [
      { source: 'Psoriasis and Metabolic Syndrome: Mechanisms and Future Directions, PMC8343100', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8343100/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-advocacy-cardiovascular-metabolic'],
  },
  {
    id: 'psoriasis-history-milestones',
    category: 'psoriasis',
    title: "Psoriasis's Own History: Separated From Leprosy in 1808, Understood as Autoimmune 155 Years Later",
    teaser: '1808, 1963, 1972, 2003, four dated turning points, the biggest gap between any of them being how long it took to even recognize the disease as autoimmune.',
    summary: "Psoriasis's documented history starts with a genuine, and overdue, correction: in 1808, physician Robert Willan produced the first clinical description distinguishing psoriasis from leprosy, two conditions that had been confused together for centuries, a consequential misclassification given how differently the two conditions were treated and regarded. It took until 1963 for E. J. Van Scott to identify psoriasis as an autoimmune disorder, and until 1973 for a landmark paper (Moll and Wright) to establish psoriatic arthritis and psoriasis as one connected disease, distinct from rheumatoid arthritis, the same distinction the RA and Psoriasis categories reflect by being built as separate conditions. Methotrexate, introduced in 1958, was approved specifically for psoriasis in 1972; the more recent turning point came in 2003, when the first biologic agents for psoriasis reached FDA approval, targeting the same specific inflammatory pathways (TNF-alpha, later IL-23/IL-17) the systemic-comorbidity research above traces directly to psoriasis's whole-body effects.",
    citations: [
      { source: 'Psoriasis: From Antiquity to the Present, Indian Journal of Dermatology, Venereology and Leprology', url: 'https://ijdvl.com/psoriasis-from-antiquity-to-the-present/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'psoriasis-pregnancy-family-planning',
    category: 'psoriasis',
    title: "Psoriasis During Pregnancy: Split Outcomes, and a Common Postpartum Flare",
    teaser: "40-60% improve during pregnancy, but a meaningful minority worsen instead, and a common flare (65-73% of people) follows delivery either way.",
    summary: "Psoriasis during pregnancy shows a mixed picture, not a reliable improvement the way the Rheumatoid Arthritis research documents for that condition: data finds 40-60% of pregnant people with psoriasis improve, 10-20% worsen, and the remainder stay stable, meaning pregnancy is a coin-flip-adjacent outcome here, not a dependable remission window. What IS reliably common: a postpartum flare, affecting 65-73% of people in cohort studies, with most flares occurring within the first four months after delivery. A reassuring, more recent finding: growing evidence supports biologic medications as safe during pregnancy for psoriasis specifically, with research finding no increased risk of miscarriage or congenital malformation from biologic exposure, and minimal transfer into breast milk for the four injectable biologics studied. The practical risk sits the other way: stopping biologics before or during pregnancy carries a higher likelihood of a moderate-to-severe flare, a reason this decision deserves a direct conversation with a dermatologist rather than an assumption that stopping medication is automatically the safer choice.",
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
    title: 'Smoking Worsens Psoriasis in a Measurable Dose-Dependent Way, Both Before and During Treatment',
    teaser: 'A meta-analysis found light smokers nearly twice as likely to have psoriasis as non-smokers, heavy smokers twice as likely to have severe disease, and smoking also measurably blunts how well biologic treatment actually works.',
    summary: "Smoking has a well-documented, dose-dependent relationship with psoriasis, meaning the effect scales directly with how much and how long someone smokes rather than being a simple yes-or-no risk. A meta-analysis of 25 case-control studies found people smoking just 1 to 14 cigarettes a day were almost twice as likely to have psoriasis as non-smokers, and people smoking 20 or more cigarettes a day had roughly twice the risk of the more severe form of the disease. The proposed mechanism involves polycyclic aromatic hydrocarbons and other compounds in tobacco smoke interfering with a specific signaling pathway (the aryl hydrocarbon receptor) already known to help regulate the skin's own barrier function, oxidative stress response, and inflammation. Important beyond just onset risk: a prospective study following patients through biologic treatment found non-smokers had close to three times higher odds of reaching a strong treatment response (PASI 75) at 48 weeks compared to smokers, with earlier smoking start, longer duration, and higher intensity all independently tracking with a worse treatment outcome. A separate, Mendelian randomization study did find smoking an independent, but not clearly causal, risk factor for moderate-to-severe psoriasis specifically, an honest nuance worth keeping in view rather than overstating. The already-built alcohol and Mediterranean-diet research for psoriasis both point toward lifestyle as a meaningful lever here, and smoking cessation is a concrete addition to that same lever, with a documented effect on treatment response itself, not just disease onset.",
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
    title: 'IL-23 Inhibitors Represent a Newer, More Targeted Class of Psoriasis Medication',
    teaser: 'A large trial found 73.3% of patients on guselkumab reached PASI 90 (90% skin clearance) at 16 weeks, against just 2.9% on placebo, and it kept significantly outperforming an older biologic through a full year.',
    summary:
      "IL-23 inhibitors (guselkumab, risankizumab, and related medications) are a newer class of biologic treatment, targeting a specific inflammatory signal (interleukin-23) sitting further upstream in psoriasis's inflammatory cascade than older biologic classes. A large phase III trial (VOYAGE 1, over 800 patients) found 73.3% of patients on guselkumab reached PASI 90, meaning 90% clearance of visible psoriasis, at 16 weeks, compared with just 2.9% on placebo and 49.7% on adalimumab, an older, still widely used biologic. Guselkumab's advantage over adalimumab held up and even widened through the full first year of continuous treatment (80.2% versus 53% at week 24). A separate trial (VOYAGE 2) found broadly similar results, and also found that stopping treatment led response to fade over time, while restarting it after a break brought clearance rates back up within weeks. Complete or near-complete skin clearance (PASI 90 or higher) is now a realistic treatment goal for many people with moderate-to-severe psoriasis, not the more modest PASI 75 target that used to define a strong response, and this newer medication class is a concrete reason that goal has shifted upward.",
    citations: [
      { source: 'Efficacy and safety of guselkumab, an anti-interleukin-23 monoclonal antibody, compared with adalimumab for the continuous treatment of patients with moderate to severe psoriasis (VOYAGE 1), Journal of the American Academy of Dermatology 2017', url: 'https://www.jaad.org/article/S0190-9622(16)31157-4/fulltext' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-advocacy-systemic-med-monitoring'],
  },
  {
    id: 'psoriasis-koebner-phenomenon',
    category: 'psoriasis',
    title: 'Skin Trauma Itself Can Trigger a New Psoriasis Patch, a Named Phenomenon',
    teaser: 'A cut, tattoo, sunburn, or even a scratch can trigger a new psoriasis lesion in otherwise unaffected skin, a documented pattern with its name: the Koebner phenomenon.',
    summary: "Psoriasis carries a distinctive trait: physical trauma to otherwise-unaffected skin can trigger a new patch of psoriasis at the exact site of the injury, appearing clinically and even under a microscope identical to the person's own existing disease. This is a named, well-documented pattern called the Koebner phenomenon, and research has documented it following a wide range of triggers: tattoos, surgical incisions, sunburn, skin infections, and even simple scratches or friction. The mechanism isn't fully mapped, but research points to a cascade of local inflammatory signals released at the site of injury (including some of the same immune messengers already covered in the psoriasis research, IL-17 and related cytokines), alongside changes in local growth factors and skin-barrier proteins. This phenomenon is a documented reason someone with psoriasis might reasonably want to be more cautious about elective skin trauma, a new tattoo or piercing in particular, during a period of active or poorly controlled disease, since the same injury that would heal cleanly in someone without psoriasis carries an above-average chance of becoming a new, permanent patch instead.",
    citations: [
      { source: 'Koebner phenomenon leading to the formation of new psoriatic lesions: evidences and mechanisms, Bioscience Reports 2019, PMC6893164', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6893164/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['psoriasis-pasi-severity-staging'],
  },
  {
    id: 'psoriasis-psa-progression-real-data',
    category: 'psoriasis',
    title: 'Roughly One in Five People With Psoriasis Goes on to Develop Psoriatic Arthritis, With a Narrow Window to Catch It Early',
    teaser: 'Research finds close to 20% of psoriasis patients develop psoriatic arthritis, and a narrow diagnostic window (joint symptoms caught within 12 months) changes long-term joint outcomes.',
    summary:
      "Skin psoriasis and psoriatic arthritis (PsA) are closely related but distinct conditions, and this category's already-covered systemic-comorbidities research doesn't spell out the specific progression numbers. Research finds PsA affects roughly one in five people with psoriasis, with an incidence around 4.3% per year in some studied populations, meaning skin psoriasis isn't 'just skin' for a substantial minority. Identified predictors of who's more likely to progress include obesity, nail pitting, joint pain without confirmed arthritis (arthralgia), and eye inflammation (uveitis), a checkable list for anyone tracking their psoriasis. The urgent, practical part: research finds diagnosing PsA within 12 months of the first joint symptom defines a 'early PsA' window with measurably better long-term outcomes, while a diagnostic delay of just 6 months can already allow permanent joint erosion and physical function loss to begin. Any new joint pain, stiffness, or swelling in someone with psoriasis, even mild or intermittent, is worth raising specifically and promptly rather than assumed to be ordinary aging or unrelated strain, given how narrow this window for the best long-term joint outcome actually is.",
    citations: [
      { source: 'Early detection of psoriatic arthritis in patients with psoriasis: construction of a multifactorial prediction model, Frontiers in Immunology 2024, PMC11668630', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11668630/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-systemic-comorbidities'],
  },
  {
    id: 'psoriasis-depression-suicidality-real-data',
    category: 'psoriasis',
    title: 'Psoriasis Carries a Roughly Doubled Risk of Suicidal Thinking, Independent of the Joint Disease It Can Cause',
    teaser: 'A pooled meta-analysis found psoriasis patients had roughly double the odds of suicidal ideation compared with people without the condition.',
    summary:
      "This category's already-covered systemic-comorbidities research names psoriasis's physical reach. Its mental-health burden deserves its direct, honest accounting too. A pooled meta-analysis found the odds of suicidal ideation among people with psoriasis roughly doubled compared with those without it (an odds ratio of 2.05), with a smaller but still significantly elevated odds of actual suicidal behavior (attempts and completed suicides, an odds ratio of 1.26). A separate large study found depression risk elevated in psoriasis alone (a 43% higher relative risk) and higher still specifically in people who'd also developed psoriatic arthritis (a 55% higher relative risk), a direct link back to this category's PsA-progression research. Research identifies younger age and more severe skin disease as particular risk factors for suicidality specifically. Existing meta-analyses on this exact question don't all agree, with some finding smaller or less consistent effects depending on study design, a caveat rather than an overstated crisis claim. This elevated mental-health burden is a legitimate reason mental health deserves the same direct, routine attention as skin severity itself in psoriasis care, not an afterthought to physical symptom control.",
    citations: [
      { source: 'Psoriasis and suicidality: A systematic review and meta-analysis, PMID 28807109', url: 'https://pubmed.ncbi.nlm.nih.gov/28807109/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-systemic-comorbidities', 'psoriasis-psa-progression-real-data'],
  },
  {
    id: 'psoriasis-guttate-pediatric-strep',
    category: 'psoriasis',
    title: 'A Distinct Form of Psoriasis Shows Up in Children, Usually Right After Strep Throat',
    teaser: 'Guttate psoriasis, a distinct pattern of small, drop-shaped spots, is the second most common form of psoriasis in children and follows a streptococcal infection in up to 80% of cases.',
    summary:
      "Psoriasis in children often looks and behaves differently than the more familiar adult plaque form, and the clearest example is guttate psoriasis, a distinct variant defined by an acute eruption of many small papules and plaques, typically under a centimeter across, scattered mostly on the trunk and limbs. It is the second most common form of psoriasis in children, after chronic plaque psoriasis, and is often a person's very first presentation of psoriasis at all, sometimes before any other psoriasis diagnosis exists. The specific trigger connects directly to a common childhood infection: guttate psoriasis classically develops 1 to 2 weeks after a streptococcal infection, most often strep throat (tonsillopharyngitis), and up to 80% of people with guttate psoriasis have a documented streptococcal infection shortly before the outbreak. The honest range of outcomes matters here too: guttate psoriasis can resolve on its own or with treatment, but it can also become persistent and progress into the more familiar chronic plaque form. A sudden, widespread outbreak of small, drop-shaped skin spots in a child following a sore throat is a recognizable pattern worth mentioning to a doctor by name, since recognizing guttate psoriasis specifically (rather than assuming a generic rash) can point toward both the right treatment and the right explanation for what triggered it.",
    citations: [
      { source: 'Guttate Psoriasis, StatPearls, NCBI Bookshelf, NBK482498', url: 'https://www.ncbi.nlm.nih.gov/books/NBK482498/' },
      { source: 'Roles of Infection in Psoriasis, PMC9266590', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9266590/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-pasi-severity-staging', 'psoriasis-koebner-phenomenon'],
  },
  {
    id: 'psoriasis-global-latitude-gradient',
    category: 'psoriasis',
    title: 'Psoriasis Is a Northern-Latitude Disease, More Than 10 Times More Common in Norway Than East Asia',
    teaser: "Norway's psoriasis prevalence, 3.8-4.6% of the population, sits at the very top of a documented worldwide gradient; East Asia's prevalence sits at roughly 0.14%, near the very bottom.",
    summary: "Psoriasis shows one of the starkest geographic gradients of any condition. Norway carries a national prevalence of 3.8 to 4.6%, with northern Norway specifically rising from 4.8% in 1979-1980 to 11.4% by 2007-2008, and Denmark sits close behind at 2.2 to 2.8%. Global burden data confirms this isn't a Norwegian quirk: Western Europe carries the highest age-standardized prevalence rate worldwide (1,155.9 cases per 100,000), while Eastern Sub-Saharan Africa carries the lowest (150.2 per 100,000), and East Asia's prevalence, 0.14%, sits at a small fraction of Australasia's 1.99%. Two distinct factors are named directly in the research: higher latitude itself (less year-round UV exposure) and Caucasian ancestry specifically both independently track with higher rates. For anyone outside North America or Western Europe, a lower reported psoriasis rate in one's home region is a documented pattern, not a sign the condition is being missed or under-diagnosed there, even as the SAME environmental and genetic factors behind it (sun exposure, skin-immune biology) remain worth understanding regardless of where someone lives.",
    citations: [
      { source: 'Psoriasis in Norway: A Prescription-based Registry Study of Incidence and Prevalence, Acta Dermato-Venereologica, PMC10128149', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10128149/' },
      { source: 'National, regional, and worldwide epidemiology of psoriasis: systematic analysis and modelling study, British Journal of Dermatology, PMID 32467098', url: 'https://pubmed.ncbi.nlm.nih.gov/32467098/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-overview'],
  },
  {
    id: 'psoriasis-global-greenland-low-prevalence',
    category: 'psoriasis',
    title: 'Greenland Sits at the Opposite Extreme From Norway, One of the Lowest Psoriasis Rates Documented',
    teaser: "A national-registry study in Nuuk, Greenland found psoriasis in just 1.1% of adults, a striking contrast against Norway's 3.8-4.6% just a few hundred miles away.",
    summary:
      "This category's already-covered latitude gradient (psoriasis rising with distance from the equator) makes Greenland's documented prevalence a useful contrast rather than a simple confirmation of that pattern. A national-registry cross-sectional study in Nuuk, Greenland's capital, found only 1.1% of the adult population carrying a diagnosed psoriasis, notably lower than Norway's 3.8 to 4.6% despite both regions sitting at high, similar latitudes. The honest complication the study's authors raise directly: they suspect this figure is an UNDERESTIMATE, driven by limited awareness of chronic skin disease and healthcare-access gaps in Greenland specifically, not necessarily true biological rarity, and they call directly for more awareness of chronic skin conditions there. A related finding: psoriasis patients in this same Nuuk cohort had notably higher rates of diabetes, hypertension, and lung disease (28.6%) than people without psoriasis (20.9%), the same cardiometabolic comorbidity pattern already covered elsewhere in this category. Greenland's low reported rate is a useful reminder that latitude alone doesn't fully explain psoriasis prevalence: Indigenous genetic background and healthcare-access/awareness gaps can both push a reported rate in either direction.",
    chart: {
      title: 'Psoriasis prevalence: Greenland vs. Norway',
      unit: '%',
      data: [
        { label: 'Nuuk, Greenland', value: 1.1 },
        { label: 'Norway (national)', value: 4.2 },
      ],
      sourceNote: "Low prevalence of patients diagnosed with psoriasis in Nuuk, PMC9045770; Psoriasis in Norway registry study, PMC10128149",
    },
    citations: [
      { source: 'Low prevalence of patients diagnosed with psoriasis in Nuuk: a call for increased awareness of chronic skin disease in Greenland, PMC9045770', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9045770/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-global-latitude-gradient', 'psoriasis-systemic-comorbidities'],
  },
  {
    id: 'horizon-psoriasis',
    category: 'psoriasis',
    title: "Psoriasis Just Got Its First Oral Drug That Targets Inflammation Precisely, Not Broadly",
    teaser: 'Deucravacitinib, a new drug class approved in 2022 and expanded to psoriatic arthritis in 2026, selectively blocks one specific inflammatory signaling enzyme rather than the broader immune suppression older oral drugs required.',
    summary:
      "This category's already-covered IL-23 inhibitor research (guselkumab and similar biologics) requires an injection; the current frontier is bringing that same precision into a pill. Deucravacitinib, first FDA-approved in 2022 for moderate-to-severe plaque psoriasis and expanded in 2026 to psoriatic arthritis, is a new drug class: a selective TYK2 inhibitor. Unlike older JAK inhibitors that broadly dampen multiple immune signaling pathways at once (carrying this category's already-covered ORAL Surveillance safety concerns), TYK2 inhibition targets specifically the signaling behind IL-23, IL-12, and type I interferons, the same inflammatory drivers already covered in this category's IL-23 research, while leaving other immune pathways largely untouched. The practical advantage: an oral pill without the injection burden or the extensive lab monitoring biologics require. Where the field is heading, this represents a shift in psoriasis drug design toward more precisely targeted oral small molecules rather than either broad immunosuppression or injectable biologics, and similar next-generation TYK2 and JAK-selective compounds are already moving through later-stage trials behind it.",
    citations: [
      { source: 'Deucravacitinib: The First FDA-Approved Oral TYK2 Inhibitor for Moderate to Severe Plaque Psoriasis', url: 'https://pubmed.ncbi.nlm.nih.gov/37341177/' },
      { source: 'FDA Approves Deucravacitinib as First TYK2 Inhibitor for Psoriatic Arthritis', url: 'https://www.dermatologytimes.com/view/fda-approves-deucravacitinib-as-first-tyk2-inhibitor-for-psoriatic-arthritis' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-il23-inhibitors-efficacy'],
  },
  {
    id: 'horizon-psoriasis-il36',
    category: 'psoriasis',
    title: "A First-of-Its-Kind Drug Now Exists for Psoriasis's Own Rarest, Most Dangerous Form",
    teaser: 'Spesolimab, blocking a distinct inflammatory signal (IL-36), became the first-ever approved treatment specifically for generalized pustular psoriasis flares, clearing pustules in a 86% of trial patients within one week.',
    summary:
      "This category's already-covered IL-23 and TYK2 research targets the mechanism behind ordinary plaque psoriasis; generalized pustular psoriasis (GPP), a rare, and dangerous flare pattern involving widespread pus-filled skin lesions, runs through a different inflammatory signal, IL-36, and had no dedicated approved treatment at all until recently. Spesolimab, a first-in-class antibody blocking the IL-36 receptor directly, changed that: its pivotal trial found a single dose clearing visible pustules entirely in a 85.7% of patients within one week, with 73.2% reaching completely clear skin, a dramatic result for a flare pattern that can otherwise require hospitalization. It received FDA approval in September 2022 specifically for GPP flares, since expanded to more countries worldwide. Trial data also found spesolimab associated with a higher rate of infections and systemic drug reactions than placebo, a tradeoff against the dramatic efficacy, and the drug is specifically indicated for treating an active flare, not for everyday plaque psoriasis already covered by this category's more established treatment research.",
    citations: [
      { source: 'Trial of Spesolimab for Generalized Pustular Psoriasis, New England Journal of Medicine', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2111563' },
    ],
    overallTier: 'strong',
    relatedIds: ['horizon-psoriasis'],
  },
  {
    id: 'psoriasis-nail-involvement',
    category: 'psoriasis',
    title: "Nail Psoriasis Isn't a Cosmetic Footnote, It's a Marker of More Severe Disease",
    teaser: 'Nail involvement shows up in up to 80% of psoriasis patients over a lifetime, and data links it directly to earlier disease onset and a higher risk of psoriatic arthritis.',
    summary: "Pitting, ridging, discoloration, and separation of the nail from the nail bed (onycholysis) can look like a minor, separate nuisance, but research treats nail psoriasis as a disease marker, not a footnote. Nail involvement appears in up to 80% of people with psoriasis at some point, and can be the ONLY visible sign in about 6% of cases. In one cohort of 200 Korean psoriasis patients, 85.5% had nail involvement, with pitting (the nail matrix's signature change) and onycholysis (the nail bed's signature change) the two most common findings. What makes this: data from the Psostudy found nail psoriasis correlates with more severe overall disease, earlier onset, and a higher risk of psoriatic arthritis specifically. The already-covered PsA self-advocacy research already recommends watching for joint symptoms; nail changes are a visible, easy-to-notice early flag worth mentioning at the same appointment.",
    citations: [
      { source: 'Nail Psoriasis: Clinical Features and Severity Assessment, Annals of Dermatology', url: 'https://anndermatol.org/DOIx.php?id=10.5021%2Fad.24.026' },
      { source: 'Nail psoriasis as a severity indicator: results from the Psostudy, PMC3417918', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3417918/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-advocacy-psa-screening', 'psoriasis-psa-progression-real-data'],
  },
  {
    id: 'psoriasis-psa-methotrexate-real-world',
    category: 'psoriasis',
    title: 'Methotrexate for Joint Symptoms Has an Honest Split Between Trial Results and Real-World Use',
    teaser: "Two randomized trials never found methotrexate beating placebo for psoriatic arthritis outright, yet real-world data shows it measurably improving joint swelling, dactylitis, and function, a worth-knowing gap between the two kinds of evidence.",
    summary:
      "Methotrexate is this category's already-covered first-line skin treatment, and it's also commonly prescribed once psoriasis reaches the joints (psoriatic arthritis, PsA), but the evidence behind that second use is more mixed than most patients are told. Two randomized trials never found methotrexate outperforming placebo for PsA on its primary endpoints. Yet clinical and strategy trials, dosed at 15mg/week or higher with active dose escalation, DID find significant improvement across disease activity, dactylitis (a whole swollen \"sausage\" finger or toe, a distinctive PsA sign), enthesitis (tendon-attachment inflammation), and functional status. Real-world biologic-treatment data adds a further, useful data point: dactylitis dropped from 23.6% to 3.5% of patients, and enthesitis from 33.3% to 9.0%, after 6 months of biologic treatment specifically. Research has directly questioned whether methotrexate should keep its current status as the default first PsA treatment in international guidelines, given how much better tolerated biologics are in large patient cohorts, an ongoing debate, not a settled question either way.",
    citations: [
      { source: 'Methotrexate achieves major cDAPSA response, and improvement in dactylitis and functional status in psoriatic arthritis, PubMed 30590763', url: 'https://pubmed.ncbi.nlm.nih.gov/30590763/' },
      { source: 'How well are biologic and conventional DMARDs tolerated in psoriatic arthritis: A world study, PMC10176215', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10176215/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['psoriasis-advocacy-psa-screening', 'psoriasis-psa-progression-real-data'],
  },
  {
    id: 'psoriasis-bariatric-surgery',
    category: 'psoriasis',
    title: 'Bariatric Surgery Shows Substantial Psoriasis Improvement Beyond Weight Loss Alone',
    teaser: "A systematic review of 447 patients found 69.5% showed improvement or remission of psoriasis after bariatric surgery, with gastric bypass specifically outperforming other surgery types.",
    summary:
      "This category's already-covered weight-loss research shows dose-dependent benefit from ordinary weight loss; bariatric surgery data adds a more dramatic, if far more invasive, version of the same pattern. A systematic review pooling 447 patients across 6 studies found 69.5% showed improvement or full remission of psoriasis after metabolic bariatric surgery. Specific numbers vary by surgery type: 80% improvement or remission after gastric bypass, versus only 10% after non-bypass procedures, with research pointing to an additional mechanism beyond weight loss itself, gastric bypass measurably increases secretion of GLP-1, a gut-derived hormone with its anti-inflammatory signaling separate from body weight. One smaller study found 70% of patients still in remission six months later, with three of four previously medicated patients able to stop systemic psoriasis drugs entirely. This is substantial evidence for an invasive intervention most people would only consider for obesity itself, not for psoriasis alone, but for someone already considering bariatric surgery for other health reasons, an additional psoriasis benefit is honestly worth knowing about in advance.",
    citations: [
      { source: 'Psoriasis outcomes following metabolic bariatric surgery: a systematic review of the literature, PMC12888285', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12888285/' },
      { source: 'Update on Obesity in Psoriasis Patients, PMC10608303', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10608303/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['psoriasis-weight-loss', 'psoriasis-systemic-comorbidities'],
  },
  {
    id: 'psoriasis-biologic-drug-survival-real-data',
    category: 'psoriasis',
    title: "Not All Psoriasis Biologics Are Kept Up With Equally, Multi-Year 'Drug Survival' Data Shows a Gap",
    teaser: 'Real-world data tracking how long patients actually stay on a given biologic, not just whether it works in a trial, finds substantial differences between drugs, with some outlasting others by years.',
    summary:
      "This category's already-covered biologic research (guselkumab's VOYAGE 1 trial data) shows strong initial results, and a separate, useful metric, drug survival (how long patients actually keep taking a given biologic before switching or stopping), reveals something a short trial alone can't: durability over years of actual use. A meta-analysis of real-world evidence found substantial variation by year 4: etanercept's survival dropped from 66 percent at year one to 41 percent by year four, infliximab from 61 to 42 percent, adalimumab from 69 to 47 percent, while ustekinumab held up markedly better, from 82 to 56 percent. A separate pooled analysis found 5-year survival rates of 46.3 percent for adalimumab, 35.9 percent for etanercept, and 34.7 percent for infliximab, broadly confirming the same pattern. More recent data adds a useful nuance: among biologic-naive patients, ustekinumab showed superior long-term persistence, but newer drugs (bimekizumab, guselkumab, risankizumab) showed higher 2-year survival specifically in patients who had already tried and moved on from an earlier biologic, evidence that the right drug can depend on treatment history, not just which one performed best in an initial trial. The most common reason for stopping etanercept and infliximab was loss of efficacy over time, and infliximab specifically was most often stopped for adverse effects, a practical detail when choosing among this category's already-covered biologic options.",
    citations: [
      { source: 'Drug survival of biologics in treating psoriasis: a meta-analysis of real-world evidence, Scientific Reports', url: 'https://www.nature.com/articles/s41598-018-34293-y' },
      { source: 'Biologic Drug Survival in Psoriasis: A Systematic Review & Comparative Meta-Analysis, PMC8012481', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8012481/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-il23-inhibitors-efficacy', 'psoriasis-systemic-comorbidities'],
  },
  {
    id: 'psoriasis-alcohol-treatment-response-real-data',
    category: 'psoriasis',
    title: "Alcohol Misuse Doesn't Just Worsen Psoriasis, Data Finds It Blunts How Well Treatment Works",
    teaser: 'A prospective multicenter cohort study found a higher alcohol-misuse screening score directly, significantly predicting a poorer response to systemic psoriasis therapy.',
    summary:
      "This category's already-covered comorbidity research names systemic effects of psoriasis beyond the skin, and research finds alcohol carries a two-way relevance: it worsens disease severity, and it independently predicts worse treatment outcomes. A prospective multicenter cohort study found that a higher score on the CAGE alcohol-screening questionnaire was significantly associated with a poorer response to systemic psoriasis therapies, direct evidence connecting drinking to actual treatment failure, not just symptom severity on its own. A earlier prospective study found a similar, sex-specific pattern: ethanol intake above 80 grams per day before starting treatment was associated with less treatment-induced improvement specifically in men. Research proposes a biologically plausible mechanism, not just a correlation: alcohol affects several of the same neurotransmitter systems (serotonin, dopamine, tachykinin) already implicated in the inflammatory processes driving psoriasis itself. A direct clinical recommendation follows from this: dermatology guidance now names alcohol screening as a worthwhile step (know, screen, intervene) specifically because it can meaningfully change how well an expensive biologic or systemic treatment (already covered elsewhere in this category) actually performs. This is actionable information, alcohol use is a modifiable factor worth discussing honestly with a dermatologist, not a moral judgment, specifically because it can directly affect whether an otherwise-effective treatment actually works.",
    citations: [
      { source: 'Alcohol misuse is associated with poor response to systemic therapies for psoriasis: findings from a prospective multicentre cohort study, PMID 34128222', url: 'https://pubmed.ncbi.nlm.nih.gov/34128222/' },
      { source: 'Alcohol and Psoriasis for the Dermatologist: Know, Screen, Intervene, PMID 35997945', url: 'https://pubmed.ncbi.nlm.nih.gov/35997945/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-biologic-drug-survival-real-data', 'psoriasis-systemic-comorbidities'],
  },
  {
    id: 'psoriasis-intermittent-fasting-real-trial',
    category: 'psoriasis',
    title: "This Category's Own Best-Evidenced Lever (Weight Loss) Now Has a Specific Delivery Method Directly Tested",
    teaser: "This category's already-covered weight-loss entry names it as the strongest single lever in psoriasis research, a dedicated Phase IIb trial tested 16:8 intermittent fasting specifically and found significant PASI improvement by 28 weeks.",
    summary:
      "This category's already-covered weight-loss entry already names it the single best-evidenced lever in psoriasis management, and more recent trials have now tested a specific, structured way to achieve it directly rather than leaving 'lose weight' as an open-ended instruction. A Phase IIb clinical trial tested 16:8 time-restricted intermittent fasting specifically for chronic plaque psoriasis, and found a statistically significant reduction in PASI score (the same severity measure already covered elsewhere in this category) by 28 weeks, alongside measured improvements in quality of life (DLQI) and inflammatory markers (VEGF, hs-CRP), evidence the benefit reaches beyond skin appearance alone into the same systemic inflammation this category's comorbidity research already covers. A separate trial testing 5:2 modified intermittent fasting (500 calories on two non-consecutive days weekly) found a significant reduction specifically in scaling and skin thickness among patients with mild psoriasis. A additional study of 108 patients found fasting during Ramadan specifically producing a significant PASI reduction too, a different real-world fasting pattern reaching a similar result. This is useful, structured guidance beyond the general weight-loss recommendation already covered elsewhere in this category, a specific, testable protocol (16:8 time-restricted eating) worth discussing directly with a doctor as an evidence-backed complement to medical treatment, not a replacement for it.",
    citations: [
      { source: 'Efficacy of Intermittent Fasting in the Management of Chronic Plaque Psoriasis: A Phase IIb Clinical Trial, PMID 40395583', url: 'https://pubmed.ncbi.nlm.nih.gov/40395583/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-weight-loss', 'psoriasis-systemic-comorbidities'],
  },
  {
    id: 'psoriasis-pediatric-real-prevalence-treatment',
    category: 'psoriasis',
    title: "Psoriasis Often Starts in Childhood, and a Distinct Treatment Path Exists for the More Severe Cases",
    teaser: "This category's already-covered guttate/pediatric-strep entry names one childhood trigger, direct prevalence data finds roughly a third of ALL psoriasis cases beginning in childhood generally, with a growing set of biologic options specifically approved for this age group.",
    summary:
      "This category's already-covered guttate psoriasis entry names one specific pediatric trigger (a preceding strep infection), and broader prevalence data finds childhood-onset psoriasis common well beyond that one subtype: research finds roughly a third of all psoriasis cases beginning during childhood, with prevalence climbing steadily and linearly with age, from a 0.55 percent in UK children ages 0-9 up to 1.37 percent by ages 10-19, and a similar pattern (0.12 percent at age 1 rising to 1.2 percent by age 18) found in German data too, with girls affected somewhat more often than boys. Research finds a meaningful minority, 10 to 20 percent of pediatric psoriasis cases, reaching moderate-to-severe severity requiring systemic treatment, not just topical management. The useful, practical finding: direct pediatric trials now support a growing set of biologic treatments specifically approved for children and adolescents, with etanercept the most studied to date, and adalimumab and ustekinumab also approved options, research finding high efficacy with a favorable safety profile in this specific age group, not simply adult treatments used off-label with unknown pediatric risk. This substantial childhood-onset share, and the now-available pediatric-specific biologic options, mean a child's own psoriasis diagnosis deserves the same serious treatment consideration this category's adult research already covers, not automatically deferred as something to simply outgrow.",
    citations: [
      { source: 'Pediatric psoriasis: Understanding pathological conditions and advances in treatment, PMC11483894', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11483894/' },
      { source: 'Biologics for pediatric psoriasis: A systematic review and meta-analysis, PMID 34888919', url: 'https://pubmed.ncbi.nlm.nih.gov/34888919/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-guttate-pediatric-strep', 'psoriasis-biologic-drug-survival-real-data'],
  },
  {
    id: 'psoriasis-caspar-diagnostic-criteria',
    category: 'psoriasis',
    title: "A Highly Accurate Formal Test Exists for Diagnosing Psoriatic Arthritis, CASPAR",
    teaser: "This category's already-covered PASI staging measures skin severity, not joint disease, CASPAR is the separate, formally validated criteria for diagnosing psoriatic arthritis itself, with strong accuracy.",
    summary:
      "This category's already-covered PASI severity staging measures skin disease specifically, and psoriatic arthritis, the joint-involving complication already covered elsewhere in this category, has its separate, formal diagnostic tool: the ClASsification for Psoriatic ARthritis (CASPAR) criteria. Large, multinational prospective validation found CASPAR carrying a sensitivity of 91.4 percent and specificity of 98.7 percent, strong diagnostic accuracy by any clinical standard. Follow-up studies confirm this holds up well even in early disease specifically, the hardest diagnostic window, with one study finding 87.4 percent sensitivity for early psoriatic arthritis, meaningfully outperforming the older Moll and Wright criteria it replaced (80.2 percent). CASPAR works by scoring a combination of features, including current or past psoriasis, nail changes, a negative rheumatoid factor test, dactylitis (characteristic 'sausage digit' swelling), and evidence of new bone formation near a joint on imaging, rather than relying on any single test alone. Since this category's already-covered psoriatic arthritis progression research names a narrow 12-month early-detection window that changes long-term joint outcomes, knowing this accurate, named diagnostic tool exists is worth asking about directly the moment joint symptoms appear alongside psoriasis, rather than waiting for a vaguer clinical impression to form.",
    citations: [
      { source: "Classification Criteria for Psoriatic Arthritis: development of new criteria from a large international study, PMID 16646037", url: 'https://www.jrheum.org/content/39/1/154' },
      { source: 'Sensitivity and specificity of the classification of psoriatic arthritis criteria in early psoriatic arthritis, PMID 22576997', url: 'https://pubmed.ncbi.nlm.nih.gov/22576997/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-psa-progression-real-data', 'psoriasis-advocacy-psa-screening'],
  },
  {
    id: 'psoriasis-phototherapy-real-clearance-remission',
    category: 'psoriasis',
    title: 'Narrowband UVB Phototherapy Clears Psoriasis in Most Patients, and Data Shows How Long It Lasts',
    teaser: 'Pooled data finds narrowband UVB achieving PASI75 in roughly 70-81% of patients, with evidence that a deeper clearance (PASI90) predicts a longer remission than a partial one.',
    summary:
      "This category's already-covered treatment research spans diet, biologics, and systemic drugs, and phototherapy, controlled medical exposure to narrowband ultraviolet B (UVB) light, is a distinct, effective option worth its own direct coverage. Pooled data across studies finds narrowband UVB achieving a 75 percent reduction in psoriasis severity (PASI75) in roughly 70 to 81 percent of treated patients, with a meaningful 41 percent reaching a deeper PASI90 clearance. The useful finding for anyone weighing this option: how completely the skin clears directly predicts how long the improvement lasts. Research found a median time to relapse of 6 months for patients who reached PASI90, compared with just 4 months for those who cleared less completely, direct evidence that pushing for a fuller course of treatment pays off in longer remission, not just a better-looking finish. A separate, counterintuitive finding: achieving full PASI100 clearance did not extend remission any further than PASI90, suggesting a practical point of diminishing returns. Identified predictors of a shorter remission include age 60 or older, having used a systemic medication within the past 6 months, and needing three or more phototherapy cycles. Phototherapy is an effective, medication-free option, with concrete expectations about both how well it's likely to work and roughly how long the benefit should last.",
    citations: [
      { source: 'The use of psoriasis biomarkers, including trajectory of clinical response, to predict clearance and remission duration to UVB phototherapy, PMID 34255884', url: 'https://pubmed.ncbi.nlm.nih.gov/34255884/' },
      { source: 'Remission period in psoriasis after multiple cycles of narrowband ultraviolet B phototherapy, PMID 24942986', url: 'https://pubmed.ncbi.nlm.nih.gov/24942986/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-pasi-severity-staging', 'psoriasis-biologic-drug-survival-real-data'],
  },
  {
    id: 'psoriasis-ibd-shared-il23-comorbidity',
    category: 'psoriasis',
    title: 'Psoriasis and Inflammatory Bowel Disease Share the Same Immune Pathway',
    teaser: "This category's already-covered IL-23 inhibitor research reveals why it works for two seemingly unrelated diseases at once: shared genetic risk loci and a common IL-23/Th17 pathway link psoriasis directly to inflammatory bowel disease.",
    summary:
      "This category's already-covered IL-23 inhibitor research names strong efficacy for psoriasis specifically, and research finds the underlying reason connects directly to a completely different condition already built out elsewhere in this Digest: inflammatory bowel disease. Genome-wide association studies have identified shared genetic susceptibility loci between psoriasis and IBD, including specific genes (IL23R, IL12B, TNFSF15, STAT3) implicated in both diseases independently. The unifying mechanism is the IL-23/Th17 immune pathway, the same pathway already covered elsewhere in this category, driving keratinocyte overgrowth (the root cause of psoriasis's visible skin plaques) in the skin and direct tissue damage in the gut wall in IBD, two very different-looking diseases sharing one common immune root. This isn't just theoretical: meta-analyses and everyday clinical practice find drugs targeting the IL-17/IL-23 pathway achieving superior skin clearance for psoriasis compared to older TNF-alpha-targeting drugs, practical confirmation that this specific pathway is a central driver, not one of several equally important ones. This shared biology is a reason someone with psoriasis experiencing new digestive symptoms, or someone with IBD noticing new skin plaques, is worth mentioning both conditions together to a doctor rather than treating them as two unrelated, coincidental diagnoses.",
    citations: [
      { source: 'Shared Pathophysiology of Inflammatory Bowel Disease and Psoriasis: Unraveling the Connection, PMC11449469', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11449469/' },
      { source: 'Interleukin-17 and Interleukin-23: A Narrative Review of Mechanisms of Action in Psoriasis and Associated Comorbidities, PMC8019008', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8019008/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-il23-inhibitors-efficacy', 'ibd-overview'],
  },
  {
    id: 'psoriasis-certolizumab-pregnancy-safety',
    category: 'psoriasis',
    title: "One Biologic Doesn't Cross the Placenta, Making It the Preferred Choice During Pregnancy",
    teaser: "This category's already-covered pregnancy-family-planning research gets a specific medication answer: certolizumab pegol was found essentially absent from umbilical cord blood in 13 of 14 tested newborns.",
    summary:
      "This category's already-covered pregnancy and family-planning research names practical challenges managing psoriasis through pregnancy, and pharmacokinetic research identifies one biologic medication with a distinct safety profile: certolizumab pegol. Unlike other biologics already covered elsewhere in this category, certolizumab pegol lacks the Fc portion of a normal antibody, the specific structural piece that actively transports other biologics across the placenta. Dedicated pharmacokinetic studies (the CRIB and CRADLE trials) directly measured this: certolizumab pegol was undetectable in the umbilical cord blood of 13 of 14 tested newborns, and present only in a trace amount in the 14th, direct evidence of minimal to no placental transfer throughout pregnancy. A large pharmacovigilance safety-database analysis backed this up further, finding no increased teratogenic risk and no increased fetal death risk compared to the general population, with miscarriage rates (8.9 to 15.3 percent) and birth-defect rates (3 to 4 percent) for this drug class overall comparable to the general population baseline. Clinical guidance now names certolizumab pegol as the preferred biologic specifically for psoriasis patients who are pregnant or planning pregnancy, usable safely through all three trimesters, a concrete, answer to a decision this category's broader pregnancy research names as a common source of anxiety.",
    citations: [
      { source: 'Certolizumab pegol for plaque psoriasis in women of childbearing potential, pregnant or breastfeeding in clinical settings: One-year outcomes from the international noninterventional CIMREAL study, PMC12105429', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12105429/' },
      { source: 'The use of biological drugs in psoriasis patients prior to pregnancy, during pregnancy and lactation: a review of current clinical guidelines, PMID 33603597', url: 'https://pubmed.ncbi.nlm.nih.gov/33603597/' },
    ],
    overallTier: 'strong',
    relatedIds: ['psoriasis-pregnancy-family-planning', 'psoriasis-advocacy-systemic-med-monitoring'],
  },
  {
    id: 'psoriasis-steroid-rebound-honest-evidence-gap',
    category: 'psoriasis',
    title: "'Topical Steroid Withdrawal' Is Widely Discussed Online, and Research Finds the Evidence Behind It Thin",
    teaser: "A systematic review and meta-analysis found the commonly repeated claim about steroid rebound flares in psoriasis lacking the supporting evidence its popularity implies.",
    summary:
      "Stopping corticosteroids abruptly, whether topical creams or systemic pills, is widely discussed online as a trigger for a severe rebound flare worse than the original psoriasis, and research finds this a complicated, only partly-settled question, not something to repeat uncritically. Clinical distinction exists between two related but different phenomena: tachyphylaxis (a topical steroid losing effectiveness with continued, extended use) and topical steroid withdrawal (a cutaneous reaction appearing specifically after stopping), with several proposed mechanisms for the latter, including dysregulated cortisol production and rebound inflammatory cytokine release from a disrupted skin barrier, none of them yet definitively confirmed. The most important, directly relevant finding: a systematic review and meta-analysis specifically examining rebound psoriasis flares following systemic corticosteroid exposure and withdrawal found the evidence supporting this widely-repeated belief lacking, and called directly for higher-quality studies before the claim can be treated as settled fact. Despite extensive patient discussion and shared experience online, rigorous scientific literature on this specific topic remains scarce, and the honest, current answer is that it's a plausible phenomenon that hasn't yet been adequately studied, not a myth and not a proven mechanism either, worth discussing any steroid tapering plan directly with a dermatologist rather than either dismissing the concern or treating it as settled science.",
    citations: [
      { source: 'Psoriasis flares and rebound phenomenon following exposure and withdrawal of systemic steroids: A systematic review and meta-analysis, Journal of the American Academy of Dermatology', url: 'https://www.jaad.org/article/S0190-9622(22)00036-6/fulltext' },
      { source: 'Breaking the cycle: a comprehensive exploration of topical steroid addiction and withdrawal, PMC11994697', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11994697/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['psoriasis-advocacy-systemic-med-monitoring', 'psoriasis-alcohol-treatment-response-real-data'],
  },
  {
    id: 'psoriasis-fermented-drinks',
    category: 'psoriasis',
    title: 'Fermented Drinks and Foods for Psoriasis',
    teaser: 'The turmeric-forward tonics in this app\'s fermentation collection fit psoriasis\'s anti-inflammatory, gut-skin-axis framing well, but several drinks in that same collection carry alcohol content, useful to check before reaching for one.',
    summary: 'This app\'s Fermented Turmeric Drink and the Wild-Fermented Fruit Tonic family (all in Recipes) lean on curcumin and anthocyanins, both with documented anti-inflammatory activity relevant to the same inflammatory pathways psoriasis flares run on, and gut microbiome diversity work more broadly is an active area of gut-skin-axis research. The more important thing to know plainly here is the opposite direction: several drinks in this same collection (Sake-Style Rice Wine, Makgeolli, Coconut Palm Wine-Style, Maple "Pulque-Style") are actually alcoholic once fully fermented, and this app\'s already-cited research found alcohol misuse doesn\'t just worsen psoriasis severity, it measurably blunts how well prescribed systemic treatment actually works. Stick to the wild-fermented tonics and short-ferment drinks (finished in a day or two, not weeks) if psoriasis is the reason you\'re here.',
    citations: [
      { source: 'Shoba et al. 1998, Planta Medica: piperine\'s effect on curcumin bioavailability', url: 'https://pubmed.ncbi.nlm.nih.gov/9619120/' },
    ],
    overallTier: 'moderate',
    relatedIds: [
      'psoriasis-alcohol-treatment-response-real-data',
      'recipe-ferment-turmeric-drink',
      'fermentmethod-wild-tonics',
      'lifestyle-alcohol-advisory',
    ],
  },
  // 2026-08-21, added after fact-checking NOVA's "The Truth About Fat"
  // (2020) documentary against the peer-reviewed literature, direct
  // request. The documentary itself is not treated as a citable source;
  // this traces to the primary studies, independently verified via
  // WebSearch.
  {
    id: 'psoriasis-adipokine-shift-mixed-evidence',
    category: 'psoriasis',
    title: "Psoriasis Shows a Documented Adipokine Shift, but the Details Are Genuinely Inconsistent Across Studies",
    teaser: 'Adiponectin drops as psoriasis severity rises fairly consistently across studies, but findings on leptin specifically conflict from one study to the next, an honest gap rather than a settled picture.',
    summary: "Psoriasis has a well-documented association with obesity and metabolic syndrome, already relevant given the visceral-fat and adiponectin research covered elsewhere in this app. The adipokine-specific evidence is honestly mixed rather than uniform: several studies found serum adiponectin decreasing and leptin decreasing as psoriasis severity (measured by the PASI score) increased, while other studies found no significant correlation between either hormone and PASI, and at least one more recent study found leptin positively correlated with PASI specifically in female patients. The practical read: the adiponectin-severity relationship is the more consistently replicated finding across studies, while the leptin-severity relationship specifically remains unsettled, an active area still being worked out rather than a confirmed clinical marker.",
    citations: [
      { source: 'Effect of psoriasis activity on serum adiponectin and leptin levels (PMID 26015779)', url: 'https://pubmed.ncbi.nlm.nih.gov/26015779/' },
    ],
    overallTier: 'weak',
    stageNote: 'Adiponectin-severity findings are more consistently replicated; leptin-severity findings conflict directly across studies, included here for that honest inconsistency.',
    relatedIds: ['leptin-autoimmune-inflammation', 'adiponectin-overview'],
  },
  {
    id: 'psoriasis-skin-circadian-clock',
    category: 'psoriasis',
    title: "Skin Has a Circadian Clock, and It Runs Differently in Psoriasis",
    teaser: 'Psoriasis flares and itch are typically worse in the evening and at night, a pattern that traces to measurable clock-gene changes inside psoriatic skin itself.',
    summary: "Skin carries a functioning peripheral circadian clock, and in psoriatic skin, several clock genes run at different levels than in unaffected skin: CRY2, PER3, NR1D1, and RORC are all measurably lower in psoriasis lesions, and even in the normal-looking skin right next to them, compared to skin from people without psoriasis. One specific clock gene, F3, is significantly reduced in psoriasis and interacts directly with the IL-17 signaling pathway, the same inflammatory pathway targeted by several major psoriasis biologic drugs, low F3 appears to upregulate IL-17 receptor signaling, promoting the keratinocyte inflammation that drives visible plaques. Clinically, this lines up with something people with psoriasis already notice: flares and itch tend to be worse in the evening and overnight, and disrupted peripheral clock function is plausibly connected to the hyperproliferation of skin cells and immune dysregulation that define the disease. Chronotherapy, timing topical or systemic treatment to this rhythm, is an active area of research, not yet a standard part of psoriasis care.",
    citations: [
      { source: 'Circadian rhythms in psoriasis and the potential of chronotherapy in psoriasis management', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9805195/' },
      { source: 'The skin circadian clock gene F3 as a potential marker for psoriasis severity and its bidirectional relationship with IL-17 signaling in keratinocytes', url: 'https://www.sciencedirect.com/science/article/pii/S1567576924005113' },
    ],
    overallTier: 'moderate',
    relatedIds: ['chrono-circadian-clock-biology'],
  },
];
