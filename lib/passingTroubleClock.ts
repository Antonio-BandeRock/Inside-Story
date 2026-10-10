// Where lib/passingTrouble.ts keeps when each run of passing trouble began:
// a small file of its own in the app's documents folder, read and written
// synchronously. Not app_meta, because a write there counts as a change to
// the records and would start the very sync save that is failing. It
// outlives a restart so somebody who opens the app for a few minutes at a
// time still hears about trouble that has gone on all day.
import { File, Paths } from 'expo-file-system';

export type TroubleChannel = 'sharedFolder' | 'mailbox';

const CLOCK_FILE_NAME = 'passing_trouble_since.json';

function clockFile(): File {
  return new File(Paths.document, CLOCK_FILE_NAME);
}

function readAll(): Partial<Record<TroubleChannel, number>> {
  try {
    const file = clockFile();
    if (!file.exists) return {};
    const parsed: unknown = JSON.parse(file.textSync());
    return parsed && typeof parsed === 'object' ? (parsed as Partial<Record<TroubleChannel, number>>) : {};
  } catch {
    return {};
  }
}

export function troubleSince(channel: TroubleChannel): number | null {
  const value = readAll()[channel];
  return typeof value === 'number' ? value : null;
}

export function setTroubleSince(channel: TroubleChannel, since: number | null): void {
  const all = readAll();
  if ((all[channel] ?? null) === since) return;
  if (since === null) delete all[channel];
  else all[channel] = since;
  try {
    clockFile().write(JSON.stringify(all));
  } catch {
    // Holds for nothing then; the worst case is the notice coming an hour later than it might.
  }
}
