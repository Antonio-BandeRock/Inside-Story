import { Nunito_600SemiBold, useFonts } from "@expo-google-fonts/nunito";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  AppState,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BUTTON_SHADOW, colors } from "../constants/colors";
import { textShadow, typography } from "../constants/typography";
import {
  passcodeProblem,
  shouldLockOnReturn,
  waitLabel,
  type AppLockState,
  type PasscodeKind,
} from "../lib/appLock";
import {
  abandonLockSetup,
  applyScreenCapturePolicy,
  checkPasscode,
  clearWrongTries,
  keepLockOn,
  passcodeWaitRemaining,
  runMigration,
  runUnlockMigration,
  setNewPasscode,
  storeBiometricCopy,
  unlockWithBiometric,
  unlockWithRecovery,
  type MigrationProgress,
} from "../lib/appLockDevice";
import {
  dropDataKey,
  holdDataKey,
  isUnlocked,
  readLockStateSync,
} from "../lib/appLockSession";
import { restartApp } from "../lib/restartApp";
import { PasscodeEntry } from "./PasscodeEntry";

// App Lock's gate (step 4 of docs/app-lock-phase0-audit.md). Wraps the whole
// app in app/_layout.tsx, so nothing that reads the database mounts until
// the key is held: the app tree simply is not rendered while locked, which
// is safer than covering it.
//
// What it shows, decided from the lock file each time the app starts:
//   no lock file              the app, as before
//   phase "encrypting"        the move into the encrypted file, with progress
//   phase "on", no key held   the lock screen
//   phase "decrypting"        the move back to a plain file, with progress
//
// Locking again after time away works by restarting the app (lib/restartApp
// closes the database first), which throws away the JS context and the key
// with it. The time is measured from the moment the app went to the
// background and checked when it comes back, so the key is dropped on that
// return or on a cold start, not while the app sits in the background.

type View_ =
  | { kind: "open" }
  | { kind: "locked" }
  | { kind: "migrating"; progress: MigrationProgress | null }
  | { kind: "migration-failed"; problem: string }
  | { kind: "unlocking"; progress: MigrationProgress | null }
  | { kind: "unlock-failed"; problem: string }
  | { kind: "recovery" }
  | { kind: "new-passcode"; key: Uint8Array };

function initialView(state: AppLockState | null): View_ {
  if (!state) return { kind: "open" };
  if (state.phase === "encrypting")
    return { kind: "migrating", progress: null };
  if (state.phase === "decrypting")
    return { kind: "unlocking", progress: null };
  return isUnlocked() ? { kind: "open" } : { kind: "locked" };
}

function progressText(
  progress: MigrationProgress | null,
  copy: "locked" | "unlocked" = "locked",
): string {
  if (!progress) return "Getting ready";
  switch (progress.stage) {
    case "checking-space":
      return "Checking there is room on the phone";
    case "copying":
      return `Writing the ${copy} copy of your records`;
    case "counting":
      return `Checking every record came across (${progress.done} of ${progress.total} tables)`;
    case "swapping":
      return `Putting the ${copy} copy in place`;
    case "opening":
      return copy === "locked"
        ? "Opening the locked copy with its key"
        : "Opening the unlocked copy";
    case "done":
      return "Done";
  }
}

