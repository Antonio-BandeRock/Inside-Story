// Which tab each Home section is a window into, and the grouping that
// follows from it. 2026-09-12, direct request: "Make sure to group each
// item together with other items from the same tab group."
//
// Pure on purpose: no database, no React, so it can be checked in plain
// node (scripts/test_home_sections.js) and so lib/visualPreferences.ts can
// import it without a cycle (this file only ever imports a type from
// there, which is erased at compile time).
import type { HomeSectionKey } from './visualPreferences';

// The tab path each section borrows its colour and icon from, and the
// group it sits in on Home. null means the section belongs to no tab and
// stands on its own in the order (the shared-folder setup nudge is about
// backups and partners, not any one tab). 'weather' renders inside the
// greeting card rather than as a section, so it is null too.
//
// Matches HOME_LENS_DESTINATIONS in app/(tabs)/index.tsx, which is where
// the corner menu already decided what each card is a window into. The
// symptom check-in opens the assessment, a standalone screen, but it is
// Signals' own data and the corner menu already colours it that way.
//
// 2026-09-12, direct correction: "Grocery List seems to be related to
// Schedule and I think it should instead relate to Life." It is built from
// the schedule, but it is shopped from, priced, and checked against the
// kitchen, all of which is Life's Kitchen and Finances ground.
export const HOME_SECTION_TAB_PATH: Record<HomeSectionKey, string | null> = {
  weather: null,
  sharedFolderSetup: null,
  // Home's own, so it sits in Home's group: what it changes is how the
  // whole app looks, not what any one tab holds (2026-09-16).
  lowStimulation: '/',
  logAgain: '/food',
  scanProduct: '/food',
  groceryList: '/life',
  yourDay: '/schedule',
  todaysReminders: '/schedule',
  symptomCheckinReminder: '/log',
  todaysCheckin: '/log',
  howYoureFeeling: '/log',
  logFlare: '/log',
  logBloodPressure: '/log',
  logExercise: '/log',
  mealsLoggedToday: '/schedule',
  worthALook: '/insights',
  fuelGauges: '/insights',
  weekTrend: '/trends',
  digestCards: '/purple-digest',
};

// Regroups an already-ordered list so sections from the same tab sit
// together, without discarding the order the person chose in Profile:
// each group lands where its FIRST member was, and members keep their
// relative order inside it. So moving one section above another tab's
// section in Profile carries its tab-mates along with it rather than
// being silently undone. A section with no tab is its own group of one
// and stays exactly where it was.
// The same grouping, one step further: each run of tab-mates becomes a
// band the person opens, so Home at rest is a short list of tab names
// rather than a column of every card at once.
//
// 2026-09-16, direct correction: "the things that are already on the Home
// screen are already all quick access things from other tabs. What I
// meant was to group the existing quick access elements into their
// overarching category, rather than something labeled as Quick Access."
// So the category is the tab itself, named and coloured like it, and
// there is no band called Quick Access: the whole page is that.
//
// A section belonging to no tab (the shared-folder nudge) stays a row at
// the top level, since there is no category to put it under.
export type HomeSectionDisplayGroup =
  | { kind: 'solo'; key: HomeSectionKey }
  | { kind: 'tab'; path: string; keys: HomeSectionKey[] };

export function groupHomeSectionsForDisplay(ordered: HomeSectionKey[]): HomeSectionDisplayGroup[] {
  const groups: HomeSectionDisplayGroup[] = [];
  // Regrouped first rather than trusting the caller, so this is correct
  // on any list and can be checked on its own. Already-grouped input
  // comes back untouched, so the second pass costs nothing.
  for (const key of groupHomeSectionKeysByTab(ordered)) {
    const path = HOME_SECTION_TAB_PATH[key];
    if (path == null) {
      groups.push({ kind: 'solo', key });
      continue;
    }
    const last = groups[groups.length - 1];
    if (last && last.kind === 'tab' && last.path === path) last.keys.push(key);
    else groups.push({ kind: 'tab', path, keys: [key] });
  }
  return groups;
}

export function groupHomeSectionKeysByTab(ordered: HomeSectionKey[]): HomeSectionKey[] {
  const groups = new Map<string, HomeSectionKey[]>();
  for (const key of ordered) {
    const groupId = HOME_SECTION_TAB_PATH[key] ?? `solo:${key}`;
    const members = groups.get(groupId);
    if (members) members.push(key);
    else groups.set(groupId, [key]);
  }
  return [...groups.values()].flat();
}
