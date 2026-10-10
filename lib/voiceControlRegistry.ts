// What voice control can reach on the screen right now (1.0.66.11).
//
// Direct instruction, 2026-10-10: "I do mean they can do everything in the
// app by voice command using plain words, and not just some things." So no
// screen lists its own commands. Every button, text box and scrolling view in
// this app's own files puts itself here while it is mounted, through the
// Metro swap (components/voiceNamedControl.js) for buttons and scroll views,
// AppTextInput for text boxes, and LensHub for each tab's lenses. A button
// added next year is reachable by voice the day it is drawn, by whatever
// words are on it or its accessibilityLabel.
//
// Imports nothing, and above all not 'react-native': the swap that feeds this
// file is what 'react-native' resolves to in this app's own folders, so
// importing it here would be a loop. Measuring what is on screen happens in
// components/VoiceCommandSheet.tsx instead.

export type VoiceNode = {
  measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void;
} | null;

// Every entry says whether the screen holding it is the one in front, from
// the navigation object of the screen it was drawn in. A tab visited earlier
// stays mounted behind the current one, and the tabs stay mounted under
// Profile, so without this "press Save" could reach a button nobody can see.
// Something drawn at the root, over every screen (a sheet, a hub), has no
// screen and is always in front.
export type VoiceFocus = () => boolean;

export type VoiceControlEntry = {
  focused: VoiceFocus;
  // Read when a command is heard, never when the control mounts, so a button
  // whose words change (Start, then Stop) answers to what it says now.
  name: () => string;
  canPress: () => boolean;
  press: () => void;
  node: () => VoiceNode;
};

export type VoiceFieldEntry = {
  focused: VoiceFocus;
  name: () => string;
  canType: () => boolean;
  setText: (text: string) => void;
  focus: () => void;
  node: () => VoiceNode;
};

export type ScrollMove = 'up' | 'down' | 'top' | 'bottom';

export type VoiceScrollerEntry = {
  focused: VoiceFocus;
  vertical: () => boolean;
  scroll: (move: ScrollMove, viewportHeight: number) => void;
  node: () => VoiceNode;
};

export type VoiceLensSet = {
  focused: VoiceFocus;
  options: () => { key: string; label: string }[];
  select: (key: string) => void;
};

let nextId = 1;
const controls = new Map<number, VoiceControlEntry>();
const fields = new Map<number, VoiceFieldEntry>();
const scrollers = new Map<number, VoiceScrollerEntry>();
const lensSets = new Map<number, VoiceLensSet>();

function adder<T>(map: Map<number, T>) {
  return (entry: T): (() => void) => {
    const id = nextId++;
    map.set(id, entry);
    return () => {
      map.delete(id);
    };
  };
}

export const registerVoiceControl = adder(controls);
export const registerVoiceField = adder(fields);
export const registerVoiceScroller = adder(scrollers);
export const registerVoiceLenses = adder(lensSets);

export function voiceControls(): VoiceControlEntry[] {
  return [...controls.values()];
}

export function voiceFields(): VoiceFieldEntry[] {
  return [...fields.values()];
}

export function voiceScrollers(): VoiceScrollerEntry[] {
  return [...scrollers.values()];
}

export function voiceLensSets(): VoiceLensSet[] {
  return [...lensSets.values()];
}

// The test every entry uses, given the navigation object of the screen it
// was drawn in (React Navigation's NavigationContext), or none at the root.
export function focusOf(navigation: unknown): VoiceFocus {
  const nav = navigation as { isFocused?: () => boolean } | null | undefined;
  if (!nav || typeof nav.isFocused !== 'function') return () => true;
  return () => {
    try {
      return nav.isFocused!();
    } catch {
      return false;
    }
  };
}

// The words inside a button, read the way a person sees them: every string
// and number among its children and theirs, joined with spaces. An icon has
// none. A child drawn by a function (Pressable's pressed => ...) is skipped.
export function wordsInside(children: unknown, depth = 0): string {
  if (depth > 12 || children === null || children === undefined || typeof children === 'boolean') return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children
      .map((child) => wordsInside(child, depth + 1))
      .filter(Boolean)
      .join(' ');
  }
  if (typeof children === 'object' && 'props' in (children as object)) {
    const props = (children as { props?: { children?: unknown; accessibilityLabel?: unknown } }).props;
    if (props && typeof props.accessibilityLabel === 'string') return props.accessibilityLabel;
    return wordsInside(props?.children, depth + 1);
  }
  return '';
}
