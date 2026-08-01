import { useFocusEffect } from '@react-navigation/native';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { HelpSection } from './HelpButton';

export type CurrentPageHelp = { title: string; sections: HelpSection[] } | null;

type CurrentPageHelpContextValue = {
  currentHelp: CurrentPageHelp;
  setCurrentHelp: (help: CurrentPageHelp) => void;
  // Which tab is actually focused right now, as one of constants/tabs.ts's
  // own TAB_ROUTES paths (e.g. '/', '/food') -- set by ScreenHeader's
  // tabPath prop, independently of currentHelp above (a screen with no
  // helpSections would otherwise clear this too if it were folded into the
  // same field). Originally built to sidestep a cold-launch ambiguity in
  // Expo Router's usePathname() (see TabHub.tsx's own comment history) --
  // since fixed at the routing level (2026-07-26: Home is now the literal
  // "index" file, not Food), but kept as the tracking mechanism regardless,
  // since it's still a clean, direct way for TabHub to know what's focused
  // without depending on router internals.
  activeTabPath: string | null;
  setActiveTabPath: (path: string | null) => void;
};

const CurrentPageHelpContext = createContext<CurrentPageHelpContextValue | null>(null);

// Lets TabHub's "info about whatever page is currently open" tile (see
// components/TabHub.tsx) know what that page's help content actually is,
// without TabHub -- which lives outside any single tab screen, as a
// sibling of the whole Tabs navigator -- needing to import every screen's
// own help copy directly. Each ScreenHeader registers itself as "the
// current page" whenever its own screen gains focus (see ScreenHeader.tsx),
// so this always reflects whichever tab the person is actually looking at.
export function CurrentPageHelpProvider({ children }: { children: ReactNode }) {
  const [currentHelp, setCurrentHelp] = useState<CurrentPageHelp>(null);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
  const value = useMemo(
    () => ({ currentHelp, setCurrentHelp, activeTabPath, setActiveTabPath }),
    [currentHelp, activeTabPath],
  );
  return <CurrentPageHelpContext.Provider value={value}>{children}</CurrentPageHelpContext.Provider>;
}

export function useCurrentPageHelp(): CurrentPageHelpContextValue {
  const context = useContext(CurrentPageHelpContext);
  if (!context) {
    throw new Error('useCurrentPageHelp must be used within a CurrentPageHelpProvider');
  }
  return context;
}

// Registers a screen's own help content/tab identity the moment it gains
// focus -- every one of the 7 tab screens calls this directly now, instead
// of ScreenHeader doing it on their behalf. Moved out of ScreenHeader.tsx
// 2026-07-27, the same day ScreenHeader itself became a single instance
// mounted once in app/(tabs)/_layout.tsx rather than one per screen (see
// that file's own comment) -- a single shared header has no "this screen
// just gained focus" moment of its own to hook this registration to, so
// each screen now does it itself, the same information as before, just
// called directly instead of implied by rendering a header.
export function useRegisterScreenHelp(title: string, helpSections: HelpSection[] | undefined, tabPath: string | undefined) {
  const { setCurrentHelp, setActiveTabPath } = useCurrentPageHelp();

  useFocusEffect(
    useCallback(() => {
      setCurrentHelp(helpSections ? { title, sections: helpSections } : null);
    }, [title, helpSections, setCurrentHelp]),
  );

  // Kept as its own effect, not folded into the one above, so a screen
  // with no helpSections still correctly reports its tab.
  useFocusEffect(
    useCallback(() => {
      if (tabPath) setActiveTabPath(tabPath);
    }, [tabPath, setActiveTabPath]),
  );
}
