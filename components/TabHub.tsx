import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, iridescentSheen } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE } from '../constants/floatingButton';
import { TAB_ROUTES } from '../constants/tabs';
import { typography } from '../constants/typography';
import { useCurrentPageHelp } from './CurrentPageHelp';
import { HelpSheet } from './HelpButton';

const BUTTON_SIZE = FLOATING_BUTTON_SIZE;
const BOTTOM_OFFSET = FLOATING_BUTTON_BOTTOM_OFFSET;
// The butterfly artwork's own aspect ratio -- the image is rendered at
// this ratio rather than forced into BUTTON_SIZE's square, so nothing gets
// cropped. It renders larger than the tap target itself in both dimensions
// (see `overflow: visible` + `hitSlop` on the button below) so the
// *layout* footprint other floating hubs (LensHub, ScopeHub) position
// themselves against stays exactly BUTTON_SIZE -- only the visible artwork
// is larger.
//
// 2026-07-26: re-derived from the actual transparent PNG's content bounds
// (1606x1080), not the original 2340x1080 source photo's canvas size --
// the source canvas had a lot of empty margin around the butterfly, so
// using its raw dimensions understated how wide the real artwork is
// relative to its height. The crop that produced the current PNG was also
// centered on the artwork's real content bounds specifically because the
// butterfly wasn't centered in the original canvas (376px left margin vs
// 400px right, a real ~1-2px visible offset once scaled down) -- if this
// asset is ever regenerated from a new source image, recenter it the same
// way rather than assuming the source canvas itself is symmetric.
const BUTTERFLY_ASPECT_RATIO = 1606 / 1080;
const BUTTERFLY_WIDTH = 116;
const BUTTERFLY_HEIGHT = BUTTERFLY_WIDTH / BUTTERFLY_ASPECT_RATIO;
const BUTTERFLY_OVERHANG_X = Math.max(0, Math.ceil((BUTTERFLY_WIDTH - BUTTON_SIZE) / 2));
const BUTTERFLY_OVERHANG_Y = Math.max(0, Math.ceil((BUTTERFLY_HEIGHT - BUTTON_SIZE) / 2));
const ICON_PILL_SIZE = 34;

// 3 columns -- room for up to 9 icons across 3 rows before a 4th row would
// be needed. Sized just wide enough for a 3-column grid of small icons,
// not a percentage of screen width, so columns stay tight together
// instead of spreading out on a wider phone.
const CARD_WIDTH = 216;
const CARD_LEFT_MARGIN = 16;

