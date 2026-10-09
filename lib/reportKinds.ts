// The seven reports marked Build on the inputs-to-outputs map (1.0.52.7),
// each a different reader's view over the same records the Overview reads.
// This file holds what each report is and how a finished reading turns
// into report sections, with no I/O, so scripts/test_output_lenses.js can
// run it without a phone. lib/reportGenerator.ts gathers the records.
//
// Most of what these reports say is already said by a Trends or Insights
// lens, so a report section is built from that lens's ReadingView rather
// than worded a second time: the sentence a clinician reads is the one the
// person saw on screen, and the forbidden-words sweep covers both at once.
import type { CostSummary } from './costOfEating';
import { formatFinanceMoney } from './financeCore';
import type { MedicalBill } from './financeHealth';
import type { HarvestYieldSummary } from './harvestYield';
import { describeRepeat } from './eatingVariety';
import { MEAL_SOURCE_LABELS, describeMealRepeat, type MealVarietySummary } from './mealVariety';
import type { ReadingView } from './readingBands';
import type { ReportListSection, ReportSection, ReportTableSection } from './reportGenerator';

export type ReportKind =
  | 'overview'
  | 'r-doctor'
  | 'r-nutrition'
  | 'r-trainer'
  | 'r-month'
  | 'r-care'
  | 'r-medical-costs'
  | 'r-garden'
  | 'r-variety';

/** The sections the Overview has always carried, each one a named block so
 *  a narrower report can ask for the ones its reader needs and skip the
 *  work of the rest. */
export type CoreSectionId = 'glance' | 'conditions' | 'nutrients' | 'flags' | 'diary' | 'symptoms' | 'noticed' | 'meds' | 'movement' | 'body' | 'heart' | 'rules' | 'labs';

/** The sections a narrower report adds after its core ones, each read
 *  from a Trends or Insights lens or a record of its own (K10 named them
 *  so each can be ticked in or out). */
export type ExtraSectionId =
  | 'since-visit'
  | 'appointments'
  | 'blood-pressure'
  | 'doses'
  | 'interactions'
  | 'symptom-photos'
  | 'hydration'
  | 'planned'
  | 'variety'
  | 'reactions'
  | 'nights'
  | 'work'
  | 'care'
  | 'ferments'
  | 'eating-cost'
  | 'today'
  | 'bills'
  | 'costs'
  | 'variety-full'
  | 'garden-yield'
  | 'on-hand'
  | 'planting-photos';

export type ReportSectionId = CoreSectionId | ExtraSectionId;

export type ReportKindDef = {
  key: ReportKind;
  label: string;
  icon: string;
  title: string;
  preface: string[];
  help: string;
  core: CoreSectionId[];
  extras: ExtraSectionId[];
};

const SELF_REPORTED = 'It is not a diagnosis. Every figure here is self-reported or read from the phone, and the sections say which.';

