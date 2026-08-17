import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, inputBackground } from '../constants/colors';
import { NAVIGATION_HAND } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import { appendDictatedText, parseVoiceCommands } from '../lib/voiceCommandParsing';
import { useActiveField, useActiveInputControls } from './ActiveInputContext';
import { AppTextInput } from './AppTextInput';
import { useConfirmSheet } from './ConfirmSheet';
import { useInfoAlert } from './InfoAlert';
import { VoiceInputButton } from './VoiceInputButton';

// A real, reusable, controlled add/edit/remove list-of-steps editor --
// 2026-08-17, extracted from what used to be SideBuilder.tsx's own
// renderStepsSection (the whole-dish Steps feature) once a second, genuinely
// separate use for the exact same shape showed up: per-INGREDIENT prep
// steps (see SideBuilder.tsx's own Prep Notes -> Prep Steps rework, point 6
// of the same day's larger ingredient-adding-screen redesign). Both are a
// real, ordered list of discrete entries with their own add/edit/remove
// identity, matching RecipeCard.instructions/RecipeCardDetail's own numbered
// "How to make it" rendering (app/(tabs)/purple-digest.tsx) -- not one
// freeform paragraph, so each one needs a real step number, not just a
// bigger text box.
//
// Fully controlled (steps/onChange) rather than owning its own list state --
// the caller decides where that list actually lives (SideBuilder's own
// whole-dish `steps` state, vs. a per-ingredient `ingredientPrepSteps`
// array reset alongside Quantity/Unit/etc.), this component only owns the
// UI mechanics of adding to/editing/removing from whatever list it's given.
export type StepsEditorHandle = {
  // True while a step is actively being composed (either a brand-new one or
  // an edit to an existing one) -- SideBuilder reads this to decide whether
  // it's safe to move on (e.g. "Save & Add New") without silently discarding
  // an in-progress, unsaved step draft. Not currently enforced by this
  // component itself (steps stay genuinely optional throughout, matching
  // RecipeCard.instructions), just exposed for a caller that wants it.
  isComposing: boolean;
};

