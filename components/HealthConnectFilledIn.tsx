// One line on the Home check-in saying what Health Connect has already
// filled in for today (B9, Phase 2): last night's sleep, today's steps and
// any workout, so somebody checking in is not asked to remember what the
// watch already recorded. Nothing shows when Health Connect has given
// nothing for today, which includes every desktop and every phone that has
// not connected it.

import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { describeFilledIn } from '../lib/dayTimeline';
import { loadFilledInToday } from '../lib/dayTimelineDb';

export function HealthConnectFilledIn() {
  const [line, setLine] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      loadFilledInToday()
        .then((filled) => {
          if (live) setLine(describeFilledIn(filled));
        })
        .catch(() => undefined);
      return () => {
        live = false;
      };
    }, []),
  );

  if (!line) return null;
  return <Text style={styles.line}>{line}</Text>;
}

const styles = StyleSheet.create({
  line: { ...typography.caption, color: colors.textMuted, ...textShadow, marginTop: 6 },
});
