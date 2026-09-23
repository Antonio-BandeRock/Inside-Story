// Where did I put it: searching for a thing by where it was left.
//
// 2026-09-23, phase 1 of the cross-app push. The question this answers gets
// asked out loud in every house several times a week, and this app already
// knows the answer for a surprising amount of it: a bag of stock bones went
// into a freezer, a spare filter went into a cupboard, garlic went into a
// bed. What was missing is anywhere to write down WHERE, and anywhere to ask.
//
// Deliberately not a lens. A search two taps deep is a search nobody uses,
// which was the whole objection to the feature as first written. So it is a
// column on kitchen_items, a destination in the capture inbox, one screen,
// and one top-level row on Home.
//
// THE RULE THAT SHAPES EVERYTHING BELOW: a stale location is worse than no
// location. Somebody who is told the batteries are in the hall cupboard,
// walks there, and finds nothing has been left worse off than somebody who
// was told nothing. So every answer carries how old it is, anything past a
// few months says out loud that it is worth checking, and confirming or
// correcting an answer is one tap on the answer itself.
//
// Pure on purpose: no database, no React, no colours, so every rule here can
// be checked in plain node (scripts/test_where_is_it.js) and so both the
// screen and the database module can read it without a cycle.

// Which record a hit came out of. Kitchen rows can be confirmed and moved
// from the results; the other two are read where they are.
export type PlaceRecordKind = 'kitchen' | 'note' | 'garden';

export type PlaceRecord = {
  // Prefixed by kind, so one id space covers three tables and an action can
  // route itself without a second field to carry around. Same shape
  // lib/kitchenDb.ts already uses across its three sources.
  id: string;
  kind: PlaceRecordKind;
  // The thing being looked for.
  what: string;
  // Where it was left, in the words the person used.
  place: string;
  // Whatever the source adds: how much is left, which bed it is in.
  detail: string | null;
  // ISO date the place was written down or last confirmed. This is what the
  // age is measured from, which is why it is separate from when the thing
  // itself arrived: confirming a location makes the ANSWER current again
  // without pretending the food is fresh.
  placedOn: string;
  // Whether Still there and I moved it apply. False for a garden planting,
  // which is moved by harvesting it, and for a capture note, whose words are
  // edited in the capture inbox where the rest of its history lives.
  editable: boolean;
};

// Long enough for "Second shelf of the chest freezer in the garage", short
// enough that this stays a place rather than becoming a paragraph.
export const PLACE_NAME_MAX = 60;

export function cleanPlaceName(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\s+/g, ' ').trim().slice(0, PLACE_NAME_MAX);
}

// One stray character is not a place. Two is enough for somebody who writes
// their freezer drawers as A1 and B2, which is a habit worth supporting.
export function isPlaceNameUsable(raw: string): boolean {
  return cleanPlaceName(raw).length >= 2;
}

// Lowercased, with punctuation flattened to spaces, so "Juan's" matches
// "juans" and "chest-freezer" matches "chest freezer". Accents are left
// alone rather than stripped: this app ships in Spanish, French, German and
// the Nordic languages, where folding them would merge words that differ.
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function searchWords(query: string): string[] {
  const normalized = normalizeForSearch(query);
  return normalized.length === 0 ? [] : normalized.split(' ');
}

// How well one record answers one query, or null when it does not answer it
// at all.
//
// EVERY word has to appear somewhere, which is what makes typing more words
// narrow the results rather than widen them. Where the word appears is what
// separates the hits: somebody typing "batteries" wants the batteries, not
// everything in the drawer the batteries are in, so a match on the thing
// outranks a match on the place. A match at the start of a word outranks one
// buried inside it, so "pea" finds peas before it finds chickpeas.
export function scorePlaceRecord(record: PlaceRecord, query: string): number | null {
  const words = searchWords(query);
  if (words.length === 0) return 0;
  const what = normalizeForSearch(record.what);
  const place = normalizeForSearch(record.place);
  const detail = record.detail ? normalizeForSearch(record.detail) : '';

  let total = 0;
  for (const word of words) {
    const best = Math.max(
      fieldScore(what, word, 10, 6),
      fieldScore(place, word, 4, 2),
      fieldScore(detail, word, 1, 1),
    );
    if (best === 0) return null;
    total += best;
  }
  return total;
}

