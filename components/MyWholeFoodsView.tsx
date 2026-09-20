import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { setGardenHarvestOnHand, type GardenHarvest } from '../lib/db';
import { describeGardenNet, describeNetShort, RECEIVED_SHARE_UNITS } from '../lib/gardenMoney';
import {
  deleteReceivedShare,
  loadGardenMoneyPicture,
  recordReceivedShare,
  type GardenMoneyPicture,
  type ReceivedShareRecord,
} from '../lib/gardenMoneyDb';
import { formatQuantity, formatTradeMoney, perUnit, type ValuationResult } from '../lib/harvestTrade';
import { listPurchasableFoods, type PurchasableFood } from '../lib/kitchenDb';
import { AppTextInput } from './AppTextInput';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';
import { PopoverSelect } from './PopoverSelect';

// My Whole Foods: what the person has on hand from their own garden, and
// from other people's.
//
// 2026-09-20, direct instruction: "I agree that this list should come from
// harvesting food grown in the garden, but it should not go to Garden >
// Harvest Log. If nothing has been harvested, this list should just be
// empty, but it should let the user know that anything they harvest from
// the garden and enter it into the garden harvest log will show up here
// and be drawn from for food they add to their meal schedule."
//
// Until today the tile on the Food tab pushed straight into Garden's
// Harvest Log, so there was no list here at all. Now it is a lens of its
// own, reading the same garden_harvests rows the "From Your Harvest"
// picker in every Food builder reads, filtered to the ones the person said
// to keep when they logged them (garden_harvests.on_hand). The Harvest Log
// stays where harvests are entered; this is where they are food.
//
// The second half of the same instruction: "their harvest will be related
// to money not spent on food, or in essence money saved from not having to
// buy that food." Valued the one way this app already values food it did
// not buy (see lib/harvestTrade.ts): at a price this person has recorded
// paying for that food, in the same unit, and otherwise counted rather than
// priced. Never a guessed market price, and never income.
//
// Later the same day, two more things on the same page. "The Garden
// harvest should also take into account all money spent to grow the food,"
// so Money Not Spent is now the net of what the garden gave back and what
// was spent growing it, read from lib/gardenMoneyDb.ts so this page and
// Growing Costs on Garden show the same figure. And "do we track when
// someone else gives the user a share from their garden harvest?" had the
// answer no, and now yes: From Other Gardens. Produce given to you lands in
// the kitchen with source 'gift' and counts toward money not spent under
// the same recorded-price rule, since it was not bought either.

