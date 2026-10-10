// Reading everything that has a place written down, out of the three tables
// that hold one.
//
// 2026-09-23, phase 1 of the cross-app push. lib/whereIsIt.ts holds every
// rule about searching and about how much a location can be trusted and reads
// nothing; this file is the half that touches the database, so the rules stay
// checkable in plain node.
//
// THREE SOURCES, ONE ANSWER, the same shape lib/kitchenDb.ts already uses:
//
//  1. kitchen_items, where somebody answered "Where is it?" on the form. The
//     only one that can be corrected from the results, since it is the only
//     one whose place is a field of its own.
//  2. capture_notes sorted to 'place', which is how a thing that is not food
//     gets in at all. A spoken line keeps its wording, so the thing and the
//     place arrive as one sentence rather than two fields, and the search
//     reads the whole sentence.
//  3. garden_plantings still growing, whose place is the area they are in.
//     Read only here: a planting moves by being harvested, and that happens in
//     Garden where the rest of its history is.
import { getDatabase } from './db';
import { addKitchenItem, deleteKitchenItem, setKitchenItemLocation } from './kitchenDb';
import type { PlaceRecord } from './whereIsIt';
import { cleanPlaceName, isPlaceNameUsable } from './whereIsIt';

type KitchenPlaceRow = {
  id: string;
  foodName: string;
  location: string;
  locationSetAt: string | null;
  addedAt: string;
  quantityRemaining: number;
  unit: string;
  note: string | null;
};

type NotePlaceRow = {
  id: string;
  text: string;
  createdAt: string;
};

type PlantingPlaceRow = {
  id: string;
  foodName: string;
  varietyNote: string | null;
  plantedAt: string;
  plotName: string;
};

// What is left of something, said the way the Kitchen says it, or null where
// there is nothing worth adding. A place that comes with "2 of 6 left" saves
// somebody a walk.
function kitchenDetail(row: KitchenPlaceRow): string | null {
  const parts: string[] = [];
  if (row.quantityRemaining > 0 && row.unit) {
    parts.push(`${Number(row.quantityRemaining.toFixed(2))} ${row.unit}`);
  }
  if (row.note) parts.push(row.note);
  return parts.length > 0 ? parts.join(' · ') : null;
}

// Everything findable, in no particular order: lib/whereIsIt.ts sorts it,
// since how the answers rank is part of the rules rather than part of the
// reading.
export async function listPlaceRecords(): Promise<PlaceRecord[]> {
  const db = await getDatabase();
  const records: PlaceRecord[] = [];

  // Both kinds, food and household. Somebody looking for the spare bulbs is
  // the person this feature was built for, and splitting the search by which
  // inventory a thing sits in would be the app's filing showing through.
  const kitchenRows = await db.getAllAsync<KitchenPlaceRow>(
    `SELECT id, food_name AS foodName, location, location_set_at AS locationSetAt,
            added_at AS addedAt, quantity_remaining AS quantityRemaining, unit, note
       FROM kitchen_items
      WHERE location IS NOT NULL AND TRIM(location) <> '' AND quantity_remaining > 0`,
  );
  for (const row of kitchenRows) {
    const place = cleanPlaceName(row.location);
    if (!isPlaceNameUsable(place)) continue;
    records.push({
      id: `kitchen:${row.id}`,
      kind: 'kitchen',
      what: row.foodName,
      place,
      detail: kitchenDetail(row),
      // A row that predates the columns has a place but no date for it, which
      // reads as the day the item arrived. That is the oldest the answer can
      // be, so it errs toward warning rather than toward false confidence.
      placedOn: (row.locationSetAt ?? row.addedAt).slice(0, 10),
      editable: true,
    });
  }

  const noteRows = await db.getAllAsync<NotePlaceRow>(
    `SELECT id, text, created_at AS createdAt
       FROM capture_notes
      WHERE destination = 'place' AND status <> 'done'`,
  );
  for (const row of noteRows) {
    records.push({
      id: `note:${row.id}`,
      kind: 'note',
      // The sentence as it was said. Nothing here tries to pull the thing and
      // the place apart: "the spare batteries are in the hall cupboard" is
      // already the answer, and guessing at which half is which would be how
      // the app starts being wrong about somebody's house.
      what: row.text,
      place: 'From a note',
      detail: null,
      placedOn: row.createdAt.slice(0, 10),
      editable: false,
    });
  }

  const plantingRows = await db.getAllAsync<PlantingPlaceRow>(
    `SELECT p.id, p.food_name AS foodName, p.variety_note AS varietyNote,
            p.planted_at AS plantedAt, a.name AS plotName
       FROM garden_plantings p
       JOIN garden_plots a ON a.id = p.plot_id
      WHERE p.status = 'growing' AND a.archived_at IS NULL`,
  );
  for (const row of plantingRows) {
    records.push({
      id: `garden:${row.id}`,
      kind: 'garden',
      what: row.foodName,
      place: row.plotName,
      detail: row.varietyNote,
      placedOn: row.plantedAt.slice(0, 10),
      editable: false,
    });
  }

  return records;
}

