import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DigestEntryBody, entryHeaderDotColor } from './DigestEntryDetail';
import { HOME_BAND_GAP } from './HomeSectionBand';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { isProblemFoodEntry, type AnyDigestEntry } from '../lib/digest';

// One Digest entry as a row: closed, its title and teaser; open, everything
// the Digest card used to show, through the same DigestEntryBody. Written
// for Conditions on the Life tab (2026-09-19) and shared with the Digest's
// own categories the same day, when Basic Health, Earth Matters, Home
// Gardening and Search All moved onto the same fold bands, so the two
// cannot drift apart. The styles for the levels around a row (the topic
// fold, its subgroup headings, the divider between rows) live here too,
// for the same reason.

export type DigestRowStyles = ReturnType<typeof makeDigestRowStyles>;

export function DigestEntryRow({
  entry,
  groupLabel,
  activeConditionCode,
  activeStageCode,
  expanded,
  onToggle,
  onJumpToRelated,
  tabColor,
  styles,
  below,
}: {
  entry: AnyDigestEntry;
  // Where it belongs, shown only in search results, where the rows no
  // longer sit under a band that says so.
  groupLabel?: string;
  activeConditionCode?: string;
  activeStageCode?: string;
  expanded: boolean;
  onToggle: () => void;
  onJumpToRelated: (id: string) => void;
  tabColor: string;
  styles: DigestRowStyles;
  // Anything the caller wants under the teaser while the row is closed or
  // open, such as which search terms matched.
  below?: ReactNode;
}) {
  const dotColor = entryHeaderDotColor(entry, activeConditionCode);
  return (
    <View style={styles.itemRow}>
      <TouchableOpacity style={styles.itemTapArea} onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.itemTextWrap}>
          {groupLabel ? <Text style={styles.itemGroupLabel}>{groupLabel}</Text> : null}
          <View style={styles.itemTitleRow}>
            {dotColor ? <View style={[styles.tierDot, { backgroundColor: dotColor }]} /> : null}
            <Text style={styles.itemTitle}>{isProblemFoodEntry(entry) ? entry.foodName : entry.title}</Text>
          </View>
          <Text style={styles.itemSubtitle}>{entry.teaser}</Text>
          {below ?? null}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {expanded ? (
        <DigestEntryBody
          entry={entry}
          onJumpToRelated={onJumpToRelated}
          activeConditionCode={activeConditionCode}
          activeStageCode={activeStageCode}
          tabColor={tabColor}
          tabTextColor={tabColor}
          style={styles.itemDetail}
        />
      ) : null}
    </View>
  );
}

export function makeDigestRowStyles(tabColor: string) {
  return StyleSheet.create({
    // One topic, the level between a band and its rows: an inset box, the
    // same shape as a row, holding the rows once open.
    topicFold: {
      borderRadius: 10,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 12,
    },
    topicTapArea: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    topicTitle: { ...typography.bodyEmphasis, color: tabColor, ...textShadow, flex: 1, marginRight: 12 },
    topicBody: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: HOME_BAND_GAP,
      paddingBottom: 12,
    },
    subgroupHeading: { ...typography.eyebrow, color: tabColor, ...textShadow, marginBottom: HOME_BAND_GAP },
    subgroupHeadingLater: { marginTop: HOME_BAND_GAP },
    tyingTogetherHeading: { marginTop: 12 },
    rowDivider: { height: 1, backgroundColor: colors.border, marginVertical: (HOME_BAND_GAP - 1) / 2 },
    // A row sits inside the topic's muted box, so it takes the plain
    // surface to read as one step further in.
    itemRow: { borderRadius: 10, backgroundColor: colors.surface, paddingHorizontal: 12 },
    itemTapArea: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    itemTextWrap: { flex: 1, marginRight: 12 },
    itemGroupLabel: { ...typography.eyebrow, color: tabColor, ...textShadow, marginBottom: 2 },
    itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tierDot: { width: 10, height: 10, borderRadius: 5 },
    itemTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow, flex: 1 },
    itemSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2, ...textShadow },
    itemDetail: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 10,
      paddingBottom: 12,
    },
  });
}
