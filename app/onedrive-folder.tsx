// Choosing a OneDrive folder, for either of the two things the app keeps there.
//
// A REAL PICKER, WHICH IS THE WHOLE POINT. An earlier attempt asked somebody to
// type a folder's name, which told the app nothing it could open and was rightly
// called out as pretending a choice had been made. This browses the actual
// account: it lists the folders that are really there, drills into them, and
// hands back an address the app can write to and read from.
//
// TWO PURPOSES, ONE SCREEN. The mailbox and the backup folder are picked exactly
// the same way, so they share this rather than being two screens that drift
// apart. Which one is being set arrives as a route parameter and changes the
// wording, where the answer is stored, and whether the move action is offered.
//
// WHY THEY ARE TWO FOLDERS AND NOT ONE. The mailbox is shared with a partner by
// design. A backup is the whole record, and nobody else has any business reading
// it. Keeping backups in the mailbox would hand every one of them to whoever the
// mailbox is shared with.
//
// TWO STARTING POINTS, AND BOTH ARE NEEDED. A folder somebody else shared with
// you does not appear anywhere in your own OneDrive; it sits under Shared with
// me and physically lives in their drive. Whoever MADE the folder finds it under
// their own files instead.

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppTextInput } from '../components/AppTextInput';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  getOneDriveBackupFolder,
  getOneDriveFolder,
  setMailboxFolderName,
  setOneDriveBackupFolder,
  setOneDriveFolder,
} from '../lib/db';
import { isOneDriveConfigured, isSignedIn, signIn, signOut } from '../lib/oneDriveAuth';
import {
  checkFolder,
  createFolder,
  listChildFolders,
  listFiles,
  listMyRootFolders,
  listSharedFolders,
  moveFile,
  type DriveFileRef,
  type DriveItemRef,
} from '../lib/oneDriveGraph';
import { ONEDRIVE_NOT_CONFIGURED } from '../lib/oneDriveConfig';

/** Where the listing came from, so Back knows what to go back to. */
type Root = 'shared' | 'mine';

/**
 * What a backup this app wrote is called.
 *
 * Matched on rather than moving every file, because a folder can hold anything
 * and moving somebody's own documents because they happened to be nearby would
 * be indefensible.
 */
const BACKUP_PREFIX = 'inside-story-backup-';
const BACKUP_SUFFIX = '.json';

function isBackupFile(name: string): boolean {
  return name.startsWith(BACKUP_PREFIX) && name.endsWith(BACKUP_SUFFIX);
}

