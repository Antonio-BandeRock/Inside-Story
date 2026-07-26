import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { rotatedIridescentPalette } from '../constants/colors';
import { useIridescentHueRotation } from '../hooks/useIridescentHueRotation';
import { getUserProfile } from '../lib/db';
import { useCurrentPageHelp } from './CurrentPageHelp';
import type { HelpSection } from './HelpButton';

// The "hard stop" from the true screen edge -- deliberately just a few
// pixels rather than a real gutter, so the font gets as much width as
// possible before the auto-shrink logic below has to kick in. Shared
// between `row`'s own style and the textAreaWidth calculation so the two
// can't drift out of sync.
const ROW_HORIZONTAL_PADDING = 4;

const HEADER_TEXT_HEIGHT = 60;
// The *maximum* size -- a long first name (e.g. "Alexandria's Inside
// Story") shrinks down from here to actually fit, same idea as native
// Text's adjustsFontSizeToFit, just done by hand since SVG text has no
// such prop. Never scales past this for short names either.
const HEADER_TEXT_MAX_FONT_SIZE = 34;
const HEADER_TEXT_MIN_FONT_SIZE = 18;
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
// Still used instead of the native Stack/Tabs header (turned off for the
// whole (tabs) group -- see app/(tabs)/_layout.tsx) so nothing shows
// twice, and still the place `helpSections`/`tabPath` get registered
// (via useCurrentPageHelp) even though neither one renders anything
// visible here anymore -- TabHub's info tile and active-tab highlight
// both still depend on this registration happening on every screen.
export function ScreenHeader({
  title,
  helpSections,
  tabPath,
}: {
  // No longer displayed here (see PageIdentityLabel) -- still required so
  // the help sheet this feeds (via useCurrentPageHelp) can show "About
  // {title}".
  title: string;
  // Omit to register no help content at all (e.g. a screen with nothing
  // yet worth explaining) -- every tab that has real content should pass
  // these.
  helpSections?: HelpSection[];
  // This screen's own entry in constants/tabs.ts's TAB_ROUTES (e.g. '/',
  // '/home') -- registered on focus so TabHub can reliably highlight the
  // tab actually being looked at (see CurrentPageHelp.tsx's activeTabPath
  // for why this can't just be read off the URL). Only the 7 tab screens
  // pass this; a screen reached outside the tab bar (Profile, Check-In)
  // should leave it unset.
  tabPath?: string;
}) {
  const [firstName, setFirstName] = useState<string | null>(null);
  const hueRotation = useIridescentHueRotation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { setCurrentHelp, setActiveTabPath } = useCurrentPageHelp();
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
  const animatedGradientColors = rotatedIridescentPalette(hueRotation);

  // Refetched on every focus (not just once on mount) so editing your name
  // in Profile and coming back to any tab picks it up immediately -- the
  // same reasoning as every other cross-screen-affected value in this app
  // (see the useFocusEffect notes on the Meals/Insights/Schedule screens).
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

  // Registers this screen's own help content as "the current page" the
  // moment it gains focus, so TabHub's info tile (opened from a totally
  // different part of the tree) always shows the right thing for whatever
  // tab the person is actually looking at.
  useFocusEffect(
    useCallback(() => {
      setCurrentHelp(helpSections ? { title, sections: helpSections } : null);
    }, [title, helpSections, setCurrentHelp]),
  );

  // Same focus-driven registration, for which tab is actually on screen --
  // kept as its own effect (not folded into the one above) so a screen
  // with no helpSections still correctly reports its tab.
  useFocusEffect(
    useCallback(() => {
      if (tabPath) setActiveTabPath(tabPath);
    }, [tabPath, setActiveTabPath]),
  );

  return (
    // paddingTop: insets.top -- real safe-area clearance for the status
    // bar (the app draws edge-to-edge on Android, see app.json's
    // edgeToEdgeEnabled), not the flat 25px guess this used to be. That
    // guess happened to be close to a typical status bar height, which is
    // exactly why shrinking the header (see `row` below) didn't get far
    // just by cutting this number -- it's a hard minimum, not slack to
    // trim; the real reduction had to come out of `row`'s own padding.
    <View style={{ paddingTop: insets.top }}>
      <View style={styles.row}>
        <View style={styles.nameStack}>
          {/* "MY" is a placeholder for when no first name is set in
              Profile -- same slot, same style as the real possessive, so
              setting a name later is a straight swap, not a layout
              change. One text string, not two side by side -- both the
              name and "Inside Story" belong on the same row, and a single
              string guarantees that rather than depending on there being
              enough width for two separate ones to land next to each other. */}
          <Svg width={textAreaWidth} height={HEADER_TEXT_HEIGHT}>
            <Defs>
              <SvgLinearGradient id="appNameGradient" x1="0" y1="0" x2="1" y2="0">
                {animatedGradientColors.map((color, index) => (
                  <Stop key={index} offset={index / (animatedGradientColors.length - 1)} stopColor={color} />
                ))}
              </SvgLinearGradient>
            </Defs>

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
              fill="url(#appNameGradient)"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {appNameText}
            </SvgText>
          </Svg>
        </View>
      </View>
      {/* Same rotating palette as the app-name text above (same
          hueRotation value, same underlying IRIDESCENT_PALETTE), so this
          line and the footer's own divider (ScreenBackground.tsx) shimmer
          in lockstep with the header text rather than each drifting on
          its own schedule. */}
      <LinearGradient
        colors={animatedGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.divider}
      />
      <View style={styles.shadowFade1} />
      <View style={styles.shadowFade2} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  // backgroundColor intentionally absent -- painted by the LinearGradient
  // component itself now, not a flat style color.
  divider: {
    height: 1,
  },
  // Two fading bars stand in for a soft drop shadow, confined to strictly
  // below the divider -- flat colors instead of a shadow/elevation prop, so
  // it never wraps around the sides or top.
  shadowFade1: {
    height: 2,
    backgroundColor: 'rgba(43, 43, 40, 0.06)',
  },
  shadowFade2: {
    height: 2,
    backgroundColor: 'rgba(43, 43, 40, 0.025)',
  },
});
