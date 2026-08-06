import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { DigestBarChart } from '../../components/DigestChart';
import { GatedTabContent } from '../../components/GatedTabContent';
import type { HelpSection } from '../../components/HelpButton';
import { LensHub, type LensOption } from '../../components/LensHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { PurpleRibbonIcon } from '../../components/PurpleRibbonIcon';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { typography } from '../../constants/typography';
import {
  DIGEST_CATEGORY_META,
  findDigestEntryById,
  getEntriesForCategory,
  isProblemFoodEntry,
  type AnyDigestEntry,
  type DigestCategoryKey,
  type EvidenceTier,
} from '../../lib/digest';

// The minimal shape scrollEntryIntoView actually needs from a card ref or
// the ScrollView ref -- both `Animated.View` (via Reanimated's own ref
// forwarding) and `ScrollView` expose a real `.measure()` imperative
// method (the same primitive React Native itself is built on for "where is
// this view really, right now" queries), so a narrow structural type here
// avoids needing an exact, brittle component type for either.
type Measurable = {
  measure: (
    callback: (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => void,
  ) => void;
};

// Promoted 2026-08-05 from a Stack-push placeholder (formerly
// app/purple-digest.tsx, now deleted -- see that file's own former header
// comment for the naming history) to a real tab: "a real location for the
// aggregator to exist full time," per the request that prompted this.
// Follows the exact same shape as every other lens-driven tab (see
// insights.tsx/schedule.tsx) -- SwipeableTabScreen -> GatedTabContent,
// gated on `revealed`, with LensHub choosing among real options rather
// than a single scrollable page.
//
// Content lives in lib/digest/ (one file per category + this screen's own
// consumer of the aggregator) -- see that folder's own types.ts for the
// two content shapes (DigestEntry vs. ProblemFoodEntry) and why they're
// kept separate rather than one shared schema with optional fields.
//
// No dedicated background artwork exists for this tab yet (unlike
// Insights/Schedule/Trends/Bio-Compass/Reports, each with their own
// commissioned image) -- variant="field" falls back to the same shared
// wildflower scene every tab rests on before its own art is picked, same
// as Home's own background. Worth commissioning real Purple Digest art
// later; not a blocker for shipping real content.
const TAB_COLOR = colors.tabPurpleDigest;

const DIGEST_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'A growing set of categories, one evidence standard',
    body: 'Every entry here is tiered Strong/Moderate/Weak by its own actual evidence, the same discipline as this app\'s own 6 Dimensions scoring -- a gold dot means real trial-level support, not just "this app trusts it." This tab is meant to keep growing -- if the picker below runs past what fits on screen at once, it scrolls.',
  },
  {
    heading: 'Problem Foods & Swaps is different on purpose',
    body: 'Every other category reviews evidence. This one starts from a food, names the real problem and mechanism, then gives real substitutes -- teaching food choices directly rather than reviewing a body of research.',
  },
  {
    heading: 'Related entries',
    body: 'Where a finding connects to another entry -- often in a different category -- a Related chip jumps straight there.',
  },
];

// Appended to every lens's own Info content below (DIGEST_LENS_HELP) --
// same shared-trailing-section pattern Insights already uses for its own
// DRILLING_DOWN_HELP, rather than repeating this same "how to use this
// screen" explanation inside all 13 lenses' own bespoke text.
const DIGEST_READING_HELP: HelpSection = {
  heading: 'Reading an entry',
  body: 'Tap any card in this category to expand it to its full write-up and real citations -- tap it again, or tap a different card, to collapse it and jump to the new one. The colored dot on each card is its own evidence tier, same discipline as the rest of this app. Where a finding connects to another entry, a Related chip jumps straight there.',
};

