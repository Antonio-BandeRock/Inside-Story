// Reading and writing microbiome_tests and microbiome_results (lib/db.ts),
// G30, 2026-10-02. Signals > Microbiome Tests writes here; lib/microbiome.ts
// holds every decision and sentence.
import { getDatabase } from './db';
import { getEatingVarietyInputs } from './eatingVarietyDb';
import { addDays, buildWeeks, summarizeDistinctPlants, summarizeGutFoods } from './eatingVariety';
import { EATING_WINDOW_DAYS, type EatingBefore, type MicrobiomeResult, type MicrobiomeRowSave, type MicrobiomeTest } from './microbiome';
import { readOrClosed } from './vaultReads';

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function tidy(text: string | null | undefined): string | null {
  const value = (text ?? '').trim().replace(/\s+/g, ' ');
  return value ? value : null;
}

type TestRow = { id: string; sampledOn: string; provider: string | null; kind: string | null; note: string | null };
type ResultRow = Omit<MicrobiomeResult, 'groupName' | 'unit'> & { groupName: string | null; unit: string | null };

export async function listMicrobiomeTests(): Promise<{ tests: MicrobiomeTest[]; results: MicrobiomeResult[] }> {
  const db = await getDatabase();
  const tests = await readOrClosed(() => db.getAllAsync<TestRow>(
    `SELECT id, sampled_on AS sampledOn, provider, kind, note FROM microbiome_tests
     ORDER BY sampled_on DESC, created_at DESC`,
  ), []);
  const results = await readOrClosed(() => db.getAllAsync<ResultRow>(
    `SELECT id, test_id AS testId, group_name AS groupName, name, value_text AS valueText, value, unit,
            range_low AS low, range_high AS high, printed_flag AS printedFlag, sort_order AS sortOrder
     FROM microbiome_results ORDER BY test_id, sort_order, created_at`,
  ), []);
  return {
    tests: tests.map((test) => ({ ...test, provider: test.provider ?? '', kind: test.kind ?? '' })),
    results: results.map((row) => ({ ...row, groupName: row.groupName ?? '', unit: row.unit ?? '' })),
  };
}

async function insertRows(testId: string, rows: readonly MicrobiomeRowSave[], startAt: number): Promise<void> {
  const db = await getDatabase();
  for (const [index, row] of rows.entries()) {
    await db.runAsync(
      `INSERT INTO microbiome_results
         (id, test_id, group_name, name, value_text, value, unit, range_low, range_high, printed_flag, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newId('mbr'),
      testId,
      tidy(row.groupName),
      row.name,
      row.valueText,
      row.value,
      tidy(row.unit),
      row.low,
      row.high,
      tidy(row.printedFlag),
      startAt + index,
    );
  }
}

export async function addMicrobiomeTest(
  details: { sampledOn: string; provider: string; kind: string; note: string },
  rows: readonly MicrobiomeRowSave[],
): Promise<string> {
  const db = await getDatabase();
  const id = newId('mbt');
  await db.runAsync(
    'INSERT INTO microbiome_tests (id, sampled_on, provider, kind, note) VALUES (?, ?, ?, ?, ?)',
    id,
    details.sampledOn,
    tidy(details.provider),
    tidy(details.kind),
    tidy(details.note),
  );
  await insertRows(id, rows, 0);
  return id;
}

export async function updateMicrobiomeTest(
  id: string,
  details: { sampledOn: string; provider: string; kind: string; note: string },
  newRows: readonly MicrobiomeRowSave[],
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE microbiome_tests SET sampled_on = ?, provider = ?, kind = ?, note = ? WHERE id = ?',
    details.sampledOn,
    tidy(details.provider),
    tidy(details.kind),
    tidy(details.note),
    id,
  );
  if (newRows.length === 0) return;
  const last = await db.getFirstAsync<{ n: number | null }>(
    '/* vault:tool */ SELECT MAX(sort_order) AS n FROM microbiome_results WHERE test_id = ?',
    id,
  );
  await insertRows(id, newRows, (last?.n ?? -1) + 1);
}

export async function removeMicrobiomeResult(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM microbiome_results WHERE id = ?', id);
}

export async function removeMicrobiomeTest(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM microbiome_results WHERE test_id = ?', id);
  await db.runAsync('DELETE FROM microbiome_tests WHERE id = ?', id);
}

/** Company, kind and group values typed on earlier tests, for the open lists. */
export async function getMicrobiomeValuesUsed(): Promise<{ providers: string[]; kinds: string[]; groups: string[] }> {
  const db = await getDatabase();
  // Choice lists for the form, read past a closed vault: the vault holds records, not the tools.
  const pick = async (sql: string) => (await db.getAllAsync<{ v: string }>(sql)).map((row) => row.v);
  return {
    providers: await pick("/* vault:tool */ SELECT DISTINCT provider AS v FROM microbiome_tests WHERE provider IS NOT NULL AND provider <> ''"),
    kinds: await pick("/* vault:tool */ SELECT DISTINCT kind AS v FROM microbiome_tests WHERE kind IS NOT NULL AND kind <> ''"),
    groups: await pick("/* vault:tool */ SELECT DISTINCT group_name AS v FROM microbiome_results WHERE group_name IS NOT NULL AND group_name <> ''"),
  };
}

/** What the food log holds for the days before a sample, the sample day left out. */
export async function getEatingBeforeSample(sampledOn: string): Promise<EatingBefore> {
  const endDate = addDays(sampledOn, -1);
  const startDate = addDays(sampledOn, -EATING_WINDOW_DAYS);
  const inputs = await getEatingVarietyInputs(startDate, endDate);
  const weeks = buildWeeks(startDate, endDate, inputs.loggedDates);
  const plants = summarizeDistinctPlants(inputs, weeks);
  const gut = summarizeGutFoods(inputs, weeks);
  return {
    plants: plants.distinctAcrossRange,
    gutFoods: gut.distinctAcrossRange,
    fermentedEntries: gut.fermentedEntriesAcrossRange,
    daysLogged: inputs.loggedDates.filter((day) => day >= startDate && day <= endDate).length,
  };
}
