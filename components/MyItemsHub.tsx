import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
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
import { getTabHubIconRenderSize } from '../constants/tabHubIcons';
import { typography } from '../constants/typography';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { IridescentRingCircle } from './IridescentRingCircle';

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
// favorites, salads, or any other specific kind of saved item, and never
// should: every Food builder is expected to eventually produce its own
// kind of saved/favorited thing, each wanting its own Insights lens later
// (see app/food-items.tsx's own comment for the fuller picture). This
// popup's own job stays fixed regardless of how many builders exist --
// show whatever CATEGORIES the caller currently has real data for, as
// plain tappable links, and get out of the way. A caller with real
// categories to show (Food tab, as of 2026-08-01, is the first, with
// "Saved Sides"/"Favorite Sides") passes them via `categories`; a caller
// with nothing yet (Insights/Schedule/etc., still) passes nothing and
// gets the original placeholder text, matching this app's established
// "coming soon" honesty rather than claiming a working feature that isn't
// there yet on THAT page.
//
// 2026-08-01: this used to show each category's items inline, expanded,
// with no way to tap into any of them -- replaced with plain links out to
// a real list screen (see onPress) after being reported as "nothing is
// selectable." A category with a real onPress handler is what actually
// lets a person get somewhere; showing five saved sides' names inline in
// a cramped popup never did.
export type MyItemsCategory = {
  id: string;
  label: string;
  // How many real items are in this category, if known -- shown as a
  // quiet count next to the label (e.g. "Saved Sides · 3") so a person can
  // tell at a glance whether a category is worth opening, without having
  // to open every one just to check.
  count?: number;
  onPress: () => void;
};

export function MyItemsHub({
  label,
  tabColor,
  categories,
  onOpen,
  open: controlledOpen,
  onOpenChange,
}: {
  label: string;
  tabColor: string;
  categories?: MyItemsCategory[];
  // Fires whenever the popup genuinely OPENS (transitions from closed to
  // open) -- lets the caller refetch its own data live rather than showing
  // whatever was fetched once at mount, which could already be stale by
  // the time this is actually opened (e.g. right after saving a new side).
  // Detected via a real open-transition effect below, not just the
  // button's own onPress -- so it fires the same way regardless of WHICH
  // real trigger actually opened this popup (this button, or an external
  // `open` flip, see below).
  onOpen?: () => void;
  // 2026-08-16, both optional: lets a parent screen open this SAME popup
  // itself, from outside the button below -- added for LensHub's own new
  // extraTile prop (see that component), which needs to close ITSELF first
  // and only then open this one, at its own already-established position,
  // rather than the two popups appearing at the same instant. Every
  // existing "My X" hub built before this keeps working exactly as it
  // always has, fully self-contained with its own internal open/close
  // state and no parent involvement at all -- only a caller that actually
  // passes BOTH of these switches this instance over to being externally
  // controlled (the standard React controlled/uncontrolled split).
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [internalOpen, setInternalOpen] = useState(false);
  // Whichever half of the controlled/uncontrolled split actually applies --
  // decided once per render by whether the caller passed a real `open`
  // value at all (undefined means "not controlling this," never a
  // deliberate `false` from a caller that DOES want control -- every real
  // controlled caller always passes a real boolean either way).
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;
  // Fires onOpen on a real false -> true transition only, regardless of
  // which of the two paths above caused it -- a plain ref-tracked
  // comparison (not a [open] dependency array) so an unstable `onOpen`
  // function identity from the caller (food.tsx's own loadMyFoodsCounts is
  // a fresh reference every render, not useCallback-wrapped) can never
  // cause this to re-fire on an unrelated re-render; it only ever runs
  // again once `open` itself has genuinely gone false and come back true.
  const previousOpenRef = useRef(open);
  useEffect(() => {
    if (open && !previousOpenRef.current) {
      onOpen?.();
    }
    previousOpenRef.current = open;
  });
  const { left: lensHubLeft } = useBottomLeftHubPosition();
  const cardBottom = useMenuCardBottom();
  // 2026-08-09: the TabHub button's own real artwork width now depends on
  // which icon is currently chosen (see TabHub.tsx's own 2026-08-09
  // comment) -- reads the same live preference and calls the same shared
  // getTabHubIconRenderSize function TabHub.tsx itself uses, rather than
  // importing a value from that component that could only ever reflect
  // the default butterfly.
  const { tabHubIcon } = useVisualPreferences();
  const { width: tabHubIconWidth } = getTabHubIconRenderSize(tabHubIcon);

  const rowBottom = insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET;
  const lensHubRight = lensHubLeft + FLOATING_BUTTON_SIZE;
  // The currently-showing icon's own real left edge, not the smaller 60px
  // button box underneath it -- the artwork overhangs that box on each
  // side (see TabHub.tsx), so using the button box alone put this
  // button's own center too far right, close enough to actually overlap
  // the artwork's real edge. tabHubIconWidth is that artwork's true full
  // width, so half of it is its real edge.
  const tabHubLeft = windowWidth / 2 - tabHubIconWidth / 2;
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
        onPress={() => setOpen(true)}
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
            {categories ? (
              <ScrollView style={styles.categoriesScroll} showsVerticalScrollIndicator={false}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryRow}
                    onPress={() => {
                      setOpen(false);
                      category.onPress();
                    }}
                  >
                    <Text style={styles.categoryLabel} numberOfLines={1}>
                      {category.label}
                      {category.count !== undefined ? ` · ${category.count}` : ''}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={tabColor} />
                  </TouchableOpacity>
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
  categoriesScroll: {
    maxHeight: 260,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
