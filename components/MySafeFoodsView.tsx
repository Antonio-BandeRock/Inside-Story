import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  getMyFoodBackground,
  getReferenceCategories,
  listBrowsableFoodNames,
  listFoodTrials,
  listMySafeFoods,
  listScheduledFoodNames,
  mySafeFoodKey,
  removeMySafeFood,
  searchReferenceFoodNamesAcrossCategories,
  setMySafeFood,
  type BrowsableFood,
  type GlobalFoodMatch,
  type MyFoodBackground,
  type MySafeFoodRecord,
  type MySafeFoodVerdict,
  type ScheduledFoodName,
} from '../lib/db';
import { getTrackedConditionsWithNames, type TrackedConditionRef } from '../lib/foodPersonalization';
import { AppTextInput } from './AppTextInput';
import { FoodMarkButtons, foodAppLine, foodTrialLine } from './FoodSafetyMarks';
import { categoryLabel } from './FoodLookup';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';
import { PopoverSelect } from './PopoverSelect';

// My Safe Foods: the person's list, kept by the person.
//
// 2026-09-18, direct instruction: "the user should be responsible for the
// final say in what foods are safe for them. That is more of where my mind
// was going with this, and it being available on the Food screen listed
// under My Food Products."
//
// Everything this app called "safe" before today was worked out from the
// scores: food_scores read against whichever conditions somebody tracks,
// with nobody able to disagree with the answer. That is the wrong shape for
// a question only the person can answer. Somebody knows that tomatoes are
// fine for them and that oats are not, whatever the table says, and until
// now there was nowhere to put it.
//
// lib/db.ts applies the list underneath listSafeFoods and
// listSafeFoodCategories, so the call made here changes what the Safe Foods
// lens shows rather than sitting in a second list that disagrees with the
// first one, and lib/dailyMealPlan.ts reads it too, so a generated six-week
// plan answers to it.
//
// Same day, second instruction, which is what this screen looks like now:
// "there is the list of foods with a plus sign to the right of it. If I hit
// the plus sign it should be placed into the safe food list. If the thing
// added to the safe food list is not safe for me, or is unknown whether it
// is safe for me, I should be able to select a question mark, and if I know
// a food is not safe for me, I should be able to select another symbol that
// means to move it off of the safe food list. Each of the foods, if any of
// them have been used in trials, and have been determined to be safe because
// of that, it should be stated. If the food is normally safe for their
// condition, it should be stated. The list of foods for them to say whether
// or not a food is safe should be complete for the user to be able to go
// through the list of foods, as well as when foods are listed in their
// schedule."
//
// Five things, and each one changed something here:
//   1. Three marks on every row, not a form to open. Plus for safe, question
//      mark for not worked out yet, minus for not for me. Tapping the mark
//      that is already lit clears it and hands the food back to the app.
//   2. Every row says what a food trial found, when one did.
//   3. Every row says what this app's own scoring makes of the food against
//      the conditions the person tracks.
//   4. Every Food: a category picker over the whole reference database,
//      browsed rather than searched, so going through the list is possible
//      rather than needing to think of each name first.
//   5. In Your Schedule: the foods in whatever meals are planned over the
//      next six weeks, which for a generated plan is every food it will put
//      in front of them.

type Draft = {
  foodName: string;
  category: string | null;
  verdict: MySafeFoodVerdict;
  note: string;
  isExisting: boolean;
};

// Measured against the live reference database: Veg alone carries 2,675
// distinct visible names, Meat 1,471 and Mixed 875, so a category arrives a
// screenful at a time rather than all at once.
const BROWSE_PAGE = 40;

