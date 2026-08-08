import type { DigestEntry } from './types';

// Gut & Microbiome -- 17 entries, the single largest category and the one
// most directly tied to this app's own named core purpose ("gut/microbiome
// healing is an explicit, named goal, not just a side effect of good food
// choices" -- CLAUDE.md). Draws on this session's own gut-mechanism
// research across the literature scan's Parts One/Four and the dedicated
// leaky-gut-repair deep dive.
//
// 2026-08-07, same day, rewritten in a narrative shape, the second
// category to get this treatment (Other Autoimmune Diseases was first) --
// direct confirmation the new voice is the right direction, plus a direct
// request to make entries longer and more data-inclusive. This category
// also directly reflects the user's own real framing, given the same day:
// a retired IT Manager's systems-troubleshooting background, applied to
// noticing patterns in his wife's own long-delayed Hashimoto's diagnosis,
// and his own central thesis that the gut is the body's first line of
// defense -- protecting it is where reversing Hashimoto's symptoms
// actually starts. That framing is woven into the opening entry and the
// closing synthesis below, in the user's own words where possible, not
// invented for the app -- see the book-project memory file for the full
// context this was drawn from.
//
// 2026-08-08: content fields rewritten a second time to remove AI-writing
// tics flagged directly by the person -- em dashes as punctuation, "not X,
// it's Y" contrast, and overused words like "real"/"genuinely"/
// "honest(ly)"/"worth" -- see bigPicture.ts's own header comment for the
// full context. Every fact, number, and citation is unchanged, and the
// user's own personal framing (the firewall/systems analogy, "first line
// of defense") is preserved.
//
// 2026-08-08, same day, third change: `category` reassigned per entry as
// part of the Digest-wide Hashimoto's/Basic Health restructure (see
// types.ts's own header comment). First pass put most of this category in
// `basicHealth` on the reasoning that the underlying mechanisms (SCFA/Treg,
// zonulin, Th17/Treg, molecular mimicry) are general immunology, not
// Hashimoto's-exclusive. Direct correction the same day: gut-barrier
// dysfunction, "leaky gut," and immune-tolerance mechanisms are inherently
// autoimmune-disease content, not universal body-function education the
// way organ physiology or a nutrient's own RDA is -- this whole category is
// the foundation this app's own autoimmune-gut-healing mission is built on,
// and belongs with the condition it was researched for. All 17 entries now
// carry `category: 'hashimotos'`.
export const GUT_MICROBIOME_ENTRIES: DigestEntry[] = [
  {
    id: 'gut-scfa-treg',
    category: 'hashimotos',
    title: 'Short-Chain Fatty Acids: The First Line of Defense, Doing Its Actual Job',
    teaser: 'Somewhere in a gut, right now, bacteria are turning fiber into a signal the immune system can actually read: the most food-controllable lever in this app\'s entire research base.',
    summary:
      "Picture the gut lining the way a systems engineer might picture a network's own outermost firewall: the first checkpoint deciding what gets let through and what doesn't. That checkpoint isn't passive. It's actively staffed by trillions of gut bacteria, and what they do with the fiber someone eats determines a lot about how well that checkpoint actually holds. When those bacteria ferment dietary fiber, they produce short-chain fatty acids, mainly butyrate, propionate, and acetate. These aren't leftover byproducts. They're potent signaling molecules that drive measurable immune tolerance through regulatory T cell (Treg) induction, through two separate, independently confirmed mechanisms: HDAC inhibition (chemically loosening how tightly certain genes are wound, making tolerance-promoting genes easier to switch on) and direct signaling through a trio of receptors, GPR43, GPR41, and GPR109A, carried by both gut cells and immune cells. Two independently published studies (Smith et al. 2013, Science; Furusawa et al. 2013, Nature) confirmed this from two different angles, landing on the same conclusion from two different directions: SCFAs directly train the immune system toward tolerance, not attack. This is the actual mechanistic bridge between \"eat more fiber\" and \"calm an overactive immune system,\" real biology standing behind what could otherwise sound like a vague wellness slogan. It's also, by a wide margin, the single most directly food-controllable lever this whole Digest has found. Unlike a gene, a diagnosis, or a decade of processed-food history, how much fiber reaches the gut tomorrow is a choice available today.",
    citations: [
      { source: 'Smith et al. 2013, Science: SCFAs regulate colonic Treg cell homeostasis', url: 'https://pubmed.ncbi.nlm.nih.gov/23828891/' },
      { source: 'Furusawa et al. 2013, Nature: commensal microbe-derived butyrate induces colonic Treg differentiation', url: 'https://pubmed.ncbi.nlm.nih.gov/24226770/' },
    ],
    overallTier: 'strong',
    relatedIds: ['gut-fiber-hashimotos-microbiota', 'foodhistory-butter-short-chain-fat'],
  },
  {
    id: 'gut-zonulin-gliadin',
    category: 'hashimotos',
    title: 'Zonulin & the Gliadin-CXCR3 Pathway: How a Gut Feels "Loose" Isn\'t a Metaphor',
    teaser: '"Leaky gut" sounds like a vague wellness phrase, until you learn the actual protein responsible has a name, a receptor, and a reversible mechanism.',
    summary:
      "\"Leaky gut\" gets used so loosely in casual health conversation that it's easy to assume there's no real biology behind it, just a catchy phrase standing in for \"something's wrong down there.\" That assumption doesn't survive contact with the actual research. Gliadin, a specific fragment of the gluten protein, binds directly to a receptor called CXCR3 on the surface of intestinal cells. That binding event triggers those cells to release zonulin, a real, named protein whose entire job is regulating how tightly the junctions between gut lining cells stay sealed. Zonulin doesn't destroy the barrier. It reversibly opens it, the molecular equivalent of a security checkpoint temporarily waving more traffic through than it should. This pathway was first fully characterized in celiac disease, but it doesn't stay confined there. The same gliadin-CXCR3-zonulin sequence is now documented as relevant across several other autoimmune conditions this Digest covers under Other Autoimmune Diseases, not just celiac. This is exactly the kind of specific, named mechanism this whole Digest tries to insist on instead of vague gut-health language: a receptor, a protein, a reversible effect, not a mystery standing in for one.",
    citations: [
      { source: 'Fasano 2011, Physiological Reviews: zonulin and intestinal barrier function', url: 'https://pubmed.ncbi.nlm.nih.gov/21248165/' },
    ],
    overallTier: 'strong',
    relatedIds: ['problem-gluten-grains', 'celiac-overview'],
  },
  {
    id: 'gut-blautia-lupus-zonulin',
    category: 'hashimotos',
    title: 'A Named Bacterium, Caught Directly Causing Permeability',
    teaser: 'Most of this category infers gut permeability indirectly. This one identifies the actual organism responsible, red-handed.',
    summary:
      "Most gut-permeability research works backward from an effect (elevated zonulin in the blood, a disease flaring, a symptom pattern) and infers a likely cause. Lupus research did something rarer. It found the actual organism doing the damage. A specific gut bacterial strain, Blautia (also classified as Ruminococcus) gnavus, was shown to directly induce zonulin-mediated intestinal permeability, and the effect turned out to be sex-dependent, working differently in male and female subjects, a level of mechanistic specificity most gut-microbiome findings never reach at all. This isn't Hashimoto's research. It's lupus research, included here as corroborating evidence for the broader gut-autoimmunity link this whole category is built around, not a Hashimoto's-specific claim. \"An imbalanced microbiome\" is the phrase reached for when nobody actually knows which organism is responsible. This is the rarer case where researchers do.",
    citations: [
      {
        source: 'Sex-dependent Lupus Blautia (Ruminococcus) gnavus strain induction of zonulin-mediated intestinal permeability and autoimmunity (Frontiers in Immunology, 2022)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9405438/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['other-lupus', 'lupus-overview', 'lupus-alfalfa-canavanine'],
  },
  {
    id: 'gut-glutamine-null-result',
    category: 'hashimotos',
    title: 'L-Glutamine: Almost Certainly the Most Recommended "Leaky Gut" Supplement, and a Humbling Correction',
    teaser: "If there's one supplement everyone assumes fixes a leaky gut, it's this one. The actual trial data, pooled honestly, says otherwise.",
    summary:
      "Walk into almost any conversation about healing a \"leaky gut\" and L-glutamine will come up within the first few sentences. It's probably the single most commonly recommended supplement in this entire space, repeated confidently enough that it rarely gets questioned. It's not a baseless recommendation to begin with. Glutamine has a specific mechanism: it regulates the tight-junction proteins occludin and claudin-1, and it's the preferred fuel source enterocytes (the cells lining the small intestine) burn directly. It also has genuine positive trial results in specific, narrower contexts: HIV, burn injuries, exercise-induced heat stress. But when a systematic review pooled 10 clinical trials, 352 participants total, specifically testing whether glutamine improves intestinal permeability, the answer came back no, no significant overall improvement. This is exactly the kind of correction this Digest exists to make plainly rather than quietly bury: a real mechanism and genuine trial support in narrow contexts doesn't automatically mean the popular, broader claim holds up once it's actually pooled and tested at scale.",
    citations: [
      {
        source: 'Abbasi et al. 2024, Amino Acids: systematic review & meta-analysis of glutamine supplementation and gut permeability',
        url: 'https://doi.org/10.1007/s00726-024-03420-7',
      },
    ],
    overallTier: 'weak',
  },
  {
    id: 'gut-vitamin-d-cldn2',
    category: 'hashimotos',
    title: "Vitamin D & CLDN2: A Second, Independent Reason It Might Matter for Hashimoto's",
    teaser: "Vitamin D's own effect on Hashimoto's antibodies is a mixed picture. Its effect on the gut barrier is a different, cleaner story, discovered by researchers who weren't even looking for it.",
    summary:
      "Vitamin D's own track record against Hashimoto's antibodies directly, covered elsewhere in this Digest under Nutrients & Micronutrients, is honestly mixed: a real correlation, inconsistent intervention trials. That mixed picture doesn't mean vitamin D has nothing real to do with Hashimoto's. It may simply mean the research has been looking in the wrong place. A gene called CLDN2 codes for claudin-2, one of the actual structural proteins making up a tight junction between gut cells. ChIP-assay research, a direct, molecular method for confirming a gene is genuinely under another molecule's control, not just associated with it, found CLDN2 is a direct, confirmed target of the vitamin D receptor. That means vitamin D receptor signaling has a specific, non-speculative role protecting gut-barrier integrity through the MLCK signaling pathway, entirely separate from whatever it's doing (or not clearly doing) to TPO antibodies directly. If vitamin D turns out to matter for Hashimoto's, this gut-barrier pathway is a plausible reason why, a second, independent route to the same disease, found by researchers who weren't even asking about Hashimoto's when they found it.",
    citations: [
      { source: 'Zhang et al. 2015, Scientific Reports: tight junction CLDN2 gene is a direct target of the vitamin D receptor', url: 'https://pubmed.ncbi.nlm.nih.gov/26212084/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-vitamin-d'],
  },
  {
    id: 'gut-zinc-carnosine',
    category: 'hashimotos',
    title: 'Zinc Carnosine: A Specific Compound With Better Evidence Than Its Quiet Reputation Suggests',
    teaser: 'Not just "zinc": a specific paired compound with a real trial showing it fully blocked a documented, everyday cause of gut damage.',
    summary:
      "Zinc on its own already has a fairly general role in immune function, covered elsewhere in this Digest. Zinc carnosine, a specific bonded compound of zinc and the amino acid carnosine, not interchangeable with plain zinc, has something more specific and more directly useful to say about the gut barrier itself. A randomized controlled trial found zinc carnosine completely blocked the intestinal-permeability increase caused by NSAIDs, the same everyday over-the-counter pain relievers (ibuprofen, naproxen, aspirin) covered under Lifestyle & Environment for their own documented gut-barrier effect. Separate trial evidence supports zinc carnosine for tight-junction integrity in two more specific populations: athletes and people with gastric ulcers. A more consistently positive picture than glutamine's own honest null result above, worth knowing by its specific compound name, not lumped in with \"zinc\" generally the way it usually gets marketed.",
    citations: [
      {
        source: 'Mahmood et al. 2007, Gut: zinc carnosine stabilises small bowel integrity and stimulates gut repair',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16777920/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['nutrient-zinc-iron-b12', 'lifestyle-nsaids-gut'],
  },
  {
    id: 'gut-strain-specific-mechanisms',
    category: 'hashimotos',
    title: '"Take a Probiotic" Undersells What\'s Actually Known: Different Strains Repair Different Proteins',
    teaser: '"Probiotics are good for gut health" is technically true and almost useless. The actual research is far more specific than that ever lets on.',
    summary:
      "\"Take a probiotic\" is one of the most common, and least specific, pieces of gut-health advice in circulation. It treats an entire, wildly diverse category of organisms as if they were interchangeable, which they genuinely aren't. E. coli Nissle 1917, a specific, well-studied probiotic strain, has documented mechanisms for restoring three distinct tight-junction proteins: ZO-1, ZO-2, and claudin-14. Bifidobacterium bifidum, a completely different organism, works through a completely different mechanism, restoring occludin specifically, one more of the small set of proteins that physically hold the gut barrier sealed. Two named organisms, two chemically distinct repair pathways, specific mechanistic evidence deliberately avoiding the vagueness \"probiotics help the gut\" leaves unexamined. This is the level of specificity this app's own Fermented Foods research is built around: which strain, doing what, to which protein, because \"probiotics help the gut\" is true in roughly the same unhelpful way \"food is fuel\" is true.",
    citations: [
      {
        source: 'Outer membrane vesicles and soluble factors released by E. coli Nissle 1917 enhance barrier function by regulating tight-junction proteins',
        url: 'https://pubmed.ncbi.nlm.nih.gov/28018313/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['fermented-bifidobacterium'],
  },
  {
    id: 'gut-4r-protocol',
    category: 'hashimotos',
    title: 'The 4R Protocol: Real Evidence in Every Piece, No Trial of the Whole Package',
    teaser: 'Every individual ingredient in this popular framework checks out on its own. The framework itself, as packaged and sold, has never actually been tested as a unit.',
    summary:
      "The 4R Protocol (Remove triggers, Replace digestive support, Reinoculate with probiotics, Repair the gut lining) is one of the most widely used frameworks in functional medicine, repeated across countless practitioner sites and patient guides as an established, proven protocol. Piece by piece, it genuinely holds up. Elimination, probiotics, glutamine, zinc carnosine (with glutamine's own real limits, honestly noted above), every individual component covered elsewhere in this category has its own separately-tested evidence base. What doesn't hold up under a direct search is the packaged, 4-step protocol itself. A search for clinical validation of the 4R Protocol as a whole turned up almost entirely practitioner and wellness-industry sources, not a peer-reviewed trial of the combined program as its own intervention. That's a meaningfully different thing to know than either \"this protocol works\" or \"this protocol is fake.\" It's a useful organizing framework built from separately-evidenced parts, honestly tiered here as exactly that: a practitioner framework, not a validated package.",
    citations: [
      {
        source: 'The Institute for Functional Medicine: "Five R Gut Restoration Program"',
        url: 'https://www.marioninstitute.org/wp-content/uploads/2020/04/FiveRFrameworkforGutRestoration_v3.pdf',
      },
    ],
    overallTier: 'weak',
    stageNote: 'The framework spans this app\'s own Stages 2-3 ("Digging" and "Gut Repair").',
  },
  {
    id: 'gut-zonulin-timeline',
    category: 'hashimotos',
    title: 'How Long Does Gut Repair Actually Take? A Checkable Answer',
    teaser: 'Not an indefinite "it takes time." Real trials measured zonulin directly and put an actual number of weeks on it.',
    summary:
      '"Healing the gut takes time" is true, and almost useless on its own. It gives no real sense of whether that means two weeks or two years. Dietary-intervention studies that measured zonulin directly, not just symptoms, put an actual number on it. A randomized crossover trial in older adults eating a polyphenol-rich diet (the MaPLE trial) found significant zonulin reductions within just 8 weeks. A second, independent trial following weight loss in patients with MASH/liver fibrosis confirmed genuine reductions holding at both the 12-week and the 24-week mark. A checkable timeline instead of an open-ended promise, worth pairing with the honest caveat that these are group averages from specific interventions in specific populations, not a guarantee of any one person\'s own exact pace.',
    citations: [
      {
        source: "Del Bo' et al. 2021, Clinical Nutrition: polyphenol-rich diet reduces serum zonulin in older subjects (the MaPLE trial)",
        url: 'https://pubmed.ncbi.nlm.nih.gov/33388204/',
      },
      {
        source: 'Changes in intestinal permeability and gut microbiota following diet-induced weight loss in MASH/liver fibrosis patients',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11444513/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A realistic milestone marker for this app\'s own Stage 3 ("Gut Repair").',
    chart: {
      title: 'Trial Timelines for a Measured Zonulin Reduction',
      unit: ' wks',
      data: [
        { label: 'First significant reduction (MaPLE trial)', value: 8 },
        { label: 'Confirmed, weight-loss trial (first check)', value: 12 },
        { label: 'Confirmed, weight-loss trial (later check)', value: 24 },
      ],
      sourceNote: "Del Bo' et al. 2021; MASH/liver-fibrosis weight-loss trial, PMC11444513",
    },
  },
  {
    id: 'gut-larazotide',
    category: 'hashimotos',
    title: 'Larazotide Acetate: When Pharmaceutical Research Takes This Biology as Seriously as It Deserves',
    teaser: 'A drug, built specifically to block zonulin, has reached Phase III trials, with one honest, humbling result attached to it.',
    summary:
      "It would be easy to assume gut-permeability biology is a wellness-industry concept mainstream pharmaceutical research doesn't take seriously. Larazotide acetate is direct evidence otherwise. This is a real drug candidate, purpose-built specifically to block zonulin, and it has reached Phase III clinical trials for celiac disease, the kind of sustained investment a pharmaceutical company doesn't make in a mechanism it considers fringe. The complication: despite showing measurable symptom benefit in its own trial, larazotide did not significantly improve the actual measured intestinal-permeability outcome researchers were tracking. A humbling reminder for this whole category: symptom relief and a measured biological marker don't always move together, even inside a well-funded pharmaceutical trial, one more reason this Digest tries to report what was actually measured, not just what people reported feeling.",
    citations: [
      {
        source: 'Larazotide acetate: a pharmacological peptide approach to tight junction regulation (AJP-GI and Liver Physiology, 2021)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/33881350/',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'gut-fiber-hashimotos-microbiota',
    category: 'hashimotos',
    title: "The One Study in This Category Actually Run on Hashimoto's Patients",
    teaser: "Almost everything else in this category is borrowed from other diseases as corroborating evidence. This one isn't.",
    summary:
      "Reading through this category, most of the strongest individual mechanisms, the named bacterial strain found in lupus, the endoscopically-confirmed AIP trial run in IBD patients, come from other autoimmune diseases, included as corroborating evidence rather than direct proof. This entry is the exception. A dietary-fiber-intervention study measured gut microbiota changes directly in Hashimoto's thyroiditis patients, not extrapolated, not borrowed, a genuinely disease-specific population. It directly supports the SCFA/fiber mechanism at the top of this category, but with data drawn from the actual disease this whole app is built around, not a related one standing in for it. Small in scope, but real, and rare enough in this category to be worth flagging specifically, one of the few entries here where \"Hashimoto's\" isn't a word researchers were reasoning toward from somewhere else, but the actual population sitting in front of them.",
    citations: [
      {
        source: "Dietary fibre intervention in Hashimoto's thyroiditis patients and its impact on the gut microbiota (2025)",
        url: 'https://www.sciencedirect.com/science/article/pii/S2667268525000178',
      },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'gut-aip-ibd-rct',
    category: 'hashimotos',
    title: "The Strongest AIP Evidence in This App's Research Base Comes From a Different Disease Entirely",
    teaser: "A larger, more rigorous trial than anything ever run on Hashimoto's directly, and it happened somewhere else.",
    summary:
      "The Autoimmune Protocol diet shows up throughout this app's research as a real, if imperfectly evidenced, elimination-and-reintroduction strategy. Its single strongest piece of trial evidence doesn't come from Hashimoto's research at all. A randomized controlled trial of the AIP diet in inflammatory bowel disease (Crohn's and ulcerative colitis) found improvement in both quality of life and endoscopic (directly visualized) inflammation. That's a larger, more rigorous trial than the single small Hashimoto's-specific AIP pilot study this app otherwise leans on, run in a disease where \"did the gut actually get better\" can be checked directly on camera rather than inferred from how someone says they feel. Corroborating weight for AIP as a strategy worth considering, not proof it works for Hashimoto's specifically, but a meaningfully stronger foundation than the thin Hashimoto's-only evidence would provide on its own.",
    citations: [
      { source: 'Konijeti et al. 2017, Inflammatory Bowel Diseases: efficacy of the Autoimmune Protocol diet', url: 'https://pubmed.ncbi.nlm.nih.gov/28858071/' },
    ],
    overallTier: 'moderate',
    relatedIds: ['ibd-overview', 'ibd-een-crohns'],
  },
  {
    id: 'gut-probiotic-yogurt-lupus-rct',
    category: 'hashimotos',
    title: "A Real Human Trial of One of This App's Own Everyday Foods, Just Not in Hashimoto's Patients",
    teaser: 'Not a mouse study, not an observation: a randomized human trial of ordinary probiotic yogurt, in a genuinely different autoimmune disease.',
    summary:
      "Most of the food-level interventions covered in this app's own Fermented Foods research rest on mechanism and observational data. This entry is a rarer thing: a randomized, controlled human trial of an actual, everyday food. Lupus patients given a probiotic yogurt containing L. rhamnosus and B. bifidum showed measurable improvement in both disease activity and disability measures compared to controls, genuine clinical-trial evidence, not observational correlation, in a disease with documented biological overlap to Hashimoto's through the same gut-autoimmunity mechanisms this category covers throughout. A human, food-based intervention that worked, in a real trial, exactly the kind of evidence this whole Digest is built to surface, while still being honest about its actual limit: a different disease, not Hashimoto's itself.",
    citations: [
      {
        source: 'The effect of probiotic yogurt containing L. rhamnosus and B. bifidum on disease activity and disability in SLE: a randomized controlled trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/40471639/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['gut-blautia-lupus-zonulin', 'lupus-overview'],
  },
  {
    id: 'gut-th17-treg-imbalance',
    category: 'hashimotos',
    title: 'Th17/Treg Imbalance: The Mechanism That Keeps Showing Up No Matter Which Disease You Read About',
    teaser: 'Follow enough different autoimmune diseases far enough back and they keep arriving at the exact same immune-cell imbalance.',
    summary:
      "Read enough autoimmune-disease research and a strange thing starts to happen: papers about completely unrelated conditions (joints, gut, nerves, skin) keep circling back to the same underlying immune-cell story. That story is a shifted balance between Th17 cells, which drive inflammation, and regulatory T cells, or Tregs, which promote tolerance. This imbalance is independently documented across rheumatoid arthritis, inflammatory bowel disease, multiple sclerosis, lupus, and Hashimoto's alike, and the gut microbiome, through the exact SCFA mechanism covered at the top of this category, is one of the most directly food-influenced levers on that balance that's actually been identified anywhere in this research. This is the unifying thread behind why the cross-disease research covered under Other Autoimmune Diseases gets treated as genuine corroborating evidence in this app, rather than dismissed as noise from an unrelated condition. On this one specific mechanism, it genuinely isn't unrelated at all.",
    citations: [
      {
        source: 'Metabolic reprogramming as a therapeutic target for modulating the Th17/Treg balance in autoimmune diseases: a comprehensive review',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12747992/',
      },
    ],
    overallTier: 'strong',
  },
  {
    id: 'gut-molecular-mimicry',
    category: 'hashimotos',
    title: 'Molecular Mimicry: How Something in the Gut Ends Up Implicated in a Thyroid Disease At All',
    teaser: 'The immunology explaining the single strangest-sounding claim in this whole app: that gut bacteria could be connected to an attack on the thyroid.',
    summary:
      '"Gut bacteria might be connected to your thyroid" is probably the claim in this entire Digest that sounds the most far-fetched on first hearing it. Molecular mimicry is the real, well-established immunology that makes it genuinely plausible. When a microbial protein happens to structurally resemble a human protein closely enough, the antibodies the immune system trained to recognize and attack that microbe can mistakenly cross-react with the body\'s own tissue instead, a genuine case of biological mistaken identity, not a metaphor. This is one of the leading proposed mechanisms connecting gut bacterial composition to thyroid autoimmunity specifically, standing alongside, not replacing, the zonulin/permeability pathway and the SCFA/Treg pathway covered elsewhere in this same category. Three genuinely different mechanisms, each with its own evidence, all pointing the same direction, not one vague "gut-thyroid connection" repeated three times over, but three separate, specific reasons the connection is real.',
    citations: [
      { source: 'Molecular mimicry and autoimmune thyroid disease (Current Opinion in Endocrinology, Diabetes and Obesity, 2016)', url: 'https://pubmed.ncbi.nlm.nih.gov/27307072/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'gut-leaky-gut-contested',
    category: 'hashimotos',
    title: '"Leaky Gut": Real Biology, a Genuinely Contested Diagnosis',
    teaser: 'The mechanism is measurable. The label is still debated. This app is built to be honest about exactly where that line actually sits.',
    summary:
      '"Leaky gut" is simultaneously one of the most mocked phrases in mainstream medicine and one of the most real, measurable phenomena described throughout this entire category. Both things are true at once, and conflating them does a disservice to the actual science either way. Intestinal permeability itself (zonulin levels, lactulose-mannitol testing) is a real, directly measurable phenomenon with genuine, documented mechanistic links to several autoimmune conditions, exactly what this whole category has been laying out entry by entry. "Leaky gut syndrome" as a standalone clinical diagnosis is a different claim, and it remains genuinely debated within mainstream gastroenterology and endocrinology, not because the underlying biology is fake, but because a clear, agreed clinical definition and diagnostic threshold simply don\'t exist yet the way they do for, say, celiac disease. Held to the same evidence-tiering standard as everything else in this app: real mechanism, real measurement, contested label, a distinction worth keeping straight rather than either dismissing the whole idea or overselling it as settled fact.',
    citations: [
      { source: 'Biomarkers for assessment of intestinal permeability in clinical practice (Scandinavian Journal of Gastroenterology, 2021)', url: 'https://pubmed.ncbi.nlm.nih.gov/34009040/' },
    ],
    overallTier: 'moderate',
  },
  {
    id: 'gut-tying-together',
    category: 'hashimotos',
    title: 'Tying It All Together: The Gut Barrier Is the Hub',
    teaser: "Seventeen entries, one physical checkpoint underneath nearly all of them: the body's actual first line of defense.",
    summary:
      "Step back far enough from the seventeen entries in this category and a single, physical structure keeps reappearing underneath almost all of them: the intestinal barrier itself, and how permeable it currently is. Think of it the way a systems engineer might think about a network's own outermost firewall, the first checkpoint deciding what gets let through and what doesn't, and the one point in the whole system where a single failure has the widest possible downstream effect. Strengthen that checkpoint (fiber and SCFAs, specific probiotic strains like E. coli Nissle or B. bifidum, zinc carnosine) and less gets through that shouldn't. Weaken it (gluten's own zonulin trigger, chronic antibiotic disruption, a gut that's already inflamed) and more does, setting off molecular mimicry, feeding a Th17/Treg imbalance, and touching nearly every other mechanism this category covers. That's not a loose metaphor. It's the literal, mechanistic reason this app treats the gut as the body's first line of defense, rather than one wellness topic sitting alongside dozens of others of equal weight. The honest caveats scattered through this category (L-glutamine's null result, the 4R Protocol's unvalidated packaging, \"leaky gut\" as a contested diagnosis) matter just as much as the positive findings do. The barrier itself is real and measurable. Not every proposed fix for it has actually been proven to work, and knowing the difference is exactly what turns \"protect your gut\" from a slogan into something a person can actually act on.",
    citations: [
      { source: 'Fasano 2011, Physiological Reviews: zonulin and intestinal barrier function', url: 'https://pubmed.ncbi.nlm.nih.gov/21248165/' },
    ],
    overallTier: 'strong',
    relatedIds: ['healing-stage-map', 'mito-visceral-fat-endotoxin-barrier'],
  },
];
