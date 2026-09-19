// One recipe, shown in full: diet tags, yield, every ingredient with its
// measurement and prep, the numbered steps, what the dish gives you
// nutritionally, any condition caution, and the flavor palette.
//
// Lifted out of app/(tabs)/purple-digest.tsx on 2026-09-18, direct
// instruction: "I would like the System recipes from Digest to move to
// Food on the Food page and be access from System Meals, but change
// System Meals to System Recipes... it expands to show everything it
// would have shown from when it was listed in Digest. The recipe, the
// measurements, the prepwork, everything."
//
// Every piece of it is the Digest's own code, unchanged in what it
// renders. The one thing that had to become a parameter is color: the
// Digest paints this purple and Food paints it green, so tabColor and
// tabTextColor come in as props and the stylesheet is built from them
// rather than read from a module constant. Two colors in, one recipe
// card out, so neither tab can quietly grow a different-looking recipe
// than the other.
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useInfoAlert } from './InfoAlert';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { getCuratedRecipe, getUserProfile, type BuilderFavoriteItemType } from '../lib/db';
import { findDigestEntryById } from '../lib/digest';
import {
  isProblemFoodEntry,
  RECIPE_DIET_TAGS,
  type RecipeCard,
  type RecipeDietTag,
} from '../lib/digest/types';
import { getPhotoForTarget } from '../lib/mealPhotos';
import { shareFileIfAvailable } from '../lib/nativeSharing';
import { encodeShareLinkFromCuratedRecipe, writeIsFileForCuratedRecipe } from '../lib/sharing';

// A recipe's linkedBuilderType maps onto one param per builder in
// app/(tabs)/food.tsx (openSideRecipeId, openSaladRecipeId, and so on),
// the per-builder-named-param convention editSideId/fromSideFavoriteId
// already use there. Whatever opens a recipe for editing reads this to
// know which param to push.
export const RECIPE_BUILDER_PARAM: Record<BuilderFavoriteItemType, string> = {
  side: 'openSideRecipeId',
  salad: 'openSaladRecipeId',
  smoothie: 'openSmoothieRecipeId',
  fermentation: 'openFermentationRecipeId',
  beverage: 'openBeverageRecipeId',
  snack: 'openSnackRecipeId',
  bakedGoods: 'openBakedGoodsRecipeId',
  soup: 'openSoupRecipeId',
  sauce: 'openSauceRecipeId',
  handheld: 'openHandheldRecipeId',
  dessert: 'openDessertRecipeId',
};

// A conditionNotes entry names its condition in prose rather than by
// code, and the prose varies: some notes cover several conditions in one
// label ("Type 2 Diabetes / PCOS"), and some use a shorter form than the
// Digest's canonical label ("Hashimoto's" alone, not "Hashimoto's
// Disease"). Each keyword here is the shortest substring confirmed to
// appear in every variant in use, so a substring check catches all of
// them without needing an exact match.
const CONDITION_NOTE_KEYWORDS: Record<string, string> = {
  hashimotos: 'Hashimoto',
  graves: 'Graves',
  celiac: 'Celiac',
  chronic_kidney_disease: 'Chronic Kidney Disease',
  gout: 'Gout',
  ibd: 'Inflammatory Bowel Disease',
  ibs: 'Irritable Bowel Syndrome',
  migraine: 'Migraine',
  type_1_diabetes: 'Type 1 Diabetes',
  type_2_diabetes: 'Type 2 Diabetes',
  pcos: 'PCOS',
  rheumatoid_arthritis: 'Rheumatoid Arthritis',
  psoriasis: 'Psoriasis',
  multiple_sclerosis: 'Multiple Sclerosis',
  lupus: 'Lupus',
  sjogrens: 'Sjögren',
  fatty_liver_disease: 'Fatty Liver',
  cardiovascular_disease: 'Cardiovascular',
  prostate_health: 'Prostate',
};

