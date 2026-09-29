// Reading AC Infinity controllers through the account they report to (I23,
// 2026-09-28).
//
// AC Infinity has published no way for another app to read a controller.
// The AC Infinity phone app signs in to www.acinfinityserver.com and asks
// for every controller on the account with its latest readings, and the
// Home Assistant community integration (dalinicus/homeassistant-acinfinity)
// worked out that exchange: POST /api/user/appUserLogin with appEmail and
// appPasswordl (the field is spelled that way), which answers data.appId,
// then POST /api/user/devInfoListAll with userId set to that id and a token
// header holding it. Both answer { code, msg, data }, where code 200 is
// success. It is undocumented, so it can change without notice; the band
// says so, and this is off until somebody adds an account and agrees to
// send their email and password to AC Infinity.
//
// This file is pure: the answer's JSON in, figures out, so
// scripts/test_ecowitt_local.js can run it without a phone. The reading
// and keeping share everything with the Ecowitt gateway (lib/ecowittDb.ts):
// an account is a row in garden_gateways with method 'cloud' and the email
// as its host, and each controller's probe and port sensor is a sensor there
// given an area the same way.
//
// How figures come back, per the integration: a controller's own
// deviceInfo.temperature (°C), humidity (%) and vpdnums (kPa) are whole
// numbers a hundred times the figure; a sensor in deviceInfo.sensors carries
// sensorType, accessPort, sensorData and sensorPrecision, where the figure
// is sensorData / 10^(precision - 1) when the precision is above 1.

import { couldBeRead } from './readingImport';
import type { GatewayFigure, GatewayRead, GatewaySensor } from './ecowittLocal';

export const AC_HOST = 'https://www.acinfinityserver.com';
export const AC_LOGIN_PATH = '/api/user/appUserLogin';
export const AC_DEVICES_PATH = '/api/user/devInfoListAll';
/** The header the AC Infinity app's HTTP library sends; the server is known
 *  to answer it. */
export const AC_USER_AGENT = 'okhttp/4.12.0';
/** The AC Infinity app cuts a password to 25 characters before sending it,
 *  and the server holds it that way, so it is cut here too. */
export const AC_PASSWORD_LIMIT = 25;

export function loginForm(email: string, password: string): Record<string, string> {
  return { appEmail: email.trim(), appPasswordl: password.slice(0, AC_PASSWORD_LIMIT) };
}

export function devicesForm(userId: string): Record<string, string> {
  return { userId };
}

