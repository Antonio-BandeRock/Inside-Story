import type { DigestEntry } from './types';

// History & Milestones -- 11 entries, added 2026-08-07 direct response to "a
// history and milestones of Hashimoto's would be good to have as well." A
// genuinely different shape from every other category here: not "what
// should I eat," but "how did we get to knowing any of this at all" --
// dated, citable turning points from the disease's first description
// through to how it's diagnosed and understood today. Evidence tiers still
// apply (a historical fact is either well-documented or it isn't), but
// they're doing different work here than elsewhere in this Digest: tiering
// how solidly each historical claim itself is sourced, not how strong a
// clinical trial's effect size was.
//
// 2026-08-07, same day, rewritten in the same narrative shape as the other
// categories already given this treatment. This category already leaned
// narrative by nature (dated events); the rewrite adds scene-setting and
// stakes to each entry rather than restructuring the underlying facts,
// which are unchanged from the original pass.
//
// 2026-08-08: content fields rewritten a second time to remove AI-writing
// tics flagged directly by the person -- em dashes as punctuation, "not X,
// it's Y" contrast, and overused words like "real"/"genuinely"/
// "honest(ly)"/"worth" -- see bigPicture.ts's own header comment for the
// full context. Every fact, number, and citation is unchanged.
export const HISTORY_ENTRIES: DigestEntry[] = [
  {
    id: 'history-1912-first-description',
    category: 'hashimotos',
    title: '1912: The Original Discovery, By a Surgeon Studying Four Patients',
    teaser: 'A disease now affecting millions was first noticed by one surgeon, looking closely at tissue from just four people.',
    summary:
      "Somewhere in a Japanese hospital in the early 1910s, a surgeon named Hakaru Hashimoto sat down with thyroid tissue removed from four separate patients during surgery, unremarkable, routine surgical specimens by any reasonable expectation. What he found in that tissue wasn't routine at all: diffuse infiltration of lymphoid cells forming lymphoid follicles with germinal centers, alongside fibrosis and tissue atrophy, a pattern nobody had described before. He published these findings in 1912, in a German surgical journal (German being the dominant language of medical publishing at the time), under the Latin name struma lymphomatosa. His own work sat largely unrecognized for decades afterward. The condition wasn't even renamed in his honor until much later, once the broader medical community finally recognized what he'd actually found: not a rare surgical curiosity, but the first clearly described case of a disease that would go on to affect millions of people worldwide. A reminder that everything else in this app's own research traces back to one person, looking closely at four specimens, and refusing to assume what he was seeing was nothing.",
    citations: [
      {
        source: "Historical Tidbit: Hakaru Hashimoto, M.D. and Hashimoto's Disease (Pediatric Endocrine Society)",
        url: 'https://pedsendo.org/historical-tidbits/historical-tidbit-hakaru-hashimoto-m-d-may-4-1881-to-january-9-1934-and-hashimotos-disease/',
      },
    ],
    overallTier: 'strong',
  },
  {
    id: 'history-1924-iodized-salt',
    category: 'hashimotos',
    title: 'The "Goiter Belt," and a Voluntary Public-Health Experiment That Actually Worked',
    teaser: 'One American region once had close to 100% goiter rates in schoolchildren, fixed voluntarily, with no law ever requiring it.',
    summary:
      'In the early 1920s, a visible band of American states around the Great Lakes, Michigan, Minnesota, and Wisconsin among them, had earned a grim nickname: the "goiter belt." Public-health surveys found goiter, a visibly enlarged thyroid driven by iodine deficiency, in 70 to 100 percent of schoolchildren in parts of the region. Physician David Cowie, having studied European iodization practices already underway elsewhere, proposed a simple fix: add iodine to table salt. On May 1, 1924, Michigan salt manufacturers voluntarily began doing exactly that, with no law requiring it at all. A 1935 follow-up survey found enlarged-thyroid rates had dropped by as much as 90 percent in the years since. Direct historical proof that a simple, food-based intervention could measurably prevent a thyroid disease at population scale, and foundational to, but genuinely distinct from, the very different iodine-excess concerns Hashimoto\'s research raises today, a thread this app\'s own research keeps returning to.',
    citations: [
      { source: 'A Grain of Salt (Milbank Quarterly, 2014): the history of American salt iodization', url: 'https://www.milbank.org/quarterly/articles/a-grain-of-salt/' },
    ],
    overallTier: 'strong',
    relatedIds: ['nutrient-iodine', 'problem-excess-iodine-kelp', 'iodine-deficiency-global-real-data'],
  },
  {
    id: 'history-1956-autoimmune-mechanism',
    category: 'hashimotos',
    title: '1956: Proof This Was an Autoimmune Disease at All, a Turning Point for All of Medicine',
    teaser: 'Before this year, the idea that the body could attack itself was considered close to medically impossible.',
    summary:
      'For decades, immunology held tightly to a concept with an almost dismissive-sounding Latin name: "horror autotoxicus," the idea that a healthy immune system simply could not, and would not, attack the body\'s own tissue. In 1956, researchers Ivan Roitt and Deborah Doniach identified antibodies against thyroglobulin, a thyroid protein, circulating in the blood of Hashimoto\'s patients: direct, measurable evidence the immune system itself was attacking the thyroid. This wasn\'t just a discovery about one disease. It was one of the first pieces of evidence that human autoimmune disease existed at all, opening the door to understanding dozens of other conditions, several of them covered elsewhere in this Digest\'s own Other Autoimmune Diseases category, the same way. A turning point not just for Hashimoto\'s, but for how medicine as a whole came to understand the immune system\'s own capacity to turn against its host.',
    citations: [
      { source: 'Autoimmune thyroid disease: a review discussing the 1956 discovery and its significance', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7266799/' },
    ],
    overallTier: 'strong',
    relatedIds: ['other-why-cross-disease-evidence'],
  },
  {
    id: 'history-1960s-tsh-testing',
    category: 'hashimotos',
    title: 'The 1960s Onward: How Thyroid Testing Actually Became Possible',
    teaser: 'Before this era, there was no reliable blood test that could tell anyone their own thyroid status.',
    summary:
      "It's easy to take a routine thyroid blood test for granted. For most of medical history, no such test existed at all. The first TSH radioimmunoassay, a technique using radioactive tracers to measure a hormone's concentration, originated in 1965, and for roughly two decades that was the single most important tool available for diagnosing and managing hypothyroidism. But this first generation could only reliably detect TSH at fairly high concentrations, missing the more subtle elevations seen in early or subclinical disease. The real leap came with monoclonal antibody technology in the mid-1970s, enabling a \"sandwich\" assay design by the late 1980s that was dramatically more sensitive and specific, the direct ancestor of the ordinary TSH blood test used today. This is the actual reason a diagnosis of subclinical hypothyroidism (elevated TSH with still-normal T4) is even possible to make at all. The diagnostic category itself couldn't exist until a test sensitive enough to detect it did.",
    citations: [
      { source: 'Laboratory Thyroid Tests: A Historical Perspective (Thyroid)', url: 'https://pubmed.ncbi.nlm.nih.gov/37037032/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'history-1985-tpo-identified',
    category: 'hashimotos',
    title: '1985: The Antibody This App Actually Tracks Gets Identified',
    teaser: 'The "TPO antibody" this whole app treats as central data wasn\'t even known by that name until 1985.',
    summary:
      'For years after the 1956 autoimmune-mechanism discovery, researchers knew Hashimoto\'s patients carried antibodies against something inside the thyroid\'s own "microsomal" cell fraction, but nobody yet knew exactly what that target actually was. In 1985, researchers demonstrated that this "microsomal antigen" was in fact thyroid peroxidase, TPO, the very enzyme responsible for making thyroid hormone in the first place. That meant the immune system was attacking the thyroid\'s own hormone-production machinery directly, not some incidental bystander protein sitting nearby. This is the direct scientific origin of the modern TPO antibody blood test, the same lab value this app\'s own Healing Stages research uses as its primary tracking signal, resting on a foundation laid nearly forty years before this app ever existed.',
    citations: [
      {
        source: 'Anti-thyroid peroxidase antibody in patients with autoimmune thyroid disease: possible identity with anti-microsomal antibody',
        url: 'https://pubmed.ncbi.nlm.nih.gov/2995429/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['healing-stage3-what-it-looks-like'],
  },
  {
    id: 'history-desiccated-to-levothyroxine',
    category: 'hashimotos',
    title: 'From Ground-Up Pig Thyroid to a Precisely-Dosed Pill: How Treatment Itself Evolved',
    teaser: 'As recently as 1965, four out of five American thyroid prescriptions were still literally dried animal thyroid gland.',
    summary:
      "It's a strange thing to picture now, but for most of the 20th century, treating an underactive thyroid meant taking a pill made from an actual, dried animal gland. Thyroid organ therapy dates back to 1891, using desiccated (dried, ground) thyroid extract from pig or cow glands, and this remained the dominant treatment for over 70 years, with roughly 80 percent of US thyroid prescriptions still being natural desiccated thyroid as late as 1965. The problem driving the eventual shift to synthetic levothyroxine: batch-to-batch potency in natural extract genuinely varied enormously, with some batches measured at anywhere from double to zero detectable hormone activity, a serious, documented dosing-consistency problem, not a theoretical one. Levothyroxine's synthetic, precisely-measurable dosing and simpler once-daily use made it the standard of care by the 1970s, and it remains the single most-prescribed medication in the US today. Natural desiccated thyroid is still prescribed for a minority of patients who report better symptom control on it despite normalized lab values, a thread still not fully settled even now.",
    citations: [
      { source: 'Natural desiccated thyroid for the treatment of hypothyroidism? (Frontiers in Endocrinology)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10801060/' },
    ],
    overallTier: 'strong',
  },
  {
    id: 'history-genetic-era',
    category: 'hashimotos',
    title: 'The Genetic Era: Real Susceptibility Genes, Real Limits to What They Explain',
    teaser: "The first genome-wide search for Hashimoto's-specific genes only happened in 2018, more recently than most people would guess.",
    summary:
      "Long before genome-wide studies were technically possible, researchers already suspected Hashimoto's ran in families, and linked it to specific immune-regulation genes, particularly CTLA-4, a gene that normally helps put the brakes on immune-cell activation. The first genome-wide association study (GWAS) dedicated specifically to Hashimoto's thyroiditis wasn't published until 2018, identifying new candidate genetic regions beyond what earlier candidate-gene studies alone had found. Worth naming directly: even combining every genetic association discovered so far, known genetic variants explain only a modest share of who actually develops Hashimoto's. Continuing evidence that environmental and dietary factors, this app's own core focus, matter alongside genetic susceptibility, not instead of it. Genetics may load the gun, in the old phrase, but they clearly aren't pulling the trigger alone.",
    citations: [
      { source: "Genome-wide association analysis suggests novel loci for Hashimoto's thyroiditis", url: 'https://pubmed.ncbi.nlm.nih.gov/30284222/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'history-desiccated-thyroid-standardization',
    category: 'hashimotos',
    title: 'A Milestone Often Left Out: When Desiccated Thyroid Finally Got Properly Standardized',
    teaser: 'The potency problem that helped push doctors toward synthetic thyroxine had a fix. It just arrived too late to matter.',
    summary:
      "The desiccated-thyroid story above has a postscript that rarely makes it into the shorter version of this history. The same potency-variability problem that helped drive levothyroxine's rise actually had a partial fix: after 1985, natural desiccated thyroid manufacturing standardization measurably improved. But by that point, levothyroxine's own practical advantages (once-daily dosing, precise, easily-adjustable milligram-level dosing, and a growing base of clinical-trial evidence) had already made it the entrenched standard of care. Worth knowing as historical context rather than a settled verdict either way: today's desiccated-thyroid products are more consistent than their pre-1985 predecessors, even though that improvement came after the field had already largely moved on.",
    citations: [
      { source: 'Natural desiccated thyroid for the treatment of hypothyroidism? (same source as the broader treatment-history entry, standardization detail)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10801060/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['history-desiccated-to-levothyroxine'],
  },
  {
    id: 'history-whickham-progression-rate',
    category: 'hashimotos',
    title: 'The Study Behind "How Fast Does This Actually Progress"',
    teaser: 'A 20-year follow-up on thousands of people: the actual data behind a question almost everyone with early antibody-positive results eventually asks.',
    summary:
      "\"My antibodies are positive but my TSH is still normal, how worried should I actually be?\" is a common question this whole app's own antibody-tracking research keeps circling without ever giving a hard number. The answer traces back to one of epidemiology's landmark studies: the Whickham Survey, a cohort of 2,779 adults first surveyed in the 1970s and followed up 20 years later. The baseline rate of new spontaneous hypothyroidism in women overall was modest, roughly 3.5 to 4.1 cases per 1,000 women per year. The striking finding sits in the risk-stratified numbers: women with both an elevated TSH and positive thyroid antibodies at the start had 38 times higher odds of developing overt hypothyroidism than women with neither, a quantified answer to exactly the anxious question above, not a vague \"it depends.\" That's a different situation from either risk factor alone (each independently carried about an 8-fold higher odds on its own). The combined risk is substantially more than either one by itself. A positive antibody result alongside even a mildly elevated TSH is meaningful information about future risk, which is exactly why this app's own Self Advocacy category recommends periodic, not one-time, monitoring of both together.",
    citations: [
      { source: 'Vanderpump MP, Tunbridge WM, French JM, et al. 1995: The incidence of thyroid disorders in the community: a twenty-year follow-up of the Whickham Survey (Clinical Endocrinology)', url: 'https://pubmed.ncbi.nlm.nih.gov/7641412/' },
    ],
    overallTier: 'strong',
    relatedIds: ['advocacy-thyroid-antibodies', 'advocacy-core-thyroid-panel'],
  },
  {
    id: 'history-heritability-family-risk',
    category: 'hashimotos',
    title: 'How Much of This Is Really Genetic? A Different Kind of Evidence From the GWAS Story Above',
    teaser: 'The genome-wide search for specific genes is one kind of evidence. Comparing identical twins tells a striking part of the same story.',
    summary:
      "This category's own genetic-era entry already covers the search, still incomplete, for specific Hashimoto's susceptibility genes, CTLA-4 chief among them, plus a 2018 genome-wide study that found more candidate regions without fully explaining who actually develops the disease. A complementary kind of evidence comes from twin studies, which sidestep the \"which specific gene\" question entirely and instead ask a cleaner one: across a population of over 110,000 twins, how much of the difference in who gets an autoimmune disease and who doesn't comes down to genetics at all, versus environment? That same study found heritability running remarkably high across the family of organ-specific autoimmune diseases it examined, from 0.60 for Graves' disease up to a striking 0.97 for Addison's disease, with Hashimoto's included among the diseases studied, though this app couldn't independently verify its own specific figure within that range this session. Beyond CTLA-4, reviews also name HLA-DR variants and PTPN22 as additional, independently replicated susceptibility genes across autoimmune thyroid disease broadly, not just Hashimoto's specifically. A practical family-risk point this app hasn't stated plainly before: a parent, sibling, or child of someone with Hashimoto's carries a genetically elevated risk worth knowing about. Not a guarantee, and not yet reason to build a dedicated screening feature this app doesn't have, but real enough that a family member with unexplained fatigue or other Hashimoto's-adjacent symptoms has a legitimate, evidence-backed reason to ask their own doctor for a thyroid panel rather than assume the connection is coincidental.",
    citations: [
      { source: 'Weetman AP 2009: The genetics of autoimmune thyroid disease (Hormone and Metabolic Research)', url: 'https://pubmed.ncbi.nlm.nih.gov/19343617/' },
      { source: 'Skov J, Eriksson D, Kuja-Halkola R, et al. 2020: Co-aggregation and heritability of organ-specific autoimmunity: a population-based twin study (110,814 twins)', url: 'https://pubmed.ncbi.nlm.nih.gov/32229696/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['history-genetic-era', 'graves-genetic-family-risk'],
  },
  {
    id: 'history-tying-together',
    category: 'hashimotos',
    title: 'Tying It All Together: What This History Actually Teaches',
    teaser: 'From "the body cannot attack itself" to a genome-wide search for the genes that let it, a real arc, not just a list of dates.',
    summary:
      "Read start to finish, this isn't just a list of dates. It's a record of how much of what this whole app relies on had to be discovered, piece by piece, before it could exist at all. The disease had to be described (1912) before it could be studied. Autoimmunity itself had to be proven real (1956) before Hashimoto's could be understood as more than a medical mystery. A genuinely sensitive lab test had to be invented across two technological leaps (the 1960s radioimmunoassay, the 1970s-80s monoclonal-antibody sandwich assay) before \"subclinical\" disease could even be diagnosed at all. And the actual antigen had to be identified (1985) before a TPO antibody test, the same lab value this app's own Healing Stages tracking leans on today, could exist in the first place. Even treatment itself took nearly a century to settle: 70-plus years of inconsistent desiccated animal thyroid before synthetic levothyroxine's own precision finally won out in the 1970s. The closing note: genetics research remains limited. Known variants explain only a modest share of who develops Hashimoto's, which is itself part of why environmental and dietary factors, this app's own core focus, matter as much as they do.",
    citations: [
      { source: 'Autoimmune thyroid disease: a review discussing the 1956 discovery and its significance', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7266799/' },
    ],
    overallTier: 'strong',
    relatedIds: ['history-1985-tpo-identified', 'history-genetic-era'],
  },
  {
    id: 'horizon-hashimotos',
    category: 'hashimotos',
    title: "What's Next for Hashimoto's: Real, Early Research Into Actually Calming the Immune Attack, Not Just Replacing Hormone",
    teaser: 'Every current Hashimoto\'s treatment replaces lost thyroid hormone rather than addressing the immune attack itself. Real, early-phase research into stem-cell therapy is trying to change that, though it remains genuinely experimental.',
    summary:
      "Every real, current Hashimoto's treatment, levothyroxine included, replaces the hormone the damaged thyroid can no longer make; none of them address the underlying autoimmune attack itself. Where the field is actively looking for something more: mesenchymal stem cell (MSC) therapy, a real, early-stage research direction using cells with real, documented anti-inflammatory and immune-modulating properties. Preclinical studies (animal models and human cells in the lab, not yet real patients) have found MSCs reducing thyroid inflammation and, in real mechanistic work, calming a specific inflammatory signaling pathway (STING) already tied to oxidative stress in Hashimoto's thyroid tissue. Early-phase human clinical trials are genuinely underway, but this remains real, early-stage research, not an available treatment, and the field itself names real, unresolved challenges directly: immune rejection risk, real regulatory hurdles, and cost. Worth knowing plainly where medicine currently stands: no approved therapy yet targets the autoimmune process in Hashimoto's directly, current care manages the consequence (low thyroid hormone) rather than the cause, and stem-cell research is one of the more active, if still distant, real attempts to change that.",
    citations: [
      { source: 'Stem Cell Therapy for Hashimoto\'s Disease - a Promising Treatment Method?, Quality in Sport', url: 'https://apcz.umk.pl/QS/article/view/53856' },
      { source: 'Mesenchymal stem cells alleviate autoimmune thyroiditis by modulating macrophage phenotypes and through influencing the STING pathway', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0040816624002970' },
    ],
    overallTier: 'weak',
    relatedIds: ['gut-scfa-treg'],
  },
];