export function AppLockGate({ children }: { children: ReactNode }) {
  const [fontsLoaded] = useFonts({ Nunito_600SemiBold });
  const [lockState, setLockState] = useState<AppLockState | null>(() =>
    readLockStateSync(),
  );
  const [view, setView] = useState<View_>(() => initialView(lockState));

  // The app's own layout hides the splash screen once its database is set
  // up. When the gate shows a screen of its own instead, it has to.
  useEffect(() => {
    if (fontsLoaded && view.kind !== "open") void SplashScreen.hideAsync();
  }, [fontsLoaded, view.kind]);

  useEffect(() => {
    void applyScreenCapturePolicy(lockState);
  }, [lockState]);

  // The move into the encrypted file, run at the start with nothing else open.
  const migrate = useCallback(async () => {
    setView({ kind: "migrating", progress: null });
    const result = await runMigration((progress) =>
      setView({ kind: "migrating", progress }),
    );
    if (result.ok) {
      setLockState(readLockStateSync());
      setView({ kind: "open" });
    } else {
      setView({ kind: "migration-failed", problem: result.problem });
    }
  }, []);

  const startedMigration = useRef(false);
  useEffect(() => {
    if (view.kind === "migrating" && !startedMigration.current) {
      startedMigration.current = true;
      void migrate();
    }
  }, [view.kind, migrate]);

  // The move back to a plain file after the lock was turned off.
  const unlock = useCallback(async () => {
    setView({ kind: "unlocking", progress: null });
    const result = await runUnlockMigration((progress) =>
      setView({ kind: "unlocking", progress }),
    );
    if (result.ok) {
      setLockState(null);
      setView({ kind: "open" });
    } else {
      setView({ kind: "unlock-failed", problem: result.problem });
    }
  }, []);

  const startedUnlock = useRef(false);
  useEffect(() => {
    if (view.kind === "unlocking" && !startedUnlock.current) {
      startedUnlock.current = true;
      void unlock();
    }
  }, [view.kind, unlock]);

  // Locking again after time away.
  const awaySince = useRef<number | null>(null);
  useEffect(() => {
    if (!lockState || lockState.phase !== "on") return;
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "background") {
        if (awaySince.current === null) awaySince.current = Date.now();
        return;
      }
      if (next !== "active") return;
      const since = awaySince.current;
      awaySince.current = null;
      const current = readLockStateSync();
      if (!current || current.phase !== "on" || !isUnlocked()) return;
      if (!shouldLockOnReturn(since, Date.now(), current.autoLockMinutes))
        return;
      dropDataKey();
      restartApp().catch((error) => {
        // A refused reload still locks: the app tree comes down and the
        // lock screen goes up, and the database opens again after unlocking.
        console.error("[appLock] restart to lock failed", error);
        setView({ kind: "locked" });
      });
    });
    return () => subscription.remove();
  }, [lockState]);

  if (view.kind === "open") return <>{children}</>;
  if (!fontsLoaded) return null;

  if (view.kind === "migrating") {
    return (
      <GateScreen icon="lock-closed-outline" title="Locking your records">
        <ActivityIndicator size="large" color={colors.textPrimary} />
        <Text style={styles.text}>{progressText(view.progress)}</Text>
        <Text style={styles.note}>
          Keep the app open until this finishes. If the phone turns off or the
          app closes, it starts again from where it is safe the next time the
          app opens, and your records stay as they were.
        </Text>
      </GateScreen>
    );
  }

  if (view.kind === "unlocking") {
    return (
      <GateScreen icon="lock-open-outline" title="Turning App Lock off">
        <ActivityIndicator size="large" color={colors.textPrimary} />
        <Text style={styles.text}>
          {progressText(view.progress, "unlocked")}
        </Text>
        <Text style={styles.note}>
          Keep the app open until this finishes. If the phone turns off or the
          app closes, it starts again from where it is safe the next time the
          app opens, and your records stay locked until the unlocked copy has
          opened.
        </Text>
      </GateScreen>
    );
  }

  if (view.kind === "unlock-failed") {
    return (
      <UnlockFailed
        problem={view.problem}
        onTryAgain={() => {
          startedUnlock.current = true;
          void unlock();
        }}
        onKeepOn={async () => {
          if (!(await keepLockOn())) return false;
          setLockState(readLockStateSync());
          // The key used for the move is gone, so the lock screen asks again.
          restartApp().catch(() => setView({ kind: "locked" }));
          return true;
        }}
      />
    );
  }

  if (view.kind === "migration-failed") {
    return (
      <MigrationFailed
        problem={view.problem}
        onTryAgain={() => {
          startedMigration.current = true;
          void migrate();
        }}
        onLeaveOff={async () => {
          if (await abandonLockSetup()) {
            setLockState(null);
            setView({ kind: "open" });
            return true;
          }
          return false;
        }}
      />
    );
  }

  if (view.kind === "recovery") {
    return (
      <RecoveryEntry
        onBack={() => setView({ kind: "locked" })}
        onUnlocked={(key) => {
          clearWrongTries();
          holdDataKey(key);
          setView({ kind: "new-passcode", key });
        }}
      />
    );
  }

  if (view.kind === "new-passcode") {
    return (
      <NewPasscodeAfterRecovery
        dataKey={view.key}
        biometric={lockState?.biometric ?? false}
        onDone={() => {
          setLockState(readLockStateSync());
          setView({ kind: "open" });
        }}
      />
    );
  }

  return (
    <LockScreen
      state={lockState}
      onUnlocked={(key) => {
        holdDataKey(key);
        setView({ kind: "open" });
      }}
      onUseRecovery={() => setView({ kind: "recovery" })}
    />
  );
}

