import { requireOptionalNativeModule } from 'expo';

// Null on a binary built before 1.0.58.2, on iPhone and on the desktop app,
// so every caller treats null as "nothing to say".
export type ReminderTimingModule = {
  canScheduleExactAlarms(): boolean;
  isIgnoringBatteryOptimizations(): boolean;
  openExactAlarmSettings(): void;
  openAppSettings(): void;
};

export default requireOptionalNativeModule<ReminderTimingModule>('ReminderTiming');