const QUANTITY_OPTIONS = ['0.25', '0.5', '1', '1.5', '2', '3', '4', '5', '6', '8', '10', '12', '15', '20'];
const UNIT_OPTIONS = [...RECEIVED_SHARE_UNITS];

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function MyWholeFoodsView({ onClose, onChanged }: { onClose: () => void; onChanged?: () => void }) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [picture, setPicture] = useState<GardenMoneyPicture | null>(null);
  const [foods, setFoods] = useState<PurchasableFood[]>([]);
  const [addingGift, setAddingGift] = useState(false);
  const [giftFrom, setGiftFrom] = useState('');
  const [giftFoodIndex, setGiftFoodIndex] = useState<string | null>(null);
  const [giftQuantity, setGiftQuantity] = useState<string | null>(null);
  const [giftUnit, setGiftUnit] = useState<string | null>(null);
  const [giftDate, setGiftDate] = useState(todayDateString());
  const [giftError, setGiftError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [money, foodRows] = await Promise.all([loadGardenMoneyPicture(), listPurchasableFoods()]);
    setPicture(money);
    setFoods(foodRows);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setGiftError(null);
  }, [giftFrom, giftFoodIndex, giftQuantity, giftUnit, giftDate]);

  const harvests = picture?.harvests ?? null;
  const shares = useMemo(() => picture?.shares ?? [], [picture]);

  // Newest first for reading; the query is oldest first so the money band
  // can name when the first harvest was.
  const onHand = useMemo(
    () => (harvests ?? []).filter((harvest) => harvest.quantityRemaining > 0).slice().reverse(),
    [harvests],
  );
  const usedUp = useMemo(
    () => (harvests ?? []).filter((harvest) => harvest.quantityRemaining <= 0).slice().reverse(),
    [harvests],
  );
  const sharesNewestFirst = useMemo(() => shares.slice().reverse(), [shares]);

  const foodOptions = useMemo(
    () => foods.map((food, index) => ({ label: food.baseName, value: String(index) })),
    [foods],
  );

  const hasAnything = (harvests?.length ?? 0) > 0 || shares.length > 0;

  async function takeOffList(harvest: GardenHarvest) {
    await setGardenHarvestOnHand(harvest.id, false);
    await load();
    onChanged?.();
  }

  async function saveGift() {
    const food = giftFoodIndex === null ? null : foods[Number(giftFoodIndex)];
    if (!food) {
      setGiftError('Pick the food.');
      return;
    }
    if (!giftQuantity || !giftUnit) {
      setGiftError('Say how much.');
      return;
    }
    if (!isDateString(giftDate)) {
      setGiftError('The date needs to be YYYY-MM-DD.');
      return;
    }
    await recordReceivedShare({
      receivedOn: giftDate,
      fromWhom: giftFrom,
      foodName: food.baseName,
      quantity: Number(giftQuantity),
      unit: giftUnit,
      category: food.category,
    });
    setGiftFrom('');
    setGiftFoodIndex(null);
    setGiftQuantity(null);
    setGiftUnit(null);
    setGiftDate(todayDateString());
    setAddingGift(false);
    await load();
    onChanged?.();
  }

  async function removeGiftRecord(share: ReceivedShareRecord) {
    await deleteReceivedShare(share.id);
    await load();
    onChanged?.();
  }

  function renderHarvestRow(harvest: GardenHarvest, showRemaining: boolean) {
    return (
      <View key={harvest.id} style={styles.itemRow}>
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {harvest.foodName}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={2}>
            {showRemaining
              ? `${formatQuantity(harvest.quantityRemaining, harvest.unit)} of ${formatQuantity(harvest.quantity, harvest.unit)} left, harvested ${harvest.harvestedAt.slice(0, 10)}`
              : `${formatQuantity(harvest.quantity, harvest.unit)}, harvested ${harvest.harvestedAt.slice(0, 10)}, all used`}
          </Text>
        </View>
        {showRemaining ? (
          <TouchableOpacity onPress={() => takeOffList(harvest)} activeOpacity={0.7} style={styles.rowAction}>
            <Text style={styles.rowActionText}>Not on hand</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  function renderValuedLines(valuation: ValuationResult, what: string) {
    if (valuation.valued.length === 0 && valuation.unvalued.length === 0) return null;
    return (
      <>
        {valuation.valued.map((entry, index) => (
          <Text key={`${what}-${entry.foodName}-${index}`} style={styles.rowMeta}>
            {formatQuantity(entry.quantity, entry.unit)} of {entry.foodName} at the {formatTradeMoney(entry.pricePaid)}{' '}
            {perUnit(entry.unit)} you paid on {entry.pricedOn}
          </Text>
        ))}
        {valuation.unvalued.length > 0 ? (
          <Text style={styles.rowMeta}>
            Counted, not priced:{' '}
            {valuation.unvalued
              .map(
                (entry) =>
                  `${formatQuantity(entry.quantity, entry.unit)} of ${entry.foodName}${entry.reason === 'differentUnit' ? ' (last priced in a different unit)' : ''}`,
              )
              .join('; ')}
            .
          </Text>
        ) : null}
      </>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.backLink}>‹ Back</Text>
        </TouchableOpacity>

        <HomeSectionBand
          kind="static"
          title="On Hand from Your Garden"
          icon="leaf-outline"
          color={colors.tabFood}
          contentStyle={styles.bandBody}
        >
          {harvests === null ? null : onHand.length === 0 ? (
            <>
              <Text style={styles.emptyText}>Nothing on hand yet.</Text>
              <Text style={styles.intro}>
                Anything you harvest from the garden and enter in the Harvest Log on the Garden tab shows up here,
                and is drawn from when you add that food to a meal in your schedule. Each time you log a harvest,
                the app asks whether to keep it on hand as one of your home-grown whole foods.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.intro}>
                Home-grown and still on hand. Every Food builder offers these first, under From Your Harvest, and
                what you cook with is taken off the amount left here.
              </Text>
              {onHand.map((harvest) => renderHarvestRow(harvest, true))}
            </>
          )}
        </HomeSectionBand>

        <HomeSectionBand
          kind="static"
          title="From Other Gardens"
          icon="people-outline"
          color={colors.tabFood}
          contentStyle={styles.bandBody}
        >
          {picture === null ? null : (
            <>
              <Text style={styles.intro}>
                Produce somebody gave you from their garden. It goes into your kitchen as given to you, so every Food
                tool sees it, and it counts as money not spent the same way your harvest does.
              </Text>
              {sharesNewestFirst.length === 0 ? <Text style={styles.emptyText}>Nothing given to you yet.</Text> : null}
              {sharesNewestFirst.map((share) => (
                <View key={share.id} style={styles.itemRow}>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {share.foodName}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={2}>
                      {formatQuantity(share.quantity, share.unit)}
                      {share.fromWhom ? ` from ${share.fromWhom}` : ''}, {share.receivedOn},{' '}
                      {share.quantityRemaining === null || share.quantityRemaining <= 0
                        ? 'all used'
                        : `${formatQuantity(share.quantityRemaining, share.unit)} left`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeGiftRecord(share)} activeOpacity={0.7} style={styles.rowAction}>
                    <Text style={styles.rowActionText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {addingGift ? (
                <View style={styles.formCard}>
                  <Text style={styles.fieldLabel}>Who gave it to you</Text>
                  <AppTextInput style={styles.textInput} value={giftFrom} onChangeText={setGiftFrom} placeholder="A neighbour, a friend" />
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Food</Text>
                    <PopoverSelect
                      options={foodOptions}
                      selected={giftFoodIndex}
                      onSelect={setGiftFoodIndex}
                      tabColor={colors.tabFood}
                      placeholder="Pick a food"
                      searchable
                      width={240}
                    />
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>How much</Text>
                    <PopoverSelect
                      options={QUANTITY_OPTIONS}
                      selected={giftQuantity}
                      onSelect={setGiftQuantity}
                      tabColor={colors.tabFood}
                      placeholder="Amount"
                    />
                    <PopoverSelect options={UNIT_OPTIONS} selected={giftUnit} onSelect={setGiftUnit} tabColor={colors.tabFood} placeholder="Unit" />
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Date</Text>
                    <AppTextInput style={[styles.textInput, styles.dateInput]} value={giftDate} onChangeText={setGiftDate} placeholder="YYYY-MM-DD" />
                    <TouchableOpacity onPress={() => setGiftDate(todayDateString())}>
                      <Text style={styles.linkText}>Today</Text>
                    </TouchableOpacity>
                  </View>
                  {giftError ? <Text style={styles.errorText}>{giftError}</Text> : null}
                  <View style={styles.fieldRow}>
                    <TouchableOpacity onPress={saveGift} activeOpacity={0.7} style={styles.primaryAction}>
                      <Text style={styles.primaryActionText}>Add It</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setAddingGift(false)}>
                      <Text style={styles.linkText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setAddingGift(true)} activeOpacity={0.7} style={styles.primaryAction}>
                  <Text style={styles.primaryActionText}>+ Someone Gave You Produce</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.rowMeta}>
                Removing a record here leaves the food in your kitchen. Take it out of Kitchen on Life if it is gone.
              </Text>
            </>
          )}
        </HomeSectionBand>

        {picture && hasAnything ? (
          <HomeSectionBand
            kind="static"
            title="Money Not Spent"
            icon="wallet-outline"
            color={colors.tabFood}
            contentStyle={styles.bandBody}
          >
            <Text style={styles.intro}>
              {harvests && harvests.length === 1
                ? `One harvest kept for eating, on ${harvests[0].harvestedAt.slice(0, 10)}`
                : `${harvests?.length ?? 0} harvests kept for eating${harvests && harvests.length > 0 ? ` since ${harvests[0].harvestedAt.slice(0, 10)}` : ''}`}
              {shares.length === 1 ? ', and one thing given to you.' : shares.length > 1 ? `, and ${shares.length} things given to you.` : '.'}{' '}
              Each is priced only at what you have recorded paying for that food on a grocery list, in the same unit.
              Anything else is counted and not priced, because a guessed price would be a made-up saving.
            </Text>
            <View style={styles.moneyCard}>
              <Text style={styles.moneyTotal}>{describeGardenNet(picture.summary)}</Text>
              <Text style={styles.rowMeta}>
                Your harvests: {formatTradeMoney(picture.summary.harvestsAvoided)}.{' '}
                Given to you: {formatTradeMoney(picture.summary.receivedAvoided)}.{' '}
                Spent on growing: {formatTradeMoney(picture.summary.growingCosts)}, recorded under Growing Costs on the Garden tab
                or as Garden &amp; growing supplies in your budget.
              </Text>
              {picture.areas.length > 0 ? (
                <Text style={styles.rowMeta}>
                  By area: {picture.areas.map((area) => `${area.name} ${describeNetShort(area.summary)}`).join('; ')}
                  {picture.unassigned ? `; not tied to one area ${describeNetShort(picture.unassigned.summary)}` : ''}.
                </Text>
              ) : null}
              {renderValuedLines(picture.harvestValuation, 'harvest')}
              {renderValuedLines(picture.shareValuation, 'gift')}
              {picture.harvestValuation.valued.length === 0 && picture.shareValuation.valued.length === 0 ? (
                <Text style={styles.rowMeta}>
                  Nothing priced yet. Record what you pay for a food on a grocery list, and the next harvest or gift of it is
                  valued at that price.
                </Text>
              ) : null}
              <Text style={styles.rowMeta}>This is money you kept, so it stays out of your income.</Text>
            </View>
          </HomeSectionBand>
        ) : null}

        {usedUp.length > 0 ? (
          <HomeSectionBand
            kind="static"
            title="Used Up"
            icon="checkmark-done-outline"
            color={colors.tabFood}
            contentStyle={styles.bandBody}
          >
            {usedUp.map((harvest) => renderHarvestRow(harvest, false))}
          </HomeSectionBand>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // No fill: the Food background shows through, as it does behind every
  // other lens on this tab.
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
  intro: {
    ...typography.caption,
    color: colors.textSecondary,
    ...textShadow,
  },
  emptyText: {
    ...typography.body,
    color: colors.textPrimary,
    ...textShadow,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    paddingLeft: 12,
    paddingVertical: 12,
  },
  rowTextWrap: { flex: 1, marginRight: 12 },
  rowTitle: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    ...textShadow,
  },
  rowMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    ...textShadow,
  },
  rowAction: {
    marginRight: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  rowActionText: {
    ...typography.caption,
    color: colors.textPrimary,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
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
  formCard: {
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    gap: 8,
  },
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
  dateInput: { width: 140 },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
  moneyCard: {
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    gap: 4,
  },
  moneyTotal: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    ...textShadow,
  },
});
