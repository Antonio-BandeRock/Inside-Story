// Pack for tomorrow, 2026-09-27. One meal tomorrow that the plan left open
// or that a standing meal holds: choose what it will be, from the usual
// lists, tonight's leftovers, a saved meal or something typed, and set a
// reminder to make it. Used on Home in the evening and on Your Usual Meals.
// The pure half is lib/mealPack.ts and the database half lib/mealPackDb.ts.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { getMealPlanTimes } from '../lib/db';
import {
  NO_SAVED_MEALS,
  leftoversName,
  prepOptions,
  prepSetSentence,
  tomorrowCaption,
  tomorrowTitle,
  type PackChoice,
  type TomorrowSlot,
} from '../lib/mealPack';
import { getTonightsDinner, packMeal, setPackPrepReminder, unpackMeal } from '../lib/mealPackDb';
import { explainNotYet } from '../lib/notYet';
import { TYPED_FOODS_NOTE, orderUsualMeals, parseFoods, type UsualMeal, type UsualMealKind } from '../lib/usualMeal';
import { listSavedMealsForUsual, listUsualMeals } from '../lib/usualMealDb';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';

type Props = {
  entry: TomorrowSlot;
  // "YYYY-MM-DD" and "HH:mm", local.
  today: string;
  nowTime: string;
  tint: string;
  // Called after anything is written, so the screen reloads.
  onChanged: () => void;
};

