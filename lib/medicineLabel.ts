// A11 (1.0.53.36), reshaped by direct instruction 2026-09-26: the app shows
// the manufacturer's own label for the exact medicine in the person's hand,
// word for word, and writes no interaction rules about prescriptions of its
// own. "Reshape A11 that way and drop the rule library. Make sure the app
// makes it clear about the data being retrieved, and that it never defaults
// to something else if it can't find the searched item."
//
// So three things hold everywhere in this file:
//
//   1. A code is matched exactly. A scanned or typed NDC is turned into the
//      handful of spellings the same ten digits can take, and a label is
//      kept only when openFDA lists one of those spellings on it. Nothing
//      found means "not found", said as such, with nothing in its place.
//   2. A name search never picks for the person. Every label carrying the
//      name is listed with its maker and date, combination products marked,
//      and the person taps the one on their package.
//   3. Every screen that shows a label says where it came from, what was
//      sent to get it, when, and which version of the document it is.
//
// Pure, with no React and no network, so scripts/test_medicine_label.js
// checks every reading, query and sentence. lib/medicineLabelLookup.ts does
// the fetching and lib/medicineLabelDb.ts keeps a copy with a med.

export const OPENFDA_LABEL_URL = 'https://api.fda.gov/drug/label.json';
export const NAME_SEARCH_LIMIT = 100;

// ---------------------------------------------------------------------------
// Reading a code

export type CodeReading =
  // One or more exact spellings to look for, all naming the same product
  // or package. `shown` is the code as the person will see it echoed back.
  | { kind: 'ndc'; field: 'package_ndc' | 'product_ndc'; codes: string[]; shown: string }
  // A retail barcode from outside the United States.
  | { kind: 'not_us'; shown: string; issuedIn: string | null }
  // Anything else: a pharmacy's own barcode, a store product, a typo.
  | { kind: 'unreadable'; shown: string };

// The three ways ten NDC digits are split: labeler-product-package.
function tenDigitSpellings(d: string): string[] {
  return [
    `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`,
    `${d.slice(0, 5)}-${d.slice(5, 8)}-${d.slice(8)}`,
    `${d.slice(0, 5)}-${d.slice(5, 9)}-${d.slice(9)}`,
  ];
}

// The eleven-digit billing form pads one segment with a leading zero to
// make 5-4-2. Each segment that starts with a zero could be the padded one.
function elevenDigitSpellings(labeler: string, product: string, pkg: string): string[] {
  const out: string[] = [];
  if (labeler.startsWith('0')) out.push(`${labeler.slice(1)}-${product}-${pkg}`);
  if (product.startsWith('0')) out.push(`${labeler}-${product.slice(1)}-${pkg}`);
  if (pkg.startsWith('0')) out.push(`${labeler}-${product}-${pkg.slice(1)}`);
  return out;
}

const VALID_PACKAGE_SHAPES = new Set(['4-4-2', '5-3-2', '5-4-1']);
const VALID_PRODUCT_SHAPES = new Set(['4-4', '5-3', '5-4']);

// Where a retail code was issued, by its GS1 prefix, for the few a person
// using this app is likely to be holding. The prefix says where the code
// was issued, not where the medicine was made, and the sentence says that.
const GS1_PREFIXES: [number, number, string][] = [
  [750, 750, 'Mexico'],
  [754, 755, 'Canada'],
  [300, 379, 'France'],
  [400, 440, 'Germany'],
  [450, 459, 'Japan'],
  [490, 499, 'Japan'],
  [500, 509, 'the United Kingdom'],
  [840, 849, 'Spain'],
  [930, 939, 'Australia'],
];

function issuedIn(prefix3: string): string | null {
  const n = Number(prefix3);
  for (const [lo, hi, where] of GS1_PREFIXES) if (n >= lo && n <= hi) return where;
  return null;
}

function fromTenDigits(d: string, shown: string): CodeReading {
  return { kind: 'ndc', field: 'package_ndc', codes: tenDigitSpellings(d), shown };
}

