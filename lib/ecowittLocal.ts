// Reading an Ecowitt gateway on the home network (I20, 2026-09-28).
//
// An Ecowitt gateway (GW1100, GW1200, GW2000, and the consoles built on
// them) answers http://<its address>/get_livedata_info with what every
// sensor paired to it read last: its own indoor temperature and humidity,
// an outdoor station, soil moisture probes, temperature probes, and a CO2
// monitor. The app asks it while the app is open (lib/ecowittDb.ts,
// components/EcowittPoller.tsx), and each answer goes into the same record
// a controller's history file does (garden_device_samples, then the hours
// and the day), so Trends reads both the same way.
//
// This file is pure: the answer's JSON in, figures out, no I/O, so
// scripts/test_ecowitt_local.js can run it without a phone. The answer's
// shape varies with the gateway's firmware and its unit settings, so every
// field is read defensively: a value can be "21.2" beside a unit field of
// "C" or "F", or "65%", or "123.45 W/m2", or "--" for a sensor that has not
// reported, and anything that is not a number a sensor could read is left
// out rather than stored as a zero.
//
// Rain is not read here yet (I21 feeds the Rain total), and wind, pressure,
// UV, leaf wetness, air quality and lightning have no measurement kind in
// Garden, so they are named in "not kept" rather than dropped silently.

import { couldBeRead } from './readingImport';

/** One sensor on the gateway: the gateway's own indoor sensor, the outdoor
 *  station, or one channel of a probe. The key never changes for as long as
 *  the sensor stays on that channel, so the area it goes to is kept by it. */
export type GatewaySensor = {
  key: string;
  label: string;
  /** Temperature probes can sit in soil, in air or in water, so what their
   *  temperature counts as is asked rather than assumed. */
  temperatureCanBeEither: boolean;
};

export type GatewayFigure = {
  sensorKey: string;
  measurement: string;
  unit: string;
  value: number;
};

export type GatewayRead = {
  sensors: GatewaySensor[];
  figures: GatewayFigure[];
  /** Plain names of what the gateway reported that Garden does not keep. */
  notKept: string[];
};

type Entry = Record<string, unknown>;

function isEntry(value: unknown): value is Entry {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** An array of entries, or a lone entry as some firmware sends for the CO2
 *  monitor, or nothing. */
function entriesOf(value: unknown): Entry[] {
  if (Array.isArray(value)) return value.filter(isEntry);
  if (isEntry(value)) return [value];
  return [];
}

/** A field read case-blind, since firmware has written both "CO2" and "co2". */
function field(entry: Entry, name: string): unknown {
  if (name in entry) return entry[name];
  const lower = name.toLowerCase();
  for (const key of Object.keys(entry)) {
    if (key.toLowerCase() === lower) return entry[key];
  }
  return undefined;
}

/** The number at the start of a value and whatever unit follows it:
 *  "65%" is 65 and "%", "0.00 m/s" is 0 and "m/s", "--" is nothing. */
export function splitValue(raw: unknown): { value: number; unit: string } | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? { value: raw, unit: '' } : null;
  if (typeof raw !== 'string') return null;
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*(.*?)\s*$/.exec(raw);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  return { value, unit: match[2] };
}

/** A temperature's unit, from the entry's unit field or from the value. */
export function temperatureUnit(unitField: unknown, valueUnit: string): '°C' | '°F' | null {
  const text = `${typeof unitField === 'string' ? unitField : ''} ${valueUnit}`.toUpperCase();
  if (/F|℉/.test(text)) return '°F';
  if (/C|℃/.test(text)) return '°C';
  return null;
}

/** Sunlight as the gateway reports it. Lux in any of its forms becomes
 *  lux; W/m² stays W/m², since turning solar radiation into lux means
 *  assuming what the light is made of. */
export function lightFigure(raw: unknown): { value: number; unit: string } | null {
  const split = splitValue(raw);
  if (!split) return null;
  const unit = split.unit.replace(/\s+/g, '').toLowerCase();
  if (unit === 'klux') return { value: split.value * 1000, unit: 'lux' };
  if (unit === 'lux' || unit === 'lx') return { value: split.value, unit: 'lux' };
  if (unit === 'fc') return { value: Math.round(split.value * 10.764 * 100) / 100, unit: 'lux' };
  if (unit === 'w/m2' || unit === 'w/m²' || unit === '') return { value: split.value, unit: 'W/m²' };
  return null;
}

/** A humidity-like percentage: "65%" or "65". */
function percent(raw: unknown): number | null {
  const split = splitValue(raw);
  if (!split) return null;
  if (split.unit !== '' && split.unit !== '%') return null;
  return split.value;
}

function channelOf(entry: Entry): string {
  const raw = field(entry, 'channel');
  const text = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw.trim() : '';
  return /^\d+$/.test(text) ? text : '';
}

function withName(label: string, entry: Entry): string {
  const name = field(entry, 'name');
  return typeof name === 'string' && name.trim() ? `${label} (${name.trim()})` : label;
}

