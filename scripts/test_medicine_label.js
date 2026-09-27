// Checks the medicine label lookup (A11 of the competitive build plan,
// reshaped 2026-09-26): how a scanned or typed code is read, what is sent
// to openFDA, that only an exact match is ever kept and nothing is chosen
// for the person, and that every sentence says where the text came from
// and says plainly when nothing was found. Exits non-zero on any failure.

// eslint-config-expo lints this repo as app code, which has no __dirname.
/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(file) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
    throw new Error(`${file} must stay free of runtime imports (${name})`);
  });
  return mod.exports;
}

const M = load('lib/medicineLabel.ts');

let failures = 0;
let total = 0;
function check(name, actual, expected) {
  total += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.log(`FAIL  ${name}\n      expected ${e}\n      got      ${a}`);
  }
}

// ---- Reading typed codes.
check('hyphenated 4-4-2 kept as typed', M.readTypedCode('0074-4341-13'), { kind: 'ndc', field: 'package_ndc', codes: ['0074-4341-13'], shown: '0074-4341-13' });
check('ten digits become the three spellings', M.readTypedCode('0074434113').codes, ['0074-4341-13', '00744-341-13', '00744-3411-3']);
check('eleven-digit billing form drops the padded zero', M.readTypedCode('00074-4341-13').codes, ['0074-4341-13']);
check('eleven digits unhyphenated', M.readTypedCode('00074434113').codes, ['0074-4341-13']);
check('eleven digits with more than one padded segment', M.readTypedCode('00093-0058-01').codes, ['0093-0058-01', '00093-058-01', '00093-0058-1']);
check('product code 5-4', M.readTypedCode('0378-1800'), { kind: 'ndc', field: 'product_ndc', codes: ['0378-1800'], shown: '0378-1800' });
check('spaces ignored', M.readTypedCode(' 0074-4341-13 ').shown, '0074-4341-13');
check('letters are unreadable', M.readTypedCode('RX 123456').kind, 'unreadable');
check('a bad shape is unreadable', M.readTypedCode('123-45-6').kind, 'unreadable');
check('empty is unreadable', M.readTypedCode('').kind, 'unreadable');
check('a seven-digit pharmacy number is unreadable', M.readTypedCode('1234567').kind, 'unreadable');

// ---- Reading scanned codes.
check('UPC-A with number system 3 holds the NDC', M.readScannedCode('300744341130'), M.readTypedCode('0074434113'));
check('EAN-13 with a leading zero is the same UPC-A', M.readScannedCode('0300744341130').codes, ['0074-4341-13', '00744-341-13', '00744-3411-3']);
check('GS1 DataMatrix with FNC1', M.readScannedCode('\x1d0100300744341130172801311012345').codes, ['0074-4341-13', '00744-341-13', '00744-3411-3']);
check('GS1 DataMatrix with symbology id', M.readScannedCode(']d20100300744341130').kind, 'ndc');
check('GS1 printed with brackets', M.readScannedCode('(01)00300744341130(17)280131').kind, 'ndc');
check('Mexico retail code', M.readScannedCode('7501008491966'), { kind: 'not_us', shown: '7501008491966', issuedIn: 'Mexico' });
check('Canada retail code', M.readScannedCode('7543210000007').issuedIn, 'Canada');
check('a retail code from an unlisted country', M.readScannedCode('8901234567890'), { kind: 'not_us', shown: '8901234567890', issuedIn: null });
check('a GTIN that is not a U.S. drug', M.readScannedCode('\x1d0107501008491966').kind, 'not_us');
check('a store UPC is not a drug code', M.readScannedCode('012345678905').kind, 'unreadable');
check('a pharmacy barcode is unreadable', M.readScannedCode('RX-00451273').kind, 'unreadable');

