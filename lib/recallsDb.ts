// Recalls matched to My Meds and scanned foods (A14): the recall list kept on
// this device, the read from openFDA that fills it, the matches, and the one
// notification when a new match turns up. Matching and every sentence are in
// lib/recalls.ts.
//
// Nothing is fetched until the person turns the check on. The first read asks
// for the whole past year; later reads ask only for what was reported since
// just before the newest recall kept, at most once a day. The recall table is
// in DEVICE_LOCAL_TABLES, since each device can read the same public list for
// itself. recall_checks, the recalls a person checked and set aside, is their
// decision and travels like any other record.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDatabase, listAllActiveTreatments, listCommonMedications, listScannedProducts } from './db';
import type { LabelDocument } from './medicineLabel';
import { reminderDetailHidden } from './appLockSession';
import { reminderWords } from './lockedReminderText';
import {
  addDays,
  matchKey,
  matchMedicine,
  matchProduct,
  notificationBody,
  notificationTitle,
  parseRecalls,
  recallUrl,
  RECALL_MAX_SKIP,
  RECALL_NOTIFICATION_PREFIX,
  RECALL_PAGE_SIZE,
  RECALL_WINDOW_DAYS,
  sortMatches,
  spanToRead,
  type Recall,
  type RecallKind,
  type RecallMatch,
} from './recalls';

const RECALLS_ON_KEY = 'recall_check';
const LAST_READ_KEY = 'recalls_last_read';
const NOTIFIED_KEY = 'recalls_notified';
const READ_EVERY_MS = 20 * 60 * 60 * 1000;
const RETRY_AFTER_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30000;
const ANDROID_CHANNEL_ID = 'reminders';

async function readMeta(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string | null }>('SELECT value FROM app_meta WHERE key = ?', key);
  return row?.value ?? null;
}

async function writeMeta(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value,
    new Date().toISOString(),
  );
}

export async function isRecallCheckOn(): Promise<boolean> {
  return (await readMeta(RECALLS_ON_KEY)) === '1';
}

export async function setRecallCheckOn(on: boolean): Promise<void> {
  await writeMeta(RECALLS_ON_KEY, on ? '1' : '0');
}

