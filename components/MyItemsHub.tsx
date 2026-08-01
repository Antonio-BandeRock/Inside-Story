import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import {
  FLOATING_BUTTON_BOTTOM_OFFSET,
  FLOATING_BUTTON_SIZE,
  SECONDARY_HUB_CARD_LEFT_MARGIN,
  useBottomLeftHubPosition,
  useMenuCardBottom,
} from '../constants/floatingButton';
import { typography } from '../constants/typography';
import { IridescentRingCircle } from './IridescentRingCircle';
import { BUTTERFLY_WIDTH } from './TabHub';

// 2026-07-28: fills the gap deliberately left between the LensHub button
// and the butterfly -- a "My Foods"/"My Insights"/"My Schedules"/etc.
// shortcut into whatever's been saved/favorited for that page, the one
// action shaped the same way across every Lens (unlike the Lens picker
// itself, which is different content on every page). Same icon everywhere
// (bookmarks-outline, plural -- a personal library, not a single "save
// this one thing" bookmark), only the label (used for the popup's own
// header and accessibility only, see below) and this page's own tabColor
// vary.
//
// Deliberately smaller and unlabeled, 2026-07-28 -- explicitly asked not
// to read as prominently as the real corner icons (LensHub/TabHub): no
// visible text under it, and its own icon is sized at 2/3 of LensHub's
// corner icon (32px there -> 21px here), so it reads as a quieter, lesser
// shortcut rather than a third full-weight navigation button competing
// with the two real ones.
//
// Positioned at the midpoint of the real gap between LensHub's own button
// and the butterfly, not a fixed slot -- computed live from both of their
// actual positions (useBottomLeftHubPosition/windowWidth) rather than a
// guessed pixel offset, so it stays centered in that gap even if either
// button's own position ever changes.
//
// Genuinely generic still -- this component knows nothing about sides,
// favorites, or any other specific kind of saved item. A caller with real
// data to show (Food tab, as of 2026-08-01, is the first) passes it in via
// `sections`; a caller with nothing yet to show (Insights/Schedule/etc.,
// still) passes nothing and gets the original placeholder text, matching
// this app's established "coming soon" honesty rather than claiming a
// working feature that isn't there yet on THAT page.
export type MyItemsListEntry = { id: string; title: string; subtitle?: string };
export type MyItemsSection = {
  title: string;
  items: MyItemsListEntry[];
  // Shown in place of the list when this section has no items yet -- kept
  // per-section rather than one generic message, since "no sides saved
  // yet" and "nothing favorited yet" mean genuinely different things and
  // a caller may want to say so.
  emptyText: string;
};

