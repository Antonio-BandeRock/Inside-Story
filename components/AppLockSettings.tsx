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
import { biometricTitle, biometricWords, deviceWord } from '../lib/appLockWords';
import { isDesktopApp } from '../lib/desktop/bridge';
import { explainNotYet } from '../lib/notYet';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import LockedCapture from '../modules/locked-capture';

// The body of Profile > App Lock. Setting the lock up and the changes that
// need the passcode open app/app-lock-setup.tsx; the settings that do not
// (when it locks again, screenshots, turning fingerprint off) change here.


// The Voice Note and Photo buttons kept in the notification shade (1.0.62.1).
// They open the same screens as the two quick settings tiles: over the lock
// screen when App Lock is on, otherwise Capture once the phone is unlocked
// (plugins/withCaptureTile.js). Phone only, and only on a build that has the
// screen, which is said in words rather than hidden.
function ShadeButtonsSetting() {
  const [showing, setShowing] = useState(() => LockedCapture?.isShowingShadeButtons() ?? false);
  if (isDesktopApp()) return null;
  return (
    <>
      <Text style={styles.subLabel}>Voice Note and Photo buttons in the notification shade</Text>
      <View style={styles.pillRow}>
        {[true, false].map((on) => (
          <TouchableOpacity
            key={String(on)}
            style={[styles.pill, showing === on ? styles.pillActive : null]}
            activeOpacity={0.85}
            onPress={() => {
              if (!LockedCapture) {
                explainNotYet('This needs the next full install of Inside Story on this phone. Until then the Capture tile in quick settings opens Capture in the app.');
                return;
              }
              if (on === showing) return;
              if (on) {
                if (!LockedCapture.showShadeButtons()) {
                  explainNotYet('Notifications are turned off for Inside Story, so the buttons have nowhere to show. They can be turned on in the phone settings, under Apps.');
                  return;
                }
              } else LockedCapture.hideShadeButtons();
              setShowing(LockedCapture.isShowingShadeButtons());
            }}
          >
            <Text style={[styles.pillText, showing === on ? styles.pillTextActive : null]}>{on ? 'Shown' : 'Hidden'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.caption}>
        {readLockStateSync()?.phase === 'on'
          ? 'Pull down the shade, press Voice Note or Photo, and type your passcode. The phone stays locked, and what you keep is sealed until Inside Story is next unlocked. The same two buttons can be added as quick settings tiles.'
          : 'Pull down the shade and press Voice Note or Photo. With App Lock set up these work over the lock screen with your passcode; without it the phone asks to be unlocked first. The same two buttons can be added as quick settings tiles.'}
      </Text>
    </>
  );
}

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

  if (!state) {
    return (
      <>
        <Text style={styles.help}>
          {`Keeps everything you have recorded in an encrypted file on this ${deviceWord()} that opens only with your passcode, or ${
            isDesktopApp() ? 'Windows Hello where this computer has it set up' : 'your fingerprint or face'
          }. Reminders still arrive while it is locked${
            isDesktopApp() ? '.' : ' and their buttons still work, and widgets show only that it is locked.'
          }`}
        </Text>
        <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={() => router.push('/app-lock-setup')}>
          <Text style={styles.buttonText}>Set Up App Lock</Text>
        </TouchableOpacity>
        <ShadeButtonsSetting />
      </>
    );
  }

  if (state.phase === 'decrypting') {
    return <Text style={styles.help}>App Lock is being turned off. It finishes the next time the app starts.</Text>;
  }
  if (state.phase !== 'on') {
    return <Text style={styles.help}>App Lock is still being set up. It finishes the next time the app starts.</Text>;
  }

  return (
    <>
      <Text style={styles.help}>
        {`App Lock is on. Your records are encrypted on this ${deviceWord()} and open with your passcode${
          state.biometric ? (isDesktopApp() ? ' or Windows Hello' : ' or your fingerprint or face') : ''
        }.${
          isDesktopApp()
            ? ''
            : ' A button pressed on a reminder while it is locked is kept sealed and saved, with the time you pressed it, the next time you unlock.'
        }`}
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
          <Text style={styles.subLabel}>{isDesktopApp() ? biometricTitle() : biometricWords().replace(/^f/, 'F')}</Text>
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

      {/* Windows and macOS give an app no way to keep its window out of a
          screenshot or the task switcher here, so the choice is the phone's. */}
      {isDesktopApp() ? null : (
        <>
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
        </>
      )}

      <Text style={styles.subLabel}>What reminders show on the lock screen</Text>
      <View style={styles.pillRow}>
        {(['full', 'kind'] as const).map((detail) => (
          <TouchableOpacity
            key={detail}
            style={[styles.pill, state.reminderDetail === detail ? styles.pillActive : null]}
            activeOpacity={0.85}
            onPress={() => {
              if (detail === state.reminderDetail) return;
              setState(updateLockSettings({ reminderDetail: detail }));
              // Reminders already queued carry their words, so they are
              // queued again with the new ones.
              void syncReminderNotifications();
            }}
          >
            <Text style={[styles.pillText, state.reminderDetail === detail ? styles.pillTextActive : null]}>
              {detail === 'kind' ? 'Only the Kind' : 'Full Detail'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.caption}>
        {state.reminderDetail === 'kind'
          ? `A reminder says only what kind it is, such as "Time for your scheduled dose", so nobody near the ${deviceWord()} sees which medicine, meal or note it is about. Its buttons still answer it without unlocking.`
          : `A reminder shows its whole text, including medicine names and notes, to anybody who can see the ${deviceWord()}, and its buttons answer it without unlocking.`}
      </Text>

      <ShadeButtonsSetting />

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
      <TouchableOpacity
        style={styles.quietButton}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/app-lock-setup', params: { mode: 'off' } })}
      >
        <Text style={styles.quietButtonText}>Turn Off App Lock</Text>
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
  quietButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  quietButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
});
