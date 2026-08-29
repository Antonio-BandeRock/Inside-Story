import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KEYBOARD_HEIGHT } from '../constants/appKeyboard';
import { textShadow } from '../constants/typography';
import { useActiveInputControls } from './ActiveInputContext';
import { useOverlay } from './OverlayContext';

// The open menu's top edge sits 3px below the field's own bottom edge --
// explicitly requested as an exact, small, deliberate gap (not touching,
// not a bigger default gap either).
const MENU_GAP = 3;
const SCREEN_MARGIN = 12;
// Reserves room for the app's own edge tab row (e.g. the "Today's Nutrients"
// tab docked at the screen's bottom edge) so an open menu's own shadow/edge
// never renders underneath it -- "window" dimensions cover the whole screen
// and don't know that band is there.
const OWN_EDGE_TAB_RESERVE = 70;
// The navigator's own bottom tab bar is hidden now (see app/(tabs)/_layout.tsx
// -- replaced by TabHub, a single floating button), so there's no tab bar
// height to measure anymore. Reserves room for TabHub itself instead (its
// 60px button + bottom margin), on top of the device's own safe-area inset.
const TAB_HUB_RESERVE = 92;

type Anchor = { x: number; y: number; width: number; height: number };

// Always opens below its own field, never above -- explicitly requested,
// as a rule for every dropdown in the app: a menu that flips upward can end
// up covering the very field that opened it, which reads as "where did my
// selection go."
//
// Always extends all the way down to wherever AppKeyboard's own search row
// would sit, whether or not this particular dropdown is the one that
// actually raises it -- also explicitly requested, as a universal rule
// rather than something only searchable dropdowns get: every dropdown's
// list should use all the real available space down to that one shared
// boundary, not stop short at an arbitrary height with unused space
// beneath it.
function computeMenuPosition(anchor: Anchor, menuWidth: number | null, extraBottomReserve: number) {
  const screen = Dimensions.get('window');
  const width = menuWidth ?? anchor.width;

  let left = anchor.x;
  if (left + width > screen.width - SCREEN_MARGIN) {
    left = screen.width - SCREEN_MARGIN - width;
  }
  left = Math.max(SCREEN_MARGIN, left);

  const spaceBelow = screen.height - (anchor.y + anchor.height) - SCREEN_MARGIN - OWN_EDGE_TAB_RESERVE - extraBottomReserve;
  const maxHeight = Math.max(120, spaceBelow);
  const top = anchor.y + anchor.height + MENU_GAP;

  return { left, top, maxHeight };
}

export type DropdownOption = {
  label: string;
  value: string;
};

export type DropdownHandle = {
  focus: () => void;
};

type DropdownProps = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  active?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  searchable?: boolean;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  // When true, the closed field only takes up as much width as its content
  // needs (with a sensible minimum), instead of stretching to fill its
  // parent row. Meant for fields sitting side-by-side (e.g. Amount + Unit).
  compact?: boolean;
  // Opens this dropdown's own menu the moment its field has genuinely
  // finished its first layout pass -- not on mount itself, which can fire
  // before the field has any real on-screen position yet (measureInWindow
  // at that point can return a stale/zeroed position, which is what made
  // Insights' Food Lookup category step open with an invisible/misplaced
  // menu the first time this was tried with a fixed-delay approach instead).
  // Gating on `fieldWidth` (only ever set by this field's own onLayout) is
  // a genuine "layout actually happened" signal rather than a guessed delay.
  // Fires at most once per mount -- a caller that also needs to wait for an
  // external condition (e.g. a screen scrolling itself into position first)
  // should hold off passing `autoFocus={true}` until that's settled, rather
  // than this racing to open too early.
  autoFocus?: boolean;
};

