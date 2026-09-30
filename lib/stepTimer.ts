// The shrinking ring on a timed routine step (B5, 2026-09-30).
//
// Direct instruction when it was agreed: it "definitely shouldn't be turned
// on by default." So two settings, both off until somebody turns them on:
// the ring itself, and a signal when a step's time runs out. With the ring
// off, a timed step says "About 2 minutes" as it has since B4 and nothing
// counts down.
//
// What the ring is for: seeing time go by without reading a clock or doing
// sums, which is the difficulty time blindness names. What it is not for:
// judging anybody. Running over is never a failure, so past the time it
// keeps counting quietly in the same colour, never moves the walk on by
// itself, and nothing about it is written down anywhere.
//
// Pure, no React and no I/O, so scripts/test_step_timer.js checks it.

export type StepTimer = {
  /** The step's time in milliseconds. */
  totalMs: number;
  /** Time already counted before the current run, from earlier runs
   *  between pauses. */
  carriedMs: number;
  /** When the current run began, or null while paused. */
  runningSince: number | null;
};

export function startStepTimer(minutes: number, nowMs: number): StepTimer {
  return { totalMs: Math.max(0, minutes) * 60_000, carriedMs: 0, runningSince: nowMs };
}

export function elapsedMs(timer: StepTimer, nowMs: number): number {
  const running = timer.runningSince === null ? 0 : Math.max(0, nowMs - timer.runningSince);
  return timer.carriedMs + running;
}

export function pauseStepTimer(timer: StepTimer, nowMs: number): StepTimer {
  if (timer.runningSince === null) return timer;
  return { ...timer, carriedMs: elapsedMs(timer, nowMs), runningSince: null };
}

export function resumeStepTimer(timer: StepTimer, nowMs: number): StepTimer {
  if (timer.runningSince !== null) return timer;
  return { ...timer, runningSince: nowMs };
}

export function isPaused(timer: StepTimer): boolean {
  return timer.runningSince === null;
}

/** How much of the ring is left, 1 when the step starts and 0 once the
 *  time is used. Never negative: past the time the ring is simply empty. */
export function remainingFraction(timer: StepTimer, nowMs: number): number {
  if (timer.totalMs <= 0) return 0;
  const left = 1 - elapsedMs(timer, nowMs) / timer.totalMs;
  return Math.min(1, Math.max(0, left));
}

export function isPastTime(timer: StepTimer, nowMs: number): boolean {
  return elapsedMs(timer, nowMs) >= timer.totalMs;
}

/** When the time runs out, for the signal. Null while paused or once it
 *  has already passed, since there is nothing left to schedule. */
export function endsAtMs(timer: StepTimer, nowMs: number): number | null {
  if (timer.runningSince === null) return null;
  const left = timer.totalMs - elapsedMs(timer, nowMs);
  if (left <= 0) return null;
  return nowMs + left;
}

/** '1:05', '12:00', '0:09'. Seconds rounded up while counting down, so the
 *  last second reads 0:01 rather than 0:00 before the time is out. */
export function clockFace(ms: number, roundUp: boolean): string {
  const seconds = roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, '0')}`;
}

function minutesWords(totalMs: number): string {
  const minutes = Math.round(totalMs / 60_000);
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

/** The two lines inside the ring: the time, large, and what it means. */
export function timerWords(timer: StepTimer, nowMs: number): { face: string; caption: string } {
  const elapsed = elapsedMs(timer, nowMs);
  const paused = isPaused(timer);
  if (elapsed >= timer.totalMs) {
    // Counts on, quietly. The words say how far past, never that it is
    // late or too long.
    const face = clockFace(elapsed - timer.totalMs, false);
    return {
      face,
      caption: paused ? `Paused, past the ${minutesWords(timer.totalMs)}` : `Past the ${minutesWords(timer.totalMs)}`,
    };
  }
  const face = clockFace(timer.totalMs - elapsed, true);
  return { face, caption: paused ? 'Paused' : 'Left' };
}

/** The drawing: how long the circle's outline is, and how much of it to
 *  leave undrawn so the coloured arc shows what is left. */
export function ringDash(radius: number, fraction: number): { circumference: number; offset: number } {
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, fraction));
  return { circumference, offset: circumference * (1 - clamped) };
}

/** Said to a screen reader in place of the drawing. */
export function timerAccessibilityLabel(timer: StepTimer, nowMs: number): string {
  const { face, caption } = timerWords(timer, nowMs);
  if (isPastTime(timer, nowMs)) return `${caption} by ${face}`;
  return caption === 'Paused' ? `Paused with ${face} left` : `${face} left`;
}

/** The signal when the time runs out, only when somebody turned it on. It
 *  names the step and leaves moving on to them. */
export function timerSignal(routineName: string, stepText: string): { title: string; body: string } {
  return {
    title: `${routineName}: time for this step is up`,
    body: `${stepText}. Move on whenever you are ready.`,
  };
}

export const STEP_TIMER_RING_LABEL = 'Show a timer ring on timed steps';
export const STEP_TIMER_SIGNAL_LABEL = 'A signal when the time is up';

export const STEP_TIMER_HELP =
  'When a routine step has a time, like "Brush teeth, 2 minutes", a ring around it shrinks as the minutes go by, so you can see at a glance how much is left. You can pause it and start it again. Going past the time is fine: it keeps counting quietly, you move on when you are ready, and nothing about it is recorded.';

export const STEP_TIMER_SIGNAL_HELP =
  'The signal is a notification when a step\'s time runs out, with the sound or vibration your phone uses for reminders. It comes only while the ring is on and the timer is running.';
