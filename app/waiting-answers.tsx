// Waiting for an Answer (1.0.60.2): every reminder still showing on the
// phone, grouped by what it is about, each with the same buttons it carries
// on the notification. Direct request, 2026-10-03: "all notifications should
// be grouped together on the phone, sort of as a list, grouped by
// notification type in the app, that the user can then go down the list and
// tap the answer for each different notification and do it very quickly and
// easily."
//
// Opened from the one quiet summary notification that appears once two or
// more reminders wait (refreshWaitingSummary in lib/reminderNotifications.ts),
// and from Profile > Reminders. A press here is the same press as on the
// notification: the same record is written, the notification leaves the
// phone, and so does every other copy of it (a follow-up, a snooze). The two
// buttons that take words open a box here instead of on the notification.
// Tapping a reminder's words opens the place it lives, as a tap on the
// notification does.
//
// Nothing here is kept: the list is read from the phone each time the
// screen is shown, so what the phone has taken away is gone from here too.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP } from '../components/HomeSectionBand';
import { makeTabBandStyles } from '../components/TabBand';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { ACTION_TEXT_INPUT, reminderActionTitle, type ReminderActionId } from '../lib/reminderActions';
import { answerFromList, listWaitingReminders, openWaitingReminder, refreshWaitingSummary } from '../lib/reminderNotifications';
import { SNOOZE_MINUTES } from '../lib/quietHours';
import { actionTakesWords, countWaiting, waitingFor, type WaitingGroup, type WaitingItem } from '../lib/waitingAnswers';

const TAB_COLOR = colors.tabSchedules;
const PHONE = Platform.OS === 'android' || Platform.OS === 'ios';

export default function WaitingAnswersScreen() {
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  const band = useMemo(() => makeTabBandStyles(TAB_COLOR), []);
  const [groups, setGroups] = useState<WaitingGroup[] | null>(null);
  // Which reminder has its words box open, and for which button.
  const [writing, setWriting] = useState<{ id: string; action: ReminderActionId } | null>(null);
  const [words, setWords] = useState('');
  // Reminders being answered right now, so a second tap does nothing.
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const found = await listWaitingReminders();
      if (mounted.current) {
        setGroups(found);
        setNow(Date.now());
      }
    } catch (error) {
      console.error('[waiting-answers] could not read what is showing', error);
      if (mounted.current) setGroups([]);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      void refreshWaitingSummary();
    }, [load]),
  );

  // A reminder arriving, or the app coming back to the front, while this
  // is open brings the list up to date.
  useEffect(() => {
    if (!PHONE) return;
    const arrivals = Notifications.addNotificationReceivedListener(() => void load());
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    return () => {
      arrivals.remove();
      appState.remove();
    };
  }, [load]);

  async function answer(item: WaitingItem, action: ReminderActionId, text: string | null) {
    if (busy.has(item.identifier)) return;
    setBusy((current) => new Set(current).add(item.identifier));
    try {
      await answerFromList(item.copies, action, text);
    } catch (error) {
      console.error('[waiting-answers] the answer could not be saved', error);
    } finally {
      if (mounted.current) {
        setBusy((current) => {
          const next = new Set(current);
          next.delete(item.identifier);
          return next;
        });
        if (writing?.id === item.identifier) {
          setWriting(null);
          setWords('');
        }
      }
      // A sleep answer brings the energy question, which shows up here too.
      await load();
    }
  }

  function press(item: WaitingItem, action: ReminderActionId) {
    if (actionTakesWords(action)) {
      setWriting(writing?.id === item.identifier && writing.action === action ? null : { id: item.identifier, action });
      setWords('');
      return;
    }
    void answer(item, action, null);
  }

  async function open(item: WaitingItem) {
    const target = await openWaitingReminder(item.identifier);
    if (target) router.push(target);
    else void load();
  }

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

        {groups?.map((group) => (
          <View key={group.key} style={styles.group}>
            <View style={band.heading}>
              <Text style={band.headingText}>
                {group.label} ({group.items.length})
              </Text>
            </View>
            {group.items.map((item) => {
              const isBusy = busy.has(item.identifier);
              const box = writing?.id === item.identifier ? writing : null;
              const input = box ? ACTION_TEXT_INPUT[box.action] : undefined;
              return (
                <View key={item.identifier} style={[band.box, styles.item, isBusy ? styles.itemBusy : null]}>
                  <TouchableOpacity onPress={() => void open(item)} activeOpacity={0.8} accessibilityRole="button">
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.body ? <Text style={styles.itemBody}>{item.body}</Text> : null}
                    <Text style={styles.itemWhen}>{waitingFor(item.shownAt, now)}</Text>
                  </TouchableOpacity>
                  <View style={styles.buttons}>
                    {item.actions.map((action) => {
                      const quiet = action === 'snooze';
                      const chosen = box?.action === action;
                      return (
                        <TouchableOpacity
                          key={action}
                          style={[styles.button, quiet || actionTakesWords(action) ? styles.buttonQuiet : styles.buttonFilled, chosen ? styles.buttonChosen : null]}
                          onPress={() => press(item, action)}
                          disabled={isBusy}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                        >
                          <Text style={quiet || actionTakesWords(action) ? styles.buttonQuietText : styles.buttonFilledText}>
                            {reminderActionTitle(action, SNOOZE_MINUTES)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {box && input ? (
                    <View style={styles.wordsRow}>
                      <AppTextInput
                        style={styles.wordsField}
                        placeholder={input.placeholder}
                        placeholderTextColor={colors.textMuted}
                        value={words}
                        onChangeText={setWords}
                        multiline
                        autoFocus
                      />
                      <TouchableOpacity
                        style={[styles.button, styles.buttonFilled, box.action === 'howAreYou' && !words.trim() ? styles.buttonOff : null]}
                        onPress={() => void answer(item, box.action, words.trim())}
                        disabled={isBusy || (box.action === 'howAreYou' && !words.trim())}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                      >
                        <Text style={styles.buttonFilledText}>{input.submitButtonTitle}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}

        {PHONE && groups != null ? (
          <TouchableOpacity style={styles.refresh} onPress={() => void load()} activeOpacity={0.8} accessibilityRole="button">
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
  group: { gap: HOME_BAND_GAP },
  item: { gap: 10 },
  itemBusy: { opacity: 0.5 },
  itemTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, fontWeight: '400', ...textShadow },
  itemBody: { ...typography.body, color: colors.textSecondary, marginTop: 2, ...textShadow },
  itemWhen: { ...typography.caption, color: colors.textMuted, marginTop: 4, ...textShadow },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The answer itself is filled, since it is the thing to tap; Snooze and
  // the two that open a box are outlined.
  buttonFilled: { backgroundColor: colors.primary },
  buttonFilledText: { ...typography.body, color: colors.background },
  buttonQuiet: { borderWidth: 1, borderColor: TAB_COLOR, backgroundColor: colors.surfaceMuted },
  buttonQuietText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  buttonChosen: { borderWidth: 2 },
  buttonOff: { opacity: 0.5 },
  wordsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  wordsField: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 8,
    minHeight: 44,
    textAlignVertical: 'top',
    backgroundColor: colors.surfaceMuted,
  },
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
