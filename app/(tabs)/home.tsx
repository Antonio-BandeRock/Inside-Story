import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DayArc } from '../../components/DayArc';
import { EnergyOrb } from '../../components/EnergyOrb';
import { FlipCard } from '../../components/FlipCard';
import { ProgressRing } from '../../components/ProgressRing';
import { ScreenBackground } from '../../components/ScreenBackground';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { typography } from '../../constants/typography';
import {
  getDailyNutrientBreakdown,
  getDailySixDimensionsBreakdown,
  getUserProfile,
  listCheckins,
  listMealsForDate,
  listScheduledMealsForDate,
  recordBodyMeasurement,
  recordExercise,
  setScheduledMealSkipped,
  type MealRecord,
  type ScheduleItemRecord,
} from '../../lib/db';
import {
  analyzeNutrientIntake,
  findExcessRisks,
  findNutrientGaps,
  nutrientStatusSeverity,
  type NutrientGapEntry,
  type NutrientStatus,
} from '../../lib/nutrientAnalysis';
import { isFlaggedTier } from '../../lib/sixDimensionsReference';
import { formatTime12 } from '../../lib/timeOfDay';

// 'YYYY-MM-DD' in LOCAL time -- same helper (and same reasoning) duplicated
// in index.tsx/insights.tsx/schedule.tsx/log.tsx: UTC's calendar date is
// wrong for anyone not on UTC, especially in the evening.
function todayDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function dateStringDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowTimeString24(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// A small rotating pool of quiet, low-key affirmations -- deliberately not
// peppy/cheerful ("Have a great day!"): this is a chronic-illness app, and
// a relentlessly upbeat line can land badly on a genuinely rough symptom
// day. Picked by day-of-year so it's stable all day (not different every
// time Home refocuses) but still varies day to day rather than feeling
// robotic on repeat visits.
const GREETING_AFFIRMATIONS = [
  "Glad you're here",
  'One step at a time',
  'Take it at your own pace',
  "Here's to a steady day",
  'Glad you checked in',
  'No rush today',
  "You're doing okay",
];

function pickAffirmation(): string {
  const startOfYear = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - startOfYear) / (24 * 60 * 60 * 1000));
  return GREETING_AFFIRMATIONS[dayOfYear % GREETING_AFFIRMATIONS.length];
}

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

// A real, cited-elsewhere-in-this-app subset of nutrients most directly
// tied to thyroid hormone production/conversion (iodine, selenium, zinc,
// iron, copper) and to bone health (vitamin D, calcium, magnesium) --
// deliberately not a marketing-style "17 pillars" claim, just the nutrients
// this app already tracks DRIs for that are most relevant here.
const CORE_NUTRIENT_CODES = ['iodine', 'selenium', 'zinc', 'iron', 'vitamin_d', 'calcium', 'magnesium', 'copper', 'vitamin_b12'];

// Same green/yellow/red language as the Insights tab's Nutrients table
// (see nutrientStatusSeverity in lib/nutrientAnalysis.ts) -- a nutrient
// should read the same color here on Home as it does over there, not a
// second, slightly different color scheme for the same status.
function nutrientRingColor(status: NutrientStatus): string {
  const severity = nutrientStatusSeverity(status);
  if (severity === 'red') return colors.danger;
  if (severity === 'yellow') return colors.statusYellow;
  return colors.primary;
}

type DashboardData = {
  todaysMeals: MealRecord[];
  scheduledToday: ScheduleItemRecord[];
  nutrientEntries: NutrientGapEntry[];
  sixDsFlagCount: number;
  recentMaxSeverity: number | null;
  hasAnyLogHistory: boolean;
};

type UpNext = { item: ScheduleItemRecord; isPast: boolean };

function findUpNext(scheduledToday: ScheduleItemRecord[]): UpNext | null {
  const planned = scheduledToday
    .filter((item) => item.status === 'planned')
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  if (planned.length === 0) return null;

  const nowKey = `${todayDateString()}T${nowTimeString24()}`;
  const upcoming = planned.find((item) => item.scheduledFor >= nowKey);
  if (upcoming) return { item: upcoming, isPast: false };
  return { item: planned[planned.length - 1], isPast: true };
}

