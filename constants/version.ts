// Single source of truth for the app's own displayed version number (see
// VersionLabel.tsx, the small always-on-screen text this feeds). Kept
// separate from package.json/app.json's own "version" fields (which this
// should still be kept in sync with by hand on every bump) so the running
// app can read it directly rather than needing a native rebuild just to
// read its own package.json at runtime.
//
// 2026-08-23: introduced by direct request, "a way to be sure I am looking
// at the correct version that definitely includes the latest updates."
// Confirmed on-device the same day, with one addition: a fourth segment,
// 1.0.<day>.<same-day update>, since a single day of work can (and does)
// ship several distinct updates worth being able to tell apart.
//
// Format is 1.0.DAY.UPDATE. Still pre-1.0-launch in scope, so the major/
// minor stay pinned at 1.0. DAY is the count of distinct calendar days
// with committed development work since this app's first commit
// (2026-07-25), a checkable number (`git log --format=%ad --date=short |
// sort -u | wc -l`) rather than a guess, chosen specifically because the
// raw git commit count (680 as of 2026-08-23, mostly fine-grained
// auto-checkpoints rather than meaningful releases) would have read as
// noise, not a version history. DAY increments by exactly 1 the first
// time a version bump happens on a new calendar day of work, never
// mid-day. UPDATE resets to 1 whenever DAY increments.
//
// 2026-08-23, same day, direct refinement: UPDATE increments once per
// distinct request the user provides that day, not once per individual
// file changed or checkpoint shipped -- "It isn't per change because
// there may be many changes that happen at once, but each time I provide
// something for you to do or to change, there needs to be an increment
// for that day." A single request that touches 20 files is still exactly
// one bump; a second, later request the same day is a second bump, even
// if the first request is still technically in progress.
//
// Do not type this by hand. Run node scripts/bump_version.js at the start
// of handling each new request; it reads the day count out of git, resets
// UPDATE to 1 on a new day, and writes all four files at once (this one,
// app.json, package.json and desktop/electron-builder.yml). --check reports
// whether the day is stale and exits 1 if it is.
//
// 2026-09-22: that script exists because hand-typing this failed six times.
// 09-03, 09-06, 09-07, 09-14, 09-17 and 09-21 each carried the previous
// day's DAY forward instead of incrementing it, so 2026-09-22 opened on
// 1.0.42.x when git said it was the 49th day of work. Direct correction:
// "Once midnight happens, it is the next day, and the version must be
// switched from third position ... It absolutely never should ever continue
// with version numbering from the previous day of work." The seven shipped
// versions between 1.0.32.x and 1.0.42.x are left as they shipped; only the
// number going forward was corrected, from 1.0.42.30 to 1.0.49.1.
//
// A known limitation, not yet a live problem: this exact 4-segment string
// isn't strict semver (package.json/app.json's own "version" fields are
// kept in sync with it anyway, for one consistent number app-wide), and
// Apple's own App Store guidance prefers a 3-segment CFBundleShortVersion
// String. Irrelevant today (no App Store submission exists yet, iPhone
// is still a planned platform, not a shipped one), worth revisiting only
// once that actually applies.
export const APP_VERSION = '1.0.50.3';
