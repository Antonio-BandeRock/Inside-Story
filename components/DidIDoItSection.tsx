import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { KeepRemindingPicker } from './KeepRemindingPicker';
import { TabBand, makeTabBandStyles } from './TabBand';
import { useBandFolds } from '../hooks/useBandFolds';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  CHECK_CADENCES,
  checkCadenceLabel,
  checkStanding,
  describeReminderDays,
  formatHour,
  formatReminderClock,
  REMINDER_DAY_NAMES,
  toggleReminderDay,
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
  setDoneCheckReminder,
  undoLastCheckMark,
  updateDoneCheck,
} from '../lib/routinesDb';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import { useWalkMark } from './WalkMark';
import { RecordPhotos } from './RecordPhotos';

// Did I Do It: one question, asked later.
//
// Life's tenth area, 2026-09-17, from the daily-living program (CLAUDE.md
// item 28). Named literally on purpose. The audience for this is somebody
// standing on the stairs at eleven in the morning trying to remember whether
// they took the pill, and a clever name would be one more thing to translate.
//
// WHAT THIS IS NOT. It is not a to-do list, because nothing here is asking
// to be done. Until C2 (2026-09-26) nothing here went off either; now a
// check can be given a time and days, and then it speaks on those days until
// it is marked in its period and is quiet the rest of the time. One given no
// time still never says anything. It holds
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

type CheckForm = {
  id: string | null;
  name: string;
  cadence: CheckCadence;
  /** C2: 'HH:mm', or null for a check that never speaks. */
  reminderTime: string | null;
  reminderDays: number[];
  keepReminding: number | null;
};

const NO_TIME = 'off';
const TIME_HOUR_OPTIONS = [
  { label: 'No reminder', value: NO_TIME },
  ...Array.from({ length: 24 }, (unused, hour) => ({ label: formatHour(hour), value: String(hour) })),
];
const TIME_MINUTE_OPTIONS = Array.from({ length: 12 }, (unused, index) => ({
  label: `:${String(index * 5).padStart(2, '0')}`,
  value: String(index * 5),
}));

function hourValue(time: string | null): string {
  return time ? String(Number(time.split(':')[0])) : NO_TIME;
}

function minuteValue(time: string | null): string {
  return time ? String(Number(time.split(':')[1])) : '0';
}

function buildTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function emptyForm(): CheckForm {
  return { id: null, name: '', cadence: 'daily', reminderTime: null, reminderDays: [], keepReminding: null };
}

function formFor(check: DoneCheck): CheckForm {
  return {
    id: check.id,
    name: check.name,
    cadence: check.cadence,
    reminderTime: check.reminderTime,
    reminderDays: check.reminderDays,
    keepReminding: check.keepReminding,
  };
}

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
    let id = form.id;
    if (id) await updateDoneCheck(id, form.name, form.cadence);
    else id = await createDoneCheck(form.name, form.cadence);
    // 'anytime' has no period to be due in, so it never speaks.
    if (id) {
      const time = form.cadence === 'anytime' ? null : form.reminderTime;
      await setDoneCheckReminder(id, time, form.reminderDays, form.keepReminding);
      void syncReminderNotifications();
    }
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
          does them, so they are listed under the routine they belong to. Nothing here is asking to be done,
          and nothing goes off unless you give it a time. The answer is just here when you need it.
        </Text>
        {summaryLine ? <Text style={styles.rowMeta}>{summaryLine}</Text> : null}
        {!form ? (
          <TouchableOpacity
            style={[styles.primaryButton, walkMark('didIDoIt.add')]}
            onPress={() => setForm(emptyForm())}
          >
            <Text style={styles.primaryButtonText}>+ Add something to check</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {form ? (
        <View style={band.box}>
          <Text style={styles.cardTitle}>{form.id ? 'Change this one' : 'Something to check'}</Text>

          <Text style={styles.label}>What you want to be able to ask</Text>
          <AppTextInput
            onVoiceResult={(text) => setForm({ ...form, name: text })}
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

          {form.cadence !== 'anytime' ? (
            <>
              <Text style={styles.label}>A reminder to do it</Text>
              <View style={styles.clockRow}>
                <PopoverSelect
                  options={TIME_HOUR_OPTIONS}
                  selected={hourValue(form.reminderTime)}
                  onSelect={(value) =>
                    setForm({
                      ...form,
                      reminderTime: value === NO_TIME ? null : buildTime(Number(value), Number(minuteValue(form.reminderTime))),
                    })
                  }
                  tabColor={tabColor}
                />
                {form.reminderTime ? (
                  <PopoverSelect
                    options={TIME_MINUTE_OPTIONS}
                    selected={minuteValue(form.reminderTime)}
                    minWidth={64}
                    onSelect={(value) =>
                      setForm({ ...form, reminderTime: buildTime(Number(hourValue(form.reminderTime)), Number(value)) })
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
                    {`At ${formatReminderClock(form.reminderTime)}, ${describeReminderDays(form.reminderDays)}. Done on the reminder marks it here. Once it is marked for the ${form.cadence === 'daily' ? 'day' : form.cadence === 'weekly' ? 'week' : 'month'}, it stays quiet until the next one.`}
                  </Text>
                  <KeepRemindingPicker
                    value={form.keepReminding}
                    onChange={(keepReminding) => setForm({ ...form, keepReminding })}
                    tabColor={tabColor}
                    labelStyle={styles.label}
                    helperStyle={styles.helperText}
                  />
                </>
              ) : (
                <Text style={styles.helperText}>
                  Leave this at No reminder for a check you only want to look up. Give it a time and the phone
                  asks on the days you pick.
                </Text>
              )}
            </>
          ) : null}

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
                {/* A photo of the stove off or the door locked is the one answer to
                    "did I do it" that needs no remembering at all. */}
                <RecordPhotos ownerKind="done_check" ownerId={check.id} tabColor={tabColor} title={check.name} />

                {check.active ? (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={async () => { await markDoneCheck(check.id, 'tap'); load(); void syncReminderNotifications(); }}
                  >
                    <Text style={styles.primaryButtonText}>
                      {done ? 'Did it again just now' : 'Yes, just did it'}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.rowActions}>
                  {check.lastMarkedAt ? (
                    <TouchableOpacity onPress={async () => { await undoLastCheckMark(check.id); load(); void syncReminderNotifications(); }}>
                      <Text style={styles.actionText}>That was a mistake</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => setForm(formFor(check))}
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
    clockRow: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
    dayRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    dayPill: {
      backgroundColor: colors.surfaceMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 8, paddingHorizontal: 10,
    },
    dayPillOn: { backgroundColor: tabColor, borderColor: tabColor },
    dayPillText: { ...typography.caption, color: colors.textMuted, ...textShadow },
    dayPillTextOn: { color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
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
