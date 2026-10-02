// Care for each crop as a repeating task (I1, 2026-10-02). Every crop in
// lib/cropGuides.ts gets the same few kinds of care, each with how many days
// pass between turns, why, and where that came from:
//
// - Check the soil, never a fixed watering. The RHS advises against a routine
//   such as watering once a week, so the task is to look and water only when
//   the soil is dry below the surface. Warm-season annuals get every 2 days,
//   cool-season annuals every 3, perennials every 7, as starting points.
// - Feed. Only where the crop carries one. Tomatoes, aubergines, peppers and
//   celery have a stated cadence on their RHS pages, so theirs is the
//   source's. Other heavy annual feeders get comfrey liquid every 14 days,
//   moderate annuals a handful of compost every 28, perennials a yearly
//   dressing of compost, each said to be a starting point. Light feeders get
//   no feed task: the compost already in the soil is enough for them.
// - Mulch once a year, at least 5 cm thick, from the RHS mulch page.
// - Look the plants over once a week, against What is wrong with it.
// - Crop-specific care, only where the crop's guide or its cited page says
//   so: picking every few days from the first harvest, outer leaves weekly,
//   pinching, and a fresh sowing every few weeks.
//
// A task whose days between are the app's starting point says so, beside the
// ones a source gives. The person can change the days before adding it.
// Feeding is always comfrey, compost or a liquid feed made from plants,
// never a product, which is the living-soil rule in CLAUDE.md.
//
// Pure, so scripts/test_crop_care.js can check every crop without a phone.

import type { CropGuide } from './cropGuides';
import { GO_COMFREY, GO_COMPOST, GO_LIQUID_FEEDS, GO_MULCH, type GuideSource } from './plantNutrients';
import type { RepeatConfig } from './repeatRule';

export type CareKind = 'soil' | 'feed' | 'mulch' | 'look' | 'pick' | 'pinch' | 'sow';

export type CareTask = {
  key: string;
  kind: CareKind;
  /** The title the schedule shows. Begins with a verb. */
  title: string;
  everyDays: number;
  /** 'now' starts today; 'harvest' starts on the first expected harvest. */
  start: 'now' | 'harvest';
  /** Something to happen first, such as the first fruits setting. A task
   *  that waits for something is offered unticked. */
  waitsFor: string | null;
  /** 'source' when a cited page gives the days between; 'startingPoint'
   *  when the app chose them. */
  basis: 'source' | 'startingPoint';
  note: string;
  sources: GuideSource[];
};

const RHS_WATERING: GuideSource = { label: 'RHS: Watering', url: 'https://www.rhs.org.uk/garden-jobs/watering' };
const RHS_MULCH: GuideSource = { label: 'RHS: Mulches and mulching', url: 'https://www.rhs.org.uk/soil-composts-mulches/mulch' };

// Feeds whose days between come from the crop's RHS page.
const STATED_FEEDS: Record<string, { everyDays: number; waitsFor: string | null; note: string }> = {
  tomato: {
    everyDays: 14,
    waitsFor: 'the first fruits have set',
    note: 'The RHS says a fortnightly feed can help to increase yields, and the guide says every week or two once the first fruits set. Comfrey liquid is high in potassium, which is what fruiting plants draw on.',
  },
  aubergine: {
    everyDays: 14,
    waitsFor: 'the first flowers have opened',
    note: 'The RHS gives every two weeks for aubergines in containers, from when the first flowers appear, with a high-potassium liquid feed. Comfrey liquid is one made from plants.',
  },
  pepper: {
    everyDays: 7,
    waitsFor: 'the first flowers have opened',
    note: 'The RHS gives a liquid feed weekly for peppers, as soon as flowering starts. That is for plants in pots; in a bed with plenty of compost they may need less.',
  },
  celery: {
    everyDays: 14,
    waitsFor: null,
    note: 'The RHS gives a feed every fortnight through the summer for celery in pots. In a bed rich in compost, a comfrey liquid feed at the same spacing keeps the stems coming.',
  },
};

