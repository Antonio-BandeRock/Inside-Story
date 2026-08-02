import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, inputBackground } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import {
  createMealFromComponents,
  getMealComponentDisplayInfo,
  getMealComponents,
  getMealComponentsGoitrogenicFlags,
  listMealComponentOptions,
  markScheduledMealLogged,
  type MealComponentOption,
  type MealComponentSelection,
  type MealComponentType,
} from '../lib/db';
import { parseAmountValue } from '../lib/measurement';
import { useActiveField, useActiveInputControls } from './ActiveInputContext';
import { AppTextInput } from './AppTextInput';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';

// Deliberately last of the ten Food-tab builders, per this app's own build
// order (see CLAUDE.md's Next steps) -- this is the only one that assembles
// FROM the other nine's own saved output instead of building its own from
// raw ingredients, so it couldn't exist until they did. See the published
// design doc (linked from CLAUDE.md's Status section) for the full
// pipeline/schema reasoning; this file is Phase 2+4 of that doc's own
// 4-phase build sequence -- assemble a meal from saved sides/salads/etc and
// log it now, plus reconnect Schedule's/Home's "Log now" deep link, which
// has pointed at a dead end since the old all-in-one meal builder was
// deleted 2026-07-25. Phase 3 ("Save & Schedule for later," a convenience
// shortcut distinct from fixing that deep link) is deliberately deferred --
// Schedule already has its own independent "schedule a meal" flow that
// doesn't require Meal Builder at all, so this isn't a hard gap the way the
// Log Now dead end was.
//
// Same vocabulary as Schedule's own mealTypes -- kept as a separate literal
// here rather than importing across screen files, same precedent already
// used elsewhere in this app (e.g. SideBuilder's own COOKING_METHODS).
const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage', 'salad', 'smoothie'];

// Same fixed fraction/whole-number list every other builder's own amount
// pickers already use (see SideBuilder's own AMOUNT_PICKER_VALUES) --
// interpreted here as "how many of the record's own servings did you have,"
// not a raw ingredient quantity.
const SHARE_PICKER_VALUES = ['1/8', '1/4', '1/3', '1/2', '2/3', '3/4', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const CATEGORY_META: { type: MealComponentType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'side', label: 'Side', icon: 'fast-food-outline' },
  { type: 'salad', label: 'Salad', icon: 'leaf-outline' },
  { type: 'smoothie', label: 'Smoothie', icon: 'wine-outline' },
  { type: 'fermentation', label: 'Fermentation', icon: 'flask-outline' },
  { type: 'beverage', label: 'Beverage', icon: 'cafe-outline' },
  { type: 'snack', label: 'Snack', icon: 'nutrition-outline' },
  { type: 'bakedGoods', label: 'Baked Goods', icon: 'pizza-outline' },
  { type: 'soup', label: 'Soup', icon: 'flame-outline' },
  { type: 'sauce', label: 'Sauce', icon: 'water-outline' },
];

