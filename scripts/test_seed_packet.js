// Runs lib/seedPacket.ts: what a seed packet says about a planting (I17),
// and checks where it is wired.
//
// Built 2026-09-28.
//
// The rules checked:
//
//  1. Days to maturity are a whole number from 10 to 400, and blank is
//     allowed, since many packets give none.
//  2. The harvest day is counted from the day the planting went in, across
//     month and year ends.
//  3. The Add a Planting form files the packet photo under the planting's
//     id before it is saved, and Cancel, deleting the planting and the
//     Garden sweep each remove a packet photo nothing claims.
//  4. The packet's days replace the crop's usual window when given.
//
// Run with: node scripts/test_seed_packet.js
// Exits non-zero on any failure.

/* global __dirname */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

function run(relPath) {
  const { outputText } = ts.transpileModule(read(relPath), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, (name) => {
    throw new Error(`unexpected import ${name}`);
  });
  return module.exports;
}

let failures = 0;
let passes = 0;
function check(label, condition, detail) {
  if (condition) {
    passes += 1;
  } else {
    failures += 1;
    console.log(`FAIL ${label}${detail ? `\n     ${detail}` : ''}`);
  }
}

const S = run('lib/seedPacket.ts');

// 1. Reading the days
check('blank is empty', S.readPacketDays('  ').status === 'empty');
check('a figure', JSON.stringify(S.readPacketDays(' 65 ')) === '{"status":"days","days":65}');
check('lowest', S.readPacketDays('10').status === 'days' && S.readPacketDays('9').status === 'invalid');
check('highest', S.readPacketDays('400').status === 'days' && S.readPacketDays('401').status === 'invalid');
for (const bad of ['6.5', '-60', '60 days', 'abc', '1e2']) {
  check(`refuses ${bad}`, S.readPacketDays(bad).status === 'invalid');
}
check('range line', S.packetDaysRangeLine() === 'A whole number of days, 10 to 400.');

// 2. The harvest day
check('same month', S.packetHarvestDate('2026-04-01', 10) === '2026-04-11');
check('month end', S.packetHarvestDate('2026-04-25', 60) === '2026-06-24');
check('year end', S.packetHarvestDate('2026-11-15', 70) === '2027-01-24');
check('leap day', S.packetHarvestDate('2028-02-20', 10) === '2028-03-01');
check('harvest line', /^First harvest about 3 June, 60 days from the day it went in, as the packet gives it\./.test(S.packetHarvestLine(60, '3 June')));

// Summary
check('nothing', S.seedPacketSummary(null, null, 0) === 'No variety or packet recorded');
check('all three', S.seedPacketSummary(' Blue Lake ', 55, 2) === 'Blue Lake, 55 days on the packet, 2 photos');
check('one photo', S.seedPacketSummary('', null, 1) === '1 photo');
check('owner kind', S.SEED_PACKET_OWNER_KIND === 'seed_packet');

// 3. Wiring
const garden = read('app/(tabs)/garden.tsx');
const db = read('lib/db.ts');
const section = read('components/SeedPacketSection.tsx');
const sweep = read('lib/seedPacketDb.ts');
check('form photo under the pending id', /ownerKind=\{SEED_PACKET_OWNER_KIND\}\s+ownerId=\{pendingPlantingId\}/.test(garden));
check('saved under the same id', /createGardenPlanting\(\{\s+id: pendingPlantingId,/.test(garden));
check('cancel removes the photo', /removePhotosOf\(SEED_PACKET_OWNER_KIND, pendingPlantingId\)/.test(garden) && /onPress=\{handleCancelPlanting\}/.test(garden));
check('a fresh id after each form', /setPendingPlantingId\(newGardenPlantingId\(\)\)/.test(garden));
check('sweep runs once on opening', /useEffect\(\(\) => \{\s+removeUnclaimedPacketPhotos\(\)/.test(garden));
check('sweep keeps claimed photos', /if \(plantings\.has\(photo\.ownerId\)\) continue;/.test(sweep));
check('delete takes packet photos', /removePhotosOf\('seed_packet', id\)/.test(db));
check('column created', /packet_days INTEGER,/.test(db) && /ADD COLUMN packet_days INTEGER/.test(db));
check('column read', /packet_days AS packetDays/.test(db));
check('section on each planting', /<SeedPacketSection\s+plantingId=\{planting\.id\}/.test(garden));
check('section photo', /addLabel="Photo of the Packet"/.test(section) && /addLabel="Photo of the Packet"/.test(garden));

// 4. The packet replaces the window
check('packet dates stand in', /packetDays !== null\s+\? \{ expectedHarvestStart: packetHarvestDate\(sowOn, packetDays\)/.test(garden));
check('later sowings carry the packet', /varietyNote: variety,\s+packetDays,\s+plantedAt: sowOn,/.test(garden));
check('counter uses the packet', /days: packetDays \?\? expected\.harvestDays\[0\]/.test(garden));
check('usual window hidden when given', /readPacketDays\(pendingPacketDaysText\)\.status !== 'days'/.test(garden));
check('invalid days not saved', /if \(packet\.status === 'invalid'\) return;/.test(garden) && /reading\.status === 'invalid'\) \{\s+setError/.test(section));

// Wording
const text = [read('lib/seedPacket.ts'), section].join('\n').match(/'[^'\n]*'|`[^`]*`|"[^"\n]*"|>[^<>{}\n]+</g) || [];
for (const pattern of [/—|–| -- /, /\breal\b/i, /\bgenuine(ly)?\b/i, /\bshould\b/i, /\bideal\b/i, /\bbest\b/i]) {
  const hit = text.find((s) => pattern.test(s));
  check(`no ${pattern}`, !hit, hit);
}

console.log(`${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
