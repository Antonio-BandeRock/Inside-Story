import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { KEYBOARD_HEIGHT } from '../constants/appKeyboard';
import { BUTTON_SHADOW, colors, inputBackground } from '../constants/colors';
import { SNACK_BUILDER_CATEGORIES } from '../constants/foodBuilderCategories';
import { NAVIGATION_HAND, useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import {
  getBuilderFavorite,
  getConditionNotesForIngredients,
  getCuratedRecipe,
  getFoodIdentity,
  getFoodScores,
  getNutritionHighlightsForIngredients,
  getSnack,
  getSnackIngredients,
  getStoredMeasurementSystem,
  getConditionStages,
  getUserConditions,
  listAllConditions,
  saveBuilderFavorite,
  saveSnack,
  updateSnack,
  type ComponentConditionNote,
  type ComponentNutritionHighlight,
  type FoodScore,
  type MealIngredientInput,
  type SnackIngredientInput,
} from '../lib/db';
import { getConditionStageAdvisory } from '../lib/conditionStageAdvisory';
import { markPendingFoodTrialReturn } from '../lib/pendingFoodTrialReturn';
import { isFlaggedTier } from '../lib/sixDimensionsReference';
import { GeneralHealthAdvisories } from './GeneralHealthAdvisories';
import { detectMeasurementSystemFromLocale, parseAmountValue, type MeasurementSystem } from '../lib/measurement';
import { useActiveField, useActiveInputControls } from './ActiveInputContext';
import { AppActionSheet } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { CollapsibleOverlayCard } from './CollapsibleOverlayCard';
import { DimensionFlags } from './DimensionFlags';
import { SourceFallbackNote } from './SourceFallbackNote';
import { FoodLookup, type ResolvedFoodSelection } from './FoodLookup';
import { useConfirmSheet } from './ConfirmSheet';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import { StepsEditor } from './StepsEditor';
import { VoiceInputButton } from './VoiceInputButton';

// Common home-cooking units -- a plain pill row, not InlineSelectList's own
// scrollable-box treatment, since this is a short, fixed set (unlike
// Category/Food's own long, searchable lists) -- the same "pillRow/pill"
// pattern already used for Schedule's own small fixed choices.
//
// 2026-07-28: split by measurement system rather than shown all mixed
// together (the original list put g/oz/lb/cup/tbsp/tsp/ml/piece in one
// row) -- g/ml are metric-only, oz/lb are imperial-only, and mixing both
// systems in one picker doesn't match how the rest of the app treats this
// (see lib/measurement.ts's own MeasurementSystem, already used for
// Profile's height entry: one stored preference, not a per-field mix).
// cup/tbsp/tsp/piece stay common to both -- their real-world metric vs.
// imperial volumes technically differ (a "cup" is 250mL metric vs.
// ~237mL US customary), but home cooking treats them as the same everyday
// unit regardless of system, unlike g/oz or ml/lb which are genuinely
// different measurements for the same quantity.
const METRIC_ONLY_UNITS = ['g', 'ml'];
const IMPERIAL_ONLY_UNITS = ['oz', 'lb'];
const COMMON_UNITS = ['cup', 'tbsp', 'tsp', 'piece'];

function unitsForSystem(system: MeasurementSystem): string[] {
  return system === 'imperial' ? [...IMPERIAL_ONLY_UNITS, ...COMMON_UNITS] : [...METRIC_ONLY_UNITS, ...COMMON_UNITS];
}

// Standard "minor words stay lowercase" title-case list -- articles,
// coordinating conjunctions, and short prepositions, the same set style
// guides use for book/recipe titles. "it" is included per explicit request
// even though it's not a conventional minor word (a pronoun, not an
// article/conjunction/preposition) -- included anyway since it was named
// directly, alongside the others it's "words like" this list generalizes
// from. Always capitalized as the FIRST word of the name regardless (see
// titleCaseSnackName below), matching standard title-case convention.
const SNACK_NAME_MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'if', 'in', 'into',
  'it', 'nor', 'of', 'on', 'onto', 'or', 'over', 'per', 'so', 'the', 'to',
  'up', 'via', 'vs', 'with', 'yet',
]);

