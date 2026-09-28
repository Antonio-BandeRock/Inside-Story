// The household meal calendar (H9, 2026-09-27): meals planned for the whole
// household, which partners keep in step between their phones.
//
// Why a table of its own rather than schedule_items. A person's schedule
// holds appointments and doses beside meals, and its meal rows point at the
// person's logged meals (linked_meal_id, source_meal_id), which are health
// records and never cross to anybody (PERSONAL_HEALTH_TABLES in
// lib/peerRelationships.ts). Peer sync carries whole tables, so the only way
// to share meals and nothing else is a table that holds nothing else:
// household_meal_calendar, the 'mealCalendar' area on the allowlist.
//
// A calendar entry never becomes a meal on anybody's schedule by arriving.
// Put on my schedule copies it, on the device of whoever presses it, and the
// copy is theirs: removing the entry later leaves it where it is, and the
// entry remembers the copy only on that device (my_schedule_item_id and
// my_copied_at stay home when the table travels).
//
// Every decision and every sentence is here with no database, so
// scripts/test_household_calendar.js can check them without a phone.

export type HouseholdMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const HOUSEHOLD_MEAL_TYPES: readonly HouseholdMealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export type HouseholdMealEntry = {
  id: string;
  /** YYYY-MM-DD, a local date. */
  mealDate: string;
  /** HH:MM, or null when nobody set a time. */
  time: string | null;
  mealType: HouseholdMealType;
  title: string;
  /** System recipe ids, which resolve the same on both phones. Empty for a meal typed in by name. */
  recipeIds: string[];
  servings: number | null;
  /** Who is cooking, in the words of whoever wrote it. */
  cook: string | null;
  note: string | null;
  /** The meal this device put on its own schedule from the entry, if any. */
  myScheduleItemId: string | null;
  myCopiedAt: string | null;
  updatedAt: string;
};

export type HouseholdMealDraft = {
  mealDate: string;
  time: string;
  mealType: HouseholdMealType;
  title: string;
  recipeIds: string[];
  servings: string;
  cook: string;
  note: string;
};

/** A person this calendar is shared with, and whether this side has Meals turned on for them. */
export type CalendarPartner = { name: string; sharing: boolean };

export const HOUSEHOLD_CALENDAR_TITLE = 'Household meal calendar';
export const PUT_ON_MY_SCHEDULE_LABEL = 'Put on my schedule';
export const ADD_TO_CALENDAR_LABEL = 'Add a household meal';

const MEAL_ORDER: Record<HouseholdMealType, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };

export function mealTypeLabel(type: HouseholdMealType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function isHouseholdMealType(value: unknown): value is HouseholdMealType {
  return typeof value === 'string' && (HOUSEHOLD_MEAL_TYPES as readonly string[]).includes(value);
}

function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** The line under the band's title: who sees this calendar, or why nobody does yet. */
export function householdCalendarIntro(partners: CalendarPartner[]): string {
  const sharing = partners.filter((partner) => partner.sharing).map((partner) => partner.name);
  const off = partners.filter((partner) => !partner.sharing).map((partner) => partner.name);
  const copyLine = `Nothing here goes on your own schedule until you choose ${PUT_ON_MY_SCHEDULE_LABEL}.`;
  if (partners.length === 0) {
    return `Meals planned for the whole household. Nobody is linked yet, so this calendar stays on this phone until you link a partner in Connections. ${copyLine}`;
  }
  if (sharing.length === 0) {
    return `Meals planned for the whole household. You have Meals turned off for ${listNames(off)} in Connections, so this calendar stays on this phone. ${copyLine}`;
  }
  const offLine = off.length > 0 ? ` It is not shared with ${listNames(off)}, since Meals is turned off for them in Connections.` : '';
  return `Meals planned for the whole household, shared with ${listNames(sharing)}. Either of you can add, change or remove a meal and both of you end up with it, the next time your phones talk.${offLine} ${copyLine}`;
}

/** Oldest day first, then breakfast to snack, then by time. */
export function sortEntries(entries: HouseholdMealEntry[]): HouseholdMealEntry[] {
  return [...entries].sort(
    (a, b) =>
      a.mealDate.localeCompare(b.mealDate) ||
      MEAL_ORDER[a.mealType] - MEAL_ORDER[b.mealType] ||
      (a.time ?? '99:99').localeCompare(b.time ?? '99:99') ||
      a.title.localeCompare(b.title),
  );
}

export type ScheduleState = 'notCopied' | 'copied' | 'changedSince';

/** Whether this device put the entry on its schedule, and whether it changed afterwards. */
export function scheduleState(entry: HouseholdMealEntry): ScheduleState {
  if (!entry.myScheduleItemId || !entry.myCopiedAt) return 'notCopied';
  return entry.updatedAt > entry.myCopiedAt ? 'changedSince' : 'copied';
}

/** The muted line under an entry's title. */
export function entryMeta(entry: HouseholdMealEntry): string {
  const parts: string[] = [];
  parts.push(entry.time ? `${mealTypeLabel(entry.mealType)} at ${entry.time}` : mealTypeLabel(entry.mealType));
  if (entry.servings != null) parts.push(`${formatServings(entry.servings)} ${entry.servings === 1 ? 'serving' : 'servings'}`);
  if (entry.cook) parts.push(`${entry.cook} cooking`);
  const state = scheduleState(entry);
  if (state === 'copied') parts.push('On your schedule');
  if (state === 'changedSince') parts.push('Changed since you put it on your schedule');
  return parts.join(' · ');
}

function formatServings(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
}

/** Checks a draft before it is written. Null when it can be saved. */
export function draftProblem(draft: HouseholdMealDraft): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.mealDate)) return 'Pick a day for this meal.';
  if (!draft.title.trim()) return 'Give the meal a name, or pick one from your day.';
  const time = draft.time.trim();
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return 'Write the time as hours and minutes, like 18:30, or leave it empty.';
  const servings = draft.servings.trim();
  if (servings && !(Number(servings) > 0)) return 'Servings is a number above 0, or leave it empty.';
  return null;
}