export const REPORT_KINDS: ReportKindDef[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: 'document-text-outline',
    title: 'Lifestead: Health Summary',
    preface: ['A plain summary of what was logged in the app during this window, as the person entered it.', SELF_REPORTED],
    help: 'Everything logged over the range in one summary, opening with an at a glance page: nutrient intake, foods flagged for your conditions, symptoms and flares, what Pattern Finder noticed and any food experiments, active meds and supplements, movement and sleep, weight and blood pressure, resting heart rate and heart rate variability against your usual range, personal rules, and the most recent lab results.',
    core: ['glance', 'conditions', 'nutrients', 'flags', 'symptoms', 'noticed', 'meds', 'movement', 'body', 'heart', 'rules', 'labs'],
    extras: [],
  },
  {
    key: 'r-doctor',
    label: 'For Your Doctor',
    icon: 'medkit-outline',
    title: 'Lifestead: For the Doctor',
    preface: [
      'What changed since the last visit, and the records a clinician usually asks for, as the person entered them.',
      SELF_REPORTED,
    ],
    help: 'Built for an appointment, opening with an at a glance page: what was recorded since the last appointment with anybody, the next visit and what changed since the last one with the same provider, symptoms and flares, what Pattern Finder noticed and any food experiments, blood pressure, doses as scheduled and as marked with how many days each was due and marked, active meds and supplements with the interaction notes that touch them and how each works, weight, resting heart rate and heart rate variability against your usual range, personal rules and the most recent labs. Food detail is left to the Nutritionist report.',
    core: ['glance', 'conditions', 'symptoms', 'noticed', 'meds', 'body', 'heart', 'rules', 'labs'],
    extras: ['since-visit', 'appointments', 'blood-pressure', 'doses', 'interactions', 'symptom-photos'],
  },
  {
    key: 'r-nutrition',
    label: 'For a Nutritionist',
    icon: 'nutrition-outline',
    title: 'Lifestead: For the Nutritionist',
    preface: ['What was eaten and drunk over the range, day by day, what was planned, and what was noticed after meals, as the person entered it.', SELF_REPORTED],
    help: 'Nutrient intake against targets, foods flagged for your conditions, a day-by-day diary of meals beside flares and reactions, hydration, planned meals against what was eaten, after-meal reactions and food tests, what Pattern Finder noticed and any food experiments, and the supplements currently taken.',
    core: ['conditions', 'nutrients', 'flags', 'diary', 'symptoms', 'noticed', 'meds'],
    extras: ['hydration', 'planned', 'variety', 'reactions'],
  },
  {
    key: 'r-trainer',
    label: 'For a Trainer',
    icon: 'barbell-outline',
    title: 'Lifestead: For the Trainer',
    preface: [
      'Movement, sleep, weight, blood pressure, resting heart rate, heart rate variability and hydration over the range. Conditions, medicines and symptoms are left out of this one on purpose; the Overview carries them.',
      SELF_REPORTED,
    ],
    help: 'Steps and sleep from the phone, weight and blood pressure, resting heart rate and heart rate variability against your usual range, hydration, nights up, and how the work weeks went. Conditions, medicines and symptoms are left out on purpose.',
    core: ['movement', 'body', 'heart'],
    extras: ['blood-pressure', 'hydration', 'nights', 'work'],
  },
  {
    key: 'r-month',
    label: 'Looking Back',
    icon: 'time-outline',
    title: 'Lifestead: Looking Back',
    preface: ['How the range went across the parts of life the app follows, read from what was recorded. A stretch with nothing recorded is said as such, never as a zero.'],
    help: 'The range as a whole: meals planned and eaten, doses, appointments, work weeks, reactions, nights, ferments, and what eating and the conditions cost.',
    core: [],
    extras: ['planned', 'doses', 'care', 'work', 'reactions', 'nights', 'ferments', 'variety', 'eating-cost'],
  },
  {
    key: 'r-care',
    label: 'For a Caregiver',
    icon: 'people-outline',
    title: 'Lifestead: For a Caregiver',
    preface: [
      'What someone helping day to day needs in one place: what is on today, the doses and appointments, and the conditions and medicines behind them.',
      'Medicine questions go to the prescriber. Nothing here changes a dose or a time.',
    ],
    help: 'An at a glance page, then what is on today, doses as scheduled and as marked over the range, appointments, the tracked conditions and every active medicine and supplement.',
    core: ['glance', 'conditions', 'meds'],
    extras: ['today', 'doses', 'care'],
  },
  {
    key: 'r-medical-costs',
    label: 'Medical Costs',
    icon: 'receipt-outline',
    title: 'Lifestead: Medical Costs',
    preface: [
      'Medical bills with a service date in the range, where the insurance plan stands, and what the conditions, supplements and prescriptions cost, from what was recorded.',
      'Anything entered both as a bill and as an expense is counted in both places; nothing here tries to match the two.',
    ],
    help: 'Every medical bill in the range with what was billed, paid by insurance and owed, the plan’s deductible and out-of-pocket standing, and condition, supplement and prescription costs by kind.',
    core: [],
    extras: ['bills', 'costs'],
  },
  {
    key: 'r-garden',
    label: 'Garden Record',
    icon: 'leaf-outline',
    title: 'Lifestead: Garden Record',
    preface: ['What the garden gave over the range, how long each crop took, compost made and used, and what was shared, from what was recorded.'],
    help: 'Harvests by crop and by area, how long each grow took against what was expected, compost, what was sold, traded or given, and what is ready or on hand now.',
    core: [],
    extras: ['garden-yield', 'on-hand', 'planting-photos'],
  },
  {
    key: 'r-variety',
    label: 'Eating Variety',
    icon: 'color-palette-outline',
    title: 'Lifestead: Eating Variety',
    preface: [
      'How varied eating was over the range, read from the meals that were logged: different foods and plants week by week, the meals and foods that came back most, the food groups that never turned up, where meals came from, and how many came from the plan.',
      'A week with nothing logged is left as a gap, never counted as a week of eating nothing. A meal that comes back often is counted, not judged.',
    ],
    help: 'Different foods and different plants week by week, the meals and foods that came back most and how many days they took, food groups not logged at all, meals made at home, from a package or eaten out, meals from the plan against meals decided on the day, and foods that feed the gut.',
    core: [],
    extras: ['variety-full'],
  },
];

