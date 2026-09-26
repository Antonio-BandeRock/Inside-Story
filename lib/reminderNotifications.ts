import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getCheckinReminderInputs } from './checkinReminderDb';
import { seriesReminderBody, seriesReminderTitle } from './photoSeries';
import { listSeriesReminderInputs } from './photoSeriesDb';
import { addCompostEvent, listCompostPilesToTurn } from './compostDb';
import { listReminderCandidates, recordCheckin, setScheduleItemStatus, type ReminderCandidate } from './db';
import {
  ACTION_TEXT_INPUT,
  AFTER_MEAL_MINUTES,
  ALL_REMINDER_CATEGORY_KEYS,
  answeredConfirmation,
  answerLine,
  CATEGORY_ACTIONS,
  categoryKeyFor,
  localDay,
  planAfterMealNudge,
  planDailyCheckins,
  planReminderAction,
  REMINDER_CATEGORY_IDS,
  reminderActionTitle,
  type ReminderActionPlan,
} from './reminderActions';
import {
  checkinTimeOf,
  getReminderPreferences,
  isNudgeUntilDoneEnabled,
  isReminderKindEnabled,
  type ReminderKindKey,
} from './reminderPreferences';
import {
  datedReminderDays,
  DATED_KIND_PREFIX,
  describeDatedDue,
  NUDGE_FOLLOW_UP_MINUTES,
  REMINDER_HOUR,
} from './reminderSchedule';
import {
  listDatedReminderSources,
  type DatedReminderLens,
  type DatedReminderSource,
} from './reminderSources';
import { describeReminderDays, nextReminderTimes, type Routine } from './routines';
import { listRoutineReminders } from './routinesDb';
import { formatTime12 } from './timeOfDay';
import { quietDecision, SNOOZE_MINUTES } from './quietHours';
import { markUpkeepDone, listUpkeepItems } from './upkeepDb';

// Local reminders: the scheduled doses in Schedules > Meds, the visits in
// Schedules > Appointments, the meals and drinks on the schedule, the work
// planned in Garden > Upcoming Tasks, since 2026-09-16 the bills, upkeep and
// work benefits in Life, and since 2026-09-21 the Days Until counters under
// garden areas, fire as phone notifications, entirely on the device, through expo-notifications (compiled into the 1.0.37.33
// rebuild). Nothing here talks to a server; the content-blind push relay the
// architecture notes describe is a separate, later piece.
//
// Eleven kinds, each with its own switch in Profile > Reminders (see
// lib/reminderPreferences.ts for why drinks default off and the rest default
// on). A kind switched off is dropped before anything is scheduled, so
// turning one off clears what it had already queued at the next reconcile
// rather than leaving a week of stale notifications behind.
//
// TWO SHAPES OF REMINDER, and the difference is the whole of 1.0.39.8.
//
// A TIMED one comes from a schedule_items row, which carries a wall-clock
// time. Doses, appointments, meals, drinks and garden tasks are all of these,
// which is why garden work cost almost nothing to add: it was already a
// schedule_items row and only ever needed a kind.
//
// A DATED one comes from a table in Life that keeps a date and no time at
// all: a bill due on the 5th, a service due six months after it was last
// done, a work allowance that resets with money still in it. There is no
// moment to fire at, so one gets picked (REMINDER_HOUR), and firing on the
// day would be useless anyway, so each kind speaks up a stated number of days
// ahead instead. lib/reminderSchedule.ts holds those lead days and the
// reasoning behind each; lib/reminderSources.ts reads the three tables.
//
// Meals and drinks are one item_type in the schedule and are told apart by
// meal_type, which is why they arrive here in the same query and split into
// two kinds only at buildPlanned. A meal fires at the time it was planned
// for, not ahead of it: the case this was asked for is someone who did not
// notice they had skipped eating, and a nudge an hour early answers a
// different question. An appointment keeps its hour of lead because getting
// there is the part that needs the warning.
//
// NUDGING, the second half of the same request: "a reminder that comes back
// until it is marked done, rather than firing once and being gone. Someone
// who swipes a notification away with their hands full has lost the thought
// entirely, so one-shot is the same as none." Off by default and switched on
// in Profile > Reminders, because for anybody else that is nagging. What it
// does depends on the shape: a timed reminder comes back three times over the
// next hour and a half, and an upkeep item keeps arriving every morning while
// it is overdue. It reaches only the kinds where the app can honestly tell
// the thing was dealt with, which leaves out appointments (nothing marks one
// done), bills (nothing here records that one month of one bill got paid) and
// benefits (used down gradually rather than finished).
//
// How it stays correct without hooking every create/edit/delete path: the
// source tables are the one truth, and syncReminderNotifications()
// reconciles the phone's pending notifications against them. It runs when the
// app starts, every time it returns to the foreground, and after either
// schedule lens finishes loading (every mutation in those lenses ends in a
// reload). A notification exists only while its row still says the thing is
// outstanding, so marking a dose taken, cancelling an appointment,
// deactivating a med, paying off a service or removing a series all drop the
// reminder at the next sync, and the rolling-window series generator in
// lib/db.ts keeps new occurrences flowing in. That is also what stops a
// nudge: marking something done, in the app or from a button on the
// notification, is followed by the reconcile, so the two happen together.
//
// Freshness, per the architecture note that a reminder should say what it
// was based on: every notification body ends with "Schedule as of {time}"
// (or records, routines, check-ins), the moment this sync computed it. That is what the phone
// will show even if the schedule changes while the app is closed, so the
// stamp is the honest part. Background execution is throttled on both
// platforms, so the reconcile only ever runs in the foreground.
//
// Android accuracy: expo-notifications uses an exact alarm when the app may
// schedule them and an inexact one otherwise. The manifest carries
// SCHEDULE_EXACT_ALARM as of the 1.0.37.41 rebuild, so a phone that allows
// it fires these at the time they were set for. It stays a permission the
// person can withdraw (Alarms & reminders in Android's settings), and some
// Android versions do not grant it by default; the alarm is then inexact and
// a reminder can land a few minutes late while the phone is dozing. Nothing
// here tries to detect which case applies, because a dose reminder a few
// minutes late is still the right reminder.

