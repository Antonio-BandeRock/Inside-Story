// Reading the photos a report carries (lib/reportPhotos.ts holds the rules).
// Each photo is read as its report-size file and embedded in the PDF as a
// data address, since expo-print lays out a page with no access to the
// app's files. A photo whose file is not here yet is counted and left out.

import { getDatabase } from './db';
import { mediaMimeType, type MediaItem } from './media';
import { listMediaOfKind, mediaFile } from './mediaDb';
import type { ReportPhotoSection } from './reportGenerator';
import { choosePhotosForReport, reportPhotoCaption, reportPhotoNote } from './reportPhotos';

async function photoSection(
  heading: string,
  items: MediaItem[],
  start: string,
  end: string,
  subjectOf: (item: MediaItem) => string | null,
  empty: string,
): Promise<ReportPhotoSection> {
  const { chosen, total } = choosePhotosForReport(items, start, end);
  const rows: ReportPhotoSection['rows'] = [];
  let unreadable = 0;
  for (const item of chosen) {
    try {
      const file = await mediaFile(item.fileName);
      if (!file.exists) {
        unreadable += 1;
        continue;
      }
      rows.push({
        caption: reportPhotoCaption(item.takenOn, subjectOf(item), item.caption),
        dataUri: `data:${mediaMimeType(item.fileName)};base64,${await file.base64()}`,
      });
    } catch {
      unreadable += 1;
    }
  }
  return {
    kind: 'photos',
    heading,
    note: total > 0 ? reportPhotoNote(rows.length, total, unreadable) : undefined,
    rows,
    empty,
  };
}

const CHECKIN_KIND_LABEL: Record<string, string> = { flare: 'Flare', post_meal: 'After-meal reaction' };

/** Photos taken of symptoms in the range, for the doctor report. */
export async function symptomPhotoSection(start: string, end: string): Promise<ReportPhotoSection> {
  const items = await listMediaOfKind('symptom');
  const db = await getDatabase();
  const kinds = new Map(
    (await db.getAllAsync<{ id: string; checkinType: string }>('SELECT id, checkin_type AS checkinType FROM wellbeing_checkins')).map(
      (row) => [row.id, row.checkinType],
    ),
  );
  return photoSection(
    'Photos of symptoms',
    items,
    start,
    end,
    (item) => CHECKIN_KIND_LABEL[kinds.get(item.ownerId) ?? ''] ?? null,
    'No photos of symptoms taken in this range.',
  );
}

/** Photos taken of plantings in the range, for the garden report. */
export async function plantingPhotoSection(start: string, end: string): Promise<ReportPhotoSection> {
  const items = await listMediaOfKind('planting');
  const db = await getDatabase();
  const names = new Map(
    (await db.getAllAsync<{ id: string; name: string; variety: string | null }>(
      'SELECT id, food_name AS name, variety_note AS variety FROM garden_plantings',
    )).map((row) => [row.id, row.variety ? `${row.name} (${row.variety})` : row.name]),
  );
  return photoSection(
    'Photos of plantings',
    items,
    start,
    end,
    (item) => names.get(item.ownerId) ?? null,
    'No photos of plantings taken in this range.',
  );
}
