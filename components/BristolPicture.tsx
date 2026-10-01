// A small drawing of each Bristol type (D10, 2026-09-30), built from plain
// Views so it draws the same on a phone and on the desktop with no image
// files. Each is a shape, not a judgement: the colour is whatever the
// caller passes, the same for every type.
import React from 'react';
import { View, type ViewStyle } from 'react-native';
import type { BristolType } from '../lib/bowel';

const WIDTH = 56;
const HEIGHT = 30;

function dot(size: number, left: number, top: number, color: string, extra: ViewStyle = {}): ViewStyle {
  return { position: 'absolute', width: size, height: size, borderRadius: size / 2, left, top, backgroundColor: color, ...extra };
}

function pill(width: number, height: number, left: number, top: number, color: string, extra: ViewStyle = {}): ViewStyle {
  return { position: 'absolute', width, height, borderRadius: height / 2, left, top, backgroundColor: color, ...extra };
}

export default function BristolPicture({ type, color, background }: { type: BristolType; color: string; background: string }) {
  const shapes: ViewStyle[] = [];
  switch (type) {
    case 1:
      shapes.push(dot(9, 4, 11, color), dot(8, 16, 5, color), dot(9, 27, 14, color), dot(7, 39, 7, color), dot(8, 46, 17, color));
      break;
    case 2:
      for (let i = 0; i < 6; i += 1) shapes.push(dot(12, 3 + i * 8, i % 2 === 0 ? 8 : 10, color));
      break;
    case 3:
      shapes.push(pill(50, 13, 3, 9, color));
      for (const left of [13, 23, 33, 43]) shapes.push({ position: 'absolute', left, top: 9, width: 2, height: 5, backgroundColor: background });
      break;
    case 4:
      shapes.push(pill(50, 12, 3, 9, color));
      break;
    case 5:
      shapes.push(pill(14, 10, 3, 6, color), pill(15, 11, 21, 14, color), pill(14, 10, 39, 7, color));
      break;
    case 6:
      shapes.push(
        pill(13, 8, 4, 9, color, { transform: [{ rotate: '20deg' }] }),
        pill(11, 7, 17, 16, color, { transform: [{ rotate: '-25deg' }] }),
        pill(12, 8, 28, 7, color, { transform: [{ rotate: '35deg' }] }),
        pill(10, 7, 40, 15, color, { transform: [{ rotate: '-15deg' }] }),
        dot(4, 13, 4, color),
        dot(4, 36, 22, color),
      );
      break;
    case 7:
      shapes.push(pill(48, 9, 4, 15, color, { opacity: 0.55 }), pill(22, 6, 14, 11, color, { opacity: 0.4 }));
      break;
  }
  return (
    <View style={{ width: WIDTH, height: HEIGHT }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {shapes.map((style, index) => (
        <View key={index} style={style} />
      ))}
    </View>
  );
}
