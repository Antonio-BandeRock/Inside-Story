// Sync Activity: every time this device and the other one were brought
// together, and what each of them had changed.
//
// Direct instruction, 2026-09-22: "The user should be able to have the
// update on the screen that tells them about each change that was made by
// which device, or to not see them and assume that the system works each
// time, but there is a log for them to view." Profile's Backup & Restore
// card has the switch for the on-screen notice and the row that opens
// this; the log fills either way.
//
// What is on the page is this device's account (sync_change_log never
// travels, see DEVICE_LOCAL_TABLES in lib/snapshotSync.ts), so "your
// phone" and "your computer" always read from where the person is
// standing. The lines come grouped from lib/syncLog.ts: a shopping list
// with eleven items ticked off is one line, not eleven.
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppActionSheet } from '../components/AppActionSheet';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import { useInfoAlert } from '../components/InfoAlert';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { isDesktopApp } from '../lib/desktop/bridge';
import { describeMoment } from '../lib/snapshotSync';
import {
  clearSyncLog,
  describeLogRow,
  readSyncLog,
  SYNC_LOG_KEPT,
  type SyncLogMerge,
  type SyncLogRow,
} from '../lib/syncLog';

/** "Your phone" or "your computer", from where the person is standing. */
function deviceName(row: SyncLogRow, hereIsComputer: boolean): string {
  const here = hereIsComputer ? 'computer' : 'phone';
  return row.deviceKind === here ? 'This ' + here : 'Your ' + row.deviceKind;
}

export default function SyncActivityScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [merges, setMerges] = useState<SyncLogMerge[] | null>(null);
  const [askClear, setAskClear] = useState(false);
  const hereIsComputer = isDesktopApp();

  const load = useCallback(() => {
    let cancelled = false;
    (async () => {
      const found = await readSyncLog();
      if (!cancelled) setMerges(found);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(load);

  const lineCount = merges?.reduce((sum, merge) => sum + merge.rows.length, 0) ?? 0;

  function explain() {
    showInfoAlert(
      'How this is kept',
      'Each time your other device saves, the two copies are brought together record by record, so nothing either ' +
        'device changed is thrown away. This page is what happened each time, as seen from here.\n\n' +
        'One line covers everything of the same kind changed in one go: a shopping list with eleven items ticked ' +
        'off reads as one line, not eleven.\n\n' +
        'Where both devices had changed the same record, the later change stands and the line says so.\n\n' +
        'The last ' + SYNC_LOG_KEPT + ' of these are kept here, on this device only. Nothing on this page is sent anywhere.',
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Sync Activity' }} />
      {infoAlertElement}
      <AppActionSheet
        visible={askClear}
        onClose={() => setAskClear(false)}
        title="Clear this log?"
        message="The record of what was brought together is removed from this device. Nothing you have recorded is touched, and the log starts filling again the next time your two devices come into step."
        actions={[
          {
            label: 'Clear the Log',
            destructive: true,
            onPress: () => {
              // clearSyncLog reports its own problems and never throws.
              void clearSyncLog().then(() => setMerges([]));
            },
          },
        ]}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <TouchableOpacity style={styles.summaryCard} onPress={explain} activeOpacity={0.8} accessibilityRole="button">
          <Text style={styles.summaryNumber}>
            {merges == null
              ? '…'
              : merges.length === 0
                ? 'Nothing brought together yet'
                : merges.length === 1
                  ? '1 time your devices came into step'
                  : merges.length + ' times your devices came into step'}
          </Text>
          <Text style={styles.summaryCaption}>
            {merges == null
              ? 'Reading what has been kept.'
              : merges.length === 0
                ? 'Once your other device saves something while automatic sync is on, what came over shows up here.'
                : lineCount + (lineCount === 1 ? ' change' : ' changes') + ' in all. Tap for how this is kept.'}
          </Text>
        </TouchableOpacity>

        {merges?.map((merge) => (
          <View key={merge.mergedAt} style={styles.card}>
            <Text style={styles.whenHeading}>{describeMoment(merge.mergedAt)}</Text>
            {merge.rows.map((row) => (
              <View key={row.id} style={styles.row}>
                <Ionicons
                  name={row.deviceKind === 'computer' ? 'desktop-outline' : 'phone-portrait-outline'}
                  size={16}
                  color={colors.tabProfile}
                  style={textShadow}
                />
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{describeLogRow(row)}</Text>
                  <Text style={styles.rowCaption}>
                    {deviceName(row, hereIsComputer)}
                    {row.conflict ? ', where both devices had changed the same record and this change was later' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {merges != null && merges.length > 0 ? (
          <TouchableOpacity style={styles.clearButton} onPress={() => setAskClear(true)} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} style={textShadow} />
            <Text style={styles.clearButtonText}>Clear This Log</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  summaryCard: {
    ...homeBandStyle,
    borderColor: colors.tabProfile,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 6,
  },
  summaryNumber: { ...typography.sectionTitle, color: colors.tabProfile, fontWeight: '400', ...textShadow },
  summaryCaption: { ...typography.caption, color: colors.textSecondary, lineHeight: 17, ...textShadow },
  card: {
    ...homeBandStyle,
    borderColor: colors.tabProfile,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 8,
  },
  whenHeading: { ...typography.bodyEmphasis, color: colors.textPrimary, fontWeight: '400', ...textShadow },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
  rowCaption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  clearButton: {
    marginHorizontal: HOME_BAND_CONTENT_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  clearButtonText: { ...typography.bodyEmphasis, color: colors.textMuted, fontWeight: '400', ...textShadow },
});
