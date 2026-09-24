// The line on every report that says what produced its figures (Phase A
// of the 2026-09-24 gap review).
//
// A score in this app is worked out live from the bundled reference
// database, which also holds the cited interaction rules, so the same
// weeks reported twice can come out differently after a reference update.
// A report used to carry only the app version, so a clinician comparing
// two printouts had no way to tell a change in the person from a change
// in the app. Stamping both versions is the whole fix: recomputing an old
// report under the old rules was considered and declined, since knowing
// which data made a figure is what a reader needs, and keeping every past
// rule set on the phone is not.
//
// Imports nothing, so scripts/test_phase_a_trust.js can load it.

// "20260918210000" -> "2026-09-18". The stamp is written by the scripts
// that rebuild the reference database, so it marks a build rather than a
// release, and the day is the part a reader can use.
export function referenceDataDate(version: string): string {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(version);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : version;
}

export function reportVersionLine(appVersion: string, referenceVersion: string): string {
  return (
    `Made with Inside Story ${appVersion}, using food reference data and interaction rules dated ` +
    `${referenceDataDate(referenceVersion)} (build ${referenceVersion}).`
  );
}
