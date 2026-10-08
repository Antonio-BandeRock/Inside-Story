// Low Stimulation from the edge, 1.0.63.18 (2026-10-07). Direct request: "Make
// the Low Stimulation function happen from a second button on the left side
// above the Capture recording button ... instead of it instantly changing,
// the user can select if they want the setting enabled or not, after a short
// explanation of what happens when it is enabled that is basically the same
// size and placement as the LensHub menus of icons ... this one will not be
// on a time out setting, it will allow the user to scroll through what it
// does and then they choose to turn it on or cancel to close the text box."
//
// An edge tab on the thumb side, stacked above the quick voice note's tab
// (components/QuickCaptureButton.tsx), and above the thumb search tab too
// while that one is showing, so the three never land on each other. A tap
// opens a card in the place and at the size of a LensHub menu, holding what
// Low Stimulation does (lib/lowStimulationWords.ts, the same words Profile
// shows) and two buttons. Nothing changes until one of them is pressed.
import { Ionicons } from '@expo/vector-icons';
import { useState, useSyncExternalStore } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFooterBandHeight, useHubMenuCardSpan, useMenuCardBottom, useMenuCardFit } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { isDesktopApp } from '../lib/desktop/bridge';
import { LOW_STIMULATION_INTRO, LOW_STIMULATION_PARTS } from '../lib/lowStimulationWords';
import { useNavigationHand } from '../lib/navigationHand';
import { hasThumbSearch, subscribeThumbSearch } from '../lib/thumbSearch';
import { modalAnimationType, setLowStimulation } from '../lib/visualPreferences';
import { EDGE_TAB_HEIGHT, EdgeTab } from './EdgeTab';
import { cardHeightFor } from './LensHub';

// The voice note tab sits 8 above the footer; this one sits a tab and a gap
// above it, and one more above that while the thumb search tab is showing.
const ONE_STEP = EDGE_TAB_HEIGHT + 8;

export function LowStimulationButton() {
  const hand = useNavigationHand();
  const footerHeight = useFooterBandHeight();
  const prefs = useVisualPreferences();
  const searchShowing = useSyncExternalStore(subscribeThumbSearch, hasThumbSearch, hasThumbSearch);
  const [open, setOpen] = useState(false);

  const { fontScale } = useWindowDimensions();
  const { left, width } = useHubMenuCardSpan();
  const sheetBottom = useMenuCardBottom();
  const fit = useMenuCardFit(cardHeightFor(fontScale), 200);

  const on = prefs.lowStimulation;
  const steps = searchShowing && !isDesktopApp() ? 2 : 1;
  const bottom = footerHeight + 8 + steps * ONE_STEP;

  function choose() {
    setOpen(false);
    void setLowStimulation(!on);
  }

  return (
    <>
      <EdgeTab
        side={hand}
        bottom={bottom}
        onPress={() => setOpen(true)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel={on ? 'Low Stimulation is on' : 'Low Stimulation'}
        accessibilityHint="Explains Low Stimulation and asks before changing it"
      >
        <Ionicons name={on ? 'moon' : 'moon-outline'} size={18} color={colors.textPrimary} />
      </EdgeTab>
      <Modal
        visible={open}
        transparent
        animationType={modalAnimationType('fade')}
        onRequestClose={() => setOpen(false)}
      >
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessible={false} />
          <View style={[styles.sheet, { left, width, bottom: sheetBottom, height: fit.height }]}>
            <Text style={styles.title}>{on ? 'Low Stimulation is on' : 'Low Stimulation'}</Text>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <Text style={styles.body}>{LOW_STIMULATION_INTRO}</Text>
              {LOW_STIMULATION_PARTS.map((part) => (
                <View key={part.title} style={styles.part}>
                  <Text style={styles.partTitle}>{part.title}</Text>
                  <Text style={styles.body}>{part.text}</Text>
                </View>
              ))}
              {on ? (
                <Text style={styles.body}>
                  Turning it off brings back your backgrounds and movement as you had them.
                </Text>
              ) : null}
            </ScrollView>
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.quietButton} activeOpacity={0.85} onPress={() => setOpen(false)}>
                <Text style={styles.quietButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={choose}>
                <Text style={styles.buttonText}>{on ? 'Turn Off' : 'Turn On'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: { ...typography.bodyEmphasis, fontSize: 16, fontWeight: '400', color: colors.textPrimary, marginBottom: 8, ...textShadow },
  scroll: { flex: 1 },
  scrollContent: { gap: 10, paddingBottom: 4 },
  part: { gap: 2 },
  partTitle: { ...typography.bodyEmphasis, fontWeight: '400', color: colors.textPrimary, ...textShadow },
  body: { ...typography.body, color: colors.textSecondary, ...textShadow },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnPrimary,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  quietButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quietButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
});
