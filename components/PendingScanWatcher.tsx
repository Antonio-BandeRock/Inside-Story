// Looks up barcodes scanned with no signal (G21, 2026-09-27) once the lookup
// services answer again: at start, whenever the app comes back to the front,
// and every half minute while it is in front and something is waiting. It
// renders nothing, and it says nothing out loud: a barcode it finds shows at
// the top of Food > Scan a Product (lib/pendingScans.ts).
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { countWaitingScans, retryPendingScans } from '../lib/pendingScansDb';

const CHECK_EVERY_MS = 30_000;

async function checkNow() {
  try {
    if ((await countWaitingScans()) === 0) return;
    await retryPendingScans();
  } catch (error) {
    console.warn('[PendingScanWatcher] Retry failed', error);
  }
}

export function PendingScanWatcher() {
  useEffect(() => {
    void checkNow();
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void checkNow();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void checkNow();
    }, CHECK_EVERY_MS);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);
  return null;
}
