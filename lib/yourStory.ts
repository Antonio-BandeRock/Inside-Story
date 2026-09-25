// Your Story: a guided way through the app, laid out as the sections of a
// person's paper.
//
// 2026-09-24, direct request: "a way to make sure the user knows the most
// efficient way for the app to do for them what we are intending for it to
// do... we need to have them available from the home screen where they are
// linked to the thing they should do. But if it disappears from that list,
// there is enough to the app that it might not be easy to remember how to
// get back there again." The design conversation settled on a book that is
// also a newspaper: the whole of somebody's life in sections, each one
// filled in from what they record. Notion holds the Decision row.
//
// WHAT HOLDS, and a later session will be tempted to soften:
//
// 1. An item is done when the RECORD exists, never when a box is ticked.
//    Nothing here stores "done"; lib/yourStoryDb.ts looks for the record
//    each time. your_story_items only remembers the day an item was first
//    seen done (so a removed record can say when it had been there) and
//    any item the person set aside.
// 2. No step numbers, no percentages, no progress bars, no praise, no
//    blame. scripts/test_your_story.js sweeps every sentence here for
//    both. A waiting item says how close it is in the person's
//    counts ("2 of the 7 days"), which is a statement about what the
//    analysis needs and never about the person.
// 3. Nothing promises the app will find causes. The Inside Story items
//    say what each view can show once there is enough to show it.
// 4. The parts of life (beats, in code; the word never reaches the screen)
//    are a CLOSED list of nine. This is a written exception to the
//    open-lists rule: a beat is a section of this guide with items written
//    for it, and a beat somebody named would be a section with nothing in
//    it. Beats shape Your Story only and never hide a tab or a feature.
// 5. The Home card can be folded and moved and can NOT be turned off, the
//    second written exception (see isHomeSectionVisible in
//    lib/visualPreferences.ts). Folded, it is one line naming the next
//    thing, which is also the "one clear next thing on Home" CLAUDE.md
//    open step 28 asked for.
//
// PURE. No database, no React, no runtime imports, so
// scripts/test_your_story.js runs it in plain node.

export type BeatKey = 'health' | 'food' | 'movement' | 'home' | 'garden' | 'money' | 'routines' | 'work' | 'family';

export const ALL_BEATS: BeatKey[] = ['health', 'food', 'movement', 'home', 'garden', 'money', 'routines', 'work', 'family'];

export const BEAT_LABELS: Record<BeatKey, string> = {
  health: 'Health',
  food: 'Food',
  movement: 'Movement',
  home: 'Home',
  garden: 'Garden',
  money: 'Money',
  routines: 'Routines',
  work: 'Work',
  family: 'Family',
};

export const BEAT_CAPTIONS: Record<BeatKey, string> = {
  health: 'Conditions, medicines, how you feel',
  food: 'What you eat and drink',
  movement: 'Walks, exercise, steps',
  home: 'Upkeep and where things are kept',
  garden: 'What you grow and harvest',
  money: 'Bills and spending',
  routines: 'Mornings, evenings, the things you check',
  work: 'Benefits and how the week went',
  family: 'The people you look after',
};

export const BEATS_QUESTION = 'What parts of your life do you want Inside Story to follow?';
export const BEATS_NOTE =
  'This only shapes this guide. Every part of the app stays open to you whatever you choose, and you can change it any time.';

export function normalizeBeatKeys(values: readonly string[]): BeatKey[] {
  const wanted = new Set(values);
  return ALL_BEATS.filter((key) => wanted.has(key));
}

