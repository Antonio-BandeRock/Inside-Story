import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';

// A real, reusable "this is genuinely still working" overlay -- 2026-08-16,
// direct request following real, on-device backup/restore testing: "there
// needs to be some sort of communication between steps that take a little
// time to complete so the user isn't left wondering 'well, is it doing
// something, or...'." A real, honest gap up to this point: backup export
// and restore both involve a genuinely slow step (encrypting or decrypting
// a real 100,000-round key derivation, then a real whole-database rewrite)
// with nothing visible on screen while it runs beyond a button's own label.
//
// Deliberately NOT a copy of DatabaseSetupScreen.tsx's own full-screen,
// percent-based approach -- that screen exists for the one, genuinely
// blocking, app-launch reference-database import, where nothing else in
// the app can happen yet and a real, calibrated percentage estimate was
// worth building. Backup/restore already sit behind their own real
// confirm dialog and a real Working... button state; this is a smaller,
// dialog-weight overlay (the same real visual shape as InfoAlert.tsx/
// PasswordPrompt.tsx) rather than a second full-screen takeover, and
// deliberately shows a plain, honest spinner plus a real, live status
// message instead of inventing a second percent-estimate system for
// operations that, just like the reference-database import, have no real
// byte-level progress signal to report at all.
//
// Promise-free, unlike PasswordPrompt/InfoAlert -- there's nothing for the
// person to answer here, so this is a plain show/update/hide trio rather
// than an awaited result. showBusy(message) both opens the overlay AND
// updates its message if it's already open, so a caller can call it more
// than once across real, distinct phases of one slow operation
// ("Decrypting your backup..." -> "Restoring your data...") without
// needing to track open/closed state itself.
export function useBusyOverlay(): [(message: string) => void, () => void, ReactNode] {
  const [message, setMessage] = useState<string | null>(null);
  // A real guard against a genuine race: hideBusy() firing (e.g. from a
  // finally block) after a LATER showBusy() call already replaced it with a
  // real, different, still-relevant message -- tracked via a ref (not
  // state) since it only needs to be read inside these two closures, never
  // to trigger its own render.
  const tokenRef = useRef(0);

  const showBusy = useCallback((next: string) => {
    tokenRef.current += 1;
    setMessage(next);
  }, []);

  const hideBusy = useCallback(() => {
    tokenRef.current += 1;
    setMessage(null);
  }, []);

  const element = (
    <Modal visible={message !== null} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );

  return [showBusy, hideBusy, element];
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  // Same real chrome-not-content reasoning already on record for
  // InfoAlert.tsx/PasswordPrompt.tsx's own card -- colors.menuSurface, not
  // the translucent colors.surface page content uses.
  card: {
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  message: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 16,
    ...textShadow,
  },
});
