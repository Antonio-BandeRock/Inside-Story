# Inside Story: App Lock Spec

Status: draft for review. Written without access to the codebase, so Phase 0 below must run before any design decision here is treated as final.

## Problem

Anyone holding an unlocked phone can open Inside Story and read health, medication, finance and emergency information. The app encrypts backups and shared data, but nothing protects the data from a person with the device in hand.

## Goals

1. A person without the user's biometric or passcode cannot read protected data, either through the app screens or by copying the app's files off the device.
2. The lock adds no server, no account and no data that leaves the device.
3. A user who forgets their passcode can recover with a key that only they hold.
4. Daily use stays fast: one glance or one touch to open.

## Non-goals

- Two-factor authentication. The app has no server login for health data, so there is nothing for a second factor to protect. See "Cloud storage reminder" below for the one place it matters.
- Any recovery path that Inside Story (the company) can perform. No reset by email, no support override.
- Storing or processing biometric data. The operating system does this.
- Protection against a compromised or rooted device.

## Phase 0: Audit first (required, report before building)

Read the code and report back on:

1. Where user data is stored (SQLite, files, key-value storage) and whether any of it is encrypted at rest today.
2. How the encrypted local backup and the `.is` sharing files derive and store their keys.
3. What already uses `expo-secure-store`, `expo-local-authentication` or `expo-crypto`.
4. Which background tasks read user data while the app is closed (local reminders for meds and appointments, Wi-Fi sync, Health Connect import).
5. Whether the current database library supports encryption (for example SQLCipher through `expo-sqlite`), and what a migration of existing data would involve.

Stop after Phase 0 and present findings and a recommended approach before writing feature code.

## Requirements

### R1. Unlock methods

- Biometric unlock (face or fingerprint) through the operating system.
- App passcode as fallback: 6 digits minimum, with an option for a longer alphanumeric passphrase.
- No pattern unlock. It is weaker than a passcode and adds a third code path.
- The user chooses at setup: biometric plus passcode, or passcode only.

### R2. The lock must protect the data, not only the screen

- User data at rest is encrypted with a data key.
- The data key is stored in the device's secure hardware (Android Keystore, iOS Keychain) and released only after successful authentication.
- With the app locked, the data key is not held in memory.
- A lock that only covers the interface while the database stays readable on disk does not meet this requirement.

### R3. Scope of the lock

- Default: the whole app locks.
- Option: lock only sensitive areas. Minimum sensitive set: Signals, Insights, Trends, Reports, Life (finances, My Meds, work), Profile, labs, backups and partner sharing.
- Emergency info is the exception. Offer a setting, off by default, that shows a user-chosen emergency card without unlocking.

### R4. Auto-lock

- Lock when the app goes to the background, after a user-set delay: immediately, 1 minute, 5 minutes, 15 minutes. Default 1 minute.
- Always lock on device restart and on app cold start.

### R5. Screen privacy

- Blank or blur the app's preview in the app switcher.
- On Android, block screenshots of protected screens (FLAG_SECURE), with a user setting to allow them.

### R6. Failed attempts

- After 5 wrong passcodes, add a growing delay (30 seconds, 1 minute, 5 minutes, 15 minutes).
- No automatic data wipe. Losing a health history to a child tapping the screen is worse than the risk it prevents.

### R7. Recovery

- At setup, generate a recovery key (random, at least 128 bits, shown as grouped words or characters).
- The user must confirm they saved it before the lock turns on. Offer print and save to file.
- The recovery key unwraps the data key and forces a new passcode.
- State plainly at setup: if the passcode and the recovery key are both lost, the data cannot be recovered by anyone.
- The recovery key can be regenerated from settings after unlocking, which cancels the old one.

### R8. Biometric changes

- If the device's enrolled biometrics change (new fingerprint or face added), require the passcode once before biometric unlock works again.

### R9. Notifications and background work

- Local reminders must still fire while locked.
- Reminder text shows full detail by default (changed 2026-10-06 by direct instruction: reminders that hide what they are about cannot be answered with a tap, and people will not keep an app whose many reminders all need an unlock). A setting hides the words to the kind only, for example "Time for your scheduled dose" in place of the medication name.
- Every answer button on a reminder works while the app is closed or locked. The press is sealed to the lock's public key, the reminder and its follow-ups are cleared at once, and the answer is written with the time it was pressed at the next unlock.
- Any background task that needs data must be reviewed in Phase 0. Preferred approach: schedule reminders while unlocked so they need no data access later.

### R10. Backup, sharing and partner pairing

- Existing encrypted backup and `.is` sharing must keep working unchanged from the user's point of view.
- Starting a backup, restore, export, PDF report or new partner pairing requires a fresh authentication, even if the app is already unlocked.
- Restoring a backup on a new device asks the user to set up the lock again. Lock settings do not travel in the backup.

### R11. Guardian and Caregiver profiles

- One lock per device install. Profiles for children or cared-for adults sit behind the same lock as the account holder's data.

### R12. Turning the lock on and off

- Lock is offered during onboarding and available in Profile settings.
- Turning it off requires authentication and a plain warning.
- Turning it on for an existing install migrates data to encrypted storage with a progress screen, and must be safe to resume if interrupted.

### R13. Cloud storage reminder

- After the user connects cloud storage for backups, show a one-time prompt recommending two-step verification on that cloud account, with a link to the provider's instructions. Inside Story does not check or enforce it.

## Platform notes

- Android and iOS: `expo-local-authentication` for the prompt, `expo-secure-store` with authentication required for the wrapped key. Confirm in Phase 0 whether hardware-bound keys need a small native module.
- Windows and Mac: neither Expo module covers desktop. Phase 0 should propose an approach (Windows Hello, Touch ID, or passcode only) once the desktop build path is known. Passcode plus recovery key must work everywhere.

## Copy rules

Follow the app's writing style: no em or en dashes, no filler words such as "real" or "genuinely", no redundant "own". Explain consequences plainly, especially around recovery.

## Acceptance tests

1. With the lock on and the app closed, the database file copied off a test device cannot be opened or read.
2. Biometric unlock opens the app in under one second on the Android test phone.
3. Wrong passcode five times triggers the delay. No data is lost.
4. Recovery key restores access and forces a new passcode. The old passcode no longer works.
5. Adding a new fingerprint to the device forces a passcode entry on next open.
6. A medication reminder fires while locked and shows no medication name by default.
7. The app switcher shows no readable content.
8. Backup, restore, `.is` export, Wi-Fi sync and partner pairing all pass their existing tests with the lock on.
9. Turning the lock on with a large existing dataset completes, and survives the app being killed halfway through.
10. Turning the lock off returns the app to its current behavior with no data loss.

## Open questions for Tony

1. Whole-app lock by default, or sensitive areas only?
2. Should the emergency card be available without unlocking?
3. Is the lock a feature of every tier, including Free? Recommendation: yes. Security should not be a paid feature.
4. Does partner Wi-Fi sync need to run while the app is locked, or only while open?
