import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { AppTextInput } from '../../components/AppTextInput';
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
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import {
  ALL_DIGEST_ENTRIES,
  DIGEST_CATEGORY_META,
  findDigestEntryById,
  getEntriesForCategory,
  isProblemFoodEntry,
  searchDigestEntries,
  type AnyDigestEntry,
  type DigestCategoryKey,
  type EvidenceTier,
} from '../../lib/digest';

// A synthetic lens key, alongside every real category -- 2026-08-08,
// explicitly requested: "a way to search for things the person wants to
// read about in the Digest... draw from the entire list of all the
// available information," the same shape as Insights' own Food Lookup
// searching across every category at once rather than one at a time.
// Deliberately not folded into DigestCategoryKey itself (lib/digest/
// types.ts) -- 'search' isn't a real content category with its own
// entries, it's a tool for finding entries that already live in a real
// category, so it stays a screen-local concern rather than something every
// other consumer of DigestCategoryKey (getEntriesForCategory, etc.) would
// have to account for.
type PurpleDigestLens = DigestCategoryKey | 'search';

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
    body: 'Every entry here is tiered Strong/Moderate/Weak by its own actual evidence, the same discipline as this app\'s own 6 Dimensions scoring. A gold dot means trial-level support, not just "this app trusts it." This tab is meant to keep growing; if the picker below runs past what fits on screen at once, it scrolls.',
  },
  {
    heading: 'Problem Foods & Swaps is different on purpose',
    body: 'Every other category reviews evidence. This one starts from a food, names the problem and mechanism, then gives substitutes, teaching food choices directly rather than reviewing a body of research.',
  },
  {
    heading: 'Related entries',
    body: 'Where a finding connects to another entry, often in a different category, a Related chip jumps straight there.',
  },
];

// Appended to every lens's own Info content below (DIGEST_LENS_HELP) --
// same shared-trailing-section pattern Insights already uses for its own
// DRILLING_DOWN_HELP, rather than repeating this same "how to use this
// screen" explanation inside all 13 lenses' own bespoke text.
const DIGEST_READING_HELP: HelpSection = {
  heading: 'Reading an entry',
  body: 'Tap any card in this category to expand it to its full write-up and citations. Tap it again, or tap a different card, to collapse it and jump to the new one. The colored dot on each card is its own evidence tier, same discipline as the rest of this app. Where a finding connects to another entry, a Related chip jumps straight there.',
};

