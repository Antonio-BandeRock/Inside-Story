import { Ionicons } from '@expo/vector-icons';
import { Fragment, useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { EntryPhotoSection } from './EntryPhotoSection';
import { EntrySearchInput, searchFieldStyle } from './EntrySearchInput';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';
import { PopoverSelect } from './PopoverSelect';
import { CuratedRecipeShareButton, RECIPE_BUILDER_PARAM, RecipeBuildRow, RecipeDetailCard } from './RecipeDetailCard';
import { getEntriesForCategory, searchEntriesScored } from '../lib/digest';
import {
  RECIPE_DIET_TAGS,
  isProblemFoodEntry,
  recipeMatchesAllDietPreferences,
  type DigestEntry,
  type RecipeDietTag,
} from '../lib/digest/types';
import type { BuilderFavoriteItemType } from '../lib/db';
import { isSideDish } from '../lib/recipeDishRole';

// The curated recipes, on the Food tab, grouped under the builder that
// makes them. Direct instruction, 2026-09-18: "I would like the System
// recipes from Digest to move to Food on the Food page and be access from
// System Meals, but change System Meals to System Recipes. When I select
// System Recipes, the recipes should be listed by the Builder that would
// create them or would be used to edit them if the user wanted to start
// with a system recipes and change it to suit their liking... When the
// user selects a meal, side, smoothie, etc from the drop down collapsable
// card, it expands to show everything it would have shown from when it was
// listed in Digest. The recipe, the measurements, the prepwork,
// everything."
//
// So the shape is My Recipes' shape (components/FoodItemsView.tsx): one
// fold band per builder, an inset row per recipe, and the row opens in
// place rather than navigating anywhere. What opens is the same
// RecipeDetailCard the Digest renders, painted in Food's green rather
// than the Digest's purple, so the two can never drift apart.
//
// 1.0.40.10, direct instruction: "make sure to provide the filter for diet
// type that was available in Digest, as well as a search utility just as it
// was in Digest too. Put a one pixel separation line mid way between
// recipes in each category. Also, I think maybe the Sides should be
// separated by sub groups based on the type of side it is." All four are
// below. The search box is the same component the Digest uses, moved out to
// components/EntrySearchInput.tsx rather than copied, and a search shows a
// flat ranked result list the way the Digest's does instead of asking
// somebody to open eleven folds looking for the hit.
//
// No data plumbing of its own: every curated recipe already carries its
// full recipeCard, its linkedBuilderType and its linkedCuratedRecipeId in
// the JS bundle (lib/digest/recipes.ts), so this reads them straight out
// rather than going near either database.

const TAB_COLOR = colors.tabFood;

// The bands, in the order Food's lens list puts the builders, with the
// icon each builder already uses.
//
// Ten of the eleven bands are one builder each. The Side Builder is the
// exception and splits in two, because it is this app's generic
// single-dish tool: a roasted salmon fillet and a bowl of sauteed spinach
// were both authored through it, so grouping purely by builder put 126
// dishes that ARE the meal under a heading that says they sit beside one.
// Direct instruction, 1.0.41.1: "Move the 91 mains out of Sides into their
// own group." Which of the two a recipe belongs to is decided by
// lib/recipeDishRole.ts, and Build This Recipe still opens the Side
// Builder from either band, since that is the tool that edits them both.
//
// There is no Meals group, and it is not an omission: a curated recipe's
// linkedBuilderType is a BuilderFavoriteItemType (lib/db.ts), which has no
// 'meal' in it, because Meal Builder assembles a meal out of saved
// components rather than holding ingredients of its own. So a system meal
// cannot exist in the corpus today, and adding one would mean widening
// that type first, then authoring meals as combinations of the components
// below. Raised with the owner 2026-09-18.
type RecipeGroupKey = BuilderFavoriteItemType | 'main';

const RECIPE_GROUPS: { key: RecipeGroupKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'main', label: 'Mains', icon: 'restaurant-outline' },
  { key: 'side', label: 'Sides', icon: 'fast-food-outline' },
  { key: 'salad', label: 'Salads & Bowls', icon: 'leaf-outline' },
  { key: 'smoothie', label: 'Smoothies', icon: 'wine-outline' },
  { key: 'fermentation', label: 'Fermentation', icon: 'flask-outline' },
  { key: 'beverage', label: 'Beverages', icon: 'cafe-outline' },
  { key: 'snack', label: 'Snacks', icon: 'nutrition-outline' },
  { key: 'bakedGoods', label: 'Baked Goods', icon: 'pizza-outline' },
  { key: 'soup', label: 'Soups', icon: 'flame-outline' },
  { key: 'sauce', label: 'Sauces', icon: 'water-outline' },
  { key: 'handheld', label: 'Handhelds', icon: 'layers-outline' },
  { key: 'dessert', label: 'Desserts', icon: 'ice-cream-outline' },
];

