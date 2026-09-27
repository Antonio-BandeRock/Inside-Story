// The database half of a barcode onto the grocery list (G7, 2026-09-27). The
// pure half, the reading of a barcode and of the two lookups' answers and
// every sentence, is lib/scanToList.ts.
//
// Two rules keep this from ever being a cause of lag. Nothing here writes on
// a read: finding a product only reads household_barcodes. And the remembered
// name is written only when it differs from what is already kept, so putting
// the same bottle on the list every week changes one list line and nothing
// else for the sync to carry.
import { getDatabase } from './db';
import { lookupHouseholdProductByBarcode } from './barcodeLookup';
import { addGroceryListItem, createHandGroceryList, getActiveGroceryList, getGroceryList } from './groceryDb';
import type { HouseholdProduct } from './scanToList';

type RememberedRow = { barcode: string; name: string; brand: string | null; item_group: string; unit: string };

export type RememberedHousehold = HouseholdProduct & { unit: string };

export async function getRememberedHousehold(barcode: string): Promise<RememberedHousehold | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RememberedRow>(
    'SELECT barcode, name, brand, item_group, unit FROM household_barcodes WHERE barcode = ?',
    barcode,
  );
  if (!row) return null;
  return { barcode: row.barcode, name: row.name, brand: row.brand, group: row.item_group, unit: row.unit, source: 'Remembered' };
}

export type HouseholdFind =
  | { kind: 'found'; product: HouseholdProduct; unit: string }
  | { kind: 'missing' }
  | { kind: 'offline' };

/**
 * What this barcode is: the name given it on this device first, then the two
 * product databases. A network failure is reported as offline rather than as
 * a miss, so the person is not told a product is unknown when it was never
 * asked about.
 */
export async function findHouseholdProduct(barcode: string): Promise<HouseholdFind> {
  const remembered = await getRememberedHousehold(barcode);
  if (remembered) return { kind: 'found', product: remembered, unit: remembered.unit };
  try {
    const looked = await lookupHouseholdProductByBarcode(barcode);
    return looked ? { kind: 'found', product: looked, unit: '' } : { kind: 'missing' };
  } catch {
    return { kind: 'offline' };
  }
}

async function rememberHousehold(input: { barcode: string; name: string; brand: string | null; group: string; unit: string }) {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<RememberedRow>(
    'SELECT barcode, name, brand, item_group, unit FROM household_barcodes WHERE barcode = ?',
    input.barcode,
  );
  if (
    existing &&
    existing.name === input.name &&
    (existing.brand ?? null) === input.brand &&
    existing.item_group === input.group &&
    existing.unit === input.unit
  ) {
    return;
  }
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO household_barcodes (barcode, name, brand, item_group, unit, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(barcode) DO UPDATE SET name = excluded.name, brand = excluded.brand,
       item_group = excluded.item_group, unit = excluded.unit, updated_at = excluded.updated_at`,
    input.barcode,
    input.name,
    input.brand,
    input.group,
    input.unit,
    now,
    now,
  );
}

export type PutOnList = { listId: string; listName: string; started: boolean };

/** The list being shopped, or a new empty one when none is open. */
async function listToAddTo(preferredListId?: string | null): Promise<PutOnList> {
  if (preferredListId) {
    const named = await getGroceryList(preferredListId);
    if (named && named.status === 'active') return { listId: named.id, listName: named.name, started: false };
  }
  const active = await getActiveGroceryList();
  if (active) return { listId: active.id, listName: active.name, started: false };
  const id = await createHandGroceryList();
  const created = await getGroceryList(id);
  return { listId: id, listName: created?.name ?? 'a new list', started: true };
}

/** A household thing onto the list, its name kept against the barcode. */
export async function putHouseholdOnList(input: {
  barcode: string;
  lineName: string;
  name: string;
  brand: string | null;
  group: string;
  unit: string;
  quantity: number;
  listId?: string | null;
}): Promise<PutOnList> {
  await rememberHousehold({ barcode: input.barcode, name: input.name, brand: input.brand, group: input.group, unit: input.unit });
  const target = await listToAddTo(input.listId);
  await addGroceryListItem(target.listId, {
    foodName: input.lineName,
    category: input.group,
    unit: input.unit,
    quantity: input.quantity,
    kind: 'non_food',
  });
  return target;
}

/** A scanned food, already in My Processed Foods, onto the list. */
export async function putScannedFoodOnList(name: string, scannedProductId: number | null): Promise<PutOnList> {
  const target = await listToAddTo(null);
  await addGroceryListItem(target.listId, { foodName: name, quantity: 1, scannedProductId });
  return target;
}
