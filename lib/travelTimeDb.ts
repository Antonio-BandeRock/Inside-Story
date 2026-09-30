// Reading and writing A7's travel switch and the home time zone. The
// arithmetic and every sentence are in lib/travelTime.ts.

import { getDatabase } from './db';
import { currentZone, parseTravelMode, type TravelMode } from './travelTime';

const HOME_ZONE_KEY = 'home_time_zone';

export async function listTravelModes(): Promise<Map<string, TravelMode>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ treatment_id: string; mode: string }>('SELECT treatment_id, mode FROM treatment_time_mode');
  return new Map(rows.map((row) => [row.treatment_id, parseTravelMode(row.mode)]));
}

export async function saveTravelMode(treatmentId: string, mode: TravelMode): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO treatment_time_mode (treatment_id, mode, created_at, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(treatment_id) DO UPDATE SET mode = excluded.mode, updated_at = excluded.updated_at`,
    treatmentId,
    mode,
    now,
    now,
  );
}

async function writeHomeZone(zone: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    HOME_ZONE_KEY,
    zone,
    new Date().toISOString(),
  );
}

// The home zone, taken from the phone the first time it is asked for, since
// most people set up the app at home. Null only where the engine cannot say
// which zone it is in.
export async function getHomeZone(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', HOME_ZONE_KEY);
  if (row?.value) return row.value;
  const here = currentZone();
  if (here) await writeHomeZone(here);
  return here;
}

// "Make this my home": moving house, or the zone first taken was not home.
export async function setHomeZoneToHere(): Promise<string | null> {
  const here = currentZone();
  if (here) await writeHomeZone(here);
  return here;
}
