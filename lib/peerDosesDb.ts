// A16, the records behind letting somebody you are linked with know when a
// dose is not marked. Both sides live here:
//
//   Sending: this phone's doses around now, read only when a yes was given
//   on this phone for that connection (dose_watch_consent) and Doses is
//   granted. The part itself is built by lib/doseWatch.ts.
//
//   Watching: the latest doses somebody sent (peer_dose_watch, replaced on
//   every arrival, since their send is their state) and the alerts this
//   phone has queued or raised about them (peer_dose_alerts), so one dose
//   is said once. Both stay on this device (DEVICE_LOCAL_TABLES).
//
// The alerts are local notifications on this phone, queued the moment an
// update arrives. They are only as timely as the updates: nothing here can
// hear about a dose between two updates, which is what the relay (M1) is
// for.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Connection } from './connections';
import { getDatabase } from './db';
import {
  DOSE_WATCH_AHEAD_HOURS,
  DOSE_WATCH_BACK_HOURS,
  PEER_DOSE_PREFIX,
  alertBody,
  alertTitle,
  cleanPeerDosePart,
  peerDoseItems,
  planDoseAlerts,
  type DoseConsentKind,
  type PeerDose,
  type PeerDosePart,
} from './doseWatch';
import { holdOn } from './peerRelationships';
import { instantInZone, parseTravelMode } from './travelTime';
import { getHomeZone } from './travelTimeDb';

const ALERTS_KEY = 'dose_watch_alerts';
// The same channel as this phone's own dose reminders ('Reminders' in
// lib/reminderNotifications.ts, which creates it).
const ANDROID_CHANNEL_ID = 'reminders';
const MED_TYPES = ['supplement', 'prescription', 'otc'];

// ---------------------------------------------------------------------------
// The yes
// ---------------------------------------------------------------------------

export type DoseConsent = { kind: DoseConsentKind; givenAt: string };

export async function getDoseConsents(): Promise<Map<string, DoseConsent>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ connection_id: string; given_as: string; given_at: string }>(
    'SELECT connection_id, given_as, given_at FROM dose_watch_consent',
  );
  const out = new Map<string, DoseConsent>();
  for (const row of rows) {
    out.set(row.connection_id, { kind: row.given_as === 'attested' ? 'attested' : 'self', givenAt: row.given_at });
  }
  return out;
}

