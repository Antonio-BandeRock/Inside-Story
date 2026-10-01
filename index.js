// The app's entry. The reminder task is defined before anything else so a
// button pressed with the app closed is answered on the start that press
// causes (lib/reminderBackgroundTask.ts); then Expo Router starts the app.
import './lib/reminderBackgroundTask';
import 'expo-router/entry';