/** The common list's ids that are not kept, by plain name. */
const COMMON_NOT_KEPT: Record<string, string> = {
  '0x03': 'dew point',
  '3': 'feels like',
  '4': 'heat index',
  '0x04': 'wind chill',
  '0x0A': 'wind direction',
  '0x6D': 'wind direction',
  '0x0B': 'wind speed',
  '0x0C': 'wind gust',
  '0x19': 'highest gust today',
  '0x16': 'UV',
  '0x17': 'UV index',
};

/** Top-level parts of the answer that are not kept, by plain name. */
const SECTION_NOT_KEPT: Record<string, string> = {
  rain: 'rain',
  piezoRain: 'rain',
  ch_leaf: 'leaf wetness',
  ch_pm25: 'air quality',
  ch_lds: 'water level',
  ch_leak: 'water leak',
  lightning: 'lightning',
};

/**
 * What one answer from get_livedata_info holds, or null when it is not an
 * Ecowitt answer at all (a router's page, a different device at that
 * address). An answer with no sensors paired is not null: it reads as a
 * gateway with nothing on it yet.
 */
export function readLiveData(json: unknown): GatewayRead | null {
  if (!isEntry(json)) return null;
  const known = ['common_list', 'wh25', 'ch_aisle', 'ch_soil', 'ch_temp', 'co2', 'rain', 'piezoRain', 'ch_leaf'];
  if (!known.some((key) => key in json)) return null;

  const sensors = new Map<string, GatewaySensor>();
  const figures: GatewayFigure[] = [];
  const notKept = new Set<string>();

  function add(sensor: GatewaySensor, measurement: string, value: number | null, unit: string | null) {
    if (value === null || unit === null) return;
    if (!couldBeRead(measurement, value, unit)) return;
    if (!sensors.has(sensor.key)) sensors.set(sensor.key, sensor);
    figures.push({ sensorKey: sensor.key, measurement, unit, value });
  }

  function addTemperature(sensor: GatewaySensor, measurement: string, raw: unknown, unitField: unknown) {
    const split = splitValue(raw);
    if (!split) return;
    add(sensor, measurement, split.value, temperatureUnit(unitField, split.unit));
  }

  // The outdoor station.
  const outdoor: GatewaySensor = { key: 'outdoor', label: 'Outdoor station', temperatureCanBeEither: false };
  for (const entry of entriesOf(json.common_list)) {
    const id = String(field(entry, 'id') ?? '');
    const raw = field(entry, 'val');
    if (id === '0x02') addTemperature(outdoor, 'air_temperature', raw, field(entry, 'unit'));
    else if (id === '0x07') add(outdoor, 'humidity', percent(raw), '%');
    else if (id === '0x15') {
      const light = lightFigure(raw);
      if (light) add(outdoor, 'light', light.value, light.unit);
    } else if (id === '5') {
      // Newer firmware reports the station's VPD under id 5, in kPa.
      const split = splitValue(raw);
      const unit = `${typeof field(entry, 'unit') === 'string' ? field(entry, 'unit') : ''}${split?.unit ?? ''}`.toLowerCase();
      if (split && unit.includes('kpa')) add(outdoor, 'vpd', split.value, 'kPa');
    } else if (COMMON_NOT_KEPT[id]) notKept.add(COMMON_NOT_KEPT[id]);
  }

  // The gateway's own sensor, indoors.
  const indoor: GatewaySensor = { key: 'indoor', label: 'The gateway itself (indoor)', temperatureCanBeEither: false };
  for (const entry of entriesOf(json.wh25)) {
    addTemperature(indoor, 'air_temperature', field(entry, 'intemp'), field(entry, 'unit'));
    add(indoor, 'humidity', percent(field(entry, 'inhumi')), '%');
    if (field(entry, 'abs') !== undefined || field(entry, 'rel') !== undefined) notKept.add('air pressure');
  }

  // Temperature and humidity sensors, one per channel (WN31 and similar).
  for (const entry of entriesOf(json.ch_aisle)) {
    const channel = channelOf(entry);
    if (!channel) continue;
    const sensor: GatewaySensor = {
      key: `th${channel}`,
      label: withName(`Temperature and humidity, channel ${channel}`, entry),
      temperatureCanBeEither: false,
    };
    addTemperature(sensor, 'air_temperature', field(entry, 'temp'), field(entry, 'unit'));
    add(sensor, 'humidity', percent(field(entry, 'humidity')), '%');
  }

  // Soil moisture probes (WH51 and similar).
  for (const entry of entriesOf(json.ch_soil)) {
    const channel = channelOf(entry);
    if (!channel) continue;
    const sensor: GatewaySensor = { key: `soil${channel}`, label: withName(`Soil moisture, channel ${channel}`, entry), temperatureCanBeEither: false };
    add(sensor, 'soil_moisture', percent(field(entry, 'humidity')), '%');
    if (field(entry, 'temp') !== undefined) addTemperature(sensor, 'soil_temperature', field(entry, 'temp'), field(entry, 'unit'));
  }

  // Temperature probes (WN34), in soil, air or water.
  for (const entry of entriesOf(json.ch_temp)) {
    const channel = channelOf(entry);
    if (!channel) continue;
    const sensor: GatewaySensor = { key: `probe${channel}`, label: withName(`Temperature probe, channel ${channel}`, entry), temperatureCanBeEither: true };
    addTemperature(sensor, 'soil_temperature', field(entry, 'temp'), field(entry, 'unit'));
  }

  // The CO2 monitor (WH45 and similar), which also reads temperature and
  // humidity where it stands.
  for (const entry of entriesOf(json.co2)) {
    const sensor: GatewaySensor = { key: 'co2', label: 'CO2 monitor', temperatureCanBeEither: false };
    const co2 = splitValue(field(entry, 'CO2'));
    if (co2) add(sensor, 'co2', co2.value, 'ppm');
    if (field(entry, 'temp') !== undefined) addTemperature(sensor, 'air_temperature', field(entry, 'temp'), field(entry, 'unit'));
    if (field(entry, 'humidity') !== undefined) add(sensor, 'humidity', percent(field(entry, 'humidity')), '%');
    if (field(entry, 'PM25') !== undefined || field(entry, 'PM10') !== undefined) notKept.add('air quality');
  }

  for (const [section, name] of Object.entries(SECTION_NOT_KEPT)) {
    if (entriesOf(json[section]).length > 0) notKept.add(name);
  }

  return { sensors: [...sensors.values()], figures, notKept: [...notKept].sort() };
}

