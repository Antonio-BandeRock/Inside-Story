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
// The pointer, shown until the button has actually been used, clears itself
// the moment the behaviour is learned rather than sitting there forever being
// ignored. It used to follow a larger welcome card that dimmed the screen;
// that card and its arrow were removed in 1.0.63.17 by direct request, which
// left the pointer as the one thing a new person sees, raised a little and
// written larger and lighter so it reads clearly against its own box.
//
// Deliberately NOT a Modal. A Modal paints above everything including the
// startup overlay (app/_layout.tsx renders DatabaseSetupScreen after the
// Stack), so a hint in a Modal would land on top of the loading screen on a
// cold launch. A plain absolutely-positioned View inside TabHub's own tree is
// covered by that overlay for free, and appears exactly when the app is ready.
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/colors';
import { FLOATING_BUTTON_SIZE } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { getVisualPreferences, setVisualPreferences } from '../lib/visualPreferences';

// Sits under the button's own zIndex/elevation of 10.
const POINTER_LAYER = 9;

// How far the pointer's box stands above the button: 1.0.63.17 raised it by
// about an eighth of an inch (20 dp), by direct request.
const POINTER_GAP = 26;

export type TabHubOnboardingState = {
  showPointer: boolean;
  markUsed: () => void;
};

export function useTabHubOnboarding(): TabHubOnboardingState {
  const [used, setUsed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void getVisualPreferences()
      .then((prefs) => {
        if (!active) return;
        setUsed(prefs.hasUsedTabHub);
      })
      .catch(() => {
        // A read that fails must not put a hint in front of someone on every
        // launch. Treated as already used, which fails quiet.
        if (!active) return;
        setUsed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const markUsed = useCallback(() => {
    setUsed((current) => {
      if (current) return current;
      void setVisualPreferences({ hasUsedTabHub: true, hasSeenTabHubWelcome: true }).catch(() => {});
      return true;
    });
  }, []);

  // Null while the preference read is still in flight. Nothing is shown then,
  // so the pointer cannot flash up and disappear on someone who has used this
  // app for weeks.
  return {
    showPointer: used === false,
    markUsed,
  };
}

export function TabHubPointer({ buttonBottom }: { buttonBottom: number }) {
  return (
    // pointerEvents none throughout: this sits directly above the button it is
    // pointing at, and a hint that swallows the tap it is asking for would be
    // worse than no hint.
    <View
      pointerEvents="none"
      style={[styles.pointerWrap, { bottom: buttonBottom + FLOATING_BUTTON_SIZE + POINTER_GAP, zIndex: POINTER_LAYER, elevation: POINTER_LAYER }]}
    >
      <View style={styles.pointerCard}>
        <Text style={styles.pointerText}>Tap here to move around the app</Text>
      </View>
      <Ionicons name="caret-down" size={18} color={colors.buttonColor} style={textShadow} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  // 1.0.63.17: was caption size in buttonColor, about 2.2:1 against
  // menuSurface. Body size in textPrimary reads at about 4.9:1.
  pointerText: {
    ...typography.body,
    ...textShadow,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