export const REPORT_KIND_BY_KEY: Record<ReportKind, ReportKindDef> = Object.fromEntries(
  REPORT_KINDS.map((def) => [def.key, def]),
) as Record<ReportKind, ReportKindDef>;

// K10, 2026-09-29: the sections of a report can be ticked in or out before
// it is shared. Each is named here as the person sees it in the list; a
// section left out is never gathered, and the report says how many were
// left out of that copy without naming them.

export const SECTION_LABELS: Record<ReportSectionId, string> = {
  glance: 'At a glance',
  conditions: 'Tracked conditions',
  nutrients: 'Nutrient intake',
  flags: 'Condition score flags',
  diary: 'Food and symptom diary',
  symptoms: 'Symptoms and flares',
  noticed: 'What Pattern Finder noticed, and food experiments',
  meds: 'Active medications and supplements',
  movement: 'Movement and sleep',
  body: 'Weight and blood pressure',
  heart: 'Resting heart rate and heart rate variability',
  rules: 'Personal notes and rules',
  labs: 'Most recent lab results',
  'since-visit': 'Since the last appointment',
  appointments: 'Appointments',
  'blood-pressure': 'Blood pressure',
  doses: 'Doses',
  interactions: 'Interaction notes for these meds',
  'symptom-photos': 'Symptom photos',
  hydration: 'Hydration',
  planned: 'Planned and eaten',
  variety: 'Eating variety in brief',
  reactions: 'After-meal reactions',
  nights: 'Nights',
  work: 'Work',
  care: 'Appointments and care',
  ferments: 'Ferments',
  'eating-cost': 'What eating cost',
  today: 'Today',
  bills: 'Medical bills and insurance',
  costs: 'Condition, supplement and prescription costs',
  'variety-full': 'Eating variety',
  'garden-yield': 'Harvests, grows, compost and sharing',
  'on-hand': 'On hand now',
  'planting-photos': 'Planting photos',
};

export type ReportSectionChoice = { id: ReportSectionId; label: string };

/** Every section a report can carry, in the order it carries them. */
export function reportSectionChoices(kind: ReportKind): ReportSectionChoice[] {
  const def = REPORT_KIND_BY_KEY[kind];
  return [...def.core, ...def.extras].map((id) => ({ id, label: SECTION_LABELS[id] }));
}

/** The ids left out that this report carries, in its order, and never all
 *  of them: a report with nothing in it is not a report, so a list that
 *  would leave everything out leaves nothing out. */
export function cleanLeftOut(kind: ReportKind, leftOut: readonly string[]): ReportSectionId[] {
  const choices = reportSectionChoices(kind);
  const out = choices.filter((choice) => leftOut.includes(choice.id)).map((choice) => choice.id);
  return out.length >= choices.length ? [] : out;
}

/** Stored as one app_meta row per report, a JSON list of ids. */
export function leftOutMetaKey(kind: ReportKind): string {
  return `report_left_out:${kind}`;
}