// Whether one conditionNotes entry belongs on the active condition's
// page. No active condition (plain recipe browsing, which is every
// recipe opened from Food) shows everything. Once scoped: a note that
// names none of the 19 tracked conditions ("Pregnancy," "Anyone taking
// levothyroxine," "Any autoimmune condition") is a general caution
// rather than a warning about some other condition, so it still shows
// everywhere. Only a note that does name specific conditions gets
// scoped to those.
export function conditionNoteAppliesTo(noteConditionText: string, activeConditionCode?: string): boolean {
  if (!activeConditionCode) return true;
  const mentioned = Object.entries(CONDITION_NOTE_KEYWORDS).filter(([, keyword]) => noteConditionText.includes(keyword));
  if (mentioned.length === 0) return true;
  return mentioned.some(([code]) => code === activeConditionCode);
}

// The Digest entry each diet tag explains, so every one of the 10
// RecipeDietTag values has a destination rather than five working links
// and five dead ends.
const DIET_TAG_ENTRY_ID: Record<RecipeDietTag, string> = {
  Vegan: 'diet-vegan',
  Vegetarian: 'diet-vegetarian',
  Omnivore: 'diet-omnivore',
  'Plant-Based/Flexitarian': 'diet-plant-based-flexitarian',
  Mediterranean: 'diet-mediterranean',
  'Gluten-Free': 'diet-gluten-free',
  'Dairy-Free': 'diet-dairy-free',
  Paleo: 'diet-paleo',
  AIP: 'diet-aip',
  'High-Protein': 'diet-high-protein',
};

type RecipeStyles = ReturnType<typeof makeRecipeStyles>;

