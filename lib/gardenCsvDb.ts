// Reading the garden into CSV files and handing one over (I15, 2026-09-28).
// The columns and quoting are in lib/gardenCsv.ts with no database.
//
// A phone offers the file to its share sheet (Drive, email, a file
// manager); a computer opens Save As, the same way a PDF report leaves.

import { getDatabase } from './db';
import {
  doneCsv,
  gardenCsvFileName,
  GARDEN_CSV_KINDS,
  harvestsCsv,
  plantingsCsv,
  type CsvDone,
  type CsvHarvest,
  type CsvPlanting,
  type GardenCsvKind,
} from './gardenCsv';
import { plantingStatusLabel } from './gardenAreaLifecycle';
import { termLabel } from './growSetup';
import { listGardenTerms } from './growSetupDb';
import { isDesktopApp } from './desktop/bridge';
import { shareFileIfAvailable } from './nativeSharing';
import { dateKey } from './plainDate';

async function readPlantings(): Promise<CsvPlanting[]> {
  const db = await getDatabase();
  return db.getAllAsync<CsvPlanting>(`
    SELECT g.id AS id,
           p.name AS areaName,
           g.food_name AS foodName,
           g.variety_note AS variety,
           g.planted_at AS plantedOn,
           g.expected_harvest_start AS expectedFrom,
           g.expected_harvest_end AS expectedTo,
           g.status AS status,
           (SELECT MIN(h.harvested_at) FROM garden_harvests h WHERE h.planting_id = g.id) AS firstPickedOn,
           (SELECT COUNT(*) FROM garden_harvests h WHERE h.planting_id = g.id) AS harvestCount,
           (SELECT COUNT(*) FROM garden_planting_events e WHERE e.planting_id = g.id) AS doneCount,
           g.notes AS notes
    FROM garden_plantings g
    LEFT JOIN garden_plots p ON p.id = g.plot_id
  `);
}

async function readHarvests(): Promise<CsvHarvest[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Omit<CsvHarvest, 'onHand'> & { onHand: number }>(`
    SELECT h.id AS id,
           h.planting_id AS plantingId,
           h.harvested_at AS harvestedOn,
           h.food_name AS foodName,
           p.name AS areaName,
           h.quantity AS quantity,
           h.unit AS unit,
           h.quantity_remaining AS remaining,
           h.on_hand AS onHand,
           h.notes AS notes
    FROM garden_harvests h
    LEFT JOIN garden_plots p ON p.id = h.plot_id
  `);
  return rows.map((row) => ({ ...row, onHand: row.onHand !== 0 }));
}

async function readDone(): Promise<CsvDone[]> {
  const db = await getDatabase();
  const [rows, terms] = await Promise.all([
    db.getAllAsync<Omit<CsvDone, 'label'> & { kind: string }>(`
      SELECT e.id AS id,
             e.planting_id AS plantingId,
             e.occurred_on AS occurredOn,
             g.food_name AS foodName,
             p.name AS areaName,
             e.kind AS kind,
             e.note AS note
      FROM garden_planting_events e
      JOIN garden_plantings g ON g.id = e.planting_id
      LEFT JOIN garden_plots p ON p.id = COALESCE(e.plot_id, g.plot_id)
    `),
    listGardenTerms(true),
  ]);
  return rows.map(({ kind, ...row }) => ({
    ...row,
    label: termLabel('planting_event_kind', kind, terms) ?? 'A kind no longer on the list',
  }));
}

/** The file's text and how many rows it holds, header aside. */
export async function buildGardenCsv(kind: GardenCsvKind): Promise<{ text: string; rows: number }> {
  if (kind === 'plantings') {
    const rows = await readPlantings();
    return { text: plantingsCsv(rows, plantingStatusLabel), rows: rows.length };
  }
  if (kind === 'harvests') {
    const rows = await readHarvests();
    return { text: harvestsCsv(rows), rows: rows.length };
  }
  const rows = await readDone();
  return { text: doneCsv(rows), rows: rows.length };
}

export type GardenCsvOutcome =
  | { status: 'empty' }
  | { status: 'offered' }
  | { status: 'savedOnly'; uri: string }
  | { status: 'failed'; message: string };

export async function exportGardenCsv(kind: GardenCsvKind): Promise<GardenCsvOutcome> {
  try {
    const { text, rows } = await buildGardenCsv(kind);
    if (rows === 0) return { status: 'empty' };
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.cache, 'garden-csv');
    if (!dir.exists) dir.create({ intermediates: true });
    const file = new File(dir, gardenCsvFileName(kind, dateKey(new Date())));
    if (file.exists) file.delete();
    file.write(text);
    const title = GARDEN_CSV_KINDS.find((entry) => entry.kind === kind)?.dialogTitle;
    const offered = await shareFileIfAvailable(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle: title });
    // On a computer a false means Save As was cancelled, which needs no word.
    return offered || isDesktopApp() ? { status: 'offered' } : { status: 'savedOnly', uri: file.uri };
  } catch (error) {
    console.error('[gardenCsv] export failed', error);
    return { status: 'failed', message: error instanceof Error ? error.message : String(error) };
  }
}
