// Reads every Ecowitt gateway this device is set to read, while the app is
// open (I20). Nothing here draws; it is mounted once in app/_layout.tsx.
//
// A tick every 30 seconds asks lib/ecowittDb.ts which gateways are due. The
// tick only runs while the app is in the foreground, and when the app is
// put away the hours and days read so far are worked out, so what the other
// device receives on the next save includes the hour that was going on.

import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { anyGatewayReadHere, readDueGateways, workOutAllGateways } from '@/lib/ecowittDb';

const TICK_MS = 30_000;

export default function EcowittPoller() {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let busy = false;
    let stopped = false;

    const tick = async () => {
      if (busy || stopped) return;
      busy = true;
      try {
        if (await anyGatewayReadHere()) await readDueGateways();
      } catch (error) {
        console.warn('[EcowittPoller] reading failed', error);
      } finally {
        busy = false;
      }
    };

    const start = () => {
      if (timer) return;
      void tick();
      timer = setInterval(() => void tick(), TICK_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        start();
      } else {
        stop();
        workOutAllGateways().catch((error) => console.warn('[EcowittPoller] working out failed', error));
      }
    };

    if (AppState.currentState === 'active' || AppState.currentState == null) start();
    const subscription = AppState.addEventListener('change', onChange);
    return () => {
      stopped = true;
      stop();
      subscription.remove();
    };
  }, []);

  return null;
}
