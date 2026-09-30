// Plan by sentence (C9 of the competitive build plan, Phase 3, 2026-09-30).
// "Dentist next Tuesday at 3", "water the tomatoes every Friday", "pay rent on
// the 1st of every month": one sentence read into what it is, when it starts,
// how often it comes round and where it would be kept.
//
// It is built on lib/plainDate.ts for the day and the time, and on
// lib/repeatRule.ts for the repeat, so a plan read from words is stored in the
// same shape as one set up by hand and nothing downstream knows the
// difference.
//
// THE RULES IT KEEPS.
//   1. Nothing here writes anything. A reading is shown in full on the Capture
//      screen, each part beside the words it came from, and is saved only when
//      the person presses the button that names exactly what will be saved.
//   2. It says what it left alone rather than guessing. "Twice a week" does
//      not say which days, "biweekly" means two different things, "3/10" is 3
//      October in one country and 10 March in the next, and "in March" names
//      no day. Each of those becomes a sentence under the reading, and none
//      becomes a repeat or a date nobody said.
//   3. A time nobody said is shown as assumed. With no time named, the plan is
//      set for nine in the morning and the reading says so.
//
// Pure: no database, no React. Checked by scripts/test_plan_sentence.js.
import { dateKey, describePlainDate, readPlainDates } from './plainDate';
import { addDays, describeRepeat, occurrencesOf, weekdayOf, type RepeatConfig } from './repeatRule';

export type PlanKind = 'reminder' | 'appointment' | 'garden';

export const PLAN_KINDS: PlanKind[] = ['reminder', 'appointment', 'garden'];

export const PLAN_KIND_LABELS: Record<PlanKind, string> = {
  reminder: 'Reminder',
  appointment: 'Appointment',
  garden: 'Garden job',
};

/** One phrase and what it was read as: “next Tuesday” reads as Tuesday 6 October. */
export type PlanPiece = { words: string; reads: string };

export type PlanReading = {
  /** What it is, with the day, time and repeat words taken out. */
  action: string;
  /** The first time it happens. Null when no day, time or repeat could be read. */
  start: { date: string; time: string } | null;
  /** True when no time was said and nine in the morning was used. */
  timeAssumed: boolean;
  repeat: RepeatConfig;
  kind: PlanKind;
  kindReason: string;
  pieces: PlanPiece[];
  /** What it did not settle, in plain sentences. */
  unsettled: string[];
  /** Why it cannot be saved as it stands, or null when it can. */
  blocked: string | null;
};

export type PlanVocabulary = {
  /** Crops growing or planned in the garden. */
  growing?: string[];
  gardenAreas?: string[];
  meds?: string[];
};

export const PLAN_DEFAULT_TIME = '09:00';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY = '(?:sun|mon|tues|wednes|thurs|fri|satur)days?';
const LIST_JOIN = '(?:\\s*(?:,\\s*and|,|and|&)\\s*|\\s+)';
const DAY_LIST = `${DAY}(?:${LIST_JOIN}${DAY})*`;
const PLURAL_DAY_LIST = `(?:sun|mon|tues|wednes|thurs|fri|satur)days(?:${LIST_JOIN}${DAY})*`;
const COUNT_WORD = '(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)';
const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, other: 2, second: 2, '2nd': 2, third: 3, '3rd': 3,
};
const PART_OF_DAY: Record<string, string> = {
  morning: '09:00', afternoon: '15:00', evening: '19:00', night: '21:00',
};
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function countOf(word: string): number | null {
  if (/^\d+$/.test(word)) return Number(word);
  return NUMBER_WORDS[word] ?? null;
}

function weekdaysIn(words: string): number[] {
  const found = new Set<number>();
  const re = new RegExp(DAY, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(words)) !== null) {
    const index = WEEKDAYS.indexOf(match[0].replace(/s$/, ''));
    if (index >= 0) found.add(index);
  }
  return [...found].sort((a, b) => a - b);
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function clockLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

function dayLabel(date: string, now: Date): string {
  return describePlainDate({ date, time: null, matched: '' }, now);
}

