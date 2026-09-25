// A Home section as a full-width band: one collapsible row carrying the
// section's name in the colour of the tab it is a window into, expanding
// on tap to the section's real content.
//
// 2026-09-12, direct request, three parts in one:
//
// The look. "You made the left side line be about 4 times thicker than all
// of the rest and then kept the top and bottom lines at about 1 pixel...
// but the right side of the box was left without any line. I like that
// look. Let's try it out on the homescreen first." That is
// InlineSelectList's own grouped-row treatment (a 4px accent bar down the
// left, a hairline below, nothing on the right), lifted onto Home's
// cards. The accent, the hairlines and the header text all carry the
// tab's colour, so the band says which tab it belongs to without a
// separate label, the same signal the old full 2px border carried.
//
// The width. "I don't see a reason to limit the left and right sides of
// screens with the padding... use the available width of the entire
// screen... with the padding in effect for the text or anything else that
// is present, but not for the boxes." So the band itself runs edge to
// edge with no corner radius (a rounded corner on a bar that starts at the
// screen's own edge would curl the accent line for no reason), and only
// what sits inside it is inset.
//
// The fold. "The entities that exist on the Home screen need to collapse
// and expand to one row height with just the name of what it is, such as
// 'Grocery List', and then when they click on it it expands to show the
// rest." The header row is that one row; expanded state is the caller's
// (Home remembers it per section through visual preferences).
//
// 2026-09-12, same day, direct correction: "All things on the Home Screen
// are supposed to be Quick Actions. It makes no sense to suggest that some
// are Quick Actions and others are not." So a band can also be an action
// row: the same one-row shape, but tapping it does the thing (opens the
// scanner, logs a flare) rather than unfolding, and its chevron points
// forward instead of down. There is nothing to unfold for a plain action,
// and a fold that only ever revealed one button would be a step for
// nothing.
//
// Later the same day, two more shapes. A 'static' band is a header row
// with its content always shown and nothing to tap: the Digest cards,
// which the request kept horizontal and "not collapsable" but wanted in
// the same formatting. And an action row can carry a value at its right
// edge (a count), for the two rows that used to be the stat tiles: the
// number is the whole point of those, so it belongs on the row itself
// rather than behind a fold.
//
// Purely presentational: no data, no navigation, so it stays reusable if
// another tab ever wants the same treatment.
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';

// Left accent against the thin edges: "about 4 times thicker" than a 1px
// line, and the same 4px InlineSelectList's own grouped rows already use.
export const HOME_BAND_ACCENT_WIDTH = 4;
export const HOME_BAND_EDGE_WIDTH = 1;

// The inset for anything drawn inside a band, so text lands 16px in from
// the accent bar. Same value Home's cards used for their own content
// before the bands existed, kept so nothing inside them shifts.
export const HOME_BAND_CONTENT_PADDING = 16;

// The distance between one band and the next, wherever bands are stacked.
// 2026-09-12, direct instruction after the Nutrients lens took the band
// look: "make sure the info boxes on the Nutrients lens are the same
// distance between each other as the info boxes on the Home screen. Set
// that distance as the standard for distance between them on every part
// of the app." Home's own bands had sat at 10 since 2026-08-08; the
// Nutrients lens matched that between its two bands but left 14 between
// its explainer and the first one. One constant now, read by every
// screen that stacks bands (Home's page column, Insights' bandColumn and
// its explainer's gap to what follows), so the spacing cannot drift
// again as more lenses take this shape.
export const HOME_BAND_GAP = 10;

// How long a hold has to last before it counts as one. React Native
// defaults to 500ms; 400 is enough to be deliberate and short enough that
// somebody who meant it does not let go first thinking nothing happened.
const LONG_PRESS_DELAY = 400;

type CommonProps = {
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  // A custom glyph in place of the Ionicons one (the Digest's real
  // awareness ribbon rather than the rejected 'ribbon' glyph).
  renderIcon?: (size: number, color: string) => ReactNode;
  // The tab colour: accent bar, hairlines, icon and title all take it.
  color: string;
  // The title's own colour when a tab's fill and its readable text are two
  // different tokens (the Digest's are). Defaults to `color`.
  textColor?: string;
  // Holding a band down, 1.0.39.16, direct request: "the ability to long
  // hold on a Home screen group that causes it to be able to be dragged
  // and dropped into a new order on the screen". The band itself only
  // reports the hold; what it means is the caller's business, which on
  // Home is turning the whole page into the arranging list.
  //
  // A hold rather than a visible control on every band, because the page
  // is read far more often than it is rearranged, and a grip handle on
  // twelve rows would be twelve pieces of furniture in the way of the
  // thing somebody actually came for.
  onLongPress?: () => void;
};

