// The expanded body of a Digest entry, and the small pieces it is built
// from (evidence tier colors, reading time, cross-condition pills, sources,
// Related chips, the helpful/not-helpful row). Moved out of
// app/(tabs)/purple-digest.tsx on 2026-09-19, when Conditions moved out of
// the Digest tab and into Life: both screens show the same entry the same
// way, so the rendering lives here once and each screen wraps it in its
// own card or row. Colors that used to be the Digest's own tab color are
// props now, so Life can pass its own. Every dated comment below is the
// original, carried over as written.
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Linking, StyleSheet, Text, TouchableOpacity, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { DigestBarChart } from './DigestChart';
import { EntryPhotoSection } from './EntryPhotoSection';
import { CuratedRecipeShareButton, RECIPE_BUILDER_PARAM, RecipeBuildRow, RecipeDetailCard } from './RecipeDetailCard';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { getCuratedRecipe, saveBuilderFavorite } from '../lib/db';
import { getDigestFeedbackFor, setDigestFeedback, type DigestFeedbackValue } from '../lib/digestFeedback';
import {
  DIGEST_CATEGORY_META,
  findDigestEntryById,
  isProblemFoodEntry,
  type AnyDigestEntry,
  type EvidenceTier,
} from '../lib/digest';
import { resolveActiveConditionCaution, resolveActiveConditionSeverity } from '../lib/digest/conditionGrouping';

export function tierColor(tier: EvidenceTier): string {
  if (tier === 'strong') return colors.accent;
  if (tier === 'moderate') return colors.primary;
  return colors.textMuted;
}

export function tierLabel(tier: EvidenceTier): string {
  if (tier === 'strong') return 'Strong evidence';
  if (tier === 'moderate') return 'Moderate evidence';
  return 'Weak / early evidence';
}

// 2026-08-25, direct correction: "All of the conditions list all 300
// meals saying they can eat all of them. That cannot be." A genuinely
// different color family from tierColor above -- that one measures
// EVIDENCE confidence (strong/moderate/weak), an entirely different axis
// from whether a specific recipe is actually safe for a specific
// condition, and reusing it here would have conflated the two. Reuses
// this app's own already-established, already-contrast-verified
// green/yellow/red safety palette (colors.statusGood/statusYellow/
// danger -- the same one DimensionFlags already uses for the identical
// yellow/red severity concept), not a new one invented for this.
export function severityDotColor(severity: 'green' | 'yellow' | 'red'): string {
  if (severity === 'red') return colors.danger;
  if (severity === 'yellow') return colors.statusYellow;
  return colors.statusGood;
}

export function categoryLabelForEntry(entry: AnyDigestEntry): string {
  return DIGEST_CATEGORY_META.find((meta) => meta.key === entry.category)?.label ?? entry.category;
}

