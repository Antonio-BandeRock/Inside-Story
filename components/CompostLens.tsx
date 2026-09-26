import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import {
  COMPOST_AMOUNT_UNITS,
  COMPOST_EVENT_LABELS,
  COMPOST_MATERIAL_CLASSES,
  COMPOST_MATERIAL_SUGGESTIONS,
  COMPOST_MOISTURE_LEVELS,
  COMPOST_PILE_KINDS,
  COMPOST_PILE_STATUSES,
  COMPOST_TURN_INTERVALS,
  compostTurnDueOn,
  compostTurnInterval,
  describeCompostEvent,
  summarizeCompostPile,
  type CompostEvent,
  type CompostEventKind,
  type CompostMaterialClass,
  type CompostMoisture,
  type CompostPile,
  type CompostPileKind,
  type CompostPileStatus,
} from '../lib/compost';
import {
  addCompostEvent,
  createCompostPile,
  deleteCompostEvent,
  deleteCompostPile,
  listCompostEvents,
  listCompostPiles,
  setCompostPileFeeds,
  setCompostPileStatus,
  setCompostTurnInterval,
} from '../lib/compostDb';
import { listGardenPlots, type GardenPlot } from '../lib/db';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import { sortByLabel } from '../lib/choiceOrder';
import { listGardenCostGroups, type GardenCostGroup } from '../lib/gardenMoneyDb';
import { AppTextInput } from './AppTextInput';
import { HOME_BAND_GAP } from './HomeSectionBand';
import { PopoverSelect } from './PopoverSelect';
import { RecordPhotos } from './RecordPhotos';
import { makeTabBandStyles, TabBand } from './TabBand';

// Compost, a lens of Garden.
//
// 2026-09-20, direct instruction: "Garden should have Compost available as
// a lens that tracks the materials added to the compost, when it was
// turned, watered, and everything else about making good compost."
//
// One band per pile. Inside it: how the pile is doing (lib/compost.ts
// summarizeCompostPile, which only speaks from what was recorded), a row
// of things that can happen to it, a short form for the one picked, and
// the record. A bought material takes a cost, which becomes a growing cost
// in the budget through lib/compostDb.ts; kitchen scraps take none. "Remind
// me to turn it" schedules a garden task the same way Upcoming Tasks does.
// The reading on composting is on Horticulture, one tap away.
//
// 2026-09-20, "Put compost pile costs under an area or group too": a pile
// has a Feeds setting, one area or one whole cost group, set when it is
// started and changeable on its band. Growing Costs counts anything bought
// for the pile under that area or group (lib/gardenMoneyDb.ts).

const TAB_COLOR = colors.tabGarden;
const band = makeTabBandStyles(TAB_COLOR);
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;

// Lists of names are alphabetical; status and moisture are scales and
// keep their order.
const PILE_KIND_OPTIONS = sortByLabel(COMPOST_PILE_KINDS.map((kind) => ({ label: kind.label, value: kind.code })));
const STATUS_OPTIONS = COMPOST_PILE_STATUSES.map((status) => ({ label: status.label, value: status.code }));
const CLASS_OPTIONS = sortByLabel(COMPOST_MATERIAL_CLASSES.map((entry) => ({ label: entry.label, value: entry.code })));
const MOISTURE_OPTIONS = COMPOST_MOISTURE_LEVELS.map((entry) => ({ label: entry.label, value: entry.code }));
const MATERIAL_OPTIONS = [
  ...sortByLabel(COMPOST_MATERIAL_SUGGESTIONS.map((entry) => ({ label: entry.name, value: entry.name }))),
  { label: 'Something else', value: '__other__' },
];
const AMOUNT_OPTIONS = ['0.5', '1', '2', '3', '4', '5', '6', '8', '10', '15', '20'];
const AMOUNT_UNIT_OPTIONS = [...COMPOST_AMOUNT_UNITS];
const TEMP_UNIT_OPTIONS = [
  { label: '°F', value: 'f' },
  { label: '°C', value: 'c' },
];
const TURN_INTERVAL_OPTIONS = COMPOST_TURN_INTERVALS.map((days) => ({ label: `${days} days`, value: String(days) }));
const NO_PLOT = '__none__';
const GROUP_PREFIX = 'group:';

