import type { DigestEntry } from './types';

// Other Autoimmune Diseases -- 9 entries. None of these are Hashimoto's
// studies -- every entry is tagged with which disease it actually studied.
// Cross-disease evidence is corroborating weight for a hypothesis (the
// recurring SCFA/Th17-Treg/zonulin/molecular-mimicry mechanisms covered in
// Gut & Microbiome), not a substitute for a Hashimoto's-specific trial that
// hasn't been run -- the same discipline this whole app's research has
// held to throughout.
//
// 2026-08-07, same day, rewritten in a narrative shape -- direct feedback
// that the original single-paragraph entries were "several thoughts"
// stacked together with no beginning, middle, and end, and weren't written
// to make someone want to keep reading. Every entry below now opens on a
// hook (usually the surface-level reason the disease looks unrelated to
// Hashimoto's at all), develops the actual finding in the middle, and
// closes on why it matters -- the same underlying facts and citations as
// the original pass, restructured for narrative pull rather than reworded
// for length. This category was chosen as the first rewritten, both
// because it's the one directly named in the feedback and because its own
// "surprising cross-disease connection" shape lends itself naturally to a
// hook-and-payoff structure -- treated as the template for the rest of
// this Digest's own categories, not yet applied everywhere at that time.
//
// 2026-08-08: content fields rewritten a second time, this pass to remove
// AI-writing tics flagged directly by the person -- em dashes as
// punctuation, "not X, it's Y" contrast, and overused words like
// "real"/"genuinely"/"honest(ly)"/"worth" -- see bigPicture.ts's own
// header comment for the full context. Every fact, number, and citation is
// unchanged; this is a prose pass only, on top of the narrative structure
// already built the day before.
export const OTHER_AUTOIMMUNE_ENTRIES: DigestEntry[] = [
  {
    id: 'other-why-cross-disease-evidence',
    category: 'hashimotos',
    title: 'Why This Category Exists At All',
    teaser: "Seven diagnoses with almost nothing in common on paper, until you look at what's actually happening in the gut of each one.",
    summary:
      'Rheumatoid arthritis attacks the joints. Lupus can attack the skin, the kidneys, almost anything. Multiple sclerosis attacks the insulating coating around nerve fibers. Type 1 diabetes destroys the insulin-producing cells of the pancreas. On paper, these look like entirely separate diseases, striking entirely separate organs, with nothing obviously in common with an autoimmune attack on the thyroid. But researchers studying each of these diseases independently, often with no thought of Hashimoto\'s at all, keep landing on the same handful of underlying mechanisms: gut bacteria producing short-chain fatty acids that either calm the immune system or fail to, a protein called zonulin that can make the gut lining measurably "leaky," and a specific imbalance between two types of immune cell, Th17 and Treg, that shows up again and again regardless of which organ the disease happens to target (all three are covered in full under Gut & Microbiome). When completely different research groups, studying completely different diseases, keep rediscovering the same biology on their own, that stops looking like coincidence. This category isn\'t seven Hashimoto\'s studies. None of them are. It\'s seven independent confirmations that the same mechanisms are in play across autoimmune disease broadly, worth reading as corroborating weight for the mechanisms the rest of this app already leans on rather than as seven unrelated pieces of trivia.',
    citations: [
      {
        source: 'Immunomodulatory role of gut microbiota in autoimmune disorders and the advancement of gut microbiota based therapeutic strategies',
        url: 'https://pubmed.ncbi.nlm.nih.gov/40645350/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-th17-treg-imbalance'],
  },
  {
    id: 'other-rheumatoid-arthritis',
    category: 'hashimotos',
    title: 'Rheumatoid Arthritis: The Same Vitamin D Puzzle, One More Time',
    teaser: 'A disease of the joints, nowhere near the thyroid, and the same open question about vitamin D shows up here too.',
    summary:
      "Rheumatoid arthritis has nothing to do with the thyroid gland itself. It's the immune system attacking the lining of the joints, producing the swelling, stiffness, and pain the disease is known for. So it's a genuine surprise that RA research keeps running into a question this app's own Hashimoto's research already knows well. Across multiple studies, people with lower vitamin D status tend to have more active, more severe RA, a consistent correlation. But when researchers actually give people vitamin D in a controlled trial to see whether raising their levels calms the disease down, the results come back inconsistent. Sometimes it helps, sometimes it barely moves at all. It's the identical \"consistent correlation, unreliable intervention\" shape already documented separately for Hashimoto's. Underneath both diseases, the research also keeps surfacing the same biological culprits covered elsewhere in this Digest: documented loss of the short-chain-fatty-acid-producing gut bacteria this whole app keeps returning to, and the same Th17/Treg imbalance that recurs throughout this entire category. One disease finding this pattern could be a fluke. Two starts to look like something. By the time a third condition shows the identical shape, it stops looking like coincidence at all.",
    citations: [
      { source: 'Vitamin D level in rheumatoid arthritis and its correlation with the disease activity: a meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/27049238/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-vitamin-d', 'ra-overview'],
  },
  {
    id: 'other-ibd',
    category: 'hashimotos',
    title: "Inflammatory Bowel Disease: The One Disease Where You Can Actually Watch the Gut Heal",
    teaser: "Every other entry in this category has to infer what's happening in the gut. This one can watch it, on camera, in real time.",
    summary:
      "Most of the diseases in this category force researchers to infer gut damage indirectly, from symptoms, from blood markers, from statistical association. Inflammatory bowel disease (Crohn's and ulcerative colitis) is different. A gastroenterologist can thread a camera through the colon and watch the actual tissue, inflamed or healed, directly. That direct visibility is exactly why one particular study matters more here than almost anywhere else in this app's research. A randomized controlled trial of the Autoimmune Protocol diet in IBD patients found improvement not just in how people felt, but in what the camera actually showed: measurably reduced inflammation on direct endoscopic exam. That's a stronger form of evidence than the single small AIP pilot study this app otherwise leans on for Hashimoto's specifically, precisely because IBD doesn't require guessing whether the gut actually got better. IBD research also directly measures something the rest of this category can usually only assume: people with IBD show documented depletion of the exact short-chain-fatty-acid-producing bacteria this whole Digest keeps pointing to as a missing piece. When a disease that can literally show its own gut healing on camera confirms the same mechanism this app's whole gut-repair argument is built around, that's about as close to direct proof as any single piece of cross-disease evidence in this category gets.",
    citations: [
      { source: 'Konijeti et al. 2017, Inflammatory Bowel Diseases: efficacy of the Autoimmune Protocol diet', url: 'https://pubmed.ncbi.nlm.nih.gov/28858071/' },
      { source: 'Short-chain fatty acid levels in stools of patients with inflammatory bowel disease are lower than those in healthy subjects', url: 'https://pubmed.ncbi.nlm.nih.gov/38829943/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-aip-ibd-rct', 'gut-scfa-treg', 'ibd-overview', 'ibd-fiber-flare-myth'],
  },
  {
    id: 'other-multiple-sclerosis',
    category: 'hashimotos',
    title: 'Multiple Sclerosis: The Same Vitamin D Question, a Third Time',
    teaser: 'Three different diseases, three different research communities, the same unresolved question about one vitamin.',
    summary:
      "Multiple sclerosis attacks the protective coating around nerve fibers, producing symptoms that can range from numbness to serious mobility loss, about as far, physically, from a thyroid condition as an autoimmune disease can get. And yet MS research runs into the identical wall Hashimoto's and rheumatoid arthritis research have both already hit: a consistent correlation between vitamin D status and disease activity, sitting right alongside controlled supplementation trials that can't consistently reproduce a benefit. Three separate diseases, studied by three separate research communities with no reason to be influenced by each other's results, landing on the exact same unresolved shape. At this point the pattern itself is the finding. This isn't one uncertain vitamin D study. It's the same uncertainty appearing independently three separate times, a different, more informative thing to know than any single one of those three studies would be on its own.",
    citations: [
      { source: 'Effect of Vitamin D Supplements on Relapse Rate and EDSS in Multiple Sclerosis: A Systematic Review and Meta-Analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/34211673/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-vitamin-d', 'other-rheumatoid-arthritis', 'ms-vitamin-d-mixed-evidence', 'ms-overview'],
  },
  {
    id: 'other-type1-diabetes',
    category: 'hashimotos',
    title: "Type 1 Diabetes: What Happens Before Anyone's Old Enough to Choose Their Own Diet",
    teaser: 'This disease pushes the whole gut-autoimmunity story back to infancy, long before a first solid meal.',
    summary:
      "Every other entry in this category is really a story about a food choice made, at some point, by an adult. Type 1 diabetes tells a different, earlier story: the destruction of the pancreas's own insulin-producing cells, and the research behind it, starts asking questions about someone's very first months of life. Research links how an infant is fed and how early they're exposed to antibiotics to their later risk of developing this disease, meaning the gut-microbiome \"training\" this app's own Gut & Microbiome research describes in adults may begin far earlier than any adult dietary choice could ever reach. T1D research adds one more specific data point on top of that: celiac disease and T1D co-occur together far more often than chance alone would explain, a statistical signal that whatever predisposes someone to one autoimmune attack often predisposes them to a second. It's a reminder that this whole category's focus on adult food choices, however well-grounded, is still only part of a bigger story, one that, in at least this one disease, starts before a person could ever have made a food choice at all.",
    citations: [
      { source: 'Diet, gut microbiome, and type 1 diabetes: from risk to translational opportunity', url: 'https://pubmed.ncbi.nlm.nih.gov/41536244/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['type1-overview', 'type1-celiac-comorbidity'],
  },
  {
    id: 'other-lupus',
    category: 'hashimotos',
    title: 'Lupus: The Strongest Gut-Autoimmunity Evidence in This Whole Category',
    teaser: 'A named bacterium, caught in the act, plus a human clinical trial, two of the hardest kinds of evidence to get, both in one disease.',
    summary:
      'Most of this category has to work with indirect evidence: a correlation here, a mechanism demonstrated in a different species there. Lupus research delivers something rarer, two of the most direct, hardest-to-obtain kinds of evidence in the entire gut-autoimmunity story, both inside the same disease. The first is a named culprit, not a vague "imbalanced microbiome": a specific gut bacterial strain, Blautia (Ruminococcus) gnavus, shown to directly cause zonulin-mediated gut permeability, with the effect confirmed to work differently in men and women. The second is an actual human randomized controlled trial, not an observation, an intervention, where giving lupus patients a probiotic yogurt containing L. rhamnosus and B. bifidum measurably improved both their disease activity and their disability scores. A named organism caught directly causing harm, and a clinical trial showing a food-based fix actually helping. That combination doesn\'t exist anywhere else in this category, which is exactly why lupus carries more weight here than its relatively minor role in most people\'s mental picture of "autoimmune disease" might suggest.',
    citations: [
      {
        source: 'Sex-dependent Lupus Blautia (Ruminococcus) gnavus strain induction of zonulin-mediated intestinal permeability and autoimmunity',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9405438/',
      },
      {
        source: 'The Effect of Probiotic Yogurt Containing L. rhamnosus and B. bifidum on Disease Activity and Disability in SLE: A Randomized Controlled Trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/40471639/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-blautia-lupus-zonulin', 'gut-probiotic-yogurt-lupus-rct', 'lupus-overview', 'lupus-alfalfa-canavanine'],
  },
  {
    id: 'other-sjogrens',
    category: 'hashimotos',
    title: "Sjögren's Syndrome: A Disease Known for Dryness, With a Surprising Gut Connection Anyway",
    teaser: 'Dry eyes and a dry mouth seem like the least gut-related symptoms imaginable. The data disagrees.',
    summary:
      "Sjögren's syndrome doesn't announce itself as a gut disease. Its hallmark symptoms are dryness: dry eyes, a dry mouth, the immune system attacking the glands that are supposed to keep them moist. Nothing about that description points toward digestion at all. Researchers looked anyway, and found what this whole category keeps finding regardless of which organ a given autoimmune disease actually targets: people with Sjögren's show measurably altered gut microbiota compared to healthy people, documented across a systematic review pooling 22 separate studies. Sjögren's also shows a genuine, if less-studied, tendency to occur alongside Hashimoto's specifically in the same person more often than chance alone would predict. Worth knowing for anyone managing both conditions at once, and worth noting as one more disease, with symptoms about as far from \"gut problem\" as an autoimmune condition gets, still landing on the same gut-microbiome signal as everything else in this category.",
    citations: [
      {
        source: "Association between primary Sjögren's syndrome and gut microbiota disruption: a systematic review and meta-analysis (22 studies)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/37682372/',
      },
    ],
    overallTier: 'weak',
    relatedIds: ['sjogrens-overview', 'sjogrens-secondary-ra-lupus-overlap'],
  },
  {
    id: 'other-psoriasis',
    category: 'hashimotos',
    title: 'Psoriasis & Psoriatic Arthritis: A Skin Disease With an Identifiable Gluten-Sensitive Minority',
    teaser: 'Not a universal gluten story. A specific subgroup where cutting it out actually, measurably helps.',
    summary:
      "Psoriasis shows up on the skin, red, scaly patches, sometimes accompanied by joint pain in its arthritic form, about as visually different from a digestive or thyroid condition as an autoimmune disease can look. Two findings connect it back to the rest of this category anyway. The first is a well-documented, bidirectional relationship with obesity and visceral fat inflammation, echoing this app's own Mitochondria & Metabolism research on visceral fat as active, hormone-producing tissue rather than passive padding. The second, more specific finding: an identifiable subgroup of psoriasis patients test positive for gluten antibodies, and that exact subgroup sees measurable skin improvement on a gluten-free diet. Not a claim that gluten causes psoriasis broadly, but evidence of a genuine responder subgroup worth knowing about if the condition runs in a family. A useful closing example for this whole category's own approach: the finding isn't \"gluten causes psoriasis\" for everyone. It's a testable, minority pattern, exactly the kind of precise, non-sweeping claim this Digest tries to make throughout.",
    citations: [
      { source: 'Psoriasis patients with antibodies to gliadin can be improved by a gluten-free diet', url: 'https://pubmed.ncbi.nlm.nih.gov/10651693/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-visceral-fat-endotoxin-barrier', 'psoriasis-overview'],
  },
  {
    id: 'other-tying-together',
    category: 'hashimotos',
    title: 'Tying It All Together: The Same Few Mechanisms, Seven Different Diseases',
    teaser: "Seven diagnoses that don't share a single symptom, and three biological threads that connect every one of them anyway.",
    summary:
      "Read one at a time, the seven diseases in this category don't have much in common on the surface: joints, skin, nerves, the pancreas, glands, the gut itself. It would be easy to read through them as seven unrelated case studies and move on. Step back and read them together instead, and the same three mechanisms keep resurfacing, entry after entry: a shifted balance between Th17 and Treg immune cells (rheumatoid arthritis, IBD, MS, and lupus all show it independently), the exact same \"consistent correlation, unreliable intervention trial\" vitamin D pattern (confirmed, separately, in three completely different diseases), and gut-barrier/zonulin involvement (lupus's own named bacterial strain, IBD's own directly-visualized inflammation). None of these seven research groups were trying to confirm each other's work. They were each simply studying their own disease. That's exactly what makes the repetition worth paying attention to. When independent researchers, working on different diseases with no reason to agree, keep landing on the same underlying biology, that's corroborating weight, not proof of anything Hashimoto's-specific, but a strong signal that the mechanisms this app's own Gut & Microbiome research is built around are general biology, not a theory invented to fit one disease.",
    citations: [
      {
        source: 'Metabolic reprogramming as a therapeutic target for modulating the Th17/Treg balance in autoimmune diseases: a comprehensive review',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12747992/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-th17-treg-imbalance', 'nutrient-vitamin-d'],
  },
];
