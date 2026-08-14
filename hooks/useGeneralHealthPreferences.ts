import { useEffect, useState } from 'react';
import {
  getCachedGeneralHealthPreferences,
  getGeneralHealthPreferences,
  subscribeToGeneralHealthPreferences,
  type GeneralHealthPreferences,
} from '../lib/generalHealthPreferences';

// A live, app-wide read of the general-health mute preferences
// (lib/generalHealthPreferences.ts) -- same shape as useVisualPreferences:
// starts from whatever's already cached (nothing muted, on a cold start,
// matching today's actual shipped behavior), loads the real stored value
// once, and stays live afterward via the module's own subscriber list, so
// a mute toggled on Profile reaches every mounted builder's own
// GeneralHealthAdvisories row immediately, with no app restart needed.
export function useGeneralHealthPreferences(): GeneralHealthPreferences {
  const [prefs, setPrefs] = useState<GeneralHealthPreferences>(getCachedGeneralHealthPreferences());

  useEffect(() => {
    let isMounted = true;

    getGeneralHealthPreferences().then((loaded) => {
      if (isMounted) setPrefs(loaded);
    });

    const unsubscribe = subscribeToGeneralHealthPreferences((next) => {
      if (isMounted) setPrefs(next);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return prefs;
}