// One real, bespoke explanation per lens for the LensHub Info tile --
// 2026-08-07, explicitly requested: "Write the information about each
// digest lens for the information icon to display about it explaining
// that lens, as we have been doing on each of the other lenshub menus."
// Previously every lens's own `help` just reused DIGEST_CATEGORY_META's
// own one-line `description` (already shown as this screen's own category
// subtitle, see categoryDescription below) -- fine as a picker-tile
// caption, too thin to stand alone as a real explanation the way Insights'
// own lens help write-ups already do (see e.g. that file's own "Reading
// the table"/"Food Lookup" sections). `description` itself is untouched --
// still used for the on-screen subtitle -- this is genuinely additional
// content, not a replacement for it.
const DIGEST_LENS_HELP: Record<DigestCategoryKey, HelpSection> = {
  glossary: {
    heading: 'Glossary',
    body: "Every acronym and term this Digest actually uses -- TSH, zonulin, deiodinase, Treg, SCFA, and dozens more -- defined plainly in three parts: what it really is, what it does in the body, and how it connects to Hashimoto's specifically. Built to be looked something up in, not read start to finish -- each entry stays short on purpose, and a Related chip jumps straight to the deeper, full-length entry elsewhere in this Digest where that term actually does its real work.",
  },
  foodAdditives: {
    heading: 'Food Additives',
    body: "Real dose-and-mechanism detail on the additives people actually ask about -- carboxymethylcellulose and polysorbate 80's own gut-mucus research, sodium nitrite's real thyroid-transport mechanism, potassium bromate's tumor data, the 2025 Red Dye 3 ban. Most entries here are genuine concerns, but one (xanthan and guar gum) is included specifically because the evidence says it's fine, so this list doesn't read as uniformly alarmist.",
  },
  problemFoods: {
    heading: 'Problem Foods & Swaps',
    body: "The one category built differently from the rest: instead of reviewing a body of research, each entry starts from a real food -- garlic, raw cruciferous vegetables, kelp, charred meat -- names the actual mechanism behind why it can be a problem, and gives real, concrete swaps rather than just \"eat less of it.\"",
  },
  gutMicrobiome: {
    heading: 'Gut & Microbiome',
    body: "The mechanisms this app's own gut-healing mission keeps coming back to: short-chain fatty acids and real regulatory-T-cell induction, the gliadin-to-zonulin permeability pathway, and what real trials have actually shown does or doesn't repair a leaky gut. Includes an honest correction of L-glutamine, probably the most commonly recommended \"leaky gut\" supplement -- a systematic review of 10 trials found it doesn't move the needle.",
  },
  fermentedFoods: {
    heading: 'Fermented Foods',
    body: "Real, independently verified bacterial strains -- the ones already in this app's own two home-yogurt recipes, plus kvass, kefir, and sauerkraut's own strain research -- with real dosing science (roughly how many CFU a home ferment can reach) and where to source a verified single-strain starter, not just a general \"fermented food is good for you.\"",
  },
  nutrients: {
    heading: 'Nutrients & Micronutrients',
    body: "Selenium, iodine, vitamin D, zinc, and a few genuinely newer candidates like Nigella sativa (black seed) -- each tiered honestly by its own real trial evidence, including places where that evidence is more mixed than it's usually presented, like selenium's own Cochrane-review caveat and vitamin D's inconsistent placebo-controlled results.",
  },
  labsMedication: {
    heading: 'Labs & Medication Timing',
    body: "What actually interferes with a thyroid lab result or a levothyroxine dose -- biotin's real lab-assay interference, the classic calcium-and-iron absorption block, TSH's own daily rhythm and how a fasting-versus-fed blood draw can change the number. Each entry ends on the real, practical fix, usually just spacing something by an hour, not a lifelong restriction.",
  },
  lifestyleEnvironment: {
    heading: 'Lifestyle & Environment',
    body: "Everything that affects the thyroid beyond what's on the plate: the same real alcohol, coffee, and juice advisories already surfaced in this app's own Food builders, plus sleep, chronic stress, smoking's own genuinely counterintuitive Hashimoto's-versus-Graves' split, and real environmental exposures like air pollution and endocrine-disrupting plastics.",
  },
  mitochondriaMetabolism: {
    heading: 'Mitochondria & Metabolism',
    body: "Real cellular-level mechanisms -- autophagy, visceral fat as an active inflammatory organ rather than just stored energy, exercise's own real effect on inflammation. Includes two genuine tensions stated plainly rather than resolved: fasting is the most potent known autophagy trigger but also suppresses active thyroid hormone, and visceral fat may partly be the body's own defense against a leaky gut rather than simply harmful.",
  },
  otherAutoimmune: {
    heading: 'Other Autoimmune Diseases',
    body: "Real corroborating research from rheumatoid arthritis, inflammatory bowel disease, multiple sclerosis, type 1 diabetes, lupus, Sjogren's, and psoriasis -- every entry labeled with exactly which disease it actually studied, since none of it is Hashimoto's-specific data. Included because the same gut-barrier and immune mechanisms keep showing up across all of them: real corroborating weight for a hypothesis, not proof of one.",
  },
  healingStages: {
    heading: 'Healing Stages',
    body: "What to actually eat at each stage of a Hashimoto's healing journey -- a reasoned first-foods list for day one, a real reintroduction order and timeline, and real milestones to look for before moving on, cross-mapping the five-stage clinical framework onto three practical tiers: Getting Started, Rebuilding, and Well-Healed. Every specific week-or-month figure here traces back to an actual cited study.",
  },
  organSystems: {
    heading: 'Organs & Body Systems',
    body: "How Hashimoto's reaches past the thyroid itself. The liver gets sustained coverage here -- it does the largest share of T4-to-T3 conversion, and can show real, reversible enzyme changes from hypothyroidism alone -- alongside the heart, brain, kidneys, adrenal glands, joints, and skin, each covered in both directions: how the disease affects that system, and how treating that system can help the thyroid picture back.",
  },
  history: {
    heading: 'History & Milestones',
    body: "From Hashimoto's own 1912 discovery, through the 1924 iodized-salt program and 1956's finding that this is an autoimmune disease at all, to 1985's identification of TPO (the actual antigen this app's own tracking is built around) and today's still-early genetic research -- the real, dated turning points behind almost everything else in this app.",
  },
  nutrientInteractions: {
    heading: 'Nutrient Interactions',
    body: "Which nutrients help each other absorb -- vitamin C and iron, turmeric and black pepper -- and which ones compete, like calcium and iron, zinc and copper, and selenium and iodine's own more complicated relationship. Each entry ends on a real, practical food-level move, like soaking or fermenting to cut the phytates that block mineral absorption in the first place.",
  },
  foodIndustryHistory: {
    heading: 'Food Industry & History',
    body: "A correlational history of food itself over roughly 150 years, laid out era by era against real autoimmune and digestive-disease trends over the same span -- plus soil-nutrient decline, the pesticide dispute, and four real cases of a whole food (salt, butter, sugar's own reputation, eggs) taking public blame while an industrial substitute got the pass. Closes with a clearly labeled personal opinion, written to be argued with, not just accepted.",
  },
  bigPicture: {
    heading: 'The Big Picture',
    body: "A short, continuous narrative -- one illustrative day, following the same imagined person from her morning dose through dinner -- that touches all 14 other categories in a single read, rather than reviewing each one in isolation. Every fact woven into the story is real and still cited or linked back to its own full entry elsewhere in this Digest; only the day itself is a storytelling device, not a real logged person's data. A good place to see how this whole research base actually connects, at any point, not just after everything else.",
  },
  selfAdvocacy: {
    heading: 'Self Advocacy',
    body: "Which lab tests are actually worth asking for with Hashimoto's -- the full thyroid panel (not just TSH), antibodies, ferritin, vitamin D, B12, magnesium, zinc and copper together, a CBC and CMP, lipids, and situational tests like sex hormones and cortisol -- each with the real reason it matters and an honest, non-excessive sense of how often retesting it actually adds new information. Includes two real corrections to how these tests often get pitched (reverse T3's genuinely unsettled evidence, and perimenopause usually being a clinical rather than lab diagnosis), plus a practical closing entry on how to actually ask a doctor for any of this.",
  },
  pregnancyFamilyPlanning: {
    heading: 'Pregnancy & Family Planning',
    body: "What actually changes about managing Hashimoto's around pregnancy, beyond the miscarriage-risk research already covered in Organs & Body Systems: a real, lower TSH target once pregnancy starts or is being planned, postpartum thyroiditis as its own distinct condition (real data showing over half of cases still have persistent hypothyroidism a year later, not the temporary blip it's often assumed to be), a genuinely reassuring answer on breastfeeding and levothyroxine safety, and why iodine's already-established two-edged nature carries real, higher stakes during pregnancy specifically.",
  },
};

