// Step 4 of the real device-pairing prerequisite list (see CLAUDE.md's own
// "Sharing individual recipes between two people" security-requirement
// note), 2026-08-15 -- the real Connections management screen. Reached
// from Profile. Lets a person invite someone new (via any real carrier --
// text, WhatsApp, email -- through the OS share sheet, exactly like this
// app's own existing recipe-sharing feature already works), and browse/
// rename/remove people already paired with (see app/connect.tsx for the
// real receiving/accept side of the same exchange).
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { useConfirmSheet } from '../components/ConfirmSheet';
import { useInfoAlert } from '../components/InfoAlert';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  buildConnectionInvite,
  buildConnectionInviteLink,
  buildPartnerInvite,
  buildPartnerInviteLink,
  writeConnectionInviteIsFile,
  encodeInviteCode,
  parseInviteInput,
  listConnections,
  removeConnection,
  renameConnection,
  setConnectionRole,
  type Connection,
} from '../lib/connections';
import {
  defaultGrantsForRole,
  describeGrants,
  describeLinkState,
  fingerprintStanding,
  linkState,
} from '../lib/partners';
import { shareFileIfAvailable } from '../lib/nativeSharing';
import { getMyKeyFingerprint } from '../lib/deviceIdentity';

export default function ConnectionsScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [myFingerprint, setMyFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  // The paste route in. Added after a deep link and then a .is file both
  // failed to reach the other phone: text is the one thing that always
  // arrives, through any channel.
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, fingerprint] = await Promise.all([listConnections(), getMyKeyFingerprint()]);
      setConnections(list);
      setMyFingerprint(fingerprint);
    } catch (error) {
      console.error('[ConnectionsScreen] Failed to load connections', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleInvite() {
    setInviting(true);
    try {
      const [invite, link] = await Promise.all([buildConnectionInvite(), buildConnectionInviteLink()]);
      // Sent as a file for the same reason the partner invite is: a
      // hashimotosapp:// link inside a message is not tappable in any messaging
      // app, so on its own it arrives as dead text. This button had the identical
      // problem and was fixed in the same pass.
      const fileUri = await writeConnectionInviteIsFile(invite);
      const code = encodeInviteCode(invite);
      await Share.share({
        message:
          `${invite.fromName} wants to connect with you in the Inside Story app, so you can share recipes directly and privately.\n\n` +
          `In Inside Story, go to Profile, then Connections, then "I Was Sent an Invite" and paste this in:\n\n` +
          `${code}\n\n` +
          `(A file is attached too, and this link may work on some phones: ${link})`,
      });
      if (fileUri) await shareFileIfAvailable(fileUri, { mimeType: '*/*', dialogTitle: 'Send this invite' });
    } catch (error) {
      console.error('[ConnectionsScreen] Failed to share an invite', error);
      showInfoAlert('Something went wrong', "This couldn't be shared. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  // Meals and shopping on, conditions deliberately off. A list of diagnoses is
  // not a household fact, and defaulting it on would be this app deciding
  // something on the sender's behalf. They can turn it on before sending, and
  // the receiver chooses their own side independently.
  async function handlePartnerInvite() {
    setInviting(true);
    try {
      const grants = defaultGrantsForRole('partner');
      const invite = await buildPartnerInvite({ grants });
      const link = await buildPartnerInviteLink({ grants });
      // The FILE is what actually opens on the other phone. A hashimotosapp://
      // link inside a message is not tappable in any messaging app, which is
      // exactly how the first version of this failed. The link stays in the text
      // only as a fallback for a channel that does linkify it.
      const fileUri = await writeConnectionInviteIsFile(invite);
      // The CODE leads, because it is the only part that has actually been shown
      // to survive the trip. A deep link is not tappable in a messaging app, and
      // a .is file tapped in WhatsApp produced WhatsApp's own "Couldn't load
      // object" rather than opening this app. Text always arrives.
      const code = encodeInviteCode(invite);
      await Share.share({
        message:
          `Here is my Inside Story partner invite, so we can plan meals together.\n\n` +
          `In Inside Story, go to Profile, then Connections, then "I Was Sent an Invite" and paste this in:\n\n` +
          `${code}\n\n` +
          `(A file is attached too, and this link may work on some phones: ${link})`,
      });
      // Android discards a file passed to Share.share, confirmed in react-native's
      // own source, so it goes as its own second step. The same two-call shape
      // every recipe share in this app already uses.
      if (fileUri) await shareFileIfAvailable(fileUri, { mimeType: '*/*', dialogTitle: 'Send this invite' });
    } catch (error) {
      console.error('[ConnectionsScreen] Failed to share a partner invite', error);
    } finally {
      setInviting(false);
    }
  }

  // Hands the pasted invite to the same accept screen a tapped link or file
  // would have reached, so there is one place that decides what an invite
  // means and one place that accepts it.
  function handlePastedInvite() {
    const data = parseInviteInput(pasted);
    if (!data) {
      setPasteError(
        'That does not look like an invite. Copy the whole code from their message, including any long run of letters and numbers, and paste it here.',
      );
      return;
    }
    setPasteError(null);
    setPasted('');
    setPasting(false);
    router.push({ pathname: '/connect', params: { data } });
  }

  function startRename(connection: Connection) {
    setEditingId(connection.id);
    setEditingName(connection.name);
  }

  async function saveRename(id: string) {
    const trimmed = editingName.trim();
    setEditingId(null);
    if (!trimmed) return;
    await renameConnection(id, trimmed);
    load();
  }

  async function handleRemove(connection: Connection) {
    const ok = await confirmSheet({
      title: 'Remove connection?',
      message: `You won't be able to share directly with ${connection.name} until you connect again.`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    setBusyId(connection.id);
    try {
      await removeConnection(connection.id);
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
      {infoAlertElement}
      {confirmSheetElement}
      {myFingerprint ? (
        <View style={styles.fingerprintCard}>
          <Text style={styles.fingerprintLabel}>Your device ID</Text>
          <Text style={styles.fingerprintValue}>{myFingerprint}</Text>
          <Text style={styles.fingerprintHint}>
            Shown here so you can read it out loud to someone you&apos;re pairing with directly, for extra confidence.
            Never required.
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.primaryButton, inviting ? styles.primaryButtonDisabled : null]}
        activeOpacity={0.85}
        onPress={handleInvite}
        disabled={inviting}
      >
        <Ionicons name="person-add-outline" size={18} color={colors.background} />
        <Text style={styles.primaryButtonText}>{inviting ? 'Preparing…' : 'Invite Someone'}</Text>
      </TouchableOpacity>

      {/* A partner link is its own invitation rather than a setting applied
          afterwards, because what it shares has to be chosen before it is sent
          rather than switched on behind someone. */}
      <TouchableOpacity
        style={[styles.secondaryButton, inviting ? styles.primaryButtonDisabled : null]}
        activeOpacity={0.85}
        onPress={handlePartnerInvite}
        disabled={inviting}
      >
        <Ionicons name="people-outline" size={18} color={colors.textPrimary} />
        <Text style={styles.secondaryButtonText}>Invite a Partner to Plan Meals</Text>
      </TouchableOpacity>
      <Text style={styles.partnerHint}>
        A partner sees the same meals you do, each with what they mean for their own conditions. You
        choose what to share, and you can change it or undo it here at any time.
      </Text>

      {/* The way in that does not depend on the OS handing this app a file.
          A deep link is not tappable in a messaging app, and a .is file tapped
          in WhatsApp fails before this app is ever reached, so the code in the
          message text is the part that reliably survives the trip. */}
      {pasting ? (
        <View style={styles.pasteBox}>
          <Text style={styles.pasteLabel}>Paste the code from their message</Text>
          <AppTextInput
            style={styles.pasteInput}
            placeholder="Paste here"
            multiline
            value={pasted}
            onChangeText={(text) => {
              setPasted(text);
              if (pasteError) setPasteError(null);
            }}
          />
          {pasteError ? <Text style={styles.pasteError}>{pasteError}</Text> : null}
          <Text style={styles.partnerHint}>
            Pasting the whole message is fine. It will find the code in it.
          </Text>
          <View style={styles.pasteActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={() => {
                setPasting(false);
                setPasted('');
                setPasteError(null);
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handlePastedInvite}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setPasting(true)}>
          <Ionicons name="clipboard-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.secondaryButtonText}>I Was Sent an Invite</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionLabel}>Your connections</Text>

      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : connections.length === 0 ? (
        <Text style={styles.emptyText}>
          No connections yet. Invite someone above, or accept an invite someone sends you to see them appear here.
        </Text>
      ) : (
        connections.map((connection) => (
          <View key={connection.id} style={styles.row}>
            {editingId === connection.id ? (
              <View style={styles.editRow}>
                <AppTextInput
                  value={editingName}
                  onChangeText={setEditingName}
                  style={styles.editInput}
                  autoFocus
                  selectAllOnMount
                  placeholder="Name"
                />
                <VoiceInputButton onResult={setEditingName} />
                <TouchableOpacity onPress={() => saveRename(connection.id)} hitSlop={8}>
                  <Text style={styles.rowActionText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingId(null)} hitSlop={8}>
                  <Text style={styles.rowActionTextMuted}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{connection.name}</Text>
                  <Text style={styles.rowMeta}>Connected {new Date(connection.pairedAt).toLocaleDateString()}</Text>
                  {connection.role === 'partner' ? (
                    <>
                      <Text style={styles.rowBadge}>Partner</Text>
                      {/* Never claims a two-way link without evidence for one.
                          The alternative is a screen that reads as finished
                          while nothing this person sends can land. */}
                      <Text style={styles.rowMeta}>
                        {describeLinkState(linkState(connection.theyHaveMeAt), connection.name)}
                      </Text>
                      <Text style={styles.rowMeta}>{describeGrants(connection.grants)}</Text>
                      {connection.theirConditionCodes.length > 0 ? (
                        <Text style={styles.rowMeta}>
                          They share {connection.theirConditionCodes.length}{' '}
                          {connection.theirConditionCodes.length === 1 ? 'condition' : 'conditions'} to plan around.
                        </Text>
                      ) : (
                        <Text style={styles.rowMeta}>
                          They have not shared which conditions they track, so meals are planned around you alone.
                        </Text>
                      )}
                      {!fingerprintStanding('partner', connection.fingerprintVerifiedAt).verified ? (
                        <Text style={styles.rowWarn}>
                          {fingerprintStanding('partner', connection.fingerprintVerifiedAt).message}
                        </Text>
                      ) : null}
                    </>
                  ) : null}
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => startRename(connection)} hitSlop={8}>
                    <Text style={styles.rowActionText}>Rename</Text>
                  </TouchableOpacity>
                  {connection.role === 'partner' ? (
                    <TouchableOpacity
                      onPress={async () => {
                        // Demoting resets the grants and drops their condition
                        // list, since holding a diagnosis list for someone you
                        // no longer plan meals with has no remaining reason.
                        await setConnectionRole(connection.id, 'recipe');
                        load();
                      }}
                      hitSlop={8}
                    >
                      <Text style={styles.rowActionText}>Stop Sharing</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => handleRemove(connection)} hitSlop={8} disabled={busyId === connection.id}>
                    <Text style={styles.rowActionTextDanger}>{busyId === connection.id ? 'Removing…' : 'Remove'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  fingerprintCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  fingerprintLabel: { ...typography.caption, color: colors.textMuted, ...textShadow },
  fingerprintValue: { ...typography.bodyEmphasis, color: colors.textPrimary, letterSpacing: 2, ...textShadow },
  fingerprintHint: { ...typography.caption, color: colors.textMuted, ...textShadow },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 14,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, marginTop: 4, ...textShadow },
  emptyText: { ...typography.body, color: colors.textMuted, ...textShadow },
  row: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowInfo: { flex: 1 },
  rowName: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
  // A partner link shares more than a recipe connection does, so it is marked
  // rather than left looking like every other row.
  rowBadge: {
    ...typography.caption, color: colors.textOnPrimary, backgroundColor: colors.accent,
    alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
    marginTop: 6, overflow: 'hidden',
    textShadowColor: 'transparent', textShadowRadius: 0,
  },
  // The unchecked fingerprint on a partner link. Not danger red: nothing is
  // wrong, there is just a step that has not been done and should be.
  rowWarn: { ...typography.caption, color: colors.statusYellowStandalone, marginTop: 4, ...textShadow },
  partnerHint: { ...typography.caption, color: colors.textMuted, marginTop: 6, ...textShadow },
  pasteBox: {
    marginTop: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, gap: 8,
  },
  pasteLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  pasteInput: {
    backgroundColor: colors.surfaceMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary, minHeight: 90, textAlignVertical: 'top',
  },
  pasteError: { ...typography.caption, color: colors.danger, ...textShadow },
  pasteActions: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, marginTop: 8,
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  rowActions: { flexDirection: 'row', gap: 16 },
  rowActionText: { ...typography.body, color: colors.accent, ...textShadow },
  rowActionTextMuted: { ...typography.body, color: colors.textMuted, ...textShadow },
  rowActionTextDanger: { ...typography.body, color: colors.danger, ...textShadow },
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  editInput: { flex: 1, ...typography.body, color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4, ...textShadow },
});
