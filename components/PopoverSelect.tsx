import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KEYBOARD_HEIGHT } from '../constants/appKeyboard';
import { colors, inputBackground, popoverBackground } from '../constants/colors';
import { typography } from '../constants/typography';
import { useActiveInputControls } from './ActiveInputContext';
import type { DropdownOption } from './Dropdown';
import { useOverlay } from './OverlayContext';

// Replaces components/WheelPicker.tsx entirely, 2026-08-01, the same day
// that combination-lock wheel picker was built -- not a restyle of it, a
// different interaction altogether. The wheel's own drag-to-scroll
// mechanic turned out to have two real, reported usability problems no
// amount of tuning fixed: it always needed a first touch just to "wake up"
// before it could actually be dragged (see WheelPicker's own git history
// for the lazy-activation attempt that surfaced this), and a dragging
// finger physically covers the one row -- the live, centre one -- a
// person is trying to watch settle. Both are inherent to a small,
// finger-dragged dial; neither is fixable by patching that mechanic
// further. This is a plain field that opens a small list of tappable
// options instead: no drag gesture at all, so nothing to wake up first and
// nothing for a finger to cover mid-selection -- the single most common
// pattern high-quality apps use for "choose one from a short list," and
// the same one this app's own Dropdown.tsx already proves out elsewhere
// (Category/Food/etc. pickers), just anchored to the side of the field
// instead of below it (see computePopoverPosition below) and restyled to
// the app's current dark palette rather than Dropdown's own stale,
// pre-redesign colours.
//
// 2026-08-08: gained an optional `searchable` mode, reusing Dropdown.tsx's
// own proven AppKeyboard search-row mechanism (setSearchRequest) rather
// than inventing a second one -- explicitly requested as the standing
// pattern for every picker in the app going forward, not just a one-off:
// "all dropdown menus need to be selectable scroll lists just like those
// on the Side Dish Builder Dish Name page... the app keyboard can pop up
// to search as the list could definitely be longer." This is now the one
// real distinction left between this component and Dropdown.tsx -- both
// share the same search mechanism and dark-palette styling; this one
// anchors beside its field with a fixed-height list (short-list-friendly),
// Dropdown always opens below with a variable height (better for a field
// that needs to sit flush against a long scrolling form). Also gained
// `options` accepting real label/value pairs (DropdownOption), not just a
// plain word standing in for its own value -- needed the moment a picker's
// display text (a medication's generic name, a nutrient's display name)
// differs from what's actually stored (a database id/code). Plain
// `string[]` still works unchanged for every existing short-list caller.
export type PopoverSelectOption = string | DropdownOption;

function normalizeOption(option: PopoverSelectOption): DropdownOption {
  return typeof option === 'string' ? { label: option, value: option } : option;
}

const SCREEN_MARGIN = 12;
// Gap between the field's own edge and the popover list beside it --
// small and deliberate, the same "not touching, not a big default gap
// either" reasoning as Dropdown's own MENU_GAP.
const GAP_FROM_FIELD = 6;
// Tall enough for a comfortable tap target (a bare wheel row was only
// 26dp, fine for a glance-and-drag gesture but too tight for a direct tap
// target), short enough that six of them still read as one compact list.
const ROW_HEIGHT = 38;
const LIST_PADDING_VERTICAL = 6;
// Caps how tall the popover gets before its own list starts scrolling --
// Cut Prep's 18 options would otherwise make for a popover taller than
// most phones have room for. A searchable list gets a slightly taller cap
// (see MAX_VISIBLE_ROWS_SEARCHABLE below) -- it's expected to genuinely
// run longer, and search narrows it down quickly once someone starts
// typing, so a bit more room per screenful is worth it.
const MAX_VISIBLE_ROWS = 6;
const MAX_VISIBLE_ROWS_SEARCHABLE = 8;
// A fixed width rather than measured from content, deliberately -- most
// options here are a short, plain word ("Diced," "Sautéed," "Deep-Fried");
// real text measurement would be real added machinery for a problem a
// generous constant already solves. Callers with longer real-world labels
// (a medication name, a nutrient's full display name) override this via
// the `width` prop instead.
const POPOVER_WIDTH = 160;

