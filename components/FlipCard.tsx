import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// react-native-gesture-handler's ScrollView, not the plain react-native
// one, specifically for the nested vertical scroll below -- 2026-07-27,
// reported as moving the whole Home page instead of just the card's own
// back content. Root cause: this card sits inside a horizontal row, but
// that row itself sits inside Home's own OUTER vertical page ScrollView --
// a vertical drag here is genuinely ambiguous between "scroll this card"
// and "scroll the page" to the plain responder system, and the outer one
// was winning. Already a real dependency in this app (the tab-swipe
// gesture, see SwipeableTabScreen.tsx/app/_layout.tsx's own
// GestureHandlerRootView) -- its ScrollView correctly claims this nested
// gesture instead of leaking it to the ancestor scroll view, which the
// plain react-native ScrollView doesn't reliably do in exactly this shape.
//
// 2026-09-12, direct report: "the backs don't seem able to scroll
// vertically when there is more than what can be displayed." The missing
// piece was nestedScrollEnabled. On Android a vertical scroll view sitting
// inside another vertical scroll view (this card's face, inside Home's
// own page) hands every drag to the outer one unless it opts into nested
// scrolling explicitly; the gesture-handler swap above changed which
// component claims the gesture but never set that flag, so the face very
// likely never scrolled on a phone at all. Both faces now set it, and the
// scroll indicator is shown so a face with more to read says so.
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { HOME_BAND_ACCENT_WIDTH, HOME_BAND_EDGE_WIDTH } from './HomeSectionBand';