export const Dropdown = forwardRef<DropdownHandle, DropdownProps>(function Dropdown(
  { value, options, onChange, placeholder = 'Select…', label, active, onOpen, onClose, searchable, onSearchChange, searchPlaceholder = 'Type to search…', compact, autoFocus },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [fieldWidth, setFieldWidth] = useState<number | null>(null);
  // A ref, not state -- see openMenu's own comment for why this, not
  // measureInWindow's own height, is what actually gets used to position
  // the menu. Read imperatively (inside openMenu, at the moment it's
  // actually called) rather than via a state closure specifically so a
  // delayed call (see the autoFocus effect below) always sees whatever the
  // LATEST onLayout reported, including a second, corrected pass that
  // fires after the first -- a plain state variable captured in an effect's
  // closure would still read the value from whenever that closure was
  // created, missing any correction that arrived afterward.
  const fieldHeightRef = useRef<number | null>(null);
  const hasAutoFocusedRef = useRef(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  // Room to leave below an open menu for TabHub's floating button plus the
  // device's own safe-area inset (varies by platform/device), plus
  // AppKeyboard's own height -- always, not just for searchable dropdowns
  // that actually raise it. Explicitly requested as one universal bottom
  // boundary every dropdown's list respects, whether or not opening THIS
  // one happens to bring up the keyboard.
  const insets = useSafeAreaInsets();
  const bottomReserve = insets.bottom + TAB_HUB_RESERVE + KEYBOARD_HEIGHT;
  const [searchText, setSearchText] = useState('');
  const fieldRef = useRef<View>(null);
  const selectedOption = options.find((option) => option.value === value);
  const { showOverlay, hideOverlay } = useOverlay();
  // A real, stable per-instance identity -- see OverlayContext.tsx's own
  // OverlayOwner comment for why every real caller of useOverlay() now
  // needs one.
  const overlayOwnerRef = useRef({});
  const { setSearchRequest, forceClear } = useActiveInputControls();
  // Default, always-on filtering -- a "searchable" dropdown that never
  // actually narrowed its own list was a real gap (nothing calling
  // onSearchChange means nothing filters unless this exists). Simple
  // case-insensitive substring match on the label; onSearchChange (below)
  // remains available for a caller that wants to do its own filtering
  // instead/also (e.g. querying a database rather than filtering an
  // in-memory array).
  const visibleOptions =
    searchable && searchText.trim()
      ? options.filter((option) => option.label.toLowerCase().includes(searchText.trim().toLowerCase()))
      : options;

  function openMenu() {
    fieldRef.current?.measureInWindow((x, y, width, height) => {
      // Prefers onLayout's own fieldHeightRef over this callback's own
      // `height` -- measureInWindow's height came back small/stale exactly
      // when this fires immediately off a fresh layout (the auto-open case
      // in particular), while fieldHeightRef, captured via the field's own
      // onLayout, is never subject to that. x/y still have to come from
      // measureInWindow -- onLayout's own numbers are relative to the
      // field's parent, not the screen, and this menu is positioned in
      // window-absolute coordinates (see OverlayContext.tsx).
      const resolvedHeight = fieldHeightRef.current ?? height;
      // TEMPORARY diagnostic logging -- remove once the menu-position bug
      // is actually confirmed fixed. Real screenshots kept showing the list
      // covering the field no matter what was changed here, even after a
      // fully fresh (cache-cleared) reload -- logging the actual numbers
      // being computed, rather than guessing again from a screenshot.
      console.log('[Dropdown.openMenu]', {
        placeholder,
        measureInWindow: { x, y, width, height },
        fieldHeightRef: fieldHeightRef.current,
        resolvedHeight,
      });
      setAnchor({ x, y, width, height: resolvedHeight });
      setIsOpen(true);
      onOpen?.();
    });
  }

  function closeMenu() {
    setIsOpen(false);
    onClose?.();
    if (searchable) {
      setSearchText('');
      onSearchChange?.('');
      // Explicit, rather than relying on the search AppTextInput's own
      // unmount (see searchRequest effect below) -- unmount doesn't reliably
      // fire a blur, and this guarantees the keyboard drops the instant the
      // menu closes regardless of that timing.
      forceClear();
    }
  }

  function handleSearchChange(text: string) {
    setSearchText(text);
    onSearchChange?.(text);
  }

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    closeMenu();
  }

  useImperativeHandle(ref, () => ({
    focus: openMenu,
  }));

  // See the `autoFocus` prop's own comment above -- gated on `fieldWidth`
  // (only ever set by this field's own onLayout below) rather than firing on
  // mount, so openMenu's measureInWindow always has a real, laid-out
  // position to read instead of racing it.
  //
  // Still not called on the very next line, though: `fieldWidth` becoming
  // non-null only proves a first layout pass happened, not that it's the
  // FINAL one -- Yoga frequently needs a second pass to settle a View's
  // height once its text content is actually measured, and width can (and
  // does) resolve a pass earlier than height. Waiting two animation frames
  // gives that second pass a chance to fire and correct fieldHeightRef
  // before openMenu reads it -- without this, openMenu could still read the
  // first pass's too-small height, which is exactly what made the list
  // open almost on top of its own field even after switching to
  // fieldHeightRef (screenshotted 2026-07-27).
  useEffect(() => {
    if (!autoFocus || fieldWidth === null || hasAutoFocusedRef.current) return;
    hasAutoFocusedRef.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        openMenu();
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, fieldWidth]);

  // Computed once and reused for both the backdrop and the menu itself
  // below -- the backdrop used to be a plain full-screen Pressable, which
  // covers the field's own rectangle (and anything else above the menu,
  // like the header) with its semi-transparent tint, same as everything
  // else on screen. That's what was actually making the field hard to read
  // while its own menu was open -- not a mispositioned list (which was
  // already opening correctly below the field), but a dimming layer sitting
  // on top of the field regardless. Starting the backdrop at the SAME `top`
  // the menu itself starts at means nothing above the menu -- the field,
  // the header -- ever gets tinted at all; only the region at and below the
  // menu (where "tap outside to close" actually needs to catch touches)
  // does.
  const menuPosition = anchor ? computeMenuPosition(anchor, fieldWidth, bottomReserve) : null;
  if (isOpen) {
    // TEMPORARY diagnostic logging -- see openMenu's own comment.
    console.log('[Dropdown.render]', { placeholder, isOpen, anchor, fieldWidth, menuPosition });
  }

  // Was a native <Modal> -- always renders on its own separate surface above
  // the entire app, which is exactly why it could never sit correctly
  // relative to AppKeyboard (also in-tree, mounted at the app root). Pushed
  // through OverlayContext's portal stand-in instead, so this menu now lives
  // in the same tree AppKeyboard does and stacks beneath it as intended (see
  // OverlayContext.tsx's own comment). Rebuilt every render while open (no
  // dependency array on the effect below) so the overlay always reflects
  // this render's live state (searchText, options, selection) -- cheap here,
  // since only one dropdown is ever open at a time.
  const menuNode = isOpen ? (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Pressable
        style={[styles.backdrop, { top: menuPosition?.top ?? 0 }]}
        onPress={closeMenu}
      />
      <Pressable style={[styles.menu, fieldWidth ? { width: fieldWidth } : null, menuPosition]} onPress={() => {}}>
        {label ? (
          <View style={styles.menuHeader}>
            <Text style={styles.menuHeaderText} numberOfLines={1}>
              {label}
            </Text>
          </View>
        ) : null}
        <FlatList
          style={styles.optionsList}
          data={visibleOptions}
          keyExtractor={(option, index) => `${option.value}-${index}`}
          renderItem={({ item }) => {
            const isSelected = item.value === value;
            return (
              <TouchableOpacity
                style={[styles.menuItem, isSelected ? styles.menuItemSelected : null]}
                onPress={() => handleSelect(item.value)}
              >
                <Text style={[styles.menuItemText, isSelected ? styles.menuItemTextSelected : null]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </Pressable>
    </View>
  ) : null;

  useEffect(() => {
    if (isOpen) {
      showOverlay(overlayOwnerRef.current, menuNode);
    } else {
      hideOverlay(overlayOwnerRef.current);
    }
  });

  // Defensive: if this Dropdown unmounts while its own menu is open (e.g.
  // the screen it's on navigates away), make sure the overlay doesn't keep
  // showing a menu whose owner is gone.
  useEffect(() => () => hideOverlay(overlayOwnerRef.current), [hideOverlay]);

  // Feeds this dropdown's search box into AppKeyboard's own search row (see
  // ActiveInputContext.tsx's own searchRequest comment) instead of rendering
  // a text field here -- rebuilt every render while open, same "cheap, only
  // one dropdown open at a time" reasoning as the menuNode effect above, so
  // the keyboard's search box always reflects this render's live searchText.
  useEffect(() => {
    if (isOpen && searchable) {
      setSearchRequest({ value: searchText, onChangeText: handleSearchChange, placeholder: searchPlaceholder });
    } else {
      setSearchRequest(null);
    }
  });

  useEffect(() => () => setSearchRequest(null), [setSearchRequest]);

  return (
    <TouchableOpacity
      ref={fieldRef}
      style={[styles.field, compact ? styles.fieldCompact : null, active ? styles.fieldActive : null]}
      onPress={openMenu}
      onLayout={(event) => {
        setFieldWidth(event.nativeEvent.layout.width);
        fieldHeightRef.current = event.nativeEvent.layout.height;
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.fieldText} numberOfLines={1}>
        {selectedOption ? selectedOption.label : placeholder}
      </Text>
      <Text style={styles.chevron}>{'▾'}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 10,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldActive: {
    backgroundColor: '#eaf2ff',
    borderColor: '#2563eb',
    borderWidth: 3,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldCompact: {
    alignSelf: 'flex-start',
    minWidth: 84,
  },
  fieldText: {
    color: '#374151',
    fontSize: 14,
    flexShrink: 1,
    ...textShadow,
  },
  chevron: {
    color: '#374151',
    fontSize: 12,
    marginLeft: 8,
    ...textShadow,
  },
  // position/left/right/bottom fixed here; `top` is set inline per render
  // (see menuPosition above) so this only ever covers from the menu's own
  // top edge down -- never the field, or anything else above the menu.
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f7f8fc',
  },
  menuHeaderText: {
    // textTransform: 'uppercase' removed, 2026-07-28 -- no all-caps
    // headers anywhere in the app, per explicit request.
    fontSize: 13,
    fontWeight: '400',
    color: '#111827',
    letterSpacing: 0.4,
    ...textShadow,
  },
  // Without this, the FlatList reports its full content height to the
  // parent's Yoga layout instead of shrinking to fit -- the parent's
  // maxHeight then just gets ignored rather than turning into a scrollable
  // clip region, so options past the cutoff are unreachable, not scrolled to.
  optionsList: {
    flexGrow: 0,
    flexShrink: 1,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuItemSelected: {
    backgroundColor: '#e8f5e9',
  },
  menuItemText: {
    fontSize: 14,
    color: '#374151',
    ...textShadow,
  },
  menuItemTextSelected: {
    fontWeight: '400',
    color: '#1b5e20',
  },
});
