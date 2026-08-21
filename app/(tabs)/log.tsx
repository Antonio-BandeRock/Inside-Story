import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../../components/AppTextInput';
import type { HelpSection } from '../../components/HelpButton';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { FoodLookup, type ResolvedFoodSelection } from '../../components/FoodLookup';
import { GatedTabContent } from '../../components/GatedTabContent';
import { useInfoAlert } from '../../components/InfoAlert';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { VoiceInputButton } from '../../components/VoiceInputButton';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import { getCheckinTagsByCategory, type CheckinTagDefinition } from '../../lib/checkinTags';
import { appendDictatedText, parseVoiceCommands } from '../../lib/voiceCommandParsing';
import {
  createFoodTrial,
  deleteBodyMeasurement,
  deleteCheckin,
  deleteExerciseLog,
  deleteFoodTrial,
  getFoodTrialHistory,
  getUserConditions,
  listAllConditions,
  listBodyMeasurements,
  listCheckins,
  listExerciseLogs,
  listFoodAllergies,
  listFoodTrials,
  recordBodyMeasurement,
  recordCheckin,
  recordExercise,
  reopenFoodTrial,
  resolveFoodTrial,
  scheduleFoodTrialCheckins,
  type BodyMeasurementRecord,
  type ConditionReference,
  type ExerciseLog,
  type FoodTrialRecord,
  type WellbeingCheckin,
} from '../../lib/db';
import { buildTime24, formatTime12, splitTime24, type TimeOfDayInput } from '../../lib/timeOfDay';

// Every text box on this page belongs to this one page's own tab, so
// there's no per-box lookup needed the way Home's multi-tab dashboard
// needed (see app/(tabs)/index.tsx's own tabColorFor) -- one fixed color,
// used everywhere a box on THIS page needs its border to carry that
// identity. Matches the same rule applied there, 2026-07-27.
const TAB_COLOR = colors.tabBioCompass;

// Mirrors the Insights/Schedule tabs' own lens pattern -- most of these
// are real/built here, unlike Schedule's "some stubbed" approach, since
// each is a small, self-contained log rather than a big planning system.
//
// 2026-07-28: Exercise, Blood Pressure, and General Note used to be three
// sections stacked inside one shared 'other' lens -- promoted to their
// own top-level lenses instead (their own real components already
// existed, see ExerciseSection/BloodPressureSection/GeneralNoteSection
// below; this only changes how they're reached, not what they log).
// 'other' itself is gone -- it had no content of its own beyond those
// three sections, so nothing is left for it to hold once they're pulled
// out. Nocturia added the same day as a new lens -- genuinely new
// territory, no logging schema exists for it yet (see NocturiaLens's own
// comment).
type Lens = 'flares' | 'foodReactions' | 'newFoods' | 'exercise' | 'bloodPressure' | 'generalNote' | 'nocturia';

// Shared caveat, appended to every lens's help -- same pattern as
// DRILLING_DOWN_HELP (insights.tsx), REPEATING_SCHEDULES_HELP (schedule.tsx),
// and TRENDS_PATTERN_CAVEAT_HELP (trends.tsx).
const LOG_PERSONAL_NOTES_HELP: HelpSection = {
  heading: 'Personal notes, not medical fact',
  body: "Everything here is your own record of your own body, distinct from this app's cited food scoring and DRI targets elsewhere. Nothing you log here is treated as verified medical fact, the same way this app never confuses a personal hunch with a cited rule.",
};

const LENSES: LensOption<Lens>[] = [
  {
    key: 'flares',
    label: 'Flares',
    icon: 'pulse-outline',
    help: [
      {
        heading: 'Flares',
        body: "Log a flare-up: when it started, how severe, and which symptoms were part of it. Over time, Trends can look for patterns between flares and what you were eating, taking, or doing.",
      },
      LOG_PERSONAL_NOTES_HELP,
    ],
  },
  {
    key: 'foodReactions',
    label: 'Food Reactions',
    icon: 'warning-outline',
    help: [
      {
        heading: 'Food Reactions',
        body: 'A specific food or drink that seems to have caused a problem. Different from Flares in that it starts from a food, not a symptom.',
      },
      LOG_PERSONAL_NOTES_HELP,
    ],
  },
  {
    key: 'newFoods',
    label: 'New Foods',
    icon: 'add-circle-outline',
    help: [
      {
        heading: 'New Foods',
        body: "Reintroducing a food you've been avoiding, or trying something new for the first time? Start a trial here. Once your chosen watch window passes, mark it cleared or flagged, or mark it earlier if something happens right away.",
      },
      LOG_PERSONAL_NOTES_HELP,
    ],
  },
  {
    key: 'exercise',
    label: 'Exercise',
    icon: 'walk-outline',
    help: [
      {
        heading: 'Exercise',
        body: 'A lightweight log of what you did and for how long, not meant to replace dedicated exercise tracking, just somewhere to jot it down for now.',
      },
      LOG_PERSONAL_NOTES_HELP,
    ],
  },
  {
    key: 'bloodPressure',
    label: 'Blood Pressure',
    icon: 'heart-outline',
    help: [
      {
        heading: 'Blood Pressure',
        body: 'Log a reading (systolic, diastolic, and pulse) whenever you take one.',
      },
      LOG_PERSONAL_NOTES_HELP,
    ],
  },
  {
    key: 'generalNote',
    label: 'General Note',
    icon: 'document-text-outline',
    help: [
      {
        heading: 'General Note',
        body: 'For anything else worth remembering: a prescription change, how a supplement felt, a drink you had.',
      },
      LOG_PERSONAL_NOTES_HELP,
    ],
  },
  {
    key: 'nocturia',
    label: 'Nocturia',
    icon: 'moon-outline',
    help: [
      {
        heading: 'Nocturia',
        body: 'Not built yet. Waking at night to urinate is a trackable symptom worth its own log, added as a placeholder here, 2026-07-28, until its own logging (how many times, what time) gets designed and built.',
      },
      LOG_PERSONAL_NOTES_HELP,
    ],
  },
];

