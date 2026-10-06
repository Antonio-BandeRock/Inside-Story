import { requireOptionalNativeModule } from 'expo';

// Null on a binary built before 1.0.62.1, on iPhone and on the desktop app,
// so every caller treats null as "this phone cannot do it yet".
export type LockedCaptureModule = {
  /** Closes the capture screen shown over the lock screen. */
  finishCapture(): void;
  /** Keeps the Voice Note and Photo buttons in the notification shade. */
  showShadeButtons(): boolean;
  hideShadeButtons(): void;
  isShowingShadeButtons(): boolean;
};

export default requireOptionalNativeModule<LockedCaptureModule>('LockedCapture');
