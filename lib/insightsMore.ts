// Six Insights lenses that only read, 1.0.52.7: Today, Signals Today,
// Before an Appointment, Money This Month, Kitchen, and Garden.
//
// Direct instruction, 2026-09-25, on the output lenses marked Build on the
// inputs-to-outputs map: "Build all of them." Where Trends reads weeks and
// months, these read the day and the month in hand, which is what Insights
// is for. Each builder takes rows already read (lib/insightsMoreDb.ts) and
// hands back a ReadingView (lib/readingBands.ts), with no I/O, so
// scripts/test_output_lenses.js can run every one of them without a phone.
//
// The same rules hold as on Trends. Things that happened near each other
// are placed side by side and never linked. Nothing scores anybody. A dose
// is described by its time and whether it was marked, and anything about
// the dose itself points back to the prescriber.
import type { CostSummary } from './costOfEating';
import { addDays, daysBetween, shortDate } from './eatingVariety';
import type { BudgetProgress } from './financeAccounts';
import { financeCategoryLabel } from './financeCategories';
import { formatFinanceMoney, type MonthPicture } from './financeCore';
import type { MedicalBill } from './financeHealth';
import { countdownState, daysUntil, describeCountdown, sortCountdowns, type AnyCountdown } from './countdown';
import type { TimelineEntry } from './doseMealTiming';
import { emptyView, plural, type ReadingBand, type ReadingItem, type ReadingRow, type ReadingView } from './readingBands';
import {
  checkStanding,
  describeRoutineStanding,
  reminderFiresOnDay,
  routineDoneToday,
  type DoneCheck,
  type Routine,
} from './routines';
import { formatTime12 } from './timeOfDay';
import { localDay, localHour } from './trendsMore';
import { describeUpkeepStanding, type UpkeepStanding } from './upkeep';

const TAKEN = new Set(['logged', 'partial', 'replaced']);

