// My Crops, the first band of Garden > Sowing Calendar, 2026-10-01.
//
// The crops somebody intends to grow, each with the area it will go in,
// and where its next window stands. Choosing a crop is what lets the app
// speak about it: a week before each window a reminder to get the area
// ready, and on the day it opens one to sow, each answerable on the
// notification (lib/cropPlan.ts, lib/reminderSources.ts). Nothing is sent
// for a crop nobody chose, and "This month in the garden" names only these.
//
// An area can be picked from Plots & Plantings or made here on the spot,
// indoors, outdoors or in a greenhouse. Sown records the step for that
// window; the planting itself (which needs the food it is) is added under
// Plots & Plantings, and the row offers the way there.

import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { useBandFolds } from '../hooks/useBandFolds';
import { sortByLabel } from '../lib/choiceOrder';
import { cropName, cropRowState, type AreaKind, type CropPlan, type CropPlanStep } from '../lib/cropPlan';
import {
  addCropPlan,
  clearCropStep,
  listCropPlans,
  listCropPlanSteps,
  recordCropStep,
  removeCropPlan,
  setCropPlanArea,
} from '../lib/cropPlanDb';
import { createGardenPlot, listGardenPlots, type GardenPlot } from '../lib/db';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import { SOWING_WINDOWS, type FrostAnchor } from '../lib/sowingWindows';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';
import { useTabBandStyles, TabBand } from './TabBand';

type Folds = ReturnType<typeof useBandFolds>;

const NO_AREA = '__no_area__';
const NEW_AREA = '__new_area__';

const AREA_KIND_OPTIONS: { label: string; value: AreaKind }[] = [
  { label: 'Outdoors', value: 'outdoor' },
  { label: 'Indoors', value: 'indoor' },
  { label: 'Greenhouse', value: 'greenhouse' },
];

const AREA_KIND_WORDS: Record<AreaKind, string> = { outdoor: 'outdoors', indoor: 'indoors', greenhouse: 'greenhouse' };

