// The web half of components/reactNativeText.js. Asked for as
// 'react-native-web/dist/exports/Text/index', a path metro.config.js never
// swaps, for the same reason the phone half asks for 'react-native/index':
// Metro caches a module name once per origin folder, so leaving this file
// out of the swap by name did nothing while other files in components/
// asked for 'react-native-web/dist/exports/Text' too. 1.0.52.3's Windows
// app got the swap back here, a circular import whose Text was undefined,
// and opened to a black screen.
export { default as Text } from 'react-native-web/dist/exports/Text/index';
