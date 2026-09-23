// The reads behind Trends > Garden Yield.
//
// Everything that decides anything lives in lib/harvestYield.ts, which
// imports only pure helpers and is covered by scripts/test_harvest_yield.js.
// This file fetches and nothing else.
//
// Phase 4 needed no new table, which is the difference between this lens and
// Trends > Keeping Up. Every source already keeps its whole history:
// garden_harvests holds each picking, garden_plantings holds when something
// went in and when it was expected to be ready, compost_events holds what went
// into a pile and what came out, and harvest_dispositions and
// harvest_shares_received hold what went out and what came back.
//
// It also needed none of the local-day machinery Keeping Up carries.
// harvested_at, planted_at, occurred_on and received_on are all written as
// plain local dates through todayDateString(), so a ten-character comparison
// is the day the person was living in. Nothing here goes through a Date.

import { getDatabase, getStoredMeasurementSystem } from './db';
import { harvestUnitForPricing, valueReceivedGoods } from './harvestTrade';
import type { DispositionKind, DispositionRecord, ReceivedGood } from './harvestTrade';
import { getLastPaidPrices } from './harvestTradeDb';
import {
  buildMonths,
  describeGardenYieldHome,
  summarizeHarvestYield,
} from './harvestYield';
import type {
  CompostMovement,
  CompostPileStanding,
  GardenYieldHomeSummary,
  HarvestRecord,
  HarvestYieldInputs,
  HarvestYieldSummary,
  MeasureSystem,
  PlantingTiming,
  ReceivedShare,
} from './harvestYield';

/** A picking with its area's name resolved, since the area is what somebody
 *  recognises and the id is not. A harvest that lost its area (the plot was
 *  removed, so the foreign key went to null) keeps its weight and is counted
 *  under no area, which band 1 says out loud. */
async function readHarvests(startDate: string, endDate: string): Promise<HarvestRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<HarvestRecord>(
    `
      SELECT h.id AS id,
             h.harvested_at AS harvestedOn,
             h.food_name AS foodName,
             h.quantity AS quantity,
             h.unit AS unit,
             p.name AS plotName,
             h.planting_id AS plantingId
      FROM garden_harvests h
      LEFT JOIN garden_plots p ON p.id = h.plot_id
      WHERE h.harvested_at >= ? AND h.harvested_at <= ?
      ORDER BY h.harvested_at
    `,
    startDate,
    endDate,
  );
}

/** Plantings whose story falls inside the range: one picked in it, or one
 *  still growing that was expected to be ready by now. The first picking is
 *  taken as the MIN over every harvest against that planting rather than the
 *  first one inside the range, because a crop that started in May and is
 *  still being picked in September took its growing time from May. */
async function readPlantings(startDate: string, endDate: string): Promise<PlantingTiming[]> {
  const db = await getDatabase();
  return db.getAllAsync<PlantingTiming>(
    `
      SELECT g.id AS id,
             g.food_name AS foodName,
             p.name AS plotName,
             g.planted_at AS plantedOn,
             g.expected_harvest_start AS expectedHarvestStart,
             g.status AS status,
             (SELECT MIN(h.harvested_at) FROM garden_harvests h WHERE h.planting_id = g.id) AS firstHarvestOn
      FROM garden_plantings g
      LEFT JOIN garden_plots p ON p.id = g.plot_id
      WHERE g.planted_at <= ?
      ORDER BY g.planted_at
    `,
    endDate,
  ).then((rows) =>
    rows.filter((row) => {
      if (row.firstHarvestOn) return row.firstHarvestOn >= startDate && row.firstHarvestOn <= endDate;
      return row.status === 'growing' && row.expectedHarvestStart != null && row.expectedHarvestStart >= startDate;
    }),
  );
}

async function readCompostEvents(startDate: string, endDate: string): Promise<CompostMovement[]> {
  const db = await getDatabase();
  return db.getAllAsync<CompostMovement>(
    `
      SELECT e.occurred_on AS occurredOn,
             e.kind AS kind,
             e.material_class AS materialClass,
             e.amount AS amount,
             COALESCE(e.unit, '') AS unit,
             p.name AS plotName
      FROM compost_events e
      LEFT JOIN garden_plots p ON p.id = e.plot_id
      WHERE e.occurred_on >= ? AND e.occurred_on <= ?
      ORDER BY e.occurred_on
    `,
    startDate,
    endDate,
  );
}

/** Piles as they stand today rather than over the range, since a pile is a
 *  thing in the garden right now and not an event. */
async function readCompostPiles(): Promise<CompostPileStanding> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ status: string; count: number }>(
    'SELECT status, COUNT(*) AS count FROM compost_piles GROUP BY status',
  );
  const standing: CompostPileStanding = { active: 0, curing: 0, finished: 0 };
  for (const row of rows) {
    if (row.status === 'active') standing.active = row.count;
    else if (row.status === 'curing') standing.curing = row.count;
    else if (row.status === 'finished') standing.finished = row.count;
  }
  return standing;
}

/** listDispositions reads by a count rather than by a range, since the Garden
 *  screen shows a recent few. A timeline needs the range, so this asks for
 *  the same shape over dates instead of reaching for a bigger limit. */
