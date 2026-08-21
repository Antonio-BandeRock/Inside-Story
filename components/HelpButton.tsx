import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE } from '../constants/floatingButton';
import { typography } from '../constants/typography';

export type HelpSection = { heading: string; body: string };

// The slide-up sheet itself, as a controlled component -- separated from
// HelpButton so TabHub's "info about whatever page is currently open" tile
// (see components/TabHub.tsx) can show the exact same sheet UI without
// duplicating this markup, just with its own visible/onClose state instead
// of owning an icon of its own.
//
// The close button floats bottom-center, at the exact same spot and size
// as TabHub's own floating button (see constants/floatingButton.ts) --
// deliberately not a top-right "X" the way it used to be, since that sits
// well outside a left thumb's reach on every information page. It's
// layered on top of the panel (not inside its scrolling content), so the
// sheet's text scrolls underneath/around it rather than stopping short of
// it.
export function HelpSheet({
  visible,
  onClose,
  pageTitle,
  sections,
  extra,
}: {
  visible: boolean;
  onClose: () => void;
  pageTitle: string;
  sections: HelpSection[];
  // Optional, additive, real JSX rendered after the plain-text sections
  // above -- 2026-08-09, added for Digest's own "About Search
  // Matching" sheet, which needs to show real, colored dot/pill mockups
  // alongside its prose, not just plain heading/body text. Every existing
  // caller that doesn't pass this renders exactly as before -- this is a
  // pure addition, not a change to the default shape.
  extra?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    // statusBarTranslucent/navigationBarTranslucent: see the identical
    // comment on TabHub's own Modal (components/TabHub.tsx) -- same
    // Android edge-to-edge gap, same fix.
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropTouchable} onPress={onClose} />
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.title}>About {pageTitle}</Text>
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              {sections.map((section) => (
                <View key={section.heading} style={styles.section}>
                  <Text style={styles.sectionHeading}>{section.heading}</Text>
                  <Text style={styles.sectionBody}>{section.body}</Text>
                </View>
              ))}
              {extra}
            </ScrollView>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.closeButton, { bottom: insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET }]}
          onPress={onClose}
          activeOpacity={0.85}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={28} color={colors.textOnPrimary} />
        </TouchableOpacity>

        {/* Defensive fix, same as TabHub's own Modal -- see its comment for
            why navigationBarTranslucent alone isn't trusted here. */}
        <View style={[styles.navBarMask, { height: insets.bottom }]} pointerEvents="none" />
      </View>
    </Modal>
  );
}

// The one, consistent "what am I looking at" affordance for every page --
// an info-circle icon that opens a slide-up sheet explaining what the page
// is for, how to use it, and what the data on it actually means. Lives in
// ScreenHeader, to the left of that page's own title, so it reads as "this
// explains the thing right next to it" rather than a generic icon lost in
// a row of other icons. Sized larger than a typical inline icon for the
// same reason -- it's the leading element of the header now, not a small
// paired icon.
export function HelpButton({ pageTitle, sections }: { pageTitle: string; sections: HelpSection[] }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable onPress={() => setVisible(true)} hitSlop={12} accessibilityLabel={`About the ${pageTitle} page`}>
        <Ionicons name="information-circle-outline" size={32} color={colors.primary} />
      </Pressable>
      <HelpSheet visible={visible} onClose={() => setVisible(false)} pageTitle={pageTitle} sections={sections} />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  backdropTouchable: {
    flex: 1,
  },
  navBarMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
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
  scroll: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 12,
    // Enough room for the last section to clear the floating close
    // button rather than ending up permanently hidden behind it.
    paddingBottom: FLOATING_BUTTON_SIZE + 32,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    ...typography.label,
    color: colors.primary,
    marginBottom: 4,
  },
  sectionBody: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