// The working copy of the sentence. Every phrase that has been read is
// blanked with spaces of the same length, so positions still line up with
// the original words, and a later pattern (or plainDate) never reads the same
// words twice: "until 18 December" must not also become the start date.
class Words {
  readonly original: string;
  lower: string;
  constructor(text: string) {
    this.original = text;
    this.lower = text.toLowerCase();
  }
  at(start: number, end: number): string {
    return this.original.slice(start, end).trim();
  }
  blank(start: number, end: number) {
    // A connecting word just before a phrase goes with it: "dentist on
    // Tuesday" leaves "dentist", not "dentist on".
    const lead = /\b(?:on|at|from|starting(?:\s+on|\s+from)?|beginning|by|around|about|for|every|each)\s+$/.exec(
      this.lower.slice(0, start),
    );
    const from = lead ? lead.index : start;
    this.lower = this.lower.slice(0, from) + ' '.repeat(end - from) + this.lower.slice(end);
  }
  /** Finds a pattern in what is still unread, blanks it, and returns the match. */
  take(pattern: RegExp): RegExpExecArray | null {
    const match = new RegExp(pattern.source).exec(this.lower);
    if (!match) return null;
    this.blank(match.index, match.index + match[0].length);
    return match;
  }
  /** What is left of the original, word for word. */
  remaining(): string {
    let out = '';
    for (let i = 0; i < this.original.length; i += 1) out += this.lower[i] === ' ' ? ' ' : this.original[i];
    return out;
  }
}

type RepeatRead = {
  repeat: RepeatConfig;
  words: string;
  /** Day of the month for "on the 15th of every month". */
  monthDay?: number;
  /** A part of the day said with the repeat ("every Tuesday night"). */
  partOfDay?: string;
};

// Things that sound like a repeat and do not say enough to be one.
const VAGUE_REPEATS: { pattern: RegExp; say: (words: string) => string }[] = [
  {
    pattern: new RegExp(`\\b(?:twice|${COUNT_WORD} times)\\s+(?:a|per|each)\\s+(?:week|month)\\b`),
    say: (words) => `“${words}” does not say which days, so no repeat was set. Name them, for example every Monday and Thursday.`,
  },
  {
    pattern: new RegExp(`\\b(?:twice|${COUNT_WORD} times)\\s+(?:a|per|each)\\s+day\\b`),
    say: (words) => `“${words}” needs more than one time of day, and a plan here has one. Set the first here and add the others after.`,
  },
  {
    pattern: /\bbi-?(?:weekly|monthly)\b/,
    say: (words) => {
      const unit = /month/.test(words) ? 'month' : 'week';
      return `“${words}” can mean twice a ${unit} or every two ${unit}s, so no repeat was set. Say which, for example every 2 ${unit}s.`;
    },
  },
  {
    pattern: new RegExp(`\\bevery\\s+(?:${COUNT_WORD}\\s+)?(?:hours?|minutes?|mins?)\\b|\\bhourly\\b`),
    say: (words) => `“${words}” is more often than once a day, and a plan here repeats by the day at most. Set one time here and add the others after.`,
  },
];