// A rough, honest estimate -- word count over a real, standard average
// silent-reading pace (~200 words/minute), never rounding down to 0 even
// for a genuinely short entry. Computed from the same real body text
// already shown when expanded, not a separate field to author per entry.
export function estimateReadingMinutes(entry: AnyDigestEntry): number {
  const text = isProblemFoodEntry(entry)
    ? `${entry.problem} ${entry.mechanism} ${entry.swaps.join(' ')}`
    : entry.summary;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Which OTHER categories this entry's own Related chips reach into --
// real, already-known data (every relatedId's own category is already
// resolvable via findDigestEntryById), just not previously surfaced as its
// own visible signal. Deliberately distinct categories only, deduplicated
// by label, and never includes this entry's own category (that's not
// "cross" anything). Real, low-cost readback of data this app already has,
// not a new per-entry tag to author across 800+ entries.
export function crossConditionCategories(entry: AnyDigestEntry): { id: string; label: string }[] {
  if (!entry.relatedIds || entry.relatedIds.length === 0) return [];
  const seen = new Set<string>();
  const results: { id: string; label: string }[] = [];
  for (const relatedId of entry.relatedIds) {
    const target = findDigestEntryById(relatedId);
    if (!target || target.category === entry.category) continue;
    const label = categoryLabelForEntry(target);
    if (seen.has(label)) continue;
    seen.add(label);
    results.push({ id: relatedId, label });
  }
  return results;
}
export function RelatedChips({ ids, onJumpToRelated, tabTextColor }: { ids: string[]; onJumpToRelated: (id: string) => void; tabTextColor: string }) {
  const targets = ids.map((id) => findDigestEntryById(id)).filter((entry): entry is AnyDigestEntry => entry != null);
  if (targets.length === 0) return null;
  return (
    <View style={styles.relatedBlock}>
      <Text style={[styles.relatedLabel, { color: tabTextColor }]}>Related</Text>
      <View style={styles.relatedRow}>
        {targets.map((target) => (
          <TouchableOpacity
            key={target.id}
            style={styles.relatedChip}
            onPress={() => onJumpToRelated(target.id)}
          >
            {/* 2026-09-18, direct instruction: a chip used to cut its title
                off at one line, so somebody could not tell whether the thing
                it pointed at was anything they cared about. No line cap now,
                so a long title wraps inside the chip and reads in full. */}
            <Text style={styles.relatedChipText}>
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
export function CitationsBlock({ citations, tabTextColor }: { citations: { source: string; url: string }[]; tabTextColor: string }) {
  if (citations.length === 0) return null;
  return (
    <View style={styles.citationsBlock}>
      <Text style={[styles.citationsLabel, { color: tabTextColor }]}>Sources</Text>
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

// A small, real metadata row shown right at the top of an entry's own
// expanded detail -- 2026-08-08. A reading-time estimate (a plain,
// computed number, not an authored field) plus, when this entry's own
// Related list reaches into a different condition, a plain, non-tappable
// pill naming that condition -- real, already-known data (every relatedId's
// own category was already resolvable), just not previously surfaced as
// its own visible signal at the top of a card. Deliberately NOT tappable --
// RelatedChips below already IS the real, existing tap-to-jump mechanism,
// labeled by the specific related entry's own title; a second, category-
// labeled tap target here would just be a confusing, redundant way to reach
// the same destination.
export function EntryMetaRow({ entry, tabColor, tabTextColor }: { entry: AnyDigestEntry; tabColor: string; tabTextColor: string }) {
  const crossCategories = crossConditionCategories(entry);
  return (
    <View style={styles.metaRow}>
      <Text style={styles.readingTimeText}>{estimateReadingMinutes(entry)} min read</Text>
      {crossCategories.map((category) => (
        <View key={category.id} style={[styles.crossConditionPill, { borderColor: tabColor }]}>
          <Text style={[styles.crossConditionPillText, { color: tabTextColor }]} numberOfLines={1}>
            {category.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Minimal, opt-in bold-text support -- 2026-08-08, one of the real,
// contained wins named in the original knowledge-base-design discussion
// ("bold key takeaways" inline in an article's own prose). Deliberately
// NOT a retrofit of all 840 existing entries (none of them use this
// syntax today, confirmed directly before building this -- a real,
// zero-risk no-op for every entry that already exists) -- this is
// infrastructure a FUTURE entry can opt into by wrapping a phrase in
// `**like this**`, the same familiar markdown convention, without any
// further rendering-layer work needed later. Deliberately minimal: no
// italics, no links, no nested formatting -- just the one, most-requested
// emphasis a plain evidence write-up actually benefits from.
export function renderRichText(text: string, boldStyle: TextStyle) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part.length > 0);
  return parts.map((part, index) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <Text key={index} style={boldStyle}>
        {part.slice(2, -2)}
      </Text>
    ) : (
      part
    ),
  );
}

// A real, local-only thumbs-up/down control -- 2026-08-08, self-contained
// (loads and saves its own one entry's value directly, see lib/
// digestFeedback.ts's own comment for why) rather than threaded as props
// through BasicHealthShelves, already several props deep. Tapping the
// already-active choice again clears it back to no opinion, the same
// toggle shape this app's own PopoverSelect-adjacent controls already use
// elsewhere.
// 2026-08-15, direct request: a thumbs-up doubles as "add to favorites"
// for any entry with something behind it to favorite, which since
// 2026-09-18 means a curated recipe (the My Kitchen half left with the
// lens). Only called on the "just became up" transition (see
// FeedbackRow's handlePress below), so re-tapping an already-up thumb, or
// toggling down then up again, never creates a duplicate favorite.
// Returns false, silently and not as an error, for every entry with
// nothing to favorite, which is most of this Digest's 1,500+ science and
// content entries.
async function tryAddEntryToFavorites(entry: AnyDigestEntry): Promise<boolean> {
  if (isProblemFoodEntry(entry)) return false;

  if (entry.linkedCuratedRecipeId && entry.linkedBuilderType) {
    const recipe = await getCuratedRecipe(entry.linkedCuratedRecipeId);
    if (!recipe) return false;
    await saveBuilderFavorite(entry.linkedBuilderType, {
      name: recipe.name,
      servings: recipe.servings,
      servingSizeAmount: recipe.servingSizeAmount,
      servingSizeUnit: recipe.servingSizeUnit,
      ingredients: recipe.ingredients,
    });
    return true;
  }

  return false;
}

export function FeedbackRow({ entry }: { entry: AnyDigestEntry }) {
  const entryId = entry.id;
  const [value, setValue] = useState<DigestFeedbackValue | null>(null);
  const [justFavorited, setJustFavorited] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getDigestFeedbackFor(entryId).then((loaded) => {
      if (!cancelled) setValue(loaded);
    });
    setJustFavorited(false);
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  const handlePress = (next: DigestFeedbackValue) => {
    const becameUp = next === 'up' && value !== 'up';
    const resolved = value === next ? null : next;
    setValue(resolved);
    setDigestFeedback(entryId, resolved).catch(() => {
      // A failed local write isn't worth surfacing to the person over --
      // worst case, this one tap's own preference doesn't persist; the UI
      // itself already reflects the tap either way.
    });
    if (becameUp) {
      tryAddEntryToFavorites(entry)
        .then((added) => {
          if (added) setJustFavorited(true);
        })
        .catch((error) => console.error('[FeedbackRow] Failed to add to favorites', error));
    }
  };

  return (
    <View>
      <View style={styles.feedbackRow}>
        <Text style={styles.feedbackPrompt}>Was this helpful?</Text>
        <TouchableOpacity
          onPress={() => handlePress('up')}
          accessibilityRole="button"
          accessibilityLabel="Mark this entry helpful"
          hitSlop={8}
        >
          <Ionicons
            name={value === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
            size={18}
            color={value === 'up' ? colors.accent : colors.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handlePress('down')}
          accessibilityRole="button"
          accessibilityLabel="Mark this entry not helpful"
          hitSlop={8}
        >
          <Ionicons
            name={value === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
            size={18}
            color={value === 'down' ? colors.danger : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
      {justFavorited ? <Text style={styles.favoriteAddedText}>Added to your Favorites.</Text> : null}
    </View>
  );
}
// Everything an entry shows once it is open. The caller decides what it
// sits inside (the Digest's bordered card, a Life row) and passes that
// container's style; this renders the content and nothing around it.
// Both branches are exactly what DigestCard rendered before the move.
export function DigestEntryBody({
  entry,
  onJumpToRelated,
  activeConditionCode,
  activeStageCode,
  tabColor,
  tabTextColor,
  style,
}: {
  entry: AnyDigestEntry;
  onJumpToRelated: (id: string) => void;
  activeConditionCode?: string;
  activeStageCode?: string;
  tabColor: string;
  tabTextColor: string;
  style?: StyleProp<ViewStyle>;
}) {
  const router = useRouter();
  const emphasis = { color: tabTextColor };
  const labelStyle = [styles.detailLabel, { color: tabTextColor }];
  if (isProblemFoodEntry(entry)) {
    return (
      <View style={style}>
        <EntryMetaRow entry={entry} tabColor={tabColor} tabTextColor={tabTextColor} />
        <Text style={labelStyle}>The problem</Text>
        <Text style={styles.detailText}>{renderRichText(entry.problem, emphasis)}</Text>
        <Text style={labelStyle}>The mechanism</Text>
        <Text style={styles.detailText}>{renderRichText(entry.mechanism, emphasis)}</Text>
        <Text style={labelStyle}>Swaps</Text>
        {entry.swaps.map((swap, index) => (
          <Text key={index} style={styles.swapText}>
            {'•'} {swap}
          </Text>
        ))}
        {entry.chart ? <DigestBarChart chart={entry.chart} color={colors.accent} /> : null}
        <CitationsBlock citations={entry.citations} tabTextColor={tabTextColor} />
        {entry.relatedIds ? <RelatedChips ids={entry.relatedIds} onJumpToRelated={onJumpToRelated} tabTextColor={tabTextColor} /> : null}
        <FeedbackRow entry={entry} />
      </View>
    );
  }
  return (
    <View style={style}>
      <Text style={[styles.tierLabelText, { color: tierColor(entry.overallTier) }]}>
        {tierLabel(entry.overallTier)}
      </Text>
      <EntryMetaRow entry={entry} tabColor={tabColor} tabTextColor={tabTextColor} />
      <Text style={styles.detailText}>{renderRichText(entry.summary, emphasis)}</Text>
      {entry.linkedCuratedRecipeId && entry.linkedBuilderType ? (
        <RecipeBuildRow
          label="Build This Recipe"
          tabColor={tabColor}
          onPress={() => {
            const paramName = RECIPE_BUILDER_PARAM[entry.linkedBuilderType!];
            router.push({ pathname: '/food', params: { [paramName]: entry.linkedCuratedRecipeId! } });
          }}
        >
          <CuratedRecipeShareButton
            recipeId={entry.linkedCuratedRecipeId}
            builderType={entry.linkedBuilderType}
            tabColor={tabColor}
          />
        </RecipeBuildRow>
      ) : null}
      {entry.recipeCard ? (
        <RecipeDetailCard
          card={entry.recipeCard}
          tabColor={tabColor}
          tabTextColor={tabTextColor}
          activeConditionCaution={resolveActiveConditionCaution(entry, activeConditionCode, activeStageCode)}
          activeConditionSeverity={resolveActiveConditionSeverity(entry, activeConditionCode)}
          activeConditionCode={activeConditionCode}
        />
      ) : null}
      <EntryPhotoSection entry={entry} tabColor={tabColor} />
      {entry.chart ? <DigestBarChart chart={entry.chart} color={tierColor(entry.overallTier)} /> : null}
      <CitationsBlock citations={entry.citations} tabTextColor={tabTextColor} />
      {entry.relatedIds ? <RelatedChips ids={entry.relatedIds} onJumpToRelated={onJumpToRelated} tabTextColor={tabTextColor} /> : null}
      <FeedbackRow entry={entry} />
    </View>
  );
}

// The dot beside an entry's title: the recipe's safety for the condition
// being read when there is one, the evidence tier otherwise. Shared so the
// Digest card and the Life row agree.
export function entryHeaderDotColor(entry: AnyDigestEntry, activeConditionCode?: string): string | null {
  if (isProblemFoodEntry(entry)) return null;
  const activeSeverity = resolveActiveConditionSeverity(entry, activeConditionCode);
  return activeSeverity ? severityDotColor(activeSeverity) : tierColor(entry.overallTier);
}

const styles = StyleSheet.create({
  tierLabelText: { ...typography.eyebrow, marginBottom: 6, ...textShadow },
  // EntryMetaRow's own reading-time text plus, when relevant, the plain,
  // non-tappable cross-condition pills sitting right beside it.
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  readingTimeText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  crossConditionPill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    maxWidth: 160,
  },
  crossConditionPillText: { ...typography.caption, ...textShadow, fontSize: 11 },
  detailLabel: { ...typography.eyebrow, ...textShadow, fontWeight: '400', marginTop: 8, marginBottom: 2 },
  detailText: { ...typography.body, color: colors.textPrimary, lineHeight: 19, ...textShadow },
  swapText: { ...typography.body, color: colors.textPrimary, lineHeight: 19, marginTop: 2, ...textShadow },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  feedbackPrompt: { ...typography.caption, color: colors.textMuted, marginRight: 2, ...textShadow },
  // 2026-08-15 -- the real, brief "thumbs-up doubled as add-to-favorites"
  // confirmation, see FeedbackRow's own comment.
  favoriteAddedText: { ...typography.caption, color: colors.accent, marginTop: 4, ...textShadow },
  citationsBlock: { marginTop: 10 },
  citationsLabel: { ...typography.eyebrow, ...textShadow, fontWeight: '400', marginBottom: 2 },
  citationLink: {
    ...typography.caption,
    color: colors.primary,
    textDecorationLine: 'underline',
    lineHeight: 16,
    marginBottom: 2,
    ...textShadow,
  },
  relatedBlock: { marginTop: 10 },
  relatedLabel: { ...typography.eyebrow, ...textShadow, fontWeight: '400', marginBottom: 4 },
  relatedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relatedChip: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    // 2026-08-08, direct request: "Allow the Related chips... span the
    // entire horizontal space available to it within the bounds
    // controlling it." '100%' caps a chip at its container's width, so one
    // chip alone can use the whole row and several still wrap normally.
    // 2026-09-18: the one-line cap is gone too, so a long title wraps
    // inside the chip instead of being cut off mid-word.
    maxWidth: '100%',
  },
  relatedChipText: { ...typography.captionEmphasis, color: colors.primary, ...textShadow },
});
