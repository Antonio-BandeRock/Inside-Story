import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { TAB_ROUTES } from '../constants/tabs';
import { ScreenBackground, type BackgroundVariant } from './ScreenBackground';

// 2026-07-26: replaces every non-Home tab's own distinct background always
// being on screen. Instead, every one of them rests on the *same* shared
// scene Home uses, until a function is picked from that tab's own corner
// menu (LensHub, rendered by the caller, outside this component --
// unaffected), at which point that tab's own specific background
// (`variant`) shows instead.
//
// 2026-07-28: used to also render an on-page prompt at rest ("Tap the
// [icon] button in the corner to select a function") -- moved to
// PageIdentityLabel.tsx instead (shortened, and living in that label's own
// no-background corner spot rather than a bordered card on the page
// itself). This component's own resting branch is genuinely empty now --
// see PageIdentityLabel.tsx for where that messaging actually lives.
//
// This exists because trying to make a swipe-transition's "peek" of the
// destination tab's own distinct background match pixel-for-pixel what
// that screen renders at rest turned out to be a real, repeatedly-hard
// problem (see SwipeableTabScreen.tsx's own history comment). Making every
// tab's resting state the *same* image sidesteps that class of bug
// entirely -- there's no longer a second, different image to match.
//
// This component does NOT render the shared resting background itself --
// that's a single, genuinely constant `<ScreenBackground variant="field"
// sky />` mounted once in app/(tabs)/_layout.tsx, behind every screen. This
// component only owns the REVEALED state: a real `<ScreenBackground
// variant={variant}>` (image, content, its own footer mask/line, all
// together), swapped in for the resting prompt the instant `revealed`
// turns true.
//
// 2026-07-27: used to slide this layer up from below the screen
// (Reanimated, translateY, over TAB_REVEAL_DURATION_MS), rather than just
// switching instantly -- removed by explicit request in favor of a plain
// instant swap ("pop in," not slide). LensHub.tsx's own choose() now
// handles the "don't let this happen at the same moment the menu is still
// closing" concern instead (a brief delay between closing the menu and
// calling onSelect, which is what flips `revealed` true here) -- this
// component no longer needs to coordinate timing with anything itself, so
// the whole rise/drop SharedValue-and-effect machinery (and the
// TabRevealContext it depended on for cross-component "drop before you
// swipe/hub-tap away" signaling, since dropping is now instant and needs
// no advance notice) is gone along with it.
export function GatedTabContent({
  pageTitle,
  variant,
  revealed,
  children,
}: {
  // Still required, even though this component no longer reads it itself
  // (used to feed the on-page resting prompt this component owned --
  // that moved to PageIdentityLabel.tsx, 2026-07-28, see its own comment).
  // Kept as a required prop anyway rather than touching every call site
  // just to drop it, matching LensHub's own `pageTitle` contract at the
  // same call site.
  pageTitle: string;
  // Which of ScreenBackground's own per-tab images this screen shows once
  // a function is picked -- exactly what used to be passed straight to
  // ScreenBackground's own `variant` prop before this component existed.
  variant: BackgroundVariant;
  // Owned by the calling screen (its own `revealed` state, flipped true by
  // LensHub's onSelect) -- this component only reacts to it, doesn't own
  // it, since the screen also needs it for its own PageIdentityLabel/
  // ScopeHub gating.
  revealed: boolean;
  children?: ReactNode;
}) {
  // 2026-08-08: which per-tab visual-preferences override (if any) applies
  // to this screen's own revealed background -- resolved from pageTitle via
  // TAB_ROUTES rather than requiring every one of the 7 call sites to pass
  // a second, redundant prop. See ScreenBackground.tsx's own `routeKey`
  // comment for how it's used.
  const routeKey = TAB_ROUTES.find((route) => route.title === pageTitle)?.path as string | undefined;

  return (
    <View style={styles.body}>
      {revealed ? (
        <ScreenBackground variant={variant} routeKey={routeKey}>{children}</ScreenBackground>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
});