function readRepeat(words: Words, unsettled: string[]): RepeatRead | null {
  for (const vague of VAGUE_REPEATS) {
    const match = words.take(vague.pattern);
    if (match) {
      unsettled.push(vague.say(words.original.slice(match.index, match.index + match[0].length).trim()));
      return null;
    }
  }

  const part = '(?:\\s+(morning|afternoon|evening|night)s?)?';
  let match = words.take(new RegExp(`\\b(?:every|each|on)\\s+(?:week\\s?day|working day)s?${part}\\b|\\bweekdays${part}\\b`));
  if (match) return { repeat: { type: 'weekly', weekdays: [1, 2, 3, 4, 5] }, words: match[0].trim(), partOfDay: match[1] ?? match[2] };
  match = words.take(new RegExp(`\\b(?:every|each|on)\\s+weekends?${part}\\b|\\bweekends${part}\\b`));
  if (match) return { repeat: { type: 'weekly', weekdays: [0, 6] }, words: match[0].trim(), partOfDay: match[1] ?? match[2] };

  // "every other Monday", "every 3rd Friday".
  match = words.take(new RegExp(`\\bevery\\s+(other|second|2nd|third|3rd|${COUNT_WORD})\\s+(${DAY_LIST})${part}\\b`));
  if (match) {
    const interval = countOf(match[1]) ?? 1;
    return { repeat: { type: 'weekly', interval, weekdays: weekdaysIn(match[2]) }, words: match[0].trim(), partOfDay: match[3] };
  }
  // "every 2 weeks on Monday", "every other week", "fortnightly".
  match = words.take(new RegExp(`\\b(?:every\\s+(other|second|${COUNT_WORD})\\s+weeks?|fortnightly|every fortnight)(?:\\s+on\\s+(${DAY_LIST}))?${part}\\b`));
  if (match) {
    const interval = match[1] ? countOf(match[1]) ?? 2 : 2;
    return {
      repeat: { type: 'weekly', interval, weekdays: match[2] ? weekdaysIn(match[2]) : [] },
      words: match[0].trim(),
      partOfDay: match[3],
    };
  }
  // "every week", "weekly", "once a week", with or without the day.
  match = words.take(new RegExp(`\\b(?:every week|each week|weekly|once a week)(?:\\s+on\\s+(${DAY_LIST}))?${part}\\b`));
  if (match) {
    return { repeat: { type: 'weekly', interval: 1, weekdays: match[1] ? weekdaysIn(match[1]) : [] }, words: match[0].trim(), partOfDay: match[2] };
  }
  // "every Monday and Thursday", "on Tuesdays", "Mondays, Wednesdays and Fridays".
  match = words.take(new RegExp(`\\b(?:every|each)\\s+(${DAY_LIST})${part}\\b`));
  if (match) return { repeat: { type: 'weekly', weekdays: weekdaysIn(match[1]) }, words: match[0].trim(), partOfDay: match[2] };
  match = words.take(new RegExp(`\\b(?:on\\s+)?(${PLURAL_DAY_LIST})${part}\\b`));
  if (match) return { repeat: { type: 'weekly', weekdays: weekdaysIn(match[1]) }, words: match[0].trim(), partOfDay: match[2] };

  // Days.
  match = words.take(new RegExp(`\\bevery\\s+(other|second|${COUNT_WORD})\\s+days?\\b`));
  if (match) {
    const interval = countOf(match[1]) ?? 1;
    const repeat: RepeatConfig = interval <= 1 ? { type: 'daily' } : { type: 'every_n_days', interval };
    return { repeat, words: match[0].trim() };
  }
  match = words.take(/\b(?:every|each)\s+(morning|afternoon|evening|night)\b|\bnightly\b|\b(?:every\s?day|each day|daily|once a day)(?:\s+(?:in the\s+|at\s+)?(morning|afternoon|evening|night))?\b/);
  if (match) {
    const partOfDay = match[1] ?? match[2] ?? (match[0].trim() === 'nightly' ? 'night' : undefined);
    return { repeat: { type: 'daily' }, words: match[0].trim(), partOfDay };
  }

  // Months. "the 15th of every month", "every month on the 1st", "monthly".
  match = words.take(/\b(?:on\s+)?the\s+(\d{1,2})(?:st|nd|rd|th)\s+of\s+(?:every|each|the)\s+month\b/);
  if (match) return { repeat: { type: 'monthly', interval: 1 }, words: match[0].trim(), monthDay: Number(match[1]) };
  match = words.take(new RegExp(`\\b(?:every\\s+(other|second|${COUNT_WORD})\\s+months?|every month|each month|monthly|once a month|quarterly|every quarter)(?:\\s+on\\s+the\\s+(\\d{1,2})(?:st|nd|rd|th))?\\b`));
  if (match) {
    const quarter = /quarter/.test(match[0]);
    const interval = quarter ? 3 : match[1] ? countOf(match[1]) ?? 1 : 1;
    return { repeat: { type: 'monthly', interval }, words: match[0].trim(), monthDay: match[2] ? Number(match[2]) : undefined };
  }
  // Years, kept as twelve months so the stored rule is one the app already has.
  match = words.take(new RegExp(`\\b(?:every\\s+(other|${COUNT_WORD})\\s+years?|every year|each year|yearly|annually|once a year)\\b`));
  if (match) {
    const years = match[1] ? countOf(match[1]) ?? 1 : 1;
    return { repeat: { type: 'monthly', interval: 12 * years }, words: match[0].trim() };
  }
  return null;
}

