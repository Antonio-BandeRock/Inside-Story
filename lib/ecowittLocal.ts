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
// Rain (I21) is read as the gauge's total for the day so far, which is
// worked out into the day's rain and each hour's rain rather than averaged
// (rainFromRunningTotals in lib/readingImport.ts). Wind, pressure, UV, leaf
// wetness, air quality and lightning have no measurement kind in Garden, so
// they are named in "not kept" rather than dropped silently.

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
  ch_leaf: 'leaf wetness',
  ch_pm25: 'air quality',
  ch_lds: 'water level',
  ch_leak: 'water leak',
  lightning: 'lightning',
};

/** The two kinds of rain gauge a gateway reports, each its own sensor, so a
 *  station with both can keep one and leave the other. */
const RAIN_SECTIONS: { section: string; key: string; label: string }[] = [
  { section: 'rain', key: 'rain', label: 'Rain gauge' },
  { section: 'piezoRain', key: 'piezorain', label: 'Rain gauge (piezo, WS90)' },
];

/** The rain entry that holds the total for the day so far. */
const RAIN_DAY_ID = '0x10';

/** A rain amount: "1.2 mm", "0.05 in", or a bare figure beside a unit field. */
export function rainFigure(raw: unknown, unitField: unknown): { value: number; unit: 'mm' | 'in' } | null {
  const split = splitValue(raw);
  if (!split) return null;
  const unit = (split.unit || (typeof unitField === 'string' ? unitField : '')).trim().toLowerCase();
  if (unit === 'mm') return { value: split.value, unit: 'mm' };
  if (unit === 'in' || unit === 'inch' || unit === 'inches') return { value: split.value, unit: 'in' };
  return null;
}

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

  // Rain gauges: the day's total is kept, and what else they report is named.
  for (const gauge of RAIN_SECTIONS) {
    const entries = entriesOf(json[gauge.section]);
    if (entries.length === 0) continue;
    const sensor: GatewaySensor = { key: gauge.key, label: gauge.label, temperatureCanBeEither: false };
    for (const entry of entries) {
      const id = String(field(entry, 'id') ?? '');
      if (id === RAIN_DAY_ID) {
        const rain = rainFigure(field(entry, 'val'), field(entry, 'unit'));
        if (rain) add(sensor, 'rainfall', rain.value, rain.unit);
      }
    }
    notKept.add('rain rate and the week, month and year totals');
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
  'An Ecowitt gateway (GW1100, GW1200, GW2000 and the consoles built on them) can be read straight from your home network, with no Ecowitt account, no password and nothing leaving the house. Setting it up takes a few minutes and is done once.';

/** The setup, in the order it has to be done, so it works the first time. */
export const GATEWAY_STEPS: string[] = [
  'Put this phone or computer on the same Wi-Fi as the gateway. A phone on mobile data or on a guest network cannot reach it, and neither can a computer on a VPN.',
  "Find the gateway's address on your network: four numbers with dots between them, such as 192.168.1.40. In the Ecowitt app or the WS View Plus app, open the gateway and look through its settings or device information for IP address. Your router's list of connected devices shows it too, usually under a name like GW1100 or GW2000.",
  'Press Add a Gateway, give it a name you will recognise, such as Greenhouse gateway, and type only the address, exactly as it is shown. Nothing else is needed.',
  'Press Save and Read It. Within a few seconds the gateway reads as Connected and every sensor it reports is listed under it. If a problem shows instead, it says what to check.',
  'Give each sensor you want kept an area, with Add an area if the right one is not there yet. A sensor with no area is read and nothing from it is kept. Where an area has plantings, a sensor can be given one planting.',
  'The phone or computer that adds the gateway is the one that reads it. To read it on another device instead, open it there and press Read It on This Phone Instead (or Computer). Only one device reads a gateway at a time, and the other stops when the two sync.',
];

export const ADDRESS_TIP =
  "A router can hand the gateway a new address after a power cut. So the address stays the same, ask the router to keep it for the gateway (a router calls this a reserved address or DHCP reservation). If the address does change, the gateway reads as not reached; find the new one the same way and put it in with Change. Every reading kept so far stays where it is.";

export const UNREACHABLE_ADVICE =
  "Check that this device is on the same Wi-Fi as the gateway and not on mobile data, that the gateway is plugged in with its light on, and that the address matches the one in the Ecowitt app, since a router can give it a new one.";

export const NOT_A_GATEWAY_ADVICE =
  "The address may now belong to another device, so check it against the one in the Ecowitt app. A gateway on very old firmware cannot share its readings this way; updating it in the Ecowitt app fixes that.";

/** How a gateway stands, in words, for the line under its name. */
export function gatewayStatus(input: {
  reading: boolean;
  lastReadAt: string | null;
  lastProblem: string | null;
  readsHere: boolean;
}): { kind: 'reading' | 'connected' | 'problem' | 'waiting'; text: string } {
  if (input.reading) return { kind: 'reading', text: 'Asking the gateway now…' };
  if (input.lastProblem) return { kind: 'problem', text: 'Not reached on the last try' };
  if (input.lastReadAt) return { kind: 'connected', text: input.readsHere ? 'Connected, and read while the app is open' : 'Connected' };
  return { kind: 'waiting', text: 'Not read yet. Press Read It Now.' };
}

export const WHILE_OPEN_NOTE =
  'A gateway is read only while Lifestead is open on the device that reads it, and it keeps little history of its own, so time with the app closed stays blank. A history file from the Ecowitt app can fill those days through Import Readings from a File.';

export const ONE_DEVICE_NOTE =
  "One device reads each gateway, so a phone and a computer never read the same one and never replace each other's hours. The other device shows where it is read and gets the hours and days when the two sync. Moving it to another device is one press there; on the day it moves, that day is worked out from the device reading it by the end of the day.";

export type ReaderKind = 'phone' | 'computer';
export type GatewayMethod = 'ask' | 'push';

export type GatewayReader = {
  readsHere: boolean;
  /** Where the gateway is read, in words. */
  text: string;
  /** A button to read it here instead, where this device can. */
  takeOverLabel: string | null;
  /** What pressing it does, said before it is done. */
  takeOverConfirm: string | null;
};

function deviceWord(kind: ReaderKind | null): string {
  return kind === 'computer' ? 'computer' : kind === 'phone' ? 'phone' : 'other device';
}

/**
 * Which device reads a gateway, from this device's point of view. One
 * device reads each gateway: the id it keeps travels with the gateway, so
 * the other device stops as soon as the two sync. A gateway that sends its
 * readings can only be received by a computer.
 */
export function gatewayReader(input: {
  method: GatewayMethod;
  readerId: string | null;
  readerKind: ReaderKind | null;
  me: string;
  myKind: ReaderKind;
}): GatewayReader {
  const mine = deviceWord(input.myKind);
  const title = input.myKind === 'computer' ? 'Computer' : 'Phone';
  if (input.readerId === input.me) {
    return {
      readsHere: true,
      text: input.method === 'push' ? 'Received on this computer.' : `Read on this ${mine}.`,
      takeOverLabel: null,
      takeOverConfirm: null,
    };
  }
  if (input.method === 'push' && input.myKind !== 'computer') {
    return {
      readsHere: false,
      text: input.readerId
        ? 'It sends its readings to your computer. The hours and days reach this phone when the two sync.'
        : 'It is set to send its readings to a computer, and no computer receives them yet. Set that up from Lifestead on the computer.',
      takeOverLabel: null,
      takeOverConfirm: null,
    };
  }
  if (input.readerId) {
    const theirs = deviceWord(input.readerKind);
    return {
      readsHere: false,
      text: `Read on your ${theirs}. The hours and days reach this ${mine} when the two sync.`,
      takeOverLabel: `Read It on This ${title} Instead`,
      takeOverConfirm: `This ${mine} starts reading it now, and your ${theirs} stops the next time the two devices sync.`,
    };
  }
  return {
    readsHere: false,
    text: 'No device reads this gateway.',
    takeOverLabel: `Read It on This ${title}`,
    takeOverConfirm: null,
  };
}

export const RAIN_NOTE =
  "A rain gauge is kept as the gateway's total for the day. The day's rain is that total as last read that day, and each hour shows how far it rose. Because the gateway counts the whole day itself, opening the app once late in the day catches that day's rain up to then; a day the app is not opened at all stays blank. Where a station has two rain gauges, keep one, since the Rain total adds up every gauge that is kept.";

export const HOURS_NOTE =
  'Hours and days are worked out as each hour turns over and when the app is put away, so Trends shows the hour just finished rather than the one still going.';
