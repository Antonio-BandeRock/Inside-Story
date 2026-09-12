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

type Props = {
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  // The tab colour: accent bar, hairlines, icon and title all take it.
  color: string;
  expanded: boolean;
  onToggle: () => void;
  // Applied to the content wrapper once expanded, for a section whose
  // content wants to centre itself (the day arc, the mood orb).
  contentStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function HomeSectionBand({ title, icon, color, expanded, onToggle, contentStyle, children }: Props) {
  return (
    <View style={[styles.band, { borderColor: color }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={onToggle}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${expanded ? 'collapse' : 'expand'}`}
      >
        <Ionicons name={icon} size={16} color={color} style={textShadow} />
        <Text style={[styles.title, { color }]} numberOfLines={1}>
          {title}
        </Text>
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
  // No top padding: the header row's own bottom padding already separates
  // the name from what follows.
  content: {
    paddingHorizontal: HOME_BAND_CONTENT_PADDING,
    paddingBottom: HOME_BAND_CONTENT_PADDING,
  },
});
