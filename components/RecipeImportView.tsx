import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { getStoredMeasurementSystem } from '../lib/db';
import { detectMeasurementSystemFromLocale } from '../lib/measurement';
import {
  attributionLine,
  describeAmount,
  importReadiness,
  lineStatus,
  noRecipeFoundSentence,
  splitPastedIngredients,
  type ImportUnit,
  type RecipeImportLine,
} from '../lib/recipeImport';
import {
  autoMatchLine,
  createRecipeImport,
  deleteRecipeImport,
  fetchRecipeFromUrl,
  findImportCandidates,
  listRecipeImports,
  prepareImportForBuilder,
  resolveImportCandidate,
  saveRecipeImport,
  type ImportCandidate,
  type RecipeImportRecord,
} from '../lib/recipeImportDb';
import { AppTextInput } from './AppTextInput';
import { CookModeButton } from './CookMode';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';
import { PopoverSelect } from './PopoverSelect';

// Import a Recipe (G1, 1.0.53.12): a recipe from a web link, or a pasted
// ingredient list, turned into a dish one of the builders can open.
//
// The page reads the site's schema.org Recipe block (lib/recipeImport.ts),
// matches each ingredient line to a reference food the way voice logging
// does, and fills in only confident matches. Every other line waits here to
// be picked or left out, and Open in a Builder stays unavailable until none
// is left unsure. The builder then scores every ingredient before the dish
// is saved, so an imported recipe reaches My Recipes the same way a built
// one does and never skips the scoring.

const UNIT_OPTIONS: { label: string; value: ImportUnit }[] = [
  { label: 'g', value: 'g' },
  { label: 'oz', value: 'oz' },
  { label: 'lb', value: 'lb' },
  { label: 'ml', value: 'ml' },
  { label: 'tsp', value: 'tsp' },
  { label: 'tbsp', value: 'tbsp' },
  { label: 'cup', value: 'cup' },
  { label: 'piece', value: 'piece' },
];

// Meal Builder assembles saved dishes rather than ingredients, so it is not
// offered here. Alphabetical, like every chooser list of names.
const BUILDER_OPTIONS: { label: string; value: string }[] = [
  { label: 'Baked Goods', value: 'bakedGoods' },
  { label: 'Beverages', value: 'beverage' },
  { label: 'Desserts', value: 'dessert' },
  { label: 'Fermentation', value: 'fermentation' },
  { label: 'Handhelds', value: 'handheld' },
  { label: 'Salads & Bowls', value: 'salad' },
  { label: 'Sauces', value: 'sauce' },
  { label: 'Sides', value: 'side' },
  { label: 'Smoothies', value: 'smoothie' },
  { label: 'Snacks', value: 'snack' },
  { label: 'Soups', value: 'soup' },
];

// The same route params FoodItemsView uses to open a favorite in its builder.
const BUILDER_PARAM: Record<string, string> = {
  side: 'fromSideFavoriteId',
  salad: 'fromSaladFavoriteId',
  smoothie: 'fromSmoothieFavoriteId',
  fermentation: 'fromFermentationFavoriteId',
  beverage: 'fromBeverageFavoriteId',
  snack: 'fromSnackFavoriteId',
  bakedGoods: 'fromBakedGoodsFavoriteId',
  soup: 'fromSoupFavoriteId',
  sauce: 'fromSauceFavoriteId',
  handheld: 'fromHandheldFavoriteId',
  dessert: 'fromDessertFavoriteId',
};

function formatAmountDraft(quantity: number | null): string {
  if (quantity === null) return '';
  return String(Math.round(quantity * 100) / 100);
}

function parseAmountDraft(text: string): number | null {
  const value = Number(text.replace(',', '.').trim());
  return text.trim() !== '' && Number.isFinite(value) && value > 0 ? value : null;
}

