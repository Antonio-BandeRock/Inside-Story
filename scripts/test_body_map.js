// Checks lib/bodyMap.ts, the body map (D11, 2026-09-30).
//
// 1. Every area has words, every key is unique, and every key is drawn on
//    at least one view.
// 2. Left and right are the person's: on the front view their right is on
//    the viewer's left, on the back view their left is, and a pair mirrors.
// 3. Every shape sits inside the drawing box.
// 4. Trends counts days, not entries, and says how many entries have no
//    area marked rather than calling them nothing.
// 5. No word in the module names a cause, a meaning or a judgement.
//
// Exits non-zero on any failure.

/* global __dirname */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'lib', 'bodyMap.ts');
const source = fs.readFileSync(file, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = { exports: {} };
new Function('exports', 'module', 'require', outputText)(mod.exports, mod, (name) => {
  throw new Error('lib/bodyMap.ts must stay free of imports (asked for ' + name + ')');
});
const M = mod.exports;

let checks = 0;
let failures = 0;
function check(condition, label) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error('FAIL: ' + label);
  }
}

// 1. Areas.
const keys = M.BODY_REGIONS.map((r) => r.key);
check(new Set(keys).size === keys.length, 'every key is unique');
check(M.BODY_REGIONS.every((r) => r.label.length > 3 && /^[A-Z]/.test(r.label)), 'every area has words starting with a capital');
const drawn = new Set([...M.shapesFor('front'), ...M.shapesFor('back')].map((s) => s.key));
check(keys.every((k) => drawn.has(k)), 'every area is drawn on a view');
check([...drawn].every((k) => M.isBodyRegion(k)), 'every drawn shape is a listed area');
for (const view of ['front', 'back']) {
  const shown = M.shapesFor(view).map((s) => s.key);
  check(new Set(shown).size === shown.length, view + ': no area drawn twice');
  check(M.regionsFor(view).length === shown.length, view + ': the list matches the drawing');
}
check(M.regionLabel('left_knee') === 'Left knee', 'left knee label');
check(M.regionLabel('right_back_of_thigh') === 'Back of the right thigh', 'back of thigh label');
check(M.regionLabel('gone_area') === 'gone_area', 'an unknown key reads as itself');
check(M.regionsSentence(['lower_back', 'left_knee']) === 'Lower back, Left knee', 'sentence keeps the order marked');
check(M.toggleRegion(['a'], 'b').join() === 'a,b' && M.toggleRegion(['a', 'b'], 'a').join() === 'b', 'toggle adds and removes');

// 2. Sides.
const centre = (shape) => (shape.kind === 'ellipse' ? shape.cx : shape.x + shape.w / 2);
const at = (view, key) => M.shapesFor(view).find((s) => s.key === key).shape;
check(centre(at('front', 'right_knee')) < 60 && centre(at('front', 'left_knee')) > 60, 'front: their right on the viewer left');
check(centre(at('back', 'left_calf')) < 60 && centre(at('back', 'right_calf')) > 60, 'back: their left on the viewer left');
check(centre(at('front', 'right_hand')) + centre(at('front', 'left_hand')) === 120, 'a pair mirrors exactly');
check(centre(at('front', 'left_shoulder')) === centre(at('back', 'right_shoulder')), 'front left and back right are drawn on the same side');
check(/your left and right/.test(M.SIDES_NOTE), 'the sides note says whose left');

// 3. In the box.
for (const view of ['front', 'back']) {
  for (const { key, shape } of M.shapesFor(view)) {
    const [x0, x1, y0, y1] = shape.kind === 'ellipse'
      ? [shape.cx - shape.rx, shape.cx + shape.rx, shape.cy - shape.ry, shape.cy + shape.ry]
      : [shape.x, shape.x + shape.w, shape.y, shape.y + shape.h];
    check(x0 >= 0 && y0 >= 0 && x1 <= M.BODY_BOX.width && y1 <= M.BODY_BOX.height, view + ' ' + key + ' is inside the box');
  }
}

// 4. Trends.
const entries = [
  { loggedAt: '2026-09-02T08:00', regions: ['left_knee'] },
  { loggedAt: '2026-09-02T20:00', regions: ['left_knee', 'lower_back'] },
  { loggedAt: '2026-09-09T08:00', regions: ['left_knee'] },
  { loggedAt: '2026-09-10T08:00', regions: [] },
];
const days = M.regionDays(entries);
check(days[0].key === 'left_knee' && days[0].days.length === 2, 'a day counts once for an area');
check(days[0].display === '2 days: Sep 2, Sep 9', 'days shown by date');
check(days[1].key === 'lower_back' && days[1].display === 'one day: Sep 2', 'one day reads as one day');
check(M.markedSentence(entries) === 'Areas marked on 3 of 4 entries. The other one has none marked.', 'marked sentence names the unmarked');
check(M.markedSentence([]) === 'No flares or reactions logged in this range.', 'empty range');
check(M.markedSentence([entries[3]]) === 'No area marked on the one entry in this range.', 'nothing marked is not marked');
const many = ['01', '03', '05', '07', '09', '11'].map((d) => ({ loggedAt: '2026-09-' + d + 'T08:00', regions: ['head'] }));
check(M.regionDays(many)[0].display === '6 days: Sep 5, Sep 7, Sep 9, Sep 11, and 2 earlier', 'long lists show the latest four');

// 5. Words.
const code = source.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*\*[\s\S]*?\*\//g, '');
for (const word of ['normal', 'healthy', 'worry', 'because', 'caused', 'cause', 'means', 'organ', 'thyroid', 'kidney', 'liver', 'score', 'streak']) {
  check(!new RegExp('\b' + word + '\b', 'i').test(code), 'no "' + word + '" in the module');
}

console.log(`${checks - failures}/${checks} body map checks passed`);
if (failures > 0) process.exit(1);
