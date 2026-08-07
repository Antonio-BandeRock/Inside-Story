import { useEffect, useState } from 'react';
import {
  getCachedVisualPreferences,
  getVisualPreferences,
  subscribeToVisualPreferences,
  type VisualPreferences,
} from '../lib/visualPreferences';

// A live, app-wide read of the visual preferences (lib/visualPreferences.ts)
// -- starts from whatever's already cached (the real defaults on a cold
// start, so the very first frame renders exactly as it always has), loads
// the real stored value once, and stays live afterward via the module's own
// subscriber list, so a change saved on the Profile screen reaches the
// shared background and every tab's own revealed background immediately,
// with no app restart needed.
export function useVisualPreferences(): VisualPreferences {
  const [prefs, setPrefs] = useState<VisualPreferences>(getCachedVisualPreferences());

  useEffect(() => {
    let isMounted = true;

    getVisualPreferences().then((loaded) => {
      if (isMounted) setPrefs(loaded);
    });

    const unsubscribe = subscribeToVisualPreferences((next) => {
      if (isMounted) setPrefs(next);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return prefs;
}
