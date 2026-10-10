// Care for this crop (I1, 2026-10-02), under each planting's row in Garden >
// Plots & Plantings, beside What is wrong with it. Folded to one line until
// opened. Open, it lists what the crop needs doing and how often, each with
// where the days between came from, and adds the ticked ones as repeating
// Garden tasks tied to this planting. What is already running is listed with
// a Stop. Every task and sentence lives in lib/cropCare.ts.

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  CARE_INTRO,
  CARE_LIGHT_FEEDER,
  CARE_NO_CROP,
  CARE_STOPPED_NOTE,
  careEndsOn,
  careFirstDate,
  careRepeat,
  careStillRuns,
  careTasksFor,
  describeAdded,
  describeBasis,
  describeCadence,
  describeWaitsFor,
  readEveryDays,
  tickedByDefault,
  type CareTask,
} from '../lib/cropCare';
import type { CropGuide } from '../lib/cropGuides';
import { deleteScheduleSeries, listPlantingSeries, scheduleGardenTask, type PlantingSeries } from '../lib/db';
import { dateLabel } from '../lib/moonSky';
import { dateKey } from '../lib/plainDate';
import { AppTextInput } from './AppTextInput';
import { ThumbEndRow } from './ThumbEndRow';

const TAB_COLOR = colors.tabGarden;

type Props = {
  plantingId: string;
  plotId: string;
  status: string;
  guide: CropGuide | null;
  expectedHarvestStart: string | null;
  expectedHarvestEnd: string | null;
  /** Read again when the planting's status changes, since a harvested or
   *  pulled out planting has had its care stopped. */
  refreshKey?: string;
};

