// What may cross between two people, and which way it travels.
//
// Direct instruction, 2026-09-22, after the device-to-device merge shipped
// in 1.0.49.3: "now that we have that kind of relationship between the user
// devices, we need to program the same thing into the partner relationship,
// the children relationships, and the caregiver relationship. Although I
// know not all of these have all be created, the communication flow as per
// what is being done between the user's devices needs to be the same kind
// of process that happens between partners, and their children, and where
// applicable, their care giver."
//
// THE ONE PLACE THIS DIFFERS FROM TWO DEVICES, AND IT IS THE WHOLE DESIGN.
// Two devices belonging to one person hold one database between them, so
// lib/snapshotSync.ts works by DENYLIST: everything travels except the few
// rows a device keeps to itself (DEVICE_LOCAL_META_KEYS, DEVICE_LOCAL_TABLES).
// Two people hold two databases, and almost nothing belongs to both of them.
// So this module is the inverse, an ALLOWLIST: nothing crosses unless the
// relationship names it, and a table nobody listed here cannot travel however
// a caller is written. tablesThatCross() is that list, and it is the one
// function in this file worth reading first.
//
// THREE WAYS A PERSON CAN HOLD SOMETHING, and only one of them merges:
//
//   shared          Both people may change it and there is one of it between
//                   them. A household shopping list is the case: either of
//                   you can be the one who goes. This is the situation two
//                   devices are always in, so it takes the same treatment,
//                   a three-way merge record by record with nothing thrown
//                   away (lib/peerMerge.ts).
//   theirs          One person owns it and the other keeps a copy. Their
//                   meal plan, their condition list. Their latest send IS
//                   their current state, so a copy replaces rather than
//                   merges, and a day they took out has to be able to
//                   disappear here too.
//   onTheirBehalf   Somebody may change another person's records for them:
//                   a parent for a child, a caregiver for the adult they
//                   help. Both sides may write, so this merges exactly like
//                   shared, with one difference that has not been built:
//                   the records belong to the other person and must land
//                   somewhere keyed to them, never mixed into the tables
//                   holding this person's health.
//
// WHY THE UNBUILT AREAS ARE WRITTEN DOWN HERE ANYWAY. The instruction says
// plainly that not all of these relationships exist yet. What exists now is
// the communication flow, and it is the same flow for all four roles. An
// area with ready: false is the vocabulary without the plumbing:
// tablesThatCross() returns nothing for it, so no caller can send it by
// accident, and the day it gets somewhere to land the flag flips and the
// rest of this already works.
import type { ConnectionRole, ShareGrants, ShareScope } from './partners';

/** A subject that can cross between two people. */
export type PeerAreaCode =
  | 'recipes'
  | 'meals'
  | 'mealCalendar'
  | 'shopping'
  | 'chores'
  | 'conditions'
  | 'doses'
  | 'schedule'
  | 'meds'
  | 'symptoms';

/**
 * One table an area covers, and the columns that stay on this device.
 *
 * A column stays home when it means nothing on the other phone (a local
 * row number) or when it is the person writing to themselves (a note they
 * put on a line). Columns are stripped on the way out and put back from
 * this device on the way in, so a merge can never blank something the
 * other side was never sent.
 *
 * `where` narrows a table to the rows that may cross, for a table that holds
 * both a person's private rows and the ones they share. Only those rows are
 * read to send, and only those rows are replaced on arrival, so a private
 * row is never sent and never touched by what comes back. It is SQL written
 * here and nowhere else, never built from anything a caller passes.
 */
export type PeerTable = { table: string; keepsHome: readonly string[]; where?: string };

