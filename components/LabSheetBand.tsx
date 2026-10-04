// Labs without typing (G28, 2026-10-02): on Insights > Labs, under the
// one-result form. A photo of a lab sheet read on the phone (lib/ocr.ts),
// a table or CSV pasted from a patient portal, or a whole panel filled in
// at once. Every row read waits for the person to check it against the
// sheet and confirm it; only confirmed rows are saved. Reading, matching
// and every sentence live in lib/labImport.ts.
import { useMemo, useState } from 'react';
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
import { sortByLabel } from '../lib/choiceOrder';
import {
  addOwnLabTest,
  recordLabResult,
  removeOwnLabTest,
  renameOwnLabTest,
  type LabResultRecord,
  type LabTest,
} from '../lib/db';
import { announcePhoneOnly } from '../lib/desktop/phoneOnly';
import {
  describeReadRows,
  describeSaveButton,
  describeSheetDate,
  describeUnitDifference,
  describeUnsaved,
  draftProblem,
  draftsForPanel,
  draftsFromRows,
  findSheetDate,
  LAB_PANEL_HINT,
  LAB_PANELS,
  LAB_SHEET_CAPTION,
  LAB_SHEET_INTRO,
  LAB_SHEET_TITLE,
  LAB_TEXT_HINT,
  OWN_TEST,
  panelTestCodes,
  parseLabSheet,
  rowsFromPositionedLines,
  savesFromDrafts,
  type LabDraft,
  type SheetDate,
} from '../lib/labImport';
import { explainNotYet } from '../lib/notYet';
import { recognizeLinesFromImage } from '../lib/ocr';

