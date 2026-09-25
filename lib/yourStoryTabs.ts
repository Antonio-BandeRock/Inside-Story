// Your Story by tab, 1.0.52.3. Direct instruction, 2026-09-25: "Each of the
// Tabs should be listed and available for where they might want to get
// started with their use of the app, but the guidance needs to show when
// something else needs to be done first before they can get out of it what
// they might be looking at. If they want to see information about the foods
// they eat, there are things that need to happen so there is data to pull
// from."
//
// The newspaper sections in lib/yourStory.ts say what to set up; this says
// the same thing from where the person is standing: which tab, what it gives
// back, and the one thing that has to happen first. It reads the item views
// buildYourStory already made (view.allItems) and decides nothing about when
// an item is done, so the two can never disagree.
//
// The order of TAB_GUIDES is the recommended order and means something:
// the tabs where records go in come first (Life, Schedules, Signals, Food,
// Garden), then the tabs that give back what those records hold (Insights,
// Trends, Reports), each one naming the tab its missing record goes into.
// Any tab can still be started from; "Start here" only marks the first one
// with something to do.
//
// Pure, imports nothing at runtime but lib/yourStory.ts, and covered by
// scripts/test_your_story.js.
import {
  itemApplies,
  type BeatKey,
  type ItemView,
  type StoryDestination,
  type YourStoryItemKey,
  type YourStoryView,
} from './yourStory';

export type TabGroup = 'goesIn' | 'givesBack';

export const TAB_GROUP_HEADINGS: Record<TabGroup, string> = {
  goesIn: 'Where your records go in',
  givesBack: 'What your records give back',
};

export const TAB_GROUP_CAPTIONS: Record<TabGroup, string> = {
  goesIn: 'These work from the first minute. What you put in here is what the tabs below read.',
  givesBack: 'These read what you put in above, so each one says what it needs first.',
};

export type TabGuideDef = {
  path: string;
  title: string;
  group: TabGroup;
  // The parts of life this tab is mostly for; empty means everybody.
  beats: BeatKey[];
  // What the person gets out of it, in one sentence.
  gives: string;
  // What has to be on record, in order. The first open one that applies to
  // the parts of life chosen is what the row asks for. An optional item
  // never holds a tab back; it only says the tab will say more.
  needs: YourStoryItemKey[];
  // Said once everything it needs is there.
  readyLine: string;
  open: StoryDestination;
};

const route = (pathname: string, params?: Record<string, string>): StoryDestination => ({ kind: 'route', pathname, params });