const IDENTIFIER_PREFIX = 'inside-story-reminder:';
// A snoozed copy is one-off and comes from a button press rather than from
// any record, so it carries a prefix of its own: the reconcile below cancels
// anything with IDENTIFIER_PREFIX that the schedule no longer asks for, and
// would take a snooze away on the next foreground. A tap on one still lands
// where the original would have.
const SNOOZE_PREFIX = 'inside-story-snooze:';
// The quiet line that says what a press recorded (1.0.53.10). Its own
// prefix, so no reconcile ever treats it as a reminder.
const ANSWERED_PREFIX = 'inside-story-answered:';
const ANDROID_ANSWER_CHANNEL_ID = 'inside-story-answers';
// Long enough to read, short enough not to become one more thing to clear.
const ANSWERED_SHOWS_MS = 6_000;
// The Snooze button (Phase A, 2026-09-24). Since 1.0.53.10 it no longer
// brings the app forward, like every other button: see the header of
// lib/reminderActions.ts for what that means while the app is closed.
//
// Since C1 (2026-09-26) each kind has a set of buttons of its own, beside
// Snooze, defined in lib/reminderActions.ts. The Snooze-only set keeps
// the identifier the single category always had.
const REMINDER_CATEGORY = REMINDER_CATEGORY_IDS.plain;
const SNOOZE_ACTION = 'snooze';
export const LOOKAHEAD_DAYS = 7;
// iOS caps pending local notifications at 64; keeping under that on both
// platforms means the nearest week never silently loses its tail.
//
// With meals and drinks switched on a day can hold a dozen of these, so the
// cap is reached well inside the seven-day window rather than at the end of
// it. The list is sorted by time before it is cut, so what survives is
// always the soonest, and the next reconcile (app start, or any return to
// the foreground) extends it again. Nothing is lost that was not going to
// be recomputed anyway.
//
// Nudges are filled in only after every first-time reminder has its slot,
// rather than competing with them on time alone. Otherwise switching nudging
// on would quadruple the queue and pull the window in from a week to about a
// day, which would trade reminders for something that is not a real reminder
// at all: three more copies of one somebody has already seen.
export const MAX_PENDING = 60;
const APPOINTMENT_LEAD_MINUTES = 60;
// Three Android channels, because a dose, a glass of water and a bill due
// next week do not deserve the same interruption. Doses and appointments
// keep the high-importance channel they have always used; the routine
// things and the dated ones get quieter ones the person can mute
// separately from Android's own notification settings without touching the
// channel the medication reminders use.
const ANDROID_CHANNEL_ID = 'reminders';
const ANDROID_ROUTINE_CHANNEL_ID = 'routines';
const ANDROID_DATED_CHANNEL_ID = 'upcoming';

// The same keys as ReminderKindKey in lib/reminderPreferences.ts, which is
// what decides whether each one fires.
export type ReminderKind = ReminderKindKey;

// Which kinds come back when nudging is on. Every one of these leaves the
// candidate list the moment the thing is marked done, which is what lets the
// next reconcile cancel the follow-ups that have not fired yet. An
// appointment is deliberately absent: there is nothing to mark, and repeating
// an hour-ahead warning three times just makes it late.
// 'reminder' belongs here for the same reason the rest do: it leaves the
// candidate list the moment somebody answers for it, which is exactly what
// the Reconciliation screen exists to let them do.
// 'routine' belongs here too, and it is the one kind that can answer for
// itself without anybody tapping anything: finishing the walk stamps
// last_completed_at, and nextReminderTimes drops the rest of today the
// moment that happens, so the next reconcile cancels the follow-ups.
const NUDGEABLE_TIMED_KINDS: ReminderKind[] = ['dose', 'meal', 'hydration', 'garden', 'reminder', 'routine'];

type ScheduleLens = 'meds' | 'appointments' | 'todaysMeals' | 'hydration';
type ReminderTab = 'schedule' | 'garden' | 'life' | 'reconcile' | 'routine' | 'signals' | 'camera';
// The two check-in reminders land on Signals (C1).
type SignalsReminderLens = 'generalNote' | 'flares';
// 'plotsAndPlantings' is what a 1.0.42.13 payload says for a counter; it
// opens the Days Until lens too, which has held every counter since
// 1.0.42.14.
type GardenReminderLens = 'upcomingTasks' | 'plotsAndPlantings' | 'daysUntil' | 'compost';

type ReminderPayload = {
  kind: ReminderKind;
  /** The schedule_items id, or for a dated kind the row's own id in its own
   *  table. Only ever read back for debugging; the identifier is what the
   *  reconcile matches on. */
  scheduleItemId: string;
  fireAt: string;
  /** Which tab a tap opens. Absent on anything queued before 1.0.39.8, and
   *  read back as 'schedule', which is the only thing it could have been. */
  tab?: ReminderTab;
  lens: ScheduleLens | GardenReminderLens | DatedReminderLens | SignalsReminderLens | 'reconcile' | 'walk' | 'guide';
  /** A Photo Series only: what the photo is of and its name, so a tap opens
   *  the camera on that owner without reading the database first. */
  ownerKind?: string;
  ownerId?: string;
  title?: string;
  /** The thing itself with nothing prefixed ("Levothyroxine", not "Time
   *  for Levothyroxine"), so the line after a press can name it. Absent on
   *  anything queued before 1.0.53.10, which falls back to the title. */
  subject?: string;
};

type PlannedNotification = {
  identifier: string;
  title: string;
  body: string;
  fireAt: Date;
  payload: ReminderPayload;
  /** False only for upkeep that expires, which gets Snooze alone. */
  markable?: boolean;
};

// Which set of buttons a planned reminder carries.
function categoryIdFor(planned: PlannedNotification): string {
  return REMINDER_CATEGORY_IDS[categoryKeyFor(planned.payload.kind, planned.markable ?? true)];
}

export type ReminderSyncResult = {
  permission: 'granted' | 'denied' | 'unavailable';
  pending: number;
};

const supported = Platform.OS === 'android' || Platform.OS === 'ios';

if (supported) {
  // Without a handler a notification arriving while the app is open is
  // dropped silently; a dose reminder is still worth a banner then.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function hasReminderPermission(): Promise<boolean> {
  if (!supported) return false;
  const status = await Notifications.getPermissionsAsync();
  return status.granted;
}

