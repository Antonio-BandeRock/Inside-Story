import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    heading: 'Nine categories, one evidence standard',
    body: 'Every entry here is tiered Strong/Moderate/Weak by its own actual evidence, the same discipline as this app\'s own 6 Dimensions scoring -- a gold dot means real trial-level support, not just "this app trusts it."',
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

  const LENSES: LensOption<DigestCategoryKey>[] = DIGEST_CATEGORY_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    icon: meta.icon,
    help: [{ heading: meta.label, body: meta.description }],
  }));

  const activeLensLabel = DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.label;
  const entries = getEntriesForCategory(lens);

  // Jumping to a related entry: switch category (if it's a different one),
  // expand that entry, and collapse whatever was open before -- a related
  // chip always lands you looking at exactly that entry, not just its
  // category's list.
  function jumpToRelated(id: string) {
    const target = findDigestEntryById(id);
    if (!target) return;
    setLens(target.category as DigestCategoryKey);
    setExpandedId(id);
  }

  return (
    <View style={styles.screen}>
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Purple Digest" variant="field" revealed={revealed}>
          <ScrollView
            style={styles.body}
            contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}
          >
            <View style={styles.categoryHeaderRow}>
              <PurpleRibbonIcon size={22} color={TAB_COLOR} />
              <Text style={styles.categoryHeaderText}>{activeLensLabel}</Text>
            </View>
            <Text style={styles.categoryDescription}>
              {DIGEST_CATEGORY_META.find((meta) => meta.key === lens)?.description}
            </Text>

            {entries.length === 0 ? (
              <Text style={styles.emptyText}>Nothing here yet.</Text>
            ) : (
              entries.map((entry) => (
                <DigestCard
                  key={entry.id}
                  entry={entry}
                  expanded={expandedId === entry.id}
                  onToggle={() => setExpandedId((current) => (current === entry.id ? null : entry.id))}
                  onJumpToRelated={jumpToRelated}
                />
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
        columns={3}
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

function CitationsBlock({ citations }: { citations: { source: string; pmid?: string }[] }) {
  if (citations.length === 0) return null;
  return (
    <View style={styles.citationsBlock}>
      <Text style={styles.citationsLabel}>Sources</Text>
      {citations.map((citation, index) => (
        <Text key={index} style={styles.citationText}>
          {citation.source}
          {citation.pmid ? ` (PMID ${citation.pmid})` : ''}
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
  categoryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  categoryHeaderText: { ...typography.screenTitle, color: TAB_COLOR },
  categoryDescription: { ...typography.body, color: colors.textSecondary, marginBottom: 16, lineHeight: 19 },
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
  citationText: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic', lineHeight: 15 },
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
