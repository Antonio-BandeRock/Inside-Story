// Choosing the one Shared Folder everything the app keeps in OneDrive lives in.
//
// ONE FOLDER, NOT TWO. An earlier pass asked for a mailbox folder and a backup
// folder to be picked separately, which put the person in charge of a layout the
// app should keep itself. Now one folder is chosen and the app makes and owns
// what goes inside it:
//
//   Shared Folder
//   |- Mailbox     where every person's mailbox lives, partner and later child
//   |- Backups     where backups are written
//
// SET UP BEFORE ANYBODY IS ADDED. This is not a step that belongs to pairing. It
// is set up when the app is first opened, whether or not there is ever a partner,
// because backups need it just as much as a mailbox does.
//
// A REAL PICKER, WHICH IS THE WHOLE POINT. An earlier attempt asked somebody to
// type a folder's name, which told the app nothing it could open. This browses
// the actual account and hands back an address the app can write to and read
// from.
//
// TWO STARTING POINTS, AND BOTH ARE NEEDED. A folder somebody else shared with
// you does not appear anywhere in your own OneDrive; it sits under Shared with me
// and physically lives in their drive. Whoever MADE the folder finds it under
// their own files instead.

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
  BACKUPS_FOLDER_NAME,
  forgetResolvedFolders,
  MAILBOX_FOLDER_NAME,
  prepareSharedFolder,
} from '../lib/oneDriveFolders';
import {
  checkFolder,
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
  // is also the one the Use button would pick.
  const [trail, setTrail] = useState<DriveItemRef[]>([]);
  const [folders, setFolders] = useState<DriveItemRef[]>([]);
  const [chosen, setChosen] = useState<DriveItemRef | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  const current = trail.length > 0 ? trail[trail.length - 1] : null;

  const load = useCallback(async (nextRoot: Root, nextTrail: DriveItemRef[]) => {
    setBusy(true);
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

  /**
   * Brings the stored folder back in line with what OneDrive says about it.
   *
   * A folder renamed or moved since it was picked otherwise shows as something
   * that does not match what the person sees in OneDrive, which is exactly the
   * confusion showing a path was meant to remove. A folder that cannot be reached
   * right now is left alone: losing the choice over one failed request would be
   * worse than a slightly stale name.
   */
  const refreshStored = useCallback(async (saved: DriveItemRef | null): Promise<DriveItemRef | null> => {
    if (!saved) return null;
    const checked = await checkFolder(saved);
    if (!checked.ok) return saved;
    if (checked.value.name === saved.name && checked.value.path === saved.path) return saved;
    const refreshed: DriveItemRef = { ...saved, name: checked.value.name, path: checked.value.path };
    await setOneDriveFolder(refreshed);
    return refreshed;
  }, []);

  useEffect(() => {
    void (async () => {
      const [alreadySignedIn, saved] = await Promise.all([isSignedIn(), getOneDriveFolder()]);
      setSignedIn(alreadySignedIn);
      setChosen(saved);
      if (!alreadySignedIn) return;
      const currentFolder = await refreshStored(saved);
      setChosen(currentFolder);
      await load('shared', []);
    })();
  }, [load, refreshStored]);

  const handleSignIn = async () => {
    setBusy(true);
    const result = await signIn();
    setBusy(false);
    if (!result.ok) {
      setNote(result.reason);
      return;
    }
    setSignedIn(true);
    await load(root, []);
  };

  const handleSignOut = async () => {
    await signOut();
    // The folder goes with the account. Leaving an address behind that nothing
    // can open would show a folder that is set up and refuses every write, which
    // is worse than plainly showing nothing is set up.
    await setOneDriveFolder(null);
    await setMailboxFolderName(null);
    forgetResolvedFolders();
    setSignedIn(false);
    setChosen(null);
    setFolders([]);
    setTrail([]);
    setNote('Signed out of OneDrive. The shared folder was cleared with it.');
  };

  const handleSwitchRoot = async (nextRoot: Root) => {
    setRoot(nextRoot);
    setTrail([]);
    setNote(null);
    await load(nextRoot, []);
  };

  const handleOpen = async (folder: DriveItemRef) => {
    const nextTrail = [...trail, folder];
    setTrail(nextTrail);
    setNote(null);
    await load(root, nextTrail);
  };

  const handleBack = async () => {
    const nextTrail = trail.slice(0, -1);
    setTrail(nextTrail);
    setNote(null);
    await load(root, nextTrail);
  };

  const handleUse = async () => {
    if (!current) return;
    setBusy(true);
    await setOneDriveFolder(current);
    // The name is written too, and not as a duplicate. It is what travels in a
    // pairing code so the other phone can say which folder it means. The address
    // is what this app opens; the name is what a person reads.
    await setMailboxFolderName(current.name);
    setChosen(current);
    // Made now rather than on first use, so somebody can open OneDrive straight
    // afterwards and see the shape they were told about.
    const prepared = await prepareSharedFolder();
    setBusy(false);
    setNote(
      prepared.ok
        ? 'Using ' +
          current.name +
          '. ' +
          MAILBOX_FOLDER_NAME +
          ' and ' +
          BACKUPS_FOLDER_NAME +
          ' are ready inside it.'
        : 'Using ' + current.name + ', but its folders could not be made yet. ' + (prepared.reason ?? ''),
    );
    await load(root, trail);
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
    await load(root, trail);
    setNote('Made ' + result.value.name + '. Open it and tap Use to make it your shared folder.');
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
        <Text style={styles.label}>Your shared folder</Text>
        <Text style={styles.hint}>
          One folder in OneDrive holding everything this app keeps there. Set it up once, whether or not you ever add
          anyone, because backups need it too.
        </Text>
        {chosen ? (
          <>
            <Text style={styles.chosen}>Currently using: {chosen.name}</Text>
            {/* The full path, because two folders can be called Inside Story and
                a name on its own cannot tell them apart. */}
            <Text style={styles.pathText}>{chosen.path ?? 'OneDrive, in a folder shared with you.'}</Text>
            {/* What the app puts inside it, named plainly rather than left to be
                discovered in OneDrive. */}
            <Text style={styles.hint}>
              Inside it: {MAILBOX_FOLDER_NAME}, where everyone&apos;s mail lives, and {BACKUPS_FOLDER_NAME}, where your
              backups are written. The app makes both.
            </Text>
            {/* Said once, plainly, because it is the consequence somebody is
                least likely to have thought through. */}
            <Text style={styles.warning}>
              Anything in this folder is visible to whoever you share it with in OneDrive, and that includes your
              backups.
            </Text>
          </>
        ) : (
          <Text style={styles.hint}>Nothing set up yet.</Text>
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
            somebody else shared with you, and a folder only you can see cannot hold a mailbox.
          </Text>
          <Text style={styles.hint}>
            What this app does with it: list your folders so you can pick one, then read and write inside the one you
            pick. It never looks anywhere else.
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
                : 'Folders in your own OneDrive. Look here if you made the folder, or make one below.'}
            </Text>

            {trail.length > 0 ? (
              <View style={styles.trailRow}>
                <TouchableOpacity onPress={handleBack} hitSlop={8}>
                  <Text style={styles.action}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.trailText} numberOfLines={2}>
                  {current?.path ?? trail.map((entry) => entry.name).join(' / ')}
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
        <Text style={styles.action}>Go Back</Text>
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
  // The path reads as supporting detail under the name rather than competing
  // with it, which is why it is the quieter of the two.
  pathText: { ...typography.caption, color: colors.accent, ...textShadow },
  // Not danger red: nothing here is broken or about to be lost. It is a
  // consequence of a choice, and it should be noticed without alarming.
  warning: { ...typography.caption, color: colors.statusYellowStandalone, ...textShadow },
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
