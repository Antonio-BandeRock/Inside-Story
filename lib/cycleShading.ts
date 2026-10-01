// Cycle shading on the Trends charts, E4 of the competitive build plan
// (2026-09-30, 1.0.57.26). The period days logged in Signals > Cycle, as
// runs of dates a chart draws as pale columns behind its line, so a dip in
// sleep or a rise in a symptom can be read beside a period without opening
// Trends > Cycle.
//
// Pure, so scripts/test_cycle_shading.js runs it without a phone. Only
// what was logged is shaded: nothing is predicted, and the next period
// from the average (Signals > Cycle) is never drawn here. Spotting on its
// own is not shaded, the same as it starts no period in lib/cycle.ts.
import { periodsFrom, type CycleDay } from './cycle';

export type ShadedRun = { start: string; end: string };

export type CycleShading = { runs: ShadedRun[]; caption: string };

export const CYCLE_SHADING_SWITCH_LABEL = 'Shade period days';

export const CYCLE_SHADING_SWITCH_HELP =
  'Draws the period days you logged in Signals > Cycle as pale columns behind each chart on Trends.';

export const CYCLE_SHADING_CAPTION =
  'Shaded columns are period days you logged. They sit behind the line to be read side by side and say nothing about what changed what.';

// Every logged period as one run, oldest first. A period's run is the
// days from its start to its end as periodsFrom joins them, so a day
// missed in the middle of one is shaded with the days around it.
export function periodRuns(days: CycleDay[]): ShadedRun[] {
  return periodsFrom(days).map((period) => ({ start: period.start, end: period.end }));
}

// The runs that reach into start..end, each cut to it. A chart passes the
// first and last dates it draws.
export function runsWithin(runs: ShadedRun[], start: string, end: string): ShadedRun[] {
  const out: ShadedRun[] = [];
  for (const run of runs) {
    if (run.end < start || run.start > end) continue;
    out.push({ start: run.start < start ? start : run.start, end: run.end > end ? end : run.end });
  }
  return out;
}

// What the Trends screen hands every chart: null when shading is off or
// nothing is logged, so a chart with no shading draws exactly as before.
export function cycleShadingFor(enabled: boolean, days: CycleDay[]): CycleShading | null {
  if (!enabled) return null;
  const runs = periodRuns(days);
  return runs.length > 0 ? { runs, caption: CYCLE_SHADING_CAPTION } : null;
}
