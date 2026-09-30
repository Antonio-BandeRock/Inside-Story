// Reads every Ecowitt gateway this device reads, while the app is open (I20,
// I22). Nothing here draws; it is mounted once in app/_layout.tsx.
//
// A tick every 30 seconds asks lib/ecowittDb.ts which gateways are due. The
// tick only runs while the app is in the foreground, and when the app is
// put away the hours and days read so far are worked out, so what the other
// device receives on the next save includes the hour that was going on.
//
// On the computer, a gateway set to send its readings is received rather
// than asked: while any such gateway is read here, the tick keeps the
// listener in desktop/stationListener.js running, and every post it passes
// on is kept through receiveStationReport. Minimising the window leaves the
// listener running; only a tick that finds no sending gateway here stops it.

import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

// Readings keep arriving while the other device has the session
// (lib/syncSession.ts): nobody is there to take them again later.
import { withSessionGuardLifted } from '@/lib/databaseActivity';
import { getDesktopBridge, isDesktopApp } from '@/lib/desktop/bridge';
import { gatewaysReadHere, getListenPort, readDueGateways, receiveStationReport, workOutAllGateways } from '@/lib/ecowittDb';

const TICK_MS = 30_000;

function stationListener() {
  return isDesktopApp() ? getDesktopBridge().stationListener ?? null : null;
}

export default function EcowittPoller() {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let busy = false;
    let stopped = false;

    const listener = stationListener();
    const unsubscribe = listener
      ? listener.onReport((report) => {
          withSessionGuardLifted(() => receiveStationReport(report)).catch((error) => console.warn('[EcowittPoller] a station reading could not be kept', error));
        })
      : null;

    const tick = async () => {
      if (busy || stopped) return;
      busy = true;
      try {
        const here = await gatewaysReadHere();
        if (listener) {
          if (here.sent > 0) await listener.start(await getListenPort());
          else await listener.stop();
        }
        if (here.asked > 0 || here.toWorkOut > 0) await withSessionGuardLifted(readDueGateways);
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
        withSessionGuardLifted(workOutAllGateways).catch((error) => console.warn('[EcowittPoller] working out failed', error));
      }
    };

    if (AppState.currentState === 'active' || AppState.currentState == null) start();
    const subscription = AppState.addEventListener('change', onChange);
    return () => {
      stopped = true;
      stop();
      unsubscribe?.();
      subscription.remove();
    };
  }, []);

  return null;
}