// Which band a recipe belongs in. Its builder, except that the Side
// Builder feeds two.
function groupKeyFor(entry: DigestEntry): RecipeGroupKey | null {
  if (!entry.linkedBuilderType) return null;
  if (entry.linkedBuilderType === 'side' && !isSideDish(entry.linkedCuratedRecipeId)) return 'main';
  return entry.linkedBuilderType;
}

// Subgroups inside a band, for every builder holding more than about a
// dozen recipes. The standing rule from the Digest applies here for the
// same reason it applies there: a shelf covering more than one subject
// stops being browsable once it runs long, and Sides at 131 covered seven
// different things at once.
//
// Read as ordered rules against the recipe's own title, first match wins,
// with a terminal catch-all so nothing can fall through. Each rule may
// carry an `unless` guard, which is what keeps King Oyster "Scallops" out
// of Fish & Seafood and the fruit breakfast bowls out of the savory ones.
//
// The split was designed from the actual titles rather than guessed, and
// every id was checked to land in exactly one named subgroup with no
// bucket left empty. scripts/audit_system_recipe_subgroups.js is what
// does the checking, and it fails on a band past a dozen carrying no
// table, so a batch of new recipes cannot quietly outgrow its shelf.
//
// 2026-09-19, 1.0.41.2: Sides and Snacks got tables of their own, after 45
// new recipes took them to 30 and 24. Sides had been left as one list on
// purpose while it held five.
type SubgroupRule = { label: string; match: RegExp; unless?: RegExp };

const SEAFOOD = /salmon|cod\b|halibut|trout|shrimp|scallop|sole\b|sardine|tuna|mackerel|crab|mussel|tilapia|snapper|anchov/;
// King Oyster mushroom stands in for scallops in two vegan dishes, and the
// title says so, which is the one place the seafood words lie.
const NOT_SEAFOOD = /king oyster|mushroom/;

