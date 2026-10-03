// Reads what is new on the FDA recall list (A14, lib/recallsDb.ts) when the
// app starts and whenever it comes back to the front, while the recall check
// is on. A read happens at most once a day, so most of these calls return at
// once. It renders nothing; a new match raises one notification.
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { refreshRecalls } from '../lib/recallsDb';

async function checkNow() {
  try {
    await refreshRecalls();
  } catch (error) {
    console.warn('[RecallWatcher] Read failed', error);
  }
}

export function RecallWatcher() {
  useEffect(() => {
    void checkNow();
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void checkNow();
    });
    return () => subscription.remove();
  }, []);
  return null;
}
