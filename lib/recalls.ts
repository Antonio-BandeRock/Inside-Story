// Recalls matched to My Meds and scanned foods (A14, 2026-10-02): reading
// the FDA's recall list and matching it against what a person keeps, with
// every sentence said about a match. No I/O here; lib/recallsDb.ts fetches,
// stores and reads.
//
// The privacy shape is the one for anything by condition (item 27): every
// phone asks openFDA for the same thing, every drug and food recall reported
// in a date range, and the matching happens here. The only thing a request
// carries is the range. The plan named a Worker for the bundle; openFDA is
// free, keyless and answers each phone directly, so the Worker would only
// have added a running cost, the same call F22 made for weather.
//
// A match is offered in two strengths and never more: the same code (a drug's
// NDC, a food's barcode), which points at that very product, or the same
// name, which says a recall names something called this and leaves the
// lot numbers for the person to check. Nothing here says a medicine should
// be stopped; a prescribed one is the prescriber's.

export type RecallKind = 'drug' | 'food';

export type Recall = {
  recallNumber: string;
  kind: RecallKind;
  firm: string;
  product: string;
  reason: string;
  classification: string;
  status: string;
  /** YYYY-MM-DD. */
  reportDate: string;
  codeInfo: string;
  /** Product-level NDCs (labeler-product), from the record's codes and its text. */
  ndcs: string[];
  /** Barcodes with their leading zeros taken off. */
  upcs: string[];
  /** openFDA's brand and generic names, where the record has any. */
  names: string[];
};

export const OPENFDA_ENFORCEMENT_URL: Record<RecallKind, string> = {
  drug: 'https://api.fda.gov/drug/enforcement.json',
  food: 'https://api.fda.gov/food/enforcement.json',
};

/** openFDA answers at most this many records a request. */
/** The start of every recall notification's identifier, so a tap on one can be told apart. */
export const RECALL_NOTIFICATION_PREFIX = 'recall-match';
export const RECALL_PAGE_SIZE = 1000;
/** And refuses to skip past this many. */
export const RECALL_MAX_SKIP = 25000;
/** How far back the list reaches. */
export const RECALL_WINDOW_DAYS = 365;
/** A later read goes back this far before the newest kept report, for records filed late. */
export const RECALL_OVERLAP_DAYS = 14;

export const FDA_ENFORCEMENT_REPORTS_URL = 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts/enforcement-reports';
export const FDA_RECALL_CLASSES_URL = 'https://www.fda.gov/safety/industry-guidance-recalls/recalls-background-and-definitions';

function compact(day: string): string {
  return day.replace(/-/g, '');
}

/** One page of recalls reported between two days, inclusive. */
export function recallUrl(kind: RecallKind, start: string, end: string, skip = 0): string {
  const range = `report_date:%5B${compact(start)}+TO+${compact(end)}%5D`;
  return `${OPENFDA_ENFORCEMENT_URL[kind]}?search=${range}&limit=${RECALL_PAGE_SIZE}${skip > 0 ? `&skip=${skip}` : ''}`;
}

export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** The span the next read asks for: the whole year when nothing is kept, otherwise from just before the newest report. */
export function spanToRead(today: string, newestKept: string | null): { start: string; end: string } {
  const yearAgo = addDays(today, -RECALL_WINDOW_DAYS);
  if (!newestKept) return { start: yearAgo, end: today };
  const from = addDays(newestKept, -RECALL_OVERLAP_DAYS);
  return { start: from < yearAgo ? yearAgo : from, end: today };
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0).map((v) => v.trim()) : [];
}

function isoDay(raw: string): string {
  return /^\d{8}$/.test(raw) ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : '';
}

/** Product-level NDCs (the labeler and product segments) written in a passage. */
export function ndcsIn(passage: string): string[] {
  const found = new Set<string>();
  for (const m of passage.matchAll(/\b(\d{4,5})-(\d{3,4})(?:-(\d{1,2}))?\b/g)) {
    const [labeler, product, pack] = [m[1], m[2], m[3]];
    // Only the three shapes an NDC can take: 4-4-2, 5-3-2 and 5-4-1.
    const shape = `${labeler.length}-${product.length}${pack ? `-${pack.length}` : ''}`;
    if (!['4-4-2', '5-3-2', '5-4-1', '4-4', '5-3', '5-4'].includes(shape)) continue;
    found.add(`${labeler}-${product}`);
  }
  return [...found];
}