const RECIPE_SUBGROUPS: Partial<Record<RecipeGroupKey, SubgroupRule[]>> = {
  main: [
    // A breakfast skillet is still the meal, so it is a main and sits at
    // the top of its own shelf. One of the 34 ("Mediterranean Zucchini,
    // Tomato & Feta Skillet") never says egg in its title, which is why
    // the Mediterranean guard takes skillet as well.
    { label: 'Breakfast Skillets & Hashes', match: /breakfast|scramble|mediterranean.*(egg|skillet)/ },
    { label: 'Fish & Seafood', match: SEAFOOD, unless: NOT_SEAFOOD },
    { label: 'Poultry', match: /chicken|turkey|duck\b/ },
    { label: 'Beef, Pork & Lamb', match: /beef|pork|lamb|bison|steak/ },
    { label: 'Beans, Lentils & Chickpeas', match: /bean|lentil|chickpea|edamame|hummus/ },
    { label: 'Tofu, Tempeh & Seitan', match: /tofu|tempeh|seitan/ },
    { label: 'Grain & Vegetable Mains', match: /.*/ },
  ],
  salad: [
    { label: 'Overnight Oats', match: /overnight oats/ },
    { label: 'Warm Porridge & Oatmeal', match: /oats|oatmeal|porridge|polenta|congee|grits/ },
    { label: 'Yogurt Bowls', match: /yogurt|kefir/ },
    { label: 'Tofu & Cottage Cheese Bowls', match: /silken|tofu bowl|tofu cream|tofu ricotta|cottage cheese/ },
    // A savory breakfast bowl and a fruit one are both titled "Breakfast
    // Bowl", so the fruit words are what tells them apart.
    { label: 'Savory Breakfast Bowls', match: /breakfast bowl|breakfast quinoa/, unless: /berry|melon|citrus|date and|tropical|cantaloupe|grapefruit/ },
    { label: 'Fruit Bowls', match: /breakfast bowl|fruit bowl/ },
    { label: 'Fish & Seafood Salads', match: SEAFOOD, unless: NOT_SEAFOOD },
    { label: 'Grain & Bean Bowls', match: /quinoa|rice|millet|farro|barley|buckwheat|amaranth|sorghum|teff|bulgur|couscous|spelt|grain|bean|lentil|chickpea|edamame/ },
    { label: 'Green & Vegetable Salads', match: /.*/ },
  ],
  fermentation: [
    { label: 'Yogurt & Kefir', match: /yogurt|kefir|\blassi\b|ayran|tarag|fermented milk/ },
    { label: 'Kombucha & Fermented Teas', match: /kombucha|jun tea|pu-erh|fermented tea/ },
    { label: 'Wild-Fermented Tonics', match: /wild-fermented|tonic|cheong|shrub|switchel/ },
    { label: 'Sodas, Kvass & Beers', match: /soda|kvass|beer|\bale\b|tepache/ },
    { label: 'Grain & Starch Ferments', match: /amazake|boza|chicha|makgeolli|pozol|rejuvelac|sake|rice wine|sobia/ },
    { label: 'Vegetable & Wild Ferments', match: /.*/ },
  ],
  soup: [
    { label: 'Bean & Lentil Soups', match: /bean|lentil|chili/ },
    { label: 'Fish & Seafood Soups', match: /salmon|crab|mussel|chowder|shrimp|cod\b/ },
    { label: 'Vegetable Soups & Broths', match: /.*/ },
  ],
  dessert: [
    { label: 'Chia Puddings', match: /chia/ },
    { label: 'Warm Puddings & Baked Fruit', match: /.*/ },
  ],
  handheld: [
    { label: 'Lettuce & Collard Wraps', match: /lettuce wrap|collard/ },
    { label: 'Wraps, Burritos & Tacos', match: /wrap|burrito|taco/ },
    { label: 'Sandwiches', match: /.*/ },
  ],
  smoothie: [
    { label: 'Vegan Protein Smoothies', match: /vegan/ },
    { label: 'Protein Smoothies', match: /protein/ },
    { label: 'Fruit Smoothies & Bowls', match: /.*/ },
  ],
  // Sides are grouped by how the dish is cooked and what it is made of,
  // which is how somebody looking for a side actually chooses one: there
  // is already a roast in the oven, or there is one burner free, or the
  // meal needs a starch beside it.
  side: [
    // Green beans are a skillet vegetable here, not a legume dish, so the
    // guard keeps them out of the bean shelf and lets them fall through.
    { label: 'Beans & Lentils', match: /chickpea|lentil|bean/, unless: /green bean/ },
    { label: 'Grains & Starchy Sides', match: /rice|polenta|sorghum|pilaf|mashed|potato/ },
    { label: 'Slaws & Cold Sides', match: /slaw|salad/ },
    { label: 'Roasted & Baked Vegetables', match: /roast|baked/ },
    { label: 'Skillet & Stovetop Vegetables', match: /.*/ },
  ],
  // Snacks are grouped by what the snack is for, since a person reaching
  // for one wants something crunchy, or something to dip, or something
  // sweet, long before they care what is in it. The fruit shelf is the
  // catch-all, so a savory snack added later needs a rule of its own in
  // the same pass that writes it.
  snack: [
    { label: 'Chips, Crackers & Crunchy Bites', match: /chips|cracker|roasted chickpeas|trail mix/ },
    { label: 'Dips, Spreads & Dippers', match: /dip|hummus|tahini|almond butter|avocado/ },
    { label: 'No-Bake Bites, Bars & Balls', match: /bites|bars|balls|clusters/ },
    { label: 'Fruit & Yogurt', match: /.*/ },
  ],
};

type RecipeGroup = { key: RecipeGroupKey; label: string; icon: keyof typeof Ionicons.glyphMap; entries: DigestEntry[] };
type RecipeSection = { label: string | null; entries: DigestEntry[] };

// Below this, a band reads fine as one list and a heading per two recipes
// would be noise. Matters most once a diet filter has cut a band down.
const SUBGROUP_MIN = 12;

