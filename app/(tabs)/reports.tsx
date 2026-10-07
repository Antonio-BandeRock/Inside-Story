import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { HelpSection } from '../../components/HelpButton';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import { GardenCsvButtons } from '../../components/GardenCsvButtons';
import { useInfoAlert } from '../../components/InfoAlert';
import { ReportCsvButtons } from '../../components/ReportCsvButtons';
import { ReportHistoryBand } from '../../components/ReportHistoryBand';
import { ReportSectionChooser } from '../../components/ReportSectionChooser';
import { YourStoryMissingLine } from '../../components/YourStoryMissingLine';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub, type MyItemsCategory } from '../../components/MyItemsHub';
import { PopoverSelect } from '../../components/PopoverSelect';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { CalmBands, HOME_BAND_ACCENT_WIDTH } from '../../components/HomeSectionBand';
import { makeTabBandStyles } from '../../components/TabBand';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { textShadow, typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import { buildReport, renderReportText, type ReportDocument } from '../../lib/reportGenerator';
import { againRange, type ReportHistoryEntry, type ReportSentHow } from '../../lib/reportHistory';
import { listReportHistory, recordReportSent } from '../../lib/reportHistoryDb';
import { cleanLeftOut, REPORT_KINDS, type ReportKind, type ReportSectionId } from '../../lib/reportKinds';
import { getReportLeftOut, setReportLeftOut } from '../../lib/reportSectionsDb';
import { exportReportAsPdf, printReport } from '../../lib/reportPdf';
import { confirmItsYou } from '../../lib/freshAuth';
import { markYourStorySeen } from '../../lib/yourStoryDb';
import { describeRange, monthsBefore, sinceVisitStart, type LastVisitForRange } from '../../lib/reportRange';
import { lastVisit } from '../../lib/sinceLastVisit';
import { listAllAppointments } from '../../lib/trendsMoreDb';

const TAB_COLOR = colors.tabReports;
const band = makeTabBandStyles(TAB_COLOR, { calm: true });

// Eight reports since 1.0.52.7: the Overview plus the seven marked Build on
// the inputs-to-outputs map, each a different reader's view over the same
// records. What each one holds is defined in lib/reportKinds.ts; this
// screen only picks one and shows it.
type ReportsLens = ReportKind;

const REPORTS_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this page does',
    body: 'Pulls what was logged over a date range into one plain, readable report. The Overview holds everything; the other reports are each put together for one reader (a doctor, a nutritionist, a trainer, a caregiver) or one subject (a look back over the range, medical costs, the garden), and leave out what that reader does not need.',
  },
  {
    heading: 'Privacy',
    body: 'This generates entirely on your device, the same as the rest of this app. Nothing is sent anywhere unless you tap Share and choose where it goes yourself.',
  },
  {
    heading: 'Four ways to hand it over',
    body: 'Share as PDF lays the same summary out on a page, with each section as a table or a list, for handing over or attaching to a message. Print sends that same page straight to a printer, with no file to share first; on a phone the print options also offer saving it as a PDF. Share as text sends it as plain words, which pastes into any message or note. Save as a Spreadsheet makes CSV files for Excel, Google Sheets or any program that reads them: each table on its own, or the whole report in one file. All four are built on the device from the same data, and Report history keeps each one, a printed copy included.',
  },
  {
    heading: 'Choosing the sections',
    body: 'Open Sections in this report and untick any section this reader does not need to see. An unticked section is not read at all, and the report says how many sections were left out without naming them. Each report remembers its choice; All sections puts everything back.',
  },
  {
    heading: 'Report history',
    body: 'Each report that leaves this device is listed at the bottom of the page: which report, the dates it covered, when and how it went out, who it was for if you add a name, and how many sections it left out. Only those facts are kept, never what the report said. Make it again opens the same report over the same length of time, ending today, with the same sections.',
  },
  {
    heading: 'What a clinician will see',
    body: 'Each section says where its figures came from: logged meals, check-ins, the phone, or the person. Personal notes and rules sit in a marked box so an observation is never mistaken for a verified finding.',
  },
];

