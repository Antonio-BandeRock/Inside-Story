// The year in squares as a band, F15 (2026-10-01): loads a year of one
// lens's daily figures (lib/calendarHeatDb.ts) and draws each strip
// (components/CalendarHeatStrip.tsx). On Trends it is a fold like every
// other band there; on Signals, whose lenses are not built of folds, it
// is a plain box in the same colour. Reloads whenever the screen comes
// back into view, so a flare logged a minute ago is already a square.
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { useBandFolds } from '../hooks/useBandFolds';
import { HEAT_SHADE_NOTE, type YearSquareSet } from '../lib/calendarHeat';
import { loadYearStrips, type YearStrip } from '../lib/calendarHeatDb';
import { CalendarHeatStrip } from './CalendarHeatStrip';
import { useTabBandStyles, TabBand } from './TabBand';

export const YEAR_IN_SQUARES_TITLE = 'The Year in Squares';

type Props = {
  set: YearSquareSet;
  color: string;
  folds?: ReturnType<typeof useBandFolds>;
  idPrefix?: string;
  // Changes when the lens around it saves something, so the squares
  // follow without leaving the screen.
  reloadKey?: number;
};

export function YearInSquaresBand({ set, color, folds, idPrefix = 'year', reloadKey = 0 }: Props) {
  const [strips, setStrips] = useState<YearStrip[] | null>(null);
  const band = useTabBandStyles(color);
  const load = useCallback(() => {
    let live = true;
    loadYearStrips(set)
      .then((loaded) => {
        if (live) setStrips(loaded);
      })
      .catch(() => {
        if (live) setStrips([]);
      });
    return () => {
      live = false;
    };
  }, [set]);
  useFocusEffect(load);
  useEffect(() => {
    if (reloadKey === 0) return;
    return load();
  }, [reloadKey, load]);

  // Trackers with none made yet have nothing to draw; every other set
  // always has its strip, drawn as outlines when nothing is recorded.
  if (strips !== null && strips.length === 0) return null;

  const body = (
    <>
      {strips === null ? (
        <Text style={styles.caption}>Reading the year.</Text>
      ) : (
        strips.map((strip) => <CalendarHeatStrip key={strip.spec.key} heat={strip.heat} spec={strip.spec} color={color} />)
      )}
      <Text style={[styles.caption, styles.note]}>{HEAT_SHADE_NOTE}</Text>
    </>
  );

  if (folds) {
    return (
      <TabBand folds={folds} color={color} id={`${idPrefix}:yearInSquares`} title={YEAR_IN_SQUARES_TITLE} icon="grid-outline">
        {body}
      </TabBand>
    );
  }
  return (
    <View style={band.box}>
      <Text style={band.headingText}>{YEAR_IN_SQUARES_TITLE}</Text>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
  note: { marginTop: 10 },
});
