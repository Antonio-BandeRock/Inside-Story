// A station that sends its readings (I22, 2026-09-28).
//
// The other way in beside asking a gateway by its address (lib/ecowittLocal.ts).
// In the Ecowitt app a gateway or console can be told to send every reading
// to a server of the person's choosing ("Customized", protocol Ecowitt),
// and the desktop app can be that server: desktop/stationListener.js takes
// the post and hands its fields here. The post is a form, one field per
// figure, always in US units (°F, inches), under names that differ from the
// answer the gateway gives when asked.
//
// The sensor keys and labels are the ones readLiveData gives, so a sensor's
// area, planting and device name are the same whichever way the gateway is
// read, and switching a gateway from one way to the other keeps its history
// in one place.
//
// Pure: fields in, figures out, no I/O, so scripts/test_ecowitt_local.js can
// run it.

import { lightFigure, type GatewayFigure, type GatewayRead, type GatewaySensor } from './ecowittLocal';
import { couldBeRead } from './readingImport';

export type PushFields = Record<string, string>;

/** The fields of a form body: "a=1&b=2". Repeated names keep the last. */
export function parsePushBody(body: string): PushFields {
  const fields: PushFields = {};
  for (const part of body.split('&')) {
    if (!part) continue;
    const at = part.indexOf('=');
    const rawName = at < 0 ? part : part.slice(0, at);
    const rawValue = at < 0 ? '' : part.slice(at + 1);
    try {
      const name = decodeURIComponent(rawName.replace(/\+/g, ' ')).trim();
      if (name) fields[name] = decodeURIComponent(rawValue.replace(/\+/g, ' ')).trim();
    } catch {
      // A field that cannot be decoded is left out.
    }
  }
  return fields;
}

