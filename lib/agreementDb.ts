// The first-launch agreement's one app_meta row (X2). The wording and
// what counts as current are in lib/agreement.ts.
import { APP_VERSION } from '../constants/version';
import { AGREEMENT_META_KEY, AGREEMENT_VERSION, parseAgreement, type AgreementRecord } from './agreement';
import { getDatabase } from './db';

export async function getAgreement(): Promise<AgreementRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', AGREEMENT_META_KEY);
  return parseAgreement(row?.value);
}

export async function recordAgreement(): Promise<AgreementRecord> {
  const record: AgreementRecord = { version: AGREEMENT_VERSION, agreedAt: new Date().toISOString(), appVersion: APP_VERSION };
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    AGREEMENT_META_KEY,
    JSON.stringify(record),
    record.agreedAt,
  );
  return record;
}
