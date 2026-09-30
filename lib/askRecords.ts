// Ask a question of your records (C22 in the competitive build plan,
// 2026-09-30). A box on Home where somebody types a question the way they
// would say it, "what did I eat before my last flare" or "where did I put
// the spare batteries", and gets back the one to three places in the app
// that can show the answer.
//
// It answers nothing itself. Fixed rules read the words and send the
// question on: to Pattern Finder, to a Trends lens, to Where Is It, or to
// Search Reading. That keeps every answer the one the destination already
// gives, with the denominators and limits it already states, and nothing
// here can phrase a finding about the person. A model behind the box is a
// separate item (Z3) and would have to stay on the device.
//
// No I/O and no React, so scripts/test_ask_records.js checks it directly.

export type AskTarget =
  | { kind: 'trends'; lens: string; range?: 'thisWeek' }
  | { kind: 'whereIsIt'; query: string }
  | { kind: 'reading'; query: string };

export type AskAnswer = {
  /** The place, as its screen names it. */
  label: string;
  /** One line on what it will show for this question. */
  caption: string;
  target: AskTarget;
};

/** At most this many places for one question. */
export const ASK_MAX_ANSWERS = 3;

type TrendsRule = { lens: string; label: string; caption: string; words: RegExp };

// Word starts rather than whole words, so "flares", "flaring" and "flared"
// all land. Order matters only as a tie-break: a question matching two
// rules equally lists the earlier first.
const TRENDS_RULES: TrendsRule[] = [
  {
    lens: 'symptoms',
    label: 'Trends: Symptoms & Flares',
    caption: 'Your symptoms and flares over the range you pick.',
    words: /\b(symptom|flare|pain|ache|hurt|fatigue|tired|bloat|headache|migraine|nause|rash|itch|cramp|brain fog|fog)/,
  },
  {
    lens: 'variety',
    label: 'Trends: What You Eat',
    caption: 'What you ate, food by food, over the range you pick.',
    words: /\b(eat|ate|eaten|meal|food|breakfast|lunch|dinner|snack|diet)/,
  },
  {
    lens: 'nutrients',
    label: 'Trends: Nutrients',
    caption: 'Each nutrient against its target, day by day.',
    words: /\b(nutrient|vitamin|mineral|iron|zinc|selenium|iodine|magnesium|calcium|protein|fib(er|re)|sodium|potassium|b12|folate|omega|calorie)/,
  },
  {
    lens: 'weight',
    label: 'Trends: Weight',
    caption: 'Your weight readings and your usual range.',
    words: /\b(weigh|kilo|kg\b|pound|lbs?\b|bmi)/,
  },
  {
    lens: 'nights',
    label: 'Trends: Nights',
    caption: 'How you slept, night by night.',
    words: /\b(sleep|slept|night|insomnia|nap|bed ?time|woke|wake)/,
  },
  {
    lens: 'labs',
    label: 'Trends: Labs',
    caption: 'Your lab results over time.',
    words: /\b(lab|test result|blood test|tsh|t3|t4|antibod|tpo|a1c|hba1c|cholesterol|ferritin|crp|egfr|creatinine|uric)/,
  },
  {
    lens: 'bloodPressure',
    label: 'Trends: Blood Pressure',
    caption: 'Your blood pressure readings.',
    words: /\b(blood pressure|bp\b|systolic|diastolic|pulse|heart rate)/,
  },
  {
    lens: 'hydration',
    label: 'Trends: Hydration',
    caption: 'How much you drank, day by day.',
    words: /\b(water|drink|drank|hydrat|fluid)/,
  },
  {
    lens: 'movement',
    label: 'Trends: Movement',
    caption: 'Steps and movement over the range you pick.',
    words: /\b(step|walk|mov(e|ing|ement)|active|activity)/,
  },
  {
    lens: 'workouts',
    label: 'Trends: Workouts',
    caption: 'The workouts you logged.',
    words: /\b(workout|exercis|gym|run|ran|lift|yoga|swim|cycl|train)/,
  },
  {
    lens: 'doses',
    label: 'Trends: Doses Over Time',
    caption: 'Doses taken and skipped over time.',
    words: /\b(dose|medic|pill|tablet|supplement|levothyrox|took my|take my|taken|skipped)/,
  },
  {
    lens: 'therapyResponse',
    label: 'Trends: Therapy Response',
    caption: 'How things looked before and after a treatment started or changed.',
    words: /\b(therap|treatment|since (i )?(start|began|switch)|new med|changed (my )?dose)/,
  },
  {
    lens: 'reactions',
    label: 'Trends: Reactions & New Foods',
    caption: 'Reactions you logged and foods you tried for the first time.',
    words: /\b(reaction|allerg|new food|first time|react)/,
  },
  {
    lens: 'care',
    label: 'Trends: Appointments & Care',
    caption: 'Appointments and care over time.',
    words: /\b(appointment|doctor|visit|clinic|specialist|dentist|therapist)/,
  },
  {
    lens: 'cost',
    label: 'Trends: What It Costs',
    caption: 'What you recorded spending, by area.',
    words: /\b(cost|spend|spent|money|paid|pay|bill|expens|budget)/,
  },
  {
    lens: 'groceries',
    label: 'Trends: Grocery Prices',
    caption: 'The prices you recorded paying, item by item.',
    words: /\b(price|grocer|store|shop)/,
  },
  {
    lens: 'harvest',
    label: 'Trends: Garden Yield',
    caption: 'What your garden gave, crop by crop.',
    words: /\b(harvest|yield|garden|crop|pick(ed)?\b|grew|grow)/,
  },
  {
    lens: 'keepingUp',
    label: 'Trends: Keeping Up',
    caption: 'Routines and upkeep you marked done.',
    words: /\b(routine|upkeep|chore|did i do|remember to|habit)/,
  },
  {
    lens: 'work',
    label: 'Trends: Work',
    caption: 'Your work check-ins over time.',
    words: /\b(work|job|shift|office)/,
  },
  {
    lens: 'ferments',
    label: 'Trends: Ferments',
    caption: 'Your ferments and batches.',
    words: /\b(ferment|kombucha|kefir|sauerkraut|kimchi|yogh?urt|batch)/,
  },
  {
    lens: 'eatingWindow',
    label: 'Trends: Eating Window',
    caption: 'When your first and last meals of the day fell.',
    words: /\b(fast(ing)?\b|eating window|first meal|last meal|late meal|what time i eat)/,
  },
];

