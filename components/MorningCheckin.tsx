// The Morning Check-In card on Home, D7 of the competitive build plan
// (Phase 2, 2026-09-26). Last night's sleep, resting heart rate and heart
// rate variability from a watch or ring, each beside the person's usual
// range, then how they slept, how much energy they have and a note. Loads
// itself on focus, like the Days Until card, so Home only has to place it.
// See lib/morningCheckin.ts for the wording and lib/morningCheckinDb.ts for
// where the answer goes.
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { scaleOf } from '../lib/dailyScales';
import {
  morningLines,
  morningSummary,
  NO_READINGS_SENTENCE,
  SLEEP_QUALITY_WORDS,
  type MorningLine,
} from '../lib/morningCheckin';
import { getMorningCheckin, getMorningInputs, saveMorningCheckin, type MorningRecord } from '../lib/morningCheckinDb';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import { AppTextInput } from './AppTextInput';

const ENERGY = scaleOf('energy');

type Props = { tabColor: string };

export function MorningCheckin({ tabColor }: Props) {
  const [lines, setLines] = useState<MorningLine[] | null>(null);
  const [record, setRecord] = useState<MorningRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [inputs, saved] = await Promise.all([getMorningInputs(), getMorningCheckin()]);
    setLines(morningLines(inputs));
    setRecord(saved);
    setSleepQuality(saved?.sleepQuality ?? null);
    setEnergy(saved?.energy ?? null);
    setNote(saved?.notes ?? '');
    setEditing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function save() {
    setSaving(true);
    try {
      await saveMorningCheckin({ existingId: record?.id ?? null, sleepQuality, energy, notes: note });
      // This morning's reminder, if it has not fired yet, has nothing left to ask.
      void syncReminderNotifications();
      await load();
    } finally {
      setSaving(false);
    }
  }

  function renderPills(words: string[], value: number | null, onPick: (next: number | null) => void, numbered: boolean) {
    return (
      <View style={styles.pillRow}>
        {words.map((word, index) => {
          const n = index + 1;
          const active = value === n;
          return (
            <TouchableOpacity
              key={word}
              style={[styles.pill, active && { backgroundColor: tabColor, borderColor: tabColor }]}
              onPress={() => onPick(active ? null : n)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{numbered ? `${n} ${word}` : word}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  const answered = sleepQuality !== null || energy !== null || note.trim().length > 0;

  return (
    <View style={styles.block}>
      {lines === null ? null : lines.length === 0 ? (
        <Text style={styles.caption}>{NO_READINGS_SENTENCE}</Text>
      ) : (
        lines.map((line) => (
          <View key={line.key} style={styles.reading}>
            <Text style={styles.body}>
              {line.label}: {line.reading}
            </Text>
            <Text style={styles.caption}>{line.usual}</Text>
          </View>
        ))
      )}

      {record && !editing ? (
        <View style={styles.reading}>
          <Text style={styles.body}>
            {morningSummary({
              sleepQuality: record.sleepQuality,
              energy: record.energy,
              energyWord: record.energy !== null && record.energy >= 1 && record.energy <= 5 ? ENERGY.words[record.energy - 1] : null,
            })}
          </Text>
          {record.notes ? <Text style={styles.caption}>{record.notes}</Text> : null}
          <TouchableOpacity onPress={() => setEditing(true)} hitSlop={8}>
            <Text style={[styles.link, { color: tabColor }]}>Change this morning&apos;s answer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>How did you sleep?</Text>
          {renderPills(SLEEP_QUALITY_WORDS, sleepQuality, setSleepQuality, false)}
          <Text style={styles.label}>{ENERGY.question}</Text>
          {renderPills(ENERGY.words, energy, setEnergy, true)}
          <AppTextInput
            style={styles.input}
            placeholder="Anything about the night (optional)"
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.buttonColor }, (!answered || saving) && styles.buttonDisabled]}
            onPress={save}
            disabled={!answered || saving}
          >
            <Text style={styles.buttonText}>{record ? 'Save the Change' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 12 },
  reading: { gap: 2 },
  form: { gap: 8 },
  body: { ...typography.body, ...textShadow, color: colors.textPrimary },
  caption: { ...typography.caption, ...textShadow, color: colors.textMuted },
  label: { ...typography.label, ...textShadow, color: colors.textPrimary },
  link: { ...typography.caption, ...textShadow, marginTop: 4 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: colors.surfaceMuted,
  },
  pillText: { ...typography.caption, ...textShadow, color: colors.textPrimary },
  pillTextActive: { color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
    minHeight: 44,
  },
  button: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', alignSelf: 'flex-start', ...BUTTON_SHADOW },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.textOnButton, fontWeight: '400', textShadowColor: 'transparent', textShadowRadius: 0 },
});