// ---------------------------------------------------------------------------

function GateScreen({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Ionicons name={icon} size={40} color={colors.textMuted} />
          <Text style={styles.title}>{title}</Text>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

function LockScreen({
  state,
  onUnlocked,
  onUseRecovery,
}: {
  state: AppLockState | null;
  onUnlocked: (key: Uint8Array) => void;
  onUseRecovery: () => void;
}) {
  const kind: PasscodeKind = state?.passcodeKind ?? "digits";
  const [passcode, setPasscode] = useState("");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Milliseconds left before another passcode can be tried (R6), read again
  // from the lock file each second while a wait runs.
  const [waitMs, setWaitMs] = useState(() => passcodeWaitRemaining());
  const waiting = waitMs > 0;
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => setWaitMs(passcodeWaitRemaining()), 1000);
    return () => clearInterval(timer);
  }, [waiting]);
  // Set when the fingerprint copy turned out to be gone, so a passcode
  // unlock makes it again (R8).
  const remakeBiometric = useRef(false);

  const askBiometric = useCallback(async () => {
    if (!state?.biometric) return;
    setMessage(null);
    const result = await unlockWithBiometric();
    if (result.kind === "key") {
      clearWrongTries();
      onUnlocked(result.key);
    } else if (result.kind === "needs-passcode") {
      remakeBiometric.current = true;
      setMessage(
        "The fingerprint or face unlock needs your passcode once, which happens when a new fingerprint or face is added to the phone.",
      );
    }
  }, [state?.biometric, onUnlocked]);

  const asked = useRef(false);
  useEffect(() => {
    if (asked.current) return;
    asked.current = true;
    void askBiometric();
  }, [askBiometric]);

  const submit = async () => {
    if (!passcode || checking || waiting) return;
    setChecking(true);
    setMessage(null);
    try {
      const result = await checkPasscode(passcode);
      if (result.kind !== "key") {
        setPasscode("");
        setWaitMs(result.waitMs);
        if (result.kind === "wrong")
          setMessage(
            result.waitMs > 0
              ? "That passcode did not open it. After five wrong tries there is a wait before each next one."
              : "That passcode did not open it. Try again.",
          );
        return;
      }
      const key = result.key;
      if (remakeBiometric.current && state?.biometric)
        await storeBiometricCopy(key);
      onUnlocked(key);
    } catch (error) {
      console.error("[appLock] passcode unlock failed", error);
      setMessage("The passcode could not be checked just now. Try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <GateScreen icon="lock-closed-outline" title="Inside Story is locked">
      {message ? <Text style={styles.text}>{message}</Text> : null}
      {waiting ? (
        <Text style={styles.warning}>
          {`Try the passcode again in ${waitLabel(waitMs)}. Nothing is deleted however many times it is tried.`}
        </Text>
      ) : null}
      <PasscodeEntry
        kind={kind}
        value={passcode}
        onChange={setPasscode}
        onSubmit={submit}
        disabled={checking || waiting}
        submitLabel="Unlock"
      />
      {checking ? <Text style={styles.note}>Checking</Text> : null}
      {state?.biometric ? (
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => void askBiometric()}
        >
          <Text style={styles.secondaryButtonText}>
            Use Fingerprint or Face
          </Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        style={styles.linkButton}
        activeOpacity={0.85}
        onPress={onUseRecovery}
      >
        <Text style={styles.linkText}>
          Forgot the passcode? Use my recovery key
        </Text>
      </TouchableOpacity>
    </GateScreen>
  );
}

function RecoveryEntry({
  onBack,
  onUnlocked,
}: {
  onBack: () => void;
  onUnlocked: (key: Uint8Array) => void;
}) {
  const [typed, setTyped] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const submit = () => {
    const key = unlockWithRecovery(typed);
    if (key) onUnlocked(key);
    else
      setMessage(
        "That recovery key did not open it. Check each group of four and try again.",
      );
  };

  return (
    <GateScreen icon="key-outline" title="Use your recovery key">
      <Text style={styles.text}>
        Type the 32 letters and numbers from the recovery key you saved when you
        set the lock up. Spaces and dashes do not matter. After it opens, you
        will choose a new passcode.
      </Text>
      <TextInput
        style={styles.input}
        value={typed}
        onChangeText={setTyped}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        importantForAutofill="no"
        placeholder="XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX"
        placeholderTextColor={colors.textMuted}
        onSubmitEditing={submit}
      />
      {message ? <Text style={styles.text}>{message}</Text> : null}
      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={submit}
      >
        <Text style={styles.primaryButtonText}>Unlock</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        activeOpacity={0.85}
        onPress={onBack}
      >
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </GateScreen>
  );
}

/** Choosing a passcode and typing it again. Used here and in App Lock setup. */
export function ChoosePasscode({
  title,
  intro,
  initialKind = "digits",
  onChosen,
  busy,
}: {
  title: string;
  intro?: string;
  initialKind?: PasscodeKind;
  onChosen: (passcode: string, kind: PasscodeKind) => void;
  busy?: boolean;
}) {
  const [kind, setKind] = useState<PasscodeKind>(initialKind);
  const [first, setFirst] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const submit = () => {
    if (busy) return;
    if (first === null) {
      const problem = passcodeProblem(value, kind);
      if (problem) {
        setMessage(problem);
        return;
      }
      setFirst(value);
      setValue("");
      setMessage(null);
      return;
    }
    if (value !== first) {
      setFirst(null);
      setValue("");
      setMessage("The two did not match. Choose it again.");
      return;
    }
    onChosen(value, kind);
  };

  return (
    <View style={styles.choose}>
      <Text style={styles.subtitle}>{title}</Text>
      {intro ? <Text style={styles.text}>{intro}</Text> : null}
      {first === null ? (
        <View style={styles.pillRow}>
          {(["digits", "phrase"] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.pill, kind === option ? styles.pillActive : null]}
              activeOpacity={0.85}
              onPress={() => {
                setKind(option);
                setValue("");
                setMessage(null);
              }}
            >
              <Text
                style={[
                  styles.pillText,
                  kind === option ? styles.pillTextActive : null,
                ]}
              >
                {option === "digits" ? "Numbers" : "Words"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      <Text style={styles.text}>
        {first === null
          ? kind === "digits"
            ? "Choose a passcode of 6 to 12 digits."
            : "Choose a passphrase of at least 8 characters."
          : "Type it again to be sure."}
      </Text>
      {message ? <Text style={styles.warning}>{message}</Text> : null}
      <PasscodeEntry
        key={`${kind}-${first === null ? "first" : "again"}`}
        kind={kind}
        value={value}
        onChange={setValue}
        onSubmit={submit}
        disabled={busy}
        submitLabel={first === null ? "Next" : "Done"}
      />
    </View>
  );
}

function NewPasscodeAfterRecovery({
  dataKey,
  biometric,
  onDone,
}: {
  dataKey: Uint8Array;
  biometric: boolean;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  return (
    <GateScreen icon="key-outline" title="Choose a new passcode">
      <ChoosePasscode
        title="Your recovery key opened it"
        intro="The old passcode stops working once the new one is set. Your recovery key stays the same."
        busy={busy}
        onChosen={async (passcode, kind) => {
          setBusy(true);
          setProblem(null);
          try {
            await setNewPasscode(dataKey, passcode, kind);
            if (biometric) await storeBiometricCopy(dataKey);
            onDone();
          } catch (error) {
            console.error("[appLock] new passcode not saved", error);
            setProblem("The new passcode could not be saved. Try again.");
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy ? <Text style={styles.note}>Saving</Text> : null}
      {problem ? <Text style={styles.warning}>{problem}</Text> : null}
    </GateScreen>
  );
}

function MigrationFailed({
  problem,
  onTryAgain,
  onLeaveOff,
}: {
  problem: string;
  onTryAgain: () => void;
  onLeaveOff: () => Promise<boolean>;
}) {
  const [leaveOffRefused, setLeaveOffRefused] = useState(false);
  return (
    <GateScreen
      icon="alert-circle-outline"
      title="The lock could not be finished"
    >
      <Text style={styles.text}>{problem}</Text>
      <Text style={styles.text}>Nothing you have recorded was lost.</Text>
      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={onTryAgain}
      >
        <Text style={styles.primaryButtonText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        activeOpacity={0.85}
        onPress={async () => setLeaveOffRefused(!(await onLeaveOff()))}
      >
        <Text style={styles.secondaryButtonText}>Leave the Lock Off</Text>
      </TouchableOpacity>
      {leaveOffRefused ? (
        <Text style={styles.note}>
          Your records are already in the locked file, so the lock has to stay
          on. Try Again finishes it.
        </Text>
      ) : null}
    </GateScreen>
  );
}

function UnlockFailed({
  problem,
  onTryAgain,
  onKeepOn,
}: {
  problem: string;
  onTryAgain: () => void;
  onKeepOn: () => Promise<boolean>;
}) {
  const [keepOnRefused, setKeepOnRefused] = useState(false);
  return (
    <GateScreen
      icon="alert-circle-outline"
      title="App Lock could not be turned off"
    >
      <Text style={styles.text}>{problem}</Text>
      <Text style={styles.text}>Nothing you have recorded was lost.</Text>
      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={onTryAgain}
      >
        <Text style={styles.primaryButtonText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        activeOpacity={0.85}
        onPress={async () => setKeepOnRefused(!(await onKeepOn()))}
      >
        <Text style={styles.secondaryButtonText}>Keep the Lock On</Text>
      </TouchableOpacity>
      {keepOnRefused ? (
        <Text style={styles.note}>
          Your records are already in the unlocked file, so the lock has to
          come off. Try Again finishes it.
        </Text>
      ) : null}
    </GateScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flexGrow: 1, justifyContent: "center", paddingVertical: 32 },
  // The lock screens sit on the plain app colour rather than a tab photo, and
  // still keep their words on a surface the way every other screen does.
  card: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.tabProfile,
    padding: 24,
    gap: 14,
    alignItems: "center",
  },
  // ChoosePasscode paints the same surface it sits on, so it reads the same
  // inside a lock screen and inside App Lock setup.
  choose: {
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
  subtitle: {
    ...typography.bodyEmphasis,
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
  input: {
    ...typography.body,
    width: "100%",
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    width: "100%",
  },
  primaryButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnButton,
    textAlign: "center",
    textShadowColor: "transparent",
    textShadowRadius: 0,
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
  linkButton: { paddingVertical: 8 },
  linkText: {
    ...typography.caption,
    color: colors.textSecondary,
    textDecorationLine: "underline",
    ...textShadow,
  },
  pillRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.buttonColor,
    borderColor: colors.buttonColor,
  },
  pillText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  pillTextActive: {
    color: colors.textOnButton,
    textShadowColor: "transparent",
    textShadowRadius: 0,
  },
});
