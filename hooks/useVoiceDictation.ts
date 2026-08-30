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

// Where the audio was actually processed for the most recent session. Null
// until one has started. This is not a preference; it is a report, and any
// screen handling health-adjacent speech should be able to say honestly which
// one it got.
export type VoiceRecognitionMode = 'on-device' | 'network';

export type UseVoiceDictationResult = {
  status: VoiceDictationStatus;
  start: () => Promise<void>;
  stop: () => void;
  recognitionMode: VoiceRecognitionMode | null;
};

export function useVoiceDictation({ onResult, onError, lang = 'en-US' }: UseVoiceDictationOptions): UseVoiceDictationResult {
  const [status, setStatus] = useState<VoiceDictationStatus>('idle');
  const [recognitionMode, setRecognitionMode] = useState<VoiceRecognitionMode | null>(null);
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
    // Prefer recognition that never leaves the phone. This matters more here
    // than it would in most apps: this one's whole stance is that no server
    // holds anyone's health data, and dictating what you ate is health data the
    // moment it is spoken. The OS recognizer defaults to a network service
    // (Google's or Apple's), so without asking, every food name spoken into
    // this app was being sent off the device -- not to this project's own
    // backend, which does not exist, but off the device all the same.
    //
    // Asked rather than assumed: supportsOnDeviceRecognition() reports whether
    // the device can do it at all, and getSupportedLocales' installedLocales is
    // what says the language pack for this locale is actually downloaded.
    // Requesting on-device recognition for a locale that is not installed fails
    // the session outright, so both have to be true before asking for it.
    // Anything short of that falls back to exactly the previous behaviour,
    // which keeps voice working everywhere it worked before.
    let useOnDevice = false;
    try {
      if (ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()) {
        const locales = await ExpoSpeechRecognitionModule.getSupportedLocales({});
        const normalized = lang.toLowerCase().replace('_', '-');
        useOnDevice = (locales.installedLocales ?? []).some(
          (installed) => installed.toLowerCase().replace('_', '-') === normalized,
        );
      }
    } catch (error) {
      // A device that cannot answer the question is treated as a no, never as
      // a yes: falling back to network recognition still works, while asking
      // for on-device recognition it cannot do would kill the session.
      console.warn('[useVoiceDictation] Could not check for on-device recognition', error);
      useOnDevice = false;
    }

    isActiveRef.current = true;
    setRecognitionMode(useOnDevice ? 'on-device' : 'network');
    setStatus('listening');
    ExpoSpeechRecognitionModule.start({
      lang,
      interimResults: true,
      requiresOnDeviceRecognition: useOnDevice,
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

  return { status, start, stop, recognitionMode };
}
