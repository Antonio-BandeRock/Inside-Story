// Shared helpers for quick-log, the push to make getting a meal into the
// record take seconds rather than a full builder pass. Opened 2026-08-30 as
// Open Next Steps item 21: logging discipline is this project's named #1
// risk, and nothing downstream (trend finding, pattern discovery, personal
// rules) has anything to work with if the logging itself never happens.
//
// Phase 1 (Log Again, on Home) needed none of this, since re-logging an
// already-logged meal carries its own meal type along with it. Phase 2
// (logging a scanned product straight from the barcode result) is the first
// path that has to answer "what kind of meal is this" with no prior meal to
// copy from, and phases 3 and 4 (voice, photo) will have the identical
// problem, which is why this lives here rather than inside one screen.

import type { UserProfile } from './db';

// The meal types quick-log offers. Deliberately the four ordinary eating
// occasions rather than every value meals.meal_type can hold: the others
// (beverage, salad, smoothie) describe what the food IS, and a person
// logging a scanned box of crackers at 3pm is answering when, not what. Any
// of those remain reachable through the Food builders, which ask properly.
export const QUICK_LOG_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export type QuickLogMealType = (typeof QUICK_LOG_MEAL_TYPES)[number];

export function quickLogMealTypeLabel(mealType: QuickLogMealType): string {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

// Minutes since midnight for an "HH:mm" 24-hour string, or null if it is not
// one. meals.eaten_at and every usual*Time field on a profile share this
// exact shape, so one parser covers both.
function minutesFromTime24(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

// Fallback boundaries, used only for a meal the person has set no usual time
// for. Plain clock thresholds rather than anything clever: before 4am reads
// as a snack, before 10:30 as breakfast, before 15:00 as lunch, before 21:00
// as dinner, and anything else as a snack. These exist so someone who has
// never filled in Profile still gets a sensible starting answer, not a blank.
const FALLBACK_BOUNDARIES: { before: number; mealType: QuickLogMealType }[] = [
  // Before 4am is the small-hours case: awake and eating at 2am is a snack,
  // not an early breakfast, and calling it breakfast would quietly mislabel
  // it in every trend built on meal type afterwards.
  { before: 4 * 60, mealType: 'snack' },
  { before: 10 * 60 + 30, mealType: 'breakfast' },
  { before: 15 * 60, mealType: 'lunch' },
  { before: 21 * 60, mealType: 'dinner' },
];

// A starting guess at which meal a given time of day belongs to, never a
// decision: every screen using this shows the answer and lets it be changed
// before anything is written. Prefers the person's own usual meal times
// (Profile > Meal Timing), picking whichever is closest to the time given,
// and falls back to plain clock thresholds for anyone who has not set them.
//
// Snack is deliberately excluded from the closest-match pass even when a
// usual snack time is set. A snack is the one meal type with no fixed slot
// in a day, so letting it compete on distance would have it winning at
// oddly specific moments and reading as a bug. It stays the honest catch-all
// for a time that lands near no real meal at all.
export function inferMealTypeForTime(profile: UserProfile | null, time24: string): QuickLogMealType {
  const nowMinutes = minutesFromTime24(time24);
  if (nowMinutes == null) return 'snack';

  const candidates: { mealType: QuickLogMealType; minutes: number }[] = [];
  const usualTimes: [QuickLogMealType, string | null][] = [
    ['breakfast', profile?.usualBreakfastTime ?? null],
    ['lunch', profile?.usualLunchTime ?? null],
    ['dinner', profile?.usualDinnerTime ?? null],
  ];
  for (const [mealType, usual] of usualTimes) {
    const minutes = minutesFromTime24(usual);
    if (minutes != null) candidates.push({ mealType, minutes });
  }

  if (candidates.length > 0) {
    let closest = candidates[0];
    let closestDistance = Math.abs(nowMinutes - closest.minutes);
    for (const candidate of candidates.slice(1)) {
      const distance = Math.abs(nowMinutes - candidate.minutes);
      if (distance < closestDistance) {
        closest = candidate;
        closestDistance = distance;
      }
    }
    // Beyond two hours from every usual meal time, this is closer to a snack
    // than to any meal the person actually keeps, so say so rather than
    // stretching the nearest one to cover it.
    return closestDistance <= 120 ? closest.mealType : 'snack';
  }

  for (const boundary of FALLBACK_BOUNDARIES) {
    if (nowMinutes < boundary.before) return boundary.mealType;
  }
  return 'snack';
}
