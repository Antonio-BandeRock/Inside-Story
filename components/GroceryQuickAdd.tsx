// Add to the Grocery List from Home, C6 of the competitive build plan
// (Phase 2, 2026-09-26). One box, typed or spoken, split into items the same
// way a Capture note is (groceryItemsFromNote in lib/captureNotes.ts), and
// added to the list being shopped from. With no list yet, a plain one is made
// by hand rather than built from the schedule, so saying "eggs" never pulls a
// week of meal ingredients in beside it.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { groceryItemsFromNote } from '../lib/captureNotes';
import { addNamesToActiveGroceryList } from '../lib/groceryDb';
import { explainNotYet } from '../lib/notYet';
import { AppTextInput } from './AppTextInput';

type Props = {
  tabColor: string;
  onOpenList: () => void;
};

export function GroceryQuickAdd({ tabColor, onOpenList }: Props) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const items = groceryItemsFromNote(text);

  async function add() {
    if (items.length === 0 || saving) return;
    setSaving(true);
    const count = await addNamesToActiveGroceryList(items);
    setSaving(false);
    setText('');
    setAdded(count === 1 ? `${items[0]} is on the list.` : `${count} things are on the list: ${items.join(', ')}.`);
  }

  return (
    <View style={styles.body}>
      <View style={styles.inputRow}>
        <AppTextInput
          onVoiceResult={(transcript) => setText(transcript)}
          micColor={tabColor}
          style={styles.input}
          value={text}
          onChangeText={(value) => {
            setText(value);
            setAdded(null);
          }}
          placeholder="eggs, milk and bread"
          onSubmitEditing={() => void add()}
          returnKeyType="done"
        />
      </View>
      {items.length > 1 ? <Text style={styles.caption}>{`Adds ${items.length}: ${items.join(', ')}`}</Text> : null}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { borderColor: tabColor }, items.length === 0 ? styles.off : null]}
          activeOpacity={0.8}
          onPress={() => {
            if (items.length === 0) {
              explainNotYet('Type what to add first, for example "eggs, milk and bread".');
              return;
            }
            void add();
          }}
          disabled={saving}
        >
          <Ionicons name="add-circle-outline" size={18} color={tabColor} />
          <Text style={[styles.buttonText, { color: tabColor }]}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { borderColor: tabColor }]} activeOpacity={0.8} onPress={onOpenList}>
          <Ionicons name="cart-outline" size={18} color={tabColor} />
          <Text style={[styles.buttonText, { color: tabColor }]}>Open the list</Text>
        </TouchableOpacity>
      </View>
      {added ? <Text style={styles.caption}>{added}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 8 },
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
  caption: { ...typography.caption, ...textShadow, color: colors.textMuted },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  off: { opacity: 0.5 },
  buttonText: { ...typography.bodyEmphasis, textShadowColor: 'transparent', textShadowRadius: 0 },
});
