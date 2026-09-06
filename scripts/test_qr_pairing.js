// Runs lib/qrLayout.ts and the invite round trip that travels through it.
//
// Built 2026-09-06, after a deep link and then a .is file each failed to reach
// the other phone. Pairing is now a code on one screen read by the camera on
// the other, which is the one channel this app owns end to end.
//
// The risks, in order:
//
//  1. EVERY WAY THE GEOMETRY CAN BE WRONG LOOKS FINE. A missing quiet zone, a
//     dropped run, an off-by-one on a merged run: all of them render as a
//     plausible square that silently will not scan. There is no visual tell,
//     so arithmetic is the only check that exists.
//  2. THE ROUND TRIP HAS TO BE EXACT. What the encoder puts in the code has to
//     come back out of parseInviteInput and decodeConnectionInvite as the same
//     invite. A single dropped field here is a partner link that pairs and
//     then shares nothing.
//  3. THE WORST CASE HAS TO FIT. A long name plus every grant plus a full
//     condition list is the biggest invite this app can build. If that
//     outgrows a QR, pairing fails for exactly the people who need it most.
//  4. GARBAGE HAS TO BE REFUSED. A camera reads whatever is in front of it,
//     so a QR from anything else on earth reaches parseInviteInput.
//
// Run with: node scripts/test_qr_pairing.js
// Exits non-zero on any failure.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const LIB = path.join(__dirname, '..', 'lib');

// Same recursive stub loader scripts/test_partners.js established, with one
// difference: a real npm package (qrcode-generator) is passed through to the
// actual require rather than stubbed, since it is pure JS and runs fine here.
// Anything else non-relative still throws BY NAME, so a module reaching for
// something the harness cannot provide fails loudly rather than silently
// returning undefined somewhere further on.
const REAL_PACKAGES = new Set(['qrcode-generator', 'tweetnacl']);

function throwingStub(what) {
  return new Proxy(
    {},
    {
      get(_unused, prop) {
        if (prop === '__esModule') return true;
        if (prop === 'default') return throwingStub(what);
        throw new Error(`This harness stubs ${what}; it cannot provide ${String(prop)}.`);
      },
    },
  );
}