// The single floating "hub" button that replaced the old 7-icon bottom tab
// bar -- stays bottom-center. The picker it opens is deliberately NOT
// centered under it, though -- it's anchored to the left edge instead, so
// the whole group of icons sits inside a left thumb's natural sweep for
// one-handed use. Swiping (see SwipeableTabScreen) remains the fast path
// between adjacent tabs; this is the fast path to anywhere else.
export function TabHub() {
  const [open, setOpen] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { currentHelp, activeTabPath } = useCurrentPageHelp();

  function go(path: Href) {
    setOpen(false);
    router.navigate(path);
  }

  function openHelpForCurrentPage() {
    setOpen(false);
    if (currentHelp) {
      setHelpVisible(true);
    }
  }

  // Profile isn't one of TAB_ROUTES (see constants/tabs.ts) -- it's a Stack
  // push outside the (tabs) group entirely, not a sibling screen in the
  // swipeable tab order, so it deliberately never registers an
  // activeTabPath the way a real tab does (see ScreenHeader's tabPath
  // comment). usePathname() directly is a fine, self-contained substitute
  // for this one exception rather than threading Profile through machinery
  // that's meant to stay scoped to actual tabs.
  const profileActive = pathname === '/profile';

  function openProfile() {
    setOpen(false);
    // push, not TabHub's own go()/navigate -- Profile is a Stack screen you
    // land on and back out of, not a sibling tab to switch to.
    router.push('/profile');
  }

  // The Info tile opens the help sheet for whichever page is currently
  // open (see openHelpForCurrentPage below) -- it should read as "about
  // THIS page," so it borrows that page's own identity color/sheen rather
  // than sitting permanently muted like a generic utility icon. No match
  // (e.g. activeTabPath hasn't been registered yet on a cold launch) falls
  // back to the same muted treatment Info always used before this.
  const activeRoute = TAB_ROUTES.find((route) => route.path === activeTabPath);

  const buttonBottom = insets.bottom + BOTTOM_OFFSET;
  const cardBottom = buttonBottom + BUTTON_SIZE + 12;

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { bottom: buttonBottom }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        accessibilityLabel="Open navigation menu"
        hitSlop={{ left: BUTTERFLY_OVERHANG_X, right: BUTTERFLY_OVERHANG_X, top: BUTTERFLY_OVERHANG_Y, bottom: BUTTERFLY_OVERHANG_Y }}
      >
        {/* No circle, no fill, no border -- the artwork itself is the
            button. Its own background was removed (see
            assets/branding/butterfly-transparent.png), so it sits directly
            on whatever the screen behind it is, rather than needing to
            color-match a solid backdrop. */}
        <Image
          source={require('../assets/branding/butterfly-transparent.png')}
          style={styles.butterflyImage}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* statusBarTranslucent/navigationBarTranslucent: Android's Modal opens
          as its own separate window, which does NOT inherit the main
          Activity's edge-to-edge configuration (see app.json's
          edgeToEdgeEnabled) -- without both of these, that window falls
          back to its own defaults: an opaque status bar AND an opaque
          (black) navigation bar, visible as a seam/bar in exactly the areas
          the OS's own icons sit, top and bottom, only while this modal is
          open. Both props are required together -- RN warns if only one is
          set, since Android itself requires the pair to make a dialog
          window fully edge-to-edge. */}
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
          <View style={[styles.card, { bottom: cardBottom, left: CARD_LEFT_MARGIN, width: CARD_WIDTH }]}>
            {TAB_ROUTES.map((route) => {
              // activeTabPath (see CurrentPageHelp.tsx), not the router's
              // own usePathname() -- Home is the tabs group's implicit
              // default tab (listed first in app/(tabs)/_layout.tsx), and
              // on a cold launch the router can still report the group's
              // own index path ('/', i.e. Meals) rather than '/home' even
              // while Home is what's actually on screen.
              const active = activeTabPath === route.path;
              // Each tab lights up in its own sampled jewel tone rather
              // than a shared brand color -- iridescence signals *which*
              // tab/field you're in, not just "this is active." Icon and
              // label use separate resting-state tokens (menuIconMuted vs.
              // menuLabelMuted) -- the icon was pushed darker to make the
              // active color pop by comparison, but the label text needs
              // to stay legible on its own, so it doesn't follow the icon
              // down.
              const iconColor = active ? route.color : colors.menuIconMuted;
              const labelColor = active ? route.color : colors.menuLabelMuted;
              return (
                <TouchableOpacity
                  key={route.title}
                  style={styles.item}
                  onPress={() => go(route.path)}
                  activeOpacity={0.7}
                >
                  {/* The pill is the real "selected" signal -- it appears
                      only on the active item, regardless of what its
                      color looks like to a given viewer. Color still
                      changes too (reinforcing, not replacing, the pill),
                      but someone who can't distinguish the hue at all
                      still sees exactly one icon sitting inside a filled
                      circle. Filled with the same iridescent sheen as
                      LensHub's corner button (constants/colors.ts's
                      iridescentSheen) rather than a flat tint, so "the
                      same coloration" is literal, not just similar. */}
                  <View style={styles.iconPill}>
                    {active ? (
                      <LinearGradient
                        colors={iridescentSheen(route.color)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                    ) : null}
                    <Ionicons name={route.icon} size={20} color={iconColor} />
                  </View>
                  <Text style={[styles.itemLabel, { color: labelColor }]} numberOfLines={1} ellipsizeMode="tail">
                    {route.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {/* Opens the help sheet for whichever page is currently open
                (see CurrentPageHelp) -- lets someone check "what does this
                page do" from the same picker they'd use to navigate,
                without first closing it and hunting for the info icon in
                the header. Colored in that page's own identity color
                (2026-07-25) rather than permanently muted -- unlike the
                tab items above, this one has no "inactive" state at all:
                it's always about whichever page you're already on, so it
                always shows that page's color/sheen, not just when a match
                happens to be "selected." */}
            <TouchableOpacity style={styles.item} onPress={openHelpForCurrentPage} activeOpacity={0.7}>
              <View style={styles.iconPill}>
                {activeRoute ? (
                  <LinearGradient
                    colors={iridescentSheen(activeRoute.color)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                ) : null}
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={activeRoute ? activeRoute.color : colors.menuIconMuted}
                />
              </View>
              <Text
                style={[styles.itemLabel, { color: activeRoute ? activeRoute.color : colors.menuLabelMuted }]}
                numberOfLines={1}
              >
                Info
              </Text>
            </TouchableOpacity>

            {/* 9th and last slot -- fills the 3x3 grid exactly (see
                CARD_WIDTH's comment, which already reserved room for this).
                Profile used to be reached from a person-icon in every
                screen's own top-right header (see ScreenHeader.tsx); it
                lives here instead now, with its own identity color
                (colors.tabProfile) like a real tab, rather than
                permanently muted like Info. It still isn't a real tab in
                constants/tabs.ts -- see profileActive's comment above for
                why -- so it doesn't participate in the swipe order. */}
            <TouchableOpacity key="profile" style={styles.item} onPress={openProfile} activeOpacity={0.7}>
              <View style={styles.iconPill}>
                {profileActive ? (
                  <LinearGradient
                    colors={iridescentSheen(colors.tabProfile)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                ) : null}
                <Ionicons
                  name="person-circle"
                  size={20}
                  color={profileActive ? colors.tabProfile : colors.menuIconMuted}
                />
              </View>
              <Text
                style={[styles.itemLabel, { color: profileActive ? colors.tabProfile : colors.menuLabelMuted }]}
                numberOfLines={1}
              >
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <HelpSheet
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        pageTitle={currentHelp?.title ?? ''}
        sections={currentHelp?.sections ?? []}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    alignSelf: 'center',
    // Layout footprint stays BUTTON_SIZE (a square) so LensHub/ScopeHub's
    // own position math, which is anchored relative to this exact size,
    // stays correct -- only the artwork rendered inside is allowed to
    // spill wider than the box (see overflow: 'visible' + hitSlop above).
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  butterflyImage: {
    width: BUTTERFLY_WIDTH,
    height: BUTTERFLY_HEIGHT,
    // No transform/nudge -- removed 2026-07-25. The -2px leftward nudge
    // that used to be here was always experimental ("just to see," not a
    // fix for a diagnosed bug -- pixel analysis at the time had already
    // shown the asset itself centered to within 1px, and attributed the
    // remaining perceived offset to the OS's own nav-bar button, not this
    // component). Removed because it's a real, deliberate leftward shift
    // with no bug behind it, and was reported as making the button look
    // off-center to the left after an unrelated header change drew a
    // closer look at this area.
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.25)' },
  // A compact card anchored to the left edge -- same small icon/label
  // sizing as before, wrapped into a tight 3-column grid with minimal
  // padding so the whole group of icons sits close together.
  card: {
    position: 'absolute',
    flexDirection: 'row',
    flexWrap: 'wrap',
    // colors.menuSurface, not colors.surface -- see the comment on that
    // token: surface's own blue hue was the real reason Schedules' icon
    // kept blending in, not a lack of darkness/lightness.
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  item: { width: '33.33%', alignItems: 'center', gap: 1, paddingVertical: 4 },
  iconPill: {
    width: ICON_PILL_SIZE,
    height: ICON_PILL_SIZE,
    borderRadius: ICON_PILL_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { ...typography.caption, fontSize: 10 },
});
