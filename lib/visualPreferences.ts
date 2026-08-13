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

import type { DigestCategoryKey } from './digest';
import { getDatabase } from './db';

// 2026-08-09: gained 'custom' -- a real, user-uploaded image, added
// explicitly alongside the existing three. See customBackgroundImages
// below for where the actual picked image's own URI lives; this value on
// its own only says "use whatever's stored there for this scope."
export type BackgroundStyle = 'photo' | 'generic' | 'off' | 'custom';

// The key customBackgroundImages/tabBackgroundStyle use for the shared/
// resting layer (as opposed to a real TAB_ROUTES path for an individual
// tab) -- exported so Profile's own picker and ScreenBackground.tsx's own
// reader agree on the exact same string rather than each hardcoding it
// separately.
export const SHARED_BACKGROUND_SCOPE_KEY = 'shared';

// A second, real set of 8 TabHub icon choices, 2026-08-12 -- explicitly
// requested alongside the condition icons: "Create new TabHub menu icons
// from these 8 new images... available to be selected to be the TabHub
// icon." Genuinely different in kind from every DigestCategoryKey choice
// below -- these 8 (honeybee, bumblebee, dragonfly, hummingbird, tree
// frog, monarch butterfly, ladybug, praying mantis) aren't tied to any
// tracked condition at all, real garden/pollinator wildlife instead,
// thematically matching this app's own Garden tab and Earth Matters
// pollinator research even though this feature itself (picking the main
// button's own icon) has nothing to do with either. Cropped from one
// combined reference sheet the same established way as the 19 condition
// icons -- see constants/tabHubIcons.ts's own header comment for the real
// methodology.
export type GardenIconChoice =
  | 'honeybee'
  | 'bumblebee'
  | 'dragonfly'
  | 'hummingbird'
  | 'treeFrog'
  | 'monarchButterfly'
  | 'ladybug'
  | 'prayingMantis';

// The main floating TabHub button's own icon, 2026-08-09, explicitly
// requested: "make it so each icon is available in the user profile to
// choose to use in the TabHub menu icon position in place of... the
// default TabHub icon, which will also be selectable to be used." 'default'
// is the original, generic butterfly artwork (components/TabHub.tsx's own
// long-standing app icon/hub button); any real DigestCategoryKey instead
// picks that condition's own real cropped-artwork icon (see
// components/DigestConditionIcons.tsx / constants/tabHubIcons.ts) as a
// deliberate personalization; any GardenIconChoice (added 2026-08-12) picks
// one of the 8 real, non-condition garden/pollinator icons above. Only one
// choice at a time -- a plain scalar field, not a set. Imported here as a
// type-only import (erased at compile time, so no real runtime dependency
// on lib/digest/index.ts's own much larger content-aggregation module --
// the same precedent already established for sixDimensionsReference.ts's
// own type-only import into lib/db.ts).
export type TabHubIconChoice = 'default' | DigestCategoryKey | GardenIconChoice;

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
  // 2026-08-09: the real, persistent local file URI for each scope's own
  // uploaded custom image (see lib/customBackgroundImage.ts, which does
  // the actual picking/validating/saving) -- keyed the same way as
  // tabBackgroundStyle above, using SHARED_BACKGROUND_SCOPE_KEY for the
  // shared/resting layer and a real TAB_ROUTES path for an individual tab.
  // Kept even if a scope's own style is later switched away from
  // 'custom' (to Photo/Generic/Off), so switching back to Custom doesn't
  // require re-picking an image -- only removing it explicitly (Profile's
  // own "Remove image" action) actually deletes both the reference here
  // and the real file on disk.
  customBackgroundImages: Partial<Record<string, string>>;
  // One shared palette choice, used wherever a 'generic' style is currently
  // selected (the shared layer and/or any individual tab) -- a single pick
  // rather than a separate palette per tab, since the point is one calm,
  // consistent alternative look, not eight independent color schemes.
  genericPalette: GenericPalette;
  // See TabHubIconChoice's own comment above. Defaulted to 'default' (the
  // plain butterfly) from 2026-08-09 through 2026-08-14; direct request the
  // same day the 8 garden icons shipped: "Make the Default TabHub icon be
  // the Honeybee, and rename the Default to Graves' / Hashimoto's and put
  // it within the condition icons in alphabetical order." Now defaults to
  // 'honeybee' -- a first-ever launch (nothing chosen yet) shows the
  // Honeybee, not the butterfly. The 'default' key itself still exists and
  // still points at the same real butterfly artwork (see
  // TAB_HUB_ICON_SOURCES.default in constants/tabHubIcons.ts) -- it's no
  // longer the app's own out-of-the-box choice, just a real, explicitly
  // labeled "Graves' / Hashimoto's" option a person can pick from Profile
  // like any other, sorted alphabetically among the condition icons rather
  // than always leading the list.
  tabHubIcon: TabHubIconChoice;
};

const DEFAULT_VISUAL_PREFERENCES: VisualPreferences = {
  skyAnimationsEnabled: true,
  homeBackgroundStyle: 'photo',
  tabBackgroundStyle: {},
  customBackgroundImages: {},
  genericPalette: 'lavender',
  tabHubIcon: 'honeybee',
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
          customBackgroundImages: { ...(parsed.customBackgroundImages ?? {}) },
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
    // Same reasoning -- saving/removing one scope's own custom image
    // shouldn't erase another scope's already-uploaded one.
    customBackgroundImages: update.customBackgroundImages
      ? { ...current.customBackgroundImages, ...update.customBackgroundImages }
      : current.customBackgroundImages,
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
