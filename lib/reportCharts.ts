// Charts in the PDF (K3, 1.0.53.11). A report section can carry one small
// chart of the same figures its rows summarise, drawn here as inline SVG
// so expo-print lays it out with no script, no web font and no image file.
//
// Three rules hold, the same ones Trends keeps:
// 1. A day with nothing recorded draws nothing. There is one slot per day
//    of the range, so a gap reads as a gap, never as a zero, and the line
//    under each chart says how many days were recorded.
// 2. No line joins two points. A line across a gap invents the days in
//    between, so a chart is bars (a count or a total a day) or dots (a
//    reading, like weight, where zero is not a floor).
// 3. The chart states figures and never judges them: no target band, no
//    red and green, no "too low".
//
// Pure, with no imports, so scripts/test_report_charts.js checks it
// without a phone.

export type ReportChartPoint = { date: string; value: number };

export type ReportChart = {
  /** Bars start at zero; dots are scaled to the readings. */
  style: 'bars' | 'dots';
  /** YYYY-MM-DD, both ends included. */
  startDate: string;
  endDate: string;
  points: ReportChartPoint[];
  /** Said beside the scale and in the caption: "steps", "hours", "kg". */
  unit: string;
  /** Decimal places for the scale and the caption. */
  decimals: number;
  /** What one recorded slot is: "day", "night", "reading". */
  slotNoun: string;
};

const WIDTH = 640;
const HEIGHT = 180;
const LEFT = 52;
const RIGHT = 10;
const TOP = 24;
const BOTTOM = 24;
const INK = '#244147';
const MUTED = '#5c6a70';
const GRID = '#d5dcdf';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDay(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

function dayLabel(dayNumber: number): string {
  const date = new Date(dayNumber * 86_400_000);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/** How many days the range covers, both ends included. */
export function chartDayCount(chart: Pick<ReportChart, 'startDate' | 'endDate'>): number {
  return Math.max(1, parseDay(chart.endDate) - parseDay(chart.startDate) + 1);
}

/** The points inside the range, one per date (the last given wins), in order. */
export function chartPointsInRange(chart: ReportChart): ReportChartPoint[] {
  const start = parseDay(chart.startDate);
  const end = parseDay(chart.endDate);
  const byDate = new Map<string, number>();
  for (const point of chart.points) {
    if (!Number.isFinite(point.value)) continue;
    const day = parseDay(point.date.slice(0, 10));
    if (Number.isNaN(day) || day < start || day > end) continue;
    byDate.set(point.date.slice(0, 10), point.value);
  }
  return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, value]) => ({ date, value }));
}

/** A round number at or above value: 1, 2, 2.5 or 5 times a power of ten. */
export function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * power >= value) return step * power;
  }
  return 10 * power;
}

