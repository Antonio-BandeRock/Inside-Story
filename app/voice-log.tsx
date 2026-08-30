// "Say What You Ate" -- quick-log phase 3, 2026-08-30 (Open Next Steps item
// 21). Speak a meal, see exactly what the app worked out, correct anything
// wrong, then log it.
//
// Why this exists: logging discipline is this project's named #1 risk, and
// phases 1 and 2 only cover food the app has already seen (a meal logged
// before, a product with a barcode). Speaking is the one input that covers
// anything else without opening a builder.
//
// 2026-08-30, direct steer on what that "anything else" actually is in
// practice: "Say what you ate should be related to eating out at a restaurant
// OR if you went off of the scheduled meal, this would be an easy and quick
// way to replace it." Correct, and it is the case with the least chance of
// ever being logged otherwise -- a restaurant plate has no barcode, no recipe
// and no saved record anywhere, and a meal eaten instead of a planned one
// leaves the planned one sitting unresolved forever. So this screen also
// offers today's still-planned meals to replace, and a way to mark a meal as
// eaten out, rather than being a generic dictation box that happens to log
// food.
//
// Two rules shape the whole screen:
//
//   1. Nothing is ever logged from speech alone. A recognizer returns literal
//      words with no idea what a food is, and lib/quickLog.ts's parser is a
//      deliberately small vocabulary on top of that. Both are good enough to
//      make a proposal and nowhere near good enough to be trusted silently, so
//      every amount and every matched food is shown and editable first.
//
//   2. An amount that cannot honestly be resolved says so instead of guessing.
//      "A cup of rice" has no weight the app can work out (see
//      estimateGramsForFood in lib/db.ts), and quietly assuming one would put a
//      number nobody chose into the record and then into every trend built on
//      it. Those rows are flagged and excluded until a weight is given.
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { useInfoAlert } from '../components/InfoAlert';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  createMeal,
  createMealFromComponents,
  deleteMealPhotoDraft,
  estimateGramsForFood,
  getMealFavorite,
  listFavorites,
  listRecentDistinctMeals,
  listScheduledMealsForDate,
  markScheduledMealLogged,
  relogMeal,
  resolveFoodOptionForBaseName,
  searchReferenceFoodNamesAcrossCategories,
  getUserProfile,
  type GlobalFoodMatch,
  type MealIngredientInput,
  type RecentMealSummary,
  type ScheduleItemRecord,
} from '../lib/db';
import {
  CONFIDENT_MATCH_SCORE,
  inferMealTypeForTime,
  buildFoodSearchLadder,
  parseSpokenItem,
  QUICK_LOG_MEAL_TYPES,
  quickLogMealTypeLabel,
  scoreNameMatch,
  splitSpokenItems,
  type QuickLogMealType,
} from '../lib/quickLog';
import { useVoiceDictation, type VoiceRecognitionMode } from '../hooks/useVoiceDictation';

