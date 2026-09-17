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
  describeRoutineStanding,
  moveRoutineStep,
  ROUTINE_OCCASIONS,
  routineOccasionLabel,
  suggestedOccasion,
  MAX_ROUTINE_NAME,
  MAX_STEP_DETAIL,
  MAX_STEP_TEXT,
  type DoneCheck,
  type Routine,
  type RoutineOccasion,
} from '../lib/routines';
import {
  addRoutineStep,
  createRoutine,
  deleteRoutine,
  deleteRoutineStep,
  getDoneChecks,
  getRoutines,
  moveRoutine,
  saveStepOrder,
  updateRoutine,
  updateRoutineStep,
} from '../lib/routinesDb';

// Routines: an order you do not want to hold in your head.
//
// Life's ninth area, 2026-09-17, from the daily-living program (CLAUDE.md
// item 28). This screen is where a routine is built and kept. Walking it is a
// screen of its own, app/routine.tsx, because the two are opposite jobs:
// here you want to see all nine steps at once to get the order right, and
// there you must see exactly one.
//
// The step that is also a check is the piece worth understanding. Attaching
// "Take my pill" to the step that takes the pill means walking the routine at
// 7am answers "did I take my pill" at 11am, with no second thing to remember
// and no second tap. Steps that record nothing are the ordinary case and stay
// the default, because most steps are just order.

type Props = { tabColor: string };

const OCCASION_OPTIONS = ROUTINE_OCCASIONS.map((entry) => ({ label: entry.label, value: entry.key }));

type RoutineForm = { id: string | null; name: string; occasion: RoutineOccasion };
type StepForm = {
  routineId: string;
  id: string | null;
  text: string;
  detail: string;
  checkId: string | null;
};

const NO_CHECK = 'none';

export function RoutinesSection({ tabColor }: Props) {
  const router = useRouter();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [checks, setChecks] = useState<DoneCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<RoutineForm | null>(null);
  const [stepForm, setStepForm] = useState<StepForm | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message?: string;
    actions: AppActionSheetAction[];
  } | null>(null);

  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getRoutines(true), getDoneChecks(true)])
      .then(([loadedRoutines, loadedChecks]) => {
        setRoutines(loadedRoutines);
        setChecks(loadedChecks);
      })
      .catch((error) => showInfoAlert('Could not load', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const now = new Date();
  const fits = suggestedOccasion(now);

  // Checks offered when attaching a step. "Records nothing" leads, because it
  // is what most steps are and the list would otherwise read as a question
  // every step has to answer.
  const checkOptions = useMemo(
    () => [
      { label: 'Records nothing', value: NO_CHECK },
      ...checks.filter((check) => check.active).map((check) => ({ label: check.name, value: check.id })),
    ],
    [checks],
  );

  async function saveRoutine() {
    if (!form) return;
    if (!form.name.trim()) {
      showInfoAlert('Almost there', 'Give it a name you will recognise, like "Morning" or "Leaving the house".');
      return;
    }
    if (form.id) await updateRoutine(form.id, form.name, form.occasion);
    else await createRoutine(form.name, form.occasion);
    setForm(null);
    load();
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
    load();
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
          no list to keep your place in.
        </Text>
        {!form ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setForm({ id: null, name: '', occasion: fits ?? 'other' })}
          >
            <Text style={styles.primaryButtonText}>+ Add a routine</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {form ? (
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>{form.id ? 'Rename this routine' : 'A new routine'}</Text>

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
            options={OCCASION_OPTIONS}
            selected={form.occasion}
            onSelect={(value) => setForm({ ...form, occasion: value as RoutineOccasion })}
            tabColor={tabColor}
          />
          <Text style={styles.helperText}>
            {ROUTINE_OCCASIONS.find((entry) => entry.key === form.occasion)?.example}
          </Text>
          <Text style={styles.helperText}>
            This decides nothing but the order they are listed in. No routine ever starts on its own.
          </Text>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={saveRoutine}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setForm(null)}>
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
              {routineOccasionLabel(routine.occasion)}. {describeRoutineStanding(routine, now)}
            </Text>

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
                onPress={() => setForm({ id: routine.id, name: routine.name, occasion: routine.occasion })}
              >
                <Text style={styles.actionText}>Rename</Text>
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
                        {attached ? <Text style={styles.rowMeta}>Also records: {attached}</Text> : null}
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
                            onPress={() =>
                              setStepForm({
                                routineId: routine.id,
                                id: step.id,
                                text: step.text,
                                detail: step.detail ?? '',
                                checkId: step.checkId ?? NO_CHECK,
                              })
                            }
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

                    <Text style={styles.label}>Does this answer a question later</Text>
                    <PopoverSelect
                      options={checkOptions}
                      selected={stepForm.checkId ?? NO_CHECK}
                      onSelect={(value) => setStepForm({ ...stepForm, checkId: value })}
                      tabColor={tabColor}
                    />
                    <Text style={styles.helperText}>
                      Attach a check and finishing this routine records it, so Did I Do It can answer the
                      question later without a second tap. Add the checks themselves in Did I Do It.
                    </Text>

                    <View style={styles.formActions}>
                      <TouchableOpacity style={styles.primaryButton} onPress={saveStep}>
                        <Text style={styles.primaryButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => setStepForm(null)}>
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() =>
                      setStepForm({ routineId: routine.id, id: null, text: '', detail: '', checkId: NO_CHECK })
                    }
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
