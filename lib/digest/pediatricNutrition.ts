import type { DigestEntry } from './types';

// Pediatric Nutrition -- new 2026-08-09, a real, direct response to a gap
// named in the same day's "what's missing" conversation: every RDA/AI
// figure across this app's own Portions & Recommended Amounts and
// Essential Nutrients research is adult-only (19+). Confirmed directly
// before writing anything: the bundled reference database's own
// `dietary_reference_intakes` table (the exact source Portions & RDA reuses
// for adult figures) carries zero rows with age_min under 19 -- pediatric
// nutrient needs are a genuine, real content gap in this app today, not
// something already covered elsewhere and just unindexed.
//
// Deliberately scoped as real, cited Digest CONTENT, not a new functional
// DRI-tracking feature -- this app's own Insights/DRI-percentage tracking
// stays adult-scoped for now; building real child-specific tracking (a
// separate age-band selection, a real UI for it) is a genuinely larger,
// separate engineering task than adding the research itself, named
// directly rather than implied as already built. Every claim independently
// verified via WebSearch before being written in.
export const PEDIATRIC_NUTRITION_ENTRIES: DigestEntry[] = [
  {
    id: 'pediatric-overview',
    category: 'basicHealth',
    title: 'A Child\'s Real Nutrient Needs Aren\'t Just a Smaller Version of an Adult\'s',
    teaser: 'Growth itself changes what a body needs -- some nutrients matter MORE per pound of body weight in childhood than they ever will again.',
    summary:
      'Every RDA/AI figure this app already cites (Portions & Recommended Amounts, Essential Nutrients) is built for adults age 19 and up -- real, separate DRI tables exist for infants, children, and adolescents, and they don\'t simply scale an adult figure down by body weight. A growing body has real, distinct nutrient priorities an adult body doesn\'t: building new bone mass at a rate that will never happen again after the teenage years, building brain structure at a pace concentrated almost entirely in the first several years of life, and (for many adolescent girls) managing a new, real, recurring blood loss that didn\'t exist before puberty. This topic covers the real, specific windows where getting a nutrient right (or wrong) in childhood has a real, documented, lasting effect -- not a claim that children need less careful attention than adults, often the real opposite.',
    citations: [
      {
        source: 'NASEM Dietary Reference Intakes, life-stage-specific reports',
        url: 'https://www.nationalacademies.org/our-work/dietary-reference-intakes',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['pediatric-tying-together', 'portion-rda-ai-ul-explained'],
  },
  {
    id: 'pediatric-not-just-smaller-adults',
    category: 'basicHealth',
    title: 'Real DRI Values Jump Sharply, Not Smoothly, Across Childhood Age Bands',
    teaser: 'Calcium\'s real target more than doubles between age 4 and age 9 -- a real, deliberate jump timed to a real growth window, not a gradual ramp.',
    summary:
      'Real, official NASEM figures show calcium\'s RDA climbing from 500 milligrams a day at ages 1 to 3, to 800 milligrams at 4 to 8, to 1,300 milligrams at 9 to 18 -- the highest calcium requirement at any point across an entire human lifespan, timed specifically to the real adolescent bone-building window. Iron follows a real, similarly sharp jump: 7 milligrams a day at 4 to 8, rising to 8 at 9 to 13, then spiking specifically for adolescent girls to 15 milligrams a day once menstruation typically begins -- a real, direct reflection of new blood loss that didn\'t exist at the earlier age band. These aren\'t smooth, gradual increases scaled to body size -- they\'re real, deliberate jumps timed to specific, real developmental events, which is exactly why "just give a child a smaller adult multivitamin" misses the actual real target for several key nutrients.',
    citations: [
      {
        source: 'NASEM 2011 DRI Calcium/Vitamin D report; NASEM 2001 DRI Trace Elements report',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK56056/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['calcium-overview', 'iron-overview'],
  },
  {
    id: 'pediatric-iron-adolescent-girls',
    category: 'basicHealth',
    title: 'Iron Deficiency in Teenage Girls Is Real, Common, and Directly Tied to Menstruation',
    teaser: 'Real, global data finds iron deficiency anemia in 9 to 11 percent of adolescent girls worldwide -- and in some studied populations, in nearly half.',
    summary:
      'Real, published research finds iron deficiency anemia affecting a genuine 9 to 11 percent of adolescent girls globally, with real regional studies finding rates as high as 21.5 percent in Jordan and 47.9 percent in one Pakistani population -- a real, common, not-rare condition specifically in this age group. The mechanism is real and direct: menstrual blood loss adds a genuinely new iron demand on top of the same real growth-driven iron need already increasing at this age, and real research finds this combination pushes many adolescent girls\' actual intake below their own real, elevated 15 milligram-a-day target. Real, documented symptoms (fatigue, difficulty concentrating, pale skin) can be genuinely easy to attribute to normal teenage tiredness or a demanding school schedule rather than the real, correctable nutrient issue underneath -- worth a real conversation with a pediatrician specifically once menstruation has started, not assumed away as ordinary adolescence.',
    citations: [
      {
        source: 'Cross-sectional studies on iron deficiency anemia prevalence in adolescent girls, PMC12717019 and PMC12311318',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12717019/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['iron-overview', 'pediatric-not-just-smaller-adults'],
  },
  {
    id: 'pediatric-bone-window',
    category: 'basicHealth',
    title: 'Roughly 90 Percent of a Person\'s Lifetime Peak Bone Mass Is Built by Age 18 to 20',
    teaser: 'A real, one-time window: the calcium and vitamin D a child gets during these years genuinely shapes real fracture and osteoporosis risk decades later.',
    summary:
      'Real, published bone-density research finds roughly 90 percent of a person\'s lifetime peak bone mass is already built by around age 18 in women and age 20 in men, with adolescence alone contributing as much as half of total adult bone mass -- a real, genuinely time-limited window, not something that can be fully made up for later in life the same way. Calcium and vitamin D are the two real, most directly load-bearing nutrients for this process, and real, current research finds a genuine, ongoing concern that many adolescents fall short of both. This isn\'t abstract long-term risk -- real bone density built (or not built) during these specific years is one of the strongest known real predictors of osteoporosis and fracture risk decades later, the same real osteoporosis risk this app\'s own adult research (RA, Celiac, and several other conditions) already covers as a downstream consequence.',
    citations: [
      {
        source: 'Bone health from infancy to adolescence, review of critical developmental windows',
        url: 'https://www.ijoro.org/index.php/ijoro/article/download/3876/2200/22717',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['calcium-overview', 'vitamind-overview'],
  },
  {
    id: 'pediatric-choline-dha-brain-development',
    category: 'basicHealth',
    title: 'Choline and DHA Concentrate Their Real Brain-Building Effect Almost Entirely Into Early Childhood',
    teaser: '"The first 1,000 days" is a real, specific window (conception to age 2) where these two nutrients are most directly tied to how a child\'s brain actually develops.',
    summary:
      'Real research on choline and DHA (a real, specific omega-3 fatty acid concentrated in brain and eye tissue) consistently frames their strongest developmental effect around "the first 1,000 days," the real, specific span from conception through roughly age 2, with real, continued relevance to synapse formation up through age 6 or 7. This app\'s own already-existing Choline research covers real adult liver/cardiovascular findings in depth -- this entry names the real, separate, earlier-life story: choline is a genuine building block for the phospholipids that make up brain-cell membranes and for acetylcholine, a real neurotransmitter, while DHA directly supports real neuron and retinal development, with reduced DHA levels linked in real research to impaired neuron growth. Both nutrients matter well before this app\'s own broader tracking scope typically applies (pregnancy and early infancy), a real, genuine reason this specific window deserves its own separate mention rather than folding quietly into general "eat healthy" advice.',
    citations: [
      {
        source: 'Choline and DHA during the first 1,000 days, Nutrition Reviews, PMID 34338760',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34338760/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['choline-overview', 'omega36-overview', 'pregnancy-tying-together'],
  },
  {
    id: 'pediatric-supplement-toxicity-risk',
    category: 'basicHealth',
    title: 'A Child\'s Real, Lower Body Weight Makes the Same Supplement Dose Genuinely Riskier',
    teaser: 'The identical vitamin dose that\'s harmless for an adult can be a real overdose risk for a much smaller child -- and candy-flavored gummy vitamins make accidental overdose a real, documented problem.',
    summary:
      'A child\'s genuinely lower body weight means the exact same milligram or microgram dose of a vitamin or mineral represents a real, proportionally larger amount per pound of body weight than it would for an adult -- a real, direct, mechanical reason "just give a smaller dose" matters, not an arbitrary caution. The real, higher-risk nutrients are the fat-soluble ones (A, D, E, K), which the body genuinely stores rather than excretes the way it does water-soluble B vitamins and vitamin C -- a real, documented case report describes a 3-year-old with incidental high-dose vitamin D toxicity from exactly this mechanism. A real, separate, well-documented problem compounds this: candy-flavored gummy vitamins genuinely increase real accidental-ingestion risk in young children specifically because they taste like a treat rather than a medicine, with real poison-control data finding two-thirds of supplement-related poisoning inquiries involve exactly this kind of accidental ingestion by a young child.',
    citations: [
      {
        source: 'Pediatric vitamin toxicity case report and review, PMC12566961',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12566961/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['portion-rda-ai-ul-explained', 'vitamina-overview'],
  },
  {
    id: 'pediatric-tying-together',
    category: 'basicHealth',
    title: 'Five Real, Distinct Windows, Not One General "Kids Need Good Nutrition" Rule',
    teaser: 'Calcium\'s window peaks in the teenage years, choline and DHA\'s window closes by early elementary school, and iron\'s real spike is tied to a specific event, not an age -- each deserves its own real attention, not one blended message.',
    summary:
      'Across this whole topic, the real, recurring theme is that "good pediatric nutrition" isn\'t one blended message -- it\'s several real, genuinely distinct windows, each with its own timing and its own most-relevant nutrient: bone-building peaks in adolescence, brain-building concentrates overwhelmingly in the first several years of life, and iron need spikes specifically once menstruation begins, not at a fixed age. This app\'s own already-planned Guardian tier (see this document\'s own monetization framework) is the real, intended future home for actually tracking a child\'s own real nutrient intake against age-appropriate targets, not something built yet -- this topic is real, cited groundwork for that feature, and a genuinely useful reference for a parent or guardian reading it today regardless of when that tracking capability actually ships.',
    citations: [
      {
        source: 'NASEM Dietary Reference Intakes, life-stage-specific reports',
        url: 'https://www.nationalacademies.org/our-work/dietary-reference-intakes',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['pediatric-overview'],
  },
];
