import { useEffect, useState } from 'react';

// One full 360-degree rotation every 36 seconds, shared by every
// iridescent element in the app (the header's own app-name text, its
// divider line, and the footer's divider line above TabHub) -- deriving
// the current hue from Date.now() rather than each element accumulating
// its own local +=degree state keeps any number of independent component
// instances in perfect lockstep automatically, with no context or shared
// state needed between them: they're all just reading the same clock.
const ROTATION_PERIOD_MS = 36000;

// tickMs only controls how often a given component using this hook
// re-renders to pick up the new value -- it does not affect the
// rotation's own speed, which is fixed by ROTATION_PERIOD_MS above.
export function useIridescentHueRotation(tickMs = 50): number {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((tick) => tick + 1), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  return ((Date.now() % ROTATION_PERIOD_MS) / ROTATION_PERIOD_MS) * 360;
}
