// How a long press, or the button, reaches the Tell Claude sheet.
//
// Part of the 2026-09-22 note channel; lib/devNotes.ts holds the shape of a
// note and the reasoning behind the whole thing, and is the pure module.
// This one carries three pieces of running state that a note needs and that
// no single screen can answer on its own:
//
//  1. WHERE YOU ARE. components/PageIdentityLabel.tsx renders on every
//     screen in this app and already receives the tab's title and the open
//     lens's label, which is exactly what a note has to say about itself.
//     It reports them here rather than each of the nine tabs being taught
//     to, so a screen added later is covered without anybody remembering.
//  2. WHETHER THE FEATURE IS ON AT ALL. Read at render rather than at press
//     time, because components/TabBand.tsx has to decide whether to hand its
//     band a long press: a Touchable carrying an onLongPress swallows the
//     tap that would otherwise follow, so wiring one unconditionally would
//     stop a band folding for somebody who never asked for any of this.
//  3. THE SHEET ITSELF. One listener, registered by the host at the app
//     root, so a band deep inside a clipped ScrollView can raise a sheet
//     that paints over the whole window.
//
// Deliberately a module rather than a React context: a band does not sit
// inside any provider this could reasonably be hung on, and threading one
// through nine tabs to carry a developer switch would be furniture in the
// way of the app.
import { useEffect, useState } from 'react';

/** What a note is about, past the screen it was made on. */
export type TellClaudeTarget = {
  bandId?: string | null;
  bandTitle?: string | null;
};

export type TellClaudeScreen = { tab: string | null; lens: string | null };

// WHERE YOU ARE.

let screen: TellClaudeScreen = { tab: null, lens: null };

/** Called from the corner box as each screen renders. */
const screenListeners = new Set<(value: TellClaudeScreen) => void>();

export function reportTellClaudeScreen(tab: string | null, lens: string | null): void {
  if (screen.tab === tab && screen.lens === lens) return;
  screen = { tab, lens };
  for (const listener of screenListeners) listener(screen);
}

/** Walk me through it (lib/storyWalk.ts) follows the open lens from here. */
export function subscribeTellClaudeScreen(listener: (value: TellClaudeScreen) => void): () => void {
  screenListeners.add(listener);
  return () => {
    screenListeners.delete(listener);
  };
}

export function currentTellClaudeScreen(): TellClaudeScreen {
  return screen;
}

// WHETHER IT IS ON.

let enabled = false;
const enabledListeners = new Set<(on: boolean) => void>();

/** Set from the one place that reads the visual preferences for this. */
export function setTellClaudeEnabled(on: boolean): void {
  if (enabled === on) return;
  enabled = on;
  for (const listener of enabledListeners) listener(on);
}

export function isTellClaudeOn(): boolean {
  return enabled;
}

/** Live, for a band deciding whether to take a long press. */
export function useTellClaudeOn(): boolean {
  const [on, setOn] = useState(enabled);
  useEffect(() => {
    setOn(enabled);
    enabledListeners.add(setOn);
    return () => {
      enabledListeners.delete(setOn);
    };
  }, []);
  return on;
}

// THE SHEET.

type Opener = (target: TellClaudeTarget) => void;

let opener: Opener | null = null;

/** Registered by components/TellClaudeHost.tsx at the app root. */
export function registerTellClaudeOpener(open: Opener): () => void {
  opener = open;
  return () => {
    if (opener === open) opener = null;
  };
}

/** Opens the sheet for this band, or for the screen when no band is named.
 *  Does nothing at all while the switch is off, so a caller never has to
 *  check first. */
export function openTellClaude(target: TellClaudeTarget = {}): void {
  if (!enabled) return;
  opener?.(target);
}
