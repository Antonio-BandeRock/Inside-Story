// Checks lib/injectionSites.ts (A4, injection site rotation): which meds are
// recognised as shots and how each starts, the next spot in a rotation, the
// picker's labels, a spot of the person's own, and that no sentence tells
// anybody which spots or doses are right.
// Run: node scripts/test_injection_sites.js
/* global __dirname */
const path = require('path');
const ts = require('typescript');
const fs = require('fs');

const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'injectionSites.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const m = { exports: {} };
new Function('module', 'exports', 'require', js)(m, m.exports, require);
const I = m.exports;

let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) pass++;
  else {
    fail++;
    console.log('FAIL', name);
  }
}

// Matching, by condition
const id = (name, generic) => I.matchInjectable(name, generic)?.id ?? null;
check('Humira for RA, psoriasis and IBD', id('Humira pen 40 mg') === 'adalimumab');
check('common_medications id', id('My biologic', 'adalimumab') === 'adalimumab');
check('secukinumab by id', id('Cosentyx', 'secukinumab') === 'secukinumab');
check('insulin for type 1', id('Lantus SoloStar') === 'insulin' && id('Insulin (rapid-acting and long-acting forms)', 'insulin') === 'insulin');
check('Humalog', id('Humalog KwikPen') === 'insulin');
check('MS shots', id('Copaxone') === 'glatiramer_acetate' && id('Kesimpta') === 'ofatumumab' && id('Rebif') === 'interferon_beta');
check('glatiramer by reference id', id('Glatiramer Acetate', 'glatiramer_acetate') === 'glatiramer_acetate');
check('lupus', id('Benlysta') === 'belimumab');
check('migraine', id('Aimovig', 'erenumab') === 'erenumab' && id('Emgality') === 'galcanezumab');
check('B12 shots for pernicious anemia', id('B12 injection monthly') === 'vitamin_b12_injection' && id('Hydroxocobalamin') === 'vitamin_b12_injection');
check('methotrexate', id('Methotrexate', 'methotrexate') === 'methotrexate');
check('type 2 GLP-1', id('Ozempic') === 'semaglutide' && id('Mounjaro') === 'tirzepatide');
check('PCOS fertility', id('Gonal-f') === 'gonadotropins' && id('Menopur') === 'gonadotropins');
check('CKD', id('Aranesp') === 'epoetin');
check('tablets are not shots', id('Levothyroxine', 'levothyroxine') === null && id('Metformin', 'metformin') === null);
check('Rybelsus is a tablet', id('Rybelsus') === null);
check('whole words only', id('Prosinsulinx') === null);
check('empty name', I.matchInjectable('', null) === null);
check('accents', id('Hûmira') === 'adalimumab');

// Every reference med that is a shot is recognised
for (const ref of ['adalimumab', 'secukinumab', 'insulin', 'glatiramer_acetate', 'belimumab', 'erenumab', 'vedolizumab', 'natalizumab', 'infliximab', 'ocrelizumab', 'semaglutide', 'glucagon', 'methotrexate', 'sumatriptan']) {
  check(`reference ${ref}`, I.matchInjectable('x', ref) !== null);
}
// Every condition code named is one of the 19 or a plain name
const codes = ['hashimotos', 'rheumatoid_arthritis', 'psoriasis', 'graves', 'type_1_diabetes', 'celiac', 'ibd', 'multiple_sclerosis', 'lupus', 'sjogrens', 'pcos', 'chronic_kidney_disease', 'fatty_liver_disease', 'type_2_diabetes', 'ibs', 'migraine', 'cardiovascular_disease', 'gout', 'prostate_health'];
check('condition codes known', I.KNOWN_INJECTABLES.every((k) => k.conditions.every((c) => codes.includes(c) || !c.includes('_'))));
check('ids unique', new Set(I.KNOWN_INJECTABLES.map((k) => k.id)).size === I.KNOWN_INJECTABLES.length);

// Presets
const humira = I.matchInjectable('Humira');
const mtx = I.matchInjectable('Methotrexate');
const remicade = I.matchInjectable('Remicade');
check('home starts on', I.isInjected(null, humira) === true);
check('either starts off', I.isInjected(null, mtx) === false);
check('clinic starts off', I.isInjected(null, remicade) === false);
check('unknown starts off', I.isInjected(null, null) === false);
check('answer wins: off', I.isInjected(false, humira) === false);
check('answer wins: on', I.isInjected(true, null) === true && I.isInjected(true, remicade) === true);
check('home line names conditions', I.matchLine(humira, true).includes('rheumatoid arthritis') && I.matchLine(humira, true).includes("Crohn's"));
check('either line asks', I.matchLine(mtx, false).includes('Turn this on if yours is a shot'));
check('clinic line', I.matchLine(remicade, false).includes('clinic'));
check('B12 line names pernicious anemia', I.matchLine(I.matchInjectable('Cyanocobalamin'), false).includes('pernicious anemia'));
check('unknown line', I.matchLine(null, false).includes('Turn this on'));