const REPORTS_LENSES: LensOption<ReportsLens>[] = REPORT_KINDS.map((def) => ({
  key: def.key,
  label: def.label,
  icon: def.icon as LensOption<ReportsLens>['icon'],
  help: [{ heading: 'What this report holds', body: def.help }, ...REPORTS_HELP_SECTIONS.slice(1)],
}));

const DAY_RANGE_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
] as const;

// K1, 2026-09-29: six months, a year and since the last appointment beside
// the short ranges. Each is a start date through today, worked out in
// lib/reportRange.ts; buildReport still takes a number of days.
const LONG_RANGE_OPTIONS = [
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
] as const;

type DayRange = 7 | 30 | 90 | '6m' | '1y' | 'visit' | 'custom';

// A custom range (2026-09-27) starts on a picked day and runs to today,
// so a report can cover a week, a season or a year. Three years back is
// as far as the picker reaches.
const CUSTOM_YEAR_OPTIONS = Array.from({ length: 3 }, (_, i) => String(new Date().getFullYear() - 2 + i));
const CUSTOM_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const CUSTOM_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function localDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daysAgoString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDateString(date);
}

// Days from the start through today, counting both ends.
function daysThroughToday(start: string): number {
  const [y, m, d] = start.split('-').map(Number);
  const from = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.round((today.getTime() - from.getTime()) / 86400000) + 1);
}

// Moves one part of the date, keeps the day inside its month, and never
// lets the start land after today.
function changeStart(current: string, change: { year?: string; month?: string; day?: string }): string {
  const [y, m, d] = current.split('-').map(Number);
  const year = change.year ? Number(change.year) : y;
  const month = change.month ? Number(change.month) : m;
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(change.day ? Number(change.day) : d, lastDay);
  const next = localDateString(new Date(year, month - 1, day));
  const today = localDateString(new Date());
  return next > today ? today : next;
}

