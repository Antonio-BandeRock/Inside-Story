// Things that need doing again, and things that run out.
//
// Built 2026-09-05. Life's fourth area, chosen over the alternatives because
// the mechanism was already proven three times in the same day and because the
// documents half is load-bearing for anyone living somewhere their papers have
// to be renewed.
//
// WHY THIS DOES NOT REUSE DueRule, WHICH LOOKS LIKE THE OBVIOUS ANSWER.
//
// lib/financeSchedule.ts already models "the second Tuesday of every third
// month" for bills, and forcing upkeep through it was the first plan. It is
// wrong, and the reason is worth keeping:
//
//   A BILL is calendar-anchored. Rent arrives on the 1st whether or not you
//   did anything, so its next date comes from a rule about the calendar.
//
//   A SERVICE is last-done-anchored. A boiler serviced in March is next due
//   the following March, not next January. Its next date comes from when you
//   last did it plus how often it needs doing.
//
// Reusing the bill machinery would have quietly told someone their boiler was
// due in January because that is when the rule fired, regardless of the service
// three months earlier. Same-looking shape, different semantics.
//
// TWO SHAPES, THEREFORE.
//
//   recurring  needs doing again every so often, counted from the last time.
//              Servicing, filters, gutters, descaling.
//   expires    has one date and then it is over. A passport, a registration,
//              a warranty. Some renew and some just end, which is stored,
//              because "renew this" and "this is finished" are different
//              things to be told.
//
// WHAT THIS FILE WILL NOT DO.
//
// It never says something is required. Whether a vehicle must be inspected, or
// how long a licence lasts, depends entirely on where someone lives, and the
// app holds what they told it rather than asserting a rule. Same line
// constants/workBenefitPrompts.ts already holds, and the same correction from
// earlier the same day that produced it.
//
// It never invents a cost. An item with no cost recorded is counted and named,
// and any total built over them says how many are missing and calls itself a
// floor, which is the rule the grocery list has held since it shipped.

import { compareLabels, sortByLabel } from './choiceOrder';

export type UpkeepCadence = 'recurring' | 'expires';

export type UpkeepCategory = 'home' | 'vehicle' | 'document' | 'other';

export const UPKEEP_CATEGORIES: { code: UpkeepCategory; label: string; example: string }[] = [
  { code: 'home', label: 'Home', example: 'Boiler service, gutters, water filter' },
  { code: 'vehicle', label: 'Vehicle', example: 'Service, tyres, registration' },
  { code: 'document', label: 'Documents', example: 'Passport, licence, residency, insurance' },
  { code: 'other', label: 'Something else', example: 'Anything with a date on it' },
];

export function upkeepCategoryLabel(code: string): string {
  return UPKEEP_CATEGORIES.find((entry) => entry.code === code)?.label ?? code;
}

export type UpkeepItem = {
  id: string;
  name: string;
  category: UpkeepCategory;
  cadence: UpkeepCadence;
  /** Recurring only: how many months between doings. */
  intervalMonths: number | null;
  /** Recurring only, J6: days between doings, for a chore that comes round
   *  weekly rather than monthly. Used in place of intervalMonths when set. */
  intervalDays: number | null;
  /** Recurring only: when it was last done. Null means never, and then there
   *  is no next date to work out rather than one starting from today. */
  lastDoneOn: string | null;
  /** Expiring only. */
  expiresOn: string | null;
  /** Expiring only: whether it can be renewed, or simply ends. */
  renewable: boolean;
  /** What it costs, when known. Null is common and never guessed at. */
  cost: number | null;
  active: boolean;
  notes: string | null;
  /** J6: which room or area it belongs to, a code from placeChoices. Null
   *  when nobody said, which groups under No place given. */
  place: string | null;
  /** The place's name as it was written, carried on the row so a household
   *  chore from somebody else's phone still reads by its place here. */
  placeName: string | null;
  /** J7: how long it takes, in minutes, when the person said. Never guessed. */
  minutes: number | null;
  /** Who it is for: null is anyone, otherwise an assignee code (see
   *  resolveAssignee below). */
  assignedTo: string | null;
  /** The assignee's name as it was when assigned, for a phone that does not
   *  know them by their code. */
  assignedName: string | null;
  /** Whether it goes to the people this person shares a household with. */
  household: boolean;
};

