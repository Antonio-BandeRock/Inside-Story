import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import type { HelpSection } from '../../components/HelpButton';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { TrendLineChart } from '../../components/TrendLineChart';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import { getDietaryReferenceIntakesForCurrentUser } from '../../lib/db';
import { nutrientStatusSeverity, type NutrientStatus } from '../../lib/nutrientAnalysis';
import {
  getCheckinSeverityTrendSeries,
  getNutrientTrendSeries,
  getSixDimensionsFlagTrendSeries,
  type CheckinSeverityPoint,
  type TrendPoint,
} from '../../lib/trendAnalysis';
import { CORE_NUTRIENT_CODES } from './index';

// Every text box on this page belongs to this one page's own tab, so
// there's no per-box lookup needed the way Home's multi-tab dashboard
// needed (see app/(tabs)/index.tsx's own tabColorFor) -- one fixed color,
// used everywhere a box on THIS page needs its border to carry that
// identity. Matches the same rule applied there, 2026-07-27.
const TAB_COLOR = colors.tabTrends;

type TrendsLens = 'nutrients' | 'sixDs' | 'symptoms';

// Shared across all three lenses' own Info content below -- the same
// caveat applies regardless of which chart you're looking at.
const TRENDS_PATTERN_CAVEAT_HELP: HelpSection = {
  heading: 'Finding patterns, not just charts',
  body: "This page charts what you've already logged over time. Actually matching flares to specific foods or timing is a bigger, separate piece of work this app doesn't do yet -- for now, use these charts alongside your own judgment, not as a diagnosis.",
};

const TRENDS_LENSES: LensOption<TrendsLens>[] = [
  {
    key: 'nutrients',
    label: 'Nutrients',
    icon: 'nutrition-outline',
    help: [
      {
        heading: 'Nutrients',
        body: "Pick a nutrient to see its percent-of-target trend across the date range, with a dashed line at 100%. Only days with at least one logged meal are plotted, so days before you started logging don't show up as false zeros.",
      },
      TRENDS_PATTERN_CAVEAT_HELP,
    ],
  },
  {
    key: 'sixDs',
    label: '6 Dimensions',
    icon: 'analytics-outline',
    help: [
      {
        heading: '6 Dimensions',
        body: 'How many 6-DFF flags (goitrogenic, high-risk, etc.) got logged per day, across the date range.',
      },
      TRENDS_PATTERN_CAVEAT_HELP,
    ],
  },
  {
    key: 'symptoms',
    label: 'Symptoms & Flares',
    icon: 'pulse-outline',
    help: [
      {
        heading: 'Symptoms & Flares',
        body: 'Severity of every logged flare and food reaction from Signals, plotted by the date it happened.',
      },
      TRENDS_PATTERN_CAVEAT_HELP,
    ],
  },
];

const DAY_RANGE_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
] as const;

// Same green/yellow/red vocabulary the rest of the app uses for nutrient
// status (see index.tsx's nutrientRingColor (Home)) -- a nutrient's trend line
// should read the same color here as it does on Home/Insights, not a
// second, slightly different color scheme for the same status.
function nutrientStatusColor(status: NutrientStatus | null): string {
  if (status == null) return colors.primary;
  const severity = nutrientStatusSeverity(status);
  if (severity === 'red') return colors.danger;
  if (severity === 'yellow') return colors.statusYellow;
  return colors.primary;
}

function checkinColor(checkinType: CheckinSeverityPoint['checkinType']): string {
  return checkinType === 'flare' ? colors.danger : colors.statusYellow;
}

