// "Today I want to", C15 of the competitive build plan (Phase 2, 2026-09-26).
// A Home card holding a few Did I Do It checks picked for today. A tap marks
// the check, and a second tap takes back a mark made today and nothing older;
// whether a pick happened is read from the check's marks, so marking it on
// Life > Did I Do It or through a routine counts here too. No counts, no
// percentages and nothing said about what was left: tomorrow starts empty and
// yesterday's picks come back only when asked for. See lib/todayPicks.ts.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { DoneCheck } from '../lib/routines';
import { getDoneChecks } from '../lib/routinesDb';
import {
  MAX_TODAY_PICKS,
  TODAY_PICKS_EMPTY,
  canPickMore,
  describeTodayPick,
  localDayKey,
  type TodayPick,
} from '../lib/todayPicks';
import {
  dayBefore,
  listPicksFromDay,
  listTodayPicks,
  markTodayPick,
  pickForToday,
  pickNewForToday,
  unmarkTodayPick,
  unpickForToday,
} from '../lib/todayPicksDb';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';

type Props = {
  tabColor: string;
};

export function TodayPicks({ tabColor }: Props) {
  const [day, setDay] = useState(() => localDayKey(new Date()));
  const [picks, setPicks] = useState<TodayPick[]>([]);
  const [checks, setChecks] = useState<DoneCheck[]>([]);
  const [yesterday, setYesterday] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const today = localDayKey(new Date());
    setDay(today);
    const [nextPicks, nextChecks, before] = await Promise.all([
      listTodayPicks(today),
      getDoneChecks(),
      listPicksFromDay(dayBefore(today)),
    ]);
    setPicks(nextPicks);
    setChecks(nextChecks);
    setYesterday(before);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    await action();
    await load();
    setBusy(false);
  }

  const pickedIds = new Set(picks.map((pick) => pick.checkId));
  const room = canPickMore(picks.length);
  const choices = checks
    .filter((check) => !pickedIds.has(check.id))
    .map((check) => ({ label: check.name, value: check.id }));
  const again = yesterday.filter((id) => !pickedIds.has(id));

  return (
    <View style={styles.body}>
      {picks.length === 0 ? <Text style={styles.caption}>{TODAY_PICKS_EMPTY}</Text> : null}

      {picks.map((pick) => {
        const line = describeTodayPick(pick);
        return (
          <View key={pick.checkId} style={styles.row}>
            <TouchableOpacity
              style={styles.rowMain}
              disabled={busy}
              onPress={() =>
                void run(() => (pick.doneAt ? unmarkTodayPick(pick.checkId, day) : markTodayPick(pick.checkId)))
              }
              accessibilityLabel={pick.doneAt ? `Take back the mark on ${pick.name}` : `Mark ${pick.name} as done`}
            >
              <Ionicons
                name={pick.doneAt ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={pick.doneAt ? tabColor : colors.textSecondary}
              />
              <View style={styles.rowText}>
                <Text style={styles.name}>{pick.name}</Text>
                {line ? <Text style={styles.caption}>{line}</Text> : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={busy}
              onPress={() => void run(() => unpickForToday(day, pick.checkId))}
              accessibilityLabel={`Take ${pick.name} off today`}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        );
      })}

      {room ? (
        <>
          {choices.length > 0 ? (
            <PopoverSelect
              options={choices}
              selected={null}
              onSelect={(checkId) => void run(() => pickForToday(day, checkId))}
              tabColor={tabColor}
              placeholder="Pick from Did I Do It"
              searchable={choices.length > 8}
            />
          ) : null}
          <View style={styles.inputRow}>
            <AppTextInput
              onVoiceResult={(transcript) => setNewName(transcript)}
              micColor={tabColor}
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Or something new"
              returnKeyType="done"
              onSubmitEditing={() => {
                const name = newName.trim();
                if (!name) return;
                setNewName('');
                void run(() => pickNewForToday(day, name));
              }}
            />
            <TouchableOpacity
              style={[styles.button, { borderColor: tabColor }, newName.trim() ? null : styles.off]}
              disabled={busy || !newName.trim()}
              onPress={() => {
                const name = newName.trim();
                setNewName('');
                void run(() => pickNewForToday(day, name));
              }}
            >
              <Text style={[styles.buttonText, { color: tabColor }]}>Add</Text>
            </TouchableOpacity>
          </View>
          {picks.length === 0 && again.length > 0 ? (
            <TouchableOpacity
              style={[styles.button, styles.wide, { borderColor: tabColor }]}
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  for (const id of again.slice(0, MAX_TODAY_PICKS)) await pickForToday(day, id);
                })
              }
            >
              <Ionicons name="refresh" size={16} color={tabColor} />
              <Text style={[styles.buttonText, { color: tabColor }]}>{"Pick yesterday's again"}</Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : (
        <Text style={styles.caption}>{`That is ${MAX_TODAY_PICKS} for today. Take one off to pick another.`}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  rowText: { flex: 1 },
  name: { ...typography.body, ...textShadow, color: colors.textPrimary },
  caption: { ...typography.caption, ...textShadow, color: colors.textSecondary },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  wide: { alignSelf: 'flex-start' },
  off: { opacity: 0.5 },
  buttonText: { ...typography.bodyEmphasis, textShadowColor: 'transparent', textShadowRadius: 0 },
});
