// Checks lib/voiceControl.ts: plain words into one thing to do.
const fs = require('fs');
const ts = require('typescript');
const source = fs.readFileSync(require.resolve('../lib/voiceControl.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } });
const t = {};
new Function('exports', outputText)(t);
let failed = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.log('FAIL', name, '\n  got ', JSON.stringify(got), '\n  want', JSON.stringify(want)); }
}
const named = (list) => list.map((name, i) => ({ id: `${name}#${i}`, name }));
const screen = {
  tabs: named(['Home', 'Food', 'Schedules', 'Signals', 'Insights', 'Trends', 'Reports', 'Garden', 'Life', 'Profile']),
  lenses: named(['Garden Areas', 'Horticulture', 'Growing Conditions', 'Days Until']),
  controls: named(['Save', 'Save and Add Another', 'Store Its Location', 'Close', 'Close', 'Add a Planting', 'Food']),
  fields: named(['Search foods', 'Notes', 'What is it? (bowling balls)']),
};
const c = (name) => screen.controls.filter((x) => x.name === name).map((x) => x.id);
check('help', t.resolveVoiceCommand('What can I say?', screen), { kind: 'help' });
check('back', t.resolveVoiceCommand('Go back.', screen), { kind: 'back' });
check('scroll down', t.resolveVoiceCommand('scroll down', screen), { kind: 'scroll', move: 'down' });
check('scroll to the top', t.resolveVoiceCommand('Scroll to the top', screen), { kind: 'scroll', move: 'top' });
check('go to tab', t.resolveVoiceCommand('Go to Garden', screen), { kind: 'tab', id: 'Garden#7' });
check('the tab', t.resolveVoiceCommand('open the Trends tab', screen), { kind: 'tab', id: 'Trends#5' });
check('lens', t.resolveVoiceCommand('Open Horticulture', screen), { kind: 'lens', id: 'Horticulture#1' });
check('lens over tab on partial', t.resolveVoiceCommand('show garden areas', screen), { kind: 'lens', id: 'Garden Areas#0' });
check('press exact', t.resolveVoiceCommand('Press Save', screen), { kind: 'press', ids: c('Save') });
check('press the button', t.resolveVoiceCommand('tap the save button', screen), { kind: 'press', ids: c('Save') });
check('press start of name', t.resolveVoiceCommand('press store its', screen), { kind: 'press', ids: c('Store Its Location') });
check('press two with one name', t.resolveVoiceCommand('Close', screen), { kind: 'press', ids: c('Close') });
check('bare name, button wins a tie', t.resolveVoiceCommand('Food', screen), { kind: 'press', ids: c('Food') });
check('go to a button', t.resolveVoiceCommand('open add a planting', screen), { kind: 'press', ids: c('Add a Planting') });
check('type in box', t.resolveVoiceCommand('Type milk in search', screen), { kind: 'type', text: 'milk', fieldIds: ['Search foods#0'] });
check('type keeps its own in', t.resolveVoiceCommand('Type one in ten in the notes', screen), { kind: 'type', text: 'one in ten', fieldIds: ['Notes#1'] });
check('search for', t.resolveVoiceCommand('Search for blueberries', screen), { kind: 'type', text: 'blueberries', fieldIds: ['Search foods#0'] });
check('type with no box', t.resolveVoiceCommand('type hello there', screen), { kind: 'type', text: 'hello there', fieldIds: screen.fields.map((f) => f.id) });
check('nothing called that', t.resolveVoiceCommand('press launch rocket', screen), { kind: 'notFound', heard: 'launch rocket' });
check('empty', t.resolveVoiceCommand('  ', screen), { kind: 'notFound', heard: '' });
check('key', t.voiceKey('The “Save” button!'), 'save');
check('ampersand', t.voiceKey('Backup & Restore'), 'backup and restore');
if (failed) { console.log(failed + ' failed'); process.exit(1); }
console.log('All voice control checks passed');