export const TAB_GUIDES: TabGuideDef[] = [
  {
    path: '/life',
    title: 'Life',
    group: 'goesIn',
    beats: [],
    gives: 'Write down once what you would otherwise keep in your head: medicines, routines, bills, upkeep and the people you look after.',
    needs: ['meds', 'routine', 'capture', 'didIDoIt', 'bills', 'upkeep', 'workCheckin', 'familyMember', 'emergency'],
    readyLine: 'What you keep here is in place. Add to it whenever something new comes up.',
    open: route('/life'),
  },
  {
    path: '/schedule',
    title: 'Schedules',
    group: 'goesIn',
    beats: ['health', 'food'],
    gives: 'Your day in order: meals, drinks, doses and appointments on the clock, with reminders so the times stay out of your head.',
    needs: ['meal', 'water'],
    readyLine: 'Keep logging meals as you eat them. Every one is something Insights and Trends can read.',
    open: route('/schedule', { openScheduleLens: 'meals' }),
  },
  {
    path: '/log',
    title: 'Signals',
    group: 'goesIn',
    beats: ['health', 'movement'],
    gives: 'Say how you feel in a tap or two, and note flares, reactions and movement. This is what your meals get compared with.',
    needs: ['checkin', 'exercise'],
    readyLine: 'Note how you feel each day, and log a flare or reaction when one comes.',
    open: route('/log'),
  },
  {
    path: '/food',
    title: 'Food',
    group: 'goesIn',
    beats: ['health', 'food'],
    gives: 'Look up any food and see what it means for you, and build a meal once so logging it later takes one tap.',
    needs: ['allergies', 'eatingStyle'],
    readyLine: 'Works from the start. Build the meals you eat most, so logging them is quick.',
    open: route('/food'),
  },
  {
    path: '/garden',
    title: 'Garden',
    group: 'goesIn',
    beats: ['garden'],
    gives: 'What you grow and where, what it cost you, and what it gave back to your kitchen.',
    needs: ['gardenArea', 'planting', 'harvest'],
    readyLine: 'Log each harvest as it comes, and Trends shows what the garden grew.',
    open: route('/garden'),
  },
  {
    path: '/insights',
    title: 'Insights',
    group: 'givesBack',
    beats: ['health', 'food'],
    gives: 'What a food or nutrient means for your conditions, and whether each nutrient came from food or from a supplement.',
    needs: ['aboutYou', 'meal', 'conditions'],
    readyLine: 'Nutrients reads the meals you have logged. Food Lookup works on any food.',
    open: route('/insights', { openInsightsLens: 'nutrients' }),
  },
  {
    path: '/trends',
    title: 'Trends',
    group: 'givesBack',
    beats: [],
    gives: 'Your weeks drawn out: what you eat, how you felt, movement, spending, and what tends to come before a flare.',
    needs: [
      'meal',
      'trends',
      'checkin',
      'patterns',
      'exercise',
      'movementTrend',
      'didIDoIt',
      'keepingUp',
      'spending',
      'whatItCosts',
    ],
    readyLine: 'Everything you chose to follow has enough to show. It keeps filling in as you log.',
    open: route('/trends'),
  },
  {
    path: '/reports',
    title: 'Reports',
    group: 'givesBack',
    beats: ['health'],
    gives: 'One document to take to an appointment, with what you logged and where each figure came from.',
    needs: ['meds', 'meal', 'checkin'],
    readyLine: 'Make one a few days before your next appointment.',
    open: route('/reports', { openReportDays: '30' }),
  },
];

// A waiting item fills in from something done elsewhere; its row sends the
// person to that, since there is nothing to do on the waiting lens itself.
export const FILLED_BY: Partial<Record<YourStoryItemKey, YourStoryItemKey>> = {
  trends: 'meal',
  patterns: 'checkin',
  movementTrend: 'exercise',
  keepingUp: 'didIDoIt',
  whatItCosts: 'spending',
};

// What a waiting item is called where it shows, for "Already showing".
export const SHOWS_AS: Partial<Record<YourStoryItemKey, string>> = {
  trends: 'Nutrients and What You Eat',
  patterns: 'Pattern Finder',
  movementTrend: 'Movement',
  keepingUp: 'Keeping Up',
  whatItCosts: 'What It Costs',
};

// The settled items that come before every tab.
export const BEFORE_ANYTHING: YourStoryItemKey[] = ['beats', 'aboutYou', 'backup'];
export const BEFORE_ANYTHING_HEADING = 'Before anything else';
export const BEFORE_ANYTHING_CAPTION = 'A few minutes, once. Every tab below reads from this.';

export const START_HERE_LABEL = 'Start here';
export const FIRST_LABEL = 'First:';
export const FILLING_LABEL = 'Fills in as you log:';
export const READY_LABEL = 'Ready.';
export const MORE_LABEL = 'Says more once this is done:';
export const NOTHING_NEEDED_LINE = 'Nothing needs doing first for the parts of life you chose. Open it whenever you want it.';
export const NOT_CHOSEN_LINE = 'Not among the parts of life you chose. Open it any time.';
export const NOTHING_CHOSEN_LINE =
  'Choose the parts of your life above, and each tab below will say what it needs first.';

export type TabStatus = 'first' | 'filling' | 'ready' | 'notChosen' | 'waitingOnChoice';

export type TabGuideView = {
  def: TabGuideDef;
  status: TabStatus;
  // The item the row is about: what to do first, what is filling in, or
  // the optional thing that would make it say more.
  item: ItemView | null;
  // Where the row's button goes.
  go: StoryDestination;
  goLabel: string;
  // The sentence after the label.
  line: string;
  // A waiting item's count, or what is already showing.
  note: string | null;
  startHere: boolean;
};

