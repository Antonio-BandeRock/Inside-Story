// The quick voice note, 1.0.61.14 (2026-10-05). Direct request: "a quick
// access button for capturing a voice record note that gets transcripted so
// they can act on it later in the app, placing it where it would need to go."
//
// Opened from the quick-access menu on the thumb side
// (components/QuickAccessButton.tsx) since 1.0.66.6, when its own edge tab
// joined that menu. Choosing Voice Note starts listening straight away over
// whatever screen is open; the words appear as they are heard; when speech
// stops the note is saved to the Capture inbox as a spoken note with nothing
// more to press. Sorting stays the inbox's rule: nothing is put anywhere by
// itself. Where lib/captureSuggest.ts has a good guess, the sheet offers it
// as one tap, and Open Capture is there for anything more.
//
// Saving the moment speech stops is deliberate. The point is getting a thought
// out of a head in the few seconds before it is gone, and a Save button is one
// more thing to remember. Nothing is lost by it: a note saved by mistake is
// deleted in the inbox like any other.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFooterBandHeight } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { useVoiceDictation, type VoiceDictationErrorKind } from '../hooks/useVoiceDictation';
import { createCaptureNote, setCaptureNoteDestination } from '../lib/captureNotesDb';
import { suggestDestinations, suggestionLine, type CaptureSuggestion } from '../lib/captureSuggest';
import { loadSuggestModel } from '../lib/captureSuggestDb';
import { announcePhoneOnly } from '../lib/desktop/phoneOnly';
import { useNavigationHand } from '../lib/navigationHand';
import { explainNotYet } from '../lib/notYet';
import { subscribeQuickAccess } from '../lib/quickAccess';
import { useInfoAlert } from './InfoAlert';
import { ThumbRow } from './ThumbRow';

const GAP_ABOVE_FOOTER = 8;

type Stage =
  | { kind: 'listening' }
  | { kind: 'saving' }
  | { kind: 'saved'; id: string; text: string; suggestions: CaptureSuggestion[]; placed: string | null }
  | { kind: 'nothing' }
  | { kind: 'failed'; message: string };

const ERROR_WORDS: Record<Exclude<VoiceDictationErrorKind, 'no-speech'>, string> = {
  permission: 'The microphone is not allowed for this app. It can be turned on in the phone settings, under Apps.',
  unavailable: 'Speech recognition is not available on this phone right now.',
  other: 'Something went wrong while listening. Try again.',
};

