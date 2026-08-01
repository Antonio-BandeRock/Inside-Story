const { withAndroidStyles, AndroidConfig } = require('expo/config-plugins');

// Plain Node require() can't parse constants/colors.ts's TypeScript syntax
// (config plugins run outside Metro/Babel), so this is a literal copy of
// colors.background -- keep it in sync if that value ever changes.
const WINDOW_BACKGROUND_COLOR = '#2B3753';

// The nav-bar area still showed solid black even after disabling Android's
// enforced-contrast scrim (app.json's androidNavigationBar.enforceContrast)
// -- because that scrim was never the real problem. Under edge-to-edge, that
// strip is transparent and shows whatever's actually painted behind it; if
// nothing in the RN tree extends that far down (see app/(tabs)/_layout.tsx's
// un-colored root View), Android falls through to the raw Activity window's
// own android:windowBackground, which defaults to black -- completely
// unrelated to, and unaffected by, edge-to-edge/navigationBarColor (see the
// "NOT setBackgroundColorAsync" comment in app/_layout.tsx -- that class of
// fix is a dead end here, this is a different attribute). Setting the base
// window background itself to the app's own navy makes that fallback match
// instead of defaulting to black, regardless of whether RN content actually
// reaches every last pixel.
const withWindowBackground = (config) => {
  return withAndroidStyles(config, (config) => {
    const themeGroup = AndroidConfig.Styles.getAppThemeGroup();
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      parent: themeGroup,
      name: 'android:windowBackground',
      value: WINDOW_BACKGROUND_COLOR,
    });
    return config;
  });
};

module.exports = withWindowBackground;
