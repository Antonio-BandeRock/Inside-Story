import type { DigestEntry } from './types';

// Hands-On & Complementary Therapies, Basic Health -- added 2026-09-04.
//
// Direct request, after a shared conversation about a sacral adjustment
// and easier urination: "I don't think we have much of anything specific
// in the Digest for any of the conditions, which should also include
// acupuncture, but separately, as well as deep tissue massage. Those
// three should also be included as entries in the basic health section."
//
// This file is the Basic Health half: what each therapy is and what the
// research says about it in general, independent of any one condition.
// The condition-specific half lives in each condition's own file under
// the 'complementary-' id prefix, which app/(tabs)/purple-digest.tsx's
// classifyConditionTopic already routes to the "Complementary & Manual
// Therapies" topic.
//
// lib/digest/complementaryTherapies.ts already existed and covers these
// same three modalities against Hashimoto's specifically (2026-08-07).
// Nothing here duplicates it: that file asks "does this help autoimmune
// thyroid disease," this one asks "what is this therapy and what has it
// been tested on at all." Both directions are cross-linked.
//
// Every citation below was verified by fetching the record rather than
// recalled, matching this project's standing discipline. Two findings are
// reported that do not flatter the therapies involved (Cochrane finding
// no benefit over sham for IBS, and a deep tissue massage trial whose
// design cannot show massage beat doing nothing), because leaving them
// out would make this topic an advertisement.

