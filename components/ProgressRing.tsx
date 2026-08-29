import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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
  size = 64,
  strokeWidth = 7,
  label,
  sublabel,
}: {
  percent: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const strokeDashoffset = circumference * (1 - clamped / 100);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
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
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      {sublabel ? (
        <Text style={styles.sublabel} numberOfLines={1}>{sublabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 78 },
  label: { ...typography.captionEmphasis, ...textShadow, color: colors.textPrimary, marginTop: 6, textAlign: 'center', fontWeight: '400' },
  sublabel: { ...typography.caption, ...textShadow, color: colors.textSecondary, textAlign: 'center' },
});