export function parseLeftOut(kind: ReportKind, value: string | null | undefined): ReportSectionId[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? cleanLeftOut(kind, parsed.filter((item): item is string => typeof item === 'string')) : [];
  } catch {
    return [];
  }
}

/** The line a copy with sections left out carries under its preface. */
export function leftOutPrefaceLine(count: number): string | null {
  if (count <= 0) return null;
  return count === 1
    ? 'One section this report usually carries was left out of this copy by the person who shared it.'
    : `${count} sections this report usually carries were left out of this copy by the person who shared it.`;
}

/** "All 12 sections" or "9 of 12 sections" for the chooser's button. */
export function sectionCountLabel(kind: ReportKind, leftOut: readonly string[]): string {
  const total = reportSectionChoices(kind).length;
  const shown = total - cleanLeftOut(kind, leftOut).length;
  if (shown === total) return total === 1 ? 'The one section' : `All ${total} sections`;
  return `${shown} of ${total} sections`;
}

/** One report section per band of a reading. A reading with nothing in it
 *  becomes one section that says so, under the heading the caller names. */
export function sectionsFromReading(heading: string, view: ReadingView): ReportSection[] {
  if (!view.hasAnything || view.bands.length === 0) {
    return [{ kind: 'list', heading, rows: [], empty: view.empty || 'Nothing recorded.' }];
  }
  return view.bands.map((band): ReportListSection => {
    const rows = [
      ...band.lines,
      ...(band.rows ?? []).map((row) => `${row.label}: ${row.display}`),
      ...(band.items ?? []).map((item) => (item.caption ? `${item.title} (${item.caption})` : item.title)),
    ];
    return {
      kind: 'list',
      heading: band.title,
      note: band.notes && band.notes.length > 0 ? band.notes.join(' ') : undefined,
      rows,
      empty: 'Nothing recorded.',
    };
  });
}

function money(value: number | null): string {
  return value == null ? '' : formatFinanceMoney(value);
}

const BILL_STATUS_WORDS: Record<string, string> = { unpaid: 'Not paid yet', paid: 'Paid', disputed: 'Disputed', denied: 'Denied' };

export function medicalBillsSection(bills: MedicalBill[], start: string, end: string): ReportTableSection {
  const inRange = bills
    .filter((bill) => bill.serviceDate >= start && bill.serviceDate <= end)
    .sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
  const owed = inRange.reduce((sum, bill) => sum + (bill.youOwe ?? 0), 0);
  const paid = inRange.reduce((sum, bill) => sum + (bill.paidAmount ?? 0), 0);
  return {
    kind: 'table',
    heading: 'Medical bills',
    note:
      inRange.length > 0
        ? `${inRange.length === 1 ? '1 bill' : `${inRange.length} bills`} with a service date in the range. Owed on them: ${formatFinanceMoney(owed)}; paid so far: ${formatFinanceMoney(paid)}. A blank cell is a figure not entered, not a zero.`
        : undefined,
    columns: ['Service date', 'Provider', 'Billed', 'Insurance paid', 'You owe', 'Paid', 'Status'],
    rows: inRange.map((bill) => [
      bill.serviceDate,
      bill.description ? `${bill.provider}, ${bill.description}` : bill.provider,
      money(bill.billed),
      money(bill.insurancePaid),
      money(bill.youOwe),
      money(bill.paidAmount),
      BILL_STATUS_WORDS[bill.status] ?? bill.status,
    ]),
    empty: 'No medical bills with a service date in this range. Life > Finances is where they go in.',
  };
}

export function insuranceSection(planLine: string | null): ReportListSection {
  return {
    kind: 'list',
    heading: 'Insurance plan',
    rows: planLine ? [planLine] : [],
    empty: 'No insurance plan recorded. Life > Finances holds one.',
  };
}

