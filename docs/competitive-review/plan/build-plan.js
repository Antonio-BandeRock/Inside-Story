const fs = require('fs');
const path = require('path');
const dir = __dirname;
const lines = fs.readFileSync(path.join(dir, 'items.txt'), 'utf8').split(/\r?\n/);

const items = [];
let group = '';
for (const l of lines) {
  if (!l.trim() || l.startsWith('# ')) continue;
  if (l.startsWith('## ')) { group = l.slice(3).trim(); continue; }
  const p = l.split('|');
  if (p.length < 8) throw new Error('bad line: ' + l);
  const [id, phase, ship, size, tabs, comps, title, ...rest] = p;
  items.push({ id, phase: +phase, ship, size, tabs, comps, title, how: rest.join('|'), group });
}
const ids = new Set();
for (const it of items) { if (ids.has(it.id)) throw new Error('dup ' + it.id); ids.add(it.id); }

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SHIP = {
  OTA: ['Over the air', 'ota'],
  R1: ['Android rebuild', 'r1'],
  R2: ['iPhone build', 'r2'],
  WK: ['Worker', 'wk'],
  RL: ['Relay', 'wk'],
  DB: ['Live DB, your yes', 'ask'],
  DEC: ['Your decision', 'ask'],
  OPT: ['Opt-in only', 'ask'],
  SRV: ['Needs a server', 'ask'],
  DOC: ['Reading content', 'ota'],
};

const PHASES = [
  [0, 'Phase 0. Decisions only you can make', 'Nothing here is code yet. Each one either touches the live database, costs money, or bends a standing rule, so it waits for your answer. None of them blocks Phase 1.'],
  [1, 'Phase 1. Foundations', 'Built first because many later items stand on them: repeats, the one-day timeline, the photo layer, notification buttons, custom trackers and scales, Pattern Finder for any factor, the Body Signals lens, report charts and recipe import. All over the air.'],
  [2, 'Phase 2. Quick wins over the air', 'Small and medium items that each close a named competitor gap with no rebuild. Most take an hour to a day each.'],
  [3, 'Phase 3. Larger builds over the air', 'Bigger pieces of JS work: new tables with their own screens, drawn editors, experiments, the caregiver holding, garden planning, bank import.'],
  [4, 'Phase 4. The Android rebuild (R1)', 'Everything below needs native code, so it is gathered into one EAS build. Both phones reinstall once.'],
  [5, 'Phase 5. The Worker and the relay', 'Cloudflare work on inside-story-site: the content-blind relay, and the public-data bundles under the three privacy shapes from item 27.'],
  [6, 'Phase 6. The iPhone build (R2)', 'Apple Health, widgets and Live Activity. Needs an Apple developer account for signing an iPhone build, which is its own decision.'],
  [7, 'Phase 7. Opt-in, server and ruled-out items', 'Kept on the list so nothing from the review is dropped. Each one either sends something off the phone, needs a company server, costs a licence, or breaks a standing rule. Each needs your yes before any work.'],
];

const TABS = ['Home', 'Food', 'Schedules', 'Signals', 'Insights', 'Trends', 'Reports', 'Garden', 'Life'];

function row(it) {
  const [label, cls] = SHIP[it.ship] || [it.ship, 'ota'];
  const tabList = it.tabs.split(',').map(t => t.trim());
  return `<tr data-tabs="${esc(tabList.join('|'))}" data-text="${esc((it.title + ' ' + it.how + ' ' + it.comps).toLowerCase())}">
<td class="id">${it.id}</td>
<td><div class="t">${esc(it.title)}</div><div class="how">${esc(it.how)}</div><div class="meta">${esc(it.group)} · answers ${esc(it.comps)}</div></td>
<td class="tabs">${tabList.map(esc).join('<br>')}</td>
<td><span class="ship ${cls}">${label}</span></td>
<td class="size">${esc(it.size)}</td>
</tr>`;
}

const counts = {};
for (const it of items) counts[it.ship] = (counts[it.ship] || 0) + 1;
const ota = (counts.OTA || 0) + (counts.DOC || 0);
const r1 = counts.R1 || 0, r2 = counts.R2 || 0, wk = (counts.WK || 0) + (counts.RL || 0);
const ask = (counts.DB || 0) + (counts.DEC || 0) + (counts.OPT || 0) + (counts.SRV || 0);

