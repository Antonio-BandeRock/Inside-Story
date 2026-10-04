// App Lock setup, and the four changes that need the passcode first:
// a new passcode, a new recovery key, turning on fingerprint or face, and
// turning the lock off (which restarts into the move back to a plain file).
// Reached from Profile > App Lock, on the phone and the computer.
//
// Setting up ends by restarting the app, and the gate
// (components/AppLockGate.tsx) moves the database into its encrypted file
// at that start, with nothing else open. See lib/appLockDevice.ts.
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChoosePasscode } from "../components/AppLockGate";
import { ConfirmItsYou } from "../components/ConfirmItsYou";
import { HOME_BAND_GAP } from "../components/HomeSectionBand";
import { BUTTON_SHADOW, colors } from "../constants/colors";
import { textShadow, typography } from "../constants/typography";
import {
  groupMatches,
  groupsToConfirm,
  type PasscodeKind,
} from "../lib/appLock";
import {
  canUseBiometrics,
  newRecoveryKey,
  readLockStateSync,
  replaceRecoveryKey,
  setBiometricUnlock,
  setNewPasscode,
  startTurningOff,
  turnOnAppLock,
  type RecoveryKey,
} from "../lib/appLockDevice";
import { biometricTitle, deviceWord } from "../lib/appLockWords";
import { isDesktopApp } from "../lib/desktop/bridge";
import { shareFileIfAvailable } from "../lib/nativeSharing";
import { explainNotYet } from "../lib/notYet";
import { restartApp } from "../lib/restartApp";
import { wording } from "../lib/playfulCopy";
import { usePlayfulWording } from "../hooks/usePlayfulWording";

type Mode = "setup" | "passcode" | "recovery" | "biometric" | "off";

type Step =
  | "intro"
  | "verify"
  | "choose"
  | "biometric"
  | "recovery-show"
  | "recovery-confirm"
  | "final"
  | "off-warning"
  | "working";

function titleFor(mode: Mode): string {
  if (mode === "passcode") return "Change Passcode";
  if (mode === "recovery") return "New Recovery Key";
  if (mode === "biometric") return biometricTitle();
  if (mode === "off") return "Turn Off App Lock";
  return "Set Up App Lock";
}

function recoveryText(key: RecoveryKey): string {
  return [
    "Inside Story recovery key",
    "",
    key.groups.join(" "),
    "",
    `This opens Inside Story on your ${deviceWord()} if you forget your passcode.`,
    `Keep it somewhere safe and away from the ${deviceWord()}. Anybody holding it and the ${deviceWord()} can open your records.`,
    `Made ${new Date().toLocaleDateString()}.`,
  ].join("\n");
}

function recoveryHtml(key: RecoveryKey): string {
  const groups = key.groups.map((g) => `<span>${g}</span>`).join(" ");
  return `<html><body style="font-family: sans-serif; padding: 40px;">
<h2>Inside Story recovery key</h2>
<p style="font-family: monospace; font-size: 24px; letter-spacing: 2px; word-spacing: 12px;">${groups}</p>
<p>This opens Inside Story on your ${deviceWord()} if you forget your passcode.</p>
<p>Keep it somewhere safe and away from the ${deviceWord()}. Anybody holding it and the ${deviceWord()} can open your records.</p>
<p>Made ${new Date().toLocaleDateString()}.</p>
</body></html>`;
}

