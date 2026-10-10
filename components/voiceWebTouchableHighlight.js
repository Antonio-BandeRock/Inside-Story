// The desktop half of the voice control swap for TouchableHighlight (1.0.66.11). On the
// web target babel-preset-expo rewrites `import { TouchableHighlight } from
// 'react-native'` into a deep import of
// 'react-native-web/dist/exports/TouchableHighlight', and metro.config.js hands this
// app's own files this module for that path instead. See
// components/voiceNamedControl.js.
const Imported = require('react-native-web/dist/exports/TouchableHighlight');
const { withVoiceName } = require('./voiceNamedControl');

const Original = Imported && Imported.default ? Imported.default : Imported;

module.exports = { __esModule: true, default: withVoiceName(Original, 'TouchableHighlight') };
