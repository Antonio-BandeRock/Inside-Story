// The reads behind the Home card in lib/outsideUsual.ts (F12): the same
// sleep, resting heart rate and heart rate variability the Morning Check-In
// reads, plus the steps Trends reads, every day whatever the source.

import { getStepCountTrend } from './db';
import { getMorningInputs } from './morningCheckinDb';
import type { OutsideUsualInputs } from './outsideUsual';

// The same four months the morning readings reach back.
const STEP_DAYS = 120;

export async function getOutsideUsualInputs(now = new Date()): Promise<OutsideUsualInputs> {
  const [morning, stepRows] = await Promise.all([getMorningInputs(now), getStepCountTrend(STEP_DAYS)]);
  const steps = stepRows.filter((row) => row.date <= morning.today).map((row) => ({ date: row.date, value: row.stepCount }));
  return { ...morning, steps };
}