function clockOf(stamp: string): string | null {
  const match = /T(\d\d):(\d\d)/.exec(stamp);
  if (!match) return null;
  if (/(Z|[+-]\d\d:?\d\d)$/.test(stamp)) {
    const at = new Date(stamp);
    if (Number.isNaN(at.getTime())) return null;
    return formatTime12(`${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`);
  }
  return formatTime12(`${match[1]}:${match[2]}`);
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function whenLabel(stamp: string, today: string): string {
  const day = localDay(stamp);
  const clock = clockOf(stamp);
  const dayWord = day === today ? 'Today' : day === addDays(today, 1) ? 'Tomorrow' : shortDate(day);
  return clock ? `${dayWord} at ${clock}` : dayWord;
}

function statusCaption(status: string, time: string, nowMinutes: number): string {
  if (TAKEN.has(status)) return 'Marked done';
  if (status === 'skipped') return 'Skipped';
  return minutesOf(time) > nowMinutes ? 'Coming up' : 'Not marked yet';
}

function timelineItems(entries: TimelineEntry[], nowMinutes: number): ReadingItem[] {
  return entries.map((entry) => {
    if (entry.kind === 'meal') {
      return {
        key: `meal-${entry.meal.id}`,
        title: `${formatTime12(entry.time)}  ${entry.meal.title}`,
        caption: statusCaption(entry.meal.status, entry.time, nowMinutes),
      };
    }
    const clash = entry.notes.find((note) => note.kind === 'clash' || note.kind === 'missing');
    const parts = [statusCaption(entry.dose.status, entry.time, nowMinutes)];
    if (clash) parts.push(`${clash.headline} (Schedules > Today's Meals has the detail)`);
    return {
      key: `dose-${entry.dose.id}`,
      title: `${formatTime12(entry.time)}  ${entry.dose.treatmentName}${entry.dose.doseLabel ? `, ${entry.dose.doseLabel}` : ''}`,
      caption: parts.join(' · '),
    };
  });
}

// ---------------------------------------------------------------------------
// 1. Today
// ---------------------------------------------------------------------------

export type TodayAppointment = {
  scheduledFor: string;
  title: string;
  providerName: string | null;
  status: string;
};

export type TodayInputs = {
  today: string;
  now: Date;
  timeline: TimelineEntry[];
  routines: Routine[];
  checks: DoneCheck[];
  upkeep: UpkeepStanding[];
  appointments: TodayAppointment[];
  countdowns: AnyCountdown[];
  // Meals and doses from yesterday still marked planned.
  yesterdayOpen: { scheduledFor: string; title: string; itemType: string }[];
  captureWaiting: number;
};

export function buildTodayView(input: TodayInputs): ReadingView {
  const { today, now } = input;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const bands: ReadingBand[] = [];

  if (input.timeline.length > 0) {
    const meals = input.timeline.filter((entry) => entry.kind === 'meal').length;
    const doses = input.timeline.length - meals;
    const open = input.timeline.filter((entry) => {
      const status = entry.kind === 'meal' ? entry.meal.status : entry.dose.status;
      return status === 'planned';
    }).length;
    bands.push({
      id: 'day',
      title: 'Meals and doses today',
      icon: 'time-outline',
      count: input.timeline.length,
      lines: [
        `${plural(meals, 'meal')} and ${plural(doses, 'dose')} on today's clock, ${open} not marked yet.`,
      ],
      items: timelineItems(input.timeline, nowMinutes),
      notes: ['Marking a meal or dose happens on Schedules. This only reads what is there.'],
    });
  }

  const dueRoutines = input.routines.filter((routine) => {
    if (!routine.active) return false;
    if (routineDoneToday(routine, now)) return false;
    return routine.reminderOn ? reminderFiresOnDay(routine, now) : true;
  });
  const waitingChecks = input.checks
    .filter((check) => check.active)
    .map((check) => checkStanding(check, now))
    .filter((standing) => standing.doneThisPeriod === false);
  if (dueRoutines.length > 0 || waitingChecks.length > 0) {
    bands.push({
      id: 'routines',
      title: 'Routines and checks',
      icon: 'list-outline',
      count: dueRoutines.length + waitingChecks.length,
      lines: [
        `${plural(dueRoutines.length, 'routine')} not run yet today, ${plural(waitingChecks.length, 'check')} not marked for this period.`,
      ],
      items: [
        ...dueRoutines.map((routine) => ({
          key: `routine-${routine.id}`,
          title: routine.name,
          caption: describeRoutineStanding(routine, now),
        })),
        ...waitingChecks.map((standing) => ({
          key: `check-${standing.check.id}`,
          title: standing.check.name,
          caption: standing.line,
        })),
      ],
    });
  }

  const upkeep = input.upkeep
    .filter((standing) => standing.item.active)
    .filter((standing) => standing.overdue || (standing.daysAway !== null && standing.daysAway <= 14))
    .sort((a, b) => (a.daysAway ?? 0) - (b.daysAway ?? 0));
  if (upkeep.length > 0) {
    bands.push({
      id: 'upkeep',
      title: 'Upkeep due',
      icon: 'construct-outline',
      count: upkeep.length,
      lines: [`${plural(upkeep.length, 'thing')} past due or due in the next two weeks.`],
      items: upkeep.map((standing) => ({
        key: `upkeep-${standing.item.id}`,
        title: standing.item.name,
        caption: describeUpkeepStanding(standing),
      })),
    });
  }

  const weekOut = addDays(today, 7);
  const appointments = input.appointments
    .filter((appointment) => appointment.status !== 'skipped')
    .filter((appointment) => {
      const day = localDay(appointment.scheduledFor);
      return day >= today && day <= weekOut;
    })
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  if (appointments.length > 0) {
    bands.push({
      id: 'appointments',
      title: 'Appointments this week',
      icon: 'calendar-outline',
      count: appointments.length,
      lines: [`${plural(appointments.length, 'appointment')} between today and ${shortDate(weekOut)}.`],
      items: appointments.map((appointment, index) => ({
        key: `appt-${index}-${appointment.scheduledFor}`,
        title: appointment.title,
        caption: [whenLabel(appointment.scheduledFor, today), appointment.providerName].filter(Boolean).join(' · '),
      })),
    });
  }

  const counters = sortCountdowns(
    input.countdowns.filter((countdown) => {
      const state = countdownState(countdown, today);
      if (state === 'done') return false;
      return state !== 'ahead' || daysUntil(countdown, today) <= 7;
    }),
    today,
  );
  if (counters.length > 0) {
    bands.push({
      id: 'counters',
      title: 'Days Until, landing soon',
      icon: 'hourglass-outline',
      count: counters.length,
      lines: [`${plural(counters.length, 'counter')} landing within a week, today, or already over.`],
      items: counters.map((countdown) => ({
        key: `count-${countdown.kind}-${countdown.id}`,
        title: countdown.where ? `${countdown.name} (${countdown.where})` : countdown.name,
        caption: describeCountdown(countdown, today),
      })),
    });
  }

  if (input.yesterdayOpen.length > 0 || input.captureWaiting > 0) {
    const lines: string[] = [];
    if (input.yesterdayOpen.length > 0) {
      lines.push(`${plural(input.yesterdayOpen.length, 'meal or dose', 'meals and doses')} from yesterday still not marked. Marking one late still counts it.`);
    }
    if (input.captureWaiting > 0) {
      lines.push(`${plural(input.captureWaiting, 'note')} in the capture inbox not sorted yet.`);
    }
    bands.push({
      id: 'open',
      title: 'Still open from yesterday',
      icon: 'return-down-back-outline',
      count: input.yesterdayOpen.length + input.captureWaiting,
      lines,
      items: input.yesterdayOpen.map((item, index) => ({
        key: `open-${index}-${item.scheduledFor}`,
        title: item.title,
        caption: whenLabel(item.scheduledFor, today),
      })),
    });
  }

  if (bands.length === 0) {
    return emptyView('Nothing on today yet. Meals and doses on Schedules, routines and upkeep on Life, and appointments all show here as they are added.');
  }
  return { hasAnything: true, empty: '', bands };
}

// ---------------------------------------------------------------------------
// 2. Signals Today
// ---------------------------------------------------------------------------

export type SignalCheckin = {
  loggedAt: string;
  checkinType: string;
  valence: string | null;
  severity: number | null;
  notes: string | null;
  foodName: string | null;
  tags: string[];
};

export type SignalsInputs = {
  today: string;
  timeline: TimelineEntry[];
  checkins: SignalCheckin[];
  bloodPressure: { loggedAt: string; systolic: number; diastolic: number; pulse: number | null }[];
};

const CHECKIN_TYPE_WORDS: Record<string, string> = {
  flare: 'Flare',
  post_meal: 'After a meal',
  general: 'Check-in',
  food_trial_daily: 'Food trial day',
};

const VALENCE_WORDS: Record<string, string> = {
  positive: 'Felt good',
  negative: 'Felt off',
  neutral: 'Noted',
};

const SEVERITY_WORDS: Record<number, string> = { 1: 'mild', 2: 'moderate', 3: 'severe', 4: 'very severe' };

function checkinTitle(checkin: SignalCheckin): string {
  const type = CHECKIN_TYPE_WORDS[checkin.checkinType] ?? 'Check-in';
  const valence = checkin.valence ? VALENCE_WORDS[checkin.valence] ?? null : null;
  const severity = checkin.severity ? SEVERITY_WORDS[checkin.severity] ?? null : null;
  return [type, valence, severity].filter(Boolean).join(', ');
}

function checkinCaption(checkin: SignalCheckin): string {
  return [
    clockOf(checkin.loggedAt),
    checkin.foodName ? `about ${checkin.foodName}` : null,
    checkin.tags.length > 0 ? checkin.tags.join(', ') : null,
    checkin.notes,
  ]
    .filter(Boolean)
    .join(' · ');
}

function stampMinutes(stamp: string): number {
  const hour = localHour(stamp) ?? 0;
  if (/(Z|[+-]\d\d:?\d\d)$/.test(stamp)) {
    const at = new Date(stamp);
    return Number.isNaN(at.getTime()) ? hour * 60 : at.getHours() * 60 + at.getMinutes();
  }
  const match = /T\d\d:(\d\d)/.exec(stamp);
  return hour * 60 + (match ? Number(match[1]) : 0);
}

export function buildSignalsView(input: SignalsInputs): ReadingView {
  const checkins = input.checkins.filter((checkin) => localDay(checkin.loggedAt) === input.today);
  const readings = input.bloodPressure.filter((reading) => localDay(reading.loggedAt) === input.today);
  if (checkins.length === 0 && readings.length === 0) {
    return emptyView('No check-ins or blood pressure readings today yet. Signals is where they go in, and they show here beside the meals and doses around them.');
  }

  type Moment = { minutes: number; item: ReadingItem };
  const moments: Moment[] = [];
  for (const entry of input.timeline) {
    const minutes = minutesOf(entry.time);
    if (entry.kind === 'meal') {
      moments.push({ minutes, item: { key: `m-${entry.meal.id}`, title: `${formatTime12(entry.time)}  Meal: ${entry.meal.title}` } });
    } else {
      moments.push({ minutes, item: { key: `d-${entry.dose.id}`, title: `${formatTime12(entry.time)}  Dose: ${entry.dose.treatmentName}` } });
    }
  }
  checkins.forEach((checkin, index) => {
    moments.push({
      minutes: stampMinutes(checkin.loggedAt),
      item: { key: `c-${index}`, title: `${clockOf(checkin.loggedAt) ?? ''}  ${checkinTitle(checkin)}`.trim(), caption: checkin.notes ?? undefined },
    });
  });
  readings.forEach((reading, index) => {
    moments.push({
      minutes: stampMinutes(reading.loggedAt),
      item: {
        key: `b-${index}`,
        title: `${clockOf(reading.loggedAt) ?? ''}  Blood pressure ${reading.systolic}/${reading.diastolic}${reading.pulse ? `, pulse ${reading.pulse}` : ''}`.trim(),
      },
    });
  });
  moments.sort((a, b) => a.minutes - b.minutes);

  const bands: ReadingBand[] = [
    {
      id: 'clock',
      title: 'The day by the clock',
      icon: 'time-outline',
      count: moments.length,
      lines: ['Meals, doses, check-ins and readings in the order they happened today.'],
      items: moments.map((moment) => moment.item),
      notes: ['These are placed side by side. Nothing here says one led to another; Pattern Finder on Trends is where repeated patterns are counted, and even there it is a sample of one.'],
    },
  ];

  if (checkins.length > 0) {
    bands.push({
      id: 'checkins',
      title: 'Check-ins today',
      icon: 'pulse-outline',
      count: checkins.length,
      lines: [`${plural(checkins.length, 'check-in')} so far today.`],
      items: checkins.map((checkin, index) => ({
        key: `ci-${index}`,
        title: checkinTitle(checkin),
        caption: checkinCaption(checkin),
      })),
    });
  }

  if (readings.length > 0) {
    bands.push({
      id: 'bp',
      title: 'Blood pressure today',
      icon: 'heart-outline',
      count: readings.length,
      lines: [`${plural(readings.length, 'reading')} today. Trends > Blood Pressure has how they compare with your usual range.`],
      items: readings.map((reading, index) => ({
        key: `bp-${index}`,
        title: `${reading.systolic}/${reading.diastolic}${reading.pulse ? `, pulse ${reading.pulse}` : ''}`,
        caption: clockOf(reading.loggedAt) ?? undefined,
      })),
    });
  }

  return { hasAnything: true, empty: '', bands };
}

// ---------------------------------------------------------------------------
// 3. Before an Appointment
// ---------------------------------------------------------------------------

export type AppointmentInputs = {
  today: string;
  appointments: TodayAppointment[];
  labs: { displayName: string; value: number; unit: string | null; low: number | null; high: number | null; testedAt: string }[];
  flares: { loggedAt: string; severity: number | null; notes: string | null }[];
  treatments: {
    name: string;
    treatmentType: string;
    startDate: string | null;
    endDate: string | null;
    updatedAt: string | null;
    doseAmount: number | null;
    doseUnit: string | null;
  }[];
  healthNotes: { text: string; createdAt: string; status: string }[];
};

// Two appointments belong to the same provider when the provider name
// matches, or, where none was typed, the title does.
function providerKey(appointment: TodayAppointment): string {
  return (appointment.providerName || appointment.title).trim().toLowerCase();
}

function labLine(lab: AppointmentInputs['labs'][number]): string {
  const unit = lab.unit ? ` ${lab.unit}` : '';
  if (lab.high !== null && lab.value > lab.high) return `${lab.value}${unit}, above the range printed by the lab`;
  if (lab.low !== null && lab.value < lab.low) return `${lab.value}${unit}, below the range printed by the lab`;
  if (lab.low !== null || lab.high !== null) return `${lab.value}${unit}, inside the range printed by the lab`;
  return `${lab.value}${unit}`;
}

export function buildAppointmentView(input: AppointmentInputs): ReadingView {
  const { today } = input;
  const upcoming = input.appointments
    .filter((appointment) => appointment.status === 'planned' && localDay(appointment.scheduledFor) >= today)
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  const next = upcoming[0];
  if (!next) {
    return emptyView('No appointment coming up. Add one on Schedules > Appointments and this gathers what changed since the last visit with that provider.');
  }

  const key = providerKey(next);
  const previous = input.appointments
    .filter((appointment) => providerKey(appointment) === key && localDay(appointment.scheduledFor) < today)
    .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor))[0];
  const since = previous ? localDay(previous.scheduledFor) : addDays(today, -90);
  const sinceWords = previous
    ? `since the last visit on ${shortDate(since)}`
    : `in the last 90 days, since no earlier visit with ${next.providerName || next.title} is recorded`;

  const bands: ReadingBand[] = [
    {
      id: 'next',
      title: 'The appointment',
      icon: 'calendar-outline',
      lines: [
        `${next.title}, ${whenLabel(next.scheduledFor, today)}${next.providerName ? ` with ${next.providerName}` : ''}.`,
        `Everything below is what was recorded ${sinceWords}.`,
      ],
    },
  ];

  const labs = input.labs.filter((lab) => localDay(lab.testedAt) > since);
  bands.push({
    id: 'labs',
    title: 'New lab results',
    icon: 'flask-outline',
    count: labs.length,
    lines: [labs.length > 0 ? `${plural(labs.length, 'result')} recorded ${sinceWords}.` : `No lab results recorded ${sinceWords}.`],
    items: labs.map((lab, index) => ({
      key: `lab-${index}`,
      title: lab.displayName,
      caption: `${labLine(lab)} · ${shortDate(localDay(lab.testedAt))}`,
    })),
    notes: labs.length > 0 ? ['The range is the one the lab printed. What a result means for you is a question for this visit.'] : undefined,
  });

  const flares = input.flares.filter((flare) => localDay(flare.loggedAt) > since);
  bands.push({
    id: 'flares',
    title: 'Flares',
    icon: 'flame-outline',
    count: flares.length,
    lines: [flares.length > 0 ? `${plural(flares.length, 'flare')} logged ${sinceWords}.` : `No flares logged ${sinceWords}.`],
    items: flares.map((flare, index) => ({
      key: `flare-${index}`,
      title: `${shortDate(localDay(flare.loggedAt))}${flare.severity ? `, ${SEVERITY_WORDS[flare.severity] ?? ''}` : ''}`.replace(/, $/, ''),
      caption: flare.notes ?? undefined,
    })),
  });

  const changes: ReadingItem[] = [];
  input.treatments.forEach((treatment, index) => {
    const dose = treatment.doseAmount !== null ? `${treatment.doseAmount}${treatment.doseUnit ? ` ${treatment.doseUnit}` : ''}` : null;
    if (treatment.startDate && treatment.startDate > since && treatment.startDate <= today) {
      changes.push({ key: `start-${index}`, title: `Started ${treatment.name}`, caption: [shortDate(treatment.startDate), dose].filter(Boolean).join(' · ') });
    }
    if (treatment.endDate && treatment.endDate > since && treatment.endDate <= today) {
      changes.push({ key: `end-${index}`, title: `Ended ${treatment.name}`, caption: shortDate(treatment.endDate) });
    } else if (
      treatment.updatedAt &&
      localDay(treatment.updatedAt) > since &&
      !(treatment.startDate && treatment.startDate > since)
    ) {
      changes.push({
        key: `edit-${index}`,
        title: `${treatment.name}, details edited`,
        caption: [`on ${shortDate(localDay(treatment.updatedAt))}`, dose ? `now ${dose}` : null].filter(Boolean).join(' · '),
      });
    }
  });
  bands.push({
    id: 'meds',
    title: 'Medicine and supplement changes',
    icon: 'medkit-outline',
    count: changes.length,
    lines: [changes.length > 0 ? `${plural(changes.length, 'change')} recorded ${sinceWords}.` : `No changes to medicines or supplements recorded ${sinceWords}.`],
    items: changes,
    notes: ['This lists what was recorded on Life > My Meds. Any change to a prescription is the prescriber’s to make.'],
  });

  const questions = input.healthNotes.filter((note) => note.status !== 'done' && localDay(note.createdAt) > since);
  bands.push({
    id: 'questions',
    title: 'Questions noted',
    icon: 'help-circle-outline',
    count: questions.length,
    lines: [
      questions.length > 0
        ? `${plural(questions.length, 'health note')} from the capture inbox not marked done.`
        : 'No health notes waiting in the capture inbox. Anything captured and sorted to health shows here.',
    ],
    items: questions.map((note, index) => ({ key: `q-${index}`, title: note.text, caption: shortDate(localDay(note.createdAt)) })),
  });

  if (upcoming.length > 1) {
    bands.push({
      id: 'later',
      title: 'Other appointments coming up',
      icon: 'albums-outline',
      count: upcoming.length - 1,
      lines: [`${plural(upcoming.length - 1, 'more appointment')} after this one.`],
      items: upcoming.slice(1, 9).map((appointment, index) => ({
        key: `later-${index}`,
        title: appointment.title,
        caption: [whenLabel(appointment.scheduledFor, today), appointment.providerName].filter(Boolean).join(' · '),
      })),
    });
  }

  return { hasAnything: true, empty: '', bands };
}

