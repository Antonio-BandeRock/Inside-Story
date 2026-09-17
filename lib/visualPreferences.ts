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

import { File, Paths } from 'expo-file-system';
import type { GroundTheme } from '../constants/colors';
import type { DigestCategoryKey } from './digest';
import { getDatabase } from './db';
import { groupHomeSectionKeysByTab } from './homeSections';

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

// The prefix Home's per-tab group bands use for their fold state
// ("homeTab:/food"). Named here rather than typed at the call site
// because setLowStimulation below has to recognise one of them (see its
// comment) and a retyped string that drifted would fold the panel shut
// under the finger that just used it.
export const HOME_TAB_GROUP_BAND_KEY_PREFIX = 'homeTab:';

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
  | 'sharedFolderSetup'
  // The capture inbox, 2026-09-16. Belongs to no tab on purpose, so it
  // renders as a top-level row rather than inside a band: a thought
  // arriving has not been assigned to an area yet, and a band to open
  // first is a tap the two seconds cannot afford.
  | 'captureInbox'
  // The greeting card, a section like any other since 2026-09-16.
  // It was outside this system entirely until then, which is what made
  // it the one thing on Home nobody could move, fold or turn off. Named
  // 'today' rather than 'welcome': it carries the greeting, the date, an
  // affirmation and the whole sky grid (moon phase, sunrise and sunset,
  // high and low, humidity, UV, air quality, pollen), and none of that is
  // a welcome.
  | 'today'
  // 2026-09-16, direct request: "Low Stimulation needs to be available as
  // a quick access setting on the Home page... Low Stimulation needs to be
  // a switch accessible in Quick Access." Everything on Home is already a
  // quick way into another tab, so this is a section like any other rather
  // than a settings panel bolted on: the same switch Profile has, writing
  // the same function, sitting in Home's group because what it changes is
  // how the whole app looks rather than what any one tab holds.
  | 'lowStimulation'
  // Since 2026-09-12 this is the standing Symptom Check-In row, not only a
  // reminder: it is always on Home, and says "due" when it is. The key
  // keeps its old name because saved preferences already carry it.
  | 'symptomCheckinReminder'
  | 'todaysCheckin'
  // Quick-log, 2026-08-30 -- see Home's own renderLogAgain for why this sits
  // high in the default order: it exists to get a meal logged in seconds, and
  // a shortcut buried below the fold is not a shortcut. The key still reads
  // logAgain because saved preferences on real devices already use that value;
  // renaming it would silently reset the section for anyone who had moved or
  // hidden it. Only the label people actually see has changed.
  | 'logAgain'
  // The Grocery List, 2026-09-01. Sits beside the quick-log shortcut
  // because both are things done in the moment rather than read: this
  // one is opened standing in a store, and a shortcut below the fold is
  // no shortcut at all.
  | 'groceryList'
  | 'yourDay'
  // 2026-09-16, direct report after a day of dose reminders arrived and were
  // glanced at: "there is no quick access on the Home screen for reminders
  // for the day to see what they say." Your Day above is meals only (see
  // listScheduledMealsForDate), so nothing on Home carried a dose at all.
  | 'todaysReminders'
  // 2026-09-12: the two stat tiles ("Meals logged today", "Worth a look")
  // split into their own rows, each with its own tab, direct request:
  // "Separate the Meals & Worth a Look the same way."
  | 'mealsLoggedToday'
  | 'worthALook'
  // 2026-09-12, the old Quick Actions row split into its own entities,
  // direct correction: "All things on the Home Screen are supposed to be
  // Quick Actions. It makes no sense to suggest that some are Quick
  // Actions and others are not." Each is a one-row action, grouped with
  // the tab whose data it touches. "Log a meal" is gone from here rather
  // than split out, since the Log a Meal section already does that job.
  | 'scanProduct'
  | 'logFlare'
  | 'logBloodPressure'
  | 'logExercise'
  | 'howYoureFeeling'
  | 'fuelGauges'
  | 'weekTrend'
  // 2026-09-16, direct request: "make sure there is a Group for
  // Gardening on the Home screen... The same goes for Reports, as well
  // as Profile." A group only appears once something real is in it
  // (renderHomeTabGroup drops an empty one), so each of the three got a
  // card worth having rather than a heading over nothing. Profile
  // already had one: Low Stimulation, which moved there from Home.
  | 'makeReport'
  | 'gardenTasks'
  | 'logHarvest'
  | 'digestCards';