const TRENDS_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this page shows',
    body: "Nutrient intake, 6 Dimensions flags, and symptom/flare severity charted over a date range you pick, so slow changes that are invisible day-to-day become visible trends. Today's snapshot lives on Insights -- this is the same kind of information, over time instead of just today.",
  },
  {
    heading: 'Nutrients',
    body: "Pick a nutrient to see its percent-of-target trend across the date range, with a dashed line at 100%. Only days with at least one logged meal are plotted, so days before you started logging don't show up as false zeros.",
  },
  {
    heading: '6 Dimensions',
    body: 'How many 6-DFF flags (goitrogenic, high-risk, etc.) got logged per day, across the date range.',
  },
  {
    heading: 'Symptoms & Flares',
    body: 'Severity of every logged flare and food reaction from Signals, plotted by the date it happened.',
  },
  {
    heading: 'Finding patterns, not just charts',
    body: "This page charts what you've already logged over time. Actually matching flares to specific foods or timing is a bigger, separate piece of work this app doesn't do yet -- for now, use these charts alongside your own judgment, not as a diagnosis.",
  },
];

export default function TrendsScreen() {
  useRegisterScreenHelp('Trends', TRENDS_HELP_SECTIONS, '/trends');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const autoOpenLensHub = useAutoOpenLensHubSignal();
  const [lens, setLens] = useState<TrendsLens>('nutrients');
  // Same pattern as app/(tabs)/insights.tsx -- see that file's own comment.
  const [revealed, setRevealed] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      return () => setRevealed(false);
    }, []),
  );
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [selectedNutrient, setSelectedNutrient] = useState<string>(CORE_NUTRIENT_CODES[0]);
  const [nutrientLabels, setNutrientLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [nutrientSeries, setNutrientSeries] = useState<Awaited<ReturnType<typeof getNutrientTrendSeries>> | null>(null);
  const [sixDsSeries, setSixDsSeries] = useState<TrendPoint[] | null>(null);
  const [symptomsSeries, setSymptomsSeries] = useState<CheckinSeverityPoint[] | null>(null);

  // Nutrient display names, fetched once (one profile + one DRI table
  // query -- cheap, unlike the per-day trend loop below) so the nutrient
  // picker's pills have real labels immediately.
  useFocusEffect(
    useCallback(() => {
      getDietaryReferenceIntakesForCurrentUser().then((rows) => {
        const labels: Record<string, string> = {};
        for (const row of rows) {
          if (CORE_NUTRIENT_CODES.includes(row.nutrientCode)) labels[row.nutrientCode] = row.displayName;
        }
        setNutrientLabels(labels);
      });
    }, []),
  );

  // Only the active lens's series is computed -- each of the three lenses'
  // data (especially Nutrients/6 Dimensions, which loop one DB call per
  // day in the range) is real work, so there's no reason to pay for all
  // three every time the range or lens changes.
  const load = useCallback(() => {
    setLoading(true);
    if (lens === 'nutrients') {
      getNutrientTrendSeries(selectedNutrient, days).then((series) => {
        setNutrientSeries(series);
        setLoading(false);
      });
    } else if (lens === 'sixDs') {
      getSixDimensionsFlagTrendSeries(days).then((points) => {
        setSixDsSeries(points);
        setLoading(false);
      });
    } else {
      getCheckinSeverityTrendSeries(['flare', 'post_meal'], days).then((points) => {
        setSymptomsSeries(points);
        setLoading(false);
      });
    }
  }, [lens, days, selectedNutrient]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const activeLensLabel = TRENDS_LENSES.find((option) => option.key === lens)?.label;
  const latestNutrientPoint = nutrientSeries && nutrientSeries.points.length > 0 ? nutrientSeries.points[nutrientSeries.points.length - 1] : null;

  return (
    <View style={styles.screen}>
      {/* enabled={!revealed} -- see food.tsx's own comment: swipe-to-
          change-tab only works from a lens's own picker, not once a real
          lens's content (with its own scrollable controls) is showing. */}
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Trends" variant="trends" revealed={revealed}>
          <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}>
            <Text style={styles.sectionHeading}>{activeLensLabel}</Text>

            <View style={styles.pillRow}>
              {DAY_RANGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.pill, days === option.value && styles.pillActive]}
                  onPress={() => setDays(option.value)}
                >
                  <Text style={[styles.pillText, days === option.value && styles.pillTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {lens === 'nutrients' ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.fullBleedScroll}
                  contentContainerStyle={styles.nutrientPillRow}
                >
                  {CORE_NUTRIENT_CODES.map((code) => (
                    <TouchableOpacity
                      key={code}
                      style={[styles.pill, selectedNutrient === code && styles.pillActive]}
                      onPress={() => setSelectedNutrient(code)}
                    >
                      <Text style={[styles.pillText, selectedNutrient === code && styles.pillTextActive]}>
                        {nutrientLabels[code] ?? code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {loading ? (
                  <Text style={styles.loadingText}>Loading…</Text>
                ) : (
                  <View style={styles.chartCard}>
                    <TrendLineChart
                      points={(nutrientSeries?.points ?? []).map((point) => ({ date: point.date, value: point.value }))}
                      yMin={0}
                      yMax={Math.max(120, ...(nutrientSeries?.points.map((point) => point.value) ?? [120]))}
                      referenceLine={100}
                      lineColor={nutrientStatusColor(nutrientSeries?.latestStatus ?? null)}
                      emptyMessage="Log a few meals on different days to see this nutrient's trend."
                    />
                    {latestNutrientPoint ? (
                      <Text style={styles.caption}>Most recent: {Math.round(latestNutrientPoint.value)}% of target</Text>
                    ) : null}
                  </View>
                )}
              </>
            ) : lens === 'sixDs' ? (
              loading ? (
                <Text style={styles.loadingText}>Loading…</Text>
              ) : (
                <View style={styles.chartCard}>
                  <TrendLineChart
                    points={sixDsSeries ?? []}
                    yMin={0}
                    yMax={Math.max(4, ...(sixDsSeries ?? []).map((point) => point.value))}
                    lineColor={colors.statusFlagged}
                    emptyMessage="Log a few meals on different days to see flagged items trend over time."
                  />
                </View>
              )
            ) : loading ? (
              <Text style={styles.loadingText}>Loading…</Text>
            ) : (
              <View style={styles.chartCard}>
                <TrendLineChart
                  points={(symptomsSeries ?? []).map((point) => ({
                    date: point.date,
                    value: point.severity,
                    color: checkinColor(point.checkinType),
                  }))}
                  yMin={1}
                  yMax={4}
                  emptyMessage="Log a flare or food reaction in Signals to see a severity trend here."
                />
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                    <Text style={styles.legendText}>Flare</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.statusYellow }]} />
                    <Text style={styles.legendText}>Food Reaction</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Trends" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub label="My Trends" tabColor={TAB_COLOR} />
      <LensHub
        pageTitle="Trends"
        options={TRENDS_LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={autoOpenLensHub}
        onSelect={(key) => {
          setLens(key);
          setRevealed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  loadingText: { ...typography.body, color: colors.textSecondary, marginBottom: 16 },

  // sectionHeading/pillRow's own pills sit above chartCard, not inside it
  // (page-level lens name/filters, not "content in a box") -- left neutral
  // for that reason. caption/legendText below ARE rendered inside
  // chartCard, so they follow TAB_COLOR, 2026-07-27.
  sectionHeading: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 10 },
  caption: { ...typography.body, color: TAB_COLOR, marginTop: 8, textAlign: 'center' },
  // Added 2026-07-27: the chart itself used to float with no surrounding
  // box at all, the one page in this family with no "info box" anywhere --
  // wraps it in the same colors.surface/TAB_COLOR-border treatment every
  // other page's boxes use (see TAB_COLOR's own comment above).
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: TAB_COLOR,
    alignItems: 'center',
  },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  // See index.tsx's own fullBleedScroll (Home) comment -- same trick, same reason:
  // cancels `content`'s paddingHorizontal so the scrollable viewport spans
  // the true screen width instead of clipping inside that inset.
  fullBleedScroll: { marginHorizontal: -20 },
  nutrientPillRow: { flexDirection: 'row', gap: 8, marginBottom: 16, paddingHorizontal: 20 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: colors.textPrimary },
  pillTextActive: { color: colors.textOnPrimary },

  legendRow: { flexDirection: 'row', gap: 16, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.caption, color: TAB_COLOR },
});