type Anchor = { x: number; y: number; width: number; height: number };

// Opens to whichever side of the field has more of the screen to work
// with -- explicitly requested: right if the field sits in the left half
// of the screen, left if it sits in the right half, so the list always
// opens toward the open side of the screen rather than off whichever edge
// happens to be closer. Vertically centred on the field itself, clamped to
// stay fully on-screen the same way (SCREEN_MARGIN on every edge) -- same
// clamping idea as Dropdown's own computeMenuPosition, just measured
// against a known, fixed list height instead of an after-the-fact
// measurement, since this list's height is fully determined by its own
// option count (see ROW_HEIGHT/MAX_VISIBLE_ROWS above) and never needs a
// real device measurement pass the way Dropdown's own variable-content
// menu does. `bottomReserve` (searchable pickers only, see the component
// below) additionally keeps the list from landing where AppKeyboard's own
// search row would cover it once it rises.
function computePopoverPosition(anchor: Anchor, listHeight: number, width: number, bottomReserve: number) {
  const screen = Dimensions.get('window');
  const fieldCenterX = anchor.x + anchor.width / 2;
  const opensRight = fieldCenterX < screen.width / 2;

  let left = opensRight ? anchor.x + anchor.width + GAP_FROM_FIELD : anchor.x - GAP_FROM_FIELD - width;
  left = Math.max(SCREEN_MARGIN, Math.min(left, screen.width - SCREEN_MARGIN - width));

  const fieldCenterY = anchor.y + anchor.height / 2;
  const bottomLimit = screen.height - SCREEN_MARGIN - bottomReserve;
  let top = fieldCenterY - listHeight / 2;
  top = Math.max(SCREEN_MARGIN, Math.min(top, bottomLimit - listHeight));

  return { left, top };
}

// Opens directly above the field, left-aligned to it -- mirrors
// Dropdown.tsx's own "always opens below, left-aligned" convention, just
// flipped vertically, rather than the side-anchored positioning above.
// Opt-in via the `openAbove` prop, 2026-08-14, explicitly requested for
// Nutrient Ranking specifically: with that field pinned in its own fixed
// zone right above the footer, opening to the side (the default above)
// put the list roughly level with the field itself, uncomfortably close
// to the bottom of the screen. Opening above instead puts it in the real
// open space the results area already occupies, right over the "Nutrient"
// label the field sits under.
function computePopoverPositionAbove(anchor: Anchor, listHeight: number, width: number) {
  const screen = Dimensions.get('window');

  let left = anchor.x;
  left = Math.max(SCREEN_MARGIN, Math.min(left, screen.width - SCREEN_MARGIN - width));

  let top = anchor.y - GAP_FROM_FIELD - listHeight;
  top = Math.max(SCREEN_MARGIN, top);

  return { left, top };
}

