import { memo, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, inputBackground } from '../constants/colors';
import { typography } from '../constants/typography';
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
// Deliberately its own component rather than a reskin of Dropdown.tsx:
// Dropdown carries real complexity (search, AppKeyboard search-row
// integration, a below-only anchor, label header) this doesn't need --
// every list here is a short, fixed, curated set of plain words, never
// searched. Reuses the SAME proven foundation Dropdown already validated,
// though: OverlayContext's portal (not RN's own <Modal>, which is what
// caused Dropdown real position bugs before it moved off Modal -- see that
// file's own history), and measureInWindow for real screen-absolute
// positioning.

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
// most phones have room for.
const MAX_VISIBLE_ROWS = 6;
// A fixed width rather than measured from content, deliberately -- every
// option here is a short, plain word ("Diced," "Sautéed," "Deep-Fried");
// real text measurement would be real added machinery for a problem a
// generous constant already solves. Comfortably fits the longest option
// in any of this app's current lists with room to spare.
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
// menu does.
function computePopoverPosition(anchor: Anchor, listHeight: number) {
  const screen = Dimensions.get('window');
  const fieldCenterX = anchor.x + anchor.width / 2;
  const opensRight = fieldCenterX < screen.width / 2;

  let left = opensRight ? anchor.x + anchor.width + GAP_FROM_FIELD : anchor.x - GAP_FROM_FIELD - POPOVER_WIDTH;
  left = Math.max(SCREEN_MARGIN, Math.min(left, screen.width - SCREEN_MARGIN - POPOVER_WIDTH));

  const fieldCenterY = anchor.y + anchor.height / 2;
  let top = fieldCenterY - listHeight / 2;
  top = Math.max(SCREEN_MARGIN, Math.min(top, screen.height - SCREEN_MARGIN - listHeight));

  return { left, top };
}

// memo'd for the same reason WheelPicker was: SideBuilder re-renders on
// every keystroke in Dish Name/Prep Notes (AppTextInput re-registers with
// the keyboard context on every change), and without this each of those
// keystrokes would re-render every field on the form, not just the one
// actually being typed into. For this to hold, every prop must stay
// referentially stable between keystrokes -- `options` are module
// constants except `unitOptions`, which SideBuilder already memoizes (see
// its own comment); `onSelect` is always a plain useState setter;
// `tabColor`/`minWidth` are primitives.
export const PopoverSelect = memo(function PopoverSelect({
  options,
  selected,
  onSelect,
  tabColor,
  minWidth = 0,
}: {
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  tabColor: string;
  // Floor width, supplied by the caller from its own measured label (see
  // SideBuilder's renderLabeledPicker) so a field is never narrower than
  // the word above it -- same contract WheelPicker's own minWidth had.
  minWidth?: number;
}) {
  const fieldRef = useRef<View>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { showOverlay, hideOverlay } = useOverlay();

  const listHeight = Math.min(MAX_VISIBLE_ROWS, options.length) * ROW_HEIGHT + LIST_PADDING_VERTICAL * 2;
  const selectedIndex = selected ? options.indexOf(selected) : -1;

  function closeMenu() {
    hideOverlay();
    setIsOpen(false);
  }

  function openMenu() {
    fieldRef.current?.measureInWindow((x, y, width, height) => {
      const position = computePopoverPosition({ x, y, width, height }, listHeight);
      // A one-time snapshot, not re-rendered live while open the way
      // Dropdown's own menu is -- Dropdown needs that because its search
      // text can change while its menu is showing; nothing here can
      // change the list's own content while it's open (selecting a row
      // closes the popover in the same handler, see below), so there's
      // nothing that would ever need a fresher render than this one.
      showOverlay(
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
          <View style={[styles.popover, { left: position.left, top: position.top, height: listHeight, borderColor: tabColor }]}>
            <FlatList
              data={options}
              keyExtractor={(option, index) => `${option}-${index}`}
              getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
              initialScrollIndex={selectedIndex >= 0 ? selectedIndex : undefined}
              renderItem={({ item }) => {
                const isRowSelected = item === selected;
                return (
                  <TouchableOpacity
                    style={[styles.row, isRowSelected ? { backgroundColor: tabColor } : null]}
                    onPress={() => {
                      onSelect(item);
                      closeMenu();
                    }}
                  >
                    <Text numberOfLines={1} style={[styles.rowText, isRowSelected ? styles.rowTextSelected : null]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>,
      );
      setIsOpen(true);
    });
  }

  // Defensive, same reasoning as Dropdown's own identical effect: if this
  // field unmounts while its own popover is open (its whole screen
  // navigates away, or Side Builder resets after Save & Finish), don't
  // leave a popover on screen with no owner left to close it.
  useEffect(() => () => hideOverlay(), [hideOverlay]);

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
      <Text numberOfLines={1} style={[styles.fieldText, selected ? { color: colors.textPrimary } : styles.fieldTextPlaceholder]}>
        {selected ?? '—'}
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
    width: POPOVER_WIDTH,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: colors.menuSurface,
    overflow: 'hidden',
    // Same shadow recipe as Dropdown's own menu/TabHub's own card -- reads
    // as floating chrome above the page, not part of its normal content.
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
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
});
