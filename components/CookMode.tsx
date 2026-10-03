// Cook mode: G4 of the competitive build plan (Phase 2, 2026-09-26). A
// recipe's steps one at a time, in large type, with Previous and Next, and a
// "Start 20 min timer" button on any step whose words name a duration
// (lib/stepTimers.ts finds them). Several timers can run at once and keep
// running while the steps move on, since the rice is still cooking while
// the sauce is made.
//
// A timer that ends vibrates the phone and, when this app is allowed to
// send notifications, also arrives as a notification, so it still speaks
// with the screen off or the app in the background. Timers live in a
// module-level store keyed by the recipe, so closing cook mode and opening
// it again on the same recipe finds them still counting.
//
// The screen stays on while cook mode is open (lib/keepScreenOn.ts, R1).
//
// Opened from CookModeButton, which sits under a recipe's steps in
// RecipeDetailCard (System Recipes), StepsEditor (every builder) and
// RecipeImportView.
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { hasReminderPermission } from '../lib/reminderNotifications';
import {
  formatRemaining,
  rangeCaption,
  remainingSeconds,
  startLabel,
  timerDoneLine,
  timerLabel,
  timersInStep,
  type StepTimer,
} from '../lib/stepTimers';
import { modalAnimationType } from '../lib/visualPreferences';
import { useKeepScreenOn } from '../lib/keepScreenOn';

type CookTimer = {
  id: string;
  stepIndex: number;
  label: string;
  endsAt: number;
  notificationId: string | null;
  done: boolean;
};

// Outside React on purpose: closing cook mode must not stop a pot's timer.
const timersByRecipe = new Map<string, CookTimer[]>();
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((listener) => listener());
}

// Never the reminder prefix (inside-story-reminder:), so the reminder
// reconcile in lib/reminderNotifications.ts leaves these alone.
const NOTIFICATION_PREFIX = 'inside-story-cook-timer:';
const EXTRA_MINUTES = [1, 5, 10];
const DONE_BUZZ = [0, 600, 300, 600, 300, 600];

function storeKey(title: string | null | undefined, steps: string[]): string {
  return `${title?.trim() ?? ''}|${steps.length}|${steps[0] ?? ''}`;
}

async function scheduleTimerNotification(id: string, seconds: number, body: string): Promise<string | null> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;
  try {
    if (!(await hasReminderPermission())) return null;
    const identifier = `${NOTIFICATION_PREFIX}${id}`;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title: 'Timer done', body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + seconds * 1000),
        channelId: 'reminders',
      },
    });
    return identifier;
  } catch (error) {
    console.error('[CookMode] scheduling a timer notification failed', error);
    return null;
  }
}

function cancelTimerNotification(identifier: string | null) {
  if (!identifier) return;
  Notifications.cancelScheduledNotificationAsync(identifier).catch((error) =>
    console.error('[CookMode] cancelling a timer notification failed', error),
  );
}

