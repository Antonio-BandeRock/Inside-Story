import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand, homeBandStyle } from './HomeSectionBand';
import { useInfoAlert } from './InfoAlert';
import { VoiceInputButton } from './VoiceInputButton';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import {
  createTherapySession,
  deleteTherapySession,
  listTherapySessions,
  updateTherapySession,
  type TherapySessionRecord,
} from '../lib/db';
import { getTherapyTypesByCategory, therapyTypeLabel } from '../lib/therapyTypes';
import { buildTime24, describeTimeInputProblem, formatTime12, splitTime24, type TimeOfDayInput } from '../lib/timeOfDay';

function todayDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Every band here folds, the same rule every tab follows, remembered per
// band through useBandFolds.
type Folds = ReturnType<typeof useBandFolds>;

function SignalsBand({
  folds,
  color,
  id,
  title,
  icon,
  count,
  children,
}: {
  folds: Folds;
  color: string;
  id: string;
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  count?: number;
  children: ReactNode;
}) {
  return (
    <View style={bandStyles.bandOut}>
      <HomeSectionBand
        kind="fold"
        title={count == null ? title : `${title} (${count})`}
        icon={icon}
        color={color}
        expanded={folds.isOpen(id)}
        onToggle={() => folds.toggle(id)}
      >
        {children}
      </HomeSectionBand>
    </View>
  );
}

// Signals' own lens content is inset 16 (app/(tabs)/log.tsx), the same as
// Schedules, so a band reaches the edge by cancelling that.
const CONTENT_INSET = 16;
const bandStyles = StyleSheet.create({ bandOut: { marginHorizontal: -CONTENT_INSET } });
type TherapyFormState = {
  editingId: string | null;
  therapyType: string;
  date: string;
  time: TimeOfDayInput;
  practitioner: string;
  bodyFocus: string;
  durationMinutes: string;
  cost: string;
  notes: string;
};

function blankTherapyForm(): TherapyFormState {
  return {
    editingId: null,
    therapyType: 'chiropractic',
    date: todayDateString(),
    time: { hour: '10', minute: '00', ampm: 'AM' },
    practitioner: '',
    bodyFocus: '',
    durationMinutes: '',
    cost: '',
    notes: '',
  };
}

// Hands-on therapy sessions, 2026-09-04. The collecting half of the
// tracker; the reading half is Trends > Therapy Response, per this
// project's own standing "tool areas collect data, Trends reports it"
// split. Built as a Schedules lens and moved to Signals on 2026-09-13,
// direct: "Schedules needs to be about the actual schedules for each
// category or topic." A session here already happened, which is what
// Signals holds; its own help text had said as much and pointed the next
// visit to Appointments.
type Props = { tabColor: string };

