// Which bands on a screen are open, remembered across launches, 2026-09-13.
//
// Home's own sections have folded to one row since 2026-09-12, with the
// open/closed state kept in visual preferences so what someone leaves open
// stays open. Schedules is the first tab whose lenses take the same fold
// ("Everything folds", every band closed until tapped), and the same rule
// has to hold there: a day's meal list folded shut on every visit would
// cost a tap each time. So the state persists per band, keyed by a string
// each screen chooses ("schedule:meals:day"), absence meaning folded, the
// contract homeSectionExpanded already set, with the short list of
// exceptions in BANDS_OPEN_UNTIL_CLOSED reading the other way.
//
// One hook per screen. It loads once, answers synchronously from then on,
// and writes through setVisualPreferences on every toggle, the same as
// Home's own handler. Until the load lands every band reads as whatever it
// starts as, which is where it would have landed anyway, so nothing springs
// open and shut.
import { useCallback, useEffect, useState } from 'react';
import { getVisualPreferences, isBandOpen, setVisualPreferences } from '../lib/visualPreferences';

export function useBandFolds() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isCurrent = true;
    getVisualPreferences()
      .then((prefs) => {
        if (isCurrent) setExpanded(prefs.bandExpanded ?? {});
      })
      .catch((error) => {
        console.warn('[useBandFolds] Could not load band folds', error);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const isOpen = useCallback((key: string) => isBandOpen(expanded, key), [expanded]);

  // Reads the same default isOpen does, so the first tap on a band that
  // starts open closes it rather than recording the state it was already in
  // and looking like nothing happened.
  const toggle = useCallback((key: string) => {
    setExpanded((current) => {
      const next = { ...current, [key]: !isBandOpen(current, key) };
      void setVisualPreferences({ bandExpanded: { [key]: next[key] } }).catch((error) => {
        console.warn('[useBandFolds] Could not save a band fold', error);
      });
      return next;
    });
  }, []);

  return { isOpen, toggle };
}
