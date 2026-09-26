// Reading and writing what is on hand of a med and who fills and prescribes
// it (A3 and A6, Phase 2). The arithmetic and every sentence are in
// lib/medSupply.ts.

import { getDatabase } from './db';
import { addDays, readSupply, type SupplyReading } from './medSupply';

export type TreatmentDetails = {
  treatmentId: string;
  supplyOnHand: number | null;
  supplyUnit: string | null;
  supplyPerDose: number;
  supplyCountedAt: string | null;
  refillLeadDays: number;
  pharmacyName: string | null;
  pharmacyPhone: string | null;
  prescriberName: string | null;
  prescriberPhone: string | null;
};

type Row = {
  treatment_id: string;
  supply_on_hand: number | null;
  supply_unit: string | null;
  supply_per_dose: number;
  supply_counted_at: string | null;
  refill_lead_days: number;
  pharmacy_name: string | null;
  pharmacy_phone: string | null;
  prescriber_name: string | null;
  prescriber_phone: string | null;
};

const TAKEN = "('logged', 'partial', 'replaced')";

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function localNow(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function localToday(): string {
  return localNow().slice(0, 10);
}

function fromRow(row: Row): TreatmentDetails {
  return {
    treatmentId: row.treatment_id,
    supplyOnHand: row.supply_on_hand,
    supplyUnit: row.supply_unit,
    supplyPerDose: row.supply_per_dose,
    supplyCountedAt: row.supply_counted_at,
    refillLeadDays: row.refill_lead_days,
    pharmacyName: row.pharmacy_name,
    pharmacyPhone: row.pharmacy_phone,
    prescriberName: row.prescriber_name,
    prescriberPhone: row.prescriber_phone,
  };
}

export function blankDetails(treatmentId: string): TreatmentDetails {
  return {
    treatmentId,
    supplyOnHand: null,
    supplyUnit: null,
    supplyPerDose: 1,
    supplyCountedAt: null,
    refillLeadDays: 7,
    pharmacyName: null,
    pharmacyPhone: null,
    prescriberName: null,
    prescriberPhone: null,
  };
}

export async function listTreatmentDetails(): Promise<Map<string, TreatmentDetails>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Row>('SELECT * FROM treatment_details');
  return new Map(rows.map((row) => [row.treatment_id, fromRow(row)]));
}

async function ensureRow(treatmentId: string) {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO treatment_details (treatment_id, updated_at) VALUES (?, ?)',
    treatmentId,
    new Date().toISOString(),
  );
}

/** Saves a fresh count. The count is dated now, so doses marked from here on
 *  are what draw it down. Null clears the count. */
export async function saveTreatmentSupply(
  treatmentId: string,
  input: { onHand: number | null; unit: string | null; perDose: number; leadDays: number },
): Promise<void> {
  await ensureRow(treatmentId);
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE treatment_details
     SET supply_on_hand = ?, supply_unit = ?, supply_per_dose = ?, supply_counted_at = ?, refill_lead_days = ?, updated_at = ?
     WHERE treatment_id = ?`,
    input.onHand,
    input.unit?.trim() || null,
    input.perDose > 0 ? input.perDose : 1,
    input.onHand === null ? null : localNow(),
    Math.max(0, Math.round(input.leadDays)),
    new Date().toISOString(),
    treatmentId,
  );
}

export async function saveTreatmentContacts(
  treatmentId: string,
  input: { pharmacyName: string; pharmacyPhone: string; prescriberName: string; prescriberPhone: string },
): Promise<void> {
  await ensureRow(treatmentId);
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE treatment_details
     SET pharmacy_name = ?, pharmacy_phone = ?, prescriber_name = ?, prescriber_phone = ?, updated_at = ?
     WHERE treatment_id = ?`,
    input.pharmacyName.trim() || null,
    input.pharmacyPhone.trim() || null,
    input.prescriberName.trim() || null,
    input.prescriberPhone.trim() || null,
    new Date().toISOString(),
    treatmentId,
  );
}

async function countDoses(treatmentId: string, where: string, ...args: string[]): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM schedule_items WHERE linked_treatment_id = ? AND ${where}`,
    treatmentId,
    ...args,
  );
  return row?.n ?? 0;
}

/** What is left of one med, worked out from its count and its marks. */
export async function readTreatmentSupply(details: TreatmentDetails, today = localToday()): Promise<SupplyReading> {
  const now = localNow();
  const [takenSinceCount, dueNext7Days, takenPast14Days] = details.supplyCountedAt
    ? await Promise.all([
        countDoses(details.treatmentId, `status IN ${TAKEN} AND scheduled_for >= ? AND scheduled_for <= ?`, details.supplyCountedAt, now),
        countDoses(
          details.treatmentId,
          "status NOT IN ('skipped', 'cancelled') AND substr(scheduled_for, 1, 10) >= ? AND substr(scheduled_for, 1, 10) < ?",
          today,
          addDays(today, 7),
        ),
        countDoses(
          details.treatmentId,
          `status IN ${TAKEN} AND substr(scheduled_for, 1, 10) >= ? AND substr(scheduled_for, 1, 10) < ?`,
          addDays(today, -14),
          today,
        ),
      ])
    : [0, 0, 0];
  return readSupply({
    onHand: details.supplyOnHand,
    unit: details.supplyUnit,
    perDose: details.supplyPerDose,
    countedAt: details.supplyCountedAt,
    takenSinceCount,
    dueNext7Days,
    takenPast14Days,
    today,
    leadDays: details.refillLeadDays,
  });
}

/** Every counted med's reading, for My Meds and the refill reminder. */
export async function listSupplyReadings(today = localToday()): Promise<Map<string, SupplyReading>> {
  const details = await listTreatmentDetails();
  const out = new Map<string, SupplyReading>();
  for (const item of details.values()) {
    if (item.supplyOnHand === null) continue;
    out.set(item.treatmentId, await readTreatmentSupply(item, today));
  }
  return out;
}
