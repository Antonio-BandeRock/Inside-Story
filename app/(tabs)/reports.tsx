import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { HelpSection } from '../../components/HelpButton';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import { useInfoAlert } from '../../components/InfoAlert';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { textShadow, typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import { buildReport, renderReportText, type ReportDocument } from '../../lib/reportGenerator';
import { exportReportAsPdf } from '../../lib/reportPdf';

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
    body: "Pulls together everything logged over a date range: nutrient intake, condition score flags, symptoms/flares, active meds and supplements, and your most recent lab results, into one plain, readable summary. Built for handing to a doctor, nutritionist, or trainer, or just for your own records.",
  },
  {
    heading: 'Privacy',
    body: 'This generates entirely on your device, the same as the rest of this app. Nothing is sent anywhere unless you tap Share and choose where it goes yourself.',
  },
  {
    heading: 'Two ways to share',
    body: 'Share as PDF lays the same summary out on a page, with each section as a table or a list, for handing over, printing, or attaching to a message. Share as text sends it as plain words, which pastes into any message or note. Both are built on the phone from the same data.',
  },
  {
    heading: 'What a clinician will see',
    body: 'Each section says where its figures came from: logged meals, check-ins, the phone, or the person. Personal notes and rules sit in a marked box so an observation is never mistaken for a verified finding.',
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
  // Lifted out of MyItemsHub itself, 2026-08-16 -- same reasoning as
  // Food's own identical addition (app/(tabs)/food.tsx): lets LensHub's
  // new "My Reports" top-left tile (see its extraTile prop below) open
  // this SAME popup, at its own already-established position, after
  // closing itself first. The standalone MyItemsHub button further down
  // keeps working exactly as before regardless.
  const [myReportsOpen, setMyReportsOpen] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      return () => setRevealed(false);
    }, []),
  );
  const autoOpenLensHub = useAutoOpenLensHubSignal();
  const activeLensLabel = REPORTS_LENSES.find((option) => option.key === lens)?.label;

  const [days, setDays] = useState<7 | 30 | 90>(30);
  // The document itself is what gets built (2026-09-14); the on-screen
  // text and the PDF are two renderings of it, so what is read here and
  // what is handed over can never differ.
  const [report, setReport] = useState<ReportDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const reportText = report ? renderReportText(report) : null;

  const load = useCallback((forDays: 7 | 30 | 90) => {
    setLoading(true);
    setLoadError(null);
    buildReport(forDays)
      .then((doc) => {
        setReport(doc);
      })
      .catch((error: unknown) => {
        // Found on a phone 2026-09-14: a rejection here left the screen
        // saying "Putting your report together" for good. Say what went
        // wrong instead, and log it where adb logcat can read it.
        console.error('[reports] buildReport failed', error);
        setReport(null);
        setLoadError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { if (revealed) load(days); }, [revealed, days, load]));

  async function handleShareText() {
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

  async function handleSharePdf() {
    if (!report || exporting) return;
    setExporting(true);
    try {
      const result = await exportReportAsPdf(report);
      if (result.status === 'failed') {
        showInfoAlert('PDF not made', result.message);
      } else if (result.status === 'savedOnly') {
        showInfoAlert(
          'PDF saved, sharing not available',
          `This phone offered no share sheet for a file, so the PDF stayed where it was written: ${result.uri}`,
        );
      }
    } finally {
      setExporting(false);
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
            <Text style={[styles.sectionHeading, styles.groupHeadingChip]}>{activeLensLabel}</Text>

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
              <Text style={[styles.loadingText, styles.panelStandalone]}>Putting your report together…</Text>
            ) : loadError ? (
              <Text style={[styles.loadingText, styles.panelStandalone]}>The report could not be built. {loadError}</Text>
            ) : (
              <View style={styles.reportCard}>
                <Text style={styles.reportText}>{reportText}</Text>
              </View>
            )}

            {reportText && !loading ? (
              <>
                <TouchableOpacity style={[styles.shareButton, exporting && styles.shareButtonBusy]} onPress={handleSharePdf} disabled={exporting}>
                  <Text style={styles.shareButtonText}>{exporting ? 'Laying out the PDF…' : 'Share as PDF'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButtonSecondary} onPress={handleShareText}>
                  <Text style={styles.shareButtonSecondaryText}>Share as text</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </ScrollView>
        </GatedTabContent>
      </SwipeableTabScreen>
      {infoAlertElement}

      <PageIdentityLabel title="Reports" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub
        label="My Reports"
        tabColor={TAB_COLOR}
        open={myReportsOpen}
        onOpenChange={setMyReportsOpen}
      />
      <LensHub
        pageTitle="Reports"
        options={REPORTS_LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={autoOpenLensHub}
        extraTile={{ label: 'My Reports', icon: 'bookmarks-outline', onPress: () => setMyReportsOpen(true) }}
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
  // 2026-08-29, standing rule: no text sits directly on a tab's
  // photographic background. panelStandalone is for text with no card
  // to join (an empty state, an error or loading line);
  // groupHeadingChip is for a heading introducing a GROUP of separate
  // cards. A heading that labels ONE card should move inside that
  // card instead of using either.
  panelStandalone: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  groupHeadingChip: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sectionHeading: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 10, ...textShadow },
  loadingText: { ...typography.body, color: colors.textSecondary, marginBottom: 16, ...textShadow },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  pillTextActive: { color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },

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
  reportText: { ...typography.caption, color: colors.textPrimary, lineHeight: 20, ...textShadow },

  shareButton: {
    marginTop: 16,
    backgroundColor: TAB_COLOR,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButtonBusy: { opacity: 0.6 },
  // The text share keeps a filled surface (standing rule: an
  // outline-only control sits its label on the photo).
  shareButtonSecondary: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TAB_COLOR,
  },
  shareButtonSecondaryText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  shareButtonText: { ...typography.body, color: colors.textOnPrimary, fontWeight: '400',

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
});
