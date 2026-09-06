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
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  addConnection,
  decodeConnectionInvite,
  getConnectionByPublicKey,
  markFingerprintVerified,
  fillMissingEncryptionKey,
  markTheyHaveMe,
  setConnectionRole,
  setPartnerConditionCodes,
  type ConnectionInvite,
} from '../lib/connections';
import { computeKeyFingerprint, getDeviceIdentity } from '../lib/deviceIdentity';
import { SHARE_SCOPES, defaultGrantsForRole, type ShareGrants } from '../lib/partners';
import { canEncryptTo } from '../lib/partnerCrypto';

type Status = 'checking' | 'preview' | 'self-invite' | 'already-connected' | 'accepting' | 'accepted' | 'error';

// A partner link carries data continuously rather than once, so the fingerprint
// step stops being optional here. It is the only defence against having
// accepted a substituted key, since pairing cannot verify anything before the
// keys are exchanged, and it costs two people ten seconds once.

export default function ConnectScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data?: string }>();
  const scrollPadding = useFloatingButtonScrollPadding();

  const invite = useMemo<ConnectionInvite | null>(() => (typeof data === 'string' ? decodeConnectionInvite(data) : null), [data]);
  const [status, setStatus] = useState<Status>('checking');
  const [existingConnectionName, setExistingConnectionName] = useState<string | null>(null);
  const [existingConnectionId, setExistingConnectionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fingerprintChecked, setFingerprintChecked] = useState(false);
  const [updatedExisting, setUpdatedExisting] = useState(false);
  const [filledEncryptionKey, setFilledEncryptionKey] = useState(false);
  // Whether someone already paired predates encryption keys. Paired before
  // 2026-09-06 means no key, and one more scan is all it takes to fix.
  const [existingNeedsKey, setExistingNeedsKey] = useState(false);
  // What I grant THEM, chosen here rather than mirrored from what they offered.
  // Their generosity is not consent on my behalf.
  const [grants, setGrants] = useState<ShareGrants>(() => defaultGrantsForRole('partner'));

  const isPartnerInvite = invite?.role === 'partner';

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
        setExistingConnectionId(existing.id);
        setExistingNeedsKey(!canEncryptTo(existing.encryptionPublicKeyBase64));
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
      const role = isPartnerInvite ? 'partner' : 'recipe';
      const connection = await addConnection(invite.fromName, invite.publicKeyBase64, {
        role,
        grants: isPartnerInvite ? grants : defaultGrantsForRole('recipe'),
        // Their X25519 key, if their app is new enough to carry one. Null is a
        // fine outcome: they pair and plan exactly the same, and nothing can
        // be sealed to them until they show a newer code.
        encryptionPublicKeyBase64: invite.encryptionKeyBase64 ?? null,
      });

      if (isPartnerInvite) {
        // Recorded only because the person said they compared it. Never
        // inferred: an app cannot know whether two people read four words to
        // each other, and pretending it does would make the check worthless.
        if (fingerprintChecked) await markFingerprintVerified(connection.id);

        // Their claim that they already added me, which is what lets this stop
        // showing a one-way link as finished. A claim over the same channel the
        // invite arrived through, not proof, and lib/partners.ts never calls it
        // verified.
        if (invite.alreadyHaveYou) await markTheyHaveMe(connection.id);

        // Codes only, and only for a partner. decodeConnectionInvite has
        // already dropped codes that arrived without the matching grant; this
        // is the second gate, so a recipe-role payload claiming a condition
        // grant still cannot get a diagnosis list stored.
        if (invite.conditionCodes?.length) {
          await setPartnerConditionCodes(connection.id, invite.conditionCodes);
        }
      }
      setStatus('accepted');
    } catch (error) {
      console.error('[ConnectScreen] Failed to save the new connection', error);
      setErrorMessage("Something went wrong saving this connection. Please try again.");
      setStatus('error');
    }
  }

  /**
   * The third leg, and the reason "already connected" is not a dead end.
   *
   * A sends an invite, B accepts and sends one back saying "I have you", A
   * accepts that and is now linked. But B still does not know A accepted, so A
   * sends once more and B lands HERE, on a connection that already exists. If
   * this screen just said "already connected", B would never reach a confirmed
   * two-way link. This is also how a partner refreshes a condition list that
   * has changed since pairing.
   */
  async function handleUpdateExisting() {
    if (!invite || !existingConnectionId) return;
    try {
      if (isPartnerInvite) await setConnectionRole(existingConnectionId, 'partner');
      if (invite.alreadyHaveYou) await markTheyHaveMe(existingConnectionId);
      // The reason "already connected" is worth landing on for anyone paired
      // before encryption keys existed: this fills the gap in place.
      if (invite.encryptionKeyBase64) {
        const filled = await fillMissingEncryptionKey(existingConnectionId, invite.encryptionKeyBase64);
        if (filled) setFilledEncryptionKey(true);
      }
      if (isPartnerInvite && invite.conditionCodes?.length) {
        await setPartnerConditionCodes(existingConnectionId, invite.conditionCodes);
      }
      setUpdatedExisting(true);
    } catch (error) {
      console.error('[ConnectScreen] Failed to update the existing connection', error);
      setErrorMessage("Something went wrong updating this connection. Please try again.");
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
            {existingConnectionName ?? invite.fromName} is already in your Connections list.
          </Text>
          {/* Not a dead end. This is the leg that finishes the link: they have
              sent one more time to say they added you, and without accepting it
              here this side would keep showing a one-way link forever. It is
              also how a partner refreshes a condition list that has changed. */}
          {!updatedExisting && (invite.alreadyHaveYou || isPartnerInvite) ? (
            <>
              <Text style={styles.text}>
                {invite.alreadyHaveYou
                  ? `${invite.fromName} has confirmed they added you too. Accepting this finishes the link so it works both ways.`
                  : `They have sent a partner link this time, which shares more than a recipe connection does.`}
              </Text>
              {existingNeedsKey && invite.encryptionKeyBase64 ? (
                <Text style={styles.text}>
                  This code also carries the key that lets them be sent something only they can read. You paired
                  before that existed, so accepting this fills it in.
                </Text>
              ) : null}
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleUpdateExisting}>
                <Text style={styles.primaryButtonText}>
                  {invite.alreadyHaveYou ? 'Finish the Link' : 'Make Them a Partner'}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
          {updatedExisting ? (
            <Text style={styles.text}>
              {filledEncryptionKey
                ? 'Updated. This link works both ways, and anything sent between you can now be sealed so only the two of you can read it.'
                : 'Updated. This link now works both ways.'}
            </Text>
          ) : null}
          <TouchableOpacity
            style={updatedExisting ? styles.primaryButton : styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => router.replace({ pathname: '/connections' })}
          >
            <Text style={updatedExisting ? styles.primaryButtonText : styles.secondaryButtonText}>View Connections</Text>
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
            {invite.alreadyHaveYou
              ? `${invite.fromName} has already added you, so this works both ways now.`
              : `This is one-sided so far. ${invite.fromName} will not see you as a connection until they accept a link back from you too.`}
          </Text>
          {isPartnerInvite ? (
            <Text style={styles.text}>
              Show them your code even if they have added you: it is what tells their phone the link is
              finished, and it carries what you chose to share.
            </Text>
          ) : null}
          {/* Straight back into the pairing screen with ack set, so their
              phone reads the one flag that makes the link mutual. They are
              already standing next to you, which is the whole reason this
              exchange is a camera and not a message. */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() =>
              router.replace({
                pathname: '/pair',
                params: {
                  role: isPartnerInvite ? 'partner' : 'recipe',
                  mode: 'show',
                  ack: '1',
                  theirName: invite.fromName,
                },
              })
            }
          >
            <Text style={styles.primaryButtonText}>Show Your Code to {invite.fromName}</Text>
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
        <Text style={styles.title}>
          {isPartnerInvite
            ? `${invite.fromName} wants to plan meals with you`
            : `${invite.fromName} wants to connect with you`}
        </Text>
        <Text style={styles.text}>
          {isPartnerInvite
            ? `You would both see the same meals each day, each with what those meals mean for your own conditions. One dinner, and the app tells each of you what it means for you.`
            : `Accepting adds them to your Connections list, so you can share recipes and more with each other going forward.`}
        </Text>

        {isPartnerInvite ? (
          <>
            <View style={styles.grantBox}>
              <Text style={styles.grantHeading}>What you share with {invite.fromName}</Text>
              <Text style={styles.grantHint}>
                Your choice, not theirs. What they share with you is theirs to decide, and it arrives with
                their own link.
              </Text>
              {SHARE_SCOPES.map((scope) => (
                <TouchableOpacity
                  key={scope.code}
                  style={styles.grantRow}
                  activeOpacity={0.8}
                  onPress={() => setGrants({ ...grants, [scope.code]: !grants[scope.code] })}
                >
                  <View style={[styles.checkBox, grants[scope.code] ? styles.checkBoxOn : null]}>
                    {grants[scope.code] ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                  <View style={styles.grantTextWrap}>
                    <Text style={styles.grantLabel}>{scope.label}</Text>
                    <Text style={styles.grantWhat}>{scope.what}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}
        <View style={styles.fingerprintBox}>
          <Text style={styles.fingerprintLabel}>
            {isPartnerInvite
              ? `Read these four groups out loud to ${invite.fromName} and check they see the same:`
              : `Their device ID, if you'd like to double-check it with them directly:`}
          </Text>
          <Text style={styles.fingerprintValue}>{fingerprint}</Text>
          {/* Optional for a recipe, which is how it shipped. Required here,
              because a partner link carries data continuously and this is the
              only thing standing between accepting them and accepting whoever
              passed the link along. */}
          {isPartnerInvite ? (
            <TouchableOpacity
              style={styles.grantRow}
              activeOpacity={0.8}
              onPress={() => setFingerprintChecked((prev) => !prev)}
            >
              <View style={[styles.checkBox, fingerprintChecked ? styles.checkBoxOn : null]}>
                {fingerprintChecked ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={styles.grantLabel}>We compared it and it matches</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {status === 'error' && errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              styles.actionButton,
              status === 'accepting' || (isPartnerInvite && !fingerprintChecked) ? styles.primaryButtonDisabled : null,
            ]}
            activeOpacity={0.85}
            onPress={handleAccept}
            disabled={status === 'accepting' || (isPartnerInvite && !fingerprintChecked)}
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
  title: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center', ...textShadow },
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center', ...textShadow },
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
  fingerprintLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center', ...textShadow },
  grantBox: {
    marginTop: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, gap: 8, width: '100%',
  },
  grantHeading: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  grantHint: { ...typography.caption, color: colors.textMuted, ...textShadow },
  grantRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6 },
  grantTextWrap: { flex: 1 },
  grantLabel: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },
  grantWhat: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
  checkBox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: colors.accent },
  checkMark: { ...typography.caption, color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
  fingerprintValue: { ...typography.bodyEmphasis, color: colors.textPrimary, letterSpacing: 2, ...textShadow },
  errorText: { ...typography.caption, color: colors.danger, marginTop: 8, textAlign: 'center', ...textShadow },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12, width: '100%' },
  actionButton: { flex: 1 },
  doneButton: { marginTop: 4, width: '100%' },
  primaryButton: {
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton, textAlign: 'center',

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
});
