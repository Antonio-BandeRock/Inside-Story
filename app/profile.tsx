import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppTextInput } from '../components/AppTextInput';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { GenericBackground } from '../components/GenericBackground';
import { HelpButton, type HelpSection } from '../components/HelpButton';
import { IridescentRingCircle } from '../components/IridescentRingCircle';
import { PopoverSelect } from '../components/PopoverSelect';
import { usePasswordPrompt } from '../components/PasswordPrompt';
import { useBusyOverlay } from '../components/BusyOverlay';
import { useConfirmSheet } from '../components/ConfirmSheet';
import { useInfoAlert } from '../components/InfoAlert';
import { colors, GROUND_THEME_LABELS, GROUND_THEMES, type GroundTheme } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE, useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { TAB_HUB_ICON_SOURCES } from '../constants/tabHubIcons';
import { TAB_ROUTES } from '../constants/tabs';
import { typography } from '../constants/typography';
import { useGeneralHealthPreferences } from '../hooks/useGeneralHealthPreferences';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { CONDITION_CODE_TO_DIGEST_KEY } from '../lib/conditionCodeMap';
import { CONDITION_STAGING_MODELS } from '../lib/conditionStages';
import { decryptBackupPayload, isEncryptedBackupWire } from '../lib/backupEncryption';
import {
  exportBackupToFile,
  listLocalBackupFiles,
  parseBackupEnvelope,
  pickAndReadBackupFile,
  readBackupFileContent,
  restoreFromBackupEnvelope,
  type BackupEnvelope,
  type LocalBackupFile,
} from '../lib/dataBackup';
import { clearSeededTestData, seedTest90Days } from '../lib/devSeed';
import { shareFileIfAvailable } from '../lib/nativeSharing';
import { ACTIVITY_LEVEL_INFO, ACTIVITY_LEVELS, type ActivityLevel } from '../lib/energyNeeds';
import { GENERAL_HEALTH_RULES } from '../lib/generalHealthRules';
import { setTopicMuted } from '../lib/generalHealthPreferences';
import { USDA_ZONES } from '../lib/gardenZones';
import {
  CUSTOM_BACKGROUND_MAX_DIMENSION,
  CUSTOM_BACKGROUND_MAX_FILE_SIZE_BYTES,
  CUSTOM_BACKGROUND_MIN_DIMENSION,
  deleteCustomBackgroundImage,
  pickAndSaveCustomBackgroundImage,
} from '../lib/customBackgroundImage';
import {
  addFoodAllergy,
  type ConditionReference,
  DietarySex,
  type FoodTrialRecord,
  getConditionStages,
  getCuriousAboutConditions,
  getFoodTrialsForCondition,
  getStoredMeasurementSystem,
  getUserConditions,
  getUserProfile,
  listAllConditions,
  listBodyMeasurements,
  listFoodAllergies,
  listSymptomAssessments,
  markConcernAlreadyTested,
  recordBodyMeasurement,
  removeFoodAllergy,
  reopenFoodTrial,
  setConditionStage,
  setCuriousAboutConditionSelected,
  setStoredMeasurementSystem,
  setUserConditionSelected,
  setUserProfile,
  SymptomAssessmentRecord,
  UserProfile,
} from '../lib/db';
import { getConditionFoodConcerns, type ConditionFoodConcern } from '../lib/conditionFoodConcerns';
import { ageFromBirthDate } from '../lib/profile';
import {
  cmToFeetInches,
  detectMeasurementSystemFromLocale,
  feetInchesToCm,
  kgToLb,
  lbToKg,
  MeasurementSystem,
} from '../lib/measurement';
import { buildTime24, formatTime12, splitTime24, type TimeOfDayInput } from '../lib/timeOfDay';
import {
  ALL_HOME_SECTION_KEYS,
  GENERIC_PALETTE_LABELS,
  getOrderedHomeSectionKeys,
  HOME_SECTION_LABELS,
  isHomeSectionVisible,
  setVisualPreferences,
  SHARED_BACKGROUND_SCOPE_KEY,
  type BackgroundStyle,
  type GenericPalette,
  type HomeSectionKey,
  type TabHubIconChoice,
} from '../lib/visualPreferences';

// Every tab that gets its own revealed background image (see
// GatedTabContent.tsx). Home is deliberately excluded, since it has no
// background to individually toggle; it always shows the shared resting
// layer (see the "Shared background" card below), never a GatedTabContent
// reveal.
const BACKGROUND_TAB_ROUTES = TAB_ROUTES.filter((route) => route.path !== '/');

const BACKGROUND_STYLE_OPTIONS: { value: BackgroundStyle; label: string }[] = [
  { value: 'photo', label: 'Photo' },
  { value: 'generic', label: 'Generic' },
  { value: 'off', label: 'Off' },
];

// 2026-08-17: was a hand-typed 4-entry list (the original lavender/seafoam/
// sand/dusk set), left behind unchanged when GenericPalette itself grew to
// 12 combinations the same day. The picker below maps over this array, not
// the full palette object, so the other 8 were silently unreachable
// despite existing everywhere else. Derived from GENERIC_PALETTE_LABELS's
// keys instead of a second hand-typed list, so a future palette addition
// or removal can't silently drift out of sync with this picker again.
const GENERIC_PALETTE_OPTIONS = Object.keys(GENERIC_PALETTE_LABELS) as GenericPalette[];

// Same "derive from the labels object's keys" precedent as
// GENERIC_PALETTE_OPTIONS just above, same reasoning: a future ground theme
// added to constants/colors.ts's GROUND_THEMES shows up here automatically.
const GROUND_THEME_OPTIONS = Object.keys(GROUND_THEME_LABELS) as GroundTheme[];

// Which of GroundFamily's 6 fields actually render as swatches, 2026-08-19,
// direct request: choosing a color needs to actually show the color, the
// same reasoning the TabHub Icon picker's grid already established (see
// iconGridRow's comment). `surface`/`surfaceMuted` are left out on purpose:
// both are translucent rgba strings meant to sit blended over `background`,
// not flat colors of their own, so a bare isolated swatch of either would
// just read as a washed-out, slightly confusing near-duplicate of the
// background swatch rather than showing anything about the theme. The 4
// kept here are the ones with a distinct flat hex value.
const GROUND_THEME_SWATCH_KEYS = ['background', 'border', 'textMuted', 'keySurface'] as const;

// 2026-08-16, direct request: every information page should say plainly
// what the tool is here to do for you, why you'd use it, not just how the
// controls work. Profile had never had any info affordance at all, unlike
// every one of the 9 main tabs: it's reached via TabHub's "Profile" corner
// tile, a Stack push outside the Tabs navigator entirely, so TabHub's
// floating button (and its "info about whatever's open" tile) never mounts
// here at all, regardless of whether help content is registered for it
// (see components/CurrentPageHelp.tsx's comment on how that mechanism
// works). A standalone HelpButton, same as the one added to MealBuilder for
// the identical reason, is the fix.
const PROFILE_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this page is for',
    body: "So the rest of the app can actually be personal, not one-size-fits-all. What's set here (your conditions, sex, birth date, weight, activity level, food allergies, healing/management stage) shapes numbers elsewhere: which nutrient targets and 6 Dimensions scoring apply to you, which foods get flagged, and what a doctor report actually says about you.",
  },
  {
    heading: 'Nothing here is required',
    body: "Every field is optional. Leave something unset and you'll see recommendations for the general population instead of one tailored to you, never a guess made on your behalf.",
  },
  {
    heading: 'Appearance, sharing, and backup live here too',
    body: "The TabHub icon, backgrounds, and generic palette are purely visual, change them for no reason other than liking it better. Connections is for signed sharing between your own paired devices or other people with this app. Backup & Restore is your own safety net: everything you've entered lives only on this device, so an export (password-protected) is the only way to move it to a new phone or recover it if this one is lost.",
  },
];

// TabHub Icon picker's selected/unselected pill footprint. Matches
// LensHub.tsx's GRID_ITEM_PILL_SIZE and TabHub.tsx's ICON_PILL_SIZE
// convention (an icon-grid selection pill), sized a bit larger since this
// card has open room to work with, unlike either of those two tight in-app
// grids.
const ICON_GRID_PILL_SIZE = 52;

// One key per collapsible card section on this screen. See
// collapsedSections/renderCardHeader's comment above for the full feature.
// Order here doesn't matter (it's a Set, not a display order).
//
// 2026-08-09, regrouped from 12 individually-collapsible cards down to 4,
// explicitly requested: "Group Your name, units, sex, birth date, height,
// and weight. Group Your conditions and where you're at together...
// group the TabHub icon, shared background, and individual tab
// backgrounds in one section. Group Usual meal times and fasting/eating
// windows." Every former section's label is kept as a plain `subLabel`
// heading within its new group's body (the same in-body sub-heading
// convention Fasting's "Eating window starts"/"Eating window ends" already
// used before this regrouping), not a second layer of
// independently-collapsible sub-cards. Tapping one of these 4 headers is
// meant to reveal everything inside it at once.
//
// 2026-08-14, a later, narrower exception, since generalized to the whole
// 'appearance' card (see AppearanceSubsectionKey's comment below for the
// fuller, current story). Originally just the TabHub Icon picker's 3
// groups (TabHubIconGroupKey below): "Is there a way to collapse each of
// the sections of TabHub Icons inside of the already collapsable section
// they are a part of?" A deliberate carve-out from the "no nested
// sub-cards" rule stated above, not a reversal of it. 'developer' added
// 2026-08-14, a 6th card, always in this list (harmless to include even in
// a production build, since nothing renders it there: see the actual JSX
// below, gated on the __DEV__ global directly, not on this key's presence
// here).
const ALL_CARD_SECTION_KEYS = [
  'personal-info',
  'conditions',
  'general-health',
  'home-screen',
  'header-growth',
  'appearance',
  'meal-schedule',
  'connections',
  'backup',
  'developer',
] as const;
type CardSectionKey = (typeof ALL_CARD_SECTION_KEYS)[number];

// See ALL_CARD_SECTION_KEYS's comment above for why this one area gets its
// own, second, independent collapse layer. Deliberately its own separate
// key space/state (collapsedIconGroups below), not folded into
// CardSectionKey/collapsedSections: these 3 groups only ever exist nested
// inside the 'appearance' card's "TabHub Icon" sub-section (see
// AppearanceSubsectionKey right below), never as a top-level card of their
// own. A third level of nesting: card, sub-section, group. 'tabHubFoodBuilders'
// added 2026-08-14, same day: Dessert Builder's new icon
// (components/FoodBuilderIcons.tsx) is neither a tracked condition, an
// insect/pollinator, nor an animal, so it gets its own 4th group rather
// than being folded into any of the existing three for a fit that isn't
// quite honest.
//
// 'tabHubAppIcon' added 2026-08-19: the app's new default icon (the seed,
// see TabHubIconChoice's comment in lib/visualPreferences.ts) isn't a
// condition, an insect/wildlife icon, an animal, or a Food builder icon
// either. It's the app's identity mark. Given its own standalone 5th
// group, deliberately placed first in the render order below (see the JSX
// further down), since it's the one choice most people will actually see
// without ever opening this picker.
const ALL_TAB_HUB_ICON_GROUP_KEYS = ['tabHubAppIcon', 'tabHubConditions', 'tabHubInsects', 'tabHubAnimals', 'tabHubFoodBuilders'] as const;
type TabHubIconGroupKey = (typeof ALL_TAB_HUB_ICON_GROUP_KEYS)[number];

// 2026-08-14, same day, a direct follow-up that generalizes the exception
// above from "just TabHub Icon's 3 groups" to the whole 'appearance' card:
// "There isn't much definition of space between the TabHub Icon appearance
// and navigation selection and the next selection picker below that, and
// so-on after that one to tell where one ends and the next begins. Is it
// possible to make each of them, and the things they control to be
// collapsable, too?" Every one of the 4 sub-sections this card shows
// (TabHub Icon, Shared background, Individual tab backgrounds, Generic
// color combination) now gets its own independent collapse. See
// collapsedAppearanceSubsections/renderAppearanceSubsectionHeader below,
// which also adds a visible divider line above every one but the first,
// specifically to answer the "definition of space... where one ends and
// the next begins" half of the request, not just the collapsing half.
// Deliberately its own third separate key space/state, not folded into
// CardSectionKey or TabHubIconGroupKey: these 4 sit one level above
// TabHubIconGroupKey's 3 (TabHub Icon is itself one of these 4,
// containing all 3 of those).
//
// 2026-08-17: 'animatedSky' removed from this list entirely. The whole
// Animated Sky feature (sun, moon, starfield, day/night tint) is gone,
// reported as confirmed continuous battery drain. See
// ScreenBackground.tsx's header note and constants/colors.ts's removal
// comment for the full story. What used to be this section's
// header/footer/ring accent job (previously the app-wide iridescent hue
// rotation) is now carried by the Generic color combination picker itself:
// its 12 named combinations each carry a "lighter" color used for the
// header text, the header/footer divider lines, and every ring, all flat
// and static, no animation anywhere.
const ALL_APPEARANCE_SUBSECTION_KEYS = [
  'tabHubIcon',
  'sharedBackground',
  'individualTabBackgrounds',
  'genericPalette',
  'groundColor',
] as const;
type AppearanceSubsectionKey = (typeof ALL_APPEARANCE_SUBSECTION_KEYS)[number];

type DayPart = 'breakfast' | 'lunch' | 'dinner' | 'snack';
const DAY_PARTS: DayPart[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const BLANK_TIME: TimeOfDayInput = { hour: '', minute: '', ampm: '' };

// 2026-08-08, explicitly requested: every Profile field that meant typing
// a number (birth date, height, meal times) gets the same tap-a-list
// pattern Side Builder's Dish Name page already uses for its Servings/
// Serving Size fields (PopoverSelect: see that component's header comment
// for why it replaced free typing/dragging there), leaving only
// First/Last name as text entry. Every option list below is a
// module-level constant, not built inline in the component: PopoverSelect
// is memoized against referentially-stable props, the same contract Side
// Builder's SERVINGS_PICKER_VALUES etc. already follow.
//
// Birth year: every year from 1900 through this year (matches
// isValidIsoDate's existing bound), newest first, since someone tapping a
// still-blank field is scrolling from "today" backward, not from 1900
// forward. Month/day stay plain, unpadded numbers ("1".."12"/"1".."31"),
// matching how birthMonth/birthDay were already stored (String(Number(m))
// when loading a saved profile). Day intentionally isn't narrowed by
// month/year here, the same "any 1-31, validity checked on commit"
// looseness the original free-text fields already had.
const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => String(CURRENT_YEAR - i));
const BIRTH_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const BIRTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));

// Height: a generous human range either system, matching what the old
// free-text maxLength implicitly allowed. Feet/inches split rather than
// one combined list, same two-field shape the original had.
const HEIGHT_CM_OPTIONS = Array.from({ length: 151 }, (_, i) => String(100 + i)); // 100-250 cm
const HEIGHT_FEET_OPTIONS = Array.from({ length: 6 }, (_, i) => String(3 + i)); // 3-8 ft
const HEIGHT_INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i)); // 0-11 in

// 2026-08-09, Weight: same generous-range PopoverSelect approach as height
// above, a plain whole-unit picker (no decimal precision, same precision
// level height already uses).
const WEIGHT_KG_OPTIONS = Array.from({ length: 221 }, (_, i) => String(30 + i)); // 30-250 kg
const WEIGHT_LB_OPTIONS = Array.from({ length: 485 }, (_, i) => String(66 + i)); // 66-550 lb

// 2026-08-09, Food allergies: the FDA's legally-recognized "Big 9" major
// food allergens (the same list this app's Reading Labels Digest content
// already covers, including sesame's 2023 addition as the 9th) as
// quick-toggle suggestions; anything else is a free-text add via
// allergyInput, not limited to this list. Alphabetical, 2026-08-09,
// explicitly requested for every pill row on this screen. Was originally
// in FDA major-allergen disclosure order, re-sorted here since display
// order, not the underlying list, is what was actually asked for.
const COMMON_ALLERGENS = ['Eggs', 'Fish', 'Milk', 'Peanuts', 'Sesame', 'Shellfish', 'Soybeans', 'Tree Nuts', 'Wheat'];

// Meal/eating-window times: hour stays plain ("1".."12", matching
// buildTime24's expected shape); minute is zero-padded ("00".."59") to
// match splitTime24's output for an already-saved time, so a saved "05"
// minute value shows up already selected rather than failing to match an
// unpadded "5" in this list. AM/PM stays the existing pill row, since that
// was never a text box to begin with.
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function usualTimeFieldFor(dayPart: DayPart): 'usualBreakfastTime' | 'usualLunchTime' | 'usualDinnerTime' | 'usualSnackTime' {
  switch (dayPart) {
    case 'breakfast':
      return 'usualBreakfastTime';
    case 'lunch':
      return 'usualLunchTime';
    case 'dinner':
      return 'usualDinnerTime';
    case 'snack':
      return 'usualSnackTime';
  }
}

