// Purple Digest thumbs-up/down feedback -- 2026-08-08, one of the real,
// contained wins named in the original knowledge-base-design discussion
// ("thumbs-up/down feedback" on an article). Deliberately local-only, no
// server, no aggregation -- this is a personal "did this land for me" mark
// on an entry, the same local-first spirit as the rest of this app's own
// health data, not a rating meant to be pooled across users. A future
// pass could surface "entries I've marked down" as its own real filter,
// or feed thumbs-down entries back into a future content-revision queue,
// but neither is built here -- this is just the capture mechanism.
//
// Stored the same single-JSON-blob-under-one-key pattern already
// established by lib/visualPreferences.ts (itself modeled on
// getStoredMeasurementSystem in lib/db.ts) -- one small, cohesive map
// rather than a dedicated table, since Purple Digest is the only real
// consumer and there's no cross-screen live-reactivity need the way
// visual preferences has (only one Purple Digest screen instance is ever
// mounted at a time), so this stays simpler: plain async get/set, no
// subscriber list.

import { getDatabase } from './db';

export type DigestFeedbackValue = 'up' | 'down';

const DIGEST_FEEDBACK_KEY = 'digest_feedback';

export async function getAllDigestFeedback(): Promise<Record<string, DigestFeedbackValue>> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', DIGEST_FEEDBACK_KEY);
  if (!row?.value) return {};
  try {
    const parsed = JSON.parse(row.value) as Record<string, DigestFeedbackValue>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // A corrupted/unparseable blob resets to empty rather than throwing --
    // this is a personal, low-stakes preference, not core health data.
    return {};
  }
}

// A small convenience wrapper for a single-card consumer (DigestCard,
// below) that only ever needs its own one entry's value, not the whole
// map -- reads the same underlying blob either way, just extracts one key.
export async function getDigestFeedbackFor(entryId: string): Promise<DigestFeedbackValue | null> {
  const all = await getAllDigestFeedback();
  return all[entryId] ?? null;
}

// Passing `null` clears a given entry's own feedback entirely (the same
// "tap the already-active choice again to remove it" toggle behavior the
// UI below implements) rather than leaving a stale value behind.
export async function setDigestFeedback(
  entryId: string,
  value: DigestFeedbackValue | null,
): Promise<Record<string, DigestFeedbackValue>> {
  const current = await getAllDigestFeedback();
  const merged = { ...current };
  if (value === null) {
    delete merged[entryId];
  } else {
    merged[entryId] = value;
  }

  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `,
    DIGEST_FEEDBACK_KEY,
    JSON.stringify(merged),
    now,
  );

  return merged;
}
