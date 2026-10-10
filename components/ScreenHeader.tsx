import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/colors';
import { EDGE_SHADOW_HEIGHT, EdgeShadow } from './EdgeShadow';

// The gap kept at the row's right end, so the word's canvas never runs to
// the true screen edge.
const ROW_HORIZONTAL_PADDING = 4;

// 1.0.61.3: the header was cut to what full-size text plus its deepest
// shadow layer needs: about 38px of Nunito at 28 with the shadow stack
// reaching 8px below it. The corner box (PageIdentityLabel) says which tab
// is showing. The whole header went from 80px under the status bar to 54.
const HEADER_TEXT_HEIGHT = 44;
const HEADER_TEXT_FONT_SIZE = 28;
// Just enough that the first shadow layer is not clipped by the canvas's
// left edge (Svg defaults to overflow: hidden).
const HEADER_TEXT_HORIZONTAL_MARGIN = 4;

const APP_NAME = 'Lifestead';
// The logo: the window with the figure in it, the same image Home uses.
const LOGO = require('../assets/branding/lifestead-window.png');
// About a third of the TabHub button as it is drawn (78 px of artwork over
// its 60 px tap target), by direct instruction.
const HEADER_LOGO_SIZE = 26;
const HEADER_LOGO_TEXT_GAP = 8;
// An eighth of an inch. A dp is 1/160 of an inch, so 20 dp.
const HEADER_LEFT_INSET = 20;
// The main white of the logo's figure: the 0.35 stop of its shade gradient
// in docs/app-links/public/ghostead-icon.svg, which runs #ffffff at the lit
// point to #eceef7 across most of the body.
const LOGO_FIGURE_WHITE = '#eceef7';

// SVG has no text-shadow prop: darker copies of the same text, offset
// further down-right and drawn first, give the raised look. A highlight copy
// offset the other way once added a lit edge; on white text it would not
// show, so it is gone.
const SHADOW_LAYERS: readonly { offset: number; opacity: number }[] = [
  { offset: 2, opacity: 0.5 },
  { offset: 4, opacity: 0.35 },
  { offset: 6, opacity: 0.22 },
  { offset: 8, opacity: 0.12 },
];

// The title's box plus the rounded-edge shadow strip below it (EdgeShadow),
// every piece of this header's fixed vertical footprint, a true constant per
// device. Each tab pads its scroll view by it through useScreenHeaderHeight.
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

// Mounted exactly once, in app/(tabs)/_layout.tsx, in place of the native
// Stack/Tabs header (turned off for the whole (tabs) group) so nothing shows
// twice.
//
// 1.0.66.4: the possessive is gone. Direct instruction: "The words (user's
// first name's) Lifestead no longer makes sense to keep because people do not
// have lifesteads." The header is the logo and the word Lifestead, sitting at
// the left with about an eighth of an inch from the screen's edge, the word in
// the white of the logo's figure. So nothing here reads the profile any more,
// and the word never needs to shrink: one fixed word at one fixed size.
export function ScreenHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const textAreaWidth = Math.max(
    120,
    windowWidth - HEADER_LEFT_INSET - HEADER_LOGO_SIZE - HEADER_LOGO_TEXT_GAP - ROW_HORIZONTAL_PADDING,
  );
  const textCenterY = HEADER_TEXT_HEIGHT / 2;
  // The shadow stack starts a couple of pixels in so its first copy is not
  // clipped by the canvas's left edge.
  const textX = HEADER_TEXT_HORIZONTAL_MARGIN;

  return (
    <View style={styles.wrapper}>
      <View style={{ paddingTop: insets.top }}>
        {/* The header is still the door into the day timeline
            (app/timeline.tsx), as it has been since 2026-09-26. */}
        <Pressable style={styles.row} onPress={() => router.push('/timeline')}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Svg width={textAreaWidth} height={HEADER_TEXT_HEIGHT}>
            {SHADOW_LAYERS.slice().reverse().map((layer) => (
              <SvgText
                key={layer.offset}
                x={textX + layer.offset}
                y={textCenterY + layer.offset}
                fontFamily="Nunito_600SemiBold"
                fontSize={HEADER_TEXT_FONT_SIZE}
                fill={`rgba(6, 9, 20, ${layer.opacity})`}
                textAnchor="start"
                alignmentBaseline="middle"
              >
                {APP_NAME}
              </SvgText>
            ))}
            <SvgText
              x={textX}
              y={textCenterY}
              fontFamily="Nunito_600SemiBold"
              fontSize={HEADER_TEXT_FONT_SIZE}
              fill={LOGO_FIGURE_WHITE}
              textAnchor="start"
              alignmentBaseline="middle"
            >
              {APP_NAME}
            </SvgText>
          </Svg>
        </Pressable>
        {/* The bottom edge reads as a rounded counter edge curling toward the
            screen, 2026-08-21; see EdgeShadow.tsx. */}
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
  // 1.0.66.4: a row from the left, logo then word, no longer centered.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: HEADER_LEFT_INSET,
    paddingRight: ROW_HORIZONTAL_PADDING,
    paddingVertical: 0,
  },
  logo: {
    width: HEADER_LOGO_SIZE,
    height: HEADER_LOGO_SIZE,
    marginRight: HEADER_LOGO_TEXT_GAP,
  },
});
