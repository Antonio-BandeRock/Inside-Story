// Readings brought in from a controller's history file (I19, 2026-09-28,
// reworked the same day in 1.0.55.35).
//
// A grow controller or sensor hub (AC Infinity, Ecowitt, SensorPush, Govee
// and others) can save what it logged as a spreadsheet file: one row per
// moment, a time column, and a column per sensor. This reads such a file
// row by row, every row, and keeps each figure with the moment it was
// logged.
//
// No maker's layout is assumed. Every column is shown with a guess at what
// it holds, taken from its heading ("Temperature (°F)", "Humidity (%)"),
// and the person changes any guess before anything is saved.
//
// Where the figures go (importDeviceReadings in lib/growingConditionsDb.ts):
//  - garden_device_samples holds every figure, keyed by area, planting,
//    device, measurement and moment. Bringing in the same file again, or a
//    later file overlapping an earlier one, adds only the moments not
//    already there. It stays on the device that imported it, since a
//    minute logger fills hundreds of thousands of rows a year.
//  - garden_reading_hours holds each hour's average, lowest and highest,
//    and travels to the other device, so Trends can show hour by hour and
//    day by day on both.
//  - garden_readings gets one row per measurement per day, that day's
//    average, so everything built on readings (the month figures, Air VPD,
//    what is measured where) counts a logged day beside a typed one.
//
// A controller's VPD column comes in as its own measurement, Controller
// VPD, kept apart from the Air VPD worked out here, since a controller may
// work VPD out for the leaf with an offset the file does not state.
//
// Left out of an import, each with a stated reason:
//  - Rain and water given: a file may hold a running total rather than
//    what fell since the last row, and adding up a running total gives a
//    figure many times too large.
//  - Values that are not numbers, and values no sensor could read (a
//    humidity over 100%, a pH over 14), each counted in a sentence.
//
// No database in this file.

import { convertUnit, formatFigure } from './growingConditions';

// ---------------------------------------------------------------------------
// Reading the file
// ---------------------------------------------------------------------------

export type ParsedTable = {
  headers: string[];
  rows: string[][];
  /** Lines above the heading row that were skipped (a title, a device name). */
  skippedAbove: number;
};

function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell.trim() === '') {
      quoted = true;
      cell = '';
    } else if (ch === delimiter) {
      cells.push(cell.trim());
      cell = '';
    } else cell += ch;
  }
  cells.push(cell.trim());
  return cells;
}

/** Splits text into lines, keeping a newline inside quotes as part of its
 *  cell. */
function splitRecords(text: string): string[] {
  const out: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') quoted = !quoted;
    if (!quoted && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      out.push(current);
      current = '';
    } else current += ch;
  }
  out.push(current);
  return out.filter((line) => line.trim() !== '');
}

function pickDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 20);
  let best = ',';
  let bestScore = -1;
  for (const delimiter of [',', ';', '\t']) {
    const counts = sample.map((line) => splitLine(line, delimiter).length);
    const most = Math.max(...counts);
    const rowsAtMost = counts.filter((count) => count === most).length;
    const score = most > 1 ? most * 1000 + rowsAtMost : 0;
    if (score > bestScore) {
      best = delimiter;
      bestScore = score;
    }
  }
  return best;
}

const TIME_HEADER = /time|date|timestamp|datetime|zeit|fecha|hora|heure|日時|時刻/i;

/** Reads a comma, semicolon or tab separated file. The heading row is the
 *  first row with as many cells as the widest rows that names a time or
 *  date, or failing that the first row as wide as the widest. */
export function parseTable(raw: string): ParsedTable | null {
  const text = raw.replace(/^﻿/, '');
  const lines = splitRecords(text);
  if (lines.length < 2) return null;
  const delimiter = pickDelimiter(lines);
  const split = lines.map((line) => splitLine(line, delimiter));
  const widest = Math.max(...split.slice(0, 50).map((cells) => cells.length));
  if (widest < 2) return null;
  let headerAt = split.findIndex((cells, index) => index < 30 && cells.length === widest && cells.some((cell) => TIME_HEADER.test(cell)));
  if (headerAt < 0) headerAt = split.findIndex((cells) => cells.length === widest);
  const headers = split[headerAt].map((cell, index) => cell || `Column ${index + 1}`);
  const rows = split.slice(headerAt + 1).filter((cells) => cells.some((cell) => cell !== ''));
  if (rows.length === 0) return null;
  return { headers, rows, skippedAbove: headerAt };
}

