// This Week's Flags: every flag Home's "N flags this week" counted, listed
// one by one, day by day. 2026-09-12, direct report after the row had been
// pointed at Trends' chart: "It mentions on mine that I have 24 flags this
// week... I have no idea what the flags were for the 24 I had previously,
// and when I tap it right now it goes to a flat graph that really tells me
// nothing at all. A graph really doesn't seem to be the right way to go
// here, and if 24 were reported, there should be 24 to see."
//
// So this is a list, not a chart, and it is built from the same function
// Home's count is derived from (getFlaggedItemsByDateRange in lib/db.ts),
// so the number on Home and the rows here cannot disagree. A flag is one
// scored sub-criterion (Sodium, Goitrogenic Load, Additives, ...) that at
// least one food logged that day reached a yellow or red tier on; the same
// sub-criterion tripped by three foods on one day is one flag with three
// foods on it, which is exactly how it has always been counted.
//
// Two sections per day. What counts on Home is "relevant": the flags tied
// to a condition the person tracks, the same scoping every other flag count
// in the app has used since 2026-08-26. What used to be counted before
// that scoping, and still shows up in the scores, is listed underneath as
// "other" so a number that dropped when a condition was added can be seen
// rather than wondered about. With no condition tracked, everything is
// relevant and there is no "other".
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useInfoAlert } from '../components/InfoAlert';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { getFlaggedItemsByDateRange, type DayFlags, type FlaggedSubCriterion } from '../lib/db';
import { getTrackedConditionsWithNames, type TrackedConditionRef } from '../lib/foodPersonalization';
import { getSubCriterionSources, getTierDefinition, tierSeverity } from '../lib/sixDimensionsReference';
import { dateStringOffsetFrom } from '../lib/trendAnalysis';

// The same seven days Home sums: the last six days plus today.
const WEEK_DAYS = 7;

