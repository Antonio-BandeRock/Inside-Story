// What has to happen before the app restarts itself (1.0.60.17).
//
// A garden area saved on the phone never reached the computer: sync sends
// three quiet minutes after the last change, Lock Now restarted the app two
// minutes in, and the restart took the waiting send with it. The app then
// sat locked, where nothing can be read to send. So anything that restarts
// on purpose (locking, a refresh after a merge) asks the sync watcher to
// send what is waiting first.
//
// One listener, set by components/SnapshotSyncWatcher.tsx. Waited for at
// most FLUSH_LIMIT_MS, so a folder that cannot be reached never holds a
// lock open; what was not sent is still marked unsaved and goes the next
// time the app is unlocked.

const FLUSH_LIMIT_MS = 15000;

let flush: (() => Promise<void>) | null = null;

export function setBeforeRestart(next: (() => Promise<void>) | null): void {
  flush = next;
}

/** Sends what is waiting, giving up after FLUSH_LIMIT_MS. Never throws. */
export async function runBeforeRestart(): Promise<void> {
  const work = flush;
  if (!work) return;
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    await Promise.race([
      work(),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, FLUSH_LIMIT_MS);
      }),
    ]);
  } catch (error) {
    console.error('[beforeRestart] could not send before restarting', error);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
