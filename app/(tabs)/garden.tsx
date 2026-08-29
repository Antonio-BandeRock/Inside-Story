import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { VoiceInputButton } from '../../components/VoiceInputButton';
import { COUNTRIES } from '../../constants/countries';
import { BUTTON_SHADOW, colors } from '../../constants/colors';
import { typography, textShadow } from '../../constants/typography';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import { USDA_ZONES, zoneBandInfo } from '../../lib/gardenZones';
import { lookupGrowingZone, type GrowingZoneLookupResult } from '../../lib/gardenZoneLookup';
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
  type GardenSizeUnit,
  type GardenSpaceType,
  type GardenSunlightExposure,
} from '../../lib/db';

// This page's own identity color -- see constants/colors.ts's own comment
// on tabGarden for how it was chosen.
const TAB_COLOR = colors.tabGarden;

// A real, deliberately soft fill for every "primary action" button and the
// active-toggle pill in this file, 2026-08-13, direct report: "make the
// background of the Add a Harvest button be a little easier to read and
// easier on the eyes. This green is a bit too much for the eyes to deal
// with." Originally a lightened, fully-opaque tint of TAB_COLOR
// (popoverBackground); superseded 2026-08-24 by the same app-wide fix
// every other button got, direct report: "there needs to be some sort of
// continuity between app buttons... follow the color of the ground color
// chosen in the Profile." colors.buttonColor (see its own comment in
// constants/colors.ts) replaces the tab-tinted fill so this file's own
// buttons look like every other screen's, not a one-off green tint.
// primaryButtonText below was updated to match (colors.textOnButton, the
// dark text verified against this exact fill), not left on its old
// colors.background value.
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;

// COUNTRIES mapped once, at module scope, into the label/value shape
// PopoverSelect's own searchable list expects -- a real, stable array
// reference across renders (not rebuilt inline in MyZoneLens), matching
// this component's own memo() contract.
const COUNTRY_OPTIONS = COUNTRIES.map((country) => ({ label: country.name, value: country.code }));

type GardenLens = 'myZone' | 'plotsAndPlantings' | 'harvestLog' | 'upcomingTasks';

const GARDEN_LENS_FULL_NAMES: Record<GardenLens, string> = {
  myZone: 'My Zone',
  plotsAndPlantings: 'Plots &\nPlantings',
  harvestLog: 'Harvest\nLog',
  upcomingTasks: 'Upcoming\nTasks',
};

const GARDEN_LENSES: LensOption<GardenLens>[] = [
  {
    key: 'myZone',
    label: 'My Zone',
    icon: 'earth-outline',
    help: [
      {
        heading: 'My Zone',
        body: 'Look up your USDA Plant Hardiness Zone by country + ZIP/postal code. It works anywhere on Earth, not just the US: a US ZIP gets the official USDA zone directly, everywhere else gets an estimate from that location’s own historical temperature data. Or set it directly if you already know it, here or in Profile; both write to the same one saved value. Once set, this shows cited crop guidance for your own climate band from Digest’s own Home Gardening research, and points you at the fuller entry to read there.',
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
        body: 'A garden area is a place you grow food: a raised bed, a container, an indoor grow tent, a whole outdoor garden. Adding one walks through where it is, what kind of space it is, how much sun it gets, its real size, and its own hardiness zone -- all real details a future planting algorithm can use, none of them required to just get started. Add what you’re growing in it (a reference food, the same ones every Food builder already uses) to track it from planting through harvest.',
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
        body: 'Log what you actually picked, and how much, from something you already tracked as planted in Plots & Plantings. If nothing shows up here to pick from, add a planting there first. Anything still showing an unused amount here shows up as a selectable "From Your Harvest" ingredient in every Food builder, with the same nutrition/condition scoring as any other reference food, since it’s tied to the same food identity.',
      },
    ],
  },
  {
    key: 'upcomingTasks',
    label: 'Upcoming Tasks',
    icon: 'calendar-outline',
    help: [
      {
        heading: 'Upcoming Garden Tasks',
        body: 'Real garden chores (watering, feeding, checking on something) scheduled for a specific date -- created here and stored the same way any other Schedule item is. A dedicated lens for these inside the Schedules tab itself isn’t built yet, so this is the real place to see and add them for now.',
      },
    ],
  },
];

