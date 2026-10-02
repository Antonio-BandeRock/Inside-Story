// An elimination series: foods brought back one at a time, in an order the
// person chose (F6, 2026-10-01). Pure: no I/O, and the only import is the
// one-run sentence every experiment result already ends with.
//
// A series is a plan, kept in trial_series and trial_series_items, apart
// from food_trials. A planned food has no trial row until its turn comes,
// so nothing in a report, a Trends lens or an achievement reads a food
// nobody has started yet as started. When the trial that is open ends
// (cleared, flagged or removed), the next planned food becomes a waiting
// trial, which starts by itself the first time a meal with it is logged,
// or with Start now for a food typed rather than picked.
//
// One food at a time is the point of the thing, so a series never queues a
// second trial while one of its trials is still open. The summary says
// what happened to each food and ends with EXPERIMENT_LIMIT: each food in
// a series is tried once, which is one run.

import { EXPERIMENT_LIMIT } from './foodExperiment';

export const SERIES_LIMIT = EXPERIMENT_LIMIT;

export type SeriesTrialStatus = 'waiting' | 'trialing' | 'cleared' | 'flagged';

// queued: its turn has not come. removed: its trial was deleted.
export type SeriesItemState = 'queued' | 'skipped' | 'removed' | SeriesTrialStatus;

export type SeriesItem = {
  id: string;
  position: number;
  foodName: string;
  trialId: string | null;
  // The status of the trial trialId names; null when there is none or it
  // was deleted.
  trialStatus: SeriesTrialStatus | null;
  skippedAt: string | null;
};

export type SeriesInput = {
  stoppedAt: string | null;
  items: SeriesItem[];
};

export function itemState(item: SeriesItem): SeriesItemState {
  if (item.skippedAt) return 'skipped';
  if (!item.trialId) return 'queued';
  return item.trialStatus ?? 'removed';
}

function inOrder(items: SeriesItem[]): SeriesItem[] {
  return [...items].sort((a, b) => a.position - b.position);
}

export function openItem(items: SeriesItem[]): SeriesItem | null {
  return inOrder(items).find((item) => {
    const state = itemState(item);
    return state === 'waiting' || state === 'trialing';
  }) ?? null;
}

export function nextQueued(items: SeriesItem[]): SeriesItem | null {
  return inOrder(items).find((item) => itemState(item) === 'queued') ?? null;
}

// Whether the next food gets its trial now: the series is running, nothing
// in it is open, and something is still to come.
export function shouldQueueNext(series: SeriesInput): boolean {
  return !series.stoppedAt && !openItem(series.items) && !!nextQueued(series.items);
}

export function isFinished(series: SeriesInput): boolean {
  return !openItem(series.items) && !nextQueued(series.items);
}

// Skip is offered on a food whose turn has not come, or whose trial is
// waiting with nothing logged against it yet. A food being watched is
// ended with No problems or Flag it, the same as any trial.
export function canSkip(item: SeriesItem): boolean {
  const state = itemState(item);
  return state === 'queued' || state === 'waiting';
}

function list(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// The short line under a series' name.
export function seriesProgressLine(series: SeriesInput): string {
  const total = series.items.length;
  const tried = series.items.filter((item) => {
    const state = itemState(item);
    return state === 'cleared' || state === 'flagged';
  }).length;
  const foods = total === 1 ? 'food' : 'foods';
  if (series.stoppedAt) return `${tried} of ${total} ${foods} tried, then stopped.`;
  if (isFinished(series)) return `Finished: ${tried} of ${total} ${foods} tried.`;
  return `${tried} of ${total} ${foods} tried so far.`;
}

// The full account, one line per kind of thing, then the one-run sentence.
export function seriesSummaryLines(series: SeriesInput): string[] {
  const items = inOrder(series.items);
  const named = (state: SeriesItemState) => items.filter((item) => itemState(item) === state).map((item) => item.foodName);
  const lines: string[] = [];

  const cleared = named('cleared');
  const flagged = named('flagged');
  if (cleared.length) lines.push(`Marked no problems: ${list(cleared)}.`);
  if (flagged.length) lines.push(`Flagged: ${list(flagged)}.`);

  const open = openItem(items);
  if (open) {
    lines.push(
      itemState(open) === 'trialing'
        ? `Now: ${open.foodName}, being watched.`
        : `Now: ${open.foodName}, waiting to start.`,
    );
  }

  const queued = named('queued');
  if (queued.length && !series.stoppedAt) {
    lines.push(`Next: ${queued[0]}.`);
    if (queued.length > 1) lines.push(`After that: ${list(queued.slice(1))}.`);
  } else if (queued.length) {
    lines.push(`Not tried before it stopped: ${list(queued)}.`);
  }

  const skipped = named('skipped');
  if (skipped.length) lines.push(`Skipped: ${list(skipped)}.`);
  const removed = named('removed');
  if (removed.length) lines.push(`Trial removed: ${list(removed)}.`);

  if (!series.stoppedAt && isFinished(series)) lines.push('Every food in the series has had its turn.');
  if (cleared.length || flagged.length) lines.push(SERIES_LIMIT);
  return lines;
}