// Asks once (the OS remembers a refusal, so a second call returns the same
// answer without a prompt) and reconciles right away on a yes, so the first
// saved dose time gets its reminder without waiting for the next sync.
export async function requestReminderPermission(): Promise<boolean> {
  if (!supported) return false;
  const status = await Notifications.requestPermissionsAsync();
  if (status.granted) void syncReminderNotifications();
  return status.granted;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function localDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localDateTimeString(date: Date): string {
  return `${localDateString(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// schedule_items.scheduled_for is a local "YYYY-MM-DDTHH:mm" string (see
// scheduleMeal in lib/db.ts), so it is read back as local wall-clock time.
function parseLocalDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// A plain 'YYYY-MM-DD' at the hour dated reminders speak, as local
// wall-clock time for the same reason as above.
function atReminderHour(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const parsed = new Date(year, month - 1, day, REMINDER_HOUR, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "7:45 AM" when the reminder fires the same day it was computed, "Sep 14,
// 7:45 AM" otherwise, so a reminder a few days out says which day's
// schedule it reflects.
function describeFreshness(computedAt: Date, fireAt: Date): string {
  const time = formatTime12(`${pad(computedAt.getHours())}:${pad(computedAt.getMinutes())}`);
  if (localDateString(computedAt) === localDateString(fireAt)) return time;
  return `${MONTHS[computedAt.getMonth()]} ${computedAt.getDate()}, ${time}`;
}

function describeDose(candidate: ReminderCandidate): string | null {
  if (candidate.doseAmount != null && candidate.doseUnit) {
    return `${candidate.doseAmount} ${candidate.doseUnit}`;
  }
  if (candidate.unitsPerDay != null && candidate.servingUnitLabel) {
    return `${candidate.unitsPerDay} ${candidate.servingUnitLabel}`;
  }
  return null;
}

// Which switch governs this row. A 'meal' row carrying meal_type
// 'beverage' is a drink, which is how the Hydration lens and the Daily Meal
// Plan's water-gap filler both write one (see
// scheduleHydrationRemindersForDay in lib/db.ts).
function reminderKindFor(candidate: ReminderCandidate): ReminderKind {
  if (candidate.itemType === 'appointment') return 'appointment';
  if (candidate.itemType === 'garden') return 'garden';
  if (candidate.itemType === 'reminder') return 'reminder';
  if (candidate.itemType !== 'meal') return 'dose';
  return candidate.mealType === 'beverage' ? 'hydration' : 'meal';
}

// "Breakfast", "Snack", "Smoothie". The schedule stores these lowercase and
// there is no shared label map for them, so the one thing worth doing is not
// showing a lowercase word at the front of a notification title. Anything
// unrecognised is left alone rather than guessed at.
function mealTypeLabel(mealType: string | null): string | null {
  if (!mealType) return null;
  const trimmed = mealType.trim();
  if (!trimmed) return null;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function buildPlanned(candidate: ReminderCandidate, now: Date): PlannedNotification | null {
  const scheduledFor = parseLocalDateTime(candidate.scheduledFor);
  if (!scheduledFor) return null;
  // Every body says three things and nothing else (1.0.53.10, direct
  // instruction: "succinct but clear on what is being done and why"): when
  // it is due and where it is kept, what the button records, and how fresh
  // the schedule it came from is.
  const freshness = (fireAt: Date) => `Schedule as of ${describeFreshness(now, fireAt)}.`;
  const due = formatTime12(`${pad(scheduledFor.getHours())}:${pad(scheduledFor.getMinutes())}`);
  const saying = (lead: string, kind: ReminderKind) => [lead, answerLine(kind), freshness(scheduledFor)].filter(Boolean).join(' ');

  if (candidate.itemType === 'appointment') {
    const fireAt = new Date(scheduledFor.getTime() - APPOINTMENT_LEAD_MINUTES * 60_000);
    // Under an hour away (or already started): the lead reminder's moment
    // has passed, and firing it late would only say what the phone's
    // calendar and the lens already show.
    if (fireAt.getTime() <= now.getTime()) return null;
    const time = formatTime12(`${pad(scheduledFor.getHours())}:${pad(scheduledFor.getMinutes())}`);
    const where = [candidate.location, candidate.providerName ? `with ${candidate.providerName}` : null]
      .filter(Boolean)
      .join(', ');
    return {
      identifier: `${IDENTIFIER_PREFIX}appointment:${candidate.id}`,
      title: `${candidate.title} at ${time}`,
      body: `${where ? `${where}. ` : ''}Starts in about an hour. ${freshness(fireAt)}`,
      fireAt,
      payload: {
        kind: 'appointment',
        scheduleItemId: candidate.id,
        fireAt: fireAt.toISOString(),
        tab: 'schedule',
        lens: 'appointments',
      },
    };
  }

  if (scheduledFor.getTime() <= now.getTime()) return null;

  if (candidate.itemType === 'reminder') {
    // A thought somebody wrote down and later gave a day to. Its title is
    // whatever they typed, in their own words, so nothing is prefixed onto
    // it or rewritten: the point of the capture inbox is that the words
    // come back the way they went in.
    //
    // The tap lands on Reconciliation rather than a tab, because there is no
    // tab this belongs to and because answering for it is the whole reason
    // it has a time.
    return {
      identifier: `${IDENTIFIER_PREFIX}reminder:${candidate.id}`,
      title: candidate.title,
      body: saying(`You asked to be reminded at ${due}.`, 'reminder'),
      fireAt: scheduledFor,
      payload: {
        kind: 'reminder',
        subject: candidate.title,
        scheduleItemId: candidate.id,
        fireAt: scheduledFor.toISOString(),
        tab: 'reconcile',
        lens: 'reconcile',
      },
    };
  }

  if (candidate.itemType === 'garden') {
    // The title a garden task carries is already a job ("Water the tomato
    // bed"), so it is labelled rather than rewritten, and the tap lands on
    // Upcoming Tasks, which is where one gets marked done.
    return {
      identifier: `${IDENTIFIER_PREFIX}garden:${candidate.id}`,
      title: `Garden: ${candidate.title}`,
      body: saying(`Due ${due} in your garden tasks.`, 'garden'),
      fireAt: scheduledFor,
      payload: {
        kind: 'garden',
        subject: candidate.title,
        scheduleItemId: candidate.id,
        fireAt: scheduledFor.toISOString(),
        tab: 'garden',
        lens: 'upcomingTasks',
      },
    };
  }

  if (candidate.itemType === 'meal') {
    const isDrink = candidate.mealType === 'beverage';
    if (isDrink) {
      // The title a drink row already carries is written as an instruction
      // ("Drink about 355ml (~12oz) of water") or is the name of something
      // on a standing hydration routine. Either reads correctly on its own,
      // so nothing is prefixed onto it.
      return {
        identifier: `${IDENTIFIER_PREFIX}hydration:${candidate.id}`,
        title: candidate.title,
        body: saying(`Due ${due} on your Hydration schedule.`, 'hydration'),
        fireAt: scheduledFor,
        payload: {
          kind: 'hydration',
          subject: candidate.title,
          scheduleItemId: candidate.id,
          fireAt: scheduledFor.toISOString(),
          tab: 'schedule',
          lens: 'hydration',
        },
      };
    }
    const label = mealTypeLabel(candidate.mealType);
    return {
      identifier: `${IDENTIFIER_PREFIX}meal:${candidate.id}`,
      title: label ? `${label}: ${candidate.title}` : `Time to eat: ${candidate.title}`,
      body: saying(`Planned for ${due} on Today's Meals.`, 'meal'),
      fireAt: scheduledFor,
      payload: {
        kind: 'meal',
        subject: candidate.title,
        scheduleItemId: candidate.id,
        fireAt: scheduledFor.toISOString(),
        tab: 'schedule',
        lens: 'todaysMeals',
      },
    };
  }

  const dose = describeDose(candidate);
  return {
    identifier: `${IDENTIFIER_PREFIX}dose:${candidate.id}`,
    title: `Time for ${candidate.title}`,
    body: saying(`${dose ? `${dose}, due` : 'Due'} ${due} on your Meds schedule.`, 'dose'),
    fireAt: scheduledFor,
    payload: {
      kind: 'dose',
      subject: candidate.title,
      scheduleItemId: candidate.id,
      fireAt: scheduledFor.toISOString(),
      tab: 'schedule',
      lens: 'meds',
    },
  };
}

