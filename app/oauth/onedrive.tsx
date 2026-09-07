// Where the OneDrive sign-in redirect actually lands.
//
// WHY THIS SCREEN HAS TO EXIST, from a real device rather than from theory.
// hashimotosapp:// is a scheme this app registers with the operating system, so
// when Microsoft redirects to hashimotosapp://oauth/onedrive?code=..., Android
// does not quietly hand it back to the browser session that started it. It
// resolves the scheme, launches this app, and expo-router treats it as
// navigation. With no route at that path the person got expo-router's Unmatched
// Route page, printing the raw authorization code, with the picker stranded
// behind it.
//
// So the redirect is treated as what it is on this platform: a link into the
// app. This screen catches it, finishes the exchange, and sends the person back
// to the picker.
//
// BOTH PATHS CAN FIRE FOR ONE SIGN-IN, and which one wins is Android's decision.
// completeSignIn is written for that: an authorization code can be redeemed
// once, so it checks whether the other path already finished before spending it,
// and reports success rather than surfacing Microsoft's refusal of a spent code
// as a failure nobody can act on.
//
// NOTHING IS SHOWN FOR LONG. This is a hallway, not a room: a line of text while
// the token exchange runs, then it replaces itself with the picker. It only ever
// stays put to show an error, because an error that redirects away cannot be
// read.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { colors } from '../../constants/colors';
import { textShadow, typography } from '../../constants/typography';
import { completeSignIn } from '../../lib/oneDriveAuth';

export default function OneDriveOAuthRedirectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();
  const [problem, setProblem] = useState<string | null>(null);
  // A redirect can arrive while this screen is already mounted, and a code must
  // not be sent to Microsoft twice. One attempt per mount, tracked here rather
  // than in state so a re-render cannot restart it.
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    void (async () => {
      // The browser sheet can still be sitting open behind this. Closing it
      // first means the picker is what appears, rather than appearing under a
      // sheet somebody then has to dismiss.
      try {
        WebBrowser.dismissBrowser();
      } catch {
        // Nothing open is the same outcome as closing it.
      }

      const declined = params.error_description ?? params.error;
      if (declined) {
        setProblem(String(declined));
        return;
      }

      const code = typeof params.code === 'string' ? params.code : null;
      if (!code) {
        setProblem('Microsoft did not send back a sign-in code.');
        return;
      }

      const result = await completeSignIn(code);
      if (!result.ok) {
        setProblem(result.reason);
        return;
      }

      // replace rather than push: going back from the picker should reach
      // Connections, not this hallway and the spent code in its address.
      router.replace('/onedrive-folder');
    })();
  }, [params.code, params.error, params.error_description, router]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {problem ? (
          <>
            <Text style={styles.label}>That sign-in did not finish</Text>
            <Text style={styles.hint}>{problem}</Text>
            <TouchableOpacity onPress={() => router.replace('/onedrive-folder')} hitSlop={8}>
              <Text style={styles.action}>Back to the Folder Screen</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.hint}>Finishing the OneDrive sign-in...</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  label: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  hint: { ...typography.caption, color: colors.textMuted, ...textShadow },
  action: { ...typography.body, color: colors.accent, ...textShadow },
});
