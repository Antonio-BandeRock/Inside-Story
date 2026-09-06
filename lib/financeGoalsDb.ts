// Reading and writing goals, their costs and what has gone into them.
//
// Added 2026-09-05, pass 3 of the Finances rebuild. Same split every other
// finance module follows: schema in lib/db.ts, arithmetic in
// lib/financeGoals.ts with no database so it can be tested without one,
// and the reading and writing here.

import { getDatabase } from './db';
import {
  costProgress,
  goalProgress,
  type Goal,
  type GoalCost,
  type GoalCostKind,
  type GoalProgress,
} from './financeGoals';

export type GoalContribution = {
  id: string;
  costId: string;
  occurredOn: string;
  amount: number;
  note: string | null;
};

/** A goal with its costs, their contributions, and progress already
 *  computed, since no screen wants one without the others. */
export type GoalWithProgress = {
  progress: GoalProgress;
  contributionsByCost: Record<string, GoalContribution[]>;
};

// --- Goals ------------------------------------------------------------------

export async function createGoal(input: {
  name: string;
  reason?: string;
  targetDate?: string | null;
}): Promise<string> {
  const db = await getDatabase();
  const id = `fin_goal_${Date.now()}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO finance_goals (id, name, reason, target_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `,
    id, input.name.trim(), input.reason?.trim() || null, input.targetDate || null, now, now,
  );
  return id;
}

export async function updateGoal(
  id: string,
  input: { name: string; reason?: string; targetDate?: string | null },
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE finance_goals SET name = ?, reason = ?, target_date = ?, updated_at = ? WHERE id = ?',
    input.name.trim(), input.reason?.trim() || null, input.targetDate || null, new Date().toISOString(), id,
  );
}

// Reached and given up are both kept rather than deleted. A goal that was
// met is worth being able to look back at, and one abandoned is a decision
// someone made, not a mistake to erase. Both are excluded from every
// "what is still needed" figure by summarizeGoals' own status check.
export async function setGoalStatus(id: string, status: Goal['status']): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE finance_goals SET status = ?, updated_at = ? WHERE id = ?',
    status, new Date().toISOString(), id,
  );
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDatabase();
  // Contributions cascade from their cost; the costs themselves are
  // removed here, since finance_goal_costs has no cascade of its own and a
  // goal's costs mean nothing without it.
  await db.runAsync(
    'DELETE FROM finance_goal_contributions WHERE cost_id IN (SELECT id FROM finance_goal_costs WHERE goal_id = ?)',
    id,
  );
  await db.runAsync('DELETE FROM finance_goal_costs WHERE goal_id = ?', id);
  await db.runAsync('DELETE FROM finance_goals WHERE id = ?', id);
}

// --- Costs ------------------------------------------------------------------

