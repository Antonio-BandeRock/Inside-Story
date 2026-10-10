import { requireOptionalNativeModule } from 'expo';

// Null on a binary built before 1.0.62.1, on iPhone and on the desktop app,
// so every caller treats null as "this phone cannot do it yet".
export type LockedCaptureModule = {
  /** Closes the capture screen shown over the lock screen. */
  finishCapture(): void;
  /** Keeps the Voice Note, Photo and Voice Control buttons in the notification shade. */
  showShadeButtons(): boolean;
  hideShadeButtons(): void;
  isShowingShadeButtons(): boolean;
  /**
   * The emergency lines as a notification whose tap shows them over the lock
   * screen. Missing on a binary built before 1.0.63.12, so callers check
   * that it is a function and fall back to expo-notifications.
   */
  showEmergencyNotice?(title: string, body: string): boolean;
  hideEmergencyNotice?(): void;
};

export default requireOptionalNativeModule<LockedCaptureModule>('LockedCapture');