// A deliberate line-break point for each category name that's long enough
// to wrap at 2 columns (see LensHub's own itemLabelLines), so the grid
// item's own auto-wrap never has to guess where to break -- 2026-08-07,
// explicitly requested: "Make sure the names of the icons have a forced
// carriage return at a logical spot." Every entry here breaks after a
// natural phrase boundary (usually right after an "&") so both halves
// still read as coherent pieces on their own, rather than wherever plain
// word-wrap happens to land. Short names that already fit comfortably on
// one line (Food Additives, Gut & Microbiome, Fermented Foods, Healing
// Stages) are deliberately left out -- forcing an unnecessary break on a
// name that already fits would just leave the second line looking sparse.
// Only affects the grid tile's own label (LensOption.gridLabel) -- the
// plain, unbroken `label` is still what's used everywhere else this name
// appears (the Info sheet's own heading, activeLensLabel, etc.).
const DIGEST_GRID_LABEL_BREAKS: Partial<Record<DigestCategoryKey, string>> = {
  problemFoods: 'Problem Foods\n& Swaps',
  nutrients: 'Nutrients &\nMicronutrients',
  labsMedication: 'Labs &\nMedication Timing',
  lifestyleEnvironment: 'Lifestyle &\nEnvironment',
  mitochondriaMetabolism: 'Mitochondria &\nMetabolism',
  otherAutoimmune: 'Other Autoimmune\nDiseases',
  organSystems: 'Organs &\nBody Systems',
  history: 'History &\nMilestones',
  nutrientInteractions: 'Nutrient\nInteractions',
  foodIndustryHistory: 'Food Industry &\nHistory',
  pregnancyFamilyPlanning: 'Pregnancy &\nFamily Planning',
};

