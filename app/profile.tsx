import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppTextInput } from '../components/AppTextInput';
import { GenericBackground } from '../components/GenericBackground';
import { IridescentRingCircle } from '../components/IridescentRingCircle';
import { PopoverSelect } from '../components/PopoverSelect';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE, useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { TAB_HUB_ICON_SOURCES } from '../constants/tabHubIcons';
import { TAB_ROUTES } from '../constants/tabs';
import { typography } from '../constants/typography';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import { CONDITION_CODE_TO_DIGEST_KEY } from '../lib/conditionCodeMap';
import { HEALING_STAGES, HEALING_STAGE_INFO } from '../lib/healingStage';
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
  getStoredMeasurementSystem,
  getUserConditions,
  getUserProfile,
  listAllConditions,
  listBodyMeasurements,
  listFoodAllergies,
  listSymptomAssessments,
  recordBodyMeasurement,
  removeFoodAllergy,
  setStoredMeasurementSystem,
  setUserConditionSelected,
  setUserProfile,
  SymptomAssessmentRecord,
  UserProfile,
} from '../lib/db';
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
  GENERIC_PALETTE_LABELS,
  setVisualPreferences,
  SHARED_BACKGROUND_SCOPE_KEY,
  type BackgroundStyle,
  type GenericPalette,
  type TabHubIconChoice,
} from '../lib/visualPreferences';

// Every tab that gets its own revealed background image (see
// GatedTabContent.tsx) -- Home is deliberately excluded, since it has no
// background of its own to individually toggle; it always shows the shared
// resting layer (see the "Shared background" card below), never a
// GatedTabContent reveal.
const BACKGROUND_TAB_ROUTES = TAB_ROUTES.filter((route) => route.path !== '/');

const BACKGROUND_STYLE_OPTIONS: { value: BackgroundStyle; label: string }[] = [
  { value: 'photo', label: 'Photo' },
  { value: 'generic', label: 'Generic' },
  { value: 'off', label: 'Off' },
];

const GENERIC_PALETTE_OPTIONS: GenericPalette[] = ['lavender', 'seafoam', 'sand', 'dusk'];

// TabHub Icon picker's own selected/unselected pill footprint -- matches
// LensHub.tsx's own GRID_ITEM_PILL_SIZE / TabHub.tsx's own ICON_PILL_SIZE
// convention (a real icon-grid selection pill), sized a bit larger since
// this card has real, open room to work with, unlike either of those two
// tight in-app grids.
const ICON_GRID_PILL_SIZE = 52;

// One real key per collapsible card section on this screen -- see
// collapsedSections'/renderCardHeader's own comment above for the full
// feature. Order here doesn't matter (it's a Set, not a display order).
//
// 2026-08-09, regrouped from 12 individually-collapsible cards down to 4,
// explicitly requested: "Group Your name, units, sex, birth date, height,
// and weight. Group Your conditions and where you're at together...
// group the TabHub icon, shared background, and individual tab
// backgrounds in one section. Group Usual meal times and fasting/eating
// windows." Every former section's own label is kept as a real, plain
// `subLabel` heading WITHIN its new group's own body (the same in-body
// sub-heading convention Fasting's own "Eating window starts"/"Eating
// window ends" already used before this regrouping), not a second layer
// of independently-collapsible sub-cards -- tapping one of these 4
// headers is meant to reveal everything inside it at once.
const ALL_CARD_SECTION_KEYS = ['personal-info', 'conditions', 'appearance', 'meal-schedule'] as const;
type CardSectionKey = (typeof ALL_CARD_SECTION_KEYS)[number];

