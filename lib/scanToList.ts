// A barcode onto the grocery list (G7 of the competitive build plan, Phase 2,
// 2026-09-26). Two ways in: a food scan whose result is worth buying again,
// and a household thing (dish soap, foil, toothpaste) that the food scanner
// has nothing to say about. Household products are looked up in Open Products
// Facts and Open Beauty Facts, the two sister databases of Open Food Facts,
// and what the person settles on is remembered on this device against the
// barcode, so the second scan of the same bottle needs no network at all.
//
// Only the barcode leaves the phone, the same keyed-lookup shape as the food
// scanner. Pure: no database, no fetch and no React, so
// scripts/test_scan_to_list.js can check it directly.

export type HouseholdLookupSource = 'OpenProductsFacts' | 'OpenBeautyFacts';

export type HouseholdProduct = {
  barcode: string;
  name: string;
  brand: string | null;
  source: HouseholdLookupSource | 'Remembered' | 'Typed';
  /** One of the Kitchen's household groups (constants/householdItems.ts). */
  group: string;
};

/** The group a looked-up product starts in, before the person changes it. */
export function defaultGroupFor(source: HouseholdProduct['source']): string {
  return source === 'OpenBeautyFacts' ? 'Personal Care' : 'Around the House';
}

/**
 * A barcode as typed or read: digits only, 8 to 14 of them (EAN-8, UPC-A,
 * EAN-13, GTIN-14). Spaces and dashes a person types between groups are
 * dropped. Anything else is not a barcode this app can look up.
 */
export function readBarcode(text: string): string | null {
  const digits = text.replace(/[\s-]/g, '');
  if (!/^\d{8,14}$/.test(digits)) return null;
  return digits;
}

/**
 * The product in one of the two lookups' answers, or null for a miss. Both
 * answer a miss as `status: 0`, some with a 404 and some with a 200, so the
 * status field is what is read rather than the HTTP code.
 */
export function householdProductFromResponse(
  data: unknown,
  barcode: string,
  source: HouseholdLookupSource,
): HouseholdProduct | null {
  if (!data || typeof data !== 'object') return null;
  const body = data as { status?: unknown; product?: unknown };
  if (body.status !== 1 || !body.product || typeof body.product !== 'object') return null;
  const product = body.product as { product_name?: unknown; brands?: unknown };
  const name = typeof product.product_name === 'string' ? product.product_name.replace(/\s+/g, ' ').trim() : '';
  if (!name) return null;
  const brand =
    typeof product.brands === 'string' && product.brands.trim() ? product.brands.split(',')[0].trim() : null;
  return { barcode, name, brand, source, group: defaultGroupFor(source) };
}

/** The line's name on the list: the brand leads when the name does not already carry it. */
export function listLineName(name: string, brand: string | null): string {
  const clean = name.replace(/\s+/g, ' ').trim();
  if (!brand) return clean;
  const cleanBrand = brand.trim();
  if (!cleanBrand || clean.toLowerCase().includes(cleanBrand.toLowerCase())) return clean;
  return `${cleanBrand} ${clean}`;
}

/** What is said once a scanned thing is on a list. */
export function describeAddedToList(itemName: string, listName: string, started: boolean): string {
  return started
    ? `${itemName} is on a new list, ${listName}, since no list was open.`
    : `${itemName} is on ${listName}.`;
}

/** Where a household product's name came from, for the line under it. */
export function describeHouseholdSource(source: HouseholdProduct['source']): string {
  switch (source) {
    case 'OpenProductsFacts':
      return 'Found in Open Products Facts. Change the name if it reads oddly.';
    case 'OpenBeautyFacts':
      return 'Found in Open Beauty Facts. Change the name if it reads oddly.';
    case 'Remembered':
      return 'You have scanned this one before, so this is the name you gave it.';
    default:
      return 'Not in either product database yet. Type what it is and this phone remembers it for next time.';
  }
}
