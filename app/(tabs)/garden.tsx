import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { HelpSection } from '../../components/HelpButton';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { DIGEST_READING_HELP, DigestCategoryLens } from '../../components/DigestCategoryLens';
import { GatedTabContent } from '../../components/GatedTabContent';
import { HOME_BAND_GAP, HomeSectionBand } from '../../components/HomeSectionBand';
import { makeTabBandStyles, TabBand } from '../../components/TabBand';
import { useBandFolds } from '../../hooks/useBandFolds';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub, type MyItemsCategory } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { CompostLens } from '../../components/CompostLens';
import { GrowingCostsLens } from '../../components/GrowingCostsLens';
import { AppTextInput } from '../../components/AppTextInput';
import { FoodLookup, type ResolvedFoodSelection } from '../../components/FoodLookup';
import { PopoverSelect } from '../../components/PopoverSelect';
import { VoiceInputButton } from '../../components/VoiceInputButton';
import { COUNTRIES } from '../../constants/countries';
import { BUTTON_SHADOW, colors } from '../../constants/colors';
import { typography, textShadow } from '../../constants/typography';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { formatQuantity, formatTradeMoney, harvestUnitForPricing, perUnit, valueReceivedGoods } from '../../lib/harvestTrade';
import { getLastPaidPrices } from '../../lib/harvestTradeDb';
import { sortByLabel } from '../../lib/choiceOrder';
import { listCompostPiles } from '../../lib/compostDb';
import { listGrowingCosts } from '../../lib/gardenMoneyDb';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import { USDA_ZONES, zoneBandInfo } from '../../lib/gardenZones';
import { lookupGrowingZone, type GrowingZoneLookupResult } from '../../lib/gardenZoneLookup';
import {
  archiveGardenPlot,
  countGrowingPlantings,
  createGardenPlanting,
  createGardenPlot,
  deleteGardenHarvest,
  deleteGardenPlanting,
  deleteGardenPlot,
  gardenPlotHasRecords,
  getUserProfile,
  listGardenHarvests,
  listGardenPlantings,
  listGardenPlots,
  listPlantingHarvestCounts,
  listUpcomingGardenTasks,
  recordGardenHarvest,
  setGardenHarvestOnHand,
  scheduleGardenTask,
  setUserProfile,
  updateGardenPlanting,
  updateGardenPlot,
  type GardenHarvest,
  type GardenPlanting,
  type GardenPlot,
  type GardenSizeUnit,
  type GardenSunlightExposure,
} from '../../lib/db';
import { gardenSpaceLabel, isRetiredGardenSpace, type CustomGardenSpace } from '../../lib/gardenSpaces';
import { listGardenSpaces } from '../../lib/gardenSpacesDb';
import { PLANTING_STATUS_OPTIONS, pastAreaBlocker, plantingStatusLabel } from '../../lib/gardenAreaLifecycle';
import { GardenSpaceField } from '../../components/GardenSpaceField';
import { DaysUntilSection } from '../../components/DaysUntilSection';
import { countRunningGardenCountdowns } from '../../lib/gardenCountdownDb';
import { emptyLightDraft, GrowSetupSection, LightFields, lightDraftHasLight, lightDraftToInput, type LightDraft } from '../../components/GrowSetupSection';
import type { CustomGardenTerm } from '../../lib/growSetup';
import { addGrowEquipment, listGardenTerms } from '../../lib/growSetupDb';

// This page's own identity color -- see constants/colors.ts's own comment
// on tabGarden for how it was chosen.
const TAB_COLOR = colors.tabGarden;
const band = makeTabBandStyles(TAB_COLOR);

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
const COUNTRY_OPTIONS = sortByLabel(COUNTRIES.map((country) => ({ label: country.name, value: country.code })));

type GardenLens = 'myZone' | 'plotsAndPlantings' | 'daysUntil' | 'harvestLog' | 'upcomingTasks' | 'compost' | 'growingCosts' | 'horticulture';

const GARDEN_LENS_FULL_NAMES: Record<GardenLens, string> = {
  myZone: 'My Zone',
  plotsAndPlantings: 'Plots &\nPlantings',
  daysUntil: 'Days\nUntil',
  harvestLog: 'Harvest\nLog',
  upcomingTasks: 'Upcoming\nTasks',
  compost: 'Compost',
  growingCosts: 'Growing\nCosts',
  horticulture: 'Horticulture',
};