// The default order, 2026-09-12: grouped by the tab each section is a
// window into (see lib/homeSections.ts), in the same order TabHub's own
// grid runs. The one-off shared-folder nudge leads because it disappears
// for good once done. Whatever order a person saves in Profile is grouped
// the same way on the way out (getOrderedHomeSectionKeys below), so this
// default is only ever a starting point, not the one arrangement.
export const ALL_HOME_SECTION_KEYS: HomeSectionKey[] = [
  'weather',
  'sharedFolderSetup',
  // Capture leads, behind only the one-off folder nudge: it is the one
  // card whose whole value is being reachable before a thought is gone.
  'captureInbox',
  // Home. 2026-09-16, direct correction: "You removed the Home group from
  // the Home screen. It should remain at the top in order of occurance in
  // the TabHub menu." Home leads TabHub’s own grid, so it leads the
  // groups here.
  'today',
  // Profile. TabHub puts it second, immediately after Home, and so does
  // this (2026-09-16). It is not a TAB_ROUTE, so Home reads its name,
  // icon and colour from HOME_GROUP_IDENTITY in app/(tabs)/index.tsx.
  'lowStimulation',
  // Food.
  'logAgain',
  'scanProduct',
  // Schedules. mealsLoggedToday is stated here beside its tab-mates
  // rather than further down: the grouping pulled it up anyway, and a
  // default order that needs regrouping to read correctly is a trap.
  'yourDay',
  'todaysReminders',
  'mealsLoggedToday',
  // Signals.
  'symptomCheckinReminder',
  'todaysCheckin',
  'howYoureFeeling',
  'logFlare',
  'logBloodPressure',
  'logExercise',
  // Insights.
  'worthALook',
  'fuelGauges',
  // Trends.
  'weekTrend',
  // Reports.
  'makeReport',
  // Garden.
  'gardenTasks',
  'logHarvest',
  // The Digest, then Life. 2026-09-16, direct instruction: "Put them
  // into the order they exist in the TabHub menu." That retires the one
  // deliberate exception this list used to carry, which ran Life ahead of
  // The Digest so the flip cards stayed last. The menu order wins, and
  // anyone who wants the old arrangement still has Profile > Home Screen.
  'digestCards',
  'groceryList',
];

// Everything on Home that can be moved. 2026-08-23 carved the greeting
// card out of this ("except the welcome box with all of the basic daily
// info available"); 2026-09-16 put it back in as 'today', because the
// same message that asked for the Home group back also asked for that
// card to "remain at the top and become colapsable like the tab groups".
// It is a card in a group now, so it moves and folds like the rest.
//
// 'weather' stays out, and that is a different fact rather than the same
// one: it is not a card at all, it is the sky grid drawn INSIDE the Today
// card, so there is nothing to give a position to. Derived from
// ALL_HOME_SECTION_KEYS rather than a second hand-maintained list that
// could drift out of sync with it.
export const REORDERABLE_HOME_SECTION_KEYS: HomeSectionKey[] = ALL_HOME_SECTION_KEYS.filter((key) => key !== 'weather');

