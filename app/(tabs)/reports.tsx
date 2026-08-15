import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { HelpSection } from '../../components/HelpButton';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import { generateReport } from '../../lib/reportGenerator';

const TAB_COLOR = colors.tabReports;

// One real lens -- a report is one document, not several different views
// the way Trends' own five lenses genuinely are. Kept as a real LensOption
// array anyway (rather than skipping LensHub entirely) so the corner
// button/Info tile still behave the same, consistent way every other tab
// already does.
type ReportsLens = 'overview';

const REPORTS_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this page does',
    body: "Pulls together everything logged over a date range: nutrient intake, 6 Dimensions flags, symptoms/flares, active meds and supplements, and your most recent lab results, into one plain, readable summary. Built for handing to a doctor, nutritionist, or trainer, or just for your own records.",
  },
  {
    heading: 'Privacy',
    body: 'This generates entirely on your device, the same as the rest of this app. Nothing is sent anywhere unless you tap Share and choose where it goes yourself.',
  },
  {
    heading: 'A real, honest limit',
    body: "This is a plain-text summary you can share through your phone's own share sheet, a real, working v1. A nicer, laid-out PDF is a separate piece of work, not built yet.",
  },
];

const REPORTS_LENSES: LensOption<ReportsLens>[] = [
  { key: 'overview', label: 'Overview', icon: 'document-text-outline', help: REPORTS_HELP_SECTIONS },
];

const DAY_RANGE_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
] as const;

export default function ReportsScreen() {
  useRegisterScreenHelp('Reports', REPORTS_HELP_SECTIONS, '/reports');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [lens, setLens] = useState<ReportsLens>('overview');
  // Same pattern as app/(tabs)/insights.tsx -- see that file's own comment.
  const [revealed, setRevealed] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      return () => setRevealed(false);
    }, []),
  );
  const autoOpenLensHub = useAutoOpenLensHubSignal();
  const activeLensLabel = REPORTS_LENSES.find((option) => option.key === lens)?.label;

  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [reportText, setReportText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback((forDays: 7 | 30 | 90) => {
    setLoading(true);
    generateReport(forDays).then((text) => {
      setReportText(text);
      setLoading(false);
    });
  }, []);

  useFocusEffect(useCallback(() => { if (revealed) load(days); }, [revealed, days, load]));

  async function handleShare() {
    if (!reportText) return;
    try {
      await Share.share({ message: reportText });
    } catch {
      // Real share-sheet cancellation/dismissal throws too on some Android
      // versions -- silently ignored the same way this app already treats
      // a cancelled image pick elsewhere (Profile's own custom-background
      // flow), not a real error worth surfacing.
    }
  }

  return (
    <View style={styles.screen}>
      {/* enabled={!revealed} -- see food.tsx's own comment: swipe-to-
          change-tab only works from a lens's own picker, not once a real
          lens's content (with its own scrollable controls) is showing. */}
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Reports" variant="reports" revealed={revealed}>
          <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}>
            <Text style={styles.sectionHeading}>{activeLensLabel}</Text>

            <View style={styles.pillRow}>
              {DAY_RANGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.pill, days === option.value && styles.pillActive]}
                  onPress={() => {
                    setDays(option.value);
                    load(option.value);
                  }}
                >
                  <Text style={[styles.pillText, days === option.value && styles.pillTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {loading ? (
              <Text style={styles.loadingText}>Putting your report together…</Text>
            ) : (
              <View style={styles.reportCard}>
                <Text style={styles.reportText}>{reportText}</Text>
              </View>
            )}

            {reportText && !loading ? (
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Reports" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub label="My Reports" tabColor={TAB_COLOR} />
      <LensHub
        pageTitle="Reports"
        options={REPORTS_LENSES}
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
  sectionHeading: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 10 },
  loadingText: { ...typography.body, color: colors.textSecondary, marginBottom: 16 },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: colors.textPrimary },
  pillTextActive: { color: colors.textOnPrimary },

  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: TAB_COLOR,
  },
  // A real, deliberate monospace-adjacent choice -- this text is meant to
  // be read as a plain document (and shared verbatim via Share below), not
  // styled UI copy, so it keeps its own line breaks and alignment exactly
  // as generateReport built them.
  reportText: { ...typography.caption, color: colors.textPrimary, lineHeight: 20 },

  shareButton: {
    marginTop: 16,
    backgroundColor: TAB_COLOR,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButtonText: { ...typography.body, color: colors.textOnPrimary, fontWeight: '600' },
});
