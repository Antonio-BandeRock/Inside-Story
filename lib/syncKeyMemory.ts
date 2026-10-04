// Snapshot sync's derived keys, kept in the device's secure store, 2026-10-03.
//
// Reported from the phone: "The app appears slow on mobile right now after
// the update. Just for the first maybe 5 to 10 seconds." The encryption key
// for a sync file is stretched from the password by 100,000 hashes in plain
// JavaScript (lib/backupEncryption.ts), which on a phone holds the screen up
// in bursts for several seconds. It ran on every start to open the other
// device's copy, and on every save, since each save drew a fresh salt.
//
// So the stretched key is kept here, beside the sync password that is
// already in the same secure store (lib/snapshotSyncDevice.ts), which means
// nothing becomes reachable that was not before. A save reuses the salt last
// used with the password, which after the first read is the other device's,
// so both devices settle on one key and neither pays for it again. Cleared
// when sync is turned off or set up with a new password.

import { bytesToBase64, base64ToBytes } from './deviceIdentity';
import { passwordTag, type DerivedKeyMemory } from './backupEncryption';

const ITEM = 'inside_story_sync_derived_keys_v1';
// A handful: the current salt, the other device's, and one or two from
// before a password change settles. Small enough for the secure store.
const LIMIT = 4;

type Entry = { p: string; s: string; k: string };

let entries: Entry[] | null = null;

async function secureStore() {
  return import('expo-secure-store');
}

async function load(): Promise<Entry[]> {
  if (entries) return entries;
  try {
    const raw = await (await secureStore()).getItemAsync(ITEM);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    entries = Array.isArray(parsed)
      ? parsed.filter(
          (e): e is Entry => !!e && typeof e.p === 'string' && typeof e.s === 'string' && typeof e.k === 'string',
        )
      : [];
  } catch {
    entries = [];
  }
  return entries;
}

async function save(next: Entry[]): Promise<void> {
  entries = next;
  try {
    await (await secureStore()).setItemAsync(ITEM, JSON.stringify(next));
  } catch {
    // Kept in memory for this run; the next start pays for the key once.
  }
}

export const syncKeyMemory: DerivedKeyMemory = {
  async recall(password, salt) {
    const p = passwordTag(password);
    const s = bytesToBase64(salt);
    const found = (await load()).find((e) => e.p === p && e.s === s);
    return found ? base64ToBytes(found.k) : null;
  },
  async keep(password, salt, key) {
    const p = passwordTag(password);
    const s = bytesToBase64(salt);
    const rest = (await load()).filter((e) => !(e.p === p && e.s === s));
    // Newest last, so lastSalt reads the end.
    await save([...rest, { p, s, k: bytesToBase64(key) }].slice(-LIMIT));
  },
  async lastSalt(password) {
    const p = passwordTag(password);
    const mine = (await load()).filter((e) => e.p === p);
    const last = mine[mine.length - 1];
    return last ? base64ToBytes(last.s) : null;
  },
};

/** Forgets every kept key, for turning sync off or choosing a new password. */
export async function forgetSyncKeys(): Promise<void> {
  entries = [];
  try {
    await (await secureStore()).deleteItemAsync(ITEM);
  } catch {
    // Nothing kept, or nothing to delete.
  }
}