export function MySafeFoodsView({ onClose, onChanged }: { onClose: () => void; onChanged?: () => void }) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();

  const [entries, setEntries] = useState<MySafeFoodRecord[] | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<GlobalFoodMatch[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);

  const [conditions, setConditions] = useState<TrackedConditionRef[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [browseCategory, setBrowseCategory] = useState<string | null>(null);
  const [browseFoods, setBrowseFoods] = useState<BrowsableFood[]>([]);
  const [browseShown, setBrowseShown] = useState(BROWSE_PAGE);
  const [scheduled, setScheduled] = useState<ScheduledFoodName[] | null>(null);
  const [backgrounds, setBackgrounds] = useState<Map<string, MyFoodBackground>>(new Map());

  const refresh = useCallback(async () => {
    const [rows, trials] = await Promise.all([listMySafeFoods(), listFoodTrials()]);
    setEntries(rows);
    // A cleared trial the person has not ruled on yet. Deduped by the same
    // key the table uses, so a food tested twice is offered once.
    const known = new Set(rows.map((row) => row.foodKey));
    const offered = new Map<string, string>();
    for (const trial of trials) {
      if (trial.status !== 'cleared') continue;
      const key = mySafeFoodKey(trial.foodName);
      if (known.has(key) || offered.has(key)) continue;
      offered.set(key, trial.foodName);
    }
    setSuggestions(Array.from(offered.values()));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([getTrackedConditionsWithNames(), getReferenceCategories()]).then(([tracked, cats]) => {
      if (!isCurrent) return;
      setConditions(tracked);
      setCategories(cats);
    });
    // Six weeks of planned meals means resolving every one of them into its
    // own ingredients, so this is left to arrive on its own rather than made
    // to hold up the rest of the screen.
    listScheduledFoodNames(42).then((planned) => {
      if (isCurrent) setScheduled(planned);
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    if (browseCategory === null) {
      setBrowseFoods([]);
      return;
    }
    listBrowsableFoodNames(browseCategory).then((found) => {
      if (isCurrent) setBrowseFoods(found);
    });
    return () => {
      isCurrent = false;
    };
  }, [browseCategory]);

  // The search runs against the reference database rather than accepting
  // free text, so every row on the list matches a food the rest of the app
  // can recognize. A name typed into nothing would look like it had been
  // saved and then never show up anywhere else.
  useEffect(() => {
    let isCurrent = true;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setMatches([]);
      return;
    }
    searchReferenceFoodNamesAcrossCategories(trimmed, undefined, 12).then((found) => {
      if (isCurrent) setMatches(found);
    });
    return () => {
      isCurrent = false;
    };
  }, [query]);

  const shownBrowseFoods = useMemo(() => browseFoods.slice(0, browseShown), [browseFoods, browseShown]);

  // Whatever is on screen right now, so a row can say what the app and the
  // person's own trials already make of the food. Fetched for the names
  // nothing has been fetched for yet, which keeps paging through a long
  // category to one query per page rather than one per page per row.
  const visibleNames = useMemo(() => {
    const names = new Set<string>();
    for (const entry of entries ?? []) names.add(entry.foodName);
    for (const match of matches) names.add(match.baseName);
    for (const name of suggestions) names.add(name);
    for (const food of shownBrowseFoods) names.add(food.baseName);
    for (const item of scheduled ?? []) names.add(item.foodName);
    return Array.from(names);
  }, [entries, matches, suggestions, shownBrowseFoods, scheduled]);

  useEffect(() => {
    // Conditions decide the answer, so nothing is looked up before they
    // arrive. Otherwise the first screenful would be answered against no
    // conditions and then cached that way.
    if (conditions === null) return;
    let isCurrent = true;
    const missing = visibleNames.filter((name) => !backgrounds.has(mySafeFoodKey(name)));
    if (missing.length === 0) return;
    const codes = conditions.map((condition) => condition.code);
    getMyFoodBackground(missing, codes).then((found) => {
      if (!isCurrent) return;
      setBackgrounds((prev) => {
        const next = new Map(prev);
        for (const [key, value] of found) next.set(key, value);
        // A name with no reference row at all still gets an answer recorded,
        // so it is not looked up again on every render.
        for (const name of missing) {
          const key = mySafeFoodKey(name);
          if (!next.has(key)) next.set(key, { appView: 'unscored', trialOutcome: null, trialResolvedOn: null });
        }
        return next;
      });
    });
    return () => {
      isCurrent = false;
    };
  }, [visibleNames, backgrounds, conditions]);

  const callsByKey = useMemo(() => {
    const map = new Map<string, MySafeFoodRecord>();
    for (const entry of entries ?? []) map.set(entry.foodKey, entry);
    return map;
  }, [entries]);

  // One tap on a mark. Tapping the mark that is already lit clears the call,
  // which is the one way back to letting the app work the food out. Any note
  // already written survives a change of mind about the food itself.
  const markFood = useCallback(
    async (foodName: string, category: string | null, verdict: MySafeFoodVerdict) => {
      const key = mySafeFoodKey(foodName);
      const current = callsByKey.get(key);
      if (current && current.verdict === verdict) {
        await removeMySafeFood(key);
        if (draft && mySafeFoodKey(draft.foodName) === key) setDraft(null);
      } else {
        await setMySafeFood({
          foodName,
          verdict,
          category: category ?? current?.category ?? null,
          note: current?.note ?? '',
        });
      }
      await refresh();
      onChanged?.();
    },
    [callsByKey, draft, refresh, onChanged],
  );

  async function save(next: Draft) {
    await setMySafeFood({
      foodName: next.foodName,
      verdict: next.verdict,
      category: next.category,
      note: next.note,
    });
    setDraft(null);
    setQuery('');
    setMatches([]);
    await refresh();
    onChanged?.();
  }

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ label: categoryLabel(category), value: category })),
    [categories],
  );

  const conditionCount = conditions?.length ?? 0;
  const safeEntries = (entries ?? []).filter((entry) => entry.verdict === 'safe');
  const unsureEntries = (entries ?? []).filter((entry) => entry.verdict === 'unsure');
  const avoidEntries = (entries ?? []).filter((entry) => entry.verdict === 'avoid');

  function renderFoodRow(foodName: string, category: string | null, extraMeta?: string) {
    const key = mySafeFoodKey(foodName);
    return (
      <FoodRow
        key={`${category ?? ''}|${key}`}
        foodName={foodName}
        category={category}
        extraMeta={extraMeta}
        verdict={callsByKey.get(key)?.verdict ?? null}
        note={callsByKey.get(key)?.note ?? null}
        background={backgrounds.get(key)}
        conditionCount={conditionCount}
        onMark={markFood}
        onOpenNote={setDraft}
      />
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.backLink}>‹ Back</Text>
        </TouchableOpacity>

        <HomeSectionBand
          kind="static"
          title="Add a Food"
          icon="add-circle-outline"
          color={colors.tabFood}
          contentStyle={styles.bandBody}
        >
          <Text style={styles.intro}>
            Your call comes first. Anything you mark here beats what the app works out from your tracked
            conditions, wherever safe foods are listed, and the meal plan follows it too.
          </Text>
          <Text style={styles.intro}>
            Plus means safe for you. The question mark means you have not worked it out yet. The minus means
            not for you. Tapping a mark that is already lit clears it and hands the food back to the app. Tap
            a food name to add a line about why.
          </Text>

          {draft ? (
            <View style={styles.draftCard}>
              <Text style={styles.draftName}>{draft.foodName}</Text>
              {draft.category ? <Text style={styles.draftMeta}>{categoryLabel(draft.category)}</Text> : null}

              <View style={styles.verdictRow}>
                <TouchableOpacity
                  style={[styles.verdictPill, draft.verdict === 'safe' && styles.verdictPillSafeOn]}
                  onPress={() => setDraft({ ...draft, verdict: 'safe' })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.verdictPillText, draft.verdict === 'safe' && styles.verdictPillTextOn]}>
                    Safe for me
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.verdictPill, draft.verdict === 'unsure' && styles.verdictPillUnsureOn]}
                  onPress={() => setDraft({ ...draft, verdict: 'unsure' })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.verdictPillText, draft.verdict === 'unsure' && styles.verdictPillTextOn]}>
                    Not sure
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.verdictPill, draft.verdict === 'avoid' && styles.verdictPillAvoidOn]}
                  onPress={() => setDraft({ ...draft, verdict: 'avoid' })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.verdictPillText, draft.verdict === 'avoid' && styles.verdictPillTextOn]}>
                    Not for me
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Why, if you want to remember it</Text>
              <AppTextInput
                style={styles.input}
                value={draft.note}
                onChangeText={(text) => setDraft({ ...draft, note: text })}
                placeholder="Fine cooked, not raw"
                placeholderTextColor={colors.textMuted}
                maxLength={140}
              />

              <View style={styles.draftActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setDraft(null)} activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={() => save(draft)} activeOpacity={0.7}>
                  <Text style={styles.primaryButtonText}>{draft.isExisting ? 'Save' : 'Add to my list'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <AppTextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Search for a food"
                placeholderTextColor={colors.textMuted}
              />
              {matches.map((match) => renderFoodRow(match.baseName, match.category))}
              {query.trim().length >= 2 && matches.length === 0 ? (
                <Text style={styles.emptyText}>Nothing by that name in the food database.</Text>
              ) : null}

              {suggestions.length > 0 ? (
                <View style={styles.suggestionWrap}>
                  <Text style={styles.label}>Foods you cleared in a trial</Text>
                  {suggestions.map((name) => renderFoodRow(name, null))}
                </View>
              ) : null}
            </>
          )}
        </HomeSectionBand>

        <HomeSectionBand
          kind="static"
          title="Every Food"
          icon="list-outline"
          color={colors.tabFood}
          contentStyle={styles.bandBody}
        >
          <Text style={styles.intro}>
            The whole food database, a category at a time, so you can work through it rather than having to
            think of each name first.
          </Text>
          <View style={styles.pickerRow}>
            <Text style={styles.label}>Category</Text>
            <PopoverSelect
              options={categoryOptions}
              selected={browseCategory}
              onSelect={(value) => {
                setBrowseCategory(value);
                setBrowseShown(BROWSE_PAGE);
              }}
              tabColor={colors.tabFood}
              placeholder="Pick one"
              searchable
              searchPlaceholder="Type a category"
            />
          </View>
          {browseCategory === null ? null : browseFoods.length === 0 ? (
            <Text style={styles.emptyText}>Nothing listed under that category.</Text>
          ) : (
            <>
              {shownBrowseFoods.map((food) => renderFoodRow(food.baseName, food.category))}
              <Text style={styles.label}>
                Showing {shownBrowseFoods.length} of {browseFoods.length}
              </Text>
              {browseShown < browseFoods.length ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.7}
                  onPress={() => setBrowseShown((shown) => shown + BROWSE_PAGE)}
                >
                  <Text style={styles.secondaryButtonText}>Show more</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </HomeSectionBand>

        <HomeSectionBand
          kind="static"
          title="In Your Schedule"
          icon="calendar-outline"
          color={colors.tabFood}
          contentStyle={styles.bandBody}
        >
          <Text style={styles.intro}>
            Every food in the meals you have planned over the next six weeks.
          </Text>
          {scheduled === null ? null : scheduled.length === 0 ? (
            <Text style={styles.emptyText}>Nothing is planned yet, so there is nothing to rule on here.</Text>
          ) : (
            scheduled.map((item) => renderFoodRow(item.foodName, item.category, item.meals.slice(0, 2).join(', ')))
          )}
        </HomeSectionBand>

        <HomeSectionBand
          kind="static"
          title="Safe for Me"
          icon="shield-checkmark-outline"
          color={colors.tabFood}
          contentStyle={styles.bandBody}
        >
          {entries === null ? null : safeEntries.length === 0 ? (
            <Text style={styles.emptyText}>Nothing here yet. Mark a food above and it lands on this list.</Text>
          ) : (
            safeEntries.map((entry) => renderFoodRow(entry.foodName, entry.category))
          )}
        </HomeSectionBand>

        {unsureEntries.length > 0 ? (
          <HomeSectionBand
            kind="static"
            title="Not Sure Yet"
            icon="help-circle-outline"
            color={colors.tabFood}
            contentStyle={styles.bandBody}
          >
            <Text style={styles.intro}>
              Off your safe list until you say otherwise, and not called a problem either. A food trial is how
              you settle one.
            </Text>
            {unsureEntries.map((entry) => renderFoodRow(entry.foodName, entry.category))}
          </HomeSectionBand>
        ) : null}

        {avoidEntries.length > 0 ? (
          <HomeSectionBand
            kind="static"
            title="Not for Me"
            icon="close-circle-outline"
            color={colors.tabFood}
            contentStyle={styles.bandBody}
          >
            {avoidEntries.map((entry) => renderFoodRow(entry.foodName, entry.category))}
          </HomeSectionBand>
        ) : null}
      </ScrollView>
    </View>
  );
}

