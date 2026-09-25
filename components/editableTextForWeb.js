// The web half of the Text swap (1.0.51.12). On the web target, which is
// what the Windows app runs, babel-preset-expo rewrites
// `import { Text } from 'react-native'` into a direct import of
// 'react-native-web/dist/exports/Text' before Metro resolves anything, so
// metro.config.js hands this app's own files this module for that path
// instead. It has the shape the rewritten import reads: a default export.
const { EditableText } = require('./EditableText');

module.exports = { __esModule: true, default: EditableText };
