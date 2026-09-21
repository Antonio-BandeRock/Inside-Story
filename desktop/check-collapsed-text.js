// Finds text the desktop build lays out at zero size.
//
// Written 2026-09-21, the first day on Windows, after "the label for the
// LensHub icons, that is supposed to be below them, is not below them. It
// isn't there at all." The label was in the page, visible, coloured and
// shadowed, and zero pixels tall: a Text with numberOfLines carries
// overflow: hidden on the web, which lets it shrink as a flex item, and a
// browser's default flex-shrink is 1 where Yoga's is 0, so inside a
// fixed-height box that its content overflows the label gave up all its
// height on a computer and hung past the edge on a phone. None of the
// static audits could see that, because nothing about the style is wrong
// on a phone. This one asks the running page instead.
//
// It starts the desktop app once per tab (a second, throwaway data folder,
// so the installed app's data is never touched and the two can run side
// by side), opens the tab, and walks every leaf element holding text that
// is visible by its computed style, reporting any whose box is under two
// pixels wide or tall while its parent has a size. With --menus it also
// opens the tab's LensHub and the TabHub, since the popup menus are the
// other fixed-size furniture. It reads desktop/web-build/, so run
// `node desktop/build-web.js` first for the check to see current code.
//
// Usage, from anywhere:
//   node desktop/check-collapsed-text.js [--menus] [--tab Food]
// Exit code 1 when anything is reported, so it can sit beside the other
// audits in a finishing checklist. It must stay at 0.

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TABS = ['Home', 'Food', 'Schedules', 'Signals', 'Insights', 'Trends', 'Reports', 'Garden', 'Life'];

const args = process.argv.slice(2);
const withMenus = args.includes('--menus');
const tabIndex = args.indexOf('--tab');
const tabs = tabIndex >= 0 && args[tabIndex + 1] ? [args[tabIndex + 1]] : TABS;

const webBuild = path.join(__dirname, 'web-build', 'index.html');
if (!fs.existsSync(webBuild)) {
  console.error(`no web export at ${webBuild}; run node desktop/build-web.js first`);
  process.exit(2);
}

// Runs in the page. Leaf elements only (a Text renders as a div or span
// whose children are text nodes), skipping anything display: none or
// visibility: hidden, and anything whose parent has no size either, since
// that is an unmounted or collapsed branch rather than a squashed label.
const PROBE = `(function () {
  var out = [];
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  var node;
  while ((node = walker.nextNode())) {
    if (node.children.length !== 0) continue;
    var text = node.textContent.trim();
    if (!text) continue;
    var style = getComputedStyle(node);
    if (style.visibility !== 'visible' || style.display === 'none') continue;
    var rect = node.getBoundingClientRect();
    var parent = node.parentElement;
    var parentRect = parent.getBoundingClientRect();
    if (parentRect.width === 0 && parentRect.height === 0) continue;
    if (rect.height < 2 || rect.width < 2) {
      out.push({
        text: text.slice(0, 60),
        size: [Math.round(rect.width), Math.round(rect.height)],
        parent: parent.tagName + (parent.getAttribute('aria-label') ? ' "' + parent.getAttribute('aria-label') + '"' : '') + ' ' + Math.round(parentRect.width) + 'x' + Math.round(parentRect.height),
        flexShrink: style.flexShrink,
        overflow: style.overflow,
      });
    }
  }
  return out;
})()`;

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inside-story-check-'));
// The electron package's main export is the path to its executable.
const electron = require('electron');

function runProbe(tab, clicks) {
  const clickCount = clicks.length;
  const clickAfter = 6000;
  const env = {
    ...process.env,
    INSIDE_STORY_LOG: '1',
    INSIDE_STORY_CLICK: clicks.join(','),
    INSIDE_STORY_CLICK_AFTER_MS: String(clickAfter),
    INSIDE_STORY_EVAL: PROBE.replace(/\n/g, ' '),
    // The screenshot is only how the app is told to quit; the file is thrown away.
    INSIDE_STORY_SCREENSHOT: path.join(dataDir, 'frame.png'),
    INSIDE_STORY_SCREENSHOT_AFTER_MS: String(clickAfter + clickCount * 1500 + 3000),
  };
  const result = spawnSync(
    electron,
    ['.', `--user-data-dir=${dataDir}`, '--disable-features=CalculateNativeWinOcclusion'],
    { cwd: __dirname, env, encoding: 'utf8' },
  );
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const line = output.split(/\r?\n/).find((entry) => entry.startsWith('[eval] '));
  if (!line) {
    return { tab, error: `no probe result (${output.split(/\r?\n/).filter((entry) => entry.startsWith('[')).slice(-3).join(' | ') || 'no log'})` };
  }
  try {
    return { tab, findings: JSON.parse(line.slice('[eval] '.length)) };
  } catch (error) {
    return { tab, error: `unreadable probe result: ${error.message}` };
  }
}

let total = 0;
let errors = 0;
for (const tab of tabs) {
  const runs = [{ label: tab, clicks: tab === 'Home' ? [] : [tab] }];
  if (withMenus) {
    runs.push({ label: `${tab} > lens menu`, clicks: tab === 'Home' ? ['Choose a view for Home'] : [tab, `Choose a view for ${tab}`] });
    runs.push({ label: `${tab} > tab menu`, clicks: tab === 'Home' ? ['Open navigation menu'] : [tab, 'Open navigation menu'] });
  }
  for (const run of runs) {
    const result = runProbe(run.label, run.clicks);
    if (result.error) {
      errors += 1;
      console.log(`${run.label}: ${result.error}`);
      continue;
    }
    total += result.findings.length;
    console.log(`${run.label}: ${result.findings.length === 0 ? 'ok' : `${result.findings.length} collapsed`}`);
    for (const finding of result.findings) {
      console.log(`  "${finding.text}" is ${finding.size[0]}x${finding.size[1]} inside ${finding.parent} (flex-shrink ${finding.flexShrink}, overflow ${finding.overflow})`);
    }
  }
}

fs.rmSync(dataDir, { recursive: true, force: true });
console.log(`\n${total} collapsed text element${total === 1 ? '' : 's'}${errors ? `, ${errors} run${errors === 1 ? '' : 's'} without a result` : ''}`);
process.exit(total > 0 || errors > 0 ? 1 : 0);