function loadModule(name, cache = new Map()) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(LIB, `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: `${name}.ts`,
  });
  const module = { exports: {} };
  cache.set(name, module.exports);
  const localRequire = (request) => {
    if (REAL_PACKAGES.has(request)) return require(request);
    if (!request.startsWith('./')) return throwingStub(request);
    const target = request.slice(2);
    if (target === 'db') return throwingStub('lib/db.ts');
    return loadModule(target, cache);
  };
  new Function('exports', 'module', 'require', outputText)(module.exports, module, localRequire);
  cache.set(name, module.exports);
  return module.exports;
}

const { buildQrDrawing, countPaintedModules, QUIET_ZONE_MODULES, ERROR_CORRECTION } = loadModule('qrLayout');
const { decodeConnectionInvite, parseInviteInput, encodeInviteCode } = loadModule('connections');
const { bytesToBase64, deriveEncryptionKeyPair } = loadModule('partnerCrypto');
const qrcodeGenerator = require('qrcode-generator');

let failures = 0;
let checks = 0;
function check(label, actual, expected) {
  checks += 1;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.error(`FAIL  ${label}`);
    console.error(`      expected ${JSON.stringify(expected)}`);
    console.error(`      got      ${JSON.stringify(actual)}`);
  }
}
function ok(label, condition) {
  check(label, Boolean(condition), true);
}

// --- The two invites that matter -------------------------------------------

// The biggest thing this app can build: a long name, every grant on, and a
// full condition list. If this does not fit, pairing fails for the people
// carrying the most conditions, which is exactly backwards.
const WORST_CASE = {
  v: 2,
  fromName: 'Christopher',
  publicKeyBase64: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
  role: 'partner',
  grants: { meals: true, shopping: true, conditions: true },
  alreadyHaveYou: true,
  conditionCodes: [
    'hashimotos',
    'rheumatoid_arthritis',
    'celiac',
    'type2_diabetes',
    'cardiovascular_disease',
    'chronic_kidney_disease',
  ],
};

// The default: conditions off, because what is for dinner is a household fact
// and a list of diagnoses is not.
const TYPICAL = {
  v: 2,
  fromName: 'Lisa',
  publicKeyBase64: 'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM=',
  role: 'partner',
  grants: { meals: true, shopping: true, conditions: false },
  alreadyHaveYou: false,
};

// --- 1. Geometry -----------------------------------------------------------

const worstCode = encodeInviteCode(WORST_CASE);
const drawing = buildQrDrawing(worstCode);

ok('the worst-case invite encodes at all', drawing !== null);

// The quiet zone is on BOTH sides, which is the off-by-one that would
// otherwise ship a code with a margin on one edge only.
check('extent leaves a quiet zone on both sides', drawing.extent, drawing.moduleCount + QUIET_ZONE_MODULES * 2);
ok('the quiet zone is the spec width', QUIET_ZONE_MODULES === 4);
ok('error correction leaves recovery margin for glare', ERROR_CORRECTION === 'M');

// Rebuild the same code independently and count its dark modules directly.
// This is the check that proves no run was dropped, doubled, or drawn short:
// the path has to paint exactly the modules the encoder marked dark, no more
// and no fewer.
function darkModuleCount(value) {
  const qr = qrcodeGenerator(0, ERROR_CORRECTION);
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  let dark = 0;
  for (let r = 0; r < n; r += 1) for (let c = 0; c < n; c += 1) if (qr.isDark(r, c)) dark += 1;
  return { dark, n };
}

const direct = darkModuleCount(worstCode);
check('module count matches the encoder', drawing.moduleCount, direct.n);
check('the path paints exactly the dark modules', countPaintedModules(drawing.path), direct.dark);
ok('and there are actually some to paint', direct.dark > 0);

// A merged run must never leave the code, which would clip the right edge.
const runs = [...drawing.path.matchAll(/M(\d+) (\d+)h(\d+)v1/g)].map((m) => ({
  x: Number(m[1]),
  y: Number(m[2]),
  w: Number(m[3]),
}));
ok('every run starts inside the code', runs.every((r) => r.x >= QUIET_ZONE_MODULES && r.y >= QUIET_ZONE_MODULES));
ok(
  'no run overruns the right edge',
  runs.every((r) => r.x + r.w <= drawing.moduleCount + QUIET_ZONE_MODULES),
);
ok(
  'no run overruns the bottom edge',
  runs.every((r) => r.y < drawing.moduleCount + QUIET_ZONE_MODULES),
);
ok('runs are merged rather than one rect per module', runs.length < direct.dark);

// The three finder patterns are 7x7 solid squares at three corners. Their top
// row is a full run of 7, and it is the single most recognisable thing in any
// QR: if the quiet-zone offset were wrong, these would not land where they do.
const q = QUIET_ZONE_MODULES;
const finderTopLeft = runs.some((r) => r.x === q && r.y === q && r.w === 7);
const finderTopRight = runs.some((r) => r.x === q + drawing.moduleCount - 7 && r.y === q && r.w === 7);
const finderBottomLeft = runs.some((r) => r.x === q && r.y === q + drawing.moduleCount - 7 && r.w === 7);
ok('the top-left finder pattern is placed correctly', finderTopLeft);
ok('the top-right finder pattern is placed correctly', finderTopRight);
ok('the bottom-left finder pattern is placed correctly', finderBottomLeft);

// A sparser invite should produce a smaller code on its own, which is the
// whole reason type number 0 is used rather than a fixed version.
const typicalDrawing = buildQrDrawing(encodeInviteCode(TYPICAL));
ok('the default invite makes a smaller code than the worst case', typicalDrawing.moduleCount < drawing.moduleCount);

// Anything past the largest QR version returns null rather than throwing, so
// the screen renders nothing instead of crashing mid-pairing.
check('an impossible payload returns null rather than throwing', buildQrDrawing('x'.repeat(10000)), null);
check('an empty value still produces a drawing', typeof buildQrDrawing('').extent, 'number');

// --- 2. The round trip -----------------------------------------------------

// What the encoder puts in the code has to come back out as the same invite.
// This is the whole feature in one check.
// Compared with keys sorted, because decodeConnectionInvite deliberately
// REBUILDS the invite field by field rather than passing the parsed object
// through. That is what stops an attacker-controlled extra field riding
// along, and it means key order legitimately differs from what went in.
function sortedKeys(value) {
  if (Array.isArray(value)) return value.map(sortedKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortedKeys(value[k])]),
    );
  }
  return value;
}

for (const [label, invite] of [
  ['worst case', WORST_CASE],
  ['default', TYPICAL],
]) {
  const code = encodeInviteCode(invite);
  const scanned = parseInviteInput(code);
  ok(`${label}: a scanned code is accepted`, scanned !== null);
  check(`${label}: the invite survives the round trip`, sortedKeys(decodeConnectionInvite(scanned)), sortedKeys(invite));
}

// A scanner hands back exactly the string in the code, so the bare code is the
// normal case. A deep link is the other thing a QR could carry, from an older
// copy of the app, and it still has to work.
const linkCode = encodeInviteCode(TYPICAL);
check(
  'a scanned deep link still resolves to the code',
  parseInviteInput(`hashimotosapp://connect?data=${linkCode}`),
  linkCode,
);

// --- 3. Garbage --------------------------------------------------------------