type EndRead =
  | { kind: 'count'; count: number; words: string }
  | { kind: 'for'; n: number; unit: string; words: string }
  | { kind: 'until'; date: string; words: string };

function readEnd(words: Words, now: Date): EndRead | null {
  let match = words.take(new RegExp(`\\bfor\\s+(?:the\\s+next\\s+)?(${COUNT_WORD}|a)\\s+(day|week|month)s?\\b`));
  if (match) {
    const n = match[1] === 'a' ? 1 : countOf(match[1]) ?? 1;
    return { kind: 'for', n, unit: match[2], words: words.original.slice(match.index, match.index + match[0].length).trim() };
  }
  match = words.take(new RegExp(`\\b(${COUNT_WORD})\\s+times\\b(?!\\s+(?:a|per|each)\\b)`));
  if (match) return { kind: 'count', count: countOf(match[1]) ?? 1, words: words.original.slice(match.index, match.index + match[0].length).trim() };
  const until = /\b(?:until|till|til|through|up to|ending)\s+/.exec(words.lower);
  if (until) {
    const from = until.index + until[0].length;
    const after = words.lower.slice(from);
    const found = readPlainDates(after, now, 'future')[0];
    const at = found?.matched ? after.indexOf(found.matched.toLowerCase()) : -1;
    if (found && at >= 0 && at <= 1) {
      const end = from + at + found.matched.length;
      const phrase = words.at(until.index, end);
      words.blank(until.index, end);
      return { kind: 'until', date: found.date, words: phrase };
    }
  }
  return null;
}

// Time words, found so they can be shown beside what they were read as and
// taken out of the action. plainDate reads the time itself; this only finds
// the words.
const TIME_PATTERN = new RegExp(
  [
    '\\b(?:at\\s+)?\\d{1,2}(?::\\d{2})?\\s*(?:a\\.?m\\.?|p\\.?m\\.?)(?![a-z])',
    '\\b(?:at\\s+)?\\d{1,2}:\\d{2}\\b',
    "\\bat\\s+\\d{1,2}(?:\\s+o'?clock)?\\b(?!\\s*(?:days?|weeks?|months?|years?|%))",
    '\\b(?:at\\s+)?(?:noon|midday|midnight)\\b',
    '\\b(?:in the\\s+)?(?:morning|afternoon|evening)\\b',
    '\\bat night\\b',
    '\\bin\\s+(?:\\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|half an)\\s+(?:minute|min|hour|hr)s?\\b',
  ].join('|'),
);

