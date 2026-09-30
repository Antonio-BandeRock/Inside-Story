// Reading and writing injection sites (A4). Which spot comes next and every
// sentence about it are in lib/injectionSites.ts.
//
// recorded_at is the LOCAL date and time ('YYYY-MM-DDTHH:MM'), never a UTC
// ISO string, so an evening shot west of Greenwich stays on its own day
// (the local-day rule CLAUDE.md records for the Keeping Up tables).

import { getDatabase } from './db';
import { parseRotation, type InjectionSite, type SiteUse } from './injectionSites';

export type InjectionSetting = { injected: boolean | null; rotation: InjectionSite[] | null };

type SettingRow = { treatment_id: string; injected: number | null; sites: string | null };
type UseRow = { id: string; treatment_id: string; schedule_item_id: string | null; site_key: string; site_label: string; recorded_at: string };

export function localStamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function listInjectionSettings(): Promise<Map<string, InjectionSetting>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SettingRow>('SELECT treatment_id, injected, sites FROM treatment_injection');
  return new Map(
    rows.map((row) => [row.treatment_id, { injected: row.injected === null ? null : row.injected === 1, rotation: parseRotation(row.sites) }]),
  );
}

export async function saveInjectionSetting(treatmentId: string, setting: InjectionSetting): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO treatment_injection (treatment_id, injected, sites, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(treatment_id) DO UPDATE SET injected = excluded.injected, sites = excluded.sites, updated_at = excluded.updated_at`,
    treatmentId,
    setting.injected === null ? null : setting.injected ? 1 : 0,
    setting.rotation ? JSON.stringify(setting.rotation) : null,
    now,
    now,
  );
}

// Every med's shots, keyed by treatment id, newest first.
export async function listSiteHistory(): Promise<Map<string, SiteUse[]>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<UseRow>(
    'SELECT id, treatment_id, schedule_item_id, site_key, site_label, recorded_at FROM dose_sites ORDER BY recorded_at DESC',
  );
  const byTreatment = new Map<string, SiteUse[]>();
  for (const row of rows) {
    const list = byTreatment.get(row.treatment_id) ?? [];
    list.push({ id: row.id, siteKey: row.site_key, siteLabel: row.site_label, recordedAt: row.recorded_at, scheduleItemId: row.schedule_item_id });
    byTreatment.set(row.treatment_id, list);
  }
  return byTreatment;
}

// One shot at one spot. A scheduled dose keeps at most one site: noting it
// again replaces the spot rather than adding a second shot.
export async function recordSite(input: {
  treatmentId: string;
  site: InjectionSite;
  scheduleItemId?: string | null;
  recordedAt?: string;
}): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const recordedAt = input.recordedAt ?? localStamp();
  const id = input.scheduleItemId
    ? `site_${input.scheduleItemId}`
    : `site_${input.treatmentId}_${recordedAt.replace(/[^0-9]/g, '')}_${Math.random().toString(36).slice(2, 7)}`;
  await db.runAsync(
    `INSERT INTO dose_sites (id, treatment_id, schedule_item_id, site_key, site_label, recorded_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET site_key = excluded.site_key, site_label = excluded.site_label, updated_at = excluded.updated_at`,
    id,
    input.treatmentId,
    input.scheduleItemId ?? null,
    input.site.key,
    input.site.label,
    recordedAt,
    now,
    now,
  );
}

// Taking back a shot noted by mistake.
export async function removeSiteUse(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM dose_sites WHERE id = ?', id);
}
