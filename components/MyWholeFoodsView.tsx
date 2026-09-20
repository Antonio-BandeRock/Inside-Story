import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { listHarvestsKeptOnHand, setGardenHarvestOnHand, type GardenHarvest } from '../lib/db';
import {
  formatQuantity,
  formatTradeMoney,
  harvestUnitForPricing,
  perUnit,
  valueReceivedGoods,
  type RecordedPrice,
  type ValuationResult,
} from '../lib/harvestTrade';
import { getLastPaidPrices } from '../lib/harvestTradeDb';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';

// My Whole Foods: what the person has on hand from their own garden.
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

export function MyWholeFoodsView({ onClose, onChanged }: { onClose: () => void; onChanged?: () => void }) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [harvests, setHarvests] = useState<GardenHarvest[] | null>(null);
  const [lastPaid, setLastPaid] = useState<Record<string, RecordedPrice>>({});

  const load = useCallback(async () => {
    const [rows, prices] = await Promise.all([listHarvestsKeptOnHand(), getLastPaidPrices()]);
    setHarvests(rows);
    setLastPaid(prices);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  // Every harvest kept as food, whole, whether or not it has been eaten
  // yet: the money was not spent on the day it was picked.
  const valuation: ValuationResult | null = useMemo(() => {
    if (!harvests || harvests.length === 0) return null;
    return valueReceivedGoods(
      harvests.map((harvest) => ({
        foodName: harvest.foodName,
        quantity: harvest.quantity,
        unit: harvestUnitForPricing(harvest.unit),
      })),
      lastPaid,
    );
  }, [harvests, lastPaid]);

  async function takeOffList(harvest: GardenHarvest) {
    await setGardenHarvestOnHand(harvest.id, false);
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

        {valuation ? (
          <HomeSectionBand
            kind="static"
            title="Money Not Spent"
            icon="wallet-outline"
            color={colors.tabFood}
            contentStyle={styles.bandBody}
          >
            <Text style={styles.intro}>
              {harvests && harvests.length === 1
                ? `One harvest kept for eating, on ${harvests[0].harvestedAt.slice(0, 10)}.`
                : `${harvests?.length ?? 0} harvests kept for eating since ${harvests?.[0]?.harvestedAt.slice(0, 10) ?? ''}.`}{' '}
              A harvest is priced only at what you have recorded paying for that food on a grocery list, in the same
              unit. Anything else is counted and not priced, because a guessed price would be a made-up saving.
            </Text>
            {valuation.valued.length > 0 ? (
              <View style={styles.moneyCard}>
                <Text style={styles.moneyTotal}>{formatTradeMoney(valuation.avoidedCost)} you did not have to spend</Text>
                {valuation.valued.map((entry, index) => (
                  <Text key={`${entry.foodName}-${index}`} style={styles.rowMeta}>
                    {formatQuantity(entry.quantity, entry.unit)} of {entry.foodName} at the {formatTradeMoney(entry.pricePaid)}{' '}
                    {perUnit(entry.unit)} you paid on {entry.pricedOn}
                  </Text>
                ))}
                <Text style={styles.rowMeta}>Money you kept, not money you earned, so it stays out of your income.</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>
                Nothing priced yet. Record what you pay for a food on a grocery list, and the next harvest of it is
                valued at that price.
              </Text>
            )}
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
