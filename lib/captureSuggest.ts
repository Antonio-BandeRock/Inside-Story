// Where a waiting note probably goes (C8, 2026-09-30).
//
// Direct instruction when it was agreed: "it must not be some random guess
// or this will be a completely useless, more time consuming function." So a
// suggestion rests on evidence, strongest first:
//
//   1. How this person has sorted notes before: the same words sorted the
//      same way, and words that have gone to one place nearly every time.
//      Moving a note is a correction, and since only where a note ended up
//      is stored, the correction is what gets learned.
//   2. Their records: the note names something the app already knows they
//      keep (a crop growing, an Upkeep item, a regular bill, a med, a food
//      put on the grocery list before, a Kitchen item).
//   3. How the sentence is built: a leading action word ("buy", "prune",
//      "pay", "mention"), a day or a time, a phrase saying where something
//      is.
//
// It speaks only when the evidence clears a bar and points one way. Two
// places close together are both offered; weak or scattered evidence says
// nothing at all, and the note looks as it always did. Every suggestion
// carries its reason, one tap accepts it, and nothing is ever filed by
// itself.
//
// Pure, no React and no I/O, so scripts/test_capture_suggest.js checks it
// against a set of labelled notes, including ones that must stay quiet.

import { captureDestination, type CaptureDestinationKey } from './captureNotes';

/** What the app already knows the person keeps, gathered by
 *  lib/captureSuggestDb.ts. Plain names, as stored. */
export type SuggestVocabulary = {
  growing: string[];
  gardenAreas: string[];
  upkeep: string[];
  bills: string[];
  accounts: string[];
  meds: string[];
  groceries: string[];
  kitchen: string[];
};

export const EMPTY_VOCABULARY: SuggestVocabulary = {
  growing: [],
  gardenAreas: [],
  upkeep: [],
  bills: [],
  accounts: [],
  meds: [],
  groceries: [],
  kitchen: [],
};

export type SortedExample = { text: string; destination: CaptureDestinationKey };

export type CaptureSuggestion = {
  key: CaptureDestinationKey;
  label: string;
  reason: string;
  score: number;
};

type EvidenceKind = 'repeat' | 'learned' | 'record' | 'lead' | 'cue' | 'crop';

type Evidence = { key: CaptureDestinationKey; kind: EvidenceKind; weight: number; reason: string };

// ------------------------------------------------------------------ words

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'for', 'to', 'in', 'on', 'at', 'by', 'with', 'from', 'up',
  'my', 'our', 'your', 'his', 'her', 'their', 'its', 'it', 'this', 'that', 'these', 'those', 'is', 'are',
  'was', 'were', 'be', 'been', 'i', 'we', 'me', 'us', 'you', 'he', 'she', 'they', 'them', 'some', 'any',
  'more', 'about', 'into', 'again', 'also', 'just', 'too', 'very', 'so', 'if', 'then', 'there', 'here',
  'do', 'does', 'did', 'have', 'has', 'had', 'will', 'can', 'should', 'need', 'needs', 'get', 'got',
  'new', 'next', 'not', 'no', 'all', 'out', 'off', 'over', 'one', 'two', 'as', 're',
]);

/** 'Tomatoes' and 'tomato', 'berries' and 'berry', 'boxes' and 'box' meet. */
export function singular(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith('oes')) return word.slice(0, -2);
  if (word.length > 4 && /(ch|sh|x|ss|z)es$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

/** The words in a note that can carry meaning, lowercased and singular. */
export function noteWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/'s\b/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word))
    .map(singular);
}

function normalisedText(text: string): string {
  return noteWords(text).join(' ');
}

/** A record's name reduced to the words that must all appear in a note for
 *  the note to be about it. For a food, only the part before the first
 *  comma ('Eggs, whole, raw' is eggs). Null when nothing is left worth
 *  matching on. */
function recordWords(name: string): string[] | null {
  const head = name.split(',')[0] ?? '';
  const words = noteWords(head);
  if (words.length === 0 || words.length > 4) return null;
  if (!words.some((word) => word.length >= 3)) return null;
  return words;
}

function displayName(name: string, lower: boolean): string {
  const head = (name.split(',')[0] ?? name).trim();
  return lower ? head.toLowerCase() : head;
}

