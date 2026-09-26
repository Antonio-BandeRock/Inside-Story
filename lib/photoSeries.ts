// Photo Series (2026-09-26, 1.0.53.7). Direct request: "a gardner might want
// to take a daily picture of the same plant from the same spot to document
// how it grew, which can then be made into a gif image should the daily pics
// as a timelapsed photography video."
//
// A series is a row in photo_series naming what it is of (an owner kind and
// id, the same pair lib/media.ts files a photo under), and its frames are
// simply that owner's photos from the day the series started to the day it
// ended. Nothing is copied: a photo in a series is the same photo the strip
// shows, so removing one removes it from both.
//
// A day with no photo is a gap and is said as one, in words, and is never
// filled with the photo either side of it, since a timelapse that repeats a
// frame is claiming the plant did not change that day. The flipbook and the
// GIF play the frames there are, and the line under them says how many days
// they cover and how many had none.
//
// Pure, no imports at run time, so scripts/test_photo_series.js checks every
// rule and sentence without a phone. Reading and writing is
// lib/photoSeriesDb.ts; the GIF is lib/photoGif.ts.

export type PhotoSeries = {
  id: string;
  ownerKind: string;
  ownerId: string;
  title: string;
  /** Whether a reminder arrives each day at `reminderTime`. On when a
   *  series starts, since a daily photo is the whole point of one. */
  reminderOn: boolean;
  /** 'HH:mm', local. */
  reminderTime: string;
  /** Local day, 'YYYY-MM-DD'. */
  startedOn: string;
  /** Local day it ended, or null while it runs. */
  endedOn: string | null;
  createdAt: string;
};

export type SeriesPhoto = { id: string; takenOn: string; createdAt: string };

/** Morning light is the most even, and it is the time most people are
 *  already out with the plants. The person can change it. */
export const DEFAULT_SERIES_REMINDER_TIME = '08:00';

