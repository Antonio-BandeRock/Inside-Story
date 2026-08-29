import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { NAVIGATION_HAND } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';

export type PasswordPromptMode = 'set' | 'enter';

interface PasswordPromptRequest {
  mode: PasswordPromptMode;
  title: string;
  message: string;
}

const MIN_PASSWORD_LENGTH = 8;

// Reusable, real password-entry dialog for the Backup & Restore feature
// (see lib/backupEncryption.ts's own header comment for the full real
// reason this exists) -- modeled directly on components/InfoAlert.tsx's
// own real hook+Modal pattern.
//
// Deliberately uses React Native's OWN native TextInput with
// secureTextEntry, not this app's custom AppTextInput/AppKeyboard system
// -- confirmed directly (grepped both files) that system has no masked-
// entry support at all, and a password field genuinely benefits from the
// OS's own trusted, standard secure-entry behavior rather than this app's
// own custom on-screen keyboard, a real, deliberate exception to how
// every other text field in this app is built.
//
// Two real modes: 'set' (export) asks for the password twice, to catch a
// typo before it locks someone out of their own backup forever -- there
// is deliberately no "forgot password" recovery anywhere in this whole
// feature, matching CLAUDE.md's own already-decided recovery model ("the
// app never holds the user's key"); 'enter' (restore) asks once.
//
// Promise-based, not a fire-and-forget popup like InfoAlert -- await
// promptPassword(...) resolves with the real, entered password, or null
// on a genuine cancel, so a caller can just await it inline inside its
// own async handler rather than juggle a second callback/state machine.
export function usePasswordPrompt(): [
  (mode: PasswordPromptMode, title: string, message: string) => Promise<string | null>,
  ReactNode,
] {
  const [request, setRequest] = useState<PasswordPromptRequest | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const resolveRef = useRef<((value: string | null) => void) | null>(null);

  const promptPassword = useCallback(
    (mode: PasswordPromptMode, title: string, message: string): Promise<string | null> => {
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setRequest({ mode, title, message });
      return new Promise((resolve) => {
        resolveRef.current = resolve;
      });
    },
    [],
  );

  function close(result: string | null) {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setRequest(null);
  }

  function handleSubmit() {
    if (!request) return;
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Needs to be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (request.mode === 'set' && password !== confirmPassword) {
      setError("Those two don't match.");
      return;
    }
    close(password);
  }

  const element = (
    <Modal visible={request !== null} transparent animationType="fade" onRequestClose={() => close(null)}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close(null)} />
        <View style={styles.card}>
          <Text style={styles.title}>{request?.title}</Text>
          <Text style={styles.message}>{request?.message}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {request?.mode === 'set' ? (
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError(null);
              }}
              secureTextEntry
              placeholder="Confirm password"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : null}
          {request?.mode === 'set' ? (
            <Text style={styles.hint}>
              There&apos;s no way to recover this if it&apos;s lost -- the app never stores it. Write it down
              somewhere safe.
            </Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={[styles.buttonRow, { justifyContent: NAVIGATION_HAND === 'left' ? 'flex-start' : 'flex-end' }]}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => close(null)} hitSlop={8}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.okButton} onPress={handleSubmit} hitSlop={8}>
              <Text style={styles.okButtonText}>{request?.mode === 'set' ? 'Set Password' : 'Unlock'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return [promptPassword, element];
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 420,
  },
  title: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    fontSize: 18,
    marginBottom: 6,
    ...textShadow,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
    ...textShadow,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    ...textShadow,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
    ...textShadow,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 4,
    marginBottom: 4,
    ...textShadow,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textSecondary,
    ...textShadow,
  },
  okButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  okButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnPrimary,
    ...textShadow,
  },
});