export function StepsEditor({
  steps,
  onChange,
  tabColor,
  label,
  addFirstLabel,
  addAnotherLabel,
  completeLabel,
  placeholder,
  scrollViewRef,
}: {
  steps: string[];
  onChange: (next: string[]) => void;
  tabColor: string;
  label: string;
  addFirstLabel: string;
  addAnotherLabel: string;
  completeLabel: string;
  placeholder: string;
  // Optional -- when given, the composer's own text field scrolls itself
  // into view above AppKeyboard on focus, the same real fix
  // SideBuilder.tsx's own fields already need (see AppTextInput's own
  // onFocus usage elsewhere in this app for why: AppKeyboard is a floating
  // overlay, not RN's own system keyboard, so there's no automatic "shrink
  // the scrollable area" the way a real keyboard gets from
  // KeyboardAvoidingView).
  scrollViewRef?: React.RefObject<ScrollView | null>;
}) {
  const activeField = useActiveField();
  const { forceClear } = useActiveInputControls();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  const [addingStep, setAddingStep] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [stepDraft, setStepDraft] = useState('');
  // Purely a "collapse the add-step controls for now" toggle -- never gates
  // anything else; every already-added step stays just as editable/
  // removable whether this is true or false.
  const [stepsComplete, setStepsComplete] = useState(false);

  function dismissKeyboard() {
    activeField?.blur();
    forceClear();
  }

  function openAddStep() {
    setEditingStepIndex(null);
    setStepDraft('');
    setAddingStep(true);
  }

  function openEditStep(index: number) {
    setAddingStep(false);
    setEditingStepIndex(index);
    setStepDraft(steps[index]);
  }

  function cancelStepEditor() {
    dismissKeyboard();
    setAddingStep(false);
    setEditingStepIndex(null);
    setStepDraft('');
  }

  // Always fires, matching this whole app's own established "never a truly
  // `disabled` button" convention -- a blank draft just explains what's
  // missing rather than silently doing nothing.
  function saveStepDraft() {
    const text = stepDraft.trim();
    if (!text) {
      showInfoAlert('Almost there', 'Please describe this step before saving it.');
      return;
    }
    dismissKeyboard();
    if (editingStepIndex !== null) {
      onChange(steps.map((step, i) => (i === editingStepIndex ? text : step)));
    } else {
      onChange([...steps, text]);
    }
    setAddingStep(false);
    setEditingStepIndex(null);
    setStepDraft('');
  }

  function removeStep(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  async function confirmRemoveStep(index: number) {
    const ok = await confirmSheet({
      title: `Remove step ${index + 1}?`,
      message: steps[index],
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (ok) removeStep(index);
  }

  const composing = addingStep || editingStepIndex !== null;

  // 2026-08-17, direct on-device report: saying "wash the broccoli"
  // produced "wash wash the wash the broccoli wash the broccoli" in the
  // box. Root cause: this callback was missing the real isFinal guard every
  // other dictation field in the app already has (see e.g. log.tsx's own
  // CheckinForm/GeneralNoteSection notes fields) -- VoiceInputButton's
  // onResult fires on every INTERIM result too, not just the one final
  // transcript, and each interim result is the recognizer's own growing,
  // self-correcting guess ("wash" -> "wash the" -> "wash the broccoli"),
  // not a new word to add. Appending every one of those on top of the
  // last is exactly what produced the repeated, garbled text. Only the
  // one real final result should ever be appended.
  function handleStepVoiceResult(transcript: string, isFinal: boolean) {
    if (!isFinal) return;
    setStepDraft((current) => appendDictatedText(current, parseVoiceCommands(transcript)));
  }

  return (
    <View style={styles.stepsSection}>
      {infoAlertElement}
      {confirmSheetElement}
      <Text style={[styles.formLabel, { color: tabColor }]}>{label}</Text>
      {steps.length === 0 && !composing ? (
        <Text style={[styles.summaryEmptyText, { marginTop: 4 }]}>None added yet.</Text>
      ) : (
        steps.map((step, index) => (
          <View key={index} style={styles.stepRow}>
            <View style={styles.stepTextWrap}>
              <Text style={styles.stepNumber}>{index + 1}.</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
            <View style={styles.stepActions}>
              <TouchableOpacity style={styles.stepActionButton} onPress={() => openEditStep(index)} accessibilityLabel={`Edit step ${index + 1}`}>
                <Ionicons name="pencil-outline" size={18} color={tabColor} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.stepActionButton} onPress={() => confirmRemoveStep(index)} accessibilityLabel={`Remove step ${index + 1}`}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {composing ? (
        <View style={styles.stepComposer}>
          {/* Nav-hand-aware, 2026-08-17 -- see FoodLookup.tsx's own "Say a
              Food Name" mic for the same real fix and its own comment. */}
          <View style={styles.stepLabelRow}>
            {NAVIGATION_HAND === 'left' ? (
              <>
                <VoiceInputButton onResult={handleStepVoiceResult} size={16} />
                <Text style={[styles.formLabel, { color: tabColor }]}>
                  Step {editingStepIndex !== null ? editingStepIndex + 1 : steps.length + 1}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.formLabel, { color: tabColor }]}>
                  Step {editingStepIndex !== null ? editingStepIndex + 1 : steps.length + 1}
                </Text>
                <VoiceInputButton onResult={handleStepVoiceResult} size={16} />
              </>
            )}
          </View>
          <AppTextInput
            style={[styles.formInput, { backgroundColor: inputBackground(tabColor) }]}
            value={stepDraft}
            onChangeText={setStepDraft}
            placeholder={placeholder}
            multiline
            onFocus={() => {
              requestAnimationFrame(() => scrollViewRef?.current?.scrollToEnd({ animated: true }));
            }}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.splitButton} onPress={cancelStepEditor}>
              <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.splitButton, stepDraft.trim() ? { backgroundColor: tabColor } : styles.primaryButtonMuted]}
              onPress={saveStepDraft}
            >
              <Text style={[styles.primaryButtonText, !stepDraft.trim() && styles.primaryButtonTextMuted]}>Save Step</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : steps.length === 0 ? (
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tabColor }]} onPress={openAddStep}>
          <Text style={styles.primaryButtonText}>{addFirstLabel}</Text>
        </TouchableOpacity>
      ) : stepsComplete ? (
        <View style={styles.stepsCompleteRow}>
          <Text style={styles.summaryEmptyText}>Saved.</Text>
          <TouchableOpacity onPress={() => setStepsComplete(false)}>
            <Text style={[styles.secondaryButtonText, { color: tabColor }]}>{addAnotherLabel}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.splitButton} onPress={openAddStep}>
            <Text style={[styles.secondaryButtonText, { color: tabColor }]}>{addAnotherLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.splitButton, { backgroundColor: tabColor }]} onPress={() => setStepsComplete(true)}>
            <Text style={styles.primaryButtonText}>{completeLabel}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stepsSection: {},
  formLabel: { ...typography.eyebrow },
  formInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
  stepLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  splitButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryButtonMuted: { backgroundColor: colors.border },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnPrimary },
  primaryButtonTextMuted: { color: colors.textMuted },
  secondaryButtonText: { ...typography.bodyEmphasis },
  summaryEmptyText: { ...typography.caption, color: colors.textSecondary },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepTextWrap: { flex: 1, flexDirection: 'row', marginRight: 6, paddingVertical: 10 },
  stepNumber: { ...typography.bodyEmphasis, color: colors.textPrimary, marginRight: 6 },
  stepText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  stepActions: { flexDirection: 'row', alignItems: 'center' },
  // Real padding, not hitSlop -- matches this app's own established
  // "closely-stacked list rows need real, non-overlapping tap targets"
  // fix, documented at length on SideBuilder.tsx's own summaryRemoveButton/
  // overviewRemoveButton.
  stepActionButton: { padding: 10 },
  stepComposer: { marginTop: 10 },
  stepsCompleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
});
