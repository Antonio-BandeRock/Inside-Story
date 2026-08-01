import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE, useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import { PurpleRibbonIcon } from '../components/PurpleRibbonIcon';

// A Stack push outside the (tabs) group entirely, same shape as
// app/profile.tsx (see that file's own comment on why: reached from
// TabHub from anywhere, not part of the swipeable tab rotation) --
// 2026-07-27, the new autoimmune learning/awareness area. Named "The
// Purple Digest" after a real back-and-forth (Autoimmune Intelligence/AI
// rejected for colliding with the AI initialism; Autoimmune Inside Story/
// AIS rejected for colliding with Androgen Insensitivity Syndrome, a real
// diagnosis -- both close calls worth remembering if this ever gets
// renamed again) -- "Digest" does real double duty: a curated news digest
// (what this feature actually is) and a nod to gut/digestive health,
// already a named goal of this app elsewhere. Purple matches the real
// awareness-ribbon color for autoimmune disease (see constants/colors.ts's
// own tabPurpleDigest comment). Not built yet -- this is a placeholder
// shell, same "not built yet" honesty as Food/Reports' own stub state,
// until the actual content-source plan (MedlinePlus, ATA, Autoimmune
// Association confirmed as the starting three sources) gets wired in.
export default function PurpleDigestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useFloatingButtonScrollPadding();

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}>
        <View style={styles.iconRow}>
          <PurpleRibbonIcon size={52} color={colors.tabPurpleDigest} />
        </View>
        <Text style={styles.title}>The Purple Digest</Text>
        <Text style={styles.body}>
          Not built yet. This will bring together the same kind of cited, trustworthy information the rest of this
          app already leans on -- Hashimoto's-specific to start, with the ability to broaden focus to other
          autoimmune conditions -- plus a news feed of new research and articles, so keeping up doesn't mean going
          and hunting for it yourself.
        </Text>
      </ScrollView>

      {/* Same circular floating-button footprint/position/color as every
          other close ("X") button in the app (see profile.tsx's own
          closeButton comment for why this stays colors.primary, not
          tabPurpleDigest -- a neutral "close" affordance, not this page's
          own identity). */}
      <TouchableOpacity
        style={[styles.closeButton, { bottom: insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET }]}
        onPress={() => router.back()}
        activeOpacity={0.85}
        accessibilityLabel="Close The Purple Digest"
      >
        <Ionicons name="close" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  container: { padding: 20, paddingTop: 32, alignItems: 'center' },
  iconRow: { marginBottom: 12 },
  title: { ...typography.screenTitle, color: colors.tabPurpleDigest, marginBottom: 12 },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  closeButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
