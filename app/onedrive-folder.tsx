// Choosing the OneDrive folder the mailbox lives in.
//
// A REAL PICKER, WHICH IS THE WHOLE POINT. The previous attempt asked somebody
// to type a folder's name, which told the app nothing it could open and was
// rightly called out as pretending a choice had been made. This browses the
// actual account: it lists the folders that are really there, drills into them,
// and hands back an address the app can write to and read from.
//
// TWO STARTING POINTS, AND BOTH ARE NEEDED. A folder somebody else shared with
// you does not appear anywhere in your own OneDrive; it sits under Shared with
// me and physically lives in their drive. Whoever MADE the folder finds it under
// their own files instead. Two people setting up the same mailbox will therefore
// find it in two different places, so the screen offers both rather than
// guessing which side of the arrangement this person is on.
//
// SHARED WITH ME IS LISTED FIRST because it is the more common case: the usual
// arrangement is one person makes the folder, shares it, and the other goes
// looking for it.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppTextInput } from '../components/AppTextInput';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { getOneDriveFolder, setMailboxFolderName, setOneDriveFolder } from '../lib/db';
import { isOneDriveConfigured, isSignedIn, signIn, signOut } from '../lib/oneDriveAuth';
import {
  createFolder,
  listChildFolders,
  listMyRootFolders,
  listSharedFolders,
  type DriveItemRef,
} from '../lib/oneDriveGraph';
import { ONEDRIVE_NOT_CONFIGURED } from '../lib/oneDriveConfig';

/** Where the listing came from, so Back knows what to go back to. */
type Root = 'shared' | 'mine';

