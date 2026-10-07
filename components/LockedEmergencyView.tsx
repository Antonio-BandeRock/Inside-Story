// The emergency lines shown over the lock screen (1.0.63.12). Direct
// request, 2026-10-07: "make the Emergency card be a notification that can
// be selected like the voice note or photo so the emergency information can
// be displayed if selected from the notifications too."
//
// Opened by a tap on the emergency notification, through
// CaptureLauncherActivity in mode "emergency" (plugins/withCaptureTile.js),
// with the phone locked or not and with no code, since it is for whoever is
// holding the phone. Like the capture screen it is not the app: it opens no
// database and shows only what the person picked in Life > Emergency to be
// readable on a locked phone, read from the file lib/emergencyLockScreen.ts
// writes whenever the notification is put up.

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { readEmergencyLinesSync } from '../lib/emergencyLockScreen';
import { setLockedCaptureShowing } from '../lib/lockedCaptures';
import LockedCapture from '../modules/locked-capture';

function close() {
  LockedCapture?.finishCapture();
}

/** "DRUG ALLERGIES: penicillin" into its label and what follows. */
function splitLine(line: string): { label: string | null; value: string } {
  const at = line.indexOf(': ');
  if (at > 0 && at < 40) return { label: line.slice(0, at), value: line.slice(at + 2) };
  return { label: null, value: line };
}

export function LockedEmergencyView() {
  const [lines] = useState(() => readEmergencyLinesSync());

  useEffect(() => {
    setLockedCaptureShowing(true);
    return () => setLockedCaptureShowing(false);
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Ionicons name="medkit" size={26} color={colors.danger} />
            <Text style={styles.title}>{lines?.title ?? 'In an emergency'}</Text>
          </View>
          {lines ? (
            lines.lines.map((line, index) => {
              const { label, value } = splitLine(line);
              return (
                <View key={`${index}-${line}`} style={styles.line}>
                  {label ? <Text style={styles.label}>{label}</Text> : null}
                  <Text style={styles.value} selectable>
                    {value}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.hint}>
              No emergency lines are kept on this phone. They are picked in Inside Story, under Life, Emergency, once the phone is unlocked.
            </Text>
          )}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} onPress={close} accessibilityRole="button">
              <Text style={styles.primaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: {
    margin: 8,
    padding: 18,
    gap: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { ...typography.screenTitle, fontSize: 24, lineHeight: 30, color: colors.textPrimary, flexShrink: 1, ...textShadow },
  line: { gap: 2 },
  label: { ...typography.label, fontSize: 15, lineHeight: 20, color: colors.danger, ...textShadow },
  value: { ...typography.body, fontSize: 22, lineHeight: 30, color: colors.textPrimary, ...textShadow },
  hint: { ...typography.body, fontSize: 17, lineHeight: 24, color: colors.textSecondary, ...textShadow },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  primaryButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, backgroundColor: colors.primary },
  primaryText: { ...typography.bodyEmphasis, fontSize: 17, color: colors.textOnPrimary, fontWeight: '400' },
});
