// Photos of a symptom over time (D12 in the competitive build plan,
// 2026-09-30). A photo is already kept on the entry it was taken with
// (RecordPhotos, owner kind "symptom", since 1.0.53.7); this lines every one
// of them up by the day it was taken, oldest first, so a rash or a swelling
// can be looked at across weeks in one place. Signals > Flares and Signals >
// Food Reactions draw it through components/SymptomPhotosOverTime.tsx.
//
// HOW IT BEHAVES
//
//   - It shows what was photographed and nothing more. Two photos are never
//     compared, and nothing here says a photo looks better, worse or the
//     same as another one.
//   - A day with no photo is simply not drawn. The sentence over the list
//     says how many days had photos out of the stretch they cover, so the
//     gaps are named rather than closed up.
//   - Photos stay where every symptom photo stays: on this device and in the
//     person's backup. The media table is on no list of what travels
//     between people (lib/peerRelationships.ts), which
//     scripts/test_symptom_photos.js checks.
//
// No I/O and no React. Words for symptoms, areas and severity are handed in,
// so the module imports nothing and the test can run it directly.

export type SymptomPhoto = {
  id: string;
  /** The entry it was taken with. */
  ownerId: string;
  /** Local day, "YYYY-MM-DD". */
  takenOn: string;
  createdAt: string;
  fileName: string;
};

export type PhotoEntry = {
  id: string;
  loggedAt: string;
  checkinType: string;
  severity: number | null;
  severityTen: number | null;
  foodName: string | null;
  tags: string[];
  bodyRegions: string[];
};

export type Words = {
  tag: (code: string) => string;
  region: (key: string) => string;
  severity: (step: number | null, ten: number | null) => string | null;
};

/** What the list is narrowed to: every photo, one symptom, or one area. */
export type PhotoFilter = { kind: 'all' } | { kind: 'tag'; key: string } | { kind: 'region'; key: string };

export const ALL_PHOTOS: PhotoFilter = { kind: 'all' };

export type TimelinePhoto<P extends SymptomPhoto = SymptomPhoto> = { photo: P; entry: PhotoEntry | null };
export type TimelineDay<P extends SymptomPhoto = SymptomPhoto> = { day: string; label: string; photos: TimelinePhoto<P>[] };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dayLabel(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  if (!year || !month || !date) return 'Date not known';
  return `${MONTHS[month - 1]} ${date}, ${year}`;
}

function wholeDaysBetween(first: string, last: string): number {
  const [y1, m1, d1] = first.split('-').map(Number);
  const [y2, m2, d2] = last.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

function matches(entry: PhotoEntry | null, filter: PhotoFilter): boolean {
  if (filter.kind === 'all') return true;
  if (!entry) return false;
  return filter.kind === 'tag' ? entry.tags.includes(filter.key) : entry.bodyRegions.includes(filter.key);
}

/** Oldest first, and within a day the order the photos were added. */
export function orderedPhotos<P extends SymptomPhoto>(photos: readonly P[]): P[] {
  return [...photos].sort((a, b) =>
    a.takenOn !== b.takenOn ? (a.takenOn < b.takenOn ? -1 : 1) : a.createdAt.localeCompare(b.createdAt),
  );
}

/** The photos that pass the filter, each with its entry, oldest first. */
export function photoSequence<P extends SymptomPhoto>(
  photos: readonly P[],
  entries: readonly PhotoEntry[],
  filter: PhotoFilter,
): TimelinePhoto<P>[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return orderedPhotos(photos)
    .map((photo) => ({ photo, entry: byId.get(photo.ownerId) ?? null }))
    .filter((item) => matches(item.entry, filter));
}

/** The same sequence grouped by the day each photo was taken. */
export function photoTimeline<P extends SymptomPhoto>(
  photos: readonly P[],
  entries: readonly PhotoEntry[],
  filter: PhotoFilter,
): TimelineDay<P>[] {
  const days: TimelineDay<P>[] = [];
  for (const item of photoSequence(photos, entries, filter)) {
    const last = days[days.length - 1];
    if (last && last.day === item.photo.takenOn) last.photos.push(item);
    else days.push({ day: item.photo.takenOn, label: dayLabel(item.photo.takenOn), photos: [item] });
  }
  return days;
}

/**
 * The symptoms and areas the photographed entries carry, each with how many
 * photos it would show, for the picker over the list. Only what has a photo
 * is offered, so no choice leads to an empty list.
 */
export function filterChoices(
  photos: readonly SymptomPhoto[],
  entries: readonly PhotoEntry[],
  words: Pick<Words, 'tag' | 'region'>,
): { label: string; value: string; filter: PhotoFilter }[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const tagCounts = new Map<string, number>();
  const regionCounts = new Map<string, number>();
  for (const photo of photos) {
    const entry = byId.get(photo.ownerId);
    if (!entry) continue;
    for (const tag of new Set(entry.tags)) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    for (const region of new Set(entry.bodyRegions)) regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
  }
  const count = (n: number) => (n === 1 ? '1 photo' : `${n} photos`);
  const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label);
  const tags = [...tagCounts.entries()]
    .map(([key, n]) => ({ label: `${words.tag(key)} (${count(n)})`, value: `tag:${key}`, filter: { kind: 'tag', key } as PhotoFilter }))
    .sort(byLabel);
  const regions = [...regionCounts.entries()]
    .map(([key, n]) => ({
      label: `${words.region(key)} (${count(n)})`,
      value: `region:${key}`,
      filter: { kind: 'region', key } as PhotoFilter,
    }))
    .sort(byLabel);
  return [{ label: `Every photo (${count(photos.length)})`, value: 'all', filter: ALL_PHOTOS }, ...tags, ...regions];
}