// A question about what came before or after something, or what might be
// behind it, is Pattern Finder's question.
const PATTERN_WORDS =
  /\b(before|after|trigger|caus|because|why (do|did|am|does)|what makes|linked|connect|pattern|correlat|follow|lead(s)? to|set(s)? off|worse (when|after)|better (when|after))/;

const WHERE_WORDS = /^(where('?s| is| are| did i (put|leave|keep|store)| do i keep| have i put)|find my|looking for my)\b/;

// Questions about the world rather than about the person's records.
const READING_WORDS =
  /^(what (is|are|does)|how (does|do|is|much|many)|is (it|there|a|an)|are there|can (i|you)|should|why (is|are|does)|tell me about|explain)\b/;

const THIS_WEEK_WORDS = /\b(this week|past week|last (seven|7) days|last week)\b/;

const STOP_WORDS = new Set(
  'a an the my me i is are was were do does did of to in on for with and or it its this that these those what which who how why when where can could should would will about tell explain there any some much many have has had be been being you your'.split(
    ' ',
  ),
);

export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[?!.,;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The words worth searching on, question words and small words dropped. */
export function searchWords(text: string): string {
  return normalizeQuestion(text)
    .split(' ')
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word.replace(/'s$/, '')))
    .join(' ');
}

/** The thing being looked for in a "where did I put" question. */
export function whereQuery(text: string): string {
  const normalized = normalizeQuestion(text).replace(WHERE_WORDS, '').trim();
  return searchWords(normalized);
}

/**
 * The places that can answer `question`, most likely first, never more
 * than ASK_MAX_ANSWERS. Empty only for an empty question.
 */
export function routeQuestion(question: string): AskAnswer[] {
  const text = normalizeQuestion(question);
  if (!text) return [];
  const answers: AskAnswer[] = [];
  const range = THIS_WEEK_WORDS.test(text) ? ('thisWeek' as const) : undefined;

  if (WHERE_WORDS.test(text)) {
    const query = whereQuery(text);
    answers.push({
      label: 'Where Is It',
      caption: query ? `Everywhere you have noted a place for "${query}".` : 'Everywhere you have noted a place for something.',
      target: { kind: 'whereIsIt', query },
    });
  }

  const matched = TRENDS_RULES.filter((rule) => rule.words.test(text));
  if (PATTERN_WORDS.test(text) && matched.length > 0) {
    answers.push({
      label: 'Trends: Pattern Finder',
      caption: 'What tends to turn up before your flares, counted against an ordinary stretch of days.',
      target: { kind: 'trends', lens: 'patterns' },
    });
  }
  for (const rule of matched) {
    answers.push({ label: rule.label, caption: rule.caption, target: { kind: 'trends', lens: rule.lens, range } });
  }

  const words = searchWords(text);
  const aboutTheWorld = READING_WORDS.test(text) && !/\b(my|i|me)\b/.test(text);
  const reading: AskAnswer = {
    label: 'Search Reading',
    caption: words ? `The reading that mentions "${words}".` : 'Everything there is to read in the app.',
    target: { kind: 'reading', query: words },
  };
  // A question about the world leads with the reading; one about the
  // person's records gets it only as the last place to look.
  if (aboutTheWorld) answers.unshift(reading);
  else answers.push(reading);

  const seen = new Set<string>();
  return answers
    .filter((answer) => {
      if (seen.has(answer.label)) return false;
      seen.add(answer.label);
      return true;
    })
    .slice(0, ASK_MAX_ANSWERS);
}
