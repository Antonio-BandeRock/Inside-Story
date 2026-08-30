// Shared helpers for quick-log, the push to make getting a meal into the
// record take seconds rather than a full builder pass. Opened 2026-08-30 as
// Open Next Steps item 21: logging discipline is this project's named #1
// risk, and nothing downstream (trend finding, pattern discovery, personal
// rules) has anything to work with if the logging itself never happens.
//
// Phase 1 (Log Again, on Home) needed none of this, since re-logging an
// already-logged meal carries its own meal type along with it. Phase 2
// (logging a scanned product straight from the barcode result) is the first
// path that has to answer "what kind of meal is this" with no prior meal to
// copy from, and phases 3 and 4 (voice, photo) will have the identical
// problem, which is why this lives here rather than inside one screen.

import type { UserProfile } from './db';

// The meal types quick-log offers. Deliberately the four ordinary eating
// occasions rather than every value meals.meal_type can hold: the others
// (beverage, salad, smoothie) describe what the food IS, and a person
// logging a scanned box of crackers at 3pm is answering when, not what. Any
// of those remain reachable through the Food builders, which ask properly.
export const QUICK_LOG_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export type QuickLogMealType = (typeof QUICK_LOG_MEAL_TYPES)[number];

export function quickLogMealTypeLabel(mealType: QuickLogMealType): string {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

// Minutes since midnight for an "HH:mm" 24-hour string, or null if it is not
// one. meals.eaten_at and every usual*Time field on a profile share this
// exact shape, so one parser covers both.
function minutesFromTime24(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

// Fallback boundaries, used only for a meal the person has set no usual time
// for. Plain clock thresholds rather than anything clever: before 4am reads
// as a snack, before 10:30 as breakfast, before 15:00 as lunch, before 21:00
// as dinner, and anything else as a snack. These exist so someone who has
// never filled in Profile still gets a sensible starting answer, not a blank.
const FALLBACK_BOUNDARIES: { before: number; mealType: QuickLogMealType }[] = [
  // Before 4am is the small-hours case: awake and eating at 2am is a snack,
  // not an early breakfast, and calling it breakfast would quietly mislabel
  // it in every trend built on meal type afterwards.
  { before: 4 * 60, mealType: 'snack' },
  { before: 10 * 60 + 30, mealType: 'breakfast' },
  { before: 15 * 60, mealType: 'lunch' },
  { before: 21 * 60, mealType: 'dinner' },
];

// A starting guess at which meal a given time of day belongs to, never a
// decision: every screen using this shows the answer and lets it be changed
// before anything is written. Prefers the person's own usual meal times
// (Profile > Meal Timing), picking whichever is closest to the time given,
// and falls back to plain clock thresholds for anyone who has not set them.
//
// Snack is deliberately excluded from the closest-match pass even when a
// usual snack time is set. A snack is the one meal type with no fixed slot
// in a day, so letting it compete on distance would have it winning at
// oddly specific moments and reading as a bug. It stays the honest catch-all
// for a time that lands near no real meal at all.
export function inferMealTypeForTime(profile: UserProfile | null, time24: string): QuickLogMealType {
  const nowMinutes = minutesFromTime24(time24);
  if (nowMinutes == null) return 'snack';

  const candidates: { mealType: QuickLogMealType; minutes: number }[] = [];
  const usualTimes: [QuickLogMealType, string | null][] = [
    ['breakfast', profile?.usualBreakfastTime ?? null],
    ['lunch', profile?.usualLunchTime ?? null],
    ['dinner', profile?.usualDinnerTime ?? null],
  ];
  for (const [mealType, usual] of usualTimes) {
    const minutes = minutesFromTime24(usual);
    if (minutes != null) candidates.push({ mealType, minutes });
  }

  if (candidates.length > 0) {
    let closest = candidates[0];
    let closestDistance = Math.abs(nowMinutes - closest.minutes);
    for (const candidate of candidates.slice(1)) {
      const distance = Math.abs(nowMinutes - candidate.minutes);
      if (distance < closestDistance) {
        closest = candidate;
        closestDistance = distance;
      }
    }
    // Beyond two hours from every usual meal time, this is closer to a snack
    // than to any meal the person actually keeps, so say so rather than
    // stretching the nearest one to cover it.
    return closestDistance <= 120 ? closest.mealType : 'snack';
  }

  for (const boundary of FALLBACK_BOUNDARIES) {
    if (nowMinutes < boundary.before) return boundary.mealType;
  }
  return 'snack';
}

// ---------------------------------------------------------------------------
// Spoken-phrase parsing, for quick-log phase 3 ("Say What You Ate")
// ---------------------------------------------------------------------------
// Everything below is pure and synchronous so it can be exercised directly
// without a database or a device. A speech recognizer hands back the literal
// words spoken and nothing else, so turning "two eggs and a slice of toast"
// into something loggable is this app's own job, the same way
// lib/voiceCommandParsing.ts already has to turn a spoken "comma" into ",".
//
// Deliberately a small, deterministic vocabulary rather than an open-ended
// grammar. Every proposal it produces is shown for confirmation before
// anything is written, so the bar here is "a good starting guess a person can
// correct in one tap", never "understands any sentence".

// Spoken quantities. Kept to what someone actually says about food: counting
// numbers up to twenty, the round tens, and the handful of fuzzy amounts that
// have a defensible number behind them. "A couple" is 2 and "a few" is 3 by
// ordinary usage; both are shown in the confirmation like any other amount,
// so a wrong reading is a visible, correctable one rather than a silent one.
const SPOKEN_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  couple: 2, few: 3,
};

// Fractions are their own table rather than more entries in the one above,
// because English combines them with a preceding number two different ways
// and getting that wrong silently changes the amount logged. "Three quarters"
// multiplies (3 x 0.25). "One and a half" adds (1 + 0.5). The difference is
// the word "and", so parseSpokenItem below tracks whether it saw one.
const SPOKEN_FRACTIONS: Record<string, number> = {
  half: 0.5, halves: 0.5, quarter: 0.25, quarters: 0.25, third: 1 / 3, thirds: 1 / 3,
};

// Spoken units mapped onto what lib/unitConversion.ts can actually convert.
// Anything not listed here falls through to 'each', which is honest: the app
// then has to find a real per-unit weight for that food, or say plainly that
// it cannot work out an amount rather than logging a zero.
const SPOKEN_UNITS: Record<string, string> = {
  gram: 'g', grams: 'g', g: 'g',
  kilogram: 'kg', kilograms: 'kg', kg: 'kg',
  ounce: 'oz', ounces: 'oz', oz: 'oz',
  pound: 'lb', pounds: 'lb', lb: 'lb', lbs: 'lb',
  milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml', ml: 'ml',
  liter: 'l', liters: 'l', litre: 'l', litres: 'l', l: 'l',
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp',
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp',
  cup: 'cup', cups: 'cup',
  pint: 'pint', pints: 'pint',
  quart: 'quart', quarts: 'quart',
};

// Words that carry no meaning for matching a food name and only ever hurt it.
const FILLER_WORDS = new Set([
  'of', 'the', 'a', 'an', 'some', 'my', 'i', 'had', 'ate', 'eating', 'have',
  'with', 'and', 'plus', 'for', 'just', 'about', 'roughly', 'around',
]);

// How a food was prepared or described. Dropped before matching, because the
// reference database names foods, not preparations: "scrambled eggs" has to
// reach "Egg" to match anything at all, and leaving the word in drags every
// score down.
//
// 2026-08-30, from a real failed attempt: "scrambled eggs and ham and bacon"
// came back as nothing matched. Two separate causes, this being the first.
//
// Dropping these only affects MATCHING. The row still shows the person their
// own words, so nothing they said disappears from view. Worth naming as not
// done: the prep word is not yet used to pick which prepared row of a food
// resolves, so a spoken "boiled" still lands on the same row a spoken "fried"
// does. That is a real gap, not a decision.
const PREP_WORDS = new Set([
  'scrambled', 'fried', 'boiled', 'poached', 'grilled', 'roasted', 'baked',
  'steamed', 'sauteed', 'sautéed', 'mashed', 'whipped', 'toasted', 'smoked',
  'cured', 'sliced', 'chopped', 'diced', 'shredded', 'minced', 'grated',
  'crushed', 'fresh', 'frozen', 'canned', 'dried', 'raw', 'cooked', 'leftover',
  'homemade', 'plain', 'hot', 'cold', 'warm',
]);

// Phrases where "and" is part of one dish's name rather than a separator.
// Deliberately short and defensible: only things that stop meaning anything if
// split. Pairs that are genuinely two foods ("bacon and eggs", "ham and
// cheese") are NOT here on purpose, because this app needs each food scored
// separately, and splitting them is the right answer rather than a compromise.
const COMPOUND_FOOD_PHRASES = [
  'macaroni and cheese',
  'mac and cheese',
  'peanut butter and jelly',
  'cookies and cream',
  'sweet and sour',
];

export type ParsedSpokenItem = {
  // Exactly what was said for this item, kept so the screen can show a person
  // their own words next to whatever the app matched them to.
  spokenText: string;
  quantity: number;
  unit: string;
  // The words left once a quantity and unit were taken off the front. This is
  // what actually gets matched against food and meal names.
  foodText: string;
};

// Commas are kept here deliberately. splitSpokenItems needs them as the
// clearest separator a person actually speaks, and an earlier version of this
// stripped them before the split ran, which silently glued "a banana, two
// eggs" into one item. Caught by running the parser against real phrases
// rather than by reading it.
function normalizeSpokenText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.,/\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// The same normalization without commas, for anything past the splitting
// step, where a stray comma inside one item is just noise.
function stripCommas(text: string): string {
  return text.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
}

const ARTICLES = new Set(['a', 'an']);

// Which "and" positions in a chunk belong to a compound dish name and must not
// be treated as separators.
function protectedJoinerIndices(words: string[]): Set<number> {
  const protectedIndices = new Set<number>();
  for (const phrase of COMPOUND_FOOD_PHRASES) {
    const phraseWords = phrase.split(' ');
    for (let start = 0; start + phraseWords.length <= words.length; start += 1) {
      let matches = true;
      for (let offset = 0; offset < phraseWords.length; offset += 1) {
        if (words[start + offset] !== phraseWords[offset]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;
      for (let offset = 0; offset < phraseWords.length; offset += 1) {
        if (phraseWords[offset] === 'and') protectedIndices.add(start + offset);
      }
    }
  }
  return protectedIndices;
}

// True when an "and" at this position is continuing a number rather than
// starting a new item: "one AND a half", "two AND a quarter". Without this the
// splitter treats the "and" as a separator and turns one and a half cups of
// oatmeal into two separate items, one of them with no food attached at all.
function andContinuesANumber(words: string[], andIndex: number): boolean {
  let cursor = andIndex + 1;
  while (cursor < words.length && ARTICLES.has(words[cursor])) cursor += 1;
  return cursor < words.length && SPOKEN_FRACTIONS[words[cursor]] != null;
}

// Splits a spoken phrase into separate items on the joining words a person
// actually uses in a list.
//
// 2026-08-30, second cause of the "scrambled eggs and ham and bacon" failure:
// this used to split on "and" ONLY when an amount followed it, so that phrase
// stayed one item and matched nothing. People list foods without saying a
// number for each one far more often than they name a compound dish, so "and"
// now separates by default and a short list of compound names is protected
// instead. An "and" continuing a number ("one and a half") is still not a
// separator either.
//
// A wrong split is a visible, correctable one: every item is shown before
// anything is logged, and an unwanted row is removed with one tap.
export function splitSpokenItems(transcript: string): string[] {
  const normalized = normalizeSpokenText(transcript);
  if (!normalized) return [];

  const commaSeparated = normalized.split(/\s*,\s*|\s+then\s+/).filter(Boolean);
  const items: string[] = [];
  for (const chunk of commaSeparated) {
    const words = chunk.split(' ').filter(Boolean);
    const protectedJoiners = protectedJoinerIndices(words);
    let current: string[] = [];
    for (let index = 0; index < words.length; index += 1) {
      const word = words[index];
      const isJoiner = word === 'and' || word === 'plus';
      if (
        isJoiner &&
        current.length > 0 &&
        words[index + 1] != null &&
        !protectedJoiners.has(index) &&
        !(word === 'and' && andContinuesANumber(words, index))
      ) {
        items.push(current.join(' '));
        current = [];
        continue;
      }
      current.push(word);
    }
    if (current.length > 0) items.push(current.join(' '));
  }
  return items.map((item) => item.trim()).filter(Boolean);
}

// Pulls a leading quantity and unit off one spoken item. Both are optional:
// "toast" parses as 1 each of toast, which is the right reading of someone who
// did not say a number at all.
//
// The fiddly part is the article. "A" means one in "a banana", but is ordinary
// English in "half a avocado", "a couple of eggs" and "one and a half". Reading
// it as a number in those turned 0.5 into 1.5, 2 into 3, and 1.5 into 2.5, all
// silently. So an article only counts as one when nothing else has been read,
// and a real number straight after it replaces it rather than adding to it.
export function parseSpokenItem(spokenText: string): ParsedSpokenItem {
  const normalized = stripCommas(normalizeSpokenText(spokenText));
  const words = normalized.split(' ').filter(Boolean);
  let index = 0;
  let quantity: number | null = null;
  // Set only while the quantity so far came from nothing but an article.
  let articleOnly = false;
  // Whether an explicit "and" has been read as part of the number, which is
  // what decides whether a following fraction adds or multiplies.
  let sawAnd = false;

  while (index < words.length) {
    const word = words[index];

    const fraction = /^(\d+)\/(\d+)$/.exec(word);
    if (fraction) {
      quantity = (quantity ?? 0) + Number(fraction[1]) / Number(fraction[2]);
      articleOnly = false;
      index += 1;
      continue;
    }

    if (/^\d+(\.\d+)?$/.test(word)) {
      quantity = articleOnly || quantity == null ? Number(word) : quantity + Number(word);
      articleOnly = false;
      index += 1;
      continue;
    }

    if (SPOKEN_FRACTIONS[word] != null) {
      const value = SPOKEN_FRACTIONS[word];
      // "three quarters" multiplies, "one and a half" adds, and a bare "half"
      // or "a quarter" stands on its own.
      quantity = quantity == null || articleOnly ? value : sawAnd ? quantity + value : quantity * value;
      articleOnly = false;
      index += 1;
      continue;
    }

    if (ARTICLES.has(word)) {
      if (quantity == null) {
        quantity = 1;
        articleOnly = true;
      }
      index += 1;
      continue;
    }

    if (SPOKEN_NUMBERS[word] != null) {
      quantity = articleOnly || quantity == null ? SPOKEN_NUMBERS[word] : quantity + SPOKEN_NUMBERS[word];
      articleOnly = false;
      index += 1;
      continue;
    }

    if (word === 'and' && quantity != null && andContinuesANumber(words, index)) {
      sawAnd = true;
      index += 1;
      continue;
    }

    break;
  }

  // A unit can sit a couple of filler words away from its number, as in "three
  // quarters OF A cup". Skipping those is what lets the cup be read as the unit
  // rather than left in the food name.
  let unitIndex = index;
  while (unitIndex < words.length && FILLER_WORDS.has(words[unitIndex]) && SPOKEN_UNITS[words[unitIndex]] == null) {
    unitIndex += 1;
  }
  let unit = 'each';
  if (unitIndex < words.length && SPOKEN_UNITS[words[unitIndex]] != null) {
    unit = SPOKEN_UNITS[words[unitIndex]];
    index = unitIndex + 1;
  }

  const foodWords = words.slice(index).filter((word) => !FILLER_WORDS.has(word) && !PREP_WORDS.has(word));
  return {
    spokenText: spokenText.trim(),
    quantity: quantity ?? 1,
    unit,
    foodText: foodWords.join(' '),
  };
}

// A plain 0-to-1 overlap score between what was said and a candidate name.
// Deliberately not a fuzzy edit-distance library: a speech recognizer returns
// whole real words rather than typos, so the useful question is how much of
// the spoken phrase a candidate actually accounts for, not how many characters
// differ.
export function scoreNameMatch(spoken: string, candidateName: string): number {
  const spokenWords = stripCommas(normalizeSpokenText(spoken))
    .split(' ')
    .filter((word) => word && !FILLER_WORDS.has(word) && !PREP_WORDS.has(word));
  const candidateWords = stripCommas(normalizeSpokenText(candidateName)).split(' ').filter(Boolean);
  if (spokenWords.length === 0 || candidateWords.length === 0) return 0;

  const candidateSet = new Set(candidateWords);
  let matched = 0;
  for (const word of spokenWords) {
    if (candidateSet.has(word)) {
      matched += 1;
      continue;
    }
    // A spoken word contained in a longer candidate word, or the reverse,
    // still counts at a discount: "egg" against "eggs", "yogurt" against
    // "yogurt-based". Short words are excluded so a stray one cannot match
    // half the database.
    if (word.length >= 4 && candidateWords.some((candidate) => candidate.includes(word) || word.includes(candidate))) {
      matched += 0.75;
    }
  }
  const coverage = matched / spokenWords.length;
  // Slightly favour a candidate that is not padded with unrelated extra words,
  // so "Egg, whole, raw" beats "Egg noodles, enriched, cooked" for a spoken
  // "eggs".
  const concision = spokenWords.length / Math.max(candidateWords.length, spokenWords.length);
  return coverage * 0.85 + concision * 0.15;
}

// At or above this reads as a confident match. Below it a candidate is still
// shown, but never pre-selected, so a weak guess has to be accepted
// deliberately rather than slipping through on a fast tap.
export const CONFIDENT_MATCH_SCORE = 0.6;
