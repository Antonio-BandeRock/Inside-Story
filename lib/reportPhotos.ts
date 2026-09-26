// Photos in a report (1.0.53.7). Direct request: photos have "two sizes,
// thumbnails, and reporting size", and a report is where the reporting size
// goes. The doctor report carries the photos taken of symptoms in the range
// and the garden report the photos of plantings, each at the report size
// the photo layer already keeps (lib/media.ts), so nothing is re-shrunk.
//
// Pure, with no imports, so scripts/test_media.js can check it. The files
// are read in lib/reportPhotosDb.ts.

export type ReportPhotoCandidate = {
  id: string;
  fileName: string;
  /** "YYYY-MM-DD" */
  takenOn: string;
  caption: string | null;
};

/** A PDF carrying every photo of a long range would be too large to send,
 *  so a report shows the newest this many and says how many it left out. */
export const REPORT_PHOTO_LIMIT = 12;

/** The photos in the range, newest first, at most `limit` of them. */
export function choosePhotosForReport<T extends ReportPhotoCandidate>(
  items: readonly T[],
  start: string,
  end: string,
  limit = REPORT_PHOTO_LIMIT,
): { chosen: T[]; total: number } {
  const inRange = items
    .filter((item) => item.takenOn >= start && item.takenOn <= end)
    .sort((a, b) => (a.takenOn === b.takenOn ? b.id.localeCompare(a.id) : b.takenOn.localeCompare(a.takenOn)));
  return { chosen: inRange.slice(0, limit), total: inRange.length };
}

/** The line under a photo, "2026-09-20, Tomato: first flowers". */
export function reportPhotoCaption(takenOn: string, subject: string | null, caption: string | null): string {
  const about = [subject?.trim(), caption?.trim()].filter((part): part is string => !!part).join(': ');
  return about ? `${takenOn}, ${about}` : takenOn;
}

/** The note under the heading. Says when some were left out, and when a
 *  photo could not be read (one still on its way from the other device). */
export function reportPhotoNote(shown: number, total: number, unreadable: number): string {
  const parts: string[] = [];
  if (total > shown + unreadable) parts.push(`The newest ${shown} of ${total} photos taken in the range.`);
  else parts.push('Photos taken in the range, newest first.');
  if (unreadable > 0) parts.push(`${unreadable} could not be read on this device and are left out.`);
  return parts.join(' ');
}

/** What the plain-text view says in place of the pictures. */
export function reportPhotoTextLine(count: number): string {
  return count === 1 ? '1 photo, shown in the PDF.' : `${count} photos, shown in the PDF.`;
}