// The label Profile's own toggle grid shows for each section -- kept here,
// next to the key list itself, so a future section added to Home only
// ever needs one new entry in both places, not a separate lookup built at
// the call site.
export const HOME_SECTION_LABELS: Record<HomeSectionKey, string> = {
  weather: 'Weather & Sunrise/Sunset',
  sharedFolderSetup: 'Shared Folder Setup',
  captureInbox: 'Capture',
  today: 'Today',
  lowStimulation: 'Low Stimulation',
  symptomCheckinReminder: 'Symptom Check-In',
  todaysCheckin: "Today's Check-In",
  logAgain: 'Log a Meal',
  groceryList: 'Grocery List',
  yourDay: 'Your Day',
  todaysReminders: "Today's Reminders",
  mealsLoggedToday: 'Meals Logged Today',
  worthALook: 'Worth a Look',
  scanProduct: 'Scan a Product',
  logFlare: 'Log a Flare',
  logBloodPressure: 'Log Blood Pressure',
  logExercise: 'Log Exercise',
  howYoureFeeling: "How You're Feeling",
  fuelGauges: "Today's Fuel Gauges",
  weekTrend: "This Week's Trend",
  makeReport: 'Make a Report',
  gardenTasks: 'Garden Tasks',
  logHarvest: 'Log a Harvest',
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
  // Whether each GROUP on Home is shown at all, 1.0.39.16, direct
  // request: a group turned off from Home itself rather than from
  // Profile. Keyed by the group id lib/homeSections.ts hands out (a tab
  // path, or a solo card's key behind a "solo:" prefix), and following
  // the same "absence means visible" contract as homeSectionVisibility
  // just above, for the same reason: a tab that gains a Home card later
  // appears for everyone rather than starting off.
  //
  // A separate field rather than turning every member off, because those
  // are two different statements. Turning off Signals says "not on my
  // Home screen"; turning off Log a Flare says "not that one card". If a
  // group switch wrote through to its members, turning the group back on
  // would have to guess which cards were off for their own reasons, and
  // it would guess wrong. Read through isHomeGroupVisible below.
  homeGroupVisibility: Partial<Record<string, boolean>>;
  // 2026-08-21, Phase 0 of the header growth vine/Timeline plan (see the
  // Notion App Development Log, same date): whether the header's own
  // growth vine renders at all. A plain on/off rather than
  // homeSectionVisibility's per-key shape, since there was only ever one
  // vine, not a list of independently-toggleable pieces. Defaults to true
  // (ON) -- unlike homeSectionVisibility's "absence means visible"
  // contract, this field is always present once DEFAULT_VISUAL_PREFERENCES
  // is spread in, so it's read directly rather than through a helper.
  //
  // Nothing reads it as of 1.0.39.14: the marks left the header and their
  // Profile control went with them. The key is deliberately kept rather
  // than dropped, because the recognition it governed is coming back as
  // milestones and occasional short animations in Profile, and anybody who
  // already turned this off should not have that choice quietly forgotten
  // when it does. Dropping it would also make every stored preference blob
  // carry a field the type no longer admits.
  growthVineEnabled: boolean;
  // 2026-08-23: which order Home's own reorderable sections render top to
  // bottom (see REORDERABLE_HOME_SECTION_KEYS' own comment above for
  // which ones that covers). Partial, not a full, always-present array,
  // deliberately matching homeSectionVisibility's own "absence means
  // default" contract just above -- an empty/missing array means "use
  // REORDERABLE_HOME_SECTION_KEYS' own built-in order," so a future
  // section added to Home lands in its own designed position for every
  // existing user automatically, the same "no migration step" guarantee
  // homeSectionVisibility already gives, rather than needing every saved
  // order backfilled by hand. Use getOrderedHomeSectionKeys() below rather
  // than reading this field directly, the same discipline
  // isHomeSectionVisible() already establishes for its own sibling field.
  homeSectionOrder: HomeSectionKey[];
  // 2026-09-12, direct request: every Home section collapses "to one row
  // height with just the name of what it is... and then when they click
  // on it it expands." Which ones are open right now. Absence means
  // collapsed (the resting state the request describes), the reverse of
  // homeSectionVisibility's own "absence means visible", and deliberately
  // so: a section added later starts folded like everything else rather
  // than springing open. Read through isHomeSectionExpanded below.
  homeSectionExpanded: Partial<Record<HomeSectionKey, boolean>>;
  // 2026-09-13, the same fold for every band outside Home (Schedules first:
  // "Everything folds"). Keyed by a string each screen chooses
  // ("schedule:meals:day"), absence meaning folded, exactly the contract
  // homeSectionExpanded sets. Read and written through
  // hooks/useBandFolds.ts rather than directly.
  bandExpanded: Record<string, boolean>;
  // 2026-09-03, reported through a first-time reader of the app: the TabHub
  // button is the way to reach all nine tabs and nothing on screen says so.
  // It carries no circle, fill, border or label at rest, deliberately (see
  // components/TabHub.tsx), so to someone who has never used the app it reads
  // as artwork sitting at the bottom of the screen rather than as the control
  // everything else is behind.
  //
  // Two flags rather than one, because they answer two different questions and
  // the second outlives the first. The welcome overlay is shown once ever; the
  // pointer above the button then stays until the button has actually been
  // used, so someone who dismissed the overlay without reading it is not left
  // with nothing.
  //
  // Both default to false, which means a device upgrading into this version
  // sees the welcome once even though its owner already knows the app. That is
  // deliberate rather than a gap: there is no way to tell a fresh install from
  // an existing one here, the same limit constants/releaseNotes.ts already
  // documents for last_seen_app_version, and one dismissible overlay is the
  // harmless side of that trade.
  // 2026-09-16: one switch that makes the whole app quieter, rather than
  // asking someone to find the six settings that add up to the same thing.
  // Everything it does is an override read at the point of use, never a
  // bulk write over what the person chose: turning it off puts every
  // background, every palette and every icon back exactly as they were,
  // because none of them were touched. Read through
  // resolveBackgroundStyle, isMotionReduced and modalAnimationType below
  // rather than testing this field directly, so the list of what it
  // covers stays in one place.
  //
  // The one thing it does write is the fold state, and only at the moment
  // it is switched on (setLowStimulation): whatever was left open on Home
  // and in every band folds shut, since an override there would lock the
  // screen closed and leave no way to read anything.
  lowStimulation: boolean;
  hasSeenTabHubWelcome: boolean;
  // Set the first time the TabHub button is actually tapped. Tapping is the
  // only thing that clears the pointer: dismissing the welcome does not, since
  // reading about a button is not the same as knowing where it is.
  hasUsedTabHub: boolean;
};

