import { useId, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { colors, mixHex } from '../constants/colors';

// The shared "this is selected / this is where you are" marker, drawn as a
// dark well pressed into the surface, 2026-10-07 (1.0.62.13). Direct request,
// after the new app logo's debossed window: "Can the Tab LensHub icons use
// that in place of the current lite colored overlay with the line around
// it, as well as on the TabHub and all of the LensHub menus for each item
// selected in the menu, including the Info icon?", then "Do the dark versions
// only... add the faint tab-colored glow inside the well for each tab icon."
//
// It replaces a menuSurface disc with a lightened buttonColor ring (the
// 2026-07-26 to 2026-10-06 version; its history is in git). The name stays
// because every menu imports it, and it still marks the same thing.
//
// React Native has no inset shadow, so the well is four SVG circles drawn to
// the same finish as the Ghostead mark's deboss filter
// (docs/app-links/public/ghostead-icon.svg): a dark floor, a faint glow in
// the colour of whatever sits in it, a shadow falling in from the top left,
// and a thin catch of light on the lower right rim where the edge turns
// toward the viewer. The floor is the ground theme's background taken
// further toward black, so it reads as a hole in the lighter menu card on
// every theme and still sits a step below the footer when used there.
const WELL_FLOOR = mixHex(colors.background, '#000000', 0.4);

export function ActiveRingCircle({
  size,
  glowColor,
  glowOpacity = 0.34,
  rimColor = '#FFFFFF',
  rimOpacity = 0.2,
  children,
}: {
  // Diameter of the well. Content passed as `children` is centred in it.
  size: number;
  // The colour of the faint light inside the well, normally the tab colour
  // of the icon sitting in it. Left out, the well has no glow.
  glowColor?: string;
  glowOpacity?: number;
  // The lower right rim. TabHub's button passes the ground theme's
  // buttonColor so its well carries the theme quietly.
  rimColor?: string;
  rimOpacity?: number;
  children?: ReactNode;
}) {
  // A gradient id must be unique per instance or every well on screen draws
  // with the first one's colours; useId's colons are not valid in url(#...).
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const r = size / 2;
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: r }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          {glowColor ? (
            <RadialGradient id={`g${id}`} cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
              <Stop offset="0" stopColor={glowColor} stopOpacity={glowOpacity} />
              <Stop offset="0.6" stopColor={glowColor} stopOpacity={glowOpacity * 0.4} />
              <Stop offset="1" stopColor={glowColor} stopOpacity={0} />
            </RadialGradient>
          ) : null}
          <RadialGradient id={`s${id}`} cx="0.6" cy="0.64" r="0.66" fx="0.6" fy="0.64">
            <Stop offset="0.55" stopColor="#000000" stopOpacity={0} />
            <Stop offset="0.85" stopColor="#000000" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0.8} />
          </RadialGradient>
          <LinearGradient id={`r${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={rimColor} stopOpacity={0} />
            <Stop offset="0.55" stopColor={rimColor} stopOpacity={0} />
            <Stop offset="1" stopColor={rimColor} stopOpacity={rimOpacity} />
          </LinearGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill={WELL_FLOOR} />
        {glowColor ? <Circle cx={r} cy={r} r={r} fill={`url(#g${id})`} /> : null}
        <Circle cx={r} cy={r} r={r} fill={`url(#s${id})`} />
        <Circle cx={r} cy={r} r={r - 0.75} fill="none" stroke={`url(#r${id})`} strokeWidth={1.5} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