export type PeerArea = {
  code: PeerAreaCode;
  label: string;
  /** Plain words for what crosses, for a screen to show. */
  what: string;
  /** The only tables this area may ever carry. */
  tables: readonly PeerTable[];
  /**
   * Whether the receiving side has somewhere to put this today. False
   * means the area is described here and nothing travels for it.
   */
  ready: boolean;
  /** What it is waiting on, when it is not ready. */
  waitingOn?: string;
  /**
   * The permission switch that governs this area, when it is not named
   * after one. The household meal calendar answers to Meals, since it is
   * meals a person is letting somebody else see.
   */
  grantedBy?: ShareScope;
};

export const PEER_AREAS: readonly PeerArea[] = [
  {
    code: 'recipes',
    label: 'Recipes',
    what: 'A dish one of you sends the other, when one of you sends it. Nothing happens on its own.',
    tables: [],
    ready: true,
  },
  {
    code: 'meals',
    label: 'Meals',
    what: 'What is planned for each day. Their plan stays theirs and you keep a copy of it.',
    // Carried as a copy through lib/partnerSync.ts rather than as tables:
    // meal_plan_slots is what THIS person scheduled, and a partner's plan
    // lands in partner_meal_plan_slots, which is a record of something
    // somebody else owns and never becomes a meal on this schedule.
    tables: [],
    ready: true,
  },
  {
    code: 'mealCalendar',
    label: 'The household meal calendar',
    what: 'Meals planned for the whole household, which either of you can add, change or remove. Nothing on it goes on anybody\u2019s own schedule until they choose to put it there.',
    // H9, 2026-09-27. The schedule area for meals only: a table that holds
    // household meals and nothing else, since schedule_items holds
    // appointments and doses and points at logged meals. What each person
    // copied onto their own day is recorded per device and stays home.
    tables: [{ table: 'household_meal_calendar', keepsHome: ['my_schedule_item_id', 'my_copied_at'] }],
    ready: true,
    grantedBy: 'meals',
  },
  {
    code: 'shopping',
    label: 'Shopping lists',
    what: 'One list between you, so either of you can be the one who actually goes. Both of you can add to it and tick things off.',
    tables: [
      { table: 'grocery_lists', keepsHome: [] },
      {
        table: 'grocery_list_items',
        // A note on a line is somebody writing to themselves, and a
        // scanned product is a row number that means nothing on another
        // phone.
        keepsHome: ['note', 'scanned_product_id'],
      },
    ],
    ready: true,
  },
  {
    code: 'chores',
    label: 'Household chores',
    what: 'The upkeep you choose to share with the household, and who is doing each one. Either of you can take one, hand one over, or mark it done. Upkeep you have not shared stays yours.',
    // J8, 2026-09-29. Only rows marked household cross, and the doings go
    // with the chore they belong to so either side sees when it was last
    // done. A chore stops crossing the moment somebody unshares it.
    tables: [
      { table: 'upkeep_items', keepsHome: [], where: 'household = 1' },
      {
        table: 'upkeep_doings',
        keepsHome: [],
        where: 'item_id IN (SELECT id FROM upkeep_items WHERE household = 1)',
      },
    ],
    // No permission switch of its own: nothing crosses until somebody marks
    // a chore as the household's, and that mark is the permission, one
    // chore at a time.
    ready: true,
  },
  {
    code: 'conditions',
    label: 'Which conditions they track',
    what: 'The names only, so meals can be planned around both of you at once. Never symptoms, labs, healing stage or notes.',
    tables: [],
    ready: true,
  },
  {
    code: 'doses',
    label: 'When a dose is not marked',
    what: 'The name of each med on their schedule, when it was due, and whether they marked it taken or skipped, so your phone can let you know when one has not been marked. Never the amount or their notes.',
    // A16, 2026-09-30. Carried as a copy through lib/partnerSync.ts, like
    // meals: their latest send is their state, and it lands in
    // peer_dose_watch, which is a record of somebody else's day and never
    // a dose on this schedule. Sent only after a yes given on the phone
    // whose doses they are (dose_watch_consent, lib/peerDosesDb.ts).
    tables: [],
    ready: true,
  },
  {
    code: 'schedule',
    label: 'Their schedule',
    what: 'Appointments and doses on their day, which you can add to on their behalf.',
    // Upkeep left this area on 2026-09-29: household chores cross through
    // the chores area, a row at a time, and a table may belong to one area.
    tables: [{ table: 'schedule_items', keepsHome: [] }],
    ready: false,
    waitingOn:
      'somewhere to keep another person’s schedule. It has to sit apart from yours, the way a partner’s meal plan already does, so that one query can never put their appointment on your day.',
  },
  {
    code: 'meds',
    label: 'Their medicines',
    what: 'What they take and when, which you can record on their behalf.',
    tables: [
      { table: 'treatments', keepsHome: [] },
      { table: 'treatment_nutrients', keepsHome: [] },
    ],
    ready: false,
    waitingOn: 'somewhere to keep another person’s medicines, apart from your own.',
  },
  {
    code: 'symptoms',
    label: 'How they are doing',
    what: 'Symptoms and check-ins you record on their behalf when they cannot.',
    tables: [
      { table: 'symptom_assessments', keepsHome: [] },
      { table: 'symptom_assessment_responses', keepsHome: [] },
      { table: 'wellbeing_checkins', keepsHome: [] },
    ],
    ready: false,
    waitingOn: 'somewhere to keep another person’s health records, apart from your own.',
  },
];