const GARDEN_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this tab is for',
    body: "So growing your own food is worth the effort, not just a separate hobby log nobody else in this app ever sees. Track what you're growing, what actually gets harvested, and it becomes a real, pickable ingredient in the Food builders, the same as anything from the reference database.",
  },
  {
    heading: 'What it tracks',
    body: "Your USDA Plant Hardiness Zone (found automatically from a country + ZIP/postal code, anywhere on Earth, or set directly if you already know it), garden areas and what's planted in them, a harvest log, and upcoming garden tasks. A basic Scheduler tie-in exists too (a garden task creates a schedule_items row; a dedicated lens for it inside the Schedules tab itself isn't built yet).",
  },
];

// Phase 1 -- Location & Environment. Widened 2026-08-14 to include
// Greenhouse alongside the original Outdoor/Indoor.
const LOCATION_TYPE_OPTIONS: { value: 'outdoor' | 'indoor' | 'greenhouse'; label: string }[] = [
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'greenhouse', label: 'Greenhouse' },
];

// Phase 2 -- Space Type, the real structured replacement for the old
// free-text "growing medium" field.
const SPACE_TYPE_OPTIONS: { value: GardenSpaceType; label: string }[] = [
  { value: 'in_ground', label: 'In-Ground Plot' },
  { value: 'raised_bed', label: 'Raised Bed' },
  { value: 'containers', label: 'Containers & Pots' },
  { value: 'hydroponic', label: 'Hydroponic' },
  { value: 'tent', label: 'Tent' },
  { value: 'led_lights', label: 'LED Lights' },
  { value: 'temp_humidity_control', label: 'Temperature & Humidity Control' },
];

// Phase 3 -- Sunlight Exposure, the real structured replacement for the old
// free-text "light source" field.
const SUNLIGHT_OPTIONS: { value: GardenSunlightExposure; label: string }[] = [
  { value: 'full_sun', label: 'Full Sun (6+ hours)' },
  { value: 'partial_shade', label: 'Partial Shade (3–6 hours)' },
  { value: 'full_shade', label: 'Full Shade (<3 hours)' },
  { value: 'indoor_led_timer', label: 'Indoor LED Lights, Timer required' },
  { value: 'airflow', label: 'Airflow' },
];

// Phase 4 -- Size & Dimensions' own Feet/Meters toggle.
const SIZE_UNIT_OPTIONS: { value: GardenSizeUnit; label: string }[] = [
  { value: 'feet', label: 'Feet' },
  { value: 'meters', label: 'Meters' },
];

