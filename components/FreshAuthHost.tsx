import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { colors } from "../constants/colors";
import { readLockStateSync } from "../lib/appLockSession";
import { listenForFreshAuth, type FreshAuthRequest } from "../lib/freshAuth";
import { ConfirmItsYou } from "./ConfirmItsYou";

// Draws the question lib/freshAuth.ts asks before records leave the phone.
// Mounted once in app/_layout.tsx. The key it opens is not kept: the app
// already holds its own, and this only proves the person is there.

export function FreshAuthHost() {
  const [request, setRequest] = useState<FreshAuthRequest | null>(null);
  useEffect(() => listenForFreshAuth(setRequest), []);
  if (!request) return null;
  const state = readLockStateSync();
  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={() => request.resolve(false)}
    >
      <View style={styles.backdrop}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <ConfirmItsYou
              kind={state?.passcodeKind ?? "digits"}
              title={request.reason}
              intro="App Lock asks again before your records leave the phone."
              biometric={state?.biometric ?? false}
              onVerified={(key) => {
                key.fill(0);
                request.resolve(true);
              }}
              onCancel={() => request.resolve(false)}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  body: { flexGrow: 1, justifyContent: "center", paddingVertical: 32 },
  card: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.tabProfile,
    padding: 24,
  },
});
