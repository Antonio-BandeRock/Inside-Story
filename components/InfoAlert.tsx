import { useCallback, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { NAVIGATION_HAND } from '../constants/floatingButton';
import { typography } from '../constants/typography';

type InfoAlertRequest = { title: string; message: string };

// Reusable replacement for Alert.alert(title, message) wherever a screen
// wants its own tap-a-label-for-more-detail popups -- Insights' own Food
// Lookup results table (Per 100g/Portion/% RDA) is the first of these, and
// is meant to be the template every future lookup-style screen on other
// tabs reuses, not a one-off. Unlike the OS's own Alert.alert, this is a
// real <Modal> drawn by the app itself, which is what lets its OK button be
// hand-aware -- mirrored to whichever side NAVIGATION_HAND says the
// person's thumb rests on, the same idea as AppKeyboard's own Next/Done
// row -- something a real system alert's own button placement can never be
// told to do.
//
// Usage: const [showInfoAlert, infoAlertElement] = useInfoAlert(); then
// call showInfoAlert(title, message) from any onPress, and render
// {infoAlertElement} once, anywhere, in that same component's JSX.
export function useInfoAlert(): [(title: string, message: string) => void, ReactNode] {
  const [request, setRequest] = useState<InfoAlertRequest | null>(null);

  // useCallback with empty deps -- setRequest is React's own stable
  // setter, so this reference never changes across renders. Matters
  // because callers often need to pass showInfoAlert itself into their own
  // memoized callbacks (see insights.tsx's own showPortionInfo, which is
  // memoized for exactly this reason); an unstable reference here would
  // defeat that memoization and reintroduce the same infinite-render loop
  // it exists to prevent.
  const showInfoAlert = useCallback((title: string, message: string) => {
    setRequest({ title, message });
  }, []);

  function close() {
    setRequest(null);
  }

  const element = (
    <Modal visible={request !== null} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View style={styles.card}>
          <Text style={styles.title}>{request?.title}</Text>
          <ScrollView style={styles.messageScroll}>
            <Text style={styles.message}>{request?.message}</Text>
          </ScrollView>
          {/* Mirrors AppKeyboard's own Next/Done row -- whichever side
              NAVIGATION_HAND says the person's thumb rests on is where OK
              sits, rather than a fixed corner every hand has to reach
              across for. */}
          <View style={[styles.buttonRow, { justifyContent: NAVIGATION_HAND === 'left' ? 'flex-start' : 'flex-end' }]}>
            <Pressable style={styles.okButton} onPress={close} hitSlop={8}>
              <Text style={styles.okButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return [showInfoAlert, element];
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  // menuSurface, not the translucent colors.surface content cards use --
  // this is chrome (an app-drawn system-alert stand-in), not page content,
  // same reasoning already on record for AppKeyboard/TabHub's own surface.
  card: {
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
  },
  title: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    fontSize: 18,
    marginBottom: 10,
  },
  messageScroll: {
    marginBottom: 16,
  },
  message: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  buttonRow: {
    flexDirection: 'row',
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
  },
});