// meals.eaten_at's own stored format ('YYYY-MM-DDTHH:mm', local time,
// truncated to the minute -- see listMealsForDate's own comment in
// lib/db.ts). new Date().toISOString() would be UTC with seconds/
// milliseconds and a trailing 'Z', silently breaking the substr(eaten_at,
// 1, 10) date matching every other Insights/Trends/Home lens already relies
// on.
function nowLocalDateTimeString(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// One selected component, as this builder tracks it on screen -- carries
// its own display name/servings alongside the bare componentType/
// componentId/yourSharePercent MealComponentSelection needs, so the "Your
// Meal" summary card never has to re-fetch anything just to render a row.
// `key` is unique per SELECTION, not per record -- the same saved side can
// genuinely be added to one meal twice (e.g. two small servings logged
// separately rather than one larger one).
type SelectedComponent = {
  key: string;
  componentType: MealComponentType;
  componentId: string;
  name: string;
  servings: number;
  yourSharePercent: number;
};

function toSelection(component: SelectedComponent): MealComponentSelection {
  return { componentType: component.componentType, componentId: component.componentId, yourSharePercent: component.yourSharePercent };
}

export function MealBuilder({
  tabColor,
  // Set when reached via Schedule's/Home's "Log now" action (see
  // app/(tabs)/food.tsx's own scheduleItemId handling) -- 2026-08-02. On
  // finish, links the new meal back to that scheduled occurrence
  // (markScheduledMealLogged) and returns to wherever Log Now was tapped
  // from, instead of resetting to a blank meal the way a fresh visit does.
  scheduleItemId,
  // The scheduled occurrence's own meal type/title, prefilled straight into
  // the identity step -- and, when set, skipping that step's own Continue
  // gate entirely (see identityConfirmed's own initializer below), since
  // both are already known and re-asking them would just be friction on
  // top of what Log Now is supposed to be a shortcut past.
  initialMealType,
  initialTitle,
  // The scheduled occurrence's own sourceMealId, if any -- when that meal
  // was itself built by Meal Builder (has real meal_components rows), its
  // component selections are loaded back in below so "Log now" resumes
  // with the same sides/salads/etc already chosen rather than an empty
  // meal. A meal with no meal_components (built by the old, deleted
  // builder, or never built via Meal Builder at all) simply leaves
  // `components` empty -- still lets the person log something real today,
  // just not a literal replay of that older meal's own flattened
  // ingredients, which would need a whole separate read-only rendering
  // path for an increasingly rare, legacy case.
  templateMealId,
}: {
  tabColor: string;
  scheduleItemId?: string;
  initialMealType?: string;
  initialTitle?: string;
  templateMealId?: string;
}) {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const activeField = useActiveField();
  const { forceClear } = useActiveInputControls();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  // Same navigation-isn't-a-real-blur fix every other Food builder already
  // needs -- see SideBuilder's own dismissKeyboard comment for why this
  // pair of calls (not just activeField?.blur()) is required.
  function dismissKeyboard() {
    activeField?.blur();
    forceClear();
  }

  const [mealName, setMealName] = useState(initialTitle ?? '');
  const [mealType, setMealType] = useState<string | null>(initialMealType || null);
  // Reached via Log Now already knows both of the above -- skips straight
  // to assembling instead of showing an identity form for information
  // that's already settled.
  const [identityConfirmed, setIdentityConfirmed] = useState(!!scheduleItemId);
  const identityReady = !!mealType;

  const [components, setComponents] = useState<SelectedComponent[]>([]);

  useEffect(() => {
    if (!templateMealId) return;
    let isCurrent = true;
    (async () => {
      const records = await getMealComponents(templateMealId);
      const resolved: SelectedComponent[] = [];
      for (const record of records) {
        const detail = await getMealComponentDisplayInfo(record.componentType, record.componentId);
        // A component whose own saved record has since been deleted is
        // silently dropped here rather than shown as a broken row -- the
        // person can always re-add whatever they actually still want.
        if (!detail) continue;
        resolved.push({
          key: record.id,
          componentType: record.componentType,
          componentId: record.componentId,
          name: detail.name,
          servings: detail.servings,
          yourSharePercent: record.yourSharePercent,
        });
      }
      if (isCurrent) setComponents(resolved);
    })();
    return () => {
      isCurrent = false;
    };
  }, [templateMealId]);

  // null: showing the "Add from..." grid. Set: showing that one category's
  // own saved-items list.
  const [browsingCategory, setBrowsingCategory] = useState<MealComponentType | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<MealComponentOption[]>([]);
  const [categoryOptionsLoading, setCategoryOptionsLoading] = useState(false);

  function openCategory(type: MealComponentType) {
    dismissKeyboard();
    setBrowsingCategory(type);
    setCategoryOptionsLoading(true);
    listMealComponentOptions(type).then((options) => {
      setCategoryOptions(options);
      setCategoryOptionsLoading(false);
    });
  }

  function closeCategory() {
    setBrowsingCategory(null);
    setCategoryOptions([]);
  }

  // A saved item tapped from categoryOptions, awaiting its own "how much of
  // this did you have" answer before it actually joins `components`.
  const [pendingSelection, setPendingSelection] = useState<{
    componentType: MealComponentType;
    componentId: string;
    name: string;
    servings: number;
  } | null>(null);
  const [pendingAmount, setPendingAmount] = useState<string | null>(null);

  function selectSavedOption(option: MealComponentOption) {
    if (!browsingCategory) return;
    setPendingSelection({ componentType: browsingCategory, componentId: option.id, name: option.name, servings: option.servings });
    setPendingAmount(null);
  }

  function cancelPendingSelection() {
    setPendingSelection(null);
    setPendingAmount(null);
  }

  function confirmPendingSelection() {
    if (!pendingSelection || !pendingAmount) {
      showInfoAlert('Almost there', 'Please choose how much of this you had.');
      return;
    }
    const chosenServings = parseAmountValue(pendingAmount);
    const sharePercent = pendingSelection.servings > 0 ? (chosenServings / pendingSelection.servings) * 100 : 100;
    const newComponent: SelectedComponent = {
      key: `${pendingSelection.componentType}_${pendingSelection.componentId}_${Date.now()}`,
      componentType: pendingSelection.componentType,
      componentId: pendingSelection.componentId,
      name: pendingSelection.name,
      servings: pendingSelection.servings,
      yourSharePercent: sharePercent,
    };
    setComponents((current) => [...current, newComponent]);
    setPendingSelection(null);
    setPendingAmount(null);
    // Stays on the same category's saved list, deliberately -- a meal very
    // often draws more than one item from the same builder (two sides,
    // say), so bouncing all the way back to the full "Add from..." grid
    // after every single add would be real, needless friction. The < back
    // arrow (closeCategory) is still one tap away whenever a different
    // category is actually needed next.
  }

  function removeComponent(key: string) {
    Alert.alert('Remove this item?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setComponents((current) => current.filter((c) => c.key !== key)) },
    ]);
  }

  const [saving, setSaving] = useState(false);

  async function logMealNow() {
    setSaving(true);
    const result = await createMealFromComponents({
      name: mealName.trim() || 'Meal',
      mealType: mealType!,
      eatenAt: nowLocalDateTimeString(),
      isImmediate: true,
      components: components.map(toSelection),
    });
    setSaving(false);
    if ('error' in result) {
      showInfoAlert('Save failed', result.error);
      return;
    }
    if (scheduleItemId) {
      await markScheduledMealLogged(scheduleItemId, result.id);
      router.back();
      return;
    }
    const finishedName = mealName.trim() || 'Meal';
    setComponents([]);
    setMealName('');
    setMealType(null);
    setIdentityConfirmed(false);
    showInfoAlert('Meal logged', `${finishedName} is logged. Starting a fresh meal now.`);
  }

  // Pools the raw-goitrogenic-load check every sub-builder already runs on
  // its own ingredient list ACROSS every selected component -- two
  // separately-built sides can each be individually fine (one raw
  // goitrogenic vegetable apiece) while still combining into the same real
  // risk those builders already warn about on their own: easy to eat far
  // more of them raw and combined than any one builder's own ingredient
  // list would show. Same Cancel/"Continue anyway" Alert shape as Salad/
  // Smoothie's own confirmAndFinishX, not a silent pass-through.
  async function confirmAndLogMealNow() {
    if (components.length === 0) {
      showInfoAlert('Nothing to log yet', 'Add at least one item to this meal first.');
      return;
    }
    if (!mealType) {
      showInfoAlert('Almost there', 'Please choose a meal type.');
      return;
    }
    dismissKeyboard();
    setSaving(true);
    const flagged = await getMealComponentsGoitrogenicFlags(components.map(toSelection));
    setSaving(false);
    if (flagged.length >= 2) {
      Alert.alert(
        'Several raw goitrogenic foods together',
        `This meal combines ${flagged.length} raw goitrogenic foods (${flagged.join(', ')}) across its different parts. Eating this much of them raw at once is easy to do without realizing it when they're spread across separate sides/salads/etc. Consider cooking one first, or using less.`,
        [
          { text: 'Go back and adjust', style: 'cancel' },
          { text: 'Continue anyway', onPress: () => void logMealNow() },
        ],
      );
      return;
    }
    void logMealNow();
  }

  function handleContinuePress() {
    if (!mealType) {
      showInfoAlert('Almost there', 'Please choose a meal type.');
      return;
    }
    dismissKeyboard();
    setIdentityConfirmed(true);
  }

  // Identity step -- name (optional) + meal type (required), matching the
  // "required to Continue" bar SideBuilder's own dishName/servings already
  // set, minus Servings/Serving Size (a meal's own "how much" lives per
  // component instead, see pendingAmount above, not at the meal level).
  if (!identityConfirmed) {
    return (
      <>
        {infoAlertElement}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.formCard, { borderColor: tabColor }]}>
            <Text style={[styles.formLabel, { color: tabColor }]}>Meal Name (optional)</Text>
            <AppTextInput
              style={[styles.formInput, { backgroundColor: inputBackground(tabColor) }]}
              value={mealName}
              onChangeText={setMealName}
              placeholder="e.g. Sunday Dinner"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <Text style={[styles.formLabel, styles.formLabelSpaced, { color: tabColor }]}>Meal Type</Text>
            <View style={styles.pillWrap}>
              {mealTypes.map((type) => {
                const isSelected = type === mealType;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typePill,
                      { backgroundColor: isSelected ? tabColor : inputBackground(tabColor), borderColor: isSelected ? tabColor : colors.border },
                    ]}
                    onPress={() => setMealType(type)}
                  >
                    <Text style={[styles.typePillText, isSelected ? { color: colors.textOnPrimary } : null]}>
                      {type[0].toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: identityReady ? tabColor : colors.border }]}
              onPress={handleContinuePress}
            >
              <Text style={[styles.primaryButtonText, identityReady ? null : styles.primaryButtonTextMuted]}>Continue</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  }

  // A saved item was tapped -- ask how much of it before it joins the meal.
  if (pendingSelection) {
    return (
      <>
        {infoAlertElement}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.formCard, { borderColor: tabColor }]}>
            <Text style={styles.pendingName}>{pendingSelection.name}</Text>
            <Text style={styles.pendingSubtitle}>
              Makes {pendingSelection.servings} serving{pendingSelection.servings === 1 ? '' : 's'}
            </Text>
            <Text style={[styles.formLabel, styles.formLabelSpaced, { color: tabColor }]}>How much did you have?</Text>
            <PopoverSelect options={SHARE_PICKER_VALUES} selected={pendingAmount} onSelect={setPendingAmount} tabColor={tabColor} minWidth={80} />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={cancelPendingSelection}>
                <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tabColor, flex: 1, marginTop: 0 }]} onPress={confirmPendingSelection}>
                <Text style={styles.primaryButtonText}>Add to Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </>
    );
  }

  // Browsing one category's own saved items.
  if (browsingCategory) {
    const meta = CATEGORY_META.find((entry) => entry.type === browsingCategory)!;
    return (
      <>
        {infoAlertElement}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
          <TouchableOpacity style={styles.backRow} onPress={closeCategory}>
            <Ionicons name="chevron-back" size={18} color={tabColor} />
            <Text style={[styles.backRowText, { color: tabColor }]}>Add from...</Text>
          </TouchableOpacity>
          <Text style={[styles.sectionHeading, { color: tabColor }]}>Saved {meta.label}s</Text>
          {categoryOptionsLoading ? (
            <ActivityIndicator color={tabColor} style={styles.loadingSpinner} />
          ) : categoryOptions.length === 0 ? (
            <Text style={styles.emptyText}>
              {`No saved ${meta.label.toLowerCase()}s yet. Build one from the ${meta.label} Builder first, then come back here to add it.`}
            </Text>
          ) : (
            <View style={styles.savedList}>
              {categoryOptions.map((option) => (
                <TouchableOpacity key={option.id} style={styles.savedRow} onPress={() => selectSavedOption(option)}>
                  <View style={styles.savedRowText}>
                    <Text style={styles.savedRowName} numberOfLines={1}>
                      {option.name}
                    </Text>
                    <Text style={styles.savedRowDetail} numberOfLines={1}>
                      {option.ingredientNames || `${option.ingredientCount} ingredient${option.ingredientCount === 1 ? '' : 's'}`}
                    </Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color={tabColor} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </>
    );
  }

  // Assembling -- the "Your Meal" summary plus the "Add from..." grid.
  return (
    <>
      {infoAlertElement}
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
        <View style={[styles.formCard, { borderColor: tabColor }]}>
          <Text style={[styles.mealTitle, { color: tabColor }]} numberOfLines={2}>
            {mealName.trim() || 'Meal'}
          </Text>
          <Text style={styles.pendingSubtitle}>{mealType ? mealType[0].toUpperCase() + mealType.slice(1) : 'No meal type chosen'}</Text>
          {components.length === 0 ? (
            <Text style={[styles.emptyText, styles.formLabelSpaced]}>Nothing added yet -- pick a category below to add your first item.</Text>
          ) : (
            <View style={[styles.savedList, styles.formLabelSpaced]}>
              {components.map((component) => (
                <View key={component.key} style={styles.savedRow}>
                  <View style={styles.savedRowText}>
                    <Text style={styles.savedRowName} numberOfLines={1}>
                      {component.name}
                    </Text>
                    <Text style={styles.savedRowDetail}>{Math.round(component.yourSharePercent)}% of it</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeComponent(component.key)} hitSlop={8}>
                    <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.sectionHeading, styles.gridHeading, { color: tabColor }]}>Add from...</Text>
        <View style={styles.grid}>
          {CATEGORY_META.map((entry) => (
            <TouchableOpacity key={entry.type} style={styles.gridTile} onPress={() => openCategory(entry.type)}>
              <Ionicons name={entry.icon} size={26} color={tabColor} />
              <Text style={styles.gridTileLabel}>{entry.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {components.length > 0 && (
          <TouchableOpacity
            style={[styles.primaryButton, styles.logButton, { backgroundColor: tabColor, opacity: saving ? 0.6 : 1 }]}
            onPress={confirmAndLogMealNow}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.primaryButtonText}>Log This Now</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingTop: 5, gap: 10 },
  formCard: {
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: colors.surface,
    padding: 16,
  },
  formLabel: { ...typography.eyebrow },
  formLabelSpaced: { marginTop: 14 },
  formInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  typePill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  typePillText: { ...typography.body, color: colors.textPrimary },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnPrimary },
  primaryButtonTextMuted: { color: colors.textMuted },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  secondaryButtonText: { ...typography.bodyEmphasis },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  // colors.textSecondary, not tabColor -- matches SideBuilder's own
  // pendingHeader exactly (both name a saved item that's about to be
  // added, i.e. this card's own CONTENT, not the meal's own identity the
  // way mealTitle/formLabel are -- tabColor is reserved for the form's own
  // labels/controls, per that file's own comment on pendingHeader).
  pendingName: { ...typography.bodyEmphasis, fontSize: 17, color: colors.textSecondary },
  pendingSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  // tabColor applied inline at its one call site -- matches SideBuilder's
  // own overviewDishName, the same "this card's own name is the form's
  // subject" role mealTitle plays here.
  mealTitle: { ...typography.bodyEmphasis, fontSize: 18 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 4 },
  backRowText: { ...typography.bodyEmphasis },
  // tabColor applied inline at both call sites -- matches SideBuilder's own
  // "Ingredients" heading (also typography.eyebrow), which gets the same
  // treatment despite being a section heading rather than a single-field
  // label.
  sectionHeading: { ...typography.eyebrow },
  gridHeading: { marginTop: 6 },
  loadingSpinner: { marginTop: 20 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  savedList: { gap: 8 },
  // A bordered box per row (not SideBuilder's own plain bottom-border list
  // row) -- deliberately closer to app/food-items.tsx's own itemRow in
  // spirit but boxed, since each row here is a distinct tappable saved
  // record, not a passive divided list. Stays plain colors.border, not
  // tabColor -- consistent with itemRow's own choice, and with formCard
  // being the one element per step that gets the tabColor-border
  // treatment, not every box on the page.
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  savedRowText: { flex: 1 },
  // colors.textPrimary, matching SideBuilder's own overviewIngredientText --
  // a plain saved-item name in a list, not the form's own identity.
  savedRowName: { ...typography.bodyEmphasis, color: colors.textPrimary },
  savedRowDetail: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  // Same colors.border/colors.surface reasoning as savedRow above -- a grid
  // tile is a passive-until-tapped chrome box, not the step's own formCard.
  gridTile: {
    width: '31%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  gridTileLabel: { ...typography.caption, textAlign: 'center', color: colors.textPrimary },
  logButton: { marginTop: 4 },
});