function fieldScore(haystack: string, word: string, atWordStart: number, anywhere: number): number {
  if (!haystack) return 0;
  const index = haystack.indexOf(word);
  if (index < 0) return 0;
  if (index === 0 || haystack[index - 1] === ' ') return atWordStart;
  return anywhere;
}

export type PlaceHit = { record: PlaceRecord; score: number };

// The answers, best first. An empty query is a listing rather than a refusal:
// opening the screen and seeing everything that has a place written down is
// how somebody discovers the feature holds anything at all.
//
// Ties go to whichever was written down or confirmed most recently, since
// between two equally good answers the fresher one is likelier to still be
// true.
export function searchPlaces(records: PlaceRecord[], query: string): PlaceHit[] {
  const hits: PlaceHit[] = [];
  for (const record of records) {
    const score = scorePlaceRecord(record, query);
    if (score == null) continue;
    hits.push({ record, score });
  }
  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.record.placedOn !== b.record.placedOn) return a.record.placedOn < b.record.placedOn ? 1 : -1;
    return a.record.what.localeCompare(b.record.what);
  });
  return hits;
}

// How much trust the answer beside it has earned.
//
// The boundaries are working thresholds rather than anything measured, which
// is why the sentence they produce names the age itself instead of asking to
// be believed. Somebody reading "5 months ago" can weigh that against what
// they know about their house better than any figure here can.
export type PlaceConfidence = 'fresh' | 'aging' | 'stale';

export function placeConfidence(placedOn: string, today: string): PlaceConfidence {
  const days = daysBetween(placedOn, today);
  if (days == null) return 'stale';
  if (days < 30) return 'fresh';
  if (days < 120) return 'aging';
  return 'stale';
}

function daysBetween(from: string, to: string): number | null {
  const start = Date.parse(`${from.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${to.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / 86400000);
}

// When it was put there, said the way somebody would say it.
export function describePlaceAge(placedOn: string, today: string): string {
  const days = daysBetween(placedOn, today);
  if (days == null) return '';
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

// The caption under a result: where, and how long ago that was written down.
export function describePlaceLine(record: PlaceRecord, today: string): string {
  const age = describePlaceAge(record.placedOn, today);
  return age ? `${record.place} · ${age}` : record.place;
}

// The warning on an answer old enough to have gone wrong, or null when there
// is nothing to warn about. Only ever a prompt to look, never a claim that
// the thing has moved: nothing in this app watches a cupboard.
export function stalePrompt(confidence: PlaceConfidence): string | null {
  if (confidence === 'stale') return 'Written down a while ago. Worth checking before you count on it.';
  if (confidence === 'aging') return 'A few months old.';
  return null;
}

// The places already in use, most recently used first, for offering as chips
// so "Chest freezer" is one tap the second time rather than typed again.
// Deduped case-insensitively, keeping the spelling of the most recent use,
// because somebody who starts writing "chest freezer" in lower case should
// not end up with two of them.
export function suggestPlaces(records: PlaceRecord[], limit = 6): string[] {
  const byRecent = [...records].sort((a, b) => (a.placedOn < b.placedOn ? 1 : a.placedOn > b.placedOn ? -1 : 0));
  const seen = new Set<string>();
  const places: string[] = [];
  for (const record of byRecent) {
    const key = normalizeForSearch(record.place);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    places.push(record.place);
    if (places.length >= limit) break;
  }
  return places;
}

// What the screen says when a search finds nothing. Two different situations
// and two different sentences: an empty store needs telling how to fill it,
// and a full store that missed needs telling how to search it better.
export function describeNoResults(query: string, totalRecords: number): string {
  if (totalRecords === 0) {
    return 'Nothing has a place written down yet. Add one to a kitchen item, or throw a note into Capture and sort it to Where it is.';
  }
  const words = searchWords(query);
  if (words.length === 0) return '';
  return 'Nothing matching that. Try part of the word, or the name of the place instead of the thing.';
}

// The one line the Home row shows without being opened. It says how much is
// findable rather than naming anything, since the row sits on a page somebody
// else can be looking over a shoulder at.
export function describeWhereIsItRow(totalRecords: number): string {
  if (totalRecords === 0) return 'Nothing has a place written down yet.';
  if (totalRecords === 1) return '1 thing has a place written down.';
  return `${totalRecords} things have a place written down.`;
}