export function areaFor(code: PeerAreaCode): PeerArea {
  const found = PEER_AREAS.find((area) => area.code === code);
  if (!found) throw new Error(`No peer area called ${code}`);
  return found;
}

/**
 * The tables this app holds somebody's health in.
 *
 * Here to be asserted against rather than consulted at runtime: no
 * relationship short of one where somebody acts on another person's behalf
 * may carry any of these, which is the line the tier model draws and the
 * one a test holds on every role and every combination of permissions.
 */
export const PERSONAL_HEALTH_TABLES: readonly string[] = [
  'symptom_assessments',
  'symptom_assessment_responses',
  'wellbeing_checkins',
  'lab_results',
  'health_records',
  'body_measurements',
  'user_condition_stages',
  'user_conditions',
  'personal_rules',
  'treatments',
  'treatment_nutrients',
  'meals',
  'meal_items',
  'meal_components',
  'food_trials',
  'trial_steps',
  'trial_series',
  'trial_series_items',
  'checkin_tags',
  'checkin_body_regions',
  'daily_step_counts',
  'exercise_logs',
  'therapy_sessions',
  'user_neuro_profile',
  'emergency_profile',
];

/** How a person holds an area in a given relationship. */
export type PeerHold = 'shared' | 'theirs' | 'onTheirBehalf';

export type Relationship = {
  role: ConnectionRole;
  label: string;
  what: string;
  /** Areas both people change, which merge record by record. */
  shared: readonly PeerAreaCode[];
  /** Areas the other person owns, which you keep a copy of. */
  theirs: readonly PeerAreaCode[];
  /** Areas you may change for them. These merge too. */
  onTheirBehalf: readonly PeerAreaCode[];
  /** Areas a permission switch governs. The rest follow from the role. */
  granted: readonly ShareScope[];
  /** Whether this app can set up this kind of link today. */
  linkable: boolean;
  /** What that is waiting on, when it cannot. */
  waitingOn?: string;
};

