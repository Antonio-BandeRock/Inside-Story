// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'desktop/node_modules/*', 'desktop/web-build/*', 'desktop/dist/*'],
  },
  // desktop/*.js is Electron's main process and preload: Node code, not
  // app code, so it gets Node's globals.
  {
    files: ['desktop/*.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        Buffer: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'writable',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        Response: 'readonly',
      },
    },
  },
]);