// --- The dated kinds: bills, upkeep, benefits, counters, compost ------------

// DATED_KIND_PREFIX and describeDatedDue used to live here. They moved to
// lib/reminderSchedule.ts on 2026-09-23 so that Home could label a row with
// exactly the words its notification uses, rather than a second set written
// to match by hand.

function buildDatedPlanned(
  source: DatedReminderSource,
  day: { on: string; lead: number },
  now: Date,
): PlannedNotification | null {
  const fireAt = atReminderHour(day.on);
  if (!fireAt) return null;
  const prefix = DATED_KIND_PREFIX[source.kind];
  const pieces = [describeDatedDue(source.kind, day.lead), source.detail].filter(Boolean);
  return {
    // The day is part of the identifier because one source produces several
    // of these: the same bill speaks three days out and again on the day,
    // and they have to be able to coexist rather than replace each other.
    identifier: `${IDENTIFIER_PREFIX}${source.kind}:${source.sourceId}:${day.on}`,
    title: prefix ? `${prefix}: ${source.title}` : source.title,
    body: [`${pieces.join('. ')}.`, answerLine(source.kind, source.markable ?? true), `Records as of ${describeFreshness(now, fireAt)}.`]
      .filter(Boolean)
      .join(' '),
    fireAt,
    payload: {
      kind: source.kind,
      subject: source.title,
      scheduleItemId: source.sourceId,
      fireAt: fireAt.toISOString(),
      tab: source.tab,
      lens: source.lens,
    },
    markable: source.markable,
  };
}

// --- Routines: the one kind with no row on any schedule ---------------------
//
// Everything else here starts from something already dated: a schedule_items
// row, a bill, a service. A routine carries its own pattern instead (a time,
// and the days of the week it speaks on), so the dates are worked out here,
// one per firing day inside the lookahead window.
//
// The day is part of the identifier for the same reason it is on a dated
// one: a routine that speaks every morning produces seven of these and they
// have to coexist rather than replace each other.
function buildRoutinePlanned(routine: Routine, fireAt: Date, now: Date): PlannedNotification {
  return {
    identifier: `${IDENTIFIER_PREFIX}routine:${routine.id}:${localDateString(fireAt)}`,
    title: routine.name,
    // The name they gave it is the whole title, unprefixed, for the same
    // reason a captured thought keeps its own words: they wrote it to
    // recognise it. What the body adds is the one thing a notification can
    // usefully say, which is that tapping it starts the walk.
    body: `Tap to walk it one step at a time, ${describeReminderDays(routine.reminderDays)}. Routines as of ${describeFreshness(now, fireAt)}.`,
    fireAt,
    payload: {
      kind: 'routine',
      scheduleItemId: routine.id,
      fireAt: fireAt.toISOString(),
      tab: 'routine',
      lens: 'walk',
    },
  };
}

// --- The two check-in reminders (C1, 2026-09-26) ---------------------------
//
// The only reminders that come from no record: the person asked for a
// question, once a day or after eating. Both buttons take a typed reply
// on the notification (1.0.53.10), since how somebody feels is theirs to
// put into words. The wording asks and never suggests an answer.
function buildDailyCheckinPlanned(fireAt: Date, now: Date): PlannedNotification {
  return {
    identifier: `${IDENTIFIER_PREFIX}checkin:${localDateString(fireAt)}`,
    title: 'How are you today?',
    body: `The daily check-in you asked for. ${answerLine('checkin')} Check-ins as of ${describeFreshness(now, fireAt)}.`,
    fireAt,
    payload: {
      kind: 'checkin',
      scheduleItemId: localDateString(fireAt),
      fireAt: fireAt.toISOString(),
      tab: 'signals',
      lens: 'generalNote',
    },
  };
}

