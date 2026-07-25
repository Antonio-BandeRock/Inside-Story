import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MENU_GAP = 6;
const MENU_MAX_HEIGHT = 320;
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

function computeMenuPosition(anchor: Anchor, menuWidth: number | null, extraBottomReserve: number) {
  const screen = Dimensions.get('window');
  const width = menuWidth ?? anchor.width;

  let left = anchor.x;
  if (left + width > screen.width - SCREEN_MARGIN) {
    left = screen.width - SCREEN_MARGIN - width;
  }
  left = Math.max(SCREEN_MARGIN, left);

  const spaceBelow = screen.height - (anchor.y + anchor.height) - SCREEN_MARGIN - OWN_EDGE_TAB_RESERVE - extraBottomReserve;
  const opensUpward = spaceBelow < Math.min(MENU_MAX_HEIGHT, 150) && anchor.y > spaceBelow;

  // maxHeight is resolved first so the upward-opening top can sit exactly
  // maxHeight above the field -- otherwise (when the available room is
  // less than MENU_MAX_HEIGHT) "top" and the applied height fall out of
  // sync, leaving a gap between the menu and the field that grows the
  // shorter the menu actually is, instead of always sitting MENU_GAP away.
  const maxHeight = Math.max(
    120,
    opensUpward
      ? Math.min(MENU_MAX_HEIGHT, anchor.y - MENU_GAP - SCREEN_MARGIN)
      : Math.min(MENU_MAX_HEIGHT, spaceBelow),
  );

  const top = opensUpward
    ? Math.max(SCREEN_MARGIN, anchor.y - MENU_GAP - maxHeight)
    : anchor.y + anchor.height + MENU_GAP;

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
};

export const Dropdown = forwardRef<DropdownHandle, DropdownProps>(function Dropdown(
  { value, options, onChange, placeholder = 'Select…', label, active, onOpen, onClose, searchable, onSearchChange, searchPlaceholder = 'Type to search…', compact },
  ref,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [fieldWidth, setFieldWidth] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  // Room to leave below an open menu for TabHub's floating button plus the
  // device's own safe-area inset (varies by platform/device).
  const insets = useSafeAreaInsets();
  const bottomReserve = insets.bottom + TAB_HUB_RESERVE;
  const [searchText, setSearchText] = useState('');
  const fieldRef = useRef<View>(null);
  const selectedOption = options.find((option) => option.value === value);

  function openMenu() {
    fieldRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
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

  return (
    <>
      <TouchableOpacity
        ref={fieldRef}
        style={[styles.field, compact ? styles.fieldCompact : null, active ? styles.fieldActive : null]}
        onPress={openMenu}
        onLayout={(event) => setFieldWidth(event.nativeEvent.layout.width)}
        activeOpacity={0.7}
      >
        <Text style={styles.fieldText} numberOfLines={1}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.chevron}>{'▾'}</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.backdrop} onPress={closeMenu} />
        <Pressable
          style={[
            styles.menu,
            fieldWidth ? { width: fieldWidth } : null,
            anchor ? computeMenuPosition(anchor, fieldWidth, bottomReserve) : null,
          ]}
          onPress={() => {}}
        >
          {label ? (
            <View style={styles.menuHeader}>
              <Text style={styles.menuHeaderText} numberOfLines={1}>
                {label}
              </Text>
            </View>
          ) : null}
          {searchable ? (
            <View style={styles.searchWrap}>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={handleSearchChange}
                placeholder={searchPlaceholder}
                autoFocus
              />
            </View>
          ) : null}
          <FlatList
            style={styles.optionsList}
            data={options}
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
      </Modal>
    </>
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
  },
  chevron: {
    color: '#374151',
    fontSize: 12,
    marginLeft: 8,
  },
  backdrop: {
    flex: 1,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  searchWrap: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d7dce5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fbfcfe',
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
  },
  menuItemTextSelected: {
    fontWeight: '700',
    color: '#1b5e20',
  },
});