export async function giveDoseConsent(connectionId: string, kind: DoseConsentKind): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO dose_watch_consent (connection_id, given_as, given_at) VALUES (?, ?, ?)
     ON CONFLICT(connection_id) DO UPDATE SET given_as = excluded.given_as, given_at = excluded.given_at`,
    connectionId,
    kind,
    new Date().toISOString(),
  );
}

export async function withdrawDoseConsent(connectionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM dose_watch_consent WHERE connection_id = ?', connectionId);
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

/**
 * This phone's doses for one connection, or undefined when none may go.
 * lib/partnerSync.ts turns undefined into null for a link that carries
 * doses, which tells the other phone to clear its copy.
 */
export async function peerDosePartFor(partner: Connection): Promise<PeerDosePart | undefined> {
  if (!partner.grants.doses || !holdOn(partner.role, 'doses')) return undefined;
  const db = await getDatabase();
  const consent = await db.getFirstAsync<{ connection_id: string }>(
    'SELECT connection_id FROM dose_watch_consent WHERE connection_id = ?',
    partner.id,
  );
  if (!consent) return undefined;

  const now = Date.now();
  // Local wall-clock days, a day wider than the window at each end, since a
  // dose kept on home time can sit a day either side once moved.
  const day = (ms: number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const from = day(now - (DOSE_WATCH_BACK_HOURS + 24) * 3600_000);
  const to = day(now + (DOSE_WATCH_AHEAD_HOURS + 24) * 3600_000);
  const rows = await db.getAllAsync<{
    id: string;
    name: string | null;
    title: string | null;
    scheduledFor: string;
    status: string | null;
    updatedAt: string | null;
    travelMode: string | null;
  }>(
    `SELECT s.id, t.name, s.title, s.scheduled_for AS scheduledFor, s.status, s.updated_at AS updatedAt,
        (SELECT tm.mode FROM treatment_time_mode tm WHERE tm.treatment_id = t.id) AS travelMode
     FROM schedule_items s
     JOIN treatments t ON t.id = s.linked_treatment_id
     WHERE s.item_type IN (${MED_TYPES.map(() => '?').join(', ')})
       AND t.active = 1
       AND substr(s.scheduled_for, 1, 10) BETWEEN ? AND ?`,
    ...MED_TYPES,
    from,
    to,
  );
  const homeZone = await getHomeZone().catch(() => null);
  return {
    items: peerDoseItems(
      rows.map((row) => {
        // A med kept on home time is due at that clock time in the home
        // zone; everything else at that clock time wherever this phone is.
        const home = homeZone && parseTravelMode(row.travelMode) === 'home' ? instantInZone(row.scheduledFor, homeZone) : null;
        const local = Date.parse(row.scheduledFor);
        return {
          id: row.id,
          name: row.name ?? row.title ?? '',
          dueAtMs: home ?? (Number.isNaN(local) ? null : local),
          status: row.status,
          markedAt: row.updatedAt,
        };
      }),
      now,
    ),
  };
}

// ---------------------------------------------------------------------------
// Watching
// ---------------------------------------------------------------------------

/** Stores what arrived and settles the alerts. True when anything changed. */
export async function applyPeerDoses(connectionId: string, payload: { doses?: unknown; sentAt: string }): Promise<boolean> {
  const part = cleanPeerDosePart(payload.doses);
  if (part === undefined) return false;
  const db = await getDatabase();
  if (part === null) {
    const had = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM peer_dose_watch WHERE connection_id = ?', connectionId);
    await clearPeerDoses(connectionId, { keepConsent: true });
    return (had?.n ?? 0) > 0;
  }
  const json = JSON.stringify(part.items);
  const before = await db.getFirstAsync<{ doses_json: string }>('SELECT doses_json FROM peer_dose_watch WHERE connection_id = ?', connectionId);
  await db.runAsync(
    `INSERT INTO peer_dose_watch (connection_id, sent_at, doses_json, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(connection_id) DO UPDATE SET sent_at = excluded.sent_at, doses_json = excluded.doses_json, updated_at = excluded.updated_at`,
    connectionId,
    payload.sentAt,
    json,
    new Date().toISOString(),
  );
  await reconcileDoseAlerts().catch(() => undefined);
  return before?.doses_json !== json;
}

export type WatchedPerson = { connectionId: string; name: string; sentAt: string; doses: PeerDose[] };

export async function listDoseWatch(): Promise<WatchedPerson[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ connection_id: string; name: string; sent_at: string; doses_json: string }>(
    `SELECT w.connection_id, c.name, w.sent_at, w.doses_json
     FROM peer_dose_watch w JOIN connections c ON c.id = w.connection_id
     ORDER BY c.name COLLATE NOCASE ASC`,
  );
  return rows.map((row) => {
    let doses: PeerDose[] = [];
    try {
      doses = cleanPeerDosePart({ items: JSON.parse(row.doses_json) })?.items ?? [];
    } catch {
      doses = [];
    }
    return { connectionId: row.connection_id, name: row.name, sentAt: row.sent_at, doses };
  });
}

export async function getDoseWatchAlertsOn(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', ALERTS_KEY);
  return row?.value !== '0';
}

export async function setDoseWatchAlertsOn(on: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ALERTS_KEY,
    on ? '1' : '0',
    new Date().toISOString(),
  );
  await reconcileDoseAlerts().catch(() => undefined);
}

function identifierFor(connectionId: string, doseId: string): string {
  return `${PEER_DOSE_PREFIX}${connectionId}:${doseId}`;
}

/** Queues and takes back alerts to match what every watched person last sent. */
export async function reconcileDoseAlerts(): Promise<void> {
  const db = await getDatabase();
  const enabled = await getDoseWatchAlertsOn();
  const people = await listDoseWatch();
  const alertRows = await db.getAllAsync<{ connection_id: string; dose_id: string; fire_at: string }>(
    'SELECT connection_id, dose_id, fire_at FROM peer_dose_alerts',
  );
  const now = Date.now();
  let permitted: boolean | null = null;

  for (const person of people) {
    const alerted = new Map<string, number>();
    for (const row of alertRows) if (row.connection_id === person.connectionId) alerted.set(row.dose_id, Date.parse(row.fire_at));
    const plan = planDoseAlerts({ doses: person.doses, nowMs: now, alerted, enabled });

    for (const doseId of plan.cancel) {
      await Notifications.cancelScheduledNotificationAsync(identifierFor(person.connectionId, doseId)).catch(() => undefined);
      await db.runAsync('DELETE FROM peer_dose_alerts WHERE connection_id = ? AND dose_id = ?', person.connectionId, doseId);
    }
    if (plan.schedule.length === 0) continue;
    if (permitted === null) {
      const settings = await Notifications.getPermissionsAsync().catch(() => null);
      permitted = settings?.granted === true;
    }
    if (!permitted) continue;
    for (const { doseId, fireAtMs } of plan.schedule) {
      const dose = person.doses.find((entry) => entry.id === doseId);
      if (!dose) continue;
      const identifier = identifierFor(person.connectionId, doseId);
      const content = {
        title: alertTitle(person.name, dose),
        body: alertBody(person.name, dose, person.sentAt, now),
        data: { kind: 'peerDose', connectionId: person.connectionId },
        sound: true,
      };
      try {
        await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);
        if (fireAtMs <= now + 5_000) {
          await Notifications.scheduleNotificationAsync({
            identifier,
            content,
            trigger: Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null,
          });
        } else {
          await Notifications.scheduleNotificationAsync({
            identifier,
            content,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(fireAtMs),
              ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
            },
          });
        }
        await db.runAsync(
          `INSERT INTO peer_dose_alerts (connection_id, dose_id, fire_at) VALUES (?, ?, ?)
           ON CONFLICT(connection_id, dose_id) DO UPDATE SET fire_at = excluded.fire_at`,
          person.connectionId,
          doseId,
          new Date(fireAtMs).toISOString(),
        );
      } catch {
        // A notification that could not be queued is tried again on the
        // next arrival, since nothing was recorded for it.
      }
    }
  }

  // Alerts older than anything a person could still send are forgotten, so
  // the table does not grow for ever.
  const cutoff = new Date(now - (DOSE_WATCH_BACK_HOURS + 24) * 3600_000).toISOString();
  await db.runAsync('DELETE FROM peer_dose_alerts WHERE fire_at < ?', cutoff);
}

/** Everything held about one connection's doses, when they are removed or stop sharing. */
export async function clearPeerDoses(connectionId: string, options?: { keepConsent?: boolean }): Promise<void> {
  const db = await getDatabase();
  const queued = await db.getAllAsync<{ dose_id: string; fire_at: string }>(
    'SELECT dose_id, fire_at FROM peer_dose_alerts WHERE connection_id = ?',
    connectionId,
  );
  const now = Date.now();
  for (const row of queued) {
    if (Date.parse(row.fire_at) > now) {
      await Notifications.cancelScheduledNotificationAsync(identifierFor(connectionId, row.dose_id)).catch(() => undefined);
    }
  }
  await db.runAsync('DELETE FROM peer_dose_alerts WHERE connection_id = ?', connectionId);
  await db.runAsync('DELETE FROM peer_dose_watch WHERE connection_id = ?', connectionId);
  if (!options?.keepConsent) await withdrawDoseConsent(connectionId);
}
