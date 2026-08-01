import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { ScheduleItemRecord } from '../lib/db';
import { formatTime12 } from '../lib/timeOfDay';

const HEIGHT = 120;
const TOP_Y = 26;
const BASE_Y = HEIGHT - 34;
const NODE_RADIUS = 8;

function timeStringToMinutes(time24: string): number {
  const [hourStr, minuteStr] = time24.split(':');
  return Number(hourStr) * 60 + Number(minuteStr ?? '0');
}

// Point on the quadratic bezier that stands in for the "sun's path" --
// P0 (day start) and P2 (day end) sit low, P1 (midday) sits high, so the
// whole day reads as one smooth rise-and-fall arc rather than a flat line.
function pointOnArc(t: number, width: number) {
  const x = 2 * (1 - t) * t * (width / 2) + t * t * width;
  const y = (1 - t) * (1 - t) * BASE_Y + 2 * (1 - t) * t * TOP_Y + t * t * BASE_Y;
  return { x, y };
}

function nodeColor(item: ScheduleItemRecord, nowMinutes: number): string {
  if (item.status === 'logged') return colors.primary;
  if (item.status === 'skipped') return colors.textMuted;
  const itemMinutes = timeStringToMinutes(item.scheduledFor.slice(11, 16));
  return itemMinutes < nowMinutes ? colors.statusFlagged : colors.surface;
}

function nodeStroke(item: ScheduleItemRecord): string {
  return item.status === 'planned' ? colors.primary : colors.surface;
}

// A visual "day arc" standing in for a plain checklist -- today's schedule
// items plotted by time-of-day along a sunrise-to-sunset curve, with a
// moving marker for right now. Tapping a node hands back that item so the
// caller can show detail/quick actions, rather than this component owning
// any modal itself.
export function DayArc({
  items,
  dayStartMinutes = 6 * 60,
  dayEndMinutes = 22 * 60,
  onPressItem,
  // Optional override for the "6:00 AM"/"10:00 PM" labels' own color --
  // 2026-07-27, so Home's own arcCard can tint them to match its border
  // (Schedules' identity color) like every other font inside that box.
  // Defaults to the plain neutral this always used, for any other caller.
  labelColor = colors.textMuted,
}: {
  items: ScheduleItemRecord[];
  dayStartMinutes?: number;
  dayEndMinutes?: number;
  onPressItem: (item: ScheduleItemRecord) => void;
  labelColor?: string;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(200, windowWidth - 40 - NODE_RADIUS * 2);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const span = dayEndMinutes - dayStartMinutes;

  function timeToT(minutes: number): number {
    return Math.max(0, Math.min(1, (minutes - dayStartMinutes) / span));
  }

  const nowPoint = pointOnArc(timeToT(nowMinutes), width);
  const showSun = nowMinutes >= dayStartMinutes && nowMinutes <= dayEndMinutes;

  return (
    <View style={styles.container}>
      <Svg width={width + NODE_RADIUS * 2} height={HEIGHT}>
        <Path
          d={`M ${NODE_RADIUS},${BASE_Y} Q ${NODE_RADIUS + width / 2},${TOP_Y} ${NODE_RADIUS + width},${BASE_Y}`}
          stroke={colors.border}
          strokeWidth={3}
          fill="none"
        />

        {showSun ? (
          <>
            <Circle cx={NODE_RADIUS + nowPoint.x} cy={nowPoint.y} r={14} fill={colors.accentTint} />
            <Circle cx={NODE_RADIUS + nowPoint.x} cy={nowPoint.y} r={7} fill={colors.accent} />
          </>
        ) : null}

        {items.map((item) => {
          const t = timeToT(timeStringToMinutes(item.scheduledFor.slice(11, 16)));
          const point = pointOnArc(t, width);
          return (
            <Circle
              key={item.id}
              cx={NODE_RADIUS + point.x}
              cy={point.y}
              r={NODE_RADIUS}
              fill={nodeColor(item, nowMinutes)}
              stroke={nodeStroke(item)}
              strokeWidth={2}
              onPress={() => onPressItem(item)}
            />
          );
        })}
      </Svg>
      <View style={styles.labelRow}>
        <Text style={[styles.labelText, { color: labelColor }]}>{formatTime12(`${Math.floor(dayStartMinutes / 60)}:00`)}</Text>
        <Text style={[styles.labelText, { color: labelColor }]}>{formatTime12(`${Math.floor(dayEndMinutes / 60)}:00`)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: -8 },
  labelText: { ...typography.caption, ...textShadow, color: colors.textMuted },
});