export function RecipeImportView({
  onClose,
  onOpenBuilder,
}: {
  onClose: () => void;
  onOpenBuilder: (params: Record<string, string>) => void;
}) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noRecipe, setNoRecipe] = useState<{ url: string; site: string } | null>(null);
  const [pasting, setPasting] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [record, setRecord] = useState<RecipeImportRecord | null>(null);
  const [amountDrafts, setAmountDrafts] = useState<Record<number, string>>({});
  const [servingsDraft, setServingsDraft] = useState('');
  const [sizeDraft, setSizeDraft] = useState('');
  const [pickIndex, setPickIndex] = useState<number | null>(null);
  const [pickQuery, setPickQuery] = useState('');
  const [candidates, setCandidates] = useState<ImportCandidate[] | null>(null);
  const [past, setPast] = useState<RecipeImportRecord[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);

  const loadPast = useCallback(async () => {
    setPast(await listRecipeImports());
  }, []);

  useEffect(() => {
    void loadPast();
  }, [loadPast]);

  function showRecord(next: RecipeImportRecord) {
    setRecord(next);
    setAmountDrafts({});
    setServingsDraft(next.servings ? formatAmountDraft(next.servings) : '');
    setSizeDraft(next.servingSizeAmount ? formatAmountDraft(next.servingSizeAmount) : '');
    setPickIndex(null);
    setCandidates(null);
  }

  async function update(next: RecipeImportRecord) {
    setRecord(next);
    await saveRecipeImport(next);
  }

  async function matchAndShow(created: RecipeImportRecord) {
    setBusy('Matching each line to a food');
    const lines: RecipeImportLine[] = [];
    for (const line of created.lines) lines.push(await autoMatchLine(line));
    const matched = { ...created, lines };
    await saveRecipeImport(matched);
    showRecord(matched);
    await loadPast();
  }

  async function readLink() {
    setError(null);
    setNoRecipe(null);
    setBusy('Reading the page');
    try {
      const fetched = await fetchRecipeFromUrl(url);
      if (fetched.kind === 'noRecipe') {
        setNoRecipe({ url: fetched.url, site: fetched.site });
        setPasting(true);
        setPasteTitle(fetched.pageTitle);
        return;
      }
      const { recipe } = fetched;
      const created = await createRecipeImport({
        sourceUrl: recipe.sourceUrl,
        sourceSite: recipe.sourceSite,
        title: recipe.name,
        author: recipe.author,
        yieldText: recipe.yieldText,
        servings: recipe.servings,
        instructions: recipe.instructions,
        ingredientLines: recipe.ingredientLines,
      });
      setUrl('');
      await matchAndShow(created);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The page could not be read.');
    } finally {
      setBusy(null);
    }
  }

  async function readPasted() {
    const lines = splitPastedIngredients(pasteText);
    if (lines.length === 0) {
      setError('Paste at least one ingredient line.');
      return;
    }
    setError(null);
    try {
      const created = await createRecipeImport({
        sourceUrl: noRecipe?.url ?? null,
        sourceSite: noRecipe?.site || null,
        title: pasteTitle,
        author: null,
        yieldText: null,
        servings: null,
        instructions: [],
        ingredientLines: lines,
      });
      setPasting(false);
      setPasteText('');
      setPasteTitle('');
      setNoRecipe(null);
      await matchAndShow(created);
    } finally {
      setBusy(null);
    }
  }

  function setLine(index: number, change: Partial<RecipeImportLine>) {
    if (!record) return;
    const lines = record.lines.map((line, i) => (i === index ? { ...line, ...change } : line));
    void update({ ...record, lines });
  }

  async function startPick(index: number) {
    if (!record) return;
    const line = record.lines[index];
    const query = line.searchText || line.foodText || line.original;
    setPickIndex(index);
    setPickQuery(query);
    setCandidates(null);
    setCandidates(await findImportCandidates(query));
  }

  async function searchAgain() {
    setCandidates(null);
    setCandidates(await findImportCandidates(pickQuery));
  }

  async function pick(candidate: ImportCandidate) {
    if (pickIndex === null) return;
    const match = await resolveImportCandidate(candidate, true);
    if (!match) return;
    setLine(pickIndex, { match, leftOut: false });
    setPickIndex(null);
    setCandidates(null);
  }

  async function openInBuilder() {
    if (!record || !record.builderType) return;
    const param = BUILDER_PARAM[record.builderType];
    if (!param) return;
    const system = (await getStoredMeasurementSystem()) ?? detectMeasurementSystemFromLocale();
    await prepareImportForBuilder(record, system);
    onOpenBuilder({ [param]: record.id });
  }

  async function removePast(id: string) {
    await deleteRecipeImport(id);
    setRemoving(null);
    if (record?.id === id) setRecord(null);
    await loadPast();
  }

  const readiness = useMemo(() => (record ? importReadiness(record.lines.map(lineStatus)) : null), [record]);
  const builderLabel = BUILDER_OPTIONS.find((option) => option.value === record?.builderType)?.label ?? null;

  function renderLine(line: RecipeImportLine, index: number) {
    if (line.isHeader) {
      return (
        <View key={index} style={styles.headerRow}>
          <Text style={styles.headerText}>{line.original}</Text>
        </View>
      );
    }
    const draft = amountDrafts[index] ?? formatAmountDraft(line.quantity);
    const notes: string[] = [];
    if (line.rangeNote) notes.push(line.rangeNote);
    if (line.optional) notes.push('The recipe marks this optional.');
    if (line.toTaste) notes.push('The recipe says to taste, so give an amount or leave it out.');
    return (
      <View key={index} style={[styles.lineCard, line.leftOut && styles.lineCardLeftOut]}>
        <Text style={styles.lineOriginal}>{line.original}</Text>
        {line.leftOut ? (
          <Text style={styles.rowMeta}>Left out. It will not go to the builder.</Text>
        ) : (
          <>
            <Text style={styles.rowMeta}>
              {line.match
                ? `${line.match.foodName}${line.match.picked ? ', picked by you' : ', matched by name'}`
                : 'No food picked yet.'}
            </Text>
            <View style={styles.fieldRow}>
              <AppTextInput
                style={[styles.textInput, styles.amountInput]}
                value={draft}
                keyboardType="decimal-pad"
                placeholder="Amount"
                onChangeText={(text) => {
                  setAmountDrafts((drafts) => ({ ...drafts, [index]: text }));
                  setLine(index, { quantity: parseAmountDraft(text) });
                }}
              />
              <PopoverSelect
                options={UNIT_OPTIONS}
                selected={line.unit}
                onSelect={(value) => setLine(index, { unit: value as ImportUnit })}
                tabColor={colors.tabFood}
                placeholder="Unit"
              />
              <Text style={styles.rowMeta}>{describeAmount(line.quantity, line.unit)}</Text>
            </View>
            {notes.map((note) => (
              <Text key={note} style={styles.rowMeta}>
                {note}
              </Text>
            ))}
          </>
        )}
        <View style={styles.fieldRow}>
          {line.leftOut ? null : (
            <TouchableOpacity onPress={() => void startPick(index)} activeOpacity={0.7} style={styles.rowAction}>
              <Text style={styles.rowActionText}>{line.match ? 'Change the food' : 'Pick a food'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setLine(index, { leftOut: !line.leftOut })}
            activeOpacity={0.7}
            style={styles.rowAction}
          >
            <Text style={styles.rowActionText}>{line.leftOut ? 'Keep it' : 'Leave it out'}</Text>
          </TouchableOpacity>
        </View>
        {pickIndex === index ? (
          <View style={styles.pickCard}>
            <View style={styles.fieldRow}>
              <AppTextInput
                style={[styles.textInput, styles.flexInput]}
                value={pickQuery}
                onChangeText={setPickQuery}
                placeholder="Search for a food"
                onSubmitEditing={() => void searchAgain()}
              />
              <TouchableOpacity onPress={() => void searchAgain()} activeOpacity={0.7} style={styles.rowAction}>
                <Text style={styles.rowActionText}>Search</Text>
              </TouchableOpacity>
            </View>
            {candidates === null ? (
              <Text style={styles.rowMeta}>Searching.</Text>
            ) : candidates.length === 0 ? (
              <Text style={styles.rowMeta}>Nothing found. Try fewer words, or leave this line out.</Text>
            ) : (
              candidates.map((candidate) => (
                <TouchableOpacity
                  key={`${candidate.match.category}|${candidate.match.baseName}`}
                  onPress={() => void pick(candidate)}
                  activeOpacity={0.7}
                  style={styles.candidateRow}
                >
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {candidate.match.baseName}
                  </Text>
                  <Text style={styles.rowMeta}>{candidate.match.category}</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity onPress={() => setPickIndex(null)} activeOpacity={0.7}>
              <Text style={styles.linkText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.backLink}>‹ Back</Text>
        </TouchableOpacity>

        <HomeSectionBand kind="static" title="From a Web Link" icon="link-outline" color={colors.tabFood} contentStyle={styles.bandBody}>
          <Text style={styles.intro}>
            Paste the address of a recipe page. The app reads the recipe the site describes, matches each ingredient
            to a food, and asks you about any line it is unsure of. The builder you choose then scores it before it is
            saved.
          </Text>
          <AppTextInput
            style={styles.textInput}
            value={url}
            onChangeText={setUrl}
            placeholder="https://"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onSubmitEditing={() => void readLink()}
          />
          <View style={styles.fieldRow}>
            <TouchableOpacity
              onPress={() => void readLink()}
              activeOpacity={0.7}
              style={[styles.primaryAction, (busy !== null || url.trim() === '') && styles.disabled]}
              disabled={busy !== null || url.trim() === ''}
            >
              <Text style={styles.primaryActionText}>Read the Recipe</Text>
            </TouchableOpacity>
            {pasting ? null : (
              <TouchableOpacity onPress={() => setPasting(true)} activeOpacity={0.7}>
                <Text style={styles.linkText}>Paste ingredients instead</Text>
              </TouchableOpacity>
            )}
          </View>
          {busy ? <Text style={styles.rowMeta}>{busy}.</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {pasting ? (
            <View style={styles.formCard}>
              {noRecipe ? <Text style={styles.rowMeta}>{noRecipeFoundSentence(noRecipe.site)}</Text> : null}
              <Text style={styles.fieldLabel}>Name</Text>
              <AppTextInput style={styles.textInput} value={pasteTitle} onChangeText={setPasteTitle} placeholder="What the recipe is called" />
              <Text style={styles.fieldLabel}>Ingredients, one per line</Text>
              <AppTextInput
                style={[styles.textInput, styles.pasteInput]}
                value={pasteText}
                onChangeText={setPasteText}
                placeholder={'2 cups rolled oats\n1 tbsp honey'}
                multiline
                textAlignVertical="top"
              />
              <View style={styles.fieldRow}>
                <TouchableOpacity onPress={() => void readPasted()} activeOpacity={0.7} style={styles.primaryAction}>
                  <Text style={styles.primaryActionText}>Read These Lines</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setPasting(false);
                    setNoRecipe(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </HomeSectionBand>

        {record && readiness ? (
          <HomeSectionBand kind="static" title="Review the Recipe" icon="list-outline" color={colors.tabFood} contentStyle={styles.bandBody}>
            <Text style={styles.rowMeta}>{attributionLine({ sourceSite: record.sourceSite ?? '', sourceUrl: record.sourceUrl ?? '', author: record.author })}</Text>
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Name</Text>
              <AppTextInput
                style={styles.textInput}
                value={record.title}
                onChangeText={(title) => void update({ ...record, title })}
                placeholder="What the recipe is called"
              />
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Servings</Text>
                <AppTextInput
                  style={[styles.textInput, styles.amountInput]}
                  value={servingsDraft}
                  keyboardType="decimal-pad"
                  placeholder="1"
                  onChangeText={(text) => {
                    setServingsDraft(text);
                    void update({ ...record, servings: parseAmountDraft(text) });
                  }}
                />
                {record.yieldText ? <Text style={styles.rowMeta}>The recipe says {record.yieldText}.</Text> : null}
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>One serving is</Text>
                <AppTextInput
                  style={[styles.textInput, styles.amountInput]}
                  value={sizeDraft}
                  keyboardType="decimal-pad"
                  placeholder="1"
                  onChangeText={(text) => {
                    setSizeDraft(text);
                    void update({ ...record, servingSizeAmount: parseAmountDraft(text) });
                  }}
                />
                <PopoverSelect
                  options={UNIT_OPTIONS}
                  selected={record.servingSizeUnit ?? 'piece'}
                  onSelect={(value) => void update({ ...record, servingSizeUnit: value })}
                  tabColor={colors.tabFood}
                  placeholder="Unit"
                />
              </View>
              <Text style={styles.rowMeta}>Recipe sites rarely say how big a serving is. You can change it in the builder too.</Text>
            </View>

            {record.lines.map(renderLine)}

            <View style={styles.formCard}>
              <Text style={styles.rowTitle}>{readiness.sentence}</Text>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Build it as</Text>
                <PopoverSelect
                  options={BUILDER_OPTIONS}
                  selected={record.builderType}
                  onSelect={(value) => void update({ ...record, builderType: value })}
                  tabColor={colors.tabFood}
                  placeholder="Pick a builder"
                />
              </View>
              <TouchableOpacity
                onPress={() => void openInBuilder()}
                activeOpacity={0.7}
                style={[styles.primaryAction, (!readiness.ready || !record.builderType) && styles.disabled]}
                disabled={!readiness.ready || !record.builderType}
              >
                <Text style={styles.primaryActionText}>{builderLabel ? `Open in ${builderLabel}` : 'Open in a Builder'}</Text>
              </TouchableOpacity>
              <Text style={styles.rowMeta}>
                The builder scores every ingredient for the conditions you track. Saving it there puts it in My Recipes.
              </Text>
            </View>

            {record.instructions.length > 0 ? (
              <View style={styles.formCard}>
                <Text style={styles.fieldLabel}>Method</Text>
                {record.instructions.map((step, index) => (
                  <Text key={index} style={styles.rowMeta}>
                    {step}
                  </Text>
                ))}
                <CookModeButton steps={record.instructions} title={record.title} tabColor={colors.tabFood} />
              </View>
            ) : null}
          </HomeSectionBand>
        ) : null}

        <HomeSectionBand kind="static" title="Imported Before" icon="time-outline" color={colors.tabFood} contentStyle={styles.bandBody}>
          {past.length === 0 ? (
            <Text style={styles.emptyText}>Nothing imported yet.</Text>
          ) : (
            past.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <TouchableOpacity style={styles.rowTextWrap} onPress={() => showRecord(item)} activeOpacity={0.7}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={2}>
                    {`${item.sourceSite || 'Pasted'}, ${item.createdAt.slice(0, 10)}${item.openedAt ? ', opened in a builder' : ''}`}
                  </Text>
                </TouchableOpacity>
                {removing === item.id ? (
                  <>
                    <TouchableOpacity onPress={() => void removePast(item.id)} activeOpacity={0.7} style={styles.rowAction}>
                      <Text style={styles.rowActionText}>Remove it</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setRemoving(null)} activeOpacity={0.7} style={styles.rowAction}>
                      <Text style={styles.rowActionText}>Keep</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity onPress={() => setRemoving(item.id)} activeOpacity={0.7} style={styles.rowAction}>
                    <Text style={styles.rowActionText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
          <Text style={styles.rowMeta}>
            Removing an import here leaves anything already saved from it in My Recipes as it is.
          </Text>
        </HomeSectionBand>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  intro: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  emptyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  headerRow: { borderRadius: 10, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 8 },
  headerText: { ...typography.label, color: colors.textPrimary, ...textShadow },
  lineCard: { borderRadius: 10, backgroundColor: colors.surfaceMuted, padding: 12, gap: 6 },
  lineCardLeftOut: { opacity: 0.7 },
  lineOriginal: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  pickCard: { borderRadius: 10, backgroundColor: colors.surface, padding: 10, gap: 6 },
  candidateRow: { borderRadius: 8, backgroundColor: colors.surfaceMuted, paddingHorizontal: 10, paddingVertical: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    paddingLeft: 12,
    paddingVertical: 12,
  },
  rowTextWrap: { flex: 1, marginRight: 12 },
  rowTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
  rowAction: {
    marginRight: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  rowActionText: { ...typography.caption, color: colors.textPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
  primaryAction: {
    alignSelf: 'flex-start',
    backgroundColor: colors.buttonColor,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryActionText: {
    ...typography.body,
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  disabled: { opacity: 0.5 },
  formCard: { borderRadius: 10, backgroundColor: colors.surfaceMuted, padding: 12, gap: 8 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  amountInput: { width: 90 },
  flexInput: { flex: 1, minWidth: 160 },
  pasteInput: { minHeight: 140 },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