// Crop-specific care from the guide text or the crop's RHS page. Each line
// here is said in that source; scripts/test_crop_care.js checks every key
// is a crop.
type ExtraTask = Omit<CareTask, 'key' | 'sources' | 'basis'> & { basis?: CareTask['basis'] };
const PICK_OFTEN = (name: string, said: string): ExtraTask => ({
  kind: 'pick',
  title: `Pick ${name}`,
  everyDays: 3,
  start: 'harvest',
  waitsFor: null,
  note: `${said} Picking often keeps the plant making more.`,
});
const OUTER_LEAVES = (name: string): ExtraTask => ({
  kind: 'pick',
  title: `Pick the outer leaves of the ${name}`,
  everyDays: 7,
  start: 'harvest',
  waitsFor: null,
  basis: 'startingPoint',
  note: 'The guide says to pick the outer leaves and let the centre keep growing, which keeps one plant cropping for months. Weekly is a starting point.',
});
const SOW_AGAIN = (name: string, everyDays: number, said: string, basis: CareTask['basis'] = 'source'): ExtraTask => ({
  kind: 'sow',
  title: `Sow more ${name}`,
  everyDays,
  start: 'now',
  waitsFor: null,
  basis,
  note: `${said} A short row each time gives a steady supply rather than one glut.`,
});

const EXTRA_CARE: Record<string, ExtraTask[]> = {
  tomato: [
    PICK_OFTEN('ripe tomatoes', 'The RHS says to check the plants every few days and pick.'),
    {
      kind: 'pinch',
      title: 'Pinch out tomato side shoots',
      everyDays: 7,
      start: 'now',
      waitsFor: null,
      basis: 'startingPoint',
      note: 'On cordon kinds, the guide says to pinch out the side shoots that form where a leaf meets the stem. Bush kinds are left alone. Weekly is a starting point, since they grow fast in summer.',
    },
  ],
  cucumber: [PICK_OFTEN('cucumbers', 'The RHS says to check them every few days, and the guide says pick often and young.')],
  greenbeans: [PICK_OFTEN('green beans', 'The guide says pick often and young to keep them coming.')],
  runnerbeans: [PICK_OFTEN('runner beans', 'The guide says pick every few days.')],
  okra: [
    {
      kind: 'pick',
      title: 'Pick okra pods',
      everyDays: 2,
      start: 'harvest',
      waitsFor: null,
      note: 'The guide says to pick pods at 5 to 10 cm every day or two. Pods left on turn woody and stop new ones.',
    },
  ],
  cowpea: [PICK_OFTEN('cowpeas', 'The guide says pick often to keep the flowers coming.')],
  chard: [OUTER_LEAVES('chard')],
  collards: [OUTER_LEAVES('collards')],
  basil: [
    {
      kind: 'pinch',
      title: 'Pinch out the basil tips',
      everyDays: 7,
      start: 'now',
      waitsFor: null,
      basis: 'startingPoint',
      note: 'The guide says to pinch out the tips to make bushy plants and stop it flowering. Weekly is a starting point.',
    },
  ],
  broadbeans: [
    {
      kind: 'pinch',
      title: 'Pinch out the broad bean tips',
      everyDays: 0,
      start: 'now',
      waitsFor: 'the first pods have set',
      basis: 'source',
      note: 'The guide says to pinch out the tips once the first pods set, which removes the blackfly that cluster there. Done once.',
    },
  ],
  lettuce: [SOW_AGAIN('lettuce', 14, 'The guide says to sow a short row every two or three weeks.')],
  radish: [SOW_AGAIN('radishes', 14, 'The guide says to sow direct every two weeks.')],
  coriander: [SOW_AGAIN('coriander', 21, 'The guide says to sow direct every three weeks.')],
  dill: [SOW_AGAIN('dill', 21, 'The guide says to sow direct every few weeks; three is a starting point.', 'startingPoint')],
  rocket: [SOW_AGAIN('rocket', 21, 'The guide says to sow little and often; three weeks is a starting point.', 'startingPoint')],
  kohlrabi: [SOW_AGAIN('kohlrabi', 21, 'The guide says to sow little and often; three weeks is a starting point.', 'startingPoint')],
  mustardgreens: [SOW_AGAIN('mustard greens', 21, 'The guide says to sow again three weeks later, and little and often.')],
};

