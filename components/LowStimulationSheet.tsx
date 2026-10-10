// Low Stimulation from the edge, 1.0.63.18 (2026-10-07). Direct request: "Make
// the Low Stimulation function happen from a second button on the left side
// above the Capture recording button ... instead of it instantly changing,
// the user can select if they want the setting enabled or not, after a short
// explanation of what happens when it is enabled that is basically the same
// size and placement as the LensHub menus of icons ... this one will not be
// on a time out setting, it will allow the user to scroll through what it
// does and then they choose to turn it on or cancel to close the text box."
//
// Since 1.0.66.6 it is one of the four choices in the quick-access menu on
// the thumb side (components/QuickAccessButton.tsx) rather than an edge tab
// of its own. Choosing it opens a card in the place and at the size of a
// LensHub menu, holding what Low Stimulation does (lib/lowStimulationWords.ts,
// the same words Profile shows) and two buttons. Nothing changes until one of them is pressed.
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { colors } from '../constants/colors';
import { useHubMenuCardSpan, useMenuCardBottom, useMenuCardFit } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { LOW_STIMULATION_INTRO, LOW_STIMULATION_PARTS } from '../lib/lowStimulationWords';
import { subscribeQuickAccess } from '../lib/quickAccess';
import { modalAnimationType, setLowStimulation } from '../lib/visualPreferences';
import { cardHeightFor } from './LensHub';

export function LowStimulationSheet() {
  const prefs = useVisualPreferences();
  const [open, setOpen] = useState(false);
  useEffect(
    () =>
      subscribeQuickAccess((sheet) => {
        if (sheet === 'lowStimulation') setOpen(true);
      }),
    [],
  );

  const { fontScale } = useWindowDimensions();
  const { left, width } = useHubMenuCardSpan();
  const sheetBottom = useMenuCardBottom();
  const fit = useMenuCardFit(cardHeightFor(fontScale), 200);

  const on = prefs.lowStimulation;

  function choose() {
    setOpen(false);
    void setLowStimulation(!on);
  }

  return (
    <>
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