/** What a pile can feed: nothing in particular, one whole group, or one
 *  area. A group's value carries GROUP_PREFIX so one picker holds both. */
function feedsOptions(plots: GardenPlot[], groups: GardenCostGroup[]): { label: string; value: string }[] {
  return [
    { label: 'No area in particular', value: NO_PLOT },
    ...sortByLabel([
      ...groups.map((group) => ({ label: `${group.name} (whole group)`, value: `${GROUP_PREFIX}${group.id}` })),
      ...plots.map((plot) => ({ label: plot.name, value: plot.id })),
    ]),
  ];
}
function feedsValue(pile: { plotId: string | null; costGroupId: string | null }): string {
  if (pile.costGroupId) return `${GROUP_PREFIX}${pile.costGroupId}`;
  return pile.plotId ?? NO_PLOT;
}
function feedsFromValue(value: string): { plotId: string | null; costGroupId: string | null } {
  if (value.startsWith(GROUP_PREFIX)) return { plotId: null, costGroupId: value.slice(GROUP_PREFIX.length) };
  return { plotId: value === NO_PLOT ? null : value, costGroupId: null };
}
function feedsName(pile: { plotId: string | null; costGroupId: string | null }, plots: GardenPlot[], groups: GardenCostGroup[]): string | null {
  if (pile.costGroupId) return groups.find((group) => group.id === pile.costGroupId)?.name ?? null;
  if (pile.plotId) return plots.find((plot) => plot.id === pile.plotId)?.name ?? null;
  return null;
}

const ACTIONS: { kind: CompostEventKind; label: string }[] = [
  { kind: 'added', label: 'Add Material' },
  { kind: 'turned', label: 'Turned It' },
  { kind: 'watered', label: 'Watered It' },
  { kind: 'temperature', label: 'Temperature' },
  { kind: 'moisture', label: 'Moisture' },
  { kind: 'harvested', label: 'Took Some Out' },
  { kind: 'applied', label: 'Put It on a Plot' },
  { kind: 'note', label: 'Note' },
];

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function pileKindLabel(kind: CompostPileKind): string {
  return COMPOST_PILE_KINDS.find((entry) => entry.code === kind)?.label ?? 'Pile';
}

