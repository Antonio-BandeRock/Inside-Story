// The laid-out view of a report (2026-09-14): the HTML that expo-print
// renders to a PDF on the phone. Same ReportDocument as the plain-text
// view in lib/reportGenerator.ts, so the two can never say different
// things; this file only decides how it looks on a page.
//
// Kept to what a WebView prints reliably: one system font stack, tables
// with plain borders, no web fonts, no scripts. The one kind of image is a
// photo section (1.0.53.7), each photo embedded as a data address at the
// report size, two to a row, never split across a page. Page breaks
// are discouraged inside a table row and after a heading so a section
// title never ends up alone at the foot of a page. Letter size is
// expo-print's default and is left alone; the layout is fluid enough for
// A4 too.

import type { ReportDocument, ReportSection } from './reportGenerator';

const INK = '#1f2a2e';
const MUTED = '#5c6a70';
const RULE = '#244147';
const LINE = '#d5dcdf';
const ZEBRA = '#f3f6f7';
const CALLOUT = '#fbf6ea';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 36px 40px 44px;
    font-family: -apple-system, "Helvetica Neue", Roboto, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: ${INK};
    background: #ffffff;
  }
  header { border-bottom: 3px solid ${RULE}; padding-bottom: 10px; margin-bottom: 14px; }
  h1 { font-size: 20pt; font-weight: 600; margin: 0 0 4px; color: ${RULE}; }
  .meta { font-size: 10pt; color: ${MUTED}; margin: 0; }
  .preface { margin: 0 0 18px; font-size: 10.5pt; color: ${MUTED}; }
  .preface p { margin: 0 0 4px; }
  section { margin: 0 0 18px; page-break-inside: auto; }
  h2 {
    font-size: 12.5pt;
    font-weight: 600;
    margin: 0 0 4px;
    padding-bottom: 3px;
    border-bottom: 1px solid ${LINE};
    color: ${RULE};
    page-break-after: avoid;
  }
  .note { margin: 0 0 6px; font-size: 9.5pt; color: ${MUTED}; }
  .empty { margin: 0; font-size: 10.5pt; color: ${MUTED}; font-style: italic; }
  ul { margin: 0; padding-left: 18px; }
  li { margin: 0 0 2px; page-break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  th, td { text-align: left; vertical-align: top; padding: 4px 8px; border-bottom: 1px solid ${LINE}; }
  th { font-weight: 600; color: ${MUTED}; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.03em; }
  tr { page-break-inside: avoid; }
  tbody tr:nth-child(even) td { background: ${ZEBRA}; }
  section.callout { background: ${CALLOUT}; border: 1px solid #e6d9b8; border-radius: 6px; padding: 10px 12px; }
  section.callout h2 { border-bottom-color: #e6d9b8; }
  section.callout .tag {
    display: inline-block;
    font-size: 8.5pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #7a5b12;
    margin-bottom: 4px;
  }
  .photos { display: flex; flex-wrap: wrap; gap: 10px; }
  figure { margin: 0; width: calc(50% - 5px); page-break-inside: avoid; }
  figure img { width: 100%; max-height: 300px; object-fit: contain; border: 1px solid ${LINE}; border-radius: 4px; background: ${ZEBRA}; }
  figcaption { font-size: 9pt; color: ${MUTED}; margin-top: 2px; }
  footer { margin-top: 22px; padding-top: 8px; border-top: 1px solid ${LINE}; font-size: 9pt; color: ${MUTED}; }
`;

// The section whose contents must be read as self-reported gets a
// visibly different treatment, not just different words: the standing
// evidence rule says a personal hypothesis is never presented as verified
// fact, and on a page handed to a clinician the framing has to survive a
// skim.
function isSelfReportedSection(section: ReportSection): boolean {
  return section.heading === 'Personal notes and rules';
}

function renderSection(section: ReportSection): string {
  const callout = isSelfReportedSection(section);
  const parts: string[] = [];
  parts.push(`<section${callout ? ' class="callout"' : ''}>`);
  if (callout) parts.push('<div class="tag">Self-reported, not verified</div>');
  parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
  if (section.note) parts.push(`<p class="note">${escapeHtml(section.note)}</p>`);
  if (section.rows.length === 0) {
    parts.push(`<p class="empty">${escapeHtml(section.empty)}</p>`);
  } else if (section.kind === 'photos') {
    parts.push('<div class="photos">');
    for (const photo of section.rows) {
      parts.push(`<figure><img src="${escapeHtml(photo.dataUri)}" alt=""><figcaption>${escapeHtml(photo.caption)}</figcaption></figure>`);
    }
    parts.push('</div>');
  } else if (section.kind === 'list') {
    parts.push('<ul>');
    for (const row of section.rows) parts.push(`<li>${escapeHtml(row)}</li>`);
    parts.push('</ul>');
  } else {
    parts.push('<table><thead><tr>');
    for (const column of section.columns) parts.push(`<th>${escapeHtml(column)}</th>`);
    parts.push('</tr></thead><tbody>');
    for (const cells of section.rows) {
      parts.push('<tr>');
      for (const cell of cells) parts.push(`<td>${escapeHtml(cell)}</td>`);
      parts.push('</tr>');
    }
    parts.push('</tbody></table>');
  }
  parts.push('</section>');
  return parts.join('');
}

export function renderReportHtml(doc: ReportDocument): string {
  const generated = new Date(doc.generatedAt).toLocaleString();
  const body: string[] = [];
  body.push('<header>');
  body.push(`<h1>${escapeHtml(doc.title)}</h1>`);
  body.push(`<p class="meta">${escapeHtml(doc.rangeLabel)} (last ${doc.days} days). Generated ${escapeHtml(generated)}.</p>`);
  body.push('</header>');
  body.push('<div class="preface">');
  for (const paragraph of doc.preface) body.push(`<p>${escapeHtml(paragraph)}</p>`);
  body.push('</div>');
  for (const section of doc.sections) body.push(renderSection(section));
  body.push(`<footer>${escapeHtml(doc.footer)}<br>${escapeHtml(doc.versionLine)}</footer>`);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(doc.title)}</title><style>${CSS}</style></head><body>${body.join('')}</body></html>`;
}
