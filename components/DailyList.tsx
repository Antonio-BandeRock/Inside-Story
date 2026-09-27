// My daily list, D6 of the competitive build plan (Phase 2, 2026-09-26).
// Sits at the top of Home's Today's Check-In while it is open: every symptom
// the person pinned, each with a row of five ratings from None today to Very
// severe, plus a way to pin another and to take one off. Tapping the rating
// that is already chosen clears it, and a symptom left unrated is not saved,
// since nothing was said about it. Ratings and the list itself are held by
// the Home screen; this only draws them. See lib/dailyList.ts.
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { getCheckinTagDefinition, getCheckinTagsByCategory } from '../lib/checkinTags';
import { DAILY_RATINGS } from '../lib/dailyList';
import { PopoverSelect } from './PopoverSelect';

type Props = {
  list: string[];
  ratings: Record<string, number>;
  onRate: (code: string, value: number | undefined) => void;
  onListChange: (list: string[]) => void;
  accent: string;
};

export function DailyList({ list, ratings, onRate, onListChange, accent }: Props) {
  const addable = getCheckinTagsByCategory()
    .flatMap((group) => group.tags.filter((tag) => tag.usualValence === 'negative').map((tag) => ({ tag, group: group.label })))
    .filter(({ tag }) => !list.includes(tag.code))
    .map(({ tag, group }) => ({ label: `${tag.label} (${group})`, value: tag.code }));

  return (
    <View style={styles.block}>
      <Text style={styles.heading}>My daily list</Text>
      {list.length === 0 ? (
        <Text style={styles.caption}>
          Symptoms you want to rate every day can be pinned here. None today is an answer too, and it is kept.
        </Text>
      ) : (
        list.map((code) => (
          <View key={code} style={styles.item}>
            <View style={styles.itemHead}>
              <Text style={styles.itemName}>{getCheckinTagDefinition(code)?.label ?? code}</Text>
              <TouchableOpacity
                onPress={() => {
                  onRate(code, undefined);
                  onListChange(list.filter((entry) => entry !== code));
                }}
                hitSlop={8}
              >
                <Text style={styles.caption}>Take off the list</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ratingRow}>
              {DAILY_RATINGS.map((rating) => {
                const active = ratings[code] === rating.value;
                return (
                  <TouchableOpacity
                    key={rating.value}
                    style={[styles.rating, active && { backgroundColor: accent, borderColor: accent }]}
                    onPress={() => onRate(code, active ? undefined : rating.value)}
                  >
                    <Text style={[styles.ratingText, active && styles.ratingTextActive]}>{rating.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))
      )}
      {addable.length > 0 ? (
        <PopoverSelect
          options={addable}
          selected={null}
          onSelect={(code) => onListChange([...list, code])}
          tabColor={accent}
          placeholder="Add a symptom to the list"
          searchable
          searchPlaceholder="Find a symptom"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10, marginBottom: 16 },
  heading: { ...typography.eyebrow, ...textShadow, color: colors.textMuted, fontWeight: '400' },
  caption: { ...typography.caption, ...textShadow, color: colors.textMuted },
  item: { gap: 6 },
  itemHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  itemName: { ...typography.body, ...textShadow, color: colors.textPrimary, flexShrink: 1 },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rating: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: colors.surfaceMuted,
  },
  ratingText: { ...typography.caption, ...textShadow, color: colors.textPrimary },
  ratingTextActive: { color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
});
