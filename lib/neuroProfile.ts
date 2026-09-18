// Autism, ADHD and dyslexia, listed the way food allergies are listed, and
// what each one switches on.
//
// 2026-09-17, direct instruction: "The two, Autism, and ADHD can be listed
// in the profile the same way that food alergies are listed, and even
// Dyslexia could be listed there too, and they then trigger the additional
// settings for them and the app can use those as triggers to turn on the
// specific things for them... Not as tracked conditions."
//
// WHY NOT A TRACKED CONDITION. The 19 tracked conditions drive food
// scoring: declaring one changes what the app says about an ingredient,
// because there is cited evidence tying that food to that condition. None
// of the three here works that way. The evidence does not support diet
// treating autism, ADHD or dyslexia, and wiring them into the scoring
// engine would say that it does. See lib/digest/neurodivergence.ts for the
// research this rests on, including the trials that came back null.
//
// So what these three DO is turn on settings. Every one of those settings
// already exists and is already reachable by hand in Profile. Nothing here
// is gated behind a declaration, nothing is hidden from anybody who does
// not declare, and nothing is switched on without being shown first. What
// the declaration saves is the finding: somebody who needs a quieter Home,
// a place to throw a thought, and a reminder that speaks before a thing
// rather than at it would otherwise have to know all three settings
// existed and find them in three different places.
//
// The list is deliberately short. These three were asked for by name.
// Anything added later has to clear the same bar: it changes which
// SETTINGS make sense, not which foods are safe.
//
// PURE. No database, no React, no colours, no runtime imports, so
// scripts/test_neuroProfile.js can run it in plain node.

// The reminder kinds these can switch on. Type-only, so this file stays
// import-free at runtime; tsc still keeps the two in step, so a renamed
// kind over in reminderPreferences breaks here rather than silently
// pointing at nothing.
import type { ReminderKindKey } from './reminderPreferences';

export type NeuroProfileKey = 'autism' | 'adhd' | 'dyslexia';

// Listed in the order the pills are shown.
export const ALL_NEURO_PROFILE_KEYS: NeuroProfileKey[] = ['autism', 'adhd', 'dyslexia'];

export const NEURO_PROFILE_LABELS: Record<NeuroProfileKey, string> = {
  autism: 'Autism',
  adhd: 'ADHD',
  dyslexia: 'Dyslexia',
};

// One line each, shown under the pills once the pill is on. Says what the
// app will do about it, not what the thing is. Nobody needs this app to
// define their diagnosis for them.
export const NEURO_PROFILE_CAPTIONS: Record<NeuroProfileKey, string> = {
  autism:
    'Turns on a quieter Home, somewhere to put a thought the moment you have it, and reminders for routines.',
  adhd: 'Turns on somewhere to put a thought the moment you have it, and reminders for the things that carry a date: routines, bills, upkeep, benefits, and anything you noted down.',
  dyslexia:
    'Turns on roomier line spacing, and points you at the text size setting your phone already has.',
};

// ------------------------------------------------------------ the settings

export type NeuroSupportKey =
  | 'lowStimulation'
  | 'captureInbox'
  | 'roomyText'
  | 'routineReminders'
  | 'noteReminders'
  | 'datedReminders';

export const ALL_NEURO_SUPPORT_KEYS: NeuroSupportKey[] = [
  'captureInbox',
  'routineReminders',
  'noteReminders',
  'datedReminders',
  'lowStimulation',
  'roomyText',
];

export const NEURO_SUPPORT_LABELS: Record<NeuroSupportKey, string> = {
  lowStimulation: 'Low Stimulation',
  captureInbox: 'Somewhere to put a thought',
  roomyText: 'Roomier line spacing',
  routineReminders: 'Reminders for routines',
  noteReminders: 'Reminders for things you noted down',
  datedReminders: 'Reminders for bills, upkeep and benefits',
};

