// The reads and writes behind an Ecowitt gateway on the home network (I20,
// 2026-09-28). What the gateway's answer means is decided in
// lib/ecowittLocal.ts, which is pure; this file asks the gateway, stores
// what it said, and keeps the gateway's settings.
//
// A reading goes where a controller's history file goes: each figure into
// garden_device_samples under the sensor's device name, then the hours and
// the day worked out from everything held (reworkDeviceFigures in
// lib/growingConditionsDb.ts). Working those out rewrites rows that travel
// to the other device, so it is done when the hour turns over, on the first
// reading of a run, and when the app is put away, rather than after every
// reading, which would have sync save a snapshot every minute.

import { getDatabase } from './db';
import { getDesktopBridge, isDesktopApp } from './desktop/bridge';
import {
  DEFAULT_POLL_MINUTES,
  describeRead,
  isDue,
  liveDataUrl,
  momentOf,
  NOT_A_GATEWAY_ADVICE,
  readLiveData,
  sensorDeviceName,
  UNREACHABLE_ADVICE,
  type GatewayRead,
} from './ecowittLocal';
import { reworkDeviceFigures, storeDeviceSamples } from './growingConditionsDb';
import { deviceKeyOf, type Sample } from './readingImport';

export type Gateway = { id: string; name: string; host: string; createdAt: string; updatedAt: string };

export type GatewaySensorSetting = {
  id: string;
  gatewayId: string;
  sensorKey: string;
  label: string;
  deviceName: string;
  plotId: string | null;
  plantingId: string | null;
  probeMeasurement: string | null;
  kept: boolean;
};

export type GatewayPolling = {
  readingOn: boolean;
  everyMinutes: number;
  lastAttemptAt: string | null;
  lastReadAt: string | null;
  lastProblem: string | null;
  lastLine: string | null;
  unworkedFrom: string | null;
};

export type GatewayWithSettings = { gateway: Gateway; sensors: GatewaySensorSetting[]; polling: GatewayPolling };

const NO_POLLING: GatewayPolling = {
  readingOn: false,
  everyMinutes: DEFAULT_POLL_MINUTES,
  lastAttemptAt: null,
  lastReadAt: null,
  lastProblem: null,
  lastLine: null,
  unworkedFrom: null,
};

const FETCH_TIMEOUT_MS = 8000;

function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function sensorRowId(gatewayId: string, sensorKey: string): string {
  return `${gatewayId}:${sensorKey}`;
}

function localDay(date: Date): string {
  return momentOf(date).slice(0, 10);
}

export async function listGateways(): Promise<GatewayWithSettings[]> {
  const db = await getDatabase();
  const gateways = await db.getAllAsync<Gateway>(
    'SELECT id, name, host, created_at AS createdAt, updated_at AS updatedAt FROM garden_gateways ORDER BY name COLLATE NOCASE',
  );
  const sensorRows = await db.getAllAsync<{
    id: string;
    gatewayId: string;
    sensorKey: string;
    label: string;
    deviceName: string;
    plotId: string | null;
    plantingId: string | null;
    probeMeasurement: string | null;
    kept: number;
  }>(
    `SELECT id, gateway_id AS gatewayId, sensor_key AS sensorKey, label, device_name AS deviceName, plot_id AS plotId,
            planting_id AS plantingId, probe_measurement AS probeMeasurement, kept
       FROM garden_gateway_sensors`,
  );
  const pollingRows = await db.getAllAsync<{
    gatewayId: string;
    readingOn: number;
    everyMinutes: number;
    lastAttemptAt: string | null;
    lastReadAt: string | null;
    lastProblem: string | null;
    lastLine: string | null;
    unworkedFrom: string | null;
  }>(
    `SELECT gateway_id AS gatewayId, reading_on AS readingOn, every_minutes AS everyMinutes, last_attempt_at AS lastAttemptAt,
            last_read_at AS lastReadAt, last_problem AS lastProblem, last_line AS lastLine, unworked_from AS unworkedFrom
       FROM garden_gateway_polling`,
  );
  return gateways.map((gateway) => {
    const polling = pollingRows.find((row) => row.gatewayId === gateway.id);
    return {
      gateway,
      sensors: sensorRows.filter((row) => row.gatewayId === gateway.id).map((row) => ({ ...row, kept: row.kept === 1 })),
      polling: polling ? { ...polling, readingOn: polling.readingOn === 1 } : NO_POLLING,
    };
  });
}

