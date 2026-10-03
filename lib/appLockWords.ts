// The words App Lock uses for the device it is on (1.0.60.7). The phone
// opens with a fingerprint or face; the computer opens with Windows Hello,
// which covers a face, a fingerprint or the Windows Hello PIN. Everything
// else App Lock says is the same on both, so only these few words change.

import { isDesktopApp } from './desktop/bridge';

/** "fingerprint or face" on the phone, "Windows Hello" on the computer, for the middle of a sentence. */
export function biometricWords(): string {
  return isDesktopApp() ? 'Windows Hello' : 'fingerprint or face';
}

/** The same in title case, for a heading or a button. */
export function biometricTitle(): string {
  return isDesktopApp() ? 'Windows Hello' : 'Fingerprint or Face';
}

/** "phone" or "computer". */
export function deviceWord(): 'phone' | 'computer' {
  return isDesktopApp() ? 'computer' : 'phone';
}
