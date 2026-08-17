// A real, shared wrapper around expo-speech-recognition, built 2026-08-16
// alongside the whole voice-input feature. Every mic button in this app
// (search boxes, dictated notes) goes through this one hook rather than
// each screen touching the native module directly -- see
// components/VoiceInputButton.tsx for the actual UI that calls this.
//
// A real, non-obvious correctness detail worth keeping in mind: the
// native speech-recognition module only ever supports one active
// listening session at a time, and useSpeechRecognitionEvent subscribes
// to that SAME global native event stream regardless of which component
// calls it -- there's no per-instance scoping on the native side. If two
// of these hooks were ever mounted and "listening" at once (which can't
// actually happen, since starting a second session while one is already
// active isn't a real supported state), a naive implementation could let
// one component's callbacks fire for a session another component
// started. isActiveRef below is what actually guards against that: every
// event handler checks it before calling the caller's own callbacks, so
// a hook instance that never called start() (or already stopped) simply
// stays silent no matter what the global native stream reports.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

export type VoiceDictationStatus = 'idle' | 'listening';

export type VoiceDictationErrorKind = 'permission' | 'no-speech' | 'unavailable' | 'other';

export type UseVoiceDictationOptions = {
  // Called on every recognized result -- both partial (isFinal: false,
  // only when interimResults is left at its default true) and the one
  // final result that ends the session. Callers decide what "partial"
  // vs. "final" should actually do (see VoiceInputButton's own two real
  // modes).
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (kind: VoiceDictationErrorKind, message: string) => void;
  // [Default: "en-US"] Passed straight through to the recognizer.
  lang?: string;
};

export type UseVoiceDictationResult = {
  status: VoiceDictationStatus;
  start: () => Promise<void>;
  stop: () => void;
};

export function useVoiceDictation({ onResult, onError, lang = 'en-US' }: UseVoiceDictationOptions): UseVoiceDictationResult {
  const [status, setStatus] = useState<VoiceDictationStatus>('idle');
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const isActiveRef = useRef(false);

  useSpeechRecognitionEvent('result', (event) => {
    if (!isActiveRef.current) return;
    const best = event.results[0]?.transcript ?? '';
    if (best.trim().length > 0) {
      onResultRef.current(best, event.isFinal);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (!isActiveRef.current) return;
    isActiveRef.current = false;
    setStatus('idle');
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (!isActiveRef.current) return;
    isActiveRef.current = false;
    setStatus('idle');
    // "aborted" is this hook's own stop() call landing back as an event,
    // not a real error worth surfacing to whoever's using the mic.
    if (event.error === 'aborted') return;
    let kind: VoiceDictationErrorKind = 'other';
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') kind = 'permission';
    else if (event.error === 'no-speech' || event.error === 'speech-timeout') kind = 'no-speech';
    onErrorRef.current?.(kind, event.message || event.error);
  });

  const start = useCallback(async () => {
    if (isActiveRef.current) return;
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      onErrorRef.current?.('permission', 'Microphone or speech recognition access was not granted.');
      return;
    }
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      onErrorRef.current?.('unavailable', 'Speech recognition is not available on this device.');
      return;
    }
    isActiveRef.current = true;
    setStatus('listening');
    ExpoSpeechRecognitionModule.start({
      lang,
      interimResults: true,
      // Auto-stops once a final result comes back (or, on iOS 17 and
      // below, after ~3 seconds of silence) -- the natural "tap, speak,
      // it finishes on its own" shape for both a search box and a short
      // dictated note, rather than needing a person to remember to tap
      // Stop themselves. See this hook's own header comment for why
      // continuous mode isn't used here.
      continuous: false,
      maxAlternatives: 1,
    });
  }, [lang]);

  const stop = useCallback(() => {
    if (!isActiveRef.current) return;
    ExpoSpeechRecognitionModule.stop();
  }, []);

  // Defensive: if the button/screen this hook belongs to unmounts while it
  // was still genuinely listening (e.g. Cancel tapped mid-listen right
  // after VoiceInputButton's own autoStart kicked one off), don't leave a
  // real native listening session running with no owner left to stop it.
  // A real, genuinely more likely scenario now that autoStart exists --
  // added alongside it rather than left as a latent gap.
  useEffect(() => stop, [stop]);

  return { status, start, stop };
}
