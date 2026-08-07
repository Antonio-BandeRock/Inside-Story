import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import type { GenericPalette } from '../lib/visualPreferences';

// A calm, code-only alternative to the shared/per-tab photography --
// 2026-08-08, built for the new visual-preferences opt-out (see
// lib/visualPreferences.ts's own header comment). Deliberately not a photo
// substitute: a soft gradient plus two large, low-opacity static "blob"
// shapes reading as gentle abstract imagery without needing any new image
// asset or animation -- no Reanimated, no Image decode, nothing running
// every frame, which is also the point: this is the low-resource option for
// anyone who found the animated sky a real battery drain.
//
// Four fixed combinations, not a color picker -- keeps every option
// deliberately calming (dark, muted, low-contrast) rather than letting a
// combination land somewhere jarring. Every hex here is a new, self-
// contained set, not sampled from constants/colors.ts -- explicitly not the
// app's own iridescent/tab palette, since the person's own request was
// clear that iridescence and the rest of the app's real color scheme stay
// exactly as they are; this is a separate, opt-in "look" only for the
// background layer itself.
const PALETTES: Record<GenericPalette, { gradient: [string, string]; blobs: [string, string] }> = {
  lavender: { gradient: ['#241F38', '#3C3260'], blobs: ['#7C6BB0', '#B7A3E0'] },
  seafoam: { gradient: ['#11302B', '#1E4E46'], blobs: ['#4E9C8B', '#8ECBB9'] },
  sand: { gradient: ['#332619', '#54402B'], blobs: ['#C9A56F', '#E8CFA0'] },
  dusk: { gradient: ['#2A1E33', '#432A47'], blobs: ['#B06E92', '#DA9CB8'] },
};

export function GenericBackground({ palette }: { palette: GenericPalette }) {
  const scheme = PALETTES[palette];
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <LinearGradient
        colors={scheme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.blob, styles.blobTop, { backgroundColor: scheme.blobs[0] }]} />
      <View style={[styles.blob, styles.blobBottom, { backgroundColor: scheme.blobs[1] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.16 },
  blobTop: { width: 340, height: 340, top: -90, right: -70 },
  blobBottom: { width: 280, height: 280, bottom: 20, left: -80, opacity: 0.12 },
});
