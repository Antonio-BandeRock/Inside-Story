// App Status: every "is this working?" answer in one place (Phase A of the
// 2026-09-24 gap review). The sentences come from lib/appStatus.ts and the
// facts from lib/appStatusDevice.ts; this screen only lays them out.
//
// Reached from Profile > Device & Account > App Status, and from
// Profile > Reminders > "A Reminder Did Not Come", which is the same page,
// since the reminder half is only useful beside what is queued.
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { APP_VERSION } from '../constants/version';
import {
  referenceStatusLine,
  reminderDiagnosis,
  reminderStatusLine,
  syncStatusLine,
  type StatusLine,
} from '../lib/appStatus';
import { readAppStatus, type AppStatusFacts } from '../lib/appStatusDevice';
import { lastCheckLine } from '../lib/backupCheck';
import { REFERENCE_DB_VERSION } from '../lib/referenceDbVersion';
import { referenceDataDate } from '../lib/reportVersion';
import { describeMoment } from '../lib/snapshotSync';

// How many queued reminders are listed. The rest are counted.
const QUEUED_SHOWN = 12;

const TONE_ICON = {
  ok: 'checkmark-circle-outline',
  attention: 'alert-circle-outline',
  info: 'information-circle-outline',
} as const;

function toneColor(tone: StatusLine['tone']): string {
  return tone === 'attention' ? colors.danger : tone === 'ok' ? colors.tabProfile : colors.textSecondary;
}

export default function AppStatusScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const [facts, setFacts] = useState<AppStatusFacts | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    readAppStatus()
      .then((found) => {
        if (!cancelled) setFacts(found);
      })
      .catch((error) => {
        console.error('[app-status] could not read status', error);
        if (!cancelled) setProblem('The status could not be read. Closing and opening this page tries again.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(load);

  const lines: StatusLine[] = facts
    ? [
        { label: 'App version', value: APP_VERSION, tone: 'info' },
        referenceStatusLine(REFERENCE_DB_VERSION, facts.installedReference, referenceDataDate),
        reminderStatusLine(facts.reminders),
        syncStatusLine(facts.sync, describeMoment),
        {
          label: 'Last backup check',
          value: lastCheckLine(
            facts.lastBackupCheck,
            facts.lastBackupCheck ? new Date(facts.lastBackupCheck.checkedAt).toLocaleString() : '',
            facts.lastBackupCheck ? new Date(facts.lastBackupCheck.exportedAt).toLocaleString() : '',
          ),
          tone: facts.lastBackupCheck ? 'ok' : 'attention',
        },
      ]
    : [];

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'App Status' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.card}>
          <Text style={styles.heading}>This device</Text>
          {problem ? <Text style={styles.caption}>{problem}</Text> : null}
          {!facts && !problem ? <Text style={styles.caption}>Reading…</Text> : null}
          {lines.map((line) => (
            <View key={line.label} style={styles.row}>
              <Ionicons name={TONE_ICON[line.tone]} size={18} color={toneColor(line.tone)} style={textShadow} />
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{line.label}</Text>
                <Text style={styles.caption}>{line.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {facts ? (
          <View style={styles.card}>
            <Text style={styles.heading}>If a reminder did not come</Text>
            <Text style={styles.caption}>
              The phone keeps no record of what it showed, so this cannot say why one reminder was missed. These are
              the reasons it could have been, worth checking in this order.
            </Text>
            {reminderDiagnosis(facts.reminders).map((reason) => (
              <View key={reason} style={styles.row}>
                <Ionicons name="ellipse-outline" size={10} color={colors.textSecondary} style={textShadow} />
                <Text style={[styles.caption, styles.rowMain]}>{reason}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {facts && facts.reminders.phone ? (
          <View style={styles.card}>
            <Text style={styles.heading}>Queued right now</Text>
            {facts.queued.length === 0 ? (
              <Text style={styles.caption}>Nothing is queued with the phone.</Text>
            ) : (
              <>
                {facts.queued.slice(0, QUEUED_SHOWN).map((queued, index) => (
                  <View key={`${queued.fireAt.getTime()}-${index}`} style={styles.row}>
                    <Ionicons
                      name={queued.snoozed ? 'alarm-outline' : 'notifications-outline'}
                      size={16}
                      color={colors.tabProfile}
                      style={textShadow}
                    />
                    <View style={styles.rowMain}>
                      <Text style={styles.rowTitle}>{queued.title}</Text>
                      <Text style={styles.caption}>
                        {queued.fireAt.toLocaleString()}
                        {queued.snoozed ? ', snoozed' : ''}
                      </Text>
                    </View>
                  </View>
                ))}
                {facts.queued.length > QUEUED_SHOWN ? (
                  <Text style={styles.caption}>
                    And {facts.queued.length - QUEUED_SHOWN} more after these.
                  </Text>
                ) : null}
              </>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  card: {
    ...homeBandStyle,
    borderColor: colors.tabProfile,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 8,
  },
  heading: { ...typography.sectionTitle, color: colors.tabProfile, fontWeight: '400', ...textShadow },
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
  caption: { ...typography.caption, color: colors.textSecondary, lineHeight: 17, ...textShadow },
});
