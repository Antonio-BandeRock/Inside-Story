import { useCallback, useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { NotesInput } from './NotesInput';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { RecordPhotos } from './RecordPhotos';
import { VoiceInputButton } from './VoiceInputButton';
import { TabBand, makeTabBandStyles } from './TabBand';
import { useBandFolds } from '../hooks/useBandFolds';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { getUserConditions } from '../lib/db';
import {
  EQUIPMENT_LABELS,
  EXERCISE_CATEGORIES,
  GENTLE_FILTER_HELP,
  GENTLE_FILTER_LABEL,
  LIBRARY_EXERCISES,
  NO_FILTER,
  ACTIVITY_GUIDELINE,
  equipmentLine,
  exerciseNotesFor,
  matchesFilter,
  noteHeading,
  sessionNotesFor,
  type Equipment,
  type ExerciseCategory,
  type ExerciseFilter,
  type NoteForPerson,
} from '../lib/exerciseLibrary';
import {
  LIBRARY_INTRO,
  WEIGHT_UNITS,
  WORKOUTS_INTRO,
  allExerciseViews,
  blankExerciseDraft,
  customView,
  describeStep,
  describeWorkout,
  draftFromExercise,
  exerciseDraftProblem,
  exerciseMetaLine,
  exerciseRemovalMessage,
  libraryCountLine,
  missingExerciseName,
  moveStep,
  newStepFields,
  resolveExercise,
  stepDraftFrom,
  stepDraftProblem,
  stepDraftToFields,
  workoutNameProblem,
  workoutRemovalMessage,
  type CustomExercise,
  type CustomExerciseDraft,
  type ExerciseView,
  type StepDraft,
  type Workout,
  type WorkoutStep,
} from '../lib/workouts';
import {
  EXERCISE_PHOTO_OWNER,
  addWorkoutStep,
  createWorkout,
  listCustomExercises,
  listWorkouts,
  removeCustomExercise,
  removeWorkout,
  removeWorkoutStep,
  renameWorkout,
  reorderWorkoutSteps,
  saveCustomExercise,
  updateWorkoutStep,
  workoutsUsingExercise,
} from '../lib/workoutsDb';

// Life > Workouts (H11, 1.0.55.1). Direct request, 2026-09-28: "there needs
// to be a workout builder to add exercises and everything about the
// exercises, such as name of exercise, how it is properly performed safely,
// the number of reps, everything."
//
// Two things live here. The exercises, about sixty built in
// (lib/exerciseLibrary.ts) and any the person writes, each opening in place
// to show how it is done, what to watch for, the common mistakes, an easier
// and a harder version and a page that shows it being done. And workouts
// made from them, each exercise carrying its sets, reps or time, weight
// and rest. Movement beside it stays the log of what was done; this is the
// plan of what to do.
//
// Condition notes appear only for conditions the person tracks, cited, and
// never as a rule: the flare-day filter finds gentle exercises and decides
// nothing.

type Props = { tabColor: string };

type WorkoutForm = { id: string | null; name: string; note: string };
type ExerciseForm = { id: string | null; draft: CustomExerciseDraft };
type StepForm = { step: WorkoutStep; draft: StepDraft };

const ALL = 'all';

const CATEGORY_OPTIONS = [{ label: 'Every kind', value: ALL }, ...EXERCISE_CATEGORIES.map((entry) => ({ label: entry.label, value: entry.key }))];
const FORM_CATEGORY_OPTIONS = EXERCISE_CATEGORIES.map((entry) => ({ label: entry.label, value: entry.key }));
const EQUIPMENT_KEYS = (Object.keys(EQUIPMENT_LABELS) as Equipment[]).filter((key) => key !== 'none');
const EQUIPMENT_OPTIONS = [
  { label: 'Any equipment', value: ALL },
  { label: EQUIPMENT_LABELS.none, value: 'none' },
  ...EQUIPMENT_KEYS.map((key) => ({ label: EQUIPMENT_LABELS[key], value: key })).sort((a, b) => a.label.localeCompare(b.label)),
];
const UNIT_OPTIONS = WEIGHT_UNITS.map((unit) => ({ label: unit, value: unit }));

function exerciseKey(view: { source: string; id: string }): string {
  return `${view.source}:${view.id}`;
}

export function WorkoutsSection({ tabColor }: Props) {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [custom, setCustom] = useState<CustomExercise[]>([]);
  const [tracked, setTracked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [workoutForm, setWorkoutForm] = useState<WorkoutForm | null>(null);
  const [exerciseForm, setExerciseForm] = useState<ExerciseForm | null>(null);
  const [stepForm, setStepForm] = useState<StepForm | null>(null);
  const [openExercise, setOpenExercise] = useState<string | null>(null);
  const [filter, setFilter] = useState<ExerciseFilter>(NO_FILTER);
  const [confirm, setConfirm] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);

  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);
  const band = useMemo(() => makeTabBandStyles(tabColor), [tabColor]);
  const folds = useBandFolds();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([listWorkouts(), listCustomExercises(), getUserConditions()])
      .then(([loadedWorkouts, loadedCustom, loadedConditions]) => {
        setWorkouts(loadedWorkouts);
        setCustom(loadedCustom);
        setTracked(loadedConditions);
      })
      .catch((error) => showInfoAlert('Could not load', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const views = useMemo(() => allExerciseViews(custom), [custom]);
  const shown = useMemo(() => views.filter((view) => matchesFilter(view, filter)), [views, filter]);
  const sessionNotes = useMemo(() => sessionNotesFor(tracked), [tracked]);
  const addOptions = useMemo(() => views.map((view) => ({ label: view.name, value: exerciseKey(view) })), [views]);

  function viewFor(key: string): ExerciseView | null {
    const [source, ...rest] = key.split(':');
    return resolveExercise(source === 'custom' ? 'custom' : 'library', rest.join(':'), custom);
  }

  async function saveWorkoutForm() {
    if (!workoutForm) return;
    const others = workouts.filter((workout) => workout.id !== workoutForm.id).map((workout) => workout.name);
    const problem = workoutNameProblem(workoutForm.name, others);
    if (problem) {
      showInfoAlert('Almost there', problem);
      return;
    }
    if (workoutForm.id) await renameWorkout(workoutForm.id, workoutForm.name, workoutForm.note);
    else await createWorkout(workoutForm.name, workoutForm.note);
    setWorkoutForm(null);
    load();
  }

  function confirmRemoveWorkout(workout: Workout) {
    setConfirm({
      title: `Remove ${workout.name}?`,
      message: workoutRemovalMessage(workout),
      actions: [
        {
          label: 'Remove it',
          destructive: true,
          onPress: async () => {
            setConfirm(null);
            await removeWorkout(workout.id);
            load();
          },
        },
        { label: 'Keep it', onPress: () => setConfirm(null) },
      ],
    });
  }

  async function addToWorkout(workout: Workout, view: ExerciseView) {
    await addWorkoutStep(workout.id, newStepFields(view));
    load();
  }

  function chooseWorkoutFor(view: ExerciseView) {
    if (workouts.length === 0) {
      showInfoAlert('No workout yet', 'Build a workout first with + Build a workout at the top, then add this exercise to it.');
      return;
    }
    setConfirm({
      title: `Add ${view.name} to`,
      actions: [
        ...workouts.map((workout) => ({
          label: workout.name,
          onPress: async () => {
            setConfirm(null);
            await addToWorkout(workout, view);
            showInfoAlert('Added', `${view.name} is now the last exercise in ${workout.name}.`);
          },
        })),
        { label: 'Cancel', onPress: () => setConfirm(null) },
      ],
    });
  }

  async function shiftStep(workout: Workout, step: WorkoutStep, direction: -1 | 1) {
    const ids = workout.steps.map((entry) => entry.id);
    const next = moveStep(ids, step.id, direction);
    await reorderWorkoutSteps(workout.id, next);
    load();
  }

  async function saveStepForm() {
    if (!stepForm) return;
    const problem = stepDraftProblem(stepForm.draft);
    if (problem) {
      showInfoAlert('Almost there', problem);
      return;
    }
    await updateWorkoutStep(stepForm.step, stepDraftToFields(stepForm.draft));
    setStepForm(null);
    load();
  }

  async function saveExerciseForm() {
    if (!exerciseForm) return;
    const problem = exerciseDraftProblem(exerciseForm.draft);
    if (problem) {
      showInfoAlert('Almost there', problem);
      return;
    }
    const id = await saveCustomExercise(exerciseForm.id, exerciseForm.draft);
    setExerciseForm(null);
    setOpenExercise(`custom:${id}`);
    load();
  }

  async function confirmRemoveExercise(view: ExerciseView) {
    const usedIn = await workoutsUsingExercise('custom', view.id);
    setConfirm({
      title: `Remove ${view.name}?`,
      message: exerciseRemovalMessage(view.name, usedIn),
      actions: [
        {
          label: 'Remove it',
          destructive: true,
          onPress: async () => {
            setConfirm(null);
            await removeCustomExercise(view.id);
            setOpenExercise(null);
            load();
          },
        },
        { label: 'Keep it', onPress: () => setConfirm(null) },
      ],
    });
  }

  function renderNotes(notes: NoteForPerson[]) {
    return notes.map((note) => (
      <View key={`${note.condition}:${note.source.url}`} style={styles.noteBox}>
        <Text style={styles.noteTitle}>{noteHeading(note)}</Text>
        <Text style={styles.bodyText}>{note.text}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(note.source.url)} activeOpacity={0.7}>
          <Text style={styles.linkText}>{note.source.label}</Text>
        </TouchableOpacity>
      </View>
    ));
  }

  function renderExerciseDetail(view: ExerciseView) {
    const notes = exerciseNotesFor(view.tags, tracked);
    return (
      <View style={styles.detail}>
        <Text style={styles.rowMeta}>{equipmentLine(view.equipment)}{view.gentle ? ` · ${GENTLE_FILTER_LABEL}` : ''}</Text>
        {([
          ['How to do it', view.steps, true],
          ['Doing it safely', view.safety, false],
          ['Common mistakes', view.mistakes, false],
        ] as const)
          .filter(([, items]) => items.length > 0)
          .map(([title, items, numbered]) => (
            <View key={title}>
              <Text style={styles.label}>{title}</Text>
              {items.map((item, index) => (
                <Text key={`${title}:${index}`} style={styles.listText}>
                  {numbered ? `${index + 1}. ` : '• '}
                  {item}
                </Text>
              ))}
            </View>
          ))}
        {view.easier ? (
          <>
            <Text style={styles.label}>Easier</Text>
            <Text style={styles.listText}>{view.easier}</Text>
          </>
        ) : null}
        {view.harder ? (
          <>
            <Text style={styles.label}>Harder</Text>
            <Text style={styles.listText}>{view.harder}</Text>
          </>
        ) : null}
        {view.notes ? (
          <>
            <Text style={styles.label}>Your notes</Text>
            <Text style={styles.listText}>{view.notes}</Text>
          </>
        ) : null}
        {renderNotes(notes)}
        {view.demo ? (
          <TouchableOpacity onPress={() => Linking.openURL(view.demo!.url)} activeOpacity={0.7}>
            <Text style={styles.linkText}>See it done: {view.demo.source}</Text>
          </TouchableOpacity>
        ) : null}
        {view.videoUrl ? (
          <TouchableOpacity onPress={() => Linking.openURL(view.videoUrl!)} activeOpacity={0.7}>
            <Text style={styles.linkText}>Your video link</Text>
          </TouchableOpacity>
        ) : null}
        {view.source === 'custom' ? (
          <RecordPhotos ownerKind={EXERCISE_PHOTO_OWNER} ownerId={view.id} tabColor={tabColor} title={view.name} />
        ) : null}
        <View style={styles.rowActions}>
          <TouchableOpacity onPress={() => chooseWorkoutFor(view)}>
            <Text style={styles.actionText}>Add to a workout</Text>
          </TouchableOpacity>
          {view.source === 'custom' ? (
            <>
              <TouchableOpacity onPress={() => setExerciseForm({ id: view.id, draft: draftFromExercise(view, false) })}>
                <Text style={styles.actionText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmRemoveExercise(view)}>
                <Text style={styles.actionTextRemove}>Remove</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => setExerciseForm({ id: null, draft: draftFromExercise(view, true) })}>
              <Text style={styles.actionText}>Make my own version</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  function renderPill(label: string, on: boolean, onPress: () => void) {
    return (
      <TouchableOpacity key={label} style={[styles.pill, on ? styles.pillOn : null]} onPress={onPress}>
        <Text style={[styles.pillText, on ? styles.pillTextOn : null]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  function renderExerciseForm(form: ExerciseForm) {
    const draft = form.draft;
    const set = (patch: Partial<CustomExerciseDraft>) => setExerciseForm({ ...form, draft: { ...draft, ...patch } });
    const toggleEquipment = (key: Equipment) =>
      set({ equipment: draft.equipment.includes(key) ? draft.equipment.filter((e) => e !== key) : [...draft.equipment, key] });
    return (
      <View style={band.box}>
        <Text style={styles.cardTitle}>{form.id ? 'Change this exercise' : 'An exercise of your own'}</Text>

        <View style={styles.labelRow}>
          <Text style={styles.label}>What is it called</Text>
          <VoiceInputButton onResult={(name) => set({ name })} />
        </View>
        <AppTextInput style={styles.input} value={draft.name} onChangeText={(name) => set({ name })} placeholder="Wall slide" placeholderTextColor={colors.textMuted} maxLength={80} />

        <Text style={styles.label}>Kind</Text>
        <PopoverSelect options={FORM_CATEGORY_OPTIONS} selected={draft.category} onSelect={(value) => set({ category: value as ExerciseCategory })} tabColor={tabColor} />

        <Text style={styles.label}>What it works (optional)</Text>
        <AppTextInput style={styles.input} value={draft.muscles} onChangeText={(muscles) => set({ muscles })} placeholder="Shoulders, upper back" placeholderTextColor={colors.textMuted} maxLength={80} />

        <Text style={styles.label}>Equipment (none ticked means none needed)</Text>
        <View style={styles.pillRow}>{EQUIPMENT_KEYS.map((key) => renderPill(EQUIPMENT_LABELS[key], draft.equipment.includes(key), () => toggleEquipment(key)))}</View>

        <Text style={styles.label}>Counted in</Text>
        <View style={styles.pillRow}>
          {renderPill('Reps', draft.measure === 'reps', () => set({ measure: 'reps' }))}
          {renderPill('Time', draft.measure === 'time', () => set({ measure: 'time' }))}
          {renderPill(draft.perSide ? 'Each side: yes' : 'Each side: no', draft.perSide, () => set({ perSide: !draft.perSide }))}
        </View>
        <View style={styles.numberRow}>
          <View style={styles.numberField}>
            <Text style={styles.label}>Sets</Text>
            <AppTextInput style={styles.input} value={draft.sets} onChangeText={(sets) => set({ sets: sets.replace(/[^0-9]/g, '') })} keyboardType="number-pad" maxLength={2} placeholder="2" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={styles.numberField}>
            <Text style={styles.label}>{draft.measure === 'reps' ? 'Reps' : 'Seconds'}</Text>
            {draft.measure === 'reps' ? (
              <AppTextInput style={styles.input} value={draft.reps} onChangeText={(reps) => set({ reps: reps.replace(/[^0-9]/g, '') })} keyboardType="number-pad" maxLength={3} placeholder="10" placeholderTextColor={colors.textMuted} />
            ) : (
              <AppTextInput style={styles.input} value={draft.seconds} onChangeText={(seconds) => set({ seconds: seconds.replace(/[^0-9]/g, '') })} keyboardType="number-pad" maxLength={5} placeholder="30" placeholderTextColor={colors.textMuted} />
            )}
          </View>
        </View>

        <Text style={styles.label}>How to do it, one step a line</Text>
        <NotesInput join="line" style={[styles.input, styles.multiline]} value={draft.steps} onChangeText={(steps) => set({ steps })} multiline placeholder={'Stand with your back to a wall\nSlide your arms up slowly'} placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>Doing it safely, one point a line (optional)</Text>
        <NotesInput join="line" style={[styles.input, styles.multiline]} value={draft.safety} onChangeText={(safety) => set({ safety })} multiline placeholder="Keep your lower back against the wall" placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>Common mistakes, one a line (optional)</Text>
        <NotesInput join="line" style={[styles.input, styles.multiline]} value={draft.mistakes} onChangeText={(mistakes) => set({ mistakes })} multiline placeholder="Shrugging the shoulders" placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>An easier version (optional)</Text>
        <AppTextInput style={styles.input} value={draft.easier} onChangeText={(easier) => set({ easier })} placeholderTextColor={colors.textMuted} placeholder="Smaller range" />
        <Text style={styles.label}>A harder version (optional)</Text>
        <AppTextInput style={styles.input} value={draft.harder} onChangeText={(harder) => set({ harder })} placeholderTextColor={colors.textMuted} placeholder="Hold a light weight" />

        <View style={styles.pillRow}>{renderPill(draft.gentle ? `${GENTLE_FILTER_LABEL}: yes` : `${GENTLE_FILTER_LABEL}: no`, draft.gentle, () => set({ gentle: !draft.gentle }))}</View>

        <Text style={styles.label}>A video link (optional)</Text>
        <AppTextInput style={styles.input} value={draft.videoUrl} onChangeText={(videoUrl) => set({ videoUrl })} autoCapitalize="none" keyboardType="url" placeholder="https://" placeholderTextColor={colors.textMuted} />
        <Text style={styles.helperText}>Paste the address of a video that shows it being done. Photos can be added once it is saved.</Text>

        <Text style={styles.label}>Notes (optional)</Text>
        <NotesInput style={[styles.input, styles.multiline]} value={draft.notes} onChangeText={(notes) => set({ notes })} multiline placeholder="What my physio said" placeholderTextColor={colors.textMuted} />

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={saveExerciseForm}>
            <Text style={styles.primaryButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setExerciseForm(null)}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderStepForm(form: StepForm) {
    const draft = form.draft;
    const set = (patch: Partial<StepDraft>) => setStepForm({ ...form, draft: { ...draft, ...patch } });
    return (
      <View style={styles.inlineForm}>
        <Text style={styles.label}>Counted in</Text>
        <View style={styles.pillRow}>
          {renderPill('Reps', draft.measure === 'reps', () => set({ measure: 'reps' }))}
          {renderPill('Time', draft.measure === 'time', () => set({ measure: 'time' }))}
          {renderPill(draft.perSide ? 'Each side: yes' : 'Each side: no', draft.perSide, () => set({ perSide: !draft.perSide }))}
        </View>
        <View style={styles.numberRow}>
          <View style={styles.numberField}>
            <Text style={styles.label}>Sets</Text>
            <AppTextInput style={styles.input} value={draft.sets} onChangeText={(sets) => set({ sets: sets.replace(/[^0-9]/g, '') })} keyboardType="number-pad" maxLength={2} placeholder="3" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={styles.numberField}>
            <Text style={styles.label}>{draft.measure === 'reps' ? 'Reps' : 'Seconds'}</Text>
            {draft.measure === 'reps' ? (
              <AppTextInput style={styles.input} value={draft.reps} onChangeText={(reps) => set({ reps: reps.replace(/[^0-9]/g, '') })} keyboardType="number-pad" maxLength={3} placeholder="10" placeholderTextColor={colors.textMuted} />
            ) : (
              <AppTextInput style={styles.input} value={draft.seconds} onChangeText={(seconds) => set({ seconds: seconds.replace(/[^0-9]/g, '') })} keyboardType="number-pad" maxLength={5} placeholder="30" placeholderTextColor={colors.textMuted} />
            )}
          </View>
        </View>
        <View style={styles.numberRow}>
          <View style={styles.numberField}>
            <Text style={styles.label}>Weight (optional)</Text>
            <AppTextInput style={styles.input} value={draft.weight} onChangeText={(weight) => set({ weight: weight.replace(/[^0-9.,]/g, '') })} keyboardType="decimal-pad" maxLength={6} placeholder="8" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={styles.numberField}>
            <Text style={styles.label}>Unit</Text>
            <PopoverSelect options={UNIT_OPTIONS} selected={draft.weightUnit} onSelect={(weightUnit) => set({ weightUnit })} tabColor={tabColor} minWidth={64} />
          </View>
        </View>
        <Text style={styles.label}>Rest between sets, in seconds (optional)</Text>
        <AppTextInput style={styles.input} value={draft.restSeconds} onChangeText={(restSeconds) => set({ restSeconds: restSeconds.replace(/[^0-9]/g, '') })} keyboardType="number-pad" maxLength={4} placeholder="60" placeholderTextColor={colors.textMuted} />
        <Text style={styles.label}>A note for this workout (optional)</Text>
        <NotesInput style={styles.input} value={draft.note} onChangeText={(note) => set({ note })} placeholder="Slow on the way down" placeholderTextColor={colors.textMuted} maxLength={200} />
        <View style={styles.formActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={saveStepForm}>
            <Text style={styles.primaryButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setStepForm(null)}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) return <View style={band.boxMuted}><Text style={styles.bodyText}>Loading…</Text></View>;

  return (
    <View style={band.column}>
      {infoAlertElement}
      <AppActionSheet visible={confirm !== null} onClose={() => setConfirm(null)} title={confirm?.title} message={confirm?.message} actions={confirm?.actions ?? []} />

      <View style={band.box}>
        <Text style={styles.cardTitle}>Workouts</Text>
        <Text style={styles.bodyText}>{WORKOUTS_INTRO}</Text>
        {!workoutForm && !exerciseForm ? (
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setWorkoutForm({ id: null, name: '', note: '' })}>
              <Text style={styles.primaryButtonText}>+ Build a workout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setExerciseForm({ id: null, draft: blankExerciseDraft() })}>
              <Text style={styles.secondaryButtonText}>+ An exercise of your own</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {renderNotes(sessionNotes)}
        <TouchableOpacity onPress={() => showInfoAlert('How much activity', ACTIVITY_GUIDELINE.text)} activeOpacity={0.7}>
          <Text style={styles.linkText}>How much activity the WHO suggests</Text>
        </TouchableOpacity>
      </View>

      {workoutForm ? (
        <View style={band.box}>
          <Text style={styles.cardTitle}>{workoutForm.id ? 'Change this workout' : 'A new workout'}</Text>
          <View style={styles.labelRow}>
            <Text style={styles.label}>What is it called</Text>
            <VoiceInputButton onResult={(name) => setWorkoutForm({ ...workoutForm, name })} />
          </View>
          <AppTextInput style={styles.input} value={workoutForm.name} onChangeText={(name) => setWorkoutForm({ ...workoutForm, name })} placeholder="Monday strength" placeholderTextColor={colors.textMuted} maxLength={60} />
          <Text style={styles.label}>A note (optional)</Text>
          <NotesInput style={styles.input} value={workoutForm.note} onChangeText={(note) => setWorkoutForm({ ...workoutForm, note })} placeholder="Warm up with a walk first" placeholderTextColor={colors.textMuted} maxLength={200} />
          <Text style={styles.helperText}>Save it, then open it to add exercises from the list below or from your own.</Text>
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={saveWorkoutForm}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setWorkoutForm(null)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {exerciseForm ? renderExerciseForm(exerciseForm) : null}

      {workouts.length === 0 && !workoutForm ? (
        <View style={band.box}>
          <Text style={styles.bodyText}>No workouts yet. A short first one could be three exercises from the list below, done twice through.</Text>
        </View>
      ) : null}

      {workouts.map((workout) => (
        <TabBand key={workout.id} folds={folds} color={tabColor} id={`life:workouts:${workout.id}`} title={workout.name} icon="barbell-outline" count={workout.steps.length}>
          <Text style={styles.rowMeta}>{describeWorkout(workout)}</Text>
          {workout.note ? <Text style={styles.rowMeta}>{workout.note}</Text> : null}
          {workout.steps.length > 0 ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push({ pathname: '/workout', params: { id: workout.id } })}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Start this workout</Text>
            </TouchableOpacity>
          ) : null}

          {workout.steps.map((step, index) => {
            const view = resolveExercise(step.source, step.exerciseId, custom);
            const name = view ? view.name : missingExerciseName(step);
            const editing = stepForm?.step.id === step.id;
            return (
              <View key={step.id} style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>
                    {index + 1}. {name}
                  </Text>
                  <Text style={styles.rowMeta}>{describeStep(step, view)}</Text>
                  {step.note ? <Text style={styles.rowMeta}>{step.note}</Text> : null}
                  {editing && stepForm ? renderStepForm(stepForm) : (
                    <View style={styles.rowActions}>
                      {index > 0 ? (
                        <TouchableOpacity onPress={() => shiftStep(workout, step, -1)}>
                          <Text style={styles.actionText}>Up</Text>
                        </TouchableOpacity>
                      ) : null}
                      {index < workout.steps.length - 1 ? (
                        <TouchableOpacity onPress={() => shiftStep(workout, step, 1)}>
                          <Text style={styles.actionText}>Down</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity onPress={() => setStepForm({ step, draft: stepDraftFrom(step, view) })}>
                        <Text style={styles.actionText}>Sets and reps</Text>
                      </TouchableOpacity>
                      {view ? (
                        <TouchableOpacity onPress={() => view && showInfoAlert(view.name, [view.steps.map((line, i) => `${i + 1}. ${line}`).join('\n'), view.safety.length ? `\nDoing it safely\n${view.safety.map((line) => `• ${line}`).join('\n')}` : ''].join('\n'))}>
                          <Text style={styles.actionText}>How to do it</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity onPress={async () => { await removeWorkoutStep(step); load(); }}>
                        <Text style={styles.actionTextRemove}>Take out</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          <Text style={styles.label}>Add an exercise</Text>
          <PopoverSelect
            options={addOptions}
            selected={null}
            placeholder="Pick one to add at the end"
            searchable
            searchPlaceholder="Search exercises"
            onSelect={(value) => {
              const view = viewFor(value);
              if (view) void addToWorkout(workout, view);
            }}
            tabColor={tabColor}
          />

          <View style={styles.rowActions}>
            <TouchableOpacity onPress={() => setWorkoutForm({ id: workout.id, name: workout.name, note: workout.note ?? '' })}>
              <Text style={styles.actionText}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmRemoveWorkout(workout)}>
              <Text style={styles.actionTextRemove}>Remove</Text>
            </TouchableOpacity>
          </View>
        </TabBand>
      ))}

      <TabBand folds={folds} color={tabColor} id="life:workouts:library" title="Exercises" icon="body-outline" count={views.length}>
        <Text style={styles.bodyText}>{LIBRARY_INTRO}</Text>
        <Text style={styles.label}>Search</Text>
        <AppTextInput style={styles.input} value={filter.query} onChangeText={(query) => setFilter({ ...filter, query })} placeholder="Squat, shoulders, band" placeholderTextColor={colors.textMuted} />
        <View style={styles.numberRow}>
          <View style={styles.numberField}>
            <Text style={styles.label}>Kind</Text>
            <PopoverSelect options={CATEGORY_OPTIONS} selected={filter.category} onSelect={(value) => setFilter({ ...filter, category: value as ExerciseFilter['category'] })} tabColor={tabColor} />
          </View>
          <View style={styles.numberField}>
            <Text style={styles.label}>Equipment</Text>
            <PopoverSelect options={EQUIPMENT_OPTIONS} selected={filter.equipment} onSelect={(value) => setFilter({ ...filter, equipment: value as ExerciseFilter['equipment'] })} tabColor={tabColor} />
          </View>
        </View>
        <View style={styles.pillRow}>
          {renderPill(GENTLE_FILTER_LABEL, filter.gentleOnly, () => setFilter({ ...filter, gentleOnly: !filter.gentleOnly }))}
          <TouchableOpacity onPress={() => showInfoAlert(GENTLE_FILTER_LABEL, GENTLE_FILTER_HELP)} activeOpacity={0.7} style={styles.pillHelp}>
            <Text style={styles.actionText}>What this means</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.rowMeta}>{libraryCountLine(shown.length, views.length)}</Text>

        {shown.map((view) => {
          const key = exerciseKey(view);
          const open = openExercise === key;
          return (
            <View key={key} style={styles.row}>
              <View style={styles.rowMain}>
                <TouchableOpacity onPress={() => setOpenExercise(open ? null : key)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ expanded: open }}>
                  <Text style={styles.rowTitle}>{view.name}</Text>
                  <Text style={styles.rowMeta}>{exerciseMetaLine(view)}</Text>
                </TouchableOpacity>
                {open ? renderExerciseDetail(view) : null}
              </View>
            </View>
          );
        })}
      </TabBand>

      {custom.some((exercise) => exercise.archivedAt != null) ? (
        <TabBand folds={folds} color={tabColor} id="life:workouts:retired" title="Exercises taken off the list" icon="archive-outline" count={custom.filter((exercise) => exercise.archivedAt != null).length}>
          <Text style={styles.bodyText}>Still in a workout, so kept. They no longer show among the exercises to add.</Text>
          {custom
            .filter((exercise) => exercise.archivedAt != null)
            .map((exercise) => {
              const view = customView(exercise);
              return (
                <View key={exercise.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowTitle}>{view.name}</Text>
                    <Text style={styles.rowMeta}>{exerciseMetaLine(view)}</Text>
                  </View>
                </View>
              );
            })}
        </TabBand>
      ) : null}
    </View>
  );
}

export const WORKOUTS_HELP_SECTIONS = [
  {
    heading: 'What this is',
    body: `A list of ${LIBRARY_EXERCISES.length} exercises, each with how to do it, what to watch for, the common mistakes, an easier and a harder version and a page that shows it being done. Add exercises you write yourself, with photos and a video link, then build workouts from any of them.`,
  },
  {
    heading: 'Building a workout',
    body: 'Build a workout, open it, and add exercises in the order you do them. Each one carries its sets, reps or time, weight, rest between sets and a note, so the same exercise can be heavy in one workout and light in another. Up and Down change the order.',
  },
  {
    heading: 'Doing a workout',
    body: 'Start this workout shows one set at a time: what the plan asks for, what you did last time, and a counter that starts at the plan, so a set done as planned is one press of Done. Rest counts down by itself and the phone buzzes when it is over. Skip a set or the rest of an exercise, or stop part way. Nothing is saved until the end, where planned and done sit side by side, and saving adds one entry to your exercise log named for the workout.',
  },
  {
    heading: 'Notes for your conditions',
    body: 'A condition you track in Profile may bring a short cited note to an exercise or to the top of this area. A note is something to know, never a rule, and never a treatment. Gentle on a flare day finds exercises that ask less of the body; it decides nothing for you.',
  },
  {
    heading: 'Removing things',
    body: 'Removing a workout leaves every exercise in it where it was. An exercise you wrote that no workout uses is removed; one a workout still uses is taken off the list and kept, so the workout still names it.',
  },
  {
    heading: 'Movement beside it',
    body: 'Movement is what the phone recorded you doing. Workouts is what you plan to do.',
  },
];

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    cardTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 8, ...textShadow },
    bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
    listText: { ...typography.body, color: colors.textSecondary, marginTop: 4, ...textShadow },
    helperText: { ...typography.caption, color: colors.textMuted, marginTop: 6, marginBottom: 4, ...textShadow },
    linkText: { ...typography.caption, color: tabColor, marginTop: 8, textDecorationLine: 'underline', ...textShadow },

    label: { ...typography.label, color: colors.menuLabelMuted, marginTop: 12, marginBottom: 4, ...textShadow },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    input: {
      backgroundColor: colors.surfaceMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary,
    },
    multiline: { minHeight: 80, textAlignVertical: 'top' },
    inlineForm: {
      marginTop: 10, paddingHorizontal: 12, paddingBottom: 12, borderRadius: 10,
      backgroundColor: colors.surfaceMuted, borderLeftWidth: 3, borderLeftColor: tabColor,
    },
    numberRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    numberField: { flexGrow: 1, flexBasis: 120 },

    noteBox: {
      marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: colors.surfaceMuted,
      borderLeftWidth: 3, borderLeftColor: tabColor,
    },
    noteTitle: { ...typography.label, color: colors.textPrimary, marginBottom: 4, ...textShadow },
    detail: { marginTop: 6 },

    row: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border,
    },
    rowMain: { flex: 1 },
    rowTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
    rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
    rowActions: { flexDirection: 'row', gap: 14, marginTop: 10, flexWrap: 'wrap' },
    pillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' },
    pill: {
      backgroundColor: colors.surfaceMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 8, paddingHorizontal: 10,
    },
    pillOn: { backgroundColor: tabColor, borderColor: tabColor },
    pillText: { ...typography.caption, color: colors.textMuted, ...textShadow },
    pillTextOn: { color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
    pillHelp: { paddingVertical: 8, paddingHorizontal: 4 },
    actionText: { ...typography.caption, color: tabColor, ...textShadow },
    actionTextRemove: { ...typography.caption, color: colors.danger, ...textShadow },

    formActions: { flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' },
    primaryButton: {
      backgroundColor: colors.buttonColor, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18,
      alignItems: 'center', marginTop: 12, ...BUTTON_SHADOW,
    },
    primaryButtonText: { ...typography.body, color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
    secondaryButton: {
      backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', marginTop: 12,
    },
    secondaryButtonText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  });
}
