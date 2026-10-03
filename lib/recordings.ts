// Recordings (D15 follow-up, 2026-09-30, 1.0.57.23): audio somebody brings
// in for Signals > Calm, such as a relaxation track, a guided session a
// therapist made for them, or the sound of rain. Every rule and sentence is
// here, with no imports, so scripts/test_recordings.js can check it without
// a phone; lib/recordingsDb.ts reads and writes.
//
// WHERE A RECORDING LIVES. In the Recordings folder under the shared
// folder, beside Photos, Mailbox and Backups, by direct instruction: "keep
// each file type grouped accordingly." A device keeps a copy only while it
// sits in the cache of files opened lately (lib/media.ts), so a long
// recording never takes room on a device that has not played it lately.
// Until a shared folder is set up, a recording stays on the device it was
// brought into and is never cleared from it.
//
// NOT ENCRYPTED, unlike a photo. A relaxation track is not a health record,
// and a plain file can be played from the folder by any player, which is
// half the reason for keeping it there. The name somebody gives it lives
// only in the row; the file in the folder is named by a random id.
//
// PLAYING. The computer plays a recording in the app, from the folder on
// its disk. The phone plays it in the app too since R1 (lib/phoneAudio.ts),
// from its cache, fetching it from the folder first when the cache had
// cleared it.