// --------------------------------------------------- how the sentence reads

// A leading action word says what is to be done with the thing, which is why
// it outranks the nouns: "buy tomato seeds" is shopping, however gardeny the
// seeds are. A STRONG lead halves the other places' noun and record evidence
// for the same reason. The learned evidence is never halved, since how this
// person sorts beats how sentences usually read.
type Lead = { key: CaptureDestinationKey; pattern: RegExp; weight: number; strong: boolean };

const OPENING = String.raw`^(?:(?:please|remember to|remind me to|don't forget to|dont forget to|must|i need to|we need to|need to|have to|got to|gotta|go and|todo:?|to do:?)\s+)*`;

function lead(key: CaptureDestinationKey, body: string, weight: number, strong: boolean): Lead {
  return { key, pattern: new RegExp(`${OPENING}(${body})\\b`, 'i'), weight, strong };
}

const LEADS: Lead[] = [
  // To buy.
  lead('shopping', String.raw`buy|purchase|pick up|grab|restock|stock up on|order more`, 4, true),
  lead('shopping', String.raw`(?:we're|we are|i'm|i am|we|i)?\s*(?:out of|ran out of|running (?:out of|low on)|low on)`, 4, true),
  lead('shopping', String.raw`need(?!\s+to\b)|more(?!\s+(?:of|than|or|and)\b)(?=\s+\w)|order(?=\s+\w)`, 3, false),
  lead('shopping', String.raw`get(?!\s+(?:\w+\s+){0,3}(?:serviced|fixed|repaired|checked|cleaned|done|looked at|back|in touch|a quote|an appointment|round|ready|rid)\b)`, 3, false),
  // Upkeep.
  lead('upkeep', String.raw`get\s+(?:\w+\s+){0,3}(?:serviced|fixed|repaired|checked|cleaned|looked at)`, 4, true),
  lead('upkeep', String.raw`replace|service|repair|fix|descale|unblock|unclog|reseal|regrout|oil the|test the smoke|check the (?:tyres|tires|oil|smoke|filter|gutters)`, 4, true),
  lead('upkeep', String.raw`clean|change the|clear the|flush|sweep|defrost|renew the (?:registration|rego|licen[cs]e)`, 3, false),
  // In the garden.
  lead('garden', String.raw`water(?!\s+(?:bill|filter|heater|softener|bottle|jug|tank|meter|company|board))|sow|plant(?!-based|\s+based)|prune|weed|mulch|harvest|transplant|repot|pot up|prick out|thin out|stake|deadhead|fertili[sz]e|feed the (?:plants|garden|lawn|roses|tomatoes|beds)|turn the compost|top dress|mow|net the|cover the (?:seedlings|beds|plants)|harden off`, 4, true),
  // Money.
  lead('money', String.raw`pay|transfer|chase|invoice|claim back|claim|reimburse|budget for|top up|move money`, 4, true),
  lead('money', String.raw`cancel(?!\s+(?:\w+\s+){0,3}(?:appointment|meeting|visit|booking|dinner|lunch|party|class)\b)`, 3, false),
  // Health.
  lead('health', String.raw`mention|ask (?:the |my )?(?:doctor|dr|gp|nurse|dentist|specialist|pharmacist|endo\w*|rheum\w*|dietitian|consultant|midwife)|tell (?:the |my )?(?:doctor|dr|gp|nurse|specialist|endo\w*)|bring up|raise with`, 4, true),
  lead('health', String.raw`keep an eye on|track my|log my|note my`, 3, false),
  // On the calendar.
  lead('calendar', String.raw`book(?!\s+(?:club|shelf|case|list|token|voucher)\b)|schedule|reschedule|make an appointment|rsvp|put in the diary|save the date`, 4, true),
  lead('calendar', String.raw`call|ring|phone|email|text|message|visit|meet`, 2.5, false),
];

type Cue = { key: CaptureDestinationKey; pattern: RegExp; weight: number; reason?: string };

const DAY_WORDS = String.raw`monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight|this weekend|next week|next month|next monday|next tuesday|next wednesday|next thursday|next friday`;
const MONTHS = String.raw`jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?`;

