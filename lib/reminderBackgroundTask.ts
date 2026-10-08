// A press on a reminder's button saved even with the app fully closed
// (2026-10-01). Until now a press reached the app only once it was next
// opened, because the answer was handled by a listener that exists only
// while the app runs; Android queued the press and handed it over on the
// next start, so the press seemed to do nothing until then.
//
// expo-notifications runs this task in the background whenever a reminder
// is answered and the app is not in front. It is defined here, at module
// scope, and this file is imported first from index.js, so the task exists
// before Android asks for it on a start the press itself caused. A tap is
// left to the app, since a tap opens it. The same press handed to the app
// again on its next start is recognised there and does nothing a second
// time (claimAnswer in lib/reminderNotifications.ts).
//
// The same task receives the relay's wake-up (M1, 1.0.62.2): a data-only
// message from Google saying mail is waiting for this phone at
// insidestoryapp.com. It shows nothing; lib/pushWake.ts collects the mail,
// and does nothing at all while App Lock is locked.
//
// Android only: on iOS a button press already wakes the app for it, and
// the desktop has no reminders with buttons.

import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { isAppLockedError } from './appLockSession';
import { answerFromBackground } from './reminderNotifications';
import { isRelayWake } from './relayWake';

export const REMINDER_ANSWER_TASK = 'inside-story-reminder-answer';

// The task is handed the response as Android serialised it, before
// expo-notifications' own mapping runs, so a reminder's payload (its kind and
// schedule item) arrives as the text `content.dataString` and `content.data`
// is empty. The app's listener gets the parsed copy; this does the same
// parsing here, which is why a press with the phone locked recorded nothing
// until 1.0.64.1.
function withParsedData(response: Notifications.NotificationResponse): Notifications.NotificationResponse {
  const content = response.notification.request.content as Notifications.NotificationContent & { dataString?: unknown };
  if (content.data && Object.keys(content.data).length > 0) return response;
  if (typeof content.dataString !== 'string') return response;
  try {
    const data = JSON.parse(content.dataString) as Record<string, unknown>;
    return {
      ...response,
      notification: {
        ...response.notification,
        request: { ...response.notification.request, content: { ...content, data } },
      },
    };
  } catch {
    return response;
  }
}

function isResponse(data: unknown): data is Notifications.NotificationResponse {
  return typeof data === 'object' && data !== null && 'actionIdentifier' in data && 'notification' in data;
}

if (Platform.OS === 'android') {
  try {
    TaskManager.defineTask(REMINDER_ANSWER_TASK, async ({ data, error }) => {
      if (error) {
        console.error('[reminderBackgroundTask] task error', error);
        return;
      }
      if (!isResponse(data)) {
        if (isRelayWake(data)) {
          const { collectAfterWake } = await import('./pushWake');
          await collectAfterWake();
        }
        return;
      }
      try {
        await answerFromBackground(withParsedData(data));
      } catch (answerError) {
        // With App Lock on and nobody unlocked the press is sealed for the
        // next unlock before anything opens the database (answerWhileLocked
        // in lib/reminderNotifications.ts). A locked error here means the
        // lock came on partway through, and the press is let go quietly.
        if (isAppLockedError(answerError)) return;
        console.error('[reminderBackgroundTask] answer failed', answerError);
      }
    });
    Notifications.registerTaskAsync(REMINDER_ANSWER_TASK).catch((registerError) =>
      console.error('[reminderBackgroundTask] could not register', registerError),
    );
  } catch (defineError) {
    // A build from before 1.0.58.2 has no task manager in it; presses are
    // then answered when the app opens, as before.
    console.error('[reminderBackgroundTask] not available', defineError);
  }
}
