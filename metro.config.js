const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('db');

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
