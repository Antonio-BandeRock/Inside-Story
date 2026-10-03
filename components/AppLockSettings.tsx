import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { AUTO_LOCK_CHOICES, autoLockLabel, type AppLockState } from '../lib/appLock';
import {
  canUseBiometrics,
  lockNow,
  readLockStateSync,
  setBiometricUnlock,
  updateLockSettings,
} from '../lib/appLockDevice';
import { isDesktopApp } from '../lib/desktop/bridge';

// The body of Profile > App Lock. Setting the lock up and the changes that
// need the passcode open app/app-lock-setup.tsx; the settings that do not
// (when it locks again, screenshots, turning fingerprint off) change here.

export function AppLockSettings() {
  const router = useRouter();
  const [state, setState] = useState<AppLockState | null>(() => readLockStateSync());
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setState(readLockStateSync());
    }, []),
  );

  useEffect(() => {
    void canUseBiometrics().then(setBiometricAvailable);
  }, []);

  if (isDesktopApp()) {
    return (
      <Text style={styles.help}>
        App Lock is on the phone for now. Locking the records on the computer comes in a later version.
      </Text>
    );
  }

  if (!state) {
    return (
      <>
        <Text style={styles.help}>
          Keeps everything you have recorded in an encrypted file on this phone that opens only with your passcode, or
          your fingerprint or face. Reminders still arrive while it is locked and their buttons still work, and widgets show only that it is locked.
        </Text>
        <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={() => router.push('/app-lock-setup')}>
          <Text style={styles.buttonText}>Set Up App Lock</Text>
        </TouchableOpacity>
      </>
    );
  }

  if (state.phase !== 'on') {
    return <Text style={styles.help}>App Lock is still being set up. It finishes the next time the app starts.</Text>;
  }

  return (
    <>
      <Text style={styles.help}>
        App Lock is on. Your records are encrypted on this phone and open with your passcode
        {state.biometric ? ' or your fingerprint or face' : ''}. A button pressed on a reminder while it is locked is kept sealed and saved, with the time you pressed it, the next time you unlock.
      </Text>

      <Text style={styles.subLabel}>Lock again after the app has been away for</Text>
      <View style={styles.pillRow}>
        {AUTO_LOCK_CHOICES.map((minutes) => (
          <TouchableOpacity
            key={minutes}
            style={[styles.pill, state.autoLockMinutes === minutes ? styles.pillActive : null]}
            activeOpacity={0.85}
            onPress={() => setState(updateLockSettings({ autoLockMinutes: minutes }))}
          >
            <Text style={[styles.pillText, state.autoLockMinutes === minutes ? styles.pillTextActive : null]}>
              {autoLockLabel(minutes)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.caption}>
        Checked when you come back to the app. Opening another app from this one, such as the camera or a file picker,
        counts as time away.
      </Text>

      {biometricAvailable || state.biometric ? (
        <>
          <Text style={styles.subLabel}>Fingerprint or face</Text>
          <View style={styles.pillRow}>
            {[true, false].map((on) => (
              <TouchableOpacity
                key={String(on)}
                style={[styles.pill, state.biometric === on ? styles.pillActive : null]}
                activeOpacity={0.85}
                onPress={async () => {
                  if (on === state.biometric) return;
                  if (on) router.push({ pathname: '/app-lock-setup', params: { mode: 'biometric' } });
                  else {
                    await setBiometricUnlock(null, false);
                    setState(readLockStateSync());
                  }
                }}
              >
                <Text style={[styles.pillText, state.biometric === on ? styles.pillTextActive : null]}>
                  {on ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.subLabel}>Screenshots and the recent apps preview</Text>
      <View style={styles.pillRow}>
        {[false, true].map((allow) => (
          <TouchableOpacity
            key={String(allow)}
            style={[styles.pill, state.allowScreenshots === allow ? styles.pillActive : null]}
            activeOpacity={0.85}
            onPress={() => setState(updateLockSettings({ allowScreenshots: allow }))}
          >
            <Text style={[styles.pillText, state.allowScreenshots === allow ? styles.pillTextActive : null]}>
              {allow ? 'Allowed' : 'Blocked'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/app-lock-setup', params: { mode: 'passcode' } })}
      >
        <Text style={styles.buttonText}>Change Passcode</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/app-lock-setup', params: { mode: 'recovery' } })}
      >
        <Text style={styles.buttonText}>Make a New Recovery Key</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={() => void lockNow()}>
        <Text style={styles.buttonText}>Lock Now</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  help: { ...typography.body, color: colors.textSecondary, lineHeight: 20, ...textShadow },
  caption: { ...typography.caption, color: colors.textMuted, marginTop: 6, ...textShadow },
  subLabel: { ...typography.label, color: colors.textPrimary, marginTop: 14, marginBottom: 6, ...textShadow },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  pillTextActive: { color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  buttonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnPrimary,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
});