function soilTask(guide: CropGuide): CareTask {
  const everyDays = guide.season === 'perennial' ? 7 : guide.season === 'warm' ? 2 : 3;
  return {
    key: `${guide.key}:soil`,
    kind: 'soil',
    title: `Check the soil around the ${guide.name.toLowerCase()}`,
    everyDays,
    start: 'now',
    waitsFor: null,
    basis: 'startingPoint',
    note: `Push a finger into the soil and water only if it is dry below the surface. The RHS advises against a routine such as watering once a week, because what a plant needs changes with the weather. What the guide says about this crop: ${guide.water}`,
    sources: [RHS_WATERING, ...guide.sources],
  };
}

function feedTask(guide: CropGuide): CareTask | null {
  const stated = STATED_FEEDS[guide.key];
  if (stated) {
    return {
      key: `${guide.key}:feed`,
      kind: 'feed',
      title: `Feed the ${guide.name.toLowerCase()} with comfrey liquid`,
      everyDays: stated.everyDays,
      start: 'now',
      waitsFor: stated.waitsFor,
      basis: 'source',
      note: stated.note,
      sources: [...guide.sources, GO_COMFREY, GO_LIQUID_FEEDS],
    };
  }
  if (guide.feeding === 'light') return null;
  if (guide.season === 'perennial') {
    return {
      key: `${guide.key}:feed`,
      kind: 'feed',
      title: `Spread compost around the ${guide.name.toLowerCase()}`,
      everyDays: 365,
      start: 'now',
      waitsFor: null,
      basis: 'startingPoint',
      note: `A ${guide.feeding === 'heavy' ? 'heavy' : 'moderate'} feeder that stays in the ground. A layer of compost over the roots once a year, in spring as growth starts, feeds the soil life that feeds the plant. Once a year is a starting point.`,
      sources: [...guide.sources, GO_COMPOST],
    };
  }
  if (guide.feeding === 'heavy') {
    return {
      key: `${guide.key}:feed`,
      kind: 'feed',
      title: `Feed the ${guide.name.toLowerCase()} with comfrey liquid`,
      everyDays: 14,
      start: 'now',
      waitsFor: null,
      basis: 'startingPoint',
      note: 'A heavy feeder. Comfrey liquid, or a liquid made from nettles or other plants, watered on at the roots keeps it going through the season. Every two weeks is a starting point; less in soil already rich in compost.',
      sources: [...guide.sources, GO_COMFREY, GO_LIQUID_FEEDS],
    };
  }
  return {
    key: `${guide.key}:feed`,
    kind: 'feed',
    title: `Add a handful of compost around the ${guide.name.toLowerCase()}`,
    everyDays: 28,
    start: 'now',
    waitsFor: null,
    basis: 'startingPoint',
    note: 'A moderate feeder. A little compost spread around the plants once a month keeps the soil fed. Monthly is a starting point.',
    sources: [...guide.sources, GO_COMPOST],
  };
}

function mulchTask(guide: CropGuide): CareTask {
  return {
    key: `${guide.key}:mulch`,
    kind: 'mulch',
    title: `Mulch around the ${guide.name.toLowerCase()}`,
    everyDays: 365,
    start: 'now',
    waitsFor: null,
    basis: 'startingPoint',
    note: 'The RHS gives a layer at least 5 cm thick, put down onto moist soil in late autumn to late winter or in mid to late spring. Compost, leaf mould or straw all feed the soil as they break down. Once a year is a starting point.',
    sources: [RHS_MULCH, GO_MULCH],
  };
}

function lookTask(guide: CropGuide): CareTask {
  return {
    key: `${guide.key}:look`,
    kind: 'look',
    title: `Look the ${guide.name.toLowerCase()} over for trouble`,
    everyDays: 7,
    start: 'now',
    waitsFor: null,
    basis: 'startingPoint',
    note: 'Check the leaves, top and underneath, and the stems. Trouble caught early is easier to put right from the soil. What is wrong with it, under this planting, lists what this crop is known for. Weekly is a starting point.',
    sources: guide.sources,
  };
}