// Applied live on every keystroke (2026-07-30), not just on blur -- safe to
// do per-character since a case-only transform never changes the string's
// length, so the cursor position AppTextInput tracks never needs
// remapping. Only touches letter runs (the regex below); numbers, spaces,
// hyphens, and punctuation pass through untouched, so a hyphenated word
// ("Low-Sodium") still gets each half capitalized independently rather
// than being treated as one long word. A genuine all-caps run (2+ letters,
// e.g. "BBQ" typed via the keyboard's Shift key) is left exactly as typed
// rather than forced down to "Bbq" -- title-casing an acronym would be
// actively wrong, not just a style choice.
function titleCaseSnackName(text: string): string {
  let isFirstWord = true;
  return text.replace(/[A-Za-z']+/g, (word) => {
    const first = isFirstWord;
    isFirstWord = false;
    if (word.length > 1 && word === word.toUpperCase()) return word;
    const lower = word.toLowerCase();
    if (!first && SNACK_NAME_MINOR_WORDS.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
}

// Common cooking amounts as pills, 2026-07-28 -- replaces a typed
// number-pad/decimal-pad AppTextInput entirely, for Servings/Serving Size
// Amount/per-ingredient Quantity alike: explicitly requested so entering a
// number never needs the keyboard (or its own cursor-placement quirks) at
// all. Fractions instead of decimals, matching how home cooking actually
// talks about amounts ("a quarter cup," not "0.25 cup"). Shared between
// Serving Size Amount and Quantity, which both pair with a unit picker the
// same way; Servings gets its own whole-numbers-only list just below,
// since it's a plain headcount, never a fractional measurement.
const AMOUNT_PICKER_VALUES = ['1/8', '1/4', '1/3', '1/2', '2/3', '3/4', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const SERVINGS_PICKER_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

// Reverses parseAmountValue for a saved snack being reopened for editing --
// the database only stores the resolved decimal (e.g. 0.5), not which pill
// ("1/2") produced it. Matches back to the closest real pill string within
// this list so the picker shows a real, previously-tappable value rather
// than a decimal that was never one of its own options; falls back to a
// plain trimmed decimal only for an amount that never came from this list
// in the first place (shouldn't happen for anything SnackBuilder itself
// saved, but a defensive fallback rather than a silent wrong value).
function formatAmountForPicker(value: number, options: string[]): string {
  let closest: string | null = null;
  let closestDiff = Infinity;
  for (const option of options) {
    const diff = Math.abs(parseAmountValue(option) - value);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = option;
    }
  }
  if (closest !== null && closestDiff < 0.001) return closest;
  return String(value);
}

// Asked per INGREDIENT, not once for the whole snack, 2026-07-29 -- a real
// snack routinely combines ingredients that were each prepared
// completely differently (garlic added raw as a topping after the rest of
// the snack is cooked; bacon pan-fried into bits in its own separate step
// before joining sautéed beans), and cooking method genuinely changes
// nutrition (raw vs. cooked retains different nutrients), so a single
// snack-wide answer was actively wrong for any snack like that, not just
// imprecise. Required, not optional the way Snack Name is, for the same
// nutrition reason.
//
// 'Pan-Fried' and 'Deep-Fried' are kept as two separate options, not one
// generic 'Fried', 2026-07-29 -- explicitly flagged as nutritionally
// meaningfully different for a Hashimoto's person, not just a wording
// preference: deep-frying means the food is submerged in a much larger,
// hotter, typically-reused oil bath, with far greater oil absorption and
// more oil-oxidation/degradation byproducts than shallow pan-frying --
// exactly the real distinction this app's own D3 Oxidation Risk and Fat
// Processing sub-criteria are built to care about (see ClaudeWork's
// score_food_tiers_v3_reconstructed.py). 'Sautéed' and 'Stir-fried' stay
// their own separate options too (both already distinct real techniques,
// not folded into either fried option).
// "Raw" rather than "Raw / no-cook" (2026-07-31) -- same width reasoning as
// CUT_PREP_METHODS' own "Whole" note below: the field is labeled "Cook
// Prep", so "Raw" already means "not cooked", and the longer form was
// setting this whole column's width single-handedly.
//
// "N/A" added 2026-08-01, a REAL option (not PopoverSelect's own "—"
// not-yet-chosen placeholder, which only ever shows on the closed field
// itself before anything is picked -- see that file's own comment) -- for
// foods where the question itself doesn't apply, e.g. olive oil has no
// meaningful cook-prep state to dial in. Leads the list, so it's the first
// real answer offered -- same reasoning as "Raw" leading the rest: a
// deliberate real answer, not an absent one.
const COOKING_METHODS = [
  'N/A', 'Raw', 'Sautéed', 'Pan-Fried', 'Deep-Fried', 'Steamed', 'Boiled', 'Baked', 'Roasted', 'Grilled', 'Stir-fried',
];

// How the ingredient is physically cut/broken down BEFORE any cooking --
// 2026-07-31, a new field asked for alongside the Cook Prep rename. This is
// a genuinely different axis from cooking method: the same food can be
// diced and sautéed, or minced and left raw, and the two choices don't
// constrain each other.
//
// It matters nutritionally, not just for recipe fidelity, which is why it
// earns a structured field rather than living in the free-text note.
// Cutting ruptures cell walls and exposes interior surface to oxygen: the
// finer the cut, the faster oxidation and the greater the loss of
// air/light-sensitive nutrients (vitamin C, folate) before the food is
// even eaten. It also drives the app's own D-dimension concerns directly --
// crushing/mincing alliums (garlic, onion) activates alliinase and forms
// the sulfur compounds those foods are valued for, while finely shredding
// raw cruciferous vegetables increases the myrosinase-driven goitrogen
// release this app already tracks for thyroid interference.
//
// "Whole / no cut" leads deliberately, mirroring COOKING_METHODS' own
// "Raw / no-cook" first entry -- a real answer, not an absent one.
// "Whole" rather than "Whole / no cut" (2026-07-31): inside a field already
// labeled "Cut Prep" the shorter form is just as clear, and since every pill
// in a group renders at the widest pill's width, one long option widens the
// entire column. Trimming it is what lets all four fields sit side by side
// on a normal phone -- measured, not assumed: "Whole / no cut" alone forced
// this column to 112px, against 79px for the longest real cut term.
// "N/A" added 2026-08-01, same real-option reasoning as COOKING_METHODS'
// own note above -- olive oil, for instance, has no meaningful cut-prep
// state at all.
const CUT_PREP_METHODS = [
  'N/A', 'Whole', 'Halved', 'Quartered', 'Sliced', 'Diced', 'Cubed', 'Chopped', 'Minced',
  'Grated', 'Shredded', 'Julienned', 'Crushed', 'Smashed', 'Muddled', 'Mashed', 'Pureed', 'Torn',
];

// Checked after cooking method is confirmed, 2026-07-28 -- forgetting to
// log cooking oil/fat or seasoning is one of the most common silent-error
// sources in food tracking (it's easy to remember the vegetables and
// forget the tablespoon of olive oil they were cooked in). category values
// match the real reference database (assets/data/foods_reference.db) --
// confirmed both 'Fats' (olive oil, butter, other cooking fats) and
// 'Herbs' (herbs, spices, vinegars, seasoning mixes) exist there and hold
// what this label implies, rather than assuming.
const EXTRAS_TO_CHECK: { category: string; label: string }[] = [
  { category: 'Fats', label: 'cooking oil or fat' },
  { category: 'Herbs', label: 'seasoning' },
];

type SnackIngredient = {
  resolved: ResolvedFoodSelection;
  quantity: string;
  unit: string;
  // How THIS ingredient will be prepared for THIS snack -- see
  // COOKING_METHODS' own comment for why this moved from a single
  // snack-wide question to a per-ingredient one. cookingMethod is required
  // (same nutrition reasoning as before); prepNote is optional free text
  // for cut/technique detail (e.g. "chopped into 1-inch pieces," "peeled,
  // smashed, chopped, added on top after cooking") -- deliberately not a
  // structured field, since this app isn't a recipe-instruction builder
  // and forcing every possible prep technique into a rigid picker would
  // be over-engineering something a short free-text note already covers.
  cookingMethod: string;
  // How the food is cut/broken down before cooking -- see CUT_PREP_METHODS'
  // own comment for why this is a structured field of its own rather than
  // part of the free-text note.
  cutPrep: string;
  prepNote: string;
  // This food's own 6-Dimension scores, captured at add time from the
  // fetch the pending-ingredient card already performed (see
  // pendingScores) rather than re-queried per row when the list renders --
  // the data can't change between those two moments, so one fetch per
  // ingredient is enough. Drives the color-coded warning boxes in the
  // summary list (components/DimensionFlags.tsx).
  scores: FoodScore[];
};

// Every category this component itself needs a label for, spelled out
// once here -- FoodLookup.tsx's own categoryLabel() isn't exported (it's
// scoped to that file's own rendering), so the ingredient list below,
// which shows a resolved category label of its own, keeps a copy. Kept
// deliberately small and separate rather than exporting/sharing the
// original: this is read-only display text, not the query key FoodLookup
// itself depends on getting exactly right.
function foodSummary(resolved: ResolvedFoodSelection): string {
  return resolved.prepMethod ? `${resolved.baseName} (${resolved.prepMethod})` : resolved.baseName;
}

// A recipe-card-style ingredient line for the final review screen, e.g.
// "2 cups broccoli florets (diced, steamed)" -- 2026-08-17, matching
// RecipeCardDetail's own bullet phrasing in app/(tabs)/purple-digest.tsx,
// so a snack built here and one of the app's own curated Recipes read the
// same way once both land in front of a person.
function formatFinalIngredientText(ingredient: SnackIngredient): string {
  const details = [ingredient.cutPrep, ingredient.cookingMethod]
    .filter((value) => value && value !== 'N/A')
    .map((value) => value.toLowerCase());
  const base = `${ingredient.quantity} ${ingredient.unit} ${ingredient.resolved.baseName}`;
  return details.length > 0 ? `${base} (${details.join(', ')})` : base;
}

type LabeledPickerField = {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
};

// Reorders a row of labeled fields, 2026-08-01, explicitly requested so a
// person filling several of these in on the same row doesn't have to keep
// moving their thumb to wherever the next still-blank one happens to sit.
// As each field is filled in, it slides to the far end of the row -- away
// from wherever NAVIGATION_HAND says the person's thumb naturally rests --
// so whatever's still blank stays clustered at the near side. Once every
// field in the row has a value, the whole row snaps back to its original,
// declared order (there's nothing left to reach for at that point, so the
// original left-to-right reading order is the more useful one again).
//
// A custom hook, not a plain function, because it needs its own per-row
// memory of WHICH ORDER fields were actually completed in (a person might
// fill Cook Prep before Quantity) -- a plain ref, mutated directly during
// render rather than via a separate effect+state round trip, so the
// reordered result is available in the SAME render the completing value
// change already caused, with no extra render cycle for Reanimated's own
// layout transition (see the two call sites below) to key off. Idempotent
// by construction (the `includes` guard below), so this is safe even
// under React StrictMode's dev-only double-render.
function useReorderedLabeledFields(fields: LabeledPickerField[]): LabeledPickerField[] {
  const completionOrderRef = useRef<string[]>([]);

  // Appends any field that's newly selected since the last render: never
  // reorders an already-completed field just because its VALUE changed to
  // a different option, only the null -> non-null transition counts.
  for (const field of fields) {
    if (field.selected !== null && !completionOrderRef.current.includes(field.label)) {
      completionOrderRef.current.push(field.label);
    }
  }
  // Drops anything that's been cleared back to null since (e.g. the Save
  // buttons resetting the whole form) -- otherwise a stale label would
  // keep claiming a spot in the completed group after its own field went
  // blank again.
  completionOrderRef.current = completionOrderRef.current.filter((label) =>
    fields.some((field) => field.label === label && field.selected !== null),
  );

  if (fields.every((field) => field.selected !== null)) {
    return fields;
  }

  const notYetSelected = fields.filter((field) => field.selected === null);
  const selectedInCompletionOrder = completionOrderRef.current
    .map((label) => fields.find((field) => field.label === label))
    .filter((field): field is LabeledPickerField => field !== undefined);

  // Left hand rests toward the left edge (see NAVIGATION_HAND's own
  // comment), so completed fields move OUT toward the right, keeping
  // still-blank ones on the left, closer to the thumb -- and the reverse
  // for right-handed nav.
  return NAVIGATION_HAND === 'left'
    ? [...notYetSelected, ...selectedInCompletionOrder]
    : [...selectedInCompletionOrder, ...notYetSelected];
}

// The small "‹ Cancel" link's own real height, shown above the connected
// FoodLookup once a real ingredient-source method has been chosen (see the
// connected-picker branch below) -- passed to FoodLookup as `topReserve`
// so its own internal list-height math correctly accounts for the real
// space this link already takes above it, the same real reasoning the old,
// much taller SUMMARY_CARD_HEIGHT constant existed for. Estimated, not
// measured, the same way every other fixed size in this app's own
// FoodLookup.tsx already is (SUMMARY_ROW_HEIGHT/TITLE_HEIGHT there).
//
// 2026-08-17: this whole redesign is the direct fix for a real, reported
// bug ("Select a Food Category is scrollable but it extends below the
// footer and you can never reach the bottom of that list to see anything
// past Mushrooms") -- the old always-visible two-column summary card sat
// directly above FoodLookup here, reserving a much larger real height
// (SUMMARY_CARD_HEIGHT, since removed) that FoodLookup's own list-height
// math never actually saw correctly accounted for once the summary card
// itself grew past a couple of ingredients. Collapsing that card away
// entirely (see CollapsibleOverlayCard.tsx) behind this one small link
// frees up substantially more real screen space for the list itself.
const SOURCE_CANCEL_ROW_HEIGHT = 40;

// Builds a single snack from one or more ingredients -- Category ->
// Type (if needed) -> Food -> Prep (if needed) -> Quantity/Unit per
// ingredient, reusing FoodLookup for the selection step but with its own
// nutrient table turned off (showNutrients={false}): that information is
// already available on Insights' own Food Lookup lens, and isn't this
// screen's job to duplicate. Servings/Serving Size are asked for once, up
// front, before any ingredient picking starts.
//
// The in-progress snack (snackName/servings/ingredients/etc.) is local
// component state only, same as before -- a snack isn't a real, saved
// record until Save & Finish Snack actually commits it (see finishSnack/
// saveSnack in lib/db.ts, 2026-08-01). Navigating away from a snack mid-
// build still loses it; that's still a known, accepted gap, just a
// narrower one now that finishing a snack for real is possible.
//
// 2026-07-28: every AppTextInput here previews a new app-wide input-box
// treatment (background = constants/colors.ts's own `inputBackground`,
// a lighter tint of this page's own tabColor) -- entry boxes had no visual
// distinction from plain read-only text anywhere in the app before this.
// Deliberately landed here first, on this one screen, so the lightness/
// alpha recipe (both tunable in one place, `inputBackground`'s own
// constants) can be reviewed and adjusted before rolling it out to every
// other AppTextInput call site.
//
// 2026-07-28, a second pass: this screen's own in-page title bar
// ("Snack Builder") was removed -- PageIdentityLabel's own bottom-
// corner box already names whichever builder is open, so repeating it
// here was pure duplication eating screen space for nothing. In its
// place, once Snack Name/Servings/Size is confirmed, that form splits into
// a compact two-column summary card (snack info on the left, a scrollable
// ingredient list on the right) that then connects directly (flush, square
// corners at the seam) to FoodLookup's own Category/Food picker below it
// -- the picker shows automatically the instant there's no ingredient
// currently pending confirmation, rather than needing an explicit "+ Add
// Ingredient" tap first the way this used to work.

// Created 2026-08-02 by directly adapting SideBuilder.tsx (the Food tab's
// first fully-built builder and the proven, on-device-tested pattern every
// builder is meant to follow -- see CLAUDE.md's Food tab section), same base
// Fermentation/Beverage Builder used -- neither Salad's nor Smoothie's own
// raw-goitrogenic-load warning applies to a snack (that concern is
// specifically about mixing/blending several raw cruciferous vegetables at
// once, not this builder's own documented "lighter-weight than a full meal
// or side" scope). The comments below that carry earlier 2026-07-xx dates
// describe reasoning SideBuilder itself arrived at through real iteration --
// inherited here as still-accurate design reasoning, not a claim that
// SnackBuilder went through that same history itself.
//
// Unlike Beverage Builder, the "no cooking oil/fat or seasoning logged yet"
// soft nudge (EXTRAS_TO_CHECK) is kept here, unchanged from Side Builder's
// own original list -- a real snack (spiced nuts, oil-popped popcorn) can
// genuinely involve either, unlike a beverage.
export function SnackBuilder({
  tabColor,
  // Set when reached via the Edit button on an already-saved snack (see
  // app/food-items.tsx) -- 2026-08-01. Loads that snack's real data into
  // this same builder rather than a separate edit screen, so add/remove-
  // ingredient/Cut Prep/Cook Prep all reuse the exact same, already-tested
  // machinery a fresh snack already uses. finishSnack below branches on this
  // to call updateSnack (in place) instead of saveSnack (a new row), and to
  // navigate back to the list afterward instead of resetting to blank --
  // "I fixed this snack" should return you to where you came from, not
  // drop you into building a different one.
  editSnackId,
  // Set when reached via "Use this Favorite" (see app/food-items.tsx) --
  // 2026-08-08. Same shape as editSnackId's own prefill just below, except
  // this never marks anything as an edit -- finishSnack always creates a
  // genuinely NEW snack from a favorite.
  fromFavoriteId,
  // Set when reached via a "Build This Recipe" button on a Digest
  // recipe entry, 2026-08-14 -- see SideBuilder.tsx's own identical
  // openRecipeId for the full reasoning.
  openRecipeId,
}: {
  tabColor: string;
  editSnackId?: string;
  fromFavoriteId?: string;
  openRecipeId?: string;
}) {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const activeField = useActiveField();
  // Extra bottom padding while the custom keyboard is up, 2026-07-28 --
  // AppKeyboard is a floating overlay, not RN's own system keyboard, so
  // there's no automatic "shrink the scrollable area" the way a real
  // keyboard gets from KeyboardAvoidingView. Without this, the ScrollView's
  // own max scroll extent stops short of accounting for the space
  // AppKeyboard covers, so content near the bottom (e.g. the Quantity
  // field itself, or Change Food/Add to Snack below it) could end up stuck
  // behind the keyboard with no way to scroll it into view. Same
  // `activeField ? KEYBOARD_HEIGHT : 0` pattern FoodLookup.tsx/Dropdown.tsx
  // already use for their own keyboard-aware sizing.
  const keyboardReserve = activeField ? KEYBOARD_HEIGHT : 0;
  const { forceClear } = useActiveInputControls();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  // Same resolution order as profile.tsx's own measurementSystem: the
  // person's own stored preference if they've ever set one, otherwise a
  // locale-based guess -- one shared notion of metric vs. imperial, not a
  // separate setting invented just for this screen. 'metric' is only a
  // placeholder until the real value loads.
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>('metric');
  // Memoized (2026-07-31) so its identity is stable between renders. Without
  // this it was a fresh array on every keystroke, which defeated the Units
  // field's own memo and made it re-render every time a character was typed
  // into Prep Notes.
  const unitOptions = useMemo(() => unitsForSystem(measurementSystem), [measurementSystem]);

  // Required to Continue, 2026-07-28 (reversed the same day from an
  // earlier "optional" decision, explicitly requested) -- see
  // handleContinuePress's own comment for the full validation order. Still
  // falls back to a plain "Snack" in the summary/ingredient views
  // (snackName.trim() || 'Snack') as a harmless extra safety net, even
  // though Continue itself should never actually let a blank one through
  // now.
  const [snackName, setSnackName] = useState('');
  // A stable function identity, 2026-07-30 -- a fresh inline arrow function
  // here (`(text) => setSnackName(titleCaseSnackName(text))`, passed directly
  // as onChangeText) gets recreated on every render, and AppTextInput's own
  // useEffect (the one that calls focusField for AppKeyboard) depends on
  // onChangeText by reference -- a changing dependency on every render
  // re-fires that effect every render, which itself triggers a state update
  // (focusField), causing another render, in an infinite loop ("Maximum
  // update depth exceeded", reported 2026-07-30). useCallback with an empty
  // dependency array keeps this one function reference stable across
  // renders (titleCaseSnackName is a plain module-level function, setSnackName
  // is already a stable state setter), breaking the loop.
  const handleSnackNameChange = useCallback((text: string) => {
    setSnackName(titleCaseSnackName(text));
  }, []);
  // No defaults, 2026-07-28 -- these started at a pre-selected "1" pill
  // originally, but that meant nothing actually required the person to
  // touch either field at all, and tapping the ALREADY-selected "1" pill
  // again does nothing (no visible change to confirm a real choice was
  // made). Explicitly corrected: every field in this whole form -- Snack
  // Name aside, which is genuinely optional -- now starts unchosen, and
  // Continue below stays disabled until all three (Servings/Size/Units)
  // are actually picked.
  const [servings, setServings] = useState<string | null>(null);
  const [servingSizeAmount, setServingSizeAmount] = useState<string | null>(null);
  const [servingSizeUnit, setServingSizeUnit] = useState<string | null>(null);
  // Drives the Continue button's own color (see its own JSX comment
  // below) -- true only once Snack Name and all three pickers are actually
  // filled in/chosen.
  const snackFormReady = !!snackName.trim() && !!servings && !!servingSizeAmount && !!servingSizeUnit;
  // Servings/Serving Size collapse to the summary card once confirmed --
  // asked for "at the beginning," not something that needs to stay an
  // open form the whole time after.
  const [servingsConfirmed, setServingsConfirmed] = useState(false);
  // 2026-08-08 -- independent of the real save; see SideBuilder.tsx's own
  // identical field for the full reasoning.
  const [alsoSaveAsFavorite, setAlsoSaveAsFavorite] = useState(!!fromFavoriteId);

  // Real ingredient-source chooser, 2026-08-17 (points 3/5 of that day's
  // redesign: "a list appears for the user to choose where to get the
  // ingredient from... Say a Food Name with the microphone, My Food
  // Products, and Whole Foods"). null means "nothing chosen yet, show the
  // Add Ingredients button"; a real value gates FoodLookup down to exactly
  // that one method via its own restrictToSource prop (see that file's own
  // comment for what each mode actually shows). sourceChooserVisible drives
  // the AppActionSheet itself, kept separate from ingredientSourceMode so
  // dismissing the sheet without picking anything (its own built-in
  // backdrop dismiss, or the explicit Cancel row) can't accidentally leave
  // a stale non-null mode behind.
  const [ingredientSourceMode, setIngredientSourceMode] = useState<'voice' | 'products' | 'category' | null>(null);
  const [sourceChooserVisible, setSourceChooserVisible] = useState(false);
  // Whether the collapsible snack/ingredients card (point 2) is currently
  // expanded into its own full overlay -- see CollapsibleOverlayCard.tsx's
  // own header comment for why this has to be real state the PARENT holds,
  // not something that component owns internally (it needs to collapse
  // from more than one real trigger: the card's own collapse button, and
  // "Done adding ingredients" inside it).
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Real, hand-authored prep steps, 2026-08-17 -- direct request: "the
  // steps are part of the build of the things made from the builder in the
  // area that explains the whole process of making whatever it might be."
  // Committed steps only (see renderStepsSection's own comment for the
  // whole add/edit/remove/complete flow) -- included in finishSnack's own
  // payload below the exact same way `ingredients` already is, whatever
  // this array happens to be at save time.
  // The composer/edit/complete mechanics that USED to live here directly
  // (addingStep/editingStepIndex/stepDraft/stepsComplete) moved into
  // StepsEditor.tsx itself, 2026-08-17, once a second, genuinely separate
  // use for the exact same shape showed up (per-ingredient Prep Steps,
  // see ingredientPrepSteps' own comment above) -- this screen now only
  // owns the real, committed list, the same real controlled shape both
  // StepsEditor instances below are handed.
  const [steps, setSteps] = useState<string[]>([]);

  const [ingredients, setIngredients] = useState<SnackIngredient[]>([]);
  const [pendingResolved, setPendingResolved] = useState<ResolvedFoodSelection | null>(null);
  // The pending food's own 6-Dimension scores, fetched as soon as it
  // resolves so the color-coded warning boxes appear BEFORE the person
  // commits to adding it -- explicitly requested 2026-07-31 ("there should
  // really be an indicator for the food prior to them even adding it").
  // Carried onto the SnackIngredient at add time rather than re-fetched
  // per row (see that type's own `scores` comment).
  const [pendingScores, setPendingScores] = useState<FoodScore[]>([]);
  // No defaults -- same reasoning as servings/servingSizeAmount/
  // servingSizeUnit above. "Add to Snack" below stays disabled until
  // quantity, unit, AND ingredientCookingMethod are all chosen.
  const [quantity, setQuantity] = useState<string | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
  // Per-ingredient cooking method/prep note, 2026-07-29 -- see
  // SnackIngredient's own comment for why this replaced a single
  // snack-wide question. Reset after each "Add to Snack," same as
  // quantity/unit above, ready for the next ingredient.
  const [ingredientCookingMethod, setIngredientCookingMethod] = useState<string | null>(null);
  const [ingredientCutPrep, setIngredientCutPrep] = useState<string | null>(null);
  // Real, hand-authored prep steps for THIS one ingredient, 2026-08-17 --
  // replaces the old single free-text "Prep Notes" field with the same
  // real add/edit/remove/complete StepsEditor the whole-snack Steps field
  // above uses (see steps' own comment) -- a genuinely different, second
  // real use for the identical shape, not a copy-pasted one.
  const [ingredientPrepSteps, setIngredientPrepSteps] = useState<string[]>([]);
  // Measured on-screen width of each field's own label text, keyed by
  // label. Feeds renderLabeledPicker's minWidth so a picker box is never
  // narrower than the word above it ("make the field as wide as the label
  // for it") -- measured rather than estimated from character count, since
  // the real rendered width depends on the font, and this app's own
  // typography scale is the single source of truth for that.
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});
  // Remembers whichever Category(+Type) the LAST resolved ingredient used,
  // 2026-07-28 -- seeds the connected picker's own initialCategory/
  // initialSubcategory below (see FoodLookup's own comment on those props)
  // so "Change Food" on an already-picked ingredient, and starting the
  // NEXT ingredient after "Add to Snack," both land back on that same
  // category instead of a blank Category list -- a snack very often
  // has several ingredients from the same category (several vegetables,
  // say), and re-picking "Vegetables" every single time was real,
  // needless friction. Blank until the first food ever resolves, so the
  // very first ingredient still starts at a genuinely blank Category list.
  const [lastCategory, setLastCategory] = useState('');
  const [lastSubcategory, setLastSubcategory] = useState<string | null>(null);

  // Loads an existing snack's real data in place of the blank-builder
  // defaults above, 2026-08-01 -- runs once per editSnackId. snack_ingredients
  // only stores foodId/source, quantity/unit, cutPrep/cookingMethod/
  // prepNote, and the descriptive foodName (not base_name/prep_method), so
  // each ingredient's ResolvedFoodSelection is reconstructed from the
  // reference database itself (getFoodIdentity) -- always authoritative,
  // the same row every score/nutrient lookup already reads. Scores are
  // re-fetched live (getFoodScores) rather than cached anywhere, same as a
  // freshly-added ingredient's own pendingScores.
  useEffect(() => {
    if (!editSnackId) return;
    let isCurrent = true;

    (async () => {
      const snack = await getSnack(editSnackId);
      if (!snack || !isCurrent) return;

      const details = await getSnackIngredients(editSnackId);
      const loaded: SnackIngredient[] = [];
      for (const detail of details) {
        if (!detail.foodId) continue;
        const [foodIdStr, source] = detail.foodId.split('|');
        const foodId = Number(foodIdStr);
        if (!source || Number.isNaN(foodId)) continue;

        const [identity, scores] = await Promise.all([getFoodIdentity(foodId, source), getFoodScores(foodId, source)]);
        loaded.push({
          resolved: {
            category: detail.category ?? identity?.category ?? '',
            subcategory: identity?.subcategory ?? null,
            baseName: identity?.baseName ?? detail.foodName,
            prepMethod: identity?.prepMethod ?? null,
            foodId,
            source,
          },
          quantity: formatAmountForPicker(detail.quantity, AMOUNT_PICKER_VALUES),
          unit: detail.unit,
          cookingMethod: detail.cookingMethod,
          cutPrep: detail.cutPrep,
          prepNote: detail.prepNote ?? '',
          scores,
        });
      }

      if (!isCurrent) return;
      setSnackName(snack.name);
      setServings(formatAmountForPicker(snack.servings, SERVINGS_PICKER_VALUES));
      setServingSizeAmount(formatAmountForPicker(snack.servingSizeAmount, AMOUNT_PICKER_VALUES));
      setServingSizeUnit(snack.servingSizeUnit);
      setServingsConfirmed(true);
      setIngredients(loaded);
    })();

    return () => {
      isCurrent = false;
    };
  }, [editSnackId]);

  // Same shape as editSnackId's own effect just above -- see
  // SideBuilder.tsx's own identical fromFavoriteId effect for the full
  // reasoning. Never sets editSnackId-equivalent state, so finishSnack
  // below always creates a new snack.
  useEffect(() => {
    if (!fromFavoriteId) return;
    let isCurrent = true;

    (async () => {
      const favorite = await getBuilderFavorite(fromFavoriteId);
      if (!favorite || !isCurrent) return;

      const loaded: SnackIngredient[] = [];
      for (const detail of favorite.ingredients) {
        const [identity, scores] = await Promise.all([
          getFoodIdentity(detail.foodId, detail.source),
          getFoodScores(detail.foodId, detail.source),
        ]);
        loaded.push({
          resolved: {
            category: detail.category ?? identity?.category ?? '',
            subcategory: identity?.subcategory ?? null,
            baseName: identity?.baseName ?? detail.foodName,
            prepMethod: identity?.prepMethod ?? null,
            foodId: detail.foodId,
            source: detail.source,
          },
          quantity: formatAmountForPicker(detail.quantity, AMOUNT_PICKER_VALUES),
          unit: detail.unit,
          cookingMethod: detail.cookingMethod,
          cutPrep: detail.cutPrep,
          prepNote: detail.prepNote ?? '',
          scores,
        });
      }

      if (!isCurrent) return;
      setSnackName(favorite.name);
      setServings(formatAmountForPicker(favorite.servings, SERVINGS_PICKER_VALUES));
      setServingSizeAmount(formatAmountForPicker(favorite.servingSizeAmount, AMOUNT_PICKER_VALUES));
      setServingSizeUnit(favorite.servingSizeUnit);
      setServingsConfirmed(true);
      setIngredients(loaded);
    })();

    return () => {
      isCurrent = false;
    };
  }, [fromFavoriteId]);

  // Curated starter recipes (2026-08-09, extended to Snack Builder
  // 2026-08-14) -- see SideBuilder.tsx's own identical block: this screen
  // no longer shows its own list of them at all, 2026-08-16 -- see "Or
  // Find a Recipe" further down in the render return.
  // handlePickCuratedRecipe/loadingCuratedRecipeId still exist purely for
  // the openRecipeId deep link below.
  const [loadingCuratedRecipeId, setLoadingCuratedRecipeId] = useState<string | null>(null);

  async function handlePickCuratedRecipe(id: string) {
    setLoadingCuratedRecipeId(id);
    try {
      const recipe = await getCuratedRecipe(id);
      if (!recipe) return;

      const loaded: SnackIngredient[] = [];
      for (const detail of recipe.ingredients) {
        const [identity, scores] = await Promise.all([
          getFoodIdentity(detail.foodId, detail.source),
          getFoodScores(detail.foodId, detail.source),
        ]);
        loaded.push({
          resolved: {
            category: detail.category ?? identity?.category ?? '',
            subcategory: identity?.subcategory ?? null,
            baseName: identity?.baseName ?? detail.foodName,
            prepMethod: identity?.prepMethod ?? null,
            foodId: detail.foodId,
            source: detail.source,
          },
          quantity: formatAmountForPicker(detail.quantity, AMOUNT_PICKER_VALUES),
          unit: detail.unit,
          cookingMethod: detail.cookingMethod,
          cutPrep: detail.cutPrep,
          prepNote: detail.prepNote ?? '',
          scores,
        });
      }

      setSnackName(recipe.name);
      setServings(formatAmountForPicker(recipe.servings, SERVINGS_PICKER_VALUES));
      setServingSizeAmount(formatAmountForPicker(recipe.servingSizeAmount, AMOUNT_PICKER_VALUES));
      setServingSizeUnit(recipe.servingSizeUnit);
      setServingsConfirmed(true);
      setIngredients(loaded);
    } finally {
      setLoadingCuratedRecipeId(null);
    }
  }

  useEffect(() => {
    if (openRecipeId && !editSnackId && !fromFavoriteId) {
      handlePickCuratedRecipe(openRecipeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRecipeId]);

  function handleFoodResolved(resolved: ResolvedFoodSelection) {
    setPendingResolved(resolved);
    setLastCategory(resolved.category);
    setLastSubcategory(resolved.subcategory);
  }
  // Scrolled to the bottom the instant a food resolves (see the effect
  // below) -- that Quantity/Add-to-Snack card's own Quantity field
  // autoFocuses immediately, raising AppKeyboard (a real, opaque overlay
  // roughly 240px tall, see constants/appKeyboard.ts's own KEYBOARD_HEIGHT)
  // the same instant. Without scrolling, "Add to Snack" -- the very last
  // thing in this card -- could sit behind that overlay with no way to
  // reach it except an ordinary content scroll the person has no reason to
  // know they need to do first. Reported 2026-07-28 as "tapping Add to
  // Snack does nothing," which is exactly what a covered button looks like.
  const scrollViewRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (pendingResolved) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [pendingResolved]);

  // Loads the pending food's own 6-Dimension scores so its warning flags
  // can show before it's added. Cleared immediately on food change (rather
  // than only on resolve) so a previous food's flags can never briefly
  // render against a newly-picked one; the isCurrent guard drops a slow
  // response that lands after the person already moved on.
  useEffect(() => {
    if (!pendingResolved) {
      setPendingScores([]);
      return;
    }
    let isCurrent = true;
    setPendingScores([]);
    getFoodScores(pendingResolved.foodId, pendingResolved.source).then((rows) => {
      if (isCurrent) setPendingScores(rows);
    });
    return () => {
      isCurrent = false;
    };
  }, [pendingResolved]);
  // 'building': the connected Category/Food picker shows automatically
  // (see the early return below) whenever nothing's pending confirmation.
  // 'reviewing': reached by tapping "Done adding ingredients" in the
  // summary card -- what renders here depends on EXTRAS_TO_CHECK, computed
  // live below from the current ingredient list (not stored), so adding a
  // missing item via the picker immediately clears its own nudge without a
  // separate transition. Cooking method is no longer a separate step here
  // at all, 2026-07-29 -- it's asked per ingredient now, at "Add to Snack"
  // time (see SnackIngredient's own comment).
  const [finishStep, setFinishStep] = useState<'building' | 'reviewing'>('building');
  // Edit mode only (see editSnackId's own comment) -- whether the person has
  // actively tapped "+ Add Ingredient" on the overview screen below.
  // Create mode never reads this: its own connected picker still shows
  // automatically the instant nothing's pending, same as always (see the
  // branch ordering just above the overview screen's own render function).
  // Starts false so opening an existing snack for editing always lands on
  // the ingredient overview first, not a "pick a Category" prompt --
  // explicitly requested, since re-opening a snack is almost always to
  // review/fix what's already there, not to add something new right away.
  const [addingIngredient, setAddingIngredient] = useState(false);
  // Explicit "I looked, I meant it" override -- without this, adding the
  // missing item is the ONLY way out of 'reviewing' once something's
  // flagged, which is wrong for genuinely oil-free/seasoning-free snacks
  // (plain steamed vegetables, etc.).
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const missingExtras = EXTRAS_TO_CHECK.filter(
    (extra) => !ingredients.some((ingredient) => ingredient.resolved.category === extra.category),
  );

  useEffect(() => {
    let isMounted = true;
    getStoredMeasurementSystem().then((stored) => {
      if (!isMounted) return;
      const resolved = stored ?? detectMeasurementSystemFromLocale();
      // Only decides WHICH unit options are available (metric vs.
      // imperial) -- no longer pre-selects one of them, see `unit`'s own
      // comment above.
      setMeasurementSystem(resolved);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Healing-stage self-declaration, 2026-08-09 -- see SideBuilder.tsx's own
  // comment on this same effect for the full reasoning.
  const [conditionStages, setConditionStages] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    getConditionStages().then((stages) => {
      if (isMounted) setConditionStages(stages);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Live nutrition/condition preview, 2026-08-17, point 7 of that day's own
  // redesign: "this is when it should all be displayed as the recipes are
  // displayed in Digest." Reuses the exact same real, general functions My
  // Kitchen/My Favorites already compute this from for an already-SAVED
  // item (see lib/digestDynamicEntries.ts's own buildMyKitchenEntryForOption)
  // -- both genuinely work against a plain, not-yet-saved ingredient list,
  // so no new backend function was needed for this screen to show the
  // identical real detail before Complete & Save This Snack is ever tapped.
  const [trackedConditions, setTrackedConditions] = useState<{ code: string; name: string }[]>([]);
  const [nutritionHighlights, setNutritionHighlights] = useState<ComponentNutritionHighlight[]>([]);
  const [conditionNotes, setConditionNotes] = useState<ComponentConditionNote[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [selectedCodes, allConditions] = await Promise.all([getUserConditions(), listAllConditions()]);
      if (!isMounted) return;
      const selected = new Set(selectedCodes);
      setTrackedConditions(
        allConditions
          .filter((condition) => selected.has(condition.code))
          .map((condition) => ({ code: condition.code, name: condition.name })),
      );
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Only actually computes once the final review screen is reached -- both
  // real functions do a genuine per-ingredient database query, so there's
  // no reason to pay that cost while still mid-build, only once there's
  // real content to show it for.
  useEffect(() => {
    if (finishStep !== 'reviewing') return;
    let isCurrent = true;
    const mealIngredients: MealIngredientInput[] = ingredients.map((ingredient) => ({
      foodId: `${ingredient.resolved.foodId}|${ingredient.resolved.source}`,
      foodName: ingredient.resolved.baseName,
      category: ingredient.resolved.category,
      quantity: parseAmountValue(ingredient.quantity),
      unit: ingredient.unit,
      cookingMethod: ingredient.cookingMethod,
      notes: ingredient.prepNote,
    }));
    const effectiveServings = servings ? parseAmountValue(servings) : 1;
    Promise.all([
      getNutritionHighlightsForIngredients(mealIngredients, effectiveServings),
      getConditionNotesForIngredients(mealIngredients, trackedConditions),
    ]).then(([highlights, notes]) => {
      if (!isCurrent) return;
      setNutritionHighlights(highlights);
      setConditionNotes(notes);
    });
    return () => {
      isCurrent = false;
    };
  }, [finishStep, ingredients, servings, trackedConditions]);

  // 2026-07-28 -- whichever AppTextInput was last focused (Snack Name,
  // Servings, Size, Quantity) stays "active" (and AppKeyboard visible, on
  // top of everything) until something explicitly blurs it: tapping a
  // plain button never does that on its own, it's not itself a text
  // field. AppKeyboard.tsx's own navigation-effect already does exactly
  // this pair of calls for real screen navigations (a tab switch, a stack
  // push); every button below that moves this builder to a visually
  // different step needs the same fix, since none of those are a real
  // navigation event AppKeyboard could otherwise detect on its own. The
  // general rule this follows: the keyboard should only ever be up while
  // the cursor is actually inside a field it can type into.
  function dismissKeyboard() {
    activeField?.blur();
    forceClear();
  }

  // Opens the real 3-way "where should this ingredient come from" chooser,
  // 2026-08-17, point 3. Dismissing without picking anything (the sheet's
  // own backdrop tap, or its explicit Cancel row) just leaves
  // ingredientSourceMode at null -- the Add Ingredients button and the
  // collapsed summary card both stay exactly as they were.
  function openIngredientSourceChooser() {
    dismissKeyboard();
    setSourceChooserVisible(true);
  }

  // Tapping Continue always fires (see primaryButtonMuted's own comment on
  // the button below for why this deliberately isn't a real `disabled`
  // TouchableOpacity) -- if something's still missing, this tells the
  // person exactly which one to fill in next, in the same top-to-bottom
  // order they appear on screen (Snack Name, then Servings, then Serving
  // Size, then Units), so only ever one message shows at a time, for
  // whichever is the FIRST thing still missing -- explicitly requested
  // 2026-07-28, including the exact wording for Snack Name/Servings; the
  // other two follow the same "Please choose/enter..." phrasing.
  function handleContinuePress() {
    if (!snackName.trim()) {
      showInfoAlert('Almost there', 'Please enter a name for this snack.');
      return;
    }
    if (!servings) {
      showInfoAlert('Almost there', 'Please choose the # of Servings this snack will contain.');
      return;
    }
    if (!servingSizeAmount) {
      showInfoAlert('Almost there', 'Please choose the Serving Size for this snack.');
      return;
    }
    if (!servingSizeUnit) {
      showInfoAlert('Almost there', 'Please choose the Units for this snack.');
      return;
    }
    dismissKeyboard();
    setServingsConfirmed(true);
  }

  // Every required field on the Pending Ingredient Card. Prep Notes is
  // deliberately absent -- it's the one genuinely optional field there.
  const ingredientReady = !!quantity && !!unit && !!ingredientCutPrep && !!ingredientCookingMethod;

  // Clears just the per-ingredient fields, ready for the next one. The
  // connected Category/Food picker reappears the instant pendingResolved
  // goes null (see the early return below), so this doubles as "go back to
  // step one" without a separate navigation call.
  function resetIngredientFields() {
    setPendingResolved(null);
    setPendingScores([]);
    setQuantity(null);
    setUnit(null);
    setIngredientCutPrep(null);
    setIngredientCookingMethod(null);
    setIngredientPrepSteps([]);
    setIngredientSourceMode(null);
  }

  // Persists the finished snack (see saveSnack/the snacks/snack_ingredients
  // tables' own comments in lib/db.ts for why this is its own real,
  // standalone record -- not a favorite, not yet a logged meal) and only
  // THEN resets the builder back to a blank snack, so a save failure never
  // silently loses what was just built -- the person sees a real error and
  // keeps their in-progress snack to retry with, rather than it vanishing
  // either way.
  //
  // Takes the final ingredient list as a parameter rather than reading the
  // `ingredients` state variable, 2026-08-01: setIngredients (in
  // saveIngredient below) is an async state update, so `ingredients`
  // itself hasn't picked up the just-added one yet at the point 'finish'
  // needs to save the whole snack -- the caller builds the true final list
  // once and passes it to both setIngredients and here.
  async function finishSnack(finalIngredients: SnackIngredient[]) {
    // servingsConfirmed can only become true via handleContinuePress, which
    // already required all three of these -- this is a type-narrowing
    // guard against a state that shouldn't be reachable, not a real
    // validation path a person should ever actually hit.
    if (!servings || !servingSizeAmount || !servingSizeUnit) return;

    const ingredientInputs: SnackIngredientInput[] = finalIngredients.map((ingredient) => ({
      foodId: ingredient.resolved.foodId,
      source: ingredient.resolved.source,
      foodName: foodSummary(ingredient.resolved),
      category: ingredient.resolved.category,
      quantity: parseAmountValue(ingredient.quantity),
      unit: ingredient.unit,
      cutPrep: ingredient.cutPrep,
      cookingMethod: ingredient.cookingMethod,
      prepNote: ingredient.prepNote,
    }));
    const finishedName = snackName.trim() || 'Snack';
    const payload = {
      name: finishedName,
      servings: parseAmountValue(servings),
      servingSizeAmount: parseAmountValue(servingSizeAmount),
      servingSizeUnit,
      ingredients: ingredientInputs,
      instructions: steps,
    };

    try {
      if (editSnackId) {
        await updateSnack(editSnackId, payload);
      } else {
        await saveSnack(payload);
      }
    } catch (error) {
      console.error('[SnackBuilder] Failed to save snack', error);
      showInfoAlert('Save failed', 'Something went wrong saving this snack. Your ingredients are still here; please try again.');
      return;
    }

    // Independent of the real save above -- 2026-08-08, see
    // SideBuilder.tsx's own identical block for the full reasoning.
    if (alsoSaveAsFavorite) {
      try {
        await saveBuilderFavorite('snack', payload);
      } catch (error) {
        console.error('[SnackBuilder] Failed to save favorite', error);
        showInfoAlert('Snack saved, favorite failed', `${finishedName} is saved, but saving it as a favorite didn't work. You can try favoriting it again later.`);
      }
    }

    // Editing an already-saved snack returns to wherever it was opened from
    // (see app/food-items.tsx's Edit button, which pushed this screen) --
    // "I fixed this snack" should go back to the list, not drop the person
    // into building a brand new one. No confirmation modal here, matching
    // this app's own existing edit-save convention elsewhere (Schedule's
    // own appointment edit just closes and reloads on success, alerting
    // only on failure) -- the list itself, showing the updated
    // name/ingredient count, is the confirmation.
    if (editSnackId) {
      router.back();
      return;
    }

    // Back to a blank snack. From here the Lens Button starts a
    // different builder and the Butterfly Button leaves the tab, so no
    // extra "what now?" step is needed.
    setIngredients([]);
    setSnackName('');
    setServings(null);
    setServingSizeAmount(null);
    setServingSizeUnit(null);
    setServingsConfirmed(false);
    setAlsoSaveAsFavorite(false);
    setFinishStep('building');
    setNudgeDismissed(false);
    setSteps([]);
    setIngredientSourceMode(null);
    setSourceChooserVisible(false);
    setSummaryExpanded(false);
    setNutritionHighlights([]);
    setConditionNotes([]);
    showInfoAlert('Snack saved', `${finishedName} is saved. Starting a fresh snack now.`);
  }

  // 2026-08-08 -- see SideBuilder.tsx's own identical function.
  function renderFavoriteToggle() {
    return (
      <TouchableOpacity style={styles.favoriteToggleRow} onPress={() => setAlsoSaveAsFavorite((current) => !current)} activeOpacity={0.7}>
        <Ionicons name={alsoSaveAsFavorite ? 'checkbox' : 'square-outline'} size={20} color={tabColor} />
        <Text style={styles.favoriteToggleText}>Also save as a Favorite, for fast reuse later</Text>
      </TouchableOpacity>
    );
  }

  // Commits the pending ingredient, then either loops back for another one
  // or ends the snack entirely -- 2026-07-31, the two Save buttons.
  //
  //   'add-new' -> back to picking a Food Category, then a food, and round
  //                again, indefinitely, until the person chooses 'finish'.
  //   'finish'  -> saves the whole snack (see finishSnack above) and resets
  //                the builder to a blank new snack.
  function saveIngredient(then: 'add-new' | 'finish') {
    if (!pendingResolved || !quantity || !unit || !ingredientCutPrep || !ingredientCookingMethod) {
      // Names only what's actually still missing, in the order the fields
      // appear on screen -- same approach as the snack form's own Continue.
      const missing = [
        !quantity && 'Quantity',
        !unit && 'Units',
        !ingredientCutPrep && 'Cut Prep',
        !ingredientCookingMethod && 'Cook Prep',
      ].filter(Boolean) as string[];
      showInfoAlert('Almost there', `Please choose ${missing.join(', ')} for this ingredient.`);
      return;
    }
    dismissKeyboard();
    const newIngredient: SnackIngredient = {
      resolved: pendingResolved,
      quantity,
      unit,
      cookingMethod: ingredientCookingMethod,
      cutPrep: ingredientCutPrep,
      // Real prep steps, serialized as newline-joined text into the same
      // real prepNote string field this record has always used -- see
      // ingredientPrepSteps' own comment above for why no schema change
      // was needed for this.
      prepNote: ingredientPrepSteps.join('\n'),
      scores: pendingScores,
    };
    const allIngredients = [...ingredients, newIngredient];
    setIngredients(allIngredients);
    resetIngredientFields();

    if (editSnackId) {
      // Edit mode always returns to the ingredient overview after adding
      // one ingredient -- 2026-08-01, explicitly requested -- rather than
      // either of create mode's two behaviors below (immediately
      // re-prompting for another ingredient, or immediately persisting and
      // leaving). Saving to the database happens only from the overview's
      // own explicit Save Changes button, once the person has had a chance
      // to actually see the updated list. `then` doesn't matter here (see
      // the single "Save Ingredient" button this feeds in edit mode).
      setAddingIngredient(false);
      return;
    }

    if (then === 'finish') {
      void finishSnack(allIngredients);
    }
  }

  function removeIngredient(index: number) {
    setIngredients((current) => current.filter((_, i) => i !== index));
  }

  // Confirms before actually removing, 2026-08-01 -- explicitly requested
  // after a real mis-tap deleted the wrong ingredient from an already-saved
  // snack (the small X row-remove buttons, packed close together in this
  // card's own narrow column, made it easy to catch the neighboring row by
  // mistake -- see summaryIngredientRow/summaryRemoveButton's own comments
  // for the size fix that goes with this). Same Cancel/destructive Alert
  // pattern already used elsewhere in this app (e.g. Schedule's own
  // appointment removal) -- a real "cancel instead" now exists, rather than
  // relying on re-adding a wrongly-removed ingredient by hand.
  async function confirmRemoveIngredient(index: number) {
    const ingredient = ingredients[index];
    const ok = await confirmSheet({
      title: `Remove ${ingredient.resolved.baseName}?`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (ok) removeIngredient(index);
  }

  // Thin wrapper, 2026-08-17 -- the real add/edit/remove/complete mechanics
  // (openAddStep, saveStepDraft, etc.) all moved into StepsEditor.tsx
  // itself once a second, genuinely separate use for the exact same shape
  // showed up (see ingredientPrepSteps' own comment above). Kept as a
  // function, not inlined at each call site, since it's still shared
  // between the create-mode "ready" screen and the edit-mode overview
  // screen below.
  function renderStepsSection() {
    return (
      <StepsEditor
        steps={steps}
        onChange={setSteps}
        tabColor={tabColor}
        label="Steps (optional)"
        addFirstLabel="+ Add Step 1"
        addAnotherLabel="+ Add Another Step"
        completeLabel="Steps Complete"
        placeholder="e.g., Slice the apple and spread almond butter over each piece."
        scrollViewRef={scrollViewRef}
      />
    );
  }

  // renderPillPicker lived here until 2026-07-31 -- the flat vertical pill
  // scroller every selectable field used before the combination-lock wheel
  // that briefly replaced it. That wheel is gone too now, 2026-08-01,
  // replaced in turn by PopoverSelect (see that file's own comment for
  // why: a drag-to-scroll wheel always needed a first touch just to wake
  // up, and a dragging finger covers the exact row it's trying to watch
  // settle -- neither is fixable by tuning the wheel further). All
  // selectable fields go through renderLabeledPicker/PopoverSelect now, so
  // the app has exactly one field-selection implementation, not several.

  // The Snack/Ingredients summary card -- snack name/servings/size on the
  // left (tap to reopen editing, same as the old collapsed summary row),
  // a scrollable ingredient list on the right. Shared between the
  // connected-picker branch below (squareBottom: true, so its own bottom
  // edge matches the picker's own squared-off top edge at their shared
  // seam) and the normal scrolling branch further down (squareBottom:
  // false, since nothing sits directly beneath it there).
  // One labeled field in the Pending Ingredient Card's stacked column --
  // 2026-07-31. Wraps renderPillPicker with the two sizing rules asked for
  // there, which turn out to be the same rule stated twice:
  //
  //   "make the field as wide as the label for it"  -> minWidth from the
  //      measured label (see labelWidths)
  //   "pills all as wide as the widest pill"        -> the box shrink-wraps
  //      its content (alignSelf: 'flex-start' via labeledPickerBox) and the
  //      pills stretch to fill it (alignItems: 'stretch' on the content
  //      container), so every pill lands at exactly the widest pill's width
  //
  // Together the box settles at max(label width, widest pill width) with no
  // hardcoded pixel guesses and nothing to re-tune when an option list
  // changes. The stretch half is why these pickers use their own content
  // style rather than pillScrollContent's centered one.
  function renderLabeledPicker(
    label: string,
    options: string[],
    selected: string | null,
    onSelect: (value: string | null) => void,
    openBelow = false,
  ) {
    return (
      <View style={styles.labeledPickerField}>
        <Text
          style={[styles.formLabel, { color: tabColor }]}
          onLayout={(event) => {
            const width = Math.ceil(event.nativeEvent.layout.width);
            setLabelWidths((current) => (current[label] === width ? current : { ...current, [label]: width }));
          }}
        >
          {label}
        </Text>
        <View style={styles.labeledPickerBox}>
          <PopoverSelect
            options={options}
            selected={selected}
            onSelect={onSelect}
            tabColor={tabColor}
            minWidth={labelWidths[label] ?? 0}
            openBelow={openBelow}
          />
        </View>
      </View>
    );
  }

  function renderSummaryCardContent() {
    return (
      <>
        {/* 2026-08-17, direct report: "it already has the name of the side
            dish at the top next to the collapse/expand symbol, so it
            doesn't need it repeated again just below it." Removed --
            CollapsibleOverlayCard's own headerRow already shows this same
            snackName as collapsedLabel right above this section. Serves/
            serving-size and the "tap to change" link stay -- neither is
            shown anywhere else, so they're real, non-duplicate
            information. */}
        <TouchableOpacity
          onPress={() => {
            setSummaryExpanded(false);
            dismissKeyboard();
            setServingsConfirmed(false);
          }}
        >
          <Text style={styles.summaryDetailText}>Serves {servings || '?'}</Text>
          <Text style={styles.summaryDetailText}>
            {servingSizeAmount || '?'} {servingSizeUnit ?? '?'} / serving
          </Text>
          <Text style={[styles.secondaryButtonText, { color: tabColor, marginTop: 4 }]}>Tap to change snack details</Text>
        </TouchableOpacity>

        <View style={[styles.overlayDivider, { borderColor: tabColor }]} />

        <Text style={[styles.formLabel, { color: tabColor }]}>Ingredients</Text>
        {ingredients.length === 0 ? (
          <Text style={[styles.summaryEmptyText, { marginTop: 4 }]}>No ingredients yet.</Text>
        ) : (
          <ScrollView style={styles.overlayIngredientScroll} showsVerticalScrollIndicator={false}>
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.overviewIngredientRow}>
                <View style={styles.overviewIngredientTextWrap}>
                  {/* Real padding, not hitSlop -- see overviewRemoveButton's
                      own comment further down for why. */}
                  <Text style={styles.overviewIngredientText}>
                    {ingredient.resolved.baseName} — {ingredient.quantity} {ingredient.unit}
                  </Text>
                  <DimensionFlags scores={ingredient.scores} onExplain={showInfoAlert} />
                </View>
                <TouchableOpacity
                  style={styles.overviewRemoveButton}
                  onPress={() => confirmRemoveIngredient(index)}
                  accessibilityLabel={`Remove ${ingredient.resolved.baseName}`}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Edit mode: this card only ever shows while addingIngredient is
            true (mid "+ Add Ingredient"), so its own escape hatch goes
            back to the overview screen instead of create mode's own
            "reviewing" step -- that ready-screen/missingExtras flow
            doesn't exist for edit mode at all (see the overview branch's
            own comment), so leaving this pointed at
            setFinishStep('reviewing') would have dropped an edit-mode
            person into a dead-end. Shown even with zero ingredients added
            yet in edit mode (unlike create mode's own ingredients.length
            > 0 gate) -- a snack being edited already has ingredients by
            definition, so "back out without picking a new one" should
            always be available here. */}
        {editSnackId ? (
          <TouchableOpacity
            style={styles.summaryDoneRow}
            onPress={() => {
              setSummaryExpanded(false);
              dismissKeyboard();
              setAddingIngredient(false);
            }}
          >
            <Text style={[styles.summaryDoneText, { color: tabColor }]}>← Back to overview</Text>
          </TouchableOpacity>
        ) : ingredients.length > 0 && finishStep === 'building' ? (
          <TouchableOpacity
            style={styles.summaryDoneRow}
            onPress={() => {
              setSummaryExpanded(false);
              dismissKeyboard();
              setFinishStep('reviewing');
            }}
          >
            <Text style={[styles.summaryDoneText, { color: tabColor }]}>Done adding ingredients →</Text>
          </TouchableOpacity>
        ) : null}
      </>
    );
  }

  // Called unconditionally, here, rather than inline where each row
  // actually renders below -- both rows sit inside conditional branches
  // (the snack-name row only shows while !servingsConfirmed; the ingredient
  // row only once pendingResolved is set), and useReorderedLabeledFields is
  // a real hook (it holds its own useRef), so calling it from inside either
  // branch would violate the rule that every hook fires on every render.
  // Computing both up front costs nothing when a given row isn't currently
  // showing -- the unused array is just discarded.
  const snackFormFields = useReorderedLabeledFields([
    { label: '# of Servings', options: SERVINGS_PICKER_VALUES, selected: servings, onSelect: setServings },
    { label: 'Serving Size', options: AMOUNT_PICKER_VALUES, selected: servingSizeAmount, onSelect: setServingSizeAmount },
    { label: 'Units', options: unitOptions, selected: servingSizeUnit, onSelect: setServingSizeUnit },
  ]);
  const ingredientFields = useReorderedLabeledFields([
    { label: 'Quantity', options: AMOUNT_PICKER_VALUES, selected: quantity, onSelect: setQuantity },
    { label: 'Units', options: unitOptions, selected: unit, onSelect: setUnit },
    { label: 'Cut Prep', options: CUT_PREP_METHODS, selected: ingredientCutPrep, onSelect: setIngredientCutPrep },
    { label: 'Cook Prep', options: COOKING_METHODS, selected: ingredientCookingMethod, onSelect: setIngredientCookingMethod },
  ]);

  // Edit mode's own ingredient overview -- 2026-08-01, explicitly
  // requested: reopening an already-saved snack to fix something shouldn't
  // assume the next thing wanted is picking a whole new Category. Landing
  // here by default (addingIngredient starts false) shows the snack info
  // and every current ingredient, each with a real trash-can button (not
  // the small ✕ the connected picker's own summary card below still uses
  // mid-add -- see that button's own comment for why THAT one stays small,
  // and confirmRemoveIngredient for the same Cancel/Remove confirmation
  // both share). Tapping "+ Add Ingredient" is the only way into the
  // connected picker below now, for edit mode specifically -- create mode
  // is completely untouched, still showing that picker automatically
  // (see the very next branch, whose own condition this one intercepts
  // ahead of only when editSnackId is set).
  if (editSnackId && servingsConfirmed && !pendingResolved && !addingIngredient) {
    return (
      <>
        {infoAlertElement}
        {confirmSheetElement}
        {/* ref={scrollViewRef}, 2026-08-17 -- shared with the create-mode
            ScrollView further down (safe: the two are mutually exclusive
            render branches, never mounted at once), so renderStepsSection's
            own composer field can scroll itself into view above AppKeyboard
            here too, not just in create mode. */}
        <ScrollView ref={scrollViewRef} contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
          <TouchableOpacity
            style={[styles.formCard, { borderColor: tabColor }]}
            onPress={() => {
              dismissKeyboard();
              setServingsConfirmed(false);
            }}
          >
            <Text style={[styles.overviewSnackName, { color: tabColor }]} numberOfLines={2}>
              {snackName.trim() || 'Snack'}
            </Text>
            <Text style={styles.summaryDetailText}>Serves {servings || '?'}</Text>
            <Text style={styles.summaryDetailText}>
              {servingSizeAmount || '?'} {servingSizeUnit ?? '?'} / serving
            </Text>
            <Text style={[styles.secondaryButtonText, { color: tabColor, marginTop: 8 }]}>Tap to change</Text>
          </TouchableOpacity>

          <View style={[styles.formCard, { borderColor: tabColor }]}>
            <Text style={[styles.formLabel, { color: tabColor }]}>Ingredients</Text>
            {ingredients.length === 0 ? (
              <Text style={[styles.summaryEmptyText, { marginTop: 8 }]}>No ingredients yet</Text>
            ) : (
              ingredients.map((ingredient, index) => (
                <View key={index} style={styles.overviewIngredientRow}>
                  <View style={styles.overviewIngredientTextWrap}>
                    <Text style={styles.overviewIngredientText}>
                      {ingredient.resolved.baseName} — {ingredient.quantity} {ingredient.unit}
                    </Text>
                    <DimensionFlags scores={ingredient.scores} onExplain={showInfoAlert} />
                  </View>
                  <TouchableOpacity
                    style={styles.overviewRemoveButton}
                    onPress={() => confirmRemoveIngredient(index)}
                    accessibilityLabel={`Remove ${ingredient.resolved.baseName}`}
                    hitSlop={4}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                dismissKeyboard();
                setAddingIngredient(true);
              }}
            >
              <Text style={[styles.secondaryButtonText, { color: tabColor }]}>+ Add Ingredient</Text>
            </TouchableOpacity>
          </View>

          {/* Real steps, edit mode -- 2026-08-17. Its own bordered card,
              matching the Ingredients card just above it, since reopening a
              saved snack to fix something is exactly as much "the area
              that explains the whole process of making this" as create
              mode's own ready screen further down is. */}
          <View style={[styles.formCard, { borderColor: tabColor }]}>{renderStepsSection()}</View>

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]} onPress={() => void finishSnack(ingredients)}>
            <Text style={styles.primaryButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </>
    );
  }

  // Actively waiting on a NEW ingredient's Category/Food pick -- the
  // connected FoodLookup can't sit inside the ScrollView below (see its
  // own comment further down for why), so this whole branch, including
  // the summary card above it, renders outside of one. Shows
  // automatically the instant there's nothing pending (right after
  // Continue, and again right after each "Add to Snack") -- no separate
  // "+ Add Ingredient" tap needed anymore.
  if (servingsConfirmed && finishStep === 'building' && !pendingResolved) {
    // A real ingredient-source method has been chosen (points 3/5,
    // 2026-08-17) -- render FoodLookup restricted to exactly that one path,
    // with a small "‹ Cancel" link above it so there's always a real way
    // back to the chooser ("There needs to be a cancel ability to get back
    // to being able to choose which list again"). squareTop is false here
    // (no card seam to match anymore, unlike the old always-visible
    // summary card) and topReserve reflects just this link row's own real
    // height -- freeing up meaningfully more screen space for the
    // category/food list itself than the old, much taller summary card
    // ever left it, the direct fix for the reported "extends below the
    // footer, can never reach the bottom" bug (see
    // SOURCE_CANCEL_ROW_HEIGHT's own comment).
    if (ingredientSourceMode) {
      return (
        <View style={styles.pickerScreen}>
          <TouchableOpacity
            style={styles.sourceCancelLink}
            onPress={() => {
              dismissKeyboard();
              setIngredientSourceMode(null);
            }}
          >
            <Ionicons name="chevron-back" size={13} color={tabColor} />
            <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Cancel</Text>
          </TouchableOpacity>
          <FoodLookup
            tabColor={tabColor}
            showNutrients={false}
            onFoodResolved={handleFoodResolved}
            squareTop={false}
            topReserve={SOURCE_CANCEL_ROW_HEIGHT}
            initialCategory={lastCategory}
            initialSubcategory={lastSubcategory}
            allowedCategories={SNACK_BUILDER_CATEGORIES}
            restrictToSource={ingredientSourceMode}
          />
        </View>
      );
    }

    // Nothing chosen yet -- the collapsed snack/ingredients card (point 2)
    // plus a real, NAVIGATION_HAND-aware "Add Ingredients" button (points
    // 3/5) opening the 3-way source chooser.
    return (
      <View style={styles.pickerScreen}>
        <CollapsibleOverlayCard
          collapsedLabel={snackName.trim() || 'Snack'}
          tabColor={tabColor}
          expanded={summaryExpanded}
          onExpand={() => setSummaryExpanded(true)}
          onCollapse={() => setSummaryExpanded(false)}
        >
          {renderSummaryCardContent()}
        </CollapsibleOverlayCard>
        <TouchableOpacity
          style={[
            styles.addIngredientsButton,
            { borderColor: tabColor },
            NAVIGATION_HAND === 'left' ? styles.addIngredientsButtonLeft : styles.addIngredientsButtonRight,
          ]}
          onPress={openIngredientSourceChooser}
        >
          <Text style={[styles.addIngredientsButtonText, { color: tabColor }]}>Add Ingredients</Text>
        </TouchableOpacity>
        <AppActionSheet
          visible={sourceChooserVisible}
          onClose={() => setSourceChooserVisible(false)}
          title="Add an Ingredient"
          message="Where would you like to get this ingredient from?"
          actions={[
            { label: '🎤 Say a Food Name', onPress: () => setIngredientSourceMode('voice') },
            { label: 'My Food Products', onPress: () => setIngredientSourceMode('products') },
            { label: 'Whole Foods', onPress: () => setIngredientSourceMode('category') },
            { label: 'Cancel', onPress: () => {} },
          ]}
        />
      </View>
    );
  }

  return (
    <>
      {infoAlertElement}
      {confirmSheetElement}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding + keyboardReserve }]}
      >
      {!servingsConfirmed ? (
        <View style={[styles.formCard, { borderColor: tabColor }]}>
          {/* 2026-08-16 -- see SideBuilder.tsx's own identical comment for
              the full reasoning: the only visible feedback left for a
              recipe loading in via the openRecipeId deep link now that the
              inline "Or Start From a Recipe" cards are gone, replaced by a
              real link out to Digest below. */}
          {loadingCuratedRecipeId ? (
            <View style={styles.loadingRecipeRow}>
              <ActivityIndicator size="small" color={tabColor} />
              <Text style={[styles.loadingRecipeText, { color: tabColor }]}>Loading your recipe…</Text>
            </View>
          ) : null}

          {/* Snack Name, 2026-07-28 -- its own full-width field above
              Servings/Size, since it's not part of either's own row/
              column pairing and applies to the snack as a whole. */}
          <Text style={[styles.formLabel, { color: tabColor }]}>Snack Name</Text>
          {/* 2026-08-17, a second real correction the same day: "Can the
              microphone be part of the Dish Name field so the field looks
              like it is extended all the way from the left to the right
              sides?" Rebuilt again -- the mic is no longer a separate
              button sitting beside the field (that was the prior fix's own
              design, itself already a real improvement over the mic
              floating on its own row above); it's now embedded INSIDE one
              continuous bordered box, the same real "icon inside a search
              bar" shape, so the whole thing reads as a single field
              spanning the row rather than two separate elements. The
              border/background that used to live on AppTextInput itself
              (via formInput) now live on the outer wrap instead;
              dishNameInputEmbedded strips them back off the input so
              nothing doubles up. This also makes the field's own left edge
              genuinely constant regardless of NAVIGATION_HAND (the mic now
              only reorders WITHIN the box, it no longer sits outside it
              pushing the box itself over) -- so the label above no longer
              needs its own hand-computed left offset the prior fix required;
              it can stay flush left, always correctly over the field. */}
          <View style={[styles.dishNameFieldWrap, { backgroundColor: inputBackground(tabColor) }]}>
            {NAVIGATION_HAND === 'left' ? (
              <>
                <VoiceInputButton onResult={(transcript) => handleSnackNameChange(transcript)} size={22} />
                <AppTextInput
                  style={[styles.formInput, styles.dishNameInputEmbedded]}
                  value={snackName}
                  onChangeText={handleSnackNameChange}
                  placeholder="e.g., Apple Slices with Almond Butter"
                  // The first thing this screen asks for -- focused and
                  // ready to type into the instant it opens (AppKeyboard
                  // rises automatically the same way it would from a real
                  // tap, see AppTextInput's own onFocus handling) rather
                  // than leaving the person to notice and tap the field
                  // themselves first.
                  autoFocus
                />
              </>
            ) : (
              <>
                <AppTextInput
                  style={[styles.formInput, styles.dishNameInputEmbedded]}
                  value={snackName}
                  onChangeText={handleSnackNameChange}
                  placeholder="e.g., Apple Slices with Almond Butter"
                  autoFocus
                />
                <VoiceInputButton onResult={(transcript) => handleSnackNameChange(transcript)} size={22} />
              </>
            )}
          </View>

          {/* Converted to the same PopoverSelect fields the ingredient card
              uses (originally combination-lock wheels, 2026-07-31; wheels
              replaced by PopoverSelect 2026-08-01 -- see that file's own
              comment) -- every selectable field in the app behaves and
              looks identical rather than this screen keeping a style of
              its own.

              This replaced a separate label row above a separate picker
              row, each holding three equal flex: 1 columns. Those two rows
              had to be kept in sync by hand for the labels to stay over
              their own fields; renderLabeledPicker pairs each label with
              its field directly, so they can't drift apart, and the fields
              size themselves to their own content the way the ingredient
              fields already do. */}
          <View style={styles.labeledPickerRow}>
            {snackFormFields.map((field) => (
              <Animated.View key={field.label} layout={LinearTransition}>
                {renderLabeledPicker(field.label, field.options, field.selected, field.onSelect, true)}
              </Animated.View>
            ))}
          </View>

          {/* Not a real `disabled` TouchableOpacity, 2026-07-28, explicitly
              requested -- a disabled button never fires onPress at all, so
              there'd be no way to tell the person WHAT'S still missing.
              This always fires (handleContinuePress's own guards decide
              whether to actually proceed or show a message); only the
              COLOR changes, dim grey (primaryButtonMuted/
              primaryButtonTextMuted) while anything required is still
              unchosen, back to this page's own tabColor once all three
              are. marginTop raised (continueButtonSpacing, was 14) so a
              scroll gesture that doesn't quite land on one of the pill
              pickers just above can't accidentally end on top of this
              button instead. */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              styles.continueButtonSpacing,
              snackFormReady ? { backgroundColor: colors.buttonColor } : styles.primaryButtonMuted,
            ]}
            onPress={handleContinuePress}
          >
            <Text style={[styles.primaryButtonText, !snackFormReady && styles.primaryButtonTextMuted]}>Continue</Text>
          </TouchableOpacity>

          {/* "Or Find a Recipe" -- 2026-08-16, see SideBuilder.tsx's own
              identical section for the full reasoning: this used to be an
              inline list of this builder's own curated recipe cards, shown
              ABOVE the fields/Continue button above. Recipes shouldn't be
              duplicated here in a stripped-down form at all -- Purple
              Digest's own Recipes/My Kitchen/My Favorites categories
              already show the full real detail. Each row is a real deep
              link (openDigestLens) straight into that category. */}
          {!editSnackId && !fromFavoriteId ? (
            <View style={styles.findRecipeSection}>
              <View style={[styles.findRecipeDivider, { borderColor: tabColor }]} />
              <Text style={[styles.formLabel, { color: tabColor }]}>Or Find a Recipe</Text>
              <TouchableOpacity
                style={styles.findRecipeLink}
                onPress={() => router.push({ pathname: '/purple-digest', params: { openDigestLens: 'myKitchen' } })}
              >
                <Text style={styles.findRecipeLinkText} numberOfLines={1}>
                  My Kitchen (your own saved snacks)
                </Text>
                <Ionicons name="chevron-forward" size={16} color={tabColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.findRecipeLink}
                onPress={() => router.push({ pathname: '/purple-digest', params: { openDigestLens: 'myKitchen' } })}
              >
                <Text style={styles.findRecipeLinkText} numberOfLines={1}>
                  Recipes Shared With Me
                </Text>
                <Ionicons name="chevron-forward" size={16} color={tabColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.findRecipeLink}
                onPress={() => router.push({ pathname: '/purple-digest', params: { openDigestLens: 'recipes' } })}
              >
                <Text style={styles.findRecipeLinkText} numberOfLines={1}>
                  Recipes (built into the app)
                </Text>
                <Ionicons name="chevron-forward" size={16} color={tabColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.findRecipeLink}
                onPress={() => router.push({ pathname: '/purple-digest', params: { openDigestLens: 'myFavorites' } })}
              >
                <Text style={styles.findRecipeLinkText} numberOfLines={1}>
                  My Favorites
                </Text>
                <Ionicons name="chevron-forward" size={16} color={tabColor} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : (
        <>
          {pendingResolved ? (
            <CollapsibleOverlayCard
              collapsedLabel={snackName.trim() || 'Snack'}
              tabColor={tabColor}
              expanded={summaryExpanded}
              onExpand={() => setSummaryExpanded(true)}
              onCollapse={() => setSummaryExpanded(false)}
            >
              {renderSummaryCardContent()}
            </CollapsibleOverlayCard>
          ) : null}

          {pendingResolved ? (
            <View style={[styles.formCard, { borderColor: tabColor }]}>
              {/* Change Food sits ABOVE the header, 2026-07-31 (explicitly
                  requested) -- it acts on the whole card ("this is the
                  wrong food, take me back"), so it reads as a way out of
                  this step rather than one more control within it, which
                  is what it looked like sitting down among the Save
                  buttons. */}
              <TouchableOpacity
                style={styles.changeFoodTop}
                onPress={() => {
                  dismissKeyboard();
                  setPendingResolved(null);
                }}
              >
                <Ionicons name="chevron-back" size={13} color={tabColor} />
                <Text style={[styles.secondaryButtonText, { color: tabColor }]}>Change Food</Text>
              </TouchableOpacity>

              {/* Header, 2026-07-31 -- "Preparation Steps for X", title-cased.
                  Title-casing is applied HERE, at render, rather than
                  depending on the database row already being capitalized
                  (which is what made this regress before -- base_name
                  casing varies by national source, so some foods arrived
                  lowercase and there was nothing in this component to
                  correct them). titleCaseSnackName is the same helper the
                  Snack Name field uses, so the two can't drift apart. */}
              <View style={styles.pendingFoodRow}>
                {/* foodSummary()'s preparation-state qualifier is folded into
                    this one line, 2026-07-31 -- the separate sub-line that
                    used to repeat the food name below was removed as
                    redundant, but it also carried that qualifier (e.g.
                    "Beans (Boiled)"), which really does disambiguate which
                    database row was matched. Appending it here keeps that
                    information without a second line. */}
                <Text style={styles.pendingHeader} numberOfLines={2}>
                  Preparation Steps for {titleCaseSnackName(foodSummary(pendingResolved))}
                </Text>
                {/* The pre-add indicator -- flags show HERE, while the
                    person is still deciding, not only after the food has
                    already joined the list. Renders nothing while scores
                    are still loading or when there's no flagged
                    sub-criterion. */}
                <DimensionFlags scores={pendingScores} onExplain={showInfoAlert} size={14} />
              </View>
              <SourceFallbackNote source={pendingResolved.source} tabColor={tabColor} />
              {/* Healing Stage advisory -- 2026-08-09, informational, never
                  gating, same shape as every other advisory in this app.
                  See lib/healingStageAdvisory.ts's own top comment for the
                  real, cited flag conditions and SideBuilder.tsx for the
                  original instance this was copy-adapted from. */}
              {(() => {
                const advisory = getConditionStageAdvisory(pendingScores, conditionStages);
                return advisory ? (
                  <TouchableOpacity
                    style={[styles.healingStageAdvisoryRow, { borderColor: tabColor }]}
                    onPress={() => showInfoAlert(advisory.title, advisory.message)}
                  >
                    <Ionicons name="information-circle-outline" size={16} color={tabColor} />
                    <Text style={[styles.healingStageAdvisoryText, { color: tabColor }]}>
                      Condition stage note (tap to learn more)
                    </Text>
                  </TouchableOpacity>
                ) : null;
              })()}
              {/* Real, cited food-safety advisory -- 2026-08-13, see
                  lib/rawMeatAdvisory.ts's own top comment. Informational,
                  same tap-to-explain shape as every other advisory here,
                  never gating. */}
              {/* General-health gradient advisories, 2026-08-14 -- one unified,
                  mutable-per-topic component replacing the separate
                  alcohol/coffee/juice/raw-meat rows that used to live here.
                  See lib/generalHealthRules.ts's own top comment. */}
              <GeneralHealthAdvisories
                resolved={pendingResolved}
                cookMethod={ingredientCookingMethod}
                tabColor={tabColor}
                onExplain={showInfoAlert}
              />

              {/* "Worth testing?", 2026-08-14 -- a real cross-tab shortcut
                  into the structured Food Testing loop (Signals > New
                  Foods), only offered while this exact food is genuinely
                  flagged for one of the person's own tracked conditions
                  (the same pendingScores/isFlaggedTier signal DimensionFlags
                  already renders above). See SideBuilder.tsx for the
                  original instance of this exact block, and log.tsx's own
                  LogScreen for the matching read side. */}
              {pendingScores.some((score) => isFlaggedTier(score.tier)) ? (
                <TouchableOpacity
                  style={[styles.healingStageAdvisoryRow, { borderColor: tabColor }]}
                  onPress={() => {
                    if (!pendingResolved) return;
                    markPendingFoodTrialReturn();
                    router.push({
                      pathname: '/log',
                      params: {
                        trialFoodId: pendingResolved.foodId,
                        trialSource: pendingResolved.source,
                        trialBaseName: pendingResolved.baseName,
                        trialCategory: pendingResolved.category,
                        trialSubcategory: pendingResolved.subcategory ?? '',
                        trialPrepMethod: pendingResolved.prepMethod ?? '',
                      },
                    });
                  }}
                >
                  <Ionicons name="flask-outline" size={16} color={tabColor} />
                  <Text style={[styles.healingStageAdvisoryText, { color: tabColor }]}>
                    Worth testing? Start tracking it in Signals
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* Four stacked labeled fields, 2026-07-31 -- Quantity,
                  Units, Cut Prep, Cook Prep, in that order, each its own
                  vertical pill spinner sized by renderLabeledPicker (see
                  its comment for the two width rules). This replaced a
                  side-by-side Quantity+Units row plus a wrapping
                  cooking-method chip grid.

                  "Cook Prep" is the same required cooking-method list as
                  before, just relabeled; "Cut Prep" is genuinely new (see
                  CUT_PREP_METHODS for why it's a structured field rather
                  than free text). Both are required for the same reason
                  quantity/unit are: each measurably changes the food's
                  own nutrition, so a snack built without them can't be
                  scored honestly. */}
              <View style={styles.labeledPickerRow}>
                {ingredientFields.map((field) => (
                  <Animated.View key={field.label} layout={LinearTransition}>
                    {renderLabeledPicker(field.label, field.options, field.selected, field.onSelect)}
                  </Animated.View>
                ))}
              </View>

              {/* Optional free text for detail the structured fields above
                  deliberately don't try to capture -- e.g. "1-inch pieces,"
                  or "added on top after cooking, not cooked itself." Not
                  required: Cut Prep and Cook Prep carry what actually
                  changes nutrition; this is extra recipe-style nuance on
                  top. Width left exactly as it was, per an explicit note
                  that the current box is already right. */}
              {/* marginTop 10 -> 7 (2026-07-31): roughly 25% tighter to the
                  fields above, tying the note field visually to the fields
                  it annotates rather than floating between them and the
                  buttons below. */}
              {/* 2026-08-16 -- a real mic button next to the label, not
                  wrapped around the multiline field itself (which is
                  meant to grow tall, not sit in a horizontal row).
                  Only the FINAL transcript is used -- a partial result
                  mid-sentence would land real, half-finished command
                  phrases in the actual note text, so this waits for the
                  whole utterance before running it through
                  parseVoiceCommands and appending. */}
              {/* Real, per-ingredient Prep Steps, 2026-08-17 (point 6:
                  "the prep notes is where the ability to create a list, or
                  sequence of steps to follow for prepping the identified
                  food"). Replaces what used to be a single free-text field
                  here -- committed to ingredientPrepSteps and serialized
                  into the same real prepNote string field at "Add to
                  Snack"/"Save Ingredient" time (see saveIngredient's own
                  comment above), same as before. */}
              <View style={{ marginTop: 7 }}>
                <StepsEditor
                  steps={ingredientPrepSteps}
                  onChange={setIngredientPrepSteps}
                  tabColor={tabColor}
                  label="Prep Steps (optional)"
                  addFirstLabel="+ Add Step 1"
                  addAnotherLabel="+ Add Another Step"
                  completeLabel="Steps Complete"
                  placeholder="e.g., Slice into bite-sized pieces"
                  scrollViewRef={scrollViewRef}
                />
              </View>

              {/* Edit mode: one "Save Ingredient" button -- 'add-new' vs.
                  'finish' no longer mean different things here (see
                  saveIngredient's own editSnackId branch: both just commit
                  this ingredient and return to the overview screen), so
                  showing a two-button split that used to mean "add
                  another" vs. "finish the whole snack" would just be
                  confusing now that finishing/persisting happens from the
                  overview instead. Create mode keeps the original Save &
                  Add New (left) / Save & Finish Snack (right) pair,
                  2026-07-31 -- replaces the old Change Food + Add to Snack
                  pair, unchanged. Both stay muted (not `disabled`) until
                  every required field is chosen, the same pattern as the
                  snack form's own Continue button -- a truly disabled
                  button can't explain what's missing, so these always fire
                  and the handler decides.
                  renderFavoriteToggle() no longer shows here, 2026-08-17 --
                  moved to the final review screen only (see further down),
                  since "also save as a Favorite" is a decision about the
                  whole finished snack, not something to ask again for
                  every single ingredient added along the way. */}
              <View style={styles.buttonRow}>
                {editSnackId ? (
                  <TouchableOpacity
                    style={[styles.splitButton, ingredientReady ? { backgroundColor: colors.buttonColor } : styles.primaryButtonMuted]}
                    onPress={() => saveIngredient('add-new')}
                  >
                    <Text style={[styles.primaryButtonText, !ingredientReady && styles.primaryButtonTextMuted]}>
                      Save Ingredient
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.splitButton, ingredientReady ? { backgroundColor: colors.buttonColor } : styles.primaryButtonMuted]}
                      onPress={() => saveIngredient('add-new')}
                    >
                      <Text style={[styles.primaryButtonText, !ingredientReady && styles.primaryButtonTextMuted]}>
                        Save &amp; Add New
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.splitButton, ingredientReady ? { backgroundColor: colors.buttonColor } : styles.primaryButtonMuted]}
                      onPress={() => saveIngredient('finish')}
                    >
                      <Text style={[styles.primaryButtonText, !ingredientReady && styles.primaryButtonTextMuted]}>
                        Save &amp; Finish Snack
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ) : missingExtras.length > 0 && !nudgeDismissed ? (
            // Soft nudge, 2026-07-28 -- never blocks finishing (see
            // nudgeDismissed's own comment above): plenty of real snacks
            // genuinely have no oil or seasoning. Recomputed live
            // from `ingredients` every render, so adding the missing
            // item via the connected picker (back in 'building') clears
            // its own mention here automatically, no separate
            // acknowledgement needed.
            <View style={[styles.formCard, { borderColor: tabColor }]}>
              <Text style={styles.emptyText}>
                No {missingExtras.map((extra) => extra.label).join(' or ')} logged for this snack yet.
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    dismissKeyboard();
                    setNudgeDismissed(true);
                  }}
                >
                  <Text style={[styles.secondaryButtonText, { color: tabColor }]}>None used, continue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]}
                  onPress={() => {
                    dismissKeyboard();
                    setFinishStep('building');
                  }}
                >
                  <Text style={styles.primaryButtonText}>+ Add Ingredient</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // The real final review screen, 2026-08-17 (point 7: "this is
            // when it should all be displayed as the recipes are displayed
            // in Digest, with all of the various information they just
            // created for that snack, allowing them to see how it looks,
            // and they can then edit any ingredient from there to add or
            // remove anything they need to change"). Reached via "Done
            // adding ingredients" with no ingredient currently pending and
            // the extras nudge already satisfied/dismissed. finishSnack is
            // called directly here, not via saveIngredient('finish') --
            // that function's whole job is committing a NEW pending
            // ingredient first, and there isn't one to commit at this
            // point; every ingredient is already in `ingredients`.
            //
            // In practice this branch is create-mode only: edit mode's own
            // "+ Add Ingredient" flow always routes through the connected-
            // picker branch above instead (finishStep never leaves
            // 'building' for editSnackId), which is why editSnackId ?
            // 'Save Changes' below is a defensive fallback, not something
            // this branch is actually expected to render.
            <View style={[styles.formCard, { borderColor: tabColor }]}>
              <Text style={[styles.overviewSnackName, { color: tabColor }]}>{snackName.trim() || 'Snack'}</Text>
              <Text style={styles.summaryDetailText}>
                Makes {servings || '?'} serving{servings === '1' ? '' : 's'} ({servingSizeAmount || '?'} {servingSizeUnit ?? '?'} each)
              </Text>

              <Text style={[styles.formLabel, { color: tabColor, marginTop: 14 }]}>Ingredients</Text>
              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.recipeIngredientRow}>
                  <Text style={styles.recipeIngredientBullet}>•</Text>
                  <Text style={styles.recipeIngredientText}>{formatFinalIngredientText(ingredient)}</Text>
                  <TouchableOpacity
                    style={styles.overviewRemoveButton}
                    onPress={() => confirmRemoveIngredient(index)}
                    accessibilityLabel={`Remove ${ingredient.resolved.baseName}`}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  dismissKeyboard();
                  setFinishStep('building');
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: tabColor }]}>+ Add Another Ingredient</Text>
              </TouchableOpacity>

              {/* Real steps, create mode -- 2026-08-17, right where the same
                  section sits in a real recipe card (Ingredients, then "How
                  to make it," see RecipeCardDetail in
                  app/(tabs)/purple-digest.tsx). */}
              <View style={{ marginTop: 16 }}>{renderStepsSection()}</View>

              {/* Real, live-computed nutrition/condition preview, point 7 --
                  the exact same real detail a saved snack's own Digest My
                  Kitchen card shows, computed here BEFORE this snack is ever
                  saved (see nutritionHighlights/conditionNotes' own effect
                  above). Both silently render nothing when empty rather
                  than an empty box -- a snack with no real standout
                  nutrient or condition flag genuinely has nothing to show
                  here. */}
              {nutritionHighlights.length > 0 ? (
                <View style={[styles.recipeNutritionBox, { borderColor: tabColor }]}>
                  <Text style={[styles.recipeNutritionLabel, { color: tabColor }]}>What This Snack Gives You</Text>
                  {nutritionHighlights.map((highlight, index) => (
                    <Text key={index} style={styles.recipeNutritionText}>
                      • <Text style={styles.recipeNutritionBold}>{highlight.nutrient}:</Text> {highlight.note}
                    </Text>
                  ))}
                </View>
              ) : null}

              {conditionNotes.length > 0 ? (
                <View style={[styles.recipeConditionBox, { borderColor: colors.danger }]}>
                  <Text style={[styles.recipeConditionLabel, { color: colors.danger }]}>Worth Knowing If You Have...</Text>
                  {conditionNotes.map((note, index) => (
                    <View key={index} style={index > 0 ? { marginTop: 8 } : undefined}>
                      <Text style={styles.recipeConditionCondition}>{note.condition}</Text>
                      <Text style={styles.recipeNutritionText}>{note.note}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* "Also save as a Favorite" only appears here now, 2026-08-17
                  (point 7) -- no longer offered on the pending-ingredient
                  card mid-build, since the request was explicit that this
                  choice belongs at the very end, alongside the final Save
                  action. */}
              {renderFavoriteToggle()}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]}
                onPress={() => void finishSnack(ingredients)}
              >
                <Text style={styles.primaryButtonText}>{editSnackId ? 'Save Changes' : 'Complete & Save This Snack'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  // 2026-08-09 -- same real shape as SideBuilder.tsx's own
  // healingStageAdvisoryRow/Text (this file has no other advisory row to
  // reuse styles from).
  healingStageAdvisoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  healingStageAdvisoryText: { ...typography.caption },
  // Deliberately NOT a ScrollView -- see this component's own render-time
  // comment for why FoodLookup can never sit inside one.
  pickerScreen: { flex: 1, paddingHorizontal: 16, paddingTop: 5 },
  scrollContent: { padding: 16, paddingTop: 5, gap: 10 },
  formCard: {
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: colors.surface,
    padding: 16,
  },
  // Recipe-loading feedback while openRecipeId resolves, 2026-08-16 -- see
  // that state's own comment near the top of this file.
  loadingRecipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingRecipeText: {
    ...typography.body,
  },
  // "Or Find a Recipe," 2026-08-16 -- see SideBuilder.tsx's own identical
  // section for the full reasoning. Sits below Continue now, not above the
  // fields.
  findRecipeSection: {
    marginTop: 20,
  },
  findRecipeDivider: {
    borderBottomWidth: 1,
    marginBottom: 12,
    opacity: 0.3,
  },
  findRecipeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  findRecipeLinkText: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  formLabel: {
    ...typography.eyebrow,
  },
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
  // 2026-08-17 -- see the Snack Name field's own comment for why this
  // exists: one continuous bordered box (the field's own real border/
  // background, previously carried by formInput itself) holding both the
  // text input and its mic, so the mic reads as part of the field rather
  // than a separate element beside it.
  dishNameFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  // Strips the border/background back off the input itself (both now live
  // on dishNameFieldWrap above) so nothing doubles up visually; keeps
  // formInput's own text size/color/internal padding, which still apply
  // since this is layered on top of formInput, not a replacement for it.
  dishNameInputEmbedded: { flex: 1, marginTop: 0, borderWidth: 0, backgroundColor: 'transparent' },
  // Two true rows, 2026-07-28 -- a label band (Servings/Size/Units) and an
  // input band (the three scrollable pill pickers themselves) directly
  // beneath it, each its own flex row with alignItems: 'flex-end' so every
  // item in a band bottom-aligns regardless of its own font size or
  // control height.
  // Servings/Size/Units all use this -- see the JSX comment above them for
  // why three equal flex columns replaced two fixed widths plus a
  // remainder.
  // sizeLabelRow / scrollHint / sizeInputGroup / amountPicker lived here
  // until 2026-07-31 -- they laid out the per-ingredient Quantity and
  // Units pickers side by side under a shared label row. That whole shape
  // was replaced by four stacked, individually-labeled fields
  // (renderLabeledPicker), leaving these with no callers, so they were
  // removed rather than left as dead styles.

  // The unit/amount pills sit inline beside their own sibling (unit next
  // to the amount picker, or Servings alone in its own row), 2026-07-28,
  // as a scrollable box (vertical since 2026-07-29, see renderPillPicker's
  // own comment) so every option stays reachable without needing to grow
  // wider. Bordered -- a plain unbounded
  // ScrollView butted right up against its sibling had nothing marking
  // where one ends and the other begins. Same colors.border/borderRadius
  // recipe as formInput's own outline (below), so this reads as matching
  // form chrome. Background is applied inline at the render site instead
  // of here, matching every input's own backgroundColor -- both need the
  // live tabColor prop to compute (inputBackground(tabColor)), which a
  // static StyleSheet object has no access to.
  //
  // Deliberately has no width/flex of its own -- renderPillPicker always
  // pairs this with EITHER a fixed-width style (servingsPicker/
  // amountPicker) OR pillScrollFlex below, never both at once (flex: 1
  // implies flexBasis: 0%, which would silently win over an explicit
  // width set alongside it, undoing the fixed width entirely).
  // The ScrollView inside spans this box's FULL size, 2026-07-28 (see
  // renderPillPicker's own "fourth pass" comment for why) -- the two
  // scrollArrowBadge indicators are an absolute overlay on top of it, not
  // separate flex siblings, so a drag starting anywhere in this box,
  // including visually on top of a badge, still reaches the ScrollView
  // underneath and scrolls it. overflow: 'hidden' keeps the ScrollView's
  // own content clipped to this box's rounded corners, same reasoning as
  // InlineSelectList.tsx's own container.
  //
  // height added 2026-07-29 (the fifth-pass switch to vertical scrolling,
  // see renderPillPicker's own comment) -- a ScrollView needs a bounded
  // cross-axis size to actually scroll rather than just growing to fit
  // its content; the old horizontal version got this for free from the
  // row's own width, but a vertical one needs it stated explicitly.
  // Picked to comfortably show about two pills at rest with a clear peek
  // of a third -- enough to read as "a short scrollable list," not so
  // tall it dominates the Servings/Size/Units row it sits in. Tune
  // on-device if it reads too cramped or too tall in practice.
  // The unit picker's own sizing -- fills exactly whatever width its row
  // has left after its sibling's own fixed width (Servings, or the amount
  // picker beside it); height now comes from pillScroll's own fixed
  // height above regardless of how much content there is to scroll.
  // paddingVertical widened 2026-07-29 (was paddingHorizontal, back when
  // this scrolled sideways -- see renderPillPicker's own "fifth pass"
  // comment) so a real pill never scrolls in directly underneath either
  // scrollArrowBadge (a 16px badge inset 2px from the top/bottom edge
  // reaches ~18px in) -- the same reasoning as before, just rotated 90
  // degrees along with the scroll axis. paddingHorizontal shrunk back
  // down since there's no longer a left/right badge to clear.
  // pillRow / pill lived here until 2026-07-31 -- the wrapping chip grid
  // the Cooking Method step used before it became the "Cook Prep"
  // vertical spinner. Every pill in this component now goes through
  // renderPillPicker, so both are gone rather than left unreferenced.

  // The only pill style left, used inside every scrollable pill picker
  // (renderPillPicker). Its shorter paddingVertical (4, vs the 6 the old
  // wrapping `pill` used) came from the 2026-07-28 box-shrinking pass.
  // textAlign matters now that renderLabeledPicker stretches every pill to
  // the widest one's width -- without it, short options ("1/8", "Diced")
  // would sit left-aligned in a wide pill instead of centered in it.
  // Extra room above the Snack Name form's own Continue button, 2026-07-28
  // -- explicitly requested, so a scroll gesture that doesn't quite land
  // on one of the pill pickers just above it can't accidentally end on
  // top of this button instead.
  continueButtonSpacing: {
    marginTop: 28,
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton },
  // Continue's own "still missing something" look, 2026-07-28 -- dim
  // grey rather than this page's own tabColor, reading as not-quite-ready
  // without actually disabling the button (see handleContinuePress's own
  // comment for why it still needs to fire).
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 14,
    ...BUTTON_SHADOW,
  },
  primaryButtonMuted: {
    backgroundColor: colors.border,
  },
  primaryButtonTextMuted: {
    color: colors.textMuted,
  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  secondaryButtonText: { ...typography.bodyEmphasis },
  // prepNoteLabelRow lived here until 2026-08-17 -- the per-ingredient Prep
  // Notes field's own label+mic row, now gone along with that free-text
  // field itself (replaced by the shared StepsEditor's own internal Prep
  // Steps UI, see this component's own per-ingredient Prep Steps block).
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  // 2026-08-08 -- renderFavoriteToggle's own row.
  favoriteToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  favoriteToggleText: { ...typography.body, color: colors.textPrimary, flexShrink: 1 },
  // summaryCard/summaryCardSquareBottom/summaryLeftColumn/summaryDivider/
  // summaryRightColumn/summarySnackName lived here until 2026-08-17 -- the
  // old two-column (snack info | scrollable ingredients) summary card,
  // replaced by CollapsibleOverlayCard's own single-column overlay (see
  // renderSummaryCardContent's own comment) once the connected picker no
  // longer needed a fixed-height card to compute topReserve against.
  //
  // The small "‹ Cancel" link shown above the connected FoodLookup once a
  // real ingredient-source method has been chosen -- see
  // SOURCE_CANCEL_ROW_HEIGHT's own comment for why this exists and why its
  // real height matters to FoodLookup's own layout math.
  sourceCancelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    height: SOURCE_CANCEL_ROW_HEIGHT,
  },
  // "Add Ingredients," 2026-08-17 (points 3/5) -- half the width of the
  // collapsible dish/ingredients card above it, and pinned to whichever
  // side NAVIGATION_HAND says the person's own thumb naturally rests, the
  // same real hand-awareness reasoning useReorderedLabeledFields already
  // applies to the picker fields elsewhere in this file.
  addIngredientsButton: {
    width: '50%',
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: colors.surface,
  },
  addIngredientsButtonLeft: { alignSelf: 'flex-start' },
  addIngredientsButtonRight: { alignSelf: 'flex-end' },
  addIngredientsButtonText: { ...typography.bodyEmphasis },
  // A plain horizontal rule inside the collapsible card's own overlay,
  // separating the dish-info block from the Ingredients list beneath it --
  // the old summaryDivider was a vertical line between two columns; this
  // one is a real, different, horizontal divider for the new single-column
  // layout.
  overlayDivider: {
    borderTopWidth: 1,
    opacity: 0.3,
    marginVertical: 10,
  },
  // Bounded height so a long ingredient list scrolls WITHIN the collapsible
  // card's own overlay (itself already capped by CollapsibleOverlayCard's
  // own real maxHeight: '100%') rather than pushing the card's whole
  // header/collapse-button off the top of the screen.
  overlayIngredientScroll: {
    maxHeight: 260,
  },
  summaryDetailText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Edit mode's own overview screen, 2026-08-01 -- full-width equivalents
  // of summarySnackName/summaryIngredientRow/summaryRemoveButton above,
  // deliberately not reusing those directly: this screen has a whole
  // formCard's own width to work with (not summaryLeftColumnWidth's own
  // narrow half), so nothing here needs to be centered or squeezed the
  // way the connected-picker's own summary card still is.
  overviewSnackName: {
    ...typography.bodyEmphasis,
    fontSize: 17,
  },
  // 44px minHeight -- a real, comfortable touch target on its own terms
  // (not stretched thin across the whole screen width the way the old
  // half-column list was), so the trash button below has genuine room
  // without needing the narrow column's own careful row-height tuning.
  overviewIngredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  overviewIngredientTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  overviewIngredientText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  overviewRemoveButton: {
    padding: 10,
  },
  // summaryIngredientArea/summaryIngredientRow/summaryIngredientText/
  // summaryRemoveButton/summaryRemoveText/connectedPickerWrap/
  // summaryFoodText lived here until 2026-08-17 -- the old two-column
  // summary card's own ingredient list/remove button, superseded by
  // overviewIngredientRow (edit-mode overview + the new single-column
  // overlay) and recipeIngredientRow (the final review screen) below.
  summaryEmptyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryDoneRow: {
    paddingVertical: 10,
  },
  summaryDoneText: {
    ...typography.captionEmphasis,
  },
  // The final review screen's own real recipe-card-style ingredient
  // bullets, 2026-08-17 (point 7) -- matches RecipeCardDetail's own
  // real bullet-list treatment (app/(tabs)/purple-digest.tsx) rather than
  // the shorter "name — amount" rows used elsewhere in this file.
  recipeIngredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  recipeIngredientBullet: {
    ...typography.body,
    color: colors.textSecondary,
    marginRight: 6,
  },
  recipeIngredientText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  // "What This Snack Gives You" -- matches RecipeCardDetail's own real
  // nutrition callout box shape/tinting (a bordered box in this page's own
  // tabColor), not invented fresh for this screen.
  recipeNutritionBox: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  recipeNutritionLabel: {
    ...typography.eyebrow,
    marginBottom: 6,
  },
  recipeNutritionText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: 2,
  },
  recipeNutritionBold: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
  },
  // "Worth Knowing If You Have..." -- a distinctly-tinted box (colors.danger
  // border, matching RecipeCardDetail's own real condition-caution
  // treatment) so it reads as a genuinely different kind of information
  // than the nutrition box just above it.
  recipeConditionBox: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  recipeConditionLabel: {
    ...typography.eyebrow,
    marginBottom: 6,
  },
  recipeConditionCondition: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
  },
  // Food name and its warning flags on one line, flags pinned right --
  // alignItems 'flex-start' (not 'center') so the boxes stay level with
  // the FIRST line of a name that wraps to two, rather than floating to
  // the vertical middle of a tall block.
  // alignItems 'center' so the flag boxes sit level with the title text
  // rather than riding its top edge. gap trimmed to 6 now that the flags
  // follow the name directly instead of being pushed to the far edge.
  pendingFoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingFoodName: { flex: 1 },
  // "Preparation Steps for X" -- the card's own title, so it reads a step
  // up from the ordinary field labels beneath it.
  // No flex (2026-07-31): with flex: 1 this title consumed the whole row,
  // pushing the DimensionFlags boxes hard against the card's right edge
  // where they read as a stray artifact rather than a warning about this
  // food. flexShrink lets a long name still wrap instead of overflowing,
  // but the flags now sit immediately after the name they belong to.
  // colors.textSecondary, not tabColor, 2026-07-31 -- explicitly requested
  // to take the colour the removed sub-line used to have. It also reads
  // better here: this line is the card's own content, whereas tabColor is
  // used throughout the form for its *labels* and controls, so keeping the
  // title neutral stops it competing with the four field labels below it.
  pendingHeader: {
    ...typography.bodyEmphasis,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  // "Change Food", pinned above the header and left-aligned. alignSelf
  // 'flex-start' keeps its tap target tight to the text instead of
  // spanning the whole card width.
  changeFoodTop: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: 2,
    marginBottom: 6,
  },
  // Holds all four labeled pickers. flexWrap is the whole trick, 2026-07-31:
  // each field takes only the width it actually needs (see
  // renderLabeledPicker), so on a wide screen all four fit across in one
  // line, and on a narrower one they wrap to two-by-two automatically. No
  // breakpoint, no device check, no second layout to maintain -- the row
  // simply uses whatever width the phone gives it.
  //
  // Measured before committing to this, back when these four fields were
  // combination-lock wheels (2026-07-31): with "Whole" and "Raw" trimmed
  // (see CUT_PREP_METHODS/COOKING_METHODS), four across needed ~361px
  // against ~414px before the trim, moving it from "only the largest
  // phones" to "most phones," with graceful wrapping for the rest. Those
  // exact numbers are stale now that the fields are PopoverSelect's own
  // shorter chevron-style boxes (2026-08-01, narrower than a wheel's own
  // fixed frame), but the reasoning -- keep the row's own real width
  // trimmed rather than device-checking a breakpoint -- still holds.
  // space-between lived here 2026-07-31 to 2026-08-01 -- explicitly
  // reverted the same day the fields themselves gained NAVIGATION_HAND-
  // aware reordering (see useReorderedLabeledFields, this file's own
  // top). Spreading fields evenly across the row fought that reordering
  // visually: a field that just slid to the "away" end still needs to
  // read as having moved TOWARD that edge, not as one more evenly-spaced
  // item in an unchanged layout. flex-start packs every field against its
  // neighbours instead, so a reordering field visibly travels somewhere,
  // with columnGap as the only spacing between them. Still composes with
  // flexWrap the same way: each wrapped line packs its own contents
  // independently, and the two-by-two fallback on a narrow screen still
  // reads as one deliberate cluster rather than spread thin.
  labeledPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    columnGap: 6,
    // Separates the whole field group from the card header above it
    // (2026-07-31) -- stacks on top of labeledPickerField's own 12, so the
    // header now clears the first row of labels by 20 rather than sitting
    // almost on them.
    marginTop: 8,
  },
  // One label + picker stack. alignItems 'flex-start' is what lets the
  // picker box below shrink-wrap its own content rather than stretching to
  // the card's full width -- the whole width rule depends on it, and it's
  // also what lets the wrapping row above measure each field honestly.
  labeledPickerField: {
    alignItems: 'flex-start',
    marginTop: 12,
  },
  // Wrapper carrying the measured-label minWidth (applied inline). Kept
  // separate from the scroll box itself so the minWidth and the box's own
  // border/background don't fight over the same style object.
  labeledPickerBox: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  // labeledPickerScroll / labeledPickerContent lived here until
  // 2026-07-31 -- they sized the flat vertical pill scroller these four
  // fields used before the combination-lock wheel that briefly replaced
  // it. PopoverSelect (2026-08-01) owns its own field/popover layout
  // entirely, so both had no callers left.
  // The two Save buttons share the row evenly.
  splitButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...BUTTON_SHADOW,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
