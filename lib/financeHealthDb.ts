// Reading and writing the health-money tables, plus the rollup that
// assembles cost-per-condition out of everything already tagged with one.
//
// Added 2026-09-05, pass 1 of the Finances rebuild. Same split every other
// finance module follows: schema in lib/db.ts because that is where the
// database is created, arithmetic in lib/financeHealth.ts with no database
// so it can be tested without one, and the reading and writing here.
//
// The cost-per-condition rollup deliberately reaches across four different
// tables rather than asking anyone to re-enter what they have already told
// the app. A prescription entered as a repeating bill, a specialist visit
// entered as a medical bill, a one-off pharmacy run, and a course of
// chiropractic sessions are four different records in four places, and
// they are all part of what a condition costs. Tagging is what ties them
// together, and nothing here infers a tag that was not given.

import { getDatabase } from './db';
import type {
  ConditionCost,
  HealthAccount,
  HealthAccountKind,
  InsurancePlan,
  MedicalBill,
  BillStatus,
} from './financeHealth';

// --- Insurance plans --------------------------------------------------------

export async function upsertInsurancePlan(input: {
  id?: string;
  name: string;
  yearStart: string;
  deductible?: number | null;
  outOfPocketMax?: number | null;
  deductibleMetAtStart?: number;
  outOfPocketMetAtStart?: number;
  notes?: string;
}): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  if (input.id) {
    await db.runAsync(
      `
        UPDATE finance_insurance_plans
        SET name = ?, year_start = ?, deductible = ?, out_of_pocket_max = ?,
            deductible_met_at_start = ?, out_of_pocket_met_at_start = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `,
      input.name.trim(),
      input.yearStart,
      input.deductible ?? null,
      input.outOfPocketMax ?? null,
      input.deductibleMetAtStart ?? 0,
      input.outOfPocketMetAtStart ?? 0,
      input.notes?.trim() || null,
      now,
      input.id,
    );
    return input.id;
  }

  const id = `fin_plan_${Date.now()}`;
  await db.runAsync(
    `
      INSERT INTO finance_insurance_plans
        (id, name, year_start, deductible, out_of_pocket_max, deductible_met_at_start,
         out_of_pocket_met_at_start, active, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `,
    id,
    input.name.trim(),
    input.yearStart,
    input.deductible ?? null,
    input.outOfPocketMax ?? null,
    input.deductibleMetAtStart ?? 0,
    input.outOfPocketMetAtStart ?? 0,
    input.notes?.trim() || null,
    now,
    now,
  );
  return id;
}

export async function getActiveInsurancePlan(): Promise<InsurancePlan | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    yearStart: string;
    deductible: number | null;
    outOfPocketMax: number | null;
    deductibleMetAtStart: number;
    outOfPocketMetAtStart: number;
  }>(
    `
      SELECT id, name, year_start AS yearStart, deductible,
             out_of_pocket_max AS outOfPocketMax,
             deductible_met_at_start AS deductibleMetAtStart,
             out_of_pocket_met_at_start AS outOfPocketMetAtStart
      FROM finance_insurance_plans
      WHERE active = 1
      ORDER BY year_start DESC
      LIMIT 1
    `,
  );
  return row ?? null;
}

export async function deleteInsurancePlan(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM finance_insurance_plans WHERE id = ?', id);
}

// --- Medical bills ----------------------------------------------------------

