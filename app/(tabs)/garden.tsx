import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { HelpSection } from '../../components/HelpButton';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub, type MyItemsCategory } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { AppTextInput } from '../../components/AppTextInput';
import { FoodLookup, type ResolvedFoodSelection } from '../../components/FoodLookup';
import { PopoverSelect } from '../../components/PopoverSelect';
import { colors, popoverBackground } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import { USDA_ZONES, zoneBandInfo } from '../../lib/gardenZones';
import {
  archiveGardenPlot,
  createGardenPlanting,
  createGardenPlot,
  deleteGardenHarvest,
  deleteGardenPlanting,
  deleteGardenPlot,
  getUserProfile,
  listGardenHarvests,
  listGardenPlantings,
  listGardenPlots,
  listUpcomingGardenTasks,
  recordGardenHarvest,
  scheduleGardenTask,
  setUserProfile,
  type GardenHarvest,
  type GardenPlanting,
  type GardenPlot,
} from '../../lib/db';

// This page's own identity color -- see constants/colors.ts's own comment
// on tabGarden for how it was chosen.
const TAB_COLOR = colors.tabGarden;

// A real, deliberately soft fill for every "primary action" button and the
// active-toggle pill in this file, 2026-08-13, direct report: "make the
// background of the Add a Harvest button be a little easier to read and
// easier on the eyes. This green is a bit too much for the eyes to deal
// with." Reuses the same lightened, fully-opaque tint `popoverBackground`
// already provides for a PopoverSelect popup's own floating surface (see
// its own comment in constants/colors.ts) rather than a flat, saturated
// TAB_COLOR fill -- computed once at module scope rather than re-run at
// every one of this file's five call sites. Every primaryButton in this
// file already sets its own text color to `colors.background` (a dark
// navy), which reads even better against this lighter tint than it did
// against the old raw fill.
const PRIMARY_BUTTON_BACKGROUND = popoverBackground(TAB_COLOR);

type GardenLens = 'myZone' | 'plotsAndPlantings' | 'harvestLog';

const GARDEN_LENS_FULL_NAMES: Record<GardenLens, string> = {
  myZone: 'My Zone',
  plotsAndPlantings: 'Plots &\nPlantings',
  harvestLog: 'Harvest\nLog',
};

const GARDEN_LENSES: LensOption<GardenLens>[] = [
  {
    key: 'myZone',
    label: 'My Zone',
    icon: 'earth-outline',
    help: [
      {
        heading: 'My Zone',
        body: 'Set your real USDA Plant Hardiness Zone (e.g. "7a") here or in Profile -- both write to the same one saved value. Once set, this shows the real, cited crop guidance for your own climate band from Purple Digest’s own Home Gardening research, and points you at the fuller entry to read there.',
      },
    ],
  },
  {
    key: 'plotsAndPlantings',
    label: 'Plots & Plantings',
    icon: 'flower-outline',
    help: [
      {
        heading: 'Plots & Plantings',
        body: 'A plot is a real place you grow food -- a raised bed, a container, an indoor grow tent, a whole outdoor garden. Add what you’re growing in it (a real reference food, the same ones every Food builder already uses) to track it from planting through harvest.',
      },
    ],
  },
  {
    key: 'harvestLog',
    label: 'Harvest Log',
    icon: 'basket-outline',
    help: [
      {
        heading: 'Harvest Log',
        body: 'Log what you actually picked, and how much, from something you already tracked as planted in Plots & Plantings -- if nothing shows up here to pick from, add a planting there first. Anything still showing real, unused amount here shows up as a real, selectable "From Your Harvest" ingredient in every Food builder -- the same real nutrition/6-DFF scoring as any other reference food, since it’s tied to the same real food identity.',
      },
    ],
  },
];

const GARDEN_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'Garden',
    body: "Real, standing infrastructure for growing your own food and tracking it -- your USDA Plant Hardiness Zone, real plots and what's planted in them, and a real harvest log that feeds straight into the Food builders as an ingredient source once anything's actually picked. Phase 1: manual zone entry (not yet auto-resolved from a ZIP/postal code), and a basic Scheduler tie-in (a garden task creates a real schedule_items row, visible right here as \"Upcoming Tasks\" -- a dedicated lens for it inside the Schedules tab itself isn't built yet).",
  },
];

const LOCATION_TYPE_OPTIONS: { value: 'outdoor' | 'indoor'; label: string }[] = [
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'indoor', label: 'Indoor' },
];