// What each one does, in the words somebody would use standing in their
// kitchen. Shown on the sheet before anything is turned on, because a
// setting that changes itself without saying so is worse than a setting
// nobody found.
export const NEURO_SUPPORT_DETAILS: Record<NeuroSupportKey, string> = {
  lowStimulation:
    'Folds Home down to the plain rows. Every band closes, the backgrounds go quiet, and what is left is a short list instead of a wall. You can open any band again whenever you want one.',
  captureInbox:
    'Puts one control on Home that takes a thought by voice or by typing, with no category to pick at the time. It leaves your head straight away, and sorting it is a later job.',
  roomyText:
    'Opens the lines up so the words stop running together. This is separate from text size, which your phone already sets for every app including this one.',
  routineReminders:
    'A routine you have given a time to will speak at that time, and tapping it opens the walk at the first step.',
  noteReminders: 'Anything you threw into the inbox and gave a day to will come back on that day.',
  datedReminders:
    'Bills, upkeep and renewals, and work benefits that expire will speak before the date rather than on it.',
};

// Which reminder kind each reminder support switches on. A support that is
// not a reminder is absent, not empty, so a typo in the wiring shows up as
// undefined rather than as a silent no-op.
export const NEURO_SUPPORT_REMINDER_KINDS: Partial<Record<NeuroSupportKey, ReminderKindKey[]>> = {
  routineReminders: ['routine'],
  noteReminders: ['reminder'],
  datedReminders: ['bill', 'upkeep', 'benefit'],
};

// The mapping the whole file exists for.
//
// Autism gets Low Stimulation because the sensory load of a busy screen is
// the part that costs; ADHD does not, because folding everything shut also
// hides the thing somebody was about to do. Both get the capture inbox and
// routine reminders. ADHD additionally gets everything carrying a date,
// which is the load it is named for. Dyslexia gets the text work and
// nothing else, because it changes how words sit on a page and not what
// anybody needs reminding of.
const SUPPORTS_BY_PROFILE: Record<NeuroProfileKey, NeuroSupportKey[]> = {
  autism: ['lowStimulation', 'captureInbox', 'routineReminders'],
  adhd: ['captureInbox', 'routineReminders', 'noteReminders', 'datedReminders'],
  dyslexia: ['roomyText'],
};

// The union of what the listed profiles ask for, in ALL_NEURO_SUPPORT_KEYS
// order, so the list reads the same way every time regardless of which pill
// was tapped first.
export function supportsFor(keys: NeuroProfileKey[]): NeuroSupportKey[] {
  const wanted = new Set<NeuroSupportKey>();
  for (const key of keys) {
    for (const support of SUPPORTS_BY_PROFILE[key] ?? []) wanted.add(support);
  }
  return ALL_NEURO_SUPPORT_KEYS.filter((support) => wanted.has(support));
}

// Which of the listed profiles asked for a given setting. Used to say
// "Autism and ADHD both ask for this" rather than attributing a shared
// setting to whichever one happened to be tapped last.
export function profilesAsking(
  support: NeuroSupportKey,
  keys: NeuroProfileKey[],
): NeuroProfileKey[] {
  return ALL_NEURO_PROFILE_KEYS.filter(
    (key) => keys.includes(key) && (SUPPORTS_BY_PROFILE[key] ?? []).includes(support),
  );
}

// What stops being asked for when one profile is taken off the list.
//
// Not everything that profile asks for: with Autism still listed, taking
// ADHD off leaves the capture inbox and the routine reminders alone, since
// Autism is still asking for both, and names only the two reminder kinds
// ADHD was the only one asking for.
export function supportsDroppedBy(
  key: NeuroProfileKey,
  keys: NeuroProfileKey[],
): NeuroSupportKey[] {
  if (!keys.includes(key)) return [];
  const kept = supportsFor(keys.filter((listed) => listed !== key));
  return supportsFor(keys).filter((support) => !kept.includes(support));
}

// One setting is dropped from the list above without being switched off.
//
// The capture inbox is on Home for everybody, listed or not: absence means
// visible, so listing ADHD usually changes nothing about it and only turns
// it back on for somebody who had hidden the row by hand. Switching it off
// on the way out would not be putting a setting back where it was, it would
// be taking away something the app gives anyone. It goes off in Profile,
// under the Home rows, the same as any other row.
export const NEURO_SUPPORTS_UNLISTING_LEAVES_ON: NeuroSupportKey[] = ['captureInbox'];

