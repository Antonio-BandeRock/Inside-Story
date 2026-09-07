// Step 4 of the real device-pairing prerequisite list (see CLAUDE.md's own
// "Sharing individual recipes between two people" security-requirement
// note), 2026-08-15 -- the real Connections management screen. Reached
// from Profile. Pairing happens face to face by QR since 2026-09-06 (see
// app/pair.tsx for why the two message-based routes before it never
// arrived). This screen routes into that, and browses/
// rename/remove people already paired with (see app/connect.tsx for the
// real receiving/accept side of the same exchange).
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { useConfirmSheet } from '../components/ConfirmSheet';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  listConnections,
  removeConnection,
  renameConnection,
  setConnectionRole,
  type Connection,
} from '../lib/connections';
import {
  PARTNER_SHARING_NOT_LIVE,
  describeGrants,
  describeLinkState,
  fingerprintStanding,
  linkState,
} from '../lib/partners';
import { getMyKeyFingerprint } from '../lib/deviceIdentity';
import { canEncryptTo } from '../lib/partnerCrypto';
import {
  chooseSyncFolder,
  getSyncFolderStatus,
  SYNC_FOLDER_PROBLEM_TEXT,
  type SyncFolderStatus,
} from '../lib/syncInboxStorage';
import {
  describeReceive,
  describeSend,
  importPartnerFile,
  receiveFromPartners,
  sendToPartnerAsFile,
  sendToPartners,
} from '../lib/partnerTransfer';