/** Adds a gateway, or renames or readdresses one. A new gateway is read on
 *  the device that added it. */
export async function saveGateway(input: { id?: string; name: string; host: string }): Promise<string> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  if (input.id) {
    await db.runAsync('UPDATE garden_gateways SET name = ?, host = ?, updated_at = ? WHERE id = ?', input.name.trim(), input.host, now, input.id);
    return input.id;
  }
  const id = newId('gateway_');
  await db.runAsync(
    'INSERT INTO garden_gateways (id, name, host, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    id,
    input.name.trim(),
    input.host,
    now,
    now,
  );
  await setGatewayPolling(id, { readingOn: true });
  return id;
}

/** Removes a gateway and its settings. What it read stays: the readings
 *  carry their own device name and area, and nothing points back here. */
export async function deleteGateway(id: string): Promise<void> {
  await workOutGateway(id);
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM garden_gateway_sensors WHERE gateway_id = ?', id);
    await db.runAsync('DELETE FROM garden_gateway_polling WHERE gateway_id = ?', id);
    await db.runAsync('DELETE FROM garden_gateways WHERE id = ?', id);
  });
}

/** Where one sensor's figures go. The device name is set when the row is
 *  first made and never after. */
export async function saveGatewaySensor(input: {
  gateway: Gateway;
  sensorKey: string;
  label: string;
  plotId: string | null;
  plantingId: string | null;
  probeMeasurement: string | null;
  kept: boolean;
}): Promise<void> {
  const db = await getDatabase();
  const id = sensorRowId(input.gateway.id, input.sensorKey);
  const now = new Date().toISOString();
  const held = await db.getFirstAsync<{ plotId: string | null; plantingId: string | null; deviceName: string }>(
    'SELECT plot_id AS plotId, planting_id AS plantingId, device_name AS deviceName FROM garden_gateway_sensors WHERE id = ?',
    id,
  );
  if (held) {
    // Work out what was read for the old area before the sensor moves, so
    // the hours up to now stay with where the sensor was.
    if (held.plotId !== input.plotId || held.plantingId !== input.plantingId) {
      await workOutGateway(input.gateway.id);
    }
    await db.runAsync(
      `UPDATE garden_gateway_sensors SET label = ?, plot_id = ?, planting_id = ?, probe_measurement = ?, kept = ?, updated_at = ? WHERE id = ?`,
      input.label,
      input.plotId,
      input.plantingId,
      input.probeMeasurement,
      input.kept ? 1 : 0,
      now,
      id,
    );
    return;
  }
  await db.runAsync(
    `INSERT INTO garden_gateway_sensors
       (id, gateway_id, sensor_key, label, device_name, plot_id, planting_id, probe_measurement, kept, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.gateway.id,
    input.sensorKey,
    input.label,
    sensorDeviceName(input.gateway.name, input.label),
    input.plotId,
    input.plantingId,
    input.probeMeasurement,
    input.kept ? 1 : 0,
    now,
  );
}

export async function setGatewayPolling(gatewayId: string, change: { readingOn?: boolean; everyMinutes?: number }): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO garden_gateway_polling (gateway_id, reading_on, every_minutes) VALUES (?, 0, ?)',
    gatewayId,
    DEFAULT_POLL_MINUTES,
  );
  if (change.readingOn !== undefined) {
    await db.runAsync('UPDATE garden_gateway_polling SET reading_on = ? WHERE gateway_id = ?', change.readingOn ? 1 : 0, gatewayId);
  }
  if (change.everyMinutes !== undefined) {
    await db.runAsync('UPDATE garden_gateway_polling SET every_minutes = ? WHERE gateway_id = ?', change.everyMinutes, gatewayId);
  }
  if (change.readingOn === false) await workOutGateway(gatewayId);
}

/** Asks the gateway at an address what its sensors read. Rejects with a
 *  sentence a person can act on. */
export async function fetchGateway(host: string): Promise<GatewayRead> {
  const url = liveDataUrl(host);
  let text: string;
  try {
    if (isDesktopApp()) {
      const web = getDesktopBridge().web;
      if (!web) throw new Error('This version of the desktop app cannot reach a gateway. Install the newest one.');
      text = (await web.fetchPage(url)).text;
    } else {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`Something at ${host} answered, but with error ${response.status} rather than readings. ${NOT_A_GATEWAY_ADVICE}`);
        text = await response.text();
      } finally {
        clearTimeout(timer);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/abort|longer than/i.test(message) || (error instanceof Error && error.name === 'AbortError')) {
      throw new Error(`Nothing at ${host} answered within ${FETCH_TIMEOUT_MS / 1000} seconds. ${UNREACHABLE_ADVICE}`);
    }
    if (/network request failed|ECONNREFUSED|EHOSTUNREACH|ENOTFOUND|ETIMEDOUT|fetch failed/i.test(message)) {
      throw new Error(`Nothing at ${host} could be reached. ${UNREACHABLE_ADVICE}`);
    }
    throw error instanceof Error ? error : new Error(message);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Something at ${host} answered, but not the way an Ecowitt gateway does. ${NOT_A_GATEWAY_ADVICE}`);
  }
  const read = readLiveData(json);
  if (!read) throw new Error(`Something at ${host} answered, but not the way an Ecowitt gateway does. ${NOT_A_GATEWAY_ADVICE}`);
  return read;
}

