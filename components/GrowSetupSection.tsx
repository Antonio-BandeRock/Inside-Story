// A garden area's grow setup: the light, and everything else the grow runs
// on, each piece with what it cost to buy and what it costs to keep going.
//
// Added 2026-09-21 (lib/growSetup.ts has the reasoning in full). Two
// exports:
//
//   LightFields is the light's details (kind of light, wattage, hours a
//   day, timer, spectrum, the stage it suits, what it cost), used in two
//   places: on the area form, where an indoor area is asked what lights it
//   in place of how much sun it gets, and inside this section's add form
//   when the kind picked is a grow light. Its state is a LightDraft the
//   parent owns, so the area form can save the light with the area.
//
//   GrowSetupSection renders under an open area on Plots & Plantings: the
//   pieces recorded, what the setup draws a month (priced at the bills'
//   rate once a bill is recorded under Growing Costs), what it costs a month
//   in services and replacements, and the add form. A piece's purchase is
//   recorded as a growing cost under the area by addGrowEquipment, so it is
//   not entered twice. Removal follows the standing rule: a piece with a
//   purchase behind it, or one already retired, is marked no longer in use
//   and kept; only a costless piece still in use can be removed outright.

import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { formatTradeMoney } from '../lib/harvestTrade';
import {
  describeEquipment,
  describeSetupPower,
  electricityRate,
  ONGOING_CADENCES,
  PLANT_STAGES,
  summarizeOngoing,
  summarizeSetupPower,
  type CustomGardenTerm,
  type GrowEquipment,
} from '../lib/growSetup';
import {
  addGrowEquipment,
  deleteGrowEquipment,
  listElectricityBills,
  listGardenTerms,
  listGrowEquipment,
  retireGrowEquipment,
  type GrowEquipmentInput,
} from '../lib/growSetupDb';
import { AppTextInput } from './AppTextInput';
import { GardenTermField } from './GardenTermField';
import { PopoverSelect } from './PopoverSelect';

const TAB_COLOR = colors.tabGarden;
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/** A typed number, or null for nothing typed or nothing numeric. */
function numberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// --- The light -------------------------------------------------------------

export type LightDraft = {
  lightType: string | null;
  name: string;
  quantity: string;
  watts: string;
  hours: string;
  onTimer: boolean;
  spectrum: string | null;
  plantStage: string | null;
  cost: string;
  costDate: string;
};

export function emptyLightDraft(): LightDraft {
  return { lightType: null, name: '', quantity: '', watts: '', hours: '', onTimer: false, spectrum: null, plantStage: null, cost: '', costDate: todayDateString() };
}

/** Whether the draft describes a light at all: a kind of light is the one
 *  thing it needs. */
export function lightDraftHasLight(draft: LightDraft): boolean {
  return draft.lightType !== null;
}

/** The equipment row a light draft saves as, for an area just created or
 *  one already open. */
export function lightDraftToInput(draft: LightDraft, plotId: string, terms: CustomGardenTerm[]): GrowEquipmentInput {
  const cost = numberOrNull(draft.cost);
  return {
    plotId,
    kind: 'light',
    name: draft.name.trim() || null,
    quantity: numberOrNull(draft.quantity) ?? 1,
    watts: numberOrNull(draft.watts),
    hoursPerDay: numberOrNull(draft.hours),
    onTimer: draft.onTimer,
    lightType: draft.lightType,
    spectrum: draft.spectrum,
    plantStage: draft.plantStage,
    purchase: cost !== null ? { amount: cost, occurredOn: isDateString(draft.costDate) ? draft.costDate : todayDateString() } : null,
    terms,
  };
}

type PillOption = { value: string; label: string };