export function MyCropsBand({
  folds,
  color,
  anchor,
  today,
  onOpenPlantings,
}: {
  folds: Folds;
  color: string;
  anchor: FrostAnchor | null;
  today: string;
  onOpenPlantings: () => void;
}) {
  const band = useTabBandStyles(color);
  const [plans, setPlans] = useState<CropPlan[]>([]);
  const [steps, setSteps] = useState<CropPlanStep[]>([]);
  const [plots, setPlots] = useState<GardenPlot[]>([]);
  // The form: adding a crop, or changing the area of one already chosen.
  const [formFor, setFormFor] = useState<'add' | CropPlan | null>(null);
  const [cropKey, setCropKey] = useState<string | null>(null);
  const [areaId, setAreaId] = useState<string>(NO_AREA);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaKind, setNewAreaKind] = useState<AreaKind>('outdoor');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, s, g] = await Promise.all([listCropPlans(), listCropPlanSteps(), listGardenPlots()]);
    setPlans(p);
    setSteps(s);
    setPlots(g);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const sortedPlans = useMemo(() => [...plans].sort((a, b) => cropName(a.cropKey).localeCompare(cropName(b.cropKey))), [plans]);

  const cropOptions = useMemo(() => {
    const chosen = new Set(plans.map((p) => p.cropKey));
    return sortByLabel(SOWING_WINDOWS.filter((w) => !chosen.has(w.key)).map((w) => ({ label: cropName(w.key), value: w.key })));
  }, [plans]);

  const areaOptions = useMemo(
    () => [
      { label: 'Not decided yet', value: NO_AREA },
      ...sortByLabel(plots.map((p) => ({ label: `${p.name} (${AREA_KIND_WORDS[p.locationType]})`, value: p.id }))),
      { label: 'Add an area', value: NEW_AREA },
    ],
    [plots],
  );

  function openForm(target: 'add' | CropPlan) {
    setFormFor(target);
    setCropKey(target === 'add' ? null : target.cropKey);
    setAreaId(target === 'add' ? NO_AREA : target.plotId ?? NO_AREA);
    setNewAreaName('');
    setNewAreaKind('outdoor');
    setError(null);
  }

  async function afterChange() {
    await load();
    void syncReminderNotifications();
  }

  async function handleSave() {
    if (formFor === null) return;
    if (formFor === 'add' && !cropKey) {
      setError('Pick a crop first.');
      return;
    }
    let plotId: string | null = areaId === NO_AREA ? null : areaId;
    if (areaId === NEW_AREA) {
      const name = newAreaName.trim();
      if (!name) {
        setError('Give the new area a name, such as Back bed or Kitchen window.');
        return;
      }
      plotId = await createGardenPlot({ name, locationType: newAreaKind });
    }
    if (formFor === 'add') await addCropPlan(cropKey as string, plotId);
    else await setCropPlanArea(formFor.id, plotId);
    setFormFor(null);
    await afterChange();
  }

  async function toggleStep(plan: CropPlan, action: Parameters<typeof recordCropStep>[1], windowStart: string, step: 'prepped' | 'sown', done: boolean) {
    if (done) await clearCropStep(plan.id, action, windowStart, step);
    else await recordCropStep(plan.id, action, windowStart, step, today);
    await afterChange();
  }

  async function handleRemove(plan: CropPlan) {
    await removeCropPlan(plan.id);
    if (formFor !== 'add' && formFor?.id === plan.id) setFormFor(null);
    await afterChange();
  }

  function areaLine(plan: CropPlan): string {
    if (!plan.plotName) return 'No area picked yet.';
    const where = plan.plotLocation ? `, ${AREA_KIND_WORDS[plan.plotLocation]}` : '';
    return plan.plotArchived ? `${plan.plotName}${where}, now in Past Areas.` : `${plan.plotName}${where}.`;
  }

  function renderForm() {
    const editing = formFor !== 'add' && formFor !== null ? formFor : null;
    return (
      <View style={[band.row, styles.form]}>
        {editing ? (
          <Text style={styles.fieldLabel}>Where {cropName(editing.cropKey)} will grow</Text>
        ) : (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Crop</Text>
            <PopoverSelect
              options={cropOptions}
              selected={cropKey}
              onSelect={setCropKey}
              tabColor={color}
              placeholder="Pick a crop"
              searchable
              width={240}
            />
          </View>
        )}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Area</Text>
          <PopoverSelect options={areaOptions} selected={areaId} onSelect={setAreaId} tabColor={color} width={240} />
        </View>
        {areaId === NEW_AREA ? (
          <>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Name</Text>
              <AppTextInput
                style={[styles.textInput, styles.wideInput]}
                value={newAreaName}
                onChangeText={setNewAreaName}
                placeholder="Back bed, kitchen window, tent"
              />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Where</Text>
              <PopoverSelect
                options={AREA_KIND_OPTIONS}
                selected={newAreaKind}
                onSelect={(value) => setNewAreaKind(value as AreaKind)}
                tabColor={color}
                width={180}
              />
            </View>
            <Text style={styles.captionText}>
              Its size, soil, sun or lights can be filled in later under Plots & Plantings.
            </Text>
          </>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => void handleSave()}>
            <Text style={styles.primaryButtonText}>{editing ? 'Save Area' : 'Add to My Crops'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFormFor(null)}>
            <Text style={[styles.linkText, { color }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TabBand folds={folds} color={color} id="garden:sowing:mycrops" title="My Crops" icon="flower-outline" count={plans.length}>
      <View style={band.rows}>
        {plans.length === 0 ? (
          <View style={band.row}>
            <Text style={styles.bodyText}>
              Pick the crops you intend to grow and where each will go. A week before each one&apos;s window opens you are
              reminded to get its area ready, and on the day it opens, to sow. Nothing is sent about a crop you did not pick.
            </Text>
          </View>
        ) : null}

        {sortedPlans.map((plan) => {
          const state = cropRowState(plan, steps, anchor, today);
          const editingThis = formFor !== null && formFor !== 'add' && formFor.id === plan.id;
          return (
            <View key={plan.id} style={[band.row, styles.cropRow]}>
              <Text style={styles.bodyEmphasis}>{cropName(plan.cropKey)}</Text>
              <Text style={styles.captionText}>{areaLine(plan)}</Text>
              <Text style={styles.bodyText}>{state.line}</Text>
              {state.kind === 'next' ? (
                <View style={styles.actionRow}>
                  {!state.sown ? (
                    <TouchableOpacity onPress={() => void toggleStep(plan, state.window.action, state.window.start, 'prepped', state.prepped)}>
                      <Text style={[styles.linkText, { color }]}>{state.prepped ? 'Not prepped yet' : 'Prepped'}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => void toggleStep(plan, state.window.action, state.window.start, 'sown', state.sown)}>
                    <Text style={[styles.linkText, { color }]}>{state.sown ? 'Not sown yet' : 'Sown'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {state.kind === 'next' && state.sown ? (
                <TouchableOpacity onPress={onOpenPlantings}>
                  <Text style={[styles.linkText, { color }]}>Add the planting in Plots & Plantings</Text>
                </TouchableOpacity>
              ) : null}
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => openForm(plan)}>
                  <Text style={[styles.linkText, { color }]}>{plan.plotName ? 'Change area' : 'Pick an area'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => void handleRemove(plan)}>
                  <Text style={[styles.linkText, { color: colors.danger }]}>Remove</Text>
                </TouchableOpacity>
              </View>
              {editingThis ? renderForm() : null}
            </View>
          );
        })}

        {formFor === 'add' ? (
          renderForm()
        ) : (
          <View style={band.row}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => openForm('add')}>
              <Text style={styles.primaryButtonText}>+ Add a Crop</Text>
            </TouchableOpacity>
          </View>
        )}

        {plans.length > 0 && !anchor ? (
          <View style={band.row}>
            <Text style={styles.captionText}>
              Reminders start once a place is saved in My Zone and its frost dates are worked out.
            </Text>
          </View>
        ) : null}
      </View>
    </TabBand>
  );
}

const styles = StyleSheet.create({
  cropRow: { gap: 4 },
  form: { gap: 8 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  bodyEmphasis: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  linkText: { ...typography.body, ...textShadow },
  errorText: { ...typography.body, color: colors.danger, ...textShadow },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  wideInput: { flex: 1, minWidth: 160 },
  primaryButton: {
    backgroundColor: colors.buttonColor,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
    ...BUTTON_SHADOW,
  },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
});
