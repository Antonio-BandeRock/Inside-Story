// A real, app-styled replacement for a native Alert.alert action list --
// 2026-08-15 direct request, given right after real on-device testing of
// the meal-photo feature: "Can we override the system message look in the
// Add a Photo where it has Cancel, Choose from Library, and Take a Photo
// so that it matches the app generic colors combination chosen in Profile
// appearance and navigation." A plain Alert.alert is rendered by the OS,
// not this app -- there is no way to restyle it at all. This is a real,
// in-app dialog instead, built on the same OverlayContext portal every
// other floating menu in this app already uses (Dropdown.tsx,
// PopoverSelect.tsx), so it escapes ScreenBackground.tsx's own
// overflow:hidden clipping the same proven way, rather than reaching for
// RN's own <Modal> (also used elsewhere in this app, but OverlayContext is
// this app's more recent, more deliberate answer to exactly this "float
// something above a clipped screen" need, and the one every other custom
// action menu in the app already trusts).
//
// Styled from the person's own real genericPalette choice (Profile's
// Appearance & Navigation section -- the one actual per-user "color
// combination" that section lets someone pick; see GenericBackground.tsx's
// own header comment for why that palette exists, and its own real hex
// values, reused directly via GENERIC_BACKGROUND_PALETTES rather than
// duplicated here). Deliberately no entrance animation: this app's own
// history holds more than one real, hard-won multi-day investigation into
// an Android animation/portal-timing freeze (see PopoverSelect.tsx's own
// dated comments on exactly that) -- a plain, instant conditional render,
// the same approach every other overlay in this app already uses, carries
// none of that risk.
//
// A real, reusable primitive, not a one-off for the photo picker
// specifically -- any future "pick one of a few real choices" moment that
// currently reaches for Alert.alert's own action-sheet shape can use this
// instead.
import { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { GENERIC_BACKGROUND_PALETTES } from './GenericBackground';
import { useOverlay } from './OverlayContext';

export type AppActionSheetAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

export function AppActionSheet({
  visible,
  onClose,
  title,
  actions,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: AppActionSheetAction[];
}) {
  const { showOverlay, hideOverlay } = useOverlay();
  const visualPrefs = useVisualPreferences();
  const scheme = GENERIC_BACKGROUND_PALETTES[visualPrefs.genericPalette];

  function handleSelect(action: AppActionSheetAction) {
    onClose();
    action.onPress();
  }

  const sheetNode = visible ? (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.centerWrap} pointerEvents="box-none">
        <View style={[styles.card, { borderColor: scheme.blobs[1] }]}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: scheme.gradient[1] }]} pointerEvents="none" />
          <View style={[styles.glow, { backgroundColor: scheme.blobs[0] }]} pointerEvents="none" />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {actions.map((action, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.row,
                pressed ? { backgroundColor: `${scheme.blobs[1]}33` } : null,
              ]}
              onPress={() => handleSelect(action)}
            >
              <Text style={[styles.rowText, action.destructive ? { color: colors.danger } : null]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  ) : null;

  // Same real, deliberate pattern PopoverSelect.tsx already uses for this
  // exact overlay mechanism (see that file's own 2026-08-14 comment): a
  // synchronous useLayoutEffect, not a plain useEffect, so this update
  // can't be deprioritized behind other scheduled work and show up late.
  useLayoutEffect(() => {
    if (visible) {
      showOverlay(sheetNode);
    } else {
      hideOverlay();
    }
  });

  // Defensive: if this unmounts while its own sheet is still open (the
  // screen it's on navigates away mid-choice), don't leave the overlay
  // showing with no owner left to close it.
  useLayoutEffect(
    () => () => hideOverlay(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return null;
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 18,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -80,
    right: -60,
    opacity: 0.22,
  },
  title: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
    marginBottom: 6,
  },
  rowText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