export function CompostLens({
  scrollBottomPadding,
  onReadAboutComposting,
}: {
  scrollBottomPadding: number;
  onReadAboutComposting: (entryId: string) => void;
}) {
  const folds = useBandFolds();
  const [piles, setPiles] = useState<CompostPile[]>([]);
  const [events, setEvents] = useState<CompostEvent[]>([]);
  const [plots, setPlots] = useState<GardenPlot[]>([]);
  const [groups, setGroups] = useState<GardenCostGroup[]>([]);
  const [starting, setStarting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<CompostPileKind>('pile');
  const [newLocation, setNewLocation] = useState('');
  const [newFeeds, setNewFeeds] = useState<string>(NO_PLOT);
  const [newStartedOn, setNewStartedOn] = useState(todayDateString());
  const [startError, setStartError] = useState<string | null>(null);
  const today = todayDateString();

  const load = useCallback(async () => {
    const [pileRows, eventRows, plotRows, groupRows] = await Promise.all([
      listCompostPiles(),
      listCompostEvents(),
      listGardenPlots(),
      listGardenCostGroups(),
    ]);
    setPiles(pileRows);
    setEvents(eventRows);
    setPlots(plotRows);
    setGroups(groupRows);
  }, []);
  const newFeedsOptions = useMemo(() => feedsOptions(plots, groups), [plots, groups]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handleStart() {
    if (!newName.trim()) {
      setStartError('Give it a name.');
      return;
    }
    if (!isDateString(newStartedOn)) {
      setStartError('The date needs to be YYYY-MM-DD.');
      return;
    }
    await createCompostPile({ name: newName, kind: newKind, startedOn: newStartedOn, location: newLocation, ...feedsFromValue(newFeeds) });
    setNewName('');
    setNewKind('pile');
    setNewLocation('');
    setNewFeeds(NO_PLOT);
    setNewStartedOn(todayDateString());
    setStartError(null);
    setStarting(false);
    await load();
  }

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[band.box, styles.card]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Start a Pile</Text>
        {starting ? (
          <>
            <Text style={styles.fieldLabel}>Name</Text>
            <AppTextInput style={styles.textInput} value={newName} onChangeText={setNewName} placeholder="Back corner pile" />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Kind</Text>
              <PopoverSelect
                options={PILE_KIND_OPTIONS}
                selected={newKind}
                onSelect={(value) => setNewKind(value as CompostPileKind)}
                tabColor={TAB_COLOR}
              />
            </View>
            <Text style={styles.fieldLabel}>Where</Text>
            <AppTextInput style={styles.textInput} value={newLocation} onChangeText={setNewLocation} placeholder="Behind the shed" />
            {newFeedsOptions.length > 1 ? (
              <>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Feeds</Text>
                  <PopoverSelect options={newFeedsOptions} selected={newFeeds} onSelect={setNewFeeds} tabColor={TAB_COLOR} width={220} />
                </View>
                <Text style={styles.captionText}>
                  Anything bought for the pile counts under this area or group in Growing Costs. You can change it later.
                </Text>
              </>
            ) : null}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Started</Text>
              <AppTextInput style={[styles.textInput, styles.dateInput]} value={newStartedOn} onChangeText={setNewStartedOn} placeholder="YYYY-MM-DD" />
              <TouchableOpacity onPress={() => setNewStartedOn(todayDateString())}>
                <Text style={styles.linkText}>Today</Text>
              </TouchableOpacity>
            </View>
            {startError ? <Text style={styles.errorText}>{startError}</Text> : null}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleStart}>
                <Text style={styles.primaryButtonText}>Start It</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStarting(false)}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.captionText}>
              A pile, bin, tumbler, worm bin or trench. Record what goes in, when it is turned and watered, how hot and how
              wet it is, and when finished compost comes out. Kitchen scraps, leaves and clippings cost nothing; anything
              bought for it is set against what the garden gives back.
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={() => setStarting(true)}>
                <Text style={styles.primaryButtonText}>+ Start a Pile</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onReadAboutComposting('garden-composting-at-home')}>
                <Text style={styles.linkText}>Read about composting</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {piles.length === 0 ? (
        <View style={[band.boxMuted, styles.card]}>
          <Text style={styles.emptyText}>No pile started yet.</Text>
        </View>
      ) : (
        piles.map((pile) => (
          <PileBand
            key={pile.id}
            pile={pile}
            events={events.filter((event) => event.pileId === pile.id)}
            plots={plots}
            groups={groups}
            today={today}
            folds={folds}
            onChanged={load}
            onReadAboutComposting={onReadAboutComposting}
          />
        ))
      )}
    </ScrollView>
  );
}