// Real display-label lookups for the collapsed garden-area card's own
// summary line -- reuses the exact same option arrays above rather than a
// second, separately-maintained label map.
const SPACE_TYPE_LABELS: Record<GardenSpaceType, string> = Object.fromEntries(
  SPACE_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<GardenSpaceType, string>;
const SUNLIGHT_LABELS: Record<GardenSunlightExposure, string> = Object.fromEntries(
  SUNLIGHT_OPTIONS.map((o) => [o.value, o.label]),
) as Record<GardenSunlightExposure, string>;

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
  // 2026-08-17: mirrors purple-digest.tsx's own openDigestLens exactly --
  // lets food.tsx's new "My Whole Foods" tile deep-link straight into
  // Harvest Log rather than landing on this tab's own resting picker.
  const { openGardenLens } = useLocalSearchParams<{ openGardenLens?: string }>();
  const [lens, setLens] = useState<GardenLens>('myZone');
  const activeLensLabel = GARDEN_LENS_FULL_NAMES[lens];
  const [revealed, setRevealed] = useState(false);
  // Lifted out of MyItemsHub itself, 2026-08-16 -- same reasoning as Food's
  // own identical addition (app/(tabs)/food.tsx): lets LensHub's new "My
  // Garden" top-left tile (see its extraTile prop below) open this SAME
  // popup, at its own already-established position, after closing itself
  // first, rather than the two fighting for the screen at once. The
  // standalone MyItemsHub button further down keeps working exactly as
  // before regardless.
  const [myGardenOpen, setMyGardenOpen] = useState(false);
  useFocusEffect(
    useCallback(() => {
      // openGardenLens overrides the normal "always land on the resting
      // picker" reset below, the same way purple-digest.tsx's own
      // openDigestLens already does.
      if (
        openGardenLens === 'myZone' ||
        openGardenLens === 'plotsAndPlantings' ||
        openGardenLens === 'harvestLog' ||
        openGardenLens === 'upcomingTasks'
      ) {
        setLens(openGardenLens);
        setRevealed(true);
        return;
      }
      setRevealed(false);
      return () => setRevealed(false);
    }, [openGardenLens]),
  );

  const [plotCount, setPlotCount] = useState<number | undefined>(undefined);
  const [plantingCount, setPlantingCount] = useState<number | undefined>(undefined);
  const [harvestCount, setHarvestCount] = useState<number | undefined>(undefined);
  const [taskCount, setTaskCount] = useState<number | undefined>(undefined);

  const loadMyGardenCounts = useCallback(async () => {
    const [plots, plantings, harvests, tasks] = await Promise.all([
      listGardenPlots(),
      listGardenPlantings(),
      listGardenHarvests(500),
      listUpcomingGardenTasks(500),
    ]);
    setPlotCount(plots.length);
    setPlantingCount(plantings.length);
    setHarvestCount(harvests.length);
    setTaskCount(tasks.length);
  }, []);

  const myGardenCategories: MyItemsCategory[] = [
    { id: 'plots', label: 'Garden Areas', count: plotCount, onPress: () => { setLens('plotsAndPlantings'); setRevealed(true); } },
    {
      id: 'plantings',
      label: 'Plantings',
      count: plantingCount,
      onPress: () => { setLens('plotsAndPlantings'); setRevealed(true); },
    },
    { id: 'harvests', label: 'Harvests', count: harvestCount, onPress: () => { setLens('harvestLog'); setRevealed(true); } },
    { id: 'tasks', label: 'Upcoming Tasks', count: taskCount, onPress: () => { setLens('upcomingTasks'); setRevealed(true); } },
  ];

  return (
    <View style={styles.screen}>
      <SwipeableTabScreen enabled={!revealed}>
        {/* variant="field" -- Garden has no commissioned background artwork
            of its own yet (a real, named gap, same as Digest before
            it), so this falls back to the shared wildflower scene every
            tab rests on before its own art exists. */}
        <GatedTabContent pageTitle="Garden" variant="field" revealed={revealed}>
          {lens === 'myZone' ? (
            <MyZoneLens scrollBottomPadding={scrollBottomPadding} />
          ) : lens === 'plotsAndPlantings' ? (
            <PlotsAndPlantingsLens scrollBottomPadding={scrollBottomPadding} />
          ) : lens === 'harvestLog' ? (
            <HarvestLogLens scrollBottomPadding={scrollBottomPadding} />
          ) : lens === 'upcomingTasks' ? (
            <UpcomingTasksLens scrollBottomPadding={scrollBottomPadding} />
          ) : null}
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Garden" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub
        label="My Garden"
        tabColor={TAB_COLOR}
        categories={myGardenCategories}
        onOpen={loadMyGardenCounts}
        open={myGardenOpen}
        onOpenChange={setMyGardenOpen}
      />
      <LensHub
        pageTitle="Garden"
        headerLabel="Home Gardening"
        buttonLabel="Garden"
        options={GARDEN_LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={openLensHub}
        extraTile={{ label: 'My Garden', icon: 'bookmarks-outline', onPress: () => setMyGardenOpen(true) }}
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
  const [country, setCountry] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupResult, setLookupResult] = useState<GrowingZoneLookupResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const profile = await getUserProfile();
        if (!cancelled) {
          setZone(profile.growingZone);
          setCountry(profile.growingZoneCountry);
          setPostalCode(profile.growingZonePostalCode ?? '');
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

  async function handleLookup() {
    if (!country || !postalCode.trim() || lookupBusy) return;
    setLookupBusy(true);
    setLookupResult(null);
    const result = await lookupGrowingZone(country, postalCode);
    setLookupResult(result);
    if (result.status === 'success') {
      setZone(result.zone);
      await setUserProfile({ growingZone: result.zone, growingZoneCountry: country, growingZonePostalCode: postalCode.trim() });
    }
    setLookupBusy(false);
  }

  if (loading) return null;

  const lookupDisabled = !country || !postalCode.trim() || lookupBusy;

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[styles.card, { borderColor: TAB_COLOR }]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Find My Zone</Text>
        <Text style={styles.cardBody}>
          Enter your country and ZIP or postal code. This works anywhere on Earth, not just the US: a US ZIP gets the
          official USDA zone directly; everywhere else gets an estimate computed from that location&apos;s own historical
          temperature data, using the same USDA temperature bands.
        </Text>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Country</Text>
          <PopoverSelect
            options={COUNTRY_OPTIONS}
            selected={country}
            onSelect={setCountry}
            tabColor={TAB_COLOR}
            searchable
            width={220}
            placeholder="Select country"
          />
        </View>
        <AppTextInput
          style={styles.textInput}
          placeholder="ZIP or postal code"
          value={postalCode}
          onChangeText={setPostalCode}
        />
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: PRIMARY_BUTTON_BACKGROUND },
            lookupDisabled ? styles.disabledButton : null,
          ]}
          onPress={handleLookup}
          disabled={lookupDisabled}
        >
          {lookupBusy ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.primaryButtonText}>Find My Zone</Text>
          )}
        </TouchableOpacity>
        {lookupResult ? (
          <Text style={[styles.captionText, lookupResult.status !== 'success' ? styles.errorText : null]}>
            {lookupResult.status === 'success'
              ? `Set to zone ${lookupResult.zone}${lookupResult.placeLabel ? ` (${lookupResult.placeLabel})` : ''}. ${lookupResult.detail}`
              : lookupResult.message}
          </Text>
        ) : null}
      </View>

      <View style={[styles.card, { borderColor: TAB_COLOR }]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Your Growing Zone</Text>
        <Text style={styles.cardBody}>
          A USDA Plant Hardiness Zone: based on your area&apos;s average annual minimum winter temperature, the standard
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
          Already know your zone, or want to check it directly? Set it here; this always overrides whatever the lookup above
          found. The USDA&apos;s own published map (usda.gov/plant-hardiness-zone) or a local agricultural extension office are
          both direct ways to double-check either result.
        </Text>
      </View>

      {zone && bandInfo ? (
        <View style={[styles.card, { borderColor: TAB_COLOR }]}>
          <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Zone {zone}: {bandInfo.bandLabel}</Text>
          {bandInfo.belowCoverage ? (
            <Text style={styles.captionText}>
              This app&apos;s own crop-band research currently starts at zone 3, so the cold/short-season guidance below is
              the closest match, not a perfect one for your specific zone.
            </Text>
          ) : null}
          <Text style={styles.cardBody}>
            Cited guidance for your climate band lives in Digest&apos;s own Home Gardening research. Open the Garden
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
  const [newAreaName, setNewAreaName] = useState('');
  // Phase 1 -- Location & Environment. Always has a real value (defaults to
  // 'outdoor', matching this field's own real NOT NULL column) rather than
  // starting null -- every other new field below genuinely can stay unset.
  const [newAreaLocationType, setNewAreaLocationType] = useState<'outdoor' | 'indoor' | 'greenhouse'>('outdoor');
  // Phase 2 -- Space Type.
  const [newAreaSpaceType, setNewAreaSpaceType] = useState<GardenSpaceType | null>(null);
  // Phase 3 -- Sunlight Exposure.
  const [newAreaSunlight, setNewAreaSunlight] = useState<GardenSunlightExposure | null>(null);
  // Phase 4 -- Size & Dimensions.
  const [newAreaLength, setNewAreaLength] = useState('');
  const [newAreaWidth, setNewAreaWidth] = useState('');
  const [newAreaSizeUnit, setNewAreaSizeUnit] = useState<GardenSizeUnit>('feet');
  // Phase 5 -- Hardiness Zone (Automated). Pre-filled from the person's own
  // already-saved profile zone (see handleShowAddPlot below) so this rarely
  // needs a fresh lookup for the common case of one person, one climate,
  // several garden areas -- reuses lib/gardenZoneLookup.ts, the exact same
  // real mechanism MyZoneLens already uses for the whole profile.
  const [newAreaZoneCountry, setNewAreaZoneCountry] = useState<string | null>(null);
  const [newAreaZonePostal, setNewAreaZonePostal] = useState('');
  const [newAreaZone, setNewAreaZone] = useState<string | null>(null);
  const [zoneLookupBusy, setZoneLookupBusy] = useState(false);
  const [zoneLookupResult, setZoneLookupResult] = useState<GrowingZoneLookupResult | null>(null);
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

  // Opens the New Garden Area form, pre-filling Phase 5's own zone fields
  // from the profile's already-saved zone (if any) -- "without forcing the
  // user to do heavy research" per the original request: someone who
  // already set their zone in My Zone shouldn't have to redo the lookup for
  // every area, just confirm or override it here.
  async function handleShowAddPlot() {
    const profile = await getUserProfile();
    setNewAreaZoneCountry(profile.growingZoneCountry);
    setNewAreaZonePostal(profile.growingZonePostalCode ?? '');
    setNewAreaZone(profile.growingZone);
    setZoneLookupResult(null);
    setShowAddPlot(true);
  }

  async function handleZoneLookup() {
    if (!newAreaZoneCountry || !newAreaZonePostal.trim() || zoneLookupBusy) return;
    setZoneLookupBusy(true);
    setZoneLookupResult(null);
    const result = await lookupGrowingZone(newAreaZoneCountry, newAreaZonePostal);
    setZoneLookupResult(result);
    if (result.status === 'success') {
      setNewAreaZone(result.zone);
    }
    setZoneLookupBusy(false);
  }

  async function handleAddGardenArea() {
    if (!newAreaName.trim()) return;
    await createGardenPlot({
      name: newAreaName,
      locationType: newAreaLocationType,
      spaceType: newAreaSpaceType,
      sunlightExposure: newAreaSunlight,
      length: newAreaLength.trim() ? Number(newAreaLength) : null,
      width: newAreaWidth.trim() ? Number(newAreaWidth) : null,
      sizeUnit: newAreaLength.trim() || newAreaWidth.trim() ? newAreaSizeUnit : null,
      zone: newAreaZone,
      zoneCountry: newAreaZoneCountry,
      zonePostalCode: newAreaZonePostal.trim() || null,
    });
    setNewAreaName('');
    setNewAreaLocationType('outdoor');
    setNewAreaSpaceType(null);
    setNewAreaSunlight(null);
    setNewAreaLength('');
    setNewAreaWidth('');
    setNewAreaSizeUnit('feet');
    setNewAreaZoneCountry(null);
    setNewAreaZonePostal('');
    setNewAreaZone(null);
    setZoneLookupResult(null);
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
          <Text style={[styles.linkText, styles.groupHeadingChip]}>‹ Cancel</Text>
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
        <Text style={styles.emptyText}>No garden areas yet. Add one below to start tracking what you&apos;re growing.</Text>
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
                    {plot.locationType === 'greenhouse' ? 'Greenhouse' : plot.locationType === 'indoor' ? 'Indoor' : 'Outdoor'}
                    {plot.spaceType
                      ? ` · ${SPACE_TYPE_LABELS[plot.spaceType]}`
                      : plot.growingMedium
                        ? ` · ${plot.growingMedium}`
                        : ''}
                    {plot.sunlightExposure
                      ? ` · ${SUNLIGHT_LABELS[plot.sunlightExposure]}`
                      : plot.lightSource
                        ? ` · ${plot.lightSource}`
                        : ''}
                    {plot.length && plot.width ? ` · ${plot.length}×${plot.width} ${plot.sizeUnit ?? ''}` : ''}
                    {plot.zone ? ` · Zone ${plot.zone}` : ''}
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
                          {planting.varietyNote ? ` (${planting.varietyNote})` : ''}: {planting.status}
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
                      style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
                      onPress={() => setAddingPlantingToPlot(plot.id)}
                    >
                      <Text style={styles.primaryButtonText}>+ Add a Planting</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => handleArchivePlot(plot.id)}>
                      <Text style={styles.linkText}>Archive Area</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePlot(plot.id)}>
                      <Text style={[styles.linkText, { color: colors.danger }]}>Delete Area</Text>
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
          <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>New Garden Area</Text>
          {/* 2026-08-16 -- a real mic button beside the one field here
              with no floating label of its own (this card's title already
              serves that role) -- placed alongside the input itself
              instead, same "speak and watch it fill in" replace-on-every-
              result shape the Food builders' own Name fields just got. */}
          <View style={styles.fieldRow}>
            <AppTextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="Name (e.g. Backyard raised bed)"
              value={newAreaName}
              onChangeText={setNewAreaName}
            />
            <VoiceInputButton onResult={(transcript) => setNewAreaName(transcript)} color={TAB_COLOR} />
          </View>

          <Text style={styles.fieldLabel}>Where is your garden located?</Text>
          <View style={styles.pillRow}>
            {LOCATION_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pill,
                  { borderColor: TAB_COLOR },
                  newAreaLocationType === option.value ? { backgroundColor: PRIMARY_BUTTON_BACKGROUND } : null,
                ]}
                onPress={() => setNewAreaLocationType(option.value)}
              >
                <Text style={newAreaLocationType === option.value ? styles.pillTextActive : { color: TAB_COLOR }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.captionText}>Determines temperature exposure, humidity levels, and natural climate risks.</Text>

          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>What type of space are you growing in?</Text>
          <View style={styles.pillRow}>
            {SPACE_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pill,
                  { borderColor: TAB_COLOR },
                  newAreaSpaceType === option.value ? { backgroundColor: PRIMARY_BUTTON_BACKGROUND } : null,
                ]}
                onPress={() => setNewAreaSpaceType(newAreaSpaceType === option.value ? null : option.value)}
              >
                <Text style={newAreaSpaceType === option.value ? styles.pillTextActive : { color: TAB_COLOR }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.captionText}>
            Dictates soil depth limitations, drainage styles, root spacing rules, and indoor requirements.
          </Text>

          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>How much direct sun does this space get daily?</Text>
          <View style={styles.pillRow}>
            {SUNLIGHT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pill,
                  { borderColor: TAB_COLOR },
                  newAreaSunlight === option.value ? { backgroundColor: PRIMARY_BUTTON_BACKGROUND } : null,
                ]}
                onPress={() => setNewAreaSunlight(newAreaSunlight === option.value ? null : option.value)}
              >
                <Text style={newAreaSunlight === option.value ? styles.pillTextActive : { color: TAB_COLOR }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.captionText}>Sunlight is the single biggest filter on which plants can actually survive here.</Text>

          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>What is the size of your space?</Text>
          <View style={styles.fieldRow}>
            <AppTextInput
              style={[styles.textInput, styles.sizeInput]}
              placeholder="Length"
              keyboardType="decimal-pad"
              value={newAreaLength}
              onChangeText={setNewAreaLength}
            />
            <AppTextInput
              style={[styles.textInput, styles.sizeInput]}
              placeholder="Width"
              keyboardType="decimal-pad"
              value={newAreaWidth}
              onChangeText={setNewAreaWidth}
            />
            <View style={styles.pillRow}>
              {SIZE_UNIT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pill,
                    { borderColor: TAB_COLOR },
                    newAreaSizeUnit === option.value ? { backgroundColor: PRIMARY_BUTTON_BACKGROUND } : null,
                  ]}
                  onPress={() => setNewAreaSizeUnit(option.value)}
                >
                  <Text style={newAreaSizeUnit === option.value ? styles.pillTextActive : { color: TAB_COLOR }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Text style={styles.captionText}>Lets the app calculate real planting density and grid spacing later.</Text>

          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Hardiness zone for this area</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Country</Text>
            <PopoverSelect
              options={COUNTRY_OPTIONS}
              selected={newAreaZoneCountry}
              onSelect={setNewAreaZoneCountry}
              tabColor={TAB_COLOR}
              searchable
              width={180}
              placeholder="Country"
            />
          </View>
          <AppTextInput
            style={styles.textInput}
            placeholder="ZIP or postal code"
            value={newAreaZonePostal}
            onChangeText={setNewAreaZonePostal}
          />
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: TAB_COLOR },
              !newAreaZoneCountry || !newAreaZonePostal.trim() || zoneLookupBusy ? styles.disabledButton : null,
            ]}
            onPress={handleZoneLookup}
            disabled={!newAreaZoneCountry || !newAreaZonePostal.trim() || zoneLookupBusy}
          >
            {zoneLookupBusy ? (
              <ActivityIndicator size="small" color={TAB_COLOR} />
            ) : (
              <Text style={[styles.secondaryButtonText, { color: TAB_COLOR }]}>Find My Zone</Text>
            )}
          </TouchableOpacity>
          {zoneLookupResult ? (
            <Text style={[styles.captionText, zoneLookupResult.status !== 'success' ? styles.errorText : null]}>
              {zoneLookupResult.status === 'success'
                ? `Zone ${zoneLookupResult.zone}${zoneLookupResult.placeLabel ? ` (${zoneLookupResult.placeLabel})` : ''}. ${zoneLookupResult.detail}`
                : zoneLookupResult.message}
            </Text>
          ) : newAreaZone ? (
            <Text style={styles.captionText}>Current zone for this area: {newAreaZone}</Text>
          ) : null}
          <Text style={styles.captionText}>
            Instantly calculates frost dates and local climate constraints from a country + ZIP/postal code, the same
            lookup as My Zone -- pre-filled from your profile if already set there, editable here if this specific
            area is somewhere else.
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
              onPress={handleAddGardenArea}
            >
              <Text style={styles.primaryButtonText}>Save Garden Area</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddPlot(false)}>
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
          onPress={handleShowAddPlot}
        >
          <Text style={styles.primaryButtonText}>+ Add a Garden Area</Text>
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

  const load = useCallback(async () => {
    const [harvestRows, plantingRows, plotRows] = await Promise.all([
      listGardenHarvests(30),
      listGardenPlantings(),
      listGardenPlots(),
    ]);
    setHarvests(harvestRows);
    // Failed/removed plantings were never a real harvest to begin with --
    // still-growing AND already-harvested-once plantings both stay pickable,
    // since a real plant (tomatoes, squash, beans) can keep producing across
    // more than one harvest event in the same season.
    setPlantings(plantingRows.filter((p) => p.status !== 'failed' && p.status !== 'removed'));
    setPlotNameById(Object.fromEntries(plotRows.map((p) => [p.id, p.name])));
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

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[styles.card, { borderColor: TAB_COLOR }]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Log a Harvest</Text>
        {selectedPlanting ? (
          <>
            <Text style={styles.bodyText}>
              {selectedPlanting.foodName}
              {plotNameById[selectedPlanting.plotId] ? `, from ${plotNameById[selectedPlanting.plotId]}` : ''}
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
                Nothing tracked as planted yet. Add a planting in Plots &amp; Plantings first; once something&apos;s actually
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
                {harvest.foodName}: {harvest.quantityRemaining} of {harvest.quantity} {harvest.unit} left
              </Text>
              <TouchableOpacity onPress={() => handleDelete(harvest.id)}>
                <Text style={[styles.linkText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <Text style={styles.captionText}>
          Anything still showing a remaining amount here is selectable as &quot;From Your Harvest&quot; the next time you add an
          ingredient in any Food builder.
        </Text>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Upcoming Garden Tasks -- 2026-08-14, moved out into its own real lens
// (previously a card tucked inside Harvest Log), direct request: "Move
// Upcoming Garden Tasks out to the Garden LensHub menu as it's own entity."
// Content and logic carried over unchanged from that card, just given its
// own real screen.
// ---------------------------------------------------------------------------

function UpcomingTasksLens({ scrollBottomPadding }: { scrollBottomPadding: number }) {
  const [upcomingTasks, setUpcomingTasks] = useState<Awaited<ReturnType<typeof listUpcomingGardenTasks>>>([]);
  const [taskTitle, setTaskTitle] = useState('');

  const load = useCallback(async () => {
    const rows = await listUpcomingGardenTasks(20);
    setUpcomingTasks(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Upcoming Garden Tasks</Text>
        {upcomingTasks.length === 0 ? (
          <Text style={styles.captionText}>Nothing scheduled.</Text>
        ) : (
          upcomingTasks.map((task) => (
            <Text key={task.id} style={styles.bodyText}>
              {task.title}: {task.scheduledFor.replace('T', ' ')}
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
          <VoiceInputButton onResult={(transcript) => setTaskTitle(transcript)} color={TAB_COLOR} />
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleAddTask}>
            <Text style={styles.primaryButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.captionText}>
          Creates a Schedule entry for tomorrow morning. A dedicated lens for these inside the Schedules tab itself
          isn&apos;t built yet, so this is the way to see and add them for now.
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
  cardTitle: { ...typography.sectionTitle,

    ...textShadow,

  },
  cardBody: { ...typography.body, color: colors.textPrimary,

    ...textShadow,

  },
  bodyText: { ...typography.body, color: colors.textPrimary,

    ...textShadow,

  },
  captionText: { ...typography.caption, color: colors.textMuted,

    ...textShadow,

  },
  bulletText: { ...typography.body, color: colors.textPrimary, marginLeft: 4,

    ...textShadow,

  },
  // Renders bare directly over the tab's own shared photo background (no
  // card wrapper -- see the ScrollView it sits in above) -- textMuted's own
  // dim blue-gray with no shadow was genuinely illegible there, reported
  // directly 2026-08-14 ("I am not able to read whatever is written above
  // the +Add a Garden Area button"). Fixed to match Home's own already-
  // established precedent for exactly this situation (app/(tabs)/index.tsx's
  // own emptyText): the brighter textSecondary color plus a real drop
  // shadow, not just a color swap alone.
  // 2026-08-29, standing rule: no text sits directly on a tab's
  // photographic background. panelStandalone is for text with no card
  // to join (an empty state, an error or loading line);
  // groupHeadingChip is for a heading introducing a GROUP of separate
  // cards. A heading that labels ONE card should move inside that
  // card instead of using either.
  panelStandalone: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  groupHeadingChip: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  emptyText: { ...typography.body, ...textShadow, color: colors.textSecondary, textAlign: 'center', marginTop: 24 , backgroundColor: colors.surface },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fieldLabel: { ...typography.label, color: colors.textPrimary,

    ...textShadow,

  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  // flexWrap added 2026-08-14 -- the New Garden Area wizard's own Space
  // Type (7 options) and Sunlight Exposure (5 options, one genuinely long
  // label) rows both need to wrap; harmless for every shorter row already
  // using this same style, since wrap has no visible effect when
  // everything already fits on one line.
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  // Phase 4's own Length/Width entry boxes -- narrow enough to sit
  // side-by-side with the Feet/Meters toggle in the same fieldRow.
  sizeInput: { width: 90 },
  pillTextActive: { color: colors.textOnButton, fontWeight: '400',

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
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
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', ...BUTTON_SHADOW },
  primaryButtonText: { color: colors.textOnButton, fontWeight: '400',

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  disabledButton: { opacity: 0.5 },
  errorText: { color: colors.danger },
  secondaryButton: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { fontWeight: '400' },
  linkText: { ...typography.body, color: colors.primary,

    ...textShadow,

  },
});