// Which background a given scope actually draws, once low stimulation has
// had its say. `routeKey` is a real TAB_ROUTES path for an individual tab
// and undefined for the shared resting layer, matching what
// ScreenBackground.tsx passes. Low stimulation answers 'off' for every
// scope: a photograph behind text is the single loudest thing on screen,
// and 'off' leaves the same flat ground color the header and footer
// already use rather than swapping one image for another.
export function resolveBackgroundStyle(prefs: VisualPreferences, routeKey?: string): BackgroundStyle {
  if (prefs.lowStimulation) return 'off';
  return routeKey ? (prefs.tabBackgroundStyle[routeKey] ?? 'photo') : prefs.homeBackgroundStyle;
}

// Whether motion that exists for polish rather than for meaning should be
// skipped: the greeting's zoom, a card's flip, the growth marks arriving,
// a modal fading in, a swiped tab flying off the edge. Dragging still
// follows the finger, and nothing that carries information is removed;
// what goes is the part that moves on its own after the finger has left.
// Its own function rather than a bare field read, so a separate
// reduce-motion switch can be split out later without touching every call
// site.
export function isMotionReduced(prefs: VisualPreferences): boolean {
  return prefs.lowStimulation;
}

// The animationType for a Modal. Read synchronously from the module cache
// rather than through the hook, the same way getGroundThemeSync already
// reads its own value, because a Modal mounts fresh every time it opens:
// by the time one is on screen the cache is current, and a preference
// changed while a modal is open should not restyle the modal underneath
// the person's hand anyway.
export function modalAnimationType(preferred: 'fade' | 'slide'): 'fade' | 'slide' | 'none' {
  return isMotionReduced(getCachedVisualPreferences()) ? 'none' : preferred;
}

// Absence of `key` in `prefs.homeSectionVisibility` means visible -- see
// that field's own comment for why. Every Home render check and Profile's
// own toggle grid both read through this one function rather than
// inlining `!== false` at each call site.
export function isHomeSectionVisible(prefs: VisualPreferences, key: HomeSectionKey): boolean {
  return prefs.homeSectionVisibility[key] !== false;
}

// The same contract for a whole group. See homeGroupVisibility above for
// why a group carries its own switch rather than writing through to the
// cards inside it. The ?? guards a preference blob saved before 1.0.39.16,
// which has no such field at all.
export function isHomeGroupVisible(prefs: VisualPreferences, groupId: string): boolean {
  return (prefs.homeGroupVisibility ?? {})[groupId] !== false;
}

