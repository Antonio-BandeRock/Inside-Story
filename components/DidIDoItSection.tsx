import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { VoiceInputButton } from './VoiceInputButton';
import { TabBand, makeTabBandStyles } from './TabBand';
import { useBandFolds } from '../hooks/useBandFolds';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  CHECK_CADENCES,
  checkCadenceLabel,
  checkStanding,
  describeCheckRoutine,
  describeChecksSummary,
  groupChecksByRoutine,
  MAX_CHECK_NAME,
  summarizeChecks,
  type CheckCadence,
  type CheckStanding,
  type DoneCheck,
  type Routine,
} from '../lib/routines';
import {
  createDoneCheck,
  deleteDoneCheck,
  getDoneChecks,
  getRoutines,
  markDoneCheck,
  moveDoneCheck,
  undoLastCheckMark,
  updateDoneCheck,
} from '../lib/routinesDb';
import { useWalkMark } from './WalkMark';

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
// HOW THIS RELATES TO ROUTINES, which is the whole of it, 2026-09-17: "Did I
// Do it should be related to Routines, not treated separately. While they are
// walking through a routine, they are also checking off things that they need
// to do while running the routine. Did I do it is the user selecting to check
// the item off as they are doing it."
//
// So this is not a second list of tasks sitting beside routines. It is the
// record those ticks write, read back later, and it says so on screen: the
// checks are grouped under the routine that ticks them off, each heading can
// walk that routine, and only the ones nothing walks past are gathered at the
// end. Most marks arrive from app/routine.tsx, at the step, the moment the
// person taps. The button on a card here is for the times they did the thing
// without walking anything.

type Props = { tabColor: string };

const CADENCE_OPTIONS = CHECK_CADENCES.map((entry) => ({ label: entry.label, value: entry.key }));

type CheckForm = { id: string | null; name: string; cadence: CheckCadence };

export function DidIDoItSection({ tabColor }: Props) {
  // The outline on a button a Your Story walk line names (components/WalkMark.ts).
  const walkMark = useWalkMark();
  const router = useRouter();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [checks, setChecks] = useState<DoneCheck[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CheckForm | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message?: string;
    actions: AppActionSheetAction[];
  } | null>(null);

  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);
  const band = useMemo(() => makeTabBandStyles(tabColor), [tabColor]);
  const folds = useBandFolds();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getDoneChecks(true), getRoutines(true)])
      .then(([loadedChecks, loadedRoutines]) => {
        setChecks(loadedChecks);
        setRoutines(loadedRoutines);
      })
      .catch((error) => showInfoAlert('Could not load', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // One moment for every line and for the summary above them, worked out
  // again only when the checks themselves change. Read fresh on each render
  // instead, the rows and the count could be answering about two different
  // moments, which on this screen is the one thing that must not happen.
  const { standings, summary } = useMemo(() => {
    const now = new Date();
    const map = new Map<string, CheckStanding>();
    for (const check of checks) map.set(check.id, checkStanding(check, now));
    return { standings: map, summary: summarizeChecks(checks, now) };
  }, [checks]);
  const summaryLine = describeChecksSummary(summary);

  const groups = useMemo(() => groupChecksByRoutine(checks, routines), [checks, routines]);

  // Headings earn their place only when at least one routine walks past
  // something. With no routines at all every check would sit under one
  // heading reading "Not part of a routine", which tells nobody anything.
  const showHeadings = groups.some((group) => group.routine !== null);

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

  if (loading) return <View style={band.boxMuted}><Text style={styles.bodyText}>Loading…</Text></View>;

  return (
    <View style={band.column}>
      {infoAlertElement}
      <AppActionSheet
        visible={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        message={confirm?.message}
        actions={confirm?.actions ?? []}
      />

      <View style={band.box}>
        <Text style={styles.cardTitle}>Did I Do It</Text>
        <Text style={styles.bodyText}>
          What you ticked off, and when. Most of these get ticked while you walk a routine, at the step that
          does them, so they are listed under the routine they belong to. Nothing here goes off and nothing
          here is asking to be done. The answer is just here when you need it.
        </Text>
        {summaryLine ? <Text style={styles.rowMeta}>{summaryLine}</Text> : null}
        {!form ? (
          <TouchableOpacity
            style={[styles.primaryButton, walkMark('didIDoIt.add')]}
            onPress={() => setForm({ id: null, name: '', cadence: 'daily' })}
          >
            <Text style={styles.primaryButtonText}>+ Add something to check</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {form ? (
        <View style={band.box}>
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
        <View style={band.box}>
          <Text style={styles.bodyText}>
            Nothing here yet. The ones worth adding first are the ones you have gone back upstairs to check:
            the pill, the stove, the back door.
          </Text>
        </View>
      ) : null}

      {groups.map((group) => {
        const groupKey = group.routine ? group.routine.id : 'loose';
        const rows = group.checks.map((check) => {
            const standing = standings.get(check.id);
            const done = standing?.doneThisPeriod === true;
            const position = checks.indexOf(check);
            return (
              <View
                key={check.id}
                style={[showHeadings ? band.row : band.box, check.active ? null : styles.dimmed, done ? styles.cardDone : null]}
              >
                <Text style={styles.cardTitle}>{check.name}</Text>
                <Text style={[styles.rowMeta, done ? styles.metaDone : null]}>{standing?.line}</Text>
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
          });
        if (!showHeadings) return <View key={groupKey} style={band.column}>{rows}</View>;
        return (
          <TabBand
            key={groupKey}
            folds={folds}
            color={tabColor}
            id={`life:didIDoIt:${groupKey}`}
            title={group.heading}
            icon="checkmark-done-outline"
            count={group.checks.length}
          >
            <View style={band.rows}>
              <View style={band.row}>
                {group.routine ? (
                  <>
                    <Text style={styles.rowMeta}>
                      {describeCheckRoutine(group.checks[0].id, routines)}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({ pathname: '/routine', params: { id: group.routine?.id ?? '' } })
                      }
                    >
                      <Text style={styles.actionText}>Walk it</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.rowMeta}>
                    The only way these get ticked off is a tap here.
                  </Text>
                )}
              </View>
              {rows}
            </View>
          </TabBand>
        );
      })}
    </View>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    // A done row steps back rather than lighting up. Nothing here is a
    // score, and a row that has been answered is finished being interesting.
    cardDone: { opacity: 0.75 },
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