type DayPart = 'breakfast' | 'lunch' | 'dinner' | 'snack';
const DAY_PARTS: DayPart[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const BLANK_TIME: TimeOfDayInput = { hour: '', minute: '', ampm: '' };

// 2026-08-08, explicitly requested: every Profile field that meant typing
// a number (birth date, height, meal times) gets the same tap-a-list
// pattern Side Builder's own Dish Name page already uses for its Servings/
// Serving Size fields (PopoverSelect -- see that component's own header
// comment for why it replaced free typing/dragging there), leaving only
// First/Last name as real text entry. Every option list below is a module-
// level constant, not built inline in the component -- PopoverSelect is
// memoized against referentially-stable props, the same contract Side
// Builder's own SERVINGS_PICKER_VALUES etc. already follow.
//
// Birth year: every real year from 1900 through this year (matches
// isValidIsoDate's own existing bound), newest first -- someone tapping a
// still-blank field is scrolling from "today" backward, not from 1900
// forward. Month/day stay plain, unpadded numbers ("1".."12"/"1".."31"),
// matching how birthMonth/birthDay were already stored (String(Number(m))
// when loading a saved profile) -- day intentionally isn't narrowed by
// month/year here, the same "any 1-31, real validity checked on commit"
// looseness the original free-text fields already had.
const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => String(CURRENT_YEAR - i));
const BIRTH_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const BIRTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));

// Height: a generous but real human range either system, matching what the
// old free-text maxLength implicitly allowed. Feet/inches split rather than
// one combined list, same two-field shape the original had.
const HEIGHT_CM_OPTIONS = Array.from({ length: 151 }, (_, i) => String(100 + i)); // 100-250 cm
const HEIGHT_FEET_OPTIONS = Array.from({ length: 6 }, (_, i) => String(3 + i)); // 3-8 ft
const HEIGHT_INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i)); // 0-11 in

// 2026-08-09, Weight -- same real, generous-range PopoverSelect approach
// as height above, a plain whole-unit picker (no decimal precision, same
// precision level height already uses).
const WEIGHT_KG_OPTIONS = Array.from({ length: 221 }, (_, i) => String(30 + i)); // 30-250 kg
const WEIGHT_LB_OPTIONS = Array.from({ length: 485 }, (_, i) => String(66 + i)); // 66-550 lb

// 2026-08-09, Food allergies -- the FDA's own real, legally-recognized
// "Big 9" major food allergens (the same list this app's own Reading
// Labels Digest content already covers, including sesame's real 2023
// addition as the 9th) as quick-toggle suggestions; anything else is a
// real, free-text add via allergyInput, not limited to this list.
// Alphabetical, 2026-08-09 -- explicitly requested for every pill row on
// this screen. Was originally in FDA major-allergen disclosure order;
// re-sorted here since display order, not the underlying list, is what was
// actually asked for.
const COMMON_ALLERGENS = ['Eggs', 'Fish', 'Milk', 'Peanuts', 'Sesame', 'Shellfish', 'Soybeans', 'Tree Nuts', 'Wheat'];

// Meal/eating-window times: hour stays plain ("1".."12", matching
// buildTime24's own expected shape); minute is zero-padded ("00".."59") to
// match splitTime24's own output for an already-saved time, so a saved
// "05" minute value shows up already selected rather than failing to match
// an unpadded "5" in this list. AM/PM stays the existing pill row -- that
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
  // Date rolls invalid days (e.g. Feb 30) forward into the next month --
  // catching that here rejects it instead of silently storing the wrong date.
  const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDate && date.getTime() <= Date.now();
}

