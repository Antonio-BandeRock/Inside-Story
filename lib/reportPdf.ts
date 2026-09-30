// Report to PDF, on the phone (2026-09-14). expo-print renders the HTML
// from lib/reportHtml.ts into a PDF file in the app's cache, the file is
// given a readable name, and expo-sharing hands it to the OS share sheet.
// Nothing is uploaded anywhere; the share sheet is the person choosing
// where it goes, the same boundary as the text share and the backup
// export.
//
// expo-print and expo-sharing are compiled into the 2026-09-14 build, so
// this is JS only. Both modules are imported lazily, the way
// lib/dataBackup.ts imports expo-file-system, so a build without them
// (the web target) fails at the call rather than at startup.

import { getDesktopBridge, isDesktopApp } from './desktop/bridge';
import { shareFileIfAvailable } from './nativeSharing';
import { renderReportHtml } from './reportHtml';
import type { ReportDocument } from './reportGenerator';

export type ReportPrintResult =
  | { status: 'printed' }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

// Printing from the Reports tab (K11, 2026-09-29): the same laid-out page
// as the PDF, sent to the system print dialog with no share step. On a
// phone that is expo-print's printAsync, whose dialog also offers Save as
// PDF; on a computer it is a hidden window in desktop/print.js, because
// expo-print on the web target prints the app window itself. A phone
// cannot tell a finished print from a closed dialog, so there it answers
// printed once the dialog closes without an error.
export async function printReport(doc: ReportDocument): Promise<ReportPrintResult> {
  return printHtml(renderReportHtml(doc));
}

export async function printHtml(html: string): Promise<ReportPrintResult> {
  try {
    if (isDesktopApp()) {
      const print = getDesktopBridge().print;
      if (!print) return { status: 'failed', message: OLD_INSTALLER };
      return { status: await print.html(html) };
    }
    const Print = await import('expo-print');
    await Print.printAsync({ html });
    return { status: 'printed' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // iOS rejects a dismissed print sheet; that is a choice, not a fault.
    if (/cancel|dismiss/i.test(message)) return { status: 'cancelled' };
    console.error('[reportPdf] Printing failed', error);
    return { status: 'failed', message: 'The printer or the print dialog could not be reached from this device.' };
  }
}

const OLD_INSTALLER = 'This version of the desktop app was installed before printing and PDFs worked on a computer. Install the newest version and try again.';

export type ReportPdfResult =
  | { status: 'shared'; uri: string }
  | { status: 'savedOnly'; uri: string }
  /** A computer's Save As dialog closed without a place chosen. */
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

function fileStamp(doc: ReportDocument): string {
  // "inside-story-report-2026-09-14-30d.pdf": the day it was generated
  // and the window, so two exports of the same range on different days
  // do not overwrite each other in someone's Downloads.
  return `inside-story-report-${doc.generatedAt.slice(0, 10)}-${doc.days}d`;
}

export async function exportReportAsPdf(doc: ReportDocument): Promise<ReportPdfResult> {
  return exportHtmlAsPdf(renderReportHtml(doc), fileStamp(doc), 'Share report');
}

/** Any page of HTML to a PDF under a readable name, handed to the share
 *  sheet. The report uses it, and so does the emergency wallet card (A18). */
export async function exportHtmlAsPdf(html: string, fileBase: string, dialogTitle: string): Promise<ReportPdfResult> {
  let uri: string;
  // On a computer expo-print makes no file (its web version only calls
  // window.print() on the app window), so the page is laid out in a
  // hidden window of its own and saved under its name directly (K11).
  if (isDesktopApp()) {
    const print = getDesktopBridge().print;
    if (!print) return { status: 'failed', message: OLD_INSTALLER };
    try {
      uri = await print.toPdf(html, fileBase);
    } catch (error) {
      console.error('[reportPdf] Failed to lay the page out as a PDF on the desktop', error);
      return { status: 'failed', message: 'The PDF could not be put together on this computer.' };
    }
    const saved = await shareFileIfAvailable(uri, { mimeType: 'application/pdf', dialogTitle });
    return saved ? { status: 'shared', uri } : { status: 'cancelled' };
  }
  try {
    const Print = await import('expo-print');
    const printed = await Print.printToFileAsync({ html, base64: false });
    uri = printed.uri;
  } catch (error) {
    console.error('[reportPdf] Failed to render the page to a PDF', error);
    return { status: 'failed', message: 'The PDF could not be put together on this device.' };
  }

  // expo-print names the file with a random id. Move it under a readable
  // name so what lands in the share sheet, and in whatever folder the
  // person picks, says what it is.
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.cache, 'reports');
    if (!dir.exists) dir.create({ intermediates: true });
    const target = new File(dir, `${fileBase}.pdf`);
    if (target.exists) target.delete();
    new File(uri).move(target);
    uri = target.uri;
  } catch (error) {
    // A rename that fails leaves the printed file where it was, still
    // shareable under its random name. Worth logging, not worth stopping.
    console.warn('[reportPdf] Could not rename the PDF; sharing it as printed', error);
  }

  const shared = await shareFileIfAvailable(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle,
  });
  return shared ? { status: 'shared', uri } : { status: 'savedOnly', uri };
}
