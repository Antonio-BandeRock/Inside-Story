import { useEffect } from 'react';
import { useActiveInputControls } from './ActiveInputContext';
import { InlineSelectList, type InlineSelectOption } from './InlineSelectList';

// InlineSelectList (see that file's own comment for why this exists instead
// of Dropdown.tsx's floating-menu/portal approach) plus a live search box.
// The box itself renders inside AppKeyboard's own search row (see
// ActiveInputContext.tsx's own searchRequest comment) -- the same
// already-working mechanism Dropdown.tsx's searchable variant used. That
// part was never the source of the menu-positioning bug: AppKeyboard
// anchors itself to a fixed, reliable hook (useFooterBandHeight), not a
// measured field position, so it's reused here as-is. Only the LIST is
// new -- plain inline content, never a floating portal-rendered menu.
export function InlineSearchSelectList({
  options,
  value,
  onChange,
  height,
  tabColor,
  header,
  searchText,
  onSearchChange,
  searchPlaceholder,
  squareTop,
}: {
  options: InlineSelectOption[];
  value: string;
  onChange: (value: string) => void;
  height: number;
  tabColor: string;
  header: string;
  searchText: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  // Passed straight through to InlineSelectList -- see its own comment.
  squareTop?: boolean;
}) {
  const { setSearchRequest, forceClear } = useActiveInputControls();

  // No dependency array, mirroring Dropdown.tsx's own identical pattern --
  // keeps AppKeyboard's search row showing this render's live searchText
  // without needing an exhaustive dependency list. Cleanup lives in its own
  // separate, mount/unmount-only effect below rather than here, so it
  // doesn't fire (and briefly clear, then immediately reset) on every
  // keystroke.
  useEffect(() => {
    setSearchRequest({ value: searchText, onChangeText: onSearchChange, placeholder: searchPlaceholder });
  });

  // forceClear() alongside setSearchRequest(null) -- this component
  // unmounts the instant a food is picked (the caller swaps it for a
  // summary row), which also unmounts AppKeyboard's own nested search
  // AppTextInput. Unmounting doesn't reliably fire that field's own blur
  // event, so without this, AppKeyboard's activeField could be left
  // stale -- the keyboard would just never get told to drop, staying
  // risen (and covering part of the results table below) even though
  // nothing left on screen is actually editable. Same defensive pattern
  // Dropdown.tsx's own closeMenu already uses for the identical reason.
  useEffect(
    () => () => {
      setSearchRequest(null);
      forceClear();
    },
    [setSearchRequest, forceClear],
  );

  return (
    <InlineSelectList
      options={options}
      value={value}
      onChange={onChange}
      height={height}
      tabColor={tabColor}
      header={header}
      squareTop={squareTop}
    />
  );
}
