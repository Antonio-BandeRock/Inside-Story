import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

// A small, single-concept "micro-learning" card -- a striking icon and a
// one-sentence hook up front, a bite-sized tip on the back. Meant to be
// used several at a time in a row, so a big idea (what Hashimoto's is, why
// food timing matters) is broken into pieces small enough to actually get
// read, instead of one long paragraph nobody taps into.
export function FlipCard({
  icon,
  hook,
  backTitle,
  backBody,
  width = 220,
  height = 260,
}: {
  icon: ReactNode;
  hook: string;
  backTitle: string;
  backBody: string;
  width?: number;
  height?: number;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipped = useSharedValue(0);

  function toggle() {
    const next = !isFlipped;
    flipped.value = withTiming(next ? 1 : 0, { duration: 400 });
    setIsFlipped(next);
  }

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flipped.value, [0, 1], [0, 180])}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${interpolate(flipped.value, [0, 1], [180, 360])}deg` }],
  }));

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={{ width, height }}>
      <Animated.View style={[styles.face, frontStyle]}>
        {icon}
        <Text style={styles.hook}>{hook}</Text>
      </Animated.View>
      <Animated.View style={[styles.face, styles.backFace, backStyle]}>
        <Text style={styles.backTitle}>{backTitle}</Text>
        <View style={styles.backDivider} />
        <Text style={styles.backBody}>{backBody}</Text>
        <Text style={styles.backHint}>Tap to flip back</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backFace: { backgroundColor: colors.primaryTint, alignItems: 'stretch', justifyContent: 'flex-start' },
  hook: { ...typography.bodyEmphasis, color: colors.textPrimary, textAlign: 'center', marginTop: 10, lineHeight: 21 },
  backTitle: { ...typography.sectionTitle, color: colors.primary, textAlign: 'left' },
  backDivider: { height: 1, backgroundColor: colors.primaryMuted, opacity: 0.4, marginTop: 8, marginBottom: 10 },
  backBody: { ...typography.body, color: colors.textPrimary, textAlign: 'left', lineHeight: 21, flexShrink: 1 },
  backHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
