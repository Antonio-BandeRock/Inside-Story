import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { VoiceInputButton } from './VoiceInputButton';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  CHECK_CADENCES,
  describeOccasionHours,
  describeReminderDays,
  describeRoutineReminder,
  describeRoutineStanding,
  findOccasion,
  formatHour,
  formatReminderClock,
  moveRoutineStep,
  occasionChoices,
  REMINDER_DAY_NAMES,
  routineOccasionLabel,
  suggestedOccasion,
  toggleReminderDay,
  MAX_CHECK_NAME,
  MAX_OCCASION_NAME,
  MAX_ROUTINE_NAME,
  MAX_STEP_DETAIL,
  MAX_STEP_TEXT,
  type CheckCadence,
  type CustomOccasion,
  type DoneCheck,
  type Routine,
  type RoutineOccasion,
} from '../lib/routines';
import {
  addRoutineStep,
  createDoneCheck,
  createRoutine,
  createRoutineOccasion,
  deleteRoutine,
  deleteRoutineOccasion,
  deleteRoutineStep,
  getDoneChecks,
  getRoutineOccasions,
  getRoutines,
  moveRoutine,
  saveStepOrder,
  setRoutineReminder,
  updateRoutine,
  updateRoutineOccasion,
  updateRoutineStep,
} from '../lib/routinesDb';
import { syncReminderNotifications } from '../lib/reminderNotifications';

// Routines: an order you do not want to hold in your head.
//
// Life's ninth area, 2026-09-17, from the daily-living program (CLAUDE.md
// item 28). This screen is where a routine is built and kept. Walking it is a
// screen of its own, app/routine.tsx, because the two are opposite jobs:
// here you want to see all nine steps at once to get the order right, and
// there you must see exactly one.
//
// Two things get made here that used to have to be made somewhere else, both
// from the same 2026-09-17 correction.
//
// "When it happens" is an open list. "There needs to be a way for them to add
// a new When it happens so they can create a routine specific to something
// that isn't on the list, and when they create it, it can then be something
// that can be selected in the list again if they ever create another routine
// for work for instance that has a lot of routines." Something else is a
// place to put one routine and no place at all to put six, so the picker
// carries a way to make a new one, and the new one is there next time.
//
// And a check can be made here, on the step that does it, rather than only in
// Did I Do It: "Did I Do it should be related to Routines, not treated
// separately." Making a check in one screen so it can be attached in another
// is exactly the separation that was wrong.

type Props = { tabColor: string };

// Sentinel values for the two picker rows that open a form instead of
// choosing something. They are not ids and never reach the database.
const ADD_OCCASION = '__add_occasion__';
const ADD_CHECK = '__add_check__';
const NO_CHECK = 'none';
const ANY_HOUR = 'any';
const NO_NUDGE = 'off';

type RoutineForm = {
  id: string | null;
  name: string;
  occasion: RoutineOccasion;
  /** 'HH:mm', or null for a routine nothing speaks about. */
  reminderTime: string | null;
  reminderDays: number[];
};
type OccasionForm = { id: string | null; name: string; hourFrom: number | null; hourTo: number | null };
type StepForm = {
  routineId: string;
  id: string | null;
  text: string;
  detail: string;
  checkId: string | null;
};
type CheckForm = { name: string; cadence: CheckCadence };

const HOUR_OPTIONS = [
  { label: 'Any time', value: ANY_HOUR },
  ...Array.from({ length: 24 }, (unused, hour) => ({ label: formatHour(hour), value: String(hour) })),
];

function hourValue(hour: number | null): string {
  return hour === null ? ANY_HOUR : String(hour);
}

function readHour(value: string): number | null {
  return value === ANY_HOUR ? null : Number(value);
}

// The nudge picker. Its own list rather than HOUR_OPTIONS above, because
// the empty choice means a different thing here: no hours on an occasion is
// a place rather than a time, and no hour here is silence.
const NUDGE_HOUR_OPTIONS = [
  { label: 'No nudge', value: NO_NUDGE },
  ...Array.from({ length: 24 }, (unused, hour) => ({ label: formatHour(hour), value: String(hour) })),
];

// Five-minute steps. Sixty rows for a reminder somebody is setting for
// themselves is a list to scroll rather than a choice to make, and nobody
// needs their morning routine to start at 7:03.
const NUDGE_MINUTE_OPTIONS = Array.from({ length: 12 }, (unused, index) => ({
  label: `:${String(index * 5).padStart(2, '0')}`,
  value: String(index * 5),
}));

