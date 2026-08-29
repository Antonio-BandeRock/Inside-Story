// Step 4 of the real device-pairing prerequisite list (see CLAUDE.md's own
// "Sharing individual recipes between two people" security-requirement
// note), 2026-08-15 -- the real Connections management screen. Reached
// from Profile. Lets a person invite someone new (via any real carrier --
// text, WhatsApp, email -- through the OS share sheet, exactly like this
// app's own existing recipe-sharing feature already works), and browse/
// rename/remove people already paired with (see app/connect.tsx for the
// real receiving/accept side of the same exchange).
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { useConfirmSheet } from '../components/ConfirmSheet';
import { useInfoAlert } from '../components/InfoAlert';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { buildConnectionInvite, buildConnectionInviteLink, listConnections, removeConnection, renameConnection, type Connection } from '../lib/connections';
import { getMyKeyFingerprint } from '../lib/deviceIdentity';

export default function ConnectionsScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [myFingerprint, setMyFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
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
      await Share.share({
        message: `${invite.fromName} wants to connect with you in the Inside Story app, so you can share recipes and more directly and privately. If you have Inside Story installed, tap this link to accept: ${link}`,
      });
    } catch (error) {
      console.error('[ConnectionsScreen] Failed to share an invite', error);
      showInfoAlert('Something went wrong', "This couldn't be shared. Please try again.");
    } finally {
      setInviting(false);
    }
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
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => startRename(connection)} hitSlop={8}>
                    <Text style={styles.rowActionText}>Rename</Text>
                  </TouchableOpacity>
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
  rowActions: { flexDirection: 'row', gap: 16 },
  rowActionText: { ...typography.body, color: colors.accent, ...textShadow },
  rowActionTextMuted: { ...typography.body, color: colors.textMuted, ...textShadow },
  rowActionTextDanger: { ...typography.body, color: colors.danger, ...textShadow },
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  editInput: { flex: 1, ...typography.body, color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4, ...textShadow },
});