function describeStart(start: string): string {
  const [y, m, d] = start.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

export default function ReportsScreen() {
  useRegisterScreenHelp('Reports', REPORTS_HELP_SECTIONS, '/reports');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [lens, setLens] = useState<ReportsLens>('overview');
  // Same pattern as app/(tabs)/insights.tsx -- see that file's own comment.
  const [revealed, setRevealed] = useState(false);
  // My Reports, 2026-10-07: every report made, counted by which report it
  // was, each row opening that report with its history underneath.
  const [myReports, setMyReports] = useState<MyItemsCategory[] | undefined>(undefined);
  const loadMyReports = useCallback(() => {
    listReportHistory()
      .then((entries) => {
        setMyReports(
          REPORT_KINDS.map((def) => ({ def, count: entries.filter((entry) => entry.kind === def.key).length }))
            .filter(({ count }) => count > 0)
            .map(({ def, count }) => ({
              id: def.key,
              label: def.label,
              count,
              onPress: () => {
                setLens(def.key);
                setRevealed(true);
              },
            })),
        );
      })
      .catch(() => setMyReports([]));
  }, []);
  const [range, setRange] = useState<DayRange>(30);
  const [customStart, setCustomStart] = useState<string>(() => daysAgoString(13));
  // The last appointment that has happened, read on focus so a visit added
  // on Schedules shows here straight away. Null hides the pill.
  const [visit, setVisit] = useState<LastVisitForRange | null>(null);
  const today = localDateString(new Date());
  const presetStart =
    range === '6m' ? monthsBefore(today, 6) : range === '1y' ? monthsBefore(today, 12) : range === 'visit' && visit ? sinceVisitStart(visit) : null;
  const days =
    range === 'custom'
      ? daysThroughToday(customStart)
      : presetStart
        ? daysThroughToday(presetStart)
        : typeof range === 'number'
          ? range
          : 30;
  // Home's Make a Report card names the window it wants (1.0.39.7), the
  // same way Food and Garden already take a lens name. Without it a tap
  // from Home landed on this page’s resting picker, which is one more
  // tap than the card exists to save.
  // Your Story's tour names a report by its key (1.0.52.7), the way it
  // names a Trends or Insights lens.
  const { openReportDays, openReportsLens } = useLocalSearchParams<{ openReportDays?: string; openReportsLens?: string }>();
  // Held here rather than inside MyItemsHub so the screen can open its My
  // menu itself. Since 2026-10-07 the My menu is reached only from its own
  // corner button, no longer from a tile in the LensHub grid.
  const [myReportsOpen, setMyReportsOpen] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const requestedLens = REPORT_KINDS.find((def) => def.key === openReportsLens);
      if (requestedLens) setLens(requestedLens.key);
      if (openReportDays === '7' || openReportDays === '30' || openReportDays === '90') {
        setRange(Number(openReportDays) as 7 | 30 | 90);
      }
      if (requestedLens || openReportDays === '7' || openReportDays === '30' || openReportDays === '90') {
        setRevealed(true);
        return;
      }
      setRevealed(false);
      return () => setRevealed(false);
    }, [openReportDays, openReportsLens]),
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
  const [printing, setPrinting] = useState(false);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const reportText = report ? renderReportText(report) : null;
  // K7, 2026-09-29: each report that leaves the device is kept as one line
  // in Report history, and the line just kept is opened for a name.
  const [historyKey, setHistoryKey] = useState(0);
  const [askForId, setAskForId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // K10, 2026-09-29: the sections this kind of report leaves out, read for
  // each kind before its report is built so the first build already has them.
  const [leftOut, setLeftOut] = useState<ReportSectionId[]>([]);
  const [leftOutFor, setLeftOutFor] = useState<ReportsLens | null>(null);
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getReportLeftOut(lens)
        .catch(() => [] as ReportSectionId[])
        .then((saved) => {
          if (cancelled) return;
          setLeftOut(saved);
          setLeftOutFor(lens);
        });
      return () => {
        cancelled = true;
      };
    }, [lens]),
  );
  const leftOutKey = leftOut.join('|');

  function chooseSections(next: ReportSectionId[]) {
    const clean = cleanLeftOut(lens, next);
    setLeftOut(clean);
    setReportLeftOut(lens, clean).catch((error: unknown) => console.warn('[reports] could not keep the section choice', error));
  }

  function noteSent(how: ReportSentHow) {
    void markYourStorySeen('report');
    if (!report) return;
    recordReportSent({ kind: lens, rangeKey: String(range) as ReportHistoryEntry['rangeKey'], rangeLabel: report.rangeLabel, days: report.days, how, leftOut })
      .then((id) => {
        if (!id) return;
        setAskForId(id);
        setHistoryKey((key) => key + 1);
      })
      .catch((error: unknown) => console.warn('[reports] could not keep the report in history', error));
  }

  function makeAgain(entry: ReportHistoryEntry) {
    const kind = REPORT_KINDS.find((def) => def.key === entry.kind);
    if (kind) {
      // The same sections as that copy, kept as this report's choice.
      const again = cleanLeftOut(kind.key, entry.leftOut);
      setLens(kind.key);
      setLeftOut(again);
      setLeftOutFor(kind.key);
      setReportLeftOut(kind.key, again).catch((error: unknown) => console.warn('[reports] could not keep the section choice', error));
    }
    const again = againRange(entry, localDateString(new Date()));
    if (again.rangeKey === 'custom' && again.customStart) {
      setCustomStart(again.customStart);
      setRange('custom');
    } else if (again.rangeKey === '7' || again.rangeKey === '30' || again.rangeKey === '90') {
      setRange(Number(again.rangeKey) as 7 | 30 | 90);
    } else if (again.rangeKey === 'visit') {
      setRange(visit ? 'visit' : 30);
    } else if (again.rangeKey === '6m' || again.rangeKey === '1y') {
      setRange(again.rangeKey);
    }
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  const load = useCallback((forDays: number, forLens: ReportsLens, forLeftOut: readonly string[]) => {
    setLoading(true);
    setLoadError(null);
    buildReport(forDays, forLens, forLeftOut)
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

  useFocusEffect(
    useCallback(() => {
      if (revealed && leftOutFor === lens) load(days, lens, leftOutKey ? leftOutKey.split('|') : []);
    }, [revealed, days, lens, load, leftOutFor, leftOutKey]),
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listAllAppointments()
        .then((appointments) => {
          if (cancelled) return;
          const last = lastVisit(appointments, localDateString(new Date()));
          setVisit(last ? { date: last.date, title: last.title, providerName: last.providerName } : null);
        })
        .catch((error: unknown) => console.warn('[reports] could not read appointments', error));
      return () => {
        cancelled = true;
      };
    }, []),
  );
  // A visit that was removed takes its pill with it; the report falls back
  // to a month rather than a range nobody can see chosen.
  if (range === 'visit' && !visit) setRange(30);

  async function handleShareText() {
    if (!reportText) return;
    try {
      const outcome = await Share.share({ message: reportText });
      // Your Story's "Make a report" item holds once a report has left the
      // phone. A dismissed sheet is not a share, so it is not counted.
      if (outcome.action !== Share.dismissedAction) noteSent('text');
    } catch {
      // Real share-sheet cancellation/dismissal throws too on some Android
      // versions -- silently ignored the same way this app already treats
      // a cancelled image pick elsewhere (Profile's own custom-background
      // flow), not a real error worth surfacing.
    }
  }

  // K11, 2026-09-29: the PDF's page sent to the print dialog with no share
  // step. A printed copy goes in Report history; a closed dialog does not.
  async function handlePrint() {
    if (!report || printing) return;
    if (!(await confirmItsYou('Before the report is printed'))) return;
    setPrinting(true);
    try {
      const result = await printReport(report);
      if (result.status === 'printed') noteSent('print');
      else if (result.status === 'failed') showInfoAlert('Not printed', result.message);
    } finally {
      setPrinting(false);
    }
  }

  async function handleSharePdf() {
    if (!report || exporting) return;
    if (!(await confirmItsYou('Before the PDF is made'))) return;
    setExporting(true);
    try {
      const result = await exportReportAsPdf(report);
      // A PDF handed to the share sheet, or written where the person can
      // reach it, is a report made; Your Story's report item holds from here.
      if (result.status === 'shared' || result.status === 'savedOnly') noteSent('pdf');
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
        <CalmBands>
        <GatedTabContent pageTitle="Reports" variant="reports" revealed={revealed}>
          <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}>
            <View style={band.heading}>
              <Text style={band.headingText}>{activeLensLabel}</Text>
            </View>

            <View style={[band.inset, styles.pillRow]}>
              {DAY_RANGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.pill, range === option.value && styles.pillActive]}
                  onPress={() => setRange(option.value)}
                >
                  <Text style={[styles.pillText, range === option.value && styles.pillTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
              {LONG_RANGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.pill, range === option.value && styles.pillActive]}
                  onPress={() => setRange(option.value)}
                >
                  <Text style={[styles.pillText, range === option.value && styles.pillTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
              {visit ? (
                <TouchableOpacity style={[styles.pill, range === 'visit' && styles.pillActive]} onPress={() => setRange('visit')}>
                  <Text style={[styles.pillText, range === 'visit' && styles.pillTextActive]}>Since last visit</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={[styles.pill, range === 'custom' && styles.pillActive]} onPress={() => setRange('custom')}>
                <Text style={[styles.pillText, range === 'custom' && styles.pillTextActive]}>Custom</Text>
              </TouchableOpacity>
            </View>

            {presetStart ? (
              <View style={band.box}>
                <Text style={styles.presetCaption}>{describeRange(presetStart, today, range === 'visit' ? visit : null)}</Text>
              </View>
            ) : null}

            {range === 'custom' ? (
              <View style={band.box}>
                <Text style={styles.customLabel}>From</Text>
                <View style={styles.dateRow}>
                  <View style={styles.dateFieldGroup}>
                    <Text style={styles.dateFieldLabel}>Year</Text>
                    <PopoverSelect
                      options={CUSTOM_YEAR_OPTIONS}
                      selected={customStart.split('-')[0]}
                      minWidth={72}
                      tabColor={TAB_COLOR}
                      onSelect={(value) => setCustomStart((current) => changeStart(current, { year: value }))}
                    />
                  </View>
                  <View style={styles.dateFieldGroup}>
                    <Text style={styles.dateFieldLabel}>Month</Text>
                    <PopoverSelect
                      options={CUSTOM_MONTH_OPTIONS}
                      selected={String(Number(customStart.split('-')[1]))}
                      minWidth={52}
                      tabColor={TAB_COLOR}
                      onSelect={(value) => setCustomStart((current) => changeStart(current, { month: value }))}
                    />
                  </View>
                  <View style={styles.dateFieldGroup}>
                    <Text style={styles.dateFieldLabel}>Day</Text>
                    <PopoverSelect
                      options={CUSTOM_DAY_OPTIONS}
                      selected={String(Number(customStart.split('-')[2]))}
                      minWidth={52}
                      tabColor={TAB_COLOR}
                      onSelect={(value) => setCustomStart((current) => changeStart(current, { day: value }))}
                    />
                  </View>
                </View>
                <Text style={styles.customCaption}>
                  {describeStart(customStart)} through today, {days} {days === 1 ? 'day' : 'days'}.
                </Text>
              </View>
            ) : null}

            {/* While meals are logged on fewer than seven days, most sections
                below will say there is nothing in range; this names why and
                where it fits, and disappears once the week is there. */}
            {!loading && !loadError ? <YourStoryMissingLine itemKey="trends" standaloneColor={TAB_COLOR} /> : null}

            {leftOutFor === lens ? (
              <View style={band.box}>
                <ReportSectionChooser kind={lens} leftOut={leftOut} tabColor={TAB_COLOR} onChange={chooseSections} />
              </View>
            ) : null}

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
                <TouchableOpacity style={[styles.shareButtonSecondary, printing && styles.shareButtonBusy]} onPress={handlePrint} disabled={printing}>
                  <Text style={styles.shareButtonSecondaryText}>{printing ? 'Opening the print dialog…' : 'Print'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButtonSecondary} onPress={handleShareText}>
                  <Text style={styles.shareButtonSecondaryText}>Share as text</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* K5, 2026-09-29: the report's tables as spreadsheet files, and
                the whole report as one. I15, 2026-09-28: under the Garden
                report, the garden's whole record as well, whatever the range. */}
            {report && reportText && !loading ? (
              <View style={band.box}>
                <Text style={styles.customLabel}>Save as a Spreadsheet</Text>
                <ReportCsvButtons report={report} onSaved={() => noteSent('csv')} />
                {lens === 'r-garden' ? <GardenCsvButtons caption="The garden's whole record, whatever the range above, one file each for plantings, harvests and what was done." /> : null}
              </View>
            ) : null}

            <ReportHistoryBand tabColor={TAB_COLOR} refreshKey={historyKey} askForId={askForId} onMakeAgain={makeAgain} />
          </ScrollView>
        </GatedTabContent>
        </CalmBands>
      </SwipeableTabScreen>
      {infoAlertElement}

      <PageIdentityLabel title="Reports" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub
        label="My Reports"
        tabColor={TAB_COLOR}
        categories={myReports}
        onOpen={loadMyReports}
        open={myReportsOpen}
        onOpenChange={setMyReportsOpen}
      />
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
  // No side inset, 2026-09-19: the page is a column of edge-to-edge bands
  // (components/TabBand.tsx), spaced by the one standing band gap.
  content: { paddingBottom: 32, gap: HOME_BAND_ACCENT_WIDTH },
  loadingText: { ...typography.body, color: colors.textSecondary, ...textShadow },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  customLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, marginBottom: 8, ...textShadow },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateFieldGroup: { alignItems: 'flex-start' },
  dateFieldLabel: { ...typography.eyebrow, color: colors.textSecondary, marginBottom: 4, ...textShadow },
  presetCaption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  customCaption: { ...typography.caption, color: colors.textSecondary, marginTop: 10, ...textShadow },
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
