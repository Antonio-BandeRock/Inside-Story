// A report as spreadsheet files (K5, 2026-09-29). Every table in a report
// can be saved as a CSV file of its own, for opening in Excel, Google
// Sheets, Numbers or any program that reads CSV, and the whole report can
// be saved as one file with each section under its heading.
//
// One table per file is the clean shape, since a spreadsheet sorts and
// charts one table at a time; the whole-report file is for somebody who
// wants everything in one place and does not mind the headings between
// the blocks. The figures are the ones the report already holds, and
// nothing is worked out here. Photos and charts stay in the PDF; the
// whole-report file says how many photos a section has.
//
// Quoting and the byte order mark come from lib/gardenCsv.ts (RFC 4180).
// Pure, so scripts/test_report_csv.js checks it without a phone; the file
// is written and handed over in lib/reportCsvExport.ts.

import { csvField, toCsv, type CsvCell } from './gardenCsv';
import type { ReportDocument, ReportTableSection } from './reportGenerator';

/** The byte order mark Excel needs to read UTF-8, as lib/gardenCsv.ts writes it. */
const BOM = String.fromCharCode(0xfeff);

export type ReportCsvTable = { key: string; heading: string; columns: string[]; rows: string[][] };

/** A heading as part of a file name: "Doses and marks" to "doses-and-marks". */
export function slugFor(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section';
}

/** The report's tables that hold at least one row, each with a key unique
 *  within the report, in the order they appear. */
export function reportCsvTables(doc: ReportDocument): ReportCsvTable[] {
  const seen = new Map<string, number>();
  return doc.sections
    .filter((section): section is ReportTableSection => section.kind === 'table' && section.rows.length > 0)
    .map((section) => {
      const base = slugFor(section.heading);
      const count = (seen.get(base) ?? 0) + 1;
      seen.set(base, count);
      return {
        key: count === 1 ? base : `${base}-${count}`,
        heading: section.heading,
        columns: section.columns,
        rows: section.rows,
      };
    });
}

export function tableCsv(table: ReportCsvTable): string {
  return toCsv(table.columns, table.rows);
}

/** Everything in the report in one file: a few lines saying what it is,
 *  then each section under its heading, a blank line between. A table
 *  keeps its columns, a list is one column of lines, and a section with
 *  nothing in it carries the sentence the report shows for it. */
export function wholeReportCsv(doc: ReportDocument): string {
  const lines: CsvCell[][] = [[doc.title], [`Covers ${doc.rangeLabel}`], [`Made ${doc.generatedAt.slice(0, 10)}`], [doc.versionLine]];
  for (const line of doc.preface) lines.push([line]);
  for (const section of doc.sections) {
    lines.push([]);
    lines.push([section.heading]);
    if (section.note) lines.push([section.note]);
    if (section.rows.length === 0) {
      lines.push([section.empty]);
    } else if (section.kind === 'table') {
      lines.push(section.columns);
      for (const row of section.rows) lines.push(row);
    } else if (section.kind === 'list') {
      for (const row of section.rows) lines.push([row]);
    } else {
      const count = section.rows.length;
      lines.push([`${count} ${count === 1 ? 'photo' : 'photos'} in the PDF`]);
    }
  }
  lines.push([]);
  lines.push([doc.footer]);
  return `${BOM}${lines.map((row) => row.map(csvField).join(',')).join('\r\n')}\r\n`;
}

/** "lifestead-doctor-report-2026-09-29-30d", the same stamp the PDF
 *  carries, so the files from one report sort together. */
export function reportCsvStamp(doc: ReportDocument): string {
  return `lifestead-${slugFor(doc.title)}-${doc.generatedAt.slice(0, 10)}-${doc.days}d`;
}

export function reportCsvFileName(doc: ReportDocument, tableKey: string | null): string {
  return `${reportCsvStamp(doc)}${tableKey ? `-${tableKey}` : ''}.csv`;
}

export const REPORT_CSV_CAPTION =
  'A single table saved on its own opens in Excel, Google Sheets, Numbers or any program that reads CSV, ready to sort or chart. The whole report puts every section in one file under its heading.';

export const REPORT_CSV_NO_TABLES = 'This report has no table with anything in it over this range, so only the whole report can be saved.';
