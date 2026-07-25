import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { HelpSection } from './HelpButton';

export type CurrentPageHelp = { title: string; sections: HelpSection[] } | null;

type CurrentPageHelpContextValue = {
  currentHelp: CurrentPageHelp;
  setCurrentHelp: (help: CurrentPageHelp) => void;
  // Which tab is actually focused right now, as one of constants/tabs.ts's
  // own TAB_ROUTES paths (e.g. '/home', '/') -- set by ScreenHeader's
  // tabPath prop, independently of currentHelp above (a screen with no
  // helpSections would otherwise clear this too if it were folded into the
  // same field). Exists because Expo Router's own usePathname() doesn't
  // reliably report '/home' for Home when it's shown as the tabs group's
  // implicit default tab on cold launch -- it can still report '/' (the
  // group's own index route, i.e. Meals), which made TabHub highlight the
  // wrong tab. Tracking focus explicitly, the same proven way currentHelp
  // already does, sidesteps that ambiguity entirely rather than depending
  // on it.
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