async function readDispositions(startDate: string, endDate: string): Promise<DispositionRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    occurredOn: string;
    kind: string;
    foodName: string;
    quantityGiven: number;
    unit: string;
    withWhom: string | null;
    amount: number | null;
    recipientKind: string | null;
    receiptGiven: number;
  }>(
    `
      SELECT id, occurred_on AS occurredOn, kind, food_name AS foodName,
             quantity_given AS quantityGiven, unit, with_whom AS withWhom, amount,
             recipient_kind AS recipientKind, receipt_given AS receiptGiven
      FROM harvest_dispositions
      WHERE occurred_on >= ? AND occurred_on <= ?
      ORDER BY occurred_on
    `,
    startDate,
    endDate,
  );
  if (rows.length === 0) return [];

  const receiptRows = await db.getAllAsync<{
    dispositionId: string;
    foodName: string;
    quantity: number;
    unit: string;
    category: string;
    foodId: string | null;
  }>(
    `
      SELECT disposition_id AS dispositionId, food_name AS foodName, quantity, unit, category, food_id AS foodId
      FROM harvest_disposition_receipts
      ORDER BY rowid
    `,
  );
  const byDisposition: Record<string, ReceivedGood[]> = {};
  for (const row of receiptRows) {
    (byDisposition[row.dispositionId] ??= []).push({
      foodName: row.foodName,
      quantity: row.quantity,
      unit: row.unit,
      category: row.category,
      foodId: row.foodId,
    });
  }

  return rows.map((row) => ({
    id: row.id,
    occurredOn: row.occurredOn,
    kind: row.kind as DispositionKind,
    foodName: row.foodName,
    quantityGiven: row.quantityGiven,
    unit: row.unit,
    withWhom: row.withWhom,
    amount: row.amount,
    received: byDisposition[row.id] ?? [],
    recipientKind: (row.recipientKind as DispositionRecord['recipientKind']) ?? null,
    receiptGiven: row.receiptGiven === 1,
  }));
}

async function readShares(startDate: string, endDate: string): Promise<ReceivedShare[]> {
  const db = await getDatabase();
  return db.getAllAsync<ReceivedShare>(
    `
      SELECT received_on AS receivedOn, from_whom AS fromWhom, food_name AS foodName, quantity, unit
      FROM harvest_shares_received
      WHERE received_on >= ? AND received_on <= ?
      ORDER BY received_on
    `,
    startDate,
    endDate,
  );
}

export async function getHarvestYieldInputs(
  startDate: string,
  endDate: string,
  system: MeasureSystem,
): Promise<HarvestYieldInputs> {
  const [harvests, plantings, compostEvents, compostPiles, dispositions, shares] = await Promise.all([
    readHarvests(startDate, endDate),
    readPlantings(startDate, endDate),
    readCompostEvents(startDate, endDate),
    readCompostPiles(),
    readDispositions(startDate, endDate),
    readShares(startDate, endDate),
  ]);
  return { startDate, endDate, system, harvests, plantings, compostEvents, compostPiles, dispositions, shares };
}

export async function getHarvestYieldSummary(
  startDate: string,
  endDate: string,
  system: MeasureSystem,
): Promise<HarvestYieldSummary> {
  return summarizeHarvestYield(await getHarvestYieldInputs(startDate, endDate, system));
}

/** The earliest date anything in the garden was recorded, which is what the
 *  Everything range resolves to. Null where the garden is empty, and the
 *  caller falls back to a year. */
/** The same pickings Trends > Garden Yield counts, handed to Trends > What
 *  It Costs so it can set growing money against them. One query, one place,
 *  so the two lenses can never disagree about what was picked. */
export async function getHarvestsForRange(startDate: string, endDate: string): Promise<HarvestRecord[]> {
  return readHarvests(startDate, endDate);
}

export async function getEarliestGardenDate(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ earliest: string | null }>(
    `
      SELECT MIN(earliest) AS earliest FROM (
        SELECT MIN(harvested_at) AS earliest FROM garden_harvests
        UNION ALL SELECT MIN(planted_at) FROM garden_plantings
        UNION ALL SELECT MIN(occurred_on) FROM compost_events
        UNION ALL SELECT MIN(occurred_on) FROM harvest_dispositions
        UNION ALL SELECT MIN(received_on) FROM harvest_shares_received
      )
    `,
  );
  return row?.earliest ?? null;
}

/**
 * The Home card: what the garden gave this calendar month, and what that
 * would have cost.
 *
 * The money is an avoided cost rather than income, worked out only from
 * prices this person has recorded paying for the same food in the same unit.
 * A crop they have never bought has no figure and is counted as unpriced
 * instead of being guessed at, which is the refusal lib/harvestTrade.ts
 * already makes everywhere else money touches a harvest.
 */
export async function getGardenYieldHomeSummary(today: string): Promise<GardenYieldHomeSummary> {
  const db = await getDatabase();
  const month = buildMonths(`${today.slice(0, 7)}-01`, today)[0];
  const [harvests, lastPaid, lastRow] = await Promise.all([
    readHarvests(month.monthStart, month.monthEnd),
    getLastPaidPrices(),
    db.getFirstAsync<{ lastOn: string | null }>('SELECT MAX(harvested_at) AS lastOn FROM garden_harvests'),
  ]);

  const valuation = valueReceivedGoods(
    harvests.map((harvest) => ({
      foodName: harvest.foodName,
      quantity: harvest.quantity,
      unit: harvestUnitForPricing(harvest.unit),
    })),
    lastPaid,
  );

  const system = await getMeasureSystem();
  return describeGardenYieldHome({
    monthLabel: month.label,
    harvests,
    system,
    avoidedCost: valuation.avoidedCost,
    unpricedCount: valuation.unvalued.length,
    lastHarvestOn: lastRow?.lastOn ?? null,
    today,
  });
}

/** Whatever the person set in Profile, falling back to metric where they
 *  have not said. The figures are the same either way; only the wording of
 *  a weight changes. */
async function getMeasureSystem(): Promise<MeasureSystem> {
  const stored = await getStoredMeasurementSystem();
  return stored === 'imperial' ? 'imperial' : 'metric';
}