export type UpkeepStanding = {
  item: UpkeepItem;
  /** When it is next due, or when it runs out. Null when the pieces needed
   *  to work that out are missing, which is said rather than guessed. */
  dueOn: string | null;
  daysAway: number | null;
  overdue: boolean;
  dueSoon: boolean;
  /** Which piece is missing, when dueOn is null. */
  missing: 'neverDone' | 'noInterval' | 'noDate' | null;
};

/** Inside this many days something is worth surfacing rather than filing. */
export const DUE_SOON_DAYS = 45;

function addMonths(date: string, months: number): string | null {
  const parts = date.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [year, month, day] = parts;
  // Day-of-month is clamped to the target month's length, the same problem
  // financeSchedule solves for a bill due on the 31st: a service done on
  // 31 August and due in six months lands on 28 February, not on a date that
  // does not exist.
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string | null {
  const ms = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms + days * 86400000).toISOString().slice(0, 10);
}

function hasInterval(item: Pick<UpkeepItem, 'intervalDays' | 'intervalMonths'>): boolean {
  return (item.intervalDays != null && item.intervalDays > 0) || (item.intervalMonths != null && item.intervalMonths > 0);
}

/** Days win over months where both are set, since days are the finer choice. */
function addInterval(item: Pick<UpkeepItem, 'intervalDays' | 'intervalMonths'>, from: string): string | null {
  if (item.intervalDays != null && item.intervalDays > 0) return addDays(from, item.intervalDays);
  if (item.intervalMonths != null && item.intervalMonths > 0) return addMonths(from, item.intervalMonths);
  return null;
}

/** How often, in words: every week, every 3 months. */
export function describeInterval(item: Pick<UpkeepItem, 'intervalDays' | 'intervalMonths'>): string {
  const days = item.intervalDays;
  if (days != null && days > 0) {
    if (days === 1) return 'every day';
    if (days === 7) return 'every week';
    if (days % 7 === 0) return `every ${days / 7} weeks`;
    return `every ${days} days`;
  }
  const months = item.intervalMonths;
  if (months === 1) return 'every month';
  if (months === 12) return 'every year';
  if (months === 24) return 'every 2 years';
  return `every ${months} months`;
}

function daysBetween(from: string, to: string): number | null {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / 86400000);
}

export function upkeepStanding(item: UpkeepItem, today: string): UpkeepStanding {
  let dueOn: string | null = null;
  let missing: UpkeepStanding['missing'] = null;

  if (item.cadence === 'recurring') {
    if (!hasInterval(item)) missing = 'noInterval';
    else if (!item.lastDoneOn) missing = 'neverDone';
    else dueOn = addInterval(item, item.lastDoneOn);
  } else {
    if (!item.expiresOn) missing = 'noDate';
    else dueOn = item.expiresOn.slice(0, 10);
  }

  const daysAway = dueOn ? daysBetween(today, dueOn) : null;
  return {
    item,
    dueOn,
    daysAway,
    overdue: daysAway != null && daysAway < 0,
    dueSoon: daysAway != null && daysAway >= 0 && daysAway <= DUE_SOON_DAYS,
    missing,
  };
}

// --- Everything together ----------------------------------------------------

export type UpkeepSummary = {
  tracked: number;
  overdue: UpkeepStanding[];
  dueSoon: UpkeepStanding[];
  /** Items that cannot be placed on a calendar at all, so a clean-looking
   *  summary is not read as complete. */
  needsSetup: UpkeepStanding[];
  /** What the overdue and soon-due items cost between them, from costs
   *  actually recorded. */
  costAhead: number;
  /** How many of those have no cost recorded, which makes costAhead a floor
   *  rather than a total. */
  costUnknown: number;
};

export function summarizeUpkeep(items: UpkeepItem[], today: string): UpkeepSummary {
  const overdue: UpkeepStanding[] = [];
  const dueSoon: UpkeepStanding[] = [];
  const needsSetup: UpkeepStanding[] = [];
  let tracked = 0;
  let costAhead = 0;
  let costUnknown = 0;

  for (const item of items) {
    if (!item.active) continue;
    tracked += 1;
    const standing = upkeepStanding(item, today);

    if (standing.missing) {
      needsSetup.push(standing);
      continue;
    }
    if (standing.overdue) overdue.push(standing);
    else if (standing.dueSoon) dueSoon.push(standing);
    else continue;

    // Only what is actually coming up counts toward the figure. Something due
    // in two years is not a cost this month.
    if (item.cost != null && item.cost > 0) costAhead += item.cost;
    else costUnknown += 1;
  }

  // Most overdue first, then soonest. That is the order anything gets dealt
  // with in.
  overdue.sort((a, b) => (a.daysAway ?? 0) - (b.daysAway ?? 0));
  dueSoon.sort((a, b) => (a.daysAway ?? 0) - (b.daysAway ?? 0));

  return { tracked, overdue, dueSoon, needsSetup, costAhead, costUnknown };
}

