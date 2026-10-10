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
//
// 1.0.66.10 (2026-10-10), voice first, by direct instruction: "the same will
// be for where is it 'Where are the bowling balls?' or 'Where are the fishing
// poles?' and the app returns the location ... If there are maybe multiple
// things with a similar name ... the app should return a list of the items
// that match so the correct one can be chosen." Opened from the quick-access
// menu it starts listening at once, with the question to ask written above
// the microphone. The answer is shown and read aloud; several matches are
// never chosen between, the person picks from the list below.
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
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
import { openQuickAccessSheet, subscribePlaceSaved } from '../lib/quickAccess';
import { confirmKitchenItemLocation, setKitchenItemLocation } from '../lib/kitchenDb';
import { RecordPhotos } from '../components/RecordPhotos';
import { usePlayfulWording } from '../hooks/usePlayfulWording';
import { useVoiceDictation } from '../hooks/useVoiceDictation';
import { isDesktopApp } from '../lib/desktop/bridge';
import { describeSpokenAnswer, parseWhereQuestion } from '../lib/whereSpeech';
import { SENTENCE_PAUSE_MS } from '../components/StoreLocationSheet';

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
  const playful = usePlayfulWording();
  // q comes from Ask Your Records (C22): the thing asked about is
  // already in the box.
  // listen comes from the quick-access menu: the microphone starts at once.
  const { q, listen } = useLocalSearchParams<{ q?: string; listen?: string }>();
  const desktop = isDesktopApp();
  const listenOnArrival = listen === '1' && !desktop;
  const [query, setQuery] = useState(typeof q === 'string' ? q : '');
  const [records, setRecords] = useState<PlaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  // The one row whose place is being rewritten. One at a time: a field under
  // every result at once would bury the answers under the editing.
  const [movingId, setMovingId] = useState<string | null>(null);
  const [movingTo, setMovingTo] = useState('');
  const [heard, setHeard] = useState('');
  const [spokenAnswer, setSpokenAnswer] = useState<string | null>(null);
  const [micProblem, setMicProblem] = useState<string | null>(null);
  const recordsRef = useRef<PlaceRecord[]>([]);
  recordsRef.current = records;

  const { status: micStatus, start: startListening, stop: stopListening } = useVoiceDictation({
    pauseMs: SENTENCE_PAUSE_MS,
    onResult: (transcript, isFinal) => {
      setHeard(transcript);
      const asked = parseWhereQuestion(transcript);
      setQuery(asked);
      if (!isFinal) return;
      const today = new Date().toISOString().slice(0, 10);
      const matches = searchPlaces(recordsRef.current, asked).map((hit) => ({
        what: hit.record.what,
        place: hit.record.place,
        age: describePlaceAge(hit.record.placedOn, today),
      }));
      const answer = describeSpokenAnswer(asked, asked ? matches : []);
      setSpokenAnswer(answer);
      Speech.stop();
      Speech.speak(answer);
    },
    onError: (kind) => {
      if (kind === 'no-speech') return;
      setMicProblem(
        kind === 'permission'
          ? 'The microphone is not allowed for Lifestead. It can be turned on in the phone’s Settings, under this app.'
          : 'Listening did not work just now. Tap the microphone to try again, or type in the box.',
      );
    },
  });
  const micListening = micStatus === 'listening';

  function askAloud() {
    Speech.stop();
    setHeard('');
    setSpokenAnswer(null);
    setMicProblem(null);
    void startListening();
  }

  useEffect(() => {
    if (listenOnArrival) askAloud();
    return () => {
      stopListening();
      Speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  useEffect(() => subscribePlaceSaved(() => void refresh()), [refresh]);

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
  const nothingToSay = describeNoResults(query, records.length, playful);

  // A photo of where something was left is often the quickest answer, and
  // it is the same photo the record shows wherever else it is read: a
  // kitchen row is an item, a planting a planting, a note a capture note.
  function photoOwnerFor(record: PlaceRecord): { ownerKind: string; ownerId: string } {
    const rowId = record.id.slice(record.id.indexOf(':') + 1);
    if (record.kind === 'kitchen') return { ownerKind: 'item', ownerId: rowId };
    if (record.kind === 'garden') return { ownerKind: 'planting', ownerId: rowId };
    return { ownerKind: 'capture_note', ownerId: rowId };
  }

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
        <RecordPhotos {...photoOwnerFor(record)} tabColor={tint} title={record.what} />
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
          <TouchableOpacity
            style={styles.storeLocationButton}
            activeOpacity={0.85}
            onPress={() => openQuickAccessSheet('storeLocation')}
            accessibilityRole="button"
          >
            <Ionicons name="pin-outline" size={16} color={colors.textOnPrimary} />
            <Text style={styles.storeLocationText}>Store Its Location</Text>
          </TouchableOpacity>
        </View>

        {!desktop ? (
          <View style={styles.askCard}>
            <Text style={styles.lead}>Ask it like this:</Text>
            <Text style={styles.askExample}>“Where are the fishing poles?”</Text>
            <View style={styles.askMicRow}>
              <TouchableOpacity
                style={[styles.askMic, micListening ? styles.askMicListening : null]}
                activeOpacity={0.85}
                onPress={micListening ? stopListening : askAloud}
                accessibilityRole="button"
                accessibilityLabel={micListening ? 'Stop listening' : 'Ask where something is'}
              >
                <Ionicons
                  name={micListening ? 'mic' : 'mic-outline'}
                  size={30}
                  color={micListening ? colors.textOnPrimary : colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={[styles.footnote, styles.askMicCaption]}>
                {micListening
                  ? 'Listening. Stops a few seconds after you finish.'
                  : 'Tap the microphone and ask.'}
              </Text>
            </View>
            {heard ? <Text style={styles.footnote}>Heard: {heard}</Text> : null}
            {micProblem ? <Text style={styles.hitWarning}>{micProblem}</Text> : null}
            {spokenAnswer ? <Text style={styles.askAnswer}>{spokenAnswer}</Text> : null}
          </View>
        ) : null}

        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <AppTextInput
              style={styles.searchField}
              voiceJoin="replace"
              micColor={colors.accent}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setSpokenAnswer(null);
              }}
              placeholder="Batteries"
              placeholderTextColor={colors.textMuted}
              autoFocus={!listenOnArrival}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear the search">
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
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
  leadBox: { ...homeBandStyle, borderColor: colors.primary, padding: HOME_BAND_CONTENT_PADDING, gap: 10 },
  // Where Is It answers only from what was told to it, so the way to tell it
  // sits right under the sentence saying what it reads (1.0.66.9).
  storeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  storeLocationText: {
    ...typography.bodyEmphasis,
    fontWeight: '400',
    color: colors.textOnPrimary,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  lead: { ...typography.body, color: colors.textSecondary, ...textShadow },
  askCard: { ...homeBandStyle, borderColor: colors.primary, padding: HOME_BAND_CONTENT_PADDING, gap: 6 },
  askExample: { ...typography.body, color: colors.textPrimary, ...textShadow },
  askMicRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  askMic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  askMicListening: { backgroundColor: colors.primary },
  askMicCaption: { flex: 1 },
  askAnswer: { ...typography.bodyEmphasis, fontWeight: '400', color: colors.textPrimary, marginTop: 4, ...textShadow },
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