function nudgeHourValue(time: string | null): string {
  return time ? String(Number(time.split(':')[0])) : NO_NUDGE;
}

function nudgeMinuteValue(time: string | null): string {
  return time ? String(Number(time.split(':')[1])) : '0';
}

function buildTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function RoutinesSection({ tabColor }: Props) {
  const router = useRouter();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [checks, setChecks] = useState<DoneCheck[]>([]);
  const [occasions, setOccasions] = useState<CustomOccasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<RoutineForm | null>(null);
  const [occasionForm, setOccasionForm] = useState<OccasionForm | null>(null);
  const [stepForm, setStepForm] = useState<StepForm | null>(null);
  const [checkForm, setCheckForm] = useState<CheckForm | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message?: string;
    actions: AppActionSheetAction[];
  } | null>(null);

  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getRoutines(true), getDoneChecks(true), getRoutineOccasions()])
      .then(([loadedRoutines, loadedChecks, loadedOccasions]) => {
        setRoutines(loadedRoutines);
        setChecks(loadedChecks);
        setOccasions(loadedOccasions);
      })
      .catch((error) => showInfoAlert('Could not load', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const now = new Date();
  const fits = suggestedOccasion(now, occasions);

  // Everything there is to pick from, the person's own first, with the way
  // to make another at the end where a new thing belongs.
  const occasionOptions = useMemo(
    () => [
      ...occasionChoices(occasions).map((entry) => ({ label: entry.label, value: entry.key })),
      { label: '+ Add a new one', value: ADD_OCCASION },
    ],
    [occasions],
  );

  const chosenOccasion = form ? findOccasion(form.occasion, occasions) : null;

  // Checks offered when attaching a step. "Records nothing" leads, because it
  // is what most steps are and the list would otherwise read as a question
  // every step has to answer. Making one is at the end, so a check can be
  // invented on the step that does it rather than in another screen first.
  const checkOptions = useMemo(
    () => [
      { label: 'Records nothing', value: NO_CHECK },
      ...checks.filter((check) => check.active).map((check) => ({ label: check.name, value: check.id })),
      { label: '+ Add a new check', value: ADD_CHECK },
    ],
    [checks],
  );

  const cadenceOptions = useMemo(
    () => CHECK_CADENCES.map((entry) => ({ label: entry.label, value: entry.key })),
    [],
  );

  async function saveRoutine() {
    if (!form) return;
    if (!form.name.trim()) {
      showInfoAlert('Almost there', 'Give it a name you will recognise, like "Morning" or "Leaving the house".');
      return;
    }
    let id = form.id;
    if (id) await updateRoutine(id, form.name, form.occasion);
    else id = await createRoutine(form.name, form.occasion);
    // The reminder is written whether or not there is one, so that clearing
    // it clears the row as well as the form, and reconciled straight after,
    // so the notification is on the phone before this screen has redrawn.
    if (id) {
      await setRoutineReminder(id, form.reminderTime, form.reminderDays, form.reminderTime !== null);
      void syncReminderNotifications();
    }
    setForm(null);
    setOccasionForm(null);
    load();
  }

  /** A new "when it happens", or a rename of one already made. Saving picks
   *  it for the routine being written, since somebody who just typed Work
   *  meant this routine to be a Work one. */
  async function saveOccasion() {
    if (!occasionForm || !form) return;
    if (!occasionForm.name.trim()) {
      showInfoAlert('Almost there', 'Give it a name you would use out loud, like "Work" or "The school run".');
      return;
    }
    if (occasionForm.id) {
      await updateRoutineOccasion(occasionForm.id, occasionForm.name, occasionForm.hourFrom, occasionForm.hourTo);
      setForm({ ...form, occasion: occasionForm.id });
    } else {
      const id = await createRoutineOccasion(occasionForm.name, occasionForm.hourFrom, occasionForm.hourTo);
      if (id) setForm({ ...form, occasion: id });
    }
    setOccasionForm(null);
    setOccasions(await getRoutineOccasions());
  }

  function confirmRemoveOccasion(entry: CustomOccasion) {
    setConfirm({
      title: `Remove ${entry.name}?`,
      message: 'Routines listed under it go back to Something else. None of them are deleted.',
      actions: [
        {
          label: 'Remove it',
          destructive: true,
          onPress: async () => {
            setConfirm(null);
            await deleteRoutineOccasion(entry.id);
            setOccasionForm(null);
            if (form) setForm({ ...form, occasion: 'other' });
            setOccasions(await getRoutineOccasions());
            load();
          },
        },
        { label: 'Keep it', onPress: () => setConfirm(null) },
      ],
    });
  }

  async function saveStep() {
    if (!stepForm) return;
    if (!stepForm.text.trim()) {
      showInfoAlert('Almost there', 'A step needs the thing to do, said the way you would say it to yourself.');
      return;
    }
    const checkId = stepForm.checkId === NO_CHECK ? null : stepForm.checkId;
    if (stepForm.id) await updateRoutineStep(stepForm.id, stepForm.text, stepForm.detail, checkId);
    else await addRoutineStep(stepForm.routineId, stepForm.text, stepForm.detail, checkId);
    setStepForm(null);
    setCheckForm(null);
    load();
  }

  /** A check made from inside the step that does it, and attached to that
   *  step straight away. */
  async function saveCheck() {
    if (!checkForm || !stepForm) return;
    if (!checkForm.name.trim()) {
      showInfoAlert('Almost there', 'Name it as the question you will be asking: "Took my pill".');
      return;
    }
    const id = await createDoneCheck(checkForm.name, checkForm.cadence);
    setChecks(await getDoneChecks(true));
    if (id) setStepForm({ ...stepForm, checkId: id });
    setCheckForm(null);
  }

  async function shiftStep(routine: Routine, index: number, direction: -1 | 1) {
    const reordered = moveRoutineStep(routine.steps, index, index + direction);
    if (reordered === routine.steps) return;
    await saveStepOrder(reordered);
    load();
  }

  function confirmRemoveRoutine(routine: Routine) {
    setConfirm({
      title: `Remove ${routine.name}?`,
      message: 'The steps go with it. Anything already recorded against a check stays where it is.',
      actions: [
        {
          label: 'Remove it',
          destructive: true,
          onPress: async () => {
            setConfirm(null);
            await deleteRoutine(routine.id);
            load();
          },
        },
        { label: 'Keep it', onPress: () => setConfirm(null) },
      ],
    });
  }

  if (loading) return <Text style={[styles.bodyText, styles.panelStandalone]}>Loading…</Text>;

  return (
    <>
      {infoAlertElement}
      <AppActionSheet
        visible={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        message={confirm?.message}
        actions={confirm?.actions ?? []}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Routines</Text>
        <Text style={styles.bodyText}>
          An order you do not want to hold in your head. Walking one shows a single step at a time, so there is
          no list to keep your place in, and anything worth remembering afterwards gets checked off as you go.
        </Text>
        {!form ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setOccasionForm(null);
              setForm({ id: null, name: '', occasion: fits ?? 'other', reminderTime: null, reminderDays: [] });
            }}
          >
            <Text style={styles.primaryButtonText}>+ Add a routine</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {form ? (
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>{form.id ? 'Change this routine' : 'A new routine'}</Text>

          <View style={styles.labelRow}>
            <Text style={styles.label}>What is it called</Text>
            <VoiceInputButton onResult={(text) => setForm({ ...form, name: text })} />
          </View>
          <AppTextInput
            style={styles.input}
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            placeholder="Morning"
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_ROUTINE_NAME}
          />

          <Text style={styles.label}>When it happens</Text>
          <PopoverSelect
            options={occasionOptions}
            selected={form.occasion}
            onSelect={(value) => {
              if (value === ADD_OCCASION) {
                setOccasionForm({ id: null, name: '', hourFrom: null, hourTo: null });
                return;
              }
              setOccasionForm(null);
              setForm({ ...form, occasion: value as RoutineOccasion });
            }}
            tabColor={tabColor}
          />
          {chosenOccasion?.example ? (
            <Text style={styles.helperText}>{chosenOccasion.example}</Text>
          ) : null}
          <Text style={styles.helperText}>
            This decides nothing but the order they are listed in. Nothing goes off because of it: the nudge
            below is the only thing that speaks. If what you need is not on the list, add it once and it is
            there for every routine after this one.
          </Text>

          {chosenOccasion?.mine && !occasionForm ? (
            <View style={styles.rowActions}>
              <TouchableOpacity
                onPress={() => {
                  const entry = occasions.find((one) => one.id === form.occasion);
                  if (!entry) return;
                  setOccasionForm({
                    id: entry.id,
                    name: entry.name,
                    hourFrom: entry.hourFrom,
                    hourTo: entry.hourTo,
                  });
                }}
              >
                <Text style={styles.actionText}>Change {chosenOccasion.label}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const entry = occasions.find((one) => one.id === form.occasion);
                  if (entry) confirmRemoveOccasion(entry);
                }}
              >
                <Text style={styles.actionTextRemove}>Remove it</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {occasionForm ? (
            <View style={styles.inlineForm}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  {occasionForm.id ? 'Change this one' : 'A new when it happens'}
                </Text>
                <VoiceInputButton onResult={(name) => setOccasionForm({ ...occasionForm, name })} />
              </View>
              <AppTextInput
                style={styles.input}
                value={occasionForm.name}
                onChangeText={(name) => setOccasionForm({ ...occasionForm, name })}
                placeholder="Work"
                placeholderTextColor={colors.textMuted}
                maxLength={MAX_OCCASION_NAME}
              />

              <Text style={styles.label}>From (optional)</Text>
              <PopoverSelect
                options={HOUR_OPTIONS}
                selected={hourValue(occasionForm.hourFrom)}
                onSelect={(value) => setOccasionForm({ ...occasionForm, hourFrom: readHour(value) })}
                tabColor={tabColor}
              />
              <Text style={styles.label}>Until (optional)</Text>
              <PopoverSelect
                options={HOUR_OPTIONS}
                selected={hourValue(occasionForm.hourTo)}
                onSelect={(value) => setOccasionForm({ ...occasionForm, hourTo: readHour(value) })}
                tabColor={tabColor}
              />
              <Text style={styles.helperText}>
                {describeOccasionHours(occasionForm.hourFrom, occasionForm.hourTo) ??
                  'Leave the hours alone for something that is about a place rather than a time. Give it hours and routines listed under it come to the top of the list while the clock is inside them.'}
              </Text>

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.primaryButton} onPress={saveOccasion}>
                  <Text style={styles.primaryButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setOccasionForm(null)}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* The reminder that starts it, 1.0.39.22, and the one thing a
              routine could not do before: be remembered by anything other
              than the person who wrote it. An hour is the whole of the
              decision, since a routine given no time is simply one nothing
              speaks about. */}
          <Text style={styles.label}>A nudge to start it</Text>
          <View style={styles.clockRow}>
            <PopoverSelect
              options={NUDGE_HOUR_OPTIONS}
              selected={nudgeHourValue(form.reminderTime)}
              onSelect={(value) =>
                setForm({
                  ...form,
                  reminderTime:
                    value === NO_NUDGE
                      ? null
                      : buildTime(Number(value), Number(nudgeMinuteValue(form.reminderTime))),
                })
              }
              tabColor={tabColor}
            />
            {form.reminderTime ? (
              <PopoverSelect
                options={NUDGE_MINUTE_OPTIONS}
                selected={nudgeMinuteValue(form.reminderTime)}
                minWidth={64}
                onSelect={(value) =>
                  setForm({
                    ...form,
                    reminderTime: buildTime(Number(nudgeHourValue(form.reminderTime)), Number(value)),
                  })
                }
                tabColor={tabColor}
              />
            ) : null}
          </View>

          {form.reminderTime ? (
            <>
              <Text style={styles.label}>On these days</Text>
              <View style={styles.dayRow}>
                {REMINDER_DAY_NAMES.map((name, day) => {
                  const on = form.reminderDays.length === 0 || form.reminderDays.includes(day);
                  return (
                    <TouchableOpacity
                      key={name}
                      style={[styles.dayPill, on ? styles.dayPillOn : null]}
                      onPress={() => setForm({ ...form, reminderDays: toggleReminderDay(form.reminderDays, day) })}
                    >
                      <Text style={[styles.dayPillText, on ? styles.dayPillTextOn : null]}>{name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.helperText}>
                {`At ${formatReminderClock(form.reminderTime)}, ${describeReminderDays(form.reminderDays)}. Tapping it opens the walk at the first step. It never walks anything by itself, and a day you have already finished it stays quiet.`}
              </Text>
            </>
          ) : (
            <Text style={styles.helperText}>
              Leave this alone for a routine you reach for yourself. Give it a time and the phone says the
              name of it on the days you pick, and tapping that opens the walk.
            </Text>
          )}

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={saveRoutine}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setForm(null);
                setOccasionForm(null);
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {routines.length === 0 && !form ? (
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            Nothing here yet. A first one worth trying is Morning, with the three or four things that only work
            if they happen early.
          </Text>
        </View>
      ) : null}

      {routines.map((routine, position) => {
        const open = openId === routine.id;
        return (
          <View key={routine.id} style={[styles.card, routine.active ? null : styles.dimmed]}>
            <Text style={styles.cardTitle}>{routine.name}</Text>
            <Text style={styles.rowMeta}>
              {routineOccasionLabel(routine.occasion, occasions)}. {describeRoutineStanding(routine, now)}
            </Text>
            {describeRoutineReminder(routine) ? (
              <Text style={styles.rowMeta}>{describeRoutineReminder(routine)}</Text>
            ) : null}

            {routine.steps.length > 0 ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push({ pathname: '/routine', params: { id: routine.id } })}
              >
                <Text style={styles.primaryButtonText}>Walk it</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.rowActions}>
              <TouchableOpacity onPress={() => setOpenId(open ? null : routine.id)}>
                <Text style={styles.actionText}>
                  {open ? 'Hide steps' : routine.steps.length === 0 ? 'Add the steps' : 'Steps'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setOccasionForm(null);
                  setForm({
                    id: routine.id,
                    name: routine.name,
                    occasion: routine.occasion,
                    reminderTime: routine.reminderTime,
                    reminderDays: routine.reminderDays,
                  });
                }}
              >
                <Text style={styles.actionText}>Change</Text>
              </TouchableOpacity>
              {position > 0 ? (
                <TouchableOpacity onPress={async () => { await moveRoutine(routine.id, -1); load(); }}>
                  <Text style={styles.actionText}>Move up</Text>
                </TouchableOpacity>
              ) : null}
              {position < routines.length - 1 ? (
                <TouchableOpacity onPress={async () => { await moveRoutine(routine.id, 1); load(); }}>
                  <Text style={styles.actionText}>Move down</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => confirmRemoveRoutine(routine)}>
                <Text style={styles.actionTextRemove}>Remove</Text>
              </TouchableOpacity>
            </View>

            {open ? (
              <>
                {routine.steps.map((step, index) => {
                  const attached = step.checkId
                    ? checks.find((check) => check.id === step.checkId)?.name ?? null
                    : null;
                  return (
                    <View key={step.id} style={styles.row}>
                      <View style={styles.rowMain}>
                        <Text style={styles.rowTitle}>
                          {index + 1}. {step.text}
                        </Text>
                        {step.detail ? <Text style={styles.rowMeta}>{step.detail}</Text> : null}
                        {attached ? <Text style={styles.rowMeta}>Check off here: {attached}</Text> : null}
                        <View style={styles.rowActions}>
                          {index > 0 ? (
                            <TouchableOpacity onPress={() => shiftStep(routine, index, -1)}>
                              <Text style={styles.actionText}>Up</Text>
                            </TouchableOpacity>
                          ) : null}
                          {index < routine.steps.length - 1 ? (
                            <TouchableOpacity onPress={() => shiftStep(routine, index, 1)}>
                              <Text style={styles.actionText}>Down</Text>
                            </TouchableOpacity>
                          ) : null}
                          <TouchableOpacity
                            onPress={() => {
                              setCheckForm(null);
                              setStepForm({
                                routineId: routine.id,
                                id: step.id,
                                text: step.text,
                                detail: step.detail ?? '',
                                checkId: step.checkId ?? NO_CHECK,
                              });
                            }}
                          >
                            <Text style={styles.actionText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={async () => { await deleteRoutineStep(step.id); load(); }}>
                            <Text style={styles.actionTextRemove}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {stepForm && stepForm.routineId === routine.id ? (
                  <View style={styles.inlineForm}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>The step</Text>
                      <VoiceInputButton onResult={(text) => setStepForm({ ...stepForm, text })} />
                    </View>
                    <AppTextInput
                      style={styles.input}
                      value={stepForm.text}
                      onChangeText={(text) => setStepForm({ ...stepForm, text })}
                      placeholder="Take your levothyroxine"
                      placeholderTextColor={colors.textMuted}
                      maxLength={MAX_STEP_TEXT}
                    />

                    <Text style={styles.label}>One more line, if it helps (optional)</Text>
                    <AppTextInput
                      style={styles.input}
                      value={stepForm.detail}
                      onChangeText={(detail) => setStepForm({ ...stepForm, detail })}
                      placeholder="Top drawer, the white bottle"
                      placeholderTextColor={colors.textMuted}
                      maxLength={MAX_STEP_DETAIL}
                    />

                    <Text style={styles.label}>Something to check off here</Text>
                    <PopoverSelect
                      options={checkOptions}
                      selected={stepForm.checkId ?? NO_CHECK}
                      onSelect={(value) => {
                        if (value === ADD_CHECK) {
                          setCheckForm({ name: stepForm.text.trim(), cadence: 'daily' });
                          return;
                        }
                        setCheckForm(null);
                        setStepForm({ ...stepForm, checkId: value });
                      }}
                      tabColor={tabColor}
                    />
                    <Text style={styles.helperText}>
                      Attach a check and this step carries a box to tap while you are standing there doing it.
                      Tapping it is what answers the question in Did I Do It later, so nothing has to be
                      remembered twice.
                    </Text>

                    {checkForm ? (
                      <View style={styles.inlineForm}>
                        <View style={styles.labelRow}>
                          <Text style={styles.label}>A new check</Text>
                          <VoiceInputButton onResult={(name) => setCheckForm({ ...checkForm, name })} />
                        </View>
                        <AppTextInput
                          style={styles.input}
                          value={checkForm.name}
                          onChangeText={(name) => setCheckForm({ ...checkForm, name })}
                          placeholder="Took my pill"
                          placeholderTextColor={colors.textMuted}
                          maxLength={MAX_CHECK_NAME}
                        />
                        <Text style={styles.label}>How often it needs doing</Text>
                        <PopoverSelect
                          options={cadenceOptions}
                          selected={checkForm.cadence}
                          onSelect={(value) => setCheckForm({ ...checkForm, cadence: value as CheckCadence })}
                          tabColor={tabColor}
                        />
                        <Text style={styles.helperText}>
                          {CHECK_CADENCES.find((entry) => entry.key === checkForm.cadence)?.example}
                        </Text>
                        <View style={styles.formActions}>
                          <TouchableOpacity style={styles.primaryButton} onPress={saveCheck}>
                            <Text style={styles.primaryButtonText}>Save</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.secondaryButton} onPress={() => setCheckForm(null)}>
                            <Text style={styles.secondaryButtonText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}

                    <View style={styles.formActions}>
                      <TouchableOpacity style={styles.primaryButton} onPress={saveStep}>
                        <Text style={styles.primaryButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => {
                          setStepForm(null);
                          setCheckForm(null);
                        }}
                      >
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => {
                      setCheckForm(null);
                      setStepForm({ routineId: routine.id, id: null, text: '', detail: '', checkId: NO_CHECK });
                    }}
                  >
                    <Text style={styles.primaryButtonText}>+ Add a step</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    panelStandalone: { backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12 },
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: tabColor },
    formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: tabColor },
    dimmed: { opacity: 0.6 },
    cardTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 8, ...textShadow },
    bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
    helperText: { ...typography.caption, color: colors.textMuted, marginTop: 6, marginBottom: 4, ...textShadow },

    label: { ...typography.label, color: colors.menuLabelMuted, marginTop: 12, marginBottom: 4, ...textShadow },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    input: {
      backgroundColor: colors.surfaceMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary,
    },
    inlineForm: {
      marginTop: 10, paddingHorizontal: 12, paddingBottom: 12, borderRadius: 10,
      backgroundColor: colors.surfaceMuted, borderLeftWidth: 3, borderLeftColor: tabColor,
    },

    row: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border,
    },
    rowMain: { flex: 1 },
    rowTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
    rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
    rowActions: { flexDirection: 'row', gap: 14, marginTop: 10, flexWrap: 'wrap' },
    clockRow: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
    dayRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    dayPill: {
      backgroundColor: colors.surfaceMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 8, paddingHorizontal: 10,
    },
    dayPillOn: { backgroundColor: tabColor, borderColor: tabColor },
    dayPillText: { ...typography.caption, color: colors.textMuted, ...textShadow },
    dayPillTextOn: { color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
    actionText: { ...typography.caption, color: tabColor, ...textShadow },
    actionTextRemove: { ...typography.caption, color: colors.danger, ...textShadow },

    formActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
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
