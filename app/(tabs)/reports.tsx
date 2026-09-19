import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { HelpSection } from '../../components/HelpButton';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import { useInfoAlert } from '../../components/InfoAlert';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { HOME_BAND_GAP } from '../../components/HomeSectionBand';
import { makeTabBandStyles } from '../../components/TabBand';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { textShadow, typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import { buildReport, renderReportText, type ReportDocument } from '../../lib/reportGenerator';
import { exportReportAsPdf } from '../../lib/reportPdf';

const TAB_COLOR = colors.tabReports;
const band = makeTabBandStyles(TAB_COLOR);

// One real lens -- a report is one document, not several different views
// the way Trends' own five lenses genuinely are. Kept as a real LensOption
// array anyway (rather than skipping LensHub entirely) so the corner
// button/Info tile still behave the same, consistent way every other tab
// already does.
type ReportsLens = 'overview';

const REPORTS_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this page does',
    body: "Pulls together everything logged over a date range: nutrient intake, condition score flags, symptoms/flares, active meds and supplements, and your most recent lab results, into one plain, readable summary. Built for handing to a doctor, nutritionist, or trainer, or just for your records.",
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
  const [days, setDays] = useState<7 | 30 | 90>(30);
  // Home's Make a Report card names the window it wants (1.0.39.7), the
  // same way Food and Garden already take a lens name. Without it a tap
  // from Home landed on this page’s resting picker, which is one more
  // tap than the card exists to save.
  const { openReportDays } = useLocalSearchParams<{ openReportDays?: string }>();
  // Lifted out of MyItemsHub itself, 2026-08-16 -- same reasoning as
  // Food's own identical addition (app/(tabs)/food.tsx): lets LensHub's
  // new "My Reports" top-left tile (see its extraTile prop below) open
  // this SAME popup, at its own already-established position, after
  // closing itself first. The standalone MyItemsHub button further down
  // keeps working exactly as before regardless.
  const [myReportsOpen, setMyReportsOpen] = useState(false);
  useFocusEffect(
    useCallback(() => {
      if (openReportDays === '7' || openReportDays === '30' || openReportDays === '90') {
        setDays(Number(openReportDays) as 7 | 30 | 90);
        setRevealed(true);
        return;
      }
      setRevealed(false);
      return () => setRevealed(false);
    }, [openReportDays]),
  );
  const autoOpenLensHub = useAutoOpenLensHubSignal();
  const activeLensLabel = REPORTS_LENSES.find((option) => option.key === lens)?.label;

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
            <View style={band.heading}>
              <Text style={band.headingText}>{activeLensLabel}</Text>
            </View>

            <View style={[band.inset, styles.pillRow]}>
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
              <View style={band.boxMuted}><Text style={styles.loadingText}>Putting your report together…</Text></View>
            ) : loadError ? (
              <View style={band.boxMuted}><Text style={styles.loadingText}>The report could not be built. {loadError}</Text></View>
            ) : (
              <View style={band.box}>
                <Text style={styles.reportText}>{reportText}</Text>
              </View>
            )}

            {reportText && !loading ? (
              <View style={[band.inset, styles.shareRow]}>
                <TouchableOpacity style={[styles.shareButton, exporting && styles.shareButtonBusy]} onPress={handleSharePdf} disabled={exporting}>
                  <Text style={styles.shareButtonText}>{exporting ? 'Laying out the PDF…' : 'Share as PDF'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButtonSecondary} onPress={handleShareText}>
                  <Text style={styles.shareButtonSecondaryText}>Share as text</Text>
                </TouchableOpacity>
              </View>
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
  // No side inset, 2026-09-19: the page is a column of edge-to-edge bands
  // (components/TabBand.tsx), spaced by the one standing band gap.
  content: { paddingBottom: 32, gap: HOME_BAND_GAP },
  loadingText: { ...typography.body, color: colors.textSecondary, ...textShadow },

  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  pillTextActive: { color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },

  // A real, deliberate monospace-adjacent choice -- this text is meant to
  // be read as a plain document (and shared verbatim via Share below), not
  // styled UI copy, so it keeps its own line breaks and alignment exactly
  // as generateReport built them.
  reportText: { ...typography.caption, color: colors.textPrimary, lineHeight: 20, ...textShadow },

  shareRow: { gap: 10 },
  shareButton: {
    backgroundColor: TAB_COLOR,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButtonBusy: { opacity: 0.6 },
  // The text share keeps a filled surface (standing rule: an
  // outline-only control sits its label on the photo).
  shareButtonSecondary: {
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