// --- Wording ----------------------------------------------------------------

export function formatUpkeepMoney(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function describeDays(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 0) {
    const late = Math.abs(days);
    if (late < 60) return `${late} days ago`;
    const months = Math.round(late / 30);
    return `about ${months} months ago`;
  }
  if (days < 60) return `in ${days} days`;
  const months = Math.round(days / 30);
  return `in about ${months} months`;
}

export function describeUpkeepStanding(standing: UpkeepStanding): string {
  const { item } = standing;

  if (standing.missing === 'neverDone') {
    return `Never recorded as done, so there is no next date yet. Say when it was last done and this can work out when it is due again.`;
  }
  if (standing.missing === 'noInterval') {
    return 'No interval recorded, so there is nothing to count from. Say how often it needs doing.';
  }
  if (standing.missing === 'noDate') {
    return 'No date recorded, so nothing can be counted down. Add the date it runs out.';
  }

  const when = describeDays(standing.daysAway as number);

  if (item.cadence === 'expires') {
    if (standing.overdue) {
      return item.renewable
        ? `Ran out ${when}. Worth renewing, and worth checking whether anything has been resting on it since.`
        : `Ended ${when}. Nothing to renew, so this is here as a record rather than a task.`;
    }
    return `Runs out ${when}${item.renewable ? '.' : ', and does not renew.'}`;
  }

  const last = item.lastDoneOn ? `Last done ${item.lastDoneOn}` : 'Never done';
  const every = describeInterval(item);
  return standing.overdue
    ? `${last}, due ${every}, so it was due ${when}.`
    : `${last}, due ${every}. Next ${when}.`;
}

export function describeUpkeepSummary(summary: UpkeepSummary): string {
  if (summary.tracked === 0) {
    return 'Nothing here yet. This is for anything that needs doing again or runs out: a service, a filter, a registration, a passport. It tells you before the date rather than after it.';
  }

  const parts: string[] = [];

  if (summary.overdue.length > 0) {
    const worst = summary.overdue[0];
    parts.push(
      `${summary.overdue.length} ${summary.overdue.length === 1 ? 'thing is' : 'things are'} overdue, longest being ${worst.item.name}.`,
    );
  }
  if (summary.dueSoon.length > 0) {
    parts.push(
      `${summary.dueSoon.length} more ${summary.dueSoon.length === 1 ? 'is' : 'are'} due within ${DUE_SOON_DAYS} days.`,
    );
  }
  if (summary.costAhead > 0) {
    parts.push(
      summary.costUnknown > 0
        ? `That comes to at least ${formatUpkeepMoney(summary.costAhead)}, and ${summary.costUnknown} of them have no cost recorded, so treat it as a floor.`
        : `That comes to ${formatUpkeepMoney(summary.costAhead)}.`,
    );
  } else if (summary.costUnknown > 0) {
    parts.push(
      `None of them have a cost recorded, so there is no figure to give. Add what they cost and this can tell you what is coming.`,
    );
  }
  if (summary.needsSetup.length > 0) {
    parts.push(
      // "cannot be" either way, so no ternary. The first version had one with
      // identical branches, left over from a singular/plural switch that
      // turned out not to need one, and it also split the sentence across
      // three literals for no reason.
      `${summary.needsSetup.length} cannot be placed on a calendar yet, and ${summary.needsSetup.length === 1 ? 'it is' : 'they are'} listed rather than dropped.`,
    );
  }

  if (parts.length === 0) {
    return `${summary.tracked} tracked, nothing overdue and nothing due in the next ${DUE_SOON_DAYS} days.`;
  }
  return parts.join(' ');
}

/**
 * The next date after something has just been done.
 *
 * Returned rather than applied, so the caller decides whether to store it. A
 * service done today resets the clock from today, which is the whole reason
 * this area does not use the bill machinery.
 */
