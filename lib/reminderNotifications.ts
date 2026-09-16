import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { listReminderCandidates, type ReminderCandidate } from './db';
import { formatTime12 } from './timeOfDay';

// Local reminders: the scheduled doses in Schedules > Meds and the visits in
// Schedules > Appointments fire as phone notifications, entirely on the
// device, through expo-notifications (compiled into the 1.0.37.33 rebuild).
// Nothing here talks to a server; the content-blind push relay the
// architecture notes describe is a separate, later piece.
//
// How it stays correct without hooking every create/edit/delete path: the
// schedule_items table is the one source of truth, and
// syncReminderNotifications() reconciles the phone's pending notifications
// against it. It runs when the app starts, every time it returns to the
// foreground, and after either lens finishes loading (every mutation in
// those lenses ends in a reload). A notification exists for a schedule row
// only while that row is still planned, so marking a dose taken, cancelling
// an appointment, deactivating a med, or removing a series all drop the
// reminder at the next sync, and the rolling-window series generator in
// lib/db.ts keeps new occurrences flowing in.
//
// Freshness, per the architecture note that a reminder should say what it
// was based on: every notification body ends with "Based on your schedule
// as of {time}", the moment this sync computed it. That is what the phone
// will show even if the schedule changes while the app is closed, so the
// stamp is the honest part. Background execution is throttled on both
// platforms, so the reconcile only ever runs in the foreground.
//
// Android accuracy: expo-notifications uses an exact alarm when the app may
// schedule them and an inexact one otherwise. The manifest carries
// SCHEDULE_EXACT_ALARM as of the 1.0.37.41 rebuild, so a phone that allows
// it fires these at the time they were set for. It stays a permission the
// person can withdraw (Alarms & reminders in Android's settings), and some
// Android versions do not grant it by default; the alarm is then inexact and
// a reminder can land a few minutes late while the phone is dozing. Nothing
// here tries to detect which case applies, because a dose reminder a few
// minutes late is still the right reminder.

const IDENTIFIER_PREFIX = 'inside-story-reminder:';
const LOOKAHEAD_DAYS = 7;
// iOS caps pending local notifications at 64; keeping under that on both
// platforms means the nearest week never silently loses its tail.
const MAX_PENDING = 60;
const APPOINTMENT_LEAD_MINUTES = 60;
const ANDROID_CHANNEL_ID = 'reminders';

export type ReminderKind = 'dose' | 'appointment';

type ReminderPayload = {
  kind: ReminderKind;
  scheduleItemId: string;
  fireAt: string;
  lens: 'meds' | 'appointments';
};

type PlannedNotification = {
  identifier: string;
  title: string;
  body: string;
  fireAt: Date;
  payload: ReminderPayload;
};

export type ReminderSyncResult = {
  permission: 'granted' | 'denied' | 'unavailable';
  pending: number;
};

const supported = Platform.OS === 'android' || Platform.OS === 'ios';

if (supported) {
  // Without a handler a notification arriving while the app is open is
  // dropped silently; a dose reminder is still worth a banner then.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function hasReminderPermission(): Promise<boolean> {
  if (!supported) return false;
  const status = await Notifications.getPermissionsAsync();
  return status.granted;
}

