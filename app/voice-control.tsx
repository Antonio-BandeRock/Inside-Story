// Where the Voice Control tile and shade button land (1.0.66.13).
//
// Direct request, 2026-10-10: "it forces the unlock of the phone and then
// allows the voice control." CaptureLauncherActivity (plugins/withCaptureTile.js)
// asks for the phone's unlock first and only then opens
// hashimotosapp://voice-control, so nothing here runs over the lock screen,
// and App Lock asks for the Lifestead code before this screen is drawn, as it
// does for every screen.
//
// Draws nothing. It opens Voice Control, which lives at the root and so
// outlasts this screen, then steps back to whatever screen the app was on,
// or Home when the app was not open, so the commands act on that screen.
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { openQuickAccessSheet } from '../lib/quickAccess';

export default function VoiceControlLanding() {
  const router = useRouter();
  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
    // After the step back, so Voice Control opens over the screen it will act on.
    setTimeout(() => openQuickAccessSheet('voiceCommand'), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
