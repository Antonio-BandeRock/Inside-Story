// The body map (D11, 2026-09-30): a front and a back outline where the
// person taps the areas a flare or a food reaction was in. The shapes and
// the words for each area come from lib/bodyMap.ts. Every area can also be
// picked from a plain list, for anyone who finds the drawing hard to aim at
// or reads with a screen reader, which is also what makes it usable where
// a tap on a shape is awkward.
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Ellipse, Rect } from 'react-native-svg';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  BODY_BOX,
  SIDES_NOTE,
  regionLabel,
  regionsFor,
  shapesFor,
  toggleRegion,
  type BodyView,
} from '../lib/bodyMap';

const DRAWN_WIDTH = 150;

export function BodyMap({
  selected,
  onChange,
  color,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  color: string;
}) {
  const [view, setView] = useState<BodyView>('front');
  const [asList, setAsList] = useState(false);
  const toggle = (key: string) => onChange(toggleRegion(selected, key));
  const scale = DRAWN_WIDTH / BODY_BOX.width;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {(['front', 'back'] as BodyView[]).map((each) => (
          <TouchableOpacity
            key={each}
            style={[styles.pill, view === each && { backgroundColor: color, borderColor: color }]}
            onPress={() => setView(each)}
            accessibilityRole="button"
            accessibilityState={{ selected: view === each }}
          >
            <Text style={[styles.pillText, { color }, view === each && styles.pillTextActive]}>
              {each === 'front' ? 'Front' : 'Back'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.pill, asList && { backgroundColor: color, borderColor: color }]}
          onPress={() => setAsList(!asList)}
          accessibilityRole="button"
          accessibilityState={{ selected: asList }}
        >
          <Text style={[styles.pillText, { color }, asList && styles.pillTextActive]}>Pick from a list</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.caption, { color }]}>{SIDES_NOTE}</Text>

      {asList ? (
        <View style={styles.row}>
          {regionsFor(view).map((region) => {
            const on = selected.includes(region.key);
            return (
              <TouchableOpacity
                key={region.key}
                style={[styles.pill, on && { backgroundColor: color, borderColor: color }]}
                onPress={() => toggle(region.key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <Text style={[styles.pillText, { color }, on && styles.pillTextActive]}>{region.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.drawing} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Svg width={DRAWN_WIDTH} height={BODY_BOX.height * scale} viewBox={`0 0 ${BODY_BOX.width} ${BODY_BOX.height}`}>
            {shapesFor(view).map(({ key, shape }) => {
              const on = selected.includes(key);
              const common = {
                fill: color,
                fillOpacity: on ? 0.85 : 0.12,
                stroke: color,
                strokeWidth: 1,
                onPress: () => toggle(key),
              };
              return shape.kind === 'ellipse' ? (
                <Ellipse key={key} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} />
              ) : (
                <Rect key={key} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={3} {...common} />
              );
            })}
          </Svg>
        </View>
      )}

      <Text style={[styles.caption, { color }]}>
        {selected.length === 0 ? 'No area marked. That is fine to leave.' : `Marked: ${selected.map(regionLabel).join(', ')}`}
      </Text>
      {selected.length > 0 ? (
        <TouchableOpacity onPress={() => onChange([])} accessibilityRole="button">
          <Text style={[styles.clear, { color }]}>Clear the areas</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  drawing: { alignItems: 'center', paddingVertical: 4 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  pillText: { ...typography.caption, ...textShadow },
  pillTextActive: { color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
  caption: { ...typography.caption, ...textShadow },
  clear: { ...typography.caption, textDecorationLine: 'underline', ...textShadow },
});