function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The local day the list was last read in full or in part, for the credit line. */
export async function recallsReadOn(): Promise<string | null> {
  try {
    const last = JSON.parse((await readMeta(LAST_READ_KEY)) ?? 'null') as { okAt?: number } | null;
    if (!last?.okAt) return null;
    const d = new Date(last.okAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return null;
  }
}

type RecallRow = {
  recall_number: string;
  kind: string;
  firm: string;
  product: string;
  reason: string;
  classification: string;
  status: string;
  report_date: string;
  code_info: string;
  ndcs_json: string;
  upcs_json: string;
  names_json: string;
};

function list(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export async function listKeptRecalls(): Promise<Recall[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RecallRow>(
    `SELECT recall_number, kind, firm, product, reason, classification, status, report_date, code_info, ndcs_json, upcs_json, names_json
       FROM recalls ORDER BY report_date DESC`,
  );
  return rows.map((r) => ({
    recallNumber: r.recall_number,
    kind: r.kind === 'food' ? 'food' : 'drug',
    firm: r.firm,
    product: r.product,
    reason: r.reason,
    classification: r.classification,
    status: r.status,
    reportDate: r.report_date,
    codeInfo: r.code_info,
    ndcs: list(r.ndcs_json),
    upcs: list(r.upcs_json),
    names: list(r.names_json),
  }));
}

async function fetchJson(url: string): Promise<unknown | 'none' | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    // openFDA answers a search with nothing in it as a 404.
    if (response.status === 404) return 'none';
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function readKind(kind: RecallKind, start: string, end: string): Promise<Recall[] | null> {
  const out: Recall[] = [];
  for (let skip = 0; skip <= RECALL_MAX_SKIP; skip += RECALL_PAGE_SIZE) {
    const json = await fetchJson(recallUrl(kind, start, end, skip));
    if (json === null) return null;
    if (json === 'none') break;
    const { recalls, total } = parseRecalls(json, kind);
    out.push(...recalls);
    if (recalls.length === 0 || skip + RECALL_PAGE_SIZE >= total) break;
  }
  return out;
}

export type RecallRefresh = { state: 'off' | 'not-due' | 'waiting' | 'error' } | { state: 'read'; added: number; newMatches: RecallMatch[] };

let inFlight: Promise<RecallRefresh> | null = null;

/** Reads what is new on the list when a read is due, then raises one notification for matches not seen before. */
export function refreshRecalls(force = false): Promise<RecallRefresh> {
  if (inFlight) return inFlight;
  inFlight = doRefresh(force).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doRefresh(force: boolean): Promise<RecallRefresh> {
  if (!(await isRecallCheckOn())) return { state: 'off' };
  let last: { okAt?: number; failedAt?: number } = {};
  try {
    last = JSON.parse((await readMeta(LAST_READ_KEY)) ?? '{}') ?? {};
  } catch {
    last = {};
  }
  const now = Date.now();
  if (!force && last.okAt && now - last.okAt < READ_EVERY_MS) return { state: 'not-due' };
  if (!force && last.failedAt && now - last.failedAt < RETRY_AFTER_MS) return { state: 'waiting' };

  const db = await getDatabase();
  const today = localToday();
  const newest = await db.getFirstAsync<{ day: string | null }>('SELECT MAX(report_date) AS day FROM recalls');
  const span = spanToRead(today, newest?.day ?? null);
  const firstRead = !last.okAt;

  const drug = await readKind('drug', span.start, span.end);
  const food = drug ? await readKind('food', span.start, span.end) : null;
  if (!drug || !food) {
    await writeMeta(LAST_READ_KEY, JSON.stringify({ ...last, failedAt: now }));
    return { state: 'error' };
  }

  const readAt = new Date().toISOString();
  const oldest = addDays(today, -RECALL_WINDOW_DAYS);
  await db.withTransactionAsync(async () => {
    for (const r of [...drug, ...food]) {
      await db.runAsync(
        `INSERT OR REPLACE INTO recalls
           (recall_number, kind, firm, product, reason, classification, status, report_date, code_info, ndcs_json, upcs_json, names_json, read_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        r.recallNumber,
        r.kind,
        r.firm,
        r.product,
        r.reason,
        r.classification,
        r.status,
        r.reportDate,
        r.codeInfo,
        JSON.stringify(r.ndcs),
        JSON.stringify(r.upcs),
        JSON.stringify(r.names),
        readAt,
      );
    }
    await db.runAsync('DELETE FROM recalls WHERE report_date < ?', oldest);
  });
  await writeMeta(LAST_READ_KEY, JSON.stringify({ okAt: now }));

  const newMatches = await takeNewMatches(firstRead);
  if (newMatches.length > 0) await notifyMatches(newMatches);
  return { state: 'read', added: drug.length + food.length, newMatches };
}

// --- Matches -------------------------------------------------------------

export type MedicineRecalls = {
  treatmentId: string;
  name: string;
  treatmentType: string;
  hasLabel: boolean;
  byCode: RecallMatch[];
  byName: RecallMatch[];
};

export type RecallMatches = {
  medicines: MedicineRecalls[];
  products: RecallMatch[];
  setAside: number;
};

async function checkedKeys(): Promise<Set<string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ recall_number: string; owner_kind: string; owner_id: string }>(
    'SELECT recall_number, owner_kind, owner_id FROM recall_checks',
  );
  return new Set(rows.map((r) => `${r.recall_number}|${r.owner_kind}|${r.owner_id}`));
}

async function allMatches(recalls?: Recall[]): Promise<{ meds: { med: { id: string; name: string; treatmentType: string; hasLabel: boolean }; matches: RecallMatch[] }[]; products: RecallMatch[] }> {
  const kept = recalls ?? (await listKeptRecalls());
  if (kept.length === 0) return { meds: [], products: [] };
  const db = await getDatabase();
  const [treatments, common, products, labelRows] = await Promise.all([
    listAllActiveTreatments(),
    listCommonMedications().catch(() => []),
    listScannedProducts(10000),
    db.getAllAsync<{ treatment_id: string; document_json: string }>('SELECT treatment_id, document_json FROM medicine_labels'),
  ]);
  const labels = new Map<string, LabelDocument>();
  for (const row of labelRows) {
    try {
      labels.set(row.treatment_id, JSON.parse(row.document_json) as LabelDocument);
    } catch {
      // A label that cannot be read is matched on the med's name alone.
    }
  }
  const meds = treatments.map((t) => {
    const fromList = t.genericName ? common.find((c) => c.id === t.genericName) : undefined;
    const label = labels.get(t.id);
    const matches = matchMedicine(
      {
        id: t.id,
        name: t.name,
        treatmentType: t.treatmentType,
        genericName: fromList?.genericName ?? null,
        brandNames: (fromList?.commonBrandNames ?? '').split(',').map((s) => s.trim()).filter(Boolean),
        labelNdcs: label ? [...(label.productNdcs ?? []), ...(label.packageNdcs ?? [])] : [],
        labelNames: label ? [label.brand, label.generic].filter((n): n is string => !!n) : [],
      },
      kept,
    );
    return { med: { id: t.id, name: t.name, treatmentType: t.treatmentType, hasLabel: !!label }, matches };
  });
  const productMatches = products.flatMap((p) => matchProduct({ id: p.id, name: p.name, brand: p.brand, barcode: p.barcode }, kept));
  return { meds, products: productMatches };
}

/** Every match not set aside, medicines grouped with their code and name matches apart. */
export async function getRecallMatches(): Promise<RecallMatches> {
  const [{ meds, products }, checked] = await Promise.all([allMatches(), checkedKeys()]);
  let setAside = 0;
  const keep = (m: RecallMatch) => {
    if (checked.has(matchKey(m))) {
      setAside++;
      return false;
    }
    return true;
  };
  const medicines: MedicineRecalls[] = [];
  for (const { med, matches } of meds) {
    const shown = sortMatches(matches.filter(keep));
    if (shown.length === 0) continue;
    medicines.push({
      treatmentId: med.id,
      name: med.name,
      treatmentType: med.treatmentType,
      hasLabel: med.hasLabel,
      byCode: shown.filter((m) => m.strength === 'code'),
      byName: shown.filter((m) => m.strength === 'name'),
    });
  }
  return { medicines, products: sortMatches(products.filter(keep)), setAside };
}

/** Matches for one scanned product, for its own screen. */
export async function getProductRecallMatches(productId: number): Promise<RecallMatch[]> {
  const { products } = await getRecallMatches();
  return products.filter((m) => m.ownerId === String(productId));
}

/** The ids of scanned products with a match not set aside, for My Food Products. */
export async function scannedProductIdsWithRecalls(): Promise<Set<string>> {
  if (!(await isRecallCheckOn())) return new Set();
  const { products } = await getRecallMatches();
  return new Set(products.map((m) => m.ownerId));
}

export async function setAsideRecalls(matches: RecallMatch[]): Promise<void> {
  const db = await getDatabase();
  const at = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const m of matches) {
      await db.runAsync(
        `INSERT OR IGNORE INTO recall_checks (recall_number, owner_kind, owner_id, checked_at) VALUES (?, ?, ?, ?)`,
        m.recall.recallNumber,
        m.ownerKind,
        m.ownerId,
        at,
      );
    }
  });
}

export async function bringBackSetAside(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recall_checks');
}

// --- The notification ----------------------------------------------------

// Matches not raised before. The first read raises nothing, since the person
// turning the check on is looking at the band that lists them; it only
// writes them down so the next read knows what is new.
async function takeNewMatches(firstRead: boolean): Promise<RecallMatch[]> {
  const { meds, products } = await allMatches();
  const checked = await checkedKeys();
  const current = [...meds.flatMap((m) => m.matches), ...products].filter((m) => !checked.has(matchKey(m)));
  let seen: Set<string>;
  try {
    seen = new Set(JSON.parse((await readMeta(NOTIFIED_KEY)) ?? '[]') as string[]);
  } catch {
    seen = new Set();
  }
  const fresh = firstRead ? [] : current.filter((m) => !seen.has(matchKey(m)));
  // Only what still matches is remembered, so the note stays the size of the list.
  await writeMeta(NOTIFIED_KEY, JSON.stringify(current.map(matchKey)));
  return fresh;
}

async function notifyMatches(matches: RecallMatch[]): Promise<void> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) return;
    const onlyFoods = matches.every((m) => m.ownerKind === 'scanned_product');
    await Notifications.scheduleNotificationAsync({
      identifier: `${RECALL_NOTIFICATION_PREFIX}-${Date.now()}`,
      content: {
        ...reminderWords('recall', notificationTitle(matches), notificationBody(matches), reminderDetailHidden()),
        data: { kind: 'recall', target: onlyFoods ? 'foods' : 'meds' },
        sound: true,
      },
      trigger: Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null,
    });
  } catch {
    // The band still lists every match; a notification that could not be
    // raised is not retried.
  }
}
