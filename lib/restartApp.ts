// The one way the app restarts itself in place (2026-10-02). Every caller
// that used Updates.reloadAsync() directly comes here instead, so the
// database connections are closed first: a reload keeps the process, and a
// connection left open by the old JS context held a write lock that made
// every later start fail with "database is locked" until the app was closed
// completely. See closeDatabasesForRestart in lib/db.ts.
//
// If the reload itself is refused, the caller's catch runs as before, and
// the next database call opens fresh connections.

import * as Updates from 'expo-updates';
import { closeDatabasesForRestart } from './db';

export async function restartApp(): Promise<void> {
  await closeDatabasesForRestart();
  await Updates.reloadAsync();
}