const HARVEST_UNIT_OPTIONS = ['g', 'kg', 'oz', 'lb', 'count'];

// A real, generous quantity list -- common whole numbers plus quarter
// increments up through 10, then whole numbers up through 100. Matches the
// established "PopoverSelect over a raw number pad" convention this app's
// own Profile/Side Builder fields already use, rather than a typed
// keyboard entry.
const QUANTITY_OPTIONS = [
  ...Array.from({ length: 40 }, (_, i) => (0.25 + i * 0.25).toFixed(2).replace(/\.?0+$/, '')),
  ...Array.from({ length: 90 }, (_, i) => String(11 + i)),
];

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function GardenScreen() {
  useRegisterScreenHelp('Garden', GARDEN_HELP_SECTIONS, '/garden');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const openLensHub = useAutoOpenLensHubSignal();
  const [lens, setLens] = useState<GardenLens>('myZone');
  const activeLensLabel = GARDEN_LENS_FULL_NAMES[lens];
  const [revealed, setRevealed] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      return () => setRevealed(false);
    }, []),
  );

  const [plotCount, setPlotCount] = useState<number | undefined>(undefined);
  const [plantingCount, setPlantingCount] = useState<number | undefined>(undefined);
  const [harvestCount, setHarvestCount] = useState<number | undefined>(undefined);

  const loadMyGardenCounts = useCallback(async () => {
    const [plots, plantings, harvests] = await Promise.all([listGardenPlots(), listGardenPlantings(), listGardenHarvests(500)]);
    setPlotCount(plots.length);
    setPlantingCount(plantings.length);
    setHarvestCount(harvests.length);
  }, []);

  const myGardenCategories: MyItemsCategory[] = [
    { id: 'plots', label: 'Plots', count: plotCount, onPress: () => { setLens('plotsAndPlantings'); setRevealed(true); } },
    {
      id: 'plantings',
      label: 'Plantings',
      count: plantingCount,
      onPress: () => { setLens('plotsAndPlantings'); setRevealed(true); },
    },
    { id: 'harvests', label: 'Harvests', count: harvestCount, onPress: () => { setLens('harvestLog'); setRevealed(true); } },
  ];

  return (
    <View style={styles.screen}>
      <SwipeableTabScreen enabled={!revealed}>
        {/* variant="field" -- Garden has no commissioned background artwork
            of its own yet (a real, named gap, same as Purple Digest before
            it), so this falls back to the shared wildflower scene every
            tab rests on before its own art exists. */}
        <GatedTabContent pageTitle="Garden" variant="field" revealed={revealed}>
          {lens === 'myZone' ? (
            <MyZoneLens scrollBottomPadding={scrollBottomPadding} />
          ) : lens === 'plotsAndPlantings' ? (
            <PlotsAndPlantingsLens scrollBottomPadding={scrollBottomPadding} />
          ) : lens === 'harvestLog' ? (
            <HarvestLogLens scrollBottomPadding={scrollBottomPadding} />
          ) : null}
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Garden" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub label="My Garden" tabColor={TAB_COLOR} categories={myGardenCategories} onOpen={loadMyGardenCounts} />
      <LensHub
        pageTitle="Garden"
        headerLabel="Home Gardening"
        buttonLabel="Garden"
        options={GARDEN_LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={openLensHub}
        onSelect={(key) => {
          setLens(key);
          setRevealed(true);
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// My Zone
// ---------------------------------------------------------------------------

function MyZoneLens({ scrollBottomPadding }: { scrollBottomPadding: number }) {
  const [zone, setZone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const profile = await getUserProfile();
        if (!cancelled) {
          setZone(profile.growingZone);
          setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const bandInfo = useMemo(() => (zone ? zoneBandInfo(zone) : null), [zone]);

  async function handleSetZone(value: string) {
    setZone(value);
    await setUserProfile({ growingZone: value });
  }

  if (loading) return null;

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[styles.card, { borderColor: TAB_COLOR }]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Your Growing Zone</Text>
        <Text style={styles.cardBody}>
          A real USDA Plant Hardiness Zone -- based on your area&apos;s average annual minimum winter temperature, the standard
          reference for what can survive and thrive where you actually live.
        </Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Zone</Text>
          <PopoverSelect
            options={USDA_ZONES}
            selected={zone}
            onSelect={handleSetZone}
            tabColor={TAB_COLOR}
            placeholder="Set your zone"
          />
        </View>
        <Text style={styles.captionText}>
          Not sure which zone you&apos;re in? A real, automatic ZIP/postal-code lookup is planned but not yet built -- for now,
          check your zone directly against the USDA&apos;s own published map (usda.gov/plant-hardiness-zone) or a local
          agricultural extension office.
        </Text>
      </View>

      {zone && bandInfo ? (
        <View style={[styles.card, { borderColor: TAB_COLOR }]}>
          <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Zone {zone} -- {bandInfo.bandLabel}</Text>
          {bandInfo.belowCoverage ? (
            <Text style={styles.captionText}>
              This app&apos;s own real crop-band research currently starts at zone 3 -- the cold/short-season guidance below is
              the closest real match, not a perfect one for your specific zone.
            </Text>
          ) : null}
          <Text style={styles.cardBody}>
            Real, cited guidance for your climate band lives in Purple Digest&apos;s own Home Gardening research. Open the Garden
            topic there and look for:
          </Text>
          {bandInfo.digestTopics.map((topic) => (
            <Text key={topic} style={styles.bulletText}>
              • {topic}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Plots & Plantings
// ---------------------------------------------------------------------------

function PlotsAndPlantingsLens({ scrollBottomPadding }: { scrollBottomPadding: number }) {
  const [plots, setPlots] = useState<GardenPlot[]>([]);
  const [plantingsByPlot, setPlantingsByPlot] = useState<Record<string, GardenPlanting[]>>({});
  const [expandedPlotId, setExpandedPlotId] = useState<string | null>(null);
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [newPlotName, setNewPlotName] = useState('');
  const [newPlotLocationType, setNewPlotLocationType] = useState<'outdoor' | 'indoor'>('outdoor');
  const [newPlotMedium, setNewPlotMedium] = useState('');
  const [newPlotLight, setNewPlotLight] = useState('');
  const [addingPlantingToPlot, setAddingPlantingToPlot] = useState<string | null>(null);
  const [pendingFood, setPendingFood] = useState<ResolvedFoodSelection | null>(null);
  const [pendingFoodName, setPendingFoodName] = useState('');

  const loadPlots = useCallback(async () => {
    const rows = await listGardenPlots();
    setPlots(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlots();
    }, [loadPlots]),
  );

  async function loadPlantingsFor(plotId: string) {
    const rows = await listGardenPlantings(plotId);
    setPlantingsByPlot((current) => ({ ...current, [plotId]: rows }));
  }

  async function handleAddPlot() {
    if (!newPlotName.trim()) return;
    await createGardenPlot({
      name: newPlotName,
      locationType: newPlotLocationType,
      growingMedium: newPlotMedium || null,
      lightSource: newPlotLight || null,
    });
    setNewPlotName('');
    setNewPlotMedium('');
    setNewPlotLight('');
    setNewPlotLocationType('outdoor');
    setShowAddPlot(false);
    await loadPlots();
  }

  async function handleArchivePlot(id: string) {
    await archiveGardenPlot(id, true);
    await loadPlots();
  }

  async function handleDeletePlot(id: string) {
    await deleteGardenPlot(id);
    await loadPlots();
  }

  async function handleAddPlanting(plotId: string) {
    if (!pendingFood) return;
    await createGardenPlanting({
      plotId,
      foodId: pendingFood.foodId,
      source: pendingFood.source,
      foodName: pendingFoodName || pendingFood.baseName,
      plantedAt: todayDateString(),
    });
    setPendingFood(null);
    setPendingFoodName('');
    setAddingPlantingToPlot(null);
    await loadPlantingsFor(plotId);
  }

  async function handleRemovePlanting(plotId: string, plantingId: string) {
    await deleteGardenPlanting(plantingId);
    await loadPlantingsFor(plotId);
  }

  // Actively picking a food for a planting: the same real "picker screen"
  // fix SideBuilder.tsx's own pickerScreen/searching split already
  // established, and the same real fix HarvestLogLens's OWN food-picking
  // step needed too before it was redesigned 2026-08-13 to pick from
  // already-tracked plantings instead (see that lens' own comment) -- the
  // whole lens swaps to a plain, non-scrolling picker view rather than
  // rendering FoodLookup as a descendant of the plot list's own ScrollView,
  // avoiding the real "VirtualizedLists nested inside a ScrollView" crash
  // FoodLookup's own header comment warns callers about. Only reached
  // while a food hasn't been picked yet -- once pendingFood is set, the
  // per-plot "Save Planting" confirm card below (plain Text/View, no
  // FlatList) is safe to render inline in the normal scrollable plot list.
  // Deliberately NOT redesigned the same way Harvest Log was: a planting
  // genuinely does come from the whole food reference database (you plant
  // a real food, full stop), it's only a HARVEST that should be scoped
  // down to something already tracked as planted.
  if (addingPlantingToPlot !== null && !pendingFood) {
    return (
      <View style={styles.pickerScreen}>
        <TouchableOpacity onPress={() => setAddingPlantingToPlot(null)}>
          <Text style={styles.linkText}>‹ Cancel</Text>
        </TouchableOpacity>
        <FoodLookup
          tabColor={TAB_COLOR}
          showNutrients={false}
          allowHarvestPick={false}
          onFoodResolved={(resolved) => {
            setPendingFood(resolved);
            setPendingFoodName(resolved.baseName);
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      {plots.length === 0 ? (
        <Text style={styles.emptyText}>No plots yet -- add one below to start tracking what you&apos;re growing.</Text>
      ) : (
        plots.map((plot) => {
          const expanded = expandedPlotId === plot.id;
          const plantings = plantingsByPlot[plot.id] ?? [];
          return (
            <View key={plot.id} style={[styles.card, { borderColor: TAB_COLOR }]}>
              <TouchableOpacity
                style={styles.cardHeaderRow}
                onPress={() => {
                  const next = expanded ? null : plot.id;
                  setExpandedPlotId(next);
                  if (next) loadPlantingsFor(plot.id);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>{plot.name}</Text>
                  <Text style={styles.captionText}>
                    {plot.locationType === 'indoor' ? 'Indoor' : 'Outdoor'}
                    {plot.growingMedium ? ` · ${plot.growingMedium}` : ''}
                    {plot.lightSource ? ` · ${plot.lightSource}` : ''}
                  </Text>
                </View>
                <Text style={{ color: TAB_COLOR }}>{expanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {expanded ? (
                <View style={styles.expandedSection}>
                  {plantings.length === 0 ? (
                    <Text style={styles.captionText}>Nothing logged as planted here yet.</Text>
                  ) : (
                    plantings.map((planting) => (
                      <View key={planting.id} style={styles.plantingRow}>
                        <Text style={styles.bodyText}>
                          {planting.foodName}
                          {planting.varietyNote ? ` (${planting.varietyNote})` : ''} -- {planting.status}
                        </Text>
                        <TouchableOpacity onPress={() => handleRemovePlanting(plot.id, planting.id)}>
                          <Text style={[styles.linkText, { color: colors.danger }]}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}

                  {/* The raw food-search step (addingPlantingToPlot === plot.id
                      && !pendingFood) is deliberately not handled here at all
                      -- the lens' own top-level early return above already
                      swaps the WHOLE screen to a real picker view the moment
                      that state is reached, so this branch is only ever
                      reached once a food has actually been picked. */}
                  {addingPlantingToPlot === plot.id && pendingFood ? (
                    <View style={styles.pendingCard}>
                      <Text style={styles.bodyText}>Planting: {pendingFoodName || pendingFood.baseName}</Text>
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
                          onPress={() => handleAddPlanting(plot.id)}
                        >
                          <Text style={styles.primaryButtonText}>Save Planting</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setPendingFood(null); setPendingFoodName(''); }}>
                          <Text style={styles.linkText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.secondaryButton, { borderColor: TAB_COLOR }]}
                      onPress={() => setAddingPlantingToPlot(plot.id)}
                    >
                      <Text style={[styles.secondaryButtonText, { color: TAB_COLOR }]}>+ Add a Planting</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => handleArchivePlot(plot.id)}>
                      <Text style={styles.linkText}>Archive Plot</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePlot(plot.id)}>
                      <Text style={[styles.linkText, { color: colors.danger }]}>Delete Plot</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })
      )}

      {showAddPlot ? (
        <View style={[styles.card, { borderColor: TAB_COLOR }]}>
          <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>New Plot</Text>
          <AppTextInput
            style={styles.textInput}
            placeholder="Name (e.g. Backyard raised bed)"
            value={newPlotName}
            onChangeText={setNewPlotName}
          />
          <View style={styles.pillRow}>
            {LOCATION_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pill,
                  { borderColor: TAB_COLOR },
                  newPlotLocationType === option.value ? { backgroundColor: PRIMARY_BUTTON_BACKGROUND } : null,
                ]}
                onPress={() => setNewPlotLocationType(option.value)}
              >
                <Text style={newPlotLocationType === option.value ? styles.pillTextActive : { color: TAB_COLOR }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <AppTextInput
            style={styles.textInput}
            placeholder="Growing medium (optional -- soil, coco coir, hydroponic...)"
            value={newPlotMedium}
            onChangeText={setNewPlotMedium}
          />
          <AppTextInput
            style={styles.textInput}
            placeholder="Light source (optional -- full sun, LED grow light...)"
            value={newPlotLight}
            onChangeText={setNewPlotLight}
          />
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleAddPlot}>
              <Text style={styles.primaryButtonText}>Save Plot</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddPlot(false)}>
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: TAB_COLOR }]} onPress={() => setShowAddPlot(true)}>
          <Text style={[styles.secondaryButtonText, { color: TAB_COLOR }]}>+ Add a Plot</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Harvest Log
// ---------------------------------------------------------------------------

function HarvestLogLens({ scrollBottomPadding }: { scrollBottomPadding: number }) {
  const [harvests, setHarvests] = useState<GardenHarvest[]>([]);
  const [plantings, setPlantings] = useState<GardenPlanting[]>([]);
  const [plotNameById, setPlotNameById] = useState<Record<string, string>>({});
  const [upcomingTasks, setUpcomingTasks] = useState<Awaited<ReturnType<typeof listUpcomingGardenTasks>>>([]);
  // A harvest is only ever recorded FROM something already tracked as a
  // real planting, not picked fresh from the whole food reference database
  // -- redesigned 2026-08-13, direct request: "the Harvest isn't going to
  // have anything to do with the Food categories until the harvest is
  // created, and at that point the harvest is added to the available food
  // in the food category list." selectedPlanting carries the real food
  // identity (foodId/source/foodName) straight from that planting record,
  // matching recordGardenHarvest's own already-existing plantingId/plotId
  // params (real db.ts plumbing that already existed but this screen never
  // actually used until now).
  const [selectedPlanting, setSelectedPlanting] = useState<GardenPlanting | null>(null);
  const [pickingPlanting, setPickingPlanting] = useState(false);
  const [quantity, setQuantity] = useState<string | null>(null);
  const [unit, setUnit] = useState<string | null>('count');
  const [taskTitle, setTaskTitle] = useState('');

  const load = useCallback(async () => {
    const [harvestRows, plantingRows, plotRows, taskRows] = await Promise.all([
      listGardenHarvests(30),
      listGardenPlantings(),
      listGardenPlots(),
      listUpcomingGardenTasks(10),
    ]);
    setHarvests(harvestRows);
    // Failed/removed plantings were never a real harvest to begin with --
    // still-growing AND already-harvested-once plantings both stay pickable,
    // since a real plant (tomatoes, squash, beans) can keep producing across
    // more than one harvest event in the same season.
    setPlantings(plantingRows.filter((p) => p.status !== 'failed' && p.status !== 'removed'));
    setPlotNameById(Object.fromEntries(plotRows.map((p) => [p.id, p.name])));
    setUpcomingTasks(taskRows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRecordHarvest() {
    if (!selectedPlanting || !quantity || !unit) return;
    await recordGardenHarvest({
      plantingId: selectedPlanting.id,
      plotId: selectedPlanting.plotId,
      foodId: selectedPlanting.foodId,
      source: selectedPlanting.source,
      foodName: selectedPlanting.foodName,
      harvestedAt: todayDateString(),
      quantity: Number(quantity),
      unit,
    });
    setSelectedPlanting(null);
    setQuantity(null);
    setUnit('count');
    await load();
  }

  async function handleDelete(id: string) {
    await deleteGardenHarvest(id);
    await load();
  }

  async function handleAddTask() {
    if (!taskTitle.trim()) return;
    const now = new Date();
    now.setDate(now.getDate() + 1);
    await scheduleGardenTask({ title: taskTitle, scheduledFor: `${now.toISOString().slice(0, 10)}T09:00` });
    setTaskTitle('');
    await load();
  }

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[styles.card, { borderColor: TAB_COLOR }]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Log a Harvest</Text>
        {selectedPlanting ? (
          <>
            <Text style={styles.bodyText}>
              {selectedPlanting.foodName}
              {plotNameById[selectedPlanting.plotId] ? ` -- from ${plotNameById[selectedPlanting.plotId]}` : ''}
            </Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <PopoverSelect options={QUANTITY_OPTIONS} selected={quantity} onSelect={setQuantity} tabColor={TAB_COLOR} />
              <PopoverSelect options={HARVEST_UNIT_OPTIONS} selected={unit} onSelect={setUnit} tabColor={TAB_COLOR} />
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleRecordHarvest}>
                <Text style={styles.primaryButtonText}>Save Harvest</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedPlanting(null)}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : pickingPlanting ? (
          <>
            {plantings.length === 0 ? (
              <Text style={styles.captionText}>
                Nothing tracked as planted yet. Add a planting in Plots &amp; Plantings first -- once something&apos;s actually
                growing, it&apos;ll show up here to log a harvest from.
              </Text>
            ) : (
              plantings.map((planting) => (
                <TouchableOpacity
                  key={planting.id}
                  style={styles.plantingPickRow}
                  onPress={() => {
                    setSelectedPlanting(planting);
                    setPickingPlanting(false);
                  }}
                >
                  <Text style={styles.bodyText}>{planting.foodName}</Text>
                  <Text style={styles.captionText}>
                    {plotNameById[planting.plotId] ?? 'Unknown plot'} · {planting.status}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity onPress={() => setPickingPlanting(false)}>
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
            onPress={() => setPickingPlanting(true)}
          >
            <Text style={styles.primaryButtonText}>+ Add a Harvest</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.card, { borderColor: TAB_COLOR }]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Recent Harvests</Text>
        {harvests.length === 0 ? (
          <Text style={styles.captionText}>Nothing logged yet.</Text>
        ) : (
          harvests.map((harvest) => (
            <View key={harvest.id} style={styles.plantingRow}>
              <Text style={styles.bodyText}>
                {harvest.foodName} -- {harvest.quantityRemaining} of {harvest.quantity} {harvest.unit} left
              </Text>
              <TouchableOpacity onPress={() => handleDelete(harvest.id)}>
                <Text style={[styles.linkText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <Text style={styles.captionText}>
          Anything still showing a real remaining amount here is selectable as &quot;From Your Harvest&quot; the next time you add an
          ingredient in any Food builder.
        </Text>
      </View>

      <View style={[styles.card, { borderColor: TAB_COLOR }]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Upcoming Garden Tasks</Text>
        {upcomingTasks.length === 0 ? (
          <Text style={styles.captionText}>Nothing scheduled.</Text>
        ) : (
          upcomingTasks.map((task) => (
            <Text key={task.id} style={styles.bodyText}>
              {task.title} -- {task.scheduledFor.replace('T', ' ')}
            </Text>
          ))
        )}
        <View style={styles.fieldRow}>
          <AppTextInput
            style={[styles.textInput, { flex: 1 }]}
            placeholder="Task (e.g. Water the tomatoes)"
            value={taskTitle}
            onChangeText={setTaskTitle}
          />
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleAddTask}>
            <Text style={styles.primaryButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.captionText}>
          Creates a real Schedule entry for tomorrow morning. A dedicated Garden lens inside the Schedules tab itself isn&apos;t
          built yet -- this list is the real way to see it for now.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { padding: 16, gap: 12 },
  // A plain, non-scrolling container for a lens' own "actively picking a
  // food" state -- see PlotsAndPlantingsLens's own addingPlantingToPlot
  // comment for why this can never be inside a ScrollView (Harvest Log no
  // longer needs this at all, redesigned 2026-08-13 to pick from a real,
  // small list of already-tracked plantings instead of FoodLookup). flex: 1
  // (not the padded `body` above) so FoodLookup's own internal FlatLists
  // get the real available
  // height to work with, matching SideBuilder.tsx's own pickerScreen.
  pickerScreen: { flex: 1, padding: 16, gap: 8 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { ...typography.sectionTitle },
  cardBody: { ...typography.body, color: colors.textPrimary },
  bodyText: { ...typography.body, color: colors.textPrimary },
  captionText: { ...typography.caption, color: colors.textMuted },
  bulletText: { ...typography.body, color: colors.textPrimary, marginLeft: 4 },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: 24 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fieldLabel: { ...typography.label, color: colors.textPrimary },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  pillTextActive: { color: colors.background, fontWeight: '700' },
  expandedSection: { gap: 8, marginTop: 4 },
  plantingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // A tappable row for picking a planting to log a harvest from -- a real,
  // small list (a season's worth of plantings, never anywhere near the
  // scale of the whole food reference database), so it renders as a plain
  // `.map()` directly inside the lens's own ScrollView rather than needing
  // a second FlatList-based picker screen the way FoodLookup's own results
  // do.
  plantingPickRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 2 },
  pendingCard: { gap: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  primaryButtonText: { color: colors.background, fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { fontWeight: '700' },
  linkText: { ...typography.body, color: colors.primary },
});