// ---- What gets sent.
const code = M.readTypedCode('0074434113');
const codeUrl = M.codeQueryUrl(code);
check('code query names only the codes', codeUrl.startsWith('https://api.fda.gov/drug/label.json?search=openfda.package_ndc:'), true);
check('code query ORs every spelling', (codeUrl.match(/openfda\.package_ndc/g) || []).length, 3);
check('name query is cleaned', decodeURIComponent(M.nameQueryUrl('Synthroid; DROP')).includes('"Synthroid DROP"'), true);
check('name query asks both names', /generic_name.*brand_name/.test(M.nameQueryUrl('synthroid')), true);
check('name query limit', M.nameQueryUrl('x').endsWith(`limit=${M.NAME_SEARCH_LIMIT}`), true);
check('clean name keeps drug punctuation', M.cleanMedicineName('  amoxicillin/clavulanate  <b>'), 'amoxicillin/clavulanate b');
check('DailyMed link', M.dailyMedUrl('abc-1'), 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=abc-1');

// ---- Turning a result into a document.
function result(over) {
  return {
    set_id: 'set-a',
    version: '12',
    effective_time: '20250115',
    boxed_warning: ['NOT FOR OBESITY OR WEIGHT LOSS'],
    drug_interactions: ['7 DRUG INTERACTIONS Calcium carbonate may reduce absorption.'],
    indications_and_usage: ['Hypothyroidism'],
    openfda: {
      generic_name: ['LEVOTHYROXINE SODIUM'],
      brand_name: ['SYNTHROID'],
      manufacturer_name: ['AbbVie Inc.'],
      product_type: ['HUMAN PRESCRIPTION DRUG'],
      package_ndc: ['0074-4341-13', '0074-4341-90'],
      product_ndc: ['0074-4341'],
    },
    ...over,
  };
}
const doc = M.toLabelDocument(result({}));
check('names title-cased', [doc.brand, doc.generic, doc.maker], ['Synthroid', 'Levothyroxine Sodium', 'AbbVie Inc.']);
check('date', doc.effective, '2025-01-15');
check('product type in words', doc.productType, 'Prescription');
check('sections in label order, text word for word', doc.sections.map((s) => [s.key, s.text]), [
  ['boxed_warning', 'NOT FOR OBESITY OR WEIGHT LOSS'],
  ['drug_interactions', '7 DRUG INTERACTIONS Calcium carbonate may reduce absorption.'],
]);
check('not a combination', doc.isCombination, false);
check('combination marked', M.toLabelDocument(result({ openfda: { generic_name: ['LISINOPRIL AND HYDROCHLOROTHIAZIDE'] } })).isCombination, true);
check('a label with no names is dropped', M.toLabelDocument(result({ openfda: {} })), null);
check('a label with no document id is dropped', M.toLabelDocument(result({ set_id: undefined })), null);
check('OTC Drug Facts sections read', M.toLabelDocument(result({ boxed_warning: undefined, drug_interactions: undefined, do_not_use: ['Do not use if...'], openfda: { generic_name: ['OMEPRAZOLE'], product_type: ['HUMAN OTC DRUG'] } })).sections.map((s) => s.heading), ['Do not use']);

// ---- Exact matching; nothing is ever chosen.
const other = result({ set_id: 'set-b', effective_time: '20260101', openfda: { generic_name: ['LEVOTHYROXINE SODIUM'], manufacturer_name: ['Mylan'], package_ndc: ['0378-1800-01'], product_ndc: ['0378-1800'] } });
const byCode = M.matchLabels({ kind: 'code', reading: code }, [other, result({})], 2);
check('a code keeps only the label that lists it', byCode.kind === 'found' && byCode.labels.map((d) => d.setId), ['set-a']);
check('a code matching nothing is not found, with nothing in its place', M.matchLabels({ kind: 'code', reading: code }, [other], 1), { kind: 'not_found' });
check('an empty answer is not found', M.matchLabels({ kind: 'code', reading: code }, [], 0), { kind: 'not_found' });
const product = M.readTypedCode('0378-1800');
check('a product code matches the product field', M.matchLabels({ kind: 'code', reading: product }, [other, result({})], 2).labels.map((d) => d.setId), ['set-b']);
const byName = M.matchLabels({ kind: 'name', name: 'levothyroxine' }, [result({}), other], 308);
check('a name keeps every label carrying it, newest first', byName.labels.map((d) => d.setId), ['set-b', 'set-a']);
check('a name reports the full count', byName.total, 308);
check('a name must be whole words', M.matchLabels({ kind: 'name', name: 'thyrox' }, [result({})], 1), { kind: 'not_found' });
check('a brand name matches', M.matchLabels({ kind: 'name', name: 'Synthroid' }, [result({}), other], 2).labels.map((d) => d.setId), ['set-a']);
check('duplicates collapse', M.matchLabels({ kind: 'name', name: 'synthroid' }, [result({}), result({})], 2).labels.length, 1);
check('a document number keeps only that document', M.matchLabels({ kind: 'setId', setId: 'set-b' }, [result({}), other], 2).labels.map((d) => d.setId), ['set-b']);

// ---- Sentences.
const retrieval = M.retrievalStatement(M.whatWasSent({ kind: 'code', reading: code }), '2026-09-26T15:00:00Z');
check('retrieval names openFDA, the date and what was sent', retrieval, "Retrieved from openFDA, the U.S. Food and Drug Administration's public data service, on 26 September 2026. What was sent to get it: the code 0074434113. Nothing about you or your other medicines was sent.");
check('identity', M.labelIdentity(doc), 'Label version 12, effective 15 January 2025. Filed by AbbVie Inc. Document set-a.');
check('label name', M.labelName(doc), 'Synthroid (Levothyroxine Sodium)');
check('pick prompt for one code match', M.pickPrompt({ kind: 'code', reading: code }, 1, 1), 'One label lists this code. Tap it to read it, and check that the maker matches your package.');
check('pick prompt for a code', /Pick the one that matches your package/.test(M.pickPrompt({ kind: 'code', reading: code }, 2, 2)), true);
check('pick prompt for a name says nothing opens until picked', /Nothing opens until you pick/.test(M.pickPrompt({ kind: 'name', name: 'x' }, 1, 1)), true);
check('pick prompt counts what is not shown', /Showing 100 of the 308 openFDA holds/.test(M.pickPrompt({ kind: 'name', name: 'x' }, 100, 308)), true);

const notFound = [
  M.notFoundMessage({ kind: 'code', reading: code }),
  M.notFoundMessage({ kind: 'name', name: 'zzz' }),
  M.notADrugCodeMessage(M.readScannedCode('7501008491966')),
  M.notADrugCodeMessage(M.readScannedCode('RX-1')),
];
check('code not found says nothing else is shown', /Nothing else is shown in its place/.test(notFound[0]), true);
check('name not found says nothing else is shown', /Nothing else is shown in its place/.test(notFound[1]), true);
check('Mexico code says where and that nothing is shown', /issued in Mexico.*nothing else is shown/.test(notFound[2]), true);
check('pharmacy code says nothing was looked up', /Nothing was looked up/.test(notFound[3]), true);
check('unreachable says nothing was looked up', /nothing was looked up/.test(M.unreachableMessage(null)), true);
check('version the same', M.versionCheckMessage(doc, doc), 'Your kept copy is still the current version (version 12).');
check('version newer is offered, not applied', /Nothing changes unless you replace it/.test(M.versionCheckMessage(doc, { ...doc, version: '13' })), true);

const ALL = [
  retrieval,
  M.labelIdentity(doc),
  M.LABEL_SOURCE_NOTE,
  M.LABEL_FDA_CAVEAT,
  M.SAVED_COPY_NOTE,
  M.pickPrompt({ kind: 'name', name: 'x' }, 100, 308),
  M.pickPrompt({ kind: 'code', reading: code }, 2, 2),
  ...notFound,
  M.notFoundMessage({ kind: 'setId', setId: 'x' }),
  M.unreachableMessage(null),
  M.unreachableMessage(500),
  M.versionCheckMessage(doc, { ...doc, version: '13' }),
];
const FORBIDDEN = /\b(safe|no interactions?|stop taking|you should|nothing to worry|real|really|genuine|genuinely|best match|closest|similar)\b|—|–| -- /i;
for (const s of ALL) check(`no verdict or style words: ${s.slice(0, 40)}`, FORBIDDEN.test(s), false);
check('the source note names a pharmacist', /pharmacist can check all of your medicines/.test(M.LABEL_SOURCE_NOTE), true);
check('the source note says the app does not check', /does not check it against your other medicines/.test(M.LABEL_SOURCE_NOTE), true);

console.log(`${total - failures} of ${total} passed`);
if (failures > 0) process.exit(1);
