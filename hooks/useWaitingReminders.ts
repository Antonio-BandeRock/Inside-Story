import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { listWaitingReminders, refreshWaitingSummary } from '../lib/reminderNotifications';
import type { WaitingGroup } from '../lib/waitingAnswers';

const PHONE = Platform.OS === 'android' || Platform.OS === 'ios';

// The reminders still showing on the phone, grouped (1.0.60.3, shared by
// Home's Waiting for an Answer card and the full screen). Read from the
// phone each time the screen comes into view, when a reminder arrives while
// the app is open, and when the app comes back to the front, so what the
// phone has taken away is gone here too. Nothing is kept. On a computer it
// is always an empty list, since reminders show up on the phone.
export function useWaitingReminders(): { groups: WaitingGroup[] | null; now: number; reload: () => Promise<void> } {
  const [groups, setGroups] = useState<WaitingGroup[] | null>(PHONE ? null : []);
  const [now, setNow] = useState(Date.now());
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    if (!PHONE) return;
    try {
      const found = await listWaitingReminders();
      if (mounted.current) {
        setGroups(found);
        setNow(Date.now());
      }
    } catch (error) {
      console.error('[waiting-answers] could not read what is showing', error);
      if (mounted.current) setGroups([]);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
      if (PHONE) void refreshWaitingSummary();
    }, [reload]),
  );

  useEffect(() => {
    if (!PHONE) return;
    const arrivals = Notifications.addNotificationReceivedListener(() => void reload());
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reload();
    });
    return () => {
      arrivals.remove();
      appState.remove();
    };
  }, [reload]);

  return { groups, now, reload };
}
