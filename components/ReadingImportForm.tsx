import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { sortByLabel } from '../lib/choiceOrder';
import { readBackupFileContent } from '../lib/dataBackup';
import type { GardenPlanting, GardenPlot } from '../lib/db';
import { isDesktopApp } from '../lib/desktop/bridge';
import { areaPath } from '../lib/gardenAreaNesting';
import { formatFigure, unitChoices } from '../lib/growingConditions';
import { importDeviceReadings } from '../lib/growingConditionsDb';
import { termChoices, termLabel, type CustomGardenTerm } from '../lib/growSetup';
import {
  dateOrderOf,
  describePlan,
  findDayColumn,
  IMPORT_HOW,
  initialColumns,
  NOT_FROM_A_FILE,
  parseTable,
  RAIN_FROM_A_FILE_NOTE,
  planImport,
  REIMPORT_NOTE,
  spokenDay,
  usesDecimalComma,
  VPD_COLUMN_NOTE,
  WHERE_KEPT_NOTE,
  type ColumnGuess,
  type ColumnSetting,
  type DateOrder,
  type ParsedTable,
} from '../lib/readingImport';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';
import { QuickAreaForm } from './QuickAreaForm';

// Garden > Growing Conditions > Import Readings from a File (I19,
// 2026-09-28): a controller's history file read into garden_readings with
// source 'device'. The parsing and the arithmetic are in
// lib/readingImport.ts; this is the form around them.

const TAB_COLOR = colors.tabGarden;
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;
const NO_PLOT = '__none__';
const NO_PLANTING = '__none__';
const LEAVE_OUT = '__leave_out__';

const ORDER_OPTIONS: { label: string; value: DateOrder }[] = [
  { label: 'Day first (27/09/2026)', value: 'dmy' },
  { label: 'Month first (09/27/2026)', value: 'mdy' },
];

type Loaded = {
  fileName: string;
  table: ParsedTable;
  dayColumn: number | null;
  /** Null where the file's days could be read either way round. */
  detectedOrder: DateOrder | null;
  decimalComma: boolean;
};

/** Whether the day column's days could each be read either way round, so
 *  the person is asked which comes first. */
function needsDayOrder(file: Loaded): boolean {
  if (file.dayColumn === null) return false;
  const cells = file.table.rows.map((row) => row[file.dayColumn as number] ?? '');
  return dateOrderOf(cells) === null;
}

/** The file's name from where the picker says it is. A phone's picker can
 *  hand back an encoded path ("primary%3ADownload%2Ftent.csv"), so it is
 *  decoded before the last part is taken. */
function fileNameOf(uri: string): string {
  let text = uri;
  try {
    text = decodeURIComponent(uri);
  } catch {
    // A stray % leaves the path as it was given.
  }
  return text.split(/[/\\:]/).pop() || 'the file';
}

function withoutExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