export default function AppLockSetupScreen() {
  const router = useRouter();
  const playful = usePlayfulWording();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: Mode =
    params.mode === "passcode" ||
    params.mode === "recovery" ||
    params.mode === "biometric" ||
    params.mode === "off"
      ? params.mode
      : "setup";
  const lockState = readLockStateSync();

  const [step, setStep] = useState<Step>(mode === "setup" ? "intro" : "verify");
  const [problem, setProblem] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const [recovery, setRecovery] = useState<RecoveryKey | null>(null);
  const [confirmGroups, setConfirmGroups] = useState<[number, number]>([1, 2]);
  const [typedGroups, setTypedGroups] = useState<[string, string]>(["", ""]);
  const chosen = useRef<{ passcode: string; kind: PasscodeKind } | null>(null);
  const heldKey = useRef<Uint8Array | null>(null);
  const savedCopy = useRef<File | null>(null);

  useEffect(() => {
    void canUseBiometrics().then(setBiometricAvailable);
  }, []);

  // Setup over a lock already set up would write a new key over the one
  // that opens the records (1.0.60.15), so this screen is left at once.
  const alreadyLocked = mode === "setup" && lockState !== null;
  useEffect(() => {
    if (alreadyLocked) router.replace("/");
  }, [alreadyLocked, router]);

  // The saved-for-sharing copy of the recovery key goes once it has been handed over.
  useEffect(
    () => () => {
      try {
        if (savedCopy.current?.exists) savedCopy.current.delete();
      } catch {
        // Left in the app's cache, which Android clears on its own.
      }
    },
    [],
  );

  async function startRecoveryStep() {
    const key = await newRecoveryKey();
    setRecovery(key);
    setConfirmGroups(
      groupsToConfirm(key.groups.length, Math.random(), Math.random()),
    );
    setTypedGroups(["", ""]);
    setStep("recovery-show");
  }

  async function printRecovery() {
    if (!recovery) return;
    try {
      const Print = await import("expo-print");
      await Print.printAsync({ html: recoveryHtml(recovery) });
    } catch (error) {
      console.error("[appLockSetup] print failed", error);
      setProblem(
        "Printing did not start. Writing the key down works just as well.",
      );
    }
  }

  async function saveRecovery() {
    if (!recovery) return;
    try {
      const file = new File(Paths.cache, "inside-story-recovery-key.txt");
      file.write(recoveryText(recovery));
      savedCopy.current = file;
      const offered = await shareFileIfAvailable(file.uri, {
        mimeType: "text/plain",
        dialogTitle: "Save your recovery key",
      });
      if (!offered)
        setProblem(
          "Sharing is not available here. Writing the key down works just as well.",
        );
    } catch (error) {
      console.error("[appLockSetup] save failed", error);
      setProblem(
        "The copy could not be made. Writing the key down works just as well.",
      );
    }
  }

  async function finishRecoveryStep() {
    if (!recovery) return;
    if (mode === "setup") {
      setStep("final");
      return;
    }
    if (!heldKey.current) return;
    setStep("working");
    try {
      await replaceRecoveryKey(heldKey.current, recovery.bytes);
      router.back();
    } catch (error) {
      console.error("[appLockSetup] recovery key not replaced", error);
      setProblem(
        "The new recovery key could not be saved. Your old one still works.",
      );
      setStep("recovery-confirm");
    }
  }

  async function turnOn() {
    if (!chosen.current || !recovery) return;
    setStep("working");
    setProblem(null);
    try {
      await turnOnAppLock({
        passcode: chosen.current.passcode,
        passcodeKind: chosen.current.kind,
        biometric: useBiometric,
        recovery: recovery.bytes,
      });
      await restartApp();
    } catch (error) {
      console.error("[appLockSetup] turning on failed", error);
      setProblem(
        "App Lock could not be turned on. Nothing has changed. Try again.",
      );
      setStep("final");
    }
  }

  async function turnOff() {
    if (!heldKey.current) return;
    setStep("working");
    setProblem(null);
    try {
      await startTurningOff(heldKey.current);
      await restartApp();
    } catch (error) {
      console.error("[appLockSetup] turning off failed", error);
      setProblem(
        "App Lock could not be turned off. Nothing has changed. Try again.",
      );
      setStep("off-warning");
    }
  }

  // ------------------------------------------------------------------

  let content: ReactNode = null;

  if (step === "intro") {
    content = (
      <View style={styles.card}>
        <Text style={styles.title}>Lock your records, not only the screen</Text>
        <Text style={styles.text}>
          {`With App Lock on, everything you have recorded is kept in an encrypted file on this ${deviceWord()}. It opens only with your passcode, or ${
            isDesktopApp() ? "Windows Hello" : "your fingerprint or face"
          } if you choose, and a copy of the ${deviceWord()}'s files is no use to anybody without it.`}
        </Text>
        <Text style={styles.text}>
          You will choose a passcode, then be given a recovery key to keep
          somewhere safe. The app then restarts and locks your records, which
          takes a moment and shows its progress.
        </Text>
        <Text style={styles.text}>
          {isDesktopApp()
            ? "Reminders still arrive while the app is locked."
            : "Reminders still arrive while the app is locked. Widgets show that the app is locked rather than what is in it."}
        </Text>
        <PrimaryButton
          label="Choose a Passcode"
          onPress={() => setStep("choose")}
        />
      </View>
    );
  } else if (step === "verify") {
    content = (
      <View style={styles.card}>
        <ConfirmItsYou
          kind={lockState?.passcodeKind ?? "digits"}
          title="Enter your passcode"
          biometric={mode === "off" && (lockState?.biometric ?? false)}
          onVerified={async (key) => {
            heldKey.current = key;
            if (mode === "off") setStep("off-warning");
            else if (mode === "passcode") setStep("choose");
            else if (mode === "recovery") await startRecoveryStep();
            else {
              setStep("working");
              const kept = await setBiometricUnlock(key, true);
              if (kept) router.back();
              else {
                setProblem(
                  `${isDesktopApp() ? "Windows Hello" : "The fingerprint or face unlock"} could not be set up. Your passcode still opens the app.`,
                );
                setStep("verify");
              }
            }
          }}
        />
      </View>
    );
  } else if (step === "off-warning") {
    content = (
      <View style={styles.card}>
        <Ionicons name="lock-open-outline" size={40} color={colors.textMuted} />
        <Text style={styles.title}>Turn off App Lock?</Text>
        <Text style={styles.text}>
          {`Your records go back into a plain file on this ${deviceWord()}. Nothing you have recorded is lost, and nothing is deleted.`}
        </Text>
        <Text style={styles.text}>
          {`Without the lock, anybody who can open this ${deviceWord()} can open the app and read everything in it, and a copy of the ${deviceWord()}'s files can be`}
          read without any passcode. Reminders show their full text again.
        </Text>
        <Text style={styles.text}>
          The app restarts now and moves your records back. Keep it open until
          that finishes. Your passcode and recovery key stop working, and
          turning the lock on again later makes new ones.
        </Text>
        <PrimaryButton label="Turn Off App Lock" onPress={turnOff} />
        <SecondaryButton label="Keep It On" onPress={() => router.back()} />
      </View>
    );
  } else if (step === "choose") {
    content = (
      <View style={styles.card}>
        <ChoosePasscode
          title={
            mode === "setup" ? "Choose your passcode" : "Choose a new passcode"
          }
          intro={
            mode === "setup"
              ? "This is what opens the app. Pick something you will remember and nobody would guess."
              : "The old passcode stops working once the new one is set."
          }
          initialKind={lockState?.passcodeKind ?? "digits"}
          onChosen={async (passcode, kind) => {
            if (mode === "setup") {
              chosen.current = { passcode, kind };
              if (biometricAvailable) setStep("biometric");
              else await startRecoveryStep();
              return;
            }
            if (!heldKey.current) return;
            setStep("working");
            try {
              await setNewPasscode(heldKey.current, passcode, kind);
              router.back();
            } catch (error) {
              console.error("[appLockSetup] passcode not changed", error);
              setProblem(
                "The new passcode could not be saved. The old one still works.",
              );
              setStep("choose");
            }
          }}
        />
      </View>
    );
  } else if (step === "biometric") {
    content = (
      <View style={styles.card}>
        <Ionicons
          name="finger-print-outline"
          size={40}
          color={colors.textMuted}
        />
        <Text style={styles.title}>{`Open it with ${isDesktopApp() ? "Windows Hello" : "your fingerprint or face"}?`}</Text>
        <Text style={styles.text}>
          {isDesktopApp()
            ? "The passcode always works too. Windows asks for your face, fingerprint or Windows Hello PIN to open it. If Windows Hello is set up again on this computer, the app asks for the passcode once."
            : "The passcode always works too. If a new fingerprint or face is added to the phone later, the app asks for the passcode once before your fingerprint or face opens it again."}
        </Text>
        <PrimaryButton
          label={`Yes, Use ${biometricTitle()}`}
          onPress={async () => {
            setUseBiometric(true);
            await startRecoveryStep();
          }}
        />
        <SecondaryButton
          label="No, Passcode Only"
          onPress={async () => {
            setUseBiometric(false);
            await startRecoveryStep();
          }}
        />
      </View>
    );
  } else if (step === "recovery-show" && recovery) {
    content = (
      <View style={styles.card}>
        <Ionicons name="key-outline" size={40} color={colors.textMuted} />
        <Text style={styles.title}>Your recovery key</Text>
        <Text style={styles.text}>
          If you forget your passcode, this is the only other way in. Nobody
          else has a copy, not even the people who make the app. Write it down,
          {`print it, or save it somewhere away from this ${deviceWord()}.`}
        </Text>
        <View style={styles.keyBox}>
          <View style={styles.keyGrid}>
            {recovery.groups.map((group, i) => (
              <View key={i} style={styles.keyGroup}>
                <Text style={styles.keyGroupNumber}>{i + 1}</Text>
                <Text style={styles.keyGroupText} selectable>
                  {group}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <SecondaryButton label="Print It" onPress={printRecovery} />
        <SecondaryButton label="Save or Send a Copy" onPress={saveRecovery} />
        <PrimaryButton
          label="I Have Saved It"
          onPress={() => setStep("recovery-confirm")}
        />
      </View>
    );
  } else if (step === "recovery-confirm" && recovery) {
    const ready =
      groupMatches(typedGroups[0], recovery.groups[confirmGroups[0] - 1]) &&
      groupMatches(typedGroups[1], recovery.groups[confirmGroups[1] - 1]);
    content = (
      <View style={styles.card}>
        <Text style={styles.title}>Check you have it</Text>
        <Text style={styles.text}>
          Type group {confirmGroups[0]} and group {confirmGroups[1]} from the
          key you saved.
        </Text>
        {[0, 1].map((i) => (
          <View key={i} style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Group {confirmGroups[i]}</Text>
            <TextInput
              style={styles.confirmInput}
              value={typedGroups[i]}
              onChangeText={(text) =>
                setTypedGroups((prev) =>
                  i === 0 ? [text, prev[1]] : [prev[0], text],
                )
              }
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              importantForAutofill="no"
              maxLength={6}
            />
          </View>
        ))}
        <PrimaryButton
          label="Next"
          onPress={() => {
            if (!ready) {
              explainNotYet(
                `Those do not match the key yet. Type group ${confirmGroups[0]} and group ${confirmGroups[1]} exactly as they are on the key you saved.`,
              );
              return;
            }
            void finishRecoveryStep();
          }}
          dimmed={!ready}
        />
        <SecondaryButton
          label="Show the Key Again"
          onPress={() => setStep("recovery-show")}
        />
      </View>
    );
  } else if (step === "final") {
    content = (
      <View style={styles.card}>
        <Ionicons
          name="lock-closed-outline"
          size={40}
          color={colors.textMuted}
        />
        <Text style={styles.title}>Ready to lock</Text>
        <Text style={styles.text}>{wording("appLockNoReset", playful)}</Text>
        <Text style={styles.text}>
          The app restarts now and locks your records. Keep it open until that
          finishes.
        </Text>
        <PrimaryButton label="Turn On App Lock" onPress={turnOn} />
      </View>
    );
  } else if (step === "working") {
    content = (
      <View style={styles.card}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
        <Text style={styles.text}>Working</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: titleFor(mode) }} />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        {content}
        {problem ? (
          <View style={styles.card}>
            <Text style={styles.warning}>{problem}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  dimmed,
}: {
  label: string;
  onPress: () => void;
  /** Looks unavailable but still answers a press, so it can say why. */
  dimmed?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryButton, dimmed ? styles.disabled : null]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.secondaryButton}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
    gap: HOME_BAND_GAP,
  },
  card: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.tabProfile,
    padding: 20,
    gap: 14,
    alignItems: "center",
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
  keyBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.surfaceMuted,
  },
  keyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  keyGroup: { alignItems: "center", width: 72 },
  keyGroupNumber: {
    ...typography.caption,
    color: colors.textMuted,
    ...textShadow,
  },
  keyGroupText: {
    ...typography.sectionTitle,
    fontFamily: "monospace",
    letterSpacing: 2,
    color: colors.textPrimary,
    ...textShadow,
  },
  confirmRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  confirmLabel: {
    ...typography.body,
    color: colors.textSecondary,
    width: 70,
    ...textShadow,
  },
  confirmInput: {
    ...typography.sectionTitle,
    fontFamily: "monospace",
    letterSpacing: 2,
    width: 120,
    textAlign: "center",
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
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
  disabled: { opacity: 0.5 },
});
