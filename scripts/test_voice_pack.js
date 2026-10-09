// Checks lib/voicePack.ts: when the speech pack is offered at the
// microphone, what follows a download, who is named as hearing the audio,
// and that every sentence keeps to the house writing rules.
// Run: node scripts/test_voice_pack.js
/* global __dirname */
const path = require('path');
const fs = require('fs');
const ts = require('typescript');

const src = fs.readFileSync(path.join(__dirname, '..', 'lib', 'voicePack.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const m = { exports: {} };
new Function('module', 'exports', 'require', js)(m, m.exports, require);
const V = m.exports;

let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) pass++;
  else {
    fail++;
    console.log('FAIL', name);
  }
}

const base = { platform: 'android', osVersion: 34, supportsOnDevice: true, installed: false, neverAsk: false, askedThisRun: false };
check('offered on Android 14 with no pack', V.shouldOfferVoicePack(base));
check('not offered when installed', !V.shouldOfferVoicePack({ ...base, installed: true }));
check('not offered after Dont Ask Again', !V.shouldOfferVoicePack({ ...base, neverAsk: true }));
check('not offered twice in a run', !V.shouldOfferVoicePack({ ...base, askedThisRun: true }));
check('not offered on Android 12', !V.shouldOfferVoicePack({ ...base, osVersion: 32 }));
check('offered on Android 13', V.shouldOfferVoicePack({ ...base, osVersion: 33 }));
check('not offered without on-device support', !V.shouldOfferVoicePack({ ...base, supportsOnDevice: false }));
check('not offered on iPhone', !V.shouldOfferVoicePack({ ...base, platform: 'ios' }));
check('not offered on desktop', !V.shouldOfferVoicePack({ ...base, platform: 'web' }));

check('meta empty', V.parseVoicePackMeta(null).neverAsk === false);
check('meta bad json', V.parseVoicePackMeta('{x').neverAsk === false);
check('meta never', V.parseVoicePackMeta('{"neverAsk":true}').neverAsk === true);
check('meta off', V.parseVoicePackMeta('{"neverAsk":false}').neverAsk === false);

check('installed match ignores case and underscore', V.isLocaleInstalled(['EN_us'], 'en-US'));
check('installed no match', !V.isLocaleInstalled(['es-MX'], 'en-US'));
check('installed null', !V.isLocaleInstalled(null, 'en-US'));
check('exact locale preferred', V.findInstalledLocale(['en-GB', 'en-US'], 'en-US') === 'en-US');
check('same language counts as a pack', V.findInstalledLocale(['en-GB'], 'en-US') === 'en-GB');
check('bare language counts', V.findInstalledLocale(['en'], 'en-US') === 'en');
check('other language does not', V.findInstalledLocale(['es-MX'], 'en-US') === null);

check('language english', V.languageName('en-US') === 'English');
check('language spanish', V.languageName('es_MX') === 'Spanish');
check('language unknown falls back', V.languageName('xx-YY') === 'xx-YY');

check('google named', V.speechServiceName('com.google.android.as') === "Google's speech service");
check('samsung named', V.speechServiceName('com.samsung.android.bixby.agent') === "Samsung's speech service");
check('unknown not guessed', V.speechServiceName('') === "the phone's speech service");

check('success listens on phone', V.afterVoicePackDownload('download_success') === 'on-device');
check('dialog waits', V.afterVoicePackDownload('opened_dialog') === 'wait');
check('scheduled asks', V.afterVoicePackDownload('download_scheduled') === 'ask');
check('failed asks', V.afterVoicePackDownload('failed') === 'ask');

const prompt = V.voicePackPrompt('en-US', "Google's speech service");
check('prompt names language', prompt.body.includes('English speech pack'));
check('prompt names the service', prompt.body.includes("Google's speech service"));
check('prompt says why', /no Lifestead server/.test(prompt.body) && /never leave the phone/.test(prompt.body));
check('three buttons', prompt.download && prompt.notNow && prompt.never);

const sit = { platform: 'android', osVersion: 34, supportsOnDevice: true, installed: false, neverAsk: false };
const lines = [
  V.voicePackStatusLine({ ...sit, installed: true }, 'en-US', 'x'),
  V.voicePackStatusLine(sit, 'en-US', "Google's speech service"),
  V.voicePackStatusLine({ ...sit, neverAsk: true }, 'en-US', "Google's speech service"),
  V.voicePackStatusLine({ ...sit, osVersion: 30 }, 'en-US', "Google's speech service"),
];
check('status installed', /never leaves it/.test(lines[0]));
check('status missing offers', /offers the download/.test(lines[1]));
check('status never says so', /asked not to be reminded/.test(lines[2]));
check('status old phone', /cannot turn speech into text by itself/.test(lines[3]));

const all = [
  prompt.title, prompt.body, prompt.download, prompt.notNow, prompt.never, V.VOICE_PACK_CARD_LEAD, ...lines,
  ...['download_scheduled', 'failed'].flatMap((s) => Object.values(V.voicePackFollowUp(s, 'the service'))),
].join('\n');
check('no dashes', !/[–—]| -- | - /.test(all));
check('no filler words', !/\b(real|genuine|genuinely)\b/i.test(all));
check('no redundant own', !/\bown\b/i.test(all));

console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