const phaseHtml = PHASES.map(([n, title, lead]) => {
  const list = items.filter(i => i.phase === n);
  return `<section class="phase" id="p${n}">
<h2>${esc(title)} <span class="count">${list.length}</span></h2>
<p class="lead">${esc(lead)}</p>
<div class="tw"><table><thead><tr><th>#</th><th>What and how</th><th>Tabs</th><th>Ships by</th><th>Size</th></tr></thead>
<tbody>${list.map(row).join('\n')}</tbody></table></div>
</section>`;
}).join('\n');

const byId = Object.fromEntries(items.map(i => [i.id, i]));
const refs = a => a.map(id => `<b>${id}</b> ${esc(byId[id].title)}`).join('; ');

const html = `<title>Inside Story Build Plan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
:root{
 --bg:#f4f6f3;--panel:#ffffff;--ink:#1d2621;--muted:#5b6961;--line:#d6ddd8;--accent:#2f6b4f;--accent-soft:#e2eee7;
 --ota:#2f6b4f;--ota-bg:#e2eee7;--r1:#8a4d12;--r1-bg:#f6e8d8;--r2:#3f4f8f;--r2-bg:#e4e8f6;--wk:#6a3f86;--wk-bg:#efe6f5;--ask:#9b2d2d;--ask-bg:#f7e2e2;
 color-scheme:light;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
 --bg:#141a17;--panel:#1c2420;--ink:#e3ebe6;--muted:#9aaba1;--line:#2f3a34;--accent:#7cc39c;--accent-soft:#223329;
 --ota:#8fd1ac;--ota-bg:#1f3328;--r1:#e6b07a;--r1-bg:#3a2a1a;--r2:#a8b6f0;--r2-bg:#242b45;--wk:#cfa6ea;--wk-bg:#322340;--ask:#f0a0a0;--ask-bg:#402222;
 color-scheme:dark;}}
:root[data-theme="dark"]{
 --bg:#141a17;--panel:#1c2420;--ink:#e3ebe6;--muted:#9aaba1;--line:#2f3a34;--accent:#7cc39c;--accent-soft:#223329;
 --ota:#8fd1ac;--ota-bg:#1f3328;--r1:#e6b07a;--r1-bg:#3a2a1a;--r2:#a8b6f0;--r2-bg:#242b45;--wk:#cfa6ea;--wk-bg:#322340;--ask:#f0a0a0;--ask-bg:#402222;
 color-scheme:dark;}
body{background:var(--bg);color:var(--ink);font:15px/1.55 "IBM Plex Sans",system-ui,sans-serif;padding-inline:16px;padding-block:28px 64px}
.wrap{max-width:1080px;margin:0 auto;display:flex;flex-direction:column;gap:34px}
h1,h2,h3{font-family:"Source Serif 4",Georgia,serif;font-weight:600;text-wrap:balance;margin:0}
h1{font-size:2rem;line-height:1.15}
h2{font-size:1.4rem}
h3{font-size:1.08rem;margin-bottom:6px}
p{margin:0;max-width:72ch}
.lead{color:var(--muted);margin-top:6px}
.kicker{font:500 .75rem "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
header{display:flex;flex-direction:column;gap:10px}
.stats{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px 12px;font-variant-numeric:tabular-nums}
.stat b{font-size:1.15rem;margin-right:6px}
.box{background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:8px;padding:18px 20px;display:flex;flex-direction:column;gap:10px}
.box.warn{border-left-color:var(--ask)}
.box ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:5px;max-width:78ch}
.phase{display:flex;flex-direction:column;gap:8px;scroll-margin-top:70px}
.count{font:500 .8rem "IBM Plex Mono",monospace;color:var(--muted);margin-left:6px}
.tw{overflow-x:auto;background:var(--panel);border:1px solid var(--line);border-radius:8px}
table{border-collapse:collapse;width:100%;min-width:640px}
th{text-align:left;font:600 .72rem "IBM Plex Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:10px 12px;border-bottom:1px solid var(--line)}
td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
td.id{font:500 .82rem "IBM Plex Mono",monospace;color:var(--accent);white-space:nowrap}
td.tabs{font-size:.82rem;color:var(--muted);white-space:nowrap}
td.size{font:500 .82rem "IBM Plex Mono",monospace;white-space:nowrap}
.t{font-weight:600}
.how{margin-top:3px}
.meta{margin-top:4px;font-size:.8rem;color:var(--muted)}
.ship{display:inline-block;font-size:.76rem;font-weight:600;padding:2px 8px;border-radius:99px;white-space:nowrap}
.ship.ota{color:var(--ota);background:var(--ota-bg)}.ship.r1{color:var(--r1);background:var(--r1-bg)}
.ship.r2{color:var(--r2);background:var(--r2-bg)}.ship.wk{color:var(--wk);background:var(--wk-bg)}.ship.ask{color:var(--ask);background:var(--ask-bg)}
.filters{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);padding-block:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;border-bottom:1px solid var(--line)}
.filters button{font:500 .82rem "IBM Plex Sans",sans-serif;border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:99px;padding:5px 11px;cursor:pointer}
.filters button[aria-pressed="true"]{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.filters input{flex:1 1 180px;min-width:0;font:inherit;padding:6px 10px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--ink)}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:16px 18px;display:flex;flex-direction:column;gap:8px}
.card ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:.92rem}
nav.toc{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.88rem}
nav.toc a{color:var(--accent)}
.hide{display:none}
</style>
<div class="wrap">
<header>
<span class="kicker">Inside Story · written 2026-09-25 · from the nine competitor reviews</span>
<h1>Everything the competitors do, and how Inside Story gets there</h1>
<p class="lead">Every gap the nine tab reviews named, merged where two tabs asked for the same thing, then ordered so each phase stands on the one before. Nothing from the review is left out: items that break a standing rule or need a server are listed in Phase 7 with the reason, waiting on your yes.</p>
<div class="stats">
<span class="stat"><b>${items.length}</b>items</span>
<span class="stat"><b>${ota}</b>ship over the air</span>
<span class="stat"><b>${r1}</b>in the Android rebuild</span>
<span class="stat"><b>${r2}</b>in the iPhone build</span>
<span class="stat"><b>${wk}</b>on the Worker</span>
<span class="stat"><b>${ask}</b>wait on your decision</span>
</div>
</header>

<section class="box warn" id="sms">
<h2>Can Inside Story be the default texting app?</h2>
<p><b>Technically, on Android only. Not advisable, and local-first is not what stops it.</b> A text travels through the carrier, not a company server, so it fits the privacy model fine. What stops it:</p>
<ul>
<li><b>Google Play policy.</b> The SMS and Call Log permissions are granted only to apps whose core purpose is messaging, through a Permissions Declaration Google reviews. A health and daily-living app asking to be the default SMS handler is very likely refused, and a refusal can hold up every other update.</li>
<li><b>The person loses RCS</b> (typing dots, read receipts, full-size photos, encrypted chats with Google Messages users), since Google gives no other app access to RCS.</li>
<li><b>It is a whole messaging app to build:</b> the receivers, MMS, group threads, blocking, delivery reports, and a Kotlin native module.</li>
<li><b>It cannot exist on iPhone or on the desktop app</b>, so it would never be part of Inside Story everywhere.</li>
</ul>
<p><b>What gets most of the value without that:</b> read phone contacts into Emergency, prescriber, pharmacy and the family roster (O1); text or call from inside the app with the message filled in (O2); share any text, link or photo into Capture from any app (C11); and <b>encrypted messages between Inside Story users</b> through the device keys already built, carried by a relay that cannot read them (O3, M1). That last one is the communication system that fits local-first, and it is what makes a missed-dose alert reach a caregiver on time. The default-texting item stays on the list as O5 so nothing is dropped.</p>
</section>

<nav class="toc">
${PHASES.map(([n, t]) => `<a href="#p${n}">${esc(t.replace(/^Phase \d+\. /, 'Phase ' + n + ': '))}</a>`).join('\n')}
<a href="#rebuilds">Rebuild map</a><a href="#owner">What waits on you</a><a href="#checks">Checks done</a>
</nav>

<section class="phase" id="rebuilds">
<h2>The rebuild map</h2>
<p class="lead">Native work is expensive in one way: every build makes both phones reinstall. So everything native is gathered. JS for each feature can ship first and simply light up when the build arrives.</p>
<div class="grid2">
<div class="card"><h3>R1, one Android build</h3><ul>
<li>Share target: a SEND intent filter for text, links and images (C11)</li>
<li>expo-quick-actions plus a quick settings tile (C12)</li>
<li>react-native-android-widget: next thing, next dose, Capture, grocery, Fuel Gauges, routine step, one-tap glass (L2)</li>
<li>Health Connect: breathing rate and body temperature permissions (L4)</li>
<li>expo-keep-awake for cook mode (G4)</li>
<li>expo-audio for relaxation audio (D15)</li>
<li>expo-location for weather by place, coarsened (F22, G36)</li>
<li>expo-contacts and expo-sms (O1, O2)</li>
<li>FCM remote push setup for the relay (M1)</li>
<li>react-native-webview for marking up a recipe page (G3)</li>
<li>ML Kit image labelling, on the phone (G24)</li>
<li>A small HTTP listener for Ecowitt pushes (I22)</li>
<li>Only if you say so: the notification listener (O4) and the default SMS module (O5)</li>
</ul></div>
<div class="card"><h3>R2, the iPhone build</h3><ul>
<li>HealthKit behind the same interface as lib/healthConnect.ts (L1)</li>
<li>WidgetKit widgets and a Live Activity for the current routine or dose, through @bacons/apple-targets (L3, B3)</li>
<li>iOS push through APNs for the relay (M1)</li>
<li>Check notification action buttons on iPhone (C1)</li>
<li>Needs an Apple developer account ($99 a year) to sign it; that is a decision on its own</li>
</ul></div>
<div class="card"><h3>Worker and relay (Phase 5, no phone rebuild)</h3><ul>
<li>Content-blind push relay: a wake-up and sealed bytes only (M1), unlocking on-time caregiver alerts (A16), instant household sync (J12) and messages (O3)</li>
<li>Recall bundle matched on the phone (A14)</li>
<li>Weather as a coarsened bundle (F22)</li>
<li>Pl@ntNet plant identification, opt-in per photo (I24)</li>
<li>A try-before-install page (C21)</li>
<li>Later and costed: chain menus (Z7), seed barcodes (Z8), vision and AI opt-ins (Z1, Z3)</li>
<li>Workers Paid at $5 a month from the first lookup, as item 27 already set</li>
</ul></div>
<div class="card"><h3>The order, and why</h3><ul>
<li>Phases 1 to 3 ship over the air in whatever order suits, each an update on its own</li>
<li>R1 goes once C11, G4, L2 and O1's JS halves exist, so the build lands with its screens ready</li>
<li>The relay follows R1, since it needs FCM in the build</li>
<li>R2 last, once the Android versions of widgets and health reads have settled</li>
</ul></div>
</div>
</section>

<section class="phase" id="owner">
<h2>What waits on you</h2>
<div class="grid2">
<div class="card"><h3>Touches the live database</h3><ul>
<li>${refs(['A9'])}. interaction_rules lives in foods_reference.db</li>
<li>${refs(['G23'])}. Needs new columns; better done in the unified database's Phase 5</li>
<li>Crop family stays out of the DB: lib/cropFamilies.ts keyed on food_id instead (I10)</li>
</ul></div>
<div class="card"><h3>Money and licences</h3><ul>
<li>${refs(['A11', 'A15'])}</li>
<li>Questionnaire licences beyond PHQ-9 and GAD-7 (D13) and relaxation audio content (D15)</li>
<li>${refs(['I25', 'Z7'])}</li>
<li>Apple developer account for R2</li>
</ul></div>
<div class="card"><h3>Bends a standing rule</h3><ul>
<li>${refs(['Z2'])}. A score standing in for a clinician (Phase A)</li>
<li>${refs(['Z4'])}. Keeping Up bans praise and streaks</li>
<li>${refs(['Z12'])}. Home cooking over commercial</li>
<li>${refs(['Z1', 'Z3', 'C14'])}. Something leaves the phone</li>
</ul></div>
<div class="card"><h3>Product decisions</h3><ul>
<li>${refs(['C17'])}. Distinct things or repetitions (item 29)</li>
<li>${refs(['Z15'])}</li>
<li>The Free-tier line, redrawn for a way in without a condition (item 28)</li>
<li>${refs(['G29', 'O5'])}</li>
<li>Servers: ${refs(['Z5', 'Z6', 'Z9', 'Z10', 'Z11'])}</li>
</ul></div>
</div>
</section>

<section class="box" id="checks">
<h2>Checks already done before the rebuild list was written</h2>
<ul>
<li><b>Health Connect already has read permission</b> for steps, distance, exercise, sleep, glucose, menstruation, weight, blood pressure, heart rate, resting heart rate, HRV, blood oxygen, skin temperature, hydration and nutrition. So the Body Signals lens (F9), heart rate and HRV in reports (K8) and the Home readings need <b>no rebuild</b>, although two tab reviews said they did. Only breathing rate and body temperature need new permissions (L4).</li>
<li><b>Lab values from a photo need no rebuild:</b> ML Kit OCR (rn-mlkit-ocr) is already in the build (G28, G2, G27).</li>
<li>Also already in the build: expo-sensors (light meter, I3), expo-speech (B6), expo-calendar (B2), react-native-zeroconf (I20), expo-image-picker (X1).</li>
<li>chrono-node for plain-language dates is pure JS, so it ships over the air (C4).</li>
<li>Not installed, so they sit in R1: expo-keep-awake, expo-audio, expo-location, expo-contacts, expo-sms, react-native-webview, expo-quick-actions, react-native-android-widget, a share-intent module.</li>
<li>app.json has VIEW intent filters only, so the share target is new native config (C11). Notification categories exist only for Snooze, and adding more is JS (C1).</li>
</ul>
</section>

<div class="filters" id="filters">
<button data-tab="" aria-pressed="true">All tabs</button>
${TABS.map(t => `<button data-tab="${t}" aria-pressed="false">${t}</button>`).join('')}
<input type="search" id="q" placeholder="Search items, e.g. refill, cycle, Paprika" aria-label="Search items">
</div>

${phaseHtml}

<section class="box">
<h2>Rules every item is built under</h2>
<ul>
<li>Never diagnose, claim a cause, change a medication, or let a score stand in for a clinician; every new sentence generator goes into audit_clinical_claims.js.</li>
<li>No praise, blame, streaks or percentages on anything about keeping up; a blank period is drawn as a gap.</li>
<li>Every new list has add-your-own, and removal moves or retires rather than orphans.</li>
<li>Anything that leaves the phone is opt-in, says what leaves, and goes through the Worker in one of the three privacy shapes.</li>
<li>Photos and new tables that describe health never travel between people unless the peer allowlist names them.</li>
<li>Each request: tsc, eslint, the audits, a version bump, and an over-the-air update to Android plus a desktop installer.</li>
</ul>
</section>
</div>
<script>
(function(){
 var tab='',q='';
 var btns=[].slice.call(document.querySelectorAll('#filters button'));
 var rows=[].slice.call(document.querySelectorAll('tr[data-tabs]'));
 function apply(){
  rows.forEach(function(r){
   var okT=!tab||r.getAttribute('data-tabs').split('|').indexOf(tab)>=0||r.getAttribute('data-tabs')==='all';
   var okQ=!q||r.getAttribute('data-text').indexOf(q)>=0;
   r.classList.toggle('hide',!(okT&&okQ));
  });
  document.querySelectorAll('section.phase[id^="p"]').forEach(function(s){
   var n=s.querySelectorAll('tr[data-tabs]:not(.hide)').length;
   var c=s.querySelector('.count'); if(c) c.textContent=n;
  });
 }
 btns.forEach(function(b){b.addEventListener('click',function(){
  tab=b.getAttribute('data-tab'); btns.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')}); apply();
 })});
 document.getElementById('q').addEventListener('input',function(e){q=e.target.value.trim().toLowerCase();apply();});
})();
</script>
`;

fs.writeFileSync(path.join(dir, 'competitive-plan.html'), html);
const byPhase = {}; for (const i of items) byPhase[i.phase] = (byPhase[i.phase] || 0) + 1;
console.log('items', items.length, 'byPhase', JSON.stringify(byPhase), 'ship', JSON.stringify(counts));
