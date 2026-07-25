// Thin wrapper around expo-sensors' Pedometer, kept deliberately honest
// about a real platform gap rather than presenting a uniform API that
// quietly behaves differently per OS.
//
// getStepCountAsync (historical range query) is iOS-only -- expo-sensors'
// own type declarations say so directly (`@platform ios`), backed by
// Apple's CMPedometer. Android's step-counter sensor only exposes a
// cumulative count since last device boot, not arbitrary date-range
// queries, and expo-sensors doesn't build a Health Connect bridge to work
// around that. watchStepCount (live foreground updates) is also
// documented to have real, longstanding reliability problems specifically
// on Android (the callback silently never firing on some OS
// versions/devices even when isAvailableAsync() reports true -- see
// expo/expo GitHub issues #9463, #13131, #16605).
//
// This matters concretely for this app: the primary dev/test device is an
// Android phone via Expo Go. Manual step entry (lib/db.ts's
// recordStepCount with source='manual') must stay the dependable primary
// path on Android, not a fallback bolted on as an afterthought -- sensor
// support here is a real bonus on iOS and a best-effort "try it, don't
// trust it" on Android. A genuinely reliable Android path would mean
// integrating Android's Health Connect API directly, which is a separate,
// larger piece of work (it needs a custom EAS dev client, not just Expo
// Go) -- not attempted here.

import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';

export type PedometerAvailability = {
  available: boolean;
  // False on Android -- see file header. Callers should use this to decide
  // whether to lead the UI with sensor-based tracking or with manual entry.
  platformReliable: boolean;
};

export async function checkPedometerAvailability(): Promise<PedometerAvailability> {
  const available = await Pedometer.isAvailableAsync();
  return { available, platformReliable: available && Platform.OS === 'ios' };
}

export async function requestPedometerPermission(): Promise<boolean> {
  const { status } = await Pedometer.requestPermissionsAsync();
  return status === 'granted';
}

// Historical step count for a date range. Reliable on iOS; returns null on
// Android (and on any unexpected failure) rather than throwing, so callers
// can fall back to manual entry or live watchStepCount without a crash.
export async function getStepCountForRange(start: Date, end: Date): Promise<number | null> {
  if (Platform.OS !== 'ios') return null;

  try {
    const result = await Pedometer.getStepCountAsync(start, end);
    return result.steps;
  } catch {
    return null;
  }
}

export type PedometerSubscription = { remove: () => void };

// Live step-count updates while the app is in the foreground. Reliable on
// iOS; on Android, treat this as "nice if it fires," never as the only way
// to get today's step count there -- see file header.
export function subscribeToLiveSteps(onUpdate: (steps: number) => void): PedometerSubscription {
  return Pedometer.watchStepCount((result) => onUpdate(result.steps));
}
