import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { DIGEST_CONDITION_ICONS } from './DigestConditionIcons';
import { DigestEntryBody, entryHeaderDotColor } from './DigestEntryDetail';
import { EntrySearchInput, searchFieldStyle } from './EntrySearchInput';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { CONDITION_CODE_TO_DIGEST_KEY, DIGEST_KEY_TO_CONDITION_CODE } from '../lib/conditionCodeMap';
import {
  addFamilyMember,
  deleteFamilyMember,
  getConditionStages,
  getCuriousAboutConditions,
  getDietPreferences,
  getFamilyMembers,
  getUserConditions,
  getVisibleFoodBaseNames,
  listAllConditions,
  setCuriousAboutConditionSelected,
  updateFamilyMember,
  type ConditionReference,
  type FamilyMember,
} from '../lib/db';
import {
  DIGEST_CATEGORY_META,
  findDigestEntryById,
  getEntriesForCategory,
  isProblemFoodEntry,
  searchEntriesScored,
  type AnyDigestEntry,
  type DigestCategoryKey,
  type RecipeDietTag,
} from '../lib/digest';
import { groupConditionEntries } from '../lib/digest/conditionGrouping';
import { routeForDigestEntry } from '../lib/digestNavigation';

// The 19 conditions, on the Life tab. Direct instruction, 2026-09-19:
// "move Conditions from Digest to Life, all condition icons be changed to
// full color, and only the conditions I have selected as my own are
// listed, while all others are hidden, unless they select that they are
// interested in the other conditions, which then are provided not
// intermixed with my own conditions... the user will need to have an area
// to see those family members' conditions, and those family member
// conditions will also need to tie into the meals for the family... we are
// following the no formatting of the Home screen for this, keeping ALL of
// the information from every card in conditions, but formatting the way
// they work and are laid out like the way we have setup the System Recipes
// area, with their groupings and sub groupings."
//
// So the shape is System Recipes' shape (components/SystemRecipesView.tsx):
// one fold band per condition, carrying its full-colour icon; inside it,
// one fold per topic (Core Science, Food, Meals You Can Eat and so on, the
// same topics the Digest page had), each with its named subgroups and an
// inset row per entry. A row opens in place to everything the Digest card
// showed, through the same DigestEntryBody the Digest still renders, so
// the two cannot drift apart. Three groups, never mixed:
//
//   My Conditions      what Profile says the person tracks
//   Family             the roster kept here, with their conditions
//   Other Conditions   the ones the person said they are curious about
//
// Family and curious conditions are read the way they always were: the
// roster feeds the meal plan (lib/family.ts, lib/partnerPlanning.ts), and
// a curious condition never feeds anything but reading, which is the
// promise Profile makes for it.
//
// No data plumbing of its own for the entries: every condition's entries
// are in the JS bundle already (lib/digest), so this reads them straight
// out, the way System Recipes does.

