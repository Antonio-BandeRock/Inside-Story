import { formatAmount, stepSuffix } from './taper';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getCheckinReminderInputs } from './checkinReminderDb';
import { seriesReminderBody, seriesReminderTitle } from './photoSeries';
import { listSeriesReminderInputs } from './photoSeriesDb';
import { addCompostEvent, listCompostPilesToTurn } from './compostDb';
import { getDatabase, getDailyNutrientAnalysis, listReminderCandidates, listScheduledMealsForDateRange, recordCheckin, setScheduleItemStatus, type ReminderCandidate } from './db';
import { withSessionGuardLifted } from './databaseActivity';
import { getMovedWaterTarget } from './hydrationIndexDb';
import { skipHydrationReminder, waterTargetReached } from './hydrationTarget';
import {
  ACTION_TEXT_INPUT,
  AFTER_MEAL_MINUTES,
  ALL_REMINDER_CATEGORY_KEYS,
  answerLine,
  CATEGORY_ACTIONS,
  categoryKeyFor,
  localDay,
  MORNING_ENERGY_BODY,
  MORNING_ENERGY_TITLE,
  planAfterMealNudge,
  planDailyCheckins,
  planReminderAction,
  REMINDER_CATEGORY_IDS,
  reminderActionTitle,
  type ReminderActionPlan,
} from './reminderActions';
import {
  checkinTimeOf,
  morningTimeOf,
  weekDayOf,
  weekTimeOf,
  weekPlanDayOf,
  weekPlanTimeOf,
  gardenMonthDayOf,
  gardenMonthTimeOf,
  getReminderPreferences,
  isNudgeUntilDoneEnabled,
  isReminderKindEnabled,
  type ReminderKindKey,
} from './reminderPreferences';
import {
  datedReminderDays,
  DATED_KIND_PREFIX,
  describeDatedDue,
  REMINDER_HOUR,
} from './reminderSchedule';
import {
  listDatedReminderSources,
  type DatedReminderLens,
  type DatedReminderSource,
} from './reminderSources';
import {
  checkReminderTimes,
  followUpMinutes,
  KEEP_REMINDING_LOOKBACK_MINUTES,
  outstandingSince,
  type KeepReminding,
} from './keepReminding';
import { describeReminderDays, nextReminderTimes, routineDoneToday, type DoneCheck, type Routine } from './routines';
import { listCheckReminders, listRoutineReminders, markDoneCheck } from './routinesDb';
import { listExercisePlans, listPlanMarks } from './exercisePlanDb';
import { listWorkouts } from './workoutsDb';
import { planTitle, reminderBody, reminderMoments, reminderTitle, type ExercisePlan } from './exercisePlan';
import { formatTime12 } from './timeOfDay';
import { currentZone, homeDoseHere, homeTimeWords, parseTravelMode } from './travelTime';
import { getHomeZone } from './travelTimeDb';
import { PEER_DOSE_PREFIX } from './doseWatch';
import { RECALL_NOTIFICATION_PREFIX } from './recalls';
import { quietDecision, SNOOZE_MINUTES } from './quietHours';
import { markUpkeepDone, listUpkeepItems } from './upkeepDb';
import { getTodo, markTodoDone } from './todosDb';
import { getMorningCheckin, saveMorningCheckin } from './morningCheckinDb';
import { isLockedNow, reminderDetailHidden } from './appLockSession';
import { isRelayWake } from './relayWake';
import { reminderWords } from './lockedReminderText';
import { keepAnswerForUnlock, takeWaitingAnswers } from './lockedAnswers';
import { ANDROID_GROUP_PREFIX, androidGroupFor, countWaiting, groupWaiting, SUMMARY_FROM, summaryBody, summaryTitle, type ShowingReminder, type WaitingGroup } from './waitingAnswers';
import { YOUR_WEEK_NOTIFICATION_BODY, YOUR_WEEK_NOTIFICATION_TITLE } from './weeklySummary';
import { buildWeekPlanBody, WEEK_PLAN_NOTIFICATION_TITLE, weekPlanDays } from './weekPlanNotice';
import { buildGardenMonthBody, GARDEN_MONTH_NOTIFICATION_TITLE, nextGardenMonthFire, type GardenMonthPlace } from './gardenMonthNotice';
import { listCropPlans, recordCropStep } from './cropPlanDb';
import { parseCropStepSourceId } from './cropPlan';
import { readCachedFrostDates } from './homeSky';
import { frostAnchor } from './sowingWindows';

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
// The one notification saying how many reminders are waiting, whose tap
// opens Waiting for an Answer (1.0.60.2). Outside both prefixes above, so
// the reconcile never counts it as a reminder or cancels it, and kept on a
// quiet channel of its own so it never makes a sound: everything it counts
// already made one.
export const WAITING_SUMMARY_ID = 'inside-story-waiting-summary';
const ANDROID_WAITING_CHANNEL_ID = 'waiting';
// The channel a line saying what a press recorded used to go out on
// (1.0.53.10 to 1.0.54.6). Removed by direct instruction, 2026-09-27: the
// person pressed the button, so a second notification saying so is one more
// thing to clear. Kept only so the channel is taken out of a phone's
// notification settings.
const ANDROID_ANSWER_CHANNEL_ID = 'inside-story-answers';
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
// 'check' (C2) for the same reason as 'routine': marking it moves the
// check's last mark into this period, and checkReminderTimes then has no
// moment left today to hang a follow-up from.
const NUDGEABLE_TIMED_KINDS: ReminderKind[] = ['dose', 'meal', 'hydration', 'garden', 'reminder', 'routine', 'check'];

