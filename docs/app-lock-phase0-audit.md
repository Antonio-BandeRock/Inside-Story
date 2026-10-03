# App Lock: Phase 0 Audit

2026-10-02, at version 1.0.59.14. This answers the five Phase 0 questions in `docs/app-lock-spec.md` from the code. No feature code has been written. It ends with a recommended approach and the four questions for Tony.

## 1. Where user data is stored, and what is encrypted at rest today

Nothing on the phone is encrypted at rest by the app today. Android's file-based encryption protects files while the phone is powered off or before its first unlock, and that is all.

| What | Where | Encrypted by the app? |
|---|---|---|
| Every record (meals, symptoms, meds, labs, finances, diary-like notes, garden, sync log) | `inside_story.db`, one SQLite file opened by `lib/db.ts` (`DB_NAME`) | No |
| Reference foods | `foods_reference.db`, copied out of the APK | No, and it does not need to be: it is public reference data |
| Full copies of the database, made by sync between one person's devices | `inside-story-sync-sent-whole.json`, `inside-story-sync-received-whole.json` and `inside-story-sync-base.json` in the app's document folder (`lib/snapshotSyncDevice.ts`) | **No. These are plaintext JSON copies of every table.** They only exist once sync is turned on |
| The between-people merge base | `peer_sync_base`, inside the database | Same as the database |
| Photos and recordings | `Paths.document` folders: media, meal-photos, peer photos, recordings | No |
| Custom background pictures, spacing mirrors | `Paths.document` | No (not sensitive) |
| Exports left in the cache | `Paths.cache`: the last PDF report, CSV exports, grocery list exports, `.is` shares, LAN sync scratch, scan working photos | PDFs and CSVs are plain. Backups written there are encrypted |
| Scheduled reminder text | Held by expo-notifications in Android's own storage until each reminder fires | No. A dose reminder's title is "Time for" plus the medicine's name (`lib/reminderNotifications.ts`, line 572) |
| Secrets | `expo-secure-store` (Android Keystore) | Yes, see section 3 |

There is no AsyncStorage use; `lib/deviceIdentity.ts` only mentions it in a comment.

## 2. How the backup and `.is` sharing keys are made and kept

- **Encrypted backups** (`lib/backupEncryption.ts`): XSalsa20-Poly1305 (`nacl.secretbox`) under a key stretched from the person's password by 100,000 rounds of SHA-512 over password plus a 16-byte salt. The file comment says plainly this is a hand-built construction rather than a certified one like scrypt or Argon2. The key is never stored. Derived keys are cached in memory for the run.
- **Sync between one person's devices**: the same encryption. The one sync password is kept in `expo-secure-store` (key `inside_story_snapshot_sync`), without an authentication requirement, so the app can save on its own.
- **`.is` sharing** (`lib/sharing.ts`): signed with an Ed25519 device key, not encrypted. The private seed is in `expo-secure-store` (`device_identity_seed_v1`).
- **Between people** (`lib/partnerCrypto.ts`): sign, then encrypt in a sealed box to the partner's public key, assembled from `nacl.box`.

None of this has to change for App Lock. R10's "keep working unchanged" holds, because these keys are independent of a database key.

## 3. What already uses secure store, local authentication and crypto

- `expo-secure-store`: OneDrive refresh token and PKCE verifier (`lib/oneDriveAuth.ts`), the device signing seed (`lib/deviceIdentity.ts`), and the sync state and password (`lib/snapshotSyncDevice.ts`). None uses `requireAuthentication`. On the desktop, `lib/desktop/secureStoreShim.ts` stands in through Electron's `safeStorage`.
- `expo-local-authentication`: **not installed.** It is native, so it needs the R1 rebuild.
- `expo-crypto`: random bytes and hashing in the backup, identity, OneDrive, partner and relay-mailbox code.
- `tweetnacl` does the encryption itself.

## 4. What reads or writes user data while the app is closed

Only one thing runs with the app closed:

- **Reminder buttons** (`lib/reminderBackgroundTask.ts`, since 2026-10-01). A press on a reminder's button with the app closed **writes to the database** (marking a dose taken, a doing in Upkeep, a flare, a check-in note). With the database key out of memory while locked, that write cannot happen. **Fix:** the press is queued in a small file and applied at the next unlock. Any words typed into it are sealed to a device key whose private half sits behind the lock, so the queue shows nothing.

Everything else runs only while the app is open:

- Reminders are worked out while the app is open and handed to the operating system, which fires them with no help from the app. That is already the spec's preferred approach. They keep firing while locked. The only change needed is generic wording by default (R9).
- Health Connect import runs only from Movement (`components/MovementSection.tsx`).
- Wi-Fi sync (`lib/lanSync.ts`), the Ecowitt poller (`components/EcowittPoller.tsx`, which stops in the background), the recall watcher and the shared-folder sync watcher all run only while the app is open. Shared-folder sync also saves "when the app is put away". With a lock, that save has to finish before the key is dropped, which the auto-lock delay already allows for.

