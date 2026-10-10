// Printing and PDFs on a computer (K11, 2026-09-29).
//
// On the phone expo-print does both: printAsync opens the system print
// dialog, printToFileAsync lays a page of HTML out as a PDF file. On the
// web target, which is what the desktop app runs, expo-print only calls
// window.print() on the app window itself and hands back no file, so Share
// as PDF on a computer said "PDF not made" from the day it shipped.
//
// Both are done here instead, in a hidden window that loads only the page
// being printed: the HTML is written to a file in the Cache folder first
// (a data: URL has a length limit a long report can pass), the window
// runs no script, and it is closed when the job is done.

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { BrowserWindow } = require('electron');

function safeBase(fileBase) {
  const cleaned = String(fileBase || 'lifestead').replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 120);
  return cleaned || 'lifestead';
}

async function withPage(cacheFolder, html, work) {
  const folder = path.join(cacheFolder, 'reports');
  fs.mkdirSync(folder, { recursive: true });
  const pageFile = path.join(folder, `print-${Date.now()}.html`);
  fs.writeFileSync(pageFile, String(html), 'utf8');
  const win = new BrowserWindow({
    show: false,
    webPreferences: { javascript: false, sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  try {
    await win.loadFile(pageFile);
    return await work(win, folder);
  } finally {
    if (!win.isDestroyed()) win.destroy();
    fs.rm(pageFile, { force: true }, () => {});
  }
}

// The page laid out as a PDF in Cache/reports under the name given.
// Answers the file:// URI, which files.saveAs then copies wherever the
// person chooses.
function htmlToPdf(cacheFolder, html, fileBase) {
  return withPage(cacheFolder, html, async (win, folder) => {
    const data = await win.webContents.printToPDF({ printBackground: true });
    const target = path.join(folder, `${safeBase(fileBase)}.pdf`);
    fs.writeFileSync(target, data);
    return pathToFileURL(target).href;
  });
}

// The system print dialog for the page. Answers 'printed', 'cancelled',
// or throws with the reason the printer gave.
function printHtml(cacheFolder, html) {
  return withPage(
    cacheFolder,
    html,
    (win) =>
      new Promise((resolve, reject) => {
        win.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
          if (success) resolve('printed');
          else if (!failureReason || /cancel/i.test(failureReason)) resolve('cancelled');
          else reject(new Error(failureReason));
        });
      }),
  );
}

module.exports = { htmlToPdf, printHtml };
