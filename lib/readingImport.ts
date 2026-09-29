// Readings brought in from a controller's history file (I19, 2026-09-28).
//
// A grow controller or sensor hub (AC Infinity, Ecowitt, SensorPush, Govee
// and others) can save what it logged as a spreadsheet file: one row per
// moment, a time column, and a column per sensor. This reads such a file
// and turns it into garden_readings with source 'device', so a season of
// logging counts the same as figures typed in by hand.
//
// No maker's layout is assumed. Every column is shown with a guess at what
// it holds, taken from its heading ("Temperature (°F)", "Humidity (%)"),
// and the person changes any guess before anything is saved.
//
// A reading in this app has a day and no time of day, and a controller
// logs every minute or so. So one reading is kept per measurement per day:
// that day's average, with how many rows it came from and the day's lowest
// and highest in its note. The month figures on Trends are then averages
// of daily averages, and the lowest and highest there are of those daily
// figures, which the import screen says before saving.
//
// Importing the same file again, or a later file covering some of the same
// days, replaces those days' figures rather than adding a second copy,
// because each imported reading's id comes from its area, planting,
// measurement, day and device. Readings typed in by hand are never touched.
//
// Left out of an import, each with a stated reason:
//  - VPD columns: the app works Air VPD out from temperature and humidity
//    (lib/growingConditions.ts), and a controller's VPD may be leaf VPD
//    with an offset the file does not state.
//  - Rain and water given: a file may hold a running total rather than
//    what fell since the last row, and adding up a running total gives a
//    figure many times too large.
//  - Values that are not numbers, and values no sensor could read (a
//    humidity over 100%, a pH over 14), each counted in a sentence.
//
// No database in this file; importDeviceReadings in
// lib/growingConditionsDb.ts writes the rows.

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
  | { kind: 'vpd' }
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
  if (/\bvpd\b|vapou?r pressure/.test(h)) return { kind: 'vpd' };
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
  rainfall: 'Rain is entered by hand for now, since a file may hold a running total rather than what fell since the row before.',
  water_given: 'Water given is entered by hand, since a file may hold a running total rather than what went on since the row before.',
};

export const RAIN_FROM_A_FILE_NOTE =
  'Rain and water given are entered by hand rather than read from a file, since a file may hold a running total rather than the amount since the row before, and adding up a running total gives a figure many times too large.';

export const VPD_COLUMN_NOTE =
  'VPD columns are left out. Air VPD is worked out here from the temperature and humidity on the same day, and a controller’s VPD may be leaf VPD with an offset the file does not state.';

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

/** The day a cell names, as written: a time in the file is the time where
 *  the controller was, so it is not moved to another time zone unless the
 *  cell states its own offset. Null where the cell names no day. */
