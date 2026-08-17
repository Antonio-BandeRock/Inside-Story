import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

// A stable, unique per-instance identity -- every real caller of useOverlay()
// creates one via `useRef({})` once, on mount, and passes it to every
// showOverlay/hideOverlay call it makes. See showOverlay/hideOverlay's own
// comments below for why this exists; it's the thing that makes a hide call
// from one owner unable to clobber a different owner's still-active content.
export type OverlayOwner = object;

type OverlayControls = {
  showOverlay: (owner: OverlayOwner, content: ReactNode) => void;
  hideOverlay: (owner: OverlayOwner) => void;
};

type OverlaySlot = { owner: OverlayOwner; content: ReactNode } | null;

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
  const [slot, setSlot] = useState<OverlaySlot>(null);
  // Empty deps: both functions below are React's own stable setState
  // wrappers, so this object can never change across the provider's
  // lifetime.
  const controls = useMemo<OverlayControls>(
    () => ({
      showOverlay: (owner, content) => setSlot({ owner, content }),
      // 2026-08-17: a real, deliberate "only clear what you actually own"
      // guard, added the moment a second real overlay-owning component
      // (CollapsibleOverlayCard) started getting mounted as a PERMANENT
      // sibling of an existing one (AppActionSheet) on the same screen --
      // both call showOverlay/hideOverlay on every render regardless of
      // their own visible/expanded state, "cheap: only one is ever open at
      // a time" per this file's own original design. That assumption held
      // for every real usage before this (Dropdown, PopoverSelect, a
      // standalone AppActionSheet -- always exactly one real owner mounted
      // at once), but with two owners now permanently co-mounted,
      // whichever one's own layout effect happens to run LAST in a given
      // commit -- purely an artifact of JSX sibling order, not anything
      // meaningful -- would silently wipe out the OTHER's real, active
      // content on every single render. A functional update reading the
      // LIVE current slot (never a captured closure value) means a hide
      // call only ever actually clears the slot if it's still the same
      // owner that most recently set it; a later showOverlay() from a
      // DIFFERENT owner already replaced both the owner and the content,
      // so a now-stale hide call from the first owner is correctly a
      // no-op instead of clobbering the second owner's real content.
      hideOverlay: (owner) => setSlot((current) => (current?.owner === owner ? null : current)),
    }),
    [],
  );
  return (
    <OverlayControlsContext.Provider value={controls}>
      <OverlayContentContext.Provider value={slot?.content ?? null}>{children}</OverlayContentContext.Provider>
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
  const content = useContext(OverlayContentContext);
  return <>{content}</>;
}
