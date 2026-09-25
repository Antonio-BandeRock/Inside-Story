// Tell Claude, editing words in place (1.0.51.12): the running state every
// piece of text on screen reads.
//
// Direct request, 2026-09-24: "if it is just a text area, even if it is a
// title or a header, just text, not with code behind it, I would like to be
// able to directly edit it," asked because the note sheet covered the very
// words a wording note was about. Settled the same day: an edit shows on the
// device it was made on straight away, before the source says it.
//
// Three things live here, all plain module state with no React, so
// components/EditableText.tsx (every Text in the app, through
// metro.config.js) can read them without a provider being threaded through
// nine tabs:
//
//  1. WHETHER TEXT IS ANYTHING BUT PLAIN. `active` is false unless the Tell
//     Claude switch is on, and while it is false a Text renders exactly as
//     React Native's own does, which is how this sits for anybody but the
//     person building the app.
//  2. EDIT MODE. While it is on, tapping any text reports it here instead of
//     doing whatever a tap on it would otherwise do, and
//     components/TellClaudeHost.tsx opens the editor for it.
//  3. THE EDITS STILL WAITING. Keyed by the words as the app draws them,
//     read from open wording notes by lib/devNotesDb.ts (editsFromNotes in
//     lib/devNotes.ts decides which count). `showEdits` is the Profile
//     switch that hides them to show what the app itself says.

export type WordingEditState = {
  active: boolean;
  editing: boolean;
  showEdits: boolean;
  edits: ReadonlyMap<string, string>;
};

/** A tap on some words while edit mode is on. */
export type WordingTap = {
  /** The words as the source draws them, which is what a note records. */
  originalText: string;
  /** What is on screen now, which differs when an edit is already showing. */
  shownText: string;
  /** Where the words sit in the window, for keeping them in sight. */
  top: number;
  bottom: number;
};

let state: WordingEditState = { active: false, editing: false, showEdits: true, edits: new Map() };
const listeners = new Set<(value: WordingEditState) => void>();

function publish(next: WordingEditState): void {
  state = next;
  for (const listener of listeners) listener(state);
}

export function getWordingEditState(): WordingEditState {
  return state;
}

export function subscribeWordingEdits(listener: (value: WordingEditState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The Tell Claude switch, and the Profile switch for showing edits. */
export function setWordingEditsAvailable(active: boolean, showEdits: boolean): void {
  if (state.active === active && state.showEdits === showEdits) return;
  publish({ ...state, active, showEdits, editing: active ? state.editing : false });
}

export function setWordingEditMode(editing: boolean): void {
  if (state.editing === editing || (editing && !state.active)) return;
  publish({ ...state, editing });
}

export function setWordingEdits(edits: ReadonlyMap<string, string>): void {
  publish({ ...state, edits });
}

// THE TAP.

let tapHandler: ((tap: WordingTap) => void) | null = null;

/** Registered by components/TellClaudeHost.tsx at the app root. */
export function registerWordingTapHandler(handler: (tap: WordingTap) => void): () => void {
  tapHandler = handler;
  return () => {
    if (tapHandler === handler) tapHandler = null;
  };
}

export function reportWordingTap(tap: WordingTap): void {
  if (!state.editing) return;
  tapHandler?.(tap);
}
