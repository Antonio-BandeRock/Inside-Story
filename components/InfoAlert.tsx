import { useCallback, useState, type ReactNode } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { NAVIGATION_HAND } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';

type InfoAlertRequest = { title: string; message: string };

// Matches a real http(s) URL up to the next whitespace or a trailing
// close-paren -- citation text in this app sometimes wraps a URL in
// parens ("(see https://example.com)"), and without excluding ")" that
// would get swallowed into the link text/target itself.
const URL_PATTERN = /https?:\/\/[^\s)]+/g;

// Turns any real URL inside `text` into a real, tappable link (opens the
// device's own browser via Linking) instead of just being inert citation
// text a person can't act on -- 2026-08-02, explicitly requested: sources
// cited elsewhere in this app (see lib/sixDimensionsReference.ts's own
// SUB_CRITERION_SOURCES) are meant to be checkable, not just named.
// Exported (not just used inline below) so the same treatment applies
// everywhere source citation text renders, not only inside this
// component's own popup -- Insights' own SixDsView/PrepView (see
// app/(tabs)/insights.tsx) render the identical getSubCriterionSources()
// strings directly in a plain Text, not through useInfoAlert at all, and
// need this exact same linkification, not a second implementation.
export function linkifyText(text: string, linkStyle: object = styles.link): ReactNode[] {
  const parts = text.split(URL_PATTERN);
  const urls = text.match(URL_PATTERN) ?? [];
  const nodes: ReactNode[] = [];
  parts.forEach((part, index) => {
    if (part) nodes.push(part);
    const url = urls[index];
    if (url) {
      nodes.push(
        <Text key={url + index} style={linkStyle} onPress={() => Linking.openURL(url)}>
          {url}
        </Text>,
      );
    }
  });
  return nodes;
}

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
            <Text style={styles.message}>{request ? linkifyText(request.message) : null}</Text>
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
    ...textShadow,
  },
  messageScroll: {
    marginBottom: 16,
  },
  message: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 21,
    ...textShadow,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
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
