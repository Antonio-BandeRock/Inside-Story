// Walk me through it, 2026-09-24 (1.0.51.10).
//
// Direct question: "Is there a way to have a guided version for each thing
// that goes beyond the standard autism/adhd version? It may need indicators
// to sort of prod the user along through the steps necessary for each
// thing." The first stage of the answer, approved the same day: a strip that
// stays at the top of every screen while somebody does one guide step, saying
// only the one thing to do now.
//
// Three rules shape it:
//   1. Getting there moves on by itself. The strip knows which screen and
//      which lens are open (the corner box reports both, lib/tellClaude.ts),
//      so "choose Life" is replaced by "choose Routines" the moment Life is
//      open, and comes back if the person wanders off, which is how the walk
//      helps somebody find their way back to the thing they were doing.
//   2. The taps once there move on with Next, since nothing on those screens
//      reports a press yet. Next also passes a getting-there line the strip
//      could not confirm, so a walk can never be stuck.
//   3. The walk finishes when the record exists, never on a button: the same
//      check that ticks the step in Your Story. A step with no record (reading
//      something) ends on its last line.
// No count of steps, no progress bar, no praise: the strip says what to do
// and, at the end, what the saved thing now does.
//
// The steps, the position and the store live here with no runtime import
// but the guide names, so scripts/test_your_story.js checks them without a
// phone. components/StoryWalkHost.tsx draws the strip.
import {
  FROM_HOME,
  GO_HOME,
  GUIDE_BY_KEY,
  HUB,
  LENS_NAMES,
  MY_ITEMS_LENSES,
  TAB_NAMES,
  type GuideEntry,
  type GuideKey,
} from './yourStoryGuides';

// Which way the arrow on the strip points: toward the round button, the
// corner lens button, or the bookmarks button beside it.
export type WalkPoint = 'hub' | 'corner' | 'bookmarks' | null;

export type WalkStep = {
  say: string;
  point: WalkPoint;
  // A getting-there line: met once this screen (and lens) is open.
  until?: { pathname: string; lens?: string };
};

export type WalkPlace = {
  pathname: string;
  // The tab the corner box last reported, and its open lens.
  tab: string | null;
  lens: string | null;
};

export const WALK_START_LABEL = 'Walk me through it';
export const WALK_STOP_LABEL = 'Stop';
export const WALK_CLOSE_LABEL = 'Close';
export const WALK_NEXT_LABEL = 'Next';
export const WALK_BACK_LABEL = 'Back';
export const WALK_STORY_LABEL = 'Your Story';
export const WALK_WAITING_LINE = 'Once it is saved, this finishes by itself.';
export const WALK_NO_RECORD_LINE = 'That is all there is to this one.';
export const WALK_SAVED_LINE = 'It is on record now.';
export const WALK_CAPTION = 'Walking through';
export const WALK_SHRINK_LABEL = 'Make this smaller';
export const WALK_GROW_LABEL = 'Show all of this';

