// The parts of life Your Story follows, 2026-09-24 (lib/yourStory.ts).
//
// A closed list of nine, and deliberately so: this is the one list in the
// app with no "add one of your own", because each part of life chosen here
// switches on a section of Your Story that somebody has to have written.
// A tenth typed in would switch on nothing. Choosing never hides anything
// anywhere else in the app, and the note under the question says so.
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { ALL_BEATS, BEAT_CAPTIONS, BEAT_LABELS, BEATS_NOTE, BEATS_QUESTION, type BeatKey } from '../lib/yourStory';
import { addBeat, listBeats, removeBeat } from '../lib/yourStoryDb';

type Props = {
  // Called after every change, so whatever shows Your Story can rebuild.
  onChanged?: (beats: BeatKey[]) => void;
  // A card that already carries the question in its heading can leave it off.
  showQuestion?: boolean;
};

export function BeatPicker({ onChanged, showQuestion = true }: Props) {
  const [chosen, setChosen] = useState<BeatKey[] | null>(null);

  useEffect(() => {
    let live = true;
    void listBeats().then((beats) => {
      if (live) setChosen(beats);
    });
    return () => {
      live = false;
    };
  }, []);

  const toggle = useCallback(
    async (key: BeatKey) => {
      const current = chosen ?? [];
      const on = current.includes(key);
      if (on) await removeBeat(key);
      else await addBeat(key);
      const next = await listBeats();
      setChosen(next);
      onChanged?.(next);
    },
    [chosen, onChanged],
  );

  return (
    <View style={styles.wrap}>
      {showQuestion ? <Text style={styles.question}>{BEATS_QUESTION}</Text> : null}
      <View style={styles.list}>
        {ALL_BEATS.map((key) => {
          const on = chosen?.includes(key) ?? false;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.row, on && styles.rowOn]}
              onPress={() => void toggle(key)}
              disabled={chosen == null}
              activeOpacity={0.75}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${BEAT_LABELS[key]}, ${BEAT_CAPTIONS[key]}`}
            >
              <Ionicons
                name={on ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={on ? colors.primary : colors.textMuted}
                style={textShadow}
              />
              <View style={styles.rowText}>
                <Text style={styles.label}>{BEAT_LABELS[key]}</Text>
                <Text style={styles.caption}>{BEAT_CAPTIONS[key]}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.note}>{BEATS_NOTE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Always placed inside a Your Story item, which sits on colors.surface;
  // the same colour here keeps the question and note on a surface of their own.
  wrap: { gap: 10, backgroundColor: colors.surface },
  question: { ...typography.body, color: colors.textPrimary, ...textShadow },
  list: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  rowOn: { borderColor: colors.primary },
  rowText: { flex: 1, gap: 1 },
  label: { ...typography.body, color: colors.textPrimary, ...textShadow },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  note: { ...typography.caption, color: colors.textMuted, ...textShadow },
});
