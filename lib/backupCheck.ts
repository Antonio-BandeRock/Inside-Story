// Checking that a backup opens, without restoring it (Phase A of the
// 2026-09-24 gap review).
//
// A backup nobody has ever opened is a hope rather than a backup: the
// password could be misremembered, the file cut short on its way to the
// cloud, or written by a version of the app whose tables no longer match.
// Until now the only way to find out was Restore, which replaces
// everything on the device, so nobody ever found out until the day they
// needed it. This decrypts and reads a backup the same way Restore does,
// counts what is in it, writes nothing but the date of the check, and says
// what it found.
//
// Imports nothing, so scripts/test_phase_a_trust.js can load it. The
// storage half is lib/backupCheckDb.ts.

export type BackupCheckSummary = {
  /** When the backup was made, as the file says. */
  exportedAt: string;
  tables: number;
  rows: number;
  /** Tables in the backup that this version of the app no longer has. */
  unknownTables: string[];
  /** A backup from a newer format than this app reads. */
  newerFormat: boolean;
};

export type BackupCheckRecord = BackupCheckSummary & {
  checkedAt: string;
  /** Where the checked file came from, in words ("this device", "OneDrive", "a file you picked"). */
  source: string;
};

export function summarizeBackup(
  envelope: { schemaVersion: number; exportedAt: string; tables: Record<string, unknown[]> },
  currentTables: readonly string[],
  currentFormat: number,
): BackupCheckSummary {
  const known = new Set(currentTables);
  let rows = 0;
  const unknownTables: string[] = [];
  for (const [table, list] of Object.entries(envelope.tables)) {
    rows += Array.isArray(list) ? list.length : 0;
    if (!known.has(table)) unknownTables.push(table);
  }
  unknownTables.sort();
  return {
    exportedAt: envelope.exportedAt,
    tables: Object.keys(envelope.tables).length,
    rows,
    unknownTables,
    newerFormat: envelope.schemaVersion > currentFormat,
  };
}

function plural(count: number, word: string): string {
  return count.toLocaleString('en-US') + ' ' + word + (count === 1 ? '' : 's');
}

/** What the check found, said once in words. */
export function backupCheckSentence(summary: BackupCheckSummary, madeOn: string): string {
  if (summary.rows === 0) {
    return 'This backup from ' + madeOn + ' opened, but it holds no records at all. Export a fresh one before relying on it.';
  }
  let sentence =
    'This backup from ' + madeOn + ' opens and reads cleanly: ' +
    plural(summary.rows, 'record') + ' across ' + plural(summary.tables, 'table') + '. Nothing on this device was changed.';
  if (summary.newerFormat) {
    sentence += ' It was written by a newer version of Inside Story, so update the app before restoring it.';
  } else if (summary.unknownTables.length > 0) {
    sentence +=
      ' ' + plural(summary.unknownTables.length, 'table') +
      ' in it no longer exist in this version, and a restore would skip ' +
      (summary.unknownTables.length === 1 ? 'it' : 'them') + '.';
  }
  return sentence;
}

/** The line under Backup & Restore saying when a backup was last shown to open. */
export function lastCheckLine(record: BackupCheckRecord | null, checkedOn: string, madeOn: string): string {
  if (!record) return 'No backup has been checked on this device yet.';
  return (
    'Last checked ' + checkedOn + ': the backup from ' + madeOn + ' (' + record.source + ') opened with ' +
    plural(record.rows, 'record') + '.'
  );
}
