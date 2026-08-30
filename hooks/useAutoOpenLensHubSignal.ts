import { useLocalSearchParams } from 'expo-router';

// Read by every tab screen that has its own LensHub (every one of
// TAB_ROUTES except Home, which has nothing else inside it to switch
// between -- see constants/tabs.ts) -- 2026-08-08, explicitly requested:
// "whenever a different tab is selected from the TabHub menu, cause...
// the LensHub menu to be open for the selected tab." TabHub's own go()
// (components/TabHub.tsx) and Home's Digest shortcut
// (app/(tabs)/index.tsx) both attach a fresh, ever-changing `openLensHub`
// query param whenever they navigate to one of these tabs -- this hook
// just reads it back out, so LensHub.tsx's own `autoOpenSignal` prop can
// tell "a real, deliberate TabHub selection just happened" apart from
// every other way this screen might regain focus.
//
// That distinction matters: an earlier attempt at "always auto-open on
// arrival" (see LensHub.tsx's own history comment on `open`) was tried
// twice and reverted twice, because it fired on EVERY arrival, including
// a horizontal swipe between tabs (SwipeableTabScreen.tsx's own
// goToOffset, which navigates via a bare `router.navigate(path)` with no
// params) -- every swipe landed on an already-open popup that had to be
// dismissed before the next swipe could happen. Scoping this to one
// specific, real param that ONLY a genuine TabHub/shortcut tap ever sets
// sidesteps that exact problem rather than reintroducing it: swiping
// between tabs never carries this param at all, so it can never
// re-trigger from a swipe, only from an explicit "go to this tab" tap.
// 2026-08-30, direct instruction: "I think the Tab LensHub menus should no
// longer be selected and open automatically, but should be referred to in the
// top informational box for each main tab."
//
// The param and every call site are left exactly as they are, and this reads it
// back as before -- it just no longer hands it on. Two reasons for switching it
// off HERE rather than removing the plumbing: it is one line to reverse if the
// auto-open is ever wanted again, and the param is still what tells a deep link
// which tab was deliberately chosen, which nothing else records.
//
// What replaces it is GatedTabContent's own resting prompt, which points at the
// corner button. That prompt existed before, and was removed on 2026-08-08
// precisely BECAUSE the menu started opening itself ("we won't need to have the
// little box... telling them to Tap the (icon) button to select a function").
// Turning the auto-open off puts that reasoning back the other way round.
export function useAutoOpenLensHubSignal(): string | undefined {
  const { openLensHub } = useLocalSearchParams<{ openLensHub?: string }>();
  void openLensHub;
  return undefined;
}
