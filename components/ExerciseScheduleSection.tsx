import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type ComponentProps, type ComponentType, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { NotesInput } from './NotesInput';
import { HOME_BAND_ACCENT_WIDTH, HOME_BAND_CONTENT_PADDING, HomeSectionBand, homeBandNoHairlines, homeBandStyle } from './HomeSectionBand';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import { addDays, type RepeatConfig } from '../lib/repeatRule';
import {
  blankPlanDraft,
  dayLabel,
  describePlan,
  draftFromPlan,
  entryStatusLine,
  localDate,
  planDays,
  planDraftProblem,
  planTitle,
  PLAN_FOOT,
  type ExercisePlan,
  type PlanDraft,
  type PlanEntry,
  type PlanMark,
} from '../lib/exercisePlan';
import {
  clearPlanMark,
  listExercisePlans,
  listPlanMarks,
  markPlanDone,
  markPlanSkipped,
  removeExercisePlan,
  saveExercisePlan,
} from '../lib/exercisePlanDb';
import { listWorkouts } from '../lib/workoutsDb';
import { describeWorkout, type Workout } from '../lib/workouts';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import { buildTime24, describeTimeInputProblem, splitTime24, type TimeOfDayInput } from '../lib/timeOfDay';

// Schedules > Exercise, H11 part 3. A plan is a workout from Life >
// Workouts or a plain activity by name, on a first day, at a time or any
// time that day, repeating by the same rule every other schedule uses. The
// days ahead are listed so a workout can be started from its day; the last
// two weeks are listed so a day can be marked late. A day with nothing
// marked is left as it is. Workouts themselves are defined on Life, since a
// thing is defined where it lives and gets its timeline here.

type Folds = ReturnType<typeof useBandFolds>;

// Schedules' lens content is inset 16, so a band reaches the edge by
// cancelling that, the way every other Schedules lens does.
const CONTENT_INSET = 16;
const AHEAD_DAYS = 13;
const BEHIND_DAYS = 14;
const ACTIVITY = '__activity__';

function Band({
  folds,
  color,
  id,
  title,
  icon,
  children,
}: {
  folds: Folds;
  color: string;
  id: string;
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  children: ReactNode;
}) {
  return (
    <View style={bandStyles.bandOut}>
      <HomeSectionBand kind="fold" title={title} icon={icon} color={color} expanded={folds.isOpen(id)} onToggle={() => folds.toggle(id)}>
        {children}
      </HomeSectionBand>
    </View>
  );
}

const bandStyles = StyleSheet.create({ bandOut: { marginHorizontal: -CONTENT_INSET } });

type FormState = { editingId: string | null; draft: PlanDraft; time: TimeOfDayInput; timed: boolean };

function blankForm(today: string): FormState {
  return { editingId: null, draft: blankPlanDraft(today), time: { hour: '7', minute: '00', ampm: 'AM' }, timed: true };
}

type Props = {
  tabColor: string;
  /** The Schedules repeat picker, handed in so this file never imports a route. */
  RepeatRulePicker: ComponentType<{ repeat: RepeatConfig; onChange: (repeat: RepeatConfig) => void; startDate?: string }>;
};