/**
 * A code read by the camera. A U.S. medicine package carries its NDC in a
 * UPC-A barcode (number system 3) or, on prescription packages since 2023,
 * inside the GTIN of a GS1 DataMatrix. Android often reports a UPC-A as a
 * thirteen-digit EAN with a leading zero.
 */
export function readScannedCode(raw: string): CodeReading {
  const text = (raw ?? '').trim();
  // GS1 DataMatrix: an optional symbology id, an optional FNC1, then
  // application identifier 01 and a fourteen-digit GTIN. The printed form
  // puts the identifier in brackets.
  const gs1 = text.match(/^(?:\]d2)?\x1d?01(\d{14})/) ?? text.match(/\(01\)(\d{14})/);
  if (gs1) {
    const gtin = gs1[1];
    if (gtin.slice(1, 3) === '03') return fromTenDigits(gtin.slice(3, 13), gtin.slice(3, 13));
    return { kind: 'not_us', shown: gtin, issuedIn: issuedIn(gtin.slice(1, 4)) };
  }
  const digits = text.replace(/\D/g, '');
  if (digits.length !== text.length) return { kind: 'unreadable', shown: text };
  if (digits.length === 13 && digits.startsWith('0')) return readScannedCode(digits.slice(1));
  if (digits.length === 12) {
    if (digits.startsWith('3')) return fromTenDigits(digits.slice(1, 11), digits.slice(1, 11));
    return { kind: 'unreadable', shown: digits };
  }
  if (digits.length === 13) return { kind: 'not_us', shown: digits, issuedIn: issuedIn(digits.slice(0, 3)) };
  return { kind: 'unreadable', shown: text };
}

/**
 * A code the person typed from a box or a pharmacy label, with or without
 * its hyphens, in the ten-digit form, the eleven-digit billing form, or the
 * two-part product code.
 */
export function readTypedCode(raw: string): CodeReading {
  const text = (raw ?? '').trim().replace(/\s+/g, '');
  if (!text) return { kind: 'unreadable', shown: '' };
  if (/^\d+(-\d+)+$/.test(text)) {
    const parts = text.split('-');
    const shape = parts.map((p) => p.length).join('-');
    if (VALID_PACKAGE_SHAPES.has(shape)) return { kind: 'ndc', field: 'package_ndc', codes: [text], shown: text };
    if (shape === '5-4-2') {
      const codes = elevenDigitSpellings(parts[0], parts[1], parts[2]);
      return codes.length ? { kind: 'ndc', field: 'package_ndc', codes, shown: text } : { kind: 'unreadable', shown: text };
    }
    if (VALID_PRODUCT_SHAPES.has(shape)) return { kind: 'ndc', field: 'product_ndc', codes: [text], shown: text };
    return { kind: 'unreadable', shown: text };
  }
  if (!/^\d+$/.test(text)) return { kind: 'unreadable', shown: text };
  if (text.length === 10) return fromTenDigits(text, text);
  if (text.length === 11) {
    const codes = elevenDigitSpellings(text.slice(0, 5), text.slice(5, 9), text.slice(9));
    return codes.length ? { kind: 'ndc', field: 'package_ndc', codes, shown: text } : { kind: 'unreadable', shown: text };
  }
  if (text.length === 12 || text.length === 13) return readScannedCode(text);
  if (text.length === 8) {
    return { kind: 'ndc', field: 'product_ndc', codes: [`${text.slice(0, 4)}-${text.slice(4)}`, `${text.slice(0, 5)}-${text.slice(5)}`], shown: text };
  }
  if (text.length === 9) return { kind: 'ndc', field: 'product_ndc', codes: [`${text.slice(0, 5)}-${text.slice(5)}`], shown: text };
  return { kind: 'unreadable', shown: text };
}

// ---------------------------------------------------------------------------
// What gets sent

