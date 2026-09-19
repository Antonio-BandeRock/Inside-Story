import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  listFoodTrials,
  listMySafeFoods,
  mySafeFoodKey,
  removeMySafeFood,
  searchReferenceFoodNamesAcrossCategories,
  setMySafeFood,
  type GlobalFoodMatch,
  type MySafeFoodRecord,
  type MySafeFoodVerdict,
} from '../lib/db';
import { AppTextInput } from './AppTextInput';
import { useConfirmSheet } from './ConfirmSheet';
import { categoryLabel } from './FoodLookup';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';

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
// So this screen is short on purpose. Find a food, say safe or not safe,
// optionally say why, and it is on the list. lib/db.ts applies the list
// underneath listSafeFoods and listSafeFoodCategories, so the call made
// here changes what the Safe Foods lens shows rather than sitting in a
// second list that disagrees with the first one.
//
// Foods already cleared in a food trial are offered as suggestions rather
// than added automatically. Clearing a trial is somebody saying a food sat
// fine over three days, which is good evidence and not the same as putting
// it on a list they keep. One tap accepts it.

type Draft = {
  foodName: string;
  category: string | null;
  verdict: MySafeFoodVerdict;
  note: string;
  isExisting: boolean;
};

export function MySafeFoodsView({ onClose, onChanged }: { onClose: () => void; onChanged?: () => void }) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  const [entries, setEntries] = useState<MySafeFoodRecord[] | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<GlobalFoodMatch[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);

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

  async function handleRemove(entry: MySafeFoodRecord) {
    const ok = await confirmSheet({
      title: `Take "${entry.foodName}" off your list?`,
      message: 'The app goes back to working this food out from your tracked conditions.',
      confirmLabel: 'Take it off',
      destructive: true,
    });
    if (!ok) return;
    await removeMySafeFood(entry.foodKey);
    if (draft && mySafeFoodKey(draft.foodName) === entry.foodKey) setDraft(null);
    await refresh();
    onChanged?.();
  }

  const safeEntries = (entries ?? []).filter((entry) => entry.verdict === 'safe');
  const avoidEntries = (entries ?? []).filter((entry) => entry.verdict === 'avoid');

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
            Your call comes first. Anything you put here beats what the app works out from your tracked
            conditions, wherever safe foods are listed.
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
              {matches.map((match) => (
                <TouchableOpacity
                  key={`${match.category}|${match.subcategory ?? ''}|${match.baseName}`}
                  style={styles.matchRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    setDraft({
                      foodName: match.baseName,
                      category: match.category,
                      verdict: 'safe',
                      note: '',
                      isExisting: false,
                    })
                  }
                >
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {match.baseName}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {categoryLabel(match.category)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
              {query.trim().length >= 2 && matches.length === 0 ? (
                <Text style={styles.emptyText}>Nothing by that name in the food database.</Text>
              ) : null}

              {suggestions.length > 0 ? (
                <View style={styles.suggestionWrap}>
                  <Text style={styles.label}>Foods you cleared in a trial</Text>
                  {suggestions.map((name) => (
                    <TouchableOpacity
                      key={name}
                      style={styles.matchRow}
                      activeOpacity={0.7}
                      onPress={() =>
                        setDraft({ foodName: name, category: null, verdict: 'safe', note: '', isExisting: false })
                      }
                    >
                      <View style={styles.rowTextWrap}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {name}
                        </Text>
                        <Text style={styles.rowMeta} numberOfLines={1}>
                          Sat fine through its trial
                        </Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={20} color={colors.tabFood} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </>
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
            <Text style={styles.emptyText}>Nothing here yet. Add a food above and it lands on this list.</Text>
          ) : (
            safeEntries.map((entry) => (
              <EntryRow key={entry.foodKey} entry={entry} onEdit={setDraft} onRemove={handleRemove} />
            ))
          )}
        </HomeSectionBand>

        {avoidEntries.length > 0 ? (
          <HomeSectionBand
            kind="static"
            title="Not for Me"
            icon="close-circle-outline"
            color={colors.tabFood}
            contentStyle={styles.bandBody}
          >
            {avoidEntries.map((entry) => (
              <EntryRow key={entry.foodKey} entry={entry} onEdit={setDraft} onRemove={handleRemove} />
            ))}
          </HomeSectionBand>
        ) : null}
      </ScrollView>
      {confirmSheetElement}
    </View>
  );
}

// A row on either list. Tapping it loads it back into the same form the
// food was added with, since setMySafeFood is an upsert: changing your mind
// is the ordinary case here, not a mistake to be undone and redone.
function EntryRow({
  entry,
  onEdit,
  onRemove,
}: {
  entry: MySafeFoodRecord;
  onEdit: (draft: Draft) => void;
  onRemove: (entry: MySafeFoodRecord) => void;
}) {
  return (
    <View style={styles.itemRow}>
      <TouchableOpacity
        style={styles.itemTapArea}
        activeOpacity={0.7}
        onPress={() =>
          onEdit({
            foodName: entry.foodName,
            category: entry.category,
            verdict: entry.verdict,
            note: entry.note ?? '',
            isExisting: true,
          })
        }
      >
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {entry.foodName}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={2}>
            {entry.note || (entry.category ? categoryLabel(entry.category) : 'Your call')}
          </Text>
        </View>
        <Ionicons
          name={entry.verdict === 'safe' ? 'shield-checkmark-outline' : 'close-circle-outline'}
          size={19}
          color={entry.verdict === 'safe' ? colors.statusGreenOnSurface : colors.statusRedOnSurface}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.itemActionButton}
        onPress={() => onRemove(entry)}
        accessibilityLabel={`Take ${entry.foodName} off your list`}
        hitSlop={8}
      >
        <Ionicons name="trash-outline" size={19} color={colors.danger} />
      </TouchableOpacity>
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
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
  },
  // An inset box inside the band rather than a second band.
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 12,
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
    alignItems: 'center',
  },
  verdictPillSafeOn: { backgroundColor: colors.tabFood, borderColor: colors.tabFood },
  verdictPillAvoidOn: { backgroundColor: colors.statusRedBg, borderColor: colors.statusRedOnSurface },
  verdictPillText: {
    ...typography.caption,
    color: colors.textPrimary,
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
  itemActionButton: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginRight: 6,
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
});
