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
export const HOME_SECTION_TAB_PATH: Record<HomeSectionKey, string | null> = {
  weather: null,
  sharedFolderSetup: null,
  quickActions: '/',
  logAgain: '/food',
  groceryList: '/schedule',
  yourDay: '/schedule',
  symptomCheckinReminder: '/log',
  todaysCheckin: '/log',
  howYoureFeeling: '/log',
  statTiles: '/insights',
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