// The 'search' lens's own Info content -- kept separate from
// DIGEST_LENS_HELP (typed Record<DigestCategoryKey, HelpSection>, so
// 'search' can't be a key there without widening every other consumer of
// that type unnecessarily).
const DIGEST_SEARCH_HELP: HelpSection[] = [
  {
    heading: 'Search All',
    body: 'Searches every entry in this Digest at once, across all categories, not just the one you last had open. Matches a word anywhere it appears: a title, a food name, the full write-up, or a cited source. Tap a result to jump straight to it, wherever it actually lives.',
  },
  DIGEST_READING_HELP,
];

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
  basicHealth: {
    heading: 'Basic Health',
    body: "Everything in this Digest that applies regardless of which condition someone has, or none at all: food additive dose-and-mechanism detail, food-and-swap entries for common everyday reactions (garlic, dairy, nightshades, sugar-sweetened drinks), gut-barrier and microbiome science (SCFAs, zonulin, what actually repairs a leaky gut), verified fermented-food bacterial strains, nutrient interactions (what helps or competes with what), a food-industry history, general lifestyle and environmental exposures, general exercise/autophagy biology, complementary therapies, a full glossary, and general patient-advocacy skills like how to ask a doctor for a fuller lab panel. This is what the Free tier shows in full.",
  },
  hashimotos: {
    heading: "Hashimoto's",
    body: "Every Hashimoto's-specific finding in this Digest, gathered into one real area, the same way each other condition already has its own: thyroid-specific nutrients (selenium, iodine, and newer candidates), labs and medication timing (levothyroxine, biotin interference, TSH's own diurnal rhythm), what to eat at each healing stage, how the disease reaches past the thyroid into other organs, the dated history behind Hashimoto's own diagnosis and treatment, pregnancy-specific guidance, corroborating cross-disease evidence, a Hashimoto's-specific problem-foods list, and Hashimoto's own self-advocacy section: which lab tests to ask for, why, and how often.",
  },
  rheumatoidArthritis: {
    heading: 'Rheumatoid Arthritis',
    body: "This app's second real condition, written as RA's own primary content rather than as evidence borrowed for someone else's disease. Covers the two food levers with the strongest trial evidence (omega-3s at a specific dose threshold, a Mediterranean eating pattern with real disease-activity-score results), a landmark fasting-then-vegetarian trial that only holds up for a real subset of people, and two medication interactions -- methotrexate with folate, and methotrexate with alcohol -- both more precise and more forgiving than the blanket warnings patients often hear. Closes on the real, common overlap between RA and Hashimoto's, the reason this condition was built first.",
  },
  psoriasis: {
    heading: 'Psoriasis',
    body: "This app's third real condition, covering psoriasis and psoriatic arthritis on their own terms. Weight loss and a Mediterranean eating pattern both carry strong trial evidence with real, measured PASI-score improvement; alcohol tracks with worse disease (most clearly in men) and a striking mortality finding regardless of sex; a specific antibody-positive minority sees real, biopsy-confirmed skin improvement from cutting gluten. Also covers two findings honestly reported as unproven rather than smoothed into false confidence -- nightshade avoidance and oral vitamin D supplementation -- plus two serious, specific medication-food interactions (cyclosporine with grapefruit, acitretin with alcohol) worth knowing exactly, not just generally.",
  },
  graves: {
    heading: "Graves' Disease",
    body: "This app's fourth real condition, covering hyperthyroidism's most common cause on its own terms. In several real ways it's the mirror image of this app's own Hashimoto's research: smoking raises Graves' eye-disease risk sharply while it lowers Hashimoto's risk, and iodine is both a real trigger and a real complication for antithyroid drug efficacy rather than simply something to avoid. Selenium carries strong trial evidence for mild eye disease specifically. Built with real self-advocacy content from day one: TRAb/TSI antibody testing's own quantified remission and relapse odds, specific warning signs for antithyroid drug side effects, and the real, measurable bone-density loss untreated hyperthyroidism causes.",
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
// Empty as of the 2026-08-08 restructure -- all 4 real category labels
// (Basic Health, Hashimoto's, Rheumatoid Arthritis, Psoriasis) are short
// enough to fit on one line without a forced break. Kept as a real,
// live mechanism (not deleted) since a future condition with a longer name
// may need it again.
const DIGEST_GRID_LABEL_BREAKS: Partial<Record<DigestCategoryKey, string>> = {};

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
  const autoOpenLensHub = useAutoOpenLensHubSignal();

  const [lens, setLens] = useState<PurpleDigestLens>('basicHealth');
  // The Search All lens's own live query text -- reset whenever the tab
  // loses/regains focus below, same as `revealed`, so returning to Purple
  // Digest never resumes a stale search.
  const [searchQuery, setSearchQuery] = useState('');
  // Same reset-on-focus-change pattern as Insights/Schedule/Food -- arriving
  // or re-arriving at this tab always shows the resting "pick a category"
  // prompt first, never an instant resume of whatever was last open.
  const [revealed, setRevealed] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      setSearchQuery('');
      return () => {
        setRevealed(false);
        setSearchQuery('');
      };
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

  const LENSES: LensOption<PurpleDigestLens>[] = [
    // Placed first, same reasoning Glossary's own front placement already
    // established (see DIGEST_CATEGORY_META's own comment on that entry) --
    // a cross-category tool reached for constantly, not a category read
    // start to finish, belongs at the front of the picker, not appended
    // after every real category.
    {
      key: 'search',
      label: 'Search All',
      icon: 'search-outline',
      help: DIGEST_SEARCH_HELP,
    },
    ...DIGEST_CATEGORY_META.map((meta) => ({
      key: meta.key,
      label: meta.label,
      gridLabel: DIGEST_GRID_LABEL_BREAKS[meta.key],
      icon: meta.icon,
      help: [DIGEST_LENS_HELP[meta.key], DIGEST_READING_HELP],
    })),
  ];

  const activeLensLabel =
    lens === 'search' ? 'Search All' : DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.label;
  // Plain, original category order -- no reordering. See cardOffsets' own
  // comment above for why (a real correction of an earlier "move the
  // expanded card to the front of the list" approach).
  const entries = lens === 'search' ? [] : getEntriesForCategory(lens);
  // Recomputed on every keystroke -- a plain in-memory scan over a few
  // hundred entries (see searchDigestEntries's own comment, lib/digest/
  // index.ts), cheap enough that no debounce is needed for this to feel
  // instant.
  const searchResults = useMemo(() => searchDigestEntries(searchQuery), [searchQuery]);

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
                {lens === 'search'
                  ? `Search across all ${ALL_DIGEST_ENTRIES.length} entries in this Digest at once, not just one category.`
                  : DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.description}
              </Text>
            </View>

            {lens === 'search' ? (
              <>
                <AppTextInput
                  style={styles.searchInput}
                  placeholder="Search titles, findings, mechanisms, sources..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.trim().length === 0 ? (
                  <Text style={styles.emptyText}>
                    Type a word or phrase to search every category at once -- a mechanism, a food, an
                    author&apos;s name, anything this Digest actually says somewhere.
                  </Text>
                ) : searchResults.length === 0 ? (
                  <Text style={styles.emptyText}>No matches for &ldquo;{searchQuery.trim()}&rdquo;.</Text>
                ) : (
                  <>
                    <Text style={styles.searchResultCount}>
                      {searchResults.length} match{searchResults.length === 1 ? '' : 'es'}
                    </Text>
                    {searchResults.map((entry) => (
                      <SearchResultCard key={entry.id} entry={entry} onPress={() => jumpToRelated(entry.id)} />
                    ))}
                  </>
                )}
              </>
            ) : entries.length === 0 ? (
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
        autoOpenSignal={autoOpenLensHub}
        onSelect={(key) => {
          setLens(key);
          setExpandedId(null);
          setRevealed(true);
        }}
      />
    </View>
  );
}