// ---------------------------------------------------------------------------
// What each column holds
// ---------------------------------------------------------------------------

export type ColumnGuess =
  | { kind: 'time' }
  | { kind: 'measure'; measurement: string; unit: string }
  | { kind: 'skip' };

function unitIn(header: string): '°F' | '°C' | null {
  if (/℉|°\s*F|\(\s*F\s*\)|\bdeg\s*F\b|fahrenheit|_f\b/i.test(header)) return '°F';
  if (/℃|°\s*C|\(\s*C\s*\)|\bdeg\s*C\b|celsius|_c\b/i.test(header)) return '°C';
  return null;
}

/** A first guess from a column's heading. Anything it cannot place is left
 *  out until the person says what it is. */
export function guessColumn(header: string, preferF = false): ColumnGuess {
  const h = header.toLowerCase();
  if (/\bvpd\b|vapou?r pressure/.test(h)) return { kind: 'measure', measurement: 'vpd', unit: 'kPa' };
  if (TIME_HEADER.test(header) && !/temp/.test(h)) return { kind: 'time' };
  if (/temp|temperature|\btmp\b/.test(h)) {
    const unit = unitIn(header) ?? (preferF ? '°F' : '°C');
    return { kind: 'measure', measurement: /soil|root|substrate|probe/.test(h) ? 'soil_temperature' : 'air_temperature', unit };
  }
  if (/humid|\brh\b/.test(h)) return { kind: 'measure', measurement: 'humidity', unit: '%' };
  if (/co2|co₂|carbon dioxide/.test(h)) return { kind: 'measure', measurement: 'co2', unit: 'ppm' };
  if (/\bph\b/.test(h)) return { kind: 'measure', measurement: 'soil_ph', unit: 'pH' };
  if (/\bec\b|conductiv/.test(h)) return { kind: 'measure', measurement: 'soil_ec', unit: /µs|us\/cm|μs/.test(h) ? 'µS/cm' : 'mS/cm' };
  if (/moist|water content|\bvwc\b/.test(h)) return { kind: 'measure', measurement: 'soil_moisture', unit: /\bcb\b|centibar|kpa/.test(h) ? 'cb' : '%' };
  if (/ppfd|\bpar\b|µmol|umol/.test(h)) return { kind: 'measure', measurement: 'light', unit: 'PPFD' };
  if (/\blux\b|\blx\b|illuminance/.test(h)) return { kind: 'measure', measurement: 'light', unit: 'lux' };
  return { kind: 'skip' };
}

/** Measurements a file is never read into, and why. */
export const NOT_FROM_A_FILE: Record<string, string> = {
  rainfall: 'Rain is entered by hand or read from an Ecowitt gateway on your network, never from a file, since a file may hold a running total rather than what fell since the row before.',
  water_given: 'Water given is entered by hand, since a file may hold a running total rather than what went on since the row before.',
};

export const RAIN_FROM_A_FILE_NOTE =
  'Rain and water given are not read from a file, since a file may hold a running total rather than the amount since the row before, and adding up a running total gives a figure many times too large.';

export const VPD_COLUMN_NOTE =
  'A VPD column comes in as Controller VPD, kept apart from the Air VPD worked out here from temperature and humidity, since a controller may work VPD out for the leaf with an offset the file does not state.';

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------