export function nextDueAfterDoing(item: UpkeepItem, doneOn: string): string | null {
  if (item.cadence !== 'recurring' || !hasInterval(item)) return null;
  return addInterval(item, doneOn);
}

// --- J6: by room or area -----------------------------------------------------
//
// An open list, the same shape as the garden's: a few places everybody has,
// then any the person names, alphabetical together (lib/choiceOrder.ts).
// Each group says how many things are in it and the dates that matter, the
// oldest overdue, the next due and the last done there, and nothing else.
// There is no score for a room: how clean a kitchen is was never the
// question, only what is coming up in it.

export type UpkeepPlace = { code: string; label: string; builtIn: boolean };

export const BUILT_IN_PLACES: readonly UpkeepPlace[] = [
  { code: 'kitchen', label: 'Kitchen', builtIn: true },
  { code: 'bathroom', label: 'Bathroom', builtIn: true },
  { code: 'bedroom', label: 'Bedroom', builtIn: true },
  { code: 'living', label: 'Living room', builtIn: true },
  { code: 'laundry', label: 'Laundry', builtIn: true },
  { code: 'outside', label: 'Outside', builtIn: true },
  { code: 'garage', label: 'Garage', builtIn: true },
  { code: 'car', label: 'Car', builtIn: true },
  { code: 'office', label: 'Office', builtIn: true },
  { code: 'wholeHome', label: 'The whole home', builtIn: true },
];

/** A place the person named, as stored in upkeep_places. */
export type CustomUpkeepPlace = { id: string; name: string };

/** Every place to choose from, built-in and named, alphabetical together. */
export function placeChoices(custom: readonly CustomUpkeepPlace[]): UpkeepPlace[] {
  return sortByLabel([
    ...BUILT_IN_PLACES,
    ...custom.map((entry) => ({ code: entry.id, label: entry.name, builtIn: false })),
  ]);
}

export const NO_PLACE_LABEL = 'No place given';

/**
 * What a place is called. A code this phone does not know (a place named on
 * somebody else's phone, carried here on a household chore) reads by the
 * name that came with it.
 */
export function placeLabel(code: string | null, custom: readonly CustomUpkeepPlace[], carriedName?: string | null): string {
  if (!code) return NO_PLACE_LABEL;
  const known = placeChoices(custom).find((entry) => entry.code === code);
  if (known) return known.label;
  return carriedName?.trim() || NO_PLACE_LABEL;
}

export type PlaceGroup = {
  /** The place code, or null for No place given. */
  code: string | null;
  label: string;
  entries: UpkeepItem[];
  /** Active ones only, which is what the dates below are read from. */
  activeCount: number;
  overdueCount: number;
  /** The date the longest-overdue thing was due. */
  oldestOverdueOn: string | null;
  /** The soonest date something here is due, not yet passed. */
  nextDueOn: string | null;
  /** The last time anything here was done. */
  lastDoneOn: string | null;
};

/**
 * Upkeep by place, alphabetical, with No place given at the end.
 *
 * Grouped by the label rather than the code, so a household chore whose
 * place was named on another phone lands with this phone's place of the
 * same name rather than beside it.
 */
export function groupByPlace(items: readonly UpkeepItem[], custom: readonly CustomUpkeepPlace[], today: string): PlaceGroup[] {
  const byLabel = new Map<string, PlaceGroup>();
  for (const item of items) {
    const label = placeLabel(item.place, custom, item.placeName);
    const key = label.trim().toLowerCase();
    let group = byLabel.get(key);
    if (!group) {
      group = {
        code: label === NO_PLACE_LABEL ? null : item.place,
        label,
        entries: [],
        activeCount: 0,
        overdueCount: 0,
        oldestOverdueOn: null,
        nextDueOn: null,
        lastDoneOn: null,
      };
      byLabel.set(key, group);
    }
    group.entries.push(item);
    if (!item.active) continue;
    group.activeCount += 1;
    const standing = upkeepStanding(item, today);
    if (standing.overdue && standing.dueOn) {
      group.overdueCount += 1;
      if (!group.oldestOverdueOn || standing.dueOn < group.oldestOverdueOn) group.oldestOverdueOn = standing.dueOn;
    } else if (standing.dueOn && (!group.nextDueOn || standing.dueOn < group.nextDueOn)) {
      group.nextDueOn = standing.dueOn;
    }
    if (item.lastDoneOn && (!group.lastDoneOn || item.lastDoneOn > group.lastDoneOn)) group.lastDoneOn = item.lastDoneOn;
  }
  const groups = [...byLabel.values()];
  const named = sortByLabel(groups.filter((group) => group.code !== null));
  const unplaced = groups.filter((group) => group.code === null);
  return [...named, ...unplaced];
}

