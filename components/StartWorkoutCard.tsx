// Home's Start a Workout card, H11 part 4. What is planned for today on
// Schedules > Exercise, each with Start (a workout, opening the player with
// the plan so finishing marks the day) or Did it (an activity by name,
// writing the exercise log the way Schedules does), then the workouts on
// Life > Workouts, most recently done first, each with Start. Every
// decision and sentence is in lib/startWorkout.ts.
//
// Loads itself on focus, the way Days Until's compact form does, so coming
// back from the player shows the day marked without Home reloading
// everything else.

import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { clearPlanMark, listExercisePlans, listPlanMarks, markPlanDone } from '../lib/exercisePlanDb';
import { localDate, type PlanEntry } from '../lib/exercisePlan';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import { startWorkoutCard, type StartWorkoutCardModel } from '../lib/startWorkout';
import { lastSessionTimes, listWorkouts } from '../lib/workoutsDb';

type Props = { tabColor: string };

export function StartWorkoutCard({ tabColor }: Props) {
  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);
  const router = useRouter();
  const [model, setModel] = useState<StartWorkoutCardModel | null>(null);
  const [markedHere, setMarkedHere] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const now = new Date();
    const today = localDate(now);
    try {
      const [plans, marks, workouts, lastDone] = await Promise.all([
        listExercisePlans(),
        listPlanMarks(today, today),
        listWorkouts(),
        lastSessionTimes(),
      ]);
      setModel(
        startWorkoutCard({
          plans,
          marks,
          workouts: workouts.map((workout) => ({ id: workout.id, name: workout.name, stepCount: workout.steps.length })),
          lastDone,
          today,
          now,
        }),
      );
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(`Could not load workouts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function start(workoutId: string, entry?: PlanEntry) {
    if (entry) router.push({ pathname: '/workout', params: { id: workoutId, planId: entry.plan.id, on: entry.date } });
    else router.push({ pathname: '/workout', params: { id: workoutId } });
  }

  async function change(action: () => Promise<void>, failure: string) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      void syncReminderNotifications();
      await load();
    } catch (error) {
      setErrorMessage(`${failure}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  function didIt(entry: PlanEntry) {
    void change(async () => {
      await markPlanDone(entry.plan, entry.title, entry.date);
      setMarkedHere((current) => new Set(current).add(entry.plan.id));
    }, 'Could not mark it');
  }

  function undo(entry: PlanEntry) {
    const mark = entry.mark;
    if (!mark) return;
    void change(async () => {
      await clearPlanMark(mark);
      setMarkedHere((current) => {
        const next = new Set(current);
        next.delete(entry.plan.id);
        return next;
      });
    }, 'Could not undo it');
  }

  if (!model) {
    return errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null;
  }

  return (
    <View style={styles.section}>
      {model.today.length > 0 ? <Text style={styles.groupLabel}>Planned for today</Text> : null}
      {model.today.map((item) => {
        const { entry } = item;
        const canUndo = entry.mark != null && markedHere.has(entry.plan.id);
        return (
          <View key={entry.plan.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{entry.title}</Text>
              <Text style={styles.rowMeta}>{item.status}</Text>
            </View>
            {item.action === 'start' && entry.plan.workoutId ? (
              <TouchableOpacity style={styles.primaryButton} onPress={() => start(entry.plan.workoutId as string, entry)}>
                <Text style={styles.primaryButtonText}>Start</Text>
              </TouchableOpacity>
            ) : null}
            {item.action === 'mark' ? (
              <TouchableOpacity style={styles.secondaryButton} disabled={busy} onPress={() => didIt(entry)}>
                <Text style={styles.secondaryButtonText}>Did it</Text>
              </TouchableOpacity>
            ) : null}
            {canUndo ? (
              <TouchableOpacity disabled={busy} onPress={() => undo(entry)}>
                <Text style={styles.linkText}>Undo</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}

      {model.others.length > 0 ? (
        <Text style={styles.groupLabel}>{model.today.length > 0 ? 'Or another workout' : 'Your workouts'}</Text>
      ) : null}
      {model.others.map((workout) => (
        <View key={workout.id} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{workout.name}</Text>
            <Text style={styles.rowMeta}>{workout.line}</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={() => start(workout.id)}>
            <Text style={styles.primaryButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
      ))}

      {model.emptyLine ? <Text style={styles.captionText}>{model.emptyLine}</Text> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.links}>
        <TouchableOpacity onPress={() => router.push({ pathname: '/life', params: { openLifeLens: 'workouts' } })}>
          <Text style={styles.linkText}>
            {model.heldBack > 0 ? `${model.heldBack} more, and building one, on Life > Workouts` : 'Build or change a workout on Life > Workouts'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push({ pathname: '/schedule', params: { openScheduleLens: 'exercise' } })}>
          <Text style={styles.linkText}>{'Plan exercise on Schedules > Exercise'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(tabColor: string) {
  const darkText = { textShadowColor: 'transparent', textShadowRadius: 0 } as const;
  return StyleSheet.create({
    section: { gap: 8 },
    groupLabel: { ...typography.label, color: tabColor, ...textShadow },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
      borderRadius: 10,
      backgroundColor: colors.surfaceMuted,
      padding: 12,
    },
    rowText: { flex: 1, minWidth: 160, gap: 2 },
    rowTitle: { ...typography.bodyEmphasis, color: tabColor, ...textShadow },
    rowMeta: { ...typography.caption, color: tabColor, ...textShadow },
    captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
    errorText: { ...typography.body, color: colors.danger, ...textShadow },
    links: { gap: 6, marginTop: 2 },
    linkText: { ...typography.body, color: colors.primary, ...textShadow },
    primaryButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
    primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton, ...darkText },
    secondaryButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    secondaryButtonText: { ...typography.bodyEmphasis, color: tabColor, ...textShadow },
  });
}