type FoldProps = CommonProps & {
  kind?: 'fold';
  expanded: boolean;
  onToggle: () => void;
  // Applied to the content wrapper once expanded, for a section whose
  // content wants to centre itself (the day arc, the mood orb).
  contentStyle?: StyleProp<ViewStyle>;
  // A line under the title shown only while the band is folded, so a
  // folded band can still say one thing (Your Story names the next thing
  // to set up, 2026-09-24). Opening the band hides it, since the content
  // says it in full.
  foldedCaption?: string;
  children: ReactNode;
};

type ActionProps = CommonProps & {
  kind: 'action';
  onPress: () => void;
  // Shown at the row's right edge, ahead of the chevron: a count, a total.
  value?: string;
  // A line under the title saying what the row does, for a row whose name
  // alone does not (Food's Log or Schedule a Meal, 2026-09-13). The row
  // grows to fit it; a row without one keeps its single-line height.
  caption?: string;
  // Only when the value itself carries a meaning of its own (a warning
  // colour for a flagged count). Defaults to the tab colour.
  valueColor?: string;
};

type StaticProps = CommonProps & {
  kind: 'static';
  contentStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function HomeSectionBand(props: FoldProps | ActionProps | StaticProps) {
  const { title, icon, color } = props;
  const textColor = props.textColor ?? color;
  const glyph = props.renderIcon ? (
    props.renderIcon(16, color)
  ) : (
    <Ionicons name={icon} size={16} color={color} style={textShadow} />
  );
  if (props.kind === 'action') {
    return (
      <View style={[styles.band, { borderColor: color }]}>
        <TouchableOpacity
          style={styles.header}
          onPress={props.onPress}
          onLongPress={props.onLongPress}
          delayLongPress={LONG_PRESS_DELAY}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={props.value != null ? `${title}, ${props.value}` : title}
        >
          {glyph}
          {props.caption ? (
            <View style={styles.titleColumn}>
              <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.caption}>{props.caption}</Text>
            </View>
          ) : (
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
          )}
          {props.value != null ? (
            <Text style={[styles.value, { color: props.valueColor ?? textColor }]}>{props.value}</Text>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={color} style={textShadow} />
        </TouchableOpacity>
      </View>
    );
  }
  if (props.kind === 'static') {
    return (
      <View style={[styles.band, { borderColor: color }]}>
        <View style={styles.header} accessibilityRole="header">
          {glyph}
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={[styles.content, props.contentStyle]}>{props.children}</View>
      </View>
    );
  }
  const { expanded, onToggle, contentStyle, children } = props;
  return (
    <View style={[styles.band, { borderColor: color }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={onToggle}
        onLongPress={props.onLongPress}
        delayLongPress={LONG_PRESS_DELAY}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${expanded ? 'collapse' : 'expand'}`}
      >
        {glyph}
        {!expanded && props.foldedCaption ? (
          <View style={styles.titleColumn}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.caption}>{props.foldedCaption}</Text>
          </View>
        ) : (
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        )}
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={color} style={textShadow} />
      </TouchableOpacity>
      {expanded ? <View style={[styles.content, contentStyle]}>{children}</View> : null}
    </View>
  );
}

// The same band shape for a box that is not a collapsible section (the
// greeting card, the loading and all-hidden notices, the test-data
// warning): edge to edge, accent left, hairlines top and bottom, its own
// content padding. Colour is set at the call site.
export const homeBandStyle: ViewStyle = {
  backgroundColor: colors.surface,
  borderLeftWidth: HOME_BAND_ACCENT_WIDTH,
  borderTopWidth: HOME_BAND_EDGE_WIDTH,
  borderBottomWidth: HOME_BAND_EDGE_WIDTH,
  borderRightWidth: 0,
  borderRadius: 0,
};

const styles = StyleSheet.create({
  band: { ...homeBandStyle },
  // One row: 12px above and below a single line of body text lands at
  // roughly 44px, a comfortable thumb target and exactly the "one row
  // height" asked for.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: HOME_BAND_CONTENT_PADDING,
  },
  title: { ...typography.bodyEmphasis, ...textShadow, flex: 1, fontWeight: '400' },
  titleColumn: { flex: 1, gap: 2 },
  caption: { ...typography.caption, ...textShadow, color: colors.textSecondary, lineHeight: 16 },
  // A count on an action row: larger than the name so the number reads
  // as the thing the row is about, the way the old tile's number did.
  value: { ...typography.sectionTitle, ...textShadow, fontWeight: '400', marginRight: 4 },
  // No top padding: the header row's own bottom padding already separates
  // the name from what follows.
  content: {
    paddingHorizontal: HOME_BAND_CONTENT_PADDING,
    paddingBottom: HOME_BAND_CONTENT_PADDING,
  },
});