export const RELATIONSHIPS: readonly Relationship[] = [
  {
    role: 'recipe',
    label: 'Recipes only',
    what: 'You can send each other a dish. Nothing else is shared and nothing happens on its own.',
    shared: [],
    theirs: [],
    onTheirBehalf: [],
    granted: [],
    linkable: true,
  },
  {
    role: 'partner',
    label: 'Partner',
    what: 'You plan meals together. You both see the same days, each with what those meals mean for your conditions, and you share one shopping list, one household meal calendar and the household chores.',
    shared: ['shopping', 'mealCalendar', 'chores'],
    theirs: ['meals', 'conditions', 'doses'],
    onTheirBehalf: [],
    granted: ['meals', 'shopping', 'conditions', 'doses'],
    linkable: true,
  },
  {
    role: 'child',
    label: 'Your child',
    what: 'You keep their side of things going and they see what you choose to let them see. Their meals, medicines and how they are doing stay theirs, recorded by you.',
    shared: ['shopping', 'mealCalendar', 'chores'],
    theirs: ['meals', 'conditions', 'doses'],
    onTheirBehalf: ['schedule', 'meds', 'symptoms'],
    granted: ['meals', 'shopping', 'conditions', 'doses'],
    linkable: false,
    waitingOn:
      'a way to set up the link itself. The talking between the two phones works the same way it does between your own devices; what is missing is the setting-up, where you say which parts they can reach and at what pace.',
  },
  {
    role: 'caregiver',
    label: 'Someone who helps you',
    what: 'They can record meals, medicines, how you are doing and what is on your day, on your behalf. They never see anything you have not given them.',
    shared: ['shopping', 'mealCalendar', 'chores'],
    theirs: ['meals', 'conditions', 'doses'],
    onTheirBehalf: ['schedule', 'meds', 'symptoms'],
    granted: ['meals', 'shopping', 'conditions', 'doses'],
    linkable: false,
    // The yes, or the statement of acting for someone who cannot, exists
    // now for doses (A16, dose_watch_consent). What is left is setting up
    // the link itself and somewhere for their records to land.
    waitingOn:
      'a way to set up the link itself. The step where the person being cared for says yes, or somebody states plainly that they are acting for someone who cannot, is built for letting you know when a dose is not marked, and the same step will open everything else here.',
  },
];

export function relationshipFor(role: ConnectionRole): Relationship {
  const found = RELATIONSHIPS.find((entry) => entry.role === role);
  if (!found) throw new Error(`No relationship for the role ${role}`);
  return found;
}

/** How this relationship holds that area, or null when it does not carry it at all. */
export function holdOn(role: ConnectionRole, area: PeerAreaCode): PeerHold | null {
  const relationship = relationshipFor(role);
  if (relationship.shared.includes(area)) return 'shared';
  if (relationship.theirs.includes(area)) return 'theirs';
  if (relationship.onTheirBehalf.includes(area)) return 'onTheirBehalf';
  return null;
}

/** Whether a permission switch has turned this area off. Areas nobody votes on are on. */
function granted(relationship: Relationship, area: PeerAreaCode, grants: ShareGrants): boolean {
  const scope = areaFor(area).grantedBy ?? (area as ShareScope);
  if (!relationship.granted.includes(scope)) return true;
  return grants[scope] === true;
}

/**
 * The areas that merge record by record in this relationship: the ones both
 * people change, and the ones somebody changes for somebody else.
 *
 * An area that has nowhere to land is left out here rather than filtered
 * later, so there is one answer to what merges and not two that can drift.
 */
export function areasThatMerge(role: ConnectionRole, grants: ShareGrants): PeerAreaCode[] {
  const relationship = relationshipFor(role);
  return [...relationship.shared, ...relationship.onTheirBehalf].filter(
    (area) => areaFor(area).ready && granted(relationship, area, grants),
  );
}

/** The areas the other person owns and this device keeps a copy of. */
export function areasTheyOwn(role: ConnectionRole, grants: ShareGrants): PeerAreaCode[] {
  const relationship = relationshipFor(role);
  return relationship.theirs.filter((area) => areaFor(area).ready && granted(relationship, area, grants));
}

/**
 * THE ALLOWLIST. The only tables allowed to cross to this person, with the
 * columns that stay here.
 *
 * Everything that sends or receives asks this first. A table that is not in
 * the answer cannot travel, whatever a caller passes, which is the property
 * worth holding: a denylist here would leak a health domain the moment
 * somebody added a table and forgot to think about it.
 */
