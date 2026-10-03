import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";
import { textShadow, typography } from "../constants/typography";
import { waitLabel, type PasscodeKind } from "../lib/appLock";
import { biometricTitle } from "../lib/appLockWords";
import {
  checkPasscode,
  clearWrongTries,
  passcodeWaitRemaining,
  unlockWithBiometric,
} from "../lib/appLockDevice";
import { PasscodeEntry } from "./PasscodeEntry";

// Asking for the passcode, or the fingerprint or face, when the app is
// already open: before App Lock settings change, before the lock is turned
// off, and before records leave the phone (R10 of docs/app-lock-spec.md,
// through lib/freshAuth.ts). Every passcode goes through checkPasscode, so
// the wait after five wrong tries holds here the same as on the lock screen.

type Props = {
  kind: PasscodeKind;
  title: string;
  intro?: string;
  /** Offers the fingerprint or face, and asks for it straight away. */
  biometric: boolean;
  onVerified: (key: Uint8Array) => void;
  onCancel?: () => void;
};

export function ConfirmItsYou({
  kind,
  title,
  intro,
  biometric,
  onVerified,
  onCancel,
}: Props) {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [waitMs, setWaitMs] = useState(() => passcodeWaitRemaining());
  const waiting = waitMs > 0;

  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => setWaitMs(passcodeWaitRemaining()), 1000);
    return () => clearInterval(timer);
  }, [waiting]);

  const askBiometric = useCallback(async () => {
    setMessage(null);
    const result = await unlockWithBiometric();
    if (result.kind === "key") {
      clearWrongTries();
      onVerified(result.key);
    } else if (result.kind === "needs-passcode") {
      setMessage("Use your passcode this time.");
    }
  }, [onVerified]);

  const asked = useRef(false);
  useEffect(() => {
    if (!biometric || asked.current) return;
    asked.current = true;
    void askBiometric();
  }, [biometric, askBiometric]);

  const submit = async () => {
    if (!value || checking || waiting) return;
    setChecking(true);
    setMessage(null);
    try {
      const result = await checkPasscode(value);
      if (result.kind === "key") {
        onVerified(result.key);
        return;
      }
      setValue("");
      setWaitMs(result.waitMs);
      if (result.kind === "wrong")
        setMessage("That passcode is not the one in use. Try again.");
    } catch (error) {
      console.error("[appLock] passcode check failed", error);
      setMessage("The passcode could not be checked just now. Try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {intro ? <Text style={styles.text}>{intro}</Text> : null}
      {message ? <Text style={styles.warning}>{message}</Text> : null}
      {waiting ? (
        <Text style={styles.warning}>
          {`Try the passcode again in ${waitLabel(waitMs)}. Nothing is deleted however many times it is tried.`}
        </Text>
      ) : null}
      <PasscodeEntry
        kind={kind}
        value={value}
        onChange={setValue}
        disabled={checking || waiting}
        submitLabel="Next"
        onSubmit={submit}
      />
      {checking ? <Text style={styles.note}>Checking</Text> : null}
      {biometric ? (
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => void askBiometric()}
        >
          <Text style={styles.secondaryButtonText}>
            {`Use ${biometricTitle()}`}
          </Text>
        </TouchableOpacity>
      ) : null}
      {onCancel ? (
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={onCancel}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    textAlign: "center",
    ...textShadow,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    ...textShadow,
  },
  warning: {
    ...typography.body,
    color: colors.statusYellowStandalone,
    textAlign: "center",
    ...textShadow,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    ...textShadow,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    width: "100%",
  },
  secondaryButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textSecondary,
    ...textShadow,
  },
});