// See homeSectionOrder's own comment above for the "absence means
// default" contract this follows. Reconciles a saved order against
// REORDERABLE_HOME_SECTION_KEYS' own current, real list rather than
// trusting it blindly: any key missing from the saved order (a section
// added to Home after that order was last saved) is appended in its own
// designed position, and any key in the saved order that no longer
// exists (a section since removed) is silently dropped, so a stale saved
// order can never hide a real section or crash on one that no longer is.
//
// 2026-09-12: the reconciled order is then regrouped so sections from the
// same tab sit together (see groupHomeSectionKeysByTab for how a saved
// order survives that). Done here rather than on Home alone so Profile's
// own Order list shows the same sequence Home renders.
export function getOrderedHomeSectionKeys(prefs: VisualPreferences): HomeSectionKey[] {
  const saved = prefs.homeSectionOrder ?? [];
  const known = new Set(REORDERABLE_HOME_SECTION_KEYS);
  const ordered = saved.filter((key) => known.has(key));
  // A key the saved order has never heard of goes where it was designed
  // to go, immediately after whichever designed neighbour above it the
  // person still has, rather than on the end. Until 2026-09-16 these were
  // concatenated last, which this comment block already claimed they were
  // not. It cost nothing while every new section happened to belong at the
  // bottom, and it broke the moment one didn't: the Today card is designed
  // to lead the page and would have landed under the flip cards for anyone
  // who had ever touched the order.
  for (const key of REORDERABLE_HOME_SECTION_KEYS) {
    if (ordered.includes(key)) continue;
    let insertAt = 0;
    for (let i = REORDERABLE_HOME_SECTION_KEYS.indexOf(key) - 1; i >= 0; i -= 1) {
      const above = ordered.indexOf(REORDERABLE_HOME_SECTION_KEYS[i]);
      if (above >= 0) {
        insertAt = above + 1;
        break;
      }
    }
    ordered.splice(insertAt, 0, key);
  }
  return groupHomeSectionKeysByTab(ordered);
}

// A band is folded until someone opens it. Two are not, 1.0.39.10:
// "I think the Welcome card should be just available at the top without
// the current 30 second wait." Available means in front of you when you
// arrive, so the Today card and the Home group holding it are open until
// somebody closes them, and stay closed after that. Everything else on
// the page keeps the resting-folded rule.
//
// Stated as a default rather than seeded into the stored preferences,
// because a seed only reaches a fresh install: anybody already using the
// app has a saved object that would come back without it, and would find
// the greeting folded away behind two taps.
export const BANDS_OPEN_UNTIL_CLOSED: ReadonlySet<string> = new Set([
  'today',
  `${HOME_TAB_GROUP_BAND_KEY_PREFIX}/`,
]);

// Absence of `key` means folded, except for the two above -- see
// homeSectionExpanded's own comment for why this is the reverse of
// visibility. Shared with hooks/useBandFolds.ts so a band and the control
// that toggles it can never disagree about where it started.
export function isBandOpen(expanded: Record<string, boolean | undefined> | undefined, key: string): boolean {
  return expanded?.[key] ?? BANDS_OPEN_UNTIL_CLOSED.has(key);
}

export function isHomeSectionExpanded(prefs: VisualPreferences, key: HomeSectionKey): boolean {
  return isBandOpen(prefs.homeSectionExpanded, key);
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
  homeGroupVisibility: {},
  growthVineEnabled: true,
  homeSectionOrder: [],
  homeSectionExpanded: {},
  bandExpanded: {},
  lowStimulation: false,
  hasSeenTabHubWelcome: false,
  hasUsedTabHub: false,
};

const VISUAL_PREFERENCES_KEY = 'visual_preferences';

