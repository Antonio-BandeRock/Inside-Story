import { useEffect, useState } from 'react';
import {
  getCachedReminderPreferences,
  getReminderPreferences,
  subscribeToReminderPreferences,
  type ReminderPreferences,
} from '../lib/reminderPreferences';

// A live read of which reminder kinds are allowed to fire
// (lib/reminderPreferences.ts). Same shape as useGeneralHealthPreferences
// and useVisualPreferences: starts from whatever is cached, which on a cold
// start is the defaults the reconcile would have used anyway, loads the
// stored value once, and stays live through the module's subscriber list.
export function useReminderPreferences(): ReminderPreferences {
  const [prefs, setPrefs] = useState<ReminderPreferences>(getCachedReminderPreferences());

  useEffect(() => {
    let isMounted = true;

    getReminderPreferences().then((loaded) => {
      if (isMounted) setPrefs(loaded);
    });

    const unsubscribe = subscribeToReminderPreferences((next) => {
      if (isMounted) setPrefs(next);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return prefs;
}
