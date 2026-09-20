import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import { createGardenPlot, listGardenPlots, type GardenPlot, type GardenSpaceType } from '../lib/db';
import {
  describeAreaSetting,
  describeGardenNet,
  describeNetShort,
  GROWING_COST_KINDS,
  growingCostKindLabel,
  UNASSIGNED_AREA_NAME,
  type GardenAreaMoney,
  type GrowingCostKind,
} from '../lib/gardenMoney';
import {
  deleteGardenCostGroup,
  deleteGrowingCost,
  listGardenCostGroups,
  listGrowingCosts,
  loadGardenMoneyPicture,
  recordGrowingCost,
  saveGardenCostGroup,
  type GardenCostGroup,
  type GardenMoneyPicture,
  type GrowingCostRecord,
} from '../lib/gardenMoneyDb';
import { formatTradeMoney } from '../lib/harvestTrade';
import { AppTextInput } from './AppTextInput';
import { HOME_BAND_GAP } from './HomeSectionBand';
import { PopoverSelect } from './PopoverSelect';
import { makeTabBandStyles, TabBand } from './TabBand';

// Growing Costs, a lens of Garden.
//
// 2026-09-20, direct instruction: "The Garden harvest should also take into
// account all money spent to grow the food. This should include nutrients
// purchased to feed the garden if natural growing techniques aren't used
// that are free to them, such as compost from kitchen scraps."
//
// What is entered here is a finance entry in the Garden & growing supplies
// category, so the household budget on Life > Finances sees the same money
// once, and what was typed there shows here too. The top card is the net:
// what kept harvests and produce given to you would have cost at recorded
// prices, less everything spent on growing. See lib/gardenMoney.ts for the
// three rules that figure follows.
//
// PER AREA, later the same day: "Growing costs should be separated somehow,
// because the user might be growing something one way and other things
// another way, and they may want to track costs for one grow while not on
// another grow, or it may be a difference between indoors and outdoors
// where indoors uses a LED grow light." A cost is tied to a garden area
// when it is entered, each area gets a separate figure under By Area, the
// areas roll up as indoors, greenhouse and outdoors on the top card, and
// the list of costs is grouped by area.
//
// COST GROUPS, later still: "Allow the growing areas to also be combined
// if necessary as one cost group." The Cost Groups band names a group and
// ticks the areas in it; the group then stands as one row under By Area
// in place of its areas, the Area picker offers the group as a whole for
// a cost that fed every area in it, and the cost list shows the group's
// costs together. See COST GROUPS in lib/gardenMoney.ts for the netting.
//
// AN AREA FROM INSIDE THE COST FORM, 2026-09-20: "If they are adding a
// cost for gardening and get to the question about what area and they
// haven't created an area, they should be given the ability to create an
// area, and then be brought back to the costing." The Area row carries an
// Add an area link that opens a short form in place (name, where it grows,
// what kind of space); saving it writes the same garden_plots row Plots &
// Plantings does, picks the new area for the cost, and leaves every other
// cost field as it was. Size, sunlight and zone stay on Plots & Plantings.

const TAB_COLOR = colors.tabGarden;
const band = makeTabBandStyles(TAB_COLOR);
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;

const KIND_OPTIONS = GROWING_COST_KINDS.map((kind) => ({ label: kind.label, value: kind.code }));
const NO_PLOT = '__none__';
const GROUP_PREFIX = 'group:';
const NO_SPACE = '__none__';

