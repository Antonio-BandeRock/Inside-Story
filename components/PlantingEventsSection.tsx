// What was done to one planting (I14, 2026-09-28), under its row in Garden >
// Plots & Plantings: watered, fed, pruned, a pest seen, each on the day it
// was done. Folded to one line until opened, so an area with many plantings
// still reads as a list of plantings.
//
// The kinds are an open list (planting_event_kind in lib/growSetup.ts)
// picked through GardenTermField, so Add a thing done of your own, Rename
// and Remove come with it. The words and counting are in
// lib/plantingEvents.ts; the reading and writing in lib/plantingEventsDb.ts.
// Nothing here says what ought to be done to a plant.

import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { termLabel, type CustomGardenTerm } from '../lib/growSetup';
import { dateLabel } from '../lib/moonSky';
import { dateKey, describePlainDate, readPlainDateField } from '../lib/plainDate';
import {
  countByKind,
  entryProblem,
  plantingCareSummary,
  type PlantingEventRecord,
} from '../lib/plantingEvents';
import { addPlantingEvent, deletePlantingEvent, listPlantingEvents } from '../lib/plantingEventsDb';
import { AppTextInput } from './AppTextInput';
import { GardenTermField } from './GardenTermField';
import { NotesInput } from './NotesInput';
import { ThumbRow } from './ThumbRow';

const TAB_COLOR = colors.tabGarden;
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;
const SHOWN_AT_FIRST = 8;

type Props = {
  plantingId: string;
  plotId: string;
  terms: CustomGardenTerm[];
  onTermsChanged: () => Promise<void> | void;
  /** After an entry is added or deleted, so the row above can tell whether
   *  the planting now has a record. */
  onChanged?: () => void;
  /** Changes when an entry is written from outside this section (What Is
   *  Wrong With It, I25), so the list reads it again. */
  refreshKey?: number;
};

function yesterdayKey(): string {
  const now = new Date();
  return dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
}

export function PlantingEventsSection({ plantingId, plotId, terms, onTermsChanged, onChanged, refreshKey }: Props) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<PlantingEventRecord[]>([]);
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<string | null>(null);
  const [day, setDay] = useState(dateKey(new Date()));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setEvents(await listPlantingEvents(plantingId));
  }, [plantingId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const labelFor = (code: string) => termLabel('planting_event_kind', code, terms) ?? 'A kind no longer on the list';
  const counts = countByKind(events, labelFor);
  const today = dateKey(new Date());
  const typedDate = readPlainDateField(day, new Date(), 'past');

  function reset() {
    setAdding(false);
    setKind(null);
    setDay(dateKey(new Date()));
    setNote('');
    setError(null);
  }

  async function handleSave() {
    const problem = entryProblem({ kind, occurredOn: day.trim(), today: dateKey(new Date()) });
    if (problem) {
      setError(problem);
      return;
    }
    await addPlantingEvent({ plantingId, plotId, occurredOn: day.trim(), kind: kind as string, note });
    reset();
    await load();
    onChanged?.();
  }

  async function handleDelete(id: string) {
    await deletePlantingEvent(id);
    await load();
    onChanged?.();
  }

  const shown = showAll ? events : events.slice(0, SHOWN_AT_FIRST);

  return (
    <View style={styles.section}>
      <TouchableOpacity onPress={() => setOpen(!open)} accessibilityRole="button">
        <Text style={styles.linkText}>{open ? 'Hide what was done' : 'What was done'}</Text>
      </TouchableOpacity>
      {!open ? (
        events.length > 0 ? <Text style={styles.captionText}>{plantingCareSummary(counts)}</Text> : null
      ) : (
        <View style={styles.nested}>
          <Text style={styles.captionText}>{plantingCareSummary(counts)}</Text>

          {adding ? (
            <View style={styles.form}>
              <GardenTermField
                list="planting_event_kind"
                label="What was done"
                selected={kind}
                onSelect={setKind}
                terms={terms}
                onTermsChanged={onTermsChanged}
                showHelp
              />
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Day</Text>
                <AppTextInput
                  style={[styles.textInput, styles.dateInput]}
                  value={day}
                  onChangeText={setDay}
                  placeholder="YYYY-MM-DD"
                />
                <TouchableOpacity onPress={() => setDay(today)}>
                  <Text style={styles.linkText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDay(yesterdayKey())}>
                  <Text style={styles.linkText}>Yesterday</Text>
                </TouchableOpacity>
              </View>
              {typedDate ? (
                <TouchableOpacity onPress={() => setDay(typedDate.date)}>
                  <Text style={styles.linkText}>Use {describePlainDate(typedDate, new Date())}</Text>
                </TouchableOpacity>
              ) : null}
              <NotesInput
                style={styles.textInput}
                value={note}
                onChangeText={setNote}
                placeholder="What, how much, how many (optional)"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <ThumbRow primary="first" style={styles.actionRow}>
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleSave}>
                  <Text style={styles.primaryButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={reset}>
                  <Text style={styles.linkText}>Cancel</Text>
                </TouchableOpacity>
              </ThumbRow>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setAdding(true)}>
              <Text style={styles.linkText}>Record something done</Text>
            </TouchableOpacity>
          )}

          {shown.map((event) => (
            <View key={event.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.bodyText}>{labelFor(event.kind)}</Text>
                <Text style={styles.captionText}>
                  {dateLabel(event.occurredOn)}
                  {event.note ? ` · ${event.note}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(event.id)}>
                <Text style={[styles.linkText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
          {events.length > SHOWN_AT_FIRST ? (
            <TouchableOpacity onPress={() => setShowAll(!showAll)}>
              <Text style={styles.linkText}>{showAll ? 'Show fewer' : `Show all ${events.length}`}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6, marginVertical: 4 },
  nested: { gap: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR },
  form: { gap: 8 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 2 },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  dateInput: { width: 130 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', alignSelf: 'flex-start', ...BUTTON_SHADOW },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