// meals.eaten_at's own stored format: 'YYYY-MM-DDTHH:mm', local time. See
// listMealsForDate in lib/db.ts for why a UTC toISOString() would break every
// date-matching lens in the app.
function nowLocalTime24(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function todayLocalDateString(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function nowLocalDateTimeString(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${nowLocalTime24()}`;
}

// One row of the review list: what was said, what it was matched to, how much,
// and whether that amount can actually be turned into a weight.
type ReviewItem = {
  key: string;
  spokenText: string;
  // Every candidate the search turned up, best first, so a wrong top match is
  // one tap from being corrected rather than a dead end.
  candidates: { match: GlobalFoodMatch; score: number }[];
  candidateIndex: number;
  // Resolved from the chosen candidate. Null when nothing matched at all.
  foodId: string | null;
  foodName: string | null;
  category: string | null;
  amountText: string;
  unit: string;
  // Null means the amount cannot be converted to a weight, which is a real
  // answer, not a loading state. See estimateGramsForFood.
  grams: number | null;
  resolving: boolean;
};

// A whole-transcript match against something already logged or favorited.
// Checked before any per-item parsing, because "greek yogurt bowl" is one meal
// a person already has, not three foods to reassemble.
type MealProposal = {
  kind: 'recent' | 'favorite';
  id: string;
  name: string;
  score: number;
};

type Phase = 'listening' | 'resolving' | 'review' | 'saving';

export default function VoiceLogScreen() {
  const router = useRouter();
  // Quick-log phase 4, 2026-08-30. Set only when this screen was opened to
  // finish a photo taken earlier (Home's own Log Again card). The photo goes
  // onto whatever gets logged, and the meal is dated to when the PHOTO was
  // taken rather than to now, since that is when the food was actually eaten.
  const { draftId, photoUri, capturedAt } = useLocalSearchParams<{
    draftId?: string;
    photoUri?: string;
    capturedAt?: string;
  }>();
  const scrollPadding = useFloatingButtonScrollPadding();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  const [phase, setPhase] = useState<Phase>('listening');
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [mealType, setMealType] = useState<QuickLogMealType>('snack');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [mealProposal, setMealProposal] = useState<MealProposal | null>(null);
  const [recognitionMode, setRecognitionMode] = useState<VoiceRecognitionMode | null>(null);
  // Today's meals that are still only planned. Offered as something this
  // spoken meal can stand in for, which is the whole "I went off the plan"
  // case: without it the planned meal stays unresolved forever and the day
  // reads as though two meals happened when only one did.
  const [replaceableMeals, setReplaceableMeals] = useState<ScheduleItemRecord[]>([]);
  const [replacingScheduleItemId, setReplacingScheduleItemId] = useState<string | null>(null);
  // Recorded as a plain note on the meal rather than a new column: it is
  // context for a person reading their own record back later, not something
  // any scoring or trend currently reads.
  const [ateOut, setAteOut] = useState(false);

  // Guards against the resolve pass running twice for one spoken phrase: the
  // recognizer can deliver a final result and then end the session, and both
  // used to be able to kick this off.
  const resolvingRef = useRef(false);

  useEffect(() => {
    getUserProfile()
      // Only read for the meal-type guess: the profile itself is not needed
      // as state here, since nothing else on this screen depends on it.
      .then((loaded) => setMealType(inferMealTypeForTime(loaded, nowLocalTime24())))
      .catch((error) => console.error('[VoiceLogScreen] Failed to load the profile', error));
    listScheduledMealsForDate(todayLocalDateString())
      .then((scheduled) => setReplaceableMeals(scheduled.filter((item) => item.status === 'planned')))
      .catch((error) => console.error('[VoiceLogScreen] Failed to load today\'s planned meals', error));
  }, []);

  const resolveTranscript = useCallback(async (spoken: string) => {
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    setPhase('resolving');
    setFinalTranscript(spoken);

    try {
      // Step one: does the whole phrase name something already logged or
      // favorited? Checked first because it is both the most likely case and
      // the most accurate one -- an existing meal carries its own real
      // ingredients and amounts, so nothing has to be inferred at all.
      const [recentMeals, favorites] = await Promise.all([
        listRecentDistinctMeals(40),
        listFavorites(40, 'meal'),
      ]);
      const mealCandidates: MealProposal[] = [
        ...recentMeals.map((meal: RecentMealSummary) => ({
          kind: 'recent' as const,
          id: meal.id,
          name: meal.name,
          score: scoreNameMatch(spoken, meal.name),
        })),
        ...favorites.map((favorite) => ({
          kind: 'favorite' as const,
          id: favorite.id,
          name: favorite.name,
          score: scoreNameMatch(spoken, favorite.name),
        })),
      ].sort((a, b) => b.score - a.score);
      const bestMeal = mealCandidates[0];
      setMealProposal(bestMeal && bestMeal.score >= CONFIDENT_MATCH_SCORE ? bestMeal : null);

      // Step two: parse the phrase into items and match each against the
      // reference database. Runs even when a meal matched, so the person can
      // pick whichever reading is actually right rather than being handed one.
      const parsed = splitSpokenItems(spoken).map(parseSpokenItem);
      const resolved = await Promise.all(
        parsed.map(async (item, index): Promise<ReviewItem> => {
          const base: ReviewItem = {
            key: `${index}-${item.foodText}`,
            spokenText: item.spokenText,
            candidates: [],
            candidateIndex: 0,
            foodId: null,
            foodName: null,
            category: null,
            amountText: String(item.quantity),
            unit: item.unit,
            grams: null,
            resolving: false,
          };
          if (!item.foodText) return base;

          // Walks progressively simpler queries and stops at the first that
          // finds anything, so one leading adjective the database does not use
          // ("green eggs") no longer sinks the whole item. Scoring still runs
          // against what was actually said, not the widened query, so a
          // fallback match still has to earn its place.
          let matches: Awaited<ReturnType<typeof searchReferenceFoodNamesAcrossCategories>> = [];
          for (const query of buildFoodSearchLadder(item.foodText)) {
            matches = await searchReferenceFoodNamesAcrossCategories(query, undefined, 8);
            if (matches.length > 0) break;
          }
          const scored = matches
            .map((match) => ({ match, score: scoreNameMatch(item.foodText, match.baseName) }))
            .sort((a, b) => b.score - a.score);
          if (scored.length === 0) return { ...base, candidates: [] };

          const top = scored[0];
          const option = await resolveFoodOptionForBaseName(top.match.category, top.match.baseName);
          if (!option) return { ...base, candidates: scored };
          const grams = await estimateGramsForFood(option.id, top.match.category, item.quantity, item.unit);
          return {
            ...base,
            candidates: scored,
            foodId: option.id,
            foodName: top.match.baseName,
            category: top.match.category,
            grams,
          };
        }),
      );
      setItems(resolved);
      setPhase('review');
    } catch (error) {
      console.error('[VoiceLogScreen] Failed to work out what was said', error);
      setItems([]);
      setMealProposal(null);
      setPhase('review');
    } finally {
      resolvingRef.current = false;
    }
  }, []);

  const { status, start, stop, recognitionMode: liveMode } = useVoiceDictation({
    onResult: (text, isFinal) => {
      setTranscript(text);
      if (isFinal) void resolveTranscript(text);
    },
    onError: (kind) => {
      if (kind === 'no-speech') {
        setPhase('review');
        return;
      }
      showInfoAlert(
        'Voice input had a problem',
        kind === 'permission'
          ? "Inside Story needs microphone and speech recognition access for this. You can turn it on in your device's own Settings, under this app's permissions."
          : 'Something went wrong listening for that. Give it another try.',
      );
      setPhase('review');
    },
  });

  useEffect(() => {
    if (liveMode) setRecognitionMode(liveMode);
  }, [liveMode]);

  // Starts listening the moment this screen opens. Tapping "Say what you ate"
  // was already the deliberate choice to use voice; making someone tap a
  // second time here is the wasted tap VoiceInputButton's own autoStart was
  // added to remove.
  useEffect(() => {
    void start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function restartListening() {
    setTranscript('');
    setFinalTranscript('');
    setItems([]);
    setMealProposal(null);
    setPhase('listening');
    void start();
  }

  async function updateItem(key: string, changes: Partial<ReviewItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...changes } : item)));
  }

  // Any change to a row's amount, unit or matched food means its weight has to
  // be worked out again. Kept in one place so a corrected row can never keep a
  // stale weight from before the correction.
  async function recomputeGrams(key: string, next: ReviewItem) {
    if (!next.foodId) {
      await updateItem(key, { grams: null });
      return;
    }
    const quantity = Number(next.amountText);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      await updateItem(key, { grams: null });
      return;
    }
    await updateItem(key, { resolving: true });
    const grams = await estimateGramsForFood(next.foodId, next.category, quantity, next.unit);
    await updateItem(key, { grams, resolving: false });
  }

  async function handleAmountChange(item: ReviewItem, text: string) {
    const next = { ...item, amountText: text };
    await updateItem(item.key, { amountText: text });
    await recomputeGrams(item.key, next);
  }

  async function handleUseGrams(item: ReviewItem) {
    const next = { ...item, unit: 'g' };
    await updateItem(item.key, { unit: 'g' });
    await recomputeGrams(item.key, next);
  }

  async function handleCycleCandidate(item: ReviewItem) {
    if (item.candidates.length < 2) return;
    const nextIndex = (item.candidateIndex + 1) % item.candidates.length;
    const candidate = item.candidates[nextIndex];
    await updateItem(item.key, { candidateIndex: nextIndex, resolving: true });
    const option = await resolveFoodOptionForBaseName(candidate.match.category, candidate.match.baseName);
    const next = {
      ...item,
      candidateIndex: nextIndex,
      foodId: option?.id ?? null,
      foodName: option ? candidate.match.baseName : null,
      category: candidate.match.category,
    };
    await updateItem(item.key, {
      foodId: next.foodId,
      foodName: next.foodName,
      category: next.category,
      resolving: false,
    });
    await recomputeGrams(item.key, next);
  }

  async function handleRemoveItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  const usableItems = items.filter((item) => item.foodId != null && item.grams != null && item.grams > 0);
  // A photo taken at 12:40 and finished at 3pm was still eaten at 12:40.
  const eatenAtForLog = capturedAt && capturedAt.length >= 16 ? capturedAt : nowLocalDateTimeString();

  // Only the draft ROW goes: the photo file now belongs to the meal, and
  // deleting it here would take the photo off the meal that just received it.
  // Non-fatal on purpose, the meal is already saved by this point.
  async function clearFinishedDraft() {
    if (!draftId) return;
    try {
      await deleteMealPhotoDraft(draftId);
    } catch (error) {
      console.error('[VoiceLogScreen] Logged the meal but could not clear the photo draft', error);
    }
  }
  const replacedMeal = replaceableMeals.find((item) => item.id === replacingScheduleItemId) ?? null;

  // Marking the planned slot as logged AGAINST the meal actually eaten is the
  // honest record of going off-plan: the slot did happen, and this is what it
  // turned out to be. Skipping it would say no meal happened at all, and
  // leaving it planned would have the day read as two meals when there was
  // one. Deliberately non-fatal: the meal itself is already saved by this
  // point, and losing the link is worth far less than losing the meal.
  async function resolveReplacedMeal(loggedMealId: string) {
    if (!replacingScheduleItemId) return;
    try {
      await markScheduledMealLogged(replacingScheduleItemId, loggedMealId);
    } catch (error) {
      console.error('[VoiceLogScreen] Logged the meal but could not resolve the planned one', error);
      showInfoAlert(
        'Logged, but the planned meal is still showing',
        'What you ate is saved. Marking the planned meal as covered by it did not work, so you may still see it on your schedule.',
      );
    }
  }

  async function handleLogItems() {
    if (usableItems.length === 0) return;
    setPhase('saving');
    try {
      const ingredients: MealIngredientInput[] = usableItems.map((item) => ({
        foodId: item.foodId!,
        foodName: item.foodName!,
        category: item.category ?? '',
        // Stored in grams rather than the spoken unit on purpose: the weight is
        // what was actually confirmed on screen, and re-deriving it later from
        // "1 cup" would land back on the same conversion that could not be done
        // in the first place.
        quantity: Math.round(item.grams!),
        unit: 'g',
        dishServings: 1,
        yourSharePercent: 100,
      }));
      const name = finalTranscript.trim().slice(0, 60) || 'Spoken meal';
      const meal = await createMeal({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        mealType,
        eatenAt: eatenAtForLog,
        notes: ateOut ? 'Eaten out.' : undefined,
        isImmediate: true,
        ingredients,
        photoUri: photoUri ?? null,
      });
      await resolveReplacedMeal(meal.id);
      await clearFinishedDraft();
      router.back();
    } catch (error) {
      console.error('[VoiceLogScreen] Failed to log a spoken meal', error);
      setPhase('review');
      showInfoAlert('That did not log', 'Something went wrong saving it. Check Past Meals before trying again.');
    }
  }

  async function handleLogProposedMeal() {
    if (!mealProposal) return;
    setPhase('saving');
    try {
      if (mealProposal.kind === 'recent') {
        const result = await relogMeal(mealProposal.id, eatenAtForLog, {
          notes: ateOut ? 'Eaten out.' : undefined,
          photoUri: photoUri ?? null,
        });
        if ('error' in result) {
          setPhase('review');
          showInfoAlert('That did not log', result.error);
          return;
        }
        await resolveReplacedMeal(result.id);
      } else {
        const favorite = await getMealFavorite(mealProposal.id);
        if (!favorite) {
          setPhase('review');
          showInfoAlert('That did not log', 'That favorite could not be opened. It may have been deleted.');
          return;
        }
        const result = await createMealFromComponents({
          name: favorite.name,
          mealType: favorite.mealType || mealType,
          eatenAt: eatenAtForLog,
          notes: ateOut ? 'Eaten out.' : favorite.notes,
          isImmediate: true,
          components: favorite.components,
        });
        if ('error' in result) {
          setPhase('review');
          showInfoAlert('That did not log', result.error);
          return;
        }
        await resolveReplacedMeal(result.id);
      }
      await clearFinishedDraft();
      router.back();
    } catch (error) {
      console.error('[VoiceLogScreen] Failed to log a matched meal', error);
      setPhase('review');
      showInfoAlert('That did not log', 'Something went wrong saving it. Check Past Meals before trying again.');
    }
  }

  function renderListening() {
    return (
      <View style={styles.centerBody}>
        <Ionicons name="mic" size={44} color={colors.accent} />
        <Text style={styles.title}>{status === 'listening' ? 'Listening…' : 'Getting ready…'}</Text>
        <Text style={styles.text}>
          Best for a meal out, or anything you ate instead of what you had planned. Say it the way you would tell
          someone: &quot;two eggs and a slice of toast&quot;, or the name of a meal you have logged before.
        </Text>
        {transcript ? <Text style={styles.liveTranscript}>{transcript}</Text> : null}
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderResolving() {
    return (
      <View style={styles.centerBody}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.title}>Working out what that was…</Text>
        <Text style={styles.text}>{finalTranscript || transcript}</Text>
      </View>
    );
  }

  function renderItemRow(item: ReviewItem) {
    const candidate = item.candidates[item.candidateIndex];
    const hasMatch = item.foodId != null;
    const needsWeight = hasMatch && item.grams == null;
    return (
      <View key={item.key} style={styles.itemCard}>
        <View style={styles.itemHeaderRow}>
          <Text style={styles.itemSpoken} numberOfLines={2}>
            {item.spokenText}
          </Text>
          <TouchableOpacity onPress={() => handleRemoveItem(item.key)} activeOpacity={0.7} style={styles.removeButton}>
            <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {hasMatch ? (
          <TouchableOpacity
            style={styles.matchRow}
            activeOpacity={item.candidates.length > 1 ? 0.7 : 1}
            onPress={() => handleCycleCandidate(item)}
            disabled={item.candidates.length < 2}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.accent} />
            <Text style={styles.matchName} numberOfLines={2}>
              {item.foodName}
            </Text>
            {item.candidates.length > 1 ? (
              <Text style={styles.matchSwapHint}>
                {`Not it? Tap (${item.candidateIndex + 1}/${item.candidates.length})`}
              </Text>
            ) : null}
          </TouchableOpacity>
        ) : (
          <Text style={styles.itemProblem}>
            {item.candidates.length === 0
              ? 'No food in the database matched this, so it will not be logged.'
              : 'This could not be matched to a food, so it will not be logged.'}
          </Text>
        )}

        {candidate && candidate.score < CONFIDENT_MATCH_SCORE && hasMatch ? (
          <Text style={styles.itemHint}>This is a loose match. Check it before logging.</Text>
        ) : null}

        <View style={styles.amountRow}>
          <AppTextInput
            value={item.amountText}
            onChangeText={(text) => handleAmountChange(item, text)}
            style={styles.amountInput}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.amountUnit}>{item.unit}</Text>
          {item.resolving ? (
            <ActivityIndicator color={colors.accent} />
          ) : item.grams != null ? (
            <Text style={styles.amountGrams}>{`about ${Math.round(item.grams)} g`}</Text>
          ) : null}
        </View>

        {needsWeight ? (
          <View style={styles.needsWeightBlock}>
            <Text style={styles.itemProblem}>
              {item.unit === 'each'
                ? 'There is no per-item weight stored for this food, so the app cannot tell how much this is.'
                : `A ${item.unit} of this cannot be turned into a weight, since only drinks, alcohol and fats have a density the app can rely on.`}
            </Text>
            <TouchableOpacity style={styles.inlineButton} activeOpacity={0.8} onPress={() => handleUseGrams(item)}>
              <Text style={styles.inlineButtonText}>Enter it in grams instead</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  function renderReview() {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        {photoUri ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Finishing this photo</Text>
            <Image source={{ uri: photoUri }} style={styles.draftPhoto} />
            <Text style={styles.privacyNote}>
              Nothing is read from the picture. It is kept with whatever you log, and the meal is dated to when the
              photo was taken.
            </Text>
          </View>
        ) : null}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>You said</Text>
          <Text style={styles.text}>{finalTranscript || 'Nothing was picked up.'}</Text>
          {recognitionMode ? (
            <Text style={styles.privacyNote}>
              {recognitionMode === 'on-device'
                ? 'Recognized on this phone. The audio did not leave the device.'
                : "Recognized by your phone's own speech service, which processes the audio off the device. Nothing else about your health was sent with it."}
            </Text>
          ) : null}
        </View>

        {mealProposal ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>That sounds like something you have had before</Text>
            <Text style={styles.text}>{mealProposal.name}</Text>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleLogProposedMeal}>
              <Ionicons name="repeat-outline" size={18} color={colors.background} />
              <Text style={styles.primaryButtonText}>{`Log ${mealProposal.name} again`}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {items.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>
              {mealProposal ? 'Or log it as separate foods' : 'What the app worked out'}
            </Text>
            {items.map(renderItemRow)}
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.text}>Nothing usable was picked out of that. Try saying it again, a little slower.</Text>
          </View>
        )}

        {replaceableMeals.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Was this instead of something you had planned?</Text>
            <Text style={styles.privacyNote}>
              Picking one marks it as covered by what you actually ate, so it stops sitting on your schedule waiting.
            </Text>
            {replaceableMeals.map((planned) => {
              const active = replacingScheduleItemId === planned.id;
              return (
                <TouchableOpacity
                  key={planned.id}
                  style={styles.replaceRow}
                  activeOpacity={0.8}
                  onPress={() => setReplacingScheduleItemId(active ? null : planned.id)}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={active ? colors.accent : colors.textMuted}
                  />
                  <Text style={styles.replaceRowText} numberOfLines={2}>
                    {`${planned.title}${planned.scheduledFor.length >= 16 ? ` · ${planned.scheduledFor.slice(11, 16)}` : ''}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <TouchableOpacity style={styles.ateOutRow} activeOpacity={0.7} onPress={() => setAteOut((current) => !current)}>
          <Ionicons name={ateOut ? 'checkbox' : 'square-outline'} size={20} color={colors.accent} />
          <Text style={styles.ateOutText}>I ate this out, not at home</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Which meal?</Text>
        <View style={styles.mealTypeRow}>
          {QUICK_LOG_MEAL_TYPES.map((candidate) => {
            const active = mealType === candidate;
            return (
              <TouchableOpacity
                key={candidate}
                style={[styles.mealTypePill, active ? styles.mealTypePillActive : null]}
                activeOpacity={0.8}
                onPress={() => setMealType(candidate)}
              >
                <Text style={[styles.mealTypePillText, active ? styles.mealTypePillTextActive : null]}>
                  {quickLogMealTypeLabel(candidate)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {items.length > 0 && usableItems.length === 0 ? (
          <Text style={styles.itemProblem}>
            Nothing here has an amount the app can work with yet, so there is nothing to log.
          </Text>
        ) : null}

        {replacedMeal ? (
          <Text style={styles.privacyNote}>
            {`Logging this also marks "${replacedMeal.title}" as covered, so it stops waiting on your schedule.`}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[styles.primaryButton, usableItems.length === 0 ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleLogItems}
          disabled={usableItems.length === 0 || phase === 'saving'}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.background} />
          <Text style={styles.primaryButtonText}>
            {phase === 'saving'
              ? 'Logging…'
              : `Log ${usableItems.length} ${usableItems.length === 1 ? 'item' : 'items'}`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={restartListening}>
          <Ionicons name="mic-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>Say It Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Say What You Ate' }} />
      {infoAlertElement}
      {phase === 'listening' ? renderListening() : phase === 'resolving' ? renderResolving() : renderReview()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12 },
  centerBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center', ...textShadow },
  text: { ...typography.body, color: colors.textSecondary, ...textShadow },
  liveTranscript: { ...typography.body, color: colors.textPrimary, textAlign: 'center', ...textShadow },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, marginTop: 4, ...textShadow },
  privacyNote: { ...typography.caption, color: colors.textMuted, ...textShadow },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  itemCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  itemHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemSpoken: { ...typography.bodyEmphasis, color: colors.textPrimary, flex: 1, ...textShadow },
  removeButton: { padding: 2 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  matchName: { ...typography.body, color: colors.textPrimary, flexShrink: 1, ...textShadow },
  matchSwapHint: { ...typography.caption, color: colors.accent, ...textShadow },
  itemProblem: { ...typography.caption, color: colors.danger, ...textShadow },
  itemHint: { ...typography.caption, color: colors.textMuted, ...textShadow },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountInput: {
    width: 90,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    ...textShadow,
  },
  amountUnit: { ...typography.body, color: colors.textSecondary, ...textShadow },
  amountGrams: { ...typography.caption, color: colors.textMuted, ...textShadow },
  needsWeightBlock: { gap: 6 },
  inlineButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  inlineButtonText: { ...typography.caption, color: colors.accent, ...textShadow },
  draftPhoto: { width: '100%', height: 180, borderRadius: 10, backgroundColor: colors.border },
  replaceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  replaceRowText: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },
  ateOutRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  ateOutText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  mealTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealTypePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mealTypePillActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  mealTypePillText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  // Dark text on the light accent fill: cancel the shadow it would otherwise
  // inherit. See constants/typography.ts.
  mealTypePillTextActive: { color: colors.background, textShadowColor: 'transparent', textShadowRadius: 0 },
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