export type TabGuide = {
  before: ItemView[];
  tabs: TabGuideView[];
  startHere: TabGuideView | null;
};

function isOpen(item: ItemView | undefined): item is ItemView {
  return !!item && (item.state === 'open' || item.state === 'reopened');
}

function openLabel(def: TabGuideDef): string {
  return `Open ${def.title}`;
}

function tabApplies(def: TabGuideDef, beats: readonly BeatKey[]): boolean {
  return def.beats.length === 0 || def.beats.some((beat) => beats.includes(beat));
}

export function buildTabGuide(view: YourStoryView): TabGuide {
  const beats = view.beats;
  const items = view.allItems;
  const applies = (key: YourStoryItemKey) => itemApplies(items[key].def, beats);

  const before = BEFORE_ANYTHING.map((key) => items[key]).filter(
    (item) => (item.def.key === 'beats' || applies(item.def.key)) && isOpen(item),
  );

  const tabs: TabGuideView[] = TAB_GUIDES.map((def) => {
    const base = { def, item: null, note: null, startHere: false };
    if (beats.length === 0) {
      return { ...base, status: 'waitingOnChoice', go: def.open, goLabel: openLabel(def), line: NOTHING_CHOSEN_LINE };
    }
    const relevant = def.needs.filter(applies).map((key) => items[key]);
    if (!tabApplies(def, beats) && relevant.length === 0) {
      return { ...base, status: 'notChosen', go: def.open, goLabel: openLabel(def), line: NOT_CHOSEN_LINE };
    }

    // Already showing, for a tab whose lenses fill in one by one.
    const showing = relevant
      .filter((item) => item.def.kind === 'waiting' && item.state === 'done')
      .map((item) => SHOWS_AS[item.def.key])
      .filter((name): name is string => !!name);
    const showingNote = showing.length > 0 ? `Already showing: ${showing.join(', ')}.` : null;

    const firstNeeded = relevant.find((item) => item.def.kind === 'needed' && isOpen(item));
    if (firstNeeded) {
      return {
        ...base,
        status: 'first',
        item: firstNeeded,
        go: firstNeeded.def.destination,
        goLabel: 'Go there',
        line: firstNeeded.def.todo,
        note: firstNeeded.state === 'reopened' ? firstNeeded.note : showingNote,
      };
    }
    const filling = relevant.find((item) => item.def.kind === 'waiting' && isOpen(item));
    if (filling) {
      const feeder = FILLED_BY[filling.def.key];
      const note = [filling.note, showingNote].filter(Boolean).join(' ') || null;
      return {
        ...base,
        status: 'filling',
        item: filling,
        go: feeder ? items[feeder].def.destination : filling.def.destination,
        goLabel: feeder ? 'Log some more' : 'Go there',
        line: filling.def.todo,
        note,
      };
    }
    const optional = relevant.find((item) => item.def.kind === 'optional' && isOpen(item));
    if (optional) {
      return {
        ...base,
        status: 'ready',
        item: optional,
        go: def.open,
        goLabel: openLabel(def),
        line: def.readyLine,
        note: `${MORE_LABEL} ${optional.def.todo}`,
      };
    }
    const line = relevant.length === 0 ? NOTHING_NEEDED_LINE : def.readyLine;
    return { ...base, status: 'ready', go: def.open, goLabel: openLabel(def), line, note: showingNote };
  });

  // Nothing before every tab left to do, so the first tab with something to
  // do is where to start.
  const startHere = before.length === 0 ? tabs.find((tab) => tab.status === 'first') ?? null : null;
  if (startHere) startHere.startHere = true;
  return { before, tabs, startHere };
}

// The one line the folded Home card shows.
export function tabGuideLine(guide: TabGuide, fallback: string): string {
  const first = guide.before[0];
  if (first) return `First: ${first.sentence}`;
  if (guide.startHere) return `Start here, on ${guide.startHere.def.title}: ${guide.startHere.line}`;
  const filling = guide.tabs.find((tab) => tab.status === 'filling');
  if (filling) return filling.note ? `${filling.line} ${filling.note}` : filling.line;
  return fallback;
}