// A synchronous read, 2026-08-19 -- deliberately NOT going through
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
// has to be a synchronous read.
//
// 2026-08-27, rebuilt from scratch, not patched a third time: the
// original version of this function opened a second, synchronous SQLite
// connection to the same file getDatabase() already holds asynchronously
// (assumed safe -- "SQLite supports multiple connections to one file by
// design"), and that assumption turned out wrong in practice, twice.
// 2026-08-19's own version left the sync connection open, which broke
// getDatabase()'s own async open moments later ("NativeDatabase.
// prepareAsync... NullPointerException"); fixed by closing the sync
// connection immediately. 2026-08-27 morning, closing immediately turned
// out to only narrow the same race, not close it -- a slow reference-db
// reimport shifted timing enough to reopen it, this time surfacing as
// "NativeStatement.finalizeAsync... Cannot use shared object that was
// already released," an unhandled promise rejection from deep inside
// expo-sqlite's own native bridge, with no app code anywhere in its own
// call stack to retry from. Direct follow-up the same day, right after
// that first patch shipped: the exact same symptom, still happening.
// Two SQLite connections (sync and async) to the same file evidently
// share more native state under the hood than expo-sqlite's own public
// API promises -- not something fixable from this app's JS layer by
// reordering opens and closes a third time.
//
// The real fix: stop opening a second SQLite connection here at all.
// groundTheme is mirrored into a small plain text file (writeGround
// ThemeMirror, called from both getVisualPreferences()'s own load and
// setVisualPreferences()'s own save below) every time it's genuinely
// known, and this function reads that file instead -- expo-file-system's
// own synchronous File.textSync() touches no SQLite state at all, so
// there is no second connection left to race against getDatabase()'s.
// The one real, accepted tradeoff: a device upgrading INTO this fix, or
// a fresh install before the mirror file has ever been written, reads
// this file before it exists and falls back to the same Deep Teal
// default every other not-yet-loaded case in this file already uses --
// a single launch showing the default ground color rather than the
// person's own already-saved one, self-correcting the moment
// getVisualPreferences() runs its own real load a few moments later and
// writes the mirror for every launch after. A real, visible, but minor
// and temporary cost, not a repeat of the native crash this replaces.
export function getGroundThemeSync(): GroundTheme {
  try {
    const file = groundThemeMirrorFile();
    if (file.exists) {
      const value = file.textSync().trim();
      if (isGroundTheme(value)) return value;
    }
  } catch {
    // A missing/unreadable/corrupted mirror file falls back below, same
    // as every other not-yet-loaded case in this file.
  }
  return DEFAULT_VISUAL_PREFERENCES.groundTheme;
}

// The 5 real GroundTheme keys, duplicated by hand from constants/
// colors.ts's own literal union rather than imported as a value -- that
// file imports getGroundThemeSync FROM this one (its own module-top-level
// `GROUND_THEMES[getGroundThemeSync()]` call), so importing GROUND_THEMES
// back here would be a real circular value dependency, not just a type
// one (the existing `import type { GroundTheme }` above is already
// erased at compile time and carries no such risk). Flagged directly
// rather than silently duplicated: keep this list in sync by hand if a
// new ground theme is ever added.
const GROUND_THEME_KEYS: readonly GroundTheme[] = ['navy', 'teal', 'purple', 'charcoal', 'burgundy'];
function isGroundTheme(value: string): value is GroundTheme {
  return (GROUND_THEME_KEYS as readonly string[]).includes(value);
}

const GROUND_THEME_MIRROR_FILE_NAME = 'ground_theme_mirror.txt';
function groundThemeMirrorFile(): File {
  return new File(Paths.document, GROUND_THEME_MIRROR_FILE_NAME);
}

