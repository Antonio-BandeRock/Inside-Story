// Which sections each kind of report leaves out (K10): one app_meta row
// per report, so the next copy starts from the last choice. What the ids
// mean and which are allowed is in lib/reportKinds.ts.
import { getDatabase } from './db';
import { cleanLeftOut, leftOutMetaKey, parseLeftOut, type ReportKind, type ReportSectionId } from './reportKinds';

export async function getReportLeftOut(kind: ReportKind): Promise<ReportSectionId[]> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', leftOutMetaKey(kind));
  return parseLeftOut(kind, row?.value);
}

export async function setReportLeftOut(kind: ReportKind, leftOut: readonly string[]): Promise<ReportSectionId[]> {
  const clean = cleanLeftOut(kind, leftOut);
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    leftOutMetaKey(kind),
    JSON.stringify(clean),
    new Date().toISOString(),
  );
  return clean;
}
