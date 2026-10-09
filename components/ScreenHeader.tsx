import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/colors';
import { EDGE_SHADOW_HEIGHT, EdgeShadow } from './EdgeShadow';
import { GENERIC_BACKGROUND_PALETTES } from './GenericBackground';

import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { getUserProfile } from '../lib/db';

// The "hard stop" from the true screen edge -- deliberately just a few
// pixels rather than a real gutter, so the font gets as much width as
// possible before the auto-shrink logic below has to kick in. Shared
// between `row`'s own style and the textAreaWidth calculation so the two
// can't drift out of sync.
const ROW_HORIZONTAL_PADDING = 4;

// 1.0.61.3: the header holds the name and nothing else. Direct
// instruction: "we won't be doing any of the rewarding for the user from
// the header area. And, I don't think we need the little selected tab icon
// to be up there anymore. Let's shrink the header height, leaving just the
// User's first name and "Lifestead" centered both horizontally and
// vertically in the header space, giving more room on the tab screens."
// So the tab glyph (TabPositionMark, 16px) and the 14px once kept for growth
// marks are both gone, and the title's box is cut to what the full-size
// text plus its deepest shadow layer needs: about 38px of Nunito at 28 with
// the shadow stack reaching 8px below it. The corner box (PageIdentityLabel)
// still says which tab is showing. The whole header went from 80px under
// the status bar to 54.
const HEADER_TEXT_HEIGHT = 44;
// The *maximum* size -- a long first name (e.g. "Alexandria's Inside
// Story") shrinks down from here to actually fit, same idea as native
// Text's adjustsFontSizeToFit, just done by hand since SVG text has no
// such prop. Never scales past this for short names either.
//
// 2026-08-21: scaled proportionally to HEADER_TEXT_HEIGHT's own value each
// time that's changed (not picked freehand) -- first down to fit the
// dots/growth rows, now back up again once the reclaimed padding above
// gave the box more room. Still smaller than the original 34 (there's
// genuinely more in this header now than there was before today), but a
// real, felt increase from the too-small 17 it dropped to for one pass.
const HEADER_TEXT_MAX_FONT_SIZE = 28;
const HEADER_TEXT_MIN_FONT_SIZE = 15;
// Deliberately tight -- just enough that the shadow layers (see
// SHADOW_LAYERS below) don't clip against the SVG canvas's own edge
// (Svg defaults to overflow: hidden, same as a root SVG element on the
// web), not a real visual margin. Every pixel here is a pixel the font
// itself can't use before it has to start shrinking.
const HEADER_TEXT_HORIZONTAL_MARGIN = 4;
// A synchronous, deterministic width estimate rather than a real measured
// one -- an earlier version measured a hidden native Text via onLayout,
// but that round trip proved unreliable in practice (long names weren't
// actually shrinking). Nunito SemiBold's average character advance is
// close enough to ~0.53em for this purpose -- these are short one-line
// names, not paragraphs, so per-character precision isn't the goal, only
// "a long name visibly shrinks instead of clipping." Biased slightly
// wide on purpose: overshrinking a borderline name by a couple pixels is
// a much smaller problem than a long one silently clipping.
const AVERAGE_CHAR_WIDTH_EM = 0.53;
function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * AVERAGE_CHAR_WIDTH_EM;
}
// SVG has no text-shadow prop -- darker copies of the same text, offset
// further down-right and drawn first (so the gradient copy paints over
// them), are the standard way to fake a raised/3D look without one.
// Several stacked, increasingly-offset, increasingly-faint copies read as
// a longer cast shadow (text lifting further off the page) than one copy
// alone; a single faint highlight copy offset the *opposite* way adds a
// lit top-left bevel edge, completing the raised/embossed look.
const SHADOW_LAYERS: readonly { offset: number; opacity: number }[] = [
  { offset: 2, opacity: 0.5 },
  { offset: 4, opacity: 0.35 },
  { offset: 6, opacity: 0.22 },
  { offset: 8, opacity: 0.12 },
];
const HIGHLIGHT_OFFSET = -1.5;

