/**
 * Photos another person took of the dishes on the plan they sent.
 *
 * Only the small size arrives by itself (lib/peerPhotos.ts). A tap on one
 * asks for the larger size, which comes the next time their phone sends,
 * and once it is here the same tap opens it. Nothing on this strip is
 * editable, since the photos are theirs.
 */
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { PEER_PHOTO_TAP_LINE, peerPhotoAskedLine } from '../lib/peerPhotos';
import { listPeerDishPhotos, requestPeerPhoto, type PeerDishPhoto } from '../lib/peerPhotosDb';
import { modalAnimationType } from '../lib/visualPreferences';
import { useInfoAlert } from './InfoAlert';

type Dish = { id: string; name: string };

export function PeerDishPhotos({
  connectionId,
  personName,
  dishes,
  tabColor,
}: {
  connectionId: string;
  personName: string;
  dishes: readonly Dish[];
  tabColor: string;
}) {
  const [photos, setPhotos] = useState<Map<string, PeerDishPhoto>>(new Map());
  const [open, setOpen] = useState<{ dish: Dish; photo: PeerDishPhoto } | null>(null);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  const load = useCallback(() => {
    let cancelled = false;
    listPeerDishPhotos(connectionId)
      .then((found) => {
        if (!cancelled) setPhotos(found);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [connectionId]);
  useFocusEffect(load);

  const shown = dishes
    .map((dish) => ({ dish, photo: photos.get(dish.id) }))
    .filter((entry): entry is { dish: Dish; photo: PeerDishPhoto } => !!entry.photo?.thumbUri);
  if (shown.length === 0) return null;

  async function handleTap(dish: Dish, photo: PeerDishPhoto) {
    if (photo.fullUri) {
      setOpen({ dish, photo });
      return;
    }
    if (!photo.requested) {
      await requestPeerPhoto(connectionId, photo.photoId);
      setPhotos((current) => {
        const next = new Map(current);
        next.set(dish.id, { ...photo, requested: true });
        return next;
      });
    }
    showInfoAlert(dish.name, peerPhotoAskedLine(personName));
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: tabColor }]}>Photos from {personName}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {shown.map(({ dish, photo }) => (
          <TouchableOpacity
            key={dish.id}
            activeOpacity={0.8}
            onPress={() => void handleTap(dish, photo)}
            accessibilityLabel={`${dish.name}, photo from ${personName}`}
            style={styles.cell}
          >
            <Image source={{ uri: photo.thumbUri ?? undefined }} style={styles.thumb} contentFit="cover" recyclingKey={photo.photoId} />
            <Text style={styles.caption} numberOfLines={2}>
              {dish.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.tapLine}>{PEER_PHOTO_TAP_LINE}</Text>

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
          {open?.photo.fullUri ? (
            <View style={styles.panel}>
              <Image source={{ uri: open.photo.fullUri }} style={styles.large} contentFit="contain" />
              <Text style={styles.panelTitle}>{open.dish.name}</Text>
              {open.photo.caption ? <Text style={styles.panelBody}>{open.photo.caption}</Text> : null}
              <View style={styles.panelActions}>
                <TouchableOpacity onPress={() => setOpen(null)} hitSlop={8}>
                  <Text style={[styles.closeText, { color: tabColor }]}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
      {infoAlertElement}
    </View>
  );
}

const THUMB = 84;

const styles = StyleSheet.create({
  container: { marginTop: 8, gap: 6 },
  heading: { ...typography.bodyEmphasis, ...textShadow },
  strip: { gap: 8 },
  cell: { width: THUMB, gap: 4 },
  thumb: { width: THUMB, height: THUMB, borderRadius: 10, backgroundColor: colors.surface },
  caption: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  tapLine: { ...typography.caption, color: colors.textMuted, ...textShadow },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  panel: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  large: { width: '100%', height: 360, borderRadius: 10, backgroundColor: colors.surface },
  panelTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  panelBody: { ...typography.body, color: colors.textPrimary, ...textShadow },
  panelActions: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 4 },
  closeText: { ...typography.bodyEmphasis, ...textShadow },
});
