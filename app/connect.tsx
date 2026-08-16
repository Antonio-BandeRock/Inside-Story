// Step 4 of the real device-pairing prerequisite list (see CLAUDE.md's own
// "Sharing individual recipes between two people" security-requirement
// note), 2026-08-15 -- the real receiving/accept screen for a connection
// invite. Reached via a real hashimotosapp://connect?data=... deep link
// (see lib/connections.ts's own buildConnectionInviteLink), the same real
// shape app/import-shared.tsx already established for "receive an
// out-of-band message, decode it, show an explicit accept/discard choice"
// -- Expo Router already resolves this link straight to this route and
// hands `data` here as an already-decoded query param.
//
// No signature verification happens here -- there's nothing valid to
// check one against yet (see lib/connections.ts's own header comment on
// exactly why). The real safety gate is the explicit human accept step,
// plus a real, short key fingerprint shown alongside the sender's name so
// two people who want genuine, independent confidence can read it out
// loud/compare over a separate channel if they choose to -- optional, not
// enforced, but real and honest rather than nothing at all.
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import {
  addConnection,
  buildConnectionInviteLink,
  decodeConnectionInvite,
  getConnectionByPublicKey,
  type ConnectionInvite,
} from '../lib/connections';
import { computeKeyFingerprint, getDeviceIdentity } from '../lib/deviceIdentity';

type Status = 'checking' | 'preview' | 'self-invite' | 'already-connected' | 'accepting' | 'accepted' | 'error';

export default function ConnectScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data?: string }>();
  const scrollPadding = useFloatingButtonScrollPadding();

  const invite = useMemo<ConnectionInvite | null>(() => (typeof data === 'string' ? decodeConnectionInvite(data) : null), [data]);
  const [status, setStatus] = useState<Status>('checking');
  const [existingConnectionName, setExistingConnectionName] = useState<string | null>(null);
  const [sendingInviteBack, setSendingInviteBack] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!invite) return;
    let cancelled = false;
    (async () => {
      const identity = await getDeviceIdentity();
      if (cancelled) return;
      if (identity.publicKeyBase64 === invite.publicKeyBase64) {
        setStatus('self-invite');
        return;
      }
      const existing = await getConnectionByPublicKey(invite.publicKeyBase64);
      if (cancelled) return;
      if (existing) {
        setExistingConnectionName(existing.name);
        setStatus('already-connected');
        return;
      }
      setStatus('preview');
    })();
    return () => {
      cancelled = true;
    };
  }, [invite]);

  async function handleAccept() {
    if (!invite) return;
    setStatus('accepting');
    try {
      await addConnection(invite.fromName, invite.publicKeyBase64);
      setStatus('accepted');
    } catch (error) {
      console.error('[ConnectScreen] Failed to save the new connection', error);
      setErrorMessage("Something went wrong saving this connection. Please try again.");
      setStatus('error');
    }
  }

  async function handleSendInviteBack() {
    setSendingInviteBack(true);
    try {
      const link = await buildConnectionInviteLink();
      const fromName = invite?.fromName ?? 'them';
      await Share.share({
        message: `Here's my Inside Story connection link back to you, ${fromName}. Tap it to finish connecting us: ${link}`,
      });
    } catch (error) {
      console.error('[ConnectScreen] Failed to share invite back', error);
    } finally {
      setSendingInviteBack(false);
    }
  }

  if (!invite) {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
          <Text style={styles.title}>This link doesn&apos;t look right</Text>
          <Text style={styles.text}>
            It may be incomplete, corrupted, or from an older version of the app. Ask whoever sent it to send it again.
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'checking') {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Text style={styles.text}>Checking this invite…</Text>
        </View>
      </View>
    );
  }

  if (status === 'self-invite') {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Ionicons name="person-circle-outline" size={40} color={colors.textMuted} />
          <Text style={styles.title}>That&apos;s your own invite</Text>
          <Text style={styles.text}>This connection link was generated by this same device. Share it with someone else&apos;s phone instead.</Text>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'already-connected') {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Ionicons name="checkmark-circle-outline" size={40} color={colors.accent} />
          <Text style={styles.title}>You&apos;re already connected</Text>
          <Text style={styles.text}>
            {existingConnectionName ?? invite.fromName} is already in your Connections list, no need to accept this again.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.replace({ pathname: '/connections' })}
          >
            <Text style={styles.primaryButtonText}>View Connections</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'accepted') {
    return (
      <View style={[styles.screen, { paddingBottom: scrollPadding }]}>
        <View style={styles.body}>
          <Ionicons name="checkmark-circle-outline" size={40} color={colors.accent} />
          <Text style={styles.title}>You&apos;re connected with {invite.fromName}</Text>
          <Text style={styles.text}>
            This is one-sided so far. {invite.fromName} won&apos;t see you as a connection until they accept an invite back
            from you too.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, sendingInviteBack ? styles.primaryButtonDisabled : null]}
            activeOpacity={0.85}
            onPress={handleSendInviteBack}
            disabled={sendingInviteBack}
          >
            <Text style={styles.primaryButtonText}>{sendingInviteBack ? 'Preparing…' : `Send Your Invite Back to ${invite.fromName}`}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, styles.doneButton]}
            activeOpacity={0.85}
            onPress={() => router.replace({ pathname: '/connections' })}
          >
            <Text style={styles.secondaryButtonText}>Done for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // status is 'preview', 'accepting', or 'error' here -- all three render
  // the same real preview, since 'accepting'/'error' both still need the
  // invite's own details visible (a disabled button, or a retry).
  const fingerprint = computeKeyFingerprint(invite.publicKeyBase64);
  return (
    <View style={[styles.screen, { paddingBottom: scrollPadding }]}>
      <View style={styles.body}>
        <Ionicons name="person-add-outline" size={40} color={colors.accent} />
        <Text style={styles.title}>{invite.fromName} wants to connect with you</Text>
        <Text style={styles.text}>
          Accepting adds them to your Connections list, so you can share recipes and more with each other going forward.
        </Text>
        <View style={styles.fingerprintBox}>
          <Text style={styles.fingerprintLabel}>Their device ID, if you&apos;d like to double-check it with them directly:</Text>
          <Text style={styles.fingerprintValue}>{fingerprint}</Text>
        </View>
        {status === 'error' && errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryButton, styles.actionButton, status === 'accepting' ? styles.primaryButtonDisabled : null]}
            activeOpacity={0.85}
            onPress={handleAccept}
            disabled={status === 'accepting'}
          >
            <Text style={styles.primaryButtonText}>{status === 'accepting' ? 'Saving…' : 'Accept'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton, styles.actionButton]} activeOpacity={0.85} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center' },
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  fingerprintBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  fingerprintLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  fingerprintValue: { ...typography.bodyEmphasis, color: colors.textPrimary, letterSpacing: 2 },
  errorText: { ...typography.caption, color: colors.danger, marginTop: 8, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12, width: '100%' },
  actionButton: { flex: 1 },
  doneButton: { marginTop: 4, width: '100%' },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.background, textAlign: 'center' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary },
});