// Best-effort only, called from both getVisualPreferences()'s own load
// and setVisualPreferences()'s own save below -- a failure to write this
// mirror must never take down either of those, since the mirror is a
// synchronous-read convenience for getGroundThemeSync() above, not the
// real, authoritative value (app_meta's own groundTheme, read/written
// normally through getDatabase(), stays that).
function writeGroundThemeMirror(theme: GroundTheme) {
  try {
    groundThemeMirrorFile().write(theme);
  } catch {
    // Next cold launch's getGroundThemeSync() just falls back to the
    // default again -- no different from the mirror file never having
    // existed yet.
  }
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
          homeGroupVisibility: { ...(parsed.homeGroupVisibility ?? {}) },
          homeSectionExpanded: { ...(parsed.homeSectionExpanded ?? {}) },
          bandExpanded: { ...(parsed.bandExpanded ?? {}) },
        };
      } catch {
        // A corrupted/unparseable blob falls back to defaults rather than
        // throwing -- this is a cosmetic preference, not core data.
        loaded = DEFAULT_VISUAL_PREFERENCES;
      }
    }

    cached = loaded;
    // 2026-08-27 -- see getGroundThemeSync's own header comment. Keeps
    // the sync-read mirror file current every time real preferences are
    // actually loaded, not just when they're changed, so a device that
    // already had a groundTheme saved before this mirror existed picks
    // it up the first time this async load runs, not just from then on.
    writeGroundThemeMirror(loaded.groundTheme);
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
    // Same again, one level up: turning off one group should not clear
    // what somebody decided about the other ten.
    homeGroupVisibility: update.homeGroupVisibility
      ? { ...current.homeGroupVisibility, ...update.homeGroupVisibility }
      : current.homeGroupVisibility,
    // Same again -- opening one Home section shouldn't fold every other
    // one the person had left open.
    homeSectionExpanded: update.homeSectionExpanded
      ? { ...current.homeSectionExpanded, ...update.homeSectionExpanded }
      : current.homeSectionExpanded,
    bandExpanded: update.bandExpanded ? { ...current.bandExpanded, ...update.bandExpanded } : current.bandExpanded,
  };

  cached = merged;
  // 2026-08-27 -- see getGroundThemeSync's own header comment.
  writeGroundThemeMirror(merged.groundTheme);
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

// Turning low stimulation on or off. A plain setVisualPreferences call
// would do for the flag itself; this exists for the fold, which cannot be
// an override without locking every section shut.
//
// Switching on folds whatever was open, on Home and in every band on every
// other screen. That has to be written key by key with an explicit false,
// because setVisualPreferences merges both of those maps rather than
// replacing them (see its own comment), so passing an empty object would
// leave every open section exactly as it was. Switching off leaves the
// folds alone: reopening what a person chose to fold is their call, and
// guessing at it would mean storing a second copy of a state they can
// change with one tap.
//
// Two things are exempt, 2026-09-16, because the switch now lives on Home
// as well: its section and the group holding it. Folding shut the panel
// someone is looking at, at the moment they use it, hides the way back
// off. Every other section and every other group still folds.
//
// That group is Profile's, not Home's, since 1.0.39.7: the switch is a
// Profile setting surfaced on Home, so it sits under Profile. Home has a
// group again as of 1.0.39.10, holding the Today card, and that one folds
// like the rest.
export async function setLowStimulation(enabled: boolean): Promise<VisualPreferences> {
  const current = await getVisualPreferences();
  if (!enabled) return setVisualPreferences({ lowStimulation: false });

  const switchGroupBandKey = `${HOME_TAB_GROUP_BAND_KEY_PREFIX}/profile`;
  const homeSectionExpanded: Partial<Record<HomeSectionKey, boolean>> = {};
  for (const key of Object.keys(current.homeSectionExpanded) as HomeSectionKey[]) {
    if (key === 'lowStimulation') continue;
    if (current.homeSectionExpanded[key]) homeSectionExpanded[key] = false;
  }
  const bandExpanded: Record<string, boolean> = {};
  for (const key of Object.keys(current.bandExpanded ?? {})) {
    if (key === switchGroupBandKey) continue;
    if (current.bandExpanded[key]) bandExpanded[key] = false;
  }
  // The two that are open without being recorded as open (see
  // BANDS_OPEN_UNTIL_CLOSED) have to be written shut rather than skipped:
  // the loops above only see keys somebody has already toggled, so
  // leaving these absent would leave the Today card open with the switch
  // on, which is the one thing it is for.
  for (const key of BANDS_OPEN_UNTIL_CLOSED) {
    if (key === switchGroupBandKey) continue;
    if (key.startsWith(HOME_TAB_GROUP_BAND_KEY_PREFIX)) bandExpanded[key] = false;
    else homeSectionExpanded[key as HomeSectionKey] = false;
  }

  return setVisualPreferences({ lowStimulation: true, homeSectionExpanded, bandExpanded });
}

// Subscribed to by useVisualPreferences below -- every mounted consumer
// (the shared background in _layout.tsx, every tab's own GatedTabContent,
// Profile's own settings section) re-renders the instant a change is saved
// anywhere, with no app restart needed.
export function subscribeToVisualPreferences(listener: (prefs: VisualPreferences) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