// ---------------------------------------------------------------------------
// 4. Money This Month
// ---------------------------------------------------------------------------

export type MoneyInputs = {
  month: string;
  today: string;
  picture: MonthPicture;
  budgets: BudgetProgress[];
  bills: MedicalBill[];
  planLine: string | null;
  cost: CostSummary | null;
};

export function buildMoneyView(input: MoneyInputs): ReadingView {
  const { picture } = input;
  const monthBills = input.bills.filter((bill) => bill.serviceDate.slice(0, 7) === input.month);
  const unpaid = input.bills.filter((bill) => bill.status === 'unpaid');
  const hasMoney = picture.loggedSpend > 0 || picture.loggedIncome > 0 || picture.knownSpendTotal > 0 || input.budgets.length > 0;
  if (!hasMoney && monthBills.length === 0 && unpaid.length === 0 && !(input.cost && input.cost.hasAnything)) {
    return emptyView('Nothing recorded this month yet. Money entered on Life > Finances, medical bills, and grocery prices fill this in.');
  }

  const bands: ReadingBand[] = [];
  const categories = picture.byCategory.filter((row) => row.monthly > 0).sort((a, b) => b.monthly - a.monthly);
  const top = categories[0]?.monthly ?? 0;
  const lines = [
    `${formatFinanceMoney(picture.knownSpendTotal)} going out that the app can account for so far this month, and ${formatFinanceMoney(picture.loggedIncome)} coming in.`,
  ];
  if (picture.incompleteRecords > 0) {
    lines.push(`${plural(picture.incompleteRecords, 'record')} with no amount, so the total is a floor rather than the whole month.`);
  }
  bands.push({
    id: 'month',
    title: 'This month so far',
    icon: 'wallet-outline',
    lines,
    rows: categories.map((row) => ({
      key: row.category,
      label: financeCategoryLabel(row.category),
      value: top > 0 ? row.monthly : null,
      display: formatFinanceMoney(row.monthly),
    })),
    notes: ['Spending this app does not see (cash, cards nobody entered) is not in here.'],
  });

  if (input.budgets.length > 0) {
    bands.push({
      id: 'budgets',
      title: 'Against your budgets',
      icon: 'speedometer-outline',
      count: input.budgets.length,
      lines: [`${plural(input.budgets.filter((budget) => budget.overspent).length, 'budget')} past its limit this month.`],
      rows: input.budgets.map((budget) => ({
        key: budget.category,
        label: financeCategoryLabel(budget.category),
        value: budget.limit > 0 ? Math.round(budget.fraction * 100) : null,
        display: `${formatFinanceMoney(budget.spent)} of ${formatFinanceMoney(budget.limit)}`,
      })),
    });
  }

  if (monthBills.length > 0 || unpaid.length > 0 || input.planLine) {
    const owed = unpaid.reduce((sum, bill) => sum + Math.max(0, (bill.youOwe ?? 0) - (bill.paidAmount ?? 0)), 0);
    const billLines = [
      `${plural(monthBills.length, 'medical bill')} for care this month, ${plural(unpaid.length, 'bill')} still unpaid${owed > 0 ? `, ${formatFinanceMoney(owed)} between them` : ''}.`,
    ];
    if (input.planLine) billLines.push(input.planLine);
    bands.push({
      id: 'medical',
      title: 'Medical bills and insurance',
      icon: 'medkit-outline',
      count: unpaid.length,
      lines: billLines,
      items: unpaid.slice(0, 10).map((bill) => ({
        key: `bill-${bill.id}`,
        title: bill.provider || bill.description || 'Medical bill',
        caption: [shortDate(bill.serviceDate), bill.youOwe !== null ? `${formatFinanceMoney(bill.youOwe)} owed` : 'no amount recorded'].join(' · '),
      })),
    });
  }

  const cost = input.cost;
  if (cost && cost.hasAnything) {
    const costLines: string[] = [];
    if (cost.food.hasAnything) costLines.push(`Food: ${cost.food.headline}`);
    if (cost.supplements.hasAnything) costLines.push(`Supplements: ${cost.supplements.headline}`);
    if (cost.condition.hasAnything) costLines.push(`Health costs: ${cost.condition.headline}`);
    if (costLines.length > 0) {
      bands.push({
        id: 'eating',
        title: 'Food, supplements and prescriptions',
        icon: 'basket-outline',
        lines: costLines,
        rows: cost.condition.byKind.map((slice) => ({
          key: slice.name,
          label: slice.name,
          value: slice.amount > 0 ? slice.amount : null,
          display: slice.display,
        })),
        notes: ['Trends > What It Costs follows the same figures month by month.'],
      });
    }
  }

  return { hasAnything: true, empty: '', bands };
}