export function MyItemsHub({
  label,
  tabColor,
  sections,
  onOpen,
}: {
  label: string;
  tabColor: string;
  sections?: MyItemsSection[];
  // Fires every time the popup opens, before anything renders -- lets the
  // caller refetch its own data live rather than showing whatever was
  // fetched once at mount, which could already be stale by the time this
  // is actually opened (e.g. right after saving a new side).
  onOpen?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const { left: lensHubLeft } = useBottomLeftHubPosition();
  const cardBottom = useMenuCardBottom();

  const rowBottom = insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET;
  const lensHubRight = lensHubLeft + FLOATING_BUTTON_SIZE;
  // The butterfly ARTWORK's own real left edge, not the smaller 60px
  // button box underneath it -- the artwork overhangs that box by
  // BUTTERFLY_OVERHANG_X on each side (see TabHub.tsx), so using the
  // button box alone put this button's own center too far right, close
  // enough to actually overlap the wing's real tip. BUTTERFLY_WIDTH is
  // the artwork's true full width, so half of it is its real edge.
  const tabHubLeft = windowWidth / 2 - BUTTERFLY_WIDTH / 2;
  const gapMidpointX = (lensHubRight + tabHubLeft) / 2;
  const buttonLeft = gapMidpointX - TOUCH_SIZE / 2;
  // Vertically centered within the same 60px-tall row LensHub/TabHub's own
  // buttons occupy, rather than sharing their `bottom` directly (this
  // button is shorter than that row, so bottom-aligning it would sit its
  // icon noticeably lower than theirs).
  const buttonBottom = rowBottom + (FLOATING_BUTTON_SIZE - TOUCH_SIZE) / 2;

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { bottom: buttonBottom, left: buttonLeft }]}
        onPress={() => {
          setOpen(true);
          onOpen?.();
        }}
        activeOpacity={0.85}
        accessibilityLabel={`${label}, your saved items`}
      >
        {open ? (
          <IridescentRingCircle size={RING_SIZE}>
            <Ionicons name="bookmarks-outline" size={ICON_SIZE} color={tabColor} style={CORNER_ICON_SHADOW} />
          </IridescentRingCircle>
        ) : (
          <Ionicons name="bookmarks-outline" size={ICON_SIZE} color={tabColor} style={CORNER_ICON_SHADOW} />
        )}
      </TouchableOpacity>

      {/* statusBarTranslucent/navigationBarTranslucent + the navBarMask
          below: see the identical comment on TabHub's/LensHub's own Modal
          -- same Android edge-to-edge gap, same fix, needed on every
          full-screen modal in this family. */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.card, { bottom: cardBottom, left: SECONDARY_HUB_CARD_LEFT_MARGIN, borderColor: tabColor }]}>
            <Text style={[styles.cardHeader, { color: tabColor }]} maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}>
              {label}
            </Text>
            {sections ? (
              <ScrollView style={styles.sectionsScroll} showsVerticalScrollIndicator={false}>
                {sections.map((section) => (
                  <View key={section.title} style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: tabColor }]}>{section.title}</Text>
                    {section.items.length > 0 ? (
                      section.items.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                          <Text style={styles.itemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {item.subtitle ? (
                            <Text style={styles.itemSubtitle} numberOfLines={1}>
                              {item.subtitle}
                            </Text>
                          ) : null}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>{section.emptyText}</Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>
                {"Nothing saved yet. Once you're able to save or favorite things here, they'll show up in this list."}
              </Text>
            )}
          </View>
          <View style={[styles.navBarMask, { height: insets.bottom }]} pointerEvents="none" />
        </View>
      </Modal>
    </>
  );
}

const LABEL_MAX_FONT_SCALE = 1.3;

// 2/3 of LensHub's own corner icon (32px) -- explicitly asked to read
// smaller/quieter than the real corner icons, not just as prominent.
const ICON_SIZE = 21;
// Smaller than the usual 44px minimum tap target, 2026-07-28 -- the real
// gap between LensHub and the butterfly's own wing is itself only ~26-72px
// wide depending on screen size (checked across 320-412dp), not enough
// room to center a 44px target in it without overlapping one of them on
// anything but a wide phone. 32px still gives this small icon a
// reasonably larger invisible tap zone than its own 21px, while actually
// fitting inside the gap with real clearance on typical (360dp+) screens.
// Only genuinely narrow (~320dp) devices are still tight -- a known,
// accepted edge case rather than solved outright, same tradeoff this
// app's own floating-button math already makes elsewhere.
const TOUCH_SIZE = 32;
// Proportional to ICON_SIZE the same way LensHub's own ring is to its
// 32px icon (roughly icon size + 6px of ring showing around it).
const RING_SIZE = ICON_SIZE + 15;

// Same stronger shadow LensHub.tsx's own corner button uses -- this one
// also sits directly on the flat dark footer strip, not a lighter card.
const CORNER_ICON_SHADOW = {
  textShadowColor: 'rgba(0, 0, 0, 0.9)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 5,
} as const;

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: TOUCH_SIZE,
    height: TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    // Same fix as TabHub.tsx/LensHub.tsx's own button style, same reason.
    elevation: 10,
    zIndex: 10,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.25)' },
  navBarMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  card: {
    position: 'absolute',
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    borderWidth: 2,
    width: 240,
    padding: 16,
    // Caps how tall the card can grow once real saved items exist --
    // sectionsScroll below is what actually scrolls once content exceeds
    // the room this leaves it (roughly this minus the header/padding).
    maxHeight: 320,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cardHeader: {
    ...typography.eyebrow,
    marginBottom: 8,
  },
  sectionsScroll: {
    maxHeight: 260,
  },
  section: {
    marginBottom: 10,
  },
  sectionHeader: {
    ...typography.captionEmphasis,
    marginBottom: 4,
  },
  itemRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  itemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
