// Doing a workout, one set at a time (H11 part 2, 2026-09-28). Opened from a
// workout on Life > Workouts, and later from Schedules > Exercise and the
// Home card.
//
// The screen is one set. What the set asks for is said at the top, what was
// done is entered underneath starting from the plan, so a set done as
// planned is a single press of Done. A set with rest after it hands over to
// a rest timer that counts from the clock rather than from ticks, so a
// phone that locks or a screen that goes to the background comes back to
// the right number, and when this app may send notifications a notification
// says when rest is over.
//
// Nothing is written until the end. A workout stopped half way offers to
// keep what was done or to leave without saving, and a saved session is one
// ordinary exercise log entry named for the workout (so Movement and
// Trends count it) plus a workout_sessions row holding every set as planned
// and as done, which is where "Last time" comes from.
//
// The screen stays on from the first set until the review (lib/keepScreenOn.ts, R1).
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { NotesInput } from '../components/NotesInput';
import { useInfoAlert } from '../components/InfoAlert';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { getUserConditions } from '../lib/db';
import { healthExerciseType } from '../lib/exercisePlan';
import { markPlanDoneFromSession } from '../lib/exercisePlanDb';
import { getGrantedHealthAccess, isHealthConnectPlatform, writeExerciseSession } from '../lib/healthConnect';
import { formatSeconds, noteHeading, sessionNotesFor } from '../lib/exerciseLibrary';
import { hasReminderPermission, syncReminderNotifications } from '../lib/reminderNotifications';
import {
  describeStep,
  describeWorkout,
  missingExerciseName,
  resolveExercise,
  workoutIntensity,
  type CustomExercise,
  type Workout,
} from '../lib/workouts';
import { getWorkout, lastWorkoutSession, listCustomExercises, saveWorkoutSession } from '../lib/workoutsDb';
import { useKeepScreenOn } from '../lib/keepScreenOn';
import {
  PLAYER_FOOT,
  TIMER_FOOT,
  buildSessionSets,
  clockText,
  compareExercises,
  exerciseProgressLine,
  keptSets,
  lastTimeLine,
  logNotes,
  nextExerciseIndex,
  parseWeight,
  plannedLine,
  resultFromPlan,
  secondsLeft,
  sessionMinutes,
  sessionTotals,
  setHeading,
  totalsLine,
  upNextLine,
  type KeptSet,
  type SetResult,
} from '../lib/workoutSession';
import { ThumbEndRow } from '../components/ThumbEndRow';

type Phase = 'ready' | 'set' | 'rest' | 'stopping' | 'review' | 'saved';

// Never the reminder prefix, so the reminder reconcile leaves these alone.
const NOTIFICATION_PREFIX = 'inside-story-workout-rest:';
const DONE_BUZZ = [0, 500, 250, 500];
const REST_EXTRA_SECONDS = 30;

async function scheduleRestNotice(seconds: number, body: string): Promise<string | null> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;
  try {
    if (!(await hasReminderPermission())) return null;
    const identifier = `${NOTIFICATION_PREFIX}${Date.now()}`;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title: 'Rest is over', body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + seconds * 1000),
        channelId: 'reminders',
      },
    });
    return identifier;
  } catch (error) {
    console.error('[Workout] scheduling the rest notice failed', error);
    return null;
  }
}

function cancelRestNotice(identifier: string | null) {
  if (!identifier) return;
  Notifications.cancelScheduledNotificationAsync(identifier).catch((error) =>
    console.error('[Workout] cancelling the rest notice failed', error),
  );
}

type Entry = { reps: number | null; seconds: number | null; weight: string };