type ScheduleLens = 'meds' | 'appointments' | 'meals' | 'todaysMeals' | 'hydration' | 'exercise';
type ReminderTab = 'schedule' | 'garden' | 'life' | 'reconcile' | 'routine' | 'signals' | 'camera' | 'home' | 'workout' | 'checkinFlow';
// The two check-in reminders land on Signals (C1).
type SignalsReminderLens = 'generalNote' | 'flares';
// 'plotsAndPlantings' is what a 1.0.42.13 payload says for a counter; it
// opens the Days Until lens too, which has held every counter since
// 1.0.42.14.
type GardenReminderLens = 'upcomingTasks' | 'plotsAndPlantings' | 'daysUntil' | 'compost' | 'sowingCalendar';
// A Did I Do It check (C2) lands on its lens on Life, beside the dated ones.
type LifeReminderLens = DatedReminderLens | 'didIDoIt';

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
  lens: ScheduleLens | GardenReminderLens | LifeReminderLens | SignalsReminderLens | 'reconcile' | 'walk' | 'guide' | 'morningCheckin' | 'morningEnergy' | 'yourWeek';
  /** A Photo Series only: what the photo is of and its name, so a tap opens
   *  the camera on that owner without reading the database first. */
  ownerKind?: string;
  ownerId?: string;
  title?: string;
  /** The thing itself with nothing prefixed ("Levothyroxine", not "Time
   *  for Levothyroxine"), so the line after a press can name it. Absent on
   *  anything queued before 1.0.53.10, which falls back to the title. */
  subject?: string;
  /** A planned workout (H11): the workout to open in the player and the
   *  day of the plan it is for, so finishing it marks that day done. */
  workoutId?: string;
  onDate?: string;
  /** Android only, 1.0.60.4: which group of the notification shade this
   *  reminder sits in, read by the patched expo-notifications. Filled by
   *  androidGroupFor in lib/waitingAnswers.ts as the reminder is queued. */
  androidGroup?: string;
  androidGroupTitle?: string;
  androidGroupLink?: string;
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
    // The summary of what is waiting is never a banner: it only gathers
    // reminders already on screen, and the app is open anyway.
    handleNotification: async (notification) => {
      // A relay wake-up (M1) is never shown; lib/reminderBackgroundTask.ts
      // collects what it says is waiting.
      if (isRelayWake(notification.request)) {
        return { shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false };
      }
      const summary = notification.request.identifier === WAITING_SUMMARY_ID;
      return {
        shouldShowBanner: !summary,
        shouldShowList: true,
        shouldPlaySound: !summary,
        shouldSetBadge: false,
      };
    },
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

// The body with its "as of" stamp taken out, for deciding whether a pending
// reminder is still right (2026-09-28). The stamp carries the minute the
// reconcile ran, so comparing whole bodies found every reminder changed at
// any reconcile in a later minute, and each app open or close cancelled and
// rescheduled up to MAX_PENDING of them, one native call at a time, which
// showed as lag between screens. Compared without it, a reminder whose time
// and wording are otherwise the same stays as it is, keeping the stamp of
// when it was worked out, which is still true since nothing in it changed.
const FRESHNESS_STAMP = / as of (?:[A-Z][a-z]{2} \d{1,2}, )?\d{1,2}:\d{2} [AP]M\./g;

export function withoutFreshness(body: string | null | undefined): string {
  return (body ?? '').replace(FRESHNESS_STAMP, ' as of.');
}

