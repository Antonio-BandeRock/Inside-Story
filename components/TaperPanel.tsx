// A med's taper, inside its Details on Life > My Meds (A2). The steps are
// entered the way a prescription writes them, a first day and then an
// amount for a number of days, and the sentences come from lib/taper.ts.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from './AppTextInput';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { describePlainDate, readPlainDateField } from '../lib/plainDate';
import {
  TAPER_AFTER_NOTE,
  TAPER_LEAD,
  buildTaper,
  describeSteps,
  draftsFromSteps,
  taperStatusLine,
  type TaperDraftStep,
  type TaperStep,
} from '../lib/taper';
import { clearTaperSteps, saveTaperSteps } from '../lib/taperDb';

type Props = {
  treatmentId: string;
  steps: TaperStep[];
  defaultUnit: string | null;
  afterDose: string | null;
  today: string;
  tabColor: string;
  onSaved: () => void;
  onProblem: (title: string, message: string) => void;
};

function blankStep(unit: string | null): TaperDraftStep {
  return { amount: '', unit: unit ?? '', days: '' };
}

export function TaperPanel({ treatmentId, steps, defaultUnit, afterDose, today, tabColor, onSaved, onProblem }: Props) {
  const styles = makeStyles(tabColor);
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [drafts, setDrafts] = useState<TaperDraftStep[]>([]);

  useEffect(() => {
    if (editing) return;
    if (steps.length) {
      const back = draftsFromSteps(steps);
      setStartDate(back.startDate);
      setDrafts(back.drafts);
    } else {
      setStartDate(today);
      setDrafts([blankStep(defaultUnit), blankStep(defaultUnit)]);
    }
  }, [steps, editing, today, defaultUnit]);

  function updateDraft(index: number, patch: Partial<TaperDraftStep>) {
    setDrafts((current) => current.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function addStep() {
    setDrafts((current) => [...current, blankStep(current[current.length - 1]?.unit || defaultUnit)]);
  }

  function removeStep(index: number) {
    setDrafts((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current));
  }

  async function save() {
    const built = buildTaper(startDate.trim(), drafts);
    if (!built.steps) {
      onProblem('Almost there', built.problem);
      return;
    }
    try {
      await saveTaperSteps(treatmentId, built.steps);
      setEditing(false);
      onSaved();
    } catch (error) {
      onProblem('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  async function clear() {
    try {
      await clearTaperSteps(treatmentId);
      setEditing(false);
      onSaved();
    } catch (error) {
      onProblem('Could not remove', error instanceof Error ? error.message : String(error));
    }
  }

  const now = new Date();
  const readDate = /^\d{4}-\d{2}-\d{2}$/.test(startDate.trim()) ? null : readPlainDateField(startDate, now, 'future');
  const preview = buildTaper(startDate.trim(), drafts);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Taper</Text>
      {steps.length && !editing ? (
        <>
          <Text style={styles.bodyText}>{taperStatusLine(steps, today, afterDose)}</Text>
          {describeSteps(steps).map((line) => (
            <Text key={line} style={styles.stepText}>
              {line}
            </Text>
          ))}
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.actionText}>Change the taper</Text>
          </TouchableOpacity>
        </>
      ) : !editing ? (
        <>
          <Text style={styles.bodyText}>A dose that steps down or up on set dates, entered as the prescriber wrote it.</Text>
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.actionText}>Add a taper</Text>
          </TouchableOpacity>
        </>
      ) : null}
      {editing ? (
        <>
          <Text style={styles.bodyText}>{TAPER_LEAD}</Text>
          <Text style={styles.label}>First day of the taper</Text>
          <AppTextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2026-10-01" />
          {readDate ? (
            <View style={styles.inlineRow}>
              <Text style={styles.bodyText}>{`Reads as ${describePlainDate({ ...readDate, time: null }, now)}.`}</Text>
              <TouchableOpacity style={styles.smallButton} onPress={() => setStartDate(readDate.date)}>
                <Text style={styles.smallButtonText}>Use it</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {drafts.map((draft, index) => (
            <View key={index} style={styles.stepBlock}>
              <Text style={styles.label}>{`Step ${index + 1}`}</Text>
              <View style={styles.inlineRow}>
                <AppTextInput
                  style={[styles.input, styles.numberInput]}
                  keyboardType="decimal-pad"
                  value={draft.amount}
                  onChangeText={(amount) => updateDraft(index, { amount })}
                  placeholder="20"
                  accessibilityLabel={`Step ${index + 1} amount`}
                />
                <AppTextInput
                  style={[styles.input, styles.flexInput]}
                  value={draft.unit}
                  onChangeText={(unit) => updateDraft(index, { unit })}
                  placeholder="mg"
                  accessibilityLabel={`Step ${index + 1} unit`}
                />
                <Text style={styles.bodyText}>for</Text>
                <AppTextInput
                  style={[styles.input, styles.numberInput]}
                  keyboardType="number-pad"
                  value={draft.days}
                  onChangeText={(days) => updateDraft(index, { days })}
                  placeholder="5"
                  accessibilityLabel={`Step ${index + 1} days`}
                />
                <Text style={styles.bodyText}>days</Text>
              </View>
              {drafts.length > 1 ? (
                <TouchableOpacity onPress={() => removeStep(index)}>
                  <Text style={styles.actionText}>Remove this step</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          <TouchableOpacity onPress={addStep}>
            <Text style={styles.actionText}>+ Add a step</Text>
          </TouchableOpacity>
          {preview.steps ? (
            <>
              <Text style={styles.label}>How it reads</Text>
              {describeSteps(preview.steps).map((line) => (
                <Text key={line} style={styles.stepText}>
                  {line}
                </Text>
              ))}
            </>
          ) : null}
          <Text style={styles.bodyText}>{TAPER_AFTER_NOTE}</Text>
          <View style={styles.actions}>
            {steps.length ? (
              <TouchableOpacity style={styles.secondaryButton} onPress={() => void clear()}>
                <Text style={styles.secondaryButtonText}>Remove the taper</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditing(false)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={() => void save()}>
              <Text style={styles.primaryButtonText}>Save the taper</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </View>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    actionText: { ...typography.captionEmphasis, color: tabColor, marginTop: 6, ...textShadow },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10, marginTop: 12 },
    bodyText: { ...typography.body, color: tabColor, ...textShadow },
    flexInput: { flex: 1, minWidth: 60 },
    heading: { ...typography.captionEmphasis, color: tabColor, marginBottom: 4, ...textShadow },
    inlineRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      ...typography.body,
      color: tabColor,
      ...textShadow,
    },
    label: { ...typography.label, color: tabColor, marginBottom: 6, marginTop: 10, ...textShadow },
    numberInput: { width: 72 },
    primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
    primaryButtonText: {
      ...typography.bodyEmphasis,
      color: colors.textOnButton,
      textShadowColor: 'transparent',
      textShadowRadius: 0,
    },
    secondaryButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    secondaryButtonText: { ...typography.bodyEmphasis, color: tabColor, ...textShadow },
    section: { gap: 2, marginTop: 12 },
    smallButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tabColor,
      backgroundColor: colors.surface,
    },
    smallButtonText: { ...typography.captionEmphasis, color: tabColor, ...textShadow },
    stepBlock: { gap: 2 },
    stepText: { ...typography.caption, color: tabColor, ...textShadow },
  });
}