const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function LabSheetBand({
  labTests,
  labResults,
  onSaved,
  tabColor,
}: {
  labTests: LabTest[];
  labResults: LabResultRecord[];
  onSaved: () => void;
  tabColor: string;
}) {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<LabDraft[]>([]);
  const [sheetDate, setSheetDate] = useState<SheetDate>({ kind: 'none' });
  const [panelKey, setPanelKey] = useState<string | null>(null);
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [day, setDay] = useState(String(now.getDate()));
  const [labName, setLabName] = useState('');
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [renaming, setRenaming] = useState<{ code: string; name: string } | null>(null);

  const testByCode = useMemo(() => new Map(labTests.map((test) => [test.code, test])), [labTests]);
  const testOptions = useMemo(
    () => [
      ...sortByLabel(labTests.filter((test) => !test.retiredAt).map((test) => ({ label: test.displayName, value: test.code }))),
      { label: 'Add a test of your own', value: OWN_TEST },
    ],
    [labTests],
  );
  const ownTests = labTests.filter((test) => test.isOwn && !test.retiredAt);
  // The tests in the most recent sitting, for "The tests from last time".
  const lastTimeCodes = useMemo(() => {
    const latest = labResults[0]?.testedAt.slice(0, 10);
    if (!latest) return [];
    return [...new Set(labResults.filter((result) => result.testedAt.slice(0, 10) === latest).map((result) => result.testCode))];
  }, [labResults]);

  const readRows = drafts.some((draft) => draft.source === 'read');
  const panelDate = `${year}-${pad(Number(month))}-${pad(Number(day))}`;
  const saves = savesFromDrafts(drafts, panelDate);
  const unsaved = describeUnsaved(drafts);
  const dateLine = describeSheetDate(sheetDate);

  function readLines(from: string) {
    const rows = parseLabSheet(from, labTests);
    setDrafts(draftsFromRows(rows, labTests));
    setPanelKey(null);
    const found = findSheetDate(from);
    setSheetDate(found);
    if (found.kind === 'found') {
      const [y, m, d] = found.date.split('-');
      if (YEAR_OPTIONS.includes(y)) setYear(y);
      setMonth(String(Number(m)));
      setDay(String(Number(d)));
    }
  }

  async function readPhoto(from: 'camera' | 'library') {
    if (announcePhoneOnly(showInfoAlert, 'readLabSheet')) return;
    setReading(true);
    try {
      if (from === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          showInfoAlert('Camera access needed', 'Inside Story needs your camera to read a lab sheet. You can still paste or type the results.');
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
        showInfoAlert('Could not read the sheet', 'No words came off that photo. Try again flatter and closer, in good light, or type the results.');
        return;
      }
      const rebuilt = rowsFromPositionedLines(lines);
      setText(rebuilt);
      readLines(rebuilt);
    } catch (error) {
      console.error('[LabSheetBand] Failed to read the photo', error);
      showInfoAlert('Could not read the sheet', 'Something went wrong reading that photo. You can paste or type the results instead.');
    } finally {
      setReading(false);
    }
  }

  function startPanel(key: string) {
    setPanelKey(key);
    setSheetDate({ kind: 'none' });
    const codes = panelTestCodes(key, labTests, lastTimeCodes);
    setDrafts(draftsForPanel(codes, labTests));
    if (codes.length === 0) {
      showInfoAlert('Nothing in that panel yet', key === 'mine' ? 'Tests you add appear here once you add one.' : 'No results are logged yet to repeat.');
    }
  }

  function change(key: string, patch: Partial<LabDraft>) {
    // Changing a row that was read means checking it again.
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, ...patch, confirmed: patch.confirmed ?? false } : draft)));
  }

  function clearAll() {
    setDrafts([]);
    setText('');
    setPanelKey(null);
    setSheetDate({ kind: 'none' });
  }

  async function save() {
    if (saving) return;
    if (saves.length === 0) {
      return explainNotYet('No result is confirmed yet. Confirm each row you want kept, and fix any marked as needing it, then save.');
    }
    setSaving(true);
    try {
      const ownCodes = new Map<string, string>();
      for (const item of saves) {
        let code = item.testCode;
        if (item.ownName) {
          const nameKey = item.ownName.toLowerCase();
          code = ownCodes.get(nameKey) ?? (await addOwnLabTest(item.ownName, item.unit));
          ownCodes.set(nameKey, code);
        }
        await recordLabResult({
          testCode: code,
          value: item.value,
          unit: item.unit,
          labRangeLow: item.labRangeLow ?? undefined,
          labRangeHigh: item.labRangeHigh ?? undefined,
          testedAt: item.testedAt,
          labName: labName.trim() || undefined,
          notes: item.notes ?? undefined,
        });
      }
      const count = saves.length;
      const left = drafts.length - count;
      clearAll();
      onSaved();
      showInfoAlert(
        count === 1 ? 'One result saved' : `${count} results saved`,
        left > 0
          ? `${left === 1 ? 'One row was' : `${left} rows were`} not confirmed and ${left === 1 ? 'was' : 'were'} left out.`
          : 'They are on this lens and on Trends.',
      );
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function remove(test: LabTest) {
    const ok = await confirmSheet({
      title: `Remove ${test.displayName}?`,
      message: 'A test with results is kept for its history and leaves the list of tests to pick. One with no results is deleted.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    const outcome = await removeOwnLabTest(test.code);
    onSaved();
    showInfoAlert(
      outcome === 'retired' ? 'Kept for its history' : 'Removed',
      outcome === 'retired'
        ? `${test.displayName} has results, so they keep its name. It is no longer offered when you log a result.`
        : `${test.displayName} had no results and is gone.`,
    );
  }

  async function finishRename() {
    if (!renaming) return;
    if (renaming.name.trim()) {
      await renameOwnLabTest(renaming.code, renaming.name);
      onSaved();
    }
    setRenaming(null);
  }

  return (
    <HomeSectionBand
      kind="fold"
      title={LAB_SHEET_TITLE}
      icon="document-text-outline"
      color={tabColor}
      expanded={open}
      onToggle={() => setOpen((current) => !current)}
      contentStyle={styles.body}
    >
      {infoAlertElement}
      {confirmSheetElement}
      <Text style={styles.line}>{LAB_SHEET_INTRO}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, reading ? styles.disabled : null]}
          activeOpacity={0.8}
          disabled={reading}
          onPress={() => void readPhoto('camera')}
        >
          <Ionicons name="camera-outline" size={18} color={colors.textOnButton} />
          <Text style={styles.buttonText}>Photograph a Sheet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, reading ? styles.disabled : null]}
          activeOpacity={0.8}
          disabled={reading}
          onPress={() => void readPhoto('library')}
        >
          <Ionicons name="images-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.secondaryButtonText}>From a Picture</Text>
        </TouchableOpacity>
      </View>
      {reading ? <ActivityIndicator color={tabColor} /> : null}
      <AppTextInput
        value={text}
        onChangeText={setText}
        style={styles.input}
        multiline
        placeholder="Or paste a table or CSV here, or type one result to a line"
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.caption}>{LAB_TEXT_HINT}</Text>
      {text.trim() ? (
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={() => readLines(text)}>
          <Ionicons name="list-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.secondaryButtonText}>{readRows ? 'Read These Lines Again' : 'Read These Lines'}</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.label}>Or fill in a whole panel</Text>
      <PopoverSelect
        options={LAB_PANELS.map((panel) => ({ label: panel.label, value: panel.key }))}
        selected={panelKey}
        onSelect={startPanel}
        tabColor={tabColor}
        placeholder="Pick a panel..."
        minWidth={220}
      />
      {panelKey ? <Text style={styles.caption}>{LAB_PANEL_HINT}</Text> : null}

      {readRows ? <Text style={styles.lead}>{describeReadRows(drafts)}</Text> : null}
      {drafts.map((draft) => {
        const test = draft.testCode && draft.testCode !== OWN_TEST ? testByCode.get(draft.testCode) : undefined;
        const testName = test?.displayName ?? (draft.ownName.trim() || 'this test');
        const unitNote = test?.rangeUnit ? describeUnitDifference(draft.unit, test.rangeUnit, test.displayName) : null;
        const problem = draft.source === 'read' || draft.value.trim() ? draftProblem(draft) : null;
        return (
          <View key={draft.key} style={styles.row}>
            {draft.printed ? <Text style={styles.caption}>As printed: {draft.printed}</Text> : null}
            <PopoverSelect
              options={testOptions}
              selected={draft.testCode}
              onSelect={(value) => change(draft.key, { testCode: value })}
              tabColor={tabColor}
              searchable
              placeholder="Pick a test..."
              minWidth={220}
            />
            {draft.testCode === OWN_TEST ? (
              <AppTextInput
                value={draft.ownName}
                onChangeText={(value) => change(draft.key, { ownName: value })}
                style={styles.field}
                placeholder="Name of the test"
                placeholderTextColor={colors.textMuted}
              />
            ) : null}
            <View style={styles.fieldRow}>
              <View style={styles.fieldWrap}>
                <Text style={styles.caption}>Result</Text>
                <AppTextInput
                  value={draft.value}
                  onChangeText={(value) => change(draft.key, { value })}
                  style={styles.field}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 2.4"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.caption}>Unit</Text>
                <AppTextInput
                  value={draft.unit}
                  onChangeText={(value) => change(draft.key, { unit: value })}
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
                  onChangeText={(value) => change(draft.key, { low: value })}
                  style={styles.field}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.caption}>Range high</Text>
                <AppTextInput
                  value={draft.high}
                  onChangeText={(value) => change(draft.key, { high: value })}
                  style={styles.field}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
            {draft.flag ? <Text style={styles.caption}>Marked {draft.flag} on the sheet</Text> : null}
            {unitNote ? <Text style={styles.caption}>{unitNote}</Text> : null}
            {problem ? <Text style={styles.problem}>{problem}</Text> : null}
            <View style={styles.buttonRow}>
              {draft.source === 'read' ? (
                <TouchableOpacity
                  style={draft.confirmed ? styles.button : styles.secondaryButton}
                  activeOpacity={0.8}
                  onPress={() => change(draft.key, { confirmed: !draft.confirmed })}
                  accessibilityLabel={`${draft.confirmed ? 'Confirmed' : 'Confirm'} ${testName}`}
                >
                  <Ionicons
                    name={draft.confirmed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={draft.confirmed ? colors.textOnButton : colors.textPrimary}
                  />
                  <Text style={draft.confirmed ? styles.buttonText : styles.secondaryButtonText}>
                    {draft.confirmed ? 'Confirmed' : 'Matches the Sheet'}
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

      {drafts.length > 0 ? (
        <>
          <Text style={styles.label}>Date drawn</Text>
          {dateLine ? <Text style={styles.caption}>{dateLine}</Text> : null}
          <View style={styles.dateRow}>
            <PopoverSelect options={YEAR_OPTIONS} selected={year} onSelect={setYear} tabColor={tabColor} minWidth={72} />
            <PopoverSelect options={MONTH_OPTIONS} selected={month} onSelect={setMonth} tabColor={tabColor} minWidth={52} />
            <PopoverSelect options={DAY_OPTIONS} selected={day} onSelect={setDay} tabColor={tabColor} minWidth={52} />
          </View>
          <Text style={styles.label}>Lab name (optional)</Text>
          <AppTextInput
            value={labName}
            onChangeText={setLabName}
            style={styles.field}
            placeholder="e.g. Quest Diagnostics"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={[styles.button, saves.length === 0 || saving ? styles.disabled : null]}
            activeOpacity={0.8}
            disabled={saving}
            onPress={() => void save()}
          >
            <Ionicons name="save-outline" size={18} color={colors.textOnButton} />
            <Text style={styles.buttonText}>{saving ? 'Saving…' : describeSaveButton(drafts)}</Text>
          </TouchableOpacity>
          {unsaved ? <Text style={styles.caption}>{unsaved}</Text> : null}
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={clearAll}>
            <Ionicons name="close-circle-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Clear the Sheet</Text>
          </TouchableOpacity>
        </>
      ) : null}

      {ownTests.length > 0 ? (
        <>
          <Text style={styles.label}>Tests you added</Text>
          {ownTests.map((test) => (
            <View key={test.code} style={styles.ownRow}>
              {renaming?.code === test.code ? (
                <AppTextInput
                  value={renaming.name}
                  onChangeText={(name) => setRenaming({ code: test.code, name })}
                  style={[styles.field, styles.ownName]}
                  autoFocus
                  onSubmitEditing={() => void finishRename()}
                  onBlur={() => void finishRename()}
                />
              ) : (
                <Text style={[styles.line, styles.ownName]}>
                  {test.displayName}
                  {test.rangeUnit ? <Text style={styles.caption}> · {test.rangeUnit}</Text> : null}
                </Text>
              )}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => (renaming?.code === test.code ? void finishRename() : setRenaming({ code: test.code, name: test.displayName }))}
              >
                <Text style={[styles.link, { color: tabColor }]}>{renaming?.code === test.code ? 'Done' : 'Rename'}</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => void remove(test)}>
                <Text style={[styles.link, { color: tabColor }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      ) : null}
      <Text style={styles.caption}>{LAB_SHEET_CAPTION}</Text>
    </HomeSectionBand>
  );
}

const styles = StyleSheet.create({
  body: { gap: HOME_BAND_GAP },
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
  fieldRow: { flexDirection: 'row', gap: 8 },
  fieldWrap: { flex: 1, gap: 2 },
  row: { gap: 6, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  dateRow: { flexDirection: 'row', gap: 8 },
  ownRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ownName: { flex: 1 },
});
