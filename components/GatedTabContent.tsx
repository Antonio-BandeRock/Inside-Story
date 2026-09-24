import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { TAB_ROUTES } from '../constants/tabs';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { resolveBackgroundStyle } from '../lib/visualPreferences';
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
// 2026-08-22: briefly changed, then reverted the same day. A report that
// the new Food avocado background "wasn't showing up" was traced here --
// `ScreenBackground` was made to render unconditionally, `revealed` only
// gating the children on top of it, so a tab's own distinct background
// would show at rest, before any lens was picked. Direct follow-up
// correction: "I think you had it right, before. I was wrong. We already
// had backgrounds for each of the tabs... You had changed the background
// for all of the Food lenses" -- the original gated behavior (below) was
// correct all along; the real issue that day was the watermark on the
// source images themselves, not this gating logic. Reverted in full,
// including the swipe-transition "peek" bug this gating exists to
// sidestep (see the 2026-07-26 history above) staying avoided.
//
// 2026-08-23: gained an optional `restingContent`, a tab's own "Desktop"
// (food.tsx, its only caller), and 2026-09-13 a `restingIntro` inside the
// signpost box. Both are gone as of 2026-09-24, along with the box, by
// direct instruction: "remove the informational black background thing at
// the top of each of the screen on each tab that tells the user to tap the
// tab icon in the corner. The botto right box is doing this as well and we
// don't need 2 places for it to occur." PageIdentityLabel, in the corner,
// is that one place now (it names the button by the same icon and colour,
// and has carried the same sentence since 2026-07-28). Food's Desktop went
// in the same pass, since every row it drew was a row of the My Foods
// popup: see app/(tabs)/food.tsx. So the resting branch is empty again,
// which is the point of emptying it. These screens are where a person's
// use of the app is meant to show over time, and nothing can grow on a
// screen already full of links to somewhere else.
//
// 2026-09-24: which also settles what the resting screen is a picture OF.
// A tab's own background choice (Profile > Appearance > Individual tab
// backgrounds) used to reach only the revealed state, so at rest every tab
// showed the shared scene whatever the person had picked. Now a tab set to
// Off, Generic or a photo of a person's own shows that at rest too, while
// the default, Photo, still leaves the shared scene alone rather than
// bringing that tab's bundled image forward: that is the 2026-07-26
// decision above, and the thing the 2026-08-22 revert put back. Direct
// instruction: "should the user be able to replace the tab screen
// backgrounds that will now carry their achievements in using the app with
// nothing or a personal image they added themselves. I say yes."
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
  // Which tab this is, by the title in TAB_ROUTES. The only thing read
  // from it is the route key that picks this screen's background
  // preference out of visual preferences, both revealed and at rest.
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

  // What this tab is set to show. 'photo', the default, means leave the
  // resting screen to the shared scene mounted once in
  // app/(tabs)/_layout.tsx: rendering nothing here is what keeps that scene
  // one canvas that never slides, resizes or remounts between tabs, the
  // whole reason it lives up there rather than in each screen. Anything
  // else is a choice the person made for this tab, so this screen draws it,
  // and it travels with the screen on a swipe the way its content does.
  const visualPrefs = useVisualPreferences();
  const restingStyle = resolveBackgroundStyle(visualPrefs, routeKey);
  const restingIsShared = restingStyle === 'photo';

  return (
    <View style={styles.body}>
      {revealed ? (
        <ScreenBackground variant={variant} routeKey={routeKey}>{children}</ScreenBackground>
      ) : restingIsShared ? null : (
        <ScreenBackground variant={variant} routeKey={routeKey} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
});
