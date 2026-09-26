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
  | 'r-garden';

/** The sections the Overview has always carried, each one a named block so
 *  a narrower report can ask for the ones its reader needs and skip the
 *  work of the rest. */
export type CoreSectionId = 'conditions' | 'nutrients' | 'flags' | 'symptoms' | 'meds' | 'movement' | 'body' | 'rules' | 'labs';

export type ReportKindDef = {
  key: ReportKind;
  label: string;
  icon: string;
  title: string;
  preface: string[];
  help: string;
  core: CoreSectionId[];
};

const SELF_REPORTED = 'It is not a diagnosis. Every figure here is self-reported or read from the phone, and the sections say which.';

export const REPORT_KINDS: ReportKindDef[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: 'document-text-outline',
    title: 'Inside Story: Health Summary',
    preface: ['A plain summary of what was logged in the app during this window, as the person entered it.', SELF_REPORTED],
    help: 'Everything logged over the range in one summary: nutrient intake, foods flagged for your conditions, symptoms and flares, active meds and supplements, movement and sleep, weight and blood pressure, personal rules, and the most recent lab results.',
    core: ['conditions', 'nutrients', 'flags', 'symptoms', 'meds', 'movement', 'body', 'rules', 'labs'],
  },
  {
    key: 'r-doctor',
    label: 'For Your Doctor',
    icon: 'medkit-outline',
    title: 'Inside Story: For the Doctor',
    preface: [
      'What changed since the last visit, and the records a clinician usually asks for, as the person entered them.',
      SELF_REPORTED,
    ],
    help: 'Built for an appointment: the next visit and what changed since the last one with the same provider, symptoms and flares, blood pressure, doses as scheduled and as marked, active meds and supplements, weight, personal rules and the most recent labs. Food detail is left to the Nutritionist report.',
    core: ['conditions', 'symptoms', 'meds', 'body', 'rules', 'labs'],
  },
  {
    key: 'r-nutrition',
    label: 'For a Nutritionist',
    icon: 'nutrition-outline',
    title: 'Inside Story: For the Nutritionist',
    preface: ['What was eaten and drunk over the range, what was planned, and what was noticed after meals, as the person entered it.', SELF_REPORTED],
    help: 'Nutrient intake against targets, foods flagged for your conditions, hydration, planned meals against what was eaten, after-meal reactions and food tests, and the supplements currently taken.',
    core: ['conditions', 'nutrients', 'flags', 'symptoms', 'meds'],
  },
  {
    key: 'r-trainer',
    label: 'For a Trainer',
    icon: 'barbell-outline',
    title: 'Inside Story: For the Trainer',
    preface: [
      'Movement, sleep, weight, blood pressure and hydration over the range. Conditions, medicines and symptoms are left out of this one on purpose; the Overview carries them.',
      SELF_REPORTED,
    ],
    help: 'Steps and sleep from the phone, weight and blood pressure, hydration, nights up, and how the work weeks went. Conditions, medicines and symptoms are left out on purpose.',
    core: ['movement', 'body'],
  },
  {
    key: 'r-month',
    label: 'Looking Back',
    icon: 'time-outline',
    title: 'Inside Story: Looking Back',
    preface: ['How the range went across the parts of life the app follows, read from what was recorded. A stretch with nothing recorded is said as such, never as a zero.'],
    help: 'The range as a whole: meals planned and eaten, doses, appointments, work weeks, reactions, nights, ferments, and what eating and the conditions cost.',
    core: [],
  },
  {
    key: 'r-care',
    label: 'For a Caregiver',
    icon: 'people-outline',
    title: 'Inside Story: For a Caregiver',
    preface: [
      'What someone helping day to day needs in one place: what is on today, the doses and appointments, and the conditions and medicines behind them.',
      'Medicine questions go to the prescriber. Nothing here changes a dose or a time.',
    ],
    help: 'What is on today, doses as scheduled and as marked over the range, appointments, the tracked conditions and every active medicine and supplement.',
    core: ['conditions', 'meds'],
  },
  {
    key: 'r-medical-costs',
    label: 'Medical Costs',
    icon: 'receipt-outline',
    title: 'Inside Story: Medical Costs',
    preface: [
      'Medical bills with a service date in the range, where the insurance plan stands, and what the conditions, supplements and prescriptions cost, from what was recorded.',
      'Anything entered both as a bill and as an expense is counted in both places; nothing here tries to match the two.',
    ],
    help: 'Every medical bill in the range with what was billed, paid by insurance and owed, the plan’s deductible and out-of-pocket standing, and condition, supplement and prescription costs by kind.',
    core: [],
  },
  {
    key: 'r-garden',
    label: 'Garden Record',
    icon: 'leaf-outline',
    title: 'Inside Story: Garden Record',
    preface: ['What the garden gave over the range, how long each crop took, compost made and used, and what was shared, from what was recorded.'],
    help: 'Harvests by crop and by area, how long each grow took against what was expected, compost, what was sold, traded or given, and what is ready or on hand now.',
    core: [],
  },
];

export const REPORT_KIND_BY_KEY: Record<ReportKind, ReportKindDef> = Object.fromEntries(
  REPORT_KINDS.map((def) => [def.key, def]),
) as Record<ReportKind, ReportKindDef>;

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