// Splits one band's recipes into its named subgroups, keeping the table's
// own order and dropping a subgroup nothing landed in. A builder with no
// table, or one filtered down to a handful, comes back as a single
// unlabeled section.
function sectionsFor(key: RecipeGroupKey, entries: DigestEntry[]): RecipeSection[] {
  const rules = RECIPE_SUBGROUPS[key];
  if (!rules || entries.length <= SUBGROUP_MIN) return [{ label: null, entries }];
  const buckets = new Map<string, DigestEntry[]>();
  for (const entry of entries) {
    const title = entry.title.toLowerCase();
    const rule = rules.find((candidate) => candidate.match.test(title) && !(candidate.unless && candidate.unless.test(title)));
    // The last rule matches everything, so `rule` is always found. The
    // fallback keeps a future table edit from silently losing a recipe.
    const key = rule ? rule.label : 'Other';
    const bucket = buckets.get(key);
    if (bucket) bucket.push(entry);
    else buckets.set(key, [entry]);
  }
  const ordered: RecipeSection[] = [];
  for (const rule of rules) {
    const bucket = buckets.get(rule.label);
    if (bucket && bucket.length > 0) ordered.push({ label: rule.label, entries: bucket });
  }
  const other = buckets.get('Other');
  if (other && other.length > 0) ordered.push({ label: 'Other', entries: other });
  return ordered;
}

// Worked out once for the life of the app, since the corpus is bundled and
// cannot change while it is running. Food's own tile reads the count from
// here on every render, which is why this is cached rather than filtered
// afresh each time.
let cachedGroups: RecipeGroup[] | null = null;

function systemRecipeGroups(): RecipeGroup[] {
  if (cachedGroups) return cachedGroups;
  // The Recipes category holds one other shape too (a problem-food entry
  // has no title or recipeCard of its own), so that is told apart here
  // rather than assumed away.
  const entries = getEntriesForCategory('recipes').filter(
    (entry): entry is DigestEntry => !isProblemFoodEntry(entry),
  );
  const byKey = new Map<string, DigestEntry[]>();
  for (const entry of entries) {
    const key = groupKeyFor(entry);
    if (!key) continue;
    const bucket = byKey.get(key);
    if (bucket) bucket.push(entry);
    else byKey.set(key, [entry]);
  }
  for (const bucket of byKey.values()) {
    bucket.sort((a, b) => a.title.localeCompare(b.title));
  }
  cachedGroups = RECIPE_GROUPS.map((group) => ({ ...group, entries: byKey.get(group.key) ?? [] })).filter(
    (group) => group.entries.length > 0,
  );
  return cachedGroups;
}

// How many recipes the app ships, for the Food tile that opens this.
export function countSystemRecipes(): number {
  return systemRecipeGroups().reduce((total, group) => total + group.entries.length, 0);
}

// The same option list the Digest's Recipes lens carries, off the one
// ordered RECIPE_DIET_TAGS rather than a second hand-typed list.
const RECIPE_DIET_FILTER_OPTIONS: string[] = ['All Diets', ...RECIPE_DIET_TAGS];