// 2026-09-18, reported directly: "Right now, the dyslexia function doesn't
// seem to actually get turned off when the pill is deselected."
//
// It did not, by an earlier decision recorded in app/profile.tsx that taking
// a listing off should switch nothing back off. The reasoning was that a
// setting somebody has been living with should not vanish because a label
// changed. What that missed is that the pill is where the setting was turned
// on, so it reads as the switch, and a switch that only works one way is
// broken whatever the reasoning behind it. The answer is symmetry: the way
// out asks the same question the way in did, names exactly what it will
// change, and takes "leave them on" for an answer.
export function supportsTurnedOffBy(
  key: NeuroProfileKey,
  keys: NeuroProfileKey[],
): NeuroSupportKey[] {
  return supportsDroppedBy(key, keys).filter(
    (support) => !NEURO_SUPPORTS_UNLISTING_LEAVES_ON.includes(support),
  );
}

function joinNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// "Autism", "Autism and ADHD", "Autism, ADHD and Dyslexia".
export function describeProfiles(keys: NeuroProfileKey[]): string {
  return joinNames(
    ALL_NEURO_PROFILE_KEYS.filter((key) => keys.includes(key)).map(
      (key) => NEURO_PROFILE_LABELS[key],
    ),
  );
}

export function isNeuroProfileKey(value: string): value is NeuroProfileKey {
  return (ALL_NEURO_PROFILE_KEYS as string[]).includes(value);
}

// Anything stored by a previous version of the app that this one no longer
// knows about is dropped rather than carried as a broken key, and the order
// is normalized, so two devices holding the same three never disagree.
export function normalizeNeuroProfileKeys(raw: string[]): NeuroProfileKey[] {
  const seen = new Set(raw.map((value) => value.trim().toLowerCase()));
  return ALL_NEURO_PROFILE_KEYS.filter((key) => seen.has(key));
}

// ------------------------------------------------------------ the wording

export const NEURO_PROFILE_HEADING = 'Autism, ADHD and dyslexia';

export const NEURO_PROFILE_INTRO =
  'Listing one here changes no food score and adds no tracked condition. It switches on the settings that go with it, all of which you can also find and set by hand.';

export const NEURO_PROFILE_NOT_A_CONDITION =
  'These are not tracked conditions and the app does not treat them as ones. Food scoring, meal plans and advisories work the same whether or not anything here is listed. Diet does not treat autism, ADHD or dyslexia, and the app will not tell you otherwise.';

export const NEURO_PROFILE_STAYS_HERE =
  'Nothing here leaves the phone, and nothing here is shared with anybody you have connected to.';

// Shown once the settings have been turned on, so the change is stated
// rather than discovered.
export function describeTurnedOn(supports: NeuroSupportKey[]): string {
  if (supports.length === 0) return '';
  const list = joinNames(supports.map((support) => NEURO_SUPPORT_LABELS[support]));
  return `Turned on: ${list}. Each one can be switched back off wherever it lives.`;
}

// The same sentence on the way out.
export function describeTurnedOff(supports: NeuroSupportKey[]): string {
  if (supports.length === 0) return '';
  const list = joinNames(supports.map((support) => NEURO_SUPPORT_LABELS[support]));
  return `Turned off: ${list}. Each one can be switched back on wherever it lives, or by listing this again.`;
}

// What switching each one off actually does, for the sheet shown before it
// happens. The capture inbox has no line because unlisting never switches it
// off (see NEURO_SUPPORTS_UNLISTING_LEAVES_ON).
export const NEURO_SUPPORT_OFF_DETAILS: Partial<Record<NeuroSupportKey, string>> = {
  lowStimulation:
    'Home comes back to its full self. Anything you folded shut stays folded until you open it, the same as any other day.',
  roomyText:
    'Line spacing goes back to Normal. Your phone\'s text size is untouched, because this app never set it.',
  routineReminders:
    'A routine with a time on it stops speaking. The routine itself, and its time, stay exactly where they are.',
  noteReminders:
    'Anything in the inbox with a day on it stops coming back on that day. Nothing in the inbox is deleted.',
  datedReminders:
    'Bills, upkeep, renewals and expiring benefits stop speaking before their date. The dates themselves stay.',
};

// Shown on the way out when the capture inbox was one of the things this
// profile was asking for, so its absence from the list is stated rather than
// left looking like an oversight.
export const NEURO_PROFILE_UNLIST_NOTE =
  'Somewhere to put a thought stays where it is. That one is on Home for everybody, so taking it away here would be removing something the app gives anyone rather than putting a setting back. It hides from the Home rows in Profile if you want it gone.';