export function ReadingImportForm(props: {
  areas: GardenPlot[];
  plantings: GardenPlanting[];
  terms: CustomGardenTerm[];
  preferF: boolean;
  onAreaAdded: () => Promise<void>;
  onImported: (line: string) => void;
  onCancel: () => void;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [columns, setColumns] = useState<ColumnSetting[]>([]);
  const [order, setOrder] = useState<DateOrder | null>(null);
  const [plotId, setPlotId] = useState<string | null>(null);
  const [plantingId, setPlantingId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [addingArea, setAddingArea] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const labelOf = (code: string) => termLabel('measurement_kind', code, props.terms) ?? code;

  const measurementOptions = useMemo(
    () => [
      { label: 'Leave this column out', value: LEAVE_OUT },
      ...termChoices('measurement_kind', props.terms)
        .filter((choice) => !NOT_FROM_A_FILE[choice.code])
        .map((choice) => ({ label: choice.label, value: choice.code })),
    ],
    [props.terms],
  );

  const areaOptions = useMemo(
    () => [
      { label: 'No area in particular', value: NO_PLOT },
      ...sortByLabel(props.areas.map((area) => ({ label: areaPath(area.id, props.areas), value: area.id }))),
    ],
    [props.areas],
  );

  const plantingOptions = useMemo(() => {
    if (!plotId) return [];
    const mine = props.plantings.filter((planting) => planting.plotId === plotId && planting.status === 'growing');
    if (mine.length === 0) return [];
    return [
      { label: 'The area as a whole', value: NO_PLANTING },
      ...sortByLabel(mine.map((planting) => ({ label: planting.foodName, value: planting.id }))),
    ];
  }, [plotId, props.plantings]);

  const dayColumnOptions = useMemo(
    () => (loaded ? loaded.table.headers.map((header, index) => ({ label: header, value: String(index) })) : []),
    [loaded],
  );

  const chosen = useMemo(
    () =>
      columns.flatMap((column) =>
        column.guess.kind === 'measure' ? [{ index: column.index, measurement: column.guess.measurement, unit: column.guess.unit }] : [],
      ),
    [columns],
  );

  const plan = useMemo(() => {
    if (!loaded || loaded.dayColumn === null || (!order && loaded.detectedOrder === null && needsDayOrder(loaded))) return null;
    return planImport({
      table: loaded.table,
      dayColumn: loaded.dayColumn,
      order: order ?? loaded.detectedOrder,
      columns: chosen,
      decimalComma: loaded.decimalComma,
    });
  }, [loaded, order, chosen]);

  function takeTable(fileName: string, table: ParsedTable) {
    const dayColumn = findDayColumn(table);
    const cells = dayColumn === null ? [] : table.rows.map((row) => row[dayColumn] ?? '');
    const detected = dateOrderOf(cells);
    setLoaded({
      fileName,
      table,
      dayColumn,
      detectedOrder: detected === 'none' ? null : detected,
      decimalComma: usesDecimalComma(table),
    });
    setOrder(null);
    setColumns(initialColumns(table, dayColumn, props.preferF));
    setDeviceName(withoutExtension(fileName));
  }

  async function handlePick() {
    setProblem(null);
    let picked: { uri: string; name: string } | null = null;
    try {
      const { File } = await import('expo-file-system');
      const result = await File.pickFileAsync(undefined, isDesktopApp() ? 'text/csv' : undefined);
      const file = Array.isArray(result) ? result[0] : result;
      if (file) picked = { uri: file.uri, name: fileNameOf(file.uri) };
    } catch {
      // Backing out of the picker is not a problem to report.
      return;
    }
    if (!picked) return;
    const text = await readBackupFileContent(picked.uri);
    if (!text) {
      setProblem('That file could not be read.');
      return;
    }
    const table = parseTable(text);
    if (!table) {
      setProblem('No rows of figures were found in that file. It needs to be a spreadsheet file saved as CSV, with a heading row.');
      return;
    }
    takeTable(picked.name, table);
  }

  function setColumn(index: number, guess: ColumnGuess) {
    setColumns((current) => current.map((column) => (column.index === index ? { ...column, guess } : column)));
  }

  async function handleImport() {
    if (!loaded || !plan || plan.samples.length === 0 || saving) return;
    setSaving(true);
    let result: Awaited<ReturnType<typeof importDeviceReadings>>;
    try {
      result = await importDeviceReadings(plan.samples, {
        plotId,
        plantingId,
        deviceName,
        fileName: loaded.fileName,
      });
    } finally {
      setSaving(false);
    }
    const parts: string[] = [];
    parts.push(`${result.added.toLocaleString('en-US')} ${result.added === 1 ? 'reading' : 'readings'} added`);
    if (result.alreadyHere > 0)
      parts.push(`${result.alreadyHere.toLocaleString('en-US')} already here from an earlier import, left as they were`);
    parts.push(`${result.days.toLocaleString('en-US')} ${result.days === 1 ? 'day' : 'days'} and ${result.hours.toLocaleString('en-US')} ${result.hours === 1 ? 'hour' : 'hours'} worked out again`);
    props.onImported(`From ${loaded.fileName}: ${parts.join(', ')}.`);
  }

  const vpdColumns = columns.filter((column) => column.guess.kind === 'measure' && column.guess.measurement === 'vpd');
  const showOrder = !!loaded && loaded.detectedOrder === null && needsDayOrder(loaded);
  const sample = plan ? plan.samples.slice(-4) : [];

  return (
    <View style={styles.formCard}>
      <Text style={styles.captionText}>{IMPORT_HOW}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handlePick}>
          <Text style={styles.primaryButtonText}>{loaded ? 'Pick a Different File' : 'Pick a File'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={props.onCancel}>
          <Text style={styles.linkText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      {problem ? <Text style={styles.errorText}>{problem}</Text> : null}

      {loaded ? (
        <>
          <Text style={styles.bodyText}>
            {loaded.fileName}: {loaded.table.rows.length.toLocaleString('en-US')} rows, {loaded.table.headers.length} columns.
          </Text>

          <Text style={styles.fieldLabel}>Which area are these readings for?</Text>
          <View style={styles.fieldRow}>
            <PopoverSelect
              options={areaOptions}
              selected={plotId ?? NO_PLOT}
              onSelect={(value) => {
                setPlotId(value === NO_PLOT ? null : value);
                setPlantingId(null);
              }}
              tabColor={TAB_COLOR}
              width={220}
            />
            {addingArea ? null : (
              <TouchableOpacity onPress={() => setAddingArea(true)}>
                <Text style={styles.linkText}>Add an area</Text>
              </TouchableOpacity>
            )}
          </View>
          {addingArea ? (
            <QuickAreaForm
              areas={props.areas}
              caption="Saving picks this area for the readings in the file."
              backLabel="Back to the file"
              onSaved={async (id) => {
                await props.onAreaAdded();
                setPlotId(id);
                setPlantingId(null);
                setAddingArea(false);
              }}
              onBack={() => setAddingArea(false)}
            />
          ) : null}
          {plantingOptions.length > 0 ? (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>For</Text>
              <PopoverSelect
                options={plantingOptions}
                selected={plantingId ?? NO_PLANTING}
                onSelect={(value) => setPlantingId(value === NO_PLANTING ? null : value)}
                tabColor={TAB_COLOR}
                width={220}
              />
            </View>
          ) : null}

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Device</Text>
            <AppTextInput style={[styles.textInput, styles.wideInput]} value={deviceName} onChangeText={setDeviceName} placeholder="Tent controller" />
          </View>

          <Text style={styles.fieldLabel}>The day on each row</Text>
          {loaded.dayColumn === null ? (
            <Text style={styles.errorText}>No column in this file holds a day that can be read, so nothing in it can be dated.</Text>
          ) : (
            <View style={styles.fieldRow}>
              <PopoverSelect
                options={dayColumnOptions}
                selected={String(loaded.dayColumn)}
                onSelect={(value) => {
                  const index = Number(value);
                  const cells = loaded.table.rows.map((row) => row[index] ?? '');
                  const detected = dateOrderOf(cells);
                  setLoaded({ ...loaded, dayColumn: index, detectedOrder: detected === 'none' ? null : detected });
                  setOrder(null);
                  setColumns(initialColumns(loaded.table, index, props.preferF));
                }}
                tabColor={TAB_COLOR}
                width={220}
              />
            </View>
          )}
          {showOrder ? (
            <>
              <Text style={styles.captionText}>
                Every day in this file could be read either way round. Which comes first?
              </Text>
              <PopoverSelect
                options={ORDER_OPTIONS}
                selected={order}
                onSelect={(value) => setOrder(value as DateOrder)}
                tabColor={TAB_COLOR}
                width={240}
                placeholder="Pick one"
              />
            </>
          ) : null}

          <Text style={styles.fieldLabel}>What each column holds</Text>
          {columns.map((column) => {
              const guess = column.guess;
              const measurement = guess.kind === 'measure' ? guess.measurement : LEAVE_OUT;
              const units = guess.kind === 'measure' ? unitChoices(guess.measurement, [guess.unit].filter(Boolean)) : [];
              return (
                <View key={column.index} style={styles.columnRow}>
                  <Text style={styles.bodyText}>{column.header}</Text>
                  <View style={styles.fieldRow}>
                    <PopoverSelect
                      options={measurementOptions}
                      selected={measurement}
                      onSelect={(value) => {
                        if (value === LEAVE_OUT) setColumn(column.index, { kind: 'skip' });
                        else setColumn(column.index, { kind: 'measure', measurement: value, unit: unitChoices(value)[0] ?? '' });
                      }}
                      tabColor={TAB_COLOR}
                      width={200}
                    />
                    {guess.kind === 'measure' && units.length > 0 ? (
                      <PopoverSelect
                        options={units.map((unit) => ({ label: unit, value: unit }))}
                        selected={guess.unit}
                        onSelect={(value) => setColumn(column.index, { ...guess, unit: value })}
                        tabColor={TAB_COLOR}
                        width={100}
                      />
                    ) : null}
                    {guess.kind === 'measure' && units.length === 0 ? (
                      <AppTextInput
                        style={[styles.textInput, styles.unitInput]}
                        value={guess.unit}
                        onChangeText={(text) => setColumn(column.index, { ...guess, unit: text })}
                        placeholder="Unit"
                      />
                    ) : null}
                  </View>
                </View>
              );
            })}
          {vpdColumns.length > 0 ? <Text style={styles.captionText}>{VPD_COLUMN_NOTE}</Text> : null}
          <Text style={styles.captionText}>{RAIN_FROM_A_FILE_NOTE}</Text>

          {plan ? (
            <View style={styles.previewBox}>
              <Text style={styles.fieldLabel}>What importing adds</Text>
              {describePlan(plan, labelOf).map((line) => (
                <Text key={line} style={styles.bodyText}>
                  {line}
                </Text>
              ))}
              {sample.length > 0 ? <Text style={styles.captionText}>The last few, as they will be kept:</Text> : null}
              {sample.map((figure) => (
                <Text key={`${figure.at}|${figure.measurement}`} style={styles.captionText}>
                  {spokenDay(figure.at.slice(0, 10))}
                  {figure.at.length > 10 ? ` ${figure.at.slice(11, 16)}` : ''}, {labelOf(figure.measurement).toLowerCase()}:{' '}
                  {formatFigure(figure.value, figure.unit)}
                </Text>
              ))}
              <Text style={styles.captionText}>{REIMPORT_NOTE}</Text>
              <Text style={styles.captionText}>{WHERE_KEPT_NOTE}</Text>
              {plan.samples.length > 0 ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleImport}>
                    <Text style={styles.primaryButtonText}>{saving ? 'Importing…' : 'Import These Readings'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: { borderRadius: 10, backgroundColor: colors.surfaceMuted, padding: 12, gap: 8 },
  previewBox: { gap: 6, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR, marginTop: 4 },
  columnRow: { gap: 4 },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  wideInput: { flex: 1, minWidth: 160 },
  unitInput: { width: 90 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', ...BUTTON_SHADOW },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