// One food, wherever it is listed. The name opens the note form, since
// changing a note is the ordinary case and setMySafeFood is an upsert; the
// three marks to the right are the whole answer on their own.
function FoodRow({
  foodName,
  category,
  extraMeta,
  verdict,
  note,
  background,
  conditionCount,
  onMark,
  onOpenNote,
}: {
  foodName: string;
  category: string | null;
  extraMeta?: string;
  verdict: MySafeFoodVerdict | null;
  note: string | null;
  background: MyFoodBackground | undefined;
  conditionCount: number;
  onMark: (foodName: string, category: string | null, verdict: MySafeFoodVerdict) => void;
  onOpenNote: (draft: Draft) => void;
}) {
  const trial = background ? foodTrialLine(background) : null;
  return (
    <View style={styles.itemRow}>
      <TouchableOpacity
        style={styles.itemTapArea}
        activeOpacity={0.7}
        onPress={() =>
          onOpenNote({
            foodName,
            category,
            verdict: verdict ?? 'safe',
            note: note ?? '',
            isExisting: verdict !== null,
          })
        }
      >
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {foodName}
          </Text>
          {note ? (
            <Text style={styles.rowMeta} numberOfLines={2}>
              {note}
            </Text>
          ) : null}
          {extraMeta ? (
            <Text style={styles.rowMeta} numberOfLines={1}>
              {extraMeta}
            </Text>
          ) : category ? (
            <Text style={styles.rowMeta} numberOfLines={1}>
              {categoryLabel(category)}
            </Text>
          ) : null}
          {trial ? (
            <Text
              style={[
                styles.rowMeta,
                background?.trialOutcome === 'cleared' ? styles.rowTrialCleared : styles.rowTrialFlagged,
              ]}
              numberOfLines={2}
            >
              {trial}
            </Text>
          ) : null}
          {background ? (
            <Text style={styles.rowMeta} numberOfLines={2}>
              {foodAppLine(background, conditionCount)}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
      <FoodMarkButtons foodName={foodName} category={category} verdict={verdict} onMark={onMark} />
    </View>
  );
}

const styles = StyleSheet.create({
  // No fill: the Food background shows through, as it does behind every
  // other lens on this tab.
  wrapper: { flex: 1 },
  container: { paddingHorizontal: 0, paddingTop: 5, gap: HOME_BAND_GAP },
  backLink: {
    ...typography.body,
    color: colors.textOnPrimary,
    fontWeight: '400',
    alignSelf: 'flex-start',
    marginLeft: HOME_BAND_CONTENT_PADDING,
    backgroundColor: colors.tabFood,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  bandBody: { gap: HOME_BAND_GAP },
  intro: {
    ...typography.caption,
    color: colors.textSecondary,
    ...textShadow,
  },
  emptyText: {
    ...typography.body,
    color: colors.textPrimary,
    ...textShadow,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    ...textShadow,
  },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
  },
  suggestionWrap: { gap: HOME_BAND_GAP },
  draftCard: {
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    gap: HOME_BAND_GAP,
  },
  draftName: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    ...textShadow,
  },
  draftMeta: {
    ...typography.caption,
    color: colors.textMuted,
    ...textShadow,
  },
  verdictRow: { flexDirection: 'row', gap: 8 },
  verdictPill: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  verdictPillSafeOn: { backgroundColor: colors.tabFood, borderColor: colors.tabFood },
  verdictPillUnsureOn: { backgroundColor: colors.statusYellowBg, borderColor: colors.statusYellowOnSurface },
  verdictPillAvoidOn: { backgroundColor: colors.statusRedBg, borderColor: colors.statusRedOnSurface },
  verdictPillText: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  verdictPillTextOn: { color: colors.textOnPrimary },
  draftActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  primaryButton: {
    backgroundColor: colors.tabFood,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.textOnPrimary,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    paddingLeft: 12,
  },
  itemTapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowTextWrap: { flex: 1, marginRight: 12 },
  rowTitle: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    ...textShadow,
  },
  rowMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    ...textShadow,
  },
  // A trial's own finding carries its verdict in the colour, since it is the
  // strongest thing on the row: the person's body answered this one.
  rowTrialCleared: { color: colors.statusGreenOnSurface },
  rowTrialFlagged: { color: colors.statusRedOnSurface },
});