const CUES: Cue[] = [
  // On the calendar: a day, a date, a time, an event.
  { key: 'calendar', pattern: new RegExp(`\\b(${DAY_WORDS})\\b`, 'i'), weight: 2.5 },
  { key: 'calendar', pattern: new RegExp(`\\b(\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTHS})|(?:${MONTHS})\\s+\\d{1,2}(?:st|nd|rd|th)?|the \\d{1,2}(?:st|nd|rd|th)|\\d{1,2}/\\d{1,2}(?:/\\d{2,4})?)\\b`, 'i'), weight: 2.5 },
  { key: 'calendar', pattern: /\b(\d{1,2}(?::\d{2})?\s?(?:am|pm)|\d{1,2}:\d{2}|noon|o'clock)\b/i, weight: 1.5, reason: 'It gives a time.' },
  { key: 'calendar', pattern: /\b(appointment|appt|birthday|bday|anniversary|meeting|wedding|party|interview|recital|deadline|flight|reservation|playdate|parent evening|school play)\b/i, weight: 2.5 },
  { key: 'calendar', pattern: /\b(dentist|doctor|dr|gp|vet|haircut|hairdresser|barber|physio|therapist|optician|eye test|eye exam|checkup|check-up)\b/i, weight: 1.5 },
  // To buy.
  { key: 'shopping', pattern: /\b(groceries|grocery|shopping list|supermarket|store|shop)\b/i, weight: 2 },
  { key: 'shopping', pattern: /\b(\d+\s*(?:x|dozen|pack|packs|kg|lb|lbs|litres?|liters?|bottles?|tins?|cans?|bags?|loaves|loaf))\b/i, weight: 1.5, reason: 'It gives an amount to get.' },
  // In the garden.
  { key: 'garden', pattern: /\b(garden|raised bed|veg bed|flower bed|seedlings?|greenhouse|polytunnel|compost|soil|seeds?|plot|allotment|lawn|hose|trellis|cloche|cold frame|aphids?|slugs?|potting mix|grow light|seed tray)\b/i, weight: 2 },
  // Upkeep.
  { key: 'upkeep', pattern: /\b(filters?|gutters?|boiler|furnace|hvac|a\/c|air con|aircon|smoke (?:alarm|detector)|tyres?|tires?|oil change|registration|rego|mot|inspection|warranty|dryer vent|water heater|chimney|septic|lawnmower|dishwasher|washing machine|fridge|oven|drain|leak|leaking|roof|serviced?|sheets|batteries|battery)\b/i, weight: 2 },
  // Money.
  { key: 'money', pattern: /\b(bills?|invoice|refund|subscription|rent|mortgage|tax|taxes|bank|payment|paid|owe|owes|owed|loan|credit card|deposit|direct debit|overdraft|budget|receipt for claim|reimbursement)\b/i, weight: 2 },
  { key: 'money', pattern: /(\$\s?\d|\d+\s?(?:dollars|pesos|euros|pounds|bucks)\b|£\s?\d|€\s?\d)/i, weight: 2, reason: 'It names an amount of money.' },
  // Health.
  { key: 'health', pattern: /\b(headaches?|migraines?|rash|itch\w*|fatigue|tired|exhausted|bloat\w*|nausea|nauseous|dizzy|dizziness|pain|aches?|aching|sore|cramps?|flare|flaring|swelling|swollen|fever|cough|heartburn|reflux|diarrh\w*|constipat\w*|insomnia|anxious|anxiety|brain fog|hair loss|palpitations?|joints?|numb\w*|tingl\w*)\b/i, weight: 2 },
  { key: 'health', pattern: /\b(dose|dosage|prescription|refill|medication|meds|side effects?|blood test|bloodwork|labs|tsh|thyroid|symptoms?)\b/i, weight: 1.5 },
  // Where it is.
  { key: 'place', pattern: /\b(?:is|are|was|were|'s|now)\s+(?:in|on|under|behind|inside|beside|next to|on top of|at the back of|at the bottom of)\s+(?:the|my|our|a|his|her|their|mum's|dad's)\s+(?!(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|evening|afternoon|weekend|way|list|calendar)\b)\w+/i, weight: 4, reason: 'It says where something is.' },
  { key: 'place', pattern: /\b(?:left|put|kept|stored|stashed|hid|moved)\s+(?:it|them|the \w+|my \w+|our \w+|\w+)\s+(?:in|on|under|behind|inside|beside|next to)\s+(?:the|my|our|a)\b/i, weight: 4, reason: 'It says where something was put.' },
  { key: 'place', pattern: /\b(drawer|cupboard|closet|wardrobe|shelf|attic|loft|basement|cellar|glovebox|glove box|filing cabinet|safe|shoebox)\b/i, weight: 1.5 },
  { key: 'place', pattern: /\b(spare key|keys|passport|charger|remote|glasses|documents|birth certificate|title deed|manual)\b/i, weight: 1 },
];

// Crops, so a note naming one leans toward the garden a little even when
// nothing is planted yet. Kept small on purpose: most crops are also
// groceries, so this is never enough to speak on its own.
const CROP_WORDS = new Set(
  (
    'tomato pepper chili chilli potato lettuce spinach chard kale cabbage broccoli cauliflower carrot beet beetroot ' +
    'radish onion garlic leek pea bean cucumber courgette zucchini squash pumpkin corn sweetcorn basil parsley ' +
    'coriander cilantro mint rosemary thyme oregano sage dill chive strawberry raspberry blackberry blueberry ' +
    'gooseberry currant rhubarb asparagus celery okra eggplant aubergine melon watermelon rose herb ' +
    'sunflower marigold nasturtium lavender'
  ).split(' '),
);

// ------------------------------------------------------------------- model

export type SuggestModel = {
  vocabulary: SuggestVocabulary;
  // Normalised text of a sorted note to where it went, the latest winning.
  repeats: Map<string, CaptureDestinationKey>;
  // Word to how many sorted notes containing it went to each place.
  learned: Map<string, Map<CaptureDestinationKey, number>>;
};

export function buildSuggestModel(vocabulary: SuggestVocabulary, sorted: SortedExample[]): SuggestModel {
  const repeats = new Map<string, CaptureDestinationKey>();
  const learned = new Map<string, Map<CaptureDestinationKey, number>>();
  for (const example of sorted) {
    const text = normalisedText(example.text);
    if (text) repeats.set(text, example.destination);
    for (const word of new Set(noteWords(example.text))) {
      if (word.length < 3 || /^\d+$/.test(word)) continue;
      const counts = learned.get(word) ?? new Map<CaptureDestinationKey, number>();
      counts.set(example.destination, (counts.get(example.destination) ?? 0) + 1);
      learned.set(word, counts);
    }
  }
  return { vocabulary, repeats, learned };
}

// A word teaches where notes go once it has turned up in at least two sorted
// notes and gone to one place in at least three out of four of them.
const LEARN_MIN_NOTES = 2;
const LEARN_MIN_AGREEMENT = 0.75;
// Each agreeing note adds one, so a word sorted the same way three times is
// enough to speak on by itself.
const LEARNED_PER_NOTE = 1;
const LEARNED_WORD_CAP = 3;
const LEARNED_CAP = 4;
const RECORD_CAP = 3;
const CUE_CAP = 4;

// The bar. A suggestion needs a total of at least SPEAK_AT. A second place is
// offered beside it when that one also reaches SECOND_AT and is within
// CLOSE_GAP of the first. With three places that close it says nothing.
const SPEAK_AT = 3;
const SECOND_AT = 2.5;
const CLOSE_GAP = 1.5;

function quoted(text: string): string {
  return `“${text}”`;
}

function placeLabel(key: CaptureDestinationKey): string {
  return captureDestination(key)?.label ?? key;
}

function recordEvidence(words: Set<string>, vocabulary: SuggestVocabulary): Evidence[] {
  const out: Evidence[] = [];
  const seen = new Set<string>();
  const check = (
    names: string[],
    key: CaptureDestinationKey,
    weight: number,
    lower: boolean,
    sentence: (name: string) => string,
  ) => {
    for (const name of names) {
      const need = recordWords(name);
      if (!need || !need.every((word) => words.has(word))) continue;
      const shown = displayName(name, lower);
      const id = `${key}:${shown.toLowerCase()}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ key, kind: 'record', weight: weight + 0.25 * (need.length - 1), reason: sentence(shown) });
    }
  };
  check(vocabulary.growing, 'garden', 2, true, (name) => `You have ${name} growing in your garden.`);
  check(vocabulary.gardenAreas, 'garden', 2, false, (name) => `${quoted(name)} is one of your garden areas.`);
  check(vocabulary.upkeep, 'upkeep', 2.5, false, (name) => `${quoted(name)} is on your Upkeep list.`);
  check(vocabulary.bills, 'money', 2.5, false, (name) => `${quoted(name)} is one of your regular payments.`);
  check(vocabulary.accounts, 'money', 1.5, false, (name) => `${quoted(name)} is one of your accounts.`);
  check(vocabulary.meds, 'health', 2, false, (name) => `${quoted(name)} is one of your meds.`);
  check(vocabulary.groceries, 'shopping', 2, true, (name) => `You have put ${name} on the grocery list before.`);
  check(vocabulary.kitchen, 'shopping', 1.5, true, (name) => `You keep ${name} in your kitchen.`);
  return out;
}

function gatherEvidence(text: string, model: SuggestModel): { evidence: Evidence[]; strongLead: CaptureDestinationKey | null } {
  const evidence: Evidence[] = [];
  const trimmed = text.trim().replace(/^[-*•]\s*/, '');
  const words = noteWords(trimmed);
  const wordSet = new Set(words);

  // 1. How this person has sorted before.
  const repeat = model.repeats.get(words.join(' '));
  if (repeat) {
    evidence.push({ key: repeat, kind: 'repeat', weight: 5, reason: `You sorted the same words to ${placeLabel(repeat)} before.` });
  }
  for (const word of wordSet) {
    const counts = model.learned.get(word);
    if (!counts) continue;
    let total = 0;
    let bestKey: CaptureDestinationKey | null = null;
    let best = 0;
    for (const [key, count] of counts) {
      total += count;
      if (count > best) {
        best = count;
        bestKey = key;
      }
    }
    if (bestKey && total >= LEARN_MIN_NOTES && best / total >= LEARN_MIN_AGREEMENT) {
      evidence.push({
        key: bestKey,
        kind: 'learned',
        weight: Math.min(LEARNED_WORD_CAP, best * LEARNED_PER_NOTE),
        reason: `You have sorted notes with ${quoted(word)} to ${placeLabel(bestKey)} before.`,
      });
    }
  }

  // 2. Their records.
  evidence.push(...recordEvidence(wordSet, model.vocabulary));

  // 3. How the sentence reads. Only the first matching lead counts: a note
  // starts one way.
  let strongLead: CaptureDestinationKey | null = null;
  for (const candidate of LEADS) {
    const match = candidate.pattern.exec(trimmed);
    if (!match) continue;
    const word = (match[1] ?? '').trim().toLowerCase();
    evidence.push({ key: candidate.key, kind: 'lead', weight: candidate.weight, reason: `It starts with ${quoted(word)}.` });
    if (candidate.strong) strongLead = candidate.key;
    break;
  }
  for (const cue of CUES) {
    const match = cue.pattern.exec(trimmed);
    if (!match) continue;
    const word = (match[1] ?? match[0]).trim().toLowerCase();
    evidence.push({ key: cue.key, kind: 'cue', weight: cue.weight, reason: cue.reason ?? `It mentions ${quoted(word)}.` });
  }
  // A crop already matched as one they are growing is the same evidence, so
  // it is not counted twice.
  const growingWords = new Set(model.vocabulary.growing.flatMap((name) => recordWords(name) ?? []));
  const crop = words.find((word) => CROP_WORDS.has(word) && !growingWords.has(word));
  if (crop) evidence.push({ key: 'garden', kind: 'crop', weight: 1, reason: `${quoted(crop)} is something people grow.` });

  return { evidence, strongLead };
}

// When a reason is shown, the person's own evidence is named first, since
// that is what makes a suggestion worth trusting.
const REASON_ORDER: EvidenceKind[] = ['repeat', 'learned', 'record', 'lead', 'cue', 'crop'];

function scoreEvidence(evidence: Evidence[], strongLead: CaptureDestinationKey | null) {
  const scores = new Map<CaptureDestinationKey, { total: number; items: Evidence[] }>();
  const byKey = new Map<CaptureDestinationKey, Evidence[]>();
  for (const item of evidence) {
    const list = byKey.get(item.key) ?? [];
    list.push(item);
    byKey.set(item.key, list);
  }
  for (const [key, items] of byKey) {
    const sum = (kind: EvidenceKind) => items.filter((item) => item.kind === kind).reduce((acc, item) => acc + item.weight, 0);
    const halve = strongLead !== null && strongLead !== key ? 0.5 : 1;
    const personal = sum('repeat') + Math.min(LEARNED_CAP, sum('learned'));
    const records = Math.min(RECORD_CAP, sum('record')) * halve;
    const sentence = (sum('lead') + Math.min(CUE_CAP, sum('cue'))) * (key === strongLead ? 1 : halve);
    const crop = Math.min(1, sum('crop')) * halve;
    scores.set(key, { total: personal + records + sentence + crop, items });
  }
  return scores;
}

function reasonFor(items: Evidence[]): string {
  for (const kind of REASON_ORDER) {
    const best = items.filter((item) => item.kind === kind).sort((a, b) => b.weight - a.weight)[0];
    if (best) return best.reason;
  }
  return '';
}

/** Up to two places a note probably goes, or none. Never 'Just a thought'
 *  unless this person has taught it that. */
export function suggestDestinations(text: string, model: SuggestModel): CaptureSuggestion[] {
  const { evidence, strongLead } = gatherEvidence(text, model);
  const scores = scoreEvidence(evidence, strongLead);
  const ranked = [...scores.entries()]
    .filter(([key, value]) => key !== 'thought' || value.items.some((item) => item.kind === 'repeat' || item.kind === 'learned'))
    .map(([key, value]) => ({ key, total: value.total, items: value.items }))
    .sort((a, b) => b.total - a.total);
  const first = ranked[0];
  if (!first || first.total < SPEAK_AT) return [];
  const close = ranked.filter((entry) => entry !== first && entry.total >= SECOND_AT && first.total - entry.total < CLOSE_GAP);
  if (close.length > 1) return [];
  return [first, ...close].map((entry) => ({
    key: entry.key,
    label: placeLabel(entry.key),
    reason: reasonFor(entry.items),
    score: Math.round(entry.total * 100) / 100,
  }));
}

/** The line shown on a waiting note: 'To buy? You have put eggs on the
 *  grocery list before.' */
export function suggestionLine(suggestion: CaptureSuggestion): string {
  return `${suggestion.label}? ${suggestion.reason}`;
}

// -------------------------------------------------- checked against the past

export type LeaveOneOutResult = {
  checked: number;
  matched: number;
  matchedSecond: number;
  wrong: number;
  quiet: number;
};

/** Each sorted note in turn, with the rest standing in for the past: would
 *  the suggestion have matched where it went? The records are today's, so a
 *  grocery item added from the note itself can help it a little; the check
 *  says so where it is shown. */
export function leaveOneOut(vocabulary: SuggestVocabulary, sorted: SortedExample[]): LeaveOneOutResult {
  const result: LeaveOneOutResult = { checked: 0, matched: 0, matchedSecond: 0, wrong: 0, quiet: 0 };
  sorted.forEach((example, index) => {
    const rest = sorted.filter((_, other) => other !== index);
    const suggestions = suggestDestinations(example.text, buildSuggestModel(vocabulary, rest));
    result.checked += 1;
    if (suggestions.length === 0) result.quiet += 1;
    else if (suggestions[0].key === example.destination) result.matched += 1;
    else if (suggestions[1]?.key === example.destination) result.matchedSecond += 1;
    else result.wrong += 1;
  });
  return result;
}

export function describeLeaveOneOut(result: LeaveOneOutResult): string {
  if (result.checked === 0) {
    return 'Sorting suggestions: no sorted notes yet to check them against.';
  }
  const spoke = result.checked - result.quiet;
  const parts = [
    `${result.matched} matched where you put it`,
    ...(result.matchedSecond ? [`${result.matchedSecond} had it as the second choice`] : []),
    `${result.wrong} would have been wrong`,
    `${result.quiet} got no suggestion`,
  ];
  const share = spoke > 0 ? ` When it did suggest, it was right ${Math.round(((result.matched + result.matchedSecond) / spoke) * 100)}% of the time.` : '';
  return `Sorting suggestions checked against your ${result.checked} sorted notes, each one left out in turn: ${parts.join(', ')}.${share} Records are today's, so a note that led to a record can help itself a little.`;
}
