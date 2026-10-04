// Always say why (1.0.60.16). Direct instruction, 2026-10-03, after a new
// garden area refused to save without a word because it had no name yet:
// "When a user hasn't yet achieved the requirements to complete a process,
// they should be provided the reason why."
//
// So a button that cannot do its job yet never does nothing. It stays
// pressable (dimmed, if the screen dims it), and pressing it calls
// explainNotYet with the one thing still missing, said plainly. `disabled`
// is kept for while something is already running, which is a different
// thing from something the person has not filled in.
//
// The popup is drawn once at the app root (components/NotYetHost.tsx) so a
// screen needs no element of its own. scripts/audit_silent_refusals.js finds
// handlers that return silently on an empty field, and buttons disabled by
// one, and must stay at 0.
import { Alert } from 'react-native';

type NotYetListener = (title: string, message: string) => void;

let listener: NotYetListener | null = null;

export const NOT_YET_TITLE = 'Not Ready Yet';

/** components/NotYetHost.tsx registers itself here; null when it unmounts. */
export function setNotYetListener(next: NotYetListener | null): void {
  listener = next;
}

/**
 * Says why something cannot happen yet. Returns false, so a handler can end
 * with `return explainNotYet('...')` where it used to `return`.
 */
export function explainNotYet(message: string, title: string = NOT_YET_TITLE): false {
  if (listener) listener(title, message);
  else Alert.alert(title, message);
  return false;
}
