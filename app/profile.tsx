import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppTextInput } from '../components/AppTextInput';
import { GenericBackground } from '../components/GenericBackground';
import { PopoverSelect } from '../components/PopoverSelect';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE, useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { TAB_ROUTES } from '../constants/tabs';
import { typography } from '../constants/typography';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import {
  DietarySex,
  getStoredMeasurementSystem,
  getUserProfile,
  listSymptomAssessments,
  setStoredMeasurementSystem,
  setUserProfile,
  SymptomAssessmentRecord,
  UserProfile,
} from '../lib/db';
import { ageFromBirthDate } from '../lib/profile';
import { cmToFeetInches, detectMeasurementSystemFromLocale, feetInchesToCm, MeasurementSystem } from '../lib/measurement';
import { buildTime24, formatTime12, splitTime24, type TimeOfDayInput } from '../lib/timeOfDay';
import {
  GENERIC_PALETTE_LABELS,
  setVisualPreferences,
  type BackgroundStyle,
  type GenericPalette,
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
  });
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>('metric');
  const [savedFlash, setSavedFlash] = useState(false);
  const [lastAssessment, setLastAssessment] = useState<SymptomAssessmentRecord | null>(null);
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

    Promise.all([getUserProfile(), getStoredMeasurementSystem(), listSymptomAssessments(1)]).then(
      ([storedProfile, storedSystem, recentAssessments]) => {
      if (!isMounted) return;

      setProfile(storedProfile);
      setLastAssessment(recentAssessments[0] ?? null);
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

  function handleHashimotosSelect(hasHashimotos: TriState<boolean>) {
    updateProfile({ hasHashimotos });
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

      <View style={styles.card}>
        <Text style={styles.label}>Your name</Text>
        <Text style={styles.helpText}>
          Purely for personalizing the app -- your first name shows in the header (e.g. "Tony's Inside Story").
          Nothing else in the app uses either field.
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
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Units</Text>
        <Text style={styles.helpText}>
          Used across the app for quantities and measurements -- meal ingredient amounts, height, and body
          measurements.
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
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Sex</Text>
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
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Birth date</Text>
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
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Height</Text>
        <Text style={styles.helpText}>
          Used only for the step-counter's distance estimate (it needs a stride-length estimate, which comes
          from height). Follows your Units setting above.
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
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Usual meal times</Text>
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
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Fasting / eating window</Text>
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

      <View style={styles.card}>
        <Text style={styles.label}>Hashimoto's diagnosis</Text>
        <Text style={styles.helpText}>
          Inside Story is built to support people with autoimmune conditions -- Hashimoto&apos;s is the first one
          fully supported, with more in active development. This tells the app which of its Hashimoto&apos;s-specific
          notes are relevant to you personally; household members without it can still use a companion account.
        </Text>
        <View style={styles.pillRow}>
          {([
            { value: null, label: 'Not set' },
            { value: true, label: "Yes, I have Hashimoto's" },
            { value: false, label: "No, I don't" },
          ]).map((option) => {
            const active = option.value === profile.hasHashimotos;
            return (
              <TouchableOpacity
                key={option.label}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => handleHashimotosSelect(option.value)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {profile.hasHashimotos ? (
        <View style={styles.card}>
          <Text style={styles.label}>Where you're at</Text>
          <Text style={styles.helpText}>
            A short check-in covering hypothyroid symptoms, digestive/IBS symptoms, and overall wellbeing.
            Early on, day-to-day change can feel invisible because everything is happening at once -- this is
            what turns that into an actual, visible trend over time.
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
        </View>
      ) : null}

      {/* Appearance -- 2026-08-08, explicitly requested as an opt-out for
          the shared flowery background, its animated sky overlay, and each
          individual tab's own background photo, with a calmer generic
          alternative in place of any of them. Header/footer colors, box/
          font/line colors, and the iridescent shimmer are deliberately
          untouched by any setting here -- this only ever affects the
          background layer itself. */}
      <View style={styles.card}>
        <Text style={styles.label}>Shared background</Text>
        <Text style={styles.helpText}>
          The flowery scene behind Home and every tab before you pick a function. &ldquo;Generic&rdquo; swaps it
          for a calm gradient instead (pick the color combination below); &ldquo;Off&rdquo; removes it entirely,
          leaving the same flat background color as the header and footer.
        </Text>
        <View style={styles.pillRow}>
          {BACKGROUND_STYLE_OPTIONS.map((option) => {
            const active = option.value === visualPrefs.homeBackgroundStyle;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.pillSmall, active && styles.pillActive]}
                onPress={() => setVisualPreferences({ homeBackgroundStyle: option.value })}
              >
                <Text style={[styles.pillTextSmall, active && styles.pillTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Individual tab backgrounds</Text>
        <Text style={styles.helpText}>
          Each tab&apos;s own background photo (Food, Insights, Schedules, and the rest), set independently
          rather than all at once -- turn off just the ones you don&apos;t want, and leave the rest as they are.
        </Text>
        {BACKGROUND_TAB_ROUTES.map((route) => (
          <View key={route.path as string} style={styles.mealTimeRow}>
            <Text style={styles.mealTimeLabel}>{route.title}</Text>
            <View style={styles.pillRow}>
              {BACKGROUND_STYLE_OPTIONS.map((option) => {
                const current = visualPrefs.tabBackgroundStyle[route.path as string] ?? 'photo';
                const active = option.value === current;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.pillSmall, active && styles.pillActive]}
                    onPress={() =>
                      setVisualPreferences({
                        tabBackgroundStyle: { [route.path as string]: option.value },
                      })
                    }
                  >
                    <Text style={[styles.pillTextSmall, active && styles.pillTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
