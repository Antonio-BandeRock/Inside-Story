// One photo layer (X1): the one place a photo is added to, shown for and
// removed from anything that can carry photos. A caller names what the
// photos are of, `ownerKind` and `ownerId` (lib/media.ts), and this does the
// rest: a row of thumbnails, newest day first, an Add button, and a tap that
// opens the photo large with the day it was taken and a way to remove it.
//
// A photo whose row came over from the other device before its file did
// shows a placeholder saying so, rather than a blank or a broken image. On
// the desktop app taking or picking a photo is phone-only and says so; the
// photos themselves show there once sync has brought them over.
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { announcePhoneOnly } from '../lib/desktop/phoneOnly';
import {
  localDay,
  PHOTO_ON_THE_WAY,
  PHOTO_STRIP_EMPTY_LINE,
  photoRemovalSentence,
  takenOnLabel,
  type MediaItem,
  type MediaOwnerKind,
} from '../lib/media';
import { addPhoto, listMediaFor, mediaDisplayUri, removePhoto } from '../lib/mediaDb';
import { modalAnimationType } from '../lib/visualPreferences';
import { AppActionSheet } from './AppActionSheet';
import { useInfoAlert } from './InfoAlert';

type Shown = { item: MediaItem; uri: string | null };

export function PhotoStrip({
  ownerKind,
  ownerId,
  tabColor,
  addLabel = 'Add a Photo',
}: {
  ownerKind: MediaOwnerKind;
  ownerId: string;
  tabColor: string;
  addLabel?: string;
}) {
  const [shown, setShown] = useState<Shown[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [open, setOpen] = useState<Shown | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  const load = useCallback(async () => {
    const items = await listMediaFor(ownerKind, ownerId);
    const next: Shown[] = [];
    for (const item of items) next.push({ item, uri: await mediaDisplayUri(item) });
    setShown(next);
    setLoaded(true);
  }, [ownerKind, ownerId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePick(source: 'camera' | 'library') {
    setBusy(true);
    try {
      const result = await addPhoto(source, { kind: ownerKind, id: ownerId });
      if (result.status === 'added') {
        await load();
      } else if (result.status === 'permission-denied') {
        showInfoAlert(
          'Permission needed',
          source === 'camera'
            ? 'Allow camera access in your phone settings to take a photo.'
            : 'Allow photo access in your phone settings to choose one.',
        );
      } else if (result.status === 'too-small') {
        showInfoAlert('Photo too small', 'Please choose a larger photo.');
      } else if (result.status === 'too-large') {
        showInfoAlert('Photo too large', 'This photo could not be made small enough to keep. Please try a different one.');
      } else if (result.status === 'error') {
        showInfoAlert('The photo was not kept', result.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!open) return;
    setBusy(true);
    try {
      await removePhoto(open.item);
      setOpen(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function openPicker() {
    if (announcePhoneOnly(showInfoAlert, 'photo')) return;
    setPickerVisible(true);
  }

  const today = localDay(new Date());

  return (
    <View style={styles.container}>
      {loaded && shown.length === 0 ? <Text style={styles.emptyText}>{PHOTO_STRIP_EMPTY_LINE}</Text> : null}
      {shown.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {shown.map((entry) => (
            <TouchableOpacity
              key={entry.item.id}
              activeOpacity={0.8}
              onPress={() => setOpen(entry)}
              accessibilityLabel={`${takenOnLabel(entry.item.takenOn, today)}${entry.item.caption ? `, ${entry.item.caption}` : ''}`}
            >
              {entry.uri ? (
                <Image source={{ uri: entry.uri }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.placeholder]}>
                  <Ionicons name="cloud-download-outline" size={20} color={colors.textMuted} />
                  <Text style={styles.placeholderText}>{PHOTO_ON_THE_WAY}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
      {busy ? (
        <ActivityIndicator color={tabColor} style={styles.spinner} />
      ) : (
        <TouchableOpacity style={styles.addRow} activeOpacity={0.8} onPress={openPicker}>
          <Ionicons name="camera-outline" size={18} color={tabColor} />
          <Text style={[styles.addText, { color: tabColor }]}>{addLabel}</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={open !== null}
        animationType={modalAnimationType('fade')}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpen(null)}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(null)} />
          {open ? (
            <View style={styles.panel}>
              {open.uri ? (
                <Image
                  source={{ uri: open.uri }}
                  style={[
                    styles.large,
                    open.item.width && open.item.height ? { aspectRatio: open.item.width / open.item.height } : null,
                  ]}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.large, styles.placeholder]}>
                  <Text style={styles.placeholderText}>{PHOTO_ON_THE_WAY}</Text>
                </View>
              )}
              <Text style={styles.panelTitle}>{takenOnLabel(open.item.takenOn, today)}</Text>
              {open.item.caption ? <Text style={styles.panelBody}>{open.item.caption}</Text> : null}
              <View style={styles.panelActions}>
                <TouchableOpacity onPress={() => setConfirmVisible(true)} hitSlop={8} disabled={busy}>
                  <Text style={styles.removeText}>Remove Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setOpen(null)} hitSlop={8}>
                  <Text style={[styles.closeText, { color: tabColor }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
        <AppActionSheet
          visible={confirmVisible}
          onClose={() => setConfirmVisible(false)}
          title="Remove this photo?"
          message={photoRemovalSentence()}
          actions={[
            { label: 'Remove Photo', destructive: true, onPress: () => void handleRemove() },
            { label: 'Keep It', onPress: () => {} },
          ]}
        />
      </Modal>

      <AppActionSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title={addLabel}
        actions={[
          { label: 'Take a Photo', onPress: () => void handlePick('camera') },
          { label: 'Choose from Library', onPress: () => void handlePick('library') },
          { label: 'Cancel', onPress: () => {} },
        ]}
      />
      {infoAlertElement}
    </View>
  );
}

const THUMB = 84;

const styles = StyleSheet.create({
  container: { marginTop: 8, marginBottom: 4, gap: 8 },
  strip: { gap: 8 },
  thumb: { width: THUMB, height: THUMB, borderRadius: 10, backgroundColor: colors.surface },
  placeholder: { alignItems: 'center', justifyContent: 'center', padding: 6, gap: 4 },
  placeholderText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', ...textShadow },
  // A surface of its own, and a fill on the Add button, so neither sits on
  // a tab photo when a caller places the strip outside a band.
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    ...textShadow,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  spinner: { alignSelf: 'flex-start' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addText: { ...typography.bodyEmphasis, ...textShadow },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  panel: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  large: { width: '100%', maxHeight: 520, borderRadius: 10, backgroundColor: colors.surface, minHeight: 160 },
  panelTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  panelBody: { ...typography.body, color: colors.textPrimary, ...textShadow },
  panelActions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  removeText: { ...typography.bodyEmphasis, color: colors.danger, ...textShadow },
  closeText: { ...typography.bodyEmphasis, ...textShadow },
});
