// React Native's own Text, for components/EditableText.tsx and
// components/reactNativeWithEditableText.js, which must never be handed the
// swap in metro.config.js. Asked for as 'react-native/index' rather than
// 'react-native', because Metro caches a bare 'react-native' once for every
// file outside node_modules, whatever folder it is in, so the swap's
// exclusion by file never ran: 1.0.51.12 gave EditableText.tsx the swap,
// a circular import whose Text was undefined, and the app closed on launch.
// A path with a slash in it is resolved per folder, and 'react-native/index'
// is the same module 'react-native' is. The web target reads
// reactNativeText.web.js instead, since only a bare 'react-native' is
// rewritten to React Native Web.
export { Text } from 'react-native/index';
