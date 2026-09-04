// "How long does it actually last?" -- added 2026-09-04, the analysis half
// of the hands-on therapy tracker.
//
// The question this exists to answer came in as a direct quote from a
// shared conversation describing what a tracker like Bearable is for:
// "My bladder function improves for 4 days following a sacral adjustment,
// but declines if I sit for more than 6 hours." That is a real question a
// person's own logged data can answer, and this app could not answer it
// before: lib/patternFinder.ts looks BACKWARD from a symptom to find what
// was eaten before it, which is the opposite shape. This looks FORWARD
// from a session and asks what the days after it looked like.
//
// Deliberately pure and database-free, the same reasoning lib/groceryList.ts
// carries for its own arithmetic: everything here is testable by
// scripts/test_therapy_response.js without a device or a SQLite
// connection, which matters more than usual because the failure mode is a
// plausible-looking wrong NUMBER rather than a crash.
//
// THE HONESTY RULES, all enforced below rather than left to the UI:
//
//  1. Nothing is reported at all until there are enough sessions and
//     enough check-ins to be looking at something other than noise. The
//     same MIN_OCCURRENCES reasoning lib/patternFinder.ts already
//     established: one co-occurrence is a coincidence.
//  2. A day offset with too few check-ins reports its raw counts and a
//     null share, never a percentage computed from one or two entries.
//  3. Baseline is stated explicitly and returned alongside every figure,
//     so "40% of check-ins reported something off" is always readable
//     against what that person's ordinary week already looks like.
//  4. Nothing here claims causation, and no function in this file returns
//     anything shaped like a confidence score or a p-value. It reports
//     counts and shares. See the project's own standing "Signal quality"
//     risk note.

// A check-in is attributed to at most this many days after a session.
// Seven covers the "it wore off after about a week" case people actually
// describe without stretching an attribution so far that it stops meaning
// anything.
export const MAX_FOLLOW_UP_DAYS = 7;

// Below these, nothing is reported. First-pass judgment calls, named
// rather than buried: three sessions is the smallest number where a
// repeated pattern is even possible, and three check-ins at one day
// offset is the smallest number where a share is not just one person's
// single bad morning.
export const MIN_SESSIONS = 3;
export const MIN_CHECKINS_PER_OFFSET = 3;
export const MIN_BASELINE_CHECKINS = 5;

// How far below baseline a day has to sit before it is called better.
// Expressed in absolute share (0.15 = fifteen percentage points), not a
// relative change, so a baseline that is already near zero cannot produce
// a large-looking "improvement" out of a rounding difference.
export const MEANINGFUL_MARGIN = 0.15;

export type TherapySessionPoint = {
  // Local 'YYYY-MM-DDTHH:mm', the same convention wellbeing_checkins.logged_at
  // and meals.eaten_at already use. Only the date half is read here: the
  // question is "which day," not "which hour."
  performedAt: string;
  therapyType: string;
};

export type CheckinPoint = {
  loggedAt: string;
  valence: 'positive' | 'negative' | 'neutral';
  severity: number | null;
};

export type DayOffsetSummary = {
  dayOffset: number;
  checkinCount: number;
  negativeCount: number;
  positiveCount: number;
  // null when checkinCount is below MIN_CHECKINS_PER_OFFSET. A share
  // computed from one check-in is a number the reader would trust more
  // than it deserves, so it is withheld rather than shown with a caveat.
  negativeShare: number | null;
  meanNegativeSeverity: number | null;
};

export type TherapyResponseSummary = {
  therapyType: string;
  sessionCount: number;
  baselineCheckinCount: number;
  baselineNegativeShare: number | null;
  byDayOffset: DayOffsetSummary[];
  // The last day in an unbroken run starting at day 0 whose negative
  // share sits at least MEANINGFUL_MARGIN below baseline. This is the
  // direct answer to "how many days does it last." null when day 0 itself
  // does not clear the bar, or when there is not enough data to say.
  betterThanBaselineThroughDay: number | null;
  // Days that read WORSE than baseline by the same margin, reported
  // rather than quietly dropped: a therapy that is followed by more bad
  // days is exactly as worth knowing as one that is not.
  worseThanBaselineDays: number[];
  hasEnoughData: boolean;
  notEnoughDataReason: string | null;
};

export type TherapyResponseResult = {
  summaries: TherapyResponseSummary[];
  totalSessions: number;
  totalCheckins: number;
};

