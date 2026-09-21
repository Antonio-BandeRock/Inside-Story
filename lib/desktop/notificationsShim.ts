// expo-notifications, as the desktop app sees it (see metro.config.js).
// lib/reminderNotifications.ts schedules every reminder as a dated local
// notification and reconciles the pending set against the schedule at
// startup, on foreground and after each change. On desktop the pending
// set lives in Electron's main process (desktop/notifications.js), which
// fires each one through the operating system's notification centre at
// its time and reports a click back here as a NotificationResponse of
// the same shape the app already reads. Permission is always granted:
// Windows and macOS ask nothing of an installed app for local
// notifications, and the person can silence them from the system's
// settings.

import { getDesktopBridge, type DesktopNotificationResponse } from './bridge';

export enum AndroidImportance {
  UNKNOWN = 0,
  UNSPECIFIED = 1,
  NONE = 2,
  MIN = 3,
  LOW = 4,
  DEFAULT = 5,
  HIGH = 6,
  MAX = 7,
}

export enum SchedulableTriggerInputTypes {
  DATE = 'date',
}

export type NotificationContentInput = {
  title?: string | null;
  body?: string | null;
  data?: unknown;
  sound?: boolean | string;
};

export type NotificationRequestInput = {
  identifier?: string;
  content: NotificationContentInput;
  trigger: { type: SchedulableTriggerInputTypes; date: Date | number; channelId?: string } | null;
};

export type NotificationRequest = {
  identifier: string;
  content: { title: string | null; body: string | null; data: unknown };
  trigger: { type: 'date'; value: number } | null;
};

export type NotificationResponse = {
  actionIdentifier: string;
  notification: {
    date: number;
    request: NotificationRequest;
  };
};

export type NotificationPermissionsStatus = {
  status: 'granted';
  granted: true;
  canAskAgain: false;
  expires: 'never';
};

export type Subscription = { remove(): void };

const GRANTED: NotificationPermissionsStatus = { status: 'granted', granted: true, canAskAgain: false, expires: 'never' };

export function setNotificationHandler(_handler: unknown): void {
  // The operating system decides how a desktop notification is shown.
}

export async function getPermissionsAsync(): Promise<NotificationPermissionsStatus> {
  return GRANTED;
}

export async function requestPermissionsAsync(): Promise<NotificationPermissionsStatus> {
  return GRANTED;
}

export async function setNotificationChannelAsync(_channelId: string, _channel: unknown): Promise<null> {
  return null;
}

function toTimestamp(date: Date | number): number {
  return typeof date === 'number' ? date : date.getTime();
}

export async function scheduleNotificationAsync(request: NotificationRequestInput): Promise<string> {
  const identifier = request.identifier ?? `desktop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const fireAt = request.trigger ? toTimestamp(request.trigger.date) : Date.now();
  await getDesktopBridge().notifications.schedule({
    identifier,
    title: request.content.title ?? '',
    body: request.content.body ?? '',
    data: request.content.data ?? null,
    fireAt,
  });
  return identifier;
}

export async function cancelScheduledNotificationAsync(identifier: string): Promise<void> {
  await getDesktopBridge().notifications.cancel(identifier);
}

export async function getAllScheduledNotificationsAsync(): Promise<NotificationRequest[]> {
  const pending = await getDesktopBridge().notifications.listScheduled();
  return pending.map((item) => ({
    identifier: item.identifier,
    content: { title: item.title, body: item.body, data: item.data },
    trigger: { type: 'date', value: item.fireAt },
  }));
}

function toResponse(response: DesktopNotificationResponse): NotificationResponse {
  return {
    actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
    notification: {
      date: response.respondedAt,
      request: {
        identifier: response.identifier,
        content: { title: null, body: null, data: response.data },
        trigger: null,
      },
    },
  };
}

export async function getLastNotificationResponseAsync(): Promise<NotificationResponse | null> {
  const response = await getDesktopBridge().notifications.lastResponse();
  return response ? toResponse(response) : null;
}

export function addNotificationResponseReceivedListener(listener: (response: NotificationResponse) => void): Subscription {
  const remove = getDesktopBridge().notifications.onResponse((response) => listener(toResponse(response)));
  return { remove };
}