// ---------------------------------------------------------------------------
// 5. Kitchen
// ---------------------------------------------------------------------------

export type KitchenInputs = {
  today: string;
  items: {
    id: string;
    foodName: string;
    category: string | null;
    quantity: number | null;
    unit: string | null;
    quantityRemaining: number | null;
    location: string | null;
    addedAt: string;
  }[];
  recipes: { key: string; name: string; kind: string; covered: number; total: number; full: boolean }[];
};

// No expiry date is kept on kitchen items, so "getting old" is only ever
// the item's age, said as an age and never as spoiled.
const OLD_AFTER_DAYS = 30;

function amountText(value: number | null, unit: string | null): string | null {
  if (value === null) return null;
  const rounded = Math.round(value * 10) / 10;
  return unit ? `${rounded} ${unit}` : String(rounded);
}

export function buildKitchenView(input: KitchenInputs): ReadingView {
  if (input.items.length === 0) {
    return emptyView('Nothing recorded in the kitchen yet. Life > Kitchen is where what is on hand goes in, and a shopping trip can add it for you.');
  }
  const bands: ReadingBand[] = [];

  const byCategory = new Map<string, KitchenInputs['items']>();
  for (const item of input.items) {
    const category = item.category || 'Other';
    byCategory.set(category, [...(byCategory.get(category) ?? []), item]);
  }
  const groups = [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  bands.push({
    id: 'onhand',
    title: 'On hand',
    icon: 'file-tray-stacked-outline',
    count: input.items.length,
    lines: [`${plural(input.items.length, 'thing')} on hand across ${plural(groups.length, 'group')}.`],
    items: groups.map(([category, items]) => ({
      key: `cat-${category}`,
      title: `${category} (${items.length})`,
      caption: items
        .map((item) => item.foodName)
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 10)
        .join(', ') + (items.length > 10 ? `, and ${items.length - 10} more` : ''),
    })),
  });

  const low = input.items.filter(
    (item) => item.quantity !== null && item.quantity > 0 && item.quantityRemaining !== null && item.quantityRemaining / item.quantity <= 0.25,
  );
  const old = input.items
    .map((item) => ({ item, age: daysBetween(localDay(item.addedAt), input.today) }))
    .filter((entry) => entry.age >= OLD_AFTER_DAYS)
    .sort((a, b) => b.age - a.age);
  if (low.length > 0 || old.length > 0) {
    bands.push({
      id: 'low',
      title: 'Running low or getting old',
      icon: 'alert-circle-outline',
      count: low.length + old.length,
      lines: [
        `${plural(low.length, 'thing')} down to a quarter or less of what was bought, ${plural(old.length, 'thing')} on hand for ${OLD_AFTER_DAYS} days or more.`,
      ],
      items: [
        ...low.map((item) => ({
          key: `low-${item.id}`,
          title: item.foodName,
          caption: `${amountText(item.quantityRemaining, item.unit)} left of ${amountText(item.quantity, item.unit)}`,
        })),
        ...old.slice(0, 15).map(({ item, age }) => ({
          key: `old-${item.id}`,
          title: item.foodName,
          caption: [`on hand ${plural(age, 'day')}`, item.location].filter(Boolean).join(' · '),
        })),
      ],
      notes: ['No use-by date is kept, so age is only how long ago it was added. Look before you use it.'],
    });
  }

  const full = input.recipes.filter((recipe) => recipe.full).sort((a, b) => a.name.localeCompare(b.name));
  const partly = input.recipes
    .filter((recipe) => !recipe.full && recipe.covered > 0 && recipe.total > 0 && recipe.covered / recipe.total >= 0.5)
    .sort((a, b) => b.covered / b.total - a.covered / a.total || a.name.localeCompare(b.name));
  if (input.recipes.length > 0) {
    bands.push({
      id: 'recipes',
      title: 'What the kitchen covers',
      icon: 'restaurant-outline',
      count: full.length,
      lines: [
        `${plural(full.length, 'saved recipe')} with every ingredient on hand, ${plural(partly.length, 'more')} with at least half.`,
      ],
      items: [
        ...full.slice(0, 12).map((recipe) => ({ key: `full-${recipe.key}`, title: recipe.name, caption: `${recipe.kind} · everything on hand` })),
        ...partly.slice(0, 12).map((recipe) => ({
          key: `part-${recipe.key}`,
          title: recipe.name,
          caption: `${recipe.kind} · ${recipe.covered} of ${recipe.total} ingredients on hand`,
        })),
      ],
      notes: ['Amounts are counted against what is recorded as left, so an item nobody updated can read as more than there is.'],
    });
  }

  return { hasAnything: true, empty: '', bands };
}