export function dayOfCell(cell: string, order: DateOrder | null): string | null {
  const text = cell.trim();
  if (!text) return null;
  // A count of seconds or milliseconds since 1970.
  if (/^\d{10}(\.\d+)?$/.test(text)) return localDay(new Date(Number(text) * 1000));
  if (/^\d{13}$/.test(text)) return localDay(new Date(Number(text)));
  // 2026-09-27, 2026/9/27, with or without a time after it.
  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(.*)$/.exec(text);
  if (match) {
    const rest = match[4];
    if (/(z|[+-]\d{2}:?\d{2})\s*$/i.test(rest) && /\d{1,2}:\d{2}/.test(rest)) {
      return localDay(new Date(text.replace(' ', 'T')));
    }
    return validDay(Number(match[1]), Number(match[2]), Number(match[3]));
  }
  // 27/09/2026 or 09/27/2026, with a two-figure year read as 20xx.
  match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/.exec(text);
  if (match) {
    if (!order) return null;
    const a = Number(match[1]);
    const b = Number(match[2]);
    const y = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
    return order === 'mdy' ? validDay(y, a, b) : validDay(y, b, a);
  }
  // A month written in English words ("Sep 27, 2026 2:05 PM").
  if (/[a-z]{3}/i.test(text)) {
    const parsed = Date.parse(text);
    if (!Number.isNaN(parsed)) return localDay(new Date(parsed));
  }
  return null;
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
// One reading per measurement per day
// ---------------------------------------------------------------------------

export type ColumnChoice = { index: number; measurement: string; unit: string };

export type DayFigure = {
  measurement: string;
  unit: string;
  day: string;
  average: number;
  lowest: number;
  highest: number;
  count: number;
};

export type ImportPlan = {
  figures: DayFigure[];
  firstDay: string | null;
  lastDay: string | null;
  days: number;
  rowsRead: number;
  rowsWithoutDay: number;
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
  const buckets = new Map<string, { measurement: string; unit: string; day: string; values: number[] }>();
  const notNumbers: Record<string, number> = {};
  const outOfReach: Record<string, number> = {};
  const columns = input.columns.filter((column) => !NOT_FROM_A_FILE[column.measurement]);
  let rowsWithoutDay = 0;
  for (const row of input.table.rows) {
    const day = dayOfCell(row[input.dayColumn] ?? '', input.order);
    if (!day) {
      rowsWithoutDay += 1;
      continue;
    }
    for (const column of columns) {
      const value = numberOfCell(row[column.index] ?? '', input.decimalComma);
      if (value === null) {
        notNumbers[column.measurement] = (notNumbers[column.measurement] ?? 0) + 1;
        continue;
      }
      if (!couldBeRead(column.measurement, value, column.unit)) {
        outOfReach[column.measurement] = (outOfReach[column.measurement] ?? 0) + 1;
        continue;
      }
      const key = `${column.measurement}|${column.unit}|${day}`;
      const bucket = buckets.get(key);
      if (bucket) bucket.values.push(value);
      else buckets.set(key, { measurement: column.measurement, unit: column.unit, day, values: [value] });
    }
  }
  const figures: DayFigure[] = [...buckets.values()]
    .map((bucket) => ({
      measurement: bucket.measurement,
      unit: bucket.unit,
      day: bucket.day,
      average: bucket.values.reduce((sum, value) => sum + value, 0) / bucket.values.length,
      lowest: Math.min(...bucket.values),
      highest: Math.max(...bucket.values),
      count: bucket.values.length,
    }))
    .sort((a, b) => a.day.localeCompare(b.day) || a.measurement.localeCompare(b.measurement));
  const days = [...new Set(figures.map((figure) => figure.day))].sort();
  return {
    figures,
    firstDay: days[0] ?? null,
    lastDay: days[days.length - 1] ?? null,
    days: days.length,
    rowsRead: input.table.rows.length,
    rowsWithoutDay,
    notNumbers,
    outOfReach,
  };
}

/** The note an imported reading carries. */
export function figureNote(figure: DayFigure, fileName: string): string {
  if (figure.count === 1) return `One reading from ${fileName}.`;
  return `Average of ${figure.count} readings that day from ${fileName}; lowest ${formatFigure(figure.lowest, figure.unit)}, highest ${formatFigure(figure.highest, figure.unit)}.`;
}

/** The same imported reading always has the same id, so a file brought in
 *  twice, or a later file overlapping the days of an earlier one, replaces
 *  those days rather than doubling them, on this device and on any device
 *  it syncs with. */
export function importedReadingId(parts: {
  plotId: string | null;
  plantingId: string | null;
  measurement: string;
  day: string;
  deviceName: string;
}): string {
  const key = [parts.plotId ?? '', parts.plantingId ?? '', parts.measurement, parts.day, parts.deviceName.trim().toLowerCase()].join('|');
  let a = 5381;
  let b = 52711;
  for (let i = 0; i < key.length; i += 1) {
    const code = key.charCodeAt(i);
    a = (Math.imul(a, 33) ^ code) >>> 0;
    b = (Math.imul(b, 31) + code) >>> 0;
  }
  return `reading_file_${a.toString(36)}${b.toString(36)}`;
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
  if (plan.figures.length === 0 || !plan.firstDay || !plan.lastDay) {
    return ['Nothing in this file can be kept as it is set: no row has both a day and a figure in a column picked below.'];
  }
  const lines: string[] = [];
  const span = plan.firstDay === plan.lastDay ? spokenDay(plan.firstDay) : `${spokenDay(plan.firstDay)} to ${spokenDay(plan.lastDay)}`;
  lines.push(`${plural(plan.days, 'day', 'days')}, ${span}, from ${plural(plan.rowsRead, 'row', 'rows')}.`);
  const measured = [...new Set(plan.figures.map((figure) => figure.measurement))].map((code) => labelOf(code).toLowerCase());
  lines.push(
    `One reading per day for ${joinWords(measured)}: that day’s average, with how many rows it came from and the lowest and highest in its note. The months on Trends are then worked out from those daily averages.`,
  );
  if (plan.rowsWithoutDay > 0) lines.push(`${plural(plan.rowsWithoutDay, 'row has', 'rows have')} no day that can be read, and ${plan.rowsWithoutDay === 1 ? 'is' : 'are'} left out.`);
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
  'Bringing in a file again, or a later file that covers some of the same days, replaces those days for this area and device rather than adding them twice. Readings you typed in are never changed.';
