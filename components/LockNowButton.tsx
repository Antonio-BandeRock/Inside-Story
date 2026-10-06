import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_SIZE, mirrorForHand, useBottomLeftHubPosition } from '../constants/floatingButton';
import { MENU_MAX_FONT_SCALE, menuLineHeight, typography } from '../constants/typography';
import { lockNow, readLockStateSync } from '../lib/appLockDevice';
import { useNavigationHand } from '../lib/navigationHand';

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
// under it, the name on two lines ("Lock", then "Now") by direct request,
// 1.0.60.12. 1.0.60.13, direct request: "make the lock icon the same size as
// the left one, but reduce the text size for Lock Now, and drop it down some,
// more like the Tab icons." So it is built the way LensHub's corner button
// is: a 32 icon in a slot the size of the whole button, with the name hanging
// below the button's box rather than squeezed inside it.
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
  const { bottom, left: placedLeft } = useBottomLeftHubPosition();
  const { width: windowWidth } = useWindowDimensions();
  const hand = useNavigationHand();
  // The same distance in from the far edge as the corner hub sits from the
  // near one, so Lock Now stays across from the thumb on either hand.
  const cornerInset = mirrorForHand(placedLeft, FLOATING_BUTTON_SIZE, windowWidth, hand);

  useFocusEffect(
    useCallback(() => {
      setShown(lockIsOn());
    }, []),
  );

  if (!shown) return null;
  return (
    <View style={[styles.row, hand === 'left' ? { bottom, right: cornerInset } : { bottom, left: cornerInset }]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() => void lockNow()}
        accessibilityRole="button"
        accessibilityLabel="Lock Now"
        accessibilityHint="Locks the app until the passcode or fingerprint opens it again"
      >
        <View style={styles.iconSlot}>
          <Ionicons name="lock-closed" size={32} color={colors.textSecondary} style={CORNER_ICON_SHADOW} />
        </View>
        <Text style={styles.label} numberOfLines={2} maxFontSizeMultiplier={MENU_MAX_FONT_SCALE}>
          {'Lock\nNow'}
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
  // The same box LensHub's corner button is: the icon slot fills it and the
  // name hangs past its bottom edge, which nothing reads as a boundary.
  button: {
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    fontSize: 9,
    lineHeight: menuLineHeight(9),
    marginTop: 2,
    // The box centres icon and name together, so a taller name would lift the
    // icon above the left one. Taking back the height this two-line name has
    // over LensHub's one line of 11 keeps the two icons level.
    marginBottom: menuLineHeight(11) - 2 * menuLineHeight(9),
    textAlign: 'center',
    flexShrink: 0,
    color: colors.textSecondary,
    // A fill of its own, the same colour as the footer strip under it, so the
    // name never depends on what is behind it (the no-bare-text rule).
    backgroundColor: colors.background,
    ...CORNER_ICON_SHADOW,
  },
});