export function tablesThatCross(role: ConnectionRole, grants: ShareGrants): PeerTable[] {
  const tables: PeerTable[] = [];
  for (const code of areasThatMerge(role, grants)) {
    for (const table of areaFor(code).tables) tables.push(table);
  }
  return tables;
}

/** The allowlist as names only, which is what a merge needs. */
export function tableNamesThatCross(role: ConnectionRole, grants: ShareGrants): string[] {
  return tablesThatCross(role, grants).map((table) => table.table);
}

/** Which columns stay on this device, per table, for a given relationship. */
export function columnsThatStayHome(role: ConnectionRole, grants: ShareGrants): Record<string, readonly string[]> {
  const home: Record<string, readonly string[]> = {};
  for (const table of tablesThatCross(role, grants)) {
    if (table.keepsHome.length > 0) home[table.table] = table.keepsHome;
  }
  return home;
}

/**
 * Whether this kind of link keeps anything in step on its own.
 *
 * Asked by everything that sends and everything that receives, in place of
 * comparing a role against 'partner'. A recipe link answers no: it carries
 * a dish when somebody presses send and does nothing between times. The
 * other three answer yes, which is the whole of what the 2026-09-22
 * instruction asked for, since the talking is the same for all of them
 * whether or not the setting-up has been built.
 *
 * Deliberately about the ROLE rather than the grants. Somebody who has
 * turned everything off is still in a relationship that talks, and should
 * hear that nothing is turned on rather than that they are not a partner.
 */
export function talksAutomatically(role: ConnectionRole): boolean {
  const relationship = relationshipFor(role);
  return (
    relationship.shared.length > 0 ||
    relationship.theirs.length > 0 ||
    relationship.onTheirBehalf.length > 0
  );
}

/** Whether one named table may cross in this relationship. */
export function mayCross(role: ConnectionRole, grants: ShareGrants, table: string): boolean {
  return tableNamesThatCross(role, grants).includes(table);
}

/**
 * How you are linked to somebody, as it would be said about them.
 *
 * Kept here beside the labels rather than written out on a screen, so a
 * log line, a notice and a Connections row all say the same thing about
 * the same link.
 */
export function howYouAreLinked(role: ConnectionRole): string {
  switch (role) {
    case 'partner':
      return 'your partner';
    case 'child':
      return 'your child';
    case 'caregiver':
      return 'someone who helps you';
    default:
      return 'someone you send dishes to';
  }
}

/** What merges with this person, in plain words, or what is stopping it. */
export function describeWhatMerges(role: ConnectionRole, grants: ShareGrants, name: string): string {
  const merging = areasThatMerge(role, grants);
  if (merging.length === 0) {
    const relationship = relationshipFor(role);
    if (relationship.shared.length === 0 && relationship.onTheirBehalf.length === 0) {
      return `Nothing is kept in step with ${name}. You can still send each other a dish whenever you want to.`;
    }
    return `Nothing is being kept in step with ${name} at the moment, because you have turned it all off.`;
  }
  const labels = merging.map((area) => areaFor(area).label.toLowerCase());
  const list = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
  return `You and ${name} keep ${list} in step. Whatever either of you changes, both of you end up with, and nothing either of you did is thrown away.`;
}

/** What a relationship is still waiting on, for a screen that says so plainly. */
export function whatIsWaiting(role: ConnectionRole): string[] {
  const relationship = relationshipFor(role);
  const waiting: string[] = [];
  if (!relationship.linkable && relationship.waitingOn) waiting.push(relationship.waitingOn);
  for (const code of [...relationship.shared, ...relationship.onTheirBehalf]) {
    const area = areaFor(code);
    if (!area.ready && area.waitingOn) waiting.push(`${area.label} is waiting on ${area.waitingOn}`);
  }
  return waiting;
}
