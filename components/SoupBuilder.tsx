import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { KEYBOARD_HEIGHT } from '../constants/appKeyboard';
import { colors, inputBackground } from '../constants/colors';
import { SOUP_BUILDER_CATEGORIES } from '../constants/foodBuilderCategories';
import { NAVIGATION_HAND, useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import {
  getFoodIdentity,
  getFoodScores,
  getSoup,
  getSoupIngredients,
  getStoredMeasurementSystem,
  saveSoup,
  updateSoup,
  type FoodScore,
  type SoupIngredientInput,
} from '../lib/db';
import { detectMeasurementSystemFromLocale, parseAmountValue, type MeasurementSystem } from '../lib/measurement';
import { useActiveField, useActiveInputControls } from './ActiveInputContext';
import { AppTextInput } from './AppTextInput';
import { ALCOHOL_ADVISORY_MESSAGE, ALCOHOL_ADVISORY_TITLE, isAlcoholicFood } from '../lib/alcoholAdvisory';
import { DimensionFlags } from './DimensionFlags';
import { FoodLookup, type ResolvedFoodSelection } from './FoodLookup';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';

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
// titleCaseSoupName below), matching standard title-case convention.
const SOUP_NAME_MINOR_WORDS = new Set([
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
function titleCaseSoupName(text: string): string {
  let isFirstWord = true;
  return text.replace(/[A-Za-z']+/g, (word) => {
    const first = isFirstWord;
    isFirstWord = false;
    if (word.length > 1 && word === word.toUpperCase()) return word;
    const lower = word.toLowerCase();
    if (!first && SOUP_NAME_MINOR_WORDS.has(lower)) return lower;
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

// Reverses parseAmountValue for a saved soup being reopened for editing --
// the database only stores the resolved decimal (e.g. 0.5), not which pill
// ("1/2") produced it. Matches back to the closest real pill string within
// this list so the picker shows a real, previously-tappable value rather
// than a decimal that was never one of its own options; falls back to a
// plain trimmed decimal only for an amount that never came from this list
// in the first place (shouldn't happen for anything SoupBuilder itself
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

// Asked per INGREDIENT, not once for the whole soup, 2026-07-29 -- a real
// soup routinely combines ingredients that were each prepared
// completely differently (garlic added raw as a topping after the rest of
// the soup is cooked; bacon pan-fried into bits in its own separate step
// before joining sautéed beans), and cooking method genuinely changes
// nutrition (raw vs. cooked retains different nutrients), so a single
// soup-wide answer was actively wrong for any soup like that, not just
// imprecise. Required, not optional the way Soup Name is, for the same
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
// 'Simmered' added 2026-08-02 for this builder specifically -- the base
// list above is inherited from Side Builder verbatim, but real soup-making
// is defined by a long, low-heat simmer, genuinely distinct from a hard
// 'Boiled' (higher heat, more turbulent) both in technique and in how it
// affects the food (less mechanical breakdown, gentler nutrient loss).
// Placed right after 'Boiled', the option it's most easily confused with,
// rather than tacked onto the end.
const COOKING_METHODS = [
  'N/A', 'Raw', 'Sautéed', 'Pan-Fried', 'Deep-Fried', 'Steamed', 'Boiled', 'Simmered', 'Baked', 'Roasted', 'Grilled', 'Stir-fried',
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

type SoupIngredient = {
  resolved: ResolvedFoodSelection;
  quantity: string;
  unit: string;
  // How THIS ingredient will be prepared for THIS soup -- see
  // COOKING_METHODS' own comment for why this moved from a single
  // soup-wide question to a per-ingredient one. cookingMethod is required
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

// The Soup/Ingredients summary card's own fixed footprint (see its own
// render function below) -- estimated the same way every other fixed size
// in this app's own FoodLookup.tsx is (SUMMARY_ROW_HEIGHT/TITLE_HEIGHT
// there), not measured. Needs to be a real, known number for two reasons:
// it's a `height` style (so the right column's ingredient list has a
// fixed area to scroll within, matching "roughly 4 rows visible at a
// time, scrollable for more"), and it's passed to the connected
// FoodLookup below as `topReserve`, so that component's own internal
// list-height math correctly accounts for the space this card already
// took above it.
// Condensed 2026-07-28 (was 12/22/20) -- explicitly requested to shrink
// this card's own overall height, freeing more room below it for the
// connected Category/Food picker.
const SUMMARY_CARD_PADDING = 8;
// 18 -> 36, 2026-08-01 -- explicitly requested after a real mis-tap: at
// 18px, each row's remove button (see summaryRemoveButton) had no room to
// have its own real padding-based tap target without directly touching its
// neighbors above/below, which is exactly what let a tap meant for one
// ingredient catch the one next to it instead. 36px comfortably fits that
// button's own ~35px footprint (see its own comment) with a hair of real
// separation from the row above/below, still large enough as a deliberate
// trade against this card's own explicit compactness goal above.
const SUMMARY_INGREDIENT_ROW_HEIGHT = 36;
const SUMMARY_VISIBLE_INGREDIENT_ROWS = 4;
const SUMMARY_INGREDIENT_LIST_HEIGHT = SUMMARY_INGREDIENT_ROW_HEIGHT * SUMMARY_VISIBLE_INGREDIENT_ROWS;
const SUMMARY_DONE_ROW_HEIGHT = 16;
const SUMMARY_CARD_BORDER_WIDTH = 2;
const SUMMARY_CARD_HEIGHT =
  SUMMARY_INGREDIENT_LIST_HEIGHT + SUMMARY_DONE_ROW_HEIGHT + SUMMARY_CARD_PADDING * 2 + SUMMARY_CARD_BORDER_WIDTH * 2;

// Matches scrollContent/pickerScreen's own paddingHorizontal below -- both
// the summary card and the connected picker sit inside one of those two,
// so this is the real screen-edge margin either one actually has to work
// with.
const SCREEN_HORIZONTAL_PADDING = 16;
// Matches summaryLeftColumn/summaryRightColumn's own paddingRight/
// paddingLeft and summaryDivider's own width below.
const SUMMARY_COLUMN_GAP = 10;
const SUMMARY_DIVIDER_WIDTH = 1;
// How far left of dead-center the dividing line between the two columns
// sits, 2026-07-28 -- explicitly requested so the right (ingredients)
// column gets more real width than the left, enough that an added
// ingredient's own name/quantity/unit text has room to stay on one line
// rather than wrapping. Computed from the actual screen width (not a
// flex-ratio approximation) so this is a genuine, real 30px shift on every
// device, not just on whichever width it happened to be eyeballed against.
const SUMMARY_DIVIDER_SHIFT = 30;

// Builds a single soup from one or more ingredients -- Category ->
// Type (if needed) -> Food -> Prep (if needed) -> Quantity/Unit per
// ingredient, reusing FoodLookup for the selection step but with its own
// nutrient table turned off (showNutrients={false}): that information is
// already available on Insights' own Food Lookup lens, and isn't this
// screen's job to duplicate. Servings/Serving Size are asked for once, up
// front, before any ingredient picking starts.
//
// The in-progress soup (soupName/servings/ingredients/etc.) is local
// component state only, same as before -- a soup isn't a real, saved
// record until Save & Finish Soup actually commits it (see finishSoup/
// saveSoup in lib/db.ts, 2026-08-01). Navigating away from a soup mid-
// build still loses it; that's still a known, accepted gap, just a
// narrower one now that finishing a soup for real is possible.
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
// ("Soup Builder") was removed -- PageIdentityLabel's own bottom-
// corner box already names whichever builder is open, so repeating it
// here was pure duplication eating screen space for nothing. In its
// place, once Soup Name/Servings/Size is confirmed, that form splits into
// a compact two-column summary card (soup info on the left, a scrollable
// ingredient list on the right) that then connects directly (flush, square
// corners at the seam) to FoodLookup's own Category/Food picker below it
// -- the picker shows automatically the instant there's no ingredient
// currently pending confirmation, rather than needing an explicit "+ Add
// Ingredient" tap first the way this used to work.

// Created 2026-08-02 by directly adapting SideBuilder.tsx (the Food tab's
// first fully-built builder and the proven, on-device-tested pattern every
// builder is meant to follow -- see CLAUDE.md's Food tab section), same
// base Fermentation/Beverage/Snack/Baked Goods Builder used -- neither
// Salad's nor Smoothie's own raw-goitrogenic-load warning applies here. The
// comments below that carry earlier 2026-07-xx dates describe reasoning
// SideBuilder itself arrived at through real iteration -- inherited here as
// still-accurate design reasoning, not a claim that SoupBuilder went
// through that same history itself.
//
// The oil/seasoning nudge is kept unchanged (same reasoning as Snack/Baked
// Goods -- sautéed aromatics and herbs/salt are genuinely common in soup).
// One concrete addition: 'Simmered' added to this builder's own local
// COOKING_METHODS list (see that constant's own comment), the same "add the
// one real missing prep option" move Fermentation made for 'Fermented'.
//
// Deliberately does NOT attempt broth-base tracking or simmered-down
// ingredient-concentration math -- both named in this builder's own
// placeholder copy in app/(tabs)/food.tsx as "room for" future
// soup-specific handling, not something this pass builds. Concentration
// specifically would need real research (how much does a given ingredient's
// nutrient contribution change as broth reduces?) before it could be
// anything more than a guess, the same "don't invent unresearched numbers"
// reasoning that kept Fermentation Builder from attempting bacterial-strain
// scoring.
export function SoupBuilder({
  tabColor,
  // Set when reached via the Edit button on an already-saved soup (see
  // app/food-items.tsx) -- 2026-08-01. Loads that soup's real data into
  // this same builder rather than a separate edit screen, so add/remove-
  // ingredient/Cut Prep/Cook Prep all reuse the exact same, already-tested
  // machinery a fresh soup already uses. finishSoup below branches on this
  // to call updateSoup (in place) instead of saveSoup (a new row), and to
  // navigate back to the list afterward instead of resetting to blank --
  // "I fixed this soup" should return you to where you came from, not
  // drop you into building a different one.
  editSoupId,
}: {
  tabColor: string;
  editSoupId?: string;
}) {
  const router = useRouter();
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const activeField = useActiveField();
  // The summary card's own two columns' real available width -- screen
  // width minus the screen's own edge padding, the card's own border/
  // padding, and the divider plus its own two soup gaps -- split evenly,
  // then shifted SUMMARY_DIVIDER_SHIFT px toward the left column so the
  // right (ingredients) column ends up that much wider. See
  // SUMMARY_DIVIDER_SHIFT's own comment for why.
  const { width: windowWidth } = useWindowDimensions();
  const summaryColumnsWidth =
    windowWidth -
    SCREEN_HORIZONTAL_PADDING * 2 -
    SUMMARY_CARD_BORDER_WIDTH * 2 -
    SUMMARY_CARD_PADDING * 2 -
    SUMMARY_COLUMN_GAP * 2 -
    SUMMARY_DIVIDER_WIDTH;
  const summaryLeftColumnWidth = summaryColumnsWidth / 2 - SUMMARY_DIVIDER_SHIFT;
  // Extra bottom padding while the custom keyboard is up, 2026-07-28 --
  // AppKeyboard is a floating overlay, not RN's own system keyboard, so
  // there's no automatic "shrink the scrollable area" the way a real
  // keyboard gets from KeyboardAvoidingView. Without this, the ScrollView's
  // own max scroll extent stops short of accounting for the space
  // AppKeyboard covers, so content near the bottom (e.g. the Quantity
  // field itself, or Change Food/Add to Soup below it) could end up stuck
  // behind the keyboard with no way to scroll it into view. Same
  // `activeField ? KEYBOARD_HEIGHT : 0` pattern FoodLookup.tsx/Dropdown.tsx
  // already use for their own keyboard-aware sizing.
  const keyboardReserve = activeField ? KEYBOARD_HEIGHT : 0;
  const { forceClear } = useActiveInputControls();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

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
  // falls back to a plain "Soup" in the summary/ingredient views
  // (soupName.trim() || 'Soup') as a harmless extra safety net, even
  // though Continue itself should never actually let a blank one through
  // now.
  const [soupName, setSoupName] = useState('');
  // A stable function identity, 2026-07-30 -- a fresh inline arrow function
  // here (`(text) => setSoupName(titleCaseSoupName(text))`, passed directly
  // as onChangeText) gets recreated on every render, and AppTextInput's own
  // useEffect (the one that calls focusField for AppKeyboard) depends on
  // onChangeText by reference -- a changing dependency on every render
  // re-fires that effect every render, which itself triggers a state update
  // (focusField), causing another render, in an infinite loop ("Maximum
  // update depth exceeded", reported 2026-07-30). useCallback with an empty
  // dependency array keeps this one function reference stable across
  // renders (titleCaseSoupName is a plain module-level function, setSoupName
  // is already a stable state setter), breaking the loop.
  const handleSoupNameChange = useCallback((text: string) => {
    setSoupName(titleCaseSoupName(text));
  }, []);
  // No defaults, 2026-07-28 -- these started at a pre-selected "1" pill
  // originally, but that meant nothing actually required the person to
  // touch either field at all, and tapping the ALREADY-selected "1" pill
  // again does nothing (no visible change to confirm a real choice was
  // made). Explicitly corrected: every field in this whole form -- Soup
  // Name aside, which is genuinely optional -- now starts unchosen, and
  // Continue below stays disabled until all three (Servings/Size/Units)
  // are actually picked.
  const [servings, setServings] = useState<string | null>(null);
  const [servingSizeAmount, setServingSizeAmount] = useState<string | null>(null);
  const [servingSizeUnit, setServingSizeUnit] = useState<string | null>(null);
  // Drives the Continue button's own color (see its own JSX comment
  // below) -- true only once Soup Name and all three pickers are actually
  // filled in/chosen.
  const soupFormReady = !!soupName.trim() && !!servings && !!servingSizeAmount && !!servingSizeUnit;
  // Servings/Serving Size collapse to the summary card once confirmed --
  // asked for "at the beginning," not something that needs to stay an
  // open form the whole time after.
  const [servingsConfirmed, setServingsConfirmed] = useState(false);

  const [ingredients, setIngredients] = useState<SoupIngredient[]>([]);
  const [pendingResolved, setPendingResolved] = useState<ResolvedFoodSelection | null>(null);
  // The pending food's own 6-Dimension scores, fetched as soon as it
  // resolves so the color-coded warning boxes appear BEFORE the person
  // commits to adding it -- explicitly requested 2026-07-31 ("there should
  // really be an indicator for the food prior to them even adding it").
  // Carried onto the SoupIngredient at add time rather than re-fetched
  // per row (see that type's own `scores` comment).
  const [pendingScores, setPendingScores] = useState<FoodScore[]>([]);
  // No defaults -- same reasoning as servings/servingSizeAmount/
  // servingSizeUnit above. "Add to Soup" below stays disabled until
  // quantity, unit, AND ingredientCookingMethod are all chosen.
  const [quantity, setQuantity] = useState<string | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
  // Per-ingredient cooking method/prep note, 2026-07-29 -- see
  // SoupIngredient's own comment for why this replaced a single
  // soup-wide question. Reset after each "Add to Soup," same as
  // quantity/unit above, ready for the next ingredient.
  const [ingredientCookingMethod, setIngredientCookingMethod] = useState<string | null>(null);
  const [ingredientCutPrep, setIngredientCutPrep] = useState<string | null>(null);
  const [ingredientPrepNote, setIngredientPrepNote] = useState('');
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
  // NEXT ingredient after "Add to Soup," both land back on that same
  // category instead of a blank Category list -- a soup very often
  // has several ingredients from the same category (several vegetables,
  // say), and re-picking "Vegetables" every single time was real,
  // needless friction. Blank until the first food ever resolves, so the
  // very first ingredient still starts at a genuinely blank Category list.
  const [lastCategory, setLastCategory] = useState('');
  const [lastSubcategory, setLastSubcategory] = useState<string | null>(null);

  // Loads an existing soup's real data in place of the blank-builder
  // defaults above, 2026-08-01 -- runs once per editSoupId. soup_ingredients
  // only stores foodId/source, quantity/unit, cutPrep/cookingMethod/
  // prepNote, and the descriptive foodName (not base_name/prep_method), so
  // each ingredient's ResolvedFoodSelection is reconstructed from the
  // reference database itself (getFoodIdentity) -- always authoritative,
  // the same row every score/nutrient lookup already reads. Scores are
  // re-fetched live (getFoodScores) rather than cached anywhere, same as a
  // freshly-added ingredient's own pendingScores.
  useEffect(() => {
    if (!editSoupId) return;
    let isCurrent = true;

    (async () => {
      const soup = await getSoup(editSoupId);
      if (!soup || !isCurrent) return;

      const details = await getSoupIngredients(editSoupId);
      const loaded: SoupIngredient[] = [];
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
      setSoupName(soup.name);
      setServings(formatAmountForPicker(soup.servings, SERVINGS_PICKER_VALUES));
      setServingSizeAmount(formatAmountForPicker(soup.servingSizeAmount, AMOUNT_PICKER_VALUES));
      setServingSizeUnit(soup.servingSizeUnit);
      setServingsConfirmed(true);
      setIngredients(loaded);
    })();

    return () => {
      isCurrent = false;
    };
  }, [editSoupId]);

  function handleFoodResolved(resolved: ResolvedFoodSelection) {
    setPendingResolved(resolved);
    setLastCategory(resolved.category);
    setLastSubcategory(resolved.subcategory);
  }
  // Scrolled to the bottom the instant a food resolves (see the effect
  // below) -- that Quantity/Add-to-Soup card's own Quantity field
  // autoFocuses immediately, raising AppKeyboard (a real, opaque overlay
  // roughly 240px tall, see constants/appKeyboard.ts's own KEYBOARD_HEIGHT)
  // the same instant. Without scrolling, "Add to Soup" -- the very last
  // thing in this card -- could sit behind that overlay with no way to
  // reach it except an ordinary content scroll the person has no reason to
  // know they need to do first. Reported 2026-07-28 as "tapping Add to
  // Soup does nothing," which is exactly what a covered button looks like.
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
  // at all, 2026-07-29 -- it's asked per ingredient now, at "Add to Soup"
  // time (see SoupIngredient's own comment).
  const [finishStep, setFinishStep] = useState<'building' | 'reviewing'>('building');
  // Edit mode only (see editSoupId's own comment) -- whether the person has
  // actively tapped "+ Add Ingredient" on the overview screen below.
  // Create mode never reads this: its own connected picker still shows
  // automatically the instant nothing's pending, same as always (see the
  // branch ordering just above the overview screen's own render function).
  // Starts false so opening an existing soup for editing always lands on
  // the ingredient overview first, not a "pick a Category" prompt --
  // explicitly requested, since re-opening a soup is almost always to
  // review/fix what's already there, not to add something new right away.
  const [addingIngredient, setAddingIngredient] = useState(false);
  // Explicit "I looked, I meant it" override -- without this, adding the
  // missing item is the ONLY way out of 'reviewing' once something's
  // flagged, which is wrong for genuinely oil-free/seasoning-free soups
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

  // 2026-07-28 -- whichever AppTextInput was last focused (Soup Name,
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

  // Tapping Continue always fires (see primaryButtonMuted's own comment on
  // the button below for why this deliberately isn't a real `disabled`
  // TouchableOpacity) -- if something's still missing, this tells the
  // person exactly which one to fill in next, in the same top-to-bottom
  // order they appear on screen (Soup Name, then Servings, then Serving
  // Size, then Units), so only ever one message shows at a time, for
  // whichever is the FIRST thing still missing -- explicitly requested
  // 2026-07-28, including the exact wording for Soup Name/Servings; the
  // other two follow the same "Please choose/enter..." phrasing.
  function handleContinuePress() {
    if (!soupName.trim()) {
      showInfoAlert('Almost there', 'Please enter a name for this soup.');
      return;
    }
    if (!servings) {
      showInfoAlert('Almost there', 'Please choose the # of Servings this soup will contain.');
      return;
    }
    if (!servingSizeAmount) {
      showInfoAlert('Almost there', 'Please choose the Serving Size for this soup.');
      return;
    }
    if (!servingSizeUnit) {
      showInfoAlert('Almost there', 'Please choose the Units for this soup.');
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
    setIngredientPrepNote('');
  }

  // Persists the finished soup (see saveSoup/the soups/soup_ingredients
  // tables' own comments in lib/db.ts for why this is its own real,
  // standalone record -- not a favorite, not yet a logged meal) and only
  // THEN resets the builder back to a blank soup, so a save failure never
  // silently loses what was just built -- the person sees a real error and
  // keeps their in-progress soup to retry with, rather than it vanishing
  // either way.
  //
  // Takes the final ingredient list as a parameter rather than reading the
  // `ingredients` state variable, 2026-08-01: setIngredients (in
  // saveIngredient below) is an async state update, so `ingredients`
  // itself hasn't picked up the just-added one yet at the point 'finish'
  // needs to save the whole soup -- the caller builds the true final list
  // once and passes it to both setIngredients and here.
  async function finishSoup(finalIngredients: SoupIngredient[]) {
    // servingsConfirmed can only become true via handleContinuePress, which
    // already required all three of these -- this is a type-narrowing
    // guard against a state that shouldn't be reachable, not a real
    // validation path a person should ever actually hit.
    if (!servings || !servingSizeAmount || !servingSizeUnit) return;

    const ingredientInputs: SoupIngredientInput[] = finalIngredients.map((ingredient) => ({
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
    const finishedName = soupName.trim() || 'Soup';
    const payload = {
      name: finishedName,
      servings: parseAmountValue(servings),
      servingSizeAmount: parseAmountValue(servingSizeAmount),
      servingSizeUnit,
      ingredients: ingredientInputs,
    };

    try {
      if (editSoupId) {
        await updateSoup(editSoupId, payload);
      } else {
        await saveSoup(payload);
      }
    } catch (error) {
      console.error('[SoupBuilder] Failed to save soup', error);
      showInfoAlert('Save failed', 'Something went wrong saving this soup. Your ingredients are still here -- please try again.');
      return;
    }

    // Editing an already-saved soup returns to wherever it was opened from
    // (see app/food-items.tsx's Edit button, which pushed this screen) --
    // "I fixed this soup" should go back to the list, not drop the person
    // into building a brand new one. No confirmation modal here, matching
    // this app's own existing edit-save convention elsewhere (Schedule's
    // own appointment edit just closes and reloads on success, alerting
    // only on failure) -- the list itself, showing the updated
    // name/ingredient count, is the confirmation.
    if (editSoupId) {
      router.back();
      return;
    }

    // Back to a blank soup. From here the Lens Button starts a
    // different builder and the Butterfly Button leaves the tab, so no
    // extra "what now?" step is needed.
    setIngredients([]);
    setSoupName('');
    setServings(null);
    setServingSizeAmount(null);
    setServingSizeUnit(null);
    setServingsConfirmed(false);
    setFinishStep('building');
    setNudgeDismissed(false);
    showInfoAlert('Soup saved', `${finishedName} is saved. Starting a fresh soup now.`);
  }

  // Commits the pending ingredient, then either loops back for another one
  // or ends the soup entirely -- 2026-07-31, the two Save buttons.
  //
  //   'add-new' -> back to picking a Food Category, then a food, and round
  //                again, indefinitely, until the person chooses 'finish'.
  //   'finish'  -> saves the whole soup (see finishSoup above) and resets
  //                the builder to a blank new soup.
  function saveIngredient(then: 'add-new' | 'finish') {
    if (!pendingResolved || !quantity || !unit || !ingredientCutPrep || !ingredientCookingMethod) {
      // Names only what's actually still missing, in the order the fields
      // appear on screen -- same approach as the soup form's own Continue.
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
    const newIngredient: SoupIngredient = {
      resolved: pendingResolved,
      quantity,
      unit,
      cookingMethod: ingredientCookingMethod,
      cutPrep: ingredientCutPrep,
      prepNote: ingredientPrepNote.trim(),
      scores: pendingScores,
    };
    const allIngredients = [...ingredients, newIngredient];
    setIngredients(allIngredients);
    resetIngredientFields();

    if (editSoupId) {
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
      void finishSoup(allIngredients);
    }
  }

  function removeIngredient(index: number) {
    setIngredients((current) => current.filter((_, i) => i !== index));
  }

  // Confirms before actually removing, 2026-08-01 -- explicitly requested
  // after a real mis-tap deleted the wrong ingredient from an already-saved
  // soup (the small X row-remove buttons, packed close together in this
  // card's own narrow column, made it easy to catch the neighboring row by
  // mistake -- see summaryIngredientRow/summaryRemoveButton's own comments
  // for the size fix that goes with this). Same Cancel/destructive Alert
  // pattern already used elsewhere in this app (e.g. Schedule's own
  // appointment removal) -- a real "cancel instead" now exists, rather than
  // relying on re-adding a wrongly-removed ingredient by hand.
  function confirmRemoveIngredient(index: number) {
    const ingredient = ingredients[index];
    Alert.alert(`Remove ${ingredient.resolved.baseName}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeIngredient(index) },
    ]);
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

  // The Soup/Ingredients summary card -- soup name/servings/size on the
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
          />
        </View>
      </View>
    );
  }

  function renderSummaryCard(squareBottom: boolean) {
    return (
      <View
        style={[styles.summaryCard, { borderColor: tabColor }, squareBottom ? styles.summaryCardSquareBottom : null]}
      >
        <TouchableOpacity
          style={[styles.summaryLeftColumn, { width: summaryLeftColumnWidth }]}
          onPress={() => {
            dismissKeyboard();
            setServingsConfirmed(false);
          }}
        >
          <Text style={[styles.summarySoupName, { color: tabColor }]} numberOfLines={2}>
            {soupName.trim() || 'Soup'}
          </Text>
          <Text style={styles.summaryDetailText} numberOfLines={1}>
            Serves {servings || '?'}
          </Text>
          <Text style={styles.summaryDetailText} numberOfLines={1}>
            {servingSizeAmount || '?'} {servingSizeUnit ?? '?'} / serving
          </Text>
        </TouchableOpacity>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRightColumn}>
          {ingredients.length > 0 ? (
            <ScrollView style={styles.summaryIngredientArea} showsVerticalScrollIndicator={false}>
              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.summaryIngredientRow}>
                  {/* Name + amount only, 2026-07-31 -- explicitly reduced
                      from the previous line that also spelled out cooking
                      method and prep note inline. Those are still stored on
                      the ingredient (and still shown at add time); they
                      were just crowding the one place this list needs to
                      stay scannable. What replaces them is the 6-Dimension
                      warning flags on the right: name, how much, and
                      whether it's a known worry, per the requested
                      "name / amount / color coding" shape.

                      No numberOfLines cap -- summaryIngredientRow's own
                      minHeight grows to fit whichever names actually wrap,
                      rather than clipping with "…". */}
                  <Text style={styles.summaryIngredientText}>
                    {ingredient.resolved.baseName} — {ingredient.quantity} {ingredient.unit}
                  </Text>
                  <DimensionFlags scores={ingredient.scores} onExplain={showInfoAlert} />
                  {/* Real padding, not hitSlop, 2026-08-01 -- see
                      summaryRemoveButton's own comment for why: hitSlop
                      extends a button's tap area without reserving any
                      actual layout space, so in a tightly stacked list like
                      this one, two rows' hitSlop zones can overlap and
                      swallow a tap meant for the neighboring row's own X --
                      confirmed as the real cause of a reported mis-tap.
                      Padding instead grows the row's own real height
                      (summaryIngredientRow's minHeight was raised to
                      match), which can't overlap a sibling row the same
                      way. */}
                  <TouchableOpacity style={styles.summaryRemoveButton} onPress={() => confirmRemoveIngredient(index)}>
                    <Text style={[styles.summaryRemoveText, { color: tabColor }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.summaryIngredientArea}>
              <Text style={styles.summaryEmptyText}>No ingredients yet</Text>
            </View>
          )}
          <View style={styles.summaryDoneRow}>
            {/* Edit mode: this card only ever shows while addingIngredient
                is true (mid "+ Add Ingredient"), so its own escape hatch
                goes back to the overview screen instead of create mode's
                "reviewing" step -- that ready-screen/missingExtras flow
                doesn't exist for edit mode at all (see the overview
                branch's own comment), so leaving this pointed at
                setFinishStep('reviewing') would have dropped an edit-mode
                person into a dead-end. Shown even with zero ingredients
                added yet in edit mode (unlike create mode's own
                ingredients.length > 0 gate) -- a soup being edited already
                has ingredients by definition, so "back out without
                picking a new one" should always be available here. */}
            {editSoupId ? (
              <TouchableOpacity
                onPress={() => {
                  dismissKeyboard();
                  setAddingIngredient(false);
                }}
              >
                <Text style={[styles.summaryDoneText, { color: tabColor }]}>← Back to overview</Text>
              </TouchableOpacity>
            ) : ingredients.length > 0 && finishStep === 'building' ? (
              <TouchableOpacity
                onPress={() => {
                  dismissKeyboard();
                  setFinishStep('reviewing');
                }}
              >
                <Text style={[styles.summaryDoneText, { color: tabColor }]}>Done adding ingredients →</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  // Called unconditionally, here, rather than inline where each row
  // actually renders below -- both rows sit inside conditional branches
  // (the soup-name row only shows while !servingsConfirmed; the ingredient
  // row only once pendingResolved is set), and useReorderedLabeledFields is
  // a real hook (it holds its own useRef), so calling it from inside either
  // branch would violate the rule that every hook fires on every render.
  // Computing both up front costs nothing when a given row isn't currently
  // showing -- the unused array is just discarded.
  const soupFormFields = useReorderedLabeledFields([
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
  // requested: reopening an already-saved soup to fix something shouldn't
  // assume the next thing wanted is picking a whole new Category. Landing
  // here by default (addingIngredient starts false) shows the soup info
  // and every current ingredient, each with a real trash-can button (not
  // the small ✕ the connected picker's own summary card below still uses
  // mid-add -- see that button's own comment for why THAT one stays small,
  // and confirmRemoveIngredient for the same Cancel/Remove confirmation
  // both share). Tapping "+ Add Ingredient" is the only way into the
  // connected picker below now, for edit mode specifically -- create mode
  // is completely untouched, still showing that picker automatically
  // (see the very next branch, whose own condition this one intercepts
  // ahead of only when editSoupId is set).
  if (editSoupId && servingsConfirmed && !pendingResolved && !addingIngredient) {
    return (
      <>
        {infoAlertElement}
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
          <TouchableOpacity
            style={[styles.formCard, { borderColor: tabColor }]}
            onPress={() => {
              dismissKeyboard();
              setServingsConfirmed(false);
            }}
          >
            <Text style={[styles.overviewSoupName, { color: tabColor }]} numberOfLines={2}>
              {soupName.trim() || 'Soup'}
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

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tabColor }]} onPress={() => void finishSoup(ingredients)}>
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
  // Continue, and again right after each "Add to Soup") -- no separate
  // "+ Add Ingredient" tap needed anymore.
  if (servingsConfirmed && finishStep === 'building' && !pendingResolved) {
    // Collapses the summary card while the food-search keyboard is up,
    // 2026-08-01 -- explicitly reported: with the card's own real height
    // (raised for bigger ingredient-removal tap targets, see
    // SUMMARY_INGREDIENT_ROW_HEIGHT's own comment) plus AppKeyboard on top
    // of it, the food list below had barely any visible room to scroll or
    // tap a real result. `activeField` (already tracked for this
    // component's own keyboardReserve) is a reliable signal specifically
    // for this branch -- the only focusable field rendered here at all is
    // FoodLookup's own search box, so it being focused really does mean
    // "actively searching." topReserve drops to 0 in lockstep (FoodLookup
    // already defaults to 0 there, so this is just handing it the same
    // value explicitly) so its own internal list-height math immediately
    // reclaims the freed space rather than leaving a gap where the card
    // used to be.
    //
    // Deliberately plain Views, not Animated.View/entering/exiting/layout
    // transitions (tried first, reverted the same day) -- the search box
    // that's supposed to auto-focus the instant this step is reached lives
    // in AppKeyboard.tsx (a root-level sibling, via its own real
    // React Native TextInput autoFocus prop), and wrapping this branch's
    // own re-render in a Reanimated layout transition made that autoFocus
    // stop firing reliably -- reported directly ("tap the [Type] link,
    // list doesn't drop down and keyboard doesn't come up"). An instant
    // snap is a smaller cost than breaking the auto-focus this whole fix
    // depends on to be useful without an extra manual tap.
    const searching = !!activeField;
    return (
      <View style={styles.pickerScreen}>
        {searching ? null : renderSummaryCard(true)}
        <View style={styles.connectedPickerWrap}>
          <FoodLookup
            tabColor={tabColor}
            showNutrients={false}
            onFoodResolved={handleFoodResolved}
            squareTop={!searching}
            topReserve={searching ? 0 : SUMMARY_CARD_HEIGHT}
            initialCategory={lastCategory}
            initialSubcategory={lastSubcategory}
            allowedCategories={SOUP_BUILDER_CATEGORIES}
          />
        </View>
      </View>
    );
  }

  return (
    <>
      {infoAlertElement}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding + keyboardReserve }]}
      >
      {!servingsConfirmed ? (
        <View style={[styles.formCard, { borderColor: tabColor }]}>
          {/* Soup Name, 2026-07-28 -- its own full-width field above
              Servings/Size, since it's not part of either's own row/
              column pairing and applies to the soup as a whole. */}
          <Text style={[styles.formLabel, { color: tabColor }]}>Soup Name</Text>
          <AppTextInput
            style={[styles.formInput, { backgroundColor: inputBackground(tabColor) }]}
            value={soupName}
            onChangeText={handleSoupNameChange}
            placeholder="e.g., Chicken Vegetable Soup"
            // The first thing this screen asks for -- focused and ready to
            // type into the instant it opens (AppKeyboard rises
            // automatically the same way it would from a real tap, see
            // AppTextInput's own onFocus handling) rather than leaving the
            // person to notice and tap the field themselves first.
            autoFocus
          />

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
            {soupFormFields.map((field) => (
              <Animated.View key={field.label} layout={LinearTransition}>
                {renderLabeledPicker(field.label, field.options, field.selected, field.onSelect)}
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
              soupFormReady ? { backgroundColor: tabColor } : styles.primaryButtonMuted,
            ]}
            onPress={handleContinuePress}
          >
            <Text style={[styles.primaryButtonText, !soupFormReady && styles.primaryButtonTextMuted]}>Continue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {renderSummaryCard(false)}

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
                  correct them). titleCaseSoupName is the same helper the
                  Soup Name field uses, so the two can't drift apart. */}
              <View style={styles.pendingFoodRow}>
                {/* foodSummary()'s preparation-state qualifier is folded into
                    this one line, 2026-07-31 -- the separate sub-line that
                    used to repeat the food name below was removed as
                    redundant, but it also carried that qualifier (e.g.
                    "Beans (Boiled)"), which really does disambiguate which
                    database row was matched. Appending it here keeps that
                    information without a second line. */}
                <Text style={styles.pendingHeader} numberOfLines={2}>
                  Preparation Steps for {titleCaseSoupName(foodSummary(pendingResolved))}
                </Text>
                {/* The pre-add indicator -- flags show HERE, while the
                    person is still deciding, not only after the food has
                    already joined the list. Renders nothing while scores
                    are still loading or when there's no flagged
                    sub-criterion. */}
                <DimensionFlags scores={pendingScores} onExplain={showInfoAlert} size={14} />
              </View>
              {/* Informational, not gating -- see lib/alcoholAdvisory.ts's
                  own top comment for why this is a separate mechanism from
                  DimensionFlags rather than a new D1-D6 sub-criterion. */}
              {isAlcoholicFood(pendingResolved) && (
                <TouchableOpacity
                  style={[styles.alcoholAdvisoryRow, { borderColor: tabColor }]}
                  onPress={() => showInfoAlert(ALCOHOL_ADVISORY_TITLE, ALCOHOL_ADVISORY_MESSAGE)}
                >
                  <Ionicons name="information-circle-outline" size={16} color={tabColor} />
                  <Text style={[styles.alcoholAdvisoryText, { color: tabColor }]}>Alcohol & Hashimoto’s -- tap to learn more</Text>
                </TouchableOpacity>
              )}
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
                  own nutrition, so a soup built without them can't be
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
              <Text style={[styles.formLabel, { color: tabColor, marginTop: 7 }]}>Prep Notes (optional)</Text>
              <AppTextInput
                style={[styles.formInput, { backgroundColor: inputBackground(tabColor) }]}
                value={ingredientPrepNote}
                onChangeText={setIngredientPrepNote}
                placeholder="e.g., 1-inch pieces, added after cooking"
                multiline
                // Lifts this field AND the Save buttons below it clear of
                // the App Keyboard, 2026-07-31. The page already reserves
                // KEYBOARD_HEIGHT of bottom padding whenever a field is
                // focused (see keyboardReserve), so scrolling to the end
                // puts the true bottom of the card just above the keys --
                // padding alone only made the room, it never moved the view
                // into it, so the note field and both buttons sat behind
                // the keyboard.
                //
                // Deferred a frame rather than run inline: focus and the
                // padding change commit in the same pass, and scrolling
                // before that new padding exists lands short of the real
                // bottom.
                onFocus={() => {
                  requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
                }}
              />

              {/* Edit mode: one "Save Ingredient" button -- 'add-new' vs.
                  'finish' no longer mean different things here (see
                  saveIngredient's own editSoupId branch: both just commit
                  this ingredient and return to the overview screen), so
                  showing a two-button split that used to mean "add
                  another" vs. "finish the whole soup" would just be
                  confusing now that finishing/persisting happens from the
                  overview instead. Create mode keeps the original Save &
                  Add New (left) / Save & Finish Soup (right) pair,
                  2026-07-31 -- replaces the old Change Food + Add to Soup
                  pair, unchanged. Both stay muted (not `disabled`) until
                  every required field is chosen, the same pattern as the
                  soup form's own Continue button -- a truly disabled
                  button can't explain what's missing, so these always fire
                  and the handler decides. */}
              <View style={styles.buttonRow}>
                {editSoupId ? (
                  <TouchableOpacity
                    style={[styles.splitButton, ingredientReady ? { backgroundColor: tabColor } : styles.primaryButtonMuted]}
                    onPress={() => saveIngredient('add-new')}
                  >
                    <Text style={[styles.primaryButtonText, !ingredientReady && styles.primaryButtonTextMuted]}>
                      Save Ingredient
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.splitButton, ingredientReady ? { backgroundColor: tabColor } : styles.primaryButtonMuted]}
                      onPress={() => saveIngredient('add-new')}
                    >
                      <Text style={[styles.primaryButtonText, !ingredientReady && styles.primaryButtonTextMuted]}>
                        Save &amp; Add New
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.splitButton, ingredientReady ? { backgroundColor: tabColor } : styles.primaryButtonMuted]}
                      onPress={() => saveIngredient('finish')}
                    >
                      <Text style={[styles.primaryButtonText, !ingredientReady && styles.primaryButtonTextMuted]}>
                        Save &amp; Finish Soup
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ) : missingExtras.length > 0 && !nudgeDismissed ? (
            // Soft nudge, 2026-07-28 -- never blocks finishing (see
            // nudgeDismissed's own comment above): plenty of real soups
            // genuinely have no oil or seasoning. Recomputed live
            // from `ingredients` every render, so adding the missing
            // item via the connected picker (back in 'building') clears
            // its own mention here automatically, no separate
            // acknowledgement needed.
            <View style={[styles.formCard, { borderColor: tabColor }]}>
              <Text style={styles.emptyText}>
                No {missingExtras.map((extra) => extra.label).join(' or ')} logged for this soup yet.
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
                  style={[styles.primaryButton, { backgroundColor: tabColor }]}
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
            // Reached via "Done adding ingredients" with no ingredient
            // currently pending and the extras nudge already satisfied/
            // dismissed -- previously a dead end (a "ready" message with no
            // way to actually finish from here; the only working Save &
            // Finish button lived on the pending-ingredient card above,
            // which doesn't exist in this branch). finishSoup is called
            // directly here, not via saveIngredient('finish') -- that
            // function's whole job is committing a NEW pending ingredient
            // first, and there isn't one to commit at this point; every
            // ingredient is already in `ingredients`.
            <View style={[styles.formCard, { borderColor: tabColor }]}>
              <Text style={styles.emptyText}>
                {(soupName.trim() || 'Soup')} ready -- {ingredients.length} ingredient
                {ingredients.length === 1 ? '' : 's'}.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: tabColor }]}
                onPress={() => void finishSoup(ingredients)}
              >
                <Text style={styles.primaryButtonText}>{editSoupId ? 'Save Changes' : 'Save & Finish Soup'}</Text>
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
  // Extra room above the Soup Name form's own Continue button, 2026-07-28
  // -- explicitly requested, so a scroll gesture that doesn't quite land
  // on one of the pill pickers just above it can't accidentally end on
  // top of this button instead.
  continueButtonSpacing: {
    marginTop: 28,
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnPrimary },
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
  // marginTop 16 (2026-07-31): the Save buttons sat flush against the Prep
  // Notes box, reading as one attached control group. This separates them
  // so the buttons act on the whole card rather than looking like they
  // belong to the note field.
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  // Two columns (soup info, scrollable ingredients) divided by a thin
  // line -- see renderSummaryCard's own comment. A fixed `height`
  // (SUMMARY_CARD_HEIGHT), not content-sized: both so the left/right
  // columns always look proportionate to each other regardless of how
  // much ingredient text is in the right one, and so the connected
  // FoodLookup below (in the picker branch) can be told exactly how much
  // space this card already used via `topReserve`.
  summaryCard: {
    flexDirection: 'row',
    borderWidth: SUMMARY_CARD_BORDER_WIDTH,
    borderRadius: 10,
    backgroundColor: colors.surface,
    padding: SUMMARY_CARD_PADDING,
    height: SUMMARY_CARD_HEIGHT,
  },
  // Applied only while the connected Category/Food picker sits directly
  // beneath this card (see FoodLookup's own `squareTop` prop) -- squares
  // off just the bottom two corners so the two boxes' borders meet as one
  // continuous seam instead of a rounded corner poking out next to a
  // square one.
  summaryCardSquareBottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  // `width` set inline (summaryLeftColumnWidth) -- not flex: 1, which would
  // override that explicit width (flex's own default flexBasis: 0%
  // otherwise wins) -- flexShrink: 0 just guarantees it never gets
  // squeezed narrower than that computed width either.
  //
  // justifyContent: 'flex-start' (was 'center') + alignItems: 'center',
  // 2026-07-28, explicitly requested -- soup name pinned to the top of
  // this column, Serves/serving-size lines stacked below it, everything
  // horizontally centered rather than left-aligned.
  summaryLeftColumn: {
    flexShrink: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingRight: SUMMARY_COLUMN_GAP,
  },
  summaryDivider: {
    width: SUMMARY_DIVIDER_WIDTH,
    backgroundColor: colors.border,
  },
  // flex: 1 -- fills whatever's left of the row after the left column's
  // own explicit width and the divider, which is exactly how
  // SUMMARY_DIVIDER_SHIFT gives this column its extra width without this
  // column needing its own computed number.
  summaryRightColumn: {
    flex: 1,
    paddingLeft: SUMMARY_COLUMN_GAP,
    justifyContent: 'space-between',
  },
  // Deliberately modest, matching PageIdentityLabel's own bottom-corner
  // box (typography.caption, not something bigger) -- explicitly asked
  // for 2026-07-28: this card's own text shouldn't compete for space with
  // the ingredient list it's meant to make room for.
  //
  // textAlign: 'center' -- pairs with numberOfLines={2} at the render
  // site (was 1), explicitly requested so a longer soup name wraps to a
  // second row instead of truncating with "…"; without this, a wrapped
  // two-line name would have each line left-aligned relative to the
  // other despite summaryLeftColumn's own alignItems: 'center' centering
  // the wrapped block as a whole.
  summarySoupName: {
    ...typography.captionEmphasis,
    textAlign: 'center',
  },
  summaryDetailText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Edit mode's own overview screen, 2026-08-01 -- full-width equivalents
  // of summarySoupName/summaryIngredientRow/summaryRemoveButton above,
  // deliberately not reusing those directly: this screen has a whole
  // formCard's own width to work with (not summaryLeftColumnWidth's own
  // narrow half), so nothing here needs to be centered or squeezed the
  // way the connected-picker's own summary card still is.
  overviewSoupName: {
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
  // Fixed height (SUMMARY_INGREDIENT_LIST_HEIGHT, ~4 rows) whether showing
  // the real scrollable list or the empty-state placeholder -- keeps the
  // card's own total height constant regardless of how many ingredients
  // are in it.
  summaryIngredientArea: {
    height: SUMMARY_INGREDIENT_LIST_HEIGHT,
  },
  // minHeight, not a fixed height, 2026-07-28 -- pairs with
  // summaryIngredientText's own dropped numberOfLines cap: an ingredient
  // whose name/prep/quantity/unit together run past one line now wraps
  // and grows this row taller instead of getting clipped or overlapping
  // the row below it. Still starts at SUMMARY_INGREDIENT_ROW_HEIGHT for
  // anything short enough to fit on one line, matching the original "~4
  // rows visible" estimate for the common case.
  summaryIngredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: SUMMARY_INGREDIENT_ROW_HEIGHT,
  },
  summaryIngredientText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  // Real padding (not hitSlop) around the glyph -- see this button's own
  // JSX comment for why. ~36x36 total tap target (glyph + padding),
  // comfortably clear of a normal fingertip, well inside the row height
  // below so two rows' own buttons can't overlap.
  summaryRemoveButton: {
    padding: 10,
  },
  summaryRemoveText: {
    ...typography.captionEmphasis,
    fontSize: 15,
  },
  summaryEmptyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryDoneRow: {
    height: SUMMARY_DONE_ROW_HEIGHT,
    justifyContent: 'center',
  },
  summaryDoneText: {
    ...typography.captionEmphasis,
  },
  // Pulls the connected FoodLookup up so its own top border overlaps
  // (rather than sits below) the summary card's own bottom border --
  // exactly one border width, so the two read as a single shared line
  // instead of a doubled-up seam.
  connectedPickerWrap: {
    marginTop: -SUMMARY_CARD_BORDER_WIDTH,
  },
  summaryFoodText: {
    ...typography.body,
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
  // Informational tap target, not a warning -- deliberately not
  // colors.danger/statusYellow (DimensionFlags' own palette), since the
  // content itself is a real, honestly-mixed case, not a one-sided alert.
  // Uses tabColor, the same "this is interactive" signal PopoverSelect's
  // own chevron already gives.
  alcoholAdvisoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  alcoholAdvisoryText: { ...typography.caption },
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
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
