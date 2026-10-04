import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_SIZE, useBottomLeftHubPosition } from '../constants/floatingButton';
import { MENU_MAX_FONT_SCALE, typography } from '../constants/typography';
import { lockNow, readLockStateSync } from '../lib/appLockDevice';

// Lock Now on Home, 2026-10-03, direct request: "A lock now button, maybe on
// the Home screen in the bottom right corner to the right of the TabHub menu
// icon would be a good place to put a lock now button so it becomes useful
// instead of annoying that they have to go search for it."
//
// Home is the one tab without the corner box that says where you are, so the
// bottom right is free there. The button is the mirror image of the corner
// menu button on the left, 1.0.60.11, direct request: "the same distance from
// the TabHub menu icon as the left side Tab icons." TabHub is centered, so
// standing as far in from the right edge as that button stands from the left
// puts it the same distance from TabHub, on a phone and on the computer alike.
// It is level with that button and drawn the same way: an icon with its name
// under it.
// It shows only while App Lock is on, and is read again whenever Home comes
// back into view, so turning the lock on or off in Profile is reflected
// without a restart. Profile > App Lock keeps its own Lock Now as well.

// The same strong shadow LensHub's corner button uses on this dark strip.
const CORNER_ICON_SHADOW = {
  textShadowColor: 'rgba(0, 0, 0, 0.9)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 5,
} as const;

function lockIsOn(): boolean {
  return readLockStateSync()?.phase === 'on';
}

export function LockNowButton() {
  const [shown, setShown] = useState(lockIsOn);
  const { bottom, left: cornerInset } = useBottomLeftHubPosition();

  useFocusEffect(
    useCallback(() => {
      setShown(lockIsOn());
    }, []),
  );

  if (!shown) return null;
  return (
    <View style={[styles.row, { bottom, right: cornerInset }]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() => void lockNow()}
        accessibilityRole="button"
        accessibilityLabel="Lock Now"
        accessibilityHint="Locks the app until the passcode or fingerprint opens it again"
      >
        <Ionicons name="lock-closed" size={28} color={colors.textSecondary} style={CORNER_ICON_SHADOW} />
        <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={MENU_MAX_FONT_SCALE}>
          Lock Now
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    zIndex: 10,
  },
  // A fill of its own, the same colour as the footer strip under it, so the
  // label never depends on what is behind it (the no-bare-text rule).
  button: {
    minWidth: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
    flexShrink: 0,
    color: colors.textSecondary,
    ...CORNER_ICON_SHADOW,
  },
});
