// Waiting for an Answer (1.0.60.2): every reminder still showing on the
// phone, in one list grouped by what it is about, each with the buttons it
// carries on the notification. Direct request, 2026-10-03: "all
// notifications should be grouped together on the phone, sort of as a
// list, grouped by notification type in the app, that the user can then go
// down the list and tap the answer for each different notification and do
// it very quickly and easily."
//
// Pure on purpose, with nothing from expo and no database, so
// scripts/test_waiting_answers.js can check it without a phone. What is
// read here came off notifications the phone has been holding, possibly
// since before an update, so every field is checked rather than trusted.
// lib/reminderNotifications.ts reads the notifications, answers a press and
// keeps the one summary notification up to date; app/waiting-answers.tsx
// draws the list.

import {
  ACTION_TEXT_INPUT,
  ALL_REMINDER_CATEGORY_KEYS,
  CATEGORY_ACTIONS,
  REMINDER_CATEGORY_IDS,
  type ReminderActionId,
  type ReminderCategoryKey,
} from './reminderActions';

/** One notification on screen, as the list needs it. */
export type ShowingReminder = {
  identifier: string;
  /** When the phone showed it, in milliseconds. */
  shownAt: number;
  title: string;
  body: string;
  categoryIdentifier: string | null;
  kind: string;
};

export type WaitingGroupKey =
  | 'morning'
  | 'dose'
  | 'meal'
  | 'water'
  | 'checkin'
  | 'todo'
  | 'garden'
  | 'upkeep'
  | 'other';

export type WaitingItem = ShowingReminder & {
  /** Every copy of the same reminder on screen (the first one and any
   *  follow-ups or snoozes), newest first; an answer takes all of them away. */
  copies: string[];
  actions: ReminderActionId[];
};

export type WaitingGroup = {
  key: WaitingGroupKey;
  label: string;
  items: WaitingItem[];
};

// In the order a day usually asks them: how the night went first, then
// what is taken and eaten, then the things to do.
export const WAITING_GROUP_LABELS: Record<WaitingGroupKey, string> = {
  morning: 'This Morning',
  dose: 'Doses',
  meal: 'Meals',
  water: 'Water',
  checkin: 'How You Are',
  todo: 'Things to Do',
  garden: 'Garden',
  upkeep: 'Upkeep',
  other: 'Everything Else',
};

const GROUP_ORDER = Object.keys(WAITING_GROUP_LABELS) as WaitingGroupKey[];

export function waitingGroupFor(kind: string): WaitingGroupKey {
  switch (kind) {
    case 'morning':
      return 'morning';
    case 'dose':
    case 'refill':
      return 'dose';
    case 'meal':
      return 'meal';
    case 'hydration':
      return 'water';
    case 'checkin':
    case 'afterMeal':
      return 'checkin';
    case 'reminder':
    case 'check':
    case 'todo':
    case 'routine':
      return 'todo';
    case 'garden':
    case 'compost':
    case 'cropPrep':
    case 'cropSow':
    case 'gardenMonth':
    case 'photoSeries':
      return 'garden';
    case 'upkeep':
      return 'upkeep';
    default:
      return 'other';
  }
}

// The fields that put a reminder into its group in Android's notification
// shade (1.0.60.4). Read by the patched expo-notifications
// (patches/expo-notifications+0.32.17.patch): androidGroup groups the
// reminder, androidGroupTitle heads the group's summary, and a tap on the
// summary opens androidGroupLink, which is the Waiting for an Answer list.
// iOS ignores all three.
export const ANDROID_GROUP_PREFIX = 'inside-story-group:';
export const WAITING_LIST_LINK = 'hashimotosapp://waiting-answers';

export function androidGroupFor(kind: string): { androidGroup: string; androidGroupTitle: string; androidGroupLink: string } {
  const key = waitingGroupFor(kind);
  return {
    androidGroup: ANDROID_GROUP_PREFIX + key,
    androidGroupTitle: WAITING_GROUP_LABELS[key],
    androidGroupLink: WAITING_LIST_LINK,
  };
}

/** The buttons a notification carries, read from the set it was given. */
export function actionsForCategory(categoryIdentifier: string | null): ReminderActionId[] {
  const key = ALL_REMINDER_CATEGORY_KEYS.find(
    (candidate: ReminderCategoryKey) => REMINDER_CATEGORY_IDS[candidate] === categoryIdentifier,
  );
  return CATEGORY_ACTIONS[key ?? 'plain'];
}

export function actionTakesWords(action: ReminderActionId): boolean {
  return ACTION_TEXT_INPUT[action] !== undefined;
}

/**
 * The reminder a copy belongs to: a follow-up ("#nudge2") and a snooze
 * ("inside-story-snooze:" plus the original's name, then "@" and a time)
 * are the same reminder as the first one, so the list shows it once.
 */
export function baseReminderId(identifier: string, ourPrefix: string, snoozePrefix: string): string {
  let id = identifier;
  if (id.startsWith(snoozePrefix)) id = id.slice(snoozePrefix.length).split('@')[0];
  const nudge = id.indexOf('#nudge');
  if (nudge >= 0) id = id.slice(0, nudge);
  return id.startsWith(ourPrefix) ? id : ourPrefix + id;
}

/**
 * Groups what is showing into the list. Only this app's reminders are
 * passed in. Each reminder appears once, as its newest copy; groups come
 * in a fixed order and, inside one, the oldest waiting first, since that
 * one has waited longest.
 */
export function groupWaiting(showing: ShowingReminder[], ourPrefix: string, snoozePrefix: string): WaitingGroup[] {
  const byBase = new Map<string, ShowingReminder[]>();
  for (const reminder of showing) {
    if (!reminder.identifier) continue;
    const base = baseReminderId(reminder.identifier, ourPrefix, snoozePrefix);
    const list = byBase.get(base) ?? [];
    list.push(reminder);
    byBase.set(base, list);
  }
  const groups = new Map<WaitingGroupKey, WaitingItem[]>();
  for (const copies of byBase.values()) {
    copies.sort((a, b) => b.shownAt - a.shownAt);
    const newest = copies[0];
    const item: WaitingItem = {
      ...newest,
      // The oldest copy says how long it has been waiting.
      shownAt: copies[copies.length - 1].shownAt,
      copies: copies.map((copy) => copy.identifier),
      actions: actionsForCategory(newest.categoryIdentifier),
    };
    const key = waitingGroupFor(newest.kind);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return GROUP_ORDER.filter((key) => groups.has(key)).map((key) => ({
    key,
    label: WAITING_GROUP_LABELS[key],
    items: (groups.get(key) ?? []).sort((a, b) => a.shownAt - b.shownAt),
  }));
}

export function countWaiting(groups: WaitingGroup[]): number {
  return groups.reduce((sum, group) => sum + group.items.length, 0);
}

/** Two or more waiting earns the one notification that opens the list. */
export const SUMMARY_FROM = 2;

export function summaryTitle(count: number): string {
  return count + ' reminders waiting for an answer';
}

/** The summary's second line: what is waiting, by group, in list order. */
export function summaryBody(groups: WaitingGroup[]): string {
  const parts = groups.map((group) => group.label + ': ' + group.items.length);
  return 'Tap to answer them in one list. ' + parts.join(', ');
}

/** How long a reminder has been waiting, in words. */
export function waitingFor(shownAt: number, now: number): string {
  const minutes = Math.max(0, Math.floor((now - shownAt) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : minutes + ' minutes ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : hours + ' hours ago';
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : days + ' days ago';
}
