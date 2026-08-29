// What actually changed, per version, in plain language a person reading
// it can act on.
//
// 2026-08-29, direct report after the first successful OTA update ever
// reached a phone: "When the user checks for updates, the app just
// restarts. It doesn't give any warning about what is going to happen, or
// what to do when it starts again, or if an update was applied or if
// there was any update at all... Please make sure the user is aware of
// what will happen, or has happened, and provide a informational thing
// after the update is applied to tell that an update was actually
// applied, and what did that update include for changes."
//
// This file is the "what did that update include" half. The version
// number changing on screen (see constants/version.ts and
// components/VersionLabel.tsx) proved an update landed, but proved
// nothing about WHAT landed, which is the part that actually matters to
// someone using the app rather than building it.
//
// Named honestly rather than faked: this starts at the versions below,
// not at 1.0.0. Writing a plausible-sounding changelog for the ~100
// earlier versions after the fact would mean inventing history, against
// this project's own standing evidence-honesty rule. A version with no
// entry here is handled gracefully at the display end (see
// getReleaseNotesSince), never shown as an empty or invented list.
//
// STANDING MAINTENANCE RULE, the same discipline APP_VERSION itself
// already carries (see constants/version.ts): whenever a version bump
// ships something a person would actually notice, add its entry here in
// the same pass. A purely internal bump (a build-mechanism fix, a test
// publish) correctly gets no entry, and the display end handles that.
export type ReleaseNote = {
  version: string;
  /** YYYY-MM-DD, the date this version actually shipped. */
  date: string;
  /** One plain-language line per change, written for the person using the app. */
  changes: string[];
};

// Newest first. getReleaseNotesSince below relies on this ordering to
// show the most recent change at the top when several versions are
// caught up on at once.
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.0.30.6',
    date: '2026-08-29',
    changes: [
      'Renamed the button in Profile > Meal Plan to "Apply My Meal Timing Changes to Existing Meals", so it says plainly that tapping it updates meals already scheduled to match what you changed in Meal Timing.',
    ],
  },
  {
    version: '1.0.30.5',
    date: '2026-08-29',
    changes: [
      'Moved "Apply These Times to Meals Already Scheduled" to Profile, in the Meal Plan section, directly under "Generate My Meal Plan". This is where it should have been. It is in one place only.',
    ],
  },
  {
    version: '1.0.30.4',
    date: '2026-08-29',
    changes: [
      'Moved "Apply These Times to Meals Already Scheduled" into Profile, in the Meal Timing section, directly under your meal times and fasting window. It was previously in Schedule under the Meal Plan lens, which is not where you set those times and not where the previous update said it would be.',
    ],
  },
  {
    version: '1.0.30.3',
    date: '2026-08-29',
    changes: [
      'Meal plans now also respect your intermittent fasting eating window, not just your usual meal times. A meal whose usual time falls outside your window is moved inside it instead of being scheduled when you would not be eating.',
      'Added a way to correct the times on meals already scheduled. Setting a plan up again never fixed them, because it deliberately leaves days already on your schedule alone. This corrects them in place, keeping the same meals on the same days, and leaves anything you already logged untouched. (See 1.0.30.4: this now lives in Profile, under Meal Timing.)',
    ],
  },
  {
    version: '1.0.30.2',
    date: '2026-08-29',
    changes: [
      'Checking for updates now tells you what is about to happen, and asks first, instead of restarting the app with no warning.',
      'After an update is applied, a summary now shows you what actually changed, so an update is never just a silent restart.',
    ],
  },
  {
    version: '1.0.29.8',
    date: '2026-08-28',
    changes: [
      'Added a Check for Updates button in Profile. The app only looks for a new version on its own when it first opens, so this lets you check without closing and reopening it.',
    ],
  },
  {
    version: '1.0.29.7',
    date: '2026-08-28',
    changes: [
      'Meal plans now schedule each meal at the times set in Profile, instead of always using 8:00am, 12:30pm, and 6:30pm. A plan created before this update keeps its old times until you clear and regenerate it.',
    ],
  },
];

function parseVersion(version: string): number[] {
  return version.split('.').map((part) => {
    const parsed = Number.parseInt(part, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
}

/**
 * Compares two of this app's own 1.0.DAY.UPDATE version strings.
 * Returns a negative number if `a` is older, positive if newer, 0 if equal.
 * Compares segment by segment as numbers, so 1.0.30.2 correctly reads as
 * newer than 1.0.29.10 (a plain string comparison would get that backwards).
 */
export function compareAppVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index] ?? 0;
    const rightPart = right[index] ?? 0;
    if (leftPart !== rightPart) return leftPart < rightPart ? -1 : 1;
  }
  return 0;
}

/**
 * Every release note the person hasn't seen yet, newest first.
 *
 * Catching up on several versions at once is a real case, not a
 * theoretical one: someone who skips a few updates, or whose phone sat
 * unopened for a week, should see everything that changed in between,
 * not just the newest version's own line.
 *
 * `previousVersion` of null means this device has never recorded a
 * version before, which happens two genuinely different ways: a brand-new
 * install, and an existing install upgrading into the first version that
 * records this at all. There is no reliable way to tell those apart, so
 * this shows just the current version's own notes in both cases: an
 * accurate, useful summary for the upgrade case, and a harmless one-time
 * "here's what's in this version" for a new install, rather than either
 * showing a new user the entire changelog or showing an upgrading user
 * nothing at all.
 */
export function getReleaseNotesSince(
  previousVersion: string | null,
  currentVersion: string,
): ReleaseNote[] {
  return RELEASE_NOTES.filter((note) => {
    // Never show a note for a version newer than what's actually running.
    if (compareAppVersions(note.version, currentVersion) > 0) return false;
    if (previousVersion === null) {
      return compareAppVersions(note.version, currentVersion) === 0;
    }
    return compareAppVersions(note.version, previousVersion) > 0;
  });
}

/**
 * Formats release notes for the plain-string message useInfoAlert takes.
 * One version's notes render as a plain bulleted list; several versions
 * caught up on at once get a version heading each, so it stays clear
 * which change arrived when.
 */
export function formatReleaseNotesMessage(notes: ReleaseNote[]): string {
  if (notes.length === 0) return '';
  const bullets = (note: ReleaseNote) => note.changes.map((change) => `• ${change}`).join('\n\n');
  if (notes.length === 1) return bullets(notes[0]);
  return notes.map((note) => `Version ${note.version}\n\n${bullets(note)}`).join('\n\n\n');
}
