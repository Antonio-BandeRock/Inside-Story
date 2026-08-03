import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, type ViewToken } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export type InlineSelectOption = {
  label: string;
  value: string;
  // Non-selectable section header, 2026-08-02 -- lets a caller with a
  // genuinely groupable list (see lib/foodNameGrouping.ts) show a "Cheese"
  // heading above its own member rows without this component needing to
  // know anything about WHY those rows are related. Omitted (the default)
  // for every existing caller -- an ordinary tappable row, unchanged.
  isHeader?: boolean;
  // Set on a real group member to that group's own header label (see
  // lib/foodNameGrouping.ts's own comment on GroupedFoodEntry) -- drives
  // the sticky-overlay tracking below. Omitted for an ungrouped row and
  // for header rows themselves.
  groupLabel?: string;
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
  // A hand-rolled sticky group header, 2026-08-02 -- a real, on-device
  // crash ruled out FlatList's own native `stickyHeaderIndices` (and, by
  // the same underlying mechanism, SectionList's `stickySectionHeadersEnabled`)
  // for this list: that native code path apparently can't handle a list
  // nested inside another ScrollView (required here, see
  // `nestedScrollEnabled` below) carrying anywhere from ~70 to ~300 group
  // headers (Dairy/Meat/Veg), even though the identical
  // stickySectionHeadersEnabled mechanism works fine elsewhere in this app
  // for a 3-section list that ISN'T nested (see FoodLookup.tsx's own
  // nutrient results table). Deliberately reimplemented without touching
  // that native mechanism at all: `onViewableItemsChanged` is a plain JS
  // callback RN already fires whenever the set of visible rows changes, no
  // different in kind from a scroll listener -- from the topmost visible
  // row, look up which group (if any) it belongs to, and render a plain
  // absolutely-positioned View over the top of the list showing that
  // group's own label. No native sticky-position bookkeeping is ever
  // involved, so this doesn't share the crashed native code path regardless
  // of list size or nesting.
  const [stickyLabel, setStickyLabel] = useState<string | null>(null);

  // FlatList requires `onViewableItemsChanged` to keep the same identity
  // across renders (it warns/throws otherwise) -- but `options` itself is
  // a fresh array every render from most callers (FoodLookup.tsx doesn't
  // memoize `foodListOptions`). Keeping the latest options in a ref lets
  // the callback stay referentially stable while still reading current
  // data.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    let topIndex: number | null = null;
    for (const viewToken of viewableItems) {
      if (viewToken.index !== null && (topIndex === null || viewToken.index < topIndex)) {
        topIndex = viewToken.index;
      }
    }
    if (topIndex === null) {
      setStickyLabel(null);
      return;
    }
    const topOption = optionsRef.current[topIndex];
    // A header itself scrolled to the top means the real header row is
    // already visible right there -- showing the overlay too would just
    // duplicate it, so only show the overlay once we've scrolled past a
    // header into its own members.
    if (!topOption || topOption.isHeader) {
      setStickyLabel(null);
      return;
    }
    setStickyLabel(topOption.groupLabel ?? null);
  }).current;

  // viewAreaCoveragePercentThreshold: 0 -- fire as soon as a row has ANY
  // pixel on screen, so the "topmost visible row" this tracks matches what
  // a person would actually call the top of the list, not something that
  // requires a full row's height to already be showing.
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 0 }).current;

  return (
    <View style={[styles.container, { height, borderColor: tabColor }, squareTop && styles.squareTop]}>
      <View style={[styles.header, { borderBottomColor: tabColor }]}>
        <Text style={[styles.headerText, { color: tabColor }]} numberOfLines={1}>
          {header}
        </Text>
      </View>
      <View style={styles.listWrapper}>
        <FlatList
          style={styles.list}
          data={options}
          keyExtractor={(option, index) => `${option.value}-${index}`}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          // Android specifically needs this said explicitly for a scrollable
          // list's own gesture to win over the outer page ScrollView it sits
          // inside, rather than the two fighting over the same touch -- iOS
          // already behaves this way without it.
          nestedScrollEnabled
          renderItem={({ item, index }) => {
            if (item.isHeader) {
              return (
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupHeaderText, { color: tabColor }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              );
            }
            const isSelected = item.value === value;
            // Reported directly 2026-08-02, on Bev's own Juice subcategory
            // once its own grouping was cut down to just a handful of real
            // groups scattered among many ungrouped singletons: an
            // ungrouped item shares this exact same plain row style as a
            // real group member, so one sitting right after a header's
            // true members (purely because it happens to sort
            // alphabetically nearby -- "Cucumber juice" right after the
            // "Coconut" group, say) visually read as if it belonged to
            // that group too, even though `groupLabel` correctly says
            // otherwise. The sticky-header overlay above already tracks
            // this correctly (it clears itself the moment the topmost
            // visible row has no groupLabel), but that's a small, easy-to-
            // miss text change -- a real ungrouped item needs its OWN
            // unmistakable visual break from whatever came before it, not
            // just a correct but subtle overlay update. Flagged only at
            // the transition point (ungrouped item immediately following a
            // header or a real grouped member) -- a run of several
            // ungrouped items in a row needs no repeated break between
            // them, and the very first row in the list needs none either.
            const previous = index > 0 ? options[index - 1] : null;
            const isStartOfUngroupedRun = !item.groupLabel && !!previous && (previous.isHeader || !!previous.groupLabel);
            return (
              <TouchableOpacity
                style={[
                  styles.item,
                  isStartOfUngroupedRun ? styles.itemUngroupedStart : null,
                  isSelected ? { backgroundColor: tabColor } : null,
                ]}
                onPress={() => onChange(item.value)}
              >
                <Text style={[styles.itemText, isSelected ? styles.itemTextSelected : null]} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
        {stickyLabel ? (
          <View style={[styles.groupHeader, styles.stickyOverlay]} pointerEvents="none">
            <Text style={[styles.groupHeaderText, { color: tabColor }]} numberOfLines={1}>
              {stickyLabel}
            </Text>
          </View>
        ) : null}
      </View>
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
  // Wraps the FlatList and the sticky overlay together so the overlay can
  // be positioned absolutely relative to this box specifically, not the
  // whole component (which also contains the fixed `header` bar above).
  listWrapper: { flex: 1, position: 'relative' },
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
  // Marks the first ungrouped row after a header/real group member -- see
  // this style's own call site in renderItem for why it's needed. A
  // visibly thicker top border reuses the same visual language `item`'s
  // own bottom border already establishes for "a boundary between rows,"
  // rather than inventing a second, different-looking divider convention.
  itemUngroupedStart: {
    borderTopWidth: 3,
    borderTopColor: colors.border,
  },
  // A plain, non-tappable divider row -- deliberately not shaped like
  // `item` (no border, no press feedback) so it reads as organizational
  // chrome rather than one more option in the list. Opaque background is
  // required, not cosmetic, both for its normal in-flow appearance and for
  // the sticky-overlay copy of this same style (see stickyOverlay below) --
  // without it, rows scrolling underneath the pinned overlay would show
  // through.
  groupHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // The hand-rolled sticky header itself -- see the component's own top
  // comment for why this exists instead of a native sticky-header prop.
  // Positioned at the very top of listWrapper, directly under the fixed
  // "Select a..." header bar (which lives outside listWrapper entirely),
  // so it reads as a natural continuation of the list rather than a
  // second, competing header.
  stickyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  groupHeaderText: typography.eyebrow,
});
