import { useCallback, useRef, useState, type ReactNode } from 'react';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';

export interface ConfirmSheetRequest {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
}

// A real, promise-based, app-styled replacement for Alert.alert's own
// Cancel/Confirm shape -- 2026-08-16, built specifically so backup/
// restore's own real destructive confirm ("Restore this backup? This will
// replace everything currently on this device... This can't be undone.")
// no longer has to be a native system dialog. Matches the exact same
// [triggerFn, element] shape PasswordPrompt.tsx/InfoAlert.tsx already
// establish, so `const ok = await confirm({...})` reads identically to
// this app's own already-proven `await promptPassword(...)` pattern.
//
// A real, non-obvious wrinkle worth naming, not glossed over: AppActionSheet's
// own handleSelect calls its `onClose` prop BEFORE the tapped action's own
// onPress, for every real action -- so a naive "onClose resolves false"
// would always fire ahead of, and therefore always beat, a real Confirm
// tap's own "resolve true," making Confirm silently behave like Cancel.
// Fixed by deferring onClose's own false-resolve by one real macrotask
// (setTimeout 0): a genuine backdrop tap (nothing else ever resolves the
// promise) still correctly resolves false once that deferred check runs,
// while a real action tap's own SYNCHRONOUS resolve -- which fires before
// the deferred check ever gets a turn -- always wins instead.
export function useConfirmSheet(): [(request: ConfirmSheetRequest) => Promise<boolean>, ReactNode] {
  const [request, setRequest] = useState<ConfirmSheetRequest | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const settledRef = useRef(true);

  function settle(value: boolean) {
    if (settledRef.current) return;
    settledRef.current = true;
    resolveRef.current?.(value);
    resolveRef.current = null;
    setRequest(null);
  }

  const confirm = useCallback((next: ConfirmSheetRequest): Promise<boolean> => {
    settledRef.current = false;
    setRequest(next);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const actions: AppActionSheetAction[] = request
    ? [
        { label: request.cancelLabel ?? 'Cancel', onPress: () => settle(false) },
        { label: request.confirmLabel, onPress: () => settle(true), destructive: request.destructive },
      ]
    : [];

  const element = (
    <AppActionSheet
      visible={request !== null}
      onClose={() => {
        // Deferred -- see this file's own header comment for why. A real
        // action tap's own synchronous settle() above always wins first;
        // this only ever actually resolves anything for a genuine
        // backdrop-tap dismiss, where nothing else resolves the promise.
        setTimeout(() => settle(false), 0);
      }}
      title={request?.title}
      message={request?.message}
      actions={actions}
    />
  );

  return [confirm, element];
}