/** Gateways worked out at least once since the app started, so the first
 *  reading of a run also works out what an earlier run left unworked. */
const workedThisRun = new Set<string>();

function hourOf(stamp: string | null): string | null {
  if (!stamp) return null;
  const date = new Date(stamp);
  return Number.isFinite(date.getTime()) ? momentOf(date).slice(0, 13) : null;
}

/** Reads one gateway now and keeps what its set-up sensors reported. */
export type GatewayReadResult = { line: string; read: GatewayRead | null };

export async function readGatewayNow(gatewayId: string, now: Date = new Date()): Promise<GatewayReadResult> {
  const db = await getDatabase();
  const all = await listGateways();
  const entry = all.find((item) => item.gateway.id === gatewayId);
  if (!entry) return { line: '', read: null };
  const { gateway, sensors, polling } = entry;
  const attemptAt = now.toISOString();
  await db.runAsync(
    'INSERT OR IGNORE INTO garden_gateway_polling (gateway_id, reading_on, every_minutes) VALUES (?, 0, ?)',
    gatewayId,
    DEFAULT_POLL_MINUTES,
  );

  let read: GatewayRead;
  try {
    read = await fetchGateway(gateway.host);
  } catch (error) {
    const problem = error instanceof Error ? error.message : String(error);
    await db.runAsync(
      'UPDATE garden_gateway_polling SET last_attempt_at = ?, last_problem = ? WHERE gateway_id = ?',
      attemptAt,
      problem,
      gatewayId,
    );
    return { line: problem, read: null };
  }

  const areas = await db.getAllAsync<{ id: string }>('SELECT id FROM garden_plots WHERE archived_at IS NULL');
  const areaIds = new Set(areas.map((area) => area.id));
  const moment = momentOf(now);
  let kept = 0;
  let areaGone = 0;
  for (const sensor of sensors) {
    if (!sensor.kept) continue;
    if (sensor.plotId && !areaIds.has(sensor.plotId)) {
      areaGone += 1;
      continue;
    }
    const samples: Sample[] = read.figures
      .filter((figure) => figure.sensorKey === sensor.sensorKey)
      .map((figure) => ({
        measurement: figure.measurement === 'soil_temperature' && sensor.probeMeasurement ? sensor.probeMeasurement : figure.measurement,
        unit: figure.unit,
        at: moment,
        value: figure.value,
      }));
    if (samples.length === 0) continue;
    await storeDeviceSamples(samples, { plotId: sensor.plotId, plantingId: sensor.plantingId, deviceName: sensor.deviceName });
    kept += samples.length;
  }
  const waiting = read.sensors.filter((sensor) => !sensors.some((setting) => setting.sensorKey === sensor.key)).length;
  const parts = [describeRead(read, kept)];
  if (waiting > 0) parts.push(`${waiting} ${waiting === 1 ? 'sensor has' : 'sensors have'} not been given an area yet.`);
  if (areaGone > 0) parts.push(`${areaGone} ${areaGone === 1 ? 'sensor goes' : 'sensors go'} to an area that has been removed, so ${areaGone === 1 ? 'its figures were' : 'their figures were'} not kept. Pick another area for ${areaGone === 1 ? 'it' : 'them'}.`);
  const line = parts.join(' ');

  const today = localDay(now);
  const unworkedFrom = kept > 0 ? (polling.unworkedFrom && polling.unworkedFrom < today ? polling.unworkedFrom : today) : polling.unworkedFrom;
  await db.runAsync(
    `UPDATE garden_gateway_polling SET last_attempt_at = ?, last_read_at = ?, last_problem = NULL, last_line = ?, unworked_from = ? WHERE gateway_id = ?`,
    attemptAt,
    attemptAt,
    line,
    unworkedFrom,
    gatewayId,
  );

  const hourTurned = hourOf(polling.lastReadAt) !== moment.slice(0, 13);
  if (!workedThisRun.has(gatewayId) || hourTurned) {
    // The first reading of a run also covers the day before, where an
    // earlier run may have been closed before it worked anything out.
    if (!workedThisRun.has(gatewayId)) {
      const yesterday = new Date(now.getTime() - 86_400_000);
      const fromDay = localDay(yesterday);
      await db.runAsync(
        'UPDATE garden_gateway_polling SET unworked_from = ? WHERE gateway_id = ? AND (unworked_from IS NULL OR unworked_from > ?)',
        fromDay,
        gatewayId,
        fromDay,
      );
    }
    await workOutGateway(gatewayId, now);
    workedThisRun.add(gatewayId);
  }
  return { line, read };
}