export function ExerciseScheduleSection({ tabColor, RepeatRulePicker }: Props) {
  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);
  const router = useRouter();
  const folds = useBandFolds();
  const [plans, setPlans] = useState<ExercisePlan[]>([]);
  const [marks, setMarks] = useState<PlanMark[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [today, setToday] = useState(() => localDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [sheet, setSheet] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);

  const load = useCallback(() => {
    setToday(localDate(new Date()));
    Promise.all([listExercisePlans(), listPlanMarks(), listWorkouts()])
      .then(([nextPlans, nextMarks, nextWorkouts]) => {
        setPlans(nextPlans);
        setMarks(nextMarks);
        setWorkouts(nextWorkouts);
        setErrorMessage('');
      })
      .catch((error) => setErrorMessage(`Could not load planned exercise: ${error instanceof Error ? error.message : String(error)}`))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const names = useMemo(() => new Map(workouts.map((workout) => [workout.id, workout.name])), [workouts]);
  const livePlans = useMemo(() => plans.filter((plan) => !plan.archivedAt), [plans]);
  const ahead = useMemo(() => planDays(plans, marks, names, today, addDays(today, AHEAD_DAYS)), [plans, marks, names, today]);
  const behind = useMemo(
    () => planDays(plans, marks, names, addDays(today, -BEHIND_DAYS), addDays(today, -1)).reverse(),
    [plans, marks, names, today],
  );

  const workoutOptions = useMemo(
    () => [{ label: 'An activity, typed below', value: ACTIVITY }, ...workouts.filter((workout) => !workout.archivedAt).map((workout) => ({ label: workout.name, value: workout.id }))],
    [workouts],
  );

  function afterChange() {
    load();
    void syncReminderNotifications();
  }

  function openAdd() {
    setForm(blankForm(today));
  }

  function openEdit(plan: ExercisePlan) {
    setForm({
      editingId: plan.id,
      draft: draftFromPlan(plan),
      time: plan.atTime ? splitTime24(plan.atTime) : { hour: '7', minute: '00', ampm: 'AM' },
      timed: plan.atTime != null,
    });
  }

  function patch(fields: Partial<PlanDraft>) {
    setForm((current) => (current ? { ...current, draft: { ...current.draft, ...fields } } : current));
  }

  async function handleSave() {
    if (!form) return;
    let atTime: string | null = null;
    if (form.timed) {
      atTime = buildTime24(form.time.hour, form.time.minute, form.time.ampm);
      if (!atTime) {
        showInfoAlert('Almost there', describeTimeInputProblem(form.time.hour, form.time.minute, form.time.ampm));
        return;
      }
    }
    const draft = { ...form.draft, atTime, remind: form.timed && form.draft.remind };
    const problem = planDraftProblem(draft);
    if (problem) {
      showInfoAlert('Almost there', problem);
      return;
    }
    try {
      await saveExercisePlan(form.editingId, draft);
      setForm(null);
      afterChange();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  function askRemove(plan: ExercisePlan) {
    const title = planTitle(plan, names);
    const hasMarks = marks.some((mark) => mark.planId === plan.id);
    setSheet({
      title: `Remove ${title}?`,
      message: hasMarks
        ? 'Days already marked stay in the list below as they are. No more days are planned and its reminders stop.'
        : 'No day of it has been marked, so the plan is deleted and its reminders stop.',
      actions: [
        {
          label: 'Remove',
          destructive: true,
          onPress: async () => {
            setSheet(null);
            try {
              await removeExercisePlan(plan);
              afterChange();
            } catch (error) {
              showInfoAlert('Could not remove', error instanceof Error ? error.message : String(error));
            }
          },
        },
        { label: 'Keep it', onPress: () => setSheet(null) },
      ],
    });
  }

  function start(entry: PlanEntry) {
    if (!entry.plan.workoutId) return;
    router.push({ pathname: '/workout', params: { id: entry.plan.workoutId, planId: entry.plan.id, on: entry.date } });
  }

  async function run(action: () => Promise<void>, failure: string) {
    try {
      await action();
      afterChange();
    } catch (error) {
      showInfoAlert(failure, error instanceof Error ? error.message : String(error));
    }
  }

  function askUndo(entry: PlanEntry) {
    const mark = entry.mark;
    if (!mark) return;
    const wroteLog = mark.exerciseLogId && !mark.workoutSessionId;
    setSheet({
      title: 'Clear this mark?',
      message: mark.workoutSessionId
        ? 'The day goes back to nothing marked. The workout session itself stays in Movement and in the workout history.'
        : wroteLog
          ? 'The day goes back to nothing marked, and the exercise log entry this mark wrote is removed with it.'
          : 'The day goes back to nothing marked.',
      actions: [
        {
          label: 'Clear it',
          destructive: true,
          onPress: () => {
            setSheet(null);
            void run(() => clearPlanMark(mark), 'Could not clear');
          },
        },
        { label: 'Leave it', onPress: () => setSheet(null) },
      ],
    });
  }

  function renderEntry(entry: PlanEntry, pastDay: boolean) {
    const workout = entry.plan.workoutId ? workouts.find((item) => item.id === entry.plan.workoutId) ?? null : null;
    const canStart = !entry.mark && workout !== null && entry.date === today;
    return (
      <View key={`${entry.plan.id}|${entry.date}`} style={styles.row}>
        <Text style={styles.rowTitle}>{entry.title}</Text>
        <Text style={styles.rowMeta}>{entryStatusLine(entry, today)}</Text>
        {workout && !entry.mark ? <Text style={styles.rowMeta}>{describeWorkout(workout)}</Text> : null}
        <View style={styles.rowActions}>
          {entry.mark ? (
            <TouchableOpacity onPress={() => askUndo(entry)}>
              <Text style={styles.actionText}>Clear mark</Text>
            </TouchableOpacity>
          ) : (
            <>
              {canStart ? (
                <TouchableOpacity style={styles.primaryButton} onPress={() => start(entry)}>
                  <Text style={styles.primaryButtonText}>Start</Text>
                </TouchableOpacity>
              ) : null}
              {!canStart && (pastDay || entry.date === today) ? (
                <TouchableOpacity onPress={() => run(() => markPlanDone(entry.plan, entry.title, entry.date), 'Could not mark')}>
                  <Text style={styles.actionText}>Did it</Text>
                </TouchableOpacity>
              ) : null}
              {pastDay || entry.date === today ? (
                <TouchableOpacity onPress={() => run(() => markPlanSkipped(entry.plan.id, entry.date), 'Could not mark')}>
                  <Text style={styles.actionText}>Skipped</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.bandBox}>
        <Text style={styles.emptyText}>Loading…</Text>
      </View>
    );
  }
  if (errorMessage) {
    return (
      <View style={styles.bandBox}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  const selectedWorkout = form?.draft.workoutId ?? ACTIVITY;

  return (
    <View style={styles.bodyContent}>
      {infoAlertElement}
      <AppActionSheet
        visible={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet?.title}
        message={sheet?.message}
        actions={sheet?.actions ?? []}
      />

      {!form ? (
        <TouchableOpacity style={styles.addButton} onPress={openAdd}>
          <Text style={styles.addButtonText}>+ Plan exercise</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.label}>What</Text>
          <PopoverSelect
            options={workoutOptions}
            selected={selectedWorkout}
            onSelect={(value) => patch({ workoutId: value === ACTIVITY ? null : value })}
            tabColor={tabColor}
            searchable={workouts.length > 8}
          />
          {workouts.length === 0 ? (
            <Text style={styles.helperText}>Workouts are built on Life {'>'} Workouts. Until there is one, type the activity.</Text>
          ) : null}
          {form.draft.workoutId ? null : (
            <AppTextInput
              style={[styles.input, styles.spaced]}
              placeholder="e.g. Walk with the dog"
              value={form.draft.activity}
              onChangeText={(text) => patch({ activity: text })}
            />
          )}

          <Text style={styles.label}>First day</Text>
          <View style={styles.timeRow}>
            <AppTextInput
              style={[styles.input, styles.grow]}
              placeholder="YYYY-MM-DD"
              value={form.draft.startsOn}
              onChangeText={(text) => patch({ startsOn: text })}
            />
            <TouchableOpacity style={styles.pillSmall} onPress={() => patch({ startsOn: today })}>
              <Text style={styles.pillTextSmall}>Today</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Time</Text>
          <View style={styles.pillRow}>
            {[
              { key: true, label: 'At a time' },
              { key: false, label: 'Any time that day' },
            ].map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[styles.pillSmall, form.timed === option.key && styles.pillActive]}
                onPress={() => setForm((current) => (current ? { ...current, timed: option.key } : current))}
              >
                <Text style={[styles.pillTextSmall, form.timed === option.key && styles.pillTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {form.timed ? (
            <View style={[styles.timeRow, styles.spaced]}>
              <AppTextInput
                style={[styles.input, styles.timeInput]}
                placeholder="7"
                keyboardType="number-pad"
                maxLength={2}
                value={form.time.hour}
                onChangeText={(text) => setForm((current) => (current ? { ...current, time: { ...current.time, hour: text } } : current))}
              />
              <Text style={styles.timeSeparator}>:</Text>
              <AppTextInput
                style={[styles.input, styles.timeInput]}
                placeholder="00"
                keyboardType="number-pad"
                maxLength={2}
                value={form.time.minute}
                onChangeText={(text) => setForm((current) => (current ? { ...current, time: { ...current.time, minute: text } } : current))}
              />
              <View style={styles.pillRow}>
                {(['AM', 'PM'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pillSmall, form.time.ampm === option && styles.pillActive]}
                    onPress={() => setForm((current) => (current ? { ...current, time: { ...current.time, ampm: option } } : current))}
                  >
                    <Text style={[styles.pillTextSmall, form.time.ampm === option && styles.pillTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
          {form.timed ? (
            <View style={[styles.pillRow, styles.spaced]}>
              {[
                { key: true, label: 'Remind me' },
                { key: false, label: 'No reminder' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.pillSmall, form.draft.remind === option.key && styles.pillActive]}
                  onPress={() => patch({ remind: option.key })}
                >
                  <Text style={[styles.pillTextSmall, form.draft.remind === option.key && styles.pillTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <Text style={styles.label}>Minutes (optional)</Text>
          <AppTextInput
            style={styles.input}
            placeholder="e.g. 30"
            keyboardType="number-pad"
            value={form.draft.minutes}
            onChangeText={(text) => patch({ minutes: text })}
          />

          <RepeatRulePicker repeat={form.draft.repeat} onChange={(repeat) => patch({ repeat })} startDate={form.draft.startsOn} />

          <Text style={styles.label}>Note (optional)</Text>
          <NotesInput
            style={styles.input}
            placeholder="e.g. before breakfast"
            value={form.draft.note}
            onChangeText={(text) => patch({ note: text })}
          />

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setForm(null)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>{form.editingId ? 'Save changes' : 'Save plan'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Band folds={folds} color={tabColor} id="schedule:exercise:ahead" title="Coming up" icon="calendar-outline">
        {ahead.length === 0 ? (
          <Text style={[styles.emptyText, styles.panelStandalone]}>
            Nothing planned for the next two weeks. Plan a workout from Life {'>'} Workouts or any activity, and its days show here.
          </Text>
        ) : (
          <View style={styles.list}>
            {ahead.map((day) => (
              <View key={day.date} style={styles.dayBlock}>
                <Text style={styles.dayHeading}>{dayLabel(day.date, today)}</Text>
                {day.entries.map((entry) => renderEntry(entry, false))}
              </View>
            ))}
          </View>
        )}
      </Band>

      <Band folds={folds} color={tabColor} id="schedule:exercise:plans" title={`Plans (${livePlans.length})`} icon="barbell-outline">
        {livePlans.length === 0 ? (
          <Text style={[styles.emptyText, styles.panelStandalone]}>No plans yet.</Text>
        ) : (
          <View style={styles.list}>
            {livePlans.map((plan) => (
              <View key={plan.id} style={styles.row}>
                <Text style={styles.rowTitle}>{planTitle(plan, names)}</Text>
                <Text style={styles.rowMeta}>{describePlan(plan)}</Text>
                {plan.atTime ? <Text style={styles.rowMeta}>{plan.remind ? 'Reminder on' : 'No reminder'}</Text> : null}
                {plan.note ? <Text style={styles.rowMeta}>{plan.note}</Text> : null}
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => openEdit(plan)}>
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => askRemove(plan)}>
                    <Text style={styles.actionTextRemove}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </Band>

      <Band folds={folds} color={tabColor} id="schedule:exercise:behind" title="The last two weeks" icon="time-outline">
        {behind.length === 0 ? (
          <Text style={[styles.emptyText, styles.panelStandalone]}>No planned days in the last two weeks.</Text>
        ) : (
          <View style={styles.list}>
            {behind.map((day) => (
              <View key={day.date} style={styles.dayBlock}>
                <Text style={styles.dayHeading}>{dayLabel(day.date, today)}</Text>
                {day.entries.map((entry) => renderEntry(entry, true))}
              </View>
            ))}
          </View>
        )}
        <Text style={[styles.footnote, styles.panelStandalone]}>{PLAN_FOOT}</Text>
      </Band>
    </View>
  );
}

function makeStyles(tabColor: string) {
  const darkText = { textShadowColor: 'transparent', textShadowRadius: 0 } as const;
  return StyleSheet.create({
    actionText: { ...typography.captionEmphasis, color: tabColor, ...textShadow },
    actionTextRemove: { ...typography.captionEmphasis, color: colors.danger, ...textShadow },
    addButton: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    addButtonText: { ...typography.bodyEmphasis, color: colors.primary, ...textShadow },
    bandBox: {
      ...homeBandStyle,
      ...homeBandNoHairlines,
      borderColor: tabColor,
      marginHorizontal: -CONTENT_INSET,
      padding: HOME_BAND_CONTENT_PADDING,
    },
    bodyContent: { gap: HOME_BAND_ACCENT_WIDTH },
    dayBlock: { gap: 8 },
    dayHeading: {
      ...typography.label,
      color: tabColor,
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      ...textShadow,
    },
    emptyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
    errorText: { ...typography.body, color: colors.danger, ...textShadow },
    footnote: { ...typography.caption, color: colors.textMuted, marginTop: 10, ...textShadow },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
    formCard: {
      ...homeBandStyle,
      ...homeBandNoHairlines,
      borderColor: tabColor,
      marginHorizontal: -CONTENT_INSET,
      padding: HOME_BAND_CONTENT_PADDING,
    },
    grow: { flex: 1 },
    helperText: { ...typography.caption, color: tabColor, marginTop: 6, ...textShadow },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surfaceMuted,
      ...typography.body,
      color: tabColor,
      ...textShadow,
    },
    label: { ...typography.label, color: tabColor, marginBottom: 6, marginTop: 12, ...textShadow },
    list: { gap: HOME_BAND_ACCENT_WIDTH },
    panelStandalone: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pillSmall: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.surface,
    },
    pillTextActive: { color: colors.textOnPrimary, ...darkText },
    pillTextSmall: { ...typography.caption, color: tabColor, ...textShadow },
    primaryButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
    primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton, ...darkText },
    row: { borderRadius: 10, backgroundColor: colors.surfaceMuted, padding: 12 },
    rowActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 10 },
    rowMeta: { ...typography.caption, color: tabColor, marginTop: 2, ...textShadow },
    rowTitle: { ...typography.label, color: tabColor, ...textShadow },
    secondaryButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    secondaryButtonText: { ...typography.bodyEmphasis, color: tabColor, ...textShadow },
    spaced: { marginTop: 8 },
    timeInput: { width: 56, textAlign: 'center' },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timeSeparator: { ...typography.label, color: tabColor, ...textShadow },
  });
}