export function careTasksFor(guide: CropGuide): CareTask[] {
  const tasks: CareTask[] = [soilTask(guide)];
  const feed = feedTask(guide);
  if (feed) tasks.push(feed);
  for (const [index, extra] of (EXTRA_CARE[guide.key] ?? []).entries()) {
    tasks.push({ ...extra, basis: extra.basis ?? 'source', key: `${guide.key}:${extra.kind}:${index}`, sources: guide.sources });
  }
  tasks.push(lookTask(guide), mulchTask(guide));
  return tasks;
}

/** Keys of the crops that carry crop-specific care, for the test. */
export const CROPS_WITH_EXTRA_CARE = Object.keys(EXTRA_CARE);
export const CROPS_WITH_STATED_FEEDS = Object.keys(STATED_FEEDS);

/** Ticked when the band opens: everything except a task that waits for
 *  something to happen first. */
export function tickedByDefault(task: CareTask): boolean {
  return task.waitsFor === null;
}

export function describeCadence(everyDays: number): string {
  if (everyDays <= 0) return 'Once';
  if (everyDays === 1) return 'Every day';
  if (everyDays === 7) return 'Every week';
  if (everyDays === 14) return 'Every two weeks';
  if (everyDays === 365) return 'Once a year';
  if (everyDays % 7 === 0 && everyDays < 60) return `Every ${everyDays / 7} weeks`;
  return `Every ${everyDays} days`;
}

export function describeBasis(task: CareTask): string {
  return task.basis === 'source' ? 'Days between from the source.' : 'Days between are a starting point; change them to suit.';
}

export function describeWaitsFor(task: CareTask): string | null {
  return task.waitsFor ? `Tick this once ${task.waitsFor}.` : null;
}

/** The first day of a task: today, or the first expected harvest when the
 *  task is about picking and that day is still to come. */
export function careFirstDate(task: CareTask, today: string, expectedHarvestStart: string | null): string {
  if (task.start === 'harvest' && expectedHarvestStart && expectedHarvestStart > today) return expectedHarvestStart;
  return today;
}

/** How the series repeats. A planting with an expected last harvest ends its
 *  series then; a perennial or a planting with no expected end carries on
 *  until stopped. A task done once does not repeat. */
export function careRepeat(everyDays: number, endsOn: string | null, firstDate: string): RepeatConfig {
  if (everyDays <= 0) return { type: 'none' };
  if (endsOn && endsOn >= firstDate) return { type: 'every_n_days', interval: everyDays, endType: 'until_date', until: endsOn };
  return { type: 'every_n_days', interval: everyDays, endType: 'indefinite' };
}

/** The series ends on the expected last harvest for an annual; a
 *  perennial's carries on until stopped. */
export function careEndsOn(guide: CropGuide, expectedHarvestEnd: string | null): string | null {
  if (guide.season === 'perennial' || !expectedHarvestEnd) return null;
  return expectedHarvestEnd;
}

/** Care runs only while a planting is to sow or growing. */
export function careStillRuns(status: string): boolean {
  return status === 'growing' || status === 'planned';
}

/** Reads a typed number of days. Null when it is not a whole number from
 *  1 to 365. */
export function readEveryDays(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return null;
  const days = Number(trimmed);
  return days >= 1 && days <= 365 ? days : null;
}

export function describeAdded(count: number): string {
  if (count === 0) return 'Nothing was ticked, so nothing was added.';
  return count === 1
    ? 'Added to the schedule as a repeating Garden task.'
    : `Added to the schedule as ${count} repeating Garden tasks.`;
}

export const CARE_INTRO =
  'What this crop needs doing, and how often. Tick what you want and add it to the schedule as repeating Garden tasks, tied to this planting. They stop when the planting is harvested, failed or pulled out, or when you stop them here.';
export const CARE_NO_CROP =
  'No growing guide matches this planting, so there is no care list for it. A Garden task can still be added from the Upcoming Tasks band, set to repeat.';
export const CARE_LIGHT_FEEDER =
  'No feed task: this is a light feeder, and the compost already in the soil is enough for it.';
export const CARE_STOPPED_NOTE =
  'Tasks already done stay on the schedule as a record. Only the ones still to come are taken off.';