// A camera reads whatever is in front of it, so these all arrive here.
for (const [label, value] of [
  ['a WiFi QR', 'WIFI:S:HomeNetwork;T:WPA;P:hunter2;;'],
  ['a plain URL', 'https://example.com/some/page'],
  ['a phone number', 'tel:+15555550123'],
  ['a product barcode payload', '0123456789012'],
  ['empty', ''],
  ['whitespace', '   '],
  ['base64 of something that is not an invite', 'eyJoZWxsbyI6IndvcmxkIn0='],
  ['base64 of a bare string', 'Im5vcGUi'],
  ['a long base64-shaped decoy', 'A'.repeat(400)],
]) {
  check(`refused: ${label}`, parseInviteInput(value), null);
}

// The one that matters most: a code that decodes to valid JSON but is not an
// invite must be refused by DECODING, not by looking base64-shaped.
check(
  'refused: valid JSON that is not an invite',
  parseInviteInput('eyJ2IjoyLCJub3RBbkludml0ZSI6dHJ1ZX0='),
  null,
);

// --- 4. Size headroom --------------------------------------------------------

// Stated as a check rather than a comment so it fails if the invite shape ever
// grows past what a phone camera reads comfortably.
ok('the worst case stays within a readable code', drawing.moduleCount <= 105);
ok('and is a real QR version, not a degenerate one', drawing.moduleCount >= 21);

// --- 5. The encryption key the invite now carries ----------------------------
//
// Added at v3 (2026-09-06) so a partner can be sent something only they can
// read, which the agreed cloud inbox needs and a signature cannot give. The
// risks are that it is silently dropped, or that a wrong-sized one is believed.

const realBoxKey = bytesToBase64(deriveEncryptionKeyPair(new Uint8Array(32).fill(5)).publicKey);

{
  const v3 = { ...TYPICAL, v: 3, encryptionKeyBase64: realBoxKey };
  const back = decodeConnectionInvite(parseInviteInput(encodeInviteCode(v3)));
  check('a v3 invite carries its encryption key through the round trip', back.encryptionKeyBase64, realBoxKey);
  check('and still carries everything v2 did', [back.role, back.grants.meals, back.alreadyHaveYou],
    ['partner', true, false]);
}

// A wrong-sized key is treated as absent rather than believed. Pairing still
// succeeds and sealing is simply not offered, instead of failing later at the
// moment someone actually tries to share something.
for (const [label, bad] of [
  ['a short key', bytesToBase64(new Uint8Array(16))],
  ['a long key', bytesToBase64(new Uint8Array(64))],
  ['an empty key', ''],
  ['rubbish', '!!!not base64!!!'],
  ['a number', 42],
  ['an object', { key: realBoxKey }],
]) {
  const invite = { ...TYPICAL, v: 3, encryptionKeyBase64: bad };
  const back = decodeConnectionInvite(encodeInviteCode(invite));
  ok(`${label} is dropped rather than believed`, back !== null && back.encryptionKeyBase64 === undefined);
}

// An older invite has no key at all, and must still pair.
{
  const back = decodeConnectionInvite(encodeInviteCode(TYPICAL));
  ok('a v2 invite still decodes', back !== null);
  check('and simply has no encryption key', back.encryptionKeyBase64, undefined);
}

// EVERY VERSION THE TYPE DECLARES MUST DECODE.
//
// This exists because of a real bug caught seconds before shipping: the invite
// gained v3, and decodeConnectionInvite's version gate still listed only 1 and
// 2. The app could not read the codes it built itself, which is a total pairing
// failure, and nothing short of pointing two phones at each other would have
// shown it. Reading the declared union from the source means adding v4 to the
// type without adding it to the gate fails here instead of on a kitchen table.
{
  const source = fs.readFileSync(path.join(LIB, 'connections.ts'), 'utf8');
  const declared = source.match(/export type ConnectionInvite = \{\s*\n\s*v: ([^;]+);/);
  ok('the declared invite versions are readable from the source', declared !== null);
  const versions = declared[1].split('|').map((part) => Number(part.trim())).filter((n) => Number.isFinite(n));
  ok('and there is at least one', versions.length > 0);
  for (const v of versions) {
    const back = decodeConnectionInvite(encodeInviteCode({ ...TYPICAL, v }));
    ok(`a v${v} invite decodes, because the type says the app can produce one`, back !== null);
  }
  // And an undeclared version is still refused, so the gate is a real gate.
  check('an unknown future version is refused',
    decodeConnectionInvite(encodeInviteCode({ ...TYPICAL, v: Math.max(...versions) + 1 })), null);
  check('version zero is refused', decodeConnectionInvite(encodeInviteCode({ ...TYPICAL, v: 0 })), null);
}

// The key adds real length to the QR, so the worst case is re-measured with it
// rather than assumed to still fit.
{
  const withKey = encodeInviteCode({ ...WORST_CASE, v: 3, encryptionKeyBase64: realBoxKey });
  const d = buildQrDrawing(withKey);
  ok('the worst case still encodes once the key is added', d !== null);
  ok('and still stays within a readable code', d.moduleCount <= 105);
}

if (failures) {
  console.error(`\n${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`${checks}/${checks} checks passed`);
