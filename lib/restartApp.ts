// The one way the app restarts itself in place (2026-10-02). Every caller
// that used Updates.reloadAsync() directly comes here instead, so the
// database connections are closed first: a reload keeps the process, and a
// connection left open by the old JS context held a write lock that made
// every later start fail with "database is locked" until the app was closed
// completely. See closeDatabasesForRestart in lib/db.ts.
//
// If the reload itself is refused, the caller's catch runs as before, and
// the next database call opens fresh connections.
//
// On the computer a reload keeps the address it is on, where the phone
// starts again at Home. Turning App Lock on restarts from the setup screen,
// so the computer came back to setup and a second setup wrote a new key
// over the one that opened the records (1.0.60.15). Every restart there
// now starts from Home, the same as on the phone.

import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { closeDatabasesForRestart } from './db';

export async function restartApp(): Promise<void> {
  await closeDatabasesForRestart();
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.history.replaceState(null, '', '/');
    } catch {
      // A reload from where it is beats no reload.
    }
  }
  await Updates.reloadAsync();
}
