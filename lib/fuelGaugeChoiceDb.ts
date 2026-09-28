// Where the Fuel Gauges choice is kept (G31, lib/fuelGaugeChoice.ts). One
// app_meta row that travels with the person's other settings between their
// own devices.
import { getDatabase } from './db';
import { FUEL_GAUGE_META_KEY, parseFuelGaugeChoice, serializeFuelGaugeChoice } from './fuelGaugeChoice';

export async function getFuelGaugeChoice(): Promise<string[]> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', FUEL_GAUGE_META_KEY);
  return parseFuelGaugeChoice(row?.value);
}

export async function saveFuelGaugeChoice(codes: string[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    FUEL_GAUGE_META_KEY,
    serializeFuelGaugeChoice(codes),
    new Date().toISOString(),
  );
}