export type Recording = {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

/** The kinds of audio file brought in, by extension. */
export const RECORDING_TYPES: Readonly<Record<string, string>> = {
  aac: 'audio/aac',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  wav: 'audio/wav',
  webm: 'audio/webm',
};

/** The largest recording brought in: a little over three hours of an
 *  ordinary MP3. Past that the copy into the folder takes long enough on a
 *  phone that leaving the screen would cut it short. */
export const RECORDING_MAX_BYTES = 200 * 1024 * 1024;

export const RECORDING_NAME_MAX = 80;

const FILE_PREFIX = 'rec_';

export function newRecordingId(now: number, random: string): string {
  return `${FILE_PREFIX}${now}_${random.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;
}

/** The extension of a picked file, lower case, or null when it has none. */
export function extensionOf(fileName: string): string | null {
  const match = /\.([a-zA-Z0-9]{1,5})$/.exec(fileName.trim());
  return match ? match[1].toLowerCase() : null;
}

export function isRecordingExtension(ext: string | null): boolean {
  return ext !== null && Object.prototype.hasOwnProperty.call(RECORDING_TYPES, ext);
}

/** The extension for a picked file whose name carries none, as a file
 *  handed over by another app on a phone can. */
export function extensionForMime(mimeType: string | null | undefined): string | null {
  const type = (mimeType ?? '').toLowerCase().split(';')[0].trim();
  if (type === 'audio/mpeg' || type === 'audio/mp3') return 'mp3';
  if (type === 'audio/mp4' || type === 'audio/x-m4a' || type === 'audio/m4a') return 'm4a';
  if (type === 'audio/x-wav' || type === 'audio/wave') return 'wav';
  if (type === 'audio/opus') return 'opus';
  const found = Object.keys(RECORDING_TYPES).find((ext) => RECORDING_TYPES[ext] === type);
  return found ?? null;
}

export function recordingMimeType(ext: string): string {
  return RECORDING_TYPES[ext] ?? 'application/octet-stream';
}

/** The file's name, in the folder and in the cache here. */
export function recordingFileName(id: string, ext: string): string {
  return `${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
}

/** Whether a file in the Recordings folder is one this app put there. A
 *  file somebody dropped in by hand is left alone. */
export function isRecordingFileName(name: string): boolean {
  return /^rec_[a-zA-Z0-9_-]+\.[a-z0-9]{1,5}$/.test(name) && isRecordingExtension(extensionOf(name));
}

/** The name a picked file starts with: its own, without the extension or
 *  the underscores and dashes file names use in place of spaces. */
export function nameFromPicked(fileName: string): string {
  const base = fileName.trim().replace(/\.[a-zA-Z0-9]{1,5}$/, '');
  const spaced = base.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const name = spaced.length > 0 ? spaced : 'Recording';
  return name.slice(0, RECORDING_NAME_MAX);
}

/** What is wrong with a name, or null. Two recordings may not share one,
 *  since the list is the only way to tell them apart. */
export function recordingNameProblem(name: string, otherNames: readonly string[]): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'A recording needs a name.';
  if (trimmed.length > RECORDING_NAME_MAX) return `Keep the name to ${RECORDING_NAME_MAX} characters.`;
  const lower = trimmed.toLowerCase();
  if (otherNames.some((other) => other.trim().toLowerCase() === lower)) return 'Another recording already has that name.';
  return null;
}

/** A name not yet used, adding a number when needed. */
export function unusedRecordingName(name: string, otherNames: readonly string[]): string {
  const taken = new Set(otherNames.map((other) => other.trim().toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${name.slice(0, RECORDING_NAME_MAX - 4)} ${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return name;
}

/** What stops a picked file from being brought in, or null. */
export function pickedFileProblem(fileName: string, sizeBytes: number | null): string | null {
  const ext = extensionOf(fileName);
  if (!isRecordingExtension(ext)) {
    return 'That file is not a kind of audio this app plays. MP3, M4A, AAC, WAV, OGG, Opus, FLAC and WebM all work.';
  }
  if (sizeBytes !== null && sizeBytes > RECORDING_MAX_BYTES) {
    return `That file is larger than ${Math.round(RECORDING_MAX_BYTES / (1024 * 1024))} MB, the most one recording can be.`;
  }
  if (sizeBytes === 0) return 'That file is empty.';
  return null;
}

/** The list in the band reads alphabetically, by name. */
export function sortRecordings(items: readonly Recording[]): Recording[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id));
}

export type RecordingSyncPlan = {
  /** Ids whose file is here and not in the folder. */
  upload: string[];
  /** File names in the folder that no row refers to. */
  clearFromFolder: string[];
  /** Ids neither here nor in the folder: on the way from the other device,
   *  or kept on a device with no shared folder. */
  missing: string[];
  /** Ids whose copy is confirmed in the folder. */
  inFolder: string[];
};

/**
 * What a pass does. The folder is cleared of a file only when this device
 * saved last, the same rule photos follow (planPhotoSync), since only then
 * does every row anybody kept appear here.
 */
export function planRecordingSync(input: {
  rows: readonly Pick<Recording, 'id' | 'fileName'>[];
  localFileNames: readonly string[];
  folderNames: readonly string[];
  mayClearFolder: boolean;
}): RecordingSyncPlan {
  const local = new Set(input.localFileNames);
  const folder = new Set(input.folderNames.filter(isRecordingFileName));
  const named = new Set(input.rows.map((row) => row.fileName));
  const upload: string[] = [];
  const missing: string[] = [];
  const inFolder: string[] = [];
  for (const row of input.rows) {
    if (folder.has(row.fileName)) inFolder.push(row.id);
    else if (local.has(row.fileName)) upload.push(row.id);
    else missing.push(row.id);
  }
  const clearFromFolder = input.mayClearFolder ? [...folder].filter((name) => !named.has(name)).sort() : [];
  return { upload: upload.sort(), clearFromFolder, missing: missing.sort(), inFolder: inFolder.sort() };
}

/** Local files in the recordings cache that no row names. */
export function orphanedRecordingFiles(rowFileNames: readonly string[], localFileNames: readonly string[]): string[] {
  const kept = new Set(rowFileNames);
  return localFileNames.filter((name) => isRecordingFileName(name) && !kept.has(name)).sort();
}

function sizeLabel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = bytes / (1024 * 1024);
  return mb < 100 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
}

export type RecordingPlace = 'here' | 'folder' | 'both' | 'nowhere';

/** The caption under a recording in the list. */
export function recordingCaption(item: Pick<Recording, 'sizeBytes' | 'mimeType'>, place: RecordingPlace): string {
  const kind = item.mimeType.replace(/^audio\//, '').replace('mpeg', 'MP3').replace('mp4', 'M4A').toUpperCase();
  const size = item.sizeBytes > 0 ? `${kind}, ${sizeLabel(item.sizeBytes)}` : kind;
  switch (place) {
    case 'both':
      return `${size}. In the Recordings folder, and on this device for now.`;
    case 'folder':
      return `${size}. In the Recordings folder; fetched when you play it.`;
    case 'here':
      return `${size}. On this device; copied into the Recordings folder once a shared folder is set up.`;
    default:
      return `${size}. On the way from your other device.`;
  }
}

/** The line at the top of the band. */
export function recordingsLead(onComputer: boolean, hasFolder: boolean): string {
  const where = hasFolder
    ? 'Each one is kept in the Recordings folder in your shared folder, where any player can open it too, and this device keeps the ones played lately.'
    : 'Each one stays on this device until a shared folder is set up in Profile > Backup & Restore, then moves into its Recordings folder.';
  const play = onComputer
    ? 'Play one here, or open the folder in any player.'
    : 'Play one here. It stops when you leave this lens.';
  return `Audio of your own: a relaxation track, a session somebody recorded for you, rain. ${where} ${play}`;
}

export const RECORDINGS_EMPTY = 'No recordings yet.';
export const RECORDING_NOT_REACHABLE = 'This recording is in the shared folder, and the folder could not be reached just now.';
export const RECORDING_ON_THE_WAY = 'This recording has not arrived from your other device yet.';

/** mm:ss, or h:mm:ss for anything past an hour. */
export function playClock(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