export const HANDS_ON_THERAPIES_ENTRIES: DigestEntry[] = [
  {
    id: 'handson-three-therapies-compared',
    category: 'basicHealth',
    title: 'Three Therapies That Get Grouped Together and Should Not Be',
    teaser:
      'Chiropractic care, acupuncture, and deep tissue massage sit under one heading in most conversations, and the research behind them looks nothing alike.',
    summary:
      "Chiropractic care applies a thrust or a mobilization to a joint, most often in the spine or pelvis. Acupuncture places fine needles at specific points and leaves them in place. Deep tissue massage applies sustained firm pressure into the deeper muscle and connective tissue layers. They are grouped together because they are all hands-on and all sit outside standard drug treatment, and that is about where the similarity ends. The evidence behind them differs enough that a single verdict covering all three would be wrong about at least two of them. Acupuncture has the largest body of controlled trial data, including an individual patient data meta-analysis pooling the underlying numbers from dozens of randomized trials rather than just their published summaries. Spinal manipulation has a large meta-analysis for one specific problem, chronic low back pain, and very little for anything else. Deep tissue massage has the least, partly because it is not defined tightly enough across studies for results to be pooled at all. Read each of the entries that follow on its own terms rather than looking for a shared answer.",
    citations: [
      {
        source:
          'Rubinstein SM, de Zoete A, van Middelkoop M, et al. 2019: Benefits and harms of spinal manipulative therapy for the treatment of chronic low back pain: systematic review and meta-analysis of randomised controlled trials (BMJ 364:l689)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30867144/',
      },
      {
        source:
          'Vickers AJ, Vertosick EA, Lewith G, et al. 2018: Acupuncture for Chronic Pain: Update of an Individual Patient Data Meta-Analysis (J Pain 19(5):455-474)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29198932/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: [
      'handson-chiropractic-back-pain-evidence',
      'handson-acupuncture-chronic-pain',
      'handson-deep-tissue-massage-evidence',
      'complementary-tying-together',
    ],
  },
  {
    id: 'handson-chiropractic-back-pain-evidence',
    category: 'basicHealth',
    title: 'Spinal Manipulation and Back Pain: About As Good As the Alternatives',
    teaser:
      'The largest analysis of chiropractic care for chronic low back pain found it works about as well as the treatments clinical guidelines already recommend.',
    summary:
      'Chronic low back pain is where spinal manipulation has been studied most, and the picture there is reasonably clear. A 2019 systematic review and meta-analysis in the BMJ pooled 47 randomized controlled trials covering 9,211 participants, comparing spinal manipulative therapy against guideline-recommended interventions, against interventions guidelines do not recommend, against sham manipulation, and in combination with other care. The finding was that manipulation produces effects similar to the therapies clinical guidelines already recommend, such as exercise. That is a modest result stated plainly: it places manipulation among the reasonable options for chronic low back pain rather than above them. Reported harms were mostly transient musculoskeletal soreness. Two things follow from this. If back pain is the problem, this is an option with data behind it, and choosing between it and supervised exercise is a question of preference and access rather than of one being clearly better. And the evidence stops at the spine. A finding about back pain says nothing about whether manipulation changes anything happening in an organ, which is a separate claim covered in the next entry.',
    citations: [
      {
        source:
          'Rubinstein SM, de Zoete A, van Middelkoop M, et al. 2019: Benefits and harms of spinal manipulative therapy for the treatment of chronic low back pain: systematic review and meta-analysis of randomised controlled trials (BMJ 364:l689)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30867144/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: ['handson-chiropractic-organ-claims', 'handson-safety-and-what-to-ask', 'complementary-chiropractic'],
  },
  {
    id: 'handson-chiropractic-organ-claims',
    category: 'basicHealth',
    title: 'When an Adjustment Is Said to Help an Organ',
    teaser:
      'The nerves that leave the spine really do run to the bladder, the gut, and everywhere else. That anatomy alone does not show that adjusting the spine changes what those organs do.',
    summary:
      'A claim that comes up often around chiropractic care runs roughly like this: the nerves controlling an organ pass through a particular part of the spine, tension or misalignment there compresses those nerves, and an adjustment relieves the pressure so the organ works normally again. The anatomy in that chain is correct and taught in every medical school. Nerves leaving the sacrum control the bladder and the pelvic floor. Nerves leaving the mid and lower thoracic spine reach the gut. Medicine takes those pathways seriously enough to target them directly: sacral neuromodulation, an implanted device that stimulates the third sacral nerve root, is an established treatment for overactive bladder and for urinary retention that has not responded to other care. What the anatomy does not establish is the middle of the chain. Searches of the peer-reviewed literature for trials testing spinal manipulation against a measured organ outcome come back close to empty. There is no clinical trial evidence connecting manipulation to thyroid or autoimmune disease, and none testing it against the urinary symptoms of an enlarged prostate. That is different from having been tested and found not to work. It means the question has not been answered, and a plausible pathway is not an answer. Someone who feels a change after an adjustment is reporting something that happened to them, and that is information. Turning it into a general mechanism needs a study that does not exist yet.',
    citations: [],
    overallTier: 'weak',
    relatedIds: [
      'handson-chiropractic-back-pain-evidence',
      'complementary-chiropractic',
      'complementary-prostate-sacral-nerves-bladder',
      'complementary-prostate-chiropractic-luts',
      'complementary-cvd-blood-pressure-replication',
    ],
  },
  {
    id: 'handson-acupuncture-chronic-pain',
    category: 'basicHealth',
    title: 'Acupuncture and Chronic Pain: A Small Effect That Survives a Sham Comparison',
    teaser:
      'Pooling the underlying patient data from dozens of randomized trials found an effect on chronic pain that persists over time and is not explained by placebo alone.',
    summary:
      'Acupuncture has been tested more rigorously than either of the other two therapies in this topic, and the strongest evidence comes from the Acupuncture Trialists\' Collaboration. Rather than pooling published summary results, which is what most meta-analyses do, this group obtained the individual patient records from randomized trials and reanalyzed them together, which allows the analysis to check things the original papers never reported. Their 2018 update, covering chronic musculoskeletal pain, headache, and osteoarthritis, concluded that acupuncture has a clinically relevant effect on chronic pain, that the effect persists over time rather than fading immediately, and that it cannot be explained only by placebo effects. Two qualifications belong alongside that. The effect is small. And the comparison that matters most, true acupuncture against sham needling, produces a narrower gap than the comparison against no acupuncture at all, which means a meaningful part of what people experience comes from the encounter, the attention, and the expectation rather than from needle placement. That is not a dismissal. A treatment that reliably reduces pain is doing something useful regardless of how much of it runs through mechanisms nobody has fully mapped. It does mean that claims resting on precise point selection are on weaker ground than claims about acupuncture in general.',
    citations: [
      {
        source:
          'Vickers AJ, Vertosick EA, Lewith G, et al. 2018: Acupuncture for Chronic Pain: Update of an Individual Patient Data Meta-Analysis (J Pain 19(5):455-474)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29198932/',
      },
    ],
    overallTier: 'strong',
    relatedIds: [
      'handson-acupuncture-where-it-does-nothing',
      'handson-safety-and-what-to-ask',
      'complementary-acupuncture',
    ],
  },
  {
    id: 'handson-acupuncture-where-it-does-nothing',
    category: 'basicHealth',
    title: 'Where Acupuncture Has Been Tested and Come Up Empty',
    teaser:
      'A Cochrane review found no important benefit over sham for irritable bowel syndrome. A separate one found a small benefit for migraine. Both results are useful.',
    summary:
      'A therapy that works for some things and not others is more believable than one said to work for everything, so the places acupuncture has been tested and found wanting belong in this topic alongside the places it has done well. For irritable bowel syndrome, a Cochrane review found moderate certainty evidence of no important benefit over sham acupuncture, for symptom severity or for quality of life. Not one of the trials comparing acupuncture against sham found acupuncture better, and pooling them did not change that. The same review noted a pattern that explains a lot of the enthusiasm: in trials comparing acupuncture against antispasmodic drugs rather than against sham, patients reported greater benefit from acupuncture, which points toward preference and expectation rather than toward a specific effect on the gut. Migraine prevention landed differently. A Cochrane review of acupuncture for preventing episodic migraine found headache frequency at least halved in 50% of people receiving acupuncture against 41% receiving sham, a difference that is statistically significant and small, with roughly eleven people needing treatment for one additional person to benefit. Moderate quality evidence, and a fair description of it is "somewhat better than sham, and comparable to the drugs used for the same purpose."',
    citations: [
      {
        source:
          'Manheimer E, Cheng K, Wieland LS, et al. 2012: Acupuncture for treatment of irritable bowel syndrome (Cochrane Database Syst Rev 2012(5):CD005111)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22592702/',
      },
      {
        source:
          'Linde K, Allais G, Brinkhaus B, et al. 2016: Acupuncture for the prevention of episodic migraine (Cochrane Database Syst Rev 2016(6):CD001218)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/27351677/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: [
      'handson-acupuncture-chronic-pain',
      'complementary-migraine-acupuncture',
      'complementary-ibs-acupuncture',
      'complementary-pcos-acupuncture-live-birth',
      'complementary-graves-ophthalmopathy-trial',
      'complementary-psoriasis-acupuncture',
    ],
  },
  {
    id: 'handson-deep-tissue-massage-evidence',
    category: 'basicHealth',
    title: 'Deep Tissue Massage: A Thinner Evidence Base Than Its Popularity Suggests',
    teaser:
      'The main obstacle to knowing whether deep tissue massage works is that studies do not define it the same way, so their results cannot be pooled.',
    summary:
      'Deep tissue massage means sustained firm pressure into the deeper muscle and connective tissue layers, as opposed to the lighter flowing strokes of a Swedish or relaxation massage. That is a description of technique rather than a protocol, and it is the central problem with the research. Trials of massage differ in pressure, duration, number of sessions, which tissue is targeted, and what the therapist was trained in, which leaves reviewers unable to combine results the way they can for a drug given at a fixed dose. Massage therapy in general has low to moderate quality evidence supporting it for pain and function in conditions such as arthritis. For deep tissue work specifically, one useful trial gave 59 people with chronic low back pain ten daily thirty-minute deep tissue massage sessions over two weeks, with one group also taking a non-steroidal anti-inflammatory drug. Both groups improved on pain and disability scores, and adding the drug did not improve on massage alone. Notice what that design can and cannot show. It is evidence that the drug added nothing on top of the massage. It is not evidence that the massage beat doing nothing, because there was no group that received neither. Reporting it as proof that deep tissue massage works for back pain would be overstating what was actually tested.',
    citations: [
      {
        source:
          'Majchrzycki M, Kocur P, Kotwicki T 2014: Deep tissue massage and nonsteroidal anti-inflammatory drugs for low back pain: a prospective randomized trial (The Scientific World Journal 2014:287597)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24707200/',
      },
      {
        source: 'National Center for Complementary and Integrative Health: Massage Therapy for Health, What the Science Says',
        url: 'https://www.nccih.nih.gov/health/providers/digest/massage-therapy-for-health-science',
      },
    ],
    overallTier: 'weak',
    relatedIds: [
      'handson-targeted-versus-general-massage',
      'handson-safety-and-what-to-ask',
      'complementary-massage-cortisol',
    ],
  },
  {
    id: 'handson-targeted-versus-general-massage',
    category: 'basicHealth',
    title: 'Targeted Bodywork Beat a Full-Body Massage, Head to Head',
    teaser:
      'A multicenter trial put focused pelvic floor myofascial therapy against ordinary full-body massage. The targeted work responded more than twice as often.',
    summary:
      'One of the more informative massage trials did something unusual: it used a general massage as the comparison group rather than as the treatment. Eighty-one women with interstitial cystitis or painful bladder syndrome and tenderness in the pelvic floor muscles were randomized to either myofascial physical therapy, meaning focused internal and external work on the specific restricted tissue, or global therapeutic massage, meaning a traditional full-body Western massage. Both groups received up to ten weekly one-hour sessions from trained therapists, so time, touch, and attention were matched. At twelve weeks, 59% of the targeted group rated themselves moderately or markedly improved against 26% of the full-body massage group, a difference unlikely to be chance. This is the closest thing available to a controlled answer on what kind of hands-on work is worth paying for. Where a specific tight or tender structure is driving the symptom, working on that structure did substantially better than a skilled, pleasant, equally long massage of the whole body. It also means the 26% figure deserves respect: a quarter of people improved from general massage alone. If the goal is relaxation and easing overall muscle tension, either will do. If a particular structure is the problem, find someone trained to work on that structure.',
    citations: [
      {
        source:
          'FitzGerald MP, Payne CK, Lukacz ES, et al. 2012: Randomized multicenter clinical trial of myofascial physical therapy in women with interstitial cystitis/painful bladder syndrome and pelvic floor tenderness (J Urol 187(6):2113-2118)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22503015/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: [
      'handson-deep-tissue-massage-evidence',
      'complementary-prostate-pelvic-floor-therapy',
      'handson-tracking-whether-it-works',
    ],
  },
  {
    id: 'handson-safety-and-what-to-ask',
    category: 'basicHealth',
    title: 'What Can Go Wrong, and What to Say Before the Session Starts',
    teaser:
      'Serious harm from any of these three is uncommon. Most of what does go wrong is predictable from something the practitioner was never told.',
    summary:
      'Acupuncture has the best safety data of the three, because it has been tracked at scale. A prospective German study following 229,230 patients through roughly 2.2 million acupuncture treatments recorded two cases of pneumothorax, a punctured lung, which remains the most common serious complication reported. Minor effects such as needling pain, small bleeding, or bruising occur in something between roughly 7% and 15% of sessions across prospective studies, and serious events requiring hospital admission have been estimated at around 0.024% of patients. Spinal manipulation of the low back carries mostly short-lived soreness. Manipulation of the NECK is the contested area: cervical artery dissection followed by stroke has been reported after neck manipulation, it is rare, and whether the manipulation causes it or whether people whose artery is already tearing seek out a practitioner for the resulting neck pain and headache is still argued in the literature. Around 80% of dissections announce themselves with severe headache and neck pain beforehand, which is exactly why sudden severe neck pain or headache of a kind never felt before should be a reason to see a doctor rather than a reason to book an adjustment. Massage has few risks for most people and several specific ones: a known or suspected deep vein clot in the leg should never be massaged, blood thinners raise the chance of bruising and deeper bleeding, and cancer that has spread to bone calls for a therapist who has been told and knows how to work around it. Every one of those depends on the practitioner being told. Say what you have been diagnosed with, every medication including blood thinners, whether you are pregnant, and whether anything about the pain is new or different from usual.',
    citations: [
      {
        source:
          'Witt CM, Pach D, Brinkhaus B, et al. 2009: Safety of acupuncture: results of a prospective observational study with 229,230 patients (Forsch Komplementmed 16(2):91-97)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/19420954/',
      },
      {
        source: 'Haynes MJ, Vincent K, Fischhoff C, et al. 2012: Assessing the risk of stroke from neck manipulation: a systematic review (Int J Clin Pract)',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3506737/',
      },
    ],
    overallTier: 'moderate',
    relatedIds: [
      'handson-chiropractic-back-pain-evidence',
      'handson-acupuncture-chronic-pain',
      'handson-deep-tissue-massage-evidence',
      'advocacy-how-to-ask',
    ],
  },
  {
    id: 'handson-tracking-whether-it-works',
    category: 'basicHealth',
    title: 'How to Find Out Whether It Works for You Specifically',
    teaser:
      'Published averages cannot tell you whether a therapy helps you. Dates and check-ins can, and the app does the arithmetic.',
    summary:
      'Every finding in this topic is an average across a group of people, and averages hide the fact that some of those people improved a great deal and others not at all. Which of those you are is a separate question, and it is answerable. The obstacle is memory. Nobody standing in a practitioner\'s office three weeks later can accurately recall how the fourth day after the last session compared to an ordinary Tuesday, and the natural tendency is to remember the sessions that were followed by a good week. What defeats that is writing things down at the time. Log each session under Schedules, then Hands-On Therapies, with its date. Keep doing ordinary check-ins on the Signals tab whether the day is good or bad, because a record made only on bad days makes every therapy look effective. Trends, then Therapy Response, then compares your check-ins in the days after each session against your check-ins on days away from any session, and reports how many days the difference held. It refuses to report anything until there are at least three sessions and enough check-ins on both sides to compare, and it never claims a session caused anything. What it gives you is your own numbers, which is the only version of this question that can be answered about you rather than about a study population.',
    citations: [],
    overallTier: 'weak',
    relatedIds: [
      'handson-three-therapies-compared',
      'handson-targeted-versus-general-massage',
      'advocacy-why-it-matters',
    ],
  },
];
