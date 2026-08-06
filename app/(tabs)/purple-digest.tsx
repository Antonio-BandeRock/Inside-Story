import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
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

  const LENSES: LensOption<DigestCategoryKey>[] = DIGEST_CATEGORY_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    gridLabel: DIGEST_GRID_LABEL_BREAKS[meta.key],
    icon: meta.icon,
    help: [{ heading: meta.label, body: meta.description }],
  }));

  const activeLensLabel = DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.label;
  const entries = getEntriesForCategory(lens);
  // Whichever entry is expanded sorts to the very front of the list (its
  // relative order among the rest is otherwise unchanged), animated via
  // Animated.View's own layout={LinearTransition} below (same reorder-
  // animation technique as SideBuilder's own NAVIGATION_HAND-aware field
  // reordering) -- "the one chosen should rise to the top so as much as
  // possible can be seen," per explicit request. Collapsing (expandedId
  // back to null) restores the plain, original category order.
  const expandedIndex = expandedId ? entries.findIndex((entry) => entry.id === expandedId) : -1;
  const displayEntries =
    expandedIndex > 0
      ? [entries[expandedIndex], ...entries.slice(0, expandedIndex), ...entries.slice(expandedIndex + 1)]
      : entries;

  // Companion to the reorder above: since the newly-expanded card also
  // moves to the very top of the list, scrolling back to y=0 is what
  // actually brings it into view rather than leaving it sitting off-screen
  // above wherever the list happened to be scrolled to already.
  function scrollToTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function toggleEntry(id: string) {
    const wasExpanded = expandedId === id;
    setExpandedId(wasExpanded ? null : id);
    if (!wasExpanded) scrollToTop();
  }

  // Jumping to a related entry: switch category (if it's a different one),
  // expand that entry (which also carries it to the top of its own
  // category's list -- see displayEntries above), and collapse whatever
  // was open before -- a related chip always lands you looking at exactly
  // that entry, not buried wherever it sorts in its category.
  function jumpToRelated(id: string) {
    const target = findDigestEntryById(id);
    if (!target) return;
    setLens(target.category as DigestCategoryKey);
    setExpandedId(id);
    scrollToTop();
  }

  return (
    <View style={styles.screen}>
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Purple Digest" variant="field" revealed={revealed}>
          <ScrollView
            ref={scrollRef}
            style={styles.body}
            contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}
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

            {displayEntries.length === 0 ? (
              <Text style={styles.emptyText}>Nothing here yet.</Text>
            ) : (
              displayEntries.map((entry) => (
                <Animated.View key={entry.id} layout={LinearTransition}>
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
