import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from './AppTextInput';
import { VoiceInputButton } from './VoiceInputButton';
import { useConfirmSheet } from './ConfirmSheet';
import { useInfoAlert } from './InfoAlert';
import type { DropdownOption } from './Dropdown';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from './HomeSectionBand';
import { LifeBand } from './LifeBand';
import { PopoverSelect } from './PopoverSelect';
import { WhyExplainer } from './WhyExplainer';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import {
  createOtcTreatment,
  createPrescriptionTreatment,
  createSupplementTreatment,
  deleteTreatment,
  ensureScheduleSeriesGenerated,
  getDailyNutrientAnalysis,
  getNutrientTiming,
  getSupplementForms,
  getTreatmentNutrients,
  listAllTreatments,
  listCommonMedications,
  listTrackedNutrients,
  setTreatmentActive,
  updateOtcTreatment,
  updatePrescriptionTreatment,
  updateSupplementTreatment,
  type CommonMedication,
  type NutrientTiming,
  type SupplementForm,
  type SupplementIngredientInput,
  type TrackedNutrient,
  type TreatmentNutrientRecord,
  type TreatmentRecord,
} from '../lib/db';
import { evaluateInteractionRules, type InteractionWarning, type ReferenceOnlyRule } from '../lib/interactionRules';
import type { NutrientGapEntry } from '../lib/nutrientAnalysis';

// My Meds, the registry of everything a person takes: prescriptions, OTC
// drugs and supplements, each with its dose, form, timing rules, interactions
// and what food already covers. Built on Schedules on 2026-08-08 and moved
// here on 2026-09-13, direct: "Schedules needs to be about the actual
// schedules for each category or topic... Both prescriptions and supplements
// should be considered within meds... Many schedules will be because of
// things contained in Life." A med is DEFINED here; its dose times are set
// on Schedules > Meds, reached from each row's Schedule it. The Supplements
// and Prescriptions lenses on Schedules, which carried their own copies of
// these forms, are gone; editing came here with them.

// Every band here folds, the same rule Schedules and Food follow, with the
// open state remembered per band through useBandFolds. The band itself is
// LifeBand, shared with every other Life lens since 2026-09-19.
function todayDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Only nutrients with one unambiguous, universally agreed IU->mass
// conversion accept IU today (see lib/supplementUnits.ts) -- offered here
// regardless of which nutrient is picked, with any that can't be
// normalized surfaced honestly via Insights' "couldn't be counted" note
// rather than hidden or guessed at.
const SUPPLEMENT_UNIT_OPTIONS: DropdownOption[] = [
  { label: 'mg', value: 'mg' },
  { label: 'mcg', value: 'mcg' },
  { label: 'g', value: 'g' },
  { label: 'IU', value: 'IU' },
];

// --- My Meds -----------------------------------------------------------
//
// A real, cited registry over the same underlying `treatments` table
// Supplements and Prescriptions already use -- plus, as of 2026-08-08, a
// third real treatment_type ('otc', see createOtcTreatment in lib/db.ts).
// Direct request: "This is a place to document all prescription,
// nonprescription over the counter drugs, and macro and micronutrients
// regimen... exact ingredients of every supplement... true interaction
// logic built in."
//
// Deliberate scope boundary, stated here and in this lens's own Info
// content above: reminder times and repeat schedules for prescriptions and
// supplements still live on those two lenses, unchanged -- adding an item
// here doesn't also set up a dose reminder for it. Building a real,
// working third parallel reminder system for OTC in the same pass as
// everything else below would have meant either rushing it or blocking
// everything on it; tracking on/off (which is what actually feeds
// interaction checking and nutrient totals) works for all three types
// today, reminders are a real, separate fast-follow.
//
// The "pick from a researched list, or enter it yourself" flow for
// prescriptions/OTC (COMMON_MED_OPTIONS below) is intentionally NOT a live
// internet lookup for medications this app doesn't already have -- that's
// a real, separate product/architecture decision (which data source, what
// it costs, what it means for this app's own local-first privacy stance)
// that hasn't been made yet, not something to silently wire up. Manual
// entry is the honest, working fallback today.
type MyMedsCategory = 'supplement' | 'prescription' | 'otc';

type MedIngredientRow = { key: string; nutrientCode: string; supplementForm: string; amount: string; unit: string };

function blankMedIngredientRow(): MedIngredientRow {
  return { key: `ingredient_${Date.now()}_${Math.random().toString(36).slice(2)}`, nutrientCode: '', supplementForm: '', amount: '', unit: 'mg' };
}

type MyMedsSupplementFormState = {
  editingId: string | null;
  name: string;
  unitsPerDay: string;
  servingUnitLabel: string;
  notes: string;
  ingredients: MedIngredientRow[];
};

function blankMyMedsSupplementForm(): MyMedsSupplementFormState {
  return { editingId: null, name: '', unitsPerDay: '1', servingUnitLabel: '', notes: '', ingredients: [blankMedIngredientRow()] };
}