// memo'd for the same reason WheelPicker was: a field re-rendering on
// every keystroke elsewhere on the same screen shouldn't force every
// OTHER picker on that screen to re-render too. This only actually holds
// when a caller's own `options` array stays referentially stable between
// renders (a module-level constant, or a useMemo) -- a caller that
// rebuilds its options array inline on every render (e.g. mapping over
// live state) won't get that benefit, but nothing here breaks either way;
// it's a missed optimization, not a correctness risk.
export const PopoverSelect = memo(function PopoverSelect({
  options,
  selected,
  onSelect,
  tabColor,
  minWidth = 0,
  placeholder = '—',
  searchable = false,
  searchPlaceholder = 'Type to search…',
  width = POPOVER_WIDTH,
  tintedSurface = false,
  openAbove = false,
  onOpenChange,
}: {
  options: PopoverSelectOption[];
  selected: string | null;
  onSelect: (value: string) => void;
  tabColor: string;
  // Floor width, supplied by the caller from its own measured label (see
  // SideBuilder's renderLabeledPicker) so a field is never narrower than
  // the word above it -- same contract WheelPicker's own minWidth had.
  minWidth?: number;
  // Shown in the closed field when nothing's selected yet -- defaults to
  // the original plain "—" so every existing caller is unaffected.
  placeholder?: string;
  // 2026-08-08: opts into AppKeyboard's own search row (the same mechanism
  // Dropdown.tsx already uses) instead of a plain tap-to-browse list --
  // for a picker whose real option count can run long enough that
  // scrolling alone isn't a comfortable way to find one (a medication, a
  // tracked nutrient). This is the new standing default for any picker
  // whose list isn't a short, fixed, curated set.
  searchable?: boolean;
  searchPlaceholder?: string;
  // Popover width override -- see POPOVER_WIDTH's own comment.
  width?: number;
  // Opt-in, default false (every existing caller keeps the standard
  // app-wide colors.menuSurface list background, unchanged). When true,
  // the popover's own list surface is instead a lighter, opaque tint of
  // `tabColor` (see popoverBackground in constants/colors.ts) -- paired
  // with a dark/muted `tabColor` (the "line"), this is what produces a
  // "dark line, lighter field and list" look, rather than the list reading
  // as an unrelated app-wide grey next to a picker's own accent color.
  tintedSurface?: boolean;
  // Opt-in, default false (every existing caller keeps the standard
  // side-anchored positioning above, unchanged). When true, opens directly
  // above the field instead -- see computePopoverPositionAbove's own
  // comment for why/where this is used.
  openAbove?: boolean;
  // 2026-08-14, built while chasing Nutrient Ranking's own real ~15s
  // freeze (see the popover style's own `elevation` comment below for the
  // actual, confirmed root cause -- an Android stacking-order conflict
  // with the floating TabHub button, not this). This was a real, tested
  // hypothesis along the way (this screen's field opens directly over an
  // independently-scrolling results area, unlike any other PopoverSelect
  // caller) that turned out not to be the cause -- on-device evidence
  // showed a still-empty results area didn't stop the freeze. Kept
  // anyway, not reverted: pausing the underlying scroll region while a
  // popover sits on top of it is a real, sensible interaction guard on
  // its own merits, regardless of which bug it was originally chasing.
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const fieldRef = useRef<View>(null);
  const listRef = useRef<FlatList<DropdownOption> | null>(null);
  // Guards the scroll-to-current-selection effect below so it only ever
  // fires once per real "open" -- reset the moment the menu closes, not
  // touched again until it reopens. Without this, the effect (which
  // deliberately runs on every render while open, matching this file's
  // own established "no dependency array" convention below) would try to
  // re-scroll on every keystroke while searching, fighting a person's own
  // manual scroll position instead of just setting it once on open.
  const hasScrolledToSelectionRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [searchText, setSearchText] = useState('');
  const { showOverlay, hideOverlay } = useOverlay();
  const { setSearchRequest, forceClear } = useActiveInputControls();
  const insets = useSafeAreaInsets();

  const normalizedOptions = options.map(normalizeOption);
  const visibleOptions =
    searchable && searchText.trim()
      ? normalizedOptions.filter((option) => option.label.toLowerCase().includes(searchText.trim().toLowerCase()))
      : normalizedOptions;

  const maxRows = searchable ? MAX_VISIBLE_ROWS_SEARCHABLE : MAX_VISIBLE_ROWS;
  const listHeight = Math.min(maxRows, Math.max(visibleOptions.length, 1)) * ROW_HEIGHT + LIST_PADDING_VERTICAL * 2;
  const selectedIndex = selected ? visibleOptions.findIndex((option) => option.value === selected) : -1;
  const selectedLabel = selected ? (normalizedOptions.find((option) => option.value === selected)?.label ?? selected) : null;
  // Only a searchable picker can raise AppKeyboard, so only it needs to
  // reserve room for it -- a plain short list keeps behaving exactly as
  // before, free to use the full screen height like it always has.
  const bottomReserve = searchable ? insets.bottom + KEYBOARD_HEIGHT : 0;
  const resolvedPopoverBackground = tintedSurface ? popoverBackground(tabColor) : colors.menuSurface;

  function closeMenu() {
    setIsOpen(false);
    if (searchable) {
      setSearchText('');
      setSearchRequest(null);
      // Explicit, rather than relying on the search field's own unmount --
      // same reasoning as Dropdown.tsx's identical call: unmount doesn't
      // reliably fire a blur, and this guarantees the keyboard drops the
      // instant the popover closes regardless of that timing.
      forceClear();
    }
  }

  function openMenu() {
    fieldRef.current?.measureInWindow((x, y, fieldWidth, fieldHeight) => {
      setAnchor({ x, y, width: fieldWidth, height: fieldHeight });
      setIsOpen(true);
    });
  }

  function handleSelect(value: string) {
    onSelect(value);
    closeMenu();
  }

  function handleSearchChange(text: string) {
    setSearchText(text);
  }

  const menuPosition = anchor
    ? openAbove
      ? computePopoverPositionAbove(anchor, listHeight, width)
      : computePopoverPosition(anchor, listHeight, width, bottomReserve)
    : null;

  // Rebuilt from this render's own live state (options/selected/searchText)
  // rather than a one-time snapshot taken at open -- needed now that a
  // searchable list's own visible content genuinely changes while it's
  // open (typing filters it), the same reason Dropdown.tsx's own menuNode
  // is rebuilt every render too. Harmless for a non-searchable picker,
  // where nothing changes after opening anyway.
  const menuNode =
    isOpen && menuPosition ? (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
        <View
          style={[
            styles.popover,
            {
              left: menuPosition.left,
              top: menuPosition.top,
              width,
              height: listHeight,
              borderColor: tabColor,
              backgroundColor: resolvedPopoverBackground,
            },
          ]}
        >
          <FlatList
            ref={listRef}
            data={visibleOptions}
            keyExtractor={(option, index) => `${option.value}-${index}`}
            getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
            // 2026-08-14, tried and confirmed NOT the fix for Nutrient
            // Ranking's own real ~15s freeze -- kept anyway since it's
            // harmless for a list this small (6-8 visible rows at once),
            // just not the answer. removeClippedSubviews was a real,
            // well-precedented Android-specific hypothesis (a view that's
            // visibly rendered but doesn't register a touch, an artifact of
            // FlatList's own clipping-optimization machinery) -- re-tested
            // on-device with this set to false and the exact same delay
            // still reproduced, ruling it out. The actual, confirmed cause
            // was an Android view-stacking-order conflict with the floating
            // TabHub button, not a FlatList quirk at all -- see the popover
            // style's own `elevation` comment below.
            removeClippedSubviews={false}
            // 2026-08-11, real history worth keeping, since two real
            // attempts at this exact bug both had to be superseded the
            // same day rather than just tuned:
            //
            // The bug itself: React Native's FlatList, when given
            // initialScrollIndex, starts its own FIRST render batch
            // counting FROM that index, not from the top of the array --
            // items before it never render at all unless a real scroll
            // gesture past them happens, which can't happen on a short
            // list that already fits its own box. Reported exactly this
            // way: pick an item, reopen, every item above the one just
            // picked has silently stopped rendering, compounding with each
            // further pick.
            //
            // Attempt 1 (force the WHOLE list to render every open via
            // initialNumToRender) fixed that, but was too broad: opening
            // the Nutrient Ranking picker (39 real tracked nutrients,
            // searchable) took a reported ~15 real seconds before any row
            // would accept a tap, all 39 forced to render synchronously
            // on every single open.
            //
            // Attempt 2 (scope initialNumToRender to just selectedIndex + 1,
            // the minimum needed to cover "everything above the
            // selection") fixed the average case, but still degrades back
            // toward the same real slowdown whenever the current
            // selection happens to sit deep in a long list (picking one of
            // the last few nutrients in the 39-item list still forces
            // nearly all of them to render) -- confirmed as still
            // reported slow, not just a hypothetical edge case.
            //
            // The actual, robust fix: stop using initialScrollIndex at
            // all, which is what triggers the underlying FlatList quirk in
            // the first place. A plain, un-special-cased open (FlatList's
            // own ordinary small default initialNumToRender, rendering
            // from the top) has no bug to work around, at any list length,
            // regardless of where the selection is -- see the
            // scroll-to-current-selection useEffect below, which
            // positions the list AFTER that cheap initial render via a
            // directly-computed pixel offset (scrollToOffset, not
            // scrollToIndex -- deliberately: scrollToOffset needs no
            // knowledge of what FlatList has or hasn't measured/rendered
            // yet, sidestepping the exact class of quirk this bug already
            // came from, where scrollToIndex is documented to have real,
            // similar edge cases of its own).
            renderItem={({ item }) => {
              const isRowSelected = item.value === selected;
              return (
                <TouchableOpacity
                  style={[styles.row, isRowSelected ? { backgroundColor: tabColor } : null]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text numberOfLines={1} style={[styles.rowText, isRowSelected ? styles.rowTextSelected : null]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={searchable ? <Text style={styles.emptyText}>No matches.</Text> : null}
          />
        </View>
      </View>
    ) : null;

  // Real dependency array here, deliberately, unlike the effects around it
  // -- onOpenChange (see its own comment above) only needs to fire when
  // isOpen genuinely changes, not on every incidental re-render while open.
  useEffect(() => {
    onOpenChange?.(isOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // No dependency array, deliberately -- mirrors Dropdown.tsx's own
  // identical effect, so the overlay always reflects this render's latest
  // state (cheap: only one picker is ever open at a time).
  //
  // 2026-08-14, changed from useEffect to useLayoutEffect: real, on-device
  // adb logcat evidence (not just this app's own console output) found a
  // genuine, measured 2-second gap between THIS effect calling showOverlay
  // and OverlayRoot (a separate component, mounted at the app's true root)
  // actually re-rendering to reflect it -- happening even though this
  // component's own isOpen state had already committed fast. A plain
  // useEffect callback is scheduled as regular-priority work, deferrable
  // by React's own scheduler; useLayoutEffect runs synchronously as part
  // of the same commit instead, giving this specific update no room to be
  // deprioritized behind whatever else the scheduler is weighing at that
  // moment. A real, low-risk, surgical change -- only affects when this
  // one effect runs relative to paint, not what it does.
  useLayoutEffect(() => {
    if (isOpen) {
      showOverlay(menuNode);
    } else {
      hideOverlay();
    }
  });

  // Positions the list at the current selection once per open, via a
  // directly-computed offset -- see the FlatList's own comment above for
  // why this replaced initialScrollIndex entirely rather than just tuning
  // it again. Also runs with no dependency array (matching this file's
  // own convention above), guarded by hasScrolledToSelectionRef so it
  // only ever actually scrolls once per real open, not on every render.
  useEffect(() => {
    if (!isOpen) {
      hasScrolledToSelectionRef.current = false;
      return;
    }
    if (hasScrolledToSelectionRef.current) return;
    if (searchText.trim() || selectedIndex < 0 || selectedIndex >= visibleOptions.length) return;
    hasScrolledToSelectionRef.current = true;
    const targetOffset = ROW_HEIGHT * selectedIndex;
    // One frame's worth of defer -- the same "let a just-triggered mount/
    // layout actually land first" pattern already used elsewhere in this
    // app, guarding against the overlay's own portal render not having
    // attached the FlatList's ref on this exact same tick yet.
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
    });
  });

  // Feeds this picker's own search text into AppKeyboard's search row
  // instead of rendering a text field inside the popover itself.
  //
  // 2026-08-12: real, reported bug -- opening Nutrient Ranking's own
  // searchable field (39 real tracked nutrients) froze the whole app for
  // ~15 real seconds before the popover and the keyboard both suddenly
  // appeared together, with any other pending tap (a TabHub press made
  // mid-freeze) flushing at the same moment -- the signature of the JS
  // thread being genuinely busy, not just one row being slow to render.
  // Root cause: this effect had no dependency array and called
  // setSearchRequest with a BRAND NEW object on literally every render of
  // this component, unconditionally, even when nothing about the search
  // state had actually changed. That's normally harmless for a stable
  // caller, but Nutrient Ranking's own `options` prop was rebuilt fresh on
  // every render of ITS parent (see NutrientRankingView's own fix in
  // insights.tsx) -- defeating this component's memo() bailout, so ANY
  // unrelated re-render of that screen re-rendered this component too,
  // which re-fired this effect, which called setSearchRequest again,
  // which re-rendered AppKeyboard (the one real consumer of searchRequest,
  // mounted at the app root) again -- a real, high-frequency cascade, not
  // a literal infinite loop (it does eventually settle), but easily heavy
  // enough to read as a genuine freeze. The exact same shape as two prior,
  // already-fixed infinite-render bugs in this app (see
  // ActiveInputContext.tsx's own two "no dependency array" warnings) --
  // this is a real, live third instance of the same class of problem.
  //
  // Fixed at both ends: the caller-side fix (memoizing `options`) should
  // already stop this component from re-rendering needlessly. This is the
  // belt-and-suspenders half, directly on the piece that actually raises
  // the keyboard -- a real content guard (a ref tracking what was last
  // actually dispatched) means setSearchRequest only fires when the
  // meaningful values (open/closed, the typed text, the placeholder)
  // genuinely changed, not on every incidental re-render, regardless of
  // whether some future caller elsewhere in the app ever reintroduces an
  // unmemoized options prop the same way. Still fully live the moment
  // something real does change (typing, opening, closing) -- nothing here
  // delays or debounces an actual update, it only skips redundant ones.
  const lastDispatchedSearchRequestRef = useRef<{ value: string; placeholder?: string } | null>(null);
  useEffect(() => {
    if (!searchable) return;
    const next = isOpen ? { value: searchText, placeholder: searchPlaceholder } : null;
    const prev = lastDispatchedSearchRequestRef.current;
    const unchanged =
      (next === null && prev === null) ||
      (next !== null && prev !== null && next.value === prev.value && next.placeholder === prev.placeholder);
    if (unchanged) return;
    lastDispatchedSearchRequestRef.current = next;
    setSearchRequest(next ? { value: searchText, onChangeText: handleSearchChange, placeholder: searchPlaceholder } : null);
  });

  // Defensive: if this field unmounts while its own popover is open (its
  // whole screen navigates away, or a form resets after saving), don't
  // leave a popover -- or a live AppKeyboard search request -- on screen
  // with no owner left to close it.
  useEffect(
    () => () => {
      hideOverlay();
      if (searchable) setSearchRequest(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <TouchableOpacity
      ref={fieldRef}
      style={[
        styles.field,
        { minWidth, backgroundColor: inputBackground(tabColor), borderColor: isOpen ? tabColor : colors.border },
      ]}
      onPress={openMenu}
      activeOpacity={0.7}
    >
      <Text numberOfLines={1} style={[styles.fieldText, selectedLabel ? { color: colors.textPrimary } : styles.fieldTextPlaceholder]}>
        {selectedLabel ?? placeholder}
      </Text>
      <Text style={[styles.chevron, { color: tabColor }]}>{'▾'}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fieldText: { ...typography.body, flexShrink: 1 },
  fieldTextPlaceholder: { color: colors.textMuted },
  chevron: { ...typography.caption },
  popover: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 10,
    // backgroundColor set inline per-instance (resolvedPopoverBackground
    // above) -- either the standard colors.menuSurface or, when
    // tintedSurface is set, a lighter tint of that instance's own
    // tabColor.
    overflow: 'hidden',
    // Same shadow recipe as Dropdown's own menu/TabHub's own card -- reads
    // as floating chrome above the page, not part of its normal content.
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    // 2026-08-14, real, on-device-confirmed root cause of the long-open
    // "row tap takes 1-15 real seconds to register" freeze, specific to
    // Nutrient Ranking's own two fields (the only PopoverSelect pair in the
    // app pinned right above the floating TabHub button). That button's own
    // style already documents needing forced elevation 10/zIndex 10
    // specifically because plain JSX paint order isn't reliably respected
    // on Android once an animated/portal view is involved (see
    // components/TabHub.tsx's own `button` style comment) -- this popover
    // is exactly that kind of view (mounted through OverlayContext's own
    // portal at the app root), and at elevation 8 it was consistently
    // losing that same real Android stacking fight wherever it happens to
    // geometrically overlap the button's own touch target (itself larger
    // than its visible icon, via hitSlop). Dropdown.tsx's own menu uses the
    // identical elevation 8 and never has this problem -- confirming 8 was
    // never too low in general, only too low specifically against this one
    // higher-elevation neighbor. Raised well past 10, not just barely above
    // it, for real margin rather than a fix that could still lose the same
    // fight intermittently.
    elevation: 24,
    zIndex: 24,
  },
  row: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { ...typography.body, color: colors.textPrimary },
  rowTextSelected: { ...typography.bodyEmphasis, color: colors.textOnPrimary },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