function categoryLabelForEntry(entry: AnyDigestEntry): string {
  return DIGEST_CATEGORY_META.find((meta) => meta.key === entry.category)?.label ?? entry.category;
}

// A compact, unexpandable result row for the Search All lens -- tapping it
// reuses jumpToRelated (the same mechanism a Related chip already uses),
// so it lands you at the real card, in its real category, expanded and
// scrolled into view, rather than trying to render the full entry a second
// time inside the search results themselves.
function SearchResultCard({ entry, onPress }: { entry: AnyDigestEntry; onPress: () => void }) {
  const title = isProblemFoodEntry(entry) ? entry.foodName : entry.title;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeaderRow}>
        {!isProblemFoodEntry(entry) ? (
          <View style={[styles.tierDot, { backgroundColor: tierColor(entry.overallTier) }]} />
        ) : null}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.searchResultCategory}>{categoryLabelForEntry(entry)}</Text>
      <Text style={styles.cardTeaser}>{entry.teaser}</Text>
    </TouchableOpacity>
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
  searchInput: {
    ...typography.body,
    borderWidth: 1,
    borderColor: TAB_COLOR,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  searchResultCount: { ...typography.eyebrow, color: colors.textMuted, marginBottom: 8 },
  searchResultCategory: { ...typography.caption, color: TAB_COLOR, marginBottom: 4 },
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