/** One line under a place's heading: a count and dates, never a verdict. */
export function describePlaceGroup(group: PlaceGroup): string {
  const parts: string[] = [];
  const count = group.activeCount;
  parts.push(`${count} ${count === 1 ? 'thing' : 'things'}`);
  if (group.overdueCount > 0) {
    parts.push(
      group.overdueCount === 1
        ? `1 overdue, due ${group.oldestOverdueOn}`
        : `${group.overdueCount} overdue, the longest due ${group.oldestOverdueOn}`,
    );
  }
  if (group.nextDueOn) parts.push(`next due ${group.nextDueOn}`);
  if (group.lastDoneOn) parts.push(`last done here ${group.lastDoneOn}`);
  const paused = group.entries.length - group.activeCount;
  if (paused > 0) parts.push(`${paused} paused`);
  return parts.join(', ') + '.';
}

/**
 * What removing a place the person named would do: how many things are in
 * it, which have to be moved to another place first. Nothing is ever left
 * pointing at a place that is gone, and nothing falls back to No place given
 * by itself.
 */
export function placeRemovalNote(name: string, inUse: number): string {
  if (inUse === 0) return `Nothing is in ${name}, so it can go straight away.`;
  return `${inUse} ${inUse === 1 ? 'thing is' : 'things are'} in ${name}. Pick where ${inUse === 1 ? 'it goes' : 'they go'}, and ${name} is removed once ${inUse === 1 ? 'it has' : 'they have'} moved.`;
}

// --- Chores that are assigned, or taken -------------------------------------
//
// An upkeep item can be for anyone, or for one person. Assigning is the
// person saying who does it; taking is somebody saying "that one is mine".
// Both write the same two columns. Neither is a promise the app keeps score
// of: nobody is counted, compared or reminded that somebody else did more.
//
// WHY THE CODE HAS A KIND ON THE FRONT. A chore can reach another phone
// (lib/peerRelationships.ts, the household chores area), and there "me" means
// somebody else. So nobody is stored as "me":
//
//   person:<id>   a person by the id their own devices share (app_meta
//                 upkeep_person_id), which is how taking one is written
//   key:<base64>  a connected person, by the public key they paired with
//   family:<id>   somebody on this person's family roster, who may have no
//                 phone at all
//
// A code this phone cannot place reads by the name carried with it.

export type AssigneeContext = {
  /** This person's id, shared across their own devices. */
  myPersonId: string | null;
  /** This device's public key, for a chore assigned to this person by a connection. */
  myKey: string | null;
  connections: readonly { key: string; name: string }[];
  family: readonly { id: string; name: string }[];
};

export type Assignee =
  | { kind: 'anyone' }
  | { kind: 'me' }
  | { kind: 'person'; name: string };

export function resolveAssignee(item: Pick<UpkeepItem, 'assignedTo' | 'assignedName'>, context: AssigneeContext): Assignee {
  const code = item.assignedTo;
  if (!code) return { kind: 'anyone' };
  const fallback: Assignee = { kind: 'person', name: item.assignedName?.trim() || 'somebody else' };
  if (code.startsWith('person:')) {
    return context.myPersonId && code === `person:${context.myPersonId}` ? { kind: 'me' } : fallback;
  }
  if (code.startsWith('key:')) {
    const key = code.slice(4);
    if (context.myKey && key === context.myKey) return { kind: 'me' };
    const connection = context.connections.find((entry) => entry.key === key);
    return connection ? { kind: 'person', name: connection.name } : fallback;
  }
  if (code.startsWith('family:')) {
    const member = context.family.find((entry) => `family:${entry.id}` === code);
    return member ? { kind: 'person', name: member.name } : fallback;
  }
  return fallback;
}

export function describeAssignee(assignee: Assignee): string {
  if (assignee.kind === 'anyone') return 'Anyone can take this';
  if (assignee.kind === 'me') return 'Yours';
  return `${assignee.name} is doing this`;
}