// What makes a sentence a visit rather than a thing to do.
const VISIT_WORDS = [
  'appointment', 'appt', 'dentist', 'dental', 'doctor', "doctor's", 'dr', 'gp', 'physio', 'physiotherapy',
  'therapist', 'therapy', 'counsellor', 'counselor', 'counselling', 'counseling', 'psychologist', 'psychiatrist',
  'checkup', 'check-up', 'clinic', 'hospital', 'consultant', 'specialist', 'optician', 'optometrist',
  'eye test', 'vet', 'blood test', 'blood draw', 'bloods', 'x-ray', 'mri', 'ultrasound', 'mammogram',
  'colonoscopy', 'endoscopy', 'dermatologist', 'endocrinologist', 'gastroenterologist', 'rheumatologist',
  'cardiologist', 'neurologist', 'nutritionist', 'dietitian', 'dietician', 'chiropractor', 'osteopath',
  'acupuncture', 'podiatrist', 'midwife', 'surgeon', 'orthodontist', 'hygienist', 'infusion',
];
// Verbs that make it a thing to do even when it names a visit: "call the
// dentist" is a reminder to call.
const TO_DO_VERBS = [
  'call', 'ring', 'phone', 'email', 'e-mail', 'text', 'message', 'book', 'rebook', 'cancel', 'reschedule',
  'move', 'confirm', 'pay', 'buy', 'order', 'get', 'collect', 'send', 'ask', 'check', 'find', 'look',
  'renew', 'sign', 'fill', 'print', 'post', 'return', 'take', 'bring', 'drop', 'write', 'make',
];
// The to-do verbs about buying, paying or talking to somebody: "buy compost"
// is shopping rather than a garden job, where "check the seedlings" is one.
const ERRAND_VERBS = [
  'call', 'ring', 'phone', 'email', 'e-mail', 'text', 'message', 'buy', 'order', 'get', 'pay', 'collect',
  'return', 'renew', 'send', 'ask', 'book', 'cancel',
];
// Kept to verbs that mean garden work in nearly every sentence they start;
// "train", "tie" and "net" were left out for that reason.
const GARDEN_VERBS = [
  'water', 'plant', 'sow', 'resow', 'transplant', 'harvest', 'prune', 'weed', 'mulch', 'fertilise', 'fertilize',
  'compost', 'deadhead', 'repot', 'thin', 'stake', 'mow', 'rake', 'hoe', 'propagate', 'pick',
];
const GARDEN_NOUNS = [
  'garden', 'greenhouse', 'polytunnel', 'allotment', 'seedlings', 'raised bed', 'veg bed', 'vegetable bed',
  'compost', 'worm bin', 'wormery', 'hive', 'lawn', 'hedge', 'orchard', 'houseplants', 'plants', 'grow tent',
  'hydroponics', 'cold frame',
];
const MED_WORDS = [
  'tablet', 'pill', 'dose', 'medication', 'medicine', 'meds', 'supplement', 'vitamin', 'injection', 'inhaler',
  'levothyroxine', 'thyroxine', 'insulin', 'capsule',
];

