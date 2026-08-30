// "Find a meal you've had" -- 2026-08-30, replacing the Log Again tile strip
// that shipped a few hours earlier the same day.
//
// Direct steer, and it was right: "random meals being presented to possibly
// have them again doesn't make sense. It could be a shortcut to reschedule a
// past meal and they then see a standard scrollable list of meal names to
// choose from, with a search field to filter by a specific word rather than
// remembering what it was named in the app."
//
// The premise behind the tiles (most logging is a repeat of something already
// logged) still holds. The presentation did not. Eight guessed tiles assume the
// app knows someone is eating right now, and the moment the meal they want is
// not among those eight there is no way to reach it at all. A searchable list
// serves the moments that actually happen: something was eaten instead of what
// was planned, logging is being caught up after the fact, or a known meal is
// being put on the calendar.
//
// relogMeal and the rest of the machinery underneath are unchanged; only the
// way in is different.
//
// Renamed the same day, on a second steer: "Find a Meal You've Had is
// mislabeled because they could want to find a meal they haven't had yet. It
// should also have access to the system meals generally in an order that makes
// sense." So this is not a history list, it is the whole catalogue of meals
// reachable without opening a builder: what has been logged, what has been
// favorited, and all 300-plus curated recipes, sectioned by which builder they
// belong to, in the same order the Digest's own Recipes category uses.
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { useInfoAlert } from '../components/InfoAlert';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  createMealFromComponents,
  deleteMealPhotoDraft,
  getMealFavorite,
  listFavorites,
  listAllCuratedRecipes,
  listRecentDistinctMeals,
  listScheduledMealsForDate,
  markScheduledMealLogged,
  logCuratedRecipeAsMeal,
  relogMeal,
  scheduleCuratedRecipe,
  scheduleMeal,
  type BuilderFavoriteItemType,
  type CuratedRecipeListRow,
  type RecentMealSummary,
  type ScheduleItemRecord,
} from '../lib/db';
import { buildTime24, describeTimeInputProblem, formatTime12, type TimeOfDayInput } from '../lib/timeOfDay';

// How many rows are loaded at once. High enough that a personal history is
// covered whole, and the search runs in SQL rather than over this list, so a
// name past the cap is still reachable by typing it.
const LIST_LIMIT = 300;

type PickableMeal =
  | { kind: 'meal'; id: string; name: string; mealType: string; lastEatenAt: string; timesLogged: number }
  | { kind: 'favorite'; id: string; name: string }
  | { kind: 'curated'; id: string; name: string; builderType: BuilderFavoriteItemType; healthBenefit: string };

// The order the Digest's own Recipes category already lists these in, reused
// rather than invented, so a system meal sits where someone who has browsed
// Recipes would expect it.
const BUILDER_SECTIONS: { type: BuilderFavoriteItemType; label: string }[] = [
  { type: 'side', label: 'Sides' },
  { type: 'salad', label: 'Salads & Bowls' },
  { type: 'soup', label: 'Soups' },
  { type: 'handheld', label: 'Handhelds' },
  { type: 'smoothie', label: 'Smoothies' },
  { type: 'beverage', label: 'Beverages' },
  { type: 'fermentation', label: 'Fermentation' },
  { type: 'snack', label: 'Snacks' },
  { type: 'bakedGoods', label: 'Baked Goods' },
  { type: 'sauce', label: 'Sauces' },
  { type: 'dessert', label: 'Desserts' },
];

// A flat list of headers and rows, so one FlatList can render sections without
// pulling in SectionList and its own separate rendering contract.
type ListEntry = { type: 'header'; key: string; label: string } | { type: 'row'; key: string; meal: PickableMeal };

type Mode = 'list' | 'actions' | 'earlier' | 'schedule' | 'replace';