function number(fields: PushFields, name: string): number | null {
  const raw = fields[name];
  if (raw === undefined || raw === '' || raw === '--') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/** What is sent that Garden does not keep, by the start of its field name. */
const PUSH_NOT_KEPT: { prefix: string; name: string }[] = [
  { prefix: 'wind', name: 'wind' },
  { prefix: 'maxdailygust', name: 'wind' },
  { prefix: 'uv', name: 'UV' },
  { prefix: 'barom', name: 'air pressure' },
  { prefix: 'lightning', name: 'lightning' },
  { prefix: 'leafwetness', name: 'leaf wetness' },
  { prefix: 'pm25', name: 'air quality' },
  { prefix: 'pm10', name: 'air quality' },
  { prefix: 'leak', name: 'water leak' },
  { prefix: 'vpd', name: 'the station\'s VPD, sent with no unit' },
];

const RAIN_RATE_FIELDS = ['rainratein', 'eventrainin', 'hourlyrainin', 'weeklyrainin', 'monthlyrainin', 'yearlyrainin', 'totalrainin', 'rrain_piezo', 'erain_piezo', 'hrain_piezo', 'wrain_piezo', 'mrain_piezo', 'yrain_piezo'];

/**
 * What one post from a station holds, or null when it is not an Ecowitt
 * post at all (no PASSKEY, or nothing a station sends).
 */
export function readPush(fields: PushFields): GatewayRead | null {
  if (!fields.PASSKEY && !fields.passkey) return null;

  const sensors = new Map<string, GatewaySensor>();
  const figures: GatewayFigure[] = [];
  const notKept = new Set<string>();

  function add(sensor: GatewaySensor, measurement: string, value: number | null, unit: string) {
    if (value === null) return;
    if (!couldBeRead(measurement, value, unit)) return;
    if (!sensors.has(sensor.key)) sensors.set(sensor.key, sensor);
    figures.push({ sensorKey: sensor.key, measurement, unit, value });
  }

  const outdoor: GatewaySensor = { key: 'outdoor', label: 'Outdoor station', temperatureCanBeEither: false };
  add(outdoor, 'air_temperature', number(fields, 'tempf'), '°F');
  add(outdoor, 'humidity', number(fields, 'humidity'), '%');
  const solar = number(fields, 'solarradiation');
  if (solar !== null) {
    const light = lightFigure(`${solar} W/m2`);
    if (light) add(outdoor, 'light', light.value, light.unit);
  }

  const indoor: GatewaySensor = { key: 'indoor', label: 'The gateway itself (indoor)', temperatureCanBeEither: false };
  add(indoor, 'air_temperature', number(fields, 'tempinf'), '°F');
  add(indoor, 'humidity', number(fields, 'humidityin'), '%');

  for (let channel = 1; channel <= 8; channel += 1) {
    const th: GatewaySensor = { key: `th${channel}`, label: `Temperature and humidity, channel ${channel}`, temperatureCanBeEither: false };
    add(th, 'air_temperature', number(fields, `temp${channel}f`), '°F');
    add(th, 'humidity', number(fields, `humidity${channel}`), '%');

    const soil: GatewaySensor = { key: `soil${channel}`, label: `Soil moisture, channel ${channel}`, temperatureCanBeEither: false };
    add(soil, 'soil_moisture', number(fields, `soilmoisture${channel}`), '%');

    const probe: GatewaySensor = { key: `probe${channel}`, label: `Temperature probe, channel ${channel}`, temperatureCanBeEither: true };
    add(probe, 'soil_temperature', number(fields, `tf_ch${channel}`), '°F');
  }

  const co2: GatewaySensor = { key: 'co2', label: 'CO2 monitor', temperatureCanBeEither: false };
  add(co2, 'co2', number(fields, 'co2'), 'ppm');
  add(co2, 'air_temperature', number(fields, 'tf_co2'), '°F');
  add(co2, 'humidity', number(fields, 'humi_co2'), '%');

  // Rain as the day's total so far, the same as when the gateway is asked.
  const rain: GatewaySensor = { key: 'rain', label: 'Rain gauge', temperatureCanBeEither: false };
  add(rain, 'rainfall', number(fields, 'dailyrainin'), 'in');
  const piezo: GatewaySensor = { key: 'piezorain', label: 'Rain gauge (piezo, WS90)', temperatureCanBeEither: false };
  add(piezo, 'rainfall', number(fields, 'drain_piezo'), 'in');
  if (RAIN_RATE_FIELDS.some((name) => name in fields)) notKept.add('rain rate and the week, month and year totals');

  for (const name of Object.keys(fields)) {
    const lower = name.toLowerCase();
    for (const item of PUSH_NOT_KEPT) {
      if (lower.startsWith(item.prefix)) notKept.add(item.name);
    }
    if (/^pm25|^aqi|^co2_24h|^pm10/.test(lower)) notKept.add('air quality');
  }

  return { sensors: [...sensors.values()], figures, notKept: [...notKept].sort() };
}

/** The key a station signs its posts with. */
export function passkeyOf(fields: PushFields): string | null {
  const key = (fields.PASSKEY ?? fields.passkey ?? '').trim();
  return key || null;
}

/** The station's model as it names itself, such as GW2000A_V3.1.4. */
export function stationTypeOf(fields: PushFields): string | null {
  const type = (fields.stationtype ?? '').trim();
  return type || null;
}

/**
 * Which gateway a post belongs to. By its key where one matches; where
 * none does and exactly one gateway set to receive here has no key yet,
 * that one takes it (the first post after setup). Otherwise nothing, and
 * the post is noted rather than kept.
 */
export function matchPush(
  passkey: string,
  gateways: { id: string; passkey: string | null; receivesHere: boolean }[],
): { gatewayId: string; adopt: boolean } | null {
  const matched = gateways.find((gateway) => gateway.passkey === passkey);
  if (matched) return matched.receivesHere ? { gatewayId: matched.id, adopt: false } : null;
  const waiting = gateways.filter((gateway) => gateway.receivesHere && !gateway.passkey);
  if (waiting.length === 1) return { gatewayId: waiting[0].id, adopt: true };
  return null;
}

/** The port the desktop app listens on unless the person changes it. */
export const DEFAULT_LISTEN_PORT = 8588;

/** The path the station is told to send to. Any path is accepted. */
export const PUSH_PATH = '/data/report/';

/** How often to tell the station to send. */
export const PUSH_INTERVAL_SECONDS = 60;

export const PUSH_HOW =
  'A station can also send its readings to this computer by itself, about once a minute, rather than waiting to be asked. Use this where a station cannot be asked by its address, or where you want every minute kept. It needs this computer switched on with Lifestead open (minimised is fine), and the computer keeps what arrives; the hours and days reach your phone when the two sync.';

/** The setup for sending, in the order it has to be done. */
export function pushSteps(input: { addresses: string[]; port: number }): string[] {
  const address = input.addresses.length === 0
    ? 'this computer\'s address on your network (it shows here once the computer is on Wi-Fi or a cable)'
    : input.addresses.length === 1
      ? input.addresses[0]
      : `${input.addresses.join(' or ')} (the one that starts the same way as the gateway's address)`;
  return [
    'Put this computer on the same network as the station. A computer on a VPN or a guest network cannot receive from it.',
    'Press Add a Gateway below, give it a name, pick It sends its readings to this computer, and save. The address can be left blank; it is filled in from the first reading.',
    'On your phone, open the Ecowitt app or the WS View Plus app, open the station, and find Weather Services (sometimes under Others or More). Go through its pages to Customized.',
    `Set Customized to on (Enable), Protocol Type to Ecowitt, Server IP or Hostname to ${address}, Path to ${PUSH_PATH}, Port to ${input.port}, and Upload Interval to ${PUSH_INTERVAL_SECONDS} seconds. Save.`,
    'The first time a reading arrives, Windows may ask whether Lifestead can use the network. Allow it on private networks. If nothing arrives, open Windows Security, Firewall, Allow an app through the firewall, and tick Private beside Lifestead.',
    `Within a minute or two the gateway reads as Receiving and lists its sensors. To check the computer can be reached at all, open http://${input.addresses[0] ?? 'the computer\'s address'}:${input.port} in your phone\'s browser: it answers Lifestead is listening.`,
    'Give each sensor you want kept an area, the same as for a gateway that is asked.',
  ];
}

export const PUSH_ADDRESS_TIP =
  'The station sends to the computer by the computer\'s address, so a router handing the computer a new one stops the readings. Ask the router to keep the computer\'s address the same (a reserved address or DHCP reservation).';

export const PUSH_PHONE_NOTE =
  'A station that cannot be asked by its address can send its readings to the computer app instead. Set that up from Lifestead on the computer; the hours and days reach this phone when the two sync.';

/** How a gateway that sends stands, in words. */
export function pushStatus(input: {
  listening: boolean;
  listenError: string | null;
  lastReadAt: string | null;
  lastProblem: string | null;
}): { kind: 'reading' | 'connected' | 'problem' | 'waiting'; text: string } {
  if (input.listenError) return { kind: 'problem', text: 'This computer cannot receive readings right now' };
  if (!input.listening) return { kind: 'waiting', text: 'Starting to listen…' };
  if (input.lastProblem) return { kind: 'problem', text: 'The last reading could not be kept' };
  if (input.lastReadAt) return { kind: 'connected', text: 'Receiving, while the app is open' };
  return { kind: 'waiting', text: "Waiting for the station's first reading" };
}