function RecipeDietTagRow({
  tags,
  onExplainDiet,
  styles,
}: {
  tags: RecipeDietTag[];
  onExplainDiet: (tag: RecipeDietTag) => void;
  styles: RecipeStyles;
}) {
  if (tags.length === 0) return null;
  const ordered = [...tags].sort((a, b) => RECIPE_DIET_TAGS.indexOf(a) - RECIPE_DIET_TAGS.indexOf(b));
  return (
    <View style={styles.dietTagRow}>
      {ordered.map((tag) => (
        <TouchableOpacity key={tag} style={styles.dietTagPill} onPress={() => onExplainDiet(tag)} activeOpacity={0.75}>
          <Text style={styles.dietTagPillText}>{tag}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function RecipeDetailCard({
  card,
  tabColor,
  tabTextColor,
  activeConditionCaution,
  activeConditionSeverity,
  activeConditionCode,
}: {
  card: RecipeCard;
  tabColor: string;
  // The shade used wherever tabColor would paint text rather than a fill,
  // border or icon. The Digest's purple is too dark to read as text and
  // has a lighter partner; Food's green is already light enough to pass
  // the same color in twice.
  tabTextColor: string;
  // The one caution for whichever condition's page this recipe was
  // opened from. Undefined everywhere else, including all browsing from
  // Food, where no single condition context exists. Kept separate from
  // the "Worth knowing if you have..." box below (which lists every
  // condition's note at once) rather than folded into it: a
  // mechanically generated caution for all 19 conditions in that
  // always-visible box would bury the hand-written notes already there.
  activeConditionCaution?: string;
  // Colors and labels the caution box by how serious the flag is, rather
  // than one treatment for everything from a mild sodium note to an
  // absolute gluten hit. 'green' never reaches here, since a clean
  // recipe has no activeConditionCaution to show.
  activeConditionSeverity?: 'green' | 'yellow' | 'red';
  // Scopes the "Worth knowing if you have..." box through
  // conditionNoteAppliesTo, so a condition page never shows warnings
  // that belong to other conditions.
  activeConditionCode?: string;
}) {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const styles = useMemo(() => makeRecipeStyles(tabColor, tabTextColor), [tabColor, tabTextColor]);

  // Opens the Digest entry for the tapped diet in the same overlay this
  // app uses for tap-to-explain content elsewhere. Getting back to the
  // recipe is closing it.
  function explainDietTag(tag: RecipeDietTag) {
    const entry = findDigestEntryById(DIET_TAG_ENTRY_ID[tag]);
    if (!entry || isProblemFoodEntry(entry)) {
      showInfoAlert(tag, 'No further explanation is available for this diet type yet.');
      return;
    }
    const parts = [entry.summary];
    if (entry.citations.length > 0) {
      parts.push(`Source${entry.citations.length > 1 ? 's' : ''}:\n${entry.citations.map((c) => c.source).join('\n')}`);
    }
    showInfoAlert(entry.title, parts.join('\n\n'));
  }

  const scopedNotes = card.conditionNotes.filter((note) => conditionNoteAppliesTo(note.condition, activeConditionCode));

  return (
    <View>
      {infoAlertElement}
      {card.dietTags ? <RecipeDietTagRow tags={card.dietTags} onExplainDiet={explainDietTag} styles={styles} /> : null}

      {activeConditionCaution ? (
        <View style={activeConditionSeverity === 'red' ? styles.recipeConditionBoxRed : styles.recipeConditionBoxYellow}>
          <Text style={activeConditionSeverity === 'red' ? styles.recipeConditionLabelRed : styles.recipeConditionLabelYellow}>
            {activeConditionSeverity === 'red' ? 'Approach with caution' : 'Worth knowing'}
          </Text>
          <Text style={styles.recipeNutritionText}>{activeConditionCaution}</Text>
        </View>
      ) : null}

      <Text style={styles.detailLabel}>Makes</Text>
      <Text style={styles.detailText}>{card.yield}</Text>

      <Text style={styles.detailLabel}>Ingredients</Text>
      {card.ingredients.map((ingredient, index) => (
        <Text key={index} style={styles.swapText}>
          {'•'} {ingredient.text}
        </Text>
      ))}

      {card.instructions ? (
        <>
          <Text style={styles.detailLabel}>How to make it</Text>
          {card.instructions.map((step, index) => (
            <Text key={index} style={styles.recipeStepText}>
              {index + 1}. {step}
            </Text>
          ))}
        </>
      ) : null}

      <View style={styles.recipeNutritionBox}>
        <Text style={styles.recipeNutritionLabel}>What this dish gives you</Text>
        {card.nutritionHighlights.map((highlight, index) => (
          <Text key={index} style={styles.recipeNutritionText}>
            {'•'} <Text style={styles.detailTextEmphasis}>{highlight.nutrient}:</Text> {highlight.note}
          </Text>
        ))}
      </View>

      {scopedNotes.length > 0 ? (
        <View style={styles.recipeConditionBox}>
          <Text style={styles.recipeConditionLabel}>Worth knowing if you have...</Text>
          {scopedNotes.map((note, index) => (
            <View key={index} style={index > 0 ? styles.recipeConditionItemSpaced : undefined}>
              <Text style={styles.recipeConditionCondition}>{note.condition}</Text>
              <Text style={styles.recipeNutritionText}>{note.note}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {card.flavorNotes ? (
        <>
          <Text style={styles.detailLabel}>Flavor palette</Text>
          <Text style={styles.detailText}>{card.flavorNotes}</Text>
        </>
      ) : null}
    </View>
  );
}

// A curated recipe has no user-owned componentId to key a share off, so
// it gets this small separate button rather than going through the
// Schedule/Share row a saved or favorited item uses.
export function CuratedRecipeShareButton({
  recipeId,
  builderType,
  tabColor,
}: {
  recipeId: string;
  builderType: BuilderFavoriteItemType;
  tabColor: string;
}) {
  const [sharing, setSharing] = useState(false);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const styles = useMemo(() => makeRecipeStyles(tabColor, tabColor), [tabColor]);

  async function handleShare() {
    setSharing(true);
    try {
      const profile = await getUserProfile();
      const fromName = profile.firstName?.trim() || 'A friend';
      // Built and checked, confirming the recipe resolves to something
      // before bothering the OS share sheet, but deliberately never
      // shown: the plain-text message stays plain, with no embedded link.
      const link = await encodeShareLinkFromCuratedRecipe(recipeId, builderType, fromName);
      if (!link) {
        showInfoAlert('Nothing to share', "This couldn't be prepared for sharing.");
        return;
      }
      const recipe = await getCuratedRecipe(recipeId);
      const ingredientLines = (recipe?.ingredients ?? [])
        .map((ingredient) => `${ingredient.quantity} ${ingredient.unit} ${ingredient.foodName}`)
        .join('\n');
      const message = [recipe?.name ?? '', ingredientLines, `Shared from Inside Story by ${fromName}.`]
        .filter(Boolean)
        .join('\n\n');
      // A local .is file (the signed envelope, richer than the deep
      // link), preferred over the plain photo since the photo travels
      // embedded inside the .is file's content. Anyone without the app
      // sees the same plain message either way, since the .is file is
      // inert to them.
      //
      // Two separate native actions rather than one combined share:
      // React Native's Share module drops its url field on Android
      // before it reaches native code, so a combined {message, url} call
      // never attached the file there. Share.share({message}) fires
      // first, then shareFileIfAvailable offers the attachment.
      const isFileUri = await writeIsFileForCuratedRecipe(recipeId, builderType, fromName);
      const photoUri = isFileUri ? null : await getPhotoForTarget({ kind: 'curatedRecipe', recipeId });
      const attachmentUri = isFileUri ?? photoUri;
      await Share.share({ message });
      if (attachmentUri) {
        await shareFileIfAvailable(attachmentUri, {
          mimeType: isFileUri ? '*/*' : 'image/jpeg',
          dialogTitle: isFileUri ? 'Share this recipe' : 'Share this photo',
        });
      }
    } catch (error) {
      console.error('[CuratedRecipeShareButton] Failed to share', error);
      showInfoAlert('Something went wrong', "This couldn't be shared. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      {infoAlertElement}
      <TouchableOpacity style={styles.recipeShareButton} activeOpacity={0.85} onPress={handleShare} disabled={sharing}>
        <Ionicons name="share-outline" size={18} color={tabColor} />
      </TouchableOpacity>
    </>
  );
}

// The "open this in its builder" call to action, plus room for the share
// button beside it. Solid-filled with the tab color rather than the
// lightened tint other screens use for a primary action, since this is
// the one unambiguous "do the thing" control on a card that otherwise
// only shows read-only text.
export function RecipeBuildRow({
  label,
  onPress,
  disabled,
  tabColor,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tabColor: string;
  children?: React.ReactNode;
}) {
  const styles = useMemo(() => makeRecipeStyles(tabColor, tabColor), [tabColor]);
  return (
    <View style={styles.recipeButtonRow}>
      <TouchableOpacity
        style={[styles.buildRecipeButton, styles.recipeButtonFlex, disabled ? styles.buildRecipeButtonDisabled : null]}
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
      >
        <Ionicons name="hammer-outline" size={18} color={colors.background} />
        <Text style={styles.buildRecipeButtonText}>{label}</Text>
      </TouchableOpacity>
      {children}
    </View>
  );
}

// Built per color pair rather than once at module load, because the two
// tabs that render this card paint it differently. Every value below is
// the Digest's own, moved verbatim; only TAB_COLOR/TAB_TEXT_COLOR became
// arguments.
function makeRecipeStyles(tabColor: string, tabTextColor: string) {
  return StyleSheet.create({
    // The diet pills sit at the top of a recipe's detail, since "which
    // diets this fits" is meant to be identifiable at a glance rather
    // than buried under the ingredient list. alignItems 'flex-start'
    // keeps a wrapped second row starting flush at the row's left edge
    // rather than stretching to match the tallest pill on the line
    // above it. RecipeDietTagRow re-sorts tags into one canonical order
    // before rendering, so the same recipe never shows its pills in a
    // different order than last time.
    dietTagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 6, marginBottom: 8 },
    dietTagPill: {
      backgroundColor: tabColor,
      borderRadius: 10,
      paddingVertical: 3,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // No shadow: this text sits on a solid, opaque fill rather than a
    // photo background, so it needs no shadow for contrast.
    dietTagPillText: {
      ...typography.caption,
      color: colors.background,
      fontSize: 11,
      fontWeight: '400',
      textShadowColor: 'transparent',
      textShadowRadius: 0,
    },
    detailLabel: { ...typography.eyebrow, ...textShadow, fontWeight: '400', color: tabTextColor, marginTop: 8, marginBottom: 2 },
    detailText: { ...typography.body, color: colors.textPrimary, lineHeight: 19, ...textShadow },
    // Emphasis inside body content. Colored rather than bolded, since
    // bold came out app-wide and emphasis would otherwise be
    // indistinguishable from the text around it.
    detailTextEmphasis: { color: tabTextColor },
    swapText: { ...typography.body, color: colors.textPrimary, lineHeight: 19, marginTop: 2, ...textShadow },
    buildRecipeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: tabColor,
      borderRadius: 10,
      paddingVertical: 12,
      marginTop: 12,
    },
    buildRecipeButtonText: {
      ...typography.bodyEmphasis,
      color: colors.background,
      textShadowColor: 'transparent',
      textShadowRadius: 0,
    },
    buildRecipeButtonDisabled: { opacity: 0.5 },
    recipeButtonRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    recipeButtonFlex: { flex: 1, marginTop: 0 },
    recipeShareButton: {
      width: 44,
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: tabColor,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
    },
    // Numbered instruction steps: the same body treatment as detailText,
    // with a tighter top margin per line so the list reads as a list
    // rather than one dense paragraph.
    recipeStepText: { ...typography.body, color: colors.textPrimary, lineHeight: 19, marginTop: 4, ...textShadow },
    // The "what this dish gives you" callout, a tinted box so it reads
    // as a rating rather than blending into the paragraphs around it.
    recipeNutritionBox: {
      backgroundColor: `${tabColor}18`,
      borderRadius: 10,
      padding: 10,
      marginTop: 10,
    },
    recipeNutritionLabel: { ...typography.eyebrow, ...textShadow, fontWeight: '400', color: tabTextColor, marginBottom: 4 },
    recipeNutritionText: { ...typography.body, color: colors.textPrimary, lineHeight: 18, marginTop: 2, ...textShadow },
    // The per-condition box: a warm accent rather than the tab's color,
    // so a caution reads visually different from a highlight.
    recipeConditionBox: {
      backgroundColor: `${colors.accent}18`,
      borderRadius: 10,
      padding: 10,
      marginTop: 10,
    },
    recipeConditionLabel: { ...typography.eyebrow, color: colors.accent, marginBottom: 4, ...textShadow },
    recipeConditionCondition: { ...typography.bodyEmphasis, color: colors.accent, marginTop: 4, ...textShadow },
    recipeConditionItemSpaced: { marginTop: 6 },
    // A serious flag has to read as different from a mild highlight.
    // Reuses the statusYellow/statusRedBg palette DimensionFlags
    // established for the same yellow/red severity concept: a muted,
    // dark-tinted fill plus a solid border, which reads correctly on
    // this app's dark surface where a solid fill does not.
    recipeConditionBoxYellow: {
      backgroundColor: colors.statusYellowBg,
      borderWidth: 1,
      borderColor: colors.statusYellow,
      borderRadius: 10,
      padding: 10,
      marginTop: 10,
    },
    recipeConditionBoxRed: {
      backgroundColor: colors.statusRedBg,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: 10,
      padding: 10,
      marginTop: 10,
    },
    // colors.statusYellowStandalone, not the darker statusYellow, checked
    // by contrast math rather than assumed from DimensionFlags: that
    // component only uses statusYellow as a border, and statusYellow
    // directly on statusYellowBg measures an illegible 1.59:1 for label
    // text. statusYellowStandalone measures 5.67:1 here.
    recipeConditionLabelYellow: { ...typography.eyebrow, color: colors.statusYellowStandalone, marginBottom: 4, ...textShadow },
    // colors.danger on statusRedBg measures 5.17:1, verified the same way.
    recipeConditionLabelRed: { ...typography.eyebrow, color: colors.danger, marginBottom: 4, ...textShadow },
  });
}
