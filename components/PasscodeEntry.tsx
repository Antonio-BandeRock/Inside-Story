import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/colors";
import { textShadow, typography } from "../constants/typography";
import { MAX_PASSCODE_DIGITS, type PasscodeKind } from "../lib/appLock";

// Where a passcode is typed, on the lock screen and in App Lock setup.
//
// Digits get a keypad of the app's own rather than the phone's keyboard, so
// nothing a keyboard app learns or suggests ever sees the code, and the
// length stays hidden behind dots. A phrase needs letters, so it uses the
// phone's keyboard with secureTextEntry, the same way PasswordPrompt does
// for the backup password.

type Props = {
  kind: PasscodeKind;
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  /** Turns the keys off while a passcode is being checked. */
  disabled?: boolean;
  submitLabel?: string;
};

const KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "delete",
  "0",
  "enter",
] as const;

export function PasscodeEntry({
  kind,
  value,
  onChange,
  onSubmit,
  disabled,
  submitLabel = "Done",
}: Props) {
  if (kind === "phrase") {
    return (
      <View style={styles.phraseWrap}>
        <TextInput
          style={styles.phraseInput}
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          importantForAutofill="no"
          textContentType="password"
          editable={!disabled}
          autoFocus
          returnKeyType="done"
          placeholder="Passphrase"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          style={[styles.submitButton, disabled ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={onSubmit}
          disabled={disabled}
        >
          <Text style={styles.submitText}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const press = (key: (typeof KEYS)[number]) => {
    if (disabled) return;
    if (key === "delete") onChange(value.slice(0, -1));
    else if (key === "enter") onSubmit();
    else if (value.length < MAX_PASSCODE_DIGITS) onChange(value + key);
  };

  return (
    <View style={styles.keypadWrap}>
      <View
        style={styles.dots}
        accessibilityLabel={`${value.length} digits entered`}
      >
        {value.length === 0 ? (
          <Text style={styles.dotsHint}>Enter your passcode</Text>
        ) : (
          Array.from({ length: value.length }, (_, i) => (
            <View key={i} style={styles.dot} />
          ))
        )}
      </View>
      <View style={styles.keypad}>
        {KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.key,
              key === "enter" ? styles.enterKey : null,
              disabled ? styles.disabled : null,
            ]}
            activeOpacity={0.7}
            onPress={() => press(key)}
            onLongPress={
              key === "delete" ? () => !disabled && onChange("") : undefined
            }
            disabled={disabled}
            accessibilityLabel={
              key === "delete" ? "Delete" : key === "enter" ? submitLabel : key
            }
          >
            {key === "delete" ? (
              <Ionicons
                name="backspace-outline"
                size={26}
                color={colors.textPrimary}
              />
            ) : key === "enter" ? (
              <Ionicons
                name="checkmark"
                size={28}
                color={colors.textOnButton}
              />
            ) : (
              <Text style={styles.keyText}>{key}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keypadWrap: { alignItems: "center", gap: 18, width: "100%" },
  // Every place this is used sits on colors.surface, so the row paints it too.
  dots: {
    flexDirection: "row",
    gap: 12,
    minHeight: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  dotsHint: { ...typography.caption, color: colors.textMuted, ...textShadow },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.textPrimary,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 264,
    gap: 12,
    justifyContent: "center",
  },
  key: {
    width: 76,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  enterKey: {
    backgroundColor: colors.buttonColor,
    borderColor: colors.buttonColor,
  },
  keyText: {
    ...typography.screenTitle,
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
    ...textShadow,
  },
  disabled: { opacity: 0.5 },
  phraseWrap: { width: "100%", gap: 12 },
  phraseInput: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitButton: {
    backgroundColor: colors.buttonColor,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitText: {
    ...typography.bodyEmphasis,
    color: colors.textOnButton,
    textShadowColor: "transparent",
    textShadowRadius: 0,
  },
});
