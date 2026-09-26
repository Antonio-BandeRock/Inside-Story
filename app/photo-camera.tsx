// The app's camera, 2026-09-26 (1.0.53.7). Direct request: photos "taken from
// within the app to be added to the app without the added step of pulling
// directly from the gallery, though the gallery ends up with the full sized
// camera picture with full details."
//
// Opened with what the photo is of (ownerKind and ownerId, lib/media.ts). A
// shot is kept at its two sizes under that owner straight away, and the
// untouched original goes to the phone's gallery when this build can put it
// there (lib/photoNative.ts); when it cannot yet, a line under the shutter
// says so rather than letting anybody believe the original is kept.
//
// With `guide`, the last photo of the same thing is drawn faintly over the
// view, so a photo taken from the same spot every day lines up with the one
// before (Photo Series, lib/photoSeries.ts). The guide can be switched off
// here, and is offered on anything that already has a photo.
//
// With `replace`, the new photo takes the place of any the owner had, which
// is how a dish or meal card keeps its one photo.
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { isDesktopApp } from '../lib/desktop/bridge';
import { phoneOnlyNotice } from '../lib/desktop/phoneOnly';
import { PHOTO_ORIGINAL_NOT_KEPT } from '../lib/media';
import { keepPhoto, listMediaFor, mediaDisplayUri, removePhoto } from '../lib/mediaDb';
import { canSaveOriginalToGallery } from '../lib/photoNative';

/** How strongly the last photo shows through. Enough to line up an edge
 *  against, faint enough that the live view is still what is seen. */
const GUIDE_OPACITY = 0.35;

export default function PhotoCameraScreen() {
  const params = useLocalSearchParams<{ ownerKind?: string; ownerId?: string; guide?: string; replace?: string; title?: string }>();
  const ownerKind = params.ownerKind ?? '';
  const ownerId = params.ownerId ?? '';
  const replace = params.replace === '1';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [guideUri, setGuideUri] = useState<string | null>(null);
  const [guideOn, setGuideOn] = useState(params.guide === '1');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const galleryReady = canSaveOriginalToGallery();

  useEffect(() => {
    if (!ownerKind || !ownerId) return;
    let cancelled = false;
    void (async () => {
      const items = await listMediaFor(ownerKind, ownerId);
      // Newest day first; the guide is the most recent photo of the thing.
      const latest = items[0];
      const uri = latest ? await mediaDisplayUri(latest) : null;
      if (!cancelled) setGuideUri(uri);
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerKind, ownerId]);

  async function handleShutter() {
    if (!cameraRef.current || busy || !ownerKind || !ownerId) return;
    setBusy(true);
    setProblem(null);
    try {
      const earlier = replace ? await listMediaFor(ownerKind, ownerId) : [];
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.92 });
      const result = await keepPhoto(picture.uri, picture.width, picture.height, { kind: ownerKind, id: ownerId }, {
        originalToGallery: true,
        deleteSource: true,
      });
      if (result.status === 'added') {
        for (const item of earlier) await removePhoto(item);
        router.back();
        return;
      }
      if (result.status === 'too-small') setProblem('That photo came out too small to keep. Please try again.');
      else if (result.status === 'too-large') setProblem('That photo could not be made small enough to keep. Please try again.');
      else if (result.status === 'error') setProblem(`The photo was not kept. ${result.message}`);
    } catch (error) {
      setProblem(`The photo was not kept. ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  const title = params.title ? `Photo of ${params.title}` : 'Take a Photo';

  if (isDesktopApp()) {
    const notice = phoneOnlyNotice('photo');
    return (
      <View style={styles.messageScreen}>
        <Stack.Screen options={{ headerShown: true, title, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary }} />
        <View style={styles.messagePanel}>
          <Text style={styles.messageTitle}>{notice.title}</Text>
          <Text style={styles.messageBody}>{notice.message}</Text>
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.messageScreen}>
        <Stack.Screen options={{ headerShown: true, title, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.messageScreen}>
        <Stack.Screen options={{ headerShown: true, title, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary }} />
        <View style={styles.messagePanel}>
          <Text style={styles.messageTitle}>The camera needs your permission</Text>
          <Text style={styles.messageBody}>
            Photos taken here are kept with what they are of. The app asks once, and the choice can be changed later in your phone settings.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={() => void requestPermission()} activeOpacity={0.8}>
            <Text style={styles.permissionButtonText}>Allow the Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      {guideOn && guideUri ? (
        <Image source={{ uri: guideUri }} style={[StyleSheet.absoluteFill, { opacity: GUIDE_OPACITY }]} contentFit="cover" pointerEvents="none" />
      ) : null}

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.roundButton} accessibilityLabel="Close the camera">
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {title}
        </Text>
        {guideUri ? (
          <TouchableOpacity
            onPress={() => setGuideOn((on) => !on)}
            hitSlop={10}
            style={[styles.guideButton, guideOn ? styles.guideButtonOn : null]}
            accessibilityLabel={guideOn ? 'Hide the last photo' : 'Line up with the last photo'}
          >
            <Ionicons name="layers-outline" size={18} color="#FFFFFF" />
            <Text style={styles.guideButtonText}>{guideOn ? 'Guide On' : 'Guide Off'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.roundButton} />
        )}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {problem ? <Text style={styles.bottomLine}>{problem}</Text> : null}
        {guideOn && guideUri ? <Text style={styles.bottomLine}>Line up the view with the faint photo, then take this one.</Text> : null}
        {!galleryReady ? <Text style={styles.bottomLineMuted}>{PHOTO_ORIGINAL_NOT_KEPT}</Text> : null}
        <TouchableOpacity
          style={styles.shutter}
          onPress={() => void handleShutter()}
          disabled={busy}
          activeOpacity={0.8}
          accessibilityLabel="Take the photo"
        >
          {busy ? <ActivityIndicator color={colors.primary} /> : <View style={styles.shutterInner} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CONTROL_FILL = 'rgba(0,0,0,0.55)';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  messageScreen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 16 },
  messagePanel: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 10, maxWidth: 480, width: '100%' },
  messageTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  messageBody: { ...typography.body, color: colors.textPrimary, ...textShadow },
  permissionButton: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  permissionButtonText: { ...typography.bodyEmphasis, color: '#FFFFFF', ...textShadow },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
  },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: CONTROL_FILL, alignItems: 'center', justifyContent: 'center' },
  topTitle: {
    ...typography.bodyEmphasis,
    color: '#FFFFFF',
    flexShrink: 1,
    backgroundColor: CONTROL_FILL,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...textShadow,
  },
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CONTROL_FILL,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  guideButtonOn: { borderWidth: 1, borderColor: '#FFFFFF' },
  guideButtonText: { ...typography.caption, color: '#FFFFFF', ...textShadow },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  bottomLine: {
    ...typography.caption,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: CONTROL_FILL,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...textShadow,
  },
  bottomLineMuted: {
    ...typography.caption,
    color: '#E6E6E6',
    textAlign: 'center',
    backgroundColor: CONTROL_FILL,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...textShadow,
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CONTROL_FILL,
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF' },
});