export function QuickCaptureSheet() {
  const hand = useNavigationHand();
  const footerHeight = useFooterBandHeight();
  const router = useRouter();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>({ kind: 'listening' });
  const [heard, setHeard] = useState('');
  const savedOnce = useRef(false);
  const bottom = footerHeight + GAP_ABOVE_FOOTER;

  async function save(text: string) {
    if (savedOnce.current) return;
    savedOnce.current = true;
    setStage({ kind: 'saving' });
    try {
      const id = await createCaptureNote(text, 'spoken');
      if (!id) {
        setStage({ kind: 'nothing' });
        return;
      }
      let suggestions: CaptureSuggestion[] = [];
      try {
        suggestions = suggestDestinations(text, await loadSuggestModel());
      } catch {
        // A guess is a courtesy; the note is saved either way.
      }
      setStage({ kind: 'saved', id, text, suggestions, placed: null });
    } catch (error) {
      savedOnce.current = false;
      setStage({ kind: 'failed', message: error instanceof Error && error.message ? error.message : 'The note could not be saved.' });
    }
  }

  const { status, start, stop } = useVoiceDictation({
    onResult: (transcript, isFinal) => {
      setHeard(transcript);
      if (isFinal) {
        const text = transcript.trim();
        if (text) void save(text);
        else setStage({ kind: 'nothing' });
      }
    },
    onError: (kind) => {
      if (kind === 'no-speech') {
        setStage({ kind: 'nothing' });
        return;
      }
      setStage({ kind: 'failed', message: ERROR_WORDS[kind] });
    },
  });

  function begin() {
    savedOnce.current = false;
    setHeard('');
    setStage({ kind: 'listening' });
    void start();
  }

  function openSheet() {
    if (announcePhoneOnly(showInfoAlert, 'voice')) return;
    setOpen(true);
    begin();
  }

  function close() {
    if (status === 'listening') stop();
    setOpen(false);
  }

  // Stopping by hand keeps what was heard: the recognizer's last partial is
  // saved, since pressing Done means "that is the note".
  function finishNow() {
    const text = heard.trim();
    if (!text) {
      explainNotYet('Nothing has been heard yet. Say the note, or press Cancel.');
      return;
    }
    if (status === 'listening') stop();
    void save(text);
  }

  async function place(suggestion: CaptureSuggestion) {
    if (stage.kind !== 'saved') return;
    try {
      await setCaptureNoteDestination(stage.id, suggestion.key);
      setStage({ ...stage, placed: suggestion.label });
    } catch (error) {
      setStage({ kind: 'failed', message: error instanceof Error && error.message ? error.message : 'The note could not be moved.' });
    }
  }

  function openInbox() {
    close();
    router.push('/capture');
  }

  // The listener is subscribed once, so it reaches the latest openSheet
  // through a ref rather than the one from the first render.
  const openSheetRef = useRef(openSheet);
  openSheetRef.current = openSheet;
  useEffect(
    () =>
      subscribeQuickAccess((sheet) => {
        if (sheet === 'voiceNote') openSheetRef.current();
      }),
    [],
  );

  const sheetSide = hand === 'right' ? { right: 8 } : { left: 8 };

  return (
    <>
      <Modal visible={open} transparent animationType="none" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessible={false}>
          <Pressable style={[styles.sheet, { bottom }, sheetSide]} onPress={() => undefined} accessible={false}>
            {stage.kind === 'listening' ? (
              <>
                <View style={styles.titleRow}>
                  <Ionicons name="mic" size={18} color={colors.primary} />
                  <Text style={styles.title}>{status === 'listening' ? 'Listening' : 'Starting the microphone'}</Text>
                </View>
                <Text style={heard ? styles.heard : styles.hint}>
                  {heard || 'Say the note. It is saved to Capture as soon as you stop talking.'}
                </Text>
                <ThumbRow primary="last" style={styles.actions}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={close}>
                    <Text style={styles.secondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={finishNow}>
                    <Text style={styles.primaryText}>Done</Text>
                  </TouchableOpacity>
                </ThumbRow>
              </>
            ) : null}
            {stage.kind === 'saving' ? <Text style={styles.hint}>Saving…</Text> : null}
            {stage.kind === 'saved' ? (
              <>
                <View style={styles.titleRow}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={styles.title}>{stage.placed ? `Saved under ${stage.placed}` : 'Saved to Capture'}</Text>
                </View>
                <Text style={styles.heard}>{stage.text}</Text>
                {!stage.placed
                  ? stage.suggestions.map((suggestion) => (
                      <TouchableOpacity key={suggestion.key} style={styles.suggestion} onPress={() => void place(suggestion)}>
                        <Ionicons name="arrow-forward" size={16} color={colors.textPrimary} />
                        <Text style={styles.suggestionText}>{suggestionLine(suggestion)}</Text>
                      </TouchableOpacity>
                    ))
                  : null}
                {!stage.placed && stage.suggestions.length === 0 ? (
                  <Text style={styles.hint}>It is waiting in Capture to be sorted whenever suits.</Text>
                ) : null}
                <ThumbRow primary="first" style={styles.actions}>
                  <TouchableOpacity style={styles.primaryButton} onPress={close}>
                    <Text style={styles.primaryText}>Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={openInbox}>
                    <Text style={styles.secondaryText}>Open Capture</Text>
                  </TouchableOpacity>
                </ThumbRow>
              </>
            ) : null}
            {stage.kind === 'nothing' || stage.kind === 'failed' ? (
              <>
                <Text style={styles.title}>{stage.kind === 'nothing' ? 'Nothing was heard' : 'Not saved'}</Text>
                <Text style={styles.hint}>
                  {stage.kind === 'nothing' ? 'No words came through, so nothing was saved.' : stage.message}
                </Text>
                <ThumbRow primary="first" style={styles.actions}>
                  <TouchableOpacity style={styles.primaryButton} onPress={begin}>
                    <Text style={styles.primaryText}>Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={close}>
                    <Text style={styles.secondaryText}>Close</Text>
                  </TouchableOpacity>
                </ThumbRow>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
      {infoAlertElement}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute',
    left: 8,
    right: 8,
    padding: 14,
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...typography.bodyEmphasis, color: colors.textPrimary, fontWeight: '400', ...textShadow },
  heard: { ...typography.body, color: colors.textPrimary, ...textShadow },
  hint: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  suggestionText: { ...typography.caption, color: colors.textPrimary, flexShrink: 1, ...textShadow },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, backgroundColor: colors.primary },
  primaryText: { ...typography.bodyEmphasis, color: colors.textOnPrimary, fontWeight: '400' },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryText: { ...typography.bodyEmphasis, color: colors.textPrimary, fontWeight: '400', ...textShadow },
});