function PillRow({ options, selected, onSelect }: { options: PillOption[]; selected: string | null; onSelect: (value: string) => void }) {
  return (
    <View style={styles.pillRow}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[styles.pill, { borderColor: TAB_COLOR }, selected === option.value ? { backgroundColor: PRIMARY_BUTTON_BACKGROUND } : null]}
          onPress={() => onSelect(option.value)}
        >
          <Text style={selected === option.value ? styles.pillTextActive : { color: TAB_COLOR }}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const YES_NO: PillOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

type LightFieldsProps = {
  draft: LightDraft;
  onChange: (draft: LightDraft) => void;
  terms: CustomGardenTerm[];
  onTermsChanged: () => Promise<void> | void;
  /** On the area form the cost fields sit here; inside the setup form the
   *  parent has its own. */
  withCost?: boolean;
};

export function LightFields({ draft, onChange, terms, onTermsChanged, withCost = true }: LightFieldsProps) {
  return (
    <View style={styles.fields}>
      <GardenTermField
        list="light_type"
        label="Kind of light"
        selected={draft.lightType}
        onSelect={(lightType) => onChange({ ...draft, lightType })}
        terms={terms}
        onTermsChanged={onTermsChanged}
        showHelp
      />
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Make or model</Text>
        <AppTextInput style={[styles.textInput, styles.wideInput]} value={draft.name} onChangeText={(name) => onChange({ ...draft, name })} placeholder="Optional" />
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>How many</Text>
        <AppTextInput style={[styles.textInput, styles.shortInput]} value={draft.quantity} onChangeText={(quantity) => onChange({ ...draft, quantity })} placeholder="1" keyboardType="numeric" />
        <Text style={styles.fieldLabel}>Watts each</Text>
        <AppTextInput style={[styles.textInput, styles.shortInput]} value={draft.watts} onChangeText={(watts) => onChange({ ...draft, watts })} placeholder="W" keyboardType="numeric" />
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Hours a day</Text>
        <AppTextInput style={[styles.textInput, styles.shortInput]} value={draft.hours} onChangeText={(hours) => onChange({ ...draft, hours })} placeholder="16" keyboardType="numeric" />
      </View>
      <Text style={styles.fieldLabel}>On a timer?</Text>
      <PillRow options={YES_NO} selected={draft.onTimer ? 'yes' : 'no'} onSelect={(value) => onChange({ ...draft, onTimer: value === 'yes' })} />
      <GardenTermField
        list="light_spectrum"
        label="Spectrum"
        selected={draft.spectrum}
        onSelect={(spectrum) => onChange({ ...draft, spectrum })}
        terms={terms}
        onTermsChanged={onTermsChanged}
        showHelp
      />
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Suited to</Text>
        <PopoverSelect
          options={PLANT_STAGES}
          selected={draft.plantStage}
          onSelect={(plantStage) => onChange({ ...draft, plantStage })}
          tabColor={TAB_COLOR}
          width={220}
          placeholder="Pick a stage"
        />
      </View>
      <Text style={styles.captionText}>
        Seedlings and cuttings want a gentle, blue-leaning light close over them; leafy growth wants blue; flowering and fruiting want red. A full-spectrum or adjustable light covers every stage.
      </Text>
      {withCost ? (
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>What it cost</Text>
          <AppTextInput style={[styles.textInput, styles.shortInput]} value={draft.cost} onChangeText={(cost) => onChange({ ...draft, cost })} placeholder="0.00" keyboardType="decimal-pad" />
          <Text style={styles.fieldLabel}>Bought on</Text>
          <AppTextInput style={[styles.textInput, styles.dateInput]} value={draft.costDate} onChangeText={(costDate) => onChange({ ...draft, costDate })} placeholder="YYYY-MM-DD" />
        </View>
      ) : null}
    </View>
  );
}

// --- The section -------------------------------------------------------------

type Draft = {
  kind: string | null;
  name: string;
  quantity: string;
  watts: string;
  hours: string;
  onTimer: boolean;
  light: LightDraft;
  containerMaterial: string | null;
  containerSize: string;
  ongoingAmount: string;
  ongoingCadence: string | null;
  cost: string;
  costDate: string;
  notes: string;
};

function emptyDraft(): Draft {
  return {
    kind: null,
    name: '',
    quantity: '',
    watts: '',
    hours: '',
    onTimer: false,
    light: emptyLightDraft(),
    containerMaterial: null,
    containerSize: '',
    ongoingAmount: '',
    ongoingCadence: null,
    cost: '',
    costDate: todayDateString(),
    notes: '',
  };
}

const CADENCE_OPTIONS = ONGOING_CADENCES.map((entry) => ({ value: entry.value, label: entry.label }));

type Props = {
  plot: { id: string; locationType: 'outdoor' | 'indoor' | 'greenhouse'; sunlightExposure: string | null };
  /** Called after anything here changes, since a piece recorded under an
   *  area is a record that keeps the area from being deleted, and a
   *  purchase is a growing cost the screen may be showing. */
  onChanged?: () => Promise<void> | void;
};

export function GrowSetupSection({ plot, onChanged }: Props) {
  const [items, setItems] = useState<GrowEquipment[]>([]);
  const [terms, setTerms] = useState<CustomGardenTerm[]>([]);
  const [rate, setRate] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [rows, termRows, bills] = await Promise.all([listGrowEquipment(plot.id), listGardenTerms(true), listElectricityBills()]);
    setItems(rows);
    setTerms(termRows);
    setRate(electricityRate(bills));
  }, [plot.id]);

  useEffect(() => {
    load();
  }, [load]);

  const reloadTerms = useCallback(async () => {
    setTerms(await listGardenTerms(true));
  }, []);

  async function handleSave() {
    if (!draft.kind) {
      setError('Pick what kind of equipment this is.');
      return;
    }
    const cost = numberOrNull(draft.cost);
    if (draft.cost.trim() && cost === null) {
      setError('Enter what it cost as a number, or leave it blank.');
      return;
    }
    if (draft.cost.trim() && !isDateString(draft.costDate)) {
      setError('Enter the purchase date as YYYY-MM-DD.');
      return;
    }
    const ongoingAmount = numberOrNull(draft.ongoingAmount);
    if (ongoingAmount !== null && !draft.ongoingCadence) {
      setError('Pick how often that ongoing amount comes round.');
      return;
    }
    let input: GrowEquipmentInput;
    if (draft.kind === 'light') {
      input = lightDraftToInput({ ...draft.light, cost: draft.cost, costDate: draft.costDate }, plot.id, terms);
    } else {
      input = {
        plotId: plot.id,
        kind: draft.kind,
        name: draft.name.trim() || null,
        quantity: numberOrNull(draft.quantity) ?? 1,
        watts: numberOrNull(draft.watts),
        hoursPerDay: numberOrNull(draft.hours),
        onTimer: draft.onTimer,
        containerMaterial: draft.kind === 'container' ? draft.containerMaterial : null,
        containerSize: draft.kind === 'container' ? draft.containerSize.trim() || null : null,
        purchase: cost !== null ? { amount: cost, occurredOn: draft.costDate } : null,
        terms,
      };
    }
    input.ongoingAmount = ongoingAmount;
    input.ongoingCadence = ongoingAmount !== null ? draft.ongoingCadence : null;
    input.notes = draft.notes.trim() || null;
    await addGrowEquipment(input);
    setDraft(emptyDraft());
    setAdding(false);
    setError(null);
    await load();
    if (onChanged) await onChanged();
  }

  async function handleRetire(item: GrowEquipment) {
    await retireGrowEquipment(item.id, !item.retiredAt);
    await load();
    if (onChanged) await onChanged();
  }

  async function handleDelete(item: GrowEquipment) {
    await deleteGrowEquipment(item.id);
    await load();
    if (onChanged) await onChanged();
  }

  const inUse = items.filter((item) => !item.retiredAt);
  const retired = items.filter((item) => item.retiredAt);
  const power = summarizeSetupPower(items);
  const ongoing = summarizeOngoing(items);
  const isLight = draft.kind === 'light';
  const isContainer = draft.kind === 'container';
  const hasLight = items.some((item) => item.kind === 'light' && !item.retiredAt);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Grow Setup</Text>
      {plot.sunlightExposure === 'indoor_led_timer' && !hasLight ? (
        <Text style={styles.captionText}>This area was recorded as lit by LED lights on a timer before lights had details of their own. Add the light here, with its wattage and hours, and the setup can be priced.</Text>
      ) : null}
      {plot.locationType === 'indoor' && !hasLight && plot.sunlightExposure !== 'indoor_led_timer' ? (
        <Text style={styles.captionText}>No light is recorded for this indoor area yet. Indoors, the light is the sun, so it is the first thing to add.</Text>
      ) : null}
      {items.length === 0 ? (
        <Text style={styles.captionText}>Nothing recorded here yet. Lights, containers, hydroponic gear, humidity, timers, cooling, heating, water filtration, fans, exhaust, air filters and meters all go here, each with what it cost and what it runs on.</Text>
      ) : null}
      {inUse.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <View style={styles.itemText}>
            <Text style={styles.bodyText}>{describeEquipment(item, terms)}</Text>
            {item.name ? <Text style={styles.captionText}>{item.name}</Text> : null}
            {item.notes ? <Text style={styles.captionText}>{item.notes}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => handleRetire(item)}>
            <Text style={styles.linkText}>No longer in use</Text>
          </TouchableOpacity>
          {!item.purchaseEntryId ? (
            <TouchableOpacity onPress={() => handleDelete(item)}>
              <Text style={[styles.linkText, { color: colors.danger }]}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
      {items.length > 0 ? (
        <>
          <Text style={styles.captionText}>{describeSetupPower(power, rate)}</Text>
          {ongoing > 0 ? <Text style={styles.captionText}>Services, filters and other running costs recorded here come to about {formatTradeMoney(ongoing)} a month.</Text> : null}
        </>
      ) : null}
      {retired.length > 0 ? (
        <View style={styles.retiredBlock}>
          <Text style={styles.fieldLabel}>No longer in use</Text>
          {retired.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemText}>
                <Text style={[styles.bodyText, styles.retiredText]}>{describeEquipment(item, terms)}</Text>
                {item.name ? <Text style={styles.captionText}>{item.name}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleRetire(item)}>
                <Text style={styles.linkText}>Back in use</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {adding ? (
        <View style={styles.nestedForm}>
          <GardenTermField
            list="equipment_kind"
            label="What is it?"
            selected={draft.kind}
            onSelect={(kind) => setDraft({ ...draft, kind })}
            terms={terms}
            onTermsChanged={reloadTerms}
            showHelp
          />
          {isLight ? (
            <LightFields draft={draft.light} onChange={(light) => setDraft({ ...draft, light })} terms={terms} onTermsChanged={reloadTerms} withCost={false} />
          ) : draft.kind ? (
            <>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Make or model</Text>
                <AppTextInput style={[styles.textInput, styles.wideInput]} value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="Optional" />
              </View>
              {isContainer ? (
                <>
                  <GardenTermField
                    list="container_material"
                    label="Made of"
                    selected={draft.containerMaterial}
                    onSelect={(containerMaterial) => setDraft({ ...draft, containerMaterial })}
                    terms={terms}
                    onTermsChanged={reloadTerms}
                    showHelp
                  />
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Size</Text>
                    <AppTextInput style={[styles.textInput, styles.shortInput]} value={draft.containerSize} onChangeText={(containerSize) => setDraft({ ...draft, containerSize })} placeholder="5 gal" />
                    <Text style={styles.fieldLabel}>How many</Text>
                    <AppTextInput style={[styles.textInput, styles.shortInput]} value={draft.quantity} onChangeText={(quantity) => setDraft({ ...draft, quantity })} placeholder="1" keyboardType="numeric" />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>How many</Text>
                    <AppTextInput style={[styles.textInput, styles.shortInput]} value={draft.quantity} onChangeText={(quantity) => setDraft({ ...draft, quantity })} placeholder="1" keyboardType="numeric" />
                    <Text style={styles.fieldLabel}>Watts each</Text>
                    <AppTextInput style={[styles.textInput, styles.shortInput]} value={draft.watts} onChangeText={(watts) => setDraft({ ...draft, watts })} placeholder="W" keyboardType="numeric" />
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Hours a day</Text>
                    <AppTextInput style={[styles.textInput, styles.shortInput]} value={draft.hours} onChangeText={(hours) => setDraft({ ...draft, hours })} placeholder="24" keyboardType="numeric" />
                  </View>
                  <Text style={styles.fieldLabel}>On a timer?</Text>
                  <PillRow options={YES_NO} selected={draft.onTimer ? 'yes' : 'no'} onSelect={(value) => setDraft({ ...draft, onTimer: value === 'yes' })} />
                  <Text style={styles.captionText}>Wattage and hours are what the electricity estimate is made of. Leave them blank on anything that draws no power.</Text>
                </>
              )}
            </>
          ) : null}
          {draft.kind ? (
            <>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>What it cost</Text>
                <AppTextInput style={[styles.textInput, styles.shortInput]} value={draft.cost} onChangeText={(cost) => setDraft({ ...draft, cost })} placeholder="0.00" keyboardType="decimal-pad" />
                <Text style={styles.fieldLabel}>Bought on</Text>
                <AppTextInput style={[styles.textInput, styles.dateInput]} value={draft.costDate} onChangeText={(costDate) => setDraft({ ...draft, costDate })} placeholder="YYYY-MM-DD" />
              </View>
              <Text style={styles.captionText}>The cost is recorded under Growing Costs for this area, so the household budget sees it once. Leave it blank for something you already had.</Text>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Ongoing</Text>
                <AppTextInput style={[styles.textInput, styles.shortInput]} value={draft.ongoingAmount} onChangeText={(ongoingAmount) => setDraft({ ...draft, ongoingAmount })} placeholder="0.00" keyboardType="decimal-pad" />
                <PopoverSelect
                  options={CADENCE_OPTIONS}
                  selected={draft.ongoingCadence}
                  onSelect={(ongoingCadence) => setDraft({ ...draft, ongoingCadence })}
                  tabColor={TAB_COLOR}
                  width={120}
                  placeholder="how often"
                />
              </View>
              <Text style={styles.captionText}>A filter that gets replaced, a nutrient subscription, a service plan. Electricity is not entered here; it comes from the bills under Growing Costs.</Text>
              <AppTextInput style={styles.textInput} value={draft.notes} onChangeText={(notes) => setDraft({ ...draft, notes })} placeholder="Notes (optional)" multiline />
            </>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Save to the Setup</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setAdding(false); setError(null); }}>
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={() => setAdding(true)}>
          <Text style={styles.primaryButtonText}>+ Add to the Setup</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  fields: { gap: 8 },
  heading: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  retiredText: { color: colors.textMuted },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  itemText: { flex: 1, minWidth: 160, gap: 2 },
  retiredBlock: { gap: 6, marginTop: 4 },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  shortInput: { width: 90 },
  wideInput: { flex: 1, minWidth: 160 },
  dateInput: { width: 130 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  pillTextActive: { color: colors.textOnButton },
  nestedForm: { gap: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR, marginVertical: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', alignSelf: 'flex-start', ...BUTTON_SHADOW },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
