import * as Updates from 'expo-updates';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { APP_VERSION } from '../constants/version';

// Shown when the database cannot be set up, so the app is not simply dead.
//
// Built 2026-09-06, after exactly that happened. 1.0.34.30 shipped a schema
// statement that threw on every device that already had the app. The throw was
// already caught and logged in app/_layout.tsx, and nothing was done with it, so
// the app carried on with a database that had never finished being built: Home
// was empty, Profile would not open, and there was no way to reach Check for
// Updates to pull the fix. Reported directly, and fairly: "This is not good."
//
// THE ONE JOB THIS SCREEN HAS. Not to explain, not to diagnose, not to look
// reassuring. To keep the update mechanism reachable when everything that
// depends on the database is gone, because an update is how a bad release
// actually gets fixed on a phone somebody is holding.
//
// WHAT IT DELIBERATELY DOES NOT DO.
//
// It touches no database, obviously, but that is worth stating because it is
// easy to break later: no profile name, no theme preference read, no saved
// anything. Colours come from constants/colors.ts, which resolves the ground
// theme synchronously from a plain text mirror file rather than from SQLite
// (see getGroundThemeSync), so this screen still renders correctly themed with
// the database completely unavailable.
//
// And it does not pretend the problem is the person's. It says the app failed,
// shows the real error, and offers the two things that genuinely help.

type Props = {
  error: unknown;
  /** Lets someone through to the app anyway, however broken it may be. */
  onContinueAnyway: () => void;
};

type Phase = 'idle' | 'checking' | 'downloading' | 'none-available' | 'unavailable' | 'failed';

export function StartupFailureScreen({ error, onContinueAnyway }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [detail, setDetail] = useState<string | null>(null);

  // The real error text, shown rather than hidden. Somebody reporting this needs
  // something to report, and a generic apology gives them nothing to say.
  const errorText = error instanceof Error ? error.message : String(error ?? 'Unknown error');

  async function handleCheckForUpdates() {
    setDetail(null);
    try {
      // False in Expo Go and in a development build with no update channel, both
      // of which this project actually runs. Saying so is more useful than a
      // button that silently does nothing.
      if (!Updates.isEnabled) {
        setPhase('unavailable');
        return;
      }
      setPhase('checking');
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setPhase('none-available');
        return;
      }
      setPhase('downloading');
      await Updates.fetchUpdateAsync();
      // Tears the JS context down and relaunches on the new bundle. If a fix is
      // published, this is the moment it takes effect.
      await Updates.reloadAsync();
    } catch (updateError) {
      setPhase('failed');
      setDetail(updateError instanceof Error ? updateError.message : String(updateError));
    }
  }

  const busy = phase === 'checking' || phase === 'downloading';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <Ionicons name="build-outline" size={40} color={colors.textMuted} />
        <Text style={styles.title}>The app could not finish starting</Text>
        <Text style={styles.text}>
          Something went wrong setting up the database on this device, so most of the app will be
          empty or unresponsive until it is fixed. This is a fault in the app, not something you
          did, and nothing you have recorded has been lost.
        </Text>
        <Text style={styles.text}>
          The most likely fix is an update. If one has been published, the button below will fetch
          it and restart.
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, busy ? styles.primaryButtonDisabled : null]}
          activeOpacity={0.85}
          onPress={handleCheckForUpdates}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>
            {phase === 'checking' ? 'Checking…' : phase === 'downloading' ? 'Downloading…' : 'Check for Updates'}
          </Text>
        </TouchableOpacity>

        {phase === 'none-available' ? (
          <Text style={styles.note}>
            No update is available yet, so this has not been fixed on the other end. Closing the app
            completely and opening it again is worth trying: some of these faults clear on a second
            run once the database has been rebuilt.
          </Text>
        ) : null}
        {phase === 'unavailable' ? (
          <Text style={styles.note}>
            This build cannot check for updates on its own. Closing the app completely and opening
            it again is the thing to try.
          </Text>
        ) : null}
        {phase === 'failed' ? (
          <Text style={styles.note}>
            The check itself failed{detail ? `: ${detail}` : '.'} That usually means no connection
            right now.
          </Text>
        ) : null}

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={onContinueAnyway}>
          <Text style={styles.secondaryButtonText}>Open the App Anyway</Text>
        </TouchableOpacity>
        <Text style={styles.note}>
          Parts of it will not work, but anything that does not need the database still opens.
        </Text>

        {/* The version and the real error, so a report can say something specific
            rather than "it is broken". */}
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Version {APP_VERSION}</Text>
          <Text style={styles.detailText}>{errorText}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center', ...textShadow },
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center', ...textShadow },
  note: { ...typography.caption, color: colors.textMuted, textAlign: 'center', ...textShadow },
  primaryButton: {
    backgroundColor: colors.buttonColor, ...BUTTON_SHADOW, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', marginTop: 8, width: '100%',
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: {
    ...typography.bodyEmphasis, color: colors.textOnButton, textAlign: 'center',
    textShadowColor: 'transparent', textShadowRadius: 0,
  },
  secondaryButton: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', marginTop: 12, width: '100%',
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
  detailBox: {
    marginTop: 20, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, width: '100%', gap: 4,
  },
  detailLabel: { ...typography.caption, color: colors.textMuted, ...textShadow },
  detailText: { ...typography.caption, color: colors.textSecondary, ...textShadow },
});