export function TherapySessionsSection({ tabColor }: Props) {
  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);
  const folds = useBandFolds();
  const [sessions, setSessions] = useState<TherapySessionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TherapyFormState>(blankTherapyForm());
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [removePrompt, setRemovePrompt] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(
    null,
  );

  const load = useCallback(() => {
    setLoading(true);
    listTherapySessions({ limit: 200 })
      .then(setSessions)
      .catch((error) => {
        setErrorMessage(`Could not load sessions: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function openAddForm() {
    setForm(blankTherapyForm());
    setShowForm(true);
  }

  function openEditForm(session: TherapySessionRecord) {
    setForm({
      editingId: session.id,
      therapyType: session.therapyType,
      date: session.performedAt.slice(0, 10),
      time: splitTime24(session.performedAt.split('T')[1] ?? null),
      practitioner: session.practitioner ?? '',
      bodyFocus: session.bodyFocus ?? '',
      durationMinutes: session.durationMinutes != null ? String(session.durationMinutes) : '',
      cost: session.cost != null ? String(session.cost) : '',
      notes: session.notes ?? '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(blankTherapyForm());
  }

  async function handleSaveForm() {
    if (!isValidDateString(form.date)) {
      showInfoAlert('Almost there', 'Enter a valid date (YYYY-MM-DD).');
      return;
    }
    const time24 = buildTime24(form.time.hour, form.time.minute, form.time.ampm);
    if (!time24) {
      showInfoAlert('Almost there', describeTimeInputProblem(form.time.hour, form.time.minute, form.time.ampm));
      return;
    }

    // A blank optional number stays null rather than becoming 0. A
    // session recorded as costing zero and one where nobody typed a cost
    // are different facts, and averaging the second into a spend total as
    // if it were the first would quietly understate what this is costing.
    const parseOptionalNumber = (raw: string): number | undefined => {
      const trimmed = raw.trim();
      if (!trimmed) return undefined;
      const value = Number(trimmed);
      return Number.isFinite(value) && value >= 0 ? value : undefined;
    };

    if (form.durationMinutes.trim() && parseOptionalNumber(form.durationMinutes) === undefined) {
      showInfoAlert('Almost there', 'Length has to be a number of minutes, or left empty.');
      return;
    }
    if (form.cost.trim() && parseOptionalNumber(form.cost) === undefined) {
      showInfoAlert('Almost there', 'Cost has to be a number, or left empty.');
      return;
    }

    const payload = {
      performedAt: `${form.date}T${time24}`,
      therapyType: form.therapyType,
      practitioner: form.practitioner,
      bodyFocus: form.bodyFocus,
      durationMinutes: parseOptionalNumber(form.durationMinutes),
      cost: parseOptionalNumber(form.cost),
      notes: form.notes,
    };

    try {
      if (form.editingId) await updateTherapySession(form.editingId, payload);
      else await createTherapySession(payload);
      closeForm();
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  function handleRemove(session: TherapySessionRecord) {
    setRemovePrompt({
      title: 'Remove this session?',
      // Names the real consequence rather than a generic warning: the
      // whole point of these rows is the follow-up reading built on them,
      // so deleting one changes a figure elsewhere in the app.
      message: `This deletes the ${therapyTypeLabel(session.therapyType)} on ${formatShortDate(
        session.performedAt.slice(0, 10),
      )}. Trends > Therapy Response is worked out from these sessions, so removing one changes what it shows.`,
      actions: [
        {
          label: 'Remove',
          destructive: true,
          onPress: async () => {
            setRemovePrompt(null);
            try {
              await deleteTherapySession(session.id);
              load();
            } catch (error) {
              showInfoAlert('Could not remove', error instanceof Error ? error.message : String(error));
            }
          },
        },
        { label: 'Keep it', onPress: () => setRemovePrompt(null) },
      ],
    });
  }

  const therapyGroups = getTherapyTypesByCategory();
  const selectedTherapy = therapyGroups
    .flatMap((group) => group.types)
    .find((type) => type.code === form.therapyType);

  return (
    <View style={styles.bodyContent}>
      {infoAlertElement}
      <AppActionSheet
        visible={removePrompt !== null}
        onClose={() => setRemovePrompt(null)}
        title={removePrompt?.title}
        message={removePrompt?.message}
        actions={removePrompt?.actions ?? []}
      />
      {loading ? (
        <View style={styles.bandBox}><Text style={styles.emptyText}>Loading…</Text></View>
      ) : errorMessage ? (
        <View style={styles.bandBox}><Text style={styles.errorText}>{errorMessage}</Text></View>
      ) : (
        <>
          {!showForm ? (
            <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
              <Text style={styles.addButtonText}>+ Log a session</Text>
            </TouchableOpacity>
          ) : null}

          {showForm ? (
            <View style={styles.formCard}>
              <Text style={styles.label}>What kind of session</Text>
              {therapyGroups.map((group) => (
                <View key={group.category}>
                  <Text style={styles.helperText}>{group.label}</Text>
                  <View style={styles.pillRow}>
                    {group.types.map((type) => (
                      <TouchableOpacity
                        key={type.code}
                        style={[styles.pill, form.therapyType === type.code && styles.pillActive]}
                        onPress={() => setForm((current) => ({ ...current, therapyType: type.code }))}
                      >
                        <Text style={[styles.pillText, form.therapyType === type.code && styles.pillTextActive]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
              {selectedTherapy ? <Text style={styles.helperText}>{selectedTherapy.description}</Text> : null}

              <Text style={styles.label}>Date</Text>
              <View style={styles.timeRow}>
                <AppTextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="YYYY-MM-DD"
                  value={form.date}
                  onChangeText={(text) => setForm((current) => ({ ...current, date: text }))}
                />
                <TouchableOpacity
                  style={styles.pillSmall}
                  onPress={() => setForm((current) => ({ ...current, date: todayDateString() }))}
                >
                  <Text style={styles.pillTextSmall}>Today</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Time</Text>
              <View style={styles.timeRow}>
                <AppTextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="10"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={form.time.hour}
                  onChangeText={(text) => setForm((current) => ({ ...current, time: { ...current.time, hour: text } }))}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <AppTextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="00"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={form.time.minute}
                  onChangeText={(text) => setForm((current) => ({ ...current, time: { ...current.time, minute: text } }))}
                />
                <View style={styles.pillRow}>
                  {(['AM', 'PM'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.pillSmall, form.time.ampm === option && styles.pillActive]}
                      onPress={() => setForm((current) => ({ ...current, time: { ...current.time, ampm: option } }))}
                    >
                      <Text style={[styles.pillTextSmall, form.time.ampm === option && styles.pillTextActive]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.labelRow}>
                <Text style={styles.label}>Who did it (optional)</Text>
                <VoiceInputButton
                  onResult={(text) => setForm((current) => ({ ...current, practitioner: text }))}
                  color={tabColor}
                />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. Dr. Alvarez"
                value={form.practitioner}
                onChangeText={(text) => setForm((current) => ({ ...current, practitioner: text }))}
              />

              <View style={styles.labelRow}>
                <Text style={styles.label}>What they worked on (optional)</Text>
                <VoiceInputButton onResult={(text) => setForm((current) => ({ ...current, bodyFocus: text }))} color={tabColor} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. sacrum and lower back"
                value={form.bodyFocus}
                onChangeText={(text) => setForm((current) => ({ ...current, bodyFocus: text }))}
              />

              <Text style={styles.label}>Length in minutes (optional)</Text>
              <AppTextInput
                style={[styles.input, styles.dateInput]}
                placeholder="e.g. 45"
                keyboardType="number-pad"
                value={form.durationMinutes}
                onChangeText={(text) => setForm((current) => ({ ...current, durationMinutes: text }))}
              />

              <Text style={styles.label}>Cost (optional)</Text>
              <AppTextInput
                style={[styles.input, styles.dateInput]}
                placeholder="e.g. 60"
                keyboardType="decimal-pad"
                value={form.cost}
                onChangeText={(text) => setForm((current) => ({ ...current, cost: text }))}
              />

              <View style={styles.labelRow}>
                <Text style={styles.label}>Notes (optional)</Text>
                <VoiceInputButton onResult={(text) => setForm((current) => ({ ...current, notes: text }))} color={tabColor} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. felt looser right after, sore that evening"
                value={form.notes}
                onChangeText={(text) => setForm((current) => ({ ...current, notes: text }))}
              />

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={closeForm}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveForm}>
                  <Text style={styles.primaryButtonText}>{form.editingId ? 'Save changes' : 'Log session'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <SignalsBand folds={folds} color={tabColor} id="signals:therapies:list" title="Sessions" icon="hand-left-outline" count={sessions.length}>
          {sessions.length === 0 ? (
            <Text style={[styles.emptyText, styles.panelStandalone]}>
              No sessions logged yet. Log one after your next appointment, then keep doing your ordinary check-ins on Signals.
              Once there are a few of each, Trends {'>'} Therapy Response can show how long the effect lasted.
            </Text>
          ) : (
            <View style={styles.table}>
              {sessions.map((session) => (
                <View key={session.id} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={[styles.rowTime, styles.appointmentRowTime]}>
                      {formatShortDate(session.performedAt.slice(0, 10))}
                      {'\n'}
                      {formatTime12(session.performedAt.split('T')[1] ?? '')}
                    </Text>
                    <View style={styles.rowTextCol}>
                      <Text style={styles.rowTitle}>{therapyTypeLabel(session.therapyType)}</Text>
                      <Text style={styles.rowMeta}>
                        {[
                          session.practitioner,
                          session.bodyFocus,
                          session.durationMinutes != null ? `${session.durationMinutes} min` : null,
                          session.cost != null ? `${session.cost}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                      {session.notes ? <Text style={styles.rowMeta}>{session.notes}</Text> : null}
                    </View>
                  </View>

                  <View style={styles.rowActions}>
                    <TouchableOpacity onPress={() => openEditForm(session)}>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemove(session)}>
                      <Text style={styles.actionTextRemove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
          </SignalsBand>
        </>
      )}
    </View>
  );
}

function makeStyles(tabColor: string) {
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
    appointmentRowTime: { width: 76, lineHeight: 16 },
    bandBox: {
      ...homeBandStyle,
      borderColor: tabColor,
      marginHorizontal: -CONTENT_INSET,
      padding: HOME_BAND_CONTENT_PADDING,
    },
    bodyContent: { gap: HOME_BAND_GAP },
    dateInput: { flex: 1 },
    emptyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
    errorText: { ...typography.body, color: colors.danger, ...textShadow },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
    formCard: {
      ...homeBandStyle,
      borderColor: tabColor,
      marginHorizontal: -CONTENT_INSET,
      padding: HOME_BAND_CONTENT_PADDING,
    },
    helperText: { ...typography.caption, color: tabColor, marginTop: 4, marginBottom: 8, ...textShadow },
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
    label: { ...typography.label, color: tabColor, marginBottom: 6, marginTop: 10, ...textShadow },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    panelStandalone: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    pill: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pillSmall: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    pillText: { ...typography.caption, color: tabColor, textTransform: 'capitalize', ...textShadow },
    pillTextActive: { color: colors.textOnPrimary,

      // Dark text: cancel any shadow inherited from a base style it is

      // composed with. See constants/typography.ts.

      textShadowColor: 'transparent',

      textShadowRadius: 0,

    },
    pillTextSmall: { ...typography.caption, color: tabColor, ...textShadow },
    primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
    primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton,

      // Dark text: cancel any shadow inherited from a base style it is

      // composed with. See constants/typography.ts.

      textShadowColor: 'transparent',

      textShadowRadius: 0,
    },
    row: {
      borderRadius: 10,
      backgroundColor: colors.surfaceMuted,
      padding: 12,
    },
    rowActions: { flexDirection: 'row', gap: 16, marginTop: 10, marginLeft: 80 },
    rowMain: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    rowMeta: { ...typography.caption, color: tabColor, marginTop: 2, ...textShadow },
    rowTextCol: { flex: 1 },
    rowTime: { ...typography.captionEmphasis, color: tabColor, width: 68, ...textShadow },
    rowTitle: { ...typography.label, color: tabColor, ...textShadow },
    secondaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    secondaryButtonText: { ...typography.bodyEmphasis, color: tabColor, ...textShadow },
    table: { gap: HOME_BAND_GAP },
    timeInput: { width: 56, textAlign: 'center' },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timeSeparator: { ...typography.label, color: tabColor, ...textShadow },
  });
}
