// Reading and writing accounts, budget limits and net-worth history.
//
// Added 2026-09-05, pass 2 of the Finances rebuild. Same split the other
// finance modules follow: schema in lib/db.ts, arithmetic in
// lib/financeAccounts.ts with no database so it can be tested without one,
// and the reading and writing here.

import { getDatabase } from './db';
import { netWorth, type Account, type BalancePoint } from './financeAccounts';

export type AccountRecord = Account & { notes: string | null };

export type BudgetRecord = { id: string; category: string; monthlyLimit: number; active: boolean };

export type NetWorthPoint = { date: string; assets: number; liabilities: number; net: number };

// --- Accounts ---------------------------------------------------------------

export async function upsertAccount(input: {
  id?: string;
  name: string;
  kind: string;
  balance: number;
  apr?: number | null;
  minimumPayment?: number | null;
  notes?: string;
  // What was paid in or taken out since the last time this balance was
  // recorded. Optional, and the difference it makes is whether the
  // measured figure can be called a return at all.
  contribution?: number;
}): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  if (input.id) {
    await db.runAsync(
      'UPDATE finance_accounts SET name = ?, kind = ?, balance = ?, apr = ?, minimum_payment = ?, notes = ?, updated_at = ? WHERE id = ?',
      input.name.trim(), input.kind, input.balance, input.apr ?? null, input.minimumPayment ?? null,
      input.notes?.trim() || null, now, input.id,
    );
  } else {
    const id = `fin_acct_${Date.now()}`;
    await db.runAsync(
      `
        INSERT INTO finance_accounts (id, name, kind, balance, apr, minimum_payment, active, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      `,
      id, input.name.trim(), input.kind, input.balance, input.apr ?? null, input.minimumPayment ?? null,
      input.notes?.trim() || null, now, now,
    );
    await recordBalancePoint(id, input.balance, 0);
    await recordNetWorthSnapshot();
    return id;
  }

  // A balance changing is the only moment either history has anything new
  // to say, so that is when a point is recorded. See the tables' own
  // comments for why this is not on a timer.
  await recordBalancePoint(input.id, input.balance, input.contribution ?? 0);
  await recordNetWorthSnapshot();
  return input.id;
}

// --- One account's own balance history ---------------------------------------

function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

async function recordBalancePoint(accountId: string, balance: number, contribution: number): Promise<void> {
  const db = await getDatabase();
  // One row per account per day, replaced if the same balance is corrected
  // again the same day. A contribution recorded twice in one day is added
  // rather than replaced, since two deposits on one day are two deposits.
  await db.runAsync(
    `
      INSERT INTO finance_account_balance_history (id, account_id, recorded_on, balance, contribution)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(account_id, recorded_on) DO UPDATE SET
        balance = excluded.balance,
        contribution = finance_account_balance_history.contribution + excluded.contribution
    `,
    `fin_bal_${accountId}_${todayIso()}`, accountId, todayIso(), balance, contribution,
  );
}

export async function listBalanceHistory(accountId: string): Promise<BalancePoint[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ date: string; balance: number; contribution: number }>(
    `
      SELECT recorded_on AS date, balance, contribution
      FROM finance_account_balance_history
      WHERE account_id = ?
      ORDER BY recorded_on
    `,
    accountId,
  );
  return rows;
}

/** Every account's history at once, keyed by account id, so a screen
 *  showing a list of accounts needs one query rather than one per row. */
export async function listAllBalanceHistory(): Promise<Record<string, BalancePoint[]>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ accountId: string; date: string; balance: number; contribution: number }>(
    `
      SELECT account_id AS accountId, recorded_on AS date, balance, contribution
      FROM finance_account_balance_history
      ORDER BY account_id, recorded_on
    `,
  );
  const byAccount: Record<string, BalancePoint[]> = {};
  for (const row of rows) {
    (byAccount[row.accountId] ??= []).push({ date: row.date, balance: row.balance, contribution: row.contribution });
  }
  return byAccount;
}

export async function setAccountActive(id: string, active: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE finance_accounts SET active = ?, updated_at = ? WHERE id = ?', active ? 1 : 0, new Date().toISOString(), id);
  await recordNetWorthSnapshot();
}

export async function deleteAccount(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM finance_accounts WHERE id = ?', id);
  await recordNetWorthSnapshot();
}

export async function listAccounts(): Promise<AccountRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string; name: string; kind: string; balance: number;
    apr: number | null; minimumPayment: number | null; active: number; notes: string | null;
  }>(
    `
      SELECT id, name, kind, balance, apr, minimum_payment AS minimumPayment, active, notes
      FROM finance_accounts
      ORDER BY active DESC, kind, name
    `,
  );
  return rows.map((row) => ({ ...row, kind: row.kind as Account['kind'], active: row.active === 1 }));
}

// --- Net worth over time ----------------------------------------------------

async function recordNetWorthSnapshot(): Promise<void> {
  const accounts = await listAccounts();
  if (accounts.length === 0) return;
  const totals = netWorth(accounts);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO finance_networth_snapshots (snapshot_date, assets, liabilities)
      VALUES (?, ?, ?)
      ON CONFLICT(snapshot_date) DO UPDATE SET assets = excluded.assets, liabilities = excluded.liabilities
    `,
    today, totals.assets, totals.liabilities,
  );
}

export async function listNetWorthHistory(limit = 24): Promise<NetWorthPoint[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ date: string; assets: number; liabilities: number }>(
    `
      SELECT snapshot_date AS date, assets, liabilities
      FROM finance_networth_snapshots
      ORDER BY snapshot_date DESC
      LIMIT ?
    `,
    limit,
  );
  return rows.reverse().map((row) => ({ ...row, net: row.assets - row.liabilities }));
}

// --- Budget limits ----------------------------------------------------------

export async function setBudget(category: string, monthlyLimit: number): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `
      INSERT INTO finance_budgets (id, category, monthly_limit, active, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?)
      ON CONFLICT(category) DO UPDATE SET monthly_limit = excluded.monthly_limit, active = 1, updated_at = excluded.updated_at
    `,
    `fin_budget_${Date.now()}`, category, monthlyLimit, now, now,
  );
}

export async function removeBudget(category: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM finance_budgets WHERE category = ?', category);
}

export async function listBudgets(): Promise<BudgetRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; category: string; monthlyLimit: number; active: number }>(
    'SELECT id, category, monthly_limit AS monthlyLimit, active FROM finance_budgets WHERE active = 1 ORDER BY monthly_limit DESC',
  );
  return rows.map((row) => ({ ...row, active: row.active === 1 }));
}