function todayDateString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDay(dateStr: string, today: string): string {
  if (dateStr === today) return 'Today';
  if (dateStr === dateStringOffsetFrom(today, -1)) return 'Yesterday';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function WeekFlagsScreen() {
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [days, setDays] = useState<DayFlags[] | null>(null);
  const [conditions, setConditions] = useState<TrackedConditionRef[]>([]);
  const [error, setError] = useState<string | null>(null);

  const today = todayDateString();
  const start = dateStringOffsetFrom(today, -(WEEK_DAYS - 1));

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const tracked = await getTrackedConditionsWithNames();
          const flags = await getFlaggedItemsByDateRange(
            start,
            today,
            tracked.map((condition) => condition.code),
          );
          if (cancelled) return;
          setConditions(tracked);
          // Newest day first: today is the one most worth acting on.
          setDays([...flags].sort((a, b) => b.date.localeCompare(a.date)));
        } catch (caught) {
          console.error('[WeekFlags] Failed to load', caught);
          if (!cancelled) setError('These flags could not be loaded. Give it another try.');
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [start, today]),
  );

  const relevantTotal = days?.reduce((sum, day) => sum + day.relevant.length, 0) ?? 0;
  const otherTotal = days?.reduce((sum, day) => sum + day.other.length, 0) ?? 0;
  const conditionNameByCode = new Map(conditions.map((condition) => [condition.code, condition.name]));
  const conditionNames = conditions.map((condition) => condition.name);

  function explainFlag(flag: FlaggedSubCriterion) {
    const parts = [
      `Rated "${flag.tier}": ${getTierDefinition(flag.tier)}`,
      `From: ${flag.foods.join(', ')}.`,
      flag.conditionCodes.length > 0
        ? `Relevant to ${flag.conditionCodes.map((code) => conditionNameByCode.get(code) ?? code).join(', ')}.`
        : conditions.length > 0
          ? 'Not tied to a condition you track, so it is listed here but not counted on Home.'
          : '',
      getSubCriterionSources(flag.subCriterion),
    ].filter(Boolean);
    showInfoAlert(flag.subCriterion, parts.join('\n\n'));
  }

  // The badge carries the tier word when it is one ("High Risk", "Use
  // Carefully"); a tier stored as a longer phrase gets the plain severity
  // word instead, with the full text one tap away in the explanation. A
  // badge is a label, not a place for a sentence.
  function badgeLabel(tier: string): string {
    if (tier.length <= 16) return tier;
    return tierSeverity(tier) === 'red' ? 'Caution' : 'Watch';
  }

  function renderFlag(flag: FlaggedSubCriterion, muted: boolean) {
    const severity = tierSeverity(flag.tier);
    const badgeStyle = severity === 'red' ? styles.badgeRed : styles.badgeYellow;
    const badgeText = severity === 'red' ? styles.badgeTextRed : styles.badgeTextYellow;
    return (
      <TouchableOpacity
        key={flag.subCriterion}
        style={[styles.flagRow, muted && styles.flagRowMuted]}
        onPress={() => explainFlag(flag)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`${flag.subCriterion}, ${flag.tier}, from ${flag.foods.join(', ')}. Tap to learn more.`}
      >
        <View style={styles.flagMain}>
          <Text style={styles.flagTitle}>{flag.subCriterion}</Text>
          <Text style={styles.flagFoods}>{flag.foods.join(', ')}</Text>
          {flag.conditionCodes.length > 0 && conditions.length > 1 ? (
            <Text style={styles.flagConditions}>
              {flag.conditionCodes.map((code) => conditionNameByCode.get(code) ?? code).join(', ')}
            </Text>
          ) : null}
        </View>
        <View style={[styles.badge, badgeStyle]}>
          <Text style={[styles.badgeText, badgeText]} numberOfLines={1}>
            {badgeLabel(flag.tier)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "This Week's Flags" }} />
      {infoAlertElement}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {days == null ? '…' : `${relevantTotal} ${relevantTotal === 1 ? 'flag' : 'flags'} this week`}
          </Text>
          <Text style={styles.summaryCaption}>
            {conditions.length > 0
              ? `Flags relevant to ${conditionNames.join(', ')}, ${formatDay(start, today)} through today. Tap any one to see why it was flagged.`
              : `Everything flagged in what you logged, ${formatDay(start, today)} through today. Tap any one to see why it was flagged.`}
          </Text>
          {conditions.length > 0 && otherTotal > 0 ? (
            <Text style={styles.summaryOther}>
              {`${otherTotal} more ${otherTotal === 1 ? 'thing was' : 'things were'} flagged that ${otherTotal === 1 ? 'is' : 'are'} not tied to a condition you track. ${otherTotal === 1 ? 'It is' : 'They are'} listed under each day, not counted on Home.`}
            </Text>
          ) : null}
        </View>

        {error ? (
          <View style={styles.card}>
            <Text style={styles.muted}>{error}</Text>
          </View>
        ) : null}

        {days != null && days.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.muted}>Nothing logged in the last seven days, so there is nothing to flag yet.</Text>
          </View>
        ) : null}

        {days?.map((day) => (
          <View key={day.date} style={styles.card}>
            <Text style={styles.dayHeading}>{formatDay(day.date, today)}</Text>
            {day.relevant.length === 0 && day.other.length === 0 ? (
              <Text style={styles.muted}>Meals logged, nothing flagged.</Text>
            ) : null}
            {day.relevant.length === 0 && day.other.length > 0 ? (
              <Text style={styles.muted}>Nothing flagged for the conditions you track.</Text>
            ) : null}
            {day.relevant.map((flag) => renderFlag(flag, false))}
            {day.other.length > 0 ? (
              <>
                <Text style={styles.otherHeading}>Not tied to a condition you track</Text>
                {day.other.map((flag) => renderFlag(flag, true))}
              </>
            ) : null}
          </View>
        ))}

        <TouchableOpacity
          style={styles.trendLink}
          onPress={() =>
            router.navigate({ pathname: '/trends', params: { openTrendsLens: 'sixDs', openTrendsRange: 'thisWeek' } })
          }
          activeOpacity={0.8}
        >
          <Ionicons name="trending-up-outline" size={16} color={colors.tabTrends} style={textShadow} />
          <Text style={styles.trendLinkText}>See these as a day-by-day line in Trends</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 10 },
  summaryCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.tabTrends,
    backgroundColor: colors.surface,
    gap: 6,
  },
  summaryNumber: { ...typography.sectionTitle, color: colors.tabTrends, fontWeight: '400', ...textShadow },
  summaryCaption: { ...typography.caption, color: colors.textSecondary, lineHeight: 17, ...textShadow },
  summaryOther: { ...typography.caption, color: colors.textMuted, lineHeight: 17, marginTop: 4, ...textShadow },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  dayHeading: { ...typography.bodyEmphasis, color: colors.textPrimary, fontWeight: '400', ...textShadow },
  otherHeading: { ...typography.caption, color: colors.textMuted, marginTop: 6, ...textShadow },
  muted: { ...typography.caption, color: colors.textMuted, ...textShadow },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  flagRowMuted: { opacity: 0.7 },
  flagMain: { flex: 1, gap: 2 },
  flagTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
  flagFoods: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  flagConditions: { ...typography.caption, color: colors.textMuted, ...textShadow },
  // The same statusRedBg/statusYellowBg pairings DimensionFlags.tsx already
  // uses for exactly this concept, contrast checked there.
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, maxWidth: 130 },
  badgeRed: { backgroundColor: colors.statusRedBg, borderColor: colors.danger },
  badgeYellow: { backgroundColor: colors.statusYellowBg, borderColor: colors.statusYellow },
  badgeText: { ...typography.caption, ...textShadow },
  badgeTextRed: { color: colors.danger },
  badgeTextYellow: { color: colors.statusYellowStandalone },
  trendLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.tabTrends,
    backgroundColor: colors.surface,
  },
  trendLinkText: { ...typography.bodyEmphasis, color: colors.tabTrends, fontWeight: '400', ...textShadow },
});
