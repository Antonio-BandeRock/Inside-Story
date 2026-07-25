import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE, useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
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

type DayPart = 'breakfast' | 'lunch' | 'dinner' | 'snack';
const DAY_PARTS: DayPart[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const BLANK_TIME: TimeOfDayInput = { hour: '', minute: '', ampm: '' };

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

  function commitBirthDate() {
    setDateError(null);

    if (!birthYear && !birthMonth && !birthDay) {
      if (profile.birthDate) updateProfile({ birthDate: null });
      return;
    }

    const year = Number(birthYear);
    const month = Number(birthMonth);
    const day = Number(birthDay);

    if (!isValidIsoDate(year, month, day)) {
      setDateError('Enter a real, complete date (not in the future).');
      return;
    }

    updateProfile({ birthDate: toIsoDate(year, month, day) });
  }

  function clearBirthDate() {
    setBirthYear('');
    setBirthMonth('');
    setBirthDay('');
    setDateError(null);
    if (profile.birthDate) updateProfile({ birthDate: null });
  }

  function commitHeight() {
    if (measurementSystem === 'imperial') {
      if (!heightFeetInput && !heightInchesInput) {
        if (profile.heightCm != null) updateProfile({ heightCm: null });
        return;
      }
      const feet = Number(heightFeetInput) || 0;
      const inches = Number(heightInchesInput) || 0;
      if (feet <= 0 && inches <= 0) return;
      updateProfile({ heightCm: feetInchesToCm(feet, inches) });
    } else {
      if (!heightCmInput) {
        if (profile.heightCm != null) updateProfile({ heightCm: null });
        return;
      }
      const cm = Number(heightCmInput);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
        {closeButton}
      </View>
    );
  }

  const currentAge = profile.birthDate ? ageFromBirthDate(profile.birthDate) : null;

  return (
    <View style={styles.wrapper}>
    <ScrollView style={styles.screen} contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}>
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
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="First name"
            value={firstNameInput}
            onChangeText={setFirstNameInput}
            onBlur={commitFirstName}
          />
          <TextInput
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
          <TextInput
            style={[styles.input, styles.dateInputYear]}
            placeholder="YYYY"
            keyboardType="number-pad"
            maxLength={4}
            value={birthYear}
            onChangeText={setBirthYear}
            onBlur={commitBirthDate}
          />
          <TextInput
            style={[styles.input, styles.dateInputSmall]}
            placeholder="MM"
            keyboardType="number-pad"
            maxLength={2}
            value={birthMonth}
            onChangeText={setBirthMonth}
            onBlur={commitBirthDate}
          />
          <TextInput
            style={[styles.input, styles.dateInputSmall]}
            placeholder="DD"
            keyboardType="number-pad"
            maxLength={2}
            value={birthDay}
            onChangeText={setBirthDay}
            onBlur={commitBirthDate}
          />
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
              <TextInput
                style={[styles.input, styles.dateInputSmall]}
                placeholder="ft"
                keyboardType="number-pad"
                maxLength={1}
                value={heightFeetInput}
                onChangeText={setHeightFeetInput}
                onBlur={commitHeight}
              />
              <TextInput
                style={[styles.input, styles.dateInputSmall]}
                placeholder="in"
                keyboardType="number-pad"
                maxLength={2}
                value={heightInchesInput}
                onChangeText={setHeightInchesInput}
                onBlur={commitHeight}
              />
            </>
          ) : (
            <TextInput
              style={[styles.input, styles.dateInputYear]}
              placeholder="cm"
              keyboardType="number-pad"
              maxLength={3}
              value={heightCmInput}
              onChangeText={setHeightCmInput}
              onBlur={commitHeight}
            />
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
              <TextInput
                style={[styles.input, styles.dateInputSmall]}
                placeholder="8"
                keyboardType="number-pad"
                maxLength={2}
                value={mealTimeBuffers[dayPart].hour}
                onChangeText={(text) =>
                  setMealTimeBuffers((current) => ({ ...current, [dayPart]: { ...current[dayPart], hour: text } }))
                }
                onBlur={() => commitMealTime(dayPart)}
              />
              <TextInput
                style={[styles.input, styles.dateInputSmall]}
                placeholder="00"
                keyboardType="number-pad"
                maxLength={2}
                value={mealTimeBuffers[dayPart].minute}
                onChangeText={(text) =>
                  setMealTimeBuffers((current) => ({ ...current, [dayPart]: { ...current[dayPart], minute: text } }))
                }
                onBlur={() => commitMealTime(dayPart)}
              />
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
              <TextInput
                style={[styles.input, styles.dateInputSmall]}
                placeholder="12"
                keyboardType="number-pad"
                maxLength={2}
                value={eatingWindowStartBuffer.hour}
                onChangeText={(text) => setEatingWindowStartBuffer((current) => ({ ...current, hour: text }))}
                onBlur={() => commitEatingWindow()}
              />
              <TextInput
                style={[styles.input, styles.dateInputSmall]}
                placeholder="00"
                keyboardType="number-pad"
                maxLength={2}
                value={eatingWindowStartBuffer.minute}
                onChangeText={(text) => setEatingWindowStartBuffer((current) => ({ ...current, minute: text }))}
                onBlur={() => commitEatingWindow()}
              />
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
              <TextInput
                style={[styles.input, styles.dateInputSmall]}
                placeholder="8"
                keyboardType="number-pad"
                maxLength={2}
                value={eatingWindowEndBuffer.hour}
                onChangeText={(text) => setEatingWindowEndBuffer((current) => ({ ...current, hour: text }))}
                onBlur={() => commitEatingWindow()}
              />
              <TextInput
                style={[styles.input, styles.dateInputSmall]}
                placeholder="00"
                keyboardType="number-pad"
                maxLength={2}
                value={eatingWindowEndBuffer.minute}
                onChangeText={(text) => setEatingWindowEndBuffer((current) => ({ ...current, minute: text }))}
                onBlur={() => commitEatingWindow()}
              />
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
          This app is built around Hashimoto's, but works for household members without it too (e.g. a
          companion account). This just tells the app which of its Hashimoto's-specific notes are relevant to
          you personally.
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
    </ScrollView>
    {closeButton}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
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