export default function OneDriveFolderScreen() {
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  const params = useLocalSearchParams<{ purpose?: string }>();
  const forBackups = params.purpose === 'backups';

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // A backup folder is one of your own, so start where those are. A mailbox is
  // usually one somebody shared, so start there instead.
  const [root, setRoot] = useState<Root>(forBackups ? 'mine' : 'shared');
  // The path from a root down to wherever the person is now. Empty means they
  // are looking at a root listing. The last entry is the current folder, which
  // is also the one the Use button would pick.
  const [trail, setTrail] = useState<DriveItemRef[]>([]);
  const [folders, setFolders] = useState<DriveItemRef[]>([]);
  const [chosen, setChosen] = useState<DriveItemRef | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  // Backups sitting in whatever folder is currently open, so they can be moved
  // into the chosen one. Only ever looked for when a backup folder is what is
  // being set, since it costs an extra request per folder opened.
  const [strays, setStrays] = useState<DriveFileRef[]>([]);

  const current = trail.length > 0 ? trail[trail.length - 1] : null;

  const load = useCallback(
    async (nextRoot: Root, nextTrail: DriveItemRef[], target: DriveItemRef | null) => {
      setBusy(true);
      setNote(null);
      setStrays([]);
      const parent = nextTrail.length > 0 ? nextTrail[nextTrail.length - 1] : null;
      const result = parent
        ? await listChildFolders(parent)
        : nextRoot === 'shared'
          ? await listSharedFolders()
          : await listMyRootFolders();

      if (!result.ok) {
        setBusy(false);
        setFolders([]);
        setNote(result.reason);
        return;
      }
      setFolders(result.value);

      // Only worth asking about files when there is somewhere to move them to
      // and the folder open is not already that somewhere.
      if (forBackups && parent && target && parent.itemId !== target.itemId) {
        const files = await listFiles(parent);
        if (files.ok) setStrays(files.value.filter((file) => isBackupFile(file.name)));
      }
      setBusy(false);
    },
    [forBackups],
  );

  /**
   * Brings a stored folder back in line with what OneDrive says about it.
   *
   * A folder chosen before paths were recorded has none, and a folder renamed
   * or moved since carries the old one. Both show as something that does not
   * match what the person sees in OneDrive, which is exactly the confusion
   * showing a path was meant to remove.
   */
  const refreshStored = useCallback(
    async (saved: DriveItemRef | null): Promise<DriveItemRef | null> => {
      if (!saved) return null;
      const checked = await checkFolder(saved);
      // A folder that cannot be reached right now is left exactly as it was.
      // Losing the choice over one failed request would be worse than showing
      // a slightly stale name.
      if (!checked.ok) return saved;
      if (checked.value.name === saved.name && checked.value.path === saved.path) return saved;
      const refreshed: DriveItemRef = {
        ...saved,
        name: checked.value.name,
        path: checked.value.path,
      };
      if (forBackups) await setOneDriveBackupFolder(refreshed);
      else await setOneDriveFolder(refreshed);
      return refreshed;
    },
    [forBackups],
  );

  useEffect(() => {
    void (async () => {
      const [alreadySignedIn, saved] = await Promise.all([
        isSignedIn(),
        forBackups ? getOneDriveBackupFolder() : getOneDriveFolder(),
      ]);
      setSignedIn(alreadySignedIn);
      setChosen(saved);
      // Everything about WHERE the person is resets too, not only what is
      // chosen. Expo Router reuses this screen when the same route is opened
      // with a different purpose, so without this the listing switched to the
      // new root while the trail and the Use button still named a folder opened
      // under the old one. Tapping Use there would have set the backup folder to
      // the mailbox.
      setTrail([]);
      setStrays([]);
      setNewFolderName('');
      setNote(null);
      setRoot(forBackups ? 'mine' : 'shared');
      if (!alreadySignedIn) return;
      const current = await refreshStored(saved);
      setChosen(current);
      await load(forBackups ? 'mine' : 'shared', [], current);
    })();
  }, [load, forBackups, refreshStored]);

  const handleSignIn = async () => {
    setBusy(true);
    const result = await signIn();
    setBusy(false);
    if (!result.ok) {
      setNote(result.reason);
      return;
    }
    setSignedIn(true);
    await load(root, [], chosen);
  };

  const handleSignOut = async () => {
    await signOut();
    // Both folders go with the account. Leaving an address behind that nothing
    // can open would show a folder that is set up and refuses every write, which
    // is worse than plainly showing nothing is set up.
    await setOneDriveFolder(null);
    await setOneDriveBackupFolder(null);
    await setMailboxFolderName(null);
    setSignedIn(false);
    setChosen(null);
    setFolders([]);
    setTrail([]);
    setStrays([]);
    setNote('Signed out of OneDrive. Both folders were cleared with it.');
  };

  const handleSwitchRoot = async (nextRoot: Root) => {
    setRoot(nextRoot);
    setTrail([]);
    await load(nextRoot, [], chosen);
  };

  const handleOpen = async (folder: DriveItemRef) => {
    const nextTrail = [...trail, folder];
    setTrail(nextTrail);
    await load(root, nextTrail, chosen);
  };

  const handleBack = async () => {
    const nextTrail = trail.slice(0, -1);
    setTrail(nextTrail);
    await load(root, nextTrail, chosen);
  };

  const handleUse = async () => {
    if (!current) return;
    if (forBackups) {
      await setOneDriveBackupFolder(current);
    } else {
      await setOneDriveFolder(current);
      // The name is written too, and not as a duplicate. It is what travels in a
      // pairing code so the other phone can say which folder it means. The
      // address is what this app opens; the name is what a person reads.
      await setMailboxFolderName(current.name);
    }
    setChosen(current);
    // Reload so the move offer reappraises now that there is somewhere to move
    // things to.
    await load(root, trail, current);
    // Said after the reload, because load clears the note: right for somebody
    // opening a folder and leaving a stale message behind, wrong for a message
    // about what just happened.
    setNote(
      forBackups
        ? 'Backups will be written to ' + current.name + ' from now on.'
        : 'Using ' +
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
    await load(root, trail, chosen);
    setNote(
      forBackups
        ? 'Made ' + result.value.name + '. Open it and tap Use to start keeping backups there.'
        : 'Made ' + result.value.name + '. Share it with them in OneDrive, then open it here and tap Use.',
    );
  };

  const handleMoveStrays = async () => {
    if (!current || !chosen || strays.length === 0) return;
    setBusy(true);
    let moved = 0;
    const failures: string[] = [];
    for (const file of strays) {
      const result = await moveFile(current, file, chosen);
      if (result.ok) moved += 1;
      else failures.push(file.name + ': ' + result.reason);
    }
    setBusy(false);
    await load(root, trail, chosen);
    setNote(
      failures.length === 0
        ? 'Moved ' + moved + (moved === 1 ? ' backup into ' : ' backups into ') + chosen.name + '.'
        : 'Moved ' + moved + '. ' + failures.join(' '),
    );
  };

  const purposeTitle = forBackups ? 'Where your backups are kept' : 'The folder your mailbox lives in';
  const purposeHint = forBackups
    ? 'A folder of your own, not one you share. A backup is your whole record, so it should not sit where a partner can read it.'
    : 'One folder, shared between the two of you, holding what each of you sends the other. Every partner and, later, every child uses the same one.';

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
        <Text style={styles.label}>{purposeTitle}</Text>
        <Text style={styles.hint}>{purposeHint}</Text>
        {chosen ? (
          <>
            <Text style={styles.chosen}>Currently using: {chosen.name}</Text>
            {/* The full path, because two folders can be called Backups and a
                name on its own cannot tell them apart. */}
            <Text style={styles.pathText}>{chosen.path ?? 'OneDrive, in a folder shared with you.'}</Text>
          </>
        ) : (
          <Text style={styles.hint}>Nothing chosen yet.</Text>
        )}
      </View>

      {signedIn === false ? (
        <View style={styles.card}>
          <Text style={styles.label}>Sign in to OneDrive</Text>
          {/* Said before sending anybody to the consent screen rather than
              leaving Microsoft's wording to explain it. Asking for access to
              everything and using two folders is a real gap between what is
              granted and what is used, and it should be stated by the side
              doing the asking. */}
          <Text style={styles.hint}>
            Microsoft will ask you to allow access to your files. It has no narrower permission that can reach a folder
            somebody else shared with you, and a folder only you can see is not a mailbox.
          </Text>
          <Text style={styles.hint}>
            What this app does with it: list your folders so you can pick one, then read and write files inside the ones
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

          {/* Offered exactly where it is useful: standing in a folder that holds
              backups, with somewhere else already chosen to keep them. Matched on
              this app's own file naming, so nothing else in the folder is
              touched. */}
          {forBackups && chosen && strays.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.label}>
                {strays.length === 1 ? '1 backup is in here' : strays.length + ' backups are in here'}
              </Text>
              <Text style={styles.hint}>
                They can be moved into {chosen.name} so they are all in one place. Nothing else in this folder is
                touched.
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={handleMoveStrays} disabled={busy}>
                <Ionicons name="arrow-forward" size={18} color={colors.textOnButton} />
                <Text style={styles.primaryButtonText}>Move Them to {chosen.name}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>Make a new folder</Text>
            <Text style={styles.hint}>
              {forBackups
                ? 'Goes inside whichever folder you have open.'
                : 'Goes inside whichever folder you have open. The app can make it, but only OneDrive can share it: make it here, then share it with them from the OneDrive app.'}
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