type AreaLocationType = 'outdoor' | 'indoor' | 'greenhouse';
const LOCATION_OPTIONS: { label: string; value: AreaLocationType }[] = [
  { label: 'Outdoor', value: 'outdoor' },
  { label: 'Indoor', value: 'indoor' },
  { label: 'Greenhouse', value: 'greenhouse' },
];
// The same space types Plots & Plantings offers, behind a picker here so
// the short form stays short.
const SPACE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Not said yet', value: NO_SPACE },
  { label: 'In-Ground Plot', value: 'in_ground' },
  { label: 'Raised Bed', value: 'raised_bed' },
  { label: 'Containers & Pots', value: 'containers' },
  { label: 'Hydroponic', value: 'hydroponic' },
  { label: 'Tent', value: 'tent' },
  { label: 'LED Lights', value: 'led_lights' },
  { label: 'Temperature & Humidity Control', value: 'temp_humidity_control' },
];

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function GrowingCostsLens({ scrollBottomPadding }: { scrollBottomPadding: number }) {
  const folds = useBandFolds();
  const [costs, setCosts] = useState<GrowingCostRecord[]>([]);
  const [picture, setPicture] = useState<GardenMoneyPicture | null>(null);
  const [plots, setPlots] = useState<GardenPlot[]>([]);
  const [groups, setGroups] = useState<GardenCostGroup[]>([]);
  const [adding, setAdding] = useState(false);
  const [groupEditing, setGroupEditing] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<GrowingCostKind | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayDateString());
  const [plotId, setPlotId] = useState<string>(NO_PLOT);
  const [error, setError] = useState<string | null>(null);
  const [addingArea, setAddingArea] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [areaLocation, setAreaLocation] = useState<AreaLocationType>('outdoor');
  const [areaSpace, setAreaSpace] = useState<string>(NO_SPACE);
  const [areaError, setAreaError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [costRows, money, plotRows, groupRows] = await Promise.all([
      listGrowingCosts(),
      loadGardenMoneyPicture(),
      listGardenPlots(),
      listGardenCostGroups(),
    ]);
    setCosts(costRows);
    setPicture(money);
    setPlots(plotRows);
    setGroups(groupRows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    setError(null);
  }, [description, kind, amount, date]);

  const groupNameOf = useMemo(() => {
    const names = new Map<string, string>();
    for (const group of groups) for (const memberId of group.memberIds) names.set(memberId, group.name);
    return names;
  }, [groups]);

  // The picker offers each group as a whole, for a cost that fed every
  // area in it, and then every area, saying which group an area is in.
  const plotOptions = useMemo(
    () => [
      { label: UNASSIGNED_AREA_NAME, value: NO_PLOT },
      ...groups.map((group) => ({ label: `${group.name} (whole group)`, value: `${GROUP_PREFIX}${group.id}` })),
      ...plots.map((plot) => {
        const inGroup = groupNameOf.get(plot.id);
        return { label: inGroup ? `${plot.name}, in ${inGroup}` : plot.name, value: plot.id };
      }),
    ],
    [groups, plots, groupNameOf],
  );

  // The cost list, grouped the way By Area is: each cost group with the
  // costs of its areas and the costs tied to the group as a whole, then
  // each area outside any group, then everything tied to none of them.
  const costGroups = useMemo(() => {
    const listed: { key: string; title: string; costs: GrowingCostRecord[] }[] = [];
    const knownGroupIds = new Set(groups.map((group) => group.id));
    for (const group of groups) {
      const own = costs.filter(
        (cost) => cost.costGroupId === group.id || (cost.plotId !== null && group.memberIds.includes(cost.plotId)),
      );
      if (own.length > 0) listed.push({ key: `${GROUP_PREFIX}${group.id}`, title: group.name, costs: own });
    }
    for (const plot of plots) {
      if (groupNameOf.has(plot.id)) continue;
      const own = costs.filter((cost) => cost.plotId === plot.id && !(cost.costGroupId && knownGroupIds.has(cost.costGroupId)));
      if (own.length > 0) listed.push({ key: plot.id, title: plot.name, costs: own });
    }
    const knownPlotIds = new Set(plots.map((plot) => plot.id));
    const untied = costs.filter(
      (cost) => !(cost.costGroupId && knownGroupIds.has(cost.costGroupId)) && (!cost.plotId || !knownPlotIds.has(cost.plotId)),
    );
    if (untied.length > 0) listed.push({ key: NO_PLOT, title: UNASSIGNED_AREA_NAME, costs: untied });
    return listed;
  }, [costs, plots, groups, groupNameOf]);

  const kindHelp = kind ? GROWING_COST_KINDS.find((entry) => entry.code === kind)?.help ?? null : null;

  async function handleSave() {
    const value = Number(amount.replace(/[^0-9.]/g, ''));
    if (!description.trim()) {
      setError('Say what it was.');
      return;
    }
    if (!kind) {
      setError('Pick what kind of cost it was.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter what it cost.');
      return;
    }
    if (!isDateString(date)) {
      setError('The date needs to be YYYY-MM-DD.');
      return;
    }
    const forGroup = plotId.startsWith(GROUP_PREFIX);
    await recordGrowingCost({
      occurredOn: date,
      amount: Math.round(value * 100) / 100,
      description: description.trim(),
      kind,
      plotId: plotId === NO_PLOT || forGroup ? null : plotId,
      costGroupId: forGroup ? plotId.slice(GROUP_PREFIX.length) : null,
    });
    setDescription('');
    setKind(null);
    setAmount('');
    setDate(todayDateString());
    setPlotId(NO_PLOT);
    setAdding(false);
    await load();
  }

  async function handleDelete(id: string) {
    await deleteGrowingCost(id);
    await load();
  }

  function startArea() {
    setAreaName('');
    setAreaLocation('outdoor');
    setAreaSpace(NO_SPACE);
    setAreaError(null);
    setAddingArea(true);
  }

  // Saves the area, picks it for the cost being entered and closes the
  // short form; the cost's other fields are not touched.
  async function handleSaveArea() {
    if (!areaName.trim()) {
      setAreaError('Give the area a name.');
      return;
    }
    const id = await createGardenPlot({
      name: areaName,
      locationType: areaLocation,
      spaceType: areaSpace === NO_SPACE ? null : (areaSpace as GardenSpaceType),
    });
    setPlots(await listGardenPlots());
    setPlotId(id);
    setAddingArea(false);
  }

  function startGroup(group: GardenCostGroup | null) {
    setGroupId(group?.id ?? null);
    setGroupName(group?.name ?? '');
    setGroupMemberIds(group?.memberIds ?? []);
    setGroupError(null);
    setGroupEditing(true);
  }

  function toggleGroupMember(id: string) {
    setGroupError(null);
    setGroupMemberIds((current) => (current.includes(id) ? current.filter((member) => member !== id) : [...current, id]));
  }

  async function handleSaveGroup() {
    if (!groupName.trim()) {
      setGroupError('Give the group a name.');
      return;
    }
    if (groupMemberIds.length < 2) {
      setGroupError('Tick at least two areas to combine.');
      return;
    }
    await saveGardenCostGroup({ id: groupId ?? undefined, name: groupName, memberIds: groupMemberIds });
    setGroupEditing(false);
    setGroupId(null);
    setGroupName('');
    setGroupMemberIds([]);
    await load();
  }

  async function handleDeleteGroup(id: string) {
    await deleteGardenCostGroup(id);
    if (groupId === id) setGroupEditing(false);
    await load();
  }

  const summary = picture?.summary ?? null;
  const areaRows: GardenAreaMoney[] = picture ? [...picture.areas, ...(picture.unassigned ? [picture.unassigned] : [])] : [];
  const byLocation = picture?.byLocation ?? [];

  function describeAreaCounts(area: GardenAreaMoney): string {
    const parts: string[] = [];
    if (area.costCount > 0) parts.push(area.costCount === 1 ? '1 cost' : `${area.costCount} costs`);
    if (area.harvestCount > 0) parts.push(area.harvestCount === 1 ? '1 harvest kept' : `${area.harvestCount} harvests kept`);
    if (area.giftCount > 0) parts.push(area.giftCount === 1 ? '1 gift' : `${area.giftCount} gifts`);
    return parts.join(', ');
  }

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[band.box, styles.card]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>What the Garden Costs and Gives Back</Text>
        {summary ? (
          <>
            <Text style={styles.moneyTotal}>{describeGardenNet(summary)}</Text>
            <Text style={styles.captionText}>
              Harvests kept for eating: {formatTradeMoney(summary.harvestsAvoided)} at prices you have recorded paying.
              {'\n'}Produce given to you: {formatTradeMoney(summary.receivedAvoided)} at the same prices.
              {'\n'}Spent on growing: {formatTradeMoney(summary.growingCosts)}, everything in the Garden &amp; growing supplies
              category of your budget.
            </Text>
            {byLocation.length > 1 ? (
              <View style={styles.rollup}>
                <Text style={styles.fieldLabel}>By where it grows</Text>
                {byLocation.map((location) => (
                  <Text key={location.locationType} style={styles.bodyText}>
                    {location.label}
                    {location.areaCount === 1 ? '' : ` (${location.areaCount} areas)`}: {describeNetShort(location.summary)}
                  </Text>
                ))}
              </View>
            ) : null}
            <Text style={styles.captionText}>
              Each area stands on its own, so a grow tent under an LED light and the beds outside each get a separate
              figure under By Area, and areas combined under Cost Groups stand together as one. The comparison is per
              area, never per crop: a bag of fertilizer feeds the whole bed, and charging it to the tomatoes would be a
              made-up split. A material bought for a compost pile counts under the area or group the pile feeds, set
              on Compost. Compost from your kitchen scraps costs nothing and is never entered here.
            </Text>
          </>
        ) : null}
      </View>

      <TabBand folds={folds} color={TAB_COLOR} id="garden:costs:areas" title="By Area" icon="grid-outline" count={areaRows.length}>
        <View style={styles.card}>
          {areaRows.length === 0 ? (
            <Text style={styles.captionText}>
              Tie a cost to an area when you add it, and that area gets a separate figure here, set against the
              harvests kept from it. An area you are not tracking costs for shows what it gave back and says no costs
              were recorded, so one grow can be tracked while another is not.
            </Text>
          ) : (
            areaRows.map((area) => {
              const setting = describeAreaSetting(area);
              const counts = describeAreaCounts(area);
              return (
                <View key={area.groupId ? `${GROUP_PREFIX}${area.groupId}` : area.areaId ?? NO_PLOT} style={styles.areaRow}>
                  <Text style={styles.bodyText}>
                    {area.name}
                    {setting ? ` · ${setting}` : ''}
                  </Text>
                  {area.members.length > 0 ? (
                    <Text style={styles.captionText}>Combined: {area.members.join(', ')}</Text>
                  ) : null}
                  <Text style={styles.moneyTotal}>{describeNetShort(area.summary)}</Text>
                  <Text style={styles.captionText}>
                    {counts}
                    {area.summary.unpricedCount > 0
                      ? `. ${area.summary.unpricedCount === 1 ? 'One' : area.summary.unpricedCount} ${area.summary.unpricedCount === 1 ? 'is' : 'are'} counted without a recorded price.`
                      : ''}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </TabBand>

      <View style={[band.box, styles.card]}>
        <Text style={[styles.cardTitle, { color: TAB_COLOR }]}>Record Money Spent on Growing</Text>
        {adding ? (
          <>
            <Text style={styles.fieldLabel}>What was it?</Text>
            <AppTextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="A bag of fertilizer, a flat of seedlings"
            />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Kind</Text>
              <PopoverSelect
                options={KIND_OPTIONS}
                selected={kind}
                onSelect={(value) => setKind(value as GrowingCostKind)}
                tabColor={TAB_COLOR}
                width={240}
                placeholder="Pick a kind"
              />
            </View>
            {kindHelp ? <Text style={styles.captionText}>{kindHelp}</Text> : null}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Cost</Text>
              <AppTextInput
                style={[styles.textInput, styles.shortInput]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Date</Text>
              <AppTextInput
                style={[styles.textInput, styles.dateInput]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
              />
              <TouchableOpacity onPress={() => setDate(todayDateString())}>
                <Text style={styles.linkText}>Today</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Area</Text>
              {plots.length > 0 ? (
                <PopoverSelect options={plotOptions} selected={plotId} onSelect={setPlotId} tabColor={TAB_COLOR} width={220} />
              ) : (
                <Text style={styles.bodyText}>No areas yet</Text>
              )}
              {addingArea ? null : (
                <TouchableOpacity onPress={startArea}>
                  <Text style={styles.linkText}>Add an area</Text>
                </TouchableOpacity>
              )}
            </View>
            {addingArea ? (
              <View style={styles.nestedForm}>
                <Text style={styles.fieldLabel}>New area</Text>
                <AppTextInput style={styles.textInput} value={areaName} onChangeText={setAreaName} placeholder="Backyard raised bed" />
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Where</Text>
                  <PopoverSelect options={LOCATION_OPTIONS} selected={areaLocation} onSelect={(value) => setAreaLocation(value as AreaLocationType)} tabColor={TAB_COLOR} />
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Space</Text>
                  <PopoverSelect options={SPACE_OPTIONS} selected={areaSpace} onSelect={setAreaSpace} tabColor={TAB_COLOR} width={220} />
                </View>
                <Text style={styles.captionText}>
                  Saving picks this area for the cost you are entering. Size, sunlight and zone can be filled in under Plots &amp; Plantings whenever you like.
                </Text>
                {areaError ? <Text style={styles.errorText}>{areaError}</Text> : null}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleSaveArea}>
                    <Text style={styles.primaryButtonText}>Save Area</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAddingArea(false)}>
                    <Text style={styles.linkText}>Back to the cost</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.captionText}>
                {plots.length > 0
                  ? 'A cost tied to an area is set against the harvests kept from that area, so an indoor grow and the beds outside each get a separate figure. Pick a whole group for a cost that fed every area in it.'
                  : 'Add an area here to keep one grow\'s costs apart from another; the cost you are entering waits for you.'}
              </Text>
            )}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleSave}>
                <Text style={styles.primaryButtonText}>Save Cost</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAdding(false)}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.captionText}>
              Seeds, soil, fertilizer, water, tools, anything bought to grow food. It goes into your budget under Garden
              &amp; growing supplies and is set against what the garden gives back.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
              onPress={() => setAdding(true)}
            >
              <Text style={styles.primaryButtonText}>+ Add a Cost</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TabBand folds={folds} color={TAB_COLOR} id="garden:costs:groups" title="Cost Groups" icon="albums-outline" count={groups.length}>
        <View style={styles.card}>
          <Text style={styles.captionText}>
            Combine areas that are grown the same way, or that you want to see as one, and the group stands as one
            figure under By Area. An area belongs to one group at most, so nothing is counted twice. Deleting a group
            keeps its areas and its costs.
          </Text>
          {groups.map((group) => (
            <View key={group.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.bodyText}>{group.name}</Text>
                <Text style={styles.captionText}>
                  {group.memberNames.length > 0 ? group.memberNames.join(', ') : 'No areas in it yet'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => startGroup(group)}>
                <Text style={styles.linkText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteGroup(group.id)}>
                <Text style={[styles.linkText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
          {groupEditing ? (
            <>
              <Text style={styles.fieldLabel}>Group name</Text>
              <AppTextInput
                style={styles.textInput}
                value={groupName}
                onChangeText={(value) => {
                  setGroupName(value);
                  setGroupError(null);
                }}
                placeholder="The back beds, Everything under lights"
              />
              <Text style={styles.fieldLabel}>Areas in it</Text>
              {plots.map((plot) => {
                const ticked = groupMemberIds.includes(plot.id);
                const elsewhere = groupNameOf.get(plot.id);
                const movesFrom = elsewhere && (groupId === null || groups.find((g) => g.id === groupId)?.name !== elsewhere);
                return (
                  <TouchableOpacity key={plot.id} style={styles.checkRow} onPress={() => toggleGroupMember(plot.id)}>
                    <Ionicons name={ticked ? 'checkbox' : 'square-outline'} size={20} color={ticked ? TAB_COLOR : colors.textSecondary} />
                    <Text style={styles.checkLabel}>
                      {plot.name} · {describeAreaSetting(plot)}
                      {movesFrom ? ` (now in ${elsewhere}; ticking it moves it here)` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {groupError ? <Text style={styles.errorText}>{groupError}</Text> : null}
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleSaveGroup}>
                  <Text style={styles.primaryButtonText}>Save Group</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setGroupEditing(false)}>
                  <Text style={styles.linkText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : plots.length < 2 ? (
            <Text style={styles.captionText}>Add at least two areas under Plots &amp; Plantings before combining them.</Text>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]}
              onPress={() => startGroup(null)}
            >
              <Text style={styles.primaryButtonText}>+ Combine Areas</Text>
            </TouchableOpacity>
          )}
        </View>
      </TabBand>

      <TabBand folds={folds} color={TAB_COLOR} id="garden:costs:list" title="Growing Costs" icon="wallet-outline" count={costs.length}>
        <View style={styles.card}>
          {costs.length === 0 ? (
            <Text style={styles.captionText}>Nothing recorded yet.</Text>
          ) : (
            costGroups.map((group) => (
              <View key={group.key} style={styles.costGroup}>
                <Text style={styles.fieldLabel}>{group.title}</Text>
                {group.costs.map((cost) => (
                  <View key={cost.id} style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.bodyText}>
                        {formatTradeMoney(cost.amount)}
                        {cost.description ? `, ${cost.description}` : ''}
                      </Text>
                      <Text style={styles.captionText}>
                        {cost.occurredOn}
                        {cost.kind ? ` · ${growingCostKindLabel(cost.kind)}` : ' · Entered in Finances'}
                        {cost.costGroupName ? ' · Whole group' : cost.plotName && group.key.startsWith(GROUP_PREFIX) ? ` · ${cost.plotName}` : ''}
                        {cost.compostPileName ? ` · ${cost.compostPileName}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(cost.id)}>
                      <Text style={[styles.linkText, { color: colors.danger }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
          <Text style={styles.captionText}>
            Deleting a cost here removes it from your budget too, since it is the same entry.
          </Text>
        </View>
      </TabBand>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: 32, gap: HOME_BAND_GAP },
  card: { gap: 8 },
  cardTitle: { ...typography.sectionTitle, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  moneyTotal: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rollup: { gap: 2, marginTop: 4 },
  areaRow: { gap: 2, paddingVertical: 4 },
  costGroup: { gap: 6, marginTop: 4 },
  rowText: { flex: 1, gap: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  checkLabel: { ...typography.body, color: colors.textPrimary, ...textShadow, flex: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  nestedForm: { gap: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR, marginVertical: 4 },
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