// A Photo Series asking for today's photo. The identifier carries the day,
// so a photo taken today drops today's from the next reconcile while the
// rest of the week stays queued.
function buildSeriesPlanned(
  series: { id: string; ownerKind: string; ownerId: string; title: string },
  frameCount: number,
  fireAt: Date,
): PlannedNotification {
  return {
    identifier: `${IDENTIFIER_PREFIX}photoSeries:${series.id}:${localDateString(fireAt)}`,
    title: seriesReminderTitle(series.title),
    body: seriesReminderBody(frameCount),
    fireAt,
    payload: {
      kind: 'photoSeries',
      scheduleItemId: series.id,
      fireAt: fireAt.toISOString(),
      tab: 'camera',
      lens: 'guide',
      ownerKind: series.ownerKind,
      ownerId: series.ownerId,
      title: series.title,
    },
  };
}

function buildAfterMealPlanned(meal: { id: string; name: string }, fireAt: Date, now: Date): PlannedNotification {
  return {
    identifier: `${IDENTIFIER_PREFIX}afterMeal:${meal.id}`,
    title: `How are you after ${meal.name}?`,
    body: `About ${AFTER_MEAL_MINUTES / 60} hours since you ate. ${answerLine('afterMeal')} Meals as of ${describeFreshness(now, fireAt)}.`,
    fireAt,
    payload: {
      kind: 'afterMeal',
      scheduleItemId: meal.id,
      fireAt: fireAt.toISOString(),
      tab: 'signals',
      lens: 'generalNote',
    },
  };
}

// --- Nudges -----------------------------------------------------------------

// The same reminder again, a little later, while it is still outstanding.
// Same title on purpose: this is one reminder coming back, not a new thing
// to read. The body is what changes, because by now the useful information
// is that it is still sitting there.
function buildNudges(planned: PlannedNotification, now: Date): PlannedNotification[] {
  if (!NUDGEABLE_TIMED_KINDS.includes(planned.payload.kind)) return [];
  const nudges: PlannedNotification[] = [];
  NUDGE_FOLLOW_UP_MINUTES.forEach((minutes, index) => {
    const fireAt = new Date(planned.fireAt.getTime() + minutes * 60_000);
    if (fireAt.getTime() <= now.getTime()) return;
    nudges.push({
      identifier: `${planned.identifier}#nudge${index + 1}`,
      title: planned.title,
      body: [`Still not marked.`, answerLine(planned.payload.kind), `Schedule as of ${describeFreshness(now, fireAt)}.`].filter(Boolean).join(' '),
      fireAt,
      payload: { ...planned.payload, fireAt: fireAt.toISOString() },
    });
  });
  return nudges;
}

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Reminders',
    description: 'Scheduled doses and upcoming appointments.',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#244147',
  });
  await Notifications.setNotificationChannelAsync(ANDROID_ROUTINE_CHANNEL_ID, {
    name: 'Routines, meals & drinks',
    description:
      'Routines at the time you set them, scheduled meals, anything on your hydration schedule, and planned garden work.',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 180],
    lightColor: '#244147',
  });
  await Notifications.setNotificationChannelAsync(ANDROID_DATED_CHANNEL_ID, {
    name: 'Dates coming up',
    description: 'Bills, upkeep and renewals, work benefits about to reset, and Days Until counters landing.',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 180],
    lightColor: '#244147',
  });
  // LOW makes no sound and does not pop up: the line after a press is
  // there to be glanced at, since the person just pressed the button.
  await Notifications.setNotificationChannelAsync(ANDROID_ANSWER_CHANNEL_ID, {
    name: 'What a button recorded',
    description: 'A short line after you press a button on a reminder, saying what went in and where.',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    vibrationPattern: null,
    lightColor: '#244147',
  });
}

function channelFor(kind: ReminderKind): string {
  if (kind === 'bill' || kind === 'upkeep' || kind === 'benefit' || kind === 'countdown' || kind === 'compost') {
    return ANDROID_DATED_CHANNEL_ID;
  }
  if (
    kind === 'meal' ||
    kind === 'hydration' ||
    kind === 'garden' ||
    kind === 'reminder' ||
    kind === 'routine' ||
    kind === 'checkin' ||
    kind === 'afterMeal' ||
    kind === 'photoSeries'
  )
    return ANDROID_ROUTINE_CHANNEL_ID;
  return ANDROID_CHANNEL_ID;
}

function isOurs(identifier: string): boolean {
  return identifier.startsWith(IDENTIFIER_PREFIX);
}

function isSnoozed(identifier: string): boolean {
  return identifier.startsWith(SNOOZE_PREFIX);
}

// Every set of buttons, registered on each reconcile, which costs nothing
// and means a set changed in an update reaches the phone without a step.
// No button opens the app (1.0.53.10); see lib/reminderActions.ts.
async function ensureCategories(): Promise<void> {
  await Promise.all(
    ALL_REMINDER_CATEGORY_KEYS.map((key) =>
      Notifications.setNotificationCategoryAsync(
        REMINDER_CATEGORY_IDS[key],
        CATEGORY_ACTIONS[key].map((action) => {
          const textInput = ACTION_TEXT_INPUT[action];
          return {
            identifier: action,
            buttonTitle: reminderActionTitle(action, SNOOZE_MINUTES),
            options: { opensAppToForeground: false },
            ...(textInput ? { textInput } : {}),
          };
        }),
      ),
    ),
  );
}

async function cancelAllOurs(): Promise<number> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const ours = pending.filter((request) => isOurs(request.identifier));
  await Promise.all(ours.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
  return ours.length;
}

let inFlight: Promise<ReminderSyncResult> | null = null;

