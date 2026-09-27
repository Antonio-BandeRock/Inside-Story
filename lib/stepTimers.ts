// Cook mode's timers: G4 of the competitive build plan (Phase 2,
// 2026-09-26). Cook mode shows a recipe one step at a time, and a step that
// names how long something takes ("simmer for 25-30 minutes", "bake about
// an hour") offers a button that starts a timer for it. This file finds
// those durations in the step's words and does the arithmetic; the screen
// is components/CookMode.tsx.
//
// A range starts the timer at its lower figure, since checking early costs
// nothing and checking late can burn the pan, and the button says the step
// gave a range. Days, "overnight" and anything past 48 hours are left alone:
// those are a wait, not a timer, and a ferment has its own tracker.
//
// Pure. Checked by scripts/test_step_timers.js.

export type StepTimer = {
  seconds: number;
  // "20 min", "1 hr 30 min", "45 sec"
  label: string;
  // The words in the step it came from, so the screen can say "the step
  // says 25-30 minutes".
  phrase: string;
  isRange: boolean;
};

const WORD_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  another: 1,
  'a couple of': 2,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  'forty-five': 45,
  'forty five': 45,
  fifty: 50,
  sixty: 60,
  ninety: 90,
};

const UNIT_SECONDS: Record<string, number> = { sec: 1, min: 60, hr: 3600 };
const MAX_SECONDS = 48 * 3600;

function unitOf(word: string): 'sec' | 'min' | 'hr' | null {
  const w = word.toLowerCase();
  if (/^(?:seconds?|secs?)$/.test(w)) return 'sec';
  if (/^(?:minutes?|mins?)$/.test(w)) return 'min';
  if (/^(?:hours?|hrs?)$/.test(w)) return 'hr';
  return null;
}

function numberOf(raw: string): number | null {
  const text = raw.trim().toLowerCase();
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(text);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  if (text === 'half an' || text === 'half a') return 0.5;
  return WORD_NUMBERS[text] ?? null;
}

// "20 min", "1 hr 30 min", "45 sec", "1 min 30 sec"
export function timerLabel(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (secs > 0) parts.push(`${secs} sec`);
  return parts.length > 0 ? parts.join(' ') : '0 sec';
}

const NUMBER = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|half an?|a couple of|forty[- ]five|another|an?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|ninety)`;
const UNIT = String.raw`(?:seconds?|secs?|minutes?|mins?|hours?|hrs?)`;
// "25-30 minutes", "6 to 8 minutes", "2 or 3 minutes", "an hour",
// "1 1/2 hours", "half an hour", "90 seconds"
const DURATION = new RegExp(String.raw`\b(${NUMBER})(?:\s*(?:-|\u2013|\u2014|to|or)\s*(${NUMBER}))?\s*(?:more\s+|additional\s+|extra\s+|full\s+)?(${UNIT})\b`, 'gi');

type Found = { start: number; end: number; seconds: number; unitSeconds: number; phrase: string; isRange: boolean };

function findDurations(step: string): Found[] {
  const found: Found[] = [];
  DURATION.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = DURATION.exec(step))) {
    const unit = unitOf(match[3]);
    const low = numberOf(match[1]);
    if (!unit || low === null) continue;
    // "a second loaf", "another second": a second is never counted from a
    // bare article, only from a figure ("30 seconds").
    if (unit === 'sec' && /^(?:a|an|another)$/i.test(match[1])) continue;
    const high = match[2] ? numberOf(match[2]) : null;
    found.push({
      start: match.index,
      end: match.index + match[0].length,
      seconds: low * UNIT_SECONDS[unit],
      unitSeconds: UNIT_SECONDS[unit],
      phrase: match[0],
      isRange: high !== null && high !== low,
    });
  }
  return found;
}

// Every timer a step's words name, in the order they appear, with "1 hour
// and 30 minutes" read as one timer rather than two, and the same length
// offered once.
export function timersInStep(step: string): StepTimer[] {
  const found = findDurations(step);
  const merged: Found[] = [];
  for (const item of found) {
    const previous = merged[merged.length - 1];
    const between = previous ? step.slice(previous.end, item.start) : '';
    if (previous && !previous.isRange && !item.isRange && /^\s*(?:and|,)?\s*$/i.test(between) && previous.unitSeconds > item.unitSeconds) {
      merged[merged.length - 1] = {
        start: previous.start,
        end: item.end,
        seconds: previous.seconds + item.seconds,
        unitSeconds: item.unitSeconds,
        phrase: step.slice(previous.start, item.end),
        isRange: false,
      };
    } else merged.push(item);
  }
  const seen = new Set<number>();
  const timers: StepTimer[] = [];
  for (const item of merged) {
    const seconds = Math.round(item.seconds);
    if (seconds <= 0 || seconds > MAX_SECONDS || seen.has(seconds)) continue;
    seen.add(seconds);
    timers.push({ seconds, label: timerLabel(seconds), phrase: item.phrase.trim().replace(/\s*[\u2013\u2014]\s*/g, '-'), isRange: item.isRange });
  }
  return timers;
}

// What the button says: "Start 20 min timer", and for a range "Start
// 25 min timer (the step says 25-30 minutes)" goes in its caption instead.
export function startLabel(timer: StepTimer): string {
  return `Start ${timer.label} timer`;
}

export function rangeCaption(timer: StepTimer): string | null {
  return timer.isRange ? `The step says ${timer.phrase}; this starts at the shorter time.` : null;
}

// Whole seconds left before `endsAt`, never below zero. Rounded up so a
// timer reads 0:01 until its last second has gone.
export function remainingSeconds(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

// "4:05", "1:02:09", "0:00"
export function formatRemaining(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
}

// The line a finished timer leaves on screen and in its notification.
export function timerDoneLine(stepNumber: number, timer: { label: string }, recipe?: string | null): string {
  const where = recipe?.trim() ? ` of ${recipe.trim()}` : '';
  return `The ${timer.label} timer for step ${stepNumber}${where} is up.`;
}