export function beatListSentence(beats: readonly BeatKey[]): string {
  const labels = normalizeBeatKeys(beats).map((key) => BEAT_LABELS[key]);
  if (labels.length === 0) return 'Nothing chosen yet.';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

// SECTIONS, in the order the paper runs. The first six are the first
// edition; the five after them are one short section per extra part of
// life, and appear only when that part is chosen.

export type SectionKey =
  | 'frontPage'
  | 'archive'
  | 'onTheRecord'
  | 'calendar'
  | 'dailyReport'
  | 'insideStory'
  | 'gardenBeat'
  | 'moneyBeat'
  | 'homeBeat'
  | 'workBeat'
  | 'familyBeat';

export type SectionDef = {
  key: SectionKey;
  name: string;
  caption: string;
  // Front Page, The Archive and The Inside Story show whatever was chosen.
  alwaysShown: boolean;
};

export const SECTIONS: SectionDef[] = [
  { key: 'frontPage', name: 'Front Page', caption: 'What Matters to You', alwaysShown: true },
  { key: 'archive', name: 'The Archive', caption: 'Keeping your records safe', alwaysShown: true },
  { key: 'onTheRecord', name: 'On the Record', caption: 'What you take, written down once', alwaysShown: false },
  { key: 'calendar', name: 'The Calendar', caption: 'What your days hold', alwaysShown: false },
  { key: 'dailyReport', name: 'The Daily Report', caption: 'What you eat, drink and feel', alwaysShown: false },
  { key: 'insideStory', name: 'The Inside Story', caption: 'What your records start to show', alwaysShown: true },
  { key: 'gardenBeat', name: 'The Garden Page', caption: 'What you grow', alwaysShown: false },
  { key: 'moneyBeat', name: 'The Money Page', caption: 'What comes in and goes out', alwaysShown: false },
  { key: 'homeBeat', name: 'The Home Page', caption: 'Keeping the house running', alwaysShown: false },
  { key: 'workBeat', name: 'The Work Page', caption: 'How work is going', alwaysShown: false },
  { key: 'familyBeat', name: 'The Family Page', caption: 'The people you look after', alwaysShown: false },
];

export const FIRST_EDITION: SectionKey[] = ['frontPage', 'archive', 'onTheRecord', 'calendar', 'dailyReport', 'insideStory'];

export const INSIDE_STORY_EMPTY_LINE =
  'What shows here depends on the parts of your life you choose on the Front Page.';

// WHERE AN ITEM TAKES YOU. A route is a tab and lens; home is a card on
// Home itself, opened in place; quickLog is one of Home's quick-log forms.

export type StoryDestination =
  | { kind: 'route'; pathname: string; params?: Record<string, string> }
  | { kind: 'home'; section: string }
  | { kind: 'quickLog'; form: 'exercise' }
  | { kind: 'beats' };

export type ItemKind = 'needed' | 'optional' | 'waiting';

export type YourStoryItemKey =
  | 'beats'
  | 'aboutYou'
  | 'conditions'
  | 'allergies'
  | 'eatingStyle'
  | 'neuro'
  | 'backup'
  | 'secondDevice'
  | 'meds'
  | 'emergency'
  | 'capture'
  | 'routine'
  | 'didIDoIt'
  | 'daysUntil'
  | 'meal'
  | 'checkin'
  | 'water'
  | 'exercise'
  | 'patterns'
  | 'trends'
  | 'movementTrend'
  | 'keepingUp'
  | 'whatItCosts'
  | 'report'
  | 'gardenArea'
  | 'planting'
  | 'harvest'
  | 'bills'
  | 'spending'
  | 'upkeep'
  | 'kitchen'
  | 'workCheckin'
  | 'workBenefits'
  | 'familyMember'
  | 'familyConditions';

export type ItemDef = {
  key: YourStoryItemKey;
  section: SectionKey;
  kind: ItemKind;
  // Shown only when one of these parts of life is chosen; empty means
  // always.
  beats: BeatKey[];
  // What to do, as a plain sentence.
  todo: string;
  // What is on record once it is done.
  done: string;
  // Shown when the person taps for why this matters.
  why: string;
  destination: StoryDestination;
  // Only a needed item can be set aside, and only one where "this does not
  // apply to me" is a truthful answer.
  setAside?: { label: string; line: string };
  // Some records are meant to be cleared: a note in the capture inbox is
  // sorted and deleted, which is the point of it. Once seen, these stay
  // done rather than reopening every time the inbox is emptied.
  holdsOnceSeen?: boolean;
  // Waiting items: what the count is of, and how many it needs.
  need?: number;
  progress?: (have: number, need: number) => string;
};

const lifeLens = (lens: string): StoryDestination => ({ kind: 'route', pathname: '/life', params: { openLifeLens: lens } });
const scheduleLens = (lens: string): StoryDestination => ({ kind: 'route', pathname: '/schedule', params: { openScheduleLens: lens } });
const trendsLens = (lens: string): StoryDestination => ({ kind: 'route', pathname: '/trends', params: { openTrendsLens: lens } });
const gardenLens = (lens: string): StoryDestination => ({ kind: 'route', pathname: '/garden', params: { openGardenLens: lens } });
const profile: StoryDestination = { kind: 'route', pathname: '/profile' };

export const ITEMS: ItemDef[] = [
  // Front Page: What Matters to You.
  {
    key: 'beats',
    section: 'frontPage',
    kind: 'needed',
    beats: [],
    todo: 'Choose the parts of your life you want Inside Story to follow.',
    done: 'Following your chosen parts of life.',
    why: 'This guide is built from what you choose here, so it only asks about the parts of life you want followed. Nothing in the app is hidden by what you leave out.',
    destination: { kind: 'beats' },
  },
  {
    key: 'aboutYou',
    section: 'frontPage',
    kind: 'needed',
    beats: ['health', 'food'],
    todo: 'Add your birth date and sex in Profile.',
    done: 'Your birth date and sex are on record.',
    why: 'Recommended amounts of most nutrients differ by age and sex. Without them the app uses general adult figures, which may not fit you.',
    destination: profile,
    setAside: {
      label: 'Leave these out',
      line: 'Set aside. The app uses general adult figures until these are added.',
    },
  },
  {
    key: 'conditions',
    section: 'frontPage',
    kind: 'optional',
    beats: ['health'],
    todo: 'If you have any of the 19 conditions this app follows, choose them in Profile.',
    done: 'Your conditions are chosen.',
    why: 'A condition changes what the app says about each food and which reading comes first. Choosing none hides nothing.',
    destination: profile,
  },
  {
    key: 'allergies',
    section: 'frontPage',
    kind: 'optional',
    beats: ['food'],
    todo: 'List any food allergies in Profile.',
    done: 'Your food allergies are listed.',
    why: 'Food lookups and meal plans mark what contains a listed allergen. The marking depends on how foods are labelled, so it helps you check and is never a promise a food is safe.',
    destination: profile,
  },
  {
    key: 'eatingStyle',
    section: 'frontPage',
    kind: 'optional',
    beats: ['food'],
    todo: 'Choose an eating style in Profile, if you follow one.',
    done: 'Your eating style is chosen.',
    why: 'Meal plans and recipe suggestions keep to the eating style you choose, such as vegetarian or paleo.',
    destination: profile,
  },
  {
    key: 'neuro',
    section: 'frontPage',
    kind: 'optional',
    beats: ['routines'],
    todo: 'If autism, ADHD or dyslexia is part of your life, add it in Profile.',
    done: 'The settings made for how you work are listed in Profile.',
    why: 'It switches on settings like a quieter Home and reminders that speak before a thing rather than at it. It never changes what the app says about food.',
    destination: profile,
  },

  // The Archive.
  {
    key: 'backup',
    section: 'archive',
    kind: 'needed',
    beats: [],
    todo: 'Save a backup, or turn on automatic saving to a shared folder, in Profile under Backup & Restore.',
    done: 'Your records are backed up.',
    why: 'Everything you record lives on this device. If it is lost or reset, a backup is the only way back, and nobody else holds a copy.',
    destination: profile,
  },
  {
    key: 'secondDevice',
    section: 'archive',
    kind: 'optional',
    beats: [],
    todo: 'Open Inside Story on a second device, such as a computer, and turn on automatic saving there with the same password.',
    done: 'Your records have arrived from your other device.',
    why: 'Two devices saving to the same shared folder keep each other up to date, and each one is a copy of the other.',
    destination: profile,
  },

  // On the Record.
  {
    key: 'meds',
    section: 'onTheRecord',
    kind: 'needed',
    beats: ['health'],
    todo: 'Add the medicines and supplements you take in Life, under My Meds.',
    done: 'Your medicines and supplements are on record.',
    why: 'Timing advice, the dose schedule and your doctor report all start from this list.',
    destination: lifeLens('myMeds'),
    setAside: {
      label: 'I take nothing',
      line: 'Set aside. You said you take nothing, and you can add something any time.',
    },
  },
  {
    key: 'emergency',
    section: 'onTheRecord',
    kind: 'optional',
    beats: ['health'],
    todo: 'Fill in the emergency card in Life, under Emergency.',
    done: 'Your emergency card has something on it.',
    why: 'One place with what somebody helping you would need to know, ready in a hurry.',
    destination: lifeLens('emergency'),
  },

  // The Calendar.
  {
    key: 'capture',
    section: 'calendar',
    kind: 'needed',
    beats: ['routines', 'home', 'work', 'family'],
    todo: 'Write down one thing that is on your mind.',
    done: 'The capture inbox is in use.',
    why: 'Anything written down here no longer needs remembering. You can sort it later, or never.',
    destination: { kind: 'route', pathname: '/capture' },
    holdsOnceSeen: true,
  },
  {
    key: 'routine',
    section: 'calendar',
    kind: 'needed',
    beats: ['routines'],
    todo: 'Set up one routine, such as getting ready in the morning, in Life under Routines.',
    done: 'A routine is set up.',
    why: 'A routine holds its steps in order so you do not have to, and marks where you left off.',
    destination: lifeLens('routines'),
  },
  {
    key: 'didIDoIt',
    section: 'calendar',
    kind: 'needed',
    beats: ['routines', 'home'],
    todo: 'Add one thing you tend to wonder whether you did, like locking the door, in Life under Did I Do It.',
    done: 'Did I Do It has something to mark.',
    why: 'One tap when you do it, and the answer is there later when you wonder.',
    destination: lifeLens('didIDoIt'),
  },
  {
    key: 'daysUntil',
    section: 'calendar',
    kind: 'optional',
    beats: ['routines', 'home', 'work', 'family'],
    todo: 'Count down to something coming up, in Life under Days Until.',
    done: 'A countdown is on record.',
    why: 'A date you are waiting for, counted in days, with a reminder on the day it lands.',
    destination: lifeLens('daysUntil'),
  },

  // The Daily Report.
  {
    key: 'meal',
    section: 'dailyReport',
    kind: 'needed',
    beats: ['health', 'food'],
    todo: 'Log a meal, in Schedules under Meals.',
    done: 'Meals are being logged.',
    why: 'Every meal logged is something the app can later line up against how you felt and what you needed.',
    destination: scheduleLens('meals'),
  },
  {
    key: 'checkin',
    section: 'dailyReport',
    kind: 'needed',
    beats: ['health'],
    todo: 'Note how you feel today, on the check-in card here on Home.',
    done: 'Check-ins are on record.',
    why: 'How you felt is the other half of every pattern. Without check-ins, meals have nothing to be compared with.',
    destination: { kind: 'home', section: 'todaysCheckin' },
  },
  {
    key: 'water',
    section: 'dailyReport',
    kind: 'optional',
    beats: ['health', 'food'],
    todo: 'Log a drink, in Schedules under Hydration.',
    done: 'Drinks are being logged.',
    why: 'Water counts toward the day as much as food does, and some advice depends on it.',
    destination: scheduleLens('hydration'),
  },
  {
    key: 'exercise',
    section: 'dailyReport',
    kind: 'needed',
    beats: ['movement'],
    todo: 'Log some movement. A walk counts.',
    done: 'Movement is being logged.',
    why: 'Movement shows up on Trends beside everything else, and counts in the check-ins that follow it.',
    destination: { kind: 'quickLog', form: 'exercise' },
  },

  // The Inside Story. These wait on time rather than on an action, and
  // each one says how close it is.
  {
    key: 'patterns',
    section: 'insideStory',
    kind: 'waiting',
    beats: ['health'],
    todo: 'Pattern Finder has something to show once 2 flares or reactions have meals logged in the day before them.',
    done: 'Pattern Finder has something to show.',
    why: 'It lines up what was eaten before the times you felt worse and says how that compares with any ordinary day. It shows what tends to come before, which is worth watching, and never what caused it.',
    destination: trendsLens('patterns'),
    need: 2,
    progress: (have, need) => `${have} of the ${need} so far.`,
  },
  {
    key: 'trends',
    section: 'insideStory',
    kind: 'waiting',
    beats: ['health', 'food'],
    todo: 'Trends has a week to show once meals are logged on 7 different days.',
    done: 'Trends has a week to show.',
    why: 'Nutrients, variety and what you eat, drawn across the days you logged. A day with nothing logged shows as a gap, never as a day of eating nothing.',
    destination: trendsLens('nutrients'),
    need: 7,
    progress: (have, need) => `Meals are logged on ${have} of the ${need} days so far.`,
  },
  {
    key: 'movementTrend',
    section: 'insideStory',
    kind: 'waiting',
    beats: ['movement'],
    todo: 'Trends shows your movement once it is logged on 7 different days.',
    done: 'Trends has your movement to show.',
    why: 'Movement across the weeks, beside how you felt on the same days.',
    destination: trendsLens('movement'),
    need: 7,
    progress: (have, need) => `Movement is logged on ${have} of the ${need} days so far.`,
  },
  {
    key: 'keepingUp',
    section: 'insideStory',
    kind: 'waiting',
    beats: ['routines', 'home'],
    todo: 'Keeping Up on Trends shows how things are going once something is marked on 7 different days.',
    done: 'Keeping Up has something to show.',
    why: 'Routines run, things marked done and upkeep kept, drawn across the weeks. It counts what happened and scores nobody.',
    destination: trendsLens('keepingUp'),
    need: 7,
    progress: (have, need) => `Something is marked on ${have} of the ${need} days so far.`,
  },
  {
    key: 'whatItCosts',
    section: 'insideStory',
    kind: 'waiting',
    beats: ['money'],
    todo: 'What It Costs on Trends compares one month with another once two months have spending recorded.',
    done: 'What It Costs has two months to compare.',
    why: 'Spending by month, from what you recorded against a day. It never guesses at a month nobody entered.',
    destination: trendsLens('cost'),
    need: 2,
    progress: (have, need) => `${have} of the ${need} months so far.`,
  },
  {
    key: 'report',
    section: 'insideStory',
    kind: 'optional',
    beats: ['health'],
    todo: 'Make a report to take to your next appointment, on Reports.',
    done: 'A report has been shared.',
    why: 'One document with what you have logged, laid out for a clinician, with every section saying where its figures came from.',
    destination: { kind: 'route', pathname: '/reports', params: { openReportDays: '30' } },
    holdsOnceSeen: true,
  },

  // One short section per extra part of life.
  {
    key: 'gardenArea',
    section: 'gardenBeat',
    kind: 'needed',
    beats: ['garden'],
    todo: 'Add a garden area, even a pot on a windowsill, in Garden under Plots & Plantings.',
    done: 'A garden area is on record.',
    why: 'Everything in Garden hangs off an area: what is planted, what it cost, what it grew.',
    destination: gardenLens('plotsAndPlantings'),
  },
  {
    key: 'planting',
    section: 'gardenBeat',
    kind: 'needed',
    beats: ['garden'],
    todo: 'Record something growing in it.',
    done: 'Something growing is on record.',
    why: 'A planting carries its dates, so tasks, countdowns and harvests can follow from it.',
    destination: gardenLens('plotsAndPlantings'),
  },
  {
    key: 'harvest',
    section: 'gardenBeat',
    kind: 'optional',
    beats: ['garden'],
    todo: 'Log a harvest when one comes, in Garden under Harvest Log.',
    done: 'Harvests are being logged.',
    why: 'What the garden grew shows on Trends under Garden Yield, and can be taken off what you have on hand when a meal uses it.',
    destination: gardenLens('harvestLog'),
  },
  {
    key: 'bills',
    section: 'moneyBeat',
    kind: 'needed',
    beats: ['money'],
    todo: 'Add a bill that comes every month, in Life under Finances.',
    done: 'A monthly bill is on record.',
    why: 'Bills that come round on their own are the easiest things to forget until they are due.',
    destination: lifeLens('finances'),
  },
  {
    key: 'spending',
    section: 'moneyBeat',
    kind: 'needed',
    beats: ['money'],
    todo: 'Record something you spent, in Life under Finances.',
    done: 'Spending is being recorded.',
    why: 'Only money recorded against a day is counted, so What It Costs draws from these.',
    destination: lifeLens('finances'),
  },
  {
    key: 'upkeep',
    section: 'homeBeat',
    kind: 'needed',
    beats: ['home'],
    todo: 'Add one thing around the house that needs doing now and then, like changing a filter, in Life under Upkeep.',
    done: 'Upkeep is on record.',
    why: 'Each one comes round on a schedule you set, so it is there when it is due and out of your head until then.',
    destination: lifeLens('upkeep'),
  },
  {
    key: 'kitchen',
    section: 'homeBeat',
    kind: 'optional',
    beats: ['home'],
    todo: 'Note where something in the kitchen is kept, in Life under Kitchen.',
    done: 'Kitchen places are on record.',
    why: 'Where Did I Put It on Home searches these, so the answer is there when you are looking.',
    destination: lifeLens('kitchen'),
  },
  {
    key: 'workCheckin',
    section: 'workBeat',
    kind: 'needed',
    beats: ['work'],
    todo: 'Note how the week went at work, in Life under Work.',
    done: 'Work check-ins are on record.',
    why: 'A week at a time, so how work has been going is there to look back on.',
    destination: lifeLens('work'),
  },
  {
    key: 'workBenefits',
    section: 'workBeat',
    kind: 'optional',
    beats: ['work'],
    todo: 'Add a benefit your work offers, in Life under Work.',
    done: 'Work benefits are on record.',
    why: 'Benefits are easy to forget until the year they run out.',
    destination: lifeLens('work'),
  },
  {
    key: 'familyMember',
    section: 'familyBeat',
    kind: 'needed',
    beats: ['family'],
    todo: 'Add someone in your family, in Life under Conditions.',
    done: 'Your family is on record.',
    why: 'Each person can be included in the meal plan, so what gets planned suits everybody at the table.',
    destination: lifeLens('conditions'),
  },
  {
    key: 'familyConditions',
    section: 'familyBeat',
    kind: 'optional',
    beats: ['family'],
    todo: 'Note any conditions a family member has, if you want meal plans to account for them.',
    done: 'Family conditions are on record.',
    why: 'A member whose conditions are listed, and who is included in the meal plan, shapes what gets planned.',
    destination: lifeLens('conditions'),
  },
];

export const ITEM_BY_KEY: Record<YourStoryItemKey, ItemDef> = Object.fromEntries(
  ITEMS.map((item) => [item.key, item]),
) as Record<YourStoryItemKey, ItemDef>;

// DATES. Records store their times three ways: a plain date, SQLite's
// datetime('now') (UTC, a space, no zone), and ISO strings. The local-day
// rule applies: a UTC time is turned into this device's calendar day
// through a Date, and a plain date is already a day.

export function localDayOf(stamp: string | null | undefined): string | null {
  if (!stamp) return null;
  const trimmed = stamp.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  let date: Date;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(trimmed)) {
    date = new Date(trimmed.replace(' ', 'T') + 'Z');
  } else {
    date = new Date(trimmed);
  }
  if (Number.isNaN(date.getTime())) {
    return /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? trimmed.slice(0, 10) : null;
  }
  return dayKey(date);
}

