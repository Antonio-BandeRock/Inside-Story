import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type OverlayControls = {
  showOverlay: (content: ReactNode) => void;
  hideOverlay: () => void;
};

const OverlayControlsContext = createContext<OverlayControls | null>(null);
const OverlayContentContext = createContext<ReactNode>(null);

// A minimal stand-in for a DOM-style portal -- React Native has no built-in
// equivalent. Exists because Dropdown.tsx's open menu used to rely on RN's
// own <Modal>, which always renders on its own separate native surface above
// the entire app; a plain in-tree absolutely-positioned View can't do that on
// its own, since almost every screen's content sits inside
// ScreenBackground.tsx's own `overflow: 'hidden'` body -- an in-tree overlay
// mounted deep inside one of those would get clipped at that boundary
// instead of covering the whole screen.
//
// The fix: anything that needs to "escape" (Dropdown's menu) calls
// showOverlay() with its content; the one <OverlayRoot/> that actually
// paints it is mounted at the true app root (app/_layout.tsx), as a sibling
// of <Stack>, so it's never inside any clipped ancestor. Mounted BEFORE
// <AppKeyboard/> there specifically so the keyboard -- rendered later, i.e.
// on top -- always wins any screen-space overlap with an open dropdown's
// backdrop (see AppKeyboard.tsx/Dropdown.tsx's own comments).
//
// Controls (showOverlay/hideOverlay) and content are deliberately two
// separate contexts, not one bundled value -- see
// ActiveInputContext.tsx's own comment for the identical reasoning: a
// producer like Dropdown only ever needs the stable setters, never
// `content` itself, and consuming a value that changes every time it calls
// showOverlay() was a real infinite-render loop (Dropdown re-rendering
// because content changed -> its own effect firing again -> calling
// showOverlay again, forever). Splitting them means Dropdown, which only
// calls useOverlay() for the controls, never re-renders just because
// content changed -- only <OverlayRoot/> (the one actual consumer of
// content) does.
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode | null>(null);
  // Empty deps: setContent is React's own stable setter, so this object can
  // never change across the provider's lifetime.
  const controls = useMemo<OverlayControls>(
    () => ({ showOverlay: setContent, hideOverlay: () => setContent(null) }),
    [],
  );
  return (
    <OverlayControlsContext.Provider value={controls}>
      <OverlayContentContext.Provider value={content}>{children}</OverlayContentContext.Provider>
    </OverlayControlsContext.Provider>
  );
}

export function useOverlay(): OverlayControls {
  const context = useContext(OverlayControlsContext);
  if (!context) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return context;
}

export function OverlayRoot() {
  // TEMPORARY diagnostic logging, 2026-08-14 -- see PopoverSelect.tsx's own
  // debugLabel comment for the real, still-unresolved freeze this is
  // chasing. Cheap and harmless when nothing's open (content is null and
  // this only re-renders on a real content change, not continuously).
  const content = useContext(OverlayContentContext);
  if (content) {
    console.log(`[OverlayRoot] +render at ${Date.now()}: content present, committing`);
  }
  return <>{content}</>;
}
