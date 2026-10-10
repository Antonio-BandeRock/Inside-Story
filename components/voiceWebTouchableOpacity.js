// The desktop half of the voice control swap for TouchableOpacity (1.0.66.11). On the
// web target babel-preset-expo rewrites `import { TouchableOpacity } from
// 'react-native'` into a deep import of
// 'react-native-web/dist/exports/TouchableOpacity', and metro.config.js hands this
// app's own files this module for that path instead. See
// components/voiceNamedControl.js.
// '/index', never the bare export path: Metro hands the bare path to this
// file for every other file in components/, so it would import itself and
// the desktop would open blank (1.0.66.14, the 1.0.52.3 bug again).
const Imported = require('react-native-web/dist/exports/TouchableOpacity/index');
const { withVoiceName } = require('./voiceNamedControl');

const Original = Imported && Imported.default ? Imported.default : Imported;

module.exports = { __esModule: true, default: withVoiceName(Original, 'TouchableOpacity') };
