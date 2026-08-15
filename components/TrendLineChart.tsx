import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

const HEIGHT = 140;
const TOP_Y = 16;
const BASE_Y = HEIGHT - 30;
const NODE_RADIUS = 6;
// A real gutter for the new yMin/yMax value labels, 2026-08-15 -- reported
// directly: "there is a line, but it literally tells me nothing." A bare
// line with only two DATE labels (the chart's own pre-existing
// formatShortDate row) never told anyone what the line's own height
// actually meant. Wide enough for a real 3-digit value ("120%") without
// crowding the leftmost plotted point.
const Y_AXIS_LABEL_WIDTH = 34;

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
  referenceLineLabel,
  valueFormatter = (value) => String(Math.round(value)),
  emptyMessage = 'Not enough logged history yet to chart a trend.',
  lineColor = colors.primary,
}: {
  points: TrendLineChartPoint[];
  yMin: number;
  yMax: number;
  referenceLine?: number;
  // What the dashed reference line actually represents (e.g. "100% target",
  // "Typical range midpoint") -- an unlabeled dashed line is exactly as
  // uninformative as an unlabeled axis was.
  referenceLineLabel?: string;
  // How a raw plotted value should read as text -- nutrients want "45%",
  // weight wants "72 kg", a lab test wants its own real unit. Defaults to a
  // plain rounded number for any caller that doesn't care.
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
  lineColor?: string;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const plotWidth = Math.max(160, windowWidth - 40 - NODE_RADIUS * 2 - Y_AXIS_LABEL_WIDTH);

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
    return Y_AXIS_LABEL_WIDTH + NODE_RADIUS + t * plotWidth;
  }

  function valueToY(value: number): number {
    const t = Math.max(0, Math.min(1, (value - yMin) / valueSpan));
    return BASE_Y - t * (BASE_Y - TOP_Y);
  }

  const pathD = sorted.map((point, index) => `${index === 0 ? 'M' : 'L'} ${dateToX(point.date)},${valueToY(point.value)}`).join(' ');
  const plotRightEdge = Y_AXIS_LABEL_WIDTH + NODE_RADIUS + plotWidth;
  const referenceY = referenceLine != null ? valueToY(referenceLine) : null;

  return (
    <View style={styles.container}>
      <Svg width={plotRightEdge + NODE_RADIUS} height={HEIGHT}>
        {/* Real yMax/yMin value labels -- the actual fix for "the line
            tells me nothing." Placed in the left gutter, roughly level
            with the chart's own top and bottom plotting bounds. */}
        <SvgText x={0} y={TOP_Y + 4} fontSize={11} fill={colors.textMuted}>
          {valueFormatter(yMax)}
        </SvgText>
        <SvgText x={0} y={BASE_Y + 4} fontSize={11} fill={colors.textMuted}>
          {valueFormatter(yMin)}
        </SvgText>

        {referenceY != null ? (
          <Line
            x1={Y_AXIS_LABEL_WIDTH + NODE_RADIUS}
            x2={plotRightEdge}
            y1={referenceY}
            y2={referenceY}
            stroke={colors.border}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
        ) : null}
        {referenceY != null && referenceLineLabel ? (
          <SvgText x={Y_AXIS_LABEL_WIDTH + NODE_RADIUS + 4} y={referenceY - 4} fontSize={10} fill={colors.textMuted}>
            {referenceLineLabel}
          </SvgText>
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
      <View style={[styles.labelRow, { paddingLeft: Y_AXIS_LABEL_WIDTH }]}>
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
  // No border of its own, 2026-07-27 -- this component's only real caller
  // (app/(tabs)/trends.tsx) now always wraps it in its own bordered
  // chartCard, so a second border here would nest one box inside another.
  emptyBox: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
