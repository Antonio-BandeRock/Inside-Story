// The capture screen shown over the phone's lock screen (1.0.62.1).
//
// Direct request, 2026-10-05: "a separate small capture screen that Android
// allows to appear over the lock screen without unlocking. You'd pull down the
// tile or tap a button on a notification you keep in the shade, enter your
// Inside Story code, speak, and it saves. The phone stays locked the whole
// time." And the camera: "a photo straight into Capture ... Taken while the
// phone is locked, it would be sealed the same way, so the photo can't be
// looked at until you unlock."
//
// Registered in index.js as "LockedCapture" and shown only by
// LockedCaptureActivity (plugins/withCaptureTile.js). It is not the app: no
// router, no database, no tab. The code is checked the same way the lock
// screen checks it (checkPasscode, with its waits after wrong tries), and the
// key that check opens is let go of straight away, since sealing needs only
// the public key in the lock file. What is said or photographed is sealed
// (lib/lockedCaptures.ts) and written into Capture on the next unlock.

import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { useVoiceDictation, type VoiceDictationErrorKind } from '../hooks/useVoiceDictation';
import { waitLabel } from '../lib/appLock';
import { checkPasscode } from '../lib/appLockDevice';
import { readLockStateSync } from '../lib/appLockSession';
import { PHOTO_CAPTURE_TEXT, cleanCaptureText, isCaptureTextUsable } from '../lib/captureNotes';
import { canSealCaptures, keepCaptureForUnlock, photoFileToBase64, setLockedCaptureShowing } from '../lib/lockedCaptures';
import { shrinkPhotoFile } from '../lib/mealPhotos';
import LockedCapture from '../modules/locked-capture';

type Mode = 'voice' | 'photo';

type Stage =
  | { kind: 'code' }
  | { kind: 'listening' }
  | { kind: 'camera' }
  | { kind: 'saving' }
  | { kind: 'saved'; what: Mode; text: string }
  | { kind: 'nothing' }
  | { kind: 'failed'; message: string };

// A photo kept sealed is held in memory while it is sealed, so it is shrunk
// first. Large enough to read a label or a receipt.
const PHOTO_MAX_DIMENSION = 1600;
const PHOTO_MAX_BYTES = 900 * 1024;

const ERROR_WORDS: Record<Exclude<VoiceDictationErrorKind, 'no-speech'>, string> = {
  permission: 'The microphone is not allowed for Inside Story. It can be turned on in the phone settings, under Apps, once the phone is unlocked.',
  unavailable: 'Speech recognition is not available on this phone right now.',
  other: 'Something went wrong while listening. Try again.',
};

function close() {
  LockedCapture?.finishCapture();
}

function removeFile(uri: string | null | undefined) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // A cache file left behind is cleared with the cache.
  }
}

