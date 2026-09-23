import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';

// A single circular "fuel gauge" -- one nutrient's percent-of-target as a
// ring instead of a table row, meant to be glanced at in a row of several
// rather than read one at a time. Deliberately caps the drawn fill at 100%
// even when percent is higher (excess intake still reads as "a full
// ring," not a ring that overflows itself) -- the numeric label underneath
// is where an over-100% amount actually shows.
export function ProgressRing({
  percent,
  color,
  // 2026-08-29: an optional second colour. When given, the arc is drawn
  // as a gradient from `color` to `gradientTo` rather than one flat
  // colour, so the ring visibly travels from where it started toward
  // where it is heading as it fills. Callers that pass only `color` are
  // unchanged and still draw a solid ring.
  gradientTo,
  // 2026-09-23: how much of `percent` came from a supplement rather than
  // from food. The standing rule is that everywhere the app shows a
  // nutrient amount it says which of the two it came from, and a single
  // filled ring said nothing: 100% looks the same whether it came from
  // lentils or from a capsule. Given, the last stretch of the ring is
  // drawn in the supplement colour, so the ring reads as a two-segment
  // bar bent into a circle. Left out, the ring is exactly what it was.
  supplementPercent = 0,
  size = 64,
  strokeWidth = 7,
  label,
  sublabel,
}: {
  percent: number;
  color: string;
  gradientTo?: string;
  supplementPercent?: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const strokeDashoffset = circumference * (1 - clamped / 100);
  // The supplement can only ever be part of what is drawn: a ring already
  // capped at 100% cannot grow a second time to make room for it.
  const supplementDrawn = Math.max(0, Math.min(supplementPercent, clamped));
  const foodDrawn = clamped - supplementDrawn;
  const supplementLength = circumference * (supplementDrawn / 100);
  // Several rings render side by side in one row, and an SVG gradient is
  // referenced by id, so a fixed id would make every ring after the first
  // paint with the first one's colours.
  const gradientId = `ring-${useId()}`;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {gradientTo ? (
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={color} />
              <Stop offset="1" stopColor={gradientTo} />
            </LinearGradient>
          </Defs>
        ) : null}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradientTo ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth}
          fill="none"
          // A round cap at the end of the food stretch would sit half a
          // stroke past where food actually stopped, which is the whole
          // thing this segment is here to be honest about.
          strokeLinecap={supplementDrawn > 0 ? 'butt' : 'round'}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={
            supplementDrawn > 0 ? circumference * (1 - foodDrawn / 100) : strokeDashoffset
          }
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
        {supplementDrawn > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={SUPPLEMENT_COLOR}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${supplementLength} ${circumference}`}
            // A negative offset starts the dash further round the circle,
            // which is where food left off.
            strokeDashoffset={-circumference * (foodDrawn / 100)}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        ) : null}
      </Svg>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      {sublabel ? (
        <Text style={styles.sublabel} numberOfLines={1}>{sublabel}</Text>
      ) : null}
    </View>
  );
}

// The same amber Insights > Nutrients draws a supplement share in, so the
// two places that split food from supplement read as one language.
const SUPPLEMENT_COLOR = colors.statusYellowOnSurface;

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 78 },
  label: { ...typography.captionEmphasis, ...textShadow, color: colors.textPrimary, marginTop: 6, textAlign: 'center', fontWeight: '400' },
  sublabel: { ...typography.caption, ...textShadow, color: colors.textSecondary, textAlign: 'center' },
});
