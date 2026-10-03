// The app's entry. The reminder task is defined before anything else so a
// button pressed with the app closed is answered on the start that press
// causes (lib/reminderBackgroundTask.ts). The home screen widgets' task
// (L2) is registered here for the same reason: Android asks a widget for its
// look with the app closed. Then Expo Router starts the app.
import './lib/reminderBackgroundTask';
import './lib/widgets/taskHandler';
import 'expo-router/entry';
