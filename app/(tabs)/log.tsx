import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { HelpSection } from '../../components/HelpButton';
import { LensHub, type LensOption } from '../../components/LensHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { ScreenBackground } from '../../components/ScreenBackground';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { typography } from '../../constants/typography';
import { getCheckinTagsByCategory, type CheckinTagDefinition } from '../../lib/checkinTags';
import {
  createFoodTrial,
  deleteBodyMeasurement,
  deleteCheckin,
  deleteExerciseLog,
  deleteFoodTrial,
  listBodyMeasurements,
  listCheckins,
  listExerciseLogs,
  listFoodTrials,
  recordBodyMeasurement,
  recordCheckin,
  recordExercise,
  resolveFoodTrial,
  type BodyMeasurementRecord,
  type ExerciseLog,
  type FoodTrialRecord,
  type WellbeingCheckin,
} from '../../lib/db';
import { buildTime24, formatTime12, splitTime24, type TimeOfDayInput } from '../../lib/timeOfDay';

// Four lenses, mirroring the Insights/Schedule tabs' own lens pattern --
// all four are real/built here, unlike Schedule's "some stubbed" approach,
// since each is a small, self-contained log rather than a big planning
// system.
type Lens = 'flares' | 'foodReactions' | 'newFoods' | 'other';

const LENSES: LensOption<Lens>[] = [
  { key: 'flares', label: 'Flares', icon: 'pulse-outline' },
  { key: 'foodReactions', label: 'Food Reactions', icon: 'warning-outline' },
  { key: 'newFoods', label: 'New Foods', icon: 'add-circle-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const LOG_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this tab is for',
    body: "A place to write down what's actually happening to you, separate from what you planned (Schedules) or what the cited D1-D6/nutrient scoring says (Insights). This is your own observations -- flares, reactions, and anything else worth remembering.",
  },
  {
    heading: 'Flares',
    body: "Log a Hashimoto's flare-up: when it started, how severe, and which symptoms were part of it. Over time, Trends can look for patterns between flares and what you were eating, taking, or doing.",
  },
  {
    heading: 'Food Reactions',
    body: 'A specific food or drink that seems to have caused a problem. Different from Flares in that it starts from a food, not a symptom.',
  },
  {
    heading: 'New Foods',
    body: "Reintroducing a food you've been avoiding, or trying something new for the first time? Start a trial here. Once your chosen watch window passes, mark it cleared or flagged -- or mark it earlier if something happens right away.",
  },
  {
    heading: 'Other',
    body: "A lightweight place for exercise, blood pressure readings, or a quick note about a prescription or supplement. This isn't meant to replace dedicated tracking for any of these -- just somewhere to jot it down for now.",
  },
  {
    heading: 'Personal notes, not medical fact',
    body: "Everything here is your own record of your own body -- distinct from this app's cited food scoring and DRI targets elsewhere. Nothing you log here is treated as verified medical fact, the same way this app never confuses a personal hunch with a cited rule.",
  },
];

function todayDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function dateStringDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowTimeString24(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function dateLabelFromParts(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatEntryDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return dateLabelFromParts(year, month, day);
}

function formatEntryDateTime(value: string): string {
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  return `${dateLabelFromParts(year, month, day)}, ${formatTime12(timePart ?? '00:00')}`;
}

type DateChoice = 'today' | 'yesterday' | 'custom';

function resolveDateChoice(choice: DateChoice, customDate: string): string | null {
  if (choice === 'today') return todayDateString();
  if (choice === 'yesterday') return dateStringDaysAgo(1);
  const trimmed = customDate.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function resolveDateTime(choice: DateChoice, customDate: string, time: TimeOfDayInput): string | null {
  const date = resolveDateChoice(choice, customDate);
  if (!date) return null;
  const time24 = buildTime24(time.hour, time.minute, time.ampm);
  if (!time24) return null;
  return `${date}T${time24}`;
}

function DateChoicePicker({
  value,
  onChange,
  customDate,
  onCustomDateChange,
}: {
  value: DateChoice;
  onChange: (choice: DateChoice) => void;
  customDate: string;
  onCustomDateChange: (text: string) => void;
}) {
  return (
    <>
      <View style={styles.pillRow}>
        {(['today', 'yesterday', 'custom'] as const).map((choice) => (
          <TouchableOpacity
            key={choice}
            style={[styles.pill, value === choice && styles.pillActive]}
            onPress={() => onChange(choice)}
          >
            <Text style={[styles.pillText, value === choice && styles.pillTextActive]}>
              {choice === 'today' ? 'Today' : choice === 'yesterday' ? 'Yesterday' : 'Custom date'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {value === 'custom' ? (
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={customDate}
          onChangeText={onCustomDateChange}
        />
      ) : null}
    </>
  );
}

function TimePicker({ value, onChange }: { value: TimeOfDayInput; onChange: (value: TimeOfDayInput) => void }) {
  return (
    <View style={styles.timeRow}>
      <TextInput
        style={[styles.input, styles.timeInput]}
        placeholder="8"
        keyboardType="number-pad"
        maxLength={2}
        value={value.hour}
        onChangeText={(text) => onChange({ ...value, hour: text })}
      />
      <Text style={styles.timeSeparator}>:</Text>
      <TextInput
        style={[styles.input, styles.timeInput]}
        placeholder="00"
        keyboardType="number-pad"
        maxLength={2}
        value={value.minute}
        onChangeText={(text) => onChange({ ...value, minute: text })}
      />
      <View style={styles.pillRow}>
        {(['AM', 'PM'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.pillSmall, value.ampm === option && styles.pillActive]}
            onPress={() => onChange({ ...value, ampm: option })}
          >
            <Text style={[styles.pillTextSmall, value.ampm === option && styles.pillTextActive]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const SEVERITY_OPTIONS = [
  { value: 1, label: 'Mild' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Severe' },
  { value: 4, label: 'Very severe' },
];

function SeverityPicker({ value, onChange }: { value: number | null; onChange: (value: number) => void }) {
  return (
    <View style={styles.pillRow}>
      {SEVERITY_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[styles.pill, value === option.value && styles.pillActive]}
          onPress={() => onChange(option.value)}
        >
          <Text style={[styles.pillText, value === option.value && styles.pillTextActive]}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Only negative-leaning tags make sense to offer here -- a flare or a food
// reaction is inherently a "something's wrong" report, so tags like "slept
// well" or "good energy" (also in lib/checkinTags.ts, for other check-in
// types this app doesn't build a UI for yet) would just be noise.
const NEGATIVE_TAG_GROUPS = getCheckinTagsByCategory()
  .map((group) => ({ ...group, tags: group.tags.filter((tag) => tag.usualValence === 'negative') }))
  .filter((group) => group.tags.length > 0);

function tagLabel(code: string): string {
  const allTags: CheckinTagDefinition[] = NEGATIVE_TAG_GROUPS.flatMap((group) => group.tags);
  return allTags.find((tag) => tag.code === code)?.label ?? code;
}

function TagPicker({ selected, onToggle }: { selected: string[]; onToggle: (code: string) => void }) {
  return (
    <View>
      {NEGATIVE_TAG_GROUPS.map((group) => (
        <View key={group.category} style={styles.tagGroup}>
          <Text style={styles.tagGroupLabel}>{group.label}</Text>
          <View style={styles.pillRow}>
            {group.tags.map((tag) => (
              <TouchableOpacity
                key={tag.code}
                style={[styles.pillSmall, selected.includes(tag.code) && styles.pillActive]}
                onPress={() => onToggle(tag.code)}
              >
                <Text style={[styles.pillTextSmall, selected.includes(tag.code) && styles.pillTextActive]}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// Shared by Flares and Food Reactions -- both are a moment-in-time
// wellbeing_checkins report with a severity and symptom tags, just with a
// different checkinType and (for reactions) a food name up front.
function CheckinForm({
  foodNameField,
  severity,
  onSeverityChange,
  tags,
  onToggleTag,
  notes,
  onNotesChange,
  dateChoice,
  onDateChoiceChange,
  customDate,
  onCustomDateChange,
  time,
  onTimeChange,
  onCancel,
  onSave,
  saveLabel,
}: {
  foodNameField?: { value: string; onChange: (text: string) => void };
  severity: number | null;
  onSeverityChange: (value: number) => void;
  tags: string[];
  onToggleTag: (code: string) => void;
  notes: string;
  onNotesChange: (text: string) => void;
  dateChoice: DateChoice;
  onDateChoiceChange: (choice: DateChoice) => void;
  customDate: string;
  onCustomDateChange: (text: string) => void;
  time: TimeOfDayInput;
  onTimeChange: (value: TimeOfDayInput) => void;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <View style={styles.formCard}>
      {foodNameField ? (
        <>
          <Text style={styles.label}>What did you eat or drink?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Greek yogurt with honey"
            value={foodNameField.value}
            onChangeText={foodNameField.onChange}
          />
        </>
      ) : null}
      <Text style={styles.label}>When did it start?</Text>
      <DateChoicePicker
        value={dateChoice}
        onChange={onDateChoiceChange}
        customDate={customDate}
        onCustomDateChange={onCustomDateChange}
      />
      <Text style={styles.label}>About what time?</Text>
      <TimePicker value={time} onChange={onTimeChange} />
      <Text style={styles.label}>How severe?</Text>
      <SeverityPicker value={severity} onChange={onSeverityChange} />
      <Text style={styles.label}>What symptoms? (optional)</Text>
      <TagPicker selected={tags} onToggle={onToggleTag} />
      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Anything else worth remembering"
        multiline
        value={notes}
        onChangeText={onNotesChange}
      />
      <View style={styles.formActions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={onSave}>
          <Text style={styles.primaryButtonText}>{saveLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CheckinRow({ entry, onDelete }: { entry: WellbeingCheckin; onDelete: (id: string) => void }) {
  const severityLabel = SEVERITY_OPTIONS.find((option) => option.value === entry.severity)?.label;
  return (
    <View style={styles.row}>
      <View style={styles.rowTextCol}>
        <Text style={styles.rowTitle}>
          {entry.foodName ? entry.foodName : severityLabel ?? 'Logged'}
        </Text>
        <Text style={styles.rowMeta}>
          {formatEntryDateTime(entry.loggedAt)}
          {entry.foodName && severityLabel ? ` · ${severityLabel}` : ''}
        </Text>
        {entry.tags.length > 0 ? (
          <Text style={styles.rowMeta}>{entry.tags.map((code) => tagLabel(code)).join(', ')}</Text>
        ) : null}
        {entry.notes ? <Text style={styles.rowMeta}>{entry.notes}</Text> : null}
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity onPress={() => onDelete(entry.id)}>
          <Text style={styles.actionTextRemove}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FlaresLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [entries, setEntries] = useState<WellbeingCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [dateChoice, setDateChoice] = useState<DateChoice>('today');
  const [customDate, setCustomDate] = useState('');
  const [time, setTime] = useState<TimeOfDayInput>(() => splitTime24(nowTimeString24()));
  const [severity, setSeverity] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    listCheckins({ checkinType: 'flare', limit: 100 }).then((rows) => {
      setEntries(rows);
      setLoading(false);
    });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function resetForm() {
    setDateChoice('today');
    setCustomDate('');
    setTime(splitTime24(nowTimeString24()));
    setSeverity(null);
    setTags([]);
    setNotes('');
  }

  function toggleTag(code: string) {
    setTags((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));
  }

  async function handleSave() {
    const loggedAt = resolveDateTime(dateChoice, customDate, time);
    if (!loggedAt) {
      Alert.alert('Enter a valid date and time.');
      return;
    }
    if (severity == null) {
      Alert.alert('Select how severe this flare felt.');
      return;
    }
    await recordCheckin({ loggedAt, checkinType: 'flare', valence: 'negative', severity, notes, tags });
    setFormOpen(false);
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    await deleteCheckin(id);
    load();
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {!formOpen ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setFormOpen(true)}>
          <Text style={styles.addButtonText}>+ Log a flare</Text>
        </TouchableOpacity>
      ) : (
        <CheckinForm
          severity={severity}
          onSeverityChange={setSeverity}
          tags={tags}
          onToggleTag={toggleTag}
          notes={notes}
          onNotesChange={setNotes}
          dateChoice={dateChoice}
          onDateChoiceChange={setDateChoice}
          customDate={customDate}
          onCustomDateChange={setCustomDate}
          time={time}
          onTimeChange={setTime}
          onCancel={() => { setFormOpen(false); resetForm(); }}
          onSave={handleSave}
          saveLabel="Save flare"
        />
      )}

      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : entries.length === 0 ? (
        <Text style={styles.emptyText}>No flares logged yet.</Text>
      ) : (
        <View style={styles.table}>
          {entries.map((entry) => (
            <CheckinRow key={entry.id} entry={entry} onDelete={handleDelete} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function FoodReactionsLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [entries, setEntries] = useState<WellbeingCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [dateChoice, setDateChoice] = useState<DateChoice>('today');
  const [customDate, setCustomDate] = useState('');
  const [time, setTime] = useState<TimeOfDayInput>(() => splitTime24(nowTimeString24()));
  const [severity, setSeverity] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    listCheckins({ checkinType: 'post_meal', limit: 100 }).then((rows) => {
      setEntries(rows);
      setLoading(false);
    });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function resetForm() {
    setFoodName('');
    setDateChoice('today');
    setCustomDate('');
    setTime(splitTime24(nowTimeString24()));
    setSeverity(null);
    setTags([]);
    setNotes('');
  }

  function toggleTag(code: string) {
    setTags((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));
  }

  async function handleSave() {
    if (!foodName.trim()) {
      Alert.alert('Enter what you ate or drank.');
      return;
    }
    const loggedAt = resolveDateTime(dateChoice, customDate, time);
    if (!loggedAt) {
      Alert.alert('Enter a valid date and time.');
      return;
    }
    if (severity == null) {
      Alert.alert('Select how severe the reaction felt.');
      return;
    }
    await recordCheckin({
      loggedAt,
      checkinType: 'post_meal',
      valence: 'negative',
      severity,
      notes,
      foodName,
      tags,
    });
    setFormOpen(false);
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    await deleteCheckin(id);
    load();
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {!formOpen ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setFormOpen(true)}>
          <Text style={styles.addButtonText}>+ Log a food reaction</Text>
        </TouchableOpacity>
      ) : (
        <CheckinForm
          foodNameField={{ value: foodName, onChange: setFoodName }}
          severity={severity}
          onSeverityChange={setSeverity}
          tags={tags}
          onToggleTag={toggleTag}
          notes={notes}
          onNotesChange={setNotes}
          dateChoice={dateChoice}
          onDateChoiceChange={setDateChoice}
          customDate={customDate}
          onCustomDateChange={setCustomDate}
          time={time}
          onTimeChange={setTime}
          onCancel={() => { setFormOpen(false); resetForm(); }}
          onSave={handleSave}
          saveLabel="Save reaction"
        />
      )}

      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : entries.length === 0 ? (
        <Text style={styles.emptyText}>No food reactions logged yet.</Text>
      ) : (
        <View style={styles.table}>
          {entries.map((entry) => (
            <CheckinRow key={entry.id} entry={entry} onDelete={handleDelete} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function NewFoodsLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [trials, setTrials] = useState<FoodTrialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [dateChoice, setDateChoice] = useState<DateChoice>('today');
  const [customDate, setCustomDate] = useState('');
  const [observationDays, setObservationDays] = useState('3');

  const load = useCallback(() => {
    setLoading(true);
    listFoodTrials().then((rows) => {
      setTrials(rows);
      setLoading(false);
    });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function resetForm() {
    setFoodName('');
    setDateChoice('today');
    setCustomDate('');
    setObservationDays('3');
  }

  async function handleSave() {
    if (!foodName.trim()) {
      Alert.alert('Enter the name of the food.');
      return;
    }
    const date = resolveDateChoice(dateChoice, customDate);
    if (!date) {
      Alert.alert('Enter a valid date.');
      return;
    }
    const days = Number(observationDays);
    await createFoodTrial({
      foodName,
      startedAt: `${date}T${nowTimeString24()}`,
      observationDays: Number.isFinite(days) && days > 0 ? days : 3,
    });
    setFormOpen(false);
    resetForm();
    load();
  }

  async function handleResolve(trial: FoodTrialRecord, status: 'cleared' | 'flagged') {
    await resolveFoodTrial(trial.id, status);
    load();
  }

  async function handleDelete(id: string) {
    await deleteFoodTrial(id);
    load();
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {!formOpen ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setFormOpen(true)}>
          <Text style={styles.addButtonText}>+ Start a new food trial</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.label}>What food are you introducing?</Text>
          <TextInput style={styles.input} placeholder="e.g. Quinoa" value={foodName} onChangeText={setFoodName} />
          <Text style={styles.label}>When did you start?</Text>
          <DateChoicePicker
            value={dateChoice}
            onChange={setDateChoice}
            customDate={customDate}
            onCustomDateChange={setCustomDate}
          />
          <Text style={styles.label}>Watch it for how many days?</Text>
          <TextInput
            style={[styles.input, styles.timeInput]}
            keyboardType="number-pad"
            maxLength={2}
            value={observationDays}
            onChangeText={setObservationDays}
          />
          <Text style={styles.helperText}>
            3 days is a common starting point for "probably fine" -- you can mark it earlier if something happens
            right away, or later if you want to keep watching.
          </Text>
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => { setFormOpen(false); resetForm(); }}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Start trial</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : trials.length === 0 ? (
        <Text style={styles.emptyText}>No food trials yet.</Text>
      ) : (
        <View style={styles.table}>
          {trials.map((trial) => {
            const daysElapsed = Math.floor((Date.now() - new Date(trial.startedAt).getTime()) / (24 * 60 * 60 * 1000));
            const daysLeft = trial.observationDays - daysElapsed;
            return (
              <View key={trial.id} style={styles.row}>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTitle}>{trial.foodName}</Text>
                  <Text style={styles.rowMeta}>Started {formatEntryDate(trial.startedAt)}</Text>
                  {trial.status === 'trialing' ? (
                    daysLeft > 0 ? (
                      <Text style={styles.rowMeta}>{daysLeft} day{daysLeft === 1 ? '' : 's'} left to watch</Text>
                    ) : (
                      <Text style={[styles.rowMeta, styles.readyText]}>Ready to review</Text>
                    )
                  ) : trial.status === 'cleared' ? (
                    <Text style={[styles.rowMeta, styles.clearedText]}>No problems -- cleared</Text>
                  ) : (
                    <Text style={[styles.rowMeta, styles.flaggedText]}>Caused a problem</Text>
                  )}
                </View>
                <View style={styles.rowActions}>
                  {trial.status === 'trialing' ? (
                    <>
                      <TouchableOpacity onPress={() => handleResolve(trial, 'cleared')}>
                        <Text style={styles.actionTextPrimary}>No problems</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleResolve(trial, 'flagged')}>
                        <Text style={styles.actionTextRemove}>Flag it</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                  <TouchableOpacity onPress={() => handleDelete(trial.id)}>
                    <Text style={styles.actionText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function ExerciseSection() {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [exerciseType, setExerciseType] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'vigorous' | null>(null);
  const [dateChoice, setDateChoice] = useState<DateChoice>('today');
  const [customDate, setCustomDate] = useState('');

  const load = useCallback(() => {
    listExerciseLogs(20).then(setLogs);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function resetForm() {
    setExerciseType('');
    setDurationMinutes('');
    setIntensity(null);
    setDateChoice('today');
    setCustomDate('');
  }

  async function handleSave() {
    if (!exerciseType.trim()) {
      Alert.alert('Enter what kind of activity this was.');
      return;
    }
    const date = resolveDateChoice(dateChoice, customDate);
    if (!date) {
      Alert.alert('Enter a valid date.');
      return;
    }
    const minutes = Number(durationMinutes);
    await recordExercise({
      loggedAt: `${date}T${nowTimeString24()}`,
      exerciseType,
      durationMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : undefined,
      intensity: intensity ?? undefined,
    });
    setFormOpen(false);
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    await deleteExerciseLog(id);
    load();
  }

  return (
    <View>
      {!formOpen ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setFormOpen(true)}>
          <Text style={styles.addButtonText}>+ Log exercise</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.label}>What did you do?</Text>
          <TextInput style={styles.input} placeholder="e.g. Walk, yoga, weights" value={exerciseType} onChangeText={setExerciseType} />
          <Text style={styles.label}>How long? (minutes, optional)</Text>
          <TextInput
            style={[styles.input, styles.timeInput]}
            keyboardType="number-pad"
            value={durationMinutes}
            onChangeText={setDurationMinutes}
          />
          <Text style={styles.label}>Intensity (optional)</Text>
          <View style={styles.pillRow}>
            {(['light', 'moderate', 'vigorous'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.pill, intensity === option && styles.pillActive]}
                onPress={() => setIntensity(option)}
              >
                <Text style={[styles.pillText, intensity === option && styles.pillTextActive]}>
                  {option[0].toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>When?</Text>
          <DateChoicePicker value={dateChoice} onChange={setDateChoice} customDate={customDate} onCustomDateChange={setCustomDate} />
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => { setFormOpen(false); resetForm(); }}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {logs.length === 0 ? (
        <Text style={styles.emptyText}>No exercise logged yet.</Text>
      ) : (
        <View style={styles.table}>
          {logs.map((log) => (
            <View key={log.id} style={styles.row}>
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>{log.exerciseType}</Text>
                <Text style={styles.rowMeta}>
                  {formatEntryDateTime(log.loggedAt)}
                  {log.durationMinutes ? ` · ${log.durationMinutes} min` : ''}
                  {log.intensity ? ` · ${log.intensity}` : ''}
                </Text>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => handleDelete(log.id)}>
                  <Text style={styles.actionTextRemove}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

type BpReading = {
  loggedAt: string;
  systolic: number;
  diastolic: number;
  bpm: number | null;
  systolicId: string;
  diastolicId: string;
  bpmId: string | null;
};

function pairBloodPressureReadings(
  systolicRows: BodyMeasurementRecord[],
  diastolicRows: BodyMeasurementRecord[],
  bpmRows: BodyMeasurementRecord[],
): BpReading[] {
  const diastolicByTime = new Map(diastolicRows.map((row) => [row.loggedAt, row]));
  const bpmByTime = new Map(bpmRows.map((row) => [row.loggedAt, row]));
  const readings: BpReading[] = [];
  for (const sys of systolicRows) {
    const dia = diastolicByTime.get(sys.loggedAt);
    if (dia) {
      const bpm = bpmByTime.get(sys.loggedAt);
      readings.push({
        loggedAt: sys.loggedAt,
        systolic: sys.value,
        diastolic: dia.value,
        bpm: bpm?.value ?? null,
        systolicId: sys.id,
        diastolicId: dia.id,
        bpmId: bpm?.id ?? null,
      });
    }
  }
  return readings;
}

function BloodPressureSection() {
  const [readings, setReadings] = useState<BpReading[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bpm, setBpm] = useState('');
  const [dateChoice, setDateChoice] = useState<DateChoice>('today');
  const [customDate, setCustomDate] = useState('');

  const load = useCallback(() => {
    Promise.all([
      listBodyMeasurements('blood_pressure_systolic', 30),
      listBodyMeasurements('blood_pressure_diastolic', 30),
      listBodyMeasurements('heart_rate_bpm', 30),
    ]).then(([systolicRows, diastolicRows, bpmRows]) => {
      setReadings(pairBloodPressureReadings(systolicRows, diastolicRows, bpmRows));
    });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function resetForm() {
    setSystolic('');
    setDiastolic('');
    setBpm('');
    setDateChoice('today');
    setCustomDate('');
  }

  async function handleSave() {
    const sys = Number(systolic);
    const dia = Number(diastolic);
    if (!Number.isFinite(sys) || !Number.isFinite(dia) || sys <= 0 || dia <= 0) {
      Alert.alert('Enter both a systolic and diastolic number.');
      return;
    }
    const date = resolveDateChoice(dateChoice, customDate);
    if (!date) {
      Alert.alert('Enter a valid date.');
      return;
    }
    const loggedAt = `${date}T${nowTimeString24()}`;
    await recordBodyMeasurement({ loggedAt, measurementType: 'blood_pressure_systolic', value: sys, unit: 'mmHg' });
    await recordBodyMeasurement({ loggedAt, measurementType: 'blood_pressure_diastolic', value: dia, unit: 'mmHg' });
    const heartRate = Number(bpm);
    if (Number.isFinite(heartRate) && heartRate > 0) {
      await recordBodyMeasurement({ loggedAt, measurementType: 'heart_rate_bpm', value: heartRate, unit: 'bpm' });
    }
    setFormOpen(false);
    resetForm();
    load();
  }

  async function handleDelete(reading: BpReading) {
    await deleteBodyMeasurement(reading.systolicId);
    await deleteBodyMeasurement(reading.diastolicId);
    if (reading.bpmId) {
      await deleteBodyMeasurement(reading.bpmId);
    }
    load();
  }

  return (
    <View>
      {!formOpen ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setFormOpen(true)}>
          <Text style={styles.addButtonText}>+ Log a blood pressure reading</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.label}>Reading</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="120"
              keyboardType="number-pad"
              maxLength={3}
              value={systolic}
              onChangeText={setSystolic}
            />
            <Text style={styles.timeSeparator}>/</Text>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="80"
              keyboardType="number-pad"
              maxLength={3}
              value={diastolic}
              onChangeText={setDiastolic}
            />
            <Text style={styles.helperText}>mmHg</Text>
          </View>
          <Text style={styles.label}>Heart rate (optional)</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="72"
              keyboardType="number-pad"
              maxLength={3}
              value={bpm}
              onChangeText={setBpm}
            />
            <Text style={styles.helperText}>BPM</Text>
          </View>
          <Text style={styles.label}>When?</Text>
          <DateChoicePicker value={dateChoice} onChange={setDateChoice} customDate={customDate} onCustomDateChange={setCustomDate} />
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => { setFormOpen(false); resetForm(); }}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {readings.length === 0 ? (
        <Text style={styles.emptyText}>No blood pressure readings yet.</Text>
      ) : (
        <View style={styles.table}>
          {readings.map((reading) => (
            <View key={reading.systolicId} style={styles.row}>
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>
                  {reading.systolic}/{reading.diastolic} mmHg{reading.bpm != null ? ` · ${reading.bpm} BPM` : ''}
                </Text>
                <Text style={styles.rowMeta}>{formatEntryDateTime(reading.loggedAt)}</Text>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => handleDelete(reading)}>
                  <Text style={styles.actionTextRemove}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function GeneralNoteSection() {
  const [notesList, setNotesList] = useState<WellbeingCheckin[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [dateChoice, setDateChoice] = useState<DateChoice>('today');
  const [customDate, setCustomDate] = useState('');

  const load = useCallback(() => {
    listCheckins({ checkinType: 'general', limit: 30 }).then(setNotesList);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function resetForm() {
    setNotes('');
    setDateChoice('today');
    setCustomDate('');
  }

  async function handleSave() {
    if (!notes.trim()) {
      Alert.alert('Write a quick note first.');
      return;
    }
    const date = resolveDateChoice(dateChoice, customDate);
    if (!date) {
      Alert.alert('Enter a valid date.');
      return;
    }
    await recordCheckin({ loggedAt: `${date}T${nowTimeString24()}`, checkinType: 'general', valence: 'neutral', notes });
    setFormOpen(false);
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    await deleteCheckin(id);
    load();
  }

  return (
    <View>
      {!formOpen ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setFormOpen(true)}>
          <Text style={styles.addButtonText}>+ Add a note</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="e.g. Started a new dose of vitamin D today"
            multiline
            value={notes}
            onChangeText={setNotes}
          />
          <Text style={styles.label}>When?</Text>
          <DateChoicePicker value={dateChoice} onChange={setDateChoice} customDate={customDate} onCustomDateChange={setCustomDate} />
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => { setFormOpen(false); resetForm(); }}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {notesList.length === 0 ? (
        <Text style={styles.emptyText}>No notes yet.</Text>
      ) : (
        <View style={styles.table}>
          {notesList.map((entry) => (
            <View key={entry.id} style={styles.row}>
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>{entry.notes}</Text>
                <Text style={styles.rowMeta}>{formatEntryDateTime(entry.loggedAt)}</Text>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                  <Text style={styles.actionTextRemove}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function OtherLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      <Text style={styles.sectionHeading}>Exercise</Text>
      <ExerciseSection />
      <Text style={[styles.sectionHeading, styles.sectionHeadingSpaced]}>Blood Pressure</Text>
      <BloodPressureSection />
      <Text style={[styles.sectionHeading, styles.sectionHeadingSpaced]}>General Note</Text>
      <Text style={styles.helperText}>
        For anything else worth remembering -- a prescription change, how a supplement felt, a drink you had.
      </Text>
      <GeneralNoteSection />
    </ScrollView>
  );
}

export default function LogScreen() {
  const [lens, setLens] = useState<Lens>('flares');
  const activeLensLabel = LENSES.find((option) => option.key === lens)?.label;

  return (
    <SwipeableTabScreen>
      <View style={styles.screen}>
        <View style={styles.header}>
          <ScreenHeader title="Bio-Compass" tabPath="/log" helpSections={LOG_HELP_SECTIONS} />
        </View>

        <ScreenBackground>
          {lens === 'flares' ? (
            <FlaresLens />
          ) : lens === 'foodReactions' ? (
            <FoodReactionsLens />
          ) : lens === 'newFoods' ? (
            <NewFoodsLens />
          ) : (
            <OtherLens />
          )}
        </ScreenBackground>

        <PageIdentityLabel title="Bio-Compass" activeLensLabel={activeLensLabel} />
        <LensHub pageTitle="Bio-Compass" options={LENSES} selected={lens} onSelect={setLens} />
      </View>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 12 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32 },
  emptyText: { ...typography.body, color: colors.textSecondary, marginBottom: 16 },
  addButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: { ...typography.bodyEmphasis, color: colors.primary },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: 6, marginTop: 10 },
  helperText: { ...typography.caption, color: colors.textSecondary, marginTop: 4, marginBottom: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  pillSmall: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: colors.textPrimary },
  pillTextSmall: { ...typography.caption, color: colors.textPrimary },
  pillTextActive: { color: colors.textOnPrimary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
  },
  multilineInput: { minHeight: 70, textAlignVertical: 'top' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { width: 56, textAlign: 'center' },
  timeSeparator: { ...typography.label, color: colors.textPrimary },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primary },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnPrimary },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.surface },
  row: { borderTopWidth: 1, borderTopColor: colors.border, padding: 12 },
  rowTextCol: { flex: 1 },
  rowTitle: { ...typography.label, color: colors.textPrimary },
  rowMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  actionText: { ...typography.captionEmphasis, color: colors.textSecondary },
  actionTextPrimary: { ...typography.captionEmphasis, color: colors.primary },
  actionTextRemove: { ...typography.captionEmphasis, color: colors.danger },
  tagGroup: { marginBottom: 8 },
  tagGroupLabel: { ...typography.eyebrow, color: colors.textMuted, marginBottom: 4 },
  sectionHeading: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 8 },
  sectionHeadingSpaced: { marginTop: 20 },
  readyText: { color: colors.statusFlagged },
  clearedText: { color: colors.primary },
  flaggedText: { color: colors.danger },
});
