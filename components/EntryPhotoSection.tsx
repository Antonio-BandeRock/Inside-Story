// A real, editable photo slot on any Digest card that actually resolves to
// something a person can attach a photo to -- Purple Digest's Recipes, My
// Kitchen, and My Favorites, 2026-08-15 direct request: "provide a way to
// take a picture using the app of the meal and upload it to the recipe."
//
// Lives on the card itself rather than inside any of the 11 Food builders
// -- a photo of the finished dish is naturally taken after cooking, while
// looking at the saved/favorited/curated card, not mid-build, and this
// keeps a real, substantial change contained to one screen instead of
// touching 11 already-huge builder files.
//
// resolvePhotoTarget is the one, real, pure place a DigestEntry gets
// mapped onto lib/mealPhotos.ts's own PhotoTarget union -- returns null for
// every entry (the overwhelming majority of this Digest's 1,500+ entries)
// that isn't a saved builder creation, a favorite, or a curated recipe, in
// which case this whole component renders nothing at all.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppActionSheet } from './AppActionSheet';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import type { DigestEntry } from '../lib/digest/types';
import { getPhotoForTarget, pickAndSaveMealPhoto, setPhotoForTarget, type PhotoTarget } from '../lib/mealPhotos';

export function resolvePhotoTarget(entry: DigestEntry): PhotoTarget | null {
  const action = entry.dynamicAction;
  if (action) {
    if (action.kind === 'component') {
      // My Kitchen's own componentId is a real row in one of the 11
      // saved-record tables; My Favorites' own componentId (despite the
      // identical field name) is actually a favorites.id -- see
      // lib/digestDynamicEntries.ts's own buildMyFavoritesComponentEntry.
      return entry.category === 'myFavorites'
        ? { kind: 'favorite', favoriteId: action.componentId }
        : { kind: 'component', componentType: action.componentType, componentId: action.componentId };
    }
    if (action.kind === 'meal') {
      return { kind: 'favorite', favoriteId: action.mealFavoriteId };
    }
    if (action.kind === 'shared') {
      return { kind: 'sharedRecipe', sharedRecipeId: action.sharedRecipeId };
    }
  }
  if (entry.linkedCuratedRecipeId) {
    return { kind: 'curatedRecipe', recipeId: entry.linkedCuratedRecipeId };
  }
  return null;
}

export function EntryPhotoSection({ entry, tabColor }: { entry: DigestEntry; tabColor: string }) {
  const target = resolvePhotoTarget(entry);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    getPhotoForTarget(target).then((uri) => {
      if (!cancelled) setPhotoUri(uri);
    });
    return () => {
      cancelled = true;
    };
    // target is a fresh object every render (resolvePhotoTarget is pure,
    // derived from entry) -- entry.id alone is what actually identifies
    // which real photo this section is about, and is stable across
    // unrelated re-renders of the same card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

  if (!target) return null;
  // A staged, not-yet-decided share (lib/sharing.ts's own shared_recipes
  // table) shows whatever real photo the sender included, read-only --
  // nothing to change or remove until the person actually promotes it to
  // a real saved record or favorite of their own.
  const editable = target.kind !== 'sharedRecipe';

  async function handlePick(source: 'camera' | 'library') {
    if (!target) return;
    setLoading(true);
    try {
      const result = await pickAndSaveMealPhoto(source, entry.id, photoUri ?? undefined);
      if (result.status === 'success') {
        await setPhotoForTarget(target, result.uri);
        setPhotoUri(result.uri);
      } else if (result.status === 'permission-denied') {
        Alert.alert(
          'Permission needed',
          source === 'camera' ? 'Allow camera access in your phone settings to take a photo.' : 'Allow photo access in your phone settings to choose one.',
        );
      } else if (result.status === 'too-small') {
        Alert.alert('Photo too small', 'Please choose a larger photo.');
      } else if (result.status === 'too-large-after-compression') {
        Alert.alert('Photo too large', "This photo couldn't be made small enough to save. Please try a different one.");
      } else if (result.status === 'error') {
        Alert.alert(
          'Something went wrong',
          source === 'camera'
            ? `${result.message} (Taking a photo needs a real camera permission this build may not have yet -- try Choose from Library instead.)`
            : result.message,
        );
      }
      // 'canceled' -- no message needed, the person just backed out.
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (!target) return;
    setLoading(true);
    try {
      await setPhotoForTarget(target, null);
      setPhotoUri(null);
    } finally {
      setLoading(false);
    }
  }

  function openPicker() {
    setSheetVisible(true);
  }

  return (
    <View style={styles.container}>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" /> : null}
      {editable ? (
        loading ? (
          <ActivityIndicator color={tabColor} style={styles.spinner} />
        ) : photoUri ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={openPicker} hitSlop={8}>
              <Text style={[styles.actionText, { color: tabColor }]}>Change photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRemove} hitSlop={8}>
              <Text style={styles.removeText}>Remove photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addRow} activeOpacity={0.8} onPress={openPicker}>
            <Ionicons name="camera-outline" size={18} color={tabColor} />
            <Text style={[styles.addText, { color: tabColor }]}>Add a Photo</Text>
          </TouchableOpacity>
        )
      ) : null}
      <AppActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Add a Photo"
        actions={[
          { label: 'Take a Photo', onPress: () => handlePick('camera') },
          { label: 'Choose from Library', onPress: () => handlePick('library') },
          { label: 'Cancel', onPress: () => {} },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12, marginBottom: 4 },
  photo: { width: '100%', height: 180, borderRadius: 12, backgroundColor: colors.surface },
  spinner: { marginTop: 8 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  addText: { ...typography.bodyEmphasis },
  actionsRow: { flexDirection: 'row', gap: 20, marginTop: 8 },
  actionText: { ...typography.bodyEmphasis },
  removeText: { ...typography.bodyEmphasis, color: colors.danger },
});
