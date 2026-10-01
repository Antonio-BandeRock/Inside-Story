// Calm (D15): reads and writes the two app_meta rows lib/calm.ts describes.
// calm_own travels between the person's devices; calm_voice is listed in
// DEVICE_LOCAL_META_KEYS, since a voice on one device is not on another.
import {
  CALM_OWN_META_KEY,
  CALM_VOICE_META_KEY,
  parseCalmOwn,
  parseVoiceChoice,
  serializeCalmOwn,
  serializeVoiceChoice,
  type CalmOwn,
  type VoiceChoice,
} from './calm';
import { getDatabase } from './db';

async function readMeta(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', key);
  return row?.value ?? null;
}

async function writeMeta(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value,
    new Date().toISOString(),
  );
}

export async function getCalmOwn(): Promise<CalmOwn> {
  return parseCalmOwn(await readMeta(CALM_OWN_META_KEY));
}

export async function saveCalmOwn(own: CalmOwn): Promise<void> {
  await writeMeta(CALM_OWN_META_KEY, serializeCalmOwn(own));
}

export async function getVoiceChoice(): Promise<VoiceChoice> {
  return parseVoiceChoice(await readMeta(CALM_VOICE_META_KEY));
}

export async function saveVoiceChoice(choice: VoiceChoice): Promise<void> {
  await writeMeta(CALM_VOICE_META_KEY, serializeVoiceChoice(choice));
}