function hasWord(lower: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z])${escaped}(?:s|es)?(?![a-z])`).test(lower);
}

function firstWord(action: string): string {
  return (action.toLowerCase().match(/[a-z'-]+/) ?? [''])[0];
}

function chooseKind(action: string, repeats: boolean, vocab: PlanVocabulary): { kind: PlanKind; reason: string } {
  const lower = action.toLowerCase();
  const first = firstWord(action);
  const pickUp = /^pick\s+up\b/.test(lower);
  const toDo = TO_DO_VERBS.includes(first) || pickUp;
  const errand = ERRAND_VERBS.includes(first) || pickUp;
  const notGardenWater = first === 'water' && /\bwater\s+(?:bill|filter|softener|heater|tank|company|meter)\b/.test(lower);

  if (GARDEN_VERBS.includes(first) && !pickUp && !notGardenWater) {
    return { kind: 'garden', reason: `It starts with “${first}”, a garden job.` };
  }
  if (!errand) {
    const crop = (vocab.growing ?? []).find((name) => name.trim().length >= 3 && hasWord(lower, name.trim().toLowerCase()));
    if (crop) return { kind: 'garden', reason: `It names ${crop.trim().toLowerCase()}, which is in your garden.` };
    const area = (vocab.gardenAreas ?? []).find((name) => name.trim().length >= 3 && hasWord(lower, name.trim().toLowerCase()));
    if (area) return { kind: 'garden', reason: `It names “${area.trim()}”, one of your garden areas.` };
    const noun = GARDEN_NOUNS.find((word) => hasWord(lower, word));
    if (noun) return { kind: 'garden', reason: `It mentions the ${noun}, so it reads as a garden job.` };
  }

  const visit = VISIT_WORDS.find((word) => hasWord(lower, word));
  if (visit) {
    if (toDo) return { kind: 'reminder', reason: `It starts with “${first}”, so it reads as a reminder to do that.` };
    if (repeats) {
      return {
        kind: 'reminder',
        reason: 'It repeats, and an appointment is kept one visit at a time, so it reads as a reminder. Choose Appointment to keep the first visit only.',
      };
    }
    const named = visit === 'appointment' || visit === 'appt' ? 'an appointment' : `a visit to the ${visit}`;
    return { kind: 'appointment', reason: `It names ${named}, so it reads as an appointment.` };
  }
  return { kind: 'reminder', reason: 'Nothing in it names a visit or a garden job, so it reads as a reminder.' };
}

const LEADING_FILLER = new RegExp(
  '^(?:' +
    [
      'ok(?:ay)?', 'hey', 'so', 'please', 'remind me to', 'remind me', 'remember to', 'remember',
      "don'?t forget to", 'do not forget to', "i'?ve got to", 'i need to', 'i have to', 'i must', 'i should',
      'i want to', "i'?d like to", 'need to', 'have to', 'got to', 'gotta', 'make sure to', 'make sure i',
      'set a reminder to', 'set a reminder for', 'a reminder to', 'reminder to', 'reminder for', 'reminder',
      'schedule an?', 'schedule', "i'?ve got an?", 'i have an?', "there'?s an?", 'there is an?', 'to',
    ].join('|') +
    ')\\b[\\s,:]*',
  'i',
);
const TRAILING_EDGE = /^(?:and|then|also|on|at|from|starting|beginning|by|for|until|every|each|this|next|in|the|around|about)$/i;
const LEADING_EDGE = /^(?:and|then|also|on|at|by)$/i;

function cleanAction(text: string): string {
  let out = text.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
  let before = '';
  while (before !== out) {
    before = out;
    out = out.replace(LEADING_FILLER, '').trim();
    out = out.replace(/^[\s,.;:!?-]+|[\s,;:-]+$/g, '').trim();
    const words = out.split(' ').filter(Boolean);
    while (words.length && TRAILING_EDGE.test(words[words.length - 1].replace(/[,.;:!?]+$/, ''))) words.pop();
    while (words.length > 1 && LEADING_EDGE.test(words[0])) words.shift();
    out = words.join(' ');
  }
  out = out.replace(/[.!?,;:]+$/, '').trim();
  return out ? out[0].toUpperCase() + out.slice(1) : '';
}

function atDay(now: Date, offset: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
}

function momentOf(date: string, time: string): number {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi).getTime();
}

// "at 3" with no am or pm: plainDate reads 1 to 6 as the afternoon and 7 to
// 11 as the morning, and the reading says which it chose.
function timeReads(words: string, time: string): string {
  const lower = words.toLowerCase();
  if (/(?:a\.?m\.?|p\.?m\.?)(?![a-z])|:\d{2}|noon|midday|midnight|morning|afternoon|evening|night|minute|min|hour|hr/.test(lower)) {
    return clockLabel(time);
  }
  const hour = Number(time.slice(0, 2));
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return `${clockLabel(time)}, read as the ${part} since no am or pm was said`;
}

/**
 * A sentence read into a plan, or null when the words name no day, time or
 * repeat and nothing was left unsettled either (an ordinary note).
 */
export function readPlanSentence(text: string, now: Date, vocab: PlanVocabulary = {}): PlanReading | null {
  if (typeof text !== 'string' || text.trim().length < 3) return null;
  const words = new Words(text);
  const unsettled: string[] = [];
  const pieces: PlanPiece[] = [];

  // Left alone on purpose, and said so.
  const slashed = words.take(/\b\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?\b/);
  if (slashed) {
    unsettled.push(`“${slashed[0]}” was left alone, since the day and the month could be either way round. Say the month's name, for example 3 October.`);
  }
  const bareMonth = words.take(new RegExp(`\\b(?:in|during|by|before|end of|early|late|mid)\\s+(${MONTHS.join('|')})\\b(?!\\s*\\d)`));
  if (bareMonth) {
    const month = bareMonth[1][0].toUpperCase() + bareMonth[1].slice(1);
    unsettled.push(`A month on its own (“${bareMonth[0].trim()}”) names no day, so none was set. Say a day, for example 1 ${month}.`);
  }

  const repeatRead = readRepeat(words, unsettled);
  const end = repeatRead ? readEnd(words, now) : null;

  // Time words are found before plainDate reads the rest, so they can come
  // out of the action.
  // "Friday evening at 7" has two sets of time words, and both come out.
  const timeMatches = [...words.lower.matchAll(new RegExp(TIME_PATTERN.source, 'g'))];
  const timeWords = timeMatches.map((match) => words.at(match.index!, match.index! + match[0].length)).join(' ');
  const dates = readPlainDates(words.lower, now, 'future');
  for (const match of timeMatches) words.blank(match.index!, match.index! + match[0].length);
  const named = dates.filter((found) => found.matched);
  for (const found of named) {
    const at = words.lower.indexOf(found.matched.toLowerCase());
    if (at >= 0) words.blank(at, at + found.matched.length);
  }
  if (named.length > 1) {
    unsettled.push(`${named.length} days were named (${joinWords(named.map((found) => `“${found.matched}”`))}), and the first was used.`);
  }

  const action = cleanAction(words.remaining());
  let saidTime = dates[0]?.time ?? (repeatRead?.partOfDay ? PART_OF_DAY[repeatRead.partOfDay] : null);
  // "Friday evening at 7" and "every Tuesday night at 8": a bare hour said
  // beside a later part of the day is that hour after noon.
  let halfFromPart: string | null = null;
  const laterPart = /\b(afternoon|evening|night|tonight)\b/.exec(text.toLowerCase());
  if (saidTime && laterPart && timeWords && !/(?:a\.?m\.?|p\.?m\.?)(?![a-z])/.test(timeWords.toLowerCase())) {
    const hour = Number(saidTime.slice(0, 2));
    if (hour >= 1 && hour < 12) {
      saidTime = `${String(hour + 12).padStart(2, '0')}${saidTime.slice(2)}`;
      halfFromPart = laterPart[1] === 'tonight' ? 'tonight' : laterPart[1];
    }
  }
  if (!repeatRead && dates.length === 0 && unsettled.length === 0) return null;

  // The first time it happens.
  let start: { date: string; time: string } | null = null;
  const time = saidTime ?? PLAN_DEFAULT_TIME;
  let repeat: RepeatConfig = { type: 'none' };
  if (repeatRead) {
    repeat = { ...repeatRead.repeat };
    const explicit = named[0]?.date ?? null;
    let base = explicit ?? dateKey(now);
    if (!explicit && momentOf(base, time) <= now.getTime()) base = dateKey(atDay(now, 1));
    if (repeat.type === 'monthly' && repeatRead.monthDay && repeatRead.monthDay <= 31) {
      let probe = base;
      for (let i = 0; i < 62 && Number(probe.slice(8, 10)) !== repeatRead.monthDay; i += 1) probe = addDays(probe, 1);
      if (Number(probe.slice(8, 10)) === repeatRead.monthDay) base = probe;
    }
    if (repeat.type === 'weekly' && (repeat.weekdays ?? []).length === 0) repeat.weekdays = [weekdayOf(base)];
    const first = occurrencesOf(base, { ...repeat, endType: 'indefinite' }, { through: base })[0];
    start = { date: first?.date ?? base, time };
    if (end?.kind === 'count') {
      repeat.endType = 'count';
      repeat.count = end.count;
    } else if (end?.kind === 'for') {
      let until: string;
      if (end.unit === 'day') until = addDays(start.date, end.n - 1);
      else if (end.unit === 'week') until = addDays(start.date, end.n * 7 - 1);
      else {
        const [y, mo, d] = start.date.split('-').map(Number);
        until = addDays(dateKey(new Date(y, mo - 1 + end.n, d)), -1);
      }
      repeat.endType = 'until_date';
      repeat.until = until;
    } else if (end?.kind === 'until') {
      repeat.endType = 'until_date';
      repeat.until = end.date;
    } else {
      repeat.endType = 'indefinite';
    }
  } else if (dates[0]) {
    start = { date: dates[0].date, time };
  }

  // What each phrase was read as.
  if (named[0] && start) pieces.push({ words: named[0].matched, reads: dayLabel(named[0].date, now) });
  if (timeWords && saidTime) {
    pieces.push({
      words: timeWords,
      reads: halfFromPart ? `${clockLabel(saidTime)}, since it says ${halfFromPart}` : timeReads(timeWords, saidTime),
    });
  }
  if (repeatRead && start) {
    const years = repeat.type === 'monthly' && repeat.interval && repeat.interval % 12 === 0 ? repeat.interval / 12 : 0;
    const pattern = years === 1
      ? 'Every year'
      : years > 1
        ? `Every ${years} years`
        : describeRepeat({ ...repeat, endType: 'indefinite' }, start.date);
    const partNote = !timeWords && repeatRead.partOfDay ? `, at ${clockLabel(time)}` : '';
    pieces.push({ words: repeatRead.words, reads: `${pattern}${partNote}` });
  }
  if (end && start) {
    const reads = repeat.endType === 'count'
      ? `${repeat.count} ${repeat.count === 1 ? 'time' : 'times'} in all`
      : `The last one on or before ${dayLabel(repeat.until!, now)}`;
    pieces.push({ words: end.words, reads });
  }

  const timeAssumed = Boolean(start) && !saidTime;
  const { kind, reason } = chooseKind(action, repeat.type !== 'none', vocab);

  const medWords = [...MED_WORDS, ...(vocab.meds ?? []).map((name) => name.trim().toLowerCase())];
  if (start && kind === 'reminder' && medWords.some((word) => word.length >= 3 && hasWord(action.toLowerCase(), word))) {
    unsettled.push('A dose set up in Life > My Meds, with its times in Schedules > Meds, is checked against your meals. A reminder here is not.');
  }

  let blocked: string | null = null;
  if (!action) blocked = 'There is nothing left to call it once the day and time are taken out. Add what it is.';
  else if (!start) blocked = 'No day, time or repeat was read, so there is nothing to put on a day yet.';
  else if (momentOf(start.date, start.time) <= now.getTime()) {
    blocked = `${describePlainDate({ date: start.date, time: start.time, matched: '' }, now)} has already gone by.`;
  }

  return { action, start, timeAssumed, repeat, kind, kindReason: reason, pieces, unsettled, blocked };
}

