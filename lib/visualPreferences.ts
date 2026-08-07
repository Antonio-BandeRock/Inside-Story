// Visual preferences -- 2026-08-08, explicitly requested as a Profile-area
// preference: the ability to turn off the shared flowery background and its
// animated sky overlay (sun/moon/stars, day/night tint), to turn off or
// swap each individual tab's own background image independently rather than
// all-or-nothing, and to pick a calmer, generic alternative (a few color
// combinations) instead of the photo. Framed directly by the person as "for
// the few men who would have this app and have a problem with all the
// colors and flowers" plus a real, named battery/resource concern about the
// animated sky running continuously -- this is purely an opt-out appearance
// preference, not a redesign: header/footer colors, box/font/line colors,
// and the iridescent shimmer are explicitly untouched by any of this.
//
// Stored the same way getStoredMeasurementSystem already does (lib/db.ts) --
// a single JSON blob under one `app_meta` key, not a dedicated table, since
// this is one small, cohesive settings object rather than several
// independently-queried fields. Kept in its own file rather than folded into
// the already-7,000-line lib/db.ts.
//
// Live-reactive across the app via a tiny module-level cache + subscriber
// list (see subscribeToVisualPreferences/useVisualPreferences below) --
// needed because the shared background lives in app/(tabs)/_layout.tsx,
// mounted once, permanently, above every tab, so a toggle flipped on the
// Profile screen has to reach it without a full app restart.

import { getDatabase } from './db';

export type BackgroundStyle = 'photo' | 'generic' | 'off';

// A few calming color combinations -- not meant to compete with the real
// wildflower/produce/etc. photography, just a quieter alternative for
// anyone who wants the background gone without going fully flat. See
// components/GenericBackground.tsx for how each renders.
export type GenericPalette = 'lavender' | 'seafoam' | 'sand' | 'dusk';

export const GENERIC_PALETTE_LABELS: Record<GenericPalette, string> = {
  lavender: 'Lavender dusk',
  seafoam: 'Seafoam calm',
  sand: 'Warm sand',
  dusk: 'Twilight rose',
};

export type VisualPreferences = {
  // The sun/moon/starfield/day-night tint riding on top of the shared
  // resting background (components/AnimatedSky.tsx) -- Home's own
  // continuously-running animation, the real "power hog" named directly.
  // Only has any effect while homeBackgroundStyle is 'photo' -- there's no
  // sky band to animate over a generic or off background.
  skyAnimationsEnabled: boolean;
  // The shared flowery background behind every tab at rest, and behind Home
  // at all times (app/(tabs)/_layout.tsx's own single, permanently-mounted
  // ScreenBackground). This is "the flowery shared background" the person
  // named directly, distinct from each individual tab's own image below.
  homeBackgroundStyle: BackgroundStyle;
  // Per-tab override for each tab's own revealed background (the image that
  // replaces the shared resting scene once a function is picked -- Food's
  // produce photo, Insights' own art, etc.), keyed by that tab's real
  // TAB_ROUTES path (constants/tabs.ts). Absent for a given path means
  // "use the photo" -- deliberately not defaulted to every path up front,
  // so adding a future tab needs no migration here. This is the
  // "selectively turn off the tab backgrounds instead of an all-or-nothing
  // rule" half of the request.
  tabBackgroundStyle: Partial<Record<string, BackgroundStyle>>;
  // One shared palette choice, used wherever a 'generic' style is currently
  // selected (the shared layer and/or any individual tab) -- a single pick
  // rather than a separate palette per tab, since the point is one calm,
  // consistent alternative look, not eight independent color schemes.
  genericPalette: GenericPalette;
};

const DEFAULT_VISUAL_PREFERENCES: VisualPreferences = {
  skyAnimationsEnabled: true,
  homeBackgroundStyle: 'photo',
  tabBackgroundStyle: {},
  genericPalette: 'lavender',
};

const VISUAL_PREFERENCES_KEY = 'visual_preferences';

let cached: VisualPreferences | null = null;
let loadingPromise: Promise<VisualPreferences> | null = null;
const listeners = new Set<(prefs: VisualPreferences) => void>();

function notifyListeners() {
  if (!cached) return;
  const snapshot = cached;
  listeners.forEach((listener) => listener(snapshot));
}

// A synchronous best-guess for the very first render, before the async load
// below resolves -- returns the real cached value once it exists, otherwise
// the documented defaults (every default here matches today's actual
// shipped behavior, so a not-yet-loaded first frame looks identical to
// before this feature existed).
export function getCachedVisualPreferences(): VisualPreferences {
  return cached ?? DEFAULT_VISUAL_PREFERENCES;
}

export async function getVisualPreferences(): Promise<VisualPreferences> {
  if (cached) return cached;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_meta WHERE key = ?',
      VISUAL_PREFERENCES_KEY,
    );

    let loaded = DEFAULT_VISUAL_PREFERENCES;
    if (row?.value) {
      try {
        const parsed = JSON.parse(row.value) as Partial<VisualPreferences>;
        loaded = {
          ...DEFAULT_VISUAL_PREFERENCES,
          ...parsed,
          tabBackgroundStyle: { ...(parsed.tabBackgroundStyle ?? {}) },
        };
      } catch {
        // A corrupted/unparseable blob falls back to defaults rather than
        // throwing -- this is a cosmetic preference, not core data.
        loaded = DEFAULT_VISUAL_PREFERENCES;
      }
    }

    cached = loaded;
    return loaded;
  })();

  const result = await loadingPromise;
  loadingPromise = null;
  return result;
}

export async function setVisualPreferences(update: Partial<VisualPreferences>): Promise<VisualPreferences> {
  const current = await getVisualPreferences();
  const merged: VisualPreferences = {
    ...current,
    ...update,
    // Merge, don't replace -- setting one tab's style shouldn't erase every
    // other tab's own already-chosen override.
    tabBackgroundStyle: update.tabBackgroundStyle
      ? { ...current.tabBackgroundStyle, ...update.tabBackgroundStyle }
      : current.tabBackgroundStyle,
  };

  cached = merged;
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `,
    VISUAL_PREFERENCES_KEY,
    JSON.stringify(merged),
    now,
  );

  notifyListeners();
  return merged;
}

// Subscribed to by useVisualPreferences below -- every mounted consumer
// (the shared background in _layout.tsx, every tab's own GatedTabContent,
// Profile's own settings section) re-renders the instant a change is saved
// anywhere, with no app restart needed.
export function subscribeToVisualPreferences(listener: (prefs: VisualPreferences) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