export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function daysBetween(fromDay: string, toDay: string): number {
  const [fy, fm, fd] = fromDay.split('-').map(Number);
  const [ty, tm, td] = toDay.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function storyDate(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

// A done item carries a dateline, the way a story in a paper does.
export function datelineFor(day: string): string {
  return `Since ${storyDate(day)}`;
}

// THE ARCHIVE, which is per device and has its own reasons for coming
// undone.

export const BACKUP_FRESH_DAYS = 30;

export type ArchiveFacts = {
  syncOn: boolean;
  // Local days.
  syncSavedOn: string | null;
  syncLoadedOn: string | null;
  lastBackupOn: string | null;
};

export function backupDoneOn(archive: ArchiveFacts, today: string): string | null {
  if (archive.syncOn) return archive.syncSavedOn ?? today;
  if (archive.lastBackupOn && daysBetween(archive.lastBackupOn, today) <= BACKUP_FRESH_DAYS) return archive.lastBackupOn;
  return null;
}

export function backupDoneSentence(archive: ArchiveFacts): string {
  return archive.syncOn
    ? 'Saving automatically to your shared folder.'
    : 'A backup was saved on this device.';
}

export function backupReopenLine(archive: ArchiveFacts, seenOn: string | null, today: string): string {
  if (archive.lastBackupOn) {
    const age = daysBetween(archive.lastBackupOn, today);
    return `The last backup on this device was saved on ${storyDate(archive.lastBackupOn)}, ${age} days ago, and automatic saving is off.`;
  }
  if (seenOn) return `Your records were backed up on ${storyDate(seenOn)}. Automatic saving is off on this device now, and no recent backup is here.`;
  return '';
}

export function secondDeviceDoneOn(archive: ArchiveFacts): string | null {
  return archive.syncOn ? archive.syncLoadedOn : null;
}

// WHAT THE DATABASE LAYER HANDS IN.

export type YourStoryFacts = {
  today: string;
  beats: BeatKey[];
  // Local day the record first existed, or null when there is none.
  doneOn: Partial<Record<YourStoryItemKey, string | null>>;
  // Waiting items: how many of what they need.
  counts: Partial<Record<YourStoryItemKey, number>>;
  // From your_story_items.
  seenOn: Partial<Record<YourStoryItemKey, string>>;
  setAsideOn: Partial<Record<YourStoryItemKey, string>>;
  archive: ArchiveFacts;
};

export type ItemState = 'done' | 'open' | 'reopened' | 'setAside';

export type ItemView = {
  def: ItemDef;
  state: ItemState;
  // The sentence shown: what to do while open, what is on record once done.
  sentence: string;
  dateline: string | null;
  // A reopened item's reason, a waiting item's count, or a set-aside note.
  note: string | null;
  // The local day this item is done on, for the database layer to record.
  doneOn: string | null;
};

export function itemApplies(def: ItemDef, beats: readonly BeatKey[]): boolean {
  if (def.beats.length === 0) return true;
  return def.beats.some((beat) => beats.includes(beat));
}

export function evaluateItem(def: ItemDef, facts: YourStoryFacts): ItemView {
  const seen = facts.seenOn[def.key] ?? null;
  let doneOn: string | null;
  if (def.key === 'backup') doneOn = backupDoneOn(facts.archive, facts.today);
  else if (def.key === 'secondDevice') doneOn = secondDeviceDoneOn(facts.archive);
  else if (def.kind === 'waiting') {
    const have = facts.counts[def.key] ?? 0;
    doneOn = have >= (def.need ?? 1) ? seen ?? facts.today : null;
  } else doneOn = facts.doneOn[def.key] ?? null;
  if (!doneOn && def.holdsOnceSeen && seen) doneOn = seen;

  if (doneOn) {
    const sentence =
      def.key === 'backup'
        ? backupDoneSentence(facts.archive)
        : def.key === 'beats'
          ? `Following ${beatListSentence(facts.beats)}.`
          : def.done;
    const dateline = def.kind === 'waiting' ? `Ready since ${storyDate(doneOn)}` : datelineFor(doneOn);
    return { def, state: 'done', sentence, dateline, note: null, doneOn };
  }

  const setAside = facts.setAsideOn[def.key];
  if (setAside && def.setAside) {
    return { def, state: 'setAside', sentence: def.todo, dateline: null, note: def.setAside.line, doneOn: null };
  }

  const waitingNote =
    def.kind === 'waiting' && def.progress ? def.progress(facts.counts[def.key] ?? 0, def.need ?? 1) : null;

  if (seen) {
    let reason: string;
    if (def.key === 'backup') reason = backupReopenLine(facts.archive, seen, facts.today);
    else if (def.key === 'secondDevice') reason = `Your other device was last heard from around ${storyDate(seen)}. Automatic saving is off on this device now.`;
    else if (def.kind === 'waiting') reason = `This had enough to show on ${storyDate(seen)}, and some of what it drew on is no longer there.`;
    else reason = `This was on record on ${storyDate(seen)}, and the record is no longer there.`;
    const note = waitingNote ? `${reason} ${waitingNote}` : reason;
    return { def, state: 'reopened', sentence: def.todo, dateline: null, note, doneOn: null };
  }

  return { def, state: 'open', sentence: def.todo, dateline: null, note: waitingNote, doneOn: null };
}

export type SectionView = {
  def: SectionDef;
  items: ItemView[];
  // Needed and waiting items still open. Optional ones never hold a
  // section open.
  openItems: ItemView[];
  finished: boolean;
  // The latest day a needed item in it was done, for the one-line summary.
  finishedOn: string | null;
};

export type YourStoryView = {
  heading: string;
  sections: SectionView[];
  current: SectionKey | null;
  settled: boolean;
  nextItem: ItemView | null;
  // Every item the database layer should remember as seen done today.
  newlySeen: { key: YourStoryItemKey; day: string }[];
};

export const HEADING_BEGINS = 'Your Story Begins Here';
export const HEADING_TAKING_SHAPE = 'Your first edition is taking shape';
export const HEADING_CONTINUES = 'Your Story Continues';

function isOpen(item: ItemView): boolean {
  return (item.state === 'open' || item.state === 'reopened') && item.def.kind !== 'optional';
}

export function buildYourStory(facts: YourStoryFacts): YourStoryView {
  const beats = normalizeBeatKeys(facts.beats);
  const scoped = { ...facts, beats };
  const sections: SectionView[] = [];
  const newlySeen: { key: YourStoryItemKey; day: string }[] = [];

  for (const def of SECTIONS) {
    const items = ITEMS.filter((item) => item.section === def.key && itemApplies(item, beats)).map((item) =>
      evaluateItem(item, scoped),
    );
    if (items.length === 0 && !def.alwaysShown) continue;
    // Before anything is chosen, only the Front Page question and the
    // Archive make sense to ask.
    if (beats.length === 0 && def.key !== 'frontPage' && def.key !== 'archive' && def.key !== 'insideStory') continue;
    for (const item of items) {
      if (item.doneOn && facts.seenOn[item.def.key] == null) newlySeen.push({ key: item.def.key, day: item.doneOn });
    }
    const openItems = items.filter(isOpen);
    const doneDays = items
      .filter((item) => item.def.kind !== 'optional' && item.doneOn)
      .map((item) => item.doneOn as string)
      .sort();
    sections.push({
      def,
      items,
      openItems,
      finished: openItems.length === 0,
      finishedOn: doneDays.length > 0 ? doneDays[doneDays.length - 1] : null,
    });
  }

  // The current section is the first one with something to DO. Only when
  // nothing is left to do does a section that is only waiting take over,
  // so a new part of life chosen later is not stuck behind a count.
  const firstActionable = sections.find((section) =>
    section.openItems.some((item) => item.def.kind === 'needed'),
  );
  const firstWaiting = sections.find((section) => section.openItems.length > 0);
  const currentSection = firstActionable ?? firstWaiting ?? null;
  const settled = currentSection == null;

  const insideStory = sections.find((section) => section.def.key === 'insideStory');
  const insideStoryShows = insideStory?.items.some((item) => item.def.kind === 'waiting' && item.state === 'done') ?? false;
  const anythingDone = sections.some((section) => section.items.some((item) => item.state === 'done'));
  const heading =
    settled || insideStoryShows ? HEADING_CONTINUES : beats.length === 0 && !anythingDone ? HEADING_BEGINS : HEADING_TAKING_SHAPE;

  const nextItem = currentSection
    ? currentSection.openItems.find((item) => item.def.kind === 'needed') ?? currentSection.openItems[0] ?? null
    : null;

  return { heading, sections, current: currentSection?.def.key ?? null, settled, nextItem, newlySeen };
}

// The one line the folded Home card shows.
export function nextLine(view: YourStoryView): string {
  if (!view.nextItem) return HEADING_CONTINUES;
  if (view.nextItem.def.kind === 'waiting') {
    return view.nextItem.note ? `${view.nextItem.def.todo} ${view.nextItem.note}` : view.nextItem.def.todo;
  }
  return `Next: ${view.nextItem.sentence}`;
}

// The one line a section takes once it is behind the current one.
export function sectionSummary(section: SectionView): string {
  const waiting = section.openItems.find((item) => item.def.kind === 'waiting');
  if (waiting) return waiting.note ?? waiting.def.todo;
  if (section.finishedOn) return `Everything here is on record. ${datelineFor(section.finishedOn)}.`;
  if (section.items.length === 0 && section.def.key === 'insideStory') return INSIDE_STORY_EMPTY_LINE;
  return 'Everything here is on record.';
}

export const OPTIONAL_LABEL = 'If it applies to you';
export const WAITING_LABEL = 'Fills in with time';
export const WHY_LABEL = 'Why this matters';
export const BRING_BACK_LABEL = 'Bring this back';

// WHERE EACH TAB FITS, for the line at the foot of every help sheet.

export const TAB_STORY_LINES: Record<string, string> = {
  '/': 'Home holds the Your Story card, which names the next thing to set up and links straight to it.',
  '/food': 'Food is where meals are built and looked up, which feeds The Daily Report.',
  '/schedule': 'Schedules holds The Daily Report: meals, drinks and doses, each on the clock.',
  '/log': 'Signals is where flares, reactions and movement are logged, the other half of The Daily Report.',
  '/insights': 'Insights reads what is on record and says what it means for the foods and nutrients you look at.',
  '/trends': 'Trends is The Inside Story: what your records show once there are enough of them.',
  '/reports': 'Reports turns The Inside Story into a document to take to an appointment.',
  '/garden': 'Garden is The Garden Page, for anybody who chose Garden on the Front Page.',
  '/life': 'Life holds On the Record, The Calendar and the pages for Money, Home, Work and Family.',
};

export function tabStoryLine(tabPath: string | null | undefined, view: YourStoryView | null): string | null {
  if (!tabPath) return null;
  const base = TAB_STORY_LINES[tabPath];
  if (!base) return null;
  if (!view) return base;
  const here = view.sections
    .flatMap((section) => section.items)
    .find(
      (item) =>
        (item.state === 'open' || item.state === 'reopened') &&
        item.def.kind === 'needed' &&
        item.def.destination.kind === 'route' &&
        item.def.destination.pathname === tabPath,
    );
  return here ? `${base} Next here: ${here.sentence}` : base;
}

// EMPTY STATES elsewhere name the missing item and link to it.
export function missingItemLine(key: YourStoryItemKey, count: number): string {
  const def = ITEM_BY_KEY[key];
  if (def.kind === 'waiting' && def.progress) return `${def.todo} ${def.progress(count, def.need ?? 1)}`;
  return def.todo;
}
