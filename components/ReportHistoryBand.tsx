// Report history on the Reports tab (K7, 2026-09-29): every report that
// left this device, newest first, each with Make it again, who it was for
// and Remove. The line a report just made is opened for a name straight
// away, which can be left blank. What each line says is in
// lib/reportHistory.ts.

import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  FOR_WHOM_MAX,
  REPORT_HISTORY_CAPTION,
  REPORT_HISTORY_EMPTY,
  REPORT_HISTORY_HEADING,
  earlierNames,
  historyCaption,
  historyTitle,
  type ReportHistoryEntry,
} from '../lib/reportHistory';
import { listReportHistory, removeReportHistory, setReportForWhom } from '../lib/reportHistoryDb';
import { REPORT_KINDS } from '../lib/reportKinds';
import { AppTextInput } from './AppTextInput';
import { useConfirmSheet } from './ConfirmSheet';
import { useTabBandStyles } from './TabBand';

const SHOWN_AT_FIRST = 10;

type Props = {
  tabColor: string;
  /** Changes whenever a report is recorded, so the list reads again. */
  refreshKey: number;
  /** The line just recorded, opened for a name. */
  askForId: string | null;
  onMakeAgain: (entry: ReportHistoryEntry) => void;
};

export function ReportHistoryBand({ tabColor, refreshKey, askForId, onMakeAgain }: Props) {
  const band = useTabBandStyles(tabColor);
  const [entries, setEntries] = useState<ReportHistoryEntry[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [confirm, confirmElement] = useConfirmSheet();

  const reload = useCallback(() => {
    listReportHistory()
      .then(setEntries)
      .catch((error: unknown) => {
        console.warn('[reports] could not read report history', error);
        setEntries([]);
      });
  }, []);

  useFocusEffect(reload);
  useEffect(reload, [refreshKey, reload]);

  useEffect(() => {
    if (!askForId) return;
    setEditingId(askForId);
    setDraft('');
  }, [askForId]);

  function startEditing(entry: ReportHistoryEntry) {
    setEditingId(entry.id);
    setDraft(entry.forWhom ?? '');
  }

  async function saveName(id: string, name: string | null) {
    await setReportForWhom(id, name);
    setEditingId(null);
    reload();
  }

  async function handleRemove(entry: ReportHistoryEntry) {
    const ok = await confirm({
      title: 'Remove this line?',
      message: 'Only the line in this history goes. The report itself, wherever it was sent, is not affected.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    await removeReportHistory(entry.id);
    if (editingId === entry.id) setEditingId(null);
    reload();
  }

  const kindLabel = (key: string) => REPORT_KINDS.find((def) => def.key === key)?.label ?? null;
  const list = entries ?? [];
  const shown = showAll ? list : list.slice(0, SHOWN_AT_FIRST);
  const names = earlierNames(list);

  return (
    <View style={band.box}>
      <Text style={styles.heading}>{REPORT_HISTORY_HEADING}</Text>
      <Text style={styles.caption}>{list.length > 0 ? REPORT_HISTORY_CAPTION : REPORT_HISTORY_EMPTY}</Text>
      {shown.map((entry) => (
        <View key={entry.id} style={styles.row}>
          <Text style={styles.title}>{historyTitle(entry, kindLabel(entry.kind))}</Text>
          <Text style={styles.caption}>{historyCaption(entry)}</Text>
          {editingId === entry.id ? (
            <View style={styles.editWrap}>
              <Text style={styles.fieldLabel}>Who was it for? (optional)</Text>
              <AppTextInput
                style={styles.textInput}
                value={draft}
                onChangeText={setDraft}
                placeholder="For example, Dr. Ruiz"
                maxLength={FOR_WHOM_MAX}
              />
              {names.length > 0 ? (
                <View style={styles.buttonRow}>
                  {names.map((name) => (
                    <TouchableOpacity key={name} style={styles.namePill} onPress={() => void saveName(entry.id, name)} accessibilityRole="button">
                      <Text style={styles.namePillText}>{name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={() => void saveName(entry.id, draft)} accessibilityRole="button">
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonQuiet} onPress={() => setEditingId(null)} accessibilityRole="button">
                  <Text style={styles.buttonQuietText}>{entry.forWhom ? 'Cancel' : 'Leave blank'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={() => onMakeAgain(entry)} accessibilityRole="button">
                <Text style={styles.buttonText}>Make it again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonQuiet} onPress={() => startEditing(entry)} accessibilityRole="button">
                <Text style={styles.buttonQuietText}>{entry.forWhom ? 'Change who' : 'Who it was for'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonQuiet} onPress={() => void handleRemove(entry)} accessibilityRole="button">
                <Text style={styles.buttonQuietText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
      {list.length > SHOWN_AT_FIRST ? (
        <TouchableOpacity style={styles.buttonQuiet} onPress={() => setShowAll((value) => !value)} accessibilityRole="button">
          <Text style={styles.buttonQuietText}>{showAll ? 'Show the latest only' : `Show all ${list.length}`}</Text>
        </TouchableOpacity>
      ) : null}
      {confirmElement}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.bodyEmphasis, color: colors.textPrimary, marginBottom: 6, ...textShadow },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  row: { marginTop: 12, gap: 4 },
  title: { ...typography.body, color: colors.textPrimary, ...textShadow },
  editWrap: { gap: 8, marginTop: 4 },
  fieldLabel: { ...typography.eyebrow, color: colors.textSecondary, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  button: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
  },
  buttonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  buttonQuiet: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  buttonQuietText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  namePill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  namePillText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
});