// A small, single-concept "micro-learning" card -- a striking icon and a
// one-sentence hook up front, a bite-sized tip on the back. Meant to be
// used several at a time in a row, so a big idea (what Hashimoto's is, why
// food timing matters) is broken into pieces small enough to actually get
// read, instead of one long paragraph nobody taps into.
//
// 2026-08-23, direct report on Home's own Digest-sourced cards: "they
// don't link back to the information card in Digest where they refer to,
// and they cut off in mid sentence without baiting their appetite." Two
// real, separate problems, both fixed here rather than by shortening the
// text passed in from the caller: `backBody` cutting off mid-scroll with
// nothing signaling there was more, and no way to actually reach the full
// entry this card teases. `onReadMore` is optional so this component still
// works for any caller with nothing real to link to; every current caller
// (Home's own Digest flip cards) passes one.
//
// 2026-09-12, direct request, three parts: "apply the same formatting to
// the Digest cards" (the band look every other Home box now carries: a
// thick accent down the left, hairlines top and bottom, no right edge, no
// corner radius), "the section of the Digest where they exist should be
// seen as a header for each card" (the `header` prop: the Digest category
// the card came from, as a header row on both faces), and "each card
// should be capable of scrolling vertically if there is more info on the
// front or back than can be displayed" (the front's hook now scrolls the
// same way the back's body already did, centred while it still fits).
export function FlipCard({
  icon,
  header,
  hook,
  backTitle,
  backBody,
  onReadMore,
  borderColor = colors.border,
  headerColor = borderColor,
  width = 220,
  height = 260,
}: {
  icon: ReactNode;
  // Where the card came from, shown as a header row on both faces. The
  // icon beside it is the same `icon` the front face carries.
  header?: string;
  hook: string;
  backTitle: string;
  backBody: string;
  onReadMore?: () => void;
  // 2026-08-23, direct follow-up: "Shouldn't the line color be the color
  // for Digest?" Optional with a neutral default rather than hardcoded
  // purple, since FlipCard itself is a generic component, not
  // Digest-specific -- Home's own call site passes colors.tabPurpleDigest
  // explicitly, the same "shared component, tab color passed in by the
  // caller" shape PopoverSelect's own tabColor prop already establishes.
  borderColor?: string;
  // The header text's own colour, for a tab whose fill colour and readable
  // text colour are two different tokens (the Digest's are, see
  // constants/colors.ts). Defaults to the border colour.
  headerColor?: string;
  width?: number;
  height?: number;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipped = useSharedValue(0);

  function toggle() {
    const next = !isFlipped;
    flipped.value = withTiming(next ? 1 : 0, { duration: 400 });
    setIsFlipped(next);
  }

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flipped.value, [0, 1], [0, 180])}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flipped.value, [0, 1], [180, 360])}deg` }],
  }));

  // One header row, drawn on both faces so the card's origin reads the same
  // whichever side is up. A hairline in the same colour closes it off from
  // the content below, the way a band's own header row is closed off.
  const headerRow = header ? (
    <View style={[styles.headerRow, { borderBottomColor: borderColor }]}>
      <View style={styles.headerIcon}>{icon}</View>
      <Text style={[styles.headerText, { color: headerColor }]} numberOfLines={1}>
        {header}
      </Text>
    </View>
  ) : null;

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={{ width, height }}>
      {/* The two faces are stacked, and the hidden one is invisible but
          still in the touch tree: unflipped, the back face sits on top and
          would take a vertical drag meant for the front. So whichever face
          is turned away ignores touches entirely. */}
      <Animated.View
        style={[styles.face, { borderColor }, frontStyle]}
        pointerEvents={isFlipped ? 'none' : 'auto'}
      >
        {headerRow}
        {/* Scrolls if the hook outgrows the card (a larger system font, a
            long hook), otherwise sits centred in whatever space the header
            leaves, exactly where it always sat. The icon only leads the
            hook when there is no header carrying it already. */}
        <ScrollView
          style={styles.faceScroll}
          contentContainerStyle={styles.frontContent}
          nestedScrollEnabled
        >
          {header ? null : icon}
          <Text style={styles.hook}>{hook}</Text>
        </ScrollView>
      </Animated.View>
      <Animated.View
        style={[styles.face, { borderColor }, styles.backFace, backStyle]}
        pointerEvents={isFlipped ? 'auto' : 'none'}
      >
        {headerRow}
        <Text style={styles.backTitle}>{backTitle}</Text>
        <View style={styles.backDivider} />
        {/* Scrolls instead of the card growing taller to fit -- explicitly
            requested, 2026-07-27, once the bigger flip-card pool started
            including longer tips than the original 4 fixed ones. flex: 1
            lets this fill exactly the space left between the divider and
            "Read more"/the flip hint below, whatever that is, and only
            scrolls if the text actually overflows it. backBody itself is
            now a short excerpt (see digestFlipCardPool's own comment in
            app/(tabs)/index.tsx), so this scroll is a safety margin for a
            larger system font size, not the primary way to reach the rest
            of the text -- "Read more" below is. */}
        <ScrollView style={styles.faceScroll} nestedScrollEnabled>
          <Text style={styles.backBody}>{backBody}</Text>
        </ScrollView>
        {/* Deliberately outside the ScrollView above, not its last line --
            always visible regardless of scroll position, the actual fix
            for "give enough to catch their interest, and end with a way
            to read more." A separate TouchableOpacity nested inside the
            card's own outer one (which flips the card): React Native's
            touch responder system already gives the innermost handler the
            tap, so this reads as its own real link, not a second flip
            trigger. */}
        {onReadMore ? (
          <TouchableOpacity onPress={onReadMore} hitSlop={8} style={styles.readMoreRow}>
            <Text style={styles.readMoreText}>Read more →</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.backHint}>Tap to flip back</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
    // The band look, 2026-09-12 (see components/HomeSectionBand.tsx for
    // the request): accent left, hairlines top and bottom, nothing on the
    // right, square corners. The widths are the band's own constants so
    // the cards can never drift from the rows above them.
    borderRadius: 0,
    borderLeftWidth: HOME_BAND_ACCENT_WIDTH,
    borderTopWidth: HOME_BAND_EDGE_WIDTH,
    borderBottomWidth: HOME_BAND_EDGE_WIDTH,
    borderRightWidth: 0,
    // borderColor itself is set inline per-render (see the component body
    // above), not here -- the borderColor prop's own default lives on the
    // function signature instead, so this StyleSheet entry would only ever
    // be dead weight, immediately overridden either way.
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backFace: { backgroundColor: colors.primaryTint },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: HOME_BAND_EDGE_WIDTH,
  },
  // The ribbon is 1.71x taller than wide; boxing it keeps the row's height
  // the same whichever icon a caller passes.
  headerIcon: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  headerText: { ...typography.bodyEmphasis, ...textShadow, flex: 1, fontWeight: '400' },
  faceScroll: { flex: 1 },
  // flexGrow so a hook that fits is centred in the space; one that does not
  // starts at the top and scrolls.
  frontContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  hook: { ...typography.bodyEmphasis, ...textShadow, color: colors.textPrimary, textAlign: 'center', lineHeight: 21, fontWeight: '400' },
  backTitle: { ...typography.sectionTitle, ...textShadow, color: colors.primary, textAlign: 'left', fontWeight: '400' },
  backDivider: { height: 1, backgroundColor: colors.primaryMuted, opacity: 0.4, marginTop: 8, marginBottom: 10 },
  backBody: { ...typography.body, ...textShadow, color: colors.textPrimary, textAlign: 'left', lineHeight: 21 },
  readMoreRow: { alignSelf: 'flex-start', marginTop: 8 },
  readMoreText: { ...typography.bodyEmphasis, ...textShadow, color: colors.primary, fontWeight: '400' },
  backHint: {
    ...typography.caption,
    ...textShadow,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
});