function tierColor(tier: EvidenceTier): string {
  if (tier === 'strong') return colors.accent;
  if (tier === 'moderate') return colors.primary;
  return colors.textMuted;
}

function tierLabel(tier: EvidenceTier): string {
  if (tier === 'strong') return 'Strong evidence';
  if (tier === 'moderate') return 'Moderate evidence';
  return 'Weak / early evidence';
}

export default function PurpleDigestScreen() {
  useRegisterScreenHelp('Purple Digest', DIGEST_HELP_SECTIONS, '/purple-digest');
  const scrollBottomPadding = useFloatingButtonScrollPadding();

  const [lens, setLens] = useState<DigestCategoryKey>('foodAdditives');
  // Same reset-on-focus-change pattern as Insights/Schedule/Food -- arriving
  // or re-arriving at this tab always shows the resting "pick a category"
  // prompt first, never an instant resume of whatever was last open.
  const [revealed, setRevealed] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      return () => setRevealed(false);
    }, []),
  );

  // Which single entry (by id) is currently expanded to its full detail,
  // within whichever category is showing -- at most one open at a time,
  // same "tap again to collapse" accordion shape as Insights' own SixDsView.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // A real ref to each rendered card, keyed by entry id -- 2026-08-07,
  // replacing the earlier onLayout-tracked "cached offset" approach
  // entirely, per direct, explicit correction: "You seem to be trying to
  // judge their approximate location and approximate destination at the
  // time instead of just assigning something to be the mechanism... place
  // the header of this box 10 pixels from the bottom of the header of the
  // app." That's exactly right, and it's what this now does: rather than
  // trusting a Y offset computed and cached at some earlier moment (which
  // onLayout only updates asynchronously, after the fact, and which three
  // separate real bugs turned out to trace back to), scrollEntryIntoView
  // below asks each card's own real, current position directly, at the
  // exact instant it's needed -- the same thing a web page's own anchor-
  // link navigation does under the hood (query the element's real
  // position, then scroll there), not a pre-computed guess.
  const cardRefs = useRef<Record<string, Measurable | null>>({});
  // The ScrollView's own current, live scroll position -- kept live via
  // onScroll, needed for two real reasons: converting the viewport-
  // relative measurement below into an absolute scroll target, and
  // stopping any in-flight scroll momentum before issuing a new
  // programmatic scroll (see scrollEntryIntoView's own comment). Plain
  // ref, not state, so onScroll firing repeatedly during a manual drag
  // doesn't itself force a re-render.
  const currentScrollY = useRef(0);

  const LENSES: LensOption<DigestCategoryKey>[] = DIGEST_CATEGORY_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    gridLabel: DIGEST_GRID_LABEL_BREAKS[meta.key],
    icon: meta.icon,
    help: [DIGEST_LENS_HELP[meta.key], DIGEST_READING_HELP],
  }));

  const activeLensLabel = DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.label;
  // Plain, original category order -- no reordering. See cardOffsets' own
  // comment above for why (a real correction of an earlier "move the
  // expanded card to the front of the list" approach).
  const entries = getEntriesForCategory(lens);

  // How far above a scrolled-to card's own top edge to stop -- 2026-08-07,
  // set to the exact figure given directly: "The header of the one I
  // tapped should be at the top of the screen under the app's own header
  // section by about 10 pixels." (Previously 12, and briefly gated behind
  // a skip-if-already-close threshold -- both reverted; see below.)
  const ENTRY_SCROLL_TOP_MARGIN = 10;

  // How long the card list's own LinearTransition (below, on each card's
  // Animated.View) takes to finish sliding every card into its real, final
  // position after an expand/collapse -- pinned to an explicit number here
  // (LinearTransition.duration(CARD_LAYOUT_TRANSITION_MS) below) rather
  // than left at Reanimated's own implicit default, specifically so
  // scrollEntryIntoView has a real, known number to wait out instead of
  // guessing at one.
  const CARD_LAYOUT_TRANSITION_MS = 300;
  // A little slack on top of the animation's own real duration -- covers
  // ordinary JS-thread/bridge scheduling delay, not because the animation
  // itself is expected to run long.
  const CARD_LAYOUT_SETTLE_BUFFER_MS = 60;

  // Scrolls the ScrollView so the named card's own top edge lands exactly
  // ENTRY_SCROLL_TOP_MARGIN below the top of the visible screen -- on
  // EVERY tap, unconditionally, regardless of where the card already sits.
  //
  // 2026-08-07, rebuilt around real, live measurement rather than a cached
  // offset, per explicit correction: "You seem to be trying to judge their
  // approximate location and approximate destination at the time instead
  // of just assigning something to be the mechanism for each box... place
  // the header of this box 10 pixels from the bottom of the header of the
  // app." `.measure()` (a real, standard React Native primitive, available
  // on both the target card's own ref and the ScrollView's own ref)
  // reports each one's own real, current on-screen (`pageY`) position,
  // queried fresh at the exact instant this function runs. The math:
  // `pageY - scrollPageY` is how far below the ScrollView's own visible
  // top edge the card currently sits; adding that to the ScrollView's own
  // current absolute scroll position gives the real absolute target.
  //
  // 2026-08-07, a real, later report: "some of the time" the box still
  // doesn't land under the header -- found by actually reasoning through
  // what "some of the time" implied, not by guessing again. Live
  // measurement was already correct in principle, but this function only
  // waited one real animation frame (~16ms) before measuring -- nowhere
  // near enough time for the LinearTransition animation collapsing
  // whatever card was previously open to actually finish (its own real,
  // now-explicit duration is CARD_LAYOUT_TRANSITION_MS above). Measuring
  // that early caught the target card still mid-slide, not yet at its real
  // final position -- exactly a "some of the time" bug, since it only ever
  // showed up when a DIFFERENT card had to collapse first (tapping the
  // very first card of a session, with nothing else open to collapse, has
  // nothing to wait for and was never actually broken). Fixed by waiting
  // the animation's own known duration (plus a small buffer) before
  // measuring at all, every time -- not a guess at "probably long enough,"
  // the literal real number the same LinearTransition call below is
  // configured to actually take. The one remaining frame of deferral below
  // is unrelated: it's still needed first, just to confirm the target
  // card's own ref exists at all yet (jumpToRelated can switch to a
  // category whose cards haven't mounted for the first time), retried a
  // few more frames if not -- once it exists, the real animation-settle
  // wait begins.
  //
  // The momentum-halt step (an immediate, unanimated scroll to the current
  // position before the real animated scroll) is kept from the previous
  // fix for the same reason as before: Android can otherwise blend a new
  // programmatic scroll with any still-running fling from a recent manual
  // drag, producing an inconsistent final position even when the target
  // itself was computed correctly.
  function scrollEntryIntoView(id: string, attemptsLeft = 5) {
    requestAnimationFrame(() => {
      const cardNode = cardRefs.current[id];
      const scrollNode = scrollRef.current;
      if (!cardNode || !scrollNode) {
        if (attemptsLeft > 0) scrollEntryIntoView(id, attemptsLeft - 1);
        return;
      }
      setTimeout(() => {
        cardNode.measure((_cx, _cy, _cw, _ch, _cardPageX, cardPageY) => {
          (scrollNode as unknown as Measurable).measure((_sx, _sy, _sw, _sh, _scrollPageX, scrollPageY) => {
            const target = currentScrollY.current + (cardPageY - scrollPageY) - ENTRY_SCROLL_TOP_MARGIN;
            scrollNode.scrollTo({ y: currentScrollY.current, animated: false });
            scrollNode.scrollTo({ y: Math.max(target, 0), animated: true });
          });
        });
      }, CARD_LAYOUT_TRANSITION_MS + CARD_LAYOUT_SETTLE_BUFFER_MS);
    });
  }

  function toggleEntry(id: string) {
    const wasExpanded = expandedId === id;
    setExpandedId(wasExpanded ? null : id);
    if (!wasExpanded) scrollEntryIntoView(id);
  }

  // Jumping to a related entry: switch category (if it's a different one),
  // expand that entry, and collapse whatever was open before -- a related
  // chip always lands you looking at exactly that entry, scrolled to the
  // top of the screen, at wherever it actually sits in its own category's
  // real (unreordered) list.
  function jumpToRelated(id: string) {
    const target = findDigestEntryById(id);
    if (!target) return;
    setLens(target.category as DigestCategoryKey);
    setExpandedId(id);
    scrollEntryIntoView(id);
  }

  return (
    <View style={styles.screen}>
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Purple Digest" variant="field" revealed={revealed}>
          <ScrollView
            ref={scrollRef}
            style={styles.body}
            contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}
            onScroll={(event) => {
              currentScrollY.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          >
            {/* Wrapped in an opaque card, not sitting bare on the shared
                flower background -- reported as unreadable that way. Every
                other tab's own top-of-content text either already sits on a
                card (Insights/Schedule) or opts into textShadow when it
                truly has to render straight over the photo (Home's
                greeting) -- a card is the better fit here, since this
                header block is real page-identity content, not a one-line
                caption over open sky. */}
            <View style={styles.headerCard}>
              <View style={styles.categoryHeaderRow}>
                <PurpleRibbonIcon size={22} color={TAB_COLOR} />
                <Text style={styles.categoryHeaderText}>{activeLensLabel}</Text>
              </View>
              <Text style={styles.categoryDescription}>
                {DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.description}
              </Text>
            </View>

            {entries.length === 0 ? (
              <Text style={styles.emptyText}>Nothing here yet.</Text>
            ) : (
              entries.map((entry) => (
                <Animated.View
                  key={entry.id}
                  // Explicit duration, not Reanimated's own implicit
                  // default -- CARD_LAYOUT_TRANSITION_MS above (see
                  // scrollEntryIntoView's own comment) has to wait out this
                  // exact real number, not a guess at what the default
                  // might be.
                  layout={LinearTransition.duration(CARD_LAYOUT_TRANSITION_MS)}
                  // A real ref to this card, not a cached measurement --
                  // scrollEntryIntoView calls .measure() on it directly, at
                  // the moment it's needed, rather than trusting a value
                  // recorded earlier. Reanimated's Animated.View forwards
                  // refs to the underlying native view, so this exposes the
                  // same real .measure() every plain View has.
                  ref={(r) => {
                    cardRefs.current[entry.id] = r as unknown as Measurable | null;
                  }}
                >
                  <DigestCard
                    entry={entry}
                    expanded={expandedId === entry.id}
                    onToggle={() => toggleEntry(entry.id)}
                    onJumpToRelated={jumpToRelated}
                  />
                </Animated.View>
              ))
            )}
          </ScrollView>
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Purple Digest" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <LensHub
        pageTitle="Purple Digest"
        // Corner trigger button reads just "Digest", 2026-08-07, explicitly
        // requested -- same buttonLabel-vs-pageTitle split Food's own corner
        // button already uses (that one says "Food" while its popup header
        // stays "Nutrition Builders"). pageTitle itself is untouched: it
        // still has to match TAB_ROUTES' own title exactly (constants/
        // tabs.ts) for the TAB_ROUTES lookup above (icon/color resolution)
        // to keep working, and it still drives the popup's own header text.
        buttonLabel="Digest"
        options={LENSES}
        selected={revealed ? lens : undefined}
        columns={2}
        // 2 columns, not the original 3 -- switched 2026-08-07 alongside
        // itemLabelLines below, explicitly requested: "we need to make the
        // names of the digest lenses be on two rows so they can be read, or
        // we need shorter names for them." Real category names here
        // ("Mitochondria & Metabolism", "Other Autoimmune Diseases") are
        // meaningfully longer than any other page's lens labels, and even
        // wrapped to 2 lines, 3 columns' own ~95px-wide column was still
        // too narrow for several of them not to need a 3rd line. 2 columns
        // (~142px wide) comfortably fits every real category name at 2
        // lines without shortening any of them.
        itemLabelLines={2}
        // Explicit `true`, same day, immediate follow-up: switching to 2
        // columns above defaulted Info back to its usual floating
        // bottom-right corner (LensHub's own `infoInGrid` default is
        // `columns !== 2`) -- reported directly as "gets in the way being
        // on top of the rest" once Purple Digest's own grid grew tall
        // enough to scroll (the floating-corner trick assumes that corner
        // is always blank, which stops being true the moment real content
        // scrolls underneath it). Forcing this true keeps Info as a real
        // grid tile -- right after the last category, filling the empty
        // half of the final row -- regardless of the 2-column layout.
        infoInGrid={true}
        // Same real custom mark used everywhere else this tab is
        // represented (Home's own shortcut button, TabHub's own grid) --
        // without this, LensHub falls back to TAB_ROUTES' plain Ionicons
        // "ribbon" glyph, which reads as a race/award rosette rather than
        // an awareness ribbon (see PurpleRibbonIcon.tsx's own history).
        // TabHub already special-cases this same path; LensHub has no such
        // per-route special-casing of its own, so it needs this override
        // explicitly.
        renderIcon={(size) => <PurpleRibbonIcon size={size} color={TAB_COLOR} />}
        onSelect={(key) => {
          setLens(key);
          setExpandedId(null);
          setRevealed(true);
        }}
      />
    </View>
  );
}