// ---------------------------------------------------------------------------
// 6. Garden
// ---------------------------------------------------------------------------

export type GardenInputs = {
  today: string;
  plantings: { foodName: string; plotName: string | null; expectedStart: string | null; expectedEnd: string | null; status: string }[];
  onHand: { foodName: string; quantityRemaining: number; unit: string; harvestedOn: string; plotName: string | null }[];
  weekUses: { foodName: string; quantity: number; unit: string; usedOn: string }[];
  // One row per nutrient the garden supplied this week, against seven days
  // of the person's target.
  nutrientShare: { displayName: string; unit: string; fromGarden: number; weekTarget: number }[];
  // Uses whose food could not be turned into grams or had no nutrient rows.
  usesUncounted: number;
};

export function buildGardenView(input: GardenInputs): ReadingView {
  const { today } = input;
  const horizon = addDays(today, 21);
  const coming = input.plantings
    .filter((planting) => planting.status === 'growing' && planting.expectedStart)
    .filter((planting) => (planting.expectedStart as string) <= horizon && (!planting.expectedEnd || planting.expectedEnd >= today))
    .sort((a, b) => (a.expectedStart as string).localeCompare(b.expectedStart as string));
  if (coming.length === 0 && input.onHand.length === 0 && input.weekUses.length === 0) {
    return emptyView('Nothing ready or on hand yet. A planting with an expected harvest date, or a harvest logged on Garden, shows here.');
  }
  const bands: ReadingBand[] = [];

  if (coming.length > 0) {
    const ready = coming.filter((planting) => (planting.expectedStart as string) <= today).length;
    bands.push({
      id: 'ready',
      title: 'Ready or coming ready',
      icon: 'leaf-outline',
      count: coming.length,
      lines: [`${plural(ready, 'planting')} inside its expected harvest window now, ${plural(coming.length - ready, 'more')} expected within three weeks.`],
      items: coming.map((planting, index) => {
        const start = planting.expectedStart as string;
        const when = start <= today
          ? planting.expectedEnd ? `window open until ${shortDate(planting.expectedEnd)}` : 'window open'
          : `expected from ${shortDate(start)}`;
        return { key: `pl-${index}`, title: planting.foodName, caption: [when, planting.plotName].filter(Boolean).join(' · ') };
      }),
      notes: ['The window is the one entered with the planting. The plant decides.'],
    });
  }

  if (input.onHand.length > 0) {
    bands.push({
      id: 'onhand',
      title: 'Harvests on hand',
      icon: 'basket-outline',
      count: input.onHand.length,
      lines: [`${plural(input.onHand.length, 'harvest')} with some still on hand.`],
      items: input.onHand.map((harvest, index) => ({
        key: `h-${index}`,
        title: harvest.foodName,
        caption: [
          `${amountText(harvest.quantityRemaining, harvest.unit)} left`,
          `picked ${shortDate(harvest.harvestedOn)}`,
          harvest.plotName,
        ].filter(Boolean).join(' · '),
      })),
    });
  }

  const weekStart = addDays(today, -6);
  const lines = [
    input.weekUses.length > 0
      ? `${plural(input.weekUses.length, 'use')} of garden food in meals from ${shortDate(weekStart)} to today.`
      : `No garden food recorded in a meal from ${shortDate(weekStart)} to today.`,
  ];
  const shares: ReadingRow[] = input.nutrientShare
    .filter((row) => row.fromGarden > 0 && row.weekTarget > 0)
    .map((row) => ({ ...row, percent: (row.fromGarden / row.weekTarget) * 100 }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 12)
    .map((row) => ({
      key: row.displayName,
      label: row.displayName,
      value: Math.round(row.percent),
      display: `${Math.round(row.percent)}% of the week (${Math.round(row.fromGarden * 10) / 10} ${row.unit})`,
    }));
  const notes = ['A share of seven days of your target, counted from the amount taken off the harvest for each meal.'];
  if (input.usesUncounted > 0) {
    notes.push(`${plural(input.usesUncounted, 'use')} recorded in a unit that does not turn into grams, so left out of the share.`);
  }
  if (input.weekUses.length > 0) {
    bands.push({
      id: 'share',
      title: 'What the garden supplied this week',
      icon: 'nutrition-outline',
      count: input.weekUses.length,
      lines,
      rows: shares.length > 0 ? shares : undefined,
      items: shares.length === 0
        ? input.weekUses.map((use, index) => ({ key: `u-${index}`, title: use.foodName, caption: `${amountText(use.quantity, use.unit)} · ${shortDate(use.usedOn)}` }))
        : undefined,
      notes,
    });
  }

  return { hasAnything: true, empty: '', bands };
}
