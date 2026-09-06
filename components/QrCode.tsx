// A QR code, drawn with react-native-svg.
//
// Why this exists at all: an invite has to reach the other phone, and the two
// routes tried before this both failed for the same underlying reason. They
// depended on something outside this app cooperating -- a messaging app
// linkifying a custom scheme (it never will), and Android handing over a
// content:// URI with a filename in it (it usually has none). A QR on the
// screen and a camera pointed at it is the one channel this app controls end
// to end, which is exactly why Signal, WhatsApp and Discord all pair devices
// this way.
//
// The encoder (qrcode-generator) is pure JS with no dependencies of its own
// and no native code, so it ships over an ordinary EAS Update. That was
// verified rather than assumed: the runtime fingerprint is byte-identical
// before and after adding it, because @expo/fingerprint's inputs are config
// plugins, config-referenced assets, and node_modules packages carrying
// native code -- the root package.json is not an input at all.
//
// The geometry lives in lib/qrLayout.ts so it can be tested. Every way it can
// be wrong renders as a plausible-looking square that silently will not scan,
// so arithmetic is the only real check.
import { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { buildQrDrawing } from '../lib/qrLayout';

// Deliberately NOT theme tokens. A QR has to be dark-on-light whichever theme
// the person is using: inverting it for dark mode is a well-known way to make
// a code that many scanners quietly refuse to read.
const LIGHT = '#FFFFFF';
const DARK = '#000000';

type Props = {
  value: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function QrCode({ value, size, style, accessibilityLabel }: Props) {
  const drawing = useMemo(() => buildQrDrawing(value), [value]);

  // Only reachable if the payload outgrew the largest QR version, which an
  // invite cannot do. Render nothing rather than crash the screen someone is
  // standing there mid-pairing on.
  if (!drawing) return null;

  return (
    <View style={style}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${drawing.extent} ${drawing.extent}`}
        accessibilityLabel={accessibilityLabel}
      >
        <Rect x={0} y={0} width={drawing.extent} height={drawing.extent} fill={LIGHT} />
        <Path d={drawing.path} fill={DARK} />
      </Svg>
    </View>
  );
}