export default function HomeScreen() {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ScheduleItemRecord | null>(null);
  const [quickLogModal, setQuickLogModal] = useState<'bp' | 'exercise' | null>(null);
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [bpBpm, setBpBpm] = useState('');
  const [exerciseType, setExerciseType] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [exerciseIntensity, setExerciseIntensity] = useState<'light' | 'moderate' | 'vigorous' | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const date = todayDateString();
    const twoDayFloor = dateStringDaysAgo(1);

    Promise.all([
      listMealsForDate(date),
      listScheduledMealsForDate(date),
      getDailyNutrientBreakdown(date),
      getDailySixDimensionsBreakdown(date),
      listCheckins({ checkinType: 'flare', limit: 60 }),
      listCheckins({ checkinType: 'post_meal', limit: 60 }),
      getUserProfile(),
    ]).then(([todaysMeals, scheduledToday, nutrientBreakdown, dimensionsBreakdown, flareEntries, reactionEntries, profile]) => {
      setFirstName(profile.firstName);
      const nutrientEntries = analyzeNutrientIntake(
        nutrientBreakdown.driRows,
        nutrientBreakdown.dayTotals,
        nutrientBreakdown.supplementTotals,
      );
      const sixDsFlagCount = dimensionsBreakdown.day.filter((score) =>
        score.entries.some((entry) => isFlaggedTier(entry.tier)),
      ).length;

      const negativeEntries = [...flareEntries, ...reactionEntries];
      const hasAnyLogHistory = negativeEntries.length > 0;
      const recentSeverities = negativeEntries
        .filter((entry) => entry.loggedAt.slice(0, 10) >= twoDayFloor && entry.severity != null)
        .map((entry) => entry.severity as number);
      const recentMaxSeverity = recentSeverities.length > 0 ? Math.max(...recentSeverities) : null;

      setData({ todaysMeals, scheduledToday, nutrientEntries, sixDsFlagCount, recentMaxSeverity, hasAnyLogHistory });
      setLoading(false);
    });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSkipFromArc(item: ScheduleItemRecord) {
    await setScheduledMealSkipped(item.id, item.status !== 'skipped');
    setSelectedItem(null);
    load();
  }

  function handleLogNowFromArc(item: ScheduleItemRecord) {
    setSelectedItem(null);
    router.push({
      pathname: '/',
      params: {
        scheduleItemId: item.id,
        mealType: item.mealType ?? '',
        title: item.title,
        favoriteId: item.sourceFavoriteId ?? '',
        templateMealId: item.sourceMealId ?? '',
      },
    });
  }

  function closeQuickLogModal() {
    setQuickLogModal(null);
    setBpSystolic('');
    setBpDiastolic('');
    setBpBpm('');
    setExerciseType('');
    setExerciseDuration('');
    setExerciseIntensity(null);
  }

  // Both of these are the "right now" fast path -- no date/time picking,
  // unlike the fuller Exercise/Blood Pressure sections in Bio-Compass's
  // Other lens, which exist for backdated or more careful entry. Same
  // underlying lib/db.ts functions either way, just a shorter form here.
  async function handleSaveBP() {
    const sys = Number(bpSystolic);
    const dia = Number(bpDiastolic);
    if (!Number.isFinite(sys) || !Number.isFinite(dia) || sys <= 0 || dia <= 0) {
      Alert.alert('Enter both a systolic and diastolic number.');
      return;
    }
    const loggedAt = `${todayDateString()}T${nowTimeString24()}`;
    await recordBodyMeasurement({ loggedAt, measurementType: 'blood_pressure_systolic', value: sys, unit: 'mmHg' });
    await recordBodyMeasurement({ loggedAt, measurementType: 'blood_pressure_diastolic', value: dia, unit: 'mmHg' });
    const heartRate = Number(bpBpm);
    if (Number.isFinite(heartRate) && heartRate > 0) {
      await recordBodyMeasurement({ loggedAt, measurementType: 'heart_rate_bpm', value: heartRate, unit: 'bpm' });
    }
    closeQuickLogModal();
  }

  async function handleSaveExercise() {
    if (!exerciseType.trim()) {
      Alert.alert('Enter what kind of activity this was.');
      return;
    }
    const loggedAt = `${todayDateString()}T${nowTimeString24()}`;
    const minutes = Number(exerciseDuration);
    await recordExercise({
      loggedAt,
      exerciseType,
      durationMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : undefined,
      intensity: exerciseIntensity ?? undefined,
    });
    closeQuickLogModal();
  }

  const upNext = data ? findUpNext(data.scheduledToday) : null;
  const mealsLoggedToday = data?.todaysMeals.length ?? 0;
  const nutrientFlagCount = data ? findNutrientGaps(data.nutrientEntries).length + findExcessRisks(data.nutrientEntries).length : 0;
  const worthALookCount = nutrientFlagCount + (data?.sixDsFlagCount ?? 0);
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const coreNutrientRings = data
    ? CORE_NUTRIENT_CODES.map((code) => data.nutrientEntries.find((entry) => entry.nutrientCode === code)).filter(
        (entry): entry is NutrientGapEntry => entry != null,
      )
    : [];

  return (
    <SwipeableTabScreen>
      <View style={styles.screen}>
        <View style={styles.header}>
          <ScreenHeader
            title="Home"
            tabPath="/home"
            helpSections={[
              {
                heading: 'What this page shows',
                body: "A live dashboard, not a static page -- your day's arc, today's fuel gauges, and how you've been feeling, refreshed every time you open it. Tap anything to jump to the tab it summarizes.",
              },
              {
                heading: 'The Day Arc',
                body: 'A visual line across your day (6 AM to 10 PM by default) with a dot for each scheduled item, plus a glowing marker for right now. Tap a dot for details and quick actions.',
              },
              {
                heading: 'Fuel Gauges',
                body: "Rings for iodine, selenium, zinc, iron, copper, vitamin D, calcium, magnesium, and B12 -- nutrients most directly tied to thyroid function and bone health. Green means on track, amber means low, red means deficient or over a safe limit. Filled from today's logged meals and supplements.",
              },
              {
                heading: 'The mood orb',
                body: "Reflects the most severe flare or food reaction you've logged in Bio-Compass over the last 2 days -- cool and calm with nothing recent, warmer the more severe. Gray means you haven't logged anything there yet, which is different from calm.",
              },
              {
                heading: 'What is Hashimoto’s thyroiditis?',
                body: "An autoimmune condition: the immune system produces antibodies (most often against thyroid peroxidase, sometimes thyroglobulin) that gradually attack the thyroid gland, reducing its ability to make thyroid hormone. It's the most common cause of an underactive thyroid (hypothyroidism) in the US and other iodine-sufficient countries, and roughly 7-10x more common in women than men. The course is often slow and uneven -- some people pass through a period of normal, or even briefly overactive, thyroid function before settling into an underactive pattern.",
              },
              {
                heading: 'Common challenges & symptoms',
                body: 'Persistent fatigue, unexplained weight gain, feeling unusually cold, brain fog, low mood, dry skin and hair thinning, joint/muscle aches, constipation, irregular periods, and in some cases a visibly enlarged thyroid (goiter). Hashimoto’s also tends to cluster with other autoimmune conditions such as celiac disease or pernicious anemia, which can compound digestive and nutrient-absorption symptoms. Source: StatPearls (NCBI Bookshelf), "Hashimoto Thyroiditis," NBK459262; NIDDK, "Hashimoto’s Disease."',
              },
              {
                heading: 'Why food and timing matter here',
                body: 'Certain foods and minerals -- calcium and iron are well-documented examples -- can interfere with how well a thyroid prescription is absorbed if eaten too close to a dose, which is part of why Schedules tracks meal, supplement, and prescription timing together. Digestion and absorption are also frequently disrupted in Hashimoto’s, which is why gut and microbiome support is treated as its own goal throughout this app.',
              },
              {
                heading: 'What Inside Story does',
                body: "Not a generic calorie counter -- Inside Story exists to help someone with Hashimoto's relearn how and what to eat, and understand how food affects their own body specifically. Meals builds and scores meals; Insights shows how today stacks up; Schedules handles timing; Trends looks for patterns over time; Bio-Compass is where you record flares, reactions, and new foods; Reports turns it all into something to hand a doctor.",
              },
              {
                heading: 'Personal notes, not medical fact',
                body: "This page's education sections and your own Bio-Compass entries are general information and personal observation, not medical advice, and are not a substitute for care from your own doctor.",
              },
              {
                heading: 'Getting around',
                body: 'Tap a tab at the bottom to jump to it, or swipe left/right anywhere on a screen to move to the next or previous tab -- Home, Meals, Insights, Schedules, Trends, Bio-Compass, Reports, in that order.',
              },
            ]}
          />
        </View>

        <ScreenBackground>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
          >
          <View style={styles.greetingCard}>
            <Text style={styles.greetingText}>
              {timeGreeting()}
              {firstName ? `, ${firstName}` : ''}
            </Text>
            <Text style={styles.affirmationText}>{pickAffirmation()}</Text>
            <Text style={styles.dateText}>{todayLabel}</Text>
          </View>

          {loading ? (
            <Text style={styles.loadingText}>Loading today…</Text>
          ) : (
            <>
              <Text style={styles.sectionHeading}>Your Day</Text>
              <View style={styles.arcCard}>
                <DayArc items={data?.scheduledToday ?? []} onPressItem={setSelectedItem} />
                <Text style={styles.arcCaption}>
                  {upNext
                    ? upNext.isPast
                      ? `${upNext.item.title} was due ${formatTime12(upNext.item.scheduledFor.slice(11, 16))} -- anything to log?`
                      : `Next: ${upNext.item.title} at ${formatTime12(upNext.item.scheduledFor.slice(11, 16))}`
                    : 'Nothing scheduled yet today.'}
                </Text>
              </View>

              <View style={styles.statRow}>
                <TouchableOpacity style={styles.statTile} onPress={() => router.navigate('/')} activeOpacity={0.75}>
                  <Text style={styles.statNumber}>{mealsLoggedToday}</Text>
                  <Text style={styles.statLabel}>{mealsLoggedToday === 1 ? 'Meal logged today' : 'Meals logged today'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statTile} onPress={() => router.navigate('/insights')} activeOpacity={0.75}>
                  <Text style={[styles.statNumber, worthALookCount > 0 && styles.statNumberFlagged]}>
                    {mealsLoggedToday === 0 ? '—' : worthALookCount}
                  </Text>
                  <Text style={styles.statLabel}>Worth a look</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
                <TouchableOpacity style={styles.quickAction} onPress={() => router.navigate('/')} activeOpacity={0.85}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.textOnPrimary} />
                  <Text style={styles.quickActionText}>Log a meal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionSecondary} onPress={() => router.push('/assessment')} activeOpacity={0.85}>
                  <Ionicons name="pulse-outline" size={18} color={colors.primary} />
                  <Text style={styles.quickActionSecondaryText}>Daily check-in</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionSecondary} onPress={() => router.navigate('/log')} activeOpacity={0.85}>
                  <Ionicons name="flame-outline" size={18} color={colors.primary} />
                  <Text style={styles.quickActionSecondaryText}>Log a flare</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionSecondary} onPress={() => setQuickLogModal('bp')} activeOpacity={0.85}>
                  <Ionicons name="heart-outline" size={18} color={colors.primary} />
                  <Text style={styles.quickActionSecondaryText}>Log blood pressure</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionSecondary} onPress={() => setQuickLogModal('exercise')} activeOpacity={0.85}>
                  <Ionicons name="walk-outline" size={18} color={colors.primary} />
                  <Text style={styles.quickActionSecondaryText}>Log exercise</Text>
                </TouchableOpacity>
              </ScrollView>

              <Text style={[styles.sectionHeading, styles.sectionHeadingSpaced]}>Today's Fuel Gauges</Text>
              {mealsLoggedToday === 0 ? (
                <Text style={styles.emptyText}>Log a meal to see today's fuel gauges fill in.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ringRow}>
                  {coreNutrientRings.map((entry) => (
                    <TouchableOpacity key={entry.nutrientCode} onPress={() => router.navigate('/insights')} activeOpacity={0.75}>
                      <ProgressRing
                        percent={entry.percentOfTarget}
                        color={nutrientRingColor(entry.status)}
                        label={entry.displayName}
                        sublabel={`${Math.round(entry.percentOfTarget)}%`}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Text style={[styles.sectionHeading, styles.sectionHeadingSpaced]}>How You're Feeling</Text>
              <View style={styles.orbCard}>
                <EnergyOrb
                  recentMaxSeverity={data?.recentMaxSeverity ?? null}
                  hasAnyHistory={data?.hasAnyLogHistory ?? false}
                  onPress={() => router.navigate('/log')}
                />
              </View>
            </>
          )}

          <Text style={[styles.sectionHeading, styles.sectionHeadingSpaced]}>A Few Things Worth Knowing</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flipRow}>
            <FlipCard
              icon={<Ionicons name="body-outline" size={28} color={colors.primary} />}
              hook="An autoimmune condition affecting your thyroid"
              backTitle="What is Hashimoto's?"
              backBody="Your immune system gradually attacks your thyroid gland, lowering its hormone production. Full picture in Help, top right."
            />
            <FlipCard
              icon={<Ionicons name="time-outline" size={28} color={colors.primary} />}
              hook="Some foods can block your prescription"
              backTitle="Why timing matters"
              backBody="Calcium and iron can block prescription absorption if eaten too close to a dose -- Schedules tracks timing for exactly this."
            />
            <FlipCard
              icon={<Ionicons name="leaf-outline" size={28} color={colors.primary} />}
              hook="Your gut and thyroid are connected"
              backTitle="Gut health matters here"
              backBody="Digestion and absorption are often disrupted in Hashimoto's -- gut and microbiome support is a real goal here, not an afterthought."
            />
            <FlipCard
              icon={<Ionicons name="sparkles-outline" size={28} color={colors.primary} />}
              hook="This app does the hard part for you"
              backTitle="What Inside Story does"
              backBody="Matching foods to your chemistry, catching interactions, and finding your patterns -- so eating feels like following clear rules, not homework."
            />
          </ScrollView>
          </ScrollView>
        </ScreenBackground>

        <Modal visible={selectedItem != null} transparent animationType="fade" onRequestClose={() => setSelectedItem(null)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalBackdropTouchable} onPress={() => setSelectedItem(null)} />
            {selectedItem ? (
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                <Text style={styles.modalMeta}>
                  {formatTime12(selectedItem.scheduledFor.slice(11, 16))} · {capitalize(selectedItem.status)}
                </Text>
                <View style={styles.modalActions}>
                  {selectedItem.status !== 'logged' ? (
                    <TouchableOpacity style={styles.primaryButton} onPress={() => handleLogNowFromArc(selectedItem)}>
                      <Text style={styles.primaryButtonText}>Log now</Text>
                    </TouchableOpacity>
                  ) : null}
                  {selectedItem.status !== 'logged' ? (
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => handleSkipFromArc(selectedItem)}>
                      <Text style={styles.secondaryButtonText}>
                        {selectedItem.status === 'skipped' ? 'Unskip' : 'Skip'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setSelectedItem(null)}>
                    <Text style={styles.secondaryButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </Modal>

        <Modal visible={quickLogModal != null} transparent animationType="fade" onRequestClose={closeQuickLogModal}>
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalBackdropTouchable} onPress={closeQuickLogModal} />
            <View style={styles.modalCard}>
              {quickLogModal === 'bp' ? (
                <>
                  <Text style={styles.modalTitle}>Log blood pressure</Text>
                  <Text style={styles.modalMeta}>Right now, {formatTime12(nowTimeString24())}</Text>
                  <View style={styles.quickInputRow}>
                    <TextInput
                      style={[styles.quickInput, styles.quickInputSmall]}
                      placeholder="120"
                      keyboardType="number-pad"
                      maxLength={3}
                      value={bpSystolic}
                      onChangeText={setBpSystolic}
                    />
                    <Text style={styles.quickInputSeparator}>/</Text>
                    <TextInput
                      style={[styles.quickInput, styles.quickInputSmall]}
                      placeholder="80"
                      keyboardType="number-pad"
                      maxLength={3}
                      value={bpDiastolic}
                      onChangeText={setBpDiastolic}
                    />
                    <Text style={styles.modalMeta}>mmHg</Text>
                  </View>
                  <View style={styles.quickInputRow}>
                    <TextInput
                      style={[styles.quickInput, styles.quickInputSmall]}
                      placeholder="72"
                      keyboardType="number-pad"
                      maxLength={3}
                      value={bpBpm}
                      onChangeText={setBpBpm}
                    />
                    <Text style={styles.modalMeta}>BPM (optional)</Text>
                  </View>
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={closeQuickLogModal}>
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleSaveBP}>
                      <Text style={styles.primaryButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : quickLogModal === 'exercise' ? (
                <>
                  <Text style={styles.modalTitle}>Log exercise</Text>
                  <Text style={styles.modalMeta}>Right now, {formatTime12(nowTimeString24())}</Text>
                  <TextInput
                    style={[styles.quickInput, styles.quickInputFull]}
                    placeholder="e.g. Walk, yoga, weights"
                    value={exerciseType}
                    onChangeText={setExerciseType}
                  />
                  <View style={styles.quickInputRow}>
                    <TextInput
                      style={[styles.quickInput, styles.quickInputSmall]}
                      placeholder="Minutes"
                      keyboardType="number-pad"
                      value={exerciseDuration}
                      onChangeText={setExerciseDuration}
                    />
                    <View style={styles.pillRow}>
                      {(['light', 'moderate', 'vigorous'] as const).map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[styles.pill, exerciseIntensity === option && styles.pillActive]}
                          onPress={() => setExerciseIntensity(option)}
                        >
                          <Text style={[styles.pillText, exerciseIntensity === option && styles.pillTextActive]}>
                            {option[0].toUpperCase() + option.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={closeQuickLogModal}>
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleSaveExercise}>
                      <Text style={styles.primaryButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </Modal>
      </View>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 12 },
  // No backgroundColor here (stays the default transparent) -- that's what
  // lets ScreenBackground's image show through in the gaps between cards.
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  loadingText: { ...typography.body, color: colors.textSecondary, marginBottom: 16 },

  greetingCard: { marginBottom: 16 },
  greetingText: { ...typography.screenTitle, color: colors.textPrimary },
  affirmationText: { ...typography.body, color: colors.primary, marginTop: 2, fontStyle: 'italic' },
  dateText: { ...typography.body, color: colors.textSecondary, marginTop: 2 },

  sectionHeading: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 10 },
  sectionHeadingSpaced: { marginTop: 24 },
  emptyText: { ...typography.body, color: colors.textSecondary },

  arcCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  arcCaption: { ...typography.body, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },

  statRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: { ...typography.screenTitle, color: colors.textPrimary },
  statNumberFlagged: { color: colors.statusFlagged },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },

  quickActionsRow: { flexDirection: 'row', gap: 10, marginTop: 16, paddingRight: 8 },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  quickActionText: { ...typography.bodyEmphasis, color: colors.textOnPrimary },
  quickActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quickActionSecondaryText: { ...typography.bodyEmphasis, color: colors.primary },

  ringRow: { flexDirection: 'row', gap: 16, paddingRight: 8 },

  orbCard: { alignItems: 'center', paddingVertical: 8 },

  flipRow: { flexDirection: 'row', gap: 12, paddingRight: 8, paddingBottom: 8 },

  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: 24 },
  modalBackdropTouchable: { ...StyleSheet.absoluteFillObject },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: { ...typography.sectionTitle, color: colors.textPrimary },
  modalMeta: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primary },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnPrimary },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary },

  quickInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  quickInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
  },
  quickInputSmall: { width: 70, textAlign: 'center' },
  quickInputFull: { width: '100%', marginTop: 12 },
  quickInputSeparator: { ...typography.label, color: colors.textPrimary },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flexShrink: 1 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { ...typography.caption, color: colors.textPrimary },
  pillTextActive: { color: colors.textOnPrimary },
});
