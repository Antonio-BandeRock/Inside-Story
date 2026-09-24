// The reads and the one write behind lib/plateSource.ts.
//
// Kept apart from that module so every figure and every sentence there can be
// checked by scripts/test_plate_source.js without a phone, the same split the
// rest of this push uses.
//
// Nothing here recomputes anything. garden_harvests.quantity_remaining stays
// the authoritative amount on hand and recordHarvestUsage stays the one place
// that changes it; harvest_uses is the history beside it, written in the same
// call so the two cannot drift.

import { getDatabase, getMeal, getMealItems, recordHarvestUsage } from './db';
import { buildMonths } from './harvestYield';
import { getLastPaidPrices } from './harvestTradeDb';
import {
  buildPlateOffers,
  summarizePlateValue,
  planPlateUses,
  type OnHandHarvest,
  type PlateOffer,
  type PlateUse,
  type PlateValueBand,
} from './plateSource';

/** Pickings with something left on them, oldest first, with the area they
 *  came from where the plot is still there. A picking whose area was removed
 *  keeps its amount and reads as coming from no area, which is how every
 *  other harvest read in this app already treats it. */
export async function listOnHandHarvests(): Promise<OnHandHarvest[]> {
  const db = await getDatabase();
  return db.getAllAsync<OnHandHarvest>(
    `
      SELECT h.id AS id,
             h.food_id AS foodId,
             h.source AS source,
             h.food_name AS foodName,
             h.harvested_at AS harvestedOn,
             h.unit AS unit,
             h.quantity_remaining AS quantityRemaining,
             p.name AS plotName
      FROM garden_harvests h
      LEFT JOIN garden_plots p ON p.id = h.plot_id
      WHERE h.quantity_remaining > 0 AND h.on_hand = 1
      ORDER BY h.harvested_at ASC
    `,
  );
}

export type PlateOfferForMeal = {
  mealId: string;
  mealName: string;
  /** The local day the meal was eaten, off meals.eaten_at. */
  usedOn: string;
  offers: PlateOffer[];
};

/**
 * What a meal that was just saved could have taken from the garden.
 *
 * Returns an empty offer list rather than null when nothing matches, so a
 * caller with no garden takes the same path as one with a garden and no
 * matching picking.
 */
export async function getPlateOfferForMeal(mealId: string): Promise<PlateOfferForMeal | null> {
  const meal = await getMeal(mealId);
  if (!meal) return null;

  const [items, harvests] = await Promise.all([getMealItems(mealId), listOnHandHarvests()]);
  if (harvests.length === 0) {
    return { mealId, mealName: meal.name, usedOn: meal.eaten_at.slice(0, 10), offers: [] };
  }

  const offers = buildPlateOffers(
    items.map((item) => ({
      foodId: item.foodId,
      foodName: item.foodName,
      // serving_size / serving_unit is what the builders write the amount
      // into; meal_items.quantity is always 1.
      amount: item.servingSize,
      unit: item.servingUnit,
    })),
    harvests,
  );

  return { mealId, mealName: meal.name, usedOn: meal.eaten_at.slice(0, 10), offers };
}

/**
 * Write down that these pickings fed this meal, and take the amounts off what
 * is on hand.
 *
 * One row per offer, including an offer whose amount could not be told, since
 * the garden fed somebody either way. Only an offer carrying an amount in the
 * picking's own unit reaches recordHarvestUsage.
 */
export async function keepPlateUses(mealId: string | null, offers: PlateOffer[], usedOn: string): Promise<void> {
  if (offers.length === 0) return;
  const db = await getDatabase();
  const drafts = planPlateUses(offers, mealId, usedOn);
  const now = new Date().toISOString();

  for (const [index, draft] of drafts.entries()) {
    await db.runAsync(
      `
        INSERT INTO harvest_uses
          (id, harvest_id, meal_id, food_id, source, food_name, quantity_used, unit, used_on, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      `harvest_use_${Date.now()}_${index}`,
      draft.harvestId,
      draft.mealId,
      draft.foodId,
      draft.source,
      draft.foodName,
      draft.quantityUsed,
      draft.unit,
      draft.usedOn,
      now,
    );
    if (draft.drawsDown) await recordHarvestUsage(draft.harvestId, draft.quantityUsed);
  }
}

/** Every picking marked onto a plate inside a range. used_on is a plain local
 *  date, so the window needs none of the UTC widening lib/keepingUpDb.ts does. */
export async function getPlateUses(startDate: string, endDate: string): Promise<PlateUse[]> {
  const db = await getDatabase();
  return db.getAllAsync<PlateUse>(
    `
      SELECT id, harvest_id AS harvestId, food_name AS foodName,
             quantity_used AS quantityUsed, unit, used_on AS usedOn
      FROM harvest_uses
      WHERE used_on >= ? AND used_on <= ?
      ORDER BY used_on ASC
    `,
    startDate,
    endDate,
  );
}

/** The band on Trends > What It Costs: what the garden put on the plate would
 *  have cost at prices this person has recorded paying. */
export async function getPlateValueBand(startDate: string, endDate: string): Promise<PlateValueBand> {
  const [uses, lastPaid] = await Promise.all([getPlateUses(startDate, endDate), getLastPaidPrices()]);
  return summarizePlateValue({ startDate, endDate, uses, lastPaid }, buildMonths(startDate, endDate));
}
