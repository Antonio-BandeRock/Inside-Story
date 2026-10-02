// Signals > Microbiome Tests (G30, 2026-10-02). A gut test the person
// bought, kept as the report printed it, with the same result followed
// across tests and the food log's last four weeks set beside each sample.
// Rows go in typed, pasted, or read off a photo or screenshot with the
// reader Log a Whole Sheet uses; every row read waits to be confirmed.
// Nothing here grades a result. Decisions and sentences live in
// lib/microbiome.ts; storage in lib/microbiomeDb.ts.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from './AppTextInput';
import { useConfirmSheet } from './ConfirmSheet';
import { HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { announcePhoneOnly } from '../lib/desktop/phoneOnly';
import { rowsFromPositionedLines } from '../lib/labImport';
import {
  acrossTests,
  blankDraft,
  BUILT_IN_GROUPS,
  BUILT_IN_KINDS,
  BUILT_IN_PROVIDERS,
  choicesFrom,
  describeEatingBefore,
  describeReadRows,
  describeResult,
  describeSampleDate,
  describeSaveButton,
  describeTestHeading,
  describeTestMeta,
  describeUnsaved,
  draftProblem,
  draftsFromText,
  EATING_BEFORE_NOTE,
  findSampleDate,
  groupResults,
  MICROBIOME_NOTE,
  MICROBIOME_TEXT_HINT,
  OWN_CHOICE,
  savesFromDrafts,
  type EatingBefore,
  type MicrobiomeDraft,
  type MicrobiomeResult,
  type MicrobiomeTest,
} from '../lib/microbiome';
import {
  addMicrobiomeTest,
  getEatingBeforeSample,
  getMicrobiomeValuesUsed,
  listMicrobiomeTests,
  removeMicrobiomeResult,
  removeMicrobiomeTest,
  updateMicrobiomeTest,
} from '../lib/microbiomeDb';
import { recognizeLinesFromImage } from '../lib/ocr';

const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function withOwn(choices: string[], ownLabel: string) {
  return [...choices.map((choice) => ({ label: choice, value: choice })), { label: ownLabel, value: OWN_CHOICE }];
}

/** A picker over an open list, with a field for a new entry. */
function OpenChoice({
  value,
  onChange,
  choices,
  ownLabel,
  placeholder,
  tabColor,
}: {
  value: string;
  onChange: (value: string) => void;
  choices: string[];
  ownLabel: string;
  placeholder: string;
  tabColor: string;
}) {
  const [typing, setTyping] = useState(false);
  const known = choices.some((choice) => choice === value);
  const showField = typing || (value !== '' && !known);
  return (
    <View style={styles.choice}>
      <PopoverSelect
        options={withOwn(choices, ownLabel)}
        selected={showField ? OWN_CHOICE : value || null}
        onSelect={(picked) => {
          if (picked === OWN_CHOICE) {
            setTyping(true);
            onChange('');
          } else {
            setTyping(false);
            onChange(picked);
          }
        }}
        tabColor={tabColor}
        searchable={choices.length > 8}
        placeholder={placeholder}
        minWidth={220}
      />
      {showField ? (
        <AppTextInput
          value={value}
          onChangeText={onChange}
          style={styles.field}
          placeholder="Type it as you would like it to read"
          placeholderTextColor={colors.textMuted}
        />
      ) : null}
    </View>
  );
}

export function MicrobiomeTestsSection({ tabColor }: { tabColor: string }) {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();
  const [tests, setTests] = useState<MicrobiomeTest[]>([]);
  const [results, setResults] = useState<MicrobiomeResult[]>([]);
  const [used, setUsed] = useState<{ providers: string[]; kinds: string[]; groups: string[] }>({
    providers: [],
    kinds: [],
    groups: [],
  });
  const [eating, setEating] = useState<Record<string, EatingBefore>>({});
  const [openBands, setOpenBands] = useState<Record<string, boolean>>({});

  // The form, for a new test or for adding to one already saved.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<MicrobiomeDraft[]>([]);
  const [dateLine, setDateLine] = useState<string | null>(null);
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [day, setDay] = useState(String(now.getDate()));
  const [provider, setProvider] = useState('');
  const [kind, setKind] = useState('');
  const [note, setNote] = useState('');
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [listed, values] = await Promise.all([listMicrobiomeTests(), getMicrobiomeValuesUsed()]);
      setTests(listed.tests);
      setResults(listed.results);
      setUsed(values);
      const before: Record<string, EatingBefore> = {};
      for (const test of listed.tests) before[test.id] = await getEatingBeforeSample(test.sampledOn);
      setEating(before);
    } catch (error) {
      console.error('[MicrobiomeTestsSection] Failed to load', error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const providerChoices = useMemo(() => choicesFrom(BUILT_IN_PROVIDERS, used.providers), [used.providers]);
  const kindChoices = useMemo(() => choicesFrom(BUILT_IN_KINDS, used.kinds), [used.kinds]);
  const groupChoices = useMemo(
    () => choicesFrom(BUILT_IN_GROUPS, [...used.groups, ...drafts.map((draft) => draft.groupName)]),
    [used.groups, drafts],
  );
  const across = useMemo(() => acrossTests(tests, results), [tests, results]);
  const resultsByTest = useMemo(() => {
    const map = new Map<string, MicrobiomeResult[]>();
    for (const row of results) map.set(row.testId, [...(map.get(row.testId) ?? []), row]);
    return map;
  }, [results]);

  const saves = savesFromDrafts(drafts);
  const unsaved = describeUnsaved(drafts);
  const readLine = describeReadRows(drafts);
  const formOpen = openBands.form ?? false;
  const editing = editingId ? tests.find((test) => test.id === editingId) ?? null : null;

  function toggle(key: string) {
    setOpenBands((current) => ({ ...current, [key]: !current[key] }));
  }

  function setDate(date: string) {
    const [y, m, d] = date.split('-');
    if (YEAR_OPTIONS.includes(y)) setYear(y);
    setMonth(String(Number(m)));
    setDay(String(Number(d)));
  }

  function resetForm() {
    setEditingId(null);
    setText('');
    setDrafts([]);
    setDateLine(null);
    const today = new Date();
    setYear(String(today.getFullYear()));
    setMonth(String(today.getMonth() + 1));
    setDay(String(today.getDate()));
    setProvider('');
    setKind('');
    setNote('');
  }

  function readLines(from: string) {
    const read = draftsFromText(from);
    // Rows already typed stay; rows read before are replaced.
    setDrafts((current) => [...current.filter((draft) => draft.source === 'typed'), ...read]);
    if (read.length === 0) {
      showInfoAlert('No results read', 'No line read as a result. Type the rows with Add a Row instead.');
    }
    if (!editingId) {
      const found = findSampleDate(from);
      setDateLine(describeSampleDate(found));
      if (found.kind === 'found') setDate(found.date);
    }
  }

  async function readPhoto(from: 'camera' | 'library') {
    if (announcePhoneOnly(showInfoAlert, 'readLabSheet')) return;
    setReading(true);
    try {
      if (from === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          showInfoAlert('Camera access needed', 'Inside Story needs your camera to read a report. You can still paste or type the results.');
          return;
        }
      }
      const shot =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      if (shot.canceled || shot.assets.length === 0) return;
      const lines = await recognizeLinesFromImage(shot.assets[0].uri);
      if (!lines) {
        showInfoAlert('Could not read the report', 'No words came off that picture. Try a closer or sharper one, or type the results.');
        return;
      }
      const rebuilt = rowsFromPositionedLines(lines);
      setText(rebuilt);
      readLines(rebuilt);
    } catch (error) {
      console.error('[MicrobiomeTestsSection] Failed to read the picture', error);
      showInfoAlert('Could not read the report', 'Something went wrong reading that picture. You can paste or type the results instead.');
    } finally {
      setReading(false);
    }
  }

  function change(key: string, patch: Partial<MicrobiomeDraft>) {
    // Changing a row that was read means checking it again.
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === key
          ? { ...draft, ...patch, confirmed: patch.confirmed ?? (draft.source === 'typed' ? true : false) }
          : draft,
      ),
    );
  }

  function startEditing(test: MicrobiomeTest) {
    resetForm();
    setEditingId(test.id);
    setDate(test.sampledOn);
    setProvider(test.provider);
    setKind(test.kind);
    setNote(test.note ?? '');
    setOpenBands((current) => ({ ...current, form: true }));
  }

  async function save() {
    const sampledOn = `${year}-${pad(Number(month))}-${pad(Number(day))}`;
    setSaving(true);
    try {
      const details = { sampledOn, provider, kind, note };
      if (editingId) await updateMicrobiomeTest(editingId, details, saves);
      else await addMicrobiomeTest(details, saves);
      const count = saves.length;
      const left = drafts.length - count;
      const wasEditing = Boolean(editingId);
      resetForm();
      setOpenBands((current) => ({ ...current, form: false }));
      await load();
      showInfoAlert(
        wasEditing ? 'Test updated' : 'Test saved',
        [
          count === 0 ? null : count === 1 ? 'One row added.' : `${count} rows added.`,
          left > 0 ? `${left === 1 ? 'One row was' : `${left} rows were`} not confirmed and left out.` : null,
        ]
          .filter(Boolean)
          .join(' ') || 'It is under Your Tests.',
      );
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function removeTest(test: MicrobiomeTest) {
    const ok = await confirmSheet({
      title: `Remove ${describeTestHeading(test)}?`,
      message: 'The test and every result on it are deleted. This cannot be undone.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    await removeMicrobiomeTest(test.id);
    if (editingId === test.id) resetForm();
    await load();
  }

  async function removeRow(row: MicrobiomeResult) {
    const ok = await confirmSheet({
      title: `Remove ${row.name}?`,
      message: 'This one result is deleted from the test. The rest of the test stays.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    await removeMicrobiomeResult(row.id);
    await load();
  }

  return (
    <>
      {infoAlertElement}
      {confirmSheetElement}

      <HomeSectionBand
        kind="fold"
        title={editing ? `Add to ${describeTestHeading(editing)}` : 'Add a Test'}
        icon="add-circle-outline"
        color={tabColor}
        expanded={formOpen}
        onToggle={() => toggle('form')}
        contentStyle={styles.body}
      >
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, reading ? styles.disabled : null]}
            activeOpacity={0.8}
            disabled={reading}
            onPress={() => void readPhoto('camera')}
          >
            <Ionicons name="camera-outline" size={18} color={colors.textOnButton} />
            <Text style={styles.buttonText}>Photograph the Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, reading ? styles.disabled : null]}
            activeOpacity={0.8}
            disabled={reading}
            onPress={() => void readPhoto('library')}
          >
            <Ionicons name="images-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>From a Screenshot</Text>
          </TouchableOpacity>
        </View>
        {reading ? <ActivityIndicator color={tabColor} /> : null}
        <AppTextInput
          value={text}
          onChangeText={setText}
          style={styles.input}
          multiline
          placeholder="Or paste the results here, one to a line"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.caption}>{MICROBIOME_TEXT_HINT}</Text>
        {text.trim() ? (
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={() => readLines(text)}>
            <Ionicons name="list-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Read These Lines</Text>
          </TouchableOpacity>
        ) : null}

        {readLine ? <Text style={styles.lead}>{readLine}</Text> : null}
        {drafts.map((draft) => {
          const problem = draft.source === 'read' || draft.name.trim() || draft.valueText.trim() ? draftProblem(draft) : null;
          return (
            <View key={draft.key} style={styles.row}>
              {draft.printed ? <Text style={styles.caption}>As printed: {draft.printed}</Text> : null}
              <Text style={styles.caption}>Group</Text>
              <OpenChoice
                value={draft.groupName}
                onChange={(groupName) => change(draft.key, { groupName })}
                choices={groupChoices}
                ownLabel="Add a group"
                placeholder="Pick a group..."
                tabColor={tabColor}
              />
              <Text style={styles.caption}>Name on the report</Text>
              <AppTextInput
                value={draft.name}
                onChangeText={(name) => change(draft.key, { name })}
                style={styles.field}
                placeholder="e.g. Akkermansia muciniphila"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.fieldRow}>
                <View style={styles.fieldWrap}>
                  <Text style={styles.caption}>Result</Text>
                  <AppTextInput
                    value={draft.valueText}
                    onChangeText={(valueText) => change(draft.key, { valueText })}
                    style={styles.field}
                    placeholder="2.4 or Not detected"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={styles.caption}>Unit</Text>
                  <AppTextInput
                    value={draft.unit}
                    onChangeText={(unit) => change(draft.key, { unit })}
                    style={styles.field}
                    placeholder="as printed"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
              <View style={styles.fieldRow}>
                <View style={styles.fieldWrap}>
                  <Text style={styles.caption}>Range low</Text>
                  <AppTextInput
                    value={draft.low}
                    onChangeText={(low) => change(draft.key, { low })}
                    style={styles.field}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={styles.caption}>Range high</Text>
                  <AppTextInput
                    value={draft.high}
                    onChangeText={(high) => change(draft.key, { high })}
                    style={styles.field}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
              <Text style={styles.caption}>The report’s flag, if it prints one</Text>
              <AppTextInput
                value={draft.flag}
                onChangeText={(flag) => change(draft.key, { flag })}
                style={styles.field}
                placeholder="as printed, or leave blank"
                placeholderTextColor={colors.textMuted}
              />
              {problem ? <Text style={styles.problem}>{problem}</Text> : null}
              <View style={styles.buttonRow}>
                {draft.source === 'read' ? (
                  <TouchableOpacity
                    style={draft.confirmed ? styles.button : styles.secondaryButton}
                    activeOpacity={0.8}
                    onPress={() => change(draft.key, { confirmed: !draft.confirmed })}
                    accessibilityLabel={`${draft.confirmed ? 'Confirmed' : 'Confirm'} ${draft.name || 'this row'}`}
                  >
                    <Ionicons
                      name={draft.confirmed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={draft.confirmed ? colors.textOnButton : colors.textPrimary}
                    />
                    <Text style={draft.confirmed ? styles.buttonText : styles.secondaryButtonText}>
                      {draft.confirmed ? 'Confirmed' : 'Matches the Report'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.8}
                  onPress={() => setDrafts((current) => current.filter((item) => item.key !== draft.key))}
                >
                  <Ionicons name="close-outline" size={18} color={colors.textPrimary} />
                  <Text style={styles.secondaryButtonText}>Leave Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.8}
          onPress={() => setDrafts((current) => [...current, blankDraft(current[current.length - 1]?.groupName ?? '')])}
        >
          <Ionicons name="add-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.secondaryButtonText}>Add a Row</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Day the sample was taken</Text>
        {dateLine ? <Text style={styles.caption}>{dateLine}</Text> : null}
        <View style={styles.dateRow}>
          <PopoverSelect options={YEAR_OPTIONS} selected={year} onSelect={setYear} tabColor={tabColor} minWidth={72} />
          <PopoverSelect options={MONTH_OPTIONS} selected={month} onSelect={setMonth} tabColor={tabColor} minWidth={52} />
          <PopoverSelect options={DAY_OPTIONS} selected={day} onSelect={setDay} tabColor={tabColor} minWidth={52} />
        </View>
        <Text style={styles.label}>Company</Text>
        <OpenChoice
          value={provider}
          onChange={setProvider}
          choices={providerChoices}
          ownLabel="Add a company"
          placeholder="Pick the company..."
          tabColor={tabColor}
        />
        <Text style={styles.label}>Kind of test</Text>
        <OpenChoice
          value={kind}
          onChange={setKind}
          choices={kindChoices}
          ownLabel="Add a kind"
          placeholder="Pick the kind..."
          tabColor={tabColor}
        />
        <Text style={styles.label}>Note (optional)</Text>
        <AppTextInput
          value={note}
          onChangeText={setNote}
          style={styles.field}
          multiline
          placeholder="e.g. taken during a course of antibiotics"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          style={[styles.button, saving || (!editingId && saves.length === 0 && drafts.length > 0) ? styles.disabled : null]}
          activeOpacity={0.8}
          disabled={saving || (!editingId && saves.length === 0 && drafts.length > 0)}
          onPress={() => void save()}
        >
          <Ionicons name="save-outline" size={18} color={colors.textOnButton} />
          <Text style={styles.buttonText}>{saving ? 'Saving…' : describeSaveButton(drafts, Boolean(editingId))}</Text>
        </TouchableOpacity>
        {unsaved ? <Text style={styles.caption}>{unsaved}</Text> : null}
        {editingId || drafts.length > 0 || text ? (
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={resetForm}>
            <Ionicons name="close-circle-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>{editingId ? 'Stop Editing' : 'Clear the Form'}</Text>
          </TouchableOpacity>
        ) : null}
      </HomeSectionBand>

      {tests.length === 0 ? (
        <View style={styles.panel}>
          <Text style={styles.line}>No tests saved yet. A test you add appears here with every result on it.</Text>
        </View>
      ) : null}

      {tests.map((test) => {
        const rows = resultsByTest.get(test.id) ?? [];
        return (
          <HomeSectionBand
            key={test.id}
            kind="fold"
            title={describeTestHeading(test)}
            icon="flask-outline"
            color={tabColor}
            expanded={openBands[test.id] ?? false}
            onToggle={() => toggle(test.id)}
            contentStyle={styles.body}
          >
            <Text style={styles.caption}>{describeTestMeta(test, rows.length)}</Text>
            {test.note ? <Text style={styles.line}>{test.note}</Text> : null}
            {groupResults(rows).map((group) => (
              <View key={group.groupName} style={styles.group}>
                <Text style={styles.label}>{group.groupName}</Text>
                {group.rows.map((row) => (
                  <View key={row.id} style={styles.resultRow}>
                    <View style={styles.resultText}>
                      <Text style={styles.line}>{row.name}</Text>
                      <Text style={styles.caption}>{describeResult(row)}</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => void removeRow(row)}>
                      <Text style={[styles.link, { color: tabColor }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
            <Text style={styles.label}>What you ate before it</Text>
            <Text style={styles.line}>{describeEatingBefore(eating[test.id] ?? null)}</Text>
            <Text style={styles.caption}>{EATING_BEFORE_NOTE}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={() => startEditing(test)}>
                <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.secondaryButtonText}>Edit or Add Rows</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={() => void removeTest(test)}>
                <Ionicons name="trash-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.secondaryButtonText}>Remove This Test</Text>
              </TouchableOpacity>
            </View>
          </HomeSectionBand>
        );
      })}

      {across.length > 0 ? (
        <HomeSectionBand
          kind="fold"
          title="The Same Result Across Tests"
          icon="git-compare-outline"
          color={tabColor}
          expanded={openBands.across ?? false}
          onToggle={() => toggle('across')}
          contentStyle={styles.body}
        >
          {across.map((item) => (
            <View key={item.name} style={styles.group}>
              <Text style={styles.line}>{item.line}</Text>
              {item.notes.map((line) => (
                <Text key={line} style={styles.caption}>
                  {line}
                </Text>
              ))}
            </View>
          ))}
        </HomeSectionBand>
      ) : null}

      <HomeSectionBand
        kind="fold"
        title="About These Tests"
        icon="information-circle-outline"
        color={tabColor}
        expanded={openBands.about ?? false}
        onToggle={() => toggle('about')}
        contentStyle={styles.body}
      >
        <Text style={styles.line}>{MICROBIOME_NOTE}</Text>
      </HomeSectionBand>
    </>
  );
}

const styles = StyleSheet.create({
  body: { gap: HOME_BAND_GAP },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
  },
  line: { ...typography.body, color: colors.textPrimary, ...textShadow },
  lead: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  label: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  problem: { ...typography.caption, color: colors.statusYellowOnSurface, ...textShadow },
  link: { ...typography.bodyEmphasis, ...textShadow },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonText: { ...typography.bodyEmphasis, color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  disabled: { opacity: 0.6 },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  field: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
  },
  choice: { gap: 6 },
  fieldRow: { flexDirection: 'row', gap: 8 },
  fieldWrap: { flex: 1, gap: 2 },
  row: { gap: 6, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  dateRow: { flexDirection: 'row', gap: 8 },
  group: { gap: 4 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  resultText: { flex: 1, gap: 2 },
});
