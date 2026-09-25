const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('db');

// Tell Claude's Edit wording mode (1.0.51.12): this app's own files get
// components/reactNativeWithEditableText.js when they import 'react-native',
// which is React Native with Text swapped for components/EditableText.tsx,
// so any words on screen can be tapped and changed without the files that
// draw them knowing. Libraries in node_modules, and the files that
// build the swap, get React Native itself. While the Tell Claude switch is
// off the swapped Text renders exactly as React Native's does. Neither
// @expo/fingerprint nor the runtime version reads this file, so this ships
// as an ordinary update. On the web target, which the Windows app runs,
// babel-preset-expo has already rewritten each named import into a deep
// import such as 'react-native-web/dist/exports/Text', so that path is
// swapped for components/editableTextForWeb.js the same way.
const OWN_SOURCE_FOLDERS = new Set(['app', 'components', 'lib', 'constants', 'hooks']);
const EDITABLE_TEXT_FILES = new Set([
  path.join(__dirname, 'components', 'reactNativeWithEditableText.js'),
  path.join(__dirname, 'components', 'EditableText.tsx'),
  path.join(__dirname, 'components', 'editableTextForWeb.js'),
]);
const WEB_TEXT_MODULES = new Set(['react-native-web/dist/exports/Text', 'react-native-web/dist/cjs/exports/Text']);
function editableTextFor(context, moduleName) {
  const web = WEB_TEXT_MODULES.has(moduleName);
  if (moduleName !== 'react-native' && !web) return null;
  const origin = context.originModulePath;
  if (!origin || EDITABLE_TEXT_FILES.has(origin)) return null;
  const relative = path.relative(__dirname, origin);
  const top = relative.split(path.sep)[0];
  if (!OWN_SOURCE_FOLDERS.has(top)) return null;
  const swap = web ? 'editableTextForWeb.js' : 'reactNativeWithEditableText.js';
  return { type: 'sourceFile', filePath: path.join(__dirname, 'components', swap) };
}
{
  const upstream = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) =>
    editableTextFor(context, moduleName) ?? (upstream || context.resolveRequest)(context, moduleName, platform);
}

// The desktop app (desktop/, an Electron shell around this same code on
// its web target) is built with INSIDE_STORY_DESKTOP=1 in the environment.
// Under that flag, and only on the web platform, a handful of modules
// resolve to a desktop stand-in in lib/desktop/ instead of the package:
// expo-sqlite becomes a bridge to SQLite running in Electron's main
// process, the 160 MB reference database is left out of the bundle (the
// installer ships it beside the app and copies it into place on first
// run), and the phone-only native modules become stubs that report
// themselves unavailable rather than failing to load. A phone build never
// sets the flag, so nothing here reaches the Android or iOS bundle, and
// @expo/fingerprint does not hash this file, so the runtime version is
// unaffected either way.
if (process.env.INSIDE_STORY_DESKTOP === '1') {
  const shims = {
    'expo-sqlite': 'lib/desktop/expoSqliteShim.ts',
    'expo-secure-store': 'lib/desktop/secureStoreShim.ts',
    'expo-notifications': 'lib/desktop/notificationsShim.ts',
    'expo-file-system': 'lib/desktop/fileSystemShim.ts',
    'expo-speech-recognition': 'lib/desktop/unavailableModule.ts',
    'react-native-health-connect': 'lib/desktop/unavailableModule.ts',
    'react-native-zeroconf': 'lib/desktop/unavailableModule.ts',
    '@dr.pogodin/react-native-static-server': 'lib/desktop/unavailableModule.ts',
    'rn-mlkit-ocr': 'lib/desktop/unavailableModule.ts',
  };
  const defaultResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web') {
      if (moduleName.endsWith('assets/data/foods_reference.db')) {
        return { type: 'empty' };
      }
      const shim = shims[moduleName];
      if (shim) {
        return { type: 'sourceFile', filePath: path.join(__dirname, shim) };
      }
    }
    return (defaultResolveRequest || context.resolveRequest)(context, moduleName, platform);
  };
}

module.exports = config;
