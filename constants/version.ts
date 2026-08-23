// Single source of truth for the app's own displayed version number (see
// VersionLabel.tsx, the small always-on-screen text this feeds). Kept
// separate from package.json/app.json's own "version" fields (which this
// should still be kept in sync with by hand on every bump) so the running
// app can read it directly rather than needing a native rebuild just to
// read its own package.json at runtime.
//
// 2026-08-23: introduced by direct request, "a way to be sure I am looking
// at the correct version that definitely includes the latest updates."
// Format is 1.0.X, matching app.json/package.json's own existing "1.0.0"
// baseline -- still pre-1.0-launch in scope, so the major/minor stay
// pinned at 1.0, and X is a plain incrementing build/checkpoint counter,
// bumped by hand at each user-visible checkpoint going forward.
//
// The starting value, 24, isn't arbitrary: it's the count of distinct
// calendar days with committed development work between this app's
// first commit (2026-07-25) and the day this version system was built
// (2026-08-23), a checkable number (`git log --format=%ad --date=
// short | sort -u | wc -l`) rather than a guess, chosen specifically
// because the raw git commit count (680, mostly fine-grained auto-
// checkpoints rather than meaningful releases) would have read as noise,
// not a version history.
export const APP_VERSION = '1.0.24';
