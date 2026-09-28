// Your usual meals, 2026-09-27. The short list per meal that Home offers near
// a meal time, and the one place that list is made.
//
// The list is the person's choice. It is filled from a starter list, from
// their saved meals, from meals they have logged more than once, or typed in
// by hand, and nothing is ever added because of how often something was
// eaten: history only suggests, with an Add button. Meals eaten out are a
// list of their own, so a lunch from the place near work sits apart from
// what gets packed at home. The pure half is lib/usualMeal.ts; the database
// half is lib/usualMealDb.ts.
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { PackPicker } from '../components/PackPicker';
import { PopoverSelect } from '../components/PopoverSelect';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import {
  TYPED_FOODS_NOTE,
  USUAL_SLOTS,
  mealTitle,
  parseFoods,
  startersToOffer,
  suggestionCaption,
  usualMealDetail,
  type StarterMeal,
  type UsualMeal,
  type UsualMealKind,
  type UsualMealSuggestion,
  type UsualSlot,
} from '../lib/usualMeal';
import { standingPhrase, takenWeekdays, type TomorrowSlot } from '../lib/mealPack';
import { getTomorrowSlots } from '../lib/mealPackDb';
import { WEEKDAY_NAMES, WEEKDAY_SHORT } from '../lib/openMeals';
import {
  addUsualMeal,
  getUsualMealSuggestions,
  listSavedMealsForUsual,
  listUsualMeals,
  removeUsualMeal,
  setStandingWeekdays,
} from '../lib/usualMealDb';

const TINT = colors.tabFood;

function todayDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function nowTimeString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

const KIND_LABEL: Record<UsualMealKind, string> = {
  home: 'From home',
  out: 'Eaten out',
};

