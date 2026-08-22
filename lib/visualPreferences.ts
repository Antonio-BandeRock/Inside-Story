// Visual preferences -- 2026-08-08, explicitly requested as a Profile-area
// preference: the ability to turn off the shared flowery background, to
// turn off or swap each individual tab's own background image independently
// rather than all-or-nothing, and to pick a calmer, generic alternative (a
// few color combinations) instead of the photo. Framed directly by the
// person as "for the few men who would have this app and have a problem
// with all the colors and flowers."
//
// 2026-08-17: the animated sky overlay (sun/moon/stars, day/night tint) is
// removed entirely, not just toggleable -- reported as real, confirmed
// battery drain (a continuously-running animation, on top of a separate,
// bigger, real cause found the same day: see constants/colors.ts's own
// header note on the app's whole iridescent header/footer/ring system,
// which is also removed for the identical reason). skyAnimationsEnabled is
// gone from this type as a direct result -- there's nothing left to toggle.
// genericPalette below now does double duty: the same 12 combinations that
// already stood in for the photo background now also drive the app's
// header/footer text and lines and TabHub's popup card border, statically
// (see GenericBackground.tsx's own header comment).
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

import * as SQLite from 'expo-sqlite';
import type { GroundTheme } from '../constants/colors';
import type { DigestCategoryKey } from './digest';
import { DB_NAME, getDatabase } from './db';

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

// A THIRD, real set of 38 TabHub icon choices, 2026-08-14 -- explicitly
// requested as its own distinct group, separate from both the tracked
// conditions and the 8 garden/pollinator icons above: "Make each one of
// these individual animal head busts into another choice for the TabHub
// button to be... separate the conditions from the insects and others that
// [are] not part of the conditions, and place all of these new ones into
// their own group, too." Cropped from one combined 38-animal reference
// sheet the same established way as every other icon batch in this app --
// see constants/tabHubIcons.ts's own header comment for the real
// methodology. Deliberately its own type, not folded into GardenIconChoice
// -- these are real domestic/wild mammal, bird, and reptile portraits, not
// insects/pollinators, and the user's own request explicitly names them as
// a third, separate bucket.
export type AnimalIconChoice =
  | 'lion'
  | 'tiger'
  | 'maineCoon'
  | 'siameseCat'
  | 'russianBlueCat'
  | 'ragdollCat'
  | 'orangeTabbyCat'
  | 'bengalCat'
  | 'persianCat'
  | 'sphynxCat'
  | 'grayTabbyCat'
  | 'blackCat'
  | 'goldenRetriever'
  | 'germanShepherd'
  | 'labradorRetriever'
  | 'frenchBulldog'
  | 'borderCollie'
  | 'cavalierKingCharlesSpaniel'
  | 'rhino'
  | 'elephant'
  | 'deer'
  | 'cow'
  | 'pig'
  | 'sheep'
  | 'goat'
  | 'horse'
  | 'bison'
  | 'beaver'
  | 'squirrel'
  | 'chipmunk'
  | 'rabbit'
  | 'donkey'
  | 'mallardDuck'
  | 'canadaGoose'
  | 'wolf'
  | 'bear'
  | 'badger'
  | 'iguana';

// The Food tab's own builder icons, 2026-08-14 -- starting with Dessert
// Builder (components/FoodBuilderIcons.tsx), the first hand-drawn VECTOR
// icon this whole personalization feature has ever offered rather than a
// real, cropped photo/artwork asset (see that file's own header comment
// for why no reference image exists for this one yet). Deliberately its
// own real type, not folded into GardenIconChoice/AnimalIconChoice --
// matches the same "start as a real, if currently single-member, union"
// precedent both of those established, leaving room for a future Food
// builder (Meal, Side, etc.) to get its own icon here later without
// renaming this type.
export type FoodBuilderIconChoice = 'dessertBuilder';