function daysAgoLabel(isoDate: string): string {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

type TriState<T> = T | null;

function isValidIsoDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);
  // Date rolls invalid days (e.g. Feb 30) forward into the next month;
  // catching that here rejects it instead of silently storing the wrong date.
  const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDate && date.getTime() <= Date.now();
}

function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// A small label above a single PopoverSelect field, 2026-08-08, explicitly
// requested ("put labels above the list box scrollable selectors... for
// each field"), matching Side Builder's renderLabeledPicker pattern (a
// Text above a PopoverSelect, same file/field shape, just without that
// version's measured-minWidth stretching, which these fixed-width fields
// don't need). A plain function, not a wrapped component, would have
// worked too, but a component reads more clearly at each call site than a
// function returning JSX.
function PickerField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.pickerFieldGroup}>
      <Text style={styles.pickerFieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: null,
    lastName: null,
    sex: null,
    birthDate: null,
    hasHashimotos: null,
    heightCm: null,
    activityLevel: null,
    usualBreakfastTime: null,
    usualLunchTime: null,
    usualDinnerTime: null,
    usualSnackTime: null,
    fastingEnabled: false,
    eatingWindowStart: null,
    eatingWindowEnd: null,
    growingZone: null,
    growingZoneCountry: null,
    growingZonePostalCode: null,
  });
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>('metric');
  const [savedFlash, setSavedFlash] = useState(false);
  const [lastAssessment, setLastAssessment] = useState<SymptomAssessmentRecord | null>(null);
  // 2026-08-09, explicitly requested: "allow it to be collapsable so it is
  // quicker to find and set whatever I need to in there. Leave just the
  // header to see of each." Every one of this screen's card sections now
  // starts collapsed (this Set holds every key: see ALL_CARD_SECTION_KEYS;
  // membership means "collapsed," matching `collapsedSections.has(key)` at
  // each card's header/body split below), showing only its header until
  // tapped open. Plain local component state, not persisted: reopening
  // Profile always starts fresh with everything collapsed again, the same
  // "just headers first" state the request asked for, not a remembered
  // per-visit layout.
  const [collapsedSections, setCollapsedSections] = useState<Set<CardSectionKey>>(
    () => new Set(ALL_CARD_SECTION_KEYS),
  );
  function toggleSection(key: CardSectionKey) {
    setCollapsedSections((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  // Shared by every card below: a tappable header (title + chevron)
  // replacing the old plain `<Text style={styles.label}>` line, so the
  // whole header row (not just the text) is the tap target. Every card's
  // body (help text, fields) is then wrapped in a matching
  // `{!collapsedSections.has(key) ? (...) : null}` right where the header
  // used to sit alone.
  function renderCardHeader(key: CardSectionKey, title: string) {
    const collapsed = collapsedSections.has(key);
    return (
      <TouchableOpacity style={styles.cardHeaderRow} onPress={() => toggleSection(key)} activeOpacity={0.7}>
        <Text style={styles.label}>{title}</Text>
        <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={18} color={colors.menuIconMuted} />
      </TouchableOpacity>
    );
  }
  // 2026-08-14, direct request: "Is there a way to collapse each of the
  // sections of TabHub Icons inside of the already collapsable section
  // they are a part of?" A second, independent collapse layer scoped only
  // to the TabHub Icon picker's 3 groups (see TabHubIconGroupKey's comment
  // above for why this one area is exempt from the "no nested sub-cards"
  // rule the rest of this screen holds to). Starts every group collapsed,
  // same "just headers first" default as the top-level cards: with 65
  // tiles across the 3 groups combined, showing all of them the instant
  // the outer Appearance & Navigation card opens would defeat the whole
  // point of collapsing that card in the first place.
  const [collapsedIconGroups, setCollapsedIconGroups] = useState<Set<TabHubIconGroupKey>>(
    () => new Set(ALL_TAB_HUB_ICON_GROUP_KEYS),
  );
  function toggleIconGroup(key: TabHubIconGroupKey) {
    setCollapsedIconGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  // Same tappable-header shape as renderCardHeader above, just using
  // subLabel's smaller/lighter styling (matching every other in-card
  // sub-heading on this screen) and a slightly smaller chevron, since this
  // is a sub-level header nested one layer deeper than a card header.
  function renderIconGroupHeader(key: TabHubIconGroupKey, title: string, marginTop: number) {
    const collapsed = collapsedIconGroups.has(key);
    return (
      <TouchableOpacity
        style={[styles.cardHeaderRow, { marginTop }]}
        onPress={() => toggleIconGroup(key)}
        activeOpacity={0.7}
      >
        <Text style={styles.subLabel}>{title}</Text>
        <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={16} color={colors.menuIconMuted} />
      </TouchableOpacity>
    );
  }
  // 2026-08-14, direct follow-up: "Is it possible to make each of them,
  // and the things they control to be collapsable, too?" See
  // AppearanceSubsectionKey's comment above for the full request. All 5
  // sub-sections of the Appearance & Navigation card start collapsed, the
  // same "just headers first" default every other collapsible layer on
  // this screen already uses.
  const [collapsedAppearanceSubsections, setCollapsedAppearanceSubsections] = useState<Set<AppearanceSubsectionKey>>(
    () => new Set(ALL_APPEARANCE_SUBSECTION_KEYS),
  );
  function toggleAppearanceSubsection(key: AppearanceSubsectionKey) {
    setCollapsedAppearanceSubsections((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  // Same tappable-header shape as renderCardHeader/renderIconGroupHeader
  // above, plus a visible divider line above every sub-section but the
  // first (styles.appearanceSubsectionHeaderFirst zeroes that border/
  // spacing out for TabHub Icon, which already sits directly under the
  // card's header with nothing else above it to separate from). This is
  // the direct answer to "there isn't much definition of space... to tell
  // where one ends and the next begins," not just the collapsing itself.
  function renderAppearanceSubsectionHeader(key: AppearanceSubsectionKey, title: string, isFirst: boolean) {
    const collapsed = collapsedAppearanceSubsections.has(key);
    return (
      <TouchableOpacity
        style={[styles.appearanceSubsectionHeader, isFirst && styles.appearanceSubsectionHeaderFirst]}
        onPress={() => toggleAppearanceSubsection(key)}
        activeOpacity={0.7}
      >
        <Text style={styles.subLabel}>{title}</Text>
        <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={17} color={colors.menuIconMuted} />
      </TouchableOpacity>
    );
  }
  // Multi-condition model, 2026-08-08, replaces the old single
  // Hashimoto's-only pill row. allConditions is the full reference roster
  // (built/in_progress/planned); selectedConditions is this person's own
  // picks, local-only, backed by user_conditions.
  const [allConditions, setAllConditions] = useState<ConditionReference[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  // 2026-08-23, deliberately separate from selectedConditions above, per
  // direct request: "they might be curious or worried about it for
  // themselves or worried about it for someone else and just want to
  // learn. However, this shouldn't mean that those conditions are now
  // added to their own that the app tracks and helps with." Backed by
  // its own curious_about_conditions table (lib/db.ts), never written to
  // or read from anywhere condition scoring, medication rules, or the
  // healing-stage system look.
  const [curiousAboutConditions, setCuriousAboutConditions] = useState<string[]>([]);
  // Live, app-wide (lib/visualPreferences.ts): reading it via the same
  // hook every consumer uses means this screen's pills always reflect
  // whatever's really stored, and every edit here reaches the shared
  // background and each tab's own revealed background immediately, with no
  // extra local state to keep in sync.
  const visualPrefs = useVisualPreferences();

  // Live, app-wide (lib/generalHealthPreferences.ts), 2026-08-14, direct
  // requirement: "Make the muting granular, per topic, not sweeping." One
  // toggle per lib/generalHealthRules.ts topic, not a single on/off
  // switch: setTopicMuted only ever touches the one topic tapped, leaving
  // every other topic's current preference untouched.
  const generalHealthPrefs = useGeneralHealthPreferences();
  function toggleGeneralHealthTopic(topicId: string) {
    setTopicMuted(topicId, !generalHealthPrefs.mutedTopics[topicId]);
  }

  // Home Screen section toggles, 2026-08-21, direct request: "make it
  // capable of turning on and off whatever the user wants to from the
  // home screen." Same one-key-at-a-time pattern as
  // toggleGeneralHealthTopic above, through setVisualPreferences's own
  // per-key merge for homeSectionVisibility (see that function's comment
  // in lib/visualPreferences.ts) rather than replacing the whole map.
  function toggleHomeSection(key: (typeof ALL_HOME_SECTION_KEYS)[number]) {
    setVisualPreferences({ homeSectionVisibility: { [key]: !isHomeSectionVisible(visualPrefs, key) } });
  }

  // Home Screen order, 2026-08-23, direct request: "they should be able
  // to move the things on the home screen they have chosen to be there
  // into any order they want to from top to bottom, except the welcome
  // box." Reads the real, reconciled order via getOrderedHomeSectionKeys
  // (never visualPrefs.homeSectionOrder directly, same discipline
  // isHomeSectionVisible already establishes for its own sibling field),
  // swaps the moved key with its neighbor, and saves the whole new order
  // in one write -- setVisualPreferences replaces homeSectionOrder
  // wholesale rather than merging it key by key (see that function's own
  // comment in lib/visualPreferences.ts), which is exactly right for a
  // full reordered list, not a problem to work around.
  function moveHomeSection(key: HomeSectionKey, direction: 'up' | 'down') {
    const order = getOrderedHomeSectionKeys(visualPrefs);
    const index = order.indexOf(key);
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || swapWith < 0 || swapWith >= order.length) return;
    const reordered = [...order];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    setVisualPreferences({ homeSectionOrder: reordered });
  }

  // Header growth vine toggle, 2026-08-21, Phase 0 of the header growth
  // vine/Timeline plan -- a plain boolean flip, unlike toggleHomeSection
  // above there's only ever one vine, not a per-key map to merge into.
  function toggleGrowthVine() {
    setVisualPreferences({ growthVineEnabled: !visualPrefs.growthVineEnabled });
  }

  // Local text-field buffers, kept separate from `profile` so the person
  // can type a partial value (e.g. just a year) without it being parsed/
  // saved mid-keystroke. Committed to the DB on blur.
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');

  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);

  const [heightCmInput, setHeightCmInput] = useState('');
  const [heightFeetInput, setHeightFeetInput] = useState('');
  const [heightInchesInput, setHeightInchesInput] = useState('');

  // Weight, 2026-08-09, unlike height (a single, overwritable field on
  // user_profile), weight lives in the already-existing body_measurements
  // time-series table (see lib/db.ts's recordBodyMeasurement). Every
  // commit here inserts a new reading, the same "just log it" behavior
  // Home's quick blood-pressure/heart-rate log already uses, not an
  // update-in-place. Always stored in kg internally (mirroring heightCm's
  // always-cm convention), converted for display only.
  const [weightKgInput, setWeightKgInput] = useState('');
  const [weightLbInput, setWeightLbInput] = useState('');

  // Food allergies, 2026-08-09, explicitly requested inside the conditions
  // area: a local list (lib/db.ts's user_food_allergies), supporting more
  // than one. allergyInput is the free-text "add a new one" field;
  // foodAllergies is the loaded/committed list.
  const [foodAllergies, setFoodAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  // Condition stages, 2026-08-09, the generalized, multi-condition
  // replacement for the old Hashimoto's-only healingStage profile column
  // (see lib/conditionStages.ts's header comment). One row per condition
  // in user_condition_stages, keyed by condition code.
  const [conditionStageMap, setConditionStageMap] = useState<Record<string, string>>({});

  // Already-tested-foods onboarding review, 2026-08-14, one trial array
  // per condition that actually has a curated concern list (see
  // lib/conditionFoodConcerns.ts's top comment). Keyed by condition code,
  // loaded/refreshed by the effect below.
  const [conditionFoodConcernTrials, setConditionFoodConcernTrials] = useState<Record<string, FoodTrialRecord[]>>({});

  // Custom background image upload, 2026-08-09, which scope (see
  // SHARED_BACKGROUND_SCOPE_KEY / lib/customBackgroundImage.ts) currently
  // has a picker in flight, null when none. Disables that one scope's
  // pills while busy and shows a small spinner in place of its "Custom
  // image" label, deliberately scoped to one scope at a time rather than a
  // single flat boolean, so picking for one tab doesn't visually disable
  // every other tab's row too.
  const [pickingImageForScope, setPickingImageForScope] = useState<string | null>(null);

  // Developer Tools card, 2026-08-14, __DEV__-gated, see that card's JSX
  // below for the "never in a production build" reasoning.
  const [seedingTestWeek, setSeedingTestWeek] = useState(false);
  const [clearingSeededData, setClearingSeededData] = useState(false);

  // Backup & Restore card, 2026-08-16, see lib/dataBackup.ts's header
  // comment for the full design reasoning. One shared "something's in
  // flight" flag rather than three separate ones, since export and either
  // restore path can't sensibly run at once anyway, and this way every
  // button in the card correctly disables together.
  const [backupBusy, setBackupBusy] = useState(false);
  // A durable "document and display the file path" record, per direct
  // feedback: listLocalBackupFiles() reads this device's cache directory
  // fresh every time, so this always reflects what's genuinely still
  // there, not a stale one-time snapshot.
  const [localBackups, setLocalBackups] = useState<LocalBackupFile[]>([]);
  // Password-based encryption, 2026-08-16, see lib/backupEncryption.ts's
  // header comment for the full reasoning. One shared prompt
  // (components/PasswordPrompt.tsx) covers both moments this needs to
  // happen: 'set' when exporting (asks twice, to catch a typo before it
  // locks someone out of their own backup forever, since there is
  // deliberately no recovery), 'enter' when restoring an encrypted file.
  const [promptPassword, passwordPromptElement] = usePasswordPrompt();
  // App-styled replacements for the whole backup/restore flow's former
  // native Alert.alert calls, 2026-08-16, direct request: "there needs to
  // be some sort of communication between steps that take a little
  // time... do we have to use all system windows or can we use the app's
  // own colors and layout." showBusy/hideBusy drive a live
  // spinner-plus-status-message overlay through the genuinely slow parts
  // (encrypt/decrypt, the actual whole-database restore); confirmBackup
  // replaces the native "Restore this backup? This can't be undone."
  // dialog; showBackupAlert replaces every plain result/error message in
  // this same flow.
  const [showBusy, hideBusy, busyOverlayElement] = useBusyOverlay();
  const [confirmBackup, confirmSheetElement] = useConfirmSheet();
  const [showBackupAlert, backupAlertElement] = useInfoAlert();

  // Ground color picker's handler, 2026-08-19, see the Ground color
  // sub-section's comment below for the full "why this needs a reload at
  // all" reasoning. showBusy gives instant feedback for the brief gap
  // between the tap and reloadAsync() actually tearing the JS context
  // down; there's no matching hideBusy because that moment never arrives
  // on the success path, since the whole app (this overlay included) is
  // gone by then, replaced by a fresh launch. Only the catch path needs to
  // clear it, for the rare case reloadAsync() itself rejects rather than
  // just not resolving before the reload happens.
  async function handleSelectGroundTheme(theme: GroundTheme) {
    showBusy('Applying...');
    await setVisualPreferences({ groundTheme: theme });
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Updates.reloadAsync failed after ground theme change', error);
      hideBusy();
      showBackupAlert(
        'Saved',
        'Your new ground color is saved, but this device could not restart the app automatically. Close and reopen Inside Story to see it everywhere.',
      );
    }
  }

  const refreshLocalBackups = useCallback(async () => {
    const files = await listLocalBackupFiles();
    setLocalBackups(files);
  }, []);

  useEffect(() => {
    let isMounted = true;
    listLocalBackupFiles().then((files) => {
      if (isMounted) setLocalBackups(files);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const [mealTimeBuffers, setMealTimeBuffers] = useState<Record<DayPart, TimeOfDayInput>>({
    breakfast: BLANK_TIME,
    lunch: BLANK_TIME,
    dinner: BLANK_TIME,
    snack: BLANK_TIME,
  });
  const [eatingWindowStartBuffer, setEatingWindowStartBuffer] = useState<TimeOfDayInput>(BLANK_TIME);
  const [eatingWindowEndBuffer, setEatingWindowEndBuffer] = useState<TimeOfDayInput>(BLANK_TIME);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getUserProfile(),
      getStoredMeasurementSystem(),
      listSymptomAssessments(1),
      listAllConditions(),
      getUserConditions(),
      getCuriousAboutConditions(),
      listBodyMeasurements('weight', 1),
      listFoodAllergies(),
      getConditionStages(),
    ]).then(
      ([
        storedProfile,
        storedSystem,
        recentAssessments,
        conditionRoster,
        storedConditions,
        storedCuriousAbout,
        weightReadings,
        storedAllergies,
        storedConditionStages,
      ]) => {
      if (!isMounted) return;

      setProfile(storedProfile);
      setLastAssessment(recentAssessments[0] ?? null);
      setAllConditions(conditionRoster);
      setSelectedConditions(storedConditions);
      setCuriousAboutConditions(storedCuriousAbout);
      setFoodAllergies(storedAllergies);
      setConditionStageMap(storedConditionStages);
      setFirstNameInput(storedProfile.firstName ?? '');
      setLastNameInput(storedProfile.lastName ?? '');

      if (storedProfile.birthDate) {
        const [y, m, d] = storedProfile.birthDate.split('-');
        setBirthYear(y);
        setBirthMonth(String(Number(m)));
        setBirthDay(String(Number(d)));
      }

      const system = storedSystem ?? detectMeasurementSystemFromLocale();
      setMeasurementSystem(system);

      if (storedProfile.heightCm != null) {
        if (system === 'imperial') {
          const { feet, inches } = cmToFeetInches(storedProfile.heightCm);
          setHeightFeetInput(String(feet));
          setHeightInchesInput(String(inches));
        } else {
          setHeightCmInput(String(Math.round(storedProfile.heightCm)));
        }
      }

      const latestWeight = weightReadings[0];
      if (latestWeight) {
        // Defensively handles either stored unit even though commitWeight
        // below always writes 'kg', see that function's comment.
        const kgValue = latestWeight.unit === 'lb' ? lbToKg(latestWeight.value) : latestWeight.value;
        if (system === 'imperial') {
          setWeightLbInput(String(Math.round(kgToLb(kgValue))));
        } else {
          setWeightKgInput(String(Math.round(kgValue)));
        }
      }

      setMealTimeBuffers({
        breakfast: splitTime24(storedProfile.usualBreakfastTime),
        lunch: splitTime24(storedProfile.usualLunchTime),
        dinner: splitTime24(storedProfile.usualDinnerTime),
        snack: splitTime24(storedProfile.usualSnackTime),
      });
      setEatingWindowStartBuffer(splitTime24(storedProfile.eatingWindowStart));
      setEatingWindowEndBuffer(splitTime24(storedProfile.eatingWindowEnd));

      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Loads/refreshes trial data for the already-tested-foods review, scoped
  // to only the selected conditions that actually have a curated concern
  // list. Re-fires whenever a condition gets toggled, so newly selecting a
  // condition with concerns picks this up live rather than needing a
  // screen reload.
  useEffect(() => {
    let isMounted = true;
    const relevantCodes = selectedConditions.filter((code) => getConditionFoodConcerns(code) !== null);
    if (relevantCodes.length === 0) {
      setConditionFoodConcernTrials({});
      return;
    }
    Promise.all(relevantCodes.map((code) => getFoodTrialsForCondition(code))).then((results) => {
      if (!isMounted) return;
      const next: Record<string, FoodTrialRecord[]> = {};
      relevantCodes.forEach((code, index) => {
        next[code] = results[index];
      });
      setConditionFoodConcernTrials(next);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedConditions]);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }, []);

  async function updateProfile(update: Partial<UserProfile>) {
    const next = { ...profile, ...update };
    setProfile(next);
    await setUserProfile(update);
    flashSaved();
  }

  function commitFirstName() {
    const trimmed = firstNameInput.trim();
    if (trimmed !== (profile.firstName ?? '')) {
      updateProfile({ firstName: trimmed || null });
    }
  }

  function commitLastName() {
    const trimmed = lastNameInput.trim();
    if (trimmed !== (profile.lastName ?? '')) {
      updateProfile({ lastName: trimmed || null });
    }
  }

  function handleSexSelect(sex: TriState<DietarySex>) {
    updateProfile({ sex });
  }

  function handleActivityLevelSelect(activityLevel: TriState<ActivityLevel>) {
    updateProfile({ activityLevel });
  }

  async function toggleCondition(code: string) {
    const nowSelected = !selectedConditions.includes(code);
    setSelectedConditions((current) =>
      nowSelected ? [...current, code] : current.filter((c) => c !== code),
    );
    await setUserConditionSelected(code, nowSelected);
    // Deselecting a condition also clears its declared stage, 2026-08-09,
    // a gap found and fixed while building the Healing Stages reordering
    // feature: without this, an orphaned user_condition_stages row would
    // keep silently driving both the tap-to-explain advisory and the new
    // picker reordering even after the condition itself no longer shows
    // here to edit or clear it (this same screen's stage-picker section
    // only renders for a currently-selected condition), a confusing "why
    // is this still happening" gap this closes at the source rather than
    // leaving stale.
    if (!nowSelected && conditionStageMap[code] !== undefined) {
      await setConditionStage(code, null);
      setConditionStageMap((current) => {
        const updated = { ...current };
        delete updated[code];
        return updated;
      });
    }
    // Selecting a condition as one's own also clears it from "curious
    // about," 2026-08-23, so the same condition never shows pinned in both
    // lists at once -- a real, tracked condition no longer needs a
    // separate "just curious" marker.
    if (nowSelected && curiousAboutConditions.includes(code)) {
      setCuriousAboutConditions((current) => current.filter((c) => c !== code));
      await setCuriousAboutConditionSelected(code, false);
    }
    flashSaved();
  }

  // See curiousAboutConditions' own comment above for what this is and
  // why it's deliberately not folded into toggleCondition/user_conditions.
  async function toggleCuriousAboutCondition(code: string) {
    const nowSelected = !curiousAboutConditions.includes(code);
    setCuriousAboutConditions((current) =>
      nowSelected ? [...current, code] : current.filter((c) => c !== code),
    );
    await setCuriousAboutConditionSelected(code, nowSelected);
    flashSaved();
  }

  // overrides, same reason commitMealTime/commitEatingWindow already take
  // one: a PopoverSelect onSelect both updates the field's state and needs
  // to commit immediately, in the same synchronous tap. Reading
  // birthYear/birthMonth/birthDay from closure here would still see the
  // pre-update value, since React state updates aren't applied
  // synchronously. Passing the just-picked value straight through
  // sidesteps that stale-closure gap entirely.
  function commitBirthDate(overrides?: { year?: string; month?: string; day?: string }) {
    setDateError(null);

    const year = overrides?.year ?? birthYear;
    const month = overrides?.month ?? birthMonth;
    const day = overrides?.day ?? birthDay;

    if (!year && !month && !day) {
      if (profile.birthDate) updateProfile({ birthDate: null });
      return;
    }

    const numericYear = Number(year);
    const numericMonth = Number(month);
    const numericDay = Number(day);

    if (!isValidIsoDate(numericYear, numericMonth, numericDay)) {
      setDateError('Enter a complete date (not in the future).');
      return;
    }

    updateProfile({ birthDate: toIsoDate(numericYear, numericMonth, numericDay) });
  }

  function clearBirthDate() {
    setBirthYear('');
    setBirthMonth('');
    setBirthDay('');
    setDateError(null);
    if (profile.birthDate) updateProfile({ birthDate: null });
  }

  // overrides: same stale-closure reason as commitBirthDate above.
  function commitHeight(overrides?: { feet?: string; inches?: string; cm?: string }) {
    if (measurementSystem === 'imperial') {
      const feetValue = overrides?.feet ?? heightFeetInput;
      const inchesValue = overrides?.inches ?? heightInchesInput;
      if (!feetValue && !inchesValue) {
        if (profile.heightCm != null) updateProfile({ heightCm: null });
        return;
      }
      const feet = Number(feetValue) || 0;
      const inches = Number(inchesValue) || 0;
      if (feet <= 0 && inches <= 0) return;
      updateProfile({ heightCm: feetInchesToCm(feet, inches) });
    } else {
      const cmValue = overrides?.cm ?? heightCmInput;
      if (!cmValue) {
        if (profile.heightCm != null) updateProfile({ heightCm: null });
        return;
      }
      const cm = Number(cmValue);
      if (!cm || cm <= 0) return;
      updateProfile({ heightCm: cm });
    }
  }

  function clearHeight() {
    setHeightCmInput('');
    setHeightFeetInput('');
    setHeightInchesInput('');
    if (profile.heightCm != null) updateProfile({ heightCm: null });
  }

  // Always stores in kg, regardless of which unit the person is currently
  // typing in (mirroring heightCm's always-cm convention). Inserts a new
  // body_measurements reading every time, the same "just log it" behavior
  // Home's quick blood-pressure/heart-rate log already uses. No
  // "clear" here, unlike height, since there's no single field to null
  // out; a historical reading, once logged, stays logged the same way a
  // logged blood-pressure reading isn't erased from Home either. overrides
  // mirrors commitHeight's same-tap stale-closure fix.
  async function commitWeight(overrides?: { kg?: string; lb?: string }) {
    let kgValue: number;
    if (measurementSystem === 'imperial') {
      const lbStr = overrides?.lb ?? weightLbInput;
      if (!lbStr) return;
      const lb = Number(lbStr);
      if (!lb || lb <= 0) return;
      kgValue = lbToKg(lb);
    } else {
      const kgStr = overrides?.kg ?? weightKgInput;
      if (!kgStr) return;
      const kg = Number(kgStr);
      if (!kg || kg <= 0) return;
      kgValue = kg;
    }
    await recordBodyMeasurement({
      loggedAt: new Date().toISOString(),
      measurementType: 'weight',
      value: kgValue,
      unit: 'kg',
    });
    flashSaved();
  }

  // Food allergies: addAllergy also clears the free-text input on success,
  // so the field is ready for the next one immediately (matches how the
  // Food tab's ingredient-add flow resets after each add).
  async function addAllergy(rawName: string) {
    const trimmed = rawName.trim();
    if (!trimmed) return;
    await addFoodAllergy(trimmed);
    const updated = await listFoodAllergies();
    setFoodAllergies(updated);
    setAllergyInput('');
    flashSaved();
  }

  async function removeAllergy(name: string) {
    await removeFoodAllergy(name);
    setFoodAllergies((current) => current.filter((allergy) => allergy !== name));
  }

  // Condition stages: one row per condition; passing null clears that
  // condition's declaration back to "not declared."
  async function handleSetConditionStage(conditionCode: string, stageCode: string | null) {
    await setConditionStage(conditionCode, stageCode);
    setConditionStageMap((current) => {
      const updated = { ...current };
      if (stageCode === null) {
        delete updated[conditionCode];
      } else {
        updated[conditionCode] = stageCode;
      }
      return updated;
    });
    flashSaved();
  }

  // Already-tested-foods review, 2026-08-14: marking a concern creates an
  // already-resolved food_trials row (see markConcernAlreadyTested's
  // comment in lib/db.ts for why it never schedules a reminder series),
  // then refreshes just that one condition's trial list.
  async function handleMarkConcern(
    concern: ConditionFoodConcern,
    conditionCode: string,
    outcome: 'cleared' | 'flagged',
  ) {
    await markConcernAlreadyTested(concern.label, conditionCode, outcome);
    const trials = await getFoodTrialsForCondition(conditionCode);
    setConditionFoodConcernTrials((current) => ({ ...current, [conditionCode]: trials }));
    flashSaved();
  }

  // "Not sure anymore?" reopenFoodTrial itself now reschedules a fresh
  // reminder series (see its comment in lib/db.ts); this just needs to
  // call it and refresh this one condition's trial list.
  async function handleReopenConcernTrial(trialId: string, conditionCode: string) {
    await reopenFoodTrial(trialId);
    const trials = await getFoodTrialsForCondition(conditionCode);
    setConditionFoodConcernTrials((current) => ({ ...current, [conditionCode]: trials }));
    flashSaved();
  }

  // Custom background image, 2026-08-09, explicitly requested: "Add the
  // ability to upload an image to be the background for the shared
  // background, and for each of the individual tabs." isShared picks
  // which half of VisualPreferences actually needs updating on success
  // (homeBackgroundStyle, a plain scalar, vs. tabBackgroundStyle, a
  // per-path record); both scopes otherwise go through the exact same
  // pick/validate/save pipeline (lib/customBackgroundImage.ts).
  async function handlePickCustomBackground(scopeKey: string, isShared: boolean) {
    if (pickingImageForScope) return; // one picker in flight at a time
    setPickingImageForScope(scopeKey);
    try {
      const previousUri = visualPrefs.customBackgroundImages[scopeKey];
      const result = await pickAndSaveCustomBackgroundImage(scopeKey, previousUri);
      if (result.status === 'success') {
        await setVisualPreferences({
          ...(isShared
            ? { homeBackgroundStyle: 'custom' as const }
            : { tabBackgroundStyle: { [scopeKey]: 'custom' as const } }),
          customBackgroundImages: { [scopeKey]: result.uri },
        });
      } else if (result.status === 'permission-denied') {
        showBackupAlert(
          'Photo access needed',
          "Inside Story needs permission to your photos to set a custom background. You can grant this in your device's app settings.",
        );
      } else if (result.status === 'too-small') {
        showBackupAlert(
          'Image too small',
          `That image is ${result.width}×${result.height}. At least ${CUSTOM_BACKGROUND_MIN_DIMENSION}px on its shorter side is needed so it doesn't look blurry stretched to fill the screen. Try a larger photo.`,
        );
      } else if (result.status === 'too-large-after-compression') {
        showBackupAlert(
          'Image too large',
          `That image is still too large even after resizing and compressing it to fit under ${Math.round(CUSTOM_BACKGROUND_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB. Try a different photo.`,
        );
      } else if (result.status === 'error') {
        showBackupAlert('Something went wrong', result.message);
      }
      // 'canceled': no message, no change.
    } finally {
      setPickingImageForScope(null);
    }
  }

  // Backup & Restore, 2026-08-16, see lib/dataBackup.ts's header comment
  // for the design reasoning (schema-driven, not hand-listed; photo files
  // themselves aren't included, only their stored uri references).
  //
  // A confirmed bug fixed the same day, directly reported: exporting
  // produced a .txt file containing nothing but this function's own
  // message text, no backup data at all. Traced to the actual root cause
  // in react-native's source, not guessed: Share.share's `url` field is
  // silently dropped on Android before it ever reaches native code (see
  // lib/nativeSharing.ts's header comment for the full confirmation).
  // Fixed by switching the file attachment to expo-sharing's shareAsync
  // (the module built for this, added the same day) and, per the direct
  // follow-up ask, showing the local file path directly rather than
  // leaving it to whatever the OS share target silently did with it.
  async function handleExportBackup() {
    if (backupBusy) return;
    const password = await promptPassword(
      'set',
      'Set a Backup Password',
      "This encrypts your backup so only someone who has this password can ever read it: not a text editor, not an AI tool, nothing. Choose something you'll remember; there's no way to reset it later.",
    );
    if (password === null) return; // a cancel: nothing was exported
    setBackupBusy(true);
    try {
      // A live status through the one genuinely slow step. See
      // components/BusyOverlay.tsx's header comment for why this is a
      // plain spinner-plus-message, not a second percent-estimate system.
      showBusy('Encrypting your backup...');
      let fileUri: string | null;
      try {
        fileUri = await exportBackupToFile(password);
      } finally {
        hideBusy();
      }
      if (!fileUri) {
        showBackupAlert('Something went wrong', 'Could not write a backup file. Nothing was exported.');
        return;
      }
      const shared = await shareFileIfAvailable(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save your Inside Story backup',
      });
      await refreshLocalBackups();
      showBackupAlert(
        'Backup created',
        `${
          shared
            ? "If you just saved a copy somewhere (a cloud drive, an email to yourself), that's the one to keep: it survives even if this device doesn't. "
            : ''
        }A copy also stays right here, in Inside Story's app storage:\n\n${fileUri}\n\nThat copy is what "Restore Most Recent" below reads from, but it's lost along with this device if this device is ever lost or replaced.`,
      );
    } catch (error) {
      showBackupAlert('Something went wrong', error instanceof Error ? error.message : 'Failed to export a backup.');
    } finally {
      setBackupBusy(false);
    }
  }

  // Resolves whatever a backup file's raw content actually is into a
  // usable BackupEnvelope, detecting by shape rather than by file name or
  // any other guess, whether it's an EncryptedBackupWire (every export
  // since 2026-08-16, see lib/backupEncryption.ts) or an older,
  // unencrypted BackupEnvelope from before that feature existed. Both stay
  // fully openable file formats. Returns 'cancelled' specifically to
  // distinguish "the person backed out of the password prompt" from "this
  // isn't a backup file at all," since those two outcomes need different
  // messages.
  async function resolveBackupEnvelope(content: string): Promise<BackupEnvelope | null | 'cancelled'> {
    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch {
      return null;
    }

    if (!isEncryptedBackupWire(raw)) {
      // A legacy, unencrypted file: reuse the existing, already-proven
      // parse/validate path directly.
      return parseBackupEnvelope(content);
    }

    for (;;) {
      const password = await promptPassword(
        'enter',
        'Enter Backup Password',
        'This backup is encrypted. Enter the password you set when you exported it.',
      );
      if (password === null) return 'cancelled';
      // decryptBackupPayload now yields every 5,000 of its 100,000 KDF
      // iterations (see lib/backupEncryption.ts's header comment) rather
      // than freezing the whole JS thread solid. It has to be awaited now
      // that it's genuinely async, not just a style choice. A live status
      // through this same wait, matching the export side above.
      showBusy('Decrypting your backup...');
      let decrypted: string | null;
      try {
        decrypted = await decryptBackupPayload(raw, password);
      } finally {
        hideBusy();
      }
      if (decrypted === null) {
        // An honest limitation stated directly to the person too:
        // authenticated encryption can't tell a wrong password apart from
        // a corrupted/tampered file, by design (see lib/backupEncryption.ts's
        // decryptBackupPayload comment).
        const tryAgain = await confirmBackup({
          title: "That password didn't work",
          message: "Either the password is wrong, or this file is corrupted; there's no way to tell which one. Try again?",
          confirmLabel: 'Try Again',
        });
        if (!tryAgain) return 'cancelled';
        continue;
      }
      return parseBackupEnvelope(decrypted);
    }
  }

  async function runRestore(content: string) {
    const envelope = await resolveBackupEnvelope(content);
    if (envelope === 'cancelled') return;
    if (!envelope) {
      showBackupAlert(
        "That doesn't look like a backup file",
        'Nothing was changed. Try a different file, or export a fresh backup and try that one.',
      );
      return;
    }
    const shouldRestore = await confirmBackup({
      title: 'Restore this backup?',
      message: `This will replace everything currently on this device with what's in the backup from ${new Date(envelope.exportedAt).toLocaleString()}. This can't be undone.`,
      confirmLabel: 'Restore',
      destructive: true,
    });
    if (!shouldRestore) return;

    setBackupBusy(true);
    try {
      // A live status through the actual whole-database rewrite, the one
      // step in this whole flow the person has directly reported feeling
      // the most "is this doing something?" uncertainty about, 2026-08-16.
      showBusy('Restoring your data...');
      let result;
      try {
        result = await restoreFromBackupEnvelope(envelope);
      } finally {
        hideBusy();
      }
      // An on-device-confirmed gap, 2026-08-16: restore rewrites the
      // database directly, which is correct and complete for everything a
      // screen re-reads on its own (Food Allergies, confirmed on-device),
      // but several features (lib/visualPreferences.ts's TabHub
      // icon/background choices, at least) keep a live, module-level cache
      // in memory for the rest of this app session, never touched by a raw
      // database rewrite. A still-running app can show a stale value even
      // though the underlying row is already correctly restored. A full
      // close-and-reopen (a fresh JS heap, every module-level cache
      // starting empty again) is the one guaranteed way to see everything
      // reflect the restore, not just database-backed screens. Named
      // directly here rather than left to a second, confusing bug report.
      showBackupAlert(
        'Restored',
        `${result.tablesRestored} table(s) and ${result.rowsRestored} row(s) restored.${
          result.tablesSkipped.length > 0
            ? ` (${result.tablesSkipped.length} table(s) from the backup no longer exist in this version of the app and were skipped.)`
            : ''
        }\n\nClose and fully reopen Inside Story now: some settings (like the TabHub icon) are cached in memory while the app is running, and won't show the restored value until it's restarted.`,
      );
    } catch (error) {
      showBackupAlert(
        'Restore failed',
        error instanceof Error ? error.message : 'Something went wrong partway through. Nothing was changed.',
      );
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleRestoreMostRecent() {
    if (backupBusy) return;
    // Deliberately stays true through the whole call below (the password
    // prompt, the no-longer-frozen-but-still-slow decrypt, the
    // destructive-confirm dialog, and the actual restore). An
    // on-device-confirmed bug found the previous version of this function
    // reset it back to false right before the expensive part even began,
    // meaning the button never actually showed "Working..." (or stayed
    // disabled against a double-tap) during the one part of this whole
    // flow that most needed it.
    setBackupBusy(true);
    try {
      const files = await listLocalBackupFiles();
      if (files.length === 0) {
        showBackupAlert('No local backups yet', 'Export a backup first, or use "Restore from a File" to pick one from elsewhere.');
        return;
      }
      const content = await readBackupFileContent(files[0].uri);
      if (!content) {
        showBackupAlert('Something went wrong', 'Could not read that backup file.');
        return;
      }
      await runRestore(content);
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleRestoreFromFile() {
    if (backupBusy) return;
    // Same fix as handleRestoreMostRecent above: stays true through the
    // whole flow, not reset early.
    setBackupBusy(true);
    try {
      const picked = await pickAndReadBackupFile();
      if (!picked) return; // a cancel, or a read failure already logged
      await runRestore(picked.content);
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleRemoveCustomBackground(scopeKey: string, isShared: boolean) {
    const uri = visualPrefs.customBackgroundImages[scopeKey];
    if (uri) await deleteCustomBackgroundImage(uri);
    await setVisualPreferences({
      ...(isShared ? { homeBackgroundStyle: 'photo' as const } : { tabBackgroundStyle: { [scopeKey]: 'photo' as const } }),
      customBackgroundImages: { [scopeKey]: undefined },
    });
  }

  // Shared by both the "Shared background" row and each row inside
  // "Individual tab backgrounds": one implementation of the
  // Photo/Generic/Off/Custom picker rather than two copies that could
  // quietly drift apart. Custom's pill deliberately doesn't use the same
  // instant-toggle onPress as the other three (it opens an async picker
  // instead), and only Custom shows the "Remove custom image" link.
  function renderBackgroundOptionsRow(scopeKey: string, isShared: boolean, current: BackgroundStyle) {
    const busy = pickingImageForScope === scopeKey;
    return (
      <>
        <View style={styles.pillRow}>
          {BACKGROUND_STYLE_OPTIONS.map((option) => {
            const active = option.value === current;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.pillSmall, active && styles.pillActive]}
                onPress={() =>
                  isShared
                    ? setVisualPreferences({ homeBackgroundStyle: option.value })
                    : setVisualPreferences({ tabBackgroundStyle: { [scopeKey]: option.value } })
                }
              >
                <Text style={[styles.pillTextSmall, active && styles.pillTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.pillSmall, current === 'custom' && styles.pillActive]}
            onPress={() => handlePickCustomBackground(scopeKey, isShared)}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator
                size="small"
                color={current === 'custom' ? colors.textOnPrimary : colors.textSecondary}
              />
            ) : (
              <Text style={[styles.pillTextSmall, current === 'custom' && styles.pillTextActive]}>
                {current === 'custom' ? 'Custom (tap to change)' : 'Custom image'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {current === 'custom' ? (
          <TouchableOpacity onPress={() => handleRemoveCustomBackground(scopeKey, isShared)} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Remove custom image</Text>
          </TouchableOpacity>
        ) : null}
      </>
    );
  }

  // 2026-08-14: one shared render for a single TabHub Icon group's grid
  // row, reused 3 times (Conditions / Insects & Other Wildlife / Animals)
  // rather than tripling the same JSX, directly answering "separate the
  // conditions from the insects and others... and place all of these new
  // ones into their own group, too." Each group renders under its own
  // subLabel heading in the JSX below; this function is just the
  // tappable-tile grid itself, identical logic to what the old single flat
  // tabHubIconOptions.map() already did.
  function renderTabHubIconGroup(options: { key: TabHubIconChoice; label: string }[]) {
    return (
      <View style={styles.iconGridRow}>
        {options.map((option) => {
          const active = visualPrefs.tabHubIcon === option.key;
          const source = TAB_HUB_ICON_SOURCES[option.key];
          if (!source) return null;
          return (
            <TouchableOpacity
              key={option.key}
              style={styles.iconGridItem}
              onPress={() => setVisualPreferences({ tabHubIcon: option.key })}
              activeOpacity={0.7}
            >
              {active ? (
                <IridescentRingCircle size={ICON_GRID_PILL_SIZE}>
                  <Image source={source} style={styles.iconGridImage} resizeMode="contain" />
                </IridescentRingCircle>
              ) : (
                <View style={styles.iconGridPillPlain}>
                  <Image source={source} style={styles.iconGridImage} resizeMode="contain" />
                </View>
              )}
              <Text style={[styles.iconGridLabel, active && styles.iconGridLabelActive]} numberOfLines={2}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // overrides lets a caller commit a value it just set via setMealTimeBuffers
  // in the same event handler. React state updates aren't applied
  // synchronously, so reading mealTimeBuffers[dayPart] right after calling
  // setMealTimeBuffers would still see the pre-update buffer (the AM/PM
  // pill press below does exactly this: it sets ampm and commits in the
  // same tap).
  function commitMealTime(dayPart: DayPart, overrides?: Partial<TimeOfDayInput>) {
    const buffer = { ...mealTimeBuffers[dayPart], ...overrides };
    const field = usualTimeFieldFor(dayPart);

    if (!buffer.hour && !buffer.minute && !buffer.ampm) {
      if (profile[field] != null) updateProfile({ [field]: null });
      return;
    }

    const time24 = buildTime24(buffer.hour, buffer.minute, buffer.ampm);
    if (!time24) return;
    updateProfile({ [field]: time24 });
  }

  function clearMealTime(dayPart: DayPart) {
    setMealTimeBuffers((current) => ({ ...current, [dayPart]: BLANK_TIME }));
    const field = usualTimeFieldFor(dayPart);
    if (profile[field] != null) updateProfile({ [field]: null });
  }

  function handleFastingToggle(enabled: boolean) {
    updateProfile({ fastingEnabled: enabled });
  }

  // See commitMealTime's comment: same stale-closure hazard, same fix.
  function commitEatingWindow(overrides?: { start?: Partial<TimeOfDayInput>; end?: Partial<TimeOfDayInput> }) {
    const startBuffer = { ...eatingWindowStartBuffer, ...overrides?.start };
    const endBuffer = { ...eatingWindowEndBuffer, ...overrides?.end };
    const start = buildTime24(startBuffer.hour, startBuffer.minute, startBuffer.ampm);
    const end = buildTime24(endBuffer.hour, endBuffer.minute, endBuffer.ampm);

    const startBlank = !startBuffer.hour && !startBuffer.minute && !startBuffer.ampm;
    const endBlank = !endBuffer.hour && !endBuffer.minute && !endBuffer.ampm;

    if (startBlank && endBlank) {
      if (profile.eatingWindowStart != null || profile.eatingWindowEnd != null) {
        updateProfile({ eatingWindowStart: null, eatingWindowEnd: null });
      }
      return;
    }

    // Only commits once both ends are valid: a half-entered window (e.g.
    // start typed, end not yet) would otherwise briefly become an enforced
    // constraint that blocks every single Schedule save.
    if (!start || !end) return;
    updateProfile({ eatingWindowStart: start, eatingWindowEnd: end });
  }

  function clearEatingWindow() {
    setEatingWindowStartBuffer(BLANK_TIME);
    setEatingWindowEndBuffer(BLANK_TIME);
    if (profile.eatingWindowStart != null || profile.eatingWindowEnd != null) {
      updateProfile({ eatingWindowStart: null, eatingWindowEnd: null });
    }
  }

  function handleMeasurementSystemChange(next: MeasurementSystem) {
    setMeasurementSystem(next);
    setStoredMeasurementSystem(next).catch(() => {});

    // Re-populate the height fields in the new unit rather than leaving
    // stale text in the input that no longer matches what's displayed.
    if (profile.heightCm != null) {
      if (next === 'imperial') {
        const { feet, inches } = cmToFeetInches(profile.heightCm);
        setHeightFeetInput(String(feet));
        setHeightInchesInput(String(inches));
      } else {
        setHeightCmInput(String(Math.round(profile.heightCm)));
      }
    }
  }

  // Profile has no TabHub of its own (it's a Stack push outside the (tabs)
  // group entirely, see app/_layout.tsx), so this is its only way back, on
  // both the loading and loaded states. Bottom-center, the exact spot
  // TabHub's button would occupy on a tab screen, so it lands in the same
  // "reach here with your thumb" zone as everywhere else in the app.
  const closeButton = (
    <TouchableOpacity
      style={[styles.closeButton, { bottom: insets.bottom + FLOATING_BUTTON_BOTTOM_OFFSET }]}
      onPress={() => router.back()}
      activeOpacity={0.85}
      accessibilityLabel="Close profile"
    >
      <Ionicons name="close" size={28} color={colors.textOnPrimary} />
    </TouchableOpacity>
  );

  // 2026-08-08, explicitly requested: Profile's background should follow
  // the shared "Generic" background choice (see the Shared background
  // card below) when that's what's selected, rather than always staying
  // the plain flat colors.background it always has. Otherwise (Photo or
  // Off) it stays exactly that same flat color, matching the
  // header/footer, same as before. Profile never shows the Photo option
  // itself (it has no background image of its own, and isn't one of the
  // per-tab GatedTabContent screens); only Generic is followed here.
  const showGenericBackground = visualPrefs.homeBackgroundStyle === 'generic';

  // TabHub's personalizable icon, 2026-08-09: "make it so each icon is
  // available in the user profile to choose to use in the TabHub menu icon
  // position." Originally: the default butterfly always led the list;
  // every built/in_progress condition followed, reusing the exact same
  // "Your conditions" filter (status !== 'planned') and
  // CONDITION_CODE_TO_DIGEST_KEY lookup that card already uses just below,
  // not a second, separately derived condition list. The
  // TAB_HUB_ICON_SOURCES truthiness check is a defensive guard, not just
  // belt-and-suspenders: it's what keeps a future condition added to the
  // `conditions` table but without its own icon yet from silently showing
  // a broken/blank option here.
  //
  // 2026-08-14, direct follow-up to the same day's 8-garden-icon addition:
  // "Make the Default TabHub icon be the Honeybee, and rename the Default
  // to Graves' / Hashimoto's and put it within the condition icons in
  // alphabetical order." The plain butterfly's `'default'` key is
  // unchanged (still `TAB_HUB_ICON_SOURCES.default`, still the same
  // artwork); only its label and its position in this picker changed: it
  // no longer leads the list on its own, it's an explicitly labeled
  // "Graves' / Hashimoto's" entry sorted alphabetically among the
  // condition options below (matching the app's already-established
  // "generically representing either Hashimoto's or Graves'" framing for
  // this specific artwork). The app's actual out-of-the-box choice
  // (DEFAULT_VISUAL_PREFERENCES.tabHubIcon, lib/visualPreferences.ts) moved
  // to 'honeybee' the same day, so a first-ever launch now shows the
  // Honeybee, not the butterfly.
  // 2026-08-14: split from one flat, concatenated tabHubIconOptions array
  // into 3 separately-rendered groups, direct request alongside the
  // 38-animal addition below: "separate the [conditions] from the insects
  // and others that [are] not part of the conditions, and place all of
  // these new ones into their own group, too." Each group keeps its own
  // independently-sorted array, rendered as 3 distinct labeled sections in
  // the picker below, not merged into one list the way this used to work.
  //
  // 2026-08-12, direct request: "Create new TabHub menu icons from these 8
  // new images... available to be selected to be the TabHub icon." Garden
  // and pollinator wildlife, not tied to any tracked condition; the app's
  // out-of-the-box choice, Honeybee, lives in here.
  const gardenIconOptions: { key: TabHubIconChoice; label: string }[] = [
    { key: 'honeybee', label: 'Honeybee' },
    { key: 'bumblebee', label: 'Bumblebee' },
    { key: 'dragonfly', label: 'Dragonfly' },
    { key: 'hummingbird', label: 'Hummingbird' },
    { key: 'treeFrog', label: 'Tree Frog' },
    { key: 'monarchButterfly', label: 'Monarch Butterfly' },
    { key: 'ladybug', label: 'Ladybug' },
    { key: 'prayingMantis', label: 'Praying Mantis' },
  ];
  gardenIconOptions.sort((a, b) => a.label.localeCompare(b.label));
  // 2026-08-14: 38 individually cropped animal-head portraits, its own
  // distinct third group, deliberately separate from the 8
  // insects/pollinators above, per the same direct request. Hand-listed
  // (not derived from anything, since none of these map to a tracked
  // condition or a Digest category the way the group below does), sorted
  // alphabetically the same way every other group here already is.
  const animalIconOptions: { key: TabHubIconChoice; label: string }[] = [
    { key: 'badger', label: 'Badger' },
    { key: 'bear', label: 'Bear' },
    { key: 'beaver', label: 'Beaver' },
    { key: 'bengalCat', label: 'Bengal Cat' },
    { key: 'bison', label: 'Bison' },
    { key: 'blackCat', label: 'Black Cat' },
    { key: 'borderCollie', label: 'Border Collie' },
    { key: 'canadaGoose', label: 'Canada Goose' },
    { key: 'cavalierKingCharlesSpaniel', label: 'Cavalier King Charles Spaniel' },
    { key: 'chipmunk', label: 'Chipmunk' },
    { key: 'cow', label: 'Cow' },
    { key: 'deer', label: 'Deer' },
    { key: 'donkey', label: 'Donkey' },
    { key: 'elephant', label: 'Elephant' },
    { key: 'frenchBulldog', label: 'French Bulldog' },
    { key: 'germanShepherd', label: 'German Shepherd' },
    { key: 'goat', label: 'Goat' },
    { key: 'goldenRetriever', label: 'Golden Retriever' },
    { key: 'grayTabbyCat', label: 'Gray Tabby Cat' },
    { key: 'horse', label: 'Horse' },
    { key: 'iguana', label: 'Iguana' },
    { key: 'labradorRetriever', label: 'Labrador Retriever' },
    { key: 'lion', label: 'Lion' },
    { key: 'maineCoon', label: 'Maine Coon' },
    { key: 'mallardDuck', label: 'Mallard Duck' },
    { key: 'orangeTabbyCat', label: 'Orange Tabby Cat' },
    { key: 'persianCat', label: 'Persian Cat' },
    { key: 'pig', label: 'Pig' },
    { key: 'rabbit', label: 'Rabbit' },
    { key: 'ragdollCat', label: 'Ragdoll Cat' },
    { key: 'rhino', label: 'Rhino' },
    { key: 'russianBlueCat', label: 'Russian Blue Cat' },
    { key: 'sheep', label: 'Sheep' },
    { key: 'siameseCat', label: 'Siamese Cat' },
    { key: 'sphynxCat', label: 'Sphynx Cat' },
    { key: 'squirrel', label: 'Squirrel' },
    { key: 'tiger', label: 'Tiger' },
    { key: 'wolf', label: 'Wolf' },
  ];
  animalIconOptions.sort((a, b) => a.label.localeCompare(b.label));
  // 2026-08-14: a new 4th group, Food tab builder icons, starting with
  // Dessert Builder (components/FoodBuilderIcons.tsx), the first
  // hand-drawn vector icon this picker has ever offered rather than a
  // cropped photo (see that file's header comment). Neither a tracked
  // condition, a pollinator, nor an animal, so it doesn't belong in any of
  // the three groups above; an honest 4th group of its own.
  const foodBuilderIconOptions: { key: TabHubIconChoice; label: string }[] = [
    { key: 'dessertBuilder', label: 'Dessert Builder (Cupcake)' },
  ];
  // 2026-08-19: a new 5th group, just the one seed icon, the app's actual
  // out-of-the-box default (see TabHubIconChoice's comment in
  // lib/visualPreferences.ts). Deliberately its own group, not folded into
  // conditionIconOptions the way the old 'default' butterfly entry is: the
  // seed isn't a stand-in for any tracked condition the way the butterfly
  // still is, it's the app's identity, so it gets top billing of its own
  // rather than sitting alphabetized among 19 condition names. A second,
  // shorter-stemmed 'seed' entry existed here briefly (2026-08-19 through
  // 2026-08-21) alongside this one; removed outright, direct instruction:
  // "remove the other seed icon from the app entirely, make the new seed
  // icon the default." The key stays 'seedTall' (not renamed to 'seed'),
  // see TabHubIconChoice's comment for why.
  const appIconOptions: { key: TabHubIconChoice; label: string }[] = [
    { key: 'seedTall', label: 'Seed (App Default)' },
  ];
  // 2026-08-14: the renamed former "Default" entry (the plain butterfly, key
  // unchanged at 'default') is seeded in here by hand, not derived from
  // allConditions the way every other entry below it is: it doesn't map to
  // any single tracked condition, it's a permanent, generic "either one"
  // option, and it sorts alphabetically alongside the condition options
  // rather than needing its own special leading slot.
  const conditionIconOptions: { key: TabHubIconChoice; label: string }[] = [
    { key: 'default', label: "Graves' / Hashimoto's" },
  ];
  for (const condition of allConditions) {
    if (condition.status === 'planned') continue;
    const digestKey = CONDITION_CODE_TO_DIGEST_KEY[condition.code];
    if (digestKey && TAB_HUB_ICON_SOURCES[digestKey]) {
      conditionIconOptions.push({ key: digestKey, label: condition.name });
    }
  }
  conditionIconOptions.sort((a, b) => a.label.localeCompare(b.label));

  if (loading) {
    return (
      <View style={[styles.loadingContainer, showGenericBackground && styles.transparentBackground]}>
        <View style={styles.opaqueBase} pointerEvents="none" />
        {showGenericBackground ? <GenericBackground palette={visualPrefs.genericPalette} /> : null}
        <ActivityIndicator />
        {closeButton}
      </View>
    );
  }

  const currentAge = profile.birthDate ? ageFromBirthDate(profile.birthDate) : null;

  return (
    <View style={[styles.wrapper, showGenericBackground && styles.transparentBackground]}>
    {/* 2026-08-21, direct report (twice) that the shared background behind
        Profile, including its footer divider line, was visibly showing
        through here. `contentStyle` on the root Stack was tried first (see
        app/_layout.tsx) and reported as not fixing it. This is the second,
        more direct attempt: an unconditional, always-opaque colors.background
        layer, painted first, before GenericBackground and before anything
        else in this screen's tree, not gated by showGenericBackground the
        way wrapper/screen's backgrounds are, so there's no code path in
        this component where nothing opaque has painted yet. If this still
        doesn't fix it, the leak isn't coming from anywhere in Profile's
        render tree at all, and points at something at the native
        navigation-container level this app's code can't reach. */}
    <View style={styles.opaqueBase} pointerEvents="none" />
    {showGenericBackground ? <GenericBackground palette={visualPrefs.genericPalette} /> : null}
    {/* 2026-08-21, direct request: the native header (with its own back
        arrow) is gone (see app/_layout.tsx's profile Stack.Screen comment).
        This bar takes over both jobs that header used to do: reserving the
        safe-area top inset, and keeping "Profile" plus its info button
        always visible. Sitting as a plain, non-absolute sibling before the
        ScrollView (not overlaid on top of it) is what makes the rest of
        the page "scroll up under it": the ScrollView below only gets
        whatever height remains once this bar's own space is taken, so
        scrolled content's top edge simply disappears at this bar's bottom
        edge, the same visual effect an overlaid sticky header would give,
        without needing one. */}
    <View style={[styles.stickyTitleBar, { paddingTop: insets.top + 12 }, showGenericBackground && styles.transparentBackground]}>
      <View style={styles.profileTitleRow}>
        <Text style={styles.profileTitle}>Profile</Text>
        <HelpButton pageTitle="Profile" sections={PROFILE_HELP_SECTIONS} />
      </View>
    </View>
    <ScrollView
      style={[styles.screen, showGenericBackground && styles.transparentBackground]}
      contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}
    >
      <Text style={styles.intro}>
        Everything below is optional. This app works fine with nothing set here; unset fields simply mean
        you'll see recommendations for every applicable population instead of one tailored to you. Nothing here
        is guessed on your behalf.
      </Text>
      {savedFlash ? <Text style={styles.savedFlash}>Saved</Text> : null}

      {/* Personal Info, 2026-08-09, regrouped from 5 separate cards
          (Your name, Units, Sex, Birth date, Height) plus a new Weight
          field, all explicitly requested together. Every former card's
          label is kept as a subLabel heading within this one group's
          body. */}
      <View style={styles.card}>
        {renderCardHeader('personal-info', 'Personal Info')}
        {!collapsedSections.has('personal-info') ? (
          <View style={styles.cardBody}>
            <Text style={styles.subLabel}>Your name</Text>
            <Text style={styles.helpText}>
              Your first name shows in the header (e.g. &ldquo;Tony&apos;s Inside Story&rdquo;). Last name is also
              collected: one reason is for reports meant to be handed to a doctor, where both
              names read naturally together.
            </Text>
            {/* 2026-08-16, a mic button per field, nested inside its own
                small row rather than the shared dateRow itself (First and
                Last are two separate fields, so one mic sitting between
                them would be ambiguous about which it applies to). */}
            <View style={styles.dateRow}>
              <View style={styles.nameFieldWithMic}>
                <AppTextInput
                  style={[styles.input, styles.nameInput]}
                  placeholder="First name"
                  value={firstNameInput}
                  onChangeText={setFirstNameInput}
                  onBlur={commitFirstName}
                />
                <VoiceInputButton onResult={(transcript) => setFirstNameInput(transcript)} />
              </View>
              <View style={styles.nameFieldWithMic}>
                <AppTextInput
                  style={[styles.input, styles.nameInput]}
                  placeholder="Last name"
                  value={lastNameInput}
                  onChangeText={setLastNameInput}
                  onBlur={commitLastName}
                />
                <VoiceInputButton onResult={(transcript) => setLastNameInput(transcript)} />
              </View>
            </View>

            <Text style={styles.subLabelDivided}>Units</Text>
            <Text style={styles.helpText}>
              Used across the app for quantities and measurements: meal ingredient amounts, height, weight,
              and body measurements.
            </Text>
            <View style={styles.pillRow}>
              {([
                { value: 'metric' as const, label: 'Metric (cm, ml, g)' },
                { value: 'imperial' as const, label: 'Imperial (ft/in, oz, cup)' },
              ]).map((option) => {
                const active = option.value === measurementSystem;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.pillSmall, active && styles.pillActive]}
                    onPress={() => handleMeasurementSystemChange(option.value)}
                  >
                    <Text style={[styles.pillTextSmall, active && styles.pillTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.subLabelDivided}>Sex</Text>
            <Text style={styles.helpText}>
              Used only to show sex-specific nutrient targets (RDAs) where they differ. This app is
              otherwise gender-neutral by design.
            </Text>
            <View style={styles.pillRow}>
              {([
                { value: null, label: 'Not set' },
                { value: 'female' as const, label: 'Female' },
                { value: 'male' as const, label: 'Male' },
              ]).map((option) => {
                const active = option.value === profile.sex;
                return (
                  <TouchableOpacity
                    key={option.label}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => handleSexSelect(option.value)}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.subLabelDivided}>Birth date</Text>
            <Text style={styles.helpText}>
              Used to show age-appropriate nutrient targets (some, like iron and calcium, change meaningfully with
              age). Stored as a date rather than a fixed age so it stays accurate over time.
            </Text>
            <View style={styles.dateRow}>
              <PickerField label="Year">
                <PopoverSelect
                  options={BIRTH_YEAR_OPTIONS}
                  selected={birthYear || null}
                  minWidth={72}
                  tabColor={colors.menuIconMuted}
                  tintedSurface
                  onSelect={(value) => {
                    setBirthYear(value);
                    commitBirthDate({ year: value });
                  }}
                />
              </PickerField>
              <PickerField label="Month">
                <PopoverSelect
                  options={BIRTH_MONTH_OPTIONS}
                  selected={birthMonth || null}
                  minWidth={52}
                  tabColor={colors.menuIconMuted}
                  tintedSurface
                  onSelect={(value) => {
                    setBirthMonth(value);
                    commitBirthDate({ month: value });
                  }}
                />
              </PickerField>
              <PickerField label="Day">
                <PopoverSelect
                  options={BIRTH_DAY_OPTIONS}
                  selected={birthDay || null}
                  minWidth={52}
                  tabColor={colors.menuIconMuted}
                  tintedSurface
                  onSelect={(value) => {
                    setBirthDay(value);
                    commitBirthDate({ day: value });
                  }}
                />
              </PickerField>
              <TouchableOpacity onPress={clearBirthDate} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
            {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
            {currentAge != null ? <Text style={styles.derivedText}>Current age: {currentAge}</Text> : null}

            <Text style={styles.subLabelDivided}>Height</Text>
            <Text style={styles.helpText}>
              Used for the step-counter's distance estimate, and useful alongside the rest of this section for a
              doctor report. Follows your Units setting above.
            </Text>
            <View style={styles.dateRow}>
              {measurementSystem === 'imperial' ? (
                <>
                  <PickerField label="Feet">
                    <PopoverSelect
                      options={HEIGHT_FEET_OPTIONS}
                      selected={heightFeetInput || null}
                      minWidth={52}
                      tabColor={colors.menuIconMuted}
                      tintedSurface
                      onSelect={(value) => {
                        setHeightFeetInput(value);
                        commitHeight({ feet: value });
                      }}
                    />
                  </PickerField>
                  <PickerField label="Inches">
                    <PopoverSelect
                      options={HEIGHT_INCHES_OPTIONS}
                      selected={heightInchesInput || null}
                      minWidth={52}
                      tabColor={colors.menuIconMuted}
                      tintedSurface
                      onSelect={(value) => {
                        setHeightInchesInput(value);
                        commitHeight({ inches: value });
                      }}
                    />
                  </PickerField>
                </>
              ) : (
                <PickerField label="Centimeters">
                  <PopoverSelect
                    options={HEIGHT_CM_OPTIONS}
                    selected={heightCmInput || null}
                    minWidth={72}
                    tabColor={colors.menuIconMuted}
                    tintedSurface
                    onSelect={(value) => {
                      setHeightCmInput(value);
                      commitHeight({ cm: value });
                    }}
                  />
                </PickerField>
              )}
              <TouchableOpacity onPress={clearHeight} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subLabelDivided}>Weight</Text>
            <Text style={styles.helpText}>
              Your current weight, also useful for a doctor report. Each time you set it here, it&apos;s logged as
              a new reading (the same way a weight-tracking history works), not just overwritten; a full
              trend view isn&apos;t built yet, but even one current reading is useful right away. Follows your
              Units setting above.
            </Text>
            <View style={styles.dateRow}>
              {measurementSystem === 'imperial' ? (
                <PickerField label="Pounds">
                  <PopoverSelect
                    options={WEIGHT_LB_OPTIONS}
                    selected={weightLbInput || null}
                    minWidth={64}
                    tabColor={colors.menuIconMuted}
                    tintedSurface
                    searchable
                    onSelect={(value) => {
                      setWeightLbInput(value);
                      commitWeight({ lb: value });
                    }}
                  />
                </PickerField>
              ) : (
                <PickerField label="Kilograms">
                  <PopoverSelect
                    options={WEIGHT_KG_OPTIONS}
                    selected={weightKgInput || null}
                    minWidth={64}
                    tabColor={colors.menuIconMuted}
                    tintedSurface
                    searchable
                    onSelect={(value) => {
                      setWeightKgInput(value);
                      commitWeight({ kg: value });
                    }}
                  />
                </PickerField>
              )}
            </View>

            <Text style={styles.subLabelDivided}>Activity Level</Text>
            <Text style={styles.helpText}>
              Feeds Insights&apos; Energy &amp; Portions lens: how much you move day to day, alongside your
              weight above, is what turns a plain calorie estimate into a target that actually fits your own body.
            </Text>
            <View style={styles.pillRow}>
              {([{ value: null, label: 'Not set' }] as { value: TriState<ActivityLevel>; label: string }[])
                .concat(ACTIVITY_LEVELS.map((level) => ({ value: level, label: ACTIVITY_LEVEL_INFO[level].label })))
                .map((option) => {
                  const active = option.value === profile.activityLevel;
                  return (
                    <TouchableOpacity
                      key={option.label}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => handleActivityLevelSelect(option.value)}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
            {profile.activityLevel ? (
              <Text style={styles.derivedText}>{ACTIVITY_LEVEL_INFO[profile.activityLevel].description}</Text>
            ) : null}

            <Text style={styles.subLabelDivided}>Growing Zone</Text>
            <Text style={styles.helpText}>
              Your USDA Plant Hardiness Zone (e.g. &quot;7a&quot;): powers the Garden tab&apos;s
              cited crop guidance for your climate. Picking it here only sets the zone letter itself, not a
              location, so Home&apos;s weather/sunrise/sunset section stays off until you set your postal code
              in Garden&apos;s My Zone lens, which sets both at once.
            </Text>
            <View style={styles.dateRow}>
              <PickerField label="Zone">
                <PopoverSelect
                  options={USDA_ZONES}
                  selected={profile.growingZone}
                  minWidth={64}
                  tabColor={colors.menuIconMuted}
                  tintedSurface
                  onSelect={(value) => {
                    setProfile((current) => ({ ...current, growingZone: value }));
                    setUserProfile({ growingZone: value });
                  }}
                />
              </PickerField>
              <TouchableOpacity
                style={styles.growingZoneLinkButton}
                onPress={() => router.push({ pathname: '/garden', params: { openGardenLens: 'myZone' } })}
              >
                <Text style={styles.growingZoneLinkText}>Find My Zone →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

      {/* Meal Timing, 2026-08-09, regrouped from 2 separate cards (Usual
          meal times, Fasting/eating window), explicitly requested
          together. */}
      <View style={styles.card}>
        {renderCardHeader('meal-schedule', 'Meal Timing')}
        {!collapsedSections.has('meal-schedule') ? (
          <View style={styles.cardBody}>
            <Text style={styles.subLabel}>Usual meal times</Text>
            <Text style={styles.helpText}>
              About what time you normally eat each one. Used to pre-fill the time when you schedule that meal type
              on the Schedule tab; you can always change it there.
            </Text>
            {DAY_PARTS.map((dayPart) => (
              <View key={dayPart} style={styles.mealTimeRow}>
                <Text style={styles.mealTimeLabel}>{dayPart[0].toUpperCase() + dayPart.slice(1)}</Text>
                <View style={styles.dateRow}>
                  <PickerField label="Hour">
                    <PopoverSelect
                      options={HOUR_OPTIONS}
                      selected={mealTimeBuffers[dayPart].hour || null}
                      minWidth={48}
                      tabColor={colors.menuIconMuted}
                      tintedSurface
                      onSelect={(value) => {
                        setMealTimeBuffers((current) => ({ ...current, [dayPart]: { ...current[dayPart], hour: value } }));
                        commitMealTime(dayPart, { hour: value });
                      }}
                    />
                  </PickerField>
                  <PickerField label="Minute">
                    <PopoverSelect
                      options={MINUTE_OPTIONS}
                      selected={mealTimeBuffers[dayPart].minute || null}
                      minWidth={52}
                      tabColor={colors.menuIconMuted}
                      tintedSurface
                      onSelect={(value) => {
                        setMealTimeBuffers((current) => ({ ...current, [dayPart]: { ...current[dayPart], minute: value } }));
                        commitMealTime(dayPart, { minute: value });
                      }}
                    />
                  </PickerField>
                  <View style={styles.pillRow}>
                    {(['AM', 'PM'] as const).map((option) => {
                      const active = mealTimeBuffers[dayPart].ampm === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[styles.pillSmall, active && styles.pillActive]}
                          onPress={() => {
                            setMealTimeBuffers((current) => ({ ...current, [dayPart]: { ...current[dayPart], ampm: option } }));
                            commitMealTime(dayPart, { ampm: option });
                          }}
                        >
                          <Text style={[styles.pillTextSmall, active && styles.pillTextActive]}>{option}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity onPress={() => clearMealTime(dayPart)} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={styles.subLabelDivided}>Fasting / eating window</Text>
            <Text style={styles.helpText}>
              If you do intermittent fasting, set the window you actually eat within. Once both times are set here,
              the Schedule tab won't let you schedule a meal outside that window.
            </Text>
            <View style={styles.pillRow}>
              {([
                { value: false, label: "I'm not fasting" },
                { value: true, label: "I'm doing intermittent fasting" },
              ]).map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.pill, profile.fastingEnabled === option.value && styles.pillActive]}
                  onPress={() => handleFastingToggle(option.value)}
                >
                  <Text style={[styles.pillText, profile.fastingEnabled === option.value && styles.pillTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {profile.fastingEnabled ? (
              <>
                <Text style={styles.subLabel}>Eating window starts</Text>
                <View style={styles.dateRow}>
                  <PickerField label="Hour">
                    <PopoverSelect
                      options={HOUR_OPTIONS}
                      selected={eatingWindowStartBuffer.hour || null}
                      minWidth={48}
                      tabColor={colors.menuIconMuted}
                      tintedSurface
                      onSelect={(value) => {
                        setEatingWindowStartBuffer((current) => ({ ...current, hour: value }));
                        commitEatingWindow({ start: { hour: value } });
                      }}
                    />
                  </PickerField>
                  <PickerField label="Minute">
                    <PopoverSelect
                      options={MINUTE_OPTIONS}
                      selected={eatingWindowStartBuffer.minute || null}
                      minWidth={52}
                      tabColor={colors.menuIconMuted}
                      tintedSurface
                      onSelect={(value) => {
                        setEatingWindowStartBuffer((current) => ({ ...current, minute: value }));
                        commitEatingWindow({ start: { minute: value } });
                      }}
                    />
                  </PickerField>
                  <View style={styles.pillRow}>
                    {(['AM', 'PM'] as const).map((option) => {
                      const active = eatingWindowStartBuffer.ampm === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[styles.pillSmall, active && styles.pillActive]}
                          onPress={() => {
                            setEatingWindowStartBuffer((current) => ({ ...current, ampm: option }));
                            commitEatingWindow({ start: { ampm: option } });
                          }}
                        >
                          <Text style={[styles.pillTextSmall, active && styles.pillTextActive]}>{option}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <Text style={styles.subLabel}>Eating window ends</Text>
                <View style={styles.dateRow}>
                  <PickerField label="Hour">
                    <PopoverSelect
                      options={HOUR_OPTIONS}
                      selected={eatingWindowEndBuffer.hour || null}
                      minWidth={48}
                      tabColor={colors.menuIconMuted}
                      tintedSurface
                      onSelect={(value) => {
                        setEatingWindowEndBuffer((current) => ({ ...current, hour: value }));
                        commitEatingWindow({ end: { hour: value } });
                      }}
                    />
                  </PickerField>
                  <PickerField label="Minute">
                    <PopoverSelect
                      options={MINUTE_OPTIONS}
                      selected={eatingWindowEndBuffer.minute || null}
                      minWidth={52}
                      tabColor={colors.menuIconMuted}
                      tintedSurface
                      onSelect={(value) => {
                        setEatingWindowEndBuffer((current) => ({ ...current, minute: value }));
                        commitEatingWindow({ end: { minute: value } });
                      }}
                    />
                  </PickerField>
                  <View style={styles.pillRow}>
                    {(['AM', 'PM'] as const).map((option) => {
                      const active = eatingWindowEndBuffer.ampm === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[styles.pillSmall, active && styles.pillActive]}
                          onPress={() => {
                            setEatingWindowEndBuffer((current) => ({ ...current, ampm: option }));
                            commitEatingWindow({ end: { ampm: option } });
                          }}
                        >
                          <Text style={[styles.pillTextSmall, active && styles.pillTextActive]}>{option}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity onPress={clearEatingWindow} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>

                {profile.eatingWindowStart && profile.eatingWindowEnd ? (
                  <Text style={styles.derivedText}>
                    Enforced window: {formatTime12(profile.eatingWindowStart)} - {formatTime12(profile.eatingWindowEnd)}
                  </Text>
                ) : (
                  <Text style={styles.derivedText}>Set both times above to start enforcing this window.</Text>
                )}
              </>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Conditions & Check-In, 2026-08-09, regrouped from 3 separate
          cards (Your conditions, Where you're at, plus a brand-new Food
          Allergies sub-section) explicitly requested together. */}
      <View style={styles.card}>
        {renderCardHeader('conditions', 'Conditions & Check-In')}
        {!collapsedSections.has('conditions') ? (
          <View style={styles.cardBody}>
            <Text style={styles.subLabel}>Your conditions</Text>
            <Text style={styles.helpText}>
              Select every condition that applies to you: this tells the app which condition-specific notes,
              scoring, and medications are relevant to you personally. Multiple selections are fully supported;
              having more than one is common.
            </Text>
            {/* An even 2-column grid, 2026-08-21, direct report: the plain
                pillRow every other picker on this screen uses (flexWrap
                with content-sized pills) reads fine for a shorter list,
                but with 19 condition names of wildly different lengths
                ("Gout" next to "Inflammatory Bowel Disease"), the pills
                packed left-to-right and wrapped wherever they happened to
                fit, never lining up into rows or columns. Scoped to just
                this one list (conditionGrid/conditionGridItem/conditionPill
                below) rather than changing pillRow itself, which every
                other picker on this screen still uses unchanged: those
                lists are shorter and more even, and weren't part of this
                report. Still the same pill look/colors
                (styles.pill/pillActive/pillText/pillTextActive, reused
                directly), just each one now sits in a fixed-width
                half-card cell instead of sizing to its own text, so two
                per row always line up with the row below regardless of
                how long either name is. */}
            <View style={styles.conditionGrid}>
              {allConditions
                .filter((condition) => condition.status !== 'planned')
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((condition) => {
                  const active = selectedConditions.includes(condition.code);
                  return (
                    <View key={condition.code} style={styles.conditionGridItem}>
                      <TouchableOpacity
                        style={[styles.pill, styles.conditionPill, active && styles.pillActive]}
                        onPress={() => toggleCondition(condition.code)}
                      >
                        <Text style={[styles.pillText, styles.conditionPillText, active && styles.pillTextActive]}>
                          {condition.name}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
            </View>
            {allConditions.some((condition) => condition.status === 'planned') ? (
              <Text style={[styles.helpText, { marginTop: 10 }]}>
                Coming soon: {allConditions
                  .filter((condition) => condition.status === 'planned')
                  .map((condition) => condition.name)
                  .sort((a, b) => a.localeCompare(b))
                  .join(', ')}
              </Text>
            ) : null}

            {/* Curious about other conditions, 2026-08-23, direct request:
                "They might be curious or worried about it for themselves or
                worried about it for someone else and just want to learn.
                However, this shouldn't mean that those conditions are now
                added to their own that the app tracks and helps with."
                Deliberately a separate list/table from the picker above,
                not a second meaning layered onto the same pills -- see
                curiousAboutConditions' own comment near this screen's own
                state declarations. Feeds Home's own Digest flip cards
                (app/(tabs)/index.tsx), which otherwise only draw from
                Basic Health and the person's own selected conditions
                above. Excludes whatever's already selected as one's own
                just above, so the same condition is never offered in both
                lists at once. Same conditionGrid layout reused directly. */}
            <Text style={styles.subLabelDivided}>Curious about other conditions</Text>
            <Text style={styles.helpText}>
              Learn about a condition without adding it to what this app tracks and helps with for you personally,
              whether you are wondering about yourself or someone else. Anything selected here can also show up
              among the Home tab&apos;s own Digest flip cards.
            </Text>
            <View style={styles.conditionGrid}>
              {allConditions
                .filter((condition) => condition.status !== 'planned' && !selectedConditions.includes(condition.code))
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((condition) => {
                  const active = curiousAboutConditions.includes(condition.code);
                  return (
                    <View key={condition.code} style={styles.conditionGridItem}>
                      <TouchableOpacity
                        style={[styles.pill, styles.conditionPill, active && styles.pillActive]}
                        onPress={() => toggleCuriousAboutCondition(condition.code)}
                      >
                        <Text style={[styles.pillText, styles.conditionPillText, active && styles.pillTextActive]}>
                          {condition.name}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
            </View>

            {/* Food allergies, 2026-08-09, explicitly requested: "Add to
                conditions area an ability to provide food allergies. They
                might have multiple." A separate `user_food_allergies`
                table (lib/db.ts), deliberately not folded into
                user_conditions, since an allergy isn't a tracked disease. */}
            <Text style={styles.subLabelDivided}>Food allergies</Text>
            <Text style={styles.helpText}>
              Separate from the condition-based food scoring above: an allergy or intolerance, not a
              preference. Multiple are fully supported. Tap a common allergen below, or add your own.
            </Text>
            <View style={styles.pillRow}>
              {COMMON_ALLERGENS.map((name) => {
                const active = foodAllergies.includes(name);
                return (
                  <TouchableOpacity
                    key={name}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => (active ? removeAllergy(name) : addAllergy(name))}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.dateRow}>
              <AppTextInput
                style={[styles.input, styles.nameInput]}
                placeholder="Add another allergen..."
                value={allergyInput}
                onChangeText={setAllergyInput}
              />
              <VoiceInputButton onResult={(transcript) => setAllergyInput(transcript)} />
              <TouchableOpacity style={styles.addAllergyButton} onPress={() => addAllergy(allergyInput)}>
                <Text style={styles.addAllergyButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            {foodAllergies.filter((name) => !COMMON_ALLERGENS.includes(name)).length > 0 ? (
              <View style={[styles.pillRow, { marginTop: 8 }]}>
                {foodAllergies
                  .filter((name) => !COMMON_ALLERGENS.includes(name))
                  .slice()
                  .sort((a, b) => a.localeCompare(b))
                  .map((name) => (
                    <TouchableOpacity
                      key={name}
                      style={[styles.pill, styles.pillActive]}
                      onPress={() => removeAllergy(name)}
                    >
                      <Text style={[styles.pillText, styles.pillTextActive]}>{name} ✕</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            ) : null}

            {selectedConditions.includes('hashimotos') ? (
              <>
                <Text style={styles.subLabelDivided}>Where you're at</Text>
                <Text style={styles.helpText}>
                  A short check-in covering hypothyroid symptoms, digestive/IBS symptoms, and overall wellbeing.
                  Early on, day-to-day change can feel invisible because everything is happening at once; this
                  is what turns that into an actual, visible trend over time.
                </Text>
                {lastAssessment ? (
                  <Text style={styles.derivedText}>Last taken {daysAgoLabel(lastAssessment.completedAt)}.</Text>
                ) : (
                  <Text style={styles.derivedText}>You haven't taken this yet. Your first one becomes your baseline.</Text>
                )}
                <TouchableOpacity style={styles.checkinButton} onPress={() => router.push('/assessment')}>
                  <Text style={styles.checkinButtonText}>
                    {lastAssessment ? 'Retake check-in' : 'Take your first check-in'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}

            {/* Condition stages, 2026-08-09, generalized from the
                original Hashimoto's-only "Healing stage" section
                (decided 2026-07-31) after direct instruction: "Healing
                stages for all 18 others need to have theirs built in
                too." An honest registry (lib/conditionStages.ts): only
                conditions with an actual, citable staged-food framework
                get an entry here (Hashimoto's five-stage Wentz framework,
                IBS's low-FODMAP elimination/reintroduction/personalization
                protocol as of this date). Most of the other 16 don't have
                one yet and are correctly absent, not force-fit. Each
                advisory function (lib/healingStageAdvisory.ts,
                lib/ibsPhaseAdvisory.ts) is combined by the shared
                dispatcher (lib/conditionStageAdvisory.ts), wired into
                every direct-ingredient Food builder. Advisory and
                reordering only, never gating: tap an already-selected
                stage again to clear it back to "not declared." */}
            {CONDITION_STAGING_MODELS.filter((model) => selectedConditions.includes(model.conditionCode)).map(
              (model) => {
                const currentStageCode = conditionStageMap[model.conditionCode] ?? null;
                const currentStageDef = model.stages.find((stage) => stage.code === currentStageCode) ?? null;
                return (
                  <View key={model.conditionCode}>
                    <Text style={styles.subLabelDivided}>{model.conditionLabel} stage</Text>
                    <Text style={styles.helpText}>
                      {model.frameworkName}. {model.frameworkNote} Purely advisory: your food builders will start
                      surfacing a tappable note on foods worth a second look for your current stage;
                      nothing is ever hidden or blocked based on this. See the matching category in Digest
                      for the full, cited detail.
                    </Text>
                    <View style={styles.pillRow}>
                      {model.stages.map((stage) => {
                        const active = currentStageCode === stage.code;
                        return (
                          <TouchableOpacity
                            key={stage.code}
                            style={[styles.pill, active && styles.pillActive]}
                            onPress={() => handleSetConditionStage(model.conditionCode, active ? null : stage.code)}
                          >
                            <Text style={[styles.pillText, active && styles.pillTextActive]}>{stage.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Text style={styles.derivedText}>
                      {currentStageDef
                        ? currentStageDef.shortDescription
                        : "Not declared. Tap a stage above if you'd like to."}
                    </Text>
                  </View>
                );
              },
            )}

            {/* Already-tested-foods review, 2026-08-14, direct request:
                someone with established experience for a condition
                shouldn't have to re-run the full testing loop for
                something they already know the answer to. Only shows for
                a selected condition with a curated concern list (see
                lib/conditionFoodConcerns.ts: Hashimoto's only, as of this
                date; every other condition is correctly absent until its
                own list is researched, not force-fit). "Already
                tolerate"/"Already avoid" write an already-resolved
                food_trials row with no reminder series attached; "put back
                into testing" reopens it, with a fresh reminder series, the
                same reopen mechanism Signals' New Foods lens uses. */}
            {selectedConditions
              .map((code) => ({ code, concerns: getConditionFoodConcerns(code) }))
              .filter((entry): entry is { code: string; concerns: ConditionFoodConcern[] } => entry.concerns !== null)
              .map(({ code, concerns }) => {
                const conditionLabel = allConditions.find((c) => c.code === code)?.name ?? code;
                const trials = conditionFoodConcernTrials[code] ?? [];
                return (
                  <View key={`concerns-${code}`}>
                    <Text style={styles.subLabelDivided}>Already tested foods: {conditionLabel}</Text>
                    <Text style={styles.helpText}>
                      Known foods worth a second look for this condition. If you already know from
                      experience whether you tolerate one, mark it here instead of running the full testing loop
                      again. You can always put it back into testing later.
                    </Text>
                    {concerns.map((concern) => {
                      const trial = trials.find((t) => t.foodName === concern.label);
                      return (
                        <View key={concern.id} style={styles.concernRow}>
                          <Text style={styles.concernLabel}>{concern.label}</Text>
                          <Text style={styles.helpText}>{concern.shortNote}</Text>
                          {!trial ? (
                            <View style={styles.pillRow}>
                              <TouchableOpacity
                                style={styles.pill}
                                onPress={() => handleMarkConcern(concern, code, 'cleared')}
                              >
                                <Text style={styles.pillText}>Already tolerate this</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.pill}
                                onPress={() => handleMarkConcern(concern, code, 'flagged')}
                              >
                                <Text style={styles.pillText}>Already avoid this</Text>
                              </TouchableOpacity>
                            </View>
                          ) : trial.status === 'trialing' ? (
                            <Text style={styles.derivedText}>Currently being tested in Signals.</Text>
                          ) : (
                            <View style={styles.pillRow}>
                              <Text style={styles.derivedText}>
                                {trial.status === 'cleared' ? 'Marked: tolerated.' : 'Marked: avoiding.'}
                              </Text>
                              <TouchableOpacity onPress={() => handleReopenConcernTrial(trial.id, code)}>
                                <Text style={styles.concernReopenLink}>Not sure anymore? Put back into testing</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
          </View>
        ) : null}
      </View>

      {/* General Health Guidance, 2026-08-14, the general-health gradient's
          per-topic mute list (lib/generalHealthRules.ts/
          generalHealthPreferences.ts). Every topic starts shown (not
          muted); turning one off only hides it while actively building a
          meal. It never affects what Trends or a doctor-facing Report
          shows, since neither ever reads this preference, only the
          builders themselves do. */}
      <View style={styles.card}>
        {renderCardHeader('general-health', 'General Health Guidance')}
        {!collapsedSections.has('general-health') ? (
          <View style={styles.cardBody}>
            <Text style={styles.helpText}>
              These are condition-agnostic notes (glycemic impact, cooking method, portion size, and similar) that
              can show up while building a meal, regardless of which conditions you track. Turn any one off below if
              it&apos;s not useful to you. Your Trends and any report you generate still show the full picture
              either way; this only affects what appears while you&apos;re actively cooking.
            </Text>
            <View style={styles.pillRow}>
              {GENERAL_HEALTH_RULES.map((rule) => {
                const shown = !generalHealthPrefs.mutedTopics[rule.topicId];
                return (
                  <TouchableOpacity
                    key={rule.topicId}
                    style={[styles.pill, shown && styles.pillActive]}
                    onPress={() => toggleGeneralHealthTopic(rule.topicId)}
                  >
                    <Text style={[styles.pillText, shown && styles.pillTextActive]}>{rule.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      {/* Home Screen, 2026-08-21, direct request: "make it capable of
          turning on and off whatever the user wants to from the home
          screen so they are able to dial in on what they want to have
          available, and not whatever we decide to make them have all the
          time... they may end up wanting everything, or even nothing."
          Same per-topic toggle pattern as General Health Guidance right
          above, applied to Home's own real content sections instead of
          builder notes (see HomeSectionKey/HOME_SECTION_LABELS in
          lib/visualPreferences.ts for the full list and why absence of a
          key there means visible, not hidden -- the part of this design
          that lets a section added to Home later show up for everyone
          automatically). Home itself shows an honest message instead of a
          blank page if every one of these ends up off. */}
      <View style={styles.card}>
        {renderCardHeader('home-screen', 'Home Screen')}
        {!collapsedSections.has('home-screen') ? (
          <View style={styles.cardBody}>
            <Text style={styles.helpText}>
              Choose which of these show up on your Home tab. Turn off anything you don&apos;t use, this only
              changes what Home displays; nothing here is deleted, and any section can be turned back on any
              time.
            </Text>
            <View style={styles.pillRow}>
              {ALL_HOME_SECTION_KEYS.map((key) => {
                const shown = isHomeSectionVisible(visualPrefs, key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.pill, shown && styles.pillActive]}
                    onPress={() => toggleHomeSection(key)}
                  >
                    <Text style={[styles.pillText, shown && styles.pillTextActive]}>{HOME_SECTION_LABELS[key]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Order, 2026-08-23, direct request: "they should be able to
                move the things on the home screen they have chosen to be
                there into any order they want to from top to bottom,
                except the welcome box with all of the basic daily info
                available." The welcome box (greeting/date/weather) isn't
                in this list at all -- it's not a HomeSectionKey to begin
                with, see this list's own comment. Up/down buttons rather
                than drag-and-drop: no drag library is part of this
                project yet, and a plain, explicit tap is the same
                low-risk control every other picker on this screen already
                favors (see the PopoverSelect standard this app follows).
                Shown in the person's own real current order, top to
                bottom, matching exactly what Home itself will render. */}
            <Text style={styles.subLabelDivided}>Order</Text>
            <Text style={styles.helpText}>
              Move any of these up or down to change the order they appear on Home, top to bottom.
            </Text>
            <View style={styles.homeOrderList}>
              {getOrderedHomeSectionKeys(visualPrefs).map((key, index, order) => (
                <View key={key} style={styles.homeOrderRow}>
                  <Text style={styles.homeOrderLabel} numberOfLines={1}>
                    {HOME_SECTION_LABELS[key]}
                  </Text>
                  <View style={styles.homeOrderButtons}>
                    <TouchableOpacity
                      onPress={() => moveHomeSection(key, 'up')}
                      disabled={index === 0}
                      style={[styles.homeOrderButton, index === 0 && styles.homeOrderButtonDisabled]}
                      accessibilityRole="button"
                      accessibilityLabel={`Move ${HOME_SECTION_LABELS[key]} up`}
                    >
                      <Ionicons name="chevron-up" size={18} color={index === 0 ? colors.textMuted : colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveHomeSection(key, 'down')}
                      disabled={index === order.length - 1}
                      style={[styles.homeOrderButton, index === order.length - 1 && styles.homeOrderButtonDisabled]}
                      accessibilityRole="button"
                      accessibilityLabel={`Move ${HOME_SECTION_LABELS[key]} down`}
                    >
                      <Ionicons name="chevron-down" size={18} color={index === order.length - 1 ? colors.textMuted : colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* Header Growth, 2026-08-21, Phase 0 of the header growth
          vine/Timeline plan (see the Notion App Development Log and the
          "Header Vine, Timeline & Life" phased build plan, same date). The
          vine itself doesn't exist yet -- this is the toggle scaffold
          only, so the preference and its Profile control are in place
          before Phase 2 gives it anything to actually turn on or off. */}
      <View style={styles.card}>
        {renderCardHeader('header-growth', 'Header Growth')}
        {!collapsedSections.has('header-growth') ? (
          <View style={styles.cardBody}>
            <Text style={styles.helpText}>
              A small plant grows in the header over time as you use the app and reach your own goals. Turn
              it off if you&apos;d rather the header stay plain.
            </Text>
            <View style={styles.pillRow}>
              <TouchableOpacity
                style={[styles.pill, visualPrefs.growthVineEnabled && styles.pillActive]}
                onPress={toggleGrowthVine}
              >
                <Text style={[styles.pillText, visualPrefs.growthVineEnabled && styles.pillTextActive]}>
                  {visualPrefs.growthVineEnabled ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

      {/* Appearance & Navigation, 2026-08-09, regrouped from 3 separate
          cards (TabHub Icon, Shared background, Individual tab
          backgrounds) explicitly requested together.
          2026-08-17: the app used to carry a separate, always-animated
          "iridescent" hue-rotation system driving the header/footer lines
          and every selection ring, deliberately untouched by anything on
          this card. That whole system is now gone (confirmed continuous
          battery drain; see ScreenBackground.tsx's header note). Those
          same accents are now driven directly by the Generic color
          combination picker below, flat and static, so this card's own
          settings do reach further than the background layer and the
          navigation button's icon now; box/plain-text colors elsewhere in
          the app are still untouched. */}
      <View style={styles.card}>
        {renderCardHeader('appearance', 'Appearance & Navigation')}
        {!collapsedSections.has('appearance') ? (
          <View style={styles.cardBody}>
            {renderAppearanceSubsectionHeader('tabHubIcon', 'TabHub Icon', true)}
            {!collapsedAppearanceSubsections.has('tabHubIcon') ? (
              <>
                <Text style={styles.helpText}>
                  The main floating button used to open the app&apos;s navigation menu. Shows the seed by
                  default. Pick any tracked condition&apos;s icon, any insect/pollinator icon, any of the 38
                  animal portraits, or a Food tab builder icon below to personalize it instead. Only one
                  can be active at a time.
                </Text>

                {renderIconGroupHeader('tabHubAppIcon', 'App Icon', 10)}
                {!collapsedIconGroups.has('tabHubAppIcon') ? renderTabHubIconGroup(appIconOptions) : null}

                {renderIconGroupHeader('tabHubConditions', 'Conditions', 14)}
                {!collapsedIconGroups.has('tabHubConditions') ? renderTabHubIconGroup(conditionIconOptions) : null}

                {renderIconGroupHeader('tabHubInsects', 'Insects & Other Wildlife', 14)}
                {!collapsedIconGroups.has('tabHubInsects') ? renderTabHubIconGroup(gardenIconOptions) : null}

                {renderIconGroupHeader('tabHubAnimals', 'Animals', 14)}
                {!collapsedIconGroups.has('tabHubAnimals') ? renderTabHubIconGroup(animalIconOptions) : null}

                {renderIconGroupHeader('tabHubFoodBuilders', 'Food Builders', 14)}
                {!collapsedIconGroups.has('tabHubFoodBuilders') ? renderTabHubIconGroup(foodBuilderIconOptions) : null}
              </>
            ) : null}

            {renderAppearanceSubsectionHeader('sharedBackground', 'Shared background', false)}
            {!collapsedAppearanceSubsections.has('sharedBackground') ? (
              <>
                <Text style={styles.helpText}>
                  The flowery scene behind Home and every tab before you pick a function. &ldquo;Generic&rdquo; swaps
                  it for a calm gradient instead (pick the color combination below); &ldquo;Off&rdquo; removes it
                  entirely, leaving the same flat background color as the header and footer. &ldquo;Custom
                  image&rdquo; lets you upload your own photo; it&apos;s automatically resized and compressed to
                  comply with a reasonable size (up to {CUSTOM_BACKGROUND_MAX_DIMENSION}px, under{' '}
                  {Math.round(CUSTOM_BACKGROUND_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB on disk); a too-small
                  photo (under {CUSTOM_BACKGROUND_MIN_DIMENSION}px on its shorter side) is rejected rather than
                  stretched blurry.
                </Text>
                {renderBackgroundOptionsRow(SHARED_BACKGROUND_SCOPE_KEY, true, visualPrefs.homeBackgroundStyle)}
              </>
            ) : null}

            {renderAppearanceSubsectionHeader('individualTabBackgrounds', 'Individual tab backgrounds', false)}
            {!collapsedAppearanceSubsections.has('individualTabBackgrounds') ? (
              <>
                <Text style={styles.helpText}>
                  Each tab&apos;s own background photo (Food, Insights, Schedules, and the rest), set independently
                  rather than all at once; turn off just the ones you don&apos;t want, and leave the rest as they
                  are.
                </Text>
                {BACKGROUND_TAB_ROUTES.map((route) => (
                  <View key={route.path as string} style={styles.mealTimeRow}>
                    <Text style={styles.mealTimeLabel}>{route.title}</Text>
                    {renderBackgroundOptionsRow(
                      route.path as string,
                      false,
                      visualPrefs.tabBackgroundStyle[route.path as string] ?? 'photo',
                    )}
                  </View>
                ))}
              </>
            ) : null}

            {renderAppearanceSubsectionHeader('genericPalette', 'Generic color combination', false)}
            {!collapsedAppearanceSubsections.has('genericPalette') ? (
              <>
                <Text style={styles.helpText}>
                  Used anywhere above (or the shared background) set to &ldquo;Generic,&rdquo; and, as of
                  2026-08-17, everywhere else too: the app&apos;s own name at the top of every screen, the fine
                  divider lines in the header and footer, and every colored ring around a selected item all take
                  their color from this same choice&apos;s own lighter shade. One shared pick, not a separate one
                  per tab, and always flat and static now, never animated.
                </Text>
                <View style={styles.pillRow}>
                  {GENERIC_PALETTE_OPTIONS.map((palette) => {
                    const active = palette === visualPrefs.genericPalette;
                    return (
                      <TouchableOpacity
                        key={palette}
                        style={[styles.pillSmall, active && styles.pillActive]}
                        onPress={() => setVisualPreferences({ genericPalette: palette })}
                      >
                        <Text style={[styles.pillTextSmall, active && styles.pillTextActive]}>
                          {GENERIC_PALETTE_LABELS[palette]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}

            {/* Ground color, 2026-08-19, see constants/colors.ts's
                GROUND_THEMES/initialGround comments for the full reasoning
                and how each theme's family is derived. Direct request, the
                same day Deep Navy was replaced with Deep Teal as the
                shipped default: "add several additional colors... about
                the same darkness as this one [and] put them in the
                Profile area."
                colors.background/surface/etc. only resolve to the right
                theme once, synchronously, at the moment
                constants/colors.ts's module code first runs (see that
                file's comment on why), so picking a new one here has to
                actually restart the JS runtime for it to reach every
                screen, not just re-render this one. First shipped without
                that restart automated, requiring a manual force-close and
                reopen, reported directly as not what was expected ("they
                need to happen instantly"). handleSelectGroundTheme below
                is the fix: reloadAsync() restarts the JS bundle
                immediately after the pick is saved, so the same correct
                synchronous resolution just runs again automatically,
                without anyone needing to know a restart is involved at
                all. */}
            {renderAppearanceSubsectionHeader('groundColor', 'Ground color', false)}
            {!collapsedAppearanceSubsections.has('groundColor') ? (
              <>
                <Text style={styles.helpText}>
                  The app&apos;s dark base color: every card, border, and muted label everywhere reads from
                  this one choice. Picking a new one restarts the app for a moment to apply it everywhere.
                </Text>
                <View style={styles.groundThemeGrid}>
                  {GROUND_THEME_OPTIONS.map((theme) => {
                    const active = theme === visualPrefs.groundTheme;
                    const family = GROUND_THEMES[theme];
                    return (
                      <TouchableOpacity
                        key={theme}
                        style={[styles.groundThemeCard, active && styles.groundThemeCardActive]}
                        onPress={() => handleSelectGroundTheme(theme)}
                      >
                        <View style={styles.groundThemeSwatchRow}>
                          {GROUND_THEME_SWATCH_KEYS.map((swatchKey) => (
                            <View
                              key={swatchKey}
                              style={[styles.groundThemeSwatch, { backgroundColor: family[swatchKey] }]}
                            />
                          ))}
                        </View>
                        <Text style={[styles.groundThemeLabel, active && styles.groundThemeLabelActive]}>
                          {GROUND_THEME_LABELS[theme]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Step 4 of the device-pairing prerequisite list, 2026-08-15, see
          CLAUDE.md's "Sharing individual recipes between two people"
          security-requirement note. Management for this device's paired
          Connections lives on its own dedicated screen
          (app/connections.tsx), not crammed into this already-large card
          list; this is just the entry point. */}
      <View style={styles.card}>
        {renderCardHeader('connections', 'Connections')}
        {!collapsedSections.has('connections') ? (
          <View style={styles.cardBody}>
            <Text style={styles.helpText}>
              Invite someone to connect directly with you in Inside Story, so you can share recipes and more with each
              other, and see who you&apos;ve already connected with.
            </Text>
            <TouchableOpacity style={styles.checkinButton} onPress={() => router.push('/connections')}>
              <Text style={styles.checkinButtonText}>Manage Connections</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Backup & Restore, 2026-08-16, see lib/dataBackup.ts's header
          comment for the full design reasoning: schema-driven, so a future
          new table is automatically included with zero code changes;
          per-table structured so a future domain-split for multi-party
          cloud sync is an additive step, not a rewrite; this device's own
          signing key is correctly, automatically left out, since it lives
          in expo-secure-store, not this database at all. An honest
          boundary named directly in the card's own text too: this backs up
          the data, not the actual photo files a saved dish/recipe photo
          may reference. */}
      <View style={styles.card}>
        {renderCardHeader('backup', 'Backup & Restore')}
        {!collapsedSections.has('backup') ? (
          <View style={styles.cardBody}>
            <Text style={styles.helpText}>
              Export everything on this device (meals, schedule, conditions, trials, connections, and more) into
              one file you can save wherever you like (a cloud drive, an email to yourself). Doesn&apos;t
              include the actual photo files a saved dish or recipe may reference, only their stored references.
            </Text>
            <TouchableOpacity style={styles.checkinButton} disabled={backupBusy} onPress={handleExportBackup}>
              <Text style={styles.checkinButtonText}>{backupBusy ? 'Working…' : 'Export a Backup'}</Text>
            </TouchableOpacity>
            {/* A durable "document and display the file path" record, per
                direct feedback: always reflects what's genuinely still
                sitting in this app's cache directory right now, not a
                one-time toast that vanishes once dismissed. This is an
                app-internal copy (what "Restore Most Recent" reads from),
                not the copy saved through the share sheet a moment ago;
                that one lives wherever it was actually saved, which this
                app has no way to know or show. */}
            {localBackups.length > 0 ? (
              <View style={styles.concernRow}>
                <Text style={styles.subLabel}>Local backups on this device</Text>
                {localBackups.map((file) => (
                  <View key={file.uri} style={styles.localBackupRow}>
                    <Text style={styles.concernLabel}>
                      {file.modificationTimeMs ? new Date(file.modificationTimeMs).toLocaleString() : file.name}
                    </Text>
                    <Text style={styles.derivedText}>{file.uri}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={[styles.helpText, styles.derivedText]}>
              Restoring replaces everything currently on this device with what&apos;s in the backup. This can&apos;t
              be undone.
            </Text>
            <TouchableOpacity style={styles.dangerButton} disabled={backupBusy} onPress={handleRestoreMostRecent}>
              <Text style={styles.dangerButtonText}>{backupBusy ? 'Working…' : 'Restore Most Recent Backup'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerButton} disabled={backupBusy} onPress={handleRestoreFromFile}>
              <Text style={styles.dangerButtonText}>{backupBusy ? 'Working…' : 'Restore from a File…'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Developer Tools, 2026-08-14, gated on the standard React Native
          __DEV__ global directly (not just ALL_CARD_SECTION_KEYS' inclusion
          of 'developer' above, which is harmless either way): this whole
          card, including its header, renders nothing at all in a
          production build. Seeds/clears lib/devSeed.ts's
          seedTest90Days()/clearSeededTestData(), built purely so Past
          Meals, Trends, and Signals have genuine content to test against
          on a fresh dev build. See that file's header comment for the full
          "why." Rebuilt 2026-08-15 from a 9-day seed into a 90-day one (60
          past, 30 future), cycling through several breakfast/lunch/dinner/
          snack combinations instead of repeating one fixed set every day.
          See devSeed.ts's *_TEMPLATES arrays for the rotation. */}
      {__DEV__ ? (
        <View style={styles.card}>
          {renderCardHeader('developer', 'Developer Tools')}
          {!collapsedSections.has('developer') ? (
            <View style={styles.cardBody}>
              <Text style={styles.helpText}>
                Only ever shown in a dev build, never a release build. Seeds a [TEST]-prefixed 90-day
                span (60 past days already logged, today&apos;s breakfast/lunch/snack, 30 upcoming days
                still planned, cycling through several breakfast/lunch/dinner/snack combinations
                rather than repeating one fixed set, plus a handful of saved sides/salads/etc. and a few
                food trials in different states) so Past Meals, Trends, and Signals all have something
                to look at. This can take a while to finish given the scale. Clear
                removes exactly what this tool itself created, nothing else.
              </Text>
              <TouchableOpacity
                style={styles.addAllergyButton}
                disabled={seedingTestWeek}
                onPress={async () => {
                  setSeedingTestWeek(true);
                  try {
                    await seedTest90Days();
                    showBackupAlert('Seeded', 'A 90-day span of test data has been created.');
                  } catch (error) {
                    showBackupAlert(
                      'Something went wrong',
                      error instanceof Error ? error.message : 'Failed to seed test data.',
                    );
                  } finally {
                    setSeedingTestWeek(false);
                  }
                }}
              >
                <Text style={styles.addAllergyButtonText}>{seedingTestWeek ? 'Seeding, this can take a while…' : 'Seed 90 Days of Test Data'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                disabled={clearingSeededData}
                onPress={async () => {
                  setClearingSeededData(true);
                  try {
                    const { deletedCount } = await clearSeededTestData();
                    showBackupAlert('Cleared', `Removed ${deletedCount} seeded record(s).`);
                  } catch (error) {
                    showBackupAlert(
                      'Something went wrong',
                      error instanceof Error ? error.message : 'Failed to clear seeded test data.',
                    );
                  } finally {
                    setClearingSeededData(false);
                  }
                }}
              >
                <Text style={styles.clearButtonText}>
                  {clearingSeededData ? 'Clearing...' : 'Clear Seeded Test Data'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
    {closeButton}
    {passwordPromptElement}
    {busyOverlayElement}
    {confirmSheetElement}
    {backupAlertElement}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  // 2026-08-21, see this style's usage for why it exists. Unlike
  // `wrapper`'s backgroundColor (which this screen's layout can still
  // leave gaps in, e.g. around the absolutely-positioned close button,
  // once `transparentBackground` is applied for the Generic-palette case),
  // this is an unconditional, always-opaque fill covering the screen's
  // full bounds, painted before anything else.
  opaqueBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  // Applied alongside `wrapper`/`screen`/`loadingContainer`'s flat
  // colors.background, only when the shared "Generic" background is
  // selected. Lets GenericBackground (rendered as an absolute-fill
  // sibling, first in the tree so it paints behind everything else) show
  // through instead of being covered by this screen's own normally-opaque
  // background. Same "make the content layer transparent so a shared
  // backdrop shows through" approach ScreenBackground.tsx/app/(tabs)/
  // _layout.tsx already use for every tab screen's own scene.
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  // Same circular floating-button footprint/position/color as every other
  // close ("X") button in the app: HelpSheet's close button
  // (components/HelpButton.tsx) and TabHub's button both use
  // colors.primary, so every one of these floating circular controls reads
  // as the same family of control. Originally used colors.tabProfile
  // (Profile's own identity color, pink) to match the new Profile tile in
  // TabHub's picker, but that made this one close button visibly
  // inconsistent with every other close button in the app, reverted to
  // the shared primary color per explicit request. Profile has no TabHub
  // of its own, so nothing else occupies this spot here.
  closeButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    position: 'relative',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  // 2026-08-21, the sticky bar profileTitleRow now sits inside, replacing
  // the native header removed the same day (see app/_layout.tsx's profile
  // Stack.Screen comment and this bar's usage above for the full "why").
  // A plain opaque colors.background matches wrapper/screen's color
  // exactly, so the boundary where scrolled content disappears underneath
  // reads as one continuous surface, not a visibly separate panel.
  // horizontal/bottom padding matches `container`'s padding: 20 so
  // "Profile" lines up exactly above whatever card content sits below it
  // once scrolled to the top.
  stickyTitleBar: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  // 2026-08-16, HelpButton sits beside a title now, the same "info icon
  // next to the thing it explains" placement MealBuilder's mealTitleRow
  // uses, and for the identical reason: Profile has no ScreenHeader/TabHub
  // reach of its own to surface this any other way.
  profileTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileTitle: { ...typography.bodyEmphasis, fontSize: 20, color: colors.textPrimary },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  // A brief, isolated confirmation flash: unlike a dense table full of
  // status rows, there's nothing else on screen competing for attention in
  // this moment, so a positive color still reads as a signal rather than
  // noise.
  savedFlash: {
    ...typography.captionEmphasis,
    color: colors.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  label: {
    ...typography.sectionTitle,
    // 2026-08-08, explicitly requested: these card headers ("Birth date,"
    // "Height," etc.) had no color set at all before this, defaulting to
    // React Native's plain black, and needed to be "a lighter color of
    // grey, maybe like the color of the icon." colors.menuLabelMuted is
    // exactly that: the same grey-blue family as colors.menuIconMuted (the
    // Profile icon's own muted color: see the picker fields' tabColor
    // below), just deliberately lighter, since it was already split off
    // from that darker token specifically to stay legible as word-shaped
    // text (see that token's comment in constants/colors.ts).
    color: colors.menuLabelMuted,
    marginBottom: 4,
  },
  // Collapsible-card header row (icon 2026-08-09): the same `label` Text
  // above now sits alongside a chevron, both inside one tap target
  // (renderCardHeader), rather than the plain standalone Text every card
  // used to open with. `label`'s marginBottom (4) still applies to the
  // Text itself; cardBody's marginTop below is what actually spaces the
  // header row from the content underneath it, only while a section is
  // expanded (a collapsed card has no body to space against).
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBody: {
    marginTop: 8,
  },
  // 2026-08-14, direct request: "there isn't much definition of space...
  // to tell where one ends and the next begins." A visible divider line
  // above each of the Appearance & Navigation card's 5 sub-sections (see
  // renderAppearanceSubsectionHeader), on top of making each one
  // independently collapsible. appearanceSubsectionHeaderFirst zeroes the
  // border/spacing out for the very first sub-section (TabHub Icon), which
  // already sits directly under the card's header with nothing above it
  // to visually separate from.
  appearanceSubsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  appearanceSubsectionHeaderFirst: {
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  helpText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  subLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  // 2026-08-21, direct correction after a first, wrong-target attempt (a
  // line between the top-level collapsible cards themselves, reverted; see
  // `card`'s git history): "I'm not talking about putting a line on the
  // collapsable expandable sections themselves... I'm talking about inside
  // of all of those sections." The complaint is the several separate
  // fields/groups within one open card (Personal Info's "Units," "Sex,"
  // "Birth date," "Height"... one after another with nothing but a little
  // vertical gap between them). Reuses the exact same mechanism (and the
  // same marginTop/paddingTop/borderTopWidth numbers)
  // appearanceSubsectionHeader above already established for this
  // identical complaint on 2026-08-14, just applied to subLabel's other
  // call sites throughout this screen: every subLabel that already carried
  // its own `{ marginTop: 14 }`/`{ marginTop: 18 }` inline override (a
  // signal, already in the code, that this one starts a new separate
  // field/group rather than continuing the one above it) now uses this
  // instead of that ad hoc override. A subLabel with no override at all
  // (the first one in its own card, or a tightly-paired sub-part like
  // "Eating window starts"/"Eating window ends" under one "Fasting" group)
  // is deliberately left as plain subLabel, same reasoning
  // appearanceSubsectionHeaderFirst already carries for its own first
  // sub-section. fontSize 16 (up from subLabel's own 14), "make the
  // headers of each larger," a visible step up now that this text is
  // doing double duty as a section-within-a-section header, not just a
  // field label.
  subLabelDivided: {
    ...typography.label,
    color: colors.textPrimary,
    fontSize: 16,
    marginTop: 18,
    marginBottom: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mealTimeRow: {
    marginBottom: 10,
  },
  mealTimeLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillSmall: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  pillTextSmall: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  pillTextActive: {
    color: colors.textOnPrimary,
  },
  // Home Screen's own "Order" list, 2026-08-23 -- one row per reorderable
  // section, up/down buttons rather than drag-and-drop (see the JSX's own
  // comment for why).
  homeOrderList: { gap: 8, marginTop: 4 },
  homeOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  homeOrderLabel: { ...typography.body, color: colors.textPrimary, flex: 1, marginRight: 8 },
  homeOrderButtons: { flexDirection: 'row', gap: 4 },
  homeOrderButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  homeOrderButtonDisabled: { opacity: 0.35 },
  // The Conditions & Check-In condition picker's even 2-column grid,
  // 2026-08-21, see the JSX's comment above for why this list needed a
  // grid instead of the plain pillRow every other picker on this screen
  // keeps using. -4/4 (marginHorizontal on the row, paddingHorizontal on
  // each cell) is the standard RN "gap via padding" trick: pillRow's own
  // `gap` isn't used here since two 50%-width cells plus a gap would push
  // the row past 100% width. The negative outer margin cancels the cells'
  // own padding back out so the grid's left/right edges still line up with
  // every other element on this card.
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  conditionGridItem: {
    width: '50%',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  // Stretches the pill to fill its own grid cell (styles.pill's width is
  // normally content-sized) and centers its content within that fixed
  // width, so a short name ("Gout") and a long one ("Chronic Kidney
  // Disease") both read as the same-size button in the same grid position.
  conditionPill: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // textAlign: 'center', not just alignItems on the pill above: alignItems
  // only centers the text block as a whole; a name long enough to wrap to a
  // second line still needs this so each individual line centers too,
  // rather than the block centering while each line left-aligns within it.
  conditionPillText: {
    textAlign: 'center',
  },
  // TabHub Icon picker: a wrapping grid of tappable icon tiles, one per
  // TabHubIconChoice, mirroring TabHub.tsx's/LensHub.tsx's grid-item
  // shape (icon in a pill, caption below) rather than this screen's usual
  // text-only pillRow, since choosing an icon needs to actually show the
  // icon.
  iconGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconGridItem: {
    width: 72,
    alignItems: 'center',
    gap: 4,
  },
  // The inactive/plain state, same footprint as IridescentRingCircle's
  // `size` (ICON_GRID_PILL_SIZE), just centering the icon with no ring,
  // matching the identical iconPillPlain/itemIconPillPlain pattern
  // TabHub.tsx/LensHub.tsx already use for their own grid items.
  iconGridPillPlain: {
    width: ICON_GRID_PILL_SIZE,
    height: ICON_GRID_PILL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGridImage: {
    width: 40,
    height: 40,
  },
  iconGridLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  iconGridLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Ground color picker, 2026-08-19, same "show the actual thing being
  // chosen" reasoning as iconGridRow/iconGridItem just above, adapted for a
  // color family rather than a single icon: a small cluster of that
  // theme's own swatches (see GROUND_THEME_SWATCH_KEYS' comment) inside a
  // card, rather than a plain text pill.
  groundThemeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  groundThemeCard: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  groundThemeCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  groundThemeSwatchRow: {
    flexDirection: 'row',
    gap: 4,
  },
  // A hairline border of its own on every swatch, not just the card's:
  // without it, Charcoal's 4 swatches (all close, muted grays by design)
  // visually run together into one blob instead of reading as 4 distinct
  // steps.
  groundThemeSwatch: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.25)',
  },
  groundThemeLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  groundThemeLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  // 2026-08-21, the Growing Zone row's link to Garden's My Zone lens,
  // direct correction after a first pass placed this as a full-width
  // checkinButton-style block beneath the row instead: "that is a sloppy
  // button. Move the button to the right of the spot to put it in
  // manually." Sits inline in dateRow next to the Zone PickerField now, a
  // plain underlined link scaled to the row rather than a bold primary-
  // colored block competing with a small dropdown.
  growingZoneLinkButton: {
    justifyContent: 'center',
  },
  growingZoneLinkText: {
    ...typography.body,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  // Wraps a PickerField's label and PopoverSelect: same shape as Side
  // Builder's labeledPickerField/formLabel pair.
  pickerFieldGroup: {
    alignItems: 'flex-start',
  },
  pickerFieldLabel: {
    ...typography.eyebrow,
    color: colors.menuIconMuted,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
    // 2026-08-08, explicitly requested: First/Last name's typed text
    // had no color set, defaulting to plain black, unreadable against
    // this dark input background once actual text (not just the muted
    // placeholder) was there. colors.textPrimary is this app's standard
    // light, readable body-text color, used everywhere else actual
    // content text appears. Only affects the two AppTextInputs left in
    // this file (First/Last name; every other field here is a
    // PopoverSelect now) since `input` is this file's own local style, not
    // a shared token other screens also depend on.
    color: colors.textPrimary,
  },
  dateInputYear: {
    width: 76,
  },
  nameInput: {
    flex: 1,
  },
  // 2026-08-16, First/Last name each get their own mic button (see the
  // render-time comment on that row for why one shared button between
  // the two fields would be ambiguous).
  nameFieldWithMic: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateInputSmall: {
    width: 52,
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  clearButtonText: {
    ...typography.captionEmphasis,
    color: colors.danger,
  },
  // A positive-action counterpart to clearButton above: same compact
  // footprint (fits inline next to a text input, unlike checkinButton's
  // full-width style), colors.primary instead of colors.danger since "Add
  // a food allergy" isn't a destructive action.
  addAllergyButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  addAllergyButtonText: {
    ...typography.captionEmphasis,
    color: colors.textOnPrimary,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 8,
  },
  derivedText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 8,
  },
  // Already-tested-foods review, 2026-08-14, one row per concern under a
  // condition's curated list (see lib/conditionFoodConcerns.ts).
  concernRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  concernLabel: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
  },
  concernReopenLink: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 8,
  },
  checkinButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  checkinButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnPrimary,
  },
  // A full-width counterpart to checkinButton above, deliberately colored
  // for a destructive action (wipe-and-replace restore) rather than
  // reusing checkinButton's primary-action styling, visually distinct
  // enough that Export and Restore can't be mistaken for each other at a
  // glance, without going as quiet/compact as clearButton (which is sized
  // to sit inline next to a text field, not stand alone).
  dangerButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  dangerButtonText: {
    ...typography.bodyEmphasis,
    color: colors.danger,
  },
  localBackupRow: {
    marginTop: 8,
  },
});
