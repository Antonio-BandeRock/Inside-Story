// Store Its Location, from the quick-access menu and from Where Is It.
//
// 1.0.66.9 (2026-10-10), direct request: "The Where is it needs a companion
// button. Where is it asks where something is that the app already knows the
// location because the person told the app ... We need a button for them to
// do that."
//
// 1.0.66.10, the same day, it became voice first: "It should say 'Store it's
// location' ... The microphone in the screen that opens should imply what they
// are supposed to do ... Make sure to give enough time for someone to finish
// what they need to say and they say for instance 'The bowling balls are in
// the hall closet.' ... We need to teach them this is the way to communicate
// with the app. The app then stores it appropriately and returns it when
// asked."
//
// So it opens listening, with the sentence to say written above the
// microphone, waits for a pause of a few seconds rather than the recognizer's
// own short one, and stores the moment the sentence makes sense
// (lib/whereSpeech.ts). What was stored is shown with That's Wrong beside it,
// which puts things back the way they were. A sentence with no place in it is
// shown as heard and nothing is stored. Typing is one tap away for anybody
// who would rather, and is the only way in on a computer, which has no speech
// recognizer the app can use.
//
// Not a Modal, for the same reason as AskRecordsSheet: the boxes are typed
// into with the drawn keyboard, which paints at the root. Mounted in
// app/_layout.tsx before AppKeyboard.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KEYBOARD_HEIGHT } from '../constants/appKeyboard';
import { colors } from '../constants/colors';
import { useFooterBandHeight, useHubMenuCardSpan, useMenuCardBottom } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { useVoiceDictation, type VoiceDictationErrorKind } from '../hooks/useVoiceDictation';
import { isDesktopApp } from '../lib/desktop/bridge';
import { phoneOnlyNotice } from '../lib/desktop/phoneOnly';
import { explainNotYet } from '../lib/notYet';
import { announcePlaceSaved, subscribeQuickAccess } from '../lib/quickAccess';
import { PLACE_NAME_MAX, isPlaceNameUsable, suggestPlaces } from '../lib/whereIsIt';
import { listPlaceRecords, rememberWhere, undoRememberWhere, type RememberedWhere } from '../lib/whereIsItDb';
import { parseStoreSentence } from '../lib/whereSpeech';
import { AppTextInput } from './AppTextInput';
import { ThumbRow } from './ThumbRow';

// Long enough to take a breath in the middle of a sentence.
export const SENTENCE_PAUSE_MS = 2800;

const MIC_ERRORS: Record<Exclude<VoiceDictationErrorKind, 'no-speech'>, string> = {
  permission: 'The microphone is not allowed for Lifestead. It can be turned on in the phone’s Settings, under this app.',
  unavailable: 'Speech recognition is not available on this phone right now. Type it instead.',
  other: 'Something went wrong listening. Tap the microphone to try again.',
};

