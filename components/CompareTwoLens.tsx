// Trends > Compare Two, F16 (2026-10-01): pick any two things the app
// records and see them on one date axis, each on a separate scale
// (lib/compareSeries.ts, lib/compareSeriesDb.ts, CompareTwoChart). Opened
// from Insights > Nutrients with that nutrient already in the first picker.
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { useBandFolds } from '../hooks/useBandFolds';
import {
  buildComparison,
  choiceOptions,
  COMPARE_RANGES,
  DEFAULT_COMPARE_RANGE,
  MOVING_TOGETHER_LINE,
  shiftDate,
  type CompareRange,
  type ComparePoint,
  type SeriesChoice,
} from '../lib/compareSeries';
import { loadCompareChoices, loadSeriesPoints } from '../lib/compareSeriesDb';
import { CompareTwoChart } from './CompareTwoChart';
import { PopoverSelect } from './PopoverSelect';
import { makeTabBandStyles, TabBand } from './TabBand';

type Props = {
  folds: ReturnType<typeof useBandFolds>;
  color: string;
  weightUnit: 'kg' | 'lb';
  // A series key to start the first picker on, such as "nutrient:iron".
  initialA?: string;
};

function todayString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function CompareTwoLens({ folds, color, weightUnit, initialA }: Props) {
  const band = makeTabBandStyles(color);
  const [choices, setChoices] = useState<SeriesChoice[] | null>(null);
  const [keyA, setKeyA] = useState<string | null>(initialA ?? null);
  const [keyB, setKeyB] = useState<string>('severity');
  const [days, setDays] = useState<CompareRange>(DEFAULT_COMPARE_RANGE);
  const [points, setPoints] = useState<{ key: string; a: ComparePoint[]; b: ComparePoint[] } | null>(null);
  const [end] = useState(todayString);

  useEffect(() => {
    if (initialA) setKeyA(initialA);
  }, [initialA]);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      loadCompareChoices(weightUnit)
        .then((loaded) => {
          if (live) setChoices(loaded);
        })
        .catch(() => {
          if (live) setChoices([]);
        });
      return () => {
        live = false;
      };
    }, [weightUnit]),
  );

  const choiceA = choices?.find((c) => c.key === keyA) ?? choices?.[0] ?? null;
  const choiceB = choices?.find((c) => c.key === keyB) ?? null;
  const loadKey = choiceA && choiceB ? `${choiceA.key}|${choiceB.key}|${days}` : null;

  useEffect(() => {
    if (!choiceA || !choiceB || !loadKey) return;
    let live = true;
    const start = shiftDate(end, -(days - 1));
    Promise.all([loadSeriesPoints(choiceA, end, start, days), loadSeriesPoints(choiceB, end, start, days)])
      .then(([a, b]) => {
        if (live) setPoints({ key: loadKey, a, b });
      })
      .catch(() => {
        if (live) setPoints({ key: loadKey, a: [], b: [] });
      });
    return () => {
      live = false;
    };
    // choiceA and choiceB are found again from loadKey on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey, end]);

  const comparison = useMemo(() => {
    if (!choiceA || !choiceB || !points || points.key !== loadKey) return null;
    return buildComparison(choiceA, points.a, choiceB, points.b, end, days);
  }, [choiceA, choiceB, points, loadKey, end, days]);

  const options = useMemo(() => choiceOptions(choices ?? []), [choices]);

  if (choices === null) {
    return (
      <View style={band.boxMuted}>
        <Text style={styles.caption}>Reading what you record…</Text>
      </View>
    );
  }

  return (
    <>
      <View style={band.box}>
        <Text style={styles.label}>First, read off the left scale</Text>
        <PopoverSelect
          options={options}
          selected={choiceA?.key ?? null}
          onSelect={(value) => setKeyA(value)}
          tabColor={color}
          searchable
          placeholder="Pick something to compare"
        />
        <Text style={[styles.label, styles.spaced]}>Second, read off the right scale</Text>
        <PopoverSelect
          options={options}
          selected={choiceB?.key ?? null}
          onSelect={(value) => setKeyB(value)}
          tabColor={color}
          searchable
          placeholder="Pick something to compare"
        />
        <View style={styles.pillRow}>
          {COMPARE_RANGES.map((range) => {
            const active = range === days;
            return (
              <TouchableOpacity
                key={range}
                style={[styles.pill, active && { backgroundColor: color, borderColor: color }]}
                onPress={() => setDays(range)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{`Last ${range} days`}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TabBand folds={folds} color={color} id="trends:compare:chart" title="The Two Side by Side" icon="git-compare-outline">
        {!comparison ? (
          <Text style={styles.caption}>Reading both…</Text>
        ) : (
          <>
            <Text style={styles.caption}>{comparison.summary}</Text>
            {comparison.sameSeries || (comparison.daysA === 0 && comparison.daysB === 0) ? null : (
              <View style={styles.chart}>
                <CompareTwoChart comparison={comparison} colorA={color} />
              </View>
            )}
            <Text style={[styles.caption, styles.spaced]}>{MOVING_TOGETHER_LINE}</Text>
            <Text style={[styles.caption, styles.spaced]}>
              A day with no reading is left empty, and no line joins one reading to the next, so a gap stays a gap.
            </Text>
          </>
        )}
      </TabBand>
    </>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.caption, color: colors.textPrimary, marginBottom: 4, ...textShadow },
  caption: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
  spaced: { marginTop: 10 },
  chart: { marginTop: 10 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.surfaceMuted },
  pillText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  pillTextActive: { color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
});
