// A real per-condition dimension chart -- 2026-08-25, direct correction to
// the first Nutrition & Safety Report attempt: "for Hashimoto's it should
// show how it does not cause problems or does cause them for the D1-D6."
// Checked directly against the live database before building this: "D1-D6"
// is genuinely Hashimoto's own real 6-dimension framework, not a generic
// shape every condition shares -- every other tracked condition has its
// own, differently-named real dimension set (as few as 1, as many as 5),
// never called "D1-D6" (see lib/recipeDepth.ts's own DimensionSeverity
// comment). This component is built generically around whichever real
// dimensions a given condition actually owns, not hardcoded to 6 axes.
//
// A radar/spider chart genuinely needs at least 3 points to read as a real
// shape rather than a line -- conditions with fewer real dimensions (Gout,
// PCOS, Type 1/2 Diabetes, several more each own exactly 1) fall back to a
// plain colored row per dimension instead of a degenerate 1- or 2-point
// "polygon."

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { TierSeverity } from '../lib/sixDimensionsReference';

export type DimensionChartDatum = { dimension: string; severity: TierSeverity };

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 44; // real room left for axis labels outside the plotted rings
const RING_FRACTIONS = [0.33, 0.66, 1];
// How far out from center each severity plots -- red closest to center
// (the least favorable point), green closest to the outer ring. `unknown`
// (not assessed) sits at the same radius as yellow, purely for a readable
// shape -- its own distinct gray color, not yellow's, is what actually
// tells "no data" apart from "a real caution."
const SEVERITY_RADIUS_FRACTION: Record<TierSeverity, number> = { red: 0.22, yellow: 0.55, unknown: 0.55, green: 0.92 };

function severityColor(severity: TierSeverity): string {
  if (severity === 'red') return colors.danger;
  if (severity === 'yellow') return colors.statusYellow;
  if (severity === 'green') return colors.statusGood;
  return colors.textMuted;
}

function pointAt(angle: number, fraction: number): { x: number; y: number } {
  return { x: CENTER + RADIUS * fraction * Math.cos(angle), y: CENTER + RADIUS * fraction * Math.sin(angle) };
}

// Hashimoto's own real dimension labels start "D1 ...", "D2 ..." and so on
// -- used as the axis's own short label directly when present. Every other
// condition's own real dimension labels are full descriptive phrases with
// no such prefix, so those fall back to a plain position number, with the
// full label spelled out in the legend below the chart instead of crowded
// onto the chart itself.
function shortAxisLabel(dimension: string, index: number): string {
  const match = dimension.match(/^D\d+/);
  return match ? match[0] : String(index + 1);
}

function RadarChart({ data, color }: { data: DimensionChartDatum[]; color: string }) {
  const n = data.length;
  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const dataPoints = data.map((datum, i) => pointAt(angleFor(i), SEVERITY_RADIUS_FRACTION[datum.severity]));
  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.radarWrap}>
      <Svg width={SIZE} height={SIZE}>
        {RING_FRACTIONS.map((fraction) => {
          const ringPoints = Array.from({ length: n }, (_, i) => pointAt(angleFor(i), fraction));
          return (
            <Polygon
              key={fraction}
              points={ringPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={colors.border}
              strokeWidth={1}
            />
          );
        })}
        {Array.from({ length: n }, (_, i) => {
          const outer = pointAt(angleFor(i), 1);
          return <Line key={i} x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} stroke={colors.border} strokeWidth={1} />;
        })}
        <Polygon points={polygonPoints} fill={`${color}33`} stroke={color} strokeWidth={2} />
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={5} fill={severityColor(data[i].severity)} stroke={colors.surface} strokeWidth={1.5} />
        ))}
        {data.map((datum, i) => {
          const labelPoint = pointAt(angleFor(i), 1.18);
          return (
            <SvgText
              key={datum.dimension}
              x={labelPoint.x}
              y={labelPoint.y}
              fontSize={12}
              fontWeight="700"
              fill={colors.textPrimary}
              textAnchor="middle"
            >
              {shortAxisLabel(datum.dimension, i)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

function DimensionRows({ data }: { data: DimensionChartDatum[] }) {
  return (
    <View style={styles.rowsWrap}>
      {data.map((datum) => (
        <View key={datum.dimension} style={styles.row}>
          <View style={[styles.rowDot, { backgroundColor: severityColor(datum.severity) }]} />
          <Text style={styles.rowLabel}>{datum.dimension}</Text>
        </View>
      ))}
    </View>
  );
}

export function DimensionChart({ conditionName, data, color }: { conditionName?: string; data: DimensionChartDatum[]; color: string }) {
  if (data.length === 0) return null;
  const useRadar = data.length >= 3;
  return (
    <View style={styles.wrap}>
      {conditionName ? <Text style={[styles.title, { color }]}>{conditionName}</Text> : null}
      {useRadar ? <RadarChart data={data} color={color} /> : <DimensionRows data={data} />}
      {/* The legend exists to spell out full dimension names that the
          radar can only fit as "D1"/"D2"/"1"/"2" on its own axis labels.
          2026-08-29, direct report from someone tracking Prostate Health,
          which owns two dimensions: "I see the two cancer risks each
          twice. There are two versions, one in white font which should
          stay, and one in smaller blue font which should be removed."
          Exactly right, and it follows from the legend's own purpose:
          below three dimensions there is no radar, DimensionRows above
          already prints each full name in plain white text, and the
          legend was then printing the identical string again in muted
          caption grey with an empty abbreviation prefix. It only earns
          its place alongside a radar. */}
      {useRadar ? (
        <View style={styles.legend}>
          {data.map((datum, i) => (
            <View key={datum.dimension} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: severityColor(datum.severity) }]} />
              <Text style={styles.legendText}>
                {`${shortAxisLabel(datum.dimension, i)} — `}
                {datum.dimension}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  title: { ...typography.bodyEmphasis, marginBottom: 8, ...textShadow },
  radarWrap: { alignItems: 'center' },
  rowsWrap: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowDot: { width: 12, height: 12, borderRadius: 6 },
  rowLabel: { ...typography.body, color: colors.textPrimary, flexShrink: 1, ...textShadow },
  legend: { marginTop: 10, gap: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  legendText: { ...typography.caption, color: colors.textMuted, flex: 1, ...textShadow },
});
