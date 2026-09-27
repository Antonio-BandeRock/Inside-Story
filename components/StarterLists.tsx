// Starter lists to copy, C13 of the competitive build plan (Phase 2,
// 2026-09-26). Sits under the Add button on Life > Routines and Life >
// Upkeep, folded to one line until asked for. Nothing is written until the
// person picks a starter and presses the button under it; what is written is
// an ordinary routine or upkeep item, changed or removed the usual way. The
// lists themselves are in lib/starterLists.ts.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { addRoutineStep, createRoutine } from '../lib/routinesDb';
import {
  STARTER_ROUTINES,
  STARTER_UPKEEP,
  freeRoutineName,
  upkeepAlreadyHeld,
  type StarterRoutine,
} from '../lib/starterLists';
import { upsertUpkeepItem } from '../lib/upkeepDb';
import { AppTextInput } from './AppTextInput';

type Props = {
  kind: 'routine' | 'upkeep';
  tabColor: string;
  /** Names already on the person's list, so a copy never doubles up. */
  heldNames: string[];
  onAdded: () => void;
};

export function StarterLists({ kind, tabColor, heldNames, onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<StarterRoutine | null>(null);
  const [name, setName] = useState('');
  const [dropped, setDropped] = useState<Set<number>>(new Set());
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  function pickRoutine(starter: StarterRoutine) {
    setPicked(starter);
    setName(freeRoutineName(starter.name, heldNames));
    setDropped(new Set());
    setDone(null);
  }

  async function copyRoutine() {
    if (!picked || saving) return;
    const steps = picked.steps.filter((unused, index) => !dropped.has(index));
    const finalName = name.trim() || picked.name;
    setSaving(true);
    const id = await createRoutine(finalName, picked.occasion);
    if (id) {
      for (const step of steps) await addRoutineStep(id, step, null, null);
    }
    setSaving(false);
    setPicked(null);
    setDone(
      id
        ? `${finalName} is in your routines with ${steps.length} ${steps.length === 1 ? 'step' : 'steps'}. Change or add to it below.`
        : 'That one could not be copied. Try a different name.',
    );
    onAdded();
  }

  async function copyUpkeep() {
    if (ticked.size === 0 || saving) return;
    setSaving(true);
    let count = 0;
    for (const group of STARTER_UPKEEP) {
      for (const item of group.items) {
        if (!ticked.has(item.key) || upkeepAlreadyHeld(item.name, heldNames)) continue;
        await upsertUpkeepItem({
          name: item.name,
          category: 'home',
          cadence: 'recurring',
          intervalMonths: item.intervalMonths,
          lastDoneOn: null,
          notes: item.notes ?? undefined,
        });
        count += 1;
      }
    }
    setSaving(false);
    setTicked(new Set());
    setDone(
      `${count} ${count === 1 ? 'item is' : 'items are'} on your upkeep list. Say when each was last done and it will work out when it is due.`,
    );
    onAdded();
  }

  if (!open) {
    return (
      <TouchableOpacity style={styles.openRow} onPress={() => setOpen(true)}>
        <Ionicons name="copy-outline" size={16} color={tabColor} />
        <Text style={[styles.openText, { color: tabColor }]}>
          {kind === 'routine' ? 'Or start from a ready-made routine' : 'Or copy from a kitchen or bathroom list'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.body}>
        {kind === 'routine'
          ? 'Pick one to see its steps. Nothing is added until you press the button under it.'
          : 'Tick the ones that apply. Nothing is added until you press the button.'}
      </Text>

      {kind === 'routine' ? (
        <>
          <View style={styles.pillRow}>
            {STARTER_ROUTINES.map((starter) => (
              <TouchableOpacity
                key={starter.key}
                style={[styles.pill, picked?.key === starter.key ? { borderColor: tabColor } : null]}
                onPress={() => pickRoutine(starter)}
              >
                <Text style={styles.pillText}>{starter.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {picked ? (
            <View style={styles.preview}>
              <Text style={styles.caption}>{picked.about}</Text>
              <Text style={styles.label}>Called</Text>
              <AppTextInput style={styles.input} value={name} onChangeText={setName} />
              {picked.steps.map((step, index) => {
                const off = dropped.has(index);
                return (
                  <TouchableOpacity
                    key={step}
                    style={styles.stepRow}
                    onPress={() => {
                      const next = new Set(dropped);
                      if (off) next.delete(index);
                      else next.add(index);
                      setDropped(next);
                    }}
                    accessibilityLabel={off ? `Put back ${step}` : `Leave out ${step}`}
                  >
                    <Ionicons name={off ? 'add-circle-outline' : 'close-circle-outline'} size={18} color={off ? colors.textMuted : tabColor} />
                    <Text style={[styles.stepText, off ? styles.stepOff : null]}>{step}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.button, { borderColor: tabColor }]}
                onPress={() => void copyRoutine()}
                disabled={saving || dropped.size === picked.steps.length}
              >
                <Text style={[styles.buttonText, { color: tabColor }]}>Make this routine</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      ) : (
        <>
          {STARTER_UPKEEP.map((group) => (
            <View key={group.key} style={styles.group}>
              <Text style={styles.label}>{group.label}</Text>
              {group.items.map((item) => {
                const held = upkeepAlreadyHeld(item.name, heldNames);
                const on = ticked.has(item.key);
                const every = item.intervalMonths === 1 ? 'every month' : item.intervalMonths === 12 ? 'every year' : `every ${item.intervalMonths} months`;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.stepRow}
                    disabled={held}
                    onPress={() => {
                      const next = new Set(ticked);
                      if (on) next.delete(item.key);
                      else next.add(item.key);
                      setTicked(next);
                    }}
                  >
                    <Ionicons
                      name={held ? 'checkmark-done-outline' : on ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={held ? colors.textMuted : tabColor}
                    />
                    <Text style={[styles.stepText, held ? styles.stepHeld : null]}>
                      {`${item.name}, ${every}${held ? ' (already on your list)' : ''}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <TouchableOpacity
            style={[styles.button, { borderColor: tabColor }, ticked.size === 0 ? styles.off : null]}
            onPress={() => void copyUpkeep()}
            disabled={saving || ticked.size === 0}
          >
            <Text style={[styles.buttonText, { color: tabColor }]}>
              {ticked.size === 0 ? 'Add the ticked ones' : `Add the ${ticked.size} ticked`}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {done ? <Text style={styles.caption}>{done}</Text> : null}
      <TouchableOpacity
        onPress={() => {
          setOpen(false);
          setPicked(null);
          setDone(null);
        }}
      >
        <Text style={[styles.openText, { color: tabColor }]}>Close the lists</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  openText: { ...typography.bodyEmphasis, ...textShadow },
  panel: { gap: 8, marginTop: 10 },
  body: { ...typography.body, ...textShadow, color: colors.textPrimary },
  caption: { ...typography.caption, ...textShadow, color: colors.textSecondary },
  label: { ...typography.label, ...textShadow, color: colors.textPrimary },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: { ...typography.caption, color: colors.textPrimary },
  preview: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  group: { gap: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  stepText: { ...typography.body, ...textShadow, color: colors.textPrimary, flex: 1 },
  stepOff: { color: colors.textMuted, textDecorationLine: 'line-through' },
  stepHeld: { color: colors.textMuted },
  button: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  off: { opacity: 0.5 },
  buttonText: { ...typography.bodyEmphasis, textShadowColor: 'transparent', textShadowRadius: 0 },
});
