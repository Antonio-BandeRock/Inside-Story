// A row of form buttons with the main one on the thumb side, 1.0.61.14
// (2026-10-05). Direct request: "Save on the thumb side, Remove on the far
// side." The buttons keep their order in the source; `primary` says whether
// the main button is written first or last, and lib/navigationHand.ts's
// thumbRowLayout turns that and the navigation hand into a direction. It
// redraws the moment the hand is switched, with no restart.
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { thumbRowLayout, useNavigationHand, type ThumbRowPrimary } from '../lib/navigationHand';

export function ThumbRow({
  primary,
  style,
  children,
}: {
  primary: ThumbRowPrimary;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const hand = useNavigationHand();
  return <View style={[style, thumbRowLayout(hand, primary)]}>{children}</View>;
}