/** The product part of a package or product NDC as openFDA writes it. */
export function productNdc(code: string): string | null {
  const parts = code.trim().split('-');
  return parts.length >= 2 && /^\d{4,5}$/.test(parts[0]) && /^\d{3,4}$/.test(parts[1]) ? `${parts[0]}-${parts[1]}` : null;
}

export function normalizeBarcode(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^0+/, '');
}

/**
 * Barcodes a recall names. Only digits that follow UPC, GTIN or EAN count,
 * since a passage full of lot numbers and dates has plenty of other long
 * numbers. A barcode may be printed with spaces or hyphens between its
 * groups ("7 41643 05576 6"), and a run too long to be one is split at its
 * spaces in case it is two.
 */
export function barcodesIn(passage: string): string[] {
  const found = new Set<string>();
  for (const m of passage.matchAll(/\b(?:UPC|GTIN|EAN)[^0-9]{0,24}/gi)) {
    const after = passage.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 400);
    for (const run of after.match(/\d(?:[ -]?\d)*/g) ?? []) {
      const digits = run.replace(/\D/g, '');
      const pieces = digits.length > 14 ? run.split(' ').map((p) => p.replace(/\D/g, '')) : [digits];
      for (const piece of pieces) {
        if (piece.length >= 8 && piece.length <= 14) found.add(normalizeBarcode(piece));
      }
    }
  }
  found.delete('');
  return [...found];
}