/** Works out the hours and days for everything a gateway read that has
 *  not been worked out yet. */
export async function workOutGateway(gatewayId: string, now: Date = new Date()): Promise<void> {
  const db = await getDatabase();
  const polling = await db.getFirstAsync<{ unworkedFrom: string | null }>(
    'SELECT unworked_from AS unworkedFrom FROM garden_gateway_polling WHERE gateway_id = ?',
    gatewayId,
  );
  const from = polling?.unworkedFrom;
  if (!from) return;
  const today = localDay(now);
  const sensors = await db.getAllAsync<{ plotId: string | null; plantingId: string | null; deviceName: string }>(
    'SELECT plot_id AS plotId, planting_id AS plantingId, device_name AS deviceName FROM garden_gateway_sensors WHERE gateway_id = ?',
    gatewayId,
  );
  for (const sensor of sensors) {
    const held = await db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) AS n FROM garden_device_samples
        WHERE plot_id = ? AND planting_id = ? AND device_key = ? AND measured_at >= ?`,
      sensor.plotId ?? '',
      sensor.plantingId ?? '',
      deviceKeyOf(sensor.deviceName),
      from,
    );
    if (!held || held.n === 0) continue;
    await reworkDeviceFigures(sensor, from, today);
  }
  await db.runAsync('UPDATE garden_gateway_polling SET unworked_from = NULL WHERE gateway_id = ?', gatewayId);
}

/** Reads every gateway this device reads that is due. */
export async function readDueGateways(now: Date = new Date()): Promise<boolean> {
  const all = await listGateways();
  let readAny = false;
  for (const { gateway, polling } of all) {
    if (!polling.readingOn || !isDue(polling.lastAttemptAt, polling.everyMinutes, now)) continue;
    await readGatewayNow(gateway.id, now);
    readAny = true;
  }
  return readAny;
}

/** Works out every gateway this device reads, for when the app is put away. */
export async function workOutAllGateways(): Promise<void> {
  const all = await listGateways();
  for (const { gateway, polling } of all) {
    if (polling.unworkedFrom) await workOutGateway(gateway.id);
  }
}

/** Whether any gateway is read on this device, so the poller can stay idle. */
export async function anyGatewayReadHere(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM garden_gateway_polling WHERE reading_on = 1');
  return (row?.n ?? 0) > 0;
}
