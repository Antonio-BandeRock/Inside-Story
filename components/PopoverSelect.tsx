import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  debugLabel,
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
  // 2026-08-14, a real, new, testable hypothesis for the still-open
  // "row tap takes 1-15 real, variable seconds to register" freeze --
  // confirmed via direct question that this ONLY happens on Nutrient
  // Ranking's own two fields, nowhere else in the app, which points away
  // from anything device/engine-wide and back toward something genuinely
  // unique to this one screen's own layout. The one real, concrete
  // difference: openAbove positions the popover directly OVER the results
  // area's own independently-scrolling ScrollView (this screen owns its
  // own layout specifically so the field can sit fixed near the footer
  // with results scrolling separately above it) -- every OTHER
  // PopoverSelect caller in the app opens beside a field with no
  // competing scrollable region underneath it at all. A real, known class
  // of RN/Android touch-arbitration issue: two independently-scrollable/
  // touchable regions occupying the same physical screen space can
  // genuinely contend over which one actually owns a given touch. Lets a
  // caller know exactly when this popover is genuinely open/closed, so it
  // can (for exactly this reason) temporarily stop the underlying,
  // overlapping scroll region from claiming touches while a popover
  // sits on top of it.
  onOpenChange?: (isOpen: boolean) => void;
  // TEMPORARY diagnostic logging, 2026-08-14, added specifically to chase
  // the still-unresolved ~15-second-freeze report on Nutrient Ranking's own
  // two fields -- every avenue this bug class was previously root-caused
  // through (an unmemoized options array, an unstable inline onSelect) has
  // now been checked and confirmed already fixed, and both context
  // providers this component reads (ActiveInputContext/OverlayContext) are
  // confirmed correctly split so neither can itself be a re-render source.
  // With static analysis genuinely exhausted, this borrows the same
  // `[TabHub drop-timing]`-style approach already proven in this exact
  // codebase for a comparably hard, on-device-only timing bug -- a plain
  // Date.now()-based running log, silent (zero cost) for every caller that
  // doesn't set this, only active on the two fields this report is about.
  // Meant to be removed once real evidence pinpoints the actual cause.
  debugLabel?: string;
}) {
  const fieldRef = useRef<View>(null);
  const listRef = useRef<ScrollView | null>(null);
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

  // TEMPORARY diagnostic logging -- see debugLabel's own comment above.
  const debugTapStartRef = useRef<number | null>(null);
  const debugRenderCountRef = useRef(0);
  if (debugLabel) {
    debugRenderCountRef.current += 1;
    const elapsed = debugTapStartRef.current != null ? Date.now() - debugTapStartRef.current : null;
    console.log(
      `[PopoverSelect:${debugLabel}] render #${debugRenderCountRef.current}${elapsed != null ? ` +${elapsed}ms since tap` : ''} isOpen=${isOpen} optionsLength=${options.length}`,
    );
  }

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
    if (debugLabel) {
      debugTapStartRef.current = Date.now();
      debugRenderCountRef.current = 0;
      console.log(`[PopoverSelect:${debugLabel}] +0ms: tap, calling measureInWindow`);
    }
    fieldRef.current?.measureInWindow((x, y, fieldWidth, fieldHeight) => {
      if (debugLabel) {
        const elapsed = debugTapStartRef.current != null ? Date.now() - debugTapStartRef.current : null;
        console.log(`[PopoverSelect:${debugLabel}] +${elapsed}ms: measureInWindow callback fired, calling setAnchor/setIsOpen`);
      }
      setAnchor({ x, y, width: fieldWidth, height: fieldHeight });
      setIsOpen(true);
    });
  }

  function handleSelect(value: string) {
    // TEMPORARY diagnostic logging -- see debugLabel's own comment above.
    // Specifically: does a tap on a ROW inside the already-open list reach
    // this handler quickly, or is the touch itself sitting queued/delayed
    // before JS ever gets to run this function at all? The prior round of
    // logging only covered the field's own tap (openMenu) and the render/
    // effect cycle -- neither one can see a delay that happens BEFORE
    // handleSelect ever starts, which is exactly what "the selections
    // aren't reacting to being tapped" describes.
    if (debugLabel) {
      const elapsed = debugTapStartRef.current != null ? Date.now() - debugTapStartRef.current : null;
      console.log(`[PopoverSelect:${debugLabel}] row tap -> handleSelect fired, value=${value}, +${elapsed}ms since field opened`);
    }
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
          {/* 2026-08-14, real, decisive on-device evidence (adb top -H
              during an active freeze) found the app's own native main UI
              thread -- not the JS thread, not Android's input dispatcher --
              sustaining 60-90% CPU for the whole ~15s gap, real, ongoing
              native work, not an idle/stuck thread. That redirects this
              investigation squarely at native view mount/unmount cost, and
              FlatList is real, load-bearing overhead this component never
              actually needed: every real option list here is small (39
              nutrients at most, MAX_VISIBLE_ROWS/_SEARCHABLE already cap
              what's visible to 6-8 at once) -- FlatList's own virtualization
              machinery (windowing, cell recycling, its own internal mount/
              unmount bookkeeping on every open/close) was pure cost for a
              dataset this size, never real benefit. Replaced with a plain
              ScrollView over a directly-mapped list -- the same real,
              proven pattern this app's own InlineSelectList/Dropdown menus
              already use successfully for comparable option counts. This
              also makes every real FlatList-specific bug this component has
              already fixed (see the two real, dated FlatList-quirk
              writeups kept just below as real history, not because they
              still describe the current code) structurally unreachable
              rather than individually patched around -- there's no
              initialScrollIndex/getItemLayout/removeClippedSubviews
              mechanism left to have a quirk in at all.

              2026-08-11, real history kept for context, even though the
              FlatList it describes is gone: React Native's FlatList, given
              initialScrollIndex, used to start its own first render batch
              counting FROM that index, not the top of the array -- items
              above it never rendered at all unless a real scroll gesture
              passed them, which a short, already-fits-its-box list can't
              trigger. Two real attempts (forcing the whole list to render
              via initialNumToRender, then scoping that to just
              selectedIndex + 1) each fixed part of it but reintroduced a
              real ~15s stall of their own on Nutrient Ranking's own longer
              39-item list. The actual fix at the time was dropping
              initialScrollIndex entirely and positioning the list AFTER a
              cheap, ordinary initial render via a directly-computed pixel
              offset instead -- the same real approach (offset math, not
              index-based scrolling) this ScrollView-based version below
              still uses, now scrollTo instead of FlatList's own
              scrollToOffset. removeClippedSubviews=false was a separate,
              real, well-precedented Android-specific hypothesis tried the
              same day (re-tested on-device, the exact same delay still
              reproduced, ruling it out) -- moot now too, alongside every
              other FlatList-specific prop this file used to carry. */}
          {visibleOptions.length === 0 ? (
            searchable ? <Text style={styles.emptyText}>No matches.</Text> : null
          ) : (
            <ScrollView ref={listRef} style={styles.list} showsVerticalScrollIndicator={false}>
              {visibleOptions.map((option, index) => {
                const isRowSelected = option.value === selected;
                return (
                  <TouchableOpacity
                    key={`${option.value}-${index}`}
                    style={[styles.row, isRowSelected ? { backgroundColor: tabColor } : null]}
                    onPress={() => handleSelect(option.value)}
                  >
                    <Text numberOfLines={1} style={[styles.rowText, isRowSelected ? styles.rowTextSelected : null]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
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
    if (debugLabel) {
      const elapsed = debugTapStartRef.current != null ? Date.now() - debugTapStartRef.current : null;
      console.log(
        `[PopoverSelect:${debugLabel}] +${elapsed}ms: showOverlay effect running, isOpen=${isOpen}, menuNode=${menuNode ? 'present' : 'null'}`,
      );
    }
    if (isOpen) {
      showOverlay(menuNode);
    } else {
      hideOverlay();
    }
  });

  // Positions the list at the current selection once per open, via a
  // directly-computed offset -- see the ScrollView-replaced-FlatList
  // comment above for why this stays offset-based math rather than an
  // index-based scroll call. Also runs with no dependency array (matching
  // this file's own convention above), guarded by hasScrolledToSelectionRef
  // so it only ever actually scrolls once per real open, not on every
  // render.
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
    // attached the ScrollView's ref on this exact same tick yet.
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ y: targetOffset, animated: false });
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
  // 2026-08-14, real, direct consequence of the FlatList -> ScrollView
  // replacement above -- a plain ScrollView doesn't automatically stretch
  // to fill its own parent the way a bare View does, so without this it
  // wouldn't reliably fill/scroll within the popover's own fixed-height,
  // overflow:hidden container.
  list: { flex: 1 },
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