// The main floating TabHub button's own icon, 2026-08-09, explicitly
// requested: "make it so each icon is available in the user profile to
// choose to use in the TabHub menu icon position in place of... the
// default TabHub icon, which will also be selectable to be used." 'default'
// is the original, generic butterfly artwork (components/TabHub.tsx's own
// long-standing app icon/hub button); any real DigestCategoryKey instead
// picks that condition's own real cropped-artwork icon (see
// components/DigestConditionIcons.tsx / constants/tabHubIcons.ts) as a
// deliberate personalization; any GardenIconChoice (added 2026-08-12) picks
// one of the 8 real, non-condition garden/pollinator icons above; any
// AnimalIconChoice (added 2026-08-14) picks one of the 38 real animal-head
// portraits above; any FoodBuilderIconChoice (added 2026-08-14) picks one of
// the Food tab's own builder icons. 'seedTall' (added 2026-08-21, the app's
// own out-of-the-box default since that same day) is a single sprouting
// seed with a tall stem, chosen deliberately over re-using any one tracked
// condition's icon or the original butterfly, since the app's scope reaches
// well past the 19 conditions (food, garden, the gut/soil microbiome
// research thread) and a seed/sprout reads as "something small taking root
// and growing" for the whole app, not any one part of it. A plain, shorter-
// stemmed 'seed' choice existed briefly (2026-08-19 through 2026-08-21) and
// was removed outright, not deprecated -- direct instruction: "remove the
// other seed icon from the app entirely, make the new seed icon the
// default." The key stays 'seedTall' rather than being renamed to plain
// 'seed', deliberately: this phone's own already-saved preference reads
// 'seedTall' right now, and renaming the key would silently fall back to
// the butterfly default on this exact device until manually re-picked --
// a real, avoidable regression for a purely cosmetic identifier match.
// Only one choice at a time -- a plain scalar field, not a set. Imported
// here as a type-only import (erased at compile time, so no real runtime
// dependency on lib/digest/index.ts's own much larger content-aggregation
// module -- the same precedent already established for
// sixDimensionsReference.ts's own type-only import into lib/db.ts).
export type TabHubIconChoice = 'default' | 'seedTall' | DigestCategoryKey | GardenIconChoice | AnimalIconChoice | FoodBuilderIconChoice;

// A set of calming color combinations -- not meant to compete with the real
// wildflower/produce/etc. photography, just a quieter alternative for
// anyone who wants the background gone without going fully flat. See
// components/GenericBackground.tsx for how each renders.
//
// 2026-08-17: grown from 4 to 12, explicitly requested alongside removing
// the app's own animated iridescent header/footer/ring system -- these 12
// are now also what drives that same header/footer/ring accent, statically
// (see GenericBackground.tsx's own header comment for the full reasoning).
export type GenericPalette =
  | 'lavender'
  | 'seafoam'
  | 'sand'
  | 'dusk'
  | 'ocean'
  | 'forest'
  | 'wine'
  | 'slate'
  | 'copper'
  | 'midnight'
  | 'moss'
  | 'plum';

export const GENERIC_PALETTE_LABELS: Record<GenericPalette, string> = {
  lavender: 'Lavender dusk',
  seafoam: 'Seafoam calm',
  sand: 'Warm sand',
  dusk: 'Twilight rose',
  ocean: 'Ocean deep',
  forest: 'Forest hush',
  wine: 'Wine cellar',
  slate: 'Slate quiet',
  copper: 'Copper glow',
  midnight: 'Midnight calm',
  moss: 'Moss hollow',
  plum: 'Plum shade',
};

// 2026-08-21, direct request: "make [Home] capable of turning on and off
// whatever the user wants to from the home screen so they are able to
// dial in on what they want to have available, and not whatever we
// decide to make them have all the time." Every real, nameable content
// block on Home that isn't just page chrome (the plain greeting/date text
// stays fixed; there has to be some minimal identity left even with
// everything else off) gets its own key here. Order matches the order
// each section actually renders in on Home.
export type HomeSectionKey =
  | 'weather'
  | 'symptomCheckinReminder'
  | 'todaysCheckin'
  | 'yourDay'
  | 'statTiles'
  | 'quickActions'
  | 'howYoureFeeling'
  | 'fuelGauges'
  | 'weekTrend'
  | 'digestCards';