const LOG_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'Why "Signals"?',
    body: "Autoimmune flares rarely come out of nowhere: your body usually sends signals first, fatigue, joint pain, brain fog, and other warning signs worth paying attention to before a full flare hits. This tab (renamed from Bio-Compass, 2026-07-27) is where you capture those signals as they happen, not just the flare itself once it's already arrived.",
  },
  {
    heading: 'What this tab is for',
    body: "A place to write down what's actually happening to you, separate from what you planned (Schedules) or what the cited 6-DFF (6 Dimensions of Food Friendliness)/nutrient scoring says (Insights). This is your own observations: flares, reactions, and anything else worth remembering.",
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
    body: "Reintroducing a food you've been avoiding, or trying something new for the first time? Start a trial here. Once your chosen watch window passes, mark it cleared or flagged, or mark it earlier if something happens right away.",
  },
  {
    heading: 'Exercise',
    body: 'A lightweight log of what you did and for how long, not meant to replace dedicated exercise tracking, just somewhere to jot it down for now.',
  },
  {
    heading: 'Blood Pressure',
    body: 'Log a reading (systolic, diastolic, and pulse) whenever you take one.',
  },
  {
    heading: 'General Note',
    body: 'For anything else worth remembering: a prescription change, how a supplement felt, a drink you had.',
  },
  {
    heading: 'Nocturia',
    body: 'Not built yet. Waking at night to urinate is a trackable symptom worth its own log, added as a placeholder here, 2026-07-28, until its own logging (how many times, what time) gets designed and built.',
  },
  {
    heading: 'Personal notes, not medical fact',
    body: "Everything here is your own record of your own body, distinct from this app's cited food scoring and DRI targets elsewhere. Nothing you log here is treated as verified medical fact, the same way this app never confuses a personal hunch with a cited rule.",
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
        <AppTextInput
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
      <AppTextInput
        style={[styles.input, styles.timeInput]}
        placeholder="8"
        keyboardType="number-pad"
        maxLength={2}
        value={value.hour}
        onChangeText={(text) => onChange({ ...value, hour: text })}
      />
      <Text style={styles.timeSeparator}>:</Text>
      <AppTextInput
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
          <View style={styles.noteLabelRow}>
            <Text style={styles.label}>What did you eat or drink?</Text>
            <VoiceInputButton onResult={foodNameField.onChange} size={16} />
          </View>
          <AppTextInput
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
      {/* 2026-08-16 -- same real dictation wiring as GeneralNoteSection's
          own Note field: only the FINAL transcript is parsed and
          appended, never a partial mid-sentence result. onNotesChange
          here is a plain prop, not a useState setter, so the current
          notes prop is read directly rather than via a functional
          update -- CheckinForm re-renders on every notes change anyway,
          so this closure always sees the real current value. */}
      <View style={styles.noteLabelRow}>
        <Text style={styles.label}>Notes (optional)</Text>
        <VoiceInputButton
          onResult={(transcript, isFinal) => {
            if (!isFinal) return;
            onNotesChange(appendDictatedText(notes, parseVoiceCommands(transcript)));
          }}
          size={16}
        />
      </View>
      <AppTextInput
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
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

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
      showInfoAlert('Almost there', 'Enter a valid date and time.');
      return;
    }
    if (severity == null) {
      showInfoAlert('Almost there', 'Select how severe this flare felt.');
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
      {infoAlertElement}
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
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

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
      showInfoAlert('Almost there', 'Enter what you ate or drank.');
      return;
    }
    const loggedAt = resolveDateTime(dateChoice, customDate, time);
    if (!loggedAt) {
      showInfoAlert('Almost there', 'Enter a valid date and time.');
      return;
    }
    if (severity == null) {
      showInfoAlert('Almost there', 'Select how severe the reaction felt.');
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
      {infoAlertElement}
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

// The structured food-testing/reintroduction feature, 2026-08-14 -- built
// out from the original, minimal free-text-only version per direct
// confirmation this deserved real depth: "the test it and log it loop
// needs to be real, and structured feature from day one." Real food
// identity (foodId/source/prepMethod, via FoodLookup -- the same picker
// every Food builder already uses), optional condition tagging, real
// per-food test history (getFoodTrialHistory), a best-effort allergy
// check, and real Schedule-driven daily reminders for the length of the
// window (scheduleFoodTrialCheckins) that prompt a lightweight "how did
// today go" check-in -- escalating to the same full tag/severity/notes
// CheckinForm every other lens here already uses only when something
// actually feels off, per the confirmed design. A trial always runs its
// full window by default regardless of a mid-window report (see
// lib/db.ts's own cancelFoodTrialCheckins comment) -- only the existing,
// unchanged manual resolveFoodTrial call ends it early.
function NewFoodsLens({ prefill }: { prefill?: ResolvedFoodSelection | null }) {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [trials, setTrials] = useState<FoodTrialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [pickingFood, setPickingFood] = useState(false);
  const [pickedFood, setPickedFood] = useState<ResolvedFoodSelection | null>(null);
  const [foodHistory, setFoodHistory] = useState<FoodTrialRecord[]>([]);
  const [foodAllergies, setFoodAllergies] = useState<string[]>([]);
  const [trackedConditions, setTrackedConditions] = useState<ConditionReference[]>([]);
  const [selectedConditionCode, setSelectedConditionCode] = useState<string | null>(null);
  const [foodName, setFoodName] = useState('');
  const [dateChoice, setDateChoice] = useState<DateChoice>('today');
  const [customDate, setCustomDate] = useState('');
  const [observationDays, setObservationDays] = useState('3');
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  // One real, live-fetched "did I already check in today" entry per active
  // trial -- undefined while not yet loaded, null once loaded and
  // confirmed nothing logged today, a real WellbeingCheckin once one has.
  const [todaysCheckinByTrial, setTodaysCheckinByTrial] = useState<Record<string, WellbeingCheckin | null>>({});
  // Which trial (if any) currently has the escalated full picker open --
  // at most one at a time, matching every other single-form-at-once
  // pattern already used throughout this file.
  const [escalatingTrialId, setEscalatingTrialId] = useState<string | null>(null);
  const [escalateSeverity, setEscalateSeverity] = useState<number | null>(null);
  const [escalateTags, setEscalateTags] = useState<string[]>([]);
  const [escalateNotes, setEscalateNotes] = useState('');
  const [escalateDateChoice, setEscalateDateChoice] = useState<DateChoice>('today');
  const [escalateCustomDate, setEscalateCustomDate] = useState('');
  const [escalateTime, setEscalateTime] = useState<TimeOfDayInput>(() => splitTime24(nowTimeString24()));

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([listFoodTrials(), getUserConditions(), listAllConditions(), listFoodAllergies()]).then(
      async ([rows, selectedCodes, allConditions, allergies]) => {
        setTrials(rows);
        setTrackedConditions(allConditions.filter((condition) => selectedCodes.includes(condition.code)));
        setFoodAllergies(allergies);
        setLoading(false);

        // Real, per-trial "checked in today yet" status -- one small query
        // per currently-active trial (a real, small list in practice).
        const active = rows.filter((trial) => trial.status === 'trialing');
        const today = todayDateString();
        const entries = await Promise.all(
          active.map(async (trial) => {
            const checkins = await listCheckins({ foodTrialId: trial.id, limit: 5 });
            const todaysCheckin = checkins.find((entry) => entry.loggedAt.startsWith(today)) ?? null;
            return [trial.id, todaysCheckin] as const;
          }),
        );
        setTodaysCheckinByTrial(Object.fromEntries(entries));
      },
    );
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Real, cross-tab prefill -- 2026-08-14, arriving from a Food builder's
  // own "Worth testing?" button (see SideBuilder.tsx's own comment).
  // Applied once per real, distinct prefill (foodId+source), the same
  // real food identity the manual "Pick a specific food" -> FoodLookup ->
  // onFoodResolved path below already sets, so a food arriving this way
  // opens the trial-creation form already pre-filled rather than blank.
  const appliedPrefillKey = useRef<string | null>(null);
  // Real, plain state (not just the ref above) specifically so the "‹ Back
  // to what you were building" link (2026-08-14) stays reactive and keeps
  // showing even after the form closes/the trial resolves -- the builder
  // that sent someone here (SideBuilder.tsx's own router.push, confirmed
  // via its own real params) carries no dish-name param, only the food's
  // own identity, so this is deliberately a generic label, not "Back to
  // [dish]" -- there's no real dish name available to show accurately.
  const [arrivedViaPrefill, setArrivedViaPrefill] = useState(false);
  useEffect(() => {
    if (!prefill) return;
    const key = `${prefill.foodId}:${prefill.source}`;
    setArrivedViaPrefill(true);
    if (appliedPrefillKey.current === key) return;
    appliedPrefillKey.current = key;
    setPickedFood(prefill);
    setFoodName(`${prefill.baseName}${prefill.prepMethod ? ` (${prefill.prepMethod})` : ''}`);
    setFormOpen(true);
  }, [prefill]);

  // Real per-food test history, refreshed whenever a real, reference-linked
  // food is picked -- see getFoodTrialHistory's own comment in lib/db.ts.
  useEffect(() => {
    if (!pickedFood) {
      setFoodHistory([]);
      return;
    }
    let isMounted = true;
    getFoodTrialHistory(pickedFood.foodId, pickedFood.source).then((history) => {
      if (isMounted) setFoodHistory(history);
    });
    return () => { isMounted = false; };
  }, [pickedFood]);

  // Best-effort only -- allergies are free text (lib/db.ts's own
  // user_food_allergies table), not linked to a real food row, so this is
  // a real, worth-having safety nudge, not a guaranteed-precise match.
  const allergyMatch = pickedFood
    ? foodAllergies.find((name) => pickedFood.baseName.toLowerCase().includes(name.toLowerCase()))
    : foodAllergies.find((name) => foodName.toLowerCase().includes(name.toLowerCase()));

  function resetForm() {
    setFoodName('');
    setPickedFood(null);
    setFoodHistory([]);
    setSelectedConditionCode(null);
    setDateChoice('today');
    setCustomDate('');
    setObservationDays('3');
  }

  async function handleSave() {
    if (!foodName.trim()) {
      showInfoAlert('Almost there', 'Enter the name of the food.');
      return;
    }
    const days = Number(observationDays);
    const realObservationDays = Number.isFinite(days) && days > 0 ? days : 3;

    // A real, reference-database-linked food skips the date question
    // entirely, 2026-08-14 -- there's nothing meaningful to ask before the
    // food is actually scheduled or logged (see createFoodTrial's own
    // comment: it starts this real 'waiting', not 'trialing', whenever
    // foodId/source are present). startedAt is a harmless placeholder here,
    // genuinely overwritten by activateWaitingTrialsForComponents once the
    // food shows up in a real meal. A free-text trial keeps the original,
    // fully-required date behavior, since there's no way to auto-detect
    // anything for it later.
    let startedAt: string;
    if (pickedFood) {
      startedAt = new Date().toISOString();
    } else {
      const date = resolveDateChoice(dateChoice, customDate);
      if (!date) {
        showInfoAlert('Almost there', 'Enter a valid date.');
        return;
      }
      startedAt = `${date}T${nowTimeString24()}`;
    }

    const { id: trialId, status } = await createFoodTrial({
      foodName,
      startedAt,
      observationDays: realObservationDays,
      foodId: pickedFood?.foodId ?? null,
      source: pickedFood?.source ?? null,
      prepMethod: pickedFood?.prepMethod ?? null,
      conditionCode: selectedConditionCode,
    });

    // Only a real, immediately-'trialing' free-text trial gets its
    // reminders scheduled here -- a 'waiting' trial's own reminders don't
    // start until it's genuinely activated (see activateWaitingTrialsFor
    // Components), and starting them now would ask "how did today go"
    // about a day the food was never actually eaten on.
    if (status === 'trialing') {
      const date = startedAt.slice(0, 10);
      await scheduleFoodTrialCheckins({
        foodTrialId: trialId,
        foodName,
        firstScheduledFor: `${date}T20:00`,
        observationDays: realObservationDays,
      });
    }

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

  // "Not sure anymore?" -- 2026-08-14, the real, previously-missing other
  // half of the testing loop. reopenFoodTrial itself now reschedules a
  // real, fresh reminder series (see its own comment in lib/db.ts) --
  // this just needs to call it and refresh the list.
  async function handleReopen(id: string) {
    await reopenFoodTrial(id);
    load();
  }

  // The lightweight daily prompt's own "nothing to report" path -- one
  // tap, a real but minimal wellbeing_checkins row, no escalation needed.
  async function handleTodayNothingToReport(trial: FoodTrialRecord) {
    await recordCheckin({
      loggedAt: new Date().toISOString(),
      checkinType: 'food_trial_daily',
      valence: 'neutral',
      foodName: trial.foodName,
      foodTrialId: trial.id,
    });
    load();
  }

  function handleTodaySomethingFeltOff(trial: FoodTrialRecord) {
    setEscalatingTrialId(trial.id);
    setEscalateSeverity(null);
    setEscalateTags([]);
    setEscalateNotes('');
    setEscalateDateChoice('today');
    setEscalateCustomDate('');
    setEscalateTime(splitTime24(nowTimeString24()));
  }

  function toggleEscalateTag(code: string) {
    setEscalateTags((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]));
  }

  async function handleSaveEscalation(trial: FoodTrialRecord) {
    if (escalateSeverity == null) {
      showInfoAlert('Almost there', 'Select how severe it felt.');
      return;
    }
    const loggedAt = resolveDateTime(escalateDateChoice, escalateCustomDate, escalateTime);
    if (!loggedAt) {
      showInfoAlert('Almost there', 'Enter a valid date and time.');
      return;
    }
    await recordCheckin({
      loggedAt,
      checkinType: 'food_trial_daily',
      valence: 'negative',
      severity: escalateSeverity,
      notes: escalateNotes,
      foodName: trial.foodName,
      foodTrialId: trial.id,
      tags: escalateTags,
    });
    setEscalatingTrialId(null);
    load();
  }

  // FoodLookup's own internal list is a real FlatList -- it can never sit
  // nested inside this lens's own outer ScrollView (the exact real,
  // confirmed Android crash Garden's own harvest/planting pickers already
  // hit and fixed, 2026-08-13/14) -- so picking a food gets its own
  // dedicated, non-scrolling branch, the same established fix pattern.
  if (pickingFood) {
    return (
      <View style={styles.pickerScreen}>
        <FoodLookup
          tabColor={TAB_COLOR}
          title="Which food are you testing?"
          showNutrients={false}
          allowHarvestPick={false}
          onFoodResolved={(resolved) => {
            setPickedFood(resolved);
            setFoodName(`${resolved.baseName}${resolved.prepMethod ? ` (${resolved.prepMethod})` : ''}`);
            setPickingFood(false);
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      {infoAlertElement}
      {arrivedViaPrefill ? (
        // router.navigate, not router.back() -- 2026-08-14, direct report:
        // back() actually landed on Home. Confirmed why: switching tabs
        // inside this app's own <Tabs> navigator never creates a real,
        // pop-able history entry the way a genuine Stack push does, so
        // back() had nothing real to undo and fell through to the tab
        // navigator's own default (Home). navigate('/food') is this
        // codebase's own already-proven way to return to a sibling tab
        // (see TabHub.tsx's own go(), which does the identical thing) --
        // and, paired with the real state-preservation fix in food.tsx's
        // own focus effect (see lib/pendingFoodTrialReturn.ts), lands
        // right back on the exact builder, mid-build, not just the tab.
        <TouchableOpacity onPress={() => router.navigate('/food')}>
          <Text style={styles.backLink}>‹ Back to what you were building</Text>
        </TouchableOpacity>
      ) : null}
      {!formOpen ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setFormOpen(true)}>
          <Text style={styles.addButtonText}>+ Start a new food trial</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formCard}>
          <View style={styles.noteLabelRow}>
            <Text style={styles.label}>What food are you introducing?</Text>
            <VoiceInputButton onResult={setFoodName} size={16} />
          </View>
          <AppTextInput style={styles.input} placeholder="e.g. Quinoa" value={foodName} onChangeText={setFoodName} />
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setPickingFood(true)}>
            <Text style={styles.secondaryButtonText}>
              {pickedFood ? 'Change the specific food' : 'Pick a specific food (optional)'}
            </Text>
          </TouchableOpacity>
          {pickedFood ? (
            <Text style={styles.helperText}>
              Linked to the real, cited version of this food -- prep state and any real per-food history below come
              from that link, not just the name.
            </Text>
          ) : null}
          {allergyMatch ? (
            <Text style={[styles.helperText, styles.flaggedText]}>
              This may match your own declared allergy to {allergyMatch}. This feature is for testing a sensitivity
              or reintroduction, not a real allergy -- talk to a doctor before testing a known allergen.
            </Text>
          ) : null}
          {foodHistory.length > 0 ? (
            <Text style={styles.helperText}>
              You&apos;ve tested this exact food before: {foodHistory.length} time{foodHistory.length === 1 ? '' : 's'}
              {' '}({foodHistory.filter((entry) => entry.status === 'cleared').length} cleared,{' '}
              {foodHistory.filter((entry) => entry.status === 'flagged').length} flagged).
            </Text>
          ) : null}
          {trackedConditions.length > 0 ? (
            <>
              <Text style={styles.label}>Which condition or concern is this testing? (optional)</Text>
              <View style={styles.pillRow}>
                {trackedConditions.map((condition) => {
                  const active = selectedConditionCode === condition.code;
                  return (
                    <TouchableOpacity
                      key={condition.code}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setSelectedConditionCode(active ? null : condition.code)}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{condition.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}
          {!pickedFood ? (
            <>
              <Text style={styles.label}>When did you start?</Text>
              <DateChoicePicker
                value={dateChoice}
                onChange={setDateChoice}
                customDate={customDate}
                onCustomDateChange={setCustomDate}
              />
            </>
          ) : null}
          <Text style={styles.label}>Watch it for how many days?</Text>
          <AppTextInput
            style={[styles.input, styles.timeInput]}
            keyboardType="number-pad"
            maxLength={2}
            value={observationDays}
            onChangeText={setObservationDays}
          />
          {pickedFood ? (
            <Text style={styles.helperText}>
              This will start automatically once you log or schedule a meal with {foodName} -- or you can start it
              right now from the trial list below once it&apos;s saved.
            </Text>
          ) : (
            <Text style={styles.helperText}>
              3 days is a common starting point for &ldquo;probably fine.&rdquo; A real daily reminder runs the whole
              window either way, even if something feels off partway through -- a delayed second reaction is exactly
              what the full window is meant to catch. You can still mark it cleared or flagged earlier yourself if
              you&apos;d rather not wait.
            </Text>
          )}
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
            const todaysCheckin = todaysCheckinByTrial[trial.id];
            const isEscalating = escalatingTrialId === trial.id;
            return (
              <View key={trial.id} style={styles.row}>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTitle}>{trial.foodName}</Text>
                  {trial.status === 'waiting' ? (
                    // No real "Started" date to show yet -- startedAt on a
                    // 'waiting' trial is just the moment the form was
                    // submitted, not a genuine start (see createFoodTrial's
                    // own comment), so showing it here would misrepresent
                    // exactly the thing this whole feature exists to fix.
                    <Text style={[styles.rowMeta, styles.waitingText]}>
                      Waiting to start -- will begin automatically once you log or schedule a meal with this food
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.rowMeta}>Started {formatEntryDate(trial.startedAt)}</Text>
                      {trial.status === 'trialing' ? (
                        daysLeft > 0 ? (
                          <Text style={styles.rowMeta}>{daysLeft} day{daysLeft === 1 ? '' : 's'} left to watch</Text>
                        ) : (
                          <Text style={[styles.rowMeta, styles.readyText]}>Ready to review</Text>
                        )
                      ) : trial.status === 'cleared' ? (
                        <Text style={[styles.rowMeta, styles.clearedText]}>No problems, cleared</Text>
                      ) : (
                        <Text style={[styles.rowMeta, styles.flaggedText]}>Caused a problem</Text>
                      )}
                    </>
                  )}
                </View>
                <View style={styles.rowActions}>
                  {trial.status === 'waiting' ? (
                    <TouchableOpacity onPress={() => handleReopen(trial.id)}>
                      <Text style={styles.actionTextPrimary}>Start now</Text>
                    </TouchableOpacity>
                  ) : trial.status === 'trialing' ? (
                    <>
                      <TouchableOpacity onPress={() => handleResolve(trial, 'cleared')}>
                        <Text style={styles.actionTextPrimary}>No problems</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleResolve(trial, 'flagged')}>
                        <Text style={styles.actionTextRemove}>Flag it</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity onPress={() => handleReopen(trial.id)}>
                      <Text style={styles.actionTextPrimary}>Reopen for testing</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(trial.id)}>
                    <Text style={styles.actionText}>Remove</Text>
                  </TouchableOpacity>
                </View>

                {/* The lightweight daily prompt, 2026-08-14 -- only shows
                    while a trial is still active AND today's real check-in
                    (light or escalated) hasn't already been logged.
                    "Something felt off" escalates to the same full
                    tag/severity/notes picker every other lens here uses,
                    never a second, separately-built form -- confirmed
                    design: escalating does NOT end the trial or stop
                    tomorrow's reminder. */}
                {trial.status === 'trialing' && !isEscalating ? (
                  todaysCheckin ? (
                    <Text style={[styles.rowMeta, { marginTop: 10 }]}>Checked in today already.</Text>
                  ) : (
                    <View style={[styles.rowActions, { marginTop: 10 }]}>
                      <Text style={styles.rowMeta}>Today:</Text>
                      <TouchableOpacity onPress={() => handleTodayNothingToReport(trial)}>
                        <Text style={styles.actionTextPrimary}>Nothing to report</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleTodaySomethingFeltOff(trial)}>
                        <Text style={styles.actionTextRemove}>Something felt off</Text>
                      </TouchableOpacity>
                    </View>
                  )
                ) : null}
                {isEscalating ? (
                  <CheckinForm
                    severity={escalateSeverity}
                    onSeverityChange={setEscalateSeverity}
                    tags={escalateTags}
                    onToggleTag={toggleEscalateTag}
                    notes={escalateNotes}
                    onNotesChange={setEscalateNotes}
                    dateChoice={escalateDateChoice}
                    onDateChoiceChange={setEscalateDateChoice}
                    customDate={escalateCustomDate}
                    onCustomDateChange={setEscalateCustomDate}
                    time={escalateTime}
                    onTimeChange={setEscalateTime}
                    onCancel={() => setEscalatingTrialId(null)}
                    onSave={() => handleSaveEscalation(trial)}
                    saveLabel="Save today's report"
                  />
                ) : null}
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
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

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
      showInfoAlert('Almost there', 'Enter what kind of activity this was.');
      return;
    }
    const date = resolveDateChoice(dateChoice, customDate);
    if (!date) {
      showInfoAlert('Almost there', 'Enter a valid date.');
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
      {infoAlertElement}
      {!formOpen ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setFormOpen(true)}>
          <Text style={styles.addButtonText}>+ Log exercise</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formCard}>
          <View style={styles.noteLabelRow}>
            <Text style={styles.label}>What did you do?</Text>
            <VoiceInputButton onResult={setExerciseType} size={16} />
          </View>
          <AppTextInput style={styles.input} placeholder="e.g. Walk, yoga, weights" value={exerciseType} onChangeText={setExerciseType} />
          <Text style={styles.label}>How long? (minutes, optional)</Text>
          <AppTextInput
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
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

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
      showInfoAlert('Almost there', 'Enter both a systolic and diastolic number.');
      return;
    }
    const date = resolveDateChoice(dateChoice, customDate);
    if (!date) {
      showInfoAlert('Almost there', 'Enter a valid date.');
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
      {infoAlertElement}
      {!formOpen ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setFormOpen(true)}>
          <Text style={styles.addButtonText}>+ Log a blood pressure reading</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.label}>Reading</Text>
          <View style={styles.timeRow}>
            <AppTextInput
              style={[styles.input, styles.timeInput]}
              placeholder="120"
              keyboardType="number-pad"
              maxLength={3}
              value={systolic}
              onChangeText={setSystolic}
            />
            <Text style={styles.timeSeparator}>/</Text>
            <AppTextInput
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
            <AppTextInput
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
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

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
      showInfoAlert('Almost there', 'Write a quick note first.');
      return;
    }
    const date = resolveDateChoice(dateChoice, customDate);
    if (!date) {
      showInfoAlert('Almost there', 'Enter a valid date.');
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
      {infoAlertElement}
      {!formOpen ? (
        <TouchableOpacity style={styles.addButton} onPress={() => setFormOpen(true)}>
          <Text style={styles.addButtonText}>+ Add a note</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formCard}>
          {/* 2026-08-16 -- a real mic button next to the label, matching
              the same wiring every Food builder's own Prep Notes field
              just got. Only the FINAL transcript is parsed and
              appended -- a partial mid-sentence result would land real,
              half-finished command phrases in the actual note text. */}
          <View style={styles.noteLabelRow}>
            <Text style={styles.label}>Note</Text>
            <VoiceInputButton
              onResult={(transcript, isFinal) => {
                if (!isFinal) return;
                setNotes((current) => appendDictatedText(current, parseVoiceCommands(transcript)));
              }}
              size={16}
            />
          </View>
          <AppTextInput
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

// Split from a single OtherLens, 2026-07-28 -- Exercise/Blood Pressure/
// General Note used to be three sections stacked in one shared lens; each
// is now reached directly from its own LensHub entry instead. Dropped the
// section headings each used to need to tell them apart on one shared
// screen (Exercise/Blood Pressure/General Note) -- redundant now that each
// has its own whole screen, the same way Flares/Food Reactions/New Foods
// never repeat their own name as an on-screen heading either.
function ExerciseLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      <ExerciseSection />
    </ScrollView>
  );
}

function BloodPressureLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      <BloodPressureSection />
    </ScrollView>
  );
}

function GeneralNoteLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      <Text style={styles.helperText}>
        For anything else worth remembering: a prescription change, how a supplement felt, a drink you had.
      </Text>
      <GeneralNoteSection />
    </ScrollView>
  );
}