// Asks once (the OS remembers a refusal, so a second call returns the same
// answer without a prompt) and reconciles right away on a yes, so the first
// saved dose time gets its reminder without waiting for the next sync.
export async function requestReminderPermission(): Promise<boolean> {
  if (!supported) return false;
  const status = await Notifications.requestPermissionsAsync();
  if (status.granted) void syncReminderNotifications();
  return status.granted;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function localDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localDateTimeString(date: Date): string {
  return `${localDateString(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// schedule_items.scheduled_for is a local "YYYY-MM-DDTHH:mm" string (see
// scheduleMeal in lib/db.ts), so it is read back as local wall-clock time.
function parseLocalDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "7:45 AM" when the reminder fires the same day it was computed, "Sep 14,
// 7:45 AM" otherwise, so a reminder a few days out says which day's
// schedule it reflects.
function describeFreshness(computedAt: Date, fireAt: Date): string {
  const time = formatTime12(`${pad(computedAt.getHours())}:${pad(computedAt.getMinutes())}`);
  if (localDateString(computedAt) === localDateString(fireAt)) return time;
  return `${MONTHS[computedAt.getMonth()]} ${computedAt.getDate()}, ${time}`;
}

function describeDose(candidate: ReminderCandidate): string | null {
  if (candidate.doseAmount != null && candidate.doseUnit) {
    return `${candidate.doseAmount} ${candidate.doseUnit}`;
  }
  if (candidate.unitsPerDay != null && candidate.servingUnitLabel) {
    return `${candidate.unitsPerDay} ${candidate.servingUnitLabel}`;
  }
  return null;
}

function buildPlanned(candidate: ReminderCandidate, now: Date): PlannedNotification | null {
  const scheduledFor = parseLocalDateTime(candidate.scheduledFor);
  if (!scheduledFor) return null;
  const freshness = (fireAt: Date) => `Based on your schedule as of ${describeFreshness(now, fireAt)}.`;

  if (candidate.itemType === 'appointment') {
    const fireAt = new Date(scheduledFor.getTime() - APPOINTMENT_LEAD_MINUTES * 60_000);
    // Under an hour away (or already started): the lead reminder's moment
    // has passed, and firing it late would only say what the phone's
    // calendar and the lens already show.
    if (fireAt.getTime() <= now.getTime()) return null;
    const time = formatTime12(`${pad(scheduledFor.getHours())}:${pad(scheduledFor.getMinutes())}`);
    const where = [candidate.location, candidate.providerName ? `with ${candidate.providerName}` : null]
      .filter(Boolean)
      .join(', ');
    return {
      identifier: `${IDENTIFIER_PREFIX}appointment:${candidate.id}`,
      title: `${candidate.title} at ${time}`,
      body: `${where ? `${where}. ` : ''}In about an hour. ${freshness(fireAt)}`,
      fireAt,
      payload: { kind: 'appointment', scheduleItemId: candidate.id, fireAt: fireAt.toISOString(), lens: 'appointments' },
    };
  }

  if (scheduledFor.getTime() <= now.getTime()) return null;
  const dose = describeDose(candidate);
  return {
    identifier: `${IDENTIFIER_PREFIX}dose:${candidate.id}`,
    title: `Time for ${candidate.title}`,
    body: `${dose ? `${dose}. ` : ''}${freshness(scheduledFor)}`,
    fireAt: scheduledFor,
    payload: { kind: 'dose', scheduleItemId: candidate.id, fireAt: scheduledFor.toISOString(), lens: 'meds' },
  };
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Reminders',
    description: 'Scheduled doses and upcoming appointments.',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#244147',
  });
}

function isOurs(identifier: string): boolean {
  return identifier.startsWith(IDENTIFIER_PREFIX);
}

async function cancelAllOurs(): Promise<number> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const ours = pending.filter((request) => isOurs(request.identifier));
  await Promise.all(ours.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
  return ours.length;
}

let inFlight: Promise<ReminderSyncResult> | null = null;

// Reconciles pending notifications with schedule_items. Safe to call from
// anywhere at any time; overlapping calls share one run. Never throws: a
// reminder that could not be scheduled is logged, and the schedule itself
// is untouched either way.
export function syncReminderNotifications(): Promise<ReminderSyncResult> {
  if (!supported) return Promise.resolve({ permission: 'unavailable', pending: 0 });
  if (inFlight) return inFlight;
  inFlight = runSync()
    .catch((error) => {
      console.error('[reminderNotifications] sync failed', error);
      return { permission: 'unavailable', pending: 0 } as ReminderSyncResult;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

async function runSync(): Promise<ReminderSyncResult> {
  const granted = await hasReminderPermission();
  if (!granted) {
    // Permission withdrawn in Settings after reminders were scheduled:
    // clear ours so nothing stale fires if it is granted again later.
    await cancelAllOurs();
    return { permission: 'denied', pending: 0 };
  }
  await ensureAndroidChannel();

  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + LOOKAHEAD_DAYS);
  const candidates = await listReminderCandidates(localDateTimeString(now), localDateString(horizon));

  const desired = new Map<string, PlannedNotification>();
  for (const candidate of candidates) {
    const planned = buildPlanned(candidate, now);
    if (planned) desired.set(planned.identifier, planned);
  }
  const kept = [...desired.values()].sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, MAX_PENDING);
  const keptById = new Map(kept.map((planned) => [planned.identifier, planned]));

  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const unchanged = new Set<string>();
  for (const request of pending) {
    if (!isOurs(request.identifier)) continue;
    const want = keptById.get(request.identifier);
    const data = request.content.data as Partial<ReminderPayload> | undefined;
    // Same moment and same wording means the pending one is already right;
    // anything else (moved time, edited title, dropped row) is replaced.
    if (want && data?.fireAt === want.payload.fireAt && request.content.title === want.title && request.content.body === want.body) {
      unchanged.add(request.identifier);
      continue;
    }
    await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }

  let scheduled = unchanged.size;
  for (const planned of kept) {
    if (unchanged.has(planned.identifier)) continue;
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: planned.identifier,
        content: {
          title: planned.title,
          body: planned.body,
          data: planned.payload,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: planned.fireAt,
          channelId: ANDROID_CHANNEL_ID,
        },
      });
      scheduled += 1;
    } catch (error) {
      console.error(`[reminderNotifications] could not schedule ${planned.identifier}`, error);
    }
  }
  return { permission: 'granted', pending: scheduled };
}

export type ReminderTapTarget = {
  pathname: '/schedule';
  params: { openScheduleLens: 'meds' | 'appointments' };
};

// Where a tapped reminder should land: the lens the item lives in. Null for
// any notification this module did not create.
export function resolveReminderTap(response: Notifications.NotificationResponse | null): ReminderTapTarget | null {
  const request = response?.notification.request;
  if (!request || !isOurs(request.identifier)) return null;
  const data = request.content.data as Partial<ReminderPayload> | undefined;
  const lens = data?.lens === 'appointments' ? 'appointments' : 'meds';
  return { pathname: '/schedule', params: { openScheduleLens: lens } };
}

// Cold start from a tapped reminder plus the already-running case, same
// shape as the .is file listener in app/_layout.tsx. Returns the unsubscribe.
export function listenForReminderTaps(navigate: (target: ReminderTapTarget) => void): () => void {
  if (!supported) return () => {};
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      const target = resolveReminderTap(response);
      if (target) navigate(target);
    })
    .catch((error) => console.error('[reminderNotifications] getLastNotificationResponseAsync failed', error));
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const target = resolveReminderTap(response);
    if (target) navigate(target);
  });
  return () => subscription.remove();
}