export function isReminderTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function dayNumber(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

function dayFromNumber(n: number): string {
  const date = new Date(n * 86_400_000);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

/**
 * The frames of a series, oldest first, one per day. When a day has more
 * than one photo the first taken that day is the frame, since a second
 * photo that day is usually a closer look rather than the view from the
 * spot. `today` closes a running series.
 */
export function seriesFrames<T extends SeriesPhoto>(series: Pick<PhotoSeries, 'startedOn' | 'endedOn'>, photos: readonly T[], today: string): T[] {
  const last = series.endedOn ?? today;
  const byDay = new Map<string, T>();
  const sorted = [...photos].sort((a, b) => (a.takenOn === b.takenOn ? a.createdAt.localeCompare(b.createdAt) : a.takenOn < b.takenOn ? -1 : 1));
  for (const photo of sorted) {
    if (photo.takenOn < series.startedOn || photo.takenOn > last) continue;
    if (!byDay.has(photo.takenOn)) byDay.set(photo.takenOn, photo);
  }
  return [...byDay.values()];
}

/** Days inside the series with no photo, oldest first. Today is not a gap
 *  while it is still today, since the photo may yet be taken. */
export function seriesGaps(series: Pick<PhotoSeries, 'startedOn' | 'endedOn'>, frameDays: readonly string[], today: string): string[] {
  const running = series.endedOn === null;
  const lastDay = series.endedOn ?? today;
  const end = dayNumber(lastDay) - (running ? 1 : 0);
  const have = new Set(frameDays);
  const gaps: string[] = [];
  for (let n = dayNumber(series.startedOn); n <= end; n += 1) {
    const day = dayFromNumber(n);
    if (!have.has(day)) gaps.push(day);
  }
  return gaps;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** Days from the first day to the last, both counted. */
export function daysCovered(firstDay: string, lastDay: string): number {
  return dayNumber(lastDay) - dayNumber(firstDay) + 1;
}

/**
 * What the series holds, in words. Counts only; nothing here says the
 * person kept it up well or badly.
 */
export function seriesSummary(series: Pick<PhotoSeries, 'startedOn' | 'endedOn'>, frameDays: readonly string[], today: string): string {
  if (frameDays.length === 0) {
    return series.endedOn ? 'This series ended with no photos in it.' : 'No photos in this series yet. The first one sets the view the rest line up with.';
  }
  const gaps = seriesGaps(series, frameDays, today);
  const span = daysCovered(series.startedOn, series.endedOn ?? today);
  const parts = [`${plural(frameDays.length, 'photo', 'photos')} across ${plural(span, 'day', 'days')}.`];
  if (gaps.length > 0) {
    parts.push(`${plural(gaps.length, 'day has', 'days have')} no photo, and the playback moves straight past ${gaps.length === 1 ? 'it' : 'them'} rather than repeating a frame.`);
  }
  if (series.endedOn === null && !frameDays.includes(today)) parts.push('No photo yet today.');
  return parts.join(' ');
}

/** Whether today's frame is in, which is what quiets today's reminder. */
export function hasPhotoToday(frameDays: readonly string[], today: string): boolean {
  return frameDays.includes(today);
}

// Playback ------------------------------------------------------------------

export type FlipbookSpeed = { key: 'slow' | 'steady' | 'quick'; label: string; fps: number };

export const FLIPBOOK_SPEEDS: FlipbookSpeed[] = [
  { key: 'slow', label: 'Slow', fps: 2 },
  { key: 'steady', label: 'Steady', fps: 4 },
  { key: 'quick', label: 'Quick', fps: 8 },
];

export function frameDelayMs(fps: number): number {
  return Math.round(1000 / Math.max(1, fps));
}

/** The longest edge of a GIF frame. A GIF has 256 colours a frame and no
 *  compression between frames, so past this size it grows faster than it
 *  gains anything to look at. */
export const GIF_MAX_DIMENSION = 480;

/** The most frames one GIF takes. A longer series is thinned evenly, first
 *  and last always kept, so the whole span still plays. */
export const GIF_MAX_FRAMES = 120;

/** A frame size inside GIF_MAX_DIMENSION keeping the photo's shape, with
 *  even sides, which every encoder and viewer handles the same way. */
export function gifFrameSize(width: number, height: number, max = GIF_MAX_DIMENSION): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) return { width: max, height: max };
  const scale = Math.min(1, max / Math.max(width, height));
  const even = (n: number) => Math.max(2, Math.round((n * scale) / 2) * 2);
  return { width: even(width), height: even(height) };
}

/** Which frames go into a GIF: all of them up to the limit, otherwise an
 *  even spread keeping the first and last. */
export function pickGifFrames<T>(frames: readonly T[], limit = GIF_MAX_FRAMES): T[] {
  if (frames.length <= limit) return [...frames];
  if (limit <= 1) return frames.slice(0, 1);
  const out: T[] = [];
  const step = (frames.length - 1) / (limit - 1);
  let last = -1;
  for (let i = 0; i < limit; i += 1) {
    const index = Math.round(i * step);
    if (index !== last) out.push(frames[index]);
    last = index;
  }
  return out;
}

/** The line under a finished GIF. */
export function gifMadeSentence(frameCount: number, totalFrames: number): string {
  if (frameCount === totalFrames) return `Made from all ${plural(frameCount, 'photo', 'photos')}, and kept with this series.`;
  return `Made from ${frameCount} of the ${totalFrames} photos, spread evenly from first to last, and kept with this series.`;
}

// Reminder ------------------------------------------------------------------

export function seriesReminderTitle(title: string): string {
  return `Photo for ${title}`;
}

export function seriesReminderBody(frameCount: number): string {
  const lead = frameCount === 0 ? 'The first photo of the series.' : `Day ${frameCount + 1} of the series.`;
  return `${lead} Tap to open the camera with the last photo faintly over it, so this one lines up.`;
}

/** The line in the band saying when the reminder comes. */
export function seriesReminderLine(series: Pick<PhotoSeries, 'reminderOn' | 'reminderTime' | 'endedOn'>, timeLabel: string): string {
  if (series.endedOn) return 'This series has ended, so no reminder comes.';
  if (!series.reminderOn) return 'No daily reminder. Switch it on to be asked each day.';
  return `A reminder each day at ${timeLabel}, skipped on a day the photo is already in.`;
}

export const SERIES_START_LINE =
  'A photo a day from the same spot, played back as a flipbook or made into a GIF. The camera shows the last photo faintly over the view so each one lines up.';
