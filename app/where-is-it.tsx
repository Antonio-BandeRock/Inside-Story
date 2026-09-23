// Where did I put it, 2026-09-23. Phase 1 of the cross-app push, and the one
// piece of it that is not a chart.
//
// The question gets asked out loud in every house several times a week, and
// this app already holds most of the answer: something was bought, something
// was harvested, something was made. What was missing was anywhere to write
// down WHERE, and anywhere to ask.
//
// Deliberately one screen rather than a lens. A search two taps deep is a
// search nobody uses, which was the whole objection to the feature when it was
// first written down. So it is one top-level row on Home, straight to here,
// with the field already focused.
//
// THE RULE THE WHOLE SCREEN OBEYS, set out in lib/whereIsIt.ts: a stale
// location is worse than no location. Somebody sent to a cupboard that turns
// out to be empty has been left worse off than somebody told nothing. So every
// answer says how old it is, anything old enough to have gone wrong says so in
// words, and confirming or correcting an answer is one tap on the answer
// itself.
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import {
  PLACE_NAME_MAX,
  describeNoResults,
  describePlaceAge,
  isPlaceNameUsable,
  placeConfidence,
  searchPlaces,
  stalePrompt,
  suggestPlaces,
  type PlaceRecord,
  type PlaceRecordKind,
} from '../lib/whereIsIt';
import { listPlaceRecords } from '../lib/whereIsItDb';
import { confirmKitchenItemLocation, setKitchenItemLocation } from '../lib/kitchenDb';

// Where the answer came from, so a result carries its source at a glance: a
// garden bed reads differently from a cupboard, and a sentence somebody spoke
// reads differently again.
const KIND_ICONS: Record<PlaceRecordKind, keyof typeof Ionicons.glyphMap> = {
  kitchen: 'cube-outline',
  note: 'chatbubble-ellipses-outline',
  garden: 'leaf-outline',
};

const KIND_COLORS: Record<PlaceRecordKind, string> = {
  kitchen: colors.tabFood,
  note: colors.primary,
  garden: colors.tabGarden,
};