export function costSections(cost: CostSummary | null): ReportSection[] {
  if (!cost) {
    return [{ kind: 'list', heading: 'What the conditions cost', rows: [], empty: 'Could not read costs for this range.' }];
  }
  const condition = cost.condition;
  const supplements = cost.supplements;
  return [
    {
      kind: 'table',
      heading: 'What the conditions cost',
      note: [condition.headline, condition.gapNote, condition.sourcesNote].filter(Boolean).join(' '),
      columns: ['Kind', 'Amount', 'Share'],
      rows: condition.byKind.map((slice) => [slice.name, slice.display, slice.share == null ? '' : `${slice.share}%`]),
      empty: 'Nothing recorded against a condition in this range.',
    },
    {
      kind: 'table',
      heading: 'By condition',
      note: condition.untaggedLine ?? undefined,
      columns: ['Condition', 'Amount', 'Share'],
      rows: condition.byCondition.map((slice) => [slice.name, slice.display, slice.share == null ? '' : `${slice.share}%`]),
      empty: 'No costs tagged to a condition in this range.',
    },
    {
      kind: 'list',
      heading: 'Supplements',
      note: supplements.boundary,
      rows: supplements.hasAnything
        ? [supplements.headline, supplements.runningLine, ...supplements.coverage.map((entry) => entry.line), supplements.gapNote].filter(
            (line): line is string => Boolean(line),
          )
        : [],
      empty: 'No supplement spending recorded in this range.',
    },
  ];
}

export function eatingCostSection(cost: CostSummary | null): ReportListSection {
  const rows = cost
    ? [cost.food.hasAnything ? cost.food.headline : null, cost.food.perDayLine, cost.condition.hasAnything ? cost.condition.headline : null, cost.supplements.hasAnything ? cost.supplements.headline : null].filter(
        (line): line is string => Boolean(line),
      )
    : [];
  return {
    kind: 'list',
    heading: 'What it cost',
    note: cost?.food.note,
    rows,
    empty: 'No food, supplement or condition costs recorded in this range.',
  };
}

export function gardenYieldSections(summary: HarvestYieldSummary): ReportSection[] {
  const { yields, timing, compost, sharing } = summary;
  return [
    {
      kind: 'table',
      heading: 'Harvests by crop',
      note: [yields.hasAnything ? yields.headline : null, yields.countLine, yields.otherUnitsLine, yields.gapNote].filter(Boolean).join(' ') || undefined,
      columns: ['Crop', 'Amount', 'Share of the weight'],
      rows: yields.byCrop.map((slice) => [slice.name, slice.display, slice.share == null ? '' : `${slice.share}%`]),
      empty: 'No harvests recorded in this range.',
    },
    {
      kind: 'table',
      heading: 'Harvests by area',
      note: yields.unassignedLine ?? undefined,
      columns: ['Area', 'Amount', 'Share of the weight'],
      rows: yields.byArea.map((slice) => [slice.name, slice.display, slice.share == null ? '' : `${slice.share}%`]),
      empty: 'No harvests recorded against an area in this range.',
    },
    {
      kind: 'list',
      heading: 'How long each grow took',
      note: timing.caveat,
      rows: timing.hasAnything
        ? [timing.headline, ...timing.byCrop.map((crop) => crop.line), ...timing.stillGrowing.map((entry) => entry.line), timing.noExpectedLine].filter(
            (line): line is string => Boolean(line),
          )
        : [],
      empty: 'No grow finished in this range.',
    },
    {
      kind: 'list',
      heading: 'Compost',
      rows: compost.hasAnything
        ? [compost.headline, ...compost.appliedByArea.map((entry) => `${entry.name}: ${entry.display}`), compost.materialsLine, compost.turnsLine, compost.pilesLine, compost.unmeasuredLine].filter(
            (line): line is string => Boolean(line),
          )
        : [],
      empty: 'No compost recorded in this range.',
    },
    {
      kind: 'list',
      heading: 'Shared, sold and received',
      note: sharing.note ?? undefined,
      rows: sharing.hasAnything
        ? [
            sharing.headline,
            ...sharing.outgoing.map((entry) => `${entry.foodName}: ${entry.display}, ${entry.kinds}`),
            ...sharing.received.map((entry) => `${entry.foodName}: ${entry.display}${entry.from ? `, from ${entry.from}` : ''}`),
            sharing.receivedLine,
          ].filter((line): line is string => Boolean(line))
        : [],
      empty: 'Nothing shared, sold or received in this range.',
    },
  ];
}

