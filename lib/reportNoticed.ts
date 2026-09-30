// "What I have noticed" in a report (K6, 2026-09-29). What Pattern Finder
// turned up on Trends, and the leave-it-out-then-bring-it-back experiments
// on Signals, set down for a doctor or a nutritionist to read.
//
// Every line is a sentence the person already sees on screen, from
// lib/patternBasis.ts, lib/patternContext.ts and lib/foodExperiment.ts, so
// a clinician reads the same words and the same denominators, and each
// candidate is labelled a hypothesis from one person's records. Nothing
// here says a food causes anything, and the count a candidate is measured
// against stands beside it every time.
//
// Pure: lib/reportGenerator.ts reads the records and hands them over, and
// scripts/test_report_noticed.js checks this without a phone.

import { basisSentence, comparisonSentence, delaySentence, thresholdSentence } from './patternBasis';
import { contextCaveat } from './patternContext';
import { EXPERIMENT_LIMIT, removalEndsOn } from './foodExperiment';
import type { PatternFinderResult } from './patternFinder';
import type { ReportListSection } from './reportGenerator';

/** The window the report counts in, the same one Trends opens on. */
export const NOTICED_WINDOW_HOURS = 24;

const WORDS = { one: 'flare or reaction', many: 'flares and reactions', short: 'flare', shortMany: 'flares' };

export const NOTICED_HEADING = 'What I have noticed';
export const EXPERIMENTS_HEADING = 'Food experiments';

export const NOTICED_NOTE =
  'Possible patterns the app counted in one person’s records, each a hypothesis to test and never a finding. A food eaten before several flares can still have nothing to do with them.';

type NoticedInput = Pick<
  PatternFinderResult,
  'totalSymptomInstances' | 'basis' | 'context' | 'foodCandidates' | 'dimensionCandidates' | 'categoryCandidates'
>;

function tail(candidate: { comparison: PatternFinderResult['foodCandidates'][number]['comparison']; delay?: { medianHours: number; count: number } | null }, windowHours: number): string {
  const main = comparisonSentence(candidate.comparison, windowHours);
  return candidate.delay ? `${main} ${delaySentence(candidate.delay, WORDS)}` : main;
}

export function noticedSection(result: NoticedInput | null): ReportListSection {
  const base = { kind: 'list' as const, heading: NOTICED_HEADING };
  if (!result) return { ...base, rows: [], empty: 'Could not be read for this report.' };
  if (result.totalSymptomInstances === 0) {
    return { ...base, rows: [], empty: 'No flares or reactions were logged in this range, so there is nothing to count against.' };
  }
  const hours = result.basis.windowHours;
  const rows: string[] = [
    ...result.foodCandidates.map((c) => `Hypothesis: ${c.foodName}. ${tail(c, hours)}`),
    ...result.dimensionCandidates.map(
      (c) => `Hypothesis: foods rated ${c.tier} for ${c.subCriterion}, relevant to ${c.conditionName}. ${tail(c, hours)}`,
    ),
    ...result.categoryCandidates.map((c) => `Hypothesis: foods in ${c.category}. ${tail(c, hours)}`),
  ];
  const counted = `${basisSentence(result.basis, WORDS)} ${thresholdSentence()}`;
  if (rows.length === 0) {
    return {
      ...base,
      note: NOTICED_NOTE,
      rows: [],
      empty: `${counted} Nothing was eaten before 2 or more of them in the ${hours} hours before.`,
    };
  }
  if (result.context.length > 0) {
    rows.push(...result.context.map((line) => `Around the same flares: ${line}`));
    rows.push(contextCaveat(WORDS));
  }
  return { ...base, note: `${NOTICED_NOTE} ${counted}`, rows, empty: '' };
}

export type ExperimentForReport = {
  foodName: string;
  status: string;
  removalStartedOn: string;
  removalDays: number;
  /** 'YYYY-MM-DD' the food came back, or null while it has not. */
  returnedOn: string | null;
  observationDays: number;
  /** From experimentResultLines; the one-run limit is said once in the note. */
  lines: string[];
};

/** An experiment whose before, without or back days touch the range. */
export function experimentInRange(experiment: ExperimentForReport, rangeStart: string, rangeEnd: string): boolean {
  const [y, m, d] = experiment.removalStartedOn.split('-').map(Number);
  const before = new Date(y, m - 1, d - experiment.removalDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  const firstDay = `${before.getFullYear()}-${pad(before.getMonth() + 1)}-${pad(before.getDate())}`;
  if (firstDay > rangeEnd) return false;
  if (!experiment.returnedOn) return true;
  const [ry, rm, rd] = experiment.returnedOn.split('-').map(Number);
  const back = new Date(ry, rm - 1, rd + experiment.observationDays);
  const lastDay = `${back.getFullYear()}-${pad(back.getMonth() + 1)}-${pad(back.getDate())}`;
  return lastDay >= rangeStart;
}

function experimentStage(experiment: ExperimentForReport, today: string): string {
  if (!experiment.returnedOn) {
    return today < removalEndsOn(experiment.removalStartedOn, experiment.removalDays)
      ? 'still being left out'
      : 'left out, not brought back yet';
  }
  return experiment.status === 'trialing' ? 'brought back, still being watched' : 'finished';
}

export function experimentsSection(
  experiments: ExperimentForReport[] | null,
  rangeStart: string,
  rangeEnd: string,
): ReportListSection {
  const base = { kind: 'list' as const, heading: EXPERIMENTS_HEADING };
  if (!experiments) return { ...base, rows: [], empty: 'Could not be read for this report.' };
  const shown = experiments
    .filter((experiment) => experimentInRange(experiment, rangeStart, rangeEnd))
    .sort((a, b) => a.removalStartedOn.localeCompare(b.removalStartedOn));
  return {
    ...base,
    note: `Foods left out for a set number of days and then brought back, with the flares and reactions logged before, without and back. ${EXPERIMENT_LIMIT}`,
    rows: shown.map((experiment) => {
      const lines = experiment.lines.filter((line) => line !== EXPERIMENT_LIMIT);
      return `${experiment.foodName}, left out from ${experiment.removalStartedOn}, ${experimentStage(experiment, rangeEnd)}. ${lines.join(' ')}`.trim();
    }),
    empty: 'No food was left out and brought back as an experiment in this range.',
  };
}
