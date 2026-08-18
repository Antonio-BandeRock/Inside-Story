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
// 2026-08-17: widened from a background-only palette into the app's one
// real source of "generic color combinations," now used well beyond just
// this component -- the app's own iridescent (continuously animated)
// header/footer/rings/popup-card-border system was removed outright, a
// real, confirmed battery drain (see constants/colors.ts's own header note
// on that removal), replaced by "features that stay active but not
// animated." Each combination below now carries an explicit `lighter`
// field -- the one color ScreenHeader.tsx's own app-name text and its
// header/footer divider lines, and TabHub.tsx's popup card border, all now
// use directly, statically, no animation. Grown from 4 to 12 combinations
// at the same time, explicitly requested ("a lot more generic color
// combinations to use... create 8 more"), following the exact same recipe
// as the original 4 (a dark gradient, a mid-saturation midtone blob, and a
// lighter pastel blob) so all 12 read as one consistent, calm family --
// `lighter` reuses each combination's own existing blobs[1] value for the
// original 4 (their look is completely unchanged), and is a freshly chosen
// value in the same recipe for the 8 new ones.
//
// Deliberately calming (dark, muted, low-contrast) rather than letting a
// combination land somewhere jarring. Every hex here is a new, self-
// contained set, not sampled from constants/colors.ts -- these are a
// separate palette from the app's own tab-identity colors, which stay
// exactly as they are.
//
// Exported (not just a local const) as of 2026-08-15: this is the one real
// per-user "color combination" Profile's Appearance & Navigation section
// actually lets someone pick, and AppActionSheet.tsx reuses these exact
// values directly -- a real, explicit request ("matches the app generic
// colors combination chosen in Profile appearance and navigation"), not a
// reach back into a component meant to stay background-only.
export const GENERIC_BACKGROUND_PALETTES: Record<
  GenericPalette,
  { gradient: [string, string]; blobs: [string, string]; lighter: string }
> = {
  lavender: { gradient: ['#241F38', '#3C3260'], blobs: ['#7C6BB0', '#B7A3E0'], lighter: '#B7A3E0' },
  seafoam: { gradient: ['#11302B', '#1E4E46'], blobs: ['#4E9C8B', '#8ECBB9'], lighter: '#8ECBB9' },
  sand: { gradient: ['#332619', '#54402B'], blobs: ['#C9A56F', '#E8CFA0'], lighter: '#E8CFA0' },
  dusk: { gradient: ['#2A1E33', '#432A47'], blobs: ['#B06E92', '#DA9CB8'], lighter: '#DA9CB8' },
  ocean: { gradient: ['#152233', '#1F3A52'], blobs: ['#4C7FA6', '#8FBBDA'], lighter: '#8FBBDA' },
  forest: { gradient: ['#152A20', '#204A35'], blobs: ['#4B8F68', '#8BCBA3'], lighter: '#8BCBA3' },
  wine: { gradient: ['#33141C', '#54202C'], blobs: ['#A85368', '#DA96A5'], lighter: '#DA96A5' },
  slate: { gradient: ['#20242E', '#333A48'], blobs: ['#6B7385', '#A5ADBD'], lighter: '#A5ADBD' },
  copper: { gradient: ['#331F16', '#5A3722'], blobs: ['#B97A4C', '#E3B183'], lighter: '#E3B183' },
  midnight: { gradient: ['#181B33', '#272C52'], blobs: ['#5C63A8', '#9CA3DE'], lighter: '#9CA3DE' },
  moss: { gradient: ['#252B16', '#3E4726'], blobs: ['#8A9C55', '#C3D194'], lighter: '#C3D194' },
  plum: { gradient: ['#2C1830', '#452650'], blobs: ['#8E5B96', '#C696CE'], lighter: '#C696CE' },
};

export function GenericBackground({ palette }: { palette: GenericPalette }) {
  const scheme = GENERIC_BACKGROUND_PALETTES[palette];
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
