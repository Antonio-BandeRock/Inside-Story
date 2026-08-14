// Per-topic mute for the general-health gradient (lib/generalHealthRules.ts),
// 2026-08-14 -- explicit, direct requirement: "Make the muting granular,
// per topic, not sweeping." Mutes only the interactive, in-the-moment
// surfacing in Food builders (components/GeneralHealthAdvisories.tsx is the
// one and only real reader of this preference) -- the rule evaluator
// itself (lib/generalHealthRules.ts) has no awareness of mute state at
// all, so Trends/Reports, whenever they call that same evaluator directly,
// are structurally unaffected by anything muted here.
//
// Same live-reactive shape as lib/visualPreferences.ts (a single JSON blob
// under one app_meta key, a module-level cache + subscriber list so a
// toggle flipped in Profile reaches every mounted builder instantly, no
// app restart) -- a genuinely different, functional preference, not an
// appearance one, so kept in its own file rather than folded into that
// one.

import { getDatabase } from './db';

export type GeneralHealthPreferences = {
  // true = muted (hidden from the interactive builder UI). Keyed by each
  // rule's own real, stable topicId (see lib/generalHealthRules.ts).
  // Absent for a topic means "not muted" -- the real default, so a newly
  // added rule is visible by default without needing a migration here.
  mutedTopics: Record<string, boolean>;
};

const DEFAULT_GENERAL_HEALTH_PREFERENCES: GeneralHealthPreferences = {
  mutedTopics: {},
};

const GENERAL_HEALTH_PREFERENCES_KEY = 'general_health_preferences';

let cached: GeneralHealthPreferences | null = null;
let loadingPromise: Promise<GeneralHealthPreferences> | null = null;
const listeners = new Set<(prefs: GeneralHealthPreferences) => void>();

function notifyListeners() {
  if (!cached) return;
  const snapshot = cached;
  listeners.forEach((listener) => listener(snapshot));
}

// A synchronous best-guess for the very first render, before the async load
// below resolves -- returns the real cached value once it exists,
// otherwise "nothing muted," which matches today's actual shipped
// behavior (every general-health row already shows unconditionally) so a
// not-yet-loaded first frame looks correct rather than briefly hiding
// something that isn't actually muted.
export function getCachedGeneralHealthPreferences(): GeneralHealthPreferences {
  return cached ?? DEFAULT_GENERAL_HEALTH_PREFERENCES;
}

export async function getGeneralHealthPreferences(): Promise<GeneralHealthPreferences> {
  if (cached) return cached;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_meta WHERE key = ?',
      GENERAL_HEALTH_PREFERENCES_KEY,
    );

    let loaded = DEFAULT_GENERAL_HEALTH_PREFERENCES;
    if (row?.value) {
      try {
        const parsed = JSON.parse(row.value) as Partial<GeneralHealthPreferences>;
        loaded = { ...DEFAULT_GENERAL_HEALTH_PREFERENCES, ...parsed, mutedTopics: { ...(parsed.mutedTopics ?? {}) } };
      } catch {
        // A corrupted/unparseable blob falls back to defaults rather than
        // throwing -- this is a preference, not core health data.
        loaded = DEFAULT_GENERAL_HEALTH_PREFERENCES;
      }
    }

    cached = loaded;
    return loaded;
  })();

  const result = await loadingPromise;
  loadingPromise = null;
  return result;
}

// Sets exactly one topic's own mute state, leaving every other topic's
// current preference untouched -- the real, direct point of "granular, per
// topic, not sweeping."
export async function setTopicMuted(topicId: string, muted: boolean): Promise<GeneralHealthPreferences> {
  const current = await getGeneralHealthPreferences();
  const mutedTopics = { ...current.mutedTopics };
  if (muted) {
    mutedTopics[topicId] = true;
  } else {
    delete mutedTopics[topicId];
  }
  const merged: GeneralHealthPreferences = { ...current, mutedTopics };

  cached = merged;
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `,
    GENERAL_HEALTH_PREFERENCES_KEY,
    JSON.stringify(merged),
    now,
  );

  notifyListeners();
  return merged;
}

// Subscribed to by useGeneralHealthPreferences (hooks/) -- every mounted
// consumer (every builder's own GeneralHealthAdvisories, Profile's own
// mute-toggle list) re-renders the instant a change is saved anywhere,
// with no app restart needed.
export function subscribeToGeneralHealthPreferences(listener: (prefs: GeneralHealthPreferences) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