// Genuinely new territory, 2026-07-28 -- no logging schema exists yet for
// how many times someone woke up, what time, etc. Same honest "not built
// yet" placeholder pattern already used elsewhere for planned-but-unbuilt
// features (Food's own builder stubs, Schedule's ComingSoonLens), rather
// than guessing at a data shape no one's actually decided on yet.
function NocturiaLens() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  return (
    <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: scrollBottomPadding }]}>
      <Text style={styles.emptyText}>
        Not built yet. Waking at night to urinate is a trackable symptom worth its own log; this will get its own
        logging (how many times, what time) built out.
      </Text>
    </ScrollView>
  );
}

export default function LogScreen() {
  useRegisterScreenHelp('Signals', LOG_HELP_SECTIONS, '/log');
  // trialFoodId/trialSource/trialBaseName/trialCategory/trialSubcategory/
  // trialPrepMethod -- a real cross-tab deep link from a Food builder's own
  // "Worth testing?" button (see SideBuilder.tsx's own comment), the same
  // shape food.tsx's own editXId/fromXFavoriteId params already use.
  const { trialFoodId, trialSource, trialBaseName, trialCategory, trialSubcategory, trialPrepMethod } =
    useLocalSearchParams<{
      trialFoodId?: string;
      trialSource?: string;
      trialBaseName?: string;
      trialCategory?: string;
      trialSubcategory?: string;
      trialPrepMethod?: string;
    }>();
  const [lens, setLens] = useState<Lens>('flares');
  const activeLensLabel = LENSES.find((option) => option.key === lens)?.label;
  // Same pattern as app/(tabs)/insights.tsx -- see that file's own comment.
  const [revealed, setRevealed] = useState(false);
  // Lifted out of MyItemsHub itself, 2026-08-16 -- same reasoning as
  // Food's own identical addition (app/(tabs)/food.tsx): lets LensHub's
  // new "My Signals" top-left tile (see its extraTile prop below) open
  // this SAME popup, at its own already-established position, after
  // closing itself first. The standalone MyItemsHub button further down
  // keeps working exactly as before regardless.
  const [mySignalsOpen, setMySignalsOpen] = useState(false);
  useFocusEffect(
    useCallback(() => {
      // trialFoodId overrides the normal "always land on the picker" reset
      // below -- without this, arriving here with a food already carried
      // along would still show the LensHub picker for a beat instead of
      // New Foods itself, matching food.tsx's own editXId branches exactly.
      if (trialFoodId) {
        setLens('newFoods');
        setRevealed(true);
        return;
      }
      setRevealed(false);
      return () => setRevealed(false);
    }, [trialFoodId]),
  );
  const autoOpenLensHub = useAutoOpenLensHubSignal();

  // Real food identity carried from the deep link -- foodId/source/baseName/
  // category are all required for a genuine ResolvedFoodSelection; anything
  // less (a stray or partial param set) is treated as no prefill at all
  // rather than guessed at.
  const trialPrefill: ResolvedFoodSelection | null =
    trialFoodId && trialSource && trialBaseName && trialCategory
      ? {
          foodId: Number(trialFoodId),
          source: trialSource,
          baseName: trialBaseName,
          category: trialCategory,
          subcategory: trialSubcategory || null,
          prepMethod: trialPrepMethod || null,
        }
      : null;

  return (
    <View style={styles.screen}>
      {/* enabled={!revealed} -- see food.tsx's own comment: swipe-to-
          change-tab only works from a lens's own picker, not once a real
          lens's content (with its own scrollable controls) is showing. */}
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Signals" variant="bioCompass" revealed={revealed}>
          {lens === 'flares' ? (
            <FlaresLens />
          ) : lens === 'foodReactions' ? (
            <FoodReactionsLens />
          ) : lens === 'newFoods' ? (
            <NewFoodsLens prefill={trialPrefill} />
          ) : lens === 'exercise' ? (
            <ExerciseLens />
          ) : lens === 'bloodPressure' ? (
            <BloodPressureLens />
          ) : lens === 'generalNote' ? (
            <GeneralNoteLens />
          ) : (
            <NocturiaLens />
          )}
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Signals" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub
        label="My Signals"
        tabColor={TAB_COLOR}
        open={mySignalsOpen}
        onOpenChange={setMySignalsOpen}
      />
      <LensHub
        pageTitle="Signals"
        options={LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={autoOpenLensHub}
        extraTile={{ label: 'My Signals', icon: 'bookmarks-outline', onPress: () => setMySignalsOpen(true) }}
        onSelect={(key) => {
          setLens(key);
          setRevealed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32 },
  // Deliberately NOT a ScrollView -- see NewFoodsLens' own render-time
  // comment for why FoodLookup can never sit inside one, the same
  // established fix already applied in Garden's own harvest/planting
  // pickers.
  pickerScreen: { flex: 1, paddingHorizontal: 16, paddingTop: 5 },
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
  // Border color/width match TAB_COLOR/Home's own TAB_BORDER_WIDTH rule,
  // 2026-07-27.
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: TAB_COLOR,
  },
  // Colors below are TAB_COLOR, not the plain neutrals they used to be --
  // 2026-07-27, "every font inside a box should match that box's own
  // border color." Leaves selection-state colors (pillActive/
  // pillTextActive) and actionTextPrimary/actionTextRemove (a positive/
  // destructive action convention used app-wide) alone -- different
  // meanings than "which tab."
  label: { ...typography.label, color: TAB_COLOR, marginBottom: 6, marginTop: 10 },
  helperText: { ...typography.caption, color: TAB_COLOR, marginTop: 4, marginBottom: 8 },
  // The "‹ Back to what you were building" link, 2026-08-14 -- same real
  // treatment as Digest's own already-established "‹ Back to
  // Digest" link (backToHomeText), not a new visual language.
  backLink: { ...typography.body, color: TAB_COLOR, fontWeight: '600', marginBottom: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  pillSmall: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: TAB_COLOR },
  pillTextSmall: { ...typography.caption, color: TAB_COLOR },
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
  // 2026-08-16 -- wraps GeneralNoteSection's own "Note" label with a real
  // mic button beside it.
  noteLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { width: 56, textAlign: 'center' },
  timeSeparator: { ...typography.label, color: TAB_COLOR },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { ...typography.bodyEmphasis, color: TAB_COLOR },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primary },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnPrimary },
  // Border color/width match TAB_COLOR/Home's own TAB_BORDER_WIDTH rule, 2026-07-27.
  table: { borderWidth: 2, borderColor: TAB_COLOR, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.surface },
  row: { borderTopWidth: 1, borderTopColor: colors.border, padding: 12 },
  rowTextCol: { flex: 1 },
  rowTitle: { ...typography.label, color: TAB_COLOR },
  rowMeta: { ...typography.caption, color: TAB_COLOR, marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  actionText: { ...typography.captionEmphasis, color: TAB_COLOR },
  actionTextPrimary: { ...typography.captionEmphasis, color: colors.primary },
  actionTextRemove: { ...typography.captionEmphasis, color: colors.danger },
  tagGroup: { marginBottom: 8 },
  tagGroupLabel: { ...typography.eyebrow, color: TAB_COLOR, marginBottom: 4 },
  readyText: { color: colors.statusFlagged },
  clearedText: { color: colors.primary },
  flaggedText: { color: colors.danger },
  waitingText: { color: colors.textMuted },
});