export function SystemRecipesView({
  onOpenBuilder,
  onClose,
}: {
  // A builder, pre-loaded with the curated recipe to start from: the same
  // openSideRecipeId/openSaladRecipeId/... params the Digest's own "Build
  // This Recipe" has always pushed, which is what makes "start with a
  // system recipe and change it" work.
  onOpenBuilder: (params: Record<string, string>) => void;
  onClose: () => void;
}) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<RecipeDietTag | null>(null);

  const groups = systemRecipeGroups();

  // Stable across keystrokes, which is the whole point of the debounce
  // inside EntrySearchInput: an unstable callback would undo it.
  const handleDebouncedChange = useCallback((text: string) => setQuery(text), []);

  // The diet filter alone leaves the bands standing, just shorter.
  const filteredGroups = useMemo(() => {
    if (!dietFilter) return groups;
    return groups
      .map((group) => ({ ...group, entries: group.entries.filter((entry) => recipeMatchesAllDietPreferences(entry, [dietFilter])) }))
      .filter((group) => group.entries.length > 0);
  }, [groups, dietFilter]);

  // A search replaces the bands with one ranked list, the way the Digest's
  // own search does, so a hit three folds down is visible without opening
  // anything. The diet filter still applies, since the two questions ("what
  // can I eat" and "where is that recipe") are asked together as often as
  // not.
  const searchResults = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return null;
    const pool: DigestEntry[] = [];
    const labelFor = new Map<string, string>();
    for (const group of filteredGroups) {
      for (const entry of group.entries) {
        pool.push(entry);
        labelFor.set(entry.id, group.label);
      }
    }
    // The default limit of 60 would quietly cut a broad search short, so
    // the whole pool is the limit here.
    return searchEntriesScored(pool, trimmed, pool.length || 1).map((result) => ({
      entry: result.entry as DigestEntry,
      groupLabel: labelFor.get(result.entry.id) ?? '',
    }));
  }, [filteredGroups, query]);

  const filteredTotal = filteredGroups.reduce((total, group) => total + group.entries.length, 0);

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.backLink}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.introBox}>
          <Text style={styles.introText}>
            Every recipe that comes with the app, grouped by what the dish is. Tap one to read it: what it makes,
            what goes in it, how to cook it, and what it gives you. Build This Recipe opens that tool already loaded
            with it, so you can change it into your own.
          </Text>
        </View>
        <View style={styles.controlsBox}>
          <EntrySearchInput
            placeholder="Search the recipes..."
            style={styles.searchField}
            tabColor={TAB_COLOR}
            onDebouncedChange={handleDebouncedChange}
          />
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Filter by diet</Text>
            <PopoverSelect
              options={RECIPE_DIET_FILTER_OPTIONS}
              selected={dietFilter ?? 'All Diets'}
              onSelect={(value) => setDietFilter(value === 'All Diets' ? null : (value as RecipeDietTag))}
              tabColor={TAB_COLOR}
            />
          </View>
          {dietFilter || searchResults ? (
            <Text style={styles.resultCount}>
              {searchResults
                ? `${searchResults.length} ${searchResults.length === 1 ? 'recipe' : 'recipes'} found`
                : `${filteredTotal} ${filteredTotal === 1 ? 'recipe' : 'recipes'} for ${dietFilter}`}
            </Text>
          ) : null}
        </View>
        {searchResults ? (
          <View style={styles.resultList}>
            {searchResults.length === 0 ? (
              <Text style={styles.emptyText}>Nothing matched that search. Try a single ingredient or a dish name.</Text>
            ) : null}
            {searchResults.map((result, index) => (
              <Fragment key={result.entry.id}>
                {index > 0 ? <View style={styles.rowDivider} /> : null}
                <SystemRecipeRow
                  entry={result.entry}
                  groupLabel={result.groupLabel}
                  expanded={openEntryId === result.entry.id}
                  onToggle={() => setOpenEntryId(openEntryId === result.entry.id ? null : result.entry.id)}
                  onOpenBuilder={onOpenBuilder}
                />
              </Fragment>
            ))}
          </View>
        ) : (
          filteredGroups.map((group) => (
            <HomeSectionBand
              key={group.key}
              kind="fold"
              title={`${group.label} (${group.entries.length})`}
              icon={group.icon}
              color={TAB_COLOR}
              expanded={openGroup === group.key}
              onToggle={() => setOpenGroup(openGroup === group.key ? null : group.key)}
              contentStyle={styles.bandBody}
            >
              {sectionsFor(group.key, group.entries).map((section, sectionIndex) => (
                <Fragment key={section.label ?? 'all'}>
                  {section.label ? (
                    <Text style={[styles.subgroupHeading, sectionIndex > 0 ? styles.subgroupHeadingLater : null]}>
                      {section.label} ({section.entries.length})
                    </Text>
                  ) : null}
                  {section.entries.map((entry, index) => (
                    <Fragment key={entry.id}>
                      {/* The one pixel line sits exactly midway: the gap
                          above and below it add back to HOME_BAND_GAP, so
                          the rows keep the spacing every other stacked
                          thing in the app uses. */}
                      {index > 0 ? <View style={styles.rowDivider} /> : null}
                      <SystemRecipeRow
                        entry={entry}
                        expanded={openEntryId === entry.id}
                        onToggle={() => setOpenEntryId(openEntryId === entry.id ? null : entry.id)}
                        onOpenBuilder={onOpenBuilder}
                      />
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </HomeSectionBand>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// One recipe, closed to its title and teaser, open to the whole thing.
function SystemRecipeRow({
  entry,
  groupLabel,
  expanded,
  onToggle,
  onOpenBuilder,
}: {
  entry: DigestEntry;
  // Which builder makes it, shown only in search results, where the rows
  // no longer sit under a band that says so.
  groupLabel?: string;
  expanded: boolean;
  onToggle: () => void;
  onOpenBuilder: (params: Record<string, string>) => void;
}) {
  return (
    <View style={styles.itemRow}>
      <TouchableOpacity style={styles.itemTapArea} onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.itemTextWrap}>
          {groupLabel ? <Text style={styles.itemGroupLabel}>{groupLabel}</Text> : null}
          <Text style={styles.itemTitle}>{entry.title}</Text>
          <Text style={styles.itemSubtitle}>{entry.teaser}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {expanded ? (
        <View style={styles.itemDetail}>
          <Text style={styles.detailText}>{entry.summary}</Text>
          {entry.linkedCuratedRecipeId && entry.linkedBuilderType ? (
            <RecipeBuildRow
              label="Build This Recipe"
              tabColor={TAB_COLOR}
              onPress={() =>
                onOpenBuilder({
                  [RECIPE_BUILDER_PARAM[entry.linkedBuilderType!]]: entry.linkedCuratedRecipeId!,
                })
              }
            >
              <CuratedRecipeShareButton
                recipeId={entry.linkedCuratedRecipeId}
                builderType={entry.linkedBuilderType}
                tabColor={TAB_COLOR}
              />
            </RecipeBuildRow>
          ) : null}
          {entry.recipeCard ? (
            <RecipeDetailCard card={entry.recipeCard} tabColor={TAB_COLOR} tabTextColor={TAB_COLOR} />
          ) : null}
          <EntryPhotoSection entry={entry} tabColor={TAB_COLOR} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // The Food background shows through, as it does behind every builder.
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
  // gap: 0 on purpose. The rows space themselves through the divider
  // below, which carries the whole HOME_BAND_GAP with the line in its
  // middle, and a gap here would add to it.
  bandBody: { gap: 0 },
  introBox: {
    marginHorizontal: HOME_BAND_CONTENT_PADDING,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    padding: 12,
  },
  introText: {
    ...typography.caption,
    color: colors.textSecondary,
    ...textShadow,
  },
  // The search box and the diet picker share one surface rather than
  // sitting on the Food photo with nothing behind them.
  controlsBox: {
    marginHorizontal: HOME_BAND_CONTENT_PADDING,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    gap: 8,
  },
  searchField: {
    ...typography.body,
    ...searchFieldStyle,
    borderColor: TAB_COLOR,
    ...textShadow,
  },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterLabel: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  resultCount: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  // Search results stand in for the bands, so they take the bands' own
  // horizontal inset to line up with everything above them.
  resultList: { marginHorizontal: HOME_BAND_CONTENT_PADDING },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    ...textShadow,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 12,
  },
  // A named subgroup inside a band. Sits on the band's own surface, so it
  // needs no fill of its own.
  subgroupHeading: {
    ...typography.eyebrow,
    color: TAB_COLOR,
    ...textShadow,
    marginBottom: HOME_BAND_GAP,
  },
  subgroupHeadingLater: { marginTop: HOME_BAND_GAP },
  // One pixel, with the rest of HOME_BAND_GAP split evenly above and
  // below it, so the line lands halfway between two recipes and the
  // distance between them is unchanged.
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: (HOME_BAND_GAP - 1) / 2,
  },
  // An inset box inside the band rather than a second band, the same shape
  // My Recipes' own rows take.
  itemRow: {
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
  },
  itemTapArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemTextWrap: { flex: 1, marginRight: 12 },
  itemGroupLabel: {
    ...typography.eyebrow,
    color: TAB_COLOR,
    ...textShadow,
    marginBottom: 2,
  },
  itemTitle: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    ...textShadow,
  },
  itemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    ...textShadow,
  },
  itemDetail: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingBottom: 12,
  },
  detailText: {
    ...typography.body,
    color: colors.textPrimary,
    ...textShadow,
  },
});