export async function createMedicalBill(input: {
  serviceDate: string;
  provider: string;
  description?: string;
  billed?: number | null;
  allowed?: number | null;
  insurancePaid?: number | null;
  youOwe?: number | null;
  appliedToDeductible?: number | null;
  appliedToOutOfPocket?: number | null;
  conditionCode?: string | null;
  status?: BillStatus;
  notes?: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = `fin_bill_${Date.now()}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO finance_medical_bills
        (id, service_date, provider, description, billed, allowed, insurance_paid, you_owe,
         paid_amount, status, applied_to_deductible, applied_to_out_of_pocket, condition_code,
         notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    input.serviceDate,
    input.provider.trim(),
    input.description?.trim() || null,
    input.billed ?? null,
    input.allowed ?? null,
    input.insurancePaid ?? null,
    input.youOwe ?? null,
    input.status ?? 'unpaid',
    input.appliedToDeductible ?? null,
    input.appliedToOutOfPocket ?? null,
    input.conditionCode ?? null,
    input.notes?.trim() || null,
    now,
    now,
  );
  return id;
}

export async function setMedicalBillStatus(id: string, status: BillStatus, paidAmount?: number | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE finance_medical_bills SET status = ?, paid_amount = ?, updated_at = ? WHERE id = ?',
    status,
    paidAmount ?? null,
    new Date().toISOString(),
    id,
  );
}

export async function deleteMedicalBill(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM finance_medical_bills WHERE id = ?', id);
}

export async function listMedicalBills(limit = 200): Promise<MedicalBill[]> {
  const db = await getDatabase();
  return db.getAllAsync<MedicalBill>(
    `
      SELECT id, service_date AS serviceDate, provider, description, billed, allowed,
             insurance_paid AS insurancePaid, you_owe AS youOwe, paid_amount AS paidAmount,
             status, applied_to_deductible AS appliedToDeductible,
             applied_to_out_of_pocket AS appliedToOutOfPocket, condition_code AS conditionCode
      FROM finance_medical_bills
      ORDER BY service_date DESC
      LIMIT ?
    `,
    limit,
  );
}

// --- HSA and FSA ------------------------------------------------------------

export async function upsertHealthAccount(input: {
  id?: string;
  kind: HealthAccountKind;
  planYear: string;
  contributed: number;
  spent: number;
  deadline?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  if (input.id) {
    await db.runAsync(
      'UPDATE finance_health_accounts SET kind = ?, plan_year = ?, contributed = ?, spent = ?, deadline = ?, updated_at = ? WHERE id = ?',
      input.kind, input.planYear, input.contributed, input.spent, input.deadline ?? null, now, input.id,
    );
    return input.id;
  }
  const id = `fin_hacct_${Date.now()}`;
  await db.runAsync(
    `
      INSERT INTO finance_health_accounts (id, kind, plan_year, contributed, spent, deadline, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id, input.kind, input.planYear, input.contributed, input.spent, input.deadline ?? null, now, now,
  );
  return id;
}

export async function deleteHealthAccount(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM finance_health_accounts WHERE id = ?', id);
}

export async function listHealthAccounts(): Promise<HealthAccount[]> {
  const db = await getDatabase();
  return db.getAllAsync<HealthAccount>(
    `
      SELECT id, kind, plan_year AS planYear, contributed, spent, deadline
      FROM finance_health_accounts
      ORDER BY plan_year DESC, kind
    `,
  );
}

// --- What a condition costs -------------------------------------------------

/**
 * Every cost carrying a condition tag, plus every untagged health cost,
 * across the four places money that belongs to a condition can be
 * recorded.
 *
 * `sinceDate` bounds it to a period, usually the year so far, because "what
 * has this cost me" is a question about a stretch of time rather than
 * forever.
 *
 * Recurring costs are counted at their monthly value multiplied by the
 * months in range rather than at their face amount, because a $45 monthly
 * prescription over eight months is $360 and reporting $45 would be
 * useless. That multiplication happens in the caller, which knows the
 * range; this returns the monthly figure and the caller scales it. Keeping
 * the scaling out of SQL is deliberate: the rule-derived monthly factor
 * lives in TypeScript and there is no second copy of it here.
 */
export async function getConditionCostInputs(sinceDate: string): Promise<{
  fromBills: ConditionCost[];
  fromEntries: ConditionCost[];
  fromTherapies: ConditionCost[];
  recurringTagged: { amount: number; conditionCode: string | null; ruleJson: string | null; legacyCadence: string }[];
}> {
  const db = await getDatabase();

  const billRows = await db.getAllAsync<{ amount: number | null; conditionCode: string | null }>(
    `
      SELECT COALESCE(paid_amount, you_owe) AS amount, condition_code AS conditionCode
      FROM finance_medical_bills
      WHERE service_date >= ?
    `,
    sinceDate,
  );

  // Only health-category spending counts toward what a condition costs. A
  // tagged restaurant meal is not a medical cost, and letting every
  // category in would turn this figure into general spending wearing a
  // condition's name.
  const entryRows = await db.getAllAsync<{ amount: number; conditionCode: string | null }>(
    `
      SELECT amount, condition_code AS conditionCode
      FROM finance_entries
      WHERE occurred_on >= ?
        AND direction = 'expense'
        AND category IN ('health_insurance', 'medical_care', 'prescriptions', 'supplements', 'therapies')
    `,
    sinceDate,
  );

  const therapyRows = await db.getAllAsync<{ amount: number | null; conditionCode: string | null }>(
    `
      SELECT cost AS amount, condition_code AS conditionCode
      FROM therapy_sessions
      WHERE performed_at >= ?
    `,
    sinceDate,
  );

  const recurringTagged = await db.getAllAsync<{
    amount: number;
    conditionCode: string | null;
    ruleJson: string | null;
    legacyCadence: string;
  }>(
    `
      SELECT amount, condition_code AS conditionCode, due_rule_json AS ruleJson, cadence AS legacyCadence
      FROM finance_recurring
      WHERE active = 1
        AND direction = 'expense'
        AND category IN ('health_insurance', 'medical_care', 'prescriptions', 'supplements', 'therapies')
    `,
  );

  const asCost = (
    rows: { amount: number | null; conditionCode: string | null }[],
    source: ConditionCost['source'],
  ): ConditionCost[] =>
    rows
      .filter((row): row is { amount: number; conditionCode: string | null } => row.amount != null)
      .map((row) => ({ amount: row.amount, conditionCode: row.conditionCode, source }));

  return {
    fromBills: asCost(billRows, 'medicalBill'),
    fromEntries: asCost(entryRows, 'entry'),
    fromTherapies: asCost(therapyRows, 'therapy'),
    recurringTagged,
  };
}

/** Everything the health section needs, fetched together. */
export async function getHealthMoneySnapshot(sinceDate: string): Promise<{
  plan: InsurancePlan | null;
  bills: MedicalBill[];
  accounts: HealthAccount[];
  costInputs: Awaited<ReturnType<typeof getConditionCostInputs>>;
}> {
  const [plan, bills, accounts, costInputs] = await Promise.all([
    getActiveInsurancePlan(),
    listMedicalBills(),
    listHealthAccounts(),
    getConditionCostInputs(sinceDate),
  ]);
  return { plan, bills, accounts, costInputs };
}