function describeDose(candidate: ReminderCandidate): string | null {
  // A2: a dose on a day inside a taper says its amount and its step.
  if (candidate.taperStepNumber && candidate.doseAmount != null) {
    return `${formatAmount(candidate.doseAmount, candidate.doseUnit)}${stepSuffix(candidate.taperStepNumber, candidate.taperStepCount)}`;
  }
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

// A7: a dose kept on home time while away carries its home clock as words,
// and its scheduledFor has already been moved onto this phone's clock.
type TravelCandidate = ReminderCandidate & { homeClock?: string };

// The schedule rows in the window, with every dose kept on home time moved
// onto the local clock (A7). The read reaches a day past the window at both
// ends, since a home-time dose can land on either side of it once moved, and
// the window is applied after the move.
async function listTravelAdjustedCandidates(lookback: Date, horizon: Date, now: Date): Promise<TravelCandidate[]> {
  const DAY_MS = 24 * 60 * 60_000;
  const [raw, homeZone] = await Promise.all([
    listReminderCandidates(localDateTimeString(new Date(lookback.getTime() - DAY_MS)), localDateString(new Date(horizon.getTime() + DAY_MS))),
    getHomeZone().catch(() => null),
  ]);
  const here = currentZone();
  const from = localDateTimeString(lookback);
  const lastDay = localDateString(horizon);
  const result: TravelCandidate[] = [];
  for (const candidate of raw) {
    const moved = candidate.travelMode
      ? homeDoseHere(candidate.scheduledFor, parseTravelMode(candidate.travelMode), homeZone, here, now.getTime())
      : null;
    const next: TravelCandidate =
      moved && homeZone ? { ...candidate, scheduledFor: moved, homeClock: homeTimeWords(candidate.scheduledFor, homeZone) } : candidate;
    if (next.scheduledFor < from || next.scheduledFor.slice(0, 10) > lastDay) continue;
    result.push(next);
  }
  return result;
}

function buildPlanned(candidate: TravelCandidate, now: Date): PlannedNotification | null {
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

  // Gone by, but recent enough that its follow-ups still matter (C2): the
  // caller keeps it out of the first-time reminders and builds only those.
  if (scheduledFor.getTime() <= now.getTime() - KEEP_REMINDING_LOOKBACK_MINUTES * 60_000) return null;

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
    body: saying(`${dose ? `${dose}, due` : 'Due'} ${due}${candidate.homeClock ? ` here, ${candidate.homeClock},` : ''} on your Meds schedule.`, 'dose'),
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

// A planned exercise day with a time (H11 part 3). One per day in the
// window, the day in the identifier so the week's copies coexist. A plan
// built on a workout opens the player on it; a plain activity opens
// Schedules > Exercise, where it is marked.
function buildExercisePlanned(plan: ExercisePlan, title: string, date: string, fireAt: Date): PlannedNotification {
  return {
    identifier: `${IDENTIFIER_PREFIX}exercise:${plan.id}:${date}`,
    title: reminderTitle(title),
    body: reminderBody(plan),
    fireAt,
    payload: {
      kind: 'exercise',
      scheduleItemId: plan.id,
      fireAt: fireAt.toISOString(),
      tab: plan.workoutId ? 'workout' : 'schedule',
      lens: 'exercise',
      title,
      subject: title,
      ...(plan.workoutId ? { workoutId: plan.workoutId, onDate: date } : {}),
    },
  };
}

// A Did I Do It check with a time (C2). Same shape as a routine: the name
// they gave it is the title, one per speaking day, and the day is in the
// identifier so the week's copies coexist.
function buildCheckPlanned(check: DoneCheck, fireAt: Date, now: Date): PlannedNotification {
  return {
    identifier: `${IDENTIFIER_PREFIX}check:${check.id}:${localDateString(fireAt)}`,
    title: check.name,
    body: `${answerLine('check')} Did I Do It as of ${describeFreshness(now, fireAt)}.`,
    fireAt,
    payload: {
      kind: 'check',
      scheduleItemId: check.id,
      fireAt: fireAt.toISOString(),
      tab: 'life',
      lens: 'didIDoIt',
      subject: check.name,
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

// The morning check-in (D7). Three of the sleep words as buttons, and the
// energy question after a press (lib/reminderActions.ts). Until 1.0.58.1 it
// had no buttons and a tap opened Home, where nothing asked anything (direct
// report, 2026-10-01); a tap now opens the check-in on the sleep question.
function buildMorningPlanned(fireAt: Date, now: Date): PlannedNotification {
  return {
    identifier: `${IDENTIFIER_PREFIX}morning:${localDateString(fireAt)}`,
    title: 'How did you sleep?',
    body: `${answerLine('morning')} Check-ins as of ${describeFreshness(now, fireAt)}.`,
    fireAt,
    payload: {
      kind: 'morning',
      scheduleItemId: localDateString(fireAt),
      fireAt: fireAt.toISOString(),
      tab: 'checkinFlow',
      lens: 'morningCheckin',
    },
  };
}

// The energy question, shown at once after a sleep press. Shown rather than
// queued, so a reconcile running at the same moment has nothing pending of
// it to cancel.
async function presentMorningEnergy(day: string): Promise<void> {
  const payload: ReminderPayload = {
    kind: 'morning',
    scheduleItemId: day,
    fireAt: new Date().toISOString(),
    tab: 'checkinFlow',
    lens: 'morningEnergy',
  };
  await Notifications.scheduleNotificationAsync({
    identifier: `${IDENTIFIER_PREFIX}morningEnergy:${day}`,
    content: {
      title: MORNING_ENERGY_TITLE,
      body: MORNING_ENERGY_BODY,
      data: { ...payload, ...androidGroupFor('morning') },
      sound: false,
      categoryIdentifier: REMINDER_CATEGORY_IDS.energy,
    },
    trigger: { channelId: channelFor('morning') },
  });
}

// This week's meals (H10). The meals planned for the seven days starting
// the day it fires, read when the reminders are reconciled; the body says
// when. Opens Schedules on the Meals lens, where the week strip is.
function buildWeekPlanPlanned(fireAt: Date, body: string): PlannedNotification {
  return {
    identifier: `${IDENTIFIER_PREFIX}weekPlan:${localDateString(fireAt)}`,
    title: WEEK_PLAN_NOTIFICATION_TITLE,
    body,
    fireAt,
    payload: {
      kind: 'weekPlan',
      scheduleItemId: localDateString(fireAt),
      fireAt: fireAt.toISOString(),
      tab: 'schedule',
      lens: 'meals',
    },
  };
}

// This month in the garden (I12). What the sowing calendar has open over
// the next 30 days; opens Garden on the Sowing Calendar lens.
function buildGardenMonthPlanned(fireAt: Date, body: string): PlannedNotification {
  return {
    identifier: `${IDENTIFIER_PREFIX}gardenMonth:${localDateString(fireAt)}`,
    title: GARDEN_MONTH_NOTIFICATION_TITLE,
    body,
    fireAt,
    payload: {
      kind: 'gardenMonth',
      scheduleItemId: localDateString(fireAt),
      fireAt: fireAt.toISOString(),
      tab: 'garden',
      lens: 'sowingCalendar',
    },
  };
}

// Your week (F13). Word that the summary is on Home and nothing about what
// it holds, since a notification can be read on a locked screen. A tap
// opens Home on the Your Week card itself.
function buildWeekPlanned(fireAt: Date): PlannedNotification {
  return {
    identifier: `${IDENTIFIER_PREFIX}week:${localDateString(fireAt)}`,
    title: YOUR_WEEK_NOTIFICATION_TITLE,
    body: YOUR_WEEK_NOTIFICATION_BODY,
    fireAt,
    payload: {
      kind: 'week',
      scheduleItemId: localDateString(fireAt),
      fireAt: fireAt.toISOString(),
      tab: 'home',
      lens: 'yourWeek',
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
//
// How often is the thing's own choice since C2 (lib/keepReminding.ts): null
// follows the Profile switch, 0 is once only, a number is every so many
// minutes whatever the switch says.
function buildNudges(
  planned: PlannedNotification,
  now: Date,
  choice: KeepReminding,
  switchOn: boolean,
): PlannedNotification[] {
  if (!NUDGEABLE_TIMED_KINDS.includes(planned.payload.kind)) return [];
  const nudges: PlannedNotification[] = [];
  followUpMinutes(choice, switchOn).forEach((minutes, index) => {
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
    description: 'Bills, upkeep and renewals, work benefits about to reset, Days Until counters landing, and kitchen use-by dates.',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 180],
    lightColor: '#244147',
  });
  await Notifications.setNotificationChannelAsync(ANDROID_WAITING_CHANNEL_ID, {
    name: 'Waiting for an answer',
    description: 'One quiet line when two or more reminders are still waiting, which opens them all in one list.',
    importance: Notifications.AndroidImportance.LOW,
    lightColor: '#244147',
  });
  await Notifications.deleteNotificationChannelAsync(ANDROID_ANSWER_CHANNEL_ID).catch(() => undefined);
}

// Today's moment for a routine that speaks today, whether or not it has
// gone by. Null on a day it does not speak.
function todaysRoutineMoment(routine: Routine, now: Date): Date | null {
  if (!routine.reminderTime) return null;
  if (routine.reminderDays.length > 0 && !routine.reminderDays.includes(now.getDay())) return null;
  const [hour, minute] = routine.reminderTime.split(':').map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
}

function channelFor(kind: ReminderKind): string {
  if (
    kind === 'bill' ||
    kind === 'upkeep' ||
    kind === 'benefit' ||
    kind === 'countdown' ||
    kind === 'compost' ||
    kind === 'refill' ||
    kind === 'useBy' ||
    kind === 'todo' ||
    kind === 'cropPrep' ||
    kind === 'cropSow'
  ) {
    return ANDROID_DATED_CHANNEL_ID;
  }
  if (
    kind === 'meal' ||
    kind === 'hydration' ||
    kind === 'garden' ||
    kind === 'reminder' ||
    kind === 'routine' ||
    kind === 'exercise' ||
    kind === 'check' ||
    kind === 'checkin' ||
    kind === 'morning' ||
    kind === 'week' ||
    kind === 'gardenMonth' ||
    kind === 'afterMeal' ||
    kind === 'photoSeries'
  )
    return ANDROID_ROUTINE_CHANNEL_ID;
  return ANDROID_CHANNEL_ID;
}

// A notification this app did not queue through expo-notifications (the
// Capture buttons in the shade) can come back with no identifier at all.
function isOurs(identifier: string | null | undefined): boolean {
  return identifier?.startsWith(IDENTIFIER_PREFIX) ?? false;
}

function isSnoozed(identifier: string | null | undefined): boolean {
  return identifier?.startsWith(SNOOZE_PREFIX) ?? false;
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
let queued: Promise<ReminderSyncResult> | null = null;

// Takes every pending reminder of ours off and queues them again. Android
// keeps an alarm the way it was set, so reminders queued while on-time
// alarms were not allowed stay the kind it may hold until the phone is
// picked up, even after the person allows them (lib/reminderTiming.ts).
export async function rescheduleAllReminders(): Promise<ReminderSyncResult> {
  if (!supported) return { permission: 'unavailable', pending: 0 };
  if (inFlight) await inFlight.catch(() => undefined);
  try {
    await cancelAllOurs();
  } catch (error) {
    console.error('[reminderNotifications] cancel before reschedule failed', error);
  }
  return syncReminderNotifications();
}

// Reconciles pending notifications with everything that has a date. Safe to
// call from anywhere at any time. A call made while a run is going queues
// one more run after it, shared by every call made in the meantime
// (2026-09-28): the run already going read the records and switches before
// that call, so sharing it alone left a switch flipped mid-run unapplied
// until the app next opened. Never throws: a reminder that could not be
// scheduled is logged, and the records themselves are untouched either way.
export function syncReminderNotifications(): Promise<ReminderSyncResult> {
  if (!supported) return Promise.resolve({ permission: 'unavailable', pending: 0 });
  if (inFlight) {
    if (!queued) {
      queued = inFlight.then(() => {
        queued = null;
        return syncReminderNotifications();
      });
    }
    return queued;
  }
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
  // Looking back as far as a follow-up can trail its first reminder (C2), so
  // a dose or a reminder whose time has gone by but is still unmarked keeps
  // its follow-ups at the next reconcile rather than losing them. Anything
  // behind now gets follow-ups only, never a second first reminder.
  const lookback = new Date(now.getTime() - KEEP_REMINDING_LOOKBACK_MINUTES * 60_000);
  const [candidates, datedSources, routines, checks, preferences, checkinInputs, seriesInputs] = await Promise.all([
    listTravelAdjustedCandidates(lookback, horizon, now),
    listDatedReminderSources(today),
    listRoutineReminders(),
    listCheckReminders(),
    getReminderPreferences(),
    getCheckinReminderInputs(since),
    listSeriesReminderInputs(localDay(now)),
  ]);
  const nudging = isNudgeUntilDoneEnabled(preferences);
  // Water reminders stop at the target (G35): once today's logged water
  // reaches the daily target, the rest of today's hydration reminders and
  // their follow-ups are left out. Read only when hydration reminders are
  // on, and a failed read keeps every reminder rather than dropping any.
  let waterReached = false;
  if (isReminderKindEnabled(preferences, 'hydration')) {
    try {
      const analysis = await getDailyNutrientAnalysis(today);
      const water = analysis.entries.find((entry) => entry.nutrientCode === 'water');
      // The target moves with the day's activity (G36), so the reminders
      // stop at the same figure Hydration shows.
      const moved = water ? await getMovedWaterTarget(today, water.target) : null;
      waterReached = waterTargetReached(water && moved ? { combinedTotal: water.combinedTotal, target: moved.targetMl } : water);
    } catch (error) {
      console.warn('[reminderNotifications] could not read the water total for today', error);
    }
  }

  const first = new Map<string, PlannedNotification>();
  const followUps = new Map<string, PlannedNotification>();

  for (const candidate of candidates) {
    if (!isReminderKindEnabled(preferences, reminderKindFor(candidate))) continue;
    const planned = buildPlanned(candidate, now);
    if (!planned) continue;
    if (reminderKindFor(candidate) === 'hydration' && skipHydrationReminder(planned.fireAt, now, waterReached)) continue;
    if (planned.fireAt.getTime() > now.getTime()) first.set(planned.identifier, planned);
    for (const nudge of buildNudges(planned, now, candidate.keepRemindingMinutes ?? null, nudging)) {
      followUps.set(nudge.identifier, nudge);
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
        if (index === 0) {
          for (const nudge of buildNudges(planned, now, routine.keepReminding, nudging)) followUps.set(nudge.identifier, nudge);
        }
      });
      // Today's, already gone by and not walked yet: its follow-ups only.
      const earlier = outstandingSince(todaysRoutineMoment(routine, now), now);
      if (earlier && !routineDoneToday(routine, now)) {
        const planned = buildRoutinePlanned(routine, earlier, now);
        for (const nudge of buildNudges(planned, now, routine.keepReminding, nudging)) followUps.set(nudge.identifier, nudge);
      }
    }
  }

  // Planned exercise (H11 part 3). The next day ahead is a first-time
  // reminder and the rest of the week queues behind, the way routines do.
  // A failed read leaves exercise out of this pass rather than failing the
  // whole reconcile.
  if (isReminderKindEnabled(preferences, 'exercise')) {
    try {
      const [plans, marks, workouts] = await Promise.all([listExercisePlans(), listPlanMarks(), listWorkouts()]);
      const names = new Map(workouts.map((workout) => [workout.id, workout.name]));
      for (const plan of plans) {
        reminderMoments(plan, marks, now, LOOKAHEAD_DAYS).forEach((moment, index) => {
          const planned = buildExercisePlanned(plan, planTitle(plan, names), moment.date, moment.fireAt);
          (index === 0 ? first : followUps).set(planned.identifier, planned);
        });
      }
    } catch (error) {
      console.warn('[reminderNotifications] could not read planned exercise', error);
    }
  }

  // A Did I Do It check with a time (C2). Today's moment may already have
  // gone by, in which case it only carries follow-ups; the next one still
  // ahead is a first-time reminder and the rest of the week queues behind.
  if (isReminderKindEnabled(preferences, 'check')) {
    for (const check of checks) {
      const reminder = { time: check.reminderTime, days: check.reminderDays, on: check.reminderOn };
      let firstAhead = true;
      for (const fireAt of checkReminderTimes(check, reminder, now, LOOKAHEAD_DAYS)) {
        const planned = buildCheckPlanned(check, fireAt, now);
        if (fireAt.getTime() <= now.getTime()) {
          if (outstandingSince(fireAt, now)) {
            for (const nudge of buildNudges(planned, now, check.keepReminding, nudging)) followUps.set(nudge.identifier, nudge);
          }
          continue;
        }
        (firstAhead ? first : followUps).set(planned.identifier, planned);
        if (firstAhead) {
          for (const nudge of buildNudges(planned, now, check.keepReminding, nudging)) followUps.set(nudge.identifier, nudge);
        }
        firstAhead = false;
      }
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
  // The morning check-in (D7), planned the same way, skipped this morning
  // once it has been answered.
  if (isReminderKindEnabled(preferences, 'morning')) {
    const answeredToday = !!checkinInputs.lastMorningAt && checkinInputs.lastMorningAt.slice(0, 10) === localDay(now);
    planDailyCheckins(morningTimeOf(preferences), now, LOOKAHEAD_DAYS - 1, answeredToday).forEach((fireAt, index) => {
      const planned = buildMorningPlanned(fireAt, now);
      (index === 0 ? first : followUps).set(planned.identifier, planned);
    });
  }
  // Your week (F13): the lookahead is a week, so at most one of these is
  // queued at a time, on the weekday the person picked.
  if (isReminderKindEnabled(preferences, 'week')) {
    const weekDay = weekDayOf(preferences);
    planDailyCheckins(weekTimeOf(preferences), now, LOOKAHEAD_DAYS, false)
      .filter((fireAt) => fireAt.getDay() === weekDay)
      .slice(0, 1)
      .forEach((fireAt) => {
        const planned = buildWeekPlanned(fireAt);
        first.set(planned.identifier, planned);
      });
  }
  // This week's meals (H10): at most one queued, like Your week. The meals
  // are read only when the kind is on, and a failed read leaves the
  // notification out rather than sending an empty week.
  if (isReminderKindEnabled(preferences, 'weekPlan')) {
    const planDay = weekPlanDayOf(preferences);
    const fireAt = planDailyCheckins(weekPlanTimeOf(preferences), now, LOOKAHEAD_DAYS, false).find(
      (at) => at.getDay() === planDay,
    );
    if (fireAt) {
      try {
        const days = weekPlanDays(fireAt);
        const meals = await listScheduledMealsForDateRange(days[0], days[days.length - 1]);
        const planned = buildWeekPlanPlanned(fireAt, buildWeekPlanBody(meals, fireAt, now));
        first.set(planned.identifier, planned);
      } catch (error) {
        console.warn('[reminderNotifications] could not read the week of planned meals', error);
      }
    }
  }
  // This month in the garden (I12): one queued at a time, and it may sit up
  // to 32 days ahead rather than the week the other kinds look, since what
  // it says depends only on the date and the frost dates, and a month that
  // started while the app went unopened for a week would otherwise pass
  // with nothing said. The frost dates are read from what My Zone and the
  // Sowing Calendar last worked out, never fetched here.
  // Only the crops chosen in My Crops, and nothing at all when none are.
  if (isReminderKindEnabled(preferences, 'gardenMonth')) {
    const fireAt = nextGardenMonthFire(gardenMonthDayOf(preferences), gardenMonthTimeOf(preferences), now, 32);
    const chosen = fireAt ? new Set((await listCropPlans()).map((p) => p.cropKey)) : new Set<string>();
    if (fireAt && chosen.size > 0) {
      try {
        const frost = await readCachedFrostDates();
        const place: GardenMonthPlace =
          frost.status === 'ready'
            ? {
                status: 'ready',
                anchor: frostAnchor(frost.dates.frost, frost.dates.southern),
                placeLabel: frost.dates.placeLabel,
                southern: frost.dates.southern,
              }
            : frost.status === 'no-location'
              ? { status: 'no-location' }
              : { status: 'unread' };
        const planned = buildGardenMonthPlanned(fireAt, buildGardenMonthBody(place, fireAt, chosen));
        first.set(planned.identifier, planned);
      } catch (error) {
        console.warn('[reminderNotifications] could not read the frost dates for this month in the garden', error);
      }
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
  const chosen = [...first.values()].sort(byTime).slice(0, MAX_PENDING);
  const room = MAX_PENDING - chosen.length;
  if (room > 0) chosen.push(...[...followUps.values()].sort(byTime).slice(0, room));
  // With App Lock set up, the phone is handed only the kind of reminder
  // (R9, lib/lockedReminderText.ts). Done here, before the comparison below,
  // so turning full detail on or off replaces every queued reminder once.
  const hide = reminderDetailHidden();
  const kept = chosen.map((planned) => ({
    ...planned,
    ...reminderWords(planned.payload.kind, planned.title, planned.body, hide),
  }));
  const keptById = new Map(kept.map((planned) => [planned.identifier, planned]));

  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const unchanged = new Set<string>();
  for (const request of pending) {
    if (!isOurs(request.identifier)) continue;
    const want = keptById.get(request.identifier);
    const data = request.content.data as Partial<ReminderPayload> | undefined;
    // Same moment and same wording, leaving the "as of" stamp aside
    // (withoutFreshness), means the pending one is already right;
    // anything else (moved time, edited title, dropped row) is replaced.
    // The category check replaces, once, every reminder queued before its
    // buttons existed (Snooze in Phase A, the rest in C1), so each gets them.
    if (
      want &&
      data?.fireAt === want.payload.fireAt &&
      request.content.title === want.title &&
      withoutFreshness(request.content.body) === withoutFreshness(want.body) &&
      request.content.categoryIdentifier === categoryIdFor(want) &&
      // Requeues, once, every reminder queued before it carried its group.
      data?.androidGroup === androidGroupFor(want.payload.kind).androidGroup
    ) {
      unchanged.add(request.identifier);
      continue;
    }
    await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }

  let scheduled = unchanged.size;
  for (const planned of kept) {
    if (unchanged.has(planned.identifier)) continue;
    // Android shows a reminder queued for a moment already gone the instant
    // it is queued, and a reconcile runs as the app opens, so a time that
    // went by while the app was closed would arrive the moment it opened
    // (direct report, 2026-10-01). Its follow-ups, still ahead, are kept.
    if (planned.fireAt.getTime() <= Date.now()) continue;
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: planned.identifier,
        content: {
          title: planned.title,
          body: planned.body,
          data: { ...planned.payload, ...androidGroupFor(planned.payload.kind) },
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
  await refreshWaitingSummary();
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
  | { pathname: '/life'; params: { openLifeLens: LifeReminderLens } }
  | { pathname: '/routine'; params: { id: string } }
  | { pathname: '/workout'; params: { id: string; planId: string; on: string } }
  | { pathname: '/log'; params: { openSignalsLens: SignalsReminderLens } }
  | { pathname: '/reconcile' }
  | { pathname: '/waiting-answers' }
  | { pathname: '/daily-checkin' }
  | { pathname: '/'; params: { openHomeSection: 'yourWeek' } }
  | { pathname: '/food'; params: { openFoodLens: 'myFoodProducts' } }
  | { pathname: '/photo-camera'; params: { ownerKind: string; ownerId: string; guide: '1'; title: string } };

const SCHEDULE_LENSES: ScheduleLens[] = ['meds', 'appointments', 'meals', 'todaysMeals', 'hydration', 'exercise'];
// The dated lenses that live on Life. 'compost' is a dated lens too and is
// deliberately not here: it is on Garden, and this list is the fallback for
// the Life branch below.
const DATED_LENSES: LifeReminderLens[] = ['finances', 'upkeep', 'work', 'daysUntil', 'myMeds', 'didIDoIt', 'kitchen', 'todos'];

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
  if (request?.identifier === WAITING_SUMMARY_ID) return { pathname: '/waiting-answers' };
  // A16: an alert about somebody else's dose opens Meds, where the band of
  // doses you watch sits. Queued by lib/peerDosesDb.ts, not by this module.
  if (request?.identifier?.startsWith(PEER_DOSE_PREFIX)) return { pathname: '/schedule', params: { openScheduleLens: 'meds' } };
  // A14: a recall matching something kept opens the Recalls band on My Meds,
  // or the scanned products list when every match was a food. Queued by
  // lib/recallsDb.ts.
  if (request?.identifier?.startsWith(RECALL_NOTIFICATION_PREFIX)) {
    const target = (request.content.data as { target?: unknown } | undefined)?.target;
    return target === 'foods' ? { pathname: '/food', params: { openFoodLens: 'myFoodProducts' } } : { pathname: '/life', params: { openLifeLens: 'myMeds' } };
  }
  if (!request || !(isOurs(request.identifier) || isSnoozed(request.identifier))) return null;
  const data = request.content.data as Partial<ReminderPayload> | undefined;

  if (data?.tab === 'reconcile') return { pathname: '/reconcile' };
  // The morning check-in opens the one-question-at-a-time check-in, which
  // starts on how somebody slept; one queued before 1.0.58.1 says 'home'.
  if (data?.tab === 'checkinFlow' || data?.kind === 'morning') return { pathname: '/daily-checkin' };
  // Your week (F13) opens Home on its card, never on Home's top.
  if (data?.tab === 'home') return { pathname: '/', params: { openHomeSection: 'yourWeek' } };
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
  // A planned workout opens the player on it, carrying the plan and day so
  // finishing it marks that day done. A workout since removed lands on
  // Life > Workouts, which app/workout.tsx already does for an unknown id.
  if (data?.tab === 'workout') {
    if (typeof data.workoutId === 'string' && data.workoutId && typeof data.scheduleItemId === 'string' && typeof data.onDate === 'string') {
      return { pathname: '/workout', params: { id: data.workoutId, planId: data.scheduleItemId, on: data.onDate } };
    }
    return { pathname: '/schedule', params: { openScheduleLens: 'exercise' } };
  }
  // A garden task lands on Upcoming Tasks, a Days Until counter on the Days
  // Until lens where every counter is, and a pile due a turn on Compost
  // Piles. An older payload that says garden and nothing about a lens is
  // from before counters, so it can only be a task.
  if (data?.tab === 'garden') {
    if (data.lens === 'compost') return { pathname: '/garden', params: { openGardenLens: 'compost' } };
    if (data.lens === 'sowingCalendar') return { pathname: '/garden', params: { openGardenLens: 'sowingCalendar' } };
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
      data: { ...data, ...androidGroupFor(data.kind ?? ''), fireAt: fireAt.toISOString() },
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

// A press is handled once even when the cold-start read and the listener
// both report it, which they can on a launch the press itself caused.
const answered = new Set<string>();

// A press can also arrive twice across a restart: the background task
// answers it with the app closed (lib/reminderBackgroundTask.ts), and the
// same press is handed to the app again when it next opens. So a press is
// written down on this device the first time it is handled, and a second
// report of it does nothing. Taps are not written down, since a tap only
// opens a screen. Kept two weeks, far past any copy still being reported.
const ANSWER_KEEP_DAYS = 14;

async function claimAnswer(key: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.execAsync('CREATE TABLE IF NOT EXISTS notification_answers (key TEXT PRIMARY KEY, answered_at TEXT NOT NULL)');
    const now = Date.now();
    const result = await db.runAsync(
      'INSERT OR IGNORE INTO notification_answers (key, answered_at) VALUES (?, ?)',
      key,
      new Date(now).toISOString(),
    );
    await db.runAsync(
      'DELETE FROM notification_answers WHERE answered_at < ?',
      new Date(now - ANSWER_KEEP_DAYS * 86_400_000).toISOString(),
    );
    return result.changes > 0;
  } catch (error) {
    // Better to answer twice than not at all; every write behind a button
    // already checks whether its day or period is answered.
    console.error('[reminderNotifications] could not note the press', error);
    return true;
  }
}

function responseKey(response: Notifications.NotificationResponse): string {
  return `${response.notification.request.identifier}|${response.notification.date}|${response.actionIdentifier}`;
}

// What a button press writes, with the app open or closed. Written even
// while the other device has the sync session: the press is somebody
// answering on this phone, and the merge carries it across.
async function answerPress(response: Notifications.NotificationResponse): Promise<void> {
  const request = response.notification.request;
  const ours = isOurs(request.identifier) || isSnoozed(request.identifier);
  if (!ours) return;
  if (isLockedNow()) {
    await answerWhileLocked(response);
    await refreshWaitingSummary();
    return;
  }
  if (!(await claimAnswer(responseKey(response)))) return;
  const data = request.content.data as Partial<ReminderPayload> | undefined;
  const kind = data?.kind ?? '';
  if (response.actionIdentifier === SNOOZE_ACTION) {
    await snoozeReminder(response);
    await refreshWaitingSummary();
    return;
  }
  const plan = data?.kind ? planReminderAction(data.kind, response.actionIdentifier) : null;
  if (!plan) return;
  await Notifications.dismissNotificationAsync(request.identifier).catch(() => undefined);
  const words = (response.userText ?? '').trim();
  try {
    await withSessionGuardLifted(() => recordAnswer(plan, data?.scheduleItemId ?? '', words, kind));
  } finally {
    await syncReminderNotifications();
  }
}

// Every reminder of this app still on screen, grouped for Waiting for an
// Answer (lib/waitingAnswers.ts). The other notifications this app shows
// (somebody else's dose, a recall, the summary itself) carry no buttons and
// are left out. Empty wherever reminders are not shown by the phone.
export async function listWaitingReminders(): Promise<WaitingGroup[]> {
  if (!supported) return [];
  const presented = await Notifications.getPresentedNotificationsAsync();
  return groupWaiting(presented.filter(isWaitingReminder).map(toShowing), IDENTIFIER_PREFIX, SNOOZE_PREFIX);
}

function isWaitingReminder(notification: Notifications.Notification): boolean {
  const id = notification.request.identifier;
  return isOurs(id) || isSnoozed(id);
}

function toShowing(notification: Notifications.Notification): ShowingReminder {
  const { request } = notification;
  const data = request.content.data as Partial<ReminderPayload> | undefined;
  return {
    identifier: request.identifier,
    shownAt: typeof notification.date === 'number' ? notification.date : 0,
    title: request.content.title ?? 'Reminder',
    body: request.content.body ?? '',
    categoryIdentifier: request.content.categoryIdentifier ?? null,
    kind: typeof data?.kind === 'string' ? data.kind : '',
  };
}

/**
 * A button pressed on Waiting for an Answer: the same as pressing it on the
 * notification, then every other copy of that reminder (an earlier
 * follow-up, a snooze) is taken away too. False when the reminder had
 * already left the screen, answered somewhere else in the meantime.
 */
export async function answerFromList(
  copies: string[],
  actionIdentifier: string,
  userText: string | null,
): Promise<boolean> {
  if (!supported || copies.length === 0) return false;
  const presented = await Notifications.getPresentedNotificationsAsync();
  const notification = presented.find((candidate) => candidate.request.identifier === copies[0]);
  if (!notification) {
    await refreshWaitingSummary();
    return false;
  }
  const response = { notification, actionIdentifier, userText: userText ?? undefined } as Notifications.NotificationResponse;
  // Noted as handled so the same press is never handled twice.
  answered.add(responseKey(response));
  await answerPress(response);
  // A snooze keeps its new copy; the copies it replaces go.
  for (const id of copies.slice(1)) await Notifications.dismissNotificationAsync(id).catch(() => undefined);
  await refreshWaitingSummary();
  return true;
}

/**
 * Where a reminder on Waiting for an Answer opens when its words are
 * tapped: the same place a tap on the notification opens, so its details
 * are a tap away. Null once it has left the screen.
 */
export async function openWaitingReminder(identifier: string): Promise<ReminderTapTarget | null> {
  if (!supported) return null;
  const presented = await Notifications.getPresentedNotificationsAsync();
  const notification = presented.find((candidate) => candidate.request.identifier === identifier);
  if (!notification) return null;
  return resolveReminderTap({
    notification,
    actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
  } as Notifications.NotificationResponse);
}

let summaryRun: Promise<void> | null = null;

/**
 * Keeps the one summary in step with what is on screen: shown with the
 * count once two or more reminders wait, replaced only when what it says
 * has changed (so it never comes up again for nothing), and taken away at
 * one or none. Runs whenever the app does anything with reminders: opening,
 * every press (the background task included), and a reminder arriving
 * while the app is open. With the app closed and nothing pressed, nothing
 * of this app runs, so the summary catches up the next time it does.
 */
export function refreshWaitingSummary(): Promise<void> {
  if (!supported) return Promise.resolve();
  if (summaryRun) return summaryRun.then(() => refreshWaitingSummary());
  summaryRun = updateWaitingSummary()
    .catch((error) => console.error('[reminderNotifications] the waiting summary could not be updated', error))
    .finally(() => {
      summaryRun = null;
    });
  return summaryRun;
}

async function updateWaitingSummary(): Promise<void> {
  const presented = await Notifications.getPresentedNotificationsAsync();
  const groups = groupWaiting(presented.filter(isWaitingReminder).map(toShowing), IDENTIFIER_PREFIX, SNOOZE_PREFIX);
  const count = countWaiting(groups);
  await dismissEmptyGroupSummaries(presented);
  const showing = presented.find((candidate) => candidate.request.identifier === WAITING_SUMMARY_ID);
  if (count < SUMMARY_FROM) {
    if (showing) await Notifications.dismissNotificationAsync(WAITING_SUMMARY_ID).catch(() => undefined);
    return;
  }
  const title = summaryTitle(count);
  const body = summaryBody(groups);
  if (showing && showing.request.content.title === title && showing.request.content.body === body) return;
  await ensureAndroidChannels();
  await Notifications.scheduleNotificationAsync({
    identifier: WAITING_SUMMARY_ID,
    content: { title, body, data: { tab: 'waiting' }, sound: false },
    trigger: Platform.OS === 'android' ? { channelId: ANDROID_WAITING_CHANNEL_ID } : null,
  });
}

// A group heading in Android's shade with nothing left under it, which can
// happen when a reminder leaves the screen some way the patched
// expo-notifications does not see. Each heading is posted under its group
// as its tag, so it comes back here as a foreign notification whose
// identifier carries that tag.
async function dismissEmptyGroupSummaries(presented: Notifications.Notification[]): Promise<void> {
  if (Platform.OS !== 'android') return;
  const withChildren = new Set<string>();
  for (const notification of presented) {
    const group = (notification.request.content.data as Partial<ReminderPayload> | undefined)?.androidGroup;
    if (isWaitingReminder(notification) && group) withChildren.add(group);
  }
  for (const notification of presented) {
    const id = notification.request.identifier;
    const tag = /[?&]tag=([^&]*)/.exec(id)?.[1];
    const group = tag ? decodeURIComponent(tag) : null;
    if (!group || !group.startsWith(ANDROID_GROUP_PREFIX) || withChildren.has(group)) continue;
    await Notifications.dismissNotificationAsync(id).catch(() => undefined);
  }
}

// The reminder a notification belongs to, whether it is the first one, a
// nudge after it, or a snoozed copy of either.
function reminderRoot(identifier: string): string {
  const unsnoozed = isSnoozed(identifier) ? identifier.slice(SNOOZE_PREFIX.length).split('@')[0] : identifier;
  return unsnoozed.split('#nudge')[0];
}

// Answered while locked: the reminder leaves the screen with every copy of
// it, and the nudges queued to repeat it are cancelled. Unlocked, the re-plan
// after the answer is written drops them; locked, that re-plan has to wait
// for the database, and an answered reminder asking again later reads as the
// button having done nothing.
async function clearAnsweredWhileLocked(identifier: string): Promise<void> {
  const root = reminderRoot(identifier);
  await Notifications.dismissNotificationAsync(identifier).catch(() => undefined);
  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    for (const notification of presented) {
      const id = notification.request.identifier;
      if (id !== identifier && reminderRoot(id) === root) {
        await Notifications.dismissNotificationAsync(id).catch(() => undefined);
      }
    }
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const queued of scheduled) {
      if (queued.identifier !== root && reminderRoot(queued.identifier) === root) {
        await Notifications.cancelScheduledNotificationAsync(queued.identifier).catch(() => undefined);
      }
    }
  } catch (error) {
    console.warn('[reminderNotifications] the follow-ups of a press while locked could not all be cleared', error);
  }
}

// App Lock on and nobody unlocked: the database cannot be opened, so the
// press does everything it can without it now (a snooze is set, the
// reminder and its queued nudges go, the energy question follows a sleep answer)
// and is sealed for the next unlock, which writes it with the time it was
// pressed (applyWaitingAnswers). No passcode is asked for, since a button
// that needed one would not be worth having.
async function answerWhileLocked(response: Notifications.NotificationResponse): Promise<void> {
  const request = response.notification.request;
  const data = request.content.data as Partial<ReminderPayload> | undefined;
  const pressedAt = new Date();
  const snooze = response.actionIdentifier === SNOOZE_ACTION;
  const plan = !snooze && data?.kind ? planReminderAction(data.kind, response.actionIdentifier) : null;
  if (!snooze && !plan) return;
  if (snooze) await snoozeReminder(response);
  else await clearAnsweredWhileLocked(request.identifier);
  if (plan?.write === 'sleepQuality') await presentMorningEnergy(localDateString(pressedAt));
  const kept = await keepAnswerForUnlock({
    identifier: request.identifier,
    date: response.notification.date,
    actionIdentifier: response.actionIdentifier,
    userText: response.userText ?? null,
    data: (request.content.data ?? null) as Record<string, unknown> | null,
    pressedAt: pressedAt.toISOString(),
    handled: snooze ? 'snoozed' : null,
  });
  if (!kept) console.error('[reminderNotifications] a press while locked could not be kept');
}

// Every press kept while locked, written now that the key is held, each
// with the time it was pressed. Claimed the same way as any press, so the
// same press handed over again by Android afterwards does nothing.
async function applyWaitingAnswers(): Promise<void> {
  const waiting = takeWaitingAnswers();
  if (waiting.length === 0) return;
  for (const answer of waiting) {
    try {
      const key = `${answer.identifier}|${answer.date}|${answer.actionIdentifier}`;
      if (!(await claimAnswer(key))) continue;
      if (answer.handled === 'snoozed') continue;
      const data = (answer.data ?? {}) as Partial<ReminderPayload>;
      const kind = data.kind ?? '';
      const plan = kind ? planReminderAction(kind, answer.actionIdentifier) : null;
      if (!plan) continue;
      const words = (answer.userText ?? '').trim();
      await withSessionGuardLifted(() =>
        recordAnswer(plan, data.scheduleItemId ?? '', words, kind, new Date(answer.pressedAt)),
      );
    } catch (error) {
      console.error('[reminderNotifications] a press kept while locked could not be written', error);
    }
  }
  await syncReminderNotifications();
}

// The background task's way in (lib/reminderBackgroundTask.ts). A tap is
// left alone there, since it opens the app and the app answers it.
export async function answerFromBackground(response: Notifications.NotificationResponse): Promise<void> {
  if (!supported) return;
  if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  console.log('[reminderPress] background task', response.notification.request.identifier, response.actionIdentifier);
  const key = responseKey(response);
  if (answered.has(key)) return;
  answered.add(key);
  await answerPress(response);
}

// A tap that arrived while the app was locked, kept for the app to open
// once it is unlocked (listenForReminderTaps).
let tapWhileLocked: Notifications.NotificationResponse | null = null;

// Mounted by the lock gate, which is there whether the app is locked or not
// (components/AppLockGate.tsx). The rest of the app does not mount until it
// is unlocked, so with only its listener, a button pressed while the app sat
// on its passcode screen was held by Android until somebody unlocked
// (2026-10-07). A press is answered here at once, and sealed for the next
// unlock when the key is not held; a tap waits for the app to open.
export function listenForReminderPresses(): () => void {
  if (!supported) return () => {};
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      if (!tapListenerMounted) tapWhileLocked = response;
      return;
    }
    console.log('[reminderPress] listener', response.notification.request.identifier, response.actionIdentifier, 'locked', isLockedNow());
    handleResponse(response, () => undefined);
  });
  return () => subscription.remove();
}

let tapListenerMounted = false;

// A button does its work where it is pressed and never opens the app
// (1.0.53.10): the record is written and the reminder is taken off the
// screen. Nothing else is shown, since the press itself is the confirmation. Only a tap on the
// reminder itself opens the app, on the lens the thing lives in.
function handleResponse(
  response: Notifications.NotificationResponse | null,
  navigate: (target: ReminderTapTarget) => void,
): void {
  if (!response) return;
  const key = responseKey(response);
  if (answered.has(key)) return;
  answered.add(key);
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    answerPress(response)
      .then(() => console.log('[reminderPress] answered', key))
      .catch((error) => console.error('[reminderNotifications] answer failed', error));
    return;
  }
  const target = resolveReminderTap(response);
  if (target) navigate(target);
}

// The same record the app writes when the thing is answered where it lives:
// the schedule status Reconciliation writes, a doing in Upkeep, a turn on
// the pile, a check-in in Signals. Upkeep and compost check first whether
// today is already recorded, so a second press from a copy still on screen
// adds nothing. A note with no words is not a note, so nothing is written.
async function recordAnswer(
  plan: ReminderActionPlan,
  id: string,
  words: string,
  kind: string,
  now: Date = new Date(),
): Promise<void> {
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
  if (plan.write === 'sleepQuality' || plan.write === 'morningEnergy') {
    // The same row the card and the check-in write, one a morning, so a
    // press after answering in the app changes that answer and keeps the
    // rest of it. The energy question follows a sleep press only while
    // energy has no answer yet.
    const saved = await getMorningCheckin(now);
    const sleepQuality = plan.write === 'sleepQuality' ? plan.value : saved?.sleepQuality ?? null;
    const energy = plan.write === 'morningEnergy' ? plan.value : saved?.energy ?? null;
    await saveMorningCheckin({ existingId: saved?.id ?? null, sleepQuality, energy, notes: saved?.notes ?? '', at: now });
    // A press kept while locked asked the energy question when it was pressed.
    const answeredJustNow = Date.now() - now.getTime() < 60_000;
    if (plan.write === 'sleepQuality' && energy === null && answeredJustNow) await presentMorningEnergy(today);
    return;
  }
  if (!id) return;
  if (plan.write === 'scheduleStatus') {
    await setScheduleItemStatus(id, plan.status);
    return;
  }
  if (plan.write === 'checkMarked') {
    // Pressed twice, or pressed after a routine already ticked it: the
    // second press writes nothing, since the period is already answered.
    const check = (await listCheckReminders()).find((candidate) => candidate.id === id);
    if (check && checkReminderTimes(check, { time: check.reminderTime, days: [], on: true }, now, 0).length === 0) return;
    await markDoneCheck(id, 'tap', null, now.toISOString());
    return;
  }
  if (plan.write === 'upkeepDone') {
    const item = (await listUpkeepItems()).find((candidate) => candidate.id === id);
    if (!item || item.lastDoneOn === today) return;
    await markUpkeepDone(id, today);
    return;
  }
  if (plan.write === 'todoDone') {
    // A copy still on screen after it was done, or after the day moved on,
    // writes nothing.
    const todo = await getTodo(id);
    if (!todo || todo.doneAt) return;
    await markTodoDone(id, today);
    return;
  }
  if (plan.write === 'cropStep') {
    // The id names the crop and the window; a second press adds nothing.
    const parsed = parseCropStepSourceId(id);
    if (!parsed) return;
    await recordCropStep(parsed.planId, parsed.action, parsed.windowStart, plan.step, today);
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
  // Presses kept while locked go in first, so the same press handed over
  // again just below finds itself already answered.
  applyWaitingAnswers()
    .catch((error) => console.error('[reminderNotifications] kept presses not written', error))
    .then(() => Notifications.getLastNotificationResponseAsync())
    .then((response) => {
      handleResponse(response, navigate);
      if (response) Notifications.clearLastNotificationResponse();
    })
    .catch((error) => console.error('[reminderNotifications] getLastNotificationResponseAsync failed', error));
  // Button presses are answered by listenForReminderPresses, which is
  // always mounted; this one opens what a tap points at.
  tapListenerMounted = true;
  const waitingTap = tapWhileLocked;
  tapWhileLocked = null;
  if (waitingTap) handleResponse(waitingTap, navigate);
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    handleResponse(response, navigate);
  });
  // A reminder arriving while the app is open brings the summary up to date.
  const arrivals = Notifications.addNotificationReceivedListener((notification) => {
    if (isWaitingReminder(notification)) void refreshWaitingSummary();
  });
  return () => {
    tapListenerMounted = false;
    subscription.remove();
    arrivals.remove();
  };
}
