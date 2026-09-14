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

import { shareFileIfAvailable } from './nativeSharing';
import { renderReportHtml } from './reportHtml';
import type { ReportDocument } from './reportGenerator';

export type ReportPdfResult =
  | { status: 'shared'; uri: string }
  | { status: 'savedOnly'; uri: string }
  | { status: 'failed'; message: string };

function fileStamp(doc: ReportDocument): string {
  // "inside-story-report-2026-09-14-30d.pdf": the day it was generated
  // and the window, so two exports of the same range on different days
  // do not overwrite each other in someone's Downloads.
  return `inside-story-report-${doc.generatedAt.slice(0, 10)}-${doc.days}d`;
}

export async function exportReportAsPdf(doc: ReportDocument): Promise<ReportPdfResult> {
  let uri: string;
  try {
    const Print = await import('expo-print');
    const printed = await Print.printToFileAsync({ html: renderReportHtml(doc), base64: false });
    uri = printed.uri;
  } catch (error) {
    console.error('[reportPdf] Failed to render the report to a PDF', error);
    return { status: 'failed', message: 'The PDF could not be put together on this phone.' };
  }

  // expo-print names the file with a random id. Move it under a readable
  // name so what lands in the share sheet, and in whatever folder the
  // person picks, says what it is.
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.cache, 'reports');
    if (!dir.exists) dir.create({ intermediates: true });
    const target = new File(dir, `${fileStamp(doc)}.pdf`);
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
    dialogTitle: 'Share report',
  });
  return shared ? { status: 'shared', uri } : { status: 'savedOnly', uri };
}
