// Two series on one date axis, F16 (2026-10-01), built by
// lib/compareSeries.ts. The first is read off the left edge as circles, the
// second off the right edge as squares, each in a different colour, so the two
// can be told apart without colour too. Dots only: no line is drawn between
// two readings, since a line would draw readings onto the days between them
// that nobody recorded. Tap a dot to read that day for both. Under the
// date axis, each tag picked (F18, lib/tagMarks.ts) is a row of marks, one
// for each day it was logged.
import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { dayIndex, describeDay, formatAxisValue, sayShortDate, shiftDate, type Comparison } from '../lib/compareSeries';
import { taggedOn, type TagMarkRow } from '../lib/tagMarks';

const HEIGHT = 190;
const AXIS_WIDTH = 38;
const TOP = 8;
const BOTTOM = 20;
const DOT = 3.5;
const HIT = 11;
// Each tag row: its name on one line, its marks on the next.
const MARK_ROW = 24;
const MARK_HEIGHT = 8;

export const COMPARE_COLOR_B = colors.accent;

export function CompareTwoChart({
  comparison,
  colorA,
  marks = [],
}: {
  comparison: Comparison;
  colorA: string;
  marks?: readonly TagMarkRow[];
}) {
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const colorB = COMPARE_COLOR_B;

  const plotLeft = AXIS_WIDTH;
  const plotWidth = Math.max(1, width - AXIS_WIDTH * 2);
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const span = Math.max(1, comparison.days - 1);
  const xOf = (date: string) => plotLeft + (dayIndex(date, comparison.start) / span) * plotWidth;
  const yOf = (value: number, range: { yMin: number; yMax: number }) => {
    const height = range.yMax - range.yMin || 1;
    return TOP + plotHeight - ((value - range.yMin) / height) * plotHeight;
  };
  const marksTop = HEIGHT + 4;
  const svgHeight = HEIGHT + (marks.length > 0 ? marks.length * MARK_ROW + 4 : 0);
  const marksLabel =
    marks.length > 0 ? ` Marked under the dates: ${marks.map((row) => `${row.label} on ${row.dates.length} of the days`).join(', ')}.` : '';
  const tagged = picked ? taggedOn(marks, picked) : null;
  const hitDates = [
    ...new Set([...comparison.a.points.map((p) => p.date), ...comparison.b.points.map((p) => p.date), ...marks.flatMap((row) => row.dates)]),
  ];
  const dateTicks = [comparison.start, shiftDate(comparison.start, Math.round(span / 2)), comparison.end];

  return (
    <View onLayout={onLayout}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: colorA }]} />
          <Text style={styles.legendText}>{comparison.a.choice.label}, left scale</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: colorB }]} />
          <Text style={styles.legendText}>{comparison.b.choice.label}, right scale</Text>
        </View>
      </View>
      {width > 0 ? (
        <Svg width={width} height={svgHeight} accessibilityLabel={comparison.accessibilityLabel + marksLabel}>
          <Line x1={plotLeft} y1={TOP} x2={plotLeft} y2={TOP + plotHeight} stroke={colorA} strokeWidth={1} strokeOpacity={0.6} />
          <Line
            x1={plotLeft + plotWidth}
            y1={TOP}
            x2={plotLeft + plotWidth}
            y2={TOP + plotHeight}
            stroke={colorB}
            strokeWidth={1}
            strokeOpacity={0.6}
          />
          <Line x1={plotLeft} y1={TOP + plotHeight} x2={plotLeft + plotWidth} y2={TOP + plotHeight} stroke={colors.border} strokeWidth={1} />
          {[comparison.a.range.yMax, comparison.a.range.yMin].map((value, i) => (
            <SvgText key={`a${i}`} x={plotLeft - 4} y={i === 0 ? TOP + 9 : TOP + plotHeight} fontSize={10} fill={colorA} textAnchor="end">
              {formatAxisValue(comparison.a.choice, value)}
            </SvgText>
          ))}
          {[comparison.b.range.yMax, comparison.b.range.yMin].map((value, i) => (
            <SvgText
              key={`b${i}`}
              x={plotLeft + plotWidth + 4}
              y={i === 0 ? TOP + 9 : TOP + plotHeight}
              fontSize={10}
              fill={colorB}
              textAnchor="start"
            >
              {formatAxisValue(comparison.b.choice, value)}
            </SvgText>
          ))}
          {dateTicks.map((date, i) => (
            <SvgText
              key={date + i}
              x={xOf(date)}
              y={HEIGHT - 5}
              fontSize={10}
              fill={colors.textMuted}
              textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
            >
              {sayShortDate(date)}
            </SvgText>
          ))}
          {picked ? (
            <Line x1={xOf(picked)} y1={TOP} x2={xOf(picked)} y2={TOP + plotHeight} stroke={colors.textMuted} strokeWidth={1} strokeDasharray="3,3" />
          ) : null}
          {comparison.a.points.map((point) => (
            <Circle
              key={`a${point.date}`}
              cx={xOf(point.date)}
              cy={yOf(point.value, comparison.a.range)}
              r={point.date === picked ? DOT + 1.5 : DOT}
              fill={colorA}
            />
          ))}
          {comparison.b.points.map((point) => {
            const size = (point.date === picked ? DOT + 1.5 : DOT) * 2;
            return (
              <Rect
                key={`b${point.date}`}
                x={xOf(point.date) - size / 2}
                y={yOf(point.value, comparison.b.range) - size / 2}
                width={size}
                height={size}
                fill={colorB}
              />
            );
          })}
          {marks.map((row, i) => {
            const top = marksTop + i * MARK_ROW;
            return (
              <G key={`mark${row.code}`}>
                <SvgText x={plotLeft} y={top + 9} fontSize={10} fill={colors.textPrimary} textAnchor="start">
                  {row.label}
                </SvgText>
                <Line
                  x1={plotLeft}
                  y1={top + 12 + MARK_HEIGHT}
                  x2={plotLeft + plotWidth}
                  y2={top + 12 + MARK_HEIGHT}
                  stroke={colors.border}
                  strokeWidth={1}
                />
                {row.dates.map((date) => (
                  <Rect
                    key={date}
                    x={xOf(date) - 1.5}
                    y={top + 12}
                    width={3}
                    height={MARK_HEIGHT}
                    fill={date === picked ? colorA : colors.textMuted}
                  />
                ))}
              </G>
            );
          })}
          {hitDates.map((date) => (
            <Rect
              key={`hit${date}`}
              x={xOf(date) - HIT / 2}
              y={TOP}
              width={HIT}
              height={svgHeight - TOP}
              fill="transparent"
              onPress={() => setPicked(date)}
            />
          ))}
        </Svg>
      ) : null}
      <Text style={styles.caption}>
        {picked ? [describeDay(comparison, picked), tagged].filter(Boolean).join(' ') : 'Tap a dot to read that day for both.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { gap: 4, marginBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendCircle: { width: 10, height: 10, borderRadius: 5 },
  legendSquare: { width: 10, height: 10 },
  legendText: { ...typography.caption, color: colors.textPrimary, flexShrink: 1, ...textShadow },
  caption: { ...typography.caption, color: colors.textMuted, marginTop: 6, ...textShadow },
});