const GARDEN_LENSES: LensOption<GardenLens>[] = [
  {
    key: 'myZone',
    label: 'My Zone',
    icon: 'earth-outline',
    help: [
      {
        heading: 'My Zone',
        body: 'Look up your USDA Plant Hardiness Zone by country + ZIP/postal code. It works anywhere on Earth, not just the US: a US ZIP gets the official USDA zone directly, everywhere else gets an estimate from that location’s historical temperature data. Or set it directly if you already know it, here or in Profile; both write to the same one saved value. Once set, this shows cited crop guidance for your climate band from the Horticulture lens on this tab, and points you at the fuller entry to read there.',
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
        body: 'A garden area is a place you grow food: a raised bed, a container, an indoor grow tent, a whole outdoor garden. Adding one walks through where it is, what kind of space it is (a raised bed, containers, a tent, or a space you name yourself from the picker, which then stays on the list), how much sun it gets (or, indoors, what lights it: the kind of light, its wattage, hours a day, timer, spectrum and the stage it suits, since indoors the light is the sun), its size, and its hardiness zone: details a future planting algorithm can use, none of them required to just get started. Each area has a Grow Setup once saved: lights, containers and what they are made of, hydroponic gear, humidity, timers, cooling, heating, water filtration, fans, exhaust, air filters, meters and any kind you name, each with what it cost to buy (recorded under Growing Costs for that area, so the budget sees it once), any ongoing cost, and its wattage and hours, from which the app works out what the setup draws a month and prices it once an electricity bill is recorded under Growing Costs. Each area also has Days Until counters: name something (germination, transplanting out, the first harvest), say how many days and the day it started, tie it to one planting if you like, and it counts down, says Today on the day (the phone reminds you that morning; the switch for it is in Profile > Reminders), and keeps counting past it until you mark it done; every counter in the garden is on the Days Until lens, and the running ones are on the Home screen under Garden; on either, you can start one by picking its area. Add what you’re growing in it (a reference food, the same ones every Food builder already uses) to track it from planting through harvest. Each planting has a status you set as it goes: Growing, Harvested, Failed or Pulled out. Once every grow in an area has finished, Move to Past Areas takes the area off the working list and keeps everything recorded under it readable in Past Areas below, and Bring it back returns it. Delete Area is only offered while nothing has been recorded under an area, so a record of what grew where is never lost.',
      },
    ],
  },
  // 2026-09-21, direct request: "Add a Days Until counter to the Garden
  // hub quick access." Every counter across the garden in one place, and
  // a new one started here by picking its area, rather than only under
  // that area on Plots & Plantings.
  {
    key: 'daysUntil',
    label: 'Days Until',
    icon: 'hourglass-outline',
    help: [
      {
        heading: 'Days Until',
        body: 'Every Days Until counter in the garden, soonest first, each naming its area and the planting it is for. Start one here: pick the area, name what you are counting to (germination, transplanting out, the first harvest, the cover coming off), say how many days and the day it started, and tie it to one planting in that area if you like. A counter says Today on its day (the phone reminds you that morning; the switch for it is in Profile > Reminders), keeps counting past it until you mark it done, and Done keeps it as the record of how long the thing took. The same counters sit under each area on Plots & Plantings, and the running ones are on the Home screen under Garden, where one can also be started and marked done.',
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
        body: 'Garden chores (watering, feeding, checking on something) scheduled for a specific date, created here and stored the same way any other Schedule item is. A dedicated lens for these inside the Schedules tab itself isn’t built yet, so this is the place to see and add them for now.',
      },
    ],
  },
  // 2026-09-20, direct instruction: "Garden should have Compost available
  // as a lens that tracks the materials added to the compost, when it was
  // turned, watered, and everything else about making good compost."
  {
    key: 'compost',
    label: 'Compost',
    icon: 'layers-outline',
    help: [
      {
        heading: 'Compost',
        body: 'One band per pile, bin, tumbler, worm bin or trench. Record what goes in and whether it was green or brown, when it was turned and watered, a temperature reading, a squeeze test for moisture, and when finished compost comes out or goes onto a plot. The pile reads back what it needs from what you recorded: a greens-to-browns lean, a dry or wet last check, too long since a turn, whether it reached the heat that kills weed seeds. Kitchen scraps cost nothing; a bought material takes a cost and becomes a growing cost, counted under the area or whole group the pile feeds, which you set when you start it and can change on its band. "Remind me to turn it" puts a task under Upcoming Tasks.',
      },
    ],
  },
  // 2026-09-20, direct instruction: "The Garden harvest should also take
  // into account all money spent to grow the food. This should include
  // nutrients purchased to feed the garden if natural growing techniques
  // aren't used that are free to them, such as compost from kitchen
  // scraps."
  {
    key: 'growingCosts',
    label: 'Growing Costs',
    icon: 'wallet-outline',
    help: [
      {
        heading: 'Growing Costs',
        body: 'Money spent to grow food: seeds and starts, soil and amendments, fertilizer and nutrients, bought compost materials, water, tools, pest control, containers, and any kind you add yourself from the Kind picker (mulch, a soil test), which is then on the list for every cost after it. Each is a Garden & growing supplies entry in your budget on Life > Finances, so nothing is counted twice. Tie a cost to a garden area when you add it (an area can be made right there in the cost form if none exists yet, and the cost waits for you), and By Area sets the costs of that area against the harvests kept from it, so an indoor grow under an LED light and the beds outside each get a separate figure, and one grow can be tracked while another is not. The top card is the whole garden, with areas rolled up as indoors, greenhouse and outdoors. Areas grown the same way can be combined under Cost Groups, and the group then stands as one figure in place of its areas; a cost can be tied to the whole group when it fed every area in it. What was bought for a compost pile counts under the area or group the pile feeds. Costs are set against an area, never one crop. Compost from your kitchen scraps costs nothing and is not entered.',
      },
    ],
  },
  // 2026-09-19, the Digest's Home Gardening category by direct instruction:
  // "Gardening needs to be moved from Digest to Garden, but I think it
  // needs to be renamed to something else that relates to learning about
  // gardening, like Horticulture." The reading, as against the tracking
  // the other four lenses do. See components/DigestCategoryLens.tsx.
  {
    key: 'horticulture',
    label: 'Horticulture',
    icon: 'leaf-outline',
    help: [
      {
        heading: 'Horticulture',
        body: 'Cited guidance on growing fresh food at home: the USDA Plant Hardiness Zone Map and what it does and does not tell you, crop guidance for each of four climate bands from cold and short-season through tropical, what a container can and cannot grow, and how a home garden fits with the pollinator and soil research in Earth Matters on the Life tab. Each subject is one band. Open it to see its entries, and open an entry to read it in place. My Zone, on this same menu, points at the band that matches your zone.',
      },
      DIGEST_READING_HELP,
    ],
  },
];