function formatValue(value: number, decimals: number): string {
  const rounded = Number(value.toFixed(decimals));
  return rounded.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** The scale: the bottom and top of the drawing, and the ticks between. */
export function chartScale(chart: ReportChart, points: ReportChartPoint[]): { low: number; high: number; ticks: number[] } {
  const values = points.map((point) => point.value);
  if (chart.style === 'bars' || values.length === 0) {
    const high = niceCeiling(Math.max(0, ...values));
    return { low: 0, high, ticks: [0, high / 2, high] };
  }
  let low = Math.min(...values);
  let high = Math.max(...values);
  if (high - low < 10 ** -chart.decimals) {
    low -= 1;
    high += 1;
  }
  const pad = (high - low) * 0.15;
  low -= pad;
  high += pad;
  return { low, high, ticks: [low, (low + high) / 2, high] };
}

/** The line under the chart, which is also all the plain-text view says. */
export function chartCaption(chart: ReportChart): string {
  const points = chartPointsInRange(chart);
  const total = chartDayCount(chart);
  const days = `${total} ${total === 1 ? 'day' : 'days'}`;
  if (points.length === 0) return `Nothing recorded on any of the ${days}.`;
  const values = points.map((point) => point.value);
  const low = formatValue(Math.min(...values), chart.decimals);
  const high = formatValue(Math.max(...values), chart.decimals);
  const noun = points.length === 1 ? chart.slotNoun : `${chart.slotNoun}s`;
  const span = low === high ? `${low} ${chart.unit}` : `from ${low} to ${high} ${chart.unit}`;
  const blank = total - points.length;
  const gaps = blank > 0 ? ` A blank slot is a day with nothing recorded, not a zero.` : '';
  return `${points.length} ${noun} recorded across ${days}, ${span}.${gaps}`;
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The chart as an inline <svg>, or an empty string when nothing is recorded. */
export function renderChartSvg(chart: ReportChart): string {
  const points = chartPointsInRange(chart);
  if (points.length === 0) return '';
  const days = chartDayCount(chart);
  const start = parseDay(chart.startDate);
  const plotW = WIDTH - LEFT - RIGHT;
  const plotH = HEIGHT - TOP - BOTTOM;
  const slot = plotW / days;
  const { low, high, ticks } = chartScale(chart, points);
  const y = (value: number) => TOP + plotH - ((value - low) / (high - low)) * plotH;
  const xCenter = (date: string) => LEFT + (parseDay(date) - start + 0.5) * slot;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" role="img" font-family="-apple-system, Helvetica Neue, Roboto, Arial, sans-serif">`,
  );
  for (const tick of ticks) {
    const ty = y(tick).toFixed(1);
    parts.push(`<line x1="${LEFT}" x2="${WIDTH - RIGHT}" y1="${ty}" y2="${ty}" stroke="${GRID}" stroke-width="1"/>`);
    parts.push(
      `<text x="${LEFT - 6}" y="${ty}" dy="3" text-anchor="end" font-size="10" fill="${MUTED}">${escapeXml(formatValue(tick, chart.decimals))}</text>`,
    );
  }
  parts.push(`<text x="${LEFT - 6}" y="10" text-anchor="end" font-size="9" fill="${MUTED}">${escapeXml(chart.unit)}</text>`);

  if (chart.style === 'bars') {
    const barW = Math.max(1, slot * 0.7);
    for (const point of points) {
      const top = y(Math.max(0, point.value));
      const height = Math.max(0.5, TOP + plotH - top);
      parts.push(
        `<rect x="${(xCenter(point.date) - barW / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${barW.toFixed(1)}" height="${height.toFixed(1)}" fill="${INK}"/>`,
      );
    }
  } else {
    const radius = Math.min(4, Math.max(2, slot * 0.35));
    for (const point of points) {
      parts.push(
        `<circle cx="${xCenter(point.date).toFixed(1)}" cy="${y(point.value).toFixed(1)}" r="${radius.toFixed(1)}" fill="${INK}"/>`,
      );
    }
  }

  // The baseline and three dates: the first day, the middle and the last.
  parts.push(`<line x1="${LEFT}" x2="${WIDTH - RIGHT}" y1="${TOP + plotH}" y2="${TOP + plotH}" stroke="${MUTED}" stroke-width="1"/>`);
  const labelDays = days === 1 ? [0] : days === 2 ? [0, 1] : [0, Math.floor((days - 1) / 2), days - 1];
  labelDays.forEach((offset, index) => {
    const anchor = index === 0 ? 'start' : index === labelDays.length - 1 ? 'end' : 'middle';
    const x = index === 0 ? LEFT : index === labelDays.length - 1 ? WIDTH - RIGHT : LEFT + (offset + 0.5) * slot;
    parts.push(
      `<text x="${x.toFixed(1)}" y="${HEIGHT - 6}" text-anchor="${anchor}" font-size="10" fill="${MUTED}">${escapeXml(dayLabel(start + offset))}</text>`,
    );
  });
  parts.push('</svg>');
  return parts.join('');
}