// How many things are findable, for the one line Home shows without being
// opened. Counted rather than listed, since Home reads this on every focus and
// has no use for the rows themselves.
export async function countPlaceRecords(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT
       (SELECT COUNT(*) FROM kitchen_items
         WHERE location IS NOT NULL AND TRIM(location) <> '' AND quantity_remaining > 0)
     + (SELECT COUNT(*) FROM capture_notes WHERE destination = 'place' AND status <> 'done')
     + (SELECT COUNT(*) FROM garden_plantings p
          JOIN garden_plots a ON a.id = p.plot_id
         WHERE p.status = 'growing' AND a.archived_at IS NULL)
       AS total`,
  );
  return row?.total ?? 0;
}

// The places already used, for offering as chips on the Kitchen form. Read
// straight from what is stored rather than kept as a list of its own, which is
// what keeps this an open list by the standing rule: a place stops being
// offered once nothing is in it any more, and nothing can be orphaned because
// nothing refers to a place except the rows sitting in it.
export async function listUsedPlaces(limit = 8): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ location: string }>(
    `SELECT location
       FROM kitchen_items
      WHERE location IS NOT NULL AND TRIM(location) <> ''
      ORDER BY COALESCE(location_set_at, added_at) DESC
      LIMIT 200`,
  );
  const seen = new Set<string>();
  const places: string[] = [];
  for (const row of rows) {
    const place = cleanPlaceName(row.location);
    const key = place.toLowerCase();
    if (!isPlaceNameUsable(place) || seen.has(key)) continue;
    seen.add(key);
    places.push(place);
    if (places.length >= limit) break;
  }
  return places;
}

// Store Its Location, 1.0.66.9 (2026-10-10): the companion to Where Is
// It. Direct request: "Where is it can only draw on what the user has told it
// about where something is located. We need a button for them to do that."
//
// A thing already in Kitchen under the same name (food or household, still on
// hand) has its place moved, the way "I moved it" does, rather than a second
// copy being made, since two answers for one thing is how a search starts
// sending somebody to the wrong cupboard. Anything else becomes a household
// item of one with that place, which is where Where Is It and Life > Kitchen
// both already look. Nothing here guesses at food: the person can move it to
// the food side in Kitchen if that is where it belongs.
// previous is where a moved thing was before, kept so That's Wrong can put it
// back (1.0.66.10): Store Its Location saves the moment the sentence is
// understood, so the person who sees it went wrong needs one way back.
export type RememberedWhere = {
  kind: 'moved' | 'added';
  id: string;
  what: string;
  place: string;
  previous: { location: string | null; setAt: string | null } | null;
};

export async function rememberWhere(what: string, place: string): Promise<RememberedWhere | null> {
  const name = what.replace(/\s+/g, ' ').trim();
  const cleanedPlace = cleanPlaceName(place);
  if (!name || !isPlaceNameUsable(cleanedPlace)) return null;
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string; foodName: string; location: string | null; setAt: string | null }>(
    `SELECT id, food_name AS foodName, location, location_set_at AS setAt
       FROM kitchen_items
      WHERE LOWER(TRIM(food_name)) = LOWER(?) AND quantity_remaining > 0
      ORDER BY COALESCE(location_set_at, added_at) DESC
      LIMIT 1`,
    name,
  );
  if (existing) {
    await setKitchenItemLocation(existing.id, cleanedPlace);
    return {
      kind: 'moved',
      id: existing.id,
      what: existing.foodName,
      place: cleanedPlace,
      previous: { location: existing.location, setAt: existing.setAt },
    };
  }
  const id = await addKitchenItem({ foodName: name, quantity: 1, unit: 'item', kind: 'non_food', location: cleanedPlace });
  return { kind: 'added', id, what: name, place: cleanedPlace, previous: null };
}

// Takes back what rememberWhere just did: a new row goes, a moved one returns
// to the place and date it had.
export async function undoRememberWhere(done: RememberedWhere): Promise<void> {
  if (done.kind === 'added') {
    await deleteKitchenItem(done.id);
    return;
  }
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE kitchen_items SET location = ?, location_set_at = ? WHERE id = ?',
    done.previous?.location ?? null,
    done.previous?.setAt ?? null,
    done.id,
  );
}