## 5. Can the database library encrypt, and what would migration take

- **Phone:** yes. The installed `expo-sqlite` 16.0.10 has a `useSQLCipher` option in its config plugin (`plugin/build/withSQLite.js`). It swaps in SQLCipher, opened with `PRAGMA key`. It is a native change, so it goes in the R1 rebuild. SQLCipher still opens an unkeyed file normally, so `foods_reference.db` stays as it is.
- **Migration:**
  1. Open the plain database.
  2. `ATTACH` a new file with the key and run `SELECT sqlcipher_export(...)`.
  3. Check the row counts match, then swap the files and delete the plain one.
  4. Because the new file is only swapped in at the end, an interrupted migration leaves the plain database untouched and simply starts over. That covers R12's "safe to resume".
  5. `lib/restartApp.ts` already closes both connections before a reload, which a key change needs.
- **Desktop:** no. Node's built-in `node:sqlite`, used by `desktop/sqlite.js`, has no encryption. The likely route is `better-sqlite3-multiple-ciphers`, which reads the SQLCipher format but needs a native Electron module and its own build step. Windows Hello would also need a native module, and macOS Touch ID is built into Electron. So the desktop should start with passcode and recovery key only.

## Findings that change the spec

1. **A 6-digit passcode cannot protect a copied file on its own.** There are only a million codes, and any key stretching can be run through them offline in hours. So the passcode-wrapped copy of the data key must itself be stored in the Android Keystore. Copying the app's files to a computer then gives an attacker nothing to work on, and the five-tries delay can only be beaten on the phone itself. The recovery key is long enough (128 bits) to be kept wrapped in an ordinary file.
2. **Use a certified key-stretching function for the passcode.** That means scrypt or Argon2, from an audited pure-JS library, not the hand-built loop the backup uses. The backup's own function can be left alone, since changing it would break every existing backup file.
3. **The three plaintext sync copies are the largest leak today.** They have to move under the data key: either encrypted with it, or into the database itself. This fix is worth doing even with the lock off.
4. **Locking only the sensitive areas cannot keep the data key out of memory**, because Food, Schedules and Garden need the database open. In that mode, the key would be held in the Keystore with no authentication required. That still protects a copied file (goal 1) and puts the sensitive screens behind the lock, but it does not meet R2's "not held in memory while locked". Whole-app lock meets both.
5. **Biometric changes (R8).** Storing the biometric copy of the key through `expo-secure-store` with `requireAuthentication: true` uses a Keystore key that Android voids when a new fingerprint or face is enrolled. The passcode then has to be entered once, which is R8. This needs confirming on the phone after R1, since it depends on how the Expo module sets the key up.
6. **Blocking screenshots (R5) needs `expo-screen-capture`.** That is another native module for the same rebuild.

## Recommended approach

1. **Make a random 256-bit data key**, used as the SQLCipher key. Keep three wrapped copies of it, with no copy stored bare:
   - Biometric: in secure store, with an authentication requirement.
   - Passcode: wrapped with a key stretched from the passcode, and that wrapped copy also kept in secure store.
   - Recovery key: in an ordinary file.
2. **Rebuild once (R1)** with these added to the existing R1 list: `expo-local-authentication`, `useSQLCipher: true` and `expo-screen-capture`.
3. **Ship the feature code over the air, in this order:**
   - Move the sync copies under the key.
   - Set the lock up, with the recovery key shown and confirmed.
   - Migrate with a progress screen.
   - Unlock and auto-lock.
   - The delay after wrong tries.
   - Generic reminder text.
   - Queue presses on reminder buttons while locked.
   - Fresh authentication before a backup, restore, export, report or pairing.
   - Turning the lock off.
4. **Desktop comes later** as its own step: passcode and recovery key, with `better-sqlite3-multiple-ciphers`.

## Four questions for Tony

1. **Whole app, or only the sensitive areas?** Recommendation: the whole app by default, with sensitive-only offered as a choice. That choice would say it protects copied files and the sensitive screens, but keeps the key loaded while the app is open (finding 4).
2. **The emergency card while locked?** Recommendation: offer it, off by default. When turned on, the card the person picks is kept as a small separate copy outside the encrypted database. It is refreshed each time they unlock, so first responders can read it without the key.
3. **Every tier, including Free?** Recommendation: yes.
4. **Partner and device sync while locked?** Recommendation: no, only while unlocked. Sync runs at unlock and saves before the lock takes the key away. With a whole-app lock, nothing can be read to send anyway.