// The title's box plus the rounded-edge shadow strip below it (EdgeShadow),
// every piece of this header's fixed vertical footprint. The title's width
// auto-shrinks (see fontSize below) but its height never does, so this is a
// true constant per device. Each tab pads its scroll view by it through
// useScreenHeaderHeight.
const HEADER_ROW_HEIGHT = HEADER_TEXT_HEIGHT + EDGE_SHADOW_HEIGHT;

// Mirrors `styles.wrapper.paddingTop` below (they have to move together;
// 12, then 4, now 0 since 1.0.61.3 so the name sits centered between the
// status bar and the edge shadow), included here so the one shared persistent background layer
// (app/(tabs)/_layout.tsx) can start exactly where a screen's real,
// rendered header ends, without duplicating this number a second place it
// could quietly drift out of sync with.
const SCREEN_HEADER_WRAPPER_TOP_PADDING = 0;

// The true on-screen height of "a screen's own header," top of device to
// where the header's divider line ends -- safe-area inset plus this
// header's own fixed content height plus the wrapper padding every screen
// applies around it. Used by app/(tabs)/_layout.tsx to position the one
// shared, permanently-mounted background layer so it starts exactly at the
// bottom of whichever header happens to be showing, not underneath it (see
// that file's own comment for why this must be exact, not approximate).
export function useScreenHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  return insets.top + HEADER_ROW_HEIGHT + SCREEN_HEADER_WRAPPER_TOP_PADDING;
}

