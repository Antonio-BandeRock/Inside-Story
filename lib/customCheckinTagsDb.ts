// Symptoms the person names, D3 of the competitive build plan (Phase 2,
// 2026-09-26). An open list beside the built-in tags in lib/checkinTags.ts:
// add, rename, and remove, where removing one a check-in used retires it
// (the check-in keeps its name) and removing one nothing used deletes it.
// Every change reloads the label cache in lib/checkinTags.ts.
import { setCustomCheckinTags, CUSTOM_TAG_PREFIX, type CheckinTagCategory } from './checkinTags';
import { getDatabase, readCustomCheckinTags } from './db';

async function reload(): Promise<void> {
  const db = await getDatabase();
  setCustomCheckinTags(await readCustomCheckinTags(db));
}

/** Adds a symptom and returns its tag code, or the code of an existing
 *  one with the same name (brought back if it had been removed). */
export async function addCustomCheckinTag(
  label: string,
  category: CheckinTagCategory,
  usualValence: 'positive' | 'negative' = 'negative',
): Promise<string | null> {
  const name = label.trim();
  if (!name) return null;
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM custom_checkin_tags WHERE lower(label) = lower(?)',
    name,
  );
  if (existing) {
    await db.runAsync('UPDATE custom_checkin_tags SET retired_at = NULL, updated_at = ? WHERE id = ?', now, existing.id);
    await reload();
    return CUSTOM_TAG_PREFIX + existing.id;
  }
  const id = `symptom_${Date.now()}`;
  await db.runAsync(
    'INSERT INTO custom_checkin_tags (id, label, category, usual_valence, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    name,
    category,
    usualValence,
    now,
    now,
  );
  await reload();
  return CUSTOM_TAG_PREFIX + id;
}

export async function renameCustomCheckinTag(code: string, label: string): Promise<void> {
  const name = label.trim();
  if (!name || !code.startsWith(CUSTOM_TAG_PREFIX)) return;
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE custom_checkin_tags SET label = ?, updated_at = ? WHERE id = ?',
    name,
    new Date().toISOString(),
    code.slice(CUSTOM_TAG_PREFIX.length),
  );
  await reload();
}

/** 'retired' when a check-in used it, 'deleted' when nothing did. */
export async function removeCustomCheckinTag(code: string): Promise<'retired' | 'deleted' | null> {
  if (!code.startsWith(CUSTOM_TAG_PREFIX)) return null;
  const db = await getDatabase();
  const id = code.slice(CUSTOM_TAG_PREFIX.length);
  const used = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM checkin_tags WHERE tag_code = ?', code);
  if ((used?.n ?? 0) > 0) {
    const now = new Date().toISOString();
    await db.runAsync('UPDATE custom_checkin_tags SET retired_at = ?, updated_at = ? WHERE id = ?', now, now, id);
    await reload();
    return 'retired';
  }
  await db.runAsync('DELETE FROM custom_checkin_tags WHERE id = ?', id);
  await reload();
  return 'deleted';
}
