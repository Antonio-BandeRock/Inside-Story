// The way back to Your Story, 2026-09-24 (1.0.51.9).
//
// Direct request: "There needs to be a Back button for each of them that
// brings them back, so the user can always get back to the Continuation of
// their story on Home screen, rather than having to hit the TabHub menu and
// go to Home."
//
// A guide step or a line on the Home card sends somebody to a tab, a lens or
// a screen. This module remembers where they left from, and
// components/StoryReturnHost.tsx, mounted once at the app root, shows one
// button on whatever screen they land on that takes them straight back. One
// host rather than a button on every destination, because the destinations
// are every tab and a dozen screens, and a new one added to a guide should
// get the button without anybody remembering to add it.
//
// Nothing is stored in the database: a way back belongs to this run of the
// app, and a restart starts at Home anyway. Imports nothing, so
// scripts/test_your_story.js can load it; the hook that watches it lives in
// components/StoryReturnHost.tsx.

export type StoryOrigin =
  // The Your Story card on Home, which opens back up and scrolls into view.
  | { kind: 'home' }
  // The Your Story page, back on the guide that was open.
  | { kind: 'page'; guide: string | null };

export type StoryReturn = {
  origin: StoryOrigin;
  // Set once the person is somewhere other than where they left from. Until
  // then the button stays hidden, and arriving back where they started
  // clears it, since the way back has been used.
  left: boolean;
};

export const STORY_RETURN_LABEL = 'Back to Your Story';
export const STORY_RETURN_CLOSE_LABEL = 'Hide the way back to Your Story';

let current: StoryReturn | null = null;
const listeners = new Set<(value: StoryReturn | null) => void>();

export function setStoryReturn(value: StoryReturn | null): void {
  current = value;
  for (const listener of listeners) listener(value);
}

/** Called just before a Your Story destination is opened. */
export function markStoryReturn(origin: StoryOrigin): void {
  setStoryReturn({ origin, left: false });
}

export function clearStoryReturn(): void {
  if (current) setStoryReturn(null);
}

/** The path the origin lives at, as expo-router's usePathname reports it. */
export function originPath(origin: StoryOrigin): string {
  return origin.kind === 'home' ? '/' : '/your-story';
}

/**
 * What the host does on arriving at a path: show the button, hide it, or
 * forget the way back. Pure, so scripts/test_your_story.js can check it.
 */
export function storyReturnOnPath(
  value: StoryReturn | null,
  pathname: string,
): { show: boolean; next: StoryReturn | null } {
  if (!value) return { show: false, next: null };
  // The Your Story page counts as back wherever the person set out from,
  // since a button saying Back to Your Story is no use on it.
  const home = pathname === originPath(value.origin) || pathname === '/your-story';
  if (home) return { show: false, next: value.left ? null : value };
  return { show: true, next: value.left ? value : { ...value, left: true } };
}

/** Where the button goes, as a router target. */
export function storyReturnTarget(origin: StoryOrigin): { pathname: string; params: Record<string, string> } {
  if (origin.kind === 'home') return { pathname: '/', params: { openHomeSection: 'yourStory' } };
  return { pathname: '/your-story', params: origin.guide ? { guide: origin.guide } : {} };
}

export function getStoryReturn(): StoryReturn | null {
  return current;
}

export function subscribeStoryReturn(listener: (value: StoryReturn | null) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