export const ALL_HOME_SECTION_KEYS: HomeSectionKey[] = [
  'weather',
  'symptomCheckinReminder',
  'todaysCheckin',
  'yourDay',
  'statTiles',
  'quickActions',
  'howYoureFeeling',
  'fuelGauges',
  'weekTrend',
  'digestCards',
];

// The label Profile's own toggle grid shows for each section -- kept here,
// next to the key list itself, so a future section added to Home only
// ever needs one new entry in both places, not a separate lookup built at
// the call site.
export const HOME_SECTION_LABELS: Record<HomeSectionKey, string> = {
  weather: 'Weather & Sunrise/Sunset',
  symptomCheckinReminder: 'Symptom Check-In Reminder',
  todaysCheckin: "Today's Check-In",
  yourDay: 'Your Day (Schedule)',
  statTiles: 'Meals & Worth-a-Look Tiles',
  quickActions: 'Quick Action Shortcuts',
  howYoureFeeling: "How You're Feeling",
  fuelGauges: "Today's Fuel Gauges",
  weekTrend: "This Week's Trend",
  digestCards: 'Digest Cards',
};

export type VisualPreferences = {
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
  // Which of constants/colors.ts's GROUND_THEMES is applied to the app's
  // whole neutral "ground" family (background/surface/border/textMuted/
  // etc.), added 2026-08-19 alongside Deep Navy being replaced by Deep Teal
  // as the shipped default. See applyGroundTheme's own comment there for
  // why this is the one visual preference that does NOT take effect live --
  // it's read once, at startup, before any screen mounts.
  groundTheme: GroundTheme;
  // See HomeSectionKey's own comment above. Absence of a key here means
  // "visible" (true), the same "missing means default, not off" contract
  // tabBackgroundStyle above already uses -- a future section added to
  // Home shows up for every existing user automatically, with no
  // migration step, rather than silently disappearing for everyone until
  // they individually re-enable it. Use isHomeSectionVisible() below
  // rather than reading this object directly, so that contract lives in
  // one place.
  homeSectionVisibility: Partial<Record<HomeSectionKey, boolean>>;
  // 2026-08-21, Phase 0 of the header growth vine/Timeline plan (see the
  // Notion App Development Log, same date): whether the header's own
  // growth vine renders at all. Scaffolded here ahead of the vine itself
  // (which doesn't exist yet -- see later phases), a plain on/off rather
  // than homeSectionVisibility's per-key shape, since there's only ever
  // one vine, not a list of independently-toggleable pieces. Defaults to
  // true (ON) -- unlike homeSectionVisibility's "absence means visible"
  // contract, this field is always present once DEFAULT_VISUAL_PREFERENCES
  // is spread in, so it's read directly rather than through a helper.
  growthVineEnabled: boolean;
};

// Absence of `key` in `prefs.homeSectionVisibility` means visible -- see
// that field's own comment for why. Every Home render check and Profile's
// own toggle grid both read through this one function rather than
// inlining `!== false` at each call site.
export function isHomeSectionVisible(prefs: VisualPreferences, key: HomeSectionKey): boolean {
  return prefs.homeSectionVisibility[key] !== false;
}

// homeBackgroundStyle/genericPalette changed 2026-08-19, direct request:
// "make ocean deep the default shared background for as the app would
// ship." Ocean Deep (GENERIC_PALETTE_LABELS.ocean, see GenericBackground.tsx
// for the actual gradient/blob values) replaces the wildflower photo as
// what a fresh install shows -- a deliberate pairing with groundTheme's own
// new default (Deep Teal, same day): both land in the same blue-green
// family, so the shared background and the app's own ground read as one
// coherent look out of the box rather than two unrelated choices that
// happen to coexist.
const DEFAULT_VISUAL_PREFERENCES: VisualPreferences = {
  homeBackgroundStyle: 'generic',
  tabBackgroundStyle: {},
  customBackgroundImages: {},
  genericPalette: 'ocean',
  tabHubIcon: 'seedTall',
  groundTheme: 'teal',
  homeSectionVisibility: {},
  growthVineEnabled: true,
};