/** The fields a draft writes, tidied. Call only when draftProblem is null. */
export function draftToFields(draft: HouseholdMealDraft): {
  mealDate: string;
  time: string | null;
  mealType: HouseholdMealType;
  title: string;
  recipeIds: string[];
  servings: number | null;
  cook: string | null;
  note: string | null;
} {
  const servings = draft.servings.trim();
  return {
    mealDate: draft.mealDate,
    time: draft.time.trim() || null,
    mealType: draft.mealType,
    title: draft.title.trim(),
    recipeIds: draft.recipeIds,
    servings: servings ? Number(servings) : null,
    cook: draft.cook.trim() || null,
    note: draft.note.trim() || null,
  };
}

export function blankDraft(mealDate: string): HouseholdMealDraft {
  return { mealDate, time: '', mealType: 'dinner', title: '', recipeIds: [], servings: '', cook: '', note: '' };
}

export function draftFromEntry(entry: HouseholdMealEntry): HouseholdMealDraft {
  return {
    mealDate: entry.mealDate,
    time: entry.time ?? '',
    mealType: entry.mealType,
    title: entry.title,
    recipeIds: entry.recipeIds,
    servings: entry.servings == null ? '' : formatServings(entry.servings),
    cook: entry.cook ?? '',
    note: entry.note ?? '',
  };
}

/** A meal on this person's own schedule, offered as the start of a calendar entry. */
export type MyDayMeal = {
  scheduledFor: string;
  mealType: string | null;
  title: string;
  servings: number | null;
  recipeIds: string[];
};

/**
 * A draft started from a meal already on this person's schedule. The name,
 * time, servings and system recipes go across; nothing that points at their
 * own records does.
 */
export function draftFromMyMeal(meal: MyDayMeal): HouseholdMealDraft {
  const type = isHouseholdMealType(meal.mealType) ? meal.mealType : 'dinner';
  const time = meal.scheduledFor.length >= 16 ? meal.scheduledFor.slice(11, 16) : '';
  return {
    mealDate: meal.scheduledFor.slice(0, 10),
    time,
    mealType: type,
    title: meal.title,
    recipeIds: meal.recipeIds,
    servings: meal.servings == null ? '' : formatServings(meal.servings),
    cook: '',
    note: '',
  };
}

/**
 * What the person is asked before a calendar meal goes on their schedule,
 * when their day already holds a planned meal of the same kind. Null when
 * nothing is in the way. A snack never counts as in the way.
 */
export function scheduleClashMessage(
  entry: Pick<HouseholdMealEntry, 'mealType' | 'title'>,
  dayLabel: string,
  planned: { mealType: string | null; title: string }[],
): string | null {
  if (entry.mealType === 'snack') return null;
  const same = planned.filter((meal) => meal.mealType === entry.mealType);
  if (same.length === 0) return null;
  const titles = listNames(same.map((meal) => meal.title));
  return `Your schedule already has ${entry.mealType} on ${dayLabel}: ${titles}. Put ${entry.title} on as well? Nothing already there is changed.`;
}

export function putOnScheduleDone(entry: Pick<HouseholdMealEntry, 'mealType' | 'title'>, dayLabel: string): string {
  return `${entry.title} is on your schedule for ${entry.mealType} on ${dayLabel}.`;
}

/** Asked before a calendar entry is removed. */
export function removeEntryMessage(entry: HouseholdMealEntry, sharedWith: string[]): string {
  const whose = sharedWith.length > 0 ? `for you and ${listNames(sharedWith)}` : 'on this phone';
  const kept =
    scheduleState(entry) === 'notCopied'
      ? ''
      : ' The meal you put on your own schedule from it stays there.';
  return `Takes ${entry.title} off the household calendar ${whose}.${kept}`;
}

/** Said after an entry this device copied was changed, when the person opens it. */
export function changedSinceMessage(entry: HouseholdMealEntry): string {
  return `${entry.title} was changed on the household calendar after you put it on your schedule. Your schedule still has it as it was. Put it on again to add the new version, and remove the old one from your day if you no longer want it.`;
}

/** Days of a week, for the day picker. */
export function weekDays(weekStart: string): string[] {
  const [year, month, day] = weekStart.split('-').map(Number);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.UTC(year, month - 1, day + i));
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

/** How many meals the calendar holds for the week, for the band's count. */
export function weekCountLine(count: number): string {
  if (count === 0) return 'No household meals planned for this week yet.';
  return `${count} household ${count === 1 ? 'meal' : 'meals'} planned for this week.`;
}