// 2026-07-25: this used to be the one header carrying three things --
// the page's own title/sub-tab (left), a help icon (far left), and
// "{name}'s Lifestead" (right). All three moved out: the info icon is
// gone (TabHub's own picker grid has an equivalent "About this page" tile
// now, colored to match whatever page is open); the page title and
// sub-tab label moved to PageIdentityLabel, anchored in the screen's
// bottom corner instead (see components/PageIdentityLabel.tsx and each
// screen's own render of it). What's left here is purely the app's own
// branding -- "{name}'s Lifestead" -- now the only thing this header
// shows, in a larger size, centered both ways in the header's own space
// rather than pinned to one side of a now-empty row.
//
// 2026-07-27: mounted exactly ONCE now, in app/(tabs)/_layout.tsx, instead
// of once per tab screen. Each screen used to render its own <ScreenHeader
// title=... helpSections=... tabPath=.../>, which meant each one also
// carried its own local firstName state, starting at null on that
// screen's own first mount -- swiping to a tab whose header hadn't
// resolved its own profile fetch yet flashed the "MY Lifestead"
// placeholder before correcting itself a moment later. A single shared
// instance has exactly one firstName, fetched once, so there's nothing
// left to flash: whichever tab is showing, the name is already known.
// helpSections/tabPath registration moved out to
// CurrentPageHelp.tsx's own useRegisterScreenHelp, which each screen now
// calls directly, since a single shared header has no per-screen "just
// gained focus" moment of its own to hang that on.
//
// Still used instead of the native Stack/Tabs header (turned off for the
// whole (tabs) group -- see app/(tabs)/_layout.tsx) so nothing shows
// twice.
export function ScreenHeader() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  // Matches `row`'s own paddingHorizontal below.
  const textAreaWidth = Math.max(200, windowWidth - ROW_HORIZONTAL_PADDING * 2);
  const appNameText = `${firstName ? `${firstName}'s` : 'MY'} Lifestead`;
  const availableTextWidth = textAreaWidth - HEADER_TEXT_HORIZONTAL_MARGIN * 2;
  const estimatedWidthAtMax = estimateTextWidth(appNameText, HEADER_TEXT_MAX_FONT_SIZE);

  // Shrinks from the max size only as far as needed to fit the *current*
  // name -- "Tony's Lifestead" stays at full size, "Alexandria's Inside
  // Story" scales down, both computed synchronously (no render-then-measure
  // round trip, no chance of a stale/late value).
  const fontSize =
    estimatedWidthAtMax > availableTextWidth
      ? Math.max(HEADER_TEXT_MIN_FONT_SIZE, HEADER_TEXT_MAX_FONT_SIZE * (availableTextWidth / estimatedWidthAtMax))
      : HEADER_TEXT_MAX_FONT_SIZE;
  // Shadow/highlight offsets scale down together with the text -- otherwise
  // a shrunk long name would carry the same shadow size as the full-size
  // text, reading as disproportionately heavy.
  const shadowScale = fontSize / HEADER_TEXT_MAX_FONT_SIZE;

  // The SVG canvas's true vertical center -- paired with alignmentBaseline
  //="middle" on every SvgText below, which centers the text ON this y
  // itself (SVG's own built-in vertical-centering, not a hand-approximated
  // baseline offset). That's what actually keeps this centered "always,"
  // independent of whatever fontSize the auto-shrink logic above lands on
  // for a given name -- a fixed offset approximation tuned for one size
  // would drift off-center as the size changes.
  const textCenterY = HEADER_TEXT_HEIGHT / 2;
  // 2026-08-17: this text and the divider line just below it used to cycle
  // through a continuously-animated rainbow gradient (see this file's own
  // now-removed useThrottledHueDegrees/rotatedIridescentPalette usage) --
  // that was a real, confirmed, continuous battery drain (a JS-thread
  // update up to 10 times a second, the whole time the app was open on any
  // tab; see constants/colors.ts's own header note). Replaced with a flat,
  // static accent -- whichever "lighter" color belongs to the person's own
  // currently-chosen generic color combination (Profile's own Appearance &
  // Navigation section), the same real setting that already drives the
  // Generic background option, now doing double duty. Direct request: "the
  // font be the lighter color in each of the generic color combinations, as
  // well as the line in the header and footer."
  const { genericPalette } = useVisualPreferences();
  const accentColor = GENERIC_BACKGROUND_PALETTES[genericPalette].lighter;

  // Refetched on every focus of the (tabs) group as a whole (not just once
  // on mount) so editing your name in Profile -- a separate stack screen
  // outside this group -- and coming back picks it up immediately. This
  // component is mounted once for the group's entire lifetime now, not
  // once per screen, so "on focus" here means "the group as a whole
  // regained focus" (e.g. returning from Profile), not "a particular tab
  // was swiped to" -- exactly the granularity that avoids the old
  // per-screen refetch/flash this replaced (see this component's own
  // opening comment).
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      getUserProfile().then((profile) => {
        if (isMounted) setFirstName(profile.firstName);
      });
      return () => {
        isMounted = false;
      };
    }, []),
  );

  return (
    // Wrapper padding/background -- previously duplicated in every
    // screen's own `styles.header` box around <ScreenHeader/>, now that
    // there's only one instance to apply it to. paddingTop: insets.top
    // (nested below) is real safe-area clearance for the status bar (the
    // app draws edge-to-edge on Android, see app.json's edgeToEdgeEnabled),
    // not the flat 25px guess this used to be. That guess happened to be
    // close to a typical status bar height, which is exactly why shrinking
    // the header (see `row` below) didn't get far just by cutting this
    // number -- it's a hard minimum, not slack to trim; the real reduction
    // had to come out of `row`'s own padding.
    <View style={styles.wrapper}>
      <View style={{ paddingTop: insets.top }}>
        {/* 2026-08-21, Phase 0 of the header growth vine/Timeline plan:
            the title itself becomes the door into the Timeline -- direct
            request: "they should need to tap their (name of person)'s
            Lifestead and it unfolds before them." Since 2026-09-26
            (B1 of the competitive build plan) it opens the day
            timeline, app/timeline.tsx; the words stop
            being passive branding and become a literal door in, with zero
            new navigation to learn since this text is already on every
            screen. */}
        <Pressable style={styles.row} onPress={() => router.push('/timeline')}>
          <View style={styles.nameStack}>
            {/* "MY" is a placeholder for when no first name is set in
                Profile -- same slot, same style as the real possessive, so
                setting a name later is a straight swap, not a layout
                change. One text string, not two side by side -- both the
                name and "Lifestead" belong on the same row, and a single
                string guarantees that rather than depending on there being
                enough width for two separate ones to land next to each other. */}
            <Svg width={textAreaWidth} height={HEADER_TEXT_HEIGHT}>
            {/* Stacked shadow copies, furthest/faintest first so each
                nearer one paints cleanly over it -- see SHADOW_LAYERS. */}
            {SHADOW_LAYERS.slice().reverse().map((layer) => {
              const offset = layer.offset * shadowScale;
              return (
                <SvgText
                  key={layer.offset}
                  x={textAreaWidth / 2 + offset}
                  y={textCenterY + offset}
                  fontFamily="Nunito_600SemiBold"
                  fontSize={fontSize}
                  fill={`rgba(6, 9, 20, ${layer.opacity})`}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {appNameText}
                </SvgText>
              );
            })}

            {/* A faint highlight offset the opposite way from the shadow
                stack -- peeks out along the top-left edge of the gradient
                text on top, reading as a lit bevel edge (the other half of
                a raised/embossed look, not just a shadow underneath). */}
            <SvgText
              x={textAreaWidth / 2 + HIGHLIGHT_OFFSET * shadowScale}
              y={textCenterY + HIGHLIGHT_OFFSET * shadowScale}
              fontFamily="Nunito_600SemiBold"
              fontSize={fontSize}
              fill="rgba(255, 255, 255, 0.35)"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {appNameText}
            </SvgText>

            <SvgText
              x={textAreaWidth / 2}
              y={textCenterY}
              fontFamily="Nunito_600SemiBold"
              fontSize={fontSize}
              fill={accentColor}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {appNameText}
            </SvgText>
          </Svg>
          </View>
        </Pressable>
      {/* The flat divider line + two shadow-fade bars that used to render
          here are replaced outright, 2026-08-21, direct request: "the
          bottom edge of the header... to look shaded for depth so it
          looks like the edge sort of lifts and curls over toward the
          main screen area, like the edge of a kitchen counter that is
          rounded." See EdgeShadow.tsx's own header comment for the full
          design. */}
      <EdgeShadow direction="down" />
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Previously each screen's own `styles.header` box (paddingTop: 12,
  // backgroundColor: colors.background) -- folded in here now that this
  // is the one place that box is ever needed.
  //
  // 2026-08-21: dropped from 12 to 4, direct request ("move the title up
  // as far as we can"), a small residual margin kept rather than zeroed --
  // this sits above insets.top's own real safe-area clearance, so it's
  // genuinely trimmable, but going all the way to 0 without seeing it
  // on-device risked the title reading as flush against the status bar.
  // 1.0.61.3: 4 to 0, so the name is centered in the header's space.
  // Must stay in sync with SCREEN_HEADER_WRAPPER_TOP_PADDING above.
  wrapper: {
    paddingTop: 0,
    backgroundColor: colors.background,
  },
  // 2026-07-25: reduced roughly a quarter overall, now that this text is
  // the only thing in the header -- paddingVertical cut from 18 to 6 (the
  // biggest lever available, since the safe-area clearance above can't
  // shrink further and the text itself is growing, not shrinking).
  // alignItems/justifyContent: 'center' re-centers automatically as this
  // shrinks -- flexbox centering doesn't need manual re-tuning when the
  // box around it changes size, only when the *alignment rule* changes.
  //
  // 2026-08-21: cut again, 6 to 0 -- see HEADER_TEXT_HEIGHT's own comment
  // for the full reasoning (this was the other half of the 20px reclaimed
  // and handed back to the title's own box). The title's SVG box itself
  // (HEADER_TEXT_HEIGHT, comfortably above typical touch-target minimums)
  // is still a real tap target on its own with zero padding around it.
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ROW_HORIZONTAL_PADDING,
    paddingVertical: 0,
  },
  nameStack: {
    alignItems: 'center',
  },
});