/** "Tuesday 6 October at 3:00 PM", or with a repeat: "Every Friday at 9:00 AM, starting Friday 2 October". */
export function describePlanWhen(reading: PlanReading, now: Date): string {
  if (!reading.start) return '';
  const repeat = reading.repeat;
  if (repeat.type === 'none') return describePlainDate({ date: reading.start.date, time: reading.start.time, matched: '' }, now);
  const years = repeat.type === 'monthly' && repeat.interval && repeat.interval % 12 === 0 ? repeat.interval / 12 : 0;
  const pattern = years === 1
    ? 'Every year'
    : years > 1
      ? `Every ${years} years`
      : describeRepeat({ ...repeat, endType: 'indefinite' }, reading.start.date);
  const stops = repeat.endType === 'count' && repeat.count
    ? `, ${repeat.count} ${repeat.count === 1 ? 'time' : 'times'} in all`
    : repeat.endType === 'until_date' && repeat.until
      ? `, until ${dayLabel(repeat.until, now)}`
      : '';
  return `${pattern} at ${clockLabel(reading.start.time)}, starting ${dayLabel(reading.start.date, now)}${stops}`;
}

/** The words on the save button, naming exactly what will be kept. */
export function planSaveLabel(reading: PlanReading, kind: PlanKind): string {
  if (kind === 'appointment') return reading.repeat.type !== 'none' ? 'Save the first visit as an appointment' : 'Save as an appointment';
  return kind === 'garden' ? 'Save as a garden job' : 'Save as a reminder';
}

/** 'YYYY-MM-DDTHH:mm', the stored form of every schedule item. */
export function planScheduledFor(reading: PlanReading): string | null {
  return reading.start ? `${reading.start.date}T${reading.start.time}` : null;
}
