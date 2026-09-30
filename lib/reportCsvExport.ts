// Writing a report's CSV file and handing it over (K5, 2026-09-29). The
// contents are in lib/reportCsv.ts with nothing here but the file.
//
// A phone offers the file to its share sheet (Drive, email, a file
// manager); a computer opens Save As, the same way the PDF leaves.

import { isDesktopApp } from './desktop/bridge';
import { shareFileIfAvailable } from './nativeSharing';
import type { ReportDocument } from './reportGenerator';
import { reportCsvFileName, reportCsvTables, tableCsv, wholeReportCsv } from './reportCsv';

export type ReportCsvOutcome =
  | { status: 'offered' }
  | { status: 'savedOnly'; uri: string }
  | { status: 'failed'; message: string };

/** `tableKey` null saves the whole report; otherwise the one table. */
export async function exportReportCsv(doc: ReportDocument, tableKey: string | null): Promise<ReportCsvOutcome> {
  try {
    const table = tableKey ? reportCsvTables(doc).find((entry) => entry.key === tableKey) : null;
    if (tableKey && !table) return { status: 'failed', message: 'That table is no longer in the report.' };
    const text = table ? tableCsv(table) : wholeReportCsv(doc);
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.cache, 'report-csv');
    if (!dir.exists) dir.create({ intermediates: true });
    const file = new File(dir, reportCsvFileName(doc, table ? table.key : null));
    if (file.exists) file.delete();
    file.write(text);
    const offered = await shareFileIfAvailable(file.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: table ? `Save ${table.heading} as a spreadsheet` : 'Save the report as a spreadsheet',
    });
    // On a computer a false means Save As was cancelled, which needs no word.
    return offered || isDesktopApp() ? { status: 'offered' } : { status: 'savedOnly', uri: file.uri };
  } catch (error) {
    console.error('[reportCsv] export failed', error);
    return { status: 'failed', message: error instanceof Error ? error.message : String(error) };
  }
}
