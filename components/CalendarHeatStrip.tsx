// A year in squares, F15 (2026-10-01): one square per day, a week to a
// column with Monday at the top, coloured by that day's figure in the
// colour of the tab it sits on. Built by lib/calendarHeat.ts.
//
// The gap rule is drawn here: a day with nothing recorded is an empty
// outline in the border colour, never the lightest fill, and a day
// recorded with a figure of nothing is the faintest fill with no outline.
// Every word sits on the band's surface, never on the tab photo.
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { describeCell, type CalendarHeat, type HeatLevel, type YearStripSpec } from '../lib/calendarHeat';

const DAY_LABEL_WIDTH = 26;
const MONTH_ROW_HEIGHT = 14;
const MIN_CELL = 10;
const MAX_CELL = 16;
const GAP = 2;

// How strongly each level shows the tab colour.
export const LEVEL_OPACITY: Record<HeatLevel, number> = { 0: 0.16, 1: 0.36, 2: 0.56, 3: 0.78, 4: 1 };

function Square({ size, level, color }: { size: number; level: HeatLevel | null; color: string }) {
  return (
    <View
      style={[
        styles.legendSquare,
        { width: size, height: size },
        level === null
          ? { borderWidth: 1, borderColor: colors.border }
          : { backgroundColor: color, opacity: LEVEL_OPACITY[level] },
      ]}
    />
  );
}

export function CalendarHeatStrip({ heat, spec, color }: { heat: CalendarHeat; spec: YearStripSpec; color: string }) {
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const fitted = width > 0 ? Math.floor((width - DAY_LABEL_WIDTH) / heat.columns) : MIN_CELL;
  const step = Math.min(MAX_CELL, Math.max(MIN_CELL, fitted));
  const cell = step - GAP;
  const drawWidth = DAY_LABEL_WIDTH + heat.columns * step;
  const drawHeight = MONTH_ROW_HEIGHT + 7 * step;
  const pickedCell = picked ? heat.cells.find((c) => c.day === picked) ?? null : null;

  const grid = (
    <Svg width={drawWidth} height={drawHeight} accessibilityLabel={heat.accessibilityLabel}>
      {heat.months.map((month) => (
        <SvgText
          key={`${month.label}-${month.column}`}
          x={DAY_LABEL_WIDTH + month.column * step}
          y={MONTH_ROW_HEIGHT - 4}
          fontSize={10}
          fill={colors.textMuted}
        >
          {month.label}
        </SvgText>
      ))}
      {['Mon', 'Wed', 'Fri'].map((label, index) => (
        <SvgText key={label} x={0} y={MONTH_ROW_HEIGHT + (index * 2) * step + cell - 1} fontSize={9} fill={colors.textMuted}>
          {label}
        </SvgText>
      ))}
      {heat.cells.map((c) => {
        const x = DAY_LABEL_WIDTH + c.column * step;
        const y = MONTH_ROW_HEIGHT + c.row * step;
        const isPicked = c.day === picked;
        return c.level === null ? (
          <Rect
            key={c.day}
            x={x + 0.5}
            y={y + 0.5}
            width={cell - 1}
            height={cell - 1}
            rx={2}
            fill="none"
            stroke={isPicked ? colors.textPrimary : colors.border}
            strokeWidth={isPicked ? 1.5 : 1}
            onPress={() => setPicked(c.day)}
          />
        ) : (
          <Rect
            key={c.day}
            x={x}
            y={y}
            width={cell}
            height={cell}
            rx={2}
            fill={color}
            fillOpacity={LEVEL_OPACITY[c.level]}
            stroke={isPicked ? colors.textPrimary : 'none'}
            strokeWidth={isPicked ? 1.5 : 0}
            onPress={() => setPicked(c.day)}
          />
        );
      })}
    </Svg>
  );

  return (
    <View style={styles.strip} onLayout={onLayout}>
      <Text style={styles.heading}>{heat.heading}</Text>
      <Text style={styles.caption}>{heat.summary}</Text>
      {width > 0 && drawWidth > width ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          style={styles.grid}
        >
          {grid}
        </ScrollView>
      ) : (
        <View style={styles.grid}>{grid}</View>
      )}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        {([0, 1, 2, 3, 4] as HeatLevel[]).map((level) => (
          <Square key={level} size={10} level={level} color={color} />
        ))}
        <Text style={styles.legendText}>More</Text>
        <Square size={10} level={null} color={color} />
        <Text style={styles.legendText}>Nothing recorded</Text>
      </View>
      {pickedCell ? <Text style={styles.caption}>{describeCell(spec, pickedCell)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { marginTop: 8 },
  heading: { ...typography.body, color: colors.textPrimary, fontWeight: '400', ...textShadow },
  caption: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
  grid: { marginTop: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 6 },
  legendSquare: { borderRadius: 2 },
  legendText: { ...typography.caption, color: colors.textMuted, marginHorizontal: 2, ...textShadow },
});