/** Whether the item is this person's to do: theirs, or anybody's. */
export function isForMe(item: Pick<UpkeepItem, 'assignedTo' | 'assignedName'>, context: AssigneeContext): boolean {
  const who = resolveAssignee(item, context);
  return who.kind === 'anyone' || who.kind === 'me';
}

// --- J7: I have 20 minutes ---------------------------------------------------
//
// What is due or coming due that fits the time somebody has, soonest first.
// Only things with a time written down can be offered: a chore with no
// minutes is left out and counted, never guessed at, since a guess is how
// twenty minutes becomes an hour. Things somebody else is doing are left out
// too, and counted, so the list is never quietly shorter than it looks.

export const TIME_CHOICES: readonly number[] = [5, 10, 15, 20, 30, 45, 60, 90, 120];

export type TimeFit = {
  /** Each fits on its own, soonest due first. */
  fits: UpkeepStanding[];
  /** How many of the first ones fit together, in that order, and their total. */
  togetherCount: number;
  togetherMinutes: number;
  /** Due or coming due, but no time written down. */
  noMinutes: UpkeepStanding[];
  /** Due or coming due, but longer than the time given. */
  tooLong: number;
  /** Due or coming due, but somebody else is doing it. */
  someoneElse: number;
};

export function fitInMinutes(
  items: readonly UpkeepItem[],
  minutes: number,
  today: string,
  context: AssigneeContext,
): TimeFit {
  const fits: UpkeepStanding[] = [];
  const noMinutes: UpkeepStanding[] = [];
  let tooLong = 0;
  let someoneElse = 0;
  for (const item of items) {
    if (!item.active) continue;
    const standing = upkeepStanding(item, today);
    if (!standing.overdue && !standing.dueSoon) continue;
    if (!isForMe(item, context)) {
      someoneElse += 1;
      continue;
    }
    if (item.minutes == null || item.minutes <= 0) {
      noMinutes.push(standing);
      continue;
    }
    if (item.minutes > minutes) {
      tooLong += 1;
      continue;
    }
    fits.push(standing);
  }
  fits.sort((a, b) => (a.daysAway ?? 0) - (b.daysAway ?? 0) || compareLabels(a.item.name, b.item.name));
  noMinutes.sort((a, b) => (a.daysAway ?? 0) - (b.daysAway ?? 0));
  let togetherCount = 0;
  let togetherMinutes = 0;
  for (const standing of fits) {
    const next = togetherMinutes + (standing.item.minutes ?? 0);
    if (next > minutes) break;
    togetherMinutes = next;
    togetherCount += 1;
  }
  return { fits, togetherCount, togetherMinutes, noMinutes, tooLong, someoneElse };
}

export function describeTimeFit(fit: TimeFit, minutes: number): string {
  const parts: string[] = [];
  if (fit.fits.length === 0) {
    parts.push(`Nothing due or coming due fits in ${minutes} minutes.`);
  } else if (fit.togetherCount === fit.fits.length) {
    parts.push(
      fit.fits.length === 1
        ? `1 thing fits, taking ${fit.togetherMinutes} minutes.`
        : `${fit.fits.length} things fit, and all of them together take ${fit.togetherMinutes} minutes.`,
    );
  } else {
    parts.push(
      `${fit.fits.length} things fit on their own. The first ${fit.togetherCount} together take ${fit.togetherMinutes} minutes.`,
    );
  }
  if (fit.noMinutes.length > 0) {
    parts.push(
      `${fit.noMinutes.length} ${fit.noMinutes.length === 1 ? 'has' : 'have'} no time written down, so ${fit.noMinutes.length === 1 ? 'it is' : 'they are'} left out rather than guessed at. Add how long ${fit.noMinutes.length === 1 ? 'it takes' : 'each takes'} and ${fit.noMinutes.length === 1 ? 'it' : 'they'} can be offered.`,
    );
  }
  if (fit.tooLong > 0) parts.push(`${fit.tooLong} ${fit.tooLong === 1 ? 'takes' : 'take'} longer than ${minutes} minutes.`);
  if (fit.someoneElse > 0) parts.push(`${fit.someoneElse} ${fit.someoneElse === 1 ? 'is' : 'are'} being done by somebody else.`);
  return parts.join(' ');
}