const GARDEN_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this tab is for',
    body: "So growing food yourself is worth the effort, not just a separate hobby log nobody else in this app ever sees. Track what you're growing, what actually gets harvested, and it becomes a pickable ingredient in the Food builders, the same as anything from the reference database.",
  },
  {
    heading: 'What it tracks',
    body: "Your USDA Plant Hardiness Zone (found automatically from a country + ZIP/postal code, anywhere on Earth, or set directly if you already know it), garden areas and what's planted in them, a harvest log, compost piles and everything done to them, money spent on growing set against what the garden gives back, and upcoming garden tasks. A basic Scheduler tie-in exists too (a garden task creates a schedule_items row; a dedicated lens for it inside the Schedules tab itself isn't built yet).",
  },
];

// Phase 1 -- Location & Environment. Widened 2026-08-14 to include
// Greenhouse alongside the original Outdoor/Indoor; alphabetical since
// 2026-09-21, the same order the Growing Costs area form uses.
const LOCATION_TYPE_OPTIONS: { value: 'outdoor' | 'indoor' | 'greenhouse'; label: string }[] = [
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
];

// Phase 2 -- Space Type, the real structured replacement for the old
// free-text "growing medium" field. Since 2026-09-20 the list lives in
// lib/gardenSpaces.ts and the picker is components/GardenSpaceField.tsx,
// shared with the area form inside Growing Costs: four built-in spaces
// plus any the person names, and the three equipment values that were on
// this list (hydroponic, LED lights, temperature and humidity control)
// are pieces of the area's Grow Setup (components/GrowSetupSection.tsx)
// rather than spaces.

// Phase 3 -- Sunlight Exposure, the real structured replacement for the old
// free-text "light source" field. Since 2026-09-21 the form offers the
// three sun levels only: an indoor area is asked what lights it instead
// (the light is saved as the first piece of its Grow Setup), and a
// greenhouse is asked about sun and may add lights. The two values that
// used to sit here are retired; an area recorded under one still reads
// its label from RETIRED_SUNLIGHT_LABELS.
const SUNLIGHT_OPTIONS: { value: GardenSunlightExposure; label: string }[] = [
  { value: 'full_sun', label: 'Full Sun (6+ hours)' },
  { value: 'partial_shade', label: 'Partial Shade (3-6 hours)' },
  { value: 'full_shade', label: 'Full Shade (<3 hours)' },
];
const RETIRED_SUNLIGHT_LABELS: Partial<Record<GardenSunlightExposure, string>> = {
  indoor_led_timer: 'Indoor LED Lights, Timer required',
  airflow: 'Airflow',
};

// Phase 4 -- Size & Dimensions' own Feet/Meters toggle.
const SIZE_UNIT_OPTIONS: { value: GardenSizeUnit; label: string }[] = [
  { value: 'feet', label: 'Feet' },
  { value: 'meters', label: 'Meters' },
];