export function StoreLocationSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const footerHeight = useFooterBandHeight();
  const menuBottom = useMenuCardBottom();
  const { left, width } = useHubMenuCardSpan();
  const desktop = isDesktopApp();
  const [open, setOpen] = useState(false);
  const [heard, setHeard] = useState('');
  const [notUnderstood, setNotUnderstood] = useState(false);
  const [micProblem, setMicProblem] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [typingFocused, setTypingFocused] = useState(false);
  const [what, setWhat] = useState('');
  const [place, setPlace] = useState('');
  const [knownPlaces, setKnownPlaces] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<RememberedWhere | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const openRef = useRef(false);
  openRef.current = open;

  async function store(thing: string, where: string) {
    setSaving(true);
    setFailed(null);
    try {
      const result = await rememberWhere(thing, where);
      if (result) {
        setSaved(result);
        announcePlaceSaved();
      }
    } catch (error) {
      setFailed(error instanceof Error && error.message ? error.message : 'That could not be stored.');
    } finally {
      setSaving(false);
    }
  }

  const { status, start, stop } = useVoiceDictation({
    pauseMs: SENTENCE_PAUSE_MS,
    onResult: (transcript, isFinal) => {
      if (!openRef.current) return;
      setHeard(transcript);
      if (!isFinal) return;
      const sentence = parseStoreSentence(transcript);
      if (!sentence) {
        setNotUnderstood(true);
        setWhat('');
        setPlace('');
        return;
      }
      setWhat(sentence.what);
      setPlace(sentence.place);
      void store(sentence.what, sentence.place);
    },
    onError: (kind) => {
      if (kind === 'no-speech') return;
      setMicProblem(MIC_ERRORS[kind]);
    },
  });
  const listening = status === 'listening';

  function listen() {
    if (desktop) return;
    setHeard('');
    setNotUnderstood(false);
    setMicProblem(null);
    setFailed(null);
    setSaved(null);
    void start();
  }

  function startOver(withMic: boolean) {
    setHeard('');
    setNotUnderstood(false);
    setMicProblem(null);
    setWhat('');
    setPlace('');
    setSaved(null);
    setFailed(null);
    setTyping(desktop);
    setTypingFocused(false);
    listPlaceRecords()
      .then((records) => setKnownPlaces(suggestPlaces(records, 8)))
      .catch(() => setKnownPlaces([]));
    if (withMic && !desktop) void start();
  }

  function close() {
    stop();
    setOpen(false);
  }

  useEffect(
    () =>
      subscribeQuickAccess((sheet) => {
        if (sheet !== 'storeLocation') return;
        setOpen(true);
        startOver(true);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!open) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // Above the drawn keyboard only while a box is being typed into; otherwise
  // where a hub menu sits.
  const bottom = !desktop && typingFocused ? footerHeight + KEYBOARD_HEIGHT + 8 : menuBottom;
  const maxHeight = Math.max(160, windowHeight - bottom - insets.top - 16);

  async function storeTyped() {
    if (saving) return;
    if (!what.trim()) {
      explainNotYet('Say what the thing is first, in the top box.');
      return;
    }
    if (!isPlaceNameUsable(place)) {
      explainNotYet('Say where it is, in the second box, or pick one of the places below it.');
      return;
    }
    await store(what, place);
  }

  async function thatsWrong() {
    if (!saved) return;
    await undoRememberWhere(saved);
    announcePlaceSaved();
    setSaved(null);
    if (desktop) {
      setTyping(true);
    } else {
      listen();
    }
  }

  function openWhereIsIt() {
    close();
    router.push('/where-is-it');
  }

  function showTyping() {
    stop();
    setTyping(true);
  }

  const micCaption = listening
    ? heard
      ? 'Listening. Stops a few seconds after you finish.'
      : 'Listening. Say the thing, then the place.'
    : 'Tap the microphone and say it.';

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={close} accessible={false} />
      <View style={[styles.sheet, { left, width, bottom, maxHeight }]}>
        <View style={styles.titleRow}>
          <Ionicons name="pin-outline" size={20} color={colors.textPrimary} style={textShadow} />
          <Text style={styles.title}>Store Its Location</Text>
        </View>
        {saved ? (
          <>
            <View style={styles.savedBox}>
              <Text style={styles.savedLabel}>{saved.kind === 'moved' ? 'Moved' : 'Stored'}</Text>
              <Text style={styles.savedWhat}>{saved.what}</Text>
              <Text style={styles.body}>{saved.place}</Text>
            </View>
            <Text style={styles.caption}>
              {saved.kind === 'moved'
                ? 'It was already written down, so its place has changed rather than a second one being made.'
                : 'Ask Where Is It and this is what it will say.'}
            </Text>
            <ThumbRow primary="first" style={styles.actions}>
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={close}>
                <Text style={styles.primaryText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => startOver(true)}>
                <Text style={styles.secondaryText}>Store Another</Text>
              </TouchableOpacity>
            </ThumbRow>
            <TouchableOpacity style={styles.linkButton} activeOpacity={0.8} onPress={() => void thatsWrong()}>
              <Text style={styles.linkText}>That’s Wrong, Take It Back</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <View style={styles.exampleBox}>
                <Text style={styles.caption}>Say it like this:</Text>
                <Text style={styles.example}>“The bowling balls are in the hall closet.”</Text>
                <Text style={styles.example}>“John’s fishing poles are in the garage.”</Text>
              </View>
              {!desktop ? (
                <View style={styles.micArea}>
                  <TouchableOpacity
                    style={[styles.mic, listening ? styles.micListening : null]}
                    activeOpacity={0.85}
                    onPress={listening ? stop : listen}
                    accessibilityRole="button"
                    accessibilityLabel={listening ? 'Stop listening' : 'Say where something is'}
                  >
                    <Ionicons name={listening ? 'mic' : 'mic-outline'} size={34} color={listening ? colors.textOnPrimary : colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.caption}>{micCaption}</Text>
                </View>
              ) : (
                <Text style={styles.caption}>{phoneOnlyNotice('voice').message}</Text>
              )}
              {heard ? (
                <View style={styles.heardBox}>
                  <Text style={styles.heardLabel}>Heard</Text>
                  <Text style={styles.body}>{heard}</Text>
                </View>
              ) : null}
              {notUnderstood ? (
                <Text style={styles.problem}>
                  That had no place in it, so nothing was stored. Say the thing, then where it is, the way the example
                  does, or type it below.
                </Text>
              ) : null}
              {micProblem ? <Text style={styles.problem}>{micProblem}</Text> : null}
              {saving ? <Text style={styles.caption}>Storing…</Text> : null}
              {failed ? <Text style={styles.problem}>{failed}</Text> : null}
              {typing || notUnderstood ? (
                <>
                  <AppTextInput
                    style={styles.input}
                    placeholder="What is it? (bowling balls)"
                    placeholderTextColor={colors.textMuted}
                    value={what}
                    onChangeText={setWhat}
                    onFocus={() => setTypingFocused(true)}
                    disableKeyboardLift
                  />
                  <AppTextInput
                    style={styles.input}
                    placeholder="Where is it? (hall closet)"
                    placeholderTextColor={colors.textMuted}
                    value={place}
                    onChangeText={setPlace}
                    onFocus={() => setTypingFocused(true)}
                    maxLength={PLACE_NAME_MAX}
                    returnKeyType="done"
                    onSubmitEditing={() => void storeTyped()}
                    disableKeyboardLift
                  />
                  {knownPlaces.length > 0 ? (
                    <View style={styles.chips}>
                      {knownPlaces.map((known) => (
                        <TouchableOpacity key={known} style={styles.chip} activeOpacity={0.8} onPress={() => setPlace(known)}>
                          <Text style={styles.chipText}>{known}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : null}
            </ScrollView>
            {typing || notUnderstood ? (
              <ThumbRow primary="last" style={styles.actions}>
                <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={openWhereIsIt}>
                  <Text style={styles.secondaryText}>Where Is It</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} disabled={saving} onPress={() => void storeTyped()}>
                  <Text style={styles.primaryText}>Store</Text>
                </TouchableOpacity>
              </ThumbRow>
            ) : (
              <ThumbRow primary="last" style={styles.actions}>
                <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={close}>
                  <Text style={styles.secondaryText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={showTyping}>
                  <Text style={styles.secondaryText}>Type It Instead</Text>
                </TouchableOpacity>
              </ThumbRow>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute',
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...typography.bodyEmphasis, fontSize: 16, fontWeight: '400', color: colors.textPrimary, ...textShadow },
  scroll: { flexGrow: 0 },
  scrollContent: { gap: 10 },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  body: { ...typography.body, color: colors.textPrimary, ...textShadow },
  problem: { ...typography.caption, color: colors.accent, ...textShadow },
  exampleBox: {
    gap: 2,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  example: { ...typography.body, color: colors.textPrimary, ...textShadow },
  micArea: { alignItems: 'center', gap: 6 },
  mic: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  micListening: { backgroundColor: colors.primary },
  heardBox: { gap: 2, padding: 10, borderRadius: 10, backgroundColor: colors.surfaceMuted },
  heardLabel: { ...typography.caption, color: colors.textMuted, ...textShadow },
  savedBox: {
    gap: 2,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  savedLabel: { ...typography.caption, color: colors.textMuted, ...textShadow },
  savedWhat: { ...typography.bodyEmphasis, fontWeight: '400', color: colors.textPrimary, ...textShadow },
  input: {
    ...typography.body,
    ...textShadow,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  actions: { flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
  primaryText: {
    ...typography.bodyEmphasis,
    color: colors.textOnPrimary,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryText: { ...typography.bodyEmphasis, color: colors.textPrimary, fontWeight: '400', ...textShadow },
  linkButton: { alignItems: 'center', paddingVertical: 6 },
  linkText: { ...typography.caption, color: colors.accent, ...textShadow },
});