const FAMILY_RELATIONSHIPS = ['Partner', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Grandchild', 'Other'];
const MAX_FAMILY_NAME = 40;
const CONDITION_ICON_SIZE = 26;

type ConditionMeta = (typeof DIGEST_CATEGORY_META)[number];

type FamilyForm = {
  id: string | null;
  name: string;
  relationship: string;
  conditionCodes: string[];
  includeInMealPlan: boolean;
};

function blankFamilyForm(): FamilyForm {
  return { id: null, name: '', relationship: 'Child', conditionCodes: [], includeInMealPlan: true };
}

/** The Digest category behind a condition code, or null for a code with no page yet. */
function metaForCode(code: string): ConditionMeta | null {
  const key = CONDITION_CODE_TO_DIGEST_KEY[code];
  if (!key) return null;
  return DIGEST_CATEGORY_META.find((meta) => meta.key === key) ?? null;
}

function sortedMetas(codes: string[]): ConditionMeta[] {
  const seen = new Set<string>();
  const metas: ConditionMeta[] = [];
  for (const code of codes) {
    const meta = metaForCode(code);
    if (meta && !seen.has(meta.key)) {
      seen.add(meta.key);
      metas.push(meta);
    }
  }
  return metas.sort((a, b) => a.label.localeCompare(b.label));
}

// Where an entry sits inside its condition: the topic fold to open and the
// subgroup it is under, from the same grouping the bands render, so a jump
// always lands on a fold that exists.
function locateEntry(
  key: DigestCategoryKey,
  id: string,
  declaredStages: Record<string, string>,
  dietPreferences: RecipeDietTag[],
): { topic: string | null } | null {
  const code = DIGEST_KEY_TO_CONDITION_CODE[key];
  const grouped = groupConditionEntries(getEntriesForCategory(key), code, code ? declaredStages[code] : undefined, dietPreferences);
  if (grouped.tyingTogether?.id === id) return { topic: null };
  for (const topic of grouped.topics) {
    if (topic.entries.some((entry) => entry.id === id)) return { topic: topic.label.split('::')[0] };
  }
  return null;
}

export function ConditionsSection({
  tabColor,
  openEntryId,
  scrollToY,
}: {
  tabColor: string;
  // An entry to open on arrival: a Home flip card's Read More, a Related
  // chip tapped elsewhere, a Search All hit. See lib/digestNavigation.ts.
  openEntryId?: string;
  // Life's ScrollView, so a jump can bring the opened condition into view.
  // Positions are measured from this section's top; the host adds its own
  // offset.
  scrollToY?: (y: number) => void;
}) {
  const router = useRouter();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);

  const [ownCodes, setOwnCodes] = useState<string[]>([]);
  const [curiousCodes, setCuriousCodes] = useState<string[]>([]);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [allConditions, setAllConditions] = useState<ConditionReference[]>([]);
  const [declaredStages, setDeclaredStages] = useState<Record<string, string>>({});
  const [dietPreferences, setDietPreferences] = useState<RecipeDietTag[]>([]);
  const [visibleFoodNames, setVisibleFoodNames] = useState<Set<string> | null>(null);
  // A condition opened by following a link into it, when it is not on any
  // of the three lists. Shown under Other Conditions for this visit only,
  // and said so, rather than silently marking the person curious about it.
  const [peekKeys, setPeekKeys] = useState<DigestCategoryKey[]>([]);

  const [openCondition, setOpenCondition] = useState<DigestCategoryKey | null>(null);
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [openEntry, setOpenEntry] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [familyForm, setFamilyForm] = useState<FamilyForm | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);

  const load = useCallback(async () => {
    try {
      const [own, curious, members, conditions, stages, diets] = await Promise.all([
        getUserConditions(),
        getCuriousAboutConditions(),
        getFamilyMembers(),
        listAllConditions(),
        getConditionStages(),
        getDietPreferences(),
      ]);
      setOwnCodes(own);
      setCuriousCodes(curious);
      setFamily(members);
      setAllConditions(conditions);
      setDeclaredStages(stages);
      setDietPreferences(diets as RecipeDietTag[]);
    } catch (error) {
      showInfoAlert('Could not load Conditions', error instanceof Error ? error.message : String(error));
    }
  }, [showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Entries tagged with foods that have since been hidden go with them,
  // the same rule the Digest applies (see getVisibleFoodBaseNames).
  useEffect(() => {
    let cancelled = false;
    const names = new Set<string>();
    for (const meta of DIGEST_CATEGORY_META) {
      if (!DIGEST_KEY_TO_CONDITION_CODE[meta.key]) continue;
      for (const entry of getEntriesForCategory(meta.key)) {
        if (!isProblemFoodEntry(entry) && entry.relatedFoodNames) for (const name of entry.relatedFoodNames) names.add(name);
      }
    }
    getVisibleFoodBaseNames([...names]).then((visible) => {
      if (!cancelled) setVisibleFoodNames(visible);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const entriesFor = useCallback(
    (key: DigestCategoryKey): AnyDigestEntry[] => {
      const raw = getEntriesForCategory(key);
      if (visibleFoodNames === null) return raw;
      return raw.filter((entry) => {
        if (isProblemFoodEntry(entry) || !entry.relatedFoodNames || entry.relatedFoodNames.length === 0) return true;
        return entry.relatedFoodNames.some((name) => visibleFoodNames.has(name));
      });
    },
    [visibleFoodNames],
  );

  // The three lists, each with what the other two already hold taken out,
  // so no condition shows twice and the groups never mix.
  const ownMetas = useMemo(() => sortedMetas(ownCodes), [ownCodes]);
  const ownKeys = useMemo(() => new Set(ownMetas.map((meta) => meta.key)), [ownMetas]);
  const familyMetas = useMemo(
    () => sortedMetas(family.flatMap((member) => member.conditionCodes)).filter((meta) => !ownKeys.has(meta.key)),
    [family, ownKeys],
  );
  const familyKeys = useMemo(() => new Set(familyMetas.map((meta) => meta.key)), [familyMetas]);
  const otherMetas = useMemo(() => {
    const curious = sortedMetas(curiousCodes).filter((meta) => !ownKeys.has(meta.key) && !familyKeys.has(meta.key));
    const shown = new Set(curious.map((meta) => meta.key));
    const peeked = peekKeys
      .filter((key) => !ownKeys.has(key) && !familyKeys.has(key) && !shown.has(key))
      .map((key) => DIGEST_CATEGORY_META.find((meta) => meta.key === key))
      .filter((meta): meta is ConditionMeta => Boolean(meta));
    return [...curious, ...peeked].sort((a, b) => a.label.localeCompare(b.label));
  }, [curiousCodes, ownKeys, familyKeys, peekKeys]);
  const curiousKeys = useMemo(() => new Set(sortedMetas(curiousCodes).map((meta) => meta.key)), [curiousCodes]);

  // Who on the roster has each family condition, for the band's caption.
  const familyNamesByKey = useMemo(() => {
    const names = new Map<DigestCategoryKey, string[]>();
    for (const member of family) {
      for (const code of member.conditionCodes) {
        const key = CONDITION_CODE_TO_DIGEST_KEY[code];
        if (!key) continue;
        if (!names.has(key)) names.set(key, []);
        names.get(key)!.push(member.name);
      }
    }
    return names;
  }, [family]);

  // Every condition on the page, for search and for deciding whether a
  // link target is already visible.
  const visibleKeys = useMemo(
    () => new Set<DigestCategoryKey>([...ownMetas, ...familyMetas, ...otherMetas].map((meta) => meta.key)),
    [ownMetas, familyMetas, otherMetas],
  );

  // Each condition band's top, measured from this section's top.
  const bandTops = useRef<Partial<Record<DigestCategoryKey, number>>>({});
  const pendingScroll = useRef<DigestCategoryKey | null>(null);

  const openInPlace = useCallback(
    (id: string) => {
      const target = findDigestEntryById(id);
      if (!target) return;
      const key = target.category as DigestCategoryKey;
      if (!DIGEST_KEY_TO_CONDITION_CODE[key]) {
        router.push(routeForDigestEntry(id));
        return;
      }
      const where = locateEntry(key, id, declaredStages, dietPreferences);
      if (!visibleKeys.has(key)) setPeekKeys((current) => (current.includes(key) ? current : [...current, key]));
      setQuery('');
      setOpenCondition(key);
      setOpenTopic(where?.topic ?? null);
      setOpenEntry(id);
      pendingScroll.current = key;
      const top = bandTops.current[key];
      if (top !== undefined && scrollToY) {
        scrollToY(top);
        pendingScroll.current = null;
      }
    },
    [router, declaredStages, dietPreferences, visibleKeys, scrollToY],
  );

  // A deep link opens its entry once per id, after the lists have loaded
  // so the band exists to open.
  const consumedOpenId = useRef<string | null>(null);
  useEffect(() => {
    if (!openEntryId || consumedOpenId.current === openEntryId) return;
    if (allConditions.length === 0) return;
    consumedOpenId.current = openEntryId;
    openInPlace(openEntryId);
  }, [openEntryId, allConditions.length, openInPlace]);

  const handleDebouncedChange = useCallback((text: string) => setQuery(text), []);

  // A search replaces the bands with one ranked list across every
  // condition on the page, the way System Recipes' search does.
  const searchResults = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return null;
    const pool: AnyDigestEntry[] = [];
    const labelFor = new Map<string, string>();
    for (const meta of [...ownMetas, ...familyMetas, ...otherMetas]) {
      for (const entry of entriesFor(meta.key)) {
        pool.push(entry);
        labelFor.set(entry.id, meta.label);
      }
    }
    return searchEntriesScored(pool, trimmed, pool.length || 1).map((result) => ({
      entry: result.entry,
      groupLabel: labelFor.get(result.entry.id) ?? '',
    }));
  }, [query, ownMetas, familyMetas, otherMetas, entriesFor]);

  // --- Family roster -------------------------------------------------------

  const builtConditions = useMemo(
    () => allConditions.filter((condition) => condition.status !== 'planned').slice().sort((a, b) => a.name.localeCompare(b.name)),
    [allConditions],
  );

  async function saveFamilyMember() {
    if (!familyForm) return;
    const name = familyForm.name.trim();
    if (!name) {
      showInfoAlert('A name is needed', 'Give this person a name so the meal plan and the bands can say who a condition belongs to.');
      return;
    }
    try {
      if (familyForm.id) {
        await updateFamilyMember(familyForm.id, {
          name,
          relationship: familyForm.relationship,
          conditionCodes: familyForm.conditionCodes,
          includeInMealPlan: familyForm.includeInMealPlan,
        });
      } else {
        await addFamilyMember({
          name,
          relationship: familyForm.relationship,
          conditionCodes: familyForm.conditionCodes,
          includeInMealPlan: familyForm.includeInMealPlan,
        });
      }
      setFamilyForm(null);
      await load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  function confirmRemoveMember(member: FamilyMember) {
    setConfirm({
      title: `Remove ${member.name}?`,
      message: 'Their conditions stop being planned around and their bands leave this page. Nothing else changes.',
      actions: [
        {
          label: 'Remove',
          destructive: true,
          onPress: async () => {
            setConfirm(null);
            try {
              await deleteFamilyMember(member.id);
              await load();
            } catch (error) {
              showInfoAlert('Could not remove', error instanceof Error ? error.message : String(error));
            }
          },
        },
        { label: 'Keep them', onPress: () => setConfirm(null) },
      ],
    });
  }

  // --- Other conditions ----------------------------------------------------

  const curiousChoices = useMemo(
    () =>
      builtConditions
        .filter((condition) => !ownCodes.includes(condition.code) && !curiousCodes.includes(condition.code))
        .map((condition) => ({ label: condition.name, value: condition.code })),
    [builtConditions, ownCodes, curiousCodes],
  );

  async function addCurious(code: string) {
    try {
      await setCuriousAboutConditionSelected(code, true);
      const key = CONDITION_CODE_TO_DIGEST_KEY[code];
      if (key) setPeekKeys((current) => current.filter((entry) => entry !== key));
      await load();
    } catch (error) {
      showInfoAlert('Could not add', error instanceof Error ? error.message : String(error));
    }
  }

  async function removeCurious(key: DigestCategoryKey) {
    const code = DIGEST_KEY_TO_CONDITION_CODE[key];
    if (!code) return;
    try {
      await setCuriousAboutConditionSelected(code, false);
      if (openCondition === key) setOpenCondition(null);
      await load();
    } catch (error) {
      showInfoAlert('Could not remove', error instanceof Error ? error.message : String(error));
    }
  }

  // --- Render --------------------------------------------------------------

  function renderConditionBand(meta: ConditionMeta, caption?: string, extra?: { label: string; onPress: () => void }) {
    const key = meta.key;
    const Icon = DIGEST_CONDITION_ICONS[key];
    const entries = entriesFor(key);
    return (
      <View
        key={key}
        onLayout={(event) => {
          bandTops.current[key] = event.nativeEvent.layout.y;
          if (pendingScroll.current === key && scrollToY) {
            scrollToY(event.nativeEvent.layout.y);
            pendingScroll.current = null;
          }
        }}
      >
        <HomeSectionBand
          kind="fold"
          title={`${meta.label} (${entries.length})`}
          icon={meta.icon}
          // The band hands out 16, the size of an Ionicons glyph. This is
          // full-color artwork, and at 16 it reads as a smudge, so it takes
          // the room the row already has for a line of title text.
          renderIcon={Icon ? (_size, color) => <Icon size={CONDITION_ICON_SIZE} color={color} /> : undefined}
          color={tabColor}
          expanded={openCondition === key}
          onToggle={() => {
            setOpenCondition(openCondition === key ? null : key);
            setOpenTopic(null);
            setOpenEntry(null);
          }}
          contentStyle={styles.bandBody}
        >
          <ConditionBandBody
            meta={meta}
            entries={entries}
            caption={caption}
            extra={extra}
            declaredStages={declaredStages}
            dietPreferences={dietPreferences}
            openTopic={openTopic}
            onToggleTopic={(topic) => {
              setOpenTopic(openTopic === topic ? null : topic);
              setOpenEntry(null);
            }}
            openEntry={openEntry}
            onToggleEntry={(id) => setOpenEntry(openEntry === id ? null : id)}
            onJumpToRelated={openInPlace}
            tabColor={tabColor}
            styles={styles}
          />
        </HomeSectionBand>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {infoAlertElement}
      <AppActionSheet
        visible={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        message={confirm?.message}
        actions={confirm?.actions ?? []}
      />

      <View style={styles.introBox}>
        <Text style={styles.introText}>
          Everything the app knows about the conditions in your life, grouped by whose they are. Yours come
          first, then your family&apos;s, then any you want to read about. Open a condition to see its topics, and a
          topic to read its entries: the research, the food, the meals that clear it, and the labs and
          medication timing, each with its evidence and its sources.
        </Text>
      </View>

      <View style={styles.controlsBox}>
        <EntrySearchInput
          placeholder="Search these conditions..."
          style={styles.searchField}
          tabColor={tabColor}
          onDebouncedChange={handleDebouncedChange}
        />
        {searchResults ? (
          <Text style={styles.resultCount}>
            {searchResults.length} {searchResults.length === 1 ? 'entry' : 'entries'} found
          </Text>
        ) : null}
      </View>

      {searchResults ? (
        <View style={styles.resultList}>
          {searchResults.length === 0 ? (
            <Text style={styles.emptyText}>Nothing matched that search across the conditions on this page.</Text>
          ) : null}
          {searchResults.map((result, index) => (
            <Fragment key={result.entry.id}>
              {index > 0 ? <View style={styles.rowDivider} /> : null}
              <ConditionEntryRow
                entry={result.entry}
                groupLabel={result.groupLabel}
                activeConditionCode={DIGEST_KEY_TO_CONDITION_CODE[result.entry.category as DigestCategoryKey]}
                activeStageCode={
                  DIGEST_KEY_TO_CONDITION_CODE[result.entry.category as DigestCategoryKey]
                    ? declaredStages[DIGEST_KEY_TO_CONDITION_CODE[result.entry.category as DigestCategoryKey]!]
                    : undefined
                }
                expanded={openEntry === result.entry.id}
                onToggle={() => setOpenEntry(openEntry === result.entry.id ? null : result.entry.id)}
                onJumpToRelated={openInPlace}
                tabColor={tabColor}
                styles={styles}
              />
            </Fragment>
          ))}
        </View>
      ) : (
        <>
          <View style={styles.groupHeadingChip}>
            <Text style={styles.groupHeadingText}>My Conditions</Text>
            <Text style={styles.groupHeadingMeta}>
              {ownMetas.length === 0
                ? 'None selected yet. Choose the conditions you track in Profile and they appear here.'
                : 'The conditions you track, from Profile. These drive your food scores, meal plans and advisories.'}
            </Text>
            {ownMetas.length === 0 ? (
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Text style={styles.actionText}>Open Profile</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {ownMetas.map((meta) => renderConditionBand(meta))}

          <View style={styles.groupHeadingChip}>
            <Text style={styles.groupHeadingText}>Family</Text>
            <Text style={styles.groupHeadingMeta}>
              People in your household and what they track. Anyone marked for meal planning has their conditions
              checked alongside yours when a plan is generated. Nothing here touches your scores or
              advisories.
            </Text>
            {family.map((member) => {
              const conditionNames = member.conditionCodes
                .map((code) => allConditions.find((condition) => condition.code === code)?.name ?? code)
                .sort((a, b) => a.localeCompare(b));
              const shared = member.conditionCodes.filter((code) => ownCodes.includes(code)).length;
              return (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberMain}>
                    <Text style={styles.memberName}>
                      {member.name}
                      {member.relationship ? <Text style={styles.memberRelationship}>{`  ${member.relationship}`}</Text> : null}
                    </Text>
                    <Text style={styles.memberMeta}>
                      {conditionNames.length === 0 ? 'Tracks no conditions.' : conditionNames.join(', ')}
                      {shared > 0 ? ` ${shared === 1 ? 'One is' : `${shared} are`} also yours, shown above.` : ''}
                      {member.includeInMealPlan ? '' : ' Not planned around.'}
                    </Text>
                  </View>
                  <View style={styles.memberActions}>
                    <TouchableOpacity
                      onPress={() =>
                        setFamilyForm({
                          id: member.id,
                          name: member.name,
                          relationship: member.relationship || 'Other',
                          conditionCodes: member.conditionCodes,
                          includeInMealPlan: member.includeInMealPlan,
                        })
                      }
                    >
                      <Text style={styles.actionText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmRemoveMember(member)}>
                      <Text style={styles.actionTextRemove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {familyForm ? null : (
              <TouchableOpacity style={styles.primaryButton} onPress={() => setFamilyForm(blankFamilyForm())}>
                <Text style={styles.primaryButtonText}>+ Add a family member</Text>
              </TouchableOpacity>
            )}
          </View>

          {familyForm ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{familyForm.id ? 'Change this person' : 'Someone in your family'}</Text>
              <Text style={styles.label}>Name</Text>
              <AppTextInput
                style={styles.input}
                value={familyForm.name}
                onChangeText={(text) => setFamilyForm({ ...familyForm, name: text })}
                placeholder="Sam"
                placeholderTextColor={colors.textMuted}
                maxLength={MAX_FAMILY_NAME}
              />
              <Text style={styles.label}>Who they are to you</Text>
              <PopoverSelect
                options={FAMILY_RELATIONSHIPS}
                selected={familyForm.relationship}
                onSelect={(value) => setFamilyForm({ ...familyForm, relationship: value })}
                tabColor={tabColor}
              />
              <Text style={styles.label}>Conditions they track</Text>
              <View style={styles.conditionGrid}>
                {builtConditions.map((condition) => {
                  const active = familyForm.conditionCodes.includes(condition.code);
                  return (
                    <TouchableOpacity
                      key={condition.code}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() =>
                        setFamilyForm({
                          ...familyForm,
                          conditionCodes: active
                            ? familyForm.conditionCodes.filter((code) => code !== condition.code)
                            : [...familyForm.conditionCodes, condition.code],
                        })
                      }
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{condition.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setFamilyForm({ ...familyForm, includeInMealPlan: !familyForm.includeInMealPlan })}
              >
                <Ionicons
                  name={familyForm.includeInMealPlan ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={familyForm.includeInMealPlan ? tabColor : colors.textSecondary}
                />
                <Text style={styles.checkLabel}>Plan meals around their conditions</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>
                When this is on, a generated meal plan is checked against their conditions as well as yours, and
                the plan says so. Turn it off for someone who eats elsewhere.
              </Text>
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.primaryButton} onPress={saveFamilyMember}>
                  <Text style={styles.primaryButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setFamilyForm(null)}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {familyMetas.map((meta) => {
            const names = familyNamesByKey.get(meta.key) ?? [];
            return renderConditionBand(meta, names.length ? `Tracked by ${names.join(' and ')}.` : undefined);
          })}

          <View style={styles.groupHeadingChip}>
            <Text style={styles.groupHeadingText}>Other Conditions</Text>
            <Text style={styles.groupHeadingMeta}>
              Conditions you want to read about without adding them to what the app tracks for you. Nothing
              here changes your food scores, meal plans, advisories or safe foods.
            </Text>
            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>Add one</Text>
              <PopoverSelect
                options={curiousChoices}
                selected={null}
                placeholder={curiousChoices.length === 0 ? 'Every condition is listed' : 'Choose a condition'}
                onSelect={(value) => { addCurious(value); }}
                tabColor={tabColor}
                searchable
                minWidth={180}
              />
            </View>
          </View>
          {otherMetas.map((meta) =>
            curiousKeys.has(meta.key)
              ? renderConditionBand(meta, undefined, { label: 'No longer interested', onPress: () => removeCurious(meta.key) })
              : renderConditionBand(meta, 'Shown because you followed a link here. It leaves when you do.', {
                  label: 'Keep it on this list',
                  onPress: () => {
                    const code = DIGEST_KEY_TO_CONDITION_CODE[meta.key];
                    if (code) addCurious(code);
                  },
                }),
          )}
        </>
      )}
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

// What one opened condition band holds: its description, a caption about
// whose it is, then one fold per topic in the Digest's topic order, with
// the "Putting It Together" synthesis entry last, on its own.
function ConditionBandBody({
  meta,
  entries,
  caption,
  extra,
  declaredStages,
  dietPreferences,
  openTopic,
  onToggleTopic,
  openEntry,
  onToggleEntry,
  onJumpToRelated,
  tabColor,
  styles,
}: {
  meta: ConditionMeta;
  entries: AnyDigestEntry[];
  caption?: string;
  extra?: { label: string; onPress: () => void };
  declaredStages: Record<string, string>;
  dietPreferences: RecipeDietTag[];
  openTopic: string | null;
  onToggleTopic: (topic: string) => void;
  openEntry: string | null;
  onToggleEntry: (id: string) => void;
  onJumpToRelated: (id: string) => void;
  tabColor: string;
  styles: Styles;
}) {
  const conditionCode = DIGEST_KEY_TO_CONDITION_CODE[meta.key];
  const stageCode = conditionCode ? declaredStages[conditionCode] : undefined;
  const grouped = useMemo(
    () => groupConditionEntries(entries, conditionCode, stageCode, dietPreferences),
    [entries, conditionCode, stageCode, dietPreferences],
  );
  // The '::'-joined labels fold up into topic, then subgroup, keeping the
  // order groupConditionEntries put them in.
  const topics = useMemo(() => {
    const order: string[] = [];
    const byTopic = new Map<string, { label: string | null; entries: AnyDigestEntry[] }[]>();
    for (const group of grouped.topics) {
      const [topic, ...rest] = group.label.split('::');
      if (!byTopic.has(topic)) {
        byTopic.set(topic, []);
        order.push(topic);
      }
      byTopic.get(topic)!.push({ label: rest.length ? rest.join(' › ') : null, entries: group.entries });
    }
    return order.map((topic) => {
      const sections = byTopic.get(topic)!;
      return { topic, sections, count: sections.reduce((total, section) => total + section.entries.length, 0) };
    });
  }, [grouped]);

  return (
    <>
      <View style={styles.conditionIntro}>
        <Text style={styles.conditionIntroText}>{meta.description}</Text>
        {caption ? <Text style={styles.conditionCaption}>{caption}</Text> : null}
        {extra ? (
          <TouchableOpacity onPress={extra.onPress}>
            <Text style={styles.actionText}>{extra.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {topics.map((topic) => {
        const expanded = openTopic === topic.topic;
        return (
          <View key={topic.topic} style={styles.topicFold}>
            <TouchableOpacity style={styles.topicTapArea} onPress={() => onToggleTopic(topic.topic)} activeOpacity={0.85}>
              <Text style={styles.topicTitle}>
                {topic.topic} ({topic.count})
              </Text>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {expanded ? (
              <View style={styles.topicBody}>
                {topic.sections.map((section, sectionIndex) => (
                  <Fragment key={section.label ?? 'all'}>
                    {section.label ? (
                      <Text style={[styles.subgroupHeading, sectionIndex > 0 ? styles.subgroupHeadingLater : null]}>
                        {section.label} ({section.entries.length})
                      </Text>
                    ) : null}
                    {section.entries.map((entry, index) => (
                      <Fragment key={entry.id}>
                        {index > 0 ? <View style={styles.rowDivider} /> : null}
                        <ConditionEntryRow
                          entry={entry}
                          activeConditionCode={conditionCode}
                          activeStageCode={stageCode}
                          expanded={openEntry === entry.id}
                          onToggle={() => onToggleEntry(entry.id)}
                          onJumpToRelated={onJumpToRelated}
                          tabColor={tabColor}
                          styles={styles}
                        />
                      </Fragment>
                    ))}
                  </Fragment>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
      {grouped.tyingTogether ? (
        <View style={styles.topicFold}>
          <Text style={[styles.subgroupHeading, styles.tyingTogetherHeading]}>Putting It Together</Text>
          <ConditionEntryRow
            entry={grouped.tyingTogether}
            activeConditionCode={conditionCode}
            activeStageCode={stageCode}
            expanded={openEntry === grouped.tyingTogether.id}
            onToggle={() => onToggleEntry(grouped.tyingTogether!.id)}
            onJumpToRelated={onJumpToRelated}
            tabColor={tabColor}
            styles={styles}
          />
        </View>
      ) : null}
    </>
  );
}

// One entry, closed to its title and teaser, open to everything the
// Digest card showed.
function ConditionEntryRow({
  entry,
  groupLabel,
  activeConditionCode,
  activeStageCode,
  expanded,
  onToggle,
  onJumpToRelated,
  tabColor,
  styles,
}: {
  entry: AnyDigestEntry;
  // Which condition it belongs to, shown only in search results, where
  // the rows no longer sit under a band that says so.
  groupLabel?: string;
  activeConditionCode?: string;
  activeStageCode?: string;
  expanded: boolean;
  onToggle: () => void;
  onJumpToRelated: (id: string) => void;
  tabColor: string;
  styles: Styles;
}) {
  const dotColor = entryHeaderDotColor(entry, activeConditionCode);
  return (
    <View style={styles.itemRow}>
      <TouchableOpacity style={styles.itemTapArea} onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.itemTextWrap}>
          {groupLabel ? <Text style={styles.itemGroupLabel}>{groupLabel}</Text> : null}
          <View style={styles.itemTitleRow}>
            {dotColor ? <View style={[styles.tierDot, { backgroundColor: dotColor }]} /> : null}
            <Text style={styles.itemTitle}>{isProblemFoodEntry(entry) ? entry.foodName : entry.title}</Text>
          </View>
          <Text style={styles.itemSubtitle}>{entry.teaser}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {expanded ? (
        <DigestEntryBody
          entry={entry}
          onJumpToRelated={onJumpToRelated}
          activeConditionCode={activeConditionCode}
          activeStageCode={activeStageCode}
          tabColor={tabColor}
          tabTextColor={tabColor}
          style={styles.itemDetail}
        />
      ) : null}
    </View>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    // The bands run edge to edge, as Home's do; the host takes the
    // ScrollView's side gutter back for this section.
    wrapper: { gap: HOME_BAND_GAP },
    bandBody: { gap: HOME_BAND_GAP },
    introBox: {
      marginHorizontal: HOME_BAND_CONTENT_PADDING,
      borderRadius: 10,
      backgroundColor: colors.surfaceMuted,
      padding: 12,
    },
    introText: { ...typography.caption, color: colors.textSecondary, ...textShadow },
    controlsBox: {
      marginHorizontal: HOME_BAND_CONTENT_PADDING,
      borderRadius: 10,
      backgroundColor: colors.surfaceMuted,
      padding: 12,
      gap: 8,
    },
    searchField: { ...typography.body, ...searchFieldStyle, borderColor: tabColor, ...textShadow },
    resultCount: { ...typography.caption, color: colors.textSecondary, ...textShadow },
    resultList: { marginHorizontal: HOME_BAND_CONTENT_PADDING },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
      ...textShadow,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      padding: 12,
    },
    // A heading introducing a group of bands, so it carries a surface of
    // its own rather than sitting on the Life photograph.
    groupHeadingChip: {
      marginHorizontal: HOME_BAND_CONTENT_PADDING,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderLeftWidth: 3,
      borderLeftColor: tabColor,
      gap: 6,
    },
    groupHeadingText: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
    groupHeadingMeta: { ...typography.caption, color: colors.textSecondary, ...textShadow },
    actionText: { ...typography.caption, color: tabColor, ...textShadow },
    actionTextRemove: { ...typography.caption, color: colors.danger, ...textShadow },
    pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    pickerLabel: { ...typography.caption, color: colors.textSecondary, ...textShadow },

    memberRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    memberMain: { flex: 1 },
    memberName: { ...typography.body, color: colors.textPrimary, ...textShadow },
    memberRelationship: { ...typography.caption, color: colors.textMuted },
    memberMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2, ...textShadow },
    memberActions: { gap: 6, alignItems: 'flex-end' },

    formCard: {
      marginHorizontal: HOME_BAND_CONTENT_PADDING,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 2,
      borderColor: tabColor,
    },
    formTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 4, ...textShadow },
    label: { ...typography.label, color: colors.menuLabelMuted, marginTop: 12, marginBottom: 4, ...textShadow },
    input: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.textPrimary,
    },
    helperText: { ...typography.caption, color: colors.textMuted, marginTop: 6, ...textShadow },
    conditionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    pillActive: { backgroundColor: tabColor, borderColor: tabColor },
    pillText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
    pillTextActive: { color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
    checkLabel: { ...typography.body, color: colors.textPrimary, ...textShadow },
    formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    primaryButton: {
      backgroundColor: colors.buttonColor,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 18,
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginTop: 8,
      ...BUTTON_SHADOW,
    },
    primaryButtonText: { ...typography.body, color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 18,
      alignItems: 'center',
      marginTop: 8,
    },
    secondaryButtonText: { ...typography.body, color: colors.textPrimary, ...textShadow },

    // Inside a band. The band's content is a surface already, so the
    // description sits on it directly.
    conditionIntro: { gap: 6 },
    conditionIntroText: { ...typography.caption, color: colors.textSecondary, ...textShadow },
    conditionCaption: { ...typography.caption, color: colors.textPrimary, ...textShadow },
    // One topic, the level between the condition band and its rows: an
    // inset box, the same shape as a row, holding the rows once open.
    topicFold: {
      borderRadius: 10,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 12,
    },
    topicTapArea: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    topicTitle: { ...typography.bodyEmphasis, color: tabColor, ...textShadow, flex: 1, marginRight: 12 },
    topicBody: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: HOME_BAND_GAP,
      paddingBottom: 12,
    },
    subgroupHeading: { ...typography.eyebrow, color: tabColor, ...textShadow, marginBottom: HOME_BAND_GAP },
    subgroupHeadingLater: { marginTop: HOME_BAND_GAP },
    tyingTogetherHeading: { marginTop: 12 },
    rowDivider: { height: 1, backgroundColor: colors.border, marginVertical: (HOME_BAND_GAP - 1) / 2 },
    // A row sits inside the topic's muted box, so it takes the plain
    // surface to read as one step further in.
    itemRow: { borderRadius: 10, backgroundColor: colors.surface, paddingHorizontal: 12 },
    itemTapArea: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    itemTextWrap: { flex: 1, marginRight: 12 },
    itemGroupLabel: { ...typography.eyebrow, color: tabColor, ...textShadow, marginBottom: 2 },
    itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tierDot: { width: 10, height: 10, borderRadius: 5 },
    itemTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow, flex: 1 },
    itemSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2, ...textShadow },
    itemDetail: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 10,
      paddingBottom: 12,
    },
  });
}
