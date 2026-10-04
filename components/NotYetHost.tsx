// The popup behind lib/notYet.ts's explainNotYet: the one reason a button
// cannot do its job yet. Mounted once at the app root (app/_layout.tsx).
import { useEffect } from 'react';
import { setNotYetListener } from '../lib/notYet';
import { useInfoAlert } from './InfoAlert';

export function NotYetHost() {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  useEffect(() => {
    setNotYetListener(showInfoAlert);
    return () => setNotYetListener(null);
  }, [showInfoAlert]);

  return <>{infoAlertElement}</>;
}
