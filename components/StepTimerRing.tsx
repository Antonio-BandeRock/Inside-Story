// The shrinking ring on a timed routine step (B5). Drawn from the timer the
// routine screen holds; this component keeps no time of its own. Past the
// step's time the ring is empty and the words count on in the same colour,
// since going over is never a failure (lib/stepTimer.ts).
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  isPaused,
  remainingFraction,
  ringDash,
  timerAccessibilityLabel,
  timerWords,
  type StepTimer,
} from '../lib/stepTimer';

const SIZE = 168;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;

export function StepTimerRing({
  timer,
  nowMs,
  onPauseResume,
}: {
  timer: StepTimer;
  nowMs: number;
  onPauseResume: () => void;
}) {
  const { circumference, offset } = ringDash(RADIUS, remainingFraction(timer, nowMs));
  const { face, caption } = timerWords(timer, nowMs);
  const paused = isPaused(timer);
  return (
    <View style={styles.wrap}>
      <View
        style={styles.ring}
        accessible
        accessibilityRole="timer"
        accessibilityLabel={timerAccessibilityLabel(timer, nowMs)}
      >
        <Svg width={SIZE} height={SIZE} style={styles.svg}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.border} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.primary}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            fill="none"
          />
        </Svg>
        <View style={styles.centre} pointerEvents="none">
          <Text style={styles.face}>{face}</Text>
          <Text style={styles.caption}>{caption}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.pauseButton} onPress={onPauseResume}>
        <Ionicons name={paused ? 'play' : 'pause'} size={16} color={colors.textSecondary} />
        <Text style={styles.pauseText}>{paused ? 'Start again' : 'Pause'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10 },
  ring: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  // Turned a quarter so the arc starts and ends at twelve o'clock.
  svg: { position: 'absolute', top: 0, left: 0, transform: [{ rotate: '-90deg' }] },
  centre: { alignItems: 'center', paddingHorizontal: 18 },
  face: { ...typography.screenTitle, color: colors.textPrimary, ...textShadow },
  caption: { ...typography.caption, color: colors.textMuted, textAlign: 'center', ...textShadow },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pauseText: { ...typography.body, color: colors.textSecondary },
});