export function CropCareSection({ plantingId, plotId, status, guide, expectedHarvestStart, expectedHarvestEnd, refreshKey }: Props) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState<PlantingSeries[]>([]);
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [days, setDays] = useState<Record<string, string>>({});
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tasks = guide ? careTasksFor(guide) : [];
  const runs = careStillRuns(status);

  async function reload() {
    setRunning(await listPlantingSeries(plantingId));
  }

  useEffect(() => {
    if (!open) return;
    reload();
    // reload reads only plantingId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, plantingId, refreshKey]);

  const runningTitles = new Set(running.map((series) => series.title));
  const isTicked = (task: CareTask) => ticked[task.key] ?? tickedByDefault(task);
  const daysText = (task: CareTask) => days[task.key] ?? String(task.everyDays);

  async function handleAdd() {
    if (!guide) return;
    const chosen = tasks.filter((task) => isTicked(task) && !runningTitles.has(task.title));
    for (const task of chosen) {
      if (task.everyDays > 0 && readEveryDays(daysText(task)) === null) {
        setError(`Days between for "${task.title}" need to be a whole number from 1 to 365.`);
        return;
      }
    }
    setError(null);
    setBusy(true);
    try {
      const today = dateKey(new Date());
      const endsOn = careEndsOn(guide, expectedHarvestEnd);
      for (const task of chosen) {
        const everyDays = task.everyDays > 0 ? readEveryDays(daysText(task)) ?? task.everyDays : 0;
        const first = careFirstDate(task, today, expectedHarvestStart);
        await scheduleGardenTask({
          title: task.title,
          scheduledFor: `${first}T09:00`,
          notes: task.note,
          plotId,
          plantingId,
          repeat: careRepeat(everyDays, endsOn, first),
        });
      }
      setAdded(describeAdded(chosen.length));
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleStop(series: PlantingSeries) {
    await deleteScheduleSeries(series.repeatGroupId);
    setAdded(null);
    await reload();
  }

  function renderTask(task: CareTask) {
    const already = runningTitles.has(task.title);
    const chosen = isTicked(task) && !already;
    const noteOpen = openNote === task.key;
    const waits = describeWaitsFor(task);
    return (
      <View key={task.key} style={styles.task}>
        <View style={styles.taskRow}>
          <TouchableOpacity accessibilityLabel={`Tick ${task.title}`}
            onPress={() => setTicked((current) => ({ ...current, [task.key]: !isTicked(task) }))}
            disabled={already}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: chosen, disabled: already }}
            hitSlop={6}
          >
            <Ionicons name={chosen ? 'checkbox-outline' : 'square-outline'} size={20} color={already ? colors.textMuted : TAB_COLOR} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.taskText} onPress={() => setOpenNote(noteOpen ? null : task.key)} accessibilityRole="button">
            <Text style={styles.rowLabel}>{task.title}</Text>
            <Text style={styles.captionText}>
              {already ? 'Already on the schedule.' : `${describeCadence(task.everyDays)}. ${describeBasis(task)}`}
            </Text>
          </TouchableOpacity>
        </View>
        {waits && !already ? <Text style={[styles.captionText, styles.indented]}>{waits}</Text> : null}
        {chosen && task.everyDays > 0 ? (
          <View style={[styles.daysRow, styles.indented]}>
            <Text style={styles.captionText}>Every</Text>
            <AppTextInput
              style={[styles.textInput, styles.daysInput]}
              value={daysText(task)}
              onChangeText={(text) => {
                setDays((current) => ({ ...current, [task.key]: text }));
                setError(null);
              }}
              keyboardType="number-pad"
              accessibilityLabel={`Days between for ${task.title}`}
            />
            <Text style={styles.captionText}>days</Text>
          </View>
        ) : null}
        {noteOpen ? (
          <View style={[styles.noteBody, styles.indented]}>
            <Text style={styles.bodyText}>{task.note}</Text>
            {task.sources.map((source) => (
              <TouchableOpacity key={source.url} onPress={() => Linking.openURL(source.url)} accessibilityRole="link">
                <Text style={styles.sourceText}>{source.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  const tickedCount = tasks.filter((task) => isTicked(task) && !runningTitles.has(task.title)).length;

  return (
    <View style={styles.section}>
      <TouchableOpacity onPress={() => setOpen(!open)} accessibilityRole="button">
        <Text style={styles.linkText}>{open ? 'Hide care for this crop' : 'Care for this crop'}</Text>
      </TouchableOpacity>
      {open ? (
        <View style={styles.nested}>
          {!guide ? (
            <Text style={styles.bodyText}>{CARE_NO_CROP}</Text>
          ) : (
            <>
              <Text style={styles.bodyText}>{CARE_INTRO}</Text>
              {running.length > 0 ? (
                <View style={styles.group}>
                  <Text style={styles.fieldLabel}>On the schedule</Text>
                  {running.map((series) => (
                    <ThumbEndRow key={series.repeatGroupId} style={styles.runningRow}>
                      <Text style={[styles.bodyText, styles.taskText]}>
                        {`${series.title}. ${series.everyDays ? describeCadence(series.everyDays) : 'Repeating'}, next ${dateLabel(series.nextOn)}.`}
                      </Text>
                      <TouchableOpacity onPress={() => handleStop(series)} accessibilityRole="button" hitSlop={6}>
                        <Text style={styles.linkText}>Stop</Text>
                      </TouchableOpacity>
                    </ThumbEndRow>
                  ))}
                  <Text style={styles.captionText}>{CARE_STOPPED_NOTE}</Text>
                </View>
              ) : null}
              {runs ? (
                <View style={styles.group}>
                  <Text style={styles.fieldLabel}>{`What ${guide.name.toLowerCase()} need`}</Text>
                  {tasks.map(renderTask)}
                  {guide.feeding === 'light' ? <Text style={styles.captionText}>{CARE_LIGHT_FEEDER}</Text> : null}
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  {added ? <Text style={styles.captionText}>{added}</Text> : null}
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.buttonColor }, tickedCount === 0 || busy ? styles.disabled : null]}
                    onPress={handleAdd}
                    disabled={tickedCount === 0 || busy}
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryButtonText}>Add as Repeating Tasks</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.captionText}>
                  Care is added only while a planting is to sow or growing. This one is not, so its tasks still to come have been taken off.
                </Text>
              )}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6, marginVertical: 4 },
  nested: { gap: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR },
  group: { gap: 8 },
  task: { gap: 4 },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  taskText: { flex: 1 },
  indented: { paddingLeft: 28 },
  noteBody: { gap: 6 },
  daysRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  runningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  rowLabel: { ...typography.body, color: colors.primary, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  sourceText: { ...typography.caption, color: colors.primary, ...textShadow },
  errorText: { ...typography.caption, color: colors.danger, ...textShadow },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.textPrimary,
  },
  daysInput: { width: 70 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', alignSelf: 'flex-start', ...BUTTON_SHADOW },
  primaryButtonText: {
    ...typography.body,
    color: colors.textOnButton,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  disabled: { opacity: 0.5 },
});