// Letters, digits, spaces and the punctuation drug names use. Anything else
// is dropped rather than passed into the search.
export function cleanMedicineName(raw: string): string {
  return (raw ?? '')
    .replace(/[^A-Za-z0-9 .,/+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function quoted(field: string, value: string): string {
  return `${field}:${encodeURIComponent(`"${value}"`)}`;
}

export function codeQueryUrl(reading: Extract<CodeReading, { kind: 'ndc' }>): string {
  const terms = reading.codes.map((c) => quoted(`openfda.${reading.field}`, c)).join('+');
  return `${OPENFDA_LABEL_URL}?search=${terms}&limit=10`;
}

export function nameQueryUrl(name: string): string {
  const clean = cleanMedicineName(name);
  const terms = [quoted('openfda.generic_name', clean), quoted('openfda.brand_name', clean)].join('+');
  return `${OPENFDA_LABEL_URL}?search=${terms}&limit=${NAME_SEARCH_LIMIT}`;
}

export function setIdQueryUrl(setId: string): string {
  return `${OPENFDA_LABEL_URL}?search=${quoted('set_id', setId)}&limit=1`;
}

export function dailyMedUrl(setId: string): string {
  return `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${encodeURIComponent(setId)}`;
}

// ---------------------------------------------------------------------------
// The label itself

export type LabelSection = { key: string; heading: string; text: string };

export type LabelDocument = {
  setId: string;
  version: string;
  effective: string | null; // YYYY-MM-DD
  brand: string | null;
  generic: string | null;
  maker: string | null;
  productType: string | null; // 'Prescription' | 'Over the counter' | as filed
  isCombination: boolean;
  packageNdcs: string[];
  productNdcs: string[];
  sections: LabelSection[];
};

// The sections a person needs to see about safety and interactions, in the
// order a label prints them, with the heading each carries on the label.
// Prescription labels in the current format, older prescription labels and
// over-the-counter Drug Facts use different sections, so all three sets are
// here and a label shows whichever it has.
export const LABEL_SECTIONS: readonly [string, string][] = [
  ['boxed_warning', 'Boxed warning'],
  ['active_ingredient', 'Active ingredient'],
  ['purpose', 'Purpose'],
  ['contraindications', 'Contraindications'],
  ['warnings_and_cautions', 'Warnings and precautions'],
  ['warnings', 'Warnings'],
  ['do_not_use', 'Do not use'],
  ['ask_doctor', 'Ask a doctor before use if you have'],
  ['ask_doctor_or_pharmacist', 'Ask a doctor or pharmacist before use if you are'],
  ['when_using', 'When using this product'],
  ['stop_use', 'Stop use and ask a doctor if'],
  ['pregnancy_or_breast_feeding', 'If pregnant or breast-feeding'],
  ['precautions', 'Precautions'],
  ['drug_interactions', 'Drug interactions'],
  ['dosage_and_administration', 'Dosage and administration'],
  ['directions', 'Directions'],
  ['information_for_patients', 'Information for patients'],
  ['spl_medguide', 'Medication guide'],
  ['spl_patient_package_insert', 'Patient information'],
];

function first(list: unknown): string | null {
  return Array.isArray(list) && typeof list[0] === 'string' && list[0].trim() ? list[0].trim() : null;
}

function strings(list: unknown): string[] {
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
}

function titleCase(s: string | null): string | null {
  if (!s) return null;
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function isoDate(yyyymmdd: unknown): string | null {
  if (typeof yyyymmdd !== 'string' || !/^\d{8}$/.test(yyyymmdd)) return null;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6)}`;
}

function productTypeLabel(raw: string | null): string | null {
  if (!raw) return null;
  if (raw === 'HUMAN PRESCRIPTION DRUG') return 'Prescription';
  if (raw === 'HUMAN OTC DRUG') return 'Over the counter';
  return titleCase(raw);
}

/** One openFDA result as a document, or null when it cannot be named. */
export function toLabelDocument(result: unknown): LabelDocument | null {
  if (!result || typeof result !== 'object') return null;
  const r = result as Record<string, unknown>;
  const setId = typeof r.set_id === 'string' ? r.set_id : null;
  if (!setId) return null;
  const fda = (r.openfda && typeof r.openfda === 'object' ? r.openfda : {}) as Record<string, unknown>;
  const generic = titleCase(first(fda.generic_name));
  const brand = titleCase(first(fda.brand_name));
  // A label that openFDA could not tie to a product carries no names, and
  // nothing on screen could tell the person which medicine it is.
  if (!generic && !brand) return null;
  const sections: LabelSection[] = [];
  for (const [key, heading] of LABEL_SECTIONS) {
    const text = strings(r[key]).join('\n\n').trim();
    if (text) sections.push({ key, heading, text });
  }
  return {
    setId,
    version: typeof r.version === 'string' ? r.version : String(r.version ?? ''),
    effective: isoDate(r.effective_time),
    brand,
    generic,
    maker: titleCase(first(fda.manufacturer_name)),
    productType: productTypeLabel(first(fda.product_type)),
    isCombination: !!generic && /\sand\s|,/i.test(generic),
    packageNdcs: strings(fda.package_ndc),
    productNdcs: strings(fda.product_ndc),
    sections,
  };
}

// ---------------------------------------------------------------------------
// Deciding what came back

export type LookupAsk =
  | { kind: 'code'; reading: Extract<CodeReading, { kind: 'ndc' }> }
  | { kind: 'name'; name: string }
  | { kind: 'setId'; setId: string };

export type LookupResult =
  | { kind: 'found'; labels: LabelDocument[]; total: number }
  | { kind: 'not_found' };

/**
 * Keeps only the labels that match what was asked for exactly. A code
 * keeps a label only when that label lists one of the code's spellings; a
 * name keeps a label only when its generic or brand name holds the name as
 * whole words; a document number keeps only that document. Newest first,
 * and nothing is ever chosen here.
 */
export function matchLabels(ask: LookupAsk, results: unknown[], total: number): LookupResult {
  const docs = results.map(toLabelDocument).filter((d): d is LabelDocument => d !== null);
  let kept: LabelDocument[];
  if (ask.kind === 'code') {
    const wanted = new Set(ask.reading.codes);
    kept = docs.filter((d) => (ask.reading.field === 'package_ndc' ? d.packageNdcs : d.productNdcs).some((c) => wanted.has(c)));
  } else if (ask.kind === 'name') {
    const words = cleanMedicineName(ask.name).toLowerCase();
    const pattern = new RegExp(`(^|[^a-z0-9])${words.replace(/[.+/]/g, (c) => `\\${c}`)}($|[^a-z0-9])`);
    kept = docs.filter((d) => [d.generic, d.brand].some((n) => !!n && pattern.test(n.toLowerCase())));
  } else {
    kept = docs.filter((d) => d.setId === ask.setId);
  }
  const seen = new Set<string>();
  kept = kept.filter((d) => (seen.has(d.setId) ? false : (seen.add(d.setId), true)));
  kept.sort((a, b) => (b.effective ?? '').localeCompare(a.effective ?? ''));
  if (kept.length === 0) return { kind: 'not_found' };
  return { kind: 'found', labels: kept, total: ask.kind === 'name' ? Math.max(total, kept.length) : kept.length };
}

// ---------------------------------------------------------------------------
// Sentences

function readableDate(iso: string | null): string {
  if (!iso) return 'an unknown date';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  if (!y || !m || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
}

export function whatWasSent(ask: LookupAsk): string {
  if (ask.kind === 'code') return `the code ${ask.reading.shown}`;
  if (ask.kind === 'name') return `the name "${cleanMedicineName(ask.name)}"`;
  return "the label's document number";
}

/** Where the text came from, what was sent for it, and when. */
export function retrievalStatement(sent: string, retrievedAtIso: string): string {
  return `Retrieved from openFDA, the U.S. Food and Drug Administration's public data service, on ${readableDate(retrievedAtIso)}. What was sent to get it: ${sent}. Nothing about you or your other medicines was sent.`;
}

/** Which document this is. */
export function labelIdentity(doc: LabelDocument): string {
  const who = doc.maker ? ` Filed by ${doc.maker}${doc.maker.endsWith('.') ? '' : '.'}` : '';
  return `Label version ${doc.version || 'not given'}, effective ${readableDate(doc.effective)}.${who} Document ${doc.setId}.`;
}

/** What the text is, and what the app does not do with it. */
export const LABEL_SOURCE_NOTE =
  "This is the manufacturer's label as filed with the FDA, shown word for word. Lifestead does not check it against your other medicines or your meals. A pharmacist can check all of your medicines together.";

export const LABEL_FDA_CAVEAT =
  'openFDA says this text has not been altered or verified by the FDA, and it may not match the labeling on the package you have. Tables on the label appear here as plain text; DailyMed shows the full layout.';

export const SAVED_COPY_NOTE = 'This is the copy you kept. It does not change by itself; Check for a Newer Version asks openFDA again.';

export function labelName(doc: LabelDocument): string {
  if (doc.brand && doc.generic && doc.brand.toLowerCase() !== doc.generic.toLowerCase()) return `${doc.brand} (${doc.generic})`;
  return doc.brand ?? doc.generic ?? 'Unnamed label';
}

/** The one-line caption under a label in a list to pick from. */
export function labelCaption(doc: LabelDocument): string {
  const parts = [
    doc.maker ?? 'Maker not given',
    doc.productType,
    doc.effective ? `effective ${readableDate(doc.effective)}` : null,
    doc.isCombination ? `Combination product: ${doc.generic}` : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

export function pickPrompt(ask: LookupAsk, shown: number, total: number): string {
  if (ask.kind === 'code') {
    if (shown === 1) return 'One label lists this code. Tap it to read it, and check that the maker matches your package.';
    return 'More than one label lists this code. Pick the one that matches your package; the maker is printed on the box or the pharmacy label.';
  }
  const more =
    total > shown
      ? ` Showing ${shown} of the ${total} openFDA holds. Scanning the barcode or typing the code from the box finds the exact one.`
      : '';
  const count = shown === 1 ? 'One label carries' : `${shown} labels carry`;
  return `${count} this name. Nothing opens until you pick; choose the one whose maker matches your package.${more}`;
}

export function notFoundMessage(ask: LookupAsk): string {
  if (ask.kind === 'code') {
    return `openFDA has no label for the code ${ask.reading.shown}. Nothing else is shown in its place. Check the code against the box or the pharmacy label, or search by the medicine's name.`;
  }
  if (ask.kind === 'name') {
    return `openFDA has no label with the name "${cleanMedicineName(ask.name)}". Nothing else is shown in its place. Check the spelling, or try the brand name or the generic name.`;
  }
  return 'openFDA no longer lists this label. Your kept copy stays as it is.';
}

export function notADrugCodeMessage(reading: Exclude<CodeReading, { kind: 'ndc' }>): string {
  if (reading.kind === 'not_us') {
    const where = reading.issuedIn ? `a retail code issued in ${reading.issuedIn}` : 'a retail code issued outside the United States';
    return `This is ${where}, not a U.S. drug code. openFDA holds only U.S. labels, so there is nothing to look up for it, and nothing else is shown in its place. Searching by the medicine's name may find the U.S. label for the same medicine.`;
  }
  return "This is not a U.S. drug code (NDC). A pharmacy's barcode usually holds its prescription number instead. The NDC is often printed on the pharmacy label or the manufacturer's box as 10 or 11 digits, and you can type it in. Nothing was looked up.";
}

export function unreachableMessage(status: number | null): string {
  return status === null
    ? 'Could not reach openFDA, so nothing was looked up. Check the connection and try again.'
    : `openFDA answered with an error (status ${status}), so nothing is shown. Try again in a minute.`;
}

export function versionCheckMessage(saved: LabelDocument, current: LabelDocument): string {
  if (saved.version === current.version) return `Your kept copy is still the current version (version ${saved.version}).`;
  return `openFDA has version ${current.version}, effective ${readableDate(current.effective)}. Your kept copy is version ${saved.version}. Nothing changes unless you replace it.`;
}
