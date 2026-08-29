import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, type ViewToken } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';

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

  // Real bug found 2026-08-02, after a fix to the function body below
  // (see its own comment) kept not showing up on-device despite repeated
  // reloads: `useRef(fn).current` only ever evaluates `fn` on this
  // component's FIRST render -- every render after that, React ignores
  // the new argument and hands back the exact same, original closure. A
  // plain Fast Refresh (the automatic reload Metro does when a file is
  // saved while the screen is already mounted) re-renders the component
  // with the edited code, but does NOT unmount/remount it -- so the ref's
  // `.current` kept pointing at the OLD, pre-edit closure the whole time,
  // completely independent of whether the edited logic itself was
  // correct. Fixed by splitting this into a genuinely stable OUTER
  // wrapper (still `useRef`'d once, satisfying FlatList's own
  // same-identity requirement) that only ever forwards to an INNER
  // implementation kept in a plain ref reassigned on every render --  a
  // normal `ref.current = ...` assignment, unlike `useRef`'s own
  // initializer, runs every render regardless of Fast Refresh, so the
  // real logic below now actually updates the moment its own source
  // changes.
  const onViewableItemsChangedImplRef = useRef(
    (_info: { viewableItems: ViewToken[] }) => {},
  );
  onViewableItemsChangedImplRef.current = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
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
    const label = topOption.groupLabel;
    if (!label) {
      setStickyLabel(null);
      return;
    }
    // Reported directly 2026-08-02: a real group with only 2-3 rows (e.g.
    // "Grape" -- just Red/White) can be SMALLER than however many rows the
    // box's own viewport shows at once (tuned for ~3 at a time -- see
    // `item`'s own comment) -- so the box can display the group's last
    // member AND the very next, genuinely ungrouped rows (Grapefruit
    // juice, Honeydew melon juice) all on screen simultaneously. The
    // pinned overlay only used to check the TOPMOST visible row's own
    // groupLabel, so it kept showing "Grape" the whole time that row was
    // still on screen, even with the real boundary already visible right
    // below it -- reading as if Honeydew/Grapefruit belonged to Grape too.
    // Neither of the two earlier row-level fixes (a border, then an
    // opaque accent bar) could ever have addressed this: the bold, pinned
    // label at the very top of the box is what a person's eye actually
    // reads as "what this screen is currently showing," regardless of any
    // per-row edge treatment underneath it. Fixed by checking the WHOLE
    // visible set, not just the top row: the pin only stays up while
    // every single visible row -- header or member -- still belongs to
    // this exact group. The instant a visible row breaks that (ungrouped,
    // or a different group), the real boundary is already on screen
    // without scrolling, so showing a pinned duplicate above it would
    // misrepresent what's actually there -- drop the pin immediately.
    for (const viewToken of viewableItems) {
      if (viewToken.index === null) continue;
      const option = optionsRef.current[viewToken.index];
      if (!option) continue;
      const belongsToGroup = option.isHeader ? option.label === label : option.groupLabel === label;
      if (!belongsToGroup) {
        setStickyLabel(null);
        return;
      }
    }
    setStickyLabel(label);
  };
  const onViewableItemsChanged = useRef((info: { viewableItems: ViewToken[] }) =>
    onViewableItemsChangedImplRef.current(info),
  ).current;

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
                <View style={[styles.groupHeader, { borderLeftColor: tabColor }]}>
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
            // unmistakable visual signal, not just a correct but subtle
            // overlay update.
            //
            // Two earlier attempts both failed to show up on-device, each
            // confirmed against a real cold reload (bundle downloaded
            // 0-100%, not a cached one) -- a thicker top border on just the
            // transition row, then a translucent (~10% alpha) background
            // tint across every grouped row. The real reason, found only
            // after actually tracing what these rows render on TOP of:
            // `colors.surface` (this list's own container background,
            // `styles.container` below) is itself translucent
            // (`rgba(69, 84, 111, 0.85)`, letting the tab's own background
            // photo show through), so a second, even-more-translucent tint
            // stacked on top of that was compositing into something too
            // faint to read against a busy photo background -- not a
            // logic bug, a contrast bug. Fixed with a solid, fully OPAQUE
            // left accent bar instead of any translucent full-row tint --
            // opacity can't get lost in a transparency stack the way a
            // blended color can, so this reads the same regardless of
            // what photo/theme is showing through the surface behind it.
            //
            // Reported directly 2026-08-02, once the accent bar itself was
            // confirmed actually visible on-device: the bar correctly
            // marks WHICH rows are in a group, but nothing marked where
            // the group STOPS -- a plain row sitting right after the last
            // tinted one, with no gap or boundary of its own, still read
            // as a continuation of the same block. Fixed with an explicit
            // end-of-group cap: the group's own last member (the next
            // option in the list is either absent, a new header, or a
            // different group) gets a bold bottom border in the group's
            // own color plus real extra spacing below it -- a visible
            // "this block just ended" break, not just the absence of a
            // bar on the row that follows.
            const nextOption = index + 1 < options.length ? options[index + 1] : null;
            const isLastOfGroup =
              !!item.groupLabel && (!nextOption || nextOption.isHeader || nextOption.groupLabel !== item.groupLabel);
            return (
              <TouchableOpacity
                style={[
                  styles.item,
                  item.groupLabel ? { borderLeftColor: tabColor } : null,
                  isLastOfGroup ? [styles.itemGroupEnd, { borderBottomColor: tabColor }] : null,
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
          <View style={[styles.groupHeader, { borderLeftColor: tabColor }, styles.stickyOverlay]} pointerEvents="none">
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
    // Reserved (transparent) even for an ungrouped row so a grouped row's
    // own opaque accent bar (see renderItem above) never shifts text left
    // by 4px relative to its neighbors -- only the color changes.
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  itemText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  itemTextSelected: { ...typography.bodyEmphasis, color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  // Marks a real group's own LAST member -- see renderItem's own comment
  // for why this exists alongside the left accent bar. A visibly thicker,
  // colored bottom border reads as a deliberate "block ends here" cap
  // (color, not just thickness, so it can't be confused with the plain
  // 1px `colors.border` every row already has), plus real breathing room
  // below it so the next, genuinely unrelated row doesn't sit flush
  // against the group the way every other adjacent pair of rows does.
  itemGroupEnd: {
    borderBottomWidth: 3,
    marginBottom: 8,
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
    // Matches item's own reserved left border below so a header and its
    // real members form one continuous colored strip top-to-bottom, and so
    // header/member text stays aligned at the same left edge either way --
    // color itself is applied inline in renderItem below (tabColor is a
    // prop, not available to this static stylesheet).
    borderLeftWidth: 4,
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
