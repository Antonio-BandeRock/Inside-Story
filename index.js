// The app's entry. The reminder task is defined before anything else so a
// button pressed with the app closed is answered on the start that press
// causes (lib/reminderBackgroundTask.ts). The home screen widgets' task
// (L2) is registered here for the same reason: Android asks a widget for its
// look with the app closed. Then Expo Router starts the app.
import './lib/reminderBackgroundTask';
import './lib/widgets/taskHandler';
import { AppRegistry, Platform } from 'react-native';
import 'expo-router/entry';

// The capture screen over the phone lock screen (1.0.62.1), shown by
// LockedCaptureActivity (plugins/withCaptureTile.js), which also shows the
// emergency lines when the emergency notification is tapped. Loaded only when that
// screen opens, and never the app itself. It says it is showing as it
// starts rather than once it has drawn, since the lock gate checks in that
// gap and once restarted the app under the screen (2026-10-07).
if (Platform.OS === 'android') {
  AppRegistry.registerComponent('LockedCapture', () => {
    require('./lib/lockedCaptures').setLockedCaptureShowing(true);
    const { LockedCaptureScreen } = require('./components/LockedCaptureScreen');
    const { LockedEmergencyView } = require('./components/LockedEmergencyView');
    const React = require('react');
    // The emergency notification opens the same activity in mode
    // "emergency", which shows the emergency lines instead (1.0.63.12).
    return function LockedScreen(props) {
      return props.mode === 'emergency'
        ? React.createElement(LockedEmergencyView)
        : React.createElement(LockedCaptureScreen, props);
    };
  });
}