/** The whole Eating Variety report, one section per question it answers. */
export function eatingVarietySections(summary: MealVarietySummary): ReportSection[] {
  const { distinct, plants, repeats, rotation, groups, sources, planned, gut } = summary;
  const weekNote = [distinct.headline, plants.headline, summary.weeksWithoutLogging > 0 ? plants.gapNote : null].filter(Boolean).join(' ');
  return [
    {
      kind: 'table',
      heading: 'Different foods and plants, week by week',
      note: weekNote || undefined,
      columns: ['Week', 'Days logged', 'Different foods', 'Different plants'],
      rows: summary.weeks.map((week) => [
        week.partial ? `${week.label} (part week)` : week.label,
        String(week.daysLogged),
        week.foods == null ? 'Not logged' : String(week.foods),
        week.plants == null ? 'Not logged' : String(week.plants),
      ]),
      empty: 'Nothing logged in this range yet.',
    },
    {
      kind: 'list',
      heading: 'Meals that came back most',
      note: repeats.headline,
      rows: repeats.top.map((entry) => describeMealRepeat(entry, repeats.daysLogged)),
      empty: repeats.totalMeals > 0 ? 'No meal name came back more than once in this range.' : 'No meals logged in this range yet.',
    },
    {
      kind: 'list',
      heading: 'Foods that came back most',
      note: [rotation.headline, rotation.concentrationNote].filter(Boolean).join(' '),
      rows: rotation.mostRepeated.map((food) => `${food.foodName}: ${describeRepeat(food)}`),
      empty: 'Nothing logged in this range yet.',
    },
    {
      kind: 'list',
      heading: 'Food groups not logged',
      note: groups.headline,
      rows: groups.present.map((group) => `${group.label.charAt(0).toUpperCase()}${group.label.slice(1)}: ${group.entries} ${group.entries === 1 ? 'entry' : 'entries'}`),
      empty: 'Nothing logged in this range yet.',
    },
    {
      kind: 'table',
      heading: 'Where meals came from',
      note: sources.headline,
      columns: ['Meal', MEAL_SOURCE_LABELS.home, MEAL_SOURCE_LABELS.packaged, MEAL_SOURCE_LABELS.out, MEAL_SOURCE_LABELS.unknown],
      rows: sources.rows.map((row) => [row.label, String(row.counts.home), String(row.counts.packaged), String(row.counts.out), String(row.counts.unknown)]),
      empty: 'No meals logged in this range yet.',
    },
    {
      kind: 'list',
      heading: 'From the plan or decided on the day',
      note: planned.headline,
      rows: planned.daysLine ? [planned.daysLine] : [],
      empty: 'No meals logged in this range yet.',
    },
    {
      kind: 'list',
      heading: 'Foods that feed the gut',
      note: gut.headline,
      rows: gut.names,
      empty: 'None logged in this range.',
    },
  ];
}

/** The shorter version carried by the Nutritionist and Looking Back reports. */
export function eatingVarietyBrief(summary: MealVarietySummary | null): ReportListSection {
  const rows = summary
    ? [
        summary.distinct.headline,
        summary.plants.headline,
        summary.repeats.totalMeals > 0 ? summary.repeats.headline : null,
        summary.repeats.top[0] ? `Came back most: ${describeMealRepeat(summary.repeats.top[0], summary.repeats.daysLogged)}` : null,
        summary.groups.missing.length > 0 && summary.hasAnything ? summary.groups.headline : null,
        summary.sources.total > 0 ? summary.sources.headline : null,
        summary.planned.daysLine,
      ].filter((line): line is string => Boolean(line))
    : [];
  return {
    kind: 'list',
    heading: 'Eating variety',
    note: summary && summary.weeksWithoutLogging > 0 ? (summary.plants.gapNote ?? undefined) : undefined,
    rows: summary?.hasAnything ? rows : [],
    empty: 'No meals logged in this range yet.',
  };
}