/** What a probe's temperature counts as, where it can be either. */
export const PROBE_TEMPERATURE_CHOICES: { label: string; value: string }[] = [
  { label: 'Soil temperature', value: 'soil_temperature' },
  { label: 'Air temperature', value: 'air_temperature' },
];

/** The address as the person typed it, reduced to host and port:
 *  "http://192.168.1.40/" and "192.168.1.40" are the same gateway. Null
 *  where what was typed could not be an address on a network. */
export function normaliseHost(typed: string): string | null {
  let text = typed.trim();
  text = text.replace(/^https?:\/\//i, '');
  text = text.split('/')[0] ?? '';
  if (!text) return null;
  if (!/^[A-Za-z0-9.\-]+(:\d{1,5})?$/.test(text)) return null;
  return text;
}

export function liveDataUrl(host: string): string {
  return `http://${host}/get_livedata_info`;
}

/** The moment a reading is kept under: local time to the minute, in the
 *  same shape a history file's rows are kept in, so a reading taken twice
 *  in one minute is kept once. */
export function momentOf(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

/** How often a gateway is asked while the app is open. */
export const POLL_CHOICES: { label: string; value: string }[] = [
  { label: 'Every minute', value: '1' },
  { label: 'Every 5 minutes', value: '5' },
  { label: 'Every 15 minutes', value: '15' },
  { label: 'Every 30 minutes', value: '30' },
];
export const DEFAULT_POLL_MINUTES = 5;

/** The name a sensor's readings are kept under, which is what Trends lists
 *  it by. Set once, when the sensor is first given an area, so renaming the
 *  gateway later does not split one sensor's history into two. */
export function sensorDeviceName(gatewayName: string, sensorLabel: string): string {
  return `${gatewayName.trim() || 'Ecowitt gateway'}, ${sensorLabel}`;
}

/** Whether a sensor is due to be asked again. */
export function isDue(lastAttemptAt: string | null, minutes: number, now: Date): boolean {
  if (!lastAttemptAt) return true;
  const last = Date.parse(lastAttemptAt);
  if (!Number.isFinite(last)) return true;
  return now.getTime() - last >= minutes * 60_000 - 5_000;
}

/** A sentence for what came back, for the band. */
export function describeRead(read: GatewayRead, kept: number): string {
  const sensorWord = read.sensors.length === 1 ? 'sensor' : 'sensors';
  if (read.sensors.length === 0) return 'The gateway answered, but no sensor on it has reported a figure Garden keeps.';
  return `The gateway answered with ${read.sensors.length} ${sensorWord}; ${kept} ${kept === 1 ? 'figure was' : 'figures were'} kept.`;
}

export const GATEWAY_HOW =
  'An Ecowitt gateway (GW1100, GW1200, GW2000 and the consoles built on them) can be read straight from your home network, with no Ecowitt account and nothing leaving the house. Its address is shown in the Ecowitt or WS View Plus app under the device, or in your router\'s list of devices.';

export const WHILE_OPEN_NOTE =
  'The gateway is read only while Inside Story is open on this device, and it keeps little history of its own, so time with the app closed stays blank. A history file from the Ecowitt app can fill those days through Import Readings from a File.';

export const ONE_DEVICE_NOTE =
  'Turn reading on for one device only. Each device keeps what it read, and the hours worked out from two devices reading the same sensor would each replace the other.';

export const HOURS_NOTE =
  'Hours and days are worked out as each hour turns over and when the app is put away, so Trends shows the hour just finished rather than the one still going.';
