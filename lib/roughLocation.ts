// This phone's rough location, for weather when no postal code is set (F22
// with rebuild R1, 2026-10-02). Asked for only when the person presses Use
// this phone's rough location, and only while the app is open: Android is
// asked for approximate location alone (fine and background location are
// blocked in app.json), and the lowest accuracy is requested.
//
// The point is rounded to the weather grid (about 55 km) before it is kept,
// so the exact place is never written down anywhere. It stays on this
// device ('weather_rough_point' is in DEVICE_LOCAL_META_KEYS) and is read
// once, not followed: moving house means pressing the button again.
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { getDatabase } from './db';
import { isDesktopApp } from './desktop/bridge';
import { coarsenPoint } from './weather';

const KEY = 'weather_rough_point';

export const CAN_USE_ROUGH_LOCATION = Platform.OS !== 'web' && !isDesktopApp();

export type RoughPoint = { lat: number; lon: number };
export type RoughOutcome = { ok: true; point: RoughPoint } | { ok: false; reason: string };

export async function readRoughPoint(): Promise<RoughPoint | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string | null }>('SELECT value FROM app_meta WHERE key = ?', KEY);
    if (!row?.value) return null;
    const parsed = JSON.parse(row.value) as Partial<RoughPoint>;
    return typeof parsed.lat === 'number' && typeof parsed.lon === 'number' ? { lat: parsed.lat, lon: parsed.lon } : null;
  } catch {
    return null;
  }
}

export async function forgetRoughPoint(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM app_meta WHERE key = ?', KEY);
}

export async function takeRoughPoint(): Promise<RoughOutcome> {
  if (!CAN_USE_ROUGH_LOCATION) return { ok: false, reason: 'Only the phone can give a rough location. Set a postal code in Garden > My Zone instead.' };
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return { ok: false, reason: 'Inside Story was not allowed to know the rough location, so nothing changed. A postal code in Garden > My Zone works as well.' };
    }
    const here = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
    const point = coarsenPoint(here.coords.latitude, here.coords.longitude);
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      KEY,
      JSON.stringify(point),
      new Date().toISOString(),
    );
    return { ok: true, point };
  } catch (error) {
    return { ok: false, reason: `The phone could not give a location just now (${error instanceof Error ? error.message : String(error)}). A postal code in Garden > My Zone works as well.` };
  }
}
