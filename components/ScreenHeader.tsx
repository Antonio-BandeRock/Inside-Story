import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/colors';
import { EDGE_SHADOW_HEIGHT, EdgeShadow } from './EdgeShadow';
import { GENERIC_BACKGROUND_PALETTES } from './GenericBackground';
import { TabPositionDots } from './TabPositionDots';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { getUserProfile } from '../lib/db';

// The "hard stop" from the true screen edge -- deliberately just a few
// pixels rather than a real gutter, so the font gets as much width as
// possible before the auto-shrink logic below has to kick in. Shared
// between `row`'s own style and the textAreaWidth calculation so the two
// can't drift out of sync.
const ROW_HORIZONTAL_PADDING = 4;

// 2026-08-21, Phase 0 of the header growth vine/Timeline plan: the tab-
// position dots row (TabPositionDots) needs real vertical space, carved
// out of the title text's own existing budget rather than added on top --
// see HEADER_ROW_HEIGHT's own comment below for why the total must stay
// exactly what it was before this. Declared first since HEADER_TEXT_HEIGHT
// is now defined in terms of it.
const TAB_DOTS_ROW_HEIGHT = 16;
// Same day, on-device follow-up: a second reserved band, directly below
// the dots, for each tab's own small growing mark (a leaf/flower, not
// built yet -- see the phased plan's Phase 2 onward). Direct request:
// "the header text and dots need to move up to make room" for this,
// explicitly choosing to carve the space out of the title's own budget
// again rather than let the header grow. Empty for now (GrowthMarksRow
// below is a plain reserved placeholder, not real content yet) -- the
// layout is real today even though what fills it isn't.
const GROWTH_MARKS_ROW_HEIGHT = 14;
const HEADER_TEXT_HEIGHT = 60 - TAB_DOTS_ROW_HEIGHT - GROWTH_MARKS_ROW_HEIGHT;
// The *maximum* size -- a long first name (e.g. "Alexandria's Inside
// Story") shrinks down from here to actually fit, same idea as native
// Text's adjustsFontSizeToFit, just done by hand since SVG text has no
// such prop. Never scales past this for short names either.
//
// 2026-08-21: scaled down from the original 34/18 to fit the smaller box
// above, proportionally (34/18 kept roughly the same ratio) rather than
// picked freehand. This is a real, visible size drop for the app's own
// branding text, worth confirming on-device reads fine rather than
// assuming the math alone settles it.
const HEADER_TEXT_MAX_FONT_SIZE = 17;
const HEADER_TEXT_MIN_FONT_SIZE = 10;
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

// row's own paddingVertical (6+6) + the text SVG's own height + the tab-
// position dots row + the rounded-edge shadow strip below it (EdgeShadow,
// see its own header comment) -- every piece of this header's fixed
// vertical footprint, added up once here instead of re-measured. The title
// text's width auto-shrinks (see fontSize above) but its height never
// does, so this is a true constant per device, not an estimate. 2026-08-21:
// the flat divider line (1px) and its two shadow-fade bars (2px+2px, 5px
// total) are gone, replaced by EdgeShadow's own taller EDGE_SHADOW_HEIGHT.
// Same day: TAB_DOTS_ROW_HEIGHT and (a later same-day follow-up)
// GROWTH_MARKS_ROW_HEIGHT both join this sum, but HEADER_TEXT_HEIGHT was
// shrunk by that same combined amount above, so this total is still
// unchanged from before Phase 0 -- direct requirement, twice now: "the
// header area is not to become bigger than it is."
const HEADER_ROW_HEIGHT = 12 + HEADER_TEXT_HEIGHT + TAB_DOTS_ROW_HEIGHT + GROWTH_MARKS_ROW_HEIGHT + EDGE_SHADOW_HEIGHT;

// Every screen wraps its own <ScreenHeader/> in a `{ paddingTop: 12 }` box
// (see e.g. app/(tabs)/insights.tsx's own `styles.header`) -- included here
// so the one shared persistent background layer (app/(tabs)/_layout.tsx)
// can start exactly where a screen's real, rendered header ends, without
// duplicating this number a second place it could quietly drift out of
// sync with.
const SCREEN_HEADER_WRAPPER_TOP_PADDING = 12;

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
// "{name}'s Inside Story" (right). All three moved out: the info icon is
// gone (TabHub's own picker grid has an equivalent "About this page" tile
// now, colored to match whatever page is open); the page title and
// sub-tab label moved to PageIdentityLabel, anchored in the screen's
// bottom corner instead (see components/PageIdentityLabel.tsx and each
// screen's own render of it). What's left here is purely the app's own
// branding -- "{name}'s Inside Story" -- now the only thing this header
// shows, in a larger size, centered both ways in the header's own space
// rather than pinned to one side of a now-empty row.
//
// 2026-07-27: mounted exactly ONCE now, in app/(tabs)/_layout.tsx, instead
// of once per tab screen. Each screen used to render its own <ScreenHeader
// title=... helpSections=... tabPath=.../>, which meant each one also
// carried its own local firstName state, starting at null on that
// screen's own first mount -- swiping to a tab whose header hadn't
// resolved its own profile fetch yet flashed the "MY Inside Story"
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
  const appNameText = `${firstName ? `${firstName}'s` : 'MY'} Inside Story`;
  const availableTextWidth = textAreaWidth - HEADER_TEXT_HORIZONTAL_MARGIN * 2;
  const estimatedWidthAtMax = estimateTextWidth(appNameText, HEADER_TEXT_MAX_FONT_SIZE);

  // Shrinks from the max size only as far as needed to fit the *current*
  // name -- "Tony's Inside Story" stays at full size, "Alexandria's Inside
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
            Inside Story and it unfolds before them." Routes to a stub
            screen for now (Phase 6 builds the real thing); the words stop
            being passive branding and become a literal door in, with zero
            new navigation to learn since this text is already on every
            screen. */}
        <Pressable style={styles.row} onPress={() => router.push('/timeline')}>
          <View style={styles.nameStack}>
            {/* "MY" is a placeholder for when no first name is set in
                Profile -- same slot, same style as the real possessive, so
                setting a name later is a straight swap, not a layout
                change. One text string, not two side by side -- both the
                name and "Inside Story" belong on the same row, and a single
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
        {/* Always-on "you are here" indicator, one dot per real tab --
            see TabPositionDots.tsx's own header comment for why this is
            a discrete snap to the current route rather than a live
            drag-follow, and for the second job this same component gains
            once the Timeline (Phase 6) exists. */}
        <TabPositionDots />
        {/* Reserved, empty for now -- each tab's own small growing mark
            (a leaf/flower) lands here once Phase 2 onward actually builds
            the vine. Height only, no content yet, so the space this needs
            is real and visible today rather than assumed. */}
        <View style={{ height: GROWTH_MARKS_ROW_HEIGHT }} />
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
  wrapper: {
    paddingTop: 12,
    backgroundColor: colors.background,
  },
  // 2026-07-25: reduced roughly a quarter overall, now that this text is
  // the only thing in the header -- paddingVertical cut from 18 to 6 (the
  // biggest lever available, since the safe-area clearance above can't
  // shrink further and the text itself is growing, not shrinking).
  // alignItems/justifyContent: 'center' re-centers automatically as this
  // shrinks -- flexbox centering doesn't need manual re-tuning when the
  // box around it changes size, only when the *alignment rule* changes.
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ROW_HORIZONTAL_PADDING,
    paddingVertical: 6,
  },
  nameStack: {
    alignItems: 'center',
  },
});
