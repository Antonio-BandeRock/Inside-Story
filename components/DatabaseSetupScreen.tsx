import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

// A real, one-time loading screen -- 2026-08-10, direct request after
// confirming what a 30-60 second blank-looking Home page on first launch
// actually was: lib/db.ts's own getReferenceDatabase() copies the app's
// entire bundled, scored, 22,000+-food reference database onto the
// device's own writable storage the first time anything actually needs
// it (expo-sqlite's importDatabaseFromAssetAsync), a real, one-time file
// operation big enough to take real, noticeable time on a phone. That
// import was never gated on anything visible -- the native splash screen
// only ever waited on fonts and the LOCAL app database's own table setup
// (see app/_layout.tsx's own dbReady), so the app's real shell rendered
// looking normal while its content sat silently empty underneath, with
// nothing telling a person it was doing real work rather than being
// broken. Confirmed directly this happens on every genuinely fresh
// install, not just a dev artifact -- a new customer's very first launch
// has no record of ever having imported this database, so this same
// screen is exactly what they'd see too.
//
// Shown by app/_layout.tsx in place of the real app tree while that same
// import is still in flight -- once it resolves (or fails; see that
// file's own comment on why it fails open rather than getting anyone
// stuck here), the real app renders normally, and every launch after this
// one skips this screen entirely since the import is already done.
//
// Deliberately just the one line of real text requested -- no "this only
// happens once" elaboration, no branding flourish beyond this app's own
// already-established background/text colors, since a plain, honest,
// short message is what actually reassures someone their phone isn't
// stuck, not more copy to read while waiting.
export function DatabaseSetupScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Setting up your food database</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
  },
});
