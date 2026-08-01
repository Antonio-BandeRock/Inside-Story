import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export type InlineSelectOption = {
  label: string;
  value: string;
};

// A plain, always-inline single-select scrollable list -- deliberately NOT
// built on Dropdown.tsx's floating-menu/portal machinery (no
// measureInWindow, no overlay, no computed screen-absolute position).
// That approach requires knowing a trigger field's exact on-screen position
// at the moment its menu opens, and getting that measurement reliably
// turned into a real, repeated source of bugs (the menu opening on top of
// its own field) that survived several attempted fixes. This sidesteps the
// whole class of problem: it's a normal child in ordinary document flow,
// sized via a plain `height` style prop like any other box on the page, so
// its size and position are exactly what the caller's own layout says --
// nothing to measure, nothing to get wrong.
//
// No open/closed state of its own, either -- it's always fully visible
// wherever the caller places it. A caller that wants "pick one, then show a
// compact summary instead" (see app/(tabs)/insights.tsx's Food Lookup lens)
// owns that toggle itself, swapping this list out for its own summary
// row -- this component only ever does the one job of showing the list and
// reporting a tap.
export function InlineSelectList({
  options,
  value,
  onChange,
  height,
  tabColor,
  header,
  squareTop,
}: {
  options: InlineSelectOption[];
  value: string;
  onChange: (value: string) => void;
  height: number;
  // Same "this box's border says which page/dimension it belongs to" rule
  // already used elsewhere (e.g. Insights' own TAB_COLOR) -- passed in
  // rather than hardcoded so this stays reusable across pages with
  // different identity colors.
  tabColor: string;
  // A plain instructional heading pinned to the top of the box (e.g.
  // "Select a Food Category") -- part of `height` (see the FlatList's own
  // flex:1 below), not added on top of it, so the box's own total
  // footprint/bottom edge never moves regardless of whether a header is
  // present.
  header: string;
  // Squares off just the top two corners, 2026-07-28 -- for a caller that
  // sits this box directly beneath another box of its own with no gap
  // (e.g. SideBuilder.tsx's connected Dish/Ingredients summary card), so
  // the two read as one continuous unit at that seam instead of a rounded
  // corner poking out from under a square one.
  squareTop?: boolean;
}) {
  return (
    <View style={[styles.container, { height, borderColor: tabColor }, squareTop && styles.squareTop]}>
      <View style={[styles.header, { borderBottomColor: tabColor }]}>
        <Text style={[styles.headerText, { color: tabColor }]} numberOfLines={1}>
          {header}
        </Text>
      </View>
      <FlatList
        style={styles.list}
        data={options}
        keyExtractor={(option, index) => `${option.value}-${index}`}
        // Android specifically needs this said explicitly for a scrollable
        // list's own gesture to win over the outer page ScrollView it sits
        // inside, rather than the two fighting over the same touch -- iOS
        // already behaves this way without it.
        nestedScrollEnabled
        renderItem={({ item }) => {
          const isSelected = item.value === value;
          return (
            <TouchableOpacity
              style={[styles.item, isSelected ? { backgroundColor: tabColor } : null]}
              onPress={() => onChange(item.value)}
            >
              <Text style={[styles.itemText, isSelected ? styles.itemTextSelected : null]} numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: colors.surface,
    // Clips both the header and the FlatList to the container's own
    // rounded corners -- without this, the FlatList's square top corners
    // would show past the header's rounded top.
    overflow: 'hidden',
  },
  squareTop: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  // paddingVertical tightened 2026-07-28 (was 8) -- explicitly requested,
  // part of a pass shrinking the buffer around every row/separator in the
  // connected Category/Food picker (see SideBuilder.tsx's own comment) so
  // more real rows fit on screen at once while searching.
  header: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderBottomWidth: 1,
  },
  headerText: typography.label,
  // flex: 1, not a fixed height -- fills whatever's left of the container
  // after the header above it, so the container's own `height` prop stays
  // the single source of truth for the whole box's total footprint.
  list: { flex: 1 },
  // paddingVertical tightened 2026-07-28 (was 10) -- same pass as header's
  // own comment above; explicitly requested to fit more rows (aiming for
  // 3 visible Food rows at once) in the same available height.
  item: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemText: { ...typography.body, color: colors.textPrimary },
  itemTextSelected: { ...typography.bodyEmphasis, color: colors.textOnPrimary },
});