const VISUAL_PREFERENCES_KEY = 'visual_preferences';

// A real, synchronous read, 2026-08-19 -- deliberately NOT going through
// getVisualPreferences()/the cache above. First shipped version of the
// ground-theme picker used that normal async path from app/_layout.tsx's
// own startup effect, and it didn't work: reported directly ("It only
// changes the color of the profile header and only after I restart the
// app"). Root cause, confirmed by that exact symptom -- expo-router's
// file-based routing requires every screen file to build its route table,
// which runs every one of their module-scope StyleSheet.create() calls
// (each baking in whatever constants/colors.ts's `colors.background` etc.
// already were) before RootLayout's own effects ever get a chance to fire.
// By the time the old async applyGroundTheme() call ran, it was already too
// late for anything but a JSX value read at render time (which is exactly
// why only the header, which reads colors.background directly rather than
// through a pre-built StyleSheet object, ever picked up the change).
//
// The only ordering that's actually early enough is inside
// constants/colors.ts's own module-top-level code, before it exports
// `colors` at all -- and since ES module evaluation is synchronous, that
// has to be a synchronous read. expo-sqlite's sync API (openDatabaseSync/
// getFirstSync, backed by JSI, not the async bridge) exists for exactly
// this "need a real persisted value before first render" case. Opening a
// second, synchronous connection to the same file getDatabase() already
// holds asynchronously is safe -- SQLite supports multiple connections to
// one file by design. The one real edge case is a brand-new install, where
// this runs before initializeDatabase() has ever created app_meta at all;
// that throws a plain "no such table" error, caught below, same fallback
// (Deep Teal) as every other not-yet-loaded case in this file.
export function getGroundThemeSync(): GroundTheme {
  let db: SQLite.SQLiteDatabase | null = null;
  try {
    db = SQLite.openDatabaseSync(DB_NAME);
    const row = db.getFirstSync<{ value: string }>(
      'SELECT value FROM app_meta WHERE key = ?',
      VISUAL_PREFERENCES_KEY,
    );
    if (row?.value) {
      const parsed = JSON.parse(row.value) as Partial<VisualPreferences>;
      if (parsed.groundTheme) return parsed.groundTheme;
    }
  } catch {
    // No app_meta table yet (first-ever launch, before initializeDatabase()
    // has run) or a corrupted blob -- fall back below, same as the async
    // path already does.
  } finally {
    // Real, reported bug, 2026-08-19: leaving this connection open caused
    // getDatabase()'s own async connection (opened moments later, same
    // file, from lib/db.ts) to fail with "Call to function
    // 'NativeDatabase.prepareAsync' has been rejected... NullPointerException"
    // the instant Profile ran its first real query -- two live connections
    // to the same file, one sync and one async, tripped up expo-sqlite's
    // native layer. This function only ever needs the one value, so close
    // immediately rather than holding the connection for the app's whole
    // lifetime.
    try {
      db?.closeSync();
    } catch {
      // Closing is real cleanup, not part of the actual result -- a close
      // failure here must never propagate and take down this function's
      // caller, since colors.ts calls this uncaught at module-load time.
    }
  }
  return DEFAULT_VISUAL_PREFERENCES.groundTheme;
}

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
          homeSectionVisibility: { ...(parsed.homeSectionVisibility ?? {}) },
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
    // Same reasoning -- toggling one Home section shouldn't erase every
    // other section's own already-chosen on/off state.
    homeSectionVisibility: update.homeSectionVisibility
      ? { ...current.homeSectionVisibility, ...update.homeSectionVisibility }
      : current.homeSectionVisibility,
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