export function PackPicker({ entry, today, nowTime, tint, onChanged }: Props) {
  const [usual, setUsual] = useState<UsualMeal[]>([]);
  const [saved, setSaved] = useState<{ id: string; name: string }[]>([]);
  const [dinner, setDinner] = useState<{ id: string; name: string } | null>(null);
  const [usualTime, setUsualTime] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [typing, setTyping] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<UsualMealKind>('home');
  const [place, setPlace] = useState('');
  const [foodsText, setFoodsText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    void Promise.all([listUsualMeals(), listSavedMealsForUsual(), getTonightsDinner(today), getMealPlanTimes()]).then(
      ([meals, savedMeals, tonight, times]) => {
        if (!live) return;
        setUsual(orderUsualMeals(meals.filter((meal) => meal.mealType === entry.slot)));
        setSaved(savedMeals);
        setDinner(tonight);
        setUsualTime(times[entry.slot]);
      },
    );
    return () => {
      live = false;
    };
  }, [entry.slot, today]);

  async function run(write: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    try {
      await write();
      setChoosing(false);
      setTyping(false);
      onChanged();
    } catch (error) {
      console.error('[PackPicker] Failed to save tomorrow’s meal', error);
    } finally {
      setBusy(false);
    }
  }

  function choose(choice: PackChoice) {
    void run(() => packMeal(entry.date, entry.slot, choice));
  }

  function chooseTyped() {
    const trimmed = name.trim();
    if (!trimmed) return explainNotYet('Give the meal a name first.');
    choose({ source: 'typed', name: trimmed, kind, place: kind === 'out' ? place : null, foods: parseFoods(foodsText) });
    setName('');
    setPlace('');
    setFoodsText('');
  }

  const pack = entry.pack;
  const showChoices = !pack || choosing;
  const home = usual.filter((meal) => meal.kind === 'home');
  const out = usual.filter((meal) => meal.kind === 'out');
  const button = [styles.button, { borderColor: tint }];
  const buttonText = [styles.buttonText, { color: tint }];

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{tomorrowTitle(entry.slot)}</Text>
      <Text style={styles.caption}>{tomorrowCaption(entry)}</Text>

      {pack && !choosing ? (
        <>
          {pack.kind === 'home' ? (
            pack.prepAt ? (
              <View style={styles.row}>
                <Text style={styles.caption}>{prepSetSentence(pack.prepAt)}</Text>
                <TouchableOpacity style={button} onPress={() => void run(() => setPackPrepReminder(pack, null))} disabled={busy}>
                  <Ionicons name="notifications-off-outline" size={16} color={tint} style={textShadow} />
                  <Text style={buttonText}>No reminder</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.group}>
                <Text style={styles.label}>Remind me to make it</Text>
                <View style={styles.row}>
                  {prepOptions(today, nowTime, usualTime).map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={button}
                      onPress={() => void run(() => setPackPrepReminder(pack, option.scheduledFor))}
                      disabled={busy}
                    >
                      <Ionicons name="alarm-outline" size={16} color={tint} style={textShadow} />
                      <Text style={buttonText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )
          ) : null}
          <View style={styles.row}>
            <TouchableOpacity style={button} onPress={() => setChoosing(true)} disabled={busy}>
              <Ionicons name="swap-horizontal-outline" size={16} color={tint} style={textShadow} />
              <Text style={buttonText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity style={button} onPress={() => void run(() => unpackMeal(pack.id))} disabled={busy}>
              <Ionicons name="close-outline" size={16} color={tint} style={textShadow} />
              <Text style={buttonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {showChoices ? (
        <>
          {home.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.label}>From home</Text>
              <View style={styles.row}>
                {home.map((meal) => (
                  <TouchableOpacity key={meal.id} style={button} onPress={() => choose({ source: 'usual', meal })} disabled={busy}>
                    <Ionicons name="home-outline" size={16} color={tint} style={textShadow} />
                    <Text style={buttonText}>{meal.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
          {out.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.label}>Eating out</Text>
              <View style={styles.row}>
                {out.map((meal) => (
                  <TouchableOpacity key={meal.id} style={button} onPress={() => choose({ source: 'usual', meal })} disabled={busy}>
                    <Ionicons name="storefront-outline" size={16} color={tint} style={textShadow} />
                    <Text style={buttonText}>{meal.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
          {entry.slot !== 'dinner' ? (
            <View style={styles.row}>
              <TouchableOpacity
                style={button}
                onPress={() => choose({ source: 'leftovers', dinnerId: dinner?.id ?? null, dinnerName: dinner?.name ?? null })}
                disabled={busy}
              >
                <Ionicons name="file-tray-full-outline" size={16} color={tint} style={textShadow} />
                <Text style={buttonText}>{leftoversName(dinner?.name ?? null)}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.group}>
            <Text style={styles.label}>One of your saved meals</Text>
            {saved.length > 0 ? (
              <PopoverSelect
                options={saved.map((row) => ({ label: row.name, value: row.id }))}
                selected={null}
                onSelect={(id: string) => {
                  const favorite = saved.find((row) => row.id === id);
                  if (favorite) choose({ source: 'favorite', favoriteId: favorite.id, name: favorite.name });
                }}
                placeholder="Pick a saved meal"
                tabColor={tint}
                searchable={saved.length > 8}
                width={260}
              />
            ) : (
              <Text style={styles.caption}>{NO_SAVED_MEALS}</Text>
            )}
          </View>
          {typing ? (
            <View style={styles.group}>
              <View style={styles.row}>
                {(['home', 'out'] as const).map((which) => (
                  <TouchableOpacity key={which} style={[styles.pill, kind === which && { backgroundColor: tint, borderColor: tint }]} onPress={() => setKind(which)}>
                    <Text style={[styles.pillText, kind === which && styles.pillTextActive]}>{which === 'home' ? 'From home' : 'Eating out'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <AppTextInput
                style={styles.field}
                value={name}
                onChangeText={setName}
                placeholder={kind === 'out' ? 'Chicken burrito bowl' : 'Rice, beans and greens'}
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
              ) : (
                <AppTextInput
                  style={styles.field}
                  value={foodsText}
                  onChangeText={setFoodsText}
                  placeholder="What is in it, separated by commas"
                  placeholderTextColor={colors.textMuted}
                />
              )}
              <Text style={styles.caption}>{TYPED_FOODS_NOTE}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[button, !name.trim() && styles.off]} onPress={chooseTyped} disabled={busy}>
                  <Ionicons name="checkmark" size={16} color={tint} style={textShadow} />
                  <Text style={buttonText}>Choose this</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.row}>
              <TouchableOpacity style={button} onPress={() => setTyping(true)} disabled={busy}>
                <Ionicons name="create-outline" size={16} color={tint} style={textShadow} />
                <Text style={buttonText}>Something else</Text>
              </TouchableOpacity>
              {choosing ? (
                <TouchableOpacity style={button} onPress={() => setChoosing(false)} disabled={busy}>
                  <Ionicons name="arrow-undo-outline" size={16} color={tint} style={textShadow} />
                  <Text style={buttonText}>Keep it</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 10, gap: 8 },
  title: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  label: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  group: { gap: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  buttonText: { ...typography.caption, ...textShadow },
  off: { opacity: 0.5 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillText: { ...typography.caption, color: colors.textSecondary },
  pillTextActive: { color: colors.background },
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
});
