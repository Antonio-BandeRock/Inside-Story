import { useEffect, useState } from 'react';

// Same tick-forcing pattern as useIridescentHueRotation.ts -- state exists
// purely to trigger a re-render on an interval; the returned value is
// always read fresh from `new Date()`, never accumulated, so there's
// nothing for multiple components using this to drift out of sync on.
export function useNow(intervalMs = 60_000): Date {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((tick) => tick + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return new Date();
}