type MedFormState = {
  editingId: string | null;
  category: 'prescription' | 'otc';
  commonMedId: string;
  manualEntry: boolean;
  name: string;
  genericName: string;
  doseAmount: string;
  doseUnit: string;
  frequency: string;
  notes: string;
};

function blankMedForm(category: 'prescription' | 'otc'): MedFormState {
  return {
    editingId: null,
    category,
    commonMedId: '',
    manualEntry: false,
    name: '',
    genericName: '',
    doseAmount: '',
    doseUnit: '',
    frequency: '',
    notes: '',
  };
}

const EVIDENCE_TIER_LABEL: Record<string, string> = {
  established: 'Established',
  emerging: 'Emerging evidence',
  strong: 'Strong evidence',
  moderate: 'Moderate evidence',
};

type Props = {
  tabColor: string;
  // A med to open on arrival: Schedules > Meds sends "Edit in My Meds" here
  // with the med's id, so the row lands expanded rather than found by hand.
  focusTreatmentId?: string;
};

export function MyMedsSection({ tabColor, focusTreatmentId }: Props) {
  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);
  const router = useRouter();
  const folds = useBandFolds();
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [ingredientsByTreatment, setIngredientsByTreatment] = useState<Record<string, TreatmentNutrientRecord[]>>({});
  const [interactionWarnings, setInteractionWarnings] = useState<InteractionWarning[]>([]);
  const [referenceOnlyRules, setReferenceOnlyRules] = useState<ReferenceOnlyRule[]>([]);
  const [nutrients, setNutrients] = useState<TrackedNutrient[]>([]);
  const [commonMedications, setCommonMedications] = useState<CommonMedication[]>([]);
  const [foodEntries, setFoodEntries] = useState<NutrientGapEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [addMode, setAddMode] = useState<MyMedsCategory | null>(null);
  const [supplementForm, setSupplementForm] = useState<MyMedsSupplementFormState>(blankMyMedsSupplementForm());
  const [medForm, setMedForm] = useState<MedFormState>(blankMedForm('prescription'));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  // Lazily loaded, cached by nutrient code -- there's no reason to fetch
  // supplement_forms/nutrient_timing for every nutrient this app tracks up
  // front when a person will only ever pick a handful.
  const [formsByNutrient, setFormsByNutrient] = useState<Record<string, SupplementForm[]>>({});
  const [timingByNutrient, setTimingByNutrient] = useState<Record<string, NutrientTiming | null>>({});

  const load = useCallback(() => {
    setLoading(true);
    ensureScheduleSeriesGenerated()
      .then(() =>
        Promise.all([
          listAllTreatments(),
          listTrackedNutrients(),
          listCommonMedications(),
          getDailyNutrientAnalysis(todayDateString()),
          evaluateInteractionRules(todayDateString()),
        ]),
      )
      .then(async ([loadedTreatments, loadedNutrients, loadedMeds, dailyAnalysis, evaluation]) => {
        setTreatments(loadedTreatments);
        if (focusTreatmentId && loadedTreatments.some((treatment) => treatment.id === focusTreatmentId)) {
          setExpandedId(focusTreatmentId);
        }
        setNutrients(loadedNutrients);
        setCommonMedications(loadedMeds);
        setFoodEntries(dailyAnalysis.entries);
        setInteractionWarnings(evaluation.warnings);
        setReferenceOnlyRules(evaluation.referenceOnly);
        const supplementTreatments = loadedTreatments.filter((treatment) => treatment.treatmentType === 'supplement');
        const entries = await Promise.all(
          supplementTreatments.map(async (treatment) => [treatment.id, await getTreatmentNutrients(treatment.id)] as const),
        );
        setIngredientsByTreatment(Object.fromEntries(entries));
      })
      .catch((error) => {
        setErrorMessage(`Could not load My Meds: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally(() => setLoading(false));
  }, [focusTreatmentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Every med ever added, active or not, since 2026-09-13: this is the one
  // place a med is defined now (the Supplements and Prescriptions lenses on
  // Schedules, which used to carry their own copies of these forms, are
  // gone), so a paused med has to be reachable here to be edited or turned
  // back on. A paused med is preserved in full and simply not counted.

  function nutrientDisplayName(code: string): string {
    return nutrients.find((nutrient) => nutrient.code === code)?.displayName ?? code;
  }

  async function ensureNutrientDataLoaded(nutrientCode: string) {
    if (!nutrientCode) return;
    if (!(nutrientCode in formsByNutrient)) {
      const forms = await getSupplementForms(nutrientCode);
      setFormsByNutrient((current) => ({ ...current, [nutrientCode]: forms }));
    }
    if (!(nutrientCode in timingByNutrient)) {
      const timing = await getNutrientTiming(nutrientCode);
      setTimingByNutrient((current) => ({ ...current, [nutrientCode]: timing }));
    }
  }

  function foodStatusFor(nutrientCode: string): NutrientGapEntry | null {
    return foodEntries.find((entry) => entry.nutrientCode === nutrientCode) ?? null;
  }

  // --- Add flow: category picker ---
  function openAddSupplement() {
    setSupplementForm(blankMyMedsSupplementForm());
    setAddMode('supplement');
  }
  function openAddMed(category: 'prescription' | 'otc') {
    setMedForm(blankMedForm(category));
    setAddMode(category);
  }
  function closeAddForm() {
    setAddMode(null);
    setSupplementForm(blankMyMedsSupplementForm());
    setMedForm(blankMedForm('prescription'));
  }

  // Editing came here on 2026-09-13 from the Supplements and Prescriptions
  // lenses, which used to be the only places a saved med could be changed.
  function openEdit(treatment: TreatmentRecord) {
    if (treatment.treatmentType === 'supplement') {
      const ingredients = ingredientsByTreatment[treatment.id] ?? [];
      setSupplementForm({
        editingId: treatment.id,
        name: treatment.name,
        unitsPerDay: String(treatment.unitsPerDay ?? 1),
        servingUnitLabel: treatment.servingUnitLabel ?? '',
        notes: treatment.notes ?? '',
        ingredients: ingredients.length
          ? ingredients.map((ingredient) => ({
              key: ingredient.id,
              nutrientCode: ingredient.nutrientCode,
              supplementForm: ingredient.supplementForm ?? '',
              amount: String(ingredient.amountPerUnit),
              unit: ingredient.unit,
            }))
          : [blankMedIngredientRow()],
      });
      for (const ingredient of ingredients) void ensureNutrientDataLoaded(ingredient.nutrientCode);
      setAddMode('supplement');
      return;
    }
    const category = treatment.treatmentType === 'otc' ? 'otc' : 'prescription';
    const matched = treatment.genericName ? commonMedications.find((med) => med.id === treatment.genericName) : null;
    setMedForm({
      editingId: treatment.id,
      category,
      commonMedId: matched ? matched.id : '',
      manualEntry: !matched,
      name: treatment.name,
      genericName: treatment.genericName ?? '',
      doseAmount: treatment.doseAmount != null ? String(treatment.doseAmount) : '',
      doseUnit: treatment.doseUnit ?? '',
      frequency: treatment.frequency ?? '',
      notes: treatment.notes ?? '',
    });
    setAddMode(category);
  }

  // The handoff to Schedules > Meds: the med is defined here, its times are
  // set there. 2026-09-13, direct: "if they want to add a new med to the
  // schedule, the link should take them to My Meds in Life where they add
  // the specifics about the med and then tap a button to schedule it, which
  // takes them back to My Meds schedule to add the new med."
  function scheduleIt(treatment: TreatmentRecord) {
    router.push({ pathname: '/schedule', params: { openScheduleLens: 'meds', scheduleTreatmentId: treatment.id } });
  }

  // --- Supplement ingredient rows ---
  function addIngredientRow() {
    setSupplementForm((current) => ({ ...current, ingredients: [...current.ingredients, blankMedIngredientRow()] }));
  }
  function removeIngredientRow(key: string) {
    setSupplementForm((current) => ({ ...current, ingredients: current.ingredients.filter((row) => row.key !== key) }));
  }
  function updateIngredientRow(key: string, update: Partial<MedIngredientRow>) {
    setSupplementForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((row) => (row.key === key ? { ...row, ...update } : row)),
    }));
  }

  async function handleSaveSupplement() {
    if (!supplementForm.name.trim()) {
      showInfoAlert('Almost there', "Enter the supplement's name.");
      return;
    }
    const unitsPerDay = Number(supplementForm.unitsPerDay);
    if (!unitsPerDay || unitsPerDay <= 0) {
      showInfoAlert('Almost there', 'Enter how many are taken per day (e.g. 1 or 2).');
      return;
    }
    if (!supplementForm.servingUnitLabel.trim()) {
      showInfoAlert('Almost there', 'Enter what one dose is called (e.g. capsule, tablet, scoop, powder).');
      return;
    }
    const validIngredients = supplementForm.ingredients.filter((row) => row.nutrientCode && row.amount);
    if (validIngredients.length === 0) {
      showInfoAlert('Almost there', 'Add at least one ingredient with an amount.');
      return;
    }

    const ingredients: SupplementIngredientInput[] = validIngredients.map((row) => ({
      nutrientCode: row.nutrientCode,
      supplementForm: row.supplementForm || undefined,
      amountPerUnit: Number(row.amount),
      unit: row.unit,
    }));

    try {
      if (supplementForm.editingId) {
        await updateSupplementTreatment(supplementForm.editingId, {
          name: supplementForm.name,
          unitsPerDay,
          servingUnitLabel: supplementForm.servingUnitLabel,
          ingredients,
          notes: supplementForm.notes,
        });
      } else {
        await createSupplementTreatment({
          name: supplementForm.name,
          unitsPerDay,
          servingUnitLabel: supplementForm.servingUnitLabel,
          ingredients,
          notes: supplementForm.notes,
        });
      }
      closeAddForm();
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  // --- Prescription / OTC form ---
  function selectCommonMed(med: CommonMedication) {
    setMedForm((current) => ({
      ...current,
      commonMedId: med.id,
      manualEntry: false,
      name: med.genericName,
      genericName: med.id,
    }));
  }

  async function handleSaveMed() {
    if (!medForm.name.trim()) {
      showInfoAlert('Almost there', 'Enter a name for this medication.');
      return;
    }
    const input = {
      name: medForm.name,
      genericName: medForm.genericName || undefined,
      doseAmount: medForm.doseAmount ? Number(medForm.doseAmount) : undefined,
      doseUnit: medForm.doseUnit || undefined,
      frequency: medForm.frequency || undefined,
      notes: medForm.notes || undefined,
    };
    try {
      if (medForm.editingId) {
        if (medForm.category === 'prescription') {
          await updatePrescriptionTreatment(medForm.editingId, input);
        } else {
          await updateOtcTreatment(medForm.editingId, input);
        }
      } else if (medForm.category === 'prescription') {
        await createPrescriptionTreatment(input);
      } else {
        await createOtcTreatment(input);
      }
      closeAddForm();
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  async function handleRemove(treatment: TreatmentRecord) {
    const ok = await confirmSheet({
      title: 'Remove this item?',
      message: `"${treatment.name}" will be permanently deleted from My Meds.`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    await deleteTreatment(treatment.id);
    load();
  }

  async function handleToggleActive(treatment: TreatmentRecord) {
    await setTreatmentActive(treatment.id, !treatment.active);
    load();
  }

  // useMemo, not a plain inline .map() -- PopoverSelect (unlike the old
  // Dropdown) is memoized against referentially-stable `options`, so a
  // fresh array on every render (e.g. every Name/Notes keystroke, which
  // re-renders this whole lens) would otherwise force these two pickers'
  // own popovers to rebuild for no real reason.
  const nutrientOptions: DropdownOption[] = useMemo(
    () => nutrients.map((nutrient) => ({ label: nutrient.displayName, value: nutrient.code })),
    [nutrients],
  );
  const commonMedOptionsForCategory: DropdownOption[] = useMemo(
    () =>
      commonMedications
        .filter((med) => med.treatmentType === medForm.category)
        .map((med) => ({
          label: med.commonBrandNames ? `${med.genericName} (${med.commonBrandNames})` : med.genericName,
          value: med.id,
        })),
    [commonMedications, medForm.category],
  );
  const selectedCommonMed = commonMedications.find((med) => med.id === medForm.commonMedId) ?? null;

  function renderNutrientResearchCard(nutrientCode: string, chosenForm: string) {
    const forms = formsByNutrient[nutrientCode] ?? [];
    const timing = timingByNutrient[nutrientCode];
    const foodStatus = foodStatusFor(nutrientCode);
    const formDetail = forms.find((form) => form.formName === chosenForm);

    if (!nutrientCode) return null;

    return (
      <View style={styles.myMedsResearchCard}>
        {formDetail ? (
          <>
            <Text style={styles.myMedsResearchLabel}>
              {formDetail.formName} · {EVIDENCE_TIER_LABEL[formDetail.evidenceStrength] ?? formDetail.evidenceStrength}
            </Text>
            <Text style={styles.helperText}>{formDetail.absorptionNote}</Text>
            {formDetail.giToleranceNote ? <Text style={styles.helperText}>{formDetail.giToleranceNote}</Text> : null}
            {formDetail.notes ? <Text style={styles.helperText}>{formDetail.notes}</Text> : null}
          </>
        ) : null}
        {timing ? (
          <>
            <Text style={styles.myMedsResearchLabel}>When to take it</Text>
            <Text style={styles.helperText}>{timing.bestTaken}</Text>
            {timing.avoidWith ? <Text style={styles.helperText}>Avoid taking with: {timing.avoidWith}</Text> : null}
            {timing.pairsWellWith ? <Text style={styles.helperText}>Pairs well with: {timing.pairsWellWith}</Text> : null}
          </>
        ) : null}
        <Text style={styles.myMedsResearchLabel}>From food today</Text>
        {foodStatus ? (
          <Text style={styles.helperText}>
            You&apos;re already getting about {Math.round(foodStatus.percentOfTarget)}% of today&apos;s {foodStatus.displayName} target
            from food ({Math.round(foodStatus.fromFood)}{foodStatus.unit}).
          </Text>
        ) : (
          <Text style={styles.helperText}>This app doesn&apos;t track {nutrientDisplayName(nutrientCode)} content in food yet.</Text>
        )}
      </View>
    );
  }

  function renderTreatmentGroup(title: string, groupTreatments: TreatmentRecord[]) {
    if (groupTreatments.length === 0) return null;
    return (
      <LifeBand folds={folds} color={tabColor} id={`life:myMeds:${title}`} title={title} icon="medkit-outline" count={groupTreatments.length}>
      <View style={styles.myMedsGroup}>
        {groupTreatments.map((treatment) => {
          const isExpanded = expandedId === treatment.id;
          const ingredients = ingredientsByTreatment[treatment.id] ?? [];
          const matchedMed = treatment.genericName ? commonMedications.find((med) => med.id === treatment.genericName) : null;

          return (
            <View key={treatment.id} style={styles.row}>
              <TouchableOpacity style={styles.rowTextCol} onPress={() => setExpandedId(isExpanded ? null : treatment.id)}>
                <Text style={styles.rowTitle}>{treatment.name}</Text>
                <Text style={styles.rowMeta}>
                  {treatment.treatmentType === 'supplement'
                    ? `${treatment.unitsPerDay} ${treatment.servingUnitLabel}${Number(treatment.unitsPerDay) === 1 ? '' : 's'}/day`
                    : [treatment.doseAmount ? `${treatment.doseAmount}${treatment.doseUnit ?? ''}` : null, treatment.frequency]
                        .filter(Boolean)
                        .join(', ') || 'No dose details entered'}
                  {treatment.active ? '' : ' · Not tracking'}
                </Text>
                {ingredients.length > 0 ? (
                  <Text style={styles.rowMeta}>
                    {ingredients
                      .map(
                        (ingredient) =>
                          `${nutrientDisplayName(ingredient.nutrientCode)}${ingredient.supplementForm ? ` (${ingredient.supplementForm})` : ''}`,
                      )
                      .join(', ')}
                  </Text>
                ) : null}
              </TouchableOpacity>

              <View style={styles.supplementRowActions}>
                <TouchableOpacity onPress={() => handleToggleActive(treatment)}>
                  <Text style={treatment.active ? styles.actionTextPrimary : styles.actionText}>
                    {treatment.active ? 'Tracking' : 'Not tracking'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : treatment.id)}>
                  <Text style={styles.actionText}>{isExpanded ? 'Hide details' : 'Details'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openEdit(treatment)}>
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => scheduleIt(treatment)}>
                  <Text style={styles.actionTextPrimary}>Schedule it</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(treatment)}>
                  <Text style={styles.actionTextRemove}>Remove</Text>
                </TouchableOpacity>
              </View>

              {isExpanded ? (
                <View style={styles.myMedsDetail}>
                  {treatment.treatmentType === 'supplement'
                    ? ingredients.map((ingredient) => (
                        <View key={ingredient.id}>
                          <Text style={styles.myMedsResearchLabel}>
                            {nutrientDisplayName(ingredient.nutrientCode)}: {ingredient.amountPerUnit}
                            {ingredient.unit}/dose
                          </Text>
                          {renderNutrientResearchCard(ingredient.nutrientCode, ingredient.supplementForm ?? '')}
                        </View>
                      ))
                    : matchedMed ? (
                        <>
                          <Text style={styles.myMedsResearchLabel}>{matchedMed.drugClass}</Text>
                          <Text style={styles.helperText}>{matchedMed.commonUse}</Text>
                          {matchedMed.thyroidRelevantNotes ? (
                            <Text style={styles.helperText}>{matchedMed.thyroidRelevantNotes}</Text>
                          ) : null}
                          {matchedMed.timingGuidance ? (
                            <>
                              <Text style={styles.myMedsResearchLabel}>Timing</Text>
                              <Text style={styles.helperText}>{matchedMed.timingGuidance}</Text>
                            </>
                          ) : null}
                          {matchedMed.keyInteractions ? (
                            <>
                              <Text style={styles.myMedsResearchLabel}>Key interactions</Text>
                              <Text style={styles.helperText}>{matchedMed.keyInteractions}</Text>
                            </>
                          ) : null}
                          {matchedMed.commonSideEffects ? (
                            <>
                              <Text style={styles.myMedsResearchLabel}>Common side effects</Text>
                              <Text style={styles.helperText}>{matchedMed.commonSideEffects}</Text>
                            </>
                          ) : null}
                        </>
                      ) : (
                        <Text style={styles.helperText}>
                          Not matched to this app&apos;s researched medication list; entered manually.
                        </Text>
                      )}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      </LifeBand>
    );
  }

  return (
    <View style={styles.bodyContent}>
      {infoAlertElement}
      {confirmSheetElement}
      {loading ? (
        <View style={styles.bandBox}><Text style={styles.emptyText}>Loading…</Text></View>
      ) : errorMessage ? (
        <View style={styles.bandBox}><Text style={styles.errorText}>{errorMessage}</Text></View>
      ) : (
        <>
          {addMode === null ? (
            <View style={styles.myMedsAddRow}>
              <TouchableOpacity style={styles.addButton} onPress={() => openAddMed('prescription')}>
                <Text style={styles.addButtonText}>+ Prescription</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={() => openAddMed('otc')}>
                <Text style={styles.addButtonText}>+ OTC drug</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={openAddSupplement}>
                <Text style={styles.addButtonText}>+ Supplement</Text>
              </TouchableOpacity>
            </View>
          ) : addMode === 'supplement' ? (
            <View style={styles.formCard}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Name</Text>
                <VoiceInputButton
                  onResult={(text) => setSupplementForm((current) => ({ ...current, name: text }))}
                  color={tabColor}
                />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. Daily Multivitamin, or just Magnesium"
                value={supplementForm.name}
                onChangeText={(text) => setSupplementForm((current) => ({ ...current, name: text }))}
              />

              <Text style={styles.label}>Dose</Text>
              <View style={styles.timeRow}>
                <AppTextInput
                  style={[styles.input, styles.timeInput]}
                  keyboardType="number-pad"
                  value={supplementForm.unitsPerDay}
                  onChangeText={(text) => setSupplementForm((current) => ({ ...current, unitsPerDay: text }))}
                />
                <AppTextInput
                  style={[styles.input, styles.doseUnitInput]}
                  placeholder="capsule, tablet, scoop, powder…"
                  value={supplementForm.servingUnitLabel}
                  onChangeText={(text) => setSupplementForm((current) => ({ ...current, servingUnitLabel: text }))}
                />
                <Text style={styles.timeSeparator}>/ day</Text>
              </View>

              <Text style={styles.label}>Ingredients (per single dose)</Text>
              {supplementForm.ingredients.map((row) => {
                const forms = formsByNutrient[row.nutrientCode] ?? [];
                const formOptions: DropdownOption[] = forms.map((form) => ({ label: form.formName, value: form.formName }));
                return (
                  <View key={row.key}>
                    <View style={styles.ingredientRow}>
                      <View style={styles.ingredientNutrientCol}>
                        {/* colors.tabFood, not this lens's own TAB_COLOR (tabSchedules) --
                            2026-08-08, explicitly requested to match "the same color as
                            those on the Side Dish Builder," which passes this same
                            constant as its own tabColor. All four PopoverSelect fields
                            in this lens share it, for one consistent picker color. */}
                        <PopoverSelect
                          selected={row.nutrientCode || null}
                          options={nutrientOptions}
                          onSelect={(value) => {
                            updateIngredientRow(row.key, { nutrientCode: value, supplementForm: '' });
                            ensureNutrientDataLoaded(value);
                          }}
                          placeholder="Nutrient"
                          tabColor={colors.tabFood}
                          width={220}
                          searchable
                          searchPlaceholder="Search nutrients…"
                        />
                      </View>
                      <AppTextInput
                        style={[styles.input, styles.ingredientAmountInput]}
                        placeholder="Amount"
                        keyboardType="decimal-pad"
                        value={row.amount}
                        onChangeText={(text) => updateIngredientRow(row.key, { amount: text })}
                      />
                      <View style={styles.ingredientUnitCol}>
                        <PopoverSelect
                          selected={row.unit || null}
                          options={SUPPLEMENT_UNIT_OPTIONS}
                          onSelect={(value) => updateIngredientRow(row.key, { unit: value })}
                          tabColor={colors.tabFood}
                          minWidth={64}
                        />
                      </View>
                      <TouchableOpacity onPress={() => removeIngredientRow(row.key)} style={styles.ingredientRemove}>
                        <Text style={styles.actionTextRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    {row.nutrientCode && formOptions.length > 0 ? (
                      <View style={styles.ingredientFormRow}>
                        <PopoverSelect
                          selected={row.supplementForm || null}
                          options={formOptions}
                          onSelect={(value) => updateIngredientRow(row.key, { supplementForm: value })}
                          placeholder="Which form? (optional, but changes absorption)"
                          tabColor={colors.tabFood}
                          width={240}
                        />
                      </View>
                    ) : null}
                    {row.nutrientCode ? renderNutrientResearchCard(row.nutrientCode, row.supplementForm) : null}
                  </View>
                );
              })}
              <TouchableOpacity onPress={addIngredientRow} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>+ Add ingredient</Text>
              </TouchableOpacity>

              <View style={styles.labelRow}>
                <Text style={styles.label}>Notes (optional)</Text>
                <VoiceInputButton
                  onResult={(text) => setSupplementForm((current) => ({ ...current, notes: text }))}
                  color={tabColor}
                />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. take with food"
                value={supplementForm.notes}
                onChangeText={(text) => setSupplementForm((current) => ({ ...current, notes: text }))}
              />

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={closeAddForm}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveSupplement}>
                  <Text style={styles.primaryButtonText}>Add supplement</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.label}>{medForm.category === 'prescription' ? 'Prescription' : 'OTC drug'}</Text>

              {!medForm.manualEntry ? (
                <>
                  <PopoverSelect
                    selected={medForm.commonMedId || null}
                    options={commonMedOptionsForCategory}
                    onSelect={(value) => {
                      const med = commonMedications.find((candidate) => candidate.id === value);
                      if (med) selectCommonMed(med);
                    }}
                    placeholder="Search this app's researched list…"
                    tabColor={colors.tabFood}
                    width={260}
                    searchable
                    searchPlaceholder="e.g. levothyroxine, metformin, ibuprofen…"
                  />
                  <TouchableOpacity onPress={() => setMedForm((current) => ({ ...current, manualEntry: true }))}>
                    <Text style={styles.actionTextPrimary}>Not in the list? Enter it myself</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={() => setMedForm((current) => ({ ...current, manualEntry: false, commonMedId: '' }))}>
                  <Text style={styles.actionTextPrimary}>Search the researched list instead</Text>
                </TouchableOpacity>
              )}

              {selectedCommonMed ? (
                <View style={styles.myMedsResearchCard}>
                  <Text style={styles.myMedsResearchLabel}>
                    {selectedCommonMed.drugClass} · {EVIDENCE_TIER_LABEL[selectedCommonMed.evidenceStrength] ?? selectedCommonMed.evidenceStrength}
                  </Text>
                  <Text style={styles.helperText}>{selectedCommonMed.commonUse}</Text>
                  {selectedCommonMed.thyroidRelevantNotes ? (
                    <Text style={styles.helperText}>{selectedCommonMed.thyroidRelevantNotes}</Text>
                  ) : null}
                  {selectedCommonMed.timingGuidance ? (
                    <Text style={styles.helperText}>Timing: {selectedCommonMed.timingGuidance}</Text>
                  ) : null}
                  {selectedCommonMed.keyInteractions ? (
                    <Text style={styles.helperText}>Key interactions: {selectedCommonMed.keyInteractions}</Text>
                  ) : null}
                </View>
              ) : medForm.manualEntry ? (
                <Text style={styles.helperText}>
                  Not in this app&apos;s researched list yet, but you can still track it with the details you know. Looking this up
                  online automatically is a planned future capability, not built yet.
                </Text>
              ) : null}

              <View style={styles.labelRow}>
                <Text style={styles.label}>Name</Text>
                <VoiceInputButton onResult={(text) => setMedForm((current) => ({ ...current, name: text }))} color={tabColor} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. Synthroid 75mcg"
                value={medForm.name}
                onChangeText={(text) => setMedForm((current) => ({ ...current, name: text }))}
              />

              {medForm.manualEntry ? (
                <>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Generic name (optional, helps interaction checking)</Text>
                    <VoiceInputButton
                      onResult={(text) => setMedForm((current) => ({ ...current, genericName: text }))}
                      color={tabColor}
                    />
                  </View>
                  <AppTextInput
                    style={styles.input}
                    placeholder="e.g. levothyroxine"
                    value={medForm.genericName}
                    onChangeText={(text) => setMedForm((current) => ({ ...current, genericName: text }))}
                  />
                </>
              ) : null}

              <Text style={styles.label}>Dose</Text>
              <View style={styles.timeRow}>
                <AppTextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="75"
                  keyboardType="decimal-pad"
                  value={medForm.doseAmount}
                  onChangeText={(text) => setMedForm((current) => ({ ...current, doseAmount: text }))}
                />
                <AppTextInput
                  style={[styles.input, styles.doseUnitInput]}
                  placeholder="mcg, mg…"
                  value={medForm.doseUnit}
                  onChangeText={(text) => setMedForm((current) => ({ ...current, doseUnit: text }))}
                />
              </View>

              <View style={styles.labelRow}>
                <Text style={styles.label}>Frequency (optional)</Text>
                <VoiceInputButton
                  onResult={(text) => setMedForm((current) => ({ ...current, frequency: text }))}
                  color={tabColor}
                />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. once daily"
                value={medForm.frequency}
                onChangeText={(text) => setMedForm((current) => ({ ...current, frequency: text }))}
              />

              <View style={styles.labelRow}>
                <Text style={styles.label}>Notes (optional)</Text>
                <VoiceInputButton onResult={(text) => setMedForm((current) => ({ ...current, notes: text }))} color={tabColor} />
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="e.g. prescribed by Dr. …"
                value={medForm.notes}
                onChangeText={(text) => setMedForm((current) => ({ ...current, notes: text }))}
              />

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={closeAddForm}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveMed}>
                  <Text style={styles.primaryButtonText}>{medForm.category === 'prescription' ? 'Add prescription' : 'Add OTC drug'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {interactionWarnings.length > 0 ? (
            <LifeBand
              folds={folds}
              color={tabColor}
              id="life:myMeds:things-to-check"
              title="Things to check"
              icon="alert-circle-outline"
              count={interactionWarnings.length}
            >
            <View style={styles.table}>
              {interactionWarnings.map((warning, index) => (
                <View key={`${warning.ruleId}_${index}`} style={styles.interactionCard}>
                  <Text style={styles.interactionTitle}>{warning.title}</Text>
                  <Text style={styles.interactionMessage}>{warning.message}</Text>
                  <Text style={styles.interactionCitation}>{warning.citation}</Text>
                  <WhyExplainer title={warning.title} mechanism={warning.mechanism} onPress={showInfoAlert} />
                </View>
              ))}
            </View>
            </LifeBand>
          ) : null}

          {referenceOnlyRules.length > 0 ? (
            <LifeBand
              folds={folds}
              color={tabColor}
              id="life:myMeds:worth-knowing"
              title="Worth knowing (reference only, not personalized)"
              icon="information-circle-outline"
              count={referenceOnlyRules.length}
            >
            <View style={styles.table}>
              {referenceOnlyRules.map((rule) => (
                <View key={rule.ruleId} style={[styles.interactionCard, styles.interactionCardReference]}>
                  <Text style={styles.interactionTitle}>{rule.title}</Text>
                  <Text style={styles.interactionMessage}>{rule.guidance}</Text>
                  <Text style={styles.interactionCitation}>{rule.citation}</Text>
                  <WhyExplainer title={rule.title} mechanism={rule.mechanism} onPress={showInfoAlert} />
                </View>
              ))}
            </View>
            </LifeBand>
          ) : null}

          {treatments.length === 0 ? (
            <View style={styles.bandBox}><Text style={styles.emptyText}>Nothing here yet. Add a prescription, OTC drug, or supplement above, then tap Schedule it to set its times in Schedules.</Text></View>
          ) : (
            <>
              {renderTreatmentGroup('Prescriptions', treatments.filter((treatment) => treatment.treatmentType === 'prescription'))}
              {renderTreatmentGroup('OTC drugs', treatments.filter((treatment) => treatment.treatmentType === 'otc'))}
              {renderTreatmentGroup('Supplements', treatments.filter((treatment) => treatment.treatmentType === 'supplement'))}
            </>
          )}
        </>
      )}
    </View>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    actionText: { ...typography.captionEmphasis, color: tabColor, ...textShadow },
    actionTextPrimary: { ...typography.captionEmphasis, color: colors.primary, ...textShadow },
    actionTextRemove: { ...typography.captionEmphasis, color: colors.danger, ...textShadow },
    addButton: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    addButtonText: { ...typography.bodyEmphasis, color: colors.primary, ...textShadow },
    bandBox: {
      ...homeBandStyle,
      borderColor: tabColor,
      padding: HOME_BAND_CONTENT_PADDING,
    },
    bodyContent: { paddingTop: 5, gap: HOME_BAND_GAP },
    doseUnitInput: { flex: 1 },
    emptyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
    errorText: { ...typography.body, color: colors.danger, ...textShadow },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
    formCard: {
      ...homeBandStyle,
      borderColor: tabColor,
      padding: HOME_BAND_CONTENT_PADDING,
    },
    helperText: { ...typography.caption, color: tabColor, marginTop: 4, marginBottom: 8, ...textShadow },
    ingredientAmountInput: { flex: 1, minWidth: 64 },
    ingredientFormRow: { marginBottom: 4 },
    ingredientNutrientCol: { flex: 2 },
    ingredientRemove: { paddingHorizontal: 6, paddingVertical: 6 },
    ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    ingredientUnitCol: { minWidth: 76 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surfaceMuted,
      ...typography.body,
      color: tabColor,
      ...textShadow,
    },
    interactionCard: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      padding: 12,
    },
    interactionCardReference: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border },
    interactionCitation: { ...typography.caption, color: tabColor, marginTop: 6, ...textShadow },
    interactionMessage: { ...typography.body, color: tabColor, marginTop: 4, ...textShadow },
    interactionTitle: { ...typography.bodyEmphasis, color: tabColor, ...textShadow },
    label: { ...typography.label, color: tabColor, marginBottom: 6, marginTop: 10, ...textShadow },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    myMedsAddRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    myMedsDetail: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    myMedsGroup: { gap: HOME_BAND_GAP },
    myMedsResearchCard: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: tabColor,
      padding: 12,
    },
    myMedsResearchLabel: { ...typography.captionEmphasis, color: tabColor, marginTop: 4, ...textShadow },
    primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
    primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton,

      // Dark text: cancel any shadow inherited from a base style it is

      // composed with. See constants/typography.ts.

      textShadowColor: 'transparent',

      textShadowRadius: 0,
    },
    row: {
      borderRadius: 10,
      backgroundColor: colors.surfaceMuted,
      padding: 12,
    },
    rowMeta: { ...typography.caption, color: tabColor, marginTop: 2, ...textShadow },
    rowTextCol: { flex: 1 },
    rowTitle: { ...typography.label, color: tabColor, ...textShadow },
    secondaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    secondaryButtonText: { ...typography.bodyEmphasis, color: tabColor, ...textShadow },
    supplementRowActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
    table: { gap: HOME_BAND_GAP },
    timeInput: { width: 56, textAlign: 'center' },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timeSeparator: { ...typography.label, color: tabColor, ...textShadow },
  });
}
