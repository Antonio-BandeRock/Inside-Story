import { useEffect, useState } from 'react';
import { isHomeDataReady, subscribeToHomeDataReady } from '../lib/homeReadySignal';

// A live read of lib/homeReadySignal.ts's own "has Home finished its first
// real load yet" flag -- starts from whatever's already true (so a later
// remount of this hook, e.g. after the very first launch, never gets stuck
// waiting on a signal that already fired once this session), stays live
// afterward via the module's own subscriber list. app/_layout.tsx is the
// one real consumer -- its own startup gate needs to know this to decide
// when DatabaseSetupScreen can finally clear.
export function useHomeDataReady(): boolean {
  const [ready, setReady] = useState(isHomeDataReady());

  useEffect(() => {
    if (ready) return;
    return subscribeToHomeDataReady(() => setReady(true));
  }, [ready]);

  return ready;
}
