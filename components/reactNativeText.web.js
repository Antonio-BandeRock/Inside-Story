// The web half of components/reactNativeText.js. On the web target
// babel-preset-expo rewrites this into a deep import of
// 'react-native-web/dist/exports/Text', which carries a slash and so is
// resolved per file, and metro.config.js leaves this file out of the swap
// by name.
export { Text } from 'react-native';
