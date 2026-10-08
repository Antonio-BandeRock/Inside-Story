// TEMPORARY (1.0.64.1): where a reminder press stops while the phone is
// locked. A preview build sends nothing from JavaScript to the phone's log,
// so each step posts a silent notification on a channel nobody hears, named
// for the step, and takes it straight off again. Android logs the name, which
// is all that is needed. No record, no words typed and no health content is
// in a name: only the step, the kind of reminder and the button. Remove once
// the locked press is fixed.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'press-trace';
let channelReady: Promise<unknown> | null = null;
let count = 0;

export function tracePress(step: string, ...parts: (string | number | boolean | null | undefined)[]): void {
  if (Platform.OS !== 'android') return;
  const id = `trace:${++count}:${step}:${parts.map((part) => String(part ?? '-')).join(':')}`.slice(0, 180);
  void (async () => {
    try {
      channelReady ??= Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Press trace',
        importance: Notifications.AndroidImportance.MIN,
        sound: null,
        enableVibrate: false,
        showBadge: false,
      });
      await channelReady;
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: { title: 'trace', body: step, sound: false },
        trigger: { channelId: CHANNEL },
      });
      await Notifications.dismissNotificationAsync(id);
    } catch {
      // A trace that cannot be posted changes nothing.
    }
  })();
}
