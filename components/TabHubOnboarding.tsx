// Saying what the TabHub button is, to someone who has never opened this app.
//
// 2026-09-03, reported through a first-time reader: the button that reaches
// all nine tabs does not look like a button. That is not an accident of the
// artwork, it is deliberate (see TabHub.tsx: "No circle, no fill, no border at
// rest -- the artwork itself is the button"), and it reads beautifully once
// you know what it does. Until then it is a drawing of a seed at the bottom of
// the screen, and every tool in the app is behind it.
//
// The secondary hub already names itself: GatedTabContent renders a resting
// prompt on every tab saying to tap the corner button. The primary one, the
// one that moves you between tabs at all, said nothing anywhere.
//
// Two pieces, in sequence, because they answer different questions:
//
//   1. The welcome, once ever. Dims the screen and leaves the button lit, so
//      the first thing anyone sees is the thing they need to press.
//   2. The pointer, until the button has actually been used. Someone who
//      dismissed the welcome without reading it is not left with nothing, and
//      it clears itself the moment the behaviour is learned rather than
//      sitting there forever being ignored.
//
// Deliberately NOT a Modal. A Modal paints above everything including the
// startup overlay (app/_layout.tsx renders DatabaseSetupScreen after the
// Stack), so a welcome in a Modal would land on top of the loading screen on a
// cold launch. A plain absolutely-positioned View inside TabHub's own tree is
// covered by that overlay for free, and appears exactly when the app is ready.
//
// The spotlight needs no masking either: this dim sits at a lower zIndex than
// the button's own (10), so the button paints over it and stays lit while
// everything else darkens.
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../constants/colors';
import { FLOATING_BUTTON_SIZE } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { getVisualPreferences, setVisualPreferences } from '../lib/visualPreferences';

// Sits under the button's own zIndex/elevation of 10, which is what leaves the
// button lit while the rest of the screen dims.
const DIM_LAYER = 9;

export type TabHubOnboardingState = {
  showWelcome: boolean;
  showPointer: boolean;
  dismissWelcome: () => void;
  markUsed: () => void;
};

export function useTabHubOnboarding(): TabHubOnboardingState {
  const [seenWelcome, setSeenWelcome] = useState<boolean | null>(null);
  const [used, setUsed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void getVisualPreferences()
      .then((prefs) => {
        if (!active) return;
        setSeenWelcome(prefs.hasSeenTabHubWelcome);
        setUsed(prefs.hasUsedTabHub);
      })
      .catch(() => {
        // A read that fails must not put a welcome overlay in front of someone
        // on every launch. Treated as "already seen", which fails quiet rather
        // than failing loud on the one control the whole app depends on.
        if (!active) return;
        setSeenWelcome(true);
        setUsed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const dismissWelcome = useCallback(() => {
    setSeenWelcome(true);
    void setVisualPreferences({ hasSeenTabHubWelcome: true }).catch(() => {});
  }, []);

  const markUsed = useCallback(() => {
    // Tapping the button settles both questions at once: someone who found it
    // on their own never needs the welcome either.
    setUsed((current) => {
      if (current) return current;
      void setVisualPreferences({ hasUsedTabHub: true, hasSeenTabHubWelcome: true }).catch(() => {});
      return true;
    });
    setSeenWelcome(true);
  }, []);

  // Null while the preference read is still in flight. Nothing is shown then,
  // so neither piece can flash up and disappear on someone who has used this
  // app for weeks.
  return {
    showWelcome: seenWelcome === false && used === false,
    showPointer: seenWelcome === true && used === false,
    dismissWelcome,
    markUsed,
  };
}

export function TabHubWelcome({ buttonBottom, onDismiss }: { buttonBottom: number; onDismiss: () => void }) {
  return (
    <View style={[styles.dim, { zIndex: DIM_LAYER, elevation: DIM_LAYER }]}>
      {/* Anywhere on the dim dismisses. Someone who has understood it in the
          first second should not have to find a particular target to leave. */}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onDismiss} />
      <View style={[styles.welcomeCard, { bottom: buttonBottom + FLOATING_BUTTON_SIZE + 28 }]}>
        <Text style={styles.welcomeTitle}>Everything is behind this button</Text>
        <Text style={styles.welcomeBody}>
          Tap it to move between Home, Food, Schedules, Trends and the rest. It stays at the bottom of every screen, so
          you can always get anywhere from wherever you are.
        </Text>
        <TouchableOpacity style={styles.welcomeAction} activeOpacity={0.85} onPress={onDismiss}>
          <Text style={styles.welcomeActionText}>Got it</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.welcomeArrow, { bottom: buttonBottom + FLOATING_BUTTON_SIZE + 4 }]}>
        <Ionicons name="arrow-down" size={22} color={colors.buttonColor} style={textShadow} />
      </View>
    </View>
  );
}

export function TabHubPointer({ buttonBottom }: { buttonBottom: number }) {
  return (
    // pointerEvents none throughout: this sits directly above the button it is
    // pointing at, and a hint that swallows the tap it is asking for would be
    // worse than no hint.
    <View
      pointerEvents="none"
      style={[styles.pointerWrap, { bottom: buttonBottom + FLOATING_BUTTON_SIZE + 6, zIndex: DIM_LAYER, elevation: DIM_LAYER }]}
    >
      <View style={styles.pointerCard}>
        <Text style={styles.pointerText}>Tap here to move around the app</Text>
      </View>
      <Ionicons name="caret-down" size={18} color={colors.buttonColor} style={textShadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  welcomeCard: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: colors.menuSurface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.buttonColor,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 10,
  },
  welcomeTitle: {
    ...typography.sectionTitle,
    ...textShadow,
    color: colors.buttonColor,
  },
  welcomeBody: {
    ...typography.body,
    ...textShadow,
    color: colors.textPrimary,
  },
  welcomeAction: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: colors.buttonColor,
  },
  welcomeActionText: {
    ...typography.label,
    ...textShadow,
    color: colors.textOnButton,
  },
  welcomeArrow: {
    position: 'absolute',
    alignSelf: 'center',
  },
  pointerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pointerCard: {
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.buttonColor,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 1,
  },
  pointerText: {
    ...typography.caption,
    ...textShadow,
    color: colors.buttonColor,
  },
});
