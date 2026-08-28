const { withAppBuildGradle } = require('expo/config-plugins');

// 2026-08-28, direct on-device diagnosis, not a guess: a person reported
// the standalone (non-dev-client) build still stalling for the full 3
// minutes on first launch, the exact "95%" symptom the whole prior
// SQLite-race saga was supposed to have eliminated by embedding the
// reference database directly into the app. Root-caused by pulling the
// actual installed APK (`adb pull`) and inspecting it directly rather
// than theorizing further: `unzip -v base.apk` showed
//
//   Length     Method   Size      Name
//   160391168  Defl:N   34088622  res/h4.db
//
// -- Android's default AAPT2 packaging DEFLATE-compresses large bundled
// assets like this one down to about 21% of their real size. That's
// good for download size, but it means every time this app needs to
// copy that file out to somewhere SQLite can actually open (expo-
// sqlite's own importDatabaseFromAssetAsync, see lib/db.ts's own
// getReferenceDatabase comment), Android has to decompress the whole
// 160MB on the phone's own CPU first, a genuinely slow operation for a
// file this size, entirely local, no network involved at all -- which
// is exactly why this kept happening even after moving off the live
// dev-client connection specifically because it was never a network
// problem in the first place for THIS build; it's a decompression cost
// this exact class of asset never needed to pay.
//
// The fix is a real, standard Android mechanism, not a workaround:
// telling the packager to store specific file types uncompressed
// (`androidResources.noCompress` in Gradle's own DSL, the modern
// replacement for the older `aaptOptions.noCompress`) makes the file
// part of the APK's own directly-mappable region -- a real byte copy
// instead of CPU-bound DEFLATE decompression, restoring the near-
// instant local copy this app's own reimport logic was always written
// to expect. Deliberately scoped to the "db" extension specifically,
// not every asset in the app -- the other bundled images/fonts are all
// small enough that their own compression cost was never the problem
// being solved here.
//
// This can't be fixed by hand-editing the local android/app/build.gradle
// (see this repo's own CLAUDE.md: that folder is local, untracked build
// output, regenerated fresh by every real EAS Build run from app.json
// and this plugins list) -- has to be a real config plugin so it
// survives every future prebuild, the same reason withWindowBackground.js
// and withAutofillDisabled.js both already exist as plugins instead of
// one-off native edits.
module.exports = function withNoCompressDb(config) {
  return withAppBuildGradle(config, (config) => {
    const { contents } = config.modResults;
    const anchor = 'androidResources {';
    if (!contents.includes(anchor)) {
      throw new Error(
        "withNoCompressDb: could not find the expected 'androidResources {' block in " +
          "android/app/build.gradle -- this plugin's own anchor text may be stale " +
          'against a newer Expo/AGP template. Update the anchor rather than silently ' +
          'skipping this fix, since skipping it silently reintroduces the exact ' +
          '3-minute reference-database stall this plugin exists to prevent.',
      );
    }
    config.modResults.contents = contents.replace(
      anchor,
      `${anchor}\n        noCompress 'db'`,
    );
    return config;
  });
};
