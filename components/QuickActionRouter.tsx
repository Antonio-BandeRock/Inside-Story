// Sets the app icon shortcuts (C12, lib/quickActions.ts) and follows a tap
// on one, including the tap that started the app. Mounted in the tabs
// layout rather than the root layout, since expo-quick-actions navigates
// as soon as it hears an action and the root layout is not ready to be
// navigated from. Renders nothing. Phone only: the desktop has no app icon
// to long press, and its build swaps the package for a stand-in.
import { Platform } from 'react-native';
import { useEffect } from 'react';
import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { isDesktopApp } from '../lib/desktop/bridge';
import { QUICK_ACTIONS } from '../lib/quickActions';

const ON_PHONE = Platform.OS !== 'web' && !isDesktopApp();

function PhoneQuickActions() {
  useQuickActionRouting();
  useEffect(() => {
    QuickActions.setItems([...QUICK_ACTIONS]).catch((error) => console.warn('[QuickActionRouter] shortcuts not set', error));
  }, []);
  return null;
}

export function QuickActionRouter() {
  return ON_PHONE ? <PhoneQuickActions /> : null;
}
