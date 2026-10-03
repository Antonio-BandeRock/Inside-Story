// Where each kind of reminder lives (1.0.60.3), so Profile > Reminders can
// list the switches the way the rest of the app is laid out. Direct request,
// 2026-10-03: "The list of notifications that can be turned on and off
// should be in Profile grouped by the Tab they are associated with, and then
// alphabetically by sub-group inside each tab, and within each Lens worth of
// notifications."
//
// So: tabs in the order TabHub shows them (TAB_ORDER, which
// scripts/test_reminder_kind_groups.js holds to TAB_ROUTES in
// constants/tabs.ts), lenses alphabetical inside a tab, and the switches
// alphabetical inside a lens. A kind is placed on the tab and lens where the
// thing it reminds about is defined, not where its timeline is drawn: a
// refill is about a med in Life > My Meds, a dose is the dose timeline on
// Schedules > Meds.
//
// Pure, with only a type import, so the test can load it without a phone.
import type { ReminderKindKey } from './reminderPreferences';

export const TAB_ORDER = ['Home', 'Food', 'Schedules', 'Signals', 'Insights', 'Trends', 'Reports', 'Garden', 'Life'] as const;
export type ReminderTab = (typeof TAB_ORDER)[number];

export type ReminderPlace = { tab: ReminderTab; lens: string };

export const REMINDER_KIND_PLACE: Record<ReminderKindKey, ReminderPlace> = {
  reminder: { tab: 'Home', lens: 'Capture' },
  morning: { tab: 'Home', lens: 'Morning Check-In' },
  week: { tab: 'Home', lens: 'Your Week' },
  appointment: { tab: 'Schedules', lens: 'Appointments' },
  exercise: { tab: 'Schedules', lens: 'Exercise' },
  hydration: { tab: 'Schedules', lens: 'Hydration' },
  weekPlan: { tab: 'Schedules', lens: 'Meal Plan' },
  meal: { tab: 'Schedules', lens: 'Meals' },
  dose: { tab: 'Schedules', lens: 'Meds' },
  checkin: { tab: 'Signals', lens: 'General Note' },
  afterMeal: { tab: 'Signals', lens: 'General Note' },
  compost: { tab: 'Garden', lens: 'Compost' },
  photoSeries: { tab: 'Garden', lens: 'Plots & Plantings' },
  cropPrep: { tab: 'Garden', lens: 'Sowing Calendar' },
  cropSow: { tab: 'Garden', lens: 'Sowing Calendar' },
  gardenMonth: { tab: 'Garden', lens: 'Sowing Calendar' },
  garden: { tab: 'Garden', lens: 'Upcoming Tasks' },
  countdown: { tab: 'Life', lens: 'Days Until' },
  check: { tab: 'Life', lens: 'Did I Do It' },
  bill: { tab: 'Life', lens: 'Finances' },
  useBy: { tab: 'Life', lens: 'Kitchen' },
  refill: { tab: 'Life', lens: 'My Meds' },
  routine: { tab: 'Life', lens: 'Routines' },
  todo: { tab: 'Life', lens: 'To-Do' },
  upkeep: { tab: 'Life', lens: 'Upkeep' },
  benefit: { tab: 'Life', lens: 'Work' },
};

export type ReminderLensGroup = { lens: string; keys: ReminderKindKey[] };
export type ReminderTabGroup = { tab: ReminderTab; lenses: ReminderLensGroup[] };

function byWords(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

// Every kind given, laid out tab, then lens, then switch. Tabs with nothing
// in them are left out. `labels` is REMINDER_KIND_LABELS, passed in so this
// file stays free of the preferences module's database import.
export function groupReminderKinds(
  keys: readonly ReminderKindKey[],
  labels: Record<ReminderKindKey, string>,
): ReminderTabGroup[] {
  const result: ReminderTabGroup[] = [];
  for (const tab of TAB_ORDER) {
    const inTab = keys.filter((key) => REMINDER_KIND_PLACE[key]?.tab === tab);
    if (inTab.length === 0) continue;
    const lensNames = Array.from(new Set(inTab.map((key) => REMINDER_KIND_PLACE[key].lens))).sort(byWords);
    result.push({
      tab,
      lenses: lensNames.map((lens) => ({
        lens,
        keys: inTab.filter((key) => REMINDER_KIND_PLACE[key].lens === lens).sort((a, b) => byWords(labels[a], labels[b])),
      })),
    });
  }
  return result;
}

// The kinds behind the reminders showing in one group of the waiting list,
// each once, alphabetical by label, so the group can offer a switch for each.
export function kindsShowing(
  kinds: readonly string[],
  labels: Record<ReminderKindKey, string>,
): ReminderKindKey[] {
  const found = new Set<ReminderKindKey>();
  for (const kind of kinds) if (kind in REMINDER_KIND_PLACE) found.add(kind as ReminderKindKey);
  return Array.from(found).sort((a, b) => byWords(labels[a], labels[b]));
}
