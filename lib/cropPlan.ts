// My Crops: the crops somebody intends to grow, the area each will go in,
// and the two reminders each one raises, 2026-10-01. Pure: no I/O, so
// scripts/test_crop_plan.js can check it on a PC. Reading and writing is
// lib/cropPlanDb.ts; the band is components/MyCropsBand.tsx.
//
// Direct report, 2026-10-01: "I have a notification about planting certain
// things right now, but I never asked it to notify me about that because I
// don't have any crops built into the app for me to follow. The app should
// be able to have the user choose the crops they intend to grow, and then
// give them the opportunity to create areas, indoors or outdoors, for where
// the crops will be planted, and then the app should let the user know
// using notifications when it is time to prep the area and get each crop
// sowed at the appropriate time when it is right for them to do in their
// zone."
//
// So a crop speaks only once somebody has chosen it. Each window the
// Sowing Calendar works out for it (lib/sowingWindows.ts, counted from the
// frost dates My Zone works out for the saved place) raises a reminder a
// week ahead to get the area ready, and one on the day the window opens.
// Prepped and Sown on those reminders, or on the crop's row, record the
// step for that window, which is what quiets it.
//
// An area indoors is only reminded of starting seed indoors, the one
// window that is about indoors. Anything else grown inside under lights
// has no season to wait for, and the row says so rather than inventing one.

import { findCropGuideByKey } from './cropGuides';
import {
  actionLabel,
  addDaysToDate,
  findSowingWindow,
  upcomingWindows,
  type DatedWindow,
  type FrostAnchor,
  type SowingAction,
  type SowingWindow,
} from './sowingWindows';

/** How far ahead of a window the get-ready reminder comes: long enough to
 *  clear a bed, work compost in and water it, or to find trays and seed. */
export const PREP_LEAD_DAYS = 7;

/** How far ahead the reminders reach. The queue itself only holds the next
 *  week or so; this keeps the list Home reads short. */
export const PLAN_AHEAD_DAYS = 60;

export type AreaKind = 'outdoor' | 'indoor' | 'greenhouse';

export type CropPlan = {
  id: string;
  cropKey: string;
  plotId: string | null;
  /** The area's name, or null when none is picked or it has gone. */
  plotName: string | null;
  plotLocation: AreaKind | null;
  /** True when the picked area has moved to Past Areas. */
  plotArchived: boolean;
};

export type CropStepKind = 'prepped' | 'sown';

export type CropPlanStep = {
  id: string;
  planId: string;
  action: SowingAction;
  /** The window's first day, 'YYYY-MM-DD', which with the action says
   *  which window this step was for. */
  windowStart: string;
  step: CropStepKind;
  doneOn: string;
};

export type CropReminderKind = 'cropPrep' | 'cropSow';

