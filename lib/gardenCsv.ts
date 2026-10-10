// The garden as spreadsheet files (I15, 2026-09-28): every planting, every
// harvest and everything recorded as done to a planting, one CSV file each,
// for opening in Excel, Google Sheets, Numbers or anything else that reads
// CSV. Built without the database so node scripts/test_garden_csv.js can
// check it; the reading and saving are in lib/gardenCsvDb.ts.
//
// Three files rather than one, because each holds a different kind of row
// with different columns, and a spreadsheet reads one table per file.
// Every file carries the whole record, whatever range a report is showing,
// since a spreadsheet is where somebody does their own filtering.
//
// The format is RFC 4180: a field holding a comma, a quote or a line break
// is quoted and its quotes doubled, lines end in CRLF, and the file starts
// with a UTF-8 byte order mark so Excel reads an accented food name as
// written rather than as mojibake.

export type CsvCell = string | number | null | undefined;

export function csvField(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'number' ? (Number.isFinite(value) ? String(value) : '') : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: CsvCell[][]): string {
  const lines = [header, ...rows].map((row) => row.map(csvField).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
}

export type CsvPlanting = {
  id: string;
  areaName: string | null;
  foodName: string;
  variety: string | null;
  plantedOn: string;
  expectedFrom: string | null;
  expectedTo: string | null;
  status: string;
  firstPickedOn: string | null;
  harvestCount: number;
  doneCount: number;
  notes: string | null;
};

export type CsvHarvest = {
  id: string;
  plantingId: string | null;
  harvestedOn: string;
  foodName: string;
  areaName: string | null;
  quantity: number;
  unit: string;
  remaining: number;
  onHand: boolean;
  notes: string | null;
};

export type CsvDone = {
  id: string;
  plantingId: string;
  occurredOn: string;
  foodName: string;
  areaName: string | null;
  label: string;
  note: string | null;
};

export const PLANTINGS_HEADER = [
  'Area',
  'Crop',
  'Variety',
  'Planted',
  'Expected harvest from',
  'Expected harvest to',
  'Status',
  'First picked',
  'Harvests recorded',
  'Things done recorded',
  'Notes',
  'Planting ID',
];

export const HARVESTS_HEADER = [
  'Date',
  'Crop',
  'Area',
  'Amount',
  'Unit',
  'Still on hand',
  'Kept as food',
  'Notes',
  'Planting ID',
];

export const DONE_HEADER = ['Date', 'Crop', 'Area', 'What was done', 'Note', 'Planting ID'];

/** Sorted the way a person reads a garden: by area, then the day it went
 *  in, then the crop. An area that was removed reads as blank. */
export function plantingsCsv(plantings: CsvPlanting[], statusLabel: (status: string) => string): string {
  const sorted = [...plantings].sort(
    (a, b) =>
      (a.areaName ?? '').localeCompare(b.areaName ?? '') ||
      a.plantedOn.localeCompare(b.plantedOn) ||
      a.foodName.localeCompare(b.foodName),
  );
  return toCsv(
    PLANTINGS_HEADER,
    sorted.map((p) => [
      p.areaName,
      p.foodName,
      p.variety,
      p.plantedOn,
      p.expectedFrom,
      p.expectedTo,
      statusLabel(p.status),
      p.firstPickedOn,
      p.harvestCount,
      p.doneCount,
      p.notes,
      p.id,
    ]),
  );
}

/** Oldest first, so a spreadsheet reads down the season. */
export function harvestsCsv(harvests: CsvHarvest[]): string {
  const sorted = [...harvests].sort((a, b) => a.harvestedOn.localeCompare(b.harvestedOn) || a.foodName.localeCompare(b.foodName));
  return toCsv(
    HARVESTS_HEADER,
    sorted.map((h) => [
      h.harvestedOn,
      h.foodName,
      h.areaName,
      h.quantity,
      h.unit,
      h.remaining,
      h.onHand ? 'Yes' : 'No',
      h.notes,
      h.plantingId,
    ]),
  );
}

export function doneCsv(entries: CsvDone[]): string {
  const sorted = [...entries].sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.foodName.localeCompare(b.foodName));
  return toCsv(
    DONE_HEADER,
    sorted.map((d) => [d.occurredOn, d.foodName, d.areaName, d.label, d.note, d.plantingId]),
  );
}

export type GardenCsvKind = 'plantings' | 'harvests' | 'done';

export const GARDEN_CSV_KINDS: { kind: GardenCsvKind; label: string; dialogTitle: string }[] = [
  { kind: 'plantings', label: 'Plantings', dialogTitle: 'Save the plantings as a spreadsheet' },
  { kind: 'harvests', label: 'Harvests', dialogTitle: 'Save the harvests as a spreadsheet' },
  { kind: 'done', label: 'What was done', dialogTitle: 'Save what was done as a spreadsheet' },
];

export function gardenCsvFileName(kind: GardenCsvKind, today: string): string {
  const part = kind === 'done' ? 'what-was-done' : kind;
  return `lifestead-garden-${part}-${today}.csv`;
}

/** Said when a file would hold nothing but its header row. */
export function nothingToSave(kind: GardenCsvKind): string {
  if (kind === 'plantings') return 'No planting has been recorded yet, so there is nothing to put in the file.';
  if (kind === 'harvests') return 'No harvest has been recorded yet, so there is nothing to put in the file.';
  return 'Nothing has been recorded as done to a planting yet, so there is nothing to put in the file.';
}

export const GARDEN_CSV_CAPTION =
  'Each file holds everything recorded, whatever the range above, and opens in Excel, Google Sheets, Numbers or any program that reads CSV.';