// Reconciles pending notifications with everything that has a date. Safe to
// call from anywhere at any time; overlapping calls share one run. Never
// throws: a reminder that could not be scheduled is logged, and the records
// themselves are untouched either way.
export function syncReminderNotifications(): Promise<ReminderSyncResult> {
  if (!supported) return Promise.resolve({ permission: 'unavailable', pending: 0 });
  if (inFlight) return inFlight;
  inFlight = runSync()
    .catch((error) => {
      console.error('[reminderNotifications] sync failed', error);
      return { permission: 'unavailable', pending: 0 } as ReminderSyncResult;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

async function runSync(): Promise<ReminderSyncResult> {
  const granted = await hasReminderPermission();
  if (!granted) {
    // Permission withdrawn in Settings after reminders were scheduled:
    // clear ours so nothing stale fires if it is granted again later.
    await cancelAllOurs();
    return { permission: 'denied', pending: 0 };
  }
  await ensureAndroidChannels();
  await ensureCategories();

  const now = new Date();
  const today = localDateString(now);
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + LOOKAHEAD_DAYS);
  const since = localDateTimeString(new Date(now.getTime() - AFTER_MEAL_MINUTES * 60_000));
  const [candidates, datedSources, routines, preferences, checkinInputs, seriesInputs] = await Promise.all([
    listReminderCandidates(localDateTimeString(now), localDateString(horizon)),
    listDatedReminderSources(today),
    listRoutineReminders(),
    getReminderPreferences(),
    getCheckinReminderInputs(since),
    listSeriesReminderInputs(localDay(now)),
  ]);
  const nudging = isNudgeUntilDoneEnabled(preferences);

  const first = new Map<string, PlannedNotification>();
  const followUps = new Map<string, PlannedNotification>();

  for (const candidate of candidates) {
    if (!isReminderKindEnabled(preferences, reminderKindFor(candidate))) continue;
    const planned = buildPlanned(candidate, now);
    if (!planned) continue;
    first.set(planned.identifier, planned);
    if (nudging) {
      for (const nudge of buildNudges(planned, now)) followUps.set(nudge.identifier, nudge);
    }
  }

  // A routine turns into one notification per firing day in the window. Only
  // the first is a first-time reminder; the rest of the week is real but
  // less urgent, so they queue behind everything else's follow-ups and get
  // dropped first when the phone runs out of room.
  if (isReminderKindEnabled(preferences, 'routine')) {
    for (const routine of routines) {
      const times = nextReminderTimes(routine, now, LOOKAHEAD_DAYS);
      times.forEach((fireAt, index) => {
        const planned = buildRoutinePlanned(routine, fireAt, now);
        (index === 0 ? first : followUps).set(planned.identifier, planned);
        if (nudging && index === 0) {
          for (const nudge of buildNudges(planned, now)) followUps.set(nudge.identifier, nudge);
        }
      });
    }
  }

  // The daily check-in: the next one is a first-time reminder, the rest of
  // the week queues behind, the same as a routine. The after-meal question
  // is a follow-up, so quiet hours drop it rather than hold it to the
  // morning, when a question about last night's dinner would make no sense.
  if (isReminderKindEnabled(preferences, 'checkin')) {
    const checkedInToday = !!checkinInputs.lastCheckinAt && checkinInputs.lastCheckinAt.slice(0, 10) === localDay(now);
    planDailyCheckins(checkinTimeOf(preferences), now, LOOKAHEAD_DAYS - 1, checkedInToday).forEach((fireAt, index) => {
      const planned = buildDailyCheckinPlanned(fireAt, now);
      (index === 0 ? first : followUps).set(planned.identifier, planned);
    });
  }
  // A Photo Series: one a day at the series time, today's left out once
  // today's photo is in. The first is a first-time reminder and the rest of
  // the week queues behind, the same as the daily check-in.
  if (isReminderKindEnabled(preferences, 'photoSeries')) {
    for (const input of seriesInputs) {
      planDailyCheckins(input.series.reminderTime, now, LOOKAHEAD_DAYS - 1, input.photoToday).forEach((fireAt, index) => {
        const planned = buildSeriesPlanned(input.series, input.frameCount, fireAt);
        (index === 0 ? first : followUps).set(planned.identifier, planned);
      });
    }
  }
  if (isReminderKindEnabled(preferences, 'afterMeal')) {
    const nudge = planAfterMealNudge(checkinInputs.recentMeals, checkinInputs.lastCheckinAt, now);
    if (nudge) {
      const planned = buildAfterMealPlanned(nudge.meal, nudge.fireAt, now);
      followUps.set(planned.identifier, planned);
    }
  }

  // A dated source turns into one notification per day it speaks on, and the
  // days past or beyond the window are dropped here rather than in the date
  // arithmetic, which has no clock to compare against.
  for (const source of datedSources) {
    if (!isReminderKindEnabled(preferences, source.kind)) continue;
    for (const day of datedReminderDays(source.kind, source.dueOn, today, nudging)) {
      const planned = buildDatedPlanned(source, day, now);
      if (!planned) continue;
      if (planned.fireAt.getTime() <= now.getTime() || planned.fireAt.getTime() > horizon.getTime()) continue;
      // An overdue day only exists because nudging is on, so it is filled in
      // after the first-time reminders rather than competing with them.
      (day.lead < 0 ? followUps : first).set(planned.identifier, planned);
    }
  }

  // Quiet hours, applied after everything is planned and before anything is
  // cut, so a held reminder competes for a slot at the time it will arrive.
  // A first reminder is held to the end of the window and says so; a
  // follow-up nudge inside the window is dropped, since the held first one
  // arrives in the morning anyway. Doses and appointments are never held.
  const quiet = preferences.quietHours;
  for (const [identifier, planned] of first) {
    const decision = quietDecision(planned.payload.kind, planned.fireAt, false, quiet);
    if (decision.action !== 'hold') continue;
    const dueAt = formatTime12(`${pad(planned.fireAt.getHours())}:${pad(planned.fireAt.getMinutes())}`);
    first.set(identifier, {
      ...planned,
      body: `Due at ${dueAt}, held until your quiet hours ended. ${planned.body}`,
      fireAt: decision.until,
      payload: { ...planned.payload, fireAt: decision.until.toISOString() },
    });
  }
  for (const [identifier, planned] of followUps) {
    if (quietDecision(planned.payload.kind, planned.fireAt, true, quiet).action === 'drop') followUps.delete(identifier);
  }

  const byTime = (a: PlannedNotification, b: PlannedNotification) => a.fireAt.getTime() - b.fireAt.getTime();
  const kept = [...first.values()].sort(byTime).slice(0, MAX_PENDING);
  const room = MAX_PENDING - kept.length;
  if (room > 0) kept.push(...[...followUps.values()].sort(byTime).slice(0, room));
  const keptById = new Map(kept.map((planned) => [planned.identifier, planned]));

  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const unchanged = new Set<string>();
  for (const request of pending) {
    if (!isOurs(request.identifier)) continue;
    const want = keptById.get(request.identifier);
    const data = request.content.data as Partial<ReminderPayload> | undefined;
    // Same moment and same wording means the pending one is already right;
    // anything else (moved time, edited title, dropped row) is replaced.
    // The category check replaces, once, every reminder queued before its
    // buttons existed (Snooze in Phase A, the rest in C1), so each gets them.
    if (
      want &&
      data?.fireAt === want.payload.fireAt &&
      request.content.title === want.title &&
      request.content.body === want.body &&
      request.content.categoryIdentifier === categoryIdFor(want)
    ) {
      unchanged.add(request.identifier);
      continue;
    }
    await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }

  let scheduled = unchanged.size;
  for (const planned of kept) {
    if (unchanged.has(planned.identifier)) continue;
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: planned.identifier,
        content: {
          title: planned.title,
          body: planned.body,
          data: planned.payload,
          sound: true,
          categoryIdentifier: categoryIdFor(planned),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: planned.fireAt,
          channelId: channelFor(planned.payload.kind),
        },
      });
      scheduled += 1;
    } catch (error) {
      console.error(`[reminderNotifications] could not schedule ${planned.identifier}`, error);
    }
  }
  return { permission: 'granted', pending: scheduled };
}

