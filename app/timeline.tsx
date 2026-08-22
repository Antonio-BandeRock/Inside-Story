import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

// A deliberate stub, Phase 0 of the header growth vine/Timeline plan
// (2026-08-21, see the Notion App Development Log and the "Header Vine,
// Timeline & Life" phased build plan). ScreenHeader's own title is now a
// real tappable route into this screen, but the Timeline itself (the
// horizontal scrub strip, marker-and-card interaction, semantic zoom) is
// Phase 6, not built here. This exists so Phase 0's tap target has
// somewhere honest to land, an explicit "not yet" rather than a dead link
// or a silent no-op.
export default function TimelineScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="leaf-outline" size={40} color={colors.textMuted} />
      <Text style={styles.title}>Your Inside Story</Text>
      <Text style={styles.body}>
        This is where your own timeline will live, everything you achieve and work through, in one place
        you can look back on. It isn&apos;t built yet, this screen is just holding its spot.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
