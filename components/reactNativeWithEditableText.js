// React Native with Text swapped for components/EditableText.tsx, so every
// piece of text in this app can be tapped and changed while Tell Claude's
// Edit wording mode is on (1.0.51.12). metro.config.js hands this module to
// this app's own files in place of 'react-native'; libraries in
// node_modules, EditableText.tsx and this file still get React Native itself.
//
// Every other export is passed through as a getter, so nothing is read from
// React Native until something asks for it, the same laziness React
// Native's own index relies on.
const ReactNative = require('react-native');
const { EditableText } = require('./EditableText');

const withEditableText = {};
for (const key of Object.getOwnPropertyNames(ReactNative)) {
  if (key === 'Text') continue;
  Object.defineProperty(withEditableText, key, {
    enumerable: true,
    configurable: true,
    get: () => ReactNative[key],
  });
}
Object.defineProperty(withEditableText, 'Text', { enumerable: true, configurable: true, value: EditableText });

module.exports = withEditableText;
