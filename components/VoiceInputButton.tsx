// A real, reusable microphone button, built 2026-08-16 -- one shared
// component embedded next to every real search box in the app, and next
// to every genuine free-text notes field, rather than each screen wiring
// up its own copy of expo-speech-recognition. See
// hooks/useVoiceDictation.ts for the actual native wrapper this sits on.
//
// Two real, distinct usage shapes, both going through the same one
// onResult callback -- the caller decides which one it needs, this
// component doesn't guess:
//   - A search box wants every result (partial included) to replace its
//     query text live, the same "search as you speak" feel a phone's own
//     voice search already has -- call onResult with every (transcript,
//     isFinal) pair and just set your query state to transcript each
//     time.
//   - A notes/dictation field wants the FINAL transcript only, run
//     through lib/voiceCommandParsing.ts's real command parser and
//     appended to whatever's already there -- ignore isFinal === false
//     calls entirely and only act once isFinal is true.
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { useVoiceDictation, type VoiceDictationErrorKind } from '../hooks/useVoiceDictation';
import { useInfoAlert } from './InfoAlert';

export type VoiceInputButtonProps = {
  onResult: (transcript: string, isFinal: boolean) => void;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

const ERROR_COPY: Record<Exclude<VoiceDictationErrorKind, 'no-speech'>, { title: string; message: string }> = {
  permission: {
    title: 'Microphone access needed',
    message:
      "Inside Story needs microphone and speech recognition access to use voice input. You can turn this on in your device's own Settings, under this app's permissions.",
  },
  unavailable: {
    title: 'Voice input not available',
    message: "Speech recognition isn't available on this device right now.",
  },
  other: {
    title: 'Voice input had a problem',
    message: 'Something went wrong listening for that. Give it another try.',
  },
};

export function VoiceInputButton({ onResult, size = 20, color = colors.textMuted, style }: VoiceInputButtonProps) {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const { status, start, stop } = useVoiceDictation({
    onResult,
    onError: (kind) => {
      // A real, common, non-error case -- nothing was picked up in time.
      // Silently returning to idle (no popup) matches how a phone's own
      // voice search already handles this, rather than interrupting with
      // a message for something this routine.
      if (kind === 'no-speech') return;
      const copy = ERROR_COPY[kind];
      showInfoAlert(copy.title, copy.message);
    },
  });

  const listening = status === 'listening';

  return (
    <>
      <TouchableOpacity
        onPress={listening ? stop : start}
        style={[styles.button, listening ? styles.buttonListening : null, style]}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={listening ? 'Stop listening' : 'Search or dictate by speaking'}
      >
        <Ionicons name={listening ? 'mic' : 'mic-outline'} size={size} color={listening ? colors.background : color} />
      </TouchableOpacity>
      {infoAlertElement}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 6,
    borderRadius: 999,
  },
  // A plain, instant color swap while listening -- deliberately no pulse
  // or entrance animation here, matching AppActionSheet's own established
  // caution around animation-plus-native-portal timing on Android (see
  // that component's own header comment) -- a real, known risk class in
  // this app's history, not worth reintroducing for a cosmetic touch.
  buttonListening: {
    backgroundColor: colors.primary,
  },
});