export type CropReminder = {
  kind: CropReminderKind;
  sourceId: string;
  title: string;
  detail: string;
  dueOn: string;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "8 Oct". */
export function shortDate(date: string): string {
  const m = Number(date.slice(5, 7));
  const d = Number(date.slice(8, 10));
  return `${d} ${MONTHS[m - 1] ?? ''}`.trim();
}

export function cropName(cropKey: string): string {
  return findCropGuideByKey(cropKey)?.name ?? cropKey;
}

/** The windows that apply to an area of this kind, soonest first. No area
 *  yet counts as outdoors, which is where most crops go. */
export function windowsForArea(w: SowingWindow, anchor: FrostAnchor, today: string, location: AreaKind | null): DatedWindow[] {
  const all = upcomingWindows(w, anchor, today);
  if (location !== 'indoor') return all;
  return all.filter((d) => d.action === 'indoors');
}

/** One id per crop and window, which the notification carries back so a
 *  press records the step for exactly that window. */
export function cropStepSourceId(planId: string, action: SowingAction, windowStart: string): string {
  return `${planId}~${action}~${windowStart}`;
}

export function parseCropStepSourceId(sourceId: string): { planId: string; action: SowingAction; windowStart: string } | null {
  const parts = sourceId.split('~');
  if (parts.length !== 3) return null;
  const [planId, action, windowStart] = parts;
  const actions: SowingAction[] = ['indoors', 'plantOut', 'direct', 'autumn', 'frostFree'];
  if (!planId || !actions.includes(action as SowingAction) || !/^\d{4}-\d{2}-\d{2}$/.test(windowStart)) return null;
  return { planId, action: action as SowingAction, windowStart };
}

function hasStep(steps: CropPlanStep[], planId: string, d: DatedWindow, step: CropStepKind): boolean {
  return steps.some((s) => s.planId === planId && s.action === d.action && s.windowStart === d.start && s.step === step);
}

function areaPhrase(plan: CropPlan): string {
  return plan.plotName && !plan.plotArchived ? plan.plotName : 'the area';
}

/** What getting ready means for a window, in one sentence. */
export function prepSentence(plan: CropPlan, w: SowingWindow, d: DatedWindow): string {
  const opens = `${actionLabel(w, d.action)} opens ${shortDate(d.start)}`;
  if (d.action === 'indoors') return `${opens}. A week to find trays, seed mix and a bright spot.`;
  return `${opens}. A week to clear ${areaPhrase(plan)}, work compost in and water it so it settles.`;
}

export function sowSentence(plan: CropPlan, w: SowingWindow, d: DatedWindow): string {
  const where = d.action === 'indoors' ? 'indoors' : `in ${areaPhrase(plan)}`;
  return `${actionLabel(w, d.action)} ${where}, open ${shortDate(d.start)} to ${shortDate(d.end)}.`;
}

/**
 * Every get-ready and sowing reminder for the chosen crops, as of `today`.
 * A window already sown raises nothing, and one already prepped raises only
 * its sowing reminder. Windows starting more than PLAN_AHEAD_DAYS out are
 * left for a later reconcile.
 */
export function cropPlanReminders(plans: CropPlan[], steps: CropPlanStep[], anchor: FrostAnchor, today: string): CropReminder[] {
  const horizon = addDaysToDate(today, PLAN_AHEAD_DAYS);
  const out: CropReminder[] = [];
  for (const plan of plans) {
    const w = findSowingWindow(plan.cropKey);
    if (!w) continue;
    const name = cropName(plan.cropKey);
    for (const d of windowsForArea(w, anchor, today, plan.plotLocation)) {
      if (d.start > horizon) continue;
      if (hasStep(steps, plan.id, d, 'sown')) continue;
      const sourceId = cropStepSourceId(plan.id, d.action, d.start);
      if (!hasStep(steps, plan.id, d, 'prepped')) {
        out.push({ kind: 'cropPrep', sourceId, title: name, detail: prepSentence(plan, w, d), dueOn: addDaysToDate(d.start, -PREP_LEAD_DAYS) });
      }
      out.push({ kind: 'cropSow', sourceId, title: name, detail: sowSentence(plan, w, d), dueOn: d.start });
    }
  }
  return out;
}

export type CropRowState =
  | { kind: 'noWindows'; line: string }
  | { kind: 'next'; window: DatedWindow; label: string; open: boolean; prepped: boolean; sown: boolean; line: string };

/**
 * What a crop's row in My Crops says: the next window not yet sown, or the
 * last one sown while it is still open, and where each step stands. Null
 * anchor means the frost dates are not worked out yet.
 */
export function cropRowState(plan: CropPlan, steps: CropPlanStep[], anchor: FrostAnchor | null, today: string): CropRowState {
  const w = findSowingWindow(plan.cropKey);
  if (!w) return { kind: 'noWindows', line: 'The Sowing Calendar has no windows for this crop, so there is nothing to remind you of.' };
  if (!anchor) return { kind: 'noWindows', line: 'Save a place in My Zone and its windows will be worked out.' };
  const windows = windowsForArea(w, anchor, today, plan.plotLocation);
  if (windows.length === 0) {
    return {
      kind: 'noWindows',
      line: 'Grown indoors under lights it has no season to wait for, so there is nothing to remind you of. Sow it when you are ready.',
    };
  }
  const pending = windows.find((d) => !hasStep(steps, plan.id, d, 'sown'));
  const d = pending ?? windows[0];
  const prepped = hasStep(steps, plan.id, d, 'prepped');
  const sown = hasStep(steps, plan.id, d, 'sown');
  const label = actionLabel(w, d.action);
  const open = d.start <= today && today <= d.end;
  const when = open ? `open now until ${shortDate(d.end)}` : `opens ${shortDate(d.start)}`;
  const status = sown ? 'Sown.' : prepped ? 'Area ready.' : null;
  return { kind: 'next', window: d, label, open, prepped, sown, line: [`${label}: ${when}.`, status].filter(Boolean).join(' ') };
}
