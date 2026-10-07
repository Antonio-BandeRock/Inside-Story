// The emergency lines on the lock screen, off until the person turns them
// on (A19, Phase 2). Which lines are shown, and whether at all, belongs to
// this device alone, so the choice lives in app_meta under a key listed in
// DEVICE_LOCAL_META_KEYS and never travels in a snapshot.
//
// Android only. A notification there can be made one the person cannot
// swipe away and shown in full on a locked screen through a channel of its
// own; an iPhone offers neither, and its Medical ID is the better place
// (lib/emergencyOutside.ts says where). The notification is not scheduled,
// it is posted, so nothing in lib/reminderNotifications.ts ever cancels it,
// and it is posted again at startup and on coming back to the foreground,
// since a phone restart clears it.
//
// Since 1.0.63.12 the notice is posted by modules/locked-capture, so a tap
// on it shows the lines over the lock screen (LockedEmergencyView) with the
// phone and the app both still locked. The lines picked are also written to
// emergency-lock-screen.json beside the lock file, in plain text, because
// that screen and a phone restart both need them without the database key.
// The file holds nothing the lock screen does not already show, and is
// deleted the moment the notice comes down. A phone on an older build keeps
// the expo-notifications notice, which opens the app.

import { File, Paths } from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDatabase } from './db';
import { isDesktopApp } from './desktop/bridge';
import { gatherFromApp, getEmergencyProfile, listEmergencyContacts } from './emergencyDb';
import { lockScreenNotice, parseLockScreenParts, type LockScreenPart } from './emergencyOutside';
import LockedCapture from '../modules/locked-capture';

const META_KEY = 'emergency_lock_screen';
const NOTIFICATION_ID = 'inside-story-emergency';
const CHANNEL_ID = 'emergency-lock-screen';
/** Read by LockedEmergencyView and by the native restore after a restart. */
export const EMERGENCY_FILE_NAME = 'emergency-lock-screen.json';

export type EmergencyLinesFile = { title: string; body: string; lines: string[]; writtenAt: string };

function writeLinesFile(title: string, body: string): void {
  const file = new File(Paths.document, EMERGENCY_FILE_NAME);
  const content: EmergencyLinesFile = { title, body, lines: body.split('\n'), writtenAt: new Date().toISOString() };
  if (!file.exists) file.create();
  file.write(JSON.stringify(content));
}

function removeLinesFile(): void {
  try {
    const file = new File(Paths.document, EMERGENCY_FILE_NAME);
    if (file.exists) file.delete();
  } catch {
    // Nothing left to remove.
  }
}

/** The lines as last written, or null. Opens no database, for the screen over the lock screen. */
export function readEmergencyLinesSync(): EmergencyLinesFile | null {
  try {
    const file = new File(Paths.document, EMERGENCY_FILE_NAME);
    if (!file.exists) return null;
    const value = JSON.parse(file.textSync()) as Partial<EmergencyLinesFile>;
    if (typeof value.title !== 'string' || !Array.isArray(value.lines)) return null;
    const lines = value.lines.filter((line): line is string => typeof line === 'string' && line.length > 0);
    return lines.length > 0 ? { title: value.title, body: lines.join('\n'), lines, writtenAt: String(value.writtenAt ?? '') } : null;
  } catch {
    return null;
  }
}

function nativeNotice(): boolean {
  return typeof LockedCapture?.showEmergencyNotice === 'function';
}

/** Whether this device can show it at all. */
export function lockScreenSupported(): boolean {
  return Platform.OS === 'android' && !isDesktopApp();
}

/** The parts picked, or an empty list when it is off. */
export async function getLockScreenParts(): Promise<LockScreenPart[]> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', META_KEY);
  return parseLockScreenParts(row?.value);
}

export async function setLockScreenParts(parts: LockScreenPart[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    META_KEY,
    JSON.stringify(parts),
    new Date().toISOString(),
  );
  await refreshLockScreenNotice();
}

function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Puts the notice up with what the record says now, or takes it down when
 * it is off or nothing picked has anything in it. Returns whether it is up.
 * Safe to call any time; it never asks for permission, which is asked for
 * only when the person turns it on.
 */
export async function refreshLockScreenNotice(): Promise<boolean> {
  if (!lockScreenSupported()) return false;
  try {
    const parts = await getLockScreenParts();
    const [profile, fromApp, contacts] = parts.length > 0
      ? await Promise.all([getEmergencyProfile(), gatherFromApp(), listEmergencyContacts()])
      : [null, null, null];
    const notice = profile && fromApp && contacts
      ? lockScreenNotice(parts, { profile, fromApp, contacts, today: today() })
      : null;
    if (!notice) {
      await Notifications.dismissNotificationAsync(NOTIFICATION_ID).catch(() => undefined);
      LockedCapture?.hideEmergencyNotice?.();
      removeLinesFile();
      return false;
    }
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return false;
    if (nativeNotice()) {
      writeLinesFile(notice.title, notice.body);
      await Notifications.dismissNotificationAsync(NOTIFICATION_ID).catch(() => undefined);
      return LockedCapture?.showEmergencyNotice?.(notice.title, notice.body) ?? false;
    }
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Emergency lines on the lock screen',
      description: 'The emergency lines you picked in Life > Emergency, readable while the phone is locked.',
      importance: Notifications.AndroidImportance.LOW,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: null,
      vibrationPattern: null,
      showBadge: false,
    });
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: { title: notice.title, body: notice.body, sticky: true, autoDismiss: false, sound: false },
      trigger: { channelId: CHANNEL_ID },
    });
    return true;
  } catch (error) {
    console.warn('[emergencyLockScreen] Could not put the notice up', error);
    return false;
  }
}

/** Asks for notification permission, for the moment it is turned on. */
export async function askLockScreenPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}