// Rotation
const rot = I.defaultRotation();
check('default rotation', rot.length === 6 && rot[0].key === 'belly_left' && !rot.some((s) => s.key.startsWith('buttock')));
const shot = (key, at, sched = null) => ({ id: `${key}${at}`, siteKey: key, siteLabel: I.BUILT_IN_SITES.find((s) => s.key === key)?.label ?? key, recordedAt: at, scheduleItemId: sched });
check('first shot goes first spot', I.nextSite(rot, []).key === 'belly_left');
check('unused comes next', I.nextSite(rot, [shot('belly_left', '2026-09-01T08:00')]).key === 'belly_right');
const full = rot.map((s, i) => shot(s.key, `2026-09-0${i + 1}T08:00`));
check('longest ago after a full round', I.nextSite(rot, full).key === 'belly_left');
check('out of turn', I.nextSite(rot, [...full, shot('belly_left', '2026-09-10T08:00')]).key === 'belly_right');
check('site outside the rotation ignored', I.nextSite(rot, [...full, shot('buttock_left', '2026-09-11T08:00')]).key === 'belly_left');
check('empty rotation', I.nextSite([], full) === null && I.nextSiteLine([], full) === null);
check('next line', I.nextSiteLine(rot, []) === 'Next site: Belly, left side');
check('same day ordered by time', I.nextSite(rot.slice(0, 2), [shot('belly_left', '2026-09-01T20:00'), shot('belly_right', '2026-09-01T08:00')]).key === 'belly_right');

// Last and picker
check('last line', I.lastSiteLine(full, '2026-09-09') === 'Last shot: Back of right upper arm, 3 days ago (6 Sep).');
check('last line today', I.lastSiteLine([shot('thigh_left', '2026-09-30T07:15')], '2026-09-30').includes('today'));
check('last line yesterday', I.lastSiteLine([shot('thigh_left', '2026-09-29T22:15')], '2026-09-30').includes('yesterday'));
check('no shots', I.lastSiteLine([], '2026-09-30') === 'No shot recorded yet.');
const choices = I.siteChoices(rot, [shot('belly_left', '2026-09-01T08:00')]);
check('picker next first', choices[0].site.key === 'belly_right' && choices[0].label.endsWith('(next)'));
check('picker last used', choices.find((c) => c.site.key === 'belly_left').label === 'Belly, left side, last 1 Sep');
check('picker not used', choices.find((c) => c.site.key === 'thigh_left').label.endsWith('not used yet'));
check('picker length', choices.length === rot.length);

// Own spots and ordering
const own = I.ownSite('  Lower belly,  left of the scar ');
check('own spot', own.key === 'own:lower_belly_left_of_the_scar' && own.label === 'Lower belly, left of the scar');
check('own blank', I.ownSite('   ') === null && I.ownSite('!!!') === null);
check('own is own', I.isOwnSite(own) && !I.isOwnSite(rot[0]));
const ordered = I.orderRotation([own, rot[3], rot[0], rot[0]]);
check('order: body then own, no repeats', ordered.map((s) => s.key).join() === `belly_left,thigh_right,${own.key}`);
check('toggle out', I.toggleSite(rot, rot[0]).length === 5);
check('toggle in keeps order', I.toggleSite(rot.slice(1), rot[0])[0].key === 'belly_left');
check('parse round trip', JSON.stringify(I.parseRotation(JSON.stringify([...rot, own]))) === JSON.stringify([...rot, own]));
check('parse bad', I.parseRotation('nope') === null && I.parseRotation(null) === null && I.parseRotation('{}') === null);

// Wording
const all = [I.INJECTION_LEAD, ...I.KNOWN_INJECTABLES.map((k) => I.matchLine(k, true)), I.matchLine(null, true), I.matchLine(null, false),
  I.lastSiteLine(full, '2026-09-09'), I.nextSiteLine(rot, full), ...choices.map((c) => c.label)].join('\n');
check('names the prescriber', /prescriber/.test(I.INJECTION_LEAD));
check('never changes a dose', /never changes a dose/.test(I.INJECTION_LEAD));
check('no advice words', !/\byou should\b|\bmust\b|\bbest (spot|site)\b|\bconsider (reducing|increasing|stopping)\b/i.test(all));
check('no dashes', !/[–—]| -- | - /.test(all));
check('no filler words', !/\b(real|genuine|genuinely)\b/i.test(all));

console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
