import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

const HEIGHT = 140;
const TOP_Y = 16;
const BASE_Y = HEIGHT - 30;
const NODE_RADIUS = 6;

const MONTH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatShortDate(dateString: string): string {
  const [, monthStr, dayStr] = dateString.split('-');
  const monthIndex = Number(monthStr) - 1;
  return `${MONTH_ABBREVIATIONS[monthIndex] ?? monthStr} ${Number(dayStr)}`;
}

export type TrendLineChartPoint = { date: string; value: number; color?: string };

// A straight date/value trend line, generalizing DayArc's technique
// (Svg Path + positioned Circle nodes, a raw-value -> {x,y} mapping
// function) from a curved time-of-day axis to a plain straight axis.
// Deliberately uses straight `L` segments rather than DayArc's bezier --
// a real trend line between sparsely-logged days shouldn't imply a false
// smooth curve connecting them.
export function TrendLineChart({
  points,
  yMin,
  yMax,
  referenceLine,
  emptyMessage = 'Not enough logged history yet to chart a trend.',
  lineColor = colors.primary,
}: {
  points: TrendLineChartPoint[];
  yMin: number;
  yMax: number;
  referenceLine?: number;
  emptyMessage?: string;
  lineColor?: string;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(200, windowWidth - 40 - NODE_RADIUS * 2);

  if (points.length < 2) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const rangeStartMs = new Date(sorted[0].date).getTime();
  const rangeEndMs = new Date(sorted[sorted.length - 1].date).getTime();
  const dateSpan = Math.max(1, rangeEndMs - rangeStartMs);
  const valueSpan = Math.max(1e-6, yMax - yMin);

  function dateToX(date: string): number {
    const t = Math.max(0, Math.min(1, (new Date(date).getTime() - rangeStartMs) / dateSpan));
    return NODE_RADIUS + t * width;
  }

  function valueToY(value: number): number {
    const t = Math.max(0, Math.min(1, (value - yMin) / valueSpan));
    return BASE_Y - t * (BASE_Y - TOP_Y);
  }

  const pathD = sorted.map((point, index) => `${index === 0 ? 'M' : 'L'} ${dateToX(point.date)},${valueToY(point.value)}`).join(' ');

  return (
    <View style={styles.container}>
      <Svg width={width + NODE_RADIUS * 2} height={HEIGHT}>
        {referenceLine != null ? (
          <Line
            x1={NODE_RADIUS}
            x2={NODE_RADIUS + width}
            y1={valueToY(referenceLine)}
            y2={valueToY(referenceLine)}
            stroke={colors.border}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
        ) : null}

        <Path d={pathD} stroke={lineColor} strokeWidth={3} fill="none" />

        {sorted.map((point, index) => (
          <Circle
            key={`${point.date}-${index}`}
            cx={dateToX(point.date)}
            cy={valueToY(point.value)}
            r={NODE_RADIUS}
            fill={point.color ?? lineColor}
          />
        ))}
      </Svg>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>{formatShortDate(sorted[0].date)}</Text>
        <Text style={styles.labelText}>{formatShortDate(sorted[sorted.length - 1].date)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 2 },
  labelText: { ...typography.caption, color: colors.textMuted },
  emptyBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