/** Two barcodes the same, allowing for one written without its check digit. */
export function sameBarcode(a: string, b: string): boolean {
  const x = normalizeBarcode(a);
  const y = normalizeBarcode(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = x.length < y.length ? [x, y] : [y, x];
  return short.length >= 10 && long.length === short.length + 1 && long.startsWith(short);
}

export function parseRecalls(json: unknown, kind: RecallKind): { recalls: Recall[]; total: number } {
  const body = json as { meta?: { results?: { total?: unknown } }; results?: unknown };
  const total = typeof body?.meta?.results?.total === 'number' ? body.meta.results.total : 0;
  const rows = Array.isArray(body?.results) ? body.results : [];
  const recalls: Recall[] = [];
  for (const raw of rows) {
    const r = raw as Record<string, unknown>;
    const recallNumber = text(r.recall_number);
    const reportDate = isoDay(text(r.report_date));
    const product = text(r.product_description);
    if (!recallNumber || !reportDate || !product) continue;
    const codeInfo = text(r.code_info);
    const fda = (r.openfda ?? {}) as Record<string, unknown>;
    const ndcs = new Set<string>(kind === 'drug' ? ndcsIn(`${product} ${codeInfo}`) : []);
    for (const code of [...strings(fda.product_ndc), ...strings(fda.package_ndc)]) {
      const p = productNdc(code);
      if (p) ndcs.add(p);
    }
    recalls.push({
      recallNumber,
      kind,
      firm: text(r.recalling_firm),
      product,
      reason: text(r.reason_for_recall),
      classification: text(r.classification),
      status: text(r.status),
      reportDate,
      codeInfo,
      ndcs: [...ndcs],
      upcs: barcodesIn(`${product} ${codeInfo}`),
      names: [...new Set([...strings(fda.brand_name), ...strings(fda.generic_name)].map((n) => n.toLowerCase()))],
    });
  }
  return { recalls, total };
}

// --- Matching ------------------------------------------------------------

export type MedicineToMatch = {
  id: string;
  name: string;
  treatmentType: string;
  /** From this app's medication list, when the med was picked from it. */
  genericName?: string | null;
  brandNames?: string[];
  /** From a kept label (A11). */
  labelNdcs?: string[];
  labelNames?: string[];
};

export type ProductToMatch = { id: number; name: string; brand: string | null; barcode: string };

export type RecallMatchStrength = 'code' | 'name';

export type RecallMatch = {
  recall: Recall;
  ownerKind: 'treatment' | 'scanned_product';
  ownerId: string;
  ownerName: string;
  strength: RecallMatchStrength;
  /** The code or name that matched, for the sentence that says so. */
  matchedOn: string;
};

// Words a name is made of that say nothing about which medicine it is.
const DOSE_WORDS = new Set([
  'mg', 'mcg', 'ug', 'g', 'ml', 'iu', 'units', 'unit', 'tablet', 'tablets', 'tab', 'tabs', 'capsule', 'capsules', 'cap', 'caps',
  'softgel', 'softgels', 'gummy', 'gummies', 'pill', 'pills', 'daily', 'er', 'xr', 'sr', 'dr', 'xl', 'oral', 'liquid', 'drops',
]);
// Names this broad would match a recall for something else entirely.
const TOO_BROAD = new Set(['vitamin', 'vitamins', 'multivitamin', 'supplement', 'mineral', 'minerals', 'support', 'complex', 'formula', 'thyroid', 'probiotic', 'fiber', 'protein']);
const FOOD_STOP = new Set(['with', 'and', 'the', 'from', 'style', 'flavor', 'flavored', 'original', 'organic', 'natural', 'classic', 'pack', 'size', 'family']);

/** A name with the dose and form words taken off, or null when what is left is too broad to match on. */
export function nameToMatch(raw: string | null | undefined): string | null {
  const words = (raw ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !/\d/.test(w) && !DOSE_WORDS.has(w));
  const name = words.join(' ').trim();
  if (name.length < 4) return null;
  if (words.every((w) => TOO_BROAD.has(w))) return null;
  return name;
}

function hasPhrase(haystack: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(haystack);
}

/** A food recall about a supplement, the only food recalls a supplement's name is matched against. */
export function isSupplementRecall(recall: Recall): boolean {
  return recall.kind === 'food' && /\bsupplement/i.test(recall.product);
}

export function matchMedicine(med: MedicineToMatch, recalls: Recall[]): RecallMatch[] {
  const isSupplement = med.treatmentType === 'supplement';
  const ndcs = new Set((med.labelNdcs ?? []).map((c) => productNdc(c)).filter((c): c is string => !!c));
  const names = [
    ...new Set(
      [med.name, med.genericName, ...(med.brandNames ?? []), ...(med.labelNames ?? [])]
        .map((n) => nameToMatch(n))
        .filter((n): n is string => !!n),
    ),
  ];
  const out: RecallMatch[] = [];
  for (const recall of recalls) {
    if (isSupplement ? !isSupplementRecall(recall) : recall.kind !== 'drug') continue;
    const code = recall.ndcs.find((c) => ndcs.has(c));
    if (code) {
      out.push({ recall, ownerKind: 'treatment', ownerId: med.id, ownerName: med.name, strength: 'code', matchedOn: code });
      continue;
    }
    const haystack = `${recall.product} ${recall.names.join(' ')}`;
    const name = names.find((n) => hasPhrase(haystack, n));
    if (name) out.push({ recall, ownerKind: 'treatment', ownerId: med.id, ownerName: med.name, strength: 'name', matchedOn: name });
  }
  return out;
}

export function matchProduct(product: ProductToMatch, recalls: Recall[]): RecallMatch[] {
  const brand = nameToMatch(product.brand);
  const nameWords = (product.name ?? '')
    .toLowerCase()
    .replace(/[^a-z ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !FOOD_STOP.has(w) && (!brand || !brand.split(' ').includes(w)));
  const out: RecallMatch[] = [];
  const ownerId = String(product.id);
  for (const recall of recalls) {
    if (recall.kind !== 'food') continue;
    const code = product.barcode ? recall.upcs.find((u) => sameBarcode(u, product.barcode)) : undefined;
    if (code) {
      out.push({ recall, ownerKind: 'scanned_product', ownerId, ownerName: product.name, strength: 'code', matchedOn: code });
      continue;
    }
    // The same brand alone would match every recall a large firm has; the
    // brand and at least half the words of the product's name have to be there.
    if (!brand || nameWords.length === 0 || !hasPhrase(recall.product, brand)) continue;
    const present = nameWords.filter((w) => hasPhrase(recall.product, w)).length;
    if (present * 2 >= nameWords.length) {
      out.push({ recall, ownerKind: 'scanned_product', ownerId, ownerName: product.name, strength: 'name', matchedOn: brand });
    }
  }
  return out;
}

export function matchKey(match: Pick<RecallMatch, 'ownerKind' | 'ownerId'> & { recall: Pick<Recall, 'recallNumber'> }): string {
  return `${match.recall.recallNumber}|${match.ownerKind}|${match.ownerId}`;
}

/** Ongoing recalls first, then the newest; a match on the code ahead of one on the name. */
export function sortMatches(matches: RecallMatch[]): RecallMatch[] {
  const open = (m: RecallMatch) => (/ongoing|pending/i.test(m.recall.status) ? 0 : 1);
  return [...matches].sort(
    (a, b) =>
      open(a) - open(b) ||
      (a.strength === b.strength ? 0 : a.strength === 'code' ? -1 : 1) ||
      b.recall.reportDate.localeCompare(a.recall.reportDate),
  );
}

// --- Sentences -----------------------------------------------------------

function readableDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function recallTitle(match: RecallMatch): string {
  return match.strength === 'code' ? `A recall names your ${match.ownerName}` : `A recall may be about your ${match.ownerName}`;
}

export function howMatchedSentence(match: RecallMatch): string {
  if (match.strength === 'code') {
    return match.ownerKind === 'treatment'
      ? `The recall lists the product code ${match.matchedOn}, the same as the label you kept for it.`
      : `The recall lists the barcode ${match.matchedOn}, the same as the one you scanned.`;
  }
  return match.ownerKind === 'treatment'
    ? `The recall names ${match.matchedOn}. It may be a different maker or strength from yours, so check the firm and the lots below against your package.`
    : `The recall names the brand ${match.matchedOn} and a product like this one. Check the barcode and the lots below against yours.`;
}

const CLASS_MEANING: Record<string, string> = {
  'class i': 'Class I, the FDA’s most serious class, used where using the product could cause serious harm.',
  'class ii': 'Class II, which the FDA uses where using the product could cause temporary or reversible harm.',
  'class iii': 'Class III, which the FDA uses where using the product breaks a rule but is unlikely to cause harm.',
};

export function classSentence(classification: string): string {
  return CLASS_MEANING[classification.trim().toLowerCase()] ?? (classification ? `${classification}.` : 'The FDA gave no class.');
}

export function statusSentence(recall: Recall): string {
  const status = recall.status.toLowerCase();
  const when = `reported ${readableDay(recall.reportDate)}`;
  if (status === 'ongoing') return `Still open (${when}).`;
  if (status === 'pending') return `Not yet classified by the FDA (${when}).`;
  if (status === 'completed') return `The firm has finished it, so stock should be off the shelves (${when}).`;
  if (status === 'terminated') return `The FDA has closed it (${when}).`;
  return recall.status ? `${recall.status} (${when}).` : `${when.charAt(0).toUpperCase()}${when.slice(1)}.`;
}

/** What a person can do with a match, by kind; a prescribed medicine is never to be stopped on this alone. */
export function whatToDoSentence(match: RecallMatch, treatmentType?: string): string {
  if (match.ownerKind === 'scanned_product') {
    return 'If yours is one of the lots listed, the store you bought it from, or the firm, can tell you what to do with it.';
  }
  if (treatmentType === 'prescription') {
    return 'If yours is one of the lots listed, talk to your pharmacist or prescriber about what to do. Do not stop a prescribed medicine on your own.';
  }
  return 'If yours is one of the lots listed, your pharmacist can tell you what to do with it.';
}

export function recallNumberSentence(recall: Recall): string {
  return `FDA recall ${recall.recallNumber}${recall.firm ? `, by ${recall.firm}` : ''}. Search for this number in the FDA’s Enforcement Reports to read the notice.`;
}

export function retrievalSentence(readOn: string | null): string {
  const when = readOn ? ` on ${readableDay(readOn)}` : '';
  return `Read from openFDA, the FDA’s public data service${when}: every drug and food recall the FDA reported in the past year. Every phone asks for the same list and it is matched here, so nothing about your medicines or foods was sent.`;
}

export const RECALL_SCOPE_NOTE =
  'These are United States FDA recalls, so a product sold only in another country will not be on this list. openFDA says its records are not validated, and a recall can be reported weeks after it starts, so this is one more check beside your pharmacy and the store.';

export const RECALL_OFF_NOTE =
  'Turn this on to check the medicines you are tracking and the foods you have scanned against the FDA’s recall list once a day. Only a date range is sent; the matching is done on this device.';

export function setAsideSentence(count: number): string | null {
  if (count <= 0) return null;
  return count === 1 ? 'One recall you checked and set aside is not shown.' : `${count} recalls you checked and set aside are not shown.`;
}

export function notificationTitle(matches: RecallMatch[]): string {
  if (matches.length === 1) return recallTitle(matches[0]);
  return `${matches.length} new recalls name things you have`;
}

export function notificationBody(matches: RecallMatch[]): string {
  const names = [...new Set(matches.map((m) => m.ownerName))];
  const shown = names.slice(0, 3).join(', ');
  const more = names.length > 3 ? ` and ${names.length - 3} more` : '';
  return `${shown}${more}. Tap to see the lots and what to check.`;
}