export type QueuedReminder = {
  title: string;
  body: string;
  fireAt: Date;
  snoozed: boolean;
};

// What this app has queued with the phone right now, soonest first, for
// the status page. Empty wherever reminders are not queued with the OS.
export async function listQueuedReminders(): Promise<QueuedReminder[]> {
  if (!supported) return [];
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  return pending
    .filter((request) => isOurs(request.identifier) || isSnoozed(request.identifier))
    .map((request) => {
      const data = request.content.data as Partial<ReminderPayload> | undefined;
      return {
        title: request.content.title ?? 'Reminder',
        body: request.content.body ?? '',
        fireAt: new Date(data?.fireAt ?? 0),
        snoozed: isSnoozed(request.identifier),
      };
    })
    .filter((queued) => !Number.isNaN(queued.fireAt.getTime()))
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

export type ReminderTapTarget =
  | { pathname: '/schedule'; params: { openScheduleLens: ScheduleLens } }
  | { pathname: '/garden'; params: { openGardenLens: GardenReminderLens } }
  | { pathname: '/life'; params: { openLifeLens: DatedReminderLens } }
  | { pathname: '/routine'; params: { id: string } }
  | { pathname: '/log'; params: { openSignalsLens: SignalsReminderLens } }
  | { pathname: '/reconcile' }
  | { pathname: '/photo-camera'; params: { ownerKind: string; ownerId: string; guide: '1'; title: string } };

const SCHEDULE_LENSES: ScheduleLens[] = ['meds', 'appointments', 'todaysMeals', 'hydration'];
// The dated lenses that live on Life. 'compost' is a dated lens too and is
// deliberately not here: it is on Garden, and this list is the fallback for
// the Life branch below.
const DATED_LENSES: DatedReminderLens[] = ['finances', 'upkeep', 'work', 'daysUntil'];

// Where a tapped reminder should land: the lens the thing lives in. Null for
// any notification this module did not create.
//
// Everything read here came off a notification the phone has been holding,
// possibly since before an update, so each piece is checked against what it
// is allowed to be rather than trusted. A payload with no tab at all is one
// queued before 1.0.39.8, when Schedules was the only place a reminder could
// send anybody.
export function resolveReminderTap(response: Notifications.NotificationResponse | null): ReminderTapTarget | null {
  const request = response?.notification.request;
  if (!request || !(isOurs(request.identifier) || isSnoozed(request.identifier))) return null;
  const data = request.content.data as Partial<ReminderPayload> | undefined;

  if (data?.tab === 'reconcile') return { pathname: '/reconcile' };
  // A Photo Series opens the camera on the thing with the last photo over
  // the view. A payload missing its owner lands on Garden instead, since
  // the camera cannot keep a photo of nothing.
  if (data?.tab === 'camera') {
    if (typeof data.ownerKind === 'string' && data.ownerKind && typeof data.ownerId === 'string' && data.ownerId) {
      return {
        pathname: '/photo-camera',
        params: { ownerKind: data.ownerKind, ownerId: data.ownerId, guide: '1', title: typeof data.title === 'string' ? data.title : '' },
      };
    }
    return { pathname: '/garden', params: { openGardenLens: 'plotsAndPlantings' } };
  }
  if (data?.tab === 'signals') {
    return { pathname: '/log', params: { openSignalsLens: data.lens === 'flares' ? 'flares' : 'generalNote' } };
  }
  // A routine opens the walk itself rather than the list it was built in,
  // which is the whole point of giving it a time. An id that has since been
  // deleted lands on Life > Routines instead of a blank screen, which
  // app/routine.tsx already does for an unknown id.
  if (data?.tab === 'routine' && typeof data.scheduleItemId === 'string' && data.scheduleItemId) {
    return { pathname: '/routine', params: { id: data.scheduleItemId } };
  }
  // A garden task lands on Upcoming Tasks, a Days Until counter on the Days
  // Until lens where every counter is, and a pile due a turn on Compost
  // Piles. An older payload that says garden and nothing about a lens is
  // from before counters, so it can only be a task.
  if (data?.tab === 'garden') {
    if (data.lens === 'compost') return { pathname: '/garden', params: { openGardenLens: 'compost' } };
    const toCounters = data.lens === 'daysUntil' || data.lens === 'plotsAndPlantings';
    return { pathname: '/garden', params: { openGardenLens: toCounters ? 'daysUntil' : 'upcomingTasks' } };
  }
  if (data?.tab === 'life') {
    const lens = DATED_LENSES.find((option) => option === data.lens) ?? 'finances';
    return { pathname: '/life', params: { openLifeLens: lens } };
  }
  const lens = SCHEDULE_LENSES.find((option) => option === data?.lens) ?? 'meds';
  return { pathname: '/schedule', params: { openScheduleLens: lens } };
}

// The same reminder again in SNOOZE_MINUTES, once, carrying its payload so
// a tap still lands where the original would have. The one on screen is
// dismissed, since it has been answered. Snoozing a snooze keeps the
// original's name rather than growing a longer one each time.
async function snoozeReminder(response: Notifications.NotificationResponse): Promise<void> {
  const { request } = response.notification;
  const fireAt = new Date(Date.now() + SNOOZE_MINUTES * 60_000);
  const data = (request.content.data ?? {}) as Partial<ReminderPayload>;
  const base = isSnoozed(request.identifier) ? request.identifier.split('@')[0] : SNOOZE_PREFIX + request.identifier;
  await Notifications.scheduleNotificationAsync({
    identifier: `${base}@${fireAt.getTime()}`,
    content: {
      title: request.content.title ?? 'Reminder',
      body: request.content.body ?? '',
      data: { ...data, fireAt: fireAt.toISOString() },
      sound: true,
      categoryIdentifier: request.content.categoryIdentifier ?? REMINDER_CATEGORY,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: data.kind ? channelFor(data.kind) : ANDROID_CHANNEL_ID,
    },
  });
  await Notifications.dismissNotificationAsync(request.identifier).catch(() => undefined);
}

// What a button recorded, said once on the quiet channel and taken away
// after a few seconds, so a press made without opening the app still says
// what it did. Nothing depends on it arriving.
async function showAnswered(confirmation: { title: string; body: string } | null): Promise<void> {
  if (!confirmation) return;
  const identifier = `${ANSWERED_PREFIX}${Date.now()}`;
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title: confirmation.title, body: confirmation.body, sound: false },
    trigger: Platform.OS === 'android' ? { channelId: ANDROID_ANSWER_CHANNEL_ID } : null,
  });
  setTimeout(() => {
    void Notifications.dismissNotificationAsync(identifier).catch(() => undefined);
  }, ANSWERED_SHOWS_MS);
}