export default function WhereIsItScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<PlaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  // The one row whose place is being rewritten. One at a time: a field under
  // every result at once would bury the answers under the editing.
  const [movingId, setMovingId] = useState<string | null>(null);
  const [movingTo, setMovingTo] = useState('');

  const refresh = useCallback(async () => {
    const rows = await listPlaceRecords();
    setRecords(rows);
    setLoading(false);
  }, []);

  // Re-read on every arrival rather than once: somebody comes here straight
  // after putting something away, and an answer a minute out of date is the
  // one failure this screen cannot afford.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function confirmStillThere(record: PlaceRecord) {
    await confirmKitchenItemLocation(record.id.slice('kitchen:'.length));
    await refresh();
  }

  async function saveMove(record: PlaceRecord) {
    await setKitchenItemLocation(record.id.slice('kitchen:'.length), movingTo);
    setMovingId(null);
    setMovingTo('');
    await refresh();
  }

  const today = new Date().toISOString().slice(0, 10);
  const hits = searchPlaces(records, query);
  const chips = suggestPlaces(records);
  const nothingToSay = describeNoResults(query, records.length);

  function renderHit(record: PlaceRecord) {
    const confidence = placeConfidence(record.placedOn, today);
    const warning = stalePrompt(confidence);
    const age = describePlaceAge(record.placedOn, today);
    const moving = movingId === record.id;
    const tint = KIND_COLORS[record.kind];
    return (
      <View key={record.id} style={[styles.hitCard, { borderColor: tint }]}>
        <View style={styles.hitHeadRow}>
          <Ionicons name={KIND_ICONS[record.kind]} size={16} color={tint} />
          <Text style={styles.hitWhat}>{record.what}</Text>
        </View>
        <Text style={styles.hitPlace}>{record.place}</Text>
        <View style={styles.hitMetaRow}>
          {age ? <Text style={styles.hitMeta}>Written down {age}</Text> : null}
          {record.detail ? <Text style={styles.hitMeta}>{record.detail}</Text> : null}
        </View>
        {warning ? <Text style={styles.hitWarning}>{warning}</Text> : null}
        {record.editable && !moving ? (
          <View style={styles.hitActionRow}>
            <TouchableOpacity style={styles.hitAction} onPress={() => void confirmStillThere(record)}>
              <Ionicons name="checkmark-circle-outline" size={15} color={colors.primary} />
              <Text style={styles.hitActionText}>Still there</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.hitAction}
              onPress={() => {
                setMovingId(record.id);
                setMovingTo(record.place);
              }}
            >
              <Ionicons name="swap-horizontal-outline" size={15} color={colors.accent} />
              <Text style={[styles.hitActionText, { color: colors.accent }]}>I moved it</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {moving ? (
          <View style={styles.moveBlock}>
            <AppTextInput
              style={styles.moveField}
              value={movingTo}
              onChangeText={setMovingTo}
              placeholder="Where is it now?"
              placeholderTextColor={colors.textMuted}
              maxLength={PLACE_NAME_MAX}
              autoFocus
            />
            {chips.length > 0 ? (
              <View style={styles.chipWrap}>
                {chips.map((place) => (
                  <TouchableOpacity key={place} style={styles.chip} onPress={() => setMovingTo(place)}>
                    <Text style={styles.chipText}>{place}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <View style={styles.hitActionRow}>
              <TouchableOpacity style={styles.hitAction} onPress={() => void saveMove(record)}>
                <Ionicons name="checkmark" size={15} color={colors.primary} />
                <Text style={styles.hitActionText}>
                  {isPlaceNameUsable(movingTo) ? 'Keep this place' : 'Forget where it was'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.hitAction}
                onPress={() => {
                  setMovingId(null);
                  setMovingTo('');
                }}
              >
                <Ionicons name="close" size={15} color={colors.textMuted} />
                <Text style={[styles.hitActionText, { color: colors.textMuted }]}>Leave it</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.moveNote}>
              Emptying the box clears the place instead of keeping the old one, which is the right answer when you no
              longer know.
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Where Is It' }} />
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.leadBox}>
          <Text style={styles.lead}>
            Anything with a place written down: kitchen and household items, notes you sorted to Where it is, and what
            is growing in the garden.
          </Text>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <AppTextInput
              style={styles.searchField}
              value={query}
              onChangeText={setQuery}
              placeholder="Batteries"
              placeholderTextColor={colors.textMuted}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear the search">
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
            <VoiceInputButton
              size={22}
              color={colors.accent}
              onResult={(transcript) => setQuery(transcript)}
            />
          </View>
          {chips.length > 0 && movingId === null ? (
            <View style={styles.chipWrap}>
              {chips.map((place) => (
                <TouchableOpacity key={place} style={styles.chip} onPress={() => setQuery(place)}>
                  <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.chipText}>{place}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Looking…</Text>
          </View>
        ) : null}

        {!loading && hits.length === 0 && nothingToSay ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{nothingToSay}</Text>
          </View>
        ) : null}

        {hits.map((hit) => renderHit(hit.record))}

        {!loading && records.length > 0 ? (
          <View style={styles.leadBox}>
            <Text style={styles.footnote}>
              Nothing here watches a cupboard. Every answer is what somebody wrote down, and how long ago they wrote
              it, so an old one is worth checking before you count on it.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  leadBox: { ...homeBandStyle, borderColor: colors.primary, padding: HOME_BAND_CONTENT_PADDING },
  lead: { ...typography.body, color: colors.textSecondary, ...textShadow },
  footnote: { ...typography.caption, color: colors.textMuted, ...textShadow },
  searchCard: {
    ...homeBandStyle,
    borderColor: colors.primary,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 10,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchField: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    ...textShadow,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  chipText: { ...typography.caption, color: colors.textSecondary },
  emptyCard: { ...homeBandStyle, borderColor: colors.primary, padding: HOME_BAND_CONTENT_PADDING },
  emptyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  hitCard: { ...homeBandStyle, padding: HOME_BAND_CONTENT_PADDING, gap: 6 },
  hitHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hitWhat: { ...typography.bodyEmphasis, color: colors.textPrimary, flex: 1, ...textShadow },
  hitPlace: { ...typography.body, color: colors.textPrimary, ...textShadow },
  hitMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  hitMeta: { ...typography.caption, color: colors.textMuted, ...textShadow },
  hitWarning: { ...typography.caption, color: colors.statusYellowStandalone, ...textShadow },
  hitActionRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginTop: 2 },
  hitAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hitActionText: { ...typography.caption, color: colors.primary, ...textShadow },
  moveBlock: { gap: 8, marginTop: 2 },
  moveField: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    ...textShadow,
  },
  moveNote: { ...typography.caption, color: colors.textMuted, ...textShadow },
});
