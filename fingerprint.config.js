// Configures @expo/fingerprint, the tool both `eas build` and `eas update`
// use to compute this project's runtimeVersion under app.json's own
// `runtimeVersion: { policy: "fingerprint" }` (see that field's own history
// in CLAUDE.md, added 2026-08-28 alongside EAS Update).
//
// 2026-08-28/29, direct on-device report: "I have closed and force stopped
// and reopened 3 times and have no App Updates card." Investigated rather
// than re-guessed: two `eas update` publishes minutes apart, with no
// native-relevant change between them, came back with two DIFFERENT
// runtime-version fingerprints (confirmed in each publish's own CLI
// output). Reproduced locally and isolated to a single cause: bumping
// nothing but app.json's own `version` string (the field this project's
// own standing convention bumps on every distinct request, see
// constants/version.ts) changes the fingerprint hash under this tool's
// default options, confirmed by hand -- `npx @expo/fingerprint
// fingerprint:generate .` gave a different hash for "1.0.29.8" than for
// "1.0.29.9" with literally nothing else in the project touched.
//
// The consequence, unnoticed until this report: since this project bumps
// app.json's `version` on every single request as a matter of course, the
// runtimeVersion was drifting on every request too -- meaning an EAS
// Update published after ANY version bump could never be considered
// compatible with an already-installed build (whose own runtimeVersion was
// fixed for good at that build's own compile time), and neither could two
// updates published on two different version-bumped commits ever match
// EACH OTHER. This is very likely why no update published since the
// version-bump convention and the fingerprint policy started coexisting
// has ever actually reached a phone as an OTA update -- both were set up
// the same day, 2026-08-28, and this gap sat unnoticed until now.
//
// Fixed the standard, documented way: `SourceSkips.ExpoConfigVersions`
// (see node_modules/@expo/fingerprint/build/sourcer/SourceSkips.d.ts)
// exists specifically to exclude app.json's own `version` (and Android
// versionCode / iOS buildNumber) from the fingerprint, precisely because a
// real team's own version string is expected to change on every release
// without that alone forcing a new native build. Verified locally after
// adding this: the same "1.0.29.8" vs "1.0.29.9" test that used to change
// the hash no longer does.
module.exports = {
  sourceSkips: ['ExpoConfigVersions'],
};
