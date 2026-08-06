import type { DigestEntry } from './types';

// Other Autoimmune Diseases -- 9 entries. None of these are Hashimoto's
// studies -- every entry is tagged with which disease it actually studied.
// Cross-disease evidence is real corroborating weight for a hypothesis
// (the recurring SCFA/Th17-Treg/zonulin/molecular-mimicry mechanisms
// covered in Gut & Microbiome), not a substitute for a Hashimoto's-specific
// trial that hasn't been run -- the same discipline this whole app's
// research has held to throughout.
//
// 2026-08-07, same day, rewritten in a real narrative shape -- direct
// feedback that the original single-paragraph entries were "several
// thoughts" stacked together with no real beginning, middle, and end, and
// weren't written to make someone want to keep reading. Every entry below
// now opens on a real hook (usually the surface-level reason the disease
// looks unrelated to Hashimoto's at all), develops the actual finding in
// the middle, and closes on why it matters -- the same underlying facts
// and citations as the original pass, restructured for real narrative
// pull rather than reworded for length. This category was chosen as the
// first rewritten, both because it's the one directly named in the
// feedback and because its own "surprising cross-disease connection" shape
// lends itself naturally to a real hook-and-payoff structure -- worth
// treating as the template for the rest of this Digest's own categories,
// not yet applied everywhere.
export const OTHER_AUTOIMMUNE_ENTRIES: DigestEntry[] = [
  {
    id: 'other-why-cross-disease-evidence',
    category: 'otherAutoimmune',
    title: 'Why This Category Exists At All',
    teaser: 'Seven diagnoses with almost nothing in common on paper -- until you look at what\'s actually happening in the gut of each one.',
    summary:
      'Rheumatoid arthritis attacks the joints. Lupus can attack the skin, the kidneys, almost anything. Multiple sclerosis attacks the insulating coating around nerve fibers. Type 1 diabetes destroys the insulin-producing cells of the pancreas. On paper, these look like entirely separate diseases, striking entirely separate organs, with nothing obviously in common with an autoimmune attack on the thyroid. But researchers studying each of these diseases independently -- often with no thought of Hashimoto\'s at all -- keep landing on the same handful of underlying mechanisms. Gut bacteria producing short-chain fatty acids that either calm the immune system or fail to. A protein called zonulin that can make the gut lining measurably "leaky." A specific imbalance between two types of immune cell, Th17 and Treg, that shows up again and again regardless of which organ the disease happens to target (all three are covered in full under Gut & Microbiome). When completely different research groups, studying completely different diseases, keep rediscovering the same biology on their own, that stops looking like coincidence. That\'s what this category actually is: not seven Hashimoto\'s studies -- none of them are -- but seven independent confirmations that the same real mechanisms are genuinely in play across autoimmune disease broadly. Real corroborating weight for the mechanisms the rest of this app already leans on, worth reading with that in mind rather than as seven unrelated pieces of trivia.',
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
    category: 'otherAutoimmune',
    title: 'Rheumatoid Arthritis: The Same Vitamin D Puzzle, One More Time',
    teaser: 'A disease of the joints, nowhere near the thyroid -- and the exact same open question about vitamin D shows up here too.',
    summary:
      'Rheumatoid arthritis has nothing to do with the thyroid gland itself -- it\'s the immune system attacking the lining of the joints, producing the swelling, stiffness, and pain the disease is known for. So it\'s a genuine surprise that RA research keeps running into a question this app\'s own Hashimoto\'s research already knows well. Across multiple studies, people with lower vitamin D status tend to have more active, more severe RA -- a real, consistent correlation. But when researchers actually give people vitamin D in a controlled trial to see whether raising their levels calms the disease down, the results come back inconsistent: sometimes it helps, sometimes it barely moves at all. It\'s the identical "real correlation, unreliable intervention" shape already documented separately for Hashimoto\'s. Underneath both diseases, the research also keeps surfacing the same real biological culprits covered elsewhere in this Digest: documented loss of the short-chain-fatty-acid-producing gut bacteria this whole app keeps returning to, and the same Th17/Treg imbalance that recurs throughout this entire category. One disease finding this pattern could be a fluke. Two starts to look like something real -- and by the time a third condition shows the identical shape, it stops looking like coincidence at all.',
    citations: [
      { source: 'Vitamin D level in rheumatoid arthritis and its correlation with the disease activity: a meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/27049238/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-vitamin-d'],
  },
  {
    id: 'other-ibd',
    category: 'otherAutoimmune',
    title: "Inflammatory Bowel Disease: The One Disease Where You Can Actually Watch the Gut Heal",
    teaser: "Every other entry in this category has to infer what's happening in the gut. This one can watch it, on camera, in real time.",
    summary:
      'Most of the diseases in this category force researchers to infer gut damage indirectly -- from symptoms, from blood markers, from statistical association. Inflammatory bowel disease (Crohn\'s and ulcerative colitis) is different: a gastroenterologist can thread a camera through the colon and watch the actual tissue, inflamed or healed, directly. That real, direct visibility is exactly why one particular study matters more here than almost anywhere else in this app\'s research. A real randomized controlled trial of the Autoimmune Protocol diet in IBD patients found improvement not just in how people felt, but in what the camera actually showed: measurably reduced inflammation on direct endoscopic exam. That\'s a genuinely stronger form of evidence than the single small AIP pilot study this app otherwise leans on for Hashimoto\'s specifically -- precisely because IBD doesn\'t require guessing whether the gut actually got better. IBD research also directly measures something the rest of this category can usually only assume: people with IBD show real, documented depletion of the exact short-chain-fatty-acid-producing bacteria this whole Digest keeps pointing to as a missing piece. When a disease that can literally show its own gut healing on camera confirms the same mechanism this app\'s whole gut-repair argument is built around, that\'s about as close to direct proof as any single piece of cross-disease evidence in this category gets.',
    citations: [
      { source: 'Konijeti et al. 2017, Inflammatory Bowel Diseases -- efficacy of the Autoimmune Protocol diet', url: 'https://pubmed.ncbi.nlm.nih.gov/28858071/' },
      { source: 'Short-chain fatty acid levels in stools of patients with inflammatory bowel disease are lower than those in healthy subjects', url: 'https://pubmed.ncbi.nlm.nih.gov/38829943/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-aip-ibd-rct', 'gut-scfa-treg'],
  },
  {
    id: 'other-multiple-sclerosis',
    category: 'otherAutoimmune',
    title: 'Multiple Sclerosis: The Same Vitamin D Question, a Third Time',
    teaser: 'Three different diseases, three different research communities, the exact same unresolved question about one vitamin.',
    summary:
      'Multiple sclerosis attacks the protective coating around nerve fibers, producing symptoms that can range from numbness to serious mobility loss -- about as far, physically, from a thyroid condition as an autoimmune disease can get. And yet MS research runs into the identical wall Hashimoto\'s and rheumatoid arthritis research have both already hit: a real, consistent correlation between vitamin D status and disease activity, sitting right alongside real, controlled supplementation trials that can\'t consistently reproduce a benefit. Three separate diseases, studied by three separate research communities with no reason to be influenced by each other\'s results, landing on the exact same unresolved shape. At this point the pattern itself is the finding. This isn\'t one uncertain vitamin D study -- it\'s the same uncertainty appearing independently three separate times, which is a genuinely different, more informative thing to know than any single one of those three studies would be on its own.',
    citations: [
      { source: 'Effect of Vitamin D Supplements on Relapse Rate and EDSS in Multiple Sclerosis: A Systematic Review and Meta-Analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/34211673/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-vitamin-d', 'other-rheumatoid-arthritis'],
  },
  {
    id: 'other-type1-diabetes',
    category: 'otherAutoimmune',
    title: "Type 1 Diabetes: What Happens Before Anyone's Old Enough to Choose Their Own Diet",
    teaser: "This disease pushes the whole gut-autoimmunity story back to infancy, long before a first solid meal.",
    summary:
      "Every other entry in this category is really a story about a food choice made, at some point, by an adult. Type 1 diabetes tells a different, earlier story: the destruction of the pancreas's own insulin-producing cells, and the real research behind it, starts asking questions about someone's very first months of life. Real research links how an infant is fed and how early they're exposed to antibiotics to their later risk of developing this disease -- meaning the gut-microbiome \"training\" this app's own Gut & Microbiome research describes in adults may actually begin far earlier than any adult dietary choice could ever reach. T1D research adds one more real, specific data point on top of that: celiac disease and T1D co-occur together far more often than chance alone would explain, a real statistical signal that whatever predisposes someone to one autoimmune attack often predisposes them to a second. It's a genuine reminder that this whole category's focus on adult food choices, however well-grounded, is still only part of a bigger story -- one that, in at least this one disease, starts before a person could ever have made a food choice at all.",
    citations: [
      { source: 'Diet, gut microbiome, and type 1 diabetes: from risk to translational opportunity', url: 'https://pubmed.ncbi.nlm.nih.gov/41536244/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'other-lupus',
    category: 'otherAutoimmune',
    title: 'Lupus: The Single Strongest Gut-Autoimmunity Evidence in This Whole Category',
    teaser: 'A named bacterium, caught in the act, plus a real human clinical trial -- the two hardest kinds of evidence to get, both in one disease.',
    summary:
      'Most of this category has to work with indirect evidence -- a correlation here, a mechanism demonstrated in a different species there. Lupus research delivers something rarer: two of the most direct, hardest-to-obtain kinds of evidence in the entire gut-autoimmunity story, both inside the same disease. The first is a real, named culprit, not a vague "imbalanced microbiome": a specific gut bacterial strain, Blautia (Ruminococcus) gnavus, shown to directly cause zonulin-mediated gut permeability, with the effect even confirmed to work differently in men and women. The second is a genuine human randomized controlled trial -- not an observation, an actual intervention -- where giving lupus patients a real probiotic yogurt containing L. rhamnosus and B. bifidum measurably improved both their disease activity and their disability scores. A named organism caught directly causing harm, and a real clinical trial showing a food-based fix actually helping: that combination doesn\'t exist anywhere else in this category, which is exactly why lupus carries more weight here than its relatively minor role in most people\'s mental picture of "autoimmune disease" might suggest.',
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
    relatedIds: ['gut-blautia-lupus-zonulin', 'gut-probiotic-yogurt-lupus-rct'],
  },
  {
    id: 'other-sjogrens',
    category: 'otherAutoimmune',
    title: "Sjögren's Syndrome: A Disease Known for Dryness, With a Surprising Gut Connection Anyway",
    teaser: 'Dry eyes and a dry mouth seem like the least gut-related symptoms imaginable -- the data disagrees.',
    summary:
      "Sjögren's syndrome doesn't announce itself as a gut disease. Its hallmark symptoms are dryness -- dry eyes, a dry mouth, the immune system attacking the glands that are supposed to keep them moist. Nothing about that description points toward digestion at all. Real research looked anyway, and found what this whole category keeps finding regardless of which organ a given autoimmune disease actually targets: people with Sjögren's show measurably altered gut microbiota compared to healthy people, documented across a real systematic review pooling 22 separate studies. On top of that, Sjögren's shows a genuine, if less-studied, tendency to occur alongside Hashimoto's specifically in the same person more often than chance alone would predict. Worth knowing for anyone managing both conditions at once -- and worth noting as one more disease, with symptoms about as far from \"gut problem\" as an autoimmune condition gets, still landing on the same real gut-microbiome signal as everything else in this category.",
    citations: [
      {
        source: "Association between primary Sjögren's syndrome and gut microbiota disruption: a systematic review and meta-analysis (22 studies)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/37682372/',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'other-psoriasis',
    category: 'otherAutoimmune',
    title: 'Psoriasis & Psoriatic Arthritis: A Skin Disease With a Real, Identifiable Gluten-Sensitive Minority',
    teaser: 'Not a universal gluten story -- a real, specific subgroup where cutting it out actually, measurably helps.',
    summary:
      'Psoriasis shows up on the skin -- red, scaly patches, sometimes accompanied by joint pain in its arthritic form -- about as visually different from a digestive or thyroid condition as an autoimmune disease can look. Two real findings connect it back to the rest of this category anyway. The first: a real, well-documented, bidirectional relationship with obesity and visceral fat inflammation, echoing this app\'s own Mitochondria & Metabolism research on visceral fat as genuinely active, hormone-producing tissue rather than passive padding. The second, more specific: a real, identifiable subgroup of psoriasis patients test positive for gluten antibodies, and that exact subgroup sees measurable skin improvement on a gluten-free diet -- not a claim that gluten causes psoriasis broadly, but real evidence of a genuine responder subgroup worth knowing about if the condition runs in a family. A useful closing example for this whole category\'s own honesty: the finding isn\'t "gluten causes psoriasis" for everyone, it\'s a real, testable, minority pattern -- exactly the kind of precise, non-sweeping claim this Digest tries to make throughout.',
    citations: [
      { source: 'Psoriasis patients with antibodies to gliadin can be improved by a gluten-free diet', url: 'https://pubmed.ncbi.nlm.nih.gov/10651693/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['mito-visceral-fat-endotoxin-barrier'],
  },
  {
    id: 'other-tying-together',
    category: 'otherAutoimmune',
    title: 'Tying It All Together: The Same Few Mechanisms, Seven Different Diseases',
    teaser: "Seven diagnoses that don't share a single symptom -- and three biological threads that connect every one of them anyway.",
    summary:
      "Read one at a time, the seven diseases in this category don't have much in common on the surface -- joints, skin, nerves, the pancreas, glands, the gut itself. It would be easy to read through them as seven unrelated case studies and move on. Step back and read them together instead, and the same three real mechanisms keep resurfacing, entry after entry: a shifted balance between Th17 and Treg immune cells (rheumatoid arthritis, IBD, MS, and lupus all show it independently), the exact same \"real correlation, unreliable intervention trial\" vitamin D pattern (confirmed, separately, in three completely different diseases), and gut-barrier/zonulin involvement (lupus's own named bacterial strain, IBD's own directly-visualized inflammation). None of these seven research groups were trying to confirm each other's work -- they were each simply studying their own disease. That's exactly what makes the repetition worth paying attention to. When independent researchers, working on different diseases with no reason to agree, keep landing on the same underlying biology, that's real corroborating weight -- not proof of anything Hashimoto's-specific, but a genuinely strong signal that the mechanisms this app's own Gut & Microbiome research is built around are real, general biology, not a theory invented to fit one disease.",
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