export type DateOrder = 'mdy' | 'dmy';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function validDay(y: number, m: number, d: number): string | null {
  if (y < 1990 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

function localDay(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null;
  return validDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** Whether a set of day cells written with the day and month both as
 *  numbers ("09/10/2026") puts the month first or the day first: 'mdy',
 *  'dmy', null where every cell could be either, or 'none' where no cell is
 *  written that way. */
export function dateOrderOf(cells: string[]): DateOrder | null | 'none' {
  let seen = false;
  for (const cell of cells) {
    const match = /^\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/.exec(cell);
    if (!match) continue;
    seen = true;
    const a = Number(match[1]);
    const b = Number(match[2]);
    if (a > 12 && b <= 12) return 'dmy';
    if (b > 12 && a <= 12) return 'mdy';
  }
  return seen ? null : 'none';
}

function localMoment(date: Date): string | null {
  const day = localDay(date);
  if (!day) return null;
  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** The time of day written after a day ("23:50", "2:05:30 PM"), as
 *  'HH:MM:SS', or null where there is none that can be read. */
function timeIn(rest: string): string | null {
  const match = /(\d{1,2}):(\d{2})(?::(\d{2}))?(?:[.,]\d+)?\s*([ap])?\.?\s*m?\.?/i.exec(rest);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;
  const half = match[4]?.toLowerCase();
  if (half) {
    if (hours < 1 || hours > 12) return null;
    if (half === 'p' && hours < 12) hours += 12;
    if (half === 'a' && hours === 12) hours = 0;
  }
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function withTime(day: string | null, rest: string): string | null {
  if (!day) return null;
  const time = timeIn(rest);
  return time ? `${day} ${time}` : day;
}

/** The moment a cell names, as written: 'YYYY-MM-DD HH:MM:SS', or the day
 *  alone where the cell gives no time. A time in the file is the time where
 *  the controller was, so it is not moved to another time zone unless the
 *  cell states its own offset. Null where the cell names no day. */
export function momentOfCell(cell: string, order: DateOrder | null): string | null {
  const text = cell.trim();
  if (!text) return null;
  // A count of seconds or milliseconds since 1970.
  if (/^\d{10}(\.\d+)?$/.test(text)) return localMoment(new Date(Number(text) * 1000));
  if (/^\d{13}$/.test(text)) return localMoment(new Date(Number(text)));
  // 2026-09-27, 2026/9/27, with or without a time after it.
  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(.*)$/.exec(text);
  if (match) {
    const rest = match[4];
    if (/(z|[+-]\d{2}:?\d{2})\s*$/i.test(rest) && /\d{1,2}:\d{2}/.test(rest)) {
      return localMoment(new Date(text.replace(' ', 'T')));
    }
    return withTime(validDay(Number(match[1]), Number(match[2]), Number(match[3])), rest);
  }
  // 27/09/2026 or 09/27/2026, with a two-figure year read as 20xx.
  match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b(.*)$/.exec(text);
  if (match) {
    if (!order) return null;
    const a = Number(match[1]);
    const b = Number(match[2]);
    const y = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
    return withTime(order === 'mdy' ? validDay(y, a, b) : validDay(y, b, a), match[4]);
  }
  // A month written in English words ("Sep 27, 2026 2:05 PM").
  if (/[a-z]{3}/i.test(text)) {
    const parsed = Date.parse(text);
    if (!Number.isNaN(parsed)) {
      const date = new Date(parsed);
      return /\d{1,2}:\d{2}/.test(text) ? localMoment(date) : localDay(date);
    }
  }
  return null;
}

/** The day a cell names, the first ten characters of its moment. */
export function dayOfCell(cell: string, order: DateOrder | null): string | null {
  return momentOfCell(cell, order)?.slice(0, 10) ?? null;
}

/** The column that names the day on each row: the first column whose
 *  heading says time or date and whose cells can be read as days, or failing
 *  that the first column whose cells can. Null where no column can. */
export function findDayColumn(table: ParsedTable): number | null {
  const sample = table.rows.slice(0, 50);
  const readable = (index: number) => {
    const cells = sample.map((row) => row[index] ?? '');
    const order = dateOrderOf(cells);
    const tryOrder: DateOrder | null = order === 'none' || order === null ? 'mdy' : order;
    return cells.filter((cell) => dayOfCell(cell, tryOrder)).length >= Math.max(1, Math.ceil(cells.length / 2));
  };
  const named = table.headers.findIndex((header, index) => TIME_HEADER.test(header) && readable(index));
  if (named >= 0) return named;
  const any = table.headers.findIndex((_, index) => readable(index));
  return any >= 0 ? any : null;
}

// ---------------------------------------------------------------------------
// Figures
// ---------------------------------------------------------------------------

/** A number from a cell, allowing a unit written after it ("24.5°C",
 *  "61 %") and a decimal comma in a file separated by semicolons. Null for
 *  anything else, including "--", "N/A" and an empty cell. */
export function numberOfCell(cell: string, decimalComma: boolean): number | null {
  const text = cell.trim();
  const match = decimalComma ? /^-?\d+(?:[.,]\d+)?/.exec(text) : /^-?\d+(?:\.\d+)?/.exec(text);
  if (!match) return null;
  const value = Number(match[0].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/** Whether a sensor could have read this figure. A probe left unplugged
 *  often writes -40 or 999, and one such row would pull a day's average a
 *  long way. The ranges are what the quantity can physically be, never a
 *  judgement of what is good for a plant. */
export function couldBeRead(measurement: string, value: number, unit: string): boolean {
  if (!Number.isFinite(value)) return false;
  if (measurement === 'humidity') return value >= 0 && value <= 100;
  if (measurement === 'air_temperature' || measurement === 'soil_temperature') {
    const celsius = convertUnit(value, unit, '°C');
    return celsius !== null && celsius >= -50 && celsius <= 70;
  }
  if (measurement === 'soil_ph') return value >= 0 && value <= 14;
  if (measurement === 'soil_moisture' && unit === '%') return value >= 0 && value <= 100;
  if (measurement === 'co2') return value >= 0 && value <= 20000;
  if (measurement === 'vpd') return value >= 0 && value <= 10;
  if (measurement === 'rainfall') {
    const mm = convertUnit(value, unit, 'mm');
    return mm !== null && mm >= 0 && mm <= 2000;
  }
  if (measurement === 'light' || measurement === 'soil_ec' || measurement === 'soil_moisture') return value >= 0;
  return true;
}

/** Whether the file writes figures with a decimal comma ("24,5"), which a
 *  file separated by semicolons usually does. A cell holding a comma can only
 *  come from such a file, since in a comma separated file it would have been
 *  split. */
export function usesDecimalComma(table: ParsedTable): boolean {
  return table.rows.slice(0, 50).some((row) => row.some((cell) => /^-?\d+,\d+\s*\D*$/.test(cell.trim())));
}

export type ColumnSetting = { index: number; header: string; guess: ColumnGuess };

/** Every column but the day column, with its first guess. */
export function initialColumns(table: ParsedTable, dayColumn: number | null, preferF = false): ColumnSetting[] {
  return table.headers
    .map((header, index) => ({ index, header, guess: guessColumn(header, preferF) }))
    .filter((column) => column.index !== dayColumn)
    .map((column) => (column.guess.kind === 'time' ? { ...column, guess: { kind: 'skip' } as ColumnGuess } : column));
}

// ---------------------------------------------------------------------------
// Every row, with its moment
// ---------------------------------------------------------------------------

export type ColumnChoice = { index: number; measurement: string; unit: string };

/** One figure from one row: what was measured, when, and what it read. */
export type Sample = {
  measurement: string;
  unit: string;
  /** 'YYYY-MM-DD HH:MM:SS', or 'YYYY-MM-DD' where the file gave no time. */
  at: string;
  value: number;
};

export type ImportPlan = {
  samples: Sample[];
  firstDay: string | null;
  lastDay: string | null;
  days: number;
  rowsRead: number;
  rowsWithoutDay: number;
  /** Rows with a day and no time of day, kept for the day but not an hour. */
  rowsWithoutTime: number;
  /** Per measurement: a second figure for a moment the file already gave. */
  repeatsInFile: Record<string, number>;
  /** Per measurement: figures kept. */
  kept: Record<string, number>;
  /** Per measurement: cells that were blank or not a number. */
  notNumbers: Record<string, number>;
  /** Per measurement: numbers no sensor could have read. */
  outOfReach: Record<string, number>;
};

export function planImport(input: {
  table: ParsedTable;
  dayColumn: number;
  order: DateOrder | null;
  columns: ColumnChoice[];
  decimalComma: boolean;
}): ImportPlan {
  const samples: Sample[] = [];
  const seen = new Set<string>();
  const repeatsInFile: Record<string, number> = {};
  const kept: Record<string, number> = {};
  const notNumbers: Record<string, number> = {};
  const outOfReach: Record<string, number> = {};
  const columns = input.columns.filter((column) => !NOT_FROM_A_FILE[column.measurement]);
  const days = new Set<string>();
  let rowsWithoutDay = 0;
  let rowsWithoutTime = 0;
  const bump = (tally: Record<string, number>, code: string) => {
    tally[code] = (tally[code] ?? 0) + 1;
  };
  for (const row of input.table.rows) {
    const at = momentOfCell(row[input.dayColumn] ?? '', input.order);
    if (!at) {
      rowsWithoutDay += 1;
      continue;
    }
    if (at.length === 10) rowsWithoutTime += 1;
    for (const column of columns) {
      const value = numberOfCell(row[column.index] ?? '', input.decimalComma);
      if (value === null) {
        bump(notNumbers, column.measurement);
        continue;
      }
      if (!couldBeRead(column.measurement, value, column.unit)) {
        bump(outOfReach, column.measurement);
        continue;
      }
      const key = `${column.measurement}|${at}`;
      if (seen.has(key)) {
        bump(repeatsInFile, column.measurement);
        continue;
      }
      seen.add(key);
      samples.push({ measurement: column.measurement, unit: column.unit, at, value });
      bump(kept, column.measurement);
      days.add(at.slice(0, 10));
    }
  }
  const sortedDays = [...days].sort();
  return {
    samples,
    firstDay: sortedDays[0] ?? null,
    lastDay: sortedDays[sortedDays.length - 1] ?? null,
    days: sortedDays.length,
    rowsRead: input.table.rows.length,
    rowsWithoutDay,
    rowsWithoutTime,
    repeatsInFile,
    kept,
    notNumbers,
    outOfReach,
  };
}

// ---------------------------------------------------------------------------
// Hours and days, worked out from the samples
// ---------------------------------------------------------------------------

/** What the database hands back for one measurement over one hour or day in
 *  one unit: a sum rather than an average, so groups in two units can be
 *  put together. */
export type SampleGroup = {
  measurement: string;
  unit: string;
  /** 'YYYY-MM-DD HH' for an hour, 'YYYY-MM-DD' for a day. */
  period: string;
  sum: number;
  count: number;
  lowest: number;
  highest: number;
};

export type PeriodFigure = {
  measurement: string;
  unit: string;
  period: string;
  average: number;
  lowest: number;
  highest: number;
  count: number;
};

/** One figure per measurement per period. Where a period holds samples in
 *  two units (a controller switched from °F to °C), they are moved into the
 *  unit most of them were logged in; any that cannot be moved are left out
 *  of that period, since a figure in another quantity is not a reading of
 *  this one. */
export function combineGroups(groups: SampleGroup[]): PeriodFigure[] {
  const byPeriod = new Map<string, SampleGroup[]>();
  for (const group of groups) {
    const key = `${group.measurement}|${group.period}`;
    const list = byPeriod.get(key);
    if (list) list.push(group);
    else byPeriod.set(key, [group]);
  }
  const out: PeriodFigure[] = [];
  for (const list of byPeriod.values()) {
    const main = list.reduce((best, group) => (group.count > best.count ? group : best), list[0]);
    let sum = 0;
    let count = 0;
    let lowest = Infinity;
    let highest = -Infinity;
    for (const group of list) {
      const mean = convertUnit(group.sum / group.count, group.unit, main.unit);
      const low = convertUnit(group.lowest, group.unit, main.unit);
      const high = convertUnit(group.highest, group.unit, main.unit);
      if (mean === null || low === null || high === null) continue;
      sum += mean * group.count;
      count += group.count;
      lowest = Math.min(lowest, low);
      highest = Math.max(highest, high);
    }
    if (count === 0) continue;
    out.push({ measurement: main.measurement, unit: main.unit, period: main.period, average: sum / count, lowest, highest, count });
  }
  return out.sort((a, b) => a.period.localeCompare(b.period) || a.measurement.localeCompare(b.measurement));
}

/** One reading of a rain gauge's total for the day so far, as an Ecowitt
 *  gateway reports it (I21). */
export type RunningSample = { at: string; value: number; unit: string };

export type RainDay = PeriodFigure & {
  /** The moment of the first and last readings that day. */
  firstAt: string;
  lastAt: string;
  /** What had already fallen that day when it was first read. */
  beforeFirst: number;
};

export type RainFigures = { days: RainDay[]; hours: PeriodFigure[] };

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * The day's rain and each hour's rain, from a gauge's running total for the
 * day. A running total is never averaged or added up as it stands: the day
 * is the total as last read, and an hour is how far the total rose in it.
 *
 * A total that falls has been reset (the gauge's midnight, or somebody
 * clearing it), so what it reads after the fall is new rain in full. Rain
 * that had already fallen before the first reading of a day counts toward
 * the day and no hour, since nothing says which hour it fell in. Readings
 * in two units within a day are moved into the unit of the last one.
 */
export function rainFromRunningTotals(samples: RunningSample[]): RainFigures {
  const byDay = new Map<string, RunningSample[]>();
  for (const sample of samples) {
    const day = sample.at.slice(0, 10);
    const list = byDay.get(day);
    if (list) list.push(sample);
    else byDay.set(day, [sample]);
  }
  const days: RainDay[] = [];
  const hours: PeriodFigure[] = [];
  for (const day of [...byDay.keys()].sort()) {
    const list = [...(byDay.get(day) ?? [])].sort((a, b) => a.at.localeCompare(b.at));
    const unit = list[list.length - 1].unit;
    let total = 0;
    let previous: number | null = null;
    let beforeFirst = 0;
    let firstAt = '';
    let lastAt = '';
    let count = 0;
    const byHour = new Map<string, PeriodFigure>();
    for (const sample of list) {
      const value = convertUnit(sample.value, sample.unit, unit);
      if (value === null) continue;
      let fell = 0;
      if (previous === null) {
        total = value;
        beforeFirst = value;
        firstAt = sample.at;
      } else {
        fell = value >= previous ? value - previous : value;
        total += fell;
      }
      previous = value;
      lastAt = sample.at;
      count += 1;
      if (sample.at.length < 13) continue;
      const hour = sample.at.slice(0, 13);
      const held = byHour.get(hour);
      if (held) {
        held.average += fell;
        held.highest = total;
        held.count += 1;
      } else {
        byHour.set(hour, { measurement: 'rainfall', unit, period: hour, average: fell, lowest: total - fell, highest: total, count: 1 });
      }
    }
    if (count === 0) continue;
    for (const figure of byHour.values()) {
      hours.push({ ...figure, average: round2(figure.average), lowest: round2(figure.lowest), highest: round2(figure.highest) });
    }
    days.push({
      measurement: 'rainfall',
      unit,
      period: day,
      average: round2(total),
      lowest: round2(beforeFirst),
      highest: round2(total),
      count,
      firstAt,
      lastAt,
      beforeFirst: round2(beforeFirst),
    });
  }
  return { days, hours: hours.sort((a, b) => a.period.localeCompare(b.period)) };
}

function clockOf(moment: string): string {
  return moment.length >= 16 ? moment.slice(11, 16) : '';
}

/** The note a day's rain carries. */
export function rainDayNote(day: RainDay, deviceName: string): string {
  const last = clockOf(day.lastAt);
  const readings = day.count === 1 ? 'one reading' : `${day.count.toLocaleString('en-US')} readings`;
  const first = clockOf(day.firstAt);
  const before =
    day.count > 1 && day.beforeFirst > 0 && first ? ` ${formatFigure(day.beforeFirst, day.unit)} had fallen before the first reading at ${first}.` : '';
  return `The day's rain from ${deviceName}${last ? `, as last read at ${last}` : ''}, from ${readings}.${before}`;
}

/** The note a day's reading carries. */
export function figureNote(figure: PeriodFigure, deviceName: string): string {
  if (figure.count === 1) return `One reading from ${deviceName}.`;
  return `Average of ${figure.count.toLocaleString('en-US')} readings that day from ${deviceName}; lowest ${formatFigure(figure.lowest, figure.unit)}, highest ${formatFigure(figure.highest, figure.unit)}.`;
}

/** How a device name is compared: "Tent 2" and " tent 2 " are one device. */
export function deviceKeyOf(deviceName: string): string {
  return deviceName.trim().toLowerCase();
}

function hashId(prefix: string, key: string): string {
  let a = 5381;
  let b = 52711;
  for (let i = 0; i < key.length; i += 1) {
    const code = key.charCodeAt(i);
    a = (Math.imul(a, 33) ^ code) >>> 0;
    b = (Math.imul(b, 31) + code) >>> 0;
  }
  return `${prefix}${a.toString(36)}${b.toString(36)}`;
}

/** The same day's imported reading always has the same id, so a later
 *  import rewrites that day rather than adding a second one, on this device
 *  and on any device it syncs with. */
export function importedReadingId(parts: {
  plotId: string | null;
  plantingId: string | null;
  measurement: string;
  day: string;
  deviceName: string;
}): string {
  return hashId('reading_file_', [parts.plotId ?? '', parts.plantingId ?? '', parts.measurement, parts.day, deviceKeyOf(parts.deviceName)].join('|'));
}

/** The same for an hour in garden_reading_hours. */
export function hourReadingId(parts: {
  plotId: string | null;
  plantingId: string | null;
  measurement: string;
  hour: string;
  deviceName: string;
}): string {
  return hashId('reading_hour_', [parts.plotId ?? '', parts.plantingId ?? '', parts.measurement, parts.hour, deviceKeyOf(parts.deviceName)].join('|'));
}

// ---------------------------------------------------------------------------
// Sentences
// ---------------------------------------------------------------------------

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function spokenDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
}

/** What saving would add, in words, before anything is saved. */
export function describePlan(plan: ImportPlan, labelOf: (code: string) => string): string[] {
  if (plan.samples.length === 0 || !plan.firstDay || !plan.lastDay) {
    return ['Nothing in this file can be kept as it is set: no row has both a day and a figure in a column picked below.'];
  }
  const lines: string[] = [];
  const span = plan.firstDay === plan.lastDay ? spokenDay(plan.firstDay) : `${spokenDay(plan.firstDay)} to ${spokenDay(plan.lastDay)}`;
  lines.push(`${plural(plan.days, 'day', 'days')}, ${span}, from ${plural(plan.rowsRead, 'row', 'rows')}.`);
  const counts = Object.entries(plan.kept).map(([code, count]) => `${labelOf(code).toLowerCase()}, ${plural(count, 'figure', 'figures')}`);
  lines.push(`Kept: ${joinWords(counts)}.`);
  lines.push(
    'Every figure is kept with its time. Trends > Growing Conditions shows them hour by hour and day by day, and Growing Conditions here gets one reading a day: that day’s average, with how many figures it came from and the lowest and highest in its note.',
  );
  if (plan.rowsWithoutTime > 0) {
    lines.push(`${plural(plan.rowsWithoutTime, 'row has', 'rows have')} a day and no time, so ${plan.rowsWithoutTime === 1 ? 'it counts' : 'they count'} toward that day but not toward any hour.`);
  }
  if (plan.rowsWithoutDay > 0) lines.push(`${plural(plan.rowsWithoutDay, 'row has', 'rows have')} no day that can be read, and ${plan.rowsWithoutDay === 1 ? 'is' : 'are'} left out.`);
  for (const [code, count] of Object.entries(plan.repeatsInFile)) {
    lines.push(`${labelOf(code)}: ${plural(count, 'figure repeats', 'figures repeat')} a moment the file already gave, and only the first is kept.`);
  }
  for (const [code, count] of Object.entries(plan.notNumbers)) {
    lines.push(`${labelOf(code)}: ${plural(count, 'cell was', 'cells were')} blank or not a number, and left out.`);
  }
  for (const [code, count] of Object.entries(plan.outOfReach)) {
    lines.push(`${labelOf(code)}: ${plural(count, 'figure', 'figures')} outside what the sensor can read (often a probe unplugged), left out.`);
  }
  return lines;
}

export const IMPORT_HOW =
  'A controller or sensor hub (AC Infinity, Ecowitt, SensorPush, Govee and others) can usually save what it logged as a CSV file from its app, often by email. Pick that file here. Each column is shown with a guess at what it holds, which you can change, and nothing is saved until you say so.';

export const REIMPORT_NOTE =
  'Bringing in a file again, or a later file that overlaps an earlier one, adds only the moments not already here for this area and device; figures already brought in are skipped, and the days and hours they touch are worked out again from everything held. Readings you typed in are never changed.';

export const WHERE_KEPT_NOTE =
  'Every figure with its time stays on this device, since a year of readings every minute is too much to send on each sync. The hours and days worked out from them travel to your other devices.';
