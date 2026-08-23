import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import {
  FLOATING_BUTTON_BOTTOM_OFFSET,
  FLOATING_BUTTON_SIZE,
  NAVIGATION_HAND,
  SECONDARY_HUB_CARD_LEFT_MARGIN,
} from '../constants/floatingButton';
import { getTabHubIconRenderSize } from '../constants/tabHubIcons';
import { TAB_ROUTES } from '../constants/tabs';
import { textShadow, typography } from '../constants/typography';
import { useVisualPreferences } from '../hooks/useVisualPreferences';

// 2026-07-25: the page title and sub-tab label (e.g. "Insights" / "6
// Dimensions") used to live in ScreenHeader, top of screen, next to the
// help icon. Both moved down here, to the bottom corner OPPOSITE wherever
// the floating hubs (TabHub/LensHub/ScopeHub) sit, specifically so they
// never compete for space with those buttons, without the buttons
// themselves ever being resized to make room.
//
// 2026-07-27: the page title line itself was removed -- LensHub's own
// corner trigger now shows that same page name below its icon (see
// LensHub.tsx's own buttonLabel), which made repeating it here purely
// redundant. `title` is still required, though: it's the only way this
// knows which page it belongs to, needed to look up that page's own
// identity color/icon from TAB_ROUTES (must match a `title` there exactly,
// same contract as LensHub/GatedTabContent's own `pageTitle` prop).
//
// 2026-07-28: also carried GatedTabContent.tsx's own former on-page
// resting prompt ("Tap the [icon] button to select a function"), in a
// real bordered box (border = this page's own tabColor; no fill, so
// whatever's already behind it shows straight through).
//
// 2026-08-08: that resting-prompt text removed entirely -- explicitly
// requested, once LensHub itself started auto-opening on arrival from
// TabHub (see LensHub.tsx's own `autoOpenSignal`): "we won't need to have
// the little box... telling them to Tap the (icon) button to select a
// function," since the popup is already open by the time anyone would
// read it. This component now renders nothing at all (see the early
// `return null` below) until a real lens is actually selected -- the
// "which lens am I in" box (activeLensLabel) is the one job left here,
// and it's unaffected by this change, still shown for every lens on
// every tab as before. The box's own positioning math below is otherwise
// unchanged, still matching the exact same buffers the butterfly artwork
// already keeps elsewhere in the footer:
// - bottom/top edges: exactly the butterfly's own bottom/top edges (same
//   buffer from the system nav bar as the butterfly has below it, same
//   buffer from the footer's iridescent line as the butterfly has above
//   it) -- see boxBottom/boxHeight below.
// - near-butterfly edge: butterfly's own edge on that side, plus that
//   SAME vertical buffer amount again (reused horizontally, not a second
//   separately-tuned gap).
// - far edge (away from the butterfly): SECONDARY_HUB_CARD_LEFT_MARGIN,
//   the same inset every other content box in this app already uses as
//   its own edge margin (see e.g. schedule.tsx/log.tsx's own shared
//   `bodyContent: { padding: 16 }`) -- this box's far edge reaches
//   exactly as far as any of those already do, no further.
//
// Left/right sides swap with NAVIGATION_HAND, not hardcoded to the right
// -- today (hand: 'left') the hub buttons cluster left of the butterfly
// and this box sits on the right, same as it always has. If that deferred
// handedness toggle (see NAVIGATION_HAND's own comment) ever actually
// flips to 'right', the buttons would cluster right of the butterfly
// instead, and this box needs to become a true mirror image on the left
// -- not just re-centered, its near/far edges swap sides too.
export function PageIdentityLabel({ title, activeLensLabel }: { title: string; activeLensLabel?: string }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const tabRoute = TAB_ROUTES.find((route) => route.title === title);
  const tabColor = tabRoute?.color ?? colors.primary;
  // 2026-08-09: this box positions itself relative to the TabHub button's
  // own real artwork edges -- since that artwork's real size now depends
  // on which icon is currently chosen (see TabHub.tsx's own 2026-08-09
  // comment), this reads the same live preference and calls the same
  // shared getTabHubIconRenderSize function TabHub.tsx itself uses, rather
  // than importing a value from that component that could only ever
  // reflect the default butterfly. Called unconditionally, before the
  // early return below, per the Rules of Hooks.
  const { tabHubIcon } = useVisualPreferences();
  // 2026-08-21: reads bottomOverhang directly rather than deriving it from
  // height/2 -- see getTabHubIconRenderSize's own comment. Every icon
  // except 'seedTall' still has bottomOverhang === (height-FLOATING_BUTTON_
  // SIZE)/2, so this is byte-for-byte the same value as before for them;
  // 'seedTall' alone has a smaller, pinned bottomOverhang (its extra height
  // goes up, not down), and this box needs that real number, not the
  // symmetric one, to clear the nav bar by the right amount.
  const { width: buttonIconWidth, bottomOverhang } = getTabHubIconRenderSize(tabHubIcon);
  const buttonIconOverhangY = Math.max(0, Math.ceil(bottomOverhang));

  // Nothing to show at all until a real lens is picked, 2026-08-08 -- see
  // this file's own 2026-08-08 comment above for why the box no longer
  // shows a resting-state prompt in the meantime.
  if (!activeLensLabel) return null;

  // The currently-showing icon's own bottom edge sits buttonIconOverhangY
  // below the button's own bottom edge (the artwork is taller than the
  // 60px button footprint, centered around it) -- so its real buffer from
  // the system nav bar is this much less than FLOATING_BUTTON_BOTTOM_OFFSET
  // alone.
  const verticalBuffer = FLOATING_BUTTON_BOTTOM_OFFSET - buttonIconOverhangY;
  const boxBottom = insets.bottom + verticalBuffer;
  // The icon's own full vertical span (button height + its overhang on
  // both the top and bottom) -- matching this exactly is what makes the
  // box's own top edge land the same distance below the footer's
  // iridescent line the icon's own top edge already sits.
  const boxHeight = FLOATING_BUTTON_SIZE + buttonIconOverhangY * 2;
  // TabHub's own button is alignSelf: 'center' with no other horizontal
  // inset in play, so it (and whichever icon is centered around it,
  // symmetrically wider on both sides) sits centered on windowWidth/2,
  // regardless of NAVIGATION_HAND -- only which SIDE the hub buttons
  // cluster on (and which side this box mirrors to) depends on that.
  const buttonCenterX = windowWidth / 2;
  const horizontalPosition =
    NAVIGATION_HAND === 'left'
      ? { left: buttonCenterX + buttonIconWidth / 2 + verticalBuffer, right: SECONDARY_HUB_CARD_LEFT_MARGIN }
      : {
          left: SECONDARY_HUB_CARD_LEFT_MARGIN,
          right: windowWidth - (buttonCenterX - buttonIconWidth / 2 - verticalBuffer),
        };

  return (
    <View
      style={[styles.container, horizontalPosition, { bottom: boxBottom, height: boxHeight, borderColor: tabColor }]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { color: tabColor }]}>{activeLensLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // width is NOT set explicitly -- left and right are both set instead,
  // so React Native derives the width as whatever space is actually
  // between the butterfly (plus its own buffer) and this app's standard
  // content edge margin, rather than a fixed guess that could drift out
  // of sync with either as screen sizes vary.
  container: {
    position: 'absolute',
    // Thinner, 2026-07-28 -- explicitly matched to the footer's own
    // iridescent line (ScreenBackground.tsx's own footerLine, a flat 1px),
    // not the 2px this used before.
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    // 2026-08-23, direct report: this box was deliberately fill-less from
    // the start ("no fill, so whatever's already behind it shows straight
    // through," see this file's own 2026-07-28 comment above), a real
    // assumption that whatever sat behind it would always be calm enough
    // to read against. Now that GatedTabContent actually reveals each
    // tab's own real photo background, that assumption breaks wherever the
    // photo happens to be bright -- this box is shown on every tab, so the
    // gap reached everywhere at once. Same rgba(0,0,0,0.55) value already
    // used throughout this app for exactly this job (InfoAlert,
    // PasswordPrompt, BusyOverlay, AppActionSheet), not a new one invented
    // here.
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  // Deliberately typography.caption, not .eyebrow -- eyebrow's own
  // uppercase transform read fine for a short label ("6 DIMENSIONS") but
  // was explicitly reported as wrong once this box started also holding a
  // full sentence; dropped for both states rather than keeping two
  // different cases across the same box. fontSize matched to LensHub.tsx's
  // own buttonLabel (the label under that corner button's icon) -- these
  // two are meant to read as the same size to start with.
  text: {
    ...typography.caption,
    ...textShadow,
    fontSize: 11,
    textAlign: 'center',
  },
});
