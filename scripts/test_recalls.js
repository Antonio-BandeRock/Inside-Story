// Checks recalls matched to My Meds and scanned foods (A14): reading the
// openFDA shape, the codes found in a recall's text, matching by code and by
// name, the span each read asks for, the sentences, and the wiring that keeps
// the list on each device while set-aside decisions travel.
// Run: node scripts/test_recalls.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n  ${detail}` : ''}`);
  }
}

const out = ts.transpileModule(read('lib/recalls.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const mod = { exports: {} };
new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, () => ({}));
const R = mod.exports;

// The request carries a date range and nothing else.
const url = R.recallUrl('drug', '2025-10-02', '2026-10-02', 2000);
ok('url asks by report date only', url === 'https://api.fda.gov/drug/enforcement.json?search=report_date:%5B20251002+TO+20261002%5D&limit=1000&skip=2000', url);
ok('first page has no skip', !R.recallUrl('food', '2025-10-02', '2026-10-02').includes('skip'));

// Spans.
ok('nothing kept reads the year', JSON.stringify(R.spanToRead('2026-10-02', null)) === JSON.stringify({ start: '2025-10-02', end: '2026-10-02' }));
ok('later reads overlap two weeks', R.spanToRead('2026-10-02', '2026-09-30').start === '2026-09-16');
ok('overlap clamped to the year', R.spanToRead('2026-10-02', '2025-10-05').start === '2025-10-02');

// Codes in text.
ok('NDC with spaces after the label', JSON.stringify(R.ndcsIn('Rx only NDC:  84139-225-04, 90 tablets')) === '["84139-225"]');
ok('NDC shapes', JSON.stringify(R.ndcsIn('0378-1800-01 and 12345-678-90 and 1234-12-1')) === '["0378-1800","12345-678"]');
ok('product NDC', R.productNdc('0378-1800-01') === '0378-1800' && R.productNdc('abc') === null);
ok('UPC with spaces', R.barcodesIn('Net wt 12 oz. UPC 7 41643 05576 6. Lot 1234').includes('741643055766'));
ok('lot numbers alone are not barcodes', R.barcodesIn('Lot 123456789012 exp 2027').length === 0);
ok('leading zero ignored', R.sameBarcode('0041643055766', '41643055766'));
ok('missing check digit', R.sameBarcode('74164305576', '741643055766'));
ok('different barcodes', !R.sameBarcode('741643055766', '741643055767'));

// Parsing.
const sample = {
  meta: { results: { total: 2 } },
  results: [
    {
      recall_number: 'D-0001-2026',
      status: 'Ongoing',
      classification: 'Class II',
      product_description: 'Levothyroxine Sodium Tablets, USP, 50 mcg, NDC 0378-1800-01',
      reason_for_recall: 'Subpotent',
      recalling_firm: 'Firm A',
      report_date: '20260915',
      code_info: 'Lot 12345',
      openfda: { brand_name: ['Levothyroxine Sodium'], generic_name: ['LEVOTHYROXINE SODIUM'], product_ndc: ['0378-1800'] },
    },
    { recall_number: 'D-0002-2026', status: 'Completed', classification: 'Class III', product_description: 'Metformin ER 500 mg', report_date: '20260101', recalling_firm: 'Firm B' },
  ],
};
const { recalls, total } = R.parseRecalls(sample, 'drug');
ok('parse total', total === 2);
ok('parse rows', recalls.length === 2 && recalls[0].reportDate === '2026-09-15' && recalls[0].ndcs.includes('0378-1800'));
ok('parse junk', R.parseRecalls(null, 'drug').recalls.length === 0);

const food = R.parseRecalls(
  {
    meta: { results: { total: 2 } },
    results: [
      { recall_number: 'F-0001-2026', status: 'Ongoing', classification: 'Class I', product_description: 'Lowes Foods Chicken Salad 12 oz UPC 7 41643 05576 6', report_date: '20260920', recalling_firm: 'Lowes Foods' },
      { recall_number: 'F-0002-2026', status: 'Ongoing', classification: 'Class II', product_description: 'Magnesium Glycinate dietary supplement capsules', report_date: '20260921', recalling_firm: 'Firm C' },
    ],
  },
  'food',
).recalls;
const all = [...recalls, ...food];

// Medicines.
const byCode = R.matchMedicine({ id: 't1', name: 'Synthroid', treatmentType: 'prescription', labelNdcs: ['0378-1800-01'] }, all);
ok('label NDC matches by code', byCode.length === 1 && byCode[0].strength === 'code' && byCode[0].matchedOn === '0378-1800');
const byName = R.matchMedicine({ id: 't2', name: 'Levothyroxine 50 mcg', treatmentType: 'prescription' }, all);
ok('generic name matches by name', byName.length === 1 && byName[0].strength === 'name' && byName[0].matchedOn === 'levothyroxine', JSON.stringify(byName.map((m) => m.matchedOn)));
ok('a drug never matches a food recall', R.matchMedicine({ id: 't3', name: 'Magnesium Glycinate', treatmentType: 'otc' }, all).length === 0);
ok('a supplement matches only supplement recalls', R.matchMedicine({ id: 't4', name: 'Magnesium Glycinate', treatmentType: 'supplement' }, all).length === 1);
ok('too broad a name matches nothing', R.nameToMatch('Vitamin Complex') === null && R.nameToMatch('D3') === null);

// Products.
const scanned = R.matchProduct({ id: 7, name: 'Chicken Salad', brand: 'Lowes Foods', barcode: '0741643055766' }, all);
ok('barcode matches by code', scanned.length === 1 && scanned[0].strength === 'code');
const named = R.matchProduct({ id: 8, name: 'Chicken Salad', brand: 'Lowes Foods', barcode: '' }, all);
ok('brand and name match by name', named.length === 1 && named[0].strength === 'name');
ok('brand alone is not enough', R.matchProduct({ id: 9, name: 'Pimento Cheese', brand: 'Lowes Foods', barcode: '' }, all).length === 0);

// Order and sentences.
const metformin = R.matchMedicine({ id: 't5', name: 'Metformin', treatmentType: 'prescription' }, all);
const sorted = R.sortMatches([...metformin, ...byName, ...byCode]);
ok('ongoing code matches first, completed last', sorted[0].strength === 'code' && sorted[sorted.length - 1].recall.status === 'Completed');
ok('prescription never told to stop', /Do not stop a prescribed medicine on your own/.test(R.whatToDoSentence(byName[0], 'prescription')));
ok('class I explained', /most serious/.test(R.classSentence('Class I')));
ok('nothing about the person is sent', /nothing about your medicines or foods was sent/.test(R.retrievalSentence(null)));
ok('scope says US only', /United States/.test(R.RECALL_SCOPE_NOTE));
ok('notification names what matched', R.notificationBody([...byName, ...scanned]).startsWith('Levothyroxine 50 mcg, Chicken Salad'));

// Wiring.
const sync = read('lib/snapshotSync.ts');
const localTables = sync.slice(sync.indexOf('export const DEVICE_LOCAL_TABLES'));
const localTablesList = localTables.slice(0, localTables.indexOf('];'));
ok('recall list stays on the device', localTablesList.includes("'recalls',"));
ok('set-aside decisions travel', !localTablesList.includes("'recall_checks'"));
ok('read times stay on the device', sync.includes("'recalls_last_read'") && sync.includes("'recalls_notified'"));
ok('set-asides have a change phrase', read('lib/snapshotChanges.ts').includes("count: ['recall_checks']"));
const db = read('lib/db.ts');
ok('both tables created', db.includes('CREATE TABLE IF NOT EXISTS recalls (') && db.includes('CREATE TABLE IF NOT EXISTS recall_checks ('));
ok('watcher mounted', read('app/_layout.tsx').includes('<RecallWatcher />'));
ok('band on My Meds', read('components/MyMedsSection.tsx').includes('<RecallsBand'));
ok('notification tap routed', read('lib/reminderNotifications.ts').includes('RECALL_NOTIFICATION_PREFIX'));
ok('food lens handles the tap', read('app/(tabs)/food.tsx').includes("openFoodLens === 'myFoodProducts'"));
ok('nothing read while off', /if \(!\(await isRecallCheckOn\(\)\)\) return \{ state: 'off' \}/.test(read('lib/recallsDb.ts')));

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('recalls: all checks passed');