export default function UsualMealsScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const params = useLocalSearchParams<{ meal?: string }>();
  const startSlot = USUAL_SLOTS.find((slot) => slot === params.meal) ?? 'lunch';

  const [meals, setMeals] = useState<UsualMeal[]>([]);
  const [suggestions, setSuggestions] = useState<Record<UsualSlot, UsualMealSuggestion[]>>({ breakfast: [], lunch: [], dinner: [] });
  const [saved, setSaved] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tomorrow, setTomorrow] = useState<TomorrowSlot[]>([]);
  // The meal whose standing days are open for changing.
  const [daysFor, setDaysFor] = useState<string | null>(null);

  // The add panel: which meal and which list it adds to.
  const [slot, setSlot] = useState<UsualSlot>(startSlot);
  const [kind, setKind] = useState<UsualMealKind>('home');
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [foodsText, setFoodsText] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [list, suggested, savedMeals, tomorrowSlots] = await Promise.all([
      listUsualMeals(),
      getUsualMealSuggestions(todayDateString()),
      listSavedMealsForUsual(),
      getTomorrowSlots(todayDateString(), nowTimeString(), true),
    ]);
    setMeals(list);
    setTomorrow(tomorrowSlots);
    setSuggestions(suggested);
    setSaved(savedMeals);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function run(write: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    try {
      await write();
      await refresh();
    } catch (error) {
      console.error('[UsualMeals] Failed to change the list', error);
    } finally {
      setBusy(false);
    }
  }

  function addStarter(starter: StarterMeal) {
    void run(() =>
      addUsualMeal({
        mealType: slot,
        kind,
        source: starter.source === 'leftovers' ? 'leftovers' : 'typed',
        name: starter.name,
        foods: starter.foods,
      }),
    );
  }

  function addSaved(favoriteId: string) {
    const favorite = saved.find((row) => row.id === favoriteId);
    if (!favorite) return;
    void run(() =>
      addUsualMeal({
        mealType: slot,
        kind,
        source: 'favorite',
        name: favorite.name,
        favoriteId: favorite.id,
        place: kind === 'out' ? place : null,
      }),
    );
  }

  function addSuggestion(suggestion: UsualMealSuggestion) {
    void run(() =>
      addUsualMeal({
        mealType: suggestion.slot,
        kind: 'home',
        source: 'meal',
        name: suggestion.name,
        sourceMealId: suggestion.sourceMealId,
      }),
    );
  }

  function addTyped() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const foods = parseFoods(foodsText);
    void run(async () => {
      await addUsualMeal({
        mealType: slot,
        kind,
        source: 'typed',
        name: trimmed,
        foods,
        place: kind === 'out' ? place : null,
      });
      setName('');
      setPlace('');
      setFoodsText('');
    });
  }

  const starters = startersToOffer(slot, kind, meals);
  const slotSuggestions = suggestions[slot] ?? [];

  function toggleStandingDay(meal: UsualMeal, day: number) {
    const next = meal.standingWeekdays.includes(day) ? meal.standingWeekdays.filter((d) => d !== day) : [...meal.standingWeekdays, day];
    void run(() => setStandingWeekdays(meal.id, next));
  }

  function renderMealRow(meal: UsualMeal) {
    const detail = usualMealDetail(meal);
    const standing = standingPhrase(meal);
    const open = daysFor === meal.id;
    const taken = open ? takenWeekdays(meals, meal) : new Map<number, string>();
    const takenNames = [...new Set(taken.values())];
    return (
      <View key={meal.id} style={styles.group}>
        <View style={styles.mealRow}>
          <Ionicons name={meal.kind === 'out' ? 'storefront-outline' : 'home-outline'} size={16} color={TINT} />
          <View style={styles.mealText}>
            <Text style={styles.mealName}>{meal.name}</Text>
            {detail ? <Text style={styles.mealDetail}>{detail}</Text> : null}
            {standing ? <Text style={styles.mealDetail}>{standing}</Text> : null}
          </View>
          <TouchableOpacity
            onPress={() => setDaysFor(open ? null : meal.id)}
            hitSlop={10}
            accessibilityLabel={`Days ${meal.name} stands on`}
            disabled={busy}
          >
            <Ionicons name={open ? 'calendar' : 'calendar-outline'} size={20} color={TINT} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => void run(() => removeUsualMeal(meal.id))}
            hitSlop={10}
            accessibilityLabel={`Take ${meal.name} off the list`}
            disabled={busy}
          >
            <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        {open ? (
          <View style={styles.group}>
            <Text style={styles.muted}>{STANDING_NOTE}</Text>
            <View style={styles.pillRow}>
              {WEEKDAY_SHORT.map((label, day) => {
                const on = meal.standingWeekdays.includes(day);
                const heldBy = taken.get(day);
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.pill, on && styles.pillActive, heldBy ? styles.pillTaken : null]}
                    onPress={() => toggleStandingDay(meal, day)}
                    disabled={busy || Boolean(heldBy)}
                    accessibilityLabel={heldBy ? `${WEEKDAY_NAMES[day]} is held by ${heldBy}` : WEEKDAY_NAMES[day]}
                  >
                    <Text style={[styles.pillText, on && styles.pillTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {takenNames.map((held) => (
              <Text key={held} style={styles.muted}>
                {`${weekdayList([...taken].filter(([, n]) => n === held).map(([d]) => d))} already ${
                  [...taken].filter(([, n]) => n === held).length === 1 ? 'goes' : 'go'
                } to ${held}.`}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  function renderSlot(which: UsualSlot) {
    const forSlot = meals.filter((meal) => meal.mealType === which);
    return (
      <View key={which} style={styles.band}>
        <Text style={styles.bandTitle}>{mealTitle(which)}</Text>
        {(['home', 'out'] as const).map((listKind) => {
          const rows = forSlot.filter((meal) => meal.kind === listKind);
          return (
            <View key={listKind} style={styles.group}>
              <Text style={styles.groupLabel}>{KIND_LABEL[listKind]}</Text>
              {rows.length > 0 ? rows.map(renderMealRow) : <Text style={styles.muted}>Nothing on this list yet.</Text>}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Your Usual Meals' }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.band}>
          <Text style={styles.lead}>
            A few meals you often have, which Home offers near that meal time to log with one tap. Keep the list short and change it
            whenever you like. Nothing goes on it unless you add it.
          </Text>
        </View>

        {tomorrow.length > 0 ? (
          <View style={styles.band}>
            <Text style={styles.bandTitle}>Tomorrow</Text>
            {tomorrow.map((entry) => (
              <PackPicker
                key={`${entry.date}:${entry.slot}:${entry.pack?.id ?? 'none'}`}
                entry={entry}
                today={todayDateString()}
                nowTime={nowTimeString()}
                tint={TINT}
                onChanged={() => void refresh()}
              />
            ))}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.band}>
            <Text style={styles.muted}>Loading…</Text>
          </View>
        ) : (
          USUAL_SLOTS.map(renderSlot)
        )}

        <View style={styles.band}>
          <Text style={styles.bandTitle}>Add a usual meal</Text>
          <View style={styles.pillRow}>
            {USUAL_SLOTS.map((which) => (
              <TouchableOpacity key={which} style={[styles.pill, slot === which && styles.pillActive]} onPress={() => setSlot(which)}>
                <Text style={[styles.pillText, slot === which && styles.pillTextActive]}>{mealTitle(which)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.pillRow}>
            {(['home', 'out'] as const).map((which) => (
              <TouchableOpacity key={which} style={[styles.pill, kind === which && styles.pillActive]} onPress={() => setKind(which)}>
                <Text style={[styles.pillText, kind === which && styles.pillTextActive]}>{KIND_LABEL[which]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {starters.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupLabel}>Start from one of these</Text>
              <View style={styles.chipWrap}>
                {starters.map((starter) => (
                  <TouchableOpacity key={starter.name} style={styles.chip} onPress={() => addStarter(starter)} disabled={busy}>
                    <Ionicons name="add" size={13} color={colors.textSecondary} />
                    <Text style={styles.chipText}>{starter.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {saved.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupLabel}>Or one of your saved meals</Text>
              <PopoverSelect
                options={saved.map((row) => ({
                  label: row.name,
                  value: row.id,
                }))}
                selected={null}
                onSelect={addSaved}
                placeholder="Pick a saved meal"
                tabColor={TINT}
                searchable={saved.length > 8}
                width={260}
              />
            </View>
          ) : null}

          {kind === 'home' && slotSuggestions.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupLabel}>You have logged these more than once</Text>
              {slotSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.sourceMealId}
                  style={styles.suggestionRow}
                  onPress={() => addSuggestion(suggestion)}
                  disabled={busy}
                >
                  <Ionicons name="add-circle-outline" size={18} color={TINT} />
                  <View style={styles.mealText}>
                    <Text style={styles.mealName}>{suggestion.name}</Text>
                    <Text style={styles.mealDetail}>{suggestionCaption(suggestion)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={styles.group}>
            <Text style={styles.groupLabel}>Or build one</Text>
            <AppTextInput
              style={styles.field}
              value={name}
              onChangeText={setName}
              placeholder={kind === 'out' ? 'Chicken burrito bowl' : 'Lentil soup and bread'}
              placeholderTextColor={colors.textMuted}
              maxLength={80}
            />
            {kind === 'out' ? (
              <AppTextInput
                style={styles.field}
                value={place}
                onChangeText={setPlace}
                placeholder="Where, if you like"
                placeholderTextColor={colors.textMuted}
                maxLength={80}
              />
            ) : null}
            <AppTextInput
              style={[styles.field, styles.fieldTall]}
              value={foodsText}
              onChangeText={setFoodsText}
              placeholder="What is in it, separated by commas"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <Text style={styles.muted}>{TYPED_FOODS_NOTE}</Text>
            <TouchableOpacity
              style={[styles.addButton, { borderColor: TINT }, !name.trim() && styles.addButtonOff]}
              onPress={addTyped}
              disabled={busy || !name.trim()}
            >
              <Ionicons name="add-circle-outline" size={18} color={TINT} />
              <Text style={[styles.addButtonText, { color: TINT }]}>{`Add this ${slot}`}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.band}>
          <Text style={styles.muted}>Taking a meal off this list leaves every meal you logged from it as it was.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const STANDING_NOTE =
  'A standing meal is the one you have on these days, like a lunch you pack every Friday. Home offers it on those days and the meal plan leaves that meal open for it.';

function weekdayList(days: number[]): string {
  const names = days.sort((a, b) => a - b).map((d) => WEEKDAY_NAMES[d]);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  band: {
    ...homeBandStyle,
    borderColor: TINT,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 10,
  },
  bandTitle: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    ...textShadow,
  },
  lead: { ...typography.body, color: colors.textSecondary, ...textShadow },
  muted: { ...typography.caption, color: colors.textMuted, ...textShadow },
  group: { gap: 6 },
  groupLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    ...textShadow,
  },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  mealText: { flex: 1, gap: 2 },
  mealName: { ...typography.body, color: colors.textPrimary, ...textShadow },
  mealDetail: { ...typography.caption, color: colors.textMuted, ...textShadow },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  pillActive: { backgroundColor: TINT, borderColor: TINT },
  pillTaken: { opacity: 0.4 },
  pillText: { ...typography.caption, color: colors.textSecondary },
  pillTextActive: { color: colors.background },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  chipText: { ...typography.caption, color: colors.textSecondary },
  field: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    ...textShadow,
  },
  fieldTall: { minHeight: 64, textAlignVertical: 'top' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.surfaceMuted,
  },
  addButtonOff: { opacity: 0.5 },
  addButtonText: { ...typography.caption },
});
