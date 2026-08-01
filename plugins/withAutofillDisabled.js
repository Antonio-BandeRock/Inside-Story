const { withAndroidManifest } = require('expo/config-plugins');

// Sets android:importantForAutofill="noExcludeDescendants" on the
// <application> tag itself, 2026-08-01 -- a real, native, app-wide
// setting, distinct from AppTextInput.tsx's own per-field
// importantForAutofill prop (which sets the SAME attribute, but on each
// individual view). That per-field version was tried first (both "no" and
// the stronger "noExcludeDescendants") and reported, on-device, to still
// show Android's Autofill suggestion chip over Side Builder's Dish Name
// field -- traced to Samsung Pass being the device's active Autofill
// service, which some OEM autofill implementations are documented to
// treat inconsistently at the per-view level. Setting this at the
// <application> level is the one other real lever this app has: it's the
// SAME underlying Android attribute, just declared for the whole app's
// view tree at once rather than negotiated per field, and some autofill
// services are known to respect the manifest-level default even when a
// per-view opt-out gets ignored.
//
// Requires a native rebuild to test (`npx expo run:android`), not a hot
// JS reload -- this edits AndroidManifest.xml directly, not RN's own
// component tree.
const withAutofillDisabled = (config) => {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:importantForAutofill'] = 'noExcludeDescendants';
    }
    return config;
  });
};

module.exports = withAutofillDisabled;