export function LockedCaptureScreen({ mode: startMode }: { mode?: string }) {
  const [mode, setMode] = useState<Mode>(startMode === 'photo' ? 'photo' : 'voice');
  const [stage, setStage] = useState<Stage>({ kind: 'code' });
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [heard, setHeard] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const savedOnce = useRef(false);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const lockState = readLockStateSync();
  const ready = lockState !== null && canSealCaptures();

  useEffect(() => {
    setLockedCaptureShowing(true);
    return () => setLockedCaptureShowing(false);
  }, []);

  async function keepSpoken(text: string) {
    if (savedOnce.current) return;
    savedOnce.current = true;
    setStage({ kind: 'saving' });
    const clean = cleanCaptureText(text);
    try {
      const kept = await keepCaptureForUnlock({ kind: 'spoken', text: clean, takenAt: new Date().toISOString(), photo: null, width: 0, height: 0 });
      setStage(kept ? { kind: 'saved', what: 'voice', text: clean } : { kind: 'failed', message: 'Inside Story is not locked with a code on this phone, so there is nothing to seal the note to.' });
    } catch (error) {
      savedOnce.current = false;
      setStage({ kind: 'failed', message: error instanceof Error && error.message ? error.message : 'The note could not be kept.' });
    }
  }

  const { status, start, stop } = useVoiceDictation({
    onResult: (transcript, isFinal) => {
      setHeard(transcript);
      if (isFinal) {
        const text = transcript.trim();
        if (isCaptureTextUsable(text)) void keepSpoken(text);
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

  function begin(next: Mode) {
    savedOnce.current = false;
    setHeard('');
    setMessage(null);
    setMode(next);
    if (next === 'voice') {
      setStage({ kind: 'listening' });
      void start();
      return;
    }
    setStage({ kind: 'camera' });
    if (!permission?.granted) void requestPermission();
  }

  async function submitCode() {
    if (checking) return;
    if (!code) {
      setCodeMessage('Type your Inside Story code first.');
      return;
    }
    setChecking(true);
    setCodeMessage(null);
    try {
      const result = await checkPasscode(code);
      if (result.kind === 'key') {
        // Sealing needs only the public key in the lock file, so the key the
        // code opened is not kept anywhere on this screen.
        setCode('');
        begin(mode);
        return;
      }
      setCode('');
      if (result.kind === 'wait') setCodeMessage(`Too many wrong tries. Try again in ${waitLabel(result.waitMs)}.`);
      else if (result.waitMs > 0) setCodeMessage(`That code is not right. The next try can be made in ${waitLabel(result.waitMs)}.`);
      else setCodeMessage('That code is not right.');
    } catch (error) {
      setCodeMessage(error instanceof Error && error.message ? error.message : 'The code could not be checked.');
    } finally {
      setChecking(false);
    }
  }

  function finishListening() {
    const text = heard.trim();
    if (!isCaptureTextUsable(text)) {
      setMessage('Nothing has been heard yet. Say the note, or press Cancel.');
      return;
    }
    if (status === 'listening') stop();
    void keepSpoken(text);
  }

  async function takePhoto() {
    if (!cameraRef.current) {
      setMessage('The camera is still starting. Try again in a moment.');
      return;
    }
    setStage({ kind: 'saving' });
    let taken: string | null = null;
    let shrunk: string | null = null;
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      taken = picture?.uri ?? null;
      if (!taken) throw new Error('The camera did not hand back a photo.');
      const small = await shrinkPhotoFile(taken, PHOTO_MAX_DIMENSION, PHOTO_MAX_BYTES);
      shrunk = small?.uri ?? null;
      const uri = shrunk ?? taken;
      const kept = await keepCaptureForUnlock({
        kind: 'photo',
        text: PHOTO_CAPTURE_TEXT,
        takenAt: new Date().toISOString(),
        photo: photoFileToBase64(uri),
        width: small?.width ?? picture.width,
        height: small?.height ?? picture.height,
      });
      setStage(kept ? { kind: 'saved', what: 'photo', text: PHOTO_CAPTURE_TEXT } : { kind: 'failed', message: 'Inside Story is not locked with a code on this phone, so there is nothing to seal the photo to.' });
    } catch (error) {
      setStage({ kind: 'failed', message: error instanceof Error && error.message ? error.message : 'The photo could not be kept.' });
    } finally {
      // No readable copy stays behind: both plain files go before Saved shows.
      removeFile(shrunk);
      removeFile(taken);
    }
  }

  function cancel() {
    if (status === 'listening') stop();
    close();
  }

  if (!ready) {
    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>Unlock the phone first</Text>
          <Text style={styles.hint}>
            Notes over the lock screen are sealed to your Inside Story code, and App Lock is not set up on this phone. Unlock the phone and
            Capture opens in the app instead.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={close}>
            <Text style={styles.primaryText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage.kind === 'camera') {
    return (
      <View style={styles.cameraScreen}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>The camera is not allowed yet</Text>
            <Text style={styles.hint}>
              {permission && !permission.canAskAgain
                ? 'The camera is turned off for Inside Story. It can be turned on in the phone settings, under Apps, once the phone is unlocked.'
                : 'Allow the camera when the phone asks. If nothing appears, take one photo from Capture inside the app first, and the lock screen camera works from then on.'}
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => void requestPermission()}>
              <Text style={styles.primaryText}>Ask Again</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.cameraBar}>
          {message ? <Text style={[styles.hint, styles.cameraMessage]}>{message}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={cancel}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shutter}
              onPress={() => {
                if (!permission?.granted) {
                  setMessage('The camera needs to be allowed before a photo can be taken.');
                  return;
                }
                void takePhoto();
              }}
              accessibilityRole="button"
              accessibilityLabel="Take the photo"
            >
              <Ionicons name="camera" size={30} color={colors.textOnPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="height">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {stage.kind === 'code' ? (
            <>
              <View style={styles.titleRow}>
                <Ionicons name={mode === 'voice' ? 'mic' : 'camera'} size={20} color={colors.primary} />
                <Text style={styles.title}>{mode === 'voice' ? 'Voice note for Capture' : 'Photo for Capture'}</Text>
              </View>
              <Text style={styles.hint}>
                Type your Inside Story code. The phone stays locked, and what you keep is sealed until Inside Story is next unlocked.
              </Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(next) => {
                  setCode(next);
                  setCodeMessage(null);
                }}
                secureTextEntry
                autoFocus
                keyboardType={lockState?.passcodeKind === 'digits' ? 'number-pad' : 'default'}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={() => void submitCode()}
                placeholder="Inside Story code"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Inside Story code"
              />
              {codeMessage ? <Text style={styles.warning}>{codeMessage}</Text> : null}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={cancel}>
                  <Text style={styles.secondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={() => void submitCode()}>
                  <Text style={styles.primaryText}>{checking ? 'Checking…' : 'Continue'}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
          {stage.kind === 'listening' ? (
            <>
              <View style={styles.titleRow}>
                <Ionicons name="mic" size={20} color={colors.primary} />
                <Text style={styles.title}>{status === 'listening' ? 'Listening' : 'Starting the microphone'}</Text>
              </View>
              <Text style={heard ? styles.heard : styles.hint}>
                {heard || 'Say the note. It is kept as soon as you stop talking.'}
              </Text>
              {message ? <Text style={styles.warning}>{message}</Text> : null}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={cancel}>
                  <Text style={styles.secondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={finishListening}>
                  <Text style={styles.primaryText}>Done</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
          {stage.kind === 'saving' ? <Text style={styles.hint}>Sealing…</Text> : null}
          {stage.kind === 'saved' ? (
            <>
              <View style={styles.titleRow}>
                <Ionicons name="lock-closed" size={20} color={colors.primary} />
                <Text style={styles.title}>{stage.what === 'voice' ? 'Note kept' : 'Photo kept'}</Text>
              </View>
              {stage.what === 'voice' ? <Text style={styles.heard}>{stage.text}</Text> : null}
              <Text style={styles.hint}>
                It is sealed on this phone and goes into Capture the next time Inside Story is unlocked, with the time it was taken.
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => begin(stage.what === 'voice' ? 'photo' : 'voice')}>
                  <Text style={styles.secondaryText}>{stage.what === 'voice' ? 'Take a Photo' : 'Say a Note'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => begin(stage.what)}>
                  <Text style={styles.secondaryText}>Another</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={close}>
                  <Text style={styles.primaryText}>Done</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
          {stage.kind === 'nothing' || stage.kind === 'failed' ? (
            <>
              <Text style={styles.title}>{stage.kind === 'nothing' ? 'Nothing was heard' : 'Not kept'}</Text>
              <Text style={styles.hint}>{stage.kind === 'nothing' ? 'No words came through, so nothing was kept.' : stage.message}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={close}>
                  <Text style={styles.secondaryText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={() => begin(mode)}>
                  <Text style={styles.primaryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: {
    margin: 16,
    padding: 16,
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...typography.bodyEmphasis, color: colors.textPrimary, fontWeight: '400', flexShrink: 1, ...textShadow },
  heard: { ...typography.body, color: colors.textPrimary, ...textShadow },
  hint: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  warning: { ...typography.caption, color: colors.danger, ...textShadow },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
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
  cameraScreen: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  cameraBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 32,
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cameraMessage: { color: '#fff' },
  shutter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
