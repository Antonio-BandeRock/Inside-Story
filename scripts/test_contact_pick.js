// Checks lib/contactPick.ts and lib/phoneReach.ts (O1 and O2, rebuild R1):
// which number a picked contact fills in, that the address book is only
// ever read (never written, never listed), that the desktop build swaps
// expo-contacts for a stand-in, and that Emergency and My Meds offer Pick
// from contacts, Call, Text and Copy where they should.
// Run: node scripts/test_contact_pick.js
const fs = require('fs');
/* global __dirname */
const path = require('path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const src = read('lib/contactPick.ts');
const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const mod = { exports: {} };
const stubs = {
  'react-native': { Platform: { OS: 'android' } },
  'expo-contacts': {},
  './desktop/bridge': { isDesktopApp: () => false },
};
new Function('module', 'exports', 'require', out.outputText)(mod, mod.exports, (name) => {
  if (name in stubs) return stubs[name];
  throw new Error(`lib/contactPick.ts imported ${name}`);
});
const { choosePhone, CAN_PICK_CONTACTS } = mod.exports;

let failures = 0;
function ok(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log(`FAIL ${label}${detail !== undefined ? `: ${JSON.stringify(detail)}` : ''}`);
  }
}

// --- which number --------------------------------------------------------------
ok('no numbers', choosePhone(undefined) === '');
ok('only blank numbers', choosePhone([{ number: '  ' }]) === '');
ok('primary wins', choosePhone([{ number: '111', label: 'mobile' }, { number: '222', label: 'home', isPrimary: true }]) === '222');
ok('mobile next', choosePhone([{ number: '111', label: 'home' }, { number: '333', label: 'Mobile' }]) === '333');
ok('Spanish mobile', choosePhone([{ number: '111', label: 'casa' }, { number: '444', label: 'Móvil' }]) === '444');
ok('first otherwise', choosePhone([{ number: ' 555 ', label: 'work' }, { number: '666', label: 'home' }]) === '555');
ok('phone can pick', CAN_PICK_CONTACTS === true);

// --- read only -----------------------------------------------------------------
for (const forbidden of ['addContactAsync', 'updateContactAsync', 'removeContactAsync', 'getContactsAsync', 'getPagedContactsAsync', 'writeContactToFileAsync']) {
  ok(`contactPick never calls ${forbidden}`, !src.includes(forbidden));
}
const appJson = JSON.parse(read('app.json'));
const blocked = appJson.expo.android.blockedPermissions ?? [];
ok('writing contacts is blocked', blocked.some((p) => p.includes('WRITE_CONTACTS')), blocked);

// --- wiring --------------------------------------------------------------------
const metro = read('metro.config.js');
ok('desktop swaps expo-contacts', metro.includes("'expo-contacts': 'lib/desktop/unavailableModule.ts'"));
const emergency = read('components/EmergencySection.tsx');
ok('Emergency picks from contacts', emergency.includes('fillContactFromPhone') && emergency.includes('CAN_PICK_CONTACTS'));
ok('Emergency calls and texts a contact', emergency.includes('callContact(contact.phone)') && emergency.includes('textContact(contact.phone)'));
ok('Emergency copies a Medical ID line', emergency.includes('copyMedicalIdLine(entry.field, entry.value)'));
ok('Medical ID no longer says press and hold', !emergency.includes('Press and hold a line'));
const meds = read('components/MedDetailsPanel.tsx');
ok('My Meds picks pharmacy and prescriber', meds.includes("pickButton('pharmacy'") && meds.includes("pickButton('prescriber'"));
ok('My Meds texts', meds.includes('textNumber('));
const reach = read('lib/phoneReach.ts');
ok('a text is opened, never sent by the app', reach.includes('sendSMSAsync') && !/sendSMSAsync[^\n]*\bauto/i.test(reach));

// --- words ---------------------------------------------------------------------
for (const [file, text] of [['lib/contactPick.ts', src], ['lib/phoneReach.ts', reach]]) {
  ok(`${file} has no dash`, !/[–—]/.test(text));
  ok(`${file} has no filler`, !/\b(real|genuine|genuinely)\b/i.test(text));
}

if (failures) {
  console.log(`${failures} failure(s).`);
  process.exit(1);
}
console.log('All contact pick checks passed.');