export async function addGoalCost(input: {
  goalId: string;
  kind: GoalCostKind;
  label: string;
  target: number;
  unit?: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = `fin_gcost_${Date.now()}`;
  await db.runAsync(
    `
      INSERT INTO finance_goal_costs (id, goal_id, kind, label, target_amount, unit)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    id, input.goalId, input.kind, input.label.trim(), input.target,
    // Money never carries a unit, whatever gets passed, so the display side
    // cannot end up printing a dollar amount followed by "hours".
    input.kind === 'money' ? null : input.unit?.trim() || null,
  );
  return id;
}

export async function deleteGoalCost(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM finance_goal_contributions WHERE cost_id = ?', id);
  await db.runAsync('DELETE FROM finance_goal_costs WHERE id = ?', id);
}

// --- Contributions ----------------------------------------------------------

export async function addGoalContribution(input: {
  costId: string;
  occurredOn: string;
  amount: number;
  note?: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = `fin_gcontrib_${Date.now()}`;
  await db.runAsync(
    `
      INSERT INTO finance_goal_contributions (id, cost_id, occurred_on, amount, note)
      VALUES (?, ?, ?, ?, ?)
    `,
    id, input.costId, input.occurredOn, input.amount, input.note?.trim() || null,
  );
  return id;
}

export async function deleteGoalContribution(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM finance_goal_contributions WHERE id = ?', id);
}

// --- What a spending entry can be tagged to ---------------------------------

export type GoalCostOption = { costId: string; goalName: string; costLabel: string };

/**
 * Money cost lines on active goals, for the picker in Spending.
 *
 * Money only, and that is not a simplification: a dollar entry cannot
 * advance a line counted in hours or jars, and offering one would invite a
 * number into a unit it does not belong to.
 *
 * Active only. Tagging spending to a goal already reached or set aside
 * would quietly change a figure someone has finished looking at.
 */
export async function listGoalCostOptions(): Promise<GoalCostOption[]> {
  const db = await getDatabase();
  return db.getAllAsync<GoalCostOption>(
    `
      SELECT c.id AS costId, g.name AS goalName, c.label AS costLabel
      FROM finance_goal_costs c
      JOIN finance_goals g ON g.id = c.goal_id
      WHERE c.kind = 'money' AND g.status = 'active'
      ORDER BY g.name, c.rowid
    `,
  );
}

// --- Reading it all back ----------------------------------------------------

/**
 * Every goal with its costs, contributions and computed progress.
 *
 * Three queries rather than one per goal: goals, then all costs, then all
 * contributions, assembled in JS. A join would return one row per
 * contribution and make every goal and cost repeat, which then has to be
 * un-repeated by hand.
 */
export async function listGoalsWithProgress(): Promise<GoalWithProgress[]> {
  const db = await getDatabase();

  const goalRows = await db.getAllAsync<{
    id: string; name: string; reason: string | null; targetDate: string | null; status: string;
  }>(
    `
      SELECT id, name, reason, target_date AS targetDate, status
      FROM finance_goals
      ORDER BY
        CASE status WHEN 'active' THEN 0 WHEN 'reached' THEN 1 ELSE 2 END,
        target_date IS NULL,
        target_date,
        name
    `,
  );
  if (goalRows.length === 0) return [];

  const costRows = await db.getAllAsync<{
    id: string; goalId: string; kind: string; label: string; target: number; unit: string | null;
  }>(
    `
      SELECT id, goal_id AS goalId, kind, label, target_amount AS target, unit
      FROM finance_goal_costs
      ORDER BY rowid
    `,
  );

  const contribRows = await db.getAllAsync<{
    id: string; costId: string; occurredOn: string; amount: number; note: string | null;
  }>(
    `
      SELECT id, cost_id AS costId, occurred_on AS occurredOn, amount, note
      FROM finance_goal_contributions
      ORDER BY occurred_on DESC, rowid DESC
    `,
  );

  const contributionsByCost: Record<string, GoalContribution[]> = {};
  const byHandByCost: Record<string, number> = {};
  for (const row of contribRows) {
    (contributionsByCost[row.costId] ??= []).push(row);
    byHandByCost[row.costId] = (byHandByCost[row.costId] ?? 0) + row.amount;
  }

  // Spending tagged to a cost line counts too, read where it already lives
  // rather than copied in. Copying would mean a corrected price in Spending
  // leaving a stale figure on the goal, which is exactly the drift this
  // project keeps having to unpick.
  //
  // Expenses only, matching what createEntry will store: income tagged to a
  // goal would be earmarking, not progress.
  const taggedRows = await db.getAllAsync<{ costId: string; total: number }>(
    `
      SELECT goal_cost_id AS costId, SUM(amount) AS total
      FROM finance_entries
      WHERE goal_cost_id IS NOT NULL AND direction = 'expense'
      GROUP BY goal_cost_id
    `,
  );
  const fromSpendingByCost: Record<string, number> = {};
  for (const row of taggedRows) fromSpendingByCost[row.costId] = row.total ?? 0;

  const costsByGoal: Record<string, GoalCost[]> = {};
  for (const row of costRows) {
    (costsByGoal[row.goalId] ??= []).push({
      id: row.id,
      goalId: row.goalId,
      kind: row.kind as GoalCostKind,
      label: row.label,
      target: row.target,
      unit: row.unit ?? '',
    });
  }

  return goalRows.map((row) => {
    const goal: Goal = {
      id: row.id,
      name: row.name,
      reason: row.reason,
      targetDate: row.targetDate,
      status: (row.status as Goal['status']) ?? 'active',
    };
    const costs = (costsByGoal[goal.id] ?? []).map((cost) => {
      const fromSpending = fromSpendingByCost[cost.id] ?? 0;
      const total = (byHandByCost[cost.id] ?? 0) + fromSpending;
      return costProgress(cost, total, { fromSpending });
    });
    return { progress: goalProgress(goal, costs), contributionsByCost };
  });
}
