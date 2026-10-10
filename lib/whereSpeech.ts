// Spoken sentences for Store Its Location and Where Is It, 1.0.66.10
// (2026-10-10). Direct instruction: "they say for instance 'The bowling balls
// are in the hall closet.' or 'John's fishing poles are in the garage.' And
// then the same will be for where is it 'Where are the bowling balls?' or
// 'Where are the fishing poles?' ... We need to teach them this is the way to
// communicate with the app."
//
// So there is one shape to say each thing in, and both screens show it as the
// example: a thing, then is or are, then where. Saying it another common way
// (I put the keys in the drawer, keys in the drawer) works too, but the
// example is what is taught. Nothing here guesses past the words: a sentence
// with no place in it comes back as null and the screen says so, rather than
// storing half of it.
//
// Pure, so scripts/test_where_speech.js checks it in plain node.

export type StoredSentence = { what: string; place: string };

// Words that start a place. Longest first, so "on top of" wins over "on".
const PLACE_WORDS = [
  'in the back of',
  'at the back of',
  'in front of',
  'on top of',
  'next to',
  'underneath',
  'inside',
  'behind',
  'beside',
  'between',
  'under',
  'above',
  'below',
  'near',
  'into',
  'onto',
  'in',
  'on',
  'at',
  'by',
];
// Words that sit between the thing and the place: "are", "are kept", "is now".
const LINKS = [
  'are now kept in',
  'is now kept in',
  'are kept',
  'is kept',
  'are stored',
  'is stored',
  'are now',
  'is now',
  'are',
  'is',
  'were',
  'was',
  'go',
  'goes',
  'live',
  'lives',
  'stay',
  'stays',
  'sit',
  'sits',
  'belong',
  'belongs',
  "'s",
  "'re",
];
const PUT_STARTS = [
  'i have put',
  "i've put",
  'i just put',
  'i put',
  'i left',
  "i've left",
  'i stored',
  "i've stored",
  'i keep',
  'we keep',
  'we put',
  'put',
  'store',
  'keep',
];

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest first, so an alternation never stops at a shorter phrase that
// starts a longer one ("in" before "inside").
const alternation = (list: string[]) => [...list].sort((a, b) => b.length - a.length).map(escape).join('|');
const PLACE_ALT = alternation(PLACE_WORDS);
const LINK_ALT = alternation(LINKS);
const PUT_ALT = alternation(PUT_STARTS);

function tidy(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[.!?]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// "The bowling balls" reads as "Bowling balls"; "John's fishing poles" keeps
// John, since whose they are is the point.
function tidyThing(text: string): string {
  const bare = text.replace(/^(the|my|our|a|an|some|that|those|these)\s+/i, '').trim();
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

// "in the hall closet" is stored as "Hall closet"; any other place word stays,
// since "under the bed" means something "bed" does not.
function tidyPlace(placeWord: string, rest: string): string {
  const word = placeWord.toLowerCase();
  const keepWord = !['in', 'into', 'inside', 'at'].includes(word);
  const body = keepWord ? `${word} ${rest}` : rest.replace(/^(the|my|our)\s+/i, '');
  const trimmed = body.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function parseStoreSentence(spoken: string): StoredSentence | null {
  // "Remember that the tent is in the attic" is the tent sentence.
  const text = tidy(spoken).replace(/^(please\s+)?remember(\s+that)?\s+/i, '');
  if (!text) return null;

  // "I put the keys in the drawer", "Put the keys in the drawer".
  const put = new RegExp(`^(?:${PUT_ALT})\\s+(.+?)\\s+(${PLACE_ALT})\\s+(.+)$`, 'i').exec(text);
  if (put) return finish(put[1], put[2], put[3]);

  // "The bowling balls are in the hall closet", "The keys are kept on the hook".
  const linked = new RegExp(`^(.+?)(?:\\s+|(?='))(?:${LINK_ALT})\\s+(${PLACE_ALT})\\s+(.+)$`, 'i').exec(text);
  if (linked) return finish(linked[1], linked[2], linked[3]);

  // "Keys in the drawer", said without a verb.
  const bare = new RegExp(`^(.+?)\\s+(${PLACE_ALT})\\s+(.+)$`, 'i').exec(text);
  if (bare) return finish(bare[1], bare[2], bare[3]);

  return null;
}

function finish(thing: string, placeWord: string, rest: string): StoredSentence | null {
  const what = tidyThing(thing);
  const place = tidyPlace(placeWord, rest);
  if (what.length < 2 || place.length < 2) return null;
  return { what, place };
}

// "Where are the fishing poles?" asks about "fishing poles". A sentence that
// is not a where question comes back as it was said, so typing "batteries"
// into the same box keeps working.
const ASK_STARTS = [
  'where did i put',
  'where did we put',
  'where did i leave',
  'where did we leave',
  'where did i store',
  'where do i keep',
  'where do we keep',
  'where would i find',
  'where can i find',
  'where are',
  'where is',
  "where's",
  'where',
  'find',
  'look for',
];
const ASK_ALT = alternation(ASK_STARTS);

export function parseWhereQuestion(spoken: string): string {
  const text = tidy(spoken);
  const match = new RegExp(`^(?:${ASK_ALT})\\s+(.+)$`, 'i').exec(text);
  const thing = match ? match[1] : text;
  return thing
    .replace(/\s+(now|again|last|at the moment|right now)$/i, '')
    .replace(/^(the|my|our|a|an|some|that|those|these)\s+/i, '')
    .trim();
}

// What Where Is It says back to a spoken question, shown above the list and
// read aloud. One match is the answer, with how long ago it was written down,
// since the age is half of whether to trust it. Several matches are never
// guessed between: the person picks the one they meant from the list.
export type SpokenMatch = { what: string; place: string; age: string };

export function describeSpokenAnswer(asked: string, matches: SpokenMatch[]): string {
  const thing = asked.trim() || 'that';
  if (matches.length === 0) return `Nothing stored matches ${thing}. Store Its Location is where to say where it is.`;
  if (matches.length === 1) {
    const [only] = matches;
    return only.age ? `${only.what}: ${only.place}. Written down ${only.age}.` : `${only.what}: ${only.place}.`;
  }
  return `${matches.length} things match ${thing}. Pick the one you mean.`;
}