export function filterValue(filter: PhotoFilter): string {
  return filter.kind === 'all' ? 'all' : `${filter.kind}:${filter.key}`;
}

const KIND_WORDS: Record<string, string> = {
  flare: 'Flare',
  post_meal: 'Food reaction',
  food_trial_daily: 'Food trial day',
  post_exercise: 'After exercise',
  general: 'Note',
  stress: 'Stress',
  sleep: 'Sleep',
};

/** "Flare, Moderate · Rash, Itching · Left forearm", from the entry as logged. */
export function entryCaption(entry: PhotoEntry | null, words: Words): string {
  if (!entry) return 'Its entry could not be found.';
  const head = [KIND_WORDS[entry.checkinType] ?? 'Entry', words.severity(entry.severity, entry.severityTen)]
    .filter(Boolean)
    .join(', ');
  const parts = [entry.foodName ? `${head}, after ${entry.foodName}` : head];
  if (entry.tags.length > 0) parts.push(entry.tags.map(words.tag).join(', '));
  if (entry.bodyRegions.length > 0) parts.push(entry.bodyRegions.map(words.region).join(', '));
  return parts.join(' · ');
}

/**
 * "7 photos on 4 days, from Sep 3, 2026 to Sep 28, 2026. No photo on the
 * other 22 days in that stretch."
 */
export function timelineSentence(days: readonly TimelineDay[]): string {
  if (days.length === 0) return 'No photos for this choice.';
  const photos = days.reduce((sum, day) => sum + day.photos.length, 0);
  const photoWords = photos === 1 ? 'One photo' : `${photos} photos`;
  if (days.length === 1) return `${photoWords} on ${days[0].label}.`;
  const first = days[0].day;
  const last = days[days.length - 1].day;
  const span = wholeDaysBetween(first, last) + 1;
  const without = span - days.length;
  const tail =
    without === 0
      ? ''
      : without === 1
        ? ' No photo on the other day in that stretch.'
        : ` No photo on the other ${without} days in that stretch.`;
  return `${photoWords} on ${days.length} days, from ${dayLabel(first)} to ${dayLabel(last)}.${tail}`;
}

/** "Photo 3 of 7, taken Sep 12, 2026", for the photo opened large. */
export function positionLine(index: number, total: number, takenOn: string): string {
  return `Photo ${index + 1} of ${total}, taken ${dayLabel(takenOn)}`;
}

export const SYMPTOM_PHOTOS_EMPTY =
  'No symptom photos yet. A photo added to a flare or a food reaction shows here, lined up by the day it was taken.';

export const SYMPTOM_PHOTOS_PRIVATE =
  'These photos stay on this device and in your backup. They are never sent to anybody you link with.';