function todayLocalDateString(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function nowLocalTime24(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function dateStringDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function FindMealScreen() {
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  // Set only when this screen was opened to finish a photo taken earlier. The
  // photo goes onto whatever gets logged, and the meal is dated to when the
  // photo was taken rather than to now.
  const { draftId, photoUri, capturedAt } = useLocalSearchParams<{
    draftId?: string;
    photoUri?: string;
    capturedAt?: string;
  }>();

  const [query, setQuery] = useState('');
  const [meals, setMeals] = useState<ListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('list');
  const [selected, setSelected] = useState<PickableMeal | null>(null);
  const [busy, setBusy] = useState(false);
  const [time, setTime] = useState<TimeOfDayInput>({ hour: '', minute: '', ampm: '' });
  const [dateText, setDateText] = useState(todayLocalDateString());
  const [plannedToday, setPlannedToday] = useState<ScheduleItemRecord[]>([]);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const [recent, favorites, curated] = await Promise.all([
        listRecentDistinctMeals(LIST_LIMIT, search),
        listFavorites(LIST_LIMIT, 'meal'),
        // Bundled reference content, identical for everyone and unchanging
        // between searches, so this is filtered in memory rather than requeried
        // on every keystroke.
        listAllCuratedRecipes(),
      ]);
      const trimmed = search.trim().toLowerCase();
      // Favorites are filtered here rather than in SQL because listFavorites is
      // shared with every other favorite type and does not take a query. The
      // list is small enough that this costs nothing.
      const favoriteRows: PickableMeal[] = favorites
        .filter((favorite) => !trimmed || favorite.name.toLowerCase().includes(trimmed))
        .map((favorite) => ({ kind: 'favorite' as const, id: favorite.id, name: favorite.name }));
      const mealRows: PickableMeal[] = recent.map((meal: RecentMealSummary) => ({
        kind: 'meal' as const,
        id: meal.id,
        name: meal.name,
        mealType: meal.mealType,
        lastEatenAt: meal.eatenAt,
        timesLogged: meal.timesLogged,
      }));
      const curatedRows: PickableMeal[] = curated
        .filter((recipe: CuratedRecipeListRow) => !trimmed || recipe.name.toLowerCase().includes(trimmed))
        .map((recipe: CuratedRecipeListRow) => ({
          kind: 'curated' as const,
          id: recipe.id,
          name: recipe.name,
          builderType: recipe.builderType,
          healthBenefit: recipe.healthBenefit,
        }));

      const entries: ListEntry[] = [];
      const pushSection = (label: string, rows: PickableMeal[]) => {
        if (rows.length === 0) return;
        entries.push({ type: 'header', key: `header-${label}`, label });
        for (const meal of rows) entries.push({ type: 'row', key: `${meal.kind}-${meal.id}`, meal });
      };

      // Your own things first: a meal already logged or deliberately saved is
      // far more likely to be what someone is reaching for than one of 300-plus
      // system recipes.
      pushSection('Meals you have logged', mealRows);
      pushSection('Your favorites', favoriteRows);
      for (const section of BUILDER_SECTIONS) {
        pushSection(section.label, curatedRows.filter((row) => row.kind === 'curated' && row.builderType === section.type));
      }
      setMeals(entries);
    } catch (error) {
      console.error('[FindMealScreen] Failed to load meals', error);
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(query);
  }, [query, load]);

  useEffect(() => {
    listScheduledMealsForDate(todayLocalDateString())
      .then((scheduled) => setPlannedToday(scheduled.filter((item) => item.status === 'planned')))
      .catch((error) => console.error('[FindMealScreen] Failed to load planned meals', error));
  }, []);

  // Only the draft ROW goes: the photo file now belongs to the meal, and
  // deleting it here would take the photo off the meal that just received it.
  async function clearFinishedDraft() {
    if (!draftId) return;
    try {
      await deleteMealPhotoDraft(draftId);
    } catch (error) {
      console.error('[FindMealScreen] Logged the meal but could not clear the photo draft', error);
    }
  }

  // One place that knows how to turn a picked row into a real logged meal, so
  // "now", "earlier" and "replace a planned meal" cannot drift apart. A past
  // meal is copied by relogMeal; a favorite is a template with no meal of its
  // own to copy, so it goes through createMealFromComponents.
  async function logSelectedAt(eatenAt: string): Promise<string | null> {
    if (!selected) return null;
    if (selected.kind === 'curated') {
      // A curated recipe is reference content shared by everyone, so it becomes
      // one of this person's own saved dishes first, exactly as "Build This
      // Recipe" already does inside a builder.
      const result = await logCuratedRecipeAsMeal({
        recipeId: selected.id,
        mealType: 'snack',
        eatenAt,
        photoUri: photoUri ?? null,
      });
      if ('error' in result) {
        showInfoAlert('That did not log', result.error);
        return null;
      }
      return result.id;
    }
    if (selected.kind === 'meal') {
      const result = await relogMeal(selected.id, eatenAt, { photoUri: photoUri ?? null });
      if ('error' in result) {
        showInfoAlert('That did not log', result.error);
        return null;
      }
      return result.id;
    }
    const favorite = await getMealFavorite(selected.id);
    if (!favorite) {
      showInfoAlert('That did not log', 'That favorite could not be opened. It may have been deleted.');
      return null;
    }
    const result = await createMealFromComponents({
      name: favorite.name,
      mealType: favorite.mealType || 'snack',
      eatenAt,
      notes: favorite.notes,
      isImmediate: true,
      components: favorite.components,
    });
    if ('error' in result) {
      showInfoAlert('That did not log', result.error);
      return null;
    }
    return result.id;
  }

  async function handleLogNow() {
    setBusy(true);
    try {
      // A photo taken at 12:40 and finished at 3pm was still eaten at 12:40.
      const eatenAt =
        capturedAt && capturedAt.length >= 16 ? capturedAt : `${todayLocalDateString()}T${nowLocalTime24()}`;
      const id = await logSelectedAt(eatenAt);
      if (!id) return;
      await clearFinishedDraft();
      router.back();
    } catch (error) {
      console.error('[FindMealScreen] Failed to log now', error);
      showInfoAlert('That did not log', 'Something went wrong saving it. Check Past Meals before trying again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLogEarlier() {
    const time24 = buildTime24(time.hour, time.minute, time.ampm);
    if (!time24) {
      showInfoAlert('Almost there', describeTimeInputProblem(time.hour, time.minute, time.ampm));
      return;
    }
    setBusy(true);
    try {
      const id = await logSelectedAt(`${todayLocalDateString()}T${time24}`);
      if (!id) return;
      await clearFinishedDraft();
      router.back();
    } catch (error) {
      console.error('[FindMealScreen] Failed to log earlier', error);
      showInfoAlert('That did not log', 'Something went wrong saving it. Check Past Meals before trying again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSchedule() {
    if (!selected) return;
    const time24 = buildTime24(time.hour, time.minute, time.ampm);
    if (!time24) {
      showInfoAlert('Almost there', describeTimeInputProblem(time.hour, time.minute, time.ampm));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText.trim())) {
      showInfoAlert('Almost there', 'Enter the date as YYYY-MM-DD, or use one of the buttons above it.');
      return;
    }
    setBusy(true);
    try {
      if (selected.kind === 'curated') {
        const failure = await scheduleCuratedRecipe({
          recipeId: selected.id,
          mealType: 'snack',
          scheduledFor: `${dateText.trim()}T${time24}`,
        });
        if (failure) {
          showInfoAlert('That did not schedule', failure.error);
          return;
        }
        router.back();
        return;
      }
      // Scheduling records where this came from rather than copying it: a
      // planned meal is resolved into real components at the moment it is
      // actually logged, which is what every other scheduling path in the app
      // already does.
      await scheduleMeal({
        title: selected.name,
        mealType: selected.kind === 'meal' ? selected.mealType : 'snack',
        scheduledFor: `${dateText.trim()}T${time24}`,
        sourceMealId: selected.kind === 'meal' ? selected.id : undefined,
        sourceFavoriteId: selected.kind === 'favorite' ? selected.id : undefined,
      });
      router.back();
    } catch (error) {
      console.error('[FindMealScreen] Failed to schedule', error);
      showInfoAlert('That did not schedule', 'Something went wrong saving it. Give it another try.');
    } finally {
      setBusy(false);
    }
  }

  // Logs what was actually eaten and marks the planned slot as covered by it.
  // Marking it skipped would say no meal happened at all; leaving it planned
  // would have the day read as two meals when there was one.
  async function handleReplacePlanned(planned: ScheduleItemRecord) {
    setBusy(true);
    try {
      const eatenAt = planned.scheduledFor.length >= 16 ? planned.scheduledFor : `${todayLocalDateString()}T${nowLocalTime24()}`;
      const id = await logSelectedAt(eatenAt);
      if (!id) return;
      try {
        await markScheduledMealLogged(planned.id, id);
      } catch (error) {
        console.error('[FindMealScreen] Logged, but could not resolve the planned meal', error);
        showInfoAlert(
          'Logged, but the planned meal is still showing',
          'What you ate is saved. Marking the planned meal as covered by it did not work, so you may still see it on your schedule.',
        );
      }
      await clearFinishedDraft();
      router.back();
    } catch (error) {
      console.error('[FindMealScreen] Failed to replace a planned meal', error);
      showInfoAlert('That did not log', 'Something went wrong saving it. Check Past Meals before trying again.');
    } finally {
      setBusy(false);
    }
  }

  function openActionsFor(meal: PickableMeal) {
    setSelected(meal);
    // Seeded to now, so "log it earlier" starts somewhere sensible and only
    // needs the hour nudged back rather than three fields filled from blank.
    const [hour24, minute] = nowLocalTime24().split(':');
    const hourNumber = Number(hour24);
    const hour12 = hourNumber % 12 === 0 ? 12 : hourNumber % 12;
    setTime({ hour: String(hour12), minute, ampm: hourNumber < 12 ? 'AM' : 'PM' });
    setDateText(todayLocalDateString());
    setMode('actions');
  }

  function describeMeal(meal: PickableMeal): string {
    if (meal.kind === 'curated') return meal.healthBenefit || 'System recipe';
    if (meal.kind === 'favorite') return 'Saved favorite';
    const mealType = meal.mealType ? meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1) : 'Meal';
    const times = meal.timesLogged === 1 ? 'logged once' : `${meal.timesLogged} times`;
    return `${mealType} · ${times} · last on ${meal.lastEatenAt.slice(0, 10)}`;
  }

  function renderTimeFields() {
    return (
      <View style={styles.timeRow}>
        <AppTextInput
          value={time.hour}
          onChangeText={(text) => setTime((current) => ({ ...current, hour: text }))}
          style={styles.timeInput}
          keyboardType="number-pad"
          placeholder="12"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <AppTextInput
          value={time.minute}
          onChangeText={(text) => setTime((current) => ({ ...current, minute: text }))}
          style={styles.timeInput}
          keyboardType="number-pad"
          placeholder="30"
          placeholderTextColor={colors.textMuted}
        />
        {(['AM', 'PM'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.pill, time.ampm === option ? styles.pillActive : null]}
            activeOpacity={0.8}
            onPress={() => setTime((current) => ({ ...current, ampm: option }))}
          >
            <Text style={[styles.pillText, time.ampm === option ? styles.pillTextActive : null]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderList() {
    return (
      <FlatList
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        data={meals}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {photoUri ? (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Finishing this photo</Text>
                <Image source={{ uri: photoUri }} style={styles.draftPhoto} />
                <Text style={styles.muted}>
                  Nothing is read from the picture. It is kept with whatever you pick, and the meal is dated to when
                  the photo was taken.
                </Text>
              </View>
            ) : null}
            <AppTextInput
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              placeholder="Search meals and recipes"
              placeholderTextColor={colors.textMuted}
            />
            {loading ? <ActivityIndicator color={colors.accent} /> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.card}>
              <Text style={styles.muted}>
                {query.trim()
                  ? 'Nothing here matches that.'
                  : 'Meals you log, meals you favorite, and every system recipe show up here to reuse or schedule.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <Text style={styles.sectionHeader}>{item.label}</Text>
          ) : (
            <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => openActionsFor(item.meal)}>
              <Ionicons
                name={
                  item.meal.kind === 'favorite'
                    ? 'star-outline'
                    : item.meal.kind === 'curated'
                      ? 'book-outline'
                      : 'restaurant-outline'
                }
                size={18}
                color={colors.accent}
                style={textShadow}
              />
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowName} numberOfLines={2}>
                  {item.meal.name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {describeMeal(item.meal)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )
        }
      />
    );
  }

  function renderActions() {
    if (!selected) return null;
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <Text style={styles.title}>{selected.name}</Text>
        <Text style={styles.muted}>{describeMeal(selected)}</Text>

        <TouchableOpacity
          style={[styles.primaryButton, busy ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleLogNow}
          disabled={busy}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.background} />
          <Text style={styles.primaryButtonText}>{busy ? 'Saving…' : 'Log it now'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('earlier')}>
          <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>Log it earlier today</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('schedule')}>
          <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>Schedule it</Text>
        </TouchableOpacity>

        {plannedToday.length > 0 ? (
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('replace')}>
            <Ionicons name="swap-horizontal-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Use it instead of a planned meal</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('list')}>
          <Text style={styles.secondaryButtonText}>Back to the list</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderEarlier() {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <Text style={styles.title}>{selected?.name}</Text>
        <Text style={styles.sectionLabel}>What time did you eat it?</Text>
        <Text style={styles.muted}>Today, at whatever time it actually happened.</Text>
        {renderTimeFields()}
        <TouchableOpacity
          style={[styles.primaryButton, busy ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleLogEarlier}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>{busy ? 'Saving…' : 'Log it'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('actions')}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderSchedule() {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <Text style={styles.title}>{selected?.name}</Text>
        <Text style={styles.sectionLabel}>When should this be scheduled?</Text>
        <View style={styles.quickDateRow}>
          {[
            { label: 'Today', value: todayLocalDateString() },
            { label: 'Tomorrow', value: dateStringDaysFromToday(1) },
            { label: 'In a week', value: dateStringDaysFromToday(7) },
          ].map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[styles.pill, dateText === option.value ? styles.pillActive : null]}
              activeOpacity={0.8}
              onPress={() => setDateText(option.value)}
            >
              <Text style={[styles.pillText, dateText === option.value ? styles.pillTextActive : null]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <AppTextInput
          value={dateText}
          onChangeText={setDateText}
          style={styles.searchInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
        />
        {renderTimeFields()}
        <TouchableOpacity
          style={[styles.primaryButton, busy ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleSchedule}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>{busy ? 'Saving…' : 'Schedule it'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('actions')}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderReplace() {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <Text style={styles.title}>{selected?.name}</Text>
        <Text style={styles.sectionLabel}>Which planned meal did this replace?</Text>
        <Text style={styles.muted}>
          It gets logged at the planned meal&apos;s own time, and that meal stops sitting on your schedule waiting.
        </Text>
        {plannedToday.map((planned) => (
          <TouchableOpacity
            key={planned.id}
            style={styles.row}
            activeOpacity={0.8}
            onPress={() => handleReplacePlanned(planned)}
            disabled={busy}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color={colors.accent} style={textShadow} />
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowName} numberOfLines={2}>
                {planned.title}
              </Text>
              <Text style={styles.rowMeta}>
                {planned.scheduledFor.length >= 16 ? formatTime12(planned.scheduledFor.slice(11, 16)) : ''}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('actions')}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Find a Meal' }} />
      {infoAlertElement}
      {mode === 'list'
        ? renderList()
        : mode === 'actions'
          ? renderActions()
          : mode === 'earlier'
            ? renderEarlier()
            : mode === 'schedule'
              ? renderSchedule()
              : renderReplace()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 10 },
  listHeader: { gap: 10, marginBottom: 4 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, marginTop: 4, ...textShadow },
  muted: { ...typography.caption, color: colors.textMuted, ...textShadow },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  draftPhoto: { width: '100%', height: 160, borderRadius: 10, backgroundColor: colors.border },
  searchInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    ...textShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  sectionHeader: {
    ...typography.bodyEmphasis,
    color: colors.accent,
    marginTop: 10,
    marginBottom: 6,
    ...textShadow,
  },
  rowTextWrap: { flex: 1, gap: 2 },
  rowName: { ...typography.body, color: colors.textPrimary, ...textShadow },
  rowMeta: { ...typography.caption, color: colors.textMuted, ...textShadow },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: {
    width: 64,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    textAlign: 'center',
    ...textShadow,
  },
  timeSeparator: { ...typography.body, color: colors.textSecondary, ...textShadow },
  quickDateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  pillText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  // Dark text on the light accent fill: cancel the shadow it would otherwise
  // inherit. See constants/typography.ts.
  pillTextActive: { color: colors.background, textShadowColor: 'transparent', textShadowRadius: 0 },
  disabled: { opacity: 0.6 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 14,
  },
  primaryButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnButton,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
});
