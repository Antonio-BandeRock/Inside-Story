// Waiting for an Answer (1.0.60.2): every reminder still showing on the
// phone, grouped by what it is about, each with the same buttons it carries
// on the notification. Direct request, 2026-10-03: "all notifications should
// be grouped together on the phone, sort of as a list, grouped by
// notification type in the app, that the user can then go down the list and
// tap the answer for each different notification and do it very quickly and
// easily."
//
// Opened from the one quiet summary notification that appears once two or
// more reminders wait (refreshWaitingSummary in lib/reminderNotifications.ts).
// Since 1.0.60.3 the same list is the Waiting for an Answer card at the top
// of Home whenever anything waits, and both draw it through
// components/WaitingAnswersList.tsx and hooks/useWaitingReminders.ts.
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP } from '../components/HomeSectionBand';
import { makeTabBandStyles } from '../components/TabBand';
import { WaitingAnswersList } from '../components/WaitingAnswersList';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { useWaitingReminders } from '../hooks/useWaitingReminders';
import { countWaiting } from '../lib/waitingAnswers';

const TAB_COLOR = colors.tabSchedules;
const PHONE = Platform.OS === 'android' || Platform.OS === 'ios';

export default function WaitingAnswersScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const band = useMemo(() => makeTabBandStyles(TAB_COLOR), []);
  const { groups, now, reload } = useWaitingReminders();
  const count = groups ? countWaiting(groups) : 0;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Waiting for an Answer' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]} keyboardShouldPersistTaps="handled">
        <View style={[band.box, styles.summary]}>
          <Text style={styles.summaryTitle}>
            {groups == null
              ? 'Reading what is showing'
              : count === 0
                ? 'Nothing waiting'
                : count === 1
                  ? '1 reminder waiting'
                  : count + ' reminders waiting'}
          </Text>
          <Text style={styles.summaryCaption}>
            {!PHONE
              ? 'Reminders show up on your phone, so this list is there. Open it from Inside Story on your phone.'
              : count === 0
                ? 'Every reminder still showing on your phone appears here, grouped, with the same buttons it has on the notification.'
                : 'Each button does what it does on the notification and takes the reminder off your phone. Tap the words to open where it is kept.'}
          </Text>
        </View>

        {groups != null ? <WaitingAnswersList groups={groups} now={now} reload={reload} tabColor={TAB_COLOR} /> : null}

        {PHONE && groups != null ? (
          <TouchableOpacity style={styles.refresh} onPress={() => void reload()} activeOpacity={0.8} accessibilityRole="button">
            <Ionicons name="refresh-outline" size={16} color={colors.textPrimary} style={textShadow} />
            <Text style={styles.refreshText}>Check Again</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  summary: { gap: 6 },
  summaryTitle: { ...typography.sectionTitle, color: TAB_COLOR, fontWeight: '400', ...textShadow },
  summaryCaption: { ...typography.caption, color: colors.textSecondary, lineHeight: 17, ...textShadow },
  refresh: {
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
  refreshText: { ...typography.bodyEmphasis, color: colors.textPrimary, fontWeight: '400', ...textShadow },
});