export default function ConnectionsScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [myFingerprint, setMyFingerprint] = useState<string | null>(null);
  const [folderStatus, setFolderStatus] = useState<SyncFolderStatus>({ state: 'notChosen' });
  // What the last send or check actually did. Kept on screen rather than
  // flashed, because somebody who taps Send wants to know it landed, and a
  // toast that has gone is the same as never having said anything.
  const [transferNote, setTransferNote] = useState<string | null>(null);
  const [transferBusy, setTransferBusy] = useState<'send' | 'check' | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, fingerprint, folder] = await Promise.all([
        listConnections(),
        getMyKeyFingerprint(),
        // Listed rather than assumed. A stored folder URI proves somebody once
        // picked a folder, not that it is still there.
        getSyncFolderStatus(),
      ]);
      setFolderStatus(folder);
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

  // Pairing happens in person now, so this screen only routes into it. The
  // three message-based invites that used to live here each depended on
  // something outside this app cooperating, and none of them arrived.
  function openPairing(role: 'partner' | 'recipe') {
    router.push({ pathname: '/pair', params: { role, mode: 'show' } });
  }

  function openScanner() {
    router.push({ pathname: '/pair', params: { mode: 'scan' } });
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

  const handleSendFile = async (connectionId: string) => {
    setTransferBusy('send');
    try {
      const result = await sendToPartnerAsFile(connectionId);
      setTransferNote(
        result.sent
          ? 'Sent. They open it with Get What They Sent on their own phone.'
          : (result.reason ?? 'It could not be sent.'),
      );
    } finally {
      setTransferBusy(null);
    }
  };

  const handleImportFile = async () => {
    setTransferBusy('check');
    try {
      const result = await importPartnerFile();
      setTransferNote(result.message);
      // Conditions that just arrived change what a plan gets built around, so
      // the rows are reloaded rather than left showing the old counts.
      if (result.applied) load();
    } finally {
      setTransferBusy(null);
    }
  };

  const handleChooseFolder = async () => {
    const result = await chooseSyncFolder();
    if (!result.chosen) return; // Cancelling is not an error worth reporting.
    setFolderStatus(await getSyncFolderStatus());
    setTransferNote(null);
  };

  const handleSend = async () => {
    setTransferBusy('send');
    try {
      const { outcomes, folderProblem } = await sendToPartners();
      setTransferNote(folderProblem ? SYNC_FOLDER_PROBLEM_TEXT[folderProblem] : describeSend(outcomes));
      setFolderStatus(await getSyncFolderStatus());
    } finally {
      setTransferBusy(null);
    }
  };

  const handleCheck = async () => {
    setTransferBusy('check');
    try {
      const result = await receiveFromPartners();
      setTransferNote(
        result.folderProblem ? SYNC_FOLDER_PROBLEM_TEXT[result.folderProblem] : describeReceive(result),
      );
      // Conditions that just arrived change what a plan would be built around,
      // so the rows are reloaded rather than left showing the old counts.
      load();
    } finally {
      setTransferBusy(null);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
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

      {/* HOW A CONDITION LIST ACTUALLY CROSSES BETWEEN TWO PHONES.

          Three carriers were investigated and ruled out on evidence before this
          one. A cloud API needs BOTH people to grant full read and write access
          to their entire OneDrive, because Graph's createLink will not work at
          the narrow scope and /shares needs a token on the reading side too. A
          shared folder needs a storage app that supports folder selection, and
          most cloud apps do not: OneDrive does not appear in the picker at all.
          A QR code fits condition codes but not a plan of any length.

          So the default is handing the file over through whatever the two people
          already use. No account, no permission from anyone, works when they are
          apart, and every byte of it is sealed so only the recipient can open it.
          The cost is that it is a deliberate act rather than a background poll,
          which is said plainly rather than hidden. */}
      <View style={styles.fingerprintCard}>
        <Text style={styles.fingerprintLabel}>Sharing with a partner</Text>
        <Text style={styles.fingerprintHint}>
          Send what you share as a file, through whatever you already use to send each other things. No account and
          no sign-in anywhere. Only the person you sent it to can open it, so it stays private even passing through
          a messaging app.
        </Text>

        <TouchableOpacity onPress={handleImportFile} hitSlop={8} disabled={transferBusy !== null}>
          <Text style={styles.rowActionText}>
            {transferBusy === 'check' ? 'Opening…' : 'Get What They Sent'}
          </Text>
        </TouchableOpacity>

        {transferNote ? <Text style={styles.fingerprintHint}>{transferNote}</Text> : null}

        {/* The folder is kept rather than removed: where a storage app does
            support folder selection, or on an SD card, it is the same exchange
            without the sending step. Named honestly as the narrower option now
            rather than presented as the main one. */}
        <Text style={styles.folderSubLabel}>Or use a shared folder, where your storage app allows it</Text>
        {folderStatus.state === 'notChosen' ? (
          <Text style={styles.fingerprintHint}>
            Some storage apps let this app write straight into a folder you both see, which skips the sending step.
            Most cloud apps on Android do not offer it, OneDrive among them, so this may show only folders on the
            phone itself.
          </Text>
        ) : folderStatus.state === 'unreachable' ? (
          <Text style={styles.folderProblem}>{SYNC_FOLDER_PROBLEM_TEXT.unreachable}</Text>
        ) : (
          <Text style={styles.fingerprintHint}>
            {folderStatus.fileCount === 0
              ? 'Folder is set up. Nothing has been exchanged through it yet.'
              : `Folder is set up, holding ${folderStatus.fileCount} shared ${
                  folderStatus.fileCount === 1 ? 'file' : 'files'
                }.`}
          </Text>
        )}

        <View style={styles.folderActions}>
          <TouchableOpacity onPress={handleChooseFolder} hitSlop={8}>
            <Text style={styles.rowActionText}>
              {folderStatus.state === 'notChosen' ? 'Pick a Folder' : 'Pick a Different Folder'}
            </Text>
          </TouchableOpacity>
          {folderStatus.state === 'ready' ? (
            <>
              <TouchableOpacity onPress={handleSend} hitSlop={8} disabled={transferBusy !== null}>
                <Text style={styles.rowActionText}>
                  {transferBusy === 'send' ? 'Sending…' : 'Write to Folder'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCheck} hitSlop={8} disabled={transferBusy !== null}>
                <Text style={styles.rowActionText}>
                  {transferBusy === 'check' ? 'Checking…' : 'Read the Folder'}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* Named rather than left to be discovered as a silent omission: the
            conditions cross, the generated plan does not yet. */}
        <Text style={styles.fingerprintHint}>
          What crosses today is which conditions each of you tracks, which is what a meal plan gets built around.
          Carrying the generated plan itself across is the next piece.
        </Text>
      </View>

      {/* A partner link is its own invitation rather than a setting applied
          afterwards, because what it shares has to be chosen before it is sent
          rather than switched on behind someone. */}
      <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={() => openPairing('partner')}>
        <Ionicons name="people-outline" size={18} color={colors.textOnButton} />
        <Text style={styles.primaryButtonText}>Pair With a Partner</Text>
      </TouchableOpacity>
      <Text style={styles.partnerHint}>
        Sets up the link between two phones and records what each of you allows the other to see. You can change it, or undo it, here at any time.
      </Text>

      <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => openPairing('recipe')}>
        <Ionicons name="person-add-outline" size={18} color={colors.textPrimary} />
        <Text style={styles.secondaryButtonText}>Pair for Sharing Recipes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={openScanner}>
        <Ionicons name="qr-code-outline" size={18} color={colors.textPrimary} />
        <Text style={styles.secondaryButtonText}>Scan Their Code</Text>
      </TouchableOpacity>
      <Text style={styles.partnerHint}>
        Pairing happens face to face: one phone shows a code and the other reads it with the camera. Nothing is sent
        over the internet, and nothing has to be typed or pasted.
      </Text>

      <Text style={styles.sectionLabel}>Your connections</Text>

      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : connections.length === 0 ? (
        <Text style={styles.emptyText}>
          No connections yet. Pair with someone above, in person, and they will appear here.
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
                      {/* Said on the row itself rather than left for someone to
                          discover. A partner card that lists what is shared,
                          while nothing can actually travel between the phones,
                          reads as a working feature. */}
                      <Text style={styles.rowPending}>{PARTNER_SHARING_NOT_LIVE}</Text>
                      {/* SHOWING A CODE AGAIN IS HOW CONDITIONS ACTUALLY CROSS,
                          and this was gated behind the missing-key case, so for
                          anyone already holding a key it was invisible.

                          The mechanism was there the whole time: app/pair.tsx
                          rebuilds the invite fresh from current conditions every
                          time it opens, and app/connect.tsx applies incoming
                          codes to a connection that already exists. Nothing new
                          was needed to make partners share conditions, only a way
                          to reach what already worked. A day was spent building
                          three carriers before that was checked. */}
                      <View style={styles.rowFix}>
                        <Text style={styles.rowFixText}>
                          {canEncryptTo(connection.encryptionPublicKeyBase64)
                            ? 'Show each other your codes again whenever your conditions change. Scanning updates what each of you knows about the other. Nothing else about the connection changes.'
                            : 'You paired before this app could seal something so only they can read it. Show each other your codes once more and it fills itself in. Nothing else about the connection changes.'}
                        </Text>
                        <TouchableOpacity
                          style={styles.rowFixButton}
                          activeOpacity={0.85}
                          onPress={() => openPairing('partner')}
                        >
                          <Ionicons name="qr-code-outline" size={16} color={colors.textOnButton} />
                          <Text style={styles.rowFixButtonText}>Show My Code Again</Text>
                        </TouchableOpacity>
                      </View>
                      {connection.theirConditionCodes.length > 0 ? (
                        <Text style={styles.rowMeta}>
                          They share {connection.theirConditionCodes.length}{' '}
                          {connection.theirConditionCodes.length === 1 ? 'condition' : 'conditions'} with you.
                        </Text>
                      ) : (
                        <Text style={styles.rowMeta}>
                          They have not shared which conditions they track.
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
                  {/* On the row rather than in the card above, because a share
                      sheet sends one thing to one person and a button that had
                      to guess which partner it meant would be worse. */}
                  {connection.role === 'partner' ? (
                    <TouchableOpacity
                      onPress={() => handleSendFile(connection.id)}
                      hitSlop={8}
                      disabled={transferBusy !== null}
                    >
                      <Text style={styles.rowActionText}>Send Mine to Them</Text>
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
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, marginTop: 4, ...textShadow },
  folderActions: { flexDirection: 'row', gap: 18, flexWrap: 'wrap', marginTop: 2 },
  // Separates the narrower folder option from the one above it without adding
  // a seventh collapse layer to a screen that already reads as a list.
  folderSubLabel: { ...typography.caption, color: colors.textPrimary, marginTop: 10, ...textShadow },
  // A folder that has gone is a real problem to fix, not a passing note, so it
  // reads in the warning colour rather than the muted hint colour beside it.
  folderProblem: { ...typography.caption, color: colors.statusYellowStandalone, ...textShadow },
  emptyText: { ...typography.body, color: colors.textMuted, ...textShadow },
  // One column, actions underneath. This used to lay the text and the actions
  // out side by side, which read fine when a connection was a name and a date.
  // A partner row carries six lines, so that squeezed the text into a narrow
  // strip beside three links.
  row: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10,
  },
  rowInfo: { gap: 2 },
  rowName: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  rowMeta: { ...typography.caption, color: colors.textMuted, ...textShadow },
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
  rowPending: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    ...textShadow,
  },
  rowFix: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    gap: 8,
  },
  rowFixText: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  rowFixButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.buttonColor, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14,
    ...BUTTON_SHADOW,
  },
  rowFixButtonText: { ...typography.caption, color: colors.textOnButton, ...textShadow },
  rowWarn: { ...typography.caption, color: colors.statusYellowStandalone, marginTop: 4, ...textShadow },
  partnerHint: { ...typography.caption, color: colors.textMuted, marginTop: 6, ...textShadow },
  secondaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, marginTop: 8,
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  // Below the text, not beside it, with a line above so they read as controls
  // rather than as more of the same paragraph.
  rowActions: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowActionText: { ...typography.body, color: colors.accent, ...textShadow },
  rowActionTextMuted: { ...typography.body, color: colors.textMuted, ...textShadow },
  rowActionTextDanger: { ...typography.body, color: colors.danger, ...textShadow },
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  editInput: { flex: 1, ...typography.body, color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4, ...textShadow },
});