/** Every line of the walk for one guide step, getting there first. */
export function walkSteps(entry: GuideEntry): WalkStep[] {
  const destination = entry.destination;
  const taps: WalkStep[] = (entry.taps ?? []).map((say) => ({ say, point: null }));
  if (destination.kind === 'beats') return taps;
  if (destination.kind === 'home' || destination.kind === 'quickLog') {
    const near =
      destination.kind === 'home' ? 'The check-in card is near the top of Home.' : 'The button is near the top of Home.';
    return [{ say: GO_HOME, point: 'hub', until: { pathname: '/' } }, ...(taps.length ? taps : [{ say: near, point: null }])];
  }
  const { pathname, params } = destination;
  if (pathname === '/connections') {
    return [
      { say: `${HUB} and choose Profile.`, point: 'hub', until: { pathname: '/profile' } },
      { say: 'Tap Connections to open it, then tap Manage Connections.', point: null, until: { pathname } },
      ...taps,
    ];
  }
  const home = FROM_HOME[pathname];
  if (home) {
    const [band, button] = home;
    return [
      { say: GO_HOME, point: 'hub', until: { pathname: '/' } },
      { say: `Find ${band} and tap ${button}.`, point: null, until: { pathname } },
      ...taps,
    ];
  }
  const tab = TAB_NAMES[pathname];
  if (!tab) return taps;
  const lens = params ? Object.values(params)[0] : undefined;
  const lensName = lens ? LENS_NAMES[pathname]?.[lens] : undefined;
  const steps: WalkStep[] = [{ say: `${HUB} and choose ${tab}.`, point: 'hub', until: { pathname } }];
  if (lens && lensName) {
    const bookmarks = MY_ITEMS_LENSES[pathname]?.includes(lens);
    steps.push({
      say: bookmarks
        ? `Tap the small bookmarks button just to the left of the round one, and choose ${lensName}.`
        : `Tap the button in the bottom-left corner and choose ${lensName}.`,
      point: bookmarks ? 'bookmarks' : 'corner',
      until: { pathname, lens: lensName },
    });
  }
  return [...steps, ...taps];
}

/**
 * Whether a getting-there line is met here. A lens counts as open when the
 * corner box says so for this tab; when it has not reported this tab yet,
 * the lens is taken as open rather than sending somebody round in a circle.
 */
export function stepMet(step: WalkStep, place: WalkPlace): boolean {
  if (!step.until) return false;
  if (place.pathname !== step.until.pathname) return false;
  if (!step.until.lens) return true;
  if (place.tab !== TAB_NAMES[step.until.pathname]) return true;
  return place.lens === step.until.lens;
}

/**
 * The line to show: past every getting-there line already met or passed
 * with Next, but back to the first one that no longer holds, since that is
 * where the person has wandered from. steps.length means the end.
 */
export function walkPosition(steps: WalkStep[], cursor: number, skipped: readonly number[], place: WalkPlace): number {
  let at = Math.max(0, Math.min(cursor, steps.length));
  while (at < steps.length && steps[at].until && (skipped.includes(at) || stepMet(steps[at], place))) at += 1;
  for (let index = 0; index < at; index += 1) {
    const step = steps[index];
    if (step.until && !skipped.includes(index) && !stepMet(step, place)) return index;
  }
  return at;
}

/** Back is offered only onto a tap line, since a getting-there line behind
 * the person is already met and would hand them straight forward again. */
export function canStepBack(steps: WalkStep[], at: number): boolean {
  return at > 0 && !steps[at - 1].until;
}

// THE WALK UNDER WAY.

export type StoryWalk = {
  guide: GuideKey;
  entryKey: string;
  // A step already on record when the walk began ends on its last line
  // rather than waiting for a record that is already there.
  startedDone: boolean;
  cursor: number;
  skipped: number[];
};

export function walkEntry(walk: StoryWalk): GuideEntry | null {
  return GUIDE_BY_KEY[walk.guide]?.entries.find((entry) => entry.key === walk.entryKey) ?? null;
}

/** Pressing Next at a position. */
export function walkNext(walk: StoryWalk, steps: WalkStep[], at: number): StoryWalk {
  const skipped = steps[at]?.until && !walk.skipped.includes(at) ? [...walk.skipped, at] : walk.skipped;
  return { ...walk, cursor: at + 1, skipped };
}

export function walkBack(walk: StoryWalk, at: number): StoryWalk {
  return { ...walk, cursor: Math.max(0, at - 1) };
}

let current: StoryWalk | null = null;
const listeners = new Set<(value: StoryWalk | null) => void>();

export function setStoryWalk(value: StoryWalk | null): void {
  current = value;
  for (const listener of listeners) listener(value);
}

export function startStoryWalk(guide: GuideKey, entryKey: string, startedDone: boolean): void {
  setStoryWalk({ guide, entryKey, startedDone, cursor: 0, skipped: [] });
}

export function getStoryWalk(): StoryWalk | null {
  return current;
}

export function subscribeStoryWalk(listener: (value: StoryWalk | null) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
