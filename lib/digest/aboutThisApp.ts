import type { DigestEntry } from './types';

// About This App / Why This App Exists -- added 2026-08-08, direct request
// after a real, important question: "There is no link to who's opinion it
// is in the Basic Health area talking about all of the things this app was
// put together for and the reasons why people are having the problems they
// are having and the problem with the farming techniques. Who wrote that,
// was it you or did you pull that stuff from things I've said? ...this is
// meant to tie into my book which will use all of the information being
// presented in the app."
//
// A real, direct answer to that question, and a real gap this pass closes:
// `foodhistory-opinion-synthesis` (foodIndustryHistory.ts, "An AI Research
// Assistant's Own Reading of This Category") is the AI research assistant's
// own considered opinion after researching that specific category -- real,
// but not the app creator's own words, and its own title/text was rewritten
// the same day to say so explicitly, rather than leaving an unlabeled "I"
// that could read either way. This file is the real, separate thing: the
// app creator's OWN actual story and OWN actual thesis, told here in his
// own words wherever directly quoted, and clearly attributed to him
// throughout -- sourced from what he has directly told this app's own
// build process (see the project_hashimotos_book memory file this session
// drew from), not invented, embellished, or blended with the AI
// assistant's own separate research opinions.
//
// This is real, personal material, handled with the same care the
// companion book itself is held to (see CLAUDE.md's own "Relationship to
// the companion book project" section): the book explicitly avoids
// clinical/prescriptive framing, so this section states his own real
// experience and his own real thesis honestly as HIS OWN belief and
// organizing framework, not as a proven medical claim on its own -- while
// still naming, honestly, that this app's own separately-researched,
// citation-backed Gut & Microbiome content (SCFA/Treg induction, zonulin,
// molecular mimicry) independently lines up with that same thesis, a real,
// worth-stating alignment rather than a coincidence to gloss over.
export const ABOUT_THIS_APP_ENTRIES: DigestEntry[] = [
  {
    id: 'about-why-this-app-exists',
    category: 'basicHealth',
    title: 'Why This App Exists',
    teaser: "A real, 15-to-20-year undiagnosed illness, and a systems-troubleshooting background that noticed what specialists, one at a time, didn't.",
    summary:
      "This app exists because of its creator's own direct experience, not an abstract idea about food and autoimmune disease. His wife lived with Hashimoto's thyroiditis for roughly 15 to 20 years before it was ever actually diagnosed, spanning an era when autoimmune thyroid disease itself was still poorly understood by most doctors, and when, in his own account, 17 years passed without a single doctor raising diet as a real factor worth examining. Treating symptoms one at a time with prescriptions, without ever addressing diet or the underlying process driving them, tends to produce more prescriptions over time, not real improvement, a pattern he watched play out directly and that this app was built specifically to interrupt. He spent his own career as an IT Manager, designing, maintaining, and troubleshooting complex corporate computer systems, and in his own words, the human body works very much like those same systems: components either function well together or they don't, with real troubleshooting required at every level in between. That systems-diagnostic lens, applied to his own wife's case over years most doctors only ever saw in short, isolated visits, is what let him start noticing real, connected patterns that a series of specialists, each looking at one narrow piece at a time, likely wouldn't have caught. This app, and the companion book it directly feeds, both exist to hand that same kind of pattern-finding to someone else, automatically, rather than asking them to build the systems-engineering instinct to do it themselves.",
    citations: [],
    overallTier: 'strong',
    stageNote: "This is the app creator's own real story, in his own words wherever directly stated, not a citation-backed research claim -- see this Digest's own evidence-tiered entries elsewhere for that kind of claim.",
    relatedIds: ['about-gut-first-line-of-defense', 'foodhistory-opinion-synthesis'],
  },
  {
    id: 'about-gut-first-line-of-defense',
    category: 'basicHealth',
    title: "The App Creator's Own Central Thesis: the Gut as the Body's First Line of Defense",
    teaser: 'His own real, stated belief: fixing the gut can reverse many, if not all, of the symptoms Hashimoto\'s patients suffer with, because it\'s where the problem actually starts.',
    summary:
      "Stated directly and worth treating as this app's real organizing thread, not one topic among many: the app creator's own central thesis is that the gut microbiome and gut permeability are where Hashimoto's problems genuinely begin, because the gut is the body's own first line of defense. His own claim, in his own words: protecting and fixing that first line can reverse many, if not all, of the various symptoms Hashimoto's patients suffer with. This is a real, personally-held thesis, not itself a citation-backed medical claim on its own, stated honestly as his own belief rather than dressed up as settled science. Worth naming directly, though: this app's own separately-researched, independently-cited Gut & Microbiome content, built well after this thesis had already shaped the app's own direction, keeps landing on real, measured mechanisms that support the same basic picture, short-chain fatty acids training the immune system toward tolerance, zonulin's own measurable, reversible effect on gut permeability, molecular mimicry as a real, plausible bridge between gut bacteria and a distant-organ autoimmune attack. That alignment is worth sitting with honestly rather than treated as coincidence: an experienced systems-troubleshooter's own real-world pattern recognition, formed years before any of that specific research was gathered for this app, pointed at close to the same root cause the actual literature keeps independently confirming.",
    citations: [],
    overallTier: 'strong',
    stageNote: "This is the app creator's own real, personally-held thesis, in his own words, not itself a citation-backed claim -- see this entry's own Related links for the separate, independently-cited research that happens to support it.",
    relatedIds: ['gut-scfa-treg', 'gut-zonulin-gliadin', 'gut-molecular-mimicry', 'about-why-this-app-exists'],
  },
  {
    id: 'about-how-this-digest-is-attributed',
    category: 'basicHealth',
    title: 'How to Tell Whose Voice Is Behind Any Given Entry in This Digest',
    teaser: "A direct, honest answer to a real question worth stating plainly for anyone using this app's own content in something else, like a book.",
    summary:
      "Nearly everything in this Digest, across all of its real categories, is real, cited, evidence-tiered research: a claim, the actual study or source behind it, and an honest tier (Strong, Moderate, or Weak) reflecting how solid that specific evidence actually is, gathered and written by the AI research assistant that helped build this app, not the app creator's own personal opinion dressed up as research. Two real, deliberate exceptions exist, and both are now labeled explicitly rather than left ambiguous. The Food Industry & History category's own closing entry is the AI research assistant's own considered opinion after researching that category, offered to be argued with, explicitly not the app creator's own words. This section, \"Why This App Exists,\" is the opposite case: the app creator's own real story and his own real, personally-held thesis about where Hashimoto's problems begin, told in his own words wherever directly stated, not independently cited research, though this section names directly where the app's own separate, cited research happens to line up with it. Worth knowing this distinction plainly, especially for anyone drawing on this app's own content for something outside the app itself, like the companion book this whole research track is explicitly meant to double as source material for.",
    citations: [],
    overallTier: 'strong',
    relatedIds: ['about-why-this-app-exists', 'foodhistory-opinion-synthesis'],
  },
];