function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// A small label above a single PopoverSelect field -- 2026-08-08, explicitly
// requested ("put labels above the list box scrollable selectors... for
// each field"), matching Side Builder's own renderLabeledPicker pattern
// (a Text above a PopoverSelect, same file/field shape, just without that
// version's own measured-minWidth stretching, which these fixed-width
// fields don't need). A plain function, not a wrapped component, would
// have worked too, but a real component reads more clearly at each call
// site than a function returning JSX.
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
    usualBreakfastTime: null,
    usualLunchTime: null,
    usualDinnerTime: null,
    usualSnackTime: null,
    fastingEnabled: false,
    eatingWindowStart: null,
    eatingWindowEnd: null,
    healingStage: null,
  });
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>('metric');
  const [savedFlash, setSavedFlash] = useState(false);
  const [lastAssessment, setLastAssessment] = useState<SymptomAssessmentRecord | null>(null);
  // 2026-08-09, explicitly requested: "allow it to be collapsable so it is
  // quicker to find and set whatever I need to in there. Leave just the
  // header to see of each." Every one of this screen's 12 real card
  // sections now starts collapsed (this Set holds every real key -- see
  // ALL_CARD_SECTION_KEYS -- membership means "collapsed," matching
  // `collapsedSections.has(key)` at each card's own header/body split
  // below), showing only its own header until tapped open. Plain local
  // component state, not persisted -- reopening Profile always starts
  // fresh with everything collapsed again, the same "just headers first"
  // state the request asked for, not a remembered per-visit layout.
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
  // Shared by every card below -- a tappable header (title + chevron)
  // replacing the old plain `<Text style={styles.label}>` line, so the
  // whole header row (not just the text) is the real tap target. Every
  // card's own body (help text, fields) is then wrapped in a matching
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
  // Multi-condition model, 2026-08-08 -- replaces the old single
  // Hashimoto's-only pill row. allConditions is the full reference roster
  // (built/in_progress/planned); selectedConditions is this person's own
  // real picks, local-only, backed by user_conditions.
  const [allConditions, setAllConditions] = useState<ConditionReference[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  // Live, app-wide (lib/visualPreferences.ts) -- reading it via the same
  // hook every consumer uses means this screen's own pills always reflect
  // whatever's really stored, and every edit here reaches the shared
  // background / each tab's own revealed background immediately, with no
  // extra local state to keep in sync.
  const visualPrefs = useVisualPreferences();

  // Local text-field buffers -- kept separate from `profile` so the person
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

  // Weight, 2026-08-09 -- unlike height (a single, overwritable field on
  // user_profile), weight lives in the real, already-existing
  // body_measurements time-series table (see lib/db.ts's own
  // recordBodyMeasurement) -- every commit here inserts a genuinely new
  // reading, the same "just log it" behavior Home's own quick blood-
  // pressure/heart-rate log already uses, not an update-in-place. Always
  // stored in kg internally (mirroring heightCm's own always-cm
  // convention), converted for display only.
  const [weightKgInput, setWeightKgInput] = useState('');
  const [weightLbInput, setWeightLbInput] = useState('');

  // Food allergies, 2026-08-09, explicitly requested inside the conditions
  // area -- a real, local list (lib/db.ts's own user_food_allergies),
  // genuinely supporting more than one. allergyInput is the free-text
  // "add a new one" field; foodAllergies is the loaded/committed list.
  const [foodAllergies, setFoodAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  // Custom background image upload, 2026-08-09 -- which scope (see
  // SHARED_BACKGROUND_SCOPE_KEY / lib/customBackgroundImage.ts) currently
  // has a picker in flight, null when none. Disables that one scope's own
  // pills while busy and shows a small spinner in place of its "Custom
  // image" label -- deliberately scoped to one scope at a time rather than
  // a single flat boolean, so picking for one tab doesn't visually disable
  // every other tab's row too.
  const [pickingImageForScope, setPickingImageForScope] = useState<string | null>(null);

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
      listBodyMeasurements('weight', 1),
      listFoodAllergies(),
    ]).then(
      ([storedProfile, storedSystem, recentAssessments, conditionRoster, storedConditions, weightReadings, storedAllergies]) => {
      if (!isMounted) return;

      setProfile(storedProfile);
      setLastAssessment(recentAssessments[0] ?? null);
      setAllConditions(conditionRoster);
      setSelectedConditions(storedConditions);
      setFoodAllergies(storedAllergies);
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
        // below always writes 'kg' -- see that function's own comment.
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

  async function toggleCondition(code: string) {
    const nowSelected = !selectedConditions.includes(code);
    setSelectedConditions((current) =>
      nowSelected ? [...current, code] : current.filter((c) => c !== code),
    );
    await setUserConditionSelected(code, nowSelected);
    flashSaved();
  }

  // overrides, same reason commitMealTime/commitEatingWindow already take
  // one: a PopoverSelect onSelect both updates the field's own state AND
  // needs to commit immediately, in the same synchronous tap -- reading
  // birthYear/birthMonth/birthDay from closure here would still see the
  // PRE-update value, since React state updates aren't applied
  // synchronously. Passing the just-picked value straight through sidesteps
  // that stale-closure gap entirely.
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
      setDateError('Enter a real, complete date (not in the future).');
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

  // overrides -- same stale-closure reason as commitBirthDate above.
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
  // typing in (mirroring heightCm's own always-cm convention) -- inserts a
  // genuinely NEW body_measurements reading every time, the same "just log
  // it" behavior Home's own quick blood-pressure/heart-rate log already
  // uses. No "clear" here, unlike height -- there's no single field to
  // null out; a real historical reading, once logged, stays logged the
  // same way a logged blood-pressure reading isn't erased from Home
  // either. overrides mirrors commitHeight's own same-tap stale-closure
  // fix.
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

  // Food allergies -- addAllergy also clears the free-text input on
  // success, so the field is ready for the next one immediately (matches
  // how the Food tab's own ingredient-add flow resets after each add).
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

  // Custom background image, 2026-08-09 -- explicitly requested: "Add the
  // ability to upload an image to be the background for the shared
  // background, and for each of the individual tabs." isShared picks
  // which half of VisualPreferences actually needs updating on success
  // (homeBackgroundStyle, a plain scalar, vs. tabBackgroundStyle, a
  // per-path record) -- both scopes otherwise go through the exact same
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
        Alert.alert(
          'Photo access needed',
          "Inside Story needs permission to your photos to set a custom background. You can grant this in your device's app settings.",
        );
      } else if (result.status === 'too-small') {
        Alert.alert(
          'Image too small',
          `That image is ${result.width}×${result.height} -- at least ${CUSTOM_BACKGROUND_MIN_DIMENSION}px on its shorter side is needed so it doesn't look blurry stretched to fill the screen. Try a larger photo.`,
        );
      } else if (result.status === 'too-large-after-compression') {
        Alert.alert(
          'Image too large',
          `That image is still too large even after resizing and compressing it to fit under ${Math.round(CUSTOM_BACKGROUND_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB. Try a different photo.`,
        );
      } else if (result.status === 'error') {
        Alert.alert('Something went wrong', result.message);
      }
      // 'canceled' -- no message, no change.
    } finally {
      setPickingImageForScope(null);
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
  // "Individual tab backgrounds" -- one real implementation of the
  // Photo/Generic/Off/Custom picker rather than two copies that could
  // quietly drift apart. Custom's own pill deliberately doesn't use the
  // same instant-toggle onPress as the other three (it opens a real async
  // picker instead), and only Custom shows the "Remove custom image" link.
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

  // overrides lets a caller commit a value it just set via setMealTimeBuffers
  // in the same event handler -- React state updates aren't applied
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

  // See commitMealTime's comment -- same stale-closure hazard, same fix.
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

    // Only commits once both ends are valid -- a half-entered window (e.g.
    // start typed, end not yet) would otherwise briefly become a real,
    // enforced constraint that blocks every single Schedule save.
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
  // group entirely -- see app/_layout.tsx), so this is its only way back,
  // on both the loading and loaded states. Bottom-center, the exact spot
  // TabHub's own button would occupy on a tab screen, so it lands in the
  // same "reach here with your thumb" zone as everywhere else in the app.
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

  // 2026-08-08, explicitly requested: Profile's own background should
  // follow the shared "Generic" background choice (see the Shared
  // background card below) when that's what's selected, rather than always
  // staying the plain flat colors.background it always has -- otherwise
  // (Photo or Off) it stays exactly that same flat color, matching the
  // header/footer, same as before. Profile never shows the Photo option
  // itself (it has no background image of its own, and isn't one of the
  // per-tab GatedTabContent screens) -- only Generic is followed here.
  const showGenericBackground = visualPrefs.homeBackgroundStyle === 'generic';

  // TabHub's own personalizable icon, 2026-08-09 -- "make it so each icon
  // is available in the user profile to choose to use in the TabHub menu
  // icon position." The default butterfly always leads; every real
  // built/in_progress condition follows, reusing the exact same "Your
  // conditions" filter (status !== 'planned') and CONDITION_CODE_TO_DIGEST_KEY
  // lookup that card already uses just below -- not a second, separately
  // derived condition list. The TAB_HUB_ICON_SOURCES truthiness check is a
  // real, defensive guard, not just belt-and-suspenders: it's what keeps a
  // future condition added to the `conditions` table but without its own
  // icon yet from silently showing a broken/blank option here.
  // 2026-08-09: default always leads (not part of the alphabetical sort),
  // then every real condition option sorted alphabetically by its own
  // label -- explicitly requested. Briefly labeled "Default
  // (Thyreomorpha Gemmata)" (the real species name behind this app's own
  // commissioned butterfly artwork) the same day, then reverted to plain
  // "Default" per a direct follow-up request.
  const tabHubIconOptions: { key: TabHubIconChoice; label: string }[] = [
    { key: 'default', label: 'Default' },
  ];
  const conditionIconOptions: { key: TabHubIconChoice; label: string }[] = [];
  for (const condition of allConditions) {
    if (condition.status === 'planned') continue;
    const digestKey = CONDITION_CODE_TO_DIGEST_KEY[condition.code];
    if (digestKey && TAB_HUB_ICON_SOURCES[digestKey]) {
      conditionIconOptions.push({ key: digestKey, label: condition.name });
    }
  }
  conditionIconOptions.sort((a, b) => a.label.localeCompare(b.label));
  tabHubIconOptions.push(...conditionIconOptions);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, showGenericBackground && styles.transparentBackground]}>
        {showGenericBackground ? <GenericBackground palette={visualPrefs.genericPalette} /> : null}
        <ActivityIndicator />
        {closeButton}
      </View>
    );
  }

  const currentAge = profile.birthDate ? ageFromBirthDate(profile.birthDate) : null;

  return (
    <View style={[styles.wrapper, showGenericBackground && styles.transparentBackground]}>
    {showGenericBackground ? <GenericBackground palette={visualPrefs.genericPalette} /> : null}
    <ScrollView
      style={[styles.screen, showGenericBackground && styles.transparentBackground]}
      contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}
    >
      <Text style={styles.intro}>
        Everything below is optional. This app works fine with nothing set here -- unset fields simply mean
        you'll see recommendations for every applicable population instead of one tailored to you. Nothing here
        is guessed on your behalf.
      </Text>
      {savedFlash ? <Text style={styles.savedFlash}>Saved</Text> : null}

      {/* Personal Info -- 2026-08-09, regrouped from 5 separate cards
          (Your name, Units, Sex, Birth date, Height) plus a new Weight
          field, all explicitly requested together. Every former card's
          own label is kept as a real subLabel heading within this one
          group's body. */}
      <View style={styles.card}>
        {renderCardHeader('personal-info', 'Personal Info')}
        {!collapsedSections.has('personal-info') ? (
          <View style={styles.cardBody}>
            <Text style={styles.subLabel}>Your name</Text>
            <Text style={styles.helpText}>
              Your first name shows in the header (e.g. &ldquo;Tony&apos;s Inside Story&rdquo;). Last name is also
              collected -- one of the real reasons is for reports meant to be handed to a doctor, where both
              names read naturally together.
            </Text>
            <View style={styles.dateRow}>
              <AppTextInput
                style={[styles.input, styles.nameInput]}
                placeholder="First name"
                value={firstNameInput}
                onChangeText={setFirstNameInput}
                onBlur={commitFirstName}
              />
              <AppTextInput
                style={[styles.input, styles.nameInput]}
                placeholder="Last name"
                value={lastNameInput}
                onChangeText={setLastNameInput}
                onBlur={commitLastName}
              />
            </View>

            <Text style={[styles.subLabel, { marginTop: 14 }]}>Units</Text>
            <Text style={styles.helpText}>
              Used across the app for quantities and measurements -- meal ingredient amounts, height, weight,
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

            <Text style={[styles.subLabel, { marginTop: 14 }]}>Sex</Text>
            <Text style={styles.helpText}>
              Used only to show sex-specific nutrient targets (RDAs) where they genuinely differ. This app is
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

            <Text style={[styles.subLabel, { marginTop: 14 }]}>Birth date</Text>
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

            <Text style={[styles.subLabel, { marginTop: 14 }]}>Height</Text>
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

            <Text style={[styles.subLabel, { marginTop: 14 }]}>Weight</Text>
            <Text style={styles.helpText}>
              Your current weight -- also useful for a doctor report. Each time you set it here, it&apos;s logged as
              a new reading (the same way a real weight-tracking history works), not just overwritten; a full
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
          </View>
        ) : null}
      </View>

      {/* Meal Timing -- 2026-08-09, regrouped from 2 separate cards (Usual
          meal times, Fasting/eating window), explicitly requested
          together. */}
      <View style={styles.card}>
        {renderCardHeader('meal-schedule', 'Meal Timing')}
        {!collapsedSections.has('meal-schedule') ? (
          <View style={styles.cardBody}>
            <Text style={styles.subLabel}>Usual meal times</Text>
            <Text style={styles.helpText}>
              About what time you normally eat each one. Used to pre-fill the time when you schedule that meal type
              on the Schedule tab -- you can always change it there.
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

            <Text style={[styles.subLabel, { marginTop: 14 }]}>Fasting / eating window</Text>
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

      {/* Conditions & Check-In -- 2026-08-09, regrouped from 3 separate
          cards (Your conditions, Where you're at, plus a brand-new Food
          Allergies sub-section) explicitly requested together. */}
      <View style={styles.card}>
        {renderCardHeader('conditions', 'Conditions & Check-In')}
        {!collapsedSections.has('conditions') ? (
          <View style={styles.cardBody}>
            <Text style={styles.subLabel}>Your conditions</Text>
            <Text style={styles.helpText}>
              Select every condition that applies to you -- this tells the app which condition-specific notes,
              scoring, and medications are relevant to you personally. Multiple selections are fully supported;
              having more than one is common.
            </Text>
            <View style={styles.pillRow}>
              {allConditions
                .filter((condition) => condition.status !== 'planned')
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((condition) => {
                  const active = selectedConditions.includes(condition.code);
                  return (
                    <TouchableOpacity
                      key={condition.code}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => toggleCondition(condition.code)}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {condition.name}
                        {condition.status === 'in_progress' ? ' (early access)' : ''}
                      </Text>
                    </TouchableOpacity>
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

            {/* Food allergies -- 2026-08-09, explicitly requested: "Add to
                conditions area an ability to provide food allergies. They
                might have multiple." A real, separate `user_food_allergies`
                table (lib/db.ts) -- deliberately not folded into
                user_conditions, since an allergy isn't a tracked disease. */}
            <Text style={[styles.subLabel, { marginTop: 14 }]}>Food allergies</Text>
            <Text style={styles.helpText}>
              Separate from the condition-based food scoring above -- a real allergy or intolerance, not just a
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
                <Text style={[styles.subLabel, { marginTop: 14 }]}>Where you're at</Text>
                <Text style={styles.helpText}>
                  A short check-in covering hypothyroid symptoms, digestive/IBS symptoms, and overall wellbeing.
                  Early on, day-to-day change can feel invisible because everything is happening at once -- this
                  is what turns that into an actual, visible trend over time.
                </Text>
                {lastAssessment ? (
                  <Text style={styles.derivedText}>Last taken {daysAgoLabel(lastAssessment.completedAt)}.</Text>
                ) : (
                  <Text style={styles.derivedText}>You haven't taken this yet -- your first one becomes your baseline.</Text>
                )}
                <TouchableOpacity style={styles.checkinButton} onPress={() => router.push('/assessment')}>
                  <Text style={styles.checkinButtonText}>
                    {lastAssessment ? 'Retake check-in' : 'Take your first check-in'}
                  </Text>
                </TouchableOpacity>

                {/* Healing stage -- 2026-08-09, explicitly requested: build
                    out the "Healing-journey stages" feature decided
                    2026-07-31 (see CLAUDE.md's own section on it) --
                    self-declaration here, real advisory wired into Side
                    Builder's own pending-ingredient card (lib/
                    healingStageAdvisory.ts). Advisory + reordering only,
                    never gating, per that same standing decision -- tap
                    an already-selected stage again to clear it back to
                    "not declared." */}
                <Text style={[styles.subLabel, { marginTop: 14 }]}>Healing stage</Text>
                <Text style={styles.helpText}>
                  A real, named practitioner framework (associated with Dr. Izabella Wentz) for where you are in
                  your own healing journey -- not mainstream endocrinology consensus, and treated that way here.
                  Purely advisory: your food builders will start surfacing a real, tappable note on foods worth a
                  second look for your current stage (only Digging and Gut Repair actually change anything) --
                  nothing is ever hidden or blocked based on this. See the Healing Stages category in Purple
                  Digest for the full, cited guide.
                </Text>
                <View style={styles.pillRow}>
                  {HEALING_STAGES.map((stage) => {
                    const active = profile.healingStage === stage;
                    return (
                      <TouchableOpacity
                        key={stage}
                        style={[styles.pill, active && styles.pillActive]}
                        onPress={() => updateProfile({ healingStage: active ? null : stage })}
                      >
                        <Text style={[styles.pillText, active && styles.pillTextActive]}>
                          {HEALING_STAGE_INFO[stage].label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.derivedText}>
                  {profile.healingStage
                    ? HEALING_STAGE_INFO[profile.healingStage].shortDescription
                    : "Not declared -- tap a stage above if you'd like to."}
                </Text>
              </>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Appearance & Navigation -- 2026-08-09, regrouped from 3 separate
          cards (TabHub Icon, Shared background, Individual tab
          backgrounds) explicitly requested together. Header/footer colors,
          box/font/line colors, and the iridescent shimmer are deliberately
          untouched by any setting here -- this only ever affects the
          background layer and the main navigation button's own icon. */}
      <View style={styles.card}>
        {renderCardHeader('appearance', 'Appearance & Navigation')}
        {!collapsedSections.has('appearance') ? (
          <View style={styles.cardBody}>
            <Text style={styles.subLabel}>TabHub Icon</Text>
            <Text style={styles.helpText}>
              The main floating button used to open the app&apos;s navigation menu. Choose the default butterfly, or
              any tracked condition&apos;s own real icon to personalize it -- generically representing either
              Hashimoto&apos;s or Graves&apos; if you leave it as the default. Only one can be active at a time.
            </Text>
            <View style={styles.iconGridRow}>
              {tabHubIconOptions.map((option) => {
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

            <Text style={[styles.subLabel, { marginTop: 14 }]}>Shared background</Text>
            <Text style={styles.helpText}>
              The flowery scene behind Home and every tab before you pick a function. &ldquo;Generic&rdquo; swaps it
              for a calm gradient instead (pick the color combination below); &ldquo;Off&rdquo; removes it entirely,
              leaving the same flat background color as the header and footer. &ldquo;Custom image&rdquo; lets you
              upload your own photo -- it&apos;s automatically resized and compressed to comply with a reasonable
              size (up to {CUSTOM_BACKGROUND_MAX_DIMENSION}px, under{' '}
              {Math.round(CUSTOM_BACKGROUND_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB on disk); a genuinely too-small
              photo (under {CUSTOM_BACKGROUND_MIN_DIMENSION}px on its shorter side) is rejected rather than
              stretched blurry.
            </Text>
            {renderBackgroundOptionsRow(SHARED_BACKGROUND_SCOPE_KEY, true, visualPrefs.homeBackgroundStyle)}

            <Text style={styles.subLabel}>Animated sky (sun, moon, stars, day/night)</Text>
            <Text style={styles.helpText}>
              Only shows while the shared background above is set to &ldquo;Photo.&rdquo; Turning it off stops the
              continuously-running animation, which is the real thing to disable if battery use matters more
              than the visual.
            </Text>
            <View style={styles.pillRow}>
              {([
                { value: true, label: 'Animated' },
                { value: false, label: 'Off' },
              ]).map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.pillSmall, visualPrefs.skyAnimationsEnabled === option.value && styles.pillActive]}
                  onPress={() => setVisualPreferences({ skyAnimationsEnabled: option.value })}
                >
                  <Text
                    style={[
                      styles.pillTextSmall,
                      visualPrefs.skyAnimationsEnabled === option.value && styles.pillTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.subLabel, { marginTop: 14 }]}>Individual tab backgrounds</Text>
            <Text style={styles.helpText}>
              Each tab&apos;s own background photo (Food, Insights, Schedules, and the rest), set independently
              rather than all at once -- turn off just the ones you don&apos;t want, and leave the rest as they are.
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

            <Text style={styles.subLabel}>Generic color combination</Text>
            <Text style={styles.helpText}>
              Used anywhere above (or the shared background) set to &ldquo;Generic.&rdquo; One shared choice, not a
              separate pick per tab.
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
          </View>
        ) : null}
      </View>
    </ScrollView>
    {closeButton}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  // Applied alongside `wrapper`/`screen`/`loadingContainer`'s own flat
  // colors.background, only when the shared "Generic" background is
  // selected -- lets GenericBackground (rendered as an absolute-fill
  // sibling, first in the tree so it paints behind everything else) show
  // through instead of being covered by this screen's own normally-opaque
  // background. Same "make the real content layer transparent so a shared
  // backdrop shows through" approach ScreenBackground.tsx/app/(tabs)/
  // _layout.tsx already use for every tab screen's own scene.
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  // Same circular floating-button footprint/position/color as every other
  // close ("X") button in the app -- HelpSheet's own close button
  // (components/HelpButton.tsx) and TabHub's own button both use
  // colors.primary, so every one of these floating circular controls reads
  // as the same family of control. Originally used colors.tabProfile
  // (Profile's own identity color, pink) to match the new Profile tile in
  // TabHub's picker, but that made this one close button visibly
  // inconsistent with every other close button in the app -- reverted to
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
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  // A brief, isolated confirmation flash -- unlike a dense table full of
  // status rows, there's nothing else on screen competing for attention in
  // this moment, so a real positive color still reads as a signal rather
  // than noise.
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
    // "Height," etc.) had no color set at all before this -- defaulting to
    // React Native's own plain black -- and needed to be "a lighter color
    // of grey, maybe like the color of the icon." colors.menuLabelMuted is
    // exactly that: the same grey-blue family as colors.menuIconMuted (the
    // Profile icon's own real, muted color -- see the picker fields'
    // tabColor below), just deliberately lighter, since it was already
    // split off from that darker token specifically to stay legible as
    // real word-shaped text (see that token's own comment in
    // constants/colors.ts).
    color: colors.menuLabelMuted,
    marginBottom: 4,
  },
  // Collapsible-card header row (icon 2026-08-09) -- the same `label` Text
  // above now sits alongside a chevron, both inside one real tap target
  // (renderCardHeader), rather than the plain standalone Text every card
  // used to open with. `label`'s own marginBottom (4) still applies to the
  // Text itself; cardBody's own marginTop below is what actually spaces
  // the header row from the real content underneath it, only while a
  // section is expanded (a collapsed card has no body to space against).
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBody: {
    marginTop: 8,
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
  // TabHub Icon picker -- a wrapping grid of tappable icon tiles, one per
  // TabHubIconChoice, mirroring TabHub.tsx's/LensHub.tsx's own grid-item
  // shape (icon in a pill, caption below) rather than this screen's usual
  // text-only pillRow, since choosing an ICON needs to actually show the
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
  // The inactive/plain state -- same footprint as IridescentRingCircle's
  // own `size` (ICON_GRID_PILL_SIZE), just centering the icon with no
  // ring, matching the identical iconPillPlain/itemIconPillPlain pattern
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  // Wraps a PickerField's own label + PopoverSelect -- same shape as Side
  // Builder's own labeledPickerField/formLabel pair.
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
    // 2026-08-08, explicitly requested: First/Last name's own typed text
    // had no color set, defaulting to plain black -- unreadable against
    // this dark input background once real text (not just the muted
    // placeholder) was actually there. colors.textPrimary is this app's
    // own standard light, readable body-text color, used everywhere else
    // real content text appears. Only affects the two AppTextInputs left
    // in this file (First/Last name -- every other field here is a
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
  // A real, positive-action counterpart to clearButton above -- same
  // compact footprint (fits inline next to a text input, unlike
  // checkinButton's own full-width style), colors.primary instead of
  // colors.danger since "Add a food allergy" isn't a destructive action.
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
});