function PileBand({
  pile,
  events,
  plots,
  groups,
  today,
  folds,
  onChanged,
  onReadAboutComposting,
}: {
  pile: CompostPile;
  events: CompostEvent[];
  plots: GardenPlot[];
  groups: GardenCostGroup[];
  today: string;
  folds: ReturnType<typeof useBandFolds>;
  onChanged: () => Promise<void>;
  onReadAboutComposting: (entryId: string) => void;
}) {
  const [action, setAction] = useState<CompostEventKind | null>(null);
  const [date, setDate] = useState(today);
  const [materialPick, setMaterialPick] = useState<string | null>(null);
  const [materialText, setMaterialText] = useState('');
  const [materialClass, setMaterialClass] = useState<CompostMaterialClass>('green');
  const [amount, setAmount] = useState<string | null>(null);
  const [amountUnit, setAmountUnit] = useState<string | null>('bucket');
  const [bought, setBought] = useState(false);
  const [cost, setCost] = useState('');
  const [temperature, setTemperature] = useState('');
  const [temperatureUnit, setTemperatureUnit] = useState<'c' | 'f'>('f');
  const [moisture, setMoisture] = useState<CompostMoisture | null>(null);
  const [plotId, setPlotId] = useState<string>(NO_PLOT);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [showAll, setShowAll] = useState(false);

  const summary = useMemo(() => summarizeCompostPile(pile, events, today), [pile, events, today]);
  const turnDueOn = useMemo(() => {
    let lastTurnedOn: string | null = null;
    for (const event of events) {
      if (event.pileId !== pile.id || event.kind !== 'turned') continue;
      if (!lastTurnedOn || event.occurredOn > lastTurnedOn) lastTurnedOn = event.occurredOn;
    }
    return compostTurnDueOn(pile, lastTurnedOn);
  }, [pile, events]);

  useEffect(() => {
    setError(null);
  }, [action, date, materialPick, materialText, amount, cost, temperature, moisture, note]);

  useEffect(() => {
    if (!materialPick || materialPick === '__other__') return;
    const suggestion = COMPOST_MATERIAL_SUGGESTIONS.find((entry) => entry.name === materialPick);
    if (suggestion) setMaterialClass(suggestion.materialClass);
  }, [materialPick]);

  const plotOptions = useMemo(
    () => [{ label: 'Not a tracked plot', value: NO_PLOT }, ...sortByLabel(plots.map((plot) => ({ label: plot.name, value: plot.id })))],
    [plots],
  );
  const pileFeedsOptions = useMemo(() => feedsOptions(plots, groups), [plots, groups]);
  const pileFeedsName = feedsName(pile, plots, groups);

  function reset() {
    setAction(null);
    setDate(today);
    setMaterialPick(null);
    setMaterialText('');
    setMaterialClass('green');
    setAmount(null);
    setAmountUnit('bucket');
    setBought(false);
    setCost('');
    setTemperature('');
    setMoisture(null);
    setPlotId(NO_PLOT);
    setNote('');
  }

  async function handleSaveEvent() {
    if (!action) return;
    if (!isDateString(date)) {
      setError('The date needs to be YYYY-MM-DD.');
      return;
    }
    const material = materialPick === '__other__' || !materialPick ? materialText.trim() : materialPick;
    const costValue = bought ? Number(cost.replace(/[^0-9.]/g, '')) : 0;
    const tempValue = Number(temperature.replace(/[^0-9.\-]/g, ''));
    if (action === 'added' && !material) {
      setError('Say what went in.');
      return;
    }
    if (action === 'added' && bought && (!Number.isFinite(costValue) || costValue <= 0)) {
      setError('Enter what it cost, or switch off Bought.');
      return;
    }
    if (action === 'temperature' && (!temperature.trim() || !Number.isFinite(tempValue))) {
      setError('Enter the reading.');
      return;
    }
    if (action === 'moisture' && !moisture) {
      setError('Pick how it felt.');
      return;
    }
    if (action === 'note' && !note.trim()) {
      setError('Write the note.');
      return;
    }
    await addCompostEvent({
      pileId: pile.id,
      occurredOn: date,
      kind: action,
      material: action === 'added' ? material : undefined,
      materialClass: action === 'added' ? materialClass : null,
      amount: action === 'added' || action === 'harvested' || action === 'applied' ? (amount ? Number(amount) : null) : null,
      unit: action === 'added' || action === 'harvested' || action === 'applied' ? amountUnit ?? '' : '',
      temperature: action === 'temperature' ? tempValue : null,
      temperatureUnit: action === 'temperature' ? temperatureUnit : null,
      moisture: action === 'moisture' ? moisture : null,
      plotId: action === 'applied' && plotId !== NO_PLOT ? plotId : null,
      note: note.trim() || undefined,
      cost: action === 'added' && bought ? Math.round(costValue * 100) / 100 : null,
    });
    reset();
    await onChanged();
    // A turn moves the next one on, and going curing or finished stops the
    // asking altogether, so the queue is rebuilt rather than left to the
    // next app start.
    await syncReminderNotifications();
  }

  // The cadence, 2026-09-23. This used to book one garden task and then
  // forget: it did not come back, and it did not clear when the pile was
  // actually turned, so somebody had to set it again after every turn. Now
  // it sets how often the pile wants turning and the reminder works the day
  // out from the pile itself (compostTurnDueOn), which means recording a
  // turn moves it on with nothing else to do.
  async function handleInterval(value: string) {
    await setCompostTurnInterval(pile.id, Number(value));
    await onChanged();
    await syncReminderNotifications();
  }

  async function handleStatus(status: string) {
    await setCompostPileStatus(pile.id, status as CompostPileStatus);
    await onChanged();
    await syncReminderNotifications();
  }

  async function handleFeeds(value: string) {
    await setCompostPileFeeds(pile.id, feedsFromValue(value));
    await onChanged();
  }

  async function handleDeletePile() {
    await deleteCompostPile(pile.id);
    await onChanged();
  }

  async function handleDeleteEvent(id: string) {
    await deleteCompostEvent(id);
    await onChanged();
  }

  const shownEvents = showAll ? events : events.slice(0, 8);
  const statusLabel = COMPOST_PILE_STATUSES.find((entry) => entry.code === pile.status)?.label ?? pile.status;

  return (
    <TabBand
      folds={folds}
      color={TAB_COLOR}
      id={`garden:compost:${pile.id}`}
      title={pile.name}
      icon="leaf-outline"
      count={events.length}
    >
      <View style={styles.card}>
        <Text style={styles.captionText}>
          {pileKindLabel(pile.kind)}
          {pile.location ? `, ${pile.location}` : ''} · started {pile.startedOn}, {summary.daysSinceStarted} days ago · {statusLabel}
          {pileFeedsName ? ` · feeds ${pileFeedsName}` : ''}
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.bodyText}>
            {summary.greenAdditions} green and {summary.brownAdditions} brown additions.{' '}
            {summary.daysSinceTurned === null ? 'Never turned.' : summary.daysSinceTurned === 0 ? 'Turned today.' : `Turned ${summary.daysSinceTurned} days ago.`}{' '}
            {summary.daysSinceWatered === null ? 'Never watered.' : summary.daysSinceWatered === 0 ? 'Watered today.' : `Watered ${summary.daysSinceWatered} days ago.`}
          </Text>
          {summary.lastTemperature ? (
            <Text style={styles.captionText}>
              Last reading {summary.lastTemperature.value}°{summary.lastTemperature.unit.toUpperCase()} on {summary.lastTemperature.on}.
            </Text>
          ) : null}
          {summary.lastMoisture ? (
            <Text style={styles.captionText}>
              {COMPOST_MOISTURE_LEVELS.find((entry) => entry.code === summary.lastMoisture?.level)?.label} at the last squeeze test, {summary.lastMoisture.on}.
            </Text>
          ) : null}
          {summary.guidance.map((line) => (
            <Text key={line} style={styles.guidanceText}>
              {line}
            </Text>
          ))}
          {summary.guidance.length === 0 && pile.status !== 'finished' ? (
            <Text style={styles.captionText}>Nothing it needs from what you have recorded.</Text>
          ) : null}
        </View>

        <RecordPhotos ownerKind="compost_pile" ownerId={pile.id} tabColor={TAB_COLOR} title={pile.name} />

        {pile.status !== 'finished' ? (
          <View style={styles.pillRow}>
            {ACTIONS.map((entry) => (
              <TouchableOpacity
                key={entry.kind}
                style={[styles.pill, { borderColor: TAB_COLOR }, action === entry.kind ? { backgroundColor: PRIMARY_BUTTON_BACKGROUND } : styles.pillIdle]}
                onPress={() => setAction(action === entry.kind ? null : entry.kind)}
              >
                <Text style={action === entry.kind ? styles.pillTextActive : styles.pillText}>{entry.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {action ? (
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>{COMPOST_EVENT_LABELS[action]}</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Date</Text>
              <AppTextInput style={[styles.textInput, styles.dateInput]} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
              <TouchableOpacity onPress={() => setDate(today)}>
                <Text style={styles.linkText}>Today</Text>
              </TouchableOpacity>
            </View>

            {action === 'added' ? (
              <>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>What</Text>
                  <PopoverSelect
                    options={MATERIAL_OPTIONS}
                    selected={materialPick}
                    onSelect={setMaterialPick}
                    tabColor={TAB_COLOR}
                    width={220}
                    placeholder="Pick a material"
                  />
                </View>
                {materialPick === '__other__' ? (
                  <AppTextInput style={styles.textInput} value={materialText} onChangeText={setMaterialText} placeholder="What went in" />
                ) : null}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Green or brown</Text>
                  <PopoverSelect
                    options={CLASS_OPTIONS}
                    selected={materialClass}
                    onSelect={(value) => setMaterialClass(value as CompostMaterialClass)}
                    tabColor={TAB_COLOR}
                  />
                </View>
                <Text style={styles.captionText}>{COMPOST_MATERIAL_CLASSES.find((entry) => entry.code === materialClass)?.help}</Text>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>How much</Text>
                  <PopoverSelect options={AMOUNT_OPTIONS} selected={amount} onSelect={setAmount} tabColor={TAB_COLOR} placeholder="Amount" />
                  <PopoverSelect options={AMOUNT_UNIT_OPTIONS} selected={amountUnit} onSelect={setAmountUnit} tabColor={TAB_COLOR} />
                </View>
                <View style={styles.fieldRow}>
                  <TouchableOpacity
                    style={[styles.pill, { borderColor: TAB_COLOR }, bought ? { backgroundColor: PRIMARY_BUTTON_BACKGROUND } : styles.pillIdle]}
                    onPress={() => setBought(!bought)}
                  >
                    <Text style={bought ? styles.pillTextActive : styles.pillText}>{bought ? 'Bought' : 'Free'}</Text>
                  </TouchableOpacity>
                  {bought ? (
                    <AppTextInput
                      style={[styles.textInput, styles.shortInput]}
                      value={cost}
                      onChangeText={setCost}
                      placeholder="Cost"
                      keyboardType="decimal-pad"
                    />
                  ) : null}
                </View>
                <Text style={styles.captionText}>
                  {bought
                    ? 'A bought material is a growing cost: it goes into your budget under Garden & growing supplies and is set against what the garden gives back.'
                    : 'Kitchen scraps, leaves and clippings cost nothing.'}
                </Text>
              </>
            ) : null}

            {action === 'temperature' ? (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Reading</Text>
                <AppTextInput
                  style={[styles.textInput, styles.shortInput]}
                  value={temperature}
                  onChangeText={setTemperature}
                  placeholder="135"
                  keyboardType="decimal-pad"
                />
                <PopoverSelect
                  options={TEMP_UNIT_OPTIONS}
                  selected={temperatureUnit}
                  onSelect={(value) => setTemperatureUnit(value as 'c' | 'f')}
                  tabColor={TAB_COLOR}
                />
              </View>
            ) : null}

            {action === 'moisture' ? (
              <>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Squeeze a handful</Text>
                  <PopoverSelect
                    options={MOISTURE_OPTIONS}
                    selected={moisture}
                    onSelect={(value) => setMoisture(value as CompostMoisture)}
                    tabColor={TAB_COLOR}
                    placeholder="How it felt"
                  />
                </View>
                {moisture ? <Text style={styles.captionText}>{COMPOST_MOISTURE_LEVELS.find((entry) => entry.code === moisture)?.help}</Text> : null}
              </>
            ) : null}

            {action === 'harvested' || action === 'applied' ? (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>How much</Text>
                <PopoverSelect options={AMOUNT_OPTIONS} selected={amount} onSelect={setAmount} tabColor={TAB_COLOR} placeholder="Amount" />
                <PopoverSelect options={AMOUNT_UNIT_OPTIONS} selected={amountUnit} onSelect={setAmountUnit} tabColor={TAB_COLOR} />
              </View>
            ) : null}

            {action === 'applied' && plots.length > 0 ? (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Which plot</Text>
                <PopoverSelect options={plotOptions} selected={plotId} onSelect={setPlotId} tabColor={TAB_COLOR} width={220} />
              </View>
            ) : null}

            {action === 'note' || action === 'turned' || action === 'watered' ? (
              <AppTextInput
                style={styles.textInput}
                value={note}
                onChangeText={setNote}
                placeholder={action === 'note' ? 'What you noticed' : 'Anything worth noting (optional)'}
              />
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleSaveEvent}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={reset}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {pile.status === 'active' ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Turn it every</Text>
            <PopoverSelect
              options={TURN_INTERVAL_OPTIONS}
              selected={String(compostTurnInterval(pile))}
              onSelect={handleInterval}
              tabColor={TAB_COLOR}
            />
          </View>
        ) : null}
        {turnDueOn ? (
          <Text style={styles.captionText}>
            Next turn due {turnDueOn}. You will be reminded at 9:00 that day, and again every few days until you record one.
          </Text>
        ) : null}

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Status</Text>
          <PopoverSelect options={STATUS_OPTIONS} selected={pile.status} onSelect={handleStatus} tabColor={TAB_COLOR} />
          <TouchableOpacity onPress={() => onReadAboutComposting(pile.status === 'active' ? 'garden-hot-composting' : 'garden-composting-at-home')}>
            <Text style={styles.linkText}>Read more</Text>
          </TouchableOpacity>
        </View>
        {pileFeedsOptions.length > 1 ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Feeds</Text>
            <PopoverSelect options={pileFeedsOptions} selected={feedsValue(pile)} onSelect={handleFeeds} tabColor={TAB_COLOR} width={220} />
          </View>
        ) : null}
        <Text style={styles.captionText}>
          {pileFeedsOptions.length > 1
            ? 'What was bought for this pile counts under the area or group it feeds in Growing Costs; with none picked it sits with the untied costs.'
            : 'Add an area under Plots & Plantings and the pile can feed it, so what was bought for the pile counts there in Growing Costs.'}
        </Text>

        {events.length > 0 ? (
          <View style={styles.eventList}>
            {shownEvents.map((event) => (
              <View key={event.id} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.bodyText}>{describeCompostEvent(event)}</Text>
                  <Text style={styles.captionText}>
                    {event.occurredOn}
                    {event.financeEntryId ? ' · bought, in your budget' : ''}
                    {event.kind !== 'note' && event.note ? ` · ${event.note}` : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteEvent(event.id)}>
                  <Text style={[styles.linkText, { color: colors.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
            {events.length > 8 ? (
              <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                <Text style={styles.linkText}>{showAll ? 'Show fewer' : `Show all ${events.length}`}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <Text style={styles.captionText}>Nothing recorded for this pile yet.</Text>
        )}

        <TouchableOpacity onPress={handleDeletePile}>
          <Text style={[styles.linkText, { color: colors.danger }]}>Delete this pile and its record</Text>
        </TouchableOpacity>
      </View>
    </TabBand>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: 32, gap: HOME_BAND_GAP },
  card: { gap: 8 },
  cardTitle: { ...typography.sectionTitle, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  guidanceText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  emptyText: { ...typography.body, ...textShadow, color: colors.textSecondary, textAlign: 'center' },
  statusCard: { borderRadius: 10, backgroundColor: colors.surfaceMuted, padding: 12, gap: 4 },
  formCard: { borderRadius: 10, backgroundColor: colors.surfaceMuted, padding: 12, gap: 8 },
  eventList: { gap: 8 },
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
  shortInput: { width: 110 },
  dateInput: { width: 140 },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  pillIdle: { backgroundColor: colors.surface },
  pillText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  pillTextActive: {
    ...typography.caption,
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowText: { flex: 1, gap: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', ...BUTTON_SHADOW },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
