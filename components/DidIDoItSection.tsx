import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { VoiceInputButton } from './VoiceInputButton';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  CHECK_CADENCES,
  checkCadenceLabel,
  checkStanding,
  describeChecksSummary,
  MAX_CHECK_NAME,
  summarizeChecks,
  type CheckCadence,
  type DoneCheck,
} from '../lib/routines';
import {
  createDoneCheck,
  deleteDoneCheck,
  getDoneChecks,
  markDoneCheck,
  moveDoneCheck,
  undoLastCheckMark,
  updateDoneCheck,
} from '../lib/routinesDb';

// Did I Do It: one question, asked later.
//
// Life's tenth area, 2026-09-17, from the daily-living program (CLAUDE.md
// item 28). Named literally on purpose. The audience for this is somebody
// standing on the stairs at eleven in the morning trying to remember whether
// they took the pill, and a clever name would be one more thing to translate.
//
// WHAT THIS IS NOT. It is not a reminder, because nothing here goes off, and
// it is not a to-do list, because nothing here is asking to be done. It holds
// exactly one fact per line: whether a thing has happened, and when. That is
// the whole feature, and the value is entirely in being able to look, so that
// the answer costs a glance instead of a walk back upstairs or a second
// payment of the same bill.
//
// WHY 'anytime' HAS NO ANSWER. A check with no cadence is shown with the date
// it last happened and no verdict at all, because there is no period for it
// to be inside. Saying "not done" about a smoke alarm battery nobody is
// overdue on would be the app inventing a deadline, which is the same refusal
// the rest of this app makes about numbers nobody chose.
//
// A step in a routine can write these marks, so walking the morning routine
// answers the pill question without a second tap. See components/
// RoutinesSection.tsx.

type Props = { tabColor: string };

const CADENCE_OPTIONS = CHECK_CADENCES.map((entry) => ({ label: entry.label, value: entry.key }));

type CheckForm = { id: string | null; name: string; cadence: CheckCadence };

export function DidIDoItSection({ tabColor }: Props) {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [checks, setChecks] = useState<DoneCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CheckForm | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message?: string;
    actions: AppActionSheetAction[];
  } | null>(null);

  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);

  const load = useCallback(() => {
    setLoading(true);
    getDoneChecks(true)
      .then(setChecks)
      .catch((error) => showInfoAlert('Could not load', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // One moment for every line and for the summary above them, worked out
  // again only when the checks themselves change. Read fresh on each render
  // instead, the rows and the count could be answering about two different
  // moments, which on this screen is the one thing that must not happen.
  const { rows, summary } = useMemo(() => {
    const now = new Date();
    return {
      rows: checks.map((check) => checkStanding(check, now)),
      summary: summarizeChecks(checks, now),
    };
  }, [checks]);
  const summaryLine = describeChecksSummary(summary);

  async function saveCheck() {
    if (!form) return;
    if (!form.name.trim()) {
      showInfoAlert('Almost there', 'Give it the name you would say out loud, like "Took my morning pill".');
      return;
    }
    if (form.id) await updateDoneCheck(form.id, form.name, form.cadence);
    else await createDoneCheck(form.name, form.cadence);
    setForm(null);
    load();
  }

  function confirmRemove(check: DoneCheck) {
    setConfirm({
      title: `Remove ${check.name}?`,
      message:
        'Everything recorded against it goes too, and any routine step pointing at it stops recording. Retiring it instead keeps the history.',
      actions: [
        {
          label: 'Remove it',
          destructive: true,
          onPress: async () => {
            setConfirm(null);
            await deleteDoneCheck(check.id);
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
        <Text style={styles.cardTitle}>Did I Do It</Text>
        <Text style={styles.bodyText}>
          Things you want to be able to check on later. Nothing here goes off and nothing here is asking to be
          done. Tap one when it happens, and the answer is here when you need it.
        </Text>
        {summaryLine ? <Text style={styles.rowMeta}>{summaryLine}</Text> : null}
        {!form ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setForm({ id: null, name: '', cadence: 'daily' })}
          >
            <Text style={styles.primaryButtonText}>+ Add something to check</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {form ? (
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>{form.id ? 'Change this one' : 'Something to check'}</Text>

          <View style={styles.labelRow}>
            <Text style={styles.label}>What you want to be able to ask</Text>
            <VoiceInputButton onResult={(text) => setForm({ ...form, name: text })} />
          </View>
          <AppTextInput
            style={styles.input}
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            placeholder="Took my morning pill"
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_CHECK_NAME}
          />
          <Text style={styles.helperText}>
            Write it as the thing that happened rather than as a question, so the line reads as an answer when
            you come back to it.
          </Text>

          <Text style={styles.label}>How often it comes round</Text>
          <PopoverSelect
            options={CADENCE_OPTIONS}
            selected={form.cadence}
            onSelect={(value) => setForm({ ...form, cadence: value as CheckCadence })}
            tabColor={tabColor}
          />
          <Text style={styles.helperText}>
            {CHECK_CADENCES.find((entry) => entry.key === form.cadence)?.example}
          </Text>
          <Text style={styles.helperText}>
            {form.cadence === 'anytime'
              ? 'This one is never shown as late, because there is nothing to be late for. It shows the date it last happened and leaves the judgement to you.'
              : 'A week runs Monday to Sunday, and a month is the calendar month. Nothing is ever marked late on your behalf.'}
          </Text>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={saveCheck}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setForm(null)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {checks.length === 0 && !form ? (
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            Nothing here yet. The ones worth adding first are the ones you have gone back upstairs to check:
            the pill, the stove, the back door.
          </Text>
        </View>
      ) : null}

      {rows.map((standing, position) => {
        const check = standing.check;
        const done = standing.doneThisPeriod === true;
        return (
          <View
            key={check.id}
            style={[styles.card, check.active ? null : styles.dimmed, done ? styles.cardDone : null]}
          >
            <Text style={styles.cardTitle}>{check.name}</Text>
            <Text style={[styles.rowMeta, done ? styles.metaDone : null]}>{standing.line}</Text>
            <Text style={styles.rowMeta}>{checkCadenceLabel(check.cadence)}.</Text>

            {check.active ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={async () => { await markDoneCheck(check.id, 'tap'); load(); }}
              >
                <Text style={styles.primaryButtonText}>
                  {done ? 'Did it again just now' : 'Yes, just did it'}
                </Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.rowActions}>
              {check.lastMarkedAt ? (
                <TouchableOpacity onPress={async () => { await undoLastCheckMark(check.id); load(); }}>
                  <Text style={styles.actionText}>That was a mistake</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={() => setForm({ id: check.id, name: check.name, cadence: check.cadence })}
              >
                <Text style={styles.actionText}>Change</Text>
              </TouchableOpacity>
              {position > 0 ? (
                <TouchableOpacity onPress={async () => { await moveDoneCheck(check.id, -1); load(); }}>
                  <Text style={styles.actionText}>Move up</Text>
                </TouchableOpacity>
              ) : null}
              {position < checks.length - 1 ? (
                <TouchableOpacity onPress={async () => { await moveDoneCheck(check.id, 1); load(); }}>
                  <Text style={styles.actionText}>Move down</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => confirmRemove(check)}>
                <Text style={styles.actionTextRemove}>Remove</Text>
              </TouchableOpacity>
            </View>
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
    // A done card steps back rather than lighting up. Nothing here is a
    // score, and a row that has been answered is finished being interesting.
    cardDone: { borderColor: colors.border },
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

    rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
    metaDone: { color: colors.textSecondary },
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