export default function OneDriveFolderScreen() {
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [root, setRoot] = useState<Root>('shared');
  // The path from a root down to wherever the person is now. Empty means they
  // are looking at a root listing. The last entry is the current folder, which
  // is also the one Use This Folder would pick.
  const [trail, setTrail] = useState<DriveItemRef[]>([]);
  const [folders, setFolders] = useState<DriveItemRef[]>([]);
  const [chosen, setChosen] = useState<DriveItemRef | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  const current = trail.length > 0 ? trail[trail.length - 1] : null;

  const load = useCallback(async (nextRoot: Root, nextTrail: DriveItemRef[]) => {
    setBusy(true);
    setNote(null);
    const parent = nextTrail.length > 0 ? nextTrail[nextTrail.length - 1] : null;
    const result = parent
      ? await listChildFolders(parent)
      : nextRoot === 'shared'
        ? await listSharedFolders()
        : await listMyRootFolders();
    setBusy(false);
    if (!result.ok) {
      setFolders([]);
      setNote(result.reason);
      return;
    }
    setFolders(result.value);
  }, []);

  useEffect(() => {
    void (async () => {
      const [alreadySignedIn, saved] = await Promise.all([isSignedIn(), getOneDriveFolder()]);
      setSignedIn(alreadySignedIn);
      setChosen(saved);
      if (alreadySignedIn) await load('shared', []);
    })();
  }, [load]);

  const handleSignIn = async () => {
    setBusy(true);
    const result = await signIn();
    setBusy(false);
    if (!result.ok) {
      setNote(result.reason);
      return;
    }
    setSignedIn(true);
    await load('shared', []);
  };

  const handleSignOut = async () => {
    await signOut();
    // The saved folder goes with the account. Leaving an address behind that
    // nothing can open would show a mailbox that is set up and refuses every
    // send, which is worse than plainly showing nothing is set up.
    await setOneDriveFolder(null);
    await setMailboxFolderName(null);
    setSignedIn(false);
    setChosen(null);
    setFolders([]);
    setTrail([]);
    setNote('Signed out of OneDrive. The folder was cleared with it.');
  };

  const handleSwitchRoot = async (nextRoot: Root) => {
    setRoot(nextRoot);
    setTrail([]);
    await load(nextRoot, []);
  };

  const handleOpen = async (folder: DriveItemRef) => {
    const nextTrail = [...trail, folder];
    setTrail(nextTrail);
    await load(root, nextTrail);
  };

  const handleBack = async () => {
    const nextTrail = trail.slice(0, -1);
    setTrail(nextTrail);
    await load(root, nextTrail);
  };

  const handleUse = async () => {
    if (!current) return;
    await setOneDriveFolder(current);
    // The name is written too, and not as a duplicate. It is what travels in a
    // pairing code so the other phone can say which folder it means, and what
    // the file-link mailbox on the Connections screen shows to somebody who is
    // not signed in to OneDrive at all. The address is what this app opens; the
    // name is what a person reads.
    await setMailboxFolderName(current.name);
    setChosen(current);
    setNote(
      'Using ' +
        current.name +
        '. Anything you send a partner goes in here, and this is where the app looks for what they sent.',
    );
  };

  const handleCreate = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    if (!current) {
      // A root listing is not a folder, so there is nowhere to put a new one.
      // Shared with me especially is a view rather than a place.
      setNote('Open a folder first. A new folder has to go inside one.');
      return;
    }
    setBusy(true);
    const result = await createFolder(current, name);
    setBusy(false);
    if (!result.ok) {
      setNote(result.reason);
      return;
    }
    setNewFolderName('');
    setNote(
      'Made ' +
        result.value.name +
        '. Share it with them in OneDrive, then open it here and tap Use This Folder.',
    );
    await load(root, trail);
  };

  if (!isOneDriveConfigured()) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.card}>
          <Text style={styles.hint}>{ONEDRIVE_NOT_CONFIGURED}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
      <View style={styles.card}>
        <Text style={styles.label}>The folder your mailbox lives in</Text>
        <Text style={styles.hint}>
          One folder, shared between the two of you, holding what each of you sends the other. Every partner and, later,
          every child uses the same one.
        </Text>
        {chosen ? (
          <Text style={styles.chosen}>Currently using: {chosen.name}</Text>
        ) : (
          <Text style={styles.hint}>Nothing chosen yet.</Text>
        )}
      </View>

      {signedIn === false ? (
        <View style={styles.card}>
          <Text style={styles.label}>Sign in to OneDrive</Text>
          {/* Said before sending anybody to the consent screen rather than
              leaving Microsoft's wording to explain it. Asking for access to
              everything and using one folder is a real gap between what is
              granted and what is used, and it should be stated by the side
              doing the asking. */}
          <Text style={styles.hint}>
            Microsoft will ask you to allow access to your files. It has no narrower permission that can reach a folder
            somebody else shared with you, and a folder only you can see is not a mailbox.
          </Text>
          <Text style={styles.hint}>
            What this app does with it: list your folders so you can pick one, then read and write files inside the one
            you pick. It never looks anywhere else.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn} disabled={busy}>
            <Ionicons name="cloud-outline" size={18} color={colors.textOnButton} />
            <Text style={styles.primaryButtonText}>Sign In to OneDrive</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {signedIn ? (
        <>
          <View style={styles.card}>
            <View style={styles.rootRow}>
              <TouchableOpacity onPress={() => handleSwitchRoot('shared')} hitSlop={8}>
                <Text style={root === 'shared' ? styles.rootActive : styles.rootInactive}>Shared with me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSwitchRoot('mine')} hitSlop={8}>
                <Text style={root === 'mine' ? styles.rootActive : styles.rootInactive}>My files</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              {root === 'shared'
                ? 'Folders other people have shared with you. Look here if they made the folder.'
                : 'Folders in your own OneDrive. Look here if you made the folder.'}
            </Text>

            {trail.length > 0 ? (
              <View style={styles.trailRow}>
                <TouchableOpacity onPress={handleBack} hitSlop={8}>
                  <Text style={styles.action}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.trailText} numberOfLines={1}>
                  {trail.map((entry) => entry.name).join(' / ')}
                </Text>
              </View>
            ) : null}

            {busy ? <ActivityIndicator color={colors.accent} /> : null}

            {!busy && folders.length === 0 ? (
              <Text style={styles.hint}>
                {trail.length > 0
                  ? 'Nothing but files in here. You can still use this folder, or make one inside it.'
                  : root === 'shared'
                    ? 'Nobody has shared a folder with you yet. Ask them to share one, or switch to My files and make one.'
                    : 'No folders at the top of your OneDrive.'}
              </Text>
            ) : null}

            {folders.map((folder) => (
              <TouchableOpacity
                key={folder.driveId + ':' + folder.itemId}
                style={styles.folderRow}
                onPress={() => handleOpen(folder)}
              >
                <Ionicons name="folder-outline" size={18} color={colors.accent} />
                <Text style={styles.folderName} numberOfLines={1}>
                  {folder.name}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}

            {current ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleUse} disabled={busy}>
                <Ionicons name="checkmark" size={18} color={colors.textOnButton} />
                <Text style={styles.primaryButtonText}>Use {current.name}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Make a new folder</Text>
            <Text style={styles.hint}>
              Goes inside whichever folder you have open. The app can make it, but only OneDrive can share it: make it
              here, then share it with them from the OneDrive app.
            </Text>
            <AppTextInput
              style={styles.input}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="What should it be called?"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity onPress={handleCreate} hitSlop={8} disabled={busy}>
              <Text style={styles.action}>Make It</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <TouchableOpacity onPress={handleSignOut} hitSlop={8}>
              <Text style={styles.action}>Sign Out of OneDrive</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {note ? (
        <View style={styles.card}>
          <Text style={styles.hint}>{note}</Text>
        </View>
      ) : null}

      <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
        <Text style={styles.action}>Back to Connections</Text>
      </TouchableOpacity>
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
  chosen: { ...typography.body, color: colors.textPrimary, ...textShadow },
  action: { ...typography.body, color: colors.accent, ...textShadow },
  rootRow: { flexDirection: 'row', gap: 20 },
  rootActive: { ...typography.bodyEmphasis, color: colors.accent, ...textShadow },
  rootInactive: { ...typography.body, color: colors.textMuted, ...textShadow },
  trailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trailText: { ...typography.caption, color: colors.textMuted, flex: 1, ...textShadow },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  folderName: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    ...typography.body,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 4,
  },
  primaryButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnButton,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
});