export function formEncode(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

type Entry = Record<string, unknown>;

function isEntry(value: unknown): value is Entry {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function num(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

/** What one answer from AC Infinity says: its data when code is 200, or
 *  the reason it gave. */
export function answerOf(json: unknown): { ok: true; data: unknown } | { ok: false; reason: string } {
  if (!isEntry(json) || !('code' in json)) return { ok: false, reason: 'AC Infinity answered in a way Inside Story does not recognise.' };
  if (num(json.code) === 200) return { ok: true, data: json.data };
  const msg = typeof json.msg === 'string' && json.msg.trim() ? json.msg.trim() : `code ${String(json.code)}`;
  return { ok: false, reason: msg };
}

/** The id the sign-in hands back, which the device list is asked with. */
export function userIdOf(data: unknown): string | null {
  if (!isEntry(data)) return null;
  const id = data.appId;
  if (typeof id === 'string' && id.trim()) return id.trim();
  if (typeof id === 'number' && Number.isFinite(id)) return String(id);
  return null;
}

/** The AC Infinity sensor types, as the integration names them. */
export const AC_SENSOR_TYPE = {
  PROBE_TEMPERATURE_F: 0,
  PROBE_TEMPERATURE_C: 1,
  PROBE_HUMIDITY: 2,
  PROBE_VPD: 3,
  CONTROLLER_TEMPERATURE_F: 4,
  CONTROLLER_TEMPERATURE_C: 5,
  CONTROLLER_HUMIDITY: 6,
  CONTROLLER_VPD: 7,
  SOIL: 10,
  CO2: 11,
  LIGHT: 12,
  HYDRO_PH: 13,
  HYDRO_EC_US: 14,
  HYDRO_EC_MS: 15,
  HYDRO_TDS_PPM: 16,
  HYDRO_TDS_PPT: 17,
  HYDRO_WATER_TEMPERATURE_F: 18,
  HYDRO_WATER_TEMPERATURE_C: 19,
  WATER: 20,
} as const;

const T = AC_SENSOR_TYPE;

/** A sensor's figure, scaled by its precision. */
export function sensorValue(data: unknown, precision: unknown): number | null {
  const value = num(data);
  if (value === null) return null;
  const places = num(precision);
  return places !== null && places > 1 ? value / 10 ** (places - 1) : value;
}

/** What a sensor type becomes in Garden, or the plain name it is left out
 *  under. */
function measurementOf(type: number): { measurement: string; unit: string } | { notKept: string } | null {
  switch (type) {
    case T.PROBE_TEMPERATURE_F:
    case T.CONTROLLER_TEMPERATURE_F:
      return { measurement: 'air_temperature', unit: '°F' };
    case T.PROBE_TEMPERATURE_C:
    case T.CONTROLLER_TEMPERATURE_C:
      return { measurement: 'air_temperature', unit: '°C' };
    case T.PROBE_HUMIDITY:
    case T.CONTROLLER_HUMIDITY:
      return { measurement: 'humidity', unit: '%' };
    case T.PROBE_VPD:
    case T.CONTROLLER_VPD:
      return { measurement: 'vpd', unit: 'kPa' };
    case T.SOIL:
      return { measurement: 'soil_moisture', unit: '%' };
    case T.CO2:
      return { measurement: 'co2', unit: 'ppm' };
    case T.LIGHT:
      return { notKept: 'light level (a percentage rather than lux or PPFD)' };
    case T.HYDRO_PH:
    case T.HYDRO_EC_US:
    case T.HYDRO_EC_MS:
    case T.HYDRO_TDS_PPM:
    case T.HYDRO_TDS_PPT:
    case T.HYDRO_WATER_TEMPERATURE_F:
    case T.HYDRO_WATER_TEMPERATURE_C:
      return { notKept: 'the pH, EC, TDS and temperature of a hydroponic reservoir' };
    case T.WATER:
      return { notKept: 'water detection' };
    default:
      return null;
  }
}

const CONTROLLER_TYPES = new Set<number>([T.CONTROLLER_TEMPERATURE_F, T.CONTROLLER_TEMPERATURE_C, T.CONTROLLER_HUMIDITY, T.CONTROLLER_VPD]);
const PROBE_TYPES = new Set<number>([T.PROBE_TEMPERATURE_F, T.PROBE_TEMPERATURE_C, T.PROBE_HUMIDITY, T.PROBE_VPD]);

/** What a port's sensor is called, from the types it reports. */
function portDescription(types: number[]): string {
  if (types.some((type) => PROBE_TYPES.has(type))) return 'temperature and humidity probe';
  if (types.includes(T.SOIL)) return 'soil sensor';
  if (types.includes(T.CO2) || types.includes(T.LIGHT)) return 'CO2 and light sensor';
  if (types.some((type) => type >= T.HYDRO_PH && type <= T.HYDRO_WATER_TEMPERATURE_C)) return 'water sensor';
  if (types.includes(T.WATER)) return 'water detector';
  return 'sensor';
}

export type AcInfinityRead = GatewayRead & {
  /** Controllers the account lists as offline, whose figures are not kept,
   *  since what they show is from whenever they last reported. */
  offline: string[];
};

/**
 * What the device list holds, or null when it is not a list of controllers.
 * An account with no controllers is not null: it reads as nothing to keep.
 */
export function readControllers(data: unknown): AcInfinityRead | null {
  if (!Array.isArray(data)) return null;
  const sensors = new Map<string, GatewaySensor>();
  const figures: GatewayFigure[] = [];
  const notKept = new Set<string>();
  const offline: string[] = [];

  function add(sensor: GatewaySensor, measurement: string, value: number | null, unit: string) {
    if (value === null || !couldBeRead(measurement, value, unit)) return;
    if (figures.some((figure) => figure.sensorKey === sensor.key && figure.measurement === measurement)) return;
    if (!sensors.has(sensor.key)) sensors.set(sensor.key, sensor);
    figures.push({ sensorKey: sensor.key, measurement, unit, value });
  }

  for (const controller of data) {
    if (!isEntry(controller)) continue;
    const devId = controller.devId;
    const id = typeof devId === 'string' || typeof devId === 'number' ? String(devId).trim() : '';
    if (!id) continue;
    const devName = typeof controller.devName === 'string' && controller.devName.trim() ? controller.devName.trim() : 'Controller';
    const info = isEntry(controller.deviceInfo) ? controller.deviceInfo : {};
    if (num(controller.online) === 0) {
      offline.push(devName);
      continue;
    }
    const raw = Array.isArray(info.sensors) ? info.sensors.filter(isEntry) : [];
    const own: GatewaySensor = { key: `ac${id}`, label: `${devName}, built-in probe`, temperatureCanBeEither: false };

    // A controller that reports built-in probe as sensors of types 4 to 7
    // (the AI+ family) is read from those; an older one (the 69 Pro) from
    // deviceInfo, where a controller with no probe plugged in reads 0 and 0.
    const reportsOwnAsSensors = raw.some((sensor) => CONTROLLER_TYPES.has(num(sensor.sensorType) ?? -1));
    if (!reportsOwnAsSensors) {
      const temperature = num(info.temperature);
      const humidity = num(info.humidity);
      const vpd = num(info.vpdnums);
      if (!(temperature === 0 && humidity === 0)) {
        add(own, 'air_temperature', temperature === null ? null : temperature / 100, '°C');
        add(own, 'humidity', humidity === null ? null : humidity / 100, '%');
        add(own, 'vpd', vpd === null ? null : vpd / 100, 'kPa');
      }
    }

    const byPort = new Map<string, Entry[]>();
    for (const sensor of raw) {
      const type = num(sensor.sensorType);
      if (type === null) continue;
      if (CONTROLLER_TYPES.has(type)) {
        const kind = measurementOf(type);
        if (kind && 'measurement' in kind) add(own, kind.measurement, sensorValue(sensor.sensorData, sensor.sensorPrecision), kind.unit);
        continue;
      }
      const port = num(sensor.accessPort);
      const portKey = port === null ? '0' : String(port);
      byPort.set(portKey, [...(byPort.get(portKey) ?? []), sensor]);
    }
    for (const [port, list] of byPort) {
      const types = list.map((sensor) => num(sensor.sensorType) ?? -1);
      const where = port === '0' ? '' : `, port ${port}`;
      const onPort: GatewaySensor = { key: `ac${id}p${port}`, label: `${devName}, ${portDescription(types)}${where}`, temperatureCanBeEither: false };
      for (const sensor of list) {
        const kind = measurementOf(num(sensor.sensorType) ?? -1);
        if (!kind) continue;
        if ('notKept' in kind) {
          notKept.add(kind.notKept);
          continue;
        }
        add(onPort, kind.measurement, sensorValue(sensor.sensorData, sensor.sensorPrecision), kind.unit);
      }
    }
    if (Array.isArray(info.ports) && info.ports.length > 0) notKept.add("what the controller's ports are set to (fan and light speeds, modes)");
  }

  return { sensors: [...sensors.values()], figures, notKept: [...notKept].sort(), offline };
}

/** A sentence for what came back, for the band. */
export function describeAccountRead(read: AcInfinityRead, kept: number): string {
  const parts: string[] = [];
  if (read.sensors.length === 0) {
    parts.push('AC Infinity answered, but no controller on the account has reported a figure Garden keeps.');
  } else {
    const sensorWord = read.sensors.length === 1 ? 'sensor' : 'sensors';
    parts.push(`AC Infinity answered with ${read.sensors.length} ${sensorWord}; ${kept} ${kept === 1 ? 'figure was' : 'figures were'} kept.`);
  }
  if (read.offline.length > 0) {
    const names = read.offline.join(', ');
    parts.push(`${read.offline.length === 1 ? `${names} shows` : `${names} show`} as offline, so nothing from ${read.offline.length === 1 ? 'it' : 'them'} was kept.`);
  }
  return parts.join(' ');
}

export const AC_HOW =
  'An AC Infinity controller (the UIS 69 Pro, the AI+ and the others set up in the AC Infinity app) can be read through the AC Infinity account it reports to, while Inside Story is open. Nothing is sent anywhere until you add an account here.';

/** What leaves the device, said before anything does. */
export const AC_WHAT_IS_SENT =
  "Your AC Infinity email and password go to AC Infinity's server (acinfinityserver.com), the same place the AC Infinity app sends them, and your controllers' latest readings come back. Nothing from Inside Story goes with them. The password is kept in this device's secure storage, never in a backup, and never sent to your other device.";

export const AC_FRAGILE_NOTE =
  "AC Infinity has not published a way for other apps to read a controller. Inside Story asks the way the AC Infinity app does, as the Home Assistant community worked it out, so AC Infinity can change it without notice and reading can stop until Inside Story is updated. The controller's history file from the AC Infinity app can fill any gap through Import Readings from a File.";

export const AC_CONSENT_LABEL = 'Send my AC Infinity email and password to AC Infinity to read my controllers';

export const AC_STEPS: string[] = [
  'Check that each controller shows in the AC Infinity app and is connected over Wi-Fi. A controller paired only by Bluetooth never reaches the account, so it cannot be read this way.',
  'Press Add an AC Infinity Account, type the email and password you sign in to the AC Infinity app with, and turn on the switch that agrees to send them to AC Infinity.',
  "Press Sign In and Read It. Within a few seconds each controller's built-in probe and each sensor plugged into its ports is listed. If a problem shows instead, it says what to check.",
  'Give each sensor you want kept an area, with Add an area if the right one is not there yet. A sensor with no area is read and nothing from it is kept.',
  'The phone or computer that adds the account is the one that reads it. To read it on another device instead, open it there, press Read It on This Phone Instead (or Computer), and type the password there, since a password never travels between devices.',
];

export const AC_PASSWORD_NEEDED =
  'This device reads the account but does not hold its password, since a password never travels between devices. Type it here to start reading.';

export const AC_WHILE_OPEN_NOTE =
  'The account is asked only while Inside Story is open on the device that reads it, so time with the app closed stays blank. AC Infinity keeps the history in the AC Infinity app, and its history file can fill those days.';

export const AC_SIGN_IN_ADVICE =
  'Check the email and password by signing in to the AC Infinity app with them. A password changed in the AC Infinity app needs changing here too, with Change.';

export const AC_UNREACHABLE_ADVICE =
  'Check that this device is online. If AC Infinity itself is down, the AC Infinity app will not load readings either, and reading here starts again by itself once it is back.';