// Local-date parsing, matching lib/patternFinder.ts's own deliberate
// avoidance of toISOString(): building a Date from the plain 'YYYY-MM-DD'
// half of these timestamps via `new Date(str)` would parse it as UTC
// midnight and shift the day for anyone west of Greenwich, which is
// exactly the timezone bug this app has already had to avoid elsewhere.
function parseLocalDate(timestamp: string): Date | null {
  const datePart = timestamp.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  // Guards against a syntactically valid but nonexistent date ('2026-02-31'
  // rolls forward to March 3 rather than failing).
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return null;
  }
  return parsed;
}

// Whole calendar days from `from` to `to`. Both are local midnights by
// construction above, so a plain millisecond division is safe from the
// daylight-saving off-by-one that would bite if these carried real times.
function wholeDaysBetween(from: Date, to: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

// The smallest number of days a check-in sits after any session in the
// list, or null when it falls before every session or beyond the window.
// Nearest-session assignment matters: with weekly sessions, a check-in
// three days after one session is also four days before the next, and
// counting it under both would double-count it into whichever offset
// happened to be scanned first.
function nearestFollowUpOffset(checkinDate: Date, sessionDates: Date[]): number | null {
  let best: number | null = null;
  for (const sessionDate of sessionDates) {
    const offset = wholeDaysBetween(sessionDate, checkinDate);
    if (offset < 0 || offset > MAX_FOLLOW_UP_DAYS) continue;
    if (best === null || offset < best) best = offset;
  }
  return best;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Builds one summary per therapy type that has been logged at least
 * MIN_SESSIONS times.
 *
 * Baseline is deliberately "days not within the follow-up window of ANY
 * logged session, of any type," not just of the type being summarized.
 * Someone who gets a massage on Tuesday and an adjustment on Friday has
 * no ordinary un-treated day in that week, and letting the massage days
 * count as the adjustment's baseline would quietly compare a therapy
 * against a different therapy while calling it a baseline. The cost is a
 * smaller baseline, which is why baselineCheckinCount is returned and
 * shown rather than hidden.
 */
export function summarizeTherapyResponse(
  sessions: TherapySessionPoint[],
  checkins: CheckinPoint[],
): TherapyResponseResult {
  const parsedSessions = sessions
    .map((session) => ({ date: parseLocalDate(session.performedAt), therapyType: session.therapyType }))
    .filter((session): session is { date: Date; therapyType: string } => session.date !== null);

  const parsedCheckins = checkins
    .map((checkin) => ({
      date: parseLocalDate(checkin.loggedAt),
      valence: checkin.valence,
      severity: checkin.severity,
    }))
    .filter((checkin): checkin is { date: Date; valence: CheckinPoint['valence']; severity: number | null } =>
      checkin.date !== null,
    );

  const allSessionDates = parsedSessions.map((session) => session.date);

  const sessionDatesByType = new Map<string, Date[]>();
  for (const session of parsedSessions) {
    const existing = sessionDatesByType.get(session.therapyType);
    if (existing) existing.push(session.date);
    else sessionDatesByType.set(session.therapyType, [session.date]);
  }

  // Computed once and shared by every summary, since the definition above
  // makes it identical for all of them.
  const baselineCheckins = parsedCheckins.filter(
    (checkin) => nearestFollowUpOffset(checkin.date, allSessionDates) === null,
  );
  const baselineNegatives = baselineCheckins.filter((checkin) => checkin.valence === 'negative');
  const baselineNegativeShare =
    baselineCheckins.length >= MIN_BASELINE_CHECKINS ? baselineNegatives.length / baselineCheckins.length : null;

  const summaries: TherapyResponseSummary[] = [];

  for (const [therapyType, sessionDates] of sessionDatesByType) {
    const byDayOffset: DayOffsetSummary[] = [];

    for (let dayOffset = 0; dayOffset <= MAX_FOLLOW_UP_DAYS; dayOffset += 1) {
      // A check-in belongs to this offset only if this offset is its
      // nearest one against THIS therapy's sessions, and it is not closer
      // to some other therapy's session. Without the second half, a
      // massage the day after an adjustment would have its own good day
      // credited to the adjustment as well.
      const atOffset = parsedCheckins.filter((checkin) => {
        const typeOffset = nearestFollowUpOffset(checkin.date, sessionDates);
        if (typeOffset !== dayOffset) return false;
        const anyOffset = nearestFollowUpOffset(checkin.date, allSessionDates);
        return anyOffset === dayOffset;
      });

      const negatives = atOffset.filter((checkin) => checkin.valence === 'negative');
      const positives = atOffset.filter((checkin) => checkin.valence === 'positive');
      const negativeSeverities = negatives
        .map((checkin) => checkin.severity)
        .filter((severity): severity is number => typeof severity === 'number');

      byDayOffset.push({
        dayOffset,
        checkinCount: atOffset.length,
        negativeCount: negatives.length,
        positiveCount: positives.length,
        negativeShare: atOffset.length >= MIN_CHECKINS_PER_OFFSET ? negatives.length / atOffset.length : null,
        meanNegativeSeverity: mean(negativeSeverities),
      });
    }

    const sessionCount = sessionDates.length;

    let notEnoughDataReason: string | null = null;
    if (sessionCount < MIN_SESSIONS) {
      notEnoughDataReason = `Log at least ${MIN_SESSIONS} sessions before this can show anything. You have ${sessionCount}.`;
    } else if (baselineNegativeShare === null) {
      notEnoughDataReason = `There aren't enough check-ins on days away from a session to compare against yet. ${MIN_BASELINE_CHECKINS} are needed and there are ${baselineCheckins.length}.`;
    } else if (byDayOffset.every((day) => day.negativeShare === null)) {
      notEnoughDataReason = 'There are sessions logged, but not enough check-ins in the days after them to read anything from yet.';
    }

    const hasEnoughData = notEnoughDataReason === null;

    let betterThanBaselineThroughDay: number | null = null;
    const worseThanBaselineDays: number[] = [];

    if (hasEnoughData && baselineNegativeShare !== null) {
      for (const day of byDayOffset) {
        if (day.negativeShare === null) continue;
        if (day.negativeShare > baselineNegativeShare + MEANINGFUL_MARGIN) {
          worseThanBaselineDays.push(day.dayOffset);
        }
      }

      // Walked as an unbroken run from day 0 rather than by picking out
      // whichever scattered days happen to look good: "it lasts four days"
      // means days 0 through 3 all held, not that day 0 and day 5 did.
      // A day with too little data to score breaks the run rather than
      // being skipped over, since skipping it would claim a stretch of
      // improvement across a day nothing is actually known about.
      for (let dayOffset = 0; dayOffset <= MAX_FOLLOW_UP_DAYS; dayOffset += 1) {
        const day = byDayOffset[dayOffset];
        if (day.negativeShare === null) break;
        if (day.negativeShare <= baselineNegativeShare - MEANINGFUL_MARGIN) {
          betterThanBaselineThroughDay = dayOffset;
        } else {
          break;
        }
      }
    }

    summaries.push({
      therapyType,
      sessionCount,
      baselineCheckinCount: baselineCheckins.length,
      baselineNegativeShare,
      byDayOffset,
      betterThanBaselineThroughDay,
      worseThanBaselineDays,
      hasEnoughData,
      notEnoughDataReason,
    });
  }

  // Most-logged therapy first: the one with the most sessions is the one
  // whose figures are worth the most, and it is also the one the person
  // is most likely to be asking about.
  summaries.sort((a, b) => b.sessionCount - a.sessionCount || a.therapyType.localeCompare(b.therapyType));

  return {
    summaries,
    totalSessions: parsedSessions.length,
    totalCheckins: parsedCheckins.length,
  };
}

/**
 * The one-line plain-language reading of a summary, kept here rather than
 * in the screen so the wording cannot drift between the Trends lens and
 * anything else that later shows this (a Report section, most likely).
 *
 * Deliberately never says a session caused anything. Every sentence it can
 * produce is a statement about what was logged.
 */
export function describeTherapyResponse(summary: TherapyResponseSummary, therapyLabel: string): string {
  if (!summary.hasEnoughData) {
    return summary.notEnoughDataReason ?? 'Not enough logged yet to read anything from this.';
  }

  const baselinePercent = Math.round((summary.baselineNegativeShare ?? 0) * 100);

  if (summary.betterThanBaselineThroughDay !== null) {
    const days = summary.betterThanBaselineThroughDay + 1;
    const dayWord = days === 1 ? 'day' : 'days';
    return `Across ${summary.sessionCount} sessions, the first ${days} ${dayWord} after ${therapyLabel} carried fewer check-ins reporting something off than your other days did (${baselinePercent}% of check-ins on days away from any session).`;
  }

  if (summary.worseThanBaselineDays.length > 0) {
    const dayList = summary.worseThanBaselineDays.map((day) => (day === 0 ? 'the same day' : `day ${day}`)).join(', ');
    return `Across ${summary.sessionCount} sessions, check-ins after ${therapyLabel} reported something off MORE often than your other days on ${dayList}, against ${baselinePercent}% on days away from any session. Worth raising with whoever is treating you.`;
  }

  return `Across ${summary.sessionCount} sessions, the days after ${therapyLabel} look about the same as your other days (${baselinePercent}% of check-ins reporting something off away from any session). That is a real reading, not a missing one.`;
}