// Real display-label lookups for the collapsed garden-area card's own
// summary line -- reuses the exact same option arrays above rather than a
// second, separately-maintained label map.
const SUNLIGHT_LABELS: Record<GardenSunlightExposure, string> = {
  ...(Object.fromEntries(SUNLIGHT_OPTIONS.map((o) => [o.value, o.label])) as Record<GardenSunlightExposure, string>),
  ...RETIRED_SUNLIGHT_LABELS,
};

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
  // 2026-08-17: the deep-link param every tab takes, so a Home card or a
  // capture note lands on the lens it names rather than on this tab's
  // resting picker. (Food's My Whole Foods tile used it too until
  // 2026-09-20, when that became a lens of Food's own.) openEntryId came
  // with Horticulture on 2026-09-19: a
  // Home flip card's Read More or a Related chip on another tab names
  // the entry to open, see lib/digestNavigation.ts.
  const { openGardenLens, openEntryId } = useLocalSearchParams<{ openGardenLens?: string; openEntryId?: string }>();
  const [lens, setLens] = useState<GardenLens>('myZone');
  // An entry the Compost lens asked to read on Horticulture, 2026-09-20.
  const [readEntryId, setReadEntryId] = useState<string | undefined>(undefined);
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
      // picker" reset below, the same way food.tsx's own openFoodLens
      // already does.
      if (
        openGardenLens === 'myZone' ||
        openGardenLens === 'plotsAndPlantings' ||
        openGardenLens === 'daysUntil' ||
        openGardenLens === 'harvestLog' ||
        openGardenLens === 'upcomingTasks' ||
        openGardenLens === 'compost' ||
        openGardenLens === 'growingCosts' ||
        openGardenLens === 'horticulture'
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
  const [pileCount, setPileCount] = useState<number | undefined>(undefined);
  const [costCount, setCostCount] = useState<number | undefined>(undefined);
  const [countdownCount, setCountdownCount] = useState<number | undefined>(undefined);

  const loadMyGardenCounts = useCallback(async () => {
    const [plots, plantings, harvests, tasks, piles, costs, countdowns] = await Promise.all([
      listGardenPlots(),
      listGardenPlantings(),
      listGardenHarvests(500),
      listUpcomingGardenTasks(500),
      listCompostPiles(),
      listGrowingCosts(500),
      countRunningGardenCountdowns(),
    ]);
    setPlotCount(plots.length);
    setPlantingCount(plantings.length);
    setHarvestCount(harvests.length);
    setTaskCount(tasks.length);
    setPileCount(piles.length);
    setCostCount(costs.length);
    setCountdownCount(countdowns);
  }, []);

  const myGardenCategories: MyItemsCategory[] = [
    { id: 'plots', label: 'Garden Areas', count: plotCount, onPress: () => { setLens('plotsAndPlantings'); setRevealed(true); } },
    {
      id: 'plantings',
      label: 'Plantings',
      count: plantingCount,
      onPress: () => { setLens('plotsAndPlantings'); setRevealed(true); },
    },
    { id: 'countdowns', label: 'Days Until', count: countdownCount, onPress: () => { setLens('daysUntil'); setRevealed(true); } },
    { id: 'harvests', label: 'Harvests', count: harvestCount, onPress: () => { setLens('harvestLog'); setRevealed(true); } },
    { id: 'tasks', label: 'Upcoming Tasks', count: taskCount, onPress: () => { setLens('upcomingTasks'); setRevealed(true); } },
    { id: 'compost', label: 'Compost Piles', count: pileCount, onPress: () => { setLens('compost'); setRevealed(true); } },
    { id: 'costs', label: 'Growing Costs', count: costCount, onPress: () => { setLens('growingCosts'); setRevealed(true); } },
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
          ) : lens === 'daysUntil' ? (
            <DaysUntilLens scrollBottomPadding={scrollBottomPadding} />
          ) : lens === 'harvestLog' ? (
            <HarvestLogLens scrollBottomPadding={scrollBottomPadding} />
          ) : lens === 'upcomingTasks' ? (
            <UpcomingTasksLens scrollBottomPadding={scrollBottomPadding} />
          ) : lens === 'compost' ? (
            <CompostLens
              scrollBottomPadding={scrollBottomPadding}
              onReadAboutComposting={(entryId) => {
                setReadEntryId(entryId);
                setLens('horticulture');
              }}
            />
          ) : lens === 'growingCosts' ? (
            <GrowingCostsLens scrollBottomPadding={scrollBottomPadding} />
          ) : lens === 'horticulture' ? (
            <HorticultureLens scrollBottomPadding={scrollBottomPadding} openEntryId={openEntryId ?? readEntryId} />
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
      <View style={[band.box, styles.card]}>
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

      <View style={[band.box, styles.card]}>
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
        <View style={[band.box, styles.card]}>
          <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Zone {zone}: {bandInfo.bandLabel}</Text>
          {bandInfo.belowCoverage ? (
            <Text style={styles.captionText}>
              This app&apos;s crop-band research currently starts at zone 3, so the cold/short-season guidance below is
              the closest match, not a perfect one for your specific zone.
            </Text>
          ) : null}
          <Text style={styles.cardBody}>
            Cited guidance for your climate band is in Horticulture, on this tab&apos;s menu. Look there for:
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
// Horticulture
// ---------------------------------------------------------------------------

// The Digest's Home Gardening reading, on this tab since 2026-09-19. The
// lens keeps its own ScrollView like the four tracking lenses, and hands
// the reading component the scroll so an entry opened from a link is
// brought into view.
function HorticultureLens({ scrollBottomPadding, openEntryId }: { scrollBottomPadding: number; openEntryId?: string }) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollTo = useCallback((y: number) => {
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);
  return (
    <ScrollView ref={scrollRef} contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <DigestCategoryLens categoryKey="homeGardening" tabColor={TAB_COLOR} openEntryId={openEntryId} scrollToY={scrollTo} />
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
  const [newAreaSpaceType, setNewAreaSpaceType] = useState<string | null>(null);
  // The spaces the person has named. allSpaces includes retired ones, for
  // reading a past area's space by name; activeSpaces is the picker's list,
  // for telling a current area its space is no longer offered.
  const [customSpaces, setCustomSpaces] = useState<CustomGardenSpace[]>([]);
  const [activeSpaces, setActiveSpaces] = useState<CustomGardenSpace[]>([]);
  // Areas moved to Past Areas (garden_plots.archived_at), 2026-09-21: kept
  // as documentation, listed in their own fold band under the current ones.
  const [pastPlots, setPastPlots] = useState<GardenPlot[]>([]);
  const [showPastAreas, setShowPastAreas] = useState(false);
  // Per area: harvests logged from each planting (a planting with one is a
  // record and offers no Remove) and whether anything at all is recorded
  // under it (only an empty area offers Delete).
  const [plotFacts, setPlotFacts] = useState<Record<string, { harvestsByPlanting: Record<string, number>; hasRecords: boolean }>>({});
  // The line shown under an area whose move to Past Areas was refused
  // because a grow in it is still going.
  const [pastBlockers, setPastBlockers] = useState<Record<string, string>>({});
  // Phase 3 -- Sunlight Exposure.
  const [newAreaSunlight, setNewAreaSunlight] = useState<GardenSunlightExposure | null>(null);
  // Indoors, the light is the sun: an indoor area is asked what lights it
  // in place of how much sun it gets, and the light is saved as the first
  // piece of the new area's Grow Setup. A greenhouse may add one too.
  const [newAreaLight, setNewAreaLight] = useState<LightDraft>(emptyLightDraft);
  const [newAreaGreenhouseLit, setNewAreaGreenhouseLit] = useState(false);
  const [gardenTerms, setGardenTerms] = useState<CustomGardenTerm[]>([]);
  const reloadGardenTerms = useCallback(async () => {
    setGardenTerms(await listGardenTerms(true));
  }, []);
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
    const [rows, spaces, active, terms] = await Promise.all([listGardenPlots(true), listGardenSpaces(true), listGardenSpaces(), listGardenTerms(true)]);
    setPlots(rows.filter((plot) => !plot.archivedAt));
    setPastPlots(rows.filter((plot) => plot.archivedAt));
    setCustomSpaces(spaces);
    setActiveSpaces(active);
    setGardenTerms(terms);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlots();
    }, [loadPlots]),
  );

  async function loadPlantingsFor(plotId: string) {
    const [rows, harvestsByPlanting, hasRecords] = await Promise.all([
      listGardenPlantings(plotId),
      listPlantingHarvestCounts(plotId),
      gardenPlotHasRecords(plotId),
    ]);
    setPlantingsByPlot((current) => ({ ...current, [plotId]: rows }));
    setPlotFacts((current) => ({ ...current, [plotId]: { harvestsByPlanting, hasRecords } }));
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
    const asksForLight = newAreaLocationType === 'indoor' || (newAreaLocationType === 'greenhouse' && newAreaGreenhouseLit);
    const plotId = await createGardenPlot({
      name: newAreaName,
      locationType: newAreaLocationType,
      spaceType: newAreaSpaceType,
      sunlightExposure: newAreaLocationType === 'indoor' ? null : newAreaSunlight,
      length: newAreaLength.trim() ? Number(newAreaLength) : null,
      width: newAreaWidth.trim() ? Number(newAreaWidth) : null,
      sizeUnit: newAreaLength.trim() || newAreaWidth.trim() ? newAreaSizeUnit : null,
      zone: newAreaZone,
      zoneCountry: newAreaZoneCountry,
      zonePostalCode: newAreaZonePostal.trim() || null,
    });
    if (asksForLight && lightDraftHasLight(newAreaLight)) {
      await addGrowEquipment(lightDraftToInput(newAreaLight, plotId, gardenTerms));
    }
    setNewAreaName('');
    setNewAreaLocationType('outdoor');
    setNewAreaSpaceType(null);
    setNewAreaSunlight(null);
    setNewAreaLight(emptyLightDraft());
    setNewAreaGreenhouseLit(false);
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

  // Move to Past Areas, only once every grow in the area has finished:
  // "the area should only be able to be removed if a grow currently using
  // it is completed." The count is re-read from the database rather than
  // trusted from state, so a planting added on another screen still counts.
  async function handleMoveToPast(id: string) {
    const growing = await countGrowingPlantings(id);
    if (growing > 0) {
      const line = pastAreaBlocker(Array.from({ length: growing }, () => ({ status: 'growing' as const })));
      setPastBlockers((current) => ({ ...current, [id]: line ?? '' }));
      return;
    }
    await archiveGardenPlot(id, true);
    setPastBlockers((current) => ({ ...current, [id]: '' }));
    if (expandedPlotId === id) setExpandedPlotId(null);
    await loadPlots();
  }

  async function handleBringBack(id: string) {
    await archiveGardenPlot(id, false);
    await loadPlots();
  }

  // Delete is offered only for an area with nothing recorded under it, and
  // deleteGardenPlot refuses anything else, so a record is never lost.
  async function handleDeletePlot(id: string) {
    const deleted = await deleteGardenPlot(id);
    if (!deleted) {
      await loadPlantingsFor(id);
      return;
    }
    await loadPlots();
  }

  async function handlePlantingStatus(plotId: string, plantingId: string, status: string) {
    const option = PLANTING_STATUS_OPTIONS.find((entry) => entry.value === status);
    if (!option) return;
    await updateGardenPlanting(plantingId, { status: option.value });
    setPastBlockers((current) => ({ ...current, [plotId]: '' }));
    await loadPlantingsFor(plotId);
  }

  // A current area still holding a space the picker no longer offers (a
  // built-in retired since, or a space of the person's removed while this
  // area read it) is moved to one that is.
  async function handleMoveAreaSpace(plotId: string, code: string | null) {
    if (!code) return;
    await updateGardenPlot(plotId, { spaceType: code });
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

  // Only for a planting with no harvest logged; one with a harvest is a
  // record, and its status says what became of it instead.
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
        <View style={band.boxMuted}>
          <Text style={styles.emptyText}>No garden areas yet. Add one below to start tracking what you&apos;re growing.</Text>
        </View>
      ) : (
        plots.map((plot) => {
          const expanded = expandedPlotId === plot.id;
          const plantings = plantingsByPlot[plot.id] ?? [];
          return (
            <HomeSectionBand
              key={plot.id}
              kind="fold"
              title={plot.name}
              icon="leaf-outline"
              color={TAB_COLOR}
              expanded={expanded}
              onToggle={() => {
                const next = expanded ? null : plot.id;
                setExpandedPlotId(next);
                if (next) loadPlantingsFor(plot.id);
              }}
            >
              <View style={styles.expandedSection}>
                <Text style={styles.captionText}>
                  {plot.locationType === 'greenhouse' ? 'Greenhouse' : plot.locationType === 'indoor' ? 'Indoor' : 'Outdoor'}
                  {gardenSpaceLabel(plot.spaceType, customSpaces)
                    ? ` · ${gardenSpaceLabel(plot.spaceType, customSpaces)}`
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
                {isRetiredGardenSpace(plot.spaceType, activeSpaces) ? (
                  <View style={styles.pendingCard}>
                    <Text style={styles.captionText}>
                      {gardenSpaceLabel(plot.spaceType, customSpaces) ?? 'The space this area was under'} is no longer on the list of spaces. Pick where this area is now; its record is kept either way.
                    </Text>
                    <GardenSpaceField label="Move this area to" selected={null} onSelect={(code) => handleMoveAreaSpace(plot.id, code)} />
                  </View>
                ) : null}
                <View style={styles.pendingCard}>
                  <GrowSetupSection plot={plot} onChanged={() => loadPlantingsFor(plot.id)} />
                </View>
                <View style={styles.pendingCard}>
                  <DaysUntilSection plot={plot} plantings={plantings} onChanged={() => loadPlantingsFor(plot.id)} />
                </View>
                {plantings.length === 0 ? (
                  <Text style={styles.captionText}>Nothing logged as planted here yet.</Text>
                ) : (
                  plantings.map((planting) => {
                    const harvests = plotFacts[plot.id]?.harvestsByPlanting[planting.id] ?? 0;
                    return (
                      <View key={planting.id} style={styles.plantingRow}>
                        <Text style={[styles.bodyText, styles.plantingName]}>
                          {planting.foodName}
                          {planting.varietyNote ? ` (${planting.varietyNote})` : ''}
                        </Text>
                        <PopoverSelect
                          options={PLANTING_STATUS_OPTIONS}
                          selected={planting.status}
                          onSelect={(value) => handlePlantingStatus(plot.id, planting.id, value)}
                          tabColor={TAB_COLOR}
                          width={140}
                        />
                        {harvests === 0 ? (
                          <TouchableOpacity onPress={() => handleRemovePlanting(plot.id, planting.id)}>
                            <Text style={[styles.linkText, { color: colors.danger }]}>Remove</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })
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
                  <TouchableOpacity onPress={() => handleMoveToPast(plot.id)}>
                    <Text style={styles.linkText}>Move to Past Areas</Text>
                  </TouchableOpacity>
                  {plotFacts[plot.id] && !plotFacts[plot.id].hasRecords ? (
                    <TouchableOpacity onPress={() => handleDeletePlot(plot.id)}>
                      <Text style={[styles.linkText, { color: colors.danger }]}>Delete Area</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                {pastBlockers[plot.id] ? (
                  <Text style={styles.captionText}>{pastBlockers[plot.id]}</Text>
                ) : null}
              </View>
            </HomeSectionBand>
          );
        })
      )}

      {pastPlots.length > 0 ? (
        <HomeSectionBand
          kind="fold"
          title="Past Areas"
          icon="archive-outline"
          color={TAB_COLOR}
          expanded={showPastAreas}
          onToggle={() => {
            const next = !showPastAreas;
            setShowPastAreas(next);
            if (next) pastPlots.forEach((plot) => loadPlantingsFor(plot.id));
          }}
        >
          <View style={styles.expandedSection}>
            <Text style={styles.captionText}>
              Areas you no longer grow in. What was planted, harvested and spent here stays on record; Bring it back returns an area to the list above.
            </Text>
            {pastPlots.map((plot) => {
              const plantings = plantingsByPlot[plot.id] ?? [];
              return (
                <View key={plot.id} style={styles.pastArea}>
                  <Text style={styles.bodyText}>{plot.name}</Text>
                  <Text style={styles.captionText}>
                    {plot.locationType === 'greenhouse' ? 'Greenhouse' : plot.locationType === 'indoor' ? 'Indoor' : 'Outdoor'}
                    {gardenSpaceLabel(plot.spaceType, customSpaces) ? ` · ${gardenSpaceLabel(plot.spaceType, customSpaces)}` : ''}
                    {plot.archivedAt ? ` · Moved here ${plot.archivedAt.slice(0, 10)}` : ''}
                  </Text>
                  {plantings.map((planting) => (
                    <Text key={planting.id} style={styles.captionText}>
                      {planting.foodName}
                      {planting.varietyNote ? ` (${planting.varietyNote})` : ''}: {plantingStatusLabel(planting.status)}
                    </Text>
                  ))}
                  <DaysUntilSection plot={plot} plantings={plantings} readOnly />
                  <TouchableOpacity onPress={() => handleBringBack(plot.id)}>
                    <Text style={styles.linkText}>Bring it back</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </HomeSectionBand>
      ) : null}

      {showAddPlot ? (
        <View style={[band.box, styles.card]}>
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

          <View style={{ marginTop: 10 }}>
            <GardenSpaceField label="What type of space are you growing in?" selected={newAreaSpaceType} onSelect={setNewAreaSpaceType} />
          </View>
          <Text style={styles.captionText}>
            Dictates soil depth limitations, drainage styles, root spacing rules, and indoor requirements. Lights, hydroponic gear and climate control are not spaces; they are the area&apos;s Grow Setup, added once the area is saved.
          </Text>

          {newAreaLocationType !== 'indoor' ? (
            <>
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
            </>
          ) : null}
          {newAreaLocationType === 'greenhouse' ? (
            <>
              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Lights added?</Text>
              <View style={styles.pillRow}>
                {[{ value: true, label: 'Yes' }, { value: false, label: 'No' }].map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.pill,
                      { borderColor: TAB_COLOR },
                      newAreaGreenhouseLit === option.value ? { backgroundColor: PRIMARY_BUTTON_BACKGROUND } : null,
                    ]}
                    onPress={() => setNewAreaGreenhouseLit(option.value)}
                  >
                    <Text style={newAreaGreenhouseLit === option.value ? styles.pillTextActive : { color: TAB_COLOR }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}
          {newAreaLocationType === 'indoor' || (newAreaLocationType === 'greenhouse' && newAreaGreenhouseLit) ? (
            <View style={[styles.pendingCard, { marginTop: 10 }]}>
              <Text style={styles.fieldLabel}>{newAreaLocationType === 'indoor' ? 'What lights this space?' : 'The lights'}</Text>
              <LightFields draft={newAreaLight} onChange={setNewAreaLight} terms={gardenTerms} onTermsChanged={reloadGardenTerms} />
              <Text style={styles.captionText}>
                {newAreaLocationType === 'indoor'
                  ? 'Indoors, the light is the sun, so it is asked for here in place of sun hours. What it cost is recorded under Growing Costs for this area. Containers, fans, exhaust, cooling, water filtration, humidity and the rest of the setup go under Grow Setup once the area is saved, each with what it cost to buy and what it runs on.'
                  : 'What the lights cost is recorded under Growing Costs for this area. The rest of the setup goes under Grow Setup once the area is saved.'}
              </Text>
            </View>
          ) : null}

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
          <Text style={styles.captionText}>Lets the app calculate planting density and grid spacing later.</Text>

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
            lookup as My Zone, pre-filled from your profile if already set there, editable here if this specific
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
        <View style={band.inset}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
            onPress={handleShowAddPlot}
          >
            <Text style={styles.primaryButtonText}>+ Add a Garden Area</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Harvest Log
// ---------------------------------------------------------------------------

function HarvestLogLens({ scrollBottomPadding }: { scrollBottomPadding: number }) {
  const folds = useBandFolds();
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
  // The harvest just saved, held while the card asks whether to keep it as
  // one of the person's on-hand home-grown foods. 2026-09-20, direct
  // instruction: "When a harvest is logged, this is the time when the app
  // should ask if this harvest should be added to their on hand, home grown
  // whole foods." It is saved on hand already (garden_harvests.on_hand
  // defaults to 1), so walking away is a yes; only a tap on No changes it.
  // avoided is the one sentence of money this app will say about a
  // harvest: what it would have cost at a price the person has recorded
  // paying for that food in the same unit, and nothing when there is none.
  const [justSaved, setJustSaved] = useState<{ id: string; foodName: string; quantity: number; unit: string; avoided: string | null } | null>(null);

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
    const amount = Number(quantity);
    const id = await recordGardenHarvest({
      plantingId: selectedPlanting.id,
      plotId: selectedPlanting.plotId,
      foodId: selectedPlanting.foodId,
      source: selectedPlanting.source,
      foodName: selectedPlanting.foodName,
      harvestedAt: todayDateString(),
      quantity: amount,
      unit,
    });
    const valuation = valueReceivedGoods(
      [{ foodName: selectedPlanting.foodName, quantity: amount, unit: harvestUnitForPricing(unit) }],
      await getLastPaidPrices(),
    );
    const valued = valuation.valued[0];
    setJustSaved({
      id,
      foodName: selectedPlanting.foodName,
      quantity: amount,
      unit,
      avoided: valued
        ? `That is about ${formatTradeMoney(valued.amount)} you did not have to spend, at the ${formatTradeMoney(valued.pricePaid)} ${perUnit(valued.unit)} you paid on ${valued.pricedOn}.`
        : null,
    });
    setSelectedPlanting(null);
    setQuantity(null);
    setUnit('count');
    await load();
  }

  async function answerOnHand(keep: boolean) {
    if (!justSaved) return;
    if (!keep) await setGardenHarvestOnHand(justSaved.id, false);
    setJustSaved(null);
    await load();
  }

  async function handleOnHandChange(id: string, onHand: boolean) {
    await setGardenHarvestOnHand(id, onHand);
    await load();
  }

  async function handleDelete(id: string) {
    await deleteGardenHarvest(id);
    await load();
  }

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[band.box, styles.card]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Log a Harvest</Text>
        {justSaved ? (
          <>
            <Text style={styles.bodyText}>
              Saved: {formatQuantity(justSaved.quantity, justSaved.unit)} of {justSaved.foodName}.
            </Text>
            <Text style={styles.bodyText}>Add this harvest to My Whole Foods, your on-hand home-grown foods?</Text>
            <Text style={styles.captionText}>
              Kept on hand, it shows up under My Whole Foods on the Food tab, is offered first when you add an
              ingredient in any Food tool, and is drawn from as you cook with it.
              {justSaved.avoided ? ` ${justSaved.avoided}` : ''}
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
                onPress={() => answerOnHand(true)}
              >
                <Text style={styles.primaryButtonText}>Yes, Keep It On Hand</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => answerOnHand(false)}>
                <Text style={styles.linkText}>Not This One</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : selectedPlanting ? (
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

      <TabBand folds={folds} color={TAB_COLOR} id="garden:harvests:recent" title="Recent Harvests" icon="basket-outline" count={harvests.length}>
        <View style={styles.card}>
          {harvests.length === 0 ? (
            <Text style={styles.captionText}>Nothing logged yet.</Text>
          ) : (
            harvests.map((harvest) => (
              <View key={harvest.id} style={styles.harvestRow}>
                <View style={styles.harvestRowText}>
                  <Text style={styles.bodyText}>
                    {harvest.foodName}: {formatQuantity(harvest.quantityRemaining, harvest.unit)} of{' '}
                    {formatQuantity(harvest.quantity, harvest.unit)} left
                  </Text>
                  {Number(harvest.onHand) === 1 ? null : (
                    <Text style={styles.captionText}>Not kept on hand, so it is not offered as food to cook with.</Text>
                  )}
                </View>
                <View style={styles.harvestRowActions}>
                  <TouchableOpacity onPress={() => handleOnHandChange(harvest.id, Number(harvest.onHand) !== 1)}>
                    <Text style={styles.linkText}>{Number(harvest.onHand) === 1 ? 'Not on hand' : 'Keep on hand'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(harvest.id)}>
                    <Text style={[styles.linkText, { color: colors.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <Text style={styles.captionText}>
            Anything kept on hand with an amount left is listed under My Whole Foods on the Food tab, and is selectable as
            &quot;From Your Harvest&quot; the next time you add an ingredient in any Food tool.
          </Text>
        </View>
      </TabBand>

      {/* The record stays here and the timeline lives on Trends, which is the
          rule the whole 2026-09-23 push runs on: Garden keeps its eight lenses
          and gains a way through rather than a chart of its own. */}
      <View style={[band.box, styles.card]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Over a longer stretch</Text>
        <Text style={styles.captionText}>
          Weight month by month, how long each crop took against how long you expected, what your compost produced, and
          what has gone out to other people.
        </Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/trends', params: { openTrendsLens: 'harvest' } })}>
          <Text style={styles.linkText}>Open Garden Yield on Trends</Text>
        </TouchableOpacity>
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

// Days Until, 2026-09-21 ("Add a Days Until counter to the Garden hub
// quick access"): the whole garden's counters on one band, with the form
// asking which area a new one is under. The section is the same one each
// area shows on Plots & Plantings, given the areas instead of one area.
// The section reads the garden's areas and counters itself (since
// 1.0.42.15, so Home's card can render the same thing), so the lens is
// the band around it and nothing more.
function DaysUntilLens({ scrollBottomPadding }: { scrollBottomPadding: number }) {
  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[band.box, styles.card]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Days Until</Text>
        <DaysUntilSection showHeading={false} />
      </View>
    </ScrollView>
  );
}

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
      <View style={[band.box, styles.card]}>
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
  // No side inset, 2026-09-19: every top-level element is a band that
  // reaches both edges, and a lone button takes band.inset instead.
  body: { paddingBottom: 32, gap: HOME_BAND_GAP },
  // A plain, non-scrolling container for a lens' own "actively picking a
  // food" state -- see PlotsAndPlantingsLens's own addingPlantingToPlot
  // comment for why this can never be inside a ScrollView (Harvest Log no
  // longer needs this at all, redesigned 2026-08-13 to pick from a real,
  // small list of already-tracked plantings instead of FoodLookup). flex: 1
  // (not the padded `body` above) so FoodLookup's own internal FlatLists
  // get the real available
  // height to work with, matching SideBuilder.tsx's own pickerScreen.
  pickerScreen: { flex: 1, padding: 16, gap: 8 },
  // The surface is band.box now (2026-09-19); this keeps a card's inner spacing.
  card: { gap: 8 },
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
  // photographic background. Since 2026-09-19 the empty state sits in
  // band.boxMuted; groupHeadingChip remains for the Cancel link above
  // the food picker, which is not a scrolling band column.
  groupHeadingChip: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  emptyText: { ...typography.body, ...textShadow, color: colors.textSecondary, textAlign: 'center' },
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
  plantingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  plantingName: { flex: 1 },
  pastArea: { gap: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border },
  // A harvest row carries two links (on hand, delete) and sometimes a
  // second line, so its text and its actions each get a column.
  harvestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  harvestRowText: { flex: 1, gap: 2 },
  harvestRowActions: { alignItems: 'flex-end', gap: 4 },
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
