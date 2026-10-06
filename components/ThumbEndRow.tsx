// A row whose last child belongs at the thumb's end, 1.0.61.15 (2026-10-05):
// the one small action at the end of a list row, Edit beside Remove, a
// stepper's plus. Written in the right-handed order and mirrored for a left
// hand through lib/navigationHand.ts's thumbEndDirection, redrawing the moment
// the hand is switched.
//
// Mirroring a row that does not fill its width (a date box with Today beside
// it) would otherwise pack it against the right edge with Today in the middle,
// so where the children are packed is mirrored with the direction.
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { thumbEndDirection, useNavigationHand } from '../lib/navigationHand';

const MIRRORED_PACKING: Partial<Record<NonNullable<ViewStyle['justifyContent']>, ViewStyle['justifyContent']>> = {
  'flex-start': 'flex-end',
  'flex-end': 'flex-start',
};

export function ThumbEndRow({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const hand = useNavigationHand();
  const direction = thumbEndDirection(hand);
  if (direction === 'row') return <View style={[style, { flexDirection: 'row' }]}>{children}</View>;
  const packing = StyleSheet.flatten(style)?.justifyContent ?? 'flex-start';
  return (
    <View style={[style, { flexDirection: direction, justifyContent: MIRRORED_PACKING[packing] ?? packing }]}>
      {children}
    </View>
  );
}