function nowTime(): string {
  const now = new Date();
  return formatTime12(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
}

// A press is handled once even when the cold-start read and the listener
// both report it, which they can on a launch the press itself caused.
const answered = new Set<string>();

// A button does its work where it is pressed and never opens the app
// (1.0.53.10): the record is written, the reminder is taken off the screen,
// and a short line says what was recorded and where. Only a tap on the
// reminder itself opens the app, on the lens the thing lives in.
function handleResponse(
  response: Notifications.NotificationResponse | null,
  navigate: (target: ReminderTapTarget) => void,
): void {
  if (!response) return;
  const request = response.notification.request;
  const key = `${request.identifier}|${response.notification.date}|${response.actionIdentifier}`;
  if (answered.has(key)) return;
  answered.add(key);
  const ours = isOurs(request.identifier) || isSnoozed(request.identifier);
  const data = request.content.data as Partial<ReminderPayload> | undefined;
  const what = data?.subject ?? request.content.title ?? 'Reminder';
  const kind = data?.kind ?? '';
  if (response.actionIdentifier === SNOOZE_ACTION) {
    if (!ours) return;
    snoozeReminder(response)
      .then(() => showAnswered(answeredConfirmation('snooze', kind, what, nowTime(), SNOOZE_MINUTES, false)))
      .catch((error) => console.error('[reminderNotifications] snooze failed', error));
    return;
  }
  const plan = data?.kind ? planReminderAction(data.kind, response.actionIdentifier) : null;
  if (plan && ours) {
    void Notifications.dismissNotificationAsync(request.identifier).catch(() => undefined);
    const words = (response.userText ?? '').trim();
    recordAnswer(plan, data?.scheduleItemId ?? '', words, kind)
      .then(() => showAnswered(answeredConfirmation(plan, kind, what, nowTime(), SNOOZE_MINUTES, words.length > 0)))
      .catch((error) => console.error('[reminderNotifications] answer failed', error))
      .finally(() => {
        void syncReminderNotifications();
      });
    return;
  }
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const target = resolveReminderTap(response);
  if (target) navigate(target);
}

// The same record the app writes when the thing is answered where it lives:
// the schedule status Reconciliation writes, a doing in Upkeep, a turn on
// the pile, a check-in in Signals. Upkeep and compost check first whether
// today is already recorded, so a second press from a copy still on screen
// adds nothing. A note with no words is not a note, so nothing is written.
async function recordAnswer(plan: ReminderActionPlan, id: string, words: string, kind: string): Promise<void> {
  const now = new Date();
  const today = localDateString(now);
  if (plan.write === 'checkinNote') {
    if (!words) return;
    await recordCheckin({ loggedAt: localDateTimeString(now), checkinType: 'general', valence: 'neutral', notes: words });
    return;
  }
  if (plan.write === 'flare') {
    await recordCheckin({
      loggedAt: localDateTimeString(now),
      checkinType: 'flare',
      valence: 'negative',
      notes: words || undefined,
      relatedMealId: kind === 'afterMeal' && id ? id : undefined,
    });
    return;
  }
  if (!id) return;
  if (plan.write === 'scheduleStatus') {
    await setScheduleItemStatus(id, plan.status);
    return;
  }
  if (plan.write === 'upkeepDone') {
    const item = (await listUpkeepItems()).find((candidate) => candidate.id === id);
    if (!item || item.lastDoneOn === today) return;
    await markUpkeepDone(id, today);
    return;
  }
  if (plan.write === 'compostTurned') {
    const pile = (await listCompostPilesToTurn()).find((candidate) => candidate.pile.id === id);
    if (pile?.lastTurnedOn === today) return;
    await addCompostEvent({ pileId: id, occurredOn: today, kind: 'turned' });
  }
}

// Cold start from a tapped reminder plus the already-running case, same
// shape as the .is file listener in app/_layout.tsx. Returns the unsubscribe.
// The cold-start response is cleared once read, so a Snooze pressed once is
// not pressed again on every later start.
export function listenForReminderTaps(navigate: (target: ReminderTapTarget) => void): () => void {
  if (!supported) return () => {};
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      handleResponse(response, navigate);
      if (response) Notifications.clearLastNotificationResponse();
    })
    .catch((error) => console.error('[reminderNotifications] getLastNotificationResponseAsync failed', error));
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handleResponse(response, navigate);
  });
  return () => subscription.remove();
}