export function CookModeButton({
  steps,
  title,
  tabColor,
  style,
}: {
  steps: string[];
  title?: string | null;
  tabColor: string;
  style?: object;
}) {
  const [open, setOpen] = useState(false);
  const usable = steps.filter((step) => step.trim().length > 0);
  if (usable.length === 0) return null;
  return (
    <>
      <TouchableOpacity
        style={[styles.openButton, { borderColor: tabColor }, style]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Cook mode, one step at a time with timers"
      >
        <Ionicons name="restaurant-outline" size={16} color={colors.textPrimary} />
        <Text style={styles.openButtonText}>Cook mode</Text>
      </TouchableOpacity>
      {open ? <CookMode visible steps={usable} title={title} tabColor={tabColor} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function CookMode({
  visible,
  steps,
  title,
  tabColor,
  onClose,
}: {
  visible: boolean;
  steps: string[];
  title?: string | null;
  tabColor: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const key = useMemo(() => storeKey(title, steps), [title, steps]);
  const [index, setIndex] = useState(0);
  const [timers, setTimers] = useState<CookTimer[]>(() => timersByRecipe.get(key) ?? []);
  const [now, setNow] = useState(() => Date.now());
  const [canNotify, setCanNotify] = useState<boolean | null>(null);
  useKeepScreenOn(visible, 'cook-mode');

  useEffect(() => {
    const listener = () => setTimers([...(timersByRecipe.get(key) ?? [])]);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, [key]);

  useEffect(() => {
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      setCanNotify(false);
      return;
    }
    hasReminderPermission()
      .then(setCanNotify)
      .catch(() => setCanNotify(false));
  }, []);

  const update = useCallback(
    (next: (current: CookTimer[]) => CookTimer[]) => {
      timersByRecipe.set(key, next(timersByRecipe.get(key) ?? []));
      notify();
    },
    [key],
  );

  const anyRunning = timers.some((timer) => !timer.done);
  useEffect(() => {
    if (!visible || !anyRunning) return;
    const tick = setInterval(() => {
      const moment = Date.now();
      setNow(moment);
      const finishing = (timersByRecipe.get(key) ?? []).filter((timer) => !timer.done && timer.endsAt <= moment);
      if (finishing.length > 0) {
        // A timer that ended while cook mode was closed is marked done on
        // reopening without buzzing a second time; its notification spoke.
        if (finishing.some((timer) => moment - timer.endsAt < 5000)) Vibration.vibrate(DONE_BUZZ);
        update((current) => current.map((timer) => (finishing.some((f) => f.id === timer.id) ? { ...timer, done: true } : timer)));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [visible, anyRunning, key, update]);

  const startTimer = useCallback(
    async (stepIndex: number, seconds: number) => {
      const id = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      const label = timerLabel(seconds);
      const timer: CookTimer = { id, stepIndex, label, endsAt: Date.now() + seconds * 1000, notificationId: null, done: false };
      setNow(Date.now());
      update((current) => [...current, timer]);
      const notificationId = await scheduleTimerNotification(id, seconds, timerDoneLine(stepIndex + 1, timer, title));
      if (notificationId) update((current) => current.map((t) => (t.id === id ? { ...t, notificationId } : t)));
    },
    [title, update],
  );

  const stopTimer = useCallback(
    (id: string) => {
      const timer = (timersByRecipe.get(key) ?? []).find((t) => t.id === id);
      if (timer && !timer.done) cancelTimerNotification(timer.notificationId);
      update((current) => current.filter((t) => t.id !== id));
    },
    [key, update],
  );

  const safeIndex = Math.min(index, steps.length - 1);
  const step = steps[safeIndex] ?? '';
  const found: StepTimer[] = useMemo(() => timersInStep(step), [step]);
  const isLast = safeIndex === steps.length - 1;
  const styles2 = useMemo(() => accentStyles(tabColor), [tabColor]);

  return (
    <Modal
      visible={visible}
      animationType={modalAnimationType('slide')}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
        <View style={[styles.header, styles2.headerBorder]}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Cook mode</Text>
            {title?.trim() ? (
              <Text style={styles.recipeTitle} numberOfLines={2}>
                {title.trim()}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close cook mode">
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.stepCount, styles2.accentText]}>
            Step {safeIndex + 1} of {steps.length}
          </Text>
          <Text style={styles.stepText}>{step}</Text>

          {found.map((timer) => {
            const caption = rangeCaption(timer);
            return (
              <View key={timer.seconds} style={styles.startBlock}>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => void startTimer(safeIndex, timer.seconds)}
                  accessibilityRole="button"
                >
                  <Ionicons name="timer-outline" size={20} color={colors.textOnButton} />
                  <Text style={styles.startButtonText}>{startLabel(timer)}</Text>
                </TouchableOpacity>
                {caption ? <Text style={styles.caption}>{caption}</Text> : null}
              </View>
            );
          })}

          <View style={styles.extraRow}>
            <Text style={styles.caption}>{found.length > 0 ? 'Another timer:' : 'A timer for this step:'}</Text>
            {EXTRA_MINUTES.map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={[styles.extraChip, styles2.chipBorder]}
                onPress={() => void startTimer(safeIndex, minutes * 60)}
                accessibilityRole="button"
                accessibilityLabel={`Start a ${minutes} minute timer`}
              >
                <Text style={styles.extraChipText}>{minutes} min</Text>
              </TouchableOpacity>
            ))}
          </View>

          {timers.length > 0 ? (
            <View style={styles.timerList}>
              <Text style={styles.eyebrow}>Timers</Text>
              {timers.map((timer) => {
                const left = remainingSeconds(timer.endsAt, now);
                return (
                  <View key={timer.id} style={[styles.timerRow, timer.done && styles2.timerDone]}>
                    <View style={styles.timerText}>
                      <Text style={styles.timerRemaining}>{timer.done ? 'Done' : formatRemaining(left)}</Text>
                      <Text style={styles.caption}>
                        {timer.done ? timerDoneLine(timer.stepIndex + 1, timer) : `Step ${timer.stepIndex + 1}, ${timer.label}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.timerAction}
                      onPress={() => stopTimer(timer.id)}
                      accessibilityRole="button"
                      accessibilityLabel={timer.done ? 'Clear this timer' : 'Stop this timer'}
                    >
                      <Text style={[styles.timerActionText, styles2.accentText]}>{timer.done ? 'Clear' : 'Stop'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              {canNotify === false ? (
                <Text style={styles.caption}>
                  {Platform.OS === 'android' || Platform.OS === 'ios'
                    ? 'Notifications are off for this app, so a timer ends here on this screen only. Timers keep counting if cook mode is closed.'
                    : 'On this computer a timer ends here on this screen only. Timers keep counting if cook mode is closed.'}
                </Text>
              ) : (
                <Text style={styles.caption}>Timers keep counting if cook mode is closed, and each one sends a notification when it ends.</Text>
              )}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.navButton, styles.navSecondary, styles2.chipBorder, safeIndex === 0 && styles.navDisabled]}
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={safeIndex === 0}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            <Text style={styles.navSecondaryText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, styles.navPrimary]}
            onPress={() => (isLast ? onClose() : setIndex((i) => Math.min(steps.length - 1, i + 1)))}
            accessibilityRole="button"
          >
            <Text style={styles.navPrimaryText}>{isLast ? 'Finish' : 'Next'}</Text>
            {isLast ? null : <Ionicons name="chevron-forward" size={22} color={colors.textOnButton} />}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Twenty-two point step text for reading at arm's length, keeping the line
// spacing setting's proportion when one is chosen.
const STEP_SIZE = 22;
function scaledLineHeight(size: number): number {
  const base = typography.body.lineHeight ?? Math.round(typography.body.fontSize * 1.4);
  return Math.round((base * size) / typography.body.fontSize);
}
const DARK_TEXT = { textShadowColor: 'transparent', textShadowRadius: 0 };

function accentStyles(tabColor: string) {
  return StyleSheet.create({
    headerBorder: { borderBottomColor: tabColor },
    accentText: { color: tabColor },
    chipBorder: { borderColor: tabColor },
    timerDone: { borderColor: tabColor, backgroundColor: `${tabColor}22` },
  });
}

const styles = StyleSheet.create({
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    backgroundColor: colors.surface,
  },
  openButtonText: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 2, paddingBottom: 10 },
  headerText: { flex: 1 },
  eyebrow: { ...typography.eyebrow, color: colors.textSecondary, ...textShadow },
  recipeTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginTop: 2, ...textShadow },
  closeButton: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingVertical: 16, gap: 12 },
  stepCount: { ...typography.sectionTitle, ...textShadow },
  stepText: { ...typography.body, fontSize: STEP_SIZE, lineHeight: scaledLineHeight(STEP_SIZE), color: colors.textPrimary, ...textShadow },
  startBlock: { gap: 4 },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: colors.buttonColor,
  },
  startButtonText: { ...typography.sectionTitle, color: colors.textOnButton, ...DARK_TEXT },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  extraRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  extraChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.surface },
  extraChipText: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  timerList: { gap: 8, marginTop: 4 },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  timerText: { flex: 1 },
  timerRemaining: { ...typography.screenTitle, fontSize: 28, lineHeight: scaledLineHeight(28), color: colors.textPrimary, fontVariant: ['tabular-nums'], ...textShadow },
  timerAction: { padding: 10 },
  timerActionText: { ...typography.bodyEmphasis, ...textShadow },
  footer: { flexDirection: 'row', gap: 10, paddingTop: 10 },
  navButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 14 },
  navSecondary: { borderWidth: 1, backgroundColor: colors.surface },
  navDisabled: { opacity: 0.4 },
  navSecondaryText: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  navPrimary: { backgroundColor: colors.buttonColor },
  navPrimaryText: { ...typography.sectionTitle, color: colors.textOnButton, ...DARK_TEXT },
});
