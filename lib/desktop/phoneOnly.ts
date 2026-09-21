// What the computer version cannot do, and the sentence that says so.
//
// Direct instruction, 2026-09-21, the first day the desktop build ran:
// "the Windows version needs to let the user know when anything their
// computer can't do is selected. They can't use the windows version to
// scan products, they have to use their mobile app for that."
//
// The desktop build (desktop/, the same code in an Electron window) has no
// camera the app can use, no on-device speech recognizer, no Health
// Connect, no mDNS and no LAN server, and it cannot yet keep or show a
// picked photo. metro.config.js swaps each of those packages for
// lib/desktop/unavailableModule.ts, which loads and does nothing, so a
// screen that reaches one used to look broken rather than saying anything:
// the scanner lens asked for camera access that never came, the Movement
// lens said "this phone cannot share health data", and the microphone
// button reported that speech recognition was not available "right now".
//
// This is the one list of those things, one entry per feature, each with
// the sentence that names what the phone does instead. Everything that
// says it goes through here (components/PhoneOnlyNotice.tsx for a lens or
// screen that is phone-only as a whole, announcePhoneOnly below for a
// button), so a feature that reaches the desktop later is removed from this
// list once and every notice for it goes with it. No React and no bridge
// call in here, so scripts/test_phone_only.js covers the wording.
import { isDesktopApp } from './bridge';

export type PhoneOnlyFeature =
  | 'scanProduct'
  | 'photo'
  | 'voice'
  | 'readPrice'
  | 'healthConnect'
  | 'wifiSync'
  | 'scanPairingCode';

export const PHONE_ONLY_TITLE = 'This needs the app on your phone';

export type PhoneOnlyNotice = {
  title: string;
  message: string;
};

const MESSAGES: Record<PhoneOnlyFeature, string> = {
  scanProduct:
    "Scanning a product uses the phone's camera, and this computer has no way to do it. Open Inside Story on your phone and scan the product there.",
  photo:
    'Photos are taken and kept on the phone for now. This computer cannot take one or bring one in yet. Add the photo from Inside Story on your phone.',
  voice:
    'Speaking to the app works on the phone, which listens on the device itself. This computer has no way to do that, so type it here, or say it on your phone.',
  readPrice:
    "Reading a price off a shelf label uses the phone's camera. On this computer, type the price in. On your phone, point the camera at the label.",
  healthConnect:
    'Steps, sleep and the rest come from Health Connect on an Android phone, and this computer has nothing to read them from. Connect from Inside Story on your phone.',
  wifiSync:
    'Sync over Wi-Fi runs between two phones in the same place. This computer cannot join it. Use Inside Story on your phone.',
  scanPairingCode:
    "Reading the code on the other person's phone uses the camera. On this computer, show your code for them to scan, or send a link instead. On your phone, point the camera at their code.",
};

export const PHONE_ONLY_FEATURES: readonly PhoneOnlyFeature[] = Object.keys(MESSAGES) as PhoneOnlyFeature[];

export function phoneOnlyNotice(feature: PhoneOnlyFeature): PhoneOnlyNotice {
  return { title: PHONE_ONLY_TITLE, message: MESSAGES[feature] };
}

/**
 * For a button whose action is phone-only: on the desktop build, shows the
 * notice through the screen's own showInfoAlert and returns true, so the
 * caller returns without starting the action. On a phone it does nothing
 * and returns false.
 */
export function announcePhoneOnly(
  showInfoAlert: (title: string, message: string) => void,
  feature: PhoneOnlyFeature,
): boolean {
  if (!isDesktopApp()) return false;
  const notice = phoneOnlyNotice(feature);
  showInfoAlert(notice.title, notice.message);
  return true;
}
