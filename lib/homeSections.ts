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
  // Capture, 2026-09-16. Null is the honest answer rather than a
  // default: a thought nobody has given a category to yet belongs to no
  // tab, which is also the whole reason the screen exists. Being null
  // here is what keeps it a top-level row instead of a card inside a
  // band, so reaching it is one tap rather than two.
  captureInbox: null,
  // Home, since 1.0.39.10. 1.0.39.7 left Home with no group at all, by
  // moving its one member (Low Stimulation) under Profile where the
  // switch actually lives, and the comment written here at the time
  // argued that was correct: every card on the page is a way into
  // somewhere else, so a Home group would only mean "the rest".
  //
  // Direct correction the same day: "You removed the Home group from the
  // Home screen. It should remain at the top in order of occurance in the
  // TabHub menu." The argument was wrong because it assumed Home owns
  // nothing. Home owns the greeting, the date and the sky: the one card
  // that is not a window into another tab. That is the Home group, and it
  // leads the page the way Home leads the menu.
  today: '/',
  // Profile's, since 1.0.39.7. It is the same switch Profile carries,
  // surfaced on the page a person is already on, so it belongs under
  // Profile's name rather than under Home's.
  //
  // /profile is not a TAB_ROUTE (it is a Stack screen TabHub opens with
  // router.push), so its name, icon and colour come from
  // HOME_GROUP_IDENTITY in app/(tabs)/index.tsx instead.
  lowStimulation: '/profile',
  logAgain: '/food',
  scanProduct: '/food',
  groceryList: '/life',
  // 2026-09-16, direct request: "make sure there is a Group for
  // Gardening on the Home screen, as there will most definitely be quick
  // access things from that group. The same goes for Reports, as well as
  // Profile."
  makeReport: '/reports',
  gardenTasks: '/garden',
  daysUntil: '/garden',
  logHarvest: '/garden',
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
  // 2026-09-19: the Digest tab is gone, but the cards keep a group of
  // their own. They sat in the Home group for one release (1.0.41.13),
  // and the correction the same day was "they need to be out on their
  // own together like they were before, and they should be listed in a
  // group called Digest", in the purple the tab wore, "since it doesn't
  // exist otherwise." /digest is not a TAB_ROUTE any more, so the group
  // reads its name, icon and colour from HOME_GROUP_IDENTITY in
  // constants/homeGroups.ts, the same way Profile does. Each card inside
  // still wears the colour of the tab its entry now lives on (see
  // renderDigestCards in app/(tabs)/index.tsx).
  digestCards: '/digest',
  // Life's, 2026-09-17, alongside the Grocery List for the same reason:
  // these are the things a day is actually run on, and Life is where both
  // are built.
  routines: '/life',
  doneChecks: '/life',
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

// --- Arranging Home from Home itself, 1.0.39.16 ---
//
// Direct request: long hold on a group, drag it into a new order, turn it
// off, and the same for the quick access items inside it. Everything below
// is the arithmetic that needs, kept here with the grouping it has to stay
// consistent with, and kept pure so scripts/test_home_sections.js can check
// it in plain node.
//
// There is deliberately no second stored order for groups. A group's
// position already IS the position of its first member in the saved section
// order (groupHomeSectionKeysByTab), so moving a group is a rewrite of that
// one list rather than a new field that could disagree with it. The same
// goes for moving a card inside its group. One saved order, two ways of
// moving through it.

// The id a group is known by: its tab path, or a solo section key
// behind a prefix so a future tab path can never collide with one. Used as
// the key for a group's on/off switch and as the handle a drag names.
export function homeSectionGroupId(key: HomeSectionKey): string {
  return HOME_SECTION_TAB_PATH[key] ?? `solo:${key}`;
}

export function homeGroupIdOf(group: HomeSectionDisplayGroup): string {
  return group.kind === 'tab' ? group.path : `solo:${group.key}`;
}

export function homeGroupMembers(group: HomeSectionDisplayGroup): HomeSectionKey[] {
  return group.kind === 'tab' ? group.keys : [group.key];
}

// Move one entry of an array to another index, the rest closing up and
// shifting to make room. Out-of-range indexes come back untouched rather
// than clamped: a drag that ended outside the list did not mean anything.
function moveWithin<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;
  if (fromIndex < 0 || fromIndex >= items.length) return items;
  if (toIndex < 0 || toIndex >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

// Drag a whole group to a new position. Its members travel with it and keep
// their order inside it, which is the same promise Profile's up/down
// buttons already make out loud.
export function reorderHomeGroups(
  ordered: HomeSectionKey[],
  fromIndex: number,
  toIndex: number,
): HomeSectionKey[] {
  const groups = groupHomeSectionsForDisplay(ordered);
  const moved = moveWithin(groups, fromIndex, toIndex);
  if (moved === groups) return ordered;
  return moved.flatMap(homeGroupMembers);
}

// Drag one card to a new position inside its own group. Indexes are
// positions among that group's members, not among all of Home, so a drag
// can never quietly move a card out from under the name it sits beneath.
export function reorderWithinHomeGroup(
  ordered: HomeSectionKey[],
  groupId: string,
  fromIndex: number,
  toIndex: number,
): HomeSectionKey[] {
  const groups = groupHomeSectionsForDisplay(ordered);
  const index = groups.findIndex((group) => homeGroupIdOf(group) === groupId);
  if (index === -1) return ordered;
  const group = groups[index];
  if (group.kind !== 'tab') return ordered;
  const moved = moveWithin(group.keys, fromIndex, toIndex);
  if (moved === group.keys) return ordered;
  const next = [...groups];
  next[index] = { kind: 'tab', path: group.path, keys: moved };
  return next.flatMap(homeGroupMembers);
}