function RelatedChips({ ids, onJumpToRelated }: { ids: string[]; onJumpToRelated: (id: string) => void }) {
  const targets = ids.map((id) => findDigestEntryById(id)).filter((entry): entry is AnyDigestEntry => entry != null);
  if (targets.length === 0) return null;
  return (
    <View style={styles.relatedBlock}>
      <Text style={styles.relatedLabel}>Related</Text>
      <View style={styles.relatedRow}>
        {targets.map((target) => (
          <TouchableOpacity
            key={target.id}
            style={styles.relatedChip}
            onPress={() => onJumpToRelated(target.id)}
          >
            <Text style={styles.relatedChipText} numberOfLines={1}>
              {isProblemFoodEntry(target) ? target.foodName : target.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Each citation's own source text IS the tappable link (opens the real,
// verified page in the device's own browser) -- a real hyperlink-style
// reference list, not the URL-as-plain-text pattern linkifyText uses
// elsewhere in this app (Insights' own getSubCriterionSources): that
// pattern fits inline prose with an occasional embedded link; a references
// section reads better with the citation's own name as the link text.
// 2026-08-06: `url` is real and required now, not optional -- "the
// references... need to also be linked to the webpage where the
// information is derived, not just cited," per explicit request.
function CitationsBlock({ citations }: { citations: { source: string; url: string }[] }) {
  if (citations.length === 0) return null;
  return (
    <View style={styles.citationsBlock}>
      <Text style={styles.citationsLabel}>Sources</Text>
      {citations.map((citation, index) => (
        <Text
          key={index}
          style={styles.citationLink}
          onPress={() => Linking.openURL(citation.url)}
        >
          {citation.source}
        </Text>
      ))}
    </View>
  );
}

function DigestCard({
  entry,
  expanded,
  onToggle,
  onJumpToRelated,
}: {
  entry: AnyDigestEntry;
  expanded: boolean;
  onToggle: () => void;
  onJumpToRelated: (id: string) => void;
}) {
  if (isProblemFoodEntry(entry)) {
    return (
      <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{entry.foodName}</Text>
        </View>
        <Text style={styles.cardTeaser}>{entry.teaser}</Text>
        {expanded ? (
          <View style={styles.cardDetail}>
            <Text style={styles.detailLabel}>The problem</Text>
            <Text style={styles.detailText}>{entry.problem}</Text>
            <Text style={styles.detailLabel}>The mechanism</Text>
            <Text style={styles.detailText}>{entry.mechanism}</Text>
            <Text style={styles.detailLabel}>Real swaps</Text>
            {entry.swaps.map((swap, index) => (
              <Text key={index} style={styles.swapText}>
                {'•'} {swap}
              </Text>
            ))}
            {entry.chart ? <DigestBarChart chart={entry.chart} color={colors.accent} /> : null}
            {entry.stageNote ? <Text style={styles.stageNoteText}>{entry.stageNote}</Text> : null}
            <CitationsBlock citations={entry.citations} />
            {entry.relatedIds ? <RelatedChips ids={entry.relatedIds} onJumpToRelated={onJumpToRelated} /> : null}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.85}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.tierDot, { backgroundColor: tierColor(entry.overallTier) }]} />
        <Text style={styles.cardTitle}>{entry.title}</Text>
      </View>
      <Text style={styles.cardTeaser}>{entry.teaser}</Text>
      {expanded ? (
        <View style={styles.cardDetail}>
          <Text style={[styles.tierLabelText, { color: tierColor(entry.overallTier) }]}>
            {tierLabel(entry.overallTier)}
          </Text>
          <Text style={styles.detailText}>{entry.summary}</Text>
          {entry.chart ? <DigestBarChart chart={entry.chart} color={tierColor(entry.overallTier)} /> : null}
          {entry.stageNote ? <Text style={styles.stageNoteText}>{entry.stageNote}</Text> : null}
          <CitationsBlock citations={entry.citations} />
          {entry.relatedIds ? <RelatedChips ids={entry.relatedIds} onJumpToRelated={onJumpToRelated} /> : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32 },
  // An opaque card, same surface every DigestCard below already sits on --
  // fixes this header text being unreadable directly over the shared
  // flower background (see the JSX's own comment above this style's use).
  headerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: TAB_COLOR,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  categoryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  categoryHeaderText: { ...typography.screenTitle, color: TAB_COLOR },
  categoryDescription: { ...typography.body, color: colors.textSecondary, lineHeight: 19 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  card: {
    borderWidth: 2,
    borderColor: TAB_COLOR,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  cardTitle: { ...typography.label, color: TAB_COLOR, flex: 1 },
  cardTeaser: { ...typography.caption, color: colors.textSecondary, lineHeight: 17 },
  cardDetail: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  tierLabelText: { ...typography.eyebrow, marginBottom: 6 },
  detailLabel: { ...typography.eyebrow, color: TAB_COLOR, marginTop: 8, marginBottom: 2 },
  detailText: { ...typography.body, color: colors.textPrimary, lineHeight: 19 },
  swapText: { ...typography.body, color: colors.textPrimary, lineHeight: 19, marginTop: 2 },
  stageNoteText: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic', marginTop: 8 },
  citationsBlock: { marginTop: 10 },
  citationsLabel: { ...typography.eyebrow, color: TAB_COLOR, marginBottom: 2 },
  citationLink: {
    ...typography.caption,
    color: colors.primary,
    textDecorationLine: 'underline',
    lineHeight: 16,
    marginBottom: 2,
  },
  relatedBlock: { marginTop: 10 },
  relatedLabel: { ...typography.eyebrow, color: TAB_COLOR, marginBottom: 4 },
  relatedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relatedChip: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    maxWidth: 220,
  },
  relatedChipText: { ...typography.captionEmphasis, color: colors.primary },
});