export default function WorkoutPlayerScreen() {
  const params = useLocalSearchParams<{ id?: string; planId?: string; on?: string }>();
  const workoutId = typeof params.id === 'string' ? params.id : null;
  // Opened from a planned day on Schedules > Exercise or its reminder:
  // saving marks that day done.
  const planId = typeof params.planId === 'string' && params.planId ? params.planId : null;
  const planDate = typeof params.on === 'string' && /^d{4}-d{2}-d{2}$/.test(params.on) ? params.on : null;
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [custom, setCustom] = useState<CustomExercise[]>([]);
  const [tracked, setTracked] = useState<string[]>([]);
  const [last, setLast] = useState<{ finishedAt: string; sets: KeptSet[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const [phase, setPhase] = useState<Phase>('ready');
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, SetResult>>({});
  const [entry, setEntry] = useState<Entry>({ reps: null, seconds: null, weight: '' });
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [finishedAt, setFinishedAt] = useState<string | null>(null);
  useKeepScreenOn(phase === 'set' || phase === 'rest' || phase === 'stopping', 'workout');
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [setTimerEndsAt, setSetTimerEndsAt] = useState<number | null>(null);
  const [setTimerStartedAt, setSetTimerStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [canSendHealth, setCanSendHealth] = useState(false);
  const [sendHealth, setSendHealth] = useState(false);
  const [healthOutcome, setHealthOutcome] = useState<'sent' | 'refused' | null>(null);
  const restNoticeRef = useRef<string | null>(null);
  const setTimerBuzzedRef = useRef(false);

  const load = useCallback(async () => {
    if (!workoutId) {
      setLoading(false);
      return;
    }
    try {
      const [found, mine, conditions, previous] = await Promise.all([
        getWorkout(workoutId),
        listCustomExercises(),
        getUserConditions(),
        lastWorkoutSession(workoutId),
      ]);
      setWorkout(found);
      setCustom(mine);
      setTracked(conditions);
      setLast(previous);
    } catch (error) {
      showInfoAlert('Could not open the workout', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [showInfoAlert, workoutId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isHealthConnectPlatform()) return;
    let live = true;
    getGrantedHealthAccess()
      .then((access) => {
        if (live) setCanSendHealth(access.canWriteExercise);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const sets = useMemo(() => {
    if (!workout) return [];
    return buildSessionSets(
      workout,
      (source, id) => resolveExercise(source, id, custom),
      (stepId) => {
        const step = workout.steps.find((entry) => entry.id === stepId);
        return step ? missingExerciseName(step) : 'An exercise';
      },
    );
  }, [custom, workout]);
  const current = sets[index] ?? null;
  const sessionNotes = useMemo(() => sessionNotesFor(tracked), [tracked]);

  // Starting values for the set on screen: what was entered before if this
  // set has been done and come back to, otherwise the plan.
  const currentKey = current?.key ?? null;
  useEffect(() => {
    if (!current) return;
    const earlier = results[current.key];
    const start = earlier && earlier.status === 'done' ? earlier : resultFromPlan(current);
    setEntry({ reps: start.reps, seconds: start.seconds, weight: start.weight != null ? String(start.weight) : '' });
    setSetTimerEndsAt(null);
    setSetTimerStartedAt(null);
    setTimerBuzzedRef.current = false;
    // Only when the set changes, not on every result written.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  // One clock for both timers, running only while one is.
  const ticking = (phase === 'rest' && restEndsAt != null) || (phase === 'set' && setTimerEndsAt != null);
  useEffect(() => {
    if (!ticking) return;
    setNow(Date.now());
    const handle = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(handle);
  }, [ticking]);

  const restLeft = restEndsAt != null ? secondsLeft(restEndsAt, now) : 0;
  useEffect(() => {
    if (phase !== 'rest' || restEndsAt == null || restLeft > 0) return;
    Vibration.vibrate(DONE_BUZZ);
    restNoticeRef.current = null;
    setRestEndsAt(null);
    setPhase('set');
  }, [phase, restEndsAt, restLeft]);

  const setTimerLeft = setTimerEndsAt != null ? secondsLeft(setTimerEndsAt, now) : null;
  useEffect(() => {
    if (setTimerLeft !== 0 || setTimerBuzzedRef.current || !current) return;
    setTimerBuzzedRef.current = true;
    Vibration.vibrate(DONE_BUZZ);
    setEntry((value) => ({ ...value, seconds: current.plannedSeconds }));
  }, [current, setTimerLeft]);

  useEffect(() => () => cancelRestNotice(restNoticeRef.current), []);

  const exercises = useMemo(
    () => (workout ? workout.steps.map((step) => resolveExercise(step.source, step.exerciseId, custom)) : []),
    [custom, workout],
  );

  function begin() {
    setStartedAt(new Date().toISOString());
    setIndex(0);
    setResults({});
    setPhase('set');
  }

  function goToReview() {
    cancelRestNotice(restNoticeRef.current);
    restNoticeRef.current = null;
    setRestEndsAt(null);
    setFinishedAt(new Date().toISOString());
    setPhase('review');
  }

  function moveTo(target: number | null) {
    if (target == null) {
      goToReview();
      return;
    }
    setIndex(target);
    setPhase('set');
  }

  function doneSeconds(): number | null {
    if (!current || current.measure !== 'time') return null;
    if (setTimerEndsAt != null && setTimerStartedAt != null && setTimerLeft != null && setTimerLeft > 0) {
      return Math.max(1, Math.round((Date.now() - setTimerStartedAt) / 1000));
    }
    return entry.seconds;
  }

  async function finishSet() {
    if (!current) return;
    const weight = parseWeight(entry.weight);
    const result: SetResult = {
      key: current.key,
      status: 'done',
      reps: current.measure === 'reps' ? entry.reps : null,
      seconds: doneSeconds(),
      weight,
      at: new Date().toISOString(),
    };
    setResults((value) => ({ ...value, [current.key]: result }));
    const target = index + 1 < sets.length ? index + 1 : null;
    if (target != null && current.restAfter) {
      setIndex(target);
      setRestEndsAt(Date.now() + current.restAfter * 1000);
      setPhase('rest');
      const next = sets[target];
      restNoticeRef.current = await scheduleRestNotice(
        current.restAfter,
        next ? `${next.exerciseName}, ${setHeading(next).toLowerCase()}` : 'Time for the next set.',
      );
      return;
    }
    moveTo(target);
  }

  function skipSet() {
    if (!current) return;
    setResults((value) => ({
      ...value,
      [current.key]: { key: current.key, status: 'skipped', reps: null, seconds: null, weight: null, at: new Date().toISOString() },
    }));
    moveTo(index + 1 < sets.length ? index + 1 : null);
  }

  function skipExercise() {
    if (!current) return;
    const at = new Date().toISOString();
    setResults((value) => {
      const nextValue = { ...value };
      for (const set of sets) {
        if (set.stepIndex === current.stepIndex && !nextValue[set.key]) {
          nextValue[set.key] = { key: set.key, status: 'skipped', reps: null, seconds: null, weight: null, at };
        }
      }
      return nextValue;
    });
    moveTo(nextExerciseIndex(sets, index));
  }

  function goBack() {
    if (index === 0) return;
    setIndex(index - 1);
    setPhase('set');
  }

  function skipRest() {
    cancelRestNotice(restNoticeRef.current);
    restNoticeRef.current = null;
    setRestEndsAt(null);
    setPhase('set');
  }

  async function addRest() {
    if (restEndsAt == null) return;
    const ends = restEndsAt + REST_EXTRA_SECONDS * 1000;
    setRestEndsAt(ends);
    cancelRestNotice(restNoticeRef.current);
    restNoticeRef.current = await scheduleRestNotice(Math.max(1, Math.round((ends - Date.now()) / 1000)), 'Time for the next set.');
  }

  function startSetTimer() {
    if (!current?.plannedSeconds) return;
    const start = Date.now();
    setTimerBuzzedRef.current = false;
    setSetTimerStartedAt(start);
    setSetTimerEndsAt(start + current.plannedSeconds * 1000);
  }

  function showHowTo() {
    if (!current || !workout) return;
    const step = workout.steps[current.stepIndex];
    const view = step ? resolveExercise(step.source, step.exerciseId, custom) : null;
    if (!view) {
      showInfoAlert(current.exerciseName, 'There is nothing written for this exercise any more.');
      return;
    }
    const parts: string[] = [];
    if (view.steps.length > 0) parts.push(view.steps.map((line, at) => `${at + 1}. ${line}`).join('\n'));
    if (view.safety.length > 0) parts.push(`Doing it safely\n${view.safety.map((line) => `• ${line}`).join('\n')}`);
    if (view.easier) parts.push(`Easier: ${view.easier}`);
    showInfoAlert(view.name, parts.join('\n\n') || 'No steps are written for this exercise yet.');
  }

  const totals = useMemo(() => sessionTotals(sets, results), [results, sets]);
  const comparisons = useMemo(() => compareExercises(sets, results), [results, sets]);

  async function save() {
    if (!workout || !startedAt || !finishedAt || saving) return;
    setSaving(true);
    try {
      const saved = await saveWorkoutSession({
        workoutId: workout.id,
        workoutName: workout.name,
        startedAt,
        finishedAt,
        sets: keptSets(sets, results),
        minutes: sessionMinutes(startedAt, finishedAt),
        intensity: workoutIntensity(exercises),
        notes: logNotes(comparisons, note),
        note: note.trim() || null,
      });
      if (planId && planDate) {
        await markPlanDoneFromSession(planId, planDate, saved.id, saved.logId);
        void syncReminderNotifications();
      }
      if (canSendHealth && sendHealth) {
        const sent = await writeExerciseSession({
          sessionId: saved.id,
          startTime: startedAt,
          endTime: finishedAt,
          title: workout.name,
          exerciseType: healthExerciseType(exercises.flatMap((exercise) => (exercise ? [exercise.category] : []))),
          notes: note.trim() || null,
        });
        setHealthOutcome(sent ? 'sent' : 'refused');
      }
      setPhase('saved');
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  const title = workout?.name ?? 'Workout';
  const lastLine =
    current && last ? lastTimeLine(current.stepId, last.sets, last.finishedAt, new Date(now)) : null;

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.card}>
            <Text style={styles.bodyText}>Opening the workout.</Text>
          </View>
        ) : null}

        {!loading && !workout ? (
          <View style={styles.card}>
            <Text style={styles.bodyText}>That workout is not here any more. It may have been removed from Life, Workouts.</Text>
          </View>
        ) : null}

        {!loading && workout && sets.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{workout.name}</Text>
            <Text style={styles.bodyText}>This workout has no exercises yet. Add them in Life, Workouts.</Text>
          </View>
        ) : null}

        {workout && sets.length > 0 && phase === 'ready' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{workout.name}</Text>
              <Text style={styles.captionText}>{describeWorkout(workout)}</Text>
              {workout.note ? <Text style={styles.bodyText}>{workout.note}</Text> : null}
              {workout.steps.map((step, at) => {
                const view = exercises[at] ?? null;
                return (
                  <View key={step.id} style={styles.planRow}>
                    <Text style={styles.bodyText}>
                      {at + 1}. {view?.name ?? missingExerciseName(step)}
                    </Text>
                    <Text style={styles.captionText}>{describeStep(step, view)}</Text>
                  </View>
                );
              })}
            </View>
            {sessionNotes.map((sessionNote) => (
              <View key={sessionNote.text} style={styles.noteCard}>
                <Text style={styles.noteTitle}>{noteHeading(sessionNote)}</Text>
                <Text style={styles.bodyText}>{sessionNote.text}</Text>
                <Text style={styles.captionText}>{sessionNote.source.label}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.primaryButton} onPress={begin} accessibilityRole="button">
              <Ionicons name="play" size={18} color={colors.background} />
              <Text style={styles.primaryButtonText}>Start</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {workout && current && phase === 'set' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.captionText}>{exerciseProgressLine(sets, index)}</Text>
              <View style={styles.pipRow}>
                {sets.map((set, at) => {
                  const result = results[set.key];
                  return (
                    <View
                      key={set.key}
                      style={[
                        styles.pip,
                        result?.status === 'done' ? styles.pipDone : null,
                        result?.status === 'skipped' ? styles.pipSkipped : null,
                        at === index ? styles.pipNow : null,
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.setCard}>
              <Text style={styles.setName}>{current.exerciseName}</Text>
              <Text style={styles.setHeading}>{setHeading(current)}</Text>
              <Text style={styles.bodyText}>Planned: {plannedLine(current)}</Text>
              {lastLine ? <Text style={styles.captionText}>{lastLine}</Text> : null}
              {current.note ? <Text style={styles.captionText}>{current.note}</Text> : null}
              <TouchableOpacity style={styles.linkButton} onPress={showHowTo}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.linkText}>How to do it</Text>
              </TouchableOpacity>

              {current.measure === 'reps' ? (
                <View style={styles.counterBlock}>
                  <Text style={styles.label}>Times done</Text>
                  <ThumbEndRow style={styles.counterRow}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => setEntry((value) => ({ ...value, reps: Math.max(0, (value.reps ?? 0) - 1) }))}
                      accessibilityLabel="One fewer"
                    >
                      <Ionicons name="remove" size={26} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.bigNumber}>{entry.reps ?? 0}</Text>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => setEntry((value) => ({ ...value, reps: (value.reps ?? 0) + 1 }))}
                      accessibilityLabel="One more"
                    >
                      <Ionicons name="add" size={26} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </ThumbEndRow>
                </View>
              ) : (
                <View style={styles.counterBlock}>
                  <Text style={styles.label}>{setTimerEndsAt != null ? 'Time left' : 'Seconds done'}</Text>
                  {setTimerEndsAt != null && setTimerLeft != null ? (
                    <Text style={styles.bigClock}>{setTimerLeft > 0 ? clockText(setTimerLeft) : 'Time'}</Text>
                  ) : (
                    <ThumbEndRow style={styles.counterRow}>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEntry((value) => ({ ...value, seconds: Math.max(0, (value.seconds ?? 0) - 5) }))}
                        accessibilityLabel="Five seconds fewer"
                      >
                        <Ionicons name="remove" size={26} color={colors.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.bigNumber}>{clockText(entry.seconds ?? 0)}</Text>
                      <TouchableOpacity
                        style={styles.counterButton}
                        onPress={() => setEntry((value) => ({ ...value, seconds: (value.seconds ?? 0) + 5 }))}
                        accessibilityLabel="Five seconds more"
                      >
                        <Ionicons name="add" size={26} color={colors.textPrimary} />
                      </TouchableOpacity>
                    </ThumbEndRow>
                  )}
                  {setTimerEndsAt == null && current.plannedSeconds ? (
                    <TouchableOpacity style={styles.timerButton} onPress={startSetTimer}>
                      <Ionicons name="timer-outline" size={18} color={colors.textPrimary} />
                      <Text style={styles.timerButtonText}>Start the {formatSeconds(current.plannedSeconds)} timer</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              <View style={styles.weightRow}>
                <Text style={styles.label}>Weight{current.weightUnit ? ` (${current.weightUnit})` : ' (optional)'}</Text>
                <AppTextInput
                  style={styles.weightInput}
                  value={entry.weight}
                  onChangeText={(weight) => setEntry((value) => ({ ...value, weight: weight.replace(/[^0-9.,]/g, '') }))}
                  keyboardType="decimal-pad"
                  maxLength={6}
                  placeholder="None"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={finishSet} accessibilityRole="button">
              <Ionicons name={index + 1 < sets.length ? 'checkmark' : 'flag-outline'} size={18} color={colors.background} />
              <Text style={styles.primaryButtonText}>
                {index + 1 >= sets.length ? 'Done, finish' : current.restAfter ? `Done, rest ${formatSeconds(current.restAfter)}` : 'Done, next'}
              </Text>
            </TouchableOpacity>

            <View style={styles.minorRow}>
              <TouchableOpacity style={[styles.minorButton, index === 0 ? styles.minorButtonOff : null]} disabled={index === 0} onPress={goBack}>
                <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
                <Text style={styles.minorButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.minorButton} onPress={skipSet}>
                <Ionicons name="play-skip-forward-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.minorButtonText}>Skip this set</Text>
              </TouchableOpacity>
            </View>
            {current.setCount > 1 || current.side ? (
              <TouchableOpacity style={styles.quietButton} onPress={skipExercise}>
                <Text style={styles.quietButtonText}>Skip the rest of {current.exerciseName}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.quietButton} onPress={() => setPhase('stopping')}>
              <Text style={styles.quietButtonText}>Stop the workout here</Text>
            </TouchableOpacity>
            <View style={styles.card}>
              <Text style={styles.captionText}>{PLAYER_FOOT}</Text>
            </View>
          </>
        ) : null}

        {workout && phase === 'rest' ? (
          <>
            <View style={styles.setCard}>
              <Text style={styles.setHeading}>Rest</Text>
              <Text style={styles.bigClock}>{clockText(restLeft)}</Text>
              {upNextLine(sets, index - 1) ? <Text style={styles.bodyText}>{upNextLine(sets, index - 1)}</Text> : null}
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={skipRest} accessibilityRole="button">
              <Ionicons name="play-skip-forward" size={18} color={colors.background} />
              <Text style={styles.primaryButtonText}>Ready now</Text>
            </TouchableOpacity>
            <View style={styles.minorRow}>
              <TouchableOpacity style={styles.minorButton} onPress={addRest}>
                <Ionicons name="add" size={16} color={colors.textSecondary} />
                <Text style={styles.minorButtonText}>{REST_EXTRA_SECONDS} seconds more</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.quietButton} onPress={() => setPhase('stopping')}>
              <Text style={styles.quietButtonText}>Stop the workout here</Text>
            </TouchableOpacity>
            <View style={styles.card}>
              <Text style={styles.captionText}>{TIMER_FOOT}</Text>
            </View>
          </>
        ) : null}

        {workout && phase === 'stopping' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Stop here?</Text>
              <Text style={styles.bodyText}>{totalsLine(totals)} so far. You can look over what you did and choose whether to save it.</Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={goToReview}>
              <Text style={styles.primaryButtonText}>Stop and look it over</Text>
            </TouchableOpacity>
            <View style={styles.minorRow}>
              <TouchableOpacity style={styles.minorButton} onPress={() => setPhase(restEndsAt != null ? 'rest' : 'set')}>
                <Text style={styles.minorButtonText}>Keep going</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {workout && startedAt && finishedAt && (phase === 'review' || phase === 'saved') ? (
          <>
            <View style={styles.doneCard}>
              <Ionicons name={phase === 'saved' ? 'checkmark-circle' : 'flag-outline'} size={30} color={colors.accent} />
              <Text style={styles.doneTitle}>{phase === 'saved' ? `${workout.name} saved.` : workout.name}</Text>
              <Text style={styles.bodyText}>
                {totalsLine(totals)}, about {sessionMinutes(startedAt, finishedAt)}{' '}
                {sessionMinutes(startedAt, finishedAt) === 1 ? 'minute' : 'minutes'}.
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Planned and done</Text>
              {comparisons.map((line) => (
                <View key={line.stepId} style={styles.planRow}>
                  <Text style={styles.bodyText}>{line.name}</Text>
                  <Text style={styles.captionText}>Planned: {line.planned}</Text>
                  <Text style={styles.captionText}>Done: {line.done}</Text>
                </View>
              ))}
            </View>
            {phase === 'review' ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.label}>A note about today (optional)</Text>
                  <NotesInput
                    style={[styles.noteInput]}
                    value={note}
                    onChangeText={setNote}
                    placeholder="How it went, how you felt"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    maxLength={500}
                  />
                  <Text style={styles.captionText}>
                    Saving adds one entry to your exercise log, named {workout.name}, which Movement and Trends read.
                  </Text>
                  {planId && planDate ? (
                    <Text style={styles.captionText}>It also marks the planned day done on Schedules {'>'} Exercise.</Text>
                  ) : null}
                </View>
                {canSendHealth ? (
                  <View style={styles.card}>
                    <Text style={styles.label}>Health Connect</Text>
                    <View style={styles.choiceRow}>
                      {[
                        { key: true, label: 'Send it there too' },
                        { key: false, label: 'Keep it here' },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.label}
                          style={[styles.minorButton, sendHealth === option.key ? styles.choiceOn : null]}
                          onPress={() => setSendHealth(option.key)}
                        >
                          <Text style={[styles.minorButtonText, sendHealth === option.key ? styles.choiceOnText : null]}>{option.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.captionText}>
                      Sent, it goes over as one exercise session from start to finish, so other apps reading Health Connect see it too.
                    </Text>
                  </View>
                ) : !isHealthConnectPlatform() ? (
                  <View style={styles.card}>
                    <Text style={styles.captionText}>
                      On an Android phone a finished workout can also go to Health Connect for other apps to read. Apple
                      Health on an iPhone is not connected yet, and the computer version, Windows or Mac, has neither, so
                      it is kept here.
                    </Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[styles.primaryButton, totals.done === 0 || saving ? styles.minorButtonOff : null]}
                  disabled={totals.done === 0 || saving}
                  onPress={save}
                >
                  <Ionicons name="save-outline" size={18} color={colors.background} />
                  <Text style={styles.primaryButtonText}>{totals.done === 0 ? 'No sets done to save' : 'Save'}</Text>
                </TouchableOpacity>
                <View style={styles.minorRow}>
                  <TouchableOpacity style={styles.minorButton} onPress={() => router.back()}>
                    <Text style={styles.minorButtonText}>Leave without saving</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {healthOutcome ? (
                  <View style={styles.card}>
                    <Text style={styles.captionText}>
                      {healthOutcome === 'sent'
                        ? 'Sent to Health Connect as an exercise session.'
                        : 'Health Connect did not take the session. It is saved here all the same.'}
                    </Text>
                  </View>
                ) : null}
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
                  <Text style={styles.primaryButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : null}
      </ScrollView>
      {infoAlertElement}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  card: {
    ...homeBandStyle,
    borderColor: colors.tabLife,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 8,
  },
  noteCard: {
    ...homeBandStyle,
    borderColor: colors.accent,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 6,
  },
  noteTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  cardTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  label: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  planRow: { gap: 2, paddingTop: 4 },
  pipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  pip: { height: 6, flexGrow: 1, flexBasis: 8, borderRadius: 3, backgroundColor: colors.border },
  pipDone: { backgroundColor: colors.accent },
  pipSkipped: { backgroundColor: colors.textMuted },
  pipNow: { backgroundColor: colors.primary },
  // The one card the screen exists for, the same weight as a routine step.
  setCard: {
    ...homeBandStyle,
    borderColor: colors.primary,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 10,
    minHeight: 150,
  },
  setName: { ...typography.screenTitle, color: colors.textPrimary, ...textShadow },
  setHeading: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  linkText: { ...typography.body, color: colors.textSecondary, textDecorationLine: 'underline', ...textShadow },
  counterBlock: { gap: 6, alignItems: 'center' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  counterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  bigNumber: { ...typography.screenTitle, fontSize: 40, lineHeight: 48, color: colors.textPrimary, minWidth: 70, textAlign: 'center', ...textShadow },
  bigClock: { ...typography.screenTitle, fontSize: 52, lineHeight: 62, color: colors.textPrimary, textAlign: 'center', fontVariant: ['tabular-nums'], ...textShadow },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  timerButtonText: { ...typography.body, color: colors.textPrimary },
  weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  weightInput: {
    minWidth: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
    textAlign: 'center',
    ...typography.body,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 70,
    textAlignVertical: 'top',
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
    ...typography.body,
  },
  primaryButton: {
    marginHorizontal: HOME_BAND_CONTENT_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.background },
  minorRow: { marginHorizontal: HOME_BAND_CONTENT_PADDING, flexDirection: 'row', gap: 10 },
  minorButton: {
    flex: 1,
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
  minorButtonOff: { opacity: 0.4 },
  choiceRow: { flexDirection: 'row', gap: 10 },
  choiceOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceOnText: { color: colors.background },
  minorButtonText: { ...typography.body, color: colors.textSecondary },
  quietButton: {
    marginHorizontal: HOME_BAND_CONTENT_PADDING,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  quietButtonText: { ...typography.caption, color: colors.textMuted },
  doneCard: {
    ...homeBandStyle,
    borderColor: colors.accent,
    padding: HOME_BAND_CONTENT_PADDING,
    alignItems: 'center',
    gap: 10,
  },
  doneTitle: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center', ...textShadow },
});
